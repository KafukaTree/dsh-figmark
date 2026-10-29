/**
 * Where a floating strip is put, and how much of the panel it may use.
 *
 * The arithmetic is the whole point of the module: a strip is parked as a fraction of
 * the panel and then hangs from that point, so the same spot has to mean "on screen"
 * at every panel size the side rail allows.
 */
import { describe, expect, it } from 'vitest'
import { DEFAULT_PALETTE, draggedSpot, placementStyle, recordStyle } from '../src/client/annotator/placement'

describe('placing a strip at its parked fraction', () => {
  it('hangs a top-half strip down and to the right of its point', () => {
    const style = placementStyle({ x: 0.02, y: 0.04 })
    expect(style.left).toBe('2%')
    expect(style.top).toBe('4%')
    expect(style.transform).toBe('translate(0, 0)')
  })

  it('flips a bottom-half strip so its far corner stays on the panel', () => {
    // A fraction of 1 puts the strip's *near* edge on the far edge of the pane, which
    // would hang its whole body outside. Past the middle the box is flipped instead.
    const style = placementStyle({ x: 0.98, y: 0.96 })
    expect(style.transform).toBe('translate(-100%, -100%)')
  })

  it('bounds a top-half strip to the room below its point', () => {
    // The fraction says where the strip starts, not how tall it may be. A palette of
    // seven tools is taller than a panel dragged to two hundred pixels, and the panel
    // clips what reaches past it — because the strips are absolutely positioned and
    // outside the one child that scrolls. Unbounded, the last tools were painted
    // outside the clip where nothing could reach them: the `element` tool could not be
    // armed at all at 240px and below.
    expect(placementStyle({ x: 0.02, y: 0.04 }).maxHeight).toMatch(/^calc\(96% - 8px\)$/u)
  })

  it('bounds a flipped strip to the room above its point', () => {
    expect(placementStyle({ x: 0.98, y: 0.96 }).maxHeight).toMatch(/^calc\(96% - 8px\)$/u)
    expect(placementStyle({ x: 0.5, y: 0.6 }).maxHeight).toMatch(/^calc\(60% - 8px\)$/u)
  })

  it('keeps the default spot where a short panel can still show the whole strip', () => {
    // The default is near the top edge, which is the side with the most room on any
    // panel the rail allows.
    expect(placementStyle(DEFAULT_PALETTE).maxHeight).toMatch(/^calc\(96% - 8px\)$/u)
  })
})

describe('following the pointer that drags a strip', () => {
  const panel = { left: 0, top: 0, width: 400, height: 600 }
  const strip = { width: 40, height: 250 }

  it('moves the strip by how far the pointer travelled, measured against the panel', () => {
    const spot = draggedSpot(
      { pointerId: 1, origin: { x: 0.25, y: 0.25 }, box: { left: 100, top: 150 } },
      { clientX: 200, clientY: 300 },
      panel,
      strip,
    )
    expect(spot.x).toBeCloseTo(0.5)
    expect(spot.y).toBeCloseTo(0.5)
  })

  it('lets a strip dragged past the middle reach the far edge, keeping a hair of gap', () => {
    // Past the middle the strip hangs from its far corner, so its body is already
    // behind the pointer and the only thing left to keep it off is the edge itself.
    // Measuring the clamp by the strip's own width there was what stopped a palette
    // parked on the right a whole palette-width short of the right edge — "this is as
    // far as it goes", 40px from an edge that looked like it should be next to it.
    const spot = draggedSpot(
      { pointerId: 1, origin: { x: 0.5, y: 0.5 }, box: { left: 0, top: 0 } },
      { clientX: 10_000, clientY: 10_000 },
      panel,
      strip,
    )
    expect(spot.x).toBeCloseTo(1 - 8 / panel.width)
    expect(spot.y).toBeCloseTo(1 - 8 / panel.height)
  })

  it('keeps a strip hanging from its near edge inside the pane', () => {
    // Before the middle the body hangs down and to the right of its point, so the room
    // it needs is its own width: a wide strip is stopped short of the far edge rather
    // than left hanging outside it.
    const spot = draggedSpot(
      { pointerId: 1, origin: { x: 0.1, y: 0.1 }, box: { left: 0, top: 0 } },
      { clientX: 100, clientY: 60 },
      panel,
      { width: 300, height: 100 },
    )
    expect(spot.x).toBeCloseTo((panel.width - 300) / panel.width)
    expect(spot.y).toBeCloseTo(0.2)
  })

  it('clamps the other way too, so no travel puts a strip past the near edge', () => {
    const spot = draggedSpot(
      { pointerId: 1, origin: { x: 0.5, y: 0.5 }, box: { left: 0, top: 0 } },
      { clientX: -10_000, clientY: -10_000 },
      panel,
      strip,
    )
    expect(spot.x).toBe(0)
    expect(spot.y).toBe(0)
  })

  it('survives a panel with no width, rather than dividing by it', () => {
    const spot = draggedSpot(
      { pointerId: 1, origin: { x: 0.5, y: 0.5 }, box: { left: 0, top: 0 } },
      { clientX: 10, clientY: 10 },
      { left: 0, top: 0, width: 0, height: 0 },
      strip,
    )
    expect(Number.isFinite(spot.x)).toBe(true)
    expect(Number.isFinite(spot.y)).toBe(true)
  })
})

describe('placing a record beside the bar', () => {
  it('writes both sides, so a card that grows down is not also pinned by its bottom', () => {
    const style = recordStyle({ left: 12, top: 40, bottom: undefined })
    expect(style.left).toBe(12)
    expect(style.top).toBe(40)
    expect(style.bottom).toBe('auto')
  })

  it('pins a card to the bottom when that is the side it was measured against', () => {
    const style = recordStyle({ left: 12, top: undefined, bottom: 40 })
    expect(style.top).toBe('auto')
    expect(style.bottom).toBe(40)
  })

  it('places a card at neither edge before it has been measured', () => {
    // Writing only the measured side left the other unset, and an unset top with an
    // unset bottom stretches a card with no height of its own to fill the gap.
    const style = recordStyle(null)
    expect(style.top).toBe('auto')
    expect(style.bottom).toBe('auto')
  })
})
