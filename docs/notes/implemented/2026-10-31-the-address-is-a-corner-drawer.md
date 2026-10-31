# Note: The HTML address is a corner drawer

Status: implemented

## Problem

Every HTML preview carried a rounded filename field across the top of the panel.
It was useful when inspecting or changing the address, but at rest it spent both a
full row of height and the most valuable corner of a slide deck on a filename the
reader already knew. Replacing the card with a compact icon was not enough while the
icon's row stayed in normal flow: the preview lost the same vertical space.

## Decision

The address is closed by default. Closed, one 32px location icon floats near the
preview's top left, after the default tool palette, and the page stage uses the full
height; the address field and back action are absent from the DOM. Opening the
drawer restores the address strip in normal flow, renders the field and actions, and
focuses the field. Pressing the same icon closes it again. The icon's accessible
name and expanded state follow the drawer, and its collapsed tooltip still carries
the full document path.

The icon's layer accepts only its own pointer events, so the closed strip cannot
block the page underneath. HTML toasts move back to their ordinary top-right corner
while the drawer is closed, then clear the restored strip when it opens.

## Alternatives considered

- **Keep a compact icon in a transparent row** - it hides the filename but reserves
  almost exactly the vertical space it was meant to save.
- **Remove the address control entirely** - the plugin supports opening local web
  addresses in the same marked surface, and losing that action makes the preview
  less capable rather than quieter.
- **Open the full address as a floating card over the document** - a filename field
  is large enough to cover the slide content it describes; only the resting icon
  belongs over the page.

## Consequences

The resting HTML view gains back the address strip's height. The top-left corner
contains one deliberate control that the floating palettes can overlap only after
the reader moves them there. The drawer does not preserve unsaved input when it is
closed; reopening shows the address of the page actually being displayed.
