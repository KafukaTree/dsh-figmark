// @vitest-environment jsdom
/** The document body: figure loading, editing, zoom, and the two save paths. */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AnnotationDocument, AnnotationMark, MarkAnchor } from '../src/shared/annotation'
import { ANNOTATION_VERSION, MAX_SUMMARY_CHARS } from '../src/shared/annotation'
import { AnnotatorBody, type AnnotatorBodyProps, type PageSurface, type SurfaceDraft } from '../src/client/AnnotatorBody'
import { en, zh } from '../src/client/locales'
import type { ComposerLike } from '../src/client/composer'
import type { SessionsLike } from '../src/client/session'
import type { RemoteLike } from '../src/client/host-actions'
import { AUTOSAVE_DELAY_MS } from '../src/client/autosave'
import { PINCH_SETTLE_DELAY_MS } from '../src/client/zoom'
import { readPreferences } from '../src/client/preferences'
import { STROKE_WIDTH } from '../src/client/render'
import { figureUnit } from '../src/client/scale'
import { reviewSize } from '../src/client/export'
import { STYLES } from '../src/client/styles'
import { defined, stubRasterizer, stubRect } from './dom'

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><text x="10" y="20">102</text></svg>'
const SVG_ADDRESS = 'dsh-resource://file/session/s1/fig.svg'
const ABSOLUTE_ADDRESS = 'dsh-resource://file/absolute//w/fig.svg'

/** The inline figure's bytes. */
function svgBytes(): Uint8Array {
  return new TextEncoder().encode(SVG)
}

/** What the host answers a successful read with. */
function hostPayload(answers: HostAnswers = {}): unknown {
  return {
    ok: true,
    figure: {
      path: '/w/fig.svg',
      mediaType: 'image/svg+xml',
      sha256: answers.sha256 ?? 'a'.repeat(64),
      workspace: answers.workspace === undefined ? '/w' : answers.workspace,
    },
    annotation: answers.annotation ?? null,
    ...(answers.unreadable === undefined ? {} : { unreadable: answers.unreadable }),
  }
}

const saved: AnnotationDocument = {
  version: ANNOTATION_VERSION,
  figure: {
    address: SVG_ADDRESS,
    path: '/w/fig.svg',
    mediaType: 'image/svg+xml',
    width: 200,
    height: 100,
    sha256: 'a'.repeat(64),
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  marks: [{ id: 'm1', kind: 'arrow', color: '#e03131', points: [[10, 10], [40, 30]], detail: '标号指错了' }],
  summary: '改标号',
}

/** A document whose only mark is a point, which has no stroke to weigh. */
const pointOnly: AnnotationDocument = {
  ...saved,
  marks: [{ id: 'p1', kind: 'point', color: '#e03131', points: [[100, 50]], detail: '图号在这里' }],
}

/**
 * A document whose only mark is an element, which has neither stroke nor pin.
 *
 * It carries no `weight`, and that is the point of the fixture: the mark names a
 * thing in the figure and draws the light on it, so there is no size for a rail to
 * set.
 */
const elementOnly: AnnotationDocument = {
  ...saved,
  marks: [{
    id: 'e1', kind: 'element', color: '#e03131', points: [[10, 10], [60, 40]],
    anchor: { tag: 'g', id: 'line2d_1', bbox: [10, 10, 50, 30], selector: '#line2d_1' },
  }],
}

/** One call the body made through fetch. */
interface Call {
  readonly url: string
  readonly init: RequestInit | undefined
}

/** What the stubbed host should answer. */
interface HostAnswers {
  readonly annotation?: AnnotationDocument | null
  readonly sha256?: string
  readonly readError?: string
  readonly saveError?: string
  /** Make the write reject with something that is not an Error. */
  readonly saveThrows?: unknown
  /** Make the removal fail: the sidecars outlive the panel. */
  readonly deleteError?: string
  /** Make the removal reject with something that is not an Error. */
  readonly deleteThrows?: unknown
  /** The Session directory the Host names, or null for one it cannot name. */
  readonly workspace?: string | null
  /** Sidecars the Host found and would not read. */
  readonly unreadable?: readonly string[]
}

/** Install the fetch stub answering as the host would. */
function stubFetch(answers: HostAnswers = {}): Call[] {
  const calls: Call[] = []
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url, init })
    const respond = (body: unknown, status = 200): { readonly json: () => Promise<unknown>; readonly status: number } =>
      ({ json: async () => body, status })
    if (init?.method === 'DELETE') {
      if (answers.deleteThrows !== undefined) throw answers.deleteThrows
      if (answers.deleteError !== undefined) return respond({ ok: false, error: answers.deleteError }, 500)
      return respond({ ok: true, removed: true })
    }
    if (init?.method === 'POST') {
      if (answers.saveThrows !== undefined) throw answers.saveThrows
      if (answers.saveError !== undefined) return respond({ ok: false, error: answers.saveError }, 400)
      return respond({
        ok: true,
        annotationPath: '/w/fig.annot.json',
        reviewPath: '/w/fig.annotated.png',
      })
    }
    if (answers.readError !== undefined) return respond({ ok: false, error: answers.readError }, 404)
    return respond(hostPayload(answers))
  }))
  return calls
}

/** A fetch stub whose answer the spec decides when to deliver. */
function deferredFetch(): {
  readonly signal: () => AbortSignal | null
  readonly answer: (body: unknown) => void
  readonly fail: (reason: unknown) => void
} {
  let settle: { readonly answer: (body: unknown) => void; readonly fail: (reason: unknown) => void } | null = null
  const signals: AbortSignal[] = []
  vi.stubGlobal('fetch', vi.fn((_url: string, init?: RequestInit) => {
    if (init?.signal !== undefined && init.signal !== null) signals.push(init.signal)
    return new Promise((resolve, reject) => {
      settle = {
        answer: (body) => { resolve({ json: async () => body, status: 200 }) },
        fail: reject,
      }
    })
  }))
  return {
    signal: () => signals[0] ?? null,
    answer: (body) => { settle?.answer(body) },
    fail: (reason) => { settle?.fail(reason) },
  }
}

/** A sessions service stub that records what it was asked to deliver. */
function stubSessions(): {
  readonly sessions: SessionsLike
  /** The same service seen from a session with no live binding. */
  readonly detached: SessionsLike
  readonly prompts: unknown[][]
  readonly sources: string[]
} {
  const prompts: unknown[][] = []
  const sources: string[] = []
  const face = { prompt: async (content: readonly unknown[]) => { prompts.push([...content]); return { ok: true } } }
  const using = async (
    _id: string,
    options: { readonly source: string },
    operation: (reference: unknown) => unknown,
  ): Promise<unknown> => {
    sources.push(options.source)
    return await Promise.resolve(operation({ ready: Promise.resolve({ session: face }) }))
  }
  return {
    prompts,
    sources,
    sessions: { scope: () => ({ live: true }), sessionOf: () => face, using } as unknown as SessionsLike,
    detached: { scope: () => undefined, sessionOf: () => undefined, using } as unknown as SessionsLike,
  }
}

/** A conversation service stub that records what it was asked to draft. */
function stubComposer(outcome: 'ok' | 'refuses' = 'ok'): {
  readonly conversation: ComposerLike
  readonly drafts: string
  readonly attached: string[][]
  readonly released: string[][]
} {
  const state = {
    draft: 'sketch first',
    attached: [] as string[][],
    released: [] as string[][],
    drafts: '',
  }
  const shell = {
    get snapshot() { return { draft: state.draft } },
    setDraft: (text: string) => { state.draft = text },
    addAttachments: (ids: readonly string[]) => {
      if (outcome === 'refuses') return false
      state.attached.push([...ids])
      return true
    },
  }
  const conversation = {
    input: { shell: (_id: string) => shell },
    createDrafts: (_sessionId: string, files: readonly File[]) => {
      state.drafts = files.map(file => `${file.name}:${file.type}`).join(',')
      return files.map((_file, index) => ({ id: `d${index}` }))
    },
    releaseDraftAttachments: (drafts: readonly { readonly id: string }[]) => {
      state.released.push(drafts.map(entry => entry.id))
    },
  }
  return {
    conversation: conversation as unknown as ComposerLike,
    get drafts() { return state.drafts },
    get attached() { return state.attached },
    get released() { return state.released },
  }
}

/** Mount the body and let its effects settle. */
async function mountBody(
  props: Partial<AnnotatorBodyProps> = {},
  options: { readonly stageWidth?: number } = {},
): Promise<{ readonly host: HTMLElement; readonly root: Root; readonly scrollports: (HTMLElement | null)[] }> {
  if (options.stageWidth !== undefined) {
    const width = options.stageWidth
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => width })
  }
  const scrollports: (HTMLElement | null)[] = []
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  const withScrollport = props.scrollportRef === undefined
    ? { scrollportRef: (element: HTMLElement | null) => { scrollports.push(element) } }
    : {}
  await act(async () => {
    root.render(<AnnotatorBody {...props} {...withScrollport} />)
  })
  return { host, root, scrollports }
}

/** A body mounted over an inline SVG figure. */
/** The rows the figure menu is showing, in drawing order. */
function menuLabels(host: HTMLElement): string[] {
  return [...host.querySelectorAll('.da-menu-item')].map(row => row.textContent ?? '')
}

function svgBody(answers: HostAnswers = {}, props: Partial<AnnotatorBodyProps> = {}, options: { readonly stageWidth?: number } = {}): Promise<{
  readonly host: HTMLElement
  readonly root: Root
  readonly scrollports: (HTMLElement | null)[]
  readonly calls: Call[]
}> {
  const calls = stubFetch(answers)
  return mountBody({
    content: { kind: 'bytes', data: svgBytes() },
    resourceAddress: SVG_ADDRESS,
    ...props,
  }, options).then(result => ({ ...result, calls }))
}

/** Find one toolbar button by its own label. */
function button(host: HTMLElement, label: string): HTMLButtonElement {
  const found = maybeButton(host, label)
  if (found === undefined) throw new Error(`no button labelled ${label}`)
  return found
}

/** The toolbar button with one label, when the body renders one at all. */
function maybeButton(host: HTMLElement, label: string): HTMLButtonElement | undefined {
  // A button may carry its label as a picture instead of as text — the pointer of the
  // `select` tool is one — so its accessible name is what is matched first.
  const buttons = [...host.querySelectorAll('button')]
  return (buttons.find(element => element.getAttribute('aria-label') === label)
    ?? buttons.find(element => element.textContent === label)) as HTMLButtonElement | undefined
}

/** Click one element inside act, letting the handler's promises settle. */
async function click(element: Element): Promise<void> {
  await act(async () => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    for (let turn = 0; turn < 8; turn += 1) await Promise.resolve()
  })
}

/** Type into one text field inside act. */
async function type(element: HTMLTextAreaElement | HTMLInputElement, value: string): Promise<void> {
  await act(async () => {
    // React tracks the last value it wrote, so the element's own prototype setter
    // has to be the one that changes it; assigning `.value` would look unchanged.
    const prototype = element instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype
    Object.getOwnPropertyDescriptor(prototype, 'value')?.set?.call(element, value)
    element.dispatchEvent(new Event('input', { bubbles: true }))
    for (let turn = 0; turn < 2; turn += 1) await Promise.resolve()
  })
}

/** The JSON body of a recorded write. */
function postBody(call: Call | undefined): Record<string, unknown> {
  const raw = call?.init?.body
  if (typeof raw !== 'string') throw new Error('the write carried no JSON body')
  return JSON.parse(raw) as Record<string, unknown>
}


/**
 * Open the style popup, which is where the colour and number controls live.
 *
 * The panel is shut until asked for: swatches and a slider on the tool row spent
 * its whole width saying "these are the settings" rather than "this is the tool".
 * @param host - the element to look in.
 */
async function openStyle(host: HTMLElement): Promise<void> {
  if (host.querySelector('.da-style-row') !== null) return
  await click(button(host, zh.style))
}

/**
 * Draw one arrow across the surface.
 *
 * The surface opens on `select`, so the arrow tool is armed first — the reader can no
 * longer draw by dragging until they have said they want to.
 */
/**
 * Draw one arrow between two points of the surface.
 *
 * `drawArrow` always draws the same arrow, which is fine for "there is a mark" and
 * useless for telling a picture of one mark from a picture of two: the two have to
 * land in different places for their combined extent to differ.
 * @param host - the panel.
 * @param from - where the press starts, in surface pixels.
 * @param to - where it ends.
 */
async function drawArrowAt(host: HTMLElement, from: readonly [number, number], to: readonly [number, number]): Promise<void> {
  await click(button(host, zh.toolArrow))
  const overlay = defined(host.querySelector('svg.da-overlay')) as SVGSVGElement
  stubRect(overlay, { left: 0, top: 0, width: 200, height: 100 })
  for (const [type, x, y] of [['pointerdown', from[0], from[1]], ['pointermove', to[0], to[1]], ['pointerup', to[0], to[1]]] as const) {
    await act(async () => {
      overlay.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX: x, clientY: y }))
    })
  }
  await act(async () => {
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: to[0], clientY: to[1] }))
  })
}

async function drawArrow(host: HTMLElement): Promise<void> {
  await click(button(host, zh.toolArrow))
  const overlay = defined(host.querySelector('svg.da-overlay')) as SVGSVGElement
  stubRect(overlay, { left: 0, top: 0, width: 200, height: 100 })
  for (const [type, x, y] of [['pointerdown', 20, 20], ['pointermove', 120, 80], ['pointerup', 120, 80]] as const) {
    await act(async () => {
      overlay.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX: x, clientY: y }))
    })
  }
  // A real browser follows the pointerup of a drag with a click on the surface. It is
  // part of the same gesture and must not be read as a press on the background, or the
  // detail box the draw just asked for is shut again in the same frame.
  await act(async () => {
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 120, clientY: 80 }))
  })
}

/** Drag the first mark on the surface from one figure point to another. */
async function dragMark(host: HTMLElement, from: readonly [number, number], to: readonly [number, number]): Promise<void> {
  const overlay = defined(host.querySelector('svg.da-overlay')) as SVGSVGElement
  stubRect(overlay, { left: 0, top: 0, width: 200, height: 100 })
  const hit = defined(overlay.querySelector('path[stroke="transparent"]'))
  for (const [element, type, point] of [
    [hit, 'pointerdown', from],
    [overlay, 'pointermove', to],
    [overlay, 'pointerup', to],
  ] as const) {
    await act(async () => {
      element.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX: point[0], clientY: point[1] }))
    })
  }
}

/** Press one key on the window. */
async function pressKey(key: string, modifiers: { readonly shift?: boolean; readonly bare?: boolean } = {}): Promise<void> {
  await act(async () => {
    window.dispatchEvent(new KeyboardEvent('keydown', {
      key,
      metaKey: modifiers.bare !== true,
      shiftKey: modifiers.shift === true,
      bubbles: true,
    }))
  })
}

/** Pinch one wheel event into the stage, as a trackpad reports one. */
async function pinch(
  stage: Element,
  options: { readonly deltaY: number; readonly clientX: number; readonly clientY: number },
): Promise<void> {
  const event = new WheelEvent('wheel', {
    deltaY: options.deltaY,
    clientX: options.clientX,
    clientY: options.clientY,
    ctrlKey: true,
    bubbles: true,
    cancelable: true,
  })
  await act(async () => { stage.dispatchEvent(event) })
}

/** The mark list, opening it first if it is folded away. */
async function openList(host: HTMLElement): Promise<HTMLElement> {
  if (host.querySelector('.da-mark') === null) await click(button(host, zh.marks))
  return defined(host.querySelector('.da-float-list')) as HTMLElement
}

/** The figure's own description card, opening it first if it is folded away. */
async function openGoal(host: HTMLElement): Promise<HTMLTextAreaElement> {
  if (host.querySelector('.da-float-goal') === null) await click(button(host, zh.summary))
  return defined(host.querySelector('.da-float-goal textarea')) as HTMLTextAreaElement
}

/** The selected mark's detail card, which appears beside that mark. */
function detailCard(host: HTMLElement = document.body): HTMLElement {
  return defined(host.querySelector('.da-float-detail')) as HTMLElement
}

/** The detail card's textarea. */
function detailBox(host: HTMLElement = document.body): HTMLTextAreaElement {
  return defined(detailCard(host).querySelector('textarea')) as HTMLTextAreaElement
}

/** Select one mark by its row, opening the list first. */
async function selectFirstMark(host: HTMLElement): Promise<void> {
  await openList(host)
  await click(defined(host.querySelector('.da-mark-text')))
}

let mounted: { readonly root: Root } | undefined

beforeEach(() => {
  // Drawing preferences outlive a figure on purpose, which makes them outlive a test
  // too: without this, one spec's colour and number size leak into the next.
  globalThis.localStorage.clear()
  stubRasterizer()
  class StubResizeObserver { observe(): void {} disconnect(): void {} }
  vi.stubGlobal('ResizeObserver', StubResizeObserver)
})

afterEach(() => {
  mounted?.root.unmount()
  mounted = undefined
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
  if (Object.hasOwn(HTMLElement.prototype, 'clientWidth')) delete (HTMLElement.prototype as { clientWidth?: number }).clientWidth
})

describe('addresses', () => {
  it('refuses anything that is not a file address', async () => {
    const calls = stubFetch()
    mounted = await mountBody({ content: { kind: 'bytes', data: svgBytes() }, resourceAddress: 'not-an-address' })
    expect(document.body.textContent).toContain(zh.unsupported)
    expect(calls).toHaveLength(0)
  })

  it('asks for nothing when the body was handed no address at all', async () => {
    const calls = stubFetch()
    mounted = await mountBody({ content: { kind: 'bytes', data: svgBytes() } })
    expect(document.body.textContent).toContain(zh.unsupported)
    expect(calls).toHaveLength(0)
  })

  it('refuses a file-scope address that names no folder', async () => {
    stubFetch()
    mounted = await mountBody({ content: { kind: 'bytes', data: svgBytes() }, resourceAddress: 'dsh-resource://file/nofile' })
    expect(document.body.textContent).toContain(zh.unsupported)
  })

  it('refuses a session address with no slash after the scope', async () => {
    stubFetch()
    mounted = await mountBody({ content: { kind: 'bytes', data: svgBytes() }, resourceAddress: 'dsh-resource://file/session/s1' })
    expect(document.body.textContent).toContain(zh.unsupported)
  })

  it('keeps a session id whose percent escapes are malformed', async () => {
    const { sessions, prompts } = stubSessions()
    const result = await svgBody({ annotation: saved }, {
      sessions,
      resourceAddress: 'dsh-resource://file/session/%ZZ/fig.svg',
    })
    mounted = result
    await click(button(document.body, zh.sendToAgent))
    expect(prompts).toHaveLength(1)
  })
})

describe('figure loading', () => {
  it('refuses a file it does not render', async () => {
    stubFetch()
    mounted = await mountBody({
      content: { kind: 'bytes', data: new TextEncoder().encode('x') },
      resourceAddress: 'dsh-resource://file/session/s1/notes.md',
    })
    expect(mounted.root).toBeDefined()
    expect(document.body.textContent).toContain(zh.unsupported)
  })

  it('waits for bytes it has not been handed yet', async () => {
    stubFetch()
    mounted = await mountBody({ content: { kind: 'text' }, resourceAddress: SVG_ADDRESS })
    expect(document.body.textContent).toContain(zh.loading)
  })

  it('reports an SVG it cannot parse', async () => {
    stubFetch()
    mounted = await mountBody({
      content: { kind: 'bytes', data: new TextEncoder().encode('not svg at all') },
      resourceAddress: SVG_ADDRESS,
    })
    expect(document.querySelector('[role="alert"]')?.textContent).toBe(zh.loadFailed)
  })

  it('inlines an SVG figure so marks can anchor to its elements', async () => {
    mounted = await svgBody()
    const figureHost = document.querySelector('.da-figure')
    expect(figureHost?.querySelector('text')?.textContent).toBe('102')
    expect(document.querySelector('svg.da-overlay')).not.toBeNull()
  })

  it('shows raster bytes through an image and sizes the surface once it loads', async () => {
    stubFetch()
    mounted = await mountBody({
      content: { kind: 'bytes', data: new Uint8Array([1, 2, 3]) },
      resourceAddress: 'dsh-resource://file/session/s1/fig.png',
    })
    const image = defined(document.querySelector('img.da-figure')) as HTMLImageElement
    // A raster figure is only measurable once the browser has decoded it.
    expect(document.querySelector('svg.da-overlay')).toBeNull()
    Object.defineProperty(image, 'naturalWidth', { value: 120 })
    Object.defineProperty(image, 'naturalHeight', { value: 60 })
    await act(async () => { image.dispatchEvent(new Event('load')) })
    expect(document.querySelector('svg.da-overlay')).not.toBeNull()
  })
})

