// @vitest-environment jsdom
/** The drawing surface: pointer input becomes marks in figure coordinates. */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AnnotationMark, FigurePoint, MarkAnchor } from '../src/shared/annotation'
import { HANDLE_SIZE } from '../src/client/handles'
import { Canvas, nextMarkId, type MarkPatch, type Tool } from '../src/client/Canvas'
import { defined, stubRect } from './dom'

/** Options one mounted surface is built from. */
interface MountOptions {
  readonly tool: Tool
  readonly marks?: readonly AnnotationMark[]
  readonly anchoring?: boolean
  readonly anchorAtFigurePoint?: (x: number, y: number) => MarkAnchor | undefined
  readonly selectedId?: string | null
  readonly container?: HTMLElement | null
  readonly svgSize?: { readonly width: number; readonly height: number }
  readonly onAdd?: (mark: AnnotationMark) => void
  readonly onMove?: (id: string, points: readonly FigurePoint[], anchor: MarkAnchor | undefined) => void
  readonly onUpdate?: (id: string, patch: MarkPatch) => void
  readonly onSelect?: (id: string | null) => void
  readonly onRemove?: (id: string) => void
  readonly onEdit?: (id: string) => void
  readonly onDrawn?: (id: string) => void
  readonly onHover?: (anchor: MarkAnchor | undefined) => void
  readonly numbering?: ReadonlyMap<string, number>
  readonly onPan?: (dx: number, dy: number) => void
  readonly onPanStart?: () => void
  readonly onPanEnd?: () => void
  readonly scale?: number
  readonly origin?: FigurePoint
  readonly width?: number
  readonly height?: number
  readonly figureSize?: { readonly width: number; readonly height: number }
}

/** Render the surface over a stubbed viewport. */
function mount(options: MountOptions): {
  readonly host: HTMLElement
  readonly root: Root
  readonly svg: SVGSVGElement
  readonly figure: HTMLElement
} {
  const host = document.createElement('div')
  const figure = document.createElement('div')
  document.body.append(host)
  host.append(figure)
  const root = createRoot(host)
  const size = options.svgSize ?? { width: 400, height: 300 }
  const containerRef = { current: options.container === undefined ? figure : options.container }
  act(() => {
    root.render(
      <Canvas
        {...(options.numbering === undefined ? {} : { numbering: options.numbering })}
        {...(options.origin === undefined ? {} : { origin: options.origin })}
        width={options.width ?? 400}
        height={options.height ?? 300}
        {...(options.figureSize === undefined ? {} : { figureSize: options.figureSize })}
        marks={options.marks ?? []}
        tool={options.tool}
        color="#e03131"
        containerRef={containerRef}
        anchoring={options.anchoring ?? false}
        {...(options.anchorAtFigurePoint === undefined ? {} : { anchorAtFigurePoint: options.anchorAtFigurePoint })}
        selectedId={options.selectedId ?? null}
        onSelect={options.onSelect ?? (() => {})}
        onAdd={options.onAdd ?? (() => {})}
        onMove={options.onMove ?? (() => {})}
        onUpdate={options.onUpdate ?? (() => {})}
        onRemove={options.onRemove ?? (() => {})}
        onEdit={options.onEdit ?? (() => {})}
        onDrawn={options.onDrawn}
        {...(options.onHover === undefined ? {} : { onHover: options.onHover })}
        {...(options.onPan === undefined ? {} : { onPan: options.onPan })}
        {...(options.onPanStart === undefined ? {} : { onPanStart: options.onPanStart })}
        {...(options.onPanEnd === undefined ? {} : { onPanEnd: options.onPanEnd })}
        {...(options.scale === undefined ? {} : { scale: options.scale })}
      />,
    )
  })
  const svg = host.querySelector('svg') as SVGSVGElement
  stubRect(svg, { left: 0, top: 0, ...size })
  return { host, root, svg, figure }
}

/** Dispatch one pointer event React's synthetic listeners observe. */
function pointer(target: Element, type: string, clientX: number, clientY: number): void {
  act(() => {
    target.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX, clientY }))
  })
}

/** Dispatch one pointer event that carries a pointer id. */
function pointerWithId(target: Element, type: string, clientX: number, clientY: number, pointerId: number): void {
  act(() => {
    const event = new MouseEvent(type, { bubbles: true, clientX, clientY })
    Object.defineProperty(event, 'pointerId', { value: pointerId })
    target.dispatchEvent(event)
  })
}

/** Dispatch one double click. */
function doubleClick(target: Element): void {
  act(() => { target.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })) })
}

/** Give the surface the pointer-capture methods jsdom does not implement. */
function stubPointerCapture(svg: SVGSVGElement, captured: boolean): { readonly released: number[] } {
  const released: number[] = []
  Object.defineProperty(svg, 'setPointerCapture', { configurable: true, value: () => {} })
  Object.defineProperty(svg, 'hasPointerCapture', { configurable: true, value: () => captured })
  Object.defineProperty(svg, 'releasePointerCapture', { configurable: true, value: (id: number) => { released.push(id) } })
  return { released }
}

