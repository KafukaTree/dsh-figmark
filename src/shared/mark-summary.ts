/**
 * The sentences a saved annotation is described in.
 *
 * This is the wording the model reads: every mark as one numbered line, the figure's
 * scope, and how far a mark reaches outside the picture. It is deliberately apart
 * from `./annotation`, which is the schema a writer persists — a writer that only
 * stores marks must not carry the phrases, and the phrases must be free to change
 * without touching a sidecar field.
 *
 * Two rules hold the wording together. A mark's detail is the only field that says
 * what to change, so a mark without one still gets a line that names its position:
 * the list staying numbered and complete is what lets the agent point at the mark it
 * cannot act on. And every line is written in the message's own language, brackets
 * included — a Chinese message dotted with half-width punctuation, or the reverse,
 * reads like a translation that lost its last pass.
 * @module dsh-figmark/shared/mark-summary
 */
import type { AnnotatedFigure, AnnotationDocument, AnnotationMark, FigurePoint, SummaryLocale } from './annotation'

/**
 * Describe how many pages a paged figure has.
 * @param figure - the annotated figure.
 * @param locale - language of the surrounding message.
 * @returns the scope in words, or an empty string for a single-surface figure.
 */
export function describeFigureScope(figure: AnnotatedFigure, locale: SummaryLocale): string {
  if (figure.pageCount === undefined) return ''
  return locale === 'zh' ? `共 ${figure.pageCount} 页` : `${figure.pageCount} pages`
}

/** Round one figure coordinate for model-facing text. */
function round(value: number): number {
  return Math.round(value)
}

/**
 * Write a freehand stroke's extent as the box it was drawn in.
 *
 * The stroke itself is dozens of coordinates, most of which say nothing an agent
 * can act on; the box says where on the figure to look, which is what the reading
 * of the mark needs. `strokeExtents` names the area, and the phrase above it names
 * the mark, so the pair still reads as one line.
 * @param points - the stroke's sampled points.
 * @returns the box as ` (x,y)-(x,y)`, or nothing for an empty stroke.
 */
function strokeExtents(points: readonly FigurePoint[]): string {
  let left = Number.POSITIVE_INFINITY
  let top = Number.POSITIVE_INFINITY
  let right = Number.NEGATIVE_INFINITY
  let bottom = Number.NEGATIVE_INFINITY
  for (const [x, y] of points) {
    left = Math.min(left, x)
    top = Math.min(top, y)
    right = Math.max(right, x)
    bottom = Math.max(bottom, y)
  }
  // A stroke with no points has no box, and saying so is the honest answer: the
  // infinities above would otherwise be printed as coordinates.
  if (!Number.isFinite(left)) return ''
  return ` (${round(left)},${round(top)})-(${round(right)},${round(bottom)})`
}

/**
 * Write two dragged corners as the rectangle they make.
 *
 * A box dragged up and to the left arrives as (bottom-right, top-left), and the
 * agent reading `(187,138)-(42,88)` has to take a min and a max before it knows
 * which area is meant. Both corners are therefore written left-to-right and
 * top-to-bottom, so the same box always reads the same way however it was drawn.
 * @param first - where the drag started.
 * @param second - where it ended.
 * @returns the corner pair as `(x,y)-(x,y)`, or nothing when the mark is unplaced.
 */
function extents(first: FigurePoint | undefined, second: FigurePoint | undefined): string {
  if (first === undefined || second === undefined) return ''
  const left = round(Math.min(first[0], second[0]))
  const top = round(Math.min(first[1], second[1]))
  const right = round(Math.max(first[0], second[0]))
  const bottom = round(Math.max(first[1], second[1]))
  return ` (${left},${top})-(${right},${bottom})`
}

