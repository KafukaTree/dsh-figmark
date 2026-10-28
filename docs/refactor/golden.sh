#!/bin/sh
# Capture, or check, what the plugin renders.
#
# The refactor's contract is "same behaviour". This is how that becomes a fact
# instead of a claim: render the surfaces in a series of states and write each
# DOM to JSON. Compare a capture taken before with one taken after.
#
# There are two surfaces, because one harness cannot reach both:
#
#   golden.spec.tsx     the figure panel — the overlay, the marks, the geometry
#   documents.spec.tsx  the PDF and Markdown bodies — pager, gutter, difference
#
#   docs/refactor/golden.sh before     # -> /tmp/golden/{before,documents-before}.json
#   docs/refactor/golden.sh after      # -> /tmp/golden/{after,documents-after}.json
#   docs/refactor/golden.sh diff       # exits non-zero on any difference
set -e
HERE=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
mkdir -p /tmp/golden
case "$1" in
  diff)
    status=0
    # One line per surface: "<before>|<after>|<what to call it>".
    for pair in \
      "before.json|after.json|the panel" \
      "documents-before.json|documents-after.json|the document bodies"
    do
      left=${pair%%|*}
      rest=${pair#*|}
      right=${rest%%|*}
      label=${rest#*|}
      if [ ! -f "/tmp/golden/$left" ] || [ ! -f "/tmp/golden/$right" ]; then
        echo "$label: nothing to compare yet (capture both sides first)" >&2
        status=1
        continue
      fi
      if cmp -s "/tmp/golden/$left" "/tmp/golden/$right"; then
        echo "$label: identical"
        continue
      fi
      echo "$label: differs from the capture taken before the refactor:" >&2
      node -e '
        const [a, b] = [require("/tmp/golden/" + process.argv[1]), require("/tmp/golden/" + process.argv[2])];
        for (const key of Object.keys(a)) if (a[key] !== b[key]) console.error("  changed: " + key);
        for (const key of Object.keys(b)) if (!(key in a)) console.error("  added: " + key);
        for (const key of Object.keys(a)) if (!(key in b)) console.error("  removed: " + key);
      ' "$left" "$right" >&2
      status=1
    done
    exit $status
    ;;
  before|after|"")
    stage=${1:-before}
    cd "$HERE"
    GOLDEN_OUT="/tmp/golden/${stage}.json" npx vitest run tests/refactor/golden.spec.tsx >/dev/null 2>&1
    echo "wrote /tmp/golden/${stage}.json"
    DOCUMENTS_OUT="/tmp/golden/documents-${stage}.json" npx vitest run tests/refactor/documents.spec.tsx >/dev/null 2>&1
    echo "wrote /tmp/golden/documents-${stage}.json"
    ;;
  *)
    echo "usage: $0 [before|after|diff]" >&2
    exit 2
    ;;
esac
