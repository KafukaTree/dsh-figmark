/**
 * Which figure elements should be wearing the light, and why.
 *
 * Two different statements share one light, and neither is drawn by React: an
 * element *mark* keeps its light for as long as the mark exists — that is how a
 * placed element is drawn at all, since an element mark has no path of its own —
 * while the picker's preview lights whatever a click would take, on top of those.
 * The selected mark is lit harder.
 *
 * The list is built fresh on every call rather than patched in place: the marks
 * change, the figure is reloaded, and an accumulated list would keep lighting
 * elements that are no longer there. Turning a selector back into an element is the
 * caller's job, because only the body knows which document the figure's elements
 * live in — an inline SVG keeps them in the panel's own document, a rendered
 * document keeps them behind a frame whose policy keeps the panel's stylesheet out.
 * @module dsh-figmark/client/annotator/spotlights
 */
import type { AnnotationMark, MarkAnchor } from '../../shared/annotation'
import type { LitSpot } from '../spotlight'

/**
 * Every element the figure should be lit on right now.
 * @param input - the marks, the picker's preview, and the lookup to use.
 * @param input.marks - every mark the surface holds.
 * @param input.selectedId - the mark the reader picked out, if any.
 * @param input.preview - the element the picker is offering, if any.
 * @param input.findElement - turns an anchor's selector into an element, or
 *   undefined when the figure no longer has one by that name.
 * @returns what to light, in a stable enough order that the class work is minimal.
 */
export function collectLitSpots(input: {
  readonly marks: readonly AnnotationMark[]
  readonly selectedId: string | null | undefined
  readonly preview: MarkAnchor | undefined
  readonly findElement: (selector: string) => Element | undefined
}): readonly LitSpot[] {
  const spots: LitSpot[] = []
  const seen = new Set<Element>()
  for (const mark of input.marks) {
    const selector = mark.kind === 'element' ? mark.anchor?.selector : undefined
    if (selector === undefined) continue
    const element = input.findElement(selector)
    if (element === undefined || seen.has(element)) continue
    seen.add(element)
    spots.push({ element, selected: input.selectedId === mark.id })
  }
  const previewSelector = input.preview?.selector
  if (previewSelector !== undefined) {
    const element = input.findElement(previewSelector)
    // A preview over an element that already carries a mark just brightens it: two
    // classes on one element would be two statements about the same shape.
    if (element !== undefined && !seen.has(element)) {
      seen.add(element)
      spots.push({ element, selected: false })
    }
  }
  return spots
}