describe('saved annotations', () => {
  it('opens an annotated figure in annotate mode with its marks listed', async () => {
    mounted = await svgBody({ annotation: saved })
    await openList(document.body)
    expect(defined(document.querySelector('.da-mark-text')).textContent).toContain('标号指错了')
    expect(document.querySelector('.da-status')).toBeNull()
    // The count rides on the fold's own button, so the list can stay shut.
    expect(defined(document.querySelector('.da-dock-count')).textContent).toBe('1')
  })

  it('warns when the figure changed since it was annotated', async () => {
    mounted = await svgBody({ annotation: saved, sha256: 'c'.repeat(64) })
    expect(document.body.textContent).toContain(zh.stale)
  })

  it('reports a figure the host would not read', async () => {
    mounted = await svgBody({ readError: 'no such figure' })
    expect(document.body.textContent).toContain(`${zh.readError}no such figure`)
  })

  it('reads a saved annotation that carries no figure description', async () => {
    const withoutSummary: AnnotationDocument = { ...saved }
    delete (withoutSummary as { summary?: string }).summary
    mounted = await svgBody({ annotation: withoutSummary })
    expect((await openGoal(document.body)).value).toBe('')
  })

  it('ignores an answer that arrives after the panel is gone', async () => {
    const pending = deferredFetch()
    const panel = await mountBody({ content: { kind: 'bytes', data: svgBytes() }, resourceAddress: SVG_ADDRESS })
    const signal = pending.signal()
    expect(signal?.aborted).toBe(false)
    await act(async () => { panel.root.unmount() })
    // The effect's cleanup is what tells the host nobody is waiting any more.
    expect(signal?.aborted).toBe(true)
    pending.answer(hostPayload())
    await act(async () => { for (let turn = 0; turn < 4; turn += 1) await Promise.resolve() })
    expect(document.querySelector('.da-status')).toBeNull()
  })

  it('keeps a stroke drawn while the read was still out', async () => {
    // The figure is drawable as soon as it decodes, which does not wait for the
    // annotation read. A stroke drawn in that window was not in the draft the body was
    // seeded with, so adopting the saved document wholesale erased it — silently, with
    // no step to walk back to, while the reader watched it happen.
    const pending = deferredFetch()
    mounted = await mountBody({ content: { kind: 'bytes', data: svgBytes() }, resourceAddress: SVG_ADDRESS })
    await drawArrow(document.body)
    await openList(document.body)
    expect(document.querySelectorAll('[data-da-mark]')).toHaveLength(1)
    pending.answer(hostPayload({ annotation: saved }))
    await act(async () => { for (let turn = 0; turn < 4; turn += 1) await Promise.resolve() })
    // The saved arrow, then the one the reader drew while the answer was in flight.
    expect(document.querySelectorAll('[data-da-mark]')).toHaveLength(2)
  })

  it('swallows a failure that arrives after the panel is gone', async () => {
    const pending = deferredFetch()
    const panel = await mountBody({ content: { kind: 'bytes', data: svgBytes() }, resourceAddress: SVG_ADDRESS })
    await act(async () => { panel.root.unmount() })
    pending.fail(new Error('too late'))
    await act(async () => { for (let turn = 0; turn < 4; turn += 1) await Promise.resolve() })
    expect(document.querySelector('.da-status')).toBeNull()
  })

  it('says which sidecar it could not read, rather than claiming there is none', async () => {
    // The marks are on disk and are not on the panel. The Host stopped answering
    // "never annotated" over a file that is plainly there; the panel has to stop too,
    // or the reader is told their work does not exist.
    mounted = await svgBody({ unreadable: ['/w/fig.svg.annot.json'] })
    expect(document.body.textContent).toContain(zh.annotationUnreadable)
    expect(document.body.textContent).toContain('/w/fig.svg.annot.json')
  })

  it('says nothing about sidecars when the Host read everything', async () => {
    mounted = await svgBody({ annotation: saved })
    expect(document.body.textContent).not.toContain(zh.annotationUnreadable)
  })

  it('reports a read failure that is not an Error as its own text', async () => {
    const pending = deferredFetch()
    mounted = await mountBody({ content: { kind: 'bytes', data: svgBytes() }, resourceAddress: SVG_ADDRESS })
    pending.fail('the socket died')
    await act(async () => { for (let turn = 0; turn < 4; turn += 1) await Promise.resolve() })
    expect(document.body.textContent).toContain(`${zh.readError}the socket died`)
  })
})

describe('editing marks', () => {
  it('adds a mark by drawing, and puts the note box on it', async () => {
    mounted = await svgBody()
    await drawArrow(document.body)
    await openList(document.body)
    expect(document.querySelectorAll('[data-da-mark]')).toHaveLength(1)
    expect(detailCard().querySelector(".da-comment")).not.toBeNull()
  })

  it('opens the detail of a mark the moment it is drawn, with the caret in it', async () => {
    mounted = await svgBody()
    await drawArrow(document.body)
    // A shape with no sentence is a shape with no meaning, so drawing one asks for
    // the sentence without a second gesture.
    const box = detailBox()
    expect(document.activeElement).toBe(box)
    await type(box, '这条曲线缺图例')
    expect(box.value).toBe('这条曲线缺图例')
  })

  it('puts the caret at the end of a sentence that is already there', async () => {
    mounted = await svgBody({ annotation: saved })
    const hit = defined(document.querySelector('[data-da-mark] path[stroke="transparent"]')) as SVGPathElement
    await act(async () => {
      hit.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
    })
    const box = detailBox()
    expect(document.activeElement).toBe(box)
    expect(box.selectionStart).toBe(box.value.length)
  })

  it('writes one sentence per mark, and shows it in the list rather than the picture', async () => {
    mounted = await svgBody({ annotation: saved })
    await selectFirstMark(document.body)
    await type(detailBox(), '这里要改')
    // It is the whole payload of the mark, so the list names the mark by it...
    expect(defined(document.querySelector('.da-mark-text')).textContent).toContain('这里要改')
    // ...and it is the only field there is: nothing else was added for it to
    // overwrite, and nothing is drawn on the figure.
    expect(detailCard().querySelector('input')).toBeNull()
    // The only lettering on the surface is the mark's number: the sentence itself
    // travels in the message, never on the picture.
    expect(document.querySelector('svg.da-overlay text[data-da-badge]')).toBeNull()
  })

  it('keeps the figure description apart from the mark fields', async () => {
    mounted = await svgBody({ annotation: saved })
    const goal = await openGoal(document.body)
    await type(goal, '这张图是装配示意')
    expect(goal.value).toBe('这张图是装配示意')
    // It is not part of any mark, so no mark field picked it up: the selected
    // mark's card still carries that mark's own sentence and nothing else.
    await selectFirstMark(document.body)
    expect(detailBox().value).toBe('标号指错了')
  })

  it('folds a record away when the reader clicks off it, without a close button', async () => {
    mounted = await svgBody({ annotation: saved })
    await openList(document.body)
    expect(document.querySelector('.da-float-list')).not.toBeNull()
    // Anywhere outside the record closes it: the picture is what the reader was
    // looking at, so looking back at it is what puts the record away.
    await act(async () => {
      (defined(document.querySelector('.da-stage')) as HTMLElement)
        .dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    })
    expect(document.querySelector('.da-float-list')).toBeNull()
  })

  it('folds the records away from a press that lands on no element at all', async () => {
    mounted = await svgBody({ annotation: saved })
    await openList(document.body)
    // A pointer event can reach the document from a node that is not an element —
    // the document itself, say. It is still a press somewhere else.
    await act(async () => {
      document.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    })
    expect(document.querySelector('.da-float-list')).toBeNull()
  })

  it('keeps a record open while the reader works inside it or on the bar', async () => {
    mounted = await svgBody({ annotation: saved })
    await openList(document.body)
    // The bar's own buttons are how records are opened and exchanged, so pressing
    // one must not shut the one that is open.
    const bar = defined(document.querySelector('.da-bar')) as HTMLElement
    await act(async () => {
      bar.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    })
    expect(document.querySelector('.da-float-list')).not.toBeNull()
    // And typing in the record is the whole point of having it open.
    await act(async () => {
      (defined(document.querySelector('.da-float-list')) as HTMLElement)
        .dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    })
    expect(document.querySelector('.da-float-list')).not.toBeNull()
  })

  it('opens the goal and the list as records anchored to the bar', async () => {
    mounted = await svgBody({ annotation: saved })
    await openGoal(document.body)
    const bar = defined(document.querySelector('.da-bar')) as HTMLElement
    const goal = defined(document.querySelector('.da-float-goal')) as HTMLElement
    stubRect(bar, { left: 100, top: 560, width: 200, height: 28 })
    stubRect(defined(document.querySelector('.da-root')) as HTMLElement,
      { left: 0, top: 0, width: 400, height: 600 })
    // Re-open so the measurement runs against these boxes.
    await click(button(document.body, zh.summary))
    await click(button(document.body, zh.summary))
    expect(defined(document.querySelector('.da-float-goal'))).not.toBeNull()
    expect(goal.className).toContain('da-float-goal')
  })

  it('shows no mark field until a mark is selected', async () => {
    mounted = await svgBody({ annotation: saved })
    // The card is not a field waiting to be enabled: it is the selected mark's own
    // words, and there is no mark to speak for yet. Opening the list does not
    // select anything either, so the figure keeps the panel's height.
    await openList(document.body)
    expect(document.querySelector('.da-float-detail')).toBeNull()
    // The figure's own description is about the picture, not a mark, so it opens.
    expect((await openGoal(document.body)).disabled).toBe(false)
  })

  it('undoes and redoes an edit, and clears every mark', async () => {
    mounted = await svgBody({ annotation: saved })
    await openList(document.body)
    const del = document.querySelector('.da-mark-del')
    await click(defined(del))
    expect(document.querySelectorAll('[data-da-mark]')).toHaveLength(0)
    await click(button(document.body, zh.undo))
    expect(document.querySelectorAll('[data-da-mark]')).toHaveLength(1)
    await click(button(document.body, zh.redo))
    expect(document.querySelectorAll('[data-da-mark]')).toHaveLength(0)
    await click(button(document.body, zh.undo))
    await click(button(document.body, zh.clear))
    expect(document.querySelectorAll('[data-da-mark]')).toHaveLength(0)
    expect(document.querySelector('.da-empty-title')?.textContent).toBe(zh.noMarks)
  })

  it('clears the panel even when the sidecars could not be deleted, and says why', async () => {
    mounted = await svgBody({ annotation: saved, deleteError: 'the disk is read-only' })
    await openList(document.body)
    await click(button(document.body, zh.clear))
    // The marks are gone from this session either way; a sidecar that survives is
    // reported rather than hidden, because it would reappear on the next open.
    expect(document.querySelectorAll('[data-da-mark]')).toHaveLength(0)
    expect(document.body.textContent).toContain(`${zh.clearError}the disk is read-only`)
    // A refusal that is not an Error still has to be reported as itself. The click
    // has to land in the second host: the first one's clear button is already spent.
    const second = await svgBody({ annotation: saved, deleteThrows: 'the socket died' })
    await openList(second.host)
    await click(button(second.host, zh.clear))
    expect(second.host.textContent).toContain(zh.clearError)
  })

  it('drives undo and redo from the keyboard too', async () => {
    mounted = await svgBody({ annotation: saved })
    await openList(document.body)
    await click(defined(document.querySelector('.da-mark-del')))
    await pressKey('z')
    expect(document.querySelectorAll('[data-da-mark]')).toHaveLength(1)
    await pressKey('Z', { shift: true })
    expect(document.querySelectorAll('[data-da-mark]')).toHaveLength(0)
    await pressKey('a')
    expect(document.querySelectorAll('[data-da-mark]')).toHaveLength(0)
    // A plain `z` in a note box must not undo anything either.
    await pressKey('z', { bare: true })
    expect(document.querySelectorAll('[data-da-mark]')).toHaveLength(0)
  })

  it('ignores undo and redo when there is nothing left to move through', async () => {
    mounted = await svgBody({ annotation: saved })
    // The buttons are disabled in this state; the keyboard reaches the handlers
    // anyway, which is where the emptiness is actually decided.
    expect(button(document.body, zh.undo).disabled).toBe(true)
    expect(button(document.body, zh.redo).disabled).toBe(true)
    await pressKey('z')
    await pressKey('Z', { shift: true })
    // Nothing moved, so the mark is still on the surface: an undo with no step
    // behind it must not quietly erase what is there.
    expect(document.querySelectorAll('[data-da-mark]')).toHaveLength(1)
  })

  it('leaves the clear button alone until there is something to clear', async () => {
    mounted = await svgBody()
    await openList(document.body)
    expect(button(document.body, zh.clear).disabled).toBe(true)
    await drawArrow(document.body)
    // Drawing on the figure is looking away from the record, which folds it: the
    // rows are read back by opening it again.
    await openList(document.body)
    expect(button(document.body, zh.clear).disabled).toBe(false)
    await click(button(document.body, zh.clear))
    expect(document.querySelectorAll('[data-da-mark]')).toHaveLength(0)
  })

  it('selects a mark from the list and from the surface', async () => {
    mounted = await svgBody({ annotation: saved })
    await selectFirstMark(document.body)
    expect(detailCard().querySelector(".da-comment")).not.toBeNull()
  })

  it('labels a mark that has no note yet, and shows where it anchored', async () => {
    const anchored: AnnotationDocument = {
      ...saved,
      marks: [
        { id: 'm1', kind: 'rect', color: '#1971c2', points: [[1, 1], [9, 9]] },
        { id: 'm2', kind: 'point', color: '#e03131', points: [[20, 20]], detail: '图号', anchor: { tag: 'g', title: '102', bbox: [0, 0, 5, 5] } },
      ],
    }
    mounted = await svgBody({ annotation: anchored })
    await openList(document.body)
    const entries = [...document.querySelectorAll('.da-mark-text')].map(element => element.textContent ?? '')
    expect(entries[0]).toContain(zh.emptyDetail)
    expect(entries[1]).toContain('102')
    // A row is numbered in the mark's own colour, so the list and the picture
    // are matched by one glance.
    // The number is neutral — an index is not a legend — and the shape carries the
    // mark's colour instead.
    const numbers = [...document.querySelectorAll('.da-mark-n')]
    expect(numbers).toHaveLength(2)
    expect((defined(numbers[1]) as HTMLElement).style.color).toBe('')
    const glyphs = [...document.querySelectorAll('.da-mark-glyph')]
    expect((defined(glyphs[1]) as HTMLElement).style.color).toBe('rgb(224, 49, 49)')
  })

  it('names an anchor by whatever it says, and shows no label for one that says nothing', async () => {
    const anchored: AnnotationDocument = {
      ...saved,
      marks: [
        { id: 'm1', kind: 'rect', color: '#1971c2', points: [[1, 1], [9, 9]], anchor: { tag: 'p', text: '第二段', bbox: [0, 0, 5, 5], selector: '#s > p:nth-of-type(2)' } },
        { id: 'm2', kind: 'rect', color: '#1971c2', points: [[2, 2], [8, 8]], anchor: { tag: 'g', bbox: [0, 0, 5, 5] } },
      ],
    }
    mounted = await svgBody({ annotation: anchored })
    await openList(document.body)
    const entries = [...document.querySelectorAll('.da-mark-text')].map(element => element.textContent ?? '')
    // Text before path: the quote is what a reader recognizes, the selector is how
    // a source reader resolves it.
    expect(entries[0]).toContain('第二段')
    expect(entries[1]).not.toContain('第二段')
  })

  it('arms a tool and a colour without a mode to switch into', async () => {
    mounted = await svgBody()
    // The surface draws from the moment it opens: there is no viewing mode to leave.
    await click(button(document.body, zh.toolRect))
    expect(button(document.body, zh.toolRect).getAttribute('aria-pressed')).toBe('true')
    await openStyle(document.body)
    const swatch = defined(document.querySelector('.da-swatch[aria-label="#1971c2"]'))
    await click(swatch)
    expect(swatch.getAttribute('aria-pressed')).toBe('true')
  })

  it('drops the detail card when the selected mark is deleted', async () => {
    mounted = await svgBody({ annotation: saved })
    await selectFirstMark(document.body)
    expect(detailCard().querySelector(".da-comment")).not.toBeNull()
    await click(defined(document.querySelector('.da-mark-del')))
    // The mark is gone, so there is nothing left for a card to be about.
    expect(document.querySelector('.da-float-detail')).toBeNull()
    expect(document.querySelectorAll('[data-da-mark]')).toHaveLength(0)
  })

  it('leaves every other mark alone while a note is written', async () => {
    const twoMarks: AnnotationDocument = {
      ...saved,
      marks: [
        { id: 'm1', kind: 'arrow', color: '#e03131', points: [[1, 1], [9, 9]], detail: '第一条' },
        { id: 'm2', kind: 'rect', color: '#1971c2', points: [[2, 2], [8, 8]], detail: '第二条' },
      ],
    }
    mounted = await svgBody({ annotation: twoMarks })
    await selectFirstMark(document.body)
    // The marks list shows each mark's sentence, so rewriting the first mark is
    // what a reader sees change; the second mark's own sentence must be untouched.
    await type(detailBox(), '改过了')
    const entries = [...document.querySelectorAll('.da-mark-text')].map(element => element.textContent ?? '')
    expect(entries[0]).toContain('改过了')
    expect(entries[1]).toContain('第二条')
  })

  it('names the shape each row stands for, so a pen and a box read apart', async () => {
    // As the tool's own glyph rather than its word: five shapes, one icon each, and
    // the rail already taught the reader what they look like. The word survives as
    // the glyph's tooltip, which is where a word belongs.
    mounted = await svgBody({
      annotation: { ...saved, marks: [{ id: 'm1', kind: 'pen', color: '#2f9e44', points: [[1, 1], [5, 6], [9, 2]] }] },
    })
    await openList(document.body)
    // Both drawn as light strokes in the mark's colour: the number says which, the
    // glyph says what shape, and neither is a block of fill on the row.
    const row = defined(document.querySelector('.da-mark'))
    expect(defined(row.querySelector('.da-mark-n')).textContent).toBe('1')
    const glyph = defined(document.querySelector('.da-mark-glyph'))
    expect(glyph.getAttribute('title')).toContain(zh.toolPen)
    expect(glyph.querySelector('svg')).not.toBeNull()
    expect(glyph.getAttribute('style')).toContain('color')
    // The shape no longer repeats itself in the row's second line, which is left for
    // the facts the shape cannot carry.
    expect(document.querySelector('.da-mark-meta')?.textContent ?? '').not.toContain(zh.toolPen)
  })
})

describe('the keyboard while annotating', () => {
  it('leaves annotating on Escape, and drops the selection before the mode', async () => {
    mounted = await svgBody({ annotation: saved })
    await selectFirstMark(document.body)
    await pressKey('Escape', { bare: true })
    // The first Escape only lets go of the mark the note box is bound to.
    await pressKey('Escape', { bare: true })
  })

  it('keeps Escape in a note box, so the caret can leave the field itself', async () => {
    mounted = await svgBody({ annotation: saved })
    await selectFirstMark(document.body)
    const note = defined(document.querySelector('.da-float-detail textarea'))
    await act(async () => {
      note.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })
    expect(detailCard().querySelector(".da-comment")).not.toBeNull()
  })

  it('deletes the picked-out mark with Delete and with Backspace', async () => {
    mounted = await svgBody({ annotation: saved })
    await selectFirstMark(document.body)
    await pressKey('Delete', { bare: true })
    expect(document.querySelectorAll('[data-da-mark]')).toHaveLength(0)
    await click(button(document.body, zh.undo))
    await selectFirstMark(document.body)
    await pressKey('Backspace', { bare: true })
    expect(document.querySelectorAll('[data-da-mark]')).toHaveLength(0)
  })

  it('keeps its shortcuts out of the note box, including undo', async () => {
    mounted = await svgBody({ annotation: saved })
    await selectFirstMark(document.body)
    const note = defined(document.querySelector('.da-float-detail textarea'))
    for (const key of ['z', 'Delete']) {
      await act(async () => {
        note.dispatchEvent(new KeyboardEvent('keydown', { key, metaKey: true, bubbles: true }))
      })
    }
    // The caret is in a field: undo would eat a typed character and Delete a
    // letter, so neither reaches the marks.
    expect(document.querySelectorAll('[data-da-mark]')).toHaveLength(1)
  })

  it('keeps its shortcuts out of any other field too', async () => {
    mounted = await svgBody({ annotation: saved })
    for (const tag of ['input', 'select']) {
      const field = document.createElement(tag)
      document.body.append(field)
      await act(async () => {
        field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      })
      field.remove()
    }
  })

  it('keeps its shortcuts out of a contenteditable field', async () => {
    mounted = await svgBody({ annotation: saved })
    const field = document.createElement('div')
    Object.defineProperty(field, 'isContentEditable', { configurable: true, value: true })
    document.body.append(field)
    await act(async () => {
      field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })
    field.remove()
  })

  it('leaves Delete to the shell when no mark is picked out', async () => {
    mounted = await svgBody()
    await drawArrow(document.body)
    // Drawing selects the new mark; Escape lets go of it, so the next Delete is
    // the browser's to handle and must not reach into the document.
    await pressKey('Escape', { bare: true })
    await pressKey('Delete', { bare: true })
    // The mark is still on the surface; the list is a fold and was never opened.
    expect(document.querySelectorAll('[data-da-mark]')).toHaveLength(1)
  })
})

