/** The line differ: exact hunks, the context around them, and the coarse budget. */
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CONTEXT,
  DEFAULT_MAX_CELLS,
  EMPTY_DIFF,
  diffLines,
  formatHunkHeader,
  formatUnifiedDiff,
  hunkChange,
  textLines,
} from '../src/shared/text-diff'
import { baseNameOf } from '../src/shared/path-name'
import { defined } from './dom'

describe('splitting text into lines', () => {
  it('reads no line out of an empty text', () => {
    expect(textLines('')).toEqual([])
  })

  it('drops one trailing newline, so a final newline is not a line of its own', () => {
    expect(textLines('a\n')).toEqual(['a'])
    expect(textLines('a')).toEqual(['a'])
    expect(textLines('a\nb\n')).toEqual(['a', 'b'])
    expect(textLines('a\nb')).toEqual(['a', 'b'])
  })

  it('ends a line at a Windows terminator too, without carrying the carriage return', () => {
    // The two sides of a diff come from different readers: the baseline is what
    // `readFile` returned, which keeps `\r\n` in a Windows-authored file, and the
    // edited side is a textarea's value, which normalises to `\n`. Reading the
    // carriage return as part of the line made every line differ before the reader
    // had typed anything, so one keystroke was reported as a rewrite of the file.
    expect(textLines('a\r\nb\r\n')).toEqual(['a', 'b'])
    expect(textLines('a\r\nb')).toEqual(['a', 'b'])
    expect(textLines('a\r\n')).toEqual(['a'])
  })

  it('reads one keystroke in a Windows file as one changed line, not a rewrite', () => {
    // The reader's one real edit used to arrive as "改动 1 处 · +5 −5 行" on a five-line
    // file: the baseline carried `\r\n` and the textarea's value did not, so every line
    // differed. With the terminator read as a terminator, the same keystroke is the one
    // line it is.
    const diff = diffLines('title\r\n\r\nbody\r\nlast\r\n', 'title\r\n\r\nbody\r\nlast!\r\n')
    expect(diff.hunks).toHaveLength(1)
    expect(diff.added).toBe(1)
    expect(diff.removed).toBe(1)
  })

  it('keeps the empty lines inside the text', () => {
    expect(textLines('\n')).toEqual([''])
    expect(textLines('a\n\nb')).toEqual(['a', '', 'b'])
  })
})

describe('an unchanged text', () => {
  it('has no hunk and no counts', () => {
    expect(diffLines('a\nb\n', 'a\nb\n')).toEqual(EMPTY_DIFF)
  })

  it('spells a difference in the final newline as the change it is', () => {
    // The line lists are identical but the texts are not, so the difference is the
    // terminator. Reporting `changed: true` with no hunk left every consumer to defend
    // against it separately — the header said "改动 0 处 · +0 −0 行", the diff view
    // showed nothing, and send and copy both returned in silence. Unified diff has a
    // way to spell this: the last line again, marked on the side that lacks it.
    const diff = diffLines('a\nb\n', 'a\nb')
    expect(diff.changed).toBe(true)
    expect(diff.added).toBe(1)
    expect(diff.removed).toBe(1)
    expect(diff.hunks).toHaveLength(1)
    const lines = defined(diff.hunks[0]).lines
    expect(lines.map(line => line.kind)).toEqual(['context', 'remove', 'add'])
    expect(lines[1]).toMatchObject({ kind: 'remove', text: 'b' })
    expect(lines[1]?.noNewline).toBeUndefined()
    expect(lines[2]).toMatchObject({ kind: 'add', text: 'b', noNewline: true })
  })

  it('keeps context above the final newline when the file is longer', () => {
    // The hunk is the last line, with as much of the file above it as the context
    // window allows — the same shape a one-line change in the middle gets.
    const before = ['1', '2', '3', '4', '5'].join('\n') + '\n'
    const after = ['1', '2', '3', '4', '5'].join('\n')
    const diff = diffLines(before, after)
    const hunk = defined(diff.hunks[0])
    expect(hunk.lines.map(line => line.kind)).toEqual([
      'context', 'context', 'context', 'remove', 'add',
    ])
    expect(hunk.oldStart).toBe(2)
    expect(hunk.oldCount).toBe(4)
  })

  it('spells the marker in the unified diff, on the side that lacks the terminator', () => {
    // Without the marker the diff is a removal and an addition of one and the same
    // line, which is a change with no explanation of what the change was.
    const text = formatUnifiedDiff('/w/notes.md', diffLines('a\nb\n', 'a\nb'))
    // The line that lost its terminator is the newer one, so the marker follows the
    // added line; the removed line is the one that had it.
    expect(text).toContain('-b\n+b\n\\ No newline at end of file')
  })

  it('marks the other side when the newline was added rather than removed', () => {
    const diff = diffLines('a\nb', 'a\nb\n')
    const lines = defined(diff.hunks[0]).lines
    expect(lines[1]).toMatchObject({ kind: 'remove', noNewline: true })
    expect(lines[2]?.noNewline).toBeUndefined()
  })
})

