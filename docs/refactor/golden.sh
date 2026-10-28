#!/bin/sh
# Capture, or check, what the panel renders.
#
# The refactor's contract is "same behaviour". This is how that becomes a fact
# instead of a claim: render the panel in a series of states and write each
# DOM to JSON. Compare a capture taken before with one taken after.
#
#   docs/refactor/golden.sh before     # -> /tmp/golden/before.json
#   docs/refactor/golden.sh after      # -> /tmp/golden/after.json
#   docs/refactor/golden.sh diff       # exits non-zero on any difference
set -e
HERE=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
mkdir -p /tmp/golden
case "$1" in
  diff)
    cmp -s /tmp/golden/before.json /tmp/golden/after.json && { echo identical; exit 0; }
    echo "the panel renders differently than it did before the refactor:" >&2
    node -e '
      const a = require("/tmp/golden/before.json"), b = require("/tmp/golden/after.json");
      for (const key of Object.keys(a)) if (a[key] !== b[key]) console.error("  changed: " + key);
      for (const key of Object.keys(b)) if (!(key in a)) console.error("  added: " + key);
    ' >&2
    exit 1
    ;;
  before|after|"")
    cd "$HERE"
    GOLDEN_OUT="/tmp/golden/${1:-before}.json" npx vitest run tests/refactor/golden.spec.tsx >/dev/null 2>&1
    echo "wrote /tmp/golden/${1:-before}.json"
    ;;
  *)
    echo "usage: $0 [before|after|diff]" >&2
    exit 2
    ;;
esac
