/**
 * The document body: one figure with an optional annotation layer.
 *
 * It reads the figure's bytes from the document preview owner (so the plugin
 * never reads files itself), renders them, and hands finished marks to the Host
 * half for storage before delivering them to the agent as a user message.
 * @module dsh-figmark/client/AnnotatorBody
 */
import { createPortal } from 'react-dom'
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { resolveTranslate, type AnnotatorBodyProps, type TranslateVars } from './annotator-contract'
import { parseFileAddress } from '../shared/address'
import type { AnnotationDocument, AnnotationMark, FigurePoint, MarkAnchor } from '../shared/annotation'
import {
  WEIGHT_DEFAULT, clampWeight, needsReviewImage,
} from '../shared/annotation'
import { figureMediaType } from '../shared/figure-kind'
import { Canvas, type CanvasInput, type MarkPatch, type Tool } from './Canvas'
import { captureThumb } from './annotation-thumb'
import { parkInComposer } from './composer'
import { reviewImageFile } from './review-attachment'
import { composeReviewSvg, rasterizePng, reviewSize, type FigureLayer } from './export'
import type { SidecarWriteResult } from '../shared/http'
import {
  RENDER_WIDTH, anchorInDocument, currentSurfaceSelector, deckSlideOf, deckSlideSize,
  elementChoicesInDocument,
  eventOwnerOf, loadFrameDocument, measureFrameContent, prepareDeck, showDeckSlide,
} from './html-dom'
import {
  sameChoiceElements, type ElementChoices, type PickLevel,
} from './element-choice'
import {
  sameShownMarks, shownMarksOf, useShownMarks, type ShownMarks,
} from './shown-marks'
import {
  anchorOfPick, closeLivePage, liveAddressOf, openLivePage, pickName, shownAddress, type LivePage,
} from './live-page'
import { elementMark } from './canvas/marks'
import {
  liveDepthMessage, liveModeMessage, liveReleaseMessage, liveRevealMessage, liveWatchMessage, parseLiveEvent,
} from '../shared/live'
import { AUTOSAVE_DELAY_MS, annotationSignature, createAutosave, type Autosave } from './autosave'
import { readPreferences, rememberPreferences, type PaletteSpot } from './preferences'
import {
  clampMenu, copiedText, figureMenuItems, menuSize, pressedInsideMenu, relativeTo, type FigureMenuAction,
} from './figure-menu'
import {
  copyImageToClipboard, desktopAvailable, openOnDesktop, revealOnDesktop,
} from './host-actions'
import { AnnotatorHostError, deleteAnnotation, loadAnnotation, saveAnnotation, type LoadedAnnotation } from './host-api'
import { NAMESPACE } from './locales'
import { chipKey, elementName, hoverBoxAt, nameChipAt } from './hover-name'
import { elementAt, ensureSpotlight, moveSpotlight, type LitSpot } from './spotlight'
import { deliverAnnotation } from './session'
import { ensureStyles } from './styles'
import {
  PINCH_SETTLE_DELAY_MS, STAGE_BOTTOM_INSET, STAGE_INSETS, STAGE_PADDING,
  anchoredScroll, clampZoom, wheelZoomFactor,
} from './zoom'
import {
  DETAIL_HEIGHT, DETAIL_WIDTH, measuredSize, obstacleBox, placeAboveBar, placeCard, scaledBox,
  type RecordPlacement,
} from './popover'
import { markOutline } from './render'
import { plotBounds } from './plot'
import { figureUnit } from './scale'
import { FigureBar, ToolPalette, type StripHandle } from './annotator/chrome'
import { DetailPill } from './annotator/detail-pill'
import { FigureMenuCard } from './annotator/figure-menu-card'
import { FigureRoom } from './annotator/figure-room'
import { useAnnotationHistory } from './annotator/history'
import {
  drawingScale,
  figurePlacementStyle,
  paperTransformStyle,
  railFraction,
  railWeight,
  surfaceBoxStyle,
} from './annotator/geometry'
import { buildAnnotationDocument } from './annotator/documents'
import {
  DEFAULT_PALETTE, clampedSpot, draggedSpot, paletteRoomBeforeBar, placementStyle, separatedSpot,
  settledSpot, spotOfBox,
} from './annotator/placement'
import {
  clipStatus, failureStatus, hostGestureStatus, reportDeliveryWarnings,
} from './annotator/delivery'
import { decodeFigure, figureLayer, figureSize, type LoadedFigure } from './annotator/figure-source'
import {
  appendedMarks, detailedMarks, elementMarkOn, loadedMarks, movedMarks, patchedMarks,
  patchChangesNothing, removedMarks,
} from './annotator/mark-edits'
import { MarkList, SummaryRecord } from './annotator/records'
import { collectLitSpots } from './annotator/spotlights'
import { ToastStack, useToasts } from './annotator/toasts'
import { COLORS, ELEMENT_TOOLS, TOOLS } from './annotator/tokens'
import { WeightRail } from './annotator/weight-rail'

export type { AnnotatorBodyProps, AnnotatorInjected, BodyContent, PageSurface, SurfaceDraft, Translate, TranslateVars } from './annotator-contract'

/** One floating strip's live press, including the place to restore if it aborts. */
interface StripDrag {
  readonly pointerId: number
  readonly restore: PaletteSpot | undefined
  readonly origin: PaletteSpot
  readonly box: { readonly left: number; readonly top: number }
  current: PaletteSpot | null
}

/** The last directory in a file path, shortened to the part that locates it. */
function parentPathOf(path: string): string {
  const parts = path.replace(/[\\/]+$/u, '').split(/[\\/]/u).filter(part => part !== '')
  parts.pop()
  const parent = parts.at(-1)
  return parent === undefined ? '' : `.../${parent}`
}

/**
 * Render one figure with its annotation layer.
 * @param props - document content, addressed resource, locale seat, and session delivery face.
 * @returns the annotator body.
 */
