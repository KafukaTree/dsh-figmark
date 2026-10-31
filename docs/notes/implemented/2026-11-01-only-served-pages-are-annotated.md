# Note: Only served pages are annotated

Status: implemented

## Problem

The plugin used to claim local `html`/`htm` files and serve them through a private
loopback runtime. That made it possible to annotate a file without starting its
generator, but it also created a second web platform inside the plugin: relative
assets, frames, scripts, CSP, MIME handling, and the meaning of a selector all had
to be reimplemented. Static files still could not reproduce the page the user was
actually developing, while the old inert fallback rendered a long, non-interactive
preview that could not play or turn the deck it was meant to inspect.

The product boundary is now simpler: Figmark renders a local HTML file as read-only
content; an HTTP page is a running application and can be annotated against the real
DOM.

## Decision

Figmark registers `HtmlPreviewBody` for `html`/`htm`, not `AnnotatorBody`. A static
file has a read-only preview with no Figmark toolbar, sidecar read, or delivery.
The preview is an opaque sandbox. It allows a self-contained document's inline
scripts, but its CSP rejects external resources, forms, nested frames, and network
connections through fetch/XHR. Inline script can navigate its own frame, but that
opaque frame cannot reach the DSH application origin.

The right sidebar adds a **本机网页** entry. It discovers recent loopback URLs,
ports explicitly named by the current workspace's package scripts, and a short
common-port list. Choosing one opens a one-page `127.0.0.1` live proxy. The proxy
forwards the page's scripts, styles, media, routes, and upgrade connections, then
injects the Figmark picker. Element hover, depth changes, picks, scroll, surface,
reveal, and live bounds cross the origin boundary only through the typed
`postMessage` vocabulary.

A service page is not a file: it writes no sidecar and produces no annotated
snapshot. Its message names the loopback URL and uses `anchor.selector` as the
source locator. The annotator's queue, summary, queue cards, and delivery code are
shared with file surfaces, so a second delivery implementation is not introduced.

The address drawer keeps the same top-left origin. Opening it expands to the right;
it never jumps to the top of the page or inserts a new document-flow row.

Supersedes the local-file runtime decision in
`2026-10-31-local-html-on-a-private-loopback.md`, and replaces the inert fallback
described in `2026-10-31-local-html-stays-inert.md` for the product surface. The
current-surface and scroll-alignment lessons remain in
`2026-10-31-html-marks-belong-to-the-current-slide.md`.

## Alternatives considered

- **Keep the per-file private runtime** — rejected. It duplicated a web server and
  still diverged from the user's running application; it also kept a second HTML
  security model alive in the plugin.
- **Keep the inert 1024px fallback** — rejected. It could not execute a deck, play
  media, or exercise routing, and users experienced it as a long screenshot rather
  than a preview.
- **Scan every port and launch arbitrary package scripts** — rejected. It is slow,
  scans unrelated local services, and turns a preview action into arbitrary process
  execution. Discovery is bounded; a future explicit start action must name the
  workspace script and receive its own confirmation and tests.
- **Send a rendered screenshot of the service page** — rejected for now. A live page
  can be larger than the viewport and can depend on transient state; the selector is
  the durable locator. Adding snapshots would be a new artifact contract.

## Consequences

- Offline, static HTML is previewable by Figmark and may run its own inline scripts,
  but it is not annotatable. CSP blocks external subresources, fetches, forms, and
  nested frames; script-driven self-navigation remains inside the opaque frame.
- A user must have a loopback HTTP service running before Figmark can annotate its
  page. The scanner never scans `1–65535` or starts a process on its own.
- Service marks survive navigation inside the annotator session but are not written
  to disk; reloading the page starts a new in-memory review.
- The injected picker is the only DOM reader for a live page. The parent remains
  origin-blind, and the host proxy is still loopback-only and one page at a time.
