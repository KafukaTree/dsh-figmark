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
 * Show what a delivery could not do, without turning a successful send into a failure.
 *
 * A warning arrives after the message is already in the session. The component still
 * needs to say it, but the send must not be presented as retryable; the one call site
 * therefore only ever asks for an informational line.
 * @param warnings - what the delivery could not attach or include.
 * @param show - where the panel puts an informational line.
 */
export function reportDeliveryWarnings(
  warnings: readonly string[],
  show: (status: DeliveryStatus) => void,
): void {
  const text = warnings.join(' ')
  if (text === '') return
  show({ tone: 'info', text })
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
