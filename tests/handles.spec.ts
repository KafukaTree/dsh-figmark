// @vitest-environment jsdom
/** The handle arithmetic: where handles sit, what a drag of each one asks for. */
import { describe, expect, it } from 'vitest'
import type { FigurePoint } from '../src/shared/annotation'
import {
  HANDLE_IDS,
  HANDLE_SIZE,
  MIN_MARK_SIZE,
  ROTATE_ARM,
  cursorFor,
  handleAt,
  handlesFor,
  resizeBy,
  rotationTo,
  tetherFor,
  type HandleId,
} from '../src/client/handles'
import { boxCentre, markBounds, type MarkBox } from '../src/client/mark-geometry'

/** A box from its corner and size, as the selection frame stores it. */
const box = (x: number, y: number, width: number, height: number): MarkBox => ({ x, y, width, height })

/** The geometry of a box, as a mark stores its points. */
const points = (x: number, y: number, width: number, height: number): readonly FigurePoint[] =>
  [[x, y], [x + width, y + height]]

/** The point of one placed handle. */
function at(markBox: MarkBox, rotation: number, id: HandleId): readonly [number, number] {
  const found = handlesFor(markBox, rotation).find(handle => handle.id === id)
  expect(found).toBeDefined()
  return found?.point ?? [0, 0]
}

describe('the size a control frame is drawn at', () => {
  const square = box(10, 20, 100, 40)

  it('keeps the corners and edges on the box whatever the handle is drawn at', () => {
    // Size only ever moves the turn handle: the eight on the box are the box's own
    // corners and edge centres, and a bigger square around them is still centred there.
    const big = handlesFor(square, 0, 21)
    for (const id of HANDLE_IDS) {
      expect(big.find(handle => handle.id === id)?.point)
        .toEqual(handlesFor(square, 0).find(handle => handle.id === id)?.point)
    }
  })

  it('carries the turn handle out with the handle size, keeping its proportions', () => {
    // Three times the grip on the same arm would have the circle sitting on the corners.
    const turned = handlesFor(square, 0, HANDLE_SIZE * 3).find(handle => handle.id === 'rotate')?.point
    expect(turned).toEqual([60, 20 - ROTATE_ARM * 3])
  })

  it('ties the turn handle back to the top edge at the same arm', () => {
    const tether = tetherFor(square, 0, HANDLE_SIZE * 2)
    expect(tether.from).toEqual([60, 20 - ROTATE_ARM * 2])
    expect(tether.to).toEqual([60, 20])
  })

  it('finds a handle at the reach it is given, for the size it is drawn at', () => {
    // A grip drawn three times as large is three times as far off the box, so a press
    // on the old position must miss it — the reach and the size have to agree.
    expect(handleAt(square, 0, [60, 20 - ROTATE_ARM * 3], 6, HANDLE_SIZE * 3)).toBe('rotate')
    expect(handleAt(square, 0, [60, 20 - ROTATE_ARM], 6, HANDLE_SIZE * 3)).toBeUndefined()
  })
})

describe('handlesFor', () => {
  const square = box(10, 20, 100, 40)

  it('puts a handle on each corner and edge of the box', () => {
    expect(handlesFor(square, 0).map(handle => handle.id)).toEqual([...HANDLE_IDS, 'rotate'])
    expect(at(square, 0, 'nw')).toEqual([10, 20])
    expect(at(square, 0, 'ne')).toEqual([110, 20])
    expect(at(square, 0, 'se')).toEqual([110, 60])
    expect(at(square, 0, 'sw')).toEqual([10, 60])
    expect(at(square, 0, 'n')).toEqual([60, 20])
    expect(at(square, 0, 'e')).toEqual([110, 40])
    expect(at(square, 0, 's')).toEqual([60, 60])
    expect(at(square, 0, 'w')).toEqual([10, 40])
  })

  it('puts the rotation handle above the top edge', () => {
    expect(at(square, 0, 'rotate')).toEqual([60, 20 - ROTATE_ARM])
  })

  it('turns every handle with the mark, about the same centre', () => {
    const unit = box(0, 0, 100, 100)
    expect(boxCentre(unit)).toEqual([50, 50])
    // A quarter turn clockwise sends the north-west corner to the north-east.
    expect(at(unit, 90, 'nw')[0]).toBeCloseTo(100, 6)
    expect(at(unit, 90, 'nw')[1]).toBeCloseTo(0, 6)
    expect(at(unit, 180, 'nw')[0]).toBeCloseTo(100, 6)
    expect(at(unit, 180, 'nw')[1]).toBeCloseTo(100, 6)
    // And the rotation handle, above, swings out to the right. It rests
    // `ROTATE_ARM` above the top edge, so it is that plus half the box away from
    // the centre, and a quarter turn puts that distance to the right.
    expect(at(unit, 90, 'rotate')[0]).toBeCloseTo(50 + 50 + ROTATE_ARM, 6)
    expect(at(unit, 90, 'rotate')[1]).toBeCloseTo(50, 6)
  })

  it('leaves the handles upright at zero rotation', () => {
    expect(handlesFor(box(0, 0, 20, 20), 0)[0]?.point).toEqual([0, 0])
  })

  it('frames a shape with no area, so a straight line is still grabbable', () => {
    expect(handlesFor(box(5, 5, 0, 0), 0)).toHaveLength(9)
  })
})

