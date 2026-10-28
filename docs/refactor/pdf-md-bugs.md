# Bugs found in the PDF and Markdown chains

Found by a read-only audit while the files around them were being split. None of
them was fixed: the refactor's contract is that behaviour does not change, and a
fix is a behaviour change. Each one is recorded with the file and line it lives
at (baseline line numbers), how to make it happen, and what the reader sees.

Severity is about the reader, not about how interesting the bug was to find.

The strongest cluster is at the top: three of the four high-severity findings are
the same mistake in different places — **switching documents does not reset the
state that belonged to the old one**. That is worth reading as one finding with
three symptoms.

基线 4b3daa1（`refactor/cohesion`）。审计期间**未修改任何行为**；每条都由探针或直接读码确认，
凡标 "verified" 的是在本机用临时探针跑出来的（探针已删除，不进仓）。

**所有 `path:line` 都指基线 4b3daa1 的行号**，不是重构后的行号 —— 重构把 `PdfBody.tsx`（968 行）
与 `pdf/annotate.ts`（634 行）拆了，行号已整体移动，但每一处缺陷的代码在重构中都是**逐字保留**的
（这正是"纯重构"的含义），所以按符号名在现在的 `src/client/pdf/` 里仍能找到同一段代码。

严重度按读者感受到的后果排，不按"发现难度"排。

---

## 1. 切到另一个文档后，上一个文档的标注状态不清空（high，verified）

`src/client/pdf/PdfBody.tsx:410-432`（读侧边车的 effect）

```ts
const saved = loaded.annotation
if (saved === null) return          // ← 这里直接 return
setMarks(groupByPage(saved.marks))
setSummary(saved.summary ?? '')
if (saved.marks.length > 0) setMode('annotate')
setCreatedAt(saved.createdAt)
setStale(saved.figure.sha256 !== loaded.sha256)
```

**触发条件**：侧栏标签从一个"有标注的 PDF"切到一个"从没标注过的 PDF"（或任何 `annotation === null` 的文档）。

**预期**：新文档打开时 marks 为空、summary 空、createdAt 为 null、stale 为 false。

**实际**：`marks` / `summary` / `createdAt` / `stale` 全部保留上一个文档的值。探针（3 页文档 A 带 1 条标注 →
切到文档 B，B 的侧车为 null）：

```
DRAFT AFTER SWITCH [{"id":"from-first-document","kind":"rect",...,"page":1}] text 'marks 1'
```

更糟的是这条泄漏会**落盘到别的文档名下**：在 B 里画一笔触发 autosave，写出的载荷是

```
{"figure":{"address":".../other.pdf","path":"/w/other.pdf","sha256":"bbbb...","pageCount":3},
 "marks":[{"id":"fresh",...}],"summary":"","createdAt":"2026-01-01T00:00:00.000Z"}   ← A 的 createdAt
```

即新标记 + 旧文档的 `createdAt` 一起写进 B 的侧车；如果读者不画任何东西就直接点发送，
A 的整批标注会以 B 的名字写进 `B.annot.json` 和 `B.annotated.pdf`。这是"标注落到错误文档上"，
是 §2.2 写入面最不能出的那类错。

同一处 effect 还漏了 `requested` / `zoom` / `generation` / `selectedId` / `openPanel` 的重置，
后果见第 2 条。

## 2. 换文档时页码不重置，渲染 effect 越过新文档的页数（high，verified）

`src/client/pdf/PdfBody.tsx:515-531`（渲染 effect）与 `:488`（`stated`）

```ts
const stated = clampPage(requested, pageCount)      // 只用于显示
...
const rendered = await renderPage(pdf, requested, renderWidth)   // ← 用的是未 clamp 的 requested
```

**触发条件**：在 3 页文档里翻到第 3 页，然后切到一个 1 页文档。

**预期**：新文档显示第 1 页。

**实际**：`requested` 仍是 3，`pdf.render(3)` 抛错，界面变成

```
打开 PDF 失败：no page 3      ← 探针实测
```

而**新文档是完好的**。读者唯一的出路是关掉标签重开（见第 3 条：这个错误一旦出现就不会消失）。
即"从长文档切到短文档"这个很平常的操作会让新文档完全不可读。

## 3. `error` 一旦置上就永不清除（high，verified）

`src/client/pdf/PdfBody.tsx:300`（state）、`:397`、`:527`（两处 `setError(...)`）、`:860`（渲染分支）

全文没有一处 `setError(null)`。渲染分支 `error !== null ? <错误提示> : shown === null ? <占位> : <AnnotatorBody>` 里
error 的优先级最高，所以：

