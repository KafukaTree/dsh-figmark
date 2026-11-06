# Note: Repository hygiene keeps temporary evidence out of the public tree

Status: implemented

## Problem

The tracked tree contained old QA screenshots and reference images that no
document linked, two superseded sample figures from the initial release, and one
unused API-surface tool. Local editor state, library backups, alternate coverage
directories, and suffixed `.bak` files were also easy to stage accidentally.
None of those files affected the published package, but they made the public
repository look like a scratch workspace.

## Decision

Remove only artifacts whose paths have no inbound references in tracked files.
Keep release documentation, decision records, the golden-test harness, demos,
and the checked-in browser fixtures used by `tools/visual-check.sh`, because
those preserve implementation rationale or executable verification.

Ignore `.claude/`, `.lib-backup-*`, suffixed `*.bak-*`, and root
`coverage-*` directories. The existing `coverage/` and generated demo bundle
rules remain unchanged.

## Alternatives considered

- **Drop every `docs/` and `tools/` directory** — removes required decision
  records and active test infrastructure along with one-off evidence.
- **Rewrite Git history to shrink local `.git`** — destructive to shared
  history and unnecessary for the current tree size.
- **Delete local backups automatically** — repository hygiene should not remove
  a maintainer's recoverable working copies.

## Consequences

The current tree loses only unreferenced evidence and one unused tool. Future
local scratch output stays visible to Git only when it is genuinely new. Old
blobs remain available through Git history, and published npm contents are
unchanged.