/**
 * Say how far a mark reaches outside the figure, when it does.
 *
 * A negative coordinate is an accurate description — the origin is the figure's
 * top-left corner, so -57 is 57 pixels above it — but a reader has to notice the
 * sign and then reason about what it implies. Naming the overhang outright costs
 * about a dozen characters and removes that step: the agent is told the mark is
 * off the picture and by how much, rather than being left to infer it. A mark that
 * sits inside the figure says nothing at all, which is the common case.
 * @param mark - the mark to measure.
 * @param figure - the figure's size, when the document knows it.
 * @param locale - language of the surrounding message.
 * @returns the sentence fragment to append, or nothing when the mark is inside.
 */
function overhang(
  mark: AnnotationMark,
  figure: AnnotatedFigure,
  locale: SummaryLocale,
): string {
  const { width, height } = figure
  if (width === undefined || height === undefined) return ''
  // An empty point list needs no early return: the bounds stay infinite, every
  // side then rounds to a non-positive overhang, and the assembled list is empty.
  let left = Number.POSITIVE_INFINITY
  let top = Number.POSITIVE_INFINITY
  let right = Number.NEGATIVE_INFINITY
  let bottom = Number.NEGATIVE_INFINITY
  for (const [x, y] of mark.points) {
    left = Math.min(left, x)
    top = Math.min(top, y)
    right = Math.max(right, x)
    bottom = Math.max(bottom, y)
  }
  // A mark that rounds to zero past the edge is on the edge: saying "right 0 px"
  // would put a number where there is no overhang to name.
  const escape = (amount: number, zhWord: string, enWord: string): string => {
    const pixels = round(amount)
    if (pixels <= 0) return ''
    return locale === 'zh' ? `${zhWord} ${pixels}` : `${enWord} ${pixels}`
  }
  const escapes = [
    escape(-left, '左', 'left'),
    escape(-top, '上', 'up'),
    escape(right - width, '右', 'right'),
    escape(bottom - height, '下', 'down'),
  ].filter(part => part !== '')
  if (escapes.length === 0) return ''
  return locale === 'zh'
    ? `（超出图面：${escapes.join('、')} 像素）`
    : ` (off the figure: ${escapes.join(', ')} px)`
}

/** Describe one mark's shape in words, for the model-facing summary. */
function describeShape(mark: AnnotationMark, locale: SummaryLocale): string {
  const [first, second] = mark.points
  const zh = locale === 'zh'
  const turned = mark.rotation === undefined || mark.rotation === 0
    ? ''
    : (zh ? `（旋转 ${Math.round(mark.rotation)}°）` : ` (rotated ${Math.round(mark.rotation)}°)`)
  switch (mark.kind) {
    case 'arrow':
      return first !== undefined && second !== undefined
        ? (zh ? `箭头 (${round(first[0])},${round(first[1])}) → (${round(second[0])},${round(second[1])})${turned}`
          : `arrow (${round(first[0])},${round(first[1])}) → (${round(second[0])},${round(second[1])})${turned}`)
        : (zh ? '箭头' : 'arrow')
    case 'rect':
      return (zh ? '框选' : 'box') + extents(first, second) + turned
    case 'ellipse':
      return (zh ? '圈选' : 'ellipse') + extents(first, second) + turned
    case 'pen': {
      // A stroke's point count says nothing about where it is: a reader told only
      // "37 points" cannot find the line on the figure at all. Its box is the one
      // thing that locates it, and it costs no more than the count did.
      const box = strokeExtents(mark.points)
      const noun = zh ? '手绘线' : 'freehand stroke'
      return `${noun}${box}${turned}`
    }
    case 'point':
      return first !== undefined
        ? (zh ? `单点位于 (${round(first[0])},${round(first[1])})` : `at (${round(first[0])},${round(first[1])})`)
        : (zh ? '单点' : 'a point')
    case 'element':
      // The box is carried so the mark can be found on the picture, but it is not
      // what the mark is about: the anchor that follows this phrase names the
      // element, and naming the box first would invite the agent to read a region
      // where the reader meant a thing.
      return `${zh ? '选中元素' : 'element'}${extents(first, second)}`
  }
}

