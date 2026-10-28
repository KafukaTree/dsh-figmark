/**
 * Writing the user's marks into the document as native PDF annotations.
 *
 * The saved document is the original with the marks added, never a picture of the
 * page: an arrow becomes a `/Line`, a box a `/Square`, an ellipse a `/Circle`, a
 * freehand stroke an `/Ink`, and a text note a `/FreeText`. Each one carries the
 * note as `/Contents` and an appearance stream this module draws itself, so a
 * reader shows exactly what the user drew instead of guessing a default.
 *
 * A paged document's marks are measured in page units, and `pdf.js` answers the
 * transform from PDF user space to those units for each page — so a page that is
 * rotated, scaled by `/UserUnit`, or whose media box does not start at the origin
 * still lands where the user drew it.
 *
 * A `point` mark — a position and a sentence, with no shape drawn on the figure —
 * is written as a stroke-free ring with its comment as `/Contents`, so the file
 * says *here* without claiming an extent the reader never drew.
 * @module dsh-figmark/client/pdf/annotate
 */
import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFNumber,
  PDFRawStream,
  PDFString,
  type PDFContext,
  type PDFPage,
  type PDFRef,
} from 'pdf-lib'
import type { AnnotationMark, FigurePoint } from '../../shared/annotation'

/** One page's marks, and the transform that maps PDF user space to page units. */
export interface PageAnnotateInput {
  /** 1-based page number. */
  readonly page: number
  /**
   * `pdf.js` viewport transform at scale 1, as `[a b c d e f]`: a user-space point
   * `(x, y)` is at `(a·x + c·y + e, b·x + d·y + f)` in page units.
   */
  readonly transform: readonly number[]
  /** Marks drawn on this page, in page units. */
  readonly marks: readonly AnnotationMark[]
  /**
   * The page's size multiple, so the pen is the one the reader saw on screen.
   *
   * Absent means 1, which is what every exported page looked like before the size
   * of a mark followed the size of the figure.
   */
  readonly unit?: number
}

/** Stroke width of every mark, matching the overlay's own (`src/client/render.ts`). */
const STROKE_WIDTH = 2.5

/** Arrow head length in page units, matching the overlay's own. */
const ARROW_HEAD = 14

/** Half-angle of the arrow head, in radians. */
const ARROW_SPREAD = Math.PI / 7

/** Control point ratio that turns four Bézier curves into an ellipse. */
const ELLIPSE_KAPPA = 0.5522847498307936

/** How many segments a turned ellipse is stroked with, so its curve reads as one. */
const TURN_SEGMENTS = 72

/** Smallest rectangle side, so a mark stays clickable in a reader. */
const MIN_RECT_SIDE = 1

/** Radius of a point mark's ring, in page units, matching the overlay's own. */
const POINT_RADIUS = 7

/** Radius of the dot at a point mark's centre, in page units. */
const POINT_DOT_RADIUS = 2.5

/** Round one coordinate to two decimals, as a PDF number operator. */
function num(value: number): string {
  return (Math.round(value * 100) / 100).toString()
}

/**
 * Map one page-unit point into PDF user space.
 * @param transform - `[a b c d e f]`, user space → page units.
 * @param point - a point in page units.
 * @returns the point in user space.
 * @throws {Error} when the transform is degenerate and cannot be inverted.
 */
export function toUserSpace(transform: readonly number[], point: FigurePoint): FigurePoint {
  const [a = 0, b = 0, c = 0, d = 0, e = 0, f = 0] = transform
  const determinant = a * d - b * c
  if (determinant === 0) throw new Error('the page transform is degenerate')
  const x = point[0] - e
  const y = point[1] - f
  return [(d * x - c * y) / determinant, (a * y - b * x) / determinant]
}

/**
 * Ratio between page units and user-space units on one page.
 *
 * The transform has no skew, so one factor does for every direction: a stroke that
 * reads 2.5 page units wide is `2.5 / scale` wide in the file.
 *
 * @param transform - `[a b c d e f]`, user space → page units.
 * @returns page units per user-space unit.
 */
