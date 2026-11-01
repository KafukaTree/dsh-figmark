/**
 * Opening a page that is not a file.
 *
 * A page served by a dev server cannot be read as bytes: what the reader wants to
 * annotate is what the browser would show, after the server's own routing and after
 * the page's own scripts. So the panel asks the Host to stand in front of that
 * server, and frames the address it answers with.
 *
 * The typed address is the reader's, not the proxy's. `localhost:5173` is what a
 * person types, and the browser's own rule is what turns it into a URL — this module
 * only adds the scheme a person does not bother to type, and lets everything else
 * that is nonsense arrive at the Host as a readable refusal.
 * @module dsh-figmark/client/live-page
 */
import { GUARD_HEADER, ROUTE_PREFIX } from '../shared/http'
import { LIVE_ROUTE, type LiveBound, type LivePick } from '../shared/live'
import {
  SERVICE_DISCOVER_ROUTE,
  type ServiceDiscoverAnswer,
  type ServiceSummary,
} from '../shared/services'
import type { AnnotationMark, FigurePoint, MarkAnchor } from '../shared/annotation'
import { AnnotatorHostError } from './host-api'

/** One page the panel is showing through the proxy. */
export interface LivePage {
  /** The address as the reader asked for it, which is what a delivered message names. */
  readonly address: string
  /** The address the frame is pointed at: the proxy, plus the reader's own path. */
  readonly url: string
}

/** The route one live operation is sent to. */
const LIVE_URL = `${ROUTE_PREFIX}${LIVE_ROUTE}`
const SERVICES_URL = `${ROUTE_PREFIX}${SERVICE_DISCOVER_ROUTE}`

/** The names that mean a server on this machine. */
const LOOPBACK_HOSTS: ReadonlySet<string> = new Set(['localhost', '127.0.0.1', '[::1]'])

/**
 * Read the Host's service list without letting an unchecked object through.
 * @param value - the answer's `services` field.
 * @returns the validated entries, or undefined when any entry is malformed.
 */
function servicesOf(value: unknown): readonly ServiceSummary[] | undefined {
  if (!Array.isArray(value) || value.length > 64) return undefined
  const services: ServiceSummary[] = []
  for (const item of value) {
    if (typeof item !== 'object' || item === null) return undefined
    const fields = item as Record<string, unknown>
    const url = fields['url']
    const source = fields['source']
    const title = fields['title']
    if (typeof url !== 'string' || url === ''
      || (source !== 'recent' && source !== 'workspace' && source !== 'common')
      || (title !== undefined && typeof title !== 'string')) return undefined
    services.push({
      url,
      source,
      ...(title === undefined ? {} : { title }),
    })
  }
  return services
}

/**
 * Whether a typed string already carries a scheme.
 *
 * A scheme is only recognised with its `//` — `localhost:5173` is a host and a port,
 * and the shortest address a reader types. Reading its `localhost:` as a scheme made
 * the commonest thing anyone types into the one thing that never opened.
 *
 * `http://` and `https://` are the only schemes a loopback page can be reached by,
 * but any scheme at all is left intact: a reader who typed `ftp://…` asked for a
 * specific thing, and the refusal should say so rather than silently trying `http`.
 */
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:\/\//iu

/**
 * Turn what the reader typed into the address the Host should open.
 *
 * A bare host is the common case — `localhost:5173`, `127.0.0.1:8000/docs` — and the
 * scheme is the one part nobody types. Anything that still does not parse is `undefined`
 * rather than a guess: an address the reader cannot mean is better handed back to them
 * than sent to a server.
 * @param input - the text in the address field.
 * @returns the address to ask the Host for, or undefined when there is none.
 */
export function liveAddressOf(input: string): string | undefined {
  const text = input.trim()
  if (text === '') return undefined
  const candidate = HAS_SCHEME.test(text) ? text : `http://${text}`
  try {
    return new URL(candidate).href
  } catch {
    return undefined
  }
}

/**
 * Read the text as an address only when it names a loopback HTTP page.
 *
 * The service picker also uses its input as a title filter. `deck` is a valid URL
 * after {@link liveAddressOf} supplies a scheme, but it is a query, not an address
 * the reader asked to open. A loopback host is the unambiguous signal that the text
 * came from the reader as an address.
 * @param input - the text in the search field.
 * @returns a normalized loopback HTTP address, or undefined for a query.
 */
export function loopbackAddressOf(input: string): string | undefined {
  const address = liveAddressOf(input)
  if (address === undefined) return undefined
  const url = new URL(address)
  return url.protocol === 'http:' && LOOPBACK_HOSTS.has(url.hostname) ? address : undefined
}

/**
 * Ask the Host to open one page and frame it.
 *
 * The old page is not closed first: an address that turns out not to be a loopback
 * page leaves the frame the reader was looking at exactly where it was, so a typo
 * costs them nothing.
 * @param address - the normalized address from {@link liveAddressOf}.
 * @returns the page, with the address to frame it from.
 * @throws {AnnotatorHostError} when the Host refuses to open it.
 */