- 第 2 条的 `no page 3` 永远不会被后来的成功渲染覆盖；
- 一次瞬时渲染失败（切页过快、canvas 申请失败）之后，即使后续渲染全部成功，面板也一直显示错误，
  读者看到的是一个"打不开的 PDF"。

**预期**：一次成功的 `setShown(...)` 或文档切换应清掉 error（或至少 error 与 shown 二选一按新鲜度决定）。

## 4. PDF 导出的位置点（point）环半径随线宽反向缩放（medium，verified）

`src/client/pdf/annotate.ts:407-421`（`pointContent`）

```ts
const base = Math.max(placed.width / (STROKE_WIDTH * unit), 0.0001)
const radius = POINT_RADIUS / base        // placed.width = 2.5 * weight * unit / scale ⇒ base = weight
```

**触发条件**：任何 `point` 标注被写进 `<名>.annotated.pdf`。

**预期**：与屏幕/交付 PNG 一致 —— 屏幕用 `pinRadiusOf = POINT_RADIUS(10) * weight * unit`（`src/client/render.ts:53,67`）。

**实际**（探针读回写入的 appearance 流，用户单位，scale=1）：

| weight | unit | screen pin radius | PDF ring radius |
|---|---|---|---|
| 1 | 1 | 10 | **7** |
| 2 | 1 | 20 | **3.5** |
| 0.5 | 1 | 5 | **14** |

半径既偏小、又随线宽**反向**变化。后果：读者把线宽拖粗，PDF 里的圆环反而缩小；同一个标注在
`annotated.pdf`（agent 直接在阅读器里核对的那份）和附带的 PNG 里长得不一样。

## 5. `annotate.ts` 与 `render.ts` 的绘图常量各存一份，且已经漂移（medium）

`src/client/pdf/annotate.ts:55-77` vs `src/client/render.ts:30,48,53,67`

两份 `STROKE_WIDTH = 2.5`、`ARROW_HEAD = 14`、`ARROW_SPREAD`、point 半径各自维护。已经漂移的地方：

- `POINT_RADIUS`：PDF 写 7，屏幕 10（第 4 条的直接来源）；
- PDF 里 point 是"细环 + 实心点"，屏幕/导出是"水滴形 pin + 白色编号"，两套几何毫不相干；
- 编号数字只出现在屏幕/PNG 里，`annotated.pdf` 上没有任何编号，所以"第 3 条标注"在 PDF 副本里无法按号对应。

这不是单个笔误，是"两处真理源"的结构问题：改一处必然忘另一处。修的时候应该是 PDF 侧引用同一组
几何函数（`annotate.ts` 的注释里说不能 import `../mark-geometry` 是因为 chunk 不能与主包共享模块——
但 `render.ts` 的纯常量本可以走 props 或复制到一个 chunk 内的单一模块）。

## 6. 非 ASCII 备注经 `PDFString` 写回后被改字（medium，verified）

`src/client/pdf/annotate.ts:154-159`（`latinEncodable`）、`:493-495`（`contentString`）

`latinEncodable` 把"所有码元 ≤ 0xFF"当作"能安全用 `PDFString`"，但 `PDFString.of` 写的是
**PDFDocEncoding**，不是 Latin-1：0x80–0x9F 与 0xA0 等字节在 PDFDocEncoding 里映射到别的字符。

**触发条件**：备注里出现 U+0080–U+009F 或 U+00A0（**不换行空格**——从网页/PDF 复制文本时极常见）。

**实际**（探针写-读往返）：

```
"a\u00a0b" -> PDFString -> 读回 "a€b"    MISMATCH
"a\u0080b" -> PDFString -> 读回 "a•b"    MISMATCH
"café"     -> PDFString -> 读回 "café"   OK
```

**预期**：备注逐字回来（应当走 `PDFHexString.fromText` 的 UTF-16BE 路径）。

## 7. `lazy()` 把一次分块加载失败永久缓存，且没有错误边界（medium）

`src/client/LazyPdfBody.tsx:14-17`

React 的 `lazyInitializer`（`react/cjs/react.development.js:1354-1409`）在 reject 时把
`payload._status = Rejected`、`_result = error` 永久留下，之后每次渲染都 `throw payload._result`。

**触发条件**：`require.async('./client.pdf.js')` 第一次失败（宿主路由抖动、分块 404、离线重连）。

**预期**：下一次打开 PDF 会重试，或至少报一个可恢复的错误。

