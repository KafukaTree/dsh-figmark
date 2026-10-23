# 2026-10-23 — Size follows the figure, the rail appears when it has a subject, and paper grows for marks that leave it

## Problem

Three complaints arrived on one screenshot, and each turned out to be the same
mistake in a different place: a drawn thing was measured in CSS pixels when what
the reader sees is its size *relative to the figure*.

1. **A stroke's weight did not follow the figure.** The pen was a fixed 2.5 CSS
   pixels, so on a 300px thumbnail it read as a heavy marker and on a 4000px scan
   as a hairline. Dragging the weight rail to the top did not fix the second case —
   "even at the thickest it is still thin" — because the rail multiplied a number
   that was already wrong for that figure. The same default made a point pin tiny
   on a large figure: "the pin is so small that the agent may not see it".
2. **The rail appeared when it had nothing to size.** It showed while `select` was
   armed and nothing was selected, which is exactly when there is no next stroke to
   size — "if I have not placed or clicked anything, it should not be there". It
   also could not be dragged: the knob was a `span` sitting on top of the hidden
   `<input type="range">`, so it swallowed every pointer down that would have
   started the drag. Only clicking a spot on the bar worked, which is what "it can
   jump to a position but not be dragged" describes.
3. **A comment pill had a scrollbar and stuck to the edge.** `.da-comment` was a
   fixed-height box with `overflow-y: auto`, so a two-line sentence produced a grey
   scrollbar inside a control that is meant to read as a single line growing
   downwards. And the placement arithmetic clamped the pill to the panel but never
   compared the room above against the room below, so a pin near the bottom edge got
   a pill pinned over itself.
4. **A mark drawn past the figure was cropped.** The review image was exactly the
   figure's size, so a box around the axis label a plot clips — or any mark reaching
   into the margin — was cut off in the picture the agent receives.

Two smaller ones rode along: the pill lagged behind a mark being dragged (the
gesture lives inside `Canvas`, so nothing outside it knew where the mark was
mid-drag), and the rail was 6×132px, which the reader called too small.

## Decision

**One size multiple, derived from the figure, used by everything drawn.**
`src/client/scale.ts` exports `figureUnit(width, height)`: the figure's longer edge
over `REFERENCE_EDGE = 1200`, held between `MIN_UNIT = 0.75` and `MAX_UNIT = 3`. A
stroke, a pin, its number and the arrow head are all multiplied by it, as is the
hit area — a 3px-wide mark with a 5px hit area would be a mark you cannot grab.

The long edge is measured rather than the area because that is what the eye judges
a stroke against: a tall thin panel gets bolder marks for the same reason a wide one
does. The floor exists because a 300px figure would otherwise get 0.6px strokes,
which no export resolves; the ceiling because 20000px × 1/1200 would be a 40px
stroke, which reads as a highlighter rather than a line.

`Canvas` derives the multiple from its own `width`/`height` rather than taking it as
a prop, so the pen, the marks and the hit areas cannot disagree — the caller has no
way to forget it. `composeReviewSvg` derives it from the layer, and
`annotatePdf` takes it on `PageAnnotateInput` (the PDF chunk cannot import the entry
bundle, so it crosses as data).

**The rail appears only when it has a subject.** `shownWeight` is null when nothing
is selected and no drawing tool is armed; otherwise it is the selected mark's weight,
or the pen's. The knob became `pointer-events: none` so the input underneath takes
the drag, and the whole rail is a rotated `<input type="range">` — the native control
gives dragging, keyboard and accessibility for free. It grew to 7×200px, widening to
30px on hover, with a tapered `clip-path` track that is invisible at rest (the
reference the reader sent shows a thin bar with the fill and knob appearing on hover).

**Paper is the union of the figure and the marks.** `src/client/plot.ts` exports
`plotBounds(width, height, marks, unit)`: the figure's box unioned with each mark's
drawn outline (`markOutline`, which already accounts for stroke width, arrow barbs
and rotation), padded by `PLOT_MARGIN = 12` on **each side that actually grew**. A
figure whose marks stay inside it gets exactly its own box back, so nothing about
the ordinary case changes. `composeReviewSvg` draws the white sheet at the paper's
size and shifts the content by `-paper.x, -paper.y`; `reviewSize` exports the same
size so `rasterizePng` is not called with the figure's size and the growing marks
cropped away.

