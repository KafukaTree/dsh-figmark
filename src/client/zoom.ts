/**
 * Zoom geometry for the document body.
 *
 * The viewer zooms around the pointer: the figure point under the cursor before
 * a gesture is the one under it afterwards. That needs the scrollport's own
 * arithmetic — where the surface sits inside the scrollport's content box, and
 * how far the scrollport has to move to put a figure point back under a client
 * coordinate. It lives apart from the component so the numbers can be exercised
 * without a layout engine.
 * @module dsh-figmark/client/zoom
 */

/** Smallest zoom factor the buttons and the gestures agree on. */
export const MIN_ZOOM = 0.1

/** Largest zoom factor the buttons and the gestures agree on. */
export const MAX_ZOOM = 6

/**
 * The padding `.da-stage` keeps around the surface, in CSS pixels.
 *
 * Both axes get it, and the two regimes differ: while the surface fits, `align` and
 * `justify` with `safe center` centre it and the offset is `(box − surface) / 2`
 * floored at zero; once it overflows, `safe` falls back to `start` and the offset is
 * this padding instead of zero. This module used to assume a 12px vertical margin
 * from a CSS rule that no longer exists and to assume zero horizontal padding in the
 * overflowing case, so a wheel zoom slid the picture under the pointer by the
 * difference — the horizontal one small, the vertical one large.
 */
export const STAGE_PADDING = 14

/** How long a pinch has to pause before its factor is taken as the settled one. */
export const PINCH_SETTLE_DELAY_MS = 120

/** How much one pixel of wheel travel multiplies the zoom by, as an exponent. */
const ZOOM_RATE = 0.01

/** Most wheel travel one event may count for, in pixels, so one event cannot jump. */
const MAX_STEP_DELTA = 40

/** What a line-mode delta stands for, in pixels. */
const LINE_HEIGHT = 16

/** Fallback viewport height for a page-mode delta, when the caller knows none. */
const FALLBACK_PAGE_HEIGHT = 800

/** Clamp one zoom factor into the range both the buttons and the gestures use. */
export function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value))
}

/**
 * Zoom factor one wheel event asks for.
 *
 * A trackpad pinch arrives as a ctrl-modified wheel: a fine stream of small pixel
 * deltas that the factor follows, which is what makes the gesture track the
 * fingers. A mouse notch reports one much larger delta, where following the delta
 * would leap across the figure per click — so the travel one event may count for
 * is capped. Both then use the same rate, and the cap is what keeps a notch
 * one comfortable step rather than the leap the raw delta asks for.
 * @param deltaY - the event's vertical delta.
 * @param deltaMode - 0 for pixels, 1 for lines, 2 for pages.
 * @param pageHeight - the scrollport's height, for a page-mode delta.
 * @returns the factor to multiply the current zoom by.
 */
export function wheelZoomFactor(deltaY: number, deltaMode: number, pageHeight = FALLBACK_PAGE_HEIGHT): number {
  if (deltaY === 0) return 1
  const unit = deltaMode === 1 ? LINE_HEIGHT : deltaMode === 2 ? pageHeight : 1
  const delta = Math.max(-MAX_STEP_DELTA, Math.min(MAX_STEP_DELTA, deltaY * unit))
  return Math.exp(-delta * ZOOM_RATE)
}

/**
 * Where the surface's content box starts, in the scrollport's content coordinates.
 *
 * One function for both axes, because the two axes are laid out by the same rule:
 * centred while the surface fits, pinned at the stage's padding once it does not.
 * @param viewportExtent - the scrollport's client width or height.
 * @param surfaceExtent - the surface's laid-out width or height.
 * @returns the offset the flex alignment resolves to.
 */
export function surfaceOffset(viewportExtent: number, surfaceExtent: number): number {
  // `safe center` centres while there is room, and falls back to `start` — which is
  // the stage's padding, not zero — the moment there is not.
  if (surfaceExtent > viewportExtent) return STAGE_PADDING
  return (viewportExtent - surfaceExtent) / 2
}

/** What one scrollport reports about its own box and position. */
export interface ScrollportMetrics {
  /** The scrollport's client width, in CSS pixels. */
  readonly clientWidth: number
  /** The scrollport's client height, in CSS pixels. */
  readonly clientHeight: number
  /** Current horizontal scroll offset. */
  readonly scrollLeft: number
  /** Current vertical scroll offset. */
  readonly scrollTop: number
  /** Left edge of the scrollport's border box, in client coordinates. */
  readonly left: number
  /** Top edge of the scrollport's border box, in client coordinates. */
  readonly top: number
}

/** Where the scrollport has to sit for a gesture's anchor point to stay put. */
export interface ScrollTarget {
  /** Horizontal scroll offset to apply. */
  readonly scrollLeft: number
  /** Vertical scroll offset to apply. */
  readonly scrollTop: number
}

/**
 * Scroll offsets that keep the figure point under the pointer under it afterwards.
 *
 * The figure point is located before the zoom, then the surface is re-laid out at
 * the new scale and the scrollport is moved so that point lands back under the
 * same client coordinate. Negative offsets mean the surface is smaller than the
 * scrollport, which is where a browser keeps it at zero.
 * @param viewport - the scrollport's box and current offsets, measured before the zoom.
 * @param pointer - the gesture's position, in client coordinates.
 * @param before - the scale the figure is currently drawn at.
 * @param after - the scale it is about to be drawn at.
 * @param figure - the figure's intrinsic size, in figure pixels.
 * @returns the offsets to apply once the new scale is laid out.
 */
export function anchoredScroll(
  viewport: ScrollportMetrics,
  pointer: { readonly clientX: number; readonly clientY: number },
  before: number,
  after: number,
  figure: { readonly width: number; readonly height: number },
): ScrollTarget {
  const localX = pointer.clientX - viewport.left
  const localY = pointer.clientY - viewport.top
  // Both axes use the same resolved offset, because `.da-stage` lays both out by the
  // one rule. Hardcoding a vertical margin was the whole of finding 6: the constant
  // described a CSS rule that does not exist, so the point under the cursor drifted
  // vertically by the difference between the assumption and the layout.
  const leftBefore = surfaceOffset(viewport.clientWidth, figure.width * before)
  const leftAfter = surfaceOffset(viewport.clientWidth, figure.width * after)
  const topBefore = surfaceOffset(viewport.clientHeight, figure.height * before)
  const topAfter = surfaceOffset(viewport.clientHeight, figure.height * after)
  // The point the pointer is over, in figure pixels, before anything moves.
  const figureX = (viewport.scrollLeft + localX - leftBefore) / before
  const figureY = (viewport.scrollTop + localY - topBefore) / before
  return {
    scrollLeft: Math.max(0, leftAfter + figureX * after - localX),
    scrollTop: Math.max(0, topAfter + figureY * after - localY),
  }
}
