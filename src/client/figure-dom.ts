/**
 * Turning a workspace figure into a DOM subtree the annotator can hit-test.
 *
 * An SVG figure is inlined rather than shown through an `<img>`, because only the
 * live DOM exposes which element a mark landed on (Graphviz tags each node group
 * with a `<title>`). Inlining untrusted markup requires sanitizing it first: the
 * figure comes from the workspace, so scripts, foreign content, and external
 * references are removed before it reaches the document.
 * @module dsh-figmark/client/figure-dom
 */

import type { MarkAnchor } from '../shared/annotation'
import { anchorTextOf } from './anchor-text'
import { depthBelow, isStableId, selectorWithin } from './dom-path'
import { coversInterior, PICK_REACH, pickStack } from './pick'

/**
 * Element names removed outright before inlining.
 *
 * `use` is deliberately absent. Matplotlib draws every marker, tick, and error-bar
 * cap as a `<use>` pointing at a path in `defs`, so dropping the element erased all
 * of them while leaving the paths behind: the figure looked like it had been drawn
 * without markers, which is the "missing elements" a PNG export does not show. A
 * `<use>` is safe to keep here because it can only clone what is already in the
 * figure — an external target is a reference the `href` rule below strips.
 */
const FORBIDDEN_ELEMENTS = ['script', 'foreignObject', 'iframe', 'audio', 'video', 'animate', 'set']

/**
 * A rule that makes the browser fetch something from outside the figure.
 *
 * These are dropped from the figure's own `<style>` text. `@import` is the one that
 * matters: it is a network request the browser issues while painting the inlined
 * SVG, and a figure that arrived from a workspace is not allowed to phone home.
 * `url(…)` is left alone because a figure legitimately paints with `url(#clip)` and
 * `url(#gradient)`; a remote one inside `style` is caught by the same check its
 * markup equivalent is, and the export and the panel share this pass.
 */
