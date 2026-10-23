/** Sizing every drawn thing against the figure it is drawn on. */
import { describe, expect, it } from 'vitest'
import { MAX_UNIT, MIN_UNIT, REFERENCE_EDGE, figureUnit } from '../src/client/scale'

describe('the size a figure draws at', () => {
  it('gives an ordinary figure the unit marks have always had', () => {
    // The reference edge is the size a science figure is usually exported at, so the
    // common case is 1 and nothing about it changes.
    expect(figureUnit(REFERENCE_EDGE, REFERENCE_EDGE / 2)).toBeCloseTo(1)
    expect(figureUnit(600, REFERENCE_EDGE)).toBeCloseTo(1)
  })

  it('scales up with the longer edge, because that is what the eye judges a stroke against', () => {
    // A 2400px figure is twice the reference, so its marks are drawn twice as heavy:
    // the same mark then *looks* the same size in the exported picture.
    expect(figureUnit(2400, 300)).toBeCloseTo(2)
    expect(figureUnit(2400, 2400)).toBeCloseTo(2)
    // A tall thin panel is judged by its long edge too; measuring the area would
    // shrink its marks for a reason the eye does not see.
    expect(figureUnit(200, 2400)).toBeCloseTo(2)
  })

  it('holds a thumbnail at the floor rather than shrinking to nothing', () => {
    // A 300px figure would otherwise get strokes 0.6px wide, which no export resolves.
    expect(figureUnit(300, 200)).toBe(MIN_UNIT)
    expect(figureUnit(1, 1)).toBe(MIN_UNIT)
  })

  it('holds a poster at the ceiling rather than drawing a highlighter', () => {
    // 20000px × 1/1200 would be a 40px stroke, which reads as a highlight rather than
    // as a line. The ceiling is where the mark stops being a mark.
    expect(figureUnit(20000, 1000)).toBe(MAX_UNIT)
    expect(figureUnit(Number.MAX_SAFE_INTEGER, 1)).toBe(MAX_UNIT)
  })

  it('answers with the neutral unit for a surface nothing has measured yet', () => {
    // An unmeasured surface is one with no marks on it, so there is nothing to size;
    // answering 1 keeps renderers from having to special-case it.
    expect(figureUnit(0, 0)).toBe(1)
    expect(figureUnit(Number.POSITIVE_INFINITY, 100)).toBe(1)
    expect(figureUnit(Number.NaN, 100)).toBe(1)
  })
})
