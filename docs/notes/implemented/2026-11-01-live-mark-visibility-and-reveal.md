# Note: Follow the live element when revealing a saved mark

Status: implemented

## Problem

A live-page mark could store the surface that was in front when it was created,
not the surface that owns its element. Clicking the mark then stayed on the wrong
slide, waited for a hidden element, and reported either `hidden` or
`wrong-surface`. A mark captured on a cover or another overlay outside every
slide had no owning surface at all, so its list row could not navigate anywhere.

## Decision

The picker now resolves the target element first and uses its nearest page as the
destination; a recorded surface is only a fallback when the element has no page
ancestor. If the element is outside every page and is currently hidden, the
picker turns to the first laid-out page instead. When the element is a cover or
modal layer that the page has hidden, the picker temporarily restores the hidden
ancestors with inline `!important` styles and makes the outer restored layer
non-interactive. Closing the mark, changing the live surface, or starting another
reveal restores the page's own inline values. A hidden result still selects the
mark and opens its comment card at the recorded box, so the row remains useful
after the page has closed a state the picker cannot restore.

Each pick reports its owning surface, including an explicit `null` for a cover or
overlay outside every slide. The panel stores that owner rather than attaching the
slide that happened to be open, so a cover mark is not painted over the first slide
after the deck starts.

Page visibility checks the full ancestor chain for `display`, `visibility`,
`content-visibility`, and `opacity`, and ignores zero-layout page clones such as
overview thumbnails when choosing a navigation target.

Locating a mark scrolls with `block: "nearest"` only when the element is not fully
in the viewport. An element already on screen is left exactly where it is, which
keeps fixed-stage decks and scaled documents from shifting under the reader.

## Alternatives considered

- **Trust the stored `surface` first** — it is cheap, but old marks point at the
  slide that happened to be open at creation time and reproduce the bug.
- **Attach an overlay to the visible slide** — it makes the mark easy to draw, but
  also makes it follow that slide forever; the cover is not part of the slide.
- **Leave hidden marks inert and show a toast** — it protects the page from a
  best-effort move, but leaves a listed comment impossible to reopen.
- **Pick the last surface for overlays that follow the deck** — thumbnail clones
  and hidden pages make "last" unreliable; the first laid-out page is the stable
  fallback for a cover or title card.
- **Remove the page's hiding class** — it looks simpler, but changes application
  state, triggers the page's own observers and animations, and cannot be restored
  faithfully. The temporary inline lease is narrower and reversible.
- **Always centre the located element** — it gives every result the same scroll,
  but moves pages that were already showing the mark and causes visible jumps.

## Consequences

Cross-page list navigation follows the element's real owner and works with marks
created before surface ownership was recorded. Cover marks return to the first
page and show the cover long enough to inspect it. A page change or closing the
comment puts the cover back into the hidden state chosen by the page itself. A
hidden element with no restorable overlay still receives a best-effort navigation
to the first page and exposes its comment at the recorded box. Surface-less marks
rely on the page's visibility report instead of being pinned to whichever slide is
currently open.
