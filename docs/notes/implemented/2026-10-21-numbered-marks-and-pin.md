# Numbered marks, a pin for a point, and a hand-off at the bottom

## What changed

Five things about how the surface reads and how it is driven.

1. **Every mark wears its number.** The list the reader and the agent read is
   numbered ①②③; the figure now carries the same numbers. `src/client/badges.ts`
   places one badge per mark — a white disc with the digit, and a short leader that
   ends on the mark's own outline. Both the live overlay (`Canvas`) and the delivered
   picture (`composeReviewSvg`) build their badges from `badgePlacements`/`badgeSvg`,
   so the number on screen and the number in the image cannot drift. A page of a PDF
   passes a `numbering` map so its badges continue the document's count instead of
   restarting at 1.

2. **Where a badge goes is decided by cost, not by a fixed corner.** A figure is line
   work from edge to edge; wherever a badge lands it covers something. Candidates are
   the eight compass points around the shape at three distances; each is scored by how
   much of any mark's drawn box it would cover plus how far it has drifted from the
   shape's own corner. A candidate that would overlap an earlier badge, or sit mostly
   off the figure, is unusable. If every candidate is unusable the first is clamped
   back onto the figure: a badge over something is still readable, one outside the
   picture is not there at all.

3. **A `point` mark is a map pin.** It used to be a ring centred on the coordinate,
   which covers the very pixel it claims and says nothing about where inside itself
   the coordinate is. The pin's tip sits exactly on the coordinate and its head stands
   above, clear of the spot — the shape every map already uses for "exactly here". Near
   the top edge the pin turns over and stands below the tip, so the head never leaves
   the picture. `render.ts` computes the geometry once (`pinGeometry`) and the overlay,
   the export, the list glyph, the hit area and the control frame all read it from
   there.

4. **Drawing is one-shot.** `Canvas` reports `onDrawn` after a gesture commits, and the
   body switches back to `select`. Drawing is finished the moment the pointer lifts;
   leaving the tool armed turns the next idle drag on the figure into a stray shape.

5. **Zoom is done with the pointer, and the hand-off is at the bottom.** The
   `zoomIn`/`zoomOut` buttons are gone: the stage already listens for a trackpad pinch
   and a ctrl-modified wheel, and a row of step buttons spent the toolbar's width
   saying what those already say. "Fit width" and "100%" stay, because those are the
   two jumps a pointer cannot make. The send buttons moved out of the toolbar into a
   `.da-send` footer at the bottom right, past the list — where a reader who has
   finished reading the list arrives, and out of the way of the tool row.

## Consequences

- A mark's lettering is the only text the surface draws, and it is a digit. The
  `tests/canvas.spec.tsx` assertion "no `<text>` at all" became "no `<text>` that is
  not a badge".
- `markOutline` had to be added: a badge must keep clear of what a mark *draws*, not
  of the points it stores. An arrow's barbs stand past its tip, and a stroke is half
  its width wide on each side.
- `describeMark` already numbers the sentences, so a badge and its sentence carry the
  same digit by construction: both come from the mark's position in the document.

## Alternatives considered

- **Place badges in the figure's corners, numbered along the edge.** This is what a
  published figure does with a legend, and it avoids covering the line work at all.
  Rejected because it separates a number from the thing it numbers: on a figure with
  three arrows in one corner the reader has to trace a leader across the picture. A
  badge beside its own mark trades some covered line work for an unambiguous pairing.
- **Place badges inside the shape's box, on its top-left corner.** Cheaper to compute
  and always adjacent. Rejected because the corner of a shape is usually exactly where
  the shape says something — a box's border, an arrow's tail — so the disc landed on
  the most informative part of the mark.
- **Draw the number into the figure's own SVG, as a `<title>`/`aria-label`.** No pixel
  cost, but invisible: neither the reader nor a vision model sees it.
- **Use `foreignObject` with an HTML disc and CSS.** It would have given a proper
  circle with a real font. Rejected because the delivered picture is rasterized by
  drawing the composed SVG into a canvas, where `foreignObject` is blocked or renders
  empty in Chromium — the exported image would have lost its numbers.
- **Keep the zoom buttons and add the pinch on top.** Rejected on the user's own
  instruction: the row was the thing being removed, not the thing being supplemented.
- **Let a `point` mark's ring stay, and just shrink it.** Tried first: it still covers
  the coordinate it names, and at any radius small enough not to hide the spot it was
  too small to see. The pin solves both at once.
- **Clamp a badge to the figure only when it would be entirely outside.** Rejected as
  too permissive: half a disc hanging over the edge is unreadable, so the rule is that
  most of the disc has to be on the figure.
