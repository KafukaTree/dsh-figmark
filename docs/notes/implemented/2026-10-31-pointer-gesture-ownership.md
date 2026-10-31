# Note: One pointer owns one gesture

Status: implemented

## Problem

Canvas drawing, mark edits, element picks, pans and strip drags each kept several
independent flags. A second pointer could move a gesture it did not own, a release
outside the surface could leave a point or element tap waiting forever, and two strips
could claim simultaneous presses. Escape could discard strip movement or a canvas
draft but had no single answer about which transient layer should go first.

Touch had a second conflict. A two-finger pinch cancels the one-finger gesture, but the
remaining finger could begin drawing again before it lifted. HTML element picking also
covered the whole rendered page with the overlay, taking links and scrolling away from
the page the reader was trying to inspect.

## Decision

The canvas accepts one primary pointer at a time. Drawing, point and element taps,
mark edits, handle edits and pans all check that pointer id before changing any state.
Point and element taps capture the pointer just like drags, and all completion paths
share `cancel`: `pointercancel`, lost capture, blur and page hiding roll back without
creating a mark or move.

The two strips share one drag owner. A press is pending until three CSS pixels of
travel, only then enters the dragging state, and only the owning pointer can move or
finish it. Release commits a settled position; cancel restores the position painted at
press time. Escape asks the strip, then the canvas controller, then the open card, then
the tool and finally the selected mark, from most transient to most persistent.

For touch, a completed pinch drains every finger that remains down. A moving, newly
landing or repeated pointer in that set cannot draw, pan, select or start another pair.
A new gesture begins only after the tail has lifted.

A same-origin HTML file keeps its iframe interactive in select and element mode. A
capture-phase listener in the frame's own document names the pressed element: element
mode creates or reuses its mark, select mode selects an existing mark or closes the
comment without preventing the page's native action. A proxied page still reports its
own picks through the existing message bridge.

Navigation is available only where it can do something. A fitted picture has no
hidden edge, so an ordinary wheel event is left to the host and an empty drag does not
start a pan. Ctrl/Cmd-wheel still requests magnification. A rendered HTML document
keeps its own scrollport and native layout: two touches may move the framed document,
but they do not apply the picture zoom to the fixed page behind its marks.

## Alternatives considered

- **Keep separate booleans for drawing, panning and edits** - every new pointer path
  has to remember to clear every flag, and a missing pair is a permanent stuck state.
- **Treat a second touch as a replacement pointer** - overlap between the old and new
  gesture can draw from the tail of an abandoned pinch.
- **Leave the overlay in front of rendered HTML** - it makes picking simple but costs
  links, text selection, scrolling, media and the page's own controls.
- **Let Escape be handled independently by each component** - the same keystroke then
  closes two layers, or closes the wrong one depending on event order.
- **Prevent every wheel event over a surface** - a fitted picture cannot consume the
  travel, so doing this makes the plugin appear to freeze the surrounding panel.

## Consequences

- A cancelled or interrupted pointer cannot leave a gesture alive.
- A pinch has one completion boundary even when its fingers lift in any order.
- Same-origin HTML keeps its native reading behavior while element selection remains
  available.
- A wheel or drag has an effect only when the surface has travel to give it.
- Escape has one ordered path through transient UI and is testable at each boundary.
