/**
 * The sentences a saved annotation is described in.
 *
 * This is the wording the model reads: every mark as one numbered line, the figure's
 * scope, and how far a mark reaches outside the picture. It is deliberately apart
 * from `./annotation`, which is the schema a writer persists — a writer that only
 * stores marks must not carry the phrases, and the phrases must be free to change
 * without touching a sidecar field.
 *
 * A mark's line starts with its *name*: the kind of mark it is and its number among
 * marks of that kind ("箭头1", "矩形2", "单点1 位于 (40,60)"). That is the same number
 * the picture draws beside the same mark, so the reader looking at the figure and the
 * agent reading the message can say the same thing about it. One counter for the
 * whole file could not: a circled ③ is a number nobody can find on a picture that
 * carries a pin, an arrow and a box.
 *
 * Two rules hold the wording together. A mark's detail is the only field that says
 * what to change, so a mark without one still gets a line that names its position:
 * the list staying numbered and complete is what lets the agent point at the mark it
 * cannot act on. And every line is written in the message's own language, brackets
 * included — a Chinese message dotted with half-width punctuation, or the reverse,
 * reads like a translation that lost its last pass.
 * @module dsh-figmark/shared/mark-summary
 */
import type {
  AnnotatedFigure, AnnotationDocument, AnnotationMark, FigurePoint, MarkAnchor, MarkKind, SummaryLocale,
} from './annotation'
import { PAPER_COVERAGE, markOrdinals } from './annotation'

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
 * The noun one kind of mark is called.
 *
 * The names are what the reader calls the shapes on the toolbar, not the names this
 * code uses: a box is a 矩形, not a "框选", because the thing on the picture is a
 * rectangle and the reader is being told which rectangle to look at.
 * @param kind - the mark's kind.
 * @param locale - language of the surrounding message.
 * @returns the noun, without the number that follows it.
 */
function kindName(kind: MarkKind, locale: SummaryLocale): string {
  const zh = locale === 'zh'
  switch (kind) {
    case 'arrow': return zh ? '箭头' : 'arrow'
    case 'rect': return zh ? '矩形' : 'box'
    case 'ellipse': return zh ? '椭圆' : 'ellipse'
    case 'pen': return zh ? '手绘线' : 'freehand stroke'
    case 'point': return zh ? '单点' : 'point'
    case 'element': return zh ? '元素' : 'element'
  }
}

/**
 * One mark's name: its kind and its number among marks of that kind.
 *
 * Chinese runs the two together ("箭头1"); English needs the space ("arrow 1"). The
 * number is the one the picture carries, so this is the phrase a reader can point at.
 * @param mark - the mark being named.
 * @param ordinal - its 1-based position among marks of its own kind.
 * @param locale - language of the surrounding message.
 * @returns the name as it is written at the start of the mark's line.
 */
