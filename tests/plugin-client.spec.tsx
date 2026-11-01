/** The browser entry: the renderer registrations, the injected props, and its failures. */
import type { Context } from '@deepseek-ai/cordis'
import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { AnnotatorBody } from '../src/client/AnnotatorBody'
import { LazyPdfBody } from '../src/client/LazyPdfBody'
import {
  BODY_ID, HTML_BODY_ID, PDF_BODY_ID, SERVICE_BODY_ID, SERVICE_KIND, apply, inject, name,
} from '../src/client/index'
import { HtmlPreviewBody } from '../src/client/html-preview'
import { RULE_ID, annotationRule } from '../src/client/annotation-rule'
import { AnnotationCard } from '../src/client/annotation-card'
import { NAMESPACE, en, zh } from '../src/client/locales'
import { ServiceBrowser } from '../src/client/ServiceBrowser'
import { ServiceGuideIcon } from '../src/client/service-guide-icon'
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

/** One right-sidebar tab definition the stub registry was asked to add. */
interface StubSidebarTab {
  readonly id: string
  readonly kind: string
  readonly priority?: string
  readonly title: () => string
  readonly guide?: readonly {
    readonly id: string
    readonly order?: number
    readonly title: () => string
    readonly description?: () => string
    readonly icon?: unknown
  }[]
}

/** A client context stub that records the three registrations. */
function stubContext(options: {
  readonly omit?: readonly string[]
  readonly localeId?: string | undefined
  readonly sessions?: unknown
  readonly sidebarRight?: unknown
} = {}): {
  readonly ctx: Context
  readonly definitions: StubDefinition[]
  readonly slots: StubSlot[]
  readonly sidebarTabs: StubSidebarTab[]
  readonly dictionaries: Record<string, unknown>[]
  readonly injectedKeys: string[]
  readonly disposed: string[]
  readonly rules: unknown[]
  readonly effects: (() => void)[]
  readonly redeclare: () => void
} {
  const omitted = new Set(options.omit ?? [])
  const definitions: StubDefinition[] = []
  const slots: StubSlot[] = []
  const sidebarTabs: StubSidebarTab[] = []
  const dictionaries: Record<string, unknown>[] = []
  const injectedKeys: string[] = []
  const disposed: string[] = []
  const rules: unknown[] = []
  const effects: (() => void)[] = []
  /** The callback each `slots.inject` registered, newest last. */
  const injections: { readonly key: string; readonly run: () => () => void }[] = []
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
    sidebarRightTabs: {
      register: (definition: StubSidebarTab) => {
        sidebarTabs.push(definition)
        return () => { disposed.push('sidebar-tab') }
      },
    },
    slots: {
      inject: (key: string, callback: () => () => void) => {
        injectedKeys.push(key)
        injections.push({ key, run: callback })
        return callback()
      },
      register: (slotOptions: Record<string, unknown>, component: unknown) => {
        slots.push({ options: slotOptions, component })
        return () => { disposed.push('body') }
      },
    },
    sessions: options.sessions,
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
  const ctx = {
    get: (key: string) => (omitted.has(key) ? undefined : services[key]),
    effect: (factory: () => (() => void) | undefined) => {
      const stop = factory() ?? (() => {})
      effects.push(stop)
      return stop
    },
  } as unknown as Context
  /** Re-declare the slot the last injection waits for, so its callback runs a second time. */
  const redeclare = (): void => {
    const last = injections[injections.length - 1]
    if (last === undefined) throw new Error('nothing was injected')
    last.run()
  }
  return {
    ctx, definitions, slots, sidebarTabs, dictionaries, injectedKeys, disposed, rules, effects, redeclare,
  }
}

