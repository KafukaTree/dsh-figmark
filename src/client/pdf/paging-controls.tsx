/**
 * The paging controls the document hands to its page body to place.
 *
 * The page number is the document's own state and the bar is the page body's to
 * position, so these controls are drawn here and rendered there. That split is why
 * this module takes callbacks rather than paging state of its own: it is a view over
 * numbers the document already keeps.
 * @module dsh-figmark/client/pdf/paging-controls
 */
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react'
import type { Translate } from '../annotator-contract'
import { ChevronLeftIcon, ChevronRightIcon } from './icons'

/** What the paging controls read and report. */
export interface PagingControlsProps {
  /** Copy seat. */
  readonly t: Translate
  /** The page the toolbar states, already clamped to the document. */
  readonly stated: number
  /** Pages in the document; 0 before it opened. */
  readonly pageCount: number
  /**
   * Whether the document has opened at all.
   *
   * A document that reports no pages is not the same as no document: the first can
   * still be told its length, and its both-ways-disabled controls are how it says so.
   */
  readonly open: boolean
  /** Whether the page number is a box right now rather than a label. */
  readonly editing: boolean
  /** What the box holds while the reader types in it. */
  readonly pageText: string
  /** Turn to a page. @param next - the page asked for. */
  readonly onGoTo: (next: number) => void
  /** Start editing the page number. */
  readonly onEdit: () => void
  /** Write what the box holds. @param text - the box's value. */
  readonly onPageText: (text: string) => void
  /** Take the page number the box holds. */
  readonly onCommit: () => void
  /** Stop editing the page number. */
  readonly onStopEditing: () => void
  /** A keystroke in the box. @param event - the key event. */
  readonly onSubmitKey: (event: ReactKeyboardEvent<HTMLInputElement>) => void
}

/**
 * One step back, the page number, one step forward.
 *
 * A document that reports no pages still gets a disabled pair and the number `1`,
 * because the wait for the first raster is exactly when the reader needs to be told
 * how long the document is.
 *
 * @param props - the page on screen, the document's length, and the two writers.
 * @returns the controls.
 */
export function PagingControls(props: PagingControlsProps): ReactNode {
  const { t, stated, pageCount } = props
  return (
    <>
      <div className="da-docbar-group">
        <button type="button" className="da-dock-btn" aria-label={t('previousPage')}
          title={t('previousPage')} disabled={stated <= 1} onClick={() => { props.onGoTo(stated - 1) }}>
          <ChevronLeftIcon />
        </button>
        {props.editing
          ? (
              <input className="da-page-input" autoFocus inputMode="numeric"
                aria-label={t('pageJump')} value={props.pageText}
                onChange={event => { props.onPageText(event.target.value) }}
                onBlur={() => { props.onCommit(); props.onStopEditing() }}
                onKeyDown={props.onSubmitKey} />
            )
          : (
              <button type="button" className="da-page da-page-btn" title={t('pageJump')}
                aria-label={t('pageJump')}
                onClick={() => { props.onEdit() }}>
                {props.open ? `${stated} / ${pageCount}` : `${stated}`}
              </button>
            )}
        <button type="button" className="da-dock-btn" aria-label={t('nextPage')}
          title={t('nextPage')} disabled={props.open && stated >= pageCount}
          onClick={() => { props.onGoTo(stated + 1) }}>
          <ChevronRightIcon />
        </button>
      </div>
    </>
  )
}
