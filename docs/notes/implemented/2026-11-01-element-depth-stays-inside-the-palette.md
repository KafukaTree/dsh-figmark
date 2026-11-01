# Note: Element depth stays inside the palette

Status: implemented

## Problem

Element mode showed a wide floating legend beside the top of the tool palette.
On the right side of a document it opened left across the headline, so the depth
control obscured the very content the reader was trying to pick.

The legend repeated the active tool's name and keyboard shortcuts on every hover.
That made the obstruction persistent without adding much information while the
reader was already moving the pointer over the document.

## Decision

The element legend no longer floats outside the palette. Once a stack is available,
the palette grows a full-width vertical footer directly beneath the element tile:
up button, current level and count, down button. The count is written as `1/4`
rather than `1 / 4` so a two-digit stack still fits. Before an element is hovered
there is no extra chip at all; the armed element tile and its tooltip carry the
mode, selection instruction and keyboard keys.

The full mode, depth and keyboard explanation remains in the footer's accessible
label and the element tile's tooltip. It consequently remains available to
assistive technology and on hover without occupying the document.

## Alternatives considered

- **Keep the wide legend at the top of the palette** - repeats information already
  conveyed by the highlighted tool and covers the document headline.
- **Keep a narrower horizontal chip beside the palette** - still reaches sideways
  into the document and covers the content being picked.
- **Hide the depth control until the reader presses a shortcut** - removes the
  visible explanation of how to move through nested elements.
- **Render a second detached pill underneath the palette** - gives the same narrow
  control a second background and shadow, making it look like another tool group.
- **Show keyboard shortcuts permanently** - keeps the chip wide for guidance that
  the tooltip and accessible label can provide on demand.

## Consequences

The control no longer reaches sideways into the document; it only extends the
palette's own vertical lane. Depth switching remains visible and keyboard-
accessible, while the shortcut legend is one hover away. A short panel may scroll
the palette footer with the tools, which is preferable to covering the document.
