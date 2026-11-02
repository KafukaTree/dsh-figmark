/**
 * Composing the flattened review image.
 *
 * The reviewed picture is the figure plus every mark, built as one standalone SVG
 * (no external references, system fonts only) and rasterized through a canvas, so
 * the agent receives exactly the picture the user approved.
 * @module dsh-figmark/client/export
 */

import { markOrdinals, type AnnotationMark } from '../shared/annotation'
import {
  PIN_FONT_FAMILY, PIN_NUMBER_COLOR, markPathData, markTransform,
  pinFontSizeOf, pinNumberCentre, pinPathData, strokeWidthOf,
} from './render'
import { figureUnit } from './scale'
import { lightMarkup, type NamedSpot } from './spotlight'
import { plotBounds } from './plot'
import { thumbnailFromCanvas } from './annotation-thumb'

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
  const path = markPathData(mark, unit)
  const parts: string[] = []
  if (path !== undefined) {
    // Turned here exactly as the overlay turns it. `markPathData` knows nothing about
    // rotation, so without this the reader approved a tilted box and the agent was
    // shown an axis-aligned one on paper measured for the turned shape — while the
    // message beside it said "(rotated 45°)".
    const transform = markTransform(mark)
    const open = transform === undefined ? '' : `<g transform="${transform}">`
    parts.push(
      open,
      `<path d="${path}" fill="none" stroke="#ffffff" stroke-width="${strokeWidthOf(mark, unit) + 2.5 * unit}"`
      + ' stroke-linecap="round" stroke-linejoin="round"/>',
      `<path d="${path}" fill="none" stroke="${mark.color}" stroke-width="${strokeWidthOf(mark, unit)}"`
      + ' stroke-linecap="round" stroke-linejoin="round"/>',
      transform === undefined ? '' : '</g>',
    )
  }
  // A point mark has no stroke: it is the marker standing on its one coordinate.
  // Drawn from the same geometry the overlay uses, so the picture the agent gets and
  // the one the reader approved cannot disagree about where the mark is.
  const pin = mark.kind === 'point' ? pinPathData(mark, unit) : undefined
  const centre = mark.kind === 'point' ? pinNumberCentre(mark, unit) : undefined
  if (pin !== undefined && centre !== undefined) {
    // The same two strokes the overlay draws: a white disc under the pin so it reads
    // over dark line work, then the body. One stroke at 2×unit matched neither
    // constant, so the pins on the picture the agent got were thinner and blended
    // into the artwork they were standing on.
    parts.push(
      `<path d="${pin}" fill="#ffffff" stroke="#ffffff" stroke-width="${4.5 * unit}" stroke-linejoin="round"/>`,
      `<path d="${pin}" fill="${mark.color}" stroke="#ffffff" stroke-width="${1.5 * unit}" stroke-linejoin="round"/>`,
    )
    if (number !== undefined) {
      parts.push(
        `<text x="${centre[0]}" y="${centre[1]}" font-family="${PIN_FONT_FAMILY}"`
        + ` font-size="${pinFontSizeOf(unit)}" font-weight="700" fill="${PIN_NUMBER_COLOR}"`
        + ` text-anchor="middle" dominant-baseline="central">${number}</text>`,
      )
    }
  }
  return parts.join('')
}

/**
 * The figure layer as SVG elements.
 *
 * `lit` is the elements the review is about. An `element` mark draws nothing of its
 * own — it is the light on the element, and that light lives on the figure's own
 * markup, so it has to be written in here, where the figure is placed. The alternative
 * is a picture where the reader approved a glowing curve and the agent reads a
 * rectangle around it.
 *
 * @param layer - the figure to place.
 * @param lit - the elements to light and their colours, already resolved from the marks.
 * @returns the figure's elements.
 */
