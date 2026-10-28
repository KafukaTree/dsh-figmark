/**
 * Rendering an HTML document into an annotatable frame, and naming what a mark
 * landed on.
 *
 * The document is inlined into a same-origin frame that is not allowed to run
 * scripts and carries a policy that forbids every external reference, so what the
 * frame holds is inert markup the parent half can read — which is the whole point:
 * a mark on a document has to name the element it points at, and the source
 * reader can only act on a locator that resolves in the file.
 *
 * The frame is rendered at {@link RENDER_WIDTH} and sized to its own content, so
 * it never scrolls internally and its elements report their own layout pixels —
 * which are exactly the figure pixels marks are recorded in.
 * @module dsh-figmark/client/html-dom
 */
import type { MarkAnchor } from '../shared/annotation'
import { depthBelow, selectorFor } from './dom-path'
import { isPaper, pickStack } from './pick'

/**
 * Width every document is rendered at, in figure pixels.
 *
 * Fixed rather than the pane's width: a document reflows, so marks measured at
 * one width would mean something else at another. Rendering at one width and
 * scaling the result to the pane gives marks the same standing a PDF page has —
 * the surface has a size of its own, and the pane only changes how it is shown.
 */
export const RENDER_WIDTH = 1024

/**
 * Policy every rendered document carries.
 *
 * The frame already refuses to run scripts; this keeps the document from reaching
 * anywhere at all — no request leaves the machine, no nested frame, no form post —
 * while still letting the document's own inline styles paint it.
 */
const CONTENT_POLICY = "default-src 'none'; script-src 'none'; style-src 'unsafe-inline'"
  + "; img-src data:; font-src data:; media-src data:; connect-src 'none'"
  + "; frame-src 'none'; form-action 'none'; base-uri 'none'"

/** Elements that only wrap other content, so a mark on one names its container instead. */
const WRAPPER_TAGS = [
  'span', 'b', 'i', 'em', 'strong', 'small', 'u', 's', 'sub', 'sup',
  'code', 'a', 'label', 'mark', 'abbr', 'time', 'cite', 'q',
]

/** Cap on the element text carried into an anchor, matching the inline-SVG anchor. */
const ANCHOR_TEXT_LIMIT = 80

/**
 * Prepare one document for the frame.
 *
 * Two elements are removed rather than merely forbidden: a `<base>` would move
 * every relative reference in the document, and a refreshing `<meta>` would
 * replace the frame's document with a page this plugin cannot read. Both would
 * cost the user the surface they are annotating, so they are dropped instead.
 *
 * @param source - the file's own HTML text.
 * @returns a complete document for the frame.
 */
export function buildRenderedDocument(source: string): string {
  const parsed = new DOMParser().parseFromString(source, 'text/html')
  for (const element of parsed.querySelectorAll('base')) element.remove()
  for (const element of parsed.querySelectorAll('meta')) {
    if ((element.getAttribute('http-equiv') ?? '').toLowerCase() === 'refresh') element.remove()
  }
  const policy = parsed.createElement('meta')
  policy.setAttribute('http-equiv', 'Content-Security-Policy')
  policy.setAttribute('content', CONTENT_POLICY)
  // First in the head, so it governs every reference the document declares.
  parsed.head.prepend(policy)
  return `<!doctype html>${parsed.documentElement.outerHTML}`
}

/**
 * Write one prepared document into a frame.
 *
 * @param frame - the frame element, or nothing when it is not mounted.
 * @param source - a document from {@link buildRenderedDocument}.
 * @returns the frame's root element, or undefined when there is no frame to load
 * into — the caller then has nothing to measure and no surface to annotate.
 */
export function loadFrameDocument(frame: HTMLIFrameElement | null, source: string): HTMLElement | undefined {
  if (frame === null) return undefined
  const frameDocument = frame.contentDocument
  if (frameDocument === null) return undefined
  frameDocument.open()
  frameDocument.write(source)
  frameDocument.close()
  return frameDocument.documentElement
}

/** Whether an element is an anonymous inline wrapper: it names no anchor of its own. */
function isAnonymousWrapper(element: Element): boolean {
  return element.id === '' && WRAPPER_TAGS.includes(element.tagName.toLowerCase())
}

