/** The browser entry: the renderer registrations, the injected props, and its failures. */
import type { Context } from '@deepseek-ai/cordis'
import { describe, expect, it, vi } from 'vitest'
import { AnnotatorBody } from '../src/client/AnnotatorBody'
import { LazyPdfBody } from '../src/client/LazyPdfBody'
import { BODY_ID, HTML_BODY_ID, MD_BODY_ID, PDF_BODY_ID, apply, inject, name } from '../src/client/index'
import { RULE_ID, annotationRule } from '../src/client/annotation-rule'
import { AnnotationCard } from '../src/client/annotation-card'
import { MarkdownBody } from '../src/client/markdown/MarkdownBody'
import { NAMESPACE, en, zh } from '../src/client/locales'
import { missingService } from '../src/missing-service'
import { defined } from './dom'

/** One renderer definition the stub registry was asked to add. */
interface StubDefinition {
  readonly id: string
  readonly extensions: readonly string[]
  readonly binaryExtensions?: readonly string[]
  readonly priority?: string
  readonly title: () => string
  readonly loading: string
  readonly wrap?: boolean
}

/** One slot registration the stub registry was asked to add. */
interface StubSlot {
  readonly options: Record<string, unknown>
  readonly component: unknown
}

/** A client context stub that records the three registrations. */
function stubContext(options: {
  readonly omit?: readonly string[]
  readonly localeId?: string | undefined
  readonly sessions?: unknown
  readonly fileUpload?: unknown
  readonly sidebarRight?: unknown
} = {}): {
  readonly ctx: Context
  readonly definitions: StubDefinition[]
  readonly slots: StubSlot[]
  readonly dictionaries: Record<string, unknown>[]
  readonly injectedKeys: string[]
  readonly disposed: string[]
  readonly rules: unknown[]
} {
  const omitted = new Set(options.omit ?? [])
  const definitions: StubDefinition[] = []
  const slots: StubSlot[] = []
  const dictionaries: Record<string, unknown>[] = []
  const injectedKeys: string[] = []
  const disposed: string[] = []
  const rules: unknown[] = []
  const services: Record<string, unknown> = {
    locale: {
      register: (namespace: string, dicts: Record<string, unknown>) => {
        dictionaries.push({ namespace, ...dicts })
        return () => { disposed.push('dictionaries') }
      },
      bind: (namespace: string) => (key: string) => `${namespace}.${key}`,
      getLocale: () => (options.localeId === undefined ? {} : { locale: options.localeId }),
    },
    documentPreviews: {
      register: (definition: StubDefinition) => {
        definitions.push(definition)
        return () => { disposed.push('renderer') }
      },
    },
    slots: {
      inject: (key: string, callback: () => () => void) => {
        injectedKeys.push(key)
        return callback()
      },
      register: (slotOptions: Record<string, unknown>, component: unknown) => {
        slots.push({ options: slotOptions, component })
        return () => { disposed.push('body') }
      },
    },
    sessions: options.sessions,
    fileUpload: options.fileUpload,
    sidebarRight: options.sidebarRight,
    uiConversation: {
      userText: {
        register: (rule: unknown) => {
          rules.push(rule)
          return () => { disposed.push('rule') }
        },
      },
    },
  }
  /** The slice a child fiber reads through, over the same service table. */
  const scope = {
    get: (key: string) => services[key],
    effect: (factory: () => (() => void) | undefined) => factory() ?? (() => {}),
  }
  const ctx = {
    get: (key: string) => (omitted.has(key) ? undefined : services[key]),
    effect: (factory: () => (() => void) | undefined) => factory() ?? (() => {}),
    // A child fiber runs only once every service it names is there, which is the
    // one behaviour of the real context that the optional half of this entry needs.
    inject: (deps: readonly string[], callback: (child: unknown) => void) => {
      const ready = deps.every(dep => !omitted.has(dep) && services[dep] !== undefined)
      if (ready) callback(scope)
      return () => {}
    },
  } as unknown as Context
  return { ctx, definitions, slots, dictionaries, injectedKeys, disposed, rules }
}

