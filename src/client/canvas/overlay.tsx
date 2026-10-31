/**
 * What the marks look like on the paper.
 *
 * This module draws and nothing else: every prop comes in, a fragment of svg goes
 * out. It reads no DOM, measures nothing and remembers nothing, which is what lets
 * the same code draw the stored marks, the mark currently being dragged, and the
 * same marks again in the export copy — and what makes the drawing checkable by
 * rendering it rather than by reasoning about it.
 *
 * The two paths of every stroke are not redundant: the white one is drawn first and
 * wider so the reader's own line work never shows through a mark, and the coloured
 * one is the mark. Swapping them, or merging them into one stroke with a paint
 * order trick, changes what a mark looks like over a dense plot.
 * @module dsh-figmark/client/canvas/overlay
 */

import type { ReactNode } from 'react'
import type { AnnotationMark } from '../../shared/annotation'
import { anchorCodeName } from '../../shared/mark-summary'
import { cursorFor, endHandles, handlesFor, tetherFor, type HandleId } from '../handles'
import type { MarkBox } from '../mark-geometry'
import {
  PIN_FONT_FAMILY, PIN_NUMBER_COLOR, hasFixedExtent, pinFontSizeOf,
  strokeWidthOf, markOutline, markPathData, markTransform, pinNumberCentre, pinPathData, pointMarkBox,
} from '../render'
import { HIT_WIDTH, controlBox } from './hit'
import { shownMark, type Press } from './press'
import type { ControlSizes } from './controls'
import type { SurfaceEvent } from './types'

/** Everything the layer needs to draw one frame of the surface. */
export interface MarkLayerProps {
  /** Committed marks, in draw order. */
  readonly marks: readonly AnnotationMark[]
  /** The mark being drawn, or null when the pointer is not drawing one. */
  readonly draft: AnnotationMark | null
  /** The gesture in flight, which may have displaced one of the marks. */
  readonly press: Press | null
  /** Currently selected mark. */
  readonly selectedId: string | null
  /** Each mark's number, for marks that carry one. */
  readonly numbers: ReadonlyMap<string, number>
  /** One figure pixel in the drawing's own units. */
  readonly unit: number
  /** Handle side and hairline, in figure pixels. */
  readonly sizes: ControlSizes
  /** Horizontal offset of figure `(0, 0)` on the paper, in figure pixels. */
  readonly originX: number
  /** Vertical offset of figure `(0, 0)` on the paper, in figure pixels. */
  readonly originY: number
  /** Width of the paper, in figure pixels: a label has to stay on it. */
  readonly width: number
  /** Height of the paper, in figure pixels. */
  readonly height: number
  /**
   * Whether an element mark's own rectangle is drawn beside its name.
   *
   * `'glow'` — the ordinary case — leaves the element to the light `spotlight.ts`
   * throws on it, because on a drawing a box around a curve covers half the plot and
   * claims a region the mark never meant. `'box'` draws the rectangle as well, for a
   * rendered document, where that rectangle is the element's own layout and saying it
   * adds nothing the page does not already say.
   */
  readonly elementExtent: 'glow' | 'box'
  /**
   * A press on a mark's drawn shape.
   *
   * The layer knows a shape was pressed but not what that means — a press that
   * lands on a handle resizes while one that lands on the shape moves — so it
   * reports the press and lets the gesture layer decide.
   */
  readonly onPressMark: (mark: AnnotationMark, event: SurfaceEvent) => void
  /** A press on one of the control handles. */
  readonly onPressHandle: (mark: AnnotationMark, event: SurfaceEvent, handle: HandleId) => void
  /** Open one mark for editing, after a double click on it. */
  readonly onEdit: (id: string) => void
}

/**
 * The pin a `point` mark is drawn as.
 *
 * A map pin, not a ring: a ring centred on a coordinate covers the very pixel it
 * claims and says nothing about where inside itself the coordinate is. A pin puts
 * its point on the spot and stands clear of it, and its solid body gives the mark's
 * number somewhere to live.
 *
 * The white halo is drawn first and thicker, so the marker reads over dense line
 * work — but it is the *only* white on the marker: the body is filled with the
 * mark's own colour, because a white body with a coloured digit was what the reader
 * compared to a washed-out sticker.
 */
function Pin(props: {
  readonly mark: AnnotationMark
  readonly unit: number
  readonly number: number | undefined
}): ReactNode {
  const { mark, unit, number } = props
  const pin = pinPathData(mark, unit)
  const centre = pinNumberCentre(mark, unit)
  /* v8 ignore next -- a point mark carries exactly the one coordinate it was placed at. */
  if (pin === undefined || centre === undefined) return null
  return (
    <>
      <path d={pin} fill="#ffffff" stroke="#ffffff" strokeWidth={4.5 * unit} strokeLinejoin="round" />
      <path d={pin} fill={mark.color} stroke="#ffffff" strokeWidth={1.5 * unit} strokeLinejoin="round" />
      <text x={centre[0]} y={centre[1]} fontFamily={PIN_FONT_FAMILY} fontSize={pinFontSizeOf(unit)}
        fontWeight={700} fill={PIN_NUMBER_COLOR} textAnchor="middle" dominantBaseline="central">
        {number}
      </text>
    </>
  )
}

