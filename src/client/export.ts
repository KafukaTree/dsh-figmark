/**
 * Composing the flattened review image.
 *
 * The reviewed picture is the figure plus every mark, built as one standalone SVG
 * (no external references, system fonts only) and rasterized through a canvas, so
 * the agent receives exactly the picture the user approved.
 * @module dsh-figmark/client/export
 */

import type { AnnotationMark } from '../shared/annotation'
import {
  PIN_FONT_FAMILY, PIN_NUMBER_COLOR, pinFontSizeOf, strokeWidthOf,
  markPathData, pinNumberCentre, pinPathData,
} from './render'
import { figureUnit } from './scale'
import { plotBounds } from './plot'

/** The figure layer placed under the marks. */
export type FigureLayer =
  | {
    /** Vector figure: sanitized SVG markup inlined into the review image. */
    readonly kind: 'svg'
    /** Sanitized SVG markup. */
    readonly markup: string
    /** The figure's own `viewBox`, when it declares one. */
    readonly viewBox?: string
    /** Intrinsic width in figure pixels. */
    readonly width: number
    /** Intrinsic height in figure pixels. */
    readonly height: number
  }
  | {
    /** Raster figure: a data URL embedded as an `<image>`. */
    readonly kind: 'raster'
    /** `data:` URL of the figure bytes. */
    readonly dataUrl: string
    /** Intrinsic width in figure pixels. */
    readonly width: number
    /** Intrinsic height in figure pixels. */
    readonly height: number
  }

/**
 * Render one mark as SVG elements, with a white halo so it reads over black line work.
 *
 * @param mark - the mark to draw.
 * @param number - the mark's number in the list, when it carries one.
 * @param unit - the figure's size multiple, so the export is drawn at the same
 *   weight the reader saw.
 * @returns the mark's elements.
 */
function markSvg(mark: AnnotationMark, number: number | undefined, unit: number): string {
  const path = markPathData(mark)
  const parts: string[] = []
  if (path !== undefined) {
    parts.push(
      `<path d="${path}" fill="none" stroke="#ffffff" stroke-width="${strokeWidthOf(mark, unit) + 2.5 * unit}"`
      + ' stroke-linecap="round" stroke-linejoin="round"/>',
      `<path d="${path}" fill="none" stroke="${mark.color}" stroke-width="${strokeWidthOf(mark, unit)}"`
      + ' stroke-linecap="round" stroke-linejoin="round"/>',
    )
  }
  // A point mark has no stroke: it is the marker standing on its one coordinate.
  // Drawn from the same geometry the overlay uses, so the picture the agent gets and
  // the one the reader approved cannot disagree about where the mark is.
  const pin = mark.kind === 'point' ? pinPathData(mark, unit) : undefined
  const centre = mark.kind === 'point' ? pinNumberCentre(mark, unit) : undefined
  if (pin !== undefined && centre !== undefined) {
    parts.push(`<path d="${pin}" fill="${mark.color}" stroke="#ffffff" stroke-width="${2 * unit}" stroke-linejoin="round"/>`)
    if (number !== undefined) {
      parts.push(
        `<text x="${centre[0]}" y="${centre[1]}" font-family="${PIN_FONT_FAMILY}"`
        + ` font-size="${pinFontSizeOf(mark, unit)}" font-weight="700" fill="${PIN_NUMBER_COLOR}"`
        + ` text-anchor="middle" dominant-baseline="central">${number}</text>`,
      )
    }
  }
  return parts.join('')
}

/** The figure layer as SVG elements. */
function figureSvg(layer: FigureLayer): string {
  if (layer.kind === 'raster') {
    return `<image x="0" y="0" width="${layer.width}" height="${layer.height}" href="${layer.dataUrl}"/>`
  }
  const viewBox = layer.viewBox === undefined ? '' : ` viewBox="${layer.viewBox}"`
  const inner = layer.markup.replace(/^<\?xml[^>]*\?>\s*/u, '').replace(/^<svg[^>]*>/iu, '').replace(/<\/svg>\s*$/iu, '')
  return `<svg x="0" y="0" width="${layer.width}" height="${layer.height}"${viewBox}`
    + ` preserveAspectRatio="xMidYMid meet">${inner}</svg>`
}

/**
 * Encode bytes as a `data:` URL.
 *
 * The export path needs this rather than an object URL: an SVG loaded into an
 * `<img>` cannot resolve a `blob:` reference, so a blob URL would make the whole
 * review image undecodable.
 * @param bytes - file bytes.
 * @param mediaType - the bytes' media type.
 * @returns the data URL.
 */
export function bytesToDataUrl(bytes: Uint8Array, mediaType: string): string {
  let binary = ''
  const chunk = 0x8000
  for (let offset = 0; offset < bytes.length; offset += chunk) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunk))
  }
  return `data:${mediaType};base64,${btoa(binary)}`
}

/**
 * Build the standalone review SVG.
 * @param layer - the figure to place underneath.
 * @param marks - marks in draw order.
 * @param numbering - each mark's number, when these marks are a slice of a longer list.
 * @returns complete SVG markup.
 */
