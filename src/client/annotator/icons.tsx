/**
 * The glyphs the panel draws: the tool tiles, the bar's record folds, the history
 * steps, the hand-off, and the grips that make the two floating strips movable.
 *
 * They are drawn rather than borrowed from an icon set so the whole row sits on one
 * 24-unit grid, and they live in one module so a glyph cannot drift from the tool it
 * stands for: a tool that gains a tile gains its picture here, beside its neighbours,
 * where the difference between two similar shapes is visible.
 *
 * Presentation only — nothing here reads a prop, a ref or the Host. Every path is
 * exported as it is drawn, so the surface decides what a glyph means by choosing
 * which one to render.
 * @module dsh-figmark/client/annotator/icons
 */
import type { ReactNode } from 'react'
import type { Tool } from '../Canvas'

/**
 * The handle's dots: six of them, three by two, turned as the reader asked.
 *
 * The palette stands up and takes a grip three columns wide by two rows tall; the bar
 * lies down and takes one two columns wide by three rows tall. That is the pair the
 * reader called for, and it is the opposite of what the strips' own proportions would
 * suggest — noted here so it is not "corrected" back by the next pair of eyes.
 *
 * Drawn instead of typed — the braille character this replaces was one glyph at one
 * size, so the dots could not be sized or spaced, and at 9px they came out a smudge.
 */
export function GripDots({ wide }: { readonly wide: boolean }): ReactNode {
  // The grid is the size the dots are drawn at, one svg unit to one pixel: the marks
  // stay small and sharp rather than being scaled down out of a larger frame.
  const xs = wide ? [2, 6, 10] : [2, 6]
  const ys = wide ? [2, 6] : [2, 6, 10]
  return (
    <svg className="da-grip-dots" viewBox={wide ? '0 0 12 8' : '0 0 8 12'}
      aria-hidden="true" focusable="false">
      {ys.map(y => xs.map(x => <circle key={`${x}-${y}`} cx={x} cy={y} r={1.4} />))}
    </svg>
  )
}

/**
 * The select tool: an open hand.
 *
 * The hand is what the tool *is* — dragging with it moves the paper, and the stage's
 * own cursor already says `grab` while it is armed. A cursor arrow here said the
 * opposite thing: an arrow is the pointer a marking tool wears, and `element` wears
 * one, so the two tiles looked like the same tool.
 *
 * The shape is Tabler's `hand-stop`, taken whole at its own 24 grid: five fingers drawn
 * as five strokes would be a smudge at 17px, and this one's palm-and-thumb silhouette
 * survives the size.
 */
export function GrabIcon(): ReactNode {
  return (
    <svg className="da-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={'M8 13v-7.5a1.5 1.5 0 0 1 3 0v6.5'} />
      <path d={'M11 5.5v-2a1.5 1.5 0 1 1 3 0v8.5'} />
      <path d={'M14 5.5a1.5 1.5 0 1 1 3 0v6.5'} />
      <path d={'M17 7.5a1.5 1.5 0 1 1 3 0v8.5a6 6 0 0 1 -6 6h-2h.208a6 6 0 0 1 '
        + '-5.012 -2.7a69.74 69.74 0 0 1 -.196 -.3c-.312 -.479 -1.407 -2.388 '
        + '-3.286 -5.728a1.5 1.5 0 0 1 .536 -2.022a1.867 1.867 0 0 1 2.28 .28l1.47 1.47'} />
    </svg>
  )
}

/**
 * The pointer a `select` tool wears instead of the word "select".
 *
 * Every other tool is a picture of what it draws — an arrow, a box, a circle — and
 * this one draws nothing, so the pointer is the honest shape: it is the tool you use
 * with the mouse rather than a mark you leave behind. Drawn rather than written so
 * the toolbar stays one row of controls at any locale or font size.
 */
/**
 * The element tool: a cursor, outlined rather than filled.
 *
 * It is the arrow the whole panel used to wear for `select`, moved to the tool that
 * actually behaves like a pointer: `element` asks what is under the cursor and takes the
 * thing it is over. Where `select` got it, it named a tool that does not point at
 * anything — it drags the paper.
 *
 * Filled, it read as a black blob against the dark chip — the silhouette was there but
 * the direction it points was not, which is the only thing a cursor has to say. As an
 * outline it belongs to the same stroke set as the other glyphs.
 *
 * The shape is Tabler's `cursor-text`-sibling `pointer` glyph, taken whole at its own
 * 24 grid: its body is one closed curve with round joins rather than the seven hard
 * corners a hand-traced outline has, and at 16px that softness is the whole difference
 * between a cursor and a shard. Scaled by hand it lost exactly that.
 */
export const POINTER_PATH = 'M15.02 14.03l4.74 -1.85c1.36 -.53 1.29 -2.49 -.11 -2.92l-12.03 -3.68'
  + 'c-1.18 -.36 -2.29 .75 -1.93 1.93l3.68 12.03c.43 1.4 2.39 1.47 2.92 .11'
  + 'l1.85 -4.74a1.55 1.55 0 0 1 .88 -.88'

