/** Zoom arithmetic: the factor a gesture asks for, and where the view has to sit. */
import { describe, expect, it } from 'vitest'
import {
  MAX_ZOOM,
  MIN_ZOOM,
  STAGE_PADDING,
  anchoredScroll,
  clampZoom,
  surfaceOffset,
  wheelZoomFactor,
  type ScrollportMetrics,
} from '../src/client/zoom'

describe('clampZoom', () => {
  it('leaves a factor inside the range alone', () => {
    expect(clampZoom(1.5)).toBe(1.5)
  })

  it('stops at the smallest factor', () => {
    expect(clampZoom(0.001)).toBe(MIN_ZOOM)
  })

  it('stops at the largest factor', () => {
    expect(clampZoom(99)).toBe(MAX_ZOOM)
  })
})

describe('wheelZoomFactor', () => {
  it('does nothing for a wheel with no vertical travel', () => {
    expect(wheelZoomFactor(0, 0)).toBe(1)
  })

  it('follows a fine pixel delta, as a trackpad pinch sends', () => {
    const factor = wheelZoomFactor(-20, 0)
    expect(factor).toBeGreaterThan(1)
    expect(factor).toBeCloseTo(Math.exp(0.2), 10)
  })

  it('follows a fine delta the other way to zoom out', () => {
    expect(wheelZoomFactor(20, 0)).toBeLessThan(1)
    expect(wheelZoomFactor(20, 0)).toBeCloseTo(Math.exp(-0.2), 10)
  })

  it('caps one coarse wheel notch instead of following its raw travel', () => {
    // A mouse notch reports a big pixel delta; following all of it would leap
    // across the figure per click, so one event may only count for 40 pixels.
    expect(wheelZoomFactor(120, 0)).toBeCloseTo(Math.exp(-0.4), 10)
    expect(wheelZoomFactor(-120, 0)).toBeCloseTo(Math.exp(0.4), 10)
  })

  it('scales a line-mode delta by a line and a page-mode one by the viewport', () => {
    // 3 lines is 48 pixels, which the cap takes down to 40.
    expect(wheelZoomFactor(3, 1)).toBeCloseTo(Math.exp(-0.4), 10)
    expect(wheelZoomFactor(2, 1)).toBeCloseTo(Math.exp(-0.32), 10)
    expect(wheelZoomFactor(-1, 2, 100)).toBeCloseTo(Math.exp(0.4), 10)
  })

  it('falls back to a fixed page height when the caller knows none', () => {
    expect(wheelZoomFactor(-0.05, 2)).toBeCloseTo(Math.exp(0.4), 10)
  })

  it('caps a line-mode delta too, so a long line count cannot jump either', () => {
    expect(wheelZoomFactor(-10, 1)).toBeCloseTo(Math.exp(0.4), 10)
  })
})

describe('surfaceOffset', () => {
  it('centres a surface narrower than the scrollport', () => {
    expect(surfaceOffset(500, 300)).toBe(100)
  })

  it('pins an overflowing surface at the stage padding, where safe centring falls back', () => {
    // `justify-content: safe center` centres while there is room and behaves like
    // `start` once there is not — and `start` is inside the stage's 14px padding, not
    // at zero. Assuming zero put every zoom step 14px out sideways.
    expect(surfaceOffset(300, 500)).toBe(STAGE_PADDING)
  })
})

describe('anchoredScroll', () => {
  /** A scrollport 500 wide, scrolled 40 down and 30 across, at the origin. */
  function viewport(overrides: Partial<ScrollportMetrics> = {}): ScrollportMetrics {
    return { clientWidth: 500, clientHeight: 400, scrollLeft: 30, scrollTop: 40, left: 0, top: 0, ...overrides }
  }

  it('keeps the figure point under the pointer where it was when zooming in', () => {
    const before = viewport()
    const pointer = { clientX: 200, clientY: 150 }
    const target = anchoredScroll(before, pointer, 1, 2, { width: 400, height: 300 })
    // The point under the pointer before the zoom, in figure pixels.
    const figureX = (before.scrollLeft + 200 - surfaceOffset(500, 400)) / 1
    const figureY = (before.scrollTop + 150 - surfaceOffset(400, 300)) / 1
    // After the zoom the surface overflows both ways, so both offsets are the padding.
    expect(target.scrollLeft).toBeCloseTo(Math.max(0, STAGE_PADDING + figureX * 2 - 200), 10)
    expect(target.scrollTop).toBeCloseTo(Math.max(0, STAGE_PADDING + figureY * 2 - 150), 10)
  })

  it('never asks for a negative offset, which is where a browser parks it', () => {
    // Zooming out with the pointer far from the surface's top-left corner asks
    // for a negative offset; a scrollport cannot go there.
    const target = anchoredScroll(viewport({ scrollLeft: 0, scrollTop: 0 }), { clientX: 450, clientY: 200 }, 1, 0.2, {
      width: 100, height: 80,
    })
    expect(target.scrollLeft).toBe(0)
    expect(target.scrollTop).toBe(0)
  })

  it('moves the view back as the surface shrinks under the pointer', () => {
    const target = anchoredScroll(viewport(), { clientX: 200, clientY: 150 }, 2, 1, { width: 400, height: 300 })
    expect(target.scrollLeft).toBeLessThan(30)
    expect(Number.isFinite(target.scrollTop)).toBe(true)
  })

  it('measures from the scrollport edge, not the page origin', () => {
    const atOrigin = anchoredScroll(viewport({ left: 0, top: 0 }), { clientX: 200, clientY: 150 }, 1, 2, { width: 400, height: 300 })
    const shifted = anchoredScroll(viewport({ left: 60, top: 20 }), { clientX: 260, clientY: 170 }, 1, 2, { width: 400, height: 300 })
    expect(shifted.scrollLeft).toBeCloseTo(atOrigin.scrollLeft, 10)
    expect(shifted.scrollTop).toBeCloseTo(atOrigin.scrollTop, 10)
  })

  it('holds still when the factor does not change', () => {
    const before = viewport()
    const target = anchoredScroll(before, { clientX: 200, clientY: 150 }, 1.5, 1.5, { width: 400, height: 300 })
    expect(target.scrollLeft).toBeCloseTo(before.scrollLeft, 10)
    expect(target.scrollTop).toBeCloseTo(before.scrollTop, 10)
  })
})
