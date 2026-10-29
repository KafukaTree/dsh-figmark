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
import { uprightBounds, type MarkBox } from '../mark-geometry'

/** Hit width of an invisible selection stroke, in figure pixels. */
export const HIT_WIDTH = 14

/**
 * Whether two anchors name the same element in the same place.
 *
 * Two separate reads of the same element can arrive as two objects, and the
 * highlight only has to change when what it is drawn around changes. Comparing the
 * name *and* the box covers both ways it can: a different element, or the same
 * element after the surface reflowed under it.
 * @param one - the anchor drawn now, or null when nothing is lit.
 * @param other - the anchor the pointer just named.
 * @returns true when the highlight would look exactly the same.
 */
export function sameAnchor(one: MarkAnchor | null, other: MarkAnchor | null): boolean {
  if (one === null || other === null) return one === other
  if (one.selector !== other.selector || one.id !== other.id || one.tag !== other.tag) return false
  return one.bbox.every((value, index) => value === other.bbox[index])
}

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
 * Only the resize-and-turn handles read this, and only shapes with an extent get
 * those: a `point` mark is highlighted by a ring instead, so it never reaches
 * here. Every kind that does carries at least one point, so there is always a
 * box — the fallback covers a mark whose points were emptied by a bad edit.
 * @param mark - the mark to frame.
 * @returns the frame box.
 */
export function controlBox(mark: AnnotationMark): MarkBox {
  /* v8 ignore next -- a mark carries at least one point, which is a box. */
  return uprightBounds(mark.points, mark.rotation ?? 0) ?? { x: 0, y: 0, width: 0, height: 0 }
}
