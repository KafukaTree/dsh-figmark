/**
 * Mark geometry edits, kept apart from the component that asks for them.
 *
 * A drag reports the geometry it ended with, and a gesture that ends where it
 * started is not an edit. Putting a mark at that geometry — and re-anchoring it
 * to whatever the drop landed on — is fiddly enough on its own to exercise
 * without a rendered surface.
 * @module dsh-figmark/client/mark-geometry
 */

import type { AnnotationMark, FigurePoint, MarkAnchor } from '../shared/annotation'

/**
 * Whether two point lists describe exactly the same geometry.
 * @param before - one list of points, in figure pixels.
 * @param after - the other list.
 * @returns true when both lists are the same length and every point matches.
 */
export function samePoints(before: readonly FigurePoint[], after: readonly FigurePoint[]): boolean {
  if (before.length !== after.length) return false
  for (let index = 0; index < before.length; index += 1) {
    const one = before[index]
    const other = after[index]
    // Stored marks come from a file the plugin did not write on its own, so a
    // point can be missing; that is a difference, not something to throw over.
    if (one === undefined || other === undefined) return false
    if (one[0] !== other[0] || one[1] !== other[1]) return false
  }
  return true
}

/**
 * Move a point list by one offset.
 * @param points - the geometry to move, in figure pixels.
 * @param dx - horizontal offset.
 * @param dy - vertical offset.
 * @returns every point, moved.
 */
export function shiftPoints(points: readonly FigurePoint[], dx: number, dy: number): readonly FigurePoint[] {
  return points.map(point => [point[0] + dx, point[1] + dy] as FigurePoint)
}

/**
 * One mark's geometry replaced, and its anchor replaced with it.
 *
 * The anchor describes what the mark points at, so it cannot outlive the
 * position it was recorded at: a drop that landed on nothing clears it rather
 * than leaving the mark claiming to name something it no longer points at.
 * @param mark - the mark to move.
 * @param points - the geometry it was dropped at, in figure pixels.
 * @param anchor - what the drop point landed on, or undefined when nothing.
 * @returns the mark at its new geometry.
 */
export function withGeometry(
  mark: AnnotationMark,
  points: readonly FigurePoint[],
  anchor: MarkAnchor | undefined,
): AnnotationMark {
  const next: { -readonly [K in keyof AnnotationMark]: AnnotationMark[K] } = { ...mark, points }
  if (anchor === undefined) delete next.anchor
  else next.anchor = anchor
  return next
}

/**
 * Where a drag leaves the mark list.
 *
 * Null when the drop asks for nothing: a mark that is not in the list, or a
 * gesture that ends at the geometry the mark already had. Those are not edits,
 * and the caller must not record an undo step for them.
 * @param marks - the marks the surface is showing.
 * @param id - the mark the drag moved.
 * @param points - the geometry it was dropped at, in figure pixels.
 * @param anchor - what the drop point landed on, or undefined when nothing.
 * @returns the list to commit, or null when the drag changed nothing.
 */
export function draggedMarks(
  marks: readonly AnnotationMark[],
  id: string,
  points: readonly FigurePoint[],
  anchor: MarkAnchor | undefined,
): AnnotationMark[] | null {
  const before = marks.find(mark => mark.id === id)
  if (before === undefined) return null
  if (samePoints(before.points, points)) return null
  return marks.map(mark => (mark.id === id ? withGeometry(mark, points, anchor) : mark))
}

