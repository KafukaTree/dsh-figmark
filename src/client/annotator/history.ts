/**
 * The marks, and the two stacks that let the reader walk them back and forth.
 *
 * They are one state machine rather than three `useState` calls: every operation
 * touches at least two of them (an edit pushes onto `past` and empties `future`; an
 * undo moves a value from `past` to `future` and swaps the marks), and three
 * independent setters let a caller reach states the reader can never be in — a step
 * recorded with no marks behind it, a `future` that no longer describes where the
 * marks came from. As one value, every transition is total and every reachable state
 * is one the reader could actually have reached.
 *
 * The depth caps live here too, because they are the thing the two stacks have to
 * agree on: fifty steps back means at most fifty forward, or the reader's redo trail
 * would outlive the history it is walking through.
 * @module dsh-figmark/client/annotator/history
 */
import { useCallback, useMemo, useState } from 'react'
import type { AnnotationMark } from '../../shared/annotation'

/** How many steps the reader can walk back. */
const DEPTH = 50

/** What one document's annotation is, plus the trail that got it there. */
export interface EditHistory {
  /** The marks as they stand now. */
  readonly marks: readonly AnnotationMark[]
  /** Earlier states, oldest first, at most `DEPTH` of them. */
  readonly past: readonly (readonly AnnotationMark[])[]
  /** States the reader has walked back out of, next one first. */
  readonly future: readonly (readonly AnnotationMark[])[]
}

/** The trail, as the bar's two buttons need it: how far each way there is to go. */
export interface HistoryDepth {
  /** Steps available to walk back. */
  readonly past: number
  /** Steps available to walk forward. */
  readonly future: number
}

/**
 * History for a surface that starts with some marks already on it.
 * @param marks - the marks to open with, usually a draft being restored.
 * @returns a history with nothing to walk back to.
 */
export function openingHistory(marks: readonly AnnotationMark[]): EditHistory {
  return { marks, past: [], future: [] }
}

/**
 * Record a new set of marks as an edit, with the previous state walkable back to.
 *
 * A commit always drops the redo trail: the reader has just made a new decision, and
 * a redo kept from before it would silently overwrite that decision with an older
 * one.
 * @param history - the state before the edit.
 * @param next - the marks after it.
 * @returns the new history.
 */
export function commitMarks(history: EditHistory, next: readonly AnnotationMark[]): EditHistory {
  return {
    marks: next,
    past: [...history.past, history.marks].slice(-DEPTH),
    future: [],
  }
}

/**
 * Replace the marks without recording a step.
 *
 * Loading a document is not an edit: what was just read is what is already there, so
 * it must not become a step the reader can undo their work back through.
 * @param history - the state before the load.
 * @param next - the marks that were read.
 * @returns the new history.
 */
export function replaceMarks(history: EditHistory, next: readonly AnnotationMark[]): EditHistory {
  return { marks: next, past: history.past, future: history.future }
}

/**
 * Start over on a different document.
 *
 * A different document is not an earlier state of this one: its marks were never on
 * this surface, so no gesture here produced them and no press can walk back to them.
 * {@link replaceMarks} keeps both stacks, which is right for re-reading *the same*
 * document — applying it to a new address is what let a redo on figure B restore
 * figure A's marks, because the stacks described work that belonged to another
 * picture.
 * @param history - the state of the document being left.
 * @param next - the marks the new document opens with.
 * @returns the new document's history, with nothing to walk back to.
 */
export function resetMarks(history: EditHistory, next: readonly AnnotationMark[]): EditHistory {
  if (history.marks === next && history.past.length === 0 && history.future.length === 0) return history
  return { marks: next, past: [], future: [] }
}

/**
 * Walk one step back.
 *
 * Returns the same value when there is nothing behind, rather than a copy of it: an
 * undo that cannot move must not make React re-render the whole panel.
 * @param history - the current state.
 * @returns the state one step earlier.
 */
export function undoStep(history: EditHistory): EditHistory {
  const previous = history.past[history.past.length - 1]
  if (previous === undefined) return history
  return {
    marks: previous,
    past: history.past.slice(0, -1),
    future: [history.marks, ...history.future].slice(0, DEPTH),
  }
}

