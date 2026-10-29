/**
 * Line-level difference between two versions of one text document.
 *
 * The Markdown body edits a document in place in the browser and never writes
 * it, so the difference against the version the document was opened with is the
 * whole deliverable: the agent receives this text and applies it to the source.
 *
 * The algorithm is deliberately bounded. The common prefix and suffix are
 * trimmed first — which is what makes the ordinary "a few lines changed in a
 * long file" case cheap — and the remaining middle is diffed exactly over a
 * longest-common-subsequence table while that table stays under a cell budget.
 * A middle larger than the budget is reported as one replacement block and
 * flagged {@link TextDiff.coarse}: an honest coarse answer instead of an
 * unbounded computation, and the caller can still hand the full text over.
 *
 * A trailing newline is not a line: `textLines` drops exactly one, so a file
 * that ends without one does not read as a changed last line.
 * @module dsh-figmark/shared/text-diff
 */
import { baseNameOf } from './path-name'

/** How one displayed line differs from the older text. */
export type DiffLineKind = 'context' | 'add' | 'remove'

/** One line of a hunk, numbered on whichever side it exists. */
export interface DiffLine {
  /** Whether the line is unchanged, added, or removed. */
  readonly kind: DiffLineKind
  /** The line's own text, without its newline. */
  readonly text: string
  /** 1-based line number in the older text; absent on an added line. */
  readonly oldLine?: number
  /** 1-based line number in the newer text; absent on a removed line. */
  readonly newLine?: number
  /**
   * Whether this line has no terminator at the end of its text.
   *
   * Only ever set on the last line of a side that the reader has left without a
   * final newline, and only reported when the other side has one: a unified diff
   * spells that difference as a remove and an add of the same line, with the marker
   * `\ No newline at end of file` after whichever one lacks the terminator.
   */
  readonly noNewline?: boolean
}

/** One run of changed lines with the context around it. */
export interface DiffHunk {
  /**
   * First line this hunk occupies on the older side; `0` when the hunk holds no
   * older line at all (an addition before the old file's first line).
   */
  readonly oldStart: number
  /** Lines the hunk occupies on the older side. */
  readonly oldCount: number
  /** First line this hunk occupies on the newer side; `0` as above. */
  readonly newStart: number
  /** Lines the hunk occupies on the newer side. */
  readonly newCount: number
  /** The hunk's lines, in document order. */
  readonly lines: readonly DiffLine[]
}

/** One text's difference from another. */
export interface TextDiff {
  /** Changed regions with their surrounding context, in document order. */
  readonly hunks: readonly DiffHunk[]
  /** Lines the newer text added. */
  readonly added: number
  /** Lines the newer text removed. */
  readonly removed: number
  /** Whether the two texts differ at all, at any granularity. */
  readonly changed: boolean
  /** Whether the middle was too large for the exact algorithm and reads as one block. */
  readonly coarse: boolean
}

/** Inputs of {@link diffLines}. */
export interface DiffOptions {
  /** Unchanged lines kept on each side of a change; defaults to 3. */
  readonly context?: number
  /** Largest `before × after` middle the exact algorithm attempts; defaults to 1e6. */
  readonly maxCells?: number
}

/** Unchanged lines kept around each change unless a caller says otherwise. */
export const DEFAULT_CONTEXT = 3

/** Largest middle the exact algorithm attempts, in table cells. */
export const DEFAULT_MAX_CELLS = 1_000_000

/** A difference that never changes, for a body that has no edit yet. */
export const EMPTY_DIFF: TextDiff = { hunks: [], added: 0, removed: 0, changed: false, coarse: false }

/** The marker a diff puts after a line that the file does not terminate. */
const NO_NEWLINE = '\\ No newline at end of file'

/** The character a line carries in unified-diff text. */
const SIGNS: Readonly<Record<DiffLineKind, string>> = { context: ' ', add: '+', remove: '-' }

/**
 * Split text into lines, dropping exactly one trailing newline.
 *
 * A line ends at `\n` or at `\r\n`: the terminator is a property of the file that was
 * read, not part of the line's text. This matters because the two sides of a diff come
 * from different places — the baseline is what `readFile` returned, which keeps whatever
 * the file had, and the edited side is a `<textarea>`'s value, which normalises CRLF to
 * LF on the way in. Splitting on `\n` alone left the `\r` attached to every baseline
 * line, so a Windows-authored file read as "every line changed" the first time the
 * reader typed a character into it.
 * @param text - the text to split.
 * @returns its lines; empty for an empty text.
 */
