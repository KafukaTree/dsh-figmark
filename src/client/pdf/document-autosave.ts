/**
 * Keeping the document's annotation on disk while it is still being written.
 *
 * A PDF's marks are saved as one sidecar for the whole document, and the reader's
 * work has to survive a reload long before they press send. The writer is therefore
 * wired here, once, with three rules that only make sense together:
 *
 * - the first render after a load only *records* what was read, so opening a document
 *   never writes it back;
 * - every later edit schedules one debounced write;
 * - an empty document is a *clear*, and a clear deletes the sidecar rather than
 *   writing an empty one — otherwise the next open reads the deleted annotation back.
 *
 * @module dsh-figmark/client/pdf/document-autosave
 */
import { useCallback, useEffect, useRef } from 'react'
import type { AnnotationMark } from '../../shared/annotation'
import type { Autosave, AutosaveDeps } from '../autosave'
import type { DocumentSeat, PagedAnnotationInput } from '../document-seat'

/** What the writer needs from the document that owns it. */
export interface DocumentAutosaveOptions {
  /** The tab's resource address; a write with none has nothing to write against. */
  readonly address: string
  /**
   * Everything one save persists, or null while the document is still unknown.
   *
   * Read at call time: a debounced write runs after the render that scheduled it, so a
   * closure would write the marks as they were when the reader stopped typing — which
   * is exactly the state a write exists to move past.
   */
  readonly collect: () => PagedAnnotationInput | null
  /** The seat a draft is written through, read at call time for the same reason. */
  readonly seat: DocumentSeat
  /** The entry half's debounced writer, injected because the chunk may not import it. */
  readonly createAutosave: (deps: AutosaveDeps) => Autosave
  /** Identity of an annotation, so a write of what is already stored is skipped. */
  readonly annotationSignature: (marks: readonly AnnotationMark[], summary: string) => string
  /** How long the writer waits after the last edit. */
  readonly autosaveDelayMs: number
  /** Report a failed write, already localized by the caller. */
  readonly onError: (cause: unknown) => void
}

/** The handle a document keeps for its own background writes. */
export interface DocumentAutosave {
  /** Drop a pending wait without writing. */
  readonly cancel: () => void
  /**
   * Record what this save wrote, so the same state is not written twice.
   * @param input - the annotation the save persisted.
   */
  readonly markWritten: (input: PagedAnnotationInput) => void
  /** Forget what is on disk, so the next edit is written rather than skipped. */
  readonly forget: () => void
}

/**
 * Build the writer one document keeps for its lifetime.
 *
 * @param options - what to write, where to report a failure, and how long to wait.
 * @returns the writer plus the two bookkeeping operations the save path needs.
 */
export function useDocumentAutosave(options: DocumentAutosaveOptions): DocumentAutosave {
  const { address, collect, seat, createAutosave, annotationSignature, autosaveDelayMs, onError } = options
  // Everything the write closure reads is read at call time, so the writer built once
  // below can never write a stale document or a stale address.
  const live = useRef({ address, collect })
  live.current = { address, collect }
  const seatRef = useRef(seat)
  seatRef.current = seat
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError
  /** The annotation the disk already holds, so a read is not written straight back. */
  const writtenSignature = useRef<string | null>(null)
  const autosaveRef = useRef<Autosave | null>(null)
  if (autosaveRef.current === null) {
    autosaveRef.current = createAutosave({
      delay: autosaveDelayMs,
      write: async (): Promise<void> => {
        const state = live.current
        const input = state.collect()
        // Nothing to keep it on: a document that has not been read yet cannot describe
        // its own marks, so a write now would invent a figure.
        if (input === null || state.address === '') return
        const next = annotationSignature(input.marks, input.summary)
        if (next === writtenSignature.current) return
        // An empty document is a clear, and a clear deletes rather than writes. This
        // is the path that matters most: deleting the last mark has to remove the
        // sidecar, or the next open reads the deleted annotation back.
        if (input.marks.length === 0 && input.summary.trim() === '') {
          await seatRef.current.discard(state.address)
          writtenSignature.current = next
          return
        }
        await seatRef.current.draft(state.address, input)
        writtenSignature.current = next
      },
      onError: (cause: unknown) => { onErrorRef.current(cause) },
    })
  }
  const autosave = autosaveRef.current

  /**
   * Marks and note as one string, for the "has anything changed" question.
   *
   * Stable, because it is an effect dependency: a fresh identity every render would
   * re-run the scheduler on renders that changed nothing.
   */
  const signature = useCallback(
    (input: PagedAnnotationInput): string => annotationSignature(input.marks, input.summary),
    [annotationSignature],
  )

  // Every edit schedules one write. The first render after a load only records what
  // was read, so opening a document never writes it back.
  useEffect(() => {
    const input = collect()
    if (input === null) return
    if (writtenSignature.current === null) {
      writtenSignature.current = signature(input)
      return
    }
    autosave.schedule()
  }, [autosave, collect, signature])

  // A reload ends the page, and a pending debounce would end with it. Flushing on
  // `pagehide` is what makes "reload keeps my marks" true for the last edit too.
  useEffect(() => {
    const write = (): void => { void autosave.flush() }
    window.addEventListener('pagehide', write)
    return () => {
      window.removeEventListener('pagehide', write)
      void autosave.flush()
    }
  }, [autosave])

  return {
    cancel: useCallback(() => { autosave.cancel() }, [autosave]),
    markWritten: useCallback((input: PagedAnnotationInput) => { writtenSignature.current = signature(input) }, [signature]),
    forget: useCallback(() => { writtenSignature.current = null }, []),
  }
}
