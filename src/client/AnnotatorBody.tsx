/**
 * The document body: one figure with an optional annotation layer.
 *
 * It reads the figure's bytes from the document preview owner (so the plugin
 * never reads files itself), renders them, and hands finished marks to the Host
 * half for storage before delivering them to the agent as a user message.
 * @module dsh-figmark/client/AnnotatorBody
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { resolveTranslate, type AnnotatorBodyProps } from './annotator-contract'
import { parseFileAddress } from '../shared/address'
import type { AnnotationDocument, AnnotationMark, FigurePoint, MarkAnchor } from '../shared/annotation'
import {
  ANNOTATION_VERSION, WEIGHT_DEFAULT, WEIGHT_MAX, WEIGHT_MIN, clampWeight, needsReviewImage,
} from '../shared/annotation'
import { figureMediaType } from '../shared/figure-kind'
import { Canvas, type MarkPatch, type Tool } from './Canvas'
import { deliverToComposer } from './composer'
import { composeReviewSvg, rasterizePng, bytesToDataUrl, reviewSize, type FigureLayer } from './export'
import { figureSvgMarkup, parseFigureSvg, svgIntrinsicSize, svgViewBox } from './figure-dom'
import { RENDER_WIDTH, anchorInDocument, buildRenderedDocument, loadFrameDocument } from './html-dom'
import { AUTOSAVE_DELAY_MS, annotationSignature, createAutosave, type Autosave } from './autosave'
import { readPreferences, rememberPreferences, type PaletteSpot } from './preferences'
import { AnnotatorHostError, deleteAnnotation, loadAnnotation, saveAnnotation, type LoadedAnnotation } from './host-api'
import { NAMESPACE } from './locales'
import { draggedMarks } from './mark-geometry'
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

export type { AnnotatorBodyProps, AnnotatorInjected, BodyContent, PageSurface, SurfaceDraft, Translate, TranslateVars } from './annotator-contract'

/** Palette offered by the toolbar. */
const COLORS = ['#e03131', '#1971c2', '#f08c00', '#2f9e44'] as const

/**
 * The surface once its content is readable.
 *
 * One value rather than four pieces of state: a raster's own size only arrives
 * when the browser decodes it, and spread across separate `useState` calls that
 * produced combinations (a size with no layer, a URL with no bytes) the rest of
 * the component would have to defend against.
 */
type LoadedFigure =
  | {
    readonly kind: 'svg'
    readonly width: number
    readonly height: number
    /** Sanitized markup, already sized and classed for both panel and export. */
    readonly markup: string
    /** The `viewBox` the export renders under. */
    readonly viewBox: string
  }
  | {
    readonly kind: 'raster'
    /** Object URL the `<img>` reads, owned until the effect is torn down. */
    readonly objectUrl: string
    /** `data:` URL the export embeds, which an object URL could not be. */
    readonly dataUrl: string
  }
  | {
    readonly kind: 'html'
    /** Width the document is rendered at, in figure pixels; marks are measured in it. */
    readonly width: number
    /** Complete document for the frame, drawing policy included. */
    readonly document: string
  }

/** Tools in toolbar order. */
const TOOLS: readonly { readonly tool: Tool; readonly label: string }[] = [
  { tool: 'select', label: 'toolSelect' },
  { tool: 'arrow', label: 'toolArrow' },
  { tool: 'rect', label: 'toolRect' },
  { tool: 'ellipse', label: 'toolEllipse' },
  { tool: 'pen', label: 'toolPen' },
  { tool: 'point', label: 'toolPoint' },
]

/**
 * The tools that draw something with a size the rail can set.
 *
 * `select` is not among them: it draws nothing, so with it armed and no mark
 * selected the rail has no subject. `point` is, because a pin is sized by the same
 * number — the rail asks "how big is this mark" either way.
 */
const WEIGHT_TOOLS: ReadonlySet<Tool> = new Set<Tool>(['arrow', 'rect', 'ellipse', 'pen', 'point'])

/** The copy key naming the shape each kind of mark is, for the list's second line. */
const TOOL_COPY: Record<AnnotationMark['kind'], string> = {
  arrow: 'toolArrow',
  rect: 'toolRect',
  ellipse: 'toolEllipse',
  pen: 'toolPen',
  point: 'toolPoint',
}

/**
 * The pointer a `select` tool wears instead of the word "select".
 *
 * Every other tool is a picture of what it draws — an arrow, a box, a circle — and
 * this one draws nothing, so the pointer is the honest shape: it is the tool you use
 * with the mouse rather than a mark you leave behind. Drawn rather than written so
 * the toolbar stays one row of controls at any locale or font size.
 */
