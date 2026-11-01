# Note: 移除 Markdown 编辑与差异投递

Status: implemented

## Problem

插件的文档能力是围绕图像面建立的：图片、SVG、PDF 与 HTML/live page 共享标注几何、元素锚点、侧车或会话投递。Markdown 没有这个面，却另外拥有一套预览 renderer、文本编辑器、行级 diff、文件上传兜底、专用文案和 system prompt guidance。它不服务图像标注模型，还扩大了客户端入口、测试面与维护边界。

## Decision

完全移除 Markdown 的编辑与投递能力：不再注册 `md`/`markdown` renderer 或正文，不再携带 `text-diff`、编辑消息、上传附件与第二段 system prompt，也不再保留相关文案和样式。Markdown 文件回到宿主内置预览器。

图片、SVG、PDF、静态 HTML 与 loopback live page 的注册、标注、元素选取、侧车写入、页图附件和发送链路保持不变。

## Alternatives considered

- **保留 renderer，但默认不注册** - 已删代码仍会进入构建与测试边界，且用户可以手动切到它，不能消除维护成本。
- **只保留只读 Markdown 预览** - 宿主已有更合适的 Markdown 预览；插件再实现一份不会增加标注能力。
- **把 Markdown 当普通文本或图片标注** - 文本坐标会随排版变化，且它不在插件承诺的图像/SVG/HTML/PDF 范围内。
- **继续维护编辑与 diff 链路** - 需要长期维护独立编辑器、上传兜底、提示词和大量测试，却与插件的图像标注目标无关。

## Consequences

Markdown 不再出现 Figmark renderer、编辑按钮、diff 视图或 `【文档修改建议】` 消息，也不会产生 `.edited.md` 附件；打开 Markdown 时使用宿主内置预览。主包、宿主提示词与测试面因此缩小，图片、SVG、HTML、PDF 和 live page 的行为不变。
