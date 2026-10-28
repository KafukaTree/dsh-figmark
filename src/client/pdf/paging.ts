/**
 * Where a page turn goes, and which gesture asks for one.
 *
 * The document body renders one page at a time and owns the only page number in
 * the panel, so every way of turning a page — the two buttons, the arrow keys, the
 * number box, the wheel at the end of a page — has to arrive at the same answer.
 * Deciding it here, in ordinary functions, is what keeps those four gestures from
 * drifting apart: they are four opinions about one number, and the number is what
 * every page's marks are filed under.
 * @module dsh-figmark/client/pdf/paging
 */

/** The first page of any document. */
export const FIRST_PAGE = 1

/**
 * A page number pulled into the document.
 * @param page - the page asked for.
 * @param pageCount - how many pages the document has.
 * @returns the nearest page that exists.
 */
export function clampPage(page: number, pageCount: number): number {
  // A document that reports no pages still has a page to show, so the clamp keeps
  // its own floor rather than trusting the count.
  const last = Math.max(pageCount, FIRST_PAGE)
  // NaN is the one number with no page in it. Infinity does have one — the last —
  // which is what End asks for without having to know how long the document is.
  if (Number.isNaN(page)) return FIRST_PAGE
  return Math.min(Math.max(Math.round(page), FIRST_PAGE), last)
}

/**
 * The page one step away, clamped at both ends.
 * @param page - the page on screen.
 * @param delta - how many pages to move; negative moves back.
 * @param pageCount - how many pages the document has.
 * @returns the page to show.
 */
export function stepPage(page: number, delta: number, pageCount: number): number {
  return clampPage(page + delta, pageCount)
}

/**
 * A page number typed into the box.
 *
 * Digits only: a reader typing "12" means page 12, and anything else is a typo
 * that must leave them where they are rather than jump them somewhere arbitrary.
 * A number past the end lands on the last page, which is what a reader typing it
 * was reaching for anyway.
 * @param raw - what the box holds.
 * @param pageCount - how many pages the document has.
 * @returns the page to show, or null when the text is not a page number.
 */
export function parsePageInput(raw: string, pageCount: number): number | null {
  const digits = raw.trim()
  if (!/^\d+$/u.test(digits)) return null
  // A string of digits can still overflow to Infinity, and a page number that is
  // past the end belongs on the last page rather than nowhere.
  return clampPage(Number.parseInt(digits, 10), pageCount)
}

/** Which way a keystroke turns the page, or null when the key is not a page turn. */
export interface KeyTurn {
  /** Pages to move: +1 forward, -1 back, or a page number to jump to. */
  readonly delta: number
  /** Whether the key names an absolute page rather than a step. */
  readonly absolute: boolean
}

/**
 * The page turn a keystroke asks for.
 *
 * Only the keys a PDF reader answers to, and none of them while a modifier is
 * held: Cmd+Arrow belongs to the shell, and swallowing it here would turn a text
 * selection or a tab switch into a page turn.
 * @param key - the event's key.
 * @param modifiers - which modifiers were held.
 * @returns the turn, or null when this key is not one.
 */
export function keyedTurn(
  key: string,
  modifiers: { readonly shiftKey: boolean; readonly altKey: boolean; readonly metaKey: boolean; readonly ctrlKey: boolean },
): KeyTurn | null {
  if (modifiers.metaKey || modifiers.ctrlKey || modifiers.altKey) return null
  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
    case 'PageDown':
    case ' ':
      return { delta: 1, absolute: false }
    case 'ArrowLeft':
    case 'ArrowUp':
    case 'PageUp':
      return { delta: -1, absolute: false }
    case 'Home':
      return { delta: FIRST_PAGE, absolute: true }
    case 'End':
      // -1 of the real count would be wrong for a document of unknown length; the
      // absolute form is resolved against the count at the call site.
      return { delta: Number.POSITIVE_INFINITY, absolute: true }
    default:
      return null
  }
}

/**
 * The page a key turn lands on.
 * @param turn - what the key asked for.
 * @param page - the page on screen.
 * @param pageCount - how many pages the document has.
 * @returns the page to show.
 */
export function keyedPage(turn: KeyTurn, page: number, pageCount: number): number {
  if (!turn.absolute) return stepPage(page, turn.delta, pageCount)
  return clampPage(turn.delta, pageCount)
}
