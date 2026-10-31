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
import {
  anchorAtOffset, sameChoiceAnchors, sameChoiceElements,
  type ElementChoices,
} from '../element-choice'
import { endAt, gripAt, type HandleId } from '../handles'
import { controlSizes, type ControlSizes } from './controls'
import { elementMarkOn } from '../annotator/mark-edits'
import { controlBox, elementNamedBy } from './hit'
import {
  appendPenSample, draftAnchorPoint, draftMark, draftWorthCommitting, elementMark, pointMark, stretchDraft,
  type DragTool,
} from './marks'
import { anchorOf, choicesOf, figurePointOf, type SurfaceGeometry } from './pointer'
import { editFor, liveMark, patchFrom, type Press } from './press'
import { hasFixedExtent } from '../render'
import type { CanvasProps, EventPoint, MarkPatch, SurfaceClickEvent, SurfaceEvent } from './types'

/** Hit reach of a control handle, as a multiple of its side: generous enough to grab. */
const HANDLE_REACH = 2.2
/** Screen-pixel travel before a press becomes a pan, move, or a different target. */
const DRAG_SLOP = 4

/** One pointer owns at most one gesture until it is released or cancelled. */
interface ActivePointer {
  readonly id: number
  readonly x: number
  readonly y: number
}

/** A point or element that is committed only if this pointer releases as a click. */
interface PendingTap {
  readonly mark: AnnotationMark
  readonly existing: AnnotationMark | undefined
}

interface TouchPoint {
  readonly x: number
  readonly y: number
}

/** Two fingers, remembered in screen coordinates between pointer events. */
interface Pinch {
  readonly ids: readonly [number, number]
  distance: number
  centerX: number
  centerY: number
}

/**
 * Whether a key event is going into a field where arrow keys edit text.
 * @param target - the event target.
 * @returns true for inputs, textareas, selects, and contenteditable regions.
 */