/**
 * The highlight drawn around a selected point mark.
 *
 * A frame with eight resize handles would be a lie here: a point has no extent, so
 * there is nothing to stretch. A dashed box says "this one, and only selected"
 * without offering handles that would do nothing.
 *
 * An element mark is *not* framed. Its box is a rectangle the figure never draws —
 * around a curve it can cover half the plot — so a frame there would say "this
 * region" when the mark says "this thing". It reads as selected by being lit
 * harder, in its own shape, which is the rule in `spotlight.ts`.
 * @param props - the frame to draw, in figure pixels.
 * @returns the frame, or nothing when there is no box to draw it around.
 */
function FixedFrame(props: { readonly box: MarkBox | undefined; readonly hairline: number }): ReactNode {
  const { box, hairline } = props
  /* v8 ignore next -- both kinds that reach this frame always have a box. */
  if (box === undefined) return null
  // A control, like the frame around a stroke mark: sized on screen, not on the figure.
  const inset = 3 * hairline
  return (
    <rect
      x={box.x - inset} y={box.y - inset} width={box.width + 2 * inset}
      height={box.height + 2 * inset} rx={inset}
      fill="none" stroke="#4c8dff" strokeWidth={hairline}
      strokeDasharray={`${3 * hairline} ${2 * hairline}`}
      style={{ pointerEvents: 'none' }}
    />
  )
}

/**
 * The resize and rotation handles of the selected mark.
 *
 * The frame is drawn over the mark's drawn box, not over its stored points: a
 * turned box's handles have to be where the reader sees its corners, and the
 * handles themselves are drawn at a fixed screen size so they stay grabbable at any
 * zoom.
 */
function Handles(props: {
  readonly mark: AnnotationMark
  readonly sizes: ControlSizes
  readonly onPressHandle: MarkLayerProps['onPressHandle']
}): ReactNode {
  const { mark, sizes, onPressHandle } = props
  const { grip, hairline } = sizes
  const frame = controlBox(mark)
  const half = grip / 2
  const handles = handlesFor(frame, mark.rotation ?? 0, grip)
  // The turn handle sits off the box, so a tether is what makes it read as
  // attached to this mark rather than floating near it.
  const tether = tetherFor(frame, mark.rotation ?? 0, grip)
  return (
    <>
      <line
        x1={tether.from[0]} y1={tether.from[1]}
        x2={tether.to[0]} y2={tether.to[1]}
        stroke="#4c8dff" strokeWidth={hairline}
      />
      {handles.map(handle => (
        <g key={handle.id}>
          <rect
            data-da-handle={handle.id}
            x={handle.point[0] - half} y={handle.point[1] - half}
            width={grip} height={grip}
            rx={handle.id === 'rotate' ? grip / 2 : grip / 7}
            fill="#ffffff" stroke="#4c8dff" strokeWidth={1.5 * hairline}
            style={{ pointerEvents: 'all', cursor: cursorFor(handle.id) }}
            onPointerDown={(event) => { onPressHandle(mark, event, handle.id) }}
          />
        </g>
      ))}
    </>
  )
}

/**
 * The two end grips of a selected arrow.
 *
 * An arrow's controls are its ends: the line is the whole shape, and its tail and
 * tip are the only points that say where it is. It used to be framed like a box —
 * eight grips on the rectangle its ends span, plus a turn grip — which asked the
 * reader to stretch a line that has no width and put handles on four corners the
 * arrow never draws. The grips are drawn as circles rather than squares, so a grip
 * on a point of the line does not read as a corner of a box.
 */
function EndHandles(props: {
  readonly mark: AnnotationMark
  readonly sizes: ControlSizes
  readonly onPressHandle: MarkLayerProps['onPressHandle']
}): ReactNode {
  const { mark, sizes, onPressHandle } = props
  const { grip, hairline } = sizes
  const half = grip / 2
  return (
    <>
      {endHandles(mark.points, mark.rotation ?? 0).map(handle => (
        <g key={handle.id}>
          <rect
            data-da-handle={handle.id}
            x={handle.point[0] - half} y={handle.point[1] - half}
            width={grip} height={grip} rx={half}
            fill="#ffffff" stroke="#4c8dff" strokeWidth={1.5 * hairline}
            style={{ pointerEvents: 'all', cursor: cursorFor(handle.id) }}
            onPointerDown={(event) => { onPressHandle(mark, event, handle.id) }}
          />
        </g>
      ))}
    </>
  )
}