/** An axis-aligned box in figure pixels. */
export interface MarkBox {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

/**
 * The axis-aligned box a point list occupies.
 *
 * Every mark's control frame is measured from this box: its handles sit on its
 * corners, and its rotation turns around its centre — so a mark with no points
 * has neither, and says so.
 * @param points - the mark's geometry, in figure pixels.
 * @returns the box, or undefined when there is no point to measure.
 */
export function markBounds(points: readonly FigurePoint[]): MarkBox | undefined {
  const first = points[0]
  if (first === undefined) return undefined
  let left = first[0]
  let right = first[0]
  let top = first[1]
  let bottom = first[1]
  for (const point of points) {
    left = Math.min(left, point[0])
    right = Math.max(right, point[0])
    top = Math.min(top, point[1])
    bottom = Math.max(bottom, point[1])
  }
  return { x: left, y: top, width: right - left, height: bottom - top }
}

/**
 * The box a mark covers on screen, once its rotation is applied.
 *
 * A turned box covers more than its own corners do, and a label placed from the
 * un-rotated box would land on top of the shape it describes. This is the extent
 * a reader actually sees.
 * @param points - the mark's geometry, in figure pixels.
 * @param rotation - its clockwise rotation in degrees.
 * @returns the axis-aligned box the rotated mark occupies.
 */
export function uprightBounds(points: readonly FigurePoint[], rotation: number): MarkBox | undefined {
  const box = markBounds(points)
  if (box === undefined) return undefined
  const radians = (rotation * Math.PI) / 180
  if (radians === 0) return box
  const centre = boxCentre(box)
  const corners: readonly FigurePoint[] = [
    [box.x, box.y],
    [box.x + box.width, box.y],
    [box.x + box.width, box.y + box.height],
    [box.x, box.y + box.height],
  ]
  return markBounds(corners.map(corner => rotateAround(corner, centre, radians)))
}

/**
 * The centre of a box, which is where its mark turns.
 * @param box - the box.
 * @returns its centre point.
 */
export function boxCentre(box: MarkBox): FigurePoint {
  return [box.x + box.width / 2, box.y + box.height / 2]
}

/**
 * Turn one point around a centre.
 * @param point - the point to turn.
 * @param centre - what it turns around.
 * @param radians - clockwise angle in radians.
 * @returns the turned point.
 */
export function rotateAround(point: FigurePoint, centre: FigurePoint, radians: number): FigurePoint {
  if (radians === 0) return point
  const sin = Math.sin(radians)
  const cos = Math.cos(radians)
  const dx = point[0] - centre[0]
  const dy = point[1] - centre[1]
  return [centre[0] + dx * cos - dy * sin, centre[1] + dx * sin + dy * cos]
}

/** Degrees per radian, for the angle conversions the handles do. */
export const DEGREES_PER_RADIAN = 180 / Math.PI

/**
 * A mark's rotation in radians.
 * @param mark - the mark; a mark without a rotation is upright.
 * @returns the clockwise angle in radians.
 */
export function markRadians(mark: { readonly rotation?: number }): number {
  return ((mark.rotation ?? 0) * Math.PI) / 180
}

/**
 * Fold an angle into one turn, so a stored rotation never grows without bound.
 * @param degrees - an angle in degrees.
 * @returns the same angle in `[0, 360)`.
 */
export function normalizeDegrees(degrees: number): number {
  const folded = degrees % 360
  return folded < 0 ? folded + 360 : folded
}

/**
 * Restate a point list so a chosen point lands where it was before the edit.
 *
 * Changing a mark's geometry moves the centre it turns around, which swings the
 * rest of the mark — grabbing one corner of a tilted box would otherwise drag the
 * opposite corner away. Re-anchoring on the point that must not move is what makes
 * a handle feel attached to the shape.
 * @param points - the new geometry, before compensation.
 * @param rotation - the mark's rotation in radians.
 * @param anchor - the point that must stay where it is, in the new geometry's frame.
 * @param wasCentre - the centre the mark turned around before the edit.
 * @returns the geometry, translated so `anchor` did not move on screen.
 */
export function keepAnchored(
  points: readonly FigurePoint[],
  rotation: number,
  anchor: FigurePoint,
  wasCentre: FigurePoint,
): readonly FigurePoint[] {
  const box = markBounds(points)
  /* v8 ignore next -- every caller passes a point list it just built from a box. */
  if (box === undefined) return points
  const now = rotateAround(anchor, boxCentre(box), rotation)
  const was = rotateAround(anchor, wasCentre, rotation)
  const dx = was[0] - now[0]
  const dy = was[1] - now[1]
  if (dx === 0 && dy === 0) return points
  return shiftPoints(points, dx, dy)
}