export function unitScale(transform: readonly number[]): number {
  const [a = 0, b = 0] = transform
  return Math.hypot(a, b)
}

/** A rectangle in user space, normalized so both sides are positive. */
interface UserRect {
  /** Lower-left corner. */
  readonly x: number
  /** Lower-left corner. */
  readonly y: number
  /** Positive width. */
  readonly width: number
  /** Positive height. */
  readonly height: number
}

/**
 * Bounding rectangle of a set of user-space points, widened so no side is degenerate.
 * @param points - points to enclose.
 * @param padding - space kept around the points, in user-space units.
 * @returns the rectangle.
 */
function boundsOf(points: readonly FigurePoint[], padding: number): UserRect {
  const xs = points.map(point => point[0])
  const ys = points.map(point => point[1])
  const left = Math.min(...xs) - padding
  const right = Math.max(...xs) + padding
  const bottom = Math.min(...ys) - padding
  const top = Math.max(...ys) + padding
  return {
    x: left,
    y: bottom,
    width: Math.max(right - left, MIN_RECT_SIDE),
    height: Math.max(top - bottom, MIN_RECT_SIDE),
  }
}

/**
 * Whether every character of a string fits the font's own single-byte encoding.
 *
 * The check reads one UTF-16 code unit per element, which is what `for…of` hands
 * back for the characters that matter here: anything outside Latin-1 — a CJK
 * character, or half of an astral pair — is above the boundary either way.
 */
function latinEncodable(text: string): boolean {
  for (const character of text) {
    if (character.charCodeAt(0) > 0xff) return false
  }
  return true
}

/** A mark's geometry, restated in user space. */
interface PlacedMark {
  /** The mark's points in user space. */
  readonly points: readonly FigurePoint[]
  /** Stroke width in user-space units. */
  readonly width: number
  /** Arrow head length in user-space units. */
  readonly head: number
  /** Whether the mark was turned, so a box or an ellipse is no longer axis-aligned. */
  readonly turned: boolean
}

/**
 * The box a run of page-unit points covers.
 *
 * This lives here rather than in `../mark-geometry` because this module is built into
 * its own lazy chunk, and a chunk may not share a module with the client entry: the
 * loader can only resolve what it fetches itself, so a shared import fails the build.
 * @param points - the points to measure.
 * @returns the box, or undefined when there is no point to measure.
 */
function pointsBox(points: readonly FigurePoint[]): UserRect | undefined {
  const first = points[0]
  if (first === undefined) return undefined
  let left = first[0]
  let right = first[0]
  let top = first[1]
  let bottom = first[1]
  for (const point of points) {
    left = Math.min(left, point[0])
    right = Math.max(right, point[0])
    top = Math.min(top, point[1])
    bottom = Math.max(bottom, point[1])
  }
  return { x: left, y: top, width: right - left, height: bottom - top }
}

/**
 * Turn one point around a centre.
 * @param point - the point to turn.
 * @param centre - what it turns around.
 * @param radians - clockwise angle in radians.
 * @returns the turned point.
 */
function turnAround(point: FigurePoint, centre: FigurePoint, radians: number): FigurePoint {
  const sin = Math.sin(radians)
  const cos = Math.cos(radians)
  const dx = point[0] - centre[0]
  const dy = point[1] - centre[1]
  return [centre[0] + dx * cos - dy * sin, centre[1] + dx * sin + dy * cos]
}

/**
 * The ring a box or an ellipse covers once it is turned.
 *
 * A `/Square` and a `/Circle` are axis-aligned by definition, so a turned one cannot
 * be written as one. Its outline is sampled instead and stroked as a polyline, which
 * is exact for a box and smooth enough at {@link TURN_SEGMENTS} for an ellipse. A box
 * that was only half drawn has no ring — it keeps the points it has, so the shape it
 * did draw is still turned.
 *
 * @param kind - which of the two ring-shaped marks this is.
 * @param points - the mark's un-turned geometry, in page units.
 * @param centre - the point it turns around, in page units.
 * @param radians - clockwise angle in radians.
 * @returns the turned ring, in page units.
 */