/** Describe what a mark points at, when the figure exposed an element. */
function describeAnchor(mark: AnnotationMark, locale: SummaryLocale): string {
  const anchor = mark.anchor
  if (anchor === undefined) return ''
  const zh = locale === 'zh'
  const parts: string[] = []
  if (anchor.title !== undefined && anchor.title !== '') parts.push(zh ? `元素标题「${anchor.title}」` : `element title "${anchor.title}"`)
  if (anchor.id !== undefined && anchor.id !== '') parts.push(zh ? `id=${anchor.id}` : `id=${anchor.id}`)
  if (anchor.text !== undefined && anchor.text !== '') parts.push(zh ? `元素文字「${anchor.text}」` : `element text "${anchor.text}"`)
  if (anchor.selector !== undefined && anchor.selector !== '') parts.push(zh ? `选择器 ${anchor.selector}` : `selector ${anchor.selector}`)
  if (parts.length === 0) parts.push(`<${anchor.tag}>`)
  // The parentheses follow the message's own language: an English message dotted with
  // full-width brackets reads like a translation that lost its last pass.
  return zh ? `（${parts.join('，')}）` : ` (${parts.join(', ')})`
}

/**
 * Render one mark as a numbered line the model reads.
 *
 * A mark carries one string: what should change here. It is the whole payload —
 * the shape only says where. A mark that says nothing still names its position,
 * so the list stays numbered and the agent can say which mark is mute.
 *
 * @param mark - the mark to describe.
 * @param index - zero-based position in the document, rendered as a circled number.
 * @param locale - language of the surrounding message.
 * @param figure - the figure these marks belong to, when its size is known; a mark
 *   that reaches past it then says so rather than leaving the sign to be noticed.
 * @returns one line of the annotation summary.
 */
/**
 * One note, on one line.
 *
 * The list this feeds is read one mark per line, and the note is typed into a field
 * that accepts a Return — so a note in three lines became three lines of list, the
 * second and third without a marker. To the agent that is not "one mark, three
 * lines", it is "a mark, then two lines of something", and a mark the reader numbered
 * is answered twice or not at all. The line break is the reader's; the shape of the
 * list belongs to the message, so the break is folded here rather than refused at the
 * field — a wrapped note is still readable prose, a broken list is not.
 * @param detail - the note as the reader typed it, whitespace and newlines included.
 * @returns the note as one line, or an empty string when there is no note.
 */
function flattenNote(detail: string | undefined): string {
  if (detail === undefined) return ''
  // Runs of whitespace become one space each: a note pasted out of a terminal is
  // usually indented, and a line's worth of indentation in the middle of a sentence
  // reads as a wrap that was never there.
  return detail.replace(/\s+/gu, ' ').trim()
}

export function describeMark(
  mark: AnnotationMark,
  index: number,
  locale: SummaryLocale,
  figure?: AnnotatedFigure,
): string {
  const zh = locale === 'zh'
  const marker = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'][index] ?? `${index + 1}.`
  // A mark that names a page carries it, so one numbered list can span the pages
  // of a document without its coordinates becoming ambiguous.
  const page = mark.page === undefined ? '' : (zh ? `第 ${mark.page} 页 ` : `page ${mark.page} `)
  const detail = flattenNote(mark.detail)
  const escape = figure === undefined ? '' : overhang(mark, figure, locale)
  const parts: string[] = [`${marker} ${page}${describeShape(mark, locale)}${describeAnchor(mark, locale)}${escape}`]
  if (detail !== '') parts.push(zh ? `批注：${detail}` : `note: ${detail}`)
  if (detail === '') parts.push(zh ? '（未写说明）' : '(no detail)')
  return parts.join(zh ? '，' : ', ')
}

/**
 * Render every mark as the numbered list carried into the Session.
 * @param document - the saved annotation document.
 * @param locale - language of the surrounding message.
 * @returns one line per mark.
 */
export function describeMarks(document: AnnotationDocument, locale: SummaryLocale): string[] {
  return document.marks.map((mark, index) => describeMark(mark, index, locale, document.figure))
}
