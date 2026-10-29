/**
 * The control frame around a selected mark.
 *
 * A selected mark is not just highlighted — it is surrounded by the handles that say
 * what can be done to it: eight resize grips and a turn grip around a box, or one
 * grip on each end of a line for the marks that are a line. This module is the
 * arithmetic of that frame: where the handles sit, which one a press grabbed, and
 * what a drag of one of them does to the mark's geometry.
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
 * mark's own un-rotated frame; `rotate` sits above the top edge. A two-point mark —
 * an arrow — gets the third kind instead: one grip on each end of the line it draws.
 */
export type HandleId = BoxHandleId | 'rotate' | EndHandleId

/** A handle on the frame around a mark's box: its four corners and four edges. */
export type BoxHandleId = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

/** A grip on one end of a two-point mark. */
export type EndHandleId = 'tail' | 'tip'

/** Every box handle, in the order a renderer walks them. */
export const HANDLE_IDS: readonly BoxHandleId[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']

/**
 * Side length of one handle's square, in *screen* pixels.
 *
 * Not figure pixels: a handle is a control, and a control is a target for a finger.
 * Seven figure pixels on a 2400px figure displayed at a quarter size is under two
 * screen pixels — impossible to hit. The surface converts this to figure pixels by
 * dividing by how much the paper is scaled, so the target stays the same size on
 * screen whatever the figure's own dimensions or the current zoom.
 */
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

/** A box handle, placed. */
export interface BoxHandle extends Handle {
  /** Which corner or edge of the frame this is. */
  readonly id: BoxHandleId
}

/** The turn grip, placed. */
export interface RotateHandle extends Handle {
  /** The one grip that turns the mark rather than resizing it. */
  readonly id: 'rotate'
}

/** A handle on a box's control frame: the eight resize grips and the turn grip. */
export type FrameHandle = BoxHandle | RotateHandle

/** Which frame handle a press grabbed. */
export type FrameHandleId = BoxHandleId | 'rotate'

/** An end grip, placed. */
export interface EndHandle extends Handle {
  /** Which end of the marked line this is. */
  readonly id: EndHandleId
}

/**
 * The unit directions two opposite edges of a box lie in.
 * @param id - a box handle.
 * @returns which sides it moves: `-1` is the low side, `1` the high side, `0` neither.
 */
function edgesOf(id: BoxHandleId): { readonly x: -1 | 0 | 1; readonly y: -1 | 0 | 1 } {
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
export function handlesFor(box: MarkBox, rotation: number, size = HANDLE_SIZE): FrameHandle[] {
  const centre = boxCentre(box)
  const radians = (rotation * Math.PI) / 180
  const at = (x: number, y: number): FigurePoint => rotateAround([x, y], centre, radians)
  const right = box.x + box.width
  const bottom = box.y + box.height
  const placed: FrameHandle[] = HANDLE_IDS.map(id => {
    const edges = edgesOf(id)
    const x = edges.x === -1 ? box.x : edges.x === 1 ? right : centre[0]
    const y = edges.y === -1 ? box.y : edges.y === 1 ? bottom : centre[1]
    return { id, point: at(x, y) }
  })
  placed.push({ id: 'rotate', point: at(centre[0], box.y - armFor(size)) })
  return placed
}

/**
 * Where the two end grips of a two-point mark sit.
 *
 * An arrow is a line with an arrowhead, not a box: eight corner handles around the
 * rectangle its ends span ask the reader to resize a shape that has no width, and
 * they cover four square corners the arrow never draws. Its two ends are the whole
 * of its geometry, so they are the whole of its control frame. The ends are turned
 * with the mark, like the box handles, so they sit on the line as it is drawn.
 * @param points - the mark's stored geometry: tail first, then tip.
 * @param rotation - the mark's rotation in degrees.
 * @returns the two grips, empty for a mark with fewer than two points.
 */
export function endHandles(points: readonly FigurePoint[], rotation: number): EndHandle[] {
  const [tail, tip] = points
  if (tail === undefined || tip === undefined) return []
  const box = markBounds(points)
  /* v8 ignore next -- two points always make a box. */
  if (box === undefined) return []
  const centre = boxCentre(box)
  const radians = (rotation * Math.PI) / 180
  return [
    { id: 'tail', point: rotateAround(tail, centre, radians) },
    { id: 'tip', point: rotateAround(tip, centre, radians) },
  ]
}

/**
 * How far the turn handle stands off the top edge, for a handle of a given size.
 *
 * Proportional to the handle: a bigger grip on a short arm would have the circle
 * overlapping the corner squares, and a smaller one on a long arm would look
 * detached from the frame it turns.
 * @param size - the handle's side, in figure pixels.
 * @returns the distance from the top edge, in figure pixels.
 */
function armFor(size: number): number {
  return size * (ROTATE_ARM / HANDLE_SIZE)
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
export function tetherFor(
  box: MarkBox,
  rotation: number,
  size = HANDLE_SIZE,
): { readonly from: FigurePoint; readonly to: FigurePoint } {
  const centre = boxCentre(box)
  const radians = (rotation * Math.PI) / 180
  return {
    from: rotateAround([centre[0], box.y - armFor(size)], centre, radians),
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
  size = HANDLE_SIZE,
): FrameHandleId | undefined {
  let best: FrameHandleId | undefined
  let bestDistance = reach
  for (const handle of handlesFor(box, rotation, size)) {
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

/**
 * The handle a press may take, if the press was aimed at one.
 *
 * Two conditions, and the second is the one that matters for a small mark. A press
 * within reach of a grip is a press on the grip only if it is nearer to that grip
 * than to the middle of the shape: the grips of a small mark overlap each other and
 * cover the whole of it, so reach alone turned every press on a small mark into a
 * resize, and a tick label or a short arrow could never be dragged. Aiming at the
 * middle is aiming at the mark; aiming nearer a corner is aiming at the corner.
 * @param box - the mark's frame, in its own upright frame.
 * @param rotation - the mark's rotation in degrees.
 * @param at - where the press landed, in figure pixels.
 * @param reach - how far from a grip the press still counts, in figure pixels.
 * @param size - the grip's side, in figure pixels.
 * @returns the handle the press took, or undefined to leave it to the shape.
 */
export function gripAt(
  box: MarkBox,
  rotation: number,
  at: FigurePoint,
  reach = HANDLE_SIZE,
  size = HANDLE_SIZE,
): FrameHandleId | undefined {
  const near = handleAt(box, rotation, at, reach, size)
  if (near === undefined) return undefined
  const centre = boxCentre(box)
  const toCentre = Math.hypot(at[0] - centre[0], at[1] - centre[1])
  const grip = handlesFor(box, rotation, size).find(handle => handle.id === near)
  /* v8 ignore next -- `handleAt` only names a handle `handlesFor` just placed. */
  if (grip === undefined) return undefined
  const toGrip = Math.hypot(at[0] - grip.point[0], at[1] - grip.point[1])
  return toGrip <= toCentre ? near : undefined
}

/**
 * The end grip a press may take, if the press was aimed at one.
 *
 * The same two conditions the box grips use: within reach, and nearer the grip than
 * the middle of the line. An arrow is thin, so its two grips are close to each other
 * on a short arrow — aiming at the shaft is still aiming at the mark.
 * @param points - the mark's stored geometry: tail first, then tip.
 * @param rotation - the mark's rotation in degrees.
 * @param at - where the press landed, in figure pixels.
 * @param reach - how far from a grip the press still counts, in figure pixels.
 * @returns the end grip the press took, or undefined to leave it to the shape.
 */
export function endAt(
  points: readonly FigurePoint[],
  rotation: number,
  at: FigurePoint,
  reach = HANDLE_SIZE,
): EndHandleId | undefined {
  let best: EndHandleId | undefined
  let bestDistance = reach
  for (const handle of endHandles(points, rotation)) {
    const distance = Math.hypot(handle.point[0] - at[0], handle.point[1] - at[1])
    if (distance <= bestDistance) {
      best = handle.id
      bestDistance = distance
    }
  }
  if (best === undefined) return undefined
  const box = markBounds(points)
  /* v8 ignore next -- an end grip is only placed for a mark with two points. */
  if (box === undefined) return undefined
  const centre = boxCentre(box)
  const toCentre = Math.hypot(at[0] - centre[0], at[1] - centre[1])
  const grip = endHandles(points, rotation).find(handle => handle.id === best)
  /* v8 ignore next -- `endHandles` just placed this grip. */
  if (grip === undefined) return undefined
  const toGrip = Math.hypot(at[0] - grip.point[0], at[1] - grip.point[1])
  return toGrip <= toCentre ? best : undefined
}

/** The change one end drag asks for, before it is applied. */
export interface EndRequest {
  /** The end the drag is holding. */
  readonly end: EndHandleId
  /** Where the pointer is now, in figure pixels. */
  readonly at: FigurePoint
  /** The mark's geometry when the drag began, in figure pixels. */
  readonly origin: readonly FigurePoint[]
  /** The mark's rotation in degrees. */
  readonly rotation: number
}

/**
 * Move one end of a two-point mark to the pointer.
 *
 * The other end is the fixed point: dragging the tip turns the arrow about its tail
 * rather than sliding the whole line, which is what a grip on one end means. The
 * pointer is turned back by the mark's rotation first, so a turned arrow's drawn end
 * still follows the hand.
 * @param request - the end, the pointer, and the geometry it started from.
 * @returns the new geometry, in figure pixels.
 */
export function movedEnd(request: EndRequest): readonly FigurePoint[] {
  const { end, at, origin, rotation } = request
  const [tail, tip] = origin
  if (tail === undefined || tip === undefined) return origin
  const box = markBounds(origin)
  /* v8 ignore next -- two points always make a box. */
  if (box === undefined) return origin
  const local = rotateAround(at, boxCentre(box), -markRadians({ rotation }))
  return end === 'tail' ? [local, tip] : [tail, local]
}

/** The change one handle drag asks for, before it is applied. */
export interface ResizeRequest {
  /** The handle the drag is holding. */
  readonly handle: BoxHandleId
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
/**
 * The turn cursor, as an inline svg.
 *
 * A `grab` hand says "this thing can be dragged", which is what the eight resize
 * handles already say in their own way — the reader read the turn handle as one more
 * grab point rather than as the one control that rotates. So the turn handle gets the
 * arrow-in-a-circle everyone else uses for "rotate this": drawn white with a dark rim
 * so it reads on the light paper and on the dark panels alike. `24 24` is the CSS
 * keyword's own convention for a centre hotspot.
 */
const TURN_CURSOR = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">'
  + '<g fill="none" stroke-linecap="round" stroke-linejoin="round">'
  + '<path d="M17.5 7.5A7 7 0 1 1 8.6 6.1" stroke="#ffffff" stroke-width="4.4"/>'
  + '<path d="M17.5 7.5A7 7 0 1 1 8.6 6.1" stroke="#2d2d2d" stroke-width="2"/>'
  + '<path d="M15.2 3.1L18.6 8.2L12.9 8.9" stroke="#ffffff" stroke-width="4.4"/>'
  + '<path d="M15.2 3.1L18.6 8.2L12.9 8.9" stroke="#2d2d2d" stroke-width="2"/>'
  + '</g></svg>',
)}") 12 12, crosshair`

const CURSORS: Readonly<Record<HandleId, string>> = {
  // An end grip drags one point of a line, which is a move rather than a resize: the
  // cursor says "this moves" because that is exactly what it does to the shape.
  tail: 'move',
  tip: 'move',
  nw: 'nwse-resize',
  n: 'ns-resize',
  ne: 'nesw-resize',
  e: 'ew-resize',
  se: 'nwse-resize',
  s: 'ns-resize',
  sw: 'nesw-resize',
  w: 'ew-resize',
  rotate: TURN_CURSOR,
}

/**
 * The mouse cursor for one handle.
 * @param id - the handle.
 * @returns a CSS cursor keyword.
 */
export function cursorFor(id: HandleId): string {
  return CURSORS[id]
}