On screen the same idea is a `.da-paper` wrapper around the figure: the surface is
the paper's size, the figure sits at `left: -paper.x, top: -paper.y`, and the overlay
is the paper's size with its marks translated by `-origin`. The whole paper is scaled
by one transform rather than each part scaling itself, because at a fractional factor
a separately-scaled figure and overlay drift apart by a pixel — exactly where a mark
drawn on a line should be.

**The pill grows and the placement compares both sides.** `.da-comment` lost its
fixed height and scrollbar (`field-sizing: content`, `max-height: min(180px, 42vh)`,
scrollbar hidden) so a long sentence wraps and grows instead of scrolling.
`placeCard` now picks below, above, or the roomier side, instead of clamping to the
top when below does not fit. The pill is placed by its own measured size
(`measuredSize`), not a one-line constant, so a three-line comment is not pushed off
the bottom.

**The pill follows the hand.** `Canvas` gained `onLiveEdit`, reporting the mark as it
currently looks on every frame of a drag and null on release. The body keeps that in
`liveMark` and the anchoring effect prefers it over the stored mark, so the pill
tracks the drag without writing anything into the marks list — a gesture is not
committed until it is released, and making every frame an undoable edit would be
wrong.

## Alternatives considered

- **Scale by area instead of the long edge.** Rejected: a 200×2400 panel has a small
  area but a long edge, and the eye judges its strokes against the long edge. Area
  scaling would thin the marks on exactly the figures where they need to be bold.
- **Scale the stroke only, leave the pin fixed.** Rejected: the pin has the same
  problem as the stroke — it is a shape on the figure, not a piece of chrome — and
  the reader said so ("the pin is so small the agent may not see it").
- **Pass the multiple in from the caller.** Rejected: every call site would have to
  remember it, and a forgotten one is a pen that disagrees with the marks it draws.
  Each component derives it from the size it is given.
- **Make the pin's size a second field on the mark.** Rejected: one rail with one
  subject ("how big is this mark") is simpler than two controls, and a mark is never
  both a stroke and a pin.
- **Keep the rail always visible and disable it.** Rejected: the complaint was that
  it costs room ("the whole UI is a bit small"), so a disabled rail is still a thing
  on the figure that does nothing.
- **Make the rail a custom slider on pointer events.** Rejected: the native range
  input already gives dragging, arrow keys, Home/End and the platform's focus ring;
  the bug was one CSS layer swallowing the pointer, not the control.
- **Grow the paper only for the export, not on screen.** Rejected: the reader would
  then box a region they cannot see on screen and only find out what they selected
  after delivery. The overlay has to cover the same paper the export does.
- **Clamp a mark to the figure instead of growing the paper.** Rejected: that
  silently changes what the reader drew. The point of drawing past the edge is to
  say something about the region past the edge.
- **Pad all four sides always.** Rejected: it would shrink every ordinary figure in
  its own panel for no reason. Only a side that grew gets margin.
- **Put the paper's offset on each element instead of translating the group.** Rejected:
  the export already translate-wraps the content, and doing it once keeps the figure
  and the marks in one coordinate space; the overlay uses `origin` for the same reason.
- **Clamp the pill by measuring the marks instead of the pill.** Rejected: the pill's
  height depends on the prose in it, which only the DOM knows. `measuredSize` reads
  the laid-out box and falls back to the estimate on the first frame.
- **Move the pill after the drag ends only.** Rejected: that is the behaviour the
  reader complained about ("the comment follows too slowly"); the point of an anchor
  is that it points at where the thing *is*.
- **Write the live geometry into the marks list each frame.** Rejected: it would make
  every frame an undo step, and the marks would then autosave mid-gesture.

## Consequences

- `src/client/scale.ts` and `src/client/plot.ts` are new; both are pure and tested
  directly (`tests/scale.spec.ts`, `tests/plot.spec.ts`).
- The PDF chunk takes `figureUnit` as an injected prop (`PdfBodyInjected.figureUnit`),
  because importing `scale.ts` from both the entry bundle and the chunk would split
  it into a shared chunk the browser factory cannot load — the same constraint that
  `createAutosave`, `annotationSignature` and `badgeStyleOf` already live under.
