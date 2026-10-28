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
cluster on four mistakes: **switching documents does not reset the state that
belonged to the old one** (finding 19 and the PDF set), **a per-mark gesture
running the whole-figure path** (findings 13, 15, 23), **saving before the target
has agreed to take the save** (findings 24, and the delivery half of finding 1),
and **the delivered picture being drawn by code that does not read what the panel
reads** (findings 27, 28, 29, 34 — the export path re-derives the drawing and
disagrees with the screen on rotation, on the arrow head's size, on the pin's
outline, and on what the paper has to be sized for).

Two more threads are worth naming because they explain several entries at once:
**a screen-pixel constant used as a figure-pixel one, or the reverse** (findings
31, 35, 39), and **one quantity computed two different ways in two places** — the
figure's width for fit (30) against the paper's width for layout, the pointer's
position for re-anchoring (36) against the mark's own point, the guard's idea of a
body's length in code units (40) against the browser's idea of it in bytes.

A fifth thread is quieter and worth naming on its own: **a unit or a budget that
is right for ASCII and wrong for everything else.** Finding 40 is the HTTP form of
it and finding 43 is the line-ending form; finding 38 and the anchor-text rules
are the drawing form.

A sixth: **a claim made before the thing it claims has happened.** The edit
message says a copy is attached before an attachment has been offered (42); the
send button is pressable and silent while there is nothing to send, under a
comment claiming it explains the reason (41).

A seventh, from auditing the stylesheet rather than the code: **a rule that
matches an element and still never applies.** Finding 48 is the whole block of
`.da-tool` styling that a more specific palette rule overrides, and finding 58 is
a class name in the markup with no rule at all. Both are invisible to a sweep
that asks only "does this selector find an element" — the check has to ask which
declaration wins.

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

### 23. The delivered picture carries marks that were not sent

`exportPng` composes from every mark on the surface — `composeReviewSvg(target,
marks)` (`AnnotatorBody.tsx:1143`), with `marks` in the memo's dependencies — but
`run()` narrows what it *posts* to the delivered scope: `const scope = only ===
undefined ? marks : [only]` (`:1254`), and `exportPng` is called at `:1264` with
no scope at all. So a pill send rasterizes a picture of the whole figure and
ships it beside a message that names one mark.

The numbers disagree too. `composeReviewSvg` numbers by array index
(`export.ts:137`), while the message describes the posted scope in `buildDocument`
— so on a mixed figure the reader reads "① 箭头 …" and the picture paints **2**
on the pin they actually sent.

Reader impact: the agent is handed a picture as the record of what the reader
sent, and that record contains marks the reader deliberately left behind — with
numbering that contradicts the prose beside it. Severity: high; the agent acts on
marks nobody sent.

Shown: two arrows on the sidecar, the second one selected, pill send pressed. The
`POST` carried `marks: ["m2"]` only; the captured review SVG still carried both
shafts (`M 10 10 …` unsent and `M 60 60 …` sent) and the message's only marker was
`①` while the picture painted no number for either. Same defect from the other
side: an unscoped figure where only the pin is sent, message `①`, picture `2`.

### 24. A refused hand-off writes the truncated sidecar before it validates the target

`run()` saves first and asks permission afterwards: `await saveAnnotation(address,
document_, review)` is at `:1265`, and the three guards that can refuse the
hand-off — no session in the address (`:1272`), no conversation (`:1276`), no
sessions service (`:1289`) — all come after it. When one throws, the catch at
`:1305` only sets a status line: the one-mark document is already on disk,
`discard()` never runs, and the screen still shows every mark.

Reader impact: on a figure with several marks, press a send that cannot be
delivered. The status says the *save* failed, the screen looks untouched — and
the file now holds one mark and no summary. Reopening the figure shows what the
failed send quietly kept. Severity: high; the reader loses marks to an operation
they were told did not happen.

Shown: a sidecar with two marks and the summary `改标号`, mounted without
`sessions`. Pressing the pill's send issued one `POST` whose body held 1 mark —
while the screen still showed 2 — and no `DELETE` at all, with the status
`保存标注失败：the sessions service is unavailable`.

