#!/bin/sh
# Boot an isolated DSH web instance that has this working tree linked as the
# dsh-figmark plugin, and publish the sample figures where its file browser can
# reach them.
#
#   tools/visual-check.sh                     # foreground; prints the token URL
#   DSH_CHECK_PORT=8898 tools/visual-check.sh
#
# One pass, then stop taking pictures. The browser steps are fixed:
#   1. open the printed URL; if it says "authentication required", open it once more
#   2. Escape dismisses the sign-in dialog
#   3. in the 文件 tab open the four files in $DSH_CHECK_WORKSPACE/figmark-samples
#   4. read the boxes instead of photographing them:
#        document.querySelector('.da-toast')?.getBoundingClientRect()
#        document.querySelector('.da-palette')?.getBoundingClientRect()
#      One screenshot at the end, if the user needs to see it.
#
# Client changes need a page reload. Host changes need this script restarted,
# because Node caches imported modules.
#
# Gotchas, paid for once:
#   - localStorage 'dsh-figmark:drawing' persists dragged strip spots; remove it
#     before checking defaults, or the bar/palette start wherever the last test left them.
#   - Synthetic PointerEvents cannot call setPointerCapture for an inactive pointer;
#     patch Element.prototype.setPointerCapture before dispatching a drag by hand.
#   - The temp profile has no account, so the sign-in dialog returns on reload.
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
CHECK_HOME=${DSH_CHECK_HOME:-/tmp/dsh-figmark-check}
PORT=${DSH_CHECK_PORT:-8899}
WORKSPACE=${DSH_CHECK_WORKSPACE:-"$HOME/Documents/deepseek-harness/default-workspace"}
PROFILE="$CHECK_HOME/profiles/web"

if [ ! -f "$PROFILE/package.json" ]; then
  mkdir -p "$CHECK_HOME/profiles"
  cp -R "$HOME/.dsh/profiles/web" "$PROFILE"
  node -e '
    const fs = require("node:fs")
    const [file, root] = process.argv.slice(1)
    const profile = JSON.parse(fs.readFileSync(file, "utf8"))
    profile.dependencies = { ...profile.dependencies, "dsh-figmark": `link:${root}` }
    const bundles = profile.dsh.profile.bundles
    if (!bundles.includes("dsh-figmark")) bundles.push("dsh-figmark")
    fs.writeFileSync(file, JSON.stringify(profile, null, 2) + "\n")
  ' "$PROFILE/package.json" "$ROOT"
  DSH_HOME="$CHECK_HOME" dsh plugin --profile web install >/dev/null
fi

pnpm run build >/dev/null

SAMPLES="$ROOT/docs/samples/figmark-check"
mkdir -p "$WORKSPACE/figmark-samples" 2>/dev/null || true
if ! cp "$SAMPLES"/figmark-thermal.png "$SAMPLES"/figmark-thermal.svg \
        "$SAMPLES"/figmark-schematic.svg "$SAMPLES"/figmark-thermal.pdf \
        "$SAMPLES"/figmark-paper.html "$WORKSPACE/figmark-samples/" 2>/dev/null; then
  echo "note: could not refresh $WORKSPACE/figmark-samples (sandbox); using what is there"
fi

echo "fixtures: $WORKSPACE/figmark-samples"
exec env DSH_HOME="$CHECK_HOME" dsh --profile web --port "$PORT" --no-open
