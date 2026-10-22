# Drawing a mark opens its sentence, and a record folds when you look away

## What the reader asked for

Two things were one gesture short of natural:

> 应该是放置完成组件之后立马有评论框弹出来

> 然后点击横着的那个条的元素，应该是在其上下出现总体目标、标注清单，然后点击其他空白时候，不用刻意点叉就能收回

The first is about drawing. A mark is placed with a drag, and until now the sentence
that gives it meaning was a second errand: find the row in the list, or select the
mark, then type. The shape on the figure said nothing until that errand was run.

The second is about the two records — the overall goal and the mark list. They opened
from the bar and closed on their own cross, and nothing else shut them. A cross is a
small target in the corner of a card that is covering the figure, and having to aim
at it to get the picture back inverts the point of a floating record.

## The sentence arrives with the mark

`AnnotatorBody.finishDrawing` used to take no arguments and did one thing: disarm the
tool. It now takes the id the canvas hands back and does three: disarm, select that
mark, and ask for the caret in its detail.

The asking goes through the same `focusId` path a double click uses. That path is a
request held until the card exists, because the card's position is computed in an
effect of its own — so the caret lands one render later, in a box that is really
there, rather than on a ref that is still null.

The caret goes to the **end** of whatever is already in the field, so a mark whose
detail was written earlier and is being redrawn keeps its sentence intact and the
reader appends to it.

## A record is a fold, not a mode

Both records now close on any press that lands outside them:

- inside a `.da-float` — that is the record the reader is working in;
- inside `.da-bar` — the bar's own buttons are how records are opened and exchanged,
  and pressing one to open the other must not be a close-then-open that loses the
  first;
- anywhere else — including a press the handler cannot place, such as one that
  reaches the document itself.

The close buttons stay. They are what a keyboard reaches, and what a reader uses when
they want the fold gone while the focus stays where it is. Nobody *has* to hit them
any more.

## The records hang off the bar

They were pinned to the panel's bottom edge, which was right while the bar was pinned
there too. Once the bar became draggable that anchor was a lie: park the bar top-left
and its records still opened along the bottom.

`placeAboveBar` measures the bar's laid-out box and returns the record's left edge
plus **a distance up from the panel's bottom**. A bottom offset rather than a top one
because the records size themselves to their content — a list of one mark is not as
tall as a list of nine — and a bottom offset needs no height known in advance.

The measurement is stored through the same idempotent-comparison guard the detail
card uses: a page body rebuilds its surface box on every render, so an unconditional
`setState` here would make the effect its own trigger and spin.

The stylesheet keeps a bottom-centre fallback for the frames before the measurement
lands, and `.da-float-record[style]{transform:none}` drops the fallback's centring
transform once real coordinates arrive. The inline style is written as
`style={{ left: floatsAt?.left, bottom: floatsAt?.bottom }}` rather than a ternary,
so there is no third branch to leave uncovered.

## A bar parked at the top keeps its records in view

Anchoring records above the bar is right while the bar is on the bottom edge, and
wrong the moment the reader drags it to the top of the pane — which is a legitimate
parking spot, because it is how the bottom of a tall figure becomes reachable.

`placeAboveBar` now checks the room above: at least `RECORD_ROOM` (180px) and it
opens upwards, otherwise below the bar's bottom edge. The guess is deliberately
short — a record taller than expected opened off a bar near the top would be a record
nobody can read.

Two placement details that were wrong and are now right:

- The parked bar kept the stylesheet's `bottom:12px` alongside the inline `top`. A
  flex strip with both edges pinned and no height of its own stretches to fill the
  gap, which turned the bar into a full-height column. `data-parked` switches the
  bottom anchor off.
- A record's inline placement writes **both** vertical sides, one real and one
  `auto`. A card that grows downwards must not also be pinned by its bottom edge,
  for the same reason.

The strip colour went from `#1d1f24` to `#2d2d2d`, the value the reader pointed at
as the weight they wanted: still dark enough for white glyphs on any figure, less
like a black bar sitting on the picture.

## Alternatives considered

### Leave the sentence to a second click

Rejected: the mark is meaningless until it is written, so the gesture that makes it
should ask for the writing. A reader with nothing to say presses Escape, which costs
one keystroke; a reader with something to say saves a hunt.

### Select but do not focus

Rejected: selecting already opens the card, so the only thing focus adds is the
caret. Without it the reader has to click the field they were just shown — the very
errand this change removes.

### Focus from the list too

Rejected: clicking a row is how a reader *reads* which mark is number 3. Stealing the
caret there would put the keyboard in a text field whenever they were only looking,
and the arrow keys would start moving a cursor instead of their attention.

### A scrim over the figure that closes on click

Rejected: a scrim eats the first click, so a reader who wants to draw again would need
two. It also dims the figure, which is the thing the record is supposed to be
commenting on.

### Keep only the close buttons, and make them bigger

Rejected: the problem is not the target size, it is that closing requires aiming at
all. Looking back at the picture is the natural way to put a picture-side record away.

### Close on the next draw only

Rejected: a reader reading the list to decide what to fix next would keep it open over
the figure the whole time. Any press elsewhere is a better signal than one particular
kind of press.

### Anchor the records to the panel and move them with the bar's offset

Rejected as arithmetic for its own sake: the bar is measured anyway to drag it, and
its own box is the honest anchor. Deriving an offset from the drag fractions would
have to assume the bar's width and height, which change with the zoom and the content.

### Anchor to the top instead of a bottom offset

Rejected: the records are content-sized. A top anchor would need the record's height
measured first, which means a second layout pass and a visible jump on open.

### Give the bar a fixed width so centring is trivial

Rejected: the bar's width is its contents, and its contents depend on whether a page
body is present (no send buttons on a PDF page). A fixed width would either clip or
leave a gap.

### Flip the record to the bar's far side only when it would leave the panel

Rejected: that needs the record's height, which is content-sized and not known until
after layout — the same measurement dance the detail card already does, for a card
that is only ever slightly taller or shorter.

### Give the bar a height so a top and bottom anchor could coexist

Rejected: it would fix the symptom. A strip placed by one edge should be placed by
one edge.

### Keep the ternary on `floatsAt`

Rejected: `undefined` style values are already dropped by React, so the ternary bought
nothing but an unreachable branch that the 100%-per-file threshold would then demand a
test for.
