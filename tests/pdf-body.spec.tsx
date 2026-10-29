// @vitest-environment jsdom
/** The PDF body: opening the document, one page at a time, and one save for all of it. */
import { act, useEffect, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AnnotationDocument, AnnotationMark } from '../src/shared/annotation'
import { AUTOSAVE_DELAY_MS, annotationSignature, createAutosave } from '../src/client/autosave'
import { figureUnit } from '../src/client/scale'
import type { AnnotatorBodyProps } from '../src/client/AnnotatorBody'
import type { DocumentSeat, PagedAnnotationInput, PageImage } from '../src/client/document-seat'
import type { PdfBodyProps } from '../src/client/pdf/PdfBody'
import { PdfBody } from '../src/client/pdf/pdf'
import { zh } from '../src/client/locales'
import { defined } from './dom'

/** What the runtime double answers, per spec. */
const runtime = vi.hoisted(() => ({
  pages: 3,
  size: { width: 600, height: 800 } as { width: number; height: number; transform: readonly number[] },
  openFails: null as unknown,
  sizeFails: null as unknown,
  renderFails: null as unknown,
  destroyed: 0,
  rendered: [] as { readonly page: number; readonly scale: number }[],
  deferOpen: false,
  deferRender: false,
  settleOpen: null as null | (() => void),
  settleRender: null as null | (() => void),
}))

vi.mock('../src/client/pdf/runtime', () => ({
  openPdf: async () => {
    if (runtime.deferOpen) await new Promise<void>((resolve) => { runtime.settleOpen = resolve })
    if (runtime.openFails !== null) throw runtime.openFails
    return {
      pageCount: runtime.pages,
      size: async (page: number) => {
        if (runtime.sizeFails !== null) throw runtime.sizeFails
        return { ...runtime.size, transform: [1, 0, 0, -1, 0, page] }
      },
      render: async (page: number, scale: number) => {
        if (runtime.deferRender) await new Promise<void>((resolve) => { runtime.settleRender = resolve })
        runtime.rendered.push({ page, scale })
        if (runtime.renderFails !== null) throw runtime.renderFails
        return {
          dataUrl: `data:image/png;base64,page${page}`,
          width: runtime.size.width,
          height: runtime.size.height,
          pixelWidth: runtime.size.width,
          pixelHeight: runtime.size.height,
        }
      },
      destroy: async () => { runtime.destroyed += 1 },
    }
  },
}))

/** The writer double: the real one parses the document, which a two-byte fixture is not. */
const writer = vi.hoisted(() => ({ calls: [] as { readonly page: number; readonly transform: readonly number[]; readonly marks: readonly AnnotationMark[] }[][] }))

vi.mock('../src/client/pdf/annotate', () => ({
  annotatePdf: async (_bytes: Uint8Array, pages: { readonly page: number; readonly transform: readonly number[]; readonly marks: readonly AnnotationMark[] }[]) => {
    writer.calls.push(pages.map(page => ({ ...page })))
    return new TextEncoder().encode('%PDF-1.7 annotated')
  },
}))

/** What one seat stub recorded, and how it should behave. */
const seatState = vi.hoisted(() => ({
  loaded: null as { path: string; mediaType: string; sha256: string; annotation: AnnotationDocument | null; unreadable: readonly string[] } | null,
  loadFails: null as unknown,
  saveFails: null as unknown,
  draftFails: null as unknown,
  sendFails: null as unknown,
  composeFails: null as unknown,
  discardFails: null as unknown,
  warnings: [] as readonly string[],
  saved: { annotationPath: '/w/report.pdf.annot.json', reviewPath: '/w/report.pdf.annotated.pdf' } as { annotationPath: string; reviewPath: string | null },
  loads: [] as string[],
  discards: [] as string[],
  saves: [] as { readonly address: string; readonly input: PagedAnnotationInput; readonly bytes: Uint8Array }[],
  drafts: [] as { readonly address: string; readonly input: PagedAnnotationInput }[],
  sends: [] as {
    readonly input: PagedAnnotationInput
    readonly images: readonly PageImage[]
    readonly bytes: Uint8Array
  }[],
  composes: [] as { readonly input: PagedAnnotationInput; readonly images: readonly PageImage[] }[],
}))

/** The seat the entry half would inject. */
function stubSeat(): DocumentSeat {
  return {
    load: async (address) => {
      seatState.loads.push(address)
      if (seatState.loadFails !== null) throw seatState.loadFails
      return seatState.loaded ?? { path: '/w/report.pdf', mediaType: 'application/pdf', sha256: 'a'.repeat(64), annotation: null, unreadable: [] }
    },
    save: async (address, input, bytes) => {
      if (seatState.saveFails !== null) throw seatState.saveFails
      seatState.saves.push({ address, input, bytes })
      return seatState.saved
    },
    draft: async (address, input) => {
      if (seatState.draftFails !== null) throw seatState.draftFails
      seatState.drafts.push({ address, input })
    },
    send: async (input, saved, images, bytes) => {
      if (seatState.sendFails !== null) throw seatState.sendFails
      seatState.sends.push({ input, images, bytes })
      return [...seatState.warnings, ...(saved.reviewPath === null ? [] : [])]
    },
    compose: async (input, _saved, images) => {
      if (seatState.composeFails !== null) throw seatState.composeFails
      seatState.composes.push({ input, images })
    },
    discard: async (address) => {
      if (seatState.discardFails !== null) throw seatState.discardFails
      seatState.discards.push(address)
    },
  }
}

/** Every props object the annotator body was rendered with, in order. */
const surfaces: AnnotatorBodyProps[] = []
/** Every `onDraftChange` identity the body was handed, in render order. */
const callbacks: (AnnotatorBodyProps['onDraftChange'])[] = []
let roots: Root[] = []

/** The number of spans on screen, so a render loop is visible as a count. */
let renders = 0

/**
 * The annotator double: it records what the document handed it, and reports its
 * draft from an effect keyed on that callback — the shape the real body has, and
 * the one that turns an unstable callback into a render loop.
 */
function StubBody(props: AnnotatorBodyProps): ReactNode {
  surfaces.push(props)
  callbacks.push(props.onDraftChange)
  renders += 1
  // Keyed on the callback alone, the way the real body keys its report on its own
  // marks: a body that reported on every render would be the loop this guards.
  useEffect(() => {
    props.onDraftChange?.({ marks: props.draft?.marks ?? [] })
  }, [props.onDraftChange])
  // The real body places the document's paging on its own bar, so the stub draws it
  // too: the controls belong to the document and are only positioned by the body.
  return (
    <>
      {props.pagingSlot}
      {/* The hand-off rides on the same bar, and a page body reaches it through the
          callback its owner handed down — the marks still go out from one place. */}
      <button type="button" aria-label={copy('sendToAgent')}
        onClick={() => { props.onSend?.('agent') }}>agent</button>
      <button type="button" aria-label={copy('sendToComposer')}
        onClick={() => { props.onSend?.('composer') }}>composer</button>
      <span>{`page ${String(props.page?.width ?? 0)} marks ${String(props.draft?.marks.length ?? 0)}`}</span>
    </>
  )
}

