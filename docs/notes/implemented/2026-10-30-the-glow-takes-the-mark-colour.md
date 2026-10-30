# Note: 元素光晕跟着标注的颜色走，不再统一是蓝色

Status: implemented

## Problem

The element mark lights the element it is about — a soft `drop-shadow` halo over the
exact `<g>` inside the figure — so a review can point at one curve without drawing on
top of it. The halo was the panel's accent blue for every mark, whatever colour the
reader had drawn it in. On a test figure with a red element mark and a blue one, the
reader marked both up:

> 元素1 (66,38)-(353,203)，批注：这个应该是红色的底
> 元素2 (66,94)-(353,225)，批注：蓝色的光晕

The picture was saying "element" twice in one colour. Two marks on one figure were
indistinguishable by the thing the reader had chosen, and the blue glow on the blue
element read as double strength while the same glow on the red element contradicted the
red mark sitting in the list beside it.

## Decision

**The glow is the mark's own colour.** A mark's `color` is what the reader picked for
that stroke, so that is what its element is lit in: red mark → red halo, blue → blue. The
pale inner ring (`drop-shadow(0 0 1.4px rgba(255,255,255,.95))`) stays in every case,
because it is what keeps the halo legible over a dark figure regardless of hue; the
selected mark gets the same colour at a larger radius rather than a different colour.

The colour rides on the element as `data-da-spot-color="<rrggbb>"`, never as an inline
`style` attribute: `style` may be the figure author's, and over-writing it would break
the picture. `spotRule(colours)` writes one stylesheet with a rule per colour seen so
far, and `ensureSpotlight` appends to it — a document that has already been taught four
colours is not re-taught on every pointer move. The same transform is applied to the
exported SVG, so the picture handed to the agent is lit in the colour the reader
approved, not in the panel's.

A mark whose colour cannot be read (`chartreuse`, an eight-digit hex) falls back to ink
(`rgba(63,63,70,.9)`): inventing a hue would put a colour into the figure that the
reader never chose, and dropping the light would lose the element the review is about.

## Alternatives considered

- **Keep one accent glow for every element mark.** What it was, and what the reader
  marked as wrong twice.
- **A neutral ink glow for every mark.** Honest about not knowing a colour, but it makes
  the glow look like a shadow the figure had all along, and the mark's colour — already
  in the list — would have no echo on the picture.
- **The colour ring the reader draws around the element.** Framing changes the picture's
  geometry and covers the neighbouring ink; a halo sits outside the strokes.
- **Inline `style="filter:..."` on the element.** Simplest to write, but it collides
  with the figure's own `style` and cannot express "selected" without rewriting it on
  every click.
