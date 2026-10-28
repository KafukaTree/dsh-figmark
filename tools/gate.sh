#!/bin/sh
# Run the gates one team at a time.
#
# Several agents share this working tree, and `vitest --coverage` writes
# `coverage/.tmp/*.json` as it goes. Two runs at once overwrite each other's
# temp files, and the loser dies with `ENOENT: coverage/.tmp/coverage-N.json` —
# a failure that looks like a broken test and is really two people running the
# same command. So every gate takes an exclusive lock first.
#
#   tools/gate.sh check     # typecheck, lint, coverage
#   tools/gate.sh coverage  # coverage alone
#   tools/gate.sh test      # tests without coverage
#   tools/gate.sh api       # every import resolves to an export
#   tools/gate.sh all       # the lot
#
# A run that waits prints who holds the lock, so a slow gate cannot be mistaken
# for a hung one.
set -e
HERE=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$HERE"
LOCK=/tmp/dsh-figmark-gate.lock
mkdir -p /tmp/dsh-figmark-gate

take_lock() {
  # mkdir is atomic on every filesystem this runs on, and unlike flock it needs
  # no utility that may not be installed.
  waited=0
  while ! mkdir "$LOCK" 2>/dev/null; do
    if [ "$waited" = 0 ]; then
      echo "$(cat "$LOCK/owner" 2>/dev/null || echo someone) is running a gate; waiting" >&2
    fi
    waited=$((waited + 1))
    if [ "$waited" -gt 600 ]; then
      echo "gave up waiting for $LOCK after 10 minutes" >&2
      exit 3
    fi
    sleep 1
  done
  echo "${DSH_GATE_OWNER:-$$}" > "$LOCK/owner"
  trap 'rm -rf "$LOCK"' EXIT INT TERM
}

quality() {
  echo "== typecheck" >&2
  npx tsc --noEmit -p tsconfig.json
  echo "== lint" >&2
  npm run lint
}

coverage() {
  echo "== coverage" >&2
  npx vitest run --coverage
}

api() {
  echo "== imports" >&2
  node --experimental-strip-types tools/api-check.ts .
}

take_lock
case "${1:-check}" in
  check) quality; api; coverage ;;
  coverage) coverage ;;
  test) npx vitest run ;;
  api) api ;;
  all) quality; api; coverage; docs/refactor/golden.sh after; docs/refactor/golden.sh diff ;;
  *) echo "usage: $0 [check|coverage|test|api|all]" >&2; exit 2 ;;
esac