/** The font a code name is drawn in: a terminal's, because the name is code. */
const CODE_FONT_FAMILY = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

/**
 * Font size of a code name, in figure pixels.
 *
 * A shade larger than a pin's number: a pin says one digit and the eye can guess it,
 * while a name is read character by character, and monospace reads smaller than its
 * point size suggests.
 */
const CODE_FONT_SIZE = 12

/** Colour of a code name. Dark enough to read on the pale chip that carries it. */
const CODE_TEXT_COLOR = '#1f2937'

/** Widest a code name may be, in characters, before its middle is elided. */
const CODE_MAX_CHARS = 34

/**
 * Shorten a long name by its middle.
 *
 * An element with no id is named by its path, which can run to a whole selector line.
 * The end of that path says what the element is (`> section:nth-of-type(1)`) and the
 * start says where it sits, so the middle is what goes.
 * @param code - the name as the source words it.
 * @returns the name, elided when it is longer than a plate can carry.
 */
function elideCode(code: string): string {
  if (code.length <= CODE_MAX_CHARS) return code
  const head = Math.ceil((CODE_MAX_CHARS - 1) / 2)
  const tail = CODE_MAX_CHARS - 1 - head
  return `${code.slice(0, head)}…${code.slice(-tail)}`
}

/**
 * The element a mark is on, written out beside it.
 *
 * A chip is a small pale plate with a name on it, and on a slide it is never empty
 * space: parked above the element it covers the caption above it, parked below it
 * covers the paragraph. One chip on one mark was a label; three element marks on one
 * slide were three labels over the slide's own type, which is the piling the reader
 * complained about, only in smaller print. So the name is drawn for the mark being
 * worked on — the one whose element the reader is about to talk about — and for no
 * other. The box stays on every mark, and the list spells every row out in words.
 *
 * Placement is unchanged: above the element, below it when the top edge has no room,
 * kept on the paper. It is not a control: it takes no press, so a press that lands on
 * it reaches the mark's own hit area.
 */
function ElementCode(props: {
  readonly mark: AnnotationMark
  readonly box: MarkBox
  readonly unit: number
  /** The paper the chip has to stay on, in figure pixels. */
  readonly paper: { readonly left: number; readonly top: number; readonly right: number; readonly bottom: number }
  /** Whether the element's own rectangle is drawn as well. */
  readonly boxed: boolean
  /** Whether this is the mark the reader is working on, the only one that gets a name. */
  readonly named: boolean
}): ReactNode {
  const { mark, box, unit, paper, boxed, named } = props
  return (
    <g style={{ pointerEvents: 'none' }}>
      {boxed ? (
        <rect
          data-da-element-box={mark.id}
          x={box.x} y={box.y} width={box.width} height={box.height} rx={2 * unit}
          fill={mark.color} fillOpacity={0.07} stroke={mark.color} strokeWidth={1.5 * unit}
        />
      ) : null}
      {named ? <CodeChip mark={mark} box={box} unit={unit} paper={paper} /> : null}
    </g>
  )
}

/**
 * The plate that names an element, sized and placed from the element's box.
 *
 * Monospace gives every character the same advance, so the plate can be sized without
 * measuring text — which this module does not do, because the same code draws the
 * export copy outside a document.
 */
function CodeChip(props: {
  readonly mark: AnnotationMark
  readonly box: MarkBox
  readonly unit: number
  readonly paper: { readonly left: number; readonly top: number; readonly right: number; readonly bottom: number }
}): ReactNode {
  const { mark, box, unit, paper } = props
  /* v8 ignore next -- an element mark is made from the element it landed on. */
  if (mark.anchor === undefined) return null
  const code = elideCode(anchorCodeName(mark.anchor))
  const pad = 4 * unit
  const fontSize = CODE_FONT_SIZE * unit
  const width = code.length * fontSize * 0.62 + pad * 2
  const height = fontSize + pad * 1.6
  const gap = 4 * unit
  // Kept on the paper, start-first: the beginning of a name is the part that says
  // which element it is, so a chip near the right edge slides left rather than losing
  // its head.
  const limit = Math.max(paper.left, paper.right - width)
  const x = Math.min(Math.max(box.x, paper.left), limit)
  // Above the element, or below it when the top edge has no room: a mark on the
  // figure's first line still shows which element it is.
  const above = box.y - gap - height
  const wanted = above >= paper.top ? above : box.y + box.height + gap
  const y = Math.min(wanted, Math.max(paper.top, paper.bottom - height))
  return (
    <>
      <rect
        x={x} y={y} width={width} height={height} rx={3 * unit}
        fill="#ffffff" fillOpacity={0.94} stroke={mark.color} strokeWidth={1.2 * unit}
      />
      <text
        data-da-element-code={mark.id}
        x={x + pad} y={y + height / 2} fontFamily={CODE_FONT_FAMILY} fontSize={fontSize}
        fontWeight={600} fill={CODE_TEXT_COLOR} dominantBaseline="central"
      >
        {code}
      </text>
    </>
  )
}

