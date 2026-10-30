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
 * The glow is the mark's own colour, not a fixed one. A blue glow is the panel's
 * colour, and a red mark lit blue says the two things are not the same thing; the
 * reader who picked red for a reason gets a picture where red is what glows. Writing
 * that as a rule per colour is what makes `filter` stay a stylesheet decision: the
 * colour rides on the element as an attribute, and the rules take it from there — one
 * rule per colour in use, rather than an inline `style` that would overwrite whatever
 * the figure's author wrote.
 *
 * The same rules are what the *delivered* picture uses: {@link lightMarkup} writes them
 * into the review SVG, so the picture the agent reads is lit exactly the way the
 * reader's own panel lit it. `filter`, and the `rgba()` inside it, survive the figure
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

/** The attribute a lit element carries its colour on, as a bare six-digit hex. */
const COLOUR_ATTR = 'data-da-spot-color'

/** The attribute that marks the `style` element this module writes, so it can be found. */
const STYLE_ATTR = 'data-da-spot'

/** The colours already written into that `style`, so a rule is never written twice. */
const STYLE_COLOURS_ATTR = 'data-da-spot-colours'

/** A colour this module can light with: six hex digits, with or without the hash. */
const COLOUR = /^#?([0-9a-f]{6})$/i

/**
 * The pale ring that separates the glow from whatever the element sits on.
 *
 * Over dark line work a glow alone vanishes into it, so the light is drawn as two
 * shadows: a pale ring first, then the colour. Both are at a fixed size rather than
 * following the figure's stroke weight, because this is the panel talking, not the
 * figure. Selected elements are lit harder rather than boxed: a dashed frame around
 * the element's box was what this used to draw, and it had exactly the failing the
 * light was introduced to fix. The reader already knows which mark is selected — the
 * comment pill opens on it and the list row is highlighted — so the picture only has
 * to say *brighter*.
 */
const PALE = 'drop-shadow(0 0 1.4px rgba(255,255,255,.95))'
const PALE_SELECTED = 'drop-shadow(0 0 1.8px rgba(255,255,255,1))'

/**
 * What an element glows in when its mark's colour cannot be read.
 *
 * A mark made by an older version, or by hand, may carry anything at all in its colour
 * field. Lighting it in a hue the panel invented would put the wrong colour into the
 * figure, so the fallback is ink: emphasis without a hue.
 */
const UNREADABLE = 'rgba(63,63,70,.9)'

/**
 * The colour as a selector-safe key, or `undefined` when it is not one this can light.
 * @param colour - a mark's colour, as the sidecar spells it.
 * @returns the six lowercase hex digits, or `undefined`.
 */
function colourKey(colour: string): string | undefined {
  return COLOUR.exec(colour)?.[1]?.toLowerCase()
}

/**
 * The key as an `rgba()` at the given alpha.
 * @param key - six hex digits, as {@link colourKey} returns them.
 * @param alpha - the opacity to write, as CSS spells it: `.95`, not `0.95`.
 * @returns the CSS colour.
 */
function rgba(key: string, alpha: string): string {
  const value = Number.parseInt(key, 16)
  return `rgba(${(value >> 16) & 0xff},${(value >> 8) & 0xff},${value & 0xff},${alpha})`
}

/**
 * What lit elements look like, with one rule per colour named.
 *
 * The colourless rules come first so they are the fallback, and a coloured rule
 * overrides them by carrying one more attribute in its selector.
 *
 * @param colours - the colours to write rules for; unreadable ones are skipped.
 * @returns the stylesheet text.
 */
export function spotRule(colours: readonly string[]): string {
  const light = (pale: string, radius: number, colour: string): string =>
    `{filter:${pale} drop-shadow(0 0 ${radius}px ${colour})}`
  const base = `.${SPOT_CLASS}${light(PALE, 3, UNREADABLE)}`
    + `.${SPOT_CLASS}.${SPOT_SELECTED_CLASS}${light(PALE_SELECTED, 5, UNREADABLE)}`
  const keys = colours
    .map(colour => colourKey(colour))
    .filter((key): key is string => key !== undefined)
  const unique = [...new Set(keys)]
  return base + unique
    .map(key => `.${SPOT_CLASS}[${COLOUR_ATTR}="${key}"]${light(PALE, 3, rgba(key, '.95'))}`
      + `.${SPOT_CLASS}.${SPOT_SELECTED_CLASS}[${COLOUR_ATTR}="${key}"]${light(PALE_SELECTED, 5, rgba(key, '1'))}`)
    .join('')
}

/** One element to light, in the mark's colour, and whether it wears the selected weight. */
export interface LitSpot {
  /** The element to light. */
  readonly element: Element
  /** The mark's colour, as a CSS colour string. */
  readonly colour: string
  /** Whether this element is the selected mark, which is lit harder. */
  readonly selected: boolean
}

