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
 * The frame is a window onto the document: one pane wide and one pane tall, with the
 * document scrolling inside it, so the page lays itself out the way it does in a
 * browser — its own media queries, its own `100vh`, its own sticky header. What it
 * reports is therefore what the reader sees, and the pixels it reports are the ones a
 * mark is recorded in.
 * @module dsh-figmark/client/html-dom
 */
import type { MarkAnchor } from '../shared/annotation'
import { anchorTextOf } from './anchor-text'
import { depthBelow, selectorFor } from './dom-path'
import { isPaper, pickStack } from './pick'

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

/**
 * The attribute a document may name its own theme in.
 *
 * The name is a convention neither CSS nor HTML defines, which is exactly why a
 * document that uses one cannot be read without it: the palette is declared under
 * this attribute and nowhere else, so a document that arrives here without it has
 * no colours at all.
 */
const THEME_ATTRIBUTE = 'data-theme'

/** Elements that only wrap other content, so a mark on one names its container instead. */
const WRAPPER_TAGS = [
  'span', 'b', 'i', 'em', 'strong', 'small', 'u', 's', 'sub', 'sup',
  'code', 'a', 'label', 'mark', 'abbr', 'time', 'cite', 'q',
]

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
  adoptDeclaredTheme(parsed)
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
 * Paint a document whose theme its own scripts would have chosen.
 *
 * No script runs in the frame, so a theme applied by one never arrives: the palettes
 * live under `[data-theme="…"]`, nothing matches, and every colour and background
 * resolves to nothing — the page then renders as bare text on bare paper, which is
 * not the page the reader asked to annotate. The first theme the document declares is
 * the one its stylesheet is written around, so that is the one the paper gets.
 *
 * A document that already names a theme keeps it, and one that declares none is left
 * alone: this only fills in what the missing script would have set.
 * @param parsed - the document being prepared.
 */
function adoptDeclaredTheme(parsed: Document): void {
  const root = parsed.documentElement
  if (root.hasAttribute(THEME_ATTRIBUTE)) return
  for (const style of parsed.querySelectorAll('style')) {
    // A `<style>` element's text is its stylesheet; only a Document or a Doctype can
    // report null, and a style element is neither.
    const css = style.textContent as string
    const declared = /\[data-theme\s*=\s*["']?([-\w]+)["']?\]/.exec(css)
    const theme = declared?.[1]
    if (theme === undefined) continue
    root.setAttribute(THEME_ATTRIBUTE, theme)
    return
  }
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

/** The size a rendered document lays out at, in pixels. */
export interface FrameContentSize {
  /** Width of the document's own content. */
  readonly width: number
  /** Height of the document's own content. */
  readonly height: number
}

/**
 * The size the document inside one frame lays out at.
 *
 * Read from the frame as it stands, because the frame *is* the viewport the document
 * believes it is on: the frame is one window tall and the document scrolls inside it,
 * the way a page scrolls in a browser. Nothing is written here, so what is measured is
 * what is shown — which is the whole point on a document that sizes itself against its
 * viewport: `100vh` means one windowful, and a sticky header sticks to the top of the
 * window rather than to the top of a sheet ten screens tall.
 *
 * (Collapsing the frame to measure, which is what this used to do, answered a question
 * nothing wanted any more: it measured a layout the reader never sees.)
 *
 * A document that has laid out nothing yet reports no height, which is not a size.
 * @param frame - the frame holding the document, if there is one.
 * @returns the content's size, or undefined while it has laid out nothing yet.
 */
export function measureFrameContent(frame: HTMLIFrameElement | null): FrameContentSize | undefined {
  if (frame === null) return undefined
  const frameDocument = frame.contentDocument
  if (frameDocument === null) return undefined
  const root = frameDocument.documentElement
  const width = root.scrollWidth
  const height = root.scrollHeight
  return height === 0 ? undefined : { width, height }
}

/**
 * How far the document has been scrolled inside its frame.
 *
 * A document in a window scrolls: everything it reports through
 * `getBoundingClientRect` is where the element is *in the window*, while a mark is
 * recorded where the element is *in the document* — the unit a source reader can act
 * on. The difference is this offset, and it is zero for a document that cannot be
 * scrolled (and for one parsed outside a window, which is how the tests see it).
 * @param document - the document to read.
 * @returns the document's scroll offset in its own pixels.
 */
function scrollOf(document: Document): { readonly x: number; readonly y: number } {
  const view = document.defaultView
  return { x: view?.scrollX ?? 0, y: view?.scrollY ?? 0 }
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
 * The point arrives in figure pixels — the document's own coordinates, the same space
 * a mark is recorded in — while the hit test asks in window pixels, so the document's
 * scroll offset is taken off here and put back on the box this returns. A document
 * that has been scrolled to is then named for the element the reader is looking at,
 * and not for whatever sits that far up the page.
 *
 * @param document - the frame's document, or nothing when the frame is gone.
 * @param x - point x in figure pixels.
 * @param y - point y in figure pixels.
 * @returns the anchor, or undefined when the point names no element.
 */
export function anchorInDocument(document: Document | null | undefined, x: number, y: number): MarkAnchor | undefined {
  if (document === null || document === undefined) return undefined
  const body = document.body
  if (body === null) return undefined
  const scroll = scrollOf(document)
  const hitX = x - scroll.x
  const hitY = y - scroll.y
  const frame = body.getBoundingClientRect()
  const stack = pickStack(document, hitX, hitY)
  if (stack === null) return measureInDocument(body, hitX, hitY)
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
  // The box comes back in window pixels; a mark records document pixels, which differ
  // by however far the page has been scrolled. A document parsed outside a window
  // reports no view and no offset, and its boxes are already document pixels.
  const scroll = scrollOf(described.ownerDocument)
  // `Element.textContent` is `string | null` in the DOM types, but only a Document or
  // a Doctype can report null; an element always reports its text.
  // Kept apart, so two labels inside one element stay two labels: the same rule the
  // SVG path follows, because a reader cannot tell which figure kind they are on.
  const text = anchorTextOf(described)
  return {
    tag: described.tagName.toLowerCase(),
    bbox: [rect.left + scroll.x, rect.top + scroll.y, rect.width, rect.height],
    ...(described.id === '' ? {} : { id: described.id }),
    ...(text === '' ? {} : { text }),
    selector: selectorFor(described, body),
  }
}
