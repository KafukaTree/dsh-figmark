# Note: 按名字数标记，让贴着右边缘的条能贴到边

Status: implemented

## Problem

A reader marked up a figure with five marks — an arrow, a point, an element, a second
point and a freehand stroke — and could not reconcile the message with the picture:

> 12345 的标注很不规范，比如这个元素标记是阴影，没有标记3

The list counted the whole file with circled digits (①②③④⑤), while the picture
numbered pins by the same global count and *not* element marks at all. A reader looking
only at the figure had no "3" to find. The element mark was just a light on the curve,
so nothing on the picture said which list line it belonged to.

The same message quoted this, twice:

> id=figure_1，元素文字「2 4 6 8 Time (s) 0 20 40 60 80 Normalized intensity (%) Decay
> curves tau=1.0 tau」，选择器 #figure_1

An anchor that names the whole picture, and prints the picture's own labels as the
element's "text": on a matplotlib SVG, an axes group's `textContent` is every tick
value, both axis titles and the legend run together. It was two thirds of the line and
located nothing the id had not.

Selecting an arrow drew a rectangle of eight resize grips plus a turn grip — a control
frame for a shape that has no width:

> 这个箭头的元素框不太对，现在是矩形，其实只需要很少的点，不占那么多的锚点

And the floating tool palette could not be parked against the right edge:

> 这里的右边的浮动工具栏，不能贴近最右侧，现在已经是极限了

The clamp measured every dragged strip by its own body — `1 - width/panel` — which is
right for a strip hanging *down and to the right* of its point and wrong for one past
the middle, where the flip makes it hang *up and to the left*. A 40px palette parked on
the right stopped 40px short of the right edge and could go no further.

## Decision

**Marks are numbered inside their kind.** `markOrdinals` (`src/shared/annotation.ts`)
counts each kind separately, and one function feeds the message, the live overlay, the
exported picture, the document list and the PDF page pictures. A figure with two arrows
and one box reads `箭头1 (…)`, `箭头2 (…)`, `矩形1 (…)`; the shape says which kind the
mark is, and the digit says which one of that kind. `describeMark` now takes the mark's
ordinal and writes the name itself (`箭头1`, `矩形1`, `椭圆1`, `单点1 位于 (x,y)`,
`手绘线1`, `元素1`), so the sentence starts with exactly the words and digit the
picture carries.

**Element marks wear their number too.** `badgeGeometry` returns a disc for `element`
instead of `undefined`, placed *inside* the element's own top-left corner: the light
paints no outline to stand beside, and an element's box may be the figure's own edge, so
a disc outside the paper would be a disc nobody sees. The one kind of mark whose point
is a name is no longer the one kind a reader cannot find by number.

**An anchor keeps only the names that still say something.** Element text longer than
30 characters is a passage, not a name, and is dropped (the id or selector already
locates the element); a selector that is exactly `#id` is dropped as the same name
twice; and an anchor whose box covers essentially the whole figure is dropped for every
kind but `element` — it names the picture the header already named. `PAPER_COVERAGE`
moved from `pick.ts` to `shared/annotation.ts` so the picker and the message ask that
question with one number.

**An arrow's control frame is its two ends.** `endHandles` / `endAt` / `movedEnd`
(`src/client/handles.ts`) place one circular grip on the tail and one on the tip;
dragging a grip moves that end and leaves the other one fixed. No box frame and no turn
grip: an arrow is a line, and rotation is no longer offered for it (a stored rotation is
still honoured when drawing).

The PDF chunk shares no runtime module with the entry bundle (§2.7), so the counter
enters it as an injected prop (`markOrdinals` on `PdfBodyInjected`) and `numberingOf`
takes it as an argument — importing `shared/annotation` from inside the chunk split it
into a sibling chunk with a synchronous `require`, which the browser factory cannot
resolve.

**A dragged strip is clamped by the edge it hangs from.** `draggedSpot` uses the room
its body needs before the middle and only the edge's own inset past it (`1 - 8/panel`),
so a palette dragged right reaches 8px from the right edge — and, the same way, a strip
dragged down reaches 8px from the bottom.

## Alternatives considered

- **Keep global numbering and add a badge for element marks.** That was the smaller
  change, and it leaves ①②③④⑤ as the language: a circled 3 on the picture and a ③ in
  the message would agree, but a reader still has to count arrows to find "the second
  arrow" among five marks. Numbering inside the kind is what the reader asked for, and
  it makes the digit short enough for a 9px pin head.
- **Number by kind but keep one running count in the list panel.** The list would then
  disagree with both the message and the picture. One function feeds all of them.
- **Print the element text but truncate it with an ellipsis.** The first 30 characters
  of a run-together axes dump are still tick values; the name is in the id.
- **Drop the whole anchor when it covers the figure, including for `element`.** An
  element mark's anchor *is* the mark — its selector is how the light is found again —
  so it is the one kind that keeps it.
- **Draw the element's number outside its box, like a stroke's.** A full-width element's
  box is the figure's edge, and its disc would land on the paper margin where the export
  clips it. Inside the corner is on the element itself, which is what the number names.
- **Keep eight handles for arrows and just hide the turn grip.** Four of the eight are
  still corners of a rectangle the arrow never draws, and "resize" a line has no meaning.
- **Let the strip reach the exact edge instead of 8px short.** A strip whose own edge
  lands on the panel's edge reads as clipped; `STRIP_EDGE` is the same 8px the vertical
  bound already keeps, now applied on both sides the strip can hang from.
