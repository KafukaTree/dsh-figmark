# The number goes inside the pin, and the numbers' controls go away

## What the reader asked for

Three things, all about the numbers on the picture:

> 然后我觉得单点的评论，做成这种比较好看一些，然后123是默认有的，你要改掉图标

> 然后其他的箭头和形状，默认图中不要有123

> 然后把那个滑动条和开关给去掉比较好

with a picture of a **solid orange map pin with a white 1 inside its head**, and then

> 总目标换成这种

with a picture of a target with an arrow in it.

The old shape was a thin teardrop drawn in outline with a dot in its middle, and the
number was a separate white disc parked near it — and *every* mark got one of those
discs, so a figure with three arrows wore three numbered stickers of the same weight,
scattered wherever the placement search could find room. A size slider and a
show/hide tick were there to soften that.

## One marker that carries its own digit

A map pin is the shape that means "exactly here", and it is the one mark kind with a
body: a filled teardrop whose point sits on the coordinate and whose head is wide
enough to hold a two-digit number. So:

- The pin is **filled with the mark's own colour**, and the number is drawn **white**
  on that fill. The reader's picture is not visible through the head, which is what
  makes the digit readable over dense line work — the same reason the badge discs
  were white before.
- The path is a teardrop, not a rounded square with a tail: `M tip Q shoulder` down
  each side into an arc across the head. The two curves are what make the sides bow
  in at the shoulders instead of running straight, and they are the difference between
  a map pin and a flag.
- `POINT_RADIUS` went 6 → **10** and the head sits `POINT_RADIUS × 2.4` above the tip.
  The proportion is the one that leaves the digit optically centred; at the old size
  an 11px number filled the head edge to edge.
- The head does **not** grow with the number any more, because the number no longer
  changes size — `pinHeadRadius` and its growth rule are gone with the slider.

## No number beside a stroke mark

`src/client/badges.ts` is deleted. Its whole job was to find a spot near a stroke mark
for a numbered disc, score candidate positions against the marks already on the figure,
and keep the discs from piling up on each other. With the numbers living inside the
pins, nothing calls it: an arrow keeps its colour and its shape, and the *list* still
numbers every mark so the reader and the agent can say "the third one". The figure
only repeats what it can say cleanly.

That removes `badgePlacements`, `badgeSvg`, `BadgeLook`, `candidateCentres`, `costOf`
and the collision search with it — about 300 lines, and the only place in the plugin
that had to reason about whether a number would cover something important.

## The style panel is a colour again

The slider and the tick are gone, and with them:
`BADGE_SCALE_MIN/MAX/DEFAULT`, `clampBadgeScale`, `isBadgeScale`, `BadgeStyle`,
`badgeStyleOf`, `DEFAULT_BADGE_STYLE`, and the `badgeScale`/`badgesHidden` fields on
the document. The `badgeStyle`/`onBadgeStyleChange` props, the `badgeStyleOf`
injection on the PDF body, four locale keys and the `.da-numbers` rules went too.

The style fold now holds the colour swatches and nothing else — which is what it was
for. **A document written by the previous build still opens**: `readMark` ignores
fields it does not know, and a resolver that fails on `kind: 'text'` was already the
rule (see the note of 2026-10-21).

## The overall goal wears a target

`NoteIcon` — a page with two lines — is what the *per-mark* detail card uses, and it
was also heading the overall-goal card. Two different records should not wear the same
mark. The goal now wears `GoalIcon`: a target twice-ringed with an arrow coming into
it from the top right. At 16px that is one circle pair, one shaft and two barbs —
anything finer reads as a smudge.

## Alternatives considered

### Keep the old teardrop and only put the number in it

Rejected: the old shape was drawn in *outline* with a transparent middle, so there was
nothing for a white digit to sit on. Making it solid is what makes the digit legible,
and a solid teardrop with a point is a map pin.

### A round marker instead of a teardrop

Rejected: a circle centred on the coordinate covers the very pixel it claims. The point
is the precision the mark asserts.

### Keep the head growing with the digit so any size fits

Rejected: the size is no longer a choice. Growing the head for a number that cannot
change size would size the marker to a constant.

### Keep the badged discs for stroke marks

Rejected by the reader directly: 其他的箭头和形状，默认图中不要有123. They were also the
reason the placement search existed — remove the discs and the search has no caller.

### Keep the slider but default it small

Rejected: a control whose only job is to make its own output tolerable is a control
that should be deleted, not tuned.

### Keep `badgesHidden` in the document for older readers

Rejected: nothing reads it once the discs are gone, and a stored field nothing reads is
a promise to a future version nobody asked for. Old documents still open; they simply
lose the number size they recorded.

