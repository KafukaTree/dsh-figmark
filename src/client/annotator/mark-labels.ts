/**
 * How a mark is named in words, for the one place that writes a mark out as text:
 * the document's list of marks.
 *
 * Kept away from the drawing code because naming and drawing answer different
 * questions — the picture says where a mark is, this says what it is about — and
 * the two fallbacks should not have to be read together to be understood.
 * @module dsh-figmark/client/annotator/mark-labels
 */
import type { AnnotationMark } from '../../shared/annotation'

/**
 * What one mark's anchor names, most specific first.
 *
 * An inline SVG figure names itself through its `<title>`; a rendered document
 * has none, and names itself through its own text or its place in the document.
 * @param mark - the mark to name.
 * @returns the name, or an empty string when the mark points at no element.
 */
export function anchorName(mark: AnnotationMark): string {
  const anchor = mark.anchor
  if (anchor === undefined) return ''
  return [anchor.title, anchor.text, anchor.selector].find(value => value !== undefined && value !== '') ?? ''
}
