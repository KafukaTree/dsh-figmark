# Note: A page turn does not abort a list reveal

Status: implemented

## Problem

Selecting a mark on one live-page surface and then selecting a mark on an earlier
surface could end with "the page did not respond to the reveal", even though the
deck had turned and the destination mark was visible.

The picker turns the page before it measures the target. The resulting `surface`
message clears the previous row's selection immediately. The effect that closes a
selection saw `null` while the new reveal was pending and sent `release-reveal`.
That release invalidates the picker's current sequence, so its eventual
`reveal-result` is discarded and the client reports a timeout.

## Decision

Clearing a selection does not release the picker while `pendingReveal` names a
request that has not answered. The destination's `reveal-result` or the existing
timeout owns that request and performs the next state transition.

The effect still releases the previous temporary layer when there is no pending
request, and a successful result selects the new mark and closes the list as
before.

## Alternatives considered

- **Keep the old selection until the reply arrives** - the old mark belongs to the
  surface the reader left, so keeping its comment pill visible would anchor it to
  the wrong slide.
- **Ignore the surface message while revealing** - the surface message is also what
  hides old-surface marks and keeps the overlay honest; suppressing it would trade
  one stale box for another.
- **Answer the reveal before reporting the surface** - the picker cannot promise
  that the destination is rendered until the turn is complete, and the panel needs
  the new surface to interpret the measurement.
- **Remove the reveal timeout** - a genuinely missing answer would leave the list
  and selection in limbo indefinitely.

## Consequences

Cross-page list navigation survives the intermediate surface change and no longer
produces a false timeout. Reveal ownership is explicit: while a request is pending,
only its result or timeout can end it. Closing the mark later still restores any
temporary page layer through the existing release path.
