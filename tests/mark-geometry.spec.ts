/** Mark geometry: whether a drag changed anything, and where a moved mark lands. */
import { describe, expect, it } from 'vitest'
import type { AnnotationMark, FigurePoint } from '../src/shared/annotation'
import {
  boxCentre,
  draggedMarks,
  keepAnchored,
  markBounds,
  markRadians,
  normalizeDegrees,
  rotateAround,
  samePoints,
  shiftPoints,
  uprightBounds,
  withGeometry,
} from '../src/client/mark-geometry'

describe('samePoints', () => {
  it('matches identical lists', () => {
    expect(samePoints([[1, 2], [3, 4]], [[1, 2], [3, 4]])).toBe(true)
  })

  it('tells lists of different lengths apart', () => {
    expect(samePoints([[1, 2], [3, 4]], [[1, 2]])).toBe(false)
  })

  it('tells a moved point apart', () => {
    expect(samePoints([[1, 2]], [[1, 3]])).toBe(false)
    expect(samePoints([[1, 2]], [[2, 2]])).toBe(false)
  })

  it('treats a missing point as a difference, not a crash', () => {
    // A sparse list cannot come from the surface, but the comparison is reached
    // from stored marks too, which a hand-edited file could leave short.
    const sparse = [[1, 2], undefined] as unknown as readonly (readonly [number, number])[]
    expect(samePoints(sparse, [[1, 2], [3, 4]])).toBe(false)
  })

  it('matches two empty lists', () => {
    expect(samePoints([], [])).toBe(true)
  })
})

describe('shiftPoints', () => {
  it('moves every point by the same offset', () => {
    expect(shiftPoints([[1, 2], [3, 4]], 5, -1)).toEqual([[6, 1], [8, 3]])
  })

  it('keeps a list with no points empty', () => {
    expect(shiftPoints([], 5, 5)).toEqual([])
  })
})

describe('withGeometry', () => {
  /** A mark anchored to the element it was drawn over. */
  const anchored: AnnotationMark = {
    id: 'm1',
    kind: 'rect',
    color: '#1971c2',
    points: [[10, 10], [40, 30]],
    detail: '缺图形',
    anchor: { tag: 'g', id: 'node102', bbox: [10, 10, 40, 20] },
  }

  it('puts the mark where it was dropped', () => {
    const box = [20, 20, 30, 20] as const
    expect(withGeometry(anchored, [[20, 20], [50, 40]], { tag: 'text', text: '102', bbox: box })).toMatchObject({
      points: [[20, 20], [50, 40]],
      anchor: { tag: 'text', text: '102', bbox: box },
    })
  })

  it('drops the old anchor when the drop hit nothing', () => {
    // An anchor names what the mark points at, so it cannot survive a move that
    // has taken the mark away from it.
    const moved = withGeometry(anchored, [[20, 20], [50, 40]], undefined)
    expect(moved.points).toEqual([[20, 20], [50, 40]])
    expect(Object.hasOwn(moved, 'anchor')).toBe(false)
  })

  it('leaves the rest of the mark alone', () => {
    const moved = withGeometry(anchored, [[20, 20], [50, 40]], undefined)
    expect(moved).toMatchObject({ id: 'm1', kind: 'rect', color: '#1971c2', detail: '缺图形' })
  })
})

describe('draggedMarks', () => {
  /** Two marks: the one a drag moves, and one it must leave alone. */
  const marks: readonly AnnotationMark[] = [
    { id: 'm1', kind: 'rect', color: '#1971c2', points: [[10, 10], [40, 30]], anchor: { tag: 'g', bbox: [10, 10, 40, 30] } },
    { id: 'm2', kind: 'arrow', color: '#e03131', points: [[5, 5], [50, 60]] },
  ]

  it('moves exactly the mark the drag named, and no other', () => {
    const next = draggedMarks(marks, 'm1', [[20, 20], [50, 40]], undefined)
    expect(next).not.toBeNull()
    const moved = next ?? []
    expect(moved[0]?.points).toEqual([[20, 20], [50, 40]])
    expect(moved[1]).toBe(marks[1])
  })

  it('answers null for a mark that is not in the list', () => {
    expect(draggedMarks(marks, 'nope', [[20, 20]], undefined)).toBeNull()
  })

  it('answers null for a drop at the geometry the mark already had', () => {
    expect(draggedMarks(marks, 'm1', [[10, 10], [40, 30]], undefined)).toBeNull()
  })

  it('takes the anchor the drop hit', () => {
    const next = draggedMarks(marks, 'm1', [[20, 20], [50, 40]], { tag: 'text', bbox: [20, 20, 30, 20] })
    expect(next?.[0]?.anchor).toMatchObject({ tag: 'text' })
  })
})