function editingField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT'
}

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
  /** The pointer was cancelled, which abandons the gesture without committing it. */
  readonly onPointerCancel: (event: SurfaceEvent) => void
  /** Pointer capture disappeared before a release, so the gesture is abandoned. */
  readonly onLostPointerCapture: (event: SurfaceEvent) => void
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
  /** Abandon any input still in flight without committing it. */
  readonly cancel: () => boolean
  /** Whether an input gesture still owns the surface. */
  readonly isActive: () => boolean
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
  const active = useRef<ActivePointer | null>(null)
  const pendingTap = useRef<PendingTap | null>(null)
  const touches = useRef(new Map<number, TouchPoint>())
  /** Fingers still down after a pinch whose navigation gesture has already ended. */
  const draining = useRef(new Set<number>())
  const pinch = useRef<Pinch | null>(null)
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
  const [picked, setPicked] = useState<{
    readonly choices: ElementChoices
    readonly index: number
  } | null>(null)
  const hover = picked === null ? null : anchorAtOffset(picked.choices, picked.index - picked.choices.preferred)
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
    reportHover?.(
      hover ?? undefined,
      picked === null ? undefined : { level: picked.index + 1, count: picked.choices.anchors.length },
    )
  }, [hover, picked, reportHover])
  /**
   * Forget the highlight whenever the picker is put away.
   *
   * The highlight says "this is what a click would take"; with no picker armed there
   * is no click to describe, and a lit element left behind would be a promise the
   * tool no longer keeps. Disarming also covers the case a pointer never will: the
   * reader leaves the figure with the picker armed, so no move arrives to clear it.
   */
  useEffect(() => {
    if (tool !== 'element') setPicked(null)
  }, [tool])
  /**
   * Move through the element ladder without moving the pointer.
   *
   * The pointer chooses a position and the arrow keys choose what at that position the
   * reader means: up is the containing artist or block, down is the exact painted part.
   * The keys are only taken while a picker has something under it and the reader is not
   * typing, so an arrow in the comment field still moves the caret.
   */
  useEffect(() => {
    if (tool !== 'element' || picked === null) return
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
      if (editingField(event.target)) return
      event.preventDefault()
      setPicked(current => {
        /* v8 ignore next -- this listener only exists while a level is picked. */
        if (current === null) return null
        const delta = event.key === 'ArrowUp' ? 1 : -1
        const next = Math.min(
          current.choices.anchors.length - 1,
          Math.max(0, current.index + delta),
        )
        return next === current.index ? current : { ...current, index: next }
      })
    }
    window.addEventListener('keydown', onKeyDown)
    return () => { window.removeEventListener('keydown', onKeyDown) }
  }, [picked, tool])
  /**
   * Where the current press landed, in figure pixels.
   *
   * Recorded in the capture phase because a mark's hit area stops the bubble, so
   * this is the only place a drag on an existing mark can learn its own origin.
   * A box rather than a nullable ref: the capture handler runs for every press on
   * the surface, so there is no state where it holds no point.
   */
  const pressedAt = useRef<{ value: FigurePoint }>({ value: [0, 0] })

  const pointerId = (event: SurfaceEvent): number => event.pointerId ?? 1

  /**
   * Claim the surface for one primary left-button pointer.
   *
   * Mouse, pen, and touch all arrive as pointer events, but their useful gestures
   * do not overlap: a second finger belongs to a future pinch, and a right press is
   * a context menu. Keeping the owner as an id rather than a boolean is what stops
   * a second pointer from steering the first pointer's mark or pan.
   */
  const claim = (event: SurfaceEvent): boolean => {
    if (active.current !== null) return false
    if (event.isPrimary === false || event.button !== 0) return false
    active.current = { id: pointerId(event), x: event.clientX, y: event.clientY }
    return true
  }

  /**
   * Keep a claimed pointer until its own release, even if it leaves the surface.
   *
   * A point or element pick is committed on pointerup rather than on pointerdown.
   * Without capture, releasing outside the SVG produced neither pointerup nor click:
   * the owner stayed claimed and the next press was silently ignored.
   */
  const capture = (event: SurfaceEvent): void => {
    /* v8 ignore next -- jsdom has no pointer capture; browsers do. */
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const owns = (event: SurfaceEvent): boolean =>
    active.current === null || active.current.id === pointerId(event)

  /** Whether any gesture or uncommitted tap still owns this surface. */
  const isActive = (): boolean =>
    pinch.current !== null
    || active.current !== null
    || drawing.current
    || pendingTap.current !== null
    || panning.current !== null
    || press !== null

  const travelled = (event: SurfaceEvent): boolean => {
    const from = active.current
    /* v8 ignore next -- a live gesture always has an owner. */
    if (from === null) return false
    return Math.hypot(event.clientX - from.x, event.clientY - from.y) >= DRAG_SLOP
  }

  const toFigure = (event: EventPoint): FigurePoint => figurePointOf(event, geometry)
  const anchorFor = (event: EventPoint, point: FigurePoint): MarkAnchor | undefined =>
    anchorOf(event, point, geometry, {
      anchoring,
      containerRef,
      anchorAtFigurePoint: props.anchorAtFigurePoint,
      anchorChoicesAtFigurePoint: props.anchorChoicesAtFigurePoint,
    })
  const choicesFor = (event: EventPoint, point: FigurePoint): ElementChoices | undefined =>
    choicesOf(event, point, geometry, {
      anchoring,
      containerRef,
      anchorAtFigurePoint: props.anchorAtFigurePoint,
      anchorChoicesAtFigurePoint: props.anchorChoicesAtFigurePoint,
    })
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
    // Under a mark-making tool the drawn mark is not the target: let the press
    // continue to the surface, where that tool can start its own gesture on top.
    if (handle === undefined && tool !== 'select') return
    if (!claim(event)) return
    event.stopPropagation()
    props.onSelect(mark.id)
    // An element mark cannot be dragged: its box is where the element was, and a box
    // moved a few pixels away would still claim to name that element while pointing
    // at nothing in particular. Picking it again is how it is placed, so the press
    // that would move it just selects it.
    if (handle === undefined && mark.kind === 'element') {
      active.current = null
      return
    }
    capture(event)
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
    if (tool !== 'select') return false
    // Handles are only drawn around the selected mark, so a press on any other
    // mark must fall through to moving it — otherwise a click near a corner of
    // an unselected mark would silently resize it.
    if (props.selectedId !== mark.id) return false
    // Marks with a fixed extent are framed by a dashed box instead of handles: a
    // point has no extent to resize, and an element's box belongs to the element.
    if (hasFixedExtent(mark.kind)) return false
    // A two-point mark is controlled by its ends; everything else by the frame
    // around its box. The surface asks the same question of either: which grip is
    // the pointer on, and is it nearer that grip than the middle of the mark.
    const grabbed = mark.kind === 'arrow'
      ? endAt(mark.points, mark.rotation ?? 0, pressedAt.current.value, HANDLE_REACH * sizes.grip)
      : gripAt(controlBox(mark), mark.rotation ?? 0, pressedAt.current.value, HANDLE_REACH * sizes.grip, sizes.grip)
    if (grabbed === undefined) return false
    beginGesture(mark, event, grabbed)
    return true
  }

  const onPressMark = (mark: AnnotationMark, event: SurfaceEvent): void => {
    if (!beginHandle(mark, event)) beginGesture(mark, event)
  }

  const start = (event: SurfaceEvent): void => {
    // The second finger belongs to the pinch that started in the capture phase. It
    // must not reset the click debt or claim the surface for another gesture.
    if (pinch.current !== null) return
    // Every gesture begins here, so this is where the previous one's trailing click
    // stops being owed: a press that neither pans nor draws must leave a later click
    // meaning what it says.
    settled.current = false
    if (!claim(event)) return
    if (tool === 'select') {
      // A press on a placed element selects it, the way a press on any other mark
      // does — but it is found by asking the figure what is under the pointer, not by
      // a box drawn over it. That keeps the target exactly as big as the thing the
      // mark is about: pressing elsewhere inside the box is pressing paper.
      const overElement = elementMarkAt(event, toFigure(event))
      if (overElement !== undefined) {
        // The surface claimed the pointer only to decide what this press means;
        // the mark's own gesture now owns it.
        active.current = null
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
      if (props.onPan === undefined || props.pannable === false) return
      panning.current = { x: event.clientX, y: event.clientY }
      panned.current = false
      // The browser's own capture is what keeps a drag alive past the edge of the
      // surface; a host without it still pans, just loses the pointer at the edge.
      capture(event)
      return
    }
    event.preventDefault()
    const point = toFigure(event)
    if (tool === 'point') {
      const mark = pointMark({ color, weight: penWeight, point }, anchorFor(event, point))
      pendingTap.current = { mark, existing: undefined }
      capture(event)
      return
    }
    if (tool === 'element') {
      // Picking is a click, not a drag: the element under the pointer is already the
      // whole answer, and there is nothing for a drag to decide. A press that names
      // no element does nothing at all, rather than placing a mark on the background —
      // an element mark with no element would be a box claiming to name a thing.
      const choices = choicesFor(event, point)
      if (choices === undefined) {
        props.onPickMiss?.()
        return
      }
      const offset = picked !== null && sameChoiceElements(picked.choices, choices)
        ? picked.index - picked.choices.preferred
        : 0
      const pickedAnchor = anchorAtOffset(choices, offset)
      const mark = elementMark(pickedAnchor, color)
      // An element that already carries a mark is picked, not marked again: the press
      // lands on the mark that is there, which is the one the reader wanted to comment
      // on, and nothing new appears for a fourth or fifth time.
      const already = elementMarkOn(props.marks, mark)
      pendingTap.current = { mark, existing: already }
      capture(event)
      return
    }
    drawing.current = true
    capture(event)
    setDraft(draftMark({ tool: tool as DragTool, color, weight: penWeight, point }))
  }

  const move = (event: SurfaceEvent): void => {
    if (event.pointerType === 'touch') {
      touches.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    }
    if (pinch.current !== null) {
      movePinch(event)
      return
    }
    if (!owns(event)) return
    if (pendingTap.current !== null && travelled(event)) pendingTap.current = null
    const from = panning.current
    if (from !== null) {
      const start = active.current
      /* v8 ignore next -- a pan is a live gesture and therefore always owned. */
      if (start === null) return
      const dx = panned.current ? event.clientX - from.x : event.clientX - start.x
      const dy = panned.current ? event.clientY - from.y : event.clientY - start.y
      if (dx === 0 && dy === 0) return
      if (!panned.current && !travelled(event)) return
      if (!panned.current) props.onPanStart?.()
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
      const found = choicesFor(event, toFigure(event))
      setPicked(current => {
        if (found === undefined) return null
        if (current === null || !sameChoiceElements(current.choices, found)) {
          return { choices: found, index: found.preferred }
        }
        if (sameChoiceAnchors(current.choices, found)) return current
        return { ...current, choices: found }
      })
    }
    if (press !== null) {
      if (press.edit === null && !travelled(event) && !(event.shiftKey && press.handle === 'rotate')) return
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

  const settle = (event: SurfaceEvent): void => {
    if (endPinch(event)) return
    if (active.current === null || !owns(event)) return
    if (panning.current !== null) {
      const started = panned.current
      panning.current = null
      // The trailing click is the gesture's ending punctuation. Keep the pan flag
      // until that click arrives so it is not mistaken for a click on nothing.
      panned.current = started
      active.current = null
      if (started) props.onPanEnd?.()
      return
    }
    if (press !== null) {
      const done = press.edit
      setPress(null)
      active.current = null
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
    if (pendingTap.current !== null) {
      const pending = pendingTap.current
      pendingTap.current = null
      active.current = null
      if (pending.existing === undefined) {
        props.onAdd(pending.mark)
        props.onSelect(pending.mark.id)
        props.onDrawn?.(pending.mark.id)
      } else {
        props.onSelect(pending.existing.id)
        props.onDrawn?.(pending.existing.id)
      }
      settled.current = true
      return
    }
    if (!drawing.current || draft === null) {
      active.current = null
      return
    }
    drawing.current = false
    active.current = null
    setDraft(null)
    if (typeof event.currentTarget.hasPointerCapture === 'function'
      && event.pointerId !== undefined
      && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
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

  /**
   * Abandon the gesture without creating or changing anything.
   *
   * A cancelled pointer, lost capture, hidden tab, or window blur means the browser
   * no longer knows where the release would have happened. Treating that as a
   * successful release made marks appear from a gesture the reader never completed.
   */
  const cancel = (event?: SurfaceEvent): boolean => {
    const wasActive = isActive()
    if (event !== undefined && endPinch(event)) return true
    if (event === undefined) {
      touches.current.clear()
      draining.current.clear()
      pinch.current = null
    }
    if (event !== undefined && (active.current === null || !owns(event))) return false
    const hadPan = panning.current !== null && panned.current
    panning.current = null
    drawing.current = false
    pendingTap.current = null
    active.current = null
    panned.current = false
    setDraft(null)
    setPress(null)
    props.onLiveEdit?.(null)
    if (hadPan) props.onPanEnd?.()
    // A cancelled pointer normally produces no click. Suppressing a trailing one
    // anyway keeps a later synthetic click from clearing the selection by accident;
    // the next press resets this before it can affect a real click.
    settled.current = true
    if (event !== undefined
      && typeof event.currentTarget.hasPointerCapture === 'function'
      && event.pointerId !== undefined
      && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    return wasActive
  }
  const cancelFromLifecycle = (): void => { cancel() }

  useEffect(() => {
    window.addEventListener('blur', cancelFromLifecycle)
    const onVisibility = (): void => {
      if (document.visibilityState === 'hidden') cancelFromLifecycle()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('blur', cancelFromLifecycle)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  })

  const onClick = (event: SurfaceClickEvent): void => {
    // Only a click on the surface itself is a click on nothing; one that
    // landed on a mark's hit area must leave that mark selected, which is
    // what lets it be dragged again straight away.
    if (event.target !== event.currentTarget) return
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
    // A miss in element mode leaves the picker armed for another try, but it does
    // let go of the comment on whatever was selected before. Drawing tools own
    // their click entirely; their press already produced a mark or a miss message.
    if (tool !== 'select' && tool !== 'element') return
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
    if (event.pointerType === 'touch') {
      if (draining.current.has(event.pointerId)) return
      if (draining.current.size > 0) {
        draining.current.add(event.pointerId)
        capture(event)
        return
      }
      touches.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
      if (touches.current.size >= 2 && pinch.current === null) {
        // A second finger changes the meaning of the gesture already in flight: a line
        // half drawn is not a line the reader finished. Drop it, then treat the pair
        // as navigation from this frame onward.
        const hadPan = panning.current !== null && panned.current
        panning.current = null
        drawing.current = false
        pendingTap.current = null
        active.current = null
        panned.current = false
        setDraft(null)
        setPress(null)
        props.onLiveEdit?.(null)
        if (hadPan) props.onPanEnd?.()
        settled.current = true
        /* v8 ignore next -- jsdom has no pointer capture; browsers do. */
        event.currentTarget.setPointerCapture?.(event.pointerId)
        const pair = [...touches.current.entries()].slice(0, 2)
        const firstEntry = pair[0]
        const secondEntry = pair[1]
        /* v8 ignore next -- the size check above guarantees two entries. */
        if (firstEntry !== undefined && secondEntry !== undefined) {
          const first = firstEntry[1]
          const second = secondEntry[1]
          pinch.current = {
            ids: [firstEntry[0], secondEntry[0]],
            distance: Math.hypot(second.x - first.x, second.y - first.y),
            centerX: (first.x + second.x) / 2,
            centerY: (first.y + second.y) / 2,
          }
        }
      }
    }
    if (!owns(event)) return
    pressedAt.current.value = toFigure(event)
  }

  /**
   * Continue a two-finger pinch.
   *
   * The distance changes scale and the centroid changes scroll: fingers can spread
   * and travel in the same movement, as they do on a map. The pair owns the gesture
   * until the first finger lifts, so neither finger can accidentally finish a draft
   * that the second finger already abandoned.
   */
  const movePinch = (event: SurfaceEvent): void => {
    const gesture = pinch.current
    /* v8 ignore next -- callers only enter this path with a live pinch. */
    if (gesture === null || event.pointerType !== 'touch') return
    if (!gesture.ids.includes(event.pointerId)) return
    touches.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const first = touches.current.get(gesture.ids[0])
    const second = touches.current.get(gesture.ids[1])
    /* v8 ignore next -- both ids are in the map until one of them lifts. */
    if (first === undefined || second === undefined) return
    const distance = Math.hypot(second.x - first.x, second.y - first.y)
    const centerX = (first.x + second.x) / 2
    const centerY = (first.y + second.y) / 2
    if (gesture.distance > 0 && distance > 0 && distance !== gesture.distance) {
      props.onZoomAt?.(distance / gesture.distance, centerX, centerY)
    }
    const dx = centerX - gesture.centerX
    const dy = centerY - gesture.centerY
    if (dx !== 0 || dy !== 0) props.onPan?.(dx, dy)
    gesture.distance = distance
    gesture.centerX = centerX
    gesture.centerY = centerY
  }

  /**
   * End the pinch when one of its fingers is lifted or taken away.
   * @returns true when the event belonged to the pinch and the normal gesture path
   * must not also see it.
   */
  const endPinch = (event: SurfaceEvent): boolean => {
    if (event.pointerType === 'touch') {
      touches.current.delete(event.pointerId)
      draining.current.delete(event.pointerId)
    }
    const gesture = pinch.current
    if (gesture === null || !gesture.ids.includes(event.pointerId)) {
      return false
    }
    pinch.current = null
    // A remaining finger is the tail of the pinch, not the start of a drawing. Drain
    // every finger still down before accepting new input; a third finger may land
    // during that tail and is drained with the pair rather than replacing it.
    for (const id of gesture.ids) {
      touches.current.delete(id)
      draining.current.add(id)
    }
    draining.current.delete(event.pointerId)
    // A tap may still be synthesized after the lift. It is the punctuation of a
    // pinch, not a click on paper, so let the existing click guard consume it.
    settled.current = true
    return true
  }

  return {
    draft,
    press,
    hover,
    sizes,
    cancel,
    isActive,
    handlers: {
      onPointerDownCapture,
      onPointerDown: start,
      onPointerMove: move,
      onPointerUp: settle,
      onPointerCancel: cancel,
      onLostPointerCapture: cancel,
      onPointerLeave: () => { setPicked(null) },
      onClick,
      onDoubleClick,
      onPressMark,
      onPressHandle: (mark, event, handle) => { beginGesture(mark, event, handle) },
    },
  }
}
