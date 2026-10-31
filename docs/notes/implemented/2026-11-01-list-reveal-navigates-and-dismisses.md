# Note: List reveal navigates and dismisses

Status: implemented

## Problem

Choosing a mark from the annotation list changed the selected row but did not
necessarily bring the marked element into view. On a rendered document this made the
list look like an index that did not work. The list also stayed open after a successful
reveal and covered the element the reader had just asked to see.

Element mode had a parallel interaction bug. The page picker only handled Escape after
it had retained a hovered element, so focus inside the live page could leave the reader
trapped in element mode. A successful geometric reveal was also reported without
checking whether the destination was actually in the viewport.

## Decision

A list row first resolves the mark's selector in the document, scrolls that element
into view, and only then selects the mark. Rendered documents close the list after the
navigation. A proxied page confirms the reveal by message, and the list closes only
after that confirmation.

The live picker handles Escape whenever element mode is armed, even without a current
hover target. The parent treats that report as leaving element mode. Reveal success now
requires the target's rendered box to intersect the viewport, rather than merely having
nonzero size and CSS visibility.

The list itself gives an unannotated source element its own identity as the main row
line instead of spending that line on a placeholder. Its controls and spacing are more
compact, and the element-mode hint opened out of the narrow palette into a one-line
floating chip that flips toward the panel centre.

## Alternatives considered

- **Keep the list open after reveal** - rejected. It covers the destination and makes
  the navigation feel incomplete.
- **Scroll and close immediately on a proxied page** - rejected. The parent cannot read
  the cross-origin document, so success has to wait for the picker's confirmation.
- **Treat CSS visibility as viewport visibility** - rejected. A nonzero element can sit
  entirely off-screen or remain clipped, which was the failure the reader saw.
- **Leave Escape conditional on a hovered element** - rejected. Keyboard focus can be
  inside the page while the pointer has left, and the mode must still be escapable.

## Consequences

The same row now both selects and navigates, while the page remains visible afterwards.
A failed live reveal keeps the list available for another attempt. Off-screen elements
are reported honestly instead of producing a false success.
