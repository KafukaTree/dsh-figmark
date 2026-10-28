# The list leads to its mark

## What the reader said

The list was a table of contents with no going. A row named a sentence, and the
reader still had to find the page it belonged to and the mark it described before
they could write anything. Two other things were wrong with it as a piece of UI:
the shape of a mark was spelled out in two characters of text wedged under the
sentence — `框选` — competing with the sentence for the little width the row has,
and every row carried the word `删除` in its corner, which reads as another thing
to press rather than as the way to get rid of one row.

## What changed

**A row is now the way there.** `onRevealMark` is the seat: a page body cannot turn
a document's page, because the page number belongs to the owner, so the row reports
the mark and the owner turns. `PdfBody.revealMark` sets the selection *and* the page
in one motion. Both orders matter:

- selection first, turn second — the turn remounts the page body, so a selection
  that landed after the remount would open the comment pill only on a second render,
  and the reader would watch the page arrive with nothing on it;
- and the turn is skipped for a mark with no `page`, because clamping an absent
  page to the floor would send the reader to page one.

**The shape is the tool's glyph.** `ToolIcon` already draws the five shapes for the
rail, so the row reuses it at 14px instead of printing the word. The word survives
as the glyph's `title`, which is where a word belongs. `TOOL_COPY` still feeds that
title.

**The second line keeps only what the shape cannot say.** The page — `第 4 页` — and
the anchor name. A mark's page is real information now: the list is the document's,
so its rows routinely name pages the reader is not looking at.

**Delete is a glyph and a hover.** `✕` at 20px, `opacity: 0` until the row is
hovered or selected, with `:focus-visible` forcing it visible so the keyboard path
never has an invisible target. `aria-label` and `title` keep it announced as 删除.

## Two smaller things this needed

`t` in `AnnotatorBody` took no variables, so `第 {page} 页` could not be formatted.
`resolveTranslate` already accepted a `vars` argument — the local wrapper was simply
not passing it through. One line, and the copy can interpolate.

`ToolIcon` is a plain function returning a `ReactNode`, not a component, so it is
called as `ToolIcon(mark.kind)` rather than rendered as `<ToolIcon kind={...} />`.
JSX bought a type error and no benefit.

## What is not done

The row's right-click menu is unchanged: the list still has no per-row menu. And the
pill still opens from the selection rather than being anchored by the number badge —
the badge does not move, because it is drawn from the mark's geometry, which is why
"lock the icon's position" needed no code: a badge's position is already a function
of the mark, not of a drag.

## Follow-up: the number and the shape were two things, not one

Removing the word `框选` from the row and printing the tool's glyph there instead did
not fix what the reader saw. A screenshot of the result made the reason obvious: a
solid block of colour with a white numeral, and beside it a thin grey outline, are
two labels for one mark drawn at two different weights. Nothing about them said they
described the same thing — the row read as three unrelated items with the sentence
as a fourth.

The fix is not to match their colours. Matching still leaves two objects. The number
and the glyph are facts about *one* mark — which mark, and what shape it is — so they
are one chip now: `.da-mark-badge`, the mark's colour, the numeral then the glyph
inside it, at `height: 20px` so a column of rows still lines up.

Five options were rendered and compared before choosing: keep the grey glyph,
same-colour outline at 20px, same-colour outline on a tinted disc, badge = number +
glyph, and badge = glyph + number. The last two are the ones that read as one object;
number-first won because the number is what the row is *ordered* by and what the
canvas pins by.

The glyph keeps `fill:none` except for the point tool, which draws its pin filled on
purpose — a text glyph at 11px has to be solid to be legible, so its own `fill:
currentColor` on the path wins over the container's `fill:none`, which is exactly the
behaviour the rail already relies on.

## Second follow-up: a list is a list

The chip was worse than what it replaced, and the reader said so. Reading their own
words back is what the mistake was: they had asked for **轻线条** — thin strokes — and
had objected to the original blue block as *too big a slab of colour*. A filled chip
is a bigger slab of colour. The two moves were the same mistake twice: I kept
answering "make these two things agree with each other" when the brief was "this row
should not be heavy at all."

What actually wanted to happen:

