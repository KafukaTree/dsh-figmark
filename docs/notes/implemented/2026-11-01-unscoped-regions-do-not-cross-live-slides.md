# Note: Unstamped regions do not cross live slides

Status: implemented

## Problem

Live drafts created before marks recorded their owning surface contain geometric
marks without a `surface`. A running deck can report that a logical slide is in
front, but the old region has no selector that can identify it on a later slide.
The overlay therefore drew the same rectangle at the same coordinates on every
slide. Turning from slide two back to slide one left a blue box on content where
the reader never drew it.

The draft cannot be discarded: it is unpublished reader work. Element marks are
different because their selector can be measured against the page and hidden
when its element is not visible.

## Decision

When a live page reports a logical surface, an unscoped geometric mark is not
drawn while that surface is in front. It remains in the list and in the draft, and
it is drawn when the page reports no logical surface. Unscoped element marks keep
using the page's visibility report, so a saved element can still be located on the
slide that owns it. Screenshot composition follows the same rule and leaves an
unattributable legacy region out of a slide snapshot.

New geometric marks on a live page continue to record the reported surface when
one exists. This change does not alter the annotation file format or remove a
reader's draft.

## Alternatives considered

- **Assign a surface-less mark to whichever slide is open first** - a reader can
  reopen a deck on any slide, so this invents ownership and can move the mark to
  the wrong page.
- **Delete surface-less regions from old drafts** - removes the display bug by
  destroying reader work.
- **Show the region only on the first slide** - the first slide in document order
  is not evidence that the mark was drawn there.
- **Use the mark's coordinates to guess its slide** - different slides commonly
  share the same layout coordinates; overlaps are not ownership.

## Consequences

Legacy geometric marks no longer leak onto unrelated live slides or into their
sent screenshots. Until the reader replaces them, those old regions are only
visible while the page reports no logical surface. New regions record their owner
and keep the existing per-slide behavior.
