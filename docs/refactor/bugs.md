# Bugs found while refactoring

The refactor is not allowed to change behaviour, so these were recorded rather
than fixed. A fix is a behaviour change and needs its own decision, its own
test, and its own note — it does not ride along inside a file split.

Each entry names where it is, what makes it happen, and what the reader sees.
Severity is about the reader, not about how interesting the bug was to find.

Findings marked "shown" were reproduced against the tree they were found in,
not inferred from reading. Where one was *not* reproduced, it says so.

The PDF and Markdown chains have their own file, `pdf-md-bugs.md` (12 entries);
they are not repeated here. Between the two files, the high-severity findings
cluster on two mistakes: **switching documents does not reset the state that
belonged to the old one** (findings 19 and the PDF set), and **a per-mark
gesture running the whole-figure path** (findings 13 and 15).

## Open

### 1. Clearing or delivering an annotation does not always make it stay gone

Two faults with one symptom: the reader clears the panel, or sends the marks to
the agent, and the next time the figure is opened the marks are back.

The first is a race. `cancel()` in `src/client/autosave.ts:83` clears the
pending timer and nothing else — the write chain is untouched. `discard()` calls
`cancel()` and then `deleteAnnotation(address)`. If a write is already on the
chain (the timer fired a moment ago and `deps.write()` is in flight), the delete
lands first and the write recreates `<name>.annot.json` afterwards. Both bodies
do this on the delivered path: `AnnotatorBody.tsx` in `run()` for the agent and
the composer branch, and `PdfBody.tsx` likewise.

The second is a missed delete. `removeAnnotation` (`src/host/store-write.ts:99`)
removes the two current sidecar paths. `readAnnotation` (`src/host/store-read.ts:52`)
reads those *and* the legacy base-name file — `fig1.annot.json` beside
`fig1.svg` — plus, for a paged document, every merged `report.pdf.p3.annot.json`.
So an annotation saved by an older version of this plugin is still readable after
a clear, and is read back as if the clear never happened.

Reader impact: marks reappear on a figure the reader cleared, or come back after
being delivered — which reads as "my clear did not work". Severity: medium.
Both faults are narrow (one needs a write in flight, the other needs a sidecar
written by an older version), but the symptom is the same and it is the reader's
own data.

Shown: driving `createAutosave` directly, `flush()` then `cancel()` while the
write was blocked still ran it to completion (`['start','finish']`); and with a
legacy base-name sidecar in place, `removeAnnotation` reported `removed: false`
and `readAnnotation` then returned the mark that was supposed to be gone.

### 2. A save races the digest it compares against

`src/host/routes.ts` GET branch reads the figure's digest and the annotation
sidecar with `Promise.all`. The digest describes the figure as it was at that
moment; the sidecar describes it as it was when the annotation was written. If
the figure is rewritten between those two moments — a plotting script left
running, a render that lands while the panel is open — the browser receives the
new fingerprint beside the old marks. `AnnotatorBody` then compares them
(`AnnotatorBody.tsx:990`) and reports the annotation as current when it is not,
so marks land on a picture they were not drawn on.

Reader impact: marks silently move onto the wrong picture. Severity: medium,
narrow window.

### 3. An absolute address reaches any file the process can stat

`src/host/figure-target.ts` resolves a request in one of two ways: a relative
path against the session's directory, or an absolute path as given. The
absolute branch never consults the session directory at all. Anything holding
the guard header — which is every same-origin page in the app — can therefore
make the host `stat` any path on the machine and learn whether it exists and is
a regular file.

This is by design as far as reading goes: the plugin's whole job is to open a
figure the user pointed at, and `dsh-resource://file/absolute/...` addresses are
exactly that. What is not by design is that the reply distinguishes "no such
figure" from "not a regular file", which turns the route into a existence
oracle. Severity: low — no write path is reachable, and the container is the
user's own machine.

### 4. Clicking a placed element mark selects it and then deselects it

An `element` mark paints nothing — no stroke, no frame, no hit box, by design
(a box around a curve is a rectangle the figure never draws). So a press on one
lands on the overlay `<svg>` itself, and `start()` finds it by asking the figure
what is under the pointer (`src/client/canvas/gesture.ts:225`). `beginGesture`
selects it and then returns early at `:168`, because an element mark cannot be
dragged — but that early return leaves `drew.current` false.

