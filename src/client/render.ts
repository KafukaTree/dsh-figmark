/**
 * Drawing one mark as SVG primitives.
 *
 * The live overlay (React) and the exported review image (a string built for
 * rasterization) both render through these helpers, so what the user sees and
 * what the agent receives cannot drift.
 *
 * Nothing here draws the reader's sentence. A mark is a shape saying *where*; the
 * words saying *what* travel as `detail` into the numbered list the agent reads. An
 * earlier version drew that sentence on the picture as a note plate, which meant every
 * mark carried a caption the reader had to place, dodge, and drag clear of the line
 * work it described. The figure is the user's own drawing and is left undecorated;
 * the words go where words belong.
 *
 * The one thing drawn here that is not the reader's shape is the mark's *number*,
 * which lives inside the mark itself: a list of marks is read as "1, 2, 3", so the figure has
 * to be readable the same way.
 * @module dsh-figmark/client/render
 */

import type { AnnotationMark, FigurePoint, MarkKind } from '../shared/annotation'
import { markBounds, markRadians } from './mark-geometry'

/** Stroke width of a mark drawn at weight 1 on a reference-sized figure, in pixels. */
export const STROKE_WIDTH = 2.5

/**
 * The stroke width one mark is drawn at.
 *
 * A mark's weight is a multiple of {@link STROKE_WIDTH}, so the default is the
 * width marks have always had and a heavier mark is the same drawing with a
 * thicker pen. The arrow's barbs are weighed by the same multiple, because an
 * arrow drawn with a thick pen has a thick head.
 *
 * The figure's own unit multiplies everything drawn on it, so the same mark is a
 * bold line on a thumbnail and a hairline on a scan — see `./scale`.
 *
 * @param mark - the mark to weigh.
 * @param unit - the figure's size multiple, 1 for a reference-sized figure.
 * @returns its stroke width in figure pixels.
 */
export function strokeWidthOf(mark: AnnotationMark, unit = 1): number {
  return STROKE_WIDTH * (mark.weight ?? 1) * unit
}

/** Arrow head length, in figure pixels. */
const ARROW_HEAD = 14

/** Half-angle of the arrow head, in radians. */
const ARROW_SPREAD = Math.PI / 7

/** Half-width of a `point` mark's pin head on a reference-sized figure. */
export const POINT_RADIUS = 10

/**
 * Half-width of one pin's head, in figure pixels.
 *
 * Sized by the figure alone. The weight rail is the reader's answer to "how thick
 * should this stroke be", and a pin is not a stroke: it marks *where*, carries a
 * digit, and is compared against the same line work whatever the last arrow was
 * drawn at. Reusing the weight here meant that a rail left at 4 to draw a fat arrow
 * turned the next pin into a marker four times its size — a pin that covered the
 * peak it was pointing at. A mark set by one control should not grow by a control
 * that belongs to another kind of mark.
 *
 * A `weight` already written into an older point mark is ignored rather than
 * migrated: the field is read by nothing now, so an old file and a new one draw the
 * same pin.
 * @param unit - the figure's size multiple.
 * @returns the head's half-width in figure pixels.
 */
export function pinRadiusOf(unit = 1): number {
  return POINT_RADIUS * unit
}

/**
 * How far a pin's head sits above its coordinate, as a multiple of its half-width.
 *
 * A map pin puts its *tip* on the coordinate it names, so the head stands clear of
 * the spot rather than covering it: the coordinate is the precision the mark claims,
 * and a body centred there would hide exactly the pixel it means. Kept under two
 * half-widths so the drop sits *wide* on the figure — a tall pin reads as a flag on
 * a pole and covers the line work above its point.
 */
const PIN_LIFT = 1.6

/** How far down the pin's sides bow out before reaching its point, as a fraction of the lift. */
const PIN_BELLY = 0.6

/**
 * Where the pin's sides leave its head, as a fraction of the head's half-width.
 *
 * Slightly inboard of the widest point, which is what gives a teardrop its shoulders
 * instead of a circle on a stick.
 */
const PIN_SHOULDER = 0.88

/** Font size of the number inside a pin, in figure pixels. */
export const PIN_FONT_SIZE = 11

/** The font a pin's number is drawn in. */
export const PIN_FONT_FAMILY = 'Helvetica, Arial, sans-serif'

/**
 * The colour of the number inside a pin.
 *
 * White on the mark's own colour: a pin is a filled shape, so the number sits on a
 * solid ground rather than on the figure, and white is the one value that reads on
 * every colour the palette offers.
 */
export const PIN_NUMBER_COLOR = '#ffffff'

