/**
 * The drawing surface.
 *
 * It renders the marks over the figure and turns pointer input into marks. Every
 * shape is committed as a mark the parent owns; the component keeps only the mark
 * currently being drawn. Coordinates are always figure pixels, so the same mark
 * means the same thing at any zoom or pane width.
 * @module dsh-figmark/client/Canvas
 */
import { useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject } from 'react'
import type { AnnotationMark, FigurePoint, MarkAnchor, MarkKind } from '../shared/annotation'
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
  PIN_FONT_FAMILY, PIN_FONT_SIZE, PIN_NUMBER_COLOR, STROKE_WIDTH,
  markPathData, markTransform, pinNumberCentre, pinPathData, pointMarkBox,
} from './render'

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
}

/** Tools the toolbar can activate. */
export type Tool = 'select' | 'arrow' | 'rect' | 'ellipse' | 'pen' | 'point'

/** Hit width of an invisible selection stroke, in figure pixels. */
const HIT_WIDTH = 14

/** Minimum distance between recorded freehand samples, in figure pixels. */
const PEN_SAMPLE_STEP = 3

/** Reach of a handle's hit area, in figure pixels: generous enough to grab. */
const HANDLE_REACH = HANDLE_SIZE * 2.2

/** Props of the drawing surface. */
export interface CanvasProps {
  /** Figure width in pixels. */
  readonly width: number
  /** Figure height in pixels. */
  readonly height: number
  /** Committed marks, in draw order. */
  readonly marks: readonly AnnotationMark[]
  /** Active tool. */
  readonly tool: Tool
  /** Stroke color for new marks. */
  readonly color: string
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
  /**
   * Each mark's number, by id.
   *
   * A page's marks are drawn from a slice of the document's list, so the numbers
   * come from the document when it supplies them and from the slice's own order
   * otherwise.
   */
  const numbers = new Map(marks.map((mark, index) => [mark.id, props.numbering?.get(mark.id) ?? index + 1]))
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
   * Where the current press landed, in figure pixels.
   *
   * Recorded in the capture phase because a mark's hit area stops the bubble, so
   * this is the only place a drag on an existing mark can learn its own origin.
   * A box rather than a nullable ref: the capture handler runs for every press on
   * the surface, so there is no state where it holds no point.
   */
  const pressedAt = useRef<{ value: FigurePoint }>({ value: [0, 0] })

