// @vitest-environment jsdom
/** The bubbles over the figure: what one says, and the four events said through them. */
import { act, type ReactElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  TOAST_HOLD_MS, TOAST_LEAVE_MS, TOAST_LIMIT, TOAST_NOTE_HEIGHT, TOAST_SEND_HEIGHT,
  TOAST_SPEED_MS, TOAST_TASK_TIMEOUT_MS,
  addEntry, cardText, depthOpacity, dropTone, holdFor, patchEntry, planToast, removeEntry,
  settleEntry, stackLayout, toastHeight,
  type ToastCard, type ToastEntry, type ToastOutcome, type ToastPhase,
} from '../src/client/annotator/toast-model'
import { ToastStack, prefersReducedMotion, useToasts, type Toasts } from '../src/client/annotator/toasts'
import { zh } from '../src/client/locales'
import type { Translate } from '../src/client/translate'
import { defined } from './dom'

/** The panel's own copy, so the specs assert what the reader reads. */
const copy: Record<string, string> = zh
const t: Translate = (key, vars) => {
  const line = copy[key] ?? key
  if (vars === undefined) return line
  return line.replace(/\{(\w+)\}/gu, (placeholder, name: string) => {
    const value = vars[name]
    return value === undefined ? placeholder : String(value)
  })
}

/** One card, with only the fields a spec cares about spelled out. */
function card(over: Partial<ToastCard> = {}): ToastCard {
  return {
    id: 1, kind: 'note', icon: 'pencil', tone: 'info', text: '先说一句',
    done: undefined, failed: undefined, task: undefined, ...over,
  }
}

/** One entry in the stack. */
function entry(
  over: Partial<ToastCard> = {},
  phase: ToastPhase = 'typing',
  outcome: ToastOutcome = 'none',
): ToastEntry {
  return { card: card(over), phase, outcome }
}

describe('what a card says', () => {
  it('fades the older cards, but never past a third of full', () => {
    expect(depthOpacity(0)).toBe(1)
    expect(depthOpacity(3)).toBeCloseTo(0.4)
    // The oldest is still readable: it is not an archive, but it is not gone either.
    expect(depthOpacity(9)).toBe(0.35)
  })

  it('tucks each card under the one above it and reports the height that takes', () => {
    const layout = stackLayout([entry({ id: 1 }), entry({ id: 2, kind: 'send', icon: 'dialog' })])
    expect(layout.rows.map(row => [row.index, row.depth, row.offset])).toEqual([
      [0, 1, 0],
      [1, 0, TOAST_NOTE_HEIGHT - 12],
    ])
    expect(layout.height).toBe(TOAST_NOTE_HEIGHT - 12 + TOAST_SEND_HEIGHT)
  })

  it('is nothing tall when there is nothing to say', () => {
    expect(stackLayout([])).toEqual({ rows: [], height: 0 })
  })

  it('is as tall as the kind of card it holds', () => {
    expect(toastHeight('note')).toBe(TOAST_NOTE_HEIGHT)
    expect(toastHeight('send')).toBe(TOAST_SEND_HEIGHT)
  })

  it('picks the sentence the outcome calls for', () => {
    const send = card({ kind: 'send', text: '发送中', done: '已发送', failed: '发送失败' })
    expect(cardText(send, 'none')).toBe('发送中')
    expect(cardText(send, 'ok')).toBe('已发送')
    expect(cardText(send, 'fail')).toBe('发送失败')
  })

  it('keeps its own line when the outcome has no sentence of its own', () => {
    // A card with no destination is one the panel said plainly, and a plain card has
    // one line whichever way its work ended.
    const plain = card()
    expect(cardText(plain, 'ok')).toBe('先说一句')
    expect(cardText(plain, 'fail')).toBe('先说一句')
  })

  it('holds a failure longer than an answer, because a failure is news to act on', () => {
    expect(holdFor('fail')).toBeGreaterThan(holdFor('ok'))
    expect(holdFor('none')).toBe(TOAST_HOLD_MS)
  })

  it('draws the four annotate events, each with its own glyph', () => {
    // The event names the sentence and the icon, so no surface has to know the copy
    // or which of the two destinations this one is.
    expect(planToast('annotate.none', t)).toMatchObject({ kind: 'note', icon: 'pencil', text: t('toastNone') })
    expect(planToast('annotate.save.all', t)).toMatchObject({ kind: 'send', icon: 'dialog', done: t('toastSavedAll') })
    expect(planToast('annotate.save.one', t)).toMatchObject({ kind: 'send', icon: 'dialog', done: t('toastSavedOne') })
    expect(planToast('annotate.send.agent', t)).toMatchObject({ kind: 'send', icon: 'agent', done: t('toastSentAgent') })
  })

  it('says it is sending until the work answers', () => {
    expect(planToast('annotate.save.all', t).text).toBe(t('toastSending'))
    expect(planToast('annotate.send.agent', t).failed).toBe(t('toastFailed'))
  })
})