function turnedRing(
  kind: 'rect' | 'ellipse',
  points: readonly FigurePoint[],
  centre: FigurePoint,
  radians: number,
): readonly FigurePoint[] {
  const [first, second] = points
  const ring: FigurePoint[] = []
  if (first === undefined || second === undefined) {
    ring.push(...points)
  } else {
    const left = Math.min(first[0], second[0])
    const right = Math.max(first[0], second[0])
    const top = Math.min(first[1], second[1])
    const bottom = Math.max(first[1], second[1])
    if (kind === 'rect') {
      ring.push([left, top], [right, top], [right, bottom], [left, bottom], [left, top])
    } else {
      const radiusX = (right - left) / 2
      const radiusY = (bottom - top) / 2
      const centreX = (left + right) / 2
      const centreY = (top + bottom) / 2
      for (let index = 0; index <= TURN_SEGMENTS; index += 1) {
        const angle = (index / TURN_SEGMENTS) * Math.PI * 2
        ring.push([centreX + radiusX * Math.cos(angle), centreY + radiusY * Math.sin(angle)])
      }
    }
  }
  return ring.map(point => turnAround(point, centre, radians))
}

/**
 * Restate one mark's geometry in user space.
 *
 * A mark's rotation turns its points around its own bounding box's centre, exactly
 * as the overlay's `rotate(…)` transform does — so a turned arrow still points where
 * it pointed, and a turned box still covers what it covered. A box or an ellipse is
 * laid down as the ring it turned into, because a `/Square` and a `/Circle` cannot be
 * turned. A `point` mark has no extent to turn, so its rotation is never set.
 *
 * @param mark - the mark, in page units.
 * @param transform - `[a b c d e f]`, user space → page units.
 * @returns the placed geometry.
 */
function place(mark: AnnotationMark, transform: readonly number[], unit: number): PlacedMark {
  const scale = unitScale(transform)
  const radians = ((mark.rotation ?? 0) * Math.PI) / 180
  const box = pointsBox(mark.points)
  const centre: FigurePoint = box === undefined
    ? [0, 0]
    : [box.x + box.width / 2, box.y + box.height / 2]
  const turned = radians !== 0 && (mark.kind === 'rect' || mark.kind === 'ellipse')
  const spins = radians !== 0 && mark.kind !== 'point'
  let points: readonly FigurePoint[] = mark.points
  if (mark.kind === 'rect' || mark.kind === 'ellipse') {
    if (turned) points = turnedRing(mark.kind, mark.points, centre, radians)
  } else if (spins) {
    points = mark.points.map(point => turnAround(point, centre, radians))
  }
  // The weight is a multiple of the same base width the overlay uses, so a mark
  // exported to PDF keeps the pen the reader drew it with.
  const weight = (mark.weight ?? 1) * unit
  return {
    points: points.map(point => toUserSpace(transform, point)),
    width: (STROKE_WIDTH * weight) / scale,
    head: (ARROW_HEAD * weight) / scale,
    turned,
  }
}

/**
 * The points one mark draws, including the head an arrow's appearance strokes.
 *
 * An appearance is clipped to its own box, so the head belongs to the geometry the
 * box is measured from — a box around the shaft alone would cut the head off.
 *
 * @param mark - the mark being drawn.
 * @param placed - the mark's geometry in user space.
 * @returns the points the appearance strokes.
 */
