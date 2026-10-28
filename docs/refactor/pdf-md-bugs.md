# Bugs found in the PDF and Markdown chains

Found by a read-only audit while the files around them were being split. None of
them was fixed: the refactor's contract is that behaviour does not change, and a
fix is a behaviour change. Each one is recorded with the file and line it lives
at (baseline line numbers), how to make it happen, and what the reader sees.

Severity is about the reader, not about how interesting the bug was to find.

The strongest cluster is at the top: three of the four high-severity findings are
the same mistake in different places — **switching documents does not reset the
state that belonged to the old one**. That is worth reading as one finding with
three symptoms.

Baseline is `4b3daa1` on `refactor/cohesion`. No behaviour was changed while
auditing; every entry was established either by a probe or by reading the code,
and the ones marked "verified" were run on this machine through a throwaway probe
(the probe was deleted and is not in the tree).

**Every `path:line` points at baseline `4b3daa1`, not at the refactored tree** —
the split moved `PdfBody.tsx` (968 lines) and `pdf/annotate.ts` (634 lines), so
the line numbers all shifted. The code at each defect was carried through the
split **verbatim** (that is what "pure refactor" means), so the same passage is
still findable in `src/client/pdf/` by symbol name.

---

## 1. Switching to another document does not clear the previous one's annotation state (high, verified)

`src/client/pdf/PdfBody.tsx:410-432` (the effect that reads the sidecar)

```ts
const saved = loaded.annotation
if (saved === null) return          // ← returns here and sets nothing
setMarks(groupByPage(saved.marks))
setSummary(saved.summary ?? '')
if (saved.marks.length > 0) setMode('annotate')
setCreatedAt(saved.createdAt)
setStale(saved.figure.sha256 !== loaded.sha256)
```

**How to make it happen**: switch the sidebar tab from a PDF that has an
annotation to a PDF that has never been annotated (or to any document whose
`annotation === null`).

**Expected**: the new document opens with empty marks, empty summary,
`createdAt` null, `stale` false.

**Actual**: `marks` / `summary` / `createdAt` / `stale` all keep the previous
document's values. The probe (a 3-page document A with one annotation, then a
switch to document B whose sidecar is null):

```
DRAFT AFTER SWITCH [{"id":"from-first-document","kind":"rect",...,"page":1}] text 'marks 1'
```

Worse, the leak **lands on disk under the other document's name**: drawing one
stroke in B triggers the autosave, and the payload written is

```
{"figure":{"address":".../other.pdf","path":"/w/other.pdf","sha256":"bbbb...","pageCount":3},
 "marks":[{"id":"fresh",...}],"summary":"","createdAt":"2026-01-01T00:00:00.000Z"}   ← A's createdAt
```

That is the new mark together with the old document's `createdAt`, written into
B's sidecar. And if the reader draws nothing and simply presses send, the whole
of A's annotation is written under B's name into `B.annot.json` and
`B.annotated.pdf`. This is "the annotation lands on the wrong document", the one
kind of error §2.2 says the write surface must never make.

The same effect also misses resetting `requested` / `zoom` / `generation` /
`selectedId` / `openPanel`; the consequences are finding 2.

## 2. Switching documents does not reset the page number, so the render effect goes past the new document's end (high, verified)

`src/client/pdf/PdfBody.tsx:515-531` (the render effect) and `:488` (`stated`)

```ts
const stated = clampPage(requested, pageCount)      // used for display only
...
const rendered = await renderPage(pdf, requested, renderWidth)   // ← uses the unclamped requested
```

**How to make it happen**: page to page 3 of a 3-page document, then switch to a
1-page document.

**Expected**: the new document shows page 1.

**Actual**: `requested` is still 3, `pdf.render(3)` throws, and the panel becomes

```
打开 PDF 失败：no page 3      ← the probe's actual output
```

while **the new document itself is perfectly fine**. The reader's only way out is
to close the tab and reopen it (see finding 3: once this error appears it never
goes away). So "switch from a long document to a short one", an entirely ordinary
move, makes the new document unreadable.

## 3. `error` is never cleared once set (high, verified)

`src/client/pdf/PdfBody.tsx:300` (state), `:397`, `:527` (two `setError(...)`
calls), `:860` (the render branch)

There is no `setError(null)` anywhere in the file. The render branch is
`error !== null ? <error notice> : shown === null ? <placeholder> : <AnnotatorBody>`,
so `error` wins over everything:

