/**
 * The bubbles that report what a click just did.
 *
 * A line of text under the picture was where this started, and a line is the wrong
 * shape for the news it carries. It pushed the figure down when it appeared, it stayed
 * until something else replaced it, and its tone was the colour of the words — so
 * "saved" arrived as green text, which is a machine talking rather than the panel
 * answering. A bubble is over the figure instead of in the layout, it leaves on its
 * own, and it can be dismissed: news that has been read should not need a second
 * action to get out of the way.
 *
 * The stack is newest-nearest-the-bar: a bubble arriving pushes the older ones up, and
 * only a few are kept, because a reader who clicks four things wants to see the last
 * one rather than a wall of history. Failures are the exception in both directions —
 * they are the reader's to dismiss, since a failure is something to act on.
 * @module dsh-figmark/client/annotator/toasts
 */
import { useEffect, type ReactNode } from 'react'

/** What a bubble is reporting. */
export type ToastTone = 'ok' | 'error' | 'info'

/** One thing the surface has to say. */
export interface Toast {
  /** Identity, so a bubble can be dismissed without guessing which one it is. */
  readonly id: number
  /** What kind of news this is. */
  readonly tone: ToastTone
  /** The words. */
  readonly text: string
}

/** How many bubbles the stack holds: one more would be a log, not a reply. */
export const TOAST_LIMIT = 3

/**
 * How long an answer stays.
 *
 * Long enough to read a dozen characters while looking at the picture rather than at
 * the panel, short enough that the figure is clear again by the time the reader's eye
 * is back on it.
 */
export const TOAST_LIFE_MS = 4200

/**
 * Add a bubble to the top of the stack, dropping the ones past the limit.
 * @param list - the stack as it stands.
 * @param toast - the news to add.
 * @returns the new stack, newest first.
 */
export function pushToast(list: readonly Toast[], toast: Toast): readonly Toast[] {
  return [toast, ...list].slice(0, TOAST_LIMIT)
}

/**
 * Take one bubble out of the stack.
 * @param list - the stack as it stands.
 * @param id - the bubble to remove.
 * @returns the new stack, without it.
 */
export function dropToast(list: readonly Toast[], id: number): readonly Toast[] {
  return list.filter(toast => toast.id !== id)
}

/**
 * Take every bubble of one tone out of the stack.
 * @param list - the stack as it stands.
 * @param tone - the kind of news to drop.
 * @returns the new stack, without those.
 */
export function dropTone(list: readonly Toast[], tone: ToastTone): readonly Toast[] {
  return list.filter(toast => toast.tone !== tone)
}

/** One bubble, and the timer that takes it away again. */
function ToastBubble(props: {
  readonly toast: Toast
  readonly label: string
  readonly onDismiss: (id: number) => void
}): ReactNode {
  const { toast, onDismiss } = props
  useEffect(() => {
    // A failure stays until it is read: it is the one kind of news the reader has to do
    // something about, and a bubble that leaves first has said nothing. Everything else
    // goes on its own — that is the whole difference from the line this replaced, which
    // stayed until the next click replaced it.
    if (toast.tone === 'error') return undefined
    const timer = setTimeout(() => { onDismiss(toast.id) }, TOAST_LIFE_MS)
    return () => { clearTimeout(timer) }
  }, [onDismiss, toast])
  return (
    <div className="da-status da-toast" data-tone={toast.tone === 'info' ? undefined : toast.tone}>
      {/* The tone is a dot rather than the colour of the sentence: the panel's words
          stay the panel's colour, and one small mark says how they went. */}
      <span className="da-toast-dot" aria-hidden="true" />
      <span className="da-toast-text">{toast.text}</span>
      <button type="button" className="da-toast-close" aria-label={props.label} title={props.label}
        onClick={() => { onDismiss(toast.id) }}>
        {'\u00d7'}
      </button>
    </div>
  )
}

/**
 * The bubbles, stacked over the figure.
 * @param props - the stack to draw and the way to take one away.
 * @param props.toasts - the stack, newest first.
 * @param props.label - the dismiss button's name.
 * @param props.onDismiss - takes one bubble away by id.
 * @returns the stack, or nothing at all when there is nothing to say.
 */
export function ToastStack(props: {
  readonly toasts: readonly Toast[]
  readonly label: string
  readonly onDismiss: (id: number) => void
}): ReactNode {
  if (props.toasts.length === 0) return null
  return (
    <div className="da-toasts" aria-live="polite">
      {props.toasts.map(toast => (
        <ToastBubble key={toast.id} toast={toast} label={props.label} onDismiss={props.onDismiss} />
      ))}
    </div>
  )
}
