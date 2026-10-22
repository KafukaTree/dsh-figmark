#!/usr/bin/env bash
# 一键发布 dsh-figmark：跑门禁 → 构建 → 发 npm → 把市场索引切到 npm 源 → 推 GitHub
set -euo pipefail
cd "$(dirname "$0")"

say() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31m!! %s\033[0m\n' "$*" >&2; exit 1; }

VERSION=$(node -p "require('./package.json').version")
say "准备发布 dsh-figmark@$VERSION"

# ---------- 1. 前置检查 ----------
npm whoami >/dev/null 2>&1 || die "还没登录 npm。先跑 \`npm login\`，或用 token：
  npm config set //registry.npmjs.org/:_authToken=<你的 Automation Token>"

if npm view "dsh-figmark@$VERSION" version >/dev/null 2>&1; then
  die "npm 上已经有 dsh-figmark@$VERSION 了。先改 package.json 的 version（并同步 market/index.json）。"
fi

# ---------- 2. 门禁 ----------
say "三道门禁（typecheck + lint + coverage）"
pnpm run check

# ---------- 3. 构建 ----------
say "构建 lib/"
pnpm run build

# ---------- 4. 发布 ----------
say "打包预演"
npm pack --dry-run

say "发布到 npm"
# 本机 http_proxy 会吞掉几 MB 的 tarball 上传，表现为一串莫名的 503；
# 发布这一步必须绕开它。
env -u http_proxy -u https_proxy -u all_proxy -u NODE_USE_ENV_PROXY \
  NO_PROXY='*' no_proxy='*' npm publish --access public

# ---------- 5. 索引切到 npm 源 ----------
say "把市场索引切到 npm 源"
node - <<'JS'
const fs = require('node:fs')
const path = 'market/index.json'
const index = JSON.parse(fs.readFileSync(path, 'utf8'))
const version = index.plugins[0].versions[0]
version.source = { type: 'npm', registry: 'https://registry.npmjs.org' }
version.publishTimestamp = Math.floor(Date.now() / 1000)
fs.writeFileSync(path, JSON.stringify(index, null, 2) + '\n')
console.log('source ->', JSON.stringify(version.source))
console.log('publishTimestamp ->', version.publishTimestamp)
JS

# ---------- 6. 校验索引 ----------
say "用 DSH 自己的校验器校验索引"
node --input-type=module -e "
import { parseMarketIndex, marketInstallTarget } from '@deepseek-ai/dsh-plugin-market-index'
import { readFileSync } from 'node:fs'
const url = 'https://raw.githubusercontent.com/KafukaTree/dsh-figmark/main/market/index.json'
const index = parseMarketIndex(JSON.parse(readFileSync('market/index.json', 'utf8')), url)
const plugin = index.plugins[0]
console.log('VALID |', plugin.name, plugin.versions[0].version)
console.log('install target:', JSON.stringify(marketInstallTarget(plugin.name, plugin.versions[0])))
"

# ---------- 7. 提交推送 ----------
say "提交并推送"
git add -A
git -c user.name="KafukaTree" -c user.email="KafukaTree@users.noreply.github.com" \
  commit -m "release: dsh-figmark@$VERSION"
git push origin main
git tag "v$VERSION" 2>/dev/null || true
git push origin "v$VERSION" 2>/dev/null || true

say "完成：dsh-figmark@$VERSION 已发布"
echo "索引地址：https://raw.githubusercontent.com/KafukaTree/dsh-figmark/main/market/index.json"
echo "别忘 Cmd+Q 完全退出重开 DSH。"
