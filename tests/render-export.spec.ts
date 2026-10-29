/** Mark rendering, review-image composition, and figure sanitizing. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AnnotationMark } from '../src/shared/annotation'
import {
  PIN_FONT_SIZE,
  POINT_RADIUS,
  arrowBarbs,
  STROKE_WIDTH,
  isStrokeKind,
  markOutline,
  markPathData,
  markTransform,
  pinGeometry,
  pinNumberCentre,
  pointMarkBox,
} from '../src/client/render'
import { figureUnit } from '../src/client/scale'
import { bytesToDataUrl, composeReviewSvg, reviewSize, rasterizePng } from '../src/client/export'
import { anchorAtPoint, figureSvgMarkup, parseFigureSvg, svgIntrinsicSize, svgViewBox } from '../src/client/figure-dom'
import { PICK_REACH } from '../src/client/pick'
import { defined, installDom, stubRasterizer, stubRect } from './dom'

const arrow: AnnotationMark = { id: 'a', kind: 'arrow', color: '#e03131', points: [[0, 0], [10, 0]] }
const pen: AnnotationMark = { id: 'p', kind: 'pen', color: '#000', points: [[0, 0], [5, 5], [10, 0]] }

describe('mark geometry', () => {
  it('draws an element as nothing at all', () => {
    // An element mark is drawn as light on the element itself (spotlight.ts), not as a
    // stroke of its own: a box around a curve says "this region" when the mark says
    // "this thing", and that is exactly what the light was brought in to fix.
    const element: AnnotationMark = { id: 'e', kind: 'element', color: '#1971c2', points: [[10, 20], [60, 50]] }
    expect(markPathData(element)).toBeUndefined()
    // It still has a box — the canvas uses it for the mark's invisible hit area, and
    // the picker used it to say what was taken. The box is the two corners plus the pen
    // weight's half, because that is how every mark is measured.
    const box = defined(markOutline(element))
    expect(box.width).toBeGreaterThan(50)
    expect(box.height).toBeGreaterThan(30)
    expect(box.x).toBeLessThan(10)
    expect(box.y).toBeLessThan(20)
  })

  it('carries no path for an element mark with one corner only', () => {
    const one: AnnotationMark = { id: 'e', kind: 'element', color: '#1971c2', points: [[0, 0]] }
    expect(markPathData(one)).toBeUndefined()
  })

  it('draws an arrow as a shaft plus two head strokes', () => {
    const path = markPathData(arrow)
    expect(path?.split('M').length).toBe(3)
  })

  it('normalizes opposite corners into a rectangle', () => {
    expect(markPathData({ id: 'r', kind: 'rect', color: '#000', points: [[10, 20], [30, 5]] }))
      .toBe('M 10 5 H 30 V 20 H 10 Z')
  })

  it('closes an ellipse from its bounding box', () => {
    expect(markPathData({ id: 'e', kind: 'ellipse', color: '#000', points: [[0, 0], [100, 50]] }))
      .toBe('M 0 25 a 50 25 0 1 0 100 0 a 50 25 0 1 0 -100 0')
  })

  it('degrades a zero-height ellipse to a line', () => {
    expect(markPathData({ id: 'e', kind: 'ellipse', color: '#000', points: [[0, 0], [100, 0]] }))
      .toBe('M 0 0 L 100 0')
  })

  it('draws a freehand path through every sample', () => {
    expect(markPathData(pen)).toBe('M 0 0 L 5 5 L 10 0')
  })

  it('has no stroke for a point, and stands its pin on the coordinate', () => {
    const pin: AnnotationMark = { id: 't', kind: 'point', color: '#000', points: [[40, 60]] }
    expect(markPathData(pin)).toBeUndefined()
    const geometry = defined(pinGeometry(pin))
    // The path starts at the tip, which is the coordinate the mark means, and the
    // sides bow out toward the head rather than running straight to it.
    expect(geometry.path.startsWith('M 40 60')).toBe(true)
    expect(geometry.path).toContain(' Q ')
    expect(geometry.path.endsWith(' Z')).toBe(true)
    // The head stands above the tip and holds the number, so its centre is above the
    // coordinate by more than its own radius.
    const centre = defined(pinNumberCentre(pin))
    expect(centre[0]).toBe(40)
    expect(centre[1]).toBeLessThan(60 - POINT_RADIUS)
    const box = defined(pointMarkBox(pin))
    expect(box.x).toBe(40 - POINT_RADIUS)
    expect(box.width).toBe(POINT_RADIUS * 2)
    // The point is the box's bottom edge: the marker claims the coordinate exactly.
    expect(box.y + box.height).toBe(60)
  })

  it('stands the pin below a coordinate too near the top edge, so its head stays in the figure', () => {
    const pin: AnnotationMark = { id: 't', kind: 'point', color: '#000', points: [[40, 3]] }
    expect(defined(pinNumberCentre(pin))[1]).toBeGreaterThan(3 + POINT_RADIUS)
    const box = defined(pointMarkBox(pin))
    // The tip is the box's top edge now, and the head hangs below it, so nothing
    // reaches above the coordinate and nothing leaves the figure's top.
    expect(box.y).toBe(3)
    expect(box.height).toBeGreaterThan(POINT_RADIUS * 2)
  })

  it('has no pin for a point mark that carries no coordinate', () => {
    expect(pointMarkBox({ id: 't', kind: 'point', color: '#000', points: [] })).toBeUndefined()
    expect(pinGeometry({ id: 't', kind: 'point', color: '#000', points: [] })).toBeUndefined()
  })

  it('measures a mark by what it draws, not by the points it stores', () => {
    // An arrow's barbs stand past its tip; its outline has to cover them.
    const outline = defined(markOutline(arrow))
    expect(outline.x + outline.width).toBeGreaterThan(10)
    // A stroke is half its width wide on each side of its path.
    const penOutline = defined(markOutline(pen))
    expect(penOutline.x).toBeLessThan(0)
  })

  it('measures a turned box by the corners it sweeps, not by a turned diagonal', () => {
    // The extent of a rotated rectangle is not the extent of a rotated diagonal.
    // Re-bounding two turned points measured a line: this rect reported a box 12.1px
    // wide where it really swept 233.3px, so the paper never grew for it, its corner
    // was clipped by the viewBox in the panel and in the export, and its comment pill
    // was placed from a box far too narrow.
    const turned: AnnotationMark = {
      id: 't', kind: 'rect', color: '#000', points: [[620, 220], [790, 380]], rotation: 45,
    }
    const box = defined(markOutline(turned))
    // 170×160 turned 45° sweeps 233.3 in both directions, minus half a stroke's growth.
    expect(box.width).toBeCloseTo(233.3 + STROKE_WIDTH, 1)
    expect(box.height).toBeCloseTo(233.3 + STROKE_WIDTH, 1)
    // The drawn corners reach x = 821.7; the outline has to contain them.
    expect(box.x + box.width).toBeGreaterThan(821.7)
  })

  it('measures a point mark by the pin standing on it', () => {
    const point: AnnotationMark = { id: 'p', kind: 'point', color: '#000', points: [[40, 60]] }
    // A point has no extent of its own, so its outline is its pin's.
    expect(markOutline(point)).toEqual(pointMarkBox(point))
    // Every pin is the same size now: the number always fits, so nothing has to grow.
    expect(defined(pointMarkBox(point)).width).toBe(POINT_RADIUS * 2)
  })

  it('grows an outline only from marks that have something to measure', () => {
    // A mark with no points at all has no extent — the ordinary case for one that an
    // undo has left half struck-through — so the card that points at it gets no box
    // rather than a made-up one at the origin.
    expect(markOutline({ id: 'a', kind: 'arrow', color: '#000', points: [] })).toBeUndefined()
    expect(markOutline({ id: 'c', kind: 'rect', color: '#000', points: [] })).toBeUndefined()
    // Half an arrow is measured by the one point it has: a stroke still needs
    // selecting while it is being drawn.
    expect(defined(markOutline({ id: 'b', kind: 'arrow', color: '#000', points: [[10, 10]] })).width)
      .toBe(STROKE_WIDTH)
  })

  it('grows an outline to cover the corners a turned mark sweeps', () => {
    // A turned box covers more than its upright corners do, and the card that points
    // at the mark has to clear the turned shape rather than the box it started as.
    const upright: AnnotationMark = { id: 'r', kind: 'rect', color: '#000', points: [[0, 0], [100, 40]] }
    const turned: AnnotationMark = { ...upright, rotation: 45 }
    expect(defined(markOutline(turned)).height).toBeGreaterThan(defined(markOutline(upright)).height)
  })

  it('reads an arrow\'s extent from its barbs, not from its two stored points', () => {
    // The barbs stand behind the tip, so the drawn arrow reaches past the point the
    // reader dragged to; anything measuring by the stored points alone is short.
    const barbs = arrowBarbs([[0, 0], [100, 0]])
    expect(barbs).toHaveLength(4)
    // Half an arrow is not an arrow: there is no direction to put barbs on.
    expect(arrowBarbs([[0, 0]])).toEqual([[0, 0]])
    expect(arrowBarbs([])).toEqual([])
  })

  it('draws an arrow head at the size it is measured at, on any figure', () => {
    // One unit for both: a head that kept its coordinate size while the shaft scaled
    // drew a different arrow from the one the outline reserved room for, so a large
    // figure got a blunt dart and a margin nothing reached into.
    const mark: AnnotationMark = { id: 'a', kind: 'arrow', color: '#000', points: [[0, 0], [100, 0]] }
    const [, , left, right] = arrowBarbs(mark.points, 1, 5)
    // The painted barbs are the measured barbs, in the same coordinates — rounded to
    // the one decimal the path writes them at.
    const at = (point: readonly [number, number]): string =>
      `${Math.round(point[0] * 10) / 10} ${Math.round(point[1] * 10) / 10}`
    expect(defined(markPathData(mark, 5)))
      .toBe(`M 0 0 L 100 0 M ${at(defined(left))} L 100 0 L ${at(defined(right))}`)
    // And the outline reaches as far as the paint, so no margin is reserved in vain.
    expect(defined(markOutline(mark, 5)).width).toBeGreaterThan(defined(markOutline(mark, 1)).width)
  })

  it('has no path when a mark carries no point', () => {
    expect(markPathData({ id: 'x', kind: 'arrow', color: '#000', points: [] })).toBeUndefined()
  })

  it('has no path for a half-drawn shape, but keeps a one-sample stroke', () => {
    // The wire format requires one point, not the two a box shape needs.
    const one = (kind: AnnotationMark['kind']): string | undefined =>
      markPathData({ id: 'x', kind, color: '#000', points: [[1, 2]] })
    expect(one('arrow')).toBeUndefined()
    expect(one('rect')).toBeUndefined()
    expect(one('ellipse')).toBeUndefined()
    expect(one('pen')).toBe('M 1 2')
    expect(markPathData({ id: 'x', kind: 'pen', color: '#000', points: [] })).toBeUndefined()
  })

  it('separates the shapes that draw as strokes from the one that draws as a ring', () => {
    for (const kind of ['arrow', 'rect', 'ellipse', 'pen'] as const) expect(isStrokeKind(kind), kind).toBe(true)
    expect(isStrokeKind('point')).toBe(false)
  })
})

describe('review image', () => {
  it('embeds the figure under the marks and draws no sentence of its own', () => {
    const svg = composeReviewSvg(
      { kind: 'svg', markup: '<svg width="10" height="10"><rect width="10" height="10"/></svg>', viewBox: '0 0 10 10', width: 10, height: 10 },
      [{ id: 't', kind: 'point', color: '#000', points: [[1, 2]], detail: 'a < b & "c"' }],
    )
    expect(svg.startsWith('<svg xmlns=')).toBe(true)
    expect(svg).toContain('<rect width="10" height="10"/>')
    // The mark's sentence travels in the message, not in the picture, so none of
    // it — escaped or not — may appear here. The only lettering allowed is the
    // number the badge puts on the mark, which is what the list refers to.
    expect(svg).not.toContain('a &lt; b')
    expect(svg).not.toContain('这里')
    expect([...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/gu)].map(match => match[1])).toEqual(['1'])
  })

  describe('an element mark in the delivered picture', () => {
    let dom: ReturnType<typeof installDom>
    beforeEach(() => { dom = installDom() })
    afterEach(() => { dom.window.close() })

  it('lights the element an element mark names, inside the delivered picture', () => {
    // The panel lights the element itself for an element mark (spotlight.ts). If the
    // picture did not, the agent would be reading a figure with no mark on it at all —
    // an element mark draws nothing else.
    const svg = composeReviewSvg(
      {
        kind: 'svg',
        markup: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">'
          + '<g id="line2d_1"><path d="M 0 0 L 100 100"/></g></svg>',
        viewBox: '0 0 100 100',
        width: 100,
        height: 100,
      },
      [{ id: 'e', kind: 'element', color: '#1971c2', points: [[10, 10], [60, 60]], anchor: { tag: 'g', selector: '#line2d_1', bbox: [10, 10, 60, 60] } }],
    )
    expect(svg).toContain('class="da-spot"')
    expect(svg).toContain('drop-shadow')
    // Nothing else is drawn for it: no stroke, no box.
    expect(svg).not.toContain('stroke="#1971c2"')
  })

  it('lights nothing when the figure has no element mark on it', () => {
    const svg = composeReviewSvg(
      { kind: 'svg', markup: '<svg width="10" height="10"><rect width="10" height="10"/></svg>', viewBox: '0 0 10 10', width: 10, height: 10 },
      [{ id: 'r', kind: 'rect', color: '#000', points: [[1, 1], [5, 5]] }],
    )
    expect(svg).not.toContain('da-spot')
  })
  })

  it('draws a point mark as a filled pin with its number inside', () => {
    const svg = composeReviewSvg(
      { kind: 'raster', dataUrl: 'data:image/png;base64,AA', width: 400, height: 300 },
      [{ id: 't', kind: 'point', color: '#e03131', points: [[200, 200]], detail: '这里' }],
    )
    // The point is the path's first coordinate, so the marker claims the exact spot.
    expect(svg).toContain('<path d="M 200 200')
    // The body is filled with the mark's own colour: the number sits on solid ground,
    // not on the figure underneath it.
    expect(svg).toContain('fill="#e03131"')
    // The number is white, because that is what reads on every colour in the palette.
    expect(svg).toContain('fill="#ffffff"')
    // The figure's own unit, not a fixed size: a 400px figure is half the reference
    // edge, so every drawn size — font included — comes out at half.
    expect(svg).toContain(`font-size="${PIN_FONT_SIZE * figureUnit(400, 300)}"`)
    expect(svg).toContain('>1</text>')
  })

  it('draws the number inside a pin as large as the pin itself', () => {
    // The rail that makes a pin bigger has to make its number bigger with it: a head
    // that grows around a fixed-size numeral reads as a circle with a speck in it, and
    // at the large end the number stops being legible where it matters most.
    const layer = { kind: 'raster' as const, dataUrl: 'data:image/png;base64,AA', width: 400, height: 300 }
    const pin = (weight: number): string => composeReviewSvg(layer, [
      { id: 'p', kind: 'point', color: '#e03131', points: [[200, 150]], weight, detail: '这里' },
    ])
    const small = pin(1)
    const large = pin(3)
    const unit = figureUnit(400, 300)
    expect(small).toContain(`font-size="${PIN_FONT_SIZE * unit}"`)
    expect(large).toContain(`font-size="${PIN_FONT_SIZE * 3 * unit}"`)
  })

  it('sizes the reviewed picture to the paper the marks need', () => {
    // A box drawn past the edge of the figure makes the picture wider than the
    // figure. A caller that rasterized at the figure's own size would crop away
    // exactly the marks that made the paper grow.
    const layer = { kind: 'raster' as const, dataUrl: 'data:image/png;base64,AA', width: 400, height: 300 }
    const inside = reviewSize(layer, [{ id: 'a', kind: 'rect', color: '#e03131', points: [[10, 10], [100, 80]] }])
    expect(inside).toEqual({ width: 400, height: 300 })
    const outside = reviewSize(layer, [{ id: 'b', kind: 'rect', color: '#e03131', points: [[-60, 10], [100, 80]] }])
    expect(outside.width).toBeGreaterThan(400)
    // And the SVG it describes agrees with it, which is what makes the pair usable.
    const svg = composeReviewSvg(layer, [{ id: 'b', kind: 'rect', color: '#e03131', points: [[-60, 10], [100, 80]] }])
    expect(svg).toContain(`width="${outside.width}" height="${outside.height}"`)
  })

  it('outlines the figure, and only when a mark left it', () => {
    // The reader of this picture has no panel behind it, so a grown margin looks like
    // more of the figure. A dashed rule on the figure's own edge is the one thing that
    // says where the drawing stopped — and it is drawn only when something needed the
    // extra paper, because a clean figure is already exactly its own size.
    const layer = { kind: 'raster' as const, dataUrl: 'data:image/png;base64,AA', width: 400, height: 300 }
    const inside = composeReviewSvg(layer, [{ id: 'a', kind: 'rect', color: '#e03131', points: [[10, 10], [100, 80]] }])
    expect(inside).not.toContain('stroke-dasharray')
    const outside = composeReviewSvg(layer, [{ id: 'b', kind: 'rect', color: '#e03131', points: [[-60, 10], [100, 80]] }])
    expect(outside).toContain('<rect x="0" y="0" width="400" height="300" fill="none"')
    expect(outside).toContain('stroke-dasharray=')
    // Grey, because it is a note about the picture rather than a mark the reader made.
    expect(outside).toContain('stroke="#9aa3b2"')
  })

  it('numbers a pin on the delivered picture, and leaves stroke marks unnumbered', () => {
    // A pin holds its own number; an arrow has no body to hold one, and a digit
    // parked beside it is a second thing to read on an already busy figure.
    const svg = composeReviewSvg(
      { kind: 'raster', dataUrl: 'data:image/png;base64,AA', width: 400, height: 300 },
      [
        { id: 'a', kind: 'arrow', color: '#e03131', points: [[100, 100], [200, 100]] },
        { id: 'b', kind: 'point', color: '#1971c2', points: [[150, 200]] },
      ],
    )
    expect([...svg.matchAll(/>\d<\/text>/gu)].map(match => match[0])).toEqual(['>2</text>'])
    expect(svg).not.toContain('data-da-badge')
  })

  it('numbers a pin by the document, when the marks are a slice of it', () => {
    const svg = composeReviewSvg(
      { kind: 'raster', dataUrl: 'data:image/png;base64,AA', width: 400, height: 300 },
      [{ id: 'b', kind: 'point', color: '#1971c2', points: [[100, 200]] }],
      new Map([['b', 7]]),
    )
    expect(svg).toContain('>7</text>')
  })

  it('embeds raster bytes as a data URL', () => {
    const svg = composeReviewSvg(
      { kind: 'raster', dataUrl: bytesToDataUrl(new Uint8Array([1, 2, 3]), 'image/png'), width: 4, height: 4 },
      [],
    )
    expect(svg).toContain('href="data:image/png;base64,AQID"')
  })

  it('encodes bytes larger than one chunk', () => {
    const bytes = new Uint8Array(0x8000 + 5).fill(7)
    expect(bytesToDataUrl(bytes, 'image/png').length).toBeGreaterThan(0x8000)
  })

  it('draws a stroke mark as a white halo under its own colour', () => {
    const svg = composeReviewSvg(
      { kind: 'raster', dataUrl: 'data:image/png;base64,AA', width: 4, height: 4 },
      [{ id: 'a', kind: 'arrow', color: '#e03131', points: [[0, 0], [10, 0]] }],
    )
    expect(svg).toContain('stroke="#ffffff"')
    expect(svg).toContain('stroke="#e03131"')
  })

  it('stands a pin on the same two strokes the panel draws it with', () => {
    // The pin's white disc is what separates it from dark line work. The picture used
    // to draw one stroke at 2× the figure unit — a number that matched neither the
    // disc's 4.5 nor the body's 1.5 — so on a dense figure the delivered pins were
    // thinner than the ones the reader approved, and harder to find.
    const svg = composeReviewSvg(
      // A reference-edge figure, so the unit is exactly 1 and the numbers in the
      // markup are the constants themselves rather than a multiple of them.
      { kind: 'raster', dataUrl: 'data:image/png;base64,AA', width: 800, height: 800 },
      [{ id: 'p', kind: 'point', color: '#e03131', points: [[400, 400]] }],
    )
    expect(svg).toContain('stroke-width="4.5"')
    expect(svg).toContain('stroke-width="1.5"')
    expect(svg).not.toContain('stroke-width="2"')
  })

  it('turns a mark the way the panel turns it', () => {
    // `markPathData` knows nothing about rotation, and the paper is measured with the
    // turn applied. Without the transform the reader approved a tilted box and the
    // agent was handed an axis-aligned one on a sheet sized for the turned shape,
    // with prose beside it saying "(rotated 45°)".
    const turned: AnnotationMark = {
      id: 'r', kind: 'rect', color: '#e03131', points: [[100, 100], [300, 200]], rotation: 45,
    }
    const svg = composeReviewSvg(
      { kind: 'raster', dataUrl: 'data:image/png;base64,AA', width: 400, height: 300 },
      [turned],
    )
    expect(svg).toContain('transform="rotate(45 200 150)"')
  })

  it('inlines a vector layer that declares no viewBox', () => {
    const svg = composeReviewSvg(
      { kind: 'svg', markup: '<svg width="3" height="3"><circle r="1"/></svg>', width: 3, height: 3 },
      [],
    )
    expect(svg).not.toContain('viewBox="0 0 3 3" preserveAspectRatio')
    expect(svg).toContain('<circle r="1"/>')
  })
})

describe('rasterizing the review image', () => {
  let dom: ReturnType<typeof installDom>
  beforeEach(() => { dom = installDom() })
  afterEach(() => { dom.window.close() })

  it('draws the composed image onto a canvas scaled to the requested size', async () => {
    const log = stubRasterizer()
    const blob = await rasterizePng('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="5"/>', 10, 5, 2)
    expect(blob.type).toBe('image/png')
    expect(log.canvasSizes).toEqual([{ width: 20, height: 10 }])
    expect(log.revoked).toEqual(['blob:stub-review'])
  })

  it('never asks for a zero-pixel canvas', async () => {
    const log = stubRasterizer()
    await rasterizePng('<svg/>', 0, 0, 0.1)
    expect(log.canvasSizes).toEqual([{ width: 1, height: 1 }])
  })

  it('reports an undecodable composition instead of drawing nothing', async () => {
    stubRasterizer({ imageError: true })
    await expect(rasterizePng('<svg/>', 4, 4, 1)).rejects.toThrow(/could not be decoded/)
  })

  it('reports a missing 2D context, and still releases the object URL', async () => {
    const log = stubRasterizer({ noContext: true })
    await expect(rasterizePng('<svg/>', 4, 4, 1)).rejects.toThrow(/2D canvas is unavailable/)
    expect(log.revoked).toEqual(['blob:stub-review'])
  })

  it('reports a canvas that refuses to encode a PNG', async () => {
    stubRasterizer({ noBlob: true })
    await expect(rasterizePng('<svg/>', 4, 4, 1)).rejects.toThrow(/could not be encoded as PNG/)
  })
})

describe('figure DOM', () => {
  let dom: ReturnType<typeof installDom>
  beforeEach(() => { dom = installDom() })
  afterEach(() => { dom.window.close() })

  it('rejects text that is not SVG', () => {
    expect(parseFigureSvg('not svg at all')).toBeUndefined()
    expect(parseFigureSvg('<html><body/></html>')).toBeUndefined()
  })

  it('strips scripts, handlers, and external references before inlining', () => {
    const root = parseFigureSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">
      <script>alert(1)</script>
      <foreignObject><div/></foreignObject>
      <a href="javascript:alert(1)" onclick="alert(2)"><rect width="5" height="5"/></a>
      <image href="https://evil.example/x.png" width="1" height="1"/>
      <image href="data:image/png;base64,AA" width="1" height="1"/>
    </svg>`)
    expect(root).toBeDefined()
    const markup = new XMLSerializer().serializeToString(defined(root))
    expect(markup).not.toContain('<script')
    expect(markup).not.toContain('foreignObject')
    expect(markup).not.toContain('onclick')
    expect(markup).not.toContain('javascript:')
    expect(markup).not.toContain('evil.example')
    expect(markup).toContain('data:image/png;base64,AA')
  })

  it('keeps a use element, because that is how a plot draws its markers', () => {
    const source = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="20" height="20">
      <defs><path id="m1" d="M0 -3L3 3L-3 3Z"/></defs>
      <use xlink:href="#m1" x="10" y="10"/>
    </svg>`
    const markup = new XMLSerializer().serializeToString(defined(parseFigureSvg(source)))
    expect(markup).toContain('<use')
    expect(markup).toContain('#m1')
    expect(markup).toContain('id="m1"')
  })

  it('drops a use that points outside the figure', () => {
    const markup = new XMLSerializer().serializeToString(defined(parseFigureSvg(
      `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <use xlink:href="https://evil.example/x.svg#a"/>
        <use href="javascript:alert(1)"/>
      </svg>`,
    )))
    expect(markup).not.toContain('evil.example')
    expect(markup).not.toContain('javascript:')
  })

  it('drops a style rule that would reach outside the figure', () => {
    const markup = new XMLSerializer().serializeToString(defined(parseFigureSvg(
      `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">
        <style>@import url(https://evil.example/t.css); .a{fill:red}</style>
        <style>@import "https://evil.example/u.css";</style>
        <rect class="a" width="5" height="5"/>
      </svg>`,
    )))
    expect(markup).not.toContain('evil.example')
    expect(markup).not.toContain('@import')
    // The rule that paints the figure is not a network request, so it stays.
    expect(markup).toContain('fill:red')
  })

  it('reads intrinsic size from attributes, then the viewBox, then defaults', () => {
    expect(svgIntrinsicSize(defined(parseFigureSvg('<svg width="12" height="7"/>')))).toEqual({ width: 12, height: 7 })
    expect(svgIntrinsicSize(defined(parseFigureSvg('<svg viewBox="0 0 30 40"/>')))).toEqual({ width: 30, height: 40 })
    expect(svgIntrinsicSize(defined(parseFigureSvg('<svg/>')))).toEqual({ width: 800, height: 600 })
    expect(svgViewBox(defined(parseFigureSvg('<svg viewBox="1 2 3 4"/>')), { width: 1, height: 1 })).toBe('1 2 3 4')
    expect(svgViewBox(defined(parseFigureSvg('<svg/>')), { width: 9, height: 8 })).toBe('0 0 9 8')
  })

  it('converts a size declared in a physical unit instead of keeping only its digits', () => {
    // `Number.parseFloat('6.4in')` is 6.4, and that bare number was written straight
    // back onto the root as a pixel count — a 460-user-unit figure drawn into 6.4px,
    // 72× too small, with its strokes pinned to the unit floor. It reads as a corrupt
    // file rather than a mis-scaled one.
    const inches = svgIntrinsicSize(defined(parseFigureSvg('<svg width="6.4in" height="4.8in" viewBox="0 0 460 345"/>')))
    expect(inches.width).toBeCloseTo(614.4, 6)
    expect(inches.height).toBeCloseTo(460.8, 6)
    const millimetres = svgIntrinsicSize(defined(parseFigureSvg('<svg width="210mm" height="297mm"/>')))
    expect(millimetres.width).toBeCloseTo(793.7, 1)
    expect(millimetres.height).toBeCloseTo(1122.5, 1)
    // A point is a physical unit too, and it is what matplotlib writes.
    expect(svgIntrinsicSize(defined(parseFigureSvg('<svg width="720pt" height="540pt"/>')))).toEqual({ width: 960, height: 720 })
  })

  it('falls back to the viewBox for a size it cannot express in pixels', () => {
    // A percentage or a viewport unit is not a size this figure has without a
    // container to measure against, so guessing (100) is worse than the viewBox.
    const percent = svgIntrinsicSize(defined(parseFigureSvg('<svg width="100%" height="100%" viewBox="0 0 30 40"/>')))
    expect(percent).toEqual({ width: 30, height: 40 })
    const viewport = svgIntrinsicSize(defined(parseFigureSvg('<svg width="80vw" height="60vh" viewBox="0 0 30 40"/>')))
    expect(viewport).toEqual({ width: 30, height: 40 })
    // An unparseable attribute is no size at all, which is the same answer.
    expect(svgIntrinsicSize(defined(parseFigureSvg('<svg width="abc" height="def" viewBox="0 0 30 40"/>'))))
      .toEqual({ width: 30, height: 40 })
  })

  it('anchors a point to the smallest box, re-pointed at the element that names itself', () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = defined(parseFigureSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <g class="node"><title>102</title><rect x="10" y="10" width="40" height="20" fill="none"/></g>
      <text x="70" y="80">导柱 33</text>
    </svg>`))
    container.append(root)
    stubRect(container, { left: 0, top: 0, width: 100, height: 100 })
    stubRect(root, { left: 0, top: 0, width: 100, height: 100 })
    stubRect(defined(root.querySelector('g')), { left: 10, top: 10, width: 40, height: 20 })
    stubRect(defined(root.querySelector('rect')), { left: 10, top: 10, width: 40, height: 20 })
    stubRect(defined(root.querySelector('text')), { left: 60, top: 70, width: 30, height: 12 })

    const node = anchorAtPoint(container, 30, 20, 1, 1)
    expect(node).toMatchObject({ tag: 'g', title: '102', bbox: [10, 10, 40, 20] })
    const numeral = anchorAtPoint(container, 70, 75, 1, 1)
    expect(numeral).toMatchObject({ tag: 'text', text: '导柱 33' })
    // A point that names nothing (outside every box) carries no anchor.
    expect(anchorAtPoint(container, 5, 95, 1, 1)).toBeUndefined()
  })

  it('scales the reported box into figure pixels', () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = defined(parseFigureSvg('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect x="0" y="0" width="50" height="50"/></svg>'))
    container.append(root)
    stubRect(container, { left: 0, top: 0, width: 200, height: 200 })
    stubRect(defined(root.querySelector('rect')), { left: 0, top: 0, width: 100, height: 100 })
    expect(anchorAtPoint(container, 10, 10, 2, 2)?.bbox).toEqual([0, 0, 200, 200])
  })

  it('answers undefined when the container holds no figure', () => {
    const container = document.createElement('div')
    expect(anchorAtPoint(container, 1, 1, 1, 1)).toBeUndefined()
  })

  it('serializes a sanitized figure for the export canvas', () => {
    const markup = figureSvgMarkup(defined(parseFigureSvg('<svg xmlns="http://www.w3.org/2000/svg" width="4" height="2"/>')))
    expect(markup).toContain('<svg')
    expect(markup).toContain('width="4"')
  })

  it('falls back to the figure size when the viewBox is blank', () => {
    expect(svgViewBox(defined(parseFigureSvg('<svg viewBox="   "/>')), { width: 9, height: 8 })).toBe('0 0 9 8')
  })

  it('ignores a viewBox that is not four usable numbers', () => {
    expect(svgIntrinsicSize(defined(parseFigureSvg('<svg viewBox="0 0 30"/>')))).toEqual({ width: 800, height: 600 })
    expect(svgIntrinsicSize(defined(parseFigureSvg('<svg viewBox="0 0 0 0"/>')))).toEqual({ width: 800, height: 600 })
    expect(svgIntrinsicSize(defined(parseFigureSvg('<svg width="0" height="7"/>')))).toEqual({ width: 800, height: 600 })
  })

  it('prefers the smaller box, the deeper element, and skips elements that draw nothing', () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = defined(parseFigureSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <defs><rect id="in-defs" x="0" y="0" width="100" height="100"/></defs>
      <g id="outer"><rect id="inner" x="0" y="0" width="100" height="100"/></g>
      <line id="flat" x1="0" y1="50" x2="100" y2="50"/>
      <title id="a-title">   </title>
    </svg>`))
    container.append(root)
    const box = { left: 0, top: 0, width: 100, height: 100 }
    stubRect(container, box)
    stubRect(defined(root.querySelector('#outer')), box)
    stubRect(defined(root.querySelector('#inner')), box)
    stubRect(defined(root.querySelector('#in-defs')), box)
    stubRect(defined(root.querySelector('#a-title')), box)
    stubRect(defined(root.querySelector('g')), box)
    // A zero-height element covers the point on paper but draws nothing there.
    stubRect(defined(root.querySelector('#flat')), { left: 0, top: 50, width: 100, height: 0 })
    // Equal areas, so the deeper of the two rectangles wins before re-pointing.
    expect(anchorAtPoint(container, 50, 50, 1, 1)).toMatchObject({ tag: 'rect', id: 'inner' })
  })

  it('carries no title when the naming element has an empty one', () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = defined(parseFigureSvg('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect id="n1" width="10" height="10"><title>  </title></rect></svg>'))
    container.append(root)
    stubRect(container, { left: 0, top: 0, width: 10, height: 10 })
    stubRect(defined(root.querySelector('rect')), { left: 0, top: 0, width: 10, height: 10 })
    const anchor = anchorAtPoint(container, 5, 5, 1, 1)
    expect(anchor?.id).toBe('n1')
    expect(anchor?.title).toBeUndefined()
    expect(anchor?.text).toBeUndefined()
  })
})

describe('asking the browser what is under the pointer', () => {
  let dom: ReturnType<typeof installDom>
  beforeEach(() => { dom = installDom() })
  afterEach(() => {
    // Hit testing is written onto the document by the test that needs it, so it is
    // taken off again rather than left standing for the next spec's document.
    Reflect.deleteProperty(document, 'elementsFromPoint')
    dom.window.close()
  })

  /**
   * A container holding one figure, whose document answers hit testing from a map.
   *
   * jsdom has no `elementsFromPoint` and no layout to base one on, so the answer the
   * browser would give is written down instead. Keys are pointer positions; a point
   * absent from the map is a point over blank paper, which is what a browser reports
   * there too.
   * @param markup - the figure's own markup.
   * @param answers - what each point reports, in paint order.
   * @returns the container and the questions the document was asked.
   */
  function figureThatAnswers(markup: string, answers: Map<string, Element[]>): { container: HTMLElement, asked: string[] } {
    const container = document.createElement('div')
    document.body.append(container)
    const root = defined(parseFigureSvg(markup))
    container.append(root)
    stubRect(container, { left: 0, top: 0, width: 100, height: 100 })
    stubRect(root, { left: 0, top: 0, width: 100, height: 100 })
    const asked: string[] = []
    Object.defineProperty(document, 'elementsFromPoint', {
      configurable: true,
      value: (x: number, y: number) => {
        asked.push(`${x},${y}`)
        return answers.get(`${x},${y}`) ?? []
      },
    })
    return { container, asked }
  }

  it('names the painted element rather than the box around it', () => {
    const { container } = figureThatAnswers(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><line id="trend" x1="0" y1="0" x2="100" y2="100"/></svg>',
      new Map(),
    )
    const line = defined(container.querySelector('svg')).querySelector('#trend')
    stubRect(defined(line), { left: 0, top: 0, width: 100, height: 100 })
    // The browser says the line covers this point; measuring boxes would also have
    // said so, but the box of a sloped line covers points the line does not.
    const answers = new Map<string, Element[]>()
    for (let dx = -PICK_REACH; dx <= PICK_REACH; dx += 1) answers.set(`${50 + dx},50`, [defined(line)])
    Object.defineProperty(document, 'elementsFromPoint', {
      configurable: true,
      value: (x: number, y: number) => answers.get(`${x},${y}`) ?? [],
    })
    expect(anchorAtPoint(container, 50, 50, 1, 1)?.id).toBe('trend')
  })

  it('names the group behind an anonymous sheet rather than the sheet', () => {
    const markup = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">'
      + '<g id="figure_1"><g id="patch_1"><path d="M0 0h100v100H0z"/></g>'
      + '<g id="axes_1"><g id="patch_2"><path d="M10 10h80v80H10z"/></g></g></g></svg>'
    const { container } = figureThatAnswers(markup, new Map())
    const figure = defined(container.querySelector('#figure_1'))
    const axes = defined(container.querySelector('#axes_1'))
    const sheet = defined(container.querySelector('#patch_1'))
    const plot = defined(container.querySelector('#patch_2'))
    stubRect(figure, { left: 0, top: 0, width: 100, height: 100 })
    stubRect(axes, { left: 10, top: 10, width: 80, height: 80 })
    stubRect(sheet, { left: 0, top: 0, width: 100, height: 100 })
    stubRect(plot, { left: 10, top: 10, width: 80, height: 80 })
    const answers = new Map<string, Element[]>([
      ['5,5', [defined(sheet.querySelector('path')), sheet]],
      ['50,50', [defined(plot.querySelector('path')), plot, defined(sheet.querySelector('path')), sheet]],
    ])
    Object.defineProperty(document, 'elementsFromPoint', {
      configurable: true,
      value: (x: number, y: number) => answers.get(`${x},${y}`) ?? [],
    })
    // `patch_N` names the area behind the artists, not an artist: answering with it
    // would mean every click on blank paper says "the paper". The group it hangs under
    // is what the reader meant — here the figure's margin, there the axes.
    expect(anchorAtPoint(container, 5, 5, 1, 1)?.id).toBe('figure_1')
    expect(anchorAtPoint(container, 50, 50, 1, 1)?.id).toBe('axes_1')
  })

  it('asks about the figure without touching a single one of its properties', () => {
    const markup = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect id="r" width="100" height="100"/></svg>'
    const { container } = figureThatAnswers(markup, new Map())
    const root = defined(container.querySelector('svg'))
    const before = root.getAttribute('style')
    Object.defineProperty(document, 'elementsFromPoint', { configurable: true, value: () => [] })
    anchorAtPoint(container, 10, 10, 1, 1)
    // Handing the figure `pointer-events: all` to reach an unfilled shape also opens
    // every stroke to the pointer: measured on a real matplotlib figure, that changed
    // one sampled point in five and always for the worse, because a curve with no fill
    // began answering for the tick groups in front of it. The fill geometry is asked
    // instead, so the figure is left exactly as it was found.
    expect(root.getAttribute('style')).toBe(before)
    expect(root.style.pointerEvents).toBe('')
  })

  it('names the hollow shape the pointer is inside of', () => {
    const { container } = figureThatAnswers(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">'
      + '<ellipse id="node" fill="none" stroke="#000" cx="100" cy="100" rx="60" ry="40"/></svg>',
      new Map(),
    )
    const node = defined(container.querySelector('#node'))
    stubRect(node, { left: 40, top: 60, width: 120, height: 80 })
    // The browser reports nothing under the pointer: a shape with `fill="none"` is
    // transparent to it, which is why a hollow node's middle used to name nothing.
    Object.defineProperty(document, 'elementsFromPoint', { configurable: true, value: () => [] })
    Object.defineProperty(node, 'isPointInFill', { configurable: true, value: () => true })
    // jsdom has no matrix type; the double only has to be an invertible transform.
    const identity = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0, inverse: () => identity }
    Object.defineProperty(node, 'getScreenCTM', { configurable: true, value: () => identity })
    expect(anchorAtPoint(container, 100, 100, 1, 1)?.id).toBe('node')
  })

  it('leaves a painted shape alone even though its fill area also covers the point', () => {
    const { container } = figureThatAnswers(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">'
      + '<rect id="bar" fill="#4c6ef5" x="20" y="20" width="160" height="160"/></svg>',
      new Map(),
    )
    const bar = defined(container.querySelector('#bar'))
    stubRect(bar, { left: 20, top: 20, width: 160, height: 160 })
    Object.defineProperty(document, 'elementsFromPoint', { configurable: true, value: () => [bar] })
    // A painted shape has already been answered for by the browser. Asking its fill
    // geometry as well could only reorder an answer that is already right.
    const asked = vi.fn(() => true)
    Object.defineProperty(bar, 'isPointInFill', { configurable: true, value: asked })
    expect(anchorAtPoint(container, 100, 100, 1, 1)?.id).toBe('bar')
    expect(asked).not.toHaveBeenCalled()
  })

  it('puts a hit outside the figure back where it came from', () => {
    const { container } = figureThatAnswers(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect id="r" width="100" height="100"/></svg>',
      new Map(),
    )
    const root = defined(container.querySelector('svg'))
    // The panel's own stylesheet may have set this; the loan must not undo it.
    root.style.pointerEvents = 'none'
    Object.defineProperty(document, 'elementsFromPoint', { configurable: true, value: () => [] })
    expect(anchorAtPoint(container, 10, 10, 1, 1)).toBeUndefined()
    expect(root.style.pointerEvents).toBe('none')
  })

  it('falls back to measuring boxes when the document cannot be asked at all', () => {
    const { container } = figureThatAnswers(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect id="r" x="10" y="10" width="40" height="20"/></svg>',
      new Map(),
    )
    // No `elementsFromPoint` on the document: jsdom's own state, and the state of any
    // engine without hit testing. The boxes are the only answer available.
    Reflect.deleteProperty(document, 'elementsFromPoint')
    stubRect(defined(container.querySelector('#r')), { left: 10, top: 10, width: 40, height: 20 })
    expect(anchorAtPoint(container, 30, 20, 1, 1)?.id).toBe('r')
  })

  it('skips the figure root and anything the figure never paints', () => {
    const { container } = figureThatAnswers(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><defs><rect id="ghost" width="100" height="100"/></defs><rect id="r" x="10" y="10" width="20" height="20"/></svg>',
      new Map(),
    )
    const root = defined(container.querySelector('svg'))
    const ghost = defined(container.querySelector('#ghost'))
    const rect = defined(container.querySelector('#r'))
    stubRect(rect, { left: 10, top: 10, width: 20, height: 20 })
    Object.defineProperty(document, 'elementsFromPoint', {
      configurable: true,
      value: () => [ghost, root, rect],
    })
    // The sheet names nothing, and a declaration in `defs` is not painted there.
    expect(anchorAtPoint(container, 15, 15, 1, 1)?.id).toBe('r')
  })

  it('names a full-width painted shape, because a line can cover the whole figure too', () => {
    const { container } = figureThatAnswers(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect id="bg" width="100" height="100"/></svg>',
      new Map(),
    )
    const background = defined(container.querySelector('#bg'))
    stubRect(background, { left: 0, top: 0, width: 100, height: 100 })
    Object.defineProperty(document, 'elementsFromPoint', { configurable: true, value: () => [background] })
    // A figure cannot use the document's "covers everything, so it is the paper" rule:
    // a trend line drawn corner to corner has the whole figure for a box, so that rule
    // would refuse to name the one line the reader most likely means. A background
    // that does get named is shown by the highlight before the click.
    expect(anchorAtPoint(container, 50, 50, 1, 1)?.id).toBe('bg')
  })

  it('carries the element path a source reader can paste', () => {
    const { container } = figureThatAnswers(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><g id="axes_1"><rect id="line2d_1" width="10" height="10"/></g></svg>',
      new Map(),
    )
    const line = defined(container.querySelector('#line2d_1'))
    stubRect(line, { left: 0, top: 0, width: 10, height: 10 })
    Object.defineProperty(document, 'elementsFromPoint', { configurable: true, value: () => [line] })
    expect(anchorAtPoint(container, 5, 5, 1, 1)?.selector).toBe('#line2d_1')
  })

  it('spells a nameless element path from the figure root', () => {
    const { container } = figureThatAnswers(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><g class="n"><path d="M0 0 L10 10"/></g></svg>',
      new Map(),
    )
    const path = defined(container.querySelector('path'))
    stubRect(path, { left: 0, top: 0, width: 10, height: 10 })
    Object.defineProperty(document, 'elementsFromPoint', { configurable: true, value: () => [path] })
    // Rooted at the figure, so the same path means the same element in the reader's
    // own source file rather than in the panel's document.
    expect(anchorAtPoint(container, 5, 5, 1, 1)?.selector).toBe('svg > g:nth-of-type(1) > path:nth-of-type(1)')
  })

  it('counts a nameless element among its same-name siblings', () => {
    const { container } = figureThatAnswers(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><path d="M0 0 L4 4"/>'
      + '<path d="M4 4 L10 10"/><text x="0" y="10">hi</text></svg>',
      new Map(),
    )
    const second = defined(container.querySelectorAll('path')[1])
    stubRect(second, { left: 4, top: 4, width: 6, height: 6 })
    Object.defineProperty(document, 'elementsFromPoint', { configurable: true, value: () => [second] })
    // The position is among same-name siblings only, so the text in front of neither
    // path has any say in it.
    expect(anchorAtPoint(container, 5, 5, 1, 1)?.selector).toBe('svg > path:nth-of-type(2)')
  })

  it('refuses a hit that belongs to the panel rather than to the figure', () => {
    const { container } = figureThatAnswers(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect id="r" width="10" height="10"/></svg>',
      new Map(),
    )
    const rect = defined(container.querySelector('#r'))
    const chrome = defined(container.parentElement)
    stubRect(rect, { left: 0, top: 0, width: 10, height: 10 })
    stubRect(chrome, { left: 0, top: 0, width: 900, height: 900 })
    // The same document holds the panel's own chrome, and the overlay in front of the
    // drawing is a hit too; neither is a thing on the figure.
    Object.defineProperty(document, 'elementsFromPoint', { configurable: true, value: () => [chrome, rect] })
    expect(anchorAtPoint(container, 5, 5, 1, 1)?.id).toBe('r')
  })

  it('names nothing when the panel is the only thing under the pointer', () => {
    const { container } = figureThatAnswers(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect id="r" width="10" height="10"/></svg>',
      new Map(),
    )
    const chrome = defined(container.parentElement)
    stubRect(chrome, { left: 0, top: 0, width: 900, height: 900 })
    Object.defineProperty(document, 'elementsFromPoint', { configurable: true, value: () => [chrome] })
    // Not a fallback to the sheet: a point on the panel's own padding names nothing.
    expect(anchorAtPoint(container, 5, 5, 1, 1)).toBeUndefined()
  })
})

describe('mark placement', () => {
  it('turns a rotated mark about its own centre', () => {
    const turned: AnnotationMark = { id: 'r', kind: 'rect', color: '#000', points: [[0, 0], [10, 20]], rotation: 90 }
    expect(markTransform(turned)).toBe('rotate(90 5 10)')
  })

  it('places an upright mark with no transform at all', () => {
    expect(markTransform({ id: 'r', kind: 'rect', color: '#000', points: [[0, 0], [10, 20]] })).toBeUndefined()
    expect(markTransform({ id: 'r', kind: 'rect', color: '#000', points: [] })).toBeUndefined()
  })

  it('leaves a point mark upright, because a ring has no extent to turn', () => {
    const ring: AnnotationMark = { id: 'p', kind: 'point', color: '#000', points: [[40, 50]], rotation: 45 }
    expect(markTransform(ring)).toBeUndefined()
  })
})
