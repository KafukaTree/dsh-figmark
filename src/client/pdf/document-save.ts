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
import { groupByPage, markedPages, type MarksByPage } from './page-marks'
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
    /** "that one is in the composer" line. */
    readonly composedOne: string
    /** "it was sent" line. */
    readonly sent: string
    /** "that one was sent" line. */
    readonly sentOne: string
    /** "clearing failed" prefix. */
    readonly clearFailed: string
  }
  /** The document's state after a clear. */
  readonly cleared: () => void
  /**
   * Take one mark out of the document, leaving the rest.
   *
   * A per-mark hand-off delivers one mark, so the document keeps the others — and
   * the sidecar has to follow, which it does on its own: dropping the mark changes
   * what the next collect describes, and the background writer reconciles disk with
   * that. The one thing it cannot know is that the disk now holds a document of one
   * mark rather than of all of them, so the caller forgets the written signature
   * first, and the next pass writes the survivors instead of skipping them.
   * @param id - the mark that was delivered.
   */
  readonly dropped: (id: string) => void
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
 * Write and hand off the document, or one mark of it, and clear what was sent.
 *
 * What is cleared follows what was sent. A whole-document hand-off has delivered
 * everything the sidecar described, so the sidecars go and the document empties. A
 * hand-off of one mark has delivered that mark only, so that mark leaves the
 * document and everything else stays — along with the rest of the reader's work,
 * which they cannot see from the pill they pressed.
 *
 * @param context - the document being saved.
 * @param target - who receives the annotation.
 * @param only - the single mark being sent, or undefined to send the document.
 */
export async function saveAndDeliver(
  context: SaveContext,
  target: DeliveryTarget,
  only?: AnnotationMark,
): Promise<void> {
  // The only enforcement point: the toolbar buttons stay clickable so this guard is
  // what decides, not a disabled attribute that hides the reason.
  const collected = context.collect()
  if (collected === null) {
    context.fail(context.copy.notReady)
    return
  }
  // One mark is sent as a document of one mark: the message, the sidecar and the
  // drawn copy all describe what is being sent, and each of them reads the marks
  // from this one input rather than consulting the document again.
  const input = only === undefined
    ? collected
    : { ...collected, marks: collected.marks.filter(mark => mark.id === only.id) }
  const { pdf, bytes } = context
  if (input.marks.length === 0 || pdf === null || bytes === undefined) return
  context.setBusy(true)
  context.say(target === 'agent' ? context.copy.sending : context.copy.composing)
  try {
    const pages = markedPages(groupByPage(input.marks))
    const annotatedPdf = await context.annotate(bytes, pdf, pages, context.figureUnit)
    const saved = await context.seat.save(context.address, input, annotatedPdf)
    context.autosave.cancel()
    context.autosave.markWritten(input)
    context.setCreatedAt(input.createdAt ?? new Date().toISOString())
    context.setStale(false)
    const pageImages = await context.review(pdf, pages)
    if (target === 'composer') {
      await context.seat.compose(input, saved, pageImages, annotatedPdf)
      context.say(only === undefined ? context.copy.composed : context.copy.composedOne)
    } else {
      const warnings = await context.seat.send(input, saved, pageImages, annotatedPdf)
      const delivered = only === undefined ? context.copy.sent : context.copy.sentOne
      context.say(`${delivered}${warnings.length === 0 ? '' : ` ${warnings.join(' ')}`}`)
    }
    if (only === undefined) {
      await discardDocument(context)
      return
    }
    // The sidecar on disk holds the one mark that was sent, so the survivors have to
    // be written back over it: left alone it would deliver that mark again on the
    // next open, under a document that no longer carries it. Forgetting what was
    // written is what makes that rewrite happen rather than look like a no-op, and
    // dropping the mark is what gives it the survivors to write — if there are none,
    // the same pass deletes the sidecar, which is the right end state for a
    // document whose last mark has been sent.
    context.autosave.forget()
    context.dropped(only.id)
  } catch (cause) {
    context.fail(`${context.copy.saveFailed}${messageOf(cause)}`)
  } finally {
    context.setBusy(false)
  }
}
