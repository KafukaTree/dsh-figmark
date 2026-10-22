# Note: 作为 dsh-figmark 对外发布

Status: implemented

## Problem

插件一直只作为一个 `link:` 依赖活在这台机器的 desktop profile 里：`package.json` 写着
`private: true` 和 `version: 0.1.0`，没有 LICENSE、没有图标、没有 `engines.dsh`，README 描述的
还是几轮改版之前的界面（「仅保存」「保存并提交给智能体」两个按钮、图上写字、顶部工具栏）。
别人要装它，只能拿到一份仓库，且要自己猜 DSH 版本要求。

同时包名 `dsh-annotator` 说的是「标注一切」，而这个插件真正的场景是**科研配图**批注；
`sati` 那类「给任意 DOM 元素写评论」的工具占着 annotate 这个词。

## Decision

包名改成 **`dsh-figmark`**（figure + mark），版本从 `0.1.0` 起一条正式线 **`1.0.0`**。

改名是**全链路**的，不只是 `package.json`：

| 面 | 旧 | 新 |
|---|---|---|
| npm 包名 / `dsh.bundle` 行 id | `dsh-annotator` | `dsh-figmark` |
| Host 导出名、`ctx.effect` 名 | `dsh-annotator: annotation route` | `dsh-figmark: annotation route` |
| 系统提示段名 | `dsh-annotator:annotations` | `dsh-figmark:annotations` |
| 路由前缀 | `/dsh-annotator` | `/dsh-figmark` |
| 守卫头 | `x-dsh-annotator` | `x-dsh-figmark` |
| Client 模块名 | `dsh-annotator-client` | `dsh-figmark-client` |
| body id | `dsh-annotator/image` 等 | `dsh-figmark/image` 等 |
| PDF worker 名 | `dsh-annotator-pdf` | `dsh-figmark-pdf` |

**侧车文件名不变**（仍然 `<名>.<后缀>.annot.json` 与 `.annotated.png|pdf`）：那是**用户磁盘上的
数据格式**，不是包的标识。改它会让所有既有标注失效，而改名对用户的收益是零。同理，`marks[]`
里的字段名、`annotation` 的 v1 形状、`ANNOTATION_SUFFIX` 常量都不动。

发布形态：`files` 只列 `icon.svg`、`lib`、`cordis.patch.yml`、`README.md`、`LICENSE`、`market`；
`prepack` 跑 `pnpm run build`（npm 装的是构建产物，源码不进包）；`private: false`；MIT。

`engines.dsh` 写 `>=0.2.1-rc.2`——这是插件实际依赖的运行时（`documentPreviews`、
`sidebar.right.tab.document`、`conversation` 三个服务都在这一版里，更早的没有）。它同时决定
`pluginManager` 的安装前兼容性检查：`evaluatePluginCompatibility` 优先读 `engines.dsh`，不满足则在
`pnpm add` 之前就拒装。

提供两份安装入口：npm（`dsh plugin add dsh-figmark`）与**市场索引**
（`market/index.json`，format 1，图标内联为 base64 `data:` URL）。

## Alternatives considered

**保留 `dsh-annotator` 这个名字。** 落选：它描述的范围比插件大。`dsh-annotate` 已经在 npm 上
（13 星）做的是「选 DOM 元素写评论」，两者在别人的插件页里会互相冒充，而 figmark 的卖点恰恰是
「批注的是一张有坐标的图，不是一棵 DOM 树」。

**同时改侧车后缀（`.annot.json` → `.figmark.json`）。** 落选：这是格式迁移，不是改名。它会让
每一份既有标注在升级后读不出来，而格式本身没有任何改进。

**保留 `private: true`，只发 Git。** 落选：DSH 的插件市场索引 format 1 里，`source` 只支持
`npm`（带可选 registry）与 `git`（必须钉到 40 位 commit）。两种都能发，但 npm 装完是构建好的
产物、不用在用户机器上跑 `pnpm install && pnpm run build`，对一个 7.9 MB PDF 分块的包差别很大。
两者都提供，用户自己选。

**把图标做成 1024×1024 的 PNG。** 落选：索引格式的内联 `data:` 图标上限是解码后 32 KiB，且
DSH 在插件列表里把它画在 32px 的位置。16×16 网格的像素图缩到 32px 时边缘正好落在整数像素上，
比降采样的 PNG 干净。

**市场索引单独开一个仓库。** 落选：一个人维护一个插件时，索引和包不同步是最常见的坏状态
（索引里写着 1.0.0，包里还是 0.9）。放在同一个仓库的 `market/index.json` 并按 `files` 打进包里，
发布时只有一个 version 字段要改。

## Consequences

- 已安装的旧链接要重装：profile 的 `dependencies` 与 `dsh.profile.bundles` 里 `dsh-annotator`
  换成了 `dsh-figmark`，`lib/` 需要重建（`prepack` / `pnpm run build`）。
- 反过来，**升级后旧批注仍然可读**——侧车名没动，磁盘上已有的一切照旧。
- 路由前缀与守卫头变了：`/dsh-annotator/annotation` 不再存在。本机没有别的进程依赖这个前缀
  （插件自己两侧的常量从 `src/shared/http.ts` 单一来源取，测试钉住了两侧字面一致）。
- npm 包 3.3 MB（压缩后），其中 7.9 MB 未压缩的是 PDF.js + pdf-lib 分块。它只在打开 PDF 时
  被 `require.async` 拉取，但安装时体积是实打实的。