- finding 2's `no page 3` is never overwritten by a later successful render;
- after one transient render failure (paging too fast, a canvas allocation
  failure), the panel keeps showing the error even once every later render
  succeeds, so the reader sees a "PDF that will not open".

**Expected**: a successful `setShown(...)` or a document switch should clear
`error`, or at least the error and `shown` should be decided by which is fresher.

## 4. A placed point's ring radius in the PDF export scales inversely with the pen weight (medium, verified)

`src/client/pdf/annotate.ts:407-421` (`pointContent`)

```ts
const base = Math.max(placed.width / (STROKE_WIDTH * unit), 0.0001)
const radius = POINT_RADIUS / base        // placed.width = 2.5 * weight * unit / scale ⇒ base = weight
```

**How to make it happen**: any `point` mark written into `<name>.annotated.pdf`.

**Expected**: the same as the screen and the delivered PNG, where
`pinRadiusOf = POINT_RADIUS(10) * weight * unit` (`src/client/render.ts:53,67`).

**Actual** (the probe read the written appearance stream back, in user units,
scale = 1):

| weight | unit | screen pin radius | PDF ring radius |
|---|---|---|---|
| 1 | 1 | 10 | **7** |
| 2 | 1 | 20 | **3.5** |
| 0.5 | 1 | 5 | **14** |

The radius is both too small and moves **inversely** with the weight. The reader
drags the pen thicker and the ring in the PDF shrinks; the same mark looks
different in `annotated.pdf` (the copy the agent checks in a reader) and in the
PNG that goes with it.

## 5. `annotate.ts` keeps its own copy of the drawing constants, and the copy has drifted (medium)

`src/client/pdf/annotate.ts:55-77` vs `src/client/render.ts:30,48,53,67`

Two sets of `STROKE_WIDTH = 2.5`, `ARROW_HEAD = 14`, `ARROW_SPREAD` and point
radius, maintained separately. Where they have already drifted:

- `POINT_RADIUS`: 7 in the PDF, 10 on screen (the direct cause of finding 4);
- in the PDF a point is a "thin ring plus a filled dot", on screen and in the
  export it is a "teardrop pin with a white number" — two unrelated geometries;
- the number appears only on screen and in the PNG; `annotated.pdf` carries no
  numbers at all, so "the third mark" cannot be matched by number in the PDF copy.

This is not one typo but a structural "two sources of truth" problem: change one
and the other is necessarily forgotten. The fix is for the PDF side to reference
the same geometry functions. `annotate.ts`'s comment says it cannot import
`../mark-geometry` because a chunk cannot share a module with the main bundle —
but `render.ts`'s pure constants could travel as props, or be copied into one
module inside the chunk.

## 6. A non-ASCII note comes back changed after a `PDFString` round trip (medium, verified)

`src/client/pdf/annotate.ts:154-159` (`latinEncodable`), `:493-495` (`contentString`)

`latinEncodable` treats "every code unit ≤ 0xFF" as "safe for `PDFString`", but
`PDFString.of` writes **PDFDocEncoding**, not Latin-1: 0x80–0x9F and 0xA0 map to
different characters in PDFDocEncoding.

**How to make it happen**: a note containing U+0080–U+009F or U+00A0 (a
**non-breaking space** — extremely common when text is copied from a web page or a
PDF).

**Actual** (probe write-then-read round trip):

```
"a\u00a0b" -> PDFString -> reads back "a€b"    MISMATCH
"a\u0080b" -> PDFString -> reads back "a•b"    MISMATCH
"café"     -> PDFString -> reads back "café"   OK
```

**Expected**: the note comes back character for character; this has to go through
`PDFHexString.fromText`'s UTF-16BE path.

## 7. `lazy()` caches one failed chunk load forever, and there is no error boundary (medium)

`src/client/LazyPdfBody.tsx:14-17`

React's `lazyInitializer` (`react/cjs/react.development.js:1354-1409`) permanently
stores `payload._status = Rejected` and `_result = error` when the promise
rejects, and re-throws `payload._result` on every later render.

**How to make it happen**: `require.async('./client.pdf.js')` fails the first time
(the host route hiccups, the chunk 404s, the machine reconnects offline).

**Expected**: the next PDF open retries, or at least reports a recoverable error.