export async function openLivePage(address: string): Promise<LivePage> {
  const response = await fetch(LIVE_URL, {
    method: 'POST',
    headers: { [GUARD_HEADER]: '1', 'content-type': 'application/json' },
    body: JSON.stringify({ url: address }),
  })
  const body = await response.json() as { ok?: boolean; error?: string; url?: string }
  if (body.ok !== true || typeof body.url !== 'string') {
    throw new AnnotatorHostError(body.error ?? `live page failed with status ${response.status}`)
  }
  return { address, url: body.url }
}

/**
 * Stop standing in front of one page.
 *
 * Called when the reader goes back to a file, and when the panel goes away. A proxy
 * nobody is framing is a port still answering on the reader's machine, so this runs
 * on the way out rather than being left to a reload. The expected proxy URL makes a
 * late cleanup harmless: it cannot close a newer preview that replaced this one.
 * @param expectedUrl - the proxy URL this caller owns, when it has one.
 */
export async function closeLivePage(expectedUrl?: string): Promise<void> {
  const suffix = expectedUrl === undefined ? '' : `?url=${encodeURIComponent(expectedUrl)}`
  const response = await fetch(`${LIVE_URL}${suffix}`, {
    method: 'DELETE',
    headers: { [GUARD_HEADER]: '1' },
  })
  const body = await response.json() as { ok?: boolean; error?: string }
  if (body.ok !== true) {
    throw new AnnotatorHostError(body.error ?? `live close failed with status ${response.status}`)
  }
}

/**
 * Ask the Host which bounded loopback candidates are answering.
 * @param sessionId - the current session, whose workspace may name a port.
 * @param recent - locally remembered loopback addresses.
 * @returns reachable services in stable source order.
 * @throws {AnnotatorHostError} when the Host refuses the scan.
 */
export async function discoverLiveServices(
  sessionId: string,
  recent: readonly string[],
): Promise<readonly ServiceSummary[]> {
  const response = await fetch(SERVICES_URL, {
    method: 'POST',
    headers: { [GUARD_HEADER]: '1', 'content-type': 'application/json' },
    body: JSON.stringify({ sessionId, recent }),
  })
  const body = await response.json() as Partial<ServiceDiscoverAnswer> & { readonly error?: string }
  const services = servicesOf(body.services)
  if (body.ok !== true || services === undefined) {
    throw new AnnotatorHostError(
      typeof body.error === 'string' && body.error !== ''
        ? body.error
        : `service discovery failed with status ${response.status}`,
    )
  }
  return services
}

/**
 * Turn one reported pick into the anchor a mark carries.
 *
 * A mark is a locator: `tag`, `id`, `text` and the positional `selector` are how a
 * source reader finds the element again, and the box is where it was when the reader
 * pointed at it. The first few classes are kept only as a compact human signature in
 * the record list; navigation continues to use the positional selector.
 * @param picked - what the page reported.
 * @returns the anchor to hang a mark on.
 */
export function anchorOfPick(picked: LivePick): MarkAnchor {
  const classes = picked.class?.trim().split(/\s+/u).filter(Boolean).slice(0, 3).join(' ')
  return {
    tag: picked.tag,
    bbox: picked.bbox,
    selector: picked.selector,
    ...(picked.id === undefined ? {} : { id: picked.id }),
    ...(classes === undefined || classes === '' ? {} : { class: classes }),
    ...(picked.text === undefined ? {} : { text: picked.text }),
  }
}

/**
 * How the chip names a picked element.
 *
 * The panel cannot read the page — it is another origin — so the class the matcher in
 * `elementName` would have looked up never gets looked up. The page reports its own
 * class instead, and the label is built from that: `div.relative` where the reader is
 * pointing, which is the name they would write a comment with.
 * @param picked - what the page reported.
 * @returns the name to draw beside the element.
 */
export function pickName(picked: LivePick): string {
  const base = picked.tag.toLowerCase()
  if (picked.id !== undefined && picked.id !== '') return `${base}#${picked.id}`
  const first = picked.class?.trim().split(/\s+/u)[0]
  return first === undefined || first === '' ? base : `${base}.${first}`
}

/**
 * Whether a live review needs a screenshot.
 *
 * A pin carries its own coordinate, and a picker mark carries the element's selector
 * and live box. The text is enough to act on both without making the reader wait for
 * a DOM render and PNG encode. A drawn arrow, region, or stroke is the case where the
 * shape itself is evidence the words cannot reproduce.
 * When the current surface, scroll, and viewport are known, marks belonging to
 * another surface and marks outside the visible window are excluded. The post-capture
 * pass uses those facts so a drawing on slide two does not cause a screenshot of
 * slide three.
 * @param marks - the marks being delivered.
 * @param surface - the current logical surface, when the page reports one.
 * @param scroll - the frame's current scroll offset.
 * @param viewport - the frame's current visible size.
 * @returns true when at least one visible mark has drawn geometry.
 */
