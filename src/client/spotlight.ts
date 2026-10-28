/**
 * The light an element mark — and the picker that places one — shines on the element.
 *
 * A corner bracket around an element's box says where the element is but not what it
 * is. On a curve, a tick, a legend entry or a label, the box is a rectangle the figure
 * never draws — it can cover half a plot. Lighting the element itself is the same
 * promise said in the figure's own shapes: the reader sees the curve glow, the glyphs
 * glow, the legend's own frame glow, and knows which of them is meant.
 *
 * The light is `filter: drop-shadow` on the element itself. A drop shadow follows the
 * alpha channel of whatever is painted, so one rule covers every kind of element — a
 * stroked path, filled text, a filled patch, a group of all three — without this
 * module knowing any of their geometry. Stroking the element instead would paint over
 * the artist's own colour, which is the one thing the reader is looking at.
 *
 * The same rule is what the *delivered* picture uses: {@link lightMarkup} writes it
 * into the review SVG, so the picture the agent reads is lit exactly the way the
 * reader's own panel lit it. `filter`, and the `var()` inside it, survive the figure
 * being serialized and then decoded as an image, which is the whole of the export
 * path — measured in a browser rather than assumed.
 *
 * The elements live in different documents depending on the figure: an inline SVG's
 * are inside the panel's own document, and a rendered document's are inside its frame.
 * Both are reached the same way — a root to search and the selector the anchor already
 * carries — so one function serves both, and the caller says only where to look.
 * @module dsh-figmark/client/spotlight
 */

/** The class the light hangs on, so it can be taken off without knowing what wore it. */
const SPOT_CLASS = 'da-spot'

/** The class a lit element wears when it is also the selected mark. */
const SPOT_SELECTED_CLASS = 'da-spot-selected'

/**
 * What a lit element looks like.
 *
 * Two shadows rather than one: a pale ring that separates the glow from whatever the
 * element sits on (over dark line work a blue glow alone vanishes into it), then the
 * blue itself. Both are drawn at a fixed size rather than following the figure's
 * stroke weight, because this is the panel talking, not the figure.
 *
 * Selected elements are lit harder rather than boxed. A dashed frame around the
 * element's box was what this used to draw, and it had exactly the failing the light
 * was introduced to fix: on a curve the frame is a rectangle the figure never draws.
 * The reader already knows which mark is selected — the comment pill opens on it and
 * the list row is highlighted — so the picture only has to say *brighter*.
 */
export const SPOT_RULE = `.${SPOT_CLASS}{`
  + 'filter:drop-shadow(0 0 1.4px rgba(255,255,255,.95))'
  + ' drop-shadow(0 0 3px rgba(76,141,255,.95))}'
  + `.${SPOT_CLASS}.${SPOT_SELECTED_CLASS}{`
  + 'filter:drop-shadow(0 0 1.8px rgba(255,255,255,1))'
  + ' drop-shadow(0 0 5px rgba(76,141,255,1))}'

/** One element to light, and whether it wears the selected weight. */
export interface LitSpot {
  /** The element to light. */
  readonly element: Element
  /** Whether this element is the selected mark, which is lit harder. */
  readonly selected: boolean
}

/** Where the light is looked for, and how the elements are named there. */
export interface SpotlightTarget {
  /** The element or document the selectors are resolved against. */
  readonly root: ParentNode
  /** One selector per element to light, as the anchors carry them. */
  readonly selectors: readonly string[]
}

/**
 * Find the element one selector names inside a root.
 *
 * A selector that does not parse, or that matches nothing, is not an error: the figure
 * may have been reloaded since the anchor was taken, and a figure with no light is
 * still a usable figure. `querySelector` itself throws on a broken selector, hence the
 * guard here rather than a `try` at every call site.
 *
 * @param target - the root to search and the selector to search for.
 * @returns the element, or `undefined` when nothing in the root answers that name.
 */
export function elementAt(target: { readonly root: ParentNode; readonly selector: string }): Element | undefined {
  try {
    return target.root.querySelector(target.selector) ?? undefined
  } catch {
    // A selector that no longer parses. Nothing to light, which the caller handles.
    return undefined
  }
}

