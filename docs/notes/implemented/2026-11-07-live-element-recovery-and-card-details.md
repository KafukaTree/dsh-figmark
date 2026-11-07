# Note: Recover live element marks and simplify staged card details

Status: implemented

## Problem

On a loopback service page, collapsing a selected element's comment handed pointer input back to the page. The mark's element box remained visible but had no hit area, so the only way to reopen, edit, or delete that mark was through the annotation list. Element names could also escape their floating plate, especially when their text used wide CJK glyphs.

The composer card had a different interaction split. Clicking its arrow changed state, but the expanded content was a second embedded card with another non-working arrow. Text-only annotations also used `annotation.txt` as an admission image so the host would enable Send for an empty composer; that implementation detail appeared to the reader as an attachment.

## Decision

Element marks on rendered pages use their visible element box as the press target while the select tool is active. Pressing it reselects the mark and reopens its comment. The comment pill includes a delete action, guarded against removal while a delivery is in flight; the normal undo history can restore the mark.

The floating element code plate is capped to the paper's width. CJK characters are measured as full em advances, and the text is clipped with an ellipsis inside the plate rather than overflowing it.

The staged composer card is the only disclosure control. Its header and chevron expand the review in place, hide the one-line summary, and render the static review body directly without a nested card heading or a second arrow.

Text-only annotations still need a native draft attachment to enable the host's own Send button. They now use a one-pixel private admission image with a native image preview instead of `annotation.txt`. The card hides that exact preview, removes the temporary attachment immediately before invoking the host send, and releases the draft after settlement. A host that cannot remove the attachment does not receive the admission image and keeps the established direct-send fallback.

## Alternatives considered

- **Keep a transparent hit rectangle over every element mark.** It would block the page's own controls and links inside large page elements, recreating the reason element marks initially had no box hit area. Only the visible element box is pressable now.
- **Reopen marks only from the annotation list.** It preserves the old pointer-passing model but makes the visible mark feel inert and separates deletion from the object the reader is looking at.
- **Render the full review as a nested card.** It duplicates the card title and produced a second arrow whose state was disconnected from the outer card. Rendering the review body directly gives the disclosure one owner.
- **Keep `annotation.txt` and hide it with CSS.** The file still uploads, appears in attachment UIs that do not use the preview structure, and can travel if the host changes the send path. Removing it before send makes the message independent of presentation CSS.

## Consequences

Readers can recover an element mark from the page itself, delete it where they wrote its comment, and recover accidental deletion with undo. Long element names stay inside their floating plates. Staged card expansion is predictable and visually in place.

Text-only sends retain native composer behavior and no longer deliver a spurious file. The admission mechanism depends on the native shell exposing attachment removal; when that capability is absent, the plugin keeps its direct-send fallback instead of staging a file it cannot take back.
