/**
 * The name the panel hangs beside the element the pointer is on.
 *
 * A lit element says which element a click would take; it does not say what that
 * element *is*. On a page that is the difference between "somewhere in that card" and
 * `div.relative` — the reader who is about to write "this padding is wrong" needs the
 * class name to write it with, and the reader who is about to write "make this
 * bigger" needs to know whether they are pointing at the card or at the grid.
 *
 * The name is the element's own, so it is read from the element rather than stored on
 * the mark: the same `div.relative` answers for the mark that was already placed and
 * for the press that is about to place one, and neither has to carry a field the
 * delivered annotation would have to be taught about.
 *
 * Classes the panel itself puts on the element are skipped. Lighting adds a class to
 * the very element being named, so naming the first class on the element would name
 * the panel's own light — `div.da-spot` — and hide the one class the reader asked
 * about.
 *
 * The chip sits just above the element's top-left corner, the way it does in the
 * annotation shells this copies: above, because the reader is looking at the element
 * and not at its label, and to the left edge, because that is the corner the eye uses
 * to find where the element starts. An element against the top of the window has no
 * room above it, so the chip goes just inside the element instead of off the page.
 * @module dsh-figmark/client/hover-name
 */
import type { FigureBox, FigurePoint, MarkAnchor } from '../shared/annotation'
import { SPOTLIGHT_CLASS, SPOTLIGHT_SELECTED_CLASS } from './spotlight'

/** How far above the element's top edge the chip rides, in figure pixels. */
const LIFT = 22

/** How far inside the element the chip sits when there is no room above it. */
const INSIDE = 4

/** The smallest gap kept between the chip and the left edge of the window. */
const EDGE = 2

/** The widest the chip is allowed to get, which is what the right edge clamps against. */
const MAX_WIDTH = 200

/** What the stylesheet gives the chip, in the one place a number has to be known. */
export const NAME_CHIP_MAX_WIDTH = MAX_WIDTH

/** Classes the panel writes onto the element it is naming, which are not the page's. */
const OWN_CLASSES: readonly string[] = [SPOTLIGHT_CLASS, SPOTLIGHT_SELECTED_CLASS]

/** Where the chip goes, in the document's own pixels. */
export interface NameChipPlacement {
  /** Distance from the window's left edge. */
  readonly left: number
  /** Distance from the window's top edge. */
  readonly top: number
}

/**
 * A value that changes exactly when the chip would have something new to say.
 *
 * The pointer reports the element it is on for every move, and the chip is drawn by
 * React: without a cheap answer to "is this the same element again?", hovering a page
 * would re-render the panel for every pixel the hand travels. The box is part of the
 * answer because an element can move under a still hand — a page that is still laying
 * itself out — and the label has to travel with it.
 * @param anchor - what the picker named, if anything.
 * @returns a key that is equal for two reports of the same element.
 */
export function chipKey(anchor: MarkAnchor | undefined): string {
  if (anchor === undefined) return ''
  return [anchor.tag, anchor.id ?? '', anchor.selector ?? '', anchor.bbox.join(',')].join('|')
}

/**
 * The first class on the element that the page wrote, rather than the panel.
 * @param element - the element being named.
 * @returns its first own class, or undefined when it has none.
 */
function ownClass(element: Element): string | undefined {
  for (const name of element.classList) {
    if (!OWN_CLASSES.includes(name)) return name
  }
  return undefined
}

/**
 * Name an element the way its author would: `tag`, then `#id`, then `.class`.
 *
 * An `id` is the name the element answers to and the one a stylesheet or a script
 * addresses, so it wins over a class. Falling back to the tag alone keeps the chip
 * useful on markup that has neither — a bare `section` still tells the reader which
 * box they are pointing at.
 * @param anchor - the element's anchor, as the picker read it.
 * @param find - resolves an element's CSS path inside the document it lives in.
 * @returns the name to show.
 */
export function elementName(
  anchor: MarkAnchor,
  find: (selector: string) => Element | undefined,
  named?: string,
): string {
  // A page on another origin cannot be asked for the element, so the name it reported
  // itself is the only one there is.
  if (named !== undefined) return named
  const base = anchor.tag.toLowerCase()
  if (anchor.id !== undefined && anchor.id !== '') return `${base}#${anchor.id}`
  const element = anchor.selector === undefined ? undefined : find(anchor.selector)
  const name = element === undefined ? undefined : ownClass(element)
  return name === undefined ? base : `${base}.${name}`
}

/**
 * Place the chip over the element it names.
 *
 * The scroll is what the window has travelled: the anchor's box is in document
 * pixels and the chip is drawn in the pane, so the two are the same point only once
 * the page's own offset is taken off.
 * @param box - the element's box in document pixels.
 * @param scroll - how far the document has scrolled inside its window.
 * @param view - the window's size, which the chip stays inside.
 * @returns where to draw the chip.
 */
export function nameChipAt(
  box: FigureBox,
  scroll: FigurePoint,
  view: { readonly width: number },
): NameChipPlacement {
  const top = box[1] - scroll[1]
  return {
    // Clamped on both sides with the same floor, so a window narrower than the chip
    // still starts at the left edge instead of inverting the range.
    left: Math.min(Math.max(EDGE, box[0] - scroll[0]), Math.max(EDGE, view.width - MAX_WIDTH)),
    top: top - LIFT < 0 ? top + INSIDE : top - LIFT,
  }
}

/**
 * Where the hover box goes, in the document's own pixels.
 *
 * The same subtraction the name chip makes, but for the whole element: the box is the
 * element's own size, so a wide card is outlined where it lies instead of only named
 * at its corner.
 * @param box - the element's box in document pixels.
 * @param scroll - how far the document has scrolled inside its window.
 * @returns the box to draw in the window's pixels.
 */
export function hoverBoxAt(
  box: FigureBox,
  scroll: FigurePoint,
): { readonly left: number; readonly top: number; readonly width: number; readonly height: number } {
  return {
    left: box[0] - scroll[0],
    top: box[1] - scroll[1],
    width: box[2],
    height: box[3],
  }
}
