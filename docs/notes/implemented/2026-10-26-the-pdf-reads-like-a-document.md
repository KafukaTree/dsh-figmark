# The PDF reads like a document, and pages are turned the way a reader turns them

## Problem

The PDF body was a picture of one page with two buttons beside it. A reader who
had a 29-page deck could go forward and back and nothing else: no way to jump to
page 18, no way to keep reading by scrolling, no arrow keys, no wheel — and the
pages around them were invisible, so they could not tell where in the deck they
were without counting presses.

Worse, three things were simply unbuilt. `.da-toolbar` and `.da-send` were used
by `PdfBody` and `MarkdownBody` but **defined nowhere** in `src/client/styles.ts`,
so the toolbar had no spacing and the send buttons were bare text. And the
document's hand-off was wired to a body that never draws it: a page body refused
to render the dock (`AnnotatorBody.tsx` had `{isPage ? null : …}`), so the send
buttons existed only in the document's own footer.

## Decision

**Two flows, one page number.** `PageFlow = 'single' | 'continuous'` in
`src/client/pdf/paging.ts`. Single flow is one page in the pane, stepped between;
continuous flow stacks every page in a column and lets the reader scroll. Both
read the same `stated = clampPage(requested, pageCount)`, because the page number
is what every mark is filed under — a flow that could disagree with it would file
a mark on page 3 under whatever page the toolbar happened to say.

**Continuous flow is laid out arithmetically, not by the browser.** `pageSlots`
in `pageSlots` (since withdrawn — see the end of this note) placed every page before a single raster exists: a
page's slot is `metrics.width × its own aspect`, stacked with `COLUMN_GAP`
between, with no trailing gap after the last page. A layout the browser computed
could not answer "which page is at scroll offset 4000" without measuring the DOM;
this one answers it from the same numbers that drew the scrollbar, so the number
in the toolbar and the scroll position cannot drift apart.

**The page being read is the one under the middle of the pane**, not the one at
its top edge (`pageAtScroll`). A page that fills most of the pane is still the
page being read after its heading has scrolled out.

**Four gestures, one answer.** The two buttons, the arrow keys, the number box,
and the wheel at an edge all resolve through the same `clampPage`/`keyedPage`/
`parsePageInput`/`wheelTurn` functions. That is the whole reason those are
ordinary functions in their own module with their own specs: four opinions about
one number drift apart the moment each computes it itself.

- Keys: arrows, PageUp/PageDown, space, Home, End — and **nothing while a
  modifier is held**, because Cmd+Arrow selects text and Ctrl+Arrow moves a word,
  and a page body that swallowed those would be stealing gestures it does not own.
- Keys are also ignored while the reader is typing: `typingIn` rejects any target
  inside a `[contenteditable]` region or an `INPUT`/`TEXTAREA`/`SELECT`. It tests
  the attribute rather than `isContentEditable`, which a rendered frame's own
  document does not answer.
- The wheel turns the page only at the edge it is pushing against, and only after
  `WHEEL_TRAVEL = 40` of travel: a trackpad delivers one flick as dozens of small
  deltas with momentum behind them, and turning on the first would page through
  the document faster than anyone can read it.

**Only the pages near the one being read are rasterized** (`COLUMN_REACH = 1`,
`pruneDrawn` drops the rest). A 300-page column drawn whole is hundreds of
megabytes of bitmap for one screenful.

**The choice is a habit, so it outlives the document.** It is stored beside the
drawing colour in the same preference record. Because the PDF chunk cannot import
the entry bundle at all, the two accesses reach it as injected seats
(`readPageFlow`, `writePageFlow`) rather than as an import — a plain import there
is a synchronous require of a chunk the browser factory cannot load, which fails
the build with `require('./client.preferences.js') would not resolve in the
browser`.

**Clearing the document remounts the page.** A page body seeds its marks once, on
mount, so delivering and deleting a document left the page still listing the
marks that had just been sent. `discard()` now bumps a `generation`, which is part
of the body's key.

## Alternatives considered

- **Only one flow.** The reader was asked; they chose *both, with a switch*. A
  deck is read by paging and a paper is read by scrolling, and a panel that picked
  one would be wrong half the time.
- **Let the browser lay out the column and measure it.** Then the page number
  would come from DOM geometry, which arrives a frame late and disagrees with
  itself during a scroll. Arithmetic answers immediately and is testable without a
  browser.
