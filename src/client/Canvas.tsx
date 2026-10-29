/**
 * The drawing surface.
 *
 * It renders the marks over the figure and turns pointer input into marks. Every
 * shape is committed as a mark the parent owns; the component keeps only the mark
 * currently being drawn. Coordinates are always figure pixels, so the same mark
 * means the same thing at any zoom or pane width.
 *
 * The four jobs that used to share this file have moved to `canvas/`: `types` is the
 * contract, `pointer` the only place a DOM rectangle is read, `marks` and `press`
 * the arithmetic of what a gesture draws, `overlay` the drawing, and `gesture` the
 * pointer machine. What is left here is the assembly — read the paper's geometry
 * off the props, hand it to the machine, and put the two layers in an svg.
 * @module dsh-figmark/client/Canvas
 */
import type { ReactNode } from 'react'
import { markOrdinals } from '../shared/annotation'
import { figureUnit } from './scale'
import { useCanvasGesture } from './canvas/gesture'
import { MarkLayer } from './canvas/overlay'
import type { CanvasProps } from './canvas/types'

export type { CanvasProps, MarkPatch, Tool } from './canvas/types'
export { nextMarkId } from './canvas/ids'

/**
 * Draw the marks and collect pointer input.
 * @param props - figure geometry, marks, tool state, and callbacks.
 * @returns the overlay element.
 */
export function Canvas(props: CanvasProps): ReactNode {
  const { width, height, marks, tool } = props
  const [originX, originY] = props.origin ?? [0, 0]
  /**
   * Each mark's number, by id, counted inside the mark's own kind.
   *
   * A page's marks are drawn from a slice of the document's list, so the numbers come
   * from the document when it supplies them and from the slice's own count otherwise.
   * The document's map wins where both have the mark: a PDF page's pins have to
   * continue the document's numbering, not restart it.
   */
  const numbers = new Map([...markOrdinals(marks), ...(props.numbering ?? [])])
  /**
   * How big everything is drawn here, as a multiple of the base sizes.
   *
   * Measured from the *figure*, not from the paper this surface draws on: the paper
   * grows to hold a mark drawn past the figure's edge, and a pen sized from the grown
   * paper got thicker for it. The exported picture was always sized from the figure,
   * so sizing from the paper meant the panel and the record of what the reader
   * approved drew the same mark at different weights. Omitted `figureSize` is the
   * ordinary case where nothing grew the paper and the two sizes are one.
   */
  const drawnWidth = props.figureSize?.width ?? width
  const drawnHeight = props.figureSize?.height ?? height
  const unit = figureUnit(drawnWidth, drawnHeight)
  const gesture = useCanvasGesture(props, { width, height, originX, originY })
  const { handlers } = gesture

  return (
    <svg
      className="da-overlay"
      data-da-overlay=""
      // The overlay is the paper, from its own corner: the offset into the paper
      // belongs to the marks inside it (`origin`), and putting it on this box as
      // well moved every mark twice as far as it should have gone. A mark dragged
      // past the left edge therefore appeared past the right one.
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      data-tool={tool}
      onPointerDownCapture={handlers.onPointerDownCapture}
      onPointerDown={handlers.onPointerDown}
      onPointerMove={handlers.onPointerMove}
      onPointerUp={handlers.onPointerUp}
      onPointerCancel={handlers.onPointerCancel}
      // Leaving the surface is the one move that is not a move: the picker has no
      // element under it any more, so the highlight goes rather than staying lit on
      // whatever the pointer last crossed.
      onPointerLeave={handlers.onPointerLeave}
      onDoubleClick={handlers.onDoubleClick}
      onClick={handlers.onClick}
    >
      <MarkLayer
        marks={marks}
        draft={gesture.draft}
        press={gesture.press}
        selectedId={props.selectedId}
        numbers={numbers}
        unit={unit}
        sizes={gesture.sizes}
        originX={originX}
        originY={originY}
        onPressMark={handlers.onPressMark}
        onPressHandle={handlers.onPressHandle}
        onEdit={props.onEdit}
      />
    </svg>
  )
}