export function textLines(text: string): string[] {
  if (text === '') return []
  // The terminator goes as a whole: dropping only the `\n` of a `\r\n` would leave the
  // carriage return behind as a last line's worth of text.
  const body = text.endsWith('\n') ? text.slice(0, text.endsWith('\r\n') ? -2 : -1) : text
  return body.split(/\r?\n/u)
}

/**
 * Read one line the caller has already bounded.
 *
 * Every call site walks an index the surrounding loop keeps inside the array, so
 * the access cannot miss; the cast states that invariant instead of adding a
 * fallback branch that no input can reach.
 * @param lines - the lines being walked.
 * @param index - a position the caller guarantees is in range.
 * @returns that line.
 */
function lineAt(lines: readonly string[], index: number): string {
  return lines[index] as string
}

/**
 * Read one table cell the caller has already bounded.
 *
 * The table is allocated at `(rows + 1) × (columns + 1)` and every read is one
 * step inside those bounds, so a fallback value would be a branch no input can
 * reach — the same invariant {@link lineAt} states for lines.
 * @param cells - the subsequence table.
 * @param index - a flat position the caller guarantees is in range.
 * @returns that cell.
 */
function cell(cells: Uint32Array, index: number): number {
  return cells[index] as number
}

/** One operation of an edit script. */
interface Op {
  /** What the operation does. */
  readonly kind: 'equal' | 'remove' | 'add'
  /** The line it carries. */
  readonly text: string
}

/**
 * The exact edit script for one middle block, or undefined when it is too large.
 * @param older - older lines of the middle.
 * @param newer - newer lines of the middle.
 * @param maxCells - largest table this call will build.
 * @returns the script, or undefined when the table would exceed the budget.
 */
function exactOps(older: readonly string[], newer: readonly string[], maxCells: number): Op[] | undefined {
  const rows = older.length
  const columns = newer.length
  if (rows * columns > maxCells) return undefined
  const width = columns + 1
  // lengths[i][j] = longest common subsequence of older[i..] and newer[j..],
  // filled from the bottom right so the script can be walked forwards.
  const lengths = new Uint32Array((rows + 1) * width)
  for (let i = rows - 1; i >= 0; i -= 1) {
    for (let j = columns - 1; j >= 0; j -= 1) {
      lengths[i * width + j] = lineAt(older, i) === lineAt(newer, j)
        ? cell(lengths, (i + 1) * width + (j + 1)) + 1
        : Math.max(cell(lengths, (i + 1) * width + j), cell(lengths, i * width + (j + 1)))
    }
  }
  const ops: Op[] = []
  let i = 0
  let j = 0
  while (i < rows && j < columns) {
    if (older[i] === newer[j]) {
      ops.push({ kind: 'equal', text: lineAt(older, i) })
      i += 1
      j += 1
    } else if (cell(lengths, (i + 1) * width + j) >= cell(lengths, i * width + (j + 1))) {
      ops.push({ kind: 'remove', text: lineAt(older, i) })
      i += 1
    } else {
      ops.push({ kind: 'add', text: lineAt(newer, j) })
      j += 1
    }
  }
  while (i < rows) {
    ops.push({ kind: 'remove', text: lineAt(older, i) })
    i += 1
  }
  while (j < columns) {
    ops.push({ kind: 'add', text: lineAt(newer, j) })
    j += 1
  }
  return ops
}

/** The edit script for one middle block, and whether any part of it gave up. */
interface Script {
  /** The operations, in the order they apply. */
  readonly ops: readonly Op[]
  /** Whether some part was too large and reads as one replacement block. */
  readonly coarse: boolean
}

/**
 * The edit script for one middle block, exact where the budget allows it.
 *
 * Falling back to one replacement of the whole middle is what made a two-line edit
 * to a thousand-line file cost twenty thousand bytes: with the changes near the first
 * and last line there is no common prefix or suffix to cut, so the whole document is
 * the middle, the table does not fit, and the fallback replaced all of it. One line
 * past the budget cost sixty-eight times the bytes, and the growth was linear in the
 * file after that. `fitDiff` cannot help, because one hunk is one hunk: the first is
 * always kept, `hidden` is zero, and no copy of the edited file is attached — so the
 * message said "改动 1 处" and carried the document.
 *
 * A line that appears exactly once on each side of a middle is a line that cannot be
 * part of an ambiguous match, so it is a safe place to cut: the diff of the block
 * before it, the anchor as context, then the diff of the block after. Both halves are
 * usually inside the budget even when the whole is not, and what the agent reads is
 * the two lines that actually changed plus their context.
 * @param older - older lines of the middle.
 * @param newer - newer lines of the middle.
 * @param maxCells - largest exact table the caller allows.
 * @returns the script, and whether it is coarse anywhere.
 */
