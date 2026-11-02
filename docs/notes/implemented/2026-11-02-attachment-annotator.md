# Note: Independent composer-image annotation

Status: implemented (review build; native DSH smoke test pending)

> The interaction was replaced by the composer-thumbnail overlay in
> [Composer thumbnail annotation overlay](./2026-11-02-attachment-overlay-editor.md).
> The storage, export and admission decisions below still apply.

## Problem

Composer image thumbnails open the host's read-only lightbox. Attaching an image should also allow quick drawing and Pin comments, without starting an Agent turn or inheriting file-review queues and sidecars.

## Decision

An additive `conversation.input.dock` entry lists current image attachments and opens a dedicated `dsh-figmark-attachment` sidebar type. The native attachment rail, lightbox, drops and existing Figmark renderers keep their registrations. The client entry adds only an import and one registration call.

The editor owns a revocable preview URL made from the retained File, so removing the host attachment cannot invalidate a later download. It never revokes the host’s preview URL.

The editor borrows only Canvas, pure geometry/rendering, styles and local undo primitives. Its store belongs to the plugin lifecycle, holds one explicitly opened original File with an editable overlay, rejects stale editors’ overlay writes, survives sidebar remounts and is cleared only by explicit finish/discard or plugin disposal. A second image/session cannot overwrite an unfinished draft. Session mismatches render an empty instruction screen instead of another Session's image.

PNG generation happens only on an explicit completion/download click. Pin comments appear in an escaped, wrapped legend below the drawing; no comment text is injected into the composer or a model prompt. Canvas output never exceeds 8192 pixels per edge or 16 million pixels, and is never upscaled. There are at most 100 marks and 1000 characters per comment.

“加入输入框副本” creates an ordinary inline image draft through the host's `createDrafts(sessionId, files, false)` and stages its id through the injected `inputActions.addAttachments`. Inline images support subagent continuations without introducing plugin-owned uploads. The host still performs its ordinary validation/admission when the user sends. The original is retained: the presentation owner callback has no admission receipt and the public action face has no atomic replace/CAS operation. Rejected additions release only the new ids.

Before staging, the editor checks its mount/job identity, current Session/phase/source id, actual editor visibility where supported, unchanged annotation revision and the live original File in the host registry. Completion never calls `submit`, `send`, prompt APIs, `setDraft`, queue management, autosave, or the previous parked-card machinery. Keyboard handlers are scoped to the editor and leave text fields' editing/undo intact. Drawing is paused during rasterization; newly placed Pins/shapes focus their comment, while pen stays armed. Dirty discard needs a local second click.

## Alternatives considered

- **Reuse AnnotatorBody** — it couples file autosave, sidecars, delivery and parked-card flows to the image; the new operation needs none of them.
- **Replace the native attachments slot** — that would also replace drops, upload retry, removal and the official lightbox. Current host contracts have no per-thumbnail edit action; an additive entry is smaller and reversible.
- **Patch submit or insert a queued prompt** — user intent is to edit an image, not start or intercept a conversation turn.
- **Remove the original before adding the copy** — a refused intake would lose the attachment; there is no atomic replacement API.
- **Rebuild from the displayed thumbnail** — loses source pixels and mixes screen zoom with figure coordinates.

## Consequences

Existing Host code, routes, system-prompt registration, sidecar names, body identities, HTML/PDF and delivery logic are unchanged. New code has no runtime dependencies. Older hosts without the required draft methods show a compatibility hint.

This first version keeps one local editing draft. It is not a persistent annotation library: reload/plugin unload discards the overlay, and “结束并清除批注” clears editable layers. A downloaded/attached PNG is a flattened copy. Animated sources are not frozen during editing. Native host image limits may still reject an oversized copy on send; the editor retains the original and offers download. The standalone real-browser harness could not run in this environment: the cloud browser cannot reach the local server and the Chromium download returned invalid archives. Unit/DOM and bundle-contract tests pass, but this build must be tested inside the user's DSH version before merging.
