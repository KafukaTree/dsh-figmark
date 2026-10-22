# Note: 标注正文：触控板捏合缩放，以指针为不动点，且跟手

Status: implemented

## Problem

正文最初只有工具栏上四个按钮能缩放（`fitWidth` / `actual` / `zoomIn` / `zoomOut`），
触控板捏合会被浏览器当成**整页缩放**，侧栏里的面板连同周围 App UI 一起放大，而读者要放大的
只是那张图。

第一版补丁把捏合接了过来，但走的是 `setZoom` → React 重渲染 → `useLayoutEffect` 写滚动的路，
每一下手势都要等一次提交与布局。读者反馈「不是很跟手，但原本的 dsh 图像预览什么的都有这个
功能了，很跟手的」——DSH 侧栏的图像预览就是同一套手势，两者的差别必须消掉。

## Decision

算术仍在 `src/client/zoom.ts`，接线在 `AnnotatorBody`，但走的是 **零 React 重渲染** 的路：

- **识别**：触控板捏合 = 带 `ctrlKey` 的 `wheel`。`stage` 上 `addEventListener('wheel', onWheel,
  { passive: false })`——React 合成事件在 root 上是 passive 的，拦不住浏览器默认行为。
  `ctrlKey` 为假的事件原样放行：那是双指滚动，本来就该平移滚动区。
- **比例**：`wheelZoomFactor(deltaY, deltaMode, pageHeight)` 跟随 DSH 内置 `ZoomViewport` 的
  语义——`unit` 按 deltaMode 取 1 / 16（行）/ 视口高（页），`delta` 先钳到 ±40，再
  `exp(-delta * 0.01)`。钳制是关键：捏合是一串细粒度像素 delta，而线/页模式的单次 delta 可能
  很大，不钳会一下跳到底。
- **不动点是指针**：`anchoredScroll(viewport, pointer, before, after, figure)` 先按缩放前比例反解
  指针下的图元坐标，再按新比例算「让这个点回到同一 client 坐标，滚动区该在哪」。水平方向减掉
  `.da-surface{margin:12px auto}` 的 auto margin（`surfaceOffset`），垂直方向是固定
  `SURFACE_MARGIN`。
- **同帧写、不设 state**：`zoomAt` 直接同步写 `surface.style.width/height`、
  `figureHost.style.transform = scale(...)`、`stage.scrollLeft/scrollTop`，再用
  `setTimeout(..., PINCH_SETTLE_DELAY_MS = 120)` 才 `setZoom(reached)`。手势中面板一直画在
  同一个 React 树里，只是尺寸变了；React 那一层只在手指停下后才追上。`liveScale` ref 是手势
  期间的当前比例真值，wheel handler 用它连乘，不依赖可能落后的 state。
- **边界**：`clampZoom` 同时给按钮和手势用；`reached === before` 时直接返回（不记偏移、不排
  settle），所以捏到上下限之后继续捏，图与滚动区都不动。
- **卸载**：清掉 settle 定时器，避免面板关掉之后还 setState。

## Alternatives considered

- **`setZoom` + `useLayoutEffect` 写滚动（第一版）** —— 能放大、指针不跑，但每一下手势都要等
  一次 React 提交与布局，实测跟手感明显落后于 DSH 自带的预览。读者点名对比的就是它。
  「同步改 DOM + 延后提交 state」是同一份算术的两种接线，后者在手势期间完全不碰 React。
- **用 CSS `transform: scale()` 缩放而非改 `width`** —— `transform` 不触发布局，看起来更省，
  但命中测试、几何读取、以及 `Canvas` 的 `toFigure` 都把「surface 的 CSS 宽度」当换算基准；
  `transform` 会让 `getBoundingClientRect` 与 `offsetWidth` 分叉，标注坐标会算错。所以宽度仍改
  `width`，只有内层 figure 的视觉缩放用 `transform`（两者同步写）。
- **监听 React 的 `onWheel`** —— React 18 把 root 上的 wheel 委托为 passive 监听，
  `preventDefault()` 无效，浏览器整页缩放照样发生。
- **拦下所有 wheel（含无 ctrl 的）** —— 双指滚动的语义就是滚动，抢过来做缩放会让读者没法平移；
  macOS 上两者都可能出现，`ctrlKey` 是浏览器给出的唯一可靠信号。
- **一直不提交 state（纯 DOM 缩放）** —— 工具栏的 `aria-pressed`、`actual` 百分比、以及切换
  `fitWidth` 时的重算都读 React 的 `zoom`，不同步就会显示错的当前比例。120ms 静默后提交，
  既是读者收手的时间，也是工具栏值得更新的时间点。
- **用 `requestAnimationFrame` 节流 wheel** —— 会把手势的每一帧都推到下一帧才画，反而增加延迟；
  wheel 事件本身已在帧边界附近到达，同步写 DOM 才是最短路径。

## Consequences

- 触控板捏合放大/缩小图，指针下的内容不跑，跟手感与 DSH 自带预览一致。
- 双指滚动仍平移；工具栏四个按钮行为不变，缩放不再影响整个 App 页面。
- 手指停下 120ms 后工具栏追上当前比例（`fitWidth` 的 `aria-pressed` 变 false）。
- 覆盖：`tests/zoom.spec.ts` 覆盖算术（deltaMode 三种模式、±40 钳制、边界、负偏移钳零、指针
  原点平移），`tests/annotator-body.spec.tsx` 的 `zoom` 块覆盖接线（捏合改宽度、不动点保持、
  无 ctrl 放行、卸载后监听消失、上限处不动、settle 后工具栏更新）。
