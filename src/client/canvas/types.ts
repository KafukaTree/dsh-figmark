/**
 * The contract this surface is built to.
 *
 * `Canvas.tsx` is the assembly of four jobs, and this module is the one thing all
 * four agree on: what a tool is, what a gesture may change, and every field the
 * owner of the surface hands over. Keeping the contract apart means a module that
 * only draws a mark does not have to know how a gesture reports itself, and a
 * module that only computes geometry does not import React.
 *
 * Nothing here runs: it is types only, so it costs nothing at the call sites that
 * need one of them.
 * @module dsh-figmark/client/canvas/types
 */

import type {
  MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, RefObject,
} from 'react'
import type { AnnotationMark, FigurePoint, MarkAnchor } from '../../shared/annotation'

/**
 * A pointer event on the surface, whichever element of it the press landed on.
 *
 * Handlers are bound to the overlay, its marks and their handles, so the event's
 * target varies; what the code reads — the client point, the surface it is measured
 * in, the modifiers — does not. Naming the generic as `Element` is what lets one
 * event type travel from a handle through the gesture layer without a cast.
 */
export type SurfaceEvent = ReactPointerEvent<Element>

/**
 * A click on the surface, which the browser reports as a mouse event.
 *
 * Kept apart from {@link SurfaceEvent} because the two are dispatched by different
 * machinery: a press carries a pointer id a click has never had, and the click is
 * the one that arrives *after* a gesture and has to be told it was not a press on
 * nothing.
 */
export type SurfaceClickEvent = ReactMouseEvent<Element>

/**
 * The part of any pointer or mouse event a coordinate read needs.
 *
 * Both kinds report the same three things, and the arithmetic that turns them into
 * figure pixels must not care which kind it was handed.
 */
export interface EventPoint {
  /** The element the handler is bound to, whose client box the point is in. */
  readonly currentTarget: EventTarget & Element
  /** Horizontal position, in client pixels. */
  readonly clientX: number
  /** Vertical position, in client pixels. */
  readonly clientY: number
}

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

/** Props of the drawing surface. */
export interface CanvasProps {
  /** Width of the paper, in figure pixels: the figure plus anywhere marks reach. */
  readonly width: number
  /** Height of the paper, in figure pixels. */
  readonly height: number
  /**
   * The figure's own size, which decides how thick one pen stroke is.
   *
   * The paper and the figure are two different sizes the moment a mark reaches past
   * the figure's edge: the paper has to grow to hold the mark, and the pen must not
   * grow with it. Sized from the paper, an 800×600 plot with one rectangle out at
   * x≈1980 got a pen 2.5× thicker than the same mark got in the exported picture —
   * the two disagreed about a number that is supposed to be one figure's. Omitted
   * means the paper *is* the figure, which is the case whenever no mark grew it.
   */
  readonly figureSize?: { readonly width: number; readonly height: number } | undefined
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
