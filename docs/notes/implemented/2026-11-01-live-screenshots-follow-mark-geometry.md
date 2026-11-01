# Note: Live screenshots follow mark geometry

Status: implemented

## Problem

Every live-page hand-off captured and encoded a screenshot before the reader could
see the pending card. Element picks and pins already carry the information needed to
act on them: an element has a CSS selector and a live bounding box, while a pin has
its coordinate and note. A screenshot adds no durable locator for those marks, but it
does add the cost of cloning a rendered subtree, encoding a PNG, composing an SVG,
and rasterizing it again.

The delay is most visible on an element-only review, which is also the common case
when a reader is pointing at a heading or paragraph in a served page.

## Decision

A live-page hand-off requests a screenshot only when at least one delivered mark has
drawn geometry: an arrow, rectangle, ellipse, or pen stroke. A review made entirely
of element picks and pins sends its selectors, boxes, coordinates, and notes without
a screenshot, without a screenshot warning, and without waiting for the picker.
When drawn and pointer-only marks are mixed, one screenshot is taken for the visible
surface and every visible mark on that surface is drawn over it.

The rule is based on the delivered scope, not the whole stored draft or the document
type. It applies equally to a scrolling page and to a deck's current surface.
The model-facing mark list always carries a mark's `surface` selector, so a pin or
drawing on a page that did not travel in the screenshot is still locatable.

## Alternatives considered

- **Always capture to keep one code path** - rejected. The common element-only path
  pays several seconds for a picture whose useful information is already textual.
- **Capture only point marks** - rejected. A bare pin has the least visual context of
  any mark; the same coordinate plus comment is sufficient.
- **Let the reader opt out per send** - rejected for now. It adds a decision to every
  hand-off for a rule that follows directly from the mark kinds.
- **Drop element boxes from screenshots while keeping captures** - rejected. Mixed
  reviews still need all visible marks over the same snapshot to stay intelligible.

## Consequences

Element and pin reviews become effectively immediate and produce no image attachment.
Their composer and transcript cards say "位置标注" instead of presenting a missing
thumbnail as an unfinished card. Drawn reviews retain the current visible-surface
screenshot and its attached warning or failure behavior. `pageCapture: omitted` means
"this live review needed no screenshot"; `none` stays reserved for file-backed
documents, so neither state is confused with capture failure.

The picker's source raster is also capped by both 1.5x and an 1800px longest side. The
old 2x/2400px source paid for pixels that the composed review downscaled away. On a
larger page the 1800px cap, rather than 1.5x, is the limit that applies, so this is a
deliberate quality/speed tradeoff rather than a fixed output scale.

This narrows the screenshot rule in
`2026-11-01-live-screenshot-travels-with-the-page.md`; it does not restore any file
artifact for a live page.
