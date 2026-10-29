# A pin is a place, not a stroke

## What the reader said

Three things, from a figure of three decay curves:

> 还有svg注释的这几个，下面那行为什么是 2468等等

> 然后还有问题，就是默认的地标画的有点太大了

and, answering what "太大" was not the only problem:

> 尖端应该在下面，当时我拖动到画面外（画面上面），这个尖突然就反过来了，很异常

The screenshot showed the marker as a solid red teardrop a third of the plot's height,
standing *below* the curve it pointed at, with its point at the top — upside down.

## One cause for two complaints

`pinRadiusOf` was `POINT_RADIUS × weight × unit`, and the flip test was
`tipY - lift - radius >= 0` — both derived from that radius. So the two complaints had
one cause: the reader had drawn an arrow at weight 4, the rail remembered it, and the
next pin came out at four times its size *and* four times as eager to turn over. On
that figure (`unit` 0.47) the flip threshold moved from `tipY < 12` to `tipY < 49` —
17% of the figure's height — so a pin anywhere in the top sixth of the plot landed
upside down. Dragging one up the figure made it snap over mid-gesture with nothing
else changing.

The weight was used here on purpose, and the reason was written down: the rail already
meant "how big this mark is", and a stroke and a pin are never the same mark, so one
number would never have to mean two things. That reasoning has a hole. The rail is not
a per-mark control — it is *the* rail, it keeps its position between marks, and it is
what the reader last set it to. So a number chosen for a fat arrow decided the size of
the next place-marker, which is a decision about a different kind of thing. A rail that
answers "how thick should this line be" cannot also answer "how big should a place be"
without the second answer being an accident of the first.

## The pin now answers to the figure alone

`pinRadiusOf(unit)` and `pinFontSizeOf(unit)`: the figure's unit, nothing else. A pin
is the same marker on every figure of the same size, whatever the reader last drew.

The weight field is gone from new point marks too. It drew nothing after the change, and
a number in the file that draws nothing is a number a later reader will try to honour.
An older mark that still carries one is drawn exactly like a new one — the field is
simply not read — so no migration is needed and the two compare equal in the sidecar
apart from that dead key.

**The rail stands down on a point mark.** This is the same rule the element marks
already follow, and it is what `isStrokeKind` now means: a `point` is a pin and an
`element` is a light on the figure's own artwork, and neither paints a line. A rail that
stands open on a mark it cannot size is a control that lies about what it does. `forPin`
and the `pinSize` copy went with it — the label had only ever existed to explain a rail
that no longer appears.

## The pin stopped turning over

The marker now always stands the same way up: point on the coordinate, body above. It
used to flip near the top edge so its head would stay inside the picture.

Nothing needs that. The sheet is measured from the marks — `plotBounds` grows the paper
wherever a mark reaches past the figure — so a point near the top edge simply grows the
sheet upward and its head lands on paper that is now there. The figure is the part of
the sheet that has a picture on it, not a frame the drawing has to stay inside. That is
also why the flip was hard to reason about: it made the marker's *shape* depend on its
position, so the same mark meant something different after a drag that changed only
where it was.

The cost is honest: a pin at the very top edge adds paper above the figure, and the
picture is then taller than the artwork. That is visible, and it is the same thing a
mark drawn past any other edge already does.

## What the reader sees now

On the figure that started this (377 × 282 figure px, drawn 750 px wide), the marker is
9.4 figure px across — 18.8 px on screen, where it was 97 px. The head clears the
coordinate by 7.5 figure px instead of 30. And a pin at the top of the plot looks like
every other pin.
