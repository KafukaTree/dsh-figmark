// @vitest-environment jsdom
/** Staging an annotation in the composer: the draft, the attachment rail, and undoing it. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AnnotationDocument } from '../src/shared/annotation'
import { ANNOTATION_VERSION } from '../src/shared/annotation'
import {
  parkInComposer,
  stageReview,
  unstageReview,
  type ComposerLike,
  type ComposerShellLike,
} from '../src/client/composer'
import { clearThumbs, thumbFor } from '../src/client/annotation-thumb'
import { clearParked, parkedAnnotations } from '../src/client/pending'
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
  /** Every draft the shell was handed. */
  readonly written: string[]
  /** The draft as the shell holds it now. */
  readonly draft: { readonly current: string }
  /** Attachment ids released back to the conversation service. */
  readonly released: string[]
  /** Attachment ids the rail was asked to hold. */
  readonly added: (readonly string[])[]
  /** The files `createDrafts` was handed. */
  readonly created: (readonly File[])[]
}

/** How one stub answers each of the calls staging makes. */
interface StubOptions {
  /** The draft the reader already typed. */
  readonly draft?: string
  /** What `setDraft` does. */
  readonly write?: 'ok' | 'throw'
  /** What `input.shell` does. */
  readonly registry?: 'ok' | 'reject'
  /** What `createDrafts` does; `'none'` leaves the member off entirely. */
  readonly create?: 'ok' | 'empty' | 'throw' | 'none'
  /** What the rail's `addAttachments` does; `'none'` leaves the member off. */
  readonly add?: 'ok' | 'refuse' | 'throw' | 'none'
}

/**
 * A composer stub whose shell records everything staging did to it.
 * @param options - how each call should behave.
 * @returns the service, and what it saw.
 */
