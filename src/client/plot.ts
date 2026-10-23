/**
 * How much paper the drawing needs.
 *
 * Marks are not required to stay inside the figure. A reader boxing a region that
 * runs off the edge of a plot — the axis label it clips, the margin the caption
 * needs — is drawing something the figure does not contain, and refusing to record
 * it would be refusing the annotation the reader actually meant. So the paper grows
 * to hold the marks: the drawing is measured as the union of the figure and every
 * mark's drawn extent, and everything downstream (the live overlay, the exported
 * picture, the pointer arithmetic) uses that one box.
 *
 * Growing the paper is also what puts a background under a mark that sits outside
 * the figure: the review image fills the whole box with white, so a box drawn in the
 * margin lands on paper rather than on transparency.
 * @module dsh-figmark/client/plot
 */

import type { AnnotationMark } from '../shared/annotation'
import { markOutline } from './render'

/** A rectangle in figure coordinates, which may start left of or above the origin. */
export interface PlotBounds {
  /** Left edge, in figure coordinates. */
  readonly x: number
  /** Top edge, in figure coordinates. */
  readonly y: number
  /** Width, in figure pixels. */
  readonly width: number
  /** Height, in figure pixels. */
  readonly height: number
}

/** How much clear paper is left around a mark that reaches past the figure. */
export const PLOT_MARGIN = 12

/**
 * The box the whole drawing occupies: the figure, plus wherever the marks reach.
 *
 * A figure with every mark inside it gets exactly its own box back, which is the
 * case the overlay has always drawn; the growth only happens for marks that leave
 * it. The margin is applied only on sides that actually grew, so an ordinary figure
 * is not padded on all four sides for nothing.
 * @param width - the figure's width, in figure pixels.
 * @param height - the figure's height, in figure pixels.
 * @param marks - the marks drawn on it.
 * @param unit - the figure's size multiple, so outlines are measured as drawn.
 * @returns the box the drawing occupies, in figure coordinates.
 */
export function plotBounds(
  width: number,
  height: number,
  marks: readonly AnnotationMark[],
  unit = 1,
): PlotBounds {
  let left = 0
  let top = 0
  let right = width
  let bottom = height
  for (const mark of marks) {
    const box = markOutline(mark, unit)
    /* v8 ignore next -- a mark with no coordinate covers nothing to grow for. */
    if (box === undefined) continue
    left = Math.min(left, box.x)
    top = Math.min(top, box.y)
    right = Math.max(right, box.x + box.width)
    bottom = Math.max(bottom, box.y + box.height)
  }
  // Only a side that grew gets padding: a mark that leaves the figure needs paper
  // beside it, but a figure with nothing outside it is already the whole picture.
  const padLeft = left < 0 ? PLOT_MARGIN : 0
  const padTop = top < 0 ? PLOT_MARGIN : 0
  const padRight = right > width ? PLOT_MARGIN : 0
  const padBottom = bottom > height ? PLOT_MARGIN : 0
  return {
    x: left - padLeft,
    y: top - padTop,
    width: right + padRight - (left - padLeft),
    height: bottom + padBottom - (top - padTop),
  }
}