describe('handleAt', () => {
  const square = box(0, 0, 100, 100)

  it('finds the corner a press landed on', () => {
    expect(handleAt(square, 0, [0, 0], 6)).toBe('nw')
    expect(handleAt(square, 0, [100, 0], 6)).toBe('ne')
    expect(handleAt(square, 0, [100, 100], 6)).toBe('se')
    expect(handleAt(square, 0, [0, 100], 6)).toBe('sw')
  })

  it('finds an edge handle by its midpoint', () => {
    expect(handleAt(square, 0, [50, 0], 6)).toBe('n')
    expect(handleAt(square, 0, [50, 100], 6)).toBe('s')
    expect(handleAt(square, 0, [0, 50], 6)).toBe('w')
    expect(handleAt(square, 0, [100, 50], 6)).toBe('e')
  })

  it('finds the rotation handle above the box', () => {
    expect(handleAt(square, 0, [50, -ROTATE_ARM], 6)).toBe('rotate')
  })

  it('misses the middle of the shape, which is a body press', () => {
    expect(handleAt(square, 0, [50, 50], 6)).toBeUndefined()
  })

  it('measures reach from the handle, not the box', () => {
    // A press two pixels off the corner is within a handle's reach.
    expect(handleAt(square, 0, [-2, -2], HANDLE_SIZE)).toBe('nw')
    // Well outside it, even though the box itself starts only a little nearer.
    expect(handleAt(square, 0, [-6, -6], HANDLE_SIZE)).toBeUndefined()
    // Inside a wider reach: the corner again.
    expect(handleAt(square, 0, [-6, -6], 10)).toBe('nw')
  })

  it('lets the nearer handle win', () => {
    expect(handleAt(square, 0, [1, 1], 6)).toBe('nw')
  })

  it('finds a turned handle where it is drawn', () => {
    const turned = at(square, 90, 'nw')
    expect(handleAt(square, 90, turned, 6)).toBe('nw')
    // The upright position of that corner is no longer a handle.
    expect(handleAt(square, 90, [0, 0], 6)).not.toBe('nw')
  })
})