### Turn the goal's icon into a flag or a checklist

Rejected: the record is a destination, not a plan — 目标 is what the figure should
become. A target with an arrow already means that in every icon set the reader has seen.

## Follow-up: one popover at a time, a flatter drop, a drop for the tool

After using the build the reader reported three things:

> 点击目标弹出框，接着点击清单之后目标框没有消失，而是与新的清单框叠放了，然后颜色也是一样，
> 颜色甚至还没有点击空白部分框框自动收回；然后水滴的样子需要改进，可以变得扁一些，
> 然后右侧的底部的也要做成水滴的logo

### Three booleans became one state

`styleOpen`, `goalOpen` and `listOpen` were independent, so opening the list while the
goal card was up simply drew the second card over the first — both hang off the same
strip, so each covered the other's close button, and the reader had to press the strip
button first to get back to a state where the visible cross worked. The style fold had
the same problem one level down, and it was the one that would not close on a blank
press at all: the outside-press effect returned early unless a *record* was open.

They are now `openPanel: 'style' | 'goal' | 'list' | null`. Opening one closes whatever
was open (pressing the one already showing closes it, so each button still toggles),
and the outside-press effect keys on `openPanel === null` rather than on the record
flags — which is what makes a press on the figure fold the colour swatches too.

### The drop got flatter

`PIN_LIFT` went 2.4 → **1.6** half-widths, with the shoulders moved out to 0.88 and the
belly to 0.6. A drop taller than it is wide reads as a flag on a pole: it covers the
line work above the point it names and stops looking like the thing a map puts on a
place. At 1.6 the head is roughly as tall as it is wide and the tail is short.

### The tool button wears the drop

The point tool's button used to be a vertical stick with a dot on top — a symbol *for*
a pin, drawn in a set whose other five glyphs are all line drawings of the thing they
place. It is now the drop itself, filled, with a circular hole where the number goes:
`fill-rule="evenodd"` cuts the hole out of the same path, so the dark bar shows
through it rather than a white disc sitting on the icon. The mark on the figure keeps
its white **number** — the hole is a logo device, not a promise about the mark.

### Alternatives considered

**A cross on the cards' own corner instead of making them exclusive.** Rejected: the
reader's complaint was not that a card could not be closed, it was that two were open.
Exclusivity is the smaller rule and it also removes the state where the top card hides
the lower one's only way out.

**A modal scrim for the style panel.** Rejected: a scrim over the figure is heavier
than the problem — the swatches are three clicks and a colour, and dimming the picture
to change a stroke colour is a modal for a menu.

**Keep the style panel open across tool changes, since picking a colour is a
preference.** Rejected: opening upwards from the bar, it sits over the corner the next
stroke starts in; the reader asked for it to fold when the tool is picked up.

**Circle the drop's hole with a separate `<circle>` in a contrasting colour instead of
a subpath.** Rejected: a white circle on a dark bar is a second colour to keep in sync,
and on the light theme it would have to be the bar's dark colour instead — evenodd
needs no colour at all.

**Make the on-figure pin's head a ring rather than a filled disc.** Rejected: the
number has to read over dense line work. A ring would put the figure's own lines
through the digit.

## Follow-up: the click that follows a drag

> 放置组件之后要自动弹出详细说明的框框

It did — up to the browser's own event order. A drag that ends with the pointer over
the surface is followed by a `click` on that surface, and the surface reads a click on
itself as "the reader pressed the background", so it cleared the selection. The
selection the drawing gesture had just made was therefore dropped in the frame after it
was made, taking the detail card with it. In a debugger the card opened and vanished;
in jsdom it never vanished, because the test helper dispatched the three pointer events
and no click.

`Canvas` now keeps `drew`, set where a mark is added and consumed by that trailing
click. It is cleared at the start of every gesture, so a real press on the background
still clears the selection — the rule is that a click only counts as a press on the
background if it did not arrive as the tail of a gesture that put something on it. A
pan already had the same guard (`panned`); this is its sibling.

The test helper now dispatches the click too, which is what makes the difference
observable at all.

### Alternatives considered

**Select the mark on `pointerup` and let the click clear it, then re-select.** Rejected:
two state writes and a visible flicker, to arrive where one guard arrives silently.

**Stop the click reaching the surface with `stopPropagation` on pointerup.** Rejected:
suppressing an event the browser has not sent yet cannot be done, and cancelling the
click elsewhere would also cancel the pan guard's only signal.

**Only open the card when the click has passed.** Rejected: the card would then lag the
gesture by a frame, and a drag that ends off the surface never gets a click at all.
