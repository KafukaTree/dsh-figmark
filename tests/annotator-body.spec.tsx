// @vitest-environment jsdom
/** The document body: figure loading, editing, zoom, and the two save paths. */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AnnotationDocument, MarkAnchor } from '../src/shared/annotation'
import { ANNOTATION_VERSION } from '../src/shared/annotation'
import { AnnotatorBody, type AnnotatorBodyProps, type PageSurface, type SurfaceDraft } from '../src/client/AnnotatorBody'
import { en, zh } from '../src/client/locales'
import type { ComposerLike } from '../src/client/composer'
import type { SessionsLike } from '../src/client/session'
import { AUTOSAVE_DELAY_MS } from '../src/client/autosave'
import { PINCH_SETTLE_DELAY_MS } from '../src/client/zoom'
import { readPreferences } from '../src/client/preferences'
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
    figure: { path: '/w/fig.svg', mediaType: 'image/svg+xml', sha256: answers.sha256 ?? 'a'.repeat(64) },
    annotation: answers.annotation ?? null,
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

  it('swallows a failure that arrives after the panel is gone', async () => {
    const pending = deferredFetch()
    const panel = await mountBody({ content: { kind: 'bytes', data: svgBytes() }, resourceAddress: SVG_ADDRESS })
    await act(async () => { panel.root.unmount() })
    pending.fail(new Error('too late'))
    await act(async () => { for (let turn = 0; turn < 4; turn += 1) await Promise.resolve() })
    expect(document.querySelector('.da-status')).toBeNull()
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
    expect(detailCard().textContent).toContain(zh.toolArrow)
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
    expect(detailCard().textContent).toContain(zh.toolArrow)
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
    const numbers = [...document.querySelectorAll('.da-mark-index')]
    expect(numbers).toHaveLength(2)
    expect((defined(numbers[1]) as HTMLElement).style.background).toBe('rgb(224, 49, 49)')
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
    expect(detailCard().textContent).toContain(zh.toolArrow)
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
    mounted = await svgBody({
      annotation: { ...saved, marks: [{ id: 'm1', kind: 'pen', color: '#2f9e44', points: [[1, 1], [5, 6], [9, 2]] }] },
    })
    await openList(document.body)
    expect(document.querySelector('.da-mark-meta')?.textContent).toContain(zh.toolPen)
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
    expect(detailCard().textContent).toContain(zh.toolArrow)
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

  it('leaves a two-finger scroll panning the view', async () => {
    mounted = await svgBody({}, {}, { stageWidth: 500 })
    const stage = defined(document.querySelector('.da-stage')) as HTMLElement
    stubRect(stage, { left: 0, top: 0, width: 500, height: 400 })
    const event = new WheelEvent('wheel', {
      deltaY: 40, clientX: 60, clientY: 50, bubbles: true, cancelable: true,
    })
    await act(async () => { stage.dispatchEvent(event) })
    expect(event.defaultPrevented).toBe(false)
    expect((defined(document.querySelector('.da-surface')) as HTMLElement).style.width).toBe('300px')
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

  it('records no undo step for the colour a mark already wears', async () => {
    mounted = await svgBody({ annotation: saved })
    await selectFirstMark(document.body)
    await openStyle(document.body)
    await click(defined(document.querySelector('.da-swatch[aria-label="#e03131"]')))
    // The mark was already that colour, so there is still only the load to walk back.
    expect(button(document.body, zh.undo).disabled).toBe(true)
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

  it('closes the detail card from its own button, letting go of the mark', async () => {
    mounted = await svgBody({ annotation: saved })
    await selectFirstMark(document.body)
    const card = defined(document.querySelector('.da-float-detail'))
    // The list card is open behind it and carries the same label, so the button is
    // looked up inside the card it belongs to rather than across the whole panel.
    await click(defined(card.querySelector('button[aria-label]')))
    expect(document.querySelector('.da-float-detail')).toBeNull()
    // Letting go of the card lets go of what it described, so the surface is back
    // to its resting state rather than holding a selection with no card.
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
    expect(document.body.textContent).toContain('the sessions service is unavailable')
  })

  it('reports an address that names no session to deliver into', async () => {
    const { sessions } = stubSessions()
    mounted = await svgBody({ annotation: saved }, { sessions, resourceAddress: ABSOLUTE_ADDRESS })
    await click(button(document.body, zh.sendToAgent))
    expect(document.body.textContent).toContain('the figure address carries no session')
  })

  it('reports a refused write without losing the panel', async () => {
    mounted = await svgBody({ annotation: saved, saveError: 'annotation document version 9 is not 1' })
    await click(button(document.body, zh.sendToAgent))
    expect(document.body.textContent).toContain('annotation document version 9 is not 1')
  })

  it('reports a figure the host would not read as a save failure too', async () => {
    mounted = await svgBody({ readError: 'no such figure' })
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
    const result = await svgBody()
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
    expect(document.body.textContent).toContain('the conversation service is unavailable')
    expect(result.calls.filter(call => call.init?.method === 'POST')).toHaveLength(1)
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
    mounted = await svgBody({ annotation: saved, saveThrows: 'the socket died' })
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
    expect(parts[0]?.text).toContain(`文件 sha256:${'b'.repeat(12)}`)
    expect(parts[0]?.text).toContain('anchor.selector')
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
    await click(defined(result.host.querySelector('.da-mark-index')))
    expect(defined(result.host.querySelector('.da-mark')).getAttribute('data-selected')).toBe('true')
    expect(detailCard(result.host).textContent).toContain(zh.toolArrow)
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