/**
 * Font size of the number inside a pin, in figure pixels.
 *
 * Scaled by the figure and nothing else, so it keeps the same share of the head at
 * every size — the head no longer varies with the rail, and a numeral that did would
 * be the only thing left varying.
 * @param unit - the figure's size multiple.
 * @returns the font size to draw the number at.
 */
export function pinFontSizeOf(unit = 1): number {
  return PIN_FONT_SIZE * unit
}

/**
 * Where a stroke mark's number goes, and how big it is.
 *
 * The number travels two ways. A `point` mark wears it inside its pin, which is a
 * filled shape with room for a digit. Every other kind is a line: there is nothing to
 * put a digit *in*, so it gets a disc beside the mark, in the mark's own colour.
 *
 * The alternative is what the code did before — a number in the message and no number
 * on the picture for anything but a pin. The message reads as a list ("① the arrow at
 * the peak"), so a reader of the picture had to count arrows to find "the second one".
 * Two readers of the same review are the reader and the agent, and they have to be
 * able to say the same thing about the same mark.
 *
 * The disc sits at the mark's top-left corner, just outside the outline, so it never
 * covers the line work it names. It is placed from the *drawn* box, so a turned mark
 * carries its number beside the turned shape rather than beside where its points were
 * before the turn.
 * @param mark - the mark to number.
 * @param unit - the figure's size multiple.
 * @returns the disc's centre and radius, or undefined for a mark that wears its number
 *   inside itself, or for one with no extent to sit beside.
 */
export function badgeGeometry(mark: AnnotationMark, unit = 1): { readonly centre: FigurePoint; readonly radius: number } | undefined {
  // A pin carries its number inside its head: a disc beside it would be a second
  // marker for one coordinate.
  if (mark.kind === 'point') return undefined
  // An element mark is light on the figure's own artwork. It paints no outline, so
  // there is no corner to stand beside — and its box can cover half the plot, which
  // would put the number nowhere near the thing it names.
  if (mark.kind === 'element') return undefined
  const box = markOutline(mark, unit)
  /* v8 ignore next -- every kind reaching here has points, so it has a box. */
  if (box === undefined) return undefined
  const radius = BADGE_RADIUS * unit
  // Up and to the left, by one radius plus a hair of clear space, so the disc clears
  // the stroke rather than sitting on it.
  const gap = radius + strokeWidthOf(mark, unit) / 2 + BADGE_GAP * unit
  return { centre: [box.x - gap, box.y - gap], radius }
}

/**
 * Radius of the disc a stroke mark's number sits in, on a reference-sized figure.
 *
 * Ten puts the disc at twenty pixels across on a reference figure: the same order as
 * the pin's head, so a pin and a numbered stroke read as one set of marks rather than
 * as two. Smaller and the digit crowds its rim at the sizes a plot is usually drawn at.
 */
const BADGE_RADIUS = 10

/** Clear space between a stroke mark's outline and its number disc, in figure pixels. */
const BADGE_GAP = 1

/** A box in figure pixels. */
export interface MarkBox {
  /** Left edge. */
  readonly x: number
  /** Top edge. */
  readonly y: number
  /** Width. */
  readonly width: number
  /** Height. */
  readonly height: number
}

/** Normalize two opposite corners into a top-left origin and positive extents. */
function bounds(first: FigurePoint, second: FigurePoint): MarkBox {
  return {
    x: Math.min(first[0], second[0]),
    y: Math.min(first[1], second[1]),
    width: Math.abs(second[0] - first[0]),
    height: Math.abs(second[1] - first[1]),
  }
}

/** Round a coordinate for compact path data. */
function n(value: number): string {
  return (Math.round(value * 10) / 10).toString()
}

/**
 * The box a run of points covers.
 * @param points - the points to measure.
 * @returns the box, or undefined when there is no point.
 */