describe('an exact difference', () => {
  it('carries the changed line with three lines of context on each side', () => {
    const before = ['1', '2', '3', '4', '5', '6', '7', '8', '9'].join('\n')
    const after = ['1', '2', '3', '4', 'changed', '6', '7', '8', '9'].join('\n')
    const diff = diffLines(before, after)
    expect(diff.changed).toBe(true)
    expect(diff.coarse).toBe(false)
    expect(diff.added).toBe(1)
    expect(diff.removed).toBe(1)
    expect(diff.hunks).toHaveLength(1)
    const hunk = defined(diff.hunks[0])
    expect(formatHunkHeader(defined(hunk))).toBe('@@ -2,7 +2,7 @@')
    expect(hunk?.lines.map(line => line.kind)).toEqual([
      'context', 'context', 'context', 'remove', 'add', 'context', 'context', 'context',
    ])
    // Numbers are real line numbers on whichever side a line exists.
    expect(hunk?.lines[3]).toEqual({ kind: 'remove', text: '5', oldLine: 5 })
    expect(hunk?.lines[4]).toEqual({ kind: 'add', text: 'changed', newLine: 5 })
    expect(hunk?.lines[5]).toEqual({ kind: 'context', text: '6', oldLine: 6, newLine: 6 })
  })

  it('merges two changes whose context overlaps into one hunk', () => {
    const before = ['a', 'b', 'c', 'd', 'e'].join('\n')
    const after = ['a', 'B', 'c', 'D', 'e'].join('\n')
    const diff = diffLines(before, after)
    expect(diff.hunks).toHaveLength(1)
    expect(diff.added).toBe(2)
    expect(diff.removed).toBe(2)
    // Two replacements, each carrying its removal: a, -b, +B, c, -d, +D, e.
    expect(diff.hunks[0]?.lines).toHaveLength(7)
  })

  it('keeps two distant changes apart', () => {
    const lines = Array.from({ length: 20 }, (_, index) => `line ${index + 1}`)
    const after = [...lines]
    after[0] = 'first'
    after[19] = 'last'
    const diff = diffLines(lines.join('\n'), after.join('\n'))
    expect(diff.hunks).toHaveLength(2)
    expect(formatHunkHeader(defined(diff.hunks[0]))).toBe('@@ -1,4 +1,4 @@')
    expect(formatHunkHeader(defined(diff.hunks[1]))).toBe('@@ -17,4 +17,4 @@')
  })

  it('trims a long shared prefix and suffix instead of diffing them', () => {
    const shared = Array.from({ length: 3000 }, (_, index) => `line ${index + 1}`)
    const before = [...shared, 'old', ...shared].join('\n')
    const after = [...shared, 'new', ...shared].join('\n')
    const diff = diffLines(before, after)
    expect(diff.coarse).toBe(false)
    expect(diff.hunks).toHaveLength(1)
    expect(diff.removed).toBe(1)
    expect(diff.added).toBe(1)
    expect(DEFAULT_MAX_CELLS).toBe(1_000_000)
    expect(DEFAULT_CONTEXT).toBe(3)
  })
})