/** The props the annotator body is currently rendered with. */
function currentProps(): AnnotatorBodyProps {
  return defined(surfaces[surfaces.length - 1])
}

/** Localized copy for the fallback dictionary. */
function copy(key: string, vars?: Record<string, number | string>): string {
  const text = (zh as Record<string, string>)[key] ?? key
  return vars === undefined
    ? text
    : text.replace(/\{(\w+)\}/gu, (placeholder, name: string) => String(vars[name] ?? placeholder))
}

/** Pane width the body measures, changed by the specs that resize it. */
let paneWidth = 800
let notifyResize: (() => void) | null = null

/**
 * The width one raster serves for a pane.
 *
 * Mirrors the body's own step: a dragged pane is rasterized per step, not per
 * pixel, so the scale a raster is asked for is the stepped width's.
 * @param width - pane width in CSS pixels.
 * @returns the width the raster is rendered for.
 */
function stepped(width: number): number {
  return Math.ceil(width / 64) * 64
}

/** The props one mounted body is rendered with, with only the spec's own spelled out. */
function bodyProps(props: Partial<PdfBodyProps> = {}): PdfBodyProps {
  return {
    content: { kind: 'bytes', data: new Uint8Array([1, 2]) },
    resourceAddress: 'dsh-resource://file/session/s1/report.pdf',
    AnnotatorBody: StubBody,
    seat: stubSeat(),
    createAutosave,
    annotationSignature,
    autosaveDelayMs: AUTOSAVE_DELAY_MS,
    figureUnit,
      t: copy,
    ...props,
  } as PdfBodyProps
}

/** Mount one PDF body and let its chain of effects settle. */
async function mount(props: Partial<PdfBodyProps> = {}): Promise<{ readonly host: HTMLElement; readonly root: Root }> {
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  roots.push(root)
  await act(async () => { root.render(<PdfBody {...bodyProps(props)} />) })
  await settle()
  return { host, root }
}

/** Render one more prop set into a body that is already mounted. */
async function rerender(root: Root, props: Partial<PdfBodyProps>): Promise<void> {
  await act(async () => { root.render(<PdfBody {...bodyProps(props)} />) })
  await settle()
}

/** Let every promise the body is waiting on run. */
async function settle(): Promise<void> {
  await act(async () => {
    for (let turn = 0; turn < 8; turn += 1) await Promise.resolve()
  })
}

/**
 * One toolbar button, by the name it answers to.
 *
 * The document's strip draws its paging and its hand-off as glyphs on a dark card,
 * so a button's accessible name is its `aria-label` — the visible text is only ever
 * the page number and the flow's own word.
 */
function button(host: HTMLElement, label: string): HTMLButtonElement {
  const found = [...host.querySelectorAll('button')].find(element =>
    element.getAttribute('aria-label') === label || element.textContent === label)
  if (found === undefined) throw new Error(`no button labelled ${label}`)
  return found as HTMLButtonElement
}

/** Type into a field the way a reader would, so React's own onChange sees it. */
function typeInto(box: HTMLInputElement, text: string): void {
  // React tracks the value it last wrote, so assigning `value` directly is invisible
  // to it: the value has to be set through the prototype's own setter and followed
  // by an input event, which is exactly what a keystroke does.
  // eslint-disable-next-line typescript/unbound-method -- the setter is applied with Reflect.apply, so its receiver is explicit.
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  if (setter === undefined) throw new Error('no value setter')
  Reflect.apply(setter, box, [text])
  box.dispatchEvent(new Event('input', { bubbles: true }))
}

/** One element that must be there, or the spec is wrong rather than the code. */
function required<T>(found: T | null): T {
  if (found === null) throw new Error('missing element')
  return found
}

/** Click one button, letting the handler's promises settle. */
async function click(element: Element): Promise<void> {
  await act(async () => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    for (let turn = 0; turn < 8; turn += 1) await Promise.resolve()
  })
}

/** Report one page's marks the way the page body does. */
async function edit(marks: readonly AnnotationMark[]): Promise<void> {
  await act(async () => { currentProps().onDraftChange?.({ marks }) })
  await settle()
}

/**
 * Wait out the autosave debounce.
 *
 * A text edit is reported a character at a time, so the write is deliberately
 * late; a test that only settled microtasks would read the disk before it.
 */
async function waitForSave(): Promise<void> {
  await act(async () => { await new Promise(resolve => setTimeout(resolve, AUTOSAVE_DELAY_MS + 20)) })
}

/** One mark on one page. */
function mark(id: string, page: number): AnnotationMark {
  return { id, kind: 'rect', color: '#1971c2', points: [[10, 20], [60, 90]], page }
}

beforeEach(() => {
  // The reader's own choices outlive a document, which is the point — so each spec
  // starts from none of them rather than from whatever the last one chose.
  window.localStorage.clear()
  surfaces.length = 0
  callbacks.length = 0
  renders = 0
  roots = []
  paneWidth = 800
  runtime.pages = 3
  runtime.size = { width: 600, height: 800, transform: [1, 0, 0, -1, 0, 800] }
  runtime.openFails = null
  runtime.sizeFails = null
  runtime.renderFails = null
  runtime.destroyed = 0
  runtime.rendered = []
  runtime.deferOpen = false
  runtime.deferRender = false
  runtime.settleOpen = null
  runtime.settleRender = null
  writer.calls = []
  seatState.loaded = null
  seatState.loadFails = null
  seatState.saveFails = null
  seatState.sendFails = null
  seatState.composeFails = null
  seatState.discardFails = null
  seatState.composes = []
  seatState.warnings = []
  seatState.saved = { annotationPath: '/w/report.pdf.annot.json', reviewPath: '/w/report.pdf.annotated.pdf' }
  seatState.discards = []
  seatState.loads = []
  seatState.saves = []
  seatState.drafts = []
  seatState.sends = []
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => paneWidth })
  class StubResizeObserver {
    /**
     * @param callback - the measure callback the body registered.
     */
    constructor(callback: () => void) { notifyResize = callback }
    /** Nothing to observe: the spec fires the callback itself. */
    observe(): void {}
    /** Nothing to release. */
    disconnect(): void {}
  }
  vi.stubGlobal('ResizeObserver', StubResizeObserver)
})

afterEach(() => {
  for (const root of roots) root.unmount()
  roots = []
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
  notifyResize = null
  delete (HTMLElement.prototype as { clientWidth?: number }).clientWidth
})

