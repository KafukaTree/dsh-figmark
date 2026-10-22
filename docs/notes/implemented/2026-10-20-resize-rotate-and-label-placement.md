# Note: 框选与文字标签的交互，以及可以改大小、转角度的控制框

Status: implemented

## Problem

两件事一起被提出来（用户在原话里连着说）：

1. **框选和文字的交互没做好**：`rect` / `ellipse` 的说明牌被钉在 `points[0]`，也就是框的左上角内侧——牌正好压在被框住的那块图上，牌上的字和框里的内容叠在一起，两边都看不清。文字标注更是把说明直接画在点击点上，盖住它要指的东西。
2. **框选、圈选、箭头太固定**：它们能整体拖动（上一版刚做的），但大小和方向都不能改。框选大了一圈只能删掉重画，箭头指歪几度也只能重画，而重画要重新估坐标。

## Decision

**说明牌从图形里挪出来。** `src/client/render.ts` 新增 `markLabelBox(mark)`：

- 描边类（arrow / rect / ellipse / pen）的牌放在图形上方 `box.y - LABEL_GAP - LABEL_CLEARANCE`（`LABEL_GAP = 5`，`LABEL_CLEARANCE = ROTATE_ARM + HANDLE_SIZE = 29`），左边缘与图形左边缘对齐。牌的高度是向上长的（基线下沿），所以这个间距量到基线。
- `LABEL_CLEARANCE` 是**为控制框留的**：选中标注时，顶边那排缩放手柄和往上 22 像素的旋转把手、以及连它们的线，都是画在说明牌**之后**的。牌只抬 5 像素就会被手柄压住——这是渲染完截图才发现的。留常量而不是「选中时多抬 29 像素」，是为了选中/取消选中时牌不跳，也让读者拖出来的 `labelOffset` 含义一致。
- `text` 类**就是它自己那块牌**，所以留在点击点上，只受 `labelOffset` 平移。
- `mark.labelOffset?: FigurePoint` 是读者拖出来的位移，叠加在默认位置上。图形本身挪动时牌跟着挪（位移是相对的），但图形被 resize 时牌不重新计算——读者把它放哪儿就是哪儿。
- 牌加了 `fillOpacity={0.92}` 的白底和同色描边（`labelPlate`），压在刻度线、网格线上时仍然读得出来。多行文本用 `<tspan>` 逐行画。

**控制框：8 个 resize 把手 + 1 个 rotate 把手。** 新文件 `src/client/handles.ts`：

- `handlesFor(box, rotation)` 在标注自己的直立坐标系里算出 8 个盒把手（四角 + 四边中点）和一个 `rotate` 把手（顶边中点再往上 `ROTATE_ARM = 22`），然后用 `rotateAround` 把它们整体绕中心转到标注当前的角度上，所以把手落在叠加层画出来的轮廓线上。
- `handleAt(box, rotation, at, reach)` 按距离找最近的把手，`reach` 缺省 `HANDLE_SIZE`（7）。命中优先级是「更近的赢」，不按角/边排序。
- `resizeBy({handle, at, origin, rotation})` 在标注自己的坐标系里做**轴对齐** resize：被抓住的那条边跟手，对边不动，`MIN_MARK_SIZE = 6` 防止边长塌成零。收尾用 `keepAnchored(points, rotation, anchor, wasCentre)` 把几何平移回去，保证对角的那个点在屏幕上的位置一格都没动——旋转过的标注 resize 时中心会漂，不补偿的话对角会跟着跑。
- `scalesRatherThanResizes(kind)` 只对 `text` 返回 true：文字标注没有「盒子」，抓角是**放大字号**（`mark.scale`，范围 0.4–6，`scaledBy` 角把手两轴各算一半），抓边无效。
- `rotationTo(centre, at, snap)` 从中心到指针算角度，`atan2` 后加 90°（把手静止在正上方），Shift 吸附到 15° 整倍。
- `label` 把手：描边类只移动说明牌（写 `labelOffset`），`text` 类等价于拖动标注本身（牌就是标注）。

`src/client/Canvas.tsx` 的 `Press` 从「只记 origin」扩成记 `originRotation` / `originScale` / `originOffset` 和 `handle`，`editFor(held, point, dx, dy)` 按把手分派到 `resizeBy` / `rotationTo` / `scaledBy` / `nudgedOffset`，`patchFrom(edit)` 只把真正产生变化的字段交给父组件。**一次手势 = 一个 undo 步**（`updateMark` 走 `commit`）。

**三个新字段落在 `AnnotationMark` 上**：`rotation?: number`（度，绕自身中心顺时针）、`scale?: number`（文字倍数）、`labelOffset?: FigurePoint`。它们必须在 `src/host/store.ts` 的 `readMark` 里显式搬运——这个函数是按字段白名单重建对象的，不认识的字段会被静默丢弃，那就会「存盘后标注自己变回去了」。

