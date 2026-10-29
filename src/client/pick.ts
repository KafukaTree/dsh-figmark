/**
 * Asking the browser what is painted under the pointer.
 *
 * A picker has to answer "which element is here" the way the reader means it, and the
 * reader means the ink they can see. Measuring every element's bounding box cannot
 * answer that: a sloped trend line's box is the whole rectangle its two ends span, so
 * a smallest-box rule hands back that line for a click twenty pixels above it — and a
 * figure is mostly exactly those boxes.
 *
 * The browser already knows which geometry covers a point, so the question is asked of
 * it, and the answer is the painted thing rather than the box around it.
 *
 * What the browser will not do is make a one-pixel line easy to hit, which is what a
 * picker owes a reader. So each pick asks about the pointer itself first and then about
 * points on a small grid around it, nearest first. On ink that is one question; over
 * blank paper it is twenty-five, and the highlight shows the answer, so the reader
 * always sees what the reach takes.
 * @module dsh-figmark/client/pick
 */
import { PAPER_COVERAGE } from '../shared/annotation'


/**
 * How far around the pointer a pick still counts as a hit, in surface pixels.
 *
 * Six pixels: far enough that a line a couple of pixels wide can be caught without
 * aiming, close enough that the highlight never reaches something the reader is not
 * pointing at.
 */
export const PICK_REACH = 6

/**
 * How many probes span {@link PICK_REACH}, per axis.
 *
 * Five puts them three pixels apart, which covers a two-pixel stroke from any side
 * within the reach. Finer would only pay off for hairlines, and a reader who wants one
 * of those has the pane's magnification to make it wide enough to aim at.
 */
const PROBE_STEPS = 5

/**
 * The offsets each pick asks about, nearest to the pointer first.
 *
 * Distance order is what makes "the first candidate" mean "the nearest thing": a find
 * on a far probe must never beat a find on a near one, which is only honest if every
 * probe already asked was closer. Ties keep reading order, so the same pointer position
 * always names the same element.
 */
const PROBES: readonly (readonly [number, number])[] = (() => {
  const offsets: (readonly [number, number])[] = []
  const half = (PROBE_STEPS - 1) / 2
  for (let row = 0; row < PROBE_STEPS; row += 1) {
    for (let column = 0; column < PROBE_STEPS; column += 1) {
      offsets.push([(column - half) / half, (row - half) / half])
    }
  }
  return offsets.sort((one, other) => Math.hypot(one[0], one[1]) - Math.hypot(other[0], other[1]))
})()

/**
 * Whether an element is the sheet the surface is drawn on.
 *
 * @param element - candidate element.
 * @param frame - the box of the surface it belongs to.
 * @returns true when the element covers essentially the whole surface.
 */
export function isPaper(element: Element, frame: DOMRect): boolean {
  // A surface with no extent has no inside, so nothing in it covers "the whole" of it.
  if (frame.width <= 0 || frame.height <= 0) return false
  const box = element.getBoundingClientRect()
  return box.width >= frame.width * PAPER_COVERAGE && box.height >= frame.height * PAPER_COVERAGE
}

/**
 * Everything the browser paints around one point, nearest probe first.
 *
 * Within one probe the order is the browser's own, which is the only ordering that
 * answers "what does the reader see here": where two elements both cover a point, the
 * one drawn later is in front. A candidate from a nearer probe always precedes one from
 * a farther probe, and an element appears once however many probes found it.
 *
 * The caller chooses from the list rather than receiving one answer, because what
 * counts as the surface is the caller's to know — the same document holds the panel
 * annotating the figure, and a document's own background is not a thing on it.
 *
 * The coordinates are the *document's own*. A document inside a frame is not scaled by
 * the transform on that frame, so its layout pixels are the ones to pass, not the
 * pointer's position in the panel.
 *
 * @param document_ - the document to ask.
 * @param x - pointer x in that document's coordinate space.
 * @param y - pointer y in that document's coordinate space.
 * @param reach - how far around the pointer to look, in that document's pixels.
 * @returns the candidates, nearest first; null when the document cannot be asked at all,
 *   which is a different answer from an empty list and has a different fallback.
 */
export function pickStack(
  document_: Document | null | undefined,
  x: number,
  y: number,
  reach: number = PICK_REACH,
): Element[] | null {
  // Being unable to answer is not the same as answering "nothing here". Every engine
  // the panel runs in can answer this; a document parsed by a test double cannot, and
  // its callers then measure boxes instead.
  if (document_ === null || document_ === undefined) return null
  if (typeof document_.elementsFromPoint !== 'function') return null
  const found: Element[] = []
  for (const [dx, dy] of PROBES) {
    for (const element of document_.elementsFromPoint(x + dx * reach, y + dy * reach)) {
      if (!found.includes(element)) found.push(element)
    }
  }
  return found
}

/**
 * Whether a shape's own interior contains a point, asked of its fill geometry.
 *
 * The question the browser's hit testing cannot answer. A shape with `fill="none"` is
 * transparent to the pointer by definition, so a hollow node — a Graphviz ellipse, a
 * flowchart box — reports only the sheet behind it, and a reader pointing at the node's
 * middle gets nothing.
 *
 * The tempting fix is to open every shape to the pointer (`pointer-events: all`), and
 * it is wrong: measured on a real matplotlib figure it changed one point in five, and
 * always for the worse, because a curve with no fill then answers for the tick groups
 * drawn in front of it. This asks each shape about *its own* fill instead, so a hollow
 * closed shape claims its middle while an open curve — which is not filled either,
 * however wide its box — claims nothing under itself.
 *
 * A shape that is *painted* solid is skipped: the browser already answered for it, and
 * asking again would only reorder answers that are already right.
 *
 * The point has to be in the shape's own user space, which is what its screen transform
 * is for: the figure may be magnified, and its shapes may sit in nested groups.
 *
 * @param element - the shape to ask.
 * @param clientX - point x in client space.
 * @param clientY - point y in client space.
 * @returns true when the point is inside the shape's fill area.
 */
export function coversInterior(element: Element, clientX: number, clientY: number): boolean {
  // Only shapes have fill geometry to ask about, and only in an SVG.
  if (typeof (element as SVGGeometryElement).isPointInFill !== 'function') return false
  const shape = element as SVGGeometryElement
  // An HTML element reports `undefined` here rather than `null`, so this is a
  // truthiness test: no SVG means no user space to convert the point into.
  if (shape.ownerSVGElement === null || shape.ownerSVGElement === undefined) return false
  // A filled shape is already the browser's answer, so the fill area has nothing to add.
  const fill = shape.getAttribute('fill')
  if (fill !== null && fill !== '' && fill !== 'none') return false
  // The shape's *own* space, not the figure's: measured against a nested ellipse under
  // `translate scale`, the root's matrix reports a point well outside the ellipse as
  // inside it, while the shape's own matrix answers correctly.
  const matrix = shape.getScreenCTM()
  if (matrix === null) return false
  // Applied by hand rather than through `DOMPoint.matrixTransform`: the arithmetic is
  // three multiplications, and it keeps this callable in an engine that has no
  // point type of its own.
  const inverse = matrix.inverse()
  const x = inverse.a * clientX + inverse.c * clientY + inverse.e
  const y = inverse.b * clientX + inverse.d * clientY + inverse.f
  return shape.isPointInFill({ x, y } as DOMPoint)
}
