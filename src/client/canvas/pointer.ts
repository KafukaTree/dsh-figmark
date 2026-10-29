/**
 * The two questions every pointer event on the surface asks.
 *
 * A pointer arrives in client pixels; a mark is stored in figure pixels. Turning
 * one into the other is a coordinate transform that depends on the paper's size,
 * its origin, and how the browser laid the svg out — and getting it slightly wrong
 * puts every mark a few pixels off, which reads as "the drawing is inaccurate"
 * rather than as a bug. The inverse question is "what did this point land on",
 * which a figure can answer in two different ways and only one of them applies.
 *
 * Both live here so that the surface never does this arithmetic itself: if a mark
 * is drawn in the wrong place, this module is the whole of the search space.
 * @module dsh-figmark/client/canvas/pointer
 */

import type { RefObject } from 'react'
import type { FigurePoint, MarkAnchor } from '../../shared/annotation'
import { anchorAtPoint } from '../figure-dom'
import type { EventPoint } from './types'

/** Where figure coordinate `(0, 0)` sits on this paper, and how big the paper is. */
export interface SurfaceGeometry {
  /** Width of the paper, in figure pixels. */
  readonly width: number
  /** Height of the paper, in figure pixels. */
  readonly height: number
  /** Horizontal offset of figure `(0, 0)` on the paper, in figure pixels. */
  readonly originX: number
  /** Vertical offset of figure `(0, 0)` on the paper, in figure pixels. */
  readonly originY: number
}

/**
 * How one surface names the element under a point.
 *
 * Two kinds of figure answer this differently, and only one of them can be
 * answered for any given surface: a rendered document reports its own elements in
 * its own layout pixels, while an inline SVG has to be hit-tested against client
 * coordinates because its elements live in this document.
 */
export interface AnchorSource {
  /** Whether the figure is inlined SVG, which is when client hit-testing applies. */
  readonly anchoring: boolean
  /** Container that holds the figure, used as the anchor hit-test origin. */
  readonly containerRef: RefObject<HTMLElement | null>
  /**
   * Name the element one figure point landed on, for a surface whose elements live
   * in a document of their own.
   */
  readonly anchorAtFigurePoint: ((x: number, y: number) => MarkAnchor | undefined) | undefined
}

/**
 * Convert one pointer event to figure pixels.
 *
 * A collapsed pane reports a zero-size box; treating it as 1:1 keeps a drag from
 * committing infinite coordinates.
 * @param event - the pointer event, bound to the surface.
 * @param geometry - the paper's size and origin.
 * @returns the point in figure pixels.
 */
export function figurePointOf(event: EventPoint, geometry: SurfaceGeometry): FigurePoint {
  const rect = event.currentTarget.getBoundingClientRect()
  const scaleX = rect.width === 0 ? 1 : geometry.width / rect.width
  const scaleY = rect.height === 0 ? 1 : geometry.height / rect.height
  return [
    (event.clientX - rect.left) * scaleX - geometry.originX,
    (event.clientY - rect.top) * scaleY - geometry.originY,
  ]
}

/**
 * Describe what the point under a pointer landed on.
 *
 * A rendered document reports its elements in its own layout pixels, which are the
 * figure units already, so it names them from the point. An inline SVG is
 * hit-tested against client coordinates instead, because its elements live in the
 * same document as this overlay and their boxes are the browser's own.
 *
 * The svg's box is read here rather than in {@link figurePointOf} again because
 * the two answers are needed at different times — a press reads the point first and
 * the name second — and a cached rect would go stale the moment the pane resized
 * between them.
 * @param event - the pointer event, bound to the surface.
 * @param point - the same event, in figure pixels.
 * @param geometry - the paper's size.
 * @param source - how this surface names elements.
 * @returns the anchor, or undefined when the point names nothing.
 */
export function anchorOf(
  event: EventPoint,
  point: FigurePoint,
  geometry: SurfaceGeometry,
  source: AnchorSource,
): MarkAnchor | undefined {
  if (source.anchorAtFigurePoint !== undefined) return source.anchorAtFigurePoint(point[0], point[1])
  const container = source.containerRef.current
  if (!source.anchoring || container === null) return undefined
  const rect = event.currentTarget.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return undefined
  // Hit-test the figure at the *point*, not at the pointer. The two differ by the
  // grab offset whenever the gesture was not a placement: a mark dragged by its middle
  // ends with its tip somewhere other than under the hand, and asking the browser what
  // is under the hand re-anchored the mark to whatever the reader's cursor happened to
  // be over — an arrow dropped over the legend re-anchored to the legend while its own
  // tip pointed at a curve. The point is already in figure pixels, so mapping it back
  // to client coordinates is the inverse of what produced it.
  const scaleX = geometry.width / rect.width
  const scaleY = geometry.height / rect.height
  const clientX = rect.left + (point[0] + geometry.originX) / scaleX
  const clientY = rect.top + (point[1] + geometry.originY) / scaleY
  return anchorAtPoint(container, clientX, clientY, scaleX, scaleY)
}
