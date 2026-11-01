# Note: A live screenshot travels with the page

Status: implemented

## Problem

A live-page message named the selectors and boxes of its marks, but the agent still
had to open or navigate the page to see the state the reader was reviewing. A deck
can depend on the page that is currently in front, its scroll position, an entrance
animation, or a locally rendered state. Reopening the loopback URL later is not the
same evidence: it can show another page, replay an animation from the beginning, or
fail because the development server has stopped.

The parent cannot take that picture directly. The proxied frame is cross-origin, and
the plugin has no desktop-window capture API. A window screenshot would also include
the panel and the rest of the application rather than the page the marks describe.

## Decision

When a live-page annotation is handed off, the parent sends a typed capture request
to the injected picker. The picker renders its own document to a PNG with the
packaged `modern-screenshot` runtime. When a deck reports a logical surface, only
that surface subtree is rendered; a scrolling page renders its document. The reply
carries the PNG, the rectangle of the document it covers, the document and viewport
sizes, scroll offset, visible surface, and the live boxes of the watched elements.
The parent clips the picture to the current viewport and draws the marks over that
same snapshot, including the blue element boxes the reader saw on the page.

The message keeps every selector, element identity, and recorded position as text.
The screenshot is evidence of the current view, not a replacement locator. A capture
failure, a twelve-second timeout, a closed frame, or a composition failure never
blocks delivery: the ordinary text-only message is sent with an explicit warning
that the picture is absent.

The resulting picture is the pending card's thumbnail and the message's first image
part. The same raster canvas produces both the delivered PNG and its card preview,
so the hand-off does not decode the full screenshot a second time. The composer
receives that picture as a real staged file as well as in the eventual message. It
is not written as a sidecar or an annotated file, so a live page still has only one
artifact: the session message. A URL's query and hash are left out of the attachment
name, just as they are left out of the pending card, because they identify page state
rather than a different document. Refresh, switching tabs, and unmounting settle or
cancel outstanding capture waits instead of allowing a late page answer to attach a
stale picture to a newer view. A malformed answer carrying the matching request id
also settles immediately instead of waiting for the timeout, and the picker fails
locally before posting a data URL above the protocol limit.

For the later rule that element-only and pin-only reviews skip the capture entirely,
see `2026-11-01-live-screenshots-follow-mark-geometry.md`.

This supersedes the "rejected for now" screenshot alternative in
`2026-11-01-only-served-pages-are-annotated.md`. It keeps that note's rule that a
live page never gains a file-backed annotation artifact.

## Alternatives considered

- **Reopen the loopback URL and capture it outside the frame** — rejected. It loses
  the current page, scroll, and animation state, and the plugin has no portable
  desktop capture API for a third-party surface.
- **Capture the whole DSH window** — rejected. It includes unrelated application
  chrome and content, and cannot be tied reliably to the marks of one live page.
- **Send only the selectors and boxes** — rejected as the only evidence. It remains
  the fallback, but it makes the agent reconstruct a page the reader already showed
  the plugin.
- **Persist the live screenshot as a sidecar** — rejected. A service page has no
  file path, and a new persisted artifact would contradict the live-page contract.
- **Read the cross-origin DOM in the parent** — rejected. The proxy exists to keep
  the running page opaque; the injected picker is the only permitted reader.

## Consequences

Messages about a live page now show the exact current viewport the reader approved,
with the same annotation geometry drawn over it. The agent receives stronger visual
evidence while selectors and coordinates remain the durable machine-readable
locators.

The injected script gains a sizeable inline dependency, and a capture costs a DOM
render and PNG encode at hand-off time. Capturing a reported logical surface avoids
cloning every hidden slide in a deck, while the full-document path remains for
ordinary scrolling pages. Pages with tainted canvases, unsupported cross-origin
resources, or browser-specific rendering failures fall back to the text-only path;
the reader is told that the screenshot did not travel.
