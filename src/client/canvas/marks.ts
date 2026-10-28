/**
 * Turning a gesture into the mark it becomes.
 *
 * A press that starts a new mark only knows where it landed; the mark itself is
 * built here from the tool, the colour and the weight, and grows as the pointer
 * moves. Everything in this module is a pure function from "what has been drawn so
 * far" to "the mark that says it", so the shape of a new mark can be checked
 * without a rendered surface — and the rules that decide when a gesture produced
 * nothing at all live in one place instead of being scattered across handlers.
 * @module dsh-figmark/client/canvas/marks
 */

import type { AnnotationMark, FigurePoint, MarkAnchor } from '../../shared/annotation'
import { WEIGHT_DEFAULT } from '../../shared/annotation'
import { nextMarkId } from './ids'
import type { Tool } from './types'

/**
 * The tools that produce a mark by dragging a box or a stroke out.
 *
 * Narrower than {@link Tool} on purpose: `select` drags the paper, `point` and
 * `element` are placed by a press with nothing to drag, so a function that builds a
 * dragged mark cannot be handed any of them by mistake.
 */
export type DragTool = Exclude<Tool, 'select' | 'point' | 'element'>

/** Minimum distance between recorded freehand samples, in figure pixels. */
export const PEN_SAMPLE_STEP = 3

/**
 * How far a drag-shaped mark must have travelled to be worth committing.
 *
 * A press that releases within this distance of itself was a click, not a shape,
 * and committing it would put an invisible mark in the file.
 */
export const MIN_DRAG_LENGTH = 4

/**
 * The `weight` field of a new mark, or nothing when it is the default.
 *
 * Absent means the default throughout this plugin, so writing `weight: 1` would put
 * a field into every mark that says nothing — sidecars would grow a key for every
 * mark ever drawn, and every comparison of two documents would see a difference
 * where there is none.
 * @param weight - the weight the next stroke is drawn at.
 * @returns the field, or an empty object for the default.
 */
export function weightField(weight: number): { weight?: number } {
  return weight === WEIGHT_DEFAULT ? {} : { weight }
}

/** What a press that starts a new mark knows about it. */
export interface NewMarkSeed {
  /** The tool that is armed, which is the kind of mark being drawn. */
  readonly tool: DragTool
  /** Stroke color for the new mark. */
  readonly color: string
  /** Stroke weight for the new mark, as a multiple of the default width. */
  readonly weight: number
  /** Where the press landed, in figure pixels. */
  readonly point: FigurePoint
}

/**
 * The mark a drawing press starts with.
 *
 * A drag-shaped mark needs its two corners from the start; a freehand stroke starts
 * as the single sample it is, so no duplicate point enters the path.
 * @param seed - the tool, the pen, and the press point.
 * @returns the mark being drawn.
 */
export function draftMark(seed: NewMarkSeed): AnnotationMark {
  const { tool, color, weight, point } = seed
  const points: FigurePoint[] = tool === 'pen' ? [point] : [point, point]
  return { id: nextMarkId(), kind: tool, color, points, ...weightField(weight) }
}

/**
 * Add one freehand sample to the mark being drawn.
 *
 * A trackpad reports a stream of moves at nearly the same place; keeping every one
 * of them would put hundreds of redundant points in the file for a stroke that
 * moved a pixel. Samples closer together than {@link PEN_SAMPLE_STEP} are dropped,
 * which is a visible rule only in that the path is the same path either way.
 * @param draft - the pen stroke being drawn.
 * @param point - the pointer, in figure pixels.
 * @returns the stroke with the sample added, or the same stroke when it is too close.
 */
export function appendPenSample(draft: AnnotationMark, point: FigurePoint): AnnotationMark {
  const last = draft.points[draft.points.length - 1]
  if (last !== undefined && Math.hypot(point[0] - last[0], point[1] - last[1]) < PEN_SAMPLE_STEP) return draft
  return { ...draft, points: [...draft.points, point] }
}

