/**
 * DOM geometry and element naming shared by tree-shaped surfaces.
 *
 * The product surface for HTML is now a live loopback service page, whose parent
 * never reads the framed DOM. These helpers remain the pure tree implementation
 * used by SVG and by tests that need deterministic same-origin DOM behavior; they
 * are not a static HTML renderer registration or a live-proxy fallback.
 *
 * The frame is rendered at {@link RENDER_WIDTH} — or at the document's own width when
 * it declares a wider stage — and its height is the pane it is shown through. The
 * document scrolls inside that frame, so it remains one viewport instead of growing
 * into a sheet as tall as all of its content.
 * @module dsh-figmark/client/html-dom
 */
import type { FigureBox, MarkAnchor } from '../shared/annotation'
import { anchorTextOf } from './anchor-text'
import { depthBelow, selectorFor } from './dom-path'
import { anchorAtOffset, type ElementChoices } from './element-choice'
import { isPaper, pickStack } from './pick'
import { elementAt } from './spotlight'

/**
 * Width every document is first laid out at, in figure pixels.
 *
 * Fixed rather than the pane's width: a document reflows, so marks measured at one
 * width would mean something else at another. Rendering at one width and scaling the
 * result to the pane gives marks the same standing a PDF page has. A document that
 * declares a wider stage may still widen the surface after its first layout; the
 * important invariant is that its first layout and all element coordinates begin at
 * 1024 CSS pixels.
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

/**
 * Policy for the read-only preview.
 *
 * A static document may be a self-contained deck whose inline script is what turns
 * its slides. The preview therefore permits inline script, but no external script,
 * stylesheet, font, media, frame, form action, or fetch/XHR connection. Inline script
 * can still navigate its own opaque frame, but cannot reach the plugin.
 */
const PREVIEW_POLICY = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'"
  + "; img-src data:; font-src data:; media-src data: blob:; connect-src 'none'"
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

/** The class a slide deck conventionally uses for each page of the deck. */
const DECK_SLIDE_SELECTOR = '.slide'

/** Marks a local document whose slides this panel turns itself. */
const DECK_ATTRIBUTE = 'data-figmark-deck'

/** Identifies one slide inside a document this panel has prepared. */
const SLIDE_ATTRIBUTE = 'data-figmark-slide'

/** Identifies the one slide that is in front. */
const CURRENT_SLIDE_ATTRIBUTE = 'data-figmark-slide-current'

/** Marks the style element that makes the slide choice authoritative. */
const DECK_STYLE_ATTRIBUTE = 'data-figmark-deck-style'

/**
 * The only page-turn a scriptless deck can perform.
 *
 * A deck normally starts with every slide in the same stacking context and lets its
 * script switch the visible one. Scripts are deliberately off here, so its no-script
 * fallback stacks every slide into one long sheet. Hiding all but one slide restores
 * the page the author designed; the rules are `!important` because they have to win
 * over both that fallback and whatever class the deck normally toggles.
 */
const DECK_STYLE = `
html[${DECK_ATTRIBUTE}] [${SLIDE_ATTRIBUTE}]:not([${CURRENT_SLIDE_ATTRIBUTE}]) {
  display: none !important;
  visibility: hidden !important;
}
html[${DECK_ATTRIBUTE}] [${SLIDE_ATTRIBUTE}][${CURRENT_SLIDE_ATTRIBUTE}] {
  visibility: visible !important;
}
`

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
  return prepareDocument(source, CONTENT_POLICY)
}

/**
 * Prepare one self-contained document for the read-only preview.
 *
 * The preview follows the same base/refresh safety rules as the annotator's inert
 * document, but allows inline scripts so a static deck can still turn its own pages.
 * @param source - the file's own HTML text.
 * @returns a complete document for the opaque preview frame.
 */
export function buildPreviewDocument(source: string): string {
  return prepareDocument(source, PREVIEW_POLICY)
}

/**
 * Remove document-level escapes and install one content policy.
 * @param source - the file's own HTML text.
 * @param contentPolicy - the CSP appropriate to the frame that will host it.
 * @returns a complete document for that frame.
 */
function prepareDocument(source: string, contentPolicy: string): string {
  const parsed = new DOMParser().parseFromString(source, 'text/html')
  adoptDeclaredTheme(parsed)
  for (const element of parsed.querySelectorAll('base')) element.remove()
  for (const element of parsed.querySelectorAll('meta')) {
    if ((element.getAttribute('http-equiv') ?? '').toLowerCase() === 'refresh') element.remove()
  }
  const policy = parsed.createElement('meta')
  policy.setAttribute('http-equiv', 'Content-Security-Policy')
  policy.setAttribute('content', contentPolicy)
  // First in the head, so it governs every reference the document declares.
  parsed.head.prepend(policy)
  return `<!doctype html>${parsed.documentElement.outerHTML}`
}

