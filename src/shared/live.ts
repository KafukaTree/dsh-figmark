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

/**
 * Largest PNG data URL a live page may send back.
 *
 * The message is held by both browsing contexts while it crosses the frame
 * boundary. Failing below the parser's hard ceiling leaves room for the rest of
 * the object instead of sending an answer the receiving side would discard.
 */
export const MAX_LIVE_CAPTURE_DATA_URL = 15_500_000

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
  /**
   * Logical surface that owns the picked element, or null when it belongs to none.
   *
   * A deck can put a cover or modal outside every slide. Such an element is visible
   * over the deck, but it is not part of the slide underneath it; recording the
   * slide that happened to be open would make the mark follow every later page.
   */
  readonly surface?: string | null | undefined
  /** The element's box in document pixels: x, y, width, height. */
  readonly bbox: readonly [number, number, number, number]
  /** How far the page is scrolled, in document pixels: x, y. */
  readonly scroll: readonly [number, number]
  /** One-based depth of the chosen element in its ancestor ladder. */
  readonly level?: number | undefined
  /** Number of levels in that ladder. */
  readonly count?: number | undefined
}

/** The logical page in front of a multi-surface HTML document. */
export interface LiveSurface {
  /** What the page is reporting. */
  readonly kind: 'surface'
  /** Selector for the visible slide, or null for an ordinary scrolling page. */
  readonly selector: string | null
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

/** The reader asked the panel to dismiss the current interaction with Escape. */
export interface LiveCancel {
  /** What the page is reporting. */
  readonly kind: 'cancel'
}

/** Where one watched element is now. */
export interface LiveBound {
  /** The positional locator the mark stores. */
  readonly selector: string
  /** The element's current box in document pixels: x, y, width, height. */
  readonly bbox: readonly [number, number, number, number]
  /** Whether the page is currently showing the element. */
  readonly visible: boolean
}

/** The current boxes of every element the panel asked the page to watch. */
export interface LiveBounds {
  /** What the page is reporting. */
  readonly kind: 'bounds'
  /** One entry per locator, in the order the panel sent them. */
  readonly bounds: readonly LiveBound[]
}

/** How a request to bring a saved mark into view ended. */
export type LiveRevealStatus = 'revealed' | 'missing' | 'hidden' | 'wrong-surface'

/** The page saying whether one saved mark could be brought into view. */
export interface LiveRevealResult {
  /** What the page is reporting. */
  readonly kind: 'reveal-result'
  /** The panel's opaque request token. */
  readonly requestId: string
  /** Whether the element or point is now visible. */
  readonly status: LiveRevealStatus
  /** The logical surface the page settled on, or null when there is none. */
  readonly surface?: string | null
  /** Whether visibility required a temporary style override that the page will undo. */
  readonly temporary?: boolean
}

/** One full-document screenshot, ready for the panel to crop and mark. */
export interface LiveCaptureSucceeded {
  /** What the page is reporting. */
  readonly kind: 'capture-result'
  /** The panel's opaque request token. */
  readonly requestId: string
  /** The page is present and the screenshot is usable. */
  readonly status: 'ok'
  /** PNG bytes as a data URL. */
  readonly dataUrl: string
  /** The document's laid-out size, in CSS pixels. */
  readonly document: readonly [number, number]
  /** The document rectangle covered by the PNG. */
  readonly imageRect: readonly [number, number, number, number]
  /** The frame's visible viewport, in CSS pixels. */
  readonly viewport: readonly [number, number]
  /** The frame's scroll offset when the picture was taken. */
  readonly scroll: readonly [number, number]
  /** The raster scale used for the PNG. */
  readonly scale: number
  /** The logical surface in front when the picture was taken. */
  readonly surface: string | null
  /** The live boxes of every watched element at capture time. */
  readonly bounds: readonly LiveBound[]
}

/** The page saying that it could not make a screenshot. */
export interface LiveCaptureFailed {
  /** What the page is reporting. */
  readonly kind: 'capture-result'
  /** The panel's opaque request token. */
  readonly requestId: string
  /** The page is present, but there is no picture. */
  readonly status: 'failed'
  /** A short diagnostic, when the page supplied one. */
  readonly reason?: string
}

/** How one request to screenshot a live page ended. */
export type LiveCaptureResult = LiveCaptureSucceeded | LiveCaptureFailed

/** What a rendered page can tell the panel. */
export type LiveEvent =
  | LivePick
  | LiveScroll
  | LiveReady
  | LiveLeave
  | LiveCancel
  | LiveBounds
  | LiveSurface
  | LiveRevealResult
  | LiveCaptureResult

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
 * Ask the page to keep measuring the elements saved marks name.
 * @param selectors - unique selectors from the current annotation.
 * @returns the message for the frame.
 */
export function liveWatchMessage(selectors: readonly string[]): Record<string, unknown> {
  return { figmark: LIVE_MESSAGE, kind: 'watch', selectors }
}

/**
 * Ask the picker to move one rung up or down its current element ladder.
 *
 * The palette lives in the parent window while the ladder lives in the framed page,
 * so keyboard focus can remain on the tool button and still drive the picker.
 * @param delta - positive for the containing element, negative for the exact one.
 * @returns the message for the frame.
 */
export function liveDepthMessage(delta: -1 | 1): Record<string, unknown> {
  return { figmark: LIVE_MESSAGE, kind: 'depth', delta }
}

/**
 * Ask the page to bring one saved mark into view.
 * @param requestId - token the page echoes in its answer.
 * @param selector - element locator, or null for a geometric mark.
 * @param surface - logical slide that owns the mark, when it has one.
 * @param bbox - the mark's saved box, used when there is no element locator.
 * @returns the message for the frame.
 */
export function liveRevealMessage(
  requestId: string,
  selector: string | null,
  surface: string | null,
  bbox: readonly [number, number, number, number],
): Record<string, unknown> {
  return { figmark: LIVE_MESSAGE, kind: 'reveal', requestId, selector, surface, bbox }
}

/**
 * Ask the page to undo any temporary hidden-layer reveal.
 *
 * Revealing a cover or modal changes only computed style while the reader is looking
 * at the mark. Closing that mark must leave the page in the state its own code chose.
 * @returns the message for the frame.
 */
export function liveReleaseMessage(): Record<string, unknown> {
  return { figmark: LIVE_MESSAGE, kind: 'release-reveal' }
}

/**
 * Ask the page for its current document as a PNG.
 * @param requestId - token the page echoes in its answer.
 * @returns the message for the frame.
 */
export function liveCaptureMessage(requestId: string): Record<string, unknown> {
  return { figmark: LIVE_MESSAGE, kind: 'capture', requestId }
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
 * Read a positive width and height pair.
 * @param value - the message field.
 * @returns the pair, or undefined when either side is unusable.
 */
function sizeOf(value: unknown): readonly [number, number] | undefined {
  const pair = offsetOf(value)
  if (pair === undefined) return undefined
  const [width, height] = pair
  return width > 0 && height > 0 && width <= 100_000 && height <= 100_000
    ? pair
    : undefined
}

/**
 * Read a finite rectangle out of a message.
 * @param value - the message field.
 * @returns x, y, width and height, or undefined when any part is unusable.
 */
function rectOf(value: unknown): readonly [number, number, number, number] | undefined {
  if (!Array.isArray(value) || value.length !== 4) return undefined
  const [x, y, width, height] = value as readonly unknown[]
  if (!isNumber(x) || !isNumber(y) || !isNumber(width) || !isNumber(height)
    || Math.abs(x) > 100_000 || Math.abs(y) > 100_000
    || width <= 0 || height <= 0 || width > 100_000 || height > 100_000) {
    return undefined
  }
  return [x, y, width, height]
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
  if (fields['kind'] === 'cancel') return { kind: 'cancel' }
  if (fields['kind'] === 'capture-result') {
    const requestId = textOf(fields['requestId'])
    if (requestId === undefined || requestId.length > 128) return undefined
    if (fields['status'] === 'failed') {
      const reason = textOf(fields['reason'])
      return {
        kind: 'capture-result',
        requestId,
        status: 'failed',
        ...(reason === undefined || reason.length > 300 ? {} : { reason }),
      }
    }
    if (fields['status'] !== 'ok') return undefined
    const dataUrl = fields['dataUrl']
    const document = sizeOf(fields['document'])
    const imageRect = fields['imageRect'] === undefined
      ? (document === undefined ? undefined : [0, 0, document[0], document[1]] as const)
      : rectOf(fields['imageRect'])
    const viewport = sizeOf(fields['viewport'])
    const scroll = offsetOf(fields['scroll'])
    const scale = fields['scale']
    const surface = fields['surface'] === null ? null : textOf(fields['surface'])
    const bounds = boundsOf(fields['bounds'])
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/png;base64,')
      || dataUrl.length > MAX_LIVE_CAPTURE_DATA_URL
      || document === undefined || imageRect === undefined
      || viewport === undefined || scroll === undefined
      || typeof scale !== 'number' || !Number.isFinite(scale) || scale <= 0 || scale > 4
      || surface === undefined || (surface !== null && surface.length > 2048)
      || bounds === undefined) {
      return undefined
    }
    return {
      kind: 'capture-result',
      requestId,
      status: 'ok',
      dataUrl,
      document,
      imageRect,
      viewport,
      scroll,
      scale,
      surface,
      bounds,
    }
  }
  if (fields['kind'] === 'reveal-result') {
    const requestId = textOf(fields['requestId'])
    const status = fields['status']
    if (requestId === undefined || requestId.length > 128) return undefined
    if (status !== 'revealed' && status !== 'missing' && status !== 'hidden' && status !== 'wrong-surface') {
      return undefined
    }
    const surface = fields['surface'] === null ? null : textOf(fields['surface'])
    if (fields['surface'] !== undefined && (surface === undefined || (surface?.length ?? 0) > 2048)) {
      return undefined
    }
    return {
      kind: 'reveal-result',
      requestId,
      status,
      ...(surface === undefined ? {} : { surface }),
      ...(fields['temporary'] === true ? { temporary: true } : {}),
    }
  }
  if (fields['kind'] === 'surface') {
    if (fields['selector'] === null) return { kind: 'surface', selector: null }
    const selector = textOf(fields['selector'])
    return selector === undefined || selector.length > 2048
      ? undefined
      : { kind: 'surface', selector }
  }
  if (fields['kind'] === 'bounds') {
    const bounds = boundsOf(fields['bounds'])
    return bounds === undefined ? undefined : { kind: 'bounds', bounds }
  }
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
  const surface = fields['surface'] === null ? null : textOf(fields['surface'])
  if (fields['surface'] !== undefined && (surface === undefined || (surface?.length ?? 0) > 2048)) {
    return undefined
  }
  const depth = depthOf(fields['level'], fields['count'])
  return {
    kind,
    tag,
    selector,
    bbox,
    scroll,
    ...(id === undefined ? {} : { id }),
    ...(cls === undefined ? {} : { class: cls }),
    ...(text === undefined ? {} : { text }),
    ...(surface === undefined ? {} : { surface }),
    ...(depth === undefined ? {} : depth),
  }
}

/**
 * Read two fields as a usable one-based element depth.
 * @param level - reported depth.
 * @param count - reported ladder length.
 * @returns the normalized pair, or undefined when either field is unusable.
 */
function depthOf(
  level: unknown,
  count: unknown,
): { readonly level: number; readonly count: number } | undefined {
  return typeof level === 'number' && typeof count === 'number'
    && Number.isInteger(level) && Number.isInteger(count)
    && level >= 1 && count >= level && count <= 512
    ? { level, count }
    : undefined
}

/**
 * Read and cap the watched boxes a page sent.
 * @param value - the message field.
 * @returns the boxes, or undefined when any entry is malformed.
 */
function boundsOf(value: unknown): readonly LiveBound[] | undefined {
  if (!Array.isArray(value) || value.length > 256) return undefined
  const answer: LiveBound[] = []
  for (const item of value) {
    if (typeof item !== 'object' || item === null) return undefined
    const fields = item as Record<string, unknown>
    const selector = textOf(fields['selector'])
    const bbox = boxOf(fields['bbox'])
    const visible = fields['visible']
    if (selector === undefined || selector.length > 2048 || bbox === undefined || typeof visible !== 'boolean') {
      return undefined
    }
    answer.push({ selector, bbox, visible })
  }
  return answer
}