describe('moving marks', () => {
  it('puts a dragged mark where it was dropped, as one undo step', async () => {
    mounted = await svgBody({ annotation: saved })
    await click(button(document.body, zh.toolSelect))
    await dragMark(document.body, [20, 20], [50, 45])
    // Undo takes back the whole gesture, not one pointer move of it.
    await click(button(document.body, zh.undo))
    await click(button(document.body, zh.redo))
    expect(document.querySelectorAll('[data-da-mark]')).toHaveLength(1)
  })

  it('draws the mark under the pointer while it is being dragged', async () => {
    mounted = await svgBody({ annotation: saved })
    await click(button(document.body, zh.toolSelect))
    const overlay = defined(document.querySelector('svg.da-overlay')) as SVGSVGElement
    stubRect(overlay, { left: 0, top: 0, width: 200, height: 100 })
    const hit = defined(overlay.querySelector('path[stroke="transparent"]'))
    await act(async () => {
      hit.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 20, clientY: 20 }))
    })
    await act(async () => {
      overlay.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 50, clientY: 45 }))
    })
    // The arrow that was at (10,10)-(40,30) is now drawn from (40,35).
    const paths = [...overlay.querySelectorAll('g[opacity] path')]
    expect(paths.length).toBeGreaterThan(0)
  })

  it('records no undo step for a press that never moved the mark', async () => {
    mounted = await svgBody({ annotation: saved })
    await click(button(document.body, zh.toolSelect))
    await dragMark(document.body, [20, 20], [20, 20])
    // The undo button still has nothing to walk back to but the load itself.
    expect((button(document.body, zh.undo)).disabled).toBe(true)
  })

  it('moves a mark without dropping the anchor it had when nothing new was hit', async () => {
    mounted = await svgBody({ annotation: saved })
    await click(button(document.body, zh.toolSelect))
    await dragMark(document.body, [20, 20], [50, 45])
    expect(document.querySelector('.da-mark-anchor')).toBeNull()
  })

  /** Drag one handle of the selected mark by an offset, in figure pixels. */
  async function dragHandle(host: HTMLElement, id: string, dx: number, dy: number): Promise<void> {
    const overlay = defined(host.querySelector('svg.da-overlay')) as SVGSVGElement
    stubRect(overlay, { left: 0, top: 0, width: 200, height: 100 })
    const grip = defined(overlay.querySelector(`rect[data-da-handle="${id}"]`))
    const from: readonly [number, number] = [Number(grip.getAttribute('x')) + 3.5, Number(grip.getAttribute('y')) + 3.5]
    for (const [element, type, point] of [
      [grip, 'pointerdown', from],
      [overlay, 'pointermove', [from[0] + dx, from[1] + dy]],
      [overlay, 'pointerup', [from[0] + dx, from[1] + dy]],
    ] as const) {
      await act(async () => {
        element.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX: point[0], clientY: point[1] }))
      })
    }
  }

  it('records a resize as one undo step, and walks it back', async () => {
    mounted = await svgBody({ annotation: saved })
    await click(button(document.body, zh.toolSelect))
    // Select the arrow, which is what draws its control frame.
    await selectFirstMark(document.body)
    expect(document.querySelectorAll('rect[data-da-handle]')).toHaveLength(9)
    await dragHandle(document.body, 'e', 40, 0)
    // The new geometry is what the list reports, and one undo takes it all back.
    await click(button(document.body, zh.undo))
    await openList(document.body)
    expect(defined(document.querySelector('.da-mark-text')).textContent).toContain('标号指错了')
  })

  it('records a rotation as one undo step, and walks it back', async () => {
    mounted = await svgBody({ annotation: saved })
    await click(button(document.body, zh.toolSelect))
    await selectFirstMark(document.body)
    await dragHandle(document.body, 'rotate', 40, 60)
    await click(button(document.body, zh.undo))
    expect(document.querySelectorAll('[data-da-mark]')).toHaveLength(1)
  })

  it('edits only the mark that was grabbed, leaving its neighbours alone', async () => {
    const two: AnnotationDocument = {
      ...saved,
      marks: [
        { id: 'm1', kind: 'arrow', color: '#e03131', points: [[10, 10], [40, 30]], detail: '第一条' },
        { id: 'm2', kind: 'arrow', color: '#1971c2', points: [[100, 50], [150, 80]], detail: '第二条' },
      ],
    }
    mounted = await svgBody({ annotation: two })
    await click(button(document.body, zh.toolSelect))
    await selectFirstMark(document.body)
    await dragHandle(document.body, 'e', 40, 0)
    await openList(document.body)
    const entries = [...document.querySelectorAll('.da-mark-text')].map(element => element.textContent ?? '')
    expect(entries[0]).toContain('第一条')
    expect(entries[1]).toContain('第二条')
  })

  it('opens a mark for editing when it is double clicked, with the caret in its detail', async () => {
    mounted = await svgBody({ annotation: saved })
    // Double clicking from viewing mode is the whole point: it is how a reader
    // gets from looking at the figure to describing what is wrong with it.
    const overlay = defined(document.querySelector('svg.da-overlay')) as SVGSVGElement
    stubRect(overlay, { left: 0, top: 0, width: 200, height: 100 })
    const hit = defined(overlay.querySelector('path[stroke="transparent"]'))
    await act(async () => {
      hit.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
    })
    // The body is annotating, so the detail card is open beside the mark and its
    // box has the caret, ready for the words the double click was asking for.
    const detail = detailBox()
    expect(document.activeElement).toBe(detail)
    // And it is editing the mark that was clicked, carrying that mark's own
    // detail rather than a blank box that would discard it.
    expect(detail.value).toBe('标号指错了')
    expect(detail.disabled).toBe(false)
  })

  it('moves a mark without losing the detail that was written on it', async () => {
    mounted = await svgBody({ annotation: saved })
    await click(button(document.body, zh.toolSelect))
    const overlay = defined(document.querySelector('svg.da-overlay')) as SVGSVGElement
    stubRect(overlay, { left: 0, top: 0, width: 200, height: 100 })
    const line = defined(overlay.querySelector('path[stroke="transparent"]'))
    for (const [element, type, point] of [
      [line, 'pointerdown', [20, 15]],
      [overlay, 'pointermove', [60, 45]],
      [overlay, 'pointerup', [60, 45]],
    ] as const) {
      await act(async () => {
        element.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX: point[0], clientY: point[1] }))
      })
    }
    // The mark has moved, and it is still the same single mark saying the same thing.
    expect(document.querySelectorAll('[data-da-mark]')).toHaveLength(1)
    await openList(document.body)
    expect(defined(document.querySelector('.da-mark-text')).textContent).toContain('标号指错了')
  })
})

describe('zoom', () => {
  it('fits the figure without offering a zoom control at all', async () => {
    mounted = await svgBody({}, {}, { stageWidth: 500 })
    const surface = defined(document.querySelector('.da-surface')) as HTMLElement
    // A 200px figure in a 476px stage, fitted at the 1.5 ceiling on open.
    expect(surface.style.width).toBe('300px')
    // No zoom control of any kind: pinch is the whole of it, and the figure opens
    // already fitted to the pane.
    for (const label of ['放大', '缩小', '适应宽度', '100%']) {
      expect(maybeButton(document.body, label)).toBeUndefined()
    }
  })

  it('fits the paper, so a mark drawn past the figure is still visible', async () => {
    // Fit used to divide the target width by the *figure's* width while the surface was
    // laid out at the *paper's* — the two agree only while nothing reaches past the
    // figure, which is exactly the case a grown paper exists for. The reader drew a
    // mark outside the figure and had to scroll sideways to see the mark they had just
    // drawn; fit stopped fitting at the moment a mark mattered.
    mounted = await svgBody({
      annotation: {
        ...saved,
        // A rectangle out at x≈600 on a 200-wide figure, so the paper grows well past it.
        marks: [{ id: 'far', kind: 'rect', color: '#1971c2', points: [[500, 40], [600, 120]] }],
      },
    }, {}, { stageWidth: 500 })
    const surface = defined(document.querySelector('.da-surface')) as HTMLElement
    // Whatever the paper is, the surface it is laid out on fits inside the 476px box.
    expect(Number.parseFloat(surface.style.width)).toBeLessThanOrEqual(476 + 1)
  })

  it('zooms by pinch instead of stepping through buttons', async () => {
    mounted = await svgBody({}, {}, { stageWidth: 500 })
    const surface = defined(document.querySelector('.da-surface')) as HTMLElement
    const stage = defined(document.querySelector('.da-stage')) as HTMLElement
    stubRect(stage, { left: 0, top: 0, width: 500, height: 400 })
    expect(surface.style.width).toBe('300px')
    await pinch(stage, { deltaY: -40, clientX: 100, clientY: 100 })
    expect(Number.parseFloat(surface.style.width)).toBeGreaterThan(300)
    await pinch(stage, { deltaY: 40, clientX: 100, clientY: 100 })
    expect(Number.parseFloat(surface.style.width)).toBeCloseTo(300, 0)
  })

  it('hands the owner the scrollport once, and takes it back when the body goes', async () => {
    // The owner writes the reader's saved scroll position onto whatever it is
    // handed, so being handed the stage again on every render would put that
    // position back over wherever the reader had scrolled to — the page jumps
    // while it is being annotated. The stage crosses once, and null on the way out.
    const owner: (HTMLElement | null)[] = []
    const result = await svgBody({}, { scrollportRef: (element) => { owner.push(element) } })
    mounted = result
    expect(owner).toHaveLength(1)
    expect(owner[0]?.className).toBe('da-stage')
    // A render of its own, and one the owner's own state asks for.
    await click(button(document.body, zh.toolPen))
    expect(owner).toHaveLength(1)
    await act(async () => { result.root.unmount() })
    expect(owner).toEqual([owner[0], null])
    mounted = undefined
  })

  it('zooms on a trackpad pinch, around the point the pointer is over', async () => {
    mounted = await svgBody({}, {}, { stageWidth: 500 })
    const surface = defined(document.querySelector('.da-surface')) as HTMLElement
    const stage = defined(document.querySelector('.da-stage')) as HTMLElement
    stubRect(stage, { left: 0, top: 0, width: 500, height: 400 })
    // A 200px figure in a 476px stage fits at the 1.5 ceiling: 300px wide.
    expect(surface.style.width).toBe('300px')
    await pinch(stage, { deltaY: -40, clientX: 60, clientY: 50 })
    expect(Number.parseFloat(surface.style.width)).toBeCloseTo(300 * Math.exp(0.4), 1)
  })

  it('keeps the figure point under the pointer in place across a pinch', async () => {
    mounted = await svgBody({}, {}, { stageWidth: 500 })
    const stage = defined(document.querySelector('.da-stage')) as HTMLElement
    // At the fitted width the 300px surface is centred in 500, so it starts 100px
    // in and the pointer at client x=250 sits over figure x=100.
    stubRect(stage, { left: 0, top: 0, width: 500, height: 400 })
    stage.scrollLeft = 0
    stage.scrollTop = 0
    await pinch(stage, { deltaY: -40, clientX: 250, clientY: 212 })
    const width = Number.parseFloat((defined(document.querySelector('.da-surface')) as HTMLElement).style.width)
    const offset = Math.max(0, (500 - width) / 2)
    expect(stage.scrollLeft).toBeCloseTo(Math.max(0, offset + 100 * (width / 200) - 250), 5)
  })

  it('reads a plain wheel as the magnification, not as a scroll', async () => {
    // The same motion over the same page used to have two readings — scroll the
    // page, or ask for the next one — and on a page that fits the pane there was
    // nothing to scroll, so it read as a page turn. One motion, one meaning now.
    mounted = await svgBody({}, {}, { stageWidth: 500 })
    const stage = defined(document.querySelector('.da-stage')) as HTMLElement
    const surface = defined(document.querySelector('.da-surface')) as HTMLElement
    stubRect(stage, { left: 0, top: 0, width: 500, height: 400 })
    const event = new WheelEvent('wheel', {
      deltaY: -40, clientX: 60, clientY: 50, bubbles: true, cancelable: true,
    })
    await act(async () => { stage.dispatchEvent(event) })
    // Taken from the browser, because a prevented wheel cannot scroll the page
    // behind the plugin either, and zoomed in, because that is what the wheel means.
    expect(event.defaultPrevented).toBe(true)
    expect(Number.parseFloat(surface.style.width)).toBeGreaterThan(300)
  })

  it('answers a wheel both ways, and a pinch as the same gesture', async () => {
    mounted = await svgBody({}, {}, { stageWidth: 500 })
    const stage = defined(document.querySelector('.da-stage')) as HTMLElement
    const surface = defined(document.querySelector('.da-surface')) as HTMLElement
    stubRect(stage, { left: 0, top: 0, width: 500, height: 400 })
    // A trackpad pinch arrives ctrl-modified; a mouse wheel does not. Both are the
    // magnification, so neither may depend on the modifier to be understood.
    await pinch(stage, { deltaY: -40, clientX: 60, clientY: 50 })
    const magnified = Number.parseFloat(surface.style.width)
    expect(magnified).toBeGreaterThan(300)
    const down = new WheelEvent('wheel', {
      deltaY: 40, clientX: 60, clientY: 50, bubbles: true, cancelable: true,
    })
    await act(async () => { stage.dispatchEvent(down) })
    expect(Number.parseFloat(surface.style.width)).toBeLessThan(magnified)
  })

  it('scales the paper once, rather than the figure inside it as well', async () => {
    // The live factor used to be written onto the figure host while the paper already
    // carried the same factor, so a pinch out left the figure at the factor squared
    // inside a sheet at the factor — white paper showing all round it, worse the
    // further out the reader pinched. The paper is the one thing that scales.
    mounted = await svgBody({}, {}, { stageWidth: 500 })
    const stage = defined(document.querySelector('.da-stage')) as HTMLElement
    const surface = defined(document.querySelector('.da-surface')) as HTMLElement
    const sheet = defined(document.querySelector('.da-paper')) as HTMLElement
    const host = defined(sheet.firstElementChild) as HTMLElement
    stubRect(stage, { left: 0, top: 0, width: 500, height: 400 })
    // The figure opens fitted at the 1.5 ceiling; a pinch out of that is the gesture
    // that used to leave a band of white paper round a shrunken figure.
    const started = Number.parseFloat(surface.style.width) / 200
    await pinch(stage, { deltaY: 40, clientX: 100, clientY: 100 })
    const reached = Number.parseFloat(sheet.style.transform.replace(/[^0-9.]/gu, ''))
    expect(reached).toBeLessThan(started)
    // The sheet carries the factor, the surface its scaled size, and nothing inside.
    expect(sheet.style.transform).toBe(`scale(${reached})`)
    expect(Number.parseFloat(surface.style.width)).toBeCloseTo(200 * reached, 0)
    expect(host.style.transform).toBe('')
  })

  it('settles a pinch into the panel state once the fingers stop', async () => {
    mounted = await svgBody({}, {}, { stageWidth: 500 })
    const stage = defined(document.querySelector('.da-stage')) as HTMLElement
    const surface = defined(document.querySelector('.da-surface')) as HTMLElement
    stubRect(stage, { left: 0, top: 0, width: 500, height: 400 })
    // A pinch moves the figure on the frame itself and only settles into React's
    // state when the gesture pauses: re-rendering per wheel step is what made the
    // gesture lag behind the fingers.
    expect(surface.style.width).toBe('300px')
    await pinch(stage, { deltaY: -40, clientX: 60, clientY: 50 })
    const during = Number.parseFloat(surface.style.width)
    expect(during).toBeGreaterThan(300)
    // The frame keeps the factor it was given, and it is still the same one after
    // the gesture pauses — settling must not undo the pinch.
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, PINCH_SETTLE_DELAY_MS + 40))
    })
    expect(Number.parseFloat(defined(document.querySelector('.da-surface') as HTMLElement).style.width))
      .toBeCloseTo(during, 0)
  })

  it('takes the page zoom away from the stage, and gives it back when the stage goes', async () => {
    // The stage is the surface the reader is pointing at, so the browser's own
    // page zoom is taken away from it — but only for as long as it is on screen.
    mounted = await svgBody({}, {}, { stageWidth: 500 })
    const stage = defined(document.querySelector('.da-stage')) as HTMLElement
    stubRect(stage, { left: 0, top: 0, width: 500, height: 400 })
    const event = new WheelEvent('wheel', {
      deltaY: -40, clientX: 60, clientY: 50, ctrlKey: true, bubbles: true, cancelable: true,
    })
    await act(async () => { stage.dispatchEvent(event) })
    expect(event.defaultPrevented).toBe(true)
    await act(async () => { mounted?.root.unmount() })
    mounted = undefined
    // The listener went with the stage: the same event no longer reaches one.
    const stale = new WheelEvent('wheel', {
      deltaY: -40, ctrlKey: true, bubbles: true, cancelable: true,
    })
    await act(async () => { stage.dispatchEvent(stale) })
    expect(stale.defaultPrevented).toBe(false)
  })

  it('stops zooming in once the figure is at the largest factor', async () => {
    mounted = await svgBody({}, {}, { stageWidth: 500 })
    const surface = defined(document.querySelector('.da-surface')) as HTMLElement
    const stage = defined(document.querySelector('.da-stage')) as HTMLElement
    stubRect(stage, { left: 0, top: 0, width: 500, height: 400 })
    // Pinch up to the 6x ceiling, which is where the factor stops moving.
    for (let step = 0; step < 12; step += 1) await pinch(stage, { deltaY: -40, clientX: 100, clientY: 100 })
    expect(surface.style.width).toBe('1200px')
    stage.scrollLeft = 0
    stage.scrollTop = 0
    await pinch(stage, { deltaY: -40, clientX: 100, clientY: 100 })
    expect(surface.style.width).toBe('1200px')
    // A pinch that cannot move the factor is still not the browser's to act on.
    expect(stage.scrollLeft).toBe(0)
    expect(stage.scrollTop).toBe(0)
  })

  it('zooms from the actual size when the stage has not been measured', async () => {
    // No width to fit into yet, so the fitted scale falls back to 1 and a pinch
    // grows the figure from its own size.
    mounted = await svgBody()
    const stage = defined(document.querySelector('.da-stage')) as HTMLElement
    const surface = defined(document.querySelector('.da-surface')) as HTMLElement
    expect(surface.style.width).toBe('200px')
    await pinch(stage, { deltaY: -40, clientX: 10, clientY: 10 })
    expect(Number.parseFloat(surface.style.width)).toBeCloseTo(200 * Math.exp(0.4), 1)
  })
})

describe('the icons', () => {
  it('draws every toolbar icon on one grid, so one stroke width means one thickness', () => {
    // stroke-width inside an inline SVG is in that icon's own units. Two icons set to
    // the same number but drawn on different grids come out at different thicknesses:
    // the pointer sat on a 24 grid beside five icons on a 16 grid, so it drew a third
    // thinner than the rest while being the fattest shape in the row. One grid is what
    // makes the row read as one set, and it is invisible until it is broken.
    return (async (): Promise<void> => {
      const { host } = await svgBody({ annotation: saved }, { mode: 'annotate' })
      const svgs = [...host.querySelectorAll<SVGSVGElement>('.da-tool-icon svg')]
      expect(svgs.length).toBeGreaterThan(4)
      for (const svg of svgs) expect(svg.getAttribute('viewBox')).toBe('0 0 24 24')
    })()
  })

  it('gives every tool its own glyph', () => {
    // Two tiles wearing the same drawing is worse than a plain one: the reader has to
    // press them to learn which is which, and the tool they cannot name is the one they
    // stop using. `element` once fell through to the pin `point` wears, so the picker
    // and the pin were the same drop.
    return (async (): Promise<void> => {
      const { host } = await svgBody({}, { mode: 'annotate' })
      const palette = defined(document.querySelector('.da-palette'))
      const drawings = [...palette.querySelectorAll('.da-tool-icon svg')].map(svg => svg.innerHTML)
      expect(drawings.length).toBeGreaterThan(6)
      expect(new Set(drawings).size).toBe(drawings.length)
      expect(host.querySelectorAll('.da-palette .da-tool')).toHaveLength(drawings.length)
    })()
  })
})

