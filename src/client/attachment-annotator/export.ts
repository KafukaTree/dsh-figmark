/** Bounded PNG export, with Pin comments carried in the image rather than hidden in a prompt. */
import type { AnnotationMark } from '../../shared/annotation'
import { markOrdinals } from '../../shared/annotation'
import { composeReviewSvg, rasterizePng, reviewSize } from '../export'

export interface AttachmentSize { readonly width: number; readonly height: number }
/** Plain XML text; comments must never become SVG markup. */
function escapeText(value: string): string {
  return value.replace(/&/gu, '&amp;').replace(/</gu, '&lt;').replace(/>/gu, '&gt;')
}
/** Build one self-contained SVG with a readable legend below the original image. */
export function attachmentSvg(dataUrl: string, size: AttachmentSize, marks: readonly AnnotationMark[]) {
  const layer = { kind: 'raster' as const, dataUrl, ...size }
  const paper = reviewSize(layer, marks)
  const numbers = markOrdinals(marks)
  const font = Math.max(14, Math.min(32, paper.width / 45))
  const width = Math.max(paper.width, 320)
  const columns = Math.max(10, Math.floor((width - 32) / font))
  const lines = marks.flatMap(mark => {
    if (mark.detail === undefined || mark.detail.trim() === '') return []
    const text = `${mark.kind === 'point' ? 'Pin' : mark.kind} ${numbers.get(mark.id)} · ${mark.detail}`
    return text.split(/\r?\n/u).flatMap(line => {
      const chars = Array.from(line)
      const wrapped: string[] = []
      for (let at = 0; at < chars.length; at += columns) wrapped.push(chars.slice(at, at + columns).join(''))
      return wrapped
    })
  })
  const height = paper.height + (lines.length === 0 ? 0 : 32 + lines.length * font * 1.5)
  const original = composeReviewSvg(layer, marks)
  const legend = lines.map((line, at) => `<text x="16" y="${paper.height + 24 + at * font * 1.5}" font-size="${font}" fill="#222" font-family="sans-serif">${escapeText(line)}</text>`).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="white"/>${original}${legend}</svg>`
  // At most 16M pixels and 8192 on either edge; never upscale the original.
  const scale = Math.min(1, 8192 / width, 8192 / height, Math.sqrt(16_000_000 / (width * height)))
  return { svg, width, height, scale }
}
/** Read only when exporting; the host's preview URL remains owned by the host. */
export async function exportAttachment(file: File, size: AttachmentSize, marks: readonly AnnotationMark[]): Promise<File> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => { resolve(reader.result as string) }
    reader.onerror = () => { reject(new Error('无法读取原图，请重试。')) }
    reader.readAsDataURL(file)
  })
  const image = attachmentSvg(dataUrl, size, marks)
  const blob = await rasterizePng(image.svg, image.width, image.height, image.scale)
  return new File([blob], `${file.name.replace(/\.[^.]*$/u, '') || 'image'}.annotated.png`, { type: 'image/png' })
}
/** Download is explicit and does not involve any Session. */
export function downloadAttachment(file: File): void {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  link.click()
  // The click's navigation must consume the URL before it is revoked.
  setTimeout(() => { URL.revokeObjectURL(url) }, 1000)
}
