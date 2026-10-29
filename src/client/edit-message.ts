/**
 * The user message that carries one Markdown edit proposal.
 *
 * The Markdown body edits a document in place and never writes it, so the
 * difference against the version the reader opened is the whole deliverable: the
 * agent receives this text and applies it to the source. The message carries the
 * diff whole hunks at a time, the reader's notes keyed by the baseline line they
 * were written on, and whatever kept the message from being complete.
 *
 * Only the wording lives here. Fitting the diff into a budget and handing the
 * message to a session are separate jobs in `./session`.
 * @module dsh-figmark/client/edit-message
 */
import type { SummaryLocale } from '../shared/annotation'
import { baseNameOf } from '../shared/path-name'
import { formatHunkHeader, formatUnifiedDiff, hunkChange, hunkKey, type DiffHunk, type TextDiff } from '../shared/text-diff'

/** Most diff lines one edit message carries before it defers to an attachment. */
export const MAX_DIFF_LINES = 400

/** One diff fitted into a message. */
export interface FittedDiff {
  /** The unified diff the message carries. */
  readonly text: string
  /** Hunks the message left out because they did not fit. */
  readonly hidden: number
}

/**
 * Fit a difference into the message's line budget, whole hunks at a time.
 *
 * A hunk is never cut in half — a half hunk is not a diff anyone can apply — so
 * the budget drops trailing hunks and reports how many went with the attachment
 * instead. The first hunk always travels, however large it is: a message that
 * carries nothing but "see the attachment" would be worse than a long one.
 *
 * @param displayPath - the path the diff header names.
 * @param diff - the difference to fit.
 * @param maxLines - the message's diff budget, header lines included.
 * @returns the diff text and the number of hunks left out.
 */
export function fitDiff(displayPath: string, diff: TextDiff, maxLines: number = MAX_DIFF_LINES): FittedDiff {
  const kept: DiffHunk[] = []
  let used = 0
  for (const hunk of diff.hunks) {
    const size = hunk.lines.length + 1
    if (kept.length > 0 && used + size > maxLines) break
    kept.push(hunk)
    used += size
  }
  return {
    text: formatUnifiedDiff(displayPath, { ...diff, hunks: kept }),
    hidden: diff.hunks.length - kept.length,
  }
}

/** What one edit message is composed from. */
export interface EditMessageInput {
  /** Path the message names: the document's own, or its address when unparsed. */
  readonly documentPath: string
  /** The whole difference. */
  readonly diff: TextDiff
  /** The part of it the message carries. */
  readonly fitted: FittedDiff
  /** The reader's notes, keyed by the baseline line the change starts at. */
  readonly notes: Readonly<Record<number, string>>
  /** Whether the loaded baseline moved while the reader was editing. */
  readonly stale: boolean
  /** Message language. */
  readonly locale: SummaryLocale
}

/**
 * Spell the reader's notes as the numbered list the message carries.
 *
 * A note is keyed by the baseline line its change starts at, so it stays put
 * while the reader keeps editing; the hunk that starts there is named when one
 * still does. A note whose change the reader has since removed is still sent —
 * the line number is the reader's own reference and they wrote it on purpose —
 * it just travels without a hunk header.
 *
 * @param diff - the whole difference, for pairing notes with their hunk.
 * @param notes - the reader's notes.
 * @param locale - message language.
 * @returns one line per note, in line order; empty when there are none.
 */
export function describeNotes(
  diff: TextDiff,
  notes: Readonly<Record<string, string>>,
  locale: SummaryLocale,
): string[] {
  const zh = locale === 'zh'
  const lines: string[] = []
  // Only notes whose hunk is in *this* difference travel. A note whose change has
  // moved or gone away has nothing left to be about, and sending it would tell the
  // agent to look at a line nobody touched — with no `@@` header to disambiguate it,
  // because that is only added when a hunk matches.
  for (const hunk of diff.hunks) {
    const text = notes[hunkKey(hunk)]
    if (text === undefined || text.trim() === '') continue
    const at = locate(zh, hunk)
    lines.push(zh
      ? `${lines.length + 1}. ${at}：${text.trim()}`
      : `${lines.length + 1}. ${at}: ${text.trim()}`)
  }
  return lines
}

/**
 * Say where one hunk's change is, in the reader's language.
 *
 * The number names the line the change happens on, not the hunk's first context line:
 * a note on a change at line 9 used to read "第 6 行", because three lines of context
 * put the hunk's start three lines early. An insertion names the line it follows,
 * because a line that does not exist in the older file has no number there.
 * @param zh - whether to write Chinese.
 * @param hunk - the hunk being described.
 * @param header - the hunk's `@@` header, in parentheses.
 * @returns the clause naming the change.
 */
function locate(zh: boolean, hunk: DiffHunk): string {
  const change = hunkChange(hunk)
  if (zh) {
    const header = `（${formatHunkHeader(hunk)}）`
    return change.kind === 'insert' ? `第 ${change.at} 行之后${header}` : `第 ${change.at} 行${header}`
  }
  const header = ` (${formatHunkHeader(hunk)})`
  return change.kind === 'insert' ? `after line ${change.at}${header}` : `line ${change.at}${header}`
}

/**
 * Compose the user message that carries one edit proposal.
 * @param input - the document, its difference, and what the message could not carry.
 * @returns the message text.
 */
export function buildEditMessage(input: EditMessageInput): string {
  const zh = input.locale === 'zh'
  const { diff, fitted } = input
  const readerNotes = describeNotes(diff, input.notes, input.locale)
  const counted = readerNotes.length === 0 ? '' : (zh ? `，说明 ${readerNotes.length} 条` : `, ${readerNotes.length} notes`)
  const header = zh
    ? `【文档修改建议】${input.documentPath}（Markdown，改动 ${diff.hunks.length} 处，+${diff.added} −${diff.removed} 行${counted}）`
    : `[document edits] ${input.documentPath} (Markdown, ${diff.hunks.length} hunks, +${diff.added} -${diff.removed} lines${counted})`
  const warnings: string[] = []
  if (input.stale) {
    warnings.push(zh
      ? '注意：文件在编辑期间被改动过，这份 diff 基于较早的版本，可能无法直接应用。'
      : 'Note: the file changed while it was being edited, so this diff is against an earlier version and may not apply cleanly.')
  }
  if (diff.coarse) {
    warnings.push(zh ? '改动较大，diff 以整块替换呈现。' : 'The change is large, so the diff reads as one replacement block.')
  }
  if (fitted.hidden > 0) {
    const name = `${baseNameOf(input.documentPath)}.edited.md`
    warnings.push(zh
      ? `另有 ${fitted.hidden} 处改动未在本消息里展开，完整结果见随本消息发送的 ${name}。`
      : `${fitted.hidden} more hunks are not expanded here; the complete result is attached as ${name}.`)
  }
  const closing = zh
    ? '我已在文档预览里改好，但**没有落盘**：请把这段 diff 应用到源文件，或据此复核我的改动；diff 之外的部分不要动，改完逐处回应。'
    : 'I made these edits in the document preview and did **not** write them to disk: apply this diff to the source, or review my change against it; leave everything outside the diff untouched and answer hunk by hunk.'
  return [
    header,
    '',
    '```diff',
    fitted.text,
    '```',
    ...(readerNotes.length === 0 ? [] : ['', zh ? '我的说明：' : 'My notes:', ...readerNotes]),
    ...(warnings.length === 0 ? [] : ['', ...warnings]),
    '',
    closing,
  ].join('\n')
}