describe('the stack of cards', () => {
  it('replaces a sentence rather than repeating it', () => {
    // The reader counts bubbles that differ: the same news twice is one bubble that
    // moved, and a second would fade the first to make room for nothing.
    const first = entry({ id: 1, text: '已存入草稿' })
    const again = entry({ id: 2, text: '已存入草稿' })
    expect(addEntry([first], again).map(one => one.card.id)).toEqual([2])
  })

  it('keeps two notes that say different things', () => {
    expect(addEntry([entry({ id: 1, text: 'a' })], entry({ id: 2, text: 'b' }))).toHaveLength(2)
  })

  it('knows two sends apart by what they say they did, not by what they say on the way', () => {
    // Both say "sending" until they land; that sentence is not the news, the outcome is.
    const going = entry({ id: 1, kind: 'send', icon: 'agent', text: '发送中', done: '已发送给智能体' })
    const alsoGoing = entry({ id: 2, kind: 'send', icon: 'agent', text: '发送中', done: '已发送给智能体' })
    expect(addEntry([going], alsoGoing).map(one => one.card.id)).toEqual([2])
    const toDraft = entry({ id: 3, kind: 'send', icon: 'dialog', done: '已存入草稿' })
    expect(addEntry([going], toDraft)).toHaveLength(2)
  })

  it('keeps a note and a send that happen to say the same thing', () => {
    expect(addEntry([entry({ id: 1, text: '同' })], entry({ id: 2, kind: 'send', text: '同' }))).toHaveLength(2)
  })

  it('keeps only the last few, because a fifth bubble is a log', () => {
    let list: readonly ToastEntry[] = []
    for (let id = 1; id <= TOAST_LIMIT + 1; id += 1) list = addEntry(list, entry({ id, text: `line ${id}` }))
    expect(list).toHaveLength(TOAST_LIMIT)
    expect(list.map(one => one.card.id)).toEqual([2, 3, 4, 5])
  })

  it('moves one card along and leaves the rest where they are', () => {
    const list = [entry({ id: 1 }), entry({ id: 2 })]
    const next = patchEntry(list, 2, { phase: 'hold', outcome: 'ok' })
    expect(next[0]).toBe(list[0])
    expect(next[1]?.phase).toBe('hold')
    expect(next[1]?.outcome).toBe('ok')
  })

  it('does nothing at all to a card that is already gone', () => {
    const list = [entry({ id: 1 })]
    // The same array back: a render that patches nothing must not churn the stack.
    expect(patchEntry(list, 9, { phase: 'hold' })).toBe(list)
    expect(settleEntry(list, 9, 'ok')).toBe(list)
  })

  it('lands a card into its answer, ready to say it', () => {
    const [landed] = settleEntry([entry({ id: 1, kind: 'send' }, 'sending')], 1, 'ok')
    expect(landed?.phase).toBe('typing')
    expect(landed?.outcome).toBe('ok')
  })

  it('leaves a card that is already on its way out leaving', () => {
    // The work a reader closed the bubble on may finish afterwards; a fading card
    // must not start talking again on its way off the screen.
    const [landed] = settleEntry([entry({ id: 1 }, 'leaving')], 1, 'fail')
    expect(landed?.phase).toBe('leaving')
    expect(landed?.outcome).toBe('fail')
  })

  it('takes one out by its identity', () => {
    expect(removeEntry([entry({ id: 3 }), entry({ id: 2 })], 3).map(one => one.card.id)).toEqual([2])
  })

  it('takes back every card of a tone, and only that tone', () => {
    // A write that goes through retires the failure it was answering; the news of the
    // hand-off beside it is not the failure's to drop.
    const list = [entry({ id: 1, tone: 'error' }), entry({ id: 2, tone: 'ok' }), entry({ id: 3, tone: 'error' })]
    expect(dropTone(list, 'error').map(one => one.card.id)).toEqual([2])
  })
})

