/**
 * The annotations waiting above the composer.
 *
 * What a card stands for is not in the box. The composer is a lexical editor owned by
 * the conversation package, and writing six lines of coordinates into it would put the
 * annotation in front of the sentence the reader is trying to write. So the message and
 * its picture are armed beside the box, and this module holds the card that stands for
 * them — the figure, the count, the first note — so the reader can see what the send
 * will carry without reading a page of coordinates.
 *
 * Cards queue rather than replace. An earlier version kept one card per session, on
 * the argument that two parked cards would be two answers to "what am I about to
 * send" — but a reader reviewing three figures hands over three reviews, and silently
 * dropping the first two is not an answer to that question, it is losing their work.
 * Each card carries its own id, its own arming and its own send, and only its own send
 * takes it away.
 * @module dsh-figmark/client/pending
 */
import type { FigmarkAnnotation } from './annotation-rule'
import type { ArmedReview, ComposerLike } from './composer'

/** One annotation parked above the composer. */
export interface ParkedAnnotation {
  /** Identity of this card, unique among the cards one session is holding. */
  readonly id: string
  /** Session the card belongs to; the dock asks for one session's cards. */
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
   * What the card armed in the composer: the message held beside the box, the picture
   * uploaded and waiting for the same send.
   *
   * Present when the host could be armed, which is the ordinary case: the box's own
   * send then carries the whole annotation and the card is the receipt for it. Absent
   * when there is nothing to arm into, and then the card's send is the only one.
   */
  readonly armed?: ArmedReview | undefined
  /**
   * Hand the message to the session, the way the direct button does.
   *
   * Everything the delivery needs is closed over, so a send that happens minutes
   * after the figure was closed still carries the same pictures and the same text.
   * The message can still arrive while an attachment does not; those warnings come
   * back to the card instead of disappearing with it.
   */
  readonly send: () => Promise<readonly string[]>
}

/** What a caller hands `parkAnnotation`: the card, minus the identity it gets here. */
export type UnparkedAnnotation = Omit<ParkedAnnotation, 'id'>

/** Parked annotations, by session, in the order they were parked. */
const parked = new Map<string, readonly ParkedAnnotation[]>()

/** Listeners per session, so a dock redraws only when its own cards change. */
const watchers = new Map<string, Set<() => void>>()

/** Source of card ids; only ever compared, never parsed. */
let nextId = 0

/** The list a session with nothing parked hands out. */
const NONE: readonly ParkedAnnotation[] = Object.freeze([])

/**
 * Tell one session's listeners that its cards changed.
 * @param sessionId - session whose cards changed.
 */
function announce(sessionId: string): void {
  for (const listener of watchers.get(sessionId) ?? []) listener()
}

/**
 * Park one annotation above the composer, behind whatever is parked already.
 * @param entry - the card and the delivery it stands for.
 * @returns the new card's id.
 */
export function parkAnnotation(entry: UnparkedAnnotation): string {
  const id = `p${++nextId}`
  const card: ParkedAnnotation = { ...entry, id }
  parked.set(card.sessionId, [...parked.get(card.sessionId) ?? NONE, card])
  announce(card.sessionId)
  return id
}

/**
 * The annotations parked for one session, oldest first.
 * @param sessionId - session to ask about.
 * @returns the cards, empty when the session has none.
 */
export function parkedAnnotations(sessionId: string): readonly ParkedAnnotation[] {
  return parked.get(sessionId) ?? NONE
}

/**
 * Drop one card, once it has been sent or taken off.
 *
 * Only the card named here goes: its neighbours are other reviews, and a send that
 * cleared them would delete work the reader had not handed over yet.
 * @param sessionId - session the card belongs to.
 * @param id - the card's own id, as `parkAnnotation` returned it.
 */
export function unparkAnnotation(sessionId: string, id: string): void {
  const cards = parked.get(sessionId)
  if (cards === undefined) return
  const rest = cards.filter(card => card.id !== id)
  if (rest.length === cards.length) return
  if (rest.length === 0) parked.delete(sessionId)
  else parked.set(sessionId, rest)
  announce(sessionId)
}

/**
 * Watch one session's cards.
 * @param sessionId - session to watch.
 * @param listener - called whenever that session's cards change.
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
  nextId = 0
}
