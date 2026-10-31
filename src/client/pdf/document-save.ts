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
    /** Wait until a write already under way has finished. */
    readonly drained: () => Promise<void>
    /** Record what this save wrote. @param input - the annotation it persisted. */
    readonly markWritten: (input: PagedAnnotationInput) => void
    /** Forget what is on disk, so the next edit is written rather than skipped. */
    readonly forget: () => void
  }
  /** Report a failure. @param text - what went wrong. */
  readonly fail: (text: string) => void
  /** Say that a hand-off is under way, so the buttons report it. */
  readonly setBusy: (busy: boolean) => void
  /** The copy for the three outcomes of a hand-off. */
  readonly copy: {
    /** "there is nothing marked yet" line. */
    readonly nothingToSend: string
    /** "save failed" prefix. */
    readonly saveFailed: string
    /** "the document is not ready" line. */
    readonly notReady: string
    /** "clearing failed" prefix. */
    readonly clearFailed: string
  }
  /** The document's state after a clear. */
  readonly cleared: () => void
  /**
   * Remove exactly the marks a hand-off carried, then report whether work remains.
   *
   * The reader can keep drawing while the session is answering. Removing every mark
   * that happens to exist when the answer arrives would erase that newer work; this
   * removes the snapshot that actually travelled instead.
   *
   * @param ids - ids in the delivered snapshot.
   * @param sentSummary - the document note in that snapshot.
   * @param summaryDelivered - whether that note travelled as part of this hand-off.
   */
  readonly delivered: (
    ids: ReadonlySet<string>,
    sentSummary: string,
    summaryDelivered: boolean,
  ) => void
  /** Creation time of the document this save produced. @param at - its timestamp. */
  readonly setCreatedAt: (at: string) => void
  /** Whether the file on disk is not the one the marks were drawn on. @param stale - new value. */
  readonly setStale: (stale: boolean) => void
}

/** A hand-off whose document, page model and bytes are all ready to travel. */
export interface PreparedDelivery {
  /** Exactly the snapshot the card stands for. */
  readonly input: PagedAnnotationInput
  /** Whether this snapshot is the document, rather than one mark from its pill. */
  readonly whole: boolean
  /** The parsed document those bytes came from. */
  readonly pdf: PdfDocument
  /** The original bytes the annotated copy is written into. */
  readonly bytes: Uint8Array<ArrayBuffer>
}

/** What a hand-off can be before its work starts. */
export type DeliveryPreparation =
  | { readonly kind: 'ready'; readonly value: PreparedDelivery }
  | { readonly kind: 'not-ready' }
  | { readonly kind: 'nothing' }

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
  await context.autosave.drained()
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
 * @param only - the single mark being sent, or undefined to send the document.
 * @returns the ready snapshot, or why there is none.
 */
export function prepareDelivery(context: SaveContext, only?: AnnotationMark): DeliveryPreparation {
  // The only enforcement point: the toolbar buttons stay clickable so this guard is
  // what decides, not a disabled attribute that hides the reason — and "decides" has
  // to mean "answers", or a live button that drops its press reads as a broken one.
  const collected = context.collect()
  if (collected === null) return { kind: 'not-ready' }
  // One mark is sent as a document of one mark: the message, the sidecar and the
  // drawn copy all describe what is being sent, and each of them reads the marks
  // from this one input rather than consulting the document again.
  const input = only === undefined
    ? collected
    : { ...collected, marks: collected.marks.filter(mark => mark.id === only.id) }
  if (input.marks.length === 0) return { kind: 'nothing' }
  // A collected document always has both: `collectInput` answers null unless the figure
  // and its page count are known, and the page count is read off this same `pdf`, which
  // came from these same `bytes`. The guard is kept because the compiler cannot follow
  // that argument, and it is narrowed to what it means: these two are known here.
  /* v8 ignore start -- a collected document always carries both, for the reason above. */
  const { pdf, bytes } = context
  if (pdf === null || bytes === undefined) return { kind: 'not-ready' }
  /* v8 ignore stop */
  return { kind: 'ready', value: { input, whole: only === undefined, pdf, bytes } }
}