function markName(mark: AnnotationMark, ordinal: number, locale: SummaryLocale): string {
  const noun = kindName(mark.kind, locale)
  return locale === 'zh' ? `${noun}${ordinal}` : `${noun} ${ordinal}`
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

/**
 * Describe one mark's geometry after its name, for the model-facing summary.
 *
 * The name has already said what the mark is, so this says only where: a leading
 * space keeps it a separate word when it survives, and an empty string keeps the
 * line readable when there is no geometry to add.
 * @param mark - the mark to describe.
 * @param locale - language of the surrounding message.
 * @returns the fragment that follows the mark's name, possibly empty.
 */
function describeGeometry(mark: AnnotationMark, locale: SummaryLocale): string {
  const [first, second] = mark.points
  const zh = locale === 'zh'
  const turned = mark.rotation === undefined || mark.rotation === 0
    ? ''
    : (zh ? `（旋转 ${Math.round(mark.rotation)}°）` : ` (rotated ${Math.round(mark.rotation)}°)`)
  switch (mark.kind) {
    case 'arrow':
      return first !== undefined && second !== undefined
        ? ` (${round(first[0])},${round(first[1])}) → (${round(second[0])},${round(second[1])})${turned}`
        : turned
    case 'rect':
      return extents(first, second) + turned
    case 'ellipse':
      return extents(first, second) + turned
    // A stroke's point count says nothing about where it is: a reader told only
    // "37 points" cannot find the line on the figure at all. Its box is the one
    // thing that locates it, and it costs no more than the count did.
    case 'pen':
      return strokeExtents(mark.points) + turned
    case 'point':
      return first === undefined
        ? ''
        : (zh ? ` 位于 (${round(first[0])},${round(first[1])})` : ` at (${round(first[0])},${round(first[1])})`)
    case 'element':
      // The box is carried so the mark can be found on the picture, but it is not
      // what the mark is about: the anchor that follows this phrase names the
      // element, and naming the box first would invite the agent to read a region
      // where the reader meant a thing.
      return extents(first, second)
  }
}

/**
 * Longest element text that still reads as a name rather than a passage.
 *
 * The anchor carries whatever words the element holds, capped for the sidecar. On a
 * matplotlib SVG a group holds every label under it, so the text of the axes is the
 * tick values, both axis titles and the legend run together — twice the length of
 * the sentence it would push onto the mark's line. A name is a label ("导柱", "保存");
 * anything past this is a passage, and the selector or id already locates the element.
 */
const NAMEABLE_TEXT = 30

/**
 * Whether an anchor names the whole picture rather than something in it.
 *
 * A mark that lands on a figure's root element names the sheet itself, which the
 * message has already named in its header. On a matplotlib figure that anchor also
 * carries the concatenation of every label in the picture, so the line spends its
 * whole length saying "this figure" a second time. An `element` mark keeps its anchor
 * even then: there, the anchor *is* the mark, and the box is just where it sits.
 * @param anchor - the element the mark landed on.
 * @param figure - the figure's size, when the document knows it.
 * @returns true when the anchor covers essentially the whole figure.
 */
function namesThePicture(anchor: MarkAnchor, figure: AnnotatedFigure | undefined): boolean {
  if (figure === undefined) return false
  const { width, height } = figure
  if (width === undefined || height === undefined) return false
  return anchor.bbox[2] >= width * PAPER_COVERAGE && anchor.bbox[3] >= height * PAPER_COVERAGE
}

/**
 * The words an anchor names its element with, if it has any.
 *
 * A title first (a Graphviz node's `102` is the name the source uses), then the
 * element's own text when it is short enough to be a name. An `id` is deliberately not
 * one of them: the ids on a matplotlib SVG — `axes_1`, `line2d_11`, `figure_1` — are
 * minted by the exporter and appear nowhere in the script the agent edits, so naming
 * one only adds a word the reader has to decode.
 * @param anchor - the element the mark landed on.
 * @returns the name in words, or an empty string when the anchor has none.
 */
export function anchorWords(anchor: MarkAnchor): string {
  if (anchor.title !== undefined && anchor.title !== '') return anchor.title
  const text = anchor.text ?? ''
  return text !== '' && text.length <= NAMEABLE_TEXT ? text : ''
}

/**
 * Whether a selector is nothing but an element's id with a `#` in front.
 *
 * `#axes_1` says what the id says; a path such as `#s > p:nth-of-type(1)` says where in
 * the source to look. Only the second is worth printing.
 * @param selector - the anchor's CSS path.
 * @returns true when the selector carries no path beyond the id.
 */
function namesOnlyItsId(selector: string): boolean {
  return /^#[\w-]+$/u.test(selector)
}

/**
 * Describe what a mark points at, when the figure exposed an element.
 *
 * Only the names that still say something are kept: a title, a short element text, or a
 * selector that locates the element in the source. Ids are never printed, element text
 * long enough to be a paragraph is not a name, and an anchor that can offer nothing but
 * a tag name is dropped whole — `（<g>）` located nothing.
 * @param mark - the mark whose anchor is described.
 * @param locale - language of the surrounding message.
 * @param figure - the figure's size, when the document knows it.
 * @returns the bracketed fragment, or nothing when the anchor adds no name.
 */
function describeAnchor(mark: AnnotationMark, locale: SummaryLocale, figure?: AnnotatedFigure): string {
  const anchor = mark.anchor
  if (anchor === undefined) return ''
  if (mark.kind !== 'element' && namesThePicture(anchor, figure)) return ''
  const zh = locale === 'zh'
  const selector = anchor.selector ?? ''
  const parts: string[] = []
  if (anchor.title !== undefined && anchor.title !== '') parts.push(zh ? `元素标题「${anchor.title}」` : `element title "${anchor.title}"`)
  const text = anchor.text ?? ''
  if (text !== '' && text.length <= NAMEABLE_TEXT) parts.push(zh ? `元素文字「${text}」` : `element text "${text}"`)
  if (selector !== '' && !namesOnlyItsId(selector)) parts.push(zh ? `选择器 ${selector}` : `selector ${selector}`)
  if (parts.length === 0) return ''
  // The parentheses follow the message's own language: an English message dotted with
  // full-width brackets reads like a translation that lost its last pass.
  return zh ? `（${parts.join('，')}）` : ` (${parts.join(', ')})`
}

/**
 * Render one mark as a numbered line the model reads.
 *
 * The number is the mark's number among marks of its kind, the same one the picture
 * draws on it. A mark carries one string — what should change here — and it is the
 * whole payload; the shape only says where. A mark that says nothing still names its
 * position, so the list stays complete and the agent can say which mark is mute.
 *
 * @param mark - the mark to describe.
 * @param ordinal - its 1-based position among marks of its own kind.
 * @param locale - language of the surrounding message.
 * @param figure - the figure these marks belong to, when its size is known; a mark
 *   that reaches past it then says so rather than leaving the sign to be noticed.
 * @returns one line of the annotation summary.
 */
export function describeMark(
  mark: AnnotationMark,
  ordinal: number,
  locale: SummaryLocale,
  figure?: AnnotatedFigure,
): string {
  const zh = locale === 'zh'
  // A mark that names a page carries it, so one list can span the pages of a
  // document without its coordinates becoming ambiguous.
  const page = mark.page === undefined ? '' : (zh ? `第 ${mark.page} 页 ` : `page ${mark.page} `)
  const detail = flattenNote(mark.detail)
  const escape = figure === undefined ? '' : overhang(mark, figure, locale)
  const named = `${page}${markName(mark, ordinal, locale)}${describeGeometry(mark, locale)}${describeAnchor(mark, locale, figure)}${escape}`
  const parts: string[] = [named]
  if (detail !== '') parts.push(zh ? `批注：${detail}` : `note: ${detail}`)
  if (detail === '') parts.push(zh ? '（未写说明）' : '(no detail)')
  return parts.join(zh ? '，' : ', ')
}

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

/**
 * Render every mark as the numbered list carried into the Session.
 * @param document - the saved annotation document.
 * @param locale - language of the surrounding message.
 * @returns one line per mark, in the document's own order.
 */
export function describeMarks(document: AnnotationDocument, locale: SummaryLocale): string[] {
  const ordinals = markOrdinals(document.marks)
  return document.marks.map((mark) => {
    /* v8 ignore next -- the map was built from these same marks. */
    const ordinal = ordinals.get(mark.id) ?? 0
    return describeMark(mark, ordinal, locale, document.figure)
  })
}
