# The numbers got smaller, and the reader got a say in it

## What the picture showed

A 283×211 figure came back with five marks on it, each carrying a disc eighteen
pixels across. Eighteen of 283 is six per cent of the figure's width — for a label
whose entire job is to be a reference number, that is a lot of a small plot spent on
decoration. The point mark made it worse: it had already been given a map pin, a
shape that says "here" on its own, and the pin then wore a badge beside it, so one
coordinate arrived with two markers.

Three things were wrong, and they were wrong in different places:

1. The badge was too large, and the size was a constant.
2. A point mark's number sat beside its pin instead of in it.
3. There was no way to change either, though how much decoration a figure can afford
   is a judgement about *that* figure.

The third point is what makes the first two interesting. A screenshot 2000 pixels
wide can carry an 18-pixel disc and never be troubled by it; a 283-unit plot cannot.
The same constant was right for one and wrong for the other, which means no constant
was ever going to be right.

## What changed

**The number is a measurement, not a constant.** `BadgeLook` (`radius`, `gap`,
`fontSize`) is computed from one scale factor by `badgeLook(scale)`, and every
measurement that used to read `BADGE_RADIUS` now takes a look: the candidate
positions, the cost of overlapping something, the disc, the leader, the stroke widths
and the font size. They all scale together, so a small badge is a small badge and not
a small disc with a large digit in it. The default is 0.7, which puts the disc at
about twelve and a half pixels — large enough to read, small enough to stop
competing with the line work.

**A point mark's number moved into its pin.** `badgePlacements` now skips `point`
marks outright: a pin already points at one coordinate, so a badge beside it would be
a second marker for one spot. The digit is drawn inside the pin head, at the badge's
own font size, so a pin's number and a badge's number still read as one set. With the
numbers turned off, the pin head goes back to the dot it had before — the pin is the
mark, the number is the annotation of it.

**The pin's head grew to hold its number.** A number drawn inside a head smaller than
its own disc spills out of it: at 1.6 the pin looked like a circle with a triangle
stuck to the bottom. `pinHeadRadius` is the one place that decides how large a head has
to be, and both the overlay and the delivered picture call it — the pin's tip stays
exactly on the coordinate, and the head's centre moves out just enough to keep the
taper (`PIN_TAPER`, a constant sine) so a large pin is the same silhouette as a small
one. The badge layer measures the grown head too, or a neighbouring badge would be
placed on top of the number it was moved aside for.

**The reader sets both.** A slider spans 0.4 to 1.6 in steps of 0.1, and a tick turns
the numbers off altogether. Both live in the toolbar beside the colours, because they
are the same kind of decision: how this figure is drawn. The style travels with the
annotation (`badgeScale`, `badgesHidden`), so it survives a reload, and it is passed
down to the delivered picture, so the image the agent reads carries the numbers at the
size the reader chose. A PDF keeps one style for the whole document rather than one
per page, or the same badge would change size when the reader turned the page.

## A deletion that stays deleted

Removing the last mark left the sidecar describing a mark that was no longer on
screen. Autosave treated an empty annotation as "nothing worth writing" and returned
without touching the file, so the next open read the removed mark straight back — the
one behaviour that makes a reader distrust the whole feature.

An empty annotation is not nothing; it is the *absence* of an annotation, and the
write that expresses it is `DELETE`. Both bodies now do that, guarded by the same
signature check that skips a redundant write, so the delete happens once and not on
every render.

## Consequences

- An annotation from an older build has no `badgeScale`, which `badgeStyleOf` reads as
  the default. Nothing has to be migrated.
- A scale outside the range is clamped rather than discarded when a document is read:
  the number still says which way the reader was trying to go, and losing the marks
  over a size would be a poor trade.
- The badge layer and the pin head now draw the same number through two paths
  (`badgeSvg` and `markSvg`). They agree because both take the number from the same
  map in the same order, and the tests assert both.
- `badgeStyleOf` had to be injected into the PDF chunk rather than imported. The chunk
  must not hold a runtime reference into the entry bundle, or rolldown splits the
  shared module into a chunk the browser factory cannot load — the same constraint that
  put `createAutosave` behind an injected prop.

## Alternatives considered

- **Shrink the constant and stop there.** The smallest possible change, and it would
  have fixed the figure in the screenshot. Rejected because it would have broken a
  large screenshot instead: the reader annotates whatever they are working on, and the
  constant only ever fits the figure it was chosen against.
- **Scale the badge to the figure's size automatically.** No control to learn, and
  correct on average. Rejected because it is wrong exactly where it matters: a dense
  figure needs small numbers and a sparse one can carry large ones, and both can be any
  pixel size.
- **Put the size in the toolbar as a number field.** Precise and compact. Rejected
  because the choice is visual — the reader is looking at the figure while deciding —
  and a slider is the control whose shape says "adjust until it looks right".
- **Draw a badge beside the pin as well, and let the reader hide it.** Keeps one code
  path for every kind. Rejected because the pin *is* the marker: two markers for one
  coordinate is the original problem, not a feature to configure.
- **Make the pin grow with the badge scale.** Keeps the number legible at small sizes.
  Rejected after trying it: the pin is the mark's geometry and the badge is its label,
  and tying them made the whole pin jitter under the slider while the coordinate it
  pointed at stayed put.
- **Store the style once per document rather than per figure.** Simpler for a PDF.
  Rejected for the single-surface body, where one figure is one document and a global
  style would leak a choice from one figure onto the next.
- **Keep the "write nothing" behaviour for an empty annotation and rely on the clear
  button.** Rejected because a reader removes the last mark and closes the tab; the
  clear button is a separate decision they did not make, and the deleted mark returning
  is the failure they reported.