function PointerIcon(): ReactNode {
  return (
    <svg width="13" height="15" viewBox="0 0 13 15" aria-hidden="true" focusable="false"
      style={{ display: 'block' }}>
      <path
        d="M 1.5 1 L 1.5 12.2 L 4.1 9.9 L 5.9 13.6 L 8 12.6 L 6.2 9 L 9.7 8.7 Z"
        fill="currentColor" stroke="currentColor" strokeWidth="0.9" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * The stroke each marking tool draws, so the row says it in pictures as well as words.
 *
 * `select` is not a marking tool and never comes here: it draws nothing, so it
 * wears the pointer instead (see {@link PointerIcon}).
 */
function ToolIcon(tool: Exclude<Tool, 'select'>): ReactNode {
  const shape = tool === 'arrow'
    ? <><path d="M 3 13 L 13 3" /><path d="M 7 3 h 6 v 6" /></>
    : tool === 'rect'
      ? <rect x="2.5" y="3.5" width="11" height="9" rx="1.5" />
      : tool === 'ellipse'
        ? <circle cx="8" cy="8" r="5.5" />
        : tool === 'pen'
          ? <path d="M 2.5 13 C 5 4 9 13 13.5 3" />
          // The point tool wears the mark it places: a filled drop with a hole where
          // the number goes. The hole is a second subpath cut out with evenodd, so the
          // bar shows through it rather than a white disc sitting on the icon.
          : <path fillRule="evenodd"
            d="M 8 14.6 C 8 14.6 2.9 9.5 2.9 6.4 A 5.1 5.1 0 1 1 13.1 6.4 C 13.1 9.5 8 14.6 8 14.6 Z
               M 8 8.7 A 2.1 2.1 0 1 0 8 4.5 A 2.1 2.1 0 1 0 8 8.7 Z"
            fill="currentColor" stroke="none" />
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">{shape}</svg>
  )
}

/**
 * The overall goal's mark: an arrow that has hit a target.
 *
 * The record this heads is not a note about one place on the figure — it is what the
 * whole picture is meant to become — so it wears the one symbol that means "aim"
 * rather than the note the per-mark detail uses. At 16 pixels the arrow is one shaft
 * and two barbs; anything finer reads as a smudge.
 */
function GoalIcon(): ReactNode {
  return (
    <svg className="da-ico" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <circle cx="7" cy="9" r="5.2" />
      <circle cx="7" cy="9" r="2.3" />
      <path d="M 13.8 2.2 L 8.2 7.8" />
      <path d="M 9.6 2.6 L 13.8 2.2 L 13.4 6.4" />
    </svg>
  )
}

/** The list card's mark: three stacked rows, the shape of the card itself. */
function ListIcon(): ReactNode {
  return (
    <svg className="da-ico" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M 6 4.5 h 7 M 6 8 h 7 M 6 11.5 h 7" />
      <circle cx="3.2" cy="4.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="3.2" cy="8" r="1" fill="currentColor" stroke="none" />
      <circle cx="3.2" cy="11.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** The empty list's picture: an open box, the usual "nothing here yet". */
function BoxIcon(): ReactNode {
  return (
    <svg className="da-empty-ico" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path d="M 12 20 l 12 -6 l 12 6 v 12 l -12 6 l -12 -6 z" />
      <path d="M 12 20 l 12 6 l 12 -6" />
      <path d="M 24 26 v 12" />
      <path d="M 17 14.5 l 4.5 2.5 M 31 14.5 l -4.5 2.5" />
    </svg>
  )
}

/** A step back, as the usual curved arrow. */
function UndoIcon(): ReactNode {
  return (
    <svg className="da-ico" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M 3.2 7.5 H 9.5 a 3.4 3.4 0 0 1 0 6.8 H 6" />
      <path d="M 5.8 4.4 L 2.7 7.5 L 5.8 10.6" />
    </svg>
  )
}

/** The same arrow the other way. */
function RedoIcon(): ReactNode {
  return (
    <svg className="da-ico" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M 12.8 7.5 H 6.5 a 3.4 3.4 0 0 0 0 6.8 H 10" />
      <path d="M 10.2 4.4 L 13.3 7.5 L 10.2 10.6" />
    </svg>
  )
}

/** The primary action's mark: a paper plane, the usual "this leaves here". */
function SendIcon(): ReactNode {
  return (
    <svg className="da-ico" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M 2 8 L 14 2.6 L 10.6 14 L 8 9.4 Z" />
      <path d="M 8 9.4 L 14 2.6" />
    </svg>
  )
}

/** The secondary action's mark: a speech bubble, "this goes to the chat box". */
function ChatIcon(): ReactNode {
  return (
    <svg className="da-ico" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M 2.5 6.5 a 2 2 0 0 1 2 -2 h 7 a 2 2 0 0 1 2 2 v 3 a 2 2 0 0 1 -2 2 h -4 l -3 2.2 v -2.2 a 2 2 0 0 1 -2 -2 z" />
    </svg>
  )
}

/**
 * What one mark's anchor names, most specific first.
 *
 * An inline SVG figure names itself through its `<title>`; a rendered document
 * has none, and names itself through its own text or its place in the document.
 * @param mark - the mark to name.
 * @returns the name, or an empty string when the mark points at no element.
 */
function anchorName(mark: AnnotationMark): string {
  const anchor = mark.anchor
  if (anchor === undefined) return ''
  return [anchor.title, anchor.text, anchor.selector].find(value => value !== undefined && value !== '') ?? ''
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
  const mediaType = figureMediaType(parsedAddress?.path ?? '')
  const isVector = mediaType === 'image/svg+xml'
  const t = useCallback(
    (key: string): string => resolveTranslate(props, key),
    [props.t, props.localeId],
  )
  const sessionId = props.sessionId ?? parsedAddress?.sessionId

  const stageRef = useRef<HTMLDivElement | null>(null)
  /** The box a double clicked mark's detail is written in. */
  const detailRef = useRef<HTMLTextAreaElement | null>(null)
  const barRef = useRef<HTMLDivElement | null>(null)
  const figureHostRef = useRef<HTMLDivElement | null>(null)
  const surfaceRef = useRef<HTMLDivElement | null>(null)
  const figureRef = useRef<HTMLDivElement | null>(null)

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
  const [marks, setMarks] = useState<AnnotationMark[]>(() => [...(props.draft?.marks ?? [])])
  const [past, setPast] = useState<AnnotationMark[][]>([])
  const [future, setFuture] = useState<AnnotationMark[][]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  /** The mark whose detail box should take the caret once it is on screen. */
  const [focusId, setFocusId] = useState<string | null>(null)
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
   * How large the numbers are drawn, and whether they are drawn at all.
   *
   * A property of the drawing rather than of one mark: the numbers have to read as
   * one set, so the whole figure shares one size. It is saved with the marks because
   * the delivered picture is the one the agent reads — a size the reader chose but
   * the export ignored would be a control that does nothing.
   */
  /**
   * Which popover is showing, if any.
   *
   * One at a time, and this is deliberate: they all hang off the same strip near the
   * figure's edge, so two of them open at once simply cover each other and the
   * second one's own close button. Opening any popover closes whatever was open;
   * opening the one already showing closes it, so the button toggles.
   */
  const [openPanel, setOpenPanel] = useState<'style' | 'goal' | 'list' | null>(null)
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
  const [zoom, setZoom] = useState<number | 'fit'>('fit')
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
  const [dragging, setDragging] = useState(false)
  const dragFrom = useRef<{ pointerId: number; origin: PaletteSpot; box: DOMRect } | null>(null)
  /**
   * Where the palette sits before the reader moves it: top left, out of the way of
   * the figure's own middle and of the bar along the bottom.
   */
  const DEFAULT_PALETTE: PaletteSpot = { x: 0.02, y: 0.04 }
  const spot = palette ?? DEFAULT_PALETTE
  /**
   * The palette's box, in percentages of the panel.
   *
   * Percentages rather than pixels so the parking spot survives a resize: a reader
   * who narrows the pane keeps the palette where it was in the picture, not off the
   * edge of the panel. The negative margins pull it back inside at the far corner.
   */
  const paletteStyle: CSSProperties = {
    left: `${spot.x * 100}%`,
    top: `${spot.y * 100}%`,
    transform: `translate(${spot.x >= 0.5 ? '-100%' : '0'}, ${spot.y >= 0.5 ? '-100%' : '0'})`,
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
  ): void => {
    const held = from.current
    const root = rootRef.current
    // A move without a press on the handle is not a drag of ours.
    /* v8 ignore next */
    if (held === null || root === null) return
    const bounds = root.getBoundingClientRect()
    const x = held.origin.x + (event.clientX - held.box.left) / Math.max(1, bounds.width)
    const y = held.origin.y + (event.clientY - held.box.top) / Math.max(1, bounds.height)
    write({ x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) })
  }, [])
  const dragPalette = useCallback((event: ReactPointerEvent<HTMLDivElement>): void => {
    followPointer(event, dragFrom, setPalette)
  }, [followPointer])
  const dragBar = useCallback((event: ReactPointerEvent<HTMLDivElement>): void => {
    followPointer(event, barFrom, setBarSpot)
  }, [followPointer])

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
  /**
   * A record's inline placement, from whatever has been measured so far.
   *
   * Both sides are always written: one with a real offset and one `auto`. A card
   * that grows downwards must not also be pinned by its bottom edge, or with no
   * height of its own it stretches to fill the space between them. Before the
   * measurement lands there is no offset at all — the card is briefly at the
   * panel's corner, which is off the figure and gone before it can be seen.
   */
  const recordStyle = (at: RecordPlacement | null): CSSProperties => ({
    left: at?.left,
    top: at?.top ?? 'auto',
    bottom: at?.bottom ?? 'auto',
  })

  const barStyle: CSSProperties | undefined = barSpot === undefined
    ? undefined
    : {
        left: `${barSpot.x * 100}%`,
        top: `${barSpot.y * 100}%`,
        transform: `translate(${barSpot.x >= 0.5 ? '-100%' : '0'}, ${barSpot.y >= 0.5 ? '-100%' : '0'})`,
      }

  useEffect(() => { ensureStyles(document) }, [])

  const data = props.content?.kind === 'bytes' ? props.content.data : undefined

  const layer = useMemo((): FigureLayer | null => {
    if (figure === null) return null
    if (figure.kind === 'svg') {
      return {
        kind: 'svg',
        markup: figure.markup,
        width: figure.width,
        height: figure.height,
        viewBox: figure.viewBox,
      }
    }
    // A rendered document has no layer: the browser cannot turn a live document
    // into a picture, so this surface's marks travel as the marks file alone.
    if (figure.kind === 'html') return null
    // A raster has no size until the browser has decoded it.
    if (rasterSize === null) return null
    return { kind: 'raster', dataUrl: figure.dataUrl, width: rasterSize.width, height: rasterSize.height }
  }, [figure, rasterSize])

  /**
   * The surface's measurable size; null until its content and dimensions are both
   * known. A rendered document is measurable as soon as its width is — the frame
   * reports how tall its content is, and until it does the surface has no height.
   */
  const size = useMemo((): { readonly width: number; readonly height: number } | null => {
    if (figure === null) return null
    if (figure.kind === 'svg') return { width: figure.width, height: figure.height }
    if (figure.kind === 'html') return { width: figure.width, height: htmlHeight }
    return rasterSize
  }, [figure, htmlHeight, rasterSize])
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
    if (mediaType === 'image/svg+xml') {
      const root = parseFigureSvg(new TextDecoder().decode(data))
      if (root === undefined) {
        setFigureError(t('loadFailed'))
        return
      }
      const intrinsic = svgIntrinsicSize(root)
      // The size and the panel class are baked into the markup, so the string
      // the panel inlines and the string the export embeds are the same one.
      root.setAttribute('width', String(intrinsic.width))
      root.setAttribute('height', String(intrinsic.height))
      root.classList.add('da-figure')
      setFileFigure({
        kind: 'svg',
        width: intrinsic.width,
        height: intrinsic.height,
        markup: figureSvgMarkup(root),
        viewBox: svgViewBox(root, intrinsic),
      })
      return
    }
    if (mediaType === 'text/html') {
      // The frame is sized to its content, so the height it reports is the whole
      // document's; until it reports one the marks file has no surface to describe.
      setHtmlHeight(0)
      setFigureError(null)
      setFileFigure({
        kind: 'html',
        width: RENDER_WIDTH,
        document: buildRenderedDocument(new TextDecoder().decode(data)),
      })
      return
    }
    const objectUrl = URL.createObjectURL(new Blob([data], { type: mediaType }))
    setFileRasterSize(null)
    setFileFigure({ kind: 'raster', objectUrl, dataUrl: bytesToDataUrl(data, mediaType) })
    return () => { URL.revokeObjectURL(objectUrl) }
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
        setLoaded(result)
        setHostError(null)
        if (result.annotation !== null) {
          setMarks([...result.annotation.marks])
          writeSummary(result.annotation.summary ?? '')
          // The saved document's number style describes the picture on screen, so it
          // wins over the remembered preference: the annotation and its image have to
          // agree. A document that never recorded one leaves the preference in place.
          setCreatedAt(result.annotation.createdAt)
          setStale(result.annotation.figure.sha256 !== result.sha256)
        }
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

  const scale = useMemo(() => {
    if (size === null) return 1
    if (zoom !== 'fit') return zoom
    if (fitWidth <= 0) return 1
    return Math.min(1.5, Math.max(0.05, fitWidth / size.width))
  }, [zoom, fitWidth, size])

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
    const pillSize = measuredSize(detailRef.current, { width: DETAIL_WIDTH, height: DETAIL_HEIGHT })
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
    const figureHost = figureRef.current
    /* v8 ignore next -- a wheel event only reaches a handler on a mounted stage, and size is what allows one. */
    if (stage === null || surface === null || figureHost === null || size === null) return
    const before = liveScale.current
    const reached = clampZoom(next)
    // Nothing to hold still when the factor would not move.
    if (reached === before) return
    const rect = stage.getBoundingClientRect()
    const target = anchoredScroll(
      {
        clientWidth: stage.clientWidth,
        scrollLeft: stage.scrollLeft,
        scrollTop: stage.scrollTop,
        left: rect.left,
        top: rect.top,
      },
      { clientX, clientY },
      before,
      reached,
      size,
    )
    liveScale.current = reached
    surface.style.width = `${size.width * reached}px`
    surface.style.height = `${size.height * reached}px`
    figureHost.style.transform = `scale(${reached})`
    stage.scrollLeft = target.scrollLeft
    stage.scrollTop = target.scrollTop
    clearTimeout(settleTimer.current)
    settleTimer.current = setTimeout(() => {
      settleTimer.current = undefined
      setZoom(reached)
    }, PINCH_SETTLE_DELAY_MS)
  }, [size])

  useEffect(() => () => { clearTimeout(settleTimer.current) }, [])

  useEffect(() => {
    const stage = stageRef.current
    if (stage === null) return
    /**
     * A trackpad pinch arrives as a ctrl-modified wheel. The browser would zoom
     * the whole app for it, and the plugin's own stage is the surface the user is
     * pointing at, so the event is taken here. A plain two-finger scroll is left
     * alone: that one pans the scrollport, which is what it means.
     */
    const onWheel = (event: WheelEvent): void => {
      if (!event.ctrlKey) return
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

  const commit = useCallback((next: AnnotationMark[]): void => {
    setPast(history => [...history, marks].slice(-50))
    setFuture([])
    setMarks(next)
  }, [marks])

  const addMark = useCallback((mark: AnnotationMark): void => { commit([...marks, mark]) }, [commit, marks])

  const removeMark = useCallback((id: string): void => {
    commit(marks.filter(mark => mark.id !== id))
    setSelectedId(current => (current === id ? null : current))
  }, [commit, marks])

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
    setMarks(current => current.map(mark => (mark.id === id ? { ...mark, detail: value } : mark)))
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
    const next = marks.map(mark => (mark.id === id ? { ...mark, ...patch } : mark))
    commit(next)
  }, [commit, marks])

  /**
   * Put a dragged mark where it was dropped.
   *
   * A drag that ends where it started is not an edit: the mark keeps the anchor
   * it had, and no undo step is recorded for a gesture that changed nothing.
   */
  const moveMark = useCallback((id: string, points: readonly FigurePoint[], anchor: MarkAnchor | undefined): void => {
    const next = draggedMarks(marks, id, points, anchor)
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
  const undo = useCallback((): void => {
    setPast(history => {
      const previous = history[history.length - 1]
      if (previous === undefined) return history
      setFuture(futureState => [marks, ...futureState].slice(0, 50))
      setMarks(previous)
      return history.slice(0, -1)
    })
  }, [marks])

  const redo = useCallback((): void => {
    setFuture(futureState => {
      const next = futureState[0]
      if (next === undefined) return futureState
      setPast(history => [...history, marks].slice(-50))
      setMarks(next)
      return futureState.slice(1)
    })
  }, [marks])

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

  const exportPng = useCallback(async (target: FigureLayer): Promise<Blob> => {
    // The picture carries the numbers as the reader sized them: the agent reads the
    // same number the reader did, at the same place on the same shape.
    const svg = composeReviewSvg(target, marks)
    const paper = reviewSize(target, marks)
    const exportScale = Math.min(2, Math.max(1, 2400 / Math.max(paper.width, paper.height)))
    return await rasterizePng(svg, paper.width, paper.height, exportScale)
  }, [marks])

  const buildDocument = useCallback((target: { readonly width: number; readonly height: number }, scope = marks): AnnotationDocument | null => {
    if (loaded === null) return null
    const now = new Date().toISOString()
    return {
      version: ANNOTATION_VERSION,
      figure: {
        address,
        path: loaded.path,
        mediaType: loaded.mediaType,
        width: target.width,
        height: target.height,
        sha256: loaded.sha256,
      },
      createdAt: createdAt ?? now,
      updatedAt: now,
      marks: scope,
      ...(summary.trim() === '' ? {} : { summary: summary.trim() }),
    }
  }, [address, createdAt, loaded, marks, summary])

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
          return
        }
        const signature = annotationSignature(state.marks, state.summary)
        if (signature === writtenSignature.current) return
        const now = new Date().toISOString()
        const document: AnnotationDocument = {
          version: ANNOTATION_VERSION,
          figure: {
            address: state.address,
            path: state.loaded.path,
            mediaType: state.loaded.mediaType,
            width: state.size.width,
            height: state.size.height,
            sha256: state.loaded.sha256,
          },
          createdAt: state.createdAt ?? now,
          updatedAt: now,
          marks: state.marks,
          ...(state.summary.trim() === '' ? {} : { summary: state.summary.trim() }),
        }
        await saveAnnotation(state.address, document, undefined, true)
        writtenSignature.current = signature
      },
      onError: (error: unknown) => {
        setStatus({ tone: 'error', text: `${t('saveError')}${error instanceof Error ? error.message : String(error)}` })
      },
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
    // Drop the pending write before deleting: a debounced save that fired during
    // the delete would put the sidecar back moments after it was removed.
    autosave.current?.cancel()
    writtenSignature.current = null
    try {
      await deleteAnnotation(address)
    } catch (error) {
      setStatus({ tone: 'error', text: `${t('clearError')}${error instanceof Error ? error.message : String(error)}` })
    }
    commit([])
    setCreatedAt(null)
    setStale(false)
    setSelectedId(null)
    writeSummary('')
  }, [address, commit, t, writeSummary])

  /**
   * Save the annotation and hand it somewhere: to the agent, or into the draft.
   *
   * The Host writes `<name>.annot.json` and a derived `<name>.annotated.png` beside
   * the figure, and the reader's original stays as it was. Once the hand-off has
   * succeeded the sidecars are deleted and the marks are cleared from the surface:
   * a delivered annotation has done its job, and leaving it on screen (or on disk)
   * would make the reader clear it twice.
   * @param target - who receives the annotation.
   */
  const run = useCallback(async (target: 'agent' | 'composer', only?: AnnotationMark): Promise<void> => {
    // The only enforcement point: the toolbar buttons stay clickable so this
    // guard is what decides, not a disabled attribute that hides the reason.
    // A surface with no height is one nothing could have been drawn on, and it is
    // not a surface a marks file may describe.
    const scope = only === undefined ? marks : [only]
    if (scope.length === 0 || size === null || size.height <= 0) return
    setBusy('sending')
    setStatus({ tone: 'info', text: t(target === 'agent' ? 'sending' : 'composing') })
    try {
      const document_ = buildDocument(size, scope)
      if (document_ === null) throw new Error(t('loadFailed'))
      // A picture is only needed when the marks claim an extent. A figure whose
      // marks are all points carries its whole meaning in the numbered list, and a
      // rendered document cannot be flattened at all — both travel as text.
      const review = layer === null || !needsReviewImage(document_) ? undefined : await exportPng(layer)
      const saved = await saveAnnotation(address, document_, review)
      // The delivered document is what is on disk now; a pending draft write would
      // only repeat it (or, worse, race the delete that follows the hand-off).
      autosave.current?.cancel()
      writtenSignature.current = annotationSignature(document_.marks, document_.summary ?? '')
      setCreatedAt(document_.createdAt)
      setStale(false)
      if (sessionId === undefined) throw new Error('the figure address carries no session')
      const pageImages = review === undefined ? [] : [{ page: 1, image: review }]
      const locale = (props.localeId ?? 'zh').startsWith('en') ? 'en' : 'zh'
      if (target === 'composer') {
        if (props.conversation === undefined) throw new Error('the conversation service is unavailable')
        deliverToComposer({
          conversation: props.conversation,
          sessionId,
          document: document_,
          paths: saved,
          files: pageImages.map(entry => new File([entry.image], `page-${entry.page}.png`, { type: 'image/png' })),
          locale,
        })
        setStatus({ tone: 'ok', text: t('composed') })
        await discard()
        return
      }
      if (props.sessions === undefined) throw new Error('the sessions service is unavailable')
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
      setStatus({ tone: 'ok', text: t('sent') })
      await discard()
    } catch (error) {
      setStatus({ tone: 'error', text: `${t('saveError')}${error instanceof Error ? error.message : String(error)}` })
    } finally {
      setBusy(null)
    }
  }, [address, buildDocument, discard, exportPng, layer, marks, props.conversation, props.localeId, props.sessions, sessionId, size, t])

  // --- render ---------------------------------------------------------------

  /** Whether this body holds a rendered document rather than a figure file. */
  const isHtml = mediaType === 'text/html'
  /** Name what one figure point landed on, for a surface that holds its own elements. */
  const anchorAtFigurePoint = useCallback(
    (x: number, y: number) => anchorInDocument(frameRef.current?.contentDocument, x, y),
    [],
  )

  if (mediaType === undefined) return <p className="da-hint">{t('unsupported')}</p>
  if (data === undefined && surface === undefined) return <p className="da-hint">{t(isHtml ? 'htmlLoading' : 'loading')}</p>
  if (figureError !== null) return <p className="da-hint" role="alert">{figureError}</p>

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
  const shownWeight = selected === null
    ? (WEIGHT_TOOLS.has(tool) ? weight : null)
    : (selected.weight ?? WEIGHT_DEFAULT)
  /**
   * Change one attribute of the selected mark, or of the next stroke when nothing
   * is selected.
   *
   * A control already at the mark's value leaves the list untouched, so a press
   * that changes nothing records no undo step.
   * @param patch - the attribute to change.
   */
  const repaintSelected = (mark: AnnotationMark, patch: MarkPatch): void => {
    // Compared key by key rather than object by object: spreading always makes a
    // new object, so a reference compare would report every press as a change and
    // record an undo step that undoes nothing.
    const unchanged = (Object.keys(patch) as (keyof MarkPatch)[])
      .every(key => mark[key] === patch[key])
    if (unchanged) return
    commit(marks.map(entry => (entry.id === mark.id ? { ...entry, ...patch } : entry)))
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
  const surfaceStyle: CSSProperties = paper === null
    ? {}
    : { width: paper.width * scale, height: paper.height * scale }
  /**
   * The paper at its unscaled size, with the figure placed at its own offset on it.
   *
   * The whole paper is scaled by one transform rather than each part scaling itself,
   * so the figure and the overlay cannot drift apart at a fractional factor — which
   * at 60% is exactly what a mark drawn on a line work and a mark drawn on paper
   * would do.
   */
  const paperStyle: CSSProperties = paper === null
    ? {}
    : { position: 'relative', width: paper.width, height: paper.height, transform: `scale(${scale})`, transformOrigin: 'top left' }
  const figureStyle: CSSProperties = paper === null
    ? {}
    : { position: 'absolute', left: -paper.x, top: -paper.y, width: size?.width, height: size?.height }

  return (
    <div className="da-root" ref={rootRef}>
      {hostError === null ? null : <div className="da-status" data-tone="error">{`${t('readError')}${hostError}`}</div>}
      {stale ? <div className="da-status" data-tone="error">{t(isHtml ? 'htmlStale' : 'stale')}</div> : null}
      {status === null ? null : <div className="da-status" data-tone={status.tone === 'info' ? undefined : status.tone}>{status.text}</div>}

      {/* `data-hand` asks for the grab cursor only under `select`, because that is
          the one tool whose drag has no other job; `data-panning` is the hand closed. */}
      <div className="da-stage" ref={attachStage}
        data-hand={tool === 'select' ? 'true' : undefined}
        data-panning={panning ? 'true' : undefined}>
        <div className="da-surface" ref={surfaceRef} style={surfaceStyle}>
          <div className="da-paper" style={paperStyle}>
          <div ref={figureRef} style={figureStyle}>
            {figure?.kind === 'svg' ? (
              <div ref={figureHostRef} dangerouslySetInnerHTML={{ __html: figure.markup }} />
            ) : figure?.kind === 'raster' ? (
              <img
                className="da-figure"
                src={figure.objectUrl}
                width={size?.width}
                height={size?.height}
                alt=""
                onLoad={(event) => {
                  const image = event.currentTarget
                  setFileRasterSize({ width: image.naturalWidth, height: image.naturalHeight })
                }}
              />
            ) : figure?.kind === 'html' ? (
              // Same origin, scripts off: the body may read the frame's markup and
              // nothing inside it can run or reach anywhere. The overlay above
              // takes every pointer event, so the document is never navigated.
              <iframe
                ref={frameRef}
                className="da-html"
                title={t('htmlFrame')}
                sandbox="allow-same-origin"
                // The height the frame reported for its own content: until it
                // reports one, the surface is not there to draw on.
                style={{ width: figure.width, height: htmlHeight }}
              />
            ) : null}
            {paper === null || size === null ? null : (
              <Canvas
                // The paper, not the figure: a mark in the margin has to have
                // somewhere to be drawn and somewhere to be pressed.
                width={paper.width}
                height={paper.height}
                origin={[-paper.x, -paper.y]}
                marks={marks}
                tool={tool}
                color={color}
                weight={weight}
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
                onEdit={editMark}
                onDrawn={finishDrawing}
                onLiveEdit={setLiveMark}
                numbering={props.numbering}
              />
            )}
          </div>
          </div>
        </div>
      </div>

      {/* The figure keeps the whole panel; the words about it float over it. Each
          is opened from the actions row and closes on its own button, so nothing
          about a record sits on screen while the reader is drawing. */}
      {/* What the figure as a whole should become. One per figure, so it is a
          fold of its own rather than a field beside one mark. */}
          {goalOpen ? (
            <div className="da-float da-float-record da-float-goal" role="group" aria-label={t('summary')}
              style={recordStyle(floatsAt)}>
              <div className="da-float-head">
                <span className="da-card-title">
                  <GoalIcon />{t('summary')}
                  <span className="da-hintdot" title={t('overallHint')}>?</span>
                </span>
                <button type="button" className="da-btn da-btn-quiet"
                  aria-label={t('close')} title={t('close')}
                  onClick={() => { setOpenPanel(null) }}>✕</button>
              </div>
              <label className="da-field">
                <textarea
                  value={summary}
                  placeholder={t('summaryPlaceholder')}
                  onChange={(event) => { writeSummary(event.target.value) }}
                />
                <span className="da-count">{summary.length}/300</span>
              </label>
            </div>
          ) : null}

          {/* The map of the figure: every mark, numbered as the figure numbers it. */}
          {listOpen ? (
            <div className="da-float da-float-record da-float-list" role="group" aria-label={t('marks')}
              style={recordStyle(floatsAt)}>
              <div className="da-float-head">
                <span className="da-card-title">
                  <ListIcon />{t('marks')}
                  <span className="da-card-count">{marks.length}</span>
                </span>
                <button type="button" className="da-btn da-btn-quiet" disabled={marks.length === 0}
                  onClick={() => { void discard() }}>{t('clear')}</button>
                <button type="button" className="da-btn da-btn-quiet"
                  aria-label={t('close')} title={t('close')}
                  onClick={() => { setOpenPanel(null) }}>✕</button>
              </div>
              <div className="da-marks">
                {marks.length === 0 ? (
                  <div className="da-empty">
                    <BoxIcon />
                    <div className="da-empty-title">{t('noMarks')}</div>
                    <div className="da-empty-hint">{t('noMarksHint')}</div>
                  </div>
                ) : marks.map((mark, index) => (
                  <div className="da-mark" key={mark.id} data-selected={mark.id === selectedId}
                    onClick={() => { setSelectedId(mark.id) }}>
                    {/* The number wears the mark's own colour, so a row and the thing it
                        names are matched by one glance rather than by reading. */}
                    <span className="da-mark-index" style={{ background: mark.color }}>{index + 1}</span>
                    <button type="button" className="da-mark-text"
                      onClick={(event) => { event.stopPropagation(); setSelectedId(mark.id) }}>
                      <span className="da-mark-title">
                        {mark.detail !== undefined && mark.detail.trim() !== '' ? mark.detail : t('emptyDetail')}
                      </span>
                      <span className="da-mark-meta">
                        {[t(TOOL_COPY[mark.kind]), anchorName(mark)].filter(part => part !== '').join(' · ')}
                      </span>
                    </button>
                    <button type="button" className="da-mark-del"
                      onClick={(event) => { event.stopPropagation(); removeMark(mark.id) }}>{t('delete')}</button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* The selected mark's words, beside the mark rather than under the figure.
              Selecting a mark is the gesture that asks for this card, so it needs no
              button of its own; a reader who has picked something out means to say
              what is wrong with it. */}
          {selected === null || detailAt === null ? null : (
            /* One pill, not a card: a single rounded field that opens on the spot
               the reader just marked. It has no title, no badge and no close button —
               the sentence itself says which mark it belongs to, because it appeared
               next to it, and clicking anywhere else puts it away. The hand-off
               buttons only exist once there is something to hand off. */
            <div className="da-float da-float-detail" role="group" aria-label={t('detail')}
              style={{ left: detailAt.left, top: detailAt.top }}>
              <textarea
                ref={detailRef}
                className="da-comment"
                value={selected.detail ?? ''}
                placeholder={selected.detail === undefined || selected.detail.trim() === '' ? t('addComment') : t('detailPlaceholder')}
                rows={1}
                onChange={(event) => { setMarkDetail(selected.id, event.target.value) }}
              />
              {selected.detail === undefined || selected.detail.trim() === '' ? null : (
                <div className="da-comment-send">
                  <button type="button" className="da-comment-send-btn da-comment-send-primary"
                    disabled={busy !== null}
                    aria-label={t('sendToAgent')} title={t('sendToAgent')}
                    onClick={() => { void run('agent', selected) }}>
                    <SendIcon />
                  </button>
                  <button type="button" className="da-comment-send-btn"
                    disabled={busy !== null}
                    aria-label={t('sendToComposer')} title={t('sendToComposer')}
                    onClick={() => { void run('composer', selected) }}>
                    <ChatIcon />
                  </button>
                </div>
              )}
            </div>
          )}

      {/* How heavy the pen is — or how big a point mark's pin is — on a rail of its
          own down the left edge, which is where a drawing tool puts its weight and
          where the reader's eye already looks for one. Idle it is a hairline, so it
          costs the figure nothing; crossing it opens it out into a tapered track.
          It only appears once there is something to size: a mark to change, or a
          tool armed to draw the next one. Sitting on the rail when nothing is
          selected and no pen is out is a control for a decision not being made. */}
      {shownWeight === null ? null : (
        <label className="da-weight" title={t(selected?.kind === 'point' || tool === 'point' ? 'pinSize' : 'weight')}>
          <input type="range" className="da-weight-input"
            aria-label={t(selected?.kind === 'point' || tool === 'point' ? 'pinSize' : 'weight')}
            min={WEIGHT_MIN} max={WEIGHT_MAX} step={0.1}
            value={shownWeight}
            onChange={(event) => { chooseWeight(Number(event.target.value)) }} />
          <span className="da-weight-fill" aria-hidden
            style={{ height: `${((shownWeight - WEIGHT_MIN) / (WEIGHT_MAX - WEIGHT_MIN)) * 100}%` }} />
          <span className="da-weight-knob" aria-hidden
            style={{ bottom: `calc(${((shownWeight - WEIGHT_MIN) / (WEIGHT_MAX - WEIGHT_MIN)) * 100}% - 5.5px)` }} />
        </label>
      )}

      {/* The tools float, so they can be parked off whichever corner of the figure
          the reader is working on. The handle above the tiles is what drags it; the
          tiles themselves stay buttons, because a drag that starts on a tool should
          still arm that tool. */}
      <div className="da-palette"
        data-dragging={dragging ? 'true' : undefined}
        style={paletteStyle}
        role="toolbar" aria-label={t('tools')}>
        <div className="da-palette-grip" title={t('moveTools')}
          onPointerDown={(event) => {
            const root = rootRef.current
            /* v8 ignore next */
            if (root === null) return
            /* v8 ignore next -- jsdom has no pointer capture; a browser always does. */
            event.currentTarget.setPointerCapture?.(event.pointerId)
            dragFrom.current = {
              pointerId: event.pointerId,
              origin: palette ?? DEFAULT_PALETTE,
              box: { left: event.clientX, top: event.clientY } as DOMRect,
            }
            setDragging(true)
          }}
          onPointerMove={(event) => { dragPalette(event) }}
          onPointerUp={(event) => {
            event.currentTarget.releasePointerCapture?.(event.pointerId)
            dragFrom.current = null
            setDragging(false)
          }}
          onPointerCancel={() => { dragFrom.current = null; setDragging(false) }}>
          <span className="da-palette-grip-dots" aria-hidden>⠿</span>
        </div>
        {TOOLS.map(entry => (
          <button key={entry.tool} type="button" className="da-btn da-tool"
            aria-pressed={tool === entry.tool}
            aria-label={t(entry.label)}
            title={t(entry.label)}
            onClick={() => { setTool(entry.tool) }}>
            <span className="da-tool-icon" aria-hidden>
              {entry.tool === 'select' ? <PointerIcon /> : ToolIcon(entry.tool)}
            </span>
          </button>
        ))}
      </div>

      {/* Every control lives along the bottom, in one bar: the marks palette, the
          style fold, the history steps, the view jumps, the records and the way out.
          The figure above is what the panel is for, so nothing takes a row from it —
          and a control along the bottom edge is a control the reader's eye already
          knows to look for, from every viewer they have used. */}
      {/* The bar is the same kind of object as the palette: a dark rounded strip
          that floats over the figure and can be dragged clear of whatever the
          reader is looking at. It carries the records and the hand-off; the tools
          have their own strip so either can be parked on its own. */}
      <div className="da-bar" ref={barRef} data-dragging={barDragging ? 'true' : undefined}
        /* A parked bar is placed from the top, and the stylesheet's own bottom offset
           has to go with it or the strip stretches to fill the pane. An attribute
           rather than `bottom:auto` inline, because the offset is a rule and a rule
           beats nothing but loses to any inline value that happens to survive. */
        data-parked={barSpot === undefined ? undefined : 'true'} style={barStyle}>
        <div className="da-palette-grip" title={t('moveBar')}
          onPointerDown={(event) => {
            const root = rootRef.current
            /* v8 ignore next */
            if (root === null) return
            /* v8 ignore next -- jsdom has no pointer capture; a browser always does. */
            event.currentTarget.setPointerCapture?.(event.pointerId)
            barFrom.current = {
              pointerId: event.pointerId,
              origin: barSpot ?? DEFAULT_PALETTE,
              box: { left: event.clientX, top: event.clientY } as DOMRect,
            }
            setBarDragging(true)
          }}
          onPointerMove={(event) => { dragBar(event) }}
          onPointerUp={(event) => {
            event.currentTarget.releasePointerCapture?.(event.pointerId)
            barFrom.current = null
            setBarDragging(false)
          }}
          onPointerCancel={() => { barFrom.current = null; setBarDragging(false) }}>
          <span className="da-palette-grip-dots" aria-hidden>⠿</span>
        </div>
        {/* The fold that steers the next stroke: the colour it is drawn in. It opens
            upwards, clear of the bar itself. */}
        <div className="da-bar-tools">
          <button type="button" className="da-btn da-style" aria-expanded={styleOpen}
            aria-label={t('style')} title={t('style')}
            onClick={() => { setOpenPanel(open => (open === 'style' ? null : 'style')) }}>
            <span className="da-swatch-dot" style={{ background: shownColor }} />
            <span className="da-style-caret" aria-hidden>{styleOpen ? '\u25b4' : '\u25be'}</span>
          </button>
        </div>
        {/* The fold that steers the next stroke, opened upwards clear of the bar. */}
        {styleOpen ? (
          <div className="da-style-row" role="group" aria-label={t('style')}>
            <span className="da-style-label">{t('styleColor')}</span>
            <div className="da-style-colors">
              {COLORS.map(value => (
                <button key={value} type="button" className="da-swatch" aria-pressed={shownColor === value}
                  style={{ background: value }} aria-label={value} title={value}
                  onClick={() => { chooseColor(value) }} />
              ))}
            </div>
          </div>
        ) : null}
        <span className="da-sep" aria-hidden />
        <span className="da-spacer" />
        {/* One fold for each record, with the count riding on the one that has a
            count to give. */}
        <button type="button" className="da-dock-btn" aria-pressed={goalOpen}
          aria-label={t('summary')} title={t('summary')}
          onClick={() => { setOpenPanel(open => (open === 'goal' ? null : 'goal')) }}>
          <GoalIcon />
          {summary.trim() === '' ? null : <span className="da-dock-dot" aria-hidden />}
        </button>
        <button type="button" className="da-dock-btn" aria-pressed={listOpen}
          aria-label={t('marks')} title={t('marks')}
          onClick={() => { setOpenPanel(open => (open === 'list' ? null : 'list')) }}>
          <ListIcon />
          {marks.length === 0 ? null : <span className="da-dock-count">{marks.length}</span>}
        </button>
        <span className="da-dock-sep" aria-hidden />
        {/* The keyboard reaches undo and redo whatever the buttons show, so the
            disabled state is an affordance and the guards behind the handlers are
            what actually decide. */}
        <button type="button" className="da-dock-btn" aria-label={t('undo')} title={t('undo')}
          disabled={past.length === 0} onClick={undo}>
          <UndoIcon />
        </button>
        <button type="button" className="da-dock-btn" aria-label={t('redo')} title={t('redo')}
          disabled={future.length === 0} onClick={redo}>
          <RedoIcon />
        </button>
        {/* A page body has no hand-off of its own — the document's owner keeps every
            page's marks and is the one that sends. */}
        {isPage ? null : (
          <>
            <span className="da-dock-sep" aria-hidden />
            <button type="button" className="da-dock-btn da-dock-btn-primary" disabled={busy !== null}
              aria-label={t('sendToAgent')} title={t('sendToAgent')}
              onClick={() => { void run('agent') }}>
              <SendIcon />
            </button>
            <button type="button" className="da-dock-btn" disabled={busy !== null}
              aria-label={t('sendToComposer')} title={t('sendToComposer')}
              onClick={() => { void run('composer') }}>
              <ChatIcon />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/** Language namespace this body's copy registers under. */
export { NAMESPACE }
