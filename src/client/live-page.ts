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
import { LIVE_ROUTE, type LivePick } from '../shared/live'
import type { MarkAnchor } from '../shared/annotation'
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
 * Stop standing in front of whichever page is open.
 *
 * Called when the reader goes back to a file, and when the panel goes away. A proxy
 * nobody is framing is a port still answering on the reader's machine, so this runs
 * on the way out rather than being left to a reload.
 */
export async function closeLivePage(): Promise<void> {
  const response = await fetch(LIVE_URL, {
    method: 'DELETE',
    headers: { [GUARD_HEADER]: '1' },
  })
  const body = await response.json() as { ok?: boolean; error?: string }
  if (body.ok !== true) {
    throw new AnnotatorHostError(body.error ?? `live close failed with status ${response.status}`)
  }
}

/**
 * Turn one reported pick into the anchor a mark carries.
 *
 * A mark is a locator: `tag`, `id`, `text` and the positional `selector` are how a
 * source reader finds the element again, and the box is where it was when the reader
 * pointed at it. The picker's `class` is deliberately dropped here — a page that
 * restyles itself renames classes, and a locator that named one would stop resolving.
 * It is used for the chip's label instead, which is read, not saved.
 * @param picked - what the page reported.
 * @returns the anchor to hang a mark on.
 */
export function anchorOfPick(picked: LivePick): MarkAnchor {
  return {
    tag: picked.tag,
    bbox: picked.bbox,
    selector: picked.selector,
    ...(picked.id === undefined ? {} : { id: picked.id }),
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