describe('the figure menu', () => {
  /** Let the desktop probe and any gesture settle before looking at the DOM. */
  async function settle(): Promise<void> {
    await act(async () => { await Promise.resolve() })
  }

  /**
   * A remote carrier that answers every gesture with `ok`, and records what it was
   * asked for — the menu's only outward effect besides the clipboard.
   */
  function carrier(): { remote: RemoteLike; asked: string[] } {
    const asked: string[] = []
    const remote: RemoteLike = {
      session: {
        canOpenWorkspacePath: async () => ({ ok: true, value: true }),
        openWorkspacePath: async (request: { readonly path: string; readonly action?: 'reveal' }) => {
          asked.push(`${request.action ?? 'open'} ${request.path}`)
          return { ok: true }
        },
      },
    }
    return { remote, asked }
  }

  /** Right-click the stage, the way a reader asks for the menu. */
  function rightClick(host: HTMLElement): void {
    act(() => {
      defined(host.querySelector('.da-stage')).dispatchEvent(
        new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 60, clientY: 40 }),
      )
    })
  }

  it('opens on a right-click and lists what the host can do', async () => {
    // The saved figure carries a workspace, so the relative row is offered beside
    // the absolute one; the carrier answers yes, so the two Host gestures are too.
    const { remote } = carrier()
    const { host } = await svgBody({ annotation: saved }, { remote })
    await settle()
    rightClick(host)
    expect(menuLabels(host)).toEqual([zh.menuSendToAgent, zh.menuSendToComposer, zh.menuOpen, zh.menuReveal, zh.menuCopyImage, zh.menuCopyRelative, zh.menuCopyAbsolute])
  })

  it('leaves out the host gestures when there is no desktop to perform them', async () => {
    const { host } = await svgBody({ annotation: saved })
    await settle()
    rightClick(host)
    expect(menuLabels(host)).toEqual([zh.menuSendToAgent, zh.menuSendToComposer, zh.menuCopyImage, zh.menuCopyRelative, zh.menuCopyAbsolute])
  })

  it('asks the host to open the figure, and says so', async () => {
    const { remote, asked } = carrier()
    const { host } = await svgBody({ annotation: saved }, { remote })
    await settle()
    rightClick(host)
    await click(defined(button(host, zh.menuOpen)))
    await settle()
    expect(asked).toEqual(['open /w/fig.svg'])
    expect(host.textContent).toContain(zh.menuOpened)
  })

  it('asks the host to reveal the figure in the file manager', async () => {
    const { remote, asked } = carrier()
    const { host } = await svgBody({ annotation: saved }, { remote })
    await settle()
    rightClick(host)
    await click(defined(button(host, zh.menuReveal)))
    await settle()
    expect(asked).toEqual(['reveal /w/fig.svg'])
    expect(host.textContent).toContain(zh.menuRevealed)
  })

  it('copies the path, and closes the menu as it does', async () => {
    const written: string[] = []
    vi.stubGlobal('navigator', { clipboard: { writeText: async (text: string) => { written.push(text) } } })
    const { host } = await svgBody({ annotation: saved })
    await settle()
    rightClick(host)
    await click(defined(button(host, zh.menuCopyAbsolute)))
    await settle()
    expect(written).toEqual(['/w/fig.svg'])
    expect(host.querySelector('.da-menu')).toBeNull()
    expect(host.textContent).toContain(zh.menuCopied)
  })

  it('copies the path relative to the workspace', async () => {
    const written: string[] = []
    vi.stubGlobal('navigator', { clipboard: { writeText: async (text: string) => { written.push(text) } } })
    const { host } = await svgBody({ annotation: saved })
    await settle()
    rightClick(host)
    await click(defined(button(host, zh.menuCopyRelative)))
    await settle()
    expect(written).toEqual(['fig.svg'])
  })

  it('says so when the clipboard refuses', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: async () => { throw new Error('denied') } } })
    const { host } = await svgBody({ annotation: saved })
    await settle()
    rightClick(host)
    await click(defined(button(host, zh.menuCopyAbsolute)))
    await settle()
    expect(host.textContent).toContain(zh.menuCopyFailed)
  })

  it('stays open while the reader presses inside it', async () => {
    const { host } = await svgBody({ annotation: saved })
    await settle()
    rightClick(host)
    const panel = defined(host.querySelector('.da-menu'))
    act(() => { panel.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true })) })
    expect(host.querySelector('.da-menu')).not.toBeNull()
  })

  it('closes on Escape without also dropping the selection it opened over', async () => {
    // The menu opens on a press, and that press also selects the mark under it. One
    // Escape used to be heard twice — once by the menu, once by the panel — so it
    // closed the menu *and* let go of the selection, undoing two things at once.
    const { host } = await svgBody({ annotation: saved }, { openPanel: 'list' })
    await settle()
    await click(defined(host.querySelector('.da-mark-text')))
    expect(host.querySelector('.da-mark[data-selected="true"]')).not.toBeNull()
    rightClick(host)
    expect(host.querySelector('.da-menu')).not.toBeNull()
    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await Promise.resolve()
    })
    expect(host.querySelector('.da-menu')).toBeNull()
    expect(host.querySelector('.da-mark[data-selected="true"]')).not.toBeNull()
  })

  it('takes the keyboard when it opens, and moves through the rows with the arrows', async () => {
    // `role="menu"` with no keyboard model is a promise the reader cannot reach: the
    // keys every menu answers did nothing, and Tab walked one stop per row.
    const { host } = await svgBody({ annotation: saved })
    await settle()
    rightClick(host)
    const rows = [...host.querySelectorAll('.da-menu-item')] as HTMLButtonElement[]
    expect(rows.length).toBeGreaterThan(1)
    expect(document.activeElement).toBe(rows[0])
    await act(async () => {
      rows[0]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
      await Promise.resolve()
    })
    expect(document.activeElement).toBe(rows[1])
    // One roving tab stop: the menu owns the keyboard, so Tab has one place to go.
    expect(rows.filter(row => row.tabIndex === 0)).toHaveLength(1)
  })

  it('closes itself when a row is chosen from the keyboard', async () => {
    const written: string[] = []
    vi.stubGlobal('navigator', { clipboard: { writeText: async (text: string) => { written.push(text) } } })
    const { host } = await svgBody({ annotation: saved })
    await settle()
    rightClick(host)
    const rows = [...host.querySelectorAll('.da-menu-item')] as HTMLButtonElement[]
    const at = rows.findIndex(row => row.textContent === zh.menuCopyAbsolute)
    expect(at).toBeGreaterThan(-1)
    // Walk to the row with the arrows, the way a reader would: the menu keeps its own
    // place in the list, and Enter acts on that place rather than on whatever happens
    // to hold focus.
    for (let step = 0; step < at; step += 1) {
      await act(async () => {
        defined(document.activeElement).dispatchEvent(
          new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
        )
        await Promise.resolve()
      })
    }
    await act(async () => {
      defined(document.activeElement).dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
      )
      for (let turn = 0; turn < 8; turn += 1) await Promise.resolve()
    })
    expect(host.querySelector('.da-menu')).toBeNull()
    expect(written).toContain('/w/fig.svg')
  })

  it('acts on the space bar as well as Enter, the way a button does', async () => {
    const written: string[] = []
    vi.stubGlobal('navigator', { clipboard: { writeText: async (text: string) => { written.push(text) } } })
    const { host } = await svgBody({ annotation: saved })
    await settle()
    rightClick(host)
    const rows = [...host.querySelectorAll('.da-menu-item')] as HTMLButtonElement[]
    const at = rows.findIndex(row => row.textContent === zh.menuCopyAbsolute)
    for (let step = 0; step < at; step += 1) {
      await act(async () => {
        defined(document.activeElement).dispatchEvent(
          new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
        )
        await Promise.resolve()
      })
    }
    await act(async () => {
      defined(document.activeElement).dispatchEvent(
        new KeyboardEvent('keydown', { key: ' ', bubbles: true }),
      )
      for (let turn = 0; turn < 8; turn += 1) await Promise.resolve()
    })
    expect(host.querySelector('.da-menu')).toBeNull()
    expect(written).toContain('/w/fig.svg')
  })

  it('says so when the host refuses to open the figure', async () => {
    const remote: RemoteLike = {
      session: {
        canOpenWorkspacePath: async () => ({ ok: true, value: true }),
        openWorkspacePath: async () => ({ ok: false }),
      },
    }
    const { host } = await svgBody({ annotation: saved }, { remote })
    await settle()
    rightClick(host)
    await click(defined(button(host, zh.menuOpen)))
    await settle()
    expect(host.textContent).toContain(zh.menuOpenFailed)
  })

  it('offers only the absolute copy for a figure outside the workspace', async () => {
    // A Host that names no Session directory: the figure still loads, and the one
    // row that always works is the only copy row left. This figure also has no
    // marks, so there is nothing to hand over either.
    const { host } = await svgBody({ workspace: null })
    await settle()
    rightClick(host)
    expect(menuLabels(host)).toEqual([zh.menuCopyImage, zh.menuCopyAbsolute])
  })

  it('offers the hand-off when the figure has marks to hand over', async () => {
    const { host } = await svgBody({ annotation: saved, workspace: null })
    await settle()
    rightClick(host)
    expect(menuLabels(host)).toEqual([zh.menuSendToAgent, zh.menuSendToComposer, zh.menuCopyImage, zh.menuCopyAbsolute])
  })

  it('sends the figure to the agent from the menu', async () => {
    const { sessions, prompts } = stubSessions()
    const { host } = await svgBody({ annotation: saved }, { sessions })
    await settle()
    rightClick(host)
    // Scoped to the menu: the dock's own send button carries the same words.
    await click(defined(host.querySelector('.da-menu')?.querySelector('button')))
    await settle()
    expect(prompts).toHaveLength(1)
  })

  it('hands the figure to the composer from the menu', async () => {
    const composer = stubComposer()
    const { host } = await svgBody({ annotation: saved }, { conversation: composer.conversation })
    await settle()
    rightClick(host)
    // The second row of the menu is the composer hand-off.
    await click(defined(host.querySelectorAll('.da-menu button')[1] as HTMLButtonElement | undefined))
    await settle()
    // The draft the composer was handed is the same message the dock's button writes.
    expect(composer.drafts).toBe('page-1.png:image/png')
  })

  it('says so when the host refuses to reveal the figure', async () => {
    const remote: RemoteLike = {
      session: {
        canOpenWorkspacePath: async () => ({ ok: true, value: true }),
        openWorkspacePath: async () => ({ ok: false }),
      },
    }
    const { host } = await svgBody({ annotation: saved }, { remote })
    await settle()
    rightClick(host)
    await click(defined(button(host, zh.menuReveal)))
    await settle()
    expect(host.textContent).toContain(zh.menuRevealFailed)
  })

  it('copies the picture the reader sees', async () => {
    const taken: string[] = []
    vi.stubGlobal('ClipboardItem', class {
      readonly types: string[]
      constructor(parts: Record<string, Blob>) { this.types = Object.keys(parts) }
    })
    vi.stubGlobal('navigator', {
      clipboard: { write: async (items: unknown[]) => { taken.push((items[0] as { types: string[] }).types[0] ?? '') } },
    })
    const { host } = await svgBody({ annotation: saved })
    await settle()
    rightClick(host)
    await click(defined(button(host, zh.menuCopyImage)))
    await settle()
    expect(taken).toEqual(['image/png'])
    expect(host.textContent).toContain(zh.menuCopied)
  })

  it('says so when the picture could not be copied', async () => {
    const { host } = await svgBody({ annotation: saved })
    await settle()
    rightClick(host)
    await click(defined(button(host, zh.menuCopyImage)))
    await settle()
    // No ClipboardItem in this environment, so the write cannot happen.
    expect(host.textContent).toContain(zh.menuCopyFailed)
  })

  it('says so when the picture could not even be drawn', async () => {
    // A copy that fails while composing the export never reaches the clipboard, so
    // the reader gets the same sentence rather than a menu that closed silently.
    vi.stubGlobal('ClipboardItem', class {
      readonly types: string[]
      constructor(parts: Record<string, Blob>) { this.types = Object.keys(parts) }
    })
    vi.stubGlobal('navigator', { clipboard: { write: async () => {} } })
    stubRasterizer({ imageError: true })
    const { host } = await svgBody({ annotation: saved })
    await settle()
    rightClick(host)
    await click(defined(button(host, zh.menuCopyImage)))
    await settle()
    expect(host.textContent).toContain(zh.menuCopyFailed)
  })

  it('closes when the reader presses Escape', async () => {
    const { host } = await svgBody({ annotation: saved })
    await settle()
    rightClick(host)
    expect(host.querySelector('.da-menu')).not.toBeNull()
    act(() => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })) })
    expect(host.querySelector('.da-menu')).toBeNull()
  })

  it('closes when the reader clicks elsewhere', async () => {
    const { host } = await svgBody({ annotation: saved })
    await settle()
    rightClick(host)
    expect(host.querySelector('.da-menu')).not.toBeNull()
    act(() => { document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true })) })
    expect(host.querySelector('.da-menu')).toBeNull()
  })
})

describe('the floating strips', () => {
  /** Drag one of the strips by its grip. */
  async function dragStrip(host: HTMLElement, selector: string, dx: number, dy: number): Promise<HTMLElement> {
    const strip = defined(host.querySelector(selector)) as HTMLElement
    stubRect(strip, { left: 100, top: 300, width: 200, height: 40 })
    const grip = defined(strip.querySelector('.da-palette-grip')) as HTMLElement
    // jsdom has neither capture method; a browser has both, and the strip calls them
    // through an optional chain so either world moves it.
    Object.defineProperty(grip, 'setPointerCapture', { configurable: true, value: () => {} })
    Object.defineProperty(grip, 'releasePointerCapture', { configurable: true, value: () => {} })
    await act(async () => {
      grip.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 120, clientY: 310 }))
    })
    await act(async () => {
      grip.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 120 + dx, clientY: 310 + dy }))
    })
    await act(async () => {
      grip.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientX: 120 + dx, clientY: 310 + dy }))
    })
    return strip
  }

  it('turns each grip to match the pair the reader asked for', async () => {
    // Six dots in three columns by two rows on the upright palette, two by three on
    // the bar. That is the opposite of what each strip's own proportions suggest, and
    // it was got backwards once already — pinned so it is not "corrected" again.
    mounted = await svgBody({}, { mode: 'annotate' })
    const shape = (selector: string): string => {
      const dots = defined(document.querySelector(`${selector} .da-grip-dots`)) as SVGElement
      const xs = new Set<string>()
      const ys = new Set<string>()
      for (const dot of [...dots.querySelectorAll('circle')]) {
        xs.add(dot.getAttribute('cx') ?? '')
        ys.add(dot.getAttribute('cy') ?? '')
      }
      return `${xs.size}x${ys.size}`
    }
    expect(shape('.da-palette')).toBe('3x2')
    expect(shape('.da-bar')).toBe('2x3')
  })

  it('parks the tools where they are dragged, and leaves them there next time', async () => {
    mounted = await svgBody({}, { mode: 'annotate' })
    const root = defined(document.querySelector('.da-root')) as HTMLElement
    stubRect(root, { left: 0, top: 0, width: 400, height: 600 })
    const strip = await dragStrip(document.body, '.da-palette', 80, 120)
    // 80/400 across and 120/600 down, from the default spot near the top left.
    expect(Number.parseFloat(strip.style.left)).toBeCloseTo(22, 3)
    expect(Number.parseFloat(strip.style.top)).toBeCloseTo(24, 3)
    // The reader's parking spot outlives the panel: a reload finds it where it was.
    expect(readPreferences().palette?.x).toBeCloseTo(0.22, 6)
    expect(readPreferences().palette?.y).toBeCloseTo(0.24, 6)
  })

  it('parks the bar where it is dragged, and uses the far edge once past the middle', async () => {
    mounted = await svgBody({}, { mode: 'annotate' })
    const root = defined(document.querySelector('.da-root')) as HTMLElement
    stubRect(root, { left: 0, top: 0, width: 400, height: 600 })
    const strip = await dragStrip(document.body, '.da-bar', 320, 300)
    // Past the middle of either axis the strip is measured from its far edge, so its
    // whole box stays on the panel.
    expect(Number.parseFloat(strip.style.left)).toBeCloseTo(82, 3)
    expect(Number.parseFloat(strip.style.top)).toBeCloseTo(54, 3)
    expect(strip.style.transform).toContain('-100%')
    expect(readPreferences().bar?.x).toBeCloseTo(0.82, 6)
    expect(readPreferences().bar?.y).toBeCloseTo(0.54, 6)
  })

  it('measures a strip from its near edge while it is in the first half', async () => {
    mounted = await svgBody({}, { mode: 'annotate' })
    const root = defined(document.querySelector('.da-root')) as HTMLElement
    stubRect(root, { left: 0, top: 0, width: 400, height: 600 })
    const bar = await dragStrip(document.body, '.da-bar', 60, 60)
    // Left of centre and above it: the strip hangs from its own top left corner, so
    // its box grows right and down from the pointer rather than being measured back
    // from the far edge.
    expect(bar.style.transform).toContain('translate(0, 0)')
    expect(Number.parseFloat(bar.style.top)).toBeCloseTo(14, 3)
  })

  it('lets a cancelled drag drop the strip where it was', async () => {
    mounted = await svgBody({}, { mode: 'annotate' })
    const root = defined(document.querySelector('.da-root')) as HTMLElement
    stubRect(root, { left: 0, top: 0, width: 400, height: 600 })
    // A gesture the system takes away — a palm, a scroll, another pointer — must end
    // the drag cleanly rather than leave the strip glued to the next move.
    for (const selector of ['.da-palette', '.da-bar']) {
      const strip = defined(document.querySelector(selector)) as HTMLElement
      const grip = defined(strip.querySelector('.da-palette-grip')) as HTMLElement
      await act(async () => {
        grip.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 100, clientY: 300 }))
      })
      await act(async () => {
        grip.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 140, clientY: 360 }))
      })
      await act(async () => {
        grip.dispatchEvent(new MouseEvent('pointercancel', { bubbles: true }))
      })
      expect(strip.getAttribute('data-dragging')).toBeNull()
    }
  })

  it('flips the tools against the far edges when parked past the middle', async () => {
    mounted = await svgBody({}, { mode: 'annotate' })
    const root = defined(document.querySelector('.da-root')) as HTMLElement
    stubRect(root, { left: 0, top: 0, width: 400, height: 600 })
    const strip = await dragStrip(document.body, '.da-palette', 380, 560)
    // The palette is measured back from its far corner there, so the whole strip
    // stays on the panel instead of hanging off it.
    expect(strip.style.transform).toBe('translate(-100%, -100%)')
  })

  it('does nothing when a grip is dragged without a press on it', async () => {
    mounted = await svgBody({}, { mode: 'annotate' })
    const strip = defined(document.querySelector('.da-palette')) as HTMLElement
    const grip = defined(strip.querySelector('.da-palette-grip')) as HTMLElement
    // A stray move with no press behind it must not move the strip.
    await act(async () => {
      grip.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 300, clientY: 300 }))
    })
    expect(strip.style.left).toBe('2%')
  })
})

