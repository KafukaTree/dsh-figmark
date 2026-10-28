/**
 * Naming one element so that the name still finds it after the document is saved.
 *
 * An element mark says "this element", and the only thing that survives the panel
 * closing is a string. A path of `tag:nth-of-type(n)` steps is exact for the
 * document it was read from, and an `#id` is exact for as long as the source keeps
 * that id — which is why the walk prefers an id the moment it meets one: a
 * matplotlib figure names every artist it draws, and those names are the ones a
 * source reader can act on directly.
 *
 * Not every id survives, though. matplotlib names its artists two ways at once: the
 * artists a reader talks about get a stable name (`figure_1`, `axes_1`, `line2d_10`)
 * while the anonymous shapes it generates get a hash (`m4750a7a074`,
 * `p8305ee768d`) minted from a per-run salt. A hash is not a name — the next render
 * produces a different one — so a path that stops on it names nothing after the
 * figure is drawn again. Those ids are walked past, which leaves a positional path:
 * longer to read, but still pointing at the same element next time.
 *
 * Shared by both element surfaces. A rendered HTML document and an inline SVG live
 * in different documents, but the question is the same one and the answer has to
 * be spelled the same way, or two marks on the same element would stop being
 * comparable.
 * @module dsh-figmark/client/dom-path
 */

/**
 * Whether an id is a name the reader's source will still have tomorrow.
 *
 * Two ways to fail. A hash-shaped id (`m4750a7a074`) is minted per render, so it
 * identifies this drawing and nothing else. A framework's generated id (`el-42`,
 * `ember1234`, `:r1:`) is minted per mount, and though it may survive a reload it
 * will not survive an edit, which is the case that matters: the reader opens the
 * source, changes it, and the mark has to still resolve.
 *
 * A dotted id is kept: matplotlib really does emit `matplotlib.axes._axes.Axes`,
 * and rejecting dots would throw away a perfectly good name.
 * @param id - the element's id.
 * @returns true when the id is worth putting in a path.
 */
export function isStableId(id: string): boolean {
  if (id === '') return false
  // matplotlib's anonymous containers: the axes background, the legend frame, the
  // figure's own sheet. The name is regenerated every render, and worse, it always
  // means "the area behind the artists" rather than any artist — a reader pointing at
  // one is pointing at its group, so the walk goes on to the group.
  if (/^patch_\d+$/u.test(id)) return false
  // A long run of hex digits, with or without a one-letter matplotlib prefix, is the
  // shape both matplotlib and most bundlers use for something generated.
  if (/^[a-z]?[0-9a-f]{8,}$/iu.test(id)) return false
  // A framework's mount-scoped id: a known prefix then a number or a hash.
  if (/^(?:ember|ext-gen|yui_|react|radix|mui|rc-|el-|ant-|sc-|css-|jsx-)[\w-]*\d/iu.test(id)) return false
  // React's own `useId` shape, colons and all.
  if (/^:\w+:/u.test(id)) return false
  return true
}

/**
 * One id, spelled so that it can be pasted into a selector as it stands.
 *
 * An id is not free text: matplotlib emits `matplotlib.axis_1` and
 * `matplotlib.axes._axes.Axes`, both of which contain characters a bare `#id` cannot
 * carry. `CSS.escape` is the browser's own answer to this, but it does not exist in
 * every engine the specs run in, so the two characters that actually occur are
 * escaped here as well.
 * @param id - the element's id.
 * @returns a `#`-prefixed selector step.
 */
export function idStep(id: string): string {
  const escaped = typeof CSS !== 'undefined' && typeof CSS.escape === 'function' ? CSS.escape(id) : id.replace(/([^\w-])/gu, '\\$1')
  return `#${escaped}`
}

/**
 * How deep an element sits below an ancestor.
 *
 * Depth breaks ties between two boxes of the same area: the deeper one is the more
 * specific answer, and a reader pointing at a cell means the cell, not the row around
 * it that happens to have the same area.
 * @param element - the element to measure.
 * @param ancestor - the element the depth is counted from, exclusive.
 * @returns the number of parent steps between them.
 */
export function depthBelow(element: Element, ancestor: Element): number {
  let depth = 0
  for (let node = element.parentElement; node !== null && node !== ancestor; node = node.parentElement) depth += 1
  return depth
}

/**
 * One element's position among its same-name siblings, as a selector step.
 * @param element - the element to place.
 * @returns e.g. `g:nth-of-type(2)`.
 */
function positionStep(element: Element): string {
  const tag = element.tagName
  let position = 1
  for (let sibling = element.previousElementSibling; sibling !== null; sibling = sibling.previousElementSibling) {
    if (sibling.tagName === tag) position += 1
  }
  return `${tag.toLowerCase()}:nth-of-type(${position})`
}

/**
 * One element's path from the document body.
 *
 * Every step is exact for the document it was read from: a step is the element's
 * own `#id` where it has one worth keeping, and its position among same-name
 * siblings otherwise. The walk stops at the body — and says so — unless an `#id` made
 * the tail self-rooted: a bare `p:nth-of-type(1)` is body-relative but reads as
 * document-wide, which in a document with nested paragraphs names the wrong element.
 * `body > p:nth-of-type(1)` can be pasted into a query as it stands.
 *
 * @param element - the element to name.
 * @param body - the body the path is rooted at.
 * @returns a CSS path, usable as a selector in the document the element came from.
 */
export function selectorFor(element: Element, body: Element): string {
  const segments: string[] = []
  let rooted = false
  for (let current: Element | null = element; current !== null && current !== body; current = current.parentElement) {
    if (isStableId(current.id)) {
      segments.unshift(idStep(current.id))
      rooted = true
      break
    }
    segments.unshift(positionStep(current))
  }
  if (!rooted) segments.unshift('body')
  return segments.join(' > ')
}

/**
 * One element's path from the root of the figure it belongs to.
 *
 * The same walk as {@link selectorFor}, rooted at the `<svg>` element instead of
 * the document body. An inlined figure lives inside the panel's own document, so a
 * body-relative path would start with the panel's chrome and name nothing the
 * source file contains; rooted at the figure, the path is one the reader can paste
 * into the SVG's own source.
 *
 * An id ends the walk here too, and for a stronger reason: a matplotlib figure
 * names every artist it draws (`figure_1`, `axes_1`, `line2d_10`), and that name is
 * both shorter and stabler than any positional path through the same tree. An id
 * the figure generated rather than chose is walked past — see {@link isStableId}.
 *
 * @param element - the element to name.
 * @param root - the figure's root element, excluded from the path.
 * @returns a CSS path, usable as a selector inside the figure.
 */
export function selectorWithin(element: Element, root: Element): string {
  const segments: string[] = []
  let rooted = false
  for (let current: Element | null = element; current !== null && current !== root; current = current.parentElement) {
    if (isStableId(current.id)) {
      // An id is unique in the document, so the path is complete at that step: the
      // `svg` prefix would claim a nesting the id does not have.
      segments.unshift(idStep(current.id))
      rooted = true
      break
    }
    segments.unshift(positionStep(current))
  }
  // A positional path is relative to whatever contains it, so it is rooted at the
  // figure: nested in a step of its own, the same path means the same element in the
  // reader's own source file. A path that ended on an id needs no root.
  if (!rooted) segments.unshift(root.tagName.toLowerCase())
  return segments.join(' > ')
}
