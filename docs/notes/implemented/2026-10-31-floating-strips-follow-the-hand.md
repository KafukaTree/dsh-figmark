# Note: Floating strips follow the hand, then settle

Status: implemented

## Problem

The two floating strips used a side-switching anchor and a shortest-path collision
test. Crossing a midline could make a strip jump by its own width or height. A fast
pointer step could cross the other strip and land legally on its far side, so the
control appeared to teleport through an obstacle. Resize repairs and delayed layout
frames could also overwrite a drag already in progress.

## Decision

Both strips store one model: the top-left corner as fractions of their actual
positioning parent. While the pointer is down, movement is strictly one-for-one,
apart from keeping the whole body inside the panel's eight-pixel gutter. The active
strip may cross over its sibling: sliding it away during the gesture made the grabbed
control leave the hand.

Release is the state transition where layout rules apply. A strip within 24 CSS
pixels of an edge docks into that gutter, then the nearest collision-free face of the
other strip is chosen if the two would otherwise overlap. A resize uses the same
body clamp and collision repair, but only while no pointer owns a strip. Normal
position changes use a short eased transition; the transition is disabled for the
whole active drag and under `prefers-reduced-motion`.

Pointer capture, pointer-id ownership, `pointercancel`, `lostpointercapture`, window
blur and page hiding all end the same state machine. Storage is written once on
release, not on every move. Layout repairs are skipped while either strip is held and
re-checked on the next frame after a resize.

## Alternatives considered

- **Snap on every pointer move** - the control fights the hand through the whole
  gesture; a magnetic band gives guidance without changing the middle of the panel.
- **Slide around the other strip while dragging** - it prevents overlap during the
  gesture but breaks the stronger expectation that the grabbed object stays under
  the pointer. The invariant now applies to every resting position instead.
- **Use one hard boundary with no animation** - it is predictable but makes release
  and resize repairs look abrupt.
- **Remember the previous swept collision frame** - once collision moved to release,
  there was no previous frame to remember; keeping that path made the arithmetic
  look stateful while every live call passed `undefined`.
- **Use pointer velocity or inertia** - a precision tool should stop where it is
  released; inertia makes a near miss feel like the control has escaped the reader.
- **Write the fraction to storage on every move** - synchronous storage work under a
  high-frequency pointer stream adds frame-time without protecting the next frame.

## Consequences

- Dragging is 1:1 everywhere the panel boundary allows, and only the deliberate
  release or a layout repair animates.
- Edge parking now has a visible gutter and corner docking rather than arbitrary pixel
  positions.
- Fast and coarse pointer streams remain under the hand while held, and every final
  resting position is separated from the other strip whenever the panel has room.
- A drag owns its cleanup from press to release even when the browser removes capture
  or the window loses focus.