describe('moving the view by hand', () => {
  /** Drag the empty surface, as a reader pushes the table around. */
  async function panView(host: HTMLElement, from: readonly [number, number], to: readonly [number, number]): Promise<void> {
    const overlay = defined(host.querySelector('svg.da-overlay')) as SVGSVGElement
    stubRect(overlay, { left: 0, top: 0, width: 200, height: 100 })
    for (const [element, type, point] of [
      [overlay, 'pointerdown', from],
      [overlay, 'pointermove', to],
      [overlay, 'pointerup', to],
    ] as const) {
      await act(async () => {
        element.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX: point[0], clientY: point[1] }))
      })
    }
  }

  it('moves the view when the empty canvas is dragged, so a zoomed figure can be reached', async () => {
    mounted = await svgBody({ annotation: saved }, {}, { stageWidth: 500 })
    const stage = defined(document.querySelector('.da-stage')) as HTMLElement
    stubRect(stage, { left: 0, top: 0, width: 500, height: 400 })
    stage.scrollLeft = 100
    stage.scrollTop = 60
    // Pushing the paper right and down scrolls the view left and up.
    await panView(defined(document.body as HTMLElement), [100, 100], [140, 130])
    expect(stage.scrollLeft).toBe(60)
    expect(stage.scrollTop).toBe(30)
  })

  it('shows the hand while the view is being moved, and lets go when it is', async () => {
    mounted = await svgBody({ annotation: saved }, {}, { stageWidth: 500 })
    const stage = defined(document.querySelector('.da-stage')) as HTMLElement
    stubRect(stage, { left: 0, top: 0, width: 500, height: 400 })
    const overlay = defined(document.querySelector('svg.da-overlay')) as SVGSVGElement
    stubRect(overlay, { left: 0, top: 0, width: 200, height: 100 })
    expect(stage.getAttribute('data-hand')).toBe('true')
    await act(async () => {
      overlay.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 100, clientY: 100 }))
    })
    expect(stage.getAttribute('data-panning')).toBe('true')
    await act(async () => {
      overlay.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 120, clientY: 120 }))
      overlay.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientX: 120, clientY: 120 }))
    })
    expect(stage.getAttribute('data-panning')).toBeNull()
  })

  it('offers no hand under a drawing tool, because that drag draws instead', async () => {
    mounted = await svgBody({}, {}, { stageWidth: 500 })
    const stage = defined(document.querySelector('.da-stage')) as HTMLElement
    await click(button(document.body, zh.toolArrow))
    expect(stage.getAttribute('data-hand')).toBeNull()
    await click(button(document.body, zh.toolSelect))
    expect(stage.getAttribute('data-hand')).toBe('true')
  })

  it('keeps the selection a pan was carrying when the drag ends', async () => {
    // A drag finishes with a click on the surface, and a click on the surface means
    // "nothing selected" — which would throw away the mark the reader panned to.
    mounted = await svgBody({ annotation: saved }, {}, { stageWidth: 500 })
    const stage = defined(document.querySelector('.da-stage')) as HTMLElement
    stubRect(stage, { left: 0, top: 0, width: 500, height: 400 })
    await openList(document.body)
    await click(defined(document.querySelector('.da-mark')) as HTMLElement)
    expect(document.querySelector('.da-mark')?.getAttribute('data-selected')).toBe('true')
    const overlay = defined(document.querySelector('svg.da-overlay')) as SVGSVGElement
    stubRect(overlay, { left: 0, top: 0, width: 200, height: 100 })
    await act(async () => {
      overlay.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 100, clientY: 100 }))
      overlay.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 130, clientY: 100 }))
      overlay.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientX: 130, clientY: 100 }))
      overlay.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 130, clientY: 100 }))
    })
    // Pressing on the figure folds the list away, so it is opened again to read the
    // selection off the row that shows it.
    await openList(document.body)
    expect(document.querySelector('.da-mark')?.getAttribute('data-selected')).toBe('true')
  })

  it('still clears the selection on a plain click on nothing', async () => {
    mounted = await svgBody({ annotation: saved }, {}, { stageWidth: 500 })
    await openList(document.body)
    await click(defined(document.querySelector('.da-mark')) as HTMLElement)
    const overlay = defined(document.querySelector('svg.da-overlay')) as SVGSVGElement
    stubRect(overlay, { left: 0, top: 0, width: 200, height: 100 })
    await act(async () => {
      overlay.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 100, clientY: 100 }))
    })
    expect(document.querySelector('.da-mark')?.getAttribute('data-selected')).toBe('false')
  })
})

describe('repainting a mark that is already there', () => {
  it('stamps the picked colour onto the selected mark, and takes it back with undo', async () => {
    mounted = await svgBody({ annotation: saved })
    // The colour is read off the mark on the figure rather than off its row, because
    // the row lives in a popover and popovers close each other.
    // The group also holds the white halo under the stroke and the transparent path
    // that makes the mark easy to hit; the mark's own colour is neither of those.
    const painted = (): string | null => defined(
      document.querySelector('[data-da-mark] path[stroke]:not([stroke="#ffffff"]):not([stroke="transparent"])'),
    ).getAttribute('stroke')
    // With nothing selected a swatch arms the next stroke; with one selected it
    // repaints that mark, which is the difference the reader is choosing between.
    await openStyle(document.body)
    await click(defined(document.querySelector('.da-swatch[aria-label="#2f9e44"]')))
    // Nothing selected yet, so the next stroke was armed instead: the mark is untouched.
    expect(painted()).toBe('#e03131')
    await selectFirstMark(document.body)
    // Opening the list shut the swatches — one popover at a time — so the panel comes
    // back now that there is a mark to repaint.
    await openStyle(document.body)
    await click(defined(document.querySelector('.da-swatch[aria-label="#2f9e44"]')))
    expect(painted()).toBe('#2f9e44')
    await click(button(document.body, zh.undo))
    expect(painted()).toBe('#e03131')
  })

  it('leaves the other marks on the figure alone when one is repainted', async () => {
    // Two marks, so the repaint walks a list where one entry is not the mark being
    // changed: the other one has to come through the map untouched.
    const twoMarks: AnnotationDocument = {
      ...saved,
      marks: [
        { id: 'm1', kind: 'arrow', color: '#e03131', points: [[10, 10], [40, 30]], detail: '第一条' },
        { id: 'm2', kind: 'rect', color: '#1971c2', points: [[60, 40], [90, 70]], detail: '第二条' },
      ],
    }
    mounted = await svgBody({ annotation: twoMarks })
    const painted = (): string[] => [...document.querySelectorAll(
      '[data-da-mark] path[stroke]:not([stroke="#ffffff"]):not([stroke="transparent"])',
    )].map(path => defined(path.getAttribute('stroke')))
    await openList(document.body)
    await click(defined(document.querySelectorAll('.da-mark-text')[0]) as HTMLElement)
    await openStyle(document.body)
    await click(defined(document.querySelector('.da-swatch[aria-label="#2f9e44"]')))
    expect(painted()).toEqual(['#2f9e44', '#1971c2'])
  })

  it('records no undo step for the colour a mark already wears', async () => {
    mounted = await svgBody({ annotation: saved })
    await selectFirstMark(document.body)
    await openStyle(document.body)
    await click(defined(document.querySelector('.da-swatch[aria-label="#e03131"]')))
    // The mark was already that colour, so there is still only the load to walk back.
    expect(button(document.body, zh.undo).disabled).toBe(true)
  })
})

describe('moving to a different figure', () => {
  const OTHER = 'dsh-resource://file/session/s1/other.svg'

  /** A saved annotation for the second figure, with a mark and a sentence of its own. */
  const elsewhere: AnnotationDocument = {
    ...saved,
    figure: { ...saved.figure, address: OTHER, path: '/w/other.svg' },
    summary: '第二张图的整体说明',
    marks: [{ id: 's1', kind: 'ellipse', color: '#2f9e44', points: [[5, 5], [25, 25]], detail: '第二张的标注' }],
  }

  /**
   * Answer the Host per address, so a change of document gets a different document.
   * @param forOther - what the second address answers with.
   */
  function stubByAddress(forOther: AnnotationDocument | null): void {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const body = url.includes('other.svg')
        ? hostPayload({ annotation: forOther })
        : hostPayload({ annotation: saved })
      return { json: async () => body, status: 200 }
    }))
  }

  /**
   * Hand the mounted body a different document.
   *
   * The panel is registered once, not once per figure, so this is an ordinary event:
   * the same component sees one address and then another, and everything it kept for
   * the first one has to go.
   */
  async function moveTo(result: { readonly root: Root }): Promise<void> {
    await act(async () => {
      result.root.render(
        <AnnotatorBody content={{ kind: 'bytes', data: svgBytes() }} resourceAddress={OTHER} />,
      )
      for (let turn = 0; turn < 8; turn += 1) await Promise.resolve()
    })
  }

  it('carries nothing from the figure it left, including what it could undo', async () => {
    // The undo trail describes edits to *that* document. Kept across a change of
    // document it walks back into a file the reader is no longer looking at, and
    // pressing undo on a clean figure would put another figure's marks on it.
    mounted = await svgBody({ annotation: saved })
    await openList(document.body)
    await click(defined(document.querySelector('.da-mark-del')))
    // One step to walk back, so the trail is not empty when the figure changes.
    expect(button(document.body, zh.undo).disabled).toBe(false)
    stubByAddress(null)
    await moveTo(mounted)
    expect(document.querySelectorAll('[data-da-mark]')).toHaveLength(0)
    // Nothing to walk back to, and nothing to walk forward to either.
    expect(button(document.body, zh.undo).disabled).toBe(true)
    expect(button(document.body, zh.redo).disabled).toBe(true)
  })

  it('forgets the sentence the old figure carried, and its timestamp with it', async () => {
    // The overall note describes the figure it was written about. Kept across a
    // change of document it becomes a sentence about a picture nobody is looking at,
    // and it would be saved under the new figure's name on the next edit.
    mounted = await svgBody({ annotation: saved })
    expect((await openGoal(document.body)).value).toBe('改标号')
    stubByAddress(null)
    await moveTo(mounted)
    expect((await openGoal(document.body)).value).toBe('')
  })

  it('shows what the new figure was saved with, instead of a blank sheet', async () => {
    // A clean sheet is right only for a figure with no sidecar. One that was already
    // annotated has to come back with its own marks and its own sentence.
    mounted = await svgBody({ annotation: saved })
    await openList(document.body)
    await click(defined(document.querySelector('.da-mark-del')))
    stubByAddress(elsewhere)
    await moveTo(mounted)
    expect(document.querySelectorAll('[data-da-mark]')).toHaveLength(1)
    await openList(document.body)
    expect(document.body.textContent).toContain('第二张的标注')
    expect(document.body.textContent).not.toContain('标号指错了')
    expect((await openGoal(document.body)).value).toBe('第二张图的整体说明')
    // The trail still starts clean: the loaded marks are where this document opens,
    // not something the reader typed on it.
    expect(button(document.body, zh.undo).disabled).toBe(true)
  })
})

describe('the hand-off inside the comment', () => {
  it('offers the two ways out once the comment says something, and neither before', async () => {
    mounted = await svgBody()
    await drawArrow(document.body)
    // A freshly drawn mark has no sentence, so the pill is only a place to type.
    expect(document.querySelector('.da-comment-send')).toBeNull()
    await type(detailBox(), '这条曲线缺图例')
    expect(document.querySelectorAll('.da-comment-send-btn')).toHaveLength(2)
  })

  it('hands the comment to the composer from the pill as well', async () => {
    const written: string[] = []
    const conversation: ComposerLike = {
      input: {
        shell: () => ({
          snapshot: { draft: '' },
          setDraft: (text: string) => { written.push(text) },
          addAttachments: () => true,
        }),
      },
      createDrafts: () => [],
      releaseDraftAttachments: () => {},
    }
    const result = await svgBody({}, { conversation })
    mounted = result
    await drawArrow(result.host)
    await type(detailBox(result.host), '送进对话框')
    await click(defined(result.host.querySelectorAll('.da-comment-send-btn')[1]))
    expect(defined(written[0])).toContain('送进对话框')
  })

  it('sends only what the pill is about, not every mark on the figure', async () => {
    // A second mark on the same figure, whose sentence must not travel with a
    // hand-off started from the first one's comment.
    const { sessions } = stubSessions()
    const result = await svgBody({}, { sessions })
    mounted = result
    await drawArrow(document.body)
    await type(detailBox(result.host), '第一条')
    await drawArrow(document.body)
    await type(detailBox(result.host), '第二条')
    // The pill belongs to the second mark, so its hand-off carries that one sentence
    // — not the figure's other comments, which are not what the reader pointed at.
    await click(defined(result.host.querySelector('.da-comment-send-primary')))
    // Autosave posts the whole draft as it grows, so the hand-off is the last write,
    // not the first one.
    const writes = result.calls.filter(call => call.init?.method === 'POST')
    const sent = defined(writes[writes.length - 1])
    const body = JSON.stringify(postBody(sent))
    expect(body).toContain('第二条')
    expect(body).not.toContain('第一条')
  })

  it('pictures only the mark it is sending, not the whole surface', async () => {
    // The picture is the record of what was sent. Rasterizing every mark on the panel
    // handed the agent a record containing marks the reader had deliberately left
    // behind — and numbered from the picture's own order while the prose numbered from
    // the document's, so the two disagreed about which mark was which.
    const { sessions } = stubSessions()
    const result = await svgBody({}, { sessions })
    mounted = result
    // Two arrows at different places, so a picture of both is measurably bigger than a
    // picture of one: the second reaches further right and further down.
    await drawArrowAt(result.host, [20, 20], [120, 80])
    await type(detailBox(result.host), '第一条')
    await drawArrowAt(result.host, [140, 30], [300, 160])
    await type(detailBox(result.host), '第二条')
    const raster = stubRasterizer()
    await click(defined(result.host.querySelector('.da-comment-send-primary')))
    const writes = result.calls.filter(call => call.init?.method === 'POST')
    const sent = defined(postBody(defined(writes[writes.length - 1]))['annotation'] as AnnotationDocument | undefined)
    const sentMarks = sent.marks
    const figure = {
      width: defined(sent.figure.width),
      height: defined(sent.figure.height),
    }
    // The document carried one mark, not the two on the panel.
    expect(sentMarks).toHaveLength(1)
    // And the picture was drawn on paper sized from exactly those marks, which is the
    // second one — the one the pill belonged to, out at x=300.
    const layer = { kind: 'raster' as const, dataUrl: '', width: figure.width, height: figure.height }
    const one = reviewSize(layer, sentMarks)
    // A mark set that reaches further than the sent one, so this assertion can tell
    // the two apart rather than passing on any surface at all.
    const wider = reviewSize(layer, [
      ...sentMarks,
      { id: 'outside', kind: 'arrow', color: '#e03131', points: [[0, 0], [figure.width + 200, figure.height]] },
    ])
    const scale = Math.min(2, Math.max(1, 2400 / Math.max(one.width, one.height)))
    expect(defined(raster.canvasSizes[0])).toEqual({
      width: Math.max(1, Math.round(one.width * scale)),
      height: Math.max(1, Math.round(one.height * scale)),
    })
    // A picture of anything reaching further would have come out wider than that.
    expect(wider.width).toBeGreaterThan(one.width)
  })
})

  it('keeps the marks it did not send, and their sidecar, after a one-mark hand-off', async () => {
    // The pill's buttons sit beside one sentence, so they mean that sentence. Taking
    // the rest of the figure with them would lose work the reader never pointed at,
    // and the delete is on disk, so nothing would bring it back.
    const { sessions } = stubSessions()
    const result = await svgBody({}, { sessions })
    mounted = result
    await drawArrow(result.host)
    await type(detailBox(result.host), '第一条')
    await drawArrow(result.host)
    await type(detailBox(result.host), '第二条')
    await click(defined(result.host.querySelector('.da-comment-send-primary')))
    // The survivor is what the sidecar has to describe next, and the write that
    // puts it there is the ordinary autosave — the one that also deletes the file
    // when nothing is left, so a last mark sent leaves no sidecar behind.
    await act(async () => { await new Promise(resolve => setTimeout(resolve, AUTOSAVE_DELAY_MS + 20)) })
    // One mark left on the surface, and the file was rewritten rather than deleted.
    expect(result.host.querySelectorAll('[data-da-mark]')).toHaveLength(1)
    expect(result.calls.filter(call => call.init?.method === 'DELETE')).toHaveLength(0)
    const writes = result.calls.filter(call => call.init?.method === 'POST')
    const last = JSON.stringify(postBody(writes[writes.length - 1]))
    expect(last).toContain('第一条')
    expect(last).not.toContain('第二条')
  })

  it('says the rest stayed, so the reader is not left counting', async () => {
    const { sessions } = stubSessions()
    const result = await svgBody({}, { sessions })
    mounted = result
    await drawArrow(result.host)
    await type(detailBox(result.host), '第一条')
    await drawArrow(result.host)
    await type(detailBox(result.host), '第二条')
    await click(defined(result.host.querySelector('.da-comment-send-primary')))
    // The whole-figure copy says the panel was cleared. Saying that here would be
    // false, and a reader who trusted it would not look for the mark they kept.
    expect(defined(document.querySelector('.da-status')).textContent).toBe(zh.sentOne)
  })

  it('hands the mark to its owner instead of sending for itself, when it has one', async () => {
    // A page of a document has no seat of its own: its save is the document's, and a
    // body that ran its own hand-off failed every time (the page never reads a
    // sidecar, so it has no document to build).
    const handed: { readonly id: string; readonly target: string }[] = []
    const result = await svgBody({}, {
      onSendMark: (mark, target) => { handed.push({ id: mark.id, target }) },
    })
    mounted = result
    await drawArrow(result.host)
    await type(detailBox(result.host), '交给文档')
    await click(defined(result.host.querySelector('.da-comment-send-primary')))
    expect(handed).toHaveLength(1)
    expect(defined(handed[0]).target).toBe('agent')
    // Nothing was posted from here: the document does the saving, and a second write
    // from the page would describe one page as if it were the whole file.
    expect(result.calls.filter(call => call.init?.method === 'POST')).toHaveLength(0)
  })

  it('leaves the other pages alone when one page is told to clear', async () => {
    // Clearing a paged document is the document's act: one sidecar serves every page,
    // so a page that deleted it while the other pages kept their rows would damage
    // the file and half-clear the document.
    let cleared = 0
    const result = await svgBody({}, { onDocumentClear: () => { cleared += 1 } })
    mounted = result
    await drawArrow(result.host)
    await openList(result.host)
    await click(button(result.host, zh.clear))
    expect(cleared).toBe(1)
    expect(result.calls.filter(call => call.init?.method === 'DELETE')).toHaveLength(0)
  })

describe('the weight of the pen', () => {
  /** The stroke width one drawn mark carries on the surface. */
  const paintedWidth = (): string | null => defined(
    document.querySelector('[data-da-mark] path[stroke]:not([stroke="#ffffff"]):not([stroke="transparent"])'),
  ).getAttribute('stroke-width')

  /**
   * The size multiple the fixture's figure is drawn at.
   *
   * The fixture is a 200px figure — well below the reference edge — so every stroke is
   * scaled down with it. The numbers in these tests are the drawn width, so they carry
   * the multiple.
   */
  const UNIT = figureUnit(200, 100)

  /** The rail, which only exists once there is something for it to size. */
  const rail = (): HTMLInputElement => defined(
    document.querySelector('.da-weight-input'),
  ) as HTMLInputElement

  it('draws a new mark at the weight the rail is set to', async () => {
    // The rail sizes the mark being worked on, so with nothing selected it waits for
    // a drawing tool: it stands down under `select`, where there is no next stroke.
    mounted = await svgBody(undefined, { mode: 'annotate' })
    await click(button(document.body, zh.toolArrow))
    await type(rail(), '3')
    await drawArrow(document.body)
    expect(paintedWidth()).toBe(String(STROKE_WIDTH * 3 * UNIT))
  })

  it('repaints the selected mark instead of the next one, and takes the heavier pen back with undo', async () => {
    mounted = await svgBody({ annotation: saved })
    await selectFirstMark(document.body)
    await type(rail(), '2')
    expect(paintedWidth()).toBe(String(STROKE_WIDTH * 2 * UNIT))
    await click(button(document.body, zh.undo))
    expect(paintedWidth()).toBe(String(STROKE_WIDTH * UNIT))
  })

  it('records no undo step for the weight a mark already wears', async () => {
    mounted = await svgBody({ annotation: saved })
    await selectFirstMark(document.body)
    // The fixture's mark carries no weight, which is the default pen.
    await type(rail(), '1')
    expect(button(document.body, zh.undo).disabled).toBe(true)
  })

  it('stands the rail down for an element, which has no size to set', async () => {
    // The complaint this answers: selecting an element left a weight slider open on
    // the toolbar, and moving it changed nothing — the mark names something in the
    // figure and draws a light on it, so there is no stroke and no pin. A control that
    // moves nothing is worse than no control: it reads as a promise it cannot keep.
    mounted = await svgBody({ annotation: elementOnly })
    await selectFirstMark(document.body)
    expect(document.querySelector('.da-weight')).toBeNull()
    expect(document.querySelector('.da-weight-input')).toBeNull()
  })

  it('stands the rail down for a point, whose pin the rail cannot size', async () => {
    // The rail belongs to the stroke, and a pin is a place rather than a line: it used
    // to grow with the rail, which is how a rail left at 4 turned the next pin into a
    // marker four times its size. With that link gone the rail stood open on a mark it
    // moved nothing on — the same lie the element marks were telling.
    mounted = await svgBody({ annotation: pointOnly })
    await selectFirstMark(document.body)
    expect(document.querySelector('.da-weight')).toBeNull()
  })

  it('draws the same pin whatever the rail was left at', async () => {
    // The pin is sized by the figure alone now, so a mark placed while the rail reads
    // 4 and one placed while it reads 1 are the same marker. This is the whole point
    // of cutting the link: the reader's last arrow must not decide how big the next
    // place-marker lands.
    const wide = { ...pointOnly }
    wide.marks = [{ ...(saved.marks[0] as AnnotationMark), kind: 'point', points: [[20, 60]], weight: 4 }]
    mounted = await svgBody({ annotation: wide })
    const d = (): string | null => defined(document.querySelector('[data-da-mark] path')).getAttribute('d')
    const heavy = d()
    await act(async () => { mounted?.root.unmount() })
    mounted = undefined
    const plain = { ...pointOnly }
    plain.marks = [{ ...(saved.marks[0] as AnnotationMark), kind: 'point', points: [[20, 60]] }]
    mounted = await svgBody({ annotation: plain })
    expect(d()).toBe(heavy)
  })

  it('keeps the comment buttons inside the panel when the pill sits at the edge', async () => {
    // The bug: the field gave up width to the hand-off buttons as soon as there was
    // something to send, but placement was measured from the field alone — so the two
    // buttons were placed past the edge of the panel and could not be pressed. The
    // whole pill is measured now, and it also refuses to be wider than the panel.
    mounted = await svgBody({ annotation: saved })
    await selectFirstMark(document.body)
    await type(detailBox(), '这是一条足够长的评论，用来把两个发送按钮挤出来')
    const pill = defined(document.querySelector('.da-float-detail'))
    expect(pill.querySelectorAll('.da-comment-send-btn')).toHaveLength(2)
    expect(getComputedStyle(pill).maxWidth).toBe('calc(100% - 16px)')
  })

  it('stands the rail down when nothing is selected and no pen is out', async () => {
    // The feature the rail is for: it must not sit on the figure when there is no
    // decision to make, which is the whole point of a control that costs no room.
    mounted = await svgBody({ annotation: saved }, { mode: 'annotate' })
    expect(document.querySelector('.da-weight')).toBeNull()
  })

  it('remembers the weight across a reload', async () => {
    mounted = await svgBody(undefined, { mode: 'annotate' })
    await click(button(document.body, zh.toolArrow))
    await type(rail(), '2.5')
    // A fresh mount is a fresh reader: the pen it left behind is the pen it starts
    // with, so the reader does not re-set the same weight on every figure.
    mounted?.root.unmount()
    mounted = await svgBody(undefined, { mode: 'annotate' })
    await click(button(document.body, zh.toolArrow))
    expect(rail().value).toBe('2.5')
  })
})

