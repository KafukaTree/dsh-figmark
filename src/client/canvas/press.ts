/**
 * What a gesture has done to a mark so far.
 *
 * Three gestures share one press: a plain drag moves the mark, the rotation handle
 * turns it, and a box handle resizes it. Each is expressed against the geometry the
 * gesture began with, so a long drag accumulates from where it started rather than
 * drifting frame to frame — which is why the origin is carried on the press instead
 * of being read back off the props.
 *
 * Everything here is arithmetic on marks and points: no React, no DOM, so the
 * gestures a surface offers can be exercised without a rendered surface.
 * @module dsh-figmark/client/canvas/press
 */

import type { AnnotationMark, FigurePoint, MarkKind } from '../../shared/annotation'
import { boxCentre, markBounds, shiftPoints } from '../mark-geometry'
import { movedEnd, resizeBy, rotationTo, type HandleId } from '../handles'
import type { MarkPatch } from './types'

/**
 * A press that landed on an existing mark, and the gesture it may become.
 *
 * One shape for three gestures, because they all begin the same way: the press
 * remembers what it landed on and the mark as it was, and each pointer move asks
 * that saved state what the mark now looks like.
 */
export interface Press {
  /** Mark the press landed on. */
  readonly id: string
  /** Where the press landed, in figure pixels. */
  readonly from: FigurePoint
  /** Geometry the mark had when the press landed. */
  readonly origin: readonly FigurePoint[]
  /** Rotation the mark had when the press landed, in degrees. */
  readonly originRotation: number
  /** The mark's kind, which decides what its handles mean. */
  readonly kind: MarkKind
  /** The handle the press grabbed, when it grabbed one. */
  readonly handle: HandleId | undefined
  /** Whether Shift is held: snaps the rotation to 15° steps. */
  readonly snap: boolean
  /** What the gesture has done so far; null until the pointer moves. */
  readonly edit: PressEdit | null
}

/** One gesture's running result, in the mark's own terms. */
export interface PressEdit {
  /** Geometry to draw, or undefined when the gesture does not change points. */
  readonly points: readonly FigurePoint[] | undefined
  /** Rotation to draw, or undefined when it does not change. */
  readonly rotation: number | undefined
}

/**
 * What one pointer move means to the gesture in flight.
 * @param held - the press being dragged.
 * @param point - the pointer, in figure pixels.
 * @param dx - horizontal movement since the press, in figure pixels.
 * @param dy - vertical movement since the press.
 * @returns what to draw until the gesture ends.
 */
export function editFor(held: Press, point: FigurePoint, dx: number, dy: number): PressEdit {
  const handle = held.handle
  if (handle === undefined) {
    return { points: shiftPoints(held.origin, dx, dy), rotation: undefined }
  }
  const box = markBounds(held.origin)
  /* v8 ignore next -- a handle is only offered for a mark that has a box. */
  if (box === undefined) return { points: undefined, rotation: undefined }
  if (handle === 'rotate') {
    const rotation = rotationTo(boxCentre(box), point, held.snap)
    return { points: undefined, rotation }
  }
  // An end grip moves one end of the line and leaves the other where it was; a box
  // grip resizes the shape as a whole.
  if (handle === 'tail' || handle === 'tip') {
    return {
      points: movedEnd({ end: handle, at: point, origin: held.origin, rotation: held.originRotation }),
      rotation: undefined,
    }
  }
  return {
    points: resizeBy({ handle, at: point, origin: held.origin, rotation: held.originRotation }),
    rotation: undefined,
  }
}

/**
 * The patch a finished handle drag asks the owner to record.
 *
 * Only the fields the edit actually produced are listed, so a resize does not
 * clear a rotation. A gesture that produced nothing at all carries no fields, and
 * the caller can tell that apart by its emptiness rather than by a null.
 * @param edit - what the gesture drew.
 * @returns the fields that changed; empty when none did.
 */
export function patchFrom(edit: PressEdit): MarkPatch {
  const patch: { points?: readonly FigurePoint[]; rotation?: number } = {}
  if (edit.points !== undefined) patch.points = edit.points
  if (edit.rotation !== undefined) patch.rotation = edit.rotation
  return patch
}

/**
 * The mark as the running gesture currently has it, for drawing only.
 *
 * The stored mark is left alone until the gesture is dropped: a drag redraws from
 * the press's origin every frame, so nothing is committed to the annotation file
 * for a movement the reader may still abandon.
 * @param mark - the stored mark.
 * @param press - the gesture in flight, or null when none.
 * @returns the mark to draw.
 */
export function shownMark(mark: AnnotationMark, press: Press | null): AnnotationMark {
  const edit = press !== null && press.id === mark.id ? press.edit : null
  if (edit === null) return mark
  const next: { -readonly [K in keyof AnnotationMark]: AnnotationMark[K] } = { ...mark, points: shownPoints(mark, press) }
  if (edit.rotation !== undefined) next.rotation = edit.rotation
  return next
}

/**
 * Geometry to draw for one mark: the running gesture may have displaced it.
 * @param mark - the stored mark.
 * @param press - the gesture in flight, or null when none.
 * @returns the geometry the surface should draw.
 */
export function shownPoints(mark: AnnotationMark, press: Press | null): readonly FigurePoint[] {
  return press !== null && press.edit !== null && press.edit.points !== undefined && press.id === mark.id
    ? press.edit.points
    : mark.points
}

/**
 * The mark as it currently looks during a drag, as the owner should be told about it.
 *
 * The geometry is what the gesture drew, not what the mark stores: a comment pill
 * pinned to the mark has to follow the hand, and the stored mark is only updated
 * when the drag is committed.
 * @param base - the stored mark being dragged.
 * @param edit - what the gesture drew.
 * @returns the mark at its running geometry.
 */
export function liveMark(base: AnnotationMark, edit: PressEdit): AnnotationMark {
  const live: { -readonly [K in keyof AnnotationMark]: AnnotationMark[K] } = { ...base }
  if (edit.points !== undefined) live.points = edit.points
  if (edit.rotation !== undefined) live.rotation = edit.rotation
  return live
}