/**
 * The event target that spans a rendered document.
 *
 * A live frame has a window that can intercept a page press before the page sees it.
 * A detached document has no window of its own, so the document is the widest target
 * available and has to own the same guard.
 * @param document_ - the document rendered into the frame.
 * @returns its window when it has one, otherwise the document itself.
 */
export function eventOwnerOf(document_: Document): Document | Window {
  return document_.defaultView ?? document_
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

/** A deck this panel can turn without running the document's scripts. */
export interface RenderedDeck {
  /** Number of slides in the document. */
  readonly count: number
  /** Zero-based index of the slide initially in front. */
  readonly index: number
}

/**
 * Make the static fallback of a slide deck show one page at a time.
 *
 * The detection is intentionally narrow: repeated `.slide` elements are the one
 * convention common enough to act on without guessing about arbitrary documents.
 * Anything else keeps the ordinary scrolling-window behaviour. The deck's own
 * `current`, `active`, or `aria-current` slide wins when it has one; otherwise the
 * first slide is opened.
 * @param root - the rendered document's root element.
 * @returns the deck's slide count and initial slide, or undefined for a normal page.
 */
export function prepareDeck(root: HTMLElement): RenderedDeck | undefined {
  const slides = [...root.querySelectorAll<HTMLElement>(DECK_SLIDE_SELECTOR)]
  if (slides.length < 2) return undefined
  const frameDocument = root.ownerDocument
  root.setAttribute(DECK_ATTRIBUTE, '')
  slides.forEach((slide, index) => {
    slide.setAttribute(SLIDE_ATTRIBUTE, String(index))
  })
  const declared = slides.findIndex(slide => slide.classList.contains('current')
    || slide.classList.contains('active')
    || slide.getAttribute('aria-current') !== null)
  const index = declared < 0 ? 0 : declared
  if (frameDocument.head.querySelector(`style[${DECK_STYLE_ATTRIBUTE}]`) === null) {
    const style = frameDocument.createElement('style')
    style.setAttribute(DECK_STYLE_ATTRIBUTE, '')
    style.textContent = DECK_STYLE
    frameDocument.head.append(style)
  }
  showDeckSlide(root, index)
  return { count: slides.length, index }
}

/**
 * Put one prepared slide in front.
 *
 * The return value is the slide itself so the caller can measure the page it just
 * opened. An index outside the deck is clamped, which makes keyboard repeats and a
 * stale count harmless rather than blanking the preview.
 * @param root - a document prepared by {@link prepareDeck}.
 * @param index - the zero-based slide to show.
 * @returns the slide now in front, or undefined when this is not a prepared deck.
 */
export function showDeckSlide(root: HTMLElement, index: number): HTMLElement | undefined {
  const slides = [...root.querySelectorAll<HTMLElement>(`[${SLIDE_ATTRIBUTE}]`)]
  if (slides.length === 0) return undefined
  const selected = slides[Math.max(0, Math.min(slides.length - 1, index))]
  /* v8 ignore next -- the clamp above always selects an existing slide. */
  if (selected === undefined) return undefined
  for (const slide of slides) slide.removeAttribute(CURRENT_SLIDE_ATTRIBUTE)
  selected.setAttribute(CURRENT_SLIDE_ATTRIBUTE, '')
  root.ownerDocument.defaultView?.scrollTo(0, 0)
  return selected
}

/**
 * The size of the prepared slide in front.
 *
 * A normal page is a scrollport and is measured by {@link measureFrameContent}. A
 * deck is a sheet: its frame must take the slide's own size, or fitting it to the
 * pane clips the middle of the slide instead of showing the whole page.
 * @param root - a document prepared by {@link prepareDeck}.
 * @returns the selected slide's laid-out size, or undefined while it has none.
 */
export function deckSlideSize(root: HTMLElement): FrameContentSize | undefined {
  const selected = root.querySelector<HTMLElement>(`[${CURRENT_SLIDE_ATTRIBUTE}]`)
  if (selected === null) return undefined
  const rect = selected.getBoundingClientRect()
  const width = rect.width > 0 ? rect.width : selected.offsetWidth
  const height = rect.height > 0 ? rect.height : selected.offsetHeight
  return width > 0 && height > 0 ? { width, height } : undefined
}

/**
 * Which prepared slide contains one selector's element.
 * @param root - a document prepared by {@link prepareDeck}.
 * @param selector - the selector recorded on a mark.
 * @returns the zero-based slide index, or undefined when the element is not in a slide.
 */
export function deckSlideOf(root: HTMLElement, selector: string): number | undefined {
  const element = root.querySelector(selector)
  const slide = element?.closest<HTMLElement>(`[${SLIDE_ATTRIBUTE}]`) ?? null
  const raw = slide?.getAttribute(SLIDE_ATTRIBUTE)
  if (raw === null || raw === undefined) return undefined
  const index = Number.parseInt(raw, 10)
  return Number.isNaN(index) ? undefined : index
}

/**
 * Name the logical page currently in front.
 *
 * A static deck this panel prepared has its own marker, while a scriptless fallback
 * may still use the author's conventional `current` or `active` class. Ordinary
 * scrolling pages have no logical page and return undefined.
 * @param root - the rendered document's root element.
 * @returns a selector for the visible surface, or undefined for a normal page.
 */
export function currentSurfaceSelector(root: HTMLElement): string | undefined {
  const prepared = root.querySelector<HTMLElement>(`[${CURRENT_SLIDE_ATTRIBUTE}]`)
  const fallback = root.querySelector<HTMLElement>([
    '.slide.current',
    '.slide.active',
    '.slide[aria-current="true"]',
    '.slide[aria-current="page"]',
  ].join(','))
  const surface = prepared ?? fallback
  if (surface === null) return undefined
  const box = elementBox(surface)
  if (box === undefined || box[2] === 0 || box[3] === 0) return undefined
  const body = root.ownerDocument.body
  return selectorFor(surface, body)
}

/**
 * Whether a logical surface a mark names is the one in front.
 *
 * Prepared decks carry their own authoritative marker, so a selector can be compared
 * to the current slide even before layout has measured the frame. Other documents fall
 * back to the same visibility test the browser uses for an element.
 * @param root - the rendered document's root element.
 * @param selector - the selector stored on a mark's `surface` field.
 * @returns true when that surface is being shown, or false when it is behind.
 */
export function surfaceIsInFront(root: HTMLElement, selector: string): boolean {
  const element = elementAt({ root, selector })
  const current = root.querySelector<HTMLElement>(`[${CURRENT_SLIDE_ATTRIBUTE}]`)
  if (element !== undefined && current !== null) {
    const slide = element.closest<HTMLElement>(`[${SLIDE_ATTRIBUTE}]`)
    if (slide !== null) return slide === current
  }
  return element === undefined || elementBox(element) !== undefined
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

/**
 * The box an element covers in its document's own pixels.
 *
 * The box comes back in window pixels, while a mark records document pixels, which
 * differ by however far the page has been scrolled. A document parsed outside a
 * window reports no view and no offset, and its boxes are already document pixels.
 * @param element - the element to measure.
 * @returns the box, in document pixels.
 */
function boxOf(element: Element): FigureBox {
  const rect = element.getBoundingClientRect()
  const scroll = scrollOf(element.ownerDocument)
  return [rect.left + scroll.x, rect.top + scroll.y, rect.width, rect.height]
}

/**
 * The parts of "visible" this panel means by it.
 *
 * `checkVisibility()` on its own only answers for `display` and for content the engine
 * has skipped laying out; a slide put away with `visibility: hidden` — which is how a
 * deck keeps every slide in one file and swaps them — counts as visible, and every mark
 * of every slide would land on the slide in front. Both the current name and the older
 * one for the same check are passed, because browsers agree on neither spelling yet.
 * Opacity is deliberately not checked: a slide mid-fade is a page being turned, and a
 * mark that blinks out and back during the turn looks broken rather than honest.
 */
const SHOWN: CheckVisibilityOptions = {
  checkVisibilityCSS: true,
  visibilityProperty: true,
  contentVisibilityAuto: true,
}

/**
 * Whether a document is showing an element right now.
 *
 * The engine's own answer whenever it has one: `checkVisibility` is precisely this
 * question, and it covers the ways a page hides a thing — a slide that is not up is
 * `visibility: hidden`, a page that is put away is `display: none`, a collapsed
 * section has no box at all. A document parsed by a test double has neither the call
 * nor a cascade, so the fallback asks the two properties that are computed there, and
 * walks up for `display`, which is inherited by nothing.
 * @param element - the element to ask about.
 * @returns true while the element is on the page in front of the reader.
 */
function isRendered(element: Element): boolean {
  if (typeof element.checkVisibility === 'function') return element.checkVisibility(SHOWN)
  const view = element.ownerDocument.defaultView
  for (let node: Element | null = element; node !== null; node = node.parentElement) {
    const style = view?.getComputedStyle(node)
    if (style === undefined) return true
    if (style.display === 'none') return false
    if (node === element && style.visibility === 'hidden') return false
  }
  return true
}

/**
 * Where an element is, while the document is showing it.
 *
 * A rendered document is one document of many surfaces: a deck keeps every slide in
 * the markup, stacked in the same place, and shows one of them at a time. An element
 * on a slide that is not up still has a box, and that box lands on the slide in front
 * — so "where is this element" and "is its page the page in front" are one question,
 * and this is it.
 * @param element - the element to measure.
 * @returns the box in document pixels, or undefined while the document hides it.
 */
export function elementBox(element: Element): FigureBox | undefined {
  return isRendered(element) ? boxOf(element) : undefined
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
  const choices = elementChoicesInDocument(document, x, y)
  return choices === undefined ? undefined : anchorAtOffset(choices, 0)
}

/**
 * Every element a point in a rendered document can mean.
 *
 * The exact painted element is first, then the named block that used to be the only
 * possible answer, then the blocks that contain it. The default stays the named block
 * because that is the element a source reader can act on, but the exact element and
 * its parents are available for the reader to choose before committing.
 * @param document - the frame's document, or nothing when the frame is gone.
 * @param x - point x in figure pixels.
 * @param y - point y in figure pixels.
 * @returns the ordered choices and the level a plain click takes.
 */
export function elementChoicesInDocument(
  document: Document | null | undefined,
  x: number,
  y: number,
): ElementChoices | undefined {
  if (document === null || document === undefined) return undefined
  const body = document.body
  if (body === null) return undefined
  const scroll = scrollOf(document)
  const hitX = x - scroll.x
  const hitY = y - scroll.y
  const frame = body.getBoundingClientRect()
  const stack = pickStack(document, hitX, hitY)
  if (stack === null) return measureInDocument(body, hitX, hitY)
  let described: Element | undefined
  let wrapper: Element | undefined
  for (const element of stack) {
    if (!body.contains(element) || element === body) continue
    if (isPaper(element, frame)) continue
    if (isAnonymousWrapper(element)) {
      wrapper ??= element
      continue
    }
    described = element
    break
  }
  described ??= wrapper
  if (described === undefined) return undefined
  return choicesAround(described, wrapper, body)
}

/**
 * Build a document choice ladder from the exact element and its containing blocks.
 * @param described - the block a plain click names.
 * @param wrapper - an anonymous inline descendant under the pointer, if any.
 * @param body - the document body, excluded from the ladder.
 * @returns the ordered choices.
 */
function choicesAround(described: Element, wrapper: Element | undefined, body: Element): ElementChoices {
  const elements: [Element, ...Element[]] = [described]
  if (wrapper !== undefined && wrapper !== described) elements.unshift(wrapper)
  const root = body.ownerDocument.documentElement
  for (let parent = described.parentElement;
    parent !== null && parent !== body && parent !== root;
    parent = parent.parentElement) {
    if (!elements.includes(parent)) elements.push(parent)
  }
  return {
    anchors: [
      describeInDocument(elements[0], body),
      ...elements.slice(1).map(element => describeInDocument(element, body)),
    ],
    preferred: elements.indexOf(described),
  }
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
function measureInDocument(body: Element, x: number, y: number): ElementChoices | undefined {
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
  if (described === undefined) return undefined
  return choicesAround(described, wrapper, body)
}

/**
 * One element of a rendered document, written as the anchor a mark carries.
 *
 * @param described - the element to name.
 * @param body - the document body the selector is rooted at.
 * @returns the anchor.
 */
function describeInDocument(described: Element, body: Element): MarkAnchor {
  // `Element.textContent` is `string | null` in the DOM types, but only a Document or
  // a Doctype can report null; an element always reports its text.
  // Kept apart, so two labels inside one element stay two labels: the same rule the
  // SVG path follows, because a reader cannot tell which figure kind they are on.
  const text = anchorTextOf(described)
  return {
    tag: described.tagName.toLowerCase(),
    bbox: boxOf(described),
    ...(described.id === '' ? {} : { id: described.id }),
    ...(text === '' ? {} : { text }),
    selector: selectorFor(described, body),
  }
}
