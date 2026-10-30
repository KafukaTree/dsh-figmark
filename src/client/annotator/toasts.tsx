/**
 * The bubbles over the figure — the panel's own voice.
 *
 * A card says one short sentence, typed out at reading speed, and stays just long
 * enough to be read. A send card says what it is doing while it does it, and ends
 * with a white ring and a check or a cross: never a colour, because the gestures of
 * this product are a pencil and a mark, and a green tick would be a second language
 * for the same news. A failure is not the end of the sentence either — the × that
 * would close it becomes the ↻ that runs it again.
 *
 * Every timer lives in the card that owns it and is cleared when it goes, and the
 * stack is decoration over a working figure: it only takes a pointer event meant
 * for one of its buttons.
 * @module dsh-figmark/client/annotator/toasts
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react'
import type { Translate } from '../translate'
import {
  TOAST_LEAVE_MS, TOAST_SPEED_MS, TOAST_TASK_TIMEOUT_MS, addEntry, cardText, depthOpacity,
  dropTone as dropToneEntries,
  holdFor, patchEntry, planToast, removeEntry, settleEntry, stackLayout,
  type ToastCard, type ToastEntry, type ToastEvent, type ToastOutcome, type ToastPhase, type ToastTone,
} from './toast-model'
import { CheckIcon, CrossIcon, DestIcon, PencilIcon, ResendIcon, SendRings } from './toast-icons'

export type { ToastEntry, ToastEvent, ToastOutcome, ToastSend, ToastTone } from './toast-model'

/** How far the entry animation starts below its resting place. */
const ENTER_SHIFT = 14
/** One frame later, so the browser has a starting point to move from. */
const ENTER_FRAME_MS = 16
/** How long a card shakes for, once. */
const SHAKE_MS = 560

/** The stack and the ways in. One object, so a surface mounts it in one line. */
export interface Toasts {
  readonly entries: readonly ToastEntry[]
  /** Say a line plainly: no task, no destination, gone in a few seconds. */
  note: (line: { readonly tone: ToastTone; readonly text: string }) => void
  /**
   * Say what one of the four annotate events did.
   *
   * The event names the sentence, so no surface has to know the copy — and when
   * the event needs work done, that work is the second argument and is run again
   * for every retry rather than described again.
   * @param event - what just happened.
   * @param task - the work, if the event has any.
   * @returns how it ended, for a caller that has more to do afterwards.
   */
  notify: (event: ToastEvent, task?: () => Promise<unknown>) => Promise<ToastOutcome>
  /** A send whose copy is not one of the four events. */
  send: (options: {
    readonly icon: 'dialog' | 'agent'
    readonly pending: string
    readonly done: string
    readonly failed: string
    readonly task: () => Promise<unknown>
  }) => Promise<ToastOutcome>
  /** Move a card to its next stage: settled into a hold, or on its way out. */
  mark: (id: number, phase: 'hold' | 'leaving') => void
  /** Run a failed send again, in place. */
  retry: (id: number) => void
  /** Retire every card of a tone, as a write that went through retires its failure. */
  dropTone: (tone: ToastTone) => void
  /** Take a card out once it has faded. */
  remove: (id: number) => void
  /** Take them all out at once, for a surface that has just been reset. */
  clear: () => void
}

/**
 * Whether the reader asked for motion to be left out.
 * @returns true when the platform says so, and false when it cannot say.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  if (typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * The stack's state and the ways to put something in it.
 *
 * It lives in the surface rather than in the card because the surface is what
 * knows whether a hand-off worked, and because a send's promise has to be answered
 * even if the reader closes the bubble before it lands.
 * @param t - the translator seat the four events are named in.
 * @returns the stack and its verbs.
 */
