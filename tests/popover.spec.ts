// @vitest-environment node
/**
 * Where a floating card lands.
 *
 * The card belongs beside the mark it describes, but a panel is a fixed space: the
 * arithmetic has to know what to do when there is no room below, when the mark sits
 * against an edge, and when the reader has scrolled the figure out from under it.
 */
import { describe, expect, it } from 'vitest'
import {
  DETAIL_HEIGHT, DETAIL_WIDTH, POPOVER_GAP, POPOVER_MARGIN,
  measuredSize, placeAboveBar, placeCard, scaledBox, type PopoverBox,
} from '../src/client/popover'

/** A box, written the short way. */
function box(x: number, y: number, width: number, height: number): PopoverBox {
  return { x, y, width, height }
}

describe('putting a figure box into the panel', () => {
  it('scales the mark and moves it with the figure', () => {
    // The figure is drawn at half size and starts 20px into the panel.
    const at = scaledBox(box(100, 40, 20, 10), box(20, 20, 100, 50), box(0, 0, 400, 300), 200)
    expect(at).toEqual({ x: 70, y: 40, width: 10, height: 5 })
  })

  it('returns the mark where it is when the figure is drawn at 1:1', () => {
    const at = scaledBox(box(10, 10, 20, 20), box(0, 0, 200, 100), box(0, 0, 200, 100), 200)
    expect(at).toEqual({ x: 10, y: 10, width: 20, height: 20 })
  })

  it('keeps the arithmetic finite for a panel that is not laid out yet', () => {
    // A collapsed pane has no width to divide by, and nothing is drawn in it.
    const at = scaledBox(box(10, 10, 20, 20), box(0, 0, 0, 0), box(0, 0, 0, 0), 200)
    expect(at).toEqual({ x: 10, y: 10, width: 20, height: 20 })
  })

  it('measures against the figure rather than the host when the figure has no width', () => {
    const at = scaledBox(box(0, 0, 5, 5), box(0, 0, 100, 50), box(0, 0, 400, 300), 0)
    expect(at).toEqual({ x: 0, y: 0, width: 5, height: 5 })
  })
})

describe('the size a card is placed by', () => {
  it('uses the card its own size once it has been laid out', () => {
    // A comment pill grows with the sentence in it; placing by a one-line constant
    // would push a long comment off the bottom of the panel.
    expect(measuredSize({ offsetWidth: 300, offsetHeight: 96 }, { width: 300, height: 48 }))
      .toEqual({ width: 300, height: 96 })
  })

  it('falls back to the estimate before the card has been measured', () => {
    // First frame of a selection: the element exists but has no box yet.
    expect(measuredSize(null, { width: 300, height: 48 })).toEqual({ width: 300, height: 48 })
    expect(measuredSize({ offsetWidth: 0, offsetHeight: 0 }, { width: 300, height: 48 }))
      .toEqual({ width: 300, height: 48 })
  })
})

describe('choosing where the card goes', () => {
  it('sits just below the mark when there is room', () => {
    const at = placeCard(box(100, 100, 40, 20), 600, 600)
    expect(at).toEqual({ left: 100, top: 100 + 20 + POPOVER_GAP })
  })

  it('lines its left edge up with the mark', () => {
    const at = placeCard(box(37, 10, 10, 10), 600, 600)
    expect(at.left).toBe(37)
  })

  it('goes above the mark when the card would not fit below it', () => {
    const panelHeight = 300
    const anchor = box(100, panelHeight - 40, 40, 20)
    const at = placeCard(anchor, 600, panelHeight)
    expect(at.top).toBe(anchor.y - DETAIL_HEIGHT - POPOVER_GAP)
  })

  it('pins the card to the top when neither side has room, rather than off the bottom', () => {
    // A mark taller than the panel leaves no room either way; a card whose buttons
    // are off screen cannot be used at all, so the edge wins.
    const at = placeCard(box(0, 0, 40, 900), 600, 300)
    expect(at.top).toBe(POPOVER_MARGIN)
  })

  it('keeps the card off the right edge, so its whole width is inside', () => {
    const at = placeCard(box(560, 10, 30, 9), 600, 600)
    expect(at.left).toBe(600 - DETAIL_WIDTH - POPOVER_MARGIN)
  })

  it('keeps the card off the left edge even for a mark that hangs out of it', () => {
    const at = placeCard(box(-40, 10, 30, 9), 600, 600)
    expect(at.left).toBe(POPOVER_MARGIN)
  })

  it('leaves the card against the left edge when the panel is narrower than it is', () => {
    // Nothing to clamp to but the margin: a narrow pane is a narrow pane.
    const at = placeCard(box(10, 10, 10, 10), 200, 300)
    expect(at.left).toBe(POPOVER_MARGIN)
  })

  it('takes a card of a size the caller names', () => {
    const at = placeCard(box(10, 10, 10, 10), 600, 600, { width: 100, height: 50 })
    expect(at).toEqual({ left: 10, top: 30 })
  })
})

describe('placeAboveBar', () => {
  const panel = { x: 0, y: 0, width: 400, height: 600 }

  it('hangs the record off the top of the bar, centred on it', () => {
    // The bar sits 12px up from the bottom edge of a 600px panel, 200px wide.
    const at = placeAboveBar({ x: 100, y: 560, width: 200, height: 28 }, panel)
    expect(at.left).toBe(35)
    expect(at.bottom).toBe(50)
    expect(at.top).toBeUndefined()
  })

  it('keeps the record inside the panel when the bar is near an edge', () => {
    const at = placeAboveBar({ x: 380, y: 560, width: 200, height: 28 }, panel)
    expect(at.left).toBe(62)
  })

  it('keeps the record inside a panel narrower than the record itself', () => {
    // The record is clamped to the panel's width and still hangs off the bar's top
    // edge, 10px above it.
    const at = placeAboveBar({ x: 10, y: 260, width: 100, height: 28 }, { x: 0, y: 0, width: 200, height: 300 })
    expect(at.left).toBe(8)
    expect(at.bottom).toBe(50)
  })

  it('takes a width of its own', () => {
    // A 100px record over a 200px bar is still centred on the bar, not on the panel.
    const at = placeAboveBar({ x: 100, y: 560, width: 200, height: 28 }, panel, 100)
    expect(at.left).toBe(150)
  })

  it('opens below the bar when the bar has been dragged to the top', () => {
    // A record that opened upwards from here would be off the top of the panel: the
    // bar is high on the pane precisely because the reader is working down there.
    const at = placeAboveBar({ x: 100, y: 20, width: 200, height: 28 }, panel)
    expect(at.top).toBe(58)
    expect(at.bottom).toBeUndefined()
  })

  it('opens below a bar that is merely too high for a record above it', () => {
    // 200px of panel above the bar is not the 180px a record wants plus the 10px gap
    // and the 8px margin, so it goes under the bar instead.
    const at = placeAboveBar({ x: 100, y: 190, width: 200, height: 28 }, panel)
    expect(at.top).toBe(228)
    expect(at.bottom).toBeUndefined()
  })

  it('still opens above with just enough room', () => {
    const at = placeAboveBar({ x: 100, y: 198, width: 200, height: 28 }, panel)
    expect(at.bottom).toBe(412)
    expect(at.top).toBeUndefined()
  })
})