function drawnPoints(mark: AnnotationMark, placed: PlacedMark): readonly FigurePoint[] {
  const [first, second] = placed.points
  if (mark.kind !== 'arrow' || first === undefined || second === undefined) return placed.points
  const angle = Math.atan2(second[1] - first[1], second[0] - first[0])
  return [
    ...placed.points,
    [second[0] - placed.head * Math.cos(angle + ARROW_SPREAD), second[1] - placed.head * Math.sin(angle + ARROW_SPREAD)],
    [second[0] - placed.head * Math.cos(angle - ARROW_SPREAD), second[1] - placed.head * Math.sin(angle - ARROW_SPREAD)],
  ]
}

/** The appearance stream content of one stroked shape, in box-local coordinates. */
function strokeContent(mark: AnnotationMark, placed: PlacedMark, rect: UserRect): string {
  const local = (point: FigurePoint): FigurePoint => [point[0] - rect.x, point[1] - rect.y]
  const [first, second] = placed.points
  const color = colorOperators(mark.color, 'RG')
  const stroke = `${color} ${num(placed.width)} w 1 J 1 j`
  // A turned box or ellipse is no longer axis-aligned, so it is stroked as the ring
  // its outline became: `re` and the Béziers below would straighten it again.
  if (placed.turned) {
    const path = placed.points.map((point, index) => {
      const [x, y] = local(point)
      return `${num(x)} ${num(y)} ${index === 0 ? 'm' : 'l'}`
    })
    return `${stroke} ${path.join(' ')} S`
  }
  switch (mark.kind) {
    case 'pen': {
      const path = placed.points.map((point, index) => {
        const [x, y] = local(point)
        return `${num(x)} ${num(y)} ${index === 0 ? 'm' : 'l'}`
      })
      return `${stroke} ${path.join(' ')} S`
    }
    // An element mark carries the element's own box, so on a page it draws as that
    // box. The panel never offers the element tool for a PDF — a page has no
    // elements to point at — but a sidecar written by hand can carry one, and a
    // mark that resolves to its box is better than a mark that resolves to nothing.
    case 'rect':
    case 'element': {
      if (first === undefined || second === undefined) return ''
      const [x0, y0] = local(first)
      const [x1, y1] = local(second)
      const left = Math.min(x0, x1) + placed.width / 2
      const bottom = Math.min(y0, y1) + placed.width / 2
      const width = Math.max(Math.abs(x1 - x0) - placed.width, 0)
      const height = Math.max(Math.abs(y1 - y0) - placed.width, 0)
      return `${stroke} ${num(left)} ${num(bottom)} ${num(width)} ${num(height)} re S`
    }
    case 'ellipse': {
      if (first === undefined || second === undefined) return ''
      const [x0, y0] = local(first)
      const [x1, y1] = local(second)
      const radiusX = Math.abs(x1 - x0) / 2
      const radiusY = Math.abs(y1 - y0) / 2
      const centerX = (x0 + x1) / 2
      const centerY = (y0 + y1) / 2
      const ox = radiusX * ELLIPSE_KAPPA
      const oy = radiusY * ELLIPSE_KAPPA
      const path = [
        `${num(centerX - radiusX)} ${num(centerY)} m`,
        `${num(centerX - radiusX)} ${num(centerY + oy)} ${num(centerX - ox)} ${num(centerY + radiusY)} ${num(centerX)} ${num(centerY + radiusY)} c`,
        `${num(centerX + ox)} ${num(centerY + radiusY)} ${num(centerX + radiusX)} ${num(centerY + oy)} ${num(centerX + radiusX)} ${num(centerY)} c`,
        `${num(centerX + radiusX)} ${num(centerY - oy)} ${num(centerX + ox)} ${num(centerY - radiusY)} ${num(centerX)} ${num(centerY - radiusY)} c`,
        `${num(centerX - ox)} ${num(centerY - radiusY)} ${num(centerX - radiusX)} ${num(centerY - oy)} ${num(centerX - radiusX)} ${num(centerY)} c`,
      ]
      return `${stroke} ${path.join(' ')} S`
    }
    case 'arrow': {
      if (first === undefined || second === undefined) return ''
      const tail = local(first)
      const tip = local(second)
      // Every barb starts its own subpath: an `l` with no current point draws
      // nothing, and the operands it leaves behind would break the next operator.
      const barbs = drawnPoints(mark, placed).slice(2).map(point => {
        const [x, y] = local(point)
        return `${num(x)} ${num(y)} m ${num(tip[0])} ${num(tip[1])} l`
      })
      return `${stroke} ${num(tail[0])} ${num(tail[1])} m ${num(tip[0])} ${num(tip[1])} l S ${barbs.join(' ')} S`
    }
    /* v8 ignore start -- caller sends a point mark to `pointContent` instead. */
    case 'point':
      return ''
    /* v8 ignore stop */
  }
}

