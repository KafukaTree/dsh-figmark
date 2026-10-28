// @vitest-environment jsdom
/** Naming an element, and asking a shape whether a point is inside its fill. */
import { describe, expect, it } from 'vitest'
import { coversInterior } from '../src/client/pick'
import { idStep, isStableId, selectorFor, selectorWithin } from '../src/client/dom-path'
import { defined } from './dom'

/** A parsed document from markup. */
function parse(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html')
}

/** An invertible transform, the only kind `coversInterior` can use. */
function transform(a: number, d: number, e = 0, f = 0): DOMMatrix {
  const matrix = {
    a, b: 0, c: 0, d, e, f,
    inverse: () => transform(1 / a, 1 / d, -e / a, -f / d),
  }
  return matrix as unknown as DOMMatrix
}

/**
 * A shape that answers about its own fill from a predicate.
 *
 * jsdom has no SVG geometry, so a spec that wants the fill question has to hand it the
 * answers. The predicate receives the point in the shape's own space, which is the
 * only thing the production code is responsible for getting right.
 * @param fill - the shape's `fill` attribute.
 * @param inside - whether a point in the shape's own space is inside it.
 * @param matrix - the shape's screen transform, or null for none.
 * @returns the shape element.
 */
function shapeWith(fill: string | null, inside: (x: number, y: number) => boolean, matrix: DOMMatrix | null = transform(1, 1)): SVGGraphicsElement {
  const document_ = parse(`<body><svg xmlns="http://www.w3.org/2000/svg"><ellipse id="s"/></svg></body>`)
  const shape = defined(document_.querySelector('#s')) as SVGGraphicsElement
  if (fill !== null) shape.setAttribute('fill', fill)
  Object.defineProperty(shape, 'isPointInFill', {
    configurable: true,
    value: (point: { x: number, y: number }) => inside(point.x, point.y),
  })
  Object.defineProperty(shape, 'getScreenCTM', { configurable: true, value: () => matrix })
  return shape
}

describe('asking a shape about its own fill', () => {
  it('reports a point inside an unfilled shape', () => {
    const shape = shapeWith('none', () => true)
    expect(coversInterior(shape, 10, 20)).toBe(true)
  })

  it('reports a point outside an unfilled shape', () => {
    const shape = shapeWith('none', () => false)
    expect(coversInterior(shape, 10, 20)).toBe(false)
  })

  it('treats a shape with no fill attribute as unfilled, because SVG does too', () => {
    // SVG's initial value for `fill` is black, but a shape that never sets it is
    // usually one the generator left hollow; either way the browser already answered
    // for it, so this only has to be consistent rather than clever.
    const shape = shapeWith(null, () => true)
    expect(coversInterior(shape, 0, 0)).toBe(true)
  })

  it('leaves a painted shape to the browser', () => {
    for (const fill of ['#4c6ef5', 'rgb(0, 0, 0)', 'url(#hatch)', 'currentColor']) {
      expect(coversInterior(shapeWith(fill, () => true), 0, 0)).toBe(false)
    }
  })

  it('asks nothing of an element that has no fill geometry', () => {
    const document_ = parse('<body><svg xmlns="http://www.w3.org/2000/svg"><g id="g"/></svg></body>')
    const group = defined(document_.querySelector('#g'))
    expect(coversInterior(group, 1, 1)).toBe(false)
  })

  it('asks nothing of a shape that is not in an SVG', () => {
    const document_ = parse('<body><div id="d"/></body>')
    const div = defined(document_.querySelector('#d'))
    Object.defineProperty(div, 'isPointInFill', { configurable: true, value: () => true })
    expect(coversInterior(div, 1, 1)).toBe(false)
  })

  it('asks nothing of a shape the engine gives no transform for', () => {
    const shape = shapeWith('none', () => true, null)
    // No transform means no way to turn a client point into the shape's own space, so
    // an answer would be a guess about where the point is.
    expect(coversInterior(shape, 1, 1)).toBe(false)
  })

  it('converts the point into the shape\'s own space before asking', () => {
    const seen: { x: number, y: number }[] = []
    // A shape drawn at twice the size and offset by (30, 40): client (130, 140) is its
    // own (50, 50), and getting this wrong reports a point far outside as inside.
    const shape = shapeWith('none', (x, y) => {
      seen.push({ x, y })
      return x === 50 && y === 50
    }, transform(2, 2, 30, 40))
    expect(coversInterior(shape, 130, 140)).toBe(true)
    expect(seen[0]).toEqual({ x: 50, y: 50 })
  })
})

