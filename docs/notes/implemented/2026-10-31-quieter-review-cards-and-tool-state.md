# Note: Quieter review cards and tool state

Status: implemented

## Problem

Element mode explained itself in a separate banner over the document's content. The
copy repeated the mode, a sentence of instructions and a keyboard legend in Chinese.
The composer's annotation card likewise stacked a generic title, filename, count,
shape and several labels. At the transcript's normal width this spent more room on
chrome than on the reader's mark, and the list count could lose its top row inside a
scrolling toolbar.

## Decision

Element mode now shows a compact three-line state inside the tool palette: mode,
hierarchy depth when the pointer is over an element, and the two arrow-key symbols.
The full description remains its accessible label.

The composer card leads with the actual filename in a monospaced line, keeps the count
as a small numeric pill, and uses one short shape label plus the first comment. Empty
comments add no placeholder sentence. The list count is an inline pill inside the
list button, so neither scrolling nor clipping can cut it off.

## Alternatives considered

- **Keep the banner and shorten its text** - it still covered the document and changed
  position independently of the tool that had armed the mode.
- **Put the explanation in a tooltip only** - touch readers and keyboard readers need
  the active state before they click, not after hovering.
- **Keep the full hierarchy count in the palette at all times** - depth is useful only
  after a concrete element is under the pointer; the empty state needs less noise.
- **Keep the generic card title and hide the filename below it** - the filename is the
  only part that identifies which document this annotation belongs to.
- **Pad the scrollport around an absolutely positioned badge** - it consumes bar space
  and still depends on clip geometry to keep the count.

## Consequences

- Element mode remains discoverable without covering page content.
- Narrow preview panes spend their width on the active tool state, not a legend.
- Composer cards stay readable at 240-280px while keeping the useful file, shape and
  first-comment facts.
- Counts from 1 through three digits stay attached to the list action rather than
  overlaying its icon.
