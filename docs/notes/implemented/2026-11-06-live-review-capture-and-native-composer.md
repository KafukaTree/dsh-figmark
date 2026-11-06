# Note: Preserve live-page layout and use the native composer Send

Status: implemented

## Problem

A scaled slide was captured using its on-screen bounding box as its CSS layout size.
The renderer consequently clipped full-size absolutely positioned children, so the
sent image showed an empty red box where the user had reviewed a heading.

The pending card uploaded images without admitting their ids to the native draft.
DSH therefore considered the empty editor unsendable, and an extra blue send button
became necessary. The local-page tab also omitted the host's keepMounted option,
so switching sidebar tabs destroyed the live page. Discovery listed index aliases
twice, and submitting a broad search silently selected the first match.

## Decision

Capture a slide at its unscaled layout dimensions, neutralizing its own transform
and zoom in the clone, then place the bitmap at its measured visual rectangle.
The original page remains untouched; page selectors and screenshot coordinates
still share the existing protocol.

Admit review images into the native draft immediately. A text-only review instead
stages a readable annotation.txt containing its notes, so the host has real content
and its normal Send works with an empty editor. The pending card previews/removes
its review; it has no separate send control when native admission succeeds. Only
hosts that cannot admit drafts retain the existing direct-send fallback. Submit
adds only missing attachment ids and retains staged files when admission refuses.
Native draft thumbnails represented by a review card are hidden by their exact
preview URLs; unrelated draft images and all delivered attachments remain visible.
This supersedes the extra staged send action in
[the previous card note](2026-11-05-review-cards-separate-review-source-and-send.md).

Register the local-page sidebar tab with DSH's existing keepMounted capability,
keeping its iframe, proxy, marks, and page state during sidebar/session switches.
Actual tab disposal continues to release the proxy. Discovery merges root/index
aliases only when endpoint, query, fragment and title agree. Distinct paths stay
separate. Empty queries do nothing, ambiguous queries ask the user to select a row,
and unmatched text gets a search-specific message. The picker uses a compact title,
short description, and address/search field instead of a large introductory banner.

## Alternatives considered

- **Re-render at the displayed slide size** — changes layout rather than capturing it.
- **Capture the entire deck** — unnecessarily clones hidden slides and their assets.
- **Keep the blue send button** — creates a second sending model beside native attachments.
- **Insert invisible draft characters or enable the DOM button manually** — neither
  supplies real content to the host's submit checks, and both break native semantics.
- **Hide the whole attachment rail whenever a card exists** — hides unrelated files.
- **Restore only the last URL on sidebar remount** — reloads the page and loses its
  slide/scroll state; DSH already supports retaining the live body.
- **Merge all pages sharing a port or title** — would hide distinct local documents.

## Consequences

A review with no image carries a small text attachment in addition to its message.
Keeping the tab mounted retains its running page until the tab/session is disposed.
Discovery remains bounded to known candidates and does not start services or scan
all ports. A page that applies rotation/perspective beyond ordinary deck scaling is
not newly guaranteed pixel-exact by the DOM screenshot renderer.

Validation includes real Chromium capture of the user's running 8801 slide deck,
checking the actual delivered PNG, empty and typed native sends, exact thumbnail
hiding with unrelated attachments retained, PDF save/page/send regression checks,
and the project's unchanged type, lint, coverage and build gates.
