/**
 * The arithmetic that turns the reader's gestures into the numbers the panel draws
 * with: how big the paper is drawn, where the rail's knob sits, and what the weight
 * rail is even talking about.
 *
 * These are pure — they read state and return a number or a style — so they are kept
 * away from the component that owns that state. The point is not brevity: each of
 * these decides something the reader can see (a sheet drawn at the wrong factor, a
 * knob a pixel off the fill it belongs to), and reading the decision without the
 * twenty hooks around it is what makes it checkable.
 * @module dsh-figmark/client/annotator/geometry
 */
import type { CSSProperties } from 'react'
import { WEIGHT_DEFAULT, WEIGHT_MAX, WEIGHT_MIN, type AnnotationMark } from '../../shared/annotation'
import type { Tool } from '../Canvas'
import type { PlotBounds } from '../plot'
import { WEIGHT_TOOLS } from './tokens'

/** How much a figure is drawn at. */
export type Zoom = 'fit' | number

/**
 * The factor the figure is drawn at.
 *
 * The owner's width wins over this body's own measurement: in a column every page
 * measures its box at a different moment, and one that measured nothing would draw
 * at its own pixel size — a document of mismatched sheets.
 * @param input - the zoom seat, the measured fit width, the figure's own size, and
 *   whatever width the owner asked for.
 * @param input.zoom - the factor asked for, or `fit`.
 * @param input.fitWidth - the panel width measured for this body, in pixels.
 * @param input.size - the figure's own size, or null before there is one.
 * @param input.ownerWidth - a width the owner insists on, if any.
 * @returns the factor to draw at, never outside the shared range.
 */
export function drawingScale(input: {
  readonly zoom: Zoom
  readonly fitWidth: number
  /**
   * The width fit has to fit: the *paper*, not the figure.
   *
   * The paper is what gets laid out (`surfaceBoxStyle` is `paper.width × scale`), so
   * fitting the figure left the panel wider than its box the moment a mark reached
   * past the figure's edge — exactly the case where a grown paper is the point. Fit
   * stopped fitting at the moment a mark mattered.
   */
  readonly surface: { readonly width: number } | null
  readonly ownerWidth: number | undefined
}): number {
  if (input.surface === null) return 1
  if (input.zoom !== 'fit') return input.zoom
  const target = input.ownerWidth ?? input.fitWidth
  if (target <= 0) return 1
  return Math.min(1.5, Math.max(0.05, target / input.surface.width))
}

/**
 * What the weight rail currently means, or null when it means nothing.
 *
 * It sizes one thing: the stroke of the mark the reader is working on, or the pen of
 * the next stroke. With nothing selected and no drawing tool out there is no such
 * thing, so the rail stands down instead of offering a control for a decision nobody
 * is making. A point mark borrows the same number for its pin, so the rail stays when
 * one is selected — it is the mark's size, whichever way it is drawn.
 *
 * An element mark has no stroke and no marker: it is the light on the element it
 * names, and nothing about it is sized. The rail stood open on one anyway, reading
 * the weight the mark used to carry when it was still drawn as a box — a slider that
 * moved nothing, on a mark with nothing to move.
 * @param selected - the mark the reader picked out, or null.
 * @param tool - the tool currently armed.
 * @param remembered - the weight the reader last chose for a new stroke.
 * @returns the value to show, or null when the rail should stand down.
 */
export function railWeight(
  selected: AnnotationMark | null,
  tool: Tool,
  remembered: number,
): number | null {
  if (selected === null) return WEIGHT_TOOLS.has(tool) ? remembered : null
  if (selected.kind === 'element') return null
  return selected.weight ?? WEIGHT_DEFAULT
}

/**
 * How far up the rail a value sits, from 0 at the lightest to 1 at the heaviest.
 *
 * One number for the fill, the knob and the input: computed three times the three
 * could round differently and the knob would sit a pixel off the fill it belongs to.
 * @param weight - the value shown, or null when the rail is standing down.
 * @returns its position on the rail, 0 when there is nothing to place.
 */
export function railFraction(weight: number | null): number {
  return weight === null ? 0 : (weight - WEIGHT_MIN) / (WEIGHT_MAX - WEIGHT_MIN)
}

/**
 * The surface's box: the paper at the factor it is drawn at.
 * @param paper - the paper's own size, or null before a figure has loaded.
 * @param scale - the factor it is drawn at.
 * @returns the inline style for the surface.
 */
export function surfaceBoxStyle(paper: PlotBounds | null, scale: number): CSSProperties {
  return paper === null ? {} : { width: paper.width * scale, height: paper.height * scale }
}

/**
 * The paper at its unscaled size, with the figure placed at its own offset on it.
 *
 * The whole paper is scaled by one transform rather than each part scaling itself, so
 * the figure and the overlay cannot drift apart at a fractional factor — which at 60%
 * is exactly what a mark drawn on a line work and a mark drawn on paper would do.
 * @param paper - the paper's own size, or null before a figure has loaded.
 * @param scale - the factor it is drawn at.
 * @returns the inline style for the paper.
 */
export function paperTransformStyle(paper: PlotBounds | null, scale: number): CSSProperties {
  return paper === null
    ? {}
    : { position: 'relative', width: paper.width, height: paper.height, transform: `scale(${scale})`, transformOrigin: 'top left' }
}

/**
 * Where the figure sits on the paper.
 * @param paper - the paper's own size, or null before a figure has loaded.
 * @param size - the figure's own size, or null before one has been measured.
 * @returns the inline style for the figure's frame.
 */
export function figurePlacementStyle(
  paper: PlotBounds | null,
  size: { readonly width: number; readonly height: number } | null,
): CSSProperties {
  return paper === null
    ? {}
    : { position: 'absolute', left: -paper.x, top: -paper.y, width: size?.width, height: size?.height }
}
