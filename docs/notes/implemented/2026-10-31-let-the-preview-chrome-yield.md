# Note: Let the HTML annotation follow the page

Status: implemented

## Problem

Five follow-up problems only appeared when the real panel was resized and used:

- An invalid address left its refusal under the restored file name after Escape, so
  the file looked as if it had failed to open.
- A sent annotation card put a narrow file name and its render scope on one line;
  both were truncated in the transcript's usual 320px column.
- A success toast used the panel's top-right corner and covered the new HTML address
  control. When an address refusal was present, the toast had no place to go at all.
- The element guide decided whether to hide its keyboard legend with a viewport media
  query. A split pane can be 300px wide inside a much wider browser window, so the
  legend stayed, the current hierarchy level disappeared, and even the legend clipped.
- The element guide was a sentence-length banner across the top centre of the page,
  covering the document's first line of content.
- The sent card rendered every element locator and selector, squeezed coordinates and
  names into one line, and spent Chinese sentences on facts that fit as dimensions and
  a count.
- The list count hung four pixels above its button inside an overflow-hidden toolbar,
  so its top was clipped in the real panel.
- The HTML overlay itself was translated by the page's scroll offset. On content below
  the first viewport the transparent event-catching sheet had moved out of the window,
  leaving paragraphs and headings visible but impossible to click.
- Opening a local page cleared the file's in-memory marks. Returning to the file then
  scheduled the empty-surface autosave, which deleted the file's annotation sidecar.

## Decision

- Focusing, editing, or cancelling the HTML address clears the refusal from the value
  it described.
- The sent-card header stacks the file name over its render scope instead of putting
  both in one ellipsis.
- The card uses the file name as its title, dimensions as a compact fact, a numeric
  count badge, and numbered rows with the element's own text plus a short tag. Source
  selectors and element coordinates remain in the full mark line's tooltip and in the
  model-facing message.
- HTML toasts start below the address bar, and below the refusal line when one is
  present.
- The measured figure width marks the root as compact below 360px. In that state the
  guide hides its keyboard legend first, keeping the current level readable.
- Element mode is a small upper-right status pill. Its visible copy is just the mode,
  the action, and the hierarchy position; the full keyboard explanation remains on the
  status element for assistive technology.
- The overlay stays fixed over the document window and only its mark layer moves with
  the page's scroll offset. Pointer math carries that same offset, so a click on any
  visible part of a long document names the element under the window point.
- The list count sits inside the button's vertical scroll viewport rather than above
  it.
- Opening a page checkpoints the file's marks and note. The file surface suppresses
  autosave while the page is up, and the back action restores the checkpoint.

## Alternatives considered

- **Keep the address error until the next open attempt** - a restored file name under a
  red error attributes the previous refusal to the wrong value.
- **Give the card a horizontal tooltip instead of stacking its scope** - the tooltip
  preserves the hidden text but not the at-a-glance reading the card exists for.
- **Keep every locator and coordinate on the card** - it turns a short scan into debug
  output and clips the element's actual words in the transcript's normal width.
- **Grow the overlay to the document's full height** - it would need a second geometry
  for a viewport-sized window and would still move event coordinates away from the
  visible frame.
- **Leave the count above the tool button and add padding to the scrollport** - it
  spends horizontal and vertical bar space on a badge instead of keeping the badge
  within the control it annotates.
- **Move every toast to a generic bottom corner** - successful sends would then cover
  the floating bar and the marks the reader is still checking.
- **Use only a viewport media query for the guide** - the shell's split view makes the
  viewport and the preview column different widths, so the query answers the wrong
  question.
- **Wrap the guide onto two lines** - it would grow down over the image in exactly the
  narrow pane where the image has least room.
- **Keep the file marks visible under the live page** - their selectors describe a
  different document, and a live pick would append to the file's list by accident.

## Consequences

- Address refusals describe only the value currently in the field.
- Card headers spend one extra metadata line but keep both the file and the scope
  legible.
- HTML toasts yield about 44px more top space; the transient message remains over the
  document rather than over the control that names it.
- Narrow panes omit the arrow-key legend. The current element level remains visible;
  the keys remain available when the pane has room for them.
- Long HTML pages remain clickable through their whole visible viewport rather than
  only through the first screenful.
- The sent card is denser and quieter: less Chinese prose, one line per mark unless the
  reader wrote a note, and the full locator still available on hover.
- A visit to a live page no longer writes to or deletes the file's sidecar. The file
  marks and figure note are restored by the existing back action; live-page marks
  remain temporary because a URL has no sidecar of its own.
