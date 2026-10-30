/**
 * The bubble model: how many fit, where they sit, how loud each one is, and what
 * every annotate event says.
 *
 * Nothing here touches the DOM or React. The stack is a list of entries ordered
 * oldest first — which is also top to bottom on screen — and everything the
 * component needs about an entry (its sentence, its height, its opacity, how long
 * it stays) is a function of that entry alone. That is what makes the numbers
 * testable without a browser and identical in every surface.
 * @module dsh-figmark/client/annotator/toast-model
 */

import type { Translate } from '../translate'

/** How many bubbles the stack holds. A fifth is a log, not a reply. */
export const TOAST_LIMIT = 4
/** How far each card tucks under the one below it, in pixels. */
export const TOAST_OVERLAP = 12
/** One character of a sentence every this many milliseconds. */
export const TOAST_SPEED_MS = 9
/** How long a bubble stays once its sentence has landed. */
export const TOAST_HOLD_MS = 3500
/** A failure gets longer: it is the only bubble the reader may act on. */
export const TOAST_FAIL_HOLD_MS = 5000
/** How long the bubble takes to fade and blur away. */
export const TOAST_LEAVE_MS = 500
/** A task that has not answered by now is a failure. */
export const TOAST_TASK_TIMEOUT_MS = 12000
/**
 * A card is one line by construction (`white-space:nowrap` and a width cap), so
 * its height is known without measuring it: 13px of text on a 1.42 line, 9px of
 * padding above and below, and a one-pixel border in two halves. The stylesheet
 * states the same two numbers, so the arithmetic here and the box on screen agree.
 */
export const TOAST_NOTE_HEIGHT = 38
/** The send card is the same line, but its icon slot is 22px instead of 14. */
export const TOAST_SEND_HEIGHT = 41

/** How a note reads, kept for the tone a caller passed even though it is not painted. */
export type ToastTone = 'ok' | 'error' | 'info'
/** Which face the card shows before the sentence: a pencil, or where it is going. */
export type ToastIcon = 'pencil' | 'dialog' | 'agent'
/** A note is news with nothing pending; a send has a task and a destination. */
export type ToastKind = 'note' | 'send'
/** The four things the panel says in its own voice. */
export type ToastEvent = 'annotate.none' | 'annotate.save.all' | 'annotate.save.one' | 'annotate.send.agent'
/** Where a card is in its life: talking, waiting on a task, or on its way out. */
export type ToastPhase = 'typing' | 'sending' | 'hold' | 'leaving'
/** What a send ended as. `none` means it has not ended yet, or never will. */
export type ToastOutcome = 'none' | 'ok' | 'fail'

/** One bubble's content, without the phase it is currently in. */
export interface ToastCard {
  readonly id: number
  readonly kind: ToastKind
  readonly icon: ToastIcon
  readonly tone: ToastTone
  /** What it says while nothing has ended yet, or the whole sentence of a note. */
  readonly text: string
  /** What a send says once it lands. */
  readonly done: string | undefined
  /** What a send says when it does not. */
  readonly failed: string | undefined
  /** What the send has to do, run again for every retry. */
  readonly task: (() => Promise<unknown>) | undefined
}

/** A bubble and how far through its life it is. */
export interface ToastEntry {
  readonly card: ToastCard
  readonly phase: ToastPhase
  readonly outcome: ToastOutcome
}

/** What a caller hands `send`: the destination, both sentences, and the work. */
export interface ToastSend {
  readonly icon: ToastIcon
  readonly pending: string
  readonly done: string
  readonly failed: string
  readonly task: () => Promise<unknown>
}

/**
 * How loud a card is, by how far it sits from the newest one.
 *
 * The oldest is still readable and never disappears into the picture: .35 is as
 * faint as a bubble gets.
 * @param depth - how many cards sit below it, 0 being the newest.
 * @returns the opacity to draw it at.
 */
export function depthOpacity(depth: number): number {
  return Math.max(0.35, 1 - depth * 0.2)
}

/**
 * One card's place in the stack.
 */
export interface ToastRow {
  /** The card and how far through its life it is. */
  readonly entry: ToastEntry
  /** Where it sits in the list, oldest first. */
  readonly index: number
  /** How many cards sit below it, 0 being the newest. */
  readonly depth: number
  /** How far down the stack draws it, in pixels. */
  readonly offset: number
}

/**
 * Where every card goes, and how tall the stack is.
 *
 * Each card is tucked `TOAST_OVERLAP` under the one above it, so the stack reads as
 * one object rather than four. The height is the last card's top plus its own — the
 * stack is the size of what it holds, and a surface can let that much of the figure
 * go unread.
 * @param entries - the stack, oldest first.
 * @returns one row per card, in the same order, and the stack's height.
 */
export function stackLayout(entries: readonly ToastEntry[]): {
  readonly rows: readonly ToastRow[]
  readonly height: number
} {
  const rows: ToastRow[] = []
  let top = 0
  for (const [index, entry] of entries.entries()) {
    rows.push({ entry, index, depth: entries.length - 1 - index, offset: top })
    top += toastHeight(entry.card.kind) - TOAST_OVERLAP
  }
  // Nothing in the stack is nothing tall — the last card's tuck would otherwise be
  // left sticking out below it.
  const height = rows.length === 0 ? 0 : top + TOAST_OVERLAP
  return { rows, height }
}

/**
 * The height a bubble takes at rest.
 * @param kind - a note or a send.
 * @returns the height in pixels.
 */
export function toastHeight(kind: ToastKind): number {
  return kind === 'send' ? TOAST_SEND_HEIGHT : TOAST_NOTE_HEIGHT
}