export function useToasts(t: Translate): Toasts {
  const [entries, setEntries] = useState<readonly ToastEntry[]>([])
  const nextId = useRef(1)
  const settlers = useRef(new Map<number, (outcome: ToastOutcome) => void>())
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>())
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      for (const timer of timers.current) clearTimeout(timer)
      timers.current.clear()
    }
  }, [])

  const next = useCallback((): number => {
    const id = nextId.current
    nextId.current += 1
    return id
  }, [])

  /** Land a card: whatever sentence its outcome calls for, and answer the caller. */
  const settle = useCallback((id: number, outcome: ToastOutcome) => {
    setEntries(list => settleEntry(list, id, outcome))
    const answer = settlers.current.get(id)
    settlers.current.delete(id)
    answer?.(outcome)
  }, [])

  /**
   * Do the work a send card stands for.
   *
   * The task runs outside the card on purpose: the reader may close a bubble while
   * it is still going, and a hand-off must not be cancelled by a gesture aimed at
   * the news about it.
   */
  const begin = useCallback((card: ToastCard) => {
    let landed = false
    const land = (outcome: ToastOutcome): void => {
      if (landed) return
      landed = true
      clearTimeout(timer)
      timers.current.delete(timer)
      if (!alive.current) return
      settle(card.id, outcome)
    }
    const timer = setTimeout(() => { land('fail') }, TOAST_TASK_TIMEOUT_MS)
    timers.current.add(timer)
    // A rejection is turned into a bubble that says one short line, so this is the
    // only place its reason can still be read: a failure the reader cannot act on
    // belongs in the log, not in a sentence squeezed over the figure.
    void (card.task?.() ?? Promise.resolve()).then(() => { land('ok') }, reason => {
      console.error('[figmark] toast task failed', reason)
      land('fail')
    })
  }, [settle])

  const add = useCallback((card: ToastCard, phase: ToastPhase): void => {
    setEntries(list => addEntry(list, { card, phase, outcome: 'none' }))
  }, [])

  const launch = useCallback((card: ToastCard): Promise<ToastOutcome> => {
    const answer = new Promise<ToastOutcome>(resolve => { settlers.current.set(card.id, resolve) })
    add(card, 'sending')
    begin(card)
    return answer
  }, [add, begin])

  const notify = useCallback((event: ToastEvent, task?: () => Promise<unknown>): Promise<ToastOutcome> => {
    const plan = planToast(event, t)
    const card: ToastCard = { id: next(), ...plan, task: plan.kind === 'send' ? task : undefined }
    if (card.kind === 'note') {
      add(card, 'typing')
      return Promise.resolve('ok')
    }
    return launch(card)
  }, [add, launch, next, t])

  const send: Toasts['send'] = useCallback(options => launch({
    id: next(),
    kind: 'send',
    icon: options.icon,
    tone: 'info',
    text: options.pending,
    done: options.done,
    failed: options.failed,
    task: options.task,
  }), [launch, next])

  const note: Toasts['note'] = useCallback(line => {
    // An aside — a save failure, a menu row, a copy — is read at a glance and gone in
    // a few seconds. Spelling it out would make the panel feel slow about its own news;
    // the voice that types is the one about the marks.
    add({
      id: next(), kind: 'note', icon: 'pencil', tone: line.tone, text: line.text,
      done: undefined, failed: undefined, task: undefined,
    }, 'hold')
  }, [add, next])

  const patch = useCallback((id: number, changed: { readonly phase?: ToastPhase; readonly outcome?: ToastOutcome }): void => {
    setEntries(list => patchEntry(list, id, changed))
  }, [])

  const mark = useCallback((id: number, phase: 'hold' | 'leaving'): void => { patch(id, { phase }) }, [patch])

  const retry = useCallback((id: number): void => {
    const entry = entries.find(one => one.card.id === id)
    if (entry === undefined) return
    begin(entry.card)
    patch(id, { phase: 'sending', outcome: 'none' })
  }, [begin, entries, patch])

  const dropTone = useCallback((tone: ToastTone): void => {
    setEntries(list => dropToneEntries(list, tone))
  }, [])

  const clear = useCallback((): void => {
    setEntries([])
  }, [])

  const remove = useCallback((id: number): void => {
    setEntries(list => removeEntry(list, id))
  }, [])

  return useMemo(
    () => ({ entries, note, notify, send, mark, retry, dropTone, remove, clear }),
    [entries, note, notify, send, mark, retry, dropTone, remove, clear],
  )
}

/** One card, and how it is told about its own life. */
interface CardProps {
  readonly entry: ToastEntry
  readonly index: number
  readonly depth: number
  readonly offset: number
  readonly label: string
  readonly resendLabel: string
  readonly reduced: boolean
  readonly onPhase: (id: number, phase: 'hold' | 'leaving') => void
  readonly onRemove: (id: number) => void
  readonly onRetry: (id: number) => void
  readonly onClose: (id: number) => void
}

/**
 * The stack, drawn.
 *
 * Its place on screen belongs to the surface: the panel puts it over the top-left
 * of the canvas, which is where the eye already is after drawing a mark.
 * @param props - the stack to draw, its labels, and whether motion is wanted.
 * @returns the stack, or nothing at all when there is nothing to say.
 */
export function ToastStack(props: {
  readonly view: Toasts
  readonly label: string
  readonly resendLabel: string
  readonly reduced?: boolean
}): ReactElement | null {
  const { entries, mark, retry, remove } = props.view
  const reduced = props.reduced ?? prefersReducedMotion()
  if (entries.length === 0) return null
  const { rows, height } = stackLayout(entries)
  return (
    <div className="da-toasts" role="status" aria-live="polite" style={{ height }}>
      {rows.map(row => (
        <ToastCardView
          key={row.entry.card.id}
          entry={row.entry}
          index={row.index}
          depth={row.depth}
          offset={row.offset}
          label={props.label}
          resendLabel={props.resendLabel}
          reduced={reduced}
          onPhase={mark}
          onRemove={remove}
          onRetry={retry}
          onClose={(id: number) => { mark(id, 'leaving') }}
        />
      ))}
    </div>
  )
}