function scriptFor(older: readonly string[], newer: readonly string[], maxCells: number): Script {
  const exact = exactOps(older, newer, maxCells)
  if (exact !== undefined) return { ops: exact, coarse: false }
  const anchors = anchorPairs(older, newer)
  if (anchors.length === 0) {
    // Nothing is shared that can be cut on, so there is nothing smaller to say: the
    // block is replaced whole and the caller warns that it reads as one block.
    return {
      ops: [
        ...older.map((text): Op => ({ kind: 'remove', text })),
        ...newer.map((text): Op => ({ kind: 'add', text })),
      ],
      coarse: true,
    }
  }
  const ops: Op[] = []
  let coarse = false
  let oldAt = 0
  let newAt = 0
  for (const anchor of anchors) {
    const head = scriptFor(older.slice(oldAt, anchor.old), newer.slice(newAt, anchor.new), maxCells)
    ops.push(...head.ops)
    coarse = coarse || head.coarse
    ops.push({ kind: 'equal', text: anchor.text })
    oldAt = anchor.old + 1
    newAt = anchor.new + 1
  }
  const tail = scriptFor(older.slice(oldAt), newer.slice(newAt), maxCells)
  ops.push(...tail.ops)
  return { ops, coarse: coarse || tail.coarse }
}

/** A line that appears exactly once on each side, and so can be cut on safely. */
interface Anchor {
  /** Where it sits in the older middle. */
  readonly old: number
  /** Where it sits in the newer middle. */
  readonly new: number
  /** The line's text. */
  readonly text: string
}

/**
 * The lines to cut a too-large middle on, in document order.
 *
 * Only lines that appear exactly once in each middle qualify: a line that repeats has
 * no single place it belongs, and cutting on one would attribute the change to the
 * wrong copy of it. The candidates are walked in older-side order and kept only while
 * the newer-side position also rises, which is the longest in-order run of anchors —
 * the same idea as patience diff, and enough to turn "the whole file changed" into the
 * two lines that did.
 * @param older - older lines of the middle.
 * @param newer - newer lines of the middle.
 * @returns the anchors, in document order.
 */
function anchorPairs(older: readonly string[], newer: readonly string[]): Anchor[] {
  const inOlder = new Map<string, number>()
  for (const text of older) inOlder.set(text, (inOlder.get(text) ?? 0) + 1)
  const inNewer = new Map<string, number>()
  for (const text of newer) inNewer.set(text, (inNewer.get(text) ?? 0) + 1)
  const onNewer = new Map<string, number>()
  newer.forEach((text, index) => {
    if (inNewer.get(text) === 1) onNewer.set(text, index)
  })
  const anchors: Anchor[] = []
  let lastNew = -1
  older.forEach((text, index) => {
    if (inOlder.get(text) !== 1) return
    const at = onNewer.get(text)
    if (at === undefined || at <= lastNew) return
    anchors.push({ old: index, new: at, text })
    lastNew = at
  })
  return anchors
}

/** One hunk's line range while it is still being widened. */
interface HunkRange {
  /** First line of the hunk in the full script. */
  start: number
  /** One past its last line. */
  end: number
}

/**
 * Group a full script into hunks with context, merging runs whose gap is covered.
 * @param lines - every line of the script, with its source numbers.
 * @param context - unchanged lines to keep on each side.
 * @returns the hunks, in document order.
 */
function groupHunks(lines: readonly DiffLine[], context: number): DiffHunk[] {
  const ranges: HunkRange[] = []
  lines.forEach((line, index) => {
    if (line.kind === 'context') return
    const start = Math.max(0, index - context)
    const end = Math.min(lines.length, index + 1 + context)
    const last = ranges[ranges.length - 1]
    if (last !== undefined && start <= last.end) last.end = Math.max(last.end, end)
    else ranges.push({ start, end })
  })
  return ranges.map(range => buildHunk(lines, range))
}

/**
 * Build one hunk from its line range.
 * @param lines - every line of the script.
 * @param range - the hunk's line range.
 * @returns the hunk, with the counts and start lines unified diff spells.
 */
function buildHunk(lines: readonly DiffLine[], range: HunkRange): DiffHunk {
  const slice = lines.slice(range.start, range.end)
  const older = slice.filter(line => line.oldLine !== undefined)
  const newer = slice.filter(line => line.newLine !== undefined)
  const before = lines.slice(0, range.start)
  const olderBefore = before.filter(line => line.oldLine !== undefined).length
  const newerBefore = before.filter(line => line.newLine !== undefined).length
  // A hunk that holds no line on one side is an insertion or a deletion at that
  // point: unified diff then names the line *before* it and counts zero.
  const firstOlder = older[0]
  const firstNewer = newer[0]
  return {
    oldStart: firstOlder?.oldLine ?? olderBefore,
    oldCount: older.length,
    newStart: firstNewer?.newLine ?? newerBefore,
    newCount: newer.length,
    lines: slice,
  }
}

