# Note: A temporary reveal shows one mark

Status: implemented

## Problem

A deck can reveal a cover or other hidden layer without changing which slide its
`.is-live` marker names. While the cover is lifted, the slide underneath remains
visible to the DOM, so the picker continues to report the slide title's bounds as
visible. Clicking a later slide mark and then an earlier cover mark therefore left
the slide mark's blue box drawn over the cover.

The recorded surface alone cannot reject that box: the slide mark really does
belong to the surface the page still reports as live. The temporary cover is a
third state that the normal surface and bounds messages do not describe.

## Decision

A successful reveal marked `temporary` puts the overlay into a one-mark visibility
scope. Only the mark whose row requested and confirmed the reveal is drawn until
the selection is closed or the page changes. The mark keeps its live box when one
is available and falls back to its recorded box while a late bounds report still
calls the temporarily lifted layer hidden.

The scope is cleared when a reveal returns without a temporary layer, expires,
fails, is replaced by another reveal, loses its selection on a surface change, or
is reset by refresh. Marks on the active slide continue to render normally outside
that scope.

## Alternatives considered

- **Hide every mark whose recorded surface differs from `.is-live`** - the offending
  slide mark has the same surface as the page still reports, so this does not fix
  the case.
- **Wait for another bounds report to mark the slide hidden** - the slide is
  genuinely visible underneath the lifted cover, so no truthful measurement will
  hide it.
- **Remove the slide's animation or hiding state** - this mutates the page's own
  presentation state and cannot be restored from the cross-origin panel.
- **Scope every reveal, temporary or not** - a normal reveal should return the
  reader to the active surface's full annotation layer; making the list act as a
  permanent isolation mode would hide marks the reader did not ask to dismiss.
- **Keep the stale box until the cover is closed** - the cover is exactly the
  state the reader asked to inspect, and another layer's box obscures it.

## Consequences

Temporary cover and modal navigation now draws one unambiguous destination even
when lower surfaces remain measurable. The overlay has one additional transient
state, but the architecture and the picker protocol are unchanged: the page still
owns restoration, while the panel owns which annotation it is showing.
