# Note: 标注只说一句话：删掉图上文字，加单点，投递后清空并删侧车

Status: implemented

## Problem

三个互相纠缠的问题，都出自同一处设计：

1. **每条标注有两种文本**。每条标注除了 `detail`（这个元素要改什么）还有一个 `text`
   （画在图上的一条短标签，带 `scale` / `labelOffset` 供拖动缩放）。图上那张文字牌会
   盖住被标注的内容本身——读者要标注的往往是「这块图例排版不对」，而标签正好压在图例上。
   文字牌还需要一整套自己的排版度量（`labelMetrics` / `textMarkBox` / `markLabelBox` /
   `labelPlate`），以及 PDF 侧的 `layoutText` / `characterWidth` / `textMatrix` /
   内嵌标准字体，只为画一行字。
2. **没有「就这里」的标注**。现有五种工具都要求拖出一个范围：箭头、框选、椭圆、手绘。
   但最常见的意见是「这个标号指错了」「这条曲线缺图例」——一句话加一个坐标，没有范围可言。
   用箭头指过去是伪装的点，还得摆方向。
3. **删掉的批注会复活**。`commit()` 只改内存，从不落盘。于是「清空」按钮清掉的只是屏幕，
   刷新一下 `fig1.svg.annot.json` 又把它读回来。发送之后同理：标注已经交付给 agent 了，
   面板上还留着同样一份，磁盘上也还留着，读者要么重复发送，要么手动再清一遍。

## Decision

### 一条标注只有一句话

`AnnotationMark` 删掉 `text` / `scale` / `labelOffset`，只留 `detail`。`MarkKind` 删掉
`'text'`，加上 `'point'`：

```ts
export type MarkKind = 'arrow' | 'rect' | 'ellipse' | 'pen' | 'point'
```

`render.ts` 因此整份重写：文字牌的度量与绘制全部消失，只剩 `markPathData`、`markTransform`、
`isStrokeKind` 与 `pointMarkBox`。`handles.ts` 的 `HandleId` 删掉 `'label'`，同时删掉
`nudgedOffset` / `scaledBy` / `scalesRatherThanResizes` / `MIN_SCALE` / `MAX_SCALE`——那些
都只为「把文字牌拖到不挡图的地方」存在。PDF 侧的 `layoutText` / `TextLayout` /
`characterWidth` / `lineWidth` / `textContent` / `textMatrix` / `embedStandardFont` 与
AcroForm 字体资源一并删除。

「这个元素的详细说明」是唯一的输入，`describeMark` 也只渲染它：

```
① 箭头 (10,10) → (40,30)，要改：标号指错了
② 单点位于 (30,40)，要改：这条曲线缺图例
```

### 单点是「这里」本身

`point` 只带一个坐标，没有 extent。`render.ts` 的 `markPathData` 对 point 返回
`undefined`（它不是一条路径），`markTransform` 返回 `undefined`（无范围可转）。屏幕上画成
白底圆环 `POINT_RADIUS = 7` 加中心实心点 `POINT_DOT_RADIUS = 2.5`——圆环给出点击与拖拽的
目标，中心点落在真正的坐标上，所以它既不遮住别的东西，也仍然看得见。

`beginHandle` 首行对 point 直接返回 `false`：没有把手可拖。形状本体仍可拖（`PressEdit`），
所以单点放错了位置照样能挪。

### 纯单点的消息不带图

```ts
export function needsReviewImage(document: AnnotationDocument): boolean {
  return document.marks.some(mark => mark.kind !== 'point')
}
```

一条坐标加一句话，坐标已经在句子里，图里没有额外信息可看。所以全为 point 时
`exportPng` 不跑，消息里说清这件事：

> 本条标注只有位置点，没有标注图：按上面逐条的坐标与说明处理原图即可。

只要混进一条有形状的标注，图就必须有——那时图承载的是「箭头指到哪、框住哪一块」。
消息里「有没有附件」这件事不靠猜：`paths.reviewPath !== null` 是保存真的写了产物的证据，
所以消息不可能声称一个 Host 没写出来的附件。

### 投递即完成：清空内存、删掉侧车

`deliverAnnotation` / `deliverToComposer` 成功后，`AnnotatorBody.run()` 与
`PdfBody.run()` 都调 `discard()`：

- `AnnotatorBody.discard()`：`deleteAnnotation(address)` → `commit([])`（清空撤销栈之外的一切）、
  `setCreatedAt(null)`、`setStale(false)`、`setSelectedId(null)`、`writeSummary('')`。
- `PdfBody.discard()`：`seat.discard(address)` → 清空 `marks` / `summary` / `createdAt` / `stale`。

