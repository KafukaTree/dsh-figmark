# Note: SVG 预览要和同一份数据的 PNG 长得一样

Status: implemented

## Problem

用户报的是「SVG 有些格式没显示出来，和同样用 py 导出的 png 显示不一样，缺元素」。这不是观感问题，是可复现的：`src/client/figure-dom.ts` 的消毒函数把 `use` 列进了 `FORBIDDEN_ELEMENTS`，整个元素连同它的引用一起删掉。

**matplotlib 的每一个标记、刻度线、误差棒端帽都是 `<use>`。** 一张普通的折线图里，`<use>` 是数量最多的元素之一——实测一张 `figsize=(5, 3.2)` 的带标记折线图有 95 个 `<use>`、6 种不同的 marker path 各在 `defs` 里被引用几十次。删掉 `use` 之后 `defs` 里的 path 还在（它们不参与渲染），所以结果不是报错、也不是空白，而是**图上所有圆点、方块、三角、星号、误差棒端帽、刻度线全部消失**，线还在。这正是「缺元素」，也正是 PNG 里看着正常的原因——PNG 是 matplotlib 自己栅格化的，根本不经过这个消毒函数。

## Decision

**`use` 从禁用列表里移出。** 它在本插件的威胁模型里是安全的：`<use>` 只能克隆**已经在同一棵树里**的元素，唯一能越界的方式是 `href` 指向外部文档，而 `href` / `xlink:href` 的既有规则（只放行 `#` 与 `data:`）本来就会把外部引用删掉。换句话说，留着元素、删掉外链，能得到「本地克隆照常渲染、外部加载仍然禁止」的正确组合。

**`<style>` 里的远程加载单独处理。** 修 `use` 的过程中测出一个既有的真实泄漏：`<style>@import url(https://evil.example/t.css)</style>` 在被内联进文档后**真的会发网络请求**（headless Chrome 里确认命中一次）。它不在 `href` 规则覆盖范围内，所以之前是漏的。现在 `parseFigureSvg` 会对每个 `<style>` 元素的文本跑 `REMOTE_STYLE_RULES`，删掉 `@import` 与远程 `url(…)`。本地 `url(#gradient)` / `url(#clip)` 与普通选择器规则保留 —— 图就是靠它们画的。

## Verification

19 张 matplotlib 对照图（markers / hatches / errorbars / annotate / fills / scatter / contour / barh / polar / log / mathtext / legend / imshow / colorbar / 多子图 / twinx / stem / boxplot / pie），每张都渲染三遍：原始 SVG、旧消毒结果、新消毒结果，逐像素比对。

- 旧消毒：19 张里 17 张有差异，最大的 `t_scatter` 差 3.11%、`t_markers` 1.49%、`t_errorbars` 1.46%、`t_log` 1.05%、`t_stem` 0.34%
- 新消毒：**19 张全部 0 像素差**

再用手工构造的 SVG 覆盖渐变、图案、遮罩、`<symbol>`+`<use>`、`<filter>`、`clipPath`，新旧也是 0 像素差。视觉确认过 12 种 marker 形状（circle/square/triangle/diamond/inverted-triangle/star/plus/x/left/right/pentagon/hexagon）与误差棒端帽全部回来。

`pnpm run check` 三门槛全绿：typecheck / oxlint 0 warning / 27 test files、618 tests / 每文件四项覆盖率 100%。

## Alternatives considered

- **把 `use` 展开成它引用的元素（inline 克隆）** —— 要做就得自己解析 `href` 目标、复制 `defs` 里的 path、把 `x`/`y` 平移进 `transform`。这对 matplotlib 的输出是对的路子，但会改掉 DOM 结构，`anchorAtPoint` 的命中测试和 `<title>` 锚定都要重新验；而保留 `<use>` 一行改动就得到同样的像素结果，风险小得多。
- **只对 `image/svg+xml` 放宽，HTML 预览那条路径继续禁 `use`** —— HTML 走的是另一套（`html-dom.ts` 的 iframe + CSP），本来就不经过这个函数，不需要动。
- **在 `href` 规则里允许 `use` 指向同源相对路径** —— 那等于允许图去读工作区外的文件。`#` 与 `data:` 的白名单已经够用：图里的 `use` 实际只会指向自己的 `defs`。
- **`@import` 不改，只靠 CSP 兜底** —— 这个 SVG 是被**内联进主文档**的，主文档没有为它设 CSP（`<meta>` CSP 只出现在 HTML 预览的 iframe 里）。也就是说没有兜底，必须在这里删。
- **用 DOMPurify 之类的库代替手写消毒** —— 会引入依赖，而现有规则已经很窄；本次只是把一条过宽的规则收窄、一条漏掉的规则补上，用不上完整策略引擎。
