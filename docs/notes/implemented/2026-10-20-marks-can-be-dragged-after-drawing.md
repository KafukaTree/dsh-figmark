# Note: 标注正文：标注画完之后还能再拖

Status: implemented

## Problem

标注一旦落下就固定了。读者画错一个箭头、框选偏了两格，唯一的手段是删掉重画——`Canvas` 只有 `onAdd` / `onSelect` / `onRemove`，命中区上的 `onPointerDown` 只做 `props.onSelect(mark.id)`，`select` 工具自己的 `start()` 里则是 `if (tool === 'select') return`（**只有选中，没有拖拽**）。画一条箭头指向「滑套 34」，发现箭头指到了旁边一格，就得删了重来，位置还得重新估。

## Decision

拖动由 `Canvas` 自己承接，落点由 `AnnotatorBody` 提交：

- **手势起点在捕获阶段记**：命中区会 `stopPropagation()`，冒泡阶段拿不到「按下在哪」。`onPointerDownCapture={capturePress}` 把按下的图元坐标记进 `pressedAt` ref，`beginMove` 再读它。
- **只有选择工具能拖**：`beginMove` 里 `if (tool !== 'select') return`。绘图工具下按到已有标注时仍然只**选中**它——这是命中区一直以来的行为，保留；但手势不升级成拖动，否则想画一条穿过已有标注的箭头就永远画不出来（一按下去就把旧标注拖走了）。
- **拖动中跟手**：`Press` 状态记 `origin`（按下时的几何）和 `moved`（拖动中的几何），`shownPoints(mark)` 在渲染时用 `moved` 替换。松开前图形一直跟着指针。
- **一次拖动只提交一次**：`finish()` 里才调 `onMove(press.id, dropped, anchorFor(...))`，不是在每次 `pointermove`。父组件的 `commit` 因此只记一个 undo 步——撤销一次就回到拖动前，而不是一格一格往回退。
- **落点重新锚定**：`anchorFor(event, last)` 对 SVG 图重新做命中测试，得到新的 `MarkAnchor`；没命中就传 `undefined`。
- **没动就不提交**：`mark-geometry.ts` 的 `draggedMarks(marks, id, points, anchor)` 在「标注不在列表里」或「落点几何与原来全等」时返回 `null`，`moveMark` 见到 `null` 直接返回、不记 undo。触控板的指针流在真正移动前会报几个与原坐标相同的 `pointermove`，这类事件不算编辑。
- **锚点不脱钩**：`withGeometry` 用 `const { anchor: _previous, ...rest } = mark` 先把旧锚点摘掉，再按新落点决定是否写回。老锚点描述的是「这条标注指的是图里哪个元素」，标注挪走了它就不再成立——所以落空时必须清掉，而不是留着。

## Alternatives considered

- **每次都 `onMove`，拖动中实时写回 marks** —— 撤销栈会被每一次 `pointermove` 塞一步（`commit` 的 `past` 上限 50 条），拖一条长箭头就把整个历史挤掉了，撤销一次只退一个像素。改成「拖完提交一次」是唯一对撤销语义正确的做法。
- **允许在绘图工具下也拖已有标注** —— 会与「画一条跨过已有标注的箭头」直接冲突：按下点落在老箭头的命中区上（命中区为了好点是加宽的），手势被判定成拖动，读者想要的笔画永远画不出来。
- **用 HTML5 drag / `draggable`** —— SVG 元素上不可靠，且与已有的 pointer 事件流重复；`setPointerCapture` 已经给了「指针离开标注也继续收到事件」这个必要条件。
- **只在命中区自己的 `pointermove` 里算位移** —— 指针一离开命中区（拖动必然离开）事件就断了，图形会卡在半路。所以用 `setPointerCapture`，后续事件仍回到按下时的元素。
- **拖动只对箭头开放** —— 框选、椭圆、手绘同样有位置错的问题；一套手势对全部 kind 都成立，没有理由分叉。

## Consequences

- 选择工具下，按住任意已有标注拖动即可移动（箭头、框选、椭圆、手绘都行；带说明的标注也可以从它的文字底板拖）。
- 松手才提交：一次拖动 = 一个撤销步。撤销后标注回到拖动前的位置，锚点也一起回到原来的。
- 落点命中新元素时锚点更新；落空时锚点被清掉，标注不再声称指向某个元素。
- 绘图工具下的行为完全不变：按到已有标注只选中它，笔画仍然画得出来。
- 覆盖：`tests/canvas.spec.tsx` 的 `moving a mark` 块（一次提交、拖动中跟手、按下即选中、未移动不提交、绘图工具下不拖、落点重锚、从文字底板拖、捕获指针），`tests/mark-geometry.spec.ts` 覆盖 `samePoints` / `shiftPoints` / `withGeometry` / `draggedMarks`。