function stubComposer(options: StubOptions = {}): ComposerLog {
  const written: string[] = []
  const released: string[] = []
  const added: (readonly string[])[] = []
  const created: (readonly File[])[] = []
  const draft = { current: options.draft ?? '' }
  const add = options.add ?? 'ok'
  const create = options.create ?? 'ok'
  const shell: ComposerShellLike = {
    get snapshot() { return { draft: draft.current } },
    setDraft: (text: string) => {
      if (options.write === 'throw') throw new Error('the editor is gone')
      draft.current = text
      written.push(text)
    },
    ...(add === 'none'
      ? {}
      : {
          addAttachments: (ids: readonly string[]): boolean => {
            if (add === 'throw') throw new Error('the rail is busy')
            added.push(ids)
            return add !== 'refuse'
          },
        }),
  }
  const conversation: ComposerLike = {
    input: {
      shell: (id: string) => {
        if (options.registry === 'reject') {
          throw new Error(`conversation.input: session "${id}" resolved no binding`)
        }
        return shell
      },
    },
    ...(create === 'none'
      ? {}
      : {
          createDrafts: (sessionId: string, files: readonly File[]) => {
            if (create === 'throw') throw new Error('the upload failed')
            created.push(files)
            return create === 'empty' ? [] : [{ id: 'a1' }]
          },
        }),
    releaseDraftAttachment: (id: string) => { released.push(id) },
  }
  return { conversation, written, draft, released, added, created }
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
      file: undefined,
      locale: 'zh',
      send,
    })
    const parked = defined(parkedAnnotations('s1')[0])
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
    // Nothing to stage into, so the card is the only way to send.
    expect(parked.staged).toBeUndefined()
  })

  it('puts the message in the draft, behind what the reader already typed', () => {
    const log = stubComposer({ draft: '先看这张图' })
    const send = vi.fn(async () => {})
    parkInComposer({
      conversation: log.conversation,
      sessionId: 's1',
      document: document_,
      paths,
      thumb: undefined,
      file: undefined,
      locale: 'zh',
      send,
    })
    const parked = defined(parkedAnnotations('s1')[0])
    // The box's own send is what carries this now, so the message it reads has to be
    // in the box — the reader's sentence, then the block, in one draft.
    expect(defined(log.written[0]).startsWith('先看这张图\n\n')).toBe(true)
    expect(log.draft.current).toBe(`先看这张图\n\n${parked.raw}`)
    expect(parked.staged?.text).toBe(parked.raw)
    // Parking still sends nothing: the press is the reader's.
    expect(send).not.toHaveBeenCalled()
  })

  it('keeps the shape of the draft, not just its words', () => {
    // Appending must not cost the reader anything for being appended to. A draft that
    // begins with indentation — a fenced block, a nested list — or ends with a blank
    // line had both ends cut by the emptiness test, and an indented block that loses
    // its indentation is no longer a code block to whoever reads the message.
    const draft = '  indented line\n\nkeep trailing  \n\n'
    const log = stubComposer({ draft })
    parkInComposer({
      conversation: log.conversation, sessionId: 's1', document: document_, paths,
      thumb: undefined, file: undefined, locale: 'zh', send: async () => {},
    })
    expect(defined(log.written[0]).startsWith(draft)).toBe(true)
  })

  it('writes the block into an empty draft with no leading blank line', () => {
    const log = stubComposer({ draft: '   ' })
    parkInComposer({
      conversation: log.conversation, sessionId: 's1', document: document_, paths,
      thumb: undefined, file: undefined, locale: 'zh', send: async () => {},
    })
    expect(defined(log.written[0])).toBe(defined(parkedAnnotations('s1')[0]).raw)
  })

  it('stages the review picture in the rail beside the message', () => {
    const log = stubComposer()
    const picture = new File(['png'], 'fig.annotated.png', { type: 'image/png' })
    parkInComposer({
      conversation: log.conversation, sessionId: 's1', document: document_, paths,
      thumb: undefined, file: picture, locale: 'zh', send: async () => {},
    })
    // One press has to carry both halves of the review: the text is in the draft and
    // the picture is in the rail, where the box's send finds it.
    expect(log.created).toEqual([[picture]])
    expect(log.added).toEqual([['a1']])
    expect(parkedAnnotations('s1')[0]?.staged?.attachmentIds).toEqual(['a1'])
  })

  it('stages the text alone when the host will not hold attachments', () => {
    const log = stubComposer({ add: 'none' })
    parkInComposer({
      conversation: log.conversation, sessionId: 's1', document: document_, paths,
      thumb: undefined, file: new File(['png'], 'a.png', { type: 'image/png' }), locale: 'zh',
      send: async () => {},
    })
    expect(log.created).toEqual([])
    expect(log.draft.current).toContain('【附图标注】')
    expect(parkedAnnotations('s1')[0]?.staged?.attachmentIds).toEqual([])
  })

  it('stages the text alone when the host cannot create drafts at all', () => {
    const log = stubComposer({ create: 'none' })
    parkInComposer({
      conversation: log.conversation, sessionId: 's1', document: document_, paths,
      thumb: undefined, file: new File(['png'], 'a.png', { type: 'image/png' }), locale: 'zh',
      send: async () => {},
    })
    expect(log.added).toEqual([])
    expect(log.draft.current).toContain('【附图标注】')
  })

  it('stages the text alone when the upload itself fails', () => {
    const log = stubComposer({ create: 'throw' })
    parkInComposer({
      conversation: log.conversation, sessionId: 's1', document: document_, paths,
      thumb: undefined, file: new File(['png'], 'a.png', { type: 'image/png' }), locale: 'zh',
      send: async () => {},
    })
    expect(log.added).toEqual([])
    expect(log.draft.current).toContain('【附图标注】')
  })

  it('stages the text alone when the upload yields no draft', () => {
    const log = stubComposer({ create: 'empty' })
    parkInComposer({
      conversation: log.conversation, sessionId: 's1', document: document_, paths,
      thumb: undefined, file: new File(['png'], 'a.png', { type: 'image/png' }), locale: 'zh',
      send: async () => {},
    })
    expect(log.added).toEqual([])
    expect(parkedAnnotations('s1')[0]?.staged?.attachmentIds).toEqual([])
  })

  it('takes back an attachment the rail refused, rather than leaking it', () => {
    // A box that is mid-send refuses new attachments. The draft it refused is still
    // the service's, and an id nothing holds would keep the upload alive for nobody.
    const log = stubComposer({ add: 'refuse' })
    parkInComposer({
      conversation: log.conversation, sessionId: 's1', document: document_, paths,
      thumb: undefined, file: new File(['png'], 'a.png', { type: 'image/png' }), locale: 'zh',
      send: async () => {},
    })
    expect(log.released).toEqual(['a1'])
    expect(parkedAnnotations('s1')[0]?.staged?.attachmentIds).toEqual([])
  })

  it('takes back an attachment the rail threw on', () => {
    const log = stubComposer({ add: 'throw' })
    parkInComposer({
      conversation: log.conversation, sessionId: 's1', document: document_, paths,
      thumb: undefined, file: new File(['png'], 'a.png', { type: 'image/png' }), locale: 'zh',
      send: async () => {},
    })
    expect(log.released).toEqual(['a1'])
  })

  it('parks without staging when the session has no composer', () => {
    const log = stubComposer({ registry: 'reject' })
    parkInComposer({
      conversation: log.conversation, sessionId: 's1', document: document_, paths,
      thumb: undefined, file: undefined, locale: 'zh', send: async () => {},
    })
    const parked = defined(parkedAnnotations('s1')[0])
    expect(parked.staged).toBeUndefined()
    // The card is still the hand-off the reader asked for, and still holds the text.
    expect(parked.raw).toContain('【附图标注】')
  })

  it('parks without staging when the box refuses the write', () => {
    const log = stubComposer({ write: 'throw' })
    parkInComposer({
      conversation: log.conversation, sessionId: 's1', document: document_, paths,
      thumb: undefined, file: undefined, locale: 'zh', send: async () => {},
    })
    expect(parkedAnnotations('s1')[0]?.staged).toBeUndefined()
    expect(log.created).toEqual([])
  })

  it('files the thumbnail under the message the bubble will ask about', () => {
    const thumb = 'data:image/webp;base64,AAAA'
    parkInComposer({
      conversation: undefined,
      sessionId: 's1',
      document: document_,
      paths,
      thumb,
      file: undefined,
      locale: 'zh',
      send: async () => {},
    })
    const parked = defined(parkedAnnotations('s1')[0])
    expect(thumbFor(parked.raw)).toBe(thumb)
  })

  it('speaks English when the panel does', () => {
    parkInComposer({
      conversation: undefined,
      sessionId: 's1',
      document: document_,
      paths,
      thumb: undefined,
      file: undefined,
      locale: 'en',
      send: async () => {},
    })
    expect(defined(parkedAnnotations('s1')[0]).raw).toContain('[figure annotations]')
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
      file: undefined,
      locale: 'zh',
      send: async () => {},
    })
    const parked = defined(parkedAnnotations('s1')[0])
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

  it('queues behind the card the session already had', () => {
    const first = vi.fn(async () => {})
    parkInComposer({
      conversation: undefined, sessionId: 's1', document: document_, paths, thumb: undefined,
      file: undefined, locale: 'zh', send: first,
    })
    const second = vi.fn(async () => {})
    parkInComposer({
      conversation: undefined, sessionId: 's1', document: nameless, paths, thumb: undefined,
      file: undefined, locale: 'zh', send: second,
    })
    const cards = parkedAnnotations('s1')
    expect(cards).toHaveLength(2)
    // Two figures handed over are two reviews: the earlier one keeps its own message
    // and its own delivery instead of being squeezed out by the newer one.
    expect(cards[0]?.send).toBe(first)
    expect(cards[1]?.send).toBe(second)
    expect(cards[0]?.data.file).toBe('/w/fig.svg')
    expect(cards[1]?.data.file).toBe('')
  })

  it('stacks the second block under the first in the same draft', () => {
    const log = stubComposer()
    const park = async (): Promise<void> => {}
    parkInComposer({
      conversation: log.conversation, sessionId: 's1', document: document_, paths,
      thumb: undefined, file: undefined, locale: 'zh', send: park,
    })
    parkInComposer({
      conversation: log.conversation, sessionId: 's1', document: nameless, paths,
      thumb: undefined, file: undefined, locale: 'zh', send: park,
    })
    const draft = log.draft.current
    const cards = parkedAnnotations('s1')
    // Two reviews are one message, so both blocks are in the one draft, in the order
    // they were parked — pressing Send once sends both.
    expect(cards).toHaveLength(2)
    expect(draft).toBe(`${defined(cards[0]).raw}\n\n${defined(cards[1]).raw}`)
  })
})

