# Note: Local HTML on a private loopback

Status: implemented

## Problem

Local HTML is often a generated deck or application, not a long static page. Keeping
it in the scriptless same-origin annotation frame made slide controls, canvas charts,
animations and runtime-rendered elements disappear. Pointing readers at a separately
started development server worked for some projects, but not for a self-contained
`deck.html`. Granting scripts to the existing same-origin frame would give arbitrary
local HTML access to the application origin, which is not an acceptable trade.

The earlier decision in
`2026-10-31-local-html-stays-inert.md` correctly removed that unsafe same-origin
`allow-scripts` combination, but left self-contained dynamic HTML with only its inert
fallback.

## Decision

The Host now serves each opened local HTML file from a fresh, read-only loopback
runtime. Every open gets a random 128-bit `*.localhost` virtual host, a random port and
an opaque lifecycle id. The frame therefore has an independent origin from both the
application and every other preview.

The runtime exposes only `GET` and `HEAD` beneath the HTML file's directory. It checks
the virtual host on every request, resolves lexical and canonical paths, refuses
hidden files, annotation artifacts, symlink escapes, unknown MIME types and malformed
separators, and closes all sockets with the runtime. HTML responses receive the picker
and a CSP that enables local scripts and inline/eval code while limiting all connectivity
to the same origin. Cross-origin APIs, CDNs and Internet requests do not run.

The original preview address remains the file identity. Sidecars, annotations and the
delivered path still use it; the transient loopback URL never enters the annotation
document. If the runtime cannot start, the panel keeps the inert 1024px fallback from
`html-dom.ts`. That fallback remains same-origin and must never gain `allow-scripts`.

## Alternatives considered

- **Add scripts to the existing same-origin frame** - rejected. CSP can restrict
  requests, but it cannot prevent script from reading the parent application, its DOM
  or session state.
- **Keep the inert preview and require a separate development server** - rejected.
  It handles framework projects but not a self-contained deck or generated report, and
  makes the common local-file path depend on an unrelated terminal process.
- **Use an opaque-origin sandbox without DOM access** - rejected. The parent then
  cannot read the page to create selectors or place marks. A scriptless opaque frame
  would also lose the deck's own navigation.
- **Serve the file directory through the existing application route** - rejected.
  The page would remain on the application origin, and the route would expose sibling
  files to every same-origin page.
- **Expose the whole workspace or allow remote network access** - rejected. The HTML
  file's directory is the smallest useful asset boundary, and a local document should
  not be able to relay unrelated machine files to an external endpoint.

## Consequences

Self-contained decks and same-directory web pages now behave like pages: their scripts,
slide transitions, controls, relative assets and native scrolling remain intact while
the injected picker reports element boxes and selections to the annotation layer.
Isolation costs one local HTTP listener per open and means a page cannot use external
network resources; those projects still use a loopback live URL. Element annotations
follow selectors as the page changes, but nested iframe elements are not yet picked
recursively. When the private runtime is unavailable, the static fallback keeps the
document usable for annotation but does not recover its scripts or relative assets.
