/**
 * The element levels one pointer position can mean.
 *
 * A point on a chart is rarely one element. It is a painted path, the artist group
 * that names it, the axes that contain it, and the figure around those. The picker
 * still has to choose one default, but a reader who meant the curve rather than the
 * whole axes needs a way to say so before the mark is committed.
 *
 * A choice keeps the complete, ordered ladder and the level that a plain click should
 * take. The level list runs from the exact painted element outward to its stable
 * named ancestors; HTML uses the same shape with the document's own containing
 * blocks. Making the ladder shared keeps the pointer gesture and the visible scope
 * readout from disagreeing about which element is selected.
 * @module dsh-figmark/client/element-choice
 */
import type { MarkAnchor } from '../shared/annotation'

/** What one pointer position offers. */
export interface ElementChoices {
  /** Exact element first, then stable named or containing ancestors. */
  readonly anchors: readonly [MarkAnchor, ...MarkAnchor[]]
  /** Index a plain click takes, preserving the picker's existing default. */
  readonly preferred: number
}

/** What the picker should say about the level currently under the pointer. */
export interface PickLevel {
  /** One-based level for the reader, from the exact element outwards. */
  readonly level: number
  /** Number of levels available at this position. */
  readonly count: number
}

/**
 * The anchor at one offset from the default.
 *
 * Offsets are signed because moving toward a child is the useful direction on a
 * six-level HTML tree as well as on an SVG artist. The result is clamped: walking up
 * at the document root stays at the outermost usable element instead of making the
 * highlight disappear.
 * @param choices - the ladder at one pointer position.
 * @param offset - steps away from {@link ElementChoices.preferred}.
 * @returns the selected anchor.
 */
export function anchorAtOffset(choices: ElementChoices, offset: number): MarkAnchor {
  const index = Math.min(
    choices.anchors.length - 1,
    Math.max(0, choices.preferred + offset),
  )
  return choices.anchors[index] as MarkAnchor
}

/**
 * Whether two ladders describe the same sequence of elements.
 *
 * Boxes are deliberately ignored: an element can reflow under a still pointer, and
 * that must update its highlight without throwing away the depth the reader chose.
 * @param one - one ladder.
 * @param other - the ladder to compare.
 * @returns true when every selector is the same and in the same order.
 */
export function sameChoiceElements(one: ElementChoices, other: ElementChoices): boolean {
  if (one.anchors.length !== other.anchors.length) return false
  return one.anchors.every((anchor, index) => anchor.selector === other.anchors[index]?.selector)
}

/**
 * Whether two ladders carry the same element values, including their boxes.
 *
 * The pointer state uses this to avoid a render for every pixel of movement over one
 * unchanged element, while still accepting a reflow under a still hand.
 * @param one - one ladder.
 * @param other - the ladder to compare.
 * @returns true when every element and box is unchanged.
 */
export function sameChoiceAnchors(one: ElementChoices, other: ElementChoices): boolean {
  if (one.preferred !== other.preferred || one.anchors.length !== other.anchors.length) return false
  return one.anchors.every((anchor, index) => {
    const compared = other.anchors[index] as MarkAnchor
    return anchor.tag === compared.tag
      && anchor.id === compared.id
      && anchor.title === compared.title
      && anchor.text === compared.text
      && anchor.selector === compared.selector
      && anchor.bbox.every((value, boxIndex) => value === compared.bbox[boxIndex])
  })
}
