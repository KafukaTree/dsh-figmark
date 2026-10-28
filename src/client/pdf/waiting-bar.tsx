/**
 * The bar the pane shows before a page exists to carry one.
 *
 * The paging controls and the hand-off normally ride on the page body's own bar, which
 * lives in the pane and does not scroll. Until the first raster exists there is no body
 * to place them, so the pane stands one in: the page count and the hand-off are
 * answerable before the page arrives, and a reader who cannot draw yet can still be told
 * why. It is a copy of the body's bar on purpose — same card, same controls, same
 * order — so the frame around the wait does not move when the page appears.
 * @module dsh-figmark/client/pdf/waiting-bar
 */
import type { ReactNode } from 'react'
import type { Translate } from '../annotator-contract'
import { ChatIcon, SendIcon } from './icons'

/** What the waiting bar shows and reports. */
export interface WaitingBarProps {
  /** Copy seat. */
  readonly t: Translate
  /** The paging controls the document drew. */
  readonly paging: ReactNode
  /** Whether a hand-off is under way, so both buttons report it. */
  readonly busy: boolean
  /** Hand the annotation to the agent. */
  readonly onAgent: () => void
  /** Hand the annotation into the composer draft. */
  readonly onComposer: () => void
}

/**
 * The document's bar, standing in for the page body's.
 * @param props - the paging controls, the hand-off, and whether it is busy.
 * @returns the bar.
 */
export function WaitingBar(props: WaitingBarProps): ReactNode {
  const { t } = props
  return (
    <div className="da-bar" data-static="true" role="toolbar" aria-label={t('pagerLabel')}>
      {props.paging}
      <span className="da-spacer" />
      <span className="da-dock-sep" aria-hidden />
      <button type="button" className="da-dock-btn" disabled={props.busy}
        aria-label={t('sendToAgent')} title={t('sendToAgent')}
        onClick={props.onAgent}>
        <SendIcon />
      </button>
      <button type="button" className="da-dock-btn" disabled={props.busy}
        aria-label={t('sendToComposer')} title={t('sendToComposer')}
        onClick={props.onComposer}>
        <ChatIcon />
      </button>
    </div>
  )
}
