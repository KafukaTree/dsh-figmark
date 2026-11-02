# Note: Numbered comments ride the draft beside the copy

Status: implemented

## Problem

The composer thumbnail overlay flattened every Pin comment into the PNG legend,
but “加入输入框” only staged that PNG. Pressing the host's own send therefore
delivered a picture whose comments were pixels, not user text: the model had to
read them from the image, and an OCR failure silently lost the actionable part
of the annotation. The editor also wrapped the image, toolbar and actions in a
large rounded frame, adding a surface the interaction did not need.

## Decision

One admission operation now stages the annotated PNG and appends a numbered
comment summary to the existing composer draft. The summary uses the same
per-kind ordinals as the image and the existing `describeMark()` wording, so a
line such as `Pin 1 ... 批注：把套筒上移` names the mark the reader can see.
Existing typed text stays in front of the summary. If the draft write fails, the
operation restores the old draft and releases the newly created attachment, so
the composer never promises a picture or note it did not accept.

The modal keeps a dimmed backdrop and the same interaction, but the image has no
outer card, border, rounded paper or shadow. The close action joins the floating
tool rail; the two output actions are small floating buttons below the image, and
status or error text appears above them only when it has something to say. This
leaves the picture, its marks and the tools as the only persistent editor
structure.

The per-mark comment field uses the existing annotator's single rounded input
pill: no title row, explanatory footer, close button, delete button or hand-off
buttons. Escape closes the field, Delete removes the selected mark, and the
normal send flow carries the comment once it has been written into the draft.

## Alternatives considered

- **Keep comments only inside the PNG legend** — a raster legend is neither
  reliably searchable nor independently editable; the model can miss it without
  any visible failure.
- **Send a second message from the plugin** — this bypasses the reader's own send
  action and breaks the established promise that attaching a copy never submits.
- **Replace the whole draft with the summary** — it discards the sentence the
  reader was already writing, including any reason the image was attached.
- **Keep the old framed dialog and only remove its border** — the header, footer
  and filled surface still read as a separate app panel rather than the opened
  image itself.

## Consequences

The draft becomes visibly longer after “加入输入框”, but every comment remains
editable before send and the reader can see exactly what will accompany the
picture. The host must expose its native `setDraft` action; a missing or throwing
write refuses the result and rolls back the attachment. The flattened PNG still
contains the comment legend for readers who download it independently. Existing
PDF, SVG, file, HTML and loopback-page annotation paths remain untouched.
