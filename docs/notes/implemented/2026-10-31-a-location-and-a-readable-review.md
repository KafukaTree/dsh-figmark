# Note: A location control, and a review card that can be scanned

Status: implemented

## Problem

The HTML preview's address bar was one transparent input on an otherwise empty strip.
At rest it looked like an unfinished text box, and focus suddenly drew a blue border
inside a surface that had no visible control boundary. The icon, format, and difference
between a local file and a proxied page were all left for the reader to infer.

The annotation card in a sent message had the opposite problem: it carried more
information than could be scanned. A mark's kind, ordinal, coordinates, element text,
source tag or selector, note, and out-of-bounds warning were concatenated into one
truncated line. The result read like a diagnostic dump, and the reader's own sentence
competed with the message contract around it.

## Decision

The HTML address strip is one visual control. A document icon, the editable filename,
and an `HTML` badge share a bordered field whose focus ring belongs to the whole field.
When a proxied page is open, the icon becomes a globe, the badge becomes the localized
"web page" label, and the existing back action stays beside it. Typing, Enter, Escape,
and the address semantics are unchanged.

The sent annotation card remains a view over the untouched message. A display-only
reader separates each mark line into a spaced name, geometry, element words, source
locator, and warning. The row head shows the first two; element text is a short quoted
context; the selector or opening tag is a quiet monospace chip; the reader's note uses
the strongest text; an out-of-bounds warning gets its own line. The full original mark
line remains in the row's tooltip. The card header now separates the file name from its
scope and marks rendered HTML with an `HTML` badge.

## Alternatives considered

- **Only restyle the existing input** — removing the focus border or filling its
  background would still leave the reader unable to tell file from page, and would not
  give the strip a control-shaped resting state.
- **Rewrite the delivered message into a prettier format** — the message is the agent's
  contract and copying it must preserve the same text; changing presentation by
  changing the payload would make the card easier to read at the cost of the actual
  hand-off.
- **Hide coordinates entirely** — coordinates are how a reader checks a mark against
  the stated render size and how they disambiguate two marks with the same kind and
  ordinal. They should recede, not disappear.
- **Render every fact in a table column** — the transcript column is often about
  320px wide; columns force identifiers and notes into narrower ellipses than the
  current stacked rows.
- **Add a new parser to the annotation rule** — this is a presentation concern. Keeping
  the split in the card lets an unfamiliar or future label fall back to its unmodified
  text instead of changing host-side message data.

## Consequences

- The address strip is taller and visibly bounded at rest. It takes a little more
  vertical space from the HTML page, but it no longer changes identity only on focus.
- A three-mark card is taller than the old one-line rows. In exchange, each coordinate,
  element name, locator, note, and warning has a stable visual position.
- Display parsing is deliberately shallow. Standard Chinese and English mark summaries
  are split; an unfamiliar suffix remains available verbatim in the tooltip and in the
  copied message.
- The card still opens the full annotation in the Sidebar, and the message body itself
  is byte-for-byte unrelated to these display changes.
