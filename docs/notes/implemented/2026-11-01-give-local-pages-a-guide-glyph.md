# Note: Give local pages a guide glyph

Status: implemented

## Problem

The right Sidebar's tool guide places "Local pages" beside the shell's own
"Workspace files", "New terminal" and "Browser" entries. Every neighbouring row
has an icon, but this entry supplied no `icon`, so the host fell back to a
generic cube. The row therefore looked unfinished and did not tell a reader what
kind of tool it opened before they read the title.

## Decision

The guide entry carries a dedicated `ServiceGuideIcon`: a rounded browser frame
for "web page" and a filled origin with an arrow returning to it for "loopback".
It uses the native guide's 36-unit grid and receives 26px from `EntryBox`, the
same contract as the neighbouring Files, Browser and Terminal artwork. The frame
uses the family's periwinkle blue (`#658EFF`); the origin and return path use the
Browser artwork's `#539CFA`. These fixed blues remain legible on both host
palettes without repeating the Browser globe's shape.

## Alternatives considered

- **Reuse a globe** - rejected. It duplicates "Browser" and loses the distinction
  between an arbitrary web page and a service already running on this machine.
- **Use a monitor or laptop** - rejected. It names the device rather than the page
  and would sit too close to the generic hardware meaning of the old cube.
- **Use a terminal prompt** - rejected. "New terminal" already owns `>_`; a
  second prompt would make the two destinations look interchangeable.
- **Inherit `currentColor`** - rejected. The native guide's icon slot supplies
  muted secondary text, while every adjacent bespoke artwork carries its own
  colour; inheriting would leave this one looking like the old placeholder.
- **Use a gradient or a broad multi-colour palette** - rejected. The neighbour
  set is mostly one blue per outline; one restrained blue pair is enough to join
  the family while keeping the loopback shape legible at 26px.

## Consequences

The local-pages row now has an identifiable glyph at the host's actual rendering
size, with the same view-box scale and colour confidence as its neighbours. The
shape is a local addition to the client bundle with no runtime dependency and no
change to tab registration, navigation or annotation behaviour.