describe('resizeBy', () => {
  const square = points(0, 0, 100, 100)

  it('moves the held edge and leaves the opposite one fixed', () => {
    const resized = resizeBy({ handle: 'e', at: [150, 50], origin: square, rotation: 0 })
    expect(markBounds(resized)).toEqual({ x: 0, y: 0, width: 150, height: 100 })
  })

  it('grows a box from the corner opposite the one held', () => {
    const resized = resizeBy({ handle: 'se', at: [200, 180], origin: square, rotation: 0 })
    expect(markBounds(resized)).toEqual({ x: 0, y: 0, width: 200, height: 180 })
  })

  it('shrinks a box from the corner opposite the one held', () => {
    const resized = resizeBy({ handle: 'se', at: [40, 30], origin: square, rotation: 0 })
    expect(markBounds(resized)).toEqual({ x: 0, y: 0, width: 40, height: 30 })
  })

  it('moves the north-west corner alone when that one is held', () => {
    const resized = resizeBy({ handle: 'nw', at: [-20, -10], origin: square, rotation: 0 })
    const bounds = markBounds(resized)
    expect(bounds?.x).toBeCloseTo(-20, 6)
    expect(bounds?.y).toBeCloseTo(-10, 6)
    expect(bounds?.width).toBeCloseTo(120, 6)
    expect(bounds?.height).toBeCloseTo(110, 6)
  })

  it('never lets a side collapse below the minimum', () => {
    const resized = resizeBy({ handle: 'e', at: [-500, 50], origin: square, rotation: 0 })
    expect(markBounds(resized)?.width).toBe(MIN_MARK_SIZE)
    // The west edge, which the drag is not holding, has not moved.
    expect(markBounds(resized)?.x).toBe(0)
  })

  it('never lets the low side cross the high side', () => {
    const resized = resizeBy({ handle: 'nw', at: [500, 500], origin: square, rotation: 0 })
    expect(markBounds(resized)?.width).toBe(MIN_MARK_SIZE)
    expect(markBounds(resized)?.height).toBe(MIN_MARK_SIZE)
  })

  it('resizes a flat shape along the axis it has extent in', () => {
    const line = [[0, 50], [100, 50]] as const
    expect(markBounds(resizeBy({ handle: 'e', at: [200, 50], origin: line, rotation: 0 }))?.width).toBe(200)
    // A vertical handle has nothing to scale, so the shape stays put.
    expect(markBounds(resizeBy({ handle: 's', at: [50, 200], origin: line, rotation: 0 })))
      .toEqual({ x: 0, y: 50, width: 100, height: 0 })
  })

  it('shrinks a flat shape without snapping it onto an edge', () => {
    const line = [[0, 50], [100, 50]] as const
    expect(markBounds(resizeBy({ handle: 'e', at: [20, 50], origin: line, rotation: 0 })))
      .toEqual({ x: 0, y: 50, width: 20, height: 0 })
  })

  it('keeps the corner the drag is not holding where it was, for a turned mark', () => {
    // The anchored corner is the north-west one, which a 45° turn about the
    // centre swings out to `[50, 50 - 50√2]`. Resizing from the south-east must
    // leave it exactly there.
    const resized = resizeBy({ handle: 'se', at: [160, 140], origin: square, rotation: 45 })
    const bounds = markBounds(resized)
    expect(bounds).toBeDefined()
    const newBox: MarkBox = { x: bounds?.x ?? 0, y: bounds?.y ?? 0, width: bounds?.width ?? 0, height: bounds?.height ?? 0 }
    const centre = boxCentre(newBox)
    const radians = Math.PI / 4
    const dx = newBox.x - centre[0]
    const dy = newBox.y - centre[1]
    expect(centre[0] + dx * Math.cos(radians) - dy * Math.sin(radians)).toBeCloseTo(50, 6)
    expect(centre[1] + dx * Math.sin(radians) + dy * Math.cos(radians)).toBeCloseTo(50 - 50 * Math.SQRT2, 6)
  })

  it('returns the geometry untouched when it has no box', () => {
    expect(resizeBy({ handle: 'e', at: [10, 10], origin: [], rotation: 0 })).toEqual([])
  })
})

describe('mapping a stroke through a resize', () => {
  it('keeps a freehand stroke its own shape', () => {
    const stroke: FigurePoint[] = [[0, 0], [50, 50], [100, 0]]
    const resized = resizeBy({ handle: 'e', at: [200, 50], origin: stroke, rotation: 0 })
    expect(markBounds(resized)?.width).toBe(200)
    // The middle sample stays in the middle, so the stroke was mapped, not rebuilt.
    expect(resized[1]?.[0]).toBeCloseTo(100, 6)
    expect(resized[1]?.[1]).toBeCloseTo(50, 6)
  })

  it('maps a zero-width stroke without dividing by zero', () => {
    const vertical: FigurePoint[] = [[10, 0], [10, 100]]
    const resized = resizeBy({ handle: 's', at: [10, 200], origin: vertical, rotation: 0 })
    expect(markBounds(resized)?.height).toBe(200)
    expect(resized.every(point => point[0] === 10)).toBe(true)
  })
})

describe('rotationTo', () => {
  const centre: FigurePoint = [50, 50]

  it('reads the angle from the centre to the pointer', () => {
    // The handle rests above the centre, which is zero.
    expect(rotationTo(centre, [50, 0], false)).toBeCloseTo(0, 6)
    expect(rotationTo(centre, [100, 50], false)).toBeCloseTo(90, 6)
    expect(rotationTo(centre, [50, 100], false)).toBeCloseTo(180, 6)
    expect(rotationTo(centre, [0, 50], false)).toBeCloseTo(270, 6)
  })

})

describe('cursorFor', () => {
  it('gives every handle a cursor that describes its drag', () => {
    expect(cursorFor('nw')).toBe('nwse-resize')
    expect(cursorFor('se')).toBe('nwse-resize')
    expect(cursorFor('ne')).toBe('nesw-resize')
    expect(cursorFor('sw')).toBe('nesw-resize')
    expect(cursorFor('n')).toBe('ns-resize')
    expect(cursorFor('s')).toBe('ns-resize')
    expect(cursorFor('e')).toBe('ew-resize')
    expect(cursorFor('w')).toBe('ew-resize')
    // The turn handle says "rotate", not "drag": an arrow in a circle, white with a
    // dark rim, with the hotspot at its centre.
    expect(cursorFor('rotate')).toContain('data:image/svg+xml')
    expect(decodeURIComponent(cursorFor('rotate'))).toContain('A7 7 0 1 1 8.6 6.1')
    expect(cursorFor('rotate')).toContain('12 12, crosshair')
  })
})
