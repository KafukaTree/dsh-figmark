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
  /** The strip's top-left spot when the press began, as fractions of the panel. */
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
 * Whether two boxes touch or cross, with a little breathing room between them.
 *
 * Used after a resize, when a bar parked against one layout can land on the figure
 * in another. Zero-sized boxes are not an overlap: a panel that has not been measured
 * must not look like one whose contents are on top of each other.
 * @param a - one box, in client coordinates.
 * @param b - the other box, in client coordinates.
 * @param gap - the space the two must keep, in pixels.
 * @returns true when they are closer than the gap.
 */
export function boxesOverlap(a: ScreenBox, b: ScreenBox, gap = 0): boolean {
  if (a.width <= 0 || a.height <= 0 || b.width <= 0 || b.height <= 0) return false
  return a.left < b.left + b.width + gap
    && a.left + a.width + gap > b.left
    && a.top < b.top + b.height + gap
    && a.top + a.height + gap > b.top
}

/**
 * Where a strip ends up when the pointer dragging it is at a client coordinate.
 *
 * The origin is the strip's position when the press started and the offset is
 * measured against the panel rather than the strip, because moving the strip must
 * not move the frame the next position is measured in.
 *
 * The clamp keeps the strip's top-left and its whole body inside the same gutter at
 * every position. An earlier model flipped the strip's anchor at the panel midpoint;
 * the stored fraction stayed continuous there, but the control itself jumped by its
 * own width or height.
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
  // The strip follows the hand one-for-one until a real boundary gets in the way.
  // An earlier version also applied a magnetic field on every move; the control
  // accelerated under the pointer and then peeled off, which read as "running away".
  // Edge gravity belongs to release (`settledSpot`), not to direct manipulation.
  //
  // Collision with the other strip is resolved only after release. Sliding around it
  // during the drag made the grabbed object leave the hand, and "strictly follows the
  // pointer" and "never crosses the other strip" cannot both hold for a swept path.
  // The invariant is therefore about rest states: the strip may pass over its sibling
  // while held, but `settledSpot` guarantees they are separate when the hand lets go.
  return clampedSpot({ x, y }, panel, strip)
}

/**
 * Finish a drag with a short, predictable magnetic dock.
 *
 * The drag itself stays under the pointer: snapping every move makes a control feel
 * as if it is fighting the hand. On release, however, a strip within one thumb-width
 * of an edge settles into the same eight-pixel gutter used by clamping. Corners are
 * allowed because both axes are considered, which is what makes parking a control
 * feel like it belongs to the panel rather than merely being unable to leave it.
 * @param spot - the strip's top-left when the pointer was released.
 * @param panel - the panel the fraction is of.
 * @param strip - the strip's measured size.
 * @param obstacle - the other floating strip, when there is one.
 * @returns the spot to persist after the pointer is gone.
 */
export function settledSpot(
  spot: PaletteSpot,
  panel: ScreenBox,
  strip: { readonly width: number; readonly height: number },
  obstacle?: ScreenBox,
): PaletteSpot {
  const desired = clampedSpot(spot, panel, strip)
  const own = boxAt(desired, panel, strip)
  const width = Math.max(1, panel.width)
  const height = Math.max(1, panel.height)
  const minX = Math.min(STRIP_EDGE, panel.width / 2) / width
  const minY = Math.min(STRIP_EDGE, panel.height / 2) / height
  const roomX = Math.max(minX, (panel.width - strip.width - STRIP_EDGE) / width)
  const roomY = Math.max(minY, (panel.height - strip.height - STRIP_EDGE) / height)
  const left = own.left - panel.left
  const right = panel.left + panel.width - own.left - own.width
  const top = own.top - panel.top
  const bottom = panel.top + panel.height - own.top - own.height

  let settled = desired
  const nearestX = left <= right
    ? { distance: left, spot: { ...settled, x: minX } }
    : { distance: right, spot: { ...settled, x: roomX } }
  if (nearestX.distance <= STRIP_MAGNET && !overlapsObstacle(
    boxAt(nearestX.spot, panel, strip),
    obstacle,
  )) settled = nearestX.spot

  const nearestY = top <= bottom
    ? { distance: top, spot: { ...settled, y: minY } }
    : { distance: bottom, spot: { ...settled, y: roomY } }
  if (nearestY.distance <= STRIP_MAGNET && !overlapsObstacle(
    boxAt(nearestY.spot, panel, strip),
    obstacle,
  )) settled = nearestY.spot

  return avoidObstacle(settled, panel, strip, obstacle)
}

