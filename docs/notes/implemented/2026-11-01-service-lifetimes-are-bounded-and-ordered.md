# Note: Service lifetimes are bounded and ordered

Status: implemented

## Problem

Service discovery used a socket inactivity timeout and stopped adding bytes after
64 KiB without ending the request. A server that kept sending data could therefore
hold a probe and one of the scan workers forever. A server that trickled bytes also
kept resetting the inactivity timer, so neither the body cap nor the timeout made
the scan finite.

The service picker could also apply an older scan after a newer one, including
clearing the newer scan's loading state. Row opens had no request-level lock, so two
clicks could issue two proxy requests and whichever response arrived last would
choose the page shown to the reader.

## Decision

Each discovery probe starts one absolute 450 ms deadline covering connection,
headers, and body. Reaching the 64 KiB body limit parses the retained prefix,
settles the probe, and destroys the response. Settling a probe also clears its
deadline.

The picker assigns every scan a generation. Only the newest generation may replace
services, show an error, or end the scanning state. An open is admitted only when no
other open is active, which makes the first row click win and leaves the other rows
visibly disabled while it runs. Open requests also carry a generation that teardown
invalidates, so a late response cannot remember an address or install a page after
the picker is gone.

## Alternatives considered

- **Keep only the socket inactivity timeout** - rejected. Continuous or trickling
  bytes reset it, so a hostile or broken local server can wedge a scan worker.
- **Buffer the full 64 KiB and wait for `end`** - rejected. A streaming response may
  never end; the cap must close the response, not merely stop retaining bytes.
- **Use one deadline for the whole candidate scan** - rejected. It would make results
  depend on worker scheduling and would not bound each individual connection.
- **Let the latest row click supersede an earlier open** - rejected. It produces
  last-response-wins behavior and opens a proxy request the reader did not intend.
- **Guard only React state updates without a request lock** - rejected. It would hide
  stale results but still issue duplicate proxy opens and leak their lifetime into
  the picker's interaction state.

## Consequences

Discovery now has a finite upper bound even against endless and trickling responses.
The title can only come from the first 64 KiB, which is already the useful part of a
document head and was the cap before this change.

Scans may still overlap, but their effects are ordered. Open has one active request;
a second click is ignored until the first succeeds or fails. Tests use real loopback
streams for the network bound and deferred Promises plus real DOM clicks for the UI
ordering.