function pointsBox(points: readonly FigurePoint[]): MarkBox | undefined {
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
 * The coordinates an arrow's head reaches to.
 *
 * An arrow is drawn with two barbs behind its tip, so its two points do not bound
 * what is drawn: the barbs can stand out well past the shaft. Everything that needs
 * the arrow's real extent — its outline, its hit area, its export box —
 * reads the barbs from here rather than from the stored points.
 *
 * @param points - the arrow's tail and tip.
 * @returns tail, tip and both barbs; the stored points alone when it is half drawn.
 */
export function arrowBarbs(points: readonly FigurePoint[], weight = 1, unit = 1): readonly FigurePoint[] {
  const [first, second] = points
  if (first === undefined || second === undefined) return points
  const angle = Math.atan2(second[1] - first[1], second[0] - first[0])
  // A thick pen draws a thick head: the barbs grow with the weight, so an arrow
  // stays one drawing rather than a fat shaft with a hairline tip.
  const head = ARROW_HEAD * weight * unit
  const left: FigurePoint = [
    second[0] - head * Math.cos(angle - ARROW_SPREAD),
    second[1] - head * Math.sin(angle - ARROW_SPREAD),
  ]
  const right: FigurePoint = [
    second[0] - head * Math.cos(angle + ARROW_SPREAD),
    second[1] - head * Math.sin(angle + ARROW_SPREAD),
  ]
  return [...points, left, right]
}

/**
 * SVG path data for one mark's stroke.
 *
 * The path is in figure coordinates, so anything it sizes — the arrow's barbs — has
 * to be multiplied by the figure's unit here rather than left to the caller: strokes
 * are given their width in screen pixels by the caller, but a barb is a coordinate,
 * and a coordinate that ignored the unit drew one head on every figure. A head that
 * did not grow with the shaft read as a blunt dart on anything larger than a plot at
 * unit 1, and the outline that measured it reserved a head sixty pixels wide on a
 * tip that only had fourteen.
 *
 * @param mark - the mark to render.
 * @param unit - the figure's size multiple.
 * @returns path data, or undefined for a `point` mark (which draws as a pin).
 */
export function markPathData(mark: AnnotationMark, unit = 1): string | undefined {
  const [first, second] = mark.points
  if (first === undefined) return undefined
  switch (mark.kind) {
    case 'arrow': {
      if (second === undefined) return undefined
      // The barbs are drawn from the same function that measures them, and with the
      // same unit, so the picture and the outline of the arrow cannot disagree about
      // how far it reaches.
      const [left, right] = arrowBarbs(mark.points, mark.weight ?? 1, unit).slice(2) as [FigurePoint, FigurePoint]
      return `M ${n(first[0])} ${n(first[1])} L ${n(second[0])} ${n(second[1])}`
        + ` M ${n(left[0])} ${n(left[1])} L ${n(second[0])} ${n(second[1])}`
        + ` L ${n(right[0])} ${n(right[1])}`
    }
    case 'rect': {
      if (second === undefined) return undefined
      const box = bounds(first, second)
      return `M ${n(box.x)} ${n(box.y)} H ${n(box.x + box.width)} V ${n(box.y + box.height)} H ${n(box.x)} Z`
    }
    case 'ellipse': {
      if (second === undefined) return undefined
      const box = bounds(first, second)
      const rx = box.width / 2
      const ry = box.height / 2
      const cx = box.x + rx
      const cy = box.y + ry
      if (rx === 0 || ry === 0) return `M ${n(box.x)} ${n(box.y)} L ${n(box.x + box.width)} ${n(box.y + box.height)}`
      return `M ${n(cx - rx)} ${n(cy)} a ${n(rx)} ${n(ry)} 0 1 0 ${n(rx * 2)} 0 a ${n(rx)} ${n(ry)} 0 1 0 ${n(-rx * 2)} 0`
    }
    case 'pen': {
      // `first` is the same point the guard above already proved present.
      const segments = mark.points.slice(1).map(point => `L ${n(point[0])} ${n(point[1])}`)
      return [`M ${n(first[0])} ${n(first[1])}`, ...segments].join(' ')
    }
    case 'point':
      return undefined
    case 'element':
      // An element mark draws no path of its own: it is drawn as the light on the
      // element it names (see `spotlight.ts`), in the panel and in the delivered
      // picture alike. Corner brackets were what it used to be, and they had the
      // failing the light exists to fix — on a curve the brackets are corners of a
      // rectangle the figure never draws.
      return undefined
  }
}

/**
 * A `point` mark's pin, as the pieces every consumer needs.
 *
 * A spot on a figure is marked the way a map marks a place: a solid, rounded marker
 * whose point sits on the coordinate and whose body holds the mark's number. The whole
 * point of the shape is that the body is *filled* — the number sits on the mark's own
 * colour rather than on the figure, so it reads over whatever line work it covers,
 * and the marker itself is heavy enough to find on a dense plot.
 *
 * An earlier version drew a thin teardrop outline with a dot in it, which said "here"
 * but carried no number: the number had to be placed beside it as a separate disc,
 * and on a crowded figure that disc and the pin could not be told apart from each
 * other. One solid marker holding its own digit has nothing to disambiguate.
 */
export interface PinGeometry {
  /** SVG path data for the marker, with its point on the mark's coordinate. */
  readonly path: string
  /** Centre of the body, where the number goes. */
  readonly number: FigurePoint
  /** The box the marker covers. */
  readonly box: MarkBox
}

/**
 * The marker for one `point` mark, or undefined when it carries no coordinate.
 *
 * The marker always stands the same way up: its tip on the coordinate, its body
 * above. It used to turn over near the top edge, so that a point placed high on the
 * figure would not hang its head outside the picture — but a marker whose shape
 * depends on where it sits is a marker the reader has to re-read every time it moves,
 * and dragging one toward the top edge made it snap over mid-gesture with nothing
 * else changing. A pin that flips is a pin that stops meaning "map pin".
 *
 * Nothing needs it to flip. The paper is measured from the marks (see `plotBounds`),
 * so a point near the top edge grows the sheet upward and its head lands on paper
 * that is now there. The figure is not a frame the drawing has to stay inside; it is
 * the part of the sheet that has a picture on it.
 * @param mark - the point mark.
 * @param unit - the figure's size multiple.
 * @returns the marker's path, number centre and box, or undefined with no coordinate.
 */
export function pinGeometry(mark: AnnotationMark, unit = 1): PinGeometry | undefined {
  const tip = mark.points[0]
  if (tip === undefined) return undefined
  const radius = pinRadiusOf(unit)
  const lift = radius * PIN_LIFT
  const [tipX, tipY] = tip
  const centreY = tipY - lift
  // The sides leave the head at the shoulders and curve out to the point.
  const shoulder = radius * PIN_SHOULDER
  const belly = lift * PIN_BELLY
  const path = [
    `M ${n(tipX)} ${n(tipY)}`,
    `Q ${n(tipX - shoulder)} ${n(tipY - belly)} ${n(tipX - radius)} ${n(centreY)}`,
    `A ${n(radius)} ${n(radius)} 0 1 1 ${n(tipX + radius)} ${n(centreY)}`,
    `Q ${n(tipX + shoulder)} ${n(tipY - belly)} ${n(tipX)} ${n(tipY)}`,
    'Z',
  ].join(' ')
  const top = Math.min(centreY - radius, tipY)
  const bottom = Math.max(centreY + radius, tipY)
  return {
    path,
    number: [tipX, centreY],
    box: { x: tipX - radius, y: top, width: radius * 2, height: bottom - top },
  }
}

/**
 * SVG path data for a `point` mark's marker.
 * @param mark - the point mark.
 * @returns path data, or undefined when the mark carries no coordinate.
 */
export function pinPathData(mark: AnnotationMark, unit = 1): string | undefined {
  return pinGeometry(mark, unit)?.path
}

/**
 * Where the number inside a `point` mark's marker sits.
 * @param mark - the point mark.
 * @returns the number's centre, or undefined when the mark carries no coordinate.
 */
export function pinNumberCentre(mark: AnnotationMark, unit = 1): FigurePoint | undefined {
  return pinGeometry(mark, unit)?.number
}

/**
 * The box a `point` mark's pin covers.
 *
 * A point mark is one coordinate and no extent, so it is framed by the pin standing
 * on it rather than by any geometry of its own. Everything that needs a box for a
 * point mark — its hit area, its control frame, anything that has to keep clear of it — reads it
 * from here, so they cannot disagree about how big the target is.
 *
 * @param mark - the point mark.
 * @returns the pin's box, or undefined when the mark carries no point.
 */
export function pointMarkBox(mark: AnnotationMark, unit = 1): MarkBox | undefined {
  return pinGeometry(mark, unit)?.box
}

/**
 * Whether a mark draws as a stroke, rather than as a marker on the element it names.
 *
 * A `point` is a pin and an `element` is a light on the figure's own artwork; neither
 * paints a line the reader can thicken, so neither answers to the weight rail. Every
 * other kind is the reader's own stroke and does.
 * @param kind - the kind of mark.
 * @returns whether the mark has a stroke of its own.
 */
export function isStrokeKind(kind: MarkKind): boolean {
  return kind !== 'point' && kind !== 'element'
}

/**
 * Whether a mark's extent is the reader's to change.
 *
 * Two kinds say a size that is not theirs to edit. A `point` has no extent at all —
 * it is one coordinate, and a resize handle would stretch nothing. An `element` has
 * one, but it belongs to the element: the box is where that element was when it was
 * picked, and dragging a corner would leave a mark claiming to name a thing while
 * pointing at some other area. Both are still selectable and still carry a number.
 * @param kind - the kind of mark.
 * @returns true when the mark offers no resize or turn handles.
 */
export function hasFixedExtent(kind: MarkKind): boolean {
  return kind === 'point' || kind === 'element'
}

/**
 * The box a mark covers once it is drawn, rotation included.
 *
 * This is what the overlay hit-tests against and what a popover keeps clear of, so
 * it is the *drawn* extent, not the stored points: an arrow's barbs stand out past its
 * tip, a stroke is half its width wide on each side of its path, and a turned box
 * occupies the box its corners sweep.
 *
 * @param mark - the mark to measure.
 * @returns the box, or undefined when the mark carries no coordinate.
 */
export function markOutline(mark: AnnotationMark, unit = 1): MarkBox | undefined {
  if (mark.kind === 'point') return pointMarkBox(mark, unit)
  const geometry = mark.kind === 'arrow' ? arrowBarbs(mark.points, mark.weight ?? 1, unit) : mark.points
  const straight = pointsBox(geometry)
  if (straight === undefined) return undefined
  // A turned mark covers the box its corners sweep, which is not the box the points
  // came in with; only the drawn extent says where the mark really reaches.
  //
  // Measured by turning the *corners of the box*, not the points: the extent of a
  // turned rectangle is not the extent of a turned diagonal. Re-bounding two turned
  // points measured a line segment, so a turned rect at 45° reported a box 12px wide
  // where it really swept 233px — the paper never grew for it, its corner was clipped
  // by the viewBox in the panel and in the export, and its comment pill was placed
  // from a box far too narrow.
  const radians = markRadians(mark)
  const box = radians === 0 ? straight : turnedBox(straight, radians)
  // Only a mark that paints a stroke is half a stroke wider than its path. An
  // `element` paints nothing — it is the light on the figure's own artwork — so
  // growing its box measured a stroke the reader never sees. That box is what the
  // paper is measured from, so an element naming a full-width curve or the
  // background patch grew the sheet by 1.25px, flipped the exported picture into
  // "something reached past the figure", and drew the grey dashed edge rule for a
  // mark that reached nowhere.
  const grow = isStrokeKind(mark.kind) ? strokeWidthOf(mark, unit) / 2 : 0
  return { x: box.x - grow, y: box.y - grow, width: box.width + grow * 2, height: box.height + grow * 2 }
}

/**
 * The box a box covers once it is turned, as a mark's rotation turns it.
 *
 * The centre it turns around is the box's own, which is also the centre the control
 * frame puts its rotation handle at, so the frame and the drawing agree about where a
 * turned mark sits. All four corners are turned rather than the shape's own points:
 * what a turned rectangle sweeps is bounded by its corners, and two opposite corners
 * only ever describe a diagonal.
 *
 * @param box - the upright box to turn.
 * @param radians - clockwise angle in radians.
 * @returns the box the turned corners cover.
 */
function turnedBox(box: MarkBox, radians: number): MarkBox {
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  const centreX = box.x + box.width / 2
  const centreY = box.y + box.height / 2
  const corners: readonly FigurePoint[] = [
    [box.x, box.y],
    [box.x + box.width, box.y],
    [box.x + box.width, box.y + box.height],
    [box.x, box.y + box.height],
  ]
  const turned = corners.map((corner) => {
    const dx = corner[0] - centreX
    const dy = corner[1] - centreY
    return [centreX + dx * cos - dy * sin, centreY + dx * sin + dy * cos] as FigurePoint
  })
  const first = turned[0]
  /* v8 ignore next -- the four corners above are never an empty run. */
  if (first === undefined) return box
  let left = first[0]
  let right = first[0]
  let top = first[1]
  let bottom = first[1]
  for (const point of turned) {
    left = Math.min(left, point[0])
    right = Math.max(right, point[0])
    top = Math.min(top, point[1])
    bottom = Math.max(bottom, point[1])
  }
  return { x: left, y: top, width: right - left, height: bottom - top }
}

/**
 * The SVG transform that turns a mark to its own rotation.
 *
 * Rotation is stored as an angle, not baked into every point: a box that was
 * turned stays a box, so its handles still know what shape they belong to. The
 * centre it turns around is its bounding box's, which is also where the control
 * frame puts its rotation handle.
 *
 * A `point` mark has no extent, so turning it would mean nothing; it never
 * carries a rotation and this returns undefined for it.
 *
 * @param mark - the mark to place.
 * @returns a `rotate(…)` transform, or undefined when the mark is upright.
 */
export function markTransform(mark: AnnotationMark): string | undefined {
  if (mark.kind === 'point') return undefined
  const box = markBounds(mark.points)
  const radians = markRadians(mark)
  if (box === undefined || radians === 0) return undefined
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  return `rotate(${n((radians * 180) / Math.PI)} ${n(cx)} ${n(cy)})`
}
