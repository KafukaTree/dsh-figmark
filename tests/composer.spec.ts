// @vitest-environment jsdom
/** Parking an annotation above the composer, and writing it into the draft on demand. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AnnotationDocument } from '../src/shared/annotation'
import { ANNOTATION_VERSION } from '../src/shared/annotation'
import { insertIntoDraft, parkInComposer, type ComposerLike, type ComposerShellLike } from '../src/client/composer'
import { clearThumbs, thumbFor } from '../src/client/annotation-thumb'
import { clearParked, parkedAnnotation } from '../src/client/pending'
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

/** A document the message builder cannot spell a parsable header for. */
const nameless: AnnotationDocument = { ...document_, figure: { ...document_.figure, path: '' } }

const paths = { annotationPath: '/w/fig.annot.json', reviewPath: '/w/fig.annotated.png' }

/** What one composer stub recorded, and how it should behave. */
interface ComposerLog {
  readonly conversation: ComposerLike
  readonly written: string[]
  readonly draft: { readonly current: string }
}

/** A composer stub with one shell that records every draft it is handed. */
function stubComposer(options: { readonly draft?: string } = {}): ComposerLog {
  const written: string[] = []
  const draft = { current: options.draft ?? '' }
  const shell: ComposerShellLike = {
    get snapshot() { return { draft: draft.current } },
    setDraft: (text: string) => { draft.current = text; written.push(text) },
  }
  return { written, draft, conversation: { input: { shell: () => shell } } }
}

beforeEach(() => {
  clearParked()
  clearThumbs()
})

afterEach(() => { vi.unstubAllGlobals() })

describe('parking an annotation above the composer', () => {
  it('parks the message as a card, and sends nothing', () => {
    const send = vi.fn(async () => {})
    parkInComposer({
      conversation: undefined,
      sessionId: 's1',
      document: document_,
      paths,
      thumb: undefined,
      locale: 'zh',
      send,
    })
    const parked = defined(parkedAnnotation('s1'))
    expect(parked.raw).toContain('【附图标注】')
    // The sidecars are deleted once the figure is handed off, so the message
    // describes the picture it carries rather than naming a file that is gone.
    expect(parked.raw).not.toContain('.annot.json')
    expect(parked.raw).toContain('标注图已作为本条消息的附件发送')
    expect(parked.raw).toContain('指错了')
    expect(parked.data.file).toBe('/w/fig.svg')
    expect(parked.data.scope).toContain('200×100')
    expect(parked.data.marks.map(mark => mark.comment)).toEqual(['指错了'])
    expect(send).not.toHaveBeenCalled()
  })

  it('keeps the delivery the reader will send later, without touching the draft', () => {
    const log = stubComposer({ draft: '先看这张图' })
    const send = vi.fn(async () => {})
    parkInComposer({
      conversation: log.conversation,
      sessionId: 's1',
      document: document_,
      paths,
      thumb: undefined,
      locale: 'zh',
      send,
    })
    const parked = defined(parkedAnnotation('s1'))
    // `send` is the caller's closure, not a re-run of the delivery: a card pressed
    // minutes later sends what was on screen when the figure was closed.
    expect(parked.send).toBe(send)
    expect(parked.conversation).toBe(log.conversation)
    // Parking is what replaced writing into the draft, so the box keeps only what
    // the reader typed.
    expect(log.written).toEqual([])
    expect(log.draft.current).toBe('先看这张图')
  })

  it('files the thumbnail under the message the bubble will ask about', () => {
    const thumb = 'data:image/webp;base64,AAAA'
    parkInComposer({
      conversation: undefined,
      sessionId: 's1',
      document: document_,
      paths,
      thumb,
      locale: 'zh',
      send: async () => {},
    })
    const parked = defined(parkedAnnotation('s1'))
    expect(thumbFor(parked.raw)).toBe(thumb)
  })

  it('speaks English when the panel does', () => {
    parkInComposer({
      conversation: undefined,
      sessionId: 's1',
      document: document_,
      paths,
      thumb: undefined,
      locale: 'en',
      send: async () => {},
    })
    expect(defined(parkedAnnotation('s1')).raw).toContain('[figure annotations]')
  })

  it('parks a bare card when the message names no figure', () => {
    // A message the rule cannot recognise is still the message: the card falls back
    // to the figure it was made from rather than refusing the hand-off.
    parkInComposer({
      conversation: undefined,
      sessionId: 's1',
      document: nameless,
      paths,
      thumb: undefined,
      locale: 'zh',
      send: async () => {},
    })
    const parked = defined(parkedAnnotation('s1'))
    expect(parked.data).toEqual({
      file: '',
      scope: '',
      target: '',
      instruction: '',
      html: false,
      marks: [],
    })
    expect(parked.raw).toContain('【附图标注】')
  })

  it('replaces the previous card for the same session', () => {
    const first = vi.fn(async () => {})
    parkInComposer({
      conversation: undefined, sessionId: 's1', document: document_, paths, thumb: undefined, locale: 'zh', send: first,
    })
    const second = vi.fn(async () => {})
    parkInComposer({
      conversation: undefined, sessionId: 's1', document: nameless, paths, thumb: undefined, locale: 'zh', send: second,
    })
    expect(defined(parkedAnnotation('s1')).send).toBe(second)
  })
})

describe('writing the parked message into the draft', () => {
  it('writes the message into an empty draft, with no leading blank line', () => {
    const log = stubComposer({ draft: '   ' })
    insertIntoDraft(log.conversation, 's1', '【附图标注】/w/fig.svg')
    expect(log.written).toEqual(['【附图标注】/w/fig.svg'])
  })

  it('keeps the draft the reader already had, and appends to it', () => {
    const log = stubComposer({ draft: '先看这张图' })
    insertIntoDraft(log.conversation, 's1', '【附图标注】/w/fig.svg')
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
    insertIntoDraft(log.conversation, 's1', '【附图标注】/w/fig.svg')
    const text = defined(log.written[0])
    expect(text.startsWith(draft)).toBe(true)
    expect(text).toContain('【附图标注】')
  })

  it('says the session has no composer when the registry rejects the id', () => {
    const log = stubComposer()
    const conversation = {
      ...log.conversation,
      input: { shell: () => { throw new Error('conversation.input: session "s1" resolved no binding') } },
    }
    expect(() => { insertIntoDraft(conversation, 's1', 'x') })
      .toThrow('the session has no composer to write into')
  })
})
