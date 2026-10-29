/**
 * The pill the selected mark's sentence is written in.
 *
 * It is one rounded field that opens on the spot the reader just marked, rather
 * than a card with a title and a cross: the sentence says which mark it belongs to
 * because it appeared next to it, and clicking anywhere else puts it away. The two
 * hand-off buttons appear only once there is something to hand off, which is what
 * the field's own width has to account for — which is why the pill, not the field,
 * is the thing that gets measured for placement.
 * @module dsh-figmark/client/annotator/detail-pill
 */
import type { RefObject, ReactNode } from 'react'
import { MAX_DETAIL_CHARS, type AnnotationMark } from '../../shared/annotation'
import type { Translate } from '../translate'
import { ChatIcon, SendIcon } from './icons'

/** What the detail pill reads and reports. */
export interface DetailPillProps {
  /** The pill's own box, measured so its placement can be computed from it. */
  readonly pillRef: RefObject<HTMLDivElement>
  /** The field the caret goes into. */
  readonly inputRef: RefObject<HTMLTextAreaElement>
  /** Where the pill sits, as measured against the panel. */
  readonly at: { readonly left: number; readonly top: number }
  /** The mark whose sentence this is. */
  readonly mark: AnnotationMark
  /** Write the sentence. */
  readonly onWrite: (value: string) => void
  /** Hand this one mark to the agent. */
  readonly onSendToAgent: () => void
  /** Hand this one mark to the chat box. */
  readonly onSendToComposer: () => void
  /** Whether a hand-off is already in flight. */
  readonly busy: boolean
  /** The translator seat. */
  readonly t: Translate
}

/** Whether this mark has a sentence yet. */
function hasDetail(mark: AnnotationMark): boolean {
  return mark.detail !== undefined && mark.detail.trim() !== ''
}

/**
 * The comment pill.
 * @param props - the mark, its placement, and the ways out of it.
 * @returns the pill, or nothing when there is no sentence to write yet.
 */
export function DetailPill(props: DetailPillProps): ReactNode {
  const { mark, t } = props
  return (
    <div className="da-float da-float-detail" role="group" aria-label={t('detail')}
      ref={props.pillRef}
      style={{ left: props.at.left, top: props.at.top }}>
      <textarea
        ref={props.inputRef}
        className="da-comment"
        value={mark.detail ?? ''}
        placeholder={hasDetail(mark) ? t('detailPlaceholder') : t('addComment')}
        rows={1}
        maxLength={MAX_DETAIL_CHARS}
        onChange={(event) => { props.onWrite(event.target.value) }}
      />
      {hasDetail(mark) ? (
        <div className="da-comment-send">
          <button type="button" className="da-comment-send-btn da-comment-send-primary"
            disabled={props.busy}
            aria-label={t('sendToAgent')} title={t('sendToAgent')}
            onClick={() => { props.onSendToAgent() }}>
            <SendIcon />
          </button>
          <button type="button" className="da-comment-send-btn"
            disabled={props.busy}
            aria-label={t('sendToComposer')} title={t('sendToComposer')}
            onClick={() => { props.onSendToComposer() }}>
            <ChatIcon />
          </button>
        </div>
      ) : null}
    </div>
  )
}
