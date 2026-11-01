# Note: Service tabs own live-page navigation

Status: implemented

## Problem

A page opened directly from the local-pages picker showed two navigation systems:
the service tab strip could return to the list, switch workspaces, and close tabs,
while an address drawer over the page repeated return-to-list and also offered a
URL field. The drawer covered the document and made the same page look like a
second browser nested inside the service browser.

Removing the drawer outright would have removed the only refresh action. It would
also have broken the separate flow where an annotatable file temporarily opens a
loopback page and later returns to that file, because that flow has no service tab
strip.

## Decision

A directly opened service page keeps its address drawer hidden. List, switching,
closing, and refresh belong to the service tab strip. The strip exposes refresh as
one compact icon next to the list button and increments a refresh token passed to
the active annotator body.

The annotator body still owns the file-to-live-page drawer. When a body opens a
loopback page from a file that it was annotating, the drawer remains available
with its address field and "back to this file" action.

The unused direct-service back callback is removed. A direct body no longer
pretends it can own a list action that exists in its parent.

## Alternatives considered

- **Keep the address drawer and treat the tab strip as optional** - preserves two
  competing navigation models and leaves the redundant overlay covering the page.
- **Remove every live-page address drawer** - breaks the file-to-live-page flow,
  which has no service tabs and still needs a way back to its file.
- **Make the active tab itself refresh the page** - removes a visible refresh
  affordance and overloads the meaning of selecting a tab.
- **Drop refresh with the redundant drawer** - removes a useful page action merely
  because it happened to share a container with duplicated navigation.
- **Keep address navigation inside each tab** - lets one workspace silently become
  a different page while the tab title and ownership model describe another.

## Consequences

Direct service pages have one navigation surface and no overlay in the document's
top-left corner. Refresh remains available without reopening the proxy and preserves
the workspace draft. File-to-live-page navigation remains unchanged, while the
parent service browser no longer needs to learn URL changes made inside a direct
page body.