**实际**：本次会话内**所有**后续 PDF 打开都立刻抛同一个陈旧错误；而 `<Suspense>` 只接 pending 不接 error，
没有 error boundary，所以这个拒绝会一路冒到侧栏外层（整个标签的错误态，而不是一张提示条）。

## 8. `openPdf` 的 Blob URL 在 Worker 构造失败时泄漏（low）

`src/client/pdf/runtime.ts:86-95`

```ts
const sourceUrl = URL.createObjectURL(new Blob([workerSource], ...))
const worker = new Worker(sourceUrl, {...})          // ← 这三行在 try 之外
const bridge = PDFWorker.create({ port: worker })
let task ...
const release = async () => { ...; URL.revokeObjectURL(sourceUrl) }
...
try { ... } catch (error) { await release(); throw error }    // ← try 从第 104 行才开
```

**触发条件**：`new Worker` 或 `PDFWorker.create` 抛错（CSP 禁止 `blob:` worker、内存不足）。

**实际**：`sourceUrl` 永远不被 revoke —— 一次失败泄漏一份 PDF.js worker 源码（~1MB 字符串 → Blob）。

## 9. 被取代的渲染从不取消（medium）

`src/client/pdf/runtime.ts:127-147`（`render`）+ `src/client/pdf/PdfBody.tsx:515-531`

`rendered.render({...}).promise` 返回的是 `RenderTask`，但代码只 `await` 它、从不保存、更不 `cancel()`。
`PdfBody` 用 `live` 标志丢弃过期结果，可过期的渲染本身仍在跑：翻页快、拖窗宽（每个 64px 台阶一次
渲染）时，每次被取代的渲染都会把页面完整光栅化、分配 canvas、再编码成 PNG data URL，然后被丢掉。
PDF.js 自己的 `complete()` 里也只有在 `intentPrint` 时才置 `#pendingCleanup`，所以 `cleanup()` 之后
这些 intentState 不会自己收回。

**预期**：新请求/卸载时 `renderTask.cancel()`（并吞掉由此产生的 `RenderingCancelledException`）。

## 10. `run` 的依赖数组漏了 `props.figureUnit`（low）

`src/client/pdf/PdfBody.tsx:706-743`

`:721` 用了 `props.figureUnit`，依赖数组 `:743` 里没有。壳重建注入面时若 `figureUnit` 换身份，
`run` 会一直用旧的那份笔宽换算。

## 11. 删除一条被选中的标注后，选中态悬空（low）

`src/client/pdf/PdfBody.tsx:540-553`（`removeAnyMark`）

只从 `marks` 里删，不动 `selectedId`。列表里删掉当前选中的那条后，`selectedId` 仍指向不存在的 mark，
页面 body 拿着一个空选择，评论气泡/列表高亮的行为取决于下游对"选中的 id 不在列表里"的容忍度。

## 12. `bytes` 变更的窗口里会向已销毁的文档请求渲染（low）

`src/client/pdf/PdfBody.tsx:381-404`

换文档时 cleanup 里 `opened.destroy()`，但 `pdf` state 仍指向旧文档直到新文档 open 完成。
这个窗口里若窗宽变化（`ResizeObserver` 触发 `setPaneWidth`），渲染 effect 会拿已销毁的文档
`pdf.render(...)`，得到 "Worker was terminated" 一类错误，并被第 3 条的"永不清除"固定下来。

---

## 已核查、确认不是 bug 的两处（避免后面重复投入）

- **PDF 文本层 / 字符偏移 / 选区还原**：`src/client/pdf/` 里没有任何文本层（全仓无
  `getTextContent`、无 text layer DOM）。AGENTS.md §7.5 明确写了"没有 PDF 文本层与连续滚动：一次一页"，
  是已记录的产品边界，不是缺陷。所以这一类 bug 在本渲染链里不存在。
- **Markdown 与 `RENDER_WIDTH = 1024`**：`RENDER_WIDTH` 只被 `src/client/html-dom.ts` 与
  `AnnotatorBody` 的 html 分支使用；Markdown 正文是一个 `<textarea>`（`MarkdownBody.tsx:259`），
  不产生标注坐标，因此"固定渲染宽下的坐标记录 + 窗口重排后失准"这一风险对 Markdown 不成立
  （它属于 HTML 渲染面，写入面不在本任务）。
  Markdown 侧真正的偏差只有一处、且很轻：送达后不清理编辑态（`MarkdownBody.tsx:195-225`
  没有 AnnotatorBody 那样的 `discard()`），同一份 diff 可以再点一次再发一遍 —— 低严重度，未列入上表。
