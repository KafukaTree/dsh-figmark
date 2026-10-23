# A comment on the spot, and a pen weight beside it

## Problem

Two things about the panel got in the way of writing a sentence about a mark.

The first was the detail card. It carried a title (`这个元素的详细说明`), a chip naming
the mark's shape (`框选`), a `0/500` counter and a close button — four things that are
not the sentence, in a box large enough to cover the figure around the mark it was
about. The reader asked for the shape the reference draws: a blank rounded strip until
there is something to say, and then two hand-off buttons on its right edge. Nothing
else. The hand-off also had to be *about that one mark*: pressing the button beside a
comment sends that comment, not every mark on the figure.

The second was that stroke width was fixed. The reference has a weight control down the
left edge — a hairline until the pointer crosses it, then a track with a knob.

## Decision

The detail card becomes a pill with no head. It holds one field and, once that field
says something, the two hand-off buttons. The shape and the anchor are still in the
label list and in the message; they do not need to sit over the figure as well.

A mark gains a `weight` field: a multiple of the base stroke width, `0.5`–`4`, default
`1` and absent when default. It weighs the stroke, the arrow's barbs and the white halo
together, so a heavy arrow is the same arrow drawn with a heavier pen rather than a
longer one. A `point` mark carries no weight — its head is sized by the number inside it.

The rail is a rotated `<input type="range">` made transparent, with the visible rail
drawn in CSS behind it. That keeps dragging, arrow-key stepping and the accessible name
from the browser, and costs no pointer handling of our own.

## Alternatives considered

- **Keep the card, hide the chrome.** The title, chip and counter could have been
  hidden behind a hover. Rejected: the reader asked for them gone, and a card that is
  empty until hovered is a card that jumps every time the pointer crosses it.
- **Send every mark from the pill.** Simpler, and what the bar already does. Rejected:
  the button sits beside one comment, so it means that comment. The bar keeps the
  whole-figure hand-off.
- **A close button on the pill.** Rejected: clicking anywhere else already dismisses it,
  and the ✕ was one of the four things being removed.
- **Put the weight rail inside the tool palette.** Rejected: the reference keeps it
  apart, on the left edge, where a drawing tool puts its weight.
- **Store the weight per document rather than per mark.** Rejected: two boxes on the
  same figure often need different weights to read.
- **Scale the arrow head by the square root of the weight.** Rejected: the head has to
  keep its proportion to the shaft, or a heavy arrow looks like a lollipop.
- **Let the rail move the point mark's pin size.** Rejected: a pin is geometry, and its
  head already has to hold the number.
- **Write the weight into browser storage instead of the sidecar.** Rejected: it is a
  property of a mark, and a mark is what the agent reads. The *next* stroke's weight is
  a preference and does go to storage.
- **A hand-built knob with pointer events.** Rejected: the browser's own range already
  handles every pointer, key and screen reader, and the rail only has to look different.

## Consequences

- The pill is ~300px wide and one line tall, so it covers far less of the figure.
- `0/500` is gone; the field still stops at 500 characters in the message.
- A selected point mark hides the rail, because it has no stroke to weigh.
- The rail is a preference for the next stroke, and is remembered across reloads.
- Readers who had a weight set will see marks at that weight, including in the
  exported picture and in the PDF annotations.