/**
 * One bubble.
 *
 * It owns three things its parent should not know about: how much of its sentence
 * is on screen, whether it has settled into place yet, and whether it is shaking.
 * The sentences themselves come from above, as does every phase that involves
 * work, so a re-render never restarts a typewriter or a hand-off.
 * @param props - the entry, where it sits, and the verbs it may call.
 * @returns the card.
 */
function ToastCardView(props: CardProps): ReactElement {
  const { entry, reduced, onPhase, onRemove } = props
  const { card } = entry
  const full = cardText(card, entry.outcome)
  const [shown, setShown] = useState(() => (entry.phase === 'hold' ? full : ''))
  const [entered, setEntered] = useState(reduced)
  const [shake, setShake] = useState(false)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    if (reduced) return
    const timer = setTimeout(() => { setEntered(true) }, ENTER_FRAME_MS)
    return () => { clearTimeout(timer) }
  }, [reduced])

  useEffect(() => {
    if (card.icon !== 'pencil') return
    const on = setTimeout(() => { setShake(true) }, ENTER_FRAME_MS + 140)
    return () => { clearTimeout(on) }
  }, [card.icon])

  useEffect(() => {
    if (entry.outcome !== 'fail') return
    setShake(true)
  }, [entry.outcome])

  useEffect(() => {
    if (!shake) return
    const timer = setTimeout(() => { setShake(false) }, SHAKE_MS)
    return () => { clearTimeout(timer) }
  }, [shake])

  useEffect(() => {
    if (entry.phase !== 'typing' && entry.phase !== 'sending') return
    const letters = Array.from(full)
    if (reduced) {
      setShown(full)
      if (entry.phase === 'typing') onPhase(card.id, 'hold')
      return
    }
    setShown('')
    let cut = 0
    const timer = setInterval(() => {
      cut += 1
      setShown(letters.slice(0, cut).join(''))
      if (cut < letters.length) return
      clearInterval(timer)
      if (entry.phase === 'typing') onPhase(card.id, 'hold')
    }, TOAST_SPEED_MS)
    return () => { clearInterval(timer) }
  }, [entry.phase, card.id, full, reduced, onPhase])

  // A bubble held under the pointer waits, and waits its full time again once the
  // pointer leaves: the reader who stopped to read it gets a whole sentence's worth.
  useEffect(() => {
    if (entry.phase !== 'hold') return
    if (hovered) return
    const timer = setTimeout(() => { onPhase(card.id, 'leaving') }, holdFor(entry.outcome))
    return () => { clearTimeout(timer) }
  }, [entry.phase, entry.outcome, hovered, card.id, onPhase])

  useEffect(() => {
    if (entry.phase !== 'leaving') return
    const timer = setTimeout(() => { onRemove(card.id) }, TOAST_LEAVE_MS)
    return () => { clearTimeout(timer) }
  }, [entry.phase, card.id, onRemove])

  const state = entry.phase === 'sending' ? 'sending' : entry.outcome
  const typing = entry.phase === 'typing' || entry.phase === 'sending'
  return (
    <div
      className="da-toast"
      data-kind={card.kind}
      data-state={state}
      data-leaving={entry.phase === 'leaving'}
      data-shake={shake}
      data-text={full}
      style={{
        transform: `translateY(${props.offset + (entered ? 0 : ENTER_SHIFT)}px)`,
        opacity: entered ? depthOpacity(props.depth) : 0,
        zIndex: 10 + props.index,
      }}
      onPointerEnter={() => { setHovered(true) }}
      onPointerLeave={() => { setHovered(false) }}
    >
      <span className="da-toast-ico" data-slot={card.kind}>
        {card.kind === 'note' ? <PencilIcon /> : (
          <>
            <DestIcon icon={card.icon === 'agent' ? 'agent' : 'dialog'} />
            <SendRings />
            <CheckIcon />
            <CrossIcon />
          </>
        )}
      </span>
      <span className="da-toast-msg" data-typing={typing}>{shown}</span>
      <button
        type="button"
        className="da-toast-close"
        aria-label={props.label}
        onClick={() => { props.onClose(card.id) }}
      >
        {/* A ×, as a glyph: at this size a line drawing reads as a fleck, and the
            reference sets it as type for the same reason. */}
        ×
      </button>
      <button
        type="button"
        className="da-toast-resend"
        aria-label={props.resendLabel}
        onClick={() => { props.onRetry(card.id) }}
      >
        <ResendIcon />
      </button>
    </div>
  )
}
