// @vitest-environment jsdom
/** Writing an annotation into the composer draft: what is staged, and what is written. */
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AnnotationDocument } from '../src/shared/annotation'
import { ANNOTATION_VERSION } from '../src/shared/annotation'
import { deliverToComposer, type ComposerLike, type ComposerShellLike } from '../src/client/composer'
import { defined } from './dom'

const document_: AnnotationDocument = {
  version: ANNOTATION_VERSION,
  figure: {
    address: 'dsh-resource://file/session/s1/fig.svg',
    path: '/w/fig.svg',
    mediaType: 'image/svg+xml',
    width: 200,
    height: 100,
    sha256: 'a'.repeat(64),
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  marks: [{ id: 'm1', kind: 'arrow', color: '#e03131', points: [[1, 1], [2, 2]], detail: '指错了' }],
}

/** What one composer stub recorded, and how it should behave. */
interface ComposerLog {
  readonly conversation: ComposerLike
  readonly staged: { readonly sessionId: string; readonly names: string[] }[]
  readonly attached: (readonly string[])[]
  readonly released: (readonly string[])[]
  readonly written: string[]
  readonly draft: { readonly current: string }
}

/** A composer stub with one shell and a recording draft registry. */
function stubComposer(options: {
  readonly draft?: string
  readonly refusesAttachments?: boolean
  readonly publishesNothing?: boolean
} = {}): ComposerLog {
  const staged: { readonly sessionId: string; readonly names: string[] }[] = []
  const attached: (readonly string[])[] = []
  const released: (readonly string[])[] = []
  const written: string[] = []
  const draft = { current: options.draft ?? '' }
  const shell: ComposerShellLike = {
    get snapshot() { return { draft: draft.current } },
    setDraft: (text: string) => { draft.current = text; written.push(text) },
    addAttachments: (ids: readonly string[]) => {
      if (options.refusesAttachments === true) return false
      attached.push([...ids])
      return true
    },
  }
  return {
    staged,
    attached,
    released,
    written,
    draft,
    conversation: {
      input: { shell: () => shell },
      createDrafts: (sessionId: string, files: readonly File[]) => {
        staged.push({ sessionId, names: files.map(file => `${file.name}:${file.type}`) })
        // An empty array is what a composition with no draft registry answers.
        if (options.publishesNothing === true) return []
        return files.map((_file, index) => ({ id: `d${index}` }))
      },
      releaseDraftAttachments: (drafts: readonly { readonly id: string }[]) => {
        released.push(drafts.map(entry => entry.id))
      },
    },
  }
}

/** One review picture, as the export hands one over. */
function picture(): File {
  return new File([new Uint8Array([1, 2])], 'page-1.png', { type: 'image/png' })
}

const paths = { annotationPath: '/w/fig.annot.json', reviewPath: '/w/fig.annotated.png' }

afterEach(() => { vi.unstubAllGlobals() })

describe('writing into the composer', () => {
  it('stages the pictures and writes the message, and never sends', () => {
    const log = stubComposer()
    deliverToComposer({
      conversation: log.conversation,
      sessionId: 's1',
      document: document_,
      paths,
      files: [picture()],
      locale: 'zh',
    })
    expect(log.staged).toEqual([{ sessionId: 's1', names: ['page-1.png:image/png'] }])
    expect(log.attached).toEqual([['d0']])
    const text = defined(log.written[0])
    expect(text).toContain('【附图标注】')
    // The sidecars are deleted after delivery, so the message describes the
    // attachment it carries rather than naming a file that will be gone.
    expect(text).not.toContain('.annot.json')
    expect(text).toContain('标注图已作为本条消息的附件发送')
    // Nothing in the message asks a session to do anything: the reader sends it.
    expect(text).toContain('指错了')
  })

  it('keeps the draft the reader already had, and appends to it', () => {
    const log = stubComposer({ draft: '先看这张图' })
    deliverToComposer({
      conversation: log.conversation,
      sessionId: 's1',
      document: document_,
      paths,
      files: [],
      locale: 'zh',
    })
    const text = defined(log.written[0])
    expect(text.startsWith('先看这张图\n\n')).toBe(true)
    expect(text).toContain('【附图标注】')
  })

  it('keeps the shape of the draft, not just its words', () => {
    // Appending must not cost the reader anything for being appended to. A draft that
    // begins with indentation — a fenced block, a nested list — or ends with a blank
    // line had both ends cut by the emptiness test, and an indented block that loses
    // its indentation is no longer a code block to whoever reads the message.
    const draft = '  indented line\n\nkeep trailing  \n\n'
    const log = stubComposer({ draft })
    deliverToComposer({
      conversation: log.conversation,
      sessionId: 's1',
      document: document_,
      paths,
      files: [],
      locale: 'zh',
    })
    const text = defined(log.written[0])
    expect(text.startsWith(draft)).toBe(true)
    expect(text).toContain('【附图标注】')
  })

  it('writes into an empty draft with no leading blank line', () => {
    const log = stubComposer({ draft: '   ' })
    deliverToComposer({
      conversation: log.conversation,
      sessionId: 's1',
      document: document_,
      paths,
      files: [],
      locale: 'zh',
    })
    expect(defined(log.written[0]).startsWith('【附图标注】')).toBe(true)
    // A blank draft is no draft, so nothing is staged and nothing is attached.
    expect(log.staged).toEqual([])
    expect(log.attached).toEqual([])
  })

  it('speaks English when the panel does', () => {
    const log = stubComposer()
    deliverToComposer({
      conversation: log.conversation,
      sessionId: 's1',
      document: document_,
      paths,
      files: [],
      locale: 'en',
    })
    expect(defined(log.written[0])).toContain('[figure annotations]')
  })

  it('gives the pictures back, and writes nothing, when the composer refuses them', () => {
    const log = stubComposer({ refusesAttachments: true })
    expect(() => {
      deliverToComposer({
        conversation: log.conversation,
        sessionId: 's1',
        document: document_,
        paths,
        files: [picture()],
        locale: 'zh',
      })
    }).toThrow('the composer refused the attachments')
    expect(log.released).toEqual([['d0']])
    // A draft that named pictures which are not in the rail would be a lie.
    expect(log.written).toEqual([])
  })

  it('says the session has no composer when the registry rejects the id', () => {
    const log = stubComposer()
    const conversation = {
      ...log.conversation,
      input: { shell: () => { throw new Error('conversation.input: session "s1" resolved no binding') } },
    }
    expect(() => {
      deliverToComposer({
        conversation,
        sessionId: 's1',
        document: document_,
        paths,
        files: [],
        locale: 'zh',
      })
    }).toThrow('the session has no composer to write into')
  })

  it('writes the message when the registry stages nothing', () => {
    const log = stubComposer({ publishesNothing: true })
    deliverToComposer({
      conversation: log.conversation,
      sessionId: 's1',
      document: document_,
      paths,
      files: [picture()],
      locale: 'zh',
    })
    expect(log.attached).toEqual([])
    expect(defined(log.written[0])).toContain('【附图标注】')
  })
})
