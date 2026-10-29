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
    text: `${t(key)}${describeFailure(t, error)}`,
  }
}

/**
 * What to say about a failure, in the reader's language where there is one.
 *
 * The errors that reach this line come from two places: the Host, whose messages are
 * written for a reader, and this plugin's own guards, whose messages are English
 * literals written for a developer. Concatenated, the second kind produced a Chinese
 * sentence ending in `the sessions service is unavailable` — honest, and unreadable at
 * the one moment the reader needed to know what went wrong. A known guard becomes a
 * translated sentence; anything unrecognised still travels verbatim, because a code
 * this panel does not know is a code it should not invent a sentence for.
 * @param t - the translator seat.
 * @param error - whatever was caught.
 * @returns the sentence to put after the translated prefix.
 */
function describeFailure(t: Translate, error: unknown): string {
  if (!(error instanceof Error)) return String(error)
  const known: Record<string, string> = {
    'the sessions service is unavailable': t('failSessions'),
    'the conversation service is unavailable': t('failConversation'),
    'the figure address carries no session': t('failNoSession'),
  }
  return known[error.message] ?? error.message
}

/**
 * The line that says there was nothing to hand over.
 *
 * The toolbar's two buttons stay lit rather than going disabled, so that pressing one
 * when there is nothing to send is answered rather than silently dropped: a live button
 * that does nothing reads as a broken button. A surface with no marks — or one whose
 * figure never finished decoding, so nothing could have been drawn on it — has nothing
 * a sidecar could describe, and the reader is told which of the two it was.
 * @param t - the translator seat.
 * @param reason - why there is nothing to send.
 * @returns the explanation.
 */
export function handoffRefused(t: Translate, reason: 'noMarks' | 'noFigure'): DeliveryStatus {
  return { tone: 'error', text: t(reason === 'noMarks' ? 'sendNothingToSend' : 'sendNoFigure') }
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
 * The line that says one mark of several was handed somewhere.
 *
 * A per-mark hand-off is the same act as a whole-figure one, but its aftermath is
 * the opposite: what the reader can see afterwards is the rest of the work, not an
 * empty panel. Saying "cleared" there would be false, and leaving the sentence
 * unchanged is what makes the difference invisible until the reader counts.
 * @param t - the translator seat.
 * @param target - who received it.
 * @returns the success line for a single mark.
 */
export function handoffDeliveredOne(t: Translate, target: DeliveryTarget): DeliveryStatus {
  return { tone: 'ok', text: t(target === 'composer' ? 'composedOne' : 'sentOne') }
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