describe('opening a PDF', () => {
  it('renders the page the runtime produced, and hands it to the annotator body', async () => {
    await mount()
    const props = currentProps()
    expect(props.page).toEqual({ dataUrl: 'data:image/png;base64,page1', width: 600, height: 800 })
    // The bytes belong to the PDF half; the annotator body annotates the page.
    expect(props.content).toBeUndefined()
    expect(props.resourceAddress).toBe('dsh-resource://file/session/s1/report.pdf')
    expect(props.t).toBe(copy)
    expect(props.summary).toBe('')
    expect(typeof props.onSummaryChange).toBe('function')
    expect(seatState.loads).toEqual(['dsh-resource://file/session/s1/report.pdf'])
  })

  it('shows the document toolbar with the page it is on', async () => {
    // The page fraction already says how long the document is, and the bar's own
    // marks button carries the count: a separate sentence was saying it twice, in
    // words, on a card that has room for neither.
    const { host } = await mount()
    expect(host.textContent).toContain('1 / 3')
    expect(host.textContent).not.toContain(copy('documentScope', { pages: 3, marks: 0 }))
    await edit([mark('m1', 1), mark('m2', 1)])
    expect(host.textContent).toContain('marks 2')
  })

  it('shows a hint while the page is not ready', async () => {
    runtime.deferOpen = true
    const { host } = await mount()
    expect(host.textContent).toContain(zh.pdfRendering)
    // The wait fills the page slot, so the pane's frame is already there.
    expect(host.querySelector('.da-placeholder')).not.toBeNull()
    // …and it states nothing the document has not said yet.
    expect(host.textContent).not.toContain('1 / 0')
    expect(surfaces).toHaveLength(0)
    runtime.settleOpen?.()
    await settle()
    expect(currentProps().page?.dataUrl).toBe('data:image/png;base64,page1')
    expect(host.querySelector('.da-placeholder')).toBeNull()
  })

  it('renders nothing, and opens nothing, without bytes', async () => {
    const { host } = await mount({ content: { kind: 'text' } })
    expect(host.textContent).toContain(zh.pdfRendering)
    expect(surfaces).toHaveLength(0)
    expect(runtime.rendered).toEqual([])
  })

  it('reports a failed open, measurement, and render', async () => {
    runtime.openFails = new Error('bad pdf')
    const first = await mount()
    expect(first.host.textContent).toContain(`${zh.pdfOpenFailed}bad pdf`)
    runtime.openFails = 'unreadable'
    const second = await mount()
    expect(second.host.textContent).toContain(`${zh.pdfOpenFailed}unreadable`)
    runtime.openFails = null
    runtime.sizeFails = new Error('no page 9')
    const third = await mount()
    expect(third.host.textContent).toContain(`${zh.pdfOpenFailed}no page 9`)
    runtime.sizeFails = null
    runtime.renderFails = 'raster broke'
    const fourth = await mount()
    expect(fourth.host.textContent).toContain(`${zh.pdfOpenFailed}raster broke`)
  })

  it('reports a failed read of the saved annotation as a status, not a broken page', async () => {
    seatState.loadFails = new Error('no such figure')
    const { host } = await mount()
    expect(host.textContent).toContain(`${zh.readError}no such figure`)
    expect(currentProps().page?.dataUrl).toBe('data:image/png;base64,page1')
  })

  it('reports a failed read that is not an Error as its own text', async () => {
    seatState.loadFails = 'the socket died'
    const { host } = await mount()
    expect(host.textContent).toContain(`${zh.readError}the socket died`)
  })

  it('waits for a pane wide enough to render into, then follows a resize', async () => {
    paneWidth = 40
    const { host } = await mount()
    expect(surfaces).toHaveLength(0)
    expect(runtime.rendered).toEqual([])
    paneWidth = 900
    await act(async () => { notifyResize?.() })
    await settle()
    expect(currentProps().page?.dataUrl).toBe('data:image/png;base64,page1')
    expect(host.textContent).toContain('page 600')
  })

  it('asks the parser for the device pixels the page covers, with a whole spare', async () => {
    // 800px pane, 24px inset, 600pt page, at the width one raster step serves. The
    // page is drawn at that width, so the raster is that width in device pixels,
    // times the spare that keeps the fractional fit from softening it.
    await mount()
    expect(defined(runtime.rendered[0]).scale).toBeCloseTo(((stepped(800) - 24) * 1 * 1.5) / 600, 3)
    vi.stubGlobal('devicePixelRatio', 3)
    paneWidth = 1000
    await act(async () => { notifyResize?.() })
    await settle()
    // Denser than 2 is not worth the pixels, and the fit ceiling stops the page
    // growing before the pane does — so the raster is sized for 900, not for 1000.
    expect(defined(runtime.rendered[runtime.rendered.length - 1]).scale)
      .toBeCloseTo((600 * 1.5 * 2 * 1.5) / 600, 3)
    vi.stubGlobal('devicePixelRatio', 0)
    paneWidth = 800
    await act(async () => { notifyResize?.() })
    await settle()
    // A display that reports nothing still renders at 1:1, with the spare.
    expect(defined(runtime.rendered[runtime.rendered.length - 1]).scale)
      .toBeCloseTo(((stepped(800) - 24) * 1 * 1.5) / 600, 3)
  })

  it('stops paying for pixels past the width the page is actually drawn at', async () => {
    // Fit width will not blow a small page up past its ceiling, so past that point a
    // wider pane buys no more drawn pixels. A raster that kept growing would be
    // megabytes of detail the pane never shows.
    await mount()
    paneWidth = 1400
    await act(async () => { notifyResize?.() })
    await settle()
    paneWidth = 2000
    await act(async () => { notifyResize?.() })
    await settle()
    const last = runtime.rendered[runtime.rendered.length - 1]
    expect(defined(last).scale).toBeCloseTo((600 * 1.5 * 1 * 1.5) / 600, 3)
  })

  it('serves a whole width step, so a dragged pane does not rasterize every pixel', async () => {
    await mount()
    expect(runtime.rendered).toHaveLength(1)
    // Stretching the pane inside the step it is already rendered for costs nothing.
    paneWidth = 830
    await act(async () => { notifyResize?.() })
    await settle()
    expect(runtime.rendered).toHaveLength(1)
    // Crossing into the next step asks for one more raster.
    paneWidth = 900
    await act(async () => { notifyResize?.() })
    await settle()
    expect(runtime.rendered).toHaveLength(2)
    expect(defined(runtime.rendered[1]).scale).toBeCloseTo((600 * 1.5 * 1 * 1.5) / 600, 3)
  })

  it('leaves the page on screen while the raster for the new width is drawn', async () => {
    // Blanking the pane first is what made a drag flash: the page that is already
    // there stays up until the replacement exists.
    const { host } = await mount()
    expect(currentProps().page?.dataUrl).toBe('data:image/png;base64,page1')
    runtime.deferRender = true
    paneWidth = 1200
    await act(async () => { notifyResize?.() })
    await settle()
    expect(host.textContent).not.toContain(zh.pdfRendering)
    expect(currentProps().page?.dataUrl).toBe('data:image/png;base64,page1')
    runtime.settleRender?.()
    await settle()
    expect(defined(runtime.rendered[runtime.rendered.length - 1]).scale)
      .toBeCloseTo((600 * 1.5 * 1 * 1.5) / 600, 3)
  })
})

