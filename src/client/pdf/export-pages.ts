/**
 * What one save produces: the annotated document, and a picture of every marked page.
 *
 * Both are derived from the same pair of inputs — the document's bytes and the pages
 * that carry marks — and both are built by walking those pages in order. Keeping them
 * together is what makes "the agent's picture and the saved document describe the same
 * pages" a property of one module instead of a convention two call sites keep.
 * @module dsh-figmark/client/pdf/export-pages
 */
import type { PageImage } from '../document-seat'
import { annotatePdf, type PageAnnotateInput } from './annotate'
import type { MarkedPage } from './page-marks'
import { renderReviewPage } from './raster'
import type { PdfDocument } from './runtime'

/**
 * Build the writer's input for every marked page.
 * @param pdf - the open document.
 * @param pages - the marked pages.
 * @param unitOf - the size multiple a page of this size draws its marks at.
 * @returns one input per page, each with its marks and its user-space transform.
 */
export async function annotateInputs(
  pdf: PdfDocument,
  pages: readonly MarkedPage[],
  unitOf: (width: number, height: number) => number,
): Promise<PageAnnotateInput[]> {
  const inputs: PageAnnotateInput[] = []
  for (const entry of pages) {
    const size = await pdf.size(entry.page)
    // The page's own size decides the pen, exactly as the figure's does on screen:
    // a 4000px-wide page needs a heavier stroke than a 300px one to read the same.
    inputs.push({
      page: entry.page,
      transform: size.transform,
      marks: entry.marks,
      unit: unitOf(size.width, size.height),
    })
  }
  return inputs
}

/**
 * Render the annotated pages for the session.
 * @param pdf - the open document.
 * @param pages - the marked pages.
 * @returns one raster per page, in page order.
 */
export async function reviewPages(pdf: PdfDocument, pages: readonly MarkedPage[]): Promise<PageImage[]> {
  const images: PageImage[] = []
  for (const entry of pages) {
    const rendered = await renderReviewPage(pdf, entry.page)
    images.push({ page: entry.page, dataUrl: rendered.dataUrl, width: rendered.width, height: rendered.height })
  }
  return images
}

/**
 * Write every marked page's marks into a copy of the document.
 * @param bytes - the original document.
 * @param pdf - the open document, for each page's transform.
 * @param pages - the marked pages.
 * @param unitOf - the size multiple a page of this size draws its marks at.
 * @returns the annotated document.
 */
export async function annotateDocument(
  bytes: Uint8Array,
  pdf: PdfDocument,
  pages: readonly MarkedPage[],
  unitOf: (width: number, height: number) => number,
): Promise<Uint8Array> {
  return await annotatePdf(bytes, await annotateInputs(pdf, pages, unitOf))
}