describe('changes at a text’s edge', () => {
  it('numbers an insertion at the top of an empty text as an addition before line 1', () => {
    const diff = diffLines('', 'a\nb')
    expect(diff.added).toBe(2)
    expect(diff.removed).toBe(0)
    expect(formatHunkHeader(defined(diff.hunks[0]))).toBe('@@ -0,0 +1,2 @@')
    expect(diff.hunks[0]?.lines).toEqual([
      { kind: 'add', text: 'a', newLine: 1 },
      { kind: 'add', text: 'b', newLine: 2 },
    ])
  })

  it('numbers a removal of every line as a deletion of the whole text', () => {
    const diff = diffLines('a\nb', '')
    expect(diff.added).toBe(0)
    expect(diff.removed).toBe(2)
    expect(formatHunkHeader(defined(diff.hunks[0]))).toBe('@@ -1,2 +0,0 @@')
  })

  it('numbers a hunk that starts on an added line without context', () => {
    const diff = diffLines('a\nb', 'new\na\nb', { context: 0 })
    expect(diff.hunks).toHaveLength(1)
    expect(formatHunkHeader(defined(diff.hunks[0]))).toBe('@@ -0,0 +1,1 @@')
  })

  it('numbers a hunk that starts on a removed line without context', () => {
    const diff = diffLines('gone\na\nb', 'a\nb', { context: 0 })
    expect(formatHunkHeader(defined(diff.hunks[0]))).toBe('@@ -1,1 +0,0 @@')
  })

  it('numbers a hunk that starts on a kept line without context', () => {
    const diff = diffLines('a\nb\nc', 'a\nchanged\nc', { context: 0 })
    expect(formatHunkHeader(defined(diff.hunks[0]))).toBe('@@ -2,1 +2,1 @@')
  })
})

describe('a middle too large for the exact algorithm', () => {
  it('reads as one replacement block and says so', () => {
    const before = ['x', 'y', 'z'].join('\n')
    const after = ['1', '2', '3'].join('\n')
    const diff = diffLines(before, after, { maxCells: 0 })
    expect(diff.coarse).toBe(true)
    expect(diff.hunks).toHaveLength(1)
    expect(diff.removed).toBe(3)
    expect(diff.added).toBe(3)
    const kinds = diff.hunks[0]?.lines.map(line => line.kind) ?? []
    expect(kinds.slice(0, 3)).toEqual(['remove', 'remove', 'remove'])
    expect(kinds.slice(3)).toEqual(['add', 'add', 'add'])
  })

  it('cuts a too-large middle on the lines both sides share once', () => {
    // Falling back to one replacement of the whole middle is what made a two-line edit
    // to a thousand-line file cost twenty thousand bytes: with the changes near the
    // first and last line there is no common prefix or suffix to cut, so the middle is
    // the whole document, the table does not fit, and the fallback replaced all of it.
    // One line past the budget cost sixty-eight times the bytes.
    const lines = 1500
    const base = Array.from({ length: lines }, (_value, n) => `line ${n + 1} of the document`)
    const edited = [...base]
    edited[0] = 'first line changed'
    edited[lines - 1] = 'last line changed'
    const diff = diffLines(base.join('\n') + '\n', edited.join('\n') + '\n')
    expect(diff.coarse).toBe(false)
    expect(diff.hunks).toHaveLength(2)
    expect(diff.added).toBe(2)
    expect(diff.removed).toBe(2)
    // What the agent reads is the two lines that changed, not the document.
    expect(formatUnifiedDiff('/w/notes.md', diff).length).toBeLessThan(600)
  })

  it('still says it is coarse when the two sides share nothing to cut on', () => {
    // Every line differs and none appears once on both sides, so there is no safe
    // anchor: the block is replaced whole and the caller warns about it.
    const before = ['x', 'y', 'z'].join('\n')
    const after = ['1', '2', '3'].join('\n')
    const diff = diffLines(before, after, { maxCells: 0 })
    expect(diff.coarse).toBe(true)
    expect(diff.hunks).toHaveLength(1)
  })

  it('cuts only on lines that appear once on each side', () => {
    // A line that repeats has no single place it belongs, so cutting on one would
    // attribute the change to the wrong copy of it. `dup` appears twice on both sides
    // and must not become an anchor; the unique lines on either side may.
    const before = ['dup', 'a', 'dup', 'unique', 'dup', 'b', 'dup'].join('\n')
    const after = ['dup', 'A', 'dup', 'unique', 'dup', 'B', 'dup'].join('\n')
    const diff = diffLines(before, after, { maxCells: 0 })
    expect(diff.added).toBe(2)
    expect(diff.removed).toBe(2)
    // `unique` survives as context rather than being replaced as part of the block.
    const context = diff.hunks.flatMap(hunk => hunk.lines).filter(line => line.kind === 'context')
    expect(context.map(line => line.text)).toContain('unique')
  })

  it('still takes the exact path when trimming leaves nothing to compare', () => {
    const diff = diffLines('a\nb\nc', 'a\nb\nc', { maxCells: 0 })
    expect(diff).toEqual(EMPTY_DIFF)
  })
})

