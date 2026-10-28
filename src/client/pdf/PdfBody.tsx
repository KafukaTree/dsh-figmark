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
 *
 * Everything below is composition: the pane's width in `./viewport`, the document and
 * its sidecar in `./document-lifecycle`, the writer in `./document-autosave`, the save
 * and the clear in `./document-save`, the marks' page filing in `./page-marks`, the
 * rasters in `./raster`, and the controls in `./paging-controls`. What is left here is
 * the order those pieces are wired in, which is the one thing only the document knows.
 *
 * @module dsh-figmark/client/pdf/PdfBody
 */
import { useCallback, useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import type { AnnotationDocument, AnnotationMark } from '../../shared/annotation'
import type { AnnotatorBodyProps, BodyContent, SurfaceDraft, Translate } from '../annotator-contract'
import type { DocumentSeat, PagedAnnotationInput } from '../document-seat'
import type { Autosave, AutosaveDeps } from '../autosave'
import { useDocumentAutosave } from './document-autosave'
import { useOpenedDocument, useSavedAnnotation, type FigureFacts } from './document-lifecycle'
import { messageOf, saveAndDeliver } from './document-save'
import { annotateDocument, reviewPages } from './export-pages'
import { allMarks, collectInput, groupByPage, numberingOf, withPageMarks, withoutMark, type MarksByPage } from './page-marks'
import { PagingControls } from './paging-controls'
import { MIN_PANE_WIDTH, renderPage, renderWidthFor, type PageBitmap } from './raster'
import { usePaging, usePagingKeys, usePaneWidth } from './viewport'
import { WaitingBar } from './waiting-bar'

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

/** One rendered page, as the pane shows it. */
interface ShownPage {
  /** 1-based page number the raster was rendered for. */
  readonly page: number
  /** The raster itself. */
  readonly bitmap: PageBitmap
}

/** A status line under the pane. */
interface Status {
  /** What it says about the document. */
  readonly tone: 'ok' | 'error' | 'info'
  /** The text itself. */
  readonly text: string
}

/**
 * Render one PDF, one page at a time, annotating it as a whole document.
 * @param props - document content, addressed resource, copy, and the injected seats.
 * @returns the document's toolbar and the page on screen, or why it is not there yet.
 */
export function PdfBody(props: PdfBodyProps): ReactNode {
  const { AnnotatorBody, seat, t } = props
  const address = props.resourceAddress ?? ''
  const { createAutosave, annotationSignature, autosaveDelayMs, figureUnit } = props
  const bytes = props.content?.kind === 'bytes' ? props.content.data : undefined
  const pane = usePaneWidth()
  const [error, setError] = useState<string | null>(null)
  const pdf = useOpenedDocument(bytes, useCallback((cause: unknown) => {
    setError(messageOf(cause))
  }, []))
  const pageCount = pdf === null ? 0 : pdf.pageCount
  const paging = usePaging(pageCount)
  usePagingKeys(pdf !== null, paging, pageCount)
  const [shown, setShown] = useState<ShownPage | null>(null)
  const [figure, setFigure] = useState<FigureFacts | null>(null)
  const [marks, setMarks] = useState<MarksByPage>(new Map())
  const [summary, setSummary] = useState('')
  /** Viewing or annotating, kept here so paging does not reset it. */
  const [mode, setMode] = useState<'view' | 'annotate'>('view')
  const [createdAt, setCreatedAt] = useState<string | null>(null)
  const [stale, setStale] = useState(false)
  /**
   * How many times the document has been cleared.
   *
   * A page body seeds its marks once, when it mounts, so clearing the document has
   * to remount the page it is still showing — otherwise the body keeps listing the
   * marks that were just delivered and deleted.
   */
  const [generation, setGeneration] = useState(0)
  /**
   * The card open under the bar, and the mark it was opened about.
   *
   * Both live here rather than in a page body: paging away and back mounts a fresh
   * body, and state that travelled with it would shut the list and put the comment
   * pill away at every page boundary. One document, one list.
   */
  const [openPanel, setOpenPanel] = useState<'style' | 'goal' | 'list' | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  /**
   * How much the whole document is magnified.
   *
   * The document is one picture in several sheets, so the factor belongs here and
   * not in a page: a page body that kept its own would have to be zoomed again on
   * every page. Held at this level, a pinch on page 3 is a pinch on the document.
   */
  const [zoom, setZoom] = useState<number | 'fit'>('fit')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<Status | null>(null)
  const zoomFactor = zoom === 'fit' ? 1 : zoom
  const renderWidth = renderWidthFor(pane.width, zoomFactor)

  // --- copy -----------------------------------------------------------------

  /**
   * The copy seat, read at call time.
   *
   * The shell may rebind the translator without the document changing, and a failure
   * reported through a stale seat would speak the wrong language.
   */
  const translateRef = useRef(t)
  translateRef.current = t

  // --- the saved annotation -------------------------------------------------

  useSavedAnnotation(address, seat, {
    apply: useCallback((loaded: FigureFacts, saved: AnnotationDocument | null, isStale: boolean) => {
      setFigure(loaded)
      setStale(isStale)
      if (saved === null) return
      setMarks(groupByPage(saved.marks))
      setSummary(saved.summary ?? '')
      // A document that already carries marks opens ready to edit them.
      if (saved.marks.length > 0) setMode('annotate')
      setCreatedAt(saved.createdAt)
    }, []),
    fail: useCallback((cause: unknown) => {
      setStatus({ tone: 'error', text: `${translateRef.current('readError')}${messageOf(cause)}` })
    }, []),
  })

  // --- the page on screen ---------------------------------------------------

  useEffect(() => {
    if (pdf === null || renderWidth < MIN_PANE_WIDTH) return
    let live = true
    void (async () => {
      try {
        const rendered = await renderPage(pdf, paging.requested, renderWidth)
        if (!live) return
        // The new raster replaces the one on screen once it exists, whether what
        // changed was the width step or the page: emptying the pane first is the
        // flash a drag and a page turn used to be.
        setShown({ page: paging.requested, bitmap: rendered })
      } catch (cause) {
        if (live) setError(messageOf(cause))
      }
    })()
    return () => { live = false }
  }, [pdf, paging.requested, renderWidth])

  // --- the marks ------------------------------------------------------------

  /** Keep one page's unsaved edits while another page is on screen. */
  const remember = useCallback((edited: number, draft: SurfaceDraft): void => {
    setMarks(current => withPageMarks(current, edited, draft.marks))
  }, [])

  /**
   * The page on screen, as the draft reporter reads it.
   *
   * The annotator body reports the edits of the pixels it was given, and while a page
   * turn is being drawn those pixels are still the previous page's: the report belongs
   * to the page it was drawn on, not to the page being fetched. The page is read at
   * call time rather than closed over, so the reporter's identity never changes — the
   * body reports from an effect keyed on it, and a report that stored state under a
   * new identity every render would be a render loop rather than a slow path. Zero
   * stands for no page, which no mounted body can report from.
   */
  const shownPageRef = useRef(0)
  if (shown !== null) shownPageRef.current = shown.page

  /** Report the edits of the page on screen, so the document keeps them. */
  const reportDraft = useCallback((draft: SurfaceDraft): void => {
    remember(shownPageRef.current, draft)
  }, [remember])

  /** Drop one mark from wherever in the document it was drawn. */
  const removeAnyMark = useCallback((id: string): void => {
    setMarks(current => withoutMark(current, id))
  }, [])

  /** Show a mark the reader pressed in the list, wherever in the document it is. */
  const revealMark = useCallback((mark: AnnotationMark): void => {
    setSelectedId(mark.id)
    if (mark.page !== undefined) paging.goTo(mark.page)
  }, [paging])

  // --- save and delivery ----------------------------------------------------

  /** Everything one save persists, or null while the document is still unknown. */
  const collect = useCallback((): PagedAnnotationInput | null =>
    collectInput(figure, pageCount, address, marks, summary, createdAt),
  [address, createdAt, figure, marks, pageCount, summary])

  const autosave = useDocumentAutosave({
    address,
    collect,
    seat,
    createAutosave,
    annotationSignature,
    autosaveDelayMs,
    onError: useCallback((cause: unknown) => {
      setStatus({ tone: 'error', text: `${translateRef.current('saveError')}${messageOf(cause)}` })
    }, []),
  })

  const saveContext = {
    address,
    pdf,
    bytes,
    marks,
    collect,
    seat,
    figureUnit,
    annotate: annotateDocument,
    review: reviewPages,
    autosave,
    say: useCallback((text: string) => { setStatus({ tone: 'info', text }) }, []),
    fail: useCallback((text: string) => { setStatus({ tone: 'error', text }) }, []),
    setBusy,
    copy: {
      saveFailed: t('saveError'),
      notReady: t('notReady'),
      sending: t('sending'),
      composing: t('composing'),
      composed: t('composed'),
      sent: t('sent'),
      clearFailed: t('clearError'),
    },
    cleared: useCallback(() => {
      setMarks(new Map())
      setSummary('')
      setCreatedAt(null)
      setStale(false)
      // A cleared document has no marks to draw, but the page on screen is still
      // mounted with the list it seeded from the old ones. The new generation is what
      // remounts it against the empty draft.
      setGeneration(current => current + 1)
    }, []),
    setCreatedAt,
    setStale,
  }

  // The context is rebuilt on every render — it holds this render's marks — so the
  // callbacks read it at call time instead of closing over it: a hand-off whose
  // identity changed on every render would rebuild the page body's bar each time.
  const contextRef = useRef(saveContext)
  contextRef.current = saveContext

  const run = useCallback((target: 'agent' | 'composer'): void => {
    void saveAndDeliver(contextRef.current, target)
  }, [])

  // --- render ---------------------------------------------------------------

  const numbering = numberingOf(marks)
  const pageProps = {
    resourceAddress: props.resourceAddress,
    scrollportRef: props.scrollportRef,
    t,
    content: undefined,
    onDraftChange: reportDraft,
    numbering,
    summary,
    onSummaryChange: setSummary,
    mode,
    onModeChange: setMode,
    openPanel,
    onOpenPanelChange: setOpenPanel,
    selectedId,
    onSelectedIdChange: setSelectedId,
    onRevealMark: revealMark,
  } as const

  const pagingSlot = (
    <PagingControls
      t={t}
      stated={paging.stated}
      pageCount={pageCount}
      open={pdf !== null}
      editing={paging.box.editing}
      pageText={paging.box.text}
      onGoTo={paging.goTo}
      onEdit={paging.box.begin}
      onPageText={paging.box.write}
      onCommit={paging.box.commit}
      onStopEditing={paging.box.stop}
      onSubmitKey={paging.box.onKeyDown}
    />
  )

  return (
    <div className="da-pdf" ref={pane.attach}>
      {/* `pagingSlot` travels to the page body below, which places it on its bar. Until
          a page exists there is no body to carry it, so the pane stands one in: the
          page count and the hand-off are answerable before the first raster, and a
          reader who cannot draw yet can still be told why. */}
      {shown !== null ? null : (
        <WaitingBar t={t} paging={pagingSlot} busy={busy}
          onAgent={() => { run('agent') }} onComposer={() => { run('composer') }} />
      )}
      {stale ? <div className="da-status" data-tone="error">{t('stale')}</div> : null}
      {status === null ? null : <div className="da-status" data-tone={status.tone === 'info' ? undefined : status.tone}>{status.text}</div>}
      {error !== null ? (
        <p className="da-hint" role="alert">{`${t('pdfOpenFailed')}${error}`}</p>
      ) : shown === null ? (
        // The wait for the first raster fills the pane body, so the frame around
        // it — the page number, the hand-off — is already there and does not move
        // when the page arrives.
        <div className="da-placeholder"><p className="da-hint">{t('pdfRendering')}</p></div>
      ) : (
        <AnnotatorBody
          // Each page is its own surface with its own undo history, so switching
          // pages mounts a fresh body seeded from that page's marks. The generation
          // is part of the key so a document that cleared its marks remounts the
          // page it is still showing — otherwise the body would keep listing them.
          key={`${generation}:${shown.page}`}
          {...pageProps}
          page={shown.bitmap}
          draft={{ marks: marks.get(shown.page) ?? [] }}
          chromeHost={pane.host}
          pagingSlot={pagingSlot}
          onSend={run}
          // The factor is handed down rather than kept by the body: paging away and
          // back has to come back to the same size, and a body that owned it would
          // start every page at fit.
          zoom={zoom}
          onZoom={setZoom}
          documentMarks={allMarks(marks)}
          onDocumentRemove={removeAnyMark}
        />
      )}
    </div>
  )
}