The browser then dispatches the `click` that ends a press/release pair, with the
overlay as its target, so `onClick` passes its guard (`:375`), finds neither a
pan nor a draw, and runs `onSelect(null)` (`:388`). Selecting and deselecting
happen in one gesture: the comment pill never opens on a placed element.

Drawing an element mark is protected — `drew.current = true` at `:265` — which is
why only *re*-selecting a placed one is broken.

Reader impact: an element mark can be placed but not reopened; the only way back
to its comment is to delete and redraw it. Severity: medium.

Shown: mounting the surface with one placed element mark and dispatching
pointerdown, pointerup, click recorded `onSelect` being called with `["e1"]` and
then `[null]`.

### 5. The control frame of a turned mark is turned twice

`controlBox` (`src/client/canvas/hit.ts:70`) returns
`uprightBounds(mark.points, mark.rotation)`, and `uprightBounds`
(`src/client/mark-geometry.ts:132`) already rotates the box's four corners and
returns their axis-aligned extent. `handlesFor` (`src/client/handles.ts:87`) then
rotates that box's corners by `mark.rotation` *again* about its centre — its own
docstring says the box it is given is "in the mark's own upright frame".

`handleAt` and `tetherFor` take the same box, so the drawn handles, the turn
tether and the grab test all move together and stay consistent with each other.
What they are inconsistent with is the mark: the frame sits off the shape.

At zero rotation the two cancels out exactly, which is why every test passes:
`tests/handles.spec.ts:148` hands `handlesFor` an un-rotated box, so it is
testing the contract `controlBox` violates rather than the call site.

