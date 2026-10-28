/**
 * The two strips that float over the figure: the tool palette and the bar.
 *
 * Both are drawn as values rather than in place in the body, because they may be
 * rendered somewhere else — a paged document hands this body a node of its own pane
 * and portals the strips into it, so a strip drawn inside a page would scroll away
 * with that page. Keeping them as their own components is what makes that a fact
 * about where they are rendered rather than a property of one huge JSX tree, and it
 * leaves the body holding only the state the strips report back.
 *
 * Nothing here decides anything: every flag and every callback comes from the body,
 * so a strip's markup says exactly what it always said and the behaviour stays in
 * one place.
 * @module dsh-figmark/client/annotator/chrome
 */
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode, RefObject } from 'react'
import type { AnnotationMark } from '../../shared/annotation'
import type { Tool } from '../Canvas'
import type { Translate } from '../translate'
import {
  ChatIcon, GoalIcon, GrabIcon, GripDots, ListIcon, RedoIcon, SendIcon, ToolIcon, UndoIcon,
} from './icons'
import { COLORS } from './tokens'

/**
 * What dragging one strip's handle does.
 *
 * The palette and the bar are dragged the same way, so the palette's handlers are
 * passed as one bundle and the bar's as another; the strip itself never knows which
 * of the two it is.
 */
export interface StripHandle {
  /** Whether this strip is being dragged right now. */
  readonly dragging: boolean
  /** Take the pointer and start following it. */
  readonly onDown: (event: ReactPointerEvent<HTMLDivElement>) => void
  /** Follow the held pointer. */
  readonly onMove: (event: ReactPointerEvent<HTMLDivElement>) => void
  /** Let go. */
  readonly onUp: (event: ReactPointerEvent<HTMLDivElement>) => void
  /** The browser took the pointer away. */
  readonly onCancel: () => void
}

/** Where one tool tile stands in the row. */
export interface ToolEntry {
  /** The tool the tile arms. */
  readonly tool: Tool
  /** The copy key naming it. */
  readonly label: string
}

/** Everything the tool palette's markup reads. */
export interface ToolPaletteProps {
  /** The strip's own box, measured while it is dragged. */
  readonly stripRef: RefObject<HTMLDivElement>
  /** Where it sits, as fractions of the panel. */
  readonly style: CSSProperties
  /** Its drag handlers. */
  readonly handle: StripHandle
  /** The tiles to draw, already narrowed to what this figure can use. */
  readonly tools: readonly ToolEntry[]
  /** The tool currently armed. */
  readonly tool: Tool
  /** Arm one tool. */
  readonly onChoose: (tool: Tool) => void
  /** The translator seat. */
  readonly t: Translate
}

/**
 * The tool row: one tile per tool this figure can use.
 *
 * The grip above the tiles is what drags the strip; the tiles themselves stay
 * buttons, because a drag that starts on a tool should still arm that tool.
 * @param props - the strip's placement, drag, and the tools to offer.
 * @returns the palette strip.
 */
export function ToolPalette(props: ToolPaletteProps): ReactNode {
  const { handle, t, tools } = props
  return (
    <div className="da-palette" ref={props.stripRef}
      data-dragging={handle.dragging ? 'true' : undefined}
      style={props.style}
      role="toolbar" aria-label={t('tools')}>
      <div className="da-palette-grip" title={t('moveTools')}
        onPointerDown={handle.onDown}
        onPointerMove={handle.onMove}
        onPointerUp={handle.onUp}
        onPointerCancel={handle.onCancel}>
        <GripDots wide />
      </div>
      {tools.map(entry => (
        <button key={entry.tool} type="button" className="da-btn da-tool"
          aria-pressed={props.tool === entry.tool}
          aria-label={t(entry.label)}
          title={t(entry.label)}
          onClick={() => { props.onChoose(entry.tool) }}>
          <span className="da-tool-icon" aria-hidden>
            {entry.tool === 'select' ? <GrabIcon /> : ToolIcon(entry.tool)}
          </span>
        </button>
      ))}
    </div>
  )
}