/**
 * Keep a parked strip in the pane without covering another strip.
 *
 * Resize repair is not a gesture: the reader is not asking the strip to move, so it
 * must keep its chosen fraction unless the new panel or the other strip makes that
 * impossible. In the latter case the nearest collision-free side wins. `undefined`
 * means the panel is too small to separate them, and the caller may fall back to its
 * canonical safe position.
 * @param spot - the fraction the reader chose.
 * @param panel - the panel the fraction is of.
 * @param strip - the strip's measured size.
 * @param obstacle - the other floating strip.
 * @returns the nearest usable spot, or undefined when they cannot be separated.
 */
export function separatedSpot(
  spot: PaletteSpot,
  panel: ScreenBox,
  strip: { readonly width: number; readonly height: number },
  obstacle: ScreenBox,
): PaletteSpot | undefined {
  // A resize is not a swept gesture. Passing the old spot as `previous` made a
  // layout change look like a pointer crossing the other strip and could send the
  // bar to a far edge, or declare a solvable overlap unsolvable. Repair the body
  // clamp first, then resolve only the overlap that actually exists now.
  const fitted = avoidObstacle(clampedSpot(spot, panel, strip), panel, strip, obstacle)
  return overlapsObstacle(boxAt(fitted, panel, strip), obstacle) ? undefined : fitted
}

/** Whether a measured box is within the strip-to-strip breathing room. */
function overlapsObstacle(box: ScreenBox, obstacle: ScreenBox | undefined): boolean {
  return obstacle !== undefined && boxesOverlap(box, obstacle, STRIP_EDGE)
}

/**
 * Resolve a collision by the shortest edge slide that leaves the required gap.
 *
 * At rest, the moving control does not pass underneath the parked one. Four escape
 * directions are tried and the nearest one that remains inside the panel wins. This
 * is deliberately applied only after release: resolving it during a drag would pull
 * the strip away from the pointer.
 */
function avoidObstacle(
  desired: PaletteSpot,
  panel: ScreenBox,
  strip: { readonly width: number; readonly height: number },
  obstacle: ScreenBox | undefined,
): PaletteSpot {
  if (obstacle === undefined) return desired
  const desiredBox = boxAt(desired, panel, strip)
  if (!overlapsObstacle(desiredBox, obstacle)) return desired
  const width = Math.max(1, panel.width)
  const height = Math.max(1, panel.height)
  const minX = Math.min(STRIP_EDGE, panel.width / 2) / width
  const minY = Math.min(STRIP_EDGE, panel.height / 2) / height
  const roomX = Math.max(minX, (panel.width - strip.width - STRIP_EDGE) / width)
  const roomY = Math.max(minY, (panel.height - strip.height - STRIP_EDGE) / height)
  const side = collisionSide(desiredBox, obstacle)
  const candidate = {
    x: side === 'left'
      ? (obstacle.left - strip.width - STRIP_EDGE - panel.left) / width
      : side === 'right'
        ? (obstacle.left + obstacle.width + STRIP_EDGE - panel.left) / width
        : desired.x,
    y: side === 'top'
      ? (obstacle.top - strip.height - STRIP_EDGE - panel.top) / height
      : side === 'bottom'
        ? (obstacle.top + obstacle.height + STRIP_EDGE - panel.top) / height
        : desired.y,
  }
  const fitted = {
    x: Math.min(Math.max(minX, candidate.x), Math.max(minX, roomX)),
    y: Math.min(Math.max(minY, candidate.y), Math.max(minY, roomY)),
  }
  // In a panel too small to separate both strips there is no collision-free answer.
  // Keep following the hand rather than freezing a control the reader cannot recover.
  return overlapsObstacle(boxAt(fitted, panel, strip), obstacle)
    ? clampedSpot(desired, panel, strip)
    : fitted
}

/**
 * Which face of the obstacle is the shortest way out.
 */
