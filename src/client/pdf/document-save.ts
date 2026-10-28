/**
 * The document's one save, its one clear, and its one delivery.
 *
 * A paged document's marks are written as one annotation and delivered as one
 * message, and neither path rewrites the PDF the reader opened: the marks land in
 * `<name>.annot.json` and a derived `<name>.annotated.pdf` beside it. Once either has
 * been done the sidecars have served their purpose, so they are deleted and the surface
 * cleared — keeping them would hand the reader the same work to send twice, and a
 * sidecar left on disk is what brought a deleted annotation back on the next open.
 *
 * Written as plain functions over an explicit context rather than as a hook: the
 * sequence is a transaction, and the order of its steps is the thing worth reading.
 * @module dsh-figmark/client/pdf/document-save
 */
import type { AnnotationMark } from '../../shared/annotation'
import type { DocumentSeat, PageImage, PagedAnnotationInput } from '../document-seat'
import { markedPages, type MarksByPage } from './page-marks'
import type { PdfDocument } from './runtime'

/** Where a hand-off goes. */
export type DeliveryTarget = 'agent' | 'composer'

/** Everything the save, the clear and the delivery act through. */
export interface SaveContext {
  /** The tab's resource address. */
  readonly address: string
  /** The open document, or null before it opened. */
  readonly pdf: PdfDocument | null
  /** The document's bytes, for the annotated copy. */
  readonly bytes: Uint8Array<ArrayBuffer> | undefined
  /** Every page's marks. */
  readonly marks: MarksByPage
  /** Everything one save persists, or null while the document is still unknown. */
  readonly collect: () => PagedAnnotationInput | null
  /** The seat the read, save and delivery go through. */
  readonly seat: DocumentSeat
  /** The size multiple a page of this size draws its marks at. */
  readonly figureUnit: (width: number, height: number) => number
  /** Write every marked page into a copy of the document. */
  readonly annotate: (
    bytes: Uint8Array<ArrayBuffer>,
    pdf: PdfDocument,
    pages: readonly { readonly page: number; readonly marks: readonly AnnotationMark[] }[],
    unitOf: (width: number, height: number) => number,
  ) => Promise<Uint8Array>
  /** Render the marked pages for the session. */
  readonly review: (
    pdf: PdfDocument,
    pages: readonly { readonly page: number; readonly marks: readonly AnnotationMark[] }[],
  ) => Promise<PageImage[]>
  /** The background writer, whose pending write must not race this save. */
  readonly autosave: {
    /** Drop a pending write. */
    readonly cancel: () => void
    /** Record what this save wrote. @param input - the annotation it persisted. */
    readonly markWritten: (input: PagedAnnotationInput) => void
    /** Forget what is on disk, so the next edit is written rather than skipped. */
    readonly forget: () => void
  }
  /** Report a status line. @param text - what to say. */
  readonly say: (text: string) => void
  /** Report a failure. @param text - what went wrong. */
  readonly fail: (text: string) => void
  /** Say that a hand-off is under way, so the buttons report it. */
  readonly setBusy: (busy: boolean) => void
  /** The copy for the three outcomes of a hand-off. */
  readonly copy: {
    /** "save failed" prefix. */
    readonly saveFailed: string
    /** "the document is not ready" line. */
    readonly notReady: string
    /** "sending to the agent" line. */
    readonly sending: string
    /** "putting it in the composer" line. */
    readonly composing: string
    /** "it is in the composer" line. */
    readonly composed: string
    /** "it was sent" line. */
    readonly sent: string
    /** "clearing failed" prefix. */
    readonly clearFailed: string
  }
  /** The document's state after a clear. */
  readonly cleared: () => void
  /** Creation time of the document this save produced. @param at - its timestamp. */
  readonly setCreatedAt: (at: string) => void
  /** Whether the file on disk is not the one the marks were drawn on. @param stale - new value. */
  readonly setStale: (stale: boolean) => void
}

/**
 * The text of a failure, whether it was an `Error` or not.
 * @param cause - whatever was thrown.
 * @returns its message.
 */
export function messageOf(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause)
}

/**
 * Forget the document's annotation, on screen and on disk.
 *
 * The in-memory state is dropped even when the Host refuses, because the marks are
 * gone from this session either way; the failure is reported rather than hidden, since
 * a surviving sidecar reappears on the next open.
 *
 * @param context - the document being cleared.
 */
export async function discardDocument(context: SaveContext): Promise<void> {
  // A write that is still waiting would put the sidecar back the moment it ran.
  context.autosave.cancel()
  context.autosave.forget()
  try {
    await context.seat.discard(context.address)
  } catch (cause) {
    context.fail(`${context.copy.clearFailed}${messageOf(cause)}`)
  }
  context.cleared()
}

/**
 * Save the document's annotation and hand it to the agent, or into the draft.
 *
 * @param context - the document being saved.
 * @param target - who receives the annotation.
 */
export async function saveAndDeliver(context: SaveContext, target: DeliveryTarget): Promise<void> {
  // The only enforcement point: the toolbar buttons stay clickable so this guard is
  // what decides, not a disabled attribute that hides the reason.
  const input = context.collect()
  if (input === null) {
    context.fail(context.copy.notReady)
    return
  }
  const { pdf, bytes } = context
  if (input.marks.length === 0 || pdf === null || bytes === undefined) return
  context.setBusy(true)
  context.say(target === 'agent' ? context.copy.sending : context.copy.composing)
  try {
    const pages = markedPages(context.marks)
    const annotatedPdf = await context.annotate(bytes, pdf, pages, context.figureUnit)
    const saved = await context.seat.save(context.address, input, annotatedPdf)
    context.autosave.cancel()
    context.autosave.markWritten(input)
    context.setCreatedAt(input.createdAt ?? new Date().toISOString())
    context.setStale(false)
    const pageImages = await context.review(pdf, pages)
    if (target === 'composer') {
      await context.seat.compose(input, saved, pageImages, annotatedPdf)
      context.say(context.copy.composed)
      await discardDocument(context)
      return
    }
    const warnings = await context.seat.send(input, saved, pageImages, annotatedPdf)
    const text = `${context.copy.sent}${warnings.length === 0 ? '' : ` ${warnings.join(' ')}`}`
    context.say(text)
    await discardDocument(context)
  } catch (cause) {
    context.fail(`${context.copy.saveFailed}${messageOf(cause)}`)
  } finally {
    context.setBusy(false)
  }
}
