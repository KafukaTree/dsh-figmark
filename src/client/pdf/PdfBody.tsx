/**
 * The PDF body: the whole document, one page on screen at a time.
 *
 * This module is the lazy chunk, so PDF.js, the PDF writer and their data are paid
 * for only when a PDF is opened. It owns what is PDF-specific — opening the
 * document, deciding the raster resolution for the pane, keeping unsaved edits per
 * page, writing the marks into a copy of the document — and it is the document's
 * one writer: every page's marks are saved as one annotation and delivered as one
 * message. Each page on screen is handed to the annotator body, which owns the
 * drawing surface and the marks of that page.
 * @module dsh-figmark/client/pdf/PdfBody
 */
import { useCallback, useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import type { AnnotationMark } from '../../shared/annotation'
import type { AnnotatorBodyProps, BodyContent, SurfaceDraft, Translate } from '../annotator-contract'
import type { DocumentSeat, PageImage, PagedAnnotationInput } from '../document-seat'
import type { Autosave, AutosaveDeps } from '../autosave'
import { annotatePdf, type PageAnnotateInput } from './annotate'
import { openPdf, type PdfDocument } from './runtime'

/**
 * What the chunk needs from the main bundle.
 *
 * Both seats cross as props because a package-local chunk cannot import its own
 * package's entry bundle: the import would either duplicate the whole client half
 * or resolve through a module table that carries only the shell's modules.
 */
export interface PdfBodyInjected {
  /** The annotator body, mounted once per page. */
  readonly AnnotatorBody: ComponentType<AnnotatorBodyProps>
  /** The entry half's document work: read, save and deliver the whole sidecar. */
  readonly seat: DocumentSeat
  /**
   * The entry half's debounced background writer.
   *
   * A package-local chunk has no import edge to the entry bundle, so the writer it
   * uses to keep a draft alive arrives as a prop. `import type` above is erased, so
   * the chunk still carries no runtime reference to the entry half.
   */
  readonly createAutosave: (deps: AutosaveDeps) => Autosave
  /** Identity of an annotation, so a write of what is already stored is skipped. */
  readonly annotationSignature: (marks: readonly AnnotationMark[], summary: string) => string
  /** How long the writer waits after the last edit. */
  readonly autosaveDelayMs: number
  /**
   * The size multiple a page of this size draws its marks at.
   *
   * Injected for the same reason the writer is: this module must not hold a runtime
   * reference into the entry bundle, or the two would be split into a shared chunk
   * the browser factory cannot load.
   */
  readonly figureUnit: (width: number, height: number) => number
  /**
   * The size and visibility a saved document records.
   *
   * Injected for the same reason the writer is: this module must not hold a runtime
   * reference into the entry bundle, or the two would be split into a shared chunk
   * the browser factory cannot load.
   */
}

/** Everything the PDF body renders with. */
export type PdfBodyProps = PdfBodyInjected & {
  /** Document content: complete bytes for a `bytes-complete` renderer. */
  readonly content?: BodyContent | undefined
  /** The tab's `dsh-resource://file/…` address. */
  readonly resourceAddress?: string | undefined
  /** Owner callback that registers the body's scrollport. */
  readonly scrollportRef?: ((element: HTMLElement | null) => void) | undefined
  /** Copy, already resolved against the shell's locale or the fallback dictionary. */
  readonly t: Translate
}

/** Gap kept around a page inside the pane, matching the annotator's own inset. */
const PANE_INSET = 24

/** Highest device-pixel ratio one page bitmap is rendered at. */
const MAX_DENSITY = 2

/**
 * Narrowest width a page is rendered for; below it the pane is still settling.
 * Compared against the stepped width, so the guard itself is a whole step wide.
 */
const MIN_PANE_WIDTH = 120

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

/** The document's own facts, as the Host reported them. */
interface FigureFacts {
  readonly path: string
  readonly mediaType: string
  readonly sha256: string
}

/** One page's marks, keyed by 1-based page number. */
type MarksByPage = ReadonlyMap<number, readonly AnnotationMark[]>

/** One rendered page, as the pane and the annotator body use it. */
interface PageBitmap {
  /** PNG data URL of the page. */
  readonly dataUrl: string
  /** Page width in page units. */
  readonly width: number
  /** Page height in page units. */
  readonly height: number
}

/**
 * The page whose raster is on screen.
 *
 * The page number travels with the raster because the pane shows a page, not a
 * picture: the annotator body is keyed by it, so the pixels, the marks drawn on
 * them and the page those marks are filed under are always one page. A reader
 * who has already asked for the next page still sees this one until that page's
 * raster exists, which is what keeps a page turn from emptying the pane.
 */
interface ShownPage {
  /** 1-based page number the raster was rendered for. */
  readonly page: number
  /** The raster itself. */
  readonly bitmap: PageBitmap
}

/**
 * Group one document's marks by the page they belong to.
 * @param marks - every mark of the document.
 * @returns the marks of each page; a mark without a page is on page 1.
 */
function groupByPage(marks: readonly AnnotationMark[]): MarksByPage {
  const grouped = new Map<number, readonly AnnotationMark[]>()
  for (const mark of marks) {
    const page = mark.page ?? 1
    grouped.set(page, [...(grouped.get(page) ?? []), mark])
  }
  return grouped
}

/** One marked page, with the marks it carries. */
interface MarkedPage {
  /** 1-based page number. */
  readonly page: number
  /** The marks drawn on it. */
  readonly marks: readonly AnnotationMark[]
}

/**
 * The pages that carry at least one mark.
 * @param marks - every page's marks.
 * @returns the marked pages, ascending, each with its own marks.
 */
function markedPages(marks: MarksByPage): MarkedPage[] {
  return [...marks.entries()]
    .filter(([, pageMarks]) => pageMarks.length > 0)
    .sort(([left], [right]) => left - right)
    .map(([page, pageMarks]) => ({ page, marks: pageMarks }))
}

/** Every mark, in page then draw order, each stamped with the page it is on. */
function allMarks(marks: MarksByPage): AnnotationMark[] {
  // The page is the document's own knowledge: a surface knows the marks it holds,
  // not which page it is mounted for, so the stamp is added here — once, where the
  // whole document is in view.
  return markedPages(marks).flatMap(entry => entry.marks.map(mark => ({ ...mark, page: entry.page })))
}

/**
 * Render one PDF, one page at a time, annotating it as a whole document.
 * @param props - document content, addressed resource, copy, and the injected seats.
 * @returns the document's toolbar and the page on screen, or why it is not there yet.
 */
export function PdfBody(props: PdfBodyProps): ReactNode {
  const { AnnotatorBody, seat, t } = props
  const address = props.resourceAddress ?? ''
  const { createAutosave, annotationSignature, autosaveDelayMs } = props
  const bytes = props.content?.kind === 'bytes' ? props.content.data : undefined
  const observerRef = useRef<ResizeObserver | null>(null)
  const [pdf, setPdf] = useState<PdfDocument | null>(null)
  /** The page the reader asked for: the number in the toolbar follows this one. */
  const [requested, setRequested] = useState(1)
  const [shown, setShown] = useState<ShownPage | null>(null)
  const [paneWidth, setPaneWidth] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [figure, setFigure] = useState<FigureFacts | null>(null)
  const [marks, setMarks] = useState<MarksByPage>(new Map())
  const [summary, setSummary] = useState('')
  /** Viewing or annotating, kept here so paging does not reset it. */
  const [mode, setMode] = useState<'view' | 'annotate'>('view')
  const [createdAt, setCreatedAt] = useState<string | null>(null)
  const [stale, setStale] = useState(false)
  /**
   * How large the numbers are drawn across the whole document.
   *
   * One style for every page, because the numbers have to read as one set: a page
   * that opened after its sibling would otherwise number the same mark differently.
   * size. It is saved with the marks, so the delivered pages carry it too.
   */
  const [busy, setBusy] = useState<'sending' | null>(null)
  const [status, setStatus] = useState<{ tone: 'ok' | 'error' | 'info'; text: string } | null>(null)
  const pageCount = pdf === null ? 0 : pdf.pageCount
  /** The pane width a raster is asked for: one step, whatever the drag did inside it. */
  const renderWidth = Math.ceil(paneWidth / RENDER_WIDTH_STEP) * RENDER_WIDTH_STEP

  /**
   * The seats this document acts through.
   *
   * Both come from the shell, and the shell rebuilds them on its own terms — a
   * re-registered slot, a new tab binding — without the document having changed.
   * They are read at call time rather than closed over, so a rebuilt seat cannot
   * re-read the sidecar and reset the mode, the note and the marks this reader
   * has not saved yet.
   */
  const seatRef = useRef(seat)
  seatRef.current = seat
  const translateRef = useRef(t)
  translateRef.current = t

  // --- the document ---------------------------------------------------------

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
        if (live) setError(cause instanceof Error ? cause.message : String(cause))
      },
    )
    return () => {
      live = false
      if (opened !== undefined) void opened.destroy()
    }
  }, [bytes])

  // --- the saved annotation -------------------------------------------------

  // The address is the whole input: a document is read once, and the seats it is
  // read through are collaborators, not reasons to read it again.
  useEffect(() => {
    if (address === '') return
    const controller = new AbortController()
    void (async () => {
      try {
        const loaded = await seatRef.current.load(address, controller.signal)
        if (controller.signal.aborted) return
        setFigure({ path: loaded.path, mediaType: loaded.mediaType, sha256: loaded.sha256 })
        const saved = loaded.annotation
        if (saved === null) return
        setMarks(groupByPage(saved.marks))
        setSummary(saved.summary ?? '')
        // A document that already carries marks opens ready to edit them.
        if (saved.marks.length > 0) setMode('annotate')
        setCreatedAt(saved.createdAt)
        setStale(saved.figure.sha256 !== loaded.sha256)
      } catch (cause) {
        if (controller.signal.aborted) return
        setStatus({ tone: 'error', text: `${translateRef.current('readError')}${cause instanceof Error ? cause.message : String(cause)}` })
      }
    })()
    return () => { controller.abort() }
  }, [address])

  // --- pane width -----------------------------------------------------------

  /**
   * Measure the pane when it appears and whenever it changes. The ref callback
   * owns the observer for exactly the element's lifetime: a null element is the
   * unmount, which is where the observer goes.
   */
  const attachHost = useCallback((element: HTMLDivElement | null): void => {
    observerRef.current?.disconnect()
    observerRef.current = null
    if (element === null) return
    setPaneWidth(element.clientWidth)
    const observer = new ResizeObserver(() => { setPaneWidth(element.clientWidth) })
    observer.observe(element)
    observerRef.current = observer
  }, [])

  // --- the page on screen ---------------------------------------------------

  useEffect(() => {
    if (pdf === null || renderWidth < MIN_PANE_WIDTH) return
    let live = true
    void (async () => {
      try {
        const rendered = await renderPage(pdf, requested, renderWidth)
        if (!live) return
        // The new raster replaces the one on screen once it exists, whether what
        // changed was the width step or the page: emptying the pane first is the
        // flash a drag and a page turn used to be.
        setShown({ page: requested, bitmap: rendered })
      } catch (cause) {
        if (live) setError(cause instanceof Error ? cause.message : String(cause))
      }
    })()
    return () => { live = false }
  }, [pdf, requested, renderWidth])

  /** The only place a page number is decided: requests are clamped, not trusted. */
  const goTo = useCallback((next: number): void => {
    // A document that reports no pages still shows page one, so the clamp carries
    // its own floor. Asking for the page already on screen returns the same number,
    // which React treats as no change at all.
    setRequested(() => Math.min(Math.max(next, 1), Math.max(pageCount, 1)))
  }, [pageCount])

  /** Keep one page's unsaved edits while another page is on screen. */
  const remember = useCallback((edited: number, draft: SurfaceDraft): void => {
    // The same array is the same edits: storing it again would rebuild the map,
    // re-render the document, and let a talkative page report its way into a loop.
    setMarks((current) => (current.get(edited) === draft.marks ? current : new Map(current).set(edited, draft.marks)))
  }, [])

  /**
   * The page on screen, as the draft reporter reads it.
   *
   * The annotator body reports the edits of the pixels it was given, and while a
   * page turn is being drawn those pixels are still the previous page's: the
   * report belongs to the page it was drawn on, not to the page being fetched.
   * The page is read at call time rather than closed over, so the reporter's
   * identity never changes — the body reports from an effect keyed on it, and a
   * report that stored state under a new identity every render would be a render
   * loop rather than a slow path. Zero stands for no page, which no mounted body
   * can report from.
   */
  const shownPageRef = useRef(0)
  if (shown !== null) shownPageRef.current = shown.page

  /** Report the edits of the page on screen, so the document keeps them. */
  const reportDraft = useCallback((draft: SurfaceDraft): void => {
    remember(shownPageRef.current, draft)
  }, [remember])

  // --- save and delivery ----------------------------------------------------

  /** Everything one save persists, or null while the document is still unknown. */
  const collect = useCallback((): PagedAnnotationInput | null => {
    if (figure === null || pageCount < 1) return null
    return {
      figure: { address, ...figure, pageCount },
      marks: allMarks(marks),
      summary,
      createdAt,
    }
  }, [address, createdAt, figure, marks, pageCount, summary])

  /**
   * The document as the background writer sees it.
   *
   * A debounced write runs after the render that scheduled it, so a closure would
   * write the marks as they were when the reader stopped typing — which is exactly
   * the state a write exists to move past. Everything is read at call time instead.
   */
  const live = useRef({ address, collect })
  live.current = { address, collect }
  /** The annotation the disk already holds, so a read is not written straight back. */
  const writtenSignature = useRef<string | null>(null)
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
      onError: (cause: unknown) => {
        setStatus({ tone: 'error', text: `${translateRef.current('saveError')}${cause instanceof Error ? cause.message : String(cause)}` })
      },
    })
  }
  const autosave = autosaveRef.current

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

  /**
   * Forget the document's annotation, on screen and on disk.
   *
   * A paged document's annotation is one sidecar and one annotated copy, and both
   * have done their job once the marks are delivered: keeping them would hand the
   * reader the same work to send twice, and a sidecar left on disk is what brought
   * a deleted annotation back on the next open.
   */
  const discard = useCallback(async (): Promise<void> => {
    const copy = translateRef.current
    // A write that is still waiting would put the sidecar back the moment it ran.
    autosave.cancel()
    writtenSignature.current = null
    try {
      await seatRef.current.discard(address)
    } catch (cause) {
      setStatus({ tone: 'error', text: `${copy('clearError')}${cause instanceof Error ? cause.message : String(cause)}` })
    }
    setMarks(new Map())
    setSummary('')
    setCreatedAt(null)
    setStale(false)
  }, [address])

  /**
   * Save the document's annotation and hand it to the agent, or into the draft.
   *
   * Both paths write the same files, and neither rewrites the PDF the reader
   * opened: the marks land in `<name>.annot.json` and a derived
   * `<name>.annotated.pdf` beside it.
   * @param target - who receives the annotation.
   */
  const run = useCallback(async (target: 'agent' | 'composer'): Promise<void> => {
    const seats = seatRef.current
    const copy = translateRef.current
    // The only enforcement point: the toolbar buttons stay clickable so this
    // guard is what decides, not a disabled attribute that hides the reason.
    const input = collect()
    if (input === null) {
      setStatus({ tone: 'error', text: copy('notReady') })
      return
    }
    if (input.marks.length === 0 || pdf === null || bytes === undefined) return
    setBusy('sending')
    setStatus({ tone: 'info', text: copy(target === 'agent' ? 'sending' : 'composing') })
    try {
      const pages = markedPages(marks)
      const annotatedPdf = await annotatePdf(bytes, await annotateInputs(pdf, pages, props.figureUnit))
      const saved = await seats.save(address, input, annotatedPdf)
      autosave.cancel()
      writtenSignature.current = signature(input)
      setCreatedAt(input.createdAt ?? new Date().toISOString())
      setStale(false)
      const pageImages = await reviewPages(pdf, pages)
      if (target === 'composer') {
        await seats.compose(input, saved, pageImages, annotatedPdf)
        setStatus({ tone: 'ok', text: copy('composed') })
        await discard()
        return
      }
      const warnings = await seats.send(input, saved, pageImages, annotatedPdf)
      const text = `${copy('sent')}${warnings.length === 0 ? '' : ` ${warnings.join(' ')}`}`
      setStatus({ tone: warnings.length === 0 ? 'ok' : 'info', text })
      await discard()
    } catch (cause) {
      setStatus({ tone: 'error', text: `${copy('saveError')}${cause instanceof Error ? cause.message : String(cause)}` })
    } finally {
      setBusy(null)
    }
  }, [address, autosave, bytes, collect, discard, marks, pdf, signature])

  // --- render ---------------------------------------------------------------

  const total = allMarks(marks).length
  // The list numbers marks across the document, so a page's pins continue the
  // counting rather than restarting it: "③" on page 2 has to be the third sentence.
  const numbering = new Map(allMarks(marks).map((mark, index) => [mark.id, index + 1]))
  return (
    <div className="da-pdf" ref={attachHost}>
      <div className="da-toolbar">
        {/* Navigation belongs to the document: one page at a time, and the page
            number is what every surface's marks are keyed by. The number follows
            the reader's request while the page itself waits for its raster, and
            the document's own count appears only once it has been opened — an
            unopened document has no count to state. */}
        <button type="button" className="da-btn" disabled={requested <= 1}
          onClick={() => { goTo(requested - 1) }}>{t('previousPage')}</button>
        <span className="da-page">{pdf === null ? `${requested}` : `${requested} / ${pageCount}`}</span>
        <button type="button" className="da-btn" disabled={requested >= pageCount}
          onClick={() => { goTo(requested + 1) }}>{t('nextPage')}</button>
        <span className="da-spacer" />
        {pdf === null ? null : <span className="da-page">{t('documentScope', { pages: pageCount, marks: total })}</span>}
      </div>
      {stale ? <div className="da-status" data-tone="error">{t('stale')}</div> : null}
      {status === null ? null : <div className="da-status" data-tone={status.tone === 'info' ? undefined : status.tone}>{status.text}</div>}
      {error !== null ? (
        <p className="da-hint" role="alert">{`${t('pdfOpenFailed')}${error}`}</p>
      ) : shown === null ? (
        // The wait for the first raster fills the pane body, so the frame around
        // it — the toolbar, the page number, the save buttons — is already there
        // and does not move when the page arrives.
        <div className="da-placeholder"><p className="da-hint">{t('pdfRendering')}</p></div>
      ) : (
        <AnnotatorBody
          // Each page is its own surface with its own undo history, so switching
          // pages mounts a fresh body seeded from that page's marks.
          key={shown.page}
          resourceAddress={props.resourceAddress}
          scrollportRef={props.scrollportRef}
          t={t}
          content={undefined}
          page={shown.bitmap}
          draft={{ marks: marks.get(shown.page) ?? [] }}
          onDraftChange={reportDraft}
          numbering={numbering}
          summary={summary}
          onSummaryChange={setSummary}
          mode={mode}
          onModeChange={setMode}
        />
      )}
      {/* The hand-off sits at the bottom right of the panel, past the list it
          describes, so it is not reachable by a stray press on the page controls. */}
      <div className="da-send">
        <button type="button" className="da-btn" disabled={busy !== null}
          onClick={() => { void run('agent') }}>{t('sendToAgent')}</button>
        <button type="button" className="da-btn" disabled={busy !== null}
          onClick={() => { void run('composer') }}>{t('sendToComposer')}</button>
      </div>
    </div>
  )
}

