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
import { cursorFor, handlesFor, tetherFor, type HandleId } from '../handles'
import type { MarkBox } from '../mark-geometry'
import {
  PIN_FONT_FAMILY, PIN_NUMBER_COLOR, hasFixedExtent, pinFontSizeOf, strokeWidthOf,
  markPathData, markTransform, pinNumberCentre, pinPathData, pointMarkBox,
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

/** One mark: its shape, its hit area, and whatever its selection asks for. */
function MarkShape(props: MarkLayerProps & { readonly mark: AnnotationMark; readonly isDraft: boolean }): ReactNode {
  const { mark, isDraft, selectedId, numbers, unit, sizes, onPressMark, onEdit } = props
  // The running gesture is the mark's geometry until it is dropped, so the stroke
  // follows the pointer without the parent re-rendering the stored mark.
  const shown = shownMark(mark, props.press)
  const path = markPathData(shown, unit)
  const selected = selectedId === mark.id
  const transform = markTransform(shown)
  const isPoint = mark.kind === 'point'
  const pin = isPoint ? pinPathData(shown, unit) : undefined
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
      {selected && !isDraft && isPoint ? <FixedFrame box={pointMarkBox(shown, unit)} hairline={sizes.hairline} /> : null}
      {selected && !isDraft && !hasFixedExtent(mark.kind) ? (
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