export function AnnotatorBody(props: AnnotatorBodyProps): ReactNode {
  const address = props.resourceAddress ?? ''
  // One parser for both halves: it already tolerates malformed escapes, which a
  // hand-rolled `decodeURIComponent` here would throw on.
  const parsedAddress = parseFileAddress(address)
  const mediaType = props.livePage === undefined ? figureMediaType(parsedAddress?.path ?? '') : 'text/html'
  const isVector = mediaType === 'image/svg+xml'
  const t = useCallback(
    (key: string, vars?: TranslateVars): string => resolveTranslate(props, key, vars),
    [props.t, props.localeId],
  )
  const sessionId = props.sessionId ?? parsedAddress?.sessionId

  /**
   * A private prefix for the rail's gradient and clip ids.
   *
   * Two bodies can be mounted at once (a PDF lays out one per page), and an id is
   * document-wide: sharing one would make every rail's fill follow the first rail's
   * selection. Declared here, with the other hooks, because the ids are read far below
   * the early returns for a figure that failed to load.
   */
  const trackId = `da-weight-${useId().replaceAll(':', '')}`
  const stageRef = useRef<HTMLDivElement | null>(null)
  /** The box a double clicked mark's detail is written in. */
  const detailRef = useRef<HTMLTextAreaElement | null>(null)
  /**
   * The comment pill around that box.
   *
   * Measured rather than the textarea inside it: the field gives up width to the two
   * hand-off buttons as soon as there is something to send, so a placement computed
   * from the field's box would put the buttons past the edge of the panel — which is
   * exactly what a comment pill against the right edge used to do.
   */
  const pillRef = useRef<HTMLDivElement | null>(null)
  const barRef = useRef<HTMLDivElement | null>(null)
  const figureHostRef = useRef<HTMLDivElement | null>(null)
  const surfaceRef = useRef<HTMLDivElement | null>(null)
  const paperRef = useRef<HTMLDivElement | null>(null)
  const figureRef = useRef<HTMLDivElement | null>(null)
  /**
   * The elements this body is currently lighting, if any.
   *
   * A ref rather than state: the light is a class on figure elements, which React does
   * not render, and putting it in state would re-render every mark on the figure to say
   * where the pointer is. It only ever holds what this body put the class on, so the
   * light is taken off exactly the elements it was put on.
   *
   * Two kinds of light share this list: the preview the picker shines on the element a
   * click would take, and the light an element *mark* keeps for as long as it is on the
   * figure. The preview is derived fresh on each move; the marks' lights are rebuilt
   * from the annotation whenever it changes.
   */
  const litRef = useRef<readonly LitSpot[]>([])
  /**
   * The element the picker is offering right now, if any.
   *
   * Held beside `litRef` because the two answer different questions: this one is what
   * the pointer is over, and `litRef` is everything currently wearing the light —
   * which includes every element mark on the figure. Rebuilding the whole list on each
   * pointer move needs to know what the preview was, and this is it.
   */
  const hovered = useRef<MarkAnchor | undefined>(undefined)

  /**
   * The element whose name is hanging beside it, or null when the chip is away.
   *
   * State rather than something read off `hovered`, because `hovered` is a ref: the
   * light is written straight onto the figure's own DOM and must not re-render the
   * panel, while the chip is drawn by React and cannot appear without a render.
   */
  const [chipAnchor, setChipAnchor] = useState<MarkAnchor | null>(null)
  /** Where the hovered element sits in the picker's child-to-parent ladder. */
  const [pickLevel, setPickLevel] = useState<PickLevel | undefined>(undefined)
  /**
   * The element ladder and chosen rung under the pointer in a same-origin document.
   *
   * The frame owns its pointers in element mode, so this small picker state cannot
   * live in Canvas. Keeping it here lets hover, the arrow-key depth control, and the
   * press that commits a mark all agree on the exact element under the hand.
   */
  const htmlPick = useRef<{ readonly choices: ElementChoices; readonly index: number } | null>(null)
  /** Whether the rest of one same-origin element press must not reach the page. */
  const htmlClickGuard = useRef(false)
  /**
   * The page being framed instead of the file, when one is.
   *
   * A page a dev server serves has no bytes to read: it has to be fetched, its scripts
   * run, its layout made before there is anything to annotate. So opening one asks the
   * Host to stand in front of that server, and the frame is pointed at what it answers
   * with. Null means this body is showing the file it was opened on.
   */
  const [livePage, setLivePage] = useState<LivePage | null>(props.livePage ?? null)
  /** The page that currently owns the frame. */
  const previewPage = livePage
  /** What the reader is typing in the address field, or null while they are not. */
  const [liveText, setLiveText] = useState<string | null>(null)
  /** Why the last address did not open, in the reader's own words. */
  const [liveError, setLiveError] = useState<string | null>(null)
  /** Whether an address is being opened right now. */
  const [liveBusy, setLiveBusy] = useState(false)
  /** The synchronous guard for repeated Enter presses before React paints `liveBusy`. */
  const liveBusyRef = useRef(false)
  /** Whether this body is still mounted, for an open that resolves after teardown. */
  const liveMounted = useRef(true)
  /** The one open request whose answer this body may still display. */
  const liveOpenGeneration = useRef(0)
  /** Whether the compact location icon is open into the full address field. */
  const [liveAddressOpen, setLiveAddressOpen] = useState(false)
  /** The address field, focused when its compact icon is opened. */
  const liveAddressRef = useRef<HTMLInputElement | null>(null)
  /** A fresh browsing context for the same live page, without reopening its proxy. */
  const [frameRevision, setFrameRevision] = useState(0)
  /** The last owner refresh request already applied. */
  const handledRefreshToken = useRef(props.refreshToken)

  useEffect(() => {
    if (!liveAddressOpen) return
    liveAddressRef.current?.focus()
  }, [liveAddressOpen])

  /** The key behind the chip currently drawn, so a move inside one element is free. */
  const chipShown = useRef<string>(chipKey(undefined))

  /**
   * Hand the stage to the owner as its scrollport, and keep it here too.
   *
   * Stable on purpose. The owner writes the reader's saved scroll position onto
   * whatever element it is handed, so a callback that changed identity on every
   * render would hand it the stage again on every render — and put that position
   * back over wherever the reader has scrolled to since. That is a page jumping
   * under the pointer while it is being annotated.
   */
  const attachStage = useCallback((element: HTMLDivElement | null): void => {
    stageRef.current = element
    props.scrollportRef?.(element)
  }, [props.scrollportRef])

  /**
   * The window a local rendered document is shown through.
   *
   * The document scrolls inside its frame, and the frame is the only thing that
   * knows how far it has gone. A proxied page reports its offset by message instead,
   * because its origin is not ours to read.
   */
  const documentView = useCallback((): Window | null => {
    const frame = frameRef.current
    if (frame === null || previewPage !== null) return null
    return frame.contentWindow
  }, [previewPage])

  /**
   * Move the view by a drag.
   *
   * The scroll offset is written straight onto the element rather than held in
   * state: a pan is a stream of moves, and routing each one through React would
   * make the picture trail the hand by a frame. The CSS `overflow` already keeps
   * the offset inside the scrollable range, so an overshoot at an edge simply does
   * nothing instead of needing a clamp here.
   *
   * A rendered document scrolls inside its own frame rather than in the stage, so on
   * that surface the drag is handed to the frame's window — the page moves under the
   * hand either way, which is what the reader is reaching for.
   * @param dx - horizontal travel of the pointer, in client pixels.
   * @param dy - vertical travel of the pointer.
   */
  const panBy = useCallback((dx: number, dy: number): void => {
    const stage = stageRef.current
    /* v8 ignore next -- a pan comes from the overlay, which only exists inside the stage. */
    if (stage === null) return
    // Dragging right moves the picture right, which means scrolling left: the hand
    // pushes the paper, it does not push a scroll bar.
    const view = documentView()
    if (view !== null) {
      view.scrollBy(-dx, -dy)
      return
    }
    stage.scrollLeft -= dx
    stage.scrollTop -= dy
  }, [documentView])

  const [fileFigure, setFileFigure] = useState<LoadedFigure | null>(null)
  const [fileRasterSize, setFileRasterSize] = useState<{ readonly width: number; readonly height: number } | null>(null)
  /** Width a rendered document's frame is laid out at, in figure pixels. */
  const [htmlWidth, setHtmlWidth] = useState(RENDER_WIDTH)
  /** Whether the local document has reported one usable layout pass. */
  const [htmlMeasured, setHtmlMeasured] = useState(false)
  /**
   * How far the document inside its window has been scrolled, in figure pixels.
   *
   * A local document reports from its frame and a proxied page reports by message.
   * Both feed the same overlay shift, so marks stay in document pixels even while
   * only one windowful of those pixels is visible.
   */
  const [htmlScroll, setHtmlScroll] = useState({ x: 0, y: 0 })
  /** Number of scriptless slides this local document can turn, or zero for a page. */
  const [deckCount, setDeckCount] = useState(0)
  /** Zero-based index of the slide in front. */
  const [deckPage, setDeckPage] = useState(0)
  /** The current slide's own height, which replaces the pane height for a deck. */
  const [deckHeight, setDeckHeight] = useState(0)
  /** Boxes and visibility the interactive page has reported for saved elements. */
  const [previewShown, setPreviewShown] = useState<ShownMarks | null>(null)
  /** The logical slide the running page says is in front, when it has one. */
  const [liveSurface, setLiveSurface] = useState<string | null>(null)
  /**
   * Whether the running page has answered the "which surface is in front" question.
   *
   * A missing answer before the first report means "unknown", while a reported null
   * means "this page has no logical slides". The difference matters once a mark carries
   * a surface: an unknown page draws its saved marks as recorded, but a page that has
   * explicitly reported no surface must not put every slide's region on top of it.
   */
  const [liveSurfaceKnown, setLiveSurfaceKnown] = useState(false)
  const [figureError, setFigureError] = useState<string | null>(null)
  const frameRef = useRef<HTMLIFrameElement | null>(null)

  /**
   * The surface being annotated: the page a paged renderer supplied, else the
   * file's own figure. One value either way, so everything below reads one shape.
   */
  const surface = props.page
  /** Whether this body annotates one page of a document its owner persists. */
  const isPage = surface !== undefined
  // Every page a column renders is a body of its own, but only the one being read
  // carries the chrome: the others are the pages they are, and nothing more.
  const chrome = props.chrome !== false
  const figure: LoadedFigure | null = surface === undefined
    ? fileFigure
    : { kind: 'raster', objectUrl: surface.dataUrl, dataUrl: surface.dataUrl }
  const rasterSize = surface === undefined
    ? fileRasterSize
    : { width: surface.width, height: surface.height }
  const [loaded, setLoaded] = useState<LoadedAnnotation | null>(null)
  const [hostError, setHostError] = useState<string | null>(null)
  /**
   * There is no viewing mode. The figure is always ready to be drawn on: a reader
   * who opened it came to say something about it, and a mode switch they have to
   * remember to flip is a step between them and that. The one thing a mode used to
   * buy — not turning an idle drag into a stray arrow — is bought instead by the
   * armed tool starting on `select`.
   */
  /**
   * The armed tool.
   *
   * It starts on `select` — not on a drawing tool — for two reasons. An empty figure
   * offers nothing to draw on until the reader has decided what is wrong with it, and
   * an armed drawing tool turns every idle drag across the picture into a stray arrow.
   * The reader who does want to draw picks a tool; nobody is asked to un-draw by
   * accident.
   */
  const [tool, setTool] = useState<Tool>('select')
  /**
   * The preferences that outlive one figure: the drawing colour and the number style.
   *
   * Read once, on mount, so a reload comes back to what the reader last chose. They
   * are written back as they change rather than on unmount, because a reload is
   * exactly the moment there is no unmount to write from.
   */
  const remembered = useMemo(() => readPreferences(), [])
  const [color, setColor] = useState<string>(remembered.color ?? COLORS[0])
  const [weight, setWeight] = useState<number>(remembered.weight ?? WEIGHT_DEFAULT)
  /**
   * The marks and the trail behind them, as one machine.
   *
   * Kept together because no edit touches only one of the three: a commit pushes the
   * old marks onto the trail and drops the redo, an undo swaps a step across. Held as
   * separate state the surface could be left in a shape the reader never produced.
   */
  const history = useAnnotationHistory(props.draft?.marks ?? [])
  const marks = history.marks
  /**
   * What the list shows.
   *
   * One page of a paged document is handed the whole file's marks, because the list
   * is the map of what is about to be sent and what is sent is the file. A body
   * mounted on its own has only its own marks to show, which is the same thing said
   * with nothing extra.
   */
  const listedMarks = props.documentMarks ?? marks
  /**
   * What the document in the frame is showing, and the marks that belong to it.
   *
   * A rendered document is one file of many surfaces: a deck keeps every one of its
   * slides in it and shows one at a time, so a mark drawn on the second slide is still
   * a mark of the document — but it is not a mark about the third slide, and drawing it
   * there is a comment the reader never made. The document knows which of its elements
   * it is showing, so it is asked, every frame; only what it is showing is drawn.
   *
   * The list and the message keep the whole file. They are the map of what is being
   * sent, and a mark on another slide is exactly the kind of thing a reader wants to
   * find in it.
   */
  const staticShowing = useShownMarks(
    frameRef,
    marks,
    figure?.kind === 'html' && previewPage === null
      && marks.some(mark => mark.anchor?.selector !== undefined),
  )
  /**
   * A running page reports its logical surface separately from element boxes.
   *
   * Element boxes say where one selector is; this says which slide is in front.
   * Regions have no element selector, so this is the only fact that can keep a box
   * drawn on slide five from appearing over slide six.
   */
  const previewShowing = useMemo<ShownMarks | null>(() => {
    if (previewPage === null) return null
    if (previewShown === null && !liveSurfaceKnown) return null
    const boxes = previewShown?.boxes ?? new Map()
    const away = new Set(previewShown?.away ?? [])
    if (liveSurfaceKnown) {
      for (const mark of marks) {
        if (mark.surface !== undefined && mark.surface !== liveSurface) away.add(mark.id)
      }
    }
    return { boxes, away }
  }, [liveSurface, liveSurfaceKnown, marks, previewPage, previewShown])
  /** A cross-origin page reports the same facts by message; a same-origin one is read. */
  const showing = previewPage === null ? staticShowing : previewShowing
  const drawnMarks = useMemo(() => shownMarksOf(marks, showing), [marks, showing])
  /** The one mark a temporary hidden-layer reveal has put in front of the page. */
  const [temporaryMark, setTemporaryMark] = useState<AnnotationMark | null>(null)
  const [ownSelectedId, setOwnSelectedId] = useState<string | null>(null)
  /**
   * The selection, kept by the owner when there is one.
   *
   * A column mounts one body per page and moves the chrome between them as the
   * reader scrolls; a selection held here would be dropped at every page boundary,
   * and the comment pill would vanish under the sentence it belongs to.
   */
  const selectedId = props.selectedId === undefined ? ownSelectedId : props.selectedId
  /**
   * The selection, readable from a callback built by an earlier render.
   *
   * An updater has to read the selection as it is when it runs, not as it was when
   * the callback holding it was built: `removeMark` captures its dependencies once,
   * and a stale closure made it compare against a selection from before the reader
   * picked the row next to the one being deleted. Writing the value through a ref
   * keeps one stable callback honest without rebuilding it on every click.
   */
  const selectedRef = useRef<string | null>(selectedId)
  selectedRef.current = selectedId
  const setSelectedId = useCallback((next: string | null | ((current: string | null) => string | null)): void => {
    const value = typeof next === 'function' ? next(selectedRef.current) : next
    if (props.onSelectedIdChange === undefined) setOwnSelectedId(value)
    else props.onSelectedIdChange(value)
  }, [props.onSelectedIdChange])
  /**
   * What the overlay may draw while a temporary reveal is open.
   *
   * A cover can be lifted over a slide without changing which slide the page reports
   * as live. The slide's elements are then still visible to their own surface and
   * bounds measurements, but they are underneath the cover the reader asked to see.
   */
  const visibleMarks = useMemo(() => {
    if (temporaryMark === null) return drawnMarks
    return [drawnMarks.find(candidate => candidate.id === temporaryMark.id) ?? temporaryMark]
  }, [drawnMarks, temporaryMark])
  /** The mark whose detail box should take the caret once it is on screen. */
  const [focusId, setFocusId] = useState<string | null>(null)
  /**
   * Ask the owner to turn to a mark's page, when this body is one page of a document.
   *
   * The list is the document's, so a row can name a mark that is not on the page in
   * view. The owner keeps the page number, so it is the owner that has to turn —
   * and it must happen before the selection lands, or the pill would be measured
   * against a page the mark is not on.
   */
  const revealOnPage = useCallback((mark: AnnotationMark): void => {
    if (props.onRevealMark === undefined || mark.page === undefined) return
    props.onRevealMark(mark)
  }, [props.onRevealMark])
  /**
   * What the figure shows, as context for the marks below it.
   *
   * One per figure rather than one per mark: it is never drawn, and its only job
   * is to make the numbered per-mark details readable. An owner that keeps one for
   * a whole document supplies it (and takes every change back); on its own the body
   * owns it, as it does for a single-surface figure.
   */
  const [ownSummary, setOwnSummary] = useState('')
  const summary = props.summary ?? ownSummary
  const writeSummary = props.onSummaryChange ?? setOwnSummary
  const [createdAt, setCreatedAt] = useState<string | null>(null)
  const [stale, setStale] = useState(false)
  /**
   * The file's annotation while a proxied page is in the frame.
   *
   * Visiting a page is a temporary change of surface, not the reader clearing the
   * file they came from. This checkpoint lets the back action restore the file
   * instead of treating an empty page as an empty sidecar and deleting work.
   */
  const fileBeforeLive = useRef<{
    readonly marks: readonly AnnotationMark[]
    readonly summary: string
    readonly createdAt: string | null
  } | null>(null)
  /**
   * Which popover is showing, if any.
   *
   * One at a time, and this is deliberate: they all hang off the same strip near the
   * figure's edge, so two of them open at once simply cover each other and the
   * second one's own close button. Opening any popover closes whatever was open;
   * opening the one already showing closes it, so the button toggles.
   */
  const [ownPanel, setOwnPanel] = useState<'style' | 'goal' | 'list' | null>(null)
  /** The open card, kept by the owner when there is one, for the reason above. */
  const openPanel = props.openPanel === undefined ? ownPanel : props.openPanel
  const setOpenPanel = useCallback((next: 'style' | 'goal' | 'list' | null | ((current: 'style' | 'goal' | 'list' | null) => 'style' | 'goal' | 'list' | null)): void => {
    const value = typeof next === 'function' ? next(openPanel) : next
    if (props.onOpenPanelChange === undefined) setOwnPanel(value)
    else props.onOpenPanelChange(value)
  }, [openPanel, props.onOpenPanelChange])
  const styleOpen = openPanel === 'style'
  const goalOpen = openPanel === 'goal'
  const listOpen = openPanel === 'list'
  /**
   * Where the selected mark's detail card sits, in the panel's coordinates.
   *
   * Measured rather than derived: the figure is drawn at a factor inside a
   * scrollport, so the only reliable way from a mark's figure pixels to a place in
   * the panel is to read both boxes back from the browser. `null` until it has
   * been measured, which is also what keeps the card off screen for the one frame
   * before its position is known.
   */
  const [detailAt, setDetailAt] = useState<{ readonly left: number; readonly top: number } | null>(null)
  /**
   * The selected mark as a drag is currently shaping it.
   *
   * Kept beside the stored marks rather than in them: the gesture is not committed
   * until it is released, so writing it into the list would make every frame an
   * undoable edit. It exists only so the pill can follow the hand.
   */
  const [liveMark, setLiveMark] = useState<AnnotationMark | null>(null)
  /**
   * Keep the drawing choices on the reader's machine as they change.
   *
   * Written here rather than on unmount because a reload has no unmount: the moment
   * the reader picks a colour is the moment it has to be safe. Storage failures are
   * swallowed inside `rememberPreferences` — losing a colour is not worth an error.
   */
  /**
   * The factor this figure is drawn at.
   *
   * An owner that magnifies the whole document hands the factor in and takes every
   * gesture back, so the size follows the reader from page to page instead of
   * restarting at fit on each sheet. A body mounted alone keeps its own.
   */
  const [ownZoom, setOwnZoom] = useState<number | 'fit'>('fit')
  const zoom = props.zoom ?? ownZoom
  const setZoom = useCallback((next: number | 'fit'): void => {
    if (props.onZoom === undefined) setOwnZoom(next)
    else props.onZoom(next)
  }, [props.onZoom])
  /**
   * Whether a drag is currently moving the view.
   *
   * Its only job is the cursor: a hand that has closed on the table has to look
   * different from one hovering over it, or the reader cannot tell whether the
   * gesture took.
   */
  const [panning, setPanning] = useState(false)
  const [fitWidth, setFitWidth] = useState(0)
  /**
   * The pane's own height, beside its width.
   *
   * A rendered document's window is the pane in both directions: without this the
   * document would be given a height of its own content, which is the one thing a
   * viewport must never be.
   */
  const [fitHeight, setFitHeight] = useState(0)
  const [busy, setBusy] = useState<'sending' | null>(null)
  /**
   * The news of the last few clicks, newest first.
   *
   * It is a stack rather than one line because two things can happen before the reader
   * looks at the panel — a save that failed and a handoff that went through — and the
   * second used to overwrite the first. A failure stays; the rest leave on their own.
   */
  /**
   * The bubbles over the figure.
   *
   * A bubble is news, not a control, so it lives beside the panel rather than in it:
   * the stack owns its own timers and takes no pointer events that are not aimed at
   * one of its buttons. `setStatus` is the plain way in — one sentence, no task, gone
   * in a few seconds — and is what every condition and every failure detail uses.
   */
  const toasts = useToasts(t)
  /** Say something over the figure, without moving it. */
  const setStatus = toasts.note
  /** Where the figure's context menu was asked for, or null when it is closed. */
  const [menuAt, setMenuAt] = useState<{
    left: number
    top: number
    path: string
    workspace: string | null
  } | null>(null)
  /** Whether this Host can open and reveal paths; read once per mount. */
  const [canOpen, setCanOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  /** The panel's own box, for placing the cards that float over it. */
  const rootRef = useRef<HTMLDivElement | null>(null)
  /** The canvas's input face, used by the one Escape hierarchy in this body. */
  const canvasInput = useRef<CanvasInput | null>(null)

  /**
   * Where the palette is parked, as fractions of the panel.
   *
   * The tools are the one group a reader reaches for over and over while looking at
   * a particular corner of the figure, so they float: the palette can be dragged
   * off that corner and stays where it was put, across reloads. Fractions rather
   * than pixels, because the pane is resizable and a position in pixels would walk
   * off the edge when it narrows.
   */
  const [palette, setPalette] = useState<PaletteSpot | undefined>(remembered.palette)
  /** A measured ceiling used only when a short panel cannot otherwise separate the strips. */
  const [paletteLimit, setPaletteLimit] = useState<number | undefined>(undefined)
  /** The current palette spot, read by the resize guard without being its trigger. */
  const parkedPalette = useRef(palette)
  parkedPalette.current = palette
  const paletteRef = useRef<HTMLDivElement | null>(null)
  const [dragging, setDragging] = useState(false)
  /** A press is held even before it crosses the movement threshold. */
  const [stripHeld, setStripHeld] = useState(false)
  const dragFrom = useRef<StripDrag | null>(null)
  /** The one strip gesture allowed to exist at a time. */
  const dragOwner = useRef<'palette' | 'bar' | null>(null)
  /** The palette's box, in percentages of the panel. */
  const paletteStyle: CSSProperties = {
    ...placementStyle(palette ?? DEFAULT_PALETTE),
    ...(paletteLimit === undefined ? {} : { maxHeight: `${paletteLimit}px` }),
  }

  /**
   * The floating bar's own spot, and the bits a drag of it needs.
   *
   * The bar starts where a bar belongs — centred along the bottom — and can be
   * dragged off that edge when it covers the part of the figure being worked on.
   * Its default is not a fraction of the panel but an anchor to the bottom edge, so
   * that widening the pane keeps it centred rather than walking it sideways.
   */
  const [barSpot, setBarSpot] = useState<PaletteSpot | undefined>(remembered.bar)
  /** The current parking spot, read by the resize guard without making it a trigger. */
  const parkedBar = useRef(barSpot)
  parkedBar.current = barSpot
  const [barDragging, setBarDragging] = useState(false)
  const barFrom = useRef<StripDrag | null>(null)
  /**
   * Follow the pointer that is dragging a floating strip.
   *
   * Both strips move the same way, so both call this: the origin is the strip's
   * position when the press started, and the offset is measured against the panel
   * rather than the strip, because moving the strip must not move the frame the
   * next position is measured in.
   * @param event - the pointer event that is moving the strip.
   * @param from - which strip's press is in progress.
   * @param write - where its new spot goes.
   * @param start - enter the visible dragging state once the slop is crossed.
   */
  const followPointer = useCallback((
    event: ReactPointerEvent<HTMLDivElement>,
    from: { current: StripDrag | null },
    write: (spot: PaletteSpot | undefined) => void,
    start: () => void,
    strip: HTMLElement | null,
  ): void => {
    const held = from.current
    // Measured against the box the strip is actually placed in, which is not always
    // this body's own: a paged document portals the chrome into the pane, and a
    // fraction of the page applied inside the pane walks the strip off its edge.
    const root = strip?.offsetParent ?? rootRef.current
    // A move without a press on the handle is not a drag of ours.
    /* v8 ignore next */
    if (held === null || event.pointerId !== held.pointerId
      || root === null || !(root instanceof Element)) return
    if (held.current === null
      && Math.hypot(event.clientX - held.box.left, event.clientY - held.box.top) < 3) return
    const bounds = root.getBoundingClientRect()
    const own = strip?.getBoundingClientRect()
    /* v8 ignore next -- both call sites hold a live ref for the whole drag. */
    const width = own?.width ?? 0
    /* v8 ignore next -- both call sites hold a live ref for the whole drag. */
    const height = own?.height ?? 0
    const crossingSlop = held.current === null
    if (crossingSlop) start()
    const spot = draggedSpot(held, event, bounds, { width, height })
    held.current = spot
    write(spot)
  }, [])
  const dragPalette = useCallback((event: ReactPointerEvent<HTMLDivElement>): void => {
    event.preventDefault()
    followPointer(
      event,
      dragFrom,
      setPalette,
      () => { setDragging(true) },
      paletteRef.current,
    )
  }, [followPointer])
  const dragBar = useCallback((event: ReactPointerEvent<HTMLDivElement>): void => {
    event.preventDefault()
    followPointer(
      event,
      barFrom,
      setBarSpot,
      () => { setBarDragging(true) },
      barRef.current,
    )
  }, [followPointer])
  /**
   * Finish a drag with the strip's magnetic edge dock.
   *
   * Moving from the live drag into the parked state is deliberately split in two:
   * pointer moves are pixel-for-pixel direct, and only the release may settle onto a
   * gutter. The saved spot is the settled one, so reopening the panel does not reveal
   * a quarter-pixel parking position that the drag itself never showed as deliberate.
   */
  const settleStrip = useCallback((
    current: PaletteSpot,
    write: (spot: PaletteSpot | undefined) => void,
    strip: HTMLElement | null,
    other: HTMLElement | null,
  ): void => {
    const panel = strip?.offsetParent ?? rootRef.current
    /* v8 ignore next -- a mounted grip always has both boxes. */
    if (strip === null || panel === null || !(panel instanceof Element)) return
    const panelBox = panel.getBoundingClientRect()
    const own = strip.getBoundingClientRect()
    /* v8 ignore next -- an unmeasured strip is not visible enough to drag. */
    if (panelBox.width <= 0 || panelBox.height <= 0 || own.width <= 0 || own.height <= 0) return
    write(settledSpot(
      current,
      panelBox,
      own,
      other?.getBoundingClientRect(),
    ))
  }, [])

  /**
   * Abandon a strip drag and put it back where the press found it.
   *
   * A pointer that is cancelled, loses capture, or belongs to a window that stops
   * being visible has no trustworthy release position. Leaving the strip at the last
   * move would turn that interruption into a permanent parking decision, so the only
   * honest result is the place it occupied before the press.
   */
  const cancelStripDrag = useCallback((
    from: { current: StripDrag | null },
    write: (spot: PaletteSpot | undefined) => void,
    stop: (moving: boolean) => void,
    event?: ReactPointerEvent<HTMLDivElement>,
  ): void => {
    const held = from.current
    if (held === null || (event !== undefined && event.pointerId !== held.pointerId)) return
    from.current = null
    dragOwner.current = null
    setStripHeld(false)
    write(held.restore)
    stop(false)
    if (event !== undefined
      && typeof event.currentTarget.hasPointerCapture === 'function'
      && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }, [])

  /**
   * The palette's drag, as one bundle.
   *
   * A strip's handle takes four handlers that all have to agree about the same
   * press, and the two strips differ only in which ref and which setter they use —
   * so each bundle is assembled once here rather than inline in the markup, where
   * the press would be remembered against whichever render happened to be current.
   */
  const paletteHandle: StripHandle = {
    dragging,
    onDown: (event) => {
      if (dragOwner.current !== null || event.isPrimary === false
        || (event.pointerType === 'mouse' && event.button !== 0)) return
      event.preventDefault()
      /* v8 ignore next -- nothing to measure against until the panel is mounted. */
      if (rootRef.current === null) return
      const tools = paletteRef.current
      /* v8 ignore next -- a mounted grip belongs to a mounted strip. */
      if (tools === null) return
      /* v8 ignore next -- jsdom has no pointer capture; a browser always does. */
      event.currentTarget.setPointerCapture?.(event.pointerId)
      const panel = tools.offsetParent ?? rootRef.current
      dragFrom.current = {
        pointerId: event.pointerId,
        restore: parkedPalette.current,
        // Read the strip's current visual corner rather than its saved destination.
        // A resize or release may still be easing when the reader grabs it; using the
        // destination here makes the first pointer move jump backwards along that
        // transition.
        origin: spotOfBox(tools.getBoundingClientRect(), panel.getBoundingClientRect()),
        box: { left: event.clientX, top: event.clientY } as DOMRect,
        current: null,
      }
      dragOwner.current = 'palette'
      setStripHeld(true)
    },
    onMove: dragPalette,
    onUp: (event) => {
      const held = dragFrom.current
      if (held === null || event.pointerId !== held.pointerId) return
      const current = held.current
      if (current !== null) {
        settleStrip(current, setPalette, paletteRef.current, barRef.current)
      }
      dragFrom.current = null
      dragOwner.current = null
      setStripHeld(false)
      setDragging(false)
      /* v8 ignore next -- jsdom has no pointer capture; a browser always does. */
      event.currentTarget.releasePointerCapture?.(event.pointerId)
    },
    onCancel: (event) => {
      cancelStripDrag(dragFrom, setPalette, setDragging, event)
    },
    onLost: (event) => {
      cancelStripDrag(dragFrom, setPalette, setDragging, event)
    },
  }

  /**
   * The bar's drag, on the same terms as the palette's — except for where it starts.
   *
   * The bar has no spot until the reader parks it: the stylesheet puts it on the
   * bottom edge, centred. Starting its first drag from the palette's default corner
   * (which is what `barSpot ?? DEFAULT_PALETTE` did) made the strip jump from the
   * bottom to that corner on the first pixel of travel. It starts from its own box.
   */
  const barHandle: StripHandle = {
    dragging: barDragging,
    onDown: (event) => {
      if (dragOwner.current !== null || event.isPrimary === false
        || (event.pointerType === 'mouse' && event.button !== 0)) return
      event.preventDefault()
      const root = rootRef.current
      /* v8 ignore next -- nothing to measure against until the panel is mounted. */
      if (root === null) return
      /* v8 ignore next -- jsdom has no pointer capture; a browser always does. */
      event.currentTarget.setPointerCapture?.(event.pointerId)
      const bar = barRef.current
      /* v8 ignore next -- the grip is the bar's own child; the bar is mounted here. */
      if (bar === null) return
      // A paged document portals the strips into its pane. That pane, not this
      // body, is what their percentages and pointer deltas are measured against.
      const panel = bar.offsetParent ?? root
      barFrom.current = {
        pointerId: event.pointerId,
        restore: parkedBar.current,
        // Always begin from the corner that is actually painted. If a resize or a
        // magnetic release is still in motion, this is between its old and new
        // fractions; the saved destination would make the bar jump on first move.
        origin: spotOfBox(bar.getBoundingClientRect(), panel.getBoundingClientRect()),
        box: { left: event.clientX, top: event.clientY } as DOMRect,
        current: null,
      }
      dragOwner.current = 'bar'
      setStripHeld(true)
    },
    onMove: dragBar,
    onUp: (event) => {
      const held = barFrom.current
      if (held === null || event.pointerId !== held.pointerId) return
      const current = held.current
      if (current !== null) {
        settleStrip(current, setBarSpot, barRef.current, paletteRef.current)
      }
      barFrom.current = null
      dragOwner.current = null
      setStripHeld(false)
      setBarDragging(false)
      /* v8 ignore next -- jsdom has no pointer capture; a browser always does. */
      event.currentTarget.releasePointerCapture?.(event.pointerId)
    },
    onCancel: (event) => {
      cancelStripDrag(barFrom, setBarSpot, setBarDragging, event)
    },
    onLost: (event) => {
      cancelStripDrag(barFrom, setBarSpot, setBarDragging, event)
    },
  }

  useEffect(() => {
    if (!stripHeld) return
    const stop = (): void => {
      if (dragFrom.current !== null) {
        cancelStripDrag(dragFrom, setPalette, setDragging)
      }
      if (barFrom.current !== null) {
        cancelStripDrag(barFrom, setBarSpot, setBarDragging)
      }
    }
    const onVisibility = (): void => {
      if (document.visibilityState === 'hidden') stop()
    }
    window.addEventListener('blur', stop)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('blur', stop)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [cancelStripDrag, stripHeld])

  useEffect(() => {
    // A pointer move is already a layout update. Writing storage from every one adds
    // synchronous main-thread work under the hand; persist the final parked position
    // when the drag ends instead.
    if (dragging || barDragging) return
    rememberPreferences({ color, weight, ...(palette === undefined ? {} : { palette }), ...(barSpot === undefined ? {} : { bar: barSpot }) })
  }, [barDragging, barSpot, color, dragging, palette, weight])

  /**
   * The bar's box, when the reader has moved it off the bottom edge.
   *
   * Until they do, the bar is placed by the stylesheet against the bottom edge and
   * centred — an anchored default, so a wider pane keeps it centred. Once it has
   * been dragged it is placed by fractions like the palette, and the same
   * edge-flipping transform keeps its far corner on the panel.
   */
  const barStyle: CSSProperties | undefined = barSpot === undefined
    ? undefined
    : placementStyle(barSpot)

  useEffect(() => { ensureStyles(document) }, [])

  const data = props.content?.kind === 'bytes' ? props.content.data : undefined

  const layer = useMemo(() => figureLayer(figure, rasterSize), [figure, rasterSize])

  /**
   * The size of the rendered surface.
   *
   * A normal rendered document is a window, not a sheet: its width is the layout width
   * the document asks for and its height is one pane. A scriptless deck is different:
   * one slide is put in front, and the frame takes that slide's own height. The frame
   * is then a page, not a viewport clipped through the middle of a 1080px slide.
   */
  const htmlView = useMemo(() => {
    if (previewPage !== null) {
      return fitWidth === 0 || fitHeight === 0 ? null : { width: fitWidth, height: fitHeight }
    }
    const height = deckHeight > 0 ? deckHeight : fitHeight
    return !htmlMeasured || height === 0 ? null : { width: htmlWidth, height }
  }, [deckHeight, fitHeight, fitWidth, htmlMeasured, htmlWidth, previewPage])

  /**
   * The surface's measurable size; null until its content and dimensions are both
   * known. A rendered document's surface is the window it is shown through.
   */
  const size = useMemo(
    () => figureSize(figure, rasterSize, htmlView),
    [figure, htmlView, rasterSize],
  )
  /**
   * How big everything drawn is, as a multiple of the base sizes.
   *
   * One number for the whole surface: the pen, the pins and the review image all
   * have to agree, and a stroke is only bold or thin relative to the figure it sits
   * on. A 4000px scan and a 300px thumbnail get the same-looking mark this way.
   */
  const unit = size === null ? 1 : figureUnit(size.width, size.height)
  /**
   * The paper the drawing needs: the figure, plus anywhere the marks reach past it.
   *
   * A reader boxing the margin a plot clips, or flagging a spot just outside the
   * axes, is drawing something the figure does not contain. The paper grows to hold
   * it rather than the mark being clipped — and because the surface is white, a mark
   * out there lands on paper instead of on nothing.
   *
   * A rendered document is a window and grows for nothing: the page inside it scrolls.
   */
  const paper = size === null
    ? null
    : figure?.kind === 'html'
      ? { x: 0, y: 0, width: size.width, height: size.height }
      : plotBounds(size.width, size.height, marks, unit)

  /**
   * Everything a background write needs, read at write time.
   *
   * A write runs from a timer that outlives the render that scheduled it, so it has
   * to read the surface's state as it is now. Closing over it would write whatever
   * was on screen six hundred milliseconds ago — which is exactly the edit the
   * reader just made.
   */
  const live = useRef({ address, createdAt, livePage, loaded, marks, size, summary })
  live.current = { address, createdAt, livePage, loaded, marks, size, summary }

  useEffect(() => {
    liveMounted.current = true
    return () => {
      liveMounted.current = false
      liveOpenGeneration.current += 1
      // StrictMode exercises cleanup and immediately mounts again. Wait one task so
      // that probe does not close a proxy the remounted body is still showing.
      queueMicrotask(() => {
        if (!liveMounted.current && live.current.livePage !== null) {
          void closeLivePage(live.current.livePage.url).catch(() => { /* the proxy may already be gone. */ })
        }
      })
    }
  }, [])

  /**
   * The signature of what is already on disk.
   *
   * A load is not an edit: reading a sidecar must not immediately write it back.
   * Every write and every clear records its result here, and a render whose
   * signature matches produces no request at all.
   */
  const writtenSignature = useRef<string | null>(null)

  // --- figure loading -------------------------------------------------------

  useEffect(() => {
    // A page surface arrives rendered, so the file's bytes are not this body's
    // to decode: decoding them here would fight the renderer that owns them.
    if (surface !== undefined) return
    if (props.livePage !== undefined) {
      setLoaded({
        path: props.livePage.address,
        mediaType: 'text/html',
        sha256: `live:${props.livePage.address}`,
        annotation: null,
        unreadable: [],
        workspace: null,
      })
      setFileFigure({ kind: 'html', document: '' })
      setHostError(null)
      return
    }
    if (data === undefined || mediaType === undefined) return
    const decoded = decodeFigure(data, mediaType)
    const loaded = decoded.figure
    if (loaded === undefined) {
      setFigureError(t('loadFailed'))
      return
    }
    if (loaded.kind === 'html') {
      // A new document starts at the contracted layout width and the top of its
      // window, so marks are not described against the last document's geometry.
      setHtmlWidth(RENDER_WIDTH)
      setHtmlMeasured(false)
      setHtmlScroll({ x: 0, y: 0 })
      setDeckCount(0)
      setDeckPage(0)
      setDeckHeight(0)
      setFigureError(null)
    }
    // A raster has no size until the browser has decoded it, and this is a new one.
    if (loaded.kind === 'raster') setFileRasterSize(null)
    setFileFigure(loaded)
    if (loaded.kind !== 'raster') return
    return () => { URL.revokeObjectURL(loaded.objectUrl) }
  }, [data, mediaType, props.livePage, surface, t])

  // --- rendered document ----------------------------------------------------

  /** The document to load into the frame, or null when this body holds no document. */
  const htmlSource = figure?.kind === 'html' && previewPage === null ? figure.document : null

  /**
   * Put the prepared document into the frame and learn the size it needs.
   *
   * A normal page is a same-origin window one pane tall and scrolls inside itself. A
   * conventional slide deck gets one page shown at a time by {@link prepareDeck}; its
   * frame takes that slide's whole size so the outer fit can show the entire page
   * rather than a crop through the middle of it.
   */
  useEffect(() => {
    if (htmlSource === null) return
    const frame = frameRef.current
    const root = loadFrameDocument(frame, htmlSource)
    if (root === undefined) return
    const deck = prepareDeck(root)
    setDeckCount(deck?.count ?? 0)
    setDeckPage(deck?.index ?? 0)
    const measure = (): void => {
      const slide = deck === undefined ? undefined : deckSlideSize(root)
      // A document that has laid out nothing yet reports no size; the last
      // measurement stands rather than the window collapsing to nothing.
      if (slide !== undefined) {
        setHtmlWidth(slide.width)
        setDeckHeight(slide.height)
        setHtmlMeasured(true)
        return
      }
      const measured = measureFrameContent(frame)
      if (measured === undefined) return
      if (measured.width > 0) setHtmlWidth(current => Math.max(current, measured.width))
      if (deck !== undefined) setDeckHeight(measured.height)
      setHtmlMeasured(true)
    }
    measure()
    const view = frame?.contentWindow ?? null
    const syncScroll = (): void => {
      if (view === null) return
      setHtmlScroll({ x: view.scrollX, y: view.scrollY })
    }
    view?.addEventListener('scroll', syncScroll, { passive: true })
    syncScroll()
    // Content that arrives later — a font, an image, a reflow — changes the layout.
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    return () => {
      observer.disconnect()
      view?.removeEventListener('scroll', syncScroll)
    }
  }, [htmlSource])

  /**
   * Turn a prepared deck to another slide.
   *
   * The document's own script is deliberately not running, so this is the one place
   * that changes which slide is in front. The selected mark belongs to the surface the
   * reader left, so it is cleared before the new page is measured.
   */
  const turnDeck = useCallback((next: number | ((page: number) => number)): void => {
    const wanted = typeof next === 'function' ? next(deckPage) : next
    const target = Math.max(0, Math.min(deckCount - 1, wanted))
    if (target === deckPage) return
    const root = frameRef.current?.contentDocument?.documentElement
    if (root === undefined) return
    const slide = showDeckSlide(root, target)
    if (slide === undefined) return
    setDeckPage(target)
    setSelectedId(null)
    setHtmlScroll({ x: 0, y: 0 })
    const size = deckSlideSize(root)
    if (size !== undefined) {
      setHtmlWidth(size.width)
      setDeckHeight(size.height)
      setHtmlMeasured(true)
    }
  }, [deckCount, deckPage, setSelectedId])

  useEffect(() => {
    if (deckCount < 2) return
    // The frame has its own window and therefore its own HTMLElement constructor.
    // `instanceof HTMLElement` is false for every field inside it, so detect the
    // editing surface by the shape both realms share.
    const typing = (target: EventTarget | null): boolean => {
      const field = target as { readonly isContentEditable?: boolean; readonly tagName?: string } | null
      return field !== null && (field.isContentEditable === true
        || field.tagName === 'INPUT'
        || field.tagName === 'TEXTAREA'
        || field.tagName === 'SELECT')
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (typing(event.target)) return
      if (event.key === 'ArrowRight' || event.key === 'PageDown') {
        event.preventDefault()
        turnDeck(page => page + 1)
      } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault()
        turnDeck(page => page - 1)
      } else if (event.key === 'Home') {
        event.preventDefault()
        turnDeck(0)
      } else if (event.key === 'End') {
        event.preventDefault()
        turnDeck(deckCount - 1)
      }
    }
    const frameDocument = frameRef.current?.contentDocument
    frameDocument?.addEventListener('keydown', onKeyDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      frameDocument?.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [deckCount, turnDeck])

  // --- host annotation ------------------------------------------------------

  /**
   * The address this body last read an annotation for.
   *
   * The panel is registered once and not remounted per document, so this body can
   * outlive the figure it was opened on. Reading for a new address is therefore not
   * the same event as reading for the first time: the first read adopts what was
   * saved over whatever draft this body was seeded with, while a read for a
   * *different* document has to throw the previous one's state away first. Null
   * means "no read yet", which no address can be.
   */
  const readFor = useRef<string | null>(null)

  /**
   * The marks the surface opened with, for telling a stroke from a restored one.
   *
   * The read adopts the file over the draft, and the only marks that must survive that
   * are the ones drawn while the answer was in flight: not the seeded draft, which the
   * file supersedes, and not anything the file names. Kept in a ref so the read effect
   * does not fetch again when a stroke changes the marks.
   */
  const seeded = useRef<readonly AnnotationMark[]>(props.draft?.marks ?? [])

  /**
   * The selection setter, read at call time.
   *
   * `setSelectedId` is rebuilt when the selection changes, so depending on it in the
   * read effect would fetch the annotation again on every press. The effect wants the
   * current setter, not the one it closed over.
   */
  const selectRef = useRef(setSelectedId)
  selectRef.current = setSelectedId

  useEffect(() => {
    // A page body is one page of a document its owner persists, and the owner has
    // already read the whole sidecar: reading it here would put every page's marks
    // on the page on screen.
    if (isPage) return
    if (props.livePage !== undefined) return
    if (address === '' || mediaType === undefined) return
    const controller = new AbortController()
    void (async () => {
      try {
        const result = await loadAnnotation(address, controller.signal)
        if (controller.signal.aborted) return
        // Read before the assignment below: this is the only place that can tell a
        // first read from a change of document, and a change of document from the
        // same one being read again.
        const first = readFor.current === null
        const replaces = readFor.current !== null && readFor.current !== address
        readFor.current = address
        setLoaded(result)
        setHostError(null)
        const saved = result.annotation
        if (replaces) {
          // A different document's state is whatever it was saved with, and nothing
          // of this body's previous document survives: not its marks, not its
          // sentence, not its timestamp, and not its place on the undo trail. The
          // empty values matter as much as the loaded ones — a figure that was never
          // annotated has to come out clean rather than wearing the last one's marks.
          history.reset(saved?.marks ?? [])
          writeSummary(saved?.summary ?? '')
          setCreatedAt(saved?.createdAt ?? null)
          selectRef.current(null)
          // What was just read is now the baseline: a signature left over from the
          // previous document describes a file that is not this one.
          writtenSignature.current = null
        } else if (first && saved !== null) {
          // The first read adopts what was saved over the draft this body was seeded
          // with — the file is the record, and the draft only filled the gap while
          // the answer was in flight. A figure is drawable before the read lands, so a
          // stroke drawn in that window is not in the draft and the file cannot name
          // it; adopting the file wholesale threw it away with nothing to walk back
          // to. Both stacks stay as they are: nothing came back that was not already
          // there, and the marks that arrived over a stroke are that stroke's context.
          history.replace(loadedMarks(saved.marks, live.current.marks, seeded.current))
          writeSummary(saved.summary ?? '')
          // The saved document's number style describes the picture on screen, so it
          // wins over the remembered preference: the annotation and its image have to
          // agree. A document that never recorded one leaves the preference in place.
          setCreatedAt(saved.createdAt)
        }
        // Reading the same document again is a re-check of the file's identity, not a
        // second load: the marks on screen are the reader's, and the answer that just
        // arrived has nothing newer to say about them.
        setStale(saved === null ? false : saved.figure.sha256 !== result.sha256)
      } catch (error) {
        if (controller.signal.aborted) return
        setHostError(error instanceof AnnotatorHostError ? error.message : String(error))
      }
    })()
    return () => { controller.abort() }
  }, [address, isPage, mediaType, props.livePage, writeSummary])

  // --- fit width ------------------------------------------------------------

  useEffect(() => {
    const stage = stageRef.current
    if (stage === null) return
    // The stage's own padding, so what is measured is the pane the reader sees rather
    // than a box whose bottom edge is scrolled out of sight.
    // A pane smaller than its own insets has no room to show anything, and a negative
    // window is not a window: it is held at nothing, which makes an empty pane "not
    // measured yet" rather than a negative viewport. The bottom inset includes the
    // floating bar's room, so fitting the height does not put the paper under it.
    const measure = (): void => {
      setFitWidth(Math.max(0, stage.clientWidth - STAGE_PADDING * 2))
      setFitHeight(Math.max(0, stage.clientHeight - STAGE_PADDING - STAGE_BOTTOM_INSET))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(stage)
    return () => { observer.disconnect() }
  }, [])

  const scale = useMemo(
    // The paper, not the figure: the paper is what the surface is laid out at, so
    // fitting the figure left the panel wider than its box as soon as a mark reached
    // past the figure's edge.
    () => drawingScale({
      zoom,
      fitWidth,
      fitHeight,
      surface: paper,
      ownerWidth: props.fitWidth,
    }),
    [zoom, fitWidth, fitHeight, paper, props.fitWidth],
  )
  /** Whether the paper currently extends beyond the viewport in either direction. */
  const pannable = paper !== null
    && (paper.width * scale > fitWidth + 1 || paper.height * scale > fitHeight + 1)

  /**
   * Keep both parked strips inside a panel whose shape has changed.
   *
   * A saved fraction survives a resize, but a wide strip can still grow past the
   * right or bottom edge because only its anchor is stored. The first duty here is
   * therefore body-aware clamping. A strip that would then cover the other strip slides
   * only far enough to clear it; covering the drawing is allowed because the reader may
   * have parked it there deliberately. This runs for every resting layout decision,
   * never under the reader's current drag.
   */
  useLayoutEffect(() => {
    let live = true
    const settle = (): void => {
      if (!live) return
      // A resize can hand us its second layout frame while the reader has already
      // grabbed a strip. Repairing against that frame used to overwrite the live drag
      // with the old parked spot, which looked like the control jumping back.
      if (dragFrom.current !== null || barFrom.current !== null) return
      const root = rootRef.current
      const bar = barRef.current
      const tools = paletteRef.current
      /* v8 ignore next -- the chrome and the frame are mounted together. */
      if (root === null || bar === null) return
      const paletteSpot = parkedPalette.current
      const barSpot = parkedBar.current
      let fittedPalette = paletteSpot
      if (paletteSpot !== undefined && tools !== null) {
        const panel = tools.offsetParent ?? root
        const panelBox = panel.getBoundingClientRect()
        const own = tools.getBoundingClientRect()
        if (panelBox.width <= 0 || panelBox.height <= 0 || own.width <= 0 || own.height <= 0) {
          // The first layout frame can report zeroes; moving a saved spot against
          // those numbers would erase it before the panel has a size.
        } else {
          const fitted = clampedSpot(paletteSpot, panelBox, own)
          if (fitted.x !== paletteSpot.x || fitted.y !== paletteSpot.y) setPalette(fitted)
          fittedPalette = fitted
        }
      }
      if (barSpot === undefined) {
        /* v8 ignore next -- the palette and bar are mounted and removed together. */
        if (tools === null) return
        const panel = tools.offsetParent ?? root
        const panelBox = panel.getBoundingClientRect()
        const measured = tools.getBoundingClientRect()
        // The first layout frame can report a panel or strip with no body. A zero
        // obstacle looks collision-free, and running the arithmetic on it rewrites a
        // remembered corner as 0,0 before the browser has laid the chrome out.
        if (panelBox.width <= 0 || panelBox.height <= 0
          || measured.width <= 0 || measured.height <= 0) return
        // Once capped, the visible box is shorter than the tools it contains. Collision
        // and subsequent resizes must reason about the natural strip, or the cap itself
        // makes the next layout pass look collision-free and immediately removes it.
        const toolsBox = {
          left: measured.left,
          top: measured.top,
          width: measured.width,
          height: Math.max(measured.height, tools.scrollHeight),
        }
        const paletteAnchor = fittedPalette ?? DEFAULT_PALETTE
        const barBox = bar.getBoundingClientRect()
        const safe = separatedSpot(
          paletteAnchor,
          panelBox,
          toolsBox,
          barBox,
        )
        if (safe === undefined) {
          // Both controls are essential. Moving the palette cannot clear a bar that
          // spans the whole lower lane, so let the palette scroll above it instead
          // of painting the bar over its last tools and Send.
          const limit = paletteRoomBeforeBar(toolsBox, barBox)
          if (limit === undefined) {
            setPaletteLimit(undefined)
            setPalette(DEFAULT_PALETTE)
          } else if (limit !== paletteLimit) {
            setPaletteLimit(limit)
          }
        } else {
          setPaletteLimit(undefined)
          if (fittedPalette !== undefined
            && (safe.x !== fittedPalette.x || safe.y !== fittedPalette.y)) {
            setPalette(safe)
          }
        }
        return
      }
      const panel = bar.offsetParent ?? root
      const panelBox = panel.getBoundingClientRect()
      const own = bar.getBoundingClientRect()
      if (panelBox.width <= 0 || panelBox.height <= 0 || own.width <= 0 || own.height <= 0) return
      const fitted = clampedSpot(barSpot, panelBox, own)
      if (fitted.x !== barSpot.x || fitted.y !== barSpot.y) {
        setBarSpot(fitted)
        return
      }
      // The two strips must remain individually grabbable. A panel too small to
      // separate them falls back to the bar's reserved lane.
      /* v8 ignore next -- the palette and bar are mounted and removed together. */
      if (tools === null) return
      const measured = tools.getBoundingClientRect()
      const toolsBox = {
        left: measured.left,
        top: measured.top,
        width: measured.width,
        height: Math.max(measured.height, tools.scrollHeight),
      }
      setPaletteLimit(undefined)
      const safe = separatedSpot(barSpot, panelBox, own, toolsBox)
      if (safe === undefined) setBarSpot(undefined)
      else if (safe.x !== barSpot.x || safe.y !== barSpot.y) setBarSpot(safe)
    }
    // Check in the new layout, then once more after the browser has settled it. A split
    // drag can deliver size and chrome measurements across frames; checking only the
    // first left the bar sitting over the palette and made Send unreachable.
    settle()
    const frame = requestAnimationFrame(settle)
    return () => {
      live = false
      cancelAnimationFrame(frame)
    }
  }, [barDragging, barSpot, dragging, fitHeight, fitWidth, palette, paletteLimit])

  /**
   * Where the records hang: above the bar, centred on it.
   *
   * Measured from the browser rather than derived from the drag fractions, because
   * the bar is only as wide as its own contents and only the laid-out box knows
   * that. Read whenever the bar is moved, a record is opened, or the panel resizes,
   * so the pair travels together instead of the record staying where the bar used
   * to be. The bottom offset is stored rather than a top one: a list of one mark is
   * shorter than a list of nine, and the record has to sit on the bar either way.
   */
  const [floatsAt, setFloatsAt] = useState<RecordPlacement | null>(null)
  useEffect(() => {
    const root = rootRef.current
    const bar = barRef.current
    if (root === null || bar === null) {
      setFloatsAt(null)
      return
    }
    const panel = root.getBoundingClientRect()
    const own = bar.getBoundingClientRect()
    const at = placeAboveBar(
      { x: own.left, y: own.top, width: own.width, height: own.height },
      { x: panel.left, y: panel.top, width: panel.width, height: panel.height },
    )
    // Same reason as the detail card: a fresh object every run would make this
    // effect its own trigger, and a page body rebuilds `size` on every render.
    setFloatsAt(previous => previous !== null
      && previous.left === at.left && previous.top === at.top && previous.bottom === at.bottom
      ? previous
      : at)
  }, [barSpot, goalOpen, htmlView, listOpen, size])

  /**
   * Whether an upward fold would come out of the top of the panel.
   *
   * The style fold is anchored to its own button, so it climbs — which is right while
   * the bar sits at the bottom and wrong the moment the reader parks the bar along the
   * top, where climbing puts the swatches out of sight above the panel. The record
   * placement already answers this question for the records; the fold reads the same
   * answer rather than measuring a second time, so the two can never disagree about
   * where there is room.
   */
  const foldOpensDown = floatsAt !== null && floatsAt.bottom === undefined

  /**
   * Put a record away when the reader clicks anywhere else.
   *
   * A record is a fold, not a mode: it has done its job the moment the reader looks
   * back at the figure, so looking away is what closes it. The close button stays
   * for the keyboard and for anyone who wants the fold gone while keeping the focus
   * where it is — but nobody should have to hit a cross to get their picture back.
   * The bar itself is exempt, since its own buttons are how a record is opened and
   * exchanged; so is everything inside a record, which is where the writing happens.
   */
  useEffect(() => {
    const onDown = (event: Event): void => {
      const target = event.target
      // A press this handler cannot place — on the document itself, say — is still a
      // press somewhere other than the popover, so it folds like any other.
      const inside = target instanceof Element
      // The controls that steer the selected mark are not "somewhere else": pressing
      // the weight rail or a swatch while a mark is selected is still about that mark.
      if (inside && (target.closest('.da-float') !== null
        || target.closest('.da-style-row') !== null
        || target.closest('.da-palette') !== null
        || target.closest('.da-weight') !== null
        || barRef.current?.contains(target) === true)) return
      if (openPanel !== null) setOpenPanel(null)
      // Pressing outside the figure puts the comment pill away with the mark it was
      // written for. A press *on* the figure is left to the surface itself, which
      // already knows how to tell a click on blank paper from the start of a drag —
      // a pan must not clear the selection it is carrying.
      if (stageRef.current?.contains(target as Node) === true) return
      setSelectedId(null)
    }
    document.addEventListener('pointerdown', onDown, true)
    return () => { document.removeEventListener('pointerdown', onDown, true) }
  }, [openPanel])

  /**
   * Put the selected mark's detail card beside that mark.
   *
   * Runs whenever the selection, the geometry under it, the zoom, or the surface
   * changes: a card anchored to where a mark used to be is worse than no card, since
   * it names the wrong thing. The measurement is read from the browser instead of
   * derived from the scroll offsets, because the figure is drawn at a factor inside
   * a scrollport and only the laid-out boxes know both.
   */
  useEffect(() => {
    const root = rootRef.current
    const host = figureRef.current
    // A row can still be opened after the live element has gone away (a closed
    // cover, a removed tab). Keep its comment reachable at the last recorded box;
    // the visible-page copy still wins whenever there is one.
    const mark = visibleMarks.find(candidate => candidate.id === selectedId)
      ?? marks.find(candidate => candidate.id === selectedId)
    const drawn = liveMark !== null && liveMark.id === selectedId ? liveMark : mark
    const box = drawn === undefined ? undefined : markOutline(drawn, unit)
    if (root === null || host === null || box === undefined || size === null) {
      setDetailAt(null)
      return
    }
    const panel = root.getBoundingClientRect()
    const measured = host.getBoundingClientRect()
    // The pill's own size, not a constant: it grows with the sentence, and a
    // placement that assumed one line would push a long comment off the bottom.
    const pillSize = measuredSize(pillRef.current, { width: DETAIL_WIDTH, height: DETAIL_HEIGHT })
    // The palette floats over the panel and the reader may park it anywhere, so the
    // pill is placed around its measured box: two floating surfaces that touch read as
    // one control, and the reader asked for a gutter between them.
    const paletteBox = obstacleBox(paletteRef.current, { left: panel.left, top: panel.top })
    // A document surface is a window onto a longer page: its marks are in document
    // pixels, while the frame's own box is the window's. Taking the scroll off puts the
    // card beside the mark the reader can see, and lets a mark that has been scrolled
    // out of the window be placed out of the panel by the same arithmetic as ever.
    const shown = figure?.kind === 'html'
      ? { ...box, x: box.x - htmlScroll.x, y: box.y - htmlScroll.y }
      : box
    const at = placeCard(
      scaledBox(
        shown,
        { x: measured.left, y: measured.top, width: measured.width, height: measured.height },
        { x: panel.left, y: panel.top, width: panel.width, height: panel.height },
        size.width,
      ),
      panel.width,
      panel.height,
      pillSize,
      paletteBox,
    )
    // Only a moved card is news. Storing a fresh object every time would make the
    // effect its own trigger: a page body rebuilds `size` from its owner's surface,
    // so an unconditional set here re-renders, re-runs, and spins.
    setDetailAt(previous => previous !== null && previous.left === at.left && previous.top === at.top ? previous : at)
    // `drawnMarks` changes on every keystroke in the pill, which is also when the pill's
    // own height can change, so the re-measurement happens by itself. The write is
    // idempotent, so a measured height that did not move re-renders nothing. It also
    // moves when the page turns, which is what keeps the pill off the slide that just
    // came up with a mark belonging to another one.
  }, [figure, htmlScroll, liveMark, marks, palette, scale, selectedId, size, unit, visibleMarks])

  /**
   * The factor currently drawn, kept beside the state that will hold it.
   *
   * A pinch is a stream of events, and routing each one through React state means
   * re-rendering this whole body between frames — the gesture then arrives a frame
   * late and feels like it is chasing the fingers. The gesture writes the new
   * geometry straight onto the surface instead, and only the factor the fingers
   * came to rest on is committed to state, once the stream has paused.
   */
  const liveScale = useRef(scale)
  useEffect(() => { liveScale.current = scale }, [scale])

  /** Pending commit of the factor a finished pinch settled on. */
  const settleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  /**
   * Zoom to one factor, keeping the figure point under a client coordinate there.
   *
   * Both the scaled box and the scroll offsets are written synchronously: the
   * browser lays out the new width as soon as it is read back, so the scrollport
   * can be moved in the same frame and the point under the pointer never appears
   * to move at all.
   * @param next - the factor to reach, clamped to the shared range.
   * @param clientX - pointer's horizontal position, in client coordinates.
   * @param clientY - pointer's vertical position, in client coordinates.
   */
  const zoomAt = useCallback((next: number, clientX: number, clientY: number): void => {
    const stage = stageRef.current
    const surface = surfaceRef.current
    const sheet = paperRef.current
    /* v8 ignore next -- a wheel event only reaches a handler on a mounted stage, and size is what allows one. */
    if (stage === null || surface === null || sheet === null || paper === null) return
    const before = liveScale.current
    const reached = clampZoom(next)
    // Nothing to hold still when the factor would not move.
    if (reached === before) return
    const rect = stage.getBoundingClientRect()
    const target = anchoredScroll(
      {
        clientWidth: stage.clientWidth,
        clientHeight: stage.clientHeight,
        scrollLeft: stage.scrollLeft,
        scrollTop: stage.scrollTop,
        left: rect.left,
        top: rect.top,
      },
      { clientX, clientY },
      before,
      reached,
      // The paper, not the figure: that is what the surface is the size of, and the
      // anchor arithmetic has to be done in the coordinates the offset is measured in.
      paper,
      STAGE_INSETS,
    )
    liveScale.current = reached
    // The paper is the one thing that scales. It used to be the figure host that took
    // the live factor, on top of the paper's own — so a pinch out left the figure at
    // the factor squared inside a sheet at the factor, with white paper showing all
    // around it, and the settled render never cleared the host's inline transform
    // because React had not written it.
    surface.style.width = `${paper.width * reached}px`
    surface.style.height = `${paper.height * reached}px`
    sheet.style.transform = `scale(${reached})`
    stage.scrollLeft = target.scrollLeft
    stage.scrollTop = target.scrollTop
    clearTimeout(settleTimer.current)
    settleTimer.current = setTimeout(() => {
      settleTimer.current = undefined
      // The settled render writes the same factor through `paperStyle`; clearing the
      // inline one first is what keeps the two from compounding.
      const settled = paperRef.current
      /* v8 ignore next -- the sheet is the element the pinch was measured on. */
      if (settled !== null) settled.style.transform = ''
      setZoom(reached)
    }, PINCH_SETTLE_DELAY_MS)
  }, [paper])

  /** Apply one frame of a two-finger pinch to the live drawing factor. */
  const pinchBy = useCallback((factor: number, clientX: number, clientY: number): void => {
    zoomAt(liveScale.current * factor, clientX, clientY)
  }, [zoomAt])

  useEffect(() => () => { clearTimeout(settleTimer.current) }, [])

  useEffect(() => {
    const stage = stageRef.current
    if (stage === null) return
    // An interactive page owns its own scrollport. Wheel travel belongs to that page
    // rather than to the annotation surface underneath it.
    if (previewPage !== null) return
    /**
     * A trackpad's ordinary two-finger scroll is a pan; a pinch is the zoom.
     *
     * Browsers report a pinch as a ctrl-modified wheel, while two-finger scroll
     * arrives as an unmodified wheel with independent X and Y deltas. Treating both
     * as zoom made moving around the figure fight looking closer at it. The ordinary
     * gesture now moves the table, and `Cmd`/`Ctrl` + wheel is the explicit mouse
     * equivalent of a pinch. Shift maps a vertical mouse wheel to horizontal travel.
     */
    const onWheel = (event: WheelEvent): void => {
      const magnify = event.ctrlKey || event.metaKey
      const view = documentView()
      if (view !== null && !magnify) {
        // The frame is the document's scrollport. The overlay sits above it, so this
        // is the one place that can hand trackpad and mouse-wheel travel through.
        const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? stage.clientHeight : 1
        const dx = event.deltaX * unit
        const dy = event.deltaY * unit
        event.preventDefault()
        view.scrollBy(event.shiftKey ? dx + dy : dx, event.shiftKey ? 0 : dy)
        return
      }
      // A fitted picture has no hidden edge to reveal. Leaving the event alone lets
      // the surrounding panel scroll, which is the gesture the reader actually made.
      if (!magnify && !pannable) return
      event.preventDefault()
      if (magnify) {
        zoomAt(
          liveScale.current * wheelZoomFactor(event.deltaY, event.deltaMode, stage.clientHeight),
          event.clientX,
          event.clientY,
        )
        return
      }
      // WheelEvent uses three units. A line-mode mouse wheel sends values around
      // one, which is almost no travel if treated as CSS pixels; page mode sends
      // pages. Normalize both before deciding which axis the gesture belongs to.
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? stage.clientHeight : 1
      const dx = event.deltaX * unit
      const dy = event.deltaY * unit
      // Shift is the conventional horizontal wheel. Add any native horizontal
      // component instead of testing it away: a trackpad often reports a little of
      // both, and that used to turn an intentional horizontal gesture diagonal.
      stage.scrollLeft += event.shiftKey ? dx + dy : dx
      stage.scrollTop += event.shiftKey ? 0 : dy
    }
    // Not passive: a passive listener may see the event but cannot keep the
    // browser from acting on it, and the browser's own pinch-zoom is exactly
    // what this handler exists to replace.
    stage.addEventListener('wheel', onWheel, { passive: false })
    return () => { stage.removeEventListener('wheel', onWheel) }
  }, [documentView, pannable, previewPage, zoomAt])

  // --- edits ----------------------------------------------------------------

  const { commit, reset: resetMarks } = history

  /**
   * Attach a new mark to the logical page it was drawn on.
   *
   * A viewport page needs no extra locator: its scroll offset already supplies the
   * position. A deck keeps several pages at the same viewport coordinates, so the
   * surface selector is the fact that tells one slide from the next. Static HTML can
   * be inspected directly; a running page reports the surface with its picker.
   * @param mark - the mark a gesture or picker just made.
   * @param ownerSurface - the surface the page reported, or null for an element that
   * belongs outside every declared surface such as a deck's cover.
   * @returns the mark carrying a surface selector when one is known.
   */
  const scopedMark = useCallback((
    mark: AnnotationMark,
    ownerSurface?: string | null,
  ): AnnotationMark => {
    if (mark.surface !== undefined || figure?.kind !== 'html') return mark
    const staticRoot = frameRef.current?.contentDocument?.documentElement
    const selector = ownerSurface === null
      ? undefined
      : ownerSurface ?? (previewPage === null
      ? (staticRoot === null || staticRoot === undefined
          ? undefined
          : currentSurfaceSelector(staticRoot))
      : liveSurface ?? undefined)
    return selector === undefined ? mark : { ...mark, surface: selector }
  }, [figure?.kind, liveSurface, previewPage])

  /**
   * Add a mark to this surface's list, unless it names an element already marked.
   *
   * Both ways of naming an element end here: the picker in a proxied page reports a
   * click through a message, and a drawn one is handed over straight from the surface.
   * Either can land on the same element again and again, and each press used to leave
   * another mark on it — identical, silent, and invisible as anything but a box drawn
   * on the same rectangle. An element is named once; the press picks out the mark that
   * is already there, which is the one the reader meant to write in.
   */
  const addMark = useCallback((
    mark: AnnotationMark,
    ownerSurface?: string | null,
  ): void => {
    const complete = scopedMark(mark, ownerSurface)
    const already = elementMarkOn(marks, complete)
    if (already !== undefined) {
      setTool('select')
      setSelectedId(already.id)
      setFocusId(already.id)
      return
    }
    commit(appendedMarks(marks, complete))
    setTool('select')
    setSelectedId(complete.id)
    setFocusId(complete.id)
  }, [commit, marks, scopedMark])

  /**
   * Make the document itself the picker while the overlay steps aside.
   *
   * A same-origin rendered document can be read by this side, so there is no reason
   * to cover it with a transparent canvas just to hear a click. Letting the frame keep
   * its own pointer events preserves links, scrolling, media and any local interaction;
   * this capture listener only names the element the press landed on. In element mode
   * that press becomes a mark. In select mode it selects an existing mark, or closes
   * the current one while allowing the page's native action to continue.
   */
  useEffect(() => {
    if (figure?.kind !== 'html' || previewPage !== null
      || (tool !== 'select' && tool !== 'element')) return
    const document_ = frameRef.current?.contentDocument
    if (document_ === null || document_ === undefined) return
    const onPress = (event: MouseEvent): void => {
      if (event.button !== 0) return
      // Pressing an element is a marking gesture, not a page gesture. Keep the guard
      // through the compatibility click even though adding the mark switches tools
      // before that click arrives.
      if (tool === 'element') htmlClickGuard.current = true
      const view = document_.defaultView
      const scrollX = view?.scrollX ?? 0
      const scrollY = view?.scrollY ?? 0
      const choices = elementChoicesInDocument(
        document_,
        event.clientX + scrollX,
        event.clientY + scrollY,
      )
      const shownPick = htmlPick.current
      const anchor = choices === undefined
        ? undefined
        : choices.anchors[
          shownPick !== null && sameChoiceElements(shownPick.choices, choices)
            ? Math.min(shownPick.index, choices.anchors.length - 1)
            : choices.preferred
        ]
      if (anchor === undefined) {
        if (tool === 'element') {
          event.preventDefault()
          event.stopImmediatePropagation()
          setStatus({ tone: 'info', text: t('toolElementMiss') })
        }
        if (tool === 'select' && selectedId !== null) {
          setSelectedId(null)
          setFocusId(null)
          setOpenPanel(null)
        }
        return
      }
      const already = elementMarkOn(marks, elementMark(anchor, color))
      if (already !== undefined) {
        htmlClickGuard.current = true
        event.preventDefault()
        event.stopImmediatePropagation()
        setTool('select')
        setSelectedId(already.id)
        return
      }
      if (tool === 'element') {
        event.preventDefault()
        event.stopImmediatePropagation()
        addMark(elementMark(anchor, color))
        return
      }
      if (selectedId !== null) {
        setSelectedId(null)
        setFocusId(null)
        setOpenPanel(null)
      }
    }
    document_.addEventListener('pointerdown', onPress, true)
    return () => { document_.removeEventListener('pointerdown', onPress, true) }
  }, [
    addMark, color, figure, marks, previewPage, selectedId, setSelectedId, t, tool,
  ])

  /**
   * Keep the page from acting on the rest of an element-selection press.
   *
   * A browser follows pointerdown with pointerup and click. Preventing the first one
   * is not enough for a presentation whose own script listens for a click to advance:
   * the mark lands correctly and the slide also turns. This listener belongs to the
   * document rather than the element tool, because adding a mark changes the tool
   * before the click is dispatched.
   */
  useEffect(() => {
    if (figure?.kind !== 'html' || previewPage !== null) return
    const document_ = frameRef.current?.contentDocument
    if (document_ === null || document_ === undefined) return
    const owner = eventOwnerOf(document_)
    const swallow = (event: Event): void => {
      if (!htmlClickGuard.current) return
      event.preventDefault()
      event.stopImmediatePropagation()
      if (event.type === 'pointerup') {
        // A browser normally dispatches click immediately after pointerup. Clear on
        // the next task so a suppressed compatibility click cannot leave the guard on.
        window.setTimeout(() => { htmlClickGuard.current = false }, 0)
      } else {
        htmlClickGuard.current = false
      }
    }
    const cancel = (): void => { htmlClickGuard.current = false }
    owner.addEventListener('pointerup', swallow, true)
    owner.addEventListener('click', swallow, true)
    owner.addEventListener('pointercancel', cancel, true)
    return () => {
      owner.removeEventListener('pointerup', swallow, true)
      owner.removeEventListener('click', swallow, true)
      owner.removeEventListener('pointercancel', cancel, true)
      htmlClickGuard.current = false
    }
  }, [figure, previewPage])

  // --- a page through the proxy ---------------------------------------------

  /**
   * Whether the picker in a proxied page owns the pointer right now.
   *
   * Choosing an element is the one thing that has to reach the page itself, so the
   * frame takes the pointer exactly then — and gives it back the moment a drawing tool
   * is armed, because a drawing has to be drawn on this side of the fence.
   */
  const liveArmed = previewPage !== null && tool === 'element'
  /** The name of the element the reader's pointer is on, when the page reported one. */
  const [liveHover, setLiveHover] = useState<{
    readonly anchor: MarkAnchor
    readonly name: string
    readonly level?: number
    readonly count?: number
  } | null>(null)
  /** The list row whose live-page reveal is waiting for the page's answer. */
  const pendingReveal = useRef<{ readonly id: string; readonly mark: AnnotationMark } | null>(null)
  /** Opaque token and timeout for that one reveal request. */
  const revealSerial = useRef(0)
  const revealTimer = useRef<number | null>(null)
  /** The mark and surface a temporary hidden-layer reveal settled on. */
  const temporaryReveal = useRef<{ readonly markId: string; readonly surface: string | null } | null>(null)
  const refreshLiveFrame = useCallback((): void => {
    pendingReveal.current = null
    temporaryReveal.current = null
    setTemporaryMark(null)
    revealSerial.current += 1
    if (revealTimer.current !== null) {
      window.clearTimeout(revealTimer.current)
      revealTimer.current = null
    }
    setLiveHover(null)
    setPickLevel(undefined)
    setPreviewShown(null)
    setLiveSurface(null)
    setLiveSurfaceKnown(false)
    setHtmlScroll({ x: 0, y: 0 })
    setSelectedId(null)
    setFrameRevision(revision => revision + 1)
  }, [setSelectedId])
  useEffect(() => {
    const token = props.refreshToken
    if (token === undefined || token === handledRefreshToken.current) return
    handledRefreshToken.current = token
    refreshLiveFrame()
  }, [props.refreshToken, refreshLiveFrame])
  useEffect(() => () => {
    if (revealTimer.current !== null) window.clearTimeout(revealTimer.current)
  }, [])

  /**
   * Move the picker's ladder while keyboard focus is still in the panel.
   *
   * Choosing the element tool focuses its button in this window, while the hovered
   * element lives in the framed page. Without this relay the displayed "↑↓" hint is
   * a promise the page never hears; the shell instead consumes the arrow and scrolls
   * the conversation behind the preview.
   */
  const nudgePicker = useCallback((delta: -1 | 1): void => {
    /* v8 ignore next -- the depth buttons and key listener exist only while this page is framed. */
    if (previewPage === null) return
    const view = frameRef.current?.contentWindow
    if (view == null) return
    view.postMessage(liveDepthMessage(delta), new URL(previewPage.url).origin)
  }, [previewPage])

  useEffect(() => {
    if (previewPage === null || tool !== 'element' || liveHover === null) return
    const onKeyDown = (event: KeyboardEvent): void => {
      const target = event.target as { readonly tagName?: string; readonly isContentEditable?: boolean } | null
      if (target !== null && (target.isContentEditable === true
        || target.tagName === 'INPUT'
        || target.tagName === 'TEXTAREA'
        || target.tagName === 'SELECT')) return
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      nudgePicker(event.key === 'ArrowUp' ? 1 : -1)
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => { window.removeEventListener('keydown', onKeyDown, true) }
  }, [liveHover, nudgePicker, previewPage, tool])

  /**
   * Open a page and frame it.
   *
   * The marks go with the page they were drawn on: an element locator from the file
   * that happened to be open resolves to some unrelated element here, and a mark the
   * reader never placed on this page is worse than no marks at all.
   * @param text - what the reader typed in the address field.
   */
  const openPage = useCallback(async (text: string): Promise<void> => {
    if (liveBusyRef.current) return
    const address = liveAddressOf(text)
    if (address === undefined) {
      setLiveError(t('liveBadAddress'))
      return
    }
    const generation = liveOpenGeneration.current + 1
    liveOpenGeneration.current = generation
    liveBusyRef.current = true
    setLiveBusy(true)
    setLiveError(null)
    try {
      const page = await openLivePage(address)
      if (!liveMounted.current || liveOpenGeneration.current !== generation) {
        // The Host already opened a proxy for this answer. No body will mount it, so
        // close it here rather than leaving a loopback listener behind.
        void closeLivePage(page.url).catch(() => { /* the Host may already have replaced it. */ })
        return
      }
      props.onLivePageChange?.(page)
      fileBeforeLive.current ??= { marks, summary, createdAt }
      resetMarks([])
      writeSummary('')
      setCreatedAt(null)
      setSelectedId(null)
      setLiveHover(null)
      setPickLevel(undefined)
      setPreviewShown(null)
      setLiveSurface(null)
      setLiveSurfaceKnown(false)
      setHtmlScroll({ x: 0, y: 0 })
      setLiveText(null)
      setLivePage(page)
      setLiveAddressOpen(false)
    } catch (error) {
      if (liveMounted.current && liveOpenGeneration.current === generation) {
        setLiveError(error instanceof Error ? error.message : String(error))
      }
    } finally {
      if (liveOpenGeneration.current === generation) {
        liveBusyRef.current = false
        if (liveMounted.current) setLiveBusy(false)
      }
    }
  }, [createdAt, marks, resetMarks, setSelectedId, summary, t, writeSummary])

  /**
   * Put the file back in the frame.
   *
   * The proxy stops with it: a port still answering on the reader's machine for a page
   * nobody is looking at is a leftover, not a feature.
   */
  const closePage = useCallback((file: NonNullable<typeof fileBeforeLive.current>): void => {
    fileBeforeLive.current = null
    setLivePage(null)
    setLiveText(null)
    setLiveError(null)
    setLiveHover(null)
    setPickLevel(undefined)
    setPreviewShown(null)
    setLiveSurface(null)
    setLiveSurfaceKnown(false)
    setHtmlScroll({ x: 0, y: 0 })
    setLiveAddressOpen(false)
    resetMarks(file.marks)
    writeSummary(file.summary)
    setCreatedAt(file.createdAt)
    setSelectedId(null)
    const pageUrl = live.current.livePage?.url
    void closeLivePage(pageUrl).catch(() => { /* a proxy already gone is not the reader's problem. */ })
  }, [resetMarks, setSelectedId, writeSummary])

  /**
   * Tell the page whether the pointer belongs to the picker.
   *
   * A page that acts on a click — a link, a button, a menu — must keep doing so until
   * the reader has asked to annotate it, and must stop doing so exactly then: that is
   * the whole of "annotation is a layer". Sent on arming and on a page reporting it is
   * ready, because a frame that was still loading could not have heard it.
   */
  const armPicker = useCallback((url: string, armed: boolean): void => {
    const view = frameRef.current?.contentWindow
    if (view == null) return
    view.postMessage(liveModeMessage(armed), new URL(url).origin)
  }, [])

  /**
   * Ask the page to keep the saved element boxes current.
   * @param url - the interactive page's own URL.
   * @param selectors - locators carried by marks on this document.
   */
  const watchPicker = useCallback((url: string, selectors: readonly string[]): void => {
    const view = frameRef.current?.contentWindow
    if (view == null) return
    view.postMessage(liveWatchMessage(selectors), new URL(url).origin)
  }, [])

  /** Undo a cover or modal reveal once the mark that needed it is closed. */
  const releasePicker = useCallback((url: string): void => {
    const view = frameRef.current?.contentWindow
    if (view == null) return
    view.postMessage(liveReleaseMessage(), new URL(url).origin)
  }, [])

  useEffect(() => {
    if (previewPage === null) return
    armPicker(previewPage.url, liveArmed)
    // A drawing tool takes the pointer back, and the name chip was about a pointer the
    // page no longer owns.
    if (!liveArmed) setLiveHover(null)
  }, [armPicker, liveArmed, previewPage])

  /** Unique selectors whose elements have to be measured by the page. */
  const watchedSelectors = useMemo(
    () => [...new Set(marks.flatMap(mark => mark.anchor?.selector === undefined ? [] : [mark.anchor.selector]))],
    [marks],
  )

  useEffect(() => {
    if (previewPage === null) return
    watchPicker(previewPage.url, watchedSelectors)
  }, [previewPage, watchedSelectors, watchPicker])

  const hadSelectedMark = useRef(false)
  useEffect(() => {
    if (previewPage === null) return
    if (selectedId !== null) {
      hadSelectedMark.current = true
      return
    }
    if (!hadSelectedMark.current) return
    // Turning toward another slide clears the old selection before the new mark
    // arrives. Releasing while that reveal is in flight would invalidate its request
    // in the picker, so leave restoration to the answer (or the timeout).
    if (pendingReveal.current !== null) {
      hadSelectedMark.current = false
      return
    }
    hadSelectedMark.current = false
    temporaryReveal.current = null
    setTemporaryMark(null)
    releasePicker(previewPage.url)
  }, [previewPage, releasePicker, selectedId])

  useEffect(() => {
    if (previewPage === null) return
    return () => { releasePicker(previewPage.url) }
  }, [previewPage, releasePicker])

  /**
   * Listen to the page.
   *
   * Everything the panel knows about a proxied page arrives here: how far it has
   * scrolled, what the pointer is on, what it picked. Nothing is read out of the frame
   * — it is another origin, and a page the panel could read would be a page whose
   * scripts could read back.
   */
  useEffect(() => {
    if (previewPage === null) return
    const origin = new URL(previewPage.url).origin
    const onMessage = (event: MessageEvent): void => {
      const view = frameRef.current?.contentWindow
      if (event.origin !== origin || view === null || view === undefined || event.source !== view) return
      const reported = parseLiveEvent(event.data)
      if (reported === undefined) return
      if (reported.kind === 'reveal-result') {
        const pending = pendingReveal.current
        if (pending === null || pending.id !== reported.requestId) return
        pendingReveal.current = null
        if (revealTimer.current !== null) {
          window.clearTimeout(revealTimer.current)
          revealTimer.current = null
        }
        if (reported.status === 'revealed') {
          temporaryReveal.current = reported.temporary === true
            ? { markId: pending.mark.id, surface: reported.surface ?? null }
            : null
          setTemporaryMark(reported.temporary === true ? pending.mark : null)
          setSelectedId(pending.mark.id)
          // The list hangs over the element it just found. Once the page has
          // confirmed the destination, get out of the way so the reader can see it.
          setOpenPanel(null)
        } else if (reported.status === 'hidden') {
          temporaryReveal.current = null
          setTemporaryMark(null)
          // The element may belong to a state the page has since closed. The mark
          // still has a comment to edit, so open it at its recorded box instead of
          // making the list row feel inert.
          setSelectedId(pending.mark.id)
          setOpenPanel(null)
        } else {
          temporaryReveal.current = null
          setTemporaryMark(null)
          setStatus({ tone: 'info', text: t(`reveal_${reported.status}`) })
          setSelectedId(null)
        }
        return
      }
      if (reported.kind === 'surface') {
        setLiveSurface(reported.selector)
        setLiveSurfaceKnown(true)
        setSelectedId(current => {
          const selectedMark = marks.find(mark => mark.id === current)
          if (selectedMark === undefined) return current
          const temporary = temporaryReveal.current
          if (temporary !== null && temporary.markId === current
            && temporary.surface !== reported.selector) {
            temporaryReveal.current = null
            return null
          }
          return selectedMark.surface !== undefined && selectedMark.surface !== reported.selector
            ? null
            : current
        })
        setLiveHover(null)
        setPickLevel(undefined)
        return
      }
      if (reported.kind === 'scroll') {
        setHtmlScroll({ x: reported.scroll[0], y: reported.scroll[1] })
        return
      }
      if (reported.kind === 'ready') {
        setHtmlScroll({ x: reported.scroll[0], y: reported.scroll[1] })
        // The one moment both halves are known to be listening: the page has just put
        // its picker in place, so the current mode is sent again rather than trusted.
        armPicker(previewPage.url, liveArmed)
        watchPicker(previewPage.url, watchedSelectors)
        return
      }
      if (reported.kind === 'leave') {
        setLiveHover(null)
        setPickLevel(undefined)
        return
      }
      if (reported.kind === 'cancel') {
        setLiveHover(null)
        setPickLevel(undefined)
        setSelectedId(null)
        setFocusId(null)
        // Escape belongs to element mode first. Clearing the hover while leaving the
        // picker armed made the key look broken whenever focus was inside the page.
        setTool('select')
        return
      }
      if (reported.kind === 'bounds') {
        const bySelector = new Map<string, readonly AnnotationMark[]>()
        for (const mark of marks) {
          const selector = mark.anchor?.selector
          if (selector === undefined) continue
          bySelector.set(selector, [...(bySelector.get(selector) ?? []), mark])
        }
        const boxes = new Map<string, readonly [number, number, number, number]>()
        const away = new Set<string>()
        for (const bound of reported.bounds) {
          for (const mark of bySelector.get(bound.selector) ?? []) {
            if (!bound.visible || (bound.bbox[2] === 0 && bound.bbox[3] === 0)) away.add(mark.id)
            else if (mark.kind === 'element') boxes.set(mark.id, bound.bbox)
          }
        }
        const next: ShownMarks = { boxes, away }
        setPreviewShown(current => sameShownMarks(current, next) ? current : next)
        return
      }
      if (reported.kind === 'hover') {
        setLiveHover({
          anchor: anchorOfPick(reported),
          name: pickName(reported),
          ...(reported.level === undefined ? {} : { level: reported.level }),
          ...(reported.count === undefined ? {} : { count: reported.count }),
        })
        setPickLevel(reported.level === undefined || reported.count === undefined
          ? undefined
          : { level: reported.level, count: reported.count })
        return
      }
      // A pick is a click the reader aimed at an element. The box is where it was when
      // they pointed, which is what a mark records: the element may move afterwards.
      setLiveHover(null)
      setPickLevel(undefined)
      addMark(elementMark(anchorOfPick(reported), color), reported.surface)
    }
    window.addEventListener('message', onMessage)
    return () => { window.removeEventListener('message', onMessage) }
  }, [
    addMark, armPicker, color, liveArmed, marks, previewPage, setSelectedId, setStatus, t,
    watchPicker, watchedSelectors,
  ])

  const removeMark = useCallback((id: string): void => {
    // Only this surface's own marks reach here. A document's list used to offer the
    // same ✕ on a row from another page, and this dropped that mark through the owner
    // with no undo step behind it — the same gesture, undoable here and permanent
    // there. Those rows carry no ✕ now, so there is nothing to forward.
    commit(removedMarks(marks, id))
    // Only the row that went takes the selection with it. The updater reads the
    // selection at the moment it runs, so pruning one row leaves the comment card of
    // another open — a reader who deletes mark 2 was losing the card they were typing
    // mark 1 into.
    setSelectedId(current => (current === id ? null : current))
  }, [commit, marks, setSelectedId])

  /**
   * Write one mark's detail.
   *
   * A mark carries one string, so there is nothing to keep in step beside it: the
   * detail is what the agent reads and what the list shows, and it is never painted
   * on the picture.
   * @param id - the mark being edited.
   * @param value - the new text.
   */
  const setMarkDetail = useCallback((id: string, value: string): void => {
    history.amend(current => detailedMarks(current, id, value))
  }, [])

  /**
   * Arm one tool and put the previous tool's editing furniture away.
   *
   * A drawing or element gesture owns the whole surface. Carrying a selected mark's
   * handles and comment into it made one pointerpress mean two things at once.
   */
  const chooseTool = useCallback((next: Tool): void => {
    setTool(next)
    if (next === 'select') return
    setSelectedId(null)
    setFocusId(null)
    setLiveMark(null)
    setOpenPanel(null)
  }, [setOpenPanel])

  /**
   * Pick a mark out for editing, from a double click on the picture.
   *
   * Working on one mark means reading and writing its detail, so the double click
   * both puts the surface into annotating and asks for the caret. The focus itself
   * is taken by the effect below, once the box exists: while the figure is only
   * being viewed there is no detail box to focus.
   * @param id - the mark that was double clicked.
   */
  const editMark = useCallback((id: string): void => {
    setSelectedId(id)
    setFocusId(id)
  }, [])

  /**
   * Go back to selecting once a mark has been drawn, and open its detail for writing.
   *
   * Drawing is finished the moment the pointer lifts: what the reader wants next is
   * to look at what they made and say what is wrong with it, not to draw a second
   * one. Leaving the tool armed also turns the next idle drag on the figure into a
   * stray arrow, which is the kind of accident a tool that disarms itself prevents.
   *
   * The second half is the part that makes the gesture worth as much as it is: a mark
   * with no sentence is a shape with no meaning, so the box it is about opens and
   * takes the caret. A reader who has nothing to say is one Escape away from the
   * picture, while a reader who does say it never has to go looking for the field.
   *
   * A `point` is placed the same way and for the same reason, so both paths land
   * here.
   * @param id - the mark that was just drawn.
   */
  const finishDrawing = useCallback((id: string): void => {
    setTool('select')
    setSelectedId(id)
    setFocusId(id)
  }, [])

  /**
   * Put the caret in the detail box that was just asked for.
   *
   * Selecting a mark from the list only selects it; a double click on the picture
   * is the reader saying they want to write, so that is the one that takes focus.
   * The caret goes to the end of what is already there rather than over it.
   */
  useEffect(() => {
    if (focusId === null) return
    const box = detailRef.current
    // The card is placed by arithmetic that runs in an effect of its own, so on the
    // render that first asks for the focus the box may not exist yet. Waiting for
    // it is what makes a double click land the caret: the request stands until the
    // card it is about is actually there.
    if (box === null) return
    setFocusId(null)
    box.focus()
    box.setSelectionRange(box.value.length, box.value.length)
  }, [detailAt, focusId])

  /**
   * Put a handle drag on a mark, as one undo step.
   *
   * Only the fields the gesture actually produced are written, so a resize does
   * not clear a rotation and a rotation does not clear a note-plate offset.
   * @param id - the mark the gesture edited.
   * @param patch - the fields that changed.
   */
  const updateMark = useCallback((id: string, patch: MarkPatch): void => {
    commit(patchedMarks(marks, id, patch))
  }, [commit, marks])

  /**
   * Put a dragged mark where it was dropped.
   *
   * A drag that ends where it started is not an edit: the mark keeps the anchor
   * it had, and no undo step is recorded for a gesture that changed nothing.
   */
  const moveMark = useCallback((id: string, points: readonly FigurePoint[], anchor: MarkAnchor | undefined): void => {
    const next = movedMarks(marks, id, points, anchor)
    /* v8 ignore next -- the surface only reports a press that left its mark somewhere else. */
    if (next === null) return
    commit(next)
  }, [commit, marks])

  /**
   * Pick a colour: repaint the selected mark, or arm the next stroke.
   *
   * The distinction is the selection, not a mode: a reader who has just selected a
   * mark and reached for a colour meant that mark, and one who has not is choosing
   * how the next one will look. Both paths record an undo step where one applies,
   * so a recolour can be taken back like any other edit.
   * @param value - the CSS hex string of the chosen swatch.
   */
  /**
   * Change one attribute of the selected mark, or of the next stroke when nothing
   * is selected.
   *
   * A control that is already at the mark's value leaves the list identical, so a
   * press that changes nothing records no undo step — whether the mark is still
   * there or was removed while it was selected.
   * @param patch - the attribute to change.
   */
  const { undo, redo } = history

  /**
   * Report every edit upward, so an owner that unmounts this surface (a page
   * change) can hand the unsaved work back when the surface returns.
   */
  useEffect(() => { props.onDraftChange?.({ marks }) }, [marks, props.onDraftChange])

  /**
   * Keep the draft on disk, so a reload finds the work rather than an empty panel.
   *
   * A page surface is not its own document: its owner holds every page's marks and
   * is the only writer, so a page must not write a sidecar that would then claim to
   * describe the whole document.
   */
  useEffect(() => {
    if (isPage || address === '' || livePage !== null) return
    if (loaded === null || size === null) return
    // What was just read is what is already there: a load is not an edit.
    if (writtenSignature.current === null) {
      writtenSignature.current = annotationSignature(marks, summary)
      return
    }
    autosave.current?.schedule()
  }, [address, isPage, livePage, loaded, marks, size, summary])

  /**
   * Write the pending draft when the tab goes away.
   *
   * A reader who closes the panel straight after typing is the case autosave exists
   * for, and the debounce would otherwise still be waiting. `keepalive` is what lets
   * that request outlive the document that sent it.
   */
  useEffect(() => {
    if (isPage) return
    const write = (): void => { void autosave.current?.flush() }
    window.addEventListener('pagehide', write)
    return () => {
      window.removeEventListener('pagehide', write)
      // A surface that is unmounted while its owner is still alive — a page turn, a
      // tab re-registration — must not drop an edit the timer has not written yet.
      // The write is fire-and-forget: there is no longer a component to report to.
      void autosave.current?.flush()
    }
  }, [isPage])

  useEffect(() => {
    /**
     * Whether the keystroke belongs to a field the reader is typing in.
     *
     * The note boxes are the way a mark is explained, so a Backspace there has to
     * delete a character and an Escape there has to leave the box — not take the
     * whole surface out of annotating mode from under the caret.
     */
    const typing = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) return false
      if (target.isContentEditable) return true
      return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT'
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      const key = event.key
      if (key === 'z' || key === 'Z') {
        if (!(event.metaKey || event.ctrlKey)) return
        if (typing(event.target)) return
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
        return
      }
      if (typing(event.target)) return
      // Escape dismisses exactly one layer, from the most transient outward.
      if (key === 'Escape') {
        if (dragFrom.current !== null) {
          event.preventDefault()
          cancelStripDrag(dragFrom, setPalette, setDragging)
          return
        }
        if (barFrom.current !== null) {
          event.preventDefault()
          cancelStripDrag(barFrom, setBarSpot, setBarDragging)
          return
        }
        if (canvasInput.current?.cancel() === true) {
          event.preventDefault()
          return
        }
        if (openPanel !== null) {
          event.preventDefault()
          setOpenPanel(null)
          return
        }
        if (tool !== 'select') {
          event.preventDefault()
          setTool('select')
          return
        }
        if (selectedId === null) return
        event.preventDefault()
        setSelectedId(null)
        setFocusId(null)
        return
      }
      // Delete removes the picked-out mark. The check is on the selection, so a
      // keystroke with nothing selected is left to the shell instead of swallowed.
      if (key === 'Delete' || key === 'Backspace') {
        if (selectedId === null) return
        event.preventDefault()
        removeMark(selectedId)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => { window.removeEventListener('keydown', onKeyDown) }
  }, [
    barFrom, cancelStripDrag, openPanel, redo, removeMark, selectedId, setOpenPanel,
    setSelectedId, tool, undo,
  ])

  // --- export and delivery --------------------------------------------------

  /**
   * Rasterize the picture the message is about.
   *
   * The marks handed in are the ones being sent, not the ones on the panel. Those are
   * the same thing for a whole-figure hand-off and deliberately not the same for a
   * one-mark one: a picture of the whole surface shipped beside a message naming one
   * mark handed the agent a record containing marks the reader had left behind, and
   * numbered from the picture's own order while the prose numbered from the document's
   * — so the two disagreed about which mark was which.
   * @param target - the figure layer to place under the marks.
   * @param sending - the marks this picture is about.
   * @param numbering - each mark's number in the document the reader is reading.
   * @returns the PNG bytes.
   */
  const exportPng = useCallback(async (
    target: FigureLayer,
    sending: readonly AnnotationMark[] = marks,
    numbering?: ReadonlyMap<string, number>,
  ): Promise<Blob> => {
    // The picture carries the numbers as the reader sized them: the agent reads the
    // same number the reader did, at the same place on the same shape.
    const svg = composeReviewSvg(target, sending, numbering)
    const paper = reviewSize(target, sending)
    const exportScale = Math.min(2, Math.max(1, 2400 / Math.max(paper.width, paper.height)))
    return await rasterizePng(svg, paper.width, paper.height, exportScale)
  }, [marks])

  const buildDocument = useCallback((target: { readonly width: number; readonly height: number }, scope = marks): AnnotationDocument | null => {
    if (loaded === null) return null
    // A proxied page is named by its address, not by the file whose preview opened it:
    // the agent is being told to change the page it can reach, and a message naming
    // `index.html` on disk for a comment about `localhost:5173` sends it to the wrong
    // file — the two are only the same page by the accident of how the preview began.
    const figure = livePage === null
      ? { address, path: loaded.path, mediaType: loaded.mediaType, sha256: loaded.sha256 }
      : { address: livePage.address, path: livePage.address, mediaType: 'text/html', sha256: loaded.sha256 }
    return buildAnnotationDocument({
      figure,
      size: target,
      marks: scope,
      summary,
      createdAt,
      now: new Date().toISOString(),
    })
  }, [address, createdAt, livePage, loaded, marks, summary])

  /**
   * Take back a save failure once a write has gone through.
   *
   * The line was only ever written, never cleared: one failed save — a full disk, a
   * host hiccup — left `保存标注失败` on screen while every write after it succeeded
   * silently. The reader then either redid work that was already saved or gave up on
   * an annotation that was saving fine. Only a failure is taken back here; a line
   * saying a handoff went through is news of its own and is not this one's to drop.
   */
  const clearSaveError = useCallback((): void => {
    toasts.dropTone('error')
  }, [toasts])

  /**
   * Write the surface's current marks to disk, without a review image.
   *
   * This is the draft write: it happens while the reader is still working, so it
   * carries only the marks and their sentences — the picture is a delivery artifact,
   * and rasterizing it on every keystroke would cost more than the draft is worth.
   * The sidecar alone is what a reload reads back.
   */
  const autosave = useRef<Autosave | null>(null)
  if (autosave.current === null) {
    autosave.current = createAutosave({
      delay: AUTOSAVE_DELAY_MS,
      write: async (): Promise<void> => {
        const state = live.current
        // A live page is a temporary surface over the file, not a replacement for it:
        // its marks have no sidecar, and an empty page must never be read as
        // "the reader cleared the file" and delete that file's annotation.
        if (state.livePage !== null || state.address === '' || state.loaded === null || state.size === null) return
        // An empty surface is a clear, and a clear deletes rather than writes. This
        // is the path that matters most: deleting the last mark leaves the sidecar
        // describing marks that are no longer on screen, so a later open would read
        // the deleted annotation straight back. Removing the file is what makes a
        // deletion stay deleted without the reader pressing "clear" as well.
        if (state.marks.length === 0 && state.summary.trim() === '') {
          const signature = annotationSignature(state.marks, state.summary)
          if (signature === writtenSignature.current) return
          await deleteAnnotation(state.address)
          writtenSignature.current = signature
          clearSaveError()
          return
        }
        const signature = annotationSignature(state.marks, state.summary)
        if (signature === writtenSignature.current) return
        const document = buildAnnotationDocument({
          figure: {
            address: state.address,
            path: state.loaded.path,
            mediaType: state.loaded.mediaType,
            sha256: state.loaded.sha256,
          },
          size: state.size,
          marks: state.marks,
          summary: state.summary,
          createdAt: state.createdAt,
          now: new Date().toISOString(),
        })
        await saveAnnotation(state.address, document, undefined, true)
        writtenSignature.current = signature
        clearSaveError()
      },
      onError: (error: unknown) => { setStatus(failureStatus(t, 'saveError', error)) },
    })
  }

  /**
   * Forget the annotation, on screen and on disk.
   *
   * Used both when the reader clears the surface (there is nothing left worth
   * saving, and a stale sidecar is what brought a deleted annotation back) and
   * after a successful hand-off (the marks have been delivered, so keeping them
   * would ask the reader to clear the same work twice).
   *
   * The in-memory state is dropped even when the Host refuses, because the marks
   * are gone from this session either way; the failure is reported rather than
   * hidden, since a surviving sidecar reappears on the next open.
   */
  const discard = useCallback(async (): Promise<void> => {
    // Wait for the queue to empty before deleting, and drop any wait that has not
    // started. Both matter and they are not the same thing: a pending timer would
    // write after the delete, and a write already in flight would finish after it,
    // and either one puts the sidecar back on a figure the reader just cleared.
    await autosave.current?.drained()
    writtenSignature.current = null
    try {
      // Nothing was written for a proxied page, and deleting a sidecar beside the URL
      // would ask the Host to remove a file that never existed.
      if (livePage === null) await deleteAnnotation(address)
    } catch (error) {
      setStatus(failureStatus(t, 'clearError', error))
    }
    commit([])
    setCreatedAt(null)
    setStale(false)
    setSelectedId(null)
    writeSummary('')
  }, [address, commit, livePage, t, writeSummary])

  /**
   * Clear this surface's annotation — or, on one page of a document, the document's.
   *
   * A page body cannot clear by itself. Its `discard` reaches one sidecar and one
   * draft, which on a paged document is the file all the pages share: emptying the
   * page in view while the other pages keep rows in the list, with their sidecar
   * deleted underneath them. The owner keeps the pages, so the owner decides what
   * clearing means — the same reason the send goes up rather than running here.
   */
  const clearAnnotation = useCallback(async (): Promise<void> => {
    if (props.onDocumentClear !== undefined) {
      props.onDocumentClear()
      return
    }
    await discard()
  }, [discard, props.onDocumentClear])


  /**
   * Save the annotation and hand it somewhere: to the agent, or into the draft.
   *
   * The Host writes `<name>.annot.json` and a derived `<name>.annotated.png` beside
   * the figure, and the reader's original stays as it was.
   *
   * What happens to the marks afterwards depends on what was sent. A whole-figure
   * hand-off has delivered everything the sidecar described, so the sidecars are
   * deleted and the surface cleared: leaving them would make the reader clear the
   * same work twice. A hand-off of *one* mark has delivered that mark only, so it
   * leaves the surface and the sidecar holding the rest — the reader pressed a
   * button beside one sentence, and one sentence is what it meant.
   * @param target - who receives the annotation.
   * @param only - the single mark being sent, or undefined to send them all.
   */
  const run = useCallback(async (target: 'agent' | 'composer', only?: AnnotationMark): Promise<void> => {
    // The only enforcement point: the toolbar buttons stay clickable so this guard
    // is what decides, not a disabled attribute that hides the reason.
    //
    // "Decides" has to mean "answers". A guard that returned in silence dropped the
    // press before the busy state and before anything was said, so a reader who had
    // written the figure-level note but drawn no mark pressed send, watched nothing
    // happen, and pressed again — the panel looked broken while nothing on disk was.
    // The two refusals are told apart because they ask for different things: an
    // unmarked figure wants marks, an unloaded one wants a moment.
    const scope = only === undefined ? marks : [only]
    // One send is about this snapshot. A mark or note the reader creates while the
    // session is answering belongs to the next review and must survive this one.
    const sentIds = new Set(scope.map(mark => mark.id))
    const sentSummary = summary
    if (scope.length === 0) {
      await toasts.notify('annotate.none')
      return
    }
    // A surface with no height is one nothing could have been drawn on, and it is not a
    // surface a marks file may describe.
    if (size === null || size.height <= 0) {
      setStatus({ tone: 'info', text: t('sendNoFigure') })
      return
    }
    // Which of the four things the panel can say this is. A hand-off to the composer
    // is a draft write — of everything, or of the one mark whose pill was pressed —
    // and it says so; only the agent is a send.
    const event = target === 'agent'
      ? 'annotate.send.agent'
      : only === undefined ? 'annotate.save.all' : 'annotate.save.one'
    setBusy('sending')
    let warnings: readonly string[] = []
    try {
      // The work is the bubble's task, so a reader who asks for it again from the
      // failure bubble gets the same work and not a second, subtly different, run.
      //
      // Everything that can refuse it is asked *before* anything is written. Saving
      // first and asking afterwards left a narrowed document on disk for a send that
      // never happened: the reader was told the save failed and the screen looked
      // untouched, while the sidecar already held the subset. A refusal has to leave
      // no trace at all.
      const outcome = await toasts.notify(event, async () => {
        if (sessionId === undefined) throw new Error('the figure address carries no session')
        // Both hand-offs end in the same delivery, so both need the session service:
        // parking one above the composer only defers the send, it does not avoid it.
        // Asking now rather than at the press keeps the answer where the reader still
        // has the panel open — a card that fails a minute later is a worse refusal,
        // because by then the figure it described is closed.
        const sessions = props.sessions
        if (sessions === undefined) {
          throw new Error('the sessions service is unavailable')
        }
        const document_ = buildDocument(size, scope)
        if (document_ === null) throw new Error(t('loadFailed'))
        // A picture is only needed when the marks claim an extent. A figure whose
        // marks are all points carries its whole meaning in the numbered list, and a
        // rendered document cannot be flattened at all — both travel as text.
        const review = layer === null || !needsReviewImage(document_)
          ? undefined
          // Numbered from the scope's own order, which is the order the message
          // numbers it in: the picture says ① next to the shape the prose calls ①.
          : await exportPng(layer, scope)
        const saved: SidecarWriteResult = livePage === null
          ? await saveAnnotation(address, document_, review)
          : { annotationPath: '', reviewPath: null }
        // The delivered document is what is on disk now; a pending draft write would
        // only repeat it (or, worse, race the delete that follows the hand-off).
        autosave.current?.cancel()
        writtenSignature.current = annotationSignature(document_.marks, document_.summary ?? '')
        setCreatedAt(document_.createdAt)
        setStale(false)
        const pageImages = review === undefined ? [] : [{ page: 1, image: review }]
        const locale = (props.localeId ?? 'zh').startsWith('en') ? 'en' : 'zh'
        // The bubble this message lands in is handed the message's text and nothing
        // else — the attachments beside it are not reachable from there. So a small
        // copy of the review is filed under the text now, and the card finds it by
        // the same text a moment later. A figure with no review picture files
        // nothing, and its card shows a glyph instead.
        const thumb = await captureThumb(review)
        if (target === 'composer') {
          // The card above the composer stands for this delivery, so the delivery
          // travels with it: pressing send later sends what was on screen when the
          // figure was closed, not whatever the services happen to hold by then.
          parkInComposer({
            conversation: props.conversation,
            sessionId,
            document: document_,
            paths: saved,
            thumb,
            // Staged beside the message in the box, so the box's own send carries the
            // picture with the text instead of leaving one of them behind.
            file: reviewImageFile(review, document_.figure.path),
            locale,
            send: async () => {
              return await deliverAnnotation({
                sessions,
                sessionId,
                document: document_,
                paths: saved,
                pageImages,
                thumb,
                locale,
              })
            },
          })
        } else {
          warnings = await deliverAnnotation({
            sessions,
            sessionId,
            document: document_,
            paths: saved,
            pageImages,
            thumb,
            locale,
          })
        }
      })
      if (outcome !== 'ok') return
      // Delivery can succeed while one of its artifacts does not travel. The text is
      // already in the session, so this is not a retryable failure; it still has to
      // be said, or the reader believes the agent received a file it never got.
      reportDeliveryWarnings(warnings, setStatus)
      // What happens to the marks afterwards depends on what was sent. A whole-figure
      // hand-off has delivered everything the sidecar described, so the sidecars are
      // deleted and the surface cleared: leaving them would make the reader clear the
      // same work twice. A hand-off of *one* mark has delivered that mark only, so it
      // leaves the surface and the sidecar holding the rest — the reader pressed a
      // button beside one sentence, and one sentence is what it meant.
      if (only === undefined) {
        const current = live.current
        const remaining = current.marks.filter(mark => !sentIds.has(mark.id))
        // The figure note belongs to a whole-figure delivery. If it changed while the
        // session was answering, the new sentence has not travelled and stays.
        const keptSummary = current.summary === sentSummary ? '' : current.summary
        // Retire the files that describe the sent snapshot before writing a fresh
        // draft for anything the reader produced in the meantime.
        autosave.current?.cancel()
        await autosave.current?.drained()
        try {
          if (livePage === null) await deleteAnnotation(address)
        } catch (error) {
          setStatus(failureStatus(t, 'clearError', error))
        }
        commit(remaining)
        setCreatedAt(remaining.length > 0 || keptSummary.trim() !== '' ? current.createdAt : null)
        setStale(false)
        writeSummary(keptSummary)
        setSelectedId(currentSelection =>
          remaining.some(mark => mark.id === currentSelection) ? currentSelection : null)
        if (remaining.length > 0 || keptSummary.trim() !== '') autosave.current?.schedule()
        return
      }
      // Only the mark that was sent leaves. The sidecar on disk describes that one
      // mark, so it has to be rewritten from the survivors — letting the autosave
      // notice the change does that, because the signature recorded above still
      // names the delivered document.
      commit(removedMarks(live.current.marks, only.id))
      // The sent mark loses the selection. A mark drawn while that send was in flight
      // is now the reader's object and keeps it.
      setSelectedId(current => current === only.id ? null : current)
      autosave.current?.schedule()
    } finally {
      // A failure never reaches here: the bubble answers with its outcome instead of
      // throwing, and logs the reason itself. What is left to unwind is the busy
      // state, which must lift whether the hand-off worked or not.
      setBusy(null)
    }
  }, [address, buildDocument, commit, exportPng, layer, livePage, marks, props.conversation, props.localeId, props.sessions, sessionId, setSelectedId, size, summary, t, toasts, writeSummary])
  /**
   * Hand the sentence beside one mark to someone.
   *
   * The pill's two buttons are the only gesture that means one mark rather than the
   * document, and they mean it on every surface. A body that owns its own save says
   * so itself; a page body's save belongs to the document, which is the only half
   * that can write a sidecar holding the other pages, so the mark travels up. What
   * must not happen — and did — is the page body running its own whole-document path
   * and failing on a figure it never loaded.
   * @param mark - the mark whose sentence is being sent.
   * @param target - who receives it.
   */
  const sendOne = useCallback(async (mark: AnnotationMark, target: 'agent' | 'composer'): Promise<void> => {
    if (props.onSendMark !== undefined) {
      props.onSendMark(mark, target)
      return
    }
    await run(target, mark)
  }, [props.onSendMark, run])


  /**
   * Probe the Host once, so the menu can offer the gestures it can perform.
   *
   * `canOpenWorkspacePath` answers for the whole page, and a probe that fails is
   * the same answer as "no desktop": rows that would fail every time are left out
   * rather than shown and refused.
   */
  useEffect(() => {
    let live = true
    void desktopAvailable(props.remote).then(available => {
      if (live) setCanOpen(available)
    })
    return () => { live = false }
  }, [props.remote])

  /**
   * The rows this figure's menu offers, decided once per figure and Host.
   *
   * Empty until a figure has loaded: the rows all name its path, so there is
   * nothing to offer before there is one.
   */
  const menuItems = useMemo(() => {
    if (loaded === null) return []
    return figureMenuItems({
      canOpen,
      canSend: !isPage && marks.length > 0 && busy === null,
      hasRelative: relativeTo(loaded.path, loaded.workspace) !== null,
      hasImage: layer !== null,
    }, {
      sendToAgent: t('menuSendToAgent'),
      sendToComposer: t('menuSendToComposer'),
      open: t('menuOpen'),
      reveal: t('menuReveal'),
      copyImage: t('menuCopyImage'),
      copyRelative: t('menuCopyRelative'),
      copyAbsolute: t('menuCopyAbsolute'),
    })
  }, [busy, canOpen, isPage, layer, loaded, marks.length, t])

  /**
   * Open the menu at the pointer, kept inside the window.
   * @param event - the right-click on the figure.
   */
  const openMenu = useCallback((event: ReactMouseEvent): void => {
    /* v8 ignore next -- nothing to act on until a figure loaded. */
    if (loaded === null) return
    event.preventDefault()
    // The box the menu will really occupy: the rows, the gaps between them, and the
    // padding around them. Counting rows alone under-measured it, so the clamp let a
    // menu through that then hung past the window edge.
    const placed = clampMenu(
      { x: event.clientX, y: event.clientY },
      { width: window.innerWidth, height: window.innerHeight },
      menuSize(menuItems.length),
    )
    setMenuAt({ ...placed, path: loaded.path, workspace: loaded.workspace })
  }, [loaded, menuItems])

  // A menu is a thing the reader has to dismiss: a press anywhere else, or Escape,
  // closes it. The press inside is ignored because a row is chosen with a press, and
  // a menu that closed itself on the way to its own row could never be used.
  useEffect(() => {
    if (menuAt === null) return
    const onDown = (event: Event): void => {
      if (pressedInsideMenu(event, menuRef.current)) return
      setMenuAt(null)
    }
    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return
      // Escape dismisses one thing, and the menu is what it dismisses: the press that
      // opened the menu also selected the mark under it, so letting the same key reach
      // the panel's own handler closed the menu *and* dropped that selection. Two
      // things undone by one Escape is not "dismiss the thing on top".
      event.stopPropagation()
      setMenuAt(null)
    }
    document.addEventListener('pointerdown', onDown, true)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown, true)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuAt])

  /**
   * Carry out one menu row.
   *
   * The two copies are the only rows that touch the clipboard, and they say so in
   * the status line: a copy with no feedback reads as a menu that did nothing.
   * @param id - the row the reader picked.
   * @param path - the figure's own path, as the Host named it.
   * @param workspace - the session's working directory, when there is one.
   */
  const runMenu = useCallback((id: FigureMenuAction, path: string, workspace: string | null): void => {
    setMenuAt(null)
    if (id === 'sendToAgent') { void run('agent'); return }
    if (id === 'sendToComposer') { void run('composer'); return }
    if (id === 'open') {
      void openOnDesktop(props.remote, path).then(ok => {
        setStatus(hostGestureStatus(t, ok, 'menuOpened', 'menuOpenFailed'))
      })
      return
    }
    if (id === 'reveal') {
      void revealOnDesktop(props.remote, path).then(ok => {
        setStatus(hostGestureStatus(t, ok, 'menuRevealed', 'menuRevealFailed'))
      })
      return
    }
    if (id === 'copyImage') {
      /* v8 ignore next -- the row is only offered for a figure that has a layer. */
      if (layer === null) return
      void exportPng(layer).then(async image => {
        const copied = await copyImageToClipboard(image)
        setStatus(clipStatus(t, copied))
      }, () => {
        setStatus(clipStatus(t, false))
      })
      return
    }
    const text = copiedText(id, path, workspace)
    /* v8 ignore next */
    if (text === null) return
    void navigator.clipboard.writeText(text).then(() => {
      setStatus(clipStatus(t, true))
    }, () => {
      setStatus(clipStatus(t, false))
    })
  }, [exportPng, layer, props.remote, run, t])

  // --- render ---------------------------------------------------------------

  /** Whether this body holds a rendered document rather than a figure file. */
  const isHtml = mediaType === 'text/html' || livePage !== null
  /** Name what one figure point landed on, for a surface that holds its own elements. */
  const anchorAtFigurePoint = useCallback(
    (x: number, y: number) => anchorInDocument(frameRef.current?.contentDocument, x, y),
    [],
  )
  /** Every containing level of the element under one point in the framed document. */
  const anchorChoicesAtFigurePoint = useCallback(
    (x: number, y: number) => elementChoicesInDocument(frameRef.current?.contentDocument, x, y),
    [],
  )

  /**
   * The element a selector names, in whichever document the figure's elements live.
   *
   * An inline SVG's elements are in this panel's document, rooted at the host the
   * markup was injected into; a rendered document's are inside its frame, where
   * nothing of the panel's reaches — the frame is read, not styled, so a name is all
   * this side ever needs from it.
   *
   * @param selector - the element's name, as an anchor spells it.
   * @returns the element, or undefined when the figure no longer has one by that name.
   */
  const findElement = useCallback((selector: string): Element | undefined => {
    // Whichever document the figure's elements are in. A ref that is still empty means
    // nothing has mounted yet, which is not an error: there is no element to find, and
    // the effect that runs once the figure arrives asks again.
    /* v8 ignore start -- a body only asks once its figure has mounted, so neither ref is empty here. */
    if (isHtml) {
      const doc = frameRef.current?.contentDocument ?? null
      // A frame with no document at all, or with one that has not been parsed yet,
      // has no elements to find. A box across an origin is one of those: the panel
      // reads nothing out of it, and its marks are drawn by the boxes they carry.
      if (doc === null || doc.documentElement === null) return undefined
      return elementAt({ root: doc, selector })
    }
    const host = figureHostRef.current
    return host === null ? undefined : elementAt({ root: host, selector })
    /* v8 ignore stop */
  }, [isHtml])

  /**
   * Every element the figure should be lit on right now.
   *
   * On a drawing the light *is* the mark: an element mark has no path of its own, so a
   * curve named by one is shown by lighting the curve, and the selected mark is lit
   * harder than the rest.
   *
   * A rendered document is the other way round. There the mark draws the element's box,
   * and the light would be a second, softer copy of the same statement — on a slide the
   * element is a whole block of type, so the glow came out as a haze spread over the
   * page rather than as a way of pointing at something. So only the picker's preview is
   * lit there: it says what a click would take, and it leaves with the pointer.
   *
   * Built fresh rather than accumulated: the marks change, the figure is reloaded, and
   * a list patched in place would keep lighting elements that are no longer there.
   *
   * @param preview - the element the picker is offering, if any.
   * @returns what to light, in a stable enough order that the class work is minimal.
   */
  const litSpots = useCallback(
    (preview: MarkAnchor | undefined): readonly LitSpot[] => collectLitSpots({
      marks: isHtml ? [] : marks,
      selectedId,
      preview,
      colour: color,
      findElement,
    }),
    [color, findElement, isHtml, marks, selectedId],
  )

  /**
   * Hand the light to whatever the current state says should wear it.
   *
   * `figure` is in the dependency list because the elements the light goes on are the
   * figure's own, and they do not exist until it has mounted: the marks file can arrive
   * before the figure does, and without re-running on the figure's arrival every element
   * mark would stay dark until something else happened to move.
   */
  const lightUp = useCallback((preview: MarkAnchor | undefined): void => {
    litRef.current = moveSpotlight(litRef.current, litSpots(preview))
  }, [litSpots])

  // The light belongs to one figure's elements: a new figure, a new tool or an
  // unmount leaves behind elements that may not exist a frame later, and a class left
  // on markup that is about to be replaced is a leak the next figure inherits. The
  // panel's own document needs the rule too, because that is where an inline SVG's
  // elements live and the exported picture's rule is written independently.
  useEffect(() => {
    if (!isHtml) ensureSpotlight(document)
  }, [isHtml])

  useEffect(() => {
    lightUp(hovered.current)
  }, [lightUp, figure])

  useEffect(() => () => {
    moveSpotlight(litRef.current, [])
    litRef.current = []
  }, [])

  const lightElement = useCallback((anchor: MarkAnchor | undefined, level?: PickLevel): void => {
    hovered.current = anchor
    lightUp(anchor)
    setPickLevel(level)
    // The pointer reports the element it is on for every move it makes. Naming the
    // same element again is not news, and a render per pixel would make the page under
    // the hand feel like it was being dragged rather than pointed at.
    const key = chipKey(anchor)
    if (key === chipShown.current) return
    chipShown.current = key
    setChipAnchor(anchor ?? null)
  }, [lightUp])

  /**
   * Follow the pointer inside a same-origin rendered document.
   *
   * The frame keeps native pointer ownership in element mode so links and scrolling
   * still behave like the page. That also means the overlay never receives a move:
   * without this capture listener the page can be clicked but the reader cannot see
   * which element the click will take. The listener only observes; it never prevents
   * or retargets the page's own event.
   */
  useEffect(() => {
    if (figure?.kind !== 'html' || previewPage !== null || tool !== 'element') return
    const document_ = frameRef.current?.contentDocument
    if (document_ === null || document_ === undefined) return
    const report = (pick: { readonly choices: ElementChoices; readonly index: number }): void => {
      htmlPick.current = pick
      const anchor = pick.choices.anchors[pick.index]
      lightElement(anchor, { level: pick.index + 1, count: pick.choices.anchors.length })
    }
    const onMove = (event: PointerEvent): void => {
      const view = document_.defaultView
      const choices = elementChoicesInDocument(
        document_,
        event.clientX + (view?.scrollX ?? 0),
        event.clientY + (view?.scrollY ?? 0),
      )
      if (choices === undefined) {
        htmlPick.current = null
        lightElement(undefined)
        return
      }
      const previous = htmlPick.current
      const index = previous !== null && sameChoiceElements(previous.choices, choices)
        ? Math.min(previous.index, choices.anchors.length - 1)
        : choices.preferred
      report({ choices, index })
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
      const target = event.target as Element | null
      if (target !== null && typeof target.closest === 'function' && (
        target.closest('[contenteditable]:not([contenteditable="false"])') !== null
        || target.tagName === 'INPUT'
        || target.tagName === 'TEXTAREA'
        || target.tagName === 'SELECT'
      )) return
      const current = htmlPick.current
      if (current === null) return
      event.preventDefault()
      const delta = event.key === 'ArrowUp' ? 1 : -1
      const index = Math.min(
        current.choices.anchors.length - 1,
        Math.max(0, current.index + delta),
      )
      if (index !== current.index) report({ choices: current.choices, index })
    }
    const forget = (): void => {
      htmlPick.current = null
      lightElement(undefined)
    }
    // Crossing from the panel into the frame can start with pointerover rather than a
    // move. Without that first event the mode looks armed but names nothing until the
    // hand travels again inside the page.
    document_.addEventListener('pointerover', onMove, true)
    document_.addEventListener('pointermove', onMove, true)
    document_.addEventListener('pointercancel', forget, true)
    document_.documentElement.addEventListener('pointerleave', forget)
    // The pointer and the keyboard can have different owners here. Moving over the
    // frame leaves focus on the tool palette until the reader presses inside the page,
    // so listening only to the frame makes "↑↓" silently dead right after choosing
    // the element tool. Same-origin windows do not forward keydown to one another, so
    // the two listeners never hear the same keystroke twice.
    document_.addEventListener('keydown', onKeyDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document_.removeEventListener('pointerover', onMove, true)
      document_.removeEventListener('pointermove', onMove, true)
      document_.removeEventListener('pointercancel', forget, true)
      document_.documentElement.removeEventListener('pointerleave', forget)
      document_.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keydown', onKeyDown)
      forget()
    }
  }, [figure, lightElement, previewPage, tool])

  if (mediaType === undefined) return <p className="da-hint">{t('unsupported')}</p>
  if (data === undefined && surface === undefined && props.livePage === undefined) {
    return <p className="da-hint">{t(isHtml ? 'htmlLoading' : 'loading')}</p>
  }
  // A tone of its own, not the quiet grey a loading note gets: this one is the
  // message that blocks the whole surface, and the panel has two ways of saying
  // "this did not work" — this was the quieter of the two.
  if (figureError !== null) return <p className="da-hint" data-tone="error" role="alert">{figureError}</p>

  /**
   * Press a row of the list: show that mark and put the pill beside it.
   *
   * A local deck can turn to the slide a selector names; a paged document reports the
   * turn to its owner. Selection follows the turn so a page change cannot clear it
   * after the row asked for it.
   */
  const reveal = (mark: AnnotationMark): void => {
    if (previewPage !== null) {
      const point = mark.points[0]
      const bbox = mark.anchor?.bbox ?? (point === undefined ? [0, 0, 0, 0] : [point[0], point[1], 0, 0])
      const requestId = `${Date.now().toString(36)}-${(revealSerial.current += 1).toString(36)}`
      const view = frameRef.current?.contentWindow
      temporaryReveal.current = null
      setTemporaryMark(null)
      pendingReveal.current = { id: requestId, mark }
      if (revealTimer.current !== null) window.clearTimeout(revealTimer.current)
      revealTimer.current = window.setTimeout(() => {
        pendingReveal.current = null
        setTemporaryMark(null)
        setSelectedId(null)
        setStatus({ tone: 'info', text: t('reveal_timeout') })
        releasePicker(previewPage.url)
      }, 2600)
      view?.postMessage(
        liveRevealMessage(
          requestId,
          mark.anchor?.selector ?? null,
          mark.surface ?? (mark.anchor?.selector === undefined ? liveSurface : null),
          bbox,
        ),
        new URL(previewPage.url).origin,
      )
      revealOnPage(mark)
      return
    }
    const root = frameRef.current?.contentDocument?.documentElement
    const selector = mark.anchor?.selector
    const slide = root === undefined || selector === undefined
      ? undefined
      : deckSlideOf(root, selector)
    if (slide !== undefined) turnDeck(slide)
    const document_ = frameRef.current?.contentDocument ?? null
    const target = selector === undefined || document_ === null
      ? undefined
      : elementAt({ root: document_, selector })
    try {
      target?.scrollIntoView({ block: 'center', inline: 'center', behavior: 'auto' })
    } catch {
      // A detached or synthetic element may not implement scrolling; selection is
      // still useful even when the browser cannot move to it.
    }
    setSelectedId(mark.id)
    revealOnPage(mark)
    if (isHtml) setOpenPanel(null)
  }

  const selected = marks.find(mark => mark.id === selectedId) ?? null
  /**
   * What the colour control currently means.
   *
   * With a mark selected the reader is working on that mark, so the swatches are
   * about it and the button shows its colour. With nothing selected they are about
   * the next stroke, which is where the remembered preference comes in.
   */
  const shownColor = selected === null ? color : selected.color
  /**
   * What the size rail currently means, or null when it means nothing.
   *
   * It sizes one thing: the stroke of the mark the reader is working on, or the pen
   * of the next stroke. With nothing selected and no drawing tool out there is no
   * such thing, so the rail stands down instead of offering a control for a decision
   * nobody is making. A point mark borrows the same number for its pin, so the rail
   * stays when one is selected — it is the mark's size, whichever way it is drawn.
   */
  const shownWeight = railWeight(selected, tool, weight)
  /**
   * How far up the rail that value sits, from 0 at the lightest to 1 at the heaviest.
   *
   * One number for the fill, the knob and the input: computed three times the three
   * could round differently and the knob would sit a pixel off the fill it belongs to.
   */
  const weightFraction = railFraction(shownWeight)
  /**
   * Change one attribute of the selected mark, or of the next stroke when nothing
   * is selected.
   *
   * A control already at the mark's value leaves the list untouched, so a press
   * that changes nothing records no undo step.
   * @param patch - the attribute to change.
   */
  const repaintSelected = (mark: AnnotationMark, patch: MarkPatch): void => {
    if (patchChangesNothing(mark, patch)) return
    commit(patchedMarks(marks, mark.id, patch))
  }
  const chooseColor = (value: string): void => {
    if (selected === null) {
      setColor(value)
      return
    }
    repaintSelected(selected, { color: value })
  }
  const chooseWeight = (value: number): void => {
    const held = clampWeight(value)
    if (selected === null) {
      setWeight(held)
      return
    }
    repaintSelected(selected, { weight: held })
  }
  const surfaceStyle = surfaceBoxStyle(paper, scale)
  /**
   * The paper at its unscaled size, with the figure placed at its own offset on it.
   *
   * The whole paper is scaled by one transform rather than each part scaling itself,
   * so the figure and the overlay cannot drift apart at a fractional factor — which
   * at 60% is exactly what a mark drawn on a line work and a mark drawn on paper
   * would do.
   */
  const paperStyle = paperTransformStyle(paper, scale)
  const figureStyle = figurePlacementStyle(paper, size)

  /**
   * The floating chrome: the weight rail, the tool palette and the bar.
   *
   * Assembled as a value rather than drawn in place because it may be rendered
   * somewhere else: a paged document hands this body a node of the pane, and a bar
   * drawn inside a page is a bar that scrolls with that page.
   */
  /**
   * The tools this surface can actually use.
   *
   * A picker on a bitmap has nothing to pick, so the row itself is built from the
   * media type rather than the button being drawn and then refusing. The order of the
   * remaining tools is untouched, so the row the reader has learned is still the row
   * they get — the picker joins at the end.
   */
  const tools = isVector || isHtml ? TOOLS : TOOLS.filter(entry => !ELEMENT_TOOLS.has(entry.tool))
  const elementGuide = tool === 'element'
    ? {
        label: pickLevel === undefined
          ? `${t('toolElementMode')}, ${t('toolElementHint')}, ${t('toolElementKeys')}`
          : `${t('toolElementMode')}, ${t('toolElementDepth', { level: pickLevel.level, count: pickLevel.count })}, ${t('toolElementKeys')}`,
        ...(pickLevel === undefined
          ? {}
          : {
              depth: t('toolElementDepth', { level: pickLevel.level, count: pickLevel.count }),
              level: pickLevel.level,
              count: pickLevel.count,
              onDepth: nudgePicker,
            }),
      }
    : undefined

  const chromeStrips = (
    <>
      <ToolPalette
        stripRef={paletteRef}
        style={paletteStyle}
        guideSide={(palette ?? DEFAULT_PALETTE).x > 0.58 ? 'left' : 'right'}
        handle={paletteHandle}
        tools={tools}
        tool={tool}
        elementGuide={elementGuide}
        onChoose={chooseTool}
        t={t} />
      <FigureBar
        stripRef={barRef}
        style={barStyle}
        parked={barSpot !== undefined}
        handle={barHandle}
        pagingSlot={props.pagingSlot}
        shownColor={shownColor}
        styleOpen={styleOpen}
        foldOpensDown={foldOpensDown}
        onToggleStyle={() => { setOpenPanel(open => (open === 'style' ? null : 'style')) }}
        onChooseColor={chooseColor}
        goalOpen={goalOpen}
        summary={summary}
        onToggleGoal={() => { setOpenPanel(open => (open === 'goal' ? null : 'goal')) }}
        listOpen={listOpen}
        listedMarks={listedMarks}
        onToggleList={() => { setOpenPanel(open => (open === 'list' ? null : 'list')) }}
        pastCount={history.depth.past}
        futureCount={history.depth.future}
        undo={undo}
        redo={redo}
        isPage={isPage}
        onSend={props.onSend}
        sendToAgent={() => { if (props.onSend === undefined) void run('agent'); else props.onSend('agent') }}
        sendToComposer={() => { if (props.onSend === undefined) void run('composer'); else props.onSend('composer') }}
        busy={busy !== null}
        t={t} />
    </>
  )

  /**
   * The name of the element the pointer is on, written at its own corner.
   *
   * On both surfaces that have elements. An inline SVG uses the name alone beside its
   * own glow; a rendered document also gets the live box because its blocks are what
   * the reader is choosing between. A picture has no elements to name at all.
   */
  /**
   * The element the pointer is on, whichever half of the fence reported it.
   *
   * On a file the panel reads its own frame, so the chip stands for an element it can
   * still look at; on a proxied page the page reported the name, because nothing here
   * can read a box across an origin.
   */
  const chip: { readonly anchor: MarkAnchor; readonly left: number; readonly top: number; readonly name?: string } | null =
    liveHover !== null
      ? {
        ...nameChipAt(liveHover.anchor.bbox, [htmlScroll.x, htmlScroll.y], { width: fitWidth }),
        anchor: liveHover.anchor,
        name: liveHover.name,
      }
      : (isHtml || isVector) && chipAnchor !== null
        ? {
          ...nameChipAt(chipAnchor.bbox, [htmlScroll.x, htmlScroll.y], {
            width: htmlWidth,
          }),
          anchor: chipAnchor,
        }
        : null
  /**
   * Whether the page under the overlay owns the pointer.
   *
   * Reading is the page's own: a link follows, a video plays, the page scrolls itself.
   * Choosing an element is the one act that has to reach into the page — and only on a
   * page the panel cannot read, where the reader marks by pointing instead of by
   * reading the DOM. Anything being drawn takes the pointer back to this side.
   */
  // While a mark is selected the overlay owns one blank click so the comment can
  // close. With nothing selected the document is handed back to the iframe, which
  // is what lets links, text, and page controls work normally.
  // A live service page owns its own pointer in ordinary reading and element modes.
  // A selected mark puts the overlay back in front so one blank press can close its
  // comment.
  const passing = previewPage !== null && selectedId === null
    && (tool === 'select' || tool === 'element')
  /** The address the frame is pointed at, when it is not the file's own document. */
  const pageUrl = previewPage === null ? undefined : previewPage.url
  /** The quiet directory breadcrumb shown beside a file's name while it is at rest. */
  const liveParent = loaded === null ? '' : parentPathOf(loaded.path)

  return (
    <div className="da-root" data-html={isHtml} data-live-open={liveAddressOpen}
      data-live-error={liveAddressOpen && liveError !== null}
      data-compact={fitWidth > 0 && fitWidth < 360} ref={rootRef}>
      {hostError === null ? null : <div className="da-status" data-tone="error">{`${t('readError')}${hostError}`}</div>}
      {loaded === null || loaded.unreadable.length === 0 ? null : (
        // The marks are on disk and are not on the panel. Saying nothing would be the
        // same answer as "never annotated", which is exactly the wrong thing to tell
        // the reader about their own work; saying which file is in the way is what
        // lets them do something about it.
        <div className="da-status" data-tone="error">{`${t('annotationUnreadable')}${loaded.unreadable.join(', ')}`}</div>
      )}
      {stale ? <div className="da-status" data-tone="error">{t(isHtml ? 'htmlStale' : 'stale')}</div> : null}
      <ToastStack view={toasts} label={t('close')} resendLabel={t('toastResend')} />

      {/* The address is a closed drawer by default: one location icon in the corner,
          rather than a filename card taking a slice of every HTML preview. Opening it
          gives the same file/page field as before; the icon itself closes it again. */}
      <div className="da-live-bar" data-open={liveAddressOpen}
        hidden={!isHtml || props.livePage !== undefined}>
        <div className="da-live-field" data-live={livePage !== null}
          data-open={liveAddressOpen}
          title={loaded?.path ?? undefined}>
          <button
            type="button"
            className="da-live-toggle"
            aria-expanded={liveAddressOpen}
            aria-label={t(liveAddressOpen ? 'liveAddressCollapse' : 'liveAddressExpand')}
            title={liveAddressOpen ? t('liveAddressCollapse') : loaded?.path ?? t('liveAddressExpand')}
            onClick={() => { setLiveAddressOpen(open => !open) }}>
            {livePage === null ? (
              <svg className="da-live-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M6.5 3.5h7l4 4v13h-11zM13.5 3.5v4h4M9 11.5h6M9 14.5h6M9 17.5h4" />
              </svg>
            ) : (
              <svg className="da-live-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <circle cx="12" cy="12" r="8.5" />
                <path d="M3.8 12h16.4M12 3.5c2.3 2.3 3.5 5.1 3.5 8.5S14.3 18.2 12 20.5M12 3.5C9.7 5.8 8.5 8.6 8.5 12s1.2 6.2 3.5 8.5" />
              </svg>
            )}
          </button>
          {liveAddressOpen ? (
            <>
              <span className="da-live-parent"
                hidden={livePage !== null || liveText !== null || liveParent === ''}>
                {liveParent}
                <span className="da-live-parent-sep" aria-hidden>/</span>
              </span>
              <input
                ref={liveAddressRef}
                className="da-live-addr"
                value={shownAddress(liveText, livePage, loaded?.path ?? '')}
                aria-label={t('liveAddress')}
                placeholder={t('liveAddress')}
                autoComplete="off"
                spellCheck={false}
                // Coming back to the field shows the resting address again, so a page
                // the reader half-typed over is what they are looking at, not a leftover.
                onFocus={() => {
                  setLiveText(null)
                  setLiveError(null)
                }}
                onChange={(event) => {
                  setLiveText(event.target.value)
                  // The refusal belonged to the previous value; keeping it under a new
                  // address makes a correction look like another failure before Enter.
                  setLiveError(null)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    void openPage(event.currentTarget.value)
                  }
                  if (event.key === 'Escape') {
                    setLiveText(null)
                    // Giving the field back also gives back what it framed. A red
                    // refusal left under the restored filename reads as a failure of
                    // that file.
                    setLiveError(null)
                  }
                }}
              />
              {livePage === null ? (
                <span className="da-live-badge" aria-hidden="true">HTML</span>
              ) : (
                <button type="button" className="da-live-refresh"
                  aria-label={t('liveRefresh')}
                  title={t('liveRefresh')}
                  onClick={refreshLiveFrame}>
                  <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                    <path d="M13 5.5V2.8m0 0H10.2M13 2.8A6 6 0 1 0 14 9" />
                  </svg>
                </button>
              )}
            </>
          ) : null}
        </div>
        {liveAddressOpen ? (
          <>
            <span className="da-live-note" hidden={!liveBusy}>{t('liveOpening')}</span>
            <button type="button" className="da-live-back"
              hidden={livePage === null || fileBeforeLive.current === null}
              onClick={() => {
                const file = fileBeforeLive.current
                if (file !== null) closePage(file)
              }}>{t('liveBack')}</button>
          </>
        ) : null}
      </div>
      <span className="da-live-error"
        hidden={props.livePage !== undefined || !liveAddressOpen || liveError === null}>{liveError}</span>

      {deckCount < 2 || previewPage !== null ? null : (
        <div className="da-deck-pager" role="group" aria-label={t('pagerLabel')}>
          <button type="button" aria-label={t('previousPage')} title={t('previousPage')}
            disabled={deckPage === 0}
            onClick={() => { turnDeck(page => page - 1) }}>
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path d="m9.5 3.5-4 4.5 4 4.5" />
            </svg>
          </button>
          <span aria-live="polite">
            {t('pageOf', { page: deckPage + 1, pages: deckCount })}
          </span>
          <button type="button" aria-label={t('nextPage')} title={t('nextPage')}
            disabled={deckPage === deckCount - 1}
            onClick={() => { turnDeck(page => page + 1) }}>
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path d="m6.5 3.5 4 4.5-4 4.5" />
            </svg>
          </button>
        </div>
      )}

      <FigureRoom
        stageRef={attachStage}
        surfaceRef={surfaceRef}
        paperRef={paperRef}
        figureRef={figureRef}
        hostRef={figureHostRef}
        frameRef={frameRef}
        surfaceStyle={surfaceStyle}
        paperStyle={paperStyle}
        figureStyle={figureStyle}
        figure={figure}
        size={size}
        // Before the pane has a height, the frame still gets the contracted layout
        // width and a zero-height window so its document can perform a first layout.
        htmlView={htmlView ?? (previewPage === null
          ? { width: htmlWidth, height: fitHeight }
          : { width: fitWidth, height: fitHeight })}
        stageClass={{
          hand: tool === 'select' && previewPage === null,
          panning,
          pannable,
        }}
        // A page is the reader's own while nothing is being drawn on it: the frame
        // takes the pointer, the overlay steps aside, and only the marks stay pressable.
        passing={passing}
        pageUrl={pageUrl}
        frameRevision={frameRevision}
        onContextMenu={openMenu}
        onRasterLoad={setFileRasterSize}
        overlay={paper === null || size === null ? null : (
          <Canvas
            inputRef={canvasInput}
            // The paper, not the figure: a mark in the margin has to have
            // somewhere to be drawn and somewhere to be pressed.
            width={paper.width}
            height={paper.height}
            origin={[-paper.x, -paper.y]}
            // A document surface is a window onto a longer page: the marks keep their
            // document pixels and the overlay is moved under them by however far the
            // page has been scrolled, which is the same shift the pointer math undoes.
            shift={figure?.kind === 'html' ? [htmlScroll.x, htmlScroll.y] : undefined}
            // The pen is the figure's, not the paper's: a mark drawn past the edge
            // grows the paper, and a pen that grew with it drew thicker than the
            // picture the agent receives.
            figureSize={size}
            // Only the marks of the page in front: a document's other pages are still
            // this document's marks, but they are not about the page being looked at.
            marks={visibleMarks}
            tool={tool}
            color={color}
            weight={weight}
            scale={scale}
            containerRef={figureHostRef}
            anchoring={isVector}
            // A rendered document's elements occupy the boxes the layout gave them, so
            // the mark draws that box beside the name. A drawing's do not.
            elementExtent={figure?.kind === 'html' ? 'box' : undefined}
            anchorAtFigurePoint={figure?.kind === 'html' ? anchorAtFigurePoint : undefined}
            anchorChoicesAtFigurePoint={figure?.kind === 'html' ? anchorChoicesAtFigurePoint : undefined}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onAdd={addMark}
            onMove={moveMark}
            onUpdate={updateMark}
            onRemove={removeMark}
            onPan={panBy}
            onPanStart={() => { setPanning(true) }}
            onPanEnd={() => { setPanning(false) }}
            pannable={pannable}
            // A local document uses the ordinary zoom machine while its page scrolls
            // inside the frame. A proxied page owns both gestures in its own origin.
            onZoomAt={previewPage === null ? pinchBy : undefined}
            onHover={lightElement}
            onPickMiss={() => { setStatus({ tone: 'info', text: t('toolElementMiss') }) }}
            onEdit={editMark}
            onDrawn={finishDrawing}
            onLiveEdit={setLiveMark}
            numbering={props.numbering}
          />
        )}
        chip={chip === null ? null : (
          <>
            {/* The element a click would take, shown as a box rather than as a light on
                the element: a rendered document's element is a block of the page, and a
                glow across it is a haze over the reader's own type. The box is the same
                statement the placed mark makes, so pointing and having pointed at speak
                one language — and it is here for both ways of reading the document, the
                frame this side can read and the page it only hears from. */}
            {isHtml ? (
              <span className="da-live-hit" style={hoverBoxAt(chip.anchor.bbox, [htmlScroll.x, htmlScroll.y])} />
            ) : null}
            <span className="da-name" style={{ left: chip.left, top: chip.top }}>
              {elementName(chip.anchor, findElement, chip.name)}
            </span>
          </>
        )}
        t={t}
      />

      {/* The figure's own menu: the file behind it, and the way out to someone who
          can act on it. Drawn at the pointer and closed by anything else, the way a
          context menu is everywhere. */}
      {menuAt === null ? null : (
        <FigureMenuCard
          menuRef={menuRef}
          at={{ left: menuAt.left, top: menuAt.top }}
          rows={menuItems}
          onChoose={(id) => {
            /* v8 ignore next -- a row is only offered once a figure has loaded. */
            if (menuAt === null) return
            runMenu(id as FigureMenuAction, menuAt.path, menuAt.workspace)
          }}
          t={t}
        />
      )}

      {/* The figure keeps the whole panel; the words about it float over it. Each
          is opened from the actions row and closes on its own button, so nothing
          about a record sits on screen while the reader is drawing. */}
      {/* What the figure as a whole should become. One per figure, so it is a
          fold of its own rather than a field beside one mark. */}
      {/* The figure keeps the whole panel; the words about it float over it. Each
          is opened from the actions row and closes on its own button, so nothing
          about a record sits on screen while the reader is drawing. */}
      {/* What the figure as a whole should become. One per figure, so it is a
          fold of its own rather than a field beside one mark. */}
      {goalOpen ? (
        <SummaryRecord
          at={floatsAt}
          summary={summary}
          onWrite={writeSummary}
          onClose={() => { setOpenPanel(null) }}
          t={t}
        />
      ) : null}

      {/* The map of the document: every mark it holds, numbered as the document
          numbers it. A page body lists the whole file, not its own sheet, because
          the list is what the reader checks before sending — and what is sent is
          the file. */}
      {listOpen ? (
        <MarkList
          at={floatsAt}
          marks={listedMarks}
          selectedId={selectedId}
          onReveal={reveal}
          onRemove={removeMark}
          // Undo covers the marks this body holds. A row from another page of a
          // document cannot be walked back here, so it does not offer the ✕ that
          // would drop it for good: pressing the row turns to its page instead. A
          // mark with no page is a single figure's own, and this body holds them all.
          canRemove={(mark) => mark.page === undefined || marks.some(own => own.id === mark.id)}
          onClear={() => { void clearAnnotation() }}
          onClose={() => { setOpenPanel(null) }}
          t={t}
        />
      ) : null}

      {/* The selected mark's words, beside the mark rather than under the figure.
          Selecting a mark is the gesture that asks for this card, so it needs no
          button of its own; a reader who has picked something out means to say
          what is wrong with it. */}
      {selected === null || detailAt === null ? null : (
        <DetailPill
          pillRef={pillRef}
          inputRef={detailRef}
          at={{ left: detailAt.left, top: detailAt.top }}
          mark={selected}
          onWrite={(value) => { setMarkDetail(selected.id, value) }}
          onSendToAgent={() => { void sendOne(selected, 'agent') }}
          onSendToComposer={() => { void sendOne(selected, 'composer') }}
          busy={busy !== null}
          t={t}
        />
      )}

      {/* How heavy the pen is — or how big a point mark's pin is — on a rail of its
          own down the left edge, which is where a drawing tool puts its weight and
          where the reader's eye already looks for one. It only appears once there is
          something to size: a mark to change, or a tool armed to draw the next one. */}
      {!chrome || shownWeight === null ? null : (
        <WeightRail
          trackId={trackId}
          value={shownWeight}
          fraction={weightFraction}
          onChange={chooseWeight}
          t={t}
        />
      )}
      {/* The tools float, so they can be parked off whichever corner of the figure
          the reader is working on. The handle above the tiles is what drags it; the
          tiles themselves stay buttons, because a drag that starts on a tool should
          still arm that tool. */}
      {/* Drawn into the owner's pane when there is one, so scrolling the document
          does not carry the tools off the screen with it. */}
      {!chrome ? null : props.chromeHost === undefined || props.chromeHost === null
        ? chromeStrips
        : createPortal(chromeStrips, props.chromeHost)}
    </div>
  )
}

/** Language namespace this body's copy registers under. */
export { NAMESPACE }
