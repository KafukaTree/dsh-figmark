/** What a gesture turns into: the marks a press, a drag and a release produce. */
import { describe, expect, it } from 'vitest'
import type { AnnotationMark } from '../src/shared/annotation'
import { WEIGHT_DEFAULT } from '../src/shared/annotation'
import {
  MIN_DRAG_LENGTH,
  PEN_SAMPLE_STEP,
  appendPenSample,
  draftAnchorPoint,
  draftMark,
  draftWorthCommitting,
  elementMark,
  pointMark,
  stretchDraft,
  weightField,
} from '../src/client/canvas/marks'

/** The pen a reader has set. */
const pen = { color: '#e03131', weight: WEIGHT_DEFAULT } as const

describe('the weight a new mark carries', () => {
  it('is left out entirely at the default', () => {
    // The field means "not the default", so writing it at the default would put a
    // key in every mark ever drawn that says nothing.
    expect(weightField(WEIGHT_DEFAULT)).toEqual({})
  })

  it('is written when the reader moved the rail', () => {
    expect(weightField(3)).toEqual({ weight: 3 })
  })
})

describe('the mark a drawing press starts', () => {
  it('starts a box with both corners on the press point', () => {
    const mark = draftMark({ tool: 'rect', ...pen, point: [10, 20] })
    expect(mark.kind).toBe('rect')
    expect(mark.points).toEqual([[10, 20], [10, 20]])
    expect(mark.color).toBe('#e03131')
    expect(mark.weight).toBeUndefined()
  })

  it('starts a freehand stroke as the one sample it is', () => {
    // A pen stroke that opened with a duplicated point would draw a zero-length
    // segment, which a round cap renders as a dot the reader never made.
    expect(draftMark({ tool: 'pen', ...pen, point: [5, 6] }).points).toEqual([[5, 6]])
  })

  it('carries the weight when the rail is not at the default', () => {
    expect(draftMark({ tool: 'arrow', color: '#000', weight: 2, point: [0, 0] }).weight).toBe(2)
  })
})

describe('collecting a freehand stroke', () => {
  const draft: AnnotationMark = { id: 'd', kind: 'pen', color: '#000', points: [[0, 0]] }

  it('adds a sample that moved far enough', () => {
    expect(appendPenSample(draft, [PEN_SAMPLE_STEP, 0]).points).toEqual([[0, 0], [PEN_SAMPLE_STEP, 0]])
  })

  it('drops a sample that is jitter around the last one', () => {
    // A trackpad reports a stream of near-identical points; keeping them all would
    // put hundreds of redundant coordinates in the file for one stroke.
    expect(appendPenSample(draft, [1, 1])).toBe(draft)
  })
})

describe('dragging a box out', () => {
  it('moves the far corner and leaves the first where it started', () => {
    const draft: AnnotationMark = { id: 'd', kind: 'rect', color: '#000', points: [[10, 10], [10, 10]] }
    expect(stretchDraft(draft, [80, 60]).points).toEqual([[10, 10], [80, 60]])
  })
})

describe('a placed point mark', () => {
  it('is its press point, with the rail’s size and no turning', () => {
    const mark = pointMark({ ...pen, point: [30, 40] }, undefined)
    expect(mark.kind).toBe('point')
    expect(mark.points).toEqual([[30, 40]])
    expect(mark.rotation).toBeUndefined()
    expect(mark.anchor).toBeUndefined()
  })

  it('names the element it was placed on, when the press named one', () => {
    const anchor = { tag: 'path', bbox: [0, 0, 10, 10] as const }
    expect(pointMark({ ...pen, point: [1, 1] }, anchor).anchor).toEqual(anchor)
  })

  it('carries no weight at all, because a pin is sized by the figure', () => {
    // The rail is the reader's answer to "how thick should this stroke be" and a pin
    // is not a stroke. Writing the number anyway left a weight in the file that drew
    // nothing, and made an old mark and a new one compare unequal for no visible
    // reason.
    expect(pointMark({ ...pen, point: [0, 0] }, undefined).weight).toBeUndefined()
    expect(pointMark({ color: '#000', weight: 2, point: [0, 0] }, undefined).weight).toBeUndefined()
  })
})

describe('an element turned into a mark', () => {
  it('takes the element’s own box as its two corners', () => {
    // The box is written as the corner pair every box-shaped mark carries, so the
    // hit area, the frame, the export and the PDF appearance all read an element
    // mark through the code a `rect` goes through.
    const mark = elementMark({ tag: 'g', bbox: [10, 20, 30, 40], selector: '#a' }, '#2f9e44')
    expect(mark.points).toEqual([[10, 20], [40, 60]])
    expect(mark.anchor?.selector).toBe('#a')
  })

  it('carries no weight', () => {
    // An element mark draws no stroke and no pin, so the pen weight has nothing to
    // size; carrying one would also grow its measured outline by half a stroke that
    // is never painted.
    expect(elementMark({ tag: 'g', bbox: [0, 0, 1, 1] }, '#000').weight).toBeUndefined()
  })
})

describe('what a finished drag commits', () => {
  const arrow = (points: readonly (readonly [number, number])[]): AnnotationMark =>
    ({ id: 'd', kind: 'arrow', color: '#000', points })

  it('refuses a gesture that never produced a second point', () => {
    expect(draftWorthCommitting(arrow([[10, 10]]))).toBe(false)
  })

  it('refuses a drag shorter than the minimum', () => {
    // Releasing within a few pixels of the press was a click, not a shape.
    expect(draftWorthCommitting(arrow([[0, 0], [MIN_DRAG_LENGTH - 1, 0]]))).toBe(false)
  })

  it('accepts a drag that covered the minimum', () => {
    expect(draftWorthCommitting(arrow([[0, 0], [MIN_DRAG_LENGTH, 0]]))).toBe(true)
  })

  it('accepts a freehand stroke of any length', () => {
    // A stroke is its samples: a pen mark that moved two pixels is a deliberate dot
    // rather than an abandoned drag.
    const penMark: AnnotationMark = { id: 'd', kind: 'pen', color: '#000', points: [[0, 0], [1, 1]] }
    expect(draftWorthCommitting(penMark)).toBe(true)
  })

  it('anchors by the point the reader let go at', () => {
    expect(draftAnchorPoint(arrow([[0, 0], [50, 60]]))).toEqual([50, 60])
    expect(draftAnchorPoint({ id: 'd', kind: 'pen', color: '#000', points: [[1, 1], [2, 2], [3, 3]] })).toEqual([3, 3])
  })
})
