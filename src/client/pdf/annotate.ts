/**
 * Writing the user's marks into the document as native PDF annotations.
 *
 * The saved document is the original with the marks added, never a picture of the
 * page: an arrow becomes a `/Line`, a box a `/Square`, an ellipse a `/Circle`, a
 * freehand stroke an `/Ink`, and a text note a `/Text`. Each one carries the note as
 * `/Contents` and an appearance stream drawn from the geometry the reader actually
 * drew, so a reader shows exactly what the user drew instead of guessing a default.
 *
 * A paged document's marks are measured in page units, and `pdf.js` answers the
 * transform from PDF user space to those units for each page — so a page that is
 * rotated, scaled by `/UserUnit`, or whose media box does not start at the origin
 * still lands where the user drew it.
 *
 * This module is the writer's entry, and nothing more: the arithmetic lives in
 * `./coords`, the shape geometry in `./geometry`, the appearance streams in
 * `./appearance` and the annotation dictionary in `./annotation`. What is left here
 * is the one loop over pages plus the document-level validation that has to happen
 * before anything is appended.
 * @module dsh-figmark/client/pdf/annotate
 */
import { PDFArray, PDFDocument, PDFName, type PDFContext, type PDFPage } from 'pdf-lib'
import type { AnnotationMark } from '../../shared/annotation'
import { annotation } from './annotation'

/** One page's marks, and the transform that maps PDF user space to page units. */
export interface PageAnnotateInput {
  /** 1-based page number. */
  readonly page: number
  /**
   * `pdf.js` viewport transform at scale 1, as `[a b c d e f]`: a user-space point
   * `(x, y)` is at `(a·x + c·y + e, b·x + d·y + f)` in page units.
   */
  readonly transform: readonly number[]
  /** Marks drawn on this page, in page units. */
  readonly marks: readonly AnnotationMark[]
  /**
   * The page's size multiple, so the pen is the one the reader saw on screen.
   *
   * Absent means 1, which is what every exported page looked like before the size
   * of a mark followed the size of the figure.
   */
  readonly unit?: number
}

export { toUserSpace, unitScale } from './coords'

/**
 * Append the annotations of every page to a copy of the document.
 *
 * Annotations travel in each page's own `/Annots`, appended after whatever the
 * document already carried: a file someone else annotated stays annotated, and
 * saving twice writes the same annotations once because every save starts from the
 * original bytes.
 *
 * @param bytes - the original document.
 * @param pages - the marks of each annotated page.
 * @returns the annotated document.
 * @throws {Error} when a page number is outside the document, or a transform is degenerate.
 */
export async function annotatePdf(bytes: Uint8Array, pages: readonly PageAnnotateInput[]): Promise<Uint8Array> {
  const document = await PDFDocument.load(bytes)
  const count = document.getPageCount()
  // Validated before anything is written: a page number this document does not have
  // is a caller's mistake, and a half-annotated save is worse than a refused one.
  for (const input of pages) {
    if (input.page < 1 || input.page > count) {
      throw new Error(`page ${input.page} is outside this ${count}-page document`)
    }
  }
  for (const input of pages) {
    const page = document.getPage(input.page - 1)
    if (input.marks.length === 0) continue
    const annots = pageAnnots(document.context, page)
    const unit = input.unit ?? 1
    for (const mark of input.marks) {
      annots.push(document.context.register(annotation(document.context, mark, input.transform, unit)))
    }
  }
  return await document.save()
}

/** One page's annotation array, created when the page carries none yet. */
function pageAnnots(context: PDFContext, page: PDFPage): PDFArray {
  const existing = page.node.Annots()
  if (existing !== undefined) return existing
  const created = PDFArray.withContext(context)
  page.node.set(PDFName.of('Annots'), created)
  return created
}
