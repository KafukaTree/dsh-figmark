# Note: Refresh the live frame, not the proxy

Status: implemented

## Problem

A live page can change after it has been framed, and the reader needs the same
reload action a browser provides. Reopening the address through the Host works,
but replaces the proxy and temporarily turns a small content refresh into a new
page lifetime. Reusing the existing iframe does not reload a document in place,
because its `src` is unchanged.

Refreshing also has to interact correctly with a mark that is waiting to be
revealed. A reveal can have a timer and a pending reply from the page; carrying
either across a reload would let stale page state clear a selection or show a
timeout after the reader has already refreshed.

## Decision

The live address control replaces its static badge with a refresh button while a
service page is shown. Pressing it increments a frame revision. `FigureRoom` uses
the proxy URL plus that revision as the iframe key, so React creates a fresh
browsing context and the existing proxy serves the page again.

The action does not call `openLivePage()` or `closeLivePage()`. It clears hover,
pick-level, preview, surface, scroll, and selection state, cancels a pending
reveal and its timeout, and leaves the reader's marks and page note untouched.
The Host's proxy remains the same one-page lifetime.

Static HTML remains a read-only file preview and has no refresh button from the
live-inspector chrome.

## Alternatives considered

- **Reopen the same address through the live route** - gives a fresh page, but
  unnecessarily replaces a proxy that is already correct and makes refresh a
  different lifetime operation.
- **Assign a cache-busting query to the iframe `src`** - can alter the page's
  routing and cache semantics, while a keyed remount reloads the exact proxy
  address without pretending the loopback page has a new URL.
- **Call `contentWindow.location.reload()`** - the proxied frame is another
  origin, so the panel cannot reliably read or command its window.
- **Leave marks selected across refresh** - the old selection names an element
  state that may no longer exist; clearing transient interaction state while
  retaining the marks is the useful boundary.
- **Let the pending reveal timer expire after reload** - a late timeout would
  report a failure for an interaction the refresh has already superseded.

## Consequences

Refresh is local to the visible live body, is independent of tab switching, and
does not add proxy requests or listeners. The page reloads from the current proxy
with its own cookies and routing, while the annotation draft stays on the
panel. Transient reveal and hover state is intentionally reset.

The iframe now has a revision in its key. Any future live-page action that needs a
new browsing context can use the same mechanism rather than mutating the proxy
lifetime.
