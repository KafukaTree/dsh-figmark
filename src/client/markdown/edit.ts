/**
 * The reader's edit, and what it is a difference against.
 *
 * An edit is the pair — the text editing began from, and its current value — or there
 * is no edit. Holding it as one value is what makes "a draft without its baseline"
 * unrepresentable: the difference is only ever computed between two texts that both
 * exist, so the diff view cannot be asked to describe a change it has no original for.
 *
 * The types and the two derived queries live here rather than in the body because the
 * body is markup and wiring; this is the part that has a rule in it.
 * @module dsh-figmark/client/markdown/edit
 */
import { EMPTY_DIFF, diffLines, textLines, type TextDiff } from '../../shared/text-diff'

/** The reader's edit: the text editing began from, and its current value. */
export interface Edit {
  /** The loaded text as it was when the first keystroke arrived. */
  readonly baseline: string
  /** The text as it stands now. */
  readonly text: string
}

/** Where the caret sits, in the units the reader counts in. */
export interface Caret {
  /** 1-based line the caret is on. */
  readonly line: number
  /** 1-based column the caret is at. */
  readonly column: number
}

/** The caret at the very start of a document. */
export const START_CARET: Caret = { line: 1, column: 1 }

/** No notes, as the one value the reader's empty state reuses. */
export const NO_NOTES: Readonly<Record<string, string>> = {}

/**
 * The difference one edit stands for.
 * @param edit - the reader's edit, or null when they have not changed anything.
 * @returns the difference; the empty one when there is no edit.
 */
export function diffOf(edit: Edit | null): TextDiff {
  return edit === null ? EMPTY_DIFF : diffLines(edit.baseline, edit.text)
}

/**
 * The text the editor shows.
 * @param edit - the reader's edit, or null when they have not changed anything.
 * @param loaded - the text the owner delivered, when it has.
 * @returns the edit's text, else the loaded text, else nothing.
 */
export function editedText(edit: Edit | null, loaded: string | undefined): string {
  return edit?.text ?? loaded ?? ''
}

/**
 * How many lines a text has.
 * @param text - the text to count.
 * @returns its line count.
 */
export function lineCount(text: string): number {
  return textLines(text).length
}

/**
 * The caret a text field just reported, in lines and columns.
 * @param element - the textarea whose selection moved.
 * @returns the caret, 1-based on both axes.
 */
export function caretIn(element: HTMLTextAreaElement): Caret {
  const head = element.value.slice(0, element.selectionStart)
  return {
    line: head.split('\n').length,
    // Counted in code points, not in UTF-16 code units: an emoji is one thing on
    // screen and two code units here, so a caret after `a😀b` reported column 5 for a
    // line that has three characters in it. A column is a thing the reader can put a
    // caret between, and there are three of those positions after three characters.
    // `Array.from` is the code-point count wanted here, not a convenient iteration:
    // splitting an emoji into its two halves is the bug this line exists to avoid.
    column: Array.from(head.slice(head.lastIndexOf('\n') + 1)).length + 1,
  }
}

/**
 * One keystroke's worth of edit.
 *
 * The first change is the one that remembers the baseline: from then on the value
 * follows the field, and the text it started from stays where it was.
 *
 * @param previous - the edit as it stood, or null for the first change.
 * @param loaded - the text the owner delivered, which the first change starts from.
 * @param value - what the field now holds.
 * @returns the edit.
 */
export function editFrom(previous: Edit | null, loaded: string, value: string): Edit {
  return previous === null
    ? { baseline: loaded, text: value }
    : { baseline: previous.baseline, text: value }
}
