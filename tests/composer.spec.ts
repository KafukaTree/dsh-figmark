// @vitest-environment jsdom
/** Arming an annotation in the composer: nothing in the draft, everything in the send. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AnnotationDocument } from '../src/shared/annotation'
import { ANNOTATION_VERSION } from '../src/shared/annotation'
import {
  armReview,
  disarmReview,
  holdSubmit,
  parkInComposer,
  type ArmedReview,
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
  /** Every draft the shell was handed, in order. */
  readonly written: string[]
  /** The draft as the shell holds it now. */
  readonly draft: { current: string }
  /** The rail as the shell holds it now. */
  readonly rail: { current: readonly string[] }
  /** Where the box is in its send transaction. */
  readonly phase: { current: string }
  /** The draft the box was holding at the moment each send started. */
  readonly submits: string[]
  /** The rail the box was holding at the moment each send started. */
  readonly submitted: (readonly string[])[]
  /** Attachment ids released back to the conversation service. */
  readonly released: string[]
  /** Attachment ids the rail was asked to hold. */
  readonly added: (readonly string[])[]
  /** Attachment ids the rail was asked to drop. */
  readonly removed: string[]
  /** The files `createDrafts` was handed. */
  readonly created: (readonly File[])[]
  /** Press the box's own send, the way the reader's key or button does. */
  readonly press: () => void
}

/** How one stub answers each of the calls arming makes. */
interface StubOptions {
  /** The draft the reader already typed. */
  readonly draft?: string
  /** Where the box says it is in its send. */
  readonly phase?: string
  /**
   * What `setDraft` does. `'throw-restore'` writes the merge and then throws when the
   * refused send asks for the reader's own text back.
   */
  readonly write?: 'ok' | 'throw' | 'throw-restore'
  /** What `input.shell` does. */
  readonly registry?: 'ok' | 'reject'
  /** What `createDrafts` does; `'none'` leaves the member off entirely. */
  readonly create?: 'ok' | 'empty' | 'throw' | 'none'
  /** What the rail's `addAttachments` does; `'none'` leaves the member off. */
  readonly add?: 'ok' | 'refuse' | 'throw' | 'none'
  /** What the rail's `removeAttachment` does; `'none'` leaves the member off. */
  readonly remove?: 'ok' | 'none'
  /**
   * What the box's own send does: `'ok'` takes the draft and the rail and leaves them
   * empty, the way a delivered message does; `'refuse'` leaves both where they were,
   * the way a send that never left the box does; `'none'` leaves the member off.
   */
  readonly submit?: 'ok' | 'refuse' | 'none'
  /** Where the box moves to once its send has run; absent leaves it where it was. */
  readonly phaseAfter?: string
  /**
   * How many reads of `snapshot` succeed. `1` is a box that vanishes the moment the
   * send has run; absent is a box that answers for as long as it is asked.
   */
  readonly reads?: number
  /**
   * What the box does with a draft written during a press. `'sync'` writes it through
   * at once, the way the button — which presses the box between edits — does;
   * `'queued'` holds it until the press is over, the way Enter does, because Enter
   * reaches the box's own send from inside the edit that is already running.
   */
  readonly press?: 'sync' | 'queued'
}

/**
 * A composer stub whose shell records everything arming and sending did to it.
 * @param options - how each call should behave.
 * @returns the service, and what it saw.
 */
