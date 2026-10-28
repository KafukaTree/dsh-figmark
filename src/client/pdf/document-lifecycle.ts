/**
 * The document's own lifetime: the bytes it opened from, and the sidecar beside it.
 *
 * Two reads happen once per document — the PDF itself, and the marks file the Host
 * keeps beside it — and both can outlive the tab that asked for them. Keeping them in
 * one module is what makes "an answer that arrives after the tab moved on is released,
 * not painted" a rule with one implementation instead of two copies of a `live` flag.
 * @module dsh-figmark/client/pdf/document-lifecycle
 */
import { useEffect, useRef, useState } from 'react'
import type { DocumentSeat } from '../document-seat'
import { openPdf, type PdfDocument } from './runtime'

/** The Host's own facts about the document, before any marks are filed. */
export interface FigureFacts {
  /** Absolute path on the Host. */
  readonly path: string
  /** Media type of the document. */
  readonly mediaType: string
  /** Content hash of the document at read time. */
  readonly sha256: string
}

/**
 * Open the document the body was handed, and release it when the bytes change or the
 * body goes away.
 *
 * Opening can outlive the tab; the document it produced owns a worker and a Blob URL,
 * so an abandoned one is released rather than dropped. That is the whole reason this
 * read is a stateful effect rather than a memo.
 *
 * @param bytes - complete PDF bytes, or undefined while the owner has not delivered any.
 * @param onError - reports a failed open, already localized by the caller.
 * @returns the open document, or null until it opened.
 */
export function useOpenedDocument(
  bytes: Uint8Array<ArrayBuffer> | undefined,
  onError: (cause: unknown) => void,
): PdfDocument | null {
  const [pdf, setPdf] = useState<PdfDocument | null>(null)
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError
  useEffect(() => {
    if (bytes === undefined) return
    let live = true
    let opened: PdfDocument | undefined
    void openPdf(bytes).then(
      (document_) => {
        // Opening can outlive the tab; the document it produced owns a worker
        // and a Blob URL, so an abandoned one is released rather than dropped.
        if (!live) {
          void document_.destroy()
          return
        }
        opened = document_
        setPdf(document_)
      },
      (cause: unknown) => {
        if (live) onErrorRef.current(cause)
      },
    )
    return () => {
      live = false
      if (opened !== undefined) void opened.destroy()
    }
  }, [bytes])
  return pdf
}

/** What a caller does with the answer to the sidecar read. */
export interface SavedAnnotationHandlers {
  /**
   * Apply the Host's answer.
   * @param figure - the document's own facts.
   * @param saved - the saved marks file, or null when the document has none.
   * @param stale - whether the file on disk is not the one the marks were drawn on.
   */
  readonly apply: (figure: FigureFacts, saved: import('../../shared/annotation').AnnotationDocument | null, stale: boolean) => void
  /**
   * Report a failed read.
   * @param cause - whatever the seat rejected with.
   */
  readonly fail: (cause: unknown) => void
}

/**
 * Read the document's saved annotation once per address.
 *
 * The address is the whole input: a document is read once, and the seats it is read
 * through are collaborators, not reasons to read it again — the shell rebuilds a
 * slot's injected face on every render of the tab, so a read keyed on the seat would
 * re-read (and re-render) for as long as the shell keeps rendering.
 *
 * @param address - the tab's resource address, or '' while the tab has none.
 * @param seat - the entry half's read, save and deliver seat, read at call time.
 * @param handlers - what to do with the answer, read at call time so their identity
 *   never re-runs the read.
 */
export function useSavedAnnotation(address: string, seat: DocumentSeat, handlers: SavedAnnotationHandlers): void {
  // The seat is read at call time rather than closed over: a rebuilt one must not
  // re-read the sidecar and reset the marks this reader has not saved yet.
  const seatRef = useRef(seat)
  seatRef.current = seat
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers
  useEffect(() => {
    if (address === '') return
    const controller = new AbortController()
    void (async () => {
      try {
        const loaded = await seatRef.current.load(address, controller.signal)
        if (controller.signal.aborted) return
        const figure = { path: loaded.path, mediaType: loaded.mediaType, sha256: loaded.sha256 }
        handlersRef.current.apply(figure, loaded.annotation, loaded.annotation !== null && loaded.annotation.figure.sha256 !== loaded.sha256)
      } catch (cause) {
        if (controller.signal.aborted) return
        handlersRef.current.fail(cause)
      }
    })()
    return () => { controller.abort() }
  }, [address])
}
