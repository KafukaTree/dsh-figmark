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

/** Stroke width of every mark, in figure pixels. */
export const STROKE_WIDTH = 2.5

/** Arrow head length, in figure pixels. */
const ARROW_HEAD = 14

/** Half-angle of the arrow head, in radians. */
const ARROW_SPREAD = Math.PI / 7

/** Half-width of a `point` mark's pin head, in figure pixels. */
export const POINT_RADIUS = 10

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
export function arrowBarbs(points: readonly FigurePoint[]): readonly FigurePoint[] {
  const [first, second] = points
  if (first === undefined || second === undefined) return points
  const angle = Math.atan2(second[1] - first[1], second[0] - first[0])
  const left: FigurePoint = [
    second[0] - ARROW_HEAD * Math.cos(angle - ARROW_SPREAD),
    second[1] - ARROW_HEAD * Math.sin(angle - ARROW_SPREAD),
  ]
  const right: FigurePoint = [
    second[0] - ARROW_HEAD * Math.cos(angle + ARROW_SPREAD),
    second[1] - ARROW_HEAD * Math.sin(angle + ARROW_SPREAD),
  ]
  return [...points, left, right]
}

/**
 * SVG path data for one mark's stroke.
 * @param mark - the mark to render.
 * @returns path data, or undefined for a `point` mark (which draws as a pin).
 */
export function markPathData(mark: AnnotationMark): string | undefined {
  const [first, second] = mark.points
  if (first === undefined) return undefined
  switch (mark.kind) {
    case 'arrow': {
      if (second === undefined) return undefined
      // The barbs are drawn from the same function that measures them, so the
      // picture and the outline of the arrow cannot disagree about how far it reaches.
      const [left, right] = arrowBarbs(mark.points).slice(2) as [FigurePoint, FigurePoint]
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
 * The body stands above the point. A mark placed near the top of the figure would
 * then hang its body outside the picture, so the marker turns over and stands below
 * instead: the point still names the spot, and the body is still inside the frame.
 *
 * @param mark - the point mark.
 * @returns the marker's path, number centre and box, or undefined with no coordinate.
 */
export function pinGeometry(mark: AnnotationMark): PinGeometry | undefined {
  const tip = mark.points[0]
  if (tip === undefined) return undefined
  const radius = POINT_RADIUS
  const lift = radius * PIN_LIFT
  const [tipX, tipY] = tip
  // Up by default; over when a head above the point would leave the picture.
  const up = tipY - lift - radius >= 0
  const side = up ? -1 : 1
  const centreY = tipY + side * lift
  // The sides leave the head at the shoulders and curve out to the point. The same
  // two curves read correctly whichever way the pin faces, because every distance
  // is measured along the facing rather than in absolute y.
  const shoulder = radius * PIN_SHOULDER
  const belly = lift * PIN_BELLY
  const away = (value: number): number => tipY + side * value
  const path = [
    `M ${n(tipX)} ${n(tipY)}`,
    `Q ${n(tipX - shoulder)} ${n(away(belly))} ${n(tipX - radius)} ${n(centreY)}`,
    `A ${n(radius)} ${n(radius)} 0 1 ${up ? 1 : 0} ${n(tipX + radius)} ${n(centreY)}`,
    `Q ${n(tipX + shoulder)} ${n(away(belly))} ${n(tipX)} ${n(tipY)}`,
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
export function pinPathData(mark: AnnotationMark): string | undefined {
  return pinGeometry(mark)?.path
}

/**
 * Where the number inside a `point` mark's marker sits.
 * @param mark - the point mark.
 * @returns the number's centre, or undefined when the mark carries no coordinate.
 */
export function pinNumberCentre(mark: AnnotationMark): FigurePoint | undefined {
  return pinGeometry(mark)?.number
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
export function pointMarkBox(mark: AnnotationMark): MarkBox | undefined {
  return pinGeometry(mark)?.box
}

/** Whether a mark draws as a stroke (so the overlay can size its hit area). */
export function isStrokeKind(kind: MarkKind): boolean {
  return kind !== 'point'
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
export function markOutline(mark: AnnotationMark): MarkBox | undefined {
  if (mark.kind === 'point') return pointMarkBox(mark)
  const geometry = mark.kind === 'arrow' ? arrowBarbs(mark.points) : mark.points
  const straight = pointsBox(geometry)
  if (straight === undefined) return undefined
  // A turned mark covers the box its corners sweep, which is not the box the points
  // came in with; only the drawn extent says where the mark really reaches.
  const radians = markRadians(mark)
  const box = radians === 0 ? straight : turnedBox(geometry, straight, radians)
  const grow = STROKE_WIDTH / 2
  return { x: box.x - grow, y: box.y - grow, width: box.width + grow * 2, height: box.height + grow * 2 }
}

/**
 * The box points cover once they are turned, as a mark's rotation turns them.
 *
 * The centre they turn around is their own box's, which is also the centre the
 * control frame puts its rotation handle at, so the frame and the drawing agree about
 * where a turned mark sits.
 *
 * @param points - the points to turn.
 * @param box - the box the points cover, whose centre they turn around.
 * @param radians - clockwise angle in radians.
 * @returns the box the turned points cover.
 */
function turnedBox(points: readonly FigurePoint[], box: MarkBox, radians: number): MarkBox {
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  const centreX = box.x + box.width / 2
  const centreY = box.y + box.height / 2
  const turned = points.map((point) => {
    const dx = point[0] - centreX
    const dy = point[1] - centreY
    return [centreX + dx * cos - dy * sin, centreY + dx * sin + dy * cos] as FigurePoint
  })
  // The turned run is as long as the original and the caller only asks once it knows
  // the original is not empty, so there is always a box to return.
  const first = turned[0]
  /* v8 ignore next -- reached only for an empty run, which the caller has excluded. */
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
