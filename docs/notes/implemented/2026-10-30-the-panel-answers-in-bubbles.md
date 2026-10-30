# Note: 面板的答复改成可以点叉的气泡，会叠起来，会自己走

Status: implemented

## Problem

Every transient answer the panel gave — 已写入对话框草稿, 已发送给智能体, 已复制 — was one
line of text in the layout under the figure, coloured green for success. The reader:

> 那个"已写入对话框草稿（未发送），标注已从面板清空。" 这种绿色文字直接出现不是很好，可以弹出一个气泡，可以点叉的那种；如果是多个出现，然后要叠起来一条条出现，会好很多，有一个基本的动效

Three separate faults in one line. It was in the layout, so it pushed the figure down
when it appeared and pulled it back when it went — the picture moved because a sentence
about the picture arrived. It was a single slot, so a second answer overwrote the first,
and a failure could be erased by a success half a second later, which is how a save
error disappeared before it was read. And its tone was the colour of the words: green
text for "saved" is the machine speaking, not the panel answering.

## Decision

**A bubble, over the figure, that leaves on its own and can be dismissed.** The host is
absolutely positioned above the bar (`bottom: 60px`, `z-index: 10`), takes no pointer
events of its own so the figure underneath stays reachable, and lays out
`column-reverse` with the stack kept newest-first — a new bubble arrives at the bottom,
nearest the bar, and pushes the older ones up. The stack holds three; a fourth click is
a reader who wants to see the last thing, not a log.

- **The tone is a 6px dot, not the colour of the sentence.** The words stay the panel's
  own text colour; a small green, red or neutral dot beside them says how it went.
- **`ok` and `info` go after 4.2s.** Long enough to read a dozen characters while
  looking at the picture, short enough that the figure is clear by the time the reader's
  eye is back on it.
- **`error` stays until dismissed.** A failure is the one kind of news the reader has to
  act on; a bubble that leaves first has said nothing. It is also the reason the stack
  exists: a failure can sit there while a later save succeeds, and only a successful
  write retires it (`dropTone('error')`), not the next unrelated answer.
- **Entry is 160ms of rising 6px and fading in** (`cubic-bezier(.2,.8,.3,1)`), and it is
  switched off under `prefers-reduced-motion: reduce`. There is no exit animation: a
  bubble that has left has said what it had to say, and animating it out only delays the
  figure being clear.
- **Conditions stay in the layout.** 「无法读取这个图」「文件已改过」「标注文件读不了」are not
  flashes; they are states that remain true until something changes, so they keep the
  old inline line above the figure — and its error colour, because a condition is not
  quieter than a wait.

The bubble keeps `className="da-status da-toast"` so anything that looked a status line
up still finds one, and the same stack serves the Markdown body's editor (copy, send),
where 「已复制全部差异」had the same green text and the same single slot.

- **It never covers a control.** The rail and the bar draw at 12, above the bubble:
  the colour fold and the records are the bar's children and cannot climb out of its
  stacking context, so raising the bar is the only way to keep them clickable. A bubble
  hidden behind an open card is still there when the card closes; a swatch hidden
  behind a bubble looks like a broken panel.

## Alternatives considered

- **One toast that replaces the previous one.** That is the old line with a shadow: the
  failure still gets erased by the success behind it.
- **A toast per action, never expiring.** The stack then fills with history and the
  reader has to dismiss three bubbles to see the figure.
- **Auto-dismissing failures too.** The failure is often followed by the reader doing
  something else, and it is exactly then that they need to know the last write did not
  land.
- **A log drawer under the bar.** Keeps everything, but makes the reader open something
  to learn whether the click worked, which is what the line was already asking.
- **Coloured text on a tinted bubble.** Tone as the sentence's colour again, just louder;
  a dot says the same thing without making the panel's words carry state.
