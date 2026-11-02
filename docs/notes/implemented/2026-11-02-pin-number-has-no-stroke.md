# Note: The live Pin number has no inherited stroke

Status: implemented

## Problem

The numeric label inside a Pin was white on the active canvas but black in the
exported PNG. The number already declared a white `fill`; the attachment
annotator's broad `svg { stroke: currentColor }` rule was inherited by the SVG
text, and its dark outline covered the glyph. The exported SVG has no equivalent
inherited stroke, which is why the same mark exported correctly.

## Decision

Both live SVG text elements that carry their own fill declare `stroke="none"`.
The Pin regression test asserts the attribute alongside its white fill, so a
future global SVG rule cannot silently repaint the number again.

## Alternatives considered

- **Change the attachment overlay's global SVG rule** — it intentionally styles
  icon strokes and is shared by the controls; narrowing the fix to text keeps
  the control artwork unchanged.
- **Remove the white fill and rely on a stroke-only numeral** — that would
  produce a hollow digit and diverge from the packaged/exported image.
- **Fix only the attachment overlay CSS** — the shared canvas also draws element
  code labels, and leaving those exposed to inherited strokes keeps the same
  failure available in another surface.

## Consequences

The live canvas, original annotator and export now paint Pin numbers the same
way. Any future text element with its own fill must also opt out of inherited
strokes unless an outline is deliberate.
