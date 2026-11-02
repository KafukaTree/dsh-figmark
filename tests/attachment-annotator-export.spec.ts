// @vitest-environment jsdom
/** The deliverable contains both drawing and comments, escaped and bounded. */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { attachmentSvg, downloadAttachment, exportAttachment } from '../src/client/attachment-annotator/export'
import { stubRasterizer } from './dom'

afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers() })
describe('attachment PNG export', () => {
  it('carries Unicode comments and Pin numbering, wraps lines and treats markup as text', () => {
    const output = attachmentSvg('data:image/png;base64,AA==', { width: 100, height: 80 }, [
      { id: 'pin', kind: 'point', color: '#e03131', points: [[30, 30]], detail: '中文🙂 <script>&\n第二行\n\n' + '长'.repeat(80) },
      { id: 'rect', kind: 'rect', color: '#e03131', points: [[10, 10], [40, 40]], detail: '框内' },
      { id: 'empty', kind: 'point', color: '#e03131', points: [[70, 70]], detail: '  ' },
      { id: 'unset', kind: 'point', color: '#e03131', points: [[80, 70]] },
    ])
    const doc = new DOMParser().parseFromString(output.svg, 'image/svg+xml')
    expect(doc.querySelector('parsererror')).toBeNull()
    expect(doc.querySelector('script')).toBeNull()
    expect(doc.documentElement.textContent).toContain('Pin 1 · 中文🙂 <script>&')
    expect(doc.documentElement.textContent).toContain('第二行')
    expect(doc.documentElement.textContent).toContain('rect 1 · 框内')
    expect(output.height).toBeGreaterThan(80)
    expect(output.width).toBe(320)
    expect(output.scale).toBe(1)
  })
  it('keeps image dimensions with no comments and bounds canvas area/edges', () => {
    const ordinary = attachmentSvg('data:image/png;base64,AA==', { width: 640, height: 480 }, [])
    expect(ordinary).toMatchObject({ width: 640, height: 480, scale: 1 })
    const giant = attachmentSvg('data:image/png;base64,AA==', { width: 20000, height: 10000 }, [])
    expect(giant.width * giant.height * giant.scale ** 2).toBeLessThanOrEqual(16_000_001)
    expect(giant.width * giant.scale).toBeLessThanOrEqual(8192)
    const long = attachmentSvg('data:image/png;base64,AA==', { width: 100000, height: 100 }, [])
    expect(long.width * long.scale).toBe(8192)
  })
  it.each(['figure.svg', ''])('exports actual PNG bytes with a stable filename from %s', async name => {
    const log = stubRasterizer()
    const source = new File(['source'], name, { type: 'image/png' })
    const file = await exportAttachment(source, { width: 640, height: 480 }, [])
    expect(file.name).toBe(name === '' ? 'image.annotated.png' : 'figure.annotated.png')
    expect(file.type).toBe('image/png')
    expect(file.size).toBeGreaterThan(0)
    expect(log.canvasSizes).toEqual([{ width: 640, height: 480 }])
  })
  it('surfaces a read failure and can be retried', async () => {
    class FailedReader { onerror: (() => void) | null = null; readAsDataURL(): void { this.onerror?.() } }
    vi.stubGlobal('FileReader', FailedReader)
    await expect(exportAttachment(new File(['x'], 'x.png'), { width: 10, height: 10 }, [])).rejects.toThrow('无法读取')
    vi.unstubAllGlobals()
  })
  it('downloads explicitly and revokes its own URL after the click', () => {
    vi.useFakeTimers()
    const create = vi.fn(() => 'blob:download')
    const revoke = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: create })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revoke })
    let filename = ''
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { filename = this.download })
    downloadAttachment(new File(['x'], 'result.png'))
    expect(filename).toBe('result.png')
    expect(revoke).not.toHaveBeenCalled()
    vi.runAllTimers()
    expect(revoke).toHaveBeenCalledWith('blob:download')
  })
})
