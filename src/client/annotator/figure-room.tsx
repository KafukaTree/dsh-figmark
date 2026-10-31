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
import type {
  CSSProperties, MouseEvent as ReactMouseEvent, ReactNode, RefObject, WheelEvent as ReactWheelEvent,
} from 'react'
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
  /**
   * The window a rendered document is shown through, in figure pixels.
   *
   * A frame that has not been measured yet still gets the pane's own size, so the
   * document's first layout is the pane's and not a placeholder's.
   */
  readonly htmlView: { readonly width: number; readonly height: number }
  /**
   * The address the frame navigates to, when the page is not the file's own document.
   *
   * A page a server serves cannot be written into the frame: it has to be fetched and
   * run the way the browser would. Pointing the frame at it is what makes the preview
   * that page and not a copy of it.
   */
  readonly pageUrl?: string | undefined
  /**
   * Pointer travel that the page, rather than the panel, should take.
   *
   * The overlay takes every pointer event — that is what makes a click a mark — so a
   * wheel over a rendered document has to be handed to the document. Nothing is
   * forwarded on a figure: a picture does not scroll inside itself.
   */
  readonly onWheel: ((event: ReactWheelEvent<HTMLDivElement>) => void) | undefined
  /** The mark surface's own draggable area. */
  readonly stageClass: StageCursor
  /**
   * Whether the page under the overlay is the reader's to use.
   *
   * A rendered document is a page, and a page that cannot be clicked, scrolled or
   * played is a picture of a page. So while no mark-making tool is armed the frame
   * takes its own pointer events and the overlay steps out of the way: a link follows,
   * a button presses, a video plays. The marks stay on top of it — they are the one
   * thing on this surface that is still the panel's.
   */
  readonly passing: boolean
  /** Right-click on the figure asks for its menu. */
  readonly onContextMenu: (event: ReactMouseEvent) => void
  /** The decoded natural size of a raster, once the browser has decoded it. */
  readonly onRasterLoad: (size: { readonly width: number; readonly height: number }) => void
  /** The overlay drawn over the paper: the canvas, when there is a paper to draw on. */
  readonly overlay: ReactNode
  /**
   * The name of the element the pointer is on, drawn beside it.
   *
   * Passed in rather than built here for the same reason the overlay is: it is about
   * marks and tools, which is the body's business.
   */
  readonly chip?: ReactNode
  /** The translator seat. */
  readonly t: Translate
}

/** What the stage's cursor says about the gesture available there. */
export interface StageCursor {
  /** Whether the grab cursor is offered: only under `select`, whose drag has no other job. */
  readonly hand: boolean
  /** Whether the hand has closed on the table. */
  readonly panning: boolean
  /** Whether there is actually more paper than the window can show. */
  readonly pannable: boolean
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
      onWheel={props.onWheel}
      /* A rendered document is a window: the page scrolls inside it, so the pane
         around it must not scroll as well and give the reader two scrollbars. */
      data-html={figure?.kind === 'html' ? 'true' : undefined}
      data-pass={props.passing ? 'true' : undefined}
      data-hand={props.stageClass.hand ? 'true' : undefined}
      data-pannable={props.stageClass.pannable ? 'true' : undefined}
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
              // Same origin, and the page's own scripts run: a document that cannot
              // run its own script is not the document — a deck would show its first
              // slide's markup and never turn a page, a player would show a poster.
              // The policy the document is built with is what keeps that script from
              // phoning home; the sandbox is what keeps it from navigating the panel.
              //
              // The frame is a browser window, not a sheet: the pane's width and the
              // pane's height, with the document scrolling inside it. That is what
              // lets a page lay itself out the way its author wrote it — `100vh` is a
              // screenful, a sticky header sticks — and the frame reports its own
              // layout pixels, which are the pixels a mark is recorded in.
              <iframe
                // A frame pointed at another origin can never be written into again, so
                // going back to the file remounts it rather than reusing a window the
                // panel has lost.
                key={props.pageUrl ?? 'file'}
                ref={props.frameRef}
                className="da-html"
                title={t('htmlFrame')}
                src={props.pageUrl}
                sandbox="allow-same-origin allow-scripts allow-forms allow-modals allow-popups allow-presentation"
                style={{ width: props.htmlView.width, height: props.htmlView.height }}
              />
            ) : null}
          </div>
          {props.overlay}
          {/* Inside the paper, so the name is placed in the document's own pixels and
              the window clips it exactly where it clips the page. */}
          {props.chip}
        </div>
      </div>
    </div>
  )
}
