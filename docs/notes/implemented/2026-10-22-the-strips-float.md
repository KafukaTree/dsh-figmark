# The strips float, dark, and can be parked

## What the reader asked for

The tools were the last thing still nailed to a surface. A reader annotating a figure
in a narrow pane kept dragging the figure away from the tools and back, so:

> 我希望你在这里搞选择，箭头框选等等，就是那些基础的绘图元素都在这里，然后是悬浮的可以拖动的那种

> 一定要做成圆角的那种，然后黑底，白色的图标不需要文字

> 底部也做成那种黑底的圆角样式的吧，也是相对可拖动的

> 地标的那个点调整的好看一些

## Two strips, not one

There are now two floating objects over the figure, and they are the same kind of
thing on purpose:

- **The tool palette**, a vertical dark pill on the left. Six round white glyphs, a
  drag handle above them, no words — six glyphs in a column are read at a glance, and
  the word is still there as the tooltip and the accessible name.
- **The records bar**, a horizontal dark pill along the bottom. Style, the two record
  folds, undo/redo, and the hand-off.

They are separate because they get parked separately: a reader working on the top
left wants the palette out of the way but the hand-off where they left it, and a
single combined strip can only be in one place. Both carry the same drag handle, and
both remember where they were put.

The bar is anchored to the bottom edge and centred until it is moved — an anchored
default, so widening the pane keeps it centred rather than walking it sideways. Once
dragged, it is placed by fractions like the palette; past the middle of either axis it
is measured back from its far corner, so its box stays on the panel.

Fractions rather than pixels because the pane is the reader's to resize. A position
in pixels would walk off the edge when the pane narrows.

## Why dark

The figure sits on a white card in a near-white panel. A light strip had to be
outlined and shadowed to read as *above* the picture. A dark one reads as a control
by being a different material, and the white glyphs on it need no fill of their own —
which also sidesteps the class of bug that produced the black blocks earlier in this
same session (an `<svg>` with no `fill` paints black).

## The pin, redrawn

The old pin was a triangle on a stick: two straight sides meeting the head. The new
one bows each side inward with a single quadratic curve, which is the concave shoulder
a real map pin has. Two constants, `PIN_SHOULDER = 0.3` across and
`PIN_SHOULDER_LIFT = 0.55` along, because the shoulders are not symmetric — pulling
mostly sideways and only partway up is what gives the sweep rather than either a hard
cone or a bulging balloon.

The head still grows to hold its number (`pinHeadRadius`), and the tip still lands
exactly on the coordinate.

## A bug the change exposed

`.da-bar` with `left:50%` and no `width` had its shrink-to-fit width measured against
the remaining half of the panel, which squeezed the whole bar into a two-column stack
on the left. `width:max-content` is what makes a centred absolutely-positioned box
size itself by its contents rather than by the space to its right.

## Alternatives considered

- **One combined strip holding tools and records.** Rejected: they get parked on
  opposite sides of the figure in practice, and a strip containing both can only be
  in one place.
- **A light strip, matching the panel.** Rejected: it has to be outlined and shadowed
  to read as floating, and it disappears against the white figure card.
- **Words under the tool glyphs, as the bar had.** Rejected by the reader explicitly;
  the glyphs are unambiguous, and tooltips cover the first few uses.
- **Storing the parked positions in pixels.** Rejected: the pane is resizable, and a
  pixel position walks off the edge when it narrows.
- **Storing the positions in the annotation sidecar.** Rejected: where the reader
  likes their tools is a property of the reader, not of the figure — the same reason
  the colour and number style live in browser storage.
- **Anchoring the parked strips to the nearest edge instead of to fractions.**
  Rejected: a strip parked just past the middle would snap to the far edge and move
  itself a long way from where it was dropped.
- **Letting the whole strip be the drag handle.** Rejected: a drag starting on a tool
  tile must arm that tool, not move the strip.
- **Clamping the spot to the panel instead of allowing a fraction outside it.**
  Rejected: clamping happens on write, so a position dragged to the edge is preserved
  as the edge rather than quietly rewritten to something else.
- **Drawing the pin with a cubic per side.** Rejected: one quadratic and two constants
  is less to reason about and the shape is indistinguishable at this size.
- **Keeping the pin a triangle and only rounding its corners.** Rejected: the corners
  are not what reads as a balloon; the straight sides are.
