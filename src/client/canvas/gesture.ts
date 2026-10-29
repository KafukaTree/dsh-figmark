/**
 * The pointer state machine of the drawing surface.
 *
 * One surface answers four kinds of pointer input that all begin with the same
 * event and end with the same one: drawing a new mark, moving or resizing an
 * existing one, panning the paper, and picking the element under the pointer. They
 * share the press because they have to be told apart at the press — the thing the
 * pointer landed on decides which of the four it is — and they share the release
 * because only one of them can own it.
 *
 * Keeping the machine here rather than inside the component is what makes the
 * component an assembly: it draws, this decides. The state that only exists between
 * a press and a release lives here too, so nothing that draws has to know a gesture
 * is in flight.
 * @module dsh-figmark/client/canvas/gesture
 */

import { useEffect, useRef, useState } from 'react'
import type { AnnotationMark, FigurePoint, MarkAnchor } from '../../shared/annotation'
import { WEIGHT_DEFAULT, describesARegion } from '../../shared/annotation'
import { gripAt, type HandleId } from '../handles'
import { controlSizes, type ControlSizes } from './controls'
import { controlBox, elementNamedBy, sameAnchor } from './hit'
import {
  appendPenSample, draftAnchorPoint, draftMark, draftWorthCommitting, elementMark, pointMark, stretchDraft,
  type DragTool,
} from './marks'
import { anchorOf, figurePointOf, type SurfaceGeometry } from './pointer'
import { editFor, liveMark, patchFrom, type Press } from './press'
import { hasFixedExtent } from '../render'
import type { CanvasProps, EventPoint, MarkPatch, SurfaceClickEvent, SurfaceEvent } from './types'

/** Hit reach of a control handle, as a multiple of its side: generous enough to grab. */
const HANDLE_REACH = 2.2

/**
 * Everything the surface's svg binds.
 *
 * Handlers rather than raw state: the component that draws the paper does not need
 * to know that a gesture exists, only what to call when the pointer does something.
 */
export interface SurfaceHandlers {
  /** Remember where a press landed, before any hit area consumes it. */
  readonly onPointerDownCapture: (event: SurfaceEvent) => void
  /** Begin a gesture on the paper. */
  readonly onPointerDown: (event: SurfaceEvent) => void
  /** Continue the gesture in flight. */
  readonly onPointerMove: (event: SurfaceEvent) => void
  /** End the gesture in flight, committing whatever it drew. */
  readonly onPointerUp: (event: SurfaceEvent) => void
  /** The pointer was cancelled, which ends the gesture like a release does. */
  readonly onPointerCancel: (event: SurfaceEvent) => void
  /** The pointer left, so the picker names nothing any more. */
  readonly onPointerLeave: () => void
  /** A click on the paper itself: it means "nothing is selected". */
  readonly onClick: (event: SurfaceClickEvent) => void
  /** Open an element mark for editing. */
  readonly onDoubleClick: (event: SurfaceClickEvent) => void
  /** A press that landed on a mark's drawn shape. */
  readonly onPressMark: (mark: AnnotationMark, event: SurfaceEvent) => void
  /** A press that landed on one of the selected mark's control handles. */
  readonly onPressHandle: (mark: AnnotationMark, event: SurfaceEvent, handle: HandleId) => void
}

/** The state a gesture leaves behind for the renderer. */
export interface GestureView {
  /** The mark being drawn, or null when no drawing gesture is in flight. */
  readonly draft: AnnotationMark | null
  /** The gesture in flight, which may have displaced one mark. */
  readonly press: Press | null
  /** The element the pointer names, while the picker is armed. */
  readonly hover: MarkAnchor | null
  /** The sizes the surface's own controls are drawn at. */
  readonly sizes: ControlSizes
  /** What the svg binds. */
  readonly handlers: SurfaceHandlers
}

/**
 * Wire the surface's pointer machine.
 *
 * The pending gesture is one state object rather than a group of booleans because a
 * press can only be one of them: two would be two truths about the same pointer.
 * @param props - the surface's contract.
 * @param geometry - the paper's size and origin, in figure pixels.
 * @returns what to draw and what to bind.
 */
