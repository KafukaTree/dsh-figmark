/**
 * The appearance stream each annotation draws for itself.
 *
 * A reader that has no idea what a `/Line` or an `/Ink` looked like on screen will
 * otherwise guess: a default pen, a default head, a default ring. Every mark written
 * by this plugin therefore carries its own form XObject — a stroke, a ring, or
 * nothing at all — drawn from the geometry the reader actually drew.
 *
 * Nothing here draws a glyph. A mark's sentence travels as `/Contents`, the comment
 * attached to the mark, which is where a reader and an agent both read it; the page
 * is the user's own figure and is left undecorated.
 * @module dsh-figmark/client/pdf/appearance
 */
import { PDFArray, PDFDict, PDFName, PDFNumber, PDFRawStream, type PDFContext, type PDFRef } from 'pdf-lib'
import type { AnnotationMark, FigurePoint } from '../../shared/annotation'
import { num, type UserRect } from './coords'
import { POINT_DOT_RADIUS, POINT_RADIUS, STROKE_WIDTH, drawnPoints, type PlacedMark } from './geometry'

/** Control point ratio that turns four Bézier curves into an ellipse. */
const ELLIPSE_KAPPA = 0.5522847498307936

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

/**
 * The colour operators setting one stroke and fill colour.
 * @param color - the mark's colour, as a CSS hex string.
 * @param operator - `RG` for a stroke, `rg` for a fill.
 * @returns the operators, ending with the one asked for.
 */
export function colorOperators(color: string, operator: string): string {
  const match = /^#?([0-9a-f]{6})$/iu.exec(color)
  const value = match?.[1] ?? '000000'
  const channel = (offset: number): string => num(Number.parseInt(value.slice(offset, offset + 2), 16) / 255)
  return `${channel(0)} ${channel(2)} ${channel(4)} ${operator}`
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
    const ring = placed.points.map((point, index) => {
      const [x, y] = local(point)
      return `${num(x)} ${num(y)} ${index === 0 ? 'm' : 'l'}`
    })
    return `${stroke} ${ring.join(' ')} S`
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
      const centreX = (x0 + x1) / 2
      const centreY = (y0 + y1) / 2
      return `${stroke} ${ellipsePath(centreX, centreY, Math.abs(x1 - x0) / 2, Math.abs(y1 - y0) / 2)} S`
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
 * the page is meant, which is the whole reason the kind exists.
 *
 * @param mark - the point mark, for its colour.
 * @param placed - the mark's geometry in user space.
 * @param rect - the box the appearance is drawn in.
 * @param unit - the page's size multiple.
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
 * A PDF array of numbers.
 * @param context - the document's object context.
 * @param values - the numbers to write.
 * @returns the array.
 */
export function numbers(context: PDFContext, values: readonly number[]): PDFArray {
  const array = PDFArray.withContext(context)
  for (const value of values) array.push(PDFNumber.of(value))
  return array
}

/**
 * Build one appearance stream and register it with the document.
 *
 * @param context - the document's object context.
 * @param mark - the mark being drawn.
 * @param placed - the mark's geometry in user space.
 * @param rect - the box the appearance covers, in user space.
 * @param unit - the page's size multiple.
 * @returns the appearance stream reference, or undefined when the mark draws
 *   nothing a stream is needed for.
 */
export function appearance(
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
