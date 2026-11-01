# Note: Live tabs keep their page state

Status: implemented

## Problem

The service browser treated a live page as a mode with a single exit. Returning to
the service list had to unmount the annotator and close the proxy, so coming back
to the same page lost every unpublished mark. Keeping two loopback pages open at
once was worse than an inconvenience: the Host deliberately owns one live proxy,
and a second open replaces the first.

The browser also had no place to distinguish "the page is no longer in front" from
"the page and its work are gone". Those are different states for a reader moving
between a local app and its documentation.

## Decision

The service browser owns a list of workspaces, one per opened loopback address. A
workspace has a local tab id, the address it currently shows, and the title found
in service discovery. The service list and the controls for every workspace stay
mounted; only one `AnnotatorBody` and one Host proxy exist at a time.

Returning to the list unmounts the active body and closes its proxy but keeps its
workspace and the newest draft in memory. Switching to a workspace asks the Host
to open that address again and remounts the body with its saved marks and page
note. Closing a tab explicitly discards that address's draft and removes its
local record.

Live drafts are bounded and validated in browser-local storage under a
session-scoped key. Storage is updated after a short pause and flushed on
`pagehide` or unmount, so a sidebar remount can restore unpublished work without
turning a live page into a file, a sidecar, or an attachment.

An address entered inside a live body updates the workspace that already owns
that body. It does not create a second workspace or open a second proxy.

## Alternatives considered

- **Keep every live page mounted in a hidden iframe** - preserves browser state,
  but needs several live proxies and listener lifetimes, contradicting the Host's
  one-page proxy and leaving background pages running scripts.
- **Keep one proxy but discard the body when returning to the list** - keeps the
  Host simple, but loses every unsaved mark and page note as soon as the reader
  browses the service list.
- **Store only the proxy URL and reload it on return** - the proxy is disposable
  and its page state belongs to the running app; a later open must ask for the
  original loopback address anyway.
- **Put live drafts in the annotation sidecar** - a service page has no file path,
  so this would invent a second persistence format and an artifact the existing
  architecture explicitly says a live page does not have.
- **Treat every newly typed address as a new tab** - makes normal navigation
  inside an app accumulate tabs and leaves the old tab pointing at a proxy that
  is no longer running.

## Consequences

Readers can move between several local pages without losing drafts, while the
Host still has one live proxy and one set of loopback listeners. Switching or
returning from the list has the cost of reopening the proxy and reloading the
page; only the marks and page note are restored.

The browser now keeps at most twelve drafts and bounds every string, point, mark,
and serialized record it reads back. Draft data never becomes a file and never
appears in a delivered message. Explicitly closing a tab intentionally clears
that workspace's unpublished work.