/**
 * The sentence a card says right now.
 *
 * A send has three sentences and which one is on screen is decided by its outcome:
 * until the task answers it is the pending one, and a missing success or failure
 * sentence falls back to it rather than leaving the bubble blank.
 * @param card - the bubble.
 * @param outcome - what its task ended as, or `none`.
 * @returns the sentence to type out.
 */
export function cardText(card: ToastCard, outcome: ToastOutcome): string {
  if (outcome === 'ok') return card.done ?? card.text
  if (outcome === 'fail') return card.failed ?? card.text
  return card.text
}

/**
 * How long a card stays after its sentence lands.
 * @param outcome - what its task ended as.
 * @returns the hold in milliseconds.
 */
export function holdFor(outcome: ToastOutcome): number {
  return outcome === 'fail' ? TOAST_FAIL_HOLD_MS : TOAST_HOLD_MS
}

/**
 * Put a card at the bottom of the stack.
 *
 * A sentence already on screen is replaced rather than repeated: the same news
 * twice is one bubble that moved, and the reader counts bubbles that differ. The
 * oldest card leaves silently when a fifth arrives — it is the one already half
 * faded at the top, and animating it would push everything below it down for half
 * a second for nothing.
 * @param list - the stack as it was.
 * @param entry - the card to add.
 * @returns the stack with the card at the bottom.
 */
export function addEntry(list: readonly ToastEntry[], entry: ToastEntry): readonly ToastEntry[] {
  const kept = list.filter(one => !sameNews(one.card, entry.card))
  return [...kept, entry].slice(-TOAST_LIMIT)
}

/**
 * Whether two cards carry the same news.
 *
 * Two notes are the same when they say the same thing. Two sends are the same when
 * they are going to the same place — both say "sending" until they land, and that
 * sentence is not the news, the outcome is.
 * @param a - one card.
 * @param b - another.
 * @returns true when the reader would count them as one.
 */
function sameNews(a: ToastCard, b: ToastCard): boolean {
  if (a.kind !== b.kind) return false
  return a.kind === 'note' ? a.text === b.text : a.done === b.done
}

/**
 * Change how far through its life one card is, leaving the rest alone.
 * @param list - the stack.
 * @param id - the card to change.
 * @param patch - the fields to set.
 * @returns a new stack, or the old one when the card is already gone.
 */
export function patchEntry(
  list: readonly ToastEntry[],
  id: number,
  patch: { readonly phase?: ToastPhase; readonly outcome?: ToastOutcome },
): readonly ToastEntry[] {
  let changed = false
  const next = list.map(one => {
    if (one.card.id !== id) return one
    changed = true
    return { ...one, ...patch }
  })
  return changed ? next : list
}

/**
 * Land a card: give it the outcome its task ended as.
 *
 * A card already on its way out keeps leaving — the work it was waiting for may
 * finish after the reader closed it, and a fading bubble must not start talking
 * again on its way off the screen.
 * @param list - the stack.
 * @param id - the card that landed.
 * @param outcome - how its task ended.
 * @returns a new stack, or the old one when the card is already gone.
 */
export function settleEntry(
  list: readonly ToastEntry[],
  id: number,
  outcome: ToastOutcome,
): readonly ToastEntry[] {
  const entry = list.find(one => one.card.id === id)
  if (entry === undefined) return list
  return patchEntry(list, id, { phase: entry.phase === 'leaving' ? 'leaving' : 'typing', outcome })
}

/**
 * Take one card out.
 * @param list - the stack.
 * @param id - the card to remove.
 * @returns the stack without it; a card that is already gone is not an error.
 */
export function removeEntry(list: readonly ToastEntry[], id: number): readonly ToastEntry[] {
  return list.filter(one => one.card.id !== id)
}

/**
 * Take back every card of one tone.
 *
 * A write that goes through retires the failure it was answering — and only that:
 * the bubble saying a hand-off landed is news of its own and is not a failure's to
 * drop.
 * @param list - the stack.
 * @param tone - the tone to clear.
 * @returns the stack without those cards.
 */
export function dropTone(list: readonly ToastEntry[], tone: ToastTone): readonly ToastEntry[] {
  return list.filter(one => one.card.tone !== tone)
}

/**
 * The card one of the four annotate events stands for.
 *
 * The event is the interface; the sentence is the product's. A caller that knows
 * what happened says so by name and never has to know what it is called on screen.
 * @param event - what the panel just did.
 * @param t - the translator seat.
 * @returns the card, without its identity, which the stack assigns.
 */
export function planToast(event: ToastEvent, t: Translate): Omit<ToastCard, 'id'> {
  if (event === 'annotate.none') {
    return { kind: 'note', icon: 'pencil', tone: 'info', text: t('toastNone'), done: undefined, failed: undefined, task: undefined }
  }
  if (event === 'annotate.save.all') return planSend('dialog', t('toastSavedAll'), t)
  if (event === 'annotate.save.one') return planSend('dialog', t('toastSavedOne'), t)
  return planSend('agent', t('toastSentAgent'), t)
}

/**
 * A send card that has not been given its work yet.
 *
 * The event says where the news is going; the task is the caller's, because only
 * the caller knows how to do it — and because a retry has to run the same work
 * again, not a description of it.
 * @param icon - the destination's face.
 * @param done - the sentence once it lands.
 * @param t - the translator seat.
 * @returns the card.
 */
function planSend(icon: ToastIcon, done: string, t: Translate): Omit<ToastCard, 'id'> {
  return {
    kind: 'send',
    icon,
    tone: 'info',
    text: t('toastSending'),
    done,
    failed: t('toastFailed'),
    task: undefined,
  }
}
