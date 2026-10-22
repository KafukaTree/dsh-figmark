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
 * Top margin the surface keeps inside the scrollport, in CSS pixels.
 *
 * Mirrors `.da-surface{margin:12px auto}`: the vertical margins are fixed, so the
 * surface's content box always starts this far down whatever its width. The
 * horizontal margins are `auto`, and {@link surfaceOffset} is the resolved form.
 */
export const SURFACE_MARGIN = 12

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
 * @param viewportWidth - the scrollport's client width.
 * @param surfaceWidth - the surface's laid-out width.
 * @returns the horizontal offset the auto margins resolve to.
 */
export function surfaceOffset(viewportWidth: number, surfaceWidth: number): number {
  return Math.max(0, (viewportWidth - surfaceWidth) / 2)
}

/** What one scrollport reports about its own box and position. */
export interface ScrollportMetrics {
  /** The scrollport's client width, in CSS pixels. */
  readonly clientWidth: number
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
  figure: { readonly width: number },
): ScrollTarget {
  const localX = pointer.clientX - viewport.left
  const localY = pointer.clientY - viewport.top
  const offsetBefore = surfaceOffset(viewport.clientWidth, figure.width * before)
  const offsetAfter = surfaceOffset(viewport.clientWidth, figure.width * after)
  // The point the pointer is over, in figure pixels, before anything moves.
  const figureX = (viewport.scrollLeft + localX - offsetBefore) / before
  const figureY = (viewport.scrollTop + localY - SURFACE_MARGIN) / before
  return {
    scrollLeft: Math.max(0, offsetAfter + figureX * after - localX),
    scrollTop: Math.max(0, SURFACE_MARGIN + figureY * after - localY),
  }
}
