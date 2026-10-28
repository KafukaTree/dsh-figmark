/**
 * Turning a figure's bytes into the one value the panel draws from.
 *
 * A figure arrives as bytes, but the panel needs three different things depending on
 * what the bytes are: an SVG's sanitized markup and the viewBox the export renders
 * under, a raster's object URL for the `<img>` plus a `data:` URL for the export, or
 * a rendered document and the width it was rendered at. Written as three separate
 * pieces of state those produced combinations the rest of the component had to
 * defend against — a size with no layer, a URL with no bytes — so the decoding is one
 * function returning one value, and the states that cannot happen are not
 * representable.
 * @module dsh-figmark/client/annotator/figure-source
 */
import { bytesToDataUrl, type FigureLayer } from '../export'
import { figureSvgMarkup, parseFigureSvg, svgIntrinsicSize, svgViewBox } from '../figure-dom'
import { RENDER_WIDTH, buildRenderedDocument } from '../html-dom'

/**
 * The surface once its content is readable.
 *
 * One value rather than four pieces of state: a raster's own size only arrives
 * when the browser decodes it, and spread across separate `useState` calls that
 * produced combinations (a size with no layer, a URL with no bytes) the rest of
 * the component would have to defend against.
 */
export type LoadedFigure =
  | {
    readonly kind: 'svg'
    readonly width: number
    readonly height: number
    /** Sanitized markup, already sized and classed for both panel and export. */
    readonly markup: string
    /** The `viewBox` the export renders under. */
    readonly viewBox: string
  }
  | {
    readonly kind: 'raster'
    /** Object URL the `<img>` reads, owned until the effect is torn down. */
    readonly objectUrl: string
    /** `data:` URL the export embeds, which an object URL could not be. */
    readonly dataUrl: string
  }
  | {
    readonly kind: 'html'
    /** Width the document is rendered at, in figure pixels; marks are measured in it. */
    readonly width: number
    /** Complete document for the frame, drawing policy included. */
    readonly document: string
  }

/**
 * What decoding a figure's bytes produced.
 *
 * A given media type either decodes or is refused, and the refusal is a value rather
 * than a thrown error: a figure the reader cannot annotate is a sentence in the
 * panel, not a crash in the middle of a render.
 */
export type FigureDecoding =
  | { readonly figure: LoadedFigure; readonly failed?: undefined }
  | { readonly figure?: undefined; readonly failed: true }

/**
 * Decode one figure's bytes.
 *
 * The SVG's size and the panel class are baked into the markup it returns, so the
 * string the panel inlines and the string the export embeds are the same one — that
 * is what keeps a mark drawn on the panel landing on the same element in the picture
 * handed to the agent.
 * @param data - the file's own bytes.
 * @param mediaType - the media type the address named.
 * @returns the figure, or a refusal when the bytes are not a figure this panel reads.
 */
export function decodeFigure(data: Uint8Array<ArrayBuffer>, mediaType: string): FigureDecoding {
  if (mediaType === 'image/svg+xml') {
    const root = parseFigureSvg(new TextDecoder().decode(data))
    if (root === undefined) return { failed: true }
    const intrinsic = svgIntrinsicSize(root)
    root.setAttribute('width', String(intrinsic.width))
    root.setAttribute('height', String(intrinsic.height))
    root.classList.add('da-figure')
    return {
      figure: {
        kind: 'svg',
        width: intrinsic.width,
        height: intrinsic.height,
        markup: figureSvgMarkup(root),
        viewBox: svgViewBox(root, intrinsic),
      },
    }
  }
  if (mediaType === 'text/html') {
    return {
      figure: {
        kind: 'html',
        width: RENDER_WIDTH,
        document: buildRenderedDocument(new TextDecoder().decode(data)),
      },
    }
  }
  const objectUrl = URL.createObjectURL(new Blob([data], { type: mediaType }))
  return { figure: { kind: 'raster', objectUrl, dataUrl: bytesToDataUrl(data, mediaType) } }
}

/**
 * The surface's measurable size, or null until its content and dimensions are both
 * known.
 *
 * A rendered document is measurable as soon as its width is — the frame reports how
 * tall its content is, and until it does the surface has no height.
 * @param figure - the decoded figure, or null before there is one.
 * @param rasterSize - the size the browser decoded a raster at, or null until it has.
 * @param htmlHeight - the height a rendered document's frame reported.
 * @returns the surface's size, or null.
 */
export function figureSize(
  figure: LoadedFigure | null,
  rasterSize: { readonly width: number; readonly height: number } | null,
  htmlHeight: number,
): { readonly width: number; readonly height: number } | null {
  if (figure === null) return null
  if (figure.kind === 'svg') return { width: figure.width, height: figure.height }
  if (figure.kind === 'html') return { width: figure.width, height: htmlHeight }
  return rasterSize
}

/**
 * The picture this surface can be exported as, when it can be one at all.
 *
 * A rendered document has no layer: the browser cannot turn a live document into a
 * picture, so that surface's marks travel as the marks file alone. A raster has no
 * size until the browser has decoded it, and a layer without a size is not a layer.
 * @param figure - the decoded figure, or null before there is one.
 * @param rasterSize - the size the browser decoded a raster at, or null until it has.
 * @returns the layer to compose a review image from, or null when there is none.
 */
export function figureLayer(
  figure: LoadedFigure | null,
  rasterSize: { readonly width: number; readonly height: number } | null,
): FigureLayer | null {
  if (figure === null) return null
  if (figure.kind === 'svg') {
    return {
      kind: 'svg',
      markup: figure.markup,
      width: figure.width,
      height: figure.height,
      viewBox: figure.viewBox,
    }
  }
  if (figure.kind === 'html') return null
  if (rasterSize === null) return null
  return { kind: 'raster', dataUrl: figure.dataUrl, width: rasterSize.width, height: rasterSize.height }
}