/**
 * Write and hand off one prepared snapshot.
 *
 * Failures are thrown rather than painted here: the caller owns the send card, and
 * that card can only show its retry button when the same task rejects.
 */
export async function saveAndDeliver(
  context: SaveContext,
  target: DeliveryTarget,
  prepared: PreparedDelivery,
): Promise<readonly string[]> {
  context.setBusy(true)
  const outcome = await writePrepared(context, target, prepared).then(
    value => ({ ok: true as const, value }),
    (cause: unknown) => ({ ok: false as const, cause }),
  )
  context.setBusy(false)
  if (!outcome.ok) {
    throw new Error(`${context.copy.saveFailed}${messageOf(outcome.cause)}`)
  }
  return outcome.value
}

/**
 * Write one prepared snapshot and update the document afterwards.
 *
 * Kept apart from the busy flag so a rejection has one unwind point: the
 * public function turns the promise into either its warnings or the sentence
 * the retryable toast card shows.
 */
async function writePrepared(
  context: SaveContext,
  target: DeliveryTarget,
  prepared: PreparedDelivery,
): Promise<readonly string[]> {
  const { input, whole, pdf, bytes } = prepared
  const pages = markedPages(groupByPage(input.marks))
  const annotatedPdf = await context.annotate(bytes, pdf, pages, context.figureUnit)
  const saved = await context.seat.save(context.address, input, annotatedPdf)
  context.autosave.cancel()
  context.autosave.markWritten(input)
  context.setCreatedAt(input.createdAt ?? new Date().toISOString())
  context.setStale(false)
  const pageImages = await context.review(pdf, pages)
  if (target === 'composer') {
      await context.seat.compose(input, saved, pageImages)
  } else {
      const warnings = await context.seat.send(input, saved, pageImages)
    if (whole) {
      const sentIds = new Set(input.marks.map(mark => mark.id))
      const sentSummary = input.summary
      // Stop the writer before retiring the snapshot it was describing. A write that
      // is already on the wire has to finish first, or it can put the old sidecar
      // back after the delete.
      context.autosave.cancel()
      await context.autosave.drained()
      try {
        await context.seat.discard(context.address)
      } catch (cause) {
        context.fail(`${context.copy.clearFailed}${messageOf(cause)}`)
      }
      // Keep the delivered snapshot as the last written signature. The surviving
      // state now differs from it, so the normal edit effect writes the survivors —
      // while an empty survivor set becomes the usual delete rather than a stale file.
      context.delivered(sentIds, sentSummary, true)
      return warnings
    }
    // The sidecar on disk holds the one mark that was sent, so the survivors have to
    // be written back over it: left alone it would deliver that mark again on the
    // next open, under a document that no longer carries it. Forgetting what was
    // written is what makes that rewrite happen rather than look like a no-op, and
    // dropping the mark is what gives it the survivors to write — if there are none,
    // the same pass deletes the sidecar, which is the right end state for a
    // document whose last mark has been sent.
    context.autosave.cancel()
    await context.autosave.drained()
    context.delivered(new Set(input.marks.map(mark => mark.id)), input.summary, false)
    return warnings
  }
  // A draft is not a delivery: clear only the snapshot that was parked. A
  // whole-document draft was this document's full snapshot, so its marks and note
  // leave; a one-mark draft leaves every other page where it was.
  const ids = new Set(input.marks.map(mark => mark.id))
  context.autosave.cancel()
  await context.autosave.drained()
  if (whole) {
    try {
      await context.seat.discard(context.address)
    } catch (cause) {
      context.fail(`${context.copy.clearFailed}${messageOf(cause)}`)
    }
  }
  context.delivered(ids, input.summary, whole)
  return []
}
