#!/bin/sh
# Does every import in the tree still resolve to something that exports it?
#
# A file split moves names between modules; the thing that breaks is a call site
# still importing a name from the path it used to live at. A move is fine, a
# dangling import is not.
#
#   docs/refactor/api-check.sh          # exits non-zero on a dangling import
set -e
HERE=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
cd "$HERE"
exec node docs/refactor/api-check.mjs .