describe('whether motion is wanted', () => {
  afterEach(() => { vi.unstubAllGlobals() })

  it('leaves motion in unless the platform says otherwise', () => {
    // jsdom has no matchMedia: a platform that cannot answer gets the animation, which
    // can be watched, rather than a still frame that cannot be read.
    expect(prefersReducedMotion()).toBe(false)
  })

  it('hears the platform ask for less motion', () => {
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: () => ({ matches: true }) })
    expect(prefersReducedMotion()).toBe(true)
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: () => ({ matches: false }) })
    expect(prefersReducedMotion()).toBe(false)
    Reflect.deleteProperty(window, 'matchMedia')
  })

  it('answers without a window at all', () => {
    vi.stubGlobal('window', undefined)
    expect(prefersReducedMotion()).toBe(false)
  })
})

describe('the stack a surface mounts', () => {
  let host: HTMLDivElement
  let root: Root
  let view: Toasts | undefined

  beforeEach(() => {
    vi.useFakeTimers()
    view = undefined
    host = document.createElement('div')
    document.body.append(host)
    root = createRoot(host)
  })

  afterEach(() => {
    act(() => { root.unmount() })
    host.remove()
    vi.useRealTimers()
  })

  /** A surface, as a body mounts one. */
  function Harness(props: { readonly reduced?: boolean }): ReactElement {
    const toasts = useToasts(t)
    view = toasts
    // An omitted prop is not the same as `reduced={false}`: it is the platform's call.
    const motion = props.reduced === undefined ? {} : { reduced: props.reduced }
    return <ToastStack view={toasts} label="关闭" resendLabel={t('toastResend')} {...motion} />
  }

  /** Draw the surface. */
  function mount(reduced?: boolean): void {
    act(() => { root.render(reduced === undefined ? <Harness /> : <Harness reduced={reduced} />) })
  }

  /** Run the clock, flushing the promises it lands. */
  async function waitFor(ms: number): Promise<void> {
    await act(async () => { await vi.advanceTimersByTimeAsync(ms) })
  }

  /** The stack as the surface holds it, for what only the surface can reach. */
  function stack(): Toasts {
    return defined(view)
  }

  /** Work a spec decides when to end. */
  function unfinished(): { readonly task: () => Promise<void>; readonly settle: (ok: boolean) => void } {
    let settle: (ok: boolean) => void = () => {}
    const promise = new Promise<void>((resolve, reject) => {
      settle = (ok: boolean) => { if (ok) resolve(); else reject(new Error('refused')) }
    })
    return { task: () => promise, settle }
  }

  /** The bubbles, oldest first. */
  function cards(): HTMLElement[] {
    return [...host.querySelectorAll<HTMLElement>('.da-toast')]
  }

  /** The sentence each bubble is showing. */
  function lines(): (string | null | undefined)[] {
    return cards().map(node => node.querySelector('.da-toast-msg')?.textContent)
  }

  it('draws nothing at all when there is nothing to say', () => {
    mount()
    expect(host.querySelector('.da-toasts')).toBeNull()
  })

  it('says a line plainly, then lets it leave on its own', async () => {
    mount()
    act(() => { stack().note({ tone: 'info', text: '已复制' }) })
    expect(cards()).toHaveLength(1)
    // A note is a pencil, not a destination: it is the panel talking to itself.
    expect(cards()[0]?.getAttribute('data-kind')).toBe('note')
    expect(host.querySelector('.da-toast-ico .da-dest')).toBeNull()
    expect(host.querySelector('.da-toasts')?.getAttribute('role')).toBe('status')
    expect(host.querySelector('.da-toasts')?.getAttribute('aria-live')).toBe('polite')

    await waitFor('已复制'.length * TOAST_SPEED_MS)
    expect(lines()).toEqual(['已复制'])
    // It holds for its full time, then fades before it is taken out.
    await waitFor(TOAST_HOLD_MS)
    expect(cards()[0]?.getAttribute('data-leaving')).toBe('true')
    await waitFor(TOAST_LEAVE_MS)
    expect(cards()).toHaveLength(0)
  })

  it('spells the news about the marks out a letter at a time', async () => {
    mount()
    act(() => { void stack().notify('annotate.none') })
    await waitFor(TOAST_SPEED_MS * 2)
    expect(lines()[0]).toBe('还没')
    expect(host.querySelector('.da-toast-msg')?.getAttribute('data-typing')).toBe('true')
  })

  it('says an aside at once, because the panel should not be slow about its own news', async () => {
    mount()
    act(() => { stack().note({ tone: 'error', text: '磁盘满了' }) })
    // Nothing to spell out: the line is there on the first frame, and no caret shows.
    expect(lines()).toEqual(['磁盘满了'])
    expect(host.querySelector('.da-toast-msg')?.getAttribute('data-typing')).toBe('false')
  })

  it('answers a note at once, because there is no work behind it', async () => {
    mount()
    const outcome = await act(async () => stack().notify('annotate.none'))
    expect(outcome).toBe('ok')
    // Nothing was marked: the sentence asks for marks, and no task was run.
    await waitFor(t('toastNone').length * TOAST_SPEED_MS)
    expect(lines()[0]).toBe(t('toastNone'))
    expect(cards()[0]?.getAttribute('data-kind')).toBe('note')
  })

  it('carries a hand-off and then says it landed', async () => {
    mount()
    const work = vi.fn(() => Promise.resolve())
    let outcome: ToastOutcome | undefined
    await act(async () => { outcome = await stack().notify('annotate.send.agent', work) })
    expect(work).toHaveBeenCalledTimes(1)
    expect(outcome).toBe('ok')
    const [node] = cards()
    expect(node?.getAttribute('data-kind')).toBe('send')
    expect(node?.getAttribute('data-state')).toBe('ok')
    expect(node?.querySelector('.da-toast-ico .da-dest')).not.toBeNull()
    expect(node?.getAttribute('data-text')).toBe(t('toastSentAgent'))
  })

  it('says it is sending while the work is still going', () => {
    mount()
    const work = unfinished()
    act(() => { void stack().notify('annotate.save.all', work.task) })
    const [node] = cards()
    expect(node?.getAttribute('data-state')).toBe('sending')
    expect(node?.getAttribute('data-text')).toBe(t('toastSending'))
  })

  it('says a failure in white, and offers to run it again in the same slot', async () => {
    mount()
    const work = unfinished()
    act(() => { void stack().notify('annotate.send.agent', work.task) })
    await act(async () => { work.settle(false) })
    const [node] = cards()
    expect(node?.getAttribute('data-state')).toBe('fail')
    expect(node?.getAttribute('data-text')).toBe(t('toastFailed'))
    expect(node?.querySelector('.da-toast-resend')).not.toBeNull()
    // Never a colour of its own: the cross is white, like the ring around it.
    expect(node?.querySelector('.da-cross')).not.toBeNull()
    expect(node?.querySelector('.da-toast-ico')?.className).not.toMatch(/error|danger|success/u)
  })

  it('holds a failure longer than an answer, so it is read', async () => {
    mount()
    const work = unfinished()
    act(() => { void stack().notify('annotate.save.one', work.task) })
    await act(async () => { work.settle(false) })
    await waitFor(t('toastFailed').length * TOAST_SPEED_MS)
    await waitFor(TOAST_HOLD_MS)
    // Still there: a failure waits to be acted on rather than timing out under the
    // reader's eyes with the mark still unsaved.
    expect(cards()[0]?.getAttribute('data-leaving')).toBe('false')
  })

  it('runs the same work again when the reader asks for it', async () => {
    mount()
    const task = vi.fn<() => Promise<void>>()
    task.mockRejectedValueOnce(new Error('refused')).mockResolvedValueOnce(undefined)
    act(() => { void stack().notify('annotate.send.agent', task) })
    await waitFor(1)
    expect(task).toHaveBeenCalledTimes(1)
    act(() => { defined(cards()[0]?.querySelector<HTMLButtonElement>('.da-toast-resend')).click() })
    expect(task).toHaveBeenCalledTimes(2)
    // Back to sending, with nothing left over from the attempt before.
    expect(cards()[0]?.getAttribute('data-state')).toBe('sending')
    await waitFor(1)
    expect(cards()[0]?.getAttribute('data-state')).toBe('ok')
  })

  it('has nothing to run again once the card is gone', () => {
    mount()
    act(() => { stack().note({ tone: 'info', text: '已复制' }) })
    // A press that lands after the bubble has been taken out is not an error.
    act(() => { stack().retry(99) })
    expect(cards()).toHaveLength(1)
  })

  it('answers even when the work never does', async () => {
    mount()
    const work = unfinished()
    let outcome: ToastOutcome | undefined
    act(() => { void stack().notify('annotate.send.agent', work.task).then(ended => { outcome = ended }) })
    expect(outcome).toBeUndefined()
    await waitFor(TOAST_TASK_TIMEOUT_MS)
    expect(outcome).toBe('fail')
    expect(cards()[0]?.getAttribute('data-state')).toBe('fail')
    // The late answer is not a second outcome.
    await act(async () => { work.settle(true) })
    expect(cards()[0]?.getAttribute('data-state')).toBe('fail')
  })

  it('answers a send that has no work behind it at once', async () => {
    mount()
    let outcome: ToastOutcome | undefined
    act(() => { void stack().notify('annotate.save.all').then(ended => { outcome = ended }) })
    await waitFor(0)
    expect(outcome).toBe('ok')
  })

  it('takes its sentences from the caller for a send the four events do not name', async () => {
    mount()
    const work = vi.fn(() => Promise.resolve())
    let outcome: ToastOutcome | undefined
    await act(async () => {
      outcome = await stack().send({
        icon: 'agent', pending: '正在发送', done: '发送完成', failed: '发送失败', task: work,
      })
    })
    expect(outcome).toBe('ok')
    expect(cards()[0]?.getAttribute('data-text')).toBe('发送完成')
  })

  it('replaces a line that says the same thing again', () => {
    mount()
    act(() => { stack().note({ tone: 'info', text: '已复制' }) })
    act(() => { stack().note({ tone: 'info', text: '已复制' }) })
    expect(cards()).toHaveLength(1)
  })

  it('takes every card out when the surface is reset', () => {
    mount()
    act(() => {
      stack().note({ tone: 'info', text: 'a' })
      stack().note({ tone: 'info', text: 'b' })
      stack().note({ tone: 'error', text: 'c' })
    })
    expect(cards()).toHaveLength(3)
    act(() => { stack().dropTone('error') })
    expect(cards().map(node => node.getAttribute('data-text'))).toEqual(['a', 'b'])
    act(() => { stack().clear() })
    expect(host.querySelector('.da-toasts')).toBeNull()
  })

  it('gives each bubble a way out, which fades it before it goes', async () => {
    mount()
    act(() => { stack().note({ tone: 'info', text: '已复制' }) })
    act(() => { defined(cards()[0]?.querySelector<HTMLButtonElement>('.da-toast-close')).click() })
    expect(cards()[0]?.getAttribute('data-leaving')).toBe('true')
    expect(cards()).toHaveLength(1)
    await waitFor(TOAST_LEAVE_MS)
    expect(cards()).toHaveLength(0)
  })

  it('stops counting down while the pointer is on the bubble', async () => {
    mount()
    act(() => { stack().note({ tone: 'info', text: '已复制' }) })
    await waitFor('已复制'.length * TOAST_SPEED_MS)
    const node = defined(cards()[0])
    act(() => {
      node.dispatchEvent(new window.MouseEvent('pointerover', { bubbles: true, relatedTarget: document.body }))
    })
    await waitFor(TOAST_HOLD_MS * 2)
    expect(cards()).toHaveLength(1)
    act(() => {
      node.dispatchEvent(new window.MouseEvent('pointerout', { bubbles: true, relatedTarget: document.body }))
    })
    await waitFor(TOAST_HOLD_MS)
    expect(cards()[0]?.getAttribute('data-leaving')).toBe('true')
  })

  it('shows the whole line at once when motion is not wanted', () => {
    mount(true)
    act(() => { stack().note({ tone: 'info', text: '已复制' }) })
    expect(lines()).toEqual(['已复制'])
    // No frame to wait for, so the card is already where it will rest.
    expect(cards()[0]?.style.opacity).toBe('1')
  })

  it('does not spell a line out when motion is not wanted', () => {
    mount(true)
    // A task that never lands, so the card stays exactly where the typing would have
    // been: the line is whole because there is nothing to animate it.
    act(() => { void stack().notify('annotate.none', () => new Promise(() => {})) })
    expect(lines()).toEqual([copy.toastNone])
  })

  it('draws a card already in place when motion is off, and one rising when it is on', async () => {
    mount(false)
    act(() => { stack().note({ tone: 'info', text: '已复制' }) })
    expect(cards()[0]?.style.transform).toBe('translateY(14px)')
    await waitFor(16)
    expect(cards()[0]?.style.transform).toBe('translateY(0px)')
  })

  it('fades the older bubbles as the stack grows', () => {
    mount(true)
    act(() => {
      stack().note({ tone: 'info', text: 'a' })
      stack().note({ tone: 'info', text: 'b' })
    })
    expect(cards()[0]?.style.opacity).toBe('0.8')
    expect(cards()[1]?.style.opacity).toBe('1')
    act(() => { stack().note({ tone: 'info', text: 'c' }) })
    expect(cards()).toHaveLength(3)
    expect(cards()[0]?.style.opacity).toBe('0.6')
    expect(cards()[2]?.style.opacity).toBe('1')
  })

  it('lets a closed bubble finish its work without reopening', async () => {
    mount()
    const work = unfinished()
    act(() => { void stack().notify('annotate.send.agent', work.task) })
    act(() => { defined(cards()[0]?.querySelector<HTMLButtonElement>('.da-toast-close')).click() })
    await act(async () => { work.settle(true) })
    // Closed is closed: the outcome is not back on the screen in a bubble that left.
    expect(cards()[0]?.getAttribute('data-leaving')).toBe('true')
  })

  it('answers a caller whose bubble left with the surface', async () => {
    mount()
    const work = unfinished()
    const answered = vi.fn()
    act(() => { void stack().notify('annotate.send.agent', work.task).then(answered) })
    act(() => { root.unmount() })
    await act(async () => { work.settle(true) })
    // Nothing is left to answer: the surface that asked is gone.
    expect(answered).not.toHaveBeenCalled()
  })
})