export function useCanvasGesture(props: CanvasProps, geometry: SurfaceGeometry): GestureView {
  const { marks, tool, color, weight, containerRef, anchoring } = props
  const penWeight = weight ?? WEIGHT_DEFAULT
  const sizes = controlSizes(props.scale)
  const [draft, setDraft] = useState<AnnotationMark | null>(null)
  const [press, setPress] = useState<Press | null>(null)
  const drawing = useRef(false)
  const panning = useRef<{ x: number; y: number } | null>(null)
  const panned = useRef(false)
  /**
   * Whether the press that just ended has already spent the click it comes with.
   *
   * A press and its release are followed by a `click` on whatever the browser
   * considers the target. That click is the panel's way of saying "the reader
   * pressed the paper", which is how a selection is dropped — so a gesture that
   * deliberately ended with a selection has to say so, or it selects and deselects
   * in the one movement. Drawing set this; picking a placed element did not, which
   * is why an element mark could be placed but never reopened.
   */
  const settled = useRef(false)
  const [hover, setHover] = useState<MarkAnchor | null>(null)
  const reportHover = props.onHover
  /**
   * Tell the parent which element the pointer is over.
   *
   * A separate effect rather than a call inside the move handler: the highlight
   * belongs to the figure's own document, and this component never touches it. Kept
   * on `hover` and the callback alone, so a move that names the same element reports
   * nothing at all — the effect's dependencies are the two things that can change the
   * answer, not the props object a parent rebuilds every render.
   */
  useEffect(() => {
    reportHover?.(hover ?? undefined)
  }, [hover, reportHover])
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
   * Where the current press landed, in figure pixels.
   *
   * Recorded in the capture phase because a mark's hit area stops the bubble, so
   * this is the only place a drag on an existing mark can learn its own origin.
   * A box rather than a nullable ref: the capture handler runs for every press on
   * the surface, so there is no state where it holds no point.
   */
  const pressedAt = useRef<{ value: FigurePoint }>({ value: [0, 0] })

  const toFigure = (event: EventPoint): FigurePoint => figurePointOf(event, geometry)
  const anchorFor = (event: EventPoint, point: FigurePoint): MarkAnchor | undefined =>
    anchorOf(event, point, geometry, { anchoring, containerRef, anchorAtFigurePoint: props.anchorAtFigurePoint })
  const elementMarkAt = (event: EventPoint, point: FigurePoint): AnnotationMark | undefined =>
    elementNamedBy(marks, anchorFor(event, point), props.selectedId)

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
   * @param mark - the mark the press landed on.
   * @param event - the pointer event.
   * @param handle - the handle it grabbed instead of the shape, when it did.
   */
  const beginGesture = (mark: AnnotationMark, event: SurfaceEvent, handle?: Press['handle']): void => {
    event.stopPropagation()
    props.onSelect(mark.id)
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
  const beginHandle = (mark: AnnotationMark, event: SurfaceEvent): boolean => {
    // Handles are only drawn around the selected mark, so a press on any other
    // mark must fall through to moving it — otherwise a click near a corner of
    // an unselected mark would silently resize it.
    if (props.selectedId !== mark.id) return false
    // Marks with a fixed extent are framed by a dashed box instead of handles: a
    // point has no extent to resize, and an element's box belongs to the element.
    if (hasFixedExtent(mark.kind)) return false
    const grabbed = gripAt(
      controlBox(mark), mark.rotation ?? 0, pressedAt.current.value, HANDLE_REACH * sizes.grip, sizes.grip,
    )
    if (grabbed === undefined) return false
    beginGesture(mark, event, grabbed)
    return true
  }

  const onPressMark = (mark: AnnotationMark, event: SurfaceEvent): void => {
    if (!beginHandle(mark, event)) beginGesture(mark, event)
  }

  const start = (event: SurfaceEvent): void => {
    // Every gesture begins here, so this is where the previous one's trailing click
    // stops being owed: a press that neither pans nor draws must leave a later click
    // meaning what it says.
    settled.current = false
    if (tool === 'select') {
      // A press on a placed element selects it, the way a press on any other mark
      // does — but it is found by asking the figure what is under the pointer, not by
      // a box drawn over it. That keeps the target exactly as big as the thing the
      // mark is about: pressing elsewhere inside the box is pressing paper.
      const overElement = elementMarkAt(event, toFigure(event))
      if (overElement !== undefined) {
        beginGesture(overElement, event)
        // The press landed on the overlay because the mark paints nothing, so the
        // browser will report the trailing click on the overlay too — and a click on
        // the paper is what drops the selection. This one is the click that made it.
        settled.current = true
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
      const mark = pointMark({ color, weight: penWeight, point }, anchorFor(event, point))
      props.onAdd(mark)
      props.onSelect(mark.id)
      props.onDrawn?.(mark.id)
      settled.current = true
      return
    }
    if (tool === 'element') {
      // Picking is a click, not a drag: the element under the pointer is already the
      // whole answer, and there is nothing for a drag to decide. A press that names
      // no element does nothing at all, rather than placing a mark on the background —
      // an element mark with no element would be a box claiming to name a thing.
      const picked = anchorFor(event, point)
      if (picked === undefined) return
      const mark = elementMark(picked, color)
      props.onAdd(mark)
      props.onSelect(mark.id)
      props.onDrawn?.(mark.id)
      settled.current = true
      return
    }
    drawing.current = true
    if (typeof event.currentTarget.setPointerCapture === 'function' && event.pointerId !== undefined) {
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    setDraft(draftMark({ tool: tool as DragTool, color, weight: penWeight, point }))
  }

  const move = (event: SurfaceEvent): void => {
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
      const base = marks.find(candidate => candidate.id === press.id)
      /* v8 ignore next -- a press always begins on a mark that is still in the list. */
      if (base === undefined) return
      props.onLiveEdit?.(liveMark(base, edit))
      return
    }
    if (!drawing.current || draft === null) return
    const point = toFigure(event)
    if (draft.kind === 'pen') {
      setDraft(appendPenSample(draft, point))
      return
    }
    setDraft(stretchDraft(draft, point))
  }

  const finish = (event: SurfaceEvent): void => {
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
      // A handle edits how the mark sits — a resize says nothing about what the mark
      // points at, so it never re-anchors.
      if (press.handle === undefined) {
        // The mark is anchored by the point it ended up at, which is what the
        // reader was aiming at when they dropped it. A region does not point at
        // anything: its last corner is where the hand stopped, so asking what is
        // under it would name an element the reader never asked about.
        /* v8 ignore next -- a move always carries the geometry it moved to. */
        const moved: readonly FigurePoint[] = done.points ?? press.origin
        /* v8 ignore next -- a move always carries at least one point. */
        const last = moved[moved.length - 1] ?? press.from
        props.onMove(press.id, moved, describesARegion(press.kind) ? undefined : anchorFor(event, last))
        return
      }
      const patch: MarkPatch = patchFrom(done)
      props.onUpdate(press.id, patch)
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
    if (!draftWorthCommitting(draft)) return
    // Only a mark that points at a place carries an anchor. A box says "look in
    // here"; the element under its last corner is where the hand stopped, and the
    // message would go on to name it as though the reader had asked about it.
    const anchor = describesARegion(draft.kind) ? undefined : anchorFor(event, draftAnchorPoint(draft))
    const mark: AnnotationMark = { ...draft, ...(anchor === undefined ? {} : { anchor }) }
    props.onAdd(mark)
    // Selecting the new mark puts the note box on it, so the sentence that makes
    // the mark actionable can be typed without a second gesture.
    props.onSelect(mark.id)
    props.onDrawn?.(mark.id)
    settled.current = true
  }

  const onClick = (event: SurfaceClickEvent): void => {
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
    if (settled.current) {
      settled.current = false
      return
    }
    props.onSelect(null)
  }

  const onDoubleClick = (event: SurfaceClickEvent): void => {
    // An element mark paints nothing, so it has no shape to carry its own
    // double-click: the press is answered here, from the same question a press
    // asks. Opening one for editing is the only thing a double-click on it means.
    if (tool !== 'select') return
    const over = elementMarkAt(event, toFigure(event))
    if (over === undefined) return
    event.stopPropagation()
    props.onEdit(over.id)
  }

  /** A press on the paper while a drawing gesture is not in flight: nothing to do. */
  const onPointerDownCapture = (event: SurfaceEvent): void => {
    pressedAt.current.value = toFigure(event)
  }

  return {
    draft,
    press,
    hover,
    sizes,
    handlers: {
      onPointerDownCapture,
      onPointerDown: start,
      onPointerMove: move,
      onPointerUp: finish,
      onPointerCancel: finish,
      onPointerLeave: () => { setHover(null) },
      onClick,
      onDoubleClick,
      onPressMark,
      onPressHandle: (mark, event, handle) => { beginGesture(mark, event, handle) },
    },
  }
}