- **Hand the send gesture to the page body** (`onHandOff`/`canHandOff` props, then
  have the page forward upward). Abandoned: the page body never renders the dock
  (`{isPage ? null : …}`) and never reads the sidecar (`if (isPage) return` makes
  `loaded` permanently null), so the whole path was unreachable code that could not
  be covered. The document sends, from its own footer, which is where the gesture
  already was.
- **Turn the page on every wheel event.** A mouse delivers one event per notch and
  would feel right; a trackpad does not. Counting travel serves both.

## Tests

`tests/paging.spec.ts` (29) and `tests/flow.spec.ts` (20) cover the arithmetic
without a browser. `tests/pdf-body.spec.tsx` grows `the flow a document is read
in` (7), `paging by hand` (7) and `the wheel at the end of a page` (7): each one
mounts the body, turns a page by its own gesture, and reads the toolbar back.
`tests/preferences-seat.spec.ts` (3) covers the two injected seats.

## Follow-up: the strip, and one page's worth of chrome

The first build of this had three faults the reader found in one look.

**Every page in the column carried its own tool palette, weight rail and bottom
bar.** A column mounts one `AnnotatorBody` per page — that is how each page keeps
its own marks and its own undo history — so each of them drew its own floating
chrome, and a 29-page deck became 29 stacked toolbars. The body now takes
`chrome?: boolean`, default true, and only the page being read passes it false for
the rest. A body mounted alone is unchanged.

**The hand-off was still a footer under the page.** It read as a second, separate
decision from the paging above it, when handing the marks over is the *last* step
of the same task. The two buttons moved onto the document's strip, at its end —
past the page count, so a slip of the pointer on the page controls cannot send a
half-finished figure.

**The strip itself was the shell's grey buttons in a row.** Nothing about it said
it belonged to this plugin. It is now `.da-docbar`: the same object as the
figure's own `.da-bar` — a dark rounded card floating over the page, 16px radius,
the same shadow, white glyphs, the same hairline separators — so a reader who has
marked a figure and then opens a document does not have to learn a second set of
controls in a second visual language. Paging is one group; the page number is a
label until pressed and a box after; the flow switch states its mode in words and
fills blue when continuous; the count sits quiet at 11.5px / 62% white.

The buttons are glyphs now, so their accessible name is their `aria-label` —
`tests/pdf-body.spec.tsx`'s `button()` helper matches on that first and falls back
to text, which is what the page number and the flow word still are.

## Follow-up: one bar, on the pane

The strip was two faults wearing one coat. The reader said it plainly: the paging
row above the page was *rough* and had nothing to do with the rest of the panel,
and the floating bar was *following the page* — sliding away as they scrolled,
stuck inside whichever page they were on.

**The second one was the design fault.** The bar was rendered by the page body, so
it lived inside `.da-column-slot` — inside the page. In a column of 29 pages that
meant 29 bars, one per page, each at that page's own offset, and every one of them
scrolling away with its page. A control that answers "what am I drawing with"
belongs to the pane; it must not move when the document does.

The body now takes `chromeHost?: HTMLElement` and `createPortal`s its chrome into
it. The PDF pane passes its own `.da-pdf` node — set from the same ref callback
that measures the pane — so the bar is a child of the pane, not of a page. There
is exactly one bar, and it does not move.

