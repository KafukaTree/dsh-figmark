# Note: Local HTML stays inert

Status: implemented

**Later context:** self-contained dynamic local HTML now uses the separate
loopback-origin runtime described in
`2026-10-31-local-html-on-a-private-loopback.md`. The same-origin scriptless frame in
this note remains the fallback and must stay scriptless.

## Problem

The interactive HTML preview added `allow-scripts` to a frame that also had
`allow-same-origin`, changed the injected policy to permit inline scripts, and laid
the document out at the pane's live width. Because the frame remained same-origin,
the sandbox combination let arbitrary local HTML run with access to the application
window and its data. Pane-sized reflow also changed element coordinates whenever the
preview column moved, while the annotation contract still promised a fixed 1024px
layout. README and tests had been changed to describe the unsafe behaviour, but the
repository's architecture contract had not been superseded.

## Decision

Local HTML is inert again. `html-dom.ts` injects `default-src 'none'` and
`script-src 'none'`; the frame uses exactly `sandbox="allow-same-origin"`, and the
first layout is fixed at `RENDER_WIDTH = 1024`. The frame remains a window one pane
tall, even when the document is much taller; the document scrolls inside that frame
and the overlay follows the frame's scroll offset. A long deck therefore remains one
viewport instead of expanding into a strip as tall as every slide in the file.

The deliberate live-page feature remains separate. A loopback URL is loaded at the
pane's size through its one-page proxy, on a different origin, where scripts,
scrolling and native page interaction are the point. The iframe sandbox and layout
model are therefore selected by whether the frame holds a local file or a proxied
page, rather than applied uniformly to both.

This restores and cross-checks the decision recorded in
`2026-10-07-html-annotation.md`, and supersedes the script-enabled local-file
behaviour introduced without a contract change on 2026-10-31.

## Alternatives considered

- **Keep same-origin plus scripts and rely on CSP** - rejected. CSP can restrict the
  document's own fetches, but it does not prevent same-origin script from reading the
  parent application, its DOM or its in-memory session data.
- **Use an opaque-origin script sandbox and inject a picker** - rejected here. It is a
  valid design for a future interactive local-file mode, but it requires a new
  messaging protocol and build artifact; it does not justify silently weakening the
  existing annotation surface.
- **Keep pane-width reflow** - rejected. Element coordinates then depend on sidebar
  width, so a saved locator's geometry no longer means what the contract says and the
  same mark can land elsewhere after a resize.
- **Remove the live-page feature with the local script fix** - rejected. A proxied
  loopback page is cross-origin and intentionally interactive; its risk and layout
  model are different, and removing it would discard a working feature.

## Consequences

Script-driven decks, players and runtime-rendered local files show only the inert
markup the file contains. That is an intentional limitation of the annotation
preview. Local documents lay out consistently at 1024px through a one-pane scrolling
window; proxied pages continue to use native scrolling and scripting in their own
origin. The two modes now have separate regression tests for sandbox, width, window
height and scroll synchronization.
