/** Sizing every drawn thing against the figure it is drawn on. */
import { describe, expect, it } from 'vitest'
import { MAX_UNIT, MIN_UNIT, REFERENCE_EDGE, figureUnit } from '../src/client/scale'
import { STROKE_WIDTH } from '../src/client/render'

describe('the size a figure draws at', () => {
  it('gives an ordinary figure the unit marks have always had', () => {
    // The reference edge is the size a science figure is usually exported at, so the
    // common case is 1 and nothing about it changes.
    expect(figureUnit(REFERENCE_EDGE, REFERENCE_EDGE / 2)).toBeCloseTo(1)
    expect(figureUnit(REFERENCE_EDGE / 2, REFERENCE_EDGE)).toBeCloseTo(1)
  })

  it('scales with the longer edge, because that is what the eye judges a stroke against', () => {
    // A figure three times the reference is drawn three times as heavy, so the mark
    // looks the same size in the exported picture rather than thinning out.
    expect(figureUnit(2400, 300)).toBeCloseTo(3)
    expect(figureUnit(2400, 2400)).toBeCloseTo(3)
    // A tall thin panel is judged by its long edge too; measuring the area would
    // shrink its marks for a reason the eye does not see.
    expect(figureUnit(200, 2400)).toBeCloseTo(3)
  })

  it('holds a tiny figure at the floor rather than shrinking to nothing', () => {
    expect(figureUnit(100, 80)).toBe(MIN_UNIT)
    expect(figureUnit(1, 1)).toBe(MIN_UNIT)
  })

  it('sizes a matplotlib SVG the same as the PNG exported from it', () => {
    // The two are the same picture: the svg measures itself in points, the png in
    // pixels at 300dpi, so the svg is a quarter the width. A stroke has to be the same
    // *share* of both, or the svg looks bold and the png looks thin for no reason the
    // reader can see. This is the pair the reader compared.
    const share = (width: number): number => (STROKE_WIDTH * figureUnit(width, width * 0.744)) / width
    expect(share(237)).toBeCloseTo(share(1179), 6)
  })

  it('holds a poster at the ceiling rather than drawing a highlighter', () => {
    // A ceiling is still needed for the pathological case — a 200000px scan would
    // otherwise get a 625px stroke — but it is now far enough out that an ordinary
    // A0 poster is scaled honestly rather than clamped.
    expect(figureUnit(200000, 1000)).toBe(MAX_UNIT)
    expect(figureUnit(Number.MAX_SAFE_INTEGER, 1)).toBe(MAX_UNIT)
    // 4000px is 5x the reference edge: still inside the range, so still proportional.
    expect(figureUnit(4000, 3000)).toBeCloseTo(4000 / REFERENCE_EDGE)
  })

  it('answers with the neutral unit for a surface nothing has measured yet', () => {
    // An unmeasured surface is one with no marks on it, so there is nothing to size;
    // answering 1 keeps renderers from having to special-case it.
    expect(figureUnit(0, 0)).toBe(1)
    expect(figureUnit(Number.POSITIVE_INFINITY, 100)).toBe(1)
    expect(figureUnit(Number.NaN, 100)).toBe(1)
  })
})