/**
 * The appearance stream content of a `point` mark, in box-local coordinates.
 *
 * A ring with a filled centre: the mark says "here" and nothing about how much of
 * the page is meant, which is the whole reason the kind exists. It is drawn at the
 * same radii the overlay uses, so the picture and the file agree.
 *
 * @param mark - the point mark, for its colour.
 * @param placed - the mark's geometry in user space.
 * @param rect - the box the appearance is drawn in.
 * @returns the content stream operators.
 */
function pointContent(mark: AnnotationMark, placed: PlacedMark, rect: UserRect, unit: number): string {
  const point = placed.points[0]
  /* v8 ignore next -- a point mark carries exactly the one coordinate it was placed at. */
  if (point === undefined) return ''
  const [x, y] = [point[0] - rect.x, point[1] - rect.y]
  // The radii are page-unit values, so a point stays the same on-screen size as
  // the strokes around it whatever the page's own scale is.
  const base = Math.max(placed.width / (STROKE_WIDTH * unit), 0.0001)
  const radius = POINT_RADIUS / base
  const dot = POINT_DOT_RADIUS / base
  const ring = ellipsePath(x, y, radius, radius)
  const centre = ellipsePath(x, y, dot, dot)
  return `${colorOperators(mark.color, 'RG')} ${num(placed.width)} w 1 J ${ring} S`
    + ` ${colorOperators(mark.color, 'rg')} ${centre} f`
}

/**
 * The four-Bézier path of one ellipse, as PDF operators.
 * @param centreX - centre in box-local units.
 * @param centreY - centre in box-local units.
 * @param radiusX - half width.
 * @param radiusY - half height.
 * @returns the path operators, with no paint operator.
 */
function ellipsePath(centreX: number, centreY: number, radiusX: number, radiusY: number): string {
  const ox = radiusX * ELLIPSE_KAPPA
  const oy = radiusY * ELLIPSE_KAPPA
  return [
    `${num(centreX - radiusX)} ${num(centreY)} m`,
    `${num(centreX - radiusX)} ${num(centreY + oy)} ${num(centreX - ox)} ${num(centreY + radiusY)} ${num(centreX)} ${num(centreY + radiusY)} c`,
    `${num(centreX + ox)} ${num(centreY + radiusY)} ${num(centreX + radiusX)} ${num(centreY + oy)} ${num(centreX + radiusX)} ${num(centreY)} c`,
    `${num(centreX + radiusX)} ${num(centreY - oy)} ${num(centreX + ox)} ${num(centreY - radiusY)} ${num(centreX)} ${num(centreY - radiusY)} c`,
    `${num(centreX - ox)} ${num(centreY - radiusY)} ${num(centreX - radiusX)} ${num(centreY - oy)} ${num(centreX - radiusX)} ${num(centreY)} c`,
  ].join(' ')
}

/** The colour operators setting one stroke and fill colour. */
function colorOperators(color: string, operator: string): string {
  const match = /^#?([0-9a-f]{6})$/iu.exec(color)
  const value = match?.[1] ?? '000000'
  const channel = (offset: number): string => num(Number.parseInt(value.slice(offset, offset + 2), 16) / 255)
  return `${channel(0)} ${channel(2)} ${channel(4)} ${operator}`
}

