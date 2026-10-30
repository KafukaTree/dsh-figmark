# Note: 气泡学会一边说一边打字，送出时会转圈、会画勾、会画叉

Status: implemented

## Problem

The bubbles added in `2026-10-30-the-panel-answers-in-bubbles.md` arrived as whole
sentences and left as whole sentences. They said the right words, but they said them the
way a label changes, not the way a panel answers. The reader who asked for them supplied
a reference component and then said, twice:

> 继续，你要核对一下代码，现在我觉得这个没有很还原就是说，包括重叠渐变的部分
> 然后这个气泡卡片卡片的上下高度可以减小一些；还有这个气泡卡片的光影程度可以减弱一点，不然黑色不是特别均匀（但是吧要有一些变化就是说）

Auditing against that reference turned up five defects, four of them invisible in a
still:

- **The card's box was not the box the layout used.** Without `box-sizing: border-box`
  the 228px send card measured 252px, and the 42/45 heights in `toast-model.ts` were a
  guess about a box that actually measured 43 and 46. Every card therefore overlapped its
  neighbour by 13px instead of the stated 12, and the seam was visible in a stack of four.
- **The success ring and the check did not draw; they were simply there.** The dash
  pattern lived in the SVG attributes while the animation only moved the offset, so both
  shapes started complete and the two animations animated nothing.
- **The shake threw the card out of the column.** `@keyframes` animated `transform`, which
  is the same property that carries the card's place in the stack; the inline transform
  lost, and a shaking card jumped to `y = 0` for half a second.
- **The black was not even.** The gradient ran 60 → 34 in lightness inside a 45px card and
  the outer shadow was `0 8px 26px rgba(0,0,0,.18)`, so each card sat in its own pool of
  darkness and a stack read as four stripes.
- **One sentence did not fit.** 「已存入草稿其余标注保留」 needed 147px of text room and had
  146, so the one message that says work was kept was the one message that got an
  ellipsis.

## Decision

Rebuild the bubble on the reference's rhythm, and make the stylesheet and the arithmetic
agree about the box.

- **Typed, not pasted.** A note streams at ~9ms per character with a 1.5px caret, holds
  3.5s, then fades out with `blur(2px)` over 500ms. The pause is what makes it a reply:
  the eye catches the first character, and the sentence is read while it is being written.
- **A send has a grammar.** Destination glyph (the bar's own paper plane, so the card and
  the button are one icon set) inside a 22px slot; an arc that spins at 0.9s while the
  work is out; on success the arc closes in 220ms, the glyph fades, and a white check
  draws in behind it; on failure a white ring and an `×` pop in, the card shakes once, and
  the dismiss button becomes a resend button in the same 20px slot. Never green, never
  red: the outcome is a shape, not a colour.
- **The card's height is stated, not measured.** `height: 38px` for a note and `41px`
  (plus `228px` wide) for a send, with `box-sizing: border-box`; the constants in
  `toast-model.ts` are the same two numbers, so `top += height - 12` lands on the pixel.
  jsdom reports zero for every box, so measuring at runtime was never an option.
- **The shake moves the card without moving it.** The keyframes animate `translate`, which
  composes with the inline `transform: translateY(...)` instead of replacing it.
- **The dash offset is the resting state.** `stroke-dasharray`/`stroke-dashoffset` live in
  CSS with the animation, so the ring is invisible until it is drawn and the check arrives
  like a pen stroke rather than a stamp.
- **Less light, still some.** The gradient is 52 → 36 and the shadow is
  `0 6px 18px rgba(0,0,0,.13)`: the black reads as one surface with a direction, which is
  what "要有一些变化" asks for, without the four-stripe look.

## Alternatives considered

- **Measure the card and lay the stack out from real heights.** Exact, and impossible in
  the test environment; it would also make the stack's transition depend on layout the
  moment a card is added.
- **One width for every card.** The card is a sentence, not a dialog: a two-word note at
  228px is mostly empty bubble. Only the send card is fixed, because its icon slot and its
  four states must not resize it mid-animation.
- **Fixing the ellipsis by shortening the copy.** The words were dictated; a 1px gap
  between glyphs is the cheaper place to find the room.
- **Colour for the outcomes (green ring, red cross).** The reader's own instruction when
  the first version turned text green: a state that is painted is a state the panel is
  shouting.