describe('taking a staged annotation back out of the composer', () => {
  it('cuts the block and its picture out, and nothing else', () => {
    const log = stubComposer({ draft: '先看这张图' })
    const message = '【附图标注】/w/fig.svg'
    const staged = defined(stageReview(log.conversation, 's1', message, undefined))
    expect(log.draft.current).toBe(`先看这张图\n\n${message}`)
    // The reader adds a sentence after the block, then changes their mind about it.
    staged.shell.setDraft(`${log.draft.current}\n\n再看这一处`)
    unstageReview(staged, log.conversation)
    // The block goes, the words before and after it stay.
    expect(log.draft.current).toBe('先看这张图\n\n再看这一处')
    // A card whose picture never made it into the rail has nothing to release.
    expect(log.released).toEqual([])
  })

  it('empties the draft entirely when it held only the block', () => {
    const log = stubComposer()
    const staged = defined(stageReview(log.conversation, 's1', '【附图标注】/w/fig.svg', undefined))
    unstageReview(staged, log.conversation)
    expect(log.draft.current).toBe('')
  })

  it('gives the rail and the service their attachment back', () => {
    const log = stubComposer()
    const picture = new File(['png'], 'a.png', { type: 'image/png' })
    const staged = defined(stageReview(log.conversation, 's1', '【附图标注】/w/fig.svg', picture))
    expect(staged.attachmentIds).toEqual(['a1'])
    unstageReview(staged, log.conversation)
    // The rail is told to drop it and the service is told to forget it: leaving either
    // half behind keeps an upload alive for a message that will never be sent.
    expect(log.released).toEqual(['a1'])
  })

  it('leaves the draft alone when the block is already gone', () => {
    const log = stubComposer()
    const staged = defined(stageReview(log.conversation, 's1', '【附图标注】/w/fig.svg', undefined))
    staged.shell.setDraft('我自己写的')
    const before = log.draft.current
    unstageReview(staged, log.conversation)
    expect(log.draft.current).toBe(before)
  })

  it('gives the attachment back even without the service to tell', () => {
    const log = stubComposer()
    const staged = defined(stageReview(log.conversation, 's1', 'x', new File(['p'], 'a.png', { type: 'image/png' })))
    expect(() => { unstageReview(staged, undefined) }).not.toThrow()
    expect(log.released).toEqual([])
  })

  it('says nothing when the box will not take the write back', () => {
    // The reader may have closed the box in the meantime. A card that cannot clean up
    // after itself must not throw at the press that removed it.
    const log = stubComposer()
    const staged = defined(stageReview(log.conversation, 's1', '【附图标注】/w/fig.svg', undefined))
    const hostile = {
      ...staged,
      shell: { ...staged.shell, setDraft: (): void => { throw new Error('the editor is gone') } },
    }
    expect(() => { unstageReview(hostile, log.conversation) }).not.toThrow()
  })

  it('says nothing when the box cannot even be read', () => {
    const log = stubComposer()
    const shell = log.conversation.input.shell('s1')
    const staged = {
      shell: {
        ...shell,
        get snapshot(): { readonly draft: string } { throw new Error('the box is disposed') },
      },
      text: 'gone',
      attachmentIds: [],
    }
    expect(() => { unstageReview(staged, log.conversation) }).not.toThrow()
  })
})
