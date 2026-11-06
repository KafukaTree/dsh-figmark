# Note: Review cards separate the review, its source and its send

Status: implemented

## Problem

One annotation card represented several different things at once. Clicking a sent
card opened the current source file even though the card showed the review that was
delivered earlier. Clicking a staged card sent it immediately even when the reader
only wanted to inspect it. A generic `FIG` badge made PNG, SVG and PDF reviews look
alike, and renaming a list row replaced the mark's tool-specific ordinal.

The card also hid the message's attachment strip whenever it had a source opener.
That rule was written for one duplicate image, but a PDF message carries the marked
page images and a message may carry unrelated files. Expanding a staged review then
required a second click inside the card.

## Decision

The card now treats its parsed annotation as an immutable review snapshot. Its
header expands all marks in place; a separate action opens the current source file
or returns to the live page. Staged cards use the same pattern, with an explicit
send action beside a preview that never sends by itself.

The shared subject reader identifies PNG, JPEG, WebP, GIF, ICO, BMP, SVG, PDF, static
HTML and loopback pages before the card chooses its badge or navigation route. File
names and live server identities remain readable, and a refused source open stays
inside the card as recoverable feedback.

The card keeps the original tool ordinal, reports the total page count for a PDF,
and preserves the message's attachments. A staged PDF now uploads the marked page
PNGs as draft files, so the message and card describe attachments that actually
travel through the composer.

## Alternatives considered

- **Keep the whole card as one button that opens the source** — it made inspection
  indistinguishable from navigation and sent readers to a file that may have changed
  since the review.
- **Expand into a dialog or a new transcript surface** — the review is already the
  content of this message, so moving it elsewhere breaks the message/reply context.
- **Use a type-specific card for every media kind** — the data and reading hierarchy
  are the same; a shared card with an accurate badge avoids parallel interaction
  rules as new formats appear.
- **Keep hiding every attachment under a sent card** — this loses the page images
  needed for a PDF review and unrelated files carried by the same message.
- **Leave staged-card sending on the preview click** — inspection caused an
  irreversible delivery and contradicted the explicit-send convention elsewhere in
  the composer.
- **Keep the 4xx local-page discovery rule** — a recent address that now returns
  `404` is not an openable page and belongs in the failed candidate set.

## Consequences

Readers can inspect, expand and send without guessing which meaning a click has.
PDF reviews show their document and page context, source navigation remains
available without masquerading as the review itself, and draft page attachments are
present before the composer sends them. The card uses more than one interactive
element, so keyboard labels and focus order are part of the tested contract.