describe('paging', () => {
  it('keeps the choice to annotate across pages', async () => {
    // The page body is remounted per page, so the document keeps the choice; a
    // reader paging through a document is not put back into viewing mode each time.
    const { host } = await mount()
    await edit([mark('m1', 1)])
    expect(currentProps().mode).toBe('view')
    currentProps().onModeChange?.('annotate')
    await settle()
    expect(currentProps().mode).toBe('annotate')
    await click(button(host, zh.nextPage))
    expect(currentProps().mode).toBe('annotate')
  })

  it('opens ready to edit a document that already carries marks', async () => {
    seatState.loaded = {
      path: '/w/report.pdf',
      mediaType: 'application/pdf',
      sha256: 'a'.repeat(64),
      annotation: {
        version: 1,
        figure: { address: 'a', path: '/w/report.pdf', mediaType: 'application/pdf', sha256: 'a'.repeat(64), pageCount: 3 },
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        marks: [mark('saved1', 1)],
      },
      unreadable: [],
    }
    await mount()
    expect(currentProps().mode).toBe('annotate')
    })

  it('walks the document with the toolbar, and stops at both ends', async () => {
    const { host } = await mount()
    expect(button(host, zh.previousPage).disabled).toBe(true)
    await click(button(host, zh.nextPage))
    expect(host.textContent).toContain('2 / 3')
    expect(runtime.rendered.map(entry => entry.page)).toContain(2)
    await click(button(host, zh.nextPage))
    expect(host.textContent).toContain('3 / 3')
    expect(button(host, zh.nextPage).disabled).toBe(true)
    await click(button(host, zh.previousPage))
    expect(host.textContent).toContain('2 / 3')
  })

  it('keeps the page on screen while the next one is drawn, instead of emptying the pane', async () => {
    // Emptying the pane for as long as a raster takes is the flash a page turn
    // was: the page already on screen stays until its replacement exists.
    const { host } = await mount()
    expect(currentProps().page?.dataUrl).toBe('data:image/png;base64,page1')
    runtime.deferRender = true
    await click(button(host, zh.nextPage))
    expect(host.textContent).toContain('2 / 3')
    expect(host.textContent).not.toContain(zh.pdfRendering)
    expect(currentProps().page?.dataUrl).toBe('data:image/png;base64,page1')
    runtime.settleRender?.()
    await settle()
    expect(currentProps().page?.dataUrl).toBe('data:image/png;base64,page2')
  })

  it('files a page’s edits under the page they were drawn on, not the one being fetched', async () => {
    // The pane can be a page behind the number in the toolbar, and a mark drawn
    // then belongs to the pixels under the pointer.
    const { host } = await mount()
    runtime.deferRender = true
    await click(button(host, zh.nextPage))
    expect(host.textContent).toContain('2 / 3')
    await edit([mark('m1', 1)])
    runtime.settleRender?.()
    await settle()
    expect(currentProps().page?.dataUrl).toBe('data:image/png;base64,page2')
    expect(currentProps().draft?.marks).toEqual([])
    runtime.deferRender = false
    await click(button(host, zh.previousPage))
    expect(currentProps().draft?.marks).toEqual([mark('m1', 1)])
  })

  it('hands the annotator body one report callback, so a draft cannot loop', async () => {
    // The body reports its draft from an effect keyed on this callback; an
    // inline arrow would change identity every render, report again, and store
    // state — "Maximum update depth exceeded" in the browser.
    await mount()
    expect(new Set(callbacks).size).toBe(1)
    expect(renders).toBeLessThan(8)
  })

  it('keeps each page its own marks while another page is on screen', async () => {
    const { host } = await mount()
    await edit([mark('m1', 1)])
    expect(host.textContent).toContain('marks 1')
    await click(button(host, zh.nextPage))
    expect(host.textContent).toContain('marks 0')
    await edit([mark('m9', 2)])
    await click(button(host, zh.previousPage))
    expect(host.textContent).toContain('marks 1')
  })

  it('keeps the marks a saved document carried, and warns when the file changed', async () => {
    seatState.loaded = {
      path: '/w/report.pdf',
      mediaType: 'application/pdf',
      sha256: 'a'.repeat(64),
      annotation: {
        version: 1,
        figure: { address: 'a', path: '/w/report.pdf', mediaType: 'application/pdf', sha256: 'b'.repeat(64), pageCount: 3 },
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        marks: [mark('saved1', 1), mark('saved2', 3)],
        summary: '已保存的总体说明',
      },
      unreadable: [],
    }
    const { host } = await mount()
    expect(host.textContent).toContain(zh.stale)
    expect(host.textContent).toContain('marks 1')
    expect(currentProps().summary).toBe('已保存的总体说明')
    await click(button(host, zh.nextPage))
    await click(button(host, zh.nextPage))
    expect(host.textContent).toContain('marks 1')
    expect(host.textContent).toContain('3 / 3')
  })

  it('puts a saved mark that names no page on the first one', async () => {
    // A single-surface figure's document read against a PDF has no page numbers at
    // all; its marks belong on the page the reader is looking at.
    seatState.loaded = {
      path: '/w/report.pdf',
      mediaType: 'application/pdf',
      sha256: 'a'.repeat(64),
      annotation: {
        version: 1,
        figure: { address: 'a', path: '/w/report.pdf', mediaType: 'application/pdf', sha256: 'a'.repeat(64), pageCount: 3 },
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        marks: [{ id: 'pageless', kind: 'rect', color: '#1971c2', points: [[1, 2], [3, 4]] }],
      },
      unreadable: [],
    }
    const { host } = await mount()
    expect(host.textContent).toContain('marks 1')
    await edit([{ id: 'pageless', kind: 'rect', color: '#1971c2', points: [[1, 2], [3, 4]], page: 1 }])
    await click(button(host, zh.sendToAgent))
    expect(defined(seatState.saves[0]).input.marks).toEqual([{ id: 'pageless', kind: 'rect', color: '#1971c2', points: [[1, 2], [3, 4]], page: 1 }])
  })

  it('reads nothing, and saves nothing, without an address', async () => {
    const { host } = await mount({ resourceAddress: undefined })
    expect(seatState.loads).toEqual([])
    await edit([mark('m1', 1)])
    await click(button(host, zh.sendToAgent))
    expect(seatState.saves).toEqual([])
    expect(host.textContent).toContain(zh.notReady)
  })

  it('shows one page and disables both ways when the document reports no pages', async () => {
    runtime.pages = 0
    const { host } = await mount()
    expect(host.textContent).toContain('1 / 0')
    expect(button(host, zh.previousPage).disabled).toBe(true)
    expect(button(host, zh.nextPage).disabled).toBe(true)
    await click(button(host, zh.nextPage))
    expect(host.textContent).toContain('1 / 0')
  })

  it('does not warn when the document on disk is the one that was annotated', async () => {
    seatState.loaded = {
      path: '/w/report.pdf',
      mediaType: 'application/pdf',
      sha256: 'a'.repeat(64),
      annotation: {
        version: 1,
        figure: { address: 'a', path: '/w/report.pdf', mediaType: 'application/pdf', sha256: 'a'.repeat(64), pageCount: 3 },
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        marks: [mark('saved1', 1)],
      },
      unreadable: [],
    }
    const { host } = await mount()
    expect(host.textContent).not.toContain(zh.stale)
  })
})

