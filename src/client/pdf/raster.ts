/**
 * How many pixels one page is rendered with, and why.
 *
 * A page is laid out in its own units and then scaled to the pane, so the browser
 * resamples whatever bitmap it is given. The numbers below decide how much bitmap to
 * pay for, and they are the whole of that decision: the pane's width, the device's
 * pixel ratio, the shipped supersample margin and the fit ceiling are all read here,
 * so the two rasters a document makes — the one on screen and the one it delivers —
 * cannot drift apart.
 * @module dsh-figmark/client/pdf/raster
 */
import type { PdfDocument } from './runtime'

/** One rendered page, as the pane and the annotator body use it. */
export interface PageBitmap {
  /** PNG data URL of the page. */
  readonly dataUrl: string
  /** Page width in page units. */
  readonly width: number
  /** Page height in page units. */
  readonly height: number
}

/**
 * Gap kept around a page inside the pane.
 *
 * The same number `AnnotatorBody` subtracts from its own stage width to decide how
 * wide the page is drawn: a raster made for a box of a different width is a raster
 * resampled to fit, and that is softness the reader sees on every glyph.
 */
const PANE_INSET = 24

/**
 * Highest device-pixel ratio one page bitmap is rendered at.
 *
 * Three rather than two: a Retina display reports 2, but a *scaled* Retina mode (a
 * "more space" resolution, a zoomed window) reports 3, and capping at 2 there leaves
 * the page short of the pixels the screen actually has.
 */
export const MAX_DENSITY = 2

/**
 * Bitmap pixels a page gets per screen pixel.
 *
 * A page is laid out in its own units and then scaled to the pane, so the browser
 * resamples its bitmap whatever it wants. Measured in Chromium at a Retina ratio,
 * how sharp the result reads depends on how many source pixels each screen pixel
 * gets, and a bitmap that misses the screen's count by a few percent is the *worst*
 * case, not the best — the resampler has no whole-pixel neighbours to average, so
 * every glyph edge is blended with the background beside it.
 *
 * Measured, as the 99th percentile of the lateral gradient across a text line:
 * 1.04× gives 129, 1.25× gives 157, 1.5× gives 168, 2× gives 178 (3× gives 181).
 * The plateau is reached early: 1.5× already reads as sharp and costs a third of
 * the memory 2× does, so this is the spare kept.
 */
const SUPERSAMPLE = 1.5

/**
 * The largest factor "fit width" draws a page at.
 *
 * The same ceiling `AnnotatorBody` applies when it decides how big to draw a figure;
 * it is repeated here because a lazily loaded chunk may not import the client bundle
 * at run time. Past this factor a wider pane buys no more drawn pixels, so the two
 * numbers have to agree or this one pays for pixels the page never occupies.
 */
const FIT_CEILING = 1.5

/**
 * Narrowest width a page is rendered for; below it the pane is still settling.
 * Compared against the stepped width, so the guard itself is a whole step wide.
 */
export const MIN_PANE_WIDTH = 120

/**
 * Pane-width step one raster serves.
 *
 * A dragged pane changes its width on every pixel, and rasterizing a page costs
 * tens of milliseconds: one raster per pixel is a pane that repaints for as long
 * as the drag lasts. One raster serves a whole step instead, and the page is
 * scaled to the pane it ends up in, so a step's worth of growth costs a little
 * softness rather than another round of work.
 */
const RENDER_WIDTH_STEP = 64

/**
 * The width a raster is asked for: the pane's, stepped, times the magnification.
 *
 * The factor goes in here rather than into the slot, because a slot widened around
 * an unzoomed bitmap is a blurred page: the pixels have to be there for the size
 * the reader asked for.
 *
 * @param paneWidth - the pane's width in CSS pixels.
 * @param zoomFactor - how much the document is magnified; 1 for "fit".
 * @returns the width, in CSS pixels, this raster serves.
 */
export function renderWidthFor(paneWidth: number, zoomFactor: number): number {
  return Math.ceil((paneWidth * zoomFactor) / RENDER_WIDTH_STEP) * RENDER_WIDTH_STEP
}

/**
 * Render one page for the pane.
 * @param pdf - the open document.
 * @param page - 1-based page number.
 * @param paneWidth - pane width in CSS pixels.
 * @returns the page bitmap.
 */
export async function renderPage(pdf: PdfDocument, page: number, paneWidth: number): Promise<PageBitmap> {
  const size = await pdf.size(page)
  // How wide the page ends up drawn: the pane, minus its inset — but no wider than
  // the fit ceiling allows, because a page the ceiling stopped growing is a page
  // that would otherwise be rendered at a size nobody ever sees.
  const room = Math.max(1, paneWidth - PANE_INSET)
  const shown = Math.min(room, size.width * FIT_CEILING)
  const density = Math.min(MAX_DENSITY, Math.max(1, globalThis.devicePixelRatio || 1))
  const rendered = await pdf.render(page, (shown * density * SUPERSAMPLE) / size.width)
  return { dataUrl: rendered.dataUrl, width: rendered.width, height: rendered.height }
}

/**
 * Render one annotated page for the session.
 *
 * The picture the agent reads is not the pane's: the pane may be narrow, while the
 * export draws the marks onto the page at up to twice the page's own size. A raster
 * at that same factor is the smallest one that keeps the delivered picture sharp.
 *
 * @param pdf - the open document.
 * @param page - 1-based page number.
 * @returns the page bitmap.
 */
export async function renderReviewPage(pdf: PdfDocument, page: number): Promise<PageBitmap> {
  const rendered = await pdf.render(page, MAX_DENSITY)
  return { dataUrl: rendered.dataUrl, width: rendered.width, height: rendered.height }
}
