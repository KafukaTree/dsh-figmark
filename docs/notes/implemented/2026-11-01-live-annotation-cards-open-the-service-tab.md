# Note: Live annotation cards return to their service tab

Status: implemented

## Problem

An annotation message from a live page spells its subject as the page's HTTP URL.
The transcript card treated every subject as a Session file. Clicking a live-page
card therefore opened the right Sidebar as a file tab, resolved the URL as a
filesystem path, and showed "file does not exist" instead of returning to the page
that was annotated.

## Decision

The annotation card distinguishes an HTTP(S) subject from a filesystem path before
navigation. A live subject opens the registered local-pages tab; a filesystem
subject continues to use the Session-scoped `dsh-resource://file/` address. When a
host does not expose page-tab navigation, a live card has no button rather than
falling back to the known-broken file address.

The service tab receives the page URL as a navigation seed and consumes it after its
tab-info hook says the request changed. A seed waits behind an in-flight open rather
than being dropped, accepts revision zero, and is reset with the Session. If that
page is already mounted, the seed reveals the existing frame instead of opening a new
proxy; returning to the service list likewise hides rather than destroys the live
frame. This preserves scroll position, running animation and in-frame widget state,
not only the persisted mark draft.

## Alternatives considered

- **Encode the URL as a `dsh-resource://file/` path** — rejected. That address
  contract resolves files through a Session workspace and cannot represent a live
  page or its proxy state.
- **Remove interactivity from every annotation card** — rejected. Local images,
  SVG, and PDF cards still have a valid document preview to open.
- **Create a sidecar or preview document for the live page** — rejected. Live pages
  deliberately have no file artifact; the service tab owns their draft and running
  frame.
- **Focus only the service tab without passing the URL** — rejected. The browser can
  have several live-page workspaces, so focus alone cannot know which page the card
  means.
- **Remember one global "last page" and open that** — rejected. It misroutes an older
  transcript card after the reader visits another page and has no per-card identity.
- **Fall back to `openResource(httpUrl)`** — rejected. That address contract resolves
  Session files and would reproduce the "file does not exist" failure.

## Consequences

Clicking a live annotation returns the reader to the local-pages Sidebar. An already
mounted page keeps its frame and transient state; a live workspace that is not
mounted opens its page and restores the localStorage draft. A host without page-tab
navigation leaves the card visible as text without promising an action it cannot
perform. The host-side navigation hook remains an optional capability, but it is
read from a dedicated component so React hook order never changes.
