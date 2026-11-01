/**
 * Characterisation harness for the document body the panel harness cannot see.
 *
 * `golden.spec.tsx` renders the figure body, which is the one with the overlay,
 * the marks and the geometry — the surface a split is most likely to break. The
 * PDF body sits behind it and renders its own chrome: a pager, a page field,
 * keyboard paging and one seat for the whole document. It was split in this
 * refactor and is not reachable from the figure harness.
 *
 * Like `golden.spec.tsx`, this file asserts nothing on its own. It writes each
 * state's DOM to the file named by `DOCUMENTS_OUT` and is skipped unless that
 * variable is set, so an ordinary run stays silent.
 *
 * @example
 * DOCUMENTS_OUT=/tmp/documents.json npx vitest run tests/refactor/documents.spec.tsx
 */
// @vitest-environment jsdom
import { writeFileSync } from 'node:fs'
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, it, vi } from 'vitest'
import { markOrdinals, type AnnotationDocument, type AnnotationMark } from '../../src/shared/annotation'
import { AUTOSAVE_DELAY_MS, annotationSignature, createAutosave } from '../../src/client/autosave'
import { figureUnit } from '../../src/client/scale'
import type { AnnotatorBodyProps } from '../../src/client/AnnotatorBody'
import type { DocumentSeat } from '../../src/client/document-seat'
import type { PdfBodyProps } from '../../src/client/pdf/PdfBody'
import { PdfBody } from '../../src/client/pdf/PdfBody'
import type { ToastStackProps, Toasts } from '../../src/client/annotator/toasts'
import { zh } from '../../src/client/locales'
import { defined } from '../dom'

/** What the PDF runtime double answers, reset before every state. */
const runtime = vi.hoisted(() => ({
  pages: 3,
  size: { width: 600, height: 800 },
  rendered: [] as number[],
  destroyed: 0,
}))

vi.mock('../../src/client/pdf/runtime', () => ({
  openPdf: async () => ({
    pageCount: runtime.pages,
    size: async () => ({ ...runtime.size, transform: [1, 0, 0, -1, 0, 800] }),
    render: async (page: number) => {
      runtime.rendered.push(page)
      return {
        dataUrl: `data:image/png;base64,page${page}`,
        width: runtime.size.width,
        height: runtime.size.height,
        pixelWidth: runtime.size.width,
        pixelHeight: runtime.size.height,
      }
    },
    destroy: async () => { runtime.destroyed += 1 },
  }),
}))

/** The real writer parses a PDF; a two-byte fixture is not one. */
vi.mock('../../src/client/pdf/annotate', () => ({
  annotatePdf: async () => new TextEncoder().encode('%PDF-1.7 annotated'),
}))

/** What the PDF seat double reports as loaded. */
const seatState = vi.hoisted(() => ({
  loaded: null as { path: string; mediaType: string; sha256: string; annotation: AnnotationDocument | null; unreadable: readonly string[] } | null,
}))

/** A seat that loads what `seatState` says and accepts every write. */
function pdfSeat(): DocumentSeat {
  return {
    load: async () => seatState.loaded ?? {
      path: '/w/report.pdf',
      mediaType: 'application/pdf',
      sha256: 'a'.repeat(64),
      annotation: null,
      unreadable: [],
    },
    save: async () => ({ annotationPath: '/w/a.json', reviewPath: '/w/a.pdf' }),
    draft: async () => {},
    send: async () => [],
    compose: async () => {},
    discard: async () => {},
  }
}

/** The seat the figure body would be, standing in so the PDF body's own chrome is the whole dump. */
function StubAnnotatorBody(props: AnnotatorBodyProps): ReactNode {
  return (
    <>
      {props.pagingSlot}
      <span>{`page ${String(props.page?.width ?? 0)} marks ${String(props.draft?.marks.length ?? 0)}`}</span>
    </>
  )
}

/** Quiet feedback for the structural document dumps. */
const quietToasts: Toasts = {
  entries: [],
  note: () => {},
  notify: async () => 'ok',
  send: async () => 'ok',
  mark: () => {},
  retry: () => {},
  dropTone: () => {},
  remove: () => {},
  clear: () => {},
}

/** The dumps do not open feedback, so the stack renders nothing. */
function QuietToastStack(_props: ToastStackProps): ReactNode { return null }

/** The copy the panel would have, resolved against the local dictionary. */
const translate = (key: string, vars?: Record<string, number | string>): string => {
  const text = (zh as Record<string, string>)[key] ?? key
  return vars === undefined ? text : text.replace(/\{(\w+)\}/gu, (_whole, name: string) => String(vars[name] ?? _whole))
}

/** Everything the PDF body renders with, with one state's overrides. */
function pdfProps(overrides: Partial<PdfBodyProps> = {}): PdfBodyProps {
  return {
    content: { kind: 'bytes', data: new Uint8Array([1, 2]) },
    resourceAddress: 'dsh-resource://file/session/s1/report.pdf',
    AnnotatorBody: StubAnnotatorBody,
    seat: pdfSeat(),
    createAutosave,
    annotationSignature,
    autosaveDelayMs: AUTOSAVE_DELAY_MS,
    figureUnit,
    markOrdinals,
    t: translate,
    toasts: quietToasts,
    ToastStack: QuietToastStack,
    ...overrides,
  }
}

