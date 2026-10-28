/**
 * The two sizes the surface's own controls are drawn at.
 *
 * A control is a target for a pointer, not part of the drawing, so both numbers
 * are *screen* pixels converted into figure pixels: the svg is in figure pixels and
 * the whole paper is scaled by CSS, so a control drawn at a fixed figure size
 * shrinks with the paper and becomes impossible to grab exactly when the figure is
 * large. The floor keeps a pathological scale from dividing by zero or blowing the
 * controls up to cover the figure.
 * @module dsh-figmark/client/canvas/controls
 */

import { HANDLE_SIZE } from '../handles'

/** Smallest scale the controls are sized against. */
export const MIN_CONTROL_SCALE = 0.05

/** The figure-pixel sizes of the surface's own controls. */
export interface ControlSizes {
  /** Side of one resize or turn handle, in figure pixels. */
  readonly grip: number
  /** One screen pixel, in figure pixels: every control stroke is this wide. */
  readonly hairline: number
}

/**
 * Convert the paper's CSS scale into the sizes the controls are drawn at.
 * @param scale - how much the paper is scaled on screen; absent means unscaled.
 * @returns the handle side and the hairline, both in figure pixels.
 */
export function controlSizes(scale: number | undefined): ControlSizes {
  const factor = Math.max(MIN_CONTROL_SCALE, scale ?? 1)
  return { grip: HANDLE_SIZE / factor, hairline: 1 / factor }
}
