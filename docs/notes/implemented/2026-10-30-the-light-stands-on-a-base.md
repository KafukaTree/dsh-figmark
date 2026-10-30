# Note: 元素标注脚下加一层同色淡底，只有成片的元素才加

Status: implemented

## Problem

An element mark lit its element with a coloured halo and nothing else. On a plot the
reader had marked 红色的底 the halo traced the axes and the face stayed white: the
sentence in the list said "this should be red", the picture said "outline". A halo says
*where*; the reader was asking *what* — the area itself. On the real test figure
(`annotation-test.svg`, 283×211 pt) the red mark on the plot face and the blue one on the
legend both read as two glows with no fill.

## Decision

**A lit element that covers enough of the figure also gets a faint wash of the mark's own
colour over its own area.** The halo stays; the wash is `rgba(<mark colour>, .12)` and is
drawn inside the element as its last child, so it lies over the element's own opaque paint
(an axes face is white, and a wash under it would be invisible).

The gate is area: an element gets a wash only when its bounding box is at least
`WASH_SHARE = .25` of the figure's. Measured on the test figure, regions and artists are not
close: the figure 100%, `patch_1` 100%, `axes_1` 90.4%, the axes face 61.2%, the legend
3.8%, a curve 0.0%. So a legend, a label or a curve keeps its author colours and only a
region is tinted — the reader's "红色底" tints the plot, not the data drawn on it.

Two placements, because an element that is a container draws its children and an element
that is a leaf draws nothing: a container takes the wash as its last child; a leaf takes it
as its next sibling (`after`), which is the same stacking one level out and the same user
units — and *only* when the leaf has no `transform`, since its box is in its own units while
its parent's are not, and a tint in the wrong place is worse than no tint.

Re-lighting therefore has to look in both places (`washIn`), or a leaf would collect one
`<rect>` per pointer move.

## Alternatives considered

- **Fill instead of a wash.** Changed the figure's own colours far more than the reader had
  asked for, and made dark figures unreadable under a light tint. A `.12` wash keeps the
  underlying luminance.
- **Wash as the first child.** Invisible: the axes face and the figure sheet are opaque and
  painted after it.
- **Wash every lit element.** A legend got a rectangle of colour that had nothing to do with
  what it marks, and a curve's box tinted a band across the whole figure.
- **Wash as an `outline`/`filter`.** No way to keep it inside the element's own box, and it
  would stain the neighbouring artists.