describe('browser entry', () => {
  it('is named after the package and declares its four hard services', () => {
    expect(name).toBe('dsh-figmark-client')
    expect(inject).toEqual(['slots', 'locale', 'documentPreviews', 'sidebarRightTabs'])
  })

  it('registers both dictionaries, the renderer kinds, and every body', () => {
    const stub = stubContext()
    apply(stub.ctx)
    expect(stub.dictionaries).toEqual([{ namespace: NAMESPACE, zh, en }])
    expect(stub.definitions).toHaveLength(3)
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
    // HTML keeps its inline preview without entering the annotator: only a page
    // already served over loopback gets the tools, through the local-pages tab.
    expect(stub.definitions[2]).toMatchObject({
      id: HTML_BODY_ID,
      extensions: ['html', 'htm'],
      priority: 'extension',
      loading: 'bytes-complete',
      wrap: false,
    })
    expect(stub.definitions[2]?.binaryExtensions).toBeUndefined()
    expect(stub.injectedKeys).toEqual([
      'sidebar.right.tab.document',
      'sidebar.right.pane.tab',
      'sidebar.right.tab.document',
      'sidebar.right.tab.document',
      'conversation.user.text.node',
      'conversation.input.dock',
    ])
    expect(stub.slots[0]?.options).toMatchObject({
      name: 'sidebar.right.tab.document',
      key: BODY_ID,
      locale: NAMESPACE,
    })
    expect(stub.slots[0]?.component).toBe(AnnotatorBody)
    expect(stub.slots[2]?.options).toMatchObject({
      name: 'sidebar.right.tab.document',
      key: PDF_BODY_ID,
      locale: NAMESPACE,
    })
    expect(stub.slots[2]?.component).toBe(LazyPdfBody)
    expect(stub.slots[1]?.options).toMatchObject({
      name: 'sidebar.right.pane.tab',
      key: SERVICE_BODY_ID,
      locale: NAMESPACE,
    })
    expect(stub.slots[1]?.component).toBe(ServiceBrowser)
    expect(stub.slots[3]?.options).toMatchObject({
      name: 'sidebar.right.tab.document',
      key: HTML_BODY_ID,
      locale: NAMESPACE,
    })
    expect(stub.slots[3]?.component).toBe(HtmlPreviewBody)
  })

  it('offers local pages as a first-class right-sidebar tab', () => {
    const stub = stubContext()
    apply(stub.ctx)
    expect(stub.sidebarTabs).toHaveLength(1)
    expect(stub.sidebarTabs[0]).toMatchObject({
      id: SERVICE_BODY_ID,
      kind: SERVICE_KIND,
      priority: 'extension',
    })
    expect(stub.sidebarTabs[0]?.title()).toBe(`${NAMESPACE}.serviceTitle`)
    const guide = defined(stub.sidebarTabs[0]?.guide?.[0])
    expect(guide.id).toBe('services')
    expect(guide.order).toBe(20)
    expect(guide.title()).toBe(`${NAMESPACE}.serviceTitle`)
    expect(guide.description?.()).toBe(`${NAMESPACE}.serviceHint`)
    expect(guide.icon).toBe(ServiceGuideIcon)
    const defaultGlyph = renderToStaticMarkup(<ServiceGuideIcon />)
    expect(defaultGlyph).toContain('width="36"')
    expect(defaultGlyph).toContain('height="36"')
    expect(defaultGlyph).toContain('viewBox="0 0 36 36"')
    expect(defaultGlyph).toContain('stroke="#658EFF"')
    expect(defaultGlyph).toContain('stroke="#539CFA"')
    const hostGlyph = renderToStaticMarkup(<ServiceGuideIcon size={26} className="guide-icon" />)
    expect(hostGlyph).toContain('width="26"')
    expect(hostGlyph).toContain('class="guide-icon"')
  })

  it('lets the registry ask for each renderer title in the active locale', () => {
    const stub = stubContext()
    apply(stub.ctx)
    expect(stub.definitions[0]?.title()).toBe(`${NAMESPACE}.title`)
    expect(stub.definitions[1]?.title()).toBe(`${NAMESPACE}.pdfTitle`)
    expect(stub.definitions[2]?.title()).toBe(`${NAMESPACE}.htmlTitle`)
  })

  it('injects the session face, the session id, and the active locale id', () => {
    const sessions = { scope: () => undefined }
    const stub = stubContext({ localeId: 'en-US', sessions })
    apply(stub.ctx)
    const factory = stub.slots[0]?.options['inject']
    expect(typeof factory).toBe('function')
    const injected = (factory as (id: unknown) => unknown)(123)
    expect(injected).toEqual({
      sessions, sessionId: '123', localeId: 'en-US', conversation: undefined, remote: undefined,
    })
    const htmlFactory = stub.slots[3]?.options['inject'] as (id: unknown) => unknown
    expect(htmlFactory(123)).toEqual({
      sessions: undefined,
      conversation: undefined,
      sessionId: '123',
      localeId: 'en-US',
      remote: undefined,
    })
  })

  it('uses the product language for the static preview when the shell reports none', () => {
    const stub = stubContext()
    apply(stub.ctx)
    const factory = stub.slots[3]?.options['inject'] as (id: unknown) => unknown
    expect(factory('s1')).toMatchObject({ localeId: 'zh' })
  })

  it('hands the service browser the same delivery faces as every annotator body', () => {
    const sessions = { scope: () => undefined }
    const stub = stubContext({ sessions })
    apply(stub.ctx)
    const factory = stub.slots[1]?.options['inject'] as (id: unknown) => unknown
    expect(factory('s1')).toEqual({
      sessions,
      conversation: undefined,
      remote: undefined,
      sessionId: 's1',
      localeId: 'zh',
    })
  })

  it('hands the static HTML preview no annotation or delivery seat', () => {
    const stub = stubContext({ localeId: 'en-US' })
    apply(stub.ctx)
    const factory = stub.slots[3]?.options['inject'] as (id: unknown) => unknown
    expect(factory('s1')).toEqual({
      sessions: undefined,
      conversation: undefined,
      remote: undefined,
      sessionId: 's1',
      localeId: 'en-US',
    })
  })

  it('hands the PDF chunk the seats it cannot import from this bundle', () => {
    const stub = stubContext()
    apply(stub.ctx)
    const factory = stub.slots[2]?.options['inject'] as (id: unknown) => { AnnotatorBody: unknown; seat: Record<string, unknown> }
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
    const factory = stub.slots[2]?.options['inject'] as (id: unknown) => { seat: { send: (input: unknown, saved: unknown, pages: unknown) => Promise<readonly string[]> } }
    const seat = factory('s1').seat
    const document_ = {
      figure: { address: 'a', path: '/w/report.pdf', mediaType: 'application/pdf', sha256: 'a'.repeat(64), pageCount: 2 },
      marks: [{ id: 'm1', kind: 'rect', color: '#1971c2', points: [[1, 2], [3, 4]], page: 1 }],
      summary: '',
      createdAt: null,
    }
    const warnings = await seat.send(document_, { annotationPath: '/w/a.annot.json', reviewPath: null }, [])
    // The seat speaks the locale the slot was mounted under. A PDF no longer needs an
    // upload service: its original path and any marked-page images are enough.
    expect(warnings).toEqual([])
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

  it('registers the block once even when the slot is declared again', () => {
    const stub = stubContext()
    apply(stub.ctx)
    // The rule registry refuses a second rule under the same id, so a re-declared
    // slot must not go looking for the conversation service a second time.
    stub.redeclare()
    expect(stub.rules).toEqual([annotationRule])
  })

  it('takes the block and the card away when the package unloads', () => {
    const stub = stubContext()
    apply(stub.ctx)
    for (const stop of stub.effects) stop()
    expect(stub.disposed).toContain('rule')
  })

  it('hands the card the Session it draws in and nothing it does not read', () => {
    const stub = stubContext({ localeId: 'en-US' })
    apply(stub.ctx)
    const factory = stub.slots[4]?.options['inject'] as (id: unknown) => {
      readonly sessionId: string
      readonly localeId: string
      readonly open: (path: string, html: boolean) => boolean
      readonly canOpen: (path: string, html: boolean) => boolean
    }
    const injected = factory('s7')
    expect(Object.keys(injected).sort()).toEqual(['canOpen', 'localeId', 'open', 'sessionId'])
    expect(injected.sessionId).toBe('s7')
    expect(injected.localeId).toBe('en-US')
  })

  it('hands the parked card the session it sits above, and nothing to open', () => {
    const stub = stubContext({ localeId: 'en-US' })
    apply(stub.ctx)
    expect(stub.slots[5]?.options).toMatchObject({
      name: 'conversation.input.dock',
      id: RULE_ID,
      order: 40,
      locale: NAMESPACE,
    })
    const factory = stub.slots[5]?.options['inject'] as (id: unknown) => {
      readonly sessionId: string
      readonly localeId: string
    }
    const injected = factory('s7')
    // Nothing to open: the card has not been sent, so there is no bubble to click
    // through to. Its whole surface is the two ways out of the way.
    expect(Object.keys(injected).sort()).toEqual(['localeId', 'sessionId'])
    expect(injected.sessionId).toBe('s7')
    expect(injected.localeId).toBe('en-US')
    // A host that has not said which locale it speaks gets the plugin's own, which is
    // the one its dictionaries are written in first.
    const quiet = stubContext()
    apply(quiet.ctx)
    const zhFactory = quiet.slots[5]?.options['inject'] as (id: unknown) => { readonly localeId: string }
    expect(zhFactory('s7').localeId).toBe('zh')
  })

  it('opens the annotated figure as a Session file the Sidebar can place', () => {
    const opened: string[] = []
    const tabs: string[] = []
    const stub = stubContext({
      sidebarRight: {
        openResource: (address: string) => { opened.push(address) },
        openTab: (kind: string, options?: { readonly params?: { readonly url?: string } }) => {
          tabs.push(`${kind}:${options?.params?.url ?? ''}`)
        },
      },
    })
    apply(stub.ctx)
    const factory = stub.slots[4]?.options['inject'] as (id: unknown) => {
      open: (path: string, html: boolean) => boolean
    }
    factory('s1').open('/w/fig.svg', false)
    // A Session-relative address, because that is the only kind the document panel
    // resolves: an absolute one is refused before it can be placed in a column.
    expect(opened).toEqual(['dsh-resource://file/session/s1//w/fig.svg'])
    expect(tabs).toEqual([])
  })

  it('returns a live annotation to the local-pages tab instead of opening its URL as a file', () => {
    const opened: string[] = []
    const tabs: string[] = []
    const stub = stubContext({
      sidebarRight: {
        openResource: (address: string) => { opened.push(address) },
        openTab: (kind: string, options?: { readonly params?: { readonly url?: string } }) => {
          tabs.push(`${kind}:${options?.params?.url ?? ''}`)
        },
      },
    })
    apply(stub.ctx)
    const factory = stub.slots[4]?.options['inject'] as (id: unknown) => {
      open: (path: string, html: boolean) => boolean
    }
    factory('s1').open('http://127.0.0.1:8811/deck/index.html?clean=1', true)
    expect(tabs).toEqual([`${SERVICE_KIND}:http://127.0.0.1:8811/deck/index.html?clean=1`])
    expect(opened).toEqual([])
  })

  it('shows the card without a Sidebar rather than failing the bubble', () => {
    const stub = stubContext()
    apply(stub.ctx)
    const factory = stub.slots[4]?.options['inject'] as (id: unknown) => {
      open: (path: string, html: boolean) => boolean
      canOpen: (path: string, html: boolean) => boolean
    }
    // Nothing to click through to is not an error: the card still says what it is.
    expect(factory('s1').canOpen('/w/fig.svg', false)).toBe(false)
    expect(() => { factory('s1').open('/w/fig.svg', false) }).not.toThrow()
  })

  it('keeps a refusal to open out of the transcript', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const stub = stubContext({ sidebarRight: { openResource: () => { throw new Error('no mounted session') } } })
    apply(stub.ctx)
    const factory = stub.slots[4]?.options['inject'] as (id: unknown) => {
      open: (path: string, html: boolean) => boolean
    }
    expect(() => { factory('s1').open('/w/fig.svg', false) }).not.toThrow()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('does not route a live page through the broken file fallback when openTab is absent', () => {
    const opened: string[] = []
    const stub = stubContext({
      sidebarRight: { openResource: (address: string) => { opened.push(address) } },
    })
    apply(stub.ctx)
    const factory = stub.slots[4]?.options['inject'] as (id: unknown) => {
      open: (path: string, html: boolean) => boolean
      canOpen: (path: string, html: boolean) => boolean
    }
    const path = 'http://127.0.0.1:8811/deck/index.html'
    expect(factory('s1').canOpen(path, true)).toBe(false)
    expect(factory('s1').open(path, true)).toBe(false)
    expect(opened).toEqual([])
  })

  it('does not offer a card whose Session or subject is empty', () => {
    const stub = stubContext({
      sidebarRight: { openResource: () => {} },
    })
    apply(stub.ctx)
    const factory = stub.slots[4]?.options['inject'] as (id: unknown) => {
      canOpen: (path: string, html: boolean) => boolean
    }
    expect(factory('').canOpen('/w/fig.svg', false)).toBe(false)
    expect(factory('s1').canOpen('', false)).toBe(false)
  })

  it('uses the HTML annotation type, not merely an HTTP-looking path, to find a live page', () => {
    const opened: string[] = []
    const stub = stubContext({
      sidebarRight: { openResource: (address: string) => { opened.push(address) } },
    })
    apply(stub.ctx)
    const factory = stub.slots[4]?.options['inject'] as (id: unknown) => {
      open: (path: string, html: boolean) => boolean
    }
    factory('s1').open('http://127.0.0.1:8811/export.svg', false)
    expect(opened).toEqual(['dsh-resource://file/session/s1/http://127.0.0.1:8811/export.svg'])
  })

  it('draws nothing into the transcript when the conversation package is absent', () => {
    const stub = stubContext({ omit: ['uiConversation'] })
    apply(stub.ctx)
    // A figure is still annotatable without the conversation package; the block
    // simply stays text, which is what a message with no rule renders as.
    expect(stub.rules).toEqual([])
    // The parked card is not the transcript's: it sits in the composer's dock, so
    // The three file renderers, the local-pages tab and the input dock are all
    // this plugin asks for.
    expect(stub.slots).toHaveLength(5)
  })

  it.each(['locale', 'documentPreviews', 'slots', 'sidebarRightTabs'])('fails loudly without the %s service', (service) => {
    const stub = stubContext({ omit: [service] })
    expect(() => { apply(stub.ctx) }).toThrow(missingService(service))
  })
})
