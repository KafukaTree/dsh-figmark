/**
 * The fixed vocabulary the panel works in: the four colours, the tool row, and the
 * numbers that decide what the weight rail is talking about.
 *
 * These are the decisions that are the same on every figure, kept apart from the
 * gestures that read them so a change to "which tools exist" or "how many swatches"
 * is made in one place and cannot leave a second copy of the list behind.
 * @module dsh-figmark/client/annotator/tokens
 */
import type { AnnotationMark } from '../../shared/annotation'
import type { Tool } from '../Canvas'

/** Palette offered by the toolbar. */
export const COLORS = ['#e03131', '#1971c2', '#f08c00', '#2f9e44'] as const

/**
 * The rail's track, drawn on an 18x100 grid and stretched to whatever height it gets.
 *
 * The control's subject is thickness, so the track says which way is heavier: a little
 * narrower at the bottom, about one part in six. "A little" is the whole note — a
 * water-drop taper reads as decoration rather than as a gauge, and the reader said so
 * twice. One cubic per side and no shoulders, so each flank is a single continuous
 * curve from end to end with nothing for the eye to catch on; the two ends close with
 * faint arcs so the track looks drawn rather than cut off.
 *
 * Stretching it vertically (preserveAspectRatio="none") is what makes the caps need
 * care: the svg is 18x100 over a box about 180 tall, so one y unit is 1.8 of an x unit.
 * An `r` that reads as a circle in the viewBox would be a tall ellipse on screen — the
 * cap's `ry` is therefore set to `rx / 1.8`, which is what puts a round end on it.
 */
export const WEIGHT_TRACK = [
  'M 6.9 98.9',
  'A 2.1 1.15 0 0 0 11.1 98.9',
  'C 11.4 66 11.9 33 12.2 1.1',
  'A 3.2 1.15 0 0 0 5.8 1.1',
  'C 6.1 33 6.6 66 6.9 98.9',
  'Z',
].join(' ')
/**
 * How far the blue reaches, as a `height` in the rail.
 *
 * The same expression as the knob's `bottom`, because the blue has to end exactly where
 * the knob's centre is: written once as a function so a change to the travel cannot
 * leave the fill behind. `inset` keeps both clear of the rail's rounded caps; the extra
 * half knob at each end keeps the knob's whole circle between the two ends of the bar
 * rather than hanging half of itself past the top when the pen is at its heaviest.
 */
export const travelHeight = (fraction: number): string =>
  `calc(var(--da-track-inset) + var(--da-knob-size) / 2`
  + ` + (100% - 2 * var(--da-track-inset) - var(--da-knob-size)) * ${fraction})`

/** Tools in toolbar order. */
export const TOOLS: readonly { readonly tool: Tool; readonly label: string }[] = [
  { tool: 'select', label: 'toolSelect' },
  { tool: 'arrow', label: 'toolArrow' },
  { tool: 'rect', label: 'toolRect' },
  { tool: 'ellipse', label: 'toolEllipse' },
  { tool: 'pen', label: 'toolPen' },
  { tool: 'point', label: 'toolPoint' },
  { tool: 'element', label: 'toolElement' },
]

/**
 * The tools that only mean something on a surface made of elements.
 *
 * An inline SVG and a rendered HTML document are both trees, so a picker can name a
 * node in either one. A raster figure is one bitmap: there is nothing inside it to
 * point at, so the tool would sit in the row offering a gesture that could only ever
 * answer "no element here". It is left out there rather than shown and refused —
 * but it is kept in {@link TOOLS} for both surfaces that can use it, because a tool
 * that appears and disappears with media type has to be one list, not two.
 */
export const ELEMENT_TOOLS: ReadonlySet<Tool> = new Set<Tool>(['element'])

/**
 * The tools that draw something with a size the rail can set.
 *
 * `select` is not among them: it draws nothing, so with it armed and no mark
 * selected the rail has no subject. `point` is, because a pin is sized by the same
 * number — the rail asks "how big is this mark" either way.
 */
export const WEIGHT_TOOLS: ReadonlySet<Tool> = new Set<Tool>(['arrow', 'rect', 'ellipse', 'pen', 'point'])

/** The copy key naming the shape each kind of mark is, for the list's second line. */
export const TOOL_COPY: Record<AnnotationMark['kind'], string> = {
  arrow: 'toolArrow',
  rect: 'toolRect',
  ellipse: 'toolEllipse',
  pen: 'toolPen',
  point: 'toolPoint',
  element: 'toolElement',
}