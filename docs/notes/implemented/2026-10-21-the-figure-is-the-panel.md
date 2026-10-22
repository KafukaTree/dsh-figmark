# The figure is the panel

## What the reader said

Read as one sentence, the whole complaint was about *weight*: the panel was a stack
of forms that happened to have a picture in it, and the picture — the only thing
being discussed — got the leftover space.

Four separate asks, in the reader's own words:

> 现在的画布有问题，因为这个图不能左右拖动、上下拖动…我一般会开大概这么一个比较瘦长的比例去批注，但是呢，它就会导致我这个图完全没法看…它上面的那种选择箭头、框选什么的，它可以变小一点吗？可以搞到一行里面去，变小一点。而且如果我选择某个元素的话，我不可以改变它的颜色，其实应该是可以改动的

> 左下角那个提示就不要了，删掉，有点碍眼。

> 而且发送到智能体给发送给对话框，就只有一个标识就行了。然后你鼠标移动上面，它会有一个悬浮的提示就行…而且它是永远在右下角两个地方。不随你这鼠标上下滚动而运动。

> 这个右侧这个面板的主体应该还是这个整幅图像，其他的都是一些相对于记录的一些层面…如果我放置一个箭头，然后它那个框框就在这个箭头旁边，悬浮出来这个元素的详细说明。然后这个清单的话，也是搞一个这种，点击我才出现这个清单，不然我不出现。

> 你可以看一下 Codex，它这下面做的这种小样式做的就很不错…完全不占整幅图的视觉，而且感觉很纯净…它移动到上面。是有一些像那种折叠的，可以展开的东西。

The reference for that last one is the pill that floats under a Codex diff: a row of
small round buttons that cost the content nothing and unfold only when asked.

## What changed

- **The figure owns the pane.** Everything that is a *record* moved into floating
  cards and the pill; nothing is stacked under the figure any more. The stage takes
  all the height that is left, and the surface sits centred in it on a paper card.
- **A drag on the table moves the table.** Under `select`, a press on empty surface
  now reports `onPan(dx, dy)` as the pointer travels, and the panel subtracts that
  from its own scroll offsets. This is what makes a figure larger than the pane
  navigable at all: zoom used to be the only way to reach a corner, and at a fitted
  zoom there was nothing to reach.
  - The overlay calls `setPointerCapture`, so the drag survives leaving the surface.
  - A drag that moved swallows the click that follows it (`panned.current`), because
    that click would otherwise read as "clicked on nothing" and drop the selection
    the reader had just made.
  - `if (props.onPan === undefined) return` keeps a surface that is embedded in
    something which scrolls itself from half-panning.
- **The stage centres with `safe` alignment.** `align-items: center` on a flex
  container makes an oversized child overflow equally on both sides, and the
  scrollport cannot scroll to the half that is off the *start* edge — which is the
  second reason the figure could not be panned to its corner.
- **The tool row is compact and wraps.** Tiles went 56×52 → 42×38 with 14px icons,
  the row is `flex-wrap: wrap` rather than `overflow-x: auto` (a horizontally
  scrolling row clips every popup anchored to it — this is what had been eating the
  settings panel), and the history and view buttons moved to their own line.
- **A swatch repaints the selected mark.** `chooseColor` branches on the selection:
  nothing selected arms the next stroke, a selected mark is repainted through
  `commit`, so the change is one undo step. The swatch shows the selected mark's own
  colour (`shownColor`), so the row answers "what colour is this one" rather than
  "what colour will the next one be".
- **The hand-off is a pill.** Two round buttons — one filled, one quiet — anchored
  `position: absolute; right/bottom`, so they stay put while the figure scrolls
  under them. Their names are `aria-label`/`title`, i.e. a tooltip on hover.
- **The records fold out of the pill.** The goal card and the list card open
  upwards from the pill (`bottom: 56px`), and the detail card floats beside the mark
  it describes — `placeCard` prefers below, then above, then clamps to the top edge,
  and clamps the left edge into the panel.
- **The hint line is gone.** The pill and the empty list both say what to do; a
  third line under the figure only took space from the figure.

## Why the card floats beside the mark

The alternative — a fixed detail field somewhere below — is what the panel had, and
it is why the reader could not tell which mark a sentence belonged to. Anchoring the
card to `markOutline(mark)` makes "this sentence describes that stroke" a property of
the layout rather than of the reader's memory.

Its position is recomputed from two `getBoundingClientRect` calls (the figure host
and the panel) rather than from the scroll offsets, because the figure is drawn
scaled by `transform` and the scroll offsets alone do not say where a mark landed.

## A bug this uncovered

The locating effect ended in an unconditional `setDetailAt(at)`. A *page* body — the
one `PdfBody` mounts per page — receives its `size` from the owner, which rebuilds
that object on every render. So: effect runs → new state object → re-render → new
`size` → effect runs again. The panel hung at 100% CPU, and only that body showed it.

The fix is the general one for an effect that stores derived geometry:

```ts
setDetailAt(previous => previous !== null && previous.left === at.left && previous.top === at.top ? previous : at)
```

## Alternatives considered

- **Keeping the three-card lower half and adding panning.** Rejected: the reader's
  complaint was that the figure had the smaller share of the pane, and scrolling a
  small figure around does not fix that.
- **A fixed side column for the detail, next to the figure.** Rejected: in a slim
  sidebar there is no width to give, and the column competes with the figure for the
  same axis the reader is already short of.
- **A bottom sheet for the list, sliding over the figure.** Rejected: it covers the
  figure exactly when the reader is cross-checking a row against the picture.
- **Docking the pill to the panel's bottom edge instead of floating it.** Rejected:
  the reader asked for controls that do not move when the content scrolls, and a
  docked row is still a row that takes height from the figure.
- **Keeping the two send buttons in the toolbar.** Rejected: they are the end of the
  flow, not a tool, and a slim pane has no room for two labelled buttons beside the
  tools.
- **Panning with a modifier key (space-drag, middle-drag).** Rejected: the reader
  asked for plain dragging, and a hidden modifier is a feature nobody finds.
- **Panning under every tool.** Rejected: under a drawing tool a drag is the stroke;
  only `select` has a drag to spare.
- **Repainting through a separate "apply colour" step.** Rejected: a swatch that
  does not change the selection's colour is the surprise, not the convenience.
- **Auto-placing the detail card always below the mark.** Rejected: a mark near the
  bottom would push its card off the panel, and a card whose textarea is half outside
  the pane is worse than one above the mark.
- **Measuring the card's position from `stage.scrollLeft`/`scrollTop`.** Rejected:
  the figure is `transform: scale()`d inside the surface, so the scroll offsets do
  not describe where a point of the figure sits on screen.
- **Leaving the hint line and shrinking the type.** Rejected: the reader called it
  out as clutter by name.