/**
 * Diff two texts by line.
 * @param before - the older text (the version the document was opened with).
 * @param after - the newer text (what the reader has edited).
 * @param options - context width and exact-algorithm budget.
 * @returns the difference, with hunks only when some line is not shared.
 */
export function diffLines(before: string, after: string, options: DiffOptions = {}): TextDiff {
  const context = options.context ?? DEFAULT_CONTEXT
  const maxCells = options.maxCells ?? DEFAULT_MAX_CELLS
  const older = textLines(before)
  const newer = textLines(after)
  if (before === after) return EMPTY_DIFF
  const shared = Math.min(older.length, newer.length)
  let prefix = 0
  while (prefix < shared && older[prefix] === newer[prefix]) prefix += 1
  let suffix = 0
  while (suffix < shared - prefix && older[older.length - 1 - suffix] === newer[newer.length - 1 - suffix]) suffix += 1
  const olderMiddle = older.slice(prefix, older.length - suffix)
  const newerMiddle = newer.slice(prefix, newer.length - suffix)
  const script = scriptFor(olderMiddle, newerMiddle, maxCells)
  const ops = script.ops
  const lines: DiffLine[] = []
  let oldLine = 1
  let newLine = 1
  const equal = (text: string): void => {
    lines.push({ kind: 'context', text, oldLine, newLine })
    oldLine += 1
    newLine += 1
  }
  for (let index = 0; index < prefix; index += 1) equal(lineAt(older, index))
  for (const op of ops) {
    if (op.kind === 'equal') equal(op.text)
    else if (op.kind === 'remove') {
      lines.push({ kind: 'remove', text: op.text, oldLine })
      oldLine += 1
    } else {
      lines.push({ kind: 'add', text: op.text, newLine })
      newLine += 1
    }
  }
  for (let index = older.length - suffix; index < older.length; index += 1) equal(lineAt(older, index))
  const hunks = groupHunks(lines, context)
  // A file whose only difference is its final newline has the same lines on both
  // sides, so the grouping above finds no change to report — and a difference object
  // that says `changed` with no hunks is one every consumer downstream has to defend
  // against separately: the header read "改动 0 处 · +0 −0 行", the diff view showed
  // nothing, and send and copy both returned in silence. It is a real difference and
  // unified diff has a way to spell it, so it gets a hunk of its own.
  const terminator = hunks.length === 0 ? endedWithoutNewline(before, after, older, newer, context) : null
  return {
    hunks: terminator === null ? hunks : [terminator],
    added: terminator === null ? lines.filter(line => line.kind === 'add').length : 1,
    removed: terminator === null ? lines.filter(line => line.kind === 'remove').length : 1,
    changed: true,
    coarse: script.coarse,
  }
}

/**
 * The hunk for a file that differs only in its final newline, or null when the two
 * sides differ in something the line lists would have shown.
 *
 * Reached only when the line lists are equal and the texts are not, which is exactly
 * the final-newline case. The last line is removed and added again — the same text on
 * both sides — because that is how unified diff carries a terminator: the marker after
 * the line that lacks it says which side is missing it.
 * @param before - the older text, as the reader had it.
 * @param after - the newer text.
 * @param older - the older side's lines.
 * @param newer - the newer side's lines.
 * @param context - unchanged lines to keep above the change.
 * @returns the one hunk, or null when there is no last line to speak of.
 */
function endedWithoutNewline(
  before: string,
  after: string,
  older: readonly string[],
  newer: readonly string[],
  context: number,
): DiffHunk | null {
  const count = older.length
  // An empty older side cannot reach here: with no lines on that side, every line the
  // newer one has is a difference the line diff already found, so the hunk list would
  // not have been empty.
  /* v8 ignore next -- unreachable: see above. */
  if (count === 0) return null
  const last = count - 1
  const first = Math.max(0, last - context)
  const lines: DiffLine[] = []
  for (let index = first; index < last; index += 1) {
    lines.push({ kind: 'context', text: lineAt(older, index), oldLine: index + 1, newLine: index + 1 })
  }
  const olderKept = endsWithNewline(before)
  const newerKept = endsWithNewline(after)
  lines.push({ kind: 'remove', text: lineAt(older, last), oldLine: count, ...(olderKept ? {} : { noNewline: true }) })
  lines.push({ kind: 'add', text: lineAt(newer, last), newLine: count, ...(newerKept ? {} : { noNewline: true }) })
  const kept = last - first
  return {
    oldStart: first + 1,
    oldCount: kept + 1,
    newStart: first + 1,
    newCount: kept + 1,
    lines,
  }
}

