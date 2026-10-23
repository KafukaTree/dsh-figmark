# The message the agent can act on

## Problem

The annotation message is the whole product. Everything the reader does in the
panel — circling a label, dragging an arrow, typing a sentence — reaches the
agent as one block of text, and the agent never sees the panel. So a mark that
is written down badly is a mark that gets fixed wrong or not at all. Reading our
own output next to how the field writes this down turned up four defects, three
of which were silent.

1. **A box was written in drag order, not in box order.** Dragging up and to the
   left produced `box (187,138)-(42,88)`. The agent has to take a min and a max
   before it knows which area is meant, and an agent doing arithmetic on a
   coordinate is an agent that can get it wrong.
2. **A freehand stroke was written as a point count.** `freehand stroke (37
   points)` says nothing about where on the figure the line is. The reader drew
   a line; the agent got a number.
3. **The guidance promised a suffix no message carried.** The prompt section told
   the agent to look for `锚定:` on a mark. No message has ever contained that
   string. An agent following the section looked for a marker that was not there.
4. **English messages were punctuated in Chinese.** `(id=line2d_10)` used
   full-width brackets and `，` separated the clauses.

Two smaller things were cost without use: the figure's `sha256` in the header,
which the agent cannot act on (it reads the file it is given), and a four-sentence
closing paragraph that repeated, almost verbatim, clauses 4 and 5 of the standing
prompt section.

## Decision

**Write the geometry so it reads as the shape, not as the gesture.** `extents()`
writes both corners left-to-right and top-to-bottom whatever direction the drag
went, so the same box always reads the same way. A freehand stroke is written by
its bounding box (`strokeExtents()`), which is the one thing about a stroke that
locates it.

**Name the overhang instead of leaving a sign to be noticed.** A mark drawn past
the edge of the figure keeps its true coordinates — a negative number is an
accurate description of where it is — but the line gains a suffix naming how far
and which way: `（超出图面：上 57 像素）`. The agent no longer has to notice a
minus sign and infer that it means "off the picture". A mark inside the figure
gets nothing, a side that rounds to zero gets nothing, and the sides are always
named left, up, right, down so the same box reads the same way twice.

**Say `批注` where the reader's sentence starts.** The word used to be `要改`
("to change"), which reads as an instruction from the tool rather than as the
reader's own note. `批注` is what the reader is doing. English is `note:`.

**One closing sentence, and it names the target.** The standing rules are in the
prompt section that every one of these messages arrives under; repeating them
per message made the part the agent has to act on harder to find. What remains
per message is the one thing the section cannot know: whether this is a figure,
a PDF or an HTML document, and therefore what "the source" means here.

## Alternatives considered

- **Normalize coordinates to 0–1, as slimsnap-schema does.** Rejected: that
  schema normalizes because its frames are screenshots whose pixel size varies.
  Our figure is one file with one fixed pixel grid, so pixel coordinates already
  are its own units; normalizing would add a multiplication the agent has to undo
  before it can act, and rounding to four decimals loses the sub-pixel precision
  the reader aimed with.
- **Drop the coordinates entirely and rely on the numbered pins.** Rejected:
  the pins are on the picture, and the picture is not always attached (a
  points-only mark set attaches no picture at all). The numbers are the payload
  for exactly those messages.
- **Give every mark a stable id (`m3`) so the agent can cite it.** Considered
  and rejected for now: the circled number already is that id, it is what the
  picture shows, and the agent answers by number. A second identifier would be a
  second thing to keep in step.
- **Explain in the message what the circled numbers mean.** Rejected on the
  evidence of Set-of-Mark: marks need no gloss, and a gloss on every message is
  the kind of text that trains a reader to skip the message.
- **Omit the overhang suffix and let the agent infer it from the sign.**
  Rejected: it is a correct encoding, but it costs a reasoning step whose failure
  is silent — the agent edits the wrong place and says nothing.
- **Drop the closing sentence entirely.** Rejected: for a PDF the "source" is the
  generator script and for HTML it is the template, and the difference changes
  what the agent opens. One short sentence carries it.
- **Rename only in Chinese and leave English as `change:`.** Rejected: the two
  locales drifted apart in punctuation for the same reason; `note:` is what the
  reader's sentence is in English too.

## Consequences

- Same three marks, same figure: the message is 230 characters in Chinese
  (was 294) and 351 in English (was 478) — 22% and 27% shorter, and everything
  removed was text the agent could not act on.
- `describeMark` takes an optional fourth argument, the figure, so the overhang
  can be measured. `describeMarks` passes `document.figure`; a caller with no
  figure size gets no suffix rather than a guess.
- The guidance section now describes the format a message really has, and is
  covered by a test that asserts the two do not drift apart again.
- Marks drawn past the edge read as deliberate. The exported picture rules a
  grey dashed line at the figure's true edge, so the overhang is visible in the
  attachment as well as named in the text.