describe('one floating card at a time', () => {
  it('replaces whatever card was open instead of stacking a second one on it', async () => {
    // Both cards hang off the same strip, so two open at once cover each other and
    // the second one's close button: opening one is the reader saying they are done
    // with the other.
    mounted = await svgBody({ annotation: saved }, { mode: 'annotate' })
    await openGoal(document.body)
    await openList(document.body)
    expect(document.querySelector('.da-float-goal')).toBeNull()
    expect(document.querySelector('.da-float-list')).not.toBeNull()
    await openGoal(document.body)
    expect(document.querySelector('.da-float-list')).toBeNull()
    // The style fold counts too: it is the third thing hanging off the same strip.
    await openStyle(document.body)
    expect(document.querySelector('.da-float-goal')).toBeNull()
  })

  it('shuts its card when the same button is pressed again, and when a tool is picked up', async () => {
    mounted = await svgBody({ annotation: saved }, { mode: 'annotate' })
    await openStyle(document.body)
    await click(button(document.body, zh.style))
    expect(document.querySelector('.da-style-row')).toBeNull()
    await openStyle(document.body)
    await click(button(document.body, zh.toolRect))
    expect(document.querySelector('.da-style-row')).toBeNull()
    await openGoal(document.body)
    await click(button(document.body, zh.summary))
    expect(document.querySelector('.da-float-goal')).toBeNull()
    await openList(document.body)
    await click(button(document.body, zh.marks))
    expect(document.querySelector('.da-float-list')).toBeNull()
  })

  it('shuts a popover on a press anywhere outside it', async () => {
    mounted = await svgBody({ annotation: saved }, { mode: 'annotate' })
    await openStyle(document.body)
    // A press that lands on no element at all still counts as somewhere else.
    await act(async () => {
      document.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    })
    expect(document.querySelector('.da-style-row')).toBeNull()
    await openGoal(document.body)
    await act(async () => {
      document.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    })
    expect(document.querySelector('.da-float-goal')).toBeNull()
  })
})

describe('putting a floating card away', () => {
  it('closes the goal card from its own button', async () => {
    mounted = await svgBody({ annotation: saved }, { mode: 'annotate' })
    await openGoal(document.body)
    expect(document.querySelector('.da-float-goal')).not.toBeNull()
    await click(button(document.body, zh.close))
    expect(document.querySelector('.da-float-goal')).toBeNull()
  })

  it('closes the list card from its own button', async () => {
    mounted = await svgBody({ annotation: saved }, { mode: 'annotate' })
    await openList(document.body)
    expect(document.querySelector('.da-float-list')).not.toBeNull()
    // The goal card has its own close button on the same label, so the one to press
    // is the last: the list sits above it in the panel.
    const closes = [...document.querySelectorAll('button')].filter(
      element => element.getAttribute('aria-label') === zh.close,
    )
    await click(defined(closes[closes.length - 1]))
    expect(document.querySelector('.da-float-list')).toBeNull()
  })

  it('puts the detail pill away when the reader clicks anywhere else', async () => {
    mounted = await svgBody({ annotation: saved })
    await selectFirstMark(document.body)
    expect(document.querySelector('.da-float-detail')).not.toBeNull()
    // The pill carries no close button: a comment box that appears beside the mark
    // is dismissed by moving on, the way every other popover is.
    await act(async () => {
      document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
      for (let turn = 0; turn < 8; turn += 1) await Promise.resolve()
    })
    expect(document.querySelector('.da-float-detail')).toBeNull()
    expect(defined(document.querySelector('[data-da-mark]')).getAttribute('data-da-mark')).toBe('m1')
  })
})

describe('saving', () => {
  it('exports, saves, and reports where the marks landed', async () => {
    const { sessions } = stubSessions()
    const result = await svgBody({ annotation: saved }, { sessions })
    mounted = result
    await click(button(document.body, zh.sendToAgent))
    const post = result.calls.find(call => call.init?.method === 'POST')
    expect(post?.url).toBe('/dsh-figmark/annotation')
    const body = postBody(post)
    expect(body['address']).toBe(SVG_ADDRESS)
    expect(typeof body['reviewImage']).toBe('string')
    expect(document.body.textContent).toContain(zh.sent)
    // The panel is empty again, because the marks were delivered.
    // Delivered means done: the sidecars go, so a reload cannot bring the marks back.
    expect(result.calls.some(call => call.init?.method === 'DELETE')).toBe(true)
    // Nothing is left to count, so the list's own badge is gone rather than
    // showing a zero: an empty pill is quieter than a pill saying "0".
    expect(document.querySelector('.da-dock-count')).toBeNull()
  })

  it('fills the annotation into the session that owns the figure', async () => {
    const { sessions, prompts } = stubSessions()
    const result = await svgBody({ annotation: saved }, { sessions })
    mounted = result
    await click(button(document.body, zh.sendToAgent))
    expect(prompts).toHaveLength(1)
    expect(document.body.textContent).toContain(zh.sent)
  })

  it('does nothing at all when there is nothing to save', async () => {
    const result = await svgBody()
    mounted = result
    await click(button(document.body, zh.sendToAgent))
    expect(result.calls.filter(call => call.init?.method === 'POST')).toHaveLength(0)
  })

  it('stops when the figure cannot be measured or exported', async () => {
    stubFetch()
    const raster = await mountBody({
      content: { kind: 'bytes', data: new Uint8Array([1, 2, 3]) },
      resourceAddress: 'dsh-resource://file/session/s1/fig.png',
    })
    mounted = raster
    // Draw first so the guard on an empty document is not what stops the save.
    await click(button(document.body, zh.sendToAgent))
    expect(document.body.textContent).not.toContain(zh.sending)
  })

  it('reports a session service the composition does not provide', async () => {
    mounted = await svgBody({ annotation: saved })
    await click(button(document.body, zh.sendToAgent))
    // Translated, not the guard's English literal: the reader gets a sentence in
    // their own language at the one moment they need to know what went wrong.
    expect(document.body.textContent).toContain('会话服务不可用')
    expect(document.body.textContent).not.toContain('the sessions service is unavailable')
  })

  it('reports an address that names no session to deliver into', async () => {
    const { sessions } = stubSessions()
    mounted = await svgBody({ annotation: saved }, { sessions, resourceAddress: ABSOLUTE_ADDRESS })
    await click(button(document.body, zh.sendToAgent))
    expect(document.body.textContent).toContain('这个图不属于任何会话')
  })

  it('reports a refused write without losing the panel', async () => {
    const { sessions } = stubSessions()
    mounted = await svgBody({ annotation: saved, saveError: 'annotation document version 9 is not 1' }, { sessions })
    await click(button(document.body, zh.sendToAgent))
    expect(document.body.textContent).toContain('annotation document version 9 is not 1')
  })

  it('reports a figure the host would not read as a save failure too', async () => {
    const { sessions } = stubSessions()
    mounted = await svgBody({ readError: 'no such figure' }, { sessions })
    await drawArrow(document.body)
    await click(button(document.body, zh.sendToAgent))
    expect(document.body.textContent).toContain(zh.loadFailed)
  })

  it('uses a caller-supplied translator when the shell binds one', async () => {
    const t = (key: string): string => `T:${key}`
    mounted = await svgBody({ annotation: saved }, { t })
    // The list's own button carries its name as an accessible label now, since the
    // pill is icons only, so that is where the caller's copy has to appear.
    // Tools carry their copy as accessible names now rather than as words under the
    // glyphs, so the caller's translator still has to reach them — via aria-label.
    expect(maybeButton(document.body, 'T:toolArrow')).toBeDefined()
    expect(maybeButton(document.body, 'T:marks')).toBeDefined()
  })

  it('stamps a first save and omits an empty overall note', async () => {
    const { sessions } = stubSessions()
    const result = await svgBody({}, { sessions })
    mounted = result
    await drawArrow(document.body)
    await click(button(document.body, zh.sendToAgent))
    const post = result.calls.find(call => call.init?.method === 'POST')
    const body = postBody(post) as { annotation?: { createdAt?: string; summary?: string } }
    expect(Number.isNaN(Date.parse(body.annotation?.createdAt ?? ''))).toBe(false)
    expect(body.annotation?.summary).toBeUndefined()
  })

  it('writes the annotation into the draft instead of sending it', async () => {
    const composer = stubComposer()
    const result = await svgBody({ annotation: saved }, { conversation: composer.conversation })
    mounted = result
    await click(button(document.body, zh.sendToComposer))
    // Only the write to the sidecar happened; nothing was handed to a session.
    expect(result.calls.filter(call => call.init?.method === 'POST')).toHaveLength(1)
    const drafts = composer.drafts.split(',')
    expect(drafts[0]).toBe('page-1.png:image/png')
    expect(composer.attached).toEqual([['d0']])
    expect(document.body.textContent).toContain(zh.composed)
  })

  it('stages one picture and names the figure in the draft message', async () => {
    const composer = stubComposer()
    const seen: string[] = []
    const conversation = {
      ...composer.conversation,
      input: {
        shell: (id: string) => {
          const inner = composer.conversation.input.shell(id)
          return { ...inner, setDraft: (text: string) => { seen.push(text); inner.setDraft(text) } }
        },
      },
    } as ComposerLike
    mounted = await svgBody({ annotation: saved }, { conversation })
    await click(button(document.body, zh.sendToComposer))
    const text = defined(seen[0])
    expect(text).toContain('【附图标注】')
    // The message must stand on its own: the sidecars are deleted once the note is
    // staged, so a path in the text would be a dead reference by the time it is read.
    expect(text).not.toContain('.annot.json')
    expect(text).toContain('标注图已作为本条消息的附件发送')
    // The reader's own half-sentence survives, with the annotation appended.
    expect(text.startsWith('sketch first')).toBe(true)
  })

  it('reports a conversation service the composition does not provide', async () => {
    const result = await svgBody({ annotation: saved })
    mounted = result
    await click(button(document.body, zh.sendToComposer))
    expect(document.body.textContent).toContain('会话面板不可用')
    // A refusal writes nothing: the sidecar still holds every mark the panel shows,
    // because the question is asked before the save rather than after it.
    expect(result.calls.filter(call => call.init?.method === 'POST')).toHaveLength(0)
  })

  it('gives the staged pictures back when the composer refuses them', async () => {
    const composer = stubComposer('refuses')
    mounted = await svgBody({ annotation: saved }, { conversation: composer.conversation })
    await click(button(document.body, zh.sendToComposer))
    expect(composer.released).toEqual([['d0']])
    expect(document.body.textContent).toContain(zh.saveError)
  })

  it('delivers in English when the panel runs in an English locale', async () => {
    const { sessions, prompts } = stubSessions()
    mounted = await svgBody({ annotation: saved }, { sessions, localeId: 'en-GB' })
    await click(button(document.body, en.sendToAgent))
    const parts = (prompts[0] ?? []) as { type: string; text?: string }[]
    expect(parts[1]?.text).toContain('[figure annotations]')
  })

  it('reports a save failure that is not an Error as its own text', async () => {
    const { sessions } = stubSessions()
    mounted = await svgBody({ annotation: saved, saveThrows: 'the socket died' }, { sessions })
    await click(button(document.body, zh.sendToAgent))
    expect(document.body.textContent).toContain(`${zh.saveError}the socket died`)
  })
})

describe('a page a renderer supplies', () => {
  const PAGE_ADDRESS = 'dsh-resource://file/session/s1/report.pdf'
  const PAGE_IMAGE = 'data:image/png;base64,cGFnZTI='

  /** One page of a document, as the renderer that owns it supplies it. */
  function pageSurface(): PageSurface {
    return { dataUrl: PAGE_IMAGE, width: 595, height: 842 }
  }

  it('annotates the supplied raster rather than the file bytes', async () => {
    const calls = stubFetch()
    mounted = await mountBody({ page: pageSurface(), resourceAddress: PAGE_ADDRESS })
    const image = defined(document.body.querySelector('img.da-figure'))
    expect(image.getAttribute('src')).toBe(PAGE_IMAGE)
    // The page's own units are the coordinate space, not the bitmap's pixels.
    expect(image.getAttribute('width')).toBe('595')
    expect(document.body.textContent).not.toContain(zh.loading)
    // A page body neither reads nor writes the sidecar: its owner does, once, for
    // the whole document — so it touches the host not at all.
    expect(calls).toEqual([])
  })

  it('draws on a page without being told to enter a mode', async () => {
    stubFetch()
    mounted = await mountBody({ page: pageSurface(), resourceAddress: PAGE_ADDRESS })
    // The tools are there and one of them is armed: a page body has no mode switch
    // because there is no other mode for it to be in.
    expect(maybeButton(document.body, zh.toolSelect)).toBeDefined()
    expect(maybeButton(document.body, zh.toolArrow)?.getAttribute('aria-pressed')).toBe('false')
  })

  it('leaves the document actions to the owner, which keeps every page', async () => {
    stubFetch()
    mounted = await mountBody({ page: pageSurface(), resourceAddress: PAGE_ADDRESS })
    expect(maybeButton(document.body, zh.sendToAgent)).toBeUndefined()
    expect(maybeButton(document.body, zh.sendToComposer)).toBeUndefined()
    expect(maybeButton(document.body, zh.previousPage)).toBeUndefined()
    // Drawing stays: the surface and its tools are what a page body is for.
    expect(maybeButton(document.body, zh.toolArrow)).toBeDefined()
  })

  it('takes its figure description from the owner and reports every change', async () => {
    const changed: string[] = []
    stubFetch()
    mounted = await mountBody({
      page: pageSurface(),
      resourceAddress: PAGE_ADDRESS,
      summary: '整份文档的说明',
      onSummaryChange: (text) => { changed.push(text) },
    })
    const figure = await openGoal(document.body)
    expect(figure.value).toBe('整份文档的说明')
    await type(figure, '改成这样')
    expect(changed).toEqual(['改成这样'])
  })

  it('seeds marks from the draft and reports every edit back', async () => {
    const drafts: SurfaceDraft[] = []
    stubFetch()
    mounted = await mountBody({
      page: pageSurface(),
      resourceAddress: PAGE_ADDRESS,
      draft: { marks: [{ id: 'd1', kind: 'rect', color: '#2f9e44', points: [[10, 10], [40, 40]] }] },
      onDraftChange: (draft) => { drafts.push(draft) },
    })
    await drawArrow(document.body)
    const last = defined(drafts[drafts.length - 1])
    expect(last.marks.map(mark => mark.id === 'd1' ? 'draft' : 'drawn')).toEqual(['draft', 'drawn'])
  })

  it('keeps its own description when no owner supplies one', async () => {
    stubFetch()
    mounted = await mountBody({ page: pageSurface(), resourceAddress: PAGE_ADDRESS })
    const figure = await openGoal(document.body)
    await type(figure, '自己写一句')
    expect(figure.value).toBe('自己写一句')
  })
})

