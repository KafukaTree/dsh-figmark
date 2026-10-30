/**
 * The annotation data model shared by the browser half (which draws it) and the
 * Node half (which persists it).
 *
 * Coordinates are surface pixels: the origin is the surface's top-left corner and
 * one unit is one pixel at the surface's intrinsic size, so a mark means the same
 * thing whatever zoom or pane width the annotator ran at. A paged document is one
 * document whose marks each name the page they were drawn on, and the page's own
 * size is the unit those coordinates are measured in.
 *
 * Nothing here builds a sentence: the words a mark is described in live in
 * `./mark-summary`, so a writer that only stores marks never carries the wording
 * the model reads, and the wording can change without touching the schema.
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
 * Longest note one mark may carry, in characters.
 *
 * Lives in `shared` because both halves need the same number for different
 * reasons: the browser stops the reader from typing past it, so the field cannot
 * grow into a sidecar the Host will refuse; the Host refuses one anyway, so a
 * client that forgot cannot write a file the next open cannot read. A single
 * number in one place is what keeps those two from drifting apart.
 */
export const MAX_DETAIL_CHARS = 4000

/** Longest overall note a document may carry, in characters. */
export const MAX_SUMMARY_CHARS = 4000

/**
 * One mark's shape kind.
 *
 * `point` is a bare position with a comment and nothing drawn around it: no box,
 * no arrow, no lettering. It exists for the case the other four cannot express —
 * "right here, change this" — where drawing a shape would be a claim about extent
 * that the reader never made.
 *
 * `element` is a box the reader did not draw: they pointed at one element of a
 * vector surface and the annotator took that element's own outline. Its geometry is
 * the element's box, so everything that measures or exports a box treats it as one;
 * what separates it from a `rect` is the claim it makes — a drawn box says "look in
 * here", an element says "this thing, the one with this name". That claim is the
 * {@link AnnotationMark.anchor}, and the box is only there to hold the number.
 */
export type MarkKind = 'arrow' | 'rect' | 'ellipse' | 'pen' | 'point' | 'element'

/**
 * Whether a mark encloses an area rather than pointing at a place.
 *
 * A `rect`, an `ellipse` and a `pen` stroke say "look in here" — their geometry is a
 * region, and a region has no one point the reader was aiming at: the last corner of
 * a drag is simply where the hand stopped. The other three point: a `point` sits on a
 * spot, an `arrow` points by its tip, and an `element` is the thing itself.
 *
 * The distinction decides whether an {@link AnnotationMark.anchor} means anything.
 * An anchor names what the mark is about, and for a region the name would be whatever
 * happened to be under the release point — a label the reader never asked for, sent
 * to the agent as though it were part of the request.
 * @param kind - the kind of mark.
 * @returns true when the mark's geometry is a region rather than a place.
 */
export function describesARegion(kind: MarkKind): boolean {
  return kind === 'rect' || kind === 'ellipse' || kind === 'pen'
}

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
 * validation in `src/host/store-schema.ts` holds the two apart, so a reader never
 * has to guess which kind it holds.
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

/**
 * Each mark's number inside its own kind, 1 for the first of that kind.
 *
 * The number a mark is drawn with and the number its sentence starts with are the
 * same number, so the list and the picture have to count the same things. They count
 * *kinds*: a figure holding two arrows and one box reads 箭头1, 箭头2, 矩形1 — not 1,
 * 2, 3 — because the shape already says which kind it is, and one counter for the
 * whole file was a number the reader had to decode rather than read. "The second
 * arrow" and "the second box" are two different marks; one counter called them the
 * third and the fifth.
 *
 * One function rather than one per surface, because the message, the overlay, the
 * exported picture and the document's list all have to agree on which mark is "1".
 * @param marks - the marks in the order the document reads them.
 * @returns each mark id's 1-based ordinal among marks of its own kind.
 */
export function markOrdinals(marks: readonly AnnotationMark[]): ReadonlyMap<string, number> {
  const counted = new Map<MarkKind, number>()
  const ordinals = new Map<string, number>()
  for (const mark of marks) {
    const ordinal = (counted.get(mark.kind) ?? 0) + 1
    counted.set(mark.kind, ordinal)
    ordinals.set(mark.id, ordinal)
  }
  return ordinals
}

/**
 * The kinds in the order the rail hands them out, which is the order the list reads
 * in.
 *
 * The list is gathered by kind rather than left in the order the marks were drawn,
 * because its numbers are per kind: drawn in an evening of circling and dropping
 * pins, a list of six read 1, 2, 1, 1, 2, 3 — the count kept starting over wherever
 * the hand happened to change tool. Gathered, the same six read 1, 2, 3, 1, 1, 2,
 * and each run of numbers belongs to one shape.
 */
export const MARK_KIND_ORDER: readonly MarkKind[] = ['arrow', 'rect', 'ellipse', 'pen', 'point', 'element']

/** One row of the mark list: a mark, and the number its row prints for it. */
export interface MarkRow {
  /** The mark this row stands for. */
  readonly mark: AnnotationMark
  /**
   * The mark's ordinal among its kind, or `undefined` when it is the only mark of
   * that kind.
   *
   * A number exists to tell two things apart. On a row with no twin it told the
   * reader nothing, and a run of rows reads as a run only when a lone kind's row
   * carries no number at all to interrupt it.
   */
  readonly ordinal: number | undefined
}

/**
 * The list's rows: every mark, gathered by kind, carrying the number its row prints.
 *
 * @param marks - the marks in the order the document reads them.
 * @returns the rows in the order the list shows them.
 */
export function markRows(marks: readonly AnnotationMark[]): readonly MarkRow[] {
  const numbering = markOrdinals(marks)
  const groups = new Map<MarkKind, AnnotationMark[]>()
  for (const mark of marks) {
    const group = groups.get(mark.kind)
    if (group === undefined) groups.set(mark.kind, [mark])
    else group.push(mark)
  }
  const rows: MarkRow[] = []
  for (const kind of MARK_KIND_ORDER) {
    const group = groups.get(kind)
    if (group === undefined) continue
    for (const mark of group) {
      rows.push({ mark, ordinal: group.length > 1 ? numbering.get(mark.id) : undefined })
    }
  }
  return rows
}

/**
 * How much of the surface an element has to cover to be the paper rather than a thing
 * on it.
 *
 * Almost all rather than exactly all: a document's background often sits a rounding
 * error short of its frame, and a figure's own background is the one answer a reader
 * never means — a mark around the whole drawing says nothing about any part of it.
 * Two questions are asked with this number: whether a pick named the paper, and
 * whether an elected anchor names the picture the message already named.
 */
export const PAPER_COVERAGE = 0.98

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
