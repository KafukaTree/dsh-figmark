# Note: A send only clears the work it carried

Status: implemented

## Problem

A hand-off is asynchronous, but it used to clear whichever marks happened to exist
when the session answered. A reader could send one batch and immediately draw the
next; the successful answer then erased both. The same race affected the overall
note. On a paged document, a background draft write could also finish after the
delivery and put the sent sidecar back.

## Decision

Each delivery captures the ids in its own snapshot and the overall note it carried.
When it succeeds it removes only those ids, and clears the note only if it still
matches the sent value. PDF delivery cancels and drains the background writer before
deleting the sidecar, then records the snapshot as delivered so the surviving marks
are written back without reviving the sent ones.

The composer's all-annotations action is guarded synchronously as well as visually,
so a same-tick double press cannot submit the queue twice.

## Alternatives considered

- **Disable the surface while sending** - it prevents the race by preventing the work.
  Readers routinely want to start the next batch while the previous answer is slow.
- **Clear every current mark after the await** - that is the original data-loss bug.
- **Keep the last sidecar and let autosave overwrite it later** - a successful send
  would leave its own work available to be sent or reopened again.
- **Delete the sidecar without waiting for an in-flight draft** - the draft can land
  after the delete and recreate the document that was just delivered.

## Consequences

- A delivered snapshot disappears while work created during the request remains.
- The overall note follows the same rule as the marks instead of the request clock.
- Clearing a failed sidecar now reports the cleanup failure without discarding the
  next batch that is still on screen.
- Delivery has one more required wait, but no longer depends on timing between the
  network answer and the debounced writer.
