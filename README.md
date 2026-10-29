# dsh-figmark

DeepSeek Harness 插件：在右侧栏的文档预览里**直接圈画批注**科研配图，然后把批注**当作一条用户消息交给智能体**——让它按你圈的位置去改生成源（Python 脚本、DOT、SVG），而不是靠你打字描述「左边第二条曲线的图例要挪上去」。

<p align="center"><img src="./icon.svg" width="72" height="72" alt="dsh-figmark icon"></p>

> annotate a figure (image / SVG / PDF / HTML) in the right-sidebar preview and hand the marks to the agent as one user message. The original file is never modified: marks live in a sidecar next to it.

## 它解决的问题

科研图的返工意见大多是**位置性的**：「这个标号指错了」「这里少一条图例」「这条误差棒太长了」。用文字描述既慢又容易误解，而只发一张截图给模型，它只知道「图上有个红框」，不知道红框框的是哪一行元素。

dsh-figmark 把三样东西一起交给智能体：

1. **图面坐标** —— 每条标注的几何（箭头两端 / 框的对角 / 单点的位置）；
2. **落在哪个元素上** —— SVG 给 `tag`/`id`/`title`/元素文字/包围盒，HTML 给一条从 `body` 起可直接命中的 `selector`；消息里只保留说得清名字的那几项（元素 `id`、只由 `id` 组成的 `#id` 选择器、超长的元素文字、指认整张图本身的锚点都不再打印；有标题或短文本就报那个词，HTML 则报能被源码命中的路径）；
3. **你那句话** —— 每条标注一段「这个元素要改什么」，外加一段「这张图整体要往哪个方向改」。

## 支持范围

| 文档类型 | 后缀 | 状态 |
|---|---|---|
| 图片 | `png` `jpg` `jpeg` `gif` `webp` `bmp` `ico` | ✅ |
| SVG | `svg` | ✅ 内联渲染，支持图元锚定 |
| PDF | `pdf` | ✅ 整份文档一份批注：逐页画、一次保存，写回**原生 PDF 注释对象** |
| HTML | `html` `htm` | ✅ 固定 1024px 渲染面 + 元素锚定（只写批注文件，不产出标注图） |
| Markdown | `md` `markdown` | ✅ **编辑**而非批注：改动作为 unified diff 交给智能体，插件不落盘 |
| Office | `doc` `docx` `ppt` `pptx` `xls` `xlsx` | ⏳ 待接入，仍由内置预览器打开 |

## 安装

### 从插件市场安装（推荐）

在 DSH 里打开 **侧栏 → 插件 → 实验性插件 → 更多 → 自定义插件市场**，添加索引地址：

```
https://raw.githubusercontent.com/KafukaTree/dsh-figmark/main/market/index.json
```

然后在**发现**页搜 `figmark` 安装。安装完成后 **Cmd+Q 完全退出重开** DSH。

### 从 npm 安装

```sh
dsh plugin add dsh-figmark
```

`dsh plugin add` 会把它写进 profile 的依赖并加入 `dsh.profile.bundles`。装完同样要完全退出重开。

### 从源码开发

```sh
git clone https://github.com/KafukaTree/dsh-figmark.git
cd dsh-figmark
pnpm install
pnpm run build          # 产出 lib/index.js（Host）与 lib/client.js + lib/client.pdf.js（Client）
dsh plugin add "$PWD"
```

**改动 Host 半后必须重启宿主进程**——Node 会缓存已导入的模块；Client 半只需刷新页面。开发时建议用隔离实例：

```sh
DSH_HOME=/tmp/figmarkdev dsh --profile figmarkdev --port 3099 --no-open
```

## 用法

打开右栏的图片 / SVG / PDF / HTML，底部就是全部控件：

- **左侧浮条**：选择（鼠标指针）· 箭头 · 框选 · 圈选 · 手绘 · 单点。除「选择」外每个工具画完**自动回到选择**并选中刚画的那个，说明框随之弹出、光标已经在里面。
- **底部浮条**：标注样式（颜色折叠面板）· 撤销 / 重做 · 总体目标 · 标注清单 · 发送给智能体 / 发送到对话框。
- 两条浮条都能**拖动**，位置记在浏览器里，下次打开还在原地。
- 图上只画标记，**不把文字画到图上**。编号只画在单点上（地图水滴的滴头里），序号是它在**本类标注里**的位置，和消息里那句「单点2」是同一个数；箭头/矩形/椭圆/手绘/元素标注在图上不带数字，消息里按「箭头1」「矩形1」「元素1」这样称呼它们。
- 选中标注后可以**拖动改位置**；框/椭圆/手绘拖角或边上的手柄**改大小**、拖顶部手柄**旋转**（按住 Shift 吸附 15°）；箭头没有控制框，只有两端两个圆点，拖哪一端就只动哪一端。一次手势 = 一步撤销。
- 触控板捏合缩放，缩放中心跟指针；「选择」工具下直接拖动就是平移。
- 双击图上的标注 = 打开它的说明框；`Esc` 取消选中；`Delete`/`Backspace` 删除选中标注。
- 编辑会**自动保存**（防抖 600ms），刷新、重开都不丢；只有点「发送」成功后才清空面板并删掉磁盘上的批注文件。

