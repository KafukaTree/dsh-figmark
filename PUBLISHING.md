# 发布清单

## 一次发布做这几步

```sh
cd ~/.dsh/plugins/dsh-figmark

pnpm run check          # typecheck + lint + coverage 三道门禁
pnpm run build          # 重建 lib/（prepack 也会跑）

# 1) 改版本号（索引和包里只有这一个 version 要同步）
#    package.json        "version": "1.0.0"
#    market/index.json   plugins[0].versions[0].version
#    market/index.json   plugins[0].versions[0].publishTimestamp（Unix 秒）
node -e "console.log(Math.floor(Date.now()/1000))"

# 2) 先干跑一次，确认包内容
npm pack --dry-run

# 3) 发布到 npm（两个坑见文末）
npm login               # 只需一次
env -u http_proxy -u https_proxy -u all_proxy -u NODE_USE_ENV_PROXY \
  NO_PROXY='*' no_proxy='*' npm publish --access public

#    npm 还没发布时：索引里 versions[0].source 用 git 类型（见下），
#    钉到当前 commit 即可让别人装上源码版本。npm 发布之后把 source 换回
#    {"type":"npm","registry":"https://registry.npmjs.org"}，并重跑上面的校验。

# 4) 提交并推 tag
git add -A && git commit -m "release: dsh-figmark@1.0.0"
git tag v1.0.0 && git push origin main --tags
```

推完之后，索引地址 `https://raw.githubusercontent.com/KafukaTree/dsh-figmark/main/market/index.json`
会立刻反映新版本；DSH 的发现页缓存 `cacheTtlMs` 默认 10 分钟，写 `refresh` 可绕过。

## git 源 vs npm 源

| source | 用户装到的东西 | 代价 |
|---|---|---|
| `npm` | 构建好的 `lib/`（3.3 MB，含 7.9 MB 未压缩 PDF 分块） | 要先把包发布到 npm |
| `git` | **源码**，pnpm 跑 `prepare` 现场构建 | pnpm 11 会拦下构建脚本，用户要在插件页点**允许这些脚本并重试**；而且要能连 GitHub |

git 源切换只需改 `market/index.json` 里那一个 `source` 对象并推送——`commit` 必须是**小写 40 位**
且是真实存在的提交（校验器就是这么检查的）。

## 每次发布前确认

- [ ] `package.json` 的 `version` 与 `market/index.json` 的 `versions[0].version` **一致**
- [ ] `publishTimestamp` 是**这一次**的 Unix 秒（不是上一次的残留）
- [ ] `engines.dsh` 没跟着 DSH 升级漂移（它决定装不装得上）
- [ ] `npm pack --dry-run` 里没有 `src/`、`tests/`、`docs/`
- [ ] 图标改过的话，内联进 `market/index.json` 的 base64 也要重新生成
- [ ] 新功能/新改动在 `docs/notes/implemented/` 有决策记录（AGENTS.md 要求）

## 索引图标是怎么来的

`market/index.json` 里的 `icon` 是 `icon.svg` 的 base64 内联（`data:image/svg+xml;base64,...`）。
索引校验器的上限是**解码后 32 KiB**，当前 icon 2.8 KB。改图标后重新内联：

```sh
node -e "
const fs=require('fs');
const icon=fs.readFileSync('icon.svg','utf8').trim();
const p=JSON.parse(fs.readFileSync('market/index.json','utf8'));
p.plugins[0].icon='data:image/svg+xml;base64,'+Buffer.from(icon).toString('base64');
fs.writeFileSync('market/index.json', JSON.stringify(p,null,2)+'\n');
"

# 校验（用 DSH 自己的校验器，别信自己的眼睛）
node -e "
const {parseMarketIndex}=require('/Applications/DeepSeek Harness.app/Contents/Resources/app.asar.unpacked/../app.asar' );
" 2>/dev/null || echo '用 /tmp 里解出来的 dsh-plugin-market-index/lib/index.js 校验'
```

## 别人装的时候会看到什么

1. **侧栏 → 插件 → 实验性插件 → 更多 → 自定义插件市场**（启用）
2. 发现页 → 添加索引 → 粘贴 raw 地址
3. 搜 `figmark` → 安装 → **Cmd+Q 完全退出重开**

## 两个真实的坑

**代理会吞掉 tarball 上传。** 本机 `http_proxy` 指向本地代理时，`npm publish` 会连续报
`PUT ... failed with 503` 并静默重试，看起来像 npm 挂了，其实是几 MB 的包体没传上去。
发布这一步必须 `env -u http_proxy -u https_proxy -u all_proxy -u NODE_USE_ENV_PROXY`
清掉代理变量，`~/.npmrc` 里的 `noproxy=` 对 npm 自己的 dispatcher 不生效。

**Granular Token 默认不让发布。** 账号开了 2FA 时，未勾选 "Bypass 2FA" 的 Granular Token
会得到 `403 Two-factor authentication or granular access token with bypass 2fa enabled is required`。
两个选择：在 token 页勾上 Bypass 2FA，或生成 Classic Token 时选 **Automation** 类型（自带绕过）。

**发布中途失败会留下 `0.0.0-stage` 占位版本。** 直接重跑 `npm publish` 即可，占位会被替换；
不用手动清。
