/**
 * The drawing surface.
 *
 * It renders the marks over the figure and turns pointer input into marks. Every
 * shape is committed as a mark the parent owns; the component keeps only the mark
 * currently being drawn. Coordinates are always figure pixels, so the same mark
 * means the same thing at any zoom or pane width.
 * @module dsh-figmark/client/Canvas
 */
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject } from 'react'
import type { AnnotationMark, FigurePoint, MarkAnchor, MarkKind } from '../shared/annotation'
import { WEIGHT_DEFAULT } from '../shared/annotation'
import { anchorAtPoint } from './figure-dom'
import {
  HANDLE_SIZE,
  handleAt,
  handlesFor,
  resizeBy,
  cursorFor,
  rotationTo,
  tetherFor,
  type HandleId,
} from './handles'
import { boxCentre, markBounds, shiftPoints, uprightBounds, type MarkBox } from './mark-geometry'
import {
  PIN_FONT_FAMILY, PIN_NUMBER_COLOR, hasFixedExtent, pinFontSizeOf, strokeWidthOf,
  markPathData, markTransform, pinNumberCentre, pinPathData, pointMarkBox,
} from './render'
import { figureUnit } from './scale'

/** The fields a handle drag can change on one mark. */
export interface MarkPatch {
  /** New geometry, in figure pixels. */
  readonly points?: readonly FigurePoint[]
  /** New clockwise rotation, in degrees. */
  readonly rotation?: number
  /**
   * A new stroke colour.
   *
   * Reachable from the panel rather than from the surface: the colour is chosen in
   * the toolbar, and once a mark is selected that choice is about the mark instead
   * of about the next stroke.
   */
  readonly color?: string
  /** A new stroke weight, as a multiple of the default width. */
  readonly weight?: number
}

/** Tools the toolbar can activate. */
export type Tool = 'select' | 'arrow' | 'rect' | 'ellipse' | 'pen' | 'point' | 'element'

/**
 * The `weight` field of a new mark, or nothing when it is the default.
 *
 * Absent means the default throughout this plugin, so writing `weight: 1` would put
 * a field into every mark that says nothing — sidecars would grow a key for every
 * mark ever drawn, and every comparison of two documents would see a difference
 * where there is none.
 * @param weight - the weight the next stroke is drawn at.
 * @returns the field, or an empty object for the default.
 */
function weightField(weight: number): { weight?: number } {
  return weight === WEIGHT_DEFAULT ? {} : { weight }
}

/** Hit width of an invisible selection stroke, in figure pixels. */
const HIT_WIDTH = 14

/** Minimum distance between recorded freehand samples, in figure pixels. */
const PEN_SAMPLE_STEP = 3

/** Reach of a handle's hit area, in figure pixels: generous enough to grab. */
/** How far from a handle's centre a press still counts, as a multiple of its side. */
const HANDLE_REACH = 2.2