describe('the box a mark covers', () => {
  it('spans every point, including a stroke that dips below its corners', () => {
    expect(markBounds([[10, 20], [0, 60], [30, 5]])).toEqual({ x: 0, y: 5, width: 30, height: 55 })
  })

  it('answers undefined for a mark with no points', () => {
    expect(markBounds([])).toBeUndefined()
  })

  it('finds the centre of a box', () => {
    expect(boxCentre({ x: 10, y: 20, width: 100, height: 40 })).toEqual([60, 40])
  })

  it('covers more than its own corners once it is turned', () => {
    const square: readonly FigurePoint[] = [[0, 0], [100, 100]]
    // Upright, the box is the square itself.
    expect(uprightBounds(square, 0)).toEqual({ x: 0, y: 0, width: 100, height: 100 })
    // Turned by a quarter, the same square still covers the same square.
    const quarter = uprightBounds(square, 90)
    expect(quarter?.x).toBeCloseTo(0, 6)
    expect(quarter?.y).toBeCloseTo(0, 6)
    expect(quarter?.width).toBeCloseTo(100, 6)
    // Turned by an eighth, its corners swing outside the upright box.
    const eighth = uprightBounds(square, 45)
    expect(eighth?.width ?? 0).toBeGreaterThan(100)
    expect(eighth?.width ?? 0).toBeCloseTo(100 * Math.SQRT2, 6)
  })

  it('answers undefined for a mark with no points, turned or not', () => {
    expect(uprightBounds([], 45)).toBeUndefined()
  })
})

describe('turning points', () => {
  it('turns a point about a centre', () => {
    const turned = rotateAround([100, 50], [50, 50], Math.PI / 2)
    expect(turned[0]).toBeCloseTo(50, 6)
    expect(turned[1]).toBeCloseTo(100, 6)
  })

  it('leaves a point alone at no rotation', () => {
    expect(rotateAround([7, 9], [0, 0], 0)).toEqual([7, 9])
  })

  it('reads a mark\'s rotation in radians, upright when it has none', () => {
    expect(markRadians({})).toBe(0)
    expect(markRadians({ rotation: 180 })).toBeCloseTo(Math.PI, 9)
  })

  it('folds an angle into one turn', () => {
    expect(normalizeDegrees(0)).toBe(0)
    expect(normalizeDegrees(-90)).toBe(270)
    expect(normalizeDegrees(-450)).toBe(270)
    expect(normalizeDegrees(359)).toBe(359)
    expect(normalizeDegrees(360)).toBe(0)
    expect(normalizeDegrees(720)).toBe(0)
  })
})

describe('keepAnchored', () => {
  it('shifts geometry so the anchor lands where it was', () => {
    const geometry: readonly FigurePoint[] = [[10, 10], [30, 30]]
    expect(keepAnchored(geometry, 0, [10, 10], [20, 20])).toEqual(geometry)
  })

  it('compensates for the centre moving under a rotated mark', () => {
    // Growing the box to the right moves its centre, which swings the rest of a
    // turned mark. The anchor must still be where it was on screen — which means
    // measuring it against the geometry as it now stands, not as it was.
    const grown: readonly FigurePoint[] = [[10, 10], [50, 30]]
    const settled = keepAnchored(grown, Math.PI / 4, [10, 10], [20, 20])
    expect(settled).not.toEqual(grown)
    const was = rotateAround([10, 10], [20, 20], Math.PI / 4)
    const box = markBounds(settled)
    expect(box).toBeDefined()
    const first = settled[0] ?? [0, 0]
    const now = rotateAround(first, boxCentre(box ?? { x: 0, y: 0, width: 0, height: 0 }), Math.PI / 4)
    expect(now[0]).toBeCloseTo(was[0], 6)
    expect(now[1]).toBeCloseTo(was[1], 6)
  })

  it('returns an empty list unchanged', () => {
    expect(keepAnchored([], 0, [0, 0], [0, 0])).toEqual([])
  })
})