**左/右两个说明字段各归其位。** `text` 收窄为「画在图上的短标签」，新 `detail?: string` 是「这个元素要改什么」，每个元素独立。底部现在是：`.da-figure-note` 一个 `summary`（整图背景，不画在图上，只给模型当上下文）+ `.da-note` 两个字段（`text` / `detail`，未选中时 disabled）。`src/shared/annotation.ts` 的 `describeMark` 输出改成 `① 框选 (x,y)-(x,y)（id=…，元素文字「…」），图上文字「…」，要改：…`，有旋转时在形状后追加 `（旋转 N°）`。

**双击进编辑。** `Canvas` 新增必填 prop `onEdit(id)`，两处 `onDoubleClick` 从 `onRemove` 改成 `onEdit`；`AnnotatorBody.editMark` 做三件事：`chooseMode('annotate')`、`setSelectedId(id)`、`setFocusId(id)`，再由一个 `useEffect` 在 detail 框挂载后 `focus()` + 光标移到文末。

## Alternatives considered

- **说明牌只抬 `LABEL_GAP`（5 像素），选中时另外处理** —— 试过，选中标注后顶边手柄与旋转把手正好压在牌上（渲染截图可见）。改成「选中/未选中两个位置」会让牌在点选时跳一下，且 `labelOffset` 相对谁说不清。留一个固定常量最省事也最稳。
- **把说明牌改成画在控制框之后（z 序压住手柄）** —— 手柄就点不到了；而且牌是白底，压上去会把手柄切掉一半。
- **说明牌留在框内，只把文字调小 / 加白底** —— 用户说的就是「和文字的交互没做好」，问题不是读不清而是**遮住了要指的东西**。加白底反而把要看的像素盖得更严实。挪到框外是唯一真的解决遮挡的做法。
- **说明牌做成 HTML 浮层（absolute div）而不是 SVG `<text>`** —— 牌要在导出（`composeReviewSvg`）和 PDF（`annotate.ts`）里同样出现，HTML 浮层进不了 SVG。而且叠加层的 pointer 事件已经是 SVG 在管，多一套 HTML 元素就要多一处分层与命中逻辑。
- **把手放在标注的中心/单点，用「拖远就近就放大」** —— 没有明确的可抓目标，读者不知道能抓哪儿，也无从判断「往哪个方向拖是放大」。8 个把手是图形编辑器的共识语言。
- **旋转后按屏幕轴做 resize（不是标注自己的轴）** —— 旋转 45° 的框从屏幕上往下拖，会得到歪的平行四边形，但标注的 `points` 只能表示轴对齐的框。所以 resize 一定在标注自己的坐标系里做，再把整体转回去。
- **`keepAnchored` 用「对角的点不动」的近似公式** —— 旋转态下中心位移与对角位移不成比例，近似会在拖远时累积误差。改成「先算新几何，再把中心位移补偿掉」是精确解。
- **文字标注也允许 resize 成一块框** —— 文字没有面积语义，拉出来的框没有东西可以填。字号才是文字的大小，所以抓角改 `scale`。
- **把 `rotation` / `scale` / `labelOffset` 放进一个 `geometry` 子对象** —— 存盘的 schema 已经是一层扁平的 mark 字段，多一层只是让 `readMark` 多一层校验，没有收益。
- **双击继续当作删除** —— 双击删除是不可发现且危险的操作（读者想编辑时先删掉了标注）。删除已经有 Delete/Backspace 键、列表里的删除按钮，双击让位给「编辑这个」。
- **`setFocusId` 换成在 `editMark` 里直接 `requestAnimationFrame(() => detailRef.current?.focus())`** —— 时序不确定（jsdom 下 `requestAnimationFrame` 根本不跑），且 focus 发生在哪一帧取决于渲染。`useEffect` 在提交后同步跑，是可测的确定行为。

## Consequences

- 框选/圈选的说明牌挪到框上方，不再压住被框的内容；说明牌可单独拖动摆放。
- 选中任意标注后出现 9 个把手：四角缩放、四边单向缩放、顶部圆点旋转（Shift 吸附 15°）。文字标注抓角是放大字号。
- 一次拖动/缩放/旋转 = 一个撤销步。
- 双击标注（图上或文字牌上）进入标注模式并把光标放进该标注的详细说明。
- `rotation` / `scale` / `labelOffset` 随文档存盘并在 PDF 注记里生效（`annotate.ts` 用同一份 `mark`）。
- 选中标注时说明牌与顶部手柄、旋转把手互不遮挡（`tests/render-export.spec.ts` 的 `lifts the note clear of the control frame drawn around a selected mark` 用 `handlesFor` 的真实坐标钉住）。
- 覆盖：`tests/handles.spec.ts`（把手位置/旋转/label 把手/resize 钳制/Shift 吸附/光标）、`tests/mark-geometry.spec.ts`（包围盒、旋转包围盒、`keepAnchored`）、`tests/render-export.spec.ts` 的 `mark placement` 块、`tests/canvas.spec.tsx` 的 `the control frame around a selected mark` 块、`tests/annotator-body.spec.tsx` 的 resize/rotate 撤销与双击编辑。
