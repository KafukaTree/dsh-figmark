# The figure answers a right-click

## Problem

The figure had no context menu at all. A reader who wanted the *file* — open it
in Preview, find it in Finder, copy its path into a prompt — had to leave the
panel, walk the file tree in another tab, and come back. Everything the panel
did was about marks; nothing it did was about the figure it was marking.

## Decision

**The right-click offers the four gestures this plugin can actually perform.**

| row | what it needs | shown when |
|---|---|---|
| 用默认应用打开 | `remote.session.openWorkspacePath` | the Host has a desktop |
| 在文件管理器中显示 | the same, with `action: 'reveal'` | the Host has a desktop |
| 复制相对地址 | the Session's workspace directory | the figure is inside it |
| 复制绝对地址 | the figure's path | always |

No row is ever shown disabled. A row the Host cannot honour is absent, because a
disabled row is a promise in grey — the reader tries it, it does nothing, and now
they do not trust the rows that work.

**The workspace directory comes from the Host.** The browser knows the tab's
address, and that address may be absolute (no Session) or relative (resolved
against a directory only the Host knows). `resolveTarget` already looked that
directory up to resolve a relative address; it now reports it back, so the menu
can offer a path relative to the workspace — the form worth copying, because it
survives the project being moved.

**The menu cannot escape the window.** `clampMenu` moves both axes
independently, so a click near the right edge slides the menu left without also
moving it up. Where the window is narrower than the menu, the menu pins to the
left edge rather than being pushed off the left one.

## Alternatives considered

- **Mount the shell's own menu.** Not available: the menu the reader pointed at
  comes from `dsh-better-sidebar`, which is a separate plugin of its own, and
  nothing in the composer or slot API exposes another plugin's popover. Copying
  its markup would also copy its rows — most of which are its own sidebar's
  capabilities (open in its editor tab, its upload/download channel, its rename
  and delete flows) that this plugin has no UI for.
- **Show every row and disable the ones that cannot run.** Rejected: a disabled
  row is indistinguishable from a broken one to a reader who has not hit that
  state before. Absence says "this is not something this file can do"; grey says
  "this should work and does not".
- **Offer 重命名 and 删除 too.** Rejected for 删除 outright: it is the one
  irreversible row, and half a centimetre from a right-click on the figure is the
  worst place to put it. 重命名 would need a rename route on the Host plus an
  answer to "what happens to the sidecar named after the old path" — that is a
  feature with its own decisions, not a menu row.
- **Read the workspace from the browser.** The address may be absolute
  (`dsh-resource://file/absolute/…`), which carries no Session id at all, and the
  Session's directory is not in any client-side service this plugin can reach
  without asking the Host. Reporting it from `resolveTarget` costs one field on a
  response the browser already fetches.
- **Compute the relative path with `node:path.relative` on the Host.** Would be
  exact, but it puts the browser's display in the Host's hands: the menu needs the
  string to decide whether to draw the row at all, and a round trip per open is
  slower than the arithmetic. `relativeTo` does the one comparison that matters
  (is this path inside that directory) and refuses anything that would climb.
- **Dismiss on `pointerdown` with `target.closest`.** Rejected in favour of
  `composedPath().includes(panel)`: `closest` walks up from the target and stops
  at a shadow root, so a row rendered inside one would read as an outside press
  and the menu would close on the very click meant to pick a row.

## Consequences

- Two new modules carry the decisions: `figure-menu.ts` (placement, path
  arithmetic, the row set) and `host-actions.ts` (the three Host calls). Both are
  pure enough to test without a browser, which is why the coverage gate passes on
  them without a single DOM test.
- `GET /dsh-figmark/annotation` now answers one more field, `workspace`. It is
  nullable, and a client from an older build ignores it — the figure still loads,
  the menu just has no relative row.
- The row handler takes the path from the menu's own state rather than from the
  current `loaded`. If the figure reloads while the menu is open, the menu still
  acts on the figure it was opened for, not the one that replaced it.
- Every gesture reports into the existing status line (`menuOpened`,
  `menuCopyFailed`, …), so a row that fails says so instead of closing silently.