- `strokeWidthOf`, `arrowBarbs`, `pinGeometry` and friends all take an optional
  `unit`, defaulting to 1, so tests and callers that do not care are unchanged.
- A figure with marks inside it produces byte-identical review markup to before apart
  from the wrapping `<g transform="translate(0 0)">`.
- The rail is absent from the DOM (not disabled) when it has no subject, which is
  what `tests/annotator-body.spec.tsx` now asserts in both directions.
- `DETAIL_WIDTH`/`DETAIL_HEIGHT` in `popover.ts` were stale (252/196 against a 300px
  pill); they are now 300/48 and are only the pre-measurement estimate.

## Follow-up: the number inside the pin, the pill at the edge, and the rail's finish

Three things the reader found after using the first cut.

**The number did not grow with the pin.** The rail multiplies a pin's radius, but the
numeral inside it was drawn at `PIN_FONT_SIZE * unit` — the figure's multiple only. So
the larger the pin got, the smaller its number looked, which is the opposite of the
point: the rail was introduced because the pin was too small to see. `pinFontSizeOf`
now carries the mark's weight as well, so the numeral keeps the same share of the head
at every size. `Canvas` and the export both call it, so the picture the agent receives
and the one on screen cannot disagree about it.

**The pill could put its buttons past the edge.** Placement measured
`detailRef.current`, the textarea — but the textarea gives up width to the two hand-off
buttons as soon as there is something to send. A pill against the right edge therefore
had its buttons placed inside the panel and its buttons drawn outside it. The pill is
now measured whole (`pillRef`, a separate ref on the pill element) and carries
`max-width: calc(100% - 16px)` so it can never be wider than the panel it lives in,
however long the comment is.

**The rail read as a black bar with cut corners.** Two separate faults. The track was
shaded from `--dsw-alias-border-l3/l4`, which resolve near-black in the dark palette, so
the wedge was a solid dark shape; it is now an svg gradient of translucent shadow
(`rgba(20,40,80,.05)` at the neck to `.2` at the shoulders), which reads as a groove in
both palettes. And the profile was a `clip-path` polygon, which cannot have rounded
ends — the straight flanks and square cap are what made it look like a cut-out blade.
The track is now one svg path on an 18×100 grid, eased along the flanks and closed with
an arc wider than the shoulders, stretched vertically. The chosen part is the same path
filled twice, with the second fill clipped to the chosen height, so the blue follows the
wedge instead of being a bar sliding beside it.

The knob was also overshooting at the top: `bottom: calc(fraction * 100% - 5.5px)`
measured the rail, so at the heaviest weight the knob's box hung past the rail's top
edge. It now travels `calc(12px + fraction * (100% - 24px - knob))` — the track's own
inset — so its centre stops exactly at the top of the track.

### Alternatives considered (follow-up)

- **Scale the numeral with the figure but not the weight.** Rejected: that is the bug —
  the pin's head grows with the weight, so a fixed numeral shrinks relative to it.
- **Place the pill by the textarea and add the buttons' width as a constant.** Rejected:
  the constant would be wrong the moment the buttons are hidden (empty comment) or the
  pill wraps to a second line. Measuring the laid-out element needs no estimate.
- **Shrink the buttons instead of widening the measurement.** Rejected: the buttons were
  fine; the placement was wrong. Fixing the symptom would leave a 30px target on a
  300px pill.
- **Cap the pill's width with `overflow: hidden`.** Rejected: that hides the buttons
  rather than moving them, which is the same failure the reader reported.
- **Keep the polygon and round it with a bigger `border-radius`.** Rejected:
  `border-radius` does not clip a `clip-path` polygon, so the corners stayed square.
- **Draw the track with a CSS gradient wedge (the previous attempt) and blur it.**
  Rejected: a blur would soften the shape but not give it a round end, and `filter:
  blur` on a 12px-wide element washes the colour out to grey it was already grey.
- **Make the fill a second wedge.** Rejected: a wedge scaled down to the chosen height
  is narrower than the track under it, so the blue reads as drifting off the track
  rather than filling it.
- **Use `useId` inline in the JSX.** Rejected on the first try: the id is read below the
  early returns for a figure that failed to load, so `useId` sat behind a conditional
  call and React threw "Rendered fewer hooks than expected". It is now declared with the
  other hooks at the top of the component.
