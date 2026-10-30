/**
 * The small drawings a bubble carries: a pencil for news, and for a send, the
 * destination's face that turns into a ring — then a check or a cross.
 *
 * Everything is stroke-only and monochrome on purpose. The panel's chrome is grey,
 * its accent belongs to the marks on the figure, and a bubble that ended well says
 * so with a shape rather than with a colour.
 * @module dsh-figmark/client/annotator/toast-icons
 */

import type { ReactElement } from 'react'

/**
 * The pencil a note carries: the gesture that produced the news.
 *
 * Drawn on the 24-unit grid the panel's other icons use, and shown at 14px so its
 * stroke lands just under one device-independent pixel — the weight the bar's glyphs
 * have. The pencil before this one was drawn on a 14-unit grid of its own at a stroke
 * that rendered 1.7px wide: a closed outline with a notch, inside a 14px box, which at
 * that size reads as a smudge rather than as a pencil. Two strokes on the shared grid
 * is what stays legible when the box is that small.
 */
export function PencilIcon(): ReactElement {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

/**
 * Where a send is going: the draft panel it is being written into, or the agent.
 *
 * It is the bar's own two marks — the speech bubble and the paper plane — drawn
 * again on the same 24-unit grid at the same rendered thickness, so the bubble's
 * icon reads as the same hand as the buttons above it.
 * @param props - which of the two.
 * @returns the glyph.
 */
export function DestIcon(props: { readonly icon: 'dialog' | 'agent' }): ReactElement {
  return (
    <svg
      className="da-dest" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    >
      {props.icon === 'agent'
        ? (
          <>
            <path d="M 3 12 L 21 3.9 L 15.9 21 L 12 14.1 Z" />
            <path d="M 12 14.1 L 21 3.9" />
          </>
        )
        : (
          <path d="M 3.75 9.75 a 3 3 0 0 1 3 -3 h 10.5 a 3 3 0 0 1 3 3 v 4.5 a 3 3 0 0 1 -3 3 h -6 l -4.5 3.3 v -3.3 a 3 3 0 0 1 -3 -3 z" />
        )}
    </svg>
  )
}

/** The arc that spins while a send is out, and that closes when it lands. */
export function SendRings(): ReactElement {
  return (
    <>
      <svg className="da-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle
          cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6"
          strokeLinecap="round" strokeDasharray="44 19"
        />
      </svg>
      <svg className="da-ring" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle
          cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6"
          strokeLinecap="round" strokeDasharray="63"
        />
      </svg>
    </>
  )
}

/** The check that ends a send well. */
export function CheckIcon(): ReactElement {
  return (
    <svg className="da-check" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12.5l4 4L19 7" stroke="currentColor" strokeWidth="3"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  )
}

/** The cross that ends a send badly — a shape, not a colour. */
export function CrossIcon(): ReactElement {
  return (
    <svg className="da-cross" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7.5 7.5l9 9M16.5 7.5l-9 9" stroke="currentColor" strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** The ↻ that replaces the × on a failure: the same send, tried again. */
export function ResendIcon(): ReactElement {
  return (
    <svg
      width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    >
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  )
}

