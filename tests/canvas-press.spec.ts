// @vitest-environment jsdom
/** What a gesture in flight draws: the moving, turning and resizing of one mark. */
import { describe, expect, it } from 'vitest'
import type { AnnotationMark } from '../src/shared/annotation'
import { editFor, liveMark, patchFrom, shownMark, shownPoints, type Press } from '../src/client/canvas/press'

/** A box-shaped mark, as the reader would have drawn it. */
const box: AnnotationMark = {
  id: 'm1', kind: 'rect', color: '#1971c2', points: [[10, 10], [110, 60]],
}

/** A press on `mark` that has not moved yet. */
function pressOn(mark: AnnotationMark, over: Partial<Press> = {}): Press {
  return {
    id: mark.id,
    from: [10, 10],
    origin: mark.points,
    originRotation: 0,
    kind: mark.kind,
    handle: undefined,
    snap: false,
    edit: null,
    ...over,
  }
}

describe('dragging a mark', () => {
  it('moves the whole geometry by the travel since the press', () => {
    const press = pressOn(box)
    const edit = editFor(press, [60, 40], 50, 30)
    expect(edit.points).toEqual([[60, 40], [160, 90]])
    // A plain drag says nothing about how the mark is turned.
    expect(edit.rotation).toBeUndefined()
  })
})

describe('turning a mark', () => {
  it('reports an angle and leaves the geometry alone', () => {
    const press = pressOn(box, { handle: 'rotate' })
    // The turn is measured from the box's centre (60, 35), and a pointer level with
    // that centre is the *arms-out* position, which reads as a quarter turn: the
    // handle starts above the mark, so the reader pulls it round to a side.
    const edit = editFor(press, [200, 35], 190, 25)
    expect(edit.rotation).toBeCloseTo(90)
    expect(edit.points).toBeUndefined()
  })

  it('snaps to a quarter turn when Shift is held', () => {
    const press = pressOn(box, { handle: 'rotate', snap: true })
    // A pointer a few degrees off straight down still lands on the half turn, which
    // is what makes Shift worth holding.
    const edit = editFor(press, [70, 200], 60, 190)
    expect(edit.rotation).toBeCloseTo(180)
  })
})

describe('resizing a mark', () => {
  it('moves the dragged corner and reports no rotation', () => {
    const press = pressOn(box, { handle: 'se' })
    const edit = editFor(press, [210, 160], 200, 150)
    expect(edit.rotation).toBeUndefined()
    expect(edit.points).not.toBeUndefined()
    // The corner the press started on stays where it was.
    expect(edit.points?.[0]).toEqual([10, 10])
  })
})

describe('the patch a finished drag asks for', () => {
  it('lists only the fields the gesture produced', () => {
    // A resize must not clear the turn a mark already had by writing `rotation:
    // undefined`, so the absent field is absent from the patch, not undefined in it.
    expect(patchFrom({ points: [[0, 0], [1, 1]], rotation: undefined })).toEqual({ points: [[0, 0], [1, 1]] })
    expect(patchFrom({ points: undefined, rotation: 30 })).toEqual({ rotation: 30 })
  })

  it('is empty when the gesture drew nothing', () => {
    expect(patchFrom({ points: undefined, rotation: undefined })).toEqual({})
  })
})

describe('the mark as the running gesture has it', () => {
  it('follows the pointer without touching the stored mark', () => {
    const press = pressOn(box, { edit: { points: [[60, 40], [160, 90]], rotation: undefined } })
    const shown = shownMark(box, press)
    expect(shown.points).toEqual([[60, 40], [160, 90]])
    expect(shownPoints(box, press)).toEqual([[60, 40], [160, 90]])
    // The stored mark is the one the parent owns, and it has not moved.
    expect(box.points).toEqual([[10, 10], [110, 60]])
  })

  it('takes the running turn as well as the running geometry', () => {
    const press = pressOn(box, { edit: { points: undefined, rotation: 45 } })
    const shown = shownMark(box, press)
    expect(shown.rotation).toBe(45)
    // A turn-only edit leaves the geometry where it was.
    expect(shown.points).toEqual(box.points)
    expect(shownPoints(box, press)).toEqual(box.points)
  })

  it('leaves every other mark alone', () => {
    const other: AnnotationMark = { id: 'other', kind: 'arrow', color: '#000', points: [[0, 0], [5, 5]] }
    const press = pressOn(box, { edit: { points: [[60, 40], [160, 90]], rotation: undefined } })
    // One gesture moves one mark; the rest of the figure keeps what it stores.
    expect(shownMark(other, press)).toBe(other)
    expect(shownPoints(other, press)).toEqual(other.points)
  })

  it('draws the stored mark when no gesture is in flight', () => {
    expect(shownMark(box, null)).toBe(box)
    expect(shownPoints(box, null)).toEqual(box.points)
  })

  it('draws the stored mark for a press that has not moved yet', () => {
    expect(shownMark(box, pressOn(box))).toBe(box)
    expect(shownPoints(box, pressOn(box))).toEqual(box.points)
  })
})

describe('the mark reported mid-drag', () => {
  it('carries the running geometry and the running turn', () => {
    const live = liveMark(box, { points: [[60, 40], [160, 90]], rotation: 15 })
    expect(live.points).toEqual([[60, 40], [160, 90]])
    expect(live.rotation).toBe(15)
    // Everything the gesture did not touch survives, because the card beside the
    // mark still has to show the comment and the number.
    expect(live.id).toBe('m1')
    expect(live.color).toBe('#1971c2')
  })

  it('leaves a field the gesture did not produce as the mark had it', () => {
    const turned: AnnotationMark = { ...box, rotation: 30 }
    // A resize reports points only; the turn it did not change is not reported as
    // zero, so the mark does not snap upright mid-drag.
    expect(liveMark(turned, { points: [[0, 0], [1, 1]], rotation: undefined }).rotation).toBe(30)
    expect(liveMark(turned, { points: undefined, rotation: 60 }).points).toEqual(box.points)
  })
})
