# Note: 标注清单按种类聚起来数，只有一条的那类不印序号

Status: implemented

## Problem

The reader annotated a test figure — three ellipses, one pen stroke, two pins, drawn in
that order with a break in the middle — and the list read:

```
1 ○   2 ○   1 〰   1 📍   2 📍   3 ○
```

> 我觉得这个标注清单的前面221123 这几个数字很奇怪，因为看起来比较乱，先和我探讨一下这个怎么显示的问题

Nothing was miscalculated: the numbers are per kind, because the message names marks that
way (椭圆2, 单点1) and the pins' digits on the picture have to be the same digits. But the
list printed them in the order the marks were drawn, so a count that is only meaningful
inside one kind restarted wherever the hand changed tool — 1, 2, then 1, then 1, 2, then
back to 3. Read down the column, that is a sequence with no rule; read as a name, each
number is correct. The list was showing names in an index's position.

## Decision

**The list is gathered by kind, and a kind with a single mark prints no number.** Rows
follow `MARK_KIND_ORDER` — the rail's own order, arrow → rect → ellipse → pen → point →
element — and keep the drawn order inside a kind, so the same six marks now read 1, 2, 3
then a pen with no number then 1, 2. The count restarts once per run instead of once per
change of hand, and each run belongs to one glyph.

The suppression is the half that makes the runs legible: a lone pen is not "the first
pen", it is the only one, and a `1` there interrupted a run of numbers to say nothing.

**The shape leads the row and the number rides its corner.** With the run numbering in
place the reader looked at the list again and said:

> 这种其实可以把那个图标放在前面的，然后数字放在图标的右下角，变小一点，这样会好看很多吧，然后图标靠左对齐

A 14px column of right-aligned 11px digits in front of every row was still reading as a
line number — the eye takes a digit at the start of a line as an index, before it reads
the sentence. So the glyph moved to the row's left edge, the digit became an 8px
footnote pinned to the glyph's bottom-right corner (`right:-5px`, `bottom:-3px`,
`position:absolute` over a `position:relative` glyph), and it is grey against the mark's
colour — the shape says what, the number only says which. The digit sits just outside
the glyph's ink rather than on top of it, so it needs no halo to be read over a circle,
a pin or a pen stroke. The rows' gutter went from 7px to 9px to hold a two-digit number
before it would touch the sentence.

Rows are gathered for display only — the document keeps the drawn order, which is what
the message and the picture's own numbering walk. `markRows` therefore returns `{ mark,
ordinal }` pairs rather than reordering the document.

## Alternatives considered

- **Drop numbers from the list entirely.** Cleanest column, but two ellipses then look
  identical in the list while the message still says 椭圆3 — the row loses the only
  handle the reader has for matching the two.
- **One running number for the whole list (1–6).** Tidy, but it is a third numbering: the
  picture would carry pin numbers 4 and 5, and one mark would have two names. The
  reader's earlier instruction was pins 1, 2, 3 on the figure.
- **Group rows under per-kind headings (「椭圆 3」「单点 2」).** Explicit, but four headings
  over six rows is more chrome than list, and the glyph column already says the kind.
- **Keep the drawn order and print the kind's name beside each number (「椭圆1」).** The
  number stops being a bare digit, but the row grows a word that repeats the glyph, and
  the sequence still bounces 1, 2, 1, 1, 2, 3 down the column.
- **Keep a numbered column to the left of the glyph.** This is what the first build did,
  and it is what the reader marked up: a digit in front of a line is an index by
  convention, and reserving its column made every row start with a number that half the
  rows did not have.
- **Put the number inside the glyph's centre or above it as a superscript.** The glyphs
  are 12px of stroke; a digit inside the circle or the pin's head lands on ink and needs
  a halo punched out of it. The corner is the one part of the box the drawings leave
  empty.
