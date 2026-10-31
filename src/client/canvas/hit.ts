/**
 * Finding the mark a press was aimed at.
 *
 * A mark can be hit in three ways, and the difference matters: a shape with a
 * stroke has an invisible thick stroke along it, a point has its pin, and an
 * element mark has no paint at all — it is found by asking which element is under
 * the pointer and which mark names that element. The last one is why this module
 * depends on the anchor read rather than on the drawn geometry: the target is
 * exactly as big as the thing the mark is about, so pressing elsewhere inside the
 * element's box is pressing paper.
 * @module dsh-figmark/client/canvas/hit
 */

import type { AnnotationMark, MarkAnchor } from '../../shared/annotation'
import { markBounds, type MarkBox } from '../mark-geometry'

/** Hit width of an invisible selection stroke, in figure pixels. */
export const HIT_WIDTH = 14

/**
 * The mark that names the element under the pointer, if any.
 *
 * An element mark draws nothing, so it has no painted shape a press can land on,
 * and a hit `rect` over its box would swallow the whole plot: an element is
 * routinely a curve, a legend or an axis spanning most of the figure, so a
 * box-shaped target would block every other mark and every press meant for the
 * paper. It also said the wrong thing — the box around a diagonal curve is a region
 * the figure never drew, which is the very mismatch the light was introduced to fix.
 * @param marks - the marks the surface is showing.
 * @param named - what the point under the pointer names, if anything.
 * @returns the mark whose element is under the press.
 */
export function elementNamedBy(
  marks: readonly AnnotationMark[],
  named: MarkAnchor | undefined,
  preferred?: string | null,
): AnnotationMark | undefined {
  if (named === undefined) return undefined
  const selector = named.selector
  if (selector === undefined) return undefined
  const onElement = marks.filter(mark => mark.kind === 'element' && mark.anchor?.selector === selector)
  // Two marks may name the same element — the picker does not dedupe, and there is no
  // reason it should: the same curve can be pointed at twice with a different
  // sentence each time. Taking the first match meant the second mark was dead on the
  // figure and pressing the element jumped the selection to the first; preferring the
  // mark that is already selected makes the press land on whichever one the reader is
  // looking at, and every mark on that element reachable by selecting it elsewhere.
  const chosen = onElement.find(mark => mark.id === preferred)
  return chosen ?? onElement[0]
}

/**
 * The box a mark's control frame is drawn around.
 *
 * The box is in the mark's own upright frame — un-rotated — because everything that
 * reads it turns it: `handlesFor` and `tetherFor` rotate these corners by the mark's
 * rotation, which is what puts the handles on the outline the overlay draws. Handing
 * them `uprightBounds` meant turning twice: the extent was taken around the shape and
 * then that extent was turned again, so at 90° the north-west grip sat 70.7 figure
 * pixels off the corner it belonged to. At zero rotation the two turnings cancel
 * exactly, which is why nothing noticed.
 *
 * Only the resize-and-turn handles read this, and only shapes with an extent get
 * those: a `point` mark is highlighted by a ring instead, so it never reaches here.
 * Every kind that does carries at least one point, so there is always a box — the
 * fallback covers a mark whose points were emptied by a bad edit.
 * @param mark - the mark to frame.
 * @returns the frame box, in the mark's own upright frame.
 */
export function controlBox(mark: AnnotationMark): MarkBox {
  /* v8 ignore next -- a mark carries at least one point, which is a box. */
  return markBounds(mark.points) ?? { x: 0, y: 0, width: 0, height: 0 }
}
