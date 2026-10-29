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
import { Canvas, type MarkPatch, type Tool } from './Canvas'
import { deliverToComposer } from './composer'
import { composeReviewSvg, rasterizePng, reviewSize, type FigureLayer } from './export'
import { anchorInDocument, loadFrameDocument } from './html-dom'
import { AUTOSAVE_DELAY_MS, annotationSignature, createAutosave, type Autosave } from './autosave'
import { readPreferences, rememberPreferences, type PaletteSpot } from './preferences'
import {
  clampMenu, copiedText, figureMenuItems, pressedInsideMenu, relativeTo, type FigureMenuAction,
} from './figure-menu'
import {
  copyImageToClipboard, desktopAvailable, openOnDesktop, revealOnDesktop,
} from './host-actions'
import { AnnotatorHostError, deleteAnnotation, loadAnnotation, saveAnnotation, type LoadedAnnotation } from './host-api'
import { NAMESPACE } from './locales'
import { elementAt, ensureSpotlight, moveSpotlight, type LitSpot } from './spotlight'
import { deliverAnnotation } from './session'
import { ensureStyles } from './styles'
import { PINCH_SETTLE_DELAY_MS, anchoredScroll, clampZoom, wheelZoomFactor } from './zoom'
import {
  DETAIL_HEIGHT, DETAIL_WIDTH, measuredSize, placeAboveBar, placeCard, scaledBox,
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
import { DEFAULT_PALETTE, draggedSpot, placementStyle } from './annotator/placement'
import {
  clipStatus, failureStatus, handoffDelivered, handoffDeliveredOne, handoffStarted, hostGestureStatus,
} from './annotator/delivery'
import { decodeFigure, figureLayer, figureSize, type LoadedFigure } from './annotator/figure-source'
import {
  appendedMarks, detailedMarks, movedMarks, patchedMarks, patchChangesNothing, removedMarks,
} from './annotator/mark-edits'
import { MarkList, SummaryRecord } from './annotator/records'
import { collectLitSpots } from './annotator/spotlights'
import { COLORS, ELEMENT_TOOLS, TOOLS } from './annotator/tokens'
import { WeightRail } from './annotator/weight-rail'

export type { AnnotatorBodyProps, AnnotatorInjected, BodyContent, PageSurface, SurfaceDraft, Translate, TranslateVars } from './annotator-contract'




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
  const mediaType = figureMediaType(parsedAddress?.path ?? '')
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
   * Move the view by a drag.
   *
   * The scroll offset is written straight onto the element rather than held in
   * state: a pan is a stream of moves, and routing each one through React would
   * make the picture trail the hand by a frame. The CSS `overflow` already keeps
   * the offset inside the scrollable range, so an overshoot at an edge simply does
   * nothing instead of needing a clamp here.
   * @param dx - horizontal travel of the pointer, in client pixels.
   * @param dy - vertical travel of the pointer.
   */
  const panBy = useCallback((dx: number, dy: number): void => {
    const stage = stageRef.current
    /* v8 ignore next -- a pan comes from the overlay, which only exists inside the stage. */
    if (stage === null) return
    // Dragging right moves the picture right, which means scrolling left: the hand
    // pushes the paper, it does not push a scroll bar.
    stage.scrollLeft -= dx
    stage.scrollTop -= dy
  }, [])

  const [fileFigure, setFileFigure] = useState<LoadedFigure | null>(null)
  const [fileRasterSize, setFileRasterSize] = useState<{ readonly width: number; readonly height: number } | null>(null)
  /** Height a rendered document reports, in figure pixels; 0 until the frame has laid out. */
  const [htmlHeight, setHtmlHeight] = useState(0)
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
   * Shut the style panel when the reader picks up a tool.
   *
   * Arming a tool is the moment the panel has done its job; leaving it open over
   * the figure would hide the very corner the next stroke starts in.
   */
  useEffect(() => {
    setOpenPanel(current => (current === 'style' ? null : current))
  }, [tool])

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
  const [busy, setBusy] = useState<'sending' | null>(null)
  const [status, setStatus] = useState<{ tone: 'ok' | 'error' | 'info'; text: string } | null>(null)
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
  const paletteRef = useRef<HTMLDivElement | null>(null)
  const [dragging, setDragging] = useState(false)
  const dragFrom = useRef<{ pointerId: number; origin: PaletteSpot; box: DOMRect } | null>(null)
  /** The palette's box, in percentages of the panel. */
  const paletteStyle = placementStyle(palette ?? DEFAULT_PALETTE)

  /**
   * The floating bar's own spot, and the bits a drag of it needs.
   *
   * The bar starts where a bar belongs — centred along the bottom — and can be
   * dragged off that edge when it covers the part of the figure being worked on.
   * Its default is not a fraction of the panel but an anchor to the bottom edge, so
   * that widening the pane keeps it centred rather than walking it sideways.
   */
  const [barSpot, setBarSpot] = useState<PaletteSpot | undefined>(remembered.bar)
  const [barDragging, setBarDragging] = useState(false)
  const barFrom = useRef<{ pointerId: number; origin: PaletteSpot; box: DOMRect } | null>(null)
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
   */
  const followPointer = useCallback((
    event: ReactPointerEvent<HTMLDivElement>,
    from: { current: { pointerId: number; origin: PaletteSpot; box: DOMRect } | null },
    write: (spot: PaletteSpot | undefined) => void,
    strip: HTMLElement | null,
  ): void => {
    const held = from.current
    // Measured against the box the strip is actually placed in, which is not always
    // this body's own: a paged document portals the chrome into the pane, and a
    // fraction of the page applied inside the pane walks the strip off its edge.
    const root = strip?.offsetParent ?? rootRef.current
    // A move without a press on the handle is not a drag of ours.
    /* v8 ignore next */
    if (held === null || root === null || !(root instanceof Element)) return
    const bounds = root.getBoundingClientRect()
    /* v8 ignore next -- both call sites hold a live ref for the whole drag. */
    const width = strip?.offsetWidth ?? 0
    /* v8 ignore next -- both call sites hold a live ref for the whole drag. */
    const height = strip?.offsetHeight ?? 0
    write(draggedSpot(held, event, bounds, { width, height }))
  }, [])
  const dragPalette = useCallback((event: ReactPointerEvent<HTMLDivElement>): void => {
    followPointer(event, dragFrom, setPalette, paletteRef.current)
  }, [followPointer])
  const dragBar = useCallback((event: ReactPointerEvent<HTMLDivElement>): void => {
    followPointer(event, barFrom, setBarSpot, barRef.current)
  }, [followPointer])

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
      /* v8 ignore next -- nothing to measure against until the panel is mounted. */
      if (rootRef.current === null) return
      /* v8 ignore next -- jsdom has no pointer capture; a browser always does. */
      event.currentTarget.setPointerCapture?.(event.pointerId)
      dragFrom.current = {
        pointerId: event.pointerId,
        origin: palette ?? DEFAULT_PALETTE,
        box: { left: event.clientX, top: event.clientY } as DOMRect,
      }
      setDragging(true)
    },
    onMove: dragPalette,
    onUp: (event) => {
      /* v8 ignore next -- jsdom has no pointer capture; a browser always does. */
      event.currentTarget.releasePointerCapture?.(event.pointerId)
      dragFrom.current = null
      setDragging(false)
    },
    onCancel: () => { dragFrom.current = null; setDragging(false) },
  }

  /** The bar's drag, on the same terms as the palette's. */
  const barHandle: StripHandle = {
    dragging: barDragging,
    onDown: (event) => {
      /* v8 ignore next -- nothing to measure against until the panel is mounted. */
      if (rootRef.current === null) return
      /* v8 ignore next -- jsdom has no pointer capture; a browser always does. */
      event.currentTarget.setPointerCapture?.(event.pointerId)
      barFrom.current = {
        pointerId: event.pointerId,
        origin: barSpot ?? DEFAULT_PALETTE,
        box: { left: event.clientX, top: event.clientY } as DOMRect,
      }
      setBarDragging(true)
    },
    onMove: dragBar,
    onUp: (event) => {
      /* v8 ignore next -- jsdom has no pointer capture; a browser always does. */
      event.currentTarget.releasePointerCapture?.(event.pointerId)
      barFrom.current = null
      setBarDragging(false)
    },
    onCancel: () => { barFrom.current = null; setBarDragging(false) },
  }

  useEffect(() => {
    rememberPreferences({ color, weight, ...(palette === undefined ? {} : { palette }), ...(barSpot === undefined ? {} : { bar: barSpot }) })
  }, [barSpot, color, palette, weight])

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
   * The surface's measurable size; null until its content and dimensions are both
   * known. A rendered document is measurable as soon as its width is — the frame
   * reports how tall its content is, and until it does the surface has no height.
   */
  const size = useMemo(() => figureSize(figure, rasterSize, htmlHeight), [figure, htmlHeight, rasterSize])
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
   */
  const paper = size === null ? null : plotBounds(size.width, size.height, marks, unit)

  /**
   * Everything a background write needs, read at write time.
   *
   * A write runs from a timer that outlives the render that scheduled it, so it has
   * to read the surface's state as it is now. Closing over it would write whatever
   * was on screen six hundred milliseconds ago — which is exactly the edit the
   * reader just made.
   */
  const live = useRef({ address, loaded, marks, summary, size, createdAt })
  live.current = { address, loaded, marks, summary, size, createdAt }

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
    if (data === undefined || mediaType === undefined) return
    const decoded = decodeFigure(data, mediaType)
    const loaded = decoded.figure
    if (loaded === undefined) {
      setFigureError(t('loadFailed'))
      return
    }
    if (loaded.kind === 'html') {
      // The frame is sized to its content, so the height it reports is the whole
      // document's; until it reports one the marks file has no surface to describe.
      setHtmlHeight(0)
      setFigureError(null)
    }
    // A raster has no size until the browser has decoded it, and this is a new one.
    if (loaded.kind === 'raster') setFileRasterSize(null)
    setFileFigure(loaded)
    if (loaded.kind !== 'raster') return
    return () => { URL.revokeObjectURL(loaded.objectUrl) }
  }, [data, mediaType, surface, t])

  // --- rendered document ----------------------------------------------------

  /** The document to load into the frame, or null when this body holds no document. */
  const htmlSource = figure?.kind === 'html' ? figure.document : null

  /**
   * Put the prepared document into the frame and take the height it reports.
   *
   * The frame is a same-origin sandbox with scripts off, so what it holds is
   * markup the body may read and nothing that runs. Sizing the frame to its own
   * content is what keeps it from scrolling internally — and that, in turn, is
   * what makes an element's own box and a mark's figure coordinates one space.
   */
  useEffect(() => {
    if (htmlSource === null) return
    const root = loadFrameDocument(frameRef.current, htmlSource)
    if (root === undefined) return
    const measure = (): void => {
      // A frame that has laid out nothing yet reports no height; keeping the last
      // measurement leaves the surface where it was rather than collapsing it.
      if (root.scrollHeight > 0) setHtmlHeight(root.scrollHeight)
    }
    measure()
    // Content that arrives later — a font, an image, a reflow — changes the height.
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    return () => { observer.disconnect() }
  }, [htmlSource])

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
          // the answer was in flight. Both stacks stay as they are: nothing came back
          // that was not already there.
          history.replace(saved.marks)
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
  }, [address, isPage, mediaType, writeSummary])

  // --- fit width ------------------------------------------------------------

  useEffect(() => {
    const stage = stageRef.current
    if (stage === null) return
    const measure = (): void => { setFitWidth(stage.clientWidth - 24) }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(stage)
    return () => { observer.disconnect() }
  }, [])

  const scale = useMemo(
    // The paper, not the figure: the paper is what the surface is laid out at, so
    // fitting the figure left the panel wider than its box as soon as a mark reached
    // past the figure's edge.
    () => drawingScale({ zoom, fitWidth, surface: paper, ownerWidth: props.fitWidth }),
    [zoom, fitWidth, paper, props.fitWidth],
  )

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
  }, [barSpot, goalOpen, listOpen, size, htmlHeight])

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
    const mark = marks.find(candidate => candidate.id === selectedId)
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
    const at = placeCard(
      scaledBox(
        box,
        { x: measured.left, y: measured.top, width: measured.width, height: measured.height },
        { x: panel.left, y: panel.top, width: panel.width, height: panel.height },
        size.width,
      ),
      panel.width,
      panel.height,
      pillSize,
    )
    // Only a moved card is news. Storing a fresh object every time would make the
    // effect its own trigger: a page body rebuilds `size` from its owner's surface,
    // so an unconditional set here re-renders, re-runs, and spins.
    setDetailAt(previous => previous !== null && previous.left === at.left && previous.top === at.top ? previous : at)
    // `marks` changes on every keystroke in the pill, which is also when the pill's own
    // height can change, so the re-measurement happens by itself. The write is
    // idempotent, so a measured height that did not move re-renders nothing.
  }, [htmlHeight, liveMark, marks, scale, selectedId, size, unit])

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

  useEffect(() => () => { clearTimeout(settleTimer.current) }, [])

  useEffect(() => {
    const stage = stageRef.current
    if (stage === null) return
    /**
     * The wheel is the magnification, whatever modifier it carries.
     *
     * It used to be two gestures in one: a plain wheel panned the scrollport, and
     * only a ctrl-modified one — which is how a trackpad reports a pinch — zoomed.
     * That split is what made the gesture ambiguous: over a page that fits the pane
     * there is nothing to scroll, so a plain wheel looks like a request for another
     * page, while the reader who wants a closer look makes exactly the same motion.
     * One motion, one meaning: up magnifies, down shrinks, and a pinch arrives as the
     * same thing with a modifier on it.
     *
     * Panning is still there — a drag with the select tool moves the view — so
     * nothing is lost by taking the wheel's second job away from it.
     */
    const onWheel = (event: WheelEvent): void => {
      event.preventDefault()
      zoomAt(
        liveScale.current * wheelZoomFactor(event.deltaY, event.deltaMode, stage.clientHeight),
        event.clientX,
        event.clientY,
      )
    }
    // Not passive: a passive listener may see the event but cannot keep the
    // browser from acting on it, and the browser's own pinch-zoom is exactly
    // what this handler exists to replace.
    stage.addEventListener('wheel', onWheel, { passive: false })
    return () => { stage.removeEventListener('wheel', onWheel) }
  }, [zoomAt])

  // --- edits ----------------------------------------------------------------

  const { commit } = history

  const addMark = useCallback((mark: AnnotationMark): void => { commit(appendedMarks(marks, mark)) }, [commit, marks])

  const removeMark = useCallback((id: string): void => {
    // A mark on another page of the document cannot be removed from this page's own
    // draft: the owner holds the other pages, so the owner is the one that drops it.
    if (props.onDocumentRemove !== undefined && !marks.some(mark => mark.id === id)) {
      props.onDocumentRemove(id)
      return
    }
    commit(removedMarks(marks, id))
    // Only the row that went takes the selection with it. The updater reads the
    // selection at the moment it runs, so pruning one row leaves the comment card of
    // another open — a reader who deletes mark 2 was losing the card they were typing
    // mark 1 into.
    setSelectedId(current => (current === id ? null : current))
  }, [commit, marks, props.onDocumentRemove, setSelectedId])

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
    if (isPage || address === '') return
    if (loaded === null || size === null) return
    // What was just read is what is already there: a load is not an edit.
    if (writtenSignature.current === null) {
      writtenSignature.current = annotationSignature(marks, summary)
      return
    }
    autosave.current?.schedule()
  }, [address, isPage, loaded, marks, size, summary])

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
      // Escape lets go of the selection. It used to leave a viewing mode as well;
      // there is no such mode now, so the selection is all there is to drop.
      if (key === 'Escape') {
        if (selectedId === null) return
        event.preventDefault()
        setSelectedId(null)
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
  }, [redo, removeMark, selectedId, undo])

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
    return buildAnnotationDocument({
      figure: { address, path: loaded.path, mediaType: loaded.mediaType, sha256: loaded.sha256 },
      size: target,
      marks: scope,
      summary,
      createdAt,
      now: new Date().toISOString(),
    })
  }, [address, createdAt, loaded, marks, summary])

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
    setStatus(current => (current !== null && current.tone === 'error' ? null : current))
  }, [])

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
        if (state.address === '' || state.loaded === null || state.size === null) return
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
      await deleteAnnotation(address)
    } catch (error) {
      setStatus(failureStatus(t, 'clearError', error))
    }
    commit([])
    setCreatedAt(null)
    setStale(false)
    setSelectedId(null)
    writeSummary('')
  }, [address, commit, t, writeSummary])

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
    // The only enforcement point: the toolbar buttons stay clickable so this
    // guard is what decides, not a disabled attribute that hides the reason.
    // A surface with no height is one nothing could have been drawn on, and it is
    // not a surface a marks file may describe.
    const scope = only === undefined ? marks : [only]
    if (scope.length === 0 || size === null || size.height <= 0) return
    setBusy('sending')
    setStatus(handoffStarted(t, target))
    try {
      // Everything that can refuse the hand-off is asked *before* anything is
      // written. Saving first and asking afterwards left a narrowed document on disk
      // for a send that never happened: the reader was told the save failed and the
      // screen looked untouched, while the sidecar already held the subset. A refusal
      // has to leave no trace at all.
      if (sessionId === undefined) throw new Error('the figure address carries no session')
      if (target === 'composer' && props.conversation === undefined) {
        throw new Error('the conversation service is unavailable')
      }
      if (target === 'agent' && props.sessions === undefined) {
        throw new Error('the sessions service is unavailable')
      }
      const document_ = buildDocument(size, scope)
      if (document_ === null) throw new Error(t('loadFailed'))
      // A picture is only needed when the marks claim an extent. A figure whose
      // marks are all points carries its whole meaning in the numbered list, and a
      // rendered document cannot be flattened at all — both travel as text.
      const review = layer === null || !needsReviewImage(document_)
        ? undefined
        // Numbered from the scope's own order, which is the order the message numbers
        // it in: the picture says ① next to the shape the prose calls ①.
        : await exportPng(layer, scope)
      const saved = await saveAnnotation(address, document_, review)
      // The delivered document is what is on disk now; a pending draft write would
      // only repeat it (or, worse, race the delete that follows the hand-off).
      autosave.current?.cancel()
      writtenSignature.current = annotationSignature(document_.marks, document_.summary ?? '')
      setCreatedAt(document_.createdAt)
      setStale(false)
      const pageImages = review === undefined ? [] : [{ page: 1, image: review }]
      const locale = (props.localeId ?? 'zh').startsWith('en') ? 'en' : 'zh'
      if (target === 'composer' && props.conversation !== undefined) {
        deliverToComposer({
          conversation: props.conversation,
          sessionId,
          document: document_,
          paths: saved,
          files: pageImages.map(entry => new File([entry.image], `page-${entry.page}.png`, { type: 'image/png' })),
          locale,
        })
      } else if (props.sessions !== undefined) {
        await deliverAnnotation({
          sessions: props.sessions,
          // A single-surface figure is reviewed as the picture it is, which travels
          // as an image part and not as an attached file.
          fileUpload: undefined,
          sessionId,
          document: document_,
          paths: saved,
          pageImages,
          annotatedPdf: undefined,
          locale,
        })
      }
      if (only === undefined) {
        setStatus(handoffDelivered(t, target))
        await discard()
        return
      }
      // Only the mark that was sent leaves. The sidecar on disk describes that one
      // mark, so it has to be rewritten from the survivors — letting the autosave
      // notice the change does that, because the signature recorded above still
      // names the delivered document.
      commit(removedMarks(marks, only.id))
      // The mark that was sent is gone, so it cannot stay selected: the pill would be
      // showing a sentence for a mark that is no longer on the figure.
      setSelectedId(null)
      autosave.current?.schedule()
      setStatus(handoffDeliveredOne(t, target))
    } catch (error) {
      setStatus(failureStatus(t, 'saveError', error))
    } finally {
      setBusy(null)
    }
  }, [address, buildDocument, commit, discard, exportPng, layer, marks, props.conversation, props.localeId, props.sessions, sessionId, setSelectedId, size, t])

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
    const height = menuItems.length * 27
    const placed = clampMenu(
      { x: event.clientX, y: event.clientY },
      { width: window.innerWidth, height: window.innerHeight },
      { width: 208, height },
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
      if (event.key === 'Escape') setMenuAt(null)
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
  const isHtml = mediaType === 'text/html'
  /** Name what one figure point landed on, for a surface that holds its own elements. */
  const anchorAtFigurePoint = useCallback(
    (x: number, y: number) => anchorInDocument(frameRef.current?.contentDocument, x, y),
    [],
  )

  /**
   * Light the element a click would take, in the figure's own shapes.
   *
   * The picker says which element by name — the selector the anchor already carries —
   * and this turns that name back into the element, in whichever document the figure's
   * elements live. An inline SVG's are in this panel's document, rooted at the host
   * the markup was injected into; a rendered document's are inside its frame, where
   * the rule for the light has to be written into the figure's own stylesheet first,
   * because that document's policy keeps the panel's stylesheet out.
   *
   * `undefined` puts the light out, which is what leaving the figure and putting the
   * picker away both mean.
   */
  /**
   * The element a selector names, in whichever document the figure's elements live.
   *
   * An inline SVG's elements are in this panel's document, rooted at the host the
   * markup was injected into; a rendered document's are inside its frame, where the
   * rule for the light has to be written into the figure's own stylesheet first,
   * because that document's policy keeps the panel's stylesheet out.
   *
   * @param selector - the element's name, as an anchor spells it.
   * @returns the element, or undefined when the figure no longer has one by that name.
   */
  const findElement = useCallback((selector: string): Element | undefined => {
    // Whichever document the figure's elements are in. A ref that is still empty means
    // nothing has mounted yet, which is not an error: there is no element to light, and
    // the effect that runs once the figure arrives asks again.
    /* v8 ignore start -- a body only asks once its figure has mounted, so neither ref is empty here. */
    if (isHtml) {
      const doc = frameRef.current?.contentDocument ?? null
      if (doc === null) return undefined
      ensureSpotlight(doc)
      return elementAt({ root: doc, selector })
    }
    const host = figureHostRef.current
    return host === null ? undefined : elementAt({ root: host, selector })
    /* v8 ignore stop */
  }, [isHtml])

  /**
   * Every element the figure should be lit on right now.
   *
   * Two things are lit, and they are different kinds of statement: an element *mark*
   * keeps its light for as long as the mark exists — that is how a placed element is
   * drawn at all, since it has no path of its own — and the picker's preview lights
   * whatever a click would take, on top of those. The selected mark is lit harder.
   *
   * Built fresh rather than accumulated: the marks change, the figure is reloaded, and
   * a list patched in place would keep lighting elements that are no longer there.
   *
   * @param preview - the element the picker is offering, if any.
   * @returns what to light, in a stable enough order that the class work is minimal.
   */
  const litSpots = useCallback(
    (preview: MarkAnchor | undefined): readonly LitSpot[] => collectLitSpots({
      marks,
      selectedId,
      preview,
      findElement,
    }),
    [findElement, marks, selectedId],
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

  const lightElement = useCallback((anchor: MarkAnchor | undefined): void => {
    hovered.current = anchor
    lightUp(anchor)
  }, [lightUp])

  if (mediaType === undefined) return <p className="da-hint">{t('unsupported')}</p>
  if (data === undefined && surface === undefined) return <p className="da-hint">{t(isHtml ? 'htmlLoading' : 'loading')}</p>
  // A tone of its own, not the quiet grey a loading note gets: this one is the
  // message that blocks the whole surface, and the panel has two ways of saying
  // "this did not work" — this was the quieter of the two.
  if (figureError !== null) return <p className="da-hint" data-tone="error" role="alert">{figureError}</p>

  /**
   * Press a row of the list: show that mark and put the pill beside it.
   *
   * The selection goes first and the page turn second, because a turn remounts this
   * body for another page and the mark has to already be the one selected when the
   * new page's pill is measured — otherwise the row would turn the page and leave
   * the reader with nothing to read on it.
   */
  const reveal = (mark: AnnotationMark): void => {
    setSelectedId(mark.id)
    revealOnPage(mark)
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

  const chromeStrips = (
    <>
      <ToolPalette
        stripRef={paletteRef}
        style={paletteStyle}
        handle={paletteHandle}
        tools={tools}
        tool={tool}
        onChoose={setTool}
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

  return (
    <div className="da-root" ref={rootRef}>
      {hostError === null ? null : <div className="da-status" data-tone="error">{`${t('readError')}${hostError}`}</div>}
      {loaded === null || loaded.unreadable.length === 0 ? null : (
        // The marks are on disk and are not on the panel. Saying nothing would be the
        // same answer as "never annotated", which is exactly the wrong thing to tell
        // the reader about their own work; saying which file is in the way is what
        // lets them do something about it.
        <div className="da-status" data-tone="error">{`${t('annotationUnreadable')}${loaded.unreadable.join(', ')}`}</div>
      )}
      {stale ? <div className="da-status" data-tone="error">{t(isHtml ? 'htmlStale' : 'stale')}</div> : null}
      {status === null ? null : <div className="da-status" data-tone={status.tone === 'info' ? undefined : status.tone}>{status.text}</div>}

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
        htmlHeight={htmlHeight}
        stageClass={{ hand: tool === 'select', panning }}
        onContextMenu={openMenu}
        onRasterLoad={setFileRasterSize}
        overlay={paper === null || size === null ? null : (
          <Canvas
            // The paper, not the figure: a mark in the margin has to have
            // somewhere to be drawn and somewhere to be pressed.
            width={paper.width}
            height={paper.height}
            origin={[-paper.x, -paper.y]}
            // The pen is the figure's, not the paper's: a mark drawn past the edge
            // grows the paper, and a pen that grew with it drew thicker than the
            // picture the agent receives.
            figureSize={size}
            marks={marks}
            tool={tool}
            color={color}
            weight={weight}
            scale={scale}
            containerRef={figureHostRef}
            anchoring={isVector}
            anchorAtFigurePoint={figure?.kind === 'html' ? anchorAtFigurePoint : undefined}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onAdd={addMark}
            onMove={moveMark}
            onUpdate={updateMark}
            onRemove={removeMark}
            onPan={panBy}
            onPanStart={() => { setPanning(true) }}
            onPanEnd={() => { setPanning(false) }}
            onHover={lightElement}
            onEdit={editMark}
            onDrawn={finishDrawing}
            onLiveEdit={setLiveMark}
            numbering={props.numbering}
          />
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
