# Note: Preserve SVG root context in the delivered image

Status: implemented (native DSH verification pending)

## Problem

A Visio SVG can be previewed and annotated but cannot be sent. The supplied 95,735-byte source declares `xmlns:v` on its root and uses `v:*` elements/attributes throughout. Review composition stripped that root and inserted only its children into a replacement viewport. The resulting standalone SVG failed XML parsing with `unbound namespace prefix: "v"`, preventing PNG generation before delivery. Root class/style/xml:space were also discarded, making exported presentation differ from preview.

## Decision

The composer parses the already sanitized, highlighted SVG, retains its root and namespace declarations, and updates only the placement and viewport fields needed for the review (x/y, width/height, optional explicit viewBox, preserveAspectRatio). Serialization retains inherited presentation and nested SVG viewports. Sanitization remains the same; foreignObject/scripts/external references are not restored. The input SVG is never rewritten.

## Alternatives considered

- **Declare xmlns:v on every export** — fixes one exporter while discarding other namespace bindings and inherited root presentation.
- **Delete Visio metadata** — hides this failure but silently drops legitimate namespaced content and leaves the same problem for other exporters.
- **Copy attributes with regular expressions** — cannot reliably distinguish attribute boundaries from quoted values.
- **Change sending or queues** — the defect is before delivery, in standalone image composition.

## Consequences

Only vector image composition changes. Raster rendering, Host routes, sidecars, prompts, queue policy and native conversation APIs are untouched. Regression tests first fail on the previous implementation and pass after the fix. The actual supplied source passes both browser-style DOMParser and an independent XML parser after composition; librsvg can produce a PNG. Local fonts differ, and a real Chromium/DSH end-to-end check is still required. No new runtime dependencies are introduced. The user's full figure is not committed as a public test fixture; tests use a small synthetic Visio-shaped document.
