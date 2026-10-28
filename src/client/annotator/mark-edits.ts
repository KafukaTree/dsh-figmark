/**
 * Changing one mark in the list, and knowing whether the change was one at all.
 *
 * Two of the panel's gestures are "write these fields onto that mark": dragging a
 * handle produces geometry, and a colour or weight press produces one attribute.
 * Both have to answer the same question first — did anything actually change — and
 * both have to answer it by comparing field by field rather than object by object,
 * because a spread always makes a new object and a reference compare would report
 * every press as a change and record an undo step that undoes nothing.
 * @module dsh-figmark/client/annotator/mark-edits
 */
import type { AnnotationMark, FigurePoint, MarkAnchor } from '../../shared/annotation'
import type { MarkPatch } from '../Canvas'
import { draggedMarks } from '../mark-geometry'

/**
 * Whether a patch would leave the mark exactly as it is.
 *
 * Compared key by key: `patch` only carries the fields the gesture produced, so an
 * absent field means "leave it alone", not "set it to undefined".
 * @param mark - the mark as it stands.
 * @param patch - the fields a control asked to change.
 * @returns true when every field is already at that value.
 */
export function patchChangesNothing(mark: AnnotationMark, patch: MarkPatch): boolean {
  return (Object.keys(patch) as (keyof MarkPatch)[]).every(key => mark[key] === patch[key])
}

/**
 * Write a patch onto one mark, leaving every other mark untouched.
 * @param marks - every mark the surface holds.
 * @param id - the mark to change.
 * @param patch - the fields to write.
 * @returns the new list.
 */
export function patchedMarks(
  marks: readonly AnnotationMark[],
  id: string,
  patch: MarkPatch,
): readonly AnnotationMark[] {
  return marks.map(mark => (mark.id === id ? { ...mark, ...patch } : mark))
}

/**
 * Write one mark's sentence, leaving every other mark untouched.
 *
 * A mark carries one string, so there is nothing to keep in step beside it: the
 * detail is what the agent reads and what the list shows, and it is never painted on
 * the picture. Typing is not an undoable step — a character is not a decision the
 * reader would want to walk back one press at a time — so this goes through the
 * history's amend path rather than its commit.
 * @param marks - every mark the surface holds.
 * @param id - the mark being written about.
 * @param value - the new text.
 * @returns the new list.
 */
export function detailedMarks(
  marks: readonly AnnotationMark[],
  id: string,
  value: string,
): readonly AnnotationMark[] {
  return marks.map(mark => (mark.id === id ? { ...mark, detail: value } : mark))
}

/**
 * Append one new mark to the list.
 * @param marks - every mark the surface holds.
 * @param mark - the mark just drawn.
 * @returns the new list.
 */
export function appendedMarks(
  marks: readonly AnnotationMark[],
  mark: AnnotationMark,
): readonly AnnotationMark[] {
  return [...marks, mark]
}

/**
 * Drop one mark from the list.
 * @param marks - every mark the surface holds.
 * @param id - the mark to drop.
 * @returns the new list.
 */
export function removedMarks(
  marks: readonly AnnotationMark[],
  id: string,
): readonly AnnotationMark[] {
  return marks.filter(mark => mark.id !== id)
}

/**
 * The marks after a drag of one of them, or null when the drag did not move it.
 *
 * A drag that ends where it started is not an edit: the mark keeps the anchor it had,
 * and no undo step is recorded for a gesture that changed nothing.
 * @param marks - every mark the surface holds.
 * @param id - the mark that was dragged.
 * @param points - where it was dropped.
 * @param anchor - what it now sits on, or undefined when it hit nothing new.
 * @returns the new list, or null when nothing moved.
 */
export function movedMarks(
  marks: readonly AnnotationMark[],
  id: string,
  points: readonly FigurePoint[],
  anchor: MarkAnchor | undefined,
): readonly AnnotationMark[] | null {
  return draggedMarks(marks, id, points, anchor)
}