/** One mark: its shape, its hit area, and whatever its selection asks for. */
function MarkShape(props: MarkLayerProps & { readonly mark: AnnotationMark; readonly isDraft: boolean }): ReactNode {  const { mark, isDraft, selectedId, numbers, unit, sizes, onPressMark, onEdit } = props
  // The running gesture is the mark's geometry until it is dropped, so the stroke
  // follows the pointer without the parent re-rendering the stored mark.
  const shown = shownMark(mark, props.press)
  const path = markPathData(shown, unit)
  const selected = selectedId === mark.id
  const transform = markTransform(shown)
  const isPoint = mark.kind === 'point'
  const pin = isPoint ? pinPathData(shown, unit) : undefined
  // An element mark draws no shape: the box it names belongs to the element, and the
  // only thing the mark itself puts on the paper is that name.
  const elementBox = mark.kind === 'element' ? markOutline(shown, unit) : undefined
  /**
   * What a press on the drawn shape starts.
   *
   * A point mark's target is its pin, which is a filled shape and not a stroke, so
   * it carries the hit area itself rather than relying on the invisible stroke the
   * other kinds draw along their path.
   */
  const hitArea = pin === undefined || isDraft ? null : (
    <path d={pin} fill="transparent" stroke="transparent" strokeWidth={HIT_WIDTH * unit}
      style={{ pointerEvents: 'all' }}
      onPointerDown={(event) => { onPressMark(mark, event) }}
      onDoubleClick={(event) => { event.stopPropagation(); onEdit(mark.id) }} />
  )
  return (
    <g data-da-mark={mark.id} opacity={isDraft ? 0.75 : 1}>
      {isPoint ? <Pin mark={shown} unit={unit} number={numbers.get(mark.id)} /> : null}
      {path === undefined ? null : (
        <g transform={transform}>
          <path d={path} fill="none" stroke="#ffffff" strokeWidth={strokeWidthOf(shown, unit) + 2.5 * unit}
            strokeLinecap="round" strokeLinejoin="round" />
          <path d={path} fill="none" stroke={shown.color} strokeWidth={strokeWidthOf(shown, unit)}
            strokeLinecap="round" strokeLinejoin="round" />
          {isDraft ? null : (
            <path d={path} fill="none" stroke="transparent" strokeWidth={HIT_WIDTH * unit}
              style={{ pointerEvents: 'stroke' }}
              onPointerDown={(event) => { onPressMark(mark, event) }}
              onDoubleClick={(event) => { event.stopPropagation(); onEdit(mark.id) }} />
          )}
        </g>
      )}
      {hitArea}
      {elementBox === undefined ? null : (
        <ElementCode
          mark={shown}
          box={elementBox}
          unit={unit}
          // The paper's edges in figure pixels: the overlay is moved by the origin, so
          // what is visible starts at `-origin`.
          paper={{
            left: -props.originX + 2, top: -props.originY + 2,
            right: -props.originX + props.width - 2, bottom: -props.originY + props.height - 2,
          }}
          boxed={props.elementExtent === 'box'}
          named={selected}
        />
      )}
      {selected && !isDraft && isPoint ? <FixedFrame box={pointMarkBox(shown, unit)} hairline={sizes.hairline} /> : null}
      {selected && !isDraft && mark.kind === 'arrow' ? (
        <EndHandles mark={shown} sizes={sizes} onPressHandle={props.onPressHandle} />
      ) : null}
      {selected && !isDraft && mark.kind !== 'arrow' && !hasFixedExtent(mark.kind) ? (
        <Handles mark={shown} sizes={sizes} onPressHandle={props.onPressHandle} />
      ) : null}
    </g>
  )
}

/**
 * Every mark, plus the one being drawn, inside the paper's origin offset.
 *
 * The offset belongs here rather than on the svg: the overlay *is* the paper, from
 * its own corner, and a mark dragged past the left edge has to land past the left
 * edge of the paper.
 * @param props - the frame to draw and the two press callbacks.
 * @returns the mark layer.
 */
export function MarkLayer(props: MarkLayerProps): ReactNode {
  return (
    <g transform={`translate(${props.originX} ${props.originY})`}>
      {props.marks.map(mark => <MarkShape key={mark.id} {...props} mark={mark} isDraft={false} />)}
      {props.draft === null ? null : <MarkShape key={props.draft.id} {...props} mark={props.draft} isDraft />}
    </g>
  )
}
