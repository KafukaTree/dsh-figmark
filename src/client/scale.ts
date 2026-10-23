/**
 * How big the marks should be for the figure they are drawn on.
 *
 * A stroke is not a physical thing: 2.5 pixels is a bold line on a 300px thumbnail
 * and a hairline on a 4000px scan. Marks are comparisons the reader makes against
 * the line work underneath them, so they have to be sized in the same currency as
 * the figure — a fraction of it — rather than in the figure's pixels.
 *
 * The reference edge is the size a science figure is usually exported at. An
 * ordinary figure then gets the unit it always had, and only the outliers (a
 * thumbnail, a poster) are scaled. The range is clamped rather than proportional
 * because a 20000px figure would otherwise get strokes 40px wide, which reads as a
 * highlighter rather than a line.
 * @module dsh-figmark/client/scale
 */

/**
 * The figure edge a stroke is measured against, in pixels.
 *
 * A stroke wants to be a constant *share* of the figure, not a constant number of
 * its pixels: the same matplotlib figure measured in points (237 wide) and exported
 * as a PNG (1179 wide) is the same picture, and a stroke that is bold in one and a
 * hairline in the other is the wrong answer. The reference is the edge at which the
 * base width is the width a reader already found comfortable; every other figure is
 * scaled to keep that share.
 */
export const REFERENCE_EDGE = 800

/**
 * Smallest multiple of the base sizes, for figures far below the reference.
 *
 * Low enough that a matplotlib SVG — which measures itself in points, ~283 wide for
 * the same figure a PNG exports at 1179px — is still scaled down rather than propped
 * up to the old floor. The floor is a guard against division, not a design choice:
 * a figure below ~240px is one nothing sensible is drawn on.
 */
export const MIN_UNIT = 0.2

/** Largest multiple of the base sizes, for figures far above the reference. */
export const MAX_UNIT = 10

/**
 * The size everything drawn on a figure is multiplied by.
 *
 * Measured against the figure's longer edge: that is the dimension a reader judges
 * a stroke against, and using the area would shrink a tall thin panel's marks for a
 * reason the eye does not see.
 * @param width - the figure's intrinsic width, in figure pixels.
 * @param height - the figure's intrinsic height, in figure pixels.
 * @returns the multiple of the base sizes, held inside {@link MIN_UNIT} and {@link MAX_UNIT}.
 */
export function figureUnit(width: number, height: number): number {
  const edge = Math.max(width, height)
  // An unmeasured surface is one nothing is drawn on yet, so the neutral unit is the
  // honest answer rather than an arbitrary extreme.
  if (!Number.isFinite(edge) || edge <= 0) return 1
  return Math.min(MAX_UNIT, Math.max(MIN_UNIT, edge / REFERENCE_EDGE))
}
