/**
 * Where a floating strip is put, and how much of the panel it may use.
 *
 * The arithmetic is the whole point of the module: a strip is parked as a fraction of
 * the panel and then hangs from that point, so the same spot has to mean "on screen"
 * at every panel size the side rail allows.
 */
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PALETTE, boxesOverlap, clampedSpot, draggedSpot, placementStyle, recordStyle, settledSpot,
  paletteRoomBeforeBar, separatedSpot, spotOfBox,
} from '../src/client/annotator/placement'

describe('whether a parked strip covers the figure', () => {
  const figure = { left: 100, top: 100, width: 300, height: 200 }

  it('sees a bar crossing the figure, including the requested breathing room', () => {
    expect(boxesOverlap({ left: 120, top: 220, width: 200, height: 40 }, figure, 8)).toBe(true)
    expect(boxesOverlap({ left: 100, top: 307, width: 200, height: 40 }, figure, 8)).toBe(true)
  })

  it('leaves a bar clear of the figure alone', () => {
    expect(boxesOverlap({ left: 100, top: 316, width: 200, height: 40 }, figure, 8)).toBe(false)
    expect(boxesOverlap({ left: 420, top: 100, width: 200, height: 40 }, figure, 8)).toBe(false)
  })

  it('does not mistake an unmeasured box for an overlap', () => {
    expect(boxesOverlap({ left: 0, top: 0, width: 0, height: 0 }, figure, 8)).toBe(false)
    expect(boxesOverlap(figure, { left: 0, top: 0, width: 10, height: 0 }, 8)).toBe(false)
  })
})

describe('keeping a tall strip above a lower one in a short panel', () => {
  const bar = { left: 100, top: 252, width: 382, height: 36 }

  it('bounds the tool strip where its lane reaches the bar', () => {
    expect(paletteRoomBeforeBar(
      { left: 343, top: 122, width: 42, height: 280 },
      bar,
    )).toBe(122)
    expect(paletteRoomBeforeBar(
      { left: 343, top: 230, width: 42, height: 40 },
      bar,
    )).toBe(32)
  })

  it('does not spend the bar lane on a strip beside it or already below it', () => {
    expect(paletteRoomBeforeBar(
      { left: 520, top: 122, width: 42, height: 280 },
      bar,
    )).toBeUndefined()
    expect(paletteRoomBeforeBar(
      { left: 343, top: 252, width: 42, height: 40 },
      bar,
    )).toBeUndefined()
  })

  it('treats an unmeasured box as having no vertical bound', () => {
    expect(paletteRoomBeforeBar(
      { left: 343, top: 122, width: 0, height: 280 },
      bar,
    )).toBeUndefined()
    expect(paletteRoomBeforeBar(
      { left: 343, top: 122, width: 42, height: 280 },
      { left: 100, top: 252, width: 382, height: 0 },
    )).toBeUndefined()
  })
})