function collisionSide(
  desired: ScreenBox,
  obstacle: ScreenBox,
): 'left' | 'right' | 'top' | 'bottom' {
  const escapes = {
    left: desired.left + desired.width + STRIP_EDGE - obstacle.left,
    right: obstacle.left + obstacle.width + STRIP_EDGE - desired.left,
    top: desired.top + desired.height + STRIP_EDGE - obstacle.top,
    bottom: obstacle.top + obstacle.height + STRIP_EDGE - desired.top,
  } as const
  return (['left', 'right', 'top', 'bottom'] as const)
    .reduce((best, side) => escapes[side] < escapes[best] ? side : best, 'left')
}

/**
 * Keep a strip's top-left, plus its whole body, inside the panel.
 *
 * Both a drag and a resize come through here. A fraction alone cannot promise that
 * the right or bottom of a wide strip is visible, so this is also the repair for a
 * spot remembered against a larger pane.
 * @param spot - the desired top-left fraction.
 * @param panel - the panel the fraction is of.
 * @param strip - the strip's measured size.
 * @returns a top-left fraction whose box keeps the edge gutter.
 */
export function clampedSpot(
  spot: PaletteSpot,
  panel: ScreenBox,
  strip: { readonly width: number; readonly height: number },
): PaletteSpot {
  const width = Math.max(1, panel.width)
  const height = Math.max(1, panel.height)
  const minX = Math.min(STRIP_EDGE, panel.width / 2) / width
  const minY = Math.min(STRIP_EDGE, panel.height / 2) / height
  const roomX = Math.max(minX, (panel.width - strip.width - STRIP_EDGE) / width)
  const roomY = Math.max(minY, (panel.height - strip.height - STRIP_EDGE) / height)
  return {
    x: Math.min(roomX, Math.max(minX, spot.x)),
    y: Math.min(roomY, Math.max(minY, spot.y)),
  }
}

/** A candidate spot as the screen box collision checks need. */
function boxAt(
  spot: PaletteSpot,
  panel: ScreenBox,
  strip: { readonly width: number; readonly height: number },
): ScreenBox {
  return {
    left: panel.left + spot.x * panel.width,
    top: panel.top + spot.y * panel.height,
    width: strip.width,
    height: strip.height,
  }
}

/**
 * Where a strip already is, as the fraction {@link placementStyle} takes.
 *
 * A strip that has not been parked yet is placed by the stylesheet rather than by a
 * spot — the bar is anchored to the bottom edge and centred — so the only honest
 * origin for its first drag is its own box. Reading it also means a drag always
 * continues from where the reader sees the strip, instead of from whichever corner
 * the default belonged to.
 *
 * The spot is always the strip's top-left corner. An anchor that changed sides at
 * the panel's midlines made one pointer step jump the strip by its own width or
 * height: the position was continuous in the stored number but not on screen.
 * @param box - the strip's current box, in client coordinates.
 * @param panel - the box its fractions are of, in client coordinates.
 * @returns the spot its near or far corner sits at.
 */
export function spotOfBox(box: ScreenBox, panel: ScreenBox): PaletteSpot {
  const width = Math.max(1, panel.width)
  const height = Math.max(1, panel.height)
  return {
    x: (box.left - panel.left) / width,
    y: (box.top - panel.top) / height,
  }
}

/**
 * Where a strip sits before the reader moves it: the top left corner.
 *
 * This is the reader's learned place — the README calls it the left floating strip —
 * and it stays that way. The bubble stack is what moved to the free corner (see the
 * `.da-toasts` rule): it is transient, and a few seconds of news should not be the
 * reason every reader has to relearn where the tools are.
 *
 * The weight rail still runs down the left edge, so on a pane under about 800 pixels
 * tall the palette's lower half sits over the rail's upper half. That is the one
 * crossing left; moving either of them would cost more than it buys, and the palette
 * can be dragged clear.
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
 * How close a released strip has to be before it settles into an edge gutter.
 *
 * Twenty-four CSS pixels is roughly one comfortable touch target. It is measured
 * from the visible body, not from the stored fraction, so a very wide bar behaves
 * the same as the narrow vertical palette.
 */
const STRIP_MAGNET = 24

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
  const room = 1 - spot.y
  return {
    left: `${spot.x * 100}%`,
    top: `${spot.y * 100}%`,
    maxHeight: `max(0px, calc(${room * 100}% - ${STRIP_EDGE}px))`,
    transform: 'none',
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
