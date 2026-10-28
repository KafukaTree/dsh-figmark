/**
 * One document's marks, filed by the page they were drawn on.
 *
 * A PDF is one annotation for the whole document, but the pane shows one page at a
 * time, so every read and every write crosses the boundary between "the marks of
 * this document" and "the marks of the page on screen". That translation is the only
 * thing this module does: a flat list becomes a map, the map becomes the marked
 * pages in order, and the map becomes the flat list again with each mark stamped with
 * the page it belongs to.
 * @module dsh-figmark/client/pdf/page-marks
 */
import type { AnnotationMark } from '../../shared/annotation'
import type { PagedAnnotationInput } from '../document-seat'

/** One page's marks, keyed by 1-based page number. */
export type MarksByPage = ReadonlyMap<number, readonly AnnotationMark[]>

/** One marked page, with the marks it carries. */
export interface MarkedPage {
  /** 1-based page number. */
  readonly page: number
  /** The marks drawn on it. */
  readonly marks: readonly AnnotationMark[]
}

/**
 * Group one document's marks by the page they belong to.
 * @param marks - every mark of the document.
 * @returns the marks of each page; a mark without a page is on page 1.
 */
export function groupByPage(marks: readonly AnnotationMark[]): MarksByPage {
  const grouped = new Map<number, readonly AnnotationMark[]>()
  for (const mark of marks) {
    const page = mark.page ?? 1
    grouped.set(page, [...(grouped.get(page) ?? []), mark])
  }
  return grouped
}

/**
 * The pages that carry at least one mark.
 * @param marks - every page's marks.
 * @returns the marked pages, ascending, each with its own marks.
 */
export function markedPages(marks: MarksByPage): MarkedPage[] {
  return [...marks.entries()]
    .filter(([, pageMarks]) => pageMarks.length > 0)
    .sort(([left], [right]) => left - right)
    .map(([page, pageMarks]) => ({ page, marks: pageMarks }))
}

/**
 * Every mark, in page then draw order, each stamped with the page it is on.
 *
 * The page is the document's own knowledge: a surface knows the marks it holds, not
 * which page it is mounted for, so the stamp is added here — once, where the whole
 * document is in view.
 *
 * @param marks - every page's marks.
 * @returns the flat list the sidecar and the delivery both carry.
 */
export function allMarks(marks: MarksByPage): AnnotationMark[] {
  return markedPages(marks).flatMap(entry => entry.marks.map(mark => ({ ...mark, page: entry.page })))
}

/**
 * The numbering the whole document shares.
 *
 * The list numbers marks across the document, so a page's pins continue the counting
 * rather than restarting it: "③" on page 2 has to be the third sentence.
 *
 * @param marks - every page's marks.
 * @returns each mark's number, in the order the list reads them.
 */
export function numberingOf(marks: MarksByPage): ReadonlyMap<string, number> {
  return new Map(allMarks(marks).map((mark, index) => [mark.id, index + 1]))
}

/**
 * Drop one mark from wherever in the document it was drawn.
 *
 * The list shows the whole file, so its delete button can name a mark on a page the
 * surface is not holding: the owner is the only one that knows every page.
 *
 * @param marks - every page's marks.
 * @param id - the mark to remove.
 * @returns the new map, or the same one when no page carried that mark.
 */
export function withoutMark(marks: MarksByPage, id: string): MarksByPage {
  let changed = false
  const next = new Map(marks)
  for (const [page, pageMarks] of marks) {
    const kept = pageMarks.filter(mark => mark.id !== id)
    if (kept.length !== pageMarks.length) {
      changed = true
      next.set(page, kept)
    }
  }
  return changed ? next : marks
}

/**
 * Keep one page's unsaved edits while another page is on screen.
 *
 * The same array is the same edits: storing it again would rebuild the map, re-render
 * the document, and let a talkative page report its way into a loop.
 *
 * @param marks - every page's marks.
 * @param page - the page the edits belong to.
 * @param edited - the page's marks as the surface reported them.
 * @returns the new map, or the same one when those edits are already stored.
 */
export function withPageMarks(
  marks: MarksByPage,
  page: number,
  edited: readonly AnnotationMark[],
): MarksByPage {
  if (marks.get(page) === edited) return marks
  return new Map(marks).set(page, edited)
}

/**
 * Everything one save persists, or null while the document is still unknown.
 *
 * @param figure - the document's own facts, or null before the Host answered.
 * @param pageCount - how many pages the document has.
 * @param address - the tab's resource address.
 * @param marks - every page's marks.
 * @param summary - the reader's note about the whole document.
 * @param createdAt - creation time of the document already on disk, when it was loaded.
 * @returns the writer's input, or null when the Host has not described the document yet.
 */
export function collectInput(
  figure: { readonly path: string; readonly mediaType: string; readonly sha256: string } | null,
  pageCount: number,
  address: string,
  marks: MarksByPage,
  summary: string,
  createdAt: string | null,
): PagedAnnotationInput | null {
  if (figure === null || pageCount < 1) return null
  return {
    figure: { address, ...figure, pageCount },
    marks: allMarks(marks),
    summary,
    createdAt,
  }
}
