/**
 * The undo trail, as one state machine.
 *
 * These are pure functions, so the cases the panel reaches only through a sequence of
 * presses — a document change landing on an empty trail, an edit recorded twice — are
 * written down here directly rather than acted out through the DOM.
 */
import { describe, expect, it } from 'vitest'
import { amendMarks, commitMarks, openingHistory, redoStep, resetMarks, undoStep } from '../src/client/annotator/history'
import type { AnnotationMark } from '../src/shared/annotation'

const one: AnnotationMark = { id: 'a', kind: 'rect', color: '#1971c2', points: [[0, 0], [10, 10]] }
const two: AnnotationMark = { id: 'b', kind: 'rect', color: '#1971c2', points: [[0, 0], [10, 10]] }

describe('opening a different document', () => {
  it('drops both stacks, so nothing of the document being left can be walked back to', () => {
    const edited = commitMarks(commitMarks(openingHistory([one]), [two]), [one, two])
    expect(edited.past.length).toBeGreaterThan(0)
    expect(resetMarks(edited, [two])).toEqual({ marks: [two], past: [], future: [] })
  })

  it('hands back the same value when there is nothing to change', () => {
    // The panel is re-rendered on every keystroke, and a fresh object here would be a
    // new state with the same content — one render per render, for nothing.
    const quiet = openingHistory([one])
    expect(resetMarks(quiet, quiet.marks)).toBe(quiet)
  })

  it('still replaces the marks when only the trail is empty and the value is new', () => {
    expect(resetMarks(openingHistory([one]), [two])).toEqual({ marks: [two], past: [], future: [] })
  })

  it('clears a trail that is only ahead, not behind', () => {
    const behind = { marks: [one], past: [], future: [[two]] }
    expect(resetMarks(behind, [one])).toEqual({ marks: [one], past: [], future: [] })
  })
})

describe('typing after an undo', () => {
  it('drops the redo trail, so redo cannot throw the sentence away', () => {
    // A redo entry is a snapshot of the marks from before the sentence existed, so
    // keeping it offered the reader a button that undid their own typing: undo once,
    // type, press redo — the words were gone with nothing left to bring them back.
    const twoMarks = commitMarks(openingHistory([one]), [one, two])
    const undone = undoStep(twoMarks)
    expect(undone.future).toHaveLength(1)
    const typed = amendMarks(undone, () => [one])
    expect(typed.future).toHaveLength(0)
    expect(typed.marks).toEqual([one])
    expect(redoStep(typed)).toBe(typed)
  })

  it('hands back the same value when the typing changed nothing', () => {
    // A control that reports the value already there must not cost a render, and it
    // must not clear a trail it did not touch either.
    const ahead = { marks: [one], past: [], future: [[two]] }
    expect(amendMarks(ahead, marks => marks)).toBe(ahead)
  })
})