/**
 * Build one appearance stream and register it with the document.
 *
 * Every mark this module writes draws its own appearance: a stroke, a ring, or
 * nothing at all. Nothing here relies on the reader's own fonts, because a note is
 * no longer drawn on the page — it travels as `/Contents`, the comment attached to
 * the mark, which is where a reader and an agent both read it.
 *
 * @param context - the document's object context.
 * @param mark - the mark being drawn.
 * @param placed - the mark's geometry in user space.
 * @param rect - the box the appearance covers, in user space.
 * @returns the appearance stream reference, or undefined when the mark draws
 *   nothing a stream is needed for.
 */
function appearance(
  context: PDFContext,
  mark: AnnotationMark,
  placed: PlacedMark,
  rect: UserRect,
  unit: number,
): PDFRef | undefined {
  const content = mark.kind === 'point' ? pointContent(mark, placed, rect, unit) : strokeContent(mark, placed, rect)
  if (content === '') return undefined
  const dictionary = PDFDict.withContext(context)
  dictionary.set(PDFName.of('Type'), PDFName.of('XObject'))
  dictionary.set(PDFName.of('Subtype'), PDFName.of('Form'))
  dictionary.set(PDFName.of('FormType'), PDFNumber.of(1))
  dictionary.set(PDFName.of('BBox'), numbers(context, [0, 0, rect.width, rect.height]))
  const resources = PDFDict.withContext(context)
  dictionary.set(PDFName.of('Resources'), resources)
  return context.register(PDFRawStream.of(dictionary, new TextEncoder().encode(content)))
}

/** A PDF array of numbers. */
function numbers(context: PDFContext, values: readonly number[]): PDFArray {
  const array = PDFArray.withContext(context)
  for (const value of values) array.push(PDFNumber.of(value))
  return array
}

/** The note as a PDF string: readable when it is ASCII, hexadecimal otherwise. */
function contentString(text: string): PDFString | PDFHexString {
  return latinEncodable(text) ? PDFString.of(text) : PDFHexString.fromText(text)
}

/**
 * Build one annotation dictionary for one mark.
 *
 * Every mark carries its sentence as `/Contents`: that is the comment, the thing a
 * reader opens and an agent reads. Nothing is drawn on the page to say it, because
 * the page is the user's own figure and a caption laid over it is one more thing
 * to place, dodge, and move clear of the line work it describes.
 *
 * @param context - the document's object context.
 * @param mark - the mark being written.
 * @param transform - `[a b c d e f]`, user space → page units.
 * @returns the annotation dictionary.
 */
function annotation(
  context: PDFContext,
  mark: AnnotationMark,
  transform: readonly number[],
  unit: number,
): PDFDict {
  const placed = place(mark, transform, unit)
  const anchor = mark.points[0]
  if (anchor === undefined || placed.points[0] === undefined) {
    throw new Error('an annotation mark needs at least one coordinate pair')
  }
  // A point mark's box is the ring drawn around it — there is no geometry of its
  // own to measure, so the box is padded out from that one coordinate.
  const rect = boundsOf(drawnPoints(mark, placed), placed.width * 2)
  const box = mark.kind === 'point' ? boundsOf(placed.points, POINT_RADIUS * unit * 2) : rect
  const dictionary = PDFDict.withContext(context)
  dictionary.set(PDFName.of('Type'), PDFName.of('Annot'))
  dictionary.set(PDFName.of('Subtype'), PDFName.of(annotationSubtype(mark)))
  dictionary.set(PDFName.of('Rect'), numbers(context, [box.x, box.y, box.x + box.width, box.y + box.height]))
  dictionary.set(PDFName.of('F'), PDFNumber.of(4))
  const note = (mark.detail ?? '').trim()
  if (note !== '') dictionary.set(PDFName.of('Contents'), contentString(note))
  dictionary.set(PDFName.of('C'), numbers(context, colorChannels(mark.color)))
  const border = PDFDict.withContext(context)
  border.set(PDFName.of('W'), PDFNumber.of(placed.width))
  border.set(PDFName.of('S'), PDFName.of('S'))
  dictionary.set(PDFName.of('BS'), border)
  if (mark.kind === 'pen') {
    const inkList = PDFArray.withContext(context)
    const path = PDFArray.withContext(context)
    for (const point of placed.points) {
      path.push(PDFNumber.of(point[0]))
      path.push(PDFNumber.of(point[1]))
    }
    inkList.push(path)
    dictionary.set(PDFName.of('InkList'), inkList)
  }
  if (mark.kind === 'arrow') {
    // A half-drawn arrow is still an arrow: it gets the line it has, and the
    // appearance of one with no head is simply not drawn.
    const [tail, tip] = placed.points
    if (tail !== undefined) {
      const head = tip ?? tail
      dictionary.set(PDFName.of('L'), numbers(context, [tail[0], tail[1], head[0], head[1]]))
      const endings = PDFArray.withContext(context)
      endings.push(PDFName.of('None'))
      endings.push(PDFName.of('OpenArrow'))
      dictionary.set(PDFName.of('LE'), endings)
    }
  }
  const stream = appearance(context, mark, placed, box, unit)
  if (stream !== undefined) {
    const streams = PDFDict.withContext(context)
    streams.set(PDFName.of('N'), stream)
    dictionary.set(PDFName.of('AP'), streams)
  }
  return dictionary
}

