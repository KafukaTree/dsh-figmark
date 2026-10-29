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

Asked whether the element's missing number was the second problem, the reader drew the
line:

> 我的意思是除了地标的123在图上显示，其他的都没必要在图上标出123

The picture carries digits for *places* — the pins — and for nothing else. A shape is
found by its own outline; a 1 beside an arrow is lettering the figure never needed.

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

**A number on the picture is a place-marker's job.** Only a pin wears one: its filled
head has room for the digit, and it is what a reader looks for when the list says
"the second point". Every other kind is found by its own outline, so the discs that
stroke marks used to wear — and the badge this batch first added for the element mark —
are gone. `badgeGeometry` and the `Badge` component went with them; `markSvg` in the
export no longer draws a disc either. The pins still count inside their kind, which for
pins is the same as counting points in the document, and the message still names every
mark by kind and number (`箭头1`, `元素1`) because that is the list's own index.

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

- **Give every mark a number on the picture (what this batch first built).** Element
  marks got a disc inside their box and stroke marks kept the one beside them, so a
  circled 3 always had something to point at. The reader does not want that: the figure
  is their own drawing, and a digit beside every arrow is lettering that is read once
  and covered the line work ever after. A number belongs where the mark *is* a place.
- **Number by kind but keep one running count in the list panel.** The list would then
  disagree with both the message and the picture. One function feeds all of them.
- **Print the element text but truncate it with an ellipsis.** The first 30 characters
  of a run-together axes dump are still tick values; the name is in the id.
- **Drop the whole anchor when it covers the figure, including for `element`.** An
  element mark's anchor *is* the mark — its selector is how the light is found again —
  so it is the one kind that keeps it.
- **Keep the element badge and drop only the stroke marks'.** The element mark's whole
  point is a name, so a disc sounds right — but it sits on the very curve it names, and
  the reader's rule is about the picture, not the kind: pins carry digits, shapes do not.

- **Keep eight handles for arrows and just hide the turn grip.** Four of the eight are
  still corners of a rectangle the arrow never draws, and "resize" a line has no meaning.
- **Let the strip reach the exact edge instead of 8px short.** A strip whose own edge
  lands on the panel's edge reads as clipped; `STRIP_EDGE` is the same 8px the vertical
  bound already keeps, now applied on both sides the strip can hang from.
