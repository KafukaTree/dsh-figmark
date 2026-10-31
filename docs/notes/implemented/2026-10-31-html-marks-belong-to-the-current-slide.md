# Note: HTML marks belong to the slide they were made on

Status: implemented

## Problem

An HTML deck is one file containing several logical pages. Element marks could follow
their selector to the slide that owned the element, but a rectangle, ellipse or arrow
has no selector of its own. Once a deck installed its private loopback runtime and
started running its own page-switching script, those geometric marks stayed at the same
view-window coordinates while the content underneath changed. A region drawn on slide
five therefore appeared over slide six.

The picker also printed `↑↓ · Esc` without offering a pointer control for the ladder.
Keyboard depth changes worked only while the frame owned focus; a reader who had just
pressed the element button in the panel could see the hint but not operate it.

## Decision

Every geometric mark made on HTML records the logical surface in `surface`, using the
selector the picker reports for the visible slide. Element marks still carry their own
anchor and may also carry the surface selector.

The static fallback and the private loopback runtime report the current surface through
different paths but feed the same state. The panel distinguishes "no answer yet" from
"the page answered that it has no slide": before the first report it keeps the saved
geometry, while an explicit `surface: null` hides marks that name a slide. When a
reported surface has not completed layout, a zero-sized element box temporarily hides
its marks instead of moving them to the document origin.

Turning a page or reporting a new surface clears a selected mark and comment that
belong to the surface being left. Returning to that surface makes its marks visible
again without mutating the saved marks.

The element guide in the vertical tool palette now contains real `↑` and `↓` buttons.
Both buttons, the panel-level arrow keys, and the frame-level arrow keys send the same
depth message. Text fields and contenteditable regions keep the keys for editing.

## Alternatives considered

- **Assign a pseudo-selector to every region by inspecting the element underneath**
  - rejected. A region is a geometric annotation, not a claim about one element; making
  it inherit that element would change its meaning and make resizing the page move the
  mark in ways the reader did not draw.
- **Clear geometric marks whenever the page changes** - rejected. It fixes the visual
  overlap by losing the reader's work and prevents marks from returning when they go
  back to the original slide.
- **Hide every surfaced mark until layout exists** - rejected. A page's initial empty
  layout would make the whole annotation file appear empty even when the marks are
  valid; only the implied logical surface is held back, and an unknown surface keeps
  the recorded geometry.
- **Rely only on keyboard shortcuts for the element ladder** - rejected. The shortcut
  is discoverable only after the pointer names an element, and focus commonly remains
  on the panel button that armed element mode. Pointer controls need to be operable
  from that same place.

## Consequences

Region, ellipse, arrow and pen marks now follow the logical slides of both static decks
and script-driven decks running on their independent loopback origin. The annotation
schema carries an optional surface selector; older files without one remain readable
and keep their previous behaviour. The panel has one more state distinction
(`surface` unknown versus explicitly absent), and every HTML picker must report surface
changes for page-scoped drawing to stay accurate. A page whose own navigation convention
is not recognized still behaves as one scrolling surface.
