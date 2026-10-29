/**
 * The difference between the version a document was opened with and the reader's
 * edits, drawn as a unified diff with one note field per hunk.
 *
 * A note belongs to the hunk whose baseline line it was written on, so the
 * reader's explanation stays attached to the same change while they keep
 * editing around it.
 * @module dsh-figmark/client/markdown/DiffView
 */
import type { ReactNode } from 'react'
import { formatHunkHeader, hunkChange, hunkKey, type DiffHunk, type TextDiff } from '../../shared/text-diff'
import type { Translate } from '../AnnotatorBody'

/** The character a line carries in the margin. */
const SIGNS = { context: ' ', add: '+', remove: '-' } as const

/** What the difference view renders. */
export interface DiffViewProps {
  /** The difference to draw. */
  readonly diff: TextDiff
  /** The reader's notes, keyed by the hunk each was written about. */
  readonly notes: Readonly<Record<string, string>>
  /**
   * Records one note.
   * @param key - the hunk the note is filed under.
   * @param text - what the reader wrote.
   */
  readonly onNote: (key: string, text: string) => void
  /** Product copy seat. */
  readonly t: Translate
}

/**
 * Draw one difference: every hunk with its header, its lines, and its note field.
 * @param props - the difference, the notes, and the copy seat.
 * @returns the difference view.
 */
/**
 * The line a note on this hunk is really about.
 *
 * The hunk's `oldStart` includes up to three lines of leading context, so it is up to
 * three lines short of the edit. A pure insertion has no line of its own in the older
 * file, so it names the line the new text follows.
 * @param hunk - the hunk being annotated.
 * @returns the 1-based older line the change is at.
 */
function changeAt(hunk: DiffHunk): number {
  return hunkChange(hunk).at
}

export function DiffView({ diff, notes, onNote, t }: DiffViewProps): ReactNode {
  if (diff.hunks.length === 0) return <p className="da-hint">{t('diffEmpty')}</p>
  return (
    <div className="da-diff">
      {diff.hunks.map((hunk, index) => (
        <div className="da-diff-hunk" key={`${hunk.oldStart}-${hunk.newStart}-${index}`}>
          <div className="da-diff-head">{formatHunkHeader(hunk)}</div>
          {hunk.lines.map((line, offset) => (
            <div className="da-diff-line" data-kind={line.kind} key={`${index}-${offset}`}>
              <span className="da-diff-no">{line.oldLine ?? ''}</span>
              <span className="da-diff-no">{line.newLine ?? ''}</span>
              <span className="da-diff-sign">{SIGNS[line.kind]}</span>
              <span className="da-diff-text">{line.text}</span>
            </div>
          ))}
          <label className="da-diff-note">
            {/* The label names the change, not the hunk's first context line: with
                three lines of context the hunk starts up to three lines early, so a
                note on line 9 was offered as "第 6 行". */}
            <span className="da-diff-note-label">{t('hunkNote', { line: changeAt(hunk) })}</span>
            <input
              type="text"
              value={notes[hunkKey(hunk)] ?? ''}
              placeholder={t('hunkNotePlaceholder')}
              onChange={(event) => { onNote(hunkKey(hunk), event.target.value) }}
            />
          </label>
        </div>
      ))}
    </div>
  )
}
