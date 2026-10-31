# Note: Live proxies close by identity

Status: implemented

## Problem

Opening and closing a live page used a single global operation. An open request
that finished after the panel had moved on could replace a newer page, and a late
close could then destroy whichever proxy happened to be current. The service picker
could also turn an explicitly typed loopback address into a discovered result whose
URL merely shared the same prefix.

## Decision

The Host orders open requests with a composition-local sequence. A listener that
finishes after a newer open has started closes itself and answers `409`; it never
becomes the installed page. Closing a non-current proxy leaves the current one
alone, while a global close or composition teardown also invalidates opens still
starting.

The Client sends the expected proxy URL with each delayed cleanup. The service picker
treats only loopback `http://` input as an explicit address. Address-shaped input
that is malformed or not loopback is still sent to the opener so the reader sees its
error; only non-address text remains a title/filter query and opens the first matching
row.

## Alternatives considered

- **Make the Client generation guard the whole contract** - rejected. Host state
  outlives one React component, and another body can start an open before the old
  component's answer arrives.
- **Close the newest proxy unconditionally on teardown** - rejected. It is the exact
  late-cleanup race that leaves the visible frame pointed at a dead listener.
- **Treat every string that parses as a URL as an explicit address** - rejected.
  Text such as `deck` parses after a scheme is supplied, so a title search would stop
  opening its matching service.
- **Fall back to the first row for every unparseable string** - rejected. Text such
  as `http://` matches every discovered URL and opens an unrelated page instead of
  reporting the malformed address.

## Consequences

Open requests may still overlap, but only the newest can install a proxy. Cleanup is
idempotent and cannot close a replacement. Composition teardown leaves no listener
behind. The picker has one clear rule: a loopback address opens exactly what was
typed, malformed address-shaped input reports an error, and ordinary text searches
the discovered list.
