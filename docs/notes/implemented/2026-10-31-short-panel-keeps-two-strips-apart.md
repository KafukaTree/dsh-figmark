# Note: A short panel keeps the tools above the bar

Status: implemented

## Problem

At 600 by 300 the default bottom bar spans almost the whole lower lane while the
floating tool palette is taller than the room above it. Neither `separatedSpot()`
nor the existing clamped drag fallback can move one strip clear of the other. The
bar covered the palette's lower tools and, more importantly, its Send control.
Changing the panel height again could then make the controls alternate between
overlap and separation.

## Decision

When the bar is still on its default bottom edge and the two measured strips cannot
be separated by movement, the palette keeps its horizontal position and receives a
temporary `max-height` ending eight pixels above the bar. Its existing internal
scroll makes every tool reachable and its sticky grip stays available. The ceiling
is derived from live rectangles, never stored in `PaletteSpot` or preferences.

The layout repair now runs whenever either strip reaches a resting position, not
only when the panel resizes. It compares the natural palette height with the capped
one so its own height cap cannot look like a separated state and immediately remove
itself. Moving the bar, moving the palette successfully, or growing the panel clears
the ceiling and restores the ordinary percentage-based maximum.

## Alternatives considered

- **Move the default bar above the palette** - rejected. It turns a compact fallback
  into a saved parking decision and moves the primary send control away from the
  bottom lane readers expect.
- **Move the palette to its default corner** - rejected. The corner need not be the
  reader's chosen location, and the bar can still span that lane in a short panel.
- **Let the strips overlap with the palette on top** - rejected. It makes the bar's
  Send action look present but unreachable.
- **Hide tools below a height threshold** - rejected. The surface still has enough
  room to scroll them; hiding functionality is more destructive than bounding it.

## Consequences

A short panel keeps both controls operable without persisting a synthetic position.
The ceiling is transient and recomputes after drags, document switches and resizes.
At extreme heights below the grip's minimum, the cap bottoms out at 32px rather than
producing a zero-height or negative control; an overlap may remain unavoidable, but
the strip can still be grabbed and moved. A live 258 by 271 pane measured a 131px
palette ending exactly eight pixels above the bar, with 267px of scrollable content
and no overlap.