/** The annotation subtype one mark kind is written as. */
function annotationSubtype(mark: AnnotationMark): string {
  switch (mark.kind) {
    case 'pen': return 'Ink'
    case 'rect': return 'Square'
    case 'ellipse': return 'Circle'
    case 'arrow': return 'Line'
    // A point is written as a `/Text` note: a reader shows it as a small marker it
    // can open, which is exactly the relationship the mark has to the page — a
    // comment at a position, with no shape claiming an extent.
    case 'point': return 'Text'
    // The same box `strokeContent` draws for it, so the subtype and the appearance
    // cannot disagree about what a stray element mark looks like.
    case 'element': return 'Square'
  }
}

/** One mark's colour as three decimal channels. */
function colorChannels(color: string): number[] {
  const match = /^#?([0-9a-f]{6})$/iu.exec(color)
  const value = match?.[1] ?? '000000'
  return [0, 2, 4].map(offset => Number.parseInt(value.slice(offset, offset + 2), 16) / 255)
}

/**
 * Append the annotations of every page to a copy of the document.
 *
 * Annotations travel in each page's own `/Annots`, appended after whatever the
 * document already carried: a file someone else annotated stays annotated, and
 * saving twice writes the same annotations once because every save starts from the
 * original bytes.
 *
 * @param bytes - the original document.
 * @param pages - the marks of each annotated page.
 * @returns the annotated document.
 * @throws {Error} when a page number is outside the document, or a transform is degenerate.
 */
export async function annotatePdf(bytes: Uint8Array, pages: readonly PageAnnotateInput[]): Promise<Uint8Array> {
  const document = await PDFDocument.load(bytes)
  const count = document.getPageCount()
  for (const input of pages) {
    if (input.page < 1 || input.page > count) {
      throw new Error(`page ${input.page} is outside this ${count}-page document`)
    }
  }
  for (const input of pages) {
    const page = document.getPage(input.page - 1)
    if (input.marks.length === 0) continue
    const annots = pageAnnots(document.context, page)
    for (const mark of input.marks) {
      const unit = input.unit ?? 1
      annots.push(document.context.register(annotation(document.context, mark, input.transform, unit)))
    }
  }
  return await document.save()
}

/** One page's annotation array, created when the page carries none yet. */
function pageAnnots(context: PDFContext, page: PDFPage): PDFArray {
  const existing = page.node.Annots()
  if (existing !== undefined) return existing
  const created = PDFArray.withContext(context)
  page.node.set(PDFName.of('Annots'), created)
  return created
}