/**
 * Move the far corner of the mark being dragged out.
 *
 * The first point is the corner the press started on and never moves; the second
 * follows the pointer, which is what makes the box grow in the direction the reader
 * is pulling rather than centred on the press.
 * @param draft - the drag-shaped mark being drawn.
 * @param point - the pointer, in figure pixels.
 * @returns the mark with its far corner moved.
 */
export function stretchDraft(draft: AnnotationMark, point: FigurePoint): AnnotationMark {
  return { ...draft, points: [draft.points[0] as FigurePoint, point] }
}

/**
 * A `point` mark, placed at the press.
 *
 * A point mark is placed, not dragged: the press is already its whole geometry,
 * and there is no extent for a drag to define.
 * @param seed - the pen and the press point.
 * @param anchor - what the press landed on, when it named something.
 * @returns the mark to commit.
 */
export function pointMark(
  seed: Pick<NewMarkSeed, 'color' | 'weight' | 'point'>,
  anchor: MarkAnchor | undefined,
): AnnotationMark {
  return {
    id: nextMarkId(),
    kind: 'point',
    color: seed.color,
    points: [seed.point],
    // A pin is sized by this same number, so the rail the reader set before
    // placing it decides how big the pin lands.
    ...weightField(seed.weight),
    ...(anchor === undefined ? {} : { anchor }),
  }
}

/**
 * One element as a mark, from the anchor that named it.
 *
 * The geometry is the element's own box, written as the two corners every
 * box-shaped mark carries, so everything downstream — the hit area, the control
 * frame, the export, the PDF appearance — reads an element mark through the same
 * code a `rect` goes through. What makes it a different mark is what it also
 * carries: the anchor, which is the name of the thing rather than the area.
 * @param anchor - the element that was picked.
 * @param color - the stroke color for the new mark.
 * @returns the mark to commit.
 */
export function elementMark(anchor: MarkAnchor, color: string): AnnotationMark {
  const [x, y, boxWidth, boxHeight] = anchor.bbox
  return {
    id: nextMarkId(),
    kind: 'element',
    color,
    points: [[x, y], [x + boxWidth, y + boxHeight]],
    // No `weight`: an element mark draws no stroke and no marker — the light on the
    // element it names is the whole of it — so the pen weight has nothing to size.
    // Carrying it would put a number in the file that changes nothing about the
    // picture and, worse, would grow the mark's measured outline by half a stroke
    // that is never painted.
    anchor,
  }
}

/**
 * Whether a finished drag drew a shape worth committing.
 *
 * Two ways a finished gesture is not a mark: it never produced a second point, and
 * it released within {@link MIN_DRAG_LENGTH} of where it started. Both are clicks
 * the reader made with a drawing tool armed, and committing them would leave marks
 * on the figure that ask for nothing and cannot be seen.
 * @param draft - the mark that was being drawn.
 * @returns true when the draft is a shape the reader can see.
 */
export function draftWorthCommitting(draft: AnnotationMark): boolean {
  if (draft.points.length < 2) return false
  if (draft.kind === 'pen') return true
  // The length check above already guarantees both endpoints; indexing is the only
  // way to read them without a second, unreachable guard.
  const first = draft.points[0] as FigurePoint
  const last = draft.points[draft.points.length - 1] as FigurePoint
  return Math.hypot(last[0] - first[0], last[1] - first[1]) >= MIN_DRAG_LENGTH
}

/**
 * The point a finished drag is anchored by.
 *
 * The release point, not the press point: a mark asks the agent to look where the
 * reader let go of it. A freehand stroke ends wherever the hand stopped, so its last
 * sample is the same answer.
 * @param draft - the mark that was being drawn.
 * @returns the point to name the element under.
 */
export function draftAnchorPoint(draft: AnnotationMark): FigurePoint {
  // Every kind that reaches a release carries at least one point.
  return draft.points[draft.points.length - 1] as FigurePoint
}