describe('browser entry', () => {
  it('is named after the package and declares its three hard services', () => {
    expect(name).toBe('dsh-figmark-client')
    expect(inject).toEqual(['slots', 'locale', 'documentPreviews'])
  })

  it('registers both dictionaries, every renderer kind, and every body', () => {
    const stub = stubContext()
    apply(stub.ctx)
    expect(stub.dictionaries).toEqual([{ namespace: NAMESPACE, zh, en }])
    expect(stub.definitions).toHaveLength(4)
    expect(stub.definitions[0]).toMatchObject({
      id: BODY_ID,
      priority: 'extension',
      loading: 'bytes-complete',
      wrap: false,
    })
    expect(stub.definitions[0]?.extensions).toContain('svg')
    expect(stub.definitions[0]?.extensions).toContain('png')
    expect(stub.definitions[0]?.binaryExtensions).toContain('png')
    expect(stub.definitions[0]?.binaryExtensions).not.toContain('svg')
    // An extension-band PDF renderer is what keeps the shell's read-only preview
    // as the fallback in the renderer dropdown rather than the only option.
    expect(stub.definitions[1]).toMatchObject({
      id: PDF_BODY_ID,
      extensions: ['pdf'],
      binaryExtensions: ['pdf'],
      priority: 'extension',
      loading: 'bytes-complete',
      wrap: false,
    })
    // Markdown is a text-pages implementation: the owner hands it the source as
    // it reads it, and the body edits that text without ever writing the file.
    expect(stub.definitions[2]).toMatchObject({
      id: MD_BODY_ID,
      extensions: ['md', 'markdown'],
      priority: 'extension',
      loading: 'text-pages',
      wrap: true,
    })
    // A rendered document is annotatable at the same rank as the rest: the shell's
    // read-only HTML preview stays available as the fallback in the dropdown.
    expect(stub.definitions[3]).toMatchObject({
      id: HTML_BODY_ID,
      extensions: ['html', 'htm'],
      priority: 'extension',
      loading: 'bytes-complete',
      wrap: false,
    })
    expect(stub.injectedKeys).toEqual([
      'sidebar.right.tab.document', 'sidebar.right.tab.document',
      'sidebar.right.tab.document', 'sidebar.right.tab.document',
      'conversation.user.text.node',
    ])
    expect(stub.slots[2]?.options).toMatchObject({
      name: 'sidebar.right.tab.document',
      key: MD_BODY_ID,
      locale: NAMESPACE,
    })
    expect(stub.slots[2]?.component).toBe(MarkdownBody)
    expect(stub.slots[0]?.options).toMatchObject({
      name: 'sidebar.right.tab.document',
      key: BODY_ID,
      locale: NAMESPACE,
    })
    expect(stub.slots[0]?.component).toBe(AnnotatorBody)
    expect(stub.slots[1]?.options).toMatchObject({
      name: 'sidebar.right.tab.document',
      key: PDF_BODY_ID,
      locale: NAMESPACE,
    })
    expect(stub.slots[1]?.component).toBe(LazyPdfBody)
    expect(stub.slots[3]?.options).toMatchObject({
      name: 'sidebar.right.tab.document',
      key: HTML_BODY_ID,
      locale: NAMESPACE,
    })
    expect(stub.slots[3]?.component).toBe(AnnotatorBody)
  })

  it('lets the registry ask for each renderer title in the active locale', () => {
    const stub = stubContext()
    apply(stub.ctx)
    expect(stub.definitions[0]?.title()).toBe(`${NAMESPACE}.title`)
    expect(stub.definitions[1]?.title()).toBe(`${NAMESPACE}.pdfTitle`)
    expect(stub.definitions[2]?.title()).toBe(`${NAMESPACE}.mdTitle`)
    expect(stub.definitions[3]?.title()).toBe(`${NAMESPACE}.htmlTitle`)
  })

  it('injects the session face, the session id, and the active locale id', () => {
    const sessions = { scope: () => undefined }
    const stub = stubContext({ localeId: 'en-US', sessions })
    apply(stub.ctx)
    const factory = stub.slots[0]?.options['inject']
    expect(typeof factory).toBe('function')
    const injected = (factory as (id: unknown) => unknown)(123)
    expect(injected).toEqual({ sessions, sessionId: '123', localeId: 'en-US' })
  })

  it('hands the HTML body its session face and nothing it does not read', () => {
    const sessions = { scope: () => undefined }
    const stub = stubContext({ sessions })
    apply(stub.ctx)
    const factory = stub.slots[3]?.options['inject'] as (id: unknown) => unknown
    // One surface, one marks file: the body reads, writes and delivers it itself,
    // so it needs neither the upload service nor a page owner's seat.
    expect(factory('s1')).toEqual({ sessions, sessionId: 's1', localeId: 'zh' })
  })

  it('hands the Markdown editor the upload service a long difference needs', () => {
    const sessions = { scope: () => undefined }
    const fileUpload = { upload: () => undefined }
    const stub = stubContext({ sessions, fileUpload })
    apply(stub.ctx)
    const factory = stub.slots[2]?.options['inject'] as (id: unknown) => unknown
    expect(factory(7)).toEqual({ sessions, fileUpload, sessionId: '7', localeId: 'zh' })
  })

  it('leaves the Markdown editor without an upload service the composition omits', () => {
    const stub = stubContext()
    apply(stub.ctx)
    const factory = stub.slots[2]?.options['inject'] as (id: unknown) => { fileUpload: unknown }
    expect(factory('s1').fileUpload).toBeUndefined()
  })

  it('hands the PDF chunk the seats it cannot import from this bundle', () => {
    const stub = stubContext()
    apply(stub.ctx)
    const factory = stub.slots[1]?.options['inject'] as (id: unknown) => { AnnotatorBody: unknown; seat: Record<string, unknown> }
    // The chunk cannot import its own package's entry bundle, so the component it
    // mounts per page, and the seat that reads, writes and delivers the document,
    // arrive through the injection rather than through an import.
    const injected = factory('s1')
    expect(injected.AnnotatorBody).toBe(AnnotatorBody)
    expect(Object.keys(injected.seat).sort()).toEqual(['compose', 'discard', 'draft', 'load', 'save', 'send'])
  })

  it('builds the seat in the active locale, so a sent document speaks it', async () => {
    const calls: string[] = []
    const prompts: unknown[][] = []
    vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
      calls.push(`${init?.method ?? 'GET'} ${url}`)
      return { json: async () => ({ ok: true, annotationPath: '/w/a.annot.json', reviewPath: null }), status: 200 }
    })
    const sessions = {
      scope: () => ({ live: true }),
      sessionOf: () => ({ prompt: async (content: readonly unknown[]) => { prompts.push([...content]); return { ok: true } } }),
    }
    const stub = stubContext({ localeId: 'en-GB', sessions })
    apply(stub.ctx)
    const factory = stub.slots[1]?.options['inject'] as (id: unknown) => { seat: { send: (input: unknown, saved: unknown, pages: unknown, pdf: unknown) => Promise<readonly string[]> } }
    const seat = factory('s1').seat
    const document_ = {
      figure: { address: 'a', path: '/w/report.pdf', mediaType: 'application/pdf', sha256: 'a'.repeat(64), pageCount: 2 },
      marks: [{ id: 'm1', kind: 'rect', color: '#1971c2', points: [[1, 2], [3, 4]], page: 1 }],
      summary: '',
      createdAt: null,
    }
    const warnings = await seat.send(document_, { annotationPath: '/w/a.annot.json', reviewPath: null }, [], new Uint8Array([1]))
    // The seat speaks the locale the slot was mounted under, and the composition
    // here provides no upload service.
    expect(warnings).toEqual(['This composition has no upload service, so the annotated PDF was not attached.'])
    expect(calls).toEqual([])
    const parts = (prompts[0] ?? []) as { readonly text?: string }[]
    expect(defined(parts[0]).text).toContain('[figure annotations]')
    vi.unstubAllGlobals()
  })

  it('falls back to Chinese when the locale service reports no active locale', () => {
    const stub = stubContext()
    apply(stub.ctx)
    const factory = stub.slots[0]?.options['inject'] as (id: unknown) => { localeId: string }
    expect(factory('s1').localeId).toBe('zh')
  })

  it('reports an absent session service as undefined rather than guessing', () => {
    const stub = stubContext()
    apply(stub.ctx)
    const factory = stub.slots[0]?.options['inject'] as (id: unknown) => { sessions: unknown }
    expect(factory('s1').sessions).toBeUndefined()
  })

  it('registers the reader\'s own block and the card that draws it behind the conversation', () => {
    const stub = stubContext()
    apply(stub.ctx)
    // The rule is what finds the block in a message; the slot entry is what draws it,
    // keyed by the same id so the transcript's entry key resolves to this renderer.
    expect(stub.rules).toEqual([annotationRule])
    const card = stub.slots[4]
    expect(card?.options).toMatchObject({
      name: 'conversation.user.text.node',
      key: RULE_ID,
      locale: NAMESPACE,
    })
    expect(card?.component).toBe(AnnotationCard)
  })

  it('hands the card the Session it draws in and nothing it does not read', () => {
    const stub = stubContext({ localeId: 'en-US' })
    apply(stub.ctx)
    const factory = stub.slots[4]?.options['inject'] as (id: unknown) => {
      readonly sessionId: string
      readonly localeId: string
      readonly open: (path: string) => void
    }
    const injected = factory('s7')
    expect(Object.keys(injected).sort()).toEqual(['localeId', 'open', 'sessionId'])
    expect(injected.sessionId).toBe('s7')
    expect(injected.localeId).toBe('en-US')
  })

  it('opens the annotated figure as a Session file the Sidebar can place', () => {
    const opened: string[] = []
    const stub = stubContext({ sidebarRight: { openResource: (address: string) => { opened.push(address) } } })
    apply(stub.ctx)
    const factory = stub.slots[4]?.options['inject'] as (id: unknown) => { open: (path: string) => void }
    factory('s1').open('/w/fig.svg')
    // A Session-relative address, because that is the only kind the document panel
    // resolves: an absolute one is refused before it can be placed in a column.
    expect(opened).toEqual(['dsh-resource://file/session/s1//w/fig.svg'])
  })

  it('shows the card without a Sidebar rather than failing the bubble', () => {
    const stub = stubContext()
    apply(stub.ctx)
    const factory = stub.slots[4]?.options['inject'] as (id: unknown) => { open: (path: string) => void }
    // Nothing to click through to is not an error: the card still says what it is.
    expect(() => { factory('s1').open('/w/fig.svg') }).not.toThrow()
  })

  it('keeps a refusal to open out of the transcript', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const stub = stubContext({ sidebarRight: { openResource: () => { throw new Error('no mounted session') } } })
    apply(stub.ctx)
    const factory = stub.slots[4]?.options['inject'] as (id: unknown) => { open: (path: string) => void }
    expect(() => { factory('s1').open('/w/fig.svg') }).not.toThrow()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('draws nothing into the transcript when the conversation package is absent', () => {
    const stub = stubContext({ omit: ['uiConversation'] })
    apply(stub.ctx)
    // A figure is still annotatable without the conversation package; the block
    // simply stays text, which is what a message with no rule renders as.
    expect(stub.rules).toEqual([])
    expect(stub.slots).toHaveLength(4)
  })

  it.each(['locale', 'documentPreviews', 'slots'])('fails loudly without the %s service', (service) => {
    const stub = stubContext({ omit: [service] })
    expect(() => { apply(stub.ctx) }).toThrow(missingService(service))
  })
})
