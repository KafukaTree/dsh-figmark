/**
 * How big one mark is, in page units, and where its points land in user space.
 *
 * A mark arrives in page units and the document is written in user space, so every
 * shape has to be restated once — turned about its own centre, translated by the
 * page's own transform, and weighed by the figure's size multiple. Doing that here,
 * for every mark kind, is what keeps the shapes in one currency instead of each
 * content stream re-deriving it.
 * @module dsh-figmark/client/pdf/geometry
 */
import type { AnnotationMark, FigurePoint } from '../../shared/annotation'
import { pointsBox, toUserSpace, unitScale } from './coords'

/** Stroke width of every mark at weight 1 on a reference-sized page, in page units. */
export const STROKE_WIDTH = 2.5

/** Arrow head length in page units, matching the overlay's own. */
export const ARROW_HEAD = 14

/** Half-angle of the arrow head, in radians. */
export const ARROW_SPREAD = Math.PI / 7

/** How many segments a turned ellipse is stroked with, so its curve reads as one. */
export const TURN_SEGMENTS = 72

/** Radius of a point mark's ring, in page units. */
export const POINT_RADIUS = 7

/** Radius of the dot at a point mark's centre, in page units. */
export const POINT_DOT_RADIUS = 2.5

/** A mark's geometry, restated in user space. */
export interface PlacedMark {
  /** The mark's points in user space. */
  readonly points: readonly FigurePoint[]
  /** Stroke width in user-space units. */
  readonly width: number
  /** Arrow head length in user-space units. */
  readonly head: number
  /** Whether the mark was turned, so a box or an ellipse is no longer axis-aligned. */
  readonly turned: boolean
}

/**
 * Turn one point around a centre.
 * @param point - the point to turn.
 * @param centre - what it turns around.
 * @param radians - clockwise angle in radians.
 * @returns the turned point.
 */
function turnAround(point: FigurePoint, centre: FigurePoint, radians: number): FigurePoint {
  const sin = Math.sin(radians)
  const cos = Math.cos(radians)
  const dx = point[0] - centre[0]
  const dy = point[1] - centre[1]
  return [centre[0] + dx * cos - dy * sin, centre[1] + dx * sin + dy * cos]
}

/**
 * The ring a box or an ellipse covers once it is turned.
 *
 * A `/Square` and a `/Circle` are axis-aligned by definition, so a turned one cannot
 * be written as one. Its outline is sampled instead and stroked as a polyline, which
 * is exact for a box and smooth enough at {@link TURN_SEGMENTS} for an ellipse. A box
 * that was only half drawn has no ring — it keeps the points it has, so the shape it
 * did draw is still turned.
 *
 * @param kind - which of the two ring-shaped marks this is.
 * @param points - the mark's un-turned geometry, in page units.
 * @param centre - the point it turns around, in page units.
 * @param radians - clockwise angle in radians.
 * @returns the turned ring, in page units.
 */
function turnedRing(
  kind: 'rect' | 'ellipse',
  points: readonly FigurePoint[],
  centre: FigurePoint,
  radians: number,
): readonly FigurePoint[] {
  const [first, second] = points
  const ring: FigurePoint[] = []
  if (first === undefined || second === undefined) {
    ring.push(...points)
  } else {
    const left = Math.min(first[0], second[0])
    const right = Math.max(first[0], second[0])
    const top = Math.min(first[1], second[1])
    const bottom = Math.max(first[1], second[1])
    if (kind === 'rect') {
      ring.push([left, top], [right, top], [right, bottom], [left, bottom], [left, top])
    } else {
      const radiusX = (right - left) / 2
      const radiusY = (bottom - top) / 2
      const centreX = (left + right) / 2
      const centreY = (top + bottom) / 2
      for (let index = 0; index <= TURN_SEGMENTS; index += 1) {
        const angle = (index / TURN_SEGMENTS) * Math.PI * 2
        ring.push([centreX + radiusX * Math.cos(angle), centreY + radiusY * Math.sin(angle)])
      }
    }
  }
  return ring.map(point => turnAround(point, centre, radians))
}

/**
 * Restate one mark's geometry in user space.
 *
 * A mark's rotation turns its points around its own bounding box's centre, exactly
 * as the overlay's `rotate(…)` transform does — so a turned arrow still points where
 * it pointed, and a turned box still covers what it covered. A box or an ellipse is
 * laid down as the ring it turned into, because a `/Square` and a `/Circle` cannot be
 * turned. A `point` mark has no extent to turn, so its rotation is never set.
 *
 * @param mark - the mark, in page units.
 * @param transform - `[a b c d e f]`, user space → page units.
 * @param unit - the page's size multiple, so the pen matches the one on screen.
 * @returns the placed geometry.
 */
export function place(mark: AnnotationMark, transform: readonly number[], unit: number): PlacedMark {
  const scale = unitScale(transform)
  const radians = ((mark.rotation ?? 0) * Math.PI) / 180
  const box = pointsBox(mark.points)
  const centre: FigurePoint = box === undefined
    ? [0, 0]
    : [box.x + box.width / 2, box.y + box.height / 2]
  const turned = radians !== 0 && (mark.kind === 'rect' || mark.kind === 'ellipse')
  const spins = radians !== 0 && mark.kind !== 'point'
  let points: readonly FigurePoint[] = mark.points
  if (mark.kind === 'rect' || mark.kind === 'ellipse') {
    if (turned) points = turnedRing(mark.kind, mark.points, centre, radians)
  } else if (spins) {
    points = mark.points.map(point => turnAround(point, centre, radians))
  }
  // The weight is a multiple of the same base width the overlay uses, so a mark
  // exported to PDF keeps the pen the reader drew it with.
  const weight = (mark.weight ?? 1) * unit
  return {
    points: points.map(point => toUserSpace(transform, point)),
    width: (STROKE_WIDTH * weight) / scale,
    head: (ARROW_HEAD * weight) / scale,
    turned,
  }
}

/**
 * The points one mark draws, including the head an arrow's appearance strokes.
 *
 * An appearance is clipped to its own box, so the head belongs to the geometry the
 * box is measured from — a box around the shaft alone would cut the head off.
 *
 * @param mark - the mark being drawn.
 * @param placed - the mark's geometry in user space.
 * @returns the points the appearance strokes.
 */
export function drawnPoints(mark: AnnotationMark, placed: PlacedMark): readonly FigurePoint[] {
  const [first, second] = placed.points
  if (mark.kind !== 'arrow' || first === undefined || second === undefined) return placed.points
  const angle = Math.atan2(second[1] - first[1], second[0] - first[0])
  return [
    ...placed.points,
    [second[0] - placed.head * Math.cos(angle + ARROW_SPREAD), second[1] - placed.head * Math.sin(angle + ARROW_SPREAD)],
    [second[0] - placed.head * Math.cos(angle - ARROW_SPREAD), second[1] - placed.head * Math.sin(angle - ARROW_SPREAD)],
  ]
}
