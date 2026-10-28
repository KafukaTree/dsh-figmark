/**
 * What the panel says while an annotation is being handed somewhere.
 *
 * A hand-off passes through four moments the reader is told about — it started, it
 * failed, it landed in the agent's session, it landed in the draft — and two of them
 * name whichever destination was chosen. Written at each call site the destination
 * was spelled twice per path (once for the sentence, once for the outcome) and the
 * failure text was spelled three times, which is three places for one of them to
 * drift from the others.
 *
 * Kept as plain values rather than as a hook: a status is a sentence and a tone, and
 * the component decides when to show it. Nothing here reads the component's state.
 * @module dsh-figmark/client/annotator/delivery
 */
import type { Translate } from '../translate'

/** Who receives the annotation. */
export type DeliveryTarget = 'agent' | 'composer'

/** How a status line reads. */
export type StatusTone = 'ok' | 'error' | 'info'

/** One line of feedback under the figure. */
export interface DeliveryStatus {
  /** How it reads: an outcome, a failure, or a step in progress. */
  readonly tone: StatusTone
  /** The sentence. */
  readonly text: string
}

/**
 * The sentence for a failure, with the reason appended.
 *
 * The reason is the last thing the reader reads, so it comes last — and a thrown
 * value that is not an `Error` still has to say something, which is why it is
 * stringified rather than dropped.
 * @param t - the translator seat.
 * @param key - the copy key naming what failed.
 * @param error - what was thrown.
 * @returns the failure line.
 */
export function failureStatus(t: Translate, key: string, error: unknown): DeliveryStatus {
  return {
    tone: 'error',
    text: `${t(key)}${error instanceof Error ? error.message : String(error)}`,
  }
}

/**
 * The line that says a hand-off has started.
 * @param t - the translator seat.
 * @param target - who is about to receive it.
 * @returns the in-progress line.
 */
export function handoffStarted(t: Translate, target: DeliveryTarget): DeliveryStatus {
  return { tone: 'info', text: t(target === 'agent' ? 'sending' : 'composing') }
}

/**
 * The line that says a hand-off has landed, named for where it went.
 * @param t - the translator seat.
 * @param target - who received it.
 * @returns the success line.
 */
export function handoffDelivered(t: Translate, target: DeliveryTarget): DeliveryStatus {
  return { tone: 'ok', text: t(target === 'composer' ? 'composed' : 'sent') }
}

/**
 * The line for a menu row that asks the Host to do something.
 *
 * The two rows that touch the desktop are the only ones whose outcome is not the
 * clipboard, and both report the same way: it was asked for, or it could not be.
 * @param t - the translator seat.
 * @param ok - whether the Host accepted the gesture.
 * @param doneKey - the copy key for the accepted case.
 * @param failedKey - the copy key for the refused case.
 * @returns the outcome line.
 */
export function hostGestureStatus(
  t: Translate,
  ok: boolean,
  doneKey: string,
  failedKey: string,
): DeliveryStatus {
  return ok ? { tone: 'ok', text: t(doneKey) } : { tone: 'error', text: t(failedKey) }
}

/**
 * The line for a row that copies something to the clipboard.
 *
 * A copy with no feedback reads as a menu that did nothing, so it always says one
 * thing or the other.
 * @param t - the translator seat.
 * @param copied - whether the clipboard took it.
 * @returns the outcome line.
 */
export function clipStatus(t: Translate, copied: boolean): DeliveryStatus {
  return copied
    ? { tone: 'ok', text: t('menuCopied') }
    : { tone: 'error', text: t('menuCopyFailed') }
}
