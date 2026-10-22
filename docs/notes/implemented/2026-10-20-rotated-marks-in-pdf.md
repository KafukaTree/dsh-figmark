# Note: 导出成原生 PDF 注记时也要带上旋转和字号

Status: implemented

## Problem

上一版让读者可以拖动改变框选、圈选、箭头的大小和方向，也允许放大文字的牌。屏幕上（`Canvas` 叠加层）立刻正确，但**导出的 PDF 注记没跟上**：`src/client/pdf/annotate.ts` 的 `place()` 只把 `points` 映射进 PDF 用户空间，`rotation` / `scale` / `labelOffset` 三个字段一个都没读。

这条路径不是可有可无的装饰。就 PDF 文档而言，`run()` 里 `annotatePdf()` 产出的那份 `<name>.annotated.pdf` 是**发给智能体的唯一视觉记录**——页面的 PNG 是另发的，但那是栅格图，智能体读注释几何读的是这份 PDF。所以「屏幕上转了一个框，发给智能体的文件里它是正的」是一个真的错位：人看到的是自己转过的样子，模型看到的是没转过的样子。

## Decision

**旋转在写入前烘焙进几何。** `place(mark, transform)` 现在先找到标注自己的包围盒中心，把点绕它转过去，再映射到用户空间。这和叠加层里 `markTransform` 生成的 `rotate(deg cx cy)` 是同一个变换（同一个中心、同一个顺指针约定），所以 PDF 里和屏幕上是同一个形状。

**几何算术只能是本模块私有的。** 第一版直接 `import { boxCentre, markBounds, markRadians, rotateAround } from '../mark-geometry'`，`pnpm run build` 立刻失败：

```
Error: client bundle: require('./client.mark-geometry.js') would not resolve in the browser;
       only require.async loads a chunk
```

原因是 `tsdown.config.ts` 里 `asyncChunkRequire` / `generateBundle` 两个钩子钉住的规则：`client.pdf.js` 是懒加载分块，**分块不得与入口共享任何模块**，因为浏览器里的 `__ModuleLoader__` 工厂只能解析它自己 fetch 进来的东西，静态 `require` 一个兄弟文件解析不了。所以 `annotate.ts` 里改为自带三个私有函数 `pointsBox` / `turnAround` / `turnedRing`，不 import 任何客户端模块；这份重复是有意的，注释里写明了原因。**以后往 `annotate.ts` 加功能时不要 `import '../xxx'`，否则构建会挂。**

**`/Square` 和 `/Circle` 不能转，所以转过的它们改写成折线。** PDF 的这两个注记子类型按定义轴对齐，`/Rect` 也只有一个轴对齐的框。转过的框和椭圆因此不再走 `re S` 和四段贝塞尔，而是采样成一圈点、连成闭合折线（`turnedRing`）：框是精确的四个角，椭圆用 `TURN_SEGMENTS = 72` 段。72 段在 200 点长的椭圆上是每段不到 9 点，肉眼是连续曲线。

**`/Line` 保持原样。** 箭头本来就是两点线段，转过的两点仍然是两点线段，`/L` 数组照旧——`rotation` 只是把两个端点转过去。

**文字牌不转，但跟着变字号。** `textSize` 从 `TEXT_FONT_SIZE / scale` 改成 `TEXT_FONT_SIZE * (mark.scale ?? 1) / scale`，和叠加层 `labelMetrics` 的算法一致。`rotation` 对 `text` 不起作用——屏幕上文字牌也不跟着转（`markTransform` 只包住描边路径，`renderLabel` 在 `<g transform>` 之外），两边保持同一个语义：文字是正的，方块可以转。`labelOffset` 同理不参与 PDF 的 `Rect` 计算，因为 PDF 里的说明走 `/Contents`，看不见牌在哪儿。

**`PlacedMark` 加一个 `turned` 标记。** `strokeContent` 靠它分流：转过就走折线，没转过就走原来的 `re`/贝塞尔。这是必要的，因为转 0° 和转 90° 的框在 `points` 上长得完全一样（都是两点），只有这个标记知道该走哪条路。

**半画的框照旧不崩。** `turnedRing` 在少于两个点时直接返回原点集（只是把它们转了），`boundsOf` 再给一个 `MIN_RECT_SIDE = 1` 的下限，annotation 仍然写出来、只是没有 appearance——和改动前 `.half-drawn` 那条测试的行为一致。

## Alternatives considered

- **把旋转写成 PDF 的 `/MK /R` 或注释矩阵** —— `/MK /R` 只对部分子类型有效、取值限定 90° 的整倍，而读者转到的是任意角度。注释自己的几何没有可写的变换矩阵字段（`/AP` 是画在哪儿的约定，不是几何）。烘焙进点是唯一通用的做法。
- **转过的框仍然写成 `/Square`，只用折线的 appearance 而不改 `/Rect`** —— `/Rect` 决定可点击区域和读者重新生成外观时的裁剪框。`/Rect` 还是原样、appearance 却是转过的，转 45° 时外观会被裁掉两角。所以 `/Rect` 必须从转过后的点算。
- **把椭圆用更少的贝塞尔段（比如 8 段）** —— 8 段在小椭圆上已经能看出折角，而 72 段的成本只是 appearance 流多约 3 KB。这类注记一份文档最多几十个，不值得省。
- **`text` 也按 `rotation` 转** —— 屏幕上就没转（`renderLabel` 在 `rotate()` 之外），PDF 转了反而和屏幕不一致。要么两边都转（文字斜着躺，通常不是读者想要的）、要么都不转。选不转。
- **`labelOffset` 也写进 PDF** —— PDF 的说明是 `/Contents`，牌的位置是外观细节而不是语义；而且 `/FreeText` 的 `/RD` 是"内缩"不是"位移"，写不对反而让读者的默认外观错位。
- **在 `PdfBody` 里预先烘焙旋转、让 `annotate.ts` 完全不动** —— `PdfBody` 只知道页面位图和 `transform`，把几何计算挪过去会让叠加层和导出各自算一遍、又要保持两边一致。放在 `annotate.ts` 里，导出的入口只有一处知道 `transform`，是更窄的接缝。
- **为共用几何新建一个 `src/client/pdf/geometry.ts` 再两边 import** —— 那正是构建规则禁止的「分块与入口共享模块」，只是把违规藏进一个文件名里。分块必须自给自足。

## Consequences

- PDF 页面上转过的框、椭圆、箭头，导出的 `<name>.annotated.pdf` 里是同一个方向和形状；文字牌的字号倍数也写进去了。
- 转过的框/椭圆不再是 `/Square` / `/Circle` 的 appearance 里的一个矩形/圆，而是一圈折线——子类型仍是 `Square`/`Circle`，所以读者面板里的分类和 `/Contents` 读起来不变。
- 覆盖：`tests/pdf-annotate.spec.ts` 新增 `a mark the reader turned` 块 6 条（转过的框不再 `re S`、转过椭圆的折线段数、箭头绕中心转、文字牌不转、字号倍数、半画的框不崩）。
- 已知边界：`rotation` 是任意角度时，转过的框的折线在极小尺寸（`MIN_MARK_SIZE` 附近）上会有可见的锯齿，这是采样而非贝塞尔决定的；再小就不是读者会去转的尺寸了。