/**
 * Describe the element under one point of a rendered document.
 *
 * The browser answers which element covers the point, because only it knows the
 * painted geometry: a paragraph whose text stops halfway through its box covers only
 * that half, and a table cell covers its cell rather than the whole row. Measuring
 * boxes instead would name whichever box happened to be smallest, which on a
 * document is usually the innermost wrapper around the text rather than the block the
 * reader sees highlighted.
 *
 * Two elements are withheld from the answer. The document's own background covers the
 * whole rendered width, so naming it would mean "the page" for a click on blank paper
 * — a mark around everything says nothing about any part of it. And an anonymous
 * inline wrapper (`<span>`, `<b>`) names nothing a source reader can act on, so it is
 * only used when it is the last thing there is: text a document leaves directly in the
 * body has nothing else to name.
 *
 * @param document - the frame's document, or nothing when the frame is gone.
 * @param x - point x in figure pixels.
 * @param y - point y in figure pixels.
 * @returns the anchor, or undefined when the point names no element.
 */
export function anchorInDocument(document: Document | null | undefined, x: number, y: number): MarkAnchor | undefined {
  const body = document?.body
  if (body === null || body === undefined) return undefined
  const frame = body.getBoundingClientRect()
  const stack = pickStack(document, x, y)
  if (stack === null) return measureInDocument(body, x, y)
  let wrapper: Element | undefined
  for (const element of stack) {
    if (!body.contains(element) || element === body) continue
    if (isPaper(element, frame)) continue
    if (isAnonymousWrapper(element)) {
      wrapper ??= element
      continue
    }
    return describeInDocument(element, body)
  }
  return wrapper === undefined ? undefined : describeInDocument(wrapper, body)
}

/**
 * The smallest box containing the point, for a document that cannot be asked.
 *
 * This is what answers when the engine has no hit testing — a document parsed by a
 * test double. The smallest containing box is the honest rule available there, but it
 * cannot tell that a paragraph's text stops halfway through its box, so the browser's
 * own answer is used whenever it exists and this never runs in the panel.
 *
 * The smallest box wins, ties going to the deeper element. An anonymous inline wrapper
 * does not count as a name — a mark on the `<b>` inside a heading points at that
 * heading — so wrappers are held back as a fallback for the one case they are all a
 * point has: text a document leaves directly in the body.
 * @param body - the document body the point is on.
 * @param x - point x in figure pixels.
 * @param y - point y in figure pixels.
 * @returns the element, or undefined when no box contains the point.
 */
function measureInDocument(body: Element, x: number, y: number): MarkAnchor | undefined {
  let named: Element | undefined
  let namedArea = Number.POSITIVE_INFINITY
  let namedDepth = -1
  let wrapper: Element | undefined
  let wrapperArea = Number.POSITIVE_INFINITY
  let wrapperDepth = -1
  for (const element of body.querySelectorAll('*')) {
    const rect = element.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) continue
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) continue
    const area = rect.width * rect.height
    const depth = depthBelow(element, body)
    if (isAnonymousWrapper(element)) {
      if (area < wrapperArea || (area === wrapperArea && depth > wrapperDepth)) {
        wrapper = element
        wrapperArea = area
        wrapperDepth = depth
      }
      continue
    }
    if (area < namedArea || (area === namedArea && depth > namedDepth)) {
      named = element
      namedArea = area
      namedDepth = depth
    }
  }
  const described = named ?? wrapper
  return described === undefined ? undefined : describeInDocument(described, body)
}

/**
 * One element of a rendered document, written as the anchor a mark carries.
 *
 * @param described - the element to name.
 * @param body - the document body the selector is rooted at.
 * @returns the anchor.
 */
function describeInDocument(described: Element, body: Element): MarkAnchor {
  const rect = described.getBoundingClientRect()
  // `Element.textContent` is `string | null` in the DOM types, but only a Document or
  // a Doctype can report null; an element always reports its text.
  const rawText = described.textContent as string
  const text = rawText.trim().replace(/\s+/g, ' ').slice(0, ANCHOR_TEXT_LIMIT)
  return {
    tag: described.tagName.toLowerCase(),
    bbox: [rect.left, rect.top, rect.width, rect.height],
    ...(described.id === '' ? {} : { id: described.id }),
    ...(text === '' ? {} : { text }),
    selector: selectorFor(described, body),
  }
}