describe('placing a strip at its parked fraction', () => {
  it('uses the parked fraction as the strip top-left, without a side switch', () => {
    const style = placementStyle({ x: 0.02, y: 0.04 })
    expect(style.left).toBe('2%')
    expect(style.top).toBe('4%')
    expect(style.transform).toBe('none')
  })

  it('does not flip a strip as its top-left crosses the panel middle', () => {
    // Flipping at the midline kept the stored number continuous but moved the visible
    // box by its full width or height. The drag now always speaks in screen top-left
    // coordinates, and clamping is what keeps that corner inside the panel.
    const style = placementStyle({ x: 0.98, y: 0.96 })
    expect(style.transform).toBe('none')
    expect(style.left).toBe('98%')
    expect(style.top).toBe('96%')
  })

  it('bounds a top-half strip to the room below its point', () => {
    // The fraction says where the strip starts, not how tall it may be. A palette of
    // seven tools is taller than a panel dragged to two hundred pixels, and the panel
    // clips what reaches past it — because the strips are absolutely positioned and
    // outside the one child that scrolls. Unbounded, the last tools were painted
    // outside the clip where nothing could reach them: the `element` tool could not be
    // armed at all at 240px and below.
    expect(placementStyle({ x: 0.02, y: 0.04 }).maxHeight).toMatch(/^max\(0px, calc\(96% - 8px\)\)$/u)
  })

  it('bounds every strip to the room below its top-left, never below zero', () => {
    expect(placementStyle({ x: 0.98, y: 0.5 }).maxHeight).toMatch(/^max\(0px, calc\(50% - 8px\)\)$/u)
    expect(placementStyle({ x: 0.5, y: 0.6 }).maxHeight).toMatch(/^max\(0px, calc\(40% - 8px\)\)$/u)
    expect(placementStyle({ x: 0.5, y: 0.96 }).maxHeight).toMatch(/^max\(0px, calc\(4(?:\.\d+)?% - 8px\)\)$/u)
  })

  it('keeps the palette in the corner the reader learned', () => {
    // The palette's left corner is the product's established place — the README calls
    // it the left floating strip. The bubble stack moved instead (see the stylesheet):
    // it is transient, and a few seconds of news should not make every reader relearn
    // where the tools are.
    const style = placementStyle(DEFAULT_PALETTE)
    expect(style.left).toBe('2%')
    expect(style.transform).toBe('none')
    // The top edge still has the most room, so the first drag has room to grow down.
    expect(style.maxHeight).toMatch(/^max\(0px, calc\(96% - 8px\)\)$/u)
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

  it('clamps a strip at the far edge by its whole body, keeping the same screen gap', () => {
    const spot = draggedSpot(
      { pointerId: 1, origin: { x: 0.5, y: 0.5 }, box: { left: 0, top: 0 } },
      { clientX: 10_000, clientY: 10_000 },
      panel,
      strip,
    )
    expect(spot.x).toBeCloseTo((panel.width - strip.width - 8) / panel.width)
    expect(spot.y).toBeCloseTo((panel.height - strip.height - 8) / panel.height)
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
    expect(spot.x).toBeCloseTo((panel.width - 300 - 8) / panel.width)
    expect(spot.y).toBeCloseTo(0.2)
  })

  it('stays exactly under the hand in open space and stops at the gutter', () => {
    const origin = { x: 0.05, y: 0.5 }
    const near = draggedSpot(
      { pointerId: 1, origin, box: { left: 0, top: 0 } },
      { clientX: -30, clientY: 0 },
      panel,
      { width: 40, height: 100 },
    )
    // Direct manipulation is one-for-one until the body reaches the panel gutter.
    // Edge gravity is a release state, not a force applied under the pointer.
    expect(near.x).toBeCloseTo(8 / panel.width)
    expect(near.y).toBeCloseTo(0.5)

    const moving = draggedSpot(
      { pointerId: 1, origin, box: { left: 0, top: 0 } },
      { clientX: 10, clientY: 12 },
      panel,
      { width: 40, height: 100 },
    )
    expect(moving.x).toBeCloseTo(0.05 + 10 / panel.width)
    expect(moving.y).toBeCloseTo(0.5 + 12 / panel.height)
  })

  it('clamps the other way too, so no travel puts a strip past the near edge', () => {
    const spot = draggedSpot(
      { pointerId: 1, origin: { x: 0.5, y: 0.5 }, box: { left: 0, top: 0 } },
      { clientX: -10_000, clientY: -10_000 },
      panel,
      strip,
    )
    expect(spot.x).toBeCloseTo(8 / panel.width)
    expect(spot.y).toBeCloseTo(8 / panel.height)
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

  it('keeps following the pointer through the other strip while it is held', () => {
    const spot = draggedSpot(
      { pointerId: 1, origin: { x: 0.25, y: 0.4 }, box: { left: 100, top: 240 } },
      { clientX: 260, clientY: 240 },
      panel,
      { width: 200, height: 40 },
    )
    // Collision is a property of the resting layout. Applying it to every frame made
    // the grabbed strip slide away from the hand as it crossed its sibling.
    expect(spot.x).toBeCloseTo((panel.width - 200 - 8) / panel.width)
    expect(spot.y).toBeCloseTo(0.4)
  })
})

describe('repairing two strips after a resize', () => {
  const panel = { left: 0, top: 0, width: 400, height: 600 }
  const strip = { width: 50, height: 50 }

  it('reports no safe spot when the panel is too small to separate them', () => {
    const small = { left: 0, top: 0, width: 120, height: 120 }
    const obstacle = { left: 0, top: 0, width: 120, height: 120 }
    expect(separatedSpot(
      { x: 0.2, y: 0.2 },
      small,
      { width: 80, height: 80 },
      obstacle,
    )).toBeUndefined()
  })

  it.each([
    {
      side: 'left',
      spot: { x: 0.5, y: 0.5 },
      obstacle: { left: 240, top: 250, width: 100, height: 100 },
    },
    {
      side: 'right',
      spot: { x: 0.25, y: 0.5 },
      obstacle: { left: 50, top: 250, width: 80, height: 100 },
    },
    {
      side: 'top',
      spot: { x: 0.5, y: 0.5 },
      obstacle: { left: 100, top: 320, width: 300, height: 80 },
    },
    {
      side: 'bottom',
      spot: { x: 0.5, y: 0.4 },
      obstacle: { left: 100, top: 200, width: 300, height: 80 },
    },
  ])('slides to the nearest $side face that has room', ({ obstacle, spot }) => {
    const separated = separatedSpot(spot, panel, strip, obstacle)
    expect(separated).toBeDefined()
    if (separated === undefined) throw new Error('expected a collision-free spot')
    const box = {
      left: separated.x * panel.width,
      top: separated.y * panel.height,
      width: strip.width,
      height: strip.height,
    }
    expect(boxesOverlap(box, obstacle, 8)).toBe(false)
  })

  it('leaves a strip alone when the other one is already clear', () => {
    const spot = { x: 0.5, y: 0.5 }
    expect(separatedSpot(
      spot,
      panel,
      strip,
      { left: 0, top: 0, width: 20, height: 20 },
    )).toEqual(spot)
  })
})

describe('settling a strip after release', () => {
  const panel = { left: 0, top: 0, width: 400, height: 600 }
  const strip = { width: 200, height: 40 }

  it('docks to a nearby edge and writes the same eight-pixel gutter as clamping', () => {
    expect(settledSpot({ x: 0.05, y: 0.5 }, panel, strip)).toEqual({
      x: 8 / 400,
      y: 0.5,
    })
    expect(settledSpot({ x: 0.5, y: 0.95 }, panel, strip).y).toBeCloseTo(
      (600 - strip.height - 8) / 600,
    )
  })

  it('leaves a strip in open space exactly where it was released', () => {
    expect(settledSpot({ x: 0.4, y: 0.45 }, panel, strip)).toEqual({ x: 0.4, y: 0.45 })
  })

  it('does not dock into the other strip, even when that edge is closest', () => {
    const obstacle = { left: 0, top: 280, width: 80, height: 80 }
    const spot = settledSpot({ x: 0.05, y: 0.5 }, panel, strip, obstacle)
    const box = {
      left: spot.x * panel.width,
      top: spot.y * panel.height,
      width: strip.width,
      height: strip.height,
    }
    expect(boxesOverlap(box, obstacle, 8)).toBe(false)
  })
})

describe('repairing a parked spot against a changed panel', () => {
  const panel = { left: 0, top: 0, width: 400, height: 600 }

  it('pulls both the strip and its far side into the gutter', () => {
    expect(clampedSpot({ x: 2, y: -1 }, panel, { width: 40, height: 250 })).toEqual({
      x: (400 - 40 - 8) / 400,
      y: 8 / 600,
    })
    expect(clampedSpot({ x: -1, y: 2 }, panel, { width: 40, height: 250 })).toEqual({
      x: 8 / 400,
      y: (600 - 250 - 8) / 600,
    })
  })

  it('keeps a strip larger than the panel at the near gutter rather than inverting it', () => {
    expect(clampedSpot({ x: 2, y: 2 }, panel, { width: 500, height: 700 })).toEqual({
      x: 8 / 400,
      y: 8 / 600,
    })
  })

  it('returns finite fractions for a panel that has not been measured', () => {
    const spot = clampedSpot({ x: 0.5, y: 0.5 }, { left: 0, top: 0, width: 0, height: 0 },
      { width: 40, height: 40 })
    expect(Number.isFinite(spot.x)).toBe(true)
    expect(Number.isFinite(spot.y)).toBe(true)
  })
})

describe('reading a strip that is already on the panel', () => {
  const panel = { left: 0, top: 0, width: 400, height: 600 }

  it('returns the near corner while the strip is in the first half', () => {
    // The bar has no spot before its first drag: the stylesheet anchors it to the
    // bottom, so its own box is the only origin that does not make it jump.
    const spot = spotOfBox({ left: 10, top: 20, width: 40, height: 30 }, panel)
    expect(spot.x).toBeCloseTo(10 / 400)
    expect(spot.y).toBeCloseTo(20 / 600)
  })

  it('returns the top-left corner even once the strip is past the middle', () => {
    // The visible box does not flip sides any more, so the top-left is the only
    // origin that makes the next pointer move continue where the reader sees it.
    const spot = spotOfBox({ left: 300, top: 500, width: 80, height: 80 }, panel)
    expect(spot.x).toBeCloseTo(300 / 400)
    expect(spot.y).toBeCloseTo(500 / 600)
  })

  it('survives a panel with no size, rather than dividing by it', () => {
    const spot = spotOfBox(
      { left: 10, top: 10, width: 20, height: 20 },
      { left: 0, top: 0, width: 0, height: 0 },
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