  /** Convert one pointer event to figure pixels. */
  const toFigure = (event: ReactPointerEvent<SVGSVGElement>): FigurePoint => {
    // The handler is bound to the surface itself, so `currentTarget` is always
    // the element whose box the coordinates are measured in.
    const rect = event.currentTarget.getBoundingClientRect()
    // A collapsed pane reports a zero-size box; treating it as 1:1 keeps a drag
    // from committing infinite coordinates.
    const scaleX = rect.width === 0 ? 1 : width / rect.width
    const scaleY = rect.height === 0 ? 1 : height / rect.height
    return [
      (event.clientX - rect.left) * scaleX,
      (event.clientY - rect.top) * scaleY,
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
  const anchorFor = (event: ReactPointerEvent<SVGSVGElement>, point: FigurePoint): MarkAnchor | undefined => {
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
  const beginHandle = (mark: AnnotationMark, event: ReactPointerEvent<SVGElement>): boolean => {
    // Handles are only drawn around the selected mark, so a press on any other
    // mark must fall through to moving it — otherwise a click near a corner of
    // an unselected mark would silently resize it.
    if (props.selectedId !== mark.id) return false
    // A point mark is framed by a highlight ring instead of handles, because it
    // has no extent to resize and a rotation would mean nothing.
    if (mark.kind === 'point') return false
    const grabbed = handleAt(controlBox(mark), mark.rotation ?? 0, pressedAt.current.value, HANDLE_REACH)
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

  const start = (event: ReactPointerEvent<SVGSVGElement>): void => {
    // Every gesture begins here, so this is where the previous one's trailing click
    // stops being owed: a press that neither pans nor draws must leave a later click
    // meaning what it says.
    drew.current = false
    if (tool === 'select') {
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
        ...(anchor === undefined ? {} : { anchor }),
      }
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
    setDraft({ id: nextMarkId(), kind: tool, color, points: seed })
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
      setPress({ ...held, edit: editFor(held, point, dx, dy) })
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
    const half = HANDLE_SIZE / 2
    const handles = handlesFor(frame, mark.rotation ?? 0)
    // The turn handle sits off the box, so a tether is what makes it read as
    // attached to this mark rather than floating near it.
    const tether = tetherFor(frame, mark.rotation ?? 0)
    return (
      <>
        <line
          x1={tether.from[0]} y1={tether.from[1]}
          x2={tether.to[0]} y2={tether.to[1]}
          stroke="#4c8dff" strokeWidth={1}
        />
        {handles.map(handle => (
          <g key={handle.id}>
            <rect
              data-da-handle={handle.id}
              x={handle.point[0] - half} y={handle.point[1] - half}
              width={HANDLE_SIZE} height={HANDLE_SIZE}
              rx={handle.id === 'rotate' ? HANDLE_SIZE / 2 : 1}
              fill="#ffffff" stroke="#4c8dff" strokeWidth={1.5}
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
    const pin = pinPathData(mark)
    const centre = pinNumberCentre(mark)
    /* v8 ignore next -- a point mark carries exactly the one coordinate it was placed at. */
    if (pin === undefined || centre === undefined) return null
    const number = numbers.get(mark.id)
    return (
      <>
        <path d={pin} fill="#ffffff" stroke="#ffffff" strokeWidth={4.5} strokeLinejoin="round" />
        <path d={pin} fill={mark.color} stroke="#ffffff" strokeWidth={1.5} strokeLinejoin="round" />
        <text x={centre[0]} y={centre[1]} fontFamily={PIN_FONT_FAMILY} fontSize={PIN_FONT_SIZE}
          fontWeight={700} fill={PIN_NUMBER_COLOR} textAnchor="middle" dominantBaseline="central">
          {number}
        </text>
      </>
    )
  }

  /**
   * The highlight drawn around a selected `point` mark.
   *
   * A frame with eight resize handles would be a lie: a point mark has no extent,
   * so there is nothing to stretch and nothing to turn. What it does need is to
   * read as selected, which a dashed box around the pin says without offering
   * handles that would do nothing.
   */
  const renderPointFrame = (shown: AnnotationMark): ReactNode => {
    const box = pointMarkBox(shown)
    /* v8 ignore next -- a point mark carries exactly the one coordinate it was placed at. */
    if (box === undefined) return null
    return (
      <rect
        x={box.x - 3} y={box.y - 3} width={box.width + 6} height={box.height + 6} rx={3}
        fill="none" stroke="#4c8dff" strokeWidth={1} strokeDasharray="3 2"
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
    const pin = isPoint ? pinPathData(shown) : undefined
    /**
     * What a press on the drawn shape starts.
     *
     * A point mark's target is its pin, which is a filled shape and not a stroke, so
     * it carries the hit area itself rather than relying on the invisible stroke the
     * other kinds draw along their path.
     */
    const hitArea = pin === undefined || isDraft ? null : (
      <path d={pin} fill="transparent" stroke="transparent" strokeWidth={HIT_WIDTH}
        style={{ pointerEvents: 'all', cursor: 'pointer' }}
        onPointerDown={(event) => { if (!beginHandle(mark, event)) beginGesture(mark, event) }}
        onDoubleClick={(event) => { event.stopPropagation(); props.onEdit(mark.id) }} />
    )
    return (
      <g key={mark.id} data-da-mark={mark.id} opacity={isDraft ? 0.75 : 1}>
        {isPoint ? renderPoint(shown) : null}
        {path === undefined ? null : (
          <g transform={transform}>
            <path d={path} fill="none" stroke="#ffffff" strokeWidth={STROKE_WIDTH + 2.5}
              strokeLinecap="round" strokeLinejoin="round" />
            <path d={path} fill="none" stroke={shown.color} strokeWidth={STROKE_WIDTH}
              strokeLinecap="round" strokeLinejoin="round" />
            {isDraft ? null : (
              <path d={path} fill="none" stroke="transparent" strokeWidth={HIT_WIDTH}
                style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                onPointerDown={(event) => { if (!beginHandle(mark, event)) beginGesture(mark, event) }}
                onDoubleClick={(event) => { event.stopPropagation(); props.onEdit(mark.id) }} />
            )}
          </g>
        )}
        {hitArea}
        {selected && !isDraft && isPoint ? renderPointFrame(shown) : null}
        {selected && !isDraft && !isPoint ? renderHandles(shown) : null}
      </g>
    )
  }

  return (
    <svg
      className="da-overlay"
      data-da-overlay=""
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      data-tool={tool}
      onPointerDownCapture={capturePress}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={finish}
      onPointerCancel={finish}
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
      {marks.map(mark => renderMark(mark, false))}
      {draft === null ? null : renderMark(draft, true)}
    </svg>
  )
}
