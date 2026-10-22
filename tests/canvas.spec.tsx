// @vitest-environment jsdom
/** The drawing surface: pointer input becomes marks in figure coordinates. */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AnnotationMark, FigurePoint, MarkAnchor } from '../src/shared/annotation'
import { Canvas, nextMarkId, type MarkPatch, type Tool } from '../src/client/Canvas'
import { defined, stubRect } from './dom'

/** Options one mounted surface is built from. */
interface MountOptions {
  readonly tool: Tool
  readonly marks?: readonly AnnotationMark[]
  readonly anchoring?: boolean
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
  readonly numbering?: ReadonlyMap<string, number>
  readonly onPan?: (dx: number, dy: number) => void
  readonly onPanStart?: () => void
  readonly onPanEnd?: () => void
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
        width={400}
        height={300}
        marks={options.marks ?? []}
        tool={options.tool}
        color="#e03131"
        containerRef={containerRef}
        anchoring={options.anchoring ?? false}
        selectedId={options.selectedId ?? null}
        onSelect={options.onSelect ?? (() => {})}
        onAdd={options.onAdd ?? (() => {})}
        onMove={options.onMove ?? (() => {})}
        onUpdate={options.onUpdate ?? (() => {})}
        onRemove={options.onRemove ?? (() => {})}
        onEdit={options.onEdit ?? (() => {})}
        onDrawn={options.onDrawn}
        {...(options.onPan === undefined ? {} : { onPan: options.onPan })}
        {...(options.onPanStart === undefined ? {} : { onPanStart: options.onPanStart })}
        {...(options.onPanEnd === undefined ? {} : { onPanEnd: options.onPanEnd })}
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
    const onAdd = vi.fn()
    mounted = mount({ tool: 'rect', anchoring: false, onAdd })
    pointer(mounted.svg, 'pointerdown', 10, 10)
    pointer(mounted.svg, 'pointermove', 90, 90)
    pointer(mounted.svg, 'pointerup', 90, 90)
    expect(defined(onAdd.mock.calls[0]?.[0] as AnnotationMark | undefined).anchor).toBeUndefined()
  })

  it('reports no anchor when there is no figure container to hit-test', () => {
    const onAdd = vi.fn()
    mounted = mount({ tool: 'rect', anchoring: true, container: null, onAdd })
    pointer(mounted.svg, 'pointerdown', 10, 10)
    pointer(mounted.svg, 'pointermove', 90, 90)
    pointer(mounted.svg, 'pointerup', 90, 90)
    expect(defined(onAdd.mock.calls[0]?.[0] as AnnotationMark | undefined).anchor).toBeUndefined()
  })

  it('keeps coordinates finite when the surface reports no area', () => {
    const onAdd = vi.fn()
    mounted = mount({ tool: 'rect', anchoring: true, svgSize: { width: 0, height: 0 }, onAdd })
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

  it('anchors a finished drag to the figure element under the release point', () => {
    const onAdd = vi.fn()
    mounted = mount({ tool: 'rect', anchoring: true, onAdd })
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

  it('re-anchors a dragged mark to whatever it was dropped on', () => {
    const onMove = vi.fn()
    mounted = mount({ tool: 'select', marks: [mark], anchoring: true, onMove })
    const inline = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const node = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    node.setAttribute('id', 'node102')
    inline.append(node)
    mounted.figure.append(inline)
    stubRect(mounted.figure, { left: 0, top: 0, width: 400, height: 300 })
    stubRect(node, { left: 40, top: 30, width: 40, height: 20 })
    drag(mounted, [20, 20], [50, 45])
    const anchor = onMove.mock.calls[0]?.[2] as MarkAnchor | undefined
    expect(anchor).toMatchObject({ tag: 'g', id: 'node102' })
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

  it('numbers a pin but never a stroke mark', () => {
    // A pin has a body to hold its number; an arrow does not, and a number parked
    // beside one is a second thing to read on a figure already full of them. The
    // list keeps numbering every mark, so the figure only repeats what it can say
    // cleanly.
    mounted = mount({
      tool: 'select',
      marks: [
        { id: 'm1', kind: 'arrow', color: '#e03131', points: [[20, 20], [80, 20]] },
        { id: 'm2', kind: 'rect', color: '#0f0', points: [[20, 100], [80, 140]] },
        { id: 'm3', kind: 'point', color: '#1971c2', points: [[40, 60]] },
      ],
    })
    const letters = [...mounted.svg.querySelectorAll('text')].map(node => node.textContent)
    expect(letters).toEqual(['3'])
  })

  it('draws no lettering for any mark, however much it has to say', () => {
    // The sentence a mark carries travels in the message the agent reads. It is
    // never painted on the figure, so a figure with marks on it is still the
    // reader's own picture.
    const noted: AnnotationMark = { ...box, detail: '缺图形，这里的线应该更粗' }
    const dotted: AnnotationMark = { ...dot, detail: '这一点的刻度标错了' }
    mounted = mount({ tool: 'select', marks: [noted, dotted], selectedId: null })
    // The only lettering on the surface is the pin's own number, which is what lets
    // the list say "②" and have the figure mean the same thing. The box gets none:
    // a stroke mark has no body that could hold a digit without covering the work.
    const letters = [...mounted.svg.querySelectorAll('text')].map(node => node.textContent)
    expect(letters).toEqual(['2'])
    expect(mounted.svg.querySelectorAll('tspan')).toHaveLength(0)
    expect(mounted.svg.textContent).not.toContain('缺图形')
    expect(mounted.svg.textContent).not.toContain('刻度标错')
  })
})
