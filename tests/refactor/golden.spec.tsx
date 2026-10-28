/**
 * Characterisation harness: does the refactor change what the panel renders?
 *
 * This file asserts nothing on its own. It renders the panel in a series of
 * states and writes each one's DOM to the file named by `GOLDEN_OUT`. Run it
 * against the commit before a refactor and after, then diff the two dumps: a
 * difference is a behaviour change nobody asked for. It is skipped unless that
 * variable is set, so an ordinary test run stays silent.
 *
 * @example
 * GOLDEN_OUT=/tmp/before.json npx vitest run tests/refactor/golden.spec.tsx
 */
// @vitest-environment jsdom
import { writeFileSync } from 'node:fs'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, it, vi } from 'vitest'
import { AnnotatorBody, type AnnotatorBodyProps } from '../../src/client/AnnotatorBody'
import { zh } from '../../src/client/locales'
import { defined, stubRasterizer, stubRect } from '../dom'

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect id="bg" width="200" height="100" fill="#fff"/><path id="line2d_1" d="M10 10 L100 90" stroke="#000"/><text x="10" y="20">102</text></svg>'
const ADDRESS = 'dsh-resource://file/session/s1/fig.svg'

const svgBytes = (): Uint8Array => new TextEncoder().encode(SVG)

const ANNOTATION = {
  version: 3,
  figure: { address: ADDRESS, path: '/w/fig.svg', mediaType: 'image/svg+xml', width: 200, height: 100, sha256: 'a'.repeat(64) },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  marks: [
    { id: 'm1', kind: 'arrow', color: '#e03131', points: [[10, 10], [40, 30]], detail: '标号指错了' },
    { id: 'm2', kind: 'rect', color: '#1971c2', points: [[50, 50], [120, 80]], weight: 2 },
    { id: 'm3', kind: 'element', color: '#2f9e44', points: [[10, 10], [100, 90]], anchor: { tag: 'path', id: 'line2d_1', bbox: [10, 10, 90, 80], selector: '#line2d_1' } },
  ],
  summary: '改标号',
}

function stubFetch(annotation: unknown): void {
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) => {
    const respond = (body: unknown, status = 200) => ({ json: async () => body, status })
    if (init?.method === 'DELETE') return respond({ ok: true, removed: true })
    if (init?.method === 'POST') return respond({ ok: true, annotationPath: '/w/fig.annot.json', reviewPath: '/w/fig.annotated.png' })
    return respond({
      ok: true,
      figure: { path: '/w/fig.svg', mediaType: 'image/svg+xml', sha256: 'a'.repeat(64), workspace: '/w' },
      annotation,
    })
  }))
}

let mounted: { readonly root: ReturnType<typeof createRoot> } | undefined

beforeEach(() => {
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

async function mount(props: Partial<AnnotatorBodyProps> = {}): Promise<HTMLElement> {
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  mounted = { root }
  await act(async () => {
    root.render(<AnnotatorBody {...props} />)
    for (let turn = 0; turn < 40; turn += 1) await Promise.resolve()
  })
  return host
}

const button = (host: HTMLElement, label: string): HTMLButtonElement => defined(
  [...host.querySelectorAll('button')].find(el => el.getAttribute('aria-label') === label || el.textContent === label) as HTMLButtonElement | undefined,
)

async function click(element: Element): Promise<void> {
  await act(async () => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    for (let turn = 0; turn < 12; turn += 1) await Promise.resolve()
  })
}

const dumps: Record<string, string> = {}

const capture = (name: string, host: HTMLElement): void => {
  dumps[name] = host.innerHTML
}

describe.skipIf(process.env['GOLDEN_OUT'] === undefined)('golden', () => {
  it('empty figure', async () => {
    stubFetch(null)
    capture('empty', await mount({ content: { kind: 'bytes', data: svgBytes() }, resourceAddress: ADDRESS }))
  })

  it('saved annotation', async () => {
    stubFetch(ANNOTATION)
    capture('saved', await mount({ content: { kind: 'bytes', data: svgBytes() }, resourceAddress: ADDRESS }))
  })

  it('style popup open', async () => {
    stubFetch(ANNOTATION)
    const host = await mount({ content: { kind: 'bytes', data: svgBytes() }, resourceAddress: ADDRESS })
    await click(button(host, zh.style))
    capture('style', host)
  })

  it('list and goal open', async () => {
    stubFetch(ANNOTATION)
    const host = await mount({ content: { kind: 'bytes', data: svgBytes() }, resourceAddress: ADDRESS })
    await click(button(host, zh.marks))
    await click(button(host, zh.summary))
    capture('lists', host)
  })

  it('select a mark', async () => {
    stubFetch(ANNOTATION)
    const host = await mount({ content: { kind: 'bytes', data: svgBytes() }, resourceAddress: ADDRESS })
    await click(button(host, zh.marks))
    await click(defined(host.querySelector('.da-mark-text') as Element | null))
    capture('selected', host)
  })

  it('unsupported address', async () => {
    stubFetch(null)
    capture('unsupported', await mount({ content: { kind: 'bytes', data: svgBytes() }, resourceAddress: 'not-an-address' }))
  })

  it('write the dump', () => {
    writeFileSync(defined(process.env['GOLDEN_OUT'] as string | undefined), JSON.stringify(dumps, null, 1))
  })
})
