# A draft survives the reload; only a delivery removes it

## The correction

An annotation used to live in the tab until it was delivered. Marks were written to
disk in exactly one place — the send path — so anything that ended the tab took an
unfinished annotation with it. Then the marks were cleared *after* delivery too, which
made the two behaviours look alike from the outside: nothing was ever left on disk, and
"the mark came back / the mark went away" was judged by whichever action the reader
happened to take next.

The reader's report sorted them apart: **a reload must keep the annotation; a delivery
must remove it.** Those are opposite requirements on the same file, and only one of them
was implemented — the removal — so the reload looked like a bug in the removal rather
than a missing save.

## What changed

`src/client/autosave.ts` is the missing half. It debounces a write behind the last edit
and serializes writes behind one another, so the file on disk is always the result of
the newest edit rather than of whichever of two writes finished last. A write that would
store what is already stored is skipped, and one that would store an empty annotation is
skipped too: an empty document is what `discard` deletes, so writing it back is exactly
how a cleared annotation would return.

Both bodies own one of these:

- The single-surface body writes an `AnnotationDocument` with its marks and note and no
  review artifact — the flattened picture is derived from the marks and would have to be
  re-rasterized on every pause.
- The PDF body goes through a new `draft` method on its seat, which posts the whole
  document's marks and the note with no annotated copy. Running the PDF writer on every
  keystroke pause would rewrite a multi-megabyte file that a reload never reads.

Writes that win the race against a reload are marked `keepalive` (below the body-size
limit browsers enforce), and `pagehide` plus unmount flush a pending debounce: the last
edit before a reload is the one a reader is most likely to have just made.

`discard` — the clear button, and the tail of a successful delivery — cancels any pending
write and forgets what it thinks is stored. Without that, a debounce scheduled moments
before the delete would fire after it and put the sidecar back.

## Consequences

- The Host's `DELETE` route is now doing exactly one job: "there should be no sidecars
  here". The read path and the write path no longer disagree about whether the marks
  were ever persisted.
- A failed autosave is reported in the status line and forgotten. The next edit schedules
  another attempt; a draft that keeps failing is still on screen, and blocking the surface
  over a disk error would be worse than the error.
- `writeAnnotation` already tolerated a save with no review artifact, and the sidecar
  reader already accepted a document with no marks, so this is a client-side change only.

## Alternatives considered

- **Write on every edit, synchronously.** No debounce means no window in which the last
  edit is unsaved. Rejected because a sentence is dozens of edits: it would be dozens of
  whole-file writes per sentence, each a temporary file and a rename on the Host.
- **Flush only on `beforeunload`/`pagehide`.** The simplest possible draft. Rejected
  because a crash or a killed tab never fires either event, and that is precisely the
  case a draft exists for.
- **Store the draft in `localStorage` instead of the sidecar.** No Host round trip, so it
  could not fail. Rejected because the sidecar *is* the annotation: a delivered message
  names its paths, and a draft in browser storage would have to be re-uploaded before it
  could be sent, splitting one document across two stores.
- **Save the annotated copy on autosave too.** That would make the file on disk complete
  at all times. Rejected because it re-runs the PDF writer (and the rasterizer, for a
  PNG) on every pause, for an artifact that is derived and rebuilt on delivery anyway.
- **Keep the "clear on reload" behaviour and only add the delivery clear.** Rejected on
  the reader's own instruction: reloading a tab is not an action on the annotation, and
  losing work to it is the failure, not the feature.
- **Mark every autosave `keepalive`.** Rejected because browsers cap a `keepalive` body
  (64 KiB here, so 60 KB with headroom) and a large PDF annotation exceeds it; the
  request would be dropped, and a dropped save is worse than an ordinary one because the
  caller believes it succeeded.