- **No fill anywhere.** The number is a numeral in the mark's colour at 11px/600,
  right-aligned in a 15px box so a column of rows lines up under `1` or under `12`.
  The shape beside it is a 13px line at 1.55px stroke — the same weight the tools
  themselves wear. Two light strokes, one colour, no containers.
- **The page goes to the end of the row**, not onto a second line. The page is where
  the mark *is*, not what it says, so it belongs where a table of contents puts a
  page number. This also deletes the ragged two-fact second line the anchor name used
  to share; the anchor name keeps the second line to itself when a mark has one.

The general lesson, written down because it cost the reader two rounds: when a layout
feels wrong, check the brief for what it asked the element to *be*, not just whether
its parts are consistent with each other. Consistent-but-heavy is still heavy.

## Third follow-up: one type scale, not five sizes

The page at the end of the row was too big. It had been set at 11px/500 in the
previous round on the reasoning that "weight demotes a fact, not size" — which is
true of a heading, and wrong here: the row has no hierarchy for the page to sit
below, so a 11px page beside an 11px number read as a second number rather than as
a smaller fact. It is 10px/400 now, and the words shrank with it: `第 21 页` → `21 页`.
Five characters at the row's end is a lot of ink for a locator; two characters of
number plus the unit is what the width of the row wanted.

The whole card got the same treatment, because "which size is this" should be
answerable by counting steps:

| what | size | weight |
| --- | --- | --- |
| card title, the sentence | 12px | 650 / 400 |
| the number, the glyph | 11px | 600 |
| quiet actions (清空, ✕) | 11px | — |
| page, anchor name, count | 10px | 400 |

Three steps, 10 / 11 / 12. Anything that is *about* a row and not part of it is on
the bottom step; the sentence and the title are on the top one; the two marks that
identify a row are in between.

The glyph came down with the number: 15px → 14px box, 13px → 12px drawing, 1.55 →
1.6px stroke so it stays the same optical weight at the smaller size.

## Fourth follow-up: the number is an index, not a legend

The numerals were painted in each mark's own colour, which made every row's number a
different colour: red `1`, blue `2`, amber `3`, green `4`. Read down the column and
the numbers spell nothing — they are ordinals. Colour on an ordinal is a legend the
reader has to decode, and there is no legend: the colour is *already* carried by the
shape on the same row.

So the number is neutral now (`--dsw-alias-label-secondary`) and the glyph keeps the
mark's colour. Colour still says which of the four tools drew the mark — it just says
it once per row instead of twice, and the one place it appears is the place that
depicts the thing it describes.

Three options were rendered: neutral number + coloured glyph, both neutral, and both
tinted down. Both-neutral lost the tool colour the list exists to show; both-tinted
was just the first option with less contrast. The first is what shipped.

## Alternatives considered

- **Keep the word `框选` and make it smaller.** The word was not too large, it was
  the wrong kind of thing: two characters of prose inside a row whose only sentence
  is the comment. Shrinking it would have kept the row reading as two sentences, one
  of which is a category label. The tool's glyph says the same thing in a shape the
  reader has already pressed.
- **Give the row a right-click menu with delete in it.** Delete was already a
  separate failure — the word at the row's corner read as a second action — and
  moving a destructive action one level down into a menu makes it harder to reach
  without making it safer. The glyph plus hover keeps it one gesture from a row the
  reader is already pointing at.
- **Give the number and the glyph separate coloured containers, so they "agree".**
  Rendered and rejected: matching two objects' colours leaves two objects. The reader
  had asked for 轻线条 — thin strokes — and a filled chip on every row is a heavier
  version of the block they had objected to in the first place.
- **Paint the number in the mark's colour** (as distinct from the glyph). Kept for a
  round, then removed: a column of red `1`, blue `2`, amber `3`, green `4` reads as a
  legend with nothing to decode. Colour says which tool drew the mark, and the glyph
  is the thing that depicts it, so the colour belongs there and only there.
- **Let the page stay on the second line with the anchor name.** Two short facts
  stacked under every sentence made a ragged column, and the page is not part of what
  the row says — it is where the mark is, which is what a table of contents puts at
  the end of its line. It moved to the row's end and the anchor name kept the second
  line to itself.
- **Five type sizes for five kinds of text in the card.** Collapsed to three steps,
  10 / 11 / 12: anything *about* a row and not part of it (page, anchor, count) is on
  the bottom, the title and the sentence on the top, the two identifying marks between.