Reader impact: select a turned arrow or box and the eight handles float away
from its corners. The rotation angle itself is unaffected (it is measured from
the true centre, which a rotated rectangle's AABB shares), so the mark does not
jump — it just reads as the frame being drawn wrong. Severity: medium.

Shown: for `points = [[0,0],[200,100]]` at 90°, the corners are drawn at
`(200,0) (200,100) (0,100) (0,0)` while the true rotated corners are
`(150,-50) (150,150) (50,150) (50,-50)` — the north-west handle is 70.7 figure
pixels from where it is drawn. At 45° the error is comparable.

### 6. Pointer-anchored zoom uses a top margin the CSS does not have

`zoom.ts:26` defines `SURFACE_MARGIN = 12` and documents it as mirroring
`.da-surface{margin:12px auto}`. The real rule is
`.da-surface{position:relative;flex:0 0 auto;margin:0;transform-origin:top left}`
inside `.da-stage{display:flex;align-items:safe center;justify-content:safe center;…;padding:14px}`.

`anchoredScroll` handles the horizontal axis properly: `surfaceOffset` resolves
the centring for the current width. The vertical axis hardcodes the constant
(`zoom.ts:128` and `:131`). The true vertical offset is
`(stageHeight - surfaceHeight)/2` while the surface fits, and `14` once it
overflows — never 12. For a 300px-tall paper in an 800px stage the assumed
offset is wrong by about 238px, so a wheel zoom drifts the point under the
cursor vertically by roughly that much times the zoom ratio.

`tests/zoom.spec.ts:83` cannot catch it: the spec recomputes the expectation
with the same `SURFACE_MARGIN`, so it is a tautology with respect to the CSS.

Reader impact: zooming with the wheel or a pinch slides the picture vertically
under the cursor instead of holding the point still. Horizontal anchoring feels
correct, which makes it read as "the vertical is sticky". Severity: medium.

### 7. A saved annotation can be too large to read back

Nothing caps the strings on the write path: `detail` (`src/host/store-schema.ts:184`),
`id`/`title`/`text` (`:69`) and `summary` (`:240`) are all unbounded. The read
path refuses any sidecar over `MAX_ANNOTATION_BYTES` (4 MiB,
`src/host/store-limits.ts:14`) and maps that to `null`, the same answer as
"never annotated".

A single long `detail` — a pasted paragraph, a pen mark with a long note — gives
a sidecar the plugin writes with a 200 and then reports as absent on the next
open. The reader loses the marks and is told there were none.

The read path is also silent about the distinction: `readSidecar`
(`src/host/store-read.ts:124`) catches and returns `null` in two places, so an
oversized sidecar is indistinguishable from a missing one.

Reader impact: total, silent loss of a save the plugin just acknowledged.
Severity: medium — it needs a large paste, but there is no warning when it
happens and no way back once the panel is reopened.

Shown: writing a document with a `detail` of 5 MiB returned a normal write
result, and `readAnnotation` on the same figure then returned `null` — the same
answer as a figure that was never annotated.

### 8. A malformed request target throws outside the try

`src/host/routes.ts:130` parses `new URL(req.url ?? '/', 'http://localhost')`
before the `try` that turns failures into a 400. A target like `//[` reaches
`req.url` unchanged and makes the constructor throw, so the handler's promise
rejects instead of answering.

In the real composition the DSH web server wraps handlers and answers 400 for
them, so a live request still gets a response — this is a defect in the plugin's
own contract ("a handler must not reject"), not a hang. Severity: low for that
reason.

Shown: with the guard header set, a target of `//[` made the handler's promise
reject with `TypeError: Invalid URL` instead of answering. The mock `res` in that
probe received nothing, which is the contract break; under the real server the
wrapper turns the rejection into a 400.

### 9. A markdown note is labelled with the hunk's first context line

Notes are keyed by `hunk.oldStart` — `DiffView.tsx:53` reads
`notes[hunk.oldStart]`, and `describeNotes` (`src/client/edit-message.ts:98`)
looks them up the same way. `buildHunk` sets `oldStart` to the first line *in the
hunk*, which with the default three lines of context is up to three lines before
the edit.

So a change on baseline line 9 produces `@@ -6,7 +6,7 @@`, the reader types the
note beside that hunk, and the agent reads "第 6 行（@@ -6,7 +6,7 @@）：…". The
header is there, so the precise location is recoverable — but the line number
that leads the sentence, and that the reader typed the note against, names
context rather than the change.

The key is also not unique per change: any two edits whose hunks happen to start
on the same line share one slot. Shown against a 30-line document, five
different single-hunk changes — a modification at line 9, a second modification
at line 9, deleting line 9, inserting a line before line 9, appending a line
after it — all produce `oldStart = 6`, so one note written for the first is
reproduced verbatim beside each of the others. Nothing distinguishes "the change
at line 9" from "the insertion before line 9".

Reader impact: the agent is told the wrong line as the headline, and a note can
accompany a change it was not written about. Severity: medium — this is the
channel the whole plugin exists to fill.

### 10. Element marks grow the measured outline by a stroke they never paint

`markOutline` (`src/client/render.ts:388`) grows every box by
`strokeWidthOf(mark, unit) / 2` unconditionally. An `element` mark paints no
stroke at all, and `elementMark` (`src/client/canvas/marks.ts:152`) deliberately
omits `weight` for exactly that reason — but `strokeWidthOf` falls back to
`mark.weight ?? 1`, so the half-stroke growth happens anyway. The comment
describes a guarantee the code does not provide.

Two consumers are affected. `plot.ts:60` uses the outline for the paper size: an
element mark whose box touches the figure edge — an axes frame, a background
patch, a full-width curve, all routine element picks — grows the paper, which
flips `grown` at `export.ts:151` and draws the grey dashed figure-edge rule into
the delivered picture plus a 12px margin. `AnnotatorBody.tsx:838` uses it for
comment-pill placement, pushed out by the same invisible amount.

Reader impact: a delivered picture carries a dashed "the figure edge is here"
rule that nothing reached past. Severity: low — it needs an element whose box
touches the figure edge, which is routine (an axes frame, the background patch),
and the rule plus a 12px margin then appears on a picture the reader sees nothing
wrong with.

Shown: an 800×600 figure with an element mark naming the background patch —
`points [[0,0],[800,600]]` — measured as `x −1.25, width 802.5`, which grew the
paper to 826.5×626.5, and `composeReviewSvg` then emitted the dashed rule. Note
that the growth is 1.25 per side rather than the 0.8 the weight would predict:
`strokeWidthOf` also folds in `unit`, so the phantom stroke is scaled by the
figure's size like a real one.

Note: `tests/render-export.spec.ts:36` asserts the growth (`box.width > 50`,
`box.x < 10`), so a fix has to update that test.

### 11. The panel and the delivered picture draw marks at different weights

`Canvas.tsx:48` derives its pen from the *paper* (`figureUnit(width, height)`
over the paper's size). `AnnotatorBody.tsx:584` derives its own from the
*figure*, and that is the one the popover and the plotting bounds use;
`export.ts:140` likewise uses the figure.

The two agree until a mark grows the paper. After that the panel draws strokes,
pins and hit areas thicker than the PNG the agent receives. Shown with an 800×600
figure carrying one rectangle out at x≈1980: the paper grows to 1993×600, so the
panel's pen is `figureUnit(1993, 600) ≈ 2.49` while the export's is
`figureUnit(800, 600) = 1` — marks come out 2.5× thicker in the panel than in
the delivered picture. That contradicts `export.ts:5` ("the picture the agent
receives is exactly the picture the user approved") and `Canvas.tsx:42` ("every
mark on this canvas shares one figure").

Pre-existing rather than introduced by the refactor: baseline had the same code
at the old `Canvas.tsx:287`. Severity: low.

### 12. Mark numbers are threaded into the export but only drawn for points

`composeReviewSvg` builds a number for every mark (`export.ts:137`) and passes
`numbers.get(mark.id)` into `markSvg` (`:165`), but `markSvg` only emits a
`<text>` inside the `point` branch (`:67`). Stroke marks are drawn with no
number. The overlay behaves the same way, so panel and export agree with each
other — but `render.ts:16` claims the number is "the one thing drawn here that is
not the reader's shape… a list of marks is read as '1, 2, 3'", and the message
the agent receives *is* numbered.

Reader impact: on a figure with several arrows the agent gets numbered prose and
an unnumbered picture, so "the second one" has to be matched by position.
Severity: low. Worth confirming the intent before calling it a fix: the numbers
may have been meant for the message only.

Shown: `composeReviewSvg` over one arrow (numbered 1) and one pin (numbered 2)
emitted exactly one `<text>` node, containing `2`. The arrow's number reaches
`markSvg` and is dropped there.

### 13. Sending one comment from its pill destroys every other mark

`run()` narrows what it *posts* when it is given a mark — `const scope = only ===
undefined ? marks : [only]` (`AnnotatorBody.tsx:1254`) — but its tail is the
whole-figure path: after a successful hand-off it calls `await discard()`
(`:1286`, `:1303`), which issues `DELETE` on the sidecar, does `commit([])` and
`writeSummary('')` (`:1222-1237`). So the other marks are removed from the
surface *and* their sidecar is deleted, replaced by one holding only the mark
that was sent and no summary at all.

The comment pill's two buttons go to `run('agent', selected)` (`:1802-1803`).
The toolbar's send is the whole-figure hand-off; the pill's is not, and the
design note this feature came with says so: "the button sits beside one
comment, so it means that comment. The bar keeps the whole-figure hand-off"
(`docs/notes/implemented/2026-10-23-a-comment-on-the-spot.md:38-39`).

Reader impact: draw three arrows, write a comment on one, press the pill's send
— the other two arrows and the figure's own summary are gone, and the delete is
on disk, so nothing brings them back. Severity: high; one click loses work the
reader cannot recover.

Shown: two arrows with a sentence each, the second one selected; pressing
`.da-comment-send-primary` took the surface from two marks to zero, issued
exactly one `DELETE`, posted `marks: ["第二条"]` only, and reported
"已发送给智能体，标注已从面板清空".

### 14. The comment pill's send always fails inside a PDF page

A page body is mounted with `page={...}`, no `content`, and `onSend={run}` owned
by `PdfBody`. The host-load effect returns early when `isPage`
(`AnnotatorBody.tsx:643`), so `loaded` stays `null` and `buildDocument` returns
`null` for the life of the body (`:1150`). `run` then throws
`new Error(t('loadFailed'))` at `:1260` and reports it as a save failure
(`:1305`). Nothing in `run` defers to `props.onSend`, and the pill is not gated
the way the toolbar is — `chrome.tsx:264` hides the bar's two sends in a page
body with no `onSend`.

Reader impact: open a PDF, select a mark that carries a comment, press 发送给智能体
in the pill: nothing is saved, nothing is sent, and a red line says
`保存标注失败：读取附图失败` — blaming the figure, not the button. Every time, on the
document type the pill was added for. Severity: high; a labelled primary button
that can only fail.

Shown: a page body with one commented mark in its draft. The pill rendered both
buttons; pressing the primary one recorded `prompts = 0`, zero `POST`s and the
status line above. The toolbar's send, via the same page body, is hidden.

### 15. Clear on a paged document deletes the sidecar while other pages keep their marks

`onClear` in a page body is `() => { void discard() }`
(`AnnotatorBody.tsx:1785`). `discard` knows only `address`, which for a page
body is the *document's* address, and its own draft: it deletes the document
sidecar, `commit([])`s the page on screen, and blanks the document summary. It
never consults `props.onDocumentRemove` for the other pages' marks, and
`PdfBody`'s own `cleared` (`PdfBody.tsx:281`) — the callback that drops every
page and bumps the generation — is never reached from here.

Reader impact: in a document with marks on several pages, press clear from the
list: the sidecar file is deleted, the page on screen empties, and the rows for
the other pages stay — while the document's summary is blanked. The reader has
no consistent account of what just happened, and the next autosave rewrites a
sidecar holding the survivors under an empty summary. Severity: high; it damages
a file and half-clears a document.

Shown: a page body handed `documentMarks` of two marks and an `onDocumentRemove`
recorder. Pressing clear issued one `DELETE`, left both list rows standing, and
called `onDocumentRemove` not once.

### 16. A stroke drawn before the sidecar read lands is thrown away

The figure is drawable as soon as it decodes, which is independent of the
annotation read. When that read resolves, `history.replace(result.annotation.marks)`
(`AnnotatorBody.tsx:651`) overwrites `marks` wholesale. Anything drawn in the
window between the two is replaced by whatever the read returned — silently, and
without a step to walk back to, because `replaceMarks` changes the current marks
and nothing else.

Reader impact: on a slow disk the reader draws an arrow and it disappears a beat
later, replaced by the saved annotation. Nothing was written and no message says
the stroke was dropped. Severity: medium; the loss is one gesture, but the
reader watches it happen and cannot tell why.

Shown: a deferred read; one arrow drawn (surface held mark `mmvsh8w4w-1`); then
the read answered with a saved document — the surface held `old` and the drawn
arrow was gone.

### 17. Redo survives an edit to a comment, so a redo throws the sentence away

`amend` applies the typing without recording a step — by design — but it also
leaves the redo trail alone: `{...history, marks: update(history.marks)}`
(`annotator/history.ts:152-154`). Every other mutation that changes `marks` goes
through `commitMarks`, which sets `future: []` (`:60-66`). So after an undo
followed by typing, `future[0]` is still a snapshot of `marks` taken *before*
the sentence existed, and one redo restores it.

Typing reaches this path from `setMarkDetail` (`AnnotatorBody.tsx:944`).

Reader impact: undo once, type a sentence into the mark that is left, then press
redo (or ⌘⇧Z): the sentence disappears and there is no redo left to bring it
back. Severity: medium; it is the reader's own words, lost by an unrelated key.

Shown: draw two arrows with a sentence each, ⌘Z (two marks → one), select the
survivor, type `改过的说明` (present in the DOM), ⌘⇧Z — the sentence is gone and
the mark count is back to two.

### 18. An error line stays on screen after the condition clears

`status` is only ever assigned a message: twelve `setStatus` calls in
`AnnotatorBody.tsx`, and no `setStatus(null)` anywhere. The line is rendered
whenever it is non-null (`:1685`). A failed debounced write reports at `:1206`;
a later successful write of the same annotation reports nothing, because there
is nothing to report, and leaves the red text in place.

Reader impact: a save fails once — disk full, a host hiccup — and the next one
succeeds silently while the panel still reads `保存标注失败：磁盘满了`. The reader
either redoes the work or gives up on the annotation, believing it is not being
saved. Severity: medium; the panel states something false about the reader's
own data.

Shown: the first autosave `POST` answered `{ok: false, error: '磁盘满了'}`, a
second edit produced a second, successful `POST`, and the status line still read
`磁盘满了`.

### 19. Opening a second figure keeps the first figure's marks

The load effect is keyed on `address` (`AnnotatorBody.tsx:667`), so it is
written to run again for a new figure — but its `if (result.annotation !== null)`
branch (`:652`) has no `else`, and `marks`, `summary`, `createdAt` and `stale`
all keep the previous document's values when the new one has no sidecar. The
autosave write then builds a document from those marks under the *new* address.

Reader impact: open figure A (annotated), then figure B (never annotated): B
shows A's mark with A's sentence, and one stroke writes a sidecar under B's name
carrying A's mark, A's summary and A's `createdAt`. Severity: medium; the wrong
annotation lands on the wrong picture.

Inferred, not driven on a live shell: re-rendering the same root with a new
`resourceAddress` — which the effect's dependency list anticipates — reproduces
it. Whether the sidebar re-uses one body instance for a new document instead of
remounting it decides whether a reader can reach it; the shape is the same as
the known PDF document-switch fault, at a third site.

### 20. Deleting another page's mark cannot be undone

A mark that belongs to another page is removed through the owner:
`props.onDocumentRemove(id)` and a return, with no `commit`
(`AnnotatorBody.tsx:927-930`). The owner's `removeAnyMark` is
`setMarks(current => withoutMark(current, id))` (`PdfBody.tsx:229-231`) — plain
state, outside the page body's history, which only covers the page it shows.

Reader impact: in a PDF's document-wide list, rows for other pages carry the
same ✕ as the current page's. Deleting one is permanent while deleting a row
from the current page is undoable — the same gesture, opposite consequences, and
no cue which is which. Severity: medium; silent, unrecoverable loss of one mark.

Inferred from the code path; the probe showed the undo button staying disabled
after a foreign row was removed and enabling after an own one.

### 21. The selected element mark is never lit harder when the body owns its selection

`litSpots` passes `props.selectedId` into `collectLitSpots`
(`AnnotatorBody.tsx:1500`), where the selection test is `input.selectedId ===
mark.id` (`annotator/spotlights.ts:45`). But the resolved selection is
`props.selectedId ?? ownSelectedId` (`:268`): a body with no owner — the
image, SVG and HTML bodies register no `selectedId` — always hands over
`undefined`, so `selected` is always false. The memo's dependencies
(`[findElement, marks, props.selectedId]`) omit the body-owned selection too, so
it is not even recomputed when it changes.

Reader impact: selecting an element mark from the list lights the element but
never with the stronger ring that tells "the one you picked" from "the one the
picker is hovering", so in a figure with several marked elements the two states
look the same. Severity: low; an emphasis that is simply never applied.

Shown: an uncontrolled body with one element mark — `da-spot` on the element,
`da-spot-selected` never, both before and after selecting its row (whose
`data-selected` was true).

### 22. A drag that ends where it started records an undo step that changes nothing

`patchChangesNothing` compares `mark[key] === patch[key]` for each key
(`annotator/mark-edits.ts:26`). Every patch field is a primitive except `points`,
which a geometry gesture always hands over as a fresh array — so an identical
geometry compares unequal.

Reader impact: nudge a mark and put it back, then press undo: the first press
pops a step that changes nothing visible, so the reader presses again and jumps
back two edits instead of one. Severity: low; a confusing first undo.

Shown at the predicate: an identical `points` array is reported as a change
(`patchChangesNothing` → false), which is exactly what its own header says it
avoids — see the comment drift below.

## Fixed during the refactor

None yet: a fix would be a behaviour change, which is what this refactor exists
not to make.

## Checked and found not to be bugs

Recorded so the next reader does not re-investigate them.

- **A double-click on the overlay conflicting with per-mark double-click.** Every
  drawn mark's hit path stops propagation on `dblclick` (`canvas/overlay.tsx:212`),
  and the overlay's own handler only answers for element marks found by asking
  the figure. A double-click on an ordinary arrow never reaches it. (The one
  loose end is a consequence of finding 4, not a conflict.)
- **`markPathData` returning `undefined` for element marks.** Both callers guard:
  `canvas/overlay.tsx:202` and `export.ts:56`. `markTransform`'s `undefined` is a
  legitimate React SVG prop.
- **`lightMarkup` injecting a `<style>` beside an existing one.** A `<style>` is
  legal as a direct child of `<svg>`, it is prepended ahead of any `<defs>`, and
  it runs exactly once on pristine markup, so it cannot double-inject. Class
  collision needs a figure that itself uses `.da-spot`; injecting first means an
  author rule of equal specificity still wins.
- **The element-pick path producing the wrong number of undo steps.** It adds
  exactly one mark through `commit`, and sets `drew.current` so the trailing click
  is consumed rather than clearing the selection. (That is why finding 4 survives:
  the *draw* path is guarded and the *select* path is not.)
- **Path traversal through the sidecar naming.** `sidecarPaths` uses `basename` +
  `dirname` + `join`, so the name comes from the figure's own last segment and
  cannot inject separators. `legacyPagePattern` escapes its literal parts and is
  anchored, so a figure named `a.*` cannot widen the match.
- **The guard header leaking past the method dispatch.** `guarded()` is checked
  once at `routes.ts:126`, before the dispatch, and all three methods plus the 405
  fallback live behind it. The header's *value* is never compared, which matches
  the stated threat model: a header a cross-origin form cannot set without a
  preflight.
- **Legacy per-page PDF sidecars bleeding across figures.** `readLegacyPages`
  requires the file name to match the anchored pattern for this figure and
  `annotationTargetsFigure` to agree on the base name, and it re-stamps the page
  number from the file name rather than trusting the JSON. (The *deletion* gap is
  finding 1.)
- **`text-diff` line numbering.** A 40 000-case fuzz over random line edits found
  no duplicate `oldStart` or `newStart`, and the zero-count `@@` forms
  (`@@ -0,0 +1,1 @@`) are correct. (The *note key* is finding 9; the diff is fine.)
- **A PDF text layer.** There is none: no `getTextContent` anywhere in the repo.
  AGENTS.md §7.5 records "one page at a time" as a product boundary, so character
  offsets and selection restore are out of scope rather than broken.
- **Markdown and `RENDER_WIDTH`.** `RENDER_WIDTH` is used only by `html-dom.ts`
  and the html branch of `AnnotatorBody`. Markdown is a `<textarea>` and produces
  no annotation coordinates, so the fixed-render-width reflow concern does not
  apply to it.
- **Autosave racing an explicit save in the same panel.** `run()` saves first and
  only then cancels the autosave, but the write closure re-reads `live.current`
  and skips when the signature is unchanged, so the loser writes identical bytes.
  Two *panels* saving is last-writer-wins; each write is atomic, so the file is
  never torn.
- **`DEPTH = 50` on every path that can grow a stack.** `commitMarks` trims
  `past`, `undoStep` caps `future`, `redoStep` trims `past` again
  (`annotator/history.ts:60-66, 89-97, 104-112`), and each returns the same
  value when there is no step, so a spurious render cannot grow either stack.
- **The autosave signature guard.** Loading schedules no write, a re-render with
  unchanged marks schedules none, and empty marks plus an empty summary writes a
  delete rather than an empty sidecar.
- **The keyboard guard.** Backspace, Escape and ⌘Z inside a `TEXTAREA`/`INPUT`
  leave the marks alone (`AnnotatorBody.tsx:1102-1136`).
- **The weight rail on an element mark.** It stands down, and asking for the
  weight a mark already wears records no step.
- **`collectLitSpots` rebuilding and deduping by selector.** A mark that outlives
  the element it names goes dark instead of lighting a stale one.
- **`handleAt`'s comment contradicting its tie-break.** The comment says a corner
  beats the edge handle it shares a position with, but `distance <= bestDistance`
  lets the later handle win, so an edge would beat a corner. The two never
  coincide geometrically, so nothing observable changes; only the comment is
  wrong.

## Wording that no longer matches the code

Found while auditing the same files; none of them changes what the plugin does.

- **`src/client/preferences.ts:45-55`** — `DrawingPreferences`'s JSDoc documents a
  `mode` field ("how a paged document is read") that the interface does not
  declare, directly above the closing brace.
- **`src/client/annotator/mark-edits.ts:7-11`** — the header promises a field-by-field
  compare so a reference compare cannot "record an undo step that undoes
  nothing"; `points` *is* compared by reference and does exactly that (finding 22).
- **`src/client/AnnotatorBody.tsx:1250-1253`** — "the only enforcement point" is true
  of the toolbar's send; the comment pill reaches `run` as well, which is finding 14.
- **`docs/notes/implemented/2026-10-23-a-comment-on-the-spot.md:60`** — "the field
  still stops at 500 characters in the message"; no 500-character cap exists in
  `src/`, and `src/shared/mark-summary.ts:214-218` writes the detail whole. Related
  to known finding 7, which is about the 4 MiB read limit rather than a cap.

## On the ignore comments the split added

Coverage is enforced per file at 100%, so a split that moves a defensive branch
into a smaller file can only stay green by either testing it or declaring it
unreachable. The `v8 ignore` count went 32 → 35 across the refactor, and the
three new texts are all legitimate relocations rather than new blind spots: the
`start`/`stop` block guarding the two palette drags (which needs a live ref for
the whole drag) became two `next` comments on the same lines, and the guard on a
figure-menu row likewise keeps the reason it had. What changed is the form, not
the coverage — the same lines are dark before and after, and none of them is a
row a reader can reach.
