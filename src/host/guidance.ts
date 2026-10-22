/**
 * The model-facing guidance this plugin contributes while it is mounted.
 *
 * The annotator delivers work to the agent as an ordinary user message, so the
 * agent needs to know what that message means and what a complete response to it
 * looks like. The text is a static prompt section: it names no plugin internals,
 * only the files the message points at.
 * @module dsh-figmark/host/guidance
 */

/** Section order used for the annotation guidance (just before deliverable references). */
export const GUIDANCE_ORDER = 8990

/** Stable section name, unique in the assembled prompt. */
export const GUIDANCE_NAME = 'dsh-figmark:annotations'

/** The guidance text appended to the system prompt. */
export const GUIDANCE = [
  '## 附图标注（dsh-figmark）',
  '',
  '用户可能在文档预览里直接标注（箭头/框选/椭圆/手绘/单点），发送给你的消息以【附图标注】开头，正文就是**逐条标注清单**，不需要再去读任何附加文件（标注文件是投递用的临时件，发出即删）。收到时按下列纪律处理：',
  '',
  '1. 逐条读消息正文的清单：每条形如 `① 箭头 (10,10) → (40,30)，要改：标号指错了`，括号里是图面像素坐标（原点在左上角），`要改：` 之后是用户写的**详细说明**——那是这条标注唯一的内容，按它判断意图。有的条目还带 `锚定:` 后缀，说明该处落在一个具体元素上（SVG 给 `title`/`id`/元素文字，HTML 给 `selector`/元素文字），定位时优先用它。',
  '2. **PDF 是整份文档一份标注**：每条标注都带 `第 N 页`，坐标是那一页自己的（原点在该页左上角）。看每条标注前先确认它的页码。',
  '3. 有形状的标注（箭头/框选/椭圆/手绘）会附一张标注图（`<图名>.annotated.png`，PDF 则是一份**带批注的 PDF**，其批注是原生 PDF 注释对象：`/Ink` 手绘、`/Square` 框选、`/Circle` 圈选、`/Line` 箭头），可直接打开核对图面位置。**若消息说「本条标注只有位置点，没有标注图」，那就是全部内容：只有坐标加一句说明，直接按原图定位处理，不要去找不存在的附件。**',
  '4. 逐条处理标注：每条标注都要落到具体的图面改动，并在答复里逐条回应（编号与标注一致）。无法实现的标注要说明原因，不要静默跳过。',
  '5. 修改附图以**标注所指的生成源**为准（绘制脚本、SVG 源或 `generate_patent_figure` 的入参），不要直接涂改导出的位图；PDF 同理，改的是生成该 PDF 的源头，不是那份带批注的副本。未标注的部分保持不动。',
  '6. 改完图后重新渲染并核对：图面尺寸/坐标若变化，旧标注的坐标会失准，此时以 `anchor` 与标注文字为准复核一遍，再回报结果。',
  '7. 若消息以【HTML 标注】开头，那是**渲染出来的 HTML 文档**：标注画在固定 1024px 宽的渲染面上，`points` 是那个宽度下的渲染像素。这类标注**没有标注图**（浏览器无法把渲染好的文档栅格化成图片），所以定位只能靠 `marks[].anchor.selector`——那是一条**可直接粘贴使用**的精确路径：每段是 `tag:nth-of-type(n)`，遇到 `#id` 就在那里截断，因此它要么以 `body > …` 开头，要么直接是 `#id > …`；`anchor.text` 是该元素的文字，`points` 只作辅助（渲染宽度一变坐标就会漂）。',
  '8. 处理 HTML 标注时，改的是**生成这份 HTML 的源文件**（模板、生成脚本或 HTML 本体），不是预览里的渲染结果；渲染面按本插件内联的样式与脚本策略绘制，脚本不会执行、外部资源不会加载，所以别把"预览里看起来不对"当成文件本身的问题。',
].join('\n')

/** Section order used for the Markdown edit-proposal guidance (after the annotation one). */
export const EDIT_GUIDANCE_ORDER = 8991

/** Stable section name, unique in the assembled prompt. */
export const EDIT_GUIDANCE_NAME = 'dsh-figmark:markdown-edits'

/** The guidance text appended for messages that carry a Markdown difference. */
export const EDIT_GUIDANCE = [
  '## Markdown 修改建议（dsh-figmark）',
  '',
  '用户可能在文档预览里直接编辑 Markdown，保存后你会收到一条【文档修改建议】开头、正文是一段 unified diff 的用户消息（`--- a/<文件名>`、`+++ b/<文件名>`，`@@` 头给出两侧的起始行与行数）。收到时按下列纪律处理：',
  '',
  '1. 先读文件（消息里给出路径）。**用户没有把改动写进磁盘**：磁盘上的文件仍是旧版，`a` 侧是用户打开时的那一版，`b` 侧是用户改完的结果。',
  '2. 把 diff 应用到源文件：`-` 行删除、`+` 行写入、空格开头的是上下文（保持原样），逐处落地；不要重写整个文件，diff 之外的部分保持不动。',
  '3. 消息里若说「另有 N 处改动未在本消息里展开」，完整结果就是随消息发送的 `<文件名>.edited.md` 附件；以它为准。',
  '4. 消息里若带「我的说明：」清单，那是用户对某一行/某一处改动写的理由（形如 `1. 第 6 行（@@ -3,7 +3,7 @@）：…`）；落地时按它判断意图，说明里提到的行号是**基线（a 侧）**的行号。',
  '5. 消息里若说文件在编辑期间被改动过、或 diff 以整块替换呈现，先核对再落地；无法安全应用时说明原因，不要猜着改。',
  '6. 落地后逐处回应（顺序与 diff 一致），并说明哪些改动你没有采纳以及为什么。',
].join('\n')
