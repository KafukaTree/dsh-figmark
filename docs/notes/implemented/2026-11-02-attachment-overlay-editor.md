# Note: Composer thumbnail annotation overlay

Status: implemented

Supersedes the interaction in [Independent composer-image annotation](./2026-11-02-attachment-annotator.md).

## Problem

The native composer thumbnail opens a read-only lightbox. The first attachment
editor added a separate row above the input and a sidebar tab, so opening an image
never felt like opening that image: the entry repeated the attachment name, the
sidebar looked unlike the rest of the composer, and a full comment list competed
with the drawing.

The feature still needs to annotate only the current composer image, without
queueing work, sending a message, writing a sidecar, or changing the native upload,
remove and lightbox behaviour.

## Decision

The plugin registers one invisible `conversation.input.overlay` seat per Session.
It listens in the capture phase on the resident composer card and intercepts a
click only when the clicked image's `src` is the current draft's `previewUrl`.
Every other image keeps the host's native lightbox.

An intercepted click opens one portal dialog: the image on a white paper, a dark
vertical tool rail beside it, and a single adjacent comment pill for the selected
mark. The available tools are select, pen, arrow, rectangle, ellipse, Pin, colour,
undo, redo and zoom. A Pin or shape opens one compact comment field; comments are
never rendered in a separate list.

The existing local store, 100-mark cap, PNG exporter, `attachCopy()` admission
checks and stale-result guards remain. “加入输入框” stages one flattened PNG through
the host's ordinary attachment action and closes the overlay; the original stays,
the composer text stays, and nothing is sent. “下载 PNG” remains available for an
older host and does not involve a Session. Removing or submitting the original
attachment, switching Session, closing the overlay or unmounting the plugin clears
the local editing job. Dirty work still needs an explicit discard confirmation.

No dock entry, `sidebar.right.pane.tab`, `tabs.register()` or `openSidebar()` call
remains. PDF, SVG, file, static HTML and loopback-page annotation registrations are
untouched.

## Alternatives considered

- **Keep the dock plus sidebar tab** — it duplicates the native rail, makes the
  image feel detached from its thumbnail and imposes a full side-panel layout on a
  task that is one image plus at most one active comment.
- **Register a whole-app `shell.overlay`** — that surface is global rather than
  Session-scoped and would still need to discover which composer draft was clicked;
  the Session overlay gives the right lifetime and standard input hooks.
- **Replace `conversation.input.attachments`** — this would take over drops,
  uploads, retry, removal and the native lightbox. The overlay is additive and
  reversible.
- **Add an editor to message-history images** — the request is limited to images
  in the current composer, where the resulting copy can still be attached and sent.
- **Own a second attachment/upload queue** — the host already accepts the generated
  File; a plugin queue would change sending semantics and risk sending without the
  user's action.

## Consequences

The visual surface now follows one interaction: click the image, annotate it, and
return to the composer with either a downloaded PNG or one new attachment. Existing
Figmark document annotation registrations and Host routes stay unchanged, and the
feature still introduces no runtime dependency.

The thumbnail bridge has no stable per-attachment id in the shipped attachment
component, so it identifies the intended image by `previewUrl` inside
`[data-composer-card]`. That is deliberately narrow and falls through for every
other image, but a host change to either marker or the preview URL shape requires a
compatibility update. Only one local editing job is retained; an overlay is not a
persistent annotation library, and the attached/downloaded PNG is flattened.

Follow-up: [Numbered comments ride the draft beside the copy](./2026-11-02-attachment-notes-ride-the-draft.md)
keeps the comments searchable after the picture is flattened and removes the
redundant frame around the editor surface.