/** Everything the bar's markup reads. */
export interface FigureBarProps {
  /** The strip's own box, measured while it is dragged. */
  readonly stripRef: RefObject<HTMLDivElement>
  /** Its inline placement, or undefined while the stylesheet's own bottom edge owns it. */
  readonly style: CSSProperties | undefined
  /** Whether it has been dragged off the bottom edge. */
  readonly parked: boolean
  /** Its drag handlers. */
  readonly handle: StripHandle
  /** The paged document's own paging controls, placed before the pen. */
  readonly pagingSlot: ReactNode | undefined
  /** The colour the next stroke would be drawn in, or the selected mark's. */
  readonly shownColor: string
  /** Whether the style fold is open. */
  readonly styleOpen: boolean
  /** Whether that fold would come out of the top of the panel if it climbed. */
  readonly foldOpensDown: boolean
  /** Open or close the style fold; the colour it is drawn in. */
  readonly onToggleStyle: () => void
  /** Arm the next stroke, or repaint the selected mark, with one colour. */
  readonly onChooseColor: (value: string) => void
  /** Whether the overall goal's record is open. */
  readonly goalOpen: boolean
  /** What the reader said the whole figure should become. */
  readonly summary: string
  /** Open or close the goal record. */
  readonly onToggleGoal: () => void
  /** Whether the marks list is open. */
  readonly listOpen: boolean
  /** The marks the document holds, for the count on the list button. */
  readonly listedMarks: readonly AnnotationMark[]
  /** Open or close the marks list. */
  readonly onToggleList: () => void
  /** How many undo steps are recorded. */
  readonly pastCount: number
  /** How many redo steps are recorded. */
  readonly futureCount: number
  /** Take one step back. */
  readonly undo: () => void
  /** Take one step forward. */
  readonly redo: () => void
  /**
   * Whether this body is one page of a document its owner persists.
   *
   * A page has no seat of its own, so the owner's callback stands in for its
   * hand-off — and when the owner has supplied none, the page shows no buttons.
   */
  readonly isPage: boolean
  /** The owner's own hand-off, for a page that has one. */
  readonly onSend: ((target: 'agent' | 'composer') => void) | undefined
  /** Hand the annotation to the agent. */
  readonly sendToAgent: () => void
  /** Hand it to the composer instead. */
  readonly sendToComposer: () => void
  /** What is going on, when something is. A hand-off in flight disables both buttons. */
  readonly busy: boolean
  /** The translator seat. */
  readonly t: Translate
}

/**
 * The bar: every control that acts on the picture, along one edge.
 *
 * Every control lives here — the style fold, the history steps, the records and the
 * way out — because the figure above is what the panel is for, and nothing should
 * take a row from it. A control along the bottom edge is a control the reader's eye
 * already knows to look for, from every viewer they have used.
 * @param props - the strip's placement, the state it shows, and what its buttons do.
 * @returns the bar strip.
 */