const REMOTE_STYLE_RULES = [/@import\b[^;]*;?/giu, /url\(\s*(['"]?)(?:https?:)?\/\/[^)]*\)/giu]

/**
 * Strip rules that reach outside the figure from one `<style>` element's text.
 * @param element - the `<style>` element to clean.
 */
function stripRemoteStyleRules(element: Element): void {
  // `Element.textContent` is `string | null` in the DOM types, but only a Document
  // or a Doctype can report null; an element always reports its text.
  let text = element.textContent as string
  for (const rule of REMOTE_STYLE_RULES) text = text.replace(rule, '')
  element.textContent = text
}

/**
 * Sanitize SVG source for inlining.
 * @param source - the figure's SVG text.
 * @returns the parsed root element, or undefined when the text is not usable SVG.
 */
export function parseFigureSvg(source: string): SVGSVGElement | undefined {
  const parsed = new DOMParser().parseFromString(source, 'image/svg+xml')
  if (parsed.querySelector('parsererror') !== null) return undefined
  const root = parsed.documentElement
  if (root.tagName.toLowerCase() !== 'svg') return undefined
  for (const element of [...root.querySelectorAll(FORBIDDEN_ELEMENTS.join(','))]) element.remove()
  for (const element of [root, ...root.querySelectorAll('*')]) {
    if (element.tagName.toLowerCase() === 'style') stripRemoteStyleRules(element)
    for (const attribute of [...element.attributes]) {
      const name = attribute.name.toLowerCase()
      if (name.startsWith('on')) {
        element.removeAttribute(attribute.name)
        continue
      }
      if (name === 'href' || name === 'xlink:href') {
        const value = attribute.value.trim().toLowerCase()
        if (!value.startsWith('#') && !value.startsWith('data:')) element.removeAttribute(attribute.name)
      }
    }
  }
  return root as unknown as SVGSVGElement
}

/**
 * Serialize a sanitized figure for the export canvas.
 * @param root - sanitized root from {@link parseFigureSvg}.
 * @returns the SVG markup.
 */
export function figureSvgMarkup(root: SVGSVGElement): string {
  return new XMLSerializer().serializeToString(root)
}

/** Intrinsic size of a figure element. */
export interface FigureIntrinsicSize {
  /** Width in figure pixels. */
  readonly width: number
  /** Height in figure pixels. */
  readonly height: number
}

/** CSS pixels per unit, for the absolute lengths an SVG may declare its size in. */
const UNIT_PIXELS: Readonly<Record<string, number>> = {
  '': 1,
  px: 1,
  pt: 96 / 72,
  pc: 16,
  in: 96,
  cm: 96 / 2.54,
  mm: 96 / 25.4,
  q: 96 / 101.6,
}

/**
 * One SVG length attribute, in CSS pixels, or undefined when it is not absolute.
 *
 * `Number.parseFloat` stops at the first character it cannot read, which turns `6.4in`
 * into the bare number 6.4 — 72 times too small once written back as a pixel count —
 * and `100%` into 100. A percentage or a viewport-relative unit is not a size this
 * figure has without a container to measure against, so those fall through to the
 * viewBox instead of being guessed at.
 * @param text - the attribute's text, or null when absent.
 * @returns the length in CSS pixels.
 */
function absoluteLength(text: string | null): number | undefined {
  if (text === null) return undefined
  const match = /^\s*([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)\s*([a-zA-Z%]*)\s*$/.exec(text)
  /* v8 ignore next -- an unparseable attribute is handled as no size at all. */
  if (match === null) return undefined
  const value = Number(match[1])
  // Group 2 matches the empty string for a unitless number, and `Number` on a matched
  // group is always finite; the one thing left to reject is a non-positive length.
  const scale = UNIT_PIXELS[(match[2] as string).toLowerCase()]
  if (scale === undefined || value <= 0) return undefined
  return value * scale
}

/**
 * Read one inline SVG's own size.
 *
 * An absolute unit is converted rather than stripped: a figure authored in `in`, `mm`
 * or `pt` was rendering 72× (or 3.78×) too small, with its strokes pinned to the unit
 * floor — which reads as a corrupt file rather than a mis-scaled one.
 * @param root - sanitized root element.
 * @returns the width/height from its attributes or viewBox, defaulting to 800x600.
 */
export function svgIntrinsicSize(root: SVGSVGElement): FigureIntrinsicSize {
  const attributeWidth = absoluteLength(root.getAttribute('width'))
  const attributeHeight = absoluteLength(root.getAttribute('height'))
  if (attributeWidth !== undefined && attributeHeight !== undefined) {
    return { width: attributeWidth, height: attributeHeight }
  }
  const viewBox = (root.getAttribute('viewBox') ?? '').split(/[\s,]+/).map(Number)
  const [, , boxWidth, boxHeight] = viewBox
  if (viewBox.length === 4 && boxWidth !== undefined && boxHeight !== undefined
    && Number.isFinite(boxWidth) && Number.isFinite(boxHeight) && boxWidth > 0 && boxHeight > 0) {
    return { width: boxWidth, height: boxHeight }
  }
  return { width: 800, height: 600 }
}

/** The `viewBox` an inline figure renders under. */
export function svgViewBox(root: SVGSVGElement, fallback: FigureIntrinsicSize): string {
  const declared = root.getAttribute('viewBox')
  if (declared !== null && declared.trim() !== '') return declared
  return `0 0 ${fallback.width} ${fallback.height}`
}

/** Shape elements that carry no area of their own. */
const NON_SHAPE_ELEMENTS = ['title', 'desc', 'defs', 'metadata', 'style', 'script']

/**
 * Whether an element sits inside a subtree that never renders.
 *
 * `defs`, `metadata`, and friends carry geometry that is never painted, so a
 * bounding box found there is not something the user can be pointing at.
 * @param element - candidate element.
 * @param root - the figure root the walk stops at.
 * @returns true when the element draws nothing.
 */
function isNonRendered(element: Element, root: Element): boolean {
  for (let node: Element | null = element; node !== null && node !== root; node = node.parentElement) {
    if (NON_SHAPE_ELEMENTS.includes(node.tagName.toLowerCase())) return true
  }
  return false
}

/**
 * The element a reader meant when they pointed at one of its parts.
 *
 * A figure is drawn through anonymous geometry: matplotlib puts a tick's line, its
 * label, and its number in one `<g id="xtick_1">`, and every one of those three is a
 * nameless `<path>`, `<use>`, or `<text>` inside it. Naming the part gives the source
 * reader nothing to open; naming the group that carries the id gives it the artist.
 * The same rule is why a Graphviz node's `<title>` counts — that is how Graphviz says
 * which node a shape belongs to.
 *
 * The walk stops at the container, so an id on the panel around the figure is never
 * mistaken for the figure's own.
 * @param hit - the element the browser says is painted under the pointer.
 * @param container - the element holding the figure, which is never the answer.
 * @returns the nearest ancestor-or-self that names itself, else the hit itself.
 */
function namingAncestor(hit: Element, container: Element): Element {
  for (let node: Element | null = hit; node !== null && node !== container; node = node.parentElement) {
    // A generated id names the area behind the artists, not an artist — matplotlib's
    // `patch_1` is the figure's own white sheet and `patch_2` the axes' — so a walk
    // that stopped on one would answer every click on blank paper with "the paper".
    // The walk goes on to the group those names hang under, which is what the reader
    // meant: the axes, or the figure's margin.
    if (isStableId(node.id) || node.querySelector(':scope > title') !== null) return node
  }
  return hit
}

/**
 * Whether an element is something a reader could mean to point at.
 *
 * Three things are ruled out. Anything outside the figure is not part of it — the same
 * document holds the overlay that carries the marks, and that overlay is above the
 * drawing, so it is the first thing every hit test finds. The figure root is the
 * surface rather than anything drawn on it. And elements inside `defs` are never
 * painted where they are declared, so a hit on one is a hit on whatever the
 * declaration was cloned into.
 *
 * There is deliberately no "covers the whole figure, so it must be the paper" rule
 * here, though an HTML document needs one. In a figure that rule is wrong: a trend
 * line drawn corner to corner has the whole figure for a bounding box, so judging the
 * sheet by extent would refuse to name the single most important line on the plot. The
 * browser's paint order already answers "is anything here", and a background that does
 * get picked is shown by the highlight before the click, so nothing is taken unseen.
 *
 * Everything else is fair game, including a `<path>`, a `<text>`, and the `<use>` a
 * marker or a tick is drawn through: those are what the figure is made of, and the
 * anchor re-points at whichever ancestor names itself.
 * @param element - candidate element.
 * @param root - the figure root.
 * @returns true when a reader could be pointing at this element.
 */
function isPickable(element: Element, root: Element): boolean {
  if (element === root) return false
  if (!root.contains(element)) return false
  return !isNonRendered(element, root)
}

function measuringHit(container: HTMLElement, root: Element, clientX: number, clientY: number): Element | undefined {
  let hit: Element | undefined
  let hitArea = Number.POSITIVE_INFINITY
  let hitDepth = -1
  for (const element of root.querySelectorAll('*')) {
    if (isNonRendered(element, root)) continue
    const rect = element.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) continue
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) continue
    const area = rect.width * rect.height
    const depth = depthBelow(element, container)
    if (area < hitArea || (area === hitArea && depth > hitDepth)) {
      hit = element
      hitArea = area
      hitDepth = depth
    }
  }
  return hit
}

/**
 * Describe the figure element under one client-space point.
 *
 * The browser answers which element covers the point, because only it knows the
 * painted geometry: a `<path>` that opens a hole in itself covers less than its
 * bounding box, and a sloped line covers almost none of the rectangle its ends span.
 * Measuring boxes instead would name that sloped line for a click far above it, which
 * is the one thing a reader annotating a plot would find most wrong.
 *
 * One thing the browser does not do is let a pick reach a stroke that is a pixel wide,
 * so the point is asked about together with the ring of points around it. And one
 * thing it cannot be asked is a shape with `fill="none"`, which is unpickable in its
 * interior by definition — but a figure is mostly exactly those shapes, so while the
 * question is being asked the figure's root is told to hit-test its geometry rather
 * than its pointer-events. The property only affects hit testing, never painting, and
 * it is put back before this function returns, so nothing an observer or the reader
 * can see is left changed.
 *
 * The hit is then re-pointed at the nearest ancestor that names itself (`id` or a
 * `<title>`, which is how Graphviz identifies a node), because a reader pointing at a
 * mark on a curve means the curve and not the path segment under one pixel.
 * @param container - element holding the inline figure, used as the coordinate origin.
 * @param clientX - pointer x in client space.
 * @param clientY - pointer y in client space.
 * @param scaleX - figure pixels per client pixel horizontally.
 * @param scaleY - figure pixels per client pixel vertically.
 * @returns the anchor, or undefined when the point names no figure element.
 */
export function anchorAtPoint(
  container: HTMLElement,
  clientX: number,
  clientY: number,
  scaleX: number,
  scaleY: number,
): MarkAnchor | undefined {
  const root = container.querySelector('svg')
  if (root === null) return undefined
  const frame = root.getBoundingClientRect()
  const hit = pickInFigure(container, root, frame, clientX, clientY, scaleX, scaleY)
  // Nothing painted under the pointer: a click on blank paper names nothing, rather
  // than falling back to the sheet it is blank on.
  if (hit === undefined) return undefined
  const described = namingAncestor(hit, container)
  const rect = described.getBoundingClientRect()
  const containerRect = container.getBoundingClientRect()
  const title = described.querySelector(':scope > title')?.textContent?.trim()
  // The element's descendants' words, kept apart. `textContent` would run them
  // together: an axes group holding four tick labels reported `0.00.51.0y label`.
  // `described` is `hit` or an ancestor of it, so its text already contains the hit's
  // own text; there is nothing to fall back to.
  const text = anchorTextOf(described)
  return {
    tag: described.tagName.toLowerCase(),
    bbox: [
      (rect.left - containerRect.left) * scaleX,
      (rect.top - containerRect.top) * scaleY,
      rect.width * scaleX,
      rect.height * scaleY,
    ],
    ...(described.id === '' ? {} : { id: described.id }),
    ...(title === undefined || title === '' ? {} : { title }),
    ...(text === '' ? {} : { text }),
    // The same locator an HTML mark carries, spelled against the figure's own root:
    // the panel's document wraps the figure, so a body-relative path would name the
    // panel's chrome rather than anything the source file contains.
    selector: selectorWithin(described, root),
  }
}

/**
 * The figure element painted under one client-space point.
 *
 * The browser is asked first, with the figure lending it the ability to hit-test
 * unfilled geometry for the duration of the question. When it cannot answer at all —
 * no hit testing in the engine — the boxes are measured instead.
 * @param container - element holding the inline figure.
 * @param root - the figure root.
 * @param frame - the box the figure is drawn in.
 * @param clientX - pointer x in client space.
 * @param clientY - pointer y in client space.
 * @param scaleX - figure pixels per client pixel horizontally.
 * @param scaleY - figure pixels per client pixel vertically.
 * @returns the element, or undefined when nothing is painted there.
 */
function pickInFigure(
  container: HTMLElement,
  root: Element,
  frame: DOMRect,
  clientX: number,
  clientY: number,
  scaleX: number,
  scaleY: number,
): Element | undefined {
  // The reach is stated in screen pixels, so it is converted to the figure's own
  // units: a magnified figure needs fewer of them to cover the distance the reader's
  // hand covers.
  const stack = pickStack(container.ownerDocument, clientX, clientY, PICK_REACH / Math.max(scaleX, scaleY))
  if (stack === null) return measuringHit(container, root, clientX, clientY)
  const painted = stack.find(element => isPickable(element, root))
  // A shape with `fill="none"` is invisible to the pointer, so the browser can only
  // report the sheet behind a hollow node — a Graphviz ellipse, a flowchart box. Only
  // when the browser named nothing does the fill geometry get asked, because a shape
  // that is painted has already answered and asking again could only overrule it.
  if (painted !== undefined) return painted
  return hollowAt(root, clientX, clientY)
}

/**
 * The innermost unfilled shape whose own interior contains a point.
 *
 * The half of the job the browser's hit testing cannot do, kept to the case where it
 * matters. Handing the figure `pointer-events: all` would also reach hollow shapes,
 * but it opens every *stroke* to the pointer at the same time: measured on a real
 * matplotlib figure, that changed one sampled point in five, and always for the
 * worse — a curve with no fill began answering for the tick groups drawn in front of
 * it. Asking each shape about its own fill area reaches the hollow node's middle and
 * leaves the rest of the figure exactly as the browser reported it.
 *
 * Innermost wins for the same reason it does in the box measurement: a reader pointing
 * inside a hollow frame means the thing inside it, and a later-drawn shape is in front
 * of an earlier one, so document order breaks ties.
 * @param root - the figure root.
 * @param clientX - pointer x in client space.
 * @param clientY - pointer y in client space.
 * @returns the shape, or undefined when no unfilled shape covers the point.
 */
function hollowAt(root: Element, clientX: number, clientY: number): Element | undefined {
  let found: Element | undefined
  let foundDepth = -1
  for (const shape of root.querySelectorAll('*')) {
    if (!coversInterior(shape, clientX, clientY)) continue
    const depth = depthBelow(shape, root)
    if (depth >= foundDepth) {
      found = shape
      foundDepth = depth
    }
  }
  return found
}
