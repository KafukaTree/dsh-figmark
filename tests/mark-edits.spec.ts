/**
 * Knowing whether a gesture changed anything.
 *
 * These are the two questions every control in the panel asks before it writes: did
 * this gesture change the mark, and if so what does the list look like now. They are
 * pure, so the cases the panel reaches only through a drag are written down here.
 */
import { describe, expect, it } from 'vitest'
import {
  appendedMarks, detailedMarks, loadedMarks, movedMarks, patchChangesNothing, patchedMarks, removedMarks,
} from '../src/client/annotator/mark-edits'
import type { AnnotationMark } from '../src/shared/annotation'

const rect: AnnotationMark = { id: 'a', kind: 'rect', color: '#1971c2', points: [[0, 0], [10, 10]] }
const other: AnnotationMark = { id: 'b', kind: 'arrow', color: '#e03131', points: [[5, 5], [20, 20]] }

describe('a patch that would change nothing', () => {
  it('sees through a fresh array holding the same places', () => {
    // A drag reports geometry as a new array every time it settles, including when the
    // reader nudged a mark and put it back. Comparing by reference called that a
    // change and recorded an undo step that undid nothing, so the next press of undo
    // looked broken.
    expect(patchChangesNothing(rect, { points: [[0, 0], [10, 10]] })).toBe(true)
  })

  it('counts one moved point as a change', () => {
    expect(patchChangesNothing(rect, { points: [[0, 0], [11, 10]] })).toBe(false)
  })

  it('counts gaining a point as a change', () => {
    expect(patchChangesNothing(rect, { points: [[0, 0], [10, 10], [20, 20]] })).toBe(false)
  })

  it('compares a colour by value, because the control writes the same string', () => {
    expect(patchChangesNothing(rect, { color: '#1971c2' })).toBe(true)
    expect(patchChangesNothing(rect, { color: '#e03131' })).toBe(false)
  })

  it('asks only about the fields the patch carries', () => {
    // An absent field means "leave it alone", so a patch of one colour says nothing
    // about the geometry and cannot be called a change for holding no points.
    expect(patchChangesNothing(rect, { color: '#1971c2' })).toBe(true)
    // A field named in the patch is asked about, and a rotation the mark does not
    // carry is not the same value as setting it to zero — the write would add a key.
    expect(patchChangesNothing(rect, { rotation: 0 })).toBe(false)
  })
})

describe('writing a patch onto the list', () => {
  it('changes one mark and leaves the rest alone', () => {
    const written = patchedMarks([rect, other], 'a', { color: '#e03131' })
    expect(written[0]?.color).toBe('#e03131')
    expect(written[1]).toBe(other)
  })

  it('leaves the list alone when the patch changes nothing', () => {
    const marks = [rect, other]
    expect(patchedMarks(marks, 'a', { color: '#1971c2' })).toBe(marks)
  })

  it('leaves the list alone when the mark is not in it', () => {
    const marks = [rect, other]
    expect(patchedMarks(marks, 'missing', { color: '#e03131' })).toBe(marks)
  })
})

describe('the list helpers', () => {
  it('writes a sentence onto one mark', () => {
    const written = detailedMarks([rect, other], 'b', 'this tau is wrong')
    expect(written[1]?.detail).toBe('this tau is wrong')
    expect(written[0]).toBe(rect)
  })

  it('hands back the same list when the sentence is already there', () => {
    const marks: AnnotationMark[] = [{ ...rect, detail: 'said' }]
    expect(detailedMarks(marks, 'a', 'said')).toBe(marks)
  })

  it('treats a mark with no sentence as carrying an empty one', () => {
    // The field is optional, so "already there" has to mean the same thing for a mark
    // that never had a sentence as for one that had it cleared.
    const marks = [rect]
    expect(detailedMarks(marks, 'a', '')).toBe(marks)
    expect(detailedMarks(marks, 'missing', 'anything')).toBe(marks)
  })

  it('adds a mark at the end, where the numbered list reads it', () => {
    expect(appendedMarks([rect], other)).toEqual([rect, other])
  })

  it('takes only the named mark away', () => {
    expect(removedMarks([rect, other], 'a')).toEqual([other])
  })

  it('leaves the list alone when the mark to remove is not there', () => {
    const marks = [rect, other]
    expect(removedMarks(marks, 'missing')).toBe(marks)
  })

  it('reports a drag that ends where it started as no edit at all', () => {
    // The caller records an undo step from a non-null answer, so a drag that put the
    // mark back has to answer null rather than a list that happens to look the same.
    expect(movedMarks([rect, other], 'a', [[0, 0], [10, 10]], undefined)).toBeNull()
  })

  it('hands back the moved list when the drag went somewhere', () => {
    expect(movedMarks([rect, other], 'a', [[2, 2], [12, 12]], undefined)?.[0]?.points)
      .toEqual([[2, 2], [12, 12]])
  })
})

describe('adopting a saved document', () => {
  const drawn: AnnotationMark = { id: 'new', kind: 'arrow', color: '#e03131', points: [[1, 1], [9, 9]] }

  it('takes the saved marks as they are when nothing was drawn in the gap', () => {
    // The ordinary case: the answer arrives before the reader has drawn anything.
    expect(loadedMarks([rect], [rect], [rect])).toEqual([rect])
    expect(loadedMarks([], [], [])).toEqual([])
  })

  it('keeps a stroke drawn while the read was out', () => {
    // The figure is drawable as soon as it decodes. A stroke drawn before the read
    // landed was not in the draft, so adopting the file wholesale erased it with no
    // undo step — the reader watched their arrow vanish a beat later.
    expect(loadedMarks([rect], [rect, drawn], [rect])).toEqual([rect, drawn])
  })

  it('does not keep the draft the file supersedes', () => {
    // A seeded mark the saved document does not carry was a guess the answer settled:
    // the file is the record, and re-adding it would put back what the reader deleted
    // in an earlier session.
    expect(loadedMarks([], [rect], [rect])).toEqual([])
  })

  it('does not double a mark the saved document already names', () => {
    expect(loadedMarks([drawn], [drawn], [])).toEqual([drawn])
  })
})
