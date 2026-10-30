# Note: 选中的颜色用中性灰圈，蓝色只留给标记本身

Status: implemented

## Problem

The palette's colour row said which colour the next stroke would take by ringing the
chosen swatch in the panel's accent blue. With four swatches — red, blue, orange,
green — that put a blue ring around exactly one of them, and the reader saw it as a
statement about colour rather than about choice:

> 这个颜色的选择，不应该是蓝色圈，和我讨论怎么保持风格

The ring was doing two jobs at once in the one row where colour is the subject. A blue
ring around the blue swatch says "blue" and looks like the swatch is selected twice; a
blue ring around the red swatch says "blue" where it meant "this one", and the eye read
it as a second, competing colour chip. Either way the accent was speaking about hue in a
place whose whole content is hue.

## Decision

**The chosen swatch is marked in the panel's own grey, and colour stays only in the
dot.** The rest ring is a one-pixel hairline (`box-shadow: 0 0 0 1px`); the chosen one
adds a 3px ring in `--dsw-alias-label-tertiary` (`#a1a1aa` on light, the theme's grey on
dark), so the difference is weight, not hue: a grey ring around a colour chip reads as a
frame around a sample, which is what it is. The swatch's own fill is then the only
coloured thing in the row.

Keyboard focus keeps `--da-accent` — it is the browser-level "you are here", not a claim
about the sample, and it only appears while the reader is tabbing. The accent rule for
the panel is unchanged everywhere else: marks, focus rings, the weight slider.

## Alternatives considered

- **Keep the accent ring but make it thinner or offset.** Still blue, still ambiguous
  around the blue swatch — the problem is the hue, not the thickness.
- **A checkmark or a dot badge on the chosen swatch.** Unambiguous, but it puts a glyph
  on top of the colour it is supposed to leave alone, and at 16px a tick over a chip is
  most of the chip.
- **Scale the chosen swatch up.** Works on a touch bar; in a 4-up row it shifts the
  neighbours and reads as hover.
- **A grey ring plus a heavier inner shadow.** Two signals for one fact, and the inner
  shadow darkens the swatch's own colour, which is the one thing that must stay true.
- **No ring at all; only the tool button's swatch dot shows the choice.** The row is
  opened precisely to change the colour, so the row has to answer without the reader
  closing it first.