describe('the shell around the document', () => {
  it('reads the sidecar once, however often the shell renders the tab', async () => {
    // A slot's injected face is built again on every render of the tab. The read
    // is keyed on the document, so the same document is read once — otherwise the
    // pane re-reads, and re-renders, for as long as the shell keeps rendering.
    const { root } = await mount()
    expect(seatState.loads).toHaveLength(1)
    await rerender(root, {})
    await rerender(root, {})
    expect(seatState.loads).toHaveLength(1)
  })

  it('keeps the reader’s unsaved work across a shell re-render', async () => {
    // The document on disk carries one mark on page one; the reader adds one on
    // page two and types a note. A re-read would replace both with what is saved.
    seatState.loaded = {
      path: '/w/report.pdf',
      mediaType: 'application/pdf',
      sha256: 'a'.repeat(64),
      annotation: {
        version: 1,
        figure: { address: 'a', path: '/w/report.pdf', mediaType: 'application/pdf', sha256: 'a'.repeat(64), pageCount: 3 },
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        marks: [mark('saved1', 1)],
      },
      unreadable: [],
    }
    const { host, root } = await mount()
    await click(button(host, zh.nextPage))
    await edit([mark('m2', 2)])
    currentProps().onSummaryChange?.('两份附图一起改')
    await settle()
    // Both pages' marks survive, counted across the document rather than on the
    // page in view: the numbering map is the document's own count.
    expect(currentProps().numbering?.size).toBe(2)
    await rerender(root, {})
    expect(currentProps().summary).toBe('两份附图一起改')
    expect(currentProps().numbering?.size).toBe(2)
  })

  it('still reads the document again when the tab moves to another one', async () => {
    const { root } = await mount()
    seatState.loaded = { path: '/w/other.pdf', mediaType: 'application/pdf', sha256: 'a'.repeat(64), annotation: null,
      unreadable: [],
    }
    await rerender(root, { resourceAddress: 'dsh-resource://file/session/s1/other.pdf' })
    expect(seatState.loads).toEqual([
      'dsh-resource://file/session/s1/report.pdf',
      'dsh-resource://file/session/s1/other.pdf',
    ])
  })
})

describe('saving the document', () => {
  it('writes every page into the document, and the annotated document beside it', async () => {
    const { host } = await mount()
    await edit([mark('m1', 1)])
    await click(button(host, zh.nextPage))
    await edit([mark('m3', 2)])
    await click(button(host, zh.sendToAgent))
    const saved = defined(seatState.saves[0])
    expect(saved.address).toBe('dsh-resource://file/session/s1/report.pdf')
    expect(saved.input.figure).toEqual({
      address: 'dsh-resource://file/session/s1/report.pdf',
      path: '/w/report.pdf',
      mediaType: 'application/pdf',
      sha256: 'a'.repeat(64),
      pageCount: 3,
    })
    // The page stamp is the document's own: each surface holds its marks without
    // one, and the document is what knows which page they belong to.
    expect(saved.input.marks.map(entry => [entry.page, entry.id])).toEqual([[1, 'm1'], [2, 'm3']])
    expect(defined(saved.input.marks[0]).points).toEqual(defined(mark('m1', 1)).points)
    // The writer is asked for just the pages that carry marks, each with the
    // transform that carries its page units back into the document.
    expect(defined(writer.calls[0]).map(entry => [entry.page, entry.transform, entry.marks.length]))
      .toEqual([[1, [1, 0, 0, -1, 0, 1], 1], [2, [1, 0, 0, -1, 0, 2], 1]])
    expect(new TextDecoder().decode(saved.bytes)).toBe('%PDF-1.7 annotated')
    expect(host.textContent).toContain(zh.sent)
    // Delivered means done: the sidecars are removed so a reload cannot revive them.
    expect(seatState.discards).toContain('dsh-resource://file/session/s1/report.pdf')
  })

  it('falls back to the marks file when the save wrote no annotated copy', async () => {
    seatState.saved = { annotationPath: '/w/report.pdf.annot.json', reviewPath: null }
    const { host } = await mount()
    await edit([mark('m1', 1)])
    await click(button(host, zh.sendToAgent))
    expect(host.textContent).toContain(zh.sent)
  })

  it('sends the document, its annotated copy and a picture of every marked page', async () => {
    const { host } = await mount()
    await edit([mark('m1', 1)])
    await click(button(host, zh.nextPage))
    await click(button(host, zh.nextPage))
    await edit([mark('m3', 3)])
    await click(button(host, zh.sendToAgent))
    const sent = defined(seatState.sends[0])
    expect(sent.input.marks.map(entry => entry.page)).toEqual([1, 3])
    expect(sent.images.map(entry => [entry.page, entry.width, entry.height]))
      .toEqual([[1, 600, 800], [3, 600, 800]])
    expect(sent.images[0]?.dataUrl).toBe('data:image/png;base64,page1')
    expect(new TextDecoder().decode(sent.bytes)).toBe('%PDF-1.7 annotated')
    // A page rendered for the session is rendered at twice the page's own size:
    // the export draws the marks onto it at that factor.
    expect(defined(runtime.rendered[runtime.rendered.length - 1]).scale).toBe(2)
    expect(host.textContent).toContain(zh.sent)
  })

  it('says what the delivery could not do', async () => {
    seatState.warnings = ['带批注 PDF 未随消息发送。']
    const { host } = await mount()
    await edit([mark('m1', 1)])
    await click(button(host, zh.sendToAgent))
    expect(host.textContent).toContain('带批注 PDF 未随消息发送。')
  })

  it('reports a failed save, and a failure that is not an Error', async () => {
    seatState.saveFails = new Error('the disk is full')
    const first = await mount()
    await edit([mark('m1', 1)])
    await click(button(first.host, zh.sendToAgent))
    expect(first.host.textContent).toContain(`${zh.saveError}the disk is full`)
    seatState.saveFails = 'the socket died'
    const second = await mount()
    await edit([mark('m1', 1)])
    await click(button(second.host, zh.sendToAgent))
    expect(second.host.textContent).toContain(`${zh.saveError}the socket died`)
  })

  it('reports a failed delivery', async () => {
    seatState.sendFails = new Error('the session refused the annotation message')
    const { host } = await mount()
    await edit([mark('m1', 1)])
    await click(button(host, zh.sendToAgent))
    expect(host.textContent).toContain(`${zh.saveError}the session refused the annotation message`)
  })

  it('says so when the sidecars could not be deleted after delivery, and still clears', async () => {
    seatState.discardFails = new Error('the disk is read-only')
    const { host } = await mount()
    await edit([mark('m1', 1)])
    await click(button(host, zh.sendToAgent))
    // The marks leave the panel either way; a surviving sidecar is reported rather
    // than hidden, because it would reappear on the next open.
    expect(host.textContent).toContain(`${zh.clearError}the disk is read-only`)
    // A refusal that is not an Error still has to be reported as itself.
    seatState.discardFails = 'the socket died'
    const second = await mount()
    await edit([mark('m1', 1)])
    await click(button(second.host, zh.sendToAgent))
    expect(second.host.textContent).toContain(`${zh.clearError}the socket died`)
  })

  it('writes the document into the composer, with a picture of every marked page', async () => {
    const { host } = await mount()
    await edit([mark('m1', 1)])
    await click(button(host, zh.nextPage))
    await click(button(host, zh.nextPage))
    await edit([mark('m3', 3)])
    await click(button(host, zh.sendToComposer))
    const composed = defined(seatState.composes[0])
    expect(composed.input.marks.map(entry => entry.page)).toEqual([1, 3])
    expect(composed.images.map(entry => [entry.page, entry.width, entry.height]))
      .toEqual([[1, 600, 800], [3, 600, 800]])
    // Nothing was sent: a draft is the reader's to send.
    expect(seatState.sends).toEqual([])
    expect(host.textContent).toContain(zh.composed)
    expect(seatState.discards).toHaveLength(1)
  })

  it('reports a draft the composer would not take', async () => {
    seatState.composeFails = new Error('the conversation service is unavailable')
    const { host } = await mount()
    await edit([mark('m1', 1)])
    await click(button(host, zh.sendToComposer))
    expect(host.textContent).toContain(`${zh.saveError}the conversation service is unavailable`)
  })

  it('saves nothing when no page carries a mark', async () => {
    const { host } = await mount()
    await click(button(host, zh.sendToAgent))
    await click(button(host, zh.sendToAgent))
    expect(seatState.saves).toEqual([])
    expect(seatState.sends).toEqual([])
    expect(writer.calls).toEqual([])
    expect(host.textContent).not.toContain(zh.sent)
  })

  it('sends the one mark the pill is about, and keeps the rest of the document', async () => {
    // The pill's buttons sit beside one sentence. On a paged document the page body
    // has no seat for the save, so the hand-off has to come up here — and it must
    // keep the other pages, whose marks the reader never pointed at.
    const { host } = await mount()
    await edit([mark('m1', 1)])
    await click(button(host, zh.nextPage))
    await edit([mark('m3', 2)])
    const page = defined(surfaces[surfaces.length - 1])
    // The page body is handed the document's door for a one-mark send.
    expect(page.onSendMark).toBeDefined()
    await act(async () => {
      page.onSendMark?.(mark('m1', 1), 'agent')
      for (let turn = 0; turn < 12; turn += 1) await Promise.resolve()
    })
    // What travelled is the one mark, saved as a document of one mark.
    const saved = defined(seatState.saves[seatState.saves.length - 1])
    expect(saved.input.marks.map(entry => entry.id)).toEqual(['m1'])
    expect(host.textContent).toContain(zh.sentOne)
    // The other page's mark is still the document's, and the sidecar was not
    // deleted: this was not a delivery of the whole document.
    expect(seatState.discards).toHaveLength(0)
  })

  it('writes the one mark the pill is about into the composer, and keeps the rest', async () => {
    // The other half of the one-mark hand-off: a draft is not a delivery, so the same
    // rule has to hold there — one sentence in, every other page still on the panel.
    const { host } = await mount()
    await edit([mark('m1', 1)])
    await click(button(host, zh.nextPage))
    await edit([mark('m3', 2)])
    const page = defined(surfaces[surfaces.length - 1])
    await act(async () => {
      page.onSendMark?.(mark('m3', 2), 'composer')
      for (let turn = 0; turn < 12; turn += 1) await Promise.resolve()
    })
    expect(defined(seatState.composes[0]).input.marks.map(entry => entry.id)).toEqual(['m3'])
    expect(host.textContent).toContain(zh.composedOne)
    expect(seatState.sends).toEqual([])
    expect(seatState.discards).toHaveLength(0)
  })

  it('clears the whole document from a page, so no page is left holding a deleted file', async () => {
    // One sidecar serves every page, so a page's own clear would delete it while the
    // other pages kept their rows — half a document, and the file damaged doing it.
    // The page body therefore asks the document rather than clearing itself.
    await mount()
    await edit([mark('m1', 1)])
    const page = defined(surfaces[surfaces.length - 1])
    expect(page.onDocumentClear).toBeDefined()
    await act(async () => {
      page.onDocumentClear?.()
      for (let turn = 0; turn < 12; turn += 1) await Promise.resolve()
    })
    expect(seatState.discards).toEqual(['dsh-resource://file/session/s1/report.pdf'])
    // Every page let go of its marks, not just the one that asked: the document's
    // own copy of the marks is what the pages are handed, and it is now empty.
    const after = defined(surfaces[surfaces.length - 1])
    expect(after.draft?.marks).toEqual([])
  })

  it('says so when the document facts are not known yet', async () => {
    // Without the Host's own facts there is nothing to write an annotation against,
    // so the action reports rather than silently doing nothing.
    const { host } = await mount({ content: { kind: 'text' } })
    // The strip's hand-off is pressable whatever the document holds: the guard in
    // the handler is what decides, and it is the guard that has a reason to report.
    await click(button(host, zh.sendToAgent))
    expect(host.textContent).toContain(zh.notReady)
  })
})