/**
 * Find the elements a list of selectors names inside a root.
 *
 * The same forgiving read as {@link elementAt}, for the export pass: an element that
 * cannot be found contributes no light and the picture is still delivered.
 *
 * @param target - the root to search and the selectors to search for.
 * @returns whatever elements answered, in the order they were named.
 */
export function elementsAt(target: SpotlightTarget): readonly Element[] {
  const found: Element[] = []
  for (const selector of target.selectors) {
    const element = elementAt({ root: target.root, selector })
    if (element !== undefined && !found.includes(element)) found.push(element)
  }
  return found
}

/**
 * Put the light on the named elements and take it off every other one.
 *
 * The whole set is handed in rather than one element at a time: a placed mark's light
 * lasts as long as the mark does and the picker's preview comes and goes on top of it,
 * so only the caller knows the complete answer. An empty list puts every light out.
 *
 * The class is added and removed rather than a `style` written and unwritten: an
 * element's `style` attribute may belong to the figure's author, and editing it would
 * mean putting it back byte for byte. A class cannot be confused with anything the
 * author wrote.
 *
 * @param previous - the elements lit last time, if any.
 * @param next - the elements to light now.
 * @returns the elements lit now, to be handed back next time.
 */
export function moveSpotlight(previous: readonly LitSpot[], next: readonly LitSpot[]): readonly LitSpot[] {
  const keeps = new Set(next.map(spot => spot.element))
  for (const spot of previous) {
    if (keeps.has(spot.element)) continue
    spot.element.classList.remove(SPOT_CLASS, SPOT_SELECTED_CLASS)
  }
  for (const spot of next) {
    spot.element.classList.add(SPOT_CLASS)
    spot.element.classList.toggle(SPOT_SELECTED_CLASS, spot.selected)
  }
  return next
}

/**
 * Add the light's rule to a document, once.
 *
 * A rendered document runs under a policy that forbids scripts and allows inline
 * styles, and it is its own document, so the panel's stylesheet cannot reach into it:
 * a `style` element in the figure's document is the only place a rule for it can be
 * written. Idempotent, because the light is asked for on every pointer move.
 *
 * @param document_ - the document the elements to light live in.
 */
export function ensureSpotlight(document_: Document): void {
  if (document_.querySelector(`style[data-${SPOT_CLASS}]`) !== null) return
  const style = document_.createElement('style')
  style.setAttribute(`data-${SPOT_CLASS}`, '')
  style.textContent = SPOT_RULE
  // Into the head when there is one — a document built from a fragment may have none,
  // and then the root is the only place left. First, so any rule the author wrote on
  // the same element still wins everything but this filter.
  const parent = document_.head ?? document_.documentElement
  parent.insertBefore(style, parent.firstChild)
}

/**
 * Write the light into figure markup, for the picture the reader hands over.
 *
 * The review image is the figure's own SVG with the marks drawn on top of it, built as
 * one standalone document and then rasterized. An element mark's light has to be part
 * of that document, or the agent would be sent the bracket the reader just stopped
 * seeing: the light is a `filter` on the figure's own element, so it is written where
 * that element is, in this picture's copy of the figure.
 *
 * Nothing here restyles the reader's file. The markup handed in is already the
 * sanitized copy that was inlined into the panel, and the result is a string that only
 * ever becomes the exported image.
 *
 * @param markup - the figure's sanitized SVG source.
 * @param selectors - the elements to light, as their anchors name them.
 * @returns the same figure with the light written into it.
 */
export function lightMarkup(markup: string, selectors: readonly string[]): string {
  if (selectors.length === 0) return markup
  const parsed = new DOMParser().parseFromString(markup, 'image/svg+xml')
  const root = parsed.documentElement
  if (parsed.querySelector('parsererror') !== null || root.tagName.toLowerCase() !== 'svg') return markup
  const lit = elementsAt({ root, selectors })
  if (lit.length === 0) return markup
  for (const element of lit) element.classList.add(SPOT_CLASS)
  const style = parsed.createElementNS('http://www.w3.org/2000/svg', 'style')
  style.textContent = SPOT_RULE
  root.insertBefore(style, root.firstChild)
  return new XMLSerializer().serializeToString(root)
}

/** The class this module puts on a lit element. */
export const SPOTLIGHT_CLASS = SPOT_CLASS

/** The class a lit element wears while it is the selected mark. */
export const SPOTLIGHT_SELECTED_CLASS = SPOT_SELECTED_CLASS
