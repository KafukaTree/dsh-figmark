/**
 * The two records: what the figure as a whole should become, and the map of every
 * mark the document holds.
 *
 * They are folds over the figure rather than parts of it — each is opened from the
 * bar, each closes on its own button, and neither of them has anything to do while
 * the reader is drawing. Drawn here rather than inline in the body because they are
 * markup and nothing else: every word they show and every change they make is
 * handed in, so the body keeps the state and these keep the shape.
 * @module dsh-figmark/client/annotator/records
 */
import type { ReactNode } from 'react'
import { MAX_SUMMARY_CHARS, type AnnotationMark } from '../../shared/annotation'
import type { Translate } from '../translate'
import { BoxIcon, GoalIcon, ListIcon, ToolIcon } from './icons'
import { anchorName } from './mark-labels'
import type { RecordPlacement } from '../popover'
import { recordStyle } from './placement'
import { TOOL_COPY } from './tokens'

/**
 * How close to the ceiling the count is shown from.
 *
 * A fraction that is on screen while there is nothing to worry about is a fraction
 * the reader learns to ignore; it appears when the note is nearly full, which is
 * when knowing the number is worth the space.
 */
const COUNT_WARNING_ROOM = 200

/** What the overall-goal record reads and reports. */
export interface SummaryRecordProps {
  /** Where the record hangs. */
  readonly at: RecordPlacement | null
  /** What the reader wants the whole figure to become. */
  readonly summary: string
  /** Write that text. */
  readonly onWrite: (value: string) => void
  /** Put the record away. */
  readonly onClose: () => void
  /** The translator seat. */
  readonly t: Translate
}

/**
 * The overall goal, as one fold.
 *
 * One per figure, so it is a fold of its own rather than a field beside one mark:
 * this is not a note about a place on the picture, it is what the picture is meant
 * to become.
 * @param props - the record's placement, text, and the two things it can do.
 * @returns the goal record.
 */
export function SummaryRecord(props: SummaryRecordProps): ReactNode {
  const { t } = props
  return (
    <div className="da-float da-float-record da-float-goal" role="group" aria-label={t('summary')}
      style={recordStyle(props.at)}>
      <div className="da-float-head">
        <span className="da-card-title">
          <GoalIcon />{t('summary')}
          <span className="da-hintdot" title={t('overallHint')}>?</span>
        </span>
        <button type="button" className="da-btn da-btn-quiet"
          aria-label={t('close')} title={t('close')}
          onClick={() => { props.onClose() }}>✕</button>
      </div>
      <label className="da-field">
        <textarea
          value={props.summary}
          placeholder={t('summaryPlaceholder')}
          maxLength={MAX_SUMMARY_CHARS}
          onChange={(event) => { props.onWrite(event.target.value) }}
        />
        {/* A count without a stop is a count that lies: the reader saw a ceiling
            that nothing enforced, and the note grew past it into a sidecar the Host
            would refuse. `maxLength` is the stop; the count is now what it looks
            like, a fraction of a real limit. */}
        {props.summary.length <= MAX_SUMMARY_CHARS - COUNT_WARNING_ROOM ? null : (
          <span className="da-count">{props.summary.length}/{MAX_SUMMARY_CHARS}</span>
        )}
      </label>
    </div>
  )
}

/** What the document's list of marks reads and reports. */
export interface MarkListProps {
  /** Where the list hangs. */
  readonly at: RecordPlacement | null
  /** Every mark the document holds, in the document's own numbering order. */
  readonly marks: readonly AnnotationMark[]
  /** The mark currently picked out, if any. */
  readonly selectedId: string | null
  /** Show one mark and put its pill beside it. */
  readonly onReveal: (mark: AnnotationMark) => void
  /** Drop one mark. */
  readonly onRemove: (id: string) => void
  /** Clear the whole annotation. */
  readonly onClear: () => void
  /** Put the list away. */
  readonly onClose: () => void
  /** The translator seat. */
  readonly t: Translate
}

/**
 * The map of the document: every mark it holds, numbered as the document numbers it.
 *
 * A page body lists the whole file, not its own sheet, because the list is what the
 * reader checks before sending — and what is sent is the file.
 * @param props - the list's placement, marks, and what the reader can do from it.
 * @returns the list record.
 */
export function MarkList(props: MarkListProps): ReactNode {
  const { t } = props
  return (
    <div className="da-float da-float-record da-float-list" role="group" aria-label={t('marks')}
      style={recordStyle(props.at)}>
      <div className="da-float-head">
        <span className="da-card-title">
          <ListIcon />{t('marks')}
          {/* The panel already has a counter style, and a count that inherits the
              title's weight reads as part of the sentence — "标注清单 6" rather than a
              title with a count beside it. A class with no rule anywhere was the
              quietest kind of wrong: it looked deliberate in the markup. */}
          <span className="da-count">{props.marks.length}</span>
        </span>
        <button type="button" className="da-btn da-btn-quiet" disabled={props.marks.length === 0}
          onClick={() => { props.onClear() }}>{t('clear')}</button>
        <button type="button" className="da-btn da-btn-quiet"
          aria-label={t('close')} title={t('close')}
          onClick={() => { props.onClose() }}>✕</button>
      </div>
      <div className="da-marks">
        {props.marks.length === 0 ? (
          <div className="da-empty">
            <BoxIcon />
            <div className="da-empty-title">{t('noMarks')}</div>
            <div className="da-empty-hint">{t('noMarksHint')}</div>
          </div>
        ) : props.marks.map((mark, index) => (
          <div className="da-mark" key={mark.id} data-selected={mark.id === props.selectedId}
            onClick={() => { props.onReveal(mark) }}>
            {/* Two light strokes, one colour: the number and the shape are
                both facts about this mark, so they are drawn the way the mark
                itself is drawn — as a thin line in its colour, not as a slab
                of fill. The list is a list; a block of colour on every row is
                a wall of colour that competes with the figure the reader came
                here to look at. */}
            {/* The number is not a legend: the row already says which mark
                it is by being the nth row, and a differently coloured numeral
                per row turns an index into something the reader has to
                decode. It is neutral; the shape beside it keeps the mark's
                colour, which is the one thing colour is actually carrying
                here — which of the four tools drew this. */}
            <span className="da-mark-n">{index + 1}</span>
            <span className="da-mark-glyph" style={{ color: mark.color }}
              title={t('markKindLabel', { kind: t(TOOL_COPY[mark.kind]) })}>
              {ToolIcon(mark.kind)}
            </span>
            <button type="button" className="da-mark-text"
              onClick={(event) => { event.stopPropagation(); props.onReveal(mark) }}>
              <span className="da-mark-title">
                {mark.detail !== undefined && mark.detail.trim() !== '' ? mark.detail : t('emptyDetail')}
              </span>
              {anchorName(mark) === '' ? null : (
                <span className="da-mark-meta">{anchorName(mark)}</span>
              )}
            </button>
            {/* The page at the end of the row, where a list puts the number that
                is not part of the sentence. It used to share the second line
                with the anchor, which stacked two short facts into a column of
                ragged text under every row. */}
            {mark.page === undefined ? null : (
              <span className="da-mark-page">{t('markPage', { page: mark.page })}</span>
            )}
            <button type="button" className="da-mark-del" aria-label={t('delete')}
              title={t('delete')}
              onClick={(event) => { event.stopPropagation(); props.onRemove(mark.id) }}>
              <span className="da-mark-del-x" aria-hidden="true">✕</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
