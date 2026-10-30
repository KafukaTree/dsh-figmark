/**
 * The wire between a rendered page and the panel.
 *
 * A page in the frame is not a document the panel holds: even when the file is on
 * the reader's disk, the frame's own scripts have to run — a deck that animates, a
 * video that plays, a link that means something — and a frame allowed to run scripts
 * must not share the panel's origin. So the frame is opaque to the parent, and the
 * only way across is a small script injected into it and `postMessage` back.
 *
 * This module is that vocabulary, and it is also the fence around it: everything it
 * accepts is parsed field by field, because the other side is a page and a page can
 * lie. A lie must stay a name — never a coordinate the reader never pointed at.
 * @module dsh-figmark/shared/live
 */

/** Route the panel opens a live page through, under the plugin prefix. */
export const LIVE_ROUTE = '/live'

/** Marker every message either side sends carries. */
export const LIVE_MESSAGE = 'dsh-figmark:live'

/** What the panel asks the Host to open. */
export interface LiveOpenRequest {
  /** The address the reader typed, as typed. */
  readonly url: string
}

/** The address a live page can be framed from. */
export interface LiveOpenAnswer {
  /** Always true: failures use the plugin's usual failure body. */
  readonly ok: true
  /**
   * The frame's own address, on the proxy.
   *
   * It carries the reader's path and query, because a page mounted under one — a
   * docs site at `/guide/` — resolves its own relative references against the
   * address it was opened at. The panel never shows this address; the reader's own
   * is what the toolbar says.
   */
  readonly url: string
}

/**
 * One element the page reported, with everything a mark and its chip need.
 *
 * The box is in the page's own document pixels: the page adds its scroll, because
 * it is the only half that can read it. `class` is reported for the label the reader
 * sees (`div.relative`) and is never written into a mark — a saved mark is a
 * locator, and a locator that names a class stops resolving the moment a page
 * restyles itself.
 */
export interface LivePick {
  /** What happened to the pointer. */
  readonly kind: 'hover' | 'pick'
  /** Lowercased tag name of the element. */
  readonly tag: string
  /** The element's `id`, when it has one. */
  readonly id?: string | undefined
  /** The element's own class attribute, trimmed, when it has one. */
  readonly class?: string | undefined
  /** The element's own text, trimmed and shortened, when it has any. */
  readonly text?: string | undefined
  /** Path to the element from `body`, in the selector grammar a saved mark uses. */
  readonly selector: string
  /** The element's box in document pixels: x, y, width, height. */
  readonly bbox: readonly [number, number, number, number]
  /** How far the page is scrolled, in document pixels: x, y. */
  readonly scroll: readonly [number, number]
}

/** How far the page has scrolled, which is what the overlay is translated by. */
export interface LiveScroll {
  /** What the page is reporting. */
  readonly kind: 'scroll'
  /** The page's scroll offset in document pixels: x, y. */
  readonly scroll: readonly [number, number]
}

/**
 * The page saying it is up, and where it starts.
 *
 * A frame that is still loading cannot hear the arm message, so the panel waits for
 * this one and answers it: that is the only moment both halves are known to be
 * listening at once.
 */
export interface LiveReady {
  /** What the page is reporting. */
  readonly kind: 'ready'
  /** The page's scroll offset in document pixels: x, y. */
  readonly scroll: readonly [number, number]
}

/** The pointer leaving the page, which takes the name chip with it. */
export interface LiveLeave {
  /** What the page is reporting. */
  readonly kind: 'leave'
}

/** What a rendered page can tell the panel. */
export type LiveEvent = LivePick | LiveScroll | LiveReady | LiveLeave

/**
 * The message that arms or disarms the picker.
 *
 * Annotation is a mode, not a property of the page: while it is off the page has to
 * behave like the page it is — a click follows a link, a button does its work — and
 * only while it is on does the pointer belong to the panel.
 * @param armed - whether the reader is annotating.
 * @returns the message to post into the frame.
 */
export function liveModeMessage(armed: boolean): Record<string, unknown> {
  return { figmark: LIVE_MESSAGE, kind: 'mode', armed }
}

/**
 * Whether a value is a finite number.
 * @param value - value to test.
 * @returns true when it is a number that can be drawn from.
 */
function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

/**
 * Read a four-number box out of a message, or refuse it.
 * @param value - the value the message carried.
 * @returns the box, or undefined when it is not four finite numbers.
 */
function boxOf(value: unknown): readonly [number, number, number, number] | undefined {
  if (!Array.isArray(value) || value.length !== 4) return undefined
  const [x, y, width, height] = value as readonly unknown[]
  return isNumber(x) && isNumber(y) && isNumber(width) && isNumber(height)
    ? [x, y, width, height]
    : undefined
}

/**
 * Read a two-number offset out of a message, or refuse it.
 * @param value - the value the message carried.
 * @returns the offset, or undefined when it is not two finite numbers.
 */
function offsetOf(value: unknown): readonly [number, number] | undefined {
  if (!Array.isArray(value) || value.length !== 2) return undefined
  const [x, y] = value as readonly unknown[]
  return isNumber(x) && isNumber(y) ? [x, y] : undefined
}

/**
 * Read one string field, ignoring anything that is not a string.
 * @param value - the value the message carried.
 * @returns the string, or undefined.
 */
function textOf(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

/**
 * Parse a message from a rendered page.
 *
 * Anything that does not answer every question the panel asks is not a pick: a
 * missing box has no place to be drawn at, and a missing selector names no element
 * a reader could act on. Refusing the whole message rather than filling gaps is what
 * keeps a page from steering a mark somewhere the reader never pointed.
 * @param data - whatever arrived on the window's `message` event.
 * @returns the event, or undefined when the message is not one of ours.
 */
export function parseLiveEvent(data: unknown): LiveEvent | undefined {
  if (typeof data !== 'object' || data === null) return undefined
  const fields = data as Record<string, unknown>
  if (fields['figmark'] !== LIVE_MESSAGE) return undefined
  if (fields['kind'] === 'leave') return { kind: 'leave' }
  const scroll = offsetOf(fields['scroll'])
  if (scroll === undefined) return undefined
  if (fields['kind'] === 'scroll' || fields['kind'] === 'ready') {
    return { kind: fields['kind'], scroll }
  }
  const kind = fields['kind']
  if (kind !== 'hover' && kind !== 'pick') return undefined
  const tag = textOf(fields['tag'])
  const selector = textOf(fields['selector'])
  const bbox = boxOf(fields['bbox'])
  if (tag === undefined || selector === undefined || bbox === undefined) return undefined
  const id = textOf(fields['id'])
  const cls = textOf(fields['class'])
  const text = textOf(fields['text'])
  return {
    kind,
    tag,
    selector,
    bbox,
    scroll,
    ...(id === undefined ? {} : { id }),
    ...(cls === undefined ? {} : { class: cls }),
    ...(text === undefined ? {} : { text }),
  }
}
