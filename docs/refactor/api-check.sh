#!/bin/sh
# Did the refactor keep every public name?
#
# The golden dump proves the panel renders the same; it cannot see a renamed
# export that nothing renders yet. This compares the export surface of every
# module against the baseline captured before the refactor started.
#
#   docs/refactor/api-check.sh          # exits non-zero on a lost or moved name
set -e
HERE=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
cd "$HERE"
node docs/refactor/api-surface.mjs . > /tmp/api-now.json 2>/dev/null
node -e '
  const before = require("/tmp/api-baseline.json");
  const now = require("/tmp/api-now.json");
  let bad = 0;
  for (const [file, names] of Object.entries(before)) {
    const have = new Set(now[file] ?? []);
    for (const name of names) {
      if (!have.has(name)) { console.error(`lost from ${file}: ${name}`); bad += 1; }
    }
  }
  if (bad === 0) console.log("every name the baseline exported is still exported");
  process.exit(bad === 0 ? 0 : 1);
'
