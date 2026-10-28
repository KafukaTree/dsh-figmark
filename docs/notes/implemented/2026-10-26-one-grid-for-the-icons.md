# One grid, so one stroke width means one thickness

## Problem

The row of tool icons did not read as one set, and the reason was arithmetic
rather than taste.

`stroke-width` inside an inline SVG is measured in that icon's own user units.
The stylesheet set one number for the whole row — `1.9` — which meant one thing
for an icon on a 24-unit grid and a different thing for an icon on a 16-unit
grid:

| icon | grid | declared | drawn |
|---|---|---|---|
| pointer (select) | 24 | 1.9 | **1.27 px** |
| arrow, box, circle, pen | 16 | 1.9 | **1.90 px** |
| pin (point) | 16 | — | filled |

The pointer was drawn a third thinner than everything beside it while being the
fattest shape in the row (41% of its box, against 39–47% for the outlined
shapes). That is what "the thickness and relative size do not match" was: not a
judgement call, a unit mismatch that nothing in the code made visible.

## Decision

**Draw every icon on the 24-unit grid, then ask for one drawn thickness.**

All nine icons — the pointer, the five marking tools, the goal, the list, undo,
redo, the paper plane and the speech bubble — now share `viewBox="0 0 24 24"`.
On one grid the rendered thickness is `stroke-width × size / 24`, so the sheet
carries one number per drawn size rather than one number period, and every one
of them resolves to about 1.2 px:

```css
.da-ico        { stroke-width: 1.8 }  /* 16px → 1.20px */
.da-palette .da-tool-icon svg { width: 17px; stroke-width: 1.7 }  /* → 1.20px */
.da-tool .da-tool-icon svg    { width: 14px; stroke-width: 2.05 } /* → 1.20px */
.da-btn svg    { width: 15px; stroke-width: 1.9 }  /* → 1.19px */
```

The sizes still differ because the buttons holding them differ — a 17px icon in
the tall palette, a 14px icon in the short bottom bar. The *weight* does not.

**Redraw the shapes rather than rescale them.** Multiplying coordinates by 1.5
would have kept the 16-grid drawings' proportions but landed them on half-unit
coordinates, which the browser rounds asymmetrically and which then look soft at
small sizes. Each shape is drawn on the new grid at whole or clean half units.

**The pin stays filled.** It is the only filled icon, and that is the point: a
pin on the figure is a solid mark, so an outlined icon would promise a shape the
tool does not draw. Its hole keeps the number's place.

## Alternatives considered

- **Keep two grids and compensate in CSS per icon.** Rejected: that is what the
  code was already doing by accident, and the compensation is invisible. The next
  icon added would land on whichever grid its author copied from.
- **Scale the 16-grid coordinates by 1.5 mechanically.** Rejected: half-unit
  coordinates on a 24 grid are rounded by the rasterizer at 16px display size, and
  the result is a row where some icons look sharper than others — trading a
  thickness mismatch for an aliasing one.
- **Set `vector-effect="non-scaling-stroke"`.** Rejected: it makes the stroke
  resolution-independent, which is exactly wrong here — we want the drawn
  thickness to be a fixed pixel weight at a fixed display size, and with
  non-scaling strokes the `stroke-width` stops being expressible in a way the
  stylesheet can reason about across four display sizes.
- **Normalise with one global `stroke-width` and let sizes drift.** Rejected:
  then the 14px bar icons draw 0.82× as thick as the 17px palette icons, which is
  the same defect at a smaller magnitude.
- **Make every icon 16px regardless of button.** Rejected: the bottom bar's
  buttons are 28px tall and the palette's are 32px; one size for both would leave
  the palette looking under-filled or the bar looking crowded.
- **Redraw the pin as an outline to match the other five.** Rejected: the pin is
  a filled mark everywhere else in the product — on the figure, in the export, in
  the PDF appearance stream. The icon should match what the tool puts down.

## Consequences

- Adding an icon now has one rule to follow (24 grid) and one number to pick
  (whatever makes 1.2px at its display size); the comment above `ToolIcon` and
  the test below say so.
- `tests/annotator-body.spec.tsx` asserts that every tool icon's `viewBox` is
  `0 0 24 24`, so a new icon on the old grid fails the suite rather than shipping
  a row that is quietly uneven.
- The pin's icon and the pin on the figure now come from the same teardrop
  formula, so a change to `PIN_LIFT` or `PIN_BELLY` in `src/client/render.ts` is
  visible in the toolbar too — worth knowing when tuning one of them.
- Stroke weights are now derived from a target pixel weight rather than picked by
  eye, which is why the numbers in the stylesheet look arbitrary (1.7, 2.05, 1.9)
  and are in fact each `1.2 × 24 / size`.
