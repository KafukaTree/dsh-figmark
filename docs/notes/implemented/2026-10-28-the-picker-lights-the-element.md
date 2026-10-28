# The picker lights the element, not a box around it

A reader hovering with the element picker armed used to see four corner brackets around
the element's bounding box. It was the same bracket an element mark drew, so the picker
and the mark spoke one language — but the language was wrong. A box says *where*, and on
a curve, a tick, a legend entry or a label the box is a rectangle the figure never draws.
Over a diagonal curve the box covers half the plot, and the reader cannot tell which of
the things inside it a click would take.

The highlight is now the element itself: a soft blue glow that follows the curve's line,
the glyphs' outlines, the patch's own frame. `src/client/spotlight.ts` puts a class on
the element and gives that class two `drop-shadow` filters — a pale ring that keeps the
blue legible over dark line work, then the blue itself.

That rule was written for the picker first and then became the *only* thing an element
mark draws. Both surfaces now say "this element" the same way, and so does the picture
handed to the agent.

## Why a drop shadow

`filter: drop-shadow` follows the alpha channel of whatever the element paints. One rule
therefore lights every kind of artist a figure can hold — a stroked path with
`fill: none`, filled text, a filled patch, and a `<g>` that contains a mix of them —
without the plugin knowing any of their geometry. Measured on the matplotlib test figure:
a curve glows along its stroke, a label glows around each glyph, a legend glows around
the whole block.

Two alternatives were built and rejected in a browser, not on paper:

- **Stroking the element** (`stroke: #4c8dff; stroke-width: 3`) painted over the
  artist's own colour. That colour is the one thing the reader is looking at, and on a
  three-curve plot every lit curve turned the same blue.
- **A translucent fill** (`fill: rgba(76,141,255,.22)`) does nothing at all to a path
  with `fill: none`, which is every line matplotlib draws.

The first attempt at the glow failed for a different reason, worth recording: the filter
was applied to the wrong element in the harness. Applying it to a `<g>` works — the
shadow wraps each child's paint — but the prototype also re-parsed the figure per cell
and lit a `<g>` while rendering it under a transformed viewBox, so the glow appeared far
from where the element was drawn. The lesson is not "filters do not work on groups"; it
is "measure the effect on the picture you are actually shipping".

## Where the element is found again

The picker names an element by the `selector` its anchor already carries — the same
locator an element mark writes into the annotation file. Turning that name back into an
element is `elementAt`, and it is the same call for both surfaces:

- an **inline SVG** lives in the panel's own document, so the search root is the host
  `div` the markup was injected into, and the panel's stylesheet already has the rule;
- a **rendered document** lives inside its frame under a policy that forbids scripts and
  keeps the panel's stylesheet out, so `ensureSpotlight` writes the rule into the figure's
  own `<head>` first, and the search root is `contentDocument`.

A selector that no longer parses, or that matches nothing after the figure was reloaded,
is not an error: `elementAt` answers `undefined` and the picker simply carries no light.

## The mark and the picker are the same light

`moveSpotlight(previous, next)` takes the class off whatever dropped out of the set and
puts it on what is in it now, so at any moment the correct elements are lit and nothing
else is. Two things are in that set, and they are different kinds of statement:

- the element the **picker** is offering, which comes and goes with the pointer;
- every element an **element mark** names, which stays lit for as long as the mark
  exists.

The second is the point. An element mark has no stroke of its own any more — the light
*is* the mark. So the selected mark is not framed either: it is lit harder
(`.da-spot-selected`, 5px instead of 3px). A dashed frame round the box was what this
used to draw, and it had exactly the failing the light was brought in to fix: on a curve
the frame is a rectangle the figure never drew, so the marked thing and the framed
region disagreed. Selection is already said by the open comment pill and the highlighted
list row; the picture only has to say *brighter*.

It uses a class rather than writing a `style`, because an element's `style` attribute may
belong to the figure's author and editing it would mean putting it back byte for byte.

The picker's light goes out when it is put away and when the body unmounts. A mark's light
goes out when the mark does. An element left lit with no mark and no pointer on it is a
promise nothing keeps, and a class left on markup about to be replaced is a leak the next
figure inherits.

An element mark draws nothing on the overlay, so it keeps an invisible `rect` over the
element's box purely as a hit area — without one it would be dead to the pointer.

## The delivered picture is lit the same way

The first version of this note argued the other way: the export renderer "does not run
CSS filters", so a placed mark kept its brackets. That was wrong, and it was the reason
the reader saw a glow on the canvas and the agent received a rectangle.

The truth is measurable in a browser. Serialize the figure with a `filter: drop-shadow`
rule in a `<style>` element, hand it to an `<img>`, draw it on a canvas: the shadow is
there. On the real export output the difference is 24,353 changed pixels out of 180,000
and a peak channel delta of 71 — not a rounding artefact. A selector in the rule also
matches through the export's nested `svg > g > svg` structure, which was measured the
same way.

So `lightMarkup(markup, selectors)` writes the class and the rule into the copy of the
figure that `composeReviewSvg` places under the marks. The reader's file is never
touched: the markup handed in is already the sanitized copy that was inlined into the
panel, and the result is a string that only becomes the exported image.

## Where the drawing moved

`Canvas` no longer draws the highlight. It knows *which* element a click would take but
not how to light it — only the body knows whether it is looking at the panel's document
or a frame — so the canvas reports the name through `onHover` and the body lights the
element. `renderHover` and its bracket path are gone.

`markPathData`'s `element` case is gone too: it returns `undefined`. `markOutline` stays,
because that box is the hit area and the number's home. The overlay keeps drawing the
dashed frame for a selected **point**, which is a different thing — a pin has an extent
of its own and nothing to light.

## Alternatives considered

- **Draw the element's outline in the overlay instead of filtering the element.** The
  overlay is a separate coordinate space and would need the element's painted geometry
  as a path. `getBBox` gives a box (what we had); `getPathData` does not exist; sampling
  the alpha channel would need a canvas and would be wrong for text. Re-measuring the
  element was already there and is exactly the box this change removes.
- **`outline` on the element.** An outline follows the border box, not the paint, so a
  diagonal curve would get the same rectangle as before.
- **`box-shadow`.** Same box, same problem.
- **`mix-blend-mode` or an overlay `<rect>` tinted behind the element.** Cannot be
  scoped to one element's shape, and a tint behind a `<g>` shows through its holes.
- **SVG filters declared once in `<defs>` and referenced by `url(#…)`.** Would have to be
  injected into every figure's markup, and a figure that already has a `defs` element
  would need its ids checked for collisions — for a two-shadow effect on one element, a
  CSS rule is less machinery.
- **Keep the brackets and add the glow.** Two languages for one promise, and the box
  would still cover half the plot.