/**
 * The stroke each marking tool draws, so the row says it in pictures as well as words.
 *
 * Every icon in the row is drawn on the same 24-unit grid. That is not cosmetic:
 * `stroke-width` in an inline SVG is measured in the icon's own units, so a 16-unit
 * icon and a 24-unit icon given the same number draw at different thicknesses. On one
 * grid they cannot drift, and the whole row reads as one set.
 *
 * `select` never comes here: it draws nothing, so it wears the open hand. `element` does
 * come here, because a mark that is an element is drawn as the box around it, and the
 * arrow beside it says the tool picks rather than draws.
 */
export function ToolIcon(tool: Exclude<Tool, 'select'>): ReactNode {
  const shape = tool === 'arrow'
    ? <><path d="M 4.5 19.5 L 19 5" /><path d="M 10 5 h 9 v 9" /></>
    : tool === 'rect'
      ? <rect x="4" y="6" width="16" height="12" rx="2" />
      : tool === 'ellipse'
        ? <circle cx="12" cy="12" r="8.2" />
        : tool === 'pen'
          ? <path d="M 4 18 C 7 6 12 20 20 5" />
          // The element tool points at what it takes, so it wears the arrow; the same
          // path the `select` tile used to wear, from one constant so the two can never
          // drift apart again.
          : tool === 'element'
            ? <path d={POINTER_PATH} />
            // The point tool wears the mark it places: a filled drop with a hole where
            // the number goes, and a dot inside it. The hole is a second subpath cut out
            // with evenodd; the dot is a separate circle rather than a third subpath,
            // because evenodd would cut that hole back open.
            : (
              <>
                <path fillRule="evenodd"
                  d="M 12 22.4 Q 4.9 15.1 4.1 10.16 A 7.9 7.9 0 1 1 19.9 10.16 Q 19.1 15.1 12 22.4 Z
                     M 12 16.02 A 5.62 5.62 0 1 0 12 4.78 A 5.62 5.62 0 1 0 12 16.02 Z"
                  fill="currentColor" stroke="none" />
                <circle cx="12" cy="10.4" r="2" fill="currentColor" stroke="none" />
              </>
            )
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">{shape}</svg>
  )
}

/**
 * The overall goal's mark: an arrow that has hit a target.
 *
 * The record this heads is not a note about one place on the figure — it is what the
 * whole picture is meant to become — so it wears the one symbol that means "aim"
 * rather than the note the per-mark detail uses. At 16 pixels the arrow is one shaft
 * and two barbs; anything finer reads as a smudge.
 */
export function GoalIcon(): ReactNode {
  return (
    <svg className="da-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="10.5" cy="13.5" r="7.8" />
      <circle cx="10.5" cy="13.5" r="3.45" />
      <path d="M 20.7 3.3 L 12.3 11.7" />
      <path d="M 14.4 3.9 L 20.7 3.3 L 20.1 9.6" />
    </svg>
  )
}

/** The list card's mark: three stacked rows, the shape of the card itself. */
export function ListIcon(): ReactNode {
  return (
    <svg className="da-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M 9 6.75 h 10.5 M 9 12 h 10.5 M 9 17.25 h 10.5" />
      <circle cx="4.8" cy="6.75" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="4.8" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="4.8" cy="17.25" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** The empty list's picture: an open box, the usual "nothing here yet". */
export function BoxIcon(): ReactNode {
  return (
    <svg className="da-empty-ico" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path d="M 12 20 l 12 -6 l 12 6 v 12 l -12 6 l -12 -6 z" />
      <path d="M 12 20 l 12 6 l 12 -6" />
      <path d="M 24 26 v 12" />
      <path d="M 17 14.5 l 4.5 2.5 M 31 14.5 l -4.5 2.5" />
    </svg>
  )
}

/** A step back, as the usual curved arrow. */
export function UndoIcon(): ReactNode {
  return (
    <svg className="da-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M 4.8 11.25 H 14.25 a 5.1 5.1 0 0 1 0 10.2 H 9" />
      <path d="M 8.7 6.6 L 4.05 11.25 L 8.7 15.9" />
    </svg>
  )
}

/** The same arrow the other way. */
export function RedoIcon(): ReactNode {
  return (
    <svg className="da-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M 19.2 11.25 H 9.75 a 5.1 5.1 0 0 0 0 10.2 H 15" />
      <path d="M 15.3 6.6 L 19.95 11.25 L 15.3 15.9" />
    </svg>
  )
}

/** The primary action's mark: a paper plane, the usual "this leaves here". */
export function SendIcon(): ReactNode {
  return (
    <svg className="da-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M 3 12 L 21 3.9 L 15.9 21 L 12 14.1 Z" />
      <path d="M 12 14.1 L 21 3.9" />
    </svg>
  )
}

/** The secondary action's mark: a speech bubble, "this goes to the chat box". */
export function ChatIcon(): ReactNode {
  return (
    <svg className="da-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M 3.75 9.75 a 3 3 0 0 1 3 -3 h 10.5 a 3 3 0 0 1 3 3 v 4.5 a 3 3 0 0 1 -3 3 h -6 l -4.5 3.3 v -3.3 a 3 3 0 0 1 -3 -3 z" />
    </svg>
  )
}
