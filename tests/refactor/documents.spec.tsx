/**
 * Characterisation harness for the document bodies the panel harness cannot see.
 *
 * `golden.spec.tsx` renders the figure body, which is the one with the overlay,
 * the marks and the geometry — the surface a split is most likely to break. The
 * two document bodies sit behind it and render their own chrome: the PDF body
 * holds a pager, a page field, keyboard paging and one seat for the whole
 * document; the Markdown body holds an editor, a gutter, a difference and its
 * delivery. Both were split in this refactor, and neither is reachable from the
 * figure harness.
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
import type { AnnotationDocument, AnnotationMark } from '../../src/shared/annotation'
import { AUTOSAVE_DELAY_MS, annotationSignature, createAutosave } from '../../src/client/autosave'
import { figureUnit } from '../../src/client/scale'
import type { AnnotatorBodyProps } from '../../src/client/AnnotatorBody'
import type { DocumentSeat } from '../../src/client/document-seat'
import type { PdfBodyProps } from '../../src/client/pdf/PdfBody'
import { PdfBody } from '../../src/client/pdf/PdfBody'
import { MarkdownBody } from '../../src/client/markdown/MarkdownBody'
import type { SessionsLike } from '../../src/client/session'
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
  loaded: null as { path: string; mediaType: string; sha256: string; annotation: AnnotationDocument | null } | null,
}))

/** A seat that loads what `seatState` says and accepts every write. */
function pdfSeat(): DocumentSeat {
  return {
    load: async () => seatState.loaded ?? {
      path: '/w/report.pdf',
      mediaType: 'application/pdf',
      sha256: 'a'.repeat(64),
      annotation: null,
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
    t: translate,
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

/** Re-render the mounted host with new props. */
async function rerender(render: (host: HTMLElement) => ReactNode): Promise<void> {
  await act(async () => {
    root?.render(render(host))
    for (let turn = 0; turn < 20; turn += 1) await Promise.resolve()
  })
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

/** Type into the Markdown editor the way a reader does, through the prototype's setter. */
async function typeInto(target: HTMLElement, text: string): Promise<void> {
  const editor = defined(target.querySelector('textarea')) as HTMLTextAreaElement
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set?.call(editor, text)
    editor.dispatchEvent(new Event('input', { bubbles: true }))
    for (let turn = 0; turn < 6; turn += 1) await Promise.resolve()
  })
}

/** Type into a plain text input the same way, through the prototype's setter. */
async function typeIntoField(field: Element, text: string): Promise<void> {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(field, text)
    field.dispatchEvent(new Event('input', { bubbles: true }))
    for (let turn = 0; turn < 6; turn += 1) await Promise.resolve()
  })
}

/** The text a Markdown document carries. */
const MARKDOWN = 'title\n\nbody\n'

/** A sessions stub that accepts every prompt, so a delivery is not an error path. */
const sessions = {
  scope: () => ({ live: true }),
  sessionOf: () => ({ prompt: async () => ({ ok: true }) }),
  using: async () => { throw new Error('unused') },
} as unknown as SessionsLike

/** Everything the Markdown body renders with. */
function markdownProps(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    content: { kind: 'text', text: MARKDOWN, eof: true },
    resourceAddress: 'dsh-resource://file/session/s1/docs/report.md',
    sessions,
    ...overrides,
  }
}

const capture = (name: string, target: HTMLElement): void => { dumps[name] = target.innerHTML }

describe.skipIf(process.env['DOCUMENTS_OUT'] === undefined)('document bodies', () => {
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

  it('a markdown document just loaded', async () => {
    const target = await mount(() => <MarkdownBody {...markdownProps()} />)
    capture('md-loaded', target)
  })

  it('a markdown document with its line gutter out', async () => {
    const target = await mount(() => <MarkdownBody {...markdownProps({ wrap: false })} />)
    capture('md-gutter', target)
  })

  it('a markdown document being edited', async () => {
    const target = await mount(() => <MarkdownBody {...markdownProps()} />)
    await typeInto(target, 'title\n\nchanged body\n')
    capture('md-edited', target)
  })

  it('a markdown document showing its difference', async () => {
    const target = await mount(() => <MarkdownBody {...markdownProps()} />)
    await typeInto(target, 'title\n\nchanged body\n')
    await click(labelled(target, zh.diffMode))
    capture('md-diff', target)
  })

  it('a markdown difference carrying a note', async () => {
    const target = await mount(() => <MarkdownBody {...markdownProps()} />)
    await typeInto(target, 'title\n\nchanged body\n')
    await click(labelled(target, zh.diffMode))
    const field = defined(target.querySelector('.da-diff-note input') as Element | null)
    await typeIntoField(field, 'please fix')
    capture('md-diff-note', target)
  })

  it('a markdown difference with nothing changed', async () => {
    const target = await mount(() => <MarkdownBody {...markdownProps()} />)
    await click(labelled(target, zh.diffMode))
    capture('md-empty-diff', target)
  })

  it('a markdown document with an edit in hand when the owner sends new text', async () => {
    const target = await mount(() => <MarkdownBody {...markdownProps()} />)
    await typeInto(target, 'changed\n')
    await rerender(() => (
      <MarkdownBody {...markdownProps({ content: { kind: 'text', text: 'new\n', eof: false } })} />
    ))
    capture('md-stale', target)
  })

  it('a markdown document still arriving', async () => {
    const target = await mount(() => (
      <MarkdownBody {...markdownProps({ content: { kind: 'text', text: '', eof: false } })} />
    ))
    capture('md-loading', target)
  })

  it('a markdown document reporting the copy it asks for', async () => {
    // The dictionary is not the point: echoing the key records *which* key every
    // spot on the surface asks for, which is what a split can quietly rewire.
    const target = await mount(() => (
      <MarkdownBody {...markdownProps({ t: (copyKey: string) => copyKey })} />
    ))
    capture('md-copy-keys', target)
  })

  it('write the dump', () => {
    writeFileSync(defined(process.env['DOCUMENTS_OUT'] as string | undefined), JSON.stringify(dumps, null, 1))
  })
})