/** Props of the drawing surface. */
export interface CanvasProps {
  /** Width of the paper, in figure pixels: the figure plus anywhere marks reach. */
  readonly width: number
  /** Height of the paper, in figure pixels. */
  readonly height: number
  /**
   * Where figure coordinate `(0, 0)` sits on this paper.
   *
   * A mark drawn past the figure's top-left edge needs paper to sit on, so the
   * surface grows around the drawing and the origin moves into it. Absent means the
   * paper starts at the figure's own corner, which is the ordinary case.
   */
  readonly origin?: FigurePoint
  /** Committed marks, in draw order. */
  readonly marks: readonly AnnotationMark[]
  /** Active tool. */
  readonly tool: Tool
  /** Stroke color for new marks. */
  readonly color: string
  /** Stroke weight for new marks, as a multiple of the default width. */
  readonly weight?: number
  /**
   * How much the paper is scaled on screen, as a CSS factor.
   *
   * The controls this surface draws — the resize and turn handles, above all — are
   * targets for a pointer, so they have to be a fixed number of *screen* pixels. The
   * svg they live in is in figure pixels and the whole paper is scaled by CSS, so a
   * control drawn at a fixed figure size shrinks with the zoom and becomes impossible
   * to grab exactly when the figure is large. Dividing by this factor keeps it the
   * same size on screen. Absent means the paper is not scaled.
   */
  readonly scale?: number
  /** Container that holds the figure, used as the anchor hit-test origin. */
  readonly containerRef: RefObject<HTMLElement | null>
  /** Whether the figure is inlined SVG (only then can marks anchor to elements). */
  readonly anchoring: boolean
  /**
   * Name the element one figure point landed on, for a surface whose elements
   * live in a document of their own. Present exactly when {@link anchoring} is
   * absent in spirit: the two describe the same question for two kinds of
   * surface, and only one of them can be answered for any given figure.
   */
  readonly anchorAtFigurePoint?: ((x: number, y: number) => MarkAnchor | undefined) | undefined
  /**
   * Report the element the pointer is over while the picker is armed.
   *
   * The canvas knows *which* element a click would take but not how to light it: an
   * inline SVG's elements belong to the panel's document and a rendered document's
   * belong to its frame, and only the body knows which of those it is looking at.
   * Reporting the name lets the body light the element itself, so the highlight has
   * the element's own shape instead of a box drawn around it.
   * @param anchor - what the pointer names, or undefined when it names nothing.
   */
  readonly onHover?: ((anchor: MarkAnchor | undefined) => void) | undefined
  /** Currently selected mark. */
  readonly selectedId: string | null
  /** Select one mark, or clear the selection. */
  readonly onSelect: (id: string | null) => void
  /** Commit a finished mark. */
  readonly onAdd: (mark: AnnotationMark) => void
  /**
   * Commit a mark that was dragged somewhere else.
   *
   * Called once per finished drag rather than once per pointer move, so the
   * parent records a single undo step and undo returns the mark to where it was
   * before the gesture.
   * @param id - the mark that moved.
   * @param points - its geometry where it was dropped, in figure pixels.
   * @param anchor - what the drop point landed on, or undefined when nothing.
   */
  readonly onMove: (id: string, points: readonly FigurePoint[], anchor: MarkAnchor | undefined) => void
  /**
   * Commit a change to one mark other than a plain move: a resize or a rotation.
   *
   * One callback for both because they are one kind of thing to the parent — an
   * edit that belongs to an existing mark and owes it a single undo step. The
   * patch is merged over the mark as it stands.
   * @param id - the mark that changed.
   * @param patch - the fields that changed.
   */
  readonly onUpdate: (id: string, patch: MarkPatch) => void
  /** Remove one mark. */
  readonly onRemove: (id: string) => void
  /**
   * Move the view by a drag on empty space.
   *
   * A figure at 6x is bigger than the pane, and reaching a corner of it by wheel
   * alone means hunting. Dragging the empty part of the canvas pans it, the way
   * every viewer the reader already uses does. The values are client pixels the
   * pointer travelled, so the panel only has to subtract them from its scroll.
   * @param dx - horizontal travel since the last move.
   * @param dy - vertical travel since the last move.
   */
  readonly onPan?: (dx: number, dy: number) => void
  /** The pan began, so the view can show it is being moved. */
  readonly onPanStart?: () => void
  /** The pan ended, so the view can go back to inviting one. */
  readonly onPanEnd?: () => void
  /**
   * Pick one mark out for editing.
   *
   * A double click means "work on this one": it selects the mark and asks the
   * parent to put the caret in its detail box, so the reader can describe the
   * change without reaching for the pointer again.
   * @param id - the mark that was double clicked.
   */
  readonly onEdit: (id: string) => void
  /**
   * Announce that a mark has just been drawn.
   *
   * Drawing is a one-shot act: the reader shapes a box, lets go, and the next thing
   * they want is to look at it and say what is wrong with it. Leaving the drawing
   * tool armed means the next stray drag accidentally adds a second box, so the
   * parent is told the gesture completed and can put the pointer back into select.
   * @param id - the mark that was just committed.
   */
  readonly onDrawn?: ((id: string) => void) | undefined
  /**
   * The mark as it currently looks during a drag, and null once the drag is over.
   *
   * A gesture lives inside this component, so nothing outside it knows where the mark
   * is mid-drag. Anything anchored to the mark — the comment pill — would sit where
   * the mark *was* until the drag ended, which is the one moment the reader is most
   * likely to be watching it. This reports the running geometry so the owner can keep
   * its own furniture in step.
   * @param mark - the mark mid-drag, or null when the drag has finished.
   */
  readonly onLiveEdit?: ((mark: AnnotationMark | null) => void) | undefined
  /**
   * Each mark's number, when the marks on this surface are a slice of a longer list.
   *
   * A page of a PDF draws only its own marks, but the list the reader and the agent
   * read numbers them across the whole document; without this the page would restart
   * at 1 and the numbers would stop agreeing with the sentences beside them.
   */
  readonly numbering?: ReadonlyMap<string, number> | undefined
}

/** Monotonic id source for marks created in this session. */
let markSeq = 0

/**
 * Mint a mark id.
 * @returns an id unique within the loaded document.
 */
export function nextMarkId(): string {
  markSeq += 1
  return `m${Date.now().toString(36)}-${markSeq}`
}

/**
 * A press that landed on an existing mark, and the gesture it may become.
 *
 * One shape for three gestures, because they all begin the same way: the press
 * remembers what it landed on and the mark as it was, and each pointer move asks
 * that saved state what the mark now looks like. Keeping the origin here rather
 * than reading it back off the props is what makes a drag accumulate from where it
 * started instead of from the last frame.
 */
interface Press {
  /** Mark the press landed on. */
  readonly id: string
  /** Where the press landed, in figure pixels. */
  readonly from: FigurePoint
  /** Geometry the mark had when the press landed. */
  readonly origin: readonly FigurePoint[]
  /** Rotation the mark had when the press landed, in degrees. */
  readonly originRotation: number
  /** The mark's kind, which decides what its handles mean. */
  readonly kind: MarkKind
  /** The handle the press grabbed, when it grabbed one. */
  readonly handle: HandleId | undefined
  /** Whether Shift is held: snaps the rotation to 15° steps. */
  readonly snap: boolean
  /** What the gesture has done so far; null until the pointer moves. */
  readonly edit: PressEdit | null
}

/** One gesture's running result, in the mark's own terms. */
interface PressEdit {
  /** Geometry to draw, or undefined when the gesture does not change points. */
  readonly points: readonly FigurePoint[] | undefined
  /** Rotation to draw, or undefined when it does not change. */
  readonly rotation: number | undefined
}

/**
 * Draw the marks and collect pointer input.
 * @param props - figure geometry, marks, tool state, and callbacks.
 * @returns the overlay element.
 */
