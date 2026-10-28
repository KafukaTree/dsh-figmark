/**
 * Page units ↔ PDF user space, and the boxes measured between them.
 *
 * A mark is drawn and stored in *page units* — the units pdf.js lays a page out in
 * at scale 1 — while the document is written in its own *user space*. The two
 * differ by the page's media-box offset, its `/Rotate` and its `/UserUnit`, all of
 * which pdf.js folds into one viewport transform. Keeping the inverse of that
 * transform, and the rectangle arithmetic built on it, in one leaf module is what
 * lets every geometry above it be written once, in one currency.
 * @module dsh-figmark/client/pdf/coords
 */
import type { FigurePoint } from '../../shared/annotation'

/** Smallest rectangle side, so a mark stays clickable in a reader. */
export const MIN_RECT_SIDE = 1

/** Round one coordinate to two decimals, as a PDF number operator. */
export function num(value: number): string {
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
export interface UserRect {
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
export function boundsOf(points: readonly FigurePoint[], padding: number): UserRect {
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
 * The box a run of page-unit points covers.
 *
 * This lives here rather than in `../mark-geometry` because this module is built into
 * its own lazy chunk, and a chunk may not share a module with the client entry: the
 * loader can only resolve what it fetches itself, so a shared import fails the build.
 * @param points - the points to measure.
 * @returns the box, or undefined when there is no point to measure.
 */
export function pointsBox(points: readonly FigurePoint[]): UserRect | undefined {
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