### 两个发送按钮

| 按钮 | 行为 |
|---|---|
| **发送给智能体** | 批注+标注图作为一条用户消息**直接发进当前会话** |
| **发送到对话框** | 只**写进输入框草稿**（连同图片附件），你自己看完再按回车 |

纯单点批注（一个坐标 + 一句话，没有框和箭头）不生成标注图——消息里会写明「本条标注只有位置点，没有标注图」，让智能体按坐标去原图定位。

## 产物

批注**从不修改原文档**，只在旁边写文件：

| 文件 | 内容 |
|---|---|
| `<名>.<后缀>.annot.json` | 批注文档：图信息（绝对路径、sha256，PDF 另有 `pageCount`）、`marks[]`（kind/color/points/rotation/page/anchor/detail）、总体目标 |
| `<名>.<后缀>.annotated.png` | 图片/SVG：原图 + 批注的合成图（最高 2× 分辨率），作为图片附件随消息发送 |
| `<名>.<后缀>.annotated.pdf` | PDF：原件副本，批注写成**原生 PDF 注释对象**，作为附件随消息发送 |
| —— | HTML：只有批注文件（浏览器无法把渲染好的文档栅格化）；定位靠 `anchor.selector` |
| —— | Markdown：**不留任何文件**，改动以 unified diff 进会话 |

名字**带着被批注文件自己的扩展名**（`fig1.svg` → `fig1.svg.annot.json`），所以同目录下同主名不同后缀的两份文件各有各的批注、绝不会互相读错。

`marks[].points` 是**图面像素坐标**（原点左上）；PDF 的坐标是该页的页面单位（PDF 点），因此缩放、翻页、旋转页都不影响指向。原图被重新生成后 sha256 变化，插件会提示旧批注可能失准。

带批注的 PDF 里，箭头是 `/Line`、框选 `/Square`、圈选 `/Circle`、手绘 `/Ink`、单点 `/Text`，各自带自绘外观流，所以在 Acrobat、Preview、浏览器内置查看器里看到的形状与页面上一致，也能继续编辑或删除。旋转过的框会烘焙成折线（PDF 的 `/Square` 按定义轴对齐，转不了）。

插件还会注入一段系统提示，告诉智能体拿到【附图标注】消息后该怎么处理：**改生成源，不涂改导出的位图**，未标注处不动，逐条回应。

## 与同工作区的其它批注器互通

同一工作区里的姊妹批注器（Sati）把批注写进同一份侧车文件，但用 **v2 形状**（`target` 而非 `figure`）。本插件读得懂 v2、继续写自己的 v1，所以两边都能看到对方留下的批注；回存时 v2 独有、本插件不建模的字段会丢。

早期版本的两种命名仍会被读回（只读回退）：按主名的 `fig1.annot.json`，以及 PDF 按页各一份的 `report.pdf.p3.annot.json`（会被合并成一份显示，旧文件原样保留）。

## 已知限制

- **不做图面编辑**：插件只采集批注，不改图；修图仍由智能体改生成源完成。
- **栅格图没有元素锚定**：PNG/JPEG 只有像素坐标，锚定信息仅 SVG 与 HTML 有。
- **PDF 只写原生注释对象**：不做「把标记烧进页面内容」的副本。好处是标记在阅读器里仍可编辑删除；代价是只看页面内容、不渲染注释的流程看不到标记（那种场合用消息里附的每页图片）。
- **PDF 一次一页**，无文本层、无连续滚动。
- **HTML 渲染是静态的**：框架不执行脚本、不允许外部请求（自带 `default-src 'none'` CSP），相对引用的图片与外部样式不加载。脚本渲染出来的内容在预览里是空的，批注也落不到上面。
- **Markdown 的差异基线是「你打开时的那一版」**，不是 git HEAD。
- **Markdown 没有语法高亮**：编辑框是原生 `<textarea>`（插件因此至今零新增运行时依赖）。
- **Office 尚未接入。**

## 开发

开发规范（门禁、负控制、决策记录、架构红线）的家在 [`AGENTS.md`](./AGENTS.md)，开工前先读 §2。决策背景在 [`docs/notes/`](./docs/notes)。

```sh
pnpm run check      # 三个门禁一次跑完：typecheck + lint + test:coverage
pnpm run build      # tsc --noEmit + tsdown（Host ESM / Client 单文件 CJS + PDF 懒加载分块）
pnpm test           # vitest
```

Client 半边必须匹配 DSH 动态客户端契约：单文件 CJS、唯一副作用是 `window.__ModuleLoader__.load({id, factory})`、只把 `react`/`react/jsx-runtime`/`react-dom` 留给模块表，其余全部内联——插件路由只发 `client.*.js`，发不了字体等静态资产。PDF 那一半（PDF.js + pdf-lib）住在懒加载分块里，且**分块不得与主包共享任何模块**，否则主包会同步 `require` 一个它拿不到的文件。

## 许可

MIT，见 [LICENSE](./LICENSE)。