describe('a rendered document', () => {
  const HTML_ADDRESS = 'dsh-resource://file/session/s1/report.html'
  const HTML_PATH = '/w/report.html'
  const HTML = '<!doctype html><html><head><title>报告</title></head>'
    + '<body><section id="s"><p id="lead">第一段</p><p>第二段</p></section></body></html>'

  /** The document's own bytes. */
  function htmlBytes(): Uint8Array {
    return new TextEncoder().encode(HTML)
  }

  /** What the host answers a read of this document with. */
  function htmlPayload(answers: HostAnswers = {}): unknown {
    return {
      ok: true,
      figure: { path: HTML_PATH, mediaType: 'text/html', sha256: answers.sha256 ?? 'b'.repeat(64) },
      annotation: answers.annotation ?? null,
    }
  }

  /** A marks file for this document. */
  const savedHtml: AnnotationDocument = {
    version: ANNOTATION_VERSION,
    figure: {
      address: HTML_ADDRESS,
      path: HTML_PATH,
      mediaType: 'text/html',
      width: 1024,
      height: 1843,
      sha256: 'b'.repeat(64),
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    marks: [{ id: 'm1', kind: 'rect', color: '#e03131', points: [[10, 10], [80, 40]], detail: '这段要改' }],
    summary: '改第二段',
  }

  /** Resize callbacks the frame body registered, so a spec can fire a layout pass. */
  const resizeCallbacks: (() => void)[] = []

  /** Mount a body over the rendered document. */
  async function htmlBody(answers: HostAnswers = {}, props: Partial<AnnotatorBodyProps> = {}): Promise<{
    readonly host: HTMLElement
    readonly root: Root
    readonly calls: Call[]
  }> {
    const calls: Call[] = []
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, init })
      const respond = (body: unknown, status = 200): { readonly json: () => Promise<unknown>; readonly status: number } =>
        ({ json: async () => body, status })
      if (init?.method === 'DELETE') {
        if (answers.deleteError !== undefined) return respond({ ok: false, error: answers.deleteError }, 500)
        return respond({ ok: true, removed: true })
      }
      if (init?.method === 'POST') {
        if (answers.saveError !== undefined) return respond({ ok: false, error: answers.saveError }, 400)
        return respond({ ok: true, annotationPath: `${HTML_PATH}.annot.json`, reviewPath: null })
      }
      if (answers.readError !== undefined) return respond({ ok: false, error: answers.readError }, 404)
      return respond(htmlPayload(answers))
    }))
    const result = await mountBody({
      content: { kind: 'bytes', data: htmlBytes() },
      resourceAddress: HTML_ADDRESS,
      ...props,
    })
    return { ...result, calls }
  }

  /** The frame the body rendered the document into. */
  function frame(): HTMLIFrameElement {
    return defined(document.querySelector('iframe.da-html')) as HTMLIFrameElement
  }

  /** Report one content height for the frame, the way a layout pass would. */
  async function reportHeight(height: number): Promise<void> {
    const frameDocument = frame().contentDocument
    if (frameDocument === null) throw new Error('the frame has no document')
    Object.defineProperty(frameDocument.documentElement, 'scrollHeight', { configurable: true, get: () => height })
    await act(async () => {
      for (const callback of resizeCallbacks) callback()
    })
  }

  /** Draw one arrow on the document, in the frame's own pixels. */
  async function drawOnDocument(host: HTMLElement): Promise<void> {
    await click(button(host, zh.toolArrow))
    const overlay = defined(host.querySelector('svg.da-overlay')) as SVGSVGElement
    stubRect(overlay, { left: 0, top: 0, width: 1024, height: 1843 })
    for (const [type, x, y] of [['pointerdown', 10, 10], ['pointermove', 120, 80], ['pointerup', 120, 80]] as const) {
      await act(async () => {
        overlay.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX: x, clientY: y }))
      })
    }
  }

  beforeEach(() => {
    resizeCallbacks.length = 0
    vi.stubGlobal('ResizeObserver', class {
      /** @param callback - the observer's callback, kept so a spec can fire it. */
      constructor(callback: () => void) { resizeCallbacks.push(callback) }
      /** @param _target - the observed element; this double never fires on its own. */
      observe(_target: Element): void {}
      /** Stop observing. */
      disconnect(): void {}
    })
  })

  it('renders the document into a frame that cannot run and cannot reach out', async () => {
    mounted = await htmlBody()
    const element = frame()
    expect(element.getAttribute('sandbox')).toBe('allow-same-origin')
    const frameDocument = defined(element.contentDocument)
    expect(frameDocument.querySelector('#lead')?.textContent).toBe('第一段')
    expect(frameDocument.querySelector('meta[http-equiv="Content-Security-Policy"]')).not.toBeNull()
    // The frame is the surface: one fixed width, and whatever height it reports.
    expect(element.style.width).toBe('1024px')
    // Nothing has laid out yet, so there is no surface to describe.
    expect(element.style.height).toBe('0px')
    await reportHeight(1843)
    expect(element.style.height).toBe('1843px')
    expect(element.getAttribute('title')).toBe(zh.htmlFrame)
  })

  it('waits for bytes with the document wording rather than the figure wording', async () => {
    stubFetch()
    mounted = await mountBody({ content: { kind: 'text' }, resourceAddress: HTML_ADDRESS })
    expect(document.body.textContent).toContain(zh.htmlLoading)
    expect(document.body.textContent).not.toContain(zh.loading)
  })

  it('warns that the document moved on, in the wording a document takes', async () => {
    mounted = await htmlBody({ annotation: savedHtml, sha256: 'c'.repeat(64) })
    expect(document.body.textContent).toContain(zh.htmlStale)
    expect(document.body.textContent).not.toContain(zh.stale)
  })

  it('records what a mark on the document points at, and saves the marks file alone', async () => {
    const { sessions } = stubSessions()
    const result = await htmlBody({}, { sessions })
    mounted = result
    await reportHeight(1843)
    const frameDocument = defined(frame().contentDocument)
    stubRect(defined(frameDocument.querySelector('#s')), { left: 0, top: 0, width: 1024, height: 800 })
    stubRect(defined(frameDocument.querySelector('#lead')), { left: 0, top: 0, width: 1024, height: 200 })
    await drawOnDocument(document.body)
    await openList(document.body)
    expect(document.querySelector('.da-mark-meta')?.textContent).toContain('第一段')
    await click(button(document.body, zh.sendToAgent))
    const post = result.calls.find(call => call.init?.method === 'POST')
    const body = postBody(post) as {
      reviewImage?: string
      annotatedPdf?: string
      annotation?: { figure: { mediaType: string; width: number; height: number }; marks: { anchor?: MarkAnchor }[] }
    }
    // A rendered document cannot be flattened into a picture, so the marks file is
    // the whole artifact and the locator inside it is what a source reader uses.
    expect(body.reviewImage).toBeUndefined()
    expect(body.annotatedPdf).toBeUndefined()
    expect(body.annotation?.figure).toMatchObject({ mediaType: 'text/html', width: 1024, height: 1843 })
    expect(body.annotation?.marks[0]?.anchor).toEqual({
      tag: 'p',
      id: 'lead',
      text: '第一段',
      // An element that names itself is named by its own id, which is the one
      // locator a reader of the source can resolve without counting siblings.
      selector: '#lead',
      bbox: [0, 0, 1024, 200],
    })
    expect(document.body.textContent).toContain(zh.sent)
  })

  it('sends the marks with no picture attached and the document wording in the message', async () => {
    const { sessions, prompts } = stubSessions()
    mounted = await htmlBody({ annotation: savedHtml }, { sessions })
    await reportHeight(1843)
    await click(button(document.body, zh.sendToAgent))
    expect(prompts).toHaveLength(1)
    const parts = defined(prompts[0]) as { readonly type: string; readonly text?: string }[]
    // The marks travel as the message's text; nothing is attached as an image.
    expect(parts).toHaveLength(1)
    expect(parts[0]?.type).toBe('text')
    expect(parts[0]?.text).toContain('【HTML 标注】')
    expect(parts[0]?.text).toContain('渲染面 1024×1843')
    // The hash named a file state no reader of the message can act on; it was in
    // every header and is gone.
    expect(parts[0]?.text).not.toContain('sha256')
    expect(parts[0]?.text).not.toContain('sha256')
    expect(parts[0]?.text).toContain('逐条改 HTML 生成源')
  })

  it('refuses to save a surface the frame never gave a height to', async () => {
    const result = await htmlBody()
    mounted = result
    expect(frame().style.height).toBe('0px')
    await drawArrow(document.body)
    await click(button(document.body, zh.sendToAgent))
    expect(result.calls.filter(call => call.init?.method === 'POST')).toHaveLength(0)
  })

  it('keeps the last height when the frame reports none later', async () => {
    mounted = await htmlBody()
    await reportHeight(1843)
    expect(frame().style.height).toBe('1843px')
    // A frame that has laid out nothing reports no height; the surface must not
    // collapse under a reader who is drawing on it.
    await reportHeight(0)
    expect(frame().style.height).toBe('1843px')
  })

  it('lights an element mark inside the frame, with a rule the document can see', async () => {
    // A rendered document is its own document: the panel's stylesheet cannot reach into
    // it, so the rule has to be written there. The mark's light is the only sign the
    // mark exists, since an element mark draws nothing on the overlay.
    const elementMarked: AnnotationDocument = {
      ...savedHtml,
      marks: [{
        id: 'e1', kind: 'element', color: '#1971c2', points: [[0, 0], [1024, 200]],
        detail: '这段要改', anchor: { tag: 'p', id: 'lead', selector: '#lead', text: '第一段', bbox: [0, 0, 1024, 200] },
      }],
    }
    const result = await htmlBody({ annotation: elementMarked })
    mounted = result
    await reportHeight(1843)
    const frameDocument = defined(frame().contentDocument)
    expect(defined(frameDocument.querySelector('#lead')).classList.contains('da-spot')).toBe(true)
    // One rule, written once, in the document the elements are in.
    const rules = [...frameDocument.querySelectorAll('style[data-da-spot]')]
    expect(rules).toHaveLength(1)
    expect(rules[0]?.textContent).toContain('drop-shadow')
  })

  it('renders the frame without a document rather than failing', async () => {
    const original = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'contentDocument')
    Object.defineProperty(HTMLIFrameElement.prototype, 'contentDocument', { configurable: true, value: null })
    try {
      const result = await htmlBody()
      mounted = result
      expect(frame()).not.toBeNull()
      expect(document.body.textContent).not.toContain(zh.loading)
        await drawArrow(document.body)
      await openList(document.body)
      expect(document.body.textContent).toContain(zh.emptyDetail)
    } finally {
      if (original !== undefined) Object.defineProperty(HTMLIFrameElement.prototype, 'contentDocument', original)
    }
  })
})

describe('autosave', () => {
  /** Run one debounce window so a scheduled write fires. */
  async function settle(): Promise<void> {
    await act(async () => { await new Promise(resolve => setTimeout(resolve, AUTOSAVE_DELAY_MS + 20)) })
  }

  it('writes a draft to disk while the reader is still working', async () => {
    const result = await svgBody()
    mounted = result
    await drawArrow(document.body)
    await settle()
    const post = result.calls.find(call => call.init?.method === 'POST' && postBody(call)['reviewImage'] === undefined)
    expect(post).toBeDefined()
    const body = postBody(defined(post))
    expect(body['address']).toBe(SVG_ADDRESS)
    const document_ = body['annotation'] as AnnotationDocument
    expect(document_.marks).toHaveLength(1)
    // A draft is the marks alone: the picture is a delivery artifact, and drawing
    // one on every keystroke would cost more than the draft is worth.
    expect(body['reviewImage']).toBeUndefined()
  })

  it('takes the save failure back once a later write goes through', async () => {
    // One failed write — a full disk, a host hiccup — used to leave the red line on
    // screen while every write after it succeeded silently, and the reader either
    // redid work that was already saved or gave up on one that was saving fine.
    // The stub reads its answers on every call, so clearing the field is the same
    // thing the host does when the disk frees up.
    const answers: { saveError?: string } = { saveError: '磁盘满了' }
    const result = await svgBody(answers)
    mounted = result
    await drawArrow(result.host)
    await settle()
    expect(result.host.textContent).toContain('磁盘满了')
    delete answers.saveError
    await drawArrow(result.host)
    await settle()
    expect(result.host.textContent).not.toContain('磁盘满了')
    expect(result.calls.filter(call => call.init?.method === 'POST').length).toBeGreaterThan(1)
  })

  it('leaves a line about a handoff alone when a write goes through', async () => {
    // Only a failure is taken back: a line saying an annotation reached the agent is
    // news of its own, and a background save clearing it would take the answer away.
    const { sessions } = stubSessions()
    const result = await svgBody({}, { sessions })
    mounted = result
    await drawArrow(result.host)
    await click(button(result.host, zh.sendToAgent))
    expect(document.body.textContent).toContain('已发送给智能体')
    await act(async () => { await new Promise(resolve => setTimeout(resolve, AUTOSAVE_DELAY_MS + 20)) })
    expect(document.body.textContent).toContain('已发送给智能体')
  })

  it('does not write a loaded annotation straight back', async () => {
    const result = await svgBody({ annotation: saved })
    mounted = result
    await settle()
    expect(result.calls.filter(call => call.init?.method === 'POST')).toHaveLength(0)
  })

  it('writes once for a burst of edits rather than once per keystroke', async () => {
    const result = await svgBody({ annotation: saved })
    mounted = result
    await settle()
    // The detail box belongs to the selected mark, so one has to be picked first.
    await selectFirstMark(document.body)
    await type(detailBox(), '这里要改')
    await settle()
    expect(result.calls.filter(call => call.init?.method === 'POST')).toHaveLength(1)
  })

  it('says there is nothing to send, rather than dropping the press in silence', async () => {
    // The guard used to return without a word, before any status line: a reader who
    // had written the figure-level note but drawn no mark pressed send and watched
    // nothing happen. The buttons stay lit on purpose, so the refusal has to be said.
    mounted = await svgBody()
    await click(button(document.body, zh.sendToAgent))
    expect(document.querySelector('.da-status')?.textContent).toContain(zh.sendNothingToSend)
  })

  it('says the figure has not loaded, rather than that there is nothing marked', async () => {
    // The two refusals ask for different things, so they are told apart: one wants a
    // mark, the other wants a moment.
    mounted = await svgBody()
    await drawArrow(document.body)
    await act(async () => { document.body.querySelector('.da-overlay')?.remove() })
    await click(button(document.body, zh.sendToAgent))
    expect(document.querySelector('.da-status')?.textContent).not.toContain(zh.sendNothingToSend)
  })

  it('flushes a pending draft when the tab goes away', async () => {
    const result = await svgBody()
    mounted = result
    await drawArrow(document.body)
    // No settle: the debounce is still waiting when the page is hidden.
    await act(async () => { window.dispatchEvent(new Event('pagehide')) })
    const post = result.calls.find(call => call.init?.method === 'POST')
    expect(post).toBeDefined()
    // `keepalive` is what lets the request outlive the page that sent it.
    expect(post?.init?.keepalive).toBe(true)
  })

  it('keeps the flush alive only for a body that is small in bytes, not in length', async () => {
    // The browser's keepalive budget is counted in UTF-8 bytes and shared with the
    // method, URL and headers; `String.prototype.length` counts UTF-16 units. A note
    // written in Chinese is three bytes a character, so a body the length guard called
    // 30 000 was 90 000 bytes — passed by the guard, refused by the browser, and the
    // reader's last edit was lost on close with nothing on screen to say so.
    const result = await svgBody()
    mounted = result
    await drawArrow(document.body)
    await selectFirstMark(document.body)
    // Long enough in bytes to be over the limit, short enough in code units that the
    // old guard would have let it through.
    await type(detailBox(), '图'.repeat(25_000))
    await act(async () => { window.dispatchEvent(new Event('pagehide')) })
    const post = result.calls.find(call => call.init?.method === 'POST')
    expect(post).toBeDefined()
    expect(post?.init?.keepalive).toBeUndefined()
  })

  it('flushes a pending draft when the surface is unmounted', async () => {
    const result = await svgBody()
    await drawArrow(document.body)
    await act(async () => { result.root.unmount() })
    mounted = undefined
    expect(result.calls.some(call => call.init?.method === 'POST')).toBe(true)
  })

  it('reports a draft the host refused, and keeps the marks on the panel', async () => {
    const result = await svgBody({ saveError: 'the draft was refused' })
    mounted = result
    await drawArrow(document.body)
    await settle()
    expect(document.body.textContent).toContain('the draft was refused')
    expect(defined(document.querySelector('.da-dock-count')).textContent).toBe('1')
  })

  it('selects a mark from its row in the list, not only from its words', async () => {
    // The row is the target, not just the sentence inside it: a reader aiming at
    // a short entry — or at the glyph beside it — means the same one.
    const result = await svgBody({ annotation: saved })
    mounted = result
    await openList(result.host)
    expect(defined(result.host.querySelector('.da-mark')).getAttribute('data-selected')).toBe('false')
    await click(defined(result.host.querySelector('.da-mark-glyph')))
    expect(defined(result.host.querySelector('.da-mark')).getAttribute('data-selected')).toBe('true')
    expect(defined(result.host.querySelector('.da-comment'))).not.toBeNull()
  })

  it('folds the style row away again when the reader presses its button twice', async () => {
    // One button opens it and the same button closes it, so there is no popup to
    // hunt a way out of and nothing covering the figure in between.
    const result = await svgBody({}, { mode: 'annotate' })
    mounted = result
    await openStyle(result.host)
    expect(result.host.querySelector('.da-style-row')).not.toBeNull()
    await click(button(result.host, zh.style))
    expect(result.host.querySelector('.da-style-row')).toBeNull()
  })

  it('folds the style row away when the reader picks another tool', async () => {
    // The row costs the figure a band of height, so arming a tool is the moment it
    // goes: the reader has moved on to drawing.
    const result = await svgBody({}, { mode: 'annotate' })
    mounted = result
    await openStyle(result.host)
    expect(result.host.querySelector('.da-style-row')).not.toBeNull()
    await click(button(result.host, zh.toolRect))
    expect(result.host.querySelector('.da-style-row')).toBeNull()
  })

  it('reports a draft write that failed with something that is not an Error', async () => {
    const result = await svgBody({ saveThrows: 'the network went away' })
    mounted = result
    await drawArrow(document.body)
    await settle()
    expect(document.body.textContent).toContain('the network went away')
  })

  it('keeps a draft after a reload, so the marks are still there', async () => {
    // The first load writes the draft; the second load reads it back. This is the
    // whole promise: editing survives a refresh, and only a delivery removes it.
    const first = await svgBody()
    await drawArrow(document.body)
    await settle()
    const written = postBody(defined(first.calls.find(call => call.init?.method === 'POST')))
    await act(async () => { first.root.unmount() })
    document.body.innerHTML = ''
    const draft = written['annotation'] as AnnotationDocument
    const second = await svgBody({ annotation: draft })
    mounted = second
    expect(defined(document.querySelector('.da-dock-count')).textContent).toBe('1')
  })

  it('keeps the size and visibility of the numbers in the draft it writes', async () => {
    const result = await svgBody()
    mounted = result
    await drawArrow(document.body)
    await openStyle(result.host)
  })

  it('deletes the sidecar when the last mark is removed, rather than leaving it behind', async () => {
    // The failure this covers: an empty surface used to write nothing at all, so the
    // sidecar still named the deleted mark and the next open read it straight back.
    // No figure note, so the last mark is the whole annotation: removing it leaves
    // nothing at all to keep.
    const marksOnly: AnnotationDocument = { ...saved }
    delete (marksOnly as { summary?: string }).summary
    const result = await svgBody({ annotation: marksOnly })
    mounted = result
    const before = result.calls.length
    await openList(result.host)
    await click(defined(result.host.querySelector('.da-mark-del')))
    await settle()
    const after = result.calls.slice(before)
    expect(after.some(call => call.init?.method === 'DELETE')).toBe(true)
    // And the empty surface is not also written: a write after the delete would put
    // the sidecar back.
    expect(after.filter(call => call.init?.method === 'POST')).toHaveLength(0)
  })

  it('clears the draft from disk when the reader clears the panel', async () => {
    const result = await svgBody({ annotation: saved })
    mounted = result
    await openList(document.body)
    await click(button(document.body, zh.clear))
    expect(result.calls.some(call => call.init?.method === 'DELETE')).toBe(true)
    // Nothing is written back: the delete is the last word on that file.
    await settle()
    expect(result.calls.filter(call => call.init?.method === 'POST')).toHaveLength(0)
  })
})

describe('the tool a surface opens on', () => {
  it('opens on select, so a stray drag does not become a mark', async () => {
    const result = await svgBody({}, { mode: 'annotate' })
    mounted = result
    const select = button(result.host, zh.toolSelect)
    expect(select.getAttribute('aria-pressed')).toBe('true')
    // A drag across the surface on the opening tool leaves nothing behind.
    const overlay = defined(result.host.querySelector('svg.da-overlay')) as SVGSVGElement
    stubRect(overlay, { left: 0, top: 0, width: 200, height: 100 })
    for (const [type, x, y] of [['pointerdown', 20, 20], ['pointermove', 120, 80], ['pointerup', 120, 80]] as const) {
      await act(async () => {
        overlay.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX: x, clientY: y }))
      })
    }
    expect(result.host.querySelectorAll('[data-da-mark]')).toHaveLength(0)
  })

  it('presses the select tool after a mark is drawn', async () => {
    const result = await svgBody({}, { mode: 'annotate' })
    mounted = result
    await drawArrow(result.host)
    expect(button(result.host, zh.toolSelect).getAttribute('aria-pressed')).toBe('true')
    expect(button(result.host, zh.toolArrow).getAttribute('aria-pressed')).toBe('false')
  })

  it('shows every tool as a glyph in the floating palette, without words', async () => {
    const result = await svgBody({}, { mode: 'annotate' })
    mounted = result
    // The tools live in the dark pill that floats over the figure, not in the bar.
    const palette = defined(document.querySelector('.da-palette'))
    for (const label of [zh.toolSelect, zh.toolArrow, zh.toolRect, zh.toolEllipse, zh.toolPen, zh.toolPoint]) {
      const tile = button(palette as HTMLElement, label)
      // A glyph and nothing else: the name is the tooltip and the accessible name,
      // which is what a row of round buttons can afford.
      expect(tile.querySelector('svg')).not.toBeNull()
      expect(tile.textContent).toBe('')
      expect(tile.getAttribute('aria-label')).toBe(label)
      expect(tile.getAttribute('title')).toBe(label)
    }
  })
})

describe('the drawing choices that outlive the figure', () => {
  /** The swatch button for one colour. */
  async function swatch(host: HTMLElement, color: string): Promise<HTMLButtonElement> {
    await openStyle(host)
    const found = [...host.querySelectorAll('button.da-swatch')].find(element => element.getAttribute('aria-label') === color)
    if (found === undefined) throw new Error(`no swatch for ${color}`)
    return found as HTMLButtonElement
  }

  it('opens on the colour the reader drew with last time', async () => {
    const first = await svgBody({}, { mode: 'annotate' })
    mounted = first
    await click(await swatch(first.host, '#f08c00'))
    expect((await swatch(first.host, '#f08c00')).getAttribute('aria-pressed')).toBe('true')
    first.root.unmount()

    // A fresh body, the way a reload mounts one: nothing is handed over in props.
    const second = await svgBody({}, { mode: 'annotate' })
    mounted = second
    expect((await swatch(second.host, '#f08c00')).getAttribute('aria-pressed')).toBe('true')
    expect((await swatch(second.host, '#e03131')).getAttribute('aria-pressed')).toBe('false')
  })
})

