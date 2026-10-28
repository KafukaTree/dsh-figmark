# The figure can be handed over from its own menu

## Problem

The two docking buttons at the bottom of the panel were the *only* way to hand
the figure over. They sit at the far end of the bar, they are the smallest
targets on the surface, and a reader who has just finished drawing is already
pointing at the figure with the right button down. The gesture and the action
were in different places.

Alongside that, the point tool's icon read as heavy: an outer ring nearly as
thick as the hole it enclosed (about 4.1 units of the 24-unit grid), at the size
the bar draws it (≈34px) an outer diameter of only ~11 units. It was legible but
it looked like a solid blob with a dot punched in it, not like the teardrop the
tool actually places on the figure.

The send button also wore the accent as a filled plate. On a bar where every
other control is a bare glyph, one filled square reads as "the" button — and the
two hand-offs are peers, not a primary action and its alternative.

## Decision

**The hand-off rows come first in the menu.** Above "open in default app",
above every copy row. The panel exists to take a figure and a set of marks and
put them in front of the agent; that is not one of six equal file operations, it
is the reason the menu has a figure in it. A reader who right-clicks a finished
figure has usually stopped drawing.

**They appear under the same condition as the dock's two buttons.** `!isPage &&
marks.length > 0 && busy === null`: nothing to hand over without marks, no
double-send while one is in flight, and a page body leaves sending to its owner
that holds every page's marks. Both entry points run the same `run('agent')` /
`run('composer')` code, so they cannot drift — a rule enforced in one place is a
rule that stays true in two.

**The pin icon is redrawn rather than scaled.** Scaling the old path would have
made a bigger ring of the same thickness — still heavy. The new path is larger
(outer radius 7.9 against 6.2, hole 5.62 against 3.5) *and* thinner (ring 2.28
against 4.1): the ring is what the eye reads as weight, so the outer edge moves
out while the stroke comes in. At 14px it is still a clean ring; at 34px it reads
as the teardrop.

**The send button loses its plate.** `da-dock-btn-primary` and its three sibling
rules are gone from the stylesheet, and the button wears the same `da-dock-btn`
class as the chat button beside it. Two peers, distinguished by their glyphs.

## Alternatives considered

- **Keep the buttons and skip the menu rows.** Rejected: the buttons stay for
  discoverability (a menu is a hidden surface), but hidden is exactly why the
  hand-off also belongs on the gesture the reader is already making.
- **Put the hand-off at the bottom of the menu, near the copy rows.** Rejected:
  menu position is a statement about importance. Opening a file in Preview is
  something you do *instead of* sending; the hand-off is the thing you do.
- **Show the rows disabled when there is nothing to send.** Rejected: a disabled
  row is a promise in grey. The panel's existing rule is that a row the reader
  cannot use is absent, not greyed — and this keeps the two entry points
  identical in what they offer.
- **Draw the pin as a stroked outline instead of an evenodd fill.** A stroke
  needs a stroke width that is right at exactly one zoom level; the evenodd fill
  has a rim whose thickness is a property of the geometry, so it looks the same at
  14px and at 88px. The tool draws a solid pin, so the icon is solid too.
- **Enlarge the pin by `transform: scale()`.** Same weight problem in a different
  wrapper, plus it would scale the stroke of the shared `svg` around it.
- **Keep the accent plate but soften it to a tint.** Still one filled control on
  a bar of bare glyphs; the asymmetry is the problem, not the saturation.

## Consequences

- The menu is now seven rows in its fullest form. Order:
  发送给智能体, 发送到对话框, 用默认应用打开, 在文件管理器中显示, 复制图片,
  复制相对地址, 复制绝对地址.
- `runMenu` had to move below `run`, because it now calls it. It already had to
  sit below `exportPng` for the picture row. Both are ordering constraints the
  type checker enforces (TS2448), which is the right place for them.
- The hand-off rows reuse the dock's status line (`sending` / `composing`), so
  the menu closes and the bar reports progress — no second progress channel.
- The pin's new geometry is expressed in the same 24-unit grid as the other five
  tools, so it still cannot drift from them.
