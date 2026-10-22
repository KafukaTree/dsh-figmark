/**
 * The control frame around a selected mark.
 *
 * A selected mark is not just highlighted — it is surrounded by the eight resize
 * handles and the rotation handle that say what can be done to it. This module is
 * the arithmetic of that frame: where the handles sit, which one a press grabbed,
 * and what a drag of one of them does to the mark's geometry.
 *
 * Everything here works in figure pixels, so a handle means the same thing at any
 * zoom, and every function is free of React: the surface decides when to call
 * them, and what to do with the result.
 * @module dsh-figmark/client/handles
 */

import type { FigurePoint } from '../shared/annotation'
import { boxCentre, keepAnchored, markBounds, markRadians, normalizeDegrees, rotateAround, type MarkBox } from './mark-geometry'

/**
 * Which handle a gesture grabbed.
 *
 * The eight box handles are named for the corner or edge they sit on, in the
 * mark's own un-rotated frame; `rotate` sits above the top edge.
 */
export type HandleId = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'rotate'

/** Every handle, in the order a renderer walks them. */
export const HANDLE_IDS: readonly HandleId[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']

/** Side length of one handle's square, in figure pixels. */
export const HANDLE_SIZE = 7

/**
 * Distance from the top edge to the rotation handle, in figure pixels.
 *
 * Measured from the box, not from the handle's own centre, so the tether stays
 * visible however small the mark is.
 */
export const ROTATE_ARM = 22

/** Smallest box a resize may leave, in figure pixels, so a mark cannot vanish. */
export const MIN_MARK_SIZE = 6

/** One handle, placed. */
export interface Handle {
  /** Which handle this is. */
  readonly id: HandleId
  /** Its centre in figure pixels, already turned with the mark. */
  readonly point: FigurePoint
}

/**
 * The unit directions two opposite edges of a box lie in.
 * @param id - a box handle.
 * @returns which sides it moves: `-1` is the low side, `1` the high side, `0` neither.
 */
function edgesOf(id: Exclude<HandleId, 'rotate'>): { readonly x: -1 | 0 | 1; readonly y: -1 | 0 | 1 } {
  switch (id) {
    case 'nw': return { x: -1, y: -1 }
    case 'n': return { x: 0, y: -1 }
    case 'ne': return { x: 1, y: -1 }
    case 'e': return { x: 1, y: 0 }
    case 'se': return { x: 1, y: 1 }
    case 's': return { x: 0, y: 1 }
    case 'sw': return { x: -1, y: 1 }
    case 'w': return { x: -1, y: 0 }
  }
}

/**
 * Where every handle around one box sits.
 *
 * The handle positions are computed in the mark's own upright frame and then
 * turned around its centre, so they land exactly on the outline the overlay
 * draws for the same rotation.
 * @param box - the box to frame, in figure pixels.
 * @param rotation - the mark's rotation in degrees.
 * @returns the handles.
 */
export function handlesFor(box: MarkBox, rotation: number): Handle[] {
  const centre = boxCentre(box)
  const radians = (rotation * Math.PI) / 180
  const at = (x: number, y: number): FigurePoint => rotateAround([x, y], centre, radians)
  const right = box.x + box.width
  const bottom = box.y + box.height
  const placed: Handle[] = HANDLE_IDS.map(id => {
    const edges = edgesOf(id as Exclude<HandleId, 'rotate'>)
    const x = edges.x === -1 ? box.x : edges.x === 1 ? right : centre[0]
    const y = edges.y === -1 ? box.y : edges.y === 1 ? bottom : centre[1]
    return { id, point: at(x, y) }
  })
  placed.push({ id: 'rotate', point: at(centre[0], box.y - ROTATE_ARM) })
  return placed
}

/**
 * The line that ties the rotation handle to the box it turns.
 *
 * It reads as attached to the mark only because it is anchored on the top edge
 * itself, so both ends come from the same frame the handles are placed in.
 * @param box - the box to frame, in figure pixels.
 * @param rotation - the mark's rotation in degrees.
 * @returns the two ends of the tether, from the turn handle to the top edge.
 */
export function tetherFor(box: MarkBox, rotation: number): { readonly from: FigurePoint; readonly to: FigurePoint } {
  const centre = boxCentre(box)
  const radians = (rotation * Math.PI) / 180
  return {
    from: rotateAround([centre[0], box.y - ROTATE_ARM], centre, radians),
    to: rotateAround([centre[0], box.y], centre, radians),
  }
}

/**
 * Which handle a press grabbed, if any.
 * @param box - the box the control frame is drawn around.
 * @param rotation - the mark's rotation in degrees.
 * @param at - the press position, in figure pixels.
 * @param reach - how far from a handle's centre still counts, in figure pixels.
 * @returns the handle grabbed, or undefined for a press on the mark itself.
 */
export function handleAt(
  box: MarkBox,
  rotation: number,
  at: FigurePoint,
  reach = HANDLE_SIZE,
): HandleId | undefined {
  let best: HandleId | undefined
  let bestDistance = reach
  for (const handle of handlesFor(box, rotation)) {
    const distance = Math.hypot(handle.point[0] - at[0], handle.point[1] - at[1])
    // A corner beats the edge handle it shares a position with, because the
    // corners are pushed out first and a tie would otherwise depend on order.
    if (distance <= bestDistance) {
      best = handle.id
      bestDistance = distance
    }
  }
  return best
}

/** The change one handle drag asks for, before it is applied. */
export interface ResizeRequest {
  /** The handle the drag is holding. */
  readonly handle: Exclude<HandleId, 'rotate'>
  /** Where the pointer is now, in figure pixels. */
  readonly at: FigurePoint
  /** The mark's geometry when the drag began, in figure pixels. */
  readonly origin: readonly FigurePoint[]
  /** The mark's rotation in degrees. */
  readonly rotation: number
}

/**
 * Resize a mark by dragging one of its box handles.
 *
 * The drag happens in the mark's own frame: the pointer is turned back by the
 * mark's rotation so a tilted box grows along its own axes rather than the
 * screen's. The handle opposite the one held is the fixed point, which is what
 * makes the shape appear to grow from the edge the user is not touching; the
 * result is then re-anchored so that corner does not drift when the centre — and
 * with it the rotation — moves.
 *
 * @param request - the handle, the pointer, and the geometry it started from.
 * @returns the resized geometry, in figure pixels.
 */
export function resizeBy(request: ResizeRequest): readonly FigurePoint[] {
  const { handle, at, origin, rotation } = request
  const box = markBounds(origin)
  /* v8 ignore next -- the surface only offers handles for a mark that has a box. */
  if (box === undefined) return origin
  const centre = boxCentre(box)
  const radians = markRadians({ rotation })
  // Work in the mark's own frame: undoing the rotation makes the drag a plain
  // axis-aligned resize, which is the whole reason rotation is stored apart.
  const local = rotateAround(at, centre, -radians)
  const edges = edgesOf(handle)
  const right = box.x + box.width
  const bottom = box.y + box.height
  // A flat shape has no extent in one axis to scale, so a handle that only moves
  // that axis leaves it alone rather than snapping the shape onto an edge.
  const movesX = edges.x !== 0 && box.width > 0
  const movesY = edges.y !== 0 && box.height > 0
  // The held edge follows the pointer; the opposite edge stays where it is.
  const left = movesX && edges.x === -1 ? Math.min(local[0], right - MIN_MARK_SIZE) : box.x
  const top = movesY && edges.y === -1 ? Math.min(local[1], bottom - MIN_MARK_SIZE) : box.y
  const nextRight = movesX && edges.x === 1 ? Math.max(local[0], box.x + MIN_MARK_SIZE) : right
  const nextBottom = movesY && edges.y === 1 ? Math.max(local[1], box.y + MIN_MARK_SIZE) : bottom
  const resized: MarkBox = { x: left, y: top, width: nextRight - left, height: nextBottom - top }
  const scaled = scalePoints(origin, box, resized)
  // The corner opposite the one held is invariant under the proportional map, so
  // one coordinate describes it in both frames; the translation below is what
  // keeps it there once the centre — and with it the rotation — has moved.
  const corner: FigurePoint = [edges.x === 1 ? box.x : right, edges.y === 1 ? box.y : bottom]
  return keepAnchored(scaled, radians, corner, centre)
}

/**
 * Map every point from one box into another, proportionally.
 *
 * A mark is its points, so resizing them is what resizing the mark means — and
 * mapping rather than rebuilding keeps a freehand stroke's own shape.
 * @param points - the geometry to map.
 * @param from - the box it currently fills.
 * @param to - the box it should fill.
 * @returns the mapped geometry.
 */
function scalePoints(points: readonly FigurePoint[], from: MarkBox, to: MarkBox): readonly FigurePoint[] {
  const scaleX = from.width === 0 ? 1 : to.width / from.width
  const scaleY = from.height === 0 ? 1 : to.height / from.height
  return points.map(point => [
    to.x + (point[0] - from.x) * scaleX,
    to.y + (point[1] - from.y) * scaleY,
  ] as FigurePoint)
}

/**
 * The rotation a drag of the rotation handle asks for.
 *
 * The angle is measured from the mark's centre to the pointer, offset by the
 * quarter turn between "up" and the handle's own resting position, so the handle
 * stays under the pointer as the mark turns. Holding Shift snaps to 15° steps.
 *
 * @param centre - the mark's centre, in figure pixels.
 * @param at - the pointer, in figure pixels.
 * @param snap - whether to snap to 15° steps.
 * @returns the clockwise rotation in degrees, in `[0, 360)`.
 */
export function rotationTo(centre: FigurePoint, at: FigurePoint, snap: boolean): number {
  const radians = Math.atan2(at[1] - centre[1], at[0] - centre[0]) + Math.PI / 2
  const degrees = normalizeDegrees((radians * 180) / Math.PI)
  return snap ? normalizeDegrees(Math.round(degrees / 15) * 15) : degrees
}

/** The cursor for one handle: what dragging it will do. */
const CURSORS: Readonly<Record<HandleId, string>> = {
  nw: 'nwse-resize',
  n: 'ns-resize',
  ne: 'nesw-resize',
  e: 'ew-resize',
  se: 'nwse-resize',
  s: 'ns-resize',
  sw: 'nesw-resize',
  w: 'ew-resize',
  rotate: 'grab',
}

/**
 * The mouse cursor for one handle.
 * @param id - the handle.
 * @returns a CSS cursor keyword.
 */
export function cursorFor(id: HandleId): string {
  return CURSORS[id]
}
