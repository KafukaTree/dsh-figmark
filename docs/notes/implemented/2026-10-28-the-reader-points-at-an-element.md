# The reader points at an element

## What the reader said

「因为SVG和HTML这样的，它都是每个矢量组件组成的，它和PNG、JPG都不一样。然后我就想SVG和HTML能不能做一下？做成选定组件标注的形式。然后也能进行一些绘制标注，就是我想把那个鼠标变成能够选择其中所有组件的一个东西，然后评论。」

The figures this panel reads are of two kinds, and it had only ever served one. A
PNG is a picture: the only thing you can say about it is "here, on this spot", so a
mark is a shape. An SVG or an HTML document is not a picture — it is a tree of
elements, each one a thing with a name. A reader looking at a matplotlib axes and
saying "this tick label is wrong" is naming an element, and the panel made them
circle it with an ellipse and hope the agent guessed which of the nineteen artists
under that ellipse they meant.

## What changed

**A mark can be an element.** `MarkKind` gained `element`, and its geometry is the
element's bounding box's two opposite corners — so everything that already worked on
a box keeps working untouched: `markOutline`, `markBounds`, the number badge's
placement, `composeReviewSvg`, the PDF's native annotation (drawn as `/Square`), the
plot's crop margin. Only the drawing and the editing differ, and they differ by
subtraction: an element mark has no handles and cannot be moved, because moving it
would claim an element that is not where it says.

**Picking asks the browser, and only then measures.** `anchorAtPoint` used to walk
every element's box and take the smallest that contained the point. Measured against
a real figure, that is wrong often enough to be a bug: a thin diagonal line has a
box that spans most of the figure, so a click twenty pixels away from the line landed
on the line while the white background under the pointer — a far better answer — was
rejected for covering the figure. The new `pickStack` asks `elementsFromPoint` first,
which is the browser saying what is actually painted under a point, and keeps the box
walk only as the fallback for engines that cannot answer (jsdom, and any ink under a
`pointer-events: none` ancestor). The probe grid (`PROBES`, a 5×5 spiral of six pixels)
exists because a one-pixel target is not clickable: the reader aims at a tick label,
not at a hairline.

**`element` is the answer to "this thing", `point` is the answer to "this spot".**
They share a geometry and nothing else, which is why they are two kinds rather than
one kind with a flag.

**The path is shared.** `dom-path.ts` holds `selectorFor` (rooted at `body`, for a
rendered document) and `selectorWithin` (rooted at the `<svg>` element, for an inlined
figure) on one walk, because a mark on the same element has to be spelled the same
way whichever surface it was made on.

## What the measurements changed

Three things were built, measured in a real Chromium against a real matplotlib figure
and a real Graphviz diagram, and then removed.

**A temporary `pointer-events: all` on the figure.** The obvious trick for making
hollow shapes clickable, and it does work for that: an unfilled ellipse is otherwise
transparent to the pointer. But it also makes every element answer for its own paint,
so the 1–2px ticks and the axis spine start winning hits that belonged to the group
around them. Across 6006 sampled points on the matplotlib figure it changed 1262
answers, and most of the changes were worse. Removed; `coversInterior` now asks
`isPointInFill` instead, which gets the hollow-shape answer without lending the
pointer to anything else. Measured on the same figure, `pointer-events` was needed for
0 of 48 artists.

**A whole-figure coverage test as the paper filter for SVG.** A background rectangle
covers the figure, so "covers ≥98% of the figure" rejected it — and also rejected any
`<line>` that happens to be diagonal. The filter only exists so that clicking the
paper does not mark the paper; an SVG figure's own `<svg>` element already answers
that, so the SVG side has no coverage test at all and the HTML side keeps it, where the
document's background `<div>` really does need rejecting.

**`patch_N` as an answer.** The browser is right that a matplotlib figure's white
sheet is under every point on the sheet, so naming it is not a misreading — but it is
the wrong answer, and the reader gets "the paper" for clicking on blank paper. It is
also the same class of name as the hashes: `patch_1` is the figure's sheet, `patch_2`
the axes' background, and both are minted per render. The fix is one rule in
`isStableId`, which `namingAncestor` already consults: a generated id is walked past,
and the walk lands on `figure_1` or `axes_1` — the object the source actually calls
`fig` and `ax`. Verified in the browser: a click on blank paper inside the plot now
answers `axes_1`, one outside it answers `figure_1`, and neither answers `patch_N`.

**`e.pageX`-style coordinates.** `elementsFromPoint` takes local coordinates and
`getBoundingClientRect` returns them, while a pointer event carries client
coordinates; converting in each place produced a factor-of-scale bug the moment
the figure was drawn at a scale. Both conversions now live in the one function that
needs them.

## What is not done

Selecting a parent or a child of the picked element (`↑`/`↓`) — matplotlib nests
deeply, and there is no way yet to say "the axis, not this tick". Small elements are
not promoted to a named ancestor either. And the element is still identified, not
edited: this says *which* element, and changing it is still a change to the source.

## Alternatives considered

**One kind with an `anchor` and a flag.** Rejected: the two behave differently in five
places (drawing, handles, PDF subtype, review image, editing), and every one of them
would become a conditional on a boolean. A separate kind makes each place a `switch`
case the compiler checks.

**Reuse `point`.** An element mark is where the pointer was, plus an anchor. It has
the same bounding box. Rejected for the same reason: a point is a dot the reader may
drag anywhere, and an element mark that could be dragged away from its element would
be a lie.

**`@medv/finder` / `@quello/core` for the path.** Both are MIT and both are small, and
`@quello/core`'s `selector.ts` is 2KB of well-chosen heuristics. Rejected after
measuring: `@quello/core` accepts `m4750a7a074` as a usable id, which is exactly the
matplotlib hash that changes every render. The part that matters — telling a
scientist's stable id (`line2d_10`) from a minted one (`m4750a7a074`) — is not a
heuristic either library has, and it is ten lines. `@medv/finder` has it backwards:
its `wordLike` test rejects every name containing a digit, which would throw away
`line2d_1`.

**Waiting a frame after toggling `pointer-events`.** Measured: within one task, set,
read, restore works. The probe also showed the restore must be synchronous, so the
whole thing is in a `try/finally` — but it is no longer used at all.

**Class-based selectors.** Matplotlib emits no classes at all on its artists; the
`<g id="line2d_10">` is the name. A path that preferred classes would be both longer
and lossier here.
