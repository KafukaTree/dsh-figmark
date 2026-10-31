# Note: Depth keys belong to the hover, not the iframe focus

Status: implemented

## Problem

The HTML element guide promised `↑↓ · Esc`, but the depth keys were installed only
on the rendered document's window. Choosing the element tool leaves keyboard focus on
the palette button outside that iframe. Moving the pointer over an element showed its
depth, yet pressing an arrow key still went to the parent window and changed nothing.
Escape worked because the panel already handled it at its own window.

## Decision

One key handler is installed in both places that can own a key after the picker has
named an element: the framed document and the parent window. They are separate event
owners, so a same-origin iframe cannot deliver one keystroke to both. A current hover
is required before either listener consumes an arrow, and input, textarea, select and
contenteditable targets keep their native arrow-key behaviour.

## Alternatives considered

- **Focus the iframe as soon as the pointer enters it** - this would repair the
  example but take focus from the palette and silently alter the page's keyboard
  state during a hover.
- **Require a click inside the page before using the shortcut** - the comment box
  already teaches focus-sensitive editing, but element picking itself is explicitly a
  pre-click preview. Requiring a discarded press makes the visible hover state lie.
- **Move the only listener to the parent window** - once the reader does focus the
  document, its key events stay inside the iframe and would never reach the parent.
- **Handle the keys at the shell level** - the shell does not know whether there is a
  live element pick or which document owns it, so it would have to duplicate plugin
  state.

## Consequences

- `↑↓` works immediately after arming the element tool, before the reader has clicked
  the page, and continues to work after the page owns focus.
- The shortcut remains inert while the pointer names nothing and while the reader is
  typing in a field.
- The panel now has one more window listener for the lifetime of element mode.