export function liveMarksNeedScreenshot(
  marks: readonly AnnotationMark[],
  surface?: string | null,
  scroll?: readonly [number, number],
  viewport?: readonly [number, number],
): boolean {
  return marks.some(mark => {
    if (mark.kind === 'point' || mark.kind === 'element') return false
    if (surface === undefined || scroll === undefined || viewport === undefined) return true
    if (mark.surface !== undefined) {
      if (mark.surface !== surface) return false
    } else if (surface !== null && mark.anchor?.selector === undefined) {
      return false
    }
    return touchesViewport(
      mark.points,
      scroll[0],
      scroll[1],
      scroll[0] + viewport[0],
      scroll[1] + viewport[1],
    )
  })
}

/**
 * The marks that belong in one screenshot of a live page.
 *
 * The page's bounds are read at capture time, because an element can move after the
 * mark was made. The screenshot is of the current viewport, so marks wholly outside
 * it are left out rather than stretching the picture into the rest of the document.
 * @param marks - the marks being delivered.
 * @param surface - the logical page in front when the screenshot was taken.
 * @param bounds - every watched element's box at that moment.
 * @param scroll - the frame's scroll offset.
 * @param viewport - the frame's visible size.
 * @returns marks ready for the screenshot composer.
 */
export function liveScreenshotMarks(
  marks: readonly AnnotationMark[],
  surface: string | null,
  bounds: readonly LiveBound[],
  scroll: readonly [number, number],
  viewport: readonly [number, number],
): readonly AnnotationMark[] {
  const boxes = new Map(bounds.map(bound => [bound.selector, bound]))
  const [left, top] = scroll
  const right = left + viewport[0]
  const bottom = top + viewport[1]
  return marks.flatMap((mark): AnnotationMark[] => {
    if (mark.surface !== undefined) {
      if (mark.surface !== surface) return []
    } else if (mark.anchor?.selector === undefined && surface !== null) {
      // A pre-surface region cannot be attributed to one slide. It is kept in the
      // draft, but must not be baked into the screenshot of whichever slide happens
      // to be in front when the message is sent.
      return []
    }
    const selector = mark.anchor?.selector
    const bound = selector === undefined ? undefined : boxes.get(selector)
    if (bound !== undefined && !bound.visible) return []
    const points = mark.kind === 'element'
      ? cornersOf(bound?.bbox ?? mark.anchor?.bbox)
      : mark.points
    if (!touchesViewport(points, left, top, right, bottom)) return []
    return [points === mark.points ? mark : { ...mark, points }]
  })
}

/**
 * Turn one box into the two corners every mark carries.
 * @param box - x, y, width, height.
 * @returns the top-left and bottom-right corners, or no points.
 */
function cornersOf(
  box: readonly [number, number, number, number] | undefined,
): readonly FigurePoint[] {
  if (box === undefined) return []
  const [x, y, width, height] = box
  return [[x, y], [x + width, y + height]]
}

/**
 * Whether a mark reaches the viewport at all.
 * @param points - the mark's document-space points.
 * @param left - viewport's left edge.
 * @param top - viewport's top edge.
 * @param right - viewport's right edge.
 * @param bottom - viewport's bottom edge.
 * @returns true when any part of the mark's box is visible.
 */
function touchesViewport(
  points: readonly FigurePoint[],
  left: number,
  top: number,
  right: number,
  bottom: number,
): boolean {
  const first = points[0]
  if (first === undefined) return false
  let minX = first[0]
  let minY = first[1]
  let maxX = first[0]
  let maxY = first[1]
  for (const [x, y] of points) {
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
  }
  // A pin sits above its point, and an arrow head reaches past its tip. The margin
  // keeps those visible parts in the picture instead of treating the anchor as a dot.
  const margin = 24
  return maxX >= left - margin && maxY >= top - margin
    && minX <= right + margin && minY <= bottom + margin
}

/** The last path segment of a file, which is how a file names itself. */
function baseName(path: string): string {
  const parts = path.split(/[\\/]/u).filter(part => part !== '')
  const last = parts[parts.length - 1]
  return last === undefined ? path : last
}

/**
 * What the address field shows.
 *
 * A field the reader is typing in shows what they typed; otherwise it shows where the
 * frame is pointed — a proxied page's own address, or the file's name when the figure
 * is a file. The name and not the whole path: the field is narrow, and the file is
 * already named by the panel around it.
 * @param liveText - what the reader is typing, or null while they are not typing.
 * @param page - the page being framed, or null for the body's own file.
 * @param path - the file's path on the Host.
 * @returns the text the field holds.
 */
export function shownAddress(liveText: string | null, page: LivePage | null, path: string): string {
  if (liveText !== null) return liveText
  return page === null ? baseName(path) : page.address
}
