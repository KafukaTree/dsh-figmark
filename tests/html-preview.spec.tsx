// @vitest-environment jsdom
/** The static HTML surface: readable, sandboxed, and deliberately not an annotator. */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { HtmlPreviewBody } from '../src/client/html-preview'
import { defined, installDom } from './dom'

let host: HTMLElement
let root: Root

/** One static document with both things the preview must strip and must keep. */
const SOURCE = `<!doctype html>
<html>
  <head>
    <base href="https://example.test/">
    <meta http-equiv="refresh" content="1;url=https://example.test/away">
    <style>.slide{color:#234}</style>
  </head>
  <body>
    <h1 id="title">Static deck</h1>
    <script>document.body.dataset.ready = 'yes'</script>
  </body>
</html>`

/** Mount the preview with the bytes a `bytes-complete` renderer receives. */
async function mount(source = SOURCE): Promise<void> {
  await act(async () => {
    root.render(
      <HtmlPreviewBody
        content={{ kind: 'bytes', data: new TextEncoder().encode(source) }}
        resourceAddress="dsh-resource://file/session/s1/deck.html"
        localeId="zh"
      />,
    )
  })
}

beforeEach(() => {
  installDom()
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})

afterEach(() => {
  act(() => { root.unmount() })
  host.remove()
})

describe('the static HTML preview', () => {
  it('renders the document in an opaque script-and-style sandbox with no annotator chrome', async () => {
    await mount()
    const frame = defined(host.querySelector<HTMLIFrameElement>('.da-html-preview-frame'))
    const sandbox = defined(frame.getAttribute('sandbox')).split(/\s+/u)
    expect(sandbox).toContain('allow-scripts')
    expect(sandbox).not.toContain('allow-same-origin')
    expect(frame.getAttribute('referrerpolicy')).toBe('no-referrer')
    const source = defined(frame.getAttribute('srcdoc'))
    expect(source).toContain('<h1 id="title">Static deck</h1>')
    expect(source).toContain('<script>')
    expect(source).toContain("default-src 'none'")
    expect(source).toContain("script-src 'unsafe-inline'")
    expect(source).toContain("connect-src 'none'")
    expect(source).not.toContain('<base')
    expect(source).not.toMatch(/http-equiv="refresh"/iu)
    expect(host.querySelector('.da-bar')).toBeNull()
    expect(host.querySelector('.da-palette')).toBeNull()
  })

  it('says the file could not be read when the owner supplies no bytes', async () => {
    await act(async () => {
      root.render(<HtmlPreviewBody localeId="zh" />)
    })
    expect(host.querySelector('.da-html-preview-frame')).toBeNull()
    expect(host.querySelector('[role="alert"]')?.textContent).toBe('读取附图失败')
  })
})