/**
 * Whether a text ends with a line terminator.
 *
 * The one thing {@link textLines} throws away, and the only difference two texts can
 * have while producing the same lines.
 * @param text - the text to look at.
 * @returns whether its last line is terminated.
 */
function endsWithNewline(text: string): boolean {
  return text.endsWith('\n')
}

/**
 * One hunk's identity, as a value that changes when the hunk does.
 *
 * Notes are filed against a hunk, and the hunk's first context line is not its
 * identity: five different single-hunk changes to the same neighbourhood all report
 * the same `oldStart`, so one note was reproduced beside each of them — and a note
 * written about a change that then moved stayed keyed to a hunk that no longer
 * existed, so it was sent anchored to a line nobody had touched. Both counts and both
 * starts together do change when the hunk changes.
 * @param hunk - the hunk to name.
 * @returns the key a note is filed under.
 */
export function hunkKey(hunk: DiffHunk): string {
  return `${hunk.oldStart},${hunk.oldCount},${hunk.newStart},${hunk.newCount}`
}

/** What one hunk does to the older text, in a form a sentence can be built from. */
export interface HunkChange {
  /** Whether the hunk replaces older lines or inserts between them. */
  readonly kind: 'replace' | 'insert'
  /**
   * 1-based older line the change begins at, or the line an insertion follows —
   * `0` when an insertion is before the older file's first line.
   */
  readonly at: number
  /** How many older lines the change replaces, or 0 for an insertion. */
  readonly count: number
}

/**
 * Locate the change inside one hunk.
 *
 * `oldStart` is the hunk's first line *including context*, which with three lines of
 * context is up to three lines before the edit — so a note on a change at line 9 was
 * labelled "第 6 行". This walks to the first line that actually differs and reports
 * that, and for a pure insertion it reports the line the new text follows, because a
 * line that does not exist in the older file has no number there.
 * @param hunk - the hunk to read.
 * @returns where the change is.
 */
export function hunkChange(hunk: DiffHunk): HunkChange {
  let lastOld = 0
  for (const line of hunk.lines) {
    if (line.kind === 'context') {
      if (line.oldLine !== undefined) lastOld = line.oldLine
      continue
    }
    if (line.kind === 'remove') return { kind: 'replace', at: line.oldLine ?? lastOld + 1, count: countRemoved(hunk) }
    // An insertion with nothing behind it lands before the older file's first line;
    // `lastOld` is 0 there because no context line has been walked past yet. Reporting
    // "after line 0" would name a line that does not exist in a one-based file.
    return { kind: 'insert', at: Math.max(lastOld, 1), count: 0 }
  }
  // A hunk with no change in it does not come out of `diffLines`, but this function
  // is exported and a caller can hand it one. It then reports an insertion at the
  // last line it saw, which is the only place left to name.
  return { kind: 'insert', at: Math.max(lastOld, 1), count: 0 }
}

/** How many older lines one hunk takes away. */
function countRemoved(hunk: DiffHunk): number {
  return hunk.lines.filter(line => line.kind === 'remove').length
}

/**
 * Spell one hunk's `@@` header.
 * @param hunk - the hunk to name.
 * @returns the header line, without its newline.
 */
export function formatHunkHeader(hunk: DiffHunk): string {
  return `@@ -${hunk.oldStart},${hunk.oldCount} +${hunk.newStart},${hunk.newCount} @@`
}

/**
 * Spell a difference as unified-diff text.
 * @param displayPath - the path the message names; only its last segment is used.
 * @param diff - the difference to spell.
 * @returns the unified diff, without a trailing newline.
 */
export function formatUnifiedDiff(displayPath: string, diff: TextDiff): string {
  const name = baseNameOf(displayPath)
  const lines = [`--- a/${name}`, `+++ b/${name}`]
  for (const hunk of diff.hunks) {
    lines.push(formatHunkHeader(hunk))
    for (const line of hunk.lines) {
      lines.push(`${SIGNS[line.kind]}${line.text}`)
      // Unified diff says which side is missing the terminator by marking the line
      // itself; without it the diff reads as a removal and an addition of one and the
      // same line, which is a change with no explanation.
      if (line.noNewline === true) lines.push(NO_NEWLINE)
    }
  }
  return lines.join('\n')
}