/**
 * Render one page for the pane.
 * @param pdf - the open document.
 * @param page - 1-based page number.
 * @param paneWidth - pane width in CSS pixels.
 * @returns the page bitmap.
 */
async function renderPage(pdf: PdfDocument, page: number, paneWidth: number): Promise<PageBitmap> {
  const size = await pdf.size(page)
  // Render at the scale the pane will show, times the display density, so
  // fit width is crisp without asking the parser for pixels CSS discards.
  const fit = Math.max(0.1, (paneWidth - PANE_INSET) / size.width)
  const density = Math.min(MAX_DENSITY, globalThis.devicePixelRatio || 1)
  const rendered = await pdf.render(page, fit * density)
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
async function renderReviewPage(pdf: PdfDocument, page: number): Promise<PageBitmap> {
  const rendered = await pdf.render(page, MAX_DENSITY)
  return { dataUrl: rendered.dataUrl, width: rendered.width, height: rendered.height }
}

/**
 * Build the writer's input for every marked page.
 * @param pdf - the open document.
 * @param pages - the marked pages.
 * @returns one input per page, each with its marks and its user-space transform.
 */
async function annotateInputs(
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
async function reviewPages(pdf: PdfDocument, pages: readonly MarkedPage[]): Promise<PageImage[]> {
  const images: PageImage[] = []
  for (const entry of pages) {
    const rendered = await renderReviewPage(pdf, entry.page)
    images.push({ page: entry.page, dataUrl: rendered.dataUrl, width: rendered.width, height: rendered.height })
  }
  return images
}
