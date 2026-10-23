/**
 * The annotation data model shared by the browser half (which draws it) and the
 * Node half (which persists it).
 *
 * Coordinates are surface pixels: the origin is the surface's top-left corner and
 * one unit is one pixel at the surface's intrinsic size, so a mark means the same
 * thing whatever zoom or pane width the annotator ran at. A paged document is one
 * document whose marks each name the page they were drawn on, and the page's own
 * size is the unit those coordinates are measured in.
 * @module dsh-figmark/shared/annotation
 */

/** Schema version of the sidecar document. */
export const ANNOTATION_VERSION = 1

/**
 * Schema version of the v2 sidecar document.
 *
 * v2 is written by the sibling annotator that shares a workbench with this plugin
 * (Sati). It carries the same marks and the same figure facts, but names the figure
 * `target` instead of `figure` and records that target's kind. This plugin reads v2
 * documents and keeps writing its own {@link ANNOTATION_VERSION} ones — the
 * translation lives in `src/host/store.ts`.
 */
export const ANNOTATION_VERSION_V2 = 2

/**
 * One mark's shape kind.
 *
 * `point` is a bare position with a comment and nothing drawn around it: no box,
 * no arrow, no lettering. It exists for the case the other four cannot express —
 * "right here, change this" — where drawing a shape would be a claim about extent
 * that the reader never made.
 */
export type MarkKind = 'arrow' | 'rect' | 'ellipse' | 'pen' | 'point'

/** One point in figure pixel coordinates. */
export type FigurePoint = readonly [number, number]

/** A rectangle in figure pixels: x, y, width, height. */
export type FigureBox = readonly [number, number, number, number]

/** What the mark landed on, when the surface exposes its own elements. */
export interface MarkAnchor {
  /** Element name of the innermost element under the mark's tip. */
  readonly tag: string
  /** That element's `id`, when it declares one. */
  readonly id?: string
  /** That element's `<title>` text, when it declares one (Graphviz names its nodes here). */
  readonly title?: string
  /** That element's own text content, trimmed and capped. */
  readonly text?: string
  /**
   * CSS path to that element from the document body, for a mark on a rendered
   * HTML document — the one anchor a source reader can resolve directly. Each
   * segment is a `tag:nth-of-type(n)` step, or the element's `#id` where it has
   * one, so the path is exact for the document it was read from.
   */
  readonly selector?: string
  /** Bounding box of that element in figure pixels: x, y, width, height. */
  readonly bbox: FigureBox
}

/** One annotation the user drew. */
export interface AnnotationMark {
  /** Stable mark id, unique inside one document. */
  readonly id: string
  /** Shape kind. */
  readonly kind: MarkKind
  /** Stroke color as a CSS hex string. */
  readonly color: string
  /**
   * Shape geometry in figure pixels. An arrow carries tail then head, a `rect`
   * or `ellipse` carries two opposite corners, `pen` carries the sampled path,
   * and `text` carries its anchor point only.
   *
   * For a mark on a page of a paged document the coordinates are that page's own
   * pixels, so they stay meaningful whatever zoom or pane width the mark was
   * drawn at; {@link AnnotationMark.page} names the page they belong to.
   */
  readonly points: readonly FigurePoint[]
  /**
   * What this particular mark should change, in the user's words.
   *
   * The only text a mark carries. It is per mark, not per figure: two boxes on
   * one picture usually ask for two different things, and a shared note would
   * make the agent guess which one it belongs to. It is never drawn on the
   * picture — the picture keeps showing the reader's own figure, undecorated,
   * and this text travels in the numbered list the agent reads.
   */
  readonly detail?: string
  /** 1-based page this mark sits on, for a figure that has pages. */
  readonly page?: number
  /**
   * Clockwise rotation of the mark, in degrees around its own centre.
   *
   * Absent means upright, which is what every mark drawn before rotation
   * existed is. A bare {@link MarkKind} `point` has no extent to turn, so it
   * never carries one.
   */
  readonly rotation?: number
  /**
   * Stroke width of the mark, as a multiple of the default width.
   *
   * Absent means the default, which is what every mark drawn before line weight
   * existed is. It scales the stroke and the arrow's barbs together, so a heavy
   * arrow is a heavier version of the same arrow rather than a longer one. A
   * `point` mark has no stroke to weigh: its head is sized by the number inside
   * it, so it never carries one.
   */
  readonly weight?: number
  /** Element the mark points at, when the figure exposes one. */
  readonly anchor?: MarkAnchor
}

