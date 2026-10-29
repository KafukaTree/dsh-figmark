# Note: 评论框与工具栏之间留出一条缝，武装的那个工具别再发蓝

Status: implemented

## Problem

The reader parked the tool palette on the right of the panel, selected a box, and the
comment pill opened below it. In the screenshot the two floating surfaces sat about a
dozen pixels apart — close enough to read as one control — and the armed tool was a
solid blue disc, the only saturated blue on a panel whose whole subject is the figure:

> 现在把右边这个的图标给变成灰色底的，不要有蓝色底，然后这个评论区也要和这个右侧的工具栏隔开

Two complaints, one root: the palette and the pill are both floating over the figure and
nothing in the code knew they were neighbours. The pill's placement (`placeCard`) clamps
against the panel's own edges only, so a palette parked on the right is invisible to it;
and the armed tool borrowed `--da-accent`, the same blue the marks on the figure use, for
a control that is not a mark.

## Decision

**The pill keeps a gutter from the palette, wherever the palette is.** The palette is
measured (`obstacleBox` → its box in the panel's coordinates) and handed to `placeCard`
as an obstacle. A card whose vertical band crosses the strip's is pushed to the far side
of it — left when the strip is docked right of the panel's middle, right when it is
docked left — and never closer than `PALETTE_GAP` (24px). The number is wider than the
10px a card keeps from its mark because a strip is not a mark: the palette wears a 26px
shadow, and a card two pixels clear of its box still reads as attached to it. A strip
with no measured box is not an obstacle, so a panel that has not laid the palette out yet
does not move anything. The placement effect now also depends on the palette's parked
spot, because dragging the palette changes the box it has to keep clear of.

**The chrome wears grey, not the accent.** `rgba(255,255,255,.22)` over the dark strip
says "this one" without competing with the figure: the palette is the reader's controls,
and the blue in this panel belongs to the marks. The same rule then covered the rest of
the default chrome the reader pointed at: the bar's pressed dock buttons, the count badge
on the list button and the "a goal is written" dot are neutral too — a grey pressed chip,
a light badge with dark digits, a white dot. Then the reader circled the pill's two
hand-offs — the paper plane blue, the speech bubble grey — and asked for one background:
so the send-to-agent button lost its fill and both are the same neutral chip. Nothing in
the panel wears the accent now except the marks on the figure, which is where it means
something.

## Alternatives considered

- **Move the pill above or below the palette instead of sideways.** The palette is
  usually taller than the pill and parked against an edge, so "above" and "below" are
  the same overlap with more steps; sideways is the axis with room.
- **Clamp the pill against the panel's right edge minus the palette's width.** That only
  holds while the palette is docked at the right and is a fraction of the panel wide;
  the reader can park it anywhere, and the box is measured, so use the box.
- **Keep the blue and make it lighter.** The complaint is not the shade, it is that a
  control wore the marks' colour at all. Grey does the same job with no colour meaning.
- **Shrink the palette's shadow so a 10px gap reads as a gap.** The shadow is what makes
  the strip legible over line work; a gutter is cheaper than a weaker strip.