describe('the ceiling on the overall note', () => {
  /** Open the summary record and return its textarea. */
  async function openSummary(): Promise<HTMLTextAreaElement> {
    await click(button(document.body, zh.summary))
    return defined(document.querySelector('.da-float-goal textarea')) as HTMLTextAreaElement
  }

  it('stops the reader at the cap rather than counting past a limit it ignores', async () => {
    // The count advertised `/300` while nothing enforced it: a pasted paragraph grew
    // past the ceiling into a sidecar the Host refuses, and the reader lost the save.
    mounted = await svgBody()
    const field = await openSummary()
    expect(field.maxLength).toBe(MAX_SUMMARY_CHARS)
  })

  it('shows the count only as the note approaches the cap', async () => {
    // A fraction printed beside every note is noise; one that appears when the room
    // runs out is a warning. Both halves have to agree, so the count is hidden while
    // there is a comfortable margin and shown once there is not.
    // `COUNT_WARNING_ROOM` is 200: at 3800 there is still a margin, one more character
    // is inside the last two hundred and the count appears.
    const margin = MAX_SUMMARY_CHARS - 200
    mounted = await svgBody({ annotation: { ...saved, summary: 'x'.repeat(margin) } })
    await click(button(document.body, zh.summary))
    expect(document.querySelector('.da-count')).toBeNull()
    const field = defined(document.querySelector('.da-float-goal textarea')) as HTMLTextAreaElement
    await type(field, 'x'.repeat(margin + 1))
    expect(document.querySelector('.da-count')?.textContent).toBe(`${margin + 1}/${MAX_SUMMARY_CHARS}`)
  })
})

describe('the style fold against the top of the panel', () => {
  it('opens up from a bar at the bottom', async () => {
    mounted = await svgBody({}, { mode: 'annotate' })
    const bar = defined(document.querySelector('.da-bar')) as HTMLElement
    const root = defined(document.querySelector('.da-root')) as HTMLElement
    stubRect(root, { left: 0, top: 0, width: 400, height: 600 })
    stubRect(bar, { left: 100, top: 560, width: 200, height: 28 })
    // The placement is measured when the bar moves or a record opens, so nudge a
    // record twice to run the measurement against the boxes set above.
    await click(button(document.body, zh.summary))
    await click(button(document.body, zh.summary))
    await openStyle(document.body)
    const fold = defined(document.querySelector('.da-style-row')) as HTMLElement
    // Climbing is right here: the bar is at the bottom, so above it is the figure.
    expect(fold.getAttribute('data-side')).toBe('above')
  })

  it('turns over and hangs below a bar parked along the top', async () => {
    mounted = await svgBody({}, { mode: 'annotate' })
    const bar = defined(document.querySelector('.da-bar')) as HTMLElement
    const root = defined(document.querySelector('.da-root')) as HTMLElement
    stubRect(root, { left: 0, top: 0, width: 400, height: 600 })
    // Parked at the top: there is nothing above the bar to open into, so a fold that
    // climbs would be laid out above the panel, out of sight.
    stubRect(bar, { left: 100, top: 6, width: 200, height: 28 })
    await click(button(document.body, zh.summary))
    await click(button(document.body, zh.summary))
    await openStyle(document.body)
    const fold = defined(document.querySelector('.da-style-row')) as HTMLElement
    expect(fold.getAttribute('data-side')).toBe('below')
    expect(STYLES).toContain('.da-style-row[data-side="below"]{bottom:auto;top:calc(100% + 6px)')
  })
})

describe('a page body without its chrome', () => {
  // A continuous column mounts every page at once, and only the page being read
  // should carry the tools: a column where each page had its own floating bar would
  // be a wall of chrome with one page's worth of figure under it.
  it('draws no tools and no bar when the owner says not to', async () => {
    await svgBody({}, { chrome: false })
    expect(document.querySelector('.da-palette')).toBeNull()
    expect(document.querySelector('.da-bar')).toBeNull()
  })

  it('draws the tools and the bar by default', async () => {
    await svgBody({})
    expect(document.querySelector('.da-palette')).not.toBeNull()
    expect(document.querySelector('.da-bar')).not.toBeNull()
  })
})

describe('a body whose owner places its bar', () => {
  // A paged document draws many page bodies and one pane; the bar belongs to the
  // pane, so the body hands its chrome over rather than drawing it inside a page.
  it('portals its chrome into the node the owner hands it', async () => {
    const dock = document.createElement('div')
    dock.className = 'owner-dock'
    document.body.append(dock)
    await svgBody({}, { chromeHost: dock })
    expect(document.querySelector('.da-root .da-bar')).toBeNull()
    expect(dock.querySelector('.da-bar')).not.toBeNull()
    expect(dock.querySelector('.da-palette')).not.toBeNull()
  })

  it('places the paging its owner drew, before the pen', async () => {
    await svgBody({}, {
      pagingSlot: <span data-testid="owner-paging">1 / 9</span>,
    })
    const bar = defined(document.querySelector('.da-bar')) as HTMLElement
    const paging = defined(bar.querySelector('[data-testid="owner-paging"]'))
    const style = defined(bar.querySelector('.da-style'))
    expect(bar.textContent).toContain('1 / 9')
    // Paging is what the reader decides first; the colour belongs to the stroke after.
    expect(paging.compareDocumentPosition(style) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('sends through the owner’s callback when it has one', async () => {
    const targets: string[] = []
    await svgBody({}, { onSend: target => { targets.push(target) } })
    await click(button(document.body, zh.sendToAgent))
    await click(button(document.body, zh.sendToComposer))
    expect(targets).toEqual(['agent', 'composer'])
  })
})

describe('a body that lets its owner keep the magnification', () => {
  // A file's pages are one picture in several sheets: a pinch on page 3 has to be a
  // pinch on the document, or the reader lands on page 4 at a different size.
  it('reports the factor to the owner instead of keeping it', async () => {
    const asked: (number | 'fit')[] = []
    await svgBody({}, { onZoom: (next) => { asked.push(next) } }, { stageWidth: 500 })
    const stage = defined(document.querySelector('.da-stage')) as HTMLElement
    stubRect(stage, { left: 0, top: 0, width: 500, height: 400 })
    await pinch(stage, { deltaY: -40, clientX: 100, clientY: 100 })
    // The factor is only handed over once the gesture pauses: a pinch reports one
    // settled size, not one per wheel event.
    await act(async () => {
      await new Promise<void>((resolve) => { setTimeout(resolve, PINCH_SETTLE_DELAY_MS + 40) })
    })
    expect(asked).toHaveLength(1)
  })

  it('draws at the factor the owner handed it', async () => {
    await svgBody({}, { zoom: 2 }, { stageWidth: 500 })
    const surface = defined(document.querySelector('.da-surface')) as HTMLElement
    // A stated factor replaces the fit, it does not multiply it: 200px at 2×.
    expect(surface.style.width).toBe('400px')
  })
})

describe('a body that lists the whole document', () => {
  // The list is the map of what is about to be sent, and what is sent from a paged
  // document is every page's marks at once: a list of only this sheet would read as
  // "one mark" on a file carrying seven.
  it('lists every mark the owner hands it, and only offers a delete it can undo', async () => {
    // Undo lives in the page body and covers the page it shows. The same ✕ on a row
    // from another page dropped that mark for good — one gesture, opposite
    // consequences, and nothing on the row to say which. So the row this body cannot
    // walk back carries no ✕; pressing the row turns to its page instead.
    const revealed: string[] = []
    await svgBody({}, {
      // The page this body shows holds `own`; the document holds one more.
      draft: { marks: [{ id: 'own', kind: 'arrow', color: '#1971c2', points: [] }] },
      documentMarks: [
        { id: 'own', kind: 'arrow', color: '#1971c2', points: [] },
        { id: 'other-page', kind: 'rect', color: '#e03131', points: [], page: 3 },
      ],
      onRevealMark: (mark) => { revealed.push(mark.id) },
    })
    await openList(document.body)
    const rows = [...document.querySelectorAll('.da-mark')]
    expect(rows).toHaveLength(2)
    const foreign = defined(rows[1] as HTMLElement)
    expect(foreign.querySelector('.da-mark-del')).toBeNull()
    // The way to it is still there: press the row and the owner turns to its page.
    await click(defined(foreign.querySelector('.da-mark-text') as HTMLElement | null))
    expect(revealed).toEqual(['other-page'])
    // The page's own row keeps the ✕, and it is undoable here: the row goes, and the
    // page body's history can bring it back — which is the whole difference between
    // it and the foreign row.
    await click(button(defined(rows[0] as HTMLElement), zh.delete))
    expect(button(document.body, zh.undo).disabled).toBe(false)
    await click(button(document.body, zh.undo))
    expect(document.querySelectorAll('.da-mark')).toHaveLength(2)
  })
})

describe('a body whose owner keeps the open card and the selection', () => {
  // In a column the chrome moves from page to page as the reader scrolls. A card or
  // a selection held by the page body would be dropped at every page boundary, so
  // the list would shut itself while being read.
  it('opens the card the owner says is open, and reports a change back', async () => {
    const opened: (string | null)[] = []
    await svgBody({}, {
      openPanel: null,
      onOpenPanelChange: (next) => { opened.push(next) },
    })
    // The owner says nothing is open, so no card is.
    expect(document.querySelector('.da-float-list')).toBeNull()
    await click(button(document.body, zh.marks))
    // The choice is the owner's from here on: the body reports it instead of keeping
    // a second copy that could disagree with the document.
    expect(opened[opened.length - 1]).toBe('list')
  })

  it('reports a new selection to the owner rather than keeping it', async () => {
    const picked: (string | null)[] = []
    await svgBody({}, {
      draft: { marks: [{ id: 'a', kind: 'arrow', color: '#1971c2', points: [[10, 10], [40, 30]] }] },
      openPanel: 'list',
      selectedId: null,
      onSelectedIdChange: (next) => { picked.push(next) },
    })
    const row = defined(document.querySelector('.da-mark') as HTMLElement | null)
    await act(async () => {
      defined(row.querySelector('.da-mark-text') as HTMLElement | null)
        .dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    // The selection is one thing in the reader's head, so the document holds it and
    // a page body only ever says what happened.
    expect(picked).toEqual(['a'])
  })
})

describe('removing a mark the owner has selected', () => {
  // Deleting the selected mark has to clear the selection, whichever side keeps it:
  // a pill pointing at a mark that is gone names nothing.
  it('clears the owner-held selection when the selected mark is removed', async () => {
    const picked: (string | null)[] = []
    await svgBody({}, {
      draft: { marks: [{ id: 'a', kind: 'arrow', color: '#1971c2', points: [[10, 10], [40, 30]] }] },
      openPanel: 'list',
      selectedId: 'a',
      onSelectedIdChange: (next) => { picked.push(next) },
    })
    const row = defined(document.querySelector('.da-mark') as HTMLElement | null)
    await click(button(row, zh.delete))
    expect(picked).toContain(null)
  })
})

describe('the wheel as the one magnification gesture', () => {
  // The reader's complaint was that the same motion meant two things: a wheel over
  // a page that fits the pane looked like a request for the next page, while a wheel
  // meant for a closer look is the same motion. It means one thing now, and the page
  // turn is the keyboard's.
  it('magnifies on a plain wheel upward, with no modifier held', async () => {
    mounted = await svgBody({}, {}, { stageWidth: 500 })
    const stage = defined(document.querySelector('.da-stage')) as HTMLElement
    const surface = defined(document.querySelector('.da-surface')) as HTMLElement
    stubRect(stage, { left: 0, top: 0, width: 500, height: 400 })
    const before = Number.parseFloat(surface.style.width)
    const event = new WheelEvent('wheel', {
      deltaY: -30, clientX: 120, clientY: 90, bubbles: true, cancelable: true,
    })
    await act(async () => { stage.dispatchEvent(event) })
    expect(event.defaultPrevented).toBe(true)
    expect(Number.parseFloat(surface.style.width)).toBeGreaterThan(before)
  })

  it('shrinks on a plain wheel downward', async () => {
    mounted = await svgBody({}, {}, { stageWidth: 500 })
    const stage = defined(document.querySelector('.da-stage')) as HTMLElement
    const surface = defined(document.querySelector('.da-surface')) as HTMLElement
    stubRect(stage, { left: 0, top: 0, width: 500, height: 400 })
    const before = Number.parseFloat(surface.style.width)
    const event = new WheelEvent('wheel', {
      deltaY: 30, clientX: 120, clientY: 90, bubbles: true, cancelable: true,
    })
    await act(async () => { stage.dispatchEvent(event) })
    expect(Number.parseFloat(surface.style.width)).toBeLessThan(before)
  })

  it('keeps the point under the pointer where it was', async () => {
    // A wheel that grew the picture away from the pointer would make the reader chase
    // the part they were looking at.
    mounted = await svgBody({}, {}, { stageWidth: 500 })
    const stage = defined(document.querySelector('.da-stage')) as HTMLElement
    stubRect(stage, { left: 0, top: 0, width: 500, height: 400 })
    // Wide enough that the picture has to overflow the scrollport to stay anchored:
    // a picture narrower than its pane has no scroll offset to move.
    for (let step = 0; step < 6; step += 1) {
      await act(async () => {
        stage.dispatchEvent(new WheelEvent('wheel', {
          deltaY: -60, clientX: 400, clientY: 180, bubbles: true, cancelable: true,
        }))
      })
    }
    // The scrollport moved to hold the anchor under the pointer.
    expect(stage.scrollLeft).toBeGreaterThan(0)
  })
})

describe('a row of the list as the way to the mark', () => {
  // The row is the reader's index of their own work: pressing one should take them
  // to the mark and open its comment, not just highlight a number.
  it('selects the mark and opens its comment from the row', async () => {
    mounted = await svgBody({ annotation: saved })
    await openList(document.body)
    expect(document.querySelector('.da-float-detail')).toBeNull()
    await click(defined(document.querySelector('.da-mark-text')))
    expect(document.querySelector('.da-float-detail')).not.toBeNull()
    expect(defined(detailBox().value)).toContain('标号指错了')
  })

  it('keeps the number, the shape and the delete on one row', async () => {
    // The row is a card, and everything on it is about one mark. Deleting from a row
    // that no longer had this mark's number on it would be two marks in one line.
    mounted = await svgBody({ annotation: saved })
    await openList(document.body)
    const row = defined(document.querySelector('.da-mark'))
    expect(row.querySelector('.da-mark-n')?.textContent).toBe('1')
    expect(row.querySelector('.da-mark-glyph svg')).not.toBeNull()
    // A plain figure has no pages, so a row of its list carries no page at all —
    // the page belongs to the document, not to the mark.
    expect(row.querySelector('.da-mark-page')).toBeNull()
    const del = defined(row.querySelector('.da-mark-del'))
    expect(del.getAttribute('aria-label')).toBe(zh.delete)
    expect(del.textContent).toBe('✕')
  })

  it('says which page a mark is on, and nothing else it can show', async () => {
    // A document's rows can name pages the reader is not looking at, so the page is
    // the fact worth the second line. A plain figure has no pages and gets no line.
    mounted = await svgBody({ annotation: saved })
    await openList(document.body)
    expect(document.querySelector('.da-mark-meta')?.textContent ?? '').not.toContain('页')
  })
})

describe('a list row that turns the page', () => {
  // Only a paged body can turn, and only its owner knows the page number — so the
  // row reports the mark instead of turning anything itself.
  it('asks the owner to reveal a mark, rather than turning its own page', async () => {
    const revealed: string[] = []
    mounted = await svgBody({}, {
      onRevealMark: (mark) => { revealed.push(mark.id) },
      documentMarks: [{ id: 'm1', kind: 'rect', color: '#1971c2', points: [[1, 1], [9, 9]], page: 4 }],
    })
    await openList(document.body)
    await click(defined(document.querySelector('.da-mark-text')))
    expect(revealed).toEqual(['m1'])
    // The page sits at the row's end, not on the line under the sentence.
    expect(defined(document.querySelector('.da-mark-page')).textContent).toContain('4')
    expect(document.querySelector('.da-mark-meta')).toBeNull()
  })
})

describe('the light the picker shines', () => {
  it('lights the element itself rather than a box around it', async () => {
    // An inline SVG's elements are children of the panel's document, so the light is a
    // class on the element: the reader sees the curve glow rather than a box round it.
    // The document is asked what is under the pointer, as a browser would answer it.
    mounted = await svgBody()
    await click(button(document.body, zh.toolElement))
    const figure = defined(document.querySelector('svg.da-figure')) as SVGSVGElement
    const host = defined(figure.parentElement) as HTMLElement
    const text = defined(host.querySelector('text'))
    text.setAttribute('id', 'lead')
    const overlay = defined(document.querySelector('svg.da-overlay')) as SVGSVGElement
    stubRect(overlay, { left: 0, top: 0, width: 200, height: 100 })
    Object.defineProperty(document, 'elementsFromPoint', {
      configurable: true,
      value: () => [text, host],
    })
    try {
      await act(async () => {
        overlay.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 10, clientY: 20 }))
      })
    } finally {
      Reflect.deleteProperty(document, 'elementsFromPoint')
    }
    // The light is on the element the anchor named — the <text> itself, which is what
    // makes the highlight follow the glyphs instead of drawing a rectangle.
    expect(text.classList.contains('da-spot')).toBe(true)
    // And nothing this plugin draws wears it: the overlay is the panel talking, not the
    // figure, so lighting anything in it would be a second language again.
    expect(overlay.querySelectorAll('.da-spot')).toHaveLength(0)
  })

  it('keeps an element mark lit on the element it names', async () => {
    // An element mark draws nothing of its own — the light on the element IS the mark.
    // Losing it would leave a mark in the list with no sign of it on the figure.
    const marked: AnnotationDocument = {
      ...saved,
      marks: [{
        id: 'e1', kind: 'element', color: '#1971c2', points: [[10, 20], [40, 40]],
        detail: '标号指错了', anchor: { tag: 'text', selector: 'svg > text:nth-of-type(1)', text: '102', bbox: [10, 10, 30, 20] },
      }],
    }
    mounted = await svgBody({ annotation: marked })
    const text = defined(document.querySelector('svg.da-figure text'))
    expect(text.classList.contains('da-spot')).toBe(true)
    // Nothing this plugin draws carries the light: the figure's own shapes are what the
    // mark is about, and the overlay is the panel talking.
    expect(defined(document.querySelector('svg.da-overlay')).querySelectorAll('.da-spot')).toHaveLength(0)
  })

  it('lights the selected element mark harder than the others', async () => {
    const marked: AnnotationDocument = {
      ...saved,
      marks: [{
        id: 'e1', kind: 'element', color: '#1971c2', points: [[10, 20], [40, 40]],
        detail: '标号指错了', anchor: { tag: 'text', selector: 'svg > text:nth-of-type(1)', bbox: [10, 10, 30, 20] },
      }],
    }
    mounted = await svgBody({ annotation: marked }, { selectedId: 'e1' })
    const text = defined(document.querySelector('svg.da-figure text'))
    // Selected is said by how hard the light is, not by a box: a rectangle round a curve
    // is a region the figure never drew.
    expect(text.classList.contains('da-spot-selected')).toBe(true)
  })

  it('keeps lighting the element when the mark outlives the element it named', async () => {
    // The figure may have been replaced since the mark was placed. A name that resolves
    // to nothing is not an error, it is a mark with no light — the rest still shows.
    const orphaned: AnnotationDocument = {
      ...saved,
      marks: [
        {
          id: 'e1', kind: 'element', color: '#1971c2', points: [[10, 20], [40, 40]],
          detail: '不在图里了', anchor: { tag: 'g', selector: '#gone', bbox: [10, 10, 30, 20] },
        },
        {
          id: 'e2', kind: 'element', color: '#1971c2', points: [[10, 20], [40, 40]],
          detail: '同一个元素', anchor: { tag: 'text', selector: 'svg > text:nth-of-type(1)', bbox: [10, 10, 30, 20] },
        },
        {
          id: 'e3', kind: 'element', color: '#1971c2', points: [[10, 20], [40, 40]],
          detail: '又是它', anchor: { tag: 'text', selector: 'svg > text:nth-of-type(1)', bbox: [10, 10, 30, 20] },
        },
      ],
    }
    mounted = await svgBody({ annotation: orphaned })
    // Two marks name the same element: it is one element, so it wears one light.
    expect(document.querySelectorAll('.da-spot')).toHaveLength(1)
  })

  it('puts the light out when the picker is put away', async () => {
    mounted = await svgBody()
    await click(button(document.body, zh.toolElement))
    const figure = defined(document.querySelector('svg.da-figure')) as SVGSVGElement
    const host = defined(figure.parentElement) as HTMLElement
    const text = defined(figure.querySelector('text'))
    const overlay = defined(document.querySelector('svg.da-overlay')) as SVGSVGElement
    stubRect(overlay, { left: 0, top: 0, width: 200, height: 100 })
    Object.defineProperty(document, 'elementsFromPoint', {
      configurable: true,
      value: () => [text, host],
    })
    try {
      await act(async () => {
        overlay.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 10, clientY: 20 }))
      })
      expect(document.querySelectorAll('.da-spot')).toHaveLength(1)
      // A reader who puts the picker away is not asking about anything any more, and an
      // element left lit would be a promise the tool no longer keeps.
      await click(button(document.body, zh.toolSelect))
    } finally {
      Reflect.deleteProperty(document, 'elementsFromPoint')
    }
    expect(document.querySelectorAll('.da-spot')).toHaveLength(0)
  })
})