/**
 * Change the marks without recording a step, as typing does.
 *
 * Not an undoable edit — a character is not a decision the reader wants to walk back
 * one press at a time — but it *is* a change to what the marks are, so the redo trail
 * has to go with it. A redo entry is a snapshot taken before the sentence existed, and
 * leaving it there offered a button that undid the reader's own typing: undo once,
 * type, press redo, and the words were gone with nothing left to bring them back.
 * @param history - the current state.
 * @param update - the marks as they now stand.
 * @returns the state with the new marks and nothing left to redo.
 */
export function amendMarks(
  history: EditHistory,
  update: (marks: readonly AnnotationMark[]) => readonly AnnotationMark[],
): EditHistory {
  const marks = update(history.marks)
  // The same list back means the control reported the value already there. Nothing
  // changed, so nothing — including the trail — should.
  return marks === history.marks ? history : { marks, past: history.past, future: [] }
}

/**
 * Walk one step forward again.
 * @param history - the current state.
 * @returns the state one step later.
 */
export function redoStep(history: EditHistory): EditHistory {
  const next = history.future[0]
  if (next === undefined) return history
  return {
    marks: next,
    past: [...history.past, history.marks].slice(-DEPTH),
    future: history.future.slice(1),
  }
}

/** What a body does with its history. */
export interface HistoryHandle {
  /** The marks as they stand now. */
  readonly marks: readonly AnnotationMark[]
  /** How far each way the two buttons have to go. */
  readonly depth: HistoryDepth
  /** Record a new set of marks as one undoable edit. */
  readonly commit: (next: readonly AnnotationMark[]) => void
  /** Swap the marks out without recording a step. */
  readonly replace: (next: readonly AnnotationMark[]) => void
  /**
   * Start over on a different document.
   *
   * Unlike {@link replace} this drops both stacks: the redo trail belongs to the
   * picture it was walked on, and carrying it to the next one offers to restore
   * marks that were never drawn there.
   */
  readonly reset: (next: readonly AnnotationMark[]) => void
  /** Change the marks in place, as typing does: no undo step, and nothing left to redo. */
  readonly amend: (update: (marks: readonly AnnotationMark[]) => readonly AnnotationMark[]) => void
  /** Walk one step back. */
  readonly undo: () => void
  /** Walk one step forward. */
  readonly redo: () => void
}

/**
 * The history, as a component holds it.
 *
 * Every operation is wrapped in a `useCallback` with no dependencies, because each
 * one is computed from whatever the previous state turns out to be rather than from
 * a value read at render time: a commit is `commitMarks` applied to the state as it
 * is when the write lands, not to the marks some earlier render happened to close
 * over. That is what keeps a burst of edits from a single pointer gesture — a drag
 * reports once, but a keystroke reports per character — from folding into one step.
 * @param initial - the marks to open with.
 * @returns the marks and the ways to change them.
 */
export function useAnnotationHistory(initial: readonly AnnotationMark[]): HistoryHandle {
  const [state, setState] = useState<EditHistory>(() => openingHistory(initial))
  const commit = useCallback((next: readonly AnnotationMark[]): void => {
    setState(history => commitMarks(history, next))
  }, [])
  const replace = useCallback((next: readonly AnnotationMark[]): void => {
    setState(history => replaceMarks(history, next))
  }, [])
  const reset = useCallback((next: readonly AnnotationMark[]): void => {
    setState(history => resetMarks(history, next))
  }, [])
  const amend = useCallback((update: (marks: readonly AnnotationMark[]) => readonly AnnotationMark[]): void => {
    setState(history => amendMarks(history, update))
  }, [])
  const undo = useCallback((): void => { setState(undoStep) }, [])
  const redo = useCallback((): void => { setState(redoStep) }, [])
  // Counts, not the stacks: the bar asks how far each way there is to go and never
  // looks at a step, so handing it the stacks would rebuild the chrome on every edit
  // for a number that changed once.
  const depth = useMemo<HistoryDepth>(
    () => ({ past: state.past.length, future: state.future.length }),
    [state.future.length, state.past.length],
  )
  return { marks: state.marks, depth, commit, replace, reset, amend, undo, redo }
}