/** An annotation of one paged document. */
function pagedAnnotation(marks: readonly AnnotationMark[], sha256 = 'a'.repeat(64)): AnnotationDocument {
  return {
    version: 1,
    figure: {
      address: 'dsh-resource://file/session/s1/report.pdf',
      path: '/w/report.pdf',
      mediaType: 'application/pdf',
      sha256,
      pageCount: 3,
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    marks,
  }
}

let root: Root | undefined
let host: HTMLElement
const dumps: Record<string, string> = {}

beforeEach(() => {
  class StubResizeObserver { observe(): void {} disconnect(): void {} }
  vi.stubGlobal('ResizeObserver', StubResizeObserver)
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 800 })
  seatState.loaded = null
  runtime.pages = 3
  runtime.rendered = []
})

afterEach(() => {
  root?.unmount()
  root = undefined
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
  delete (HTMLElement.prototype as { clientWidth?: number }).clientWidth
})

/** Mount a fresh host and let the body's first effects settle. */
async function mount(render: (host: HTMLElement) => ReactNode): Promise<HTMLElement> {
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  await act(async () => {
    root?.render(render(host))
    for (let turn = 0; turn < 20; turn += 1) await Promise.resolve()
  })
  return host
}

/** One button, found by its accessible label. */
function labelled(target: HTMLElement, label: string): HTMLButtonElement {
  return defined([...target.querySelectorAll('button')].find(
    element => element.getAttribute('aria-label') === label || element.textContent === label,
  ) as HTMLButtonElement | undefined)
}

/** Click one element and let its handlers settle. */
async function click(element: Element): Promise<void> {
  await act(async () => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    for (let turn = 0; turn < 10; turn += 1) await Promise.resolve()
  })
}

/** Press one key on the window and let its handlers settle. */
async function key(target: string): Promise<void> {
  await act(async () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: target }))
    for (let turn = 0; turn < 10; turn += 1) await Promise.resolve()
  })
}

const capture = (name: string, target: HTMLElement): void => { dumps[name] = target.innerHTML }

describe.skipIf(process.env['DOCUMENTS_OUT'] === undefined)('document body', () => {
  it('a pdf waiting for its first raster', async () => {
    const target = await mount(() => <PdfBody {...pdfProps()} />)
    capture('pdf-waiting', target)
  })

  it('a pdf on page one with nothing drawn', async () => {
    seatState.loaded = {
      path: '/w/report.pdf',
      mediaType: 'application/pdf',
      sha256: 'a'.repeat(64),
      annotation: pagedAnnotation([]),
      unreadable: [],
    }
    const target = await mount(() => <PdfBody {...pdfProps()} />)
    capture('pdf-page-one', target)
  })

  it('a pdf carrying marks and a summary', async () => {
    seatState.loaded = {
      path: '/w/report.pdf',
      mediaType: 'application/pdf',
      sha256: 'a'.repeat(64),
      annotation: pagedAnnotation([
        { id: 'm1', kind: 'rect', color: '#1971c2', points: [[10, 20], [60, 90]], page: 1, detail: '标号错' },
      ]),
      unreadable: [],
    }
    const target = await mount(() => <PdfBody {...pdfProps()} />)
    capture('pdf-with-marks', target)
  })

  it('a pdf whose file no longer matches its annotation', async () => {
    seatState.loaded = {
      path: '/w/report.pdf',
      mediaType: 'application/pdf',
      sha256: 'b'.repeat(64),
      annotation: pagedAnnotation([
        { id: 'm1', kind: 'point', color: '#e03131', points: [[3, 4]], page: 2 },
      ]),
      unreadable: [],
    }
    const target = await mount(() => <PdfBody {...pdfProps()} />)
    capture('pdf-stale', target)
  })

  it('a pdf with its page field open', async () => {
    const target = await mount(() => <PdfBody {...pdfProps()} />)
    await click(labelled(target, zh.pageJump))
    capture('pdf-page-field', target)
  })

  it('a pdf turned to its last page', async () => {
    const target = await mount(() => <PdfBody {...pdfProps()} />)
    await key('ArrowRight')
    await key('ArrowRight')
    capture('pdf-page-three', target)
  })

  it('a pdf given no address', async () => {
    const target = await mount(() => <PdfBody {...pdfProps({ resourceAddress: undefined })} />)
    capture('pdf-no-address', target)
  })

  it('a pdf given no bytes', async () => {
    const target = await mount(() => <PdfBody {...pdfProps({ content: { kind: 'text' } })} />)
    capture('pdf-no-bytes', target)
  })

  it('write the dump', () => {
    writeFileSync(defined(process.env['DOCUMENTS_OUT'] as string | undefined), JSON.stringify(dumps, null, 1))
  })
})