「清空」按钮现在走的也是 `discard()`，所以刷新之后不会再有东西回来。

投递的失败也要分类：删侧车失败**不能**让已经成功的投递看起来失败。所以顺序是先用成功文案
（`已发送给智能体，标注已从面板清空。`），再 `await discard()`；`discard` 内部把删除失败写成
另一条状态（`clearError`：`标注已从面板清空，但删除磁盘上的标注文件失败：…`）。内存照样清掉——
标注已经从这一侧交付，留着只会让读者再清一次；而侧车还在则必须说出来，否则它下次会复活。

### Host 侧的新动作

`DELETE /dsh-annotator/annotation?address=…`：

- `resolveTarget` 解不出目标 → 404（与 GET 同一条拒绝路径）。
- `removeAnnotation(figurePath)` 删 `[paths.annotation, paths.review]` 两个文件，只有
  `ENOENT` 可容忍，其他错误向上抛——一个删不掉的陈旧侧车正是「复活」的来源，静默吞掉
  等于把 bug 留在磁盘上。
- 返回 `{ ok: true, annotationPath, reviewPath, removed }`；`removed` 是「这次真的删了东西」，
  所以对一个从未标注过的图发 DELETE 也是 200。
- 原图不动。`deleteAnnotation(address)` 在客户端补上 `x-dsh-annotator` 守卫头。

### 消息里不再打印路径

侧车是临时件：投递完就删。之前消息里会写 `标注文件：/w/fig1.annot.json`、`标注图：…`
（PDF 还有 `带批注 PDF：…`），读者删完文件之后那些行就是死引用，agent 照着读会读不到。
现在只说「标注图已作为本条消息的附件发送」/「带批注 PDF 已作为本条消息的附件发送」。

## Alternatives considered

- **保留图上文字，改成可选** —— 读者要的是「不太需要」，不是「能关掉」。留一个开关就得留
  整套文字牌排版、把手、PDF 文字绘制与内嵌字体，而这套代码的唯一用户是一个默认关闭的开关。
  删掉它换来 `render.ts` 与 `handles.ts` 的实质缩小。
- **把 `text` 改名 `detail`，两条都留** —— 两条文本的边界是这次问题的根源：读者不知道
  该在哪写什么，图上那块牌子还挡图。留两条就还得回答「谁显示哪条」。
- **单点用零长度的箭头/手绘实现** —— 数据上能省一个 `MarkKind`，但零长度箭头的头部方向
  无定义、命中区退化成一条线，且在 PDF 里会写成 `/Line` 而不是 `/Text`。真实的单点值得
  一个真实的 kind。
- **单点仍然附标注图** —— 一张只有几个小圆圈的图，对 agent 没有额外信息，却要多跑一次
  `exportPng` + 一次图片上传。读者明确说「只发原图索引就好」。
- **纯单点时消息里附上 `<name>.annot.json` 的路径让 agent 去读** —— 侧车投递后即删，那条
  路径在 agent 读到时已经不存在。信息必须在消息正文里自足。
- **发送成功不清空，等读者自己点「清空」** —— 读者反馈的就是「发送之后它还留着」。
  已交付的标注在面板上不是资产，是待办事项。
- **「清空」只清内存（原状）** —— 这正是「刷新又回来」的直接原因。清空必须同时删盘。
- **`discard` 里先删盘再写成功文案** —— 删盘失败会把一条已经成功的投递显示成失败，
  读者会重发一遍。顺序必须是「成功 → 清空 → 报告删除失败」。
- **让 `removeAnnotation` 吞掉所有删除错误** —— 一个删不掉的侧车在下次打开时复活，
  而读者刚刚看到「已清空」。宁可报一条 `clearError`，也不让界面撒谎。
- **`DELETE` 复用 GET 的 `removed` 语义（总是 200 且不区分）** —— 区分 `removed` 让读者
  与测试都能看出「本来就没有」和「删掉了」不是一回事，代价只是一个布尔字段。

## Consequences

- 每条标注只有一句「要改什么」，图上不再有任何文字遮挡。
- 新增「单点」工具：单击落点，可拖、可写说明；纯单点的消息不带标注图。
- 「清空」与「发送成功」都真正落盘删除，刷新不会复活批注；删除失败会明说。
- 消息里不再出现投递后即失效的路径。
- `src/host/guidance.ts` 的纪律文本按新语义重写：清单在正文里、`要改：` 后是唯一内容、
  纯单点没有附件。
- 覆盖面：新增 `removeAnnotation` / `deleteAnnotation` / `discard` / `needsReviewImage` 的
  测试；`src/**` 每文件四项仍是 100%（27 test files / 613 tests）。
