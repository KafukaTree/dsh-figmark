# Sending a figure's annotation without saving it first

Status: implemented 2026-10-20.

## Problem

The panel offered two buttons, 仅保存 (save only) and 保存并提交给智能体 (save and
send to the agent). Both framed the annotation as a file the user was producing.
In practice an annotation is almost never a document the user wants to keep: it is
a message — "this axis label is wrong", "move this arrow left" — and the file is
only the carrier. Save-first made the common case the slow one, and it asked the
user to think about a path they never wanted to look at.

The second framing was also wrong in the other direction: submitting straight to
the session means the reader cannot add a sentence of their own, drop a picture,
or change their mind. What they asked for was a chance to write, then send.

## Decision

Two buttons, neither of which is a save:

- **发送给智能体 (send to agent)** — the existing delivery: the message is handed
  to the session's queue, pictures and annotated copy attached.
- **发送到对话框 (send to composer)** — the message and its pictures are written
  into the composer's draft. Nothing is submitted; the reader presses Enter.

The Host still writes the sidecar and the review copy on both paths, because that
is what the message refers to. What changed is that the original figure is never
touched (it never was — `src/host/store.ts` only ever writes `paths.annotation`
and `paths.review`) and that neither path asks the user to think about those paths
as something to keep.

## How the draft is written

`ctx.get('conversation')` is the conversation service. Its `input.shell(id)` is
the per-session input shell, and the shell is the only safe way into the composer:

- `shell.snapshot.draft` reads what the reader already typed.
- `shell.setDraft(text)` replaces the draft (the caret lands at the end).
- `conversation.createDrafts(sessionId, files)` stages files in the draft registry.
- `shell.addAttachments(ids)` puts the staged ids in the attachment rail; it returns
  false while a send is in flight, and then the drafts are released again.

The composer is a Lexical editor whose revision counter and command chips live
outside the DOM. Writing `[data-composer-input]` directly would desynchronise both,
so it is not done — not even as a fallback.

The message is **appended**, not substituted: a half-written sentence in the box is
the reader's, and a button press is no reason to lose it. Attachments are staged
before the text is written, so a refusal leaves no text naming pictures that are
not in the rail.

Annotated PDFs travel as one more staged file, named after the review copy the save
wrote (`report.pdf.annotated.pdf`), so the rail shows what the message talks about.

## Alternatives considered

- **Keep 仅保存 and add a third button.** Rejected: the user's complaint was that
  saving is the wrong default, not that it was missing. Three buttons for two ideas
  would have kept the wrong frame and made the panel noisier.
- **Write the draft by dispatching input events at the composer DOM.** Rejected:
  the editor owns a revision counter and a chip model that the DOM does not carry;
  a synthetic edit desynchronises `draftRev`, which breaks the next `insertText`.
- **Use the `inputActions` standard prop instead of the service.** That prop is
  published per session through `uiSession.provide` and reaches slot components
  rendered inside the session view. The right-pane document tab is rendered by the
  sidebar, not by the renderer's prop plumbing, so the service is the reachable
  path. Re-publishing the prop would collide: `uiSession.provide` rejects a
  duplicate `inputActions`.
- **Call `shell.actions.submit()` after filling the draft.** Rejected: that is the
  "send to agent" button under a different name. The whole point of the second
  button is that the reader still has to press Enter.
- **Overwrite the draft with the message.** Rejected: silently discarding typed
  text is a worse failure than a long draft, and the reader can always clear it.
- **Write the original file with the annotation burned in.** Rejected: the user was
  explicit that the original is not to be overwritten. The sidecar is the record;
  the figure stays as generated.