describe('lifetime', () => {
  it('releases the document when the body is unmounted', async () => {
    const { root } = await mount()
    await act(async () => { root.unmount() })
    expect(runtime.destroyed).toBe(1)
  })

  it('releases a document that arrived after the body was already gone', async () => {
    runtime.deferOpen = true
    const { root } = await mount()
    await act(async () => { root.unmount() })
    runtime.settleOpen?.()
    await settle()
    expect(runtime.destroyed).toBe(1)
  })

  it('drops a page that finished rendering after the body was gone', async () => {
    runtime.deferRender = true
    const { host, root } = await mount()
    expect(host.textContent).toContain(zh.pdfRendering)
    await act(async () => { root.unmount() })
    runtime.settleRender?.()
    await settle()
    // The bitmap belongs to a body that no longer exists, so it is never painted.
    expect(host.textContent).toBe('')
    expect(surfaces).toHaveLength(0)
  })

  it('drops a read that failed after the body moved on', async () => {
    // The same answer, refused instead of delivered: an error the tab has moved
    // away from is not the page it now shows.
    const waiting: { fail?: (reason: unknown) => void } = {}
    const seat = stubSeat()
    const slow: DocumentSeat = {
      ...seat,
      load: (): Promise<never> => new Promise<never>((_resolve, reject) => { waiting.fail = reject }),
    }
    const { host, root } = await mount({ seat: slow })
    await rerender(root, { resourceAddress: undefined })
    waiting.fail?.(new Error('the socket died'))
    await settle()
    expect(host.textContent).not.toContain(zh.readError)
  })

  it('drops an annotation whose read finished after the body moved on', async () => {
    // The tab moved to another document while the read was in flight: the answer
    // belongs to the body that asked for it, so it is dropped rather than shown
    // against the document now on screen.
    const waiting: { release?: () => void } = {}
    const seat = stubSeat()
    const slow: DocumentSeat = {
      ...seat,
      load: async (address, signal) => {
        await new Promise<void>((resolve) => { waiting.release = resolve })
        return await seat.load(address, signal)
      },
    }
    const { host, root } = await mount({ seat: slow })
    await rerender(root, { resourceAddress: undefined })
    waiting.release?.()
    await settle()
    // Without the Host's facts there is nothing to save, which is what the dropped
    // answer leaves behind.
    await edit([mark('m1', 1)])
    await click(button(host, zh.sendToAgent))
    expect(seatState.saves).toEqual([])
    expect(host.textContent).toContain(zh.notReady)
  })
})