**Actual**: every later PDF open in that session immediately throws the same stale
error. And `<Suspense>` handles pending but not error, and there is no error
boundary, so the rejection travels out to the sidebar shell — the whole tab takes
the error state rather than one notice strip.

## 8. `openPdf` leaks the Blob URL when the Worker cannot be constructed (low)

`src/client/pdf/runtime.ts:86-95`

```ts
const sourceUrl = URL.createObjectURL(new Blob([workerSource], ...))
const worker = new Worker(sourceUrl, {...})          // ← these three lines sit outside the try
const bridge = PDFWorker.create({ port: worker })
let task ...
const release = async () => { ...; URL.revokeObjectURL(sourceUrl) }
...
try { ... } catch (error) { await release(); throw error }    // ← the try does not open until line 104
```

**How to make it happen**: `new Worker` or `PDFWorker.create` throws (a CSP that
forbids `blob:` workers, out of memory).

**Actual**: `sourceUrl` is never revoked — one failure leaks a copy of the PDF.js
worker source (~1MB string turned into a Blob).

## 9. A superseded render is never cancelled (medium)

`src/client/pdf/runtime.ts:127-147` (`render`) plus
`src/client/pdf/PdfBody.tsx:515-531`

`rendered.render({...}).promise` returns a `RenderTask`, but the code only awaits
it — it never keeps it, let alone calls `cancel()`. `PdfBody` uses a `live` flag
to discard stale results, but the stale render itself keeps running: when paging
fast or dragging the pane width (one render per 64px step), every superseded
render rasterizes the page in full, allocates a canvas and encodes a PNG data URL,
and only then is thrown away. PDF.js's own `complete()` only sets
`#pendingCleanup` when `intentPrint`, so those intent states are not reclaimed
after `cleanup()` either.

**Expected**: `renderTask.cancel()` on a new request or on unmount (swallowing the
resulting `RenderingCancelledException`).

## 10. `run`'s dependency array is missing `props.figureUnit` (low)

`src/client/pdf/PdfBody.tsx:706-743`

`:721` uses `props.figureUnit`; the dependency array at `:743` does not list it.
If the shell rebuilds the injection surface with a new `figureUnit` identity,
`run` keeps converting pen widths with the old one.

## 11. Deleting a selected mark leaves the selection dangling (low)

`src/client/pdf/PdfBody.tsx:540-553` (`removeAnyMark`)

It removes the mark from `marks` and does not touch `selectedId`. Once the
selected row is deleted from the list, `selectedId` still names a mark that no
longer exists, the page body holds an empty selection, and the comment bubble and
list highlight then depend on how the downstream code tolerates "the selected id
is not in the list".

## 12. During a `bytes` change a render is requested from a destroyed document (low)

`src/client/pdf/PdfBody.tsx:381-404`

On a document switch the cleanup calls `opened.destroy()`, but the `pdf` state
still points at the old document until the new one finishes opening. If the pane
width changes inside that window (`ResizeObserver` fires `setPaneWidth`), the
render effect calls `pdf.render(...)` on the destroyed document, gets a
"Worker was terminated"-style error, and finding 3's "never cleared" pins that
error on screen.

---

## Two things that were checked and are not bugs (so nobody re-investigates)

- **A PDF text layer / character offsets / selection restore.** There is no text
  layer anywhere in `src/client/pdf/` — no `getTextContent` and no text-layer DOM
  in the whole repo. AGENTS.md §7.5 states "no PDF text layer and no continuous
  scrolling: one page at a time" as a recorded product boundary, not a defect. So
  this class of bug does not exist in this render chain.
- **Markdown and `RENDER_WIDTH = 1024`.** `RENDER_WIDTH` is used only by
  `src/client/html-dom.ts` and the html branch of `AnnotatorBody`; the Markdown
  body is a `<textarea>` (`MarkdownBody.tsx:259`) that produces no annotation
  coordinates. So the risk of "coordinates recorded at a fixed render width and
  then wrong after a reflow" does not apply to Markdown — it belongs to the HTML
  render surface, which is out of this task's write scope.
  The one real Markdown drift is small and mild: it does not clear its edit state
  after delivery (`MarkdownBody.tsx:195-225` has no `discard()` of the kind
  `AnnotatorBody` has), so the same diff can be sent a second time — low severity,
  not listed above.