export function FigureBar(props: FigureBarProps): ReactNode {
  const { handle, t } = props
  return (
    <div className="da-bar" ref={props.stripRef} data-dragging={handle.dragging ? 'true' : undefined}
      /* A parked bar is placed from the top, and the stylesheet's own bottom offset
         has to go with it or the strip stretches to fill the pane. An attribute
         rather than `bottom:auto` inline, because the offset is a rule and a rule
         beats nothing but loses to any inline value that happens to survive. */
      data-parked={props.parked ? 'true' : undefined} style={props.style}>
      <div className="da-palette-grip" title={t('moveBar')}
        onPointerDown={handle.onDown}
        onPointerMove={handle.onMove}
        onPointerUp={handle.onUp}
        onPointerCancel={handle.onCancel}>
        <GripDots wide={false} />
      </div>
      {/* Where the document is, and how to move through it, before the pen: paging
          is what the reader decides first, and the colour belongs to the stroke
          that comes after. Drawn by the paged owner and only placed here, because
          the page number is that owner's to keep. */}
      {props.pagingSlot === undefined ? null : (
        <>
          {props.pagingSlot}
          <span className="da-sep" aria-hidden />
        </>
      )}
      {/* The fold that steers the next stroke: the colour it is drawn in. It opens
          upwards, clear of the bar itself. */}
      <div className="da-bar-tools">
        <button type="button" className="da-btn da-style" aria-expanded={props.styleOpen}
          aria-label={t('style')} title={t('style')}
          onClick={props.onToggleStyle}>
          <span className="da-swatch-dot" style={{ background: props.shownColor }} />
          <span className="da-style-caret" aria-hidden>{props.styleOpen ? '\u25b4' : '\u25be'}</span>
        </button>
      </div>
      {/* The fold that steers the next stroke, opened upwards clear of the bar. */}
      {props.styleOpen ? (
        <div className="da-style-row" role="group" aria-label={t('style')}
          data-side={props.foldOpensDown ? 'below' : 'above'}>
          <span className="da-style-label">{t('styleColor')}</span>
          <div className="da-style-colors">
            {COLORS.map(value => (
              <button key={value} type="button" className="da-swatch" aria-pressed={props.shownColor === value}
                style={{ background: value }} aria-label={value} title={value}
                onClick={() => { props.onChooseColor(value) }} />
            ))}
          </div>
        </div>
      ) : null}
      <span className="da-sep" aria-hidden />
      <span className="da-spacer" />
      {/* One fold for each record, with the count riding on the one that has a
          count to give. */}
      <button type="button" className="da-dock-btn" aria-pressed={props.goalOpen}
        aria-label={t('summary')} title={t('summary')}
        onClick={props.onToggleGoal}>
        <GoalIcon />
        {props.summary.trim() === '' ? null : <span className="da-dock-dot" aria-hidden />}
      </button>
      <button type="button" className="da-dock-btn" aria-pressed={props.listOpen}
        aria-label={t('marks')} title={t('marks')}
        onClick={props.onToggleList}>
        <ListIcon />
        {/* The badge counts the document, not this sheet: the column moves the
            chrome from page to page, and a count that changed as the reader
            scrolled would be describing a different document every second. */}
        {props.listedMarks.length === 0 ? null : <span className="da-dock-count">{props.listedMarks.length}</span>}
      </button>
      <span className="da-dock-sep" aria-hidden />
      {/* The keyboard reaches undo and redo whatever the buttons show, so the
          disabled state is an affordance and the guards behind the handlers are
          what actually decide. */}
      <button type="button" className="da-dock-btn" aria-label={t('undo')} title={t('undo')}
        disabled={props.pastCount === 0} onClick={props.undo}>
        <UndoIcon />
      </button>
      <button type="button" className="da-dock-btn" aria-label={t('redo')} title={t('redo')}
        disabled={props.futureCount === 0} onClick={props.redo}>
        <RedoIcon />
      </button>
      {/* The hand-off is the last thing on the bar, past everything that edits,
          because it ends the session rather than continuing it. A page body has no
          seat of its own, so its owner's callback stands in — the marks still go
          out from one place, whichever page the reader happened to be on. */}
      {props.isPage && props.onSend === undefined ? null : (
        <>
          <span className="da-dock-sep" aria-hidden />
          <button type="button" className="da-dock-btn" disabled={props.busy}
            aria-label={t('sendToAgent')} title={t('sendToAgent')}
            onClick={props.sendToAgent}>
            <SendIcon />
          </button>
          <button type="button" className="da-dock-btn" disabled={props.busy}
            aria-label={t('sendToComposer')} title={t('sendToComposer')}
            onClick={props.sendToComposer}>
            <ChatIcon />
          </button>
        </>
      )}
    </div>
  )
}