describe('keeping a draft', () => {
  it('writes the document\u2019s marks without the annotated copy, so a reload finds them', async () => {
    await mount()
    await edit([mark('m1', 1)])
    await waitForSave()
    const draft = defined(seatState.drafts[0])
    expect(draft.address).toBe('dsh-resource://file/session/s1/report.pdf')
    expect(draft.input.marks.map(entry => [entry.page, entry.id])).toEqual([[1, 'm1']])
    // The annotated copy is derived from the marks; writing it on every pause would
    // run the PDF writer for a file a reload never reads.
    expect(seatState.saves).toEqual([])
  })

  it('does not write back what it just read', async () => {
    seatState.loaded = {
      path: '/w/report.pdf',
      mediaType: 'application/pdf',
      sha256: 'a'.repeat(64),
      annotation: {
        version: 1,
        figure: { address: 'dsh-resource://file/session/s1/report.pdf', path: '/w/report.pdf', mediaType: 'application/pdf', sha256: 'a'.repeat(64), pageCount: 3 },
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        marks: [mark('m1', 1)],
      },
      unreadable: [],
    }
    const { host } = await mount()
    await settle()
    await waitForSave()
    // Opening a document is a read; the marks were already on disk before it opened.
    expect(seatState.drafts).toEqual([])
    expect(host.textContent).toContain('marks 1')
  })

  it('writes once for a burst of edits rather than once per edit', async () => {
    await mount()
    await edit([mark('m1', 1)])
    await edit([mark('m1', 1), mark('m2', 1)])
    await edit([mark('m1', 1), mark('m2', 1), mark('m3', 2)])
    await waitForSave()
    expect(seatState.drafts).toHaveLength(1)
    expect(defined(seatState.drafts[0]).input.marks).toHaveLength(3)
  })

  it('deletes the sidecar when the last mark on the last page is removed', async () => {
    // The same failure the single-surface body had: an empty document used to write
    // nothing, leaving the sidecar to describe a mark that was no longer there.
    await mount()
    await edit([mark('m1', 1)])
    await waitForSave()
    expect(seatState.drafts).toHaveLength(1)
    // Clearing the document is what a reader does to forget it; the delete is the
    // only thing that makes it stay forgotten across a reload.
    seatState.discards.length = 0
    await edit([])
    await settle()
    await waitForSave()
    expect(seatState.discards).toContain('dsh-resource://file/session/s1/report.pdf')
  })

  it('flushes a pending write when the page is going away', async () => {
    await mount()
    await edit([mark('m1', 1)])
    // Before the debounce would have fired: the reload is the deadline.
    window.dispatchEvent(new Event('pagehide'))
    await settle()
    expect(seatState.drafts).toHaveLength(1)
  })

  it('flushes a pending write when the body unmounts', async () => {
    const { root } = await mount()
    await edit([mark('m1', 1)])
    await act(async () => { root.unmount() })
    roots = []
    await settle()
    expect(seatState.drafts).toHaveLength(1)
  })

  it('reports a failed write, and keeps the marks on screen', async () => {
    seatState.draftFails = new Error('the disk is full')
    const { host } = await mount()
    await edit([mark('m1', 1)])
    await waitForSave()
    expect(host.textContent).toContain(`${zh.saveError}the disk is full`)
    expect(host.textContent).toContain('marks 1')
  })

  it('reports a failure that is not an Error as its own text', async () => {
    seatState.draftFails = 'nope'
    const { host } = await mount()
    await edit([mark('m1', 1)])
    await waitForSave()
    expect(host.textContent).toContain(`${zh.saveError}nope`)
  })

  it('does not write the document back after it was delivered', async () => {
    const { host } = await mount()
    await edit([mark('m1', 1)])
    await click(button(host, zh.sendToAgent))
    await settle()
    await waitForSave()
    // Delivery is a DELETE plus a message; the marks are gone, so there is nothing
    // left for a write to keep, and one would put the sidecar back.
    expect(seatState.saves).toHaveLength(1)
    expect(seatState.drafts).toEqual([])
  })
})

describe('paging by hand', () => {
  /** Press one key on the window, the way a reader's keyboard does. */
  async function press(key: string, target: EventTarget = window): Promise<void> {
    await act(async () => {
      target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
      for (let turn = 0; turn < 8; turn += 1) await Promise.resolve()
    })
    await settle()
  }

  /** The page-number control: a label until it is pressed, a box after. */
  function pageControl(host: HTMLElement): HTMLButtonElement {
    const found = host.querySelector<HTMLButtonElement>('.da-page-btn')
    if (found === null) throw new Error('no page number')
    return found
  }

  it('turns the page with the arrow keys, and stops at both ends', async () => {
    const { host } = await mount()
    await press('ArrowRight')
    expect(host.textContent).toContain('2 / 3')
    await press('PageDown')
    expect(host.textContent).toContain('3 / 3')
    await press('PageDown')
    expect(host.textContent).toContain('3 / 3')
    await press('ArrowLeft')
    expect(host.textContent).toContain('2 / 3')
  })

  it('jumps to either end with Home and End', async () => {
    const { host } = await mount()
    await press('End')
    expect(host.textContent).toContain('3 / 3')
    await press('Home')
    expect(host.textContent).toContain('1 / 3')
  })

  it('leaves the keys it does not own to the shell', async () => {
    const { host } = await mount()
    await press('a')
    expect(host.textContent).toContain('1 / 3')
  })

  it('leaves the arrow keys alone while the reader is typing', async () => {
    // The page box is a field: an arrow there moves the caret, not the document.
    const { host } = await mount()
    await click(pageControl(host))
    const box = required(host.querySelector('input'))
    await press('ArrowRight', box)
    // The box is still open and still says the page it opened on: the arrow moved
    // the caret, not the document.
    expect(box?.getAttribute('value') ?? box?.value).toBe('1')
  })

  it('leaves the arrow keys alone in a note field and in an editable region', async () => {
    // The two other kinds of field the panel has: the note boxes, which are text
    // areas, and a rendered document, whose frame can edit. Neither should turn a
    // page out from under the caret.
    const { host } = await mount()
    for (const field of ['textarea', 'contenteditable', 'select']) {
      const element = document.createElement(field === 'contenteditable' ? 'div' : field)
      if (field === 'contenteditable') element.setAttribute('contenteditable', 'true')
      document.body.append(element)
      await press('PageDown', element)
      element.remove()
      expect(host.textContent).toContain('1 / 3')
    }
  })

  it('takes a page number from the box', async () => {
    const { host } = await mount()
    await click(pageControl(host))
    const box = required(host.querySelector('input'))
    await act(async () => { typeInto(box, '3') })
    await press('Enter', box)
    expect(host.textContent).toContain('3 / 3')
    expect(currentProps().page?.dataUrl).toBe('data:image/png;base64,page3')
  })

  it('puts the box back when the reader leaves it without a page', async () => {
    const { host } = await mount()
    for (const text of ['nonsense', '']) {
      await click(pageControl(host))
      const box = required(host.querySelector('input'))
      await act(async () => {
        typeInto(box, text)
        // React listens for the bubbling focusout, not for blur itself.
        box.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
        for (let turn = 0; turn < 8; turn += 1) await Promise.resolve()
      })
      await settle()
      expect(host.textContent).toContain('1 / 3')
    }
  })

  it('puts the box back on Escape', async () => {
    const { host } = await mount()
    await click(pageControl(host))
    const box = required(host.querySelector('input'))
    await act(async () => { typeInto(box, '2') })
    await press('Escape', box)
    // Escape put the box back to the page on screen, and the label is back.
    expect(host.querySelector('.da-page-btn')?.textContent).toBe('1 / 3')
  })
})