export function composeReviewSvg(
  layer: FigureLayer,
  marks: readonly AnnotationMark[],
  numbering?: ReadonlyMap<string, number>,
): string {
  const numbers = new Map(marks.map((mark, index) => [mark.id, numbering?.get(mark.id) ?? index + 1]))
  // Measured from the figure, not from this call's marks: the export has to look like
  // the overlay, and the overlay sizes every mark by the surface they share.
  const unit = figureUnit(layer.width, layer.height)
  // The paper is the figure plus wherever the marks reach, so a box drawn past the
  // edge lands on white rather than off the picture. Marks and figure are placed at
  // the paper's own origin, which is why the whole content is shifted by one offset.
  const paper = plotBounds(layer.width, layer.height, marks, unit)
  const shift = `translate(${-paper.x} ${-paper.y})`
  // A mark that left the figure grew the paper, and the reader of this picture has no
  // panel behind it to tell them where the figure stopped: to them the margin is just
  // more white. So when the paper did grow, the figure's own edge is drawn as a dashed
  // rule — the one thing on the picture that is not the reader's own drawing, which is
  // exactly why it has to be dashed and grey rather than solid and black.
  const grown = paper.x !== 0 || paper.y !== 0
    || paper.width !== layer.width || paper.height !== layer.height
  const edge = grown ? figureEdge(layer.width, layer.height, unit) : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"`
    + ` width="${paper.width}" height="${paper.height}" viewBox="0 0 ${paper.width} ${paper.height}">`
    + `<rect x="0" y="0" width="${paper.width}" height="${paper.height}" fill="#ffffff"/>`
    + `<g transform="${shift}">`
    + figureSvg(layer)
    + edge
    + marks.map(mark => markSvg(mark, numbers.get(mark.id), unit)).join('')
    + '</g></svg>'
}

/** Round a stroke measurement to a tenth, as the path data does. */
function hair9(value: number): string {
  return (Math.round(value * 10) / 10).toString()
}

/**
 * The rule that marks where the figure ends and the grown paper begins.
 *
 * Drawn only when the paper grew, and drawn grey and dashed: it is a note about the
 * picture, not part of it, so it must not read as a mark the reader made.
 * @param width - the figure's width, in figure pixels.
 * @param height - the figure's height, in figure pixels.
 * @param unit - the figure's size multiple, so the rule is sized like the marks.
 * @returns an SVG rect, or an empty string when there is nothing to outline.
 */
function figureEdge(width: number, height: number, unit: number): string {
  const hair = Math.max(1, 1.5 * unit)
  return `<rect x="0" y="0" width="${width}" height="${height}" fill="none"`
    + ` stroke="#9aa3b2" stroke-width="${hair9(hair)}"`
    + ` stroke-dasharray="${hair9(6 * unit)} ${hair9(4 * unit)}"/>`
}

/**
 * The size of the picture {@link composeReviewSvg} builds.
 *
 * A caller has to know it before rasterizing: an SVG rendered at the figure's size
 * would crop away exactly the marks that made the paper grow.
 * @param layer - the figure to place underneath.
 * @param marks - marks in draw order.
 * @param unit - the figure's size multiple.
 * @returns the paper's width and height, in figure pixels.
 */
export function reviewSize(
  layer: FigureLayer,
  marks: readonly AnnotationMark[],
  unit = figureUnit(layer.width, layer.height),
): { readonly width: number; readonly height: number } {
  const paper = plotBounds(layer.width, layer.height, marks, unit)
  return { width: paper.width, height: paper.height }
}

/**
 * Rasterization scale for one review image.
 *
 * The export is meant to be read, not archived, so it is scaled up only until the
 * long edge reaches the size a vision model still resolves, and never past twice
 * the surface's own pixels.
 * @param width - surface width in units.
 * @param height - surface height in units.
 * @returns the device scale to rasterize at.
 */
export function reviewScale(width: number, height: number): number {
  return Math.min(2, Math.max(1, 2400 / Math.max(width, height)))
}

/**
 * Rasterize one review SVG to PNG bytes.
 * @param svg - standalone SVG markup.
 * @param width - output width in pixels.
 * @param height - output height in pixels.
 * @param scale - device scale applied to the output size.
 * @returns the PNG blob.
 * @throws {Error} when the SVG cannot be decoded into an image.
 */
export async function rasterizePng(
  svg: string,
  width: number,
  height: number,
  scale: number,
): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
  try {
    const image = new Image()
    image.decoding = 'sync'
    await new Promise<void>((resolve, reject) => {
      image.onload = () => { resolve() }
      image.onerror = () => { reject(new Error('the composed review image could not be decoded')) }
      image.src = url
    })
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(width * scale))
    canvas.height = Math.max(1, Math.round(height * scale))
    const context = canvas.getContext('2d')
    if (context === null) throw new Error('a 2D canvas is unavailable')
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>(resolve => { canvas.toBlob(resolve, 'image/png') })
    if (blob === null) throw new Error('the review image could not be encoded as PNG')
    return blob
  } finally {
    URL.revokeObjectURL(url)
  }
}
