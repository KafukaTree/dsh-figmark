# The panel earns its space

## What the reader said

The panel worked; it read like a form. Everything sat in one vertical strip — mode,
tools, six colour swatches, a slider, a checkbox, two history buttons, two zoom
buttons, the figure, two text fields, the mark list, two send buttons — so nothing
said "this is the figure and these are the settings". The complaint was about
*空间感*: no depth, no grouping, no sense that a card was a card.

The reader also pointed at a reference rendering and said the *pictures* were the
part to copy, not the code: its layout, its tiles, its cards. So this change is
driven by that rendering rather than by its prose.

## What changed

- **The lower half is three cards in two columns.** Left: the overall goal, and
  under it the selected mark's detail. Right: the mark list. The grid is
  `repeat(auto-fit, minmax(258px, 1fr))`, so a narrow pane stacks the columns.
  Each card has an icon and its name; the list carries its count beside the name
  and a quiet "clear" at the far end. The goal and the detail are separate cards
  because they answer different questions, and because the detail card can show
  "nothing selected" by being disabled while the goal card never can.
- **The toolbar is two rows with jobs.** Row one draws (mode switch, six tool
  tiles, one settings button); row two acts (undo, redo, and the two view jumps,
  pushed apart by a spacer). A tool *tile* is an icon over its word: six of them
  fit where six inline words did not, and a tile reads as a pencil on a shelf
  rather than as a sentence of buttons.
- **The settings unfold under the toolbar.** The floating popup was clipped by the
  toolbar's own scroller, and once unclipped it covered the corner the next stroke
  starts in. A row that pushes the figure down costs only the height it uses.
- **Every mark row wears its own colour.** The number chip is filled with
  `mark.color`, and a second line names the shape and the anchor
  (`箭头 · 滑套 34`). The old per-row preview glyph is gone: a stroke-coloured
  thumbnail beside a stroke-coloured number said the same thing twice, and the
  thumbnail was too small to read a shape from anyway.
- **The figure sits on paper.** `.da-surface` is a white card with a two-layer
  shadow, centred in the stage, so the drawing has a table to lie on.
- **The empty list is a picture and two lines.** A card of grey text reads as
  broken; "nothing yet" is a state, not an error.
- **The footer is a bar.** A one-line hint on the left, the two actions on the
  right, and only the primary one filled — one filled thing says "this is the way
  out" better than two equally loud ones.

## Two bugs this surfaced

- **A filled control needs a literal colour.** `.da-send .da-btn-primary` used
  `var(--dsw-alias-brand-primary, currentColor)` for its *background*. When the
  shell defines no brand token, `currentColor` resolves to the button's own text
  colour — which the same rule had just set to white. The main action rendered as
  a white button with white text, i.e. an invisible one. Filled backgrounds now
  fall back to `#176df2` and the label is plain `#fff`.
- **A horizontally scrolling toolbar clips every popup anchored to it.** That is
  why the settings never appeared at the right place. The row now wraps and stacks
  instead.

## Alternatives considered

- **Keep the floating popup and fix only its clipping.** Rejected: even unclipped
  it covers the figure. A control used *while* looking at the figure must not sit
  on top of the figure.
- **Put colour and number size in the lower cards instead of the toolbar.**
  Rejected: they describe the *next* stroke, not the annotation, and the cards are
  about the annotation. Mixing them would make each card mean two things.
- **Keep the old preview glyph and add the coloured number beside it.** Rejected:
  two previews of one mark in one row. The number is the one the figure shows, so
  the number is the one to colour.
- **Give each tool its word instead of a tile.** Rejected: six words plus "选择"
  pushed the row past the pane's real width, and the wrap it caused was ragged.
  Icon-over-word keeps one row and still spells each tool out.
- **Make the settings a modal.** Rejected: a modal for two settings is heavier than
  the problem, and it would still cover the figure.
- **Auto-collapse the settings row on every render.** Rejected: a reader adjusting
  the number size wants to watch the figure change while the controls stay put. It
  collapses when they pick a tool, which is the moment they move on.
- **Hide the send buttons until there is something to send.** Rejected: the reader
  should be able to see where the process ends before they start it, and a disabled
  button says that better than an absent one.