/** An element named the way an anchor names it, and the colour to light it in. */
export interface NamedSpot {
  /** The element's name, as the anchor spells it. */
  readonly selector: string
  /** The mark's colour, as a CSS colour string. */
  readonly colour: string
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
 * Put the light on the named elements and take it off every other one.
 *
 * The whole set is handed in rather than one element at a time: a placed mark's light
 * lasts as long as the mark does and the picker's preview comes and goes on top of it,
 * so only the caller knows the complete answer. An empty list puts every light out.
 *
 * The class and the colour attribute are added and removed rather than a `style`
 * written and unwritten: an element's `style` attribute may belong to the figure's
 * author, and editing it would mean putting it back byte for byte. Neither a class nor
 * a `data-` attribute can be confused with anything the author wrote.
 *
 * The rules go into each element's own document, because the figure's elements are not
 * always in the panel's: a rendered document is a document of its own.
 *
 * @param previous - the elements lit last time, if any.
 * @param next - the elements to light now.
 * @returns the elements lit now, to be handed back next time.
 */
export function moveSpotlight(previous: readonly LitSpot[], next: readonly LitSpot[]): readonly LitSpot[] {
  const coloursOf = new Map<Document, string[]>()
  for (const spot of next) {
    const document_ = spot.element.ownerDocument
    /* v8 ignore next -- an element that exists has always had an owner document. */
    if (document_ === null) continue
    const colours = coloursOf.get(document_) ?? []
    colours.push(spot.colour)
    coloursOf.set(document_, colours)
  }
  for (const [document_, colours] of coloursOf) ensureSpotlight(document_, colours)
  const keeps = new Set(next.map(spot => spot.element))
  for (const spot of previous) {
    if (keeps.has(spot.element)) continue
    spot.element.classList.remove(SPOT_CLASS, SPOT_SELECTED_CLASS)
    spot.element.removeAttribute(COLOUR_ATTR)
  }
  for (const spot of next) {
    const key = colourKey(spot.colour)
    spot.element.classList.add(SPOT_CLASS)
    spot.element.classList.toggle(SPOT_SELECTED_CLASS, spot.selected)
    if (key === undefined) spot.element.removeAttribute(COLOUR_ATTR)
    else spot.element.setAttribute(COLOUR_ATTR, key)
  }
  return next
}

/**
 * Add the light's rules to a document, once per colour.
 *
 * A rendered document runs under a policy that forbids scripts and allows inline
 * styles, and it is its own document, so the panel's stylesheet cannot reach into it:
 * a `style` element in the figure's document is the only place a rule for it can be
 * written. Idempotent, because the light is asked for on every pointer move, and
 * additive, because each call knows only the colours it is about: rules already
 * written stay, so alternating between two lit elements does not rewrite the sheet.
 *
 * @param document_ - the document the elements to light live in.
 * @param colours - the colours the caller is about to light, if any.
 */
export function ensureSpotlight(document_: Document, colours: readonly string[] = []): void {
  const existing = document_.querySelector(`style[${STYLE_ATTR}]`)
  const style = existing ?? document_.createElement('style')
  if (existing === null) {
    style.setAttribute(STYLE_ATTR, '')
    // Into the head when there is one — a document built from a fragment may have none,
    // and then the root is the only place left. First, so any rule the author wrote on
    // the same element still wins everything but this filter.
    const parent = document_.head ?? document_.documentElement
    parent.insertBefore(style, parent.firstChild)
  }
  const written = (style.getAttribute(STYLE_COLOURS_ATTR) ?? '').split(',').filter(key => key !== '')
  const added = colours
    .map(colour => colourKey(colour))
    .filter((key): key is string => key !== undefined && !written.includes(key))
  if (added.length === 0 && existing !== null) return
  const all = [...written, ...new Set(added)]
  style.textContent = spotRule(all)
  style.setAttribute(STYLE_COLOURS_ATTR, all.join(','))
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
 * @param spots - the elements to light, as their anchors name them, and their colours.
 * @returns the same figure with the light written into it.
 */
export function lightMarkup(markup: string, spots: readonly NamedSpot[]): string {
  if (spots.length === 0) return markup
  const parsed = new DOMParser().parseFromString(markup, 'image/svg+xml')
  const root = parsed.documentElement
  if (parsed.querySelector('parsererror') !== null || root.tagName.toLowerCase() !== 'svg') return markup
  const lit: Element[] = []
  const colours: string[] = []
  for (const spot of spots) {
    const element = elementAt({ root, selector: spot.selector })
    if (element === undefined || lit.includes(element)) continue
    const key = colourKey(spot.colour)
    element.classList.add(SPOT_CLASS)
    if (key === undefined) element.removeAttribute(COLOUR_ATTR)
    else element.setAttribute(COLOUR_ATTR, key)
    lit.push(element)
    colours.push(spot.colour)
  }
  if (lit.length === 0) return markup
  const style = parsed.createElementNS('http://www.w3.org/2000/svg', 'style')
  style.textContent = spotRule(colours)
  root.insertBefore(style, root.firstChild)
  return new XMLSerializer().serializeToString(root)
}

/** The class this module puts on a lit element. */
export const SPOTLIGHT_CLASS = SPOT_CLASS

/** The class a lit element wears while it is the selected mark. */
export const SPOTLIGHT_SELECTED_CLASS = SPOT_SELECTED_CLASS
