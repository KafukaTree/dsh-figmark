/**
 * Where the things that float over the figure are put.
 *
 * A strip, a record and a card are all positioned by inline style rather than by the
 * stylesheet, because each of them is placed from a measurement taken at runtime —
 * the panel's width, the bar's own laid-out box, the mark's box under the current
 * zoom. Keeping the arithmetic in one module is what stops the palette and the bar
 * from each keeping their own copy of the edge-flipping rule and drifting apart.
 * @module dsh-figmark/client/annotator/placement
 */
import type { CSSProperties } from 'react'
import type { PaletteSpot } from '../preferences'
import type { RecordPlacement } from '../popover'

/** A strip's press in progress: where on screen it began, and from where. */
export interface StripPress {
  /** The pointer whose press this is. */
  readonly pointerId: number
  /** The strip's spot when the press began, as fractions of the panel. */
  readonly origin: PaletteSpot
  /** Where on screen the press began. */
  readonly box: { readonly left: number; readonly top: number }
}

/** A box on screen, as the placement arithmetic needs it. */
export interface ScreenBox {
  /** The box's left edge, in client coordinates. */
  readonly left: number
  /** The box's top edge, in client coordinates. */
  readonly top: number
  /** The box's width, in pixels. */
  readonly width: number
  /** The box's height, in pixels. */
  readonly height: number
}

/**
 * Where a strip ends up when the pointer dragging it is at a client coordinate.
 *
 * The origin is the strip's position when the press started and the offset is
 * measured against the panel rather than the strip, because moving the strip must
 * not move the frame the next position is measured in.
 *
 * The clamp is the part that makes a fraction mean what it looks like — and it has to
 * follow the side the strip hangs from. Before the middle the strip hangs down and to
 * the right of its point, so the usable range is what is left of the pane once its own
 * body is taken out of it. Past the middle it hangs up and to the left instead, so its
 * body is behind the point and the only thing left to keep it off is the far edge.
 * Clamping both halves by the body's own size was what stopped a strip parked on the
 * right a whole strip-width short of it — "this is as far as it goes", at 40px from an
 * edge it looked like it should touch.
 * @param press - the press being followed.
 * @param pointer - where the pointer is now, in client coordinates.
 * @param panel - the box the fractions are of, in client coordinates.
 * @param strip - the strip's own size, in pixels.
 * @returns the spot to place it at.
 */
export function draggedSpot(
  press: StripPress,
  pointer: { readonly clientX: number; readonly clientY: number },
  panel: ScreenBox,
  strip: { readonly width: number; readonly height: number },
): PaletteSpot {
  const width = Math.max(1, panel.width)
  const height = Math.max(1, panel.height)
  const x = press.origin.x + (pointer.clientX - press.box.left) / width
  const y = press.origin.y + (pointer.clientY - press.box.top) / height
  // Across the middle the strip hangs from its far corner, so it only has to stop
  // short of that edge; before it, its whole body has to fit inside the pane.
  const roomX = Math.max(0, panel.width - strip.width) / width
  const roomY = Math.max(0, panel.height - strip.height) / height
  const farX = Math.max(0, 1 - STRIP_EDGE / width)
  const farY = Math.max(0, 1 - STRIP_EDGE / height)
  return {
    x: Math.min(x >= 0.5 ? farX : roomX, Math.max(0, x)),
    y: Math.min(y >= 0.5 ? farY : roomY, Math.max(0, y)),
  }
}

/**
 * Where a strip sits before the reader moves it: top left, out of the way of the
 * figure's own middle and of the bar along the bottom.
 */
export const DEFAULT_PALETTE: PaletteSpot = { x: 0.02, y: 0.04 }

/**
 * The gap a strip keeps from the panel edge it could otherwise run into.
 *
 * A strip is placed from a fraction of the panel and then hangs from that point, so on
 * a short panel the far end of a tall strip reaches past the edge — and the panel clips
 * it, because the strips are absolutely positioned outside the one child that scrolls.
 * Eight pixels is the least that keeps the edge from looking like a cut.
 */
const STRIP_EDGE = 8

/**
 * A strip's box, in percentages of the panel.
 *
 * Percentages rather than pixels so the parking spot survives a resize: a reader
 * who narrows the pane keeps the strip where it was in the picture, not off the
 * edge of the panel. The transform flips the strip's own box when it sits past the
 * middle, so its far corner stays on the panel instead of hanging outside it.
 * The height is bounded too, because the fraction only says where the strip starts.
 * A palette of seven tools is taller than a panel dragged to two hundred pixels, and
 * an unbounded strip would hang its last tools past the clipped edge where no scroll
 * reaches them: the `element` tool could not be armed at all. The bound is the room
 * left on the side the strip grows towards — down from its top edge, or up from its
 * bottom when the transform has flipped it — so the strip on screen is always the
 * whole strip.
 * @param spot - where the strip was parked, as fractions of the panel.
 * @returns the inline style that puts it there.
 */
export function placementStyle(spot: PaletteSpot): CSSProperties {
  const flipped = spot.y >= 0.5
  const room = flipped ? spot.y : 1 - spot.y
  return {
    left: `${spot.x * 100}%`,
    top: `${spot.y * 100}%`,
    maxHeight: `calc(${room * 100}% - ${STRIP_EDGE}px)`,
    transform: `translate(${spot.x >= 0.5 ? '-100%' : '0'}, ${flipped ? '-100%' : '0'})`,
  }
}

/**
 * A record's inline placement, from whatever has been measured so far.
 *
 * Both sides are always written: one with a real offset and one `auto`. A card
 * that grows downwards must not also be pinned by its bottom edge, or with no
 * height of its own it stretches to fill the space between them. Before the
 * measurement lands there is no offset at all — the card is briefly at the
 * panel's corner, which is off the figure and gone before it can be seen.
 * @param at - the placement measured against the bar, or null before one exists.
 * @returns the inline style for that placement.
 */
export function recordStyle(at: RecordPlacement | null): CSSProperties {
  return {
    left: at?.left,
    top: at?.top ?? 'auto',
    bottom: at?.bottom ?? 'auto',
  }
}
