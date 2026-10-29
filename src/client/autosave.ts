/**
 * Keeping an annotation on disk while it is still being written.
 *
 * A mark used to exist only in memory until it was delivered, so anything that
 * ended the tab — a refresh, a reload, a crash — took every unpublished mark with
 * it. That is the opposite of what a draft should do: the reader's work is worth
 * keeping from the moment it is written, and only a *delivery* or an explicit
 * "clear" should remove it.
 *
 * The write is debounced because a mark is written a character at a time. It is
 * also serialized: two saves of the same file racing would leave whichever finished
 * last on disk, which is not necessarily the newer one.
 * @module dsh-figmark/client/autosave
 */

import type { AnnotationMark } from '../shared/annotation'

/**
 * How long the surface waits after the last edit before it writes.
 *
 * Long enough that typing a sentence is one write rather than forty, short enough
 * that a reader who closes the tab straight after typing has lost nothing.
 */
export const AUTOSAVE_DELAY_MS = 600

/**
 * The identity of what an annotation holds.
 *
 * Two renders with the same marks and the same note are the same annotation, and a
 * write that would replace one with itself is skipped rather than performed. Order
 * matters — it is the order the numbered list is read in — so it is part of the
 * identity.
 *
 * @param marks - the marks, in list order.
 * @param summary - the note about the whole figure.
 * @returns a string equal exactly when the two annotations are equal.
 */
export function annotationSignature(marks: readonly AnnotationMark[], summary: string): string {
  return `${summary.trim()}\u0000${JSON.stringify(marks)}`
}

/** What one autosave needs from the surface that owns it. */
export interface AutosaveDeps {
  /**
   * Write what the surface holds when the write runs.
   *
   * Read at call time rather than closed over, so a write that runs from a timer
   * long after the render that scheduled it still writes what is on screen now.
   */
  readonly write: () => Promise<void>
  /** Report a failed write. The next edit schedules another attempt. */
  readonly onError: (error: unknown) => void
  /** How long to wait after the last edit. */
  readonly delay: number
}

/** The handle a surface keeps for its own background writes. */
export interface Autosave {
  /** Ask for a write once the edits stop. */
  schedule(): void
  /** Write now, cancelling any pending wait. */
  flush(): Promise<void>
  /** Drop a pending wait without writing. */
  cancel(): void
  /**
   * Wait for every write this writer has started, so a caller that is about to
   * delete the file knows one cannot land afterwards.
   *
   * Dropping the pending wait is not enough on its own: a write that had already
   * begun when the reader cleared the panel finishes after the delete and puts the
   * sidecar back, which is why a cleared figure could reopen with its marks on it.
   * Deleting is the one gesture that has to wait for the queue to empty.
   */
  drained(): Promise<void>
}

/**
 * Build the writer one surface keeps for its lifetime.
 * @param deps - what to write, where to report a failure, and how long to wait.
 * @returns the writer.
 */
export function createAutosave(deps: AutosaveDeps): Autosave {
  let timer: ReturnType<typeof setTimeout> | undefined
  /**
   * The queue of writes.
   *
   * Each write waits for the one before it, so the file on disk is always the
   * result of the newest write that was asked for — never of whichever of two
   * concurrent writes happened to finish last.
   */
  let chain: Promise<void> = Promise.resolve()

  const cancel = (): void => {
    if (timer === undefined) return
    clearTimeout(timer)
    timer = undefined
  }

  const run = (): Promise<void> => {
    // The failure is caught on the chain itself: an error must not break the queue
    // for the writes that follow it.
    chain = chain.then(deps.write).catch((error: unknown) => { deps.onError(error) })
    return chain
  }

  return {
    schedule(): void {
      cancel()
      timer = setTimeout(() => {
        timer = undefined
        void run()
      }, deps.delay)
    },
    async flush(): Promise<void> {
      cancel()
      await run()
    },
    async drained(): Promise<void> {
      cancel()
      // The chain never rejects — `run` catches on it — so awaiting the current tail
      // means every write asked for so far has finished, successfully or not.
      await chain
    },
    cancel,
  }
}