describe('telling a name from a hash', () => {
  it('keeps the names a figure chose for its artists', () => {
    for (const id of ['figure_1', 'axes_1', 'line2d_10', 'xtick_1', 'legend_1', 'text_5', 'matplotlib.axis_1']) {
      expect(isStableId(id)).toBe(true)
    }
  })

  it('refuses the anonymous containers a figure names by position', () => {
    // `patch_N` is not a hash — it survives the next render — but it names the area
    // *behind* the artists (the figure's sheet, the axes' background), so a path that
    // stopped on one would answer a click on blank paper with "the paper".
    for (const id of ['patch_1', 'patch_2', 'patch_10']) expect(isStableId(id)).toBe(false)
  })

  it('refuses the ids a figure minted for this one render', () => {
    // matplotlib's `_make_id` is sha256(svg.hashsalt + content)[:10] with a fresh salt
    // per run, so these differ every time the same script is drawn.
    for (const id of ['m4750a7a074', 'p8305ee768d', 'a1b2c3d4e5f6', '0123456789ab', 'mdeadbeef01']) {
      expect(isStableId(id)).toBe(false)
    }
  })

  it('refuses the ids a framework mints per mount', () => {
    for (const id of ['ember1234', 'ext-gen42', 'yui_3_18_1', 'react-7', 'radix-xyz1', 'rc-tabs-2', 'el-9', 'ant-btn-3', 'sc-bdVaJa1', 'css-1a2b3c', 'jsx-42', ':r1:', ':Ra9:']) {
      expect(isStableId(id)).toBe(false)
    }
  })

  it('refuses an empty id, because there is nothing to name', () => {
    expect(isStableId('')).toBe(false)
  })

  it('keeps an id with a dot in it, which is what matplotlib actually emits', () => {
    expect(isStableId('matplotlib.axes._axes.Axes')).toBe(true)
  })
})

describe('spelling an id so it can be pasted', () => {
  it('escapes the characters an id cannot carry unescaped', () => {
    // `#matplotlib.axis_1` reads as "the element with id matplotlib, class axis_1".
    expect(idStep('matplotlib.axis_1')).toBe('#matplotlib\\.axis_1')
    expect(idStep('a b')).toBe('#a\\ b')
  })

  it('leaves a plain id alone', () => {
    expect(idStep('axes_1')).toBe('#axes_1')
    expect(idStep('figure_1')).toBe('#figure_1')
  })

  it('asks the engine to escape when it can', () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'CSS')
    // jsdom has no `CSS` namespace at all, so the browser path has to be leant one.
    const asked: string[] = []
    Object.defineProperty(globalThis, 'CSS', {
      configurable: true,
      value: { escape: (id: string) => { asked.push(id); return `escaped-${id}` } },
    })
    try {
      expect(idStep('matplotlib.axis_1')).toBe('#escaped-matplotlib.axis_1')
      expect(asked).toEqual(['matplotlib.axis_1'])
    } finally {
      if (original === undefined) Reflect.deleteProperty(globalThis, 'CSS')
      else Object.defineProperty(globalThis, 'CSS', original)
    }
  })

  it('escapes by hand when the engine has a CSS object without an escape', () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'CSS')
    // An older engine: the namespace exists, the helper inside it does not.
    Object.defineProperty(globalThis, 'CSS', { configurable: true, value: {} })
    try {
      expect(idStep('matplotlib.axes._axes.Axes')).toBe('#matplotlib\\.axes\\._axes\\.Axes')
    } finally {
      if (original === undefined) Reflect.deleteProperty(globalThis, 'CSS')
      else Object.defineProperty(globalThis, 'CSS', original)
    }
  })

  it('escapes by hand when the engine has no CSS.escape', () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'CSS')
    // A browser without `CSS.escape` still has to get a usable path out of this.
    Object.defineProperty(globalThis, 'CSS', { configurable: true, value: undefined })
    try {
      expect(idStep('matplotlib.axis_1')).toBe('#matplotlib\\.axis_1')
    } finally {
      if (original === undefined) Reflect.deleteProperty(globalThis, 'CSS')
      else Object.defineProperty(globalThis, 'CSS', original)
    }
  })
})

describe('walking past a hash to a path that still resolves', () => {
  it('does not stop on a generated id, and ends on the stable one above it', () => {
    const document_ = parse(
      '<body><svg xmlns="http://www.w3.org/2000/svg"><g id="axes_1">'
      + '<g id="m4750a7a074"><path/></g></g></svg></body>',
    )
    const path = defined(document_.querySelector('path'))
    const svg = defined(document_.querySelector('svg'))
    // The hash is walked past; the stable id above it ends the path.
    expect(selectorWithin(path, svg)).toBe('#axes_1 > g:nth-of-type(1) > path:nth-of-type(1)')
  })

  it('walks all the way past a generated id when nothing above it has one', () => {
    const document_ = parse('<body><svg xmlns="http://www.w3.org/2000/svg"><g id="m4750a7a074"><path/></g></svg></body>')
    const path = defined(document_.querySelector('path'))
    const svg = defined(document_.querySelector('svg'))
    expect(selectorWithin(path, svg)).toBe('svg > g:nth-of-type(1) > path:nth-of-type(1)')
  })

  it('walks past a generated id in a document too', () => {
    const document_ = parse('<body><div id="m4750a7a074"><p>hi</p></div></body>')
    expect(selectorFor(defined(document_.querySelector('p')), defined(document_.body)))
      .toBe('body > div:nth-of-type(1) > p:nth-of-type(1)')
  })
})