function figureSvg(layer: FigureLayer, lit: readonly NamedSpot[] = []): string {
  if (layer.kind === 'raster') {
    return `<image x="0" y="0" width="${layer.width}" height="${layer.height}" href="${layer.dataUrl}"/>`
  }
  // Keep the sanitized root itself. Visio declares xmlns:v here and uses v:*
  // throughout its descendants. Stripping this tag produced an unbound prefix,
  // so the standalone review failed to decode before it could be sent. The root
  // also owns inherited presentation (class/style/xml:space), which the preview
  // kept and the old export silently discarded.
  const litMarkup = lightMarkup(layer.markup, lit)
  const root = new DOMParser().parseFromString(litMarkup, 'image/svg+xml').documentElement
  root.setAttribute('x', '0')
  root.setAttribute('y', '0')
  root.setAttribute('width', String(layer.width))
  root.setAttribute('height', String(layer.height))
  if (layer.viewBox !== undefined) root.setAttribute('viewBox', layer.viewBox)
  root.setAttribute('preserveAspectRatio', 'xMidYMid meet')
  return new XMLSerializer().serializeToString(root)
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
  // The document's numbers win: this picture may be a page of a longer document,
  // whose pins have to carry the document's count rather than this slice's.
  const numbers = new Map([...markOrdinals(marks), ...(numbering ?? [])])
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
  // Every element mark names one element, and the picture has to say which of them the
  // review is about the same way the panel did: by lighting them.
  const lit: NamedSpot[] = marks.flatMap((mark): NamedSpot[] => {
    const selector = mark.kind === 'element' ? mark.anchor?.selector : undefined
    return selector === undefined ? [] : [{ selector, colour: mark.color }]
  })
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"`
    + ` width="${paper.width}" height="${paper.height}" viewBox="0 0 ${paper.width} ${paper.height}">`
    + `<rect x="0" y="0" width="${paper.width}" height="${paper.height}" fill="#ffffff"/>`
    + `<g transform="${shift}">`
    + figureSvg(layer, lit)
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

/** The live-page pieces a screenshot review is composed from. */
export interface LiveScreenshotSource {
  /** The page's PNG, covering the whole document. */
  readonly imageDataUrl: string
  /** The document's laid-out size. */
  readonly documentWidth: number
  readonly documentHeight: number
  /** The document rectangle covered by the PNG. */
  readonly imageRect: readonly [number, number, number, number]
  /** The visible frame, which becomes the review image. */
  readonly viewportWidth: number
  readonly viewportHeight: number
  /** The scroll offset the frame was at when the picture was taken. */
  readonly scrollX: number
  readonly scrollY: number
}

/**
 * Draw one element mark as the basic outline the live page showed.
 *
 * A file-backed element mark is drawn as a glow on the element. That glow belongs
 * to the page's own markup; once the page has become a PNG, the only honest line
 * is the same box the live overlay drew. The faint fill keeps the words beneath it
 * legible while making the selected area obvious at a glance.
 * @param mark - the element mark to outline.
 * @param unit - the screenshot's size multiple.
 * @returns the outline and its white separator.
 */
function elementMarkSvg(mark: AnnotationMark, unit: number): string {
  const [first, second] = mark.points
  if (first === undefined || second === undefined) return ''
  const x = Math.min(first[0], second[0])
  const y = Math.min(first[1], second[1])
  const width = Math.abs(second[0] - first[0])
  const height = Math.abs(second[1] - first[1])
  const radius = 2 * unit
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}"`
    + ` fill="${mark.color}" fill-opacity="0.07" stroke="#ffffff" stroke-width="${3.5 * unit}"/>`
    + `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}"`
    + ` fill="none" stroke="${mark.color}" stroke-width="${1.5 * unit}"/>`
}

/**
 * Compose the current live viewport as a review image.
 *
 * The page supplies one screenshot of its whole document. This function places it
 * under one clipping window, translates it to the current scroll, and draws the
 * page's own marks over it. The result is exactly what the reader saw and what the
 * agent needs: the current state of the page, its boxes, and no DSH chrome.
 * @param source - the screenshot and the window it was taken through.
 * @param marks - marks already limited to the page's current surface.
 * @returns standalone SVG markup.
 */
export function composeLiveScreenshotSvg(
  source: LiveScreenshotSource,
  marks: readonly AnnotationMark[],
): string {
  const width = Math.max(1, source.viewportWidth)
  const height = Math.max(1, source.viewportHeight)
  const unit = figureUnit(width, height)
  const numbers = markOrdinals(marks)
  const shifted = `translate(${-source.scrollX} ${-source.scrollY})`
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"`
    + ` width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`
    + '<defs><clipPath id="dsh-live-viewport"><rect x="0" y="0"'
    + ` width="${width}" height="${height}"/></clipPath></defs>`
    + '<rect x="0" y="0" width="100%" height="100%" fill="#ffffff"/>'
    + '<g clip-path="url(#dsh-live-viewport)">'
    + `<g transform="${shifted}">`
    + `<image x="${source.imageRect[0]}" y="${source.imageRect[1]}"`
    + ` width="${source.imageRect[2]}" height="${source.imageRect[3]}"`
    + ` preserveAspectRatio="none" href="${source.imageDataUrl}"/>`
    + marks.map(mark => mark.kind === 'element'
      ? elementMarkSvg(mark, unit)
      : markSvg(mark, numbers.get(mark.id), unit)).join('')
    + '</g></g></svg>'
}

/** The two pictures one live review needs from a single raster pass. */
export interface RasterizedReview {
  /** Full-size PNG sent to the session. */
  readonly image: Blob
  /** Card-sized WebP, when the browser can encode it. */
  readonly thumb?: string | undefined
}

/**
 * Rasterize one review SVG and optionally its attachment thumbnail.
 * @param svg - standalone SVG markup.
 * @param width - output width in pixels.
 * @param height - output height in pixels.
 * @param scale - device scale applied to the output size.
 * @param withThumb - whether the same canvas should also yield a card picture.
 * @returns the PNG blob and, when requested, its thumbnail.
 * @throws {Error} when the SVG cannot be decoded into an image.
 */
export async function rasterizePngWithThumb(
  svg: string,
  width: number,
  height: number,
  scale: number,
  withThumb = false,
): Promise<RasterizedReview> {
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
    return {
      image: blob,
      ...(withThumb
        ? { thumb: thumbnailFromCanvas(canvas, canvas.width, canvas.height) }
        : {}),
    }
  } finally {
    URL.revokeObjectURL(url)
  }
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
  return (await rasterizePngWithThumb(svg, width, height, scale)).image
}
