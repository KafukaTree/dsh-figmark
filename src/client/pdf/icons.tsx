/**
 * The document's own icons.
 *
 * Drawn here rather than imported from the annotator body: this is the lazy chunk,
 * and the body reaches it as a prop precisely because the two halves cannot import
 * each other. The paths follow the body's own icon grid so a strip of these and a
 * strip of those read as one set.
 * @module dsh-figmark/client/pdf/icons
 */
import type { ReactNode } from 'react'

/** The hand-off to the agent. */
export function SendIcon(): ReactNode {
  return (
    <svg className="da-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M 3 12 L 21 3.9 L 15.9 21 L 12 14.1 Z" />
      <path d="M 12 14.1 L 21 3.9" />
    </svg>
  )
}

/** The hand-off into the composer draft. */
export function ChatIcon(): ReactNode {
  return (
    <svg className="da-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M 3.75 9.75 a 3 3 0 0 1 3 -3 h 10.5 a 3 3 0 0 1 3 3 v 4.5 a 3 3 0 0 1 -3 3 h -6 l -4.5 3.3 v -3.3 a 3 3 0 0 1 -3 -3 z" />
    </svg>
  )
}

/** One page back. */
export function ChevronLeftIcon(): ReactNode {
  return (
    <svg className="da-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M 14.5 5.5 L 8 12 L 14.5 18.5" />
    </svg>
  )
}

/** One page forward. */
export function ChevronRightIcon(): ReactNode {
  return (
    <svg className="da-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M 9.5 5.5 L 16 12 L 9.5 18.5" />
    </svg>
  )
}
