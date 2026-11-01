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
  '1. 逐条读消息正文的清单：每条形如 `① 箭头 (10,10) → (40,30)，批注：标号指错了`。括号里是图面像素坐标，原点在左上角；框选与圈选给的是**左上角-右下角**，手绘线给的是它画在哪个框里。`批注：` 之后是用户写的**详细说明**——那是这条标注唯一的内容，按它判断意图。有的条目在形状后面紧跟一个圆括号，写着该处落在哪个元素上（SVG 给元素标题/`id`/元素文字，HTML 给 `selector`/元素文字），定位时优先用它。',
  '1a. 若某条写的是**元素**而不是形状（`① 元素 …`），那条标注指的不是"在这里画个框"，而是**那一个元素本身**：圆括号里给的是选中时抽到的名字（元素标题 / 元素文字 / 选择器 / `<g id="patch_2">` 这样的开标签——最后一种里唯一能搜的就是那个 `id`），按它去源文件里找到那一个元素，改的就是它，不是它周围的一块区域。这类标注没有可挪动的形状，用户说的"这里"就是那个元素。',
  '2. **PDF 是整份文档一份标注**：每条标注都带 `第 N 页`，坐标是那一页自己的（原点在该页左上角）。看每条标注前先确认它的页码。',
  '3. 若标注超出原图边界，标注图会把越界的那圈纸也画出来，并用**灰色虚线**框住原图真正的边缘：虚线**里面**是原图，**外面**是你画的标注伸出去的部分——那块不属于图，不要把它当成新增的画布内容。有形状的标注（箭头/框选/椭圆/手绘）会附一张标注图（`<图名>.annotated.png`，PDF 则是一份**带批注的 PDF**，其批注是原生 PDF 注释对象：`/Ink` 手绘、`/Square` 框选、`/Circle` 圈选、`/Line` 箭头），可直接打开核对图面位置。**若消息说「本条标注只有位置点，没有标注图」，那就是全部内容：只有坐标加一句说明，直接按原图定位处理，不要去找不存在的附件。**',
  '4. 逐条处理标注：每条标注都要落到具体的图面改动，并在答复里逐条回应（编号与标注一致）。无法实现的标注要说明原因，不要静默跳过。',
  '5. 修改附图以**标注所指的生成源**为准（绘制脚本、SVG 源或 `generate_patent_figure` 的入参），不要直接涂改导出的位图；PDF 同理，改的是生成该 PDF 的源头，不是那份带批注的副本。未标注的部分保持不动。',
  '6. 改完图后重新渲染并核对：图面尺寸/坐标若变化，旧标注的坐标会失准，此时以 `anchor` 与标注文字为准复核一遍，再回报结果。',
  '7. 若消息以【HTML 标注】开头，那是**本机 loopback 服务页**：消息会给出页面地址。标注画在当时的真实页面视口里，`points` 只是当时的视口坐标，页面重排、滚动或更换视口后可能失准；回源定位以 `marks[].anchor.selector` 为主——每段是 `tag:nth-of-type(n)`，遇到 `#id` 就在那里截断，因此它要么以 `body > …` 开头，要么直接是 `#id > …`；`anchor.text` 是该元素当时的文字。SVG 的元素标注同理，只是那条路径以 `<svg>` 元素本身为根（`svg > g:nth-of-type(2) > …`），遇到 `#id` 同样在那里截断——所以它要么以 `svg > …` 开头，要么直接是 `#id > …`。',
  '8. 处理 HTML 标注时，改的是**服务这个页面的源**（模板、组件、样式、生成脚本或静态资源），不是浏览器里的渲染结果。live preview 保留了真实脚本、路由和资源加载，所以页面里的状态与视觉是该服务实际给出的；若页面依赖登录态、外部 API 或一个未启动的服务，先按消息里的地址核对运行条件再改源。',
].join('\n')
