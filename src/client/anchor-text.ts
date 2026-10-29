/**
 * The words one element contributes to an annotation's anchor.
 *
 * An anchor names the thing the reader pointed at, and the name travels to the agent
 * in the annotation list. The element's own `textContent` is not that name: it is
 * every string inside the element run together, with nothing between one child's
 * text and the next. A matplotlib axes group holding `0.0`, `0.5`, `1.0` and `y
 * label` therefore reported `0.00.51.0y label` — four labels become one word, and a
 * reader (of the figure) cannot tell where the ticks stop and the axis title starts.
 *
 * Joined with a space between children instead, the same group reports `0.0 0.5 1.0
 * y label`, which is what the picture looks like. The element's *own* direct text is
 * kept adjacent to nothing, because that is how it is laid out: a `<text>` element
 * holding `t=4` has one string and must not be changed at all.
 *
 * Both figure kinds share this: an inlined SVG's elements and a rendered document's
 * elements report text the same way, and the two paths had drifted into two copies of
 * the same truncation rule before this module existed.
 * @module dsh-figmark/client/anchor-text
 */

/** Longest string an anchor carries, in characters. */
export const ANCHOR_TEXT_LIMIT = 80

/**
 * Collapse an element's text into one line, keeping its parts apart.
 *
 * Whitespace inside each text node is collapsed and the nodes are joined with a
 * single space, so adjacent labels stay distinguishable while the result is still
 * one string an annotation list can hold on one line. The result is truncated to
 * {@link ANCHOR_TEXT_LIMIT} so one deeply nested element cannot flood the message.
 * @param element - the element an anchor names.
 * @returns one line of its text, or an empty string when it holds none.
 */
export function anchorTextOf(element: Element): string {
  const parts: string[] = []
  // `firstChild`/`nextSibling` rather than `childNodes`: this walks the element's own
  // tree, text node by text node, and a `NodeList` iterator here would only add a
  // wrapper around the same walk.
  const walk = (node: Node): void => {
    for (let child = node.firstChild; child !== null; child = child.nextSibling) {
      if (child.nodeType === Node.TEXT_NODE) {
        // `nodeValue` is typed as nullable for every node kind, and a text node's is
        // its own data — never null. The cast says that once, here, rather than
        // teaching the reader of this function a fallback that cannot happen.
        const data = child.nodeValue as string
        const text = data.replace(/\s+/gu, ' ').trim()
        if (text !== '') parts.push(text)
      } else if (child.nodeType === Node.ELEMENT_NODE) walk(child)
    }
  }
  walk(element)
  return parts.join(' ').slice(0, ANCHOR_TEXT_LIMIT)
}
