# One bar at the bottom, and no mode to leave

## What the reader said

> 不要有查看这个了，默认就是标注；这个做的怎么那么烂。我其实想把上面的兼容之类的标注组件全部移动到最下面的；然后这个为什么全是黑色块

> 适应宽度什么的直接去除，其实最上面的东西全部可以去除了

Three complaints and one instruction, and the second one is the interesting one:
**the panel was full of solid black shapes**. That was not a styling choice — see
below.

## The black blocks were a missing rule, not a design

`NoteIcon`, `ListIcon`, `SendIcon`, `ChatIcon` and the tool glyphs are all `<svg>`
elements whose shapes carry no `fill`/`stroke` attributes of their own: they take
both from a CSS rule (`fill:none; stroke:currentColor`) so that they inherit the
theme's text colour. When the stylesheet was rewritten for the floating-card layout,
that rule went with it. An SVG with no `fill` paints `black`, so every icon in the
dock and every heading rendered as a filled black shape — the circles in the list
header, the square in the dock, and the big black blob in the detail card.

The fix is one rule, declared once for the whole set:

```css
.da-ico{width:16px;height:16px;flex:0 0 auto;fill:none;stroke:currentColor;
  stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
```

A rule for the icon-only parts of the panel had been missing for two revisions; it
only became *visible* as black blobs once those icons moved somewhere with room
around them.

## What changed

- **There is no viewing mode.** `mode`, `chooseMode` and the view/annotate pair are
  gone, along with `onModeChange` wiring in the page body. The figure is annotatable
  the moment it opens. What the mode used to buy — not turning an idle drag into a
  stray arrow — is bought by the armed tool starting on `select`.
  - `Escape` now only drops the selection; there is no mode to fall back to.
  - The two record folds no longer hide behind a mode; they are always there.
- **Every control moved to one bar along the bottom.** Tools, the style fold, the
  record folds, undo/redo and the hand-off are one row that wraps when the pane is
  narrow. The figure takes every pixel above it.
  - The style fold opens *upwards* out of the bar (`bottom: calc(100% + 6px)`), so
    opening it costs the figure nothing and it lands where the eye already is.
  - The records open upwards from the bar in the same way, and the detail card
    still floats beside its own mark.
- **The zoom controls are gone entirely** — `fitWidth`, `100%` and the two step
  buttons. The figure opens fitted to the pane, and a trackpad pinch (or a
  ctrl-wheel) is the whole of zooming. This also removed the last thing that needed
  a "viewing" mode to make sense of.
- **The list rows got their layout back.** `.da-mark`, `.da-mark-index`,
  `.da-mark-text`, `.da-mark-title`, `.da-mark-meta` and `.da-mark-del` had all been
  dropped in the same rewrite, so rows rendered as one running line of text. Each
  row is again a card: the number in the mark's colour, the sentence as the thing
  you press, its shape and anchor underneath, and its own delete.

## Why one bar rather than a floating pill

The pill had the right instinct — controls over the picture, not beside it — but a
pill in the middle of the bottom edge leaves the corners of the bar empty and then
needs a second surface for the tools. A full-width bar puts the tools, the records
and the hand-off on one line the reader can sweep left to right, and it is the
arrangement every image editor they have used already has.

The bar is `flex-wrap: wrap`, so a narrow pane stacks it into two rows rather than
clipping a control out of sight.

## Alternatives considered

- **Keeping the view/annotate switch but defaulting to annotate.** Rejected: the
  reader asked for it to be gone, and a switch whose only use is to *stop* drawing
  is a trap for someone who forgets which half is on.
- **Keeping the pill and adding the tools to it.** Rejected: six tool tiles plus
  three action buttons plus a settings fold overflow a centred pill in a narrow
  pane, and an overflowed pill either wraps into an odd shape or hides its tail.
- **A floating, draggable toolbar.** Rejected: it can be dragged over the mark the
  reader is working on, and its position is then something to manage.
- **Keeping zoom buttons in the bar.** Rejected: the reader named them; the figure
  opens fitted, and pinch covers the rest.
- **Making the style fold a modal.** Rejected: choosing a colour is a glance, not a
  decision worth a scrim.
- **Fixing the black icons by giving every `<svg>` its own `fill`/`stroke`
  attributes.** Rejected: it puts the same two attributes on a dozen elements and
  breaks the one thing that makes them theme-aware, which is inheriting
  `currentColor`.
- **Making the missing rule a class on each icon shape instead of the svg.** Rejected:
  the shapes are `<path>`s and `<rect>`s inside the same svg; one rule on the svg
  covers all of them and cannot be forgotten per-shape.
- **Rendering the bar as a grid with fixed columns.** Rejected: the panel's width is
  the reader's to change, and a fixed track puts a gap where a tool should be.
- **Leaving `mode` in the props contract for API stability.** Rejected: nothing
  outside this plugin passes it, and a prop that is accepted but ignored is worse
  than one that does not exist.