function stubComposer(options: StubOptions = {}): ComposerLog {
  const written: string[] = []
  const released: string[] = []
  const added: (readonly string[])[] = []
  const removed: string[] = []
  const created: (readonly File[])[] = []
  const submits: string[] = []
  const submitted: (readonly string[])[] = []
  const draft = { current: options.draft ?? '' }
  const rail = { current: [] as readonly string[] }
  const phase = { current: options.phase ?? 'plain' }
  let reads = 0
  let writes = 0
  const add = options.add ?? 'ok'
  const create = options.create ?? 'ok'
  const remove = options.remove ?? 'ok'
  const submit = options.submit ?? 'ok'
  /** Whether the box is in the middle of an edit, where a write only queues. */
  let editing = false
  /** The draft a write left waiting for the edit to end. */
  let queued: string | undefined
  const shell: ComposerShellLike = {
    get snapshot() {
      reads += 1
      if (options.reads !== undefined && reads > options.reads) throw new Error('the box is gone')
      return { draft: draft.current, attachmentIds: rail.current, phase: phase.current }
    },
    setDraft: (text: string) => {
      writes += 1
      if (options.write === 'throw') throw new Error('the editor is gone')
      if (options.write === 'throw-restore' && writes > 1) throw new Error('the editor is gone')
      // Inside an edit the box keeps the text aside: its draft, which is what a send
      // started right now would carry, stays exactly as the reader left it.
      if (editing) {
        queued = text
        return
      }
      draft.current = text
      written.push(text)
    },
    ...(add === 'none'
      ? {}
      : {
          addAttachments: (ids: readonly string[]): boolean => {
            if (add === 'throw') throw new Error('the rail is busy')
            if (add === 'refuse') return false
            added.push(ids)
            rail.current = [...rail.current, ...ids]
            return true
          },
        }),
    ...(remove === 'none'
      ? {}
      : {
          removeAttachment: (id: string): boolean => {
            removed.push(id)
            rail.current = rail.current.filter(held => held !== id)
            return true
          },
        }),
    ...(submit === 'none'
      ? {}
      : {
          submit: () => {
            submits.push(draft.current)
            submitted.push(rail.current)
            if (options.phaseAfter !== undefined) phase.current = options.phaseAfter
            if (submit === 'refuse') return
            draft.current = ''
            rail.current = []
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
  const press = (): void => {
    const send = shell.submit
    if (send === undefined) return
    if ((options.press ?? 'sync') !== 'queued') {
      send.call(shell)
      return
    }
    editing = true
    try {
      send.call(shell)
    } finally {
      editing = false
    }
    // The box commits what the edit queued when the edit ends, a turn after the press
    // has already returned to whoever pressed it.
    queueMicrotask(() => {
      if (queued === undefined) return
      draft.current = queued
      written.push(queued)
      queued = undefined
    })
  }
  return {
    conversation, written, draft, rail, phase, submits, submitted, released, added, removed, created,
    press,
  }
}

/**
 * Park one annotation through a stub, and hand back what it armed.
 * @param log - the stub.
 * @param file - the review picture, when the surface has one.
 * @returns what the card armed.
 */
function park(log: ComposerLog, file?: File): ArmedReview {
  parkInComposer({
    conversation: log.conversation,
    sessionId: 's1',
    document: document_,
    paths,
    thumb: undefined,
    file,
    locale: 'zh',
    send: async () => [],
  })
  return defined(defined(parkedAnnotations('s1')[0]).armed)
}

beforeEach(() => {
  clearParked()
  clearThumbs()
})

afterEach(() => { vi.unstubAllGlobals() })

describe('parking an annotation above the composer', () => {
  it('parks the message as a card, and sends nothing', () => {
    const send = vi.fn(async () => [])
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
    // The sidecars are deleted once the figure is handed off, so the message never
    // names a path that is about to vanish. No file is armed in this case, so it also
    // makes no promise that an attachment travelled.
    expect(parked.raw).not.toContain('.annot.json')
    expect(parked.raw).not.toContain('标注图已作为本条消息的附件发送')
    expect(parked.raw).toContain('指错了')
    expect(parked.data.file).toBe('/w/fig.svg')
    expect(parked.data.scope).toContain('200×100')
    expect(parked.data.marks.map(mark => mark.comment)).toEqual(['指错了'])
    expect(send).not.toHaveBeenCalled()
    // Nothing to arm into, so the card's own send is the only way out.
    expect(parked.armed).toBeUndefined()
  })

  it('leaves the box exactly as the reader typed it', () => {
    const log = stubComposer({ draft: '先看这张图' })
    const armed = park(log)
    const parked = defined(parkedAnnotations('s1')[0])
    // The card is the annotation. Six lines of coordinates written into the draft
    // would sit in front of the sentence the reader is trying to write, and the card
    // above would say the same thing a second time.
    expect(log.written).toEqual([])
    expect(log.draft.current).toBe('先看这张图')
    // What it armed is the message the send will deliver, word for word.
    expect(armed.text).toBe(parked.raw)
  })

  it('holds the review picture without staging it in the rail', () => {
    const log = stubComposer()
    const picture = new File(['png'], 'fig.annotated.png', { type: 'image/png' })
    const armed = park(log, picture)
    // Uploaded now, so the press has nothing to wait for — but a picture in the rail
    // is a picture the reader can see and did not add, so the rail stays empty.
    expect(log.created).toEqual([[picture]])
    expect(log.added).toEqual([])
    expect(log.rail.current).toEqual([])
    expect(armed.attachmentIds).toEqual(['a1'])
  })

  it('arms the text alone when the host cannot attach, but keeps the upload', () => {
    const log = stubComposer({ add: 'none' })
    const armed = park(log, new File(['png'], 'a.png', { type: 'image/png' }))
    // The picture was already uploaded, so the press has nothing to wait for; whether
    // the rail can take it is the press's business, not the park's.
    expect(log.created).toHaveLength(1)
    expect(armed.attachmentIds).toEqual(['a1'])
    expect(log.draft.current).toBe('')
  })

  it('arms the text alone when the host cannot create drafts at all', () => {
    const log = stubComposer({ create: 'none' })
    const armed = park(log, new File(['png'], 'a.png', { type: 'image/png' }))
    expect(armed.attachmentIds).toEqual([])
  })

  it('arms the text alone when the upload itself fails', () => {
    const log = stubComposer({ create: 'throw' })
    const armed = park(log, new File(['png'], 'a.png', { type: 'image/png' }))
    expect(armed.attachmentIds).toEqual([])
  })

  it('arms the text alone when the upload yields no draft', () => {
    const log = stubComposer({ create: 'empty' })
    const armed = park(log, new File(['png'], 'a.png', { type: 'image/png' }))
    expect(armed.attachmentIds).toEqual([])
  })

  it('parks unarmed when the session has no composer', () => {
    const log = stubComposer({ registry: 'reject' })
    parkInComposer({
      conversation: log.conversation, sessionId: 's1', document: document_, paths,
      thumb: undefined, file: undefined, locale: 'zh', send: async () => [],
    })
    const parked = defined(parkedAnnotations('s1')[0])
    expect(parked.armed).toBeUndefined()
    // The card is still the hand-off the reader asked for, and still holds the text.
    expect(parked.raw).toContain('【附图标注】')
  })

  it('parks unarmed when the box has no send to hang the merge on', () => {
    const log = stubComposer({ submit: 'none' })
    parkInComposer({
      conversation: log.conversation, sessionId: 's1', document: document_, paths,
      thumb: undefined, file: new File(['png'], 'a.png', { type: 'image/png' }), locale: 'zh',
      send: async () => [],
    })
    const parked = defined(parkedAnnotations('s1')[0])
    // Nothing to merge into a press, so the card keeps its own delivery — and the
    // picture is not uploaded for a send that will not read it.
    expect(parked.armed).toBeUndefined()
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
      send: async () => [],
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
      send: async () => [],
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
      send: async () => [],
    })
    const parked = defined(parkedAnnotations('s1')[0])
    expect(parked.data).toEqual({
      file: '',
      scope: '',
      target: '',
      instruction: '',
      html: false,
      pageCapture: 'none',
      marks: [],
    })
    expect(parked.raw).toContain('【附图标注】')
  })

  it('queues behind the card the session already had', () => {
    const first = vi.fn(async () => [])
    parkInComposer({
      conversation: undefined, sessionId: 's1', document: document_, paths, thumb: undefined,
      file: undefined, locale: 'zh', send: first,
    })
    const second = vi.fn(async () => [])
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

  it('arms two cards without either of them writing into the box', () => {
    const log = stubComposer()
    const park_ = async (): Promise<readonly string[]> => []
    parkInComposer({
      conversation: log.conversation, sessionId: 's1', document: document_, paths,
      thumb: undefined, file: undefined, locale: 'zh', send: park_,
    })
    parkInComposer({
      conversation: log.conversation, sessionId: 's1', document: nameless, paths,
      thumb: undefined, file: undefined, locale: 'zh', send: park_,
    })
    const cards = parkedAnnotations('s1')
    expect(cards).toHaveLength(2)
    expect(log.written).toEqual([])
    // Both are armed, each with its own message: they are two reviews, and one press
    // of Send carries the two of them, not one of them twice.
    expect(cards.map(card => card.armed?.text)).toEqual(cards.map(card => card.raw))
  })
})

describe('the box send carrying an armed annotation', () => {
  it('writes the block behind the sentence, at the press, not before', () => {
    const log = stubComposer({ draft: '先看这张图' })
    const armed = park(log)
    const done = vi.fn()
    const unhook = holdSubmit(armed, done)
    expect(log.draft.current).toBe('先看这张图')
    log.conversation.input.shell('s1').submit?.()
    // The message the box carried is the reader's sentence, then the block.
    expect(log.submits).toEqual([`先看这张图\n\n${armed.text}`])
    // And the box is left empty: what it carried it delivered.
    expect(log.draft.current).toBe('')
    expect(done).toHaveBeenCalledTimes(1)
    unhook()
  })

  it('sends the sentence and the block together when Enter queues the write', async () => {
    const log = stubComposer({ draft: '这行字错了', press: 'queued' })
    const armed = park(log)
    const done = vi.fn()
    const unhook = holdSubmit(armed, done)
    log.press()
    // Inside the box's own edit the merge is only queued, so nothing has gone out yet:
    // a send started there would carry the sentence and none of the blocks behind it.
    expect(log.submits).toEqual([])
    await new Promise(resolve => { setTimeout(resolve, 0) })
    // One press still carries both, once the box has taken the write.
    expect(log.submits).toEqual([`这行字错了\n\n${armed.text}`])
    expect(done).toHaveBeenCalledTimes(1)
    expect(log.draft.current).toBe('')
    unhook()
  })

  it('sends one message when a press that is still waiting is pressed again', async () => {
    const log = stubComposer({ draft: '这行字错了', press: 'queued' })
    const armed = park(log)
    const unhook = holdSubmit(armed, vi.fn())
    log.press()
    log.press()
    await new Promise(resolve => { setTimeout(resolve, 0) })
    // The second press joins the one already waiting rather than starting another
    // message carrying the very same block.
    expect(log.submits).toEqual([`这行字错了\n\n${armed.text}`])
    unhook()
  })

  it('carries the picture beside the text in the same press', () => {
    const log = stubComposer({ draft: '先看这张图' })
    const armed = park(log, new File(['png'], 'a.png', { type: 'image/png' }))
    const unhook = holdSubmit(armed, vi.fn())
    log.conversation.input.shell('s1').submit?.()
    expect(log.submitted).toEqual([['a1']])
    unhook()
  })

  it('sends the block alone when the reader typed nothing', () => {
    const log = stubComposer({ draft: '   ' })
    const armed = park(log)
    const unhook = holdSubmit(armed, vi.fn())
    log.conversation.input.shell('s1').submit?.()
    // An empty box takes the block as its whole content, with no blank line in front.
    expect(log.submits).toEqual([armed.text])
    unhook()
  })

  it('keeps the shape of the typed draft, not just its words', () => {
    // Appending must not cost the reader anything for being appended to. A draft that
    // begins with indentation — a fenced block, a nested list — or ends with a blank
    // line had both ends cut by the emptiness test, and an indented block that loses
    // its indentation is no longer a code block to whoever reads the message.
    const typed = '  indented line\n\nkeep trailing  \n\n'
    const log = stubComposer({ draft: typed })
    const armed = park(log)
    const unhook = holdSubmit(armed, vi.fn())
    log.conversation.input.shell('s1').submit?.()
    expect(defined(log.submits[0]).startsWith(typed)).toBe(true)
    unhook()
  })

  it('sends the annotation once even if the press runs the merge twice', () => {
    const log = stubComposer({ draft: '先看这张图' })
    const armed = park(log)
    const done = vi.fn()
    const unhook = holdSubmit(armed, done)
    log.conversation.input.shell('s1').setDraft(`先看这张图\n\n${armed.text}`)
    log.conversation.input.shell('s1').submit?.()
    // Already in the box: writing it again is the one way to send it twice.
    expect(log.submits).toEqual([`先看这张图\n\n${armed.text}`])
    expect(log.submits[0]?.split(armed.text)).toHaveLength(2)
    expect(done).toHaveBeenCalledTimes(1)
    unhook()
  })

  it('gives the box back when the send never left it', () => {
    const log = stubComposer({ draft: '先看这张图', submit: 'refuse' })
    const armed = park(log, new File(['png'], 'a.png', { type: 'image/png' }))
    const done = vi.fn()
    const unhook = holdSubmit(armed, done)
    log.conversation.input.shell('s1').submit?.()
    // The box kept the draft and sent nothing: the reader gets their sentence back
    // without six lines of coordinates they did not type, and the card stays.
    expect(log.draft.current).toBe('先看这张图')
    expect(log.rail.current).toEqual([])
    expect(done).not.toHaveBeenCalled()
    unhook()
  })

  it('does not merge into a box that is already sending', () => {
    const log = stubComposer({ draft: '先看这张图', phase: 'submitting' })
    const armed = park(log)
    const done = vi.fn()
    const unhook = holdSubmit(armed, done)
    log.conversation.input.shell('s1').submit?.()
    expect(log.submits).toEqual(['先看这张图'])
    expect(done).not.toHaveBeenCalled()
    unhook()
  })

  it('leaves the block out when the rail refuses the picture', () => {
    const log = stubComposer({ draft: '先看这张图', add: 'refuse' })
    const armed = park(log, new File(['png'], 'a.png', { type: 'image/png' }))
    const done = vi.fn()
    const unhook = holdSubmit(armed, done)
    log.conversation.input.shell('s1').submit?.()
    // Half a review — the text without the picture it says it carries — is worse than
    // no send: the box goes back the way the reader left it and the card waits.
    expect(log.submits).toEqual(['先看这张图'])
    expect(log.rail.current).toEqual([])
    // The reader's own press still went out; the annotation did not, so the card stays
    // armed and the next press tries again.
    expect(done).not.toHaveBeenCalled()
    unhook()
  })

  it('leaves the block out when the rail throws rather than refuses', () => {
    const log = stubComposer({ draft: '先看这张图', add: 'throw' })
    const armed = park(log, new File(['png'], 'a.png', { type: 'image/png' }))
    const unhook = holdSubmit(armed, vi.fn())
    log.conversation.input.shell('s1').submit?.()
    expect(log.submits).toEqual(['先看这张图'])
    unhook()
  })

  it('leaves the block out when the box will not take the write', () => {
    const log = stubComposer({ write: 'throw' })
    const armed = park(log)
    const unhook = holdSubmit(armed, vi.fn())
    log.conversation.input.shell('s1').submit?.()
    expect(log.submits).toEqual([''])
    unhook()
  })

  it('carries every card in the queue on one press, oldest first', () => {
    const log = stubComposer({ draft: '看一下' })
    const first = park(log)
    const second = defined(armReview(log.conversation, 's1', '【附图标注】/w/second.svg', undefined))
    const doneFirst = vi.fn()
    const doneSecond = vi.fn()
    const unhookFirst = holdSubmit(first, doneFirst)
    const unhookSecond = holdSubmit(second, doneSecond)
    log.conversation.input.shell('s1').submit?.()
    const sent = defined(log.submits[0])
    // One press is one message, and it carries both reviews in the order the cards
    // stand in the dock: the reader wrote one sentence about two figures.
    expect(sent).toBe(`看一下\n\n${first.text}\n\n${second.text}`)
    expect(doneFirst).toHaveBeenCalledTimes(1)
    expect(doneSecond).toHaveBeenCalledTimes(1)
    unhookFirst()
    unhookSecond()
  })

  it('lets the card go when the press queued the message instead of sending it', () => {
    const log = stubComposer({ draft: '看一下', submit: 'refuse', phaseAfter: 'queued' })
    const armed = park(log)
    const done = vi.fn()
    const unhook = holdSubmit(armed, done)
    log.conversation.input.shell('s1').submit?.()
    // Queued behind a running turn is still on its way: the block stays in the draft
    // and the card is spent, whatever the draft holds.
    expect(log.draft.current).toBe(`看一下\n\n${armed.text}`)
    expect(log.removed).toEqual([])
    expect(done).toHaveBeenCalledTimes(1)
    unhook()
  })

  it('lets the card go when the box disappears with the send', () => {
    const log = stubComposer({ draft: '看一下', reads: 1 })
    const armed = park(log)
    const done = vi.fn()
    const unhook = holdSubmit(armed, done)
    log.conversation.input.shell('s1').submit?.()
    // The press ran the reader's send; whatever became of the box after it, there is
    // nothing left here to put back or to take out.
    expect(defined(log.submits[0])).toContain(armed.text)
    expect(done).toHaveBeenCalledTimes(1)
    unhook()
  })

  it('arms a picture but sends nothing when the box cannot hold it', () => {
    const log = stubComposer({ draft: '看一下', add: 'none' })
    const armed = park(log, new File(['png'], 'a.png', { type: 'image/png' }))
    const done = vi.fn()
    const unhook = holdSubmit(armed, done)
    log.conversation.input.shell('s1').submit?.()
    // A box with no rail cannot hold the review picture; a message that promises one
    // it does not carry is worse than the block staying behind.
    expect(armed.attachmentIds).toEqual(['a1'])
    expect(log.submits).toEqual(['看一下'])
    expect(done).not.toHaveBeenCalled()
    unhook()
  })

  it('puts the box back without a rail to take the picture out of', () => {
    const log = stubComposer({ draft: '看一下', write: 'throw', remove: 'none' })
    const armed = park(log, new File(['png'], 'a.png', { type: 'image/png' }))
    const done = vi.fn()
    const unhook = holdSubmit(armed, done)
    expect(() => { log.conversation.input.shell('s1').submit?.() }).not.toThrow()
    // The write failed, so the block never reached a draft: the press carried the
    // reader's words alone, and the id the rail took stays there — there is no member
    // to hand it back to, and that is the host's business, not the reader's.
    expect(log.submits).toEqual(['看一下'])
    expect(done).not.toHaveBeenCalled()
    unhook()
  })

  it('takes back the picture it added when the write fails after it', () => {
    const log = stubComposer({ draft: '看一下', write: 'throw' })
    const armed = park(log, new File(['png'], 'a.png', { type: 'image/png' }))
    const unhook = holdSubmit(armed, vi.fn())
    log.conversation.input.shell('s1').submit?.()
    // The rail took the picture before the write failed, so the picture goes back with
    // the block that never got into a draft.
    expect(log.removed).toEqual(['a1'])
    unhook()
  })

  it('leaves the reader their words even when the box will not take them back', () => {
    const log = stubComposer({ draft: '看一下', submit: 'refuse', write: 'throw-restore' })
    const armed = park(log)
    const done = vi.fn()
    const unhook = holdSubmit(armed, done)
    expect(() => {
      log.conversation.input.shell('s1').submit?.()
    }).not.toThrow()
    expect(log.removed).toEqual([])
    expect(done).not.toHaveBeenCalled()
    unhook()
  })

  it('writes one card that says the same thing only once', () => {
    const log = stubComposer({ draft: '看一下' })
    const first = park(log)
    const second = park(log)
    expect(second.text).toBe(first.text)
    const unhookFirst = holdSubmit(first, vi.fn())
    const unhookSecond = holdSubmit(second, vi.fn())
    log.conversation.input.shell('s1').submit?.()
    // Two cards over the same message are one block in the draft: the press merges
    // what is missing, and the block was already there.
    expect(log.submits).toEqual([`看一下\n\n${first.text}`])
    expect(defined(log.submits[0]).split(first.text)).toHaveLength(2)
    unhookFirst()
    unhookSecond()
  })

  it('unhooks back to the box\'s own send', () => {
    const log = stubComposer({ draft: '先看这张图' })
    const armed = park(log)
    const done = vi.fn()
    const unhook = holdSubmit(armed, done)
    unhook()
    log.conversation.input.shell('s1').submit?.()
    // The card is gone, so the press is the reader's alone again.
    expect(log.submits).toEqual(['先看这张图'])
    expect(done).not.toHaveBeenCalled()
  })

  it('leaves a card armed after it alone hooked', () => {
    const log = stubComposer({ draft: '看一下' })
    const first = park(log)
    const second = park(log)
    const doneSecond = vi.fn()
    const unhookFirst = holdSubmit(first, vi.fn())
    const unhookSecond = holdSubmit(second, doneSecond)
    // The older card is dropped first; the newer one must keep its own hook, and the
    // card that was dropped must not ride it.
    unhookFirst()
    log.conversation.input.shell('s1').submit?.()
    expect(log.submits).toEqual([`看一下\n\n${second.text}`])
    expect(doneSecond).toHaveBeenCalledTimes(1)
    unhookSecond()
  })

  it('says nothing when the shell has no send to hook', () => {
    const log = stubComposer({ submit: 'none' })
    const shell = log.conversation.input.shell('s1')
    const unhook = holdSubmit({ shell, text: '【附图标注】x', attachmentIds: [] }, vi.fn())
    expect(() => { unhook() }).not.toThrow()
    // Nothing was armed, because there was no send to arm it on.
    expect(armReview(log.conversation, 's1', '【附图标注】x', undefined)).toBeUndefined()
  })

  it('says nothing when the box will not be patched', () => {
    const log = stubComposer()
    const armed = park(log)
    const frozen = Object.freeze(log.conversation.input.shell('s1'))
    const unhook = holdSubmit({ ...armed, shell: frozen }, vi.fn())
    // A shell it cannot patch is a shell whose send stays its own: no throw, no merge.
    expect(() => { unhook() }).not.toThrow()
  })

  it('says nothing when the patch cannot be undone', () => {
    const log = stubComposer({ draft: '先看这张图' })
    const armed = park(log)
    const shell = log.conversation.input.shell('s1')
    const unhook = holdSubmit(armed, vi.fn())
    // A host that locks the member after the fact leaves the patch in place; the card
    // dropping off must not throw at the reader.
    Object.defineProperty(shell, 'submit', { configurable: false, writable: false, value: shell.submit })
    expect(() => { unhook() }).not.toThrow()
  })

  it('drops a card twice without putting the send back twice', () => {
    const log = stubComposer()
    const armed = park(log)
    const original = log.conversation.input.shell('s1').submit
    const unhook = holdSubmit(armed, vi.fn())
    unhook()
    // A second call has nothing left to take off, and must not put the host's own send
    // back a second time — the box may have moved on since.
    expect(() => { unhook() }).not.toThrow()
    expect(log.conversation.input.shell('s1').submit).toBe(original)
  })

  it('leaves a send that was already replaced alone', () => {
    const log = stubComposer()
    const armed = park(log)
    const shell = log.conversation.input.shell('s1')
    const unhook = holdSubmit(armed, vi.fn())
    const replaced = vi.fn()
    // A host that installed its own send after the patch has already unhooked this
    // one; restoring over it would put a merge in front of a send that never asked.
    shell.submit = replaced
    unhook()
    expect(shell.submit).toBe(replaced)
  })

  it('keeps its hands off a box it cannot read', () => {
    const log = stubComposer()
    const armed = park(log)
    const done = vi.fn()
    const shell = log.conversation.input.shell('s1')
    const original = shell.submit
    const hostile = {
      ...shell,
      get snapshot(): ComposerShellLike['snapshot'] { throw new Error('the box is disposed') },
      submit: () => { original?.() },
    }
    const unhook = holdSubmit({ ...armed, shell: hostile }, done)
    hostile.submit()
    // Merging blind would put the block into a draft nobody can vouch for, so this
    // press carries the reader's own words only — and the card stays for the next one.
    expect(log.submits).toEqual([''])
    expect(done).not.toHaveBeenCalled()
    expect(() => { unhook() }).not.toThrow()
  })
})

describe('taking an armed annotation back out of the composer', () => {
  it('gives the held picture back, and touches no text', () => {
    const log = stubComposer({ draft: '先看这张图' })
    const armed = park(log, new File(['png'], 'a.png', { type: 'image/png' }))
    expect(armed.attachmentIds).toEqual(['a1'])
    disarmReview(armed, log.conversation)
    // The card is dropped, so the upload it was holding goes with it — but the draft
    // was never the card's, and it comes out of the drop untouched.
    expect(log.released).toEqual(['a1'])
    expect(log.written).toEqual([])
    expect(log.draft.current).toBe('先看这张图')
  })

  it('drops a picture the rail did take back', () => {
    const log = stubComposer()
    const armed = park(log, new File(['png'], 'a.png', { type: 'image/png' }))
    // The reader added the same picture by hand; the drop takes only the card's copy.
    log.conversation.input.shell('s1').addAttachments?.(['a1'])
    disarmReview(armed, log.conversation)
    expect(log.removed).toEqual(['a1'])
    expect(log.rail.current).toEqual([])
  })

  it('gives the attachment back even without the service to tell', () => {
    const log = stubComposer()
    const armed = park(log, new File(['png'], 'a.png', { type: 'image/png' }))
    expect(() => { disarmReview(armed, undefined) }).not.toThrow()
    expect(log.released).toEqual([])
  })

  it('gives it back even when the service cannot forget it', () => {
    const log = stubComposer()
    const armed = park(log, new File(['png'], 'a.png', { type: 'image/png' }))
    const mute: ComposerLike = { input: log.conversation.input }
    expect(() => { disarmReview(armed, mute) }).not.toThrow()
  })

  it('does nothing when there was nothing to hold', () => {
    const log = stubComposer()
    const armed = park(log)
    disarmReview(armed, log.conversation)
    expect(log.released).toEqual([])
    expect(log.removed).toEqual([])
  })
})