describe('writing a difference out', () => {
  it('spells a unified diff named after the document', () => {
    const diff = diffLines('a\nb', 'a\nB')
    expect(formatUnifiedDiff('/w/docs/report.md', diff)).toBe([
      '--- a/report.md',
      '+++ b/report.md',
      '@@ -1,2 +1,2 @@',
      ' a',
      '-b',
      '+B',
    ].join('\n'))
  })

  it('takes the file name out of a Windows path too, and out of a bare name', () => {
    expect(baseNameOf('C:\\w\\report.md')).toBe('report.md')
    expect(baseNameOf('report.md')).toBe('report.md')
  })
})

describe('a hunk that carries no change', () => {
  it('names an insertion rather than throwing, for a caller that hands one over', () => {
    // `diffLines` never produces such a hunk, but `hunkChange` is exported and a
    // caller can. Reporting the insertion at the last line it saw is the only place
    // left to name; the point of the test is that no path through it is unreachable.
    expect(hunkChange({ oldStart: 1, oldCount: 3, newStart: 1, newCount: 4, lines: [] }))
      .toEqual({ kind: 'insert', at: 1, count: 0 })
  })

  it('keeps the last line it did see when a context line came without one', () => {
    // Same reason as above: the count of the older side is what the walk reports
    // from, and a context line that says nothing about its number must not reset it
    // to zero — that would name the first line for an edit far down the file.
    const hunk = {
      oldStart: 9, oldCount: 2, newStart: 9, newCount: 3,
      lines: [
        { kind: 'context' as const, text: 'before', newLine: 9 },
        { kind: 'add' as const, text: 'new', newLine: 10 },
      ],
    }
    expect(hunkChange(hunk)).toEqual({ kind: 'insert', at: 1, count: 0 })
  })

  it('falls back to the line after the last one it saw when a removal names none', () => {
    // The same guard on the removal side: a removal that does not say which line it
    // takes away is placed just past the last context line, not at line zero.
    const hunk = {
      oldStart: 7, oldCount: 2, newStart: 7, newCount: 1,
      lines: [
        { kind: 'context' as const, text: 'before', oldLine: 7, newLine: 7 },
        { kind: 'remove' as const, text: 'gone' },
      ],
    }
    expect(hunkChange(hunk)).toEqual({ kind: 'replace', at: 8, count: 1 })
  })
})