describe('drawing surface', () => {
  let mounted: ReturnType<typeof mount> | undefined
  afterEach(() => {
    mounted?.root.unmount()
    mounted = undefined
    document.body.innerHTML = ''
  })

  it('commits an arrow between the press and release points', () => {
    const onAdd = vi.fn()
    const onSelect = vi.fn()
    mounted = mount({ tool: 'arrow', onAdd, onSelect })
    pointer(mounted.svg, 'pointerdown', 300, 225)
    pointer(mounted.svg, 'pointermove', 100, 66)
    pointer(mounted.svg, 'pointerup', 100, 66)
    expect(onAdd).toHaveBeenCalledTimes(1)
    const mark = onAdd.mock.calls[0]?.[0] as AnnotationMark
    expect(mark.kind).toBe('arrow')
    expect(mark.points).toEqual([[300, 225], [100, 66]])
    expect(mark.color).toBe('#e03131')
    expect(onSelect).toHaveBeenCalledWith(mark.id)
  })

  it('drops a press-and-release with no travel', () => {
    const onAdd = vi.fn()
    mounted = mount({ tool: 'rect', onAdd })
    pointer(mounted.svg, 'pointerdown', 100, 100)
    pointer(mounted.svg, 'pointerup', 101, 101)
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('collects freehand samples and ignores jitter below the sampling step', () => {
    const onAdd = vi.fn()
    mounted = mount({ tool: 'pen', onAdd })
    pointer(mounted.svg, 'pointerdown', 0, 0)
    pointer(mounted.svg, 'pointermove', 1, 1)
    pointer(mounted.svg, 'pointermove', 40, 40)
    pointer(mounted.svg, 'pointerup', 40, 40)
    const mark = onAdd.mock.calls[0]?.[0] as AnnotationMark
    expect(mark.points).toEqual([[0, 0], [40, 40]])
  })

  it('drops a freehand press that never moved', () => {
    const onAdd = vi.fn()
    mounted = mount({ tool: 'pen', onAdd })
    pointer(mounted.svg, 'pointerdown', 10, 10)
    pointer(mounted.svg, 'pointerup', 10, 10)
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('creates and selects a point mark on click', () => {
    const onAdd = vi.fn()
    const onSelect = vi.fn()
    mounted = mount({ tool: 'point', onAdd, onSelect })
    pointer(mounted.svg, 'pointerdown', 200, 150)
    expect(onAdd).toHaveBeenCalledTimes(1)
    const added = defined(onAdd.mock.calls[0]?.[0] as AnnotationMark | undefined)
    expect(added.kind).toBe('point')
    // The press is the whole geometry: one coordinate, no drag to define an extent.
    expect(added.points).toEqual([[200, 150]])
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('draws nothing in select mode', () => {
    const onAdd = vi.fn()
    mounted = mount({ tool: 'select', onAdd })
    pointer(mounted.svg, 'pointerdown', 10, 10)
    pointer(mounted.svg, 'pointerup', 200, 200)
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('renders stored marks and selects one when it is clicked', () => {
    const onSelect = vi.fn()
    mounted = mount({
      tool: 'select',
      onSelect,
      marks: [{ id: 'm1', kind: 'rect', color: '#1971c2', points: [[10, 10], [100, 80]] }],
    })
    const paths = mounted.svg.querySelectorAll('path')
    expect(paths.length).toBeGreaterThanOrEqual(3)
    pointer(paths[2] as Element, 'pointerdown', 20, 20)
    expect(onSelect).toHaveBeenCalledWith('m1')
  })

  it('clears the selection when the surface itself is clicked in select mode', () => {
    const onSelect = vi.fn()
    mounted = mount({ tool: 'select', onSelect, marks: [{ id: 'm1', kind: 'pen', color: '#000', points: [[0, 0], [5, 5]] }] })
    act(() => { mounted?.svg.dispatchEvent(new MouseEvent('click', { bubbles: true })) })
    expect(onSelect).toHaveBeenCalledWith(null)
  })

  it('announces a placed point as drawn, so the tool can disarm itself', () => {
    const onDrawn = vi.fn()
    const onAdd = vi.fn()
    mounted = mount({ tool: 'point', onAdd, onDrawn })
    pointer(mounted.svg, 'pointerdown', 40, 60)
    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(onDrawn).toHaveBeenCalledWith((onAdd.mock.calls[0] as [AnnotationMark])[0].id)
  })

  it('announces a finished drag as drawn, once it is committed', () => {
    const onDrawn = vi.fn()
    const onAdd = vi.fn()
    mounted = mount({ tool: 'rect', onAdd, onDrawn })
    pointer(mounted.svg, 'pointerdown', 20, 20)
    pointer(mounted.svg, 'pointermove', 120, 90)
    pointer(mounted.svg, 'pointerup', 120, 90)
    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(onDrawn).toHaveBeenCalledTimes(1)
    expect(onDrawn).toHaveBeenCalledWith((onAdd.mock.calls[0] as [AnnotationMark])[0].id)
  })

  it('picks a mark out for editing when its hit area is double-clicked', () => {
    const onEdit = vi.fn()
    mounted = mount({ tool: 'select', onEdit, marks: [{ id: 'm1', kind: 'pen', color: '#000', points: [[0, 0], [5, 5]] }] })
    const hit = mounted.svg.querySelector('path[stroke="transparent"]')
    expect(hit).not.toBeNull()
    doubleClick(defined(hit))
    expect(onEdit).toHaveBeenCalledWith('m1')
  })

  it('picks a point mark out for editing through its own pin', () => {
    // A point mark has no stroke, so its pin carries the hit area and the double
    // click itself rather than inheriting the one drawn along a path.
    const onEdit = vi.fn()
    const dot: AnnotationMark = { id: 't1', kind: 'point', color: '#e03131', points: [[100, 100]], detail: '这里' }
    mounted = mount({ tool: 'select', onEdit, marks: [dot] })
    doubleClick(defined(mounted.svg.querySelector('path[fill="transparent"]')))
    expect(onEdit).toHaveBeenCalledWith('t1')
  })

  it('draws a point mark as a pin standing on its coordinate, framed without handles', () => {
    mounted = mount({
      tool: 'select',
      selectedId: 'm1',
      marks: [{ id: 'm1', kind: 'point', color: '#e03131', points: [[40, 60]], detail: '图号应在正下方' }],
    })
    // The mark is a filled pin whose path starts at the coordinate it names.
    const pin = defined(mounted.svg.querySelector('path[fill="#e03131"]'))
    expect(pin.getAttribute('d')?.startsWith('M 40 60')).toBe(true)
    // Its number rides inside the pin, white on the mark's own colour, so the one
    // place a point mark can be labelled is the place it is already pointing at.
    const number = defined(mounted.svg.querySelector('text'))
    expect(number.textContent).toBe('1')
    expect(number.getAttribute('fill')).toBe('#ffffff')
    // It is selected, but has no extent to resize: a dashed box, not handles.
    expect(mounted.svg.querySelectorAll('rect[data-da-handle]')).toHaveLength(0)
    expect(mounted.svg.querySelector('rect[stroke="#4c8dff"]')).not.toBeNull()
    // And nothing draws the sentence on the figure — the only lettering is the number.
    expect(mounted.svg.querySelectorAll('text')).toHaveLength(1)
  })

  it('frames a selected stroke mark with its handles', () => {
    mounted = mount({
      tool: 'select',
      selectedId: 'm1',
      marks: [{ id: 'm1', kind: 'rect', color: '#1971c2', points: [[10, 10], [100, 80]] }],
    })
    // Eight box handles plus the rotation handle above the top edge.
    expect(mounted.svg.querySelectorAll('rect[data-da-handle]')).toHaveLength(9)
  })

  it('draws no frame when nothing is selected', () => {
    mounted = mount({
      tool: 'select',
      marks: [{ id: 'm1', kind: 'rect', color: '#1971c2', points: [[10, 10], [100, 80]] }],
    })
    expect(mounted.svg.querySelectorAll('rect[data-da-handle]')).toHaveLength(0)
  })

  it('shows the mark being drawn without its hit area', () => {
    mounted = mount({ tool: 'rect' })
    pointer(mounted.svg, 'pointerdown', 20, 20)
    pointer(mounted.svg, 'pointermove', 120, 90)
    const group = mounted.svg.querySelector('g[opacity="0.75"]')
    expect(group).not.toBeNull()
    expect(group?.querySelector('path[stroke="transparent"]')).toBeNull()
  })

  it('ignores a move that started no drag', () => {
    const onAdd = vi.fn()
    mounted = mount({ tool: 'rect', onAdd })
    pointer(mounted.svg, 'pointermove', 50, 50)
    pointer(mounted.svg, 'pointerup', 50, 50)
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('captures and releases the pointer around a drag', () => {
    const onAdd = vi.fn()
    mounted = mount({ tool: 'rect', onAdd })
    const capture = stubPointerCapture(mounted.svg, true)
    pointerWithId(mounted.svg, 'pointerdown', 10, 10, 7)
    pointerWithId(mounted.svg, 'pointermove', 90, 90, 7)
    pointerWithId(mounted.svg, 'pointerup', 90, 90, 7)
    expect(capture.released).toEqual([7])
    expect(onAdd).toHaveBeenCalledTimes(1)
  })

  it('leaves an uncaptured pointer alone', () => {
    const onAdd = vi.fn()
    mounted = mount({ tool: 'rect', onAdd })
    const capture = stubPointerCapture(mounted.svg, false)
    pointerWithId(mounted.svg, 'pointerdown', 10, 10, 3)
    pointerWithId(mounted.svg, 'pointermove', 90, 90, 3)
    pointerWithId(mounted.svg, 'pointerup', 90, 90, 3)
    expect(capture.released).toEqual([])
    expect(onAdd).toHaveBeenCalledTimes(1)
  })

  it('finishes on a cancelled pointer too', () => {
    const onAdd = vi.fn()
    mounted = mount({ tool: 'rect', onAdd })
    pointer(mounted.svg, 'pointerdown', 10, 10)
    pointer(mounted.svg, 'pointermove', 90, 90)
    pointer(mounted.svg, 'pointercancel', 90, 90)
    expect(onAdd).toHaveBeenCalledTimes(1)
  })

  it('reports no anchor when the figure is not inlined SVG', () => {
    // An arrow, because it is a kind that would carry an anchor: a box never asks
    // for one now, so a box here would pass whether the guard worked or not.
    const onAdd = vi.fn()
    mounted = mount({ tool: 'arrow', anchoring: false, onAdd })
    pointer(mounted.svg, 'pointerdown', 10, 10)
    pointer(mounted.svg, 'pointermove', 90, 90)
    pointer(mounted.svg, 'pointerup', 90, 90)
    expect(defined(onAdd.mock.calls[0]?.[0] as AnnotationMark | undefined).anchor).toBeUndefined()
  })

  it('reports no anchor when there is no figure container to hit-test', () => {
    const onAdd = vi.fn()
    mounted = mount({ tool: 'arrow', anchoring: true, container: null, onAdd })
    pointer(mounted.svg, 'pointerdown', 10, 10)
    pointer(mounted.svg, 'pointermove', 90, 90)
    pointer(mounted.svg, 'pointerup', 90, 90)
    expect(defined(onAdd.mock.calls[0]?.[0] as AnnotationMark | undefined).anchor).toBeUndefined()
  })

  it('keeps coordinates finite when the surface reports no area', () => {
    const onAdd = vi.fn()
    mounted = mount({ tool: 'arrow', anchoring: true, svgSize: { width: 0, height: 0 }, onAdd })
    pointer(mounted.svg, 'pointerdown', 10, 10)
    pointer(mounted.svg, 'pointermove', 90, 90)
    pointer(mounted.svg, 'pointerup', 90, 90)
    const mark = defined(onAdd.mock.calls[0]?.[0] as AnnotationMark | undefined)
    expect(mark.anchor).toBeUndefined()
    for (const point of mark.points) expect(point.every(Number.isFinite), String(point)).toBe(true)
  })

  it('anchors a point mark to the element under the click', () => {
    // A point mark is placed by one click, so its anchor comes from that click —
    // there is no release point to read instead.
    const onAdd = vi.fn()
    mounted = mount({ tool: 'point', anchoring: true, onAdd })
    const inline = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const node = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    node.setAttribute('id', 'node7')
    inline.append(node)
    mounted.figure.append(inline)
    stubRect(mounted.figure, { left: 0, top: 0, width: 400, height: 300 })
    stubRect(node, { left: 10, top: 10, width: 40, height: 20 })
    pointer(mounted.svg, 'pointerdown', 20, 15)
    expect(defined(onAdd.mock.calls[0]?.[0] as AnnotationMark | undefined).anchor)
      .toMatchObject({ tag: 'g', id: 'node7' })
  })

  it('anchors a finished arrow to the figure element under its tip', () => {
    // An arrow points at something, so its anchor names the element its tip landed
    // on — that name is what the agent resolves to find the thing the reader meant.
    const onAdd = vi.fn()
    mounted = mount({ tool: 'arrow', anchoring: true, onAdd })
    const inline = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const anchor = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    anchor.setAttribute('id', 'node102')
    inline.append(anchor)
    mounted.figure.append(inline)
    stubRect(mounted.figure, { left: 0, top: 0, width: 400, height: 300 })
    stubRect(anchor, { left: 10, top: 10, width: 40, height: 20 })
    pointer(mounted.svg, 'pointerdown', 20, 15)
    pointer(mounted.svg, 'pointermove', 25, 18)
    pointer(mounted.svg, 'pointerup', 30, 20)
    expect(defined(onAdd.mock.calls[0]?.[0] as AnnotationMark | undefined).anchor).toMatchObject({ tag: 'g', id: 'node102' })
  })

  it('gives a region no anchor, because a region points at no one thing', () => {
    // A box says "look in here": its last corner is where the hand stopped, not what
    // the reader aimed at. Carrying the element under that corner sent the agent a
    // name the reader never asked about — `① 框选 (114,89)-(260,189)（id=axes_1 …）`
    // for a box drawn over three curves.
    for (const tool of ['rect', 'ellipse'] as const) {
      const onAdd = vi.fn()
      mounted = mount({ tool, anchoring: true, onAdd })
      const inline = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      const under = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      under.setAttribute('id', 'node102')
      inline.append(under)
      mounted.figure.append(inline)
      stubRect(mounted.figure, { left: 0, top: 0, width: 400, height: 300 })
      stubRect(under, { left: 10, top: 10, width: 40, height: 20 })
      pointer(mounted.svg, 'pointerdown', 20, 15)
      pointer(mounted.svg, 'pointermove', 25, 18)
      pointer(mounted.svg, 'pointerup', 30, 20)
      expect(defined(onAdd.mock.calls[0]?.[0] as AnnotationMark | undefined).anchor).toBeUndefined()
      mounted.root.unmount()
    }
  })

  it('mints ids that do not repeat inside one session', () => {
    const first = nextMarkId()
    expect(nextMarkId()).not.toBe(first)
  })
})

describe('moving the whole view by hand', () => {
  it('reports the drag as the surface is pushed, and takes no capture for itself', () => {
    // The panel owns the scrollport, so the overlay hands its drags over rather than
    // scrolling anything itself: what it reports is a distance in client pixels.
    const moved: [number, number][] = []
    let starts = 0
    let ends = 0
    const { svg } = mount({
      tool: 'select',
      onPan: (dx, dy) => { moved.push([dx, dy]) },
      onPanStart: () => { starts += 1 },
      onPanEnd: () => { ends += 1 },
    })
    pointer(svg, 'pointerdown', 10, 10)
    pointer(svg, 'pointermove', 30, 25)
    pointer(svg, 'pointermove', 45, 40)
    pointer(svg, 'pointerup', 45, 40)
    // Each move reports the step it travelled, not the distance from the start, so
    // the panel can add them one frame at a time.
    expect(moved).toEqual([[20, 15], [15, 15]])
    expect(starts).toBe(1)
    expect(ends).toBe(1)
  })

  it('reports nothing at all when the pointer never left the spot it went down on', () => {
    const moved: [number, number][] = []
    const { svg } = mount({ tool: 'select', onPan: (dx, dy) => { moved.push([dx, dy]) } })
    pointer(svg, 'pointerdown', 10, 10)
    pointer(svg, 'pointermove', 10, 10)
    pointer(svg, 'pointerup', 10, 10)
    expect(moved).toEqual([])
  })

  it('leaves the surface alone when nobody asked for drags', () => {
    // A surface embedded in something that scrolls itself has no hand-off to give;
    // a drag under `select` then does nothing at all rather than half panning.
    const added: AnnotationMark[] = []
    const { svg } = mount({ tool: 'select', onAdd: (mark) => { added.push(mark) } })
    pointer(svg, 'pointerdown', 10, 10)
    pointer(svg, 'pointermove', 40, 40)
    pointer(svg, 'pointerup', 40, 40)
    expect(added).toEqual([])
  })
})

describe('clicking the surface', () => {
  it('leaves a mark selected when the click lands on it', () => {
    // The click that ends a drag on a mark arrives after the pointer events, and it
    // is the same click the reader will drag again with — so it must not be read as
    // a click on nothing.
    const selected: (string | null)[] = []
    const { svg } = mount({
      tool: 'select',
      marks: [{ id: 'm1', kind: 'arrow', color: '#e03131', points: [[10, 10], [40, 30]] }],
      onSelect: (id) => { selected.push(id) },
    })
    const hit = svg.querySelector('path[stroke="transparent"]') as SVGPathElement
    act(() => {
      hit.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(selected).toEqual([])
  })

  it('lets go of the selection when the click lands on nothing', () => {
    const selected: (string | null)[] = []
    const { svg } = mount({
      tool: 'select',
      selectedId: 'm1',
      marks: [{ id: 'm1', kind: 'arrow', color: '#e03131', points: [[10, 10], [40, 30]] }],
      onSelect: (id) => { selected.push(id) },
    })
    act(() => {
      svg.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(selected).toEqual([null])
  })
})

describe('picking an element', () => {
  let mounted: ReturnType<typeof mount> | undefined
  afterEach(() => {
    mounted?.root.unmount()
    mounted = undefined
    document.body.innerHTML = ''
  })

  /** The element a click on the figure would name. */
  const anchor: MarkAnchor = {
    tag: 'line',
    id: 'line2d_10',
    title: 'growth',
    bbox: [40, 30, 120, 60],
    selector: '#line2d_10',
  }

  /** A surface that names `anchor` for every point on the figure. */
  function picking(options: { readonly anchor?: MarkAnchor | undefined } = {}): ReturnType<typeof mount> & { readonly added: AnnotationMark[], readonly drawn: string[], readonly hovered: (MarkAnchor | undefined)[] } {
    const added: AnnotationMark[] = []
    const drawn: string[] = []
    const hovered: (MarkAnchor | undefined)[] = []
    const picked = mount({
      tool: 'element',
      anchoring: true,
      anchorAtFigurePoint: () => ('anchor' in options ? options.anchor : anchor),
      onAdd: mark => added.push(mark),
      onDrawn: id => drawn.push(id),
      onHover: anchor => hovered.push(anchor),
    })
    return { ...picked, added, drawn, hovered }
  }

  /** A surface naming an element from its own document, the way HTML does. */
  function mountPicking(
    anchorAtFigurePoint: (x: number, y: number) => MarkAnchor | undefined,
    onHover?: (anchor: MarkAnchor | undefined) => void,
  ): ReturnType<typeof mount> {
    return mount({
      tool: 'element',
      anchoring: false,
      anchorAtFigurePoint,
      ...(onHover === undefined ? {} : { onHover }),
    })
  }

  /** What the last thing the picker reported was, for a surface that reports names. */
  function lastHovered(hovered: readonly (MarkAnchor | undefined)[]): MarkAnchor | undefined {
    return hovered[hovered.length - 1]
  }

  it('turns the element under the pointer into a mark carrying its name', () => {
    const surface = picking()
    mounted = surface
    pointer(surface.svg, 'pointerdown', 60, 50)
    expect(surface.added).toHaveLength(1)
    const mark = defined(surface.added[0])
    expect(mark.kind).toBe('element')
    // The geometry is the element's own box as two corners, so everything that reads
    // a rect reads this mark for free.
    expect(mark.points).toEqual([[40, 30], [160, 90]])
    expect(mark.anchor).toEqual(anchor)
    // And no weight: the mark draws no stroke and no pin, so there is nothing for a
    // pen weight to size. Carrying one would put a number in the file that changes
    // nothing, and would grow the measured outline by half a stroke never painted.
    expect(mark.weight).toBeUndefined()
    expect(surface.drawn).toEqual([mark.id])
  })

  it('selects what it just picked, so its note box can open on it', () => {
    const onSelect = vi.fn()
    const added: AnnotationMark[] = []
    const surface = mount({
      tool: 'element',
      anchoring: true,
      anchorAtFigurePoint: () => anchor,
      onAdd: mark => added.push(mark),
      onSelect,
    })
    mounted = surface
    pointer(surface.svg, 'pointerdown', 60, 50)
    expect(onSelect).toHaveBeenCalledWith(defined(added[0]).id)
  })

  it('commits nothing when the pointer names no element', () => {
    const surface = picking({ anchor: undefined })
    mounted = surface
    // A mark with no element would be a box claiming to name a thing.
    pointer(surface.svg, 'pointerdown', 60, 50)
    expect(surface.added).toHaveLength(0)
  })

  it('tells the figure which element a click would take', () => {
    const surface = picking()
    mounted = surface
    pointer(surface.svg, 'pointermove', 60, 50)
    // Which element, not where to draw a box around it: the light belongs on the
    // element itself, and only the body knows which document that element lives in.
    expect(lastHovered(surface.hovered)).toEqual(anchor)
    // The overlay draws no highlight of its own any more — a bracket round the box was
    // a rectangle the figure never draws.
    expect(surface.svg.querySelector('path[stroke="#4c8dff"]')).toBeNull()
  })

  it('leaves the light alone when the pointer stays on the same element', () => {
    const anchorAtFigurePoint = vi.fn(() => anchor)
    const surface = mountPicking(anchorAtFigurePoint)
    mounted = surface
    pointer(surface.svg, 'pointermove', 60, 50)
    const first = surface.svg.querySelector('path[stroke="#4c8dff"]')
    pointer(surface.svg, 'pointermove', 62, 52)
    // A stream of moves across one element must not re-render the whole overlay, so
    // the same name and the same box leave the highlight exactly as it was.
    expect(surface.svg.querySelector('path[stroke="#4c8dff"]')).toBe(first)
    expect(anchorAtFigurePoint).toHaveBeenCalledTimes(2)
  })

  it('drops the light when the pointer leaves the surface', () => {
    const surface = picking()
    mounted = surface
    pointer(surface.svg, 'pointermove', 60, 50)
    expect(lastHovered(surface.hovered)).toEqual(anchor)
    // React derives `pointerleave` from a `pointerout` that leaves the element, which
    // is the event a browser actually sends when the pointer goes off the surface.
    act(() => {
      surface.svg.dispatchEvent(new MouseEvent('pointerout', { bubbles: true, relatedTarget: document.body }))
    })

    // With no element under the pointer there is nothing a click would take.
    expect(lastHovered(surface.hovered)).toBeUndefined()
  })

  it('puts the light out when the picker is put away', () => {
    const hovered: (MarkAnchor | undefined)[] = []
    const surface = mount({
      tool: 'element',
      anchoring: true,
      anchorAtFigurePoint: () => anchor,
      onHover: hover => hovered.push(hover),
    })
    mounted = surface
    pointer(surface.svg, 'pointermove', 60, 50)
    expect(lastHovered(hovered)).toEqual(anchor)
    // A disarm with no pointer move to report it: the reader left the figure with the
    // picker armed, so nothing arrives to clear the light.
    act(() => {
      surface.root.render(
        <Canvas
          width={400} height={300} marks={[]} tool="select" color="#e03131"
          containerRef={{ current: null }} anchoring={false} selectedId={null}
          onSelect={() => {}} onAdd={() => {}} onMove={() => {}} onUpdate={() => {}}
          onRemove={() => {}} onEdit={() => {}} onHover={hover => hovered.push(hover)}
        />,
      )
    })
    expect(lastHovered(hovered)).toBeUndefined()
  })

  it('moves the light to a different element, and away when nothing is under it', () => {
    let lit: MarkAnchor | undefined = anchor
    const hovered: (MarkAnchor | undefined)[] = []
    const surface = mountPicking(() => lit, hover => hovered.push(hover))
    mounted = surface
    pointer(surface.svg, 'pointermove', 60, 50)
    expect(lastHovered(hovered)).toEqual(anchor)
    // Another element under the pointer is a different promise, so the light follows.
    const other: MarkAnchor = { ...anchor, id: 'line2d_11', selector: '#line2d_11' }
    lit = other
    pointer(surface.svg, 'pointermove', 200, 200)
    expect(lastHovered(hovered)).toEqual(other)
    // And a point that names nothing takes the light away rather than leaving the last
    // element lit.
    lit = undefined
    pointer(surface.svg, 'pointermove', 300, 250)
    expect(lastHovered(hovered)).toBeUndefined()
  })

  it('re-reports the same element when it is reflowed under the pointer', () => {
    let lit: MarkAnchor = anchor
    const hovered: (MarkAnchor | undefined)[] = []
    const surface = mountPicking(() => lit, hover => hovered.push(hover))
    mounted = surface
    pointer(surface.svg, 'pointermove', 60, 50)
    // The same element re-read at a new box is still news: the name did not change, but
    // what a click would take now covers a different area.
    const reflowed: MarkAnchor = { ...anchor, bbox: [50, 40, 120, 60] }
    lit = reflowed
    pointer(surface.svg, 'pointermove', 62, 52)
    expect(lastHovered(hovered)).toEqual(reflowed)
  })

  it('cannot be dragged once it is placed', () => {
    const onMove = vi.fn()
    const placed: AnnotationMark = { id: 'e1', kind: 'element', color: '#1971c2', points: [[40, 30], [160, 90]], anchor }
    // A press finds the mark by asking the figure what is under the pointer, so the
    // double has to answer with the element the mark names.
    const surface = mount({ tool: 'select', marks: [placed], selectedId: 'e1', onMove, anchoring: false, anchorAtFigurePoint: () => anchor })
    mounted = surface
    pointer(surface.svg, 'pointerdown', 60, 50)
    pointer(surface.svg, 'pointermove', 90, 80)
    pointer(surface.svg, 'pointerup', 90, 80)
    // Its box is where the element was; moving it would leave a mark naming an
    // element while pointing somewhere else. Picking it again is how it is placed.
    expect(onMove).not.toHaveBeenCalled()
  })

  it('opens a placed element for editing by pressing what it names', () => {
    // An element mark draws nothing, so it has no shape to press. It is found by
    // asking the figure what is under the pointer — the same question the picker
    // asks — which is why the target and the light agree.
    const onEdit = vi.fn()
    mounted = mount({
      tool: 'select', onEdit, anchoring: false, anchorAtFigurePoint: () => anchor,
      marks: [{ id: 'e1', kind: 'element', color: '#1971c2', points: [[40, 30], [160, 90]], anchor }],
    })
    doubleClick(defined(mounted.svg.querySelector('[data-da-mark]')))
    expect(onEdit).toHaveBeenCalledWith('e1')
  })

  it('keeps a placed element selected after the click that ends the press', () => {
    // The press lands on the overlay, because the mark paints nothing. The browser
    // then dispatches a `click` on that same overlay, and the surface reads a plain
    // click as "the reader pressed the paper" — so the gesture that selects a placed
    // element must say its trailing click is already spent. Without that, selecting
    // and deselecting happened in one movement and the comment pill never opened.
    const onSelect = vi.fn()
    mounted = mount({
      tool: 'select', onSelect, anchoring: false, anchorAtFigurePoint: () => anchor,
      marks: [{ id: 'e1', kind: 'element', color: '#1971c2', points: [[40, 30], [160, 90]], anchor }],
    })
    pointer(mounted.svg, 'pointerdown', 60, 50)
    pointer(mounted.svg, 'pointerup', 60, 50)
    act(() => { mounted?.svg.dispatchEvent(new MouseEvent('click', { bubbles: true })) })
    expect(onSelect).toHaveBeenCalledWith('e1')
    expect(onSelect).not.toHaveBeenCalledWith(null)
  })

  it('reaches the second of two marks naming the same element', () => {
    // The picker does not dedupe by selector, and deliberately so: the same curve can
    // be pointed at twice with a different sentence each time. Taking the first match
    // made the second mark dead on the figure and sent a press on the element to the
    // first mark instead of the one the reader had selected.
    const onSelect = vi.fn()
    const anchorOnCurve = { tag: 'g', id: 'line2d_1', bbox: [30, 20, 140, 90] as [number, number, number, number], selector: '#line2d_1' }
    mounted = mount({
      tool: 'select', onSelect, anchoring: false, anchorAtFigurePoint: () => anchorOnCurve,
      selectedId: 'e2',
      marks: [
        { id: 'e1', kind: 'element', color: '#1971c2', points: [[40, 30], [160, 90]], anchor: anchorOnCurve },
        { id: 'e2', kind: 'element', color: '#e03131', points: [[40, 30], [160, 90]], anchor: anchorOnCurve },
      ],
    })
    pointer(mounted.svg, 'pointerdown', 60, 50)
    pointer(mounted.svg, 'pointerup', 60, 50)
    expect(onSelect).toHaveBeenCalledWith('e2')
  })

  it('draws nothing on a placed element, not even a frame or a hit box', () => {
    const placed: AnnotationMark = { id: 'e1', kind: 'element', color: '#1971c2', points: [[40, 30], [160, 90]], anchor }
    mounted = mount({ tool: 'select', marks: [placed], selectedId: 'e1' })
    // No handles: a resize would change which element the mark names.
    expect(mounted.svg.querySelector('[data-da-handle]')).toBeNull()
    // No frame either — a box around a curve is a rectangle the figure never draws,
    // and "this region" is not what an element mark says. Selection is said by the
    // light on the element itself.
    expect(mounted.svg.querySelector('rect[stroke="#4c8dff"]')).toBeNull()
    expect(mounted.svg.querySelector('path[stroke="#4c8dff"]')).toBeNull()
    // And no hit box: a transparent rect over the element's box is the same rectangle
    // in a different coat, and it would swallow every press meant for the figure
    // inside it — the whole plot, when the element is a curve or an axis.
    expect(mounted.svg.querySelector('rect')).toBeNull()
  })

  it('treats a press over nothing named, or over a name with no mark, as paper', () => {
    // Two ways the question can come back empty: nothing is under the pointer, or what
    // is under it carries no selector. Neither is an element mark, so the press must
    // fall through to the surface rather than being swallowed by a mark that is not
    // there.
    const placed: AnnotationMark = { id: 'e1', kind: 'element', color: '#1971c2', points: [[40, 30], [160, 90]], anchor }
    const onSelect = vi.fn()
    const surface = mount({
      tool: 'select', onSelect, anchoring: false, marks: [placed],
      // Named, but without the one locator a mark is matched by.
      anchorAtFigurePoint: () => ({ tag: 'g', bbox: [0, 0, 10, 10] }),
    })
    mounted = surface
    pointer(surface.svg, 'pointerdown', 60, 50)
    pointer(surface.svg, 'pointerup', 60, 50)
    expect(onSelect).not.toHaveBeenCalledWith('e1')
  })

  it('leaves a press on a named element that no mark claims to the paper', () => {
    // The figure has an element under the pointer, but nothing has marked it: that is
    // bare paper as far as this surface is concerned, and the press must not be
    // consumed by looking for a mark that is not there.
    const onSelect = vi.fn()
    const surface = mount({
      tool: 'select', onSelect, anchoring: false,
      // A selector that names something, and no mark naming it.
      anchorAtFigurePoint: () => ({ tag: 'g', bbox: [0, 0, 10, 10], selector: '#unmarked', id: 'unmarked' }),
    })
    mounted = surface
    pointer(surface.svg, 'pointerdown', 60, 50)
    pointer(surface.svg, 'pointerup', 60, 50)
    // Nothing was selected by the press: the fall-through went to the surface.
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('ignores a double-click that lands on no element mark', () => {
    // A select-tool double-click on bare paper is not an edit of anything.
    const onEdit = vi.fn()
    mounted = mount({ tool: 'select', onEdit, anchoring: false, anchorAtFigurePoint: () => undefined })
    doubleClick(mounted.svg)
    expect(onEdit).not.toHaveBeenCalled()
  })

  it('ignores a double-click on a placed element under a drawing tool', () => {
    // The double-click is how one is opened for editing; under a drawing tool a
    // double-click on the paper is two presses, not an edit.
    const onEdit = vi.fn()
    mounted = mount({
      tool: 'arrow', onEdit, anchoring: false, anchorAtFigurePoint: () => anchor,
      marks: [{ id: 'e1', kind: 'element', color: '#1971c2', points: [[40, 30], [160, 90]], anchor }],
    })
    doubleClick(mounted.svg)
    expect(onEdit).not.toHaveBeenCalled()
  })

  it('leaves the paper free for other marks once an element is placed', () => {
    // The bug this pins: an element's box was a hit target, so a placed curve covered
    // most of the figure and every attempt to draw a second mark inside it selected
    // the first one instead.
    const placed: AnnotationMark = {
      id: 'e1', kind: 'element', color: '#1971c2', points: [[40, 30], [160, 90]],
      anchor: { tag: 'g', id: 'line2d_12', bbox: [40, 30, 120, 60], selector: '#line2d_12' },
    }
    const onAdd = vi.fn()
    const surface = mount({
      tool: 'arrow', onAdd, anchoring: false,
      // Under an arrow press the element under the pointer is named, but that names
      // what the new arrow points at — it must not become the press's subject.
      anchorAtFigurePoint: () => anchor,
      marks: [placed], selectedId: 'e1',
    })
    mounted = surface
    pointer(surface.svg, 'pointerdown', 60, 50)
    pointer(surface.svg, 'pointermove', 90, 80)
    pointer(surface.svg, 'pointerup', 90, 80)
    // The press drew an arrow rather than selecting the element mark again.
    expect(onAdd).toHaveBeenCalledTimes(1)
    expect((onAdd.mock.calls[0] as [AnnotationMark])[0].kind).toBe('arrow')
  })

  it('lets a second element be picked inside the first one\'s box', () => {
    // The real case this pins: three decaying curves on one plot, whose boxes almost
    // entirely overlap — each starts at the same x and sweeps down and to the right.
    // With a hit rect over the first mark's box, every later pick landed inside that
    // box and was swallowed, so the second and third curves could never be marked.
    // The picker asks the figure what is under the pointer, so overlapping boxes say
    // nothing at all.
    const first: AnnotationMark = {
      id: 'e1', kind: 'element', color: '#1971c2', points: [[49, 28], [265, 152]],
      anchor: { tag: 'g', id: 'line2d_12', bbox: [49, 28, 216, 124], selector: '#line2d_12' },
    }
    const second: MarkAnchor = { tag: 'g', id: 'line2d_10', bbox: [49, 70, 216, 82], selector: '#line2d_10' }
    const onAdd = vi.fn()
    const surface = mount({
      tool: 'element', onAdd, anchoring: false,
      // Wherever the pointer is, this plot answers with the curve underneath it: the
      // second curve here, whose box sits inside the first one's.
      anchorAtFigurePoint: () => second,
      marks: [first],
    })
    mounted = surface
    pointer(surface.svg, 'pointerdown', 120, 90)
    pointer(surface.svg, 'pointerup', 120, 90)
    expect(onAdd).toHaveBeenCalledTimes(1)
    const added = (onAdd.mock.calls[0] as [AnnotationMark])[0]
    expect(added.kind).toBe('element')
    expect(added.anchor?.selector).toBe('#line2d_10')
  })
})

describe('moving a mark', () => {
  let mounted: ReturnType<typeof mount> | undefined
  afterEach(() => {
    mounted?.root.unmount()
    mounted = undefined
    document.body.innerHTML = ''
  })

  /** The stored mark the drag tests all press on. */
  const mark: AnnotationMark = { id: 'm1', kind: 'rect', color: '#1971c2', points: [[10, 10], [100, 80]] }

  /** Press an existing mark, drag it by one offset, and drop it. */
  function drag(host: ReturnType<typeof mount>, from: readonly [number, number], to: readonly [number, number]): void {
    const hit = defined(host.svg.querySelector('path[stroke="transparent"]'))
    pointer(hit, 'pointerdown', from[0], from[1])
    pointer(host.svg, 'pointermove', to[0], to[1])
    pointer(host.svg, 'pointerup', to[0], to[1])
  }

  it('reports the geometry a mark was dropped at, as one commit', () => {
    const onMove = vi.fn()
    mounted = mount({ tool: 'select', marks: [mark], onMove })
    drag(mounted, [20, 20], [50, 45])
    expect(onMove).toHaveBeenCalledTimes(1)
    const [id, points] = onMove.mock.calls[0] as [string, readonly FigurePoint[], MarkAnchor | undefined]
    expect(id).toBe('m1')
    expect(points).toEqual([[40, 35], [130, 105]])
  })

  it('draws the mark where the drag has taken it before it is dropped', () => {
    mounted = mount({ tool: 'select', marks: [mark] })
    const hit = defined(mounted.svg.querySelector('path[stroke="transparent"]'))
    pointer(hit, 'pointerdown', 20, 20)
    pointer(mounted.svg, 'pointermove', 50, 45)
    // The first stroke is the white halo, the second the mark itself.
    const strokes = [...mounted.svg.querySelectorAll('g path')]
    expect(strokes.length).toBeGreaterThan(1)
    const drawn = strokes[1]?.getAttribute('d') ?? ''
    expect(drawn).toContain('M 40 35')
  })

  it('selects the mark it is about to move', () => {
    const onSelect = vi.fn()
    mounted = mount({ tool: 'select', marks: [mark], onSelect })
    const hit = defined(mounted.svg.querySelector('path[stroke="transparent"]'))
    pointer(hit, 'pointerdown', 20, 20)
    expect(onSelect).toHaveBeenCalledWith('m1')
  })

  it('commits nothing when the press never moved', () => {
    const onMove = vi.fn()
    mounted = mount({ tool: 'select', marks: [mark], onMove })
    const hit = defined(mounted.svg.querySelector('path[stroke="transparent"]'))
    pointer(hit, 'pointerdown', 20, 20)
    pointer(mounted.svg, 'pointerup', 20, 20)
    expect(onMove).not.toHaveBeenCalled()
  })

  it('does not start a drag on a pointer stream that has not left the press point', () => {
    // Trackpads report a move or two at the press coordinates before the finger
    // travels. Counting those as a drag would commit a mark to where it already
    // is, and undo would have a step that changes nothing to walk back.
    const onMove = vi.fn()
    mounted = mount({ tool: 'select', marks: [mark], onMove })
    const hit = defined(mounted.svg.querySelector('path[stroke="transparent"]'))
    pointer(hit, 'pointerdown', 20, 20)
    pointer(mounted.svg, 'pointermove', 20, 20)
    pointer(mounted.svg, 'pointerup', 20, 20)
    expect(onMove).not.toHaveBeenCalled()
  })

  it('selects but does not drag a mark under a drawing tool', () => {
    const onAdd = vi.fn()
    const onMove = vi.fn()
    const onSelect = vi.fn()
    mounted = mount({ tool: 'rect', marks: [mark], onAdd, onMove, onSelect })
    const hit = defined(mounted.svg.querySelector('path[stroke="transparent"]'))
    pointer(hit, 'pointerdown', 20, 20)
    pointer(mounted.svg, 'pointermove', 50, 45)
    pointer(mounted.svg, 'pointerup', 50, 45)
    expect(onMove).not.toHaveBeenCalled()
    expect(onSelect).toHaveBeenCalledWith('m1')
    // The mark owns its hit area, so the press never reaches the drawing tool.
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('re-anchors a dragged mark to what its own tip is over, not to the hand', () => {
    // A mark dragged by its middle ends with its tip somewhere other than under the
    // pointer, and the two are a whole grab offset apart. Asking the browser what is
    // under the *hand* re-anchored the mark to whatever the reader happened to be
    // over — an arrow dropped across a curve re-anchored to the legend it was held
    // over, so the mark named something its own geometry did not point at.
    const onMove = vi.fn()
    // An arrow from (40, 40) to (100, 100): its tip is `points[1]`.
    const arrow: AnnotationMark = { id: 'a1', kind: 'arrow', color: '#1971c2', points: [[40, 40], [100, 100]] }
    mounted = mount({ tool: 'select', marks: [arrow], anchoring: true, onMove })
    const inline = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const underTip = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    underTip.setAttribute('id', 'under_tip')
    const underHand = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    underHand.setAttribute('id', 'under_hand')
    inline.append(underTip, underHand)
    mounted.figure.append(inline)
    stubRect(mounted.figure, { left: 0, top: 0, width: 400, height: 300 })
    stubRect(inline, { left: 0, top: 0, width: 400, height: 300 })
    // The tip lands at (150, 150); the press was on the shaft at (70, 70), so the hand
    // is 30px short of the tip.
    stubRect(underTip, { left: 140, top: 140, width: 20, height: 20 })
    stubRect(underHand, { left: 100, top: 100, width: 20, height: 20 })
    const hit = defined(mounted.svg.querySelector('path[stroke="transparent"]'))
    pointer(hit, 'pointerdown', 70, 70)
    pointer(mounted.svg, 'pointermove', 120, 120)
    pointer(mounted.svg, 'pointerup', 120, 120)
    const anchor = onMove.mock.calls[0]?.[2] as MarkAnchor | undefined
    expect(anchor).toMatchObject({ tag: 'g', id: 'under_tip' })
  })

  it('moves a point mark when its pin is dragged', () => {
    // A point mark has no stroke to grab, so its hit area is the pin itself.
    const onMove = vi.fn()
    const dot: AnnotationMark = { id: 't1', kind: 'point', color: '#e03131', points: [[40, 60]], detail: '图号' }
    mounted = mount({ tool: 'select', marks: [dot], onMove })
    const hit = defined(mounted.svg.querySelector('path[fill="transparent"]'))
    pointer(hit, 'pointerdown', 44, 50)
    pointer(mounted.svg, 'pointermove', 74, 75)
    pointer(mounted.svg, 'pointerup', 74, 75)
    expect(defined(onMove.mock.calls[0] as [string, readonly FigurePoint[]] | undefined)[1][0]).toEqual([70, 85])
  })

  it('moves a selected point mark by its pin rather than looking for a handle', () => {
    // Selection draws a highlight box, but the grab target is still the pin: there
    // are no handles to hit, so the press has to fall through to a plain move
    // instead of being swallowed by a handle search.
    const onMove = vi.fn()
    const pin: AnnotationMark = { id: 't1', kind: 'point', color: '#e03131', points: [[100, 100]], detail: '这里' }
    mounted = mount({ tool: 'select', marks: [pin], selectedId: 't1', onMove })
    const hit = defined(mounted.svg.querySelector('path[fill="transparent"]'))
    pointer(hit, 'pointerdown', 104, 104)
    pointer(mounted.svg, 'pointermove', 124, 134)
    pointer(mounted.svg, 'pointerup', 124, 134)
    expect(defined(onMove.mock.calls[0] as [string, readonly FigurePoint[]] | undefined)[1][0]).toEqual([120, 130])
  })

  it('captures the pointer around a move so it survives leaving the mark', () => {
    const onMove = vi.fn()
    mounted = mount({ tool: 'select', marks: [mark], onMove })
    const hit = defined(mounted.svg.querySelector('path[stroke="transparent"]'))
    const capture = { released: [] as number[] }
    Object.defineProperty(hit, 'setPointerCapture', { configurable: true, value: () => {} })
    Object.defineProperty(hit, 'hasPointerCapture', { configurable: true, value: () => false })
    Object.defineProperty(hit, 'releasePointerCapture', {
      configurable: true,
      value: (id: number) => { capture.released.push(id) },
    })
    pointerWithId(hit, 'pointerdown', 20, 20, 5)
    pointerWithId(mounted.svg, 'pointermove', 130, 120, 5)
    pointerWithId(mounted.svg, 'pointerup', 130, 120, 5)
    expect(onMove).toHaveBeenCalledTimes(1)
    expect(defined(onMove.mock.calls[0] as [string, readonly FigurePoint[]] | undefined)[1][1]).toEqual([210, 180])
  })
})

describe('the control frame around a selected mark', () => {
  let mounted: ReturnType<typeof mount> | undefined
  afterEach(() => {
    mounted?.root.unmount()
    mounted = undefined
    document.body.innerHTML = ''
  })

  /** A box big enough that its handles and its body are easy to tell apart. */
  const box: AnnotationMark = { id: 'm1', kind: 'rect', color: '#1971c2', points: [[100, 100], [200, 180]] }

  /** A marker placed at one point, which is all a point mark has. */
  const dot: AnnotationMark = { id: 't1', kind: 'point', color: '#e03131', points: [[100, 100]], detail: '这里' }

  /** The handle of one kind in the drawn frame. */
  function handle(id: string): Element {
    return defined(mounted?.svg.querySelector(`rect[data-da-handle="${id}"]`))
  }

  /** Drag one handle from where it is drawn to one offset away. */
  function dragHandle(id: string, dx: number, dy: number, shift = false): void {
    const grip = handle(id)
    const from: readonly [number, number] = [Number(grip.getAttribute('x')) + 3.5, Number(grip.getAttribute('y')) + 3.5]
    pointer(grip, 'pointerdown', from[0], from[1])
    act(() => {
      mounted?.svg.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: from[0] + dx, clientY: from[1] + dy, shiftKey: shift }))
    })
    act(() => {
      mounted?.svg.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientX: from[0] + dx, clientY: from[1] + dy, shiftKey: shift }))
    })
  }

  it('draws eight box handles and a rotation handle around the selected mark', () => {
    mounted = mount({ tool: 'select', marks: [box], selectedId: 'm1' })
    expect(mounted.svg.querySelectorAll('rect[data-da-handle]')).toHaveLength(9)
    expect(handle('rotate')).toBeDefined()
  })

  it('draws the same-size handle whatever the paper is scaled to', () => {
    // A handle is a target for a pointer, not part of the drawing: on a figure shown at
    // a quarter size, a frame drawn in figure pixels would come out under two screen
    // pixels and could not be grabbed. The svg is in figure pixels and the paper is
    // scaled by CSS, so the drawn size is divided by that scale to stay constant.
    mounted = mount({ tool: 'select', marks: [box], selectedId: 'm1', scale: 0.25 })
    const drawn = Number(handle('nw').getAttribute('width'))
    expect(drawn).toBeCloseTo(HANDLE_SIZE / 0.25, 6)
  })

  it('draws a handle at its own size when the paper is not scaled', () => {
    mounted = mount({ tool: 'select', marks: [box], selectedId: 'm1' })
    expect(Number(handle('nw').getAttribute('width'))).toBeCloseTo(HANDLE_SIZE, 6)
  })

  it('grabs a handle where it looks, not where it would be on an unscaled paper', () => {
    // The reach travelled with the drawn size: a press on the frame as it appears has
    // to land on the handle, so the hit radius is scaled by the same factor.
    const onUpdate = vi.fn()
    mounted = mount({ tool: 'select', marks: [box], selectedId: 'm1', onUpdate, scale: 0.25 })
    dragHandle('e', 60, 0)
    expect(onUpdate).toHaveBeenCalledTimes(1)
  })

  it('draws no frame around a mark that is not selected', () => {
    mounted = mount({ tool: 'select', marks: [box], selectedId: null })
    expect(mounted.svg.querySelectorAll('rect[data-da-handle]')).toHaveLength(0)
  })

  it('resizes the mark by dragging a box handle', () => {
    const onUpdate = vi.fn()
    mounted = mount({ tool: 'select', marks: [box], selectedId: 'm1', onUpdate })
    dragHandle('e', 60, 0)
    expect(onUpdate).toHaveBeenCalledTimes(1)
    const [id, patch] = defined(onUpdate.mock.calls[0] as [string, MarkPatch] | undefined)
    expect(id).toBe('m1')
    // The east edge follows the pointer; the west edge has not moved.
    expect(patch.points?.[0]).toEqual([100, 100])
    expect(patch.points?.[1]?.[0]).toBeCloseTo(260, 6)
    // A resize says nothing about rotation.
    expect(patch.rotation).toBeUndefined()
  })

  it('turns the mark by dragging its rotation handle', () => {
    const onUpdate = vi.fn()
    mounted = mount({ tool: 'select', marks: [box], selectedId: 'm1', onUpdate })
    // The handle rests at `[150, 78]`, above the centre `[150, 140]`; dragging it
    // to a point level with the centre and to its right is a quarter turn.
    dragHandle('rotate', 40, 62)
    expect(onUpdate).toHaveBeenCalledTimes(1)
    const patch = defined(onUpdate.mock.calls[0] as [string, MarkPatch] | undefined)[1]
    expect(patch.rotation).toBeCloseTo(90, 6)
    expect(patch.points).toBeUndefined()
  })

  it('snaps the rotation to 15° steps while Shift is held', () => {
    const onUpdate = vi.fn()
    mounted = mount({ tool: 'select', marks: [box], selectedId: 'm1', onUpdate })
    dragHandle('rotate', 40, 60, true)
    const patch = defined(onUpdate.mock.calls[0] as [string, MarkPatch] | undefined)[1]
    expect(patch.rotation).toBe(90)
  })

  it('draws no handle frame at all around a selected point mark', () => {
    // A point mark has no extent, so a resize or a turn would have nothing to act
    // on. It is framed by a dashed highlight instead, and offers no handles.
    mounted = mount({ tool: 'select', marks: [dot], selectedId: 't1' })
    expect(mounted.svg.querySelectorAll('rect[data-da-handle]')).toHaveLength(0)
    expect(mounted.svg.querySelector('rect[stroke="#4c8dff"]')).not.toBeNull()
  })

  it('finds a handle through the shape itself, so a small target is easy to grab', () => {
    const onUpdate = vi.fn()
    mounted = mount({ tool: 'select', marks: [box], selectedId: 'm1', onUpdate })
    // A press on the mark's own hit area, right at its south-east corner: the
    // handle is only seven pixels wide, so the shape under it must accept the
    // press as a grab rather than starting a plain move.
    const hit = defined(mounted.svg.querySelector('path[stroke="transparent"]'))
    pointer(hit, 'pointerdown', 200, 180)
    pointer(mounted.svg, 'pointermove', 260, 180)
    pointer(mounted.svg, 'pointerup', 260, 180)
    expect(onUpdate).toHaveBeenCalledTimes(1)
    expect(defined(onUpdate.mock.calls[0] as [string, MarkPatch] | undefined)[1].points?.[1]?.[0]).toBeCloseTo(260, 6)
  })

  it('moves a small mark pressed in its middle instead of resizing it', () => {
    // A small mark's eight grips overlap each other and cover the whole of it, so the
    // grip reach alone decided every press was a resize: a tick label or a short arrow
    // could be resized but never dragged, and a reader who pressed its middle got a
    // resize they did not ask for. Aiming at the middle is aiming at the mark.
    const onMove = vi.fn()
    const onUpdate = vi.fn()
    const tick: AnnotationMark = { id: 'm2', kind: 'rect', color: '#1971c2', points: [[40, 40], [52, 52]] }
    mounted = mount({ tool: 'select', marks: [tick], selectedId: 'm2', onMove, onUpdate })
    const hit = defined(mounted.svg.querySelector('path[stroke="transparent"]'))
    pointer(hit, 'pointerdown', 46, 46)
    pointer(mounted.svg, 'pointermove', 76, 66)
    pointer(mounted.svg, 'pointerup', 76, 66)
    expect(onUpdate).not.toHaveBeenCalled()
    expect(onMove).toHaveBeenCalledTimes(1)
  })

  it('resizes the mark under a drawing tool too, because a handle is a control', () => {
    // The frame is drawn only around the selected mark and shows a resize cursor,
    // so a press on a handle can only mean "resize this". Leaving it inert under a
    // drawing tool made the frame look broken.
    for (const tool of ['arrow', 'rect', 'ellipse', 'pen', 'point'] as const) {
      const onUpdate = vi.fn()
      mounted = mount({ tool, marks: [box], selectedId: 'm1', onUpdate })
      dragHandle('e', 60, 0)
      expect(onUpdate).toHaveBeenCalledTimes(1)
      expect(defined(onUpdate.mock.calls[0] as [string, MarkPatch] | undefined)[1].points?.[1]?.[0])
        .toBeCloseTo(260, 6)
      mounted.root.unmount()
      mounted = undefined
      document.body.innerHTML = ''
    }
  })

  it('turns the mark under a drawing tool too', () => {
    const onUpdate = vi.fn()
    mounted = mount({ tool: 'arrow', marks: [box], selectedId: 'm1', onUpdate })
    dragHandle('rotate', 40, 62)
    expect(defined(onUpdate.mock.calls[0] as [string, MarkPatch] | undefined)[1].rotation)
      .toBeCloseTo(90, 6)
  })

  it('still leaves the mark itself to the drawing tool, so a stroke can start on it', () => {
    // A press on the shape (not on a control) under a drawing tool belongs to that
    // tool: it selects, and draws nothing underneath the mark.
    const onMove = vi.fn()
    const onUpdate = vi.fn()
    mounted = mount({ tool: 'arrow', marks: [box], selectedId: 'm1', onMove, onUpdate })
    const hit = defined(mounted.svg.querySelector('path[stroke="transparent"]'))
    pointer(hit, 'pointerdown', 150, 140)
    pointer(mounted.svg, 'pointermove', 160, 150)
    pointer(mounted.svg, 'pointerup', 160, 150)
    expect(onMove).not.toHaveBeenCalled()
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('moves the mark rather than resizing it when a press misses every handle', () => {
    const onMove = vi.fn()
    const onUpdate = vi.fn()
    mounted = mount({ tool: 'select', marks: [box], selectedId: 'm1', onMove, onUpdate })
    // A press on the middle of the shape is nowhere near a handle.
    const hit = defined(mounted.svg.querySelector('path[stroke="transparent"]'))
    pointer(hit, 'pointerdown', 150, 140)
    pointer(mounted.svg, 'pointermove', 160, 150)
    pointer(mounted.svg, 'pointerup', 160, 150)
    expect(onMove).toHaveBeenCalledTimes(1)
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('does not resize a mark that is not selected, even near its corner', () => {
    const onMove = vi.fn()
    const onUpdate = vi.fn()
    mounted = mount({ tool: 'select', marks: [box], selectedId: null, onMove, onUpdate })
    const hit = defined(mounted.svg.querySelector('path[stroke="transparent"]'))
    pointer(hit, 'pointerdown', 101, 101)
    pointer(mounted.svg, 'pointermove', 120, 120)
    pointer(mounted.svg, 'pointerup', 120, 120)
    expect(onMove).toHaveBeenCalledTimes(1)
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('follows the pointer while a handle is held, before it is dropped', () => {
    mounted = mount({ tool: 'select', marks: [box], selectedId: 'm1' })
    const grip = handle('e')
    const from: readonly [number, number] = [Number(grip.getAttribute('x')) + 3.5, Number(grip.getAttribute('y')) + 3.5]
    pointer(grip, 'pointerdown', from[0], from[1])
    pointer(mounted.svg, 'pointermove', from[0] + 60, from[1])
    // The drawn outline has already grown: the stroke reaches the new east edge.
    const drawn = [...mounted.svg.querySelectorAll('g path')].map(path => path.getAttribute('d') ?? '')
    expect(drawn.some(d => d.includes('260') || d.includes('V 180'))).toBe(true)
  })

  it('commits nothing when a handle is pressed and released in place', () => {
    const onUpdate = vi.fn()
    const onMove = vi.fn()
    mounted = mount({ tool: 'select', marks: [box], selectedId: 'm1', onUpdate, onMove })
    const grip = handle('e')
    pointer(grip, 'pointerdown', Number(grip.getAttribute('x')) + 3.5, Number(grip.getAttribute('y')) + 3.5)
    pointer(mounted.svg, 'pointerup', Number(grip.getAttribute('x')) + 3.5, Number(grip.getAttribute('y')) + 3.5)
    expect(onUpdate).not.toHaveBeenCalled()
    expect(onMove).not.toHaveBeenCalled()
  })

  it('numbers a pin by the whole document when the owner says so', () => {
    // A page shows some of the document's marks: its numbers have to continue the
    // document's count, not restart at 1, or the picture would disagree with the list.
    mounted = mount({
      tool: 'select',
      marks: [{ id: 'm1', kind: 'point', color: '#e03131', points: [[40, 60]] }],
      numbering: new Map([['m1', 4]]),
    })
    expect([...mounted.svg.querySelectorAll('text')].map(node => node.textContent)).toEqual(['4'])
  })

  it('numbers every mark, in the shape each kind can carry a number in', () => {
    // A pin holds its number inside its head. A stroke has no inside, so its number
    // goes in a disc beside its corner. Both are drawn, because the message the agent
    // reads is a numbered list: a picture with only the pins numbered leaves "the
    // second one" to be found by counting arrows.
    mounted = mount({
      tool: 'select',
      marks: [
        { id: 'm1', kind: 'arrow', color: '#e03131', points: [[20, 20], [80, 20]] },
        { id: 'm2', kind: 'rect', color: '#0f0', points: [[20, 100], [80, 140]] },
        { id: 'm3', kind: 'point', color: '#1971c2', points: [[40, 60]] },
      ],
    })
    const letters = [...mounted.svg.querySelectorAll('text')].map(node => node.textContent)
    expect(letters).toEqual(['1', '2', '3'])
    // Two discs, for the arrow and the box; the pin's number lives inside its head
    // and needs none.
    expect(mounted.svg.querySelectorAll('circle').length).toBe(2)
  })

  it('draws no lettering for any mark, however much it has to say', () => {
    // The sentence a mark carries travels in the message the agent reads. It is
    // never painted on the figure, so a figure with marks on it is still the
    // reader's own picture.
    const noted: AnnotationMark = { ...box, detail: '缺图形，这里的线应该更粗' }
    const dotted: AnnotationMark = { ...dot, detail: '这一点的刻度标错了' }
    mounted = mount({ tool: 'select', marks: [noted, dotted], selectedId: null })
    // The only lettering on the surface is the marks' numbers, which is what lets the
    // list say "②" and have the figure mean the same thing. The sentences themselves
    // are what the agent reads, and painting them would bury the line work.
    const letters = [...mounted.svg.querySelectorAll('text')].map(node => node.textContent)
    expect(letters).toEqual(['1', '2'])
    expect(mounted.svg.querySelectorAll('tspan')).toHaveLength(0)
    expect(mounted.svg.textContent).not.toContain('缺图形')
    expect(mounted.svg.textContent).not.toContain('刻度标错')
  })
})

describe('a mark drawn past the edge of the figure', () => {
  let mounted: ReturnType<typeof mount> | undefined
  afterEach(() => {
    mounted?.root.unmount()
    mounted = undefined
    document.body.innerHTML = ''
  })

  it('sits where the figure coordinate says, not twice as far', () => {
    // The paper grew 20px to the left and 30px above, so the marks' own origin moved
    // into it by that much. The overlay is the paper, so it must not repeat the move:
    // doing so put a mark drawn in the left margin out in the right one.
    mounted = mount({ tool: 'select', origin: [20, 30], width: 440, height: 330 })
    const group = defined(mounted.svg.querySelector('g[transform]'))
    expect(group.getAttribute('transform')).toBe('translate(20 30)')
    expect(defined(mounted.svg).getAttribute('style')).toBeNull()
  })

  it('keeps the pen the figure sized it to, when the paper grows', () => {
    // The paper grows to hold a mark drawn past the edge; the pen must not grow with
    // it. Sized from the paper, an 800×600 plot with one rectangle out at x≈1980 drew
    // its strokes 2.5× thicker than the same mark in the exported picture — the panel
    // and the record of what the reader approved disagreeing about one figure's pen.
    mounted = mount({
      tool: 'select',
      width: 1993,
      height: 600,
      figureSize: { width: 800, height: 600 },
      marks: [{ id: 'm', kind: 'arrow', color: '#e03131', points: [[10, 10], [200, 100]] }],
    })
    const stroke = defined(mounted.svg.querySelector('path[stroke="#e03131"]'))
    // unit is the figure's (800 / 800 = 1), so the default-weight stroke is exactly
    // the base width rather than 2.49 times it.
    expect(stroke.getAttribute('stroke-width')).toBe('2.5')
  })

  it('reads a press in figure coordinates even with the paper grown', () => {
    // A collection rather than a `let`: TypeScript narrows a variable that is only
    // assigned inside a callback to its initial value, and then the mark reads as null.
    const added: AnnotationMark[] = []
    mounted = mount({
      tool: 'rect',
      origin: [20, 30],
      width: 440,
      height: 330,
      svgSize: { width: 440, height: 330 },
      onAdd: (mark) => { added.push(mark) },
    })
    // 40px into the overlay is 20px past the paper's left edge, which is figure 0.
    pointer(mounted.svg, 'pointerdown', 40, 50)
    pointer(mounted.svg, 'pointermove', 140, 150)
    pointer(mounted.svg, 'pointerup', 140, 150)
    expect(defined(added[0]).points).toEqual([[20, 20], [120, 120]])
  })
})
