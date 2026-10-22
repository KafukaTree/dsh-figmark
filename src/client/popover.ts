/**
 * Where a floating card goes, next to the thing it is about.
 *
 * The panel's subject is the figure, so the words about one mark belong beside
 * that mark rather than in a column underneath it: a reader editing a box wants
 * the box in sight. That means turning a mark's box into screen coordinates and
 * then choosing a corner that is both near it and inside the panel — arithmetic
 * worth keeping apart from the component, so it can be exercised without a layout
 * engine.
 * @module dsh-figmark/client/popover
 */

/** A box in the coordinates of whatever contains it. */
export interface PopoverBox {
  /** Left edge. */
  readonly x: number
  /** Top edge. */
  readonly y: number
  /** Width. */
  readonly width: number
  /** Height. */
  readonly height: number
}

/** How wide the detail card is, in CSS pixels. */
export const DETAIL_WIDTH = 252

/** How tall the detail card is, in CSS pixels. */
export const DETAIL_HEIGHT = 196

/** The least empty space a card keeps from the panel's edge. */
export const POPOVER_MARGIN = 8

/** The gap a card keeps from the mark it belongs to, so it never sits on it. */
export const POPOVER_GAP = 10

/** How wide the records that hang off the bar are, in CSS pixels. */
export const FLOAT_WIDTH = 330

/**
 * Put one figure-space box into the panel's own coordinates.
 *
 * The figure is drawn at a factor into a host box that may itself be scrolled, so
 * two things have to be undone: the scroll (both boxes are measured in client
 * coordinates, which already includes it) and the factor. Taking both boxes as
 * client rects and subtracting them is what makes this independent of the
 * scrollport's own arithmetic — the host rect moves with the scroll, and the
 * answer moves with it.
 * @param box - the mark's box, in figure pixels.
 * @param host - the figure's host box, in client coordinates.
 * @param panel - the panel's box, in client coordinates.
 * @param figureWidth - the figure's intrinsic width, in figure pixels.
 * @returns the same box, in the panel's coordinates.
 */
export function scaledBox(
  box: PopoverBox,
  host: PopoverBox,
  panel: PopoverBox,
  figureWidth: number,
): PopoverBox {
  // A collapsed panel reports nothing to divide by; 1:1 keeps the arithmetic
  // finite, and nothing is drawn while it is collapsed anyway.
  const factor = figureWidth > 0 && host.width > 0 ? host.width / figureWidth : 1
  return {
    x: host.x - panel.x + box.x * factor,
    y: host.y - panel.y + box.y * factor,
    width: box.width * factor,
    height: box.height * factor,
  }
}

/**
 * The nearest corner to an anchor that still fits inside the panel.
 *
 * Below the anchor is preferred: the card then reads as a caption of the mark.
 * When there is no room below, it goes above — a card half off the bottom of the
 * panel is a card whose buttons cannot be pressed. Sideways it lines up with the
 * anchor and is then pushed back inside, so a mark at the right edge still gets a
 * whole card.
 * @param anchor - the mark's box, in the panel's coordinates.
 * @param panelWidth - the panel's width, in CSS pixels.
 * @param panelHeight - the panel's height, in CSS pixels.
 * @param size - the card's size, in CSS pixels.
 * @returns the card's top-left corner, in the panel's coordinates.
 */
export function placeCard(
  anchor: PopoverBox,
  panelWidth: number,
  panelHeight: number,
  size: { readonly width: number; readonly height: number } = { width: DETAIL_WIDTH, height: DETAIL_HEIGHT },
): { readonly left: number; readonly top: number } {
  const below = anchor.y + anchor.height + POPOVER_GAP
  const above = anchor.y - size.height - POPOVER_GAP
  // Below when it fits, else above when that fits, else pinned to the top edge: a
  // mark taller than the panel leaves no room either way, and a clamped card is
  // still usable where an off-screen one is not.
  const top = below + size.height <= panelHeight - POPOVER_MARGIN
    ? below
    : Math.max(POPOVER_MARGIN, above)
  const widest = Math.max(POPOVER_MARGIN, panelWidth - size.width - POPOVER_MARGIN)
  return {
    left: Math.min(Math.max(POPOVER_MARGIN, anchor.x), widest),
    top,
  }
}

/** Where a record sits relative to the panel: a left edge plus one vertical side. */
export interface RecordPlacement {
  /** Left edge, in the panel's coordinates. */
  readonly left: number
  /** Distance down from the panel's top, when the record opens downwards. */
  readonly top?: number | undefined
  /** Distance up from the panel's bottom, when the record opens upwards. */
  readonly bottom?: number | undefined
}

/** The room a record wants above the bar before it is sent below it instead. */
export const RECORD_ROOM = 180

/**
 * Where a record that belongs to the bar goes: beside it, centred on it.
 *
 * The bar is a thing the reader can drag, so a record pinned to the panel's bottom
 * edge would end up somewhere the bar no longer is; anchoring to the bar's own box
 * keeps the pair together wherever it is parked.
 *
 * Above the bar while there is room for a record there, otherwise below it. Dragging
 * the bar to the top of the pane is a legitimate thing to do — it is how the bottom
 * of a tall figure is reached — and a record that opened off the top of the panel
 * would be a record that cannot be read. Above is the default because it is where
 * the bar sits on its own, and a fold that opens away from the edge it lives on
 * covers the figure instead of the toolbar.
 *
 * Above is expressed as a distance up from the panel's bottom rather than a top
 * offset, because there the record needs no height known in advance. Below is a top
 * offset for the same reason: it grows downward from the bar's edge.
 * @param bar - the bar's box, in the panel's coordinates.
 * @param panel - the panel's box, in the panel's coordinates.
 * @param width - how wide the record wants to be, in CSS pixels.
 * @returns the record's left edge and either its distance up from the panel's bottom
 *   or its distance down from its top.
 */
export function placeAboveBar(
  bar: PopoverBox,
  panel: PopoverBox,
  width: number = FLOAT_WIDTH,
): { readonly left: number; readonly top?: number; readonly bottom?: number } {
  const usable = Math.max(0, panel.width - 2 * POPOVER_MARGIN)
  const widest = Math.min(width, usable)
  const centred = bar.x - panel.x + (bar.width - widest) / 2
  const rightmost = Math.max(POPOVER_MARGIN, panel.width - widest - POPOVER_MARGIN)
  const left = Math.min(Math.max(POPOVER_MARGIN, centred), rightmost)
  const top = bar.y - panel.y
  const above = top - POPOVER_GAP - POPOVER_MARGIN
  // A record does not know its own height until it is laid out, so the decision is
  // made on the room it is expected to need. Guessed short, so a record that is
  // taller than expected still opens off a bar near the top rather than out of sight.
  if (above >= RECORD_ROOM) {
    return { left, bottom: Math.max(POPOVER_MARGIN, panel.height - top + POPOVER_GAP) }
  }
  return { left, top: Math.max(POPOVER_MARGIN, top + bar.height + POPOVER_GAP) }
}
