# Escape leaves, Backspace deletes

Status: implemented 2026-10-20.

## Problem

Annotating is a mode, and the panel had no way out of it but the mouse: the reader
had to find the 标注 toggle again. Worse, once a mark was picked out there was no
keyboard way to get rid of it — the only delete control was the small ✕ in the
marks list. Both are the sort of thing a hand already on the keyboard expects, and
the reader said so.

## Decision

The panel listens for keydown on `window` while a figure is open:

- **Escape** drops the current selection if there is one, and otherwise leaves
  annotating mode (back to 浏览). Two presses, so that a reader who only wanted to
  stop editing a note does not also fall out of the mode.
- **Delete** and **Backspace** remove the selected mark, through the same
  `removeMark` the ✕ button uses — one undo step, same history.
- **Cmd/Ctrl+Z** and **Shift+Cmd/Ctrl+Z** keep working as undo and redo.

All of it is suppressed while the caret is in a field (`INPUT`, `TEXTAREA`,
`SELECT`, or anything `isContentEditable`): Backspace there must delete a
character, Escape must leave the box, and undo must undo typing. The note box and
the overall-summary box are exactly such fields, so this is checked on the event
target rather than per-widget.

Nothing is bound to a bare letter, and nothing is taken from the browser when no
mark is selected: Delete with no selection falls through to the shell.

## Alternatives considered

- **One Escape that leaves the mode and clears the selection in the same press.**
  Rejected: the note box is bound to the selected mark, so a reader who presses
  Escape to stop editing its text would lose their place in the mode as well.
- **Listen on `window` instead of the stage.** Chosen, with the field check above
  as the price: the stage is a scrollport, not a focusable widget, so a listener on
  it would only fire after the reader clicked something inside it — and the whole
  point is that the hand is already on the keyboard when the figure opens. The
  panel is only mounted while its document tab is open, so the listener is gone the
  rest of the time; the `typing` check keeps it from eating keystrokes aimed at a
  text field.
- **Bind Escape unconditionally, including in the note box.** Rejected: the field
  check is what makes the note box feel like a text field rather than a widget that
  swallows the keyboard.

## See also

[2026-10-20-pinch-zoom-around-the-pointer.md](2026-10-20-pinch-zoom-around-the-pointer.md)
for the wheel path these keys sit next to.