/** Thinnest stroke a mark can be drawn at, as a multiple of the default width. */
export const WEIGHT_MIN = 0.5

/**
 * Heaviest stroke a mark can be drawn at, as a multiple of the default width.
 *
 * Eight rather than four: the rail is the only way to say "this is the point", and a
 * box drawn at four times a 2.5px pen is 10px on the reference figure — emphatic, but
 * not the fat marker a reader reaches for when the whole figure is too busy.
 */
export const WEIGHT_MAX = 8

/** Multiple of the default width a mark is drawn at until the reader says otherwise. */
export const WEIGHT_DEFAULT = 1

/**
 * Hold a stroke weight inside the range the painter can draw.
 *
 * @param value - the weight to hold.
 * @returns the value, pulled to the nearest end of the range.
 */
export function clampWeight(value: number): number {
  return Math.min(WEIGHT_MAX, Math.max(WEIGHT_MIN, value))
}

/**
 * Whether a value is a stroke weight this plugin would write.
 *
 * @param value - the value to test.
 * @returns true when it is one.
 */
export function isWeight(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= WEIGHT_MIN && value <= WEIGHT_MAX
}

/**
 * Geometry of the annotated figure.
 *
 * A figure is either one surface or many pages, and the two carry different
 * facts: a single-surface figure measures itself in intrinsic pixels, a paged
 * document has no one size (each page does) and counts pages instead. The
 * validation in `src/host/store.ts` holds the two apart, so a reader never has
 * to guess which kind it holds.
 */
export interface AnnotatedFigure {
  /** The `dsh-resource://file/…` address the annotator opened. */
  readonly address: string
  /** Absolute path on the Host. */
  readonly path: string
  /** Media type of the figure file. */
  readonly mediaType: string
  /** Intrinsic width in pixels, for a single-surface figure. */
  readonly width?: number
  /** Intrinsic height in pixels, for a single-surface figure. */
  readonly height?: number
  /** Content hash of the figure at annotation time, used to detect a redraw. */
  readonly sha256: string
  /** Pages in the paged document these marks belong to. */
  readonly pageCount?: number
}

/**
 * Suffix naming one page's files inside a paged document's name.
 * @param page - 1-based page, or undefined for a single-surface figure.
 * @returns the suffix, empty when the figure has no pages.
 */
export function pageFileSuffix(page: number | undefined): string {
  return page === undefined ? '' : `.p${page}`
}

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

/**
 * List the pages that carry at least one mark.
 * @param document - the annotation document.
 * @returns 1-based page numbers, ascending; empty for a single-surface figure.
 */
export function annotatedPages(document: AnnotationDocument): number[] {
  const pages = new Set<number>()
  for (const mark of document.marks) {
    if (mark.page !== undefined) pages.add(mark.page)
  }
  return [...pages].sort((left, right) => left - right)
}

/**
 * Whether an annotation needs a picture of the marks to make sense.
 *
 * A `point` mark is one coordinate and a sentence, and the coordinate is already
 * named in the sentence — so a message carrying only point marks needs no rendered
 * image at all: the numbered list *is* the annotation, and the figure's own path is
 * enough to say which picture it concerns. The moment one mark has an extent, the
 * picture is what makes the marks readable, and every mark travels on it.
 *
 * @param document - the annotation document.
 * @returns true when the marks must be delivered as an image.
 */
export function needsReviewImage(document: AnnotationDocument): boolean {
  return document.marks.some(mark => mark.kind !== 'point')
}

/** The sidecar document persisted beside one figure. */
export interface AnnotationDocument {
  /** Schema version. */
  readonly version: typeof ANNOTATION_VERSION
  /** The figure these marks belong to. */
  readonly figure: AnnotatedFigure
  /** ISO timestamp of the first save. */
  readonly createdAt: string
  /** ISO timestamp of this save. */
  readonly updatedAt: string
  /** Marks in draw order. */
  readonly marks: readonly AnnotationMark[]
  /**
   * What the figure shows, in the user's words.
   *
   * One per figure, not one per mark: it is the context that makes the numbered
   * marks readable ("this is the sleeve assembly, before the bearing change"), and
   * it is never drawn on the picture.
   */
  readonly summary?: string
}

/** Language used when rendering the model-facing summary lines. */
export type SummaryLocale = 'zh' | 'en'

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
  const detail = mark.detail !== undefined && mark.detail.trim() !== '' ? mark.detail.trim() : ''
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
