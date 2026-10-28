/**
 * The room the figure is drawn in: the scrollport, the sheet, and the figure itself.
 *
 * Three nested boxes, and each one has a job the others cannot do. The stage is the
 * scrollport — its scroll offset is what a pan and a pinch write to, and it is the
 * element the reader's saved scroll position is restored onto. The surface is the
 * paper at the factor it is drawn at, so the scrollport knows how much there is to
 * scroll. The paper inside it is the paper at its own size, one transform away from
 * the surface, which is what keeps the figure and the overlay from drifting apart at
 * a fractional factor. The figure frame is where the figure sits on that paper, at
 * its own offset, because the paper may be bigger than the figure — a mark in the
 * margin needs somewhere to be drawn.
 *
 * The overlay is a child rather than a sibling drawn here: it knows about marks and
 * tools, which is the body's business, and passing the drawn element in is what keeps
 * this module from learning any of it.
 * @module dsh-figmark/client/annotator/figure-room
 */
import type { CSSProperties, MouseEvent as ReactMouseEvent, ReactNode, RefObject } from 'react'
import type { Translate } from '../translate'
import type { LoadedFigure } from './figure-source'

/** What the figure room reads and reports. */
export interface FigureRoomProps {
  /** The scrollport, which the owner also registers as its own. */
  readonly stageRef: (element: HTMLDivElement | null) => void
  /** The surface's box, at the factor it is drawn at. */
  readonly surfaceRef: RefObject<HTMLDivElement>
  /** The paper's own box, which a pinch writes its live factor onto. */
  readonly paperRef: RefObject<HTMLDivElement>
  /** The frame the figure sits in, which the detail card is placed against. */
  readonly figureRef: RefObject<HTMLDivElement>
  /** Where the figure's own markup was injected, which element selectors root at. */
  readonly hostRef: RefObject<HTMLDivElement>
  /** The frame a rendered document is loaded into, when this body holds one. */
  readonly frameRef: RefObject<HTMLIFrameElement>
  /** The styles the three boxes are drawn with. */
  readonly surfaceStyle: CSSProperties
  readonly paperStyle: CSSProperties
  readonly figureStyle: CSSProperties
  /** The figure, or null before there is one to draw. */
  readonly figure: LoadedFigure | null
  /** The surface's measurable size, or null before it is known. */
  readonly size: { readonly width: number; readonly height: number } | null
  /** The height a rendered document's frame reported. */
  readonly htmlHeight: number
  /** The mark surface's own draggable area. */
  readonly stageClass: StageCursor
  /** Right-click on the figure asks for its menu. */
  readonly onContextMenu: (event: ReactMouseEvent) => void
  /** The decoded natural size of a raster, once the browser has decoded it. */
  readonly onRasterLoad: (size: { readonly width: number; readonly height: number }) => void
  /** The overlay drawn over the paper: the canvas, when there is a paper to draw on. */
  readonly overlay: ReactNode
  /** The translator seat. */
  readonly t: Translate
}

/** What the stage's cursor says about the gesture available there. */
export interface StageCursor {
  /** Whether the grab cursor is offered: only under `select`, whose drag has no other job. */
  readonly hand: boolean
  /** Whether the hand has closed on the table. */
  readonly panning: boolean
}

/**
 * The stage, the sheet, the paper, and the figure.
 * @param props - the boxes, the figure to put in them, and the overlay to draw over it.
 * @returns the figure room.
 */
export function FigureRoom(props: FigureRoomProps): ReactNode {
  const { figure, t } = props
  return (
    /* `data-hand` asks for the grab cursor only under `select`, because that is
       the one tool whose drag has no other job; `data-panning` is the hand closed. */
    <div className="da-stage" ref={props.stageRef}
      onContextMenu={props.onContextMenu}
      data-hand={props.stageClass.hand ? 'true' : undefined}
      data-panning={props.stageClass.panning ? 'true' : undefined}>
      <div className="da-surface" ref={props.surfaceRef} style={props.surfaceStyle}>
        <div className="da-paper" ref={props.paperRef} style={props.paperStyle}>
          <div className="da-figure-frame" ref={props.figureRef} style={props.figureStyle}>
            {figure?.kind === 'svg' ? (
              <div ref={props.hostRef} dangerouslySetInnerHTML={{ __html: figure.markup }} />
            ) : figure?.kind === 'raster' ? (
              <img
                className="da-figure"
                src={figure.objectUrl}
                width={props.size?.width}
                height={props.size?.height}
                alt=""
                onLoad={(event) => {
                  const image = event.currentTarget
                  props.onRasterLoad({ width: image.naturalWidth, height: image.naturalHeight })
                }}
              />
            ) : figure?.kind === 'html' ? (
              // Same origin, scripts off: the body may read the frame's markup and
              // nothing inside it can run or reach anywhere. The overlay above
              // takes every pointer event, so the document is never navigated.
              <iframe
                ref={props.frameRef}
                className="da-html"
                title={t('htmlFrame')}
                sandbox="allow-same-origin"
                // The height the frame reported for its own content: until it
                // reports one, the surface is not there to draw on.
                style={{ width: figure.width, height: props.htmlHeight }}
              />
            ) : null}
          </div>
          {props.overlay}
        </div>
      </div>
    </div>
  )
}