The summary survives this particular path (the posted document is built with the
surface's current summary, only the *marks* are narrowed), so the file keeps two
things that disagree: one mark where the screen shows two. An auditor's probe
reported the summary as lost as well; re-driven here, it was still `改标号` in the
posted body, so that part is not recorded.

Second mechanism, same tail: with the `POST` held open, a mark drawn while it is
in flight is destroyed when `discard()` finally runs — `before: 1, during: 1,
drawn: 2, after: 0`. Reproduced on the toolbar's whole-figure send too, so this is
not finding 13's pill-only path: any send wipes what was drawn during it.

### 25. Deleting one mark clears the selection the reader was typing into

`removeMark` deselects through `setSelectedId(current => (current === id ? null :
current))` (`AnnotatorBody.tsx:932`), but `setSelectedId` is not a real updater:
it evaluates `next(selectedId)` against the `selectedId` captured when it was
built (`:269-273`). `removeMark`'s dependency list (`:933`) omits `setSelectedId`,
so a `removeMark` built during an earlier render keeps a stale closure over the
selection from that render.

Reader impact: select a mark, open its comment card, then press ✕ on a *different*
row to prune the list. That row goes, and the card the reader was typing into
closes. Severity: medium; the reader loses their place for an edit they did not
make.

Shown: two marks, row 1 selected (`data-selected` `["true","false"]`, card open);
clicking row 2's ✕ left `["false"]` and no `.da-float-detail`. Control: typing one
character first (which commits and rebuilds `removeMark`) leaves `["true"]` and
the card open — so it is the stale closure, not a deliberate deselect.

### 26. Error text reaches the reader untranslated

`failureStatus` concatenates the caught message onto a translated prefix, and
three of the messages it can catch are English literals: `composer.ts:94`
`the session has no composer to write into`, `composer.ts:99` `the composer
refused the attachments`, and the guards at `AnnotatorBody.tsx:1272/1276/1289`.

Reader impact: a Chinese panel reports `保存标注失败：the sessions service is
unavailable` — half a sentence the reader can act on, half a stack-trace phrase
they cannot. Severity: low; the panel is honest but unreadable at the moment it
matters.

Shown: the literal status text above, from finding 24's probe.

### 27. The delivered picture draws every mark upright

`composeReviewSvg` writes each mark with `markSvg` (`export.ts:53`), which draws
`markPathData(mark)` — a function that knows nothing about rotation. The only
transform in the document is the `translate(...)` at `export.ts:145` that shifts
the whole drawing onto the paper. Rotation exists exactly once, as
`markTransform` (`render.ts:446`), and exactly one caller reads it: the overlay
(`canvas/overlay.tsx:183`). The paper, meanwhile, *is* measured with the turn
applied — `markOutline` goes through `turnedBox`. The words contradict the
picture too: `mark-summary.ts:139-141` writes "(rotated 45°)" into the text the
agent reads.

Reader impact: the reader approves a tilted box or arrow, and the picture the
agent receives draws it axis-aligned, on a sheet sized for the turned shape. This
is the mismatch `docs/notes/implemented/2026-10-20-rotated-marks-in-pdf.md`
records as fixed for the PDF path; the PNG path never got that fix.

Shown: a rect `[[100,100],[300,200]]` at 45° — `markTransform` returns
`rotate(45 200 150)`, `composeReviewSvg` contains no `rotate(` at all, and
`markPathData` of the turned mark is byte-identical to the upright one.

### 28. A turned mark's outline is measured from two points, not four corners

`markOutline` (`render.ts:379`) takes `geometry` — for a rect, its two opposite
corners — and hands it to `turnedBox` (`:404`), which rotates *those points* and
re-bounds the result. The extent of a rotated rectangle is not the extent of a
rotated diagonal: re-bounding two turned points measures a line segment. The
correct quantity already exists next door as `uprightBounds`
(`mark-geometry.ts:132`), which turns all four corners.

Reader impact, all from the same under-measurement: the paper never grows for a
turned mark, so the corner it actually sweeps is clipped by the viewBox in the
panel *and* in the export; the comment pill is placed from a box far too narrow;
and because `grown` stays false, no dashed edge rule explains the crop.

Shown: rect `[[620,220],[790,380]]` at 45° — `markOutline` gives
`x 699.0, width 12.1, height 238.3`, `uprightBounds` gives
`x 588.3, width 233.3, height 233.3`. The drawn corners reach `x = 821.7` while
the paper ends at 800, so 21.7 px is cut off, and the export emits no rule.

Not the same as finding 5 (`controlBox` turning the handles twice) or finding 10
(the element stroke that is never painted): this is the extent that feeds paper
size, cropping and pill placement.

### 29. An arrow's head is drawn at one size and measured at another

`render.ts:213` calls `arrowBarbs(mark.points, mark.weight ?? 1)` — the unit
argument is omitted, so the painted head is always `14 × weight`. The measuring
call at `:381` passes the unit, so the reserved head is `14 × weight × unit`. The
comment directly above the first call claims the picture and the outline "cannot
disagree".

Reader impact on any figure whose unit is not 1 — every scan and every plot with a
long edge past 800 px: `plotBounds` reserves margin the arrow never reaches, which
flips `grown` and paints the dashed "figure edge" rule plus white margin onto a
picture where nothing left the figure. The handles also sit outside the visible
head, and because the shaft scales with unit while the head does not, arrows read
as blunt darts (head/shaft 1.62 at unit 3, falling as the figure grows).

Shown: arrow `[[100,100],[300,300]]` — `arrowBarbs` with unit 1 puts the barbs
15.4 px from the tip and with unit 5 puts them 74.6 px from it, while
`markPathData`'s barbs sit in the same place at every unit. The export renders
that mark with the same head at unit 1 and unit 5.

### 30. Fit-to-width fits the figure, but lays out the paper

`drawingScale` (`annotator/geometry.ts:46`) divides the target width by
`input.size.width` — the *figure's* width — and `AnnotatorBody.tsx:682` hands it
`size`. What gets laid out is the paper (`surfaceBoxStyle`, `:95`, is
`paper.width * scale`). The two agree only while no mark reaches past the figure,
which is exactly the case a grown paper is not.

Reader impact: in fit mode a mark drawn outside the figure makes the panel wider
than its box, so the reader has to scroll horizontally to see the mark they just
drew. Fit stops fitting at the moment a mark matters.

Shown: an 800-wide figure whose paper grew to 1993.25 px, with a 1000 px fit
target — `drawingScale` returns 1.25 (the paper wants 0.50), the surface lays out
at 2491.6 px against a 996 px content box, overflow 1495.6 px.

### 31. Horizontal zoom anchoring ignores the stage's padding once the surface overflows

`surfaceOffset` (`zoom.ts:75`) resolves the *centring* regime:
`max(0, (viewportWidth − surfaceWidth) / 2)`. `anchoredScroll` uses it for the
horizontal term (`:127`) and never adds the padding. `.da-stage` is
`justify-content: safe center` with `padding: 14px` (`styles.ts:230`), so once the
surface overflows, `safe` falls back to `start` and the surface's left edge is at
14, not 0.

Reader impact: ~14 px of sideways drift per zoom step, precisely when the reader
is zoomed in far enough to be placing a mark against a curve. Together with
finding 6 (the vertical axis, which hardcodes a margin the CSS does not have) both
axes slide, which is what makes it read as "zoom is unreliable" rather than "one
axis is off".

Shown: `clientWidth 1000`, surface 1200, `scrollLeft 900`, `clientX 500`, zoom
1→2 — `anchoredScroll` returns `scrollLeft 2300`; honouring the 14 px padding
gives 2286 (drift 14).

A second instance of the same mismatch: `AnnotatorBody.tsx:674` subtracts 24 for
28 px of padding, so fit mode starts 4 px too wide (a 1024 px stage has a 996 px
content box but lays out a 1000 px surface).

### 32. An SVG that declares a physical size is sized by its digits, then rewritten

`svgIntrinsicSize` (`figure-dom.ts:105`) uses `Number.parseFloat` on the
`width`/`height` attributes, which stops at the first non-digit: `6.4in` parses as
6.4, `100%` as 100, `210mm` as 210. `decodeFigure` (`annotator/figure-source.ts:77`)
then writes those bare numbers straight back onto the root, keeping the viewBox.
So `width="6.4in"` with `viewBox="0 0 460 345"` becomes a 6.4 CSS px figure that
draws 460 user units into it — 72× too small — and `figureUnit` clamps to its 0.2
floor, leaving strokes, pins and hit areas sized for a canvas a few pixels wide.

Reader impact: a figure authored in inches, millimetres or percent renders as an
unreadable smudge with sub-pixel marks. It reads as a corrupt file, not a
mis-scaled one.

Shown: `svgIntrinsicSize` of `width="6.4in" height="4.8in"` gives
`{width: 6.4, height: 4.8}`; `figureUnit(6.4, 4.8)` = 0.2; the decoded markup is
`width="6.4" height="4.8" viewBox="0 0 460 345"`. `width="100%"` decodes to a
100×100 figure.

Why it has gone unnoticed: matplotlib writes `pt`, and Inkscape writes `mm` with a
viewBox in the same mm, so the digits happen to equal the user-unit count and the
figure is drawn at the wrong scale rather than collapsed.

### 33. A second element mark on the same element cannot be pressed

`elementNamedBy` (`canvas/hit.ts:51`) returns `marks.find(...)` — the first match
— and that function is the only way an element mark gets selected from the figure
(`canvas/gesture.ts:136`). `overlay.tsx:218` deliberately draws no frame and no
handles for an `element` mark, so there is no other hit target. The element tool
does not dedupe by selector, so clicking the same curve twice creates two marks
that both light up but only one of which can be pressed.

Reader impact: the second mark is dead on the figure and reachable only from the
list, and pressing the curve while it is selected jumps the selection to the
first mark.

Shown: with two element marks carrying the same `anchor.selector`, a press on the
element reports `e1` — the first — even though `e2` was the selected one.

### 34. The delivered pin is drawn differently from the pin on screen

The overlay (`canvas/overlay.tsx:89-90`) draws a white halo at `4.5 × unit` under
a body stroked at `1.5 × unit`. `export.ts:70` draws a single path at `2 × unit`
with no halo — matching neither constant.

Reader impact: the halo is what separates the pin from dark line work; the picture
the agent gets drops it and thickens the rim instead, so on a dense or dark figure
the numbered pins are thinner and blend into the artwork. "The pin at the top of
the peak" gets harder to find in exactly the figures where it matters.

Shown: `composeReviewSvg` over one point mark at unit 1 emits one `<path>` with
`stroke-width="2"`; the overlay emits two, at 4.5 and 1.5.

### 35. A small mark cannot be moved, only resized

`beginHandle` (`canvas/gesture.ts:191`) asks `handleAt` whether the press caught a
handle, with a reach of `HANDLE_REACH × sizes.grip` (`:204`) — `HANDLE_REACH` is
2.2 (`:34`) and `sizes.grip` is `HANDLE_SIZE / scale` (`canvas/controls.ts:32`),
so the reach is a constant 15.4 *screen* px in figure units. The handles sit on
the four corners and the four edge midpoints, and a mark's only pressable area is
its own stroke (`overlay.tsx:208`). A handle therefore wins the press whenever the
press is within 15.4 px of a handle — and for a small enough mark there is nowhere
else to press.

Reader impact: a tick label, a short arrow or a small box drawn at a fit scale can
only be resized, never dragged, and the frame it shows while resizing is a resize
it did not want. On a large figure at fit zoom the threshold is reached by any
mark smaller than roughly 150 figure px.

Shown: a square selected and pressed a quarter of the way along its top edge, then
dragged — 40 figure px at scale 1 reports a resize; 80 px and 200 px report a move;
the same 200 px square at scale 0.3 reports a resize again. So the outcome depends
on the mark's on-screen size, not on where the reader pressed.

### 36. A dragged mark re-anchors to what the pointer is over, not to what its own tip is over

`finish` (`canvas/gesture.ts:345`) calls `anchorFor(event, last)` with the mark's
own final point. On the HTML path `anchorOf` uses that point
(`canvas/pointer.ts:86`). On the inline-SVG path it ignores the point entirely and
asks `anchorAtPoint(container, event.clientX, event.clientY, …)` (`:101`) — the
pointer's position, not the mark's. The two differ by the grab offset: the pointer
is at `pressPoint + delta` while the mark's tip is at `originTip + delta`.

Reader impact: grab an arrow by its middle and drop it over the legend, and the
arrow re-anchors to the legend even though its tip landed elsewhere — the mark now
claims to name something its own geometry does not point at, and the text the
agent reads describes the wrong element.

Shown: an arrow `[[150,150],[250,250]]` pressed at (200,200), dragged +50/+50 so
the tip lands on `#near_tip` — the anchor reported is `under_hand`, the element
under the pointer at (250,250).

### 37. A pan that ends without a click leaves one click owing

`panned` is set on the first real move of a pan (`canvas/gesture.ts:282`) and only
ever cleared inside `onClick` when a click arrives on the surface itself
(`:377-379`). `start` resets it (`:236`), but `finish` (`:322`) does not, and the
`pointercancel` path goes through the same `finish`.

Reader impact: after a pan that ends outside the surface, or a cancelled drag, the
next click on blank paper does not clear the selection — it is spent on the pan
that already ended. The reader clicks empty space expecting the mark to be let go
and nothing happens, once.

Shown: pan with `pointerup` and pan with `pointercancel`, then a fresh
press-release-click on blank paper — both report `onSelect(null)`, i.e. the flag is
consumed by nothing and the click does act. So the *conditional* half of this is
the part that cannot be shown in jsdom: whether the browser fires a click after a
release outside the surface. What is certain from the code is that nothing resets
the flag except a click.

### 38. A named group's anchor text runs every descendant string together

`anchorAtPoint` (`figure-dom.ts:272`) takes the named element's `textContent`,
collapses whitespace and trims — with no separator inserted between descendant
texts. `html-dom.ts:198` does the same.

Reader impact: for a matplotlib axes group, the text the agent reads is
`0.00.51.0y label` — four separate labels with nothing to say where one ends.

Shown: `<g id="axes_1">` holding `0.0`, `0.5`, `1.0` and `y label` reports
`text: "0.00.51.0y label"`.

### 39. The element-pick reach is in figure pixels, though it is documented as screen pixels

`pick.ts:28` defines `PICK_REACH = 6` and documents it as "surface pixels".
`pickInFigure` (`figure-dom.ts:321`) divides it by `Math.max(scaleX, scaleY)`,
where `scaleX` is *figure pixels per client pixel* (`:248`). Dividing by that
makes the reach smaller in figure units as the figure shrinks on screen — which
inverts the intent: the probes end up spanning `6 / scale` figure px, i.e. a
constant 6 *figure* px, and a fixed number of screen px only when the figure is
drawn 1:1. The HTML surface has no such conversion (`html-dom.ts:124` passes a
flat 6 in document px), so the two surfaces also disagree with each other.

Reader impact: zoomed in 6×, the picker reaches 1 screen px — hairlines need
sub-pixel aim; zoomed out 6×, it reaches 36 screen px, so the picker names things
the reader is not pointing at.

Shown: `anchorAtPoint` with scale 1 asks about a 12-client-px span; with scale 6
(zoomed in) it asks about 2 client px; with scale 1/6 (zoomed out) it asks about
72 client px. The probe count is 25 in all three cases.

### 40. An autosave is refused for a body length the browser measures differently

`host-api.ts:85` defines `KEEPALIVE_LIMIT = 60_000` and `:120` applies keepalive
only when `payload.length <= KEEPALIVE_LIMIT`. `String.prototype.length` counts
UTF-16 **code units**; the browser enforces its keepalive budget in UTF-8
**bytes** (Chrome: 65536 bytes shared by every in-flight keepalive request, and it
counts the method, URL and headers against the same budget). For a body of
non-ASCII text the two disagree by up to a factor of three, so the guard passes a
request the browser then refuses outright.

The refusal is not a quiet truncation: `fetch` rejects with `TypeError: Failed to
fetch`, nothing is sent, and `saveAnnotation` never reaches its status check.

Reader impact: the flush on `pagehide` (`AnnotatorBody.tsx:1084`) is the only
write that keeps the last edit of a tab that is being closed, and it is the one
call that goes through with `keepalive=true` (`AnnotatorBody.tsx:1203`). The
failure lands in `onError`, which calls `setStatus` on a component that is
already being torn down — the reader never sees it. A figure whose note is written in Chinese, or
whose sidecar is large mostly in non-ASCII summary text, is silently lost on
close.

Shown: a real Chromium posting ASCII bodies through keepalive accepts 60000 bytes
and rejects 60001-and-up (measured by bisection, one fresh page per size because
the budget is per-renderer). A body of 30000 `图` characters is **30000 code
units** — well under the guard, so keepalive is set — and **89970 UTF-8 bytes**,
and `fetch` throws `TypeError: Failed to fetch`; the server receives nothing. The
same text at 20000 characters is 59970 bytes and is accepted. Ordinary
(non-keepalive) saves of the same size succeed, so only the close-the-tab path is
affected.

### 41. The send button is pressable when there is nothing to send, and says nothing

Both hand-off paths begin with a guard that returns without a word, and both carry
a comment claiming the opposite. `AnnotatorBody.tsx:1250-1255`:

> The only enforcement point: the toolbar buttons stay clickable so this guard is
> what decides, not a disabled attribute that hides the reason.
> ... `if (scope.length === 0 || size === null || size.height <= 0) return`

and `pdf/document-save.ts:127-134` the same shape, with `context.fail(notReady)`
covering only the `collect() === null` case. The guard decides, but it does not say
why: the press is dropped before `setBusy` and before any status line, so the
reader gets no busy state, no error, no line at all.

The comment's premise is what fails. A *disabled* button with a tooltip would tell
the reader something; a live button that does nothing tells them the button is
broken. The dock marks send and compose with `disabled={props.busy}` only
(`annotator/chrome.tsx:267-274`), so an empty surface offers both, fully lit.

Reader impact: a reader who writes the figure-level note but draws no mark — or
who clears the marks and expects the note to still travel — presses send, watches
nothing happen, and presses again. Nothing is broken on disk; the annotation
simply never leaves. `notReady` exists and is never reached on this path.

Shown: an `AnnotatorBody` over a 200x100 SVG with one saved annotation rendered,
send pressed on an empty surface — the button reports `disabled: false`, no
`.da-status` element is ever created (`status === null` renders `null`), and the
fetch stub records zero POSTs and the session stub zero prompts. The control
(fresh surface, one arrow drawn, same press) also records zero POSTs in jsdom
because the export path needs a raster the environment cannot produce; that half
of the comparison is therefore **not** shown, and the claim above rests on the
code paths, not on the control.

### 42. The edit message tells the agent a copy is attached, whether or not it is

`buildEditMessage` (`client/edit-message.ts:129-133`) writes, whenever more hunks
were hidden than `MAX_DIFF_LINES` allows:

> 另有 N 处改动未在本消息里展开，完整结果见随本消息发送的 `notes.md.edited.md`。

That sentence is decided from `fitted.hidden > 0` alone. Whether a file part
actually travels is decided later, by `attachFile` (`client/session.ts:157-186`),
which silently declines in three cases — no upload service, a subagent
continuation, and an upload the service refuses — and each time pushes only into
`warnings`, the list the *reader* sees in the status line. The message body was
already composed; nothing rewrites it.

Reader impact: the agent is told to look for an attachment that is not in the
message. Its instructions for the hidden hunks are unrecoverable — the diff in the
message is capped, the copy it should have consulted never arrived, and the one
place that knows this (the reader's status line) is not what the agent reads. The
reader, meanwhile, has been told the work was sent.

Shown: `deliverEdit` with `fileUpload: undefined` and an 80-hunk diff (800 lines,
one change every 10, `coarse: false`, 36 hunks hidden). The message part list has
no `file` part, the text contains `完整结果见随本消息发送的 notes.md.edited.md`,
and the returned warnings are `["本次组合没有附件服务，编辑后的副本未随消息发送。"]`
— which `MarkdownBody.tsx:188-191` renders to the reader only.

The neighbouring case is the same shape and older: `deliverAnnotation`'s
`buildAnnotationMessage` decides "the annotated image is attached" from
`paths.reviewPath !== null` (`client/annotation-message.ts:75`), which is a
statement about what the *Host wrote to disk*, not about what the session service
accepted. Whether that one bites depends on the image part path, which the
session takes unconditionally, so it is recorded here as the same mistake rather
than as a separate finding.

### 43. One keystroke in a CRLF file is reported as a rewrite of every line

`editFrom` (`client/markdown/edit.ts:41-45`) takes the baseline from `loaded` —
the text the owner delivered, which is the file as `readFile(path, 'utf8')`
returned it — and the new side from the textarea's `value`. A `<textarea>`
normalises CRLF to LF on its way in: assigning `"a\r\nb"` to it yields
`"a\nb"`. So for a file with Windows line endings the two sides of the diff are
written with different line terminators before the reader has changed anything.

`textLines` (`shared/text-diff.ts:93-97`) splits on `\n` only and keeps the `\r`
as part of the line's text, so every line reads as different.

Reader impact: the *first* keystroke in a CRLF document turns the whole file into
one hunk of `-N +N`. The reader sees "改动 1 处 · +5 −5 行" for one character, and
the agent receives a diff that rewrites every line — which it is then told to
apply. Applying it converts the file to LF as a side effect nobody asked for, and
the reader's one real edit is buried in the noise.

Shown: `MarkdownBody` over `content.text` = `"title\r\n\r\nbody line one\r\n…"`
(the textarea's own value already prints as `"title\n\nbody line one\n…"`, no
`\r`), then one character appended to the last line. The header the reader sees
reads `改动 1 处 · +5 −5 行` on a five-line file.

Not shown: the file being read with `\r\n` in the first place. That comes from
`readFile(…, 'utf8')` on the Host (`host/store-read.ts:125`), which does not
normalise, so a Windows-authored `.md` arrives that way; reproducing it end to end
would need a fixture on disk rather than a string.

### 44. A note with a line break in it splits the numbered list the agent reads

`describeMark` (`shared/mark-summary.ts:203-220`) builds one line per mark:
`① 框选 (10,10)-(40,30)，批注：<the note>`. The note is `mark.detail` verbatim —
`detail.trim()` and nothing else — and `annotation-message.ts:100` joins the list
with `'\n'`. The pill that writes the note is a `<textarea rows={1}>`
(`annotator/detail-pill.tsx:55-63`) with no key handler that swallows Return, so a
line break is something a reader types without trying.

Reader impact: two lines of one note become, to the agent, two lines of list — and
the second one starts without a marker, so the numbered list a reader was told to
read "one mark per line" is no longer one mark per line. Worse, the shape is
silently ambiguous: an unmarked line looks like prose the agent may or may not
attribute to the previous mark. The same note is also what the circled numbers on
the picture are keyed to, so a mismatch shows up as a mark answered twice or not
at all.

Shown: three marks, the middle one carrying `这里\n应该\n换行三次`, rendered through
the real `describeMark`:

```
① 框选 (10,10)-(40,30)，批注：标号指错了
② 框选 (10,10)-(40,30)，批注：这里
应该
换行三次
③ 框选 (10,10)-(40,30)，批注：第三处
```

`describeMarks` still returns three strings — the split happens when the message
is assembled, not when the mark is described, which is why the unit tests that
count entries stay green.

### 45. The goal field advertises a 300-character limit and enforces nothing

`SummaryRecord` renders `<span className="da-count">{props.summary.length}/300</span>`
(`annotator/records.tsx:64`). There is no `maxLength`, no truncation in
`onWrite`, and no length rule in the sidecar schema — searching `src/` for the
number 300 outside CSS and figure sizes finds only that one line. The counter is
a measurement, not a gate, and it is written to look like a gate.

Reader impact: the count reaching `420/300` reads as "over the limit, this will
be cut" to anyone who has used a form; nothing is cut. The overshoot then travels
into the message the agent receives as-is. Either half alone would be fine — a
soft meter with no fraction, or a hard cap — but the fraction claims an enforced
boundary and the boundary is not there.

Shown: mounted with a 420-character summary, the counter reads `420/300`,
`getAttribute('maxlength')` is `null`, `HTMLTextAreaElement.maxLength` is `-1`,
and the field's value is the full 420 characters.

### 46. Undo on a second figure brings back the first figure's marks

`replaceMarks` (`annotator/history.ts:74-76`) is documented as "loading a document
is not an edit": it swaps `marks` and leaves `past` and `future` untouched. That
is right when the same document is re-read — a reload should not make the
reader's own edits vanish — and wrong when the body is pointed at a *different*
document, which the load effect does on an `address` change
(`AnnotatorBody.tsx:644-667`). `replace` is the only thing that runs there, so the
previous figure's undo trail survives into the new one.

Reader impact: open figure A, edit it (any commit does it — a delete, a draw, a
property change), then open figure B. The undo button is live on B, and pressing
it once puts A's marks on B's surface. They are in `marks` now, so the autosave
signature differs from what B has on disk and the write stores them under B's
address — B's sidecar ends up describing a figure the marks were never drawn on.
Redo then walks out of that state again, so the two documents share one trail.

Shown: with figure A's sidecar holding two marks, one delete on A (which commits
and leaves `past` with one entry), then switching the body to figure B whose
sidecar is empty — the undo button on B reports `disabled: false`, and after one
press the DOM carries `['a1', 'a2']`, A's two original marks. Distinct from
finding 19, which is about `annotation === null` leaving the *current* values
alone; this one happens even when B loads its own (empty) document successfully,
because the stacks are separate from the marks.
### 47. The weight rail is ten pixels wider than it looks, and the extra is over the paper

`.da-weight-input` (`src/client/styles.ts:136`) is a native range rotated upright: it is
`width:200px;height:30px` and `transform: rotate(-90deg)`, so the *height* becomes the
horizontal extent. The visible rail (`.da-weight[data-...]`, `:96`) is seven pixels wide,
so the input sticks out `(30 - 7) / 2 = 11.5px` on each side. It is `opacity:0` but not
`pointer-events:none`, so the whole thirty pixels take presses.

At fit-to-width the paper's left edge lands at the stage's padding, `x = 14`
(`src/client/styles.ts:230`), while the input's right edge is at `x = 24.5` — so the
leftmost `10.5px` of the drawing surface is a stroke-thickness control that looks like
paper. Measured in Chromium: `elementFromPoint` returns `da-weight-input` for twelve
consecutive x positions inside the paper, and a press at `x = 16` with a 40px drag moved
the value from `2` to `2.4` instead of starting a mark.

The rail is on screen whenever a mark is selected or a weight-bearing tool is armed
(`src/client/annotator/geometry.ts:67`), which is the state a reader draws in.

Not shown: whether the reader notices. There is no visual cue in the eaten strip — the
rail's own seven pixels are the only sign the control is there.

### 48. Two thirds of the tool tile's styling is written, matches a real element, and loses every time

`src/client/styles.ts` styles `.da-tool` twice. The general block at `:189-197` gives it
`width:40px;height:34px;border-radius:9px`, a 14px icon with `stroke-width:2.05`, a label
line, and an armed state that thickens the stroke to `2.4` and paints the tile with
`--da-accent-soft`. The palette block at `:80-84` then says
`.da-palette .da-tool .da-tool-icon svg{...stroke-width:1.7}`.

Every `.da-tool` in the tree is rendered inside `.da-palette` (`src/client/annotator/chrome.tsx:82`
wraps the row at `:94`), so the more specific selector always wins. Measured in Chromium
with the real stylesheet: the armed tile and the idle tile both render `stroke-width:
1.7px`, both 32x32, both `border-radius:50%`, and the armed tile's background is the
dark strip's own `rgb(23,109,242)` rather than the soft tint. The armed state is still
legible, but by a rule that was never meant to carry it; the `:189-197` block is dead
weight that a reader will take for live code, and its comment ("it is the only tile with
a fill, and the only label in the brand colour") describes styling that does not happen.

Why the earlier dead-rule sweep missed it: every selector matches an element. What it
lacks is the cascade. A rule that matches and loses is invisible to a "does this class
appear in the markup" check — the check has to compare the winning declaration for the
properties a rule sets.

### 49. At the panel heights the side rail allows, the last tools are clipped and unreachable

`.da-palette` (`src/client/styles.ts:57`) has no `max-height` and no scroll of its own, and
`.da-root` is `overflow:hidden` (`:32`). The palette is absolutely positioned, so it is not
inside the one child that does scroll (`.da-stage`, `:230`). When the panel is shorter than
the tool column, the bottom tiles are painted outside `.da-root` and cut off, and nothing
can bring them back.

Measured in Chromium with the real stylesheet, seven tiles:

| panel height | palette overflow past root | tiles reachable by a click |
|---|---|---|
| 560px | none | 7 / 7 |
| 320px | none | 7 / 7 |
| 240px | 7px | 6 / 7 |
| 200px | 47px | 5 / 7 |

`elementFromPoint` at the centre of the `element` tool returns nothing at 240px and below,
so the tool cannot be armed at all. The dock in the sidebar can be dragged this short; the
figure is then partly visible and fully un-annotatable with the missing tools.

### 50. A palette dragged to the top corner is pinned there by the bar

Both the palette and the bar are `position:absolute; z-index:8`
(`src/client/styles.ts:57` and `:143`). Moving a strip is clamped so its top can reach `0`
(`draggedSpot`), and the bar is rendered after the palette in the DOM
(`src/client/AnnotatorBody.tsx:1643` before `:1651`), so at equal `z-index` the bar paints
over the palette. The palette's only handle is the grip strip above its tiles
(`src/client/annotator/chrome.tsx:86`).

Measured in Chromium with both strips parked at the origin: the grip occupies
`x 8-34, y 6-23`, the bar occupies `x 0-63, y 0-34`, and `elementFromPoint` at the grip's
centre returns `da-btn` — a button on the bar, not the grip. Once the palette is dragged
there it cannot be dragged away again; the only recovery is a reload, which loses the
placement anyway.

Not shown: whether the reader ever drags the palette exactly there. The clamp permits it and
there is no snap-back, so the state is reachable in one gesture.

### 51. Body text in the secondary colour fails contrast in the light theme, and only there

`--dsw-alias-label-tertiary` resolves to `#81858c` in the light theme. Measured ratios:
`#81858c` on the panel's `#f2f3f5` is **3.34**, on white **3.71** — both under the 4.5 that
WCAG AA asks of text below 18.66px. The rules that use it for 10-12px text are
`src/client/styles.ts:420` (`.da-mark-page`), `:457` (`.da-mark-meta`), `:467` (`.da-count`),
`:485` (`.da-empty-hint`), `:499` (`.da-hint`) and `:512` (the Markdown gutter).

The same token in the dark theme is `#8b8f96` on `#1f2125` = **4.97**, which passes. So the
light theme is the readable-by-default one and also the only one with this problem, which is
the opposite of what a reader would guess from the two palettes.

`src/client/styles.ts:494` separately sets `outline:none` on `.da-menu-item` and marks the
focused row with `--da-accent-soft` over white: measured **1.20**, against the 3.0 that
WCAG 1.4.11 asks of a focus indicator.

### 52. An error and a loading note are the same grey sentence

`src/client/AnnotatorBody.tsx:1542` renders the unsupported case, `:1543` the loading case
and `:1544` the read failure — the last one with `role="alert"` for assistive technology but
with **the same class**. All three are `<p className="da-hint">`, styled at
`src/client/styles.ts:499` as 12px `--dsw-alias-label-tertiary` with no tone variant, so the
failure to read the figure is painted in the same 3.34-contrast grey as "loading…".

The same failures, when they arrive through `status`, are `data-tone="error"` and red
(`:497`). So the panel has two ways of saying "this did not work", and the one that blocks
the whole surface is the quieter one. A reader glancing at the panel cannot tell "still
working" from "gave up" without reading the sentence.

### 53. The figure menu is a `role="menu"` with no keyboard model, and its own size arithmetic is wrong

`src/client/AnnotatorBody.tsx:1358` places the menu with
`const height = menuItems.length * 27` and a fixed `width: 208`. With the real stylesheet
(`src/client/styles.ts:488-491`) the menu is `padding:4px`, `gap:1px` per row, and each row
is `height:27px` in a *content box* (there is no global `box-sizing` reset), so seven rows
measure **216 x 203** against an assumed 208 x 189. The placement is fed a box 14px shorter
than the real one, so `clampMenu` believes a menu fits that does not.

Measured in Chromium at a 1200x640 viewport with a right-click at `y = 598`: the real menu
extends to `bottom = 797`, i.e. 161px past the viewport. The last row is still *clickable*
(this is a clip, not a dead zone), so this is a visual fault, not a broken affordance — the
rows the reader cannot see are the ones they never learn are there.

The keyboard half is the larger one: the card is `role="menu"` with `role="menuitem"` rows
(`src/client/figure-menu-card.tsx:42`), but nothing moves focus into it on open, there is no
Arrow/Home/End handling, no roving `tabindex` (all seven rows report `tabIndex: 0`), and
closing does not return focus to the figure. A `role="menu"` promises the menu pattern; a
screen-reader user who presses Enter on it gets a list they cannot navigate.

### 54. One Escape closes the menu and drops the selection with it

Two listeners both act on Escape and neither defers to the other. The menu's listener
(`src/client/AnnotatorBody.tsx:1376-1378`) is on `document` and closes on any Escape; the
panel's listener (`:1118-1124`) is on `window` and, when a mark is selected, calls
`event.preventDefault()` and clears the selection. The menu's handler does not check
`event.defaultPrevented`, and the panel's does not check whether a menu is open.

Measured in jsdom: a saved mark selected (nine `[data-da-handle]` elements present), the
figure menu open, then one `keydown` Escape on the document — afterwards the menu is closed
**and** the handles are gone. The reader who meant "close this menu" also lost the mark they
were working on, and on a dense figure finding it again is the work.

### 55. A two-digit count badge covers a third of the icon it rides on

`.da-dock-count` (`src/client/styles.ts:356`) is `min-width:14px` with `padding:0 3px` and
`font-size:9px`, so its real width grows with the digits: measured **20px** for two digits,
not the 14 the rule suggests. It is pinned at `top:-1px;right:-2px` over a 15x15 glyph, and
the overlap measures **74.8px² against the glyph's 225px²** — **33.2%** of the icon sits under
the badge.

`records.tsx:106` is the only place a count is drawn, so this needs a figure with ten or more
marks. That is not a rare figure; it is an annotated plot with a legend.

### 56. Three rules that name a state the plugin no longer has

- `src/client/styles.ts:256` `.da-overlay[data-mode="view"]{pointer-events:none}` — nothing
  writes `data-mode`. `src/client/Canvas.tsx:63` sets `data-tool={tool}` and that is the only
  attribute on the overlay. A reader who finds this rule will believe there is a viewing mode
  in which marks cannot be moved; there is not, and `pointer-events:none` on the paper would
  be a serious thing to apply by accident.
- `src/client/styles.ts:315` `.da-toolbar .da-page{min-width:52px;...}` — the only `.da-page`
  element is the PDF page button (`src/client/pdf/paging-controls.tsx:75`), and it is rendered
  inside `.da-docbar-group`, never inside `.da-toolbar`. It also disagrees with the rule that
  does apply to it (`:295`, `min-width:44px`), so the two together say 52 while the reader
  gets 44.
- `src/client/styles.ts:161` and `:82` hard-code `#176df2` for the pressed accent while
  `:163` uses the token `var(--da-accent,#176df2)` for the dot beside them. In the dark theme
  the token moves and the hard-coded pair does not, so two elements that are meant to read as
  the same accent drift apart.

None of the three can be reached by a test: there is nothing to open. That is the point of
recording them — a rule that cannot run still teaches the next reader something false about
the code.

### 57. The Markdown editor is the one text field with no focus indication at all

`src/client/styles.ts:508` gives `.da-md-editor` both `border:none` and `outline:none` and
adds no `:focus` rule. Every other text field in the panel keeps a focus cue: the note
textarea drops the outline but recolours its border
(`src/client/styles.ts:412`, `.da-float textarea:focus{border-color:var(--da-accent)}`), the
page field does the same (`:325`), and the page button draws a real ring
(`:301`, `outline:2px solid`).

So the surface a reader types a document edit into — the one whose text becomes a diff an
agent applies — is the only one where a keyboard user cannot see that the keyboard is there.
On a page whose whole subject is text, "which field has the caret" is not decorative.

### 58. The mark count is styled like a word in the heading

`src/client/annotator/records.tsx:106` puts `<span className="da-card-count">{props.marks.length}</span>`
inside `.da-card-title`, and no rule anywhere defines `.da-card-count`
(`grep -n 'da-card-count' src/client/styles.ts` finds nothing). It therefore inherits the
title's `font-size:12px` and `font-weight:650` and reads as part of the sentence: the heading
renders as **"标注清单 6"** rather than as a title with a count beside it.

The panel has a counter style — `.da-count` (`src/client/styles.ts:420`, 10px,
`tabular-nums`) — and the typo is one attribute away from using it. What makes this worth
recording rather than fixing is that it shows the pattern: a class name that was never given
a rule is invisible to both the test suite and the dead-selector sweep (the class *is* in the
markup), the same blind spot as finding 48.

### 59. Past eight pages the message points at a PDF it did not attach

`src/client/session.ts:252` sends at most `MAX_PAGE_IMAGES = 8` page images, and for the
rest it pushes a warning (`:262-264`) that says, in Chinese and English, "see the annotated
PDF". Whether that PDF is in the message is decided earlier and independently: `:250` calls
`attachAnnotatedPdf`, which goes through `attachFile` and therefore gives up silently in
three cases — no upload service, a sub-session, a refused upload — leaving only a warning of
its own.

So on a twelve-page document with no upload service the agent receives **eight images and a
text part, no file part**, and two warnings that contradict each other:

```
本次组合没有附件服务，带批注 PDF未随消息发送。
另有 4 页标注未附图，请看带批注 PDF。
```

The second sentence is the one that names the answer. A PDF search is a plausible response
to it, which is a worse outcome than saying nothing: the reader's four pages are gone and the
message says where to find them.

This is finding 42's mistake in a second place — the advice is written where the count is
known, and the attachment is decided where the upload is known, and neither reads the other.

### 60. Two saves that start in the same millisecond fight over one scratch file

`src/host/store-write.ts:44` names the scratch file `${path}.tmp-${process.pid}-${Date.now()}`.
`Date.now()` has millisecond resolution and there is no counter, so two overlapping saves
of the same figure pick the **same** scratch name. The comment above it
(`src/host/store-write.ts:36-38`) states the opposite as a guarantee: "The temporary name
carries the pid and the clock so two saves that overlap cannot pick the same scratch file."

Measured against the real filesystem through the real `writeAnnotation` entry point:

- 30 rounds of two overlapping saves at ordinary size: **28 rounds lost one save** to
  `ENOENT` (the loser's scratch file had already been renamed away), 2 rounds succeeded.
- The file that survives is not corrupted: in 30/30 rounds it parsed, and in 20/20 big-file
  rounds (20 KB summaries) the body was wholly one save's, never a blend. `writeFile` writes
  the scratch file whole before either rename, so the damage is a **lost save**, not a
  mangled one — the audit's "two bodies spliced into unparseable JSON" did not reproduce.
- The window is the millisecond: `GAP 0ms` and `1ms` collide, `>= 2ms` does not.

What the reader sees is one save's outcome being silently dropped. The failing path does
report: the request's rejection becomes a 400 (`src/host/routes.ts:138-142`), and the client
turns it into `setStatus(failureStatus(t, 'saveError', error))` through the autosave `onError`
(`src/client/AnnotatorBody.tsx:1206`), so the reader is told "saving failed" — but the
surviving save is the *other* one, and nothing says which. Two writers in
one process is not hypothetical here: `src/client/AnnotatorBody.tsx:1266` awaits
`saveAnnotation` on the delivery path while `:1087` fires `flush()` on unmount, and the
autosave chain only serialises the debounced writes, not those two.

Not shown: a UI sequence that reliably makes them overlap. Twelve rounds of the real
timing — last keystroke, send 50ms later, delivery taking 700ms past the 600ms debounce —
produced no failure, because the chain serialises the common case. The defect is in the
naming scheme, which promises something the clock cannot deliver.

### 61. Changing only the last newline says "changed" with nothing to show, and the buttons go quiet

`src/shared/text-diff.ts` compares `before === after` **after** `textLines` has dropped one
trailing newline, so removing or adding the file's final newline leaves both sides with the
same lines: `{changed: true, hunks: [], added: 0, removed: 0}`. Measured: all four shapes
(`"a\nb\n"` → `"a\nb"`, back again, `"a\n"` → `"a"`, `"a"` → `"a\n"`) give that result.

`src/client/markdown/MarkdownBody.tsx:200` then decides `dirty = edit !== null`, which is
true, so:

- the toolbar reads **"改动 0 处 · +0 −0 行"**,
- the diff view shows no hunk at all,
- **all three buttons are enabled** (`:214`, `:216`, `:218`),
- `send()` returns at `:170` on `diff.hunks.length === 0` without setting `busy` and without
  setting a status, so pressing it does nothing at all — no spinner, no line, no failure.
- `copyDiff()` returns at `:156` the same way, so the clipboard keeps whatever was in it.

Two comments call this the design: "The only enforcement point: the button stays clickable
so the guards below are what decides, not a disabled attribute that hides the reason"
(`:168-169`, `:154-155`). The guard decides — and says nothing, which is the outcome the
comment was written to avoid. This is finding 41's shape on a third path, but its root is
upstream of the guard: a difference object that is `changed` with no hunks should not exist,
and every consumer downstream has to defend against it separately.

### 62. Putting a message in the composer re-flows the paragraph the reader already wrote

`src/client/composer.ts:102-103`:

```ts
const existing = shell.snapshot.draft.trim()
shell.setDraft(existing === '' ? message : `${existing}\n\n${message}`)
```

`.trim()` is applied to the whole existing draft, not to the check for emptiness. A reader
who has typed, or pasted, a draft that begins with indentation — a fenced code block, a
nested list — or ends with blank lines gets both ends cut off. Measured with the draft
`"  indented line\n\nkeep trailing  \n\n"`: the written draft starts `"indented line"`, so
the two leading spaces are gone, and the trailing blanks are gone with them.

The docstring at `:80-82` argues for append over replace — "the reader may have written half
a sentence, and losing it is worse than a longer draft" — and the append does keep the words.
What it does not keep is their shape, and in a Markdown draft that is what the agent reads:
an indented block that loses its indentation is no longer a code block.

The emptiness test only needs to know whether there is anything to separate; `trimEnd()`
would do. The bug is one argument away.

### 63. One line past a thousand turns the whole file into the message

`src/shared/text-diff.ts:145` gives up on the exact algorithm when
`older.length * newer.length > DEFAULT_MAX_CELLS` (1,000,000), and the fallback is one hunk
that replaces the entire file. The line counts are the lengths of the **trimmed middle**, so
a document whose edits sit near both the first and last line has no common prefix or suffix
to cut and the middle is the whole document.

Measured with a two-line edit (first line and last line changed), through `fitDiff` and
`buildEditMessage`:

| lines | coarse | hunks | header the agent reads | bytes |
|---|---|---|---|---|
| 1000 | false | 2 | 改动 2 处, +2 −2 | 296 |
| 1001 | true | 1 | 改动 1 处, +1001 −1001 | 20,024 |
| 1500 | true | 1 | 改动 1 处, +1500 −1500 | 31,002 |

So **one line past a thousand costs 68x the bytes**, and the growth is linear in the file
after that — the audit measured 2.4MB at 20,000 lines and 6MB at 50,000. `fitDiff` cannot
help: coarse produces exactly one hunk and `src/client/edit-message.ts:46-48` always keeps
the first hunk, so `hidden` is 0, no `.edited.md` is attached, and the message claims
"改动 1 处" while carrying the entire file.

The reader's instruction is two lines long. The agent receives the document.

### 64. A note written on a hunk outlives the change it was written about

Hunk notes are keyed by `hunk.oldStart` (`src/client/markdown/MarkdownBody.tsx:96`, written
at `:253`), and `describeNotes` (`src/client/edit-message.ts:88-107`) formats every key it
finds in that record. Notes are only cleared when the document changes or the whole edit is
discarded (`:124`, `:146`) — never when the change they belong to moves or goes away.

Measured with the real diff and the real formatter: change line 4 (hunk `@@ -1,7 +1,7 @@`,
`oldStart = 1`), write a note on it; then move the edit to line 20 instead, so the only hunk
is `oldStart = 17`. The note's input box is not on screen any more — nothing renders
`notes[17]` — but
`describeNotes(second, notes)` still returns `"1. 第 1 行：this wording is wrong"`.

So the reader sees no notes and sends one. It arrives anchored to `第 1 行`, which in this
version was not edited at all, and the agent is told to look at a line nobody touched. The
`@@` reference that would have disambiguated it is dropped too, because
`formatHunkHeader` is only included when a hunk matches (`:98`).

Note the difference from the recorded note-anchoring finding (#9): that one is about a note
being filed under the wrong line while it is on screen. This one is about a note surviving
the disappearance of its subject — the lifecycle, not the addressing.

### 65. A note on inserted text is filed under the line it was inserted above

`describeNotes` (`src/client/edit-message.ts:98`) labels a note with the bare number
`第 N 行`, where `N` is the hunk's `oldStart`. For a pure insertion that is the line *before*
the new text, not the new text — and in an empty file it is line 0.

Measured with the real diff and formatter:

- prepending `inserted` to a three-line file gives `@@ -1,3 +1,4 @@`, so the note reads
  `1. 第 1 行（@@ -1,3 +1,4 @@）：note for prepend` — `第 1 行` in the new file is
  `inserted`, in the old file it is `alpha`; the number cannot say which.
- prepending `first` to an empty file gives `@@ -0,0 +1,1 @@`, so the note reads
  `1. 第 0 行：n`. There is no line 0.

The `@@` header travels with the note, which is the saving grace — an agent that reads
unified-diff syntax can work out what happened. But the sentence in front of it is wrong,
and "第 0 行" is the kind of label that makes a reader stop trusting the rest of the list.

### 66. The caret column counts UTF-16 code units and calls them columns

`src/client/markdown/edit.ts:74` computes `column: element.selectionStart - head.lastIndexOf('\n')`
and the docstring above it (`:27`, `:67-69`) says "1-based on both axes". `selectionStart` is a
code-unit offset, so an astral character (anything outside the BMP — emoji, rarer CJK, some
symbols) counts twice, once for each half of its surrogate pair.

Measured through the real `caretIn` with the caret after the last character:

| text | length | reported |
|---|---|---|
| `ab` | 2 | column 3 |
| `a😀b` | 4 | column **5** |
| `e` + combining acute + `x` | 3 | column 4 |
| `中文x` | 3 | column 4 |

CJK is fine — one character, one code unit each — so `中文x` reporting column 4 with the caret
at the end is right (three characters, one-based). The combining-mark row is also defensible:
`e` + combining acute + `x` is three code points, and 4 is the one-based code-point column. The
**astral** row is the one that is plainly wrong: `a😀b` is three characters and reports
column **5**, because the emoji occupies two code units.

This is a display-only number: the text and the diff are unaffected, which is why it is low.
It is recorded because the field is labelled "column" and a column is not a code unit, and
because the fix is `[...head].length + 1` rather than anything structural.


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
- **Numbering across pages and a scoped send.** `numberingOf` numbers the whole
  document by page then draw order, and a scoped send passes the document's
  numbering into `buildDocument`, so the prose keeps one set of numbers. (The
  *picture* does not — that is finding 23.)
- **Mark identity across a reload.** Marks are read verbatim from the sidecar and
  never re-keyed; `canvas/ids.ts` mints ids only for new marks.
- **The autosave signature baseline.** The first effect run after a load records
  the signature and schedules nothing, so opening a figure is not written back.
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

- **`src/client/popover.ts:78-91` — `placeCard`'s doc block sits on top of `measuredSize`.**
  Two JSDoc blocks run back to back, and the first one — with all four `@param`
  tags and its `@returns` — describes `placeCard`, which is declared ~25 lines
  later with no comment at all. A tool that reads the doc of the next declaration
  therefore attributes "the nearest corner to an anchor that still fits inside the
  panel" to `measuredSize`, whose own block follows immediately. Pre-existing on
  `4b3daa1`, not introduced here; it survived the split because a javadoc linter
  cannot see a block with no declaration.
  Nine other back-to-back pairs exist, and they are benign: eight are a module
  header followed by the file's first declaration (`dom-path.ts`,
  `pick.ts`, `scale.ts`, `shared/path-name.ts` and four more), and one is
  `icons.tsx:68`. `AnnotatorBody.tsx` has five (`:215`, `:348`, `:1030`, `:1443`,
  `:1624`) and the baseline already had seven of its own — a habit that outlived
  the file it started in.
- **`src/client/styles.ts` — eleven class rules nothing can match.** Extracted
  every `.da-…` class the stylesheet names and searched the rest of `src/` for it:
  `da-btn-icon`, `da-btn-count`, `da-chip`, `da-stylewrap`, `da-docbar-count`,
  `da-docbar-note`, `da-page-field`, `da-page-total`, `da-send`, `da-send-note`
  and `da-tool-label` appear only in the stylesheet. There is no dynamic class
  concatenation to explain it (`grep 'className={`' src/` finds one template
  string, and it is an id). `da-tool-label` is the interesting one: two rules hang
  off it, including the pressed-tool colour
  (`styles.ts:192,196`), so a reader comparing the stylesheet to the toolbar would
  conclude the tools show a caption. They do not — `chrome.tsx` renders the icon
  alone, and `tests/tmp-audit-chrome.spec.tsx` asserted
  `querySelectorAll('.da-tool-label').length === 0` while this was being written.
- **`src/client/locales.ts:78,80,117-119`** — five keys are defined in both
  languages and referenced nowhere: `pageOf`, `sendNone`, `detailHint`,
  `detailUnset`, `detailIdle`. Checked by extracting every key from the `zh`
  object and searching `src/` and `tests/` for each as a string literal; the other
  five the rough scan flagged (`revealMark`, `dock`, `documentScope`, `collapse`,
  `expand`) do resolve through `t('…')`. Not a defect in itself — dead strings cost
  bytes, not behaviour — but `pageOf` and `sendNone` read like the copy for a page
  counter and an empty-hand-off state, which is exactly the kind of thing that
  looks implemented when it is only written down.
- **`src/client/figure-dom.ts:32-41`** — the comment on `REMOTE_STYLE_RULES` says
  a remote `url(…)` "inside `style` is caught by the same check its markup
  equivalent is". Neither half holds. `stripRemoteStyleRules` rewrites only the
  text of `<style>` elements; the `style` *attribute* is never inspected, and
  no attribute at all is checked for `url(…)` — only `href`/`xlink:href` are.
  Measured over the real sanitiser: an inline `<svg>` carrying
  `fill="url(http://host/a.svg#g)"`, `clip-path="url(…)"`, `stroke="url(…)"`,
  `mask="url(…)"` or `style="fill:url(…)"` comes out of `parseFigureSvg`
  unchanged, and a real Chromium inlining that markup issues the request. What
  actually stops it is the *host page's* policy — `img-src 'self' data: blob:`
  in the app shell — so the plugin is safe today by a rule it does not control
  and its own comment does not mention. The export path is contained for a
  different reason again: the review SVG is rasterized from a `data:` URL in an
  `<img>`, where the fetch does not happen. Worth knowing before anyone
  relaxes the host policy or reuses `parseFigureSvg` outside the panel.
- **`src/client/AnnotatorBody.tsx:1031-1046`** — two orphaned JSDoc blocks with no
  declaration beneath them; they document `chooseColor`/`repaintSelected`, which
  live at `:1593-1611` undocumented.
- **`src/client/AnnotatorBody.tsx:1754-1767`** — the same two comment blocks
  appear twice verbatim; the second pair is dead.
- **`src/client/AnnotatorBody.tsx:655-657`** — the load effect's comment explains
  that "the saved document's number style describes the picture on screen". No
  field on the annotation schema holds a number style; `numberStyle` does not
  exist anywhere in `src/`.
- **`src/client/annotator-contract.ts:187-190`** — declares `mode` and
  `onModeChange`; `pdf/PdfBody.tsx` owns and passes them, `AnnotatorBody` reads
  neither (zero grep hits), and its own docstring at `:216-218` states "There is
  no viewing mode". A dead contract kept alive by one supplier.
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