export function Canvas(props: CanvasProps): ReactNode {
  const { width, height, marks, tool, color, containerRef, anchoring } = props
  const [originX, originY] = props.origin ?? [0, 0]
  const weight = props.weight ?? WEIGHT_DEFAULT
  /**
   * Each mark's number, by id.
   *
   * A page's marks are drawn from a slice of the document's list, so the numbers
   * come from the document when it supplies them and from the slice's own order
   * otherwise.
   */
  const numbers = new Map(marks.map((mark, index) => [mark.id, props.numbering?.get(mark.id) ?? index + 1]))
  /**
   * How big everything is drawn here, as a multiple of the base sizes.
   *
   * Derived from the surface rather than passed in: every mark on this canvas shares
   * one figure, so one number decides the pen for all of them, and a caller that
   * forgot to thread it through could not make a mark disagree with its hit area.
   */
  const unit = figureUnit(width, height)
  const [draft, setDraft] = useState<AnnotationMark | null>(null)
  const [press, setPress] = useState<Press | null>(null)
  const drawing = useRef(false)
  /**
   * Where the pointer was on the last frame of a pan, in client pixels.
   *
   * A pan is a stream of moves like a pinch is: the view has to follow the hand
   * frame by frame, so the travel is measured against the previous frame rather
   * than against the press. `null` means no pan is in flight.
   */
  const panning = useRef<{ x: number; y: number } | null>(null)
  /**
   * Whether the pan that just ended actually moved the view.
   *
   * A drag finishes with a click on the surface, and a click on the surface means
   * "nothing is selected". Without this the reader would pan to a mark and lose the
   * selection they were carrying to it. A press that never moved is still a click.
   */
  const panned = useRef(false)
  /**
   * Whether the gesture that just ended put a mark on the figure.
   *
   * Lifting the pointer over the surface also makes the browser dispatch a `click`
   * on it, and that click means "the reader pressed the background" — which clears the
   * selection. For a mark that was just drawn that is exactly backwards: the click is
   * the tail of the gesture that made the mark, so it must not undo the selection the
   * same gesture just made. It also lands before the detail card has been placed, so
   * without this the card opens and is gone again in the same frame.
   */
  const drew = useRef(false)
  /**
   * The element the pointer is currently over, while the `element` tool is armed.
   *
   * Held here so that a stream of moves across one element does not have to be
   * reported twice: the parent is told only when the name changes, or when the same
   * element is re-read at a new box. Null means either no tool, or a point that names
   * nothing.
   */
  const [hover, setHover] = useState<MarkAnchor | null>(null)
  /**
   * Tell the parent which element the pointer is over.
   *
   * A separate effect rather than a call inside the move handler: the highlight
   * belongs to the figure's own document, and this component never touches it. Kept
   * on `hover` and the callback alone, so a move that names the same element reports
   * nothing at all — the effect's dependencies are the two things that can change the
   * answer, not the props object a parent rebuilds every render.
   */
  const reportHover = props.onHover
  useEffect(() => {
    reportHover?.(hover ?? undefined)
  }, [hover, reportHover])
  /**
   * Where the current press landed, in figure pixels.
   *
   * Recorded in the capture phase because a mark's hit area stops the bubble, so
   * this is the only place a drag on an existing mark can learn its own origin.
   * A box rather than a nullable ref: the capture handler runs for every press on
   * the surface, so there is no state where it holds no point.
   */
  const pressedAt = useRef<{ value: FigurePoint }>({ value: [0, 0] })

  /** Convert one pointer event to figure pixels. */
  const toFigure = (event: Pick<ReactPointerEvent<SVGSVGElement>, 'currentTarget' | 'clientX' | 'clientY'>): FigurePoint => {
    // The handler is bound to the surface itself, so `currentTarget` is always
    // the element whose box the coordinates are measured in.
    const rect = event.currentTarget.getBoundingClientRect()
    // A collapsed pane reports a zero-size box; treating it as 1:1 keeps a drag
    // from committing infinite coordinates.
    const scaleX = rect.width === 0 ? 1 : width / rect.width
    const scaleY = rect.height === 0 ? 1 : height / rect.height
    return [
      (event.clientX - rect.left) * scaleX - originX,
      (event.clientY - rect.top) * scaleY - originY,
    ]
  }

  /**
   * Describe what the mark landed on.
   *
   * A rendered document reports its elements in its own layout pixels, which are
   * the figure units already, so it names them from the point. An inline SVG is
   * hit-tested against client coordinates instead, because its elements live in
   * the same document as this overlay and their boxes are the browser's own.
   */
  const anchorFor = (
    event: Pick<ReactPointerEvent<SVGSVGElement>, 'currentTarget' | 'clientX' | 'clientY'>,
    point: FigurePoint,
  ): MarkAnchor | undefined => {
    if (props.anchorAtFigurePoint !== undefined) return props.anchorAtFigurePoint(point[0], point[1])
    const container = containerRef.current
    if (!anchoring || container === null) return undefined
    const rect = event.currentTarget.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return undefined
    return anchorAtPoint(container, event.clientX, event.clientY, width / rect.width, height / rect.height)
  }

  /** Remember where a press landed, before any handler gets to consume it. */
  const capturePress = (event: ReactPointerEvent<SVGSVGElement>): void => {
    pressedAt.current.value = toFigure(event)
  }

  /**
   * Whether two anchors name the same element in the same place.
   *
   * Two separate reads of the same element can arrive as two objects, and the
   * highlight only has to change when what it is drawn around changes. Comparing the
   * name *and* the box covers both ways it can: a different element, or the same
   * element after the surface reflowed under it.
   * @param one - the anchor drawn now, or null when nothing is lit.
   * @param other - the anchor the pointer just named.
   * @returns true when the highlight would look exactly the same.
   */
  const sameAnchor = (one: MarkAnchor | null, other: MarkAnchor | null): boolean => {
    if (one === null || other === null) return one === other
    if (one.selector !== other.selector || one.id !== other.id || one.tag !== other.tag) return false
    return one.bbox.every((value, index) => value === other.bbox[index])
  }

  /**
   * One element as a mark, from the anchor that named it.
   *
   * The geometry is the element's own box, written as the two corners every
   * box-shaped mark carries, so everything downstream — the hit area, the control
   * frame, the export, the PDF appearance — reads an element mark through the same
   * code a `rect` goes through. What makes it a different mark is what it also
   * carries: the anchor, which is the name of the thing rather than the area.
   * @param anchor - the element that was picked.
   * @returns the mark to commit.
   */
  const elementMark = (anchor: MarkAnchor): AnnotationMark => {
    const [x, y, boxWidth, boxHeight] = anchor.bbox
    return {
      id: nextMarkId(),
      kind: 'element',
      color,
      points: [[x, y], [x + boxWidth, y + boxHeight]],
      // No `weight`: an element mark draws no stroke and no marker — the light on the
      // element it names is the whole of it — so the pen weight has nothing to size.
      // Carrying it would put a number in the file that changes nothing about the
      // picture and, worse, would grow the mark's measured outline by half a stroke
      // that is never painted.
      anchor,
    }
  }

  /**
   * Forget the highlight whenever the picker is put away.
   *
   * The highlight says "this is what a click would take"; with no picker armed there
   * is no click to describe, and a lit element left behind would be a promise the
   * tool no longer keeps. Disarming also covers the case a pointer never will: the
   * reader leaves the figure with the picker armed, so no move arrives to clear it.
   */
  useEffect(() => {
    if (tool !== 'element') setHover(null)
  }, [tool])

  /**
   * Begin moving the mark a press landed on.
   *
   * The stream keeps coming back to the hit area the press started on, so a drag
   * that leaves the mark keeps updating instead of stopping at its edge.
   */
  /**
   * Handle a press that landed on an existing mark.
   *
   * The press always selects the mark, which is what the hit area has always
   * done.
   *
   * A resize or turn handle takes the press under every tool. Those handles are
   * drawn only around the selected mark, they are seven pixels across, and they
   * show a resize cursor — a press on one can only mean "resize this", so making
   * it depend on the tool would be a trap: the frame is visible and follows the
   * pointer with a resize cursor while doing nothing at all. That is exactly how
   * it read before: with a drawing tool active, the handles were decoration.
   *
   * Everything else stays the tool's to interpret. The shape's own hit area and
   * the note plate are content rather than controls, so under a drawing tool a
   * press on them belongs to the mark it landed on, not to a stroke that would
   * run underneath it.
   *
   * @param mark - the mark the press landed on.
   * @param event - the pointer event.
   * @param handle - the handle it grabbed instead of the shape, when it did.
   */
  const beginGesture = (mark: AnnotationMark, event: ReactPointerEvent<SVGElement>, handle?: HandleId): void => {
    event.stopPropagation()
    props.onSelect(mark.id)
    // A handle is a control, not content: it is drawn only around the selected
    // mark, it is seven pixels across, and it shows a resize cursor. A press on
    // one can only mean "resize this", so it works under every tool — making it
    // depend on the tool left the frame visible and dragging with nothing at all.
    // The shape's own hit area is content, so under a drawing tool a press on it
    // still belongs to the stroke being started.
    if (handle === undefined && tool !== 'select') return
    // An element mark cannot be dragged: its box is where the element was, and a box
    // moved a few pixels away would still claim to name that element while pointing
    // at nothing in particular. Picking it again is how it is placed, so the press
    // that would move it just selects it.
    if (handle === undefined && mark.kind === 'element') return
    if (typeof event.currentTarget.setPointerCapture === 'function' && event.pointerId !== undefined) {
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    setPress({
      id: mark.id,
      from: pressedAt.current.value,
      origin: mark.points,
      originRotation: mark.rotation ?? 0,
      kind: mark.kind,
      handle,
      snap: event.shiftKey,
      edit: null,
    })
  }

  /**
   * Handle a press on the selected mark's control frame.
   *
   * The frame is only drawn for the selected mark, so reaching here already means
   * the press was aimed at a handle of the thing the reader is working on. A press
   * that misses every handle falls through to the shape itself, which is what keeps
   * the frame from making a small mark harder to grab than it was.
   * @param mark - the selected mark.
   * @param event - the pointer event.
   * @returns true when a handle took the press.
   */
  /**
   * The control frame's handle size in figure pixels.
   *
   * The frame is drawn in the same svg as the marks, which is in figure pixels, and
   * the whole paper is then scaled by CSS. A handle has to be a fixed number of screen
   * pixels to be hittable, so its figure size is that target divided by the scale.
   */
  const grip = HANDLE_SIZE / Math.max(0.05, props.scale ?? 1)
  /** A hairline that stays a hairline on screen, whatever the paper is scaled to. */
  const hairline = 1 / Math.max(0.05, props.scale ?? 1)

  const beginHandle = (mark: AnnotationMark, event: ReactPointerEvent<SVGElement>): boolean => {
    // Handles are only drawn around the selected mark, so a press on any other
    // mark must fall through to moving it — otherwise a click near a corner of
    // an unselected mark would silently resize it.
    if (props.selectedId !== mark.id) return false
    // Marks with a fixed extent are framed by a dashed box instead of handles: a
    // point has no extent to resize, and an element's box belongs to the element.
    if (hasFixedExtent(mark.kind)) return false
    const grabbed = handleAt(
      controlBox(mark), mark.rotation ?? 0, pressedAt.current.value, HANDLE_REACH * grip, grip,
    )
    if (grabbed === undefined) return false
    beginGesture(mark, event, grabbed)
    return true
  }

  /**
   * The box a mark's control frame is drawn around.
   *
   * Only the resize-and-turn handles read this, and only shapes with an extent get
   * those: a `point` mark is highlighted by a ring instead, so it never reaches
   * here. Every kind that does carries at least one point, so there is always a
   * box — the fallback covers a mark whose points were emptied by a bad edit.
   * @param mark - the mark to frame.
   * @returns the frame box.
   */
  const controlBox = (mark: AnnotationMark): MarkBox => {
    /* v8 ignore next -- a mark carries at least one point, which is a box. */
    return uprightBounds(mark.points, mark.rotation ?? 0) ?? { x: 0, y: 0, width: 0, height: 0 }
  }

  /**
   * What one pointer move means to the gesture in flight.
   *
   * Three gestures share one press: a plain drag moves the mark, the rotation
   * handle turns it, and a box handle resizes it. Each is expressed
   * against the geometry the gesture began with, so a long drag accumulates from
   * where it started rather than drifting frame to frame.
   *
   * @param held - the press being dragged.
   * @param point - the pointer, in figure pixels.
   * @param dx - horizontal movement since the press, in figure pixels.
   * @param dy - vertical movement since the press.
   * @returns what to draw until the gesture ends.
   */
  const editFor = (held: Press, point: FigurePoint, dx: number, dy: number): PressEdit => {
    const handle = held.handle
    if (handle === undefined) {
      return { points: shiftPoints(held.origin, dx, dy), rotation: undefined }
    }
    const box = markBounds(held.origin)
    /* v8 ignore next -- a handle is only offered for a mark that has a box. */
    if (box === undefined) return { points: undefined, rotation: undefined }
    if (handle === 'rotate') {
      const rotation = rotationTo(boxCentre(box), point, held.snap)
      return { points: undefined, rotation }
    }
    return {
      points: resizeBy({ handle, at: point, origin: held.origin, rotation: held.originRotation }),
      rotation: undefined,
    }
  }

  /**
   * The patch a finished handle drag asks the parent to record.
   *
   * Only the fields the edit actually produced are listed, so a resize does not
   * clear a rotation. A gesture that produced nothing at all carries no fields,
   * and the caller can tell that apart by its emptiness rather than by a null.
   * @param edit - what the gesture drew.
   * @returns the fields that changed; empty when none did.
   */
  const patchFrom = (edit: PressEdit): MarkPatch => {
    const patch: { points?: readonly FigurePoint[]; rotation?: number } = {}
    if (edit.points !== undefined) patch.points = edit.points
    if (edit.rotation !== undefined) patch.rotation = edit.rotation
    return patch
  }

  /**
   * The element mark the pointer is over, if any.
   *
   * An element mark draws nothing, so it has no painted shape a press can land on, and
   * a hit `rect` over its box would swallow the whole plot: an element is routinely a
   * curve, a legend or an axis spanning most of the figure, so a box-shaped target
   * would block every other mark and every press meant for the paper. It also said the
   * wrong thing — the box around a diagonal curve is a region the figure never drew,
   * which is the very mismatch the light was introduced to fix.
   *
   * So the question is asked the other way round: which element is under this point,
   * and which mark names that element. The answer is the same `anchorFor` the picker
   * uses, which is why the target and the light agree by construction.
   *
   * @param event - the press to place.
   * @param point - the press in figure pixels.
   * @returns the mark whose element is under the press.
   */
  const elementMarkAt = (
    event: Pick<ReactPointerEvent<SVGSVGElement>, 'currentTarget' | 'clientX' | 'clientY'>,
    point: FigurePoint,
  ): AnnotationMark | undefined => {
    const named = anchorFor(event, point)
    if (named === undefined) return undefined
    const selector = named.selector
    if (selector === undefined) return undefined
    return marks.find(mark => mark.kind === 'element' && mark.anchor?.selector === selector)
  }

  const start = (event: ReactPointerEvent<SVGSVGElement>): void => {
    // Every gesture begins here, so this is where the previous one's trailing click
    // stops being owed: a press that neither pans nor draws must leave a later click
    // meaning what it says.
    drew.current = false
    if (tool === 'select') {
      // A press on a placed element selects it, the way a press on any other mark
      // does — but it is found by asking the figure what is under the pointer, not by
      // a box drawn over it. That keeps the target exactly as big as the thing the
      // mark is about: pressing elsewhere inside the box is pressing paper.
      const overElement = elementMarkAt(event, toFigure(event))
      if (overElement !== undefined) {
        beginGesture(overElement, event)
        return
      }
      // Under `select` a drag on empty space has no other meaning: a mark's own hit
      // area takes its presses first, so reaching here on the surface means the
      // pointer is over the table rather than over anything on it. Pushing the
      // table moves the view, which is the only way to reach a zoomed-in corner.
      if (props.onPan === undefined) return
      panning.current = { x: event.clientX, y: event.clientY }
      panned.current = false
      // The browser's own capture is what keeps a drag alive past the edge of the
      // surface; a host without it still pans, just loses the pointer at the edge.
      /* v8 ignore next -- jsdom and every browser the panel runs in implement it. */
      event.currentTarget.setPointerCapture?.(event.pointerId)
      props.onPanStart?.()
      return
    }
    event.preventDefault()
    const point = toFigure(event)
    if (tool === 'point') {
      // A point mark is placed, not dragged: the press is already its whole
      // geometry, and there is no extent for a drag to define.
      const anchor = anchorFor(event, point)
      const mark: AnnotationMark = {
        id: nextMarkId(),
        kind: 'point',
        color,
        points: [point],
        // A pin is sized by this same number, so the rail the reader set before
        // placing it decides how big the pin lands.
        ...weightField(weight),
        ...(anchor === undefined ? {} : { anchor }),
      }
      props.onAdd(mark)
      props.onSelect(mark.id)
      props.onDrawn?.(mark.id)
      drew.current = true
      return
    }
    if (tool === 'element') {
      // Picking is a click, not a drag: the element under the pointer is already the
      // whole answer, and there is nothing for a drag to decide. A press that names
      // no element does nothing at all, rather than placing a mark on the background —
      // an element mark with no element would be a box claiming to name a thing.
      const picked = anchorFor(event, point)
      if (picked === undefined) return
      const mark = elementMark(picked)
      props.onAdd(mark)
      props.onSelect(mark.id)
      props.onDrawn?.(mark.id)
      drew.current = true
      return
    }
    drawing.current = true
    if (typeof event.currentTarget.setPointerCapture === 'function' && event.pointerId !== undefined) {
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    // A drag-shaped mark needs its two corners from the start; a freehand stroke
    // starts as the single sample it is, so no duplicate point enters the path.
    const seed: FigurePoint[] = tool === 'pen' ? [point] : [point, point]
    setDraft({ id: nextMarkId(), kind: tool, color, points: seed, ...weightField(weight) })
  }

  const move = (event: ReactPointerEvent<SVGSVGElement>): void => {
    const from = panning.current
    if (from !== null) {
      const dx = event.clientX - from.x
      const dy = event.clientY - from.y
      if (dx === 0 && dy === 0) return
      panning.current = { x: event.clientX, y: event.clientY }
      panned.current = true
      props.onPan?.(dx, dy)
      return
    }
    // Each move under the picker re-asks what is under the pointer, so the highlight
    // follows the cursor and a click can only ever pick what was already lit.
    // An unchanged name leaves the state alone: a stream of moves across one element
    // would otherwise re-render the whole overlay for every frame of it.
    if (tool === 'element') {
      const found = anchorFor(event, toFigure(event)) ?? null
      setHover(current => (sameAnchor(current, found) ? current : found))
    }
    if (press !== null) {
      const point = toFigure(event)
      const dx = point[0] - press.from[0]
      const dy = point[1] - press.from[1]
      // A stream that has not left its press point is not a drag yet; keeping it
      // out of the state leaves the mark drawing exactly as it was.
      if (dx === 0 && dy === 0 && !event.shiftKey) return
      // The modifier is read before the edit is computed, so a snap applies to
      // this move rather than to the one after it.
      const held: Press = { ...press, snap: event.shiftKey }
      const edit = editFor(held, point, dx, dy)
      setPress({ ...held, edit })
      // The mark as it now looks, so a card beside it can follow the hand rather
      // than wait for the release.
      const base = props.marks.find(candidate => candidate.id === press.id)
      /* v8 ignore next -- a press always begins on a mark that is still in the list. */
      if (base === undefined) return
      const live: { -readonly [K in keyof AnnotationMark]: AnnotationMark[K] } = { ...base }
      if (edit.points !== undefined) live.points = edit.points
      if (edit.rotation !== undefined) live.rotation = edit.rotation
      props.onLiveEdit?.(live)
      return
    }
    if (!drawing.current || draft === null) return
    const point = toFigure(event)
    if (draft.kind === 'pen') {
      const last = draft.points[draft.points.length - 1]
      if (last !== undefined && Math.hypot(point[0] - last[0], point[1] - last[1]) < PEN_SAMPLE_STEP) return
      setDraft({ ...draft, points: [...draft.points, point] })
      return
    }
    setDraft({ ...draft, points: [draft.points[0] as FigurePoint, point] })
  }

  const finish = (event: ReactPointerEvent<SVGSVGElement>): void => {
    if (panning.current !== null) {
      panning.current = null
      props.onPanEnd?.()
      return
    }
    if (press !== null) {
      const done = press.edit
      setPress(null)
      props.onLiveEdit?.(null)
      // A press that never moved is the selection the press itself performed.
      if (done === null) return
      // A move is a statement about what the mark points at, so it re-anchors.
      // A handle edits how the mark sits instead — a resize says nothing about
      // what the mark points at, so it never re-anchors.
      if (press.handle === undefined) {
        // The mark is anchored by the point it ended up at, which is what the
        // reader was aiming at when they dropped it.
        /* v8 ignore next -- a move always carries the geometry it moved to. */
        const moved: readonly FigurePoint[] = done.points ?? press.origin
        /* v8 ignore next -- a move always carries at least one point. */
        const last = moved[moved.length - 1] ?? press.from
        props.onMove(press.id, moved, anchorFor(event, last))
        return
      }
      props.onUpdate(press.id, patchFrom(done))
      return
    }
    if (!drawing.current || draft === null) return
    drawing.current = false
    if (typeof event.currentTarget.hasPointerCapture === 'function'
      && event.pointerId !== undefined
      && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setDraft(null)
    if (draft.points.length < 2) return
    // The length check above already guarantees both endpoints; indexing is the
    // only way to read them without a second, unreachable guard.
    const first = draft.points[0] as FigurePoint
    const last = draft.points[draft.points.length - 1] as FigurePoint
    if (draft.kind !== 'pen' && Math.hypot(last[0] - first[0], last[1] - first[1]) < 4) return
    const anchor = anchorFor(event, last)
    const mark: AnnotationMark = { ...draft, ...(anchor === undefined ? {} : { anchor }) }
    props.onAdd(mark)
    // Selecting the new mark puts the note box on it, so the sentence that makes
    // the mark actionable can be typed without a second gesture.
    props.onSelect(mark.id)
    props.onDrawn?.(mark.id)
    drew.current = true
  }

  /** Geometry to draw for one mark: the running gesture may have displaced it. */
  const shownPoints = (mark: AnnotationMark): readonly FigurePoint[] =>
    press !== null && press.edit !== null && press.edit.points !== undefined && press.id === mark.id
      ? press.edit.points
      : mark.points

  /** The mark as the running gesture currently has it, for drawing only. */
  const shownMark = (mark: AnnotationMark): AnnotationMark => {
    const edit = press !== null && press.id === mark.id ? press.edit : null
    if (edit === null) return mark
    const next: { -readonly [K in keyof AnnotationMark]: AnnotationMark[K] } = { ...mark, points: shownPoints(mark) }
    if (edit.rotation !== undefined) next.rotation = edit.rotation
    return next
  }

  /** The resize and rotation handles of the selected mark. */
  const renderHandles = (mark: AnnotationMark): ReactNode => {
    const frame = controlBox(mark)
    const half = grip / 2
    const handles = handlesFor(frame, mark.rotation ?? 0, grip)
    // The turn handle sits off the box, so a tether is what makes it read as
    // attached to this mark rather than floating near it.
    const tether = tetherFor(frame, mark.rotation ?? 0, grip)
    return (
      <>
        <line
          x1={tether.from[0]} y1={tether.from[1]}
          x2={tether.to[0]} y2={tether.to[1]}
          stroke="#4c8dff" strokeWidth={hairline}
        />
        {handles.map(handle => (
          <g key={handle.id}>
            <rect
              data-da-handle={handle.id}
              x={handle.point[0] - half} y={handle.point[1] - half}
              width={grip} height={grip}
              rx={handle.id === 'rotate' ? grip / 2 : grip / 7}
              fill="#ffffff" stroke="#4c8dff" strokeWidth={1.5 * hairline}
              style={{ pointerEvents: 'all', cursor: cursorFor(handle.id) }}
              onPointerDown={(event) => { beginGesture(mark, event, handle.id) }}
            />
          </g>
        ))}
      </>
    )
  }

  /**
   * A `point` mark's marker.
   *
   * A map pin, not a ring: a ring centred on a coordinate covers the very pixel it
   * claims and says nothing about where inside itself the coordinate is. A pin puts
   * its point on the spot and stands clear of it, and its solid body gives the mark's
   * number somewhere to live.
   *
   * The white halo is drawn first and thicker, so the marker reads over dense line
   * work — but it is the *only* white on the marker: the body is filled with the
   * mark's own colour, because a white body with a coloured digit was what the reader
   * compared to a washed-out sticker.
   */
  const renderPoint = (mark: AnnotationMark): ReactNode => {
    const pin = pinPathData(mark, unit)
    const centre = pinNumberCentre(mark, unit)
    /* v8 ignore next -- a point mark carries exactly the one coordinate it was placed at. */
    if (pin === undefined || centre === undefined) return null
    const number = numbers.get(mark.id)
    return (
      <>
        <path d={pin} fill="#ffffff" stroke="#ffffff" strokeWidth={4.5 * unit} strokeLinejoin="round" />
        <path d={pin} fill={mark.color} stroke="#ffffff" strokeWidth={1.5 * unit} strokeLinejoin="round" />
        <text x={centre[0]} y={centre[1]} fontFamily={PIN_FONT_FAMILY} fontSize={pinFontSizeOf(mark, unit)}
          fontWeight={700} fill={PIN_NUMBER_COLOR} textAnchor="middle" dominantBaseline="central">
          {number}
        </text>
      </>
    )
  }

  /**
   * The highlight drawn around a selected point mark.
   *
   * A frame with eight resize handles would be a lie here: a point has no extent, so
   * there is nothing to stretch. A dashed box says "this one, and only selected"
   * without offering handles that would do nothing.
   *
   * An element mark is *not* framed. Its box is a rectangle the figure never draws —
   * around a curve it can cover half the plot — so a frame there would say "this
   * region" when the mark says "this thing". It reads as selected by being lit
   * harder, in its own shape, which is the rule in `spotlight.ts`.
   * @param box - the frame to draw, in figure pixels.
   * @returns the frame, or nothing when there is no box to draw it around.
   */
  const renderFixedFrame = (box: MarkBox | undefined): ReactNode => {
    /* v8 ignore next -- both kinds that reach this frame always have a box. */
    if (box === undefined) return null
    // A control, like the frame around a stroke mark: sized on screen, not on the figure.
    const inset = 3 * hairline
    return (
      <rect
        x={box.x - inset} y={box.y - inset} width={box.width + 2 * inset}
        height={box.height + 2 * inset} rx={inset}
        fill="none" stroke="#4c8dff" strokeWidth={hairline}
        strokeDasharray={`${3 * hairline} ${2 * hairline}`}
        style={{ pointerEvents: 'none' }}
      />
    )
  }

  const renderMark = (mark: AnnotationMark, isDraft: boolean): ReactNode => {
    // The running gesture is the mark's geometry until it is dropped, so the stroke
    // follows the pointer without the parent re-rendering the stored mark.
    const shown = shownMark(mark)
    const path = markPathData(shown)
    const selected = props.selectedId === mark.id
    const transform = markTransform(shown)
    const isPoint = mark.kind === 'point'
    const pin = isPoint ? pinPathData(shown, unit) : undefined
    /**
     * What a press on the drawn shape starts.
     *
     * A point mark's target is its pin, which is a filled shape and not a stroke, so
     * it carries the hit area itself rather than relying on the invisible stroke the
     * other kinds draw along their path.
     */
    const hitArea = pin === undefined || isDraft ? null : (
      <path d={pin} fill="transparent" stroke="transparent" strokeWidth={HIT_WIDTH * unit}
        style={{ pointerEvents: 'all' }}
        onPointerDown={(event) => { if (!beginHandle(mark, event)) beginGesture(mark, event) }}
        onDoubleClick={(event) => { event.stopPropagation(); props.onEdit(mark.id) }} />
    )
    return (
      <g key={mark.id} data-da-mark={mark.id} opacity={isDraft ? 0.75 : 1}>
        {isPoint ? renderPoint(shown) : null}
        {path === undefined ? null : (
          <g transform={transform}>
            <path d={path} fill="none" stroke="#ffffff" strokeWidth={strokeWidthOf(shown, unit) + 2.5 * unit}
              strokeLinecap="round" strokeLinejoin="round" />
            <path d={path} fill="none" stroke={shown.color} strokeWidth={strokeWidthOf(shown, unit)}
              strokeLinecap="round" strokeLinejoin="round" />
            {isDraft ? null : (
              <path d={path} fill="none" stroke="transparent" strokeWidth={HIT_WIDTH * unit}
                style={{ pointerEvents: 'stroke' }}
                onPointerDown={(event) => { if (!beginHandle(mark, event)) beginGesture(mark, event) }}
                onDoubleClick={(event) => { event.stopPropagation(); props.onEdit(mark.id) }} />
            )}
          </g>
        )}
        {hitArea}
        {selected && !isDraft && isPoint ? renderFixedFrame(pointMarkBox(shown, unit)) : null}
        {selected && !isDraft && !hasFixedExtent(mark.kind) ? renderHandles(shown) : null}
      </g>
    )
  }

  return (
    <svg
      className="da-overlay"
      data-da-overlay=""
      // The overlay is the paper, from its own corner: the offset into the paper
      // belongs to the marks inside it (`origin`), and putting it on this box as
      // well moved every mark twice as far as it should have gone. A mark dragged
      // past the left edge therefore appeared past the right one.
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      data-tool={tool}
      onPointerDownCapture={capturePress}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={finish}
      onPointerCancel={finish}
      // Leaving the surface is the one move that is not a move: the picker has no
      // element under it any more, so the highlight goes rather than staying lit on
      // whatever the pointer last crossed.
      onPointerLeave={() => { setHover(null) }}
      onDoubleClick={(event) => {
        // An element mark paints nothing, so it has no shape to carry its own
        // double-click: the press is answered here, from the same question a press
        // asks. Opening one for editing is the only thing a double-click on it means.
        if (tool !== 'select') return
        const over = elementMarkAt(event, toFigure(event))
        if (over === undefined) return
        event.stopPropagation()
        props.onEdit(over.id)
      }}
      onClick={(event) => {
        // Only a click on the surface itself is a click on nothing; one that
        // landed on a mark's hit area must leave that mark selected, which is
        // what lets it be dragged again straight away.
        if (tool !== 'select' || event.target !== event.currentTarget) return
        // A pan is not a click on nothing: it is how the reader reached the mark.
        if (panned.current) {
          panned.current = false
          return
        }
        // Neither is the click the browser fires when a drawing gesture ends: it
        // arrives after the mark is placed and selected, and clearing here would
        // shut the very box the gesture just asked for.
        if (drew.current) {
          drew.current = false
          return
        }
        props.onSelect(null)
      }}
    >
      <g transform={`translate(${originX} ${originY})`}>
        {marks.map(mark => renderMark(mark, false))}
        {draft === null ? null : renderMark(draft, true)}
      </g>
    </svg>
  )
}