describe('the wheel over the page', () => {
  /**
   * One wheel gesture on the panel.
   *
   * The wheel is the magnification now, and it is the page body that owns the
   * magnification — so what this document must not do is read the same motion as a
   * page turn. The gesture used to mean "next page at the edge of one", which is
   * exactly the ambiguity a reader felt: over a page that fits the pane there is
   * nothing to scroll, so a wheel had no other reading available to it.
   */
  async function wheel(host: HTMLElement, deltaY: number): Promise<void> {
    await act(async () => {
      host.querySelector('.da-pdf')?.dispatchEvent(
        new WheelEvent('wheel', { deltaY, bubbles: true, cancelable: true }),
      )
      for (let turn = 0; turn < 8; turn += 1) await Promise.resolve()
    })
  }

  it('never turns a page, whichever way it is pushed', async () => {
    const { host } = await mount()
    await wheel(host, 40)
    await wheel(host, 400)
    expect(host.textContent).toContain('1 / 3')
    await click(button(host, copy('nextPage')))
    await settle()
    await wheel(host, -40)
    await wheel(host, -400)
    expect(host.textContent).toContain('2 / 3')
  })

  it('leaves the page turn to the keys', async () => {
    // The keyboard is where paging lives now: both axes, so the hand that reaches
    // for the arrow keys finds the same gesture whichever way it thinks of "next".
    const { host } = await mount()
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
      for (let turn = 0; turn < 8; turn += 1) await Promise.resolve()
    })
    await settle()
    expect(host.textContent).toContain('2 / 3')
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
      for (let turn = 0; turn < 8; turn += 1) await Promise.resolve()
    })
    await settle()
    expect(host.textContent).toContain('1 / 3')
  })
})

describe('the strip before the first page arrives', () => {
  // The pane has no page body yet to carry its bar, so it stands one in: the page
  // count and the hand-off answer before the first raster, and the reader who cannot
  // draw yet can still be told why.
  it('offers the hand-off from its own strip, and reports that it has nothing yet', async () => {
    const { host } = await mount({ content: { kind: 'text' } })
    const strip = required(host.querySelector<HTMLElement>('.da-bar'))
    await click(button(strip, zh.sendToComposer))
    expect(host.textContent).toContain(zh.notReady)
  })
})

describe('one bar, on the pane', () => {
  // The bar belongs to the pane, not to a page: a bar drawn inside a page would
  // scroll away with it, and paging would carry the controls off screen.
  it('hands the pane’s own node to the page body, not the page’s', async () => {
    const { host } = await mount()
    await settle()
    const pane = required(host.querySelector<HTMLElement>('.da-pdf'))
    const body = currentProps()
    expect(body.chromeHost).toBe(pane)
  })

  it('carries the paging the document drew, and the hand-off with it', async () => {
    await mount()
    const body = currentProps()
    expect(body.pagingSlot).toBeTruthy()
  })
})

describe('the document’s own magnification', () => {
  // A file's pages are one picture in several sheets, so the factor belongs to the
  // document: a page that kept its own would restart at fit on every turn.
  it('hands the factor to the page body, so every page is drawn at one size', async () => {
    await mount()
    expect(currentProps().onZoom).toBeTypeOf('function')
    expect(currentProps().zoom).toBe('fit')
  })
})

describe('the document magnified', () => {
  it('scales every page together instead of one at a time', async () => {
    await mount()
    const body = currentProps()
    // The body takes its factor from the document and reports every gesture back.
    defined(body.onZoom)(2)
    await settle()
    expect(currentProps().zoom).toBe(2)
  })
})

describe('marking across the whole document', () => {
  it('drops a mark from whichever page it was drawn on', async () => {
    const { host } = await mount()
    await edit([mark('m1', 1)])
    await click(button(host, zh.nextPage))
    await edit([mark('m9', 2)])
    await click(button(host, zh.previousPage))
    // The list is the file's, so its delete can name a mark on a page not in view.
    const body = currentProps()
    expect(body.documentMarks?.map(entry => entry.id)).toEqual(['m1', 'm9'])
    defined(body.onDocumentRemove)('m9')
    await settle()
    expect(currentProps().documentMarks?.map(entry => entry.id)).toEqual(['m1'])
  })
})

describe('a row of the list that names another page', () => {
  // The list is the document's, so its rows name marks the reader is not looking at.
  // Pressing one has to take them there and open its comment, or the list is a
  // table of contents without the going.
  it('turns to the page a mark is on, with that mark already selected', async () => {
    const { host } = await mount()
    await edit([mark('m1', 1)])
    await click(button(host, zh.nextPage))
    await edit([mark('m9', 2)])
    await settle()
    expect(host.textContent).toContain('2 / 3')
    // The row for the mark back on page 1, reached the way the list reaches it.
    await act(async () => { defined(currentProps().onRevealMark)(mark('m1', 1)) })
    await settle()
    expect(host.textContent).toContain('1 / 3')
    // Selected at the same moment as the turn, so the page that arrives carries the
    // comment pill already: selecting after the remount would need a second render.
    expect(currentProps().selectedId).toBe('m1')
  })

  it('stays put for a mark that names no page', async () => {
    // A figure drawn on a page always carries one; a mark that somehow does not must
    // not send the reader to page one, which is where an unclamped turn would land.
    const { host } = await mount()
    await click(button(host, zh.nextPage))
    await settle()
    // A mark with no page at all, which is what a plain figure's marks look like.
    const bare: AnnotationMark = { id: 'm1', kind: 'rect', color: '#1971c2', points: [[10, 20], [60, 90]] }
    await act(async () => { defined(currentProps().onRevealMark)(bare) })
    await settle()
    expect(host.textContent).toContain('2 / 3')
    expect(currentProps().selectedId).toBe('m1')
  })
})

describe('dropping a mark that is not there', () => {
  // The list is the file's, so a delete can name a mark that is already gone — a
  // second press, or a page the reader cleared meanwhile. Nothing changes, and the
  // map that comes back is the same object so no page re-renders for nothing.
  it('leaves the marks alone when the id matches nothing', async () => {
    await mount()
    await edit([mark('m1', 1)])
    const before = currentProps().documentMarks
    defined(currentProps().onDocumentRemove)('ghost')
    await settle()
    expect(currentProps().documentMarks).toEqual(before)
  })
})
