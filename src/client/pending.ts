/**
 * The one annotation waiting above the composer.
 *
 * "Send to the input box" cannot write a card into the box itself: the composer is a
 * lexical editor owned by the conversation package, and its text is text. What this
 * module holds is the other half of the hand-off — the annotation stays parked as a
 * card in the input dock, the draft keeps only what the reader typed, and the message
 * is still delivered verbatim when the card's send is pressed.
 *
 * One entry per session: opening a second figure replaces the first, because two
 * parked cards would be two answers to the question "what am I about to send".
 * @module dsh-figmark/client/pending
 */
import type { FigmarkAnnotation } from './annotation-rule'
import type { ComposerLike } from './composer'

/** One annotation parked above the composer. */
export interface ParkedAnnotation {
  /** Session the card belongs to; the dock asks for one session's card. */
  readonly sessionId: string
  /**
   * The block, parsed by the same rule the transcript uses.
   *
   * Both cards draw from this, so what the reader sees before sending is what the
   * message will read as afterwards — a second parser here could disagree with the
   * one that shapes the bubble.
   */
  readonly data: FigmarkAnnotation
  /** The message exactly as the model will read it once the card is sent. */
  readonly raw: string
  /** The composer the card was parked for; the dock needs no write into it. */
  readonly conversation: ComposerLike | undefined
  /**
   * Hand the message to the session, the way the direct button does.
   *
   * Everything the delivery needs is closed over, so a send that happens minutes
   * after the figure was closed still carries the same pictures and the same text.
   */
  readonly send: () => Promise<void>
}

/** Parked annotations, by session. */
const parked = new Map<string, ParkedAnnotation>()

/** Listeners per session, so a dock redraws only when its own card changes. */
const watchers = new Map<string, Set<() => void>>()

/**
 * Tell one session's listeners that its card changed.
 * @param sessionId - session whose card changed.
 */
function announce(sessionId: string): void {
  for (const listener of watchers.get(sessionId) ?? []) listener()
}

/**
 * Park one annotation, replacing whatever that session had parked.
 * @param entry - the card and the delivery it stands for.
 */
export function parkAnnotation(entry: ParkedAnnotation): void {
  parked.set(entry.sessionId, entry)
  announce(entry.sessionId)
}

/**
 * The annotation parked for one session, if any.
 * @param sessionId - session to ask about.
 * @returns the parked annotation.
 */
export function parkedAnnotation(sessionId: string): ParkedAnnotation | undefined {
  return parked.get(sessionId)
}

/**
 * Drop one session's parked annotation.
 *
 * Called once the card has been sent (the message is in the session now) or dropped,
 * so a stale card cannot outlive the hand-off it represents.
 * @param sessionId - session to clear.
 */
export function unparkAnnotation(sessionId: string): void {
  if (parked.delete(sessionId)) announce(sessionId)
}

/**
 * Watch one session's card.
 * @param sessionId - session to watch.
 * @param listener - called whenever that session's card changes.
 * @returns a function that stops watching.
 */
export function watchParked(sessionId: string, listener: () => void): () => void {
  const listeners = watchers.get(sessionId) ?? new Set<() => void>()
  listeners.add(listener)
  watchers.set(sessionId, listeners)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) watchers.delete(sessionId)
  }
}

/** Forget every parked annotation; tests use it, nothing else does. */
export function clearParked(): void {
  parked.clear()
  watchers.clear()
}