**The first one was a duplicate.** `.da-docbar` was a second dark card above the
page, in its own idiom: a grey action row that the rest of the plugin never uses.
It is gone. The paging controls are drawn by the document (the page number is that
side's state) and handed to the body as `pagingSlot`, which the body places at the
**start** of its own bar, before the colour button — paging is what the reader
decides first, the colour belongs to the stroke after. The flow switch and the
count ride in the same slot. The two hand-off buttons moved to the **end** of that
bar, through `onSend`, past everything that edits, because delivering the marks
ends the session rather than continuing it. That is also where the figure's own
panel keeps them, so the two panels now agree.

Until the first raster exists there is no page body to carry the bar, so the pane
stands one in (`.da-bar[data-static="true"]`): the page count and the hand-off are
answerable before the drawing is, and a reader pressing send then gets the same
"the document's facts are not known yet" rather than a missing button.

## A disaster worth recording

Recovering from a brace mistake, this session ran `git checkout
src/client/AnnotatorBody.tsx`. The working tree had **the whole day's work
uncommitted** — the plugin's rule is that nothing is committed — so that command
deleted the chrome gate, the 24-grid icon redraw, the removal of the blue
hand-off background, and the entire right-click menu integration. There is no
reflog entry for work that was never committed.

It was rebuilt from `lib/client.js`. The build is not minified (`sourcemap: false`,
but the ESM→CJS translation keeps every identifier, string and comment), so the
compiled file is a readable record of the lost source, and everything was
recovered from it: `chrome !== false`, the four icons on the 24 grid, the pin's
inner dot, `menuItems`/`openMenu`/`runMenu`/the outside-press effect, and the
`.da-menu` markup.

The rule this leaves behind: **never `git checkout` a file in a repository whose
work is deliberately uncommitted.** Back the file up to `/tmp` first, and undo a
bad edit by inverting the edit, not by asking git for a version it never had.

## Follow-up: one size, one list, one frame

Four things the screenshots showed at once.

**The pages came out different sizes.** Each page body fitted itself to the box it
measured, and in a column every page measures at a different moment: one that had
not been laid out yet fell back to its own pixel size while its neighbour had
already measured, so page 8 was narrower than page 9. The owner now hands every
sheet the column's width (`fitWidth`), so none of them has to guess. The same fault
had a second cause: a bitmap drawn before the magnification changed stayed in the
column and was fitted at the new size, blurring and mis-sizing one sheet among
fresh ones — so a width step now drops every drawn page and the column redraws.

**The list was one page's.** It showed the marks of the sheet in view, so a file
carrying seven marks read as "one mark" on whichever page the reader happened to
be. The list is the map of what is about to be sent, and what is sent is the whole
file: pages are handed `documentMarks` (every page's, stamped with its page) and an
`onDocumentRemove` that reaches marks this body is not holding.

**The flow switch spoke.** 「单页 / 连续」 in a bar of glyphs was the only word in
it, and it made the bar jump width as it changed. It is now a sheet and a stack of
sheets, with the aria-label naming the flow it offers.

**The bar could be dragged out of the frame.** `.da-pdf` had no `position`, so the
portalled `.da-bar` was absolutely positioned against the viewport instead of the
pane and could be parked outside the plugin entirely. The pane is now the
positioning context, and the drag measures against the box the strip is actually
placed in (`offsetParent`) rather than the page body's own — a fraction of the page
applied inside the pane is what pushed it over the edge.

## Follow-up: a document, not a stack of cards

The reader said the bar could still be dragged out of the frame, and that the
continuous flow "is not the rigid page-after-page thing you built — look at how
Better Sidebar previews a PDF".

**The bar, second attempt.** `.da-pdf` became the positioning context, which was
necessary and not sufficient: the bar is placed as a *fraction* (`left: 82%`) and
then pulled back by its own width (`translate(-100%)`). Those are two different
coordinate systems — a fraction of the pane, and a length in pixels — so a strip
at the right edge hangs its body past the pane's. The drag now clamps to the room
the strip actually leaves: `(paneWidth - stripWidth) / paneWidth`, measured from
the element's own `offsetWidth` at the moment of the drag. A strip wider than the
pane gets zero room and stays put rather than going negative.

**What "continuous" means.** I looked at how `dsh-better-sidebar` previews a PDF
(`src/client/PdfView.tsx`): it fetches the bytes, wraps them in a Blob with an
explicit `application/pdf` type, and hands the URL to an `<iframe>` — the browser's
own PDF viewer. That viewer draws a document as one continuous roll: pages nearly
touching, no shadow, no rounded corner, no background band between them. My column
drew each page as a card of its own — a padded stage, a lifted sheet with a large
shadow, an 18px gap — and a stack of separate objects is exactly what makes
scrolling feel like flipping through cards.

So the column now drops the per-page chrome: no stage padding, no shadow, no
rounded sheet, and an 8px gap. What is left is the sheet and the gap under it.

## Follow-up: the last of the card

The bar is fixed. The pages were still cards, and the reason was arithmetic
rather than style: every slot reserved `pad: COLUMN_PAD * 2`, thirty-two pixels of
allowance for a stage padding that the column had already removed. So each sheet
sat inside a 32px band of nothing plus an 8px gap — a 40px moat around every page,
which is a card laid out on a grid however the card itself is styled.

`pad` is now zero, and three smaller cues went with it: the page body's own
preview background (a band of a different colour between every sheet), the last
2px of corner radius, and the 8% dimming of pages that are not the current one. A
document does not fade the page above the one you are reading.

What is left in the column is paper and a small gap. Everything between two sheets
is the pane's own ground, the way a viewer draws it.

## Follow-up: one sheet, and a list that does not move

Two complaints that turned out to be the same complaint.

**The pages were still cards.** The remaining cue was not on the sheet, it was
between the sheets: an 8px gap and a column ground of the pane's colour, which
draws a line at every join. Both are gone — the gap is zero and the column is
white, so page 8 and page 9 are one continuous white field. Two sheets of one
document, at one width, meeting edge to edge *are* one canvas as far as a reader
can see, and unlike welded-together pixels they keep their own marks, their own
undo history and their own memory.

**The list changed as the reader scrolled.** This was a real bug, and a worse one
than the looks. The chrome moves from page to page in a column, and the open card
and the selected mark lived in the page body — so the list shut itself, the
comment pill vanished and the selection was lost at every page boundary. Both now
belong to the document (`openPanel` / `selectedId` and their change callbacks),
exactly as the magnification already did, and the badge counts the document's
marks rather than the sheet's.

## Withdrawn: the continuous flow

The reader asked for the column to be withdrawn — "delete the feature and the
icon" — after two rounds of making it read as one sheet. That is the right call,
and the reason is worth recording: the last thing that still said "two sheets" was
not a gap or a shadow but the PDF page's own white margin, which is content and
not style. Closing it would have meant welding neighbouring rasters into one
canvas, and that trade is not worth making here — a welded canvas has one
coordinate space, so it would lose the per-page marks, the per-page undo history
and the per-page memory that paging already relies on.

So `src/client/pdf/flow.ts` and `tests/flow.spec.ts` are gone, and with them the
`PageFlow` type, the reader's remembered `pageFlow` preference (and both seats the
chunk held for it), the flow switch and its two icons, and the column's styles.
The document is read one page at a time, which is the shape both the drawing and
the delivery were built around.

## Follow-up: one motion, one meaning

The reader put it as a cost: magnifying a page was expensive because the wheel
could not tell "the next page" from "a closer look". Both were the same motion,
and on a page that fills the pane — where there is nothing to scroll — the wheel
had no reading left but paging.

So the wheel is the magnification now, with or without a modifier: up grows, down
shrinks, and a trackpad pinch arrives as the same event with ctrl on it. Paging
moved entirely to the keyboard, which already answered both axes — left/right and
up/down both turn, so the gesture is the same whichever way the reader thinks of
"next". `wheelTurn` and `scrollEdges` went with the old reading, and so did the
pane's `WHEEL_TRAVEL` threshold.

Nothing was lost on the panning side: a drag with the select tool still moves the
view, which is the gesture that has no other job.

## Follow-up: why the default page looked soft

The page was not under-rendered — it was rendered at almost exactly the screen's
pixel count, and that is the worst place to land. A 595-unit page in an 800px pane
comes out at 832 device pixels per the width step, and the page is then drawn at
1552 device pixels: a ratio of 1.04. Chromium's resampler has no whole-pixel
neighbours to average at that ratio, so every glyph edge gets blended into its
background.

Measured rather than guessed: the 99th percentile of the lateral gradient across a
text line, at a Retina ratio, for a bitmap shown at a fixed device size —

| bitmap / screen | p99 gradient |
| --- | --- |
| 1.0× | 204 |
| 1.04× | 129 |
| 1.25× | 157 |
| 1.5× | 168 |
| 2.0× | 178 |
| 3.0× | 181 |

1.04 is the floor of the table. So the raster now aims at the device pixels the
page *actually occupies* times one and a half (`SUPERSAMPLE = 1.5`), which puts
every pane width at 1.50× — inside the plateau, at a third of what 2× costs.

"How wide the page actually is" is the other half of the fix. Two ceilings decide
it and the raster has to honour both: the pane minus its inset, and the factor fit
width will not grow past (`FIT_CEILING`). A raster made for the pane alone keeps
buying pixels as the pane widens even after the page has stopped growing with it —
at a 2000px pane that was 41 MB of detail the reader could not see. The ceiling is
written in both files because a lazily loaded chunk may not import the client
bundle at run time; they are two spellings of one number and must agree.

Two earlier conclusions from this investigation were wrong, and the reason is worth
keeping: the A/B harness displayed a 1616px bitmap into 776 device pixels, a 2:1
downscale, which destroys every detail regardless of layout. "The transform ancestor
causes it", "the clipping layer causes it", "supersampling does not help" were all
artifacts of that rig. A measurement rig has to hold the bitmap/screen ratio fixed,
or it measures itself.
