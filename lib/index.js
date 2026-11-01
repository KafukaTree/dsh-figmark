import { createRequire } from "node:module";
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { basename, dirname, extname, isAbsolute, join, resolve } from "node:path";
import { createServer, request } from "node:http";
import { connect } from "node:net";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
//#region src/host/guidance.ts
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
const GUIDANCE_ORDER = 8990;
/** Stable section name, unique in the assembled prompt. */
const GUIDANCE_NAME = "dsh-figmark:annotations";
/** The guidance text appended to the system prompt. */
const GUIDANCE = [
	"## 附图标注（dsh-figmark）",
	"",
	"用户可能在文档预览里直接标注（箭头/框选/椭圆/手绘/单点），发送给你的消息以【附图标注】开头，正文就是**逐条标注清单**，不需要再去读任何附加文件（标注文件是投递用的临时件，发出即删）。收到时按下列纪律处理：",
	"",
	"1. 逐条读消息正文的清单：每条形如 `① 箭头 (10,10) → (40,30)，批注：标号指错了`。括号里是图面像素坐标，原点在左上角；框选与圈选给的是**左上角-右下角**，手绘线给的是它画在哪个框里。`批注：` 之后是用户写的**详细说明**——那是这条标注唯一的内容，按它判断意图。有的条目在形状后面紧跟一个圆括号，写着该处落在哪个元素上（SVG 给元素标题/`id`/元素文字，HTML 给 `selector`/元素文字），定位时优先用它。",
	"1a. 若某条写的是**元素**而不是形状（`① 元素 …`），那条标注指的不是\"在这里画个框\"，而是**那一个元素本身**：圆括号里给的是选中时抽到的名字（元素标题 / 元素文字 / 选择器 / `<g id=\"patch_2\">` 这样的开标签——最后一种里唯一能搜的就是那个 `id`），按它去源文件里找到那一个元素，改的就是它，不是它周围的一块区域。这类标注没有可挪动的形状，用户说的\"这里\"就是那个元素。",
	"2. **PDF 是整份文档一份标注**：每条标注都带 `第 N 页`，坐标是那一页自己的（原点在该页左上角）。看每条标注前先确认它的页码。",
	"3. 若标注超出原图边界，标注图会把越界的那圈纸也画出来，并用**灰色虚线**框住原图真正的边缘：虚线**里面**是原图，**外面**是你画的标注伸出去的部分——那块不属于图，不要把它当成新增的画布内容。有形状的标注（箭头/框选/椭圆/手绘）会附一张标注图（`<图名>.annotated.png`，PDF 则是一份**带批注的 PDF**，其批注是原生 PDF 注释对象：`/Ink` 手绘、`/Square` 框选、`/Circle` 圈选、`/Line` 箭头），可直接打开核对图面位置。**若消息说「本条标注只有位置点，没有标注图」，那就是全部内容：只有坐标加一句说明，直接按原图定位处理，不要去找不存在的附件。**",
	"4. 逐条处理标注：每条标注都要落到具体的图面改动，并在答复里逐条回应（编号与标注一致）。无法实现的标注要说明原因，不要静默跳过。",
	"5. 修改附图以**标注所指的生成源**为准（绘制脚本、SVG 源或 `generate_patent_figure` 的入参），不要直接涂改导出的位图；PDF 同理，改的是生成该 PDF 的源头，不是那份带批注的副本。未标注的部分保持不动。",
	"6. 改完图后重新渲染并核对：图面尺寸/坐标若变化，旧标注的坐标会失准，此时以 `anchor` 与标注文字为准复核一遍，再回报结果。",
	"7. 若消息以【HTML 标注】开头，那是**本机 loopback 服务页**：消息会给出页面地址。标注画在当时的真实页面视口里，`points` 只是当时的视口坐标，页面重排、滚动或更换视口后可能失准；回源定位以 `marks[].anchor.selector` 为主——每段是 `tag:nth-of-type(n)`，遇到 `#id` 就在那里截断，因此它要么以 `body > …` 开头，要么直接是 `#id > …`；`anchor.text` 是该元素当时的文字。SVG 的元素标注同理，只是那条路径以 `<svg>` 元素本身为根（`svg > g:nth-of-type(2) > …`），遇到 `#id` 同样在那里截断——所以它要么以 `svg > …` 开头，要么直接是 `#id > …`。",
	"8. 处理 HTML 标注时，改的是**服务这个页面的源**（模板、组件、样式、生成脚本或静态资源），不是浏览器里的渲染结果。live preview 保留了真实脚本、路由和资源加载，所以页面里的状态与视觉是该服务实际给出的；若页面依赖登录态、外部 API 或一个未启动的服务，先按消息里的地址核对运行条件再改源。"
].join("\n");
/** Route prefix owned by this plugin. */
const ROUTE_PREFIX = "/dsh-figmark";
//#endregion
//#region src/shared/live.ts
/**
* The wire between a rendered page and the panel.
*
* A page in the frame is not a document the panel holds: even when the file is on
* the reader's disk, the frame's own scripts have to run — a deck that animates, a
* video that plays, a link that means something — and a frame allowed to run scripts
* must not share the panel's origin. So the frame is opaque to the parent, and the
* only way across is a small script injected into it and `postMessage` back.
*
* This module is that vocabulary, and it is also the fence around it: everything it
* accepts is parsed field by field, because the other side is a page and a page can
* lie. A lie must stay a name — never a coordinate the reader never pointed at.
* @module dsh-figmark/shared/live
*/
/** Route the panel opens a live page through, under the plugin prefix. */
const LIVE_ROUTE = "/live";
/**
* Largest PNG data URL a live page may send back.
*
* The message is held by both browsing contexts while it crosses the frame
* boundary. Failing below the parser's hard ceiling leaves room for the rest of
* the object instead of sending an answer the receiving side would discard.
*/
const MAX_LIVE_CAPTURE_DATA_URL = 155e5;
//#endregion
//#region src/shared/services.ts
/**
* The small vocabulary shared by the service browser and the Host scan.
* @module dsh-figmark/shared/services
*/
/** Route that probes loopback services for the browser. */
const SERVICE_DISCOVER_ROUTE = "/services";
//#endregion
//#region src/shared/address.ts
/** Documented prefix of every file address. */
const PREFIX = "dsh-resource://file/";
/**
* Decode one address segment, leaving malformed escapes as their literal text.
* @param segment - raw percent-encoded segment.
* @returns the decoded segment.
*/
function decodeSegment(segment) {
	try {
		return decodeURIComponent(segment);
	} catch {
		return segment;
	}
}
/**
* Parse a `dsh-resource://file/…` address.
* @param address - the address string taken from a preview tab.
* @returns the parsed address, or undefined when the string is not a file address.
*/
function parseFileAddress(address) {
	if (!address.startsWith(PREFIX)) return void 0;
	const rest = address.slice(20);
	if (rest.startsWith("session/")) {
		const afterScope = rest.slice(8);
		const slash = afterScope.indexOf("/");
		if (slash <= 0) return void 0;
		return {
			sessionId: decodeSegment(afterScope.slice(0, slash)),
			path: decodeSegment(afterScope.slice(slash + 1))
		};
	}
	if (rest.startsWith("absolute/")) return { path: decodeSegment(rest.slice(9)) };
}
//#endregion
//#region src/shared/path-name.ts
/**
* The two path-name readings both halves need, in one place.
*
* A path arrives here from the Host (which uses platform separators) or from a
* browser document (which only ever writes `/`), so every splitter has to accept
* both. They used to be written out at each call site — once for the address
* grammar, once for the suffix table, once for a file name in a message — and the
* copies had already drifted apart on backslashes. One home makes them agree.
* @module dsh-figmark/shared/path-name
*/
/**
* The last segment of a path, whatever separators it uses.
* @param path - a POSIX- or Windows-separated path.
* @returns the path's file name.
*/
function baseNameOf(path) {
	return path.slice(Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\")) + 1);
}
/**
* Read a path's lower-case suffix without the dot.
* @param path - file path or name.
* @returns the suffix, or an empty string when the name has none.
*/
function suffixOf(path) {
	const name = baseNameOf(path);
	const dot = name.lastIndexOf(".");
	return dot <= 0 ? "" : name.slice(dot + 1).toLowerCase();
}
//#endregion
//#region src/shared/figure-kind.ts
/**
* Document suffixes, shared by the browser and Node halves.
* @module dsh-figmark/shared/figure-kind
*/
/**
* File suffixes this plugin treats as annotatable documents.
*
* A PDF is one document however many pages it has: the browser half renders one
* page at a time, each mark records the page it was drawn on, and saving writes
* the marks back into a copy of the document as native annotations.
*
* An HTML document is one surface: the browser half renders it at a fixed width
* and records marks in those layout pixels, and its marks file is the only
* artifact a save writes — a rendered document cannot be flattened into a
* picture the way a figure can.
*/
const FIGURE_EXTENSIONS = [
	"svg",
	"png",
	"jpg",
	"jpeg",
	"webp",
	"bmp",
	"gif",
	"ico",
	"pdf",
	"html",
	"htm"
];
/** Media type of a document that has pages rather than one surface. */
const PAGED_MEDIA_TYPE = "application/pdf";
/**
* Media type of one document path.
* @param path - file path.
* @returns the media type, or undefined for an unsupported suffix.
*/
function figureMediaType(path) {
	switch (suffixOf(path)) {
		case "pdf": return PAGED_MEDIA_TYPE;
		case "svg": return "image/svg+xml";
		case "png": return "image/png";
		case "jpg":
		case "jpeg": return "image/jpeg";
		case "webp": return "image/webp";
		case "bmp": return "image/bmp";
		case "gif": return "image/gif";
		case "ico": return "image/x-icon";
		case "html":
		case "htm": return "text/html";
		default: return;
	}
}
/**
* Whether a path names a document this plugin renders.
* @param path - file path.
* @returns true when the suffix is one this plugin annotates.
*/
function isFigurePath(path) {
	return FIGURE_EXTENSIONS.includes(suffixOf(path));
}
/**
* Whether a figure's suffix calls for the paged-document treatment.
*
* One predicate for the whole plugin: the Host picks the review artifact's file
* extension from it, the store refuses a review whose kind contradicts it, and the
* browser half picks which JSON field carries the artifact from it. Reading the
* media type instead would work today and break the day a second suffix maps to
* `application/pdf`.
* @param path - file path.
* @returns true when the figure is a paged document.
*/
function isPagedFigurePath(path) {
	return figureMediaType(path) === PAGED_MEDIA_TYPE;
}
//#endregion
//#region src/host/figure-target.ts
/**
* Resolving one preview address to a figure that actually exists.
*
* This is the only place a request-supplied string becomes a filesystem path, so
* it is where the plugin's write surface is defined: the address must parse as a
* file address, must resolve to a suffix this plugin renders, and must name an
* existing regular file. Anything else is refused with a message the browser can
* put in front of the reader — and nothing downstream ever accepts a path from the
* caller again, only the {@link FigureTarget} this module produced.
* @module dsh-figmark/host/figure-target
*/
/**
* Resolve one request address to an existing figure file.
* @param address - `dsh-resource://file/…` address from the preview tab.
* @param sessionCwd - Session lookup used for a relative path.
* @returns the target, or an error message describing why it cannot be annotated.
*/
async function resolveTarget(address, sessionCwd) {
	const parsed = parseFileAddress(address);
	if (parsed === void 0) return {
		ok: false,
		message: `not a file address: ${address}`
	};
	const sessionId = parsed.sessionId;
	const cwd = sessionId === void 0 ? void 0 : await sessionCwd(sessionId);
	let absolute;
	if (isAbsolute(parsed.path)) absolute = parsed.path;
	else {
		if (cwd === void 0) return {
			ok: false,
			message: `cannot resolve this Session's directory for a relative path: ${address}`
		};
		absolute = resolve(cwd, parsed.path);
	}
	if (!isFigurePath(absolute)) return {
		ok: false,
		message: `not an annotatable figure: ${absolute}`
	};
	const mediaType = figureMediaType(absolute);
	/* v8 ignore next -- isFigurePath already restricted the suffixes figureMediaType covers. */
	if (mediaType === void 0) return {
		ok: false,
		message: `no media type for ${absolute}`
	};
	try {
		if ((await stat(absolute)).isFile()) return {
			ok: true,
			target: {
				address,
				path: absolute,
				mediaType,
				workspace: cwd ?? null
			}
		};
	} catch {}
	return {
		ok: false,
		message: `no such figure: ${absolute}`
	};
}
/** The tag injected into every interactive HTML page. */
const PICKER_TAG = `<script src="/__dsh_figmark_picker.js"><\/script>`;
/** Largest HTML document either server will buffer in order to inject the picker. */
const MAX_HTML_BYTES = 8 * 1024 * 1024;
/**
* A page-level policy that would reject the picker script.
*
* The proxy already removes the same policy when it arrives as a response header.
* HTML can carry the policy in a meta tag as well, and a document-level
* `script-src 'none'` would otherwise leave a working page with a dead picker.
*/
const CSP_META = /<meta\b(?=[^>]*\bhttp-equiv\s*=\s*(?:"\s*content-security-policy(?:-report-only)?\s*"|'\s*content-security-policy(?:-report-only)?\s*'|content-security-policy(?:-report-only)?))[^>]*>/giu;
/**
* Remove document-level CSP declarations before the picker is injected.
* @param html - the page as the source sent it.
* @returns the page without CSP meta tags.
*/
function stripCspMeta(html) {
	return html.replace(CSP_META, "");
}
/**
* Put the picker tag in front of a page's last `</body>`.
* @param html - the page as the source sent it.
* @param tag - the tag to inject.
* @returns the page the frame receives.
*/
function injectPicker(html, tag = PICKER_TAG) {
	const close = html.toLowerCase().lastIndexOf("</body>");
	return close < 0 ? `${html}${tag}` : `${html.slice(0, close)}${tag}${html.slice(close)}`;
}
/**
* The picker, as the page receives it.
*
* On load it marks the document element with `data-dsh-figmark="live"`, so the page
* (and anyone looking at it) can tell it is being previewed, and it reports that it
* is ready along with the current scroll — the panel needs both before it can place
* a single mark. While annotation is armed the pointer is reported once per animation
* frame and a click names the element instead of following it; while it is not, this
* script listens and does nothing else.
*
* Reports go to `window.parent` with target origin `'*'`: the panel is on another
* origin by construction, and the message carries nothing a hostile page could not
* already see. The panel validates the shape on arrival — this side only promises to
* send it.
*
* `selector` is positional and nothing else: `tag:nth-of-type(n)` steps joined by
* `' > '`, rooted at `body` but without naming it, so `body` itself is `'body'`.
* A positional path survives a page whose ids are regenerated on every render, which
* is exactly what a live page's ids do — and it is the same grammar the file
* preview's own path builder writes, so a saved mark resolves against either.
*/
const PICKER_SCRIPT = `/*! modern-screenshot v4.7.0 | MIT */
${readFileSync(createRequire(import.meta.url).resolve("modern-screenshot/dist/index.js"), "utf8")}
;(function () {
  if (window.__dshFigmarkPicker) return
  window.__dshFigmarkPicker = true

  var MARKER = 'dsh-figmark:live'
  var doc = document
  var armed = false
  var pending = 0
  var latest = null
  var latestKey = ''
  var depth = 0
  var lastScroll = ''
  var watched = []
  var lastBounds = ''
  var boundsScheduled = 0
  var lastHover = ''
  var lastSurface
  var surfaceScheduled = 0
  var revealedStyles = []
  var revealSeq = 0

  // The common spellings presentation frameworks use for the one page in front.
  // This is deliberately a small convention rather than "the largest element":
  // marking an arbitrary large container as a page would hide valid annotations.
  var SURFACE_QUERY = [
    '[data-slide-current="true"]',
    '[data-slide-active="true"]',
    '.slide',
    '.dk-slide',
    '.page.current',
    '.page.active',
    '.page.is-live',
    '.page.live',
    '.swiper-slide',
    '.carousel-item',
    '.reveal .slides section',
    '.remark-slide',
    '.remark-visible',
    '.step.active',
    '[role="tabpanel"]',
    '[data-slide]'
  ].join(',')

  doc.documentElement.setAttribute('data-dsh-figmark', 'live')
  var cursorStyle = doc.createElement('style')
  cursorStyle.setAttribute('data-dsh-figmark-style', '')
  cursorStyle.textContent = 'html[data-dsh-figmark-armed="true"] *{cursor:crosshair!important}'
  ;(doc.head || doc.documentElement).appendChild(cursorStyle)

  function pathOf(el) {
    if (el === doc.body) return 'body'
    var steps = []
    for (var node = el; node && node !== doc.body; node = node.parentElement) {
      var index = 1
      for (var sib = node.previousElementSibling; sib; sib = sib.previousElementSibling) {
        if (sib.tagName === node.tagName) index += 1
      }
      steps.unshift(node.tagName.toLowerCase() + ':nth-of-type(' + index + ')')
    }
    return steps.join(' > ')
  }

  function ladderOf(el) {
    var answer = []
    for (var node = el; node && node !== doc.documentElement; node = node.parentElement) {
      answer.push(node)
    }
    return answer
  }

  function keyOf(ladder) {
    var parts = []
    for (var i = 0; i < ladder.length; i += 1) parts.push(pathOf(ladder[i]))
    return parts.join('|')
  }

  function scrollOf() {
    return [window.scrollX || 0, window.scrollY || 0]
  }

  function send(message) {
    var parent = window.parent
    if (!parent) return
    try { parent.postMessage(message, '*') } catch (error) { return }
  }

  function report(kind, el, ladder, index) {
    var rect = el.getBoundingClientRect()
    var scroll = scrollOf()
    var selector = pathOf(el)
    var hoverKey = selector + '|' + scroll[0] + ',' + scroll[1] + '|'
      + rect.left + ',' + rect.top + ',' + rect.width + ',' + rect.height
    if (kind === 'hover') {
      if (hoverKey === lastHover) return
      lastHover = hoverKey
    }
    var message = {
      figmark: MARKER,
      kind: kind,
      tag: el.tagName.toLowerCase(),
      selector: selector,
      bbox: [rect.left + scroll[0], rect.top + scroll[1], rect.width, rect.height],
      scroll: scroll,
      level: index + 1,
      count: ladder.length
    }
    var text = (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 80)
    if (text) message.text = text
    if (el.id) message.id = el.id
    var cls = el.getAttribute('class')
    if (cls && cls.trim()) message['class'] = cls.trim()
    if (kind === 'pick') {
      var owner = surfaceOf(el)
      message.surface = owner ? pathOf(owner) : null
    }
    send(message)
  }

  function choose(ladder) {
    var key = keyOf(ladder)
    if (key !== latestKey) {
      latestKey = key
      depth = 0
    }
    depth = Math.max(0, Math.min(depth, ladder.length - 1))
    return depth
  }

  function under(event) {
    var el = event.target
    if (!el || el.nodeType !== 1) return null
    return el === doc.documentElement ? null : el
  }

  function rendered(el) {
    if (!el) return false
    var style = window.getComputedStyle(el)
    if (style.display === 'none'
      || style.visibility === 'hidden'
      || style.visibility === 'collapse'
      || style.contentVisibility === 'hidden'
      || parseFloat(style.opacity) <= 0) return false
    // A slide is often put away by an ancestor's opacity. The element's own computed
    // visibility stays "visible" there, so check the compositing chain as well.
    for (var node = el.parentElement; node; node = node.parentElement) {
      var parentStyle = window.getComputedStyle(node)
      if (parentStyle.display === 'none'
        || parentStyle.contentVisibility === 'hidden'
        || parseFloat(parentStyle.opacity) <= 0) return false
    }
    if (typeof el.checkVisibility === 'function') {
      try {
        return el.checkVisibility({
          checkOpacity: true,
          checkVisibilityCSS: true,
          opacityProperty: true,
          visibilityProperty: true,
          contentVisibilityAuto: true
        })
      } catch (error) {
        return true
      }
    }
    return true
  }

  function shown(el) {
    if (!rendered(el)) return false
    var rect = el.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return false
    var viewportWidth = window.innerWidth || doc.documentElement.clientWidth || 0
    var viewportHeight = window.innerHeight || doc.documentElement.clientHeight || 0
    if (rect.right <= 0 || rect.bottom <= 0 || rect.left >= viewportWidth || rect.top >= viewportHeight) {
      return false
    }
    return true
  }

  function inViewport(el) {
    var rect = el.getBoundingClientRect()
    var viewportWidth = window.innerWidth || doc.documentElement.clientWidth || 0
    var viewportHeight = window.innerHeight || doc.documentElement.clientHeight || 0
    return rect.left >= -1 && rect.top >= -1
      && rect.right <= viewportWidth + 1 && rect.bottom <= viewportHeight + 1
  }

  function boxInViewport(box) {
    var scroll = scrollOf()
    var viewportWidth = window.innerWidth || doc.documentElement.clientWidth || 0
    var viewportHeight = window.innerHeight || doc.documentElement.clientHeight || 0
    var x = typeof box[0] === 'number' ? box[0] : 0
    var y = typeof box[1] === 'number' ? box[1] : 0
    var width = typeof box[2] === 'number' ? box[2] : 0
    var height = typeof box[3] === 'number' ? box[3] : 0
    return x >= scroll[0] - 1 && y >= scroll[1] - 1
      && x + width <= scroll[0] + viewportWidth + 1
      && y + height <= scroll[1] + viewportHeight + 1
  }

  function measure(selector) {
    var el = null
    try { el = doc.querySelector(selector) } catch (error) { el = null }
    if (!el) return { selector: selector, bbox: [0, 0, 0, 0], visible: false }
    var rect = el.getBoundingClientRect()
    var scroll = scrollOf()
    return {
      selector: selector,
      bbox: [rect.left + scroll[0], rect.top + scroll[1], rect.width, rect.height],
      visible: shown(el)
    }
  }

  function delay(ms) {
    return new Promise(function (resolve) { window.setTimeout(resolve, ms) })
  }

  function waitForRendered(el, remaining) {
    if (rendered(el)) return Promise.resolve(true)
    if (remaining <= 0) return Promise.resolve(false)
    return delay(45).then(function () { return waitForRendered(el, remaining - 1) })
  }

  function restoreHidden() {
    for (var i = revealedStyles.length - 1; i >= 0; i -= 1) {
      var item = revealedStyles[i]
      if (item.value) item.el.style.setProperty(item.name, item.value, item.priority)
      else item.el.style.removeProperty(item.name)
    }
    revealedStyles = []
  }

  function overrideHidden(node, name, value) {
    revealedStyles.push({
      el: node,
      name: name,
      value: node.style.getPropertyValue(name),
      priority: node.style.getPropertyPriority(name)
    })
    node.style.setProperty(name, value, 'important')
  }

  function revealHidden(el, stop) {
    var outermost = null
    for (var node = el; node && node !== doc.body && node !== doc.documentElement && node !== stop; node = node.parentElement) {
      var style = window.getComputedStyle(node)
      if (style.display === 'none') overrideHidden(node, 'display', 'revert')
      if (style.visibility === 'hidden' || style.visibility === 'collapse') {
        overrideHidden(node, 'visibility', 'visible')
      }
      if (style.contentVisibility === 'hidden') overrideHidden(node, 'content-visibility', 'visible')
      if (parseFloat(style.opacity) <= 0) overrideHidden(node, 'opacity', '1')
      outermost = node
    }
    if (outermost && window.getComputedStyle(outermost).pointerEvents !== 'none') {
      overrideHidden(outermost, 'pointer-events', 'none')
    }
  }

  function surfaceOf(el) {
    for (var node = el; node && node !== doc.documentElement; node = node.parentElement) {
      try {
        if (node.matches(SURFACE_QUERY)) return node
      } catch (error) {
        return null
      }
    }
    return null
  }

  function nearestSurface() {
    var surfaces = []
    try { surfaces = Array.prototype.slice.call(doc.querySelectorAll(SURFACE_QUERY)) } catch (error) { return null }
    for (var i = 0; i < surfaces.length; i += 1) {
      var rect = surfaces[i].getBoundingClientRect()
      // A deck often clones every slide into its overview. Those copies keep the
      // same classes but have no layout, so they cannot be navigation targets.
      if (rect.width > 0 && rect.height > 0) return surfaces[i]
    }
    return null
  }

  function turnToward(target) {
    var surfaces = []
    try { surfaces = Array.prototype.slice.call(doc.querySelectorAll(SURFACE_QUERY)) } catch (error) { return Promise.resolve(false) }
    var wanted = surfaces.indexOf(target)
    var current = visibleSurface()
    var from = current ? surfaces.indexOf(current) : -1
    if (wanted < 0 || from < 0 || wanted === from) return Promise.resolve(shown(target))
    var key = wanted > from ? 'ArrowRight' : 'ArrowLeft'
    var steps = Math.min(32, Math.abs(wanted - from) + 2)
    function next(remaining) {
      if (remaining <= 0 || shown(target)) return Promise.resolve(shown(target))
      var node = doc.activeElement || doc.body || doc.documentElement
      var event = new KeyboardEvent('keydown', {
        key: key,
        code: key,
        keyCode: key === 'ArrowRight' ? 39 : 37,
        which: key === 'ArrowRight' ? 39 : 37,
        bubbles: true,
        cancelable: true
      })
      node.dispatchEvent(event)
      return delay(45).then(function () { return next(remaining - 1) })
    }
    return next(steps)
  }

  function reveal(requestId, selector, surface, bbox) {
    revealSeq += 1
    var seq = revealSeq
    restoreHidden()
    function current() {
      return seq === revealSeq
    }
    var requestedEl = null
    if (selector) {
      try { requestedEl = doc.querySelector(selector) } catch (error) { requestedEl = null }
    }
    var ownerSurface = null
    var surfaceEl = null
    if (requestedEl) {
      // The element is the strongest evidence of where it lives. A mark made
      // before page ownership was recorded may carry the slide that was open at
      // creation time instead, which would leave us waiting on the wrong page.
      ownerSurface = surfaceOf(requestedEl)
      surfaceEl = ownerSurface
    }
    if (!surfaceEl && requestedEl && !shown(requestedEl)) {
      surfaceEl = nearestSurface()
    }
    if (!surfaceEl && surface) {
      try { surfaceEl = doc.querySelector(surface) } catch (error) { surfaceEl = null }
      if (!surfaceEl) {
        send({ figmark: MARKER, kind: 'reveal-result', requestId: requestId, status: 'wrong-surface' })
        return
      }
    }
    var ready = shown(surfaceEl) ? Promise.resolve(true) : surfaceEl ? turnToward(surfaceEl) : Promise.resolve(true)
    ready.then(function (surfaceReady) {
      if (!current()) return
      if (!surfaceReady) {
        send({ figmark: MARKER, kind: 'reveal-result', requestId: requestId, status: 'wrong-surface' })
        return
      }
      if (selector) {
        var el = requestedEl
        if (!el) {
          send({ figmark: MARKER, kind: 'reveal-result', requestId: requestId, status: 'missing' })
          return
        }
        waitForRendered(el, 4).then(function (elementReady) {
          if (!current()) return false
          if (!elementReady) {
            // A cover, modal, or intro layer can sit outside every slide and stay
            // hidden after the deck has advanced. Restore only the hidden ancestors
            // below the owning surface; the source and the page's state are untouched.
            revealHidden(el, ownerSurface)
            return waitForRendered(el, 10)
          }
          return elementReady
        }).then(function (elementReady) {
          if (!current()) return
          if (!elementReady) {
            restoreHidden()
            send({ figmark: MARKER, kind: 'reveal-result', requestId: requestId, status: 'hidden' })
            return
          }
          // A fully visible element must not move. Centring used to shift decks and
          // fixed-stage pages under the reader even when the mark was already on
          // screen; nearest changes only what is actually clipped.
          if (window.getComputedStyle(el).position !== 'fixed' && !inViewport(el)) {
            try { el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' }) } catch (error) { el.scrollIntoView() }
          }
          delay(0).then(function () {
            if (!current()) return
            sendScroll()
            var visible = shown(el)
            var answer = {
              figmark: MARKER,
              kind: 'reveal-result',
              requestId: requestId,
              status: visible ? 'revealed' : 'hidden',
              surface: surfaceEl ? pathOf(surfaceEl) : null
            }
            if (visible && revealedStyles.length > 0) answer.temporary = true
            send(answer)
          })
        })
        return
      }
      var x = bbox && typeof bbox[0] === 'number' ? bbox[0] : 0
      var y = bbox && typeof bbox[1] === 'number' ? bbox[1] : 0
      if (!boxInViewport(bbox || [0, 0, 0, 0])) {
        window.scrollTo({
          left: Math.max(0, x - (window.innerWidth || 0) / 2),
          top: Math.max(0, y - (window.innerHeight || 0) / 2),
          behavior: 'auto'
        })
      }
      delay(0).then(function () {
        if (!current()) return
        sendScroll()
        var width = bbox && typeof bbox[2] === 'number' ? bbox[2] : 0
        var height = bbox && typeof bbox[3] === 'number' ? bbox[3] : 0
        var visible = width <= 0 || height <= 0
          || (x + width > window.scrollX && x < window.scrollX + (window.innerWidth || 0)
            && y + height > window.scrollY && y < window.scrollY + (window.innerHeight || 0))
        send({
          figmark: MARKER,
          kind: 'reveal-result',
          requestId: requestId,
          status: visible ? 'revealed' : 'hidden'
        })
      })
    })
  }

  function sendBounds(force) {
    boundsScheduled = 0
    if (watched.length === 0) return
    var bounds = []
    for (var i = 0; i < watched.length; i += 1) bounds.push(measure(watched[i]))
    var key = JSON.stringify(bounds)
    if (!force && key === lastBounds) return
    lastBounds = key
    send({ figmark: MARKER, kind: 'bounds', bounds: bounds })
  }

  function scheduleBounds() {
    if (watched.length === 0 || boundsScheduled) return
    // Do not store the request handle here: a test clock may run the callback before
    // requestAnimationFrame returns, which would assign a truthy handle after the
    // callback had already cleared the flag.
    boundsScheduled = 1
    window.requestAnimationFrame(function () { sendBounds(false) })
  }

  function sendScroll() {
    var scroll = scrollOf()
    var key = scroll[0] + ',' + scroll[1]
    if (key !== lastScroll) {
      lastScroll = key
      send({ figmark: MARKER, kind: 'scroll', scroll: scroll })
    }
    scheduleBounds()
    scheduleSurface()
  }

  function visibleSurface() {
    var candidates
    try { candidates = doc.querySelectorAll(SURFACE_QUERY) } catch (error) { return null }
    for (var i = 0; i < candidates.length; i += 1) {
      var el = candidates[i]
      if (shown(el)) return el
    }
    return null
  }

  function sendSurface(force) {
    surfaceScheduled = 0
    var el = visibleSurface()
    var selector = el ? pathOf(el) : null
    var key = selector === null ? '\\u0000none' : selector
    if (selector === null && lastSurface === undefined) return
    if (!force && key === lastSurface) return
    lastSurface = key
    send({ figmark: MARKER, kind: 'surface', selector: selector })
  }

  function scheduleSurface() {
    if (surfaceScheduled) return
    surfaceScheduled = 1
    window.requestAnimationFrame(function () { sendSurface(false) })
  }

  doc.addEventListener('pointermove', function (event) {
    if (!armed) return
    var el = under(event)
    if (!el) return
    var ladder = ladderOf(el)
    if (ladder.length === 0) return
    var index = choose(ladder)
    latest = { ladder: ladder, index: index }
    if (pending) return
    pending = 1
    window.requestAnimationFrame(function () {
      pending = 0
      if (!latest) return
      report('hover', latest.ladder[latest.index], latest.ladder, latest.index)
    })
  }, true)

  // The pointer going off the page takes the name with it: a label left behind over
  // an element the reader's pointer has already left is a label about nothing.
  doc.documentElement.addEventListener('pointerleave', function () {
    if (!armed) return
    latest = null
    lastHover = ''
    send({ figmark: MARKER, kind: 'leave' })
  })

  doc.addEventListener('click', function (event) {
    if (!armed) return
    var el = under(event)
    if (!el) return
    var ladder = ladderOf(el)
    if (ladder.length === 0) return
    var index = choose(ladder)
    event.preventDefault()
    event.stopImmediatePropagation()
    report('pick', ladder[index], ladder, index)
  }, true)

  // Arrow keys climb the same ladder the hover box is promising. Escape dismisses
  // the panel's current comment layer; both belong to the frame because that is
  // where the keyboard focus is once the reader points into the page.
  doc.addEventListener('keydown', function (event) {
    if (!armed) return
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopImmediatePropagation()
      latest = null
      lastHover = ''
      send({ figmark: MARKER, kind: 'cancel' })
      return
    }
    if (!latest) return
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()
      event.stopImmediatePropagation()
      depth = Math.max(0, Math.min(latest.ladder.length - 1, depth + (event.key === 'ArrowUp' ? 1 : -1)))
      latest.index = depth
      report('hover', latest.ladder[depth], latest.ladder, depth)
      return
    }
  }, true)

  window.addEventListener('scroll', sendScroll, true)
  window.addEventListener('resize', sendScroll)

  function capture(requestId) {
    var root = doc.documentElement
    var documentWidth = Math.max(1, Math.ceil(root.scrollWidth || root.clientWidth || window.innerWidth || 1))
    var documentHeight = Math.max(1, Math.ceil(root.scrollHeight || root.clientHeight || window.innerHeight || 1))
    var bounds = []
    for (var i = 0; i < watched.length; i += 1) bounds.push(measure(watched[i]))
    var surface = visibleSurface()
    // A deck keeps every slide in the same document. Cloning all of them to PNG is
    // both slow and wrong for a screenshot of the page in front: capture the surface
    // subtree when one exists and let the panel place it at its document offset.
    var rect = surface ? surface.getBoundingClientRect() : null
    var scroll = scrollOf()
    var width = rect ? Math.max(1, Math.ceil(rect.width)) : documentWidth
    var height = rect ? Math.max(1, Math.ceil(rect.height)) : documentHeight
    var imageRect = rect
      ? [rect.left + scroll[0], rect.top + scroll[1], width, height]
      : [0, 0, width, height]
    var target = surface || root
    // The parent composes at no more than 1.5x, so a larger source only costs a DOM
    // clone and PNG encode without adding pixels the delivered picture keeps.
    var scale = Math.min(1.5, 1800 / Math.max(width, height))
    var screenshot = window.modernScreenshot
    if (!screenshot || typeof screenshot.domToDataUrl !== 'function') {
      send({
        figmark: MARKER,
        kind: 'capture-result',
        requestId: requestId,
        status: 'failed',
        reason: 'the screenshot renderer is unavailable'
      })
      return
    }
    screenshot.domToDataUrl(target, {
      width: width,
      height: height,
      scale: scale,
      backgroundColor: '#ffffff',
      maximumCanvasSize: 4096,
      timeout: 12000,
      filter: function (node) {
        if (!node || node.nodeType !== 1) return true
        return !node.hasAttribute('data-dsh-figmark-style')
          && !node.hasAttribute('data-da-spot')
      }
    }).then(function (dataUrl) {
      if (typeof dataUrl !== 'string' || dataUrl.length > ${String(MAX_LIVE_CAPTURE_DATA_URL)}) {
        send({
          figmark: MARKER,
          kind: 'capture-result',
          requestId: requestId,
          status: 'failed',
          reason: 'the screenshot is too large'
        })
        return
      }
      send({
        figmark: MARKER,
        kind: 'capture-result',
        requestId: requestId,
        status: 'ok',
        dataUrl: dataUrl,
        document: [documentWidth, documentHeight],
        imageRect: imageRect,
        viewport: [window.innerWidth || width, window.innerHeight || height],
        scroll: scroll,
        scale: scale,
        surface: surface ? pathOf(surface) : null,
        bounds: bounds
      })
    }, function (error) {
      var reason = error && error.message ? String(error.message) : 'the page could not be captured'
      send({
        figmark: MARKER,
        kind: 'capture-result',
        requestId: requestId,
        status: 'failed',
        reason: reason.slice(0, 280)
      })
    })
  }

  window.addEventListener('message', function (event) {
    var data = event.data
    if (!data || typeof data !== 'object' || data.figmark !== MARKER) return
    if (data.kind === 'mode') {
      armed = !!data.armed
      doc.documentElement.setAttribute('data-dsh-figmark-armed', armed ? 'true' : 'false')
      if (!armed) {
        latest = null
        latestKey = ''
        depth = 0
        lastHover = ''
      }
      scheduleSurface()
      return
    }
    if (data.kind === 'depth' && armed && latest && (data.delta === 1 || data.delta === -1)) {
      event.preventDefault()
      event.stopImmediatePropagation()
      depth = Math.max(0, Math.min(latest.ladder.length - 1, latest.index + data.delta))
      latest.index = depth
      report('hover', latest.ladder[depth], latest.ladder, depth)
      return
    }
    if (data.kind === 'watch' && Array.isArray(data.selectors)) {
      watched = []
      for (var i = 0; i < data.selectors.length && watched.length < 256; i += 1) {
        var selector = data.selectors[i]
        if (typeof selector === 'string' && selector.length > 0 && selector.length <= 2048
          && watched.indexOf(selector) < 0) watched.push(selector)
      }
      lastBounds = ''
      sendBounds(true)
      return
    }
    if (data.kind === 'reveal' && typeof data.requestId === 'string' && data.requestId.length <= 128) {
      var requestedSelector = typeof data.selector === 'string'
        && data.selector.length > 0 && data.selector.length <= 2048 ? data.selector : null
      var requestedSurface = typeof data.surface === 'string'
        && data.surface.length > 0 && data.surface.length <= 2048 ? data.surface : null
      var requestedBox = Array.isArray(data.bbox) && data.bbox.length === 4 ? data.bbox : [0, 0, 0, 0]
      reveal(data.requestId, requestedSelector, requestedSurface, requestedBox)
      return
    }
    if (data.kind === 'capture' && typeof data.requestId === 'string'
      && data.requestId.length > 0 && data.requestId.length <= 128) {
      capture(data.requestId)
      return
    }
    if (data.kind === 'release-reveal') {
      revealSeq += 1
      restoreHidden()
    }
  })

  if (window.MutationObserver) {
    new window.MutationObserver(function () {
      scheduleBounds()
      scheduleSurface()
    }).observe(doc.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'aria-hidden', 'aria-current']
    })
  }
  window.addEventListener('hashchange', scheduleSurface)
  window.addEventListener('popstate', scheduleSurface)
  window.setInterval(function () {
    sendBounds(false)
    sendSurface(false)
  }, 250)

  send({ figmark: MARKER, kind: 'ready', scroll: scrollOf() })
  scheduleSurface()
})()
`;
//#endregion
//#region src/host/live-proxy.ts
/**
* A live page, served from this machine so the panel can frame it.
*
* The panel cannot simply point a frame at somebody's dev server. A frame is
* usually refused outright by the page's own `X-Frame-Options` or CSP, and even
* when it loads, a cross-origin frame is opaque: the panel can look at it and
* nothing more. Neither is acceptable — the reader has to point at elements in
* the page, which takes a script running inside it.
*
* So the page is fetched by the Host instead. The frame points at
* `http://127.0.0.1:<port>`, that origin is the proxy's, and the proxy is a
* pass-through with three edits: policies that would forbid framing or the
* injected script are dropped (headers and HTML meta tags alike), same-origin
* redirects are kept on the proxy origin, and the script tag is put in front of
* `</body>` in HTML. Everything else — methods, bodies, assets, the dev server's
* own websocket-free HMR client — crosses untouched, which is what keeps a
* script-driven page behaving like the page it is.
*
* Only this machine's own servers are reachable through it. A proxy that
* accepted any origin would be an open relay running inside the app, so a
* target has to be loopback by name *and* be plain `http:`: the plugin's route
* is not the place to invent TLS to a local server.
* @module dsh-figmark/host/live-proxy
*/
/** What the frame shows when the page stopped answering. */
const DOWN = "the page is not answering";
/** What the frame shows when a page is too big to rewrite. */
const TOO_BIG = `the page is larger than ${MAX_HTML_BYTES} bytes, so the picker was not injected`;
/**
* Headers the proxy always drops from an answer.
*
* The first two would forbid the injected script or the frame itself; the third
* is the pre-CSP way of saying the same thing. Nothing else is touched: the
* page's own policy on its assets is its business.
*/
const STRIPPED = [
	"content-security-policy",
	"content-security-policy-report-only",
	"x-frame-options"
];
/** The host names that mean this machine. */
const LOOPBACK = /* @__PURE__ */ new Set([
	"localhost",
	"127.0.0.1",
	"[::1]"
]);
/**
* Serve one page from this machine.
* @param url - the address the reader typed, e.g. `http://localhost:5173`.
* @returns the proxy, already listening.
* @throws {Error} when the address is not a loopback `http:` page.
*/
async function openLive(url) {
	if (url.protocol !== "http:") throw new Error(`only a server on this machine can be opened, and ${url.protocol} is not http`);
	if (!LOOPBACK.has(url.hostname)) throw new Error(`only a server on this machine can be opened, and ${url.hostname} is not one of its loopback names`);
	const target = new URL(url.href);
	const sockets = /* @__PURE__ */ new Set();
	let proxyOrigin = "";
	const server = createServer((req, res) => {
		serve(target, proxyOrigin, req, res);
	});
	server.on("upgrade", (req, socket, head) => {
		upgrade(target, req, socket, head, sockets);
	});
	server.on("connection", (socket) => {
		sockets.add(socket);
		socket.on("close", () => {
			sockets.delete(socket);
		});
	});
	await listen(server);
	const { port } = server.address();
	proxyOrigin = `http://127.0.0.1:${port}`;
	let closed = false;
	return {
		url: `${proxyOrigin}${target.pathname}${target.search}`,
		close() {
			if (closed) return;
			closed = true;
			for (const socket of sockets) socket.destroy();
			sockets.clear();
			server.close();
		}
	};
}
/**
* Hand one upgrade request to the target, socket to socket.
* @param target - the page being served.
* @param req - the upgrade request from the frame.
* @param socket - the frame's own socket.
* @param head - bytes the client already sent past the headers.
* @param sockets - every socket this proxy holds, so closing it closes these too.
*/
function upgrade(target, req, socket, head, sockets) {
	const upstream = connect(target.port === "" ? 80 : Number(target.port), target.hostname, () => {
		const lines = [`${req.method} ${req.url} HTTP/1.1`];
		for (let i = 0; i < req.rawHeaders.length; i += 2) {
			const name = req.rawHeaders[i];
			if (name.toLowerCase() === "host") continue;
			lines.push(`${name}: ${req.rawHeaders[i + 1]}`);
		}
		lines.push(`host: ${target.host}`);
		upstream.write(`${lines.join("\r\n")}\r\n\r\n`);
		if (head.length > 0) upstream.write(head);
		upstream.pipe(socket);
		socket.pipe(upstream);
	});
	sockets.add(upstream);
	upstream.on("close", () => {
		sockets.delete(upstream);
	});
	upstream.on("error", () => {
		socket.destroy();
	});
	socket.on("error", () => {
		upstream.destroy();
	});
}
/**
* Bind a server to a free port on the loopback interface.
* @param server - the server to bind.
*/
async function listen(server) {
	await new Promise((resolve, reject) => {
		server.once("error", reject);
		server.listen(0, "127.0.0.1", () => {
			resolve();
		});
	});
}
/**
* Answer one request on the proxy.
* @param target - the page being served.
* @param proxyOrigin - this proxy's own origin, used for same-origin redirects.
* @param req - the request from the frame.
* @param res - the answer to it.
*/
function serve(target, proxyOrigin, req, res) {
	if (req.method === "GET" && req.url === "/__dsh_figmark_picker.js") {
		sendPicker(res);
		return;
	}
	forward(target, proxyOrigin, req, res);
}
/**
* Answer the request for the picker itself.
* @param res - the answer to the frame.
*/
function sendPicker(res) {
	res.writeHead(200, {
		"content-type": "application/javascript; charset=utf-8",
		"cache-control": "no-store",
		"content-length": Buffer.byteLength(PICKER_SCRIPT)
	});
	res.end(PICKER_SCRIPT);
}
/**
* Ask the target for what the frame asked for, and hand the answer back.
*
* A refused connection, a reset and a name that does not resolve all arrive on
* the request's `error` event, which is the only place they can be turned into
* an answer: without it, the frame would sit on a connection that never starts.
* @param target - the page being served.
* @param proxyOrigin - this proxy's own origin.
* @param req - the request from the frame.
* @param res - the answer to it.
*/
function forward(target, proxyOrigin, req, res) {
	const headers = { ...req.headers };
	headers["host"] = target.host;
	delete headers["accept-encoding"];
	const upstream = request(target, {
		method: req.method,
		path: req.url,
		headers
	});
	upstream.on("response", (answer) => {
		returnAnswer(target, proxyOrigin, res, answer);
	});
	upstream.on("error", () => {
		fail(res, DOWN);
	});
	req.on("error", () => {
		upstream.destroy();
	});
	req.pipe(upstream);
}
/**
* Hand one answer from the target back to the frame.
* @param target - the page being served.
* @param proxyOrigin - this proxy's own origin.
* @param res - the answer to the frame.
* @param answer - the target's answer.
*/
function returnAnswer(target, proxyOrigin, res, answer) {
	if (isHtml(answer.headers)) {
		holdHtml(target, proxyOrigin, res, answer);
		return;
	}
	res.writeHead(statusOf(answer), withoutStripped(answer.headers, target, proxyOrigin));
	answer.on("error", () => {
		res.destroy();
	});
	answer.pipe(res);
}
/**
* Buffer an HTML page, put the picker tag in it, and send it on.
* @param target - the page being served.
* @param proxyOrigin - this proxy's own origin.
* @param res - the answer to the frame.
* @param answer - the target's answer.
*/
function holdHtml(target, proxyOrigin, res, answer) {
	const chunks = [];
	let size = 0;
	answer.on("data", (chunk) => {
		size += chunk.length;
		if (size > 8388608) {
			answer.destroy();
			fail(res, TOO_BIG);
			return;
		}
		chunks.push(chunk);
	});
	answer.on("error", () => {
		res.destroy();
	});
	answer.on("end", () => {
		const body = injectPicker(stripCspMeta(Buffer.concat(chunks).toString("utf8")), PICKER_TAG);
		const headers = withoutStripped(answer.headers, target, proxyOrigin);
		delete headers["content-length"];
		delete headers["transfer-encoding"];
		headers["content-length"] = Buffer.byteLength(body);
		res.writeHead(statusOf(answer), headers);
		res.end(body);
	});
}
/**
* Whether an answer is a page the picker has to be injected into.
* @param headers - the target's headers.
* @returns true for an HTML body, whatever else the type says.
*/
function isHtml(headers) {
	const type = headers["content-type"];
	return typeof type === "string" && type.toLowerCase().startsWith("text/html");
}
/**
* Copy headers, dropping the ones that would keep the frame from loading the page.
* @param source - the target's headers.
* @param target - the page being served.
* @param proxyOrigin - this proxy's own origin.
* @returns the headers to send to the frame.
*/
function withoutStripped(source, target, proxyOrigin) {
	const headers = { ...source };
	for (const name of STRIPPED) delete headers[name];
	const location = source.location;
	if (location !== void 0) try {
		const redirect = new URL(location, target);
		if (redirect.origin === target.origin) headers["location"] = `${proxyOrigin}${redirect.pathname}${redirect.search}${redirect.hash}`;
	} catch {}
	return headers;
}
/**
* The status code of an answer.
*
* The `response` event only fires once a status line has been parsed, so the code
* is always there; the type is optional because a message can be built by hand.
* @param answer - the target's answer.
* @returns its status code.
*/
function statusOf(answer) {
	return answer.statusCode;
}
/**
* Answer the frame with a sentence instead of a page.
* @param res - the answer to the frame.
* @param message - the sentence to show.
*/
function fail(res, message) {
	/* v8 ignore next 8 -- both callers answer before they have written a status line;
	the branch stays because a truncated answer is the only honest thing to send if
	that ever stops being true. */
	if (res.headersSent) {
		res.destroy();
		return;
	}
	res.writeHead(502, {
		"content-type": "text/plain; charset=utf-8",
		"cache-control": "no-store",
		"content-length": Buffer.byteLength(message)
	});
	res.end(message);
}
//#endregion
//#region src/shared/annotation.ts
/**
* Longest note one mark may carry, in characters.
*
* Lives in `shared` because both halves need the same number for different
* reasons: the browser stops the reader from typing past it, so the field cannot
* grow into a sidecar the Host will refuse; the Host refuses one anyway, so a
* client that forgot cannot write a file the next open cannot read. A single
* number in one place is what keeps those two from drifting apart.
*/
const MAX_DETAIL_CHARS = 4e3;
/** Longest overall note a document may carry, in characters. */
const MAX_SUMMARY_CHARS = 4e3;
/** Thinnest stroke a mark can be drawn at, as a multiple of the default width. */
const WEIGHT_MIN = .5;
/**
* Hold a stroke weight inside the range the painter can draw.
*
* @param value - the weight to hold.
* @returns the value, pulled to the nearest end of the range.
*/
function clampWeight(value) {
	return Math.min(8, Math.max(WEIGHT_MIN, value));
}
/**
* The kinds in the order the rail hands them out, which is the order the list reads
* in.
*
* The list is gathered by kind rather than left in the order the marks were drawn,
* because its numbers are per kind: drawn in an evening of circling and dropping
* pins, a list of six read 1, 2, 1, 1, 2, 3 — the count kept starting over wherever
* the hand happened to change tool. Gathered, the same six read 1, 2, 3, 1, 1, 2,
* and each run of numbers belongs to one shape.
*/
const MARK_KIND_ORDER = [
	"arrow",
	"rect",
	"ellipse",
	"pen",
	"point",
	"element"
];
//#endregion
//#region src/host/route-http.ts
/**
* Largest accepted request body.
*
* Twice the review cap: the artifact travels base64-encoded inside a JSON
* envelope, and base64 costs four characters for every three bytes. Anything past
* this is refused before it is buffered, which is what keeps a hostile body from
* being an allocation.
*/
const MAX_BODY_BYTES$1 = 24 * 1024 * 1024 * 2;
/**
* Whether a request carries the plugin guard and a same-origin posture.
*
* A browser that does not send `Sec-Fetch-Site` at all cannot be origin-checked,
* and the header alone is still a preflight requirement for any cross-origin
* attempt — so an absent value passes and a present one must be same-origin.
* @param req - incoming request.
* @returns true when the request may proceed.
*/
function guarded(req) {
	if (req.headers["x-dsh-figmark"] === void 0) return false;
	const site = req.headers["sec-fetch-site"];
	if (typeof site !== "string") return true;
	return site === "same-origin" || site === "none";
}
/**
* Write one JSON response.
* @param res - response to own.
* @param status - HTTP status code.
* @param body - JSON-serializable payload.
*/
function sendJson(res, status, body) {
	const text = JSON.stringify(body);
	res.writeHead(status, {
		"content-type": "application/json; charset=utf-8",
		"cache-control": "no-store"
	});
	res.end(text);
}
/**
* Write one refusal.
* @param res - response to own.
* @param status - HTTP status code.
* @param error - what went wrong, in the Host's own words.
*/
function sendFailure(res, status, error) {
	sendJson(res, status, {
		ok: false,
		error
	});
}
/**
* Read a request body with a byte cap.
* @param req - incoming request.
* @returns the body text.
* @throws {Error} when the body exceeds the cap.
*/
async function readBody(req) {
	const chunks = [];
	let total = 0;
	for await (const chunk of req) {
		const buffer = chunk;
		total += buffer.length;
		if (total > MAX_BODY_BYTES$1) throw new Error(`request body exceeds ${MAX_BODY_BYTES$1} bytes`);
		chunks.push(buffer);
	}
	return Buffer.concat(chunks).toString("utf8");
}
//#endregion
//#region src/host/review-payload.ts
/** First bytes of every PDF file, used to tell one payload from another. */
const PDF_HEADER = "%PDF-";
/**
* Read the one flattened review artifact a save may carry.
*
* The kind is taken from the payload, and the store refuses a pair that
* contradicts the figure's own suffix — so a caller cannot name PNG bytes as the
* review of a PDF.
*
* @param body - parsed request body.
* @returns the artifact, or undefined when the save carried none.
* @throws {Error} when both payloads are present, or the PDF bytes are not a PDF.
*/
function readReview(body) {
	const image = typeof body["reviewImage"] === "string" ? body["reviewImage"] : "";
	const pdf = typeof body["annotatedPdf"] === "string" ? body["annotatedPdf"] : "";
	if (image !== "" && pdf !== "") throw new Error("a save carries one review artifact, not both");
	if (pdf !== "") {
		const bytes = new Uint8Array(Buffer.from(pdf, "base64"));
		if (!Buffer.from(bytes.subarray(0, 5)).toString("latin1").startsWith(PDF_HEADER)) throw new Error("the annotated document is not a PDF");
		return {
			kind: "pdf",
			bytes
		};
	}
	if (image !== "") return {
		kind: "image",
		bytes: new Uint8Array(Buffer.from(image, "base64"))
	};
}
//#endregion
//#region src/host/service-discovery.ts
/**
* Find local HTTP services without exposing an open network relay.
*
* The scan is deliberately bounded: loopback only, a short list of common ports,
* ports named by the current workspace's package scripts, and recently used URLs.
* It never scans 1-65535 and never follows a candidate to another host.
* @module dsh-figmark/host/service-discovery
*/
/** Ports common development servers use when the package does not say. */
const COMMON_PORTS = [
	3e3,
	3001,
	4173,
	4321,
	5173,
	5174,
	8e3,
	8080,
	8888,
	8898
];
/** Most pages one scan reads at once. */
const CONCURRENCY = 8;
/** Most candidates one scan will consider. */
const MAX_CANDIDATES = 32;
/** Longest title retained from a page. */
const MAX_TITLE = 80;
/** Most body bytes one probe will read before closing the response. */
const MAX_BODY_BYTES = 64 * 1024;
/** Absolute lifetime of one probe, including connect, response, and body. */
const PROBE_TIMEOUT_MS = 450;
/** Whether a URL is plain HTTP on this machine. */
function loopback(url) {
	return url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]");
}
/** A normalized candidate URL, or undefined when it is not a loopback HTTP page. */
function candidateOf(value, source) {
	try {
		const url = new URL(value);
		return loopback(url) ? {
			url: url.href,
			source
		} : void 0;
	} catch {
		return;
	}
}
/** Ports explicitly named by the workspace's package scripts. */
async function workspacePorts(cwd) {
	if (cwd === void 0) return [];
	try {
		const raw = JSON.parse(await readFile(join(cwd, "package.json"), "utf8"));
		return [...Object.values(raw.scripts ?? {}).filter((value) => typeof value === "string").join(" ").matchAll(/(?:--port(?:=|\s+)|PORT=)([1-9][0-9]{1,4})/gu)].map((match) => Number(match[1])).filter((port) => Number.isInteger(port) && port > 0 && port < 65536);
	} catch {
		return [];
	}
}
/** Extract a short title from the beginning of an HTML answer. */
function titleOf(html) {
	const match = /<title\b[^>]*>([\s\S]*?)<\/title>/iu.exec(html);
	if (match === null) return void 0;
	const title = match[0].replace(/^<title\b[^>]*>/iu, "").replace(/<\/title>$/iu, "").replace(/<[^>]+>/gu, " ").replace(/&amp;/gu, "&").replace(/&lt;/gu, "<").replace(/&gt;/gu, ">").replace(/&quot;/gu, "\"").replace(/&#39;/gu, "'").replace(/\s+/gu, " ").trim();
	return title === "" ? void 0 : title.slice(0, MAX_TITLE);
}
/** Ask one address for its title; undefined means nothing answered there. */
function probe(candidate) {
	return new Promise((resolve) => {
		const url = new URL(candidate.url);
		let settled = false;
		let deadline;
		const finish = (answer) => {
			if (settled) return;
			settled = true;
			clearTimeout(deadline);
			resolve(answer);
		};
		const req = request({
			protocol: "http:",
			hostname: url.hostname,
			port: url.port === "" ? 80 : Number(url.port),
			path: `${url.pathname}${url.search}`,
			method: "GET",
			headers: { accept: "text/html,application/xhtml+xml" }
		}, (res) => {
			const chunks = [];
			let bytes = 0;
			const finishResponse = () => {
				/* v8 ignore next -- Node populates statusCode before emitting `response`. */
				const status = res.statusCode ?? 0;
				if (status < 200 || status >= 500) {
					finish(void 0);
					return;
				}
				const title = titleOf(Buffer.concat(chunks).toString("utf8"));
				finish({
					url: candidate.url,
					source: candidate.source,
					...title === void 0 ? {} : { title }
				});
			};
			res.on("data", (chunk) => {
				const kept = chunk.subarray(0, MAX_BODY_BYTES - bytes);
				chunks.push(kept);
				bytes += kept.byteLength;
				if (bytes < MAX_BODY_BYTES) return;
				finishResponse();
				res.destroy();
			});
			res.on("end", finishResponse);
			res.on("error", () => {
				finish(void 0);
			});
		});
		deadline = setTimeout(() => {
			finish(void 0);
			req.destroy();
		}, PROBE_TIMEOUT_MS);
		req.on("error", () => {
			finish(void 0);
		});
		req.end();
	});
}
/** Probe candidates with a fixed number of workers. */
async function probeAll(candidates) {
	const answers = [];
	let next = 0;
	const work = async () => {
		for (;;) {
			const index = next;
			next += 1;
			const candidate = candidates[index];
			if (candidate === void 0) return;
			const answer = await probe(candidate);
			if (answer !== void 0) answers.push(answer);
		}
	};
	await Promise.all(Array.from({ length: Math.min(CONCURRENCY, candidates.length) }, work));
	return answers;
}
/**
* Discover reachable local HTTP services.
* @param request - the browser's session and recent addresses.
* @param sessionCwd - resolves that session's workspace.
* @returns the reachable services, de-duplicated by URL.
*/
async function discoverServices(request, sessionCwd) {
	const ports = await workspacePorts(await sessionCwd(request.sessionId));
	const candidates = [];
	const seen = /* @__PURE__ */ new Set();
	const add = (candidate) => {
		if (candidate === void 0 || seen.has(candidate.url) || candidates.length >= MAX_CANDIDATES) return;
		seen.add(candidate.url);
		candidates.push(candidate);
	};
	for (const recent of request.recent ?? []) add(candidateOf(recent, "recent"));
	for (const port of ports) add(candidateOf(`http://127.0.0.1:${String(port)}/`, "workspace"));
	for (const port of COMMON_PORTS) add(candidateOf(`http://127.0.0.1:${String(port)}/`, "common"));
	const services = await probeAll(candidates);
	const rank = {
		recent: 0,
		workspace: 1,
		common: 2
	};
	return services.sort((left, right) => rank[left.source] - rank[right.source] || new URL(left.url).port.localeCompare(new URL(right.url).port, void 0, { numeric: true }));
}
//#endregion
//#region src/host/store-schema.ts
/**
* The wire schema of one annotation document.
*
* Everything that crosses the HTTP boundary is JSON somebody else wrote, so it is
* validated field by field before any of it reaches disk. This module owns that
* one job: turning unknown JSON into {@link AnnotationDocument} or refusing it
* with a message that names the field. It deliberately knows nothing about files
* — the read and write modules call it, never the other way round.
*
* The two figure shapes are held apart here rather than tolerated downstream: a
* document is either one surface (width and height) or a paged one (pageCount),
* and a mark may name a page only when its figure has pages. A reader that got
* both would have to guess which coordinate space the marks live in.
* @module dsh-figmark/host/store-schema
*/
/** Longest element selector one anchor may carry. */
const MAX_SELECTOR_CHARS = 400;
/** Longest class list one anchor may carry. */
const MAX_ANCHOR_CLASS_CHARS = 160;
/**
* A note as it is stored: trimmed, and refused when it is longer than a paragraph.
*
* The cap is enforced rather than truncated. A writer that silently cut a pasted
* paragraph would hand the reader back a different sentence than the one they
* wrote, with no way to tell which half survived; refusing says so and keeps the
* screen's copy intact. Absent and empty are the same thing — an empty note is no
* note, and writing one would make the file say something the reader did not.
* @param value - the field as it arrived.
* @param what - which field, for the refusal message.
* @returns the note, or undefined when there is none.
* @throws {Error} when the note is longer than a paragraph.
*/
function readNote(value, what, max) {
	if (typeof value !== "string") return void 0;
	if (value.length > max) throw new Error(`the annotation ${what} is longer than ${String(max)} characters`);
	const trimmed = value.trim();
	return trimmed === "" ? void 0 : trimmed;
}
/**
* Whether a value is a finite figure coordinate pair.
* @param value - candidate value from the wire.
* @returns true when the value is a two-number tuple.
*/
function isPoint(value) {
	return Array.isArray(value) && value.length === 2 && value.every((entry) => typeof entry === "number" && Number.isFinite(entry));
}
/**
* Whether a value is a finite figure rectangle.
* @param value - candidate value from the wire.
* @returns true when the value is a four-number tuple.
*/
function isBox(value) {
	return Array.isArray(value) && value.length === 4 && value.every((entry) => typeof entry === "number" && Number.isFinite(entry));
}
/**
* Validate one anchor from the wire.
* @param value - candidate anchor.
* @returns the anchor, or undefined when absent; throws when malformed.
*/
function readAnchor(value) {
	if (value === void 0 || value === null) return void 0;
	if (typeof value !== "object") throw new Error("annotation mark anchor must be an object");
	const raw = value;
	if (typeof raw["tag"] !== "string") throw new Error("annotation mark anchor needs a tag");
	if (!isBox(raw["bbox"])) throw new Error("annotation mark anchor needs a four-number bbox");
	return {
		tag: raw["tag"],
		bbox: raw["bbox"],
		...typeof raw["id"] === "string" ? { id: raw["id"] } : {},
		...typeof raw["class"] === "string" ? { class: raw["class"].slice(0, MAX_ANCHOR_CLASS_CHARS) } : {},
		...typeof raw["title"] === "string" ? { title: raw["title"] } : {},
		...typeof raw["text"] === "string" ? { text: raw["text"] } : {},
		...typeof raw["selector"] === "string" ? { selector: raw["selector"].slice(0, MAX_SELECTOR_CHARS) } : {}
	};
}
/**
* Read one optional stroke weight from the wire.
* @param value - the field as it arrived.
* @returns the weight, or undefined when absent.
* @throws {Error} when the field is present but is not a usable multiple.
*/
function readWeight(value) {
	if (value === void 0) return void 0;
	if (typeof value !== "number" || !Number.isFinite(value)) throw new Error("annotation mark weight must be a finite multiple of the default width");
	return clampWeight(value);
}
/**
* Read one optional rotation from the wire.
* @param value - the field as it arrived.
* @returns the angle in degrees, or undefined when absent.
* @throws {Error} when the field is present but is not a finite number.
*/
function readRotation(value) {
	if (value === void 0) return void 0;
	if (typeof value !== "number" || !Number.isFinite(value)) throw new Error("annotation mark rotation must be a finite number of degrees");
	return value;
}
/**
* Read one optional positive integer field from the wire.
* @param raw - the object as it arrived.
* @param field - field name, used in the failure message.
* @returns the number, or undefined when the field is absent.
* @throws {Error} when the field is present but is not a positive integer.
*/
function readPositiveInteger(raw, field) {
	const value = raw[field];
	if (value === void 0) return void 0;
	if (typeof value !== "number" || !Number.isInteger(value) || value < 1) throw new Error(`annotation ${field} must be a positive integer`);
	return value;
}
/**
* Read one optional positive size from the wire.
* @param raw - the figure object as it arrived.
* @param field - field name, used in the failure message.
* @returns the size, or undefined when the field is absent.
* @throws {Error} when the field is present but is not a positive number.
*/
function readSize(raw, field) {
	const value = raw[field];
	if (value === void 0) return void 0;
	if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) throw new Error(`annotation figure ${field} must be a positive number`);
	return value;
}
/**
* Validate one mark from the wire.
*
* A mark names the page it was drawn on exactly when its figure is a paged
* document: on a single-surface figure a page number would be a coordinate space
* that does not exist, so it is refused rather than ignored.
*
* @param value - candidate mark.
* @param index - position used in the failure message.
* @param figure - the validated figure the mark belongs to.
* @returns the validated mark.
* @throws {Error} when a required field is missing or mistyped.
*/
function readMark(value, index, figure) {
	if (typeof value !== "object" || value === null) throw new Error(`annotation mark ${index} must be an object`);
	const raw = value;
	const kind = raw["kind"];
	if (typeof kind !== "string" || !MARK_KIND_ORDER.includes(kind)) throw new Error(`annotation mark ${index} has unknown kind ${JSON.stringify(kind)}`);
	if (typeof raw["id"] !== "string" || raw["id"] === "") throw new Error(`annotation mark ${index} needs an id`);
	if (typeof raw["color"] !== "string") throw new Error(`annotation mark ${index} needs a color`);
	const points = raw["points"];
	if (!Array.isArray(points) || points.length === 0 || !points.every(isPoint)) throw new Error(`annotation mark ${index} needs at least one coordinate pair`);
	const page = readPositiveInteger(raw, "page");
	if (page !== void 0 && figure.width !== void 0) throw new Error(`annotation mark ${index} names a page, but its figure is one surface`);
	if (page !== void 0 && figure.pageCount !== void 0 && page > figure.pageCount) throw new Error(`annotation mark ${index} is on page ${page} of a ${figure.pageCount}-page document`);
	const anchor = readAnchor(raw["anchor"]);
	const surface = typeof raw["surface"] === "string" ? raw["surface"].slice(0, MAX_SELECTOR_CHARS) : void 0;
	const rotation = readRotation(raw["rotation"]);
	const weight = readWeight(raw["weight"]);
	const detail = readNote(raw["detail"], "mark note", MAX_DETAIL_CHARS);
	return {
		id: raw["id"],
		kind,
		color: raw["color"],
		points,
		...detail === void 0 ? {} : { detail },
		...page === void 0 ? {} : { page },
		...surface === void 0 ? {} : { surface },
		...rotation === void 0 ? {} : { rotation },
		...weight === void 0 ? {} : { weight },
		...anchor === void 0 ? {} : { anchor }
	};
}
/**
* Validate a whole annotation document from the wire.
* @param value - parsed request body.
* @returns the validated document.
* @throws {Error} when the body is not a document this plugin wrote.
*/
function readAnnotationDocument(value) {
	if (typeof value !== "object" || value === null) throw new Error("annotation document must be an object");
	const raw = value;
	if (raw["version"] !== 1) throw new Error(`annotation document version ${JSON.stringify(raw["version"])} is not 1`);
	const figure = raw["figure"];
	if (typeof figure !== "object" || figure === null) throw new Error("annotation document needs a figure");
	const figureRaw = figure;
	for (const field of [
		"address",
		"path",
		"mediaType",
		"sha256"
	]) if (typeof figureRaw[field] !== "string" || figureRaw[field] === "") throw new Error(`annotation figure needs ${field}`);
	const width = readSize(figureRaw, "width");
	const height = readSize(figureRaw, "height");
	if (width === void 0 !== (height === void 0)) throw new Error("annotation figure needs both its width and its height, or neither");
	const pageCount = readPositiveInteger(figureRaw, "pageCount");
	if (pageCount !== void 0 && width !== void 0) throw new Error("annotation figure is a paged document, so it cannot carry width and height");
	const marks = raw["marks"];
	if (!Array.isArray(marks)) throw new Error("annotation document needs a marks array");
	const updatedAt = typeof raw["updatedAt"] === "string" ? raw["updatedAt"] : (/* @__PURE__ */ new Date()).toISOString();
	const summary = readNote(raw["summary"], "document note", MAX_SUMMARY_CHARS);
	return {
		version: 1,
		figure: {
			address: figureRaw["address"],
			path: figureRaw["path"],
			mediaType: figureRaw["mediaType"],
			sha256: figureRaw["sha256"],
			...width !== void 0 && height !== void 0 ? {
				width,
				height
			} : {},
			...pageCount === void 0 ? {} : { pageCount }
		},
		createdAt: typeof raw["createdAt"] === "string" ? raw["createdAt"] : updatedAt,
		updatedAt,
		marks: marks.map((mark, index) => readMark(mark, index, {
			...width === void 0 ? {} : { width },
			...pageCount === void 0 ? {} : { pageCount }
		})),
		...summary === void 0 ? {} : { summary }
	};
}
//#endregion
//#region src/host/sidecar.ts
/**
* Annotation files beside one figure.
*
* An annotation never modifies the figure: it is written to sibling files
* (`<name>.annot.json` for the marks and `<name>.annotated.png` — or
* `<name>.annotated.pdf` for a document that has pages — for the flattened
* review artifact). One figure is one document, however many pages it has, so a
* paged document's marks share a single sidecar and name their page inside it.
*
* The name keeps the figure's own extension (`fig1.svg` → `fig1.svg.annot.json`):
* `fig1.svg` and `fig1.png` in one directory are two different documents, and marks
* drawn on one of them mean nothing on the other, so they must never share a
* sidecar. Every name is derived from the figure path, so the plugin can never be
* asked to write an arbitrary location.
* @module dsh-figmark/host/sidecar
*/
/** Suffix appended to a figure's name for the marks file. */
const ANNOTATION_SUFFIX = ".annot.json";
/** Suffix appended to a figure's name for the flattened review artifact. */
const ANNOTATED_SUFFIX = ".annotated";
/**
* Resolve one figure's sidecar paths.
* @param figurePath - absolute path of the annotated figure.
* @returns the sidecar paths; both live in the figure's own directory.
*/
function sidecarPaths(figurePath) {
	const name = basename(figurePath);
	const directory = dirname(figurePath);
	const reviewExtension = reviewFileExtension(figurePath);
	return {
		annotation: join(directory, `${name}${ANNOTATION_SUFFIX}`),
		review: join(directory, `${name}${ANNOTATED_SUFFIX}${reviewExtension}`)
	};
}
/**
* Suffix of the flattened review artifact for one figure.
*
* A paged document is reviewed as a document — the page marks travel as native
* PDF annotations in a copy of the original — while a single-surface figure is
* reviewed as the picture it is.
* @param figurePath - absolute path of the annotated figure.
* @returns the file extension, dot included.
*/
function reviewFileExtension(figurePath) {
	return isPagedFigurePath(figurePath) ? ".pdf" : ".png";
}
/**
* The marks file this plugin derived before the figure's extension became part of
* the name (`fig1.svg` → `fig1.annot.json`). Read-only: a file an earlier version
* wrote stays readable, so an existing annotation never disappears on upgrade.
* @param figurePath - absolute path of the annotated figure.
* @returns the legacy marks file path beside the figure.
*/
function legacyAnnotationPath(figurePath) {
	return join(dirname(figurePath), `${basename(figurePath, extname(figurePath))}${ANNOTATION_SUFFIX}`);
}
/**
* Marks files to read for one figure, most authoritative first: the current name,
* then the legacy one. A figure whose name carries no extension derives both from
* the same name, so the list is deduplicated.
* @param figurePath - absolute path of the annotated figure.
* @returns the candidate marks file paths.
*/
function annotationCandidates(figurePath) {
	const current = sidecarPaths(figurePath).annotation;
	const legacy = legacyAnnotationPath(figurePath);
	return current === legacy ? [current] : [current, legacy];
}
/**
* Name pattern of the one-page-per-file sidecars this plugin wrote before a paged
* document became a single annotation.
*
* Both spellings are matched — the extension-bearing name
* (`fig1.pdf.p2.annot.json`) and the base-name one an even earlier version wrote
* (`fig1.p2.annot.json`) — and the page number is the pattern's first group.
*
* @param figurePath - absolute path of the annotated figure.
* @returns an anchored, case-insensitive pattern over one directory entry's name.
*/
function legacyPagePattern(figurePath) {
	const extension = extname(figurePath);
	const alternatives = [.../* @__PURE__ */ new Set([basename(figurePath), basename(figurePath, extension)])].map(escapeForRegExp).join("|");
	return new RegExp(`^(?:${alternatives})\\.p(\\d+)${escapeForRegExp(ANNOTATION_SUFFIX)}$`, "iu");
}
/** Escape one literal so it matches itself inside a regular expression. */
function escapeForRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
/**
* Whether a stored document is the annotation of this very figure.
*
* A sidecar sits beside its figure and both names derive from the figure path, so
* the file name — extension included, and case-insensitive because one file may be
* spelled `FIG1.SVG` — is the whole identity. The check matters most for the legacy
* name, which two figures sharing a base name also share.
*
* @param document - stored document to test.
* @param figurePath - absolute path of the figure being opened.
* @returns true when the document names this figure.
*/
function annotationTargetsFigure(document, figurePath) {
	return basename(document.figure.path).toLowerCase() === basename(figurePath).toLowerCase();
}
//#endregion
//#region src/host/store-read.ts
/**
* Reading one figure's annotation sidecar, including the shapes older versions wrote.
*
* Three stored shapes have to read back as one document, because a figure
* annotated by an earlier version must not lose its marks on upgrade: the current
* sidecar name, the legacy base-name sidecar, and the per-page files a paged
* document was once split into. All of them are read-only here — a save always
* writes the current name — so the upgrade is invisible to the reader.
*
* Nothing in this module decides where a sidecar lives: the candidate names come
* from the sidecar module, which derives every one of them from the figure path.
* @module dsh-figmark/host/store-read
*/
/**
* Content hash of one file.
*
* Read whole rather than streamed: the caller compares it against the hash the
* browser recorded when the marks were drawn, and a figure large enough for the
* difference to matter is not one this plugin renders in a sidebar.
* @param path - absolute path of the file.
* @returns the SHA-256 digest as lower-case hex.
*/
async function fileDigest(path) {
	const bytes = await readFile(path);
	return createHash("sha256").update(bytes).digest("hex");
}
/**
* Read one figure's saved annotation.
*
* The current sidecar name is tried first, then the legacy base-name one, and a
* document that names a different figure is skipped — two figures in one directory
* that share a base name would otherwise read each other's marks.
*
* @param figurePath - absolute path of the figure.
* @returns the document and any sidecar that was present but unusable.
*/
async function readAnnotation(figurePath) {
	const unreadable = [];
	for (const candidate of annotationCandidates(figurePath)) {
		const read = await readSidecar(candidate);
		if (read === "unreadable") unreadable.push(candidate);
		else if (read !== null && annotationTargetsFigure(read, figurePath)) return {
			annotation: read,
			unreadable
		};
	}
	if (!isPagedFigurePath(figurePath)) return {
		annotation: null,
		unreadable
	};
	const merged = await readLegacyPages(figurePath);
	return {
		annotation: merged.annotation,
		unreadable: [...unreadable, ...merged.unreadable]
	};
}
/**
* Restate the per-page sidecars an earlier version wrote as one document.
*
* That version annotated one page at a time and stored each page as its own file,
* so a figure annotated then has no whole-figure sidecar. Reading them merged
* keeps those marks visible; the files are left untouched, and the next save
* writes the unified name.
*
* The page count is the highest page found, since the per-page files do not
* record it — the browser half replaces it with the document's real count the next
* time it saves.
*
* @param figurePath - absolute path of the figure.
* @returns the merged document, when any page file was readable.
*/
async function readLegacyPages(figurePath) {
	const directory = dirname(figurePath);
	const pattern = legacyPagePattern(figurePath);
	let entries;
	try {
		entries = await readdir(directory);
	} catch {
		return {
			annotation: null,
			unreadable: []
		};
	}
	const pages = entries.map((name) => ({
		name,
		page: Number(pattern.exec(name)?.[1])
	})).filter((entry) => Number.isInteger(entry.page) && entry.page > 0).sort((left, right) => left.page - right.page);
	const read = [];
	const unreadable = [];
	for (const entry of pages) {
		const path = join(directory, entry.name);
		const document = await readSidecar(path);
		if (document === "unreadable") unreadable.push(path);
		else if (document !== null && annotationTargetsFigure(document, figurePath)) read.push({
			page: entry.page,
			document
		});
	}
	const first = read[0];
	if (first === void 0) return {
		annotation: null,
		unreadable
	};
	let summary;
	for (const entry of read) if (entry.document.summary !== void 0) summary = entry.document.summary;
	return {
		annotation: {
			version: 1,
			figure: {
				address: first.document.figure.address,
				path: first.document.figure.path,
				mediaType: first.document.figure.mediaType,
				sha256: first.document.figure.sha256,
				pageCount: read.reduce((highest, entry) => Math.max(highest, entry.page), first.page)
			},
			createdAt: read.reduce((earliest, entry) => entry.document.createdAt < earliest ? entry.document.createdAt : earliest, first.document.createdAt),
			updatedAt: read.reduce((latest, entry) => entry.document.updatedAt > latest ? entry.document.updatedAt : latest, first.document.updatedAt),
			marks: read.flatMap((entry) => entry.document.marks.map((mark) => ({
				...mark,
				page: entry.page
			}))),
			...summary === void 0 ? {} : { summary }
		},
		unreadable
	};
}
/**
* Parse one marks file into this plugin's document shape.
* @param sidecarPath - absolute path of the marks file.
* @returns the document, null when there is no readable file, or `'unreadable'`
*   when the file is there and is not something this plugin will read.
*/
async function readSidecar(sidecarPath) {
	let text;
	try {
		if ((await stat(sidecarPath)).size > 4194304) return "unreadable";
		text = await readFile(sidecarPath, "utf8");
	} catch {
		return null;
	}
	try {
		return readStoredDocument(JSON.parse(text));
	} catch {
		return null;
	}
}
/**
* Read a stored sidecar document in either schema version this workbench sees.
* @param value - parsed marks file content.
* @returns the document in this plugin's shape, or null when it is neither version.
*/
function readStoredDocument(value) {
	if (typeof value !== "object" || value === null) return null;
	const raw = value;
	if (raw["version"] === 1) return readAnnotationDocument(raw);
	if (raw["version"] === 2) return readAnnotationDocument(bridgeV2Document(raw));
	return null;
}
/**
* Restate a v2 document as the v1 shape this plugin validates and writes.
*
* Both versions carry the same marks and the same figure facts. v2 names the figure
* `target`, adds fields this plugin does not model (`kind` on the target, per-mark
* `targetFingerprint`, `nodeId`/`ref` on an anchor — the v1 reader then drops them),
* and omits `address`, the one v1 field it has no counterpart for: the figure's own
* path stands in, and the browser half replaces it with the live preview address the
* next time it saves.
*
* @param raw - parsed v2 document.
* @returns the same document as a v1 shape.
* @throws {Error} when the document carries no target object.
*/
function bridgeV2Document(raw) {
	const target = raw["target"];
	if (typeof target !== "object" || target === null) throw new Error("annotation document needs a target");
	const figure = target;
	return {
		version: 1,
		figure: {
			address: figure["path"],
			path: figure["path"],
			mediaType: figure["mediaType"],
			width: figure["width"],
			height: figure["height"],
			sha256: figure["sha256"]
		},
		createdAt: raw["createdAt"],
		updatedAt: raw["updatedAt"],
		marks: raw["marks"],
		summary: raw["summary"]
	};
}
//#endregion
//#region src/host/store-write.ts
/**
* Writing one figure's annotation sidecar, and removing it again.
*
* The two files are written through a temporary name and a rename so a reader
* never observes a half-written document: a preview opening while an autosave
* runs reads either the previous document or the new one, never a truncated one.
*
* Both file names are derived here from the figure path, never passed in, and the
* review artifact's kind is checked against the figure's own kind before anything
* is touched — a PNG review of a PDF would be a file no reader could open.
* @module dsh-figmark/host/store-write
*/
/**
* How many scratch files this process has named.
*
* The clock is not enough on its own: two saves started in the same millisecond
* share a pid and a millisecond, took the same scratch name, and one of them renamed
* the other's half-written bytes into place — or found nothing to rename and failed a
* save that had every right to succeed. A counter inside the process cannot repeat,
* and the pid and clock still keep two *processes* apart.
*/
let scratchCount = 0;
/**
* Replace one file atomically.
*
* The temporary name carries the pid, a counter and the clock so two saves that
* overlap cannot pick the same scratch file; the rename is the moment the new
* content becomes observable.
* @param path - absolute path of the file to replace.
* @param content - text or bytes to write.
*/
async function writeAtomically(path, content) {
	scratchCount += 1;
	const temporary = `${path}.tmp-${process.pid}-${scratchCount}-${Date.now()}`;
	await writeFile(temporary, content, typeof content === "string" ? "utf8" : void 0);
	await rename(temporary, path);
}
/**
* Write one figure's annotation, and optionally its flattened review artifact.
* @param figurePath - absolute path of the annotated figure.
* @param document - validated document to persist.
* @param review - the flattened artifact, when the browser exported one.
* @returns the written paths.
* @throws {Error} when the artifact's kind contradicts the figure's own kind.
*/
async function writeAnnotation(figurePath, document, review) {
	const paths = sidecarPaths(figurePath);
	if (review !== void 0 && review.kind !== (isPagedFigurePath(figurePath) ? "pdf" : "image")) throw new Error(`a ${reviewFileExtension(figurePath)} review artifact cannot be written from ${review.kind} bytes`);
	await mkdir(dirname(paths.annotation), { recursive: true });
	await writeAtomically(paths.annotation, `${JSON.stringify(document, null, 2)}\n`);
	if (review === void 0) return {
		paths,
		wroteReview: false
	};
	await writeAtomically(paths.review, review.bytes);
	return {
		paths,
		wroteReview: true
	};
}
/**
* Delete one figure's annotation sidecars, leaving the figure itself alone.
*
* A sidecar has no meaning once its marks are gone: the marks file would be read
* back as an empty annotation on the next open, and the review artifact is a
* picture of marks that no longer exist. Removing both is what makes a deleted or
* delivered annotation stay gone. A missing file is not an error — the caller's
* intent is "there are no sidecars here", and that is true either way.
*
* @param figurePath - absolute path of the figure whose sidecars are removed.
* @returns whether anything was removed.
* @throws {Error} when a sidecar exists but cannot be unlinked.
*/
async function removeAnnotation(figurePath) {
	const paths = sidecarPaths(figurePath);
	let removed = false;
	for (const path of await allSidecarNames(figurePath)) try {
		await rm(path, { force: false });
		removed = true;
	} catch (error) {
		if (error.code !== "ENOENT") throw error;
	}
	return {
		paths,
		removed
	};
}
/**
* Every file this plugin may have written beside one figure, oldest spelling first.
*
* The read path accepts more names than the write path produces: the legacy
* base-name sidecar (`fig1.annot.json` beside `fig1.svg`), and for a paged document
* the one-file-per-page sidecars an earlier version wrote. Removing only the two
* current names left those behind — and because the reader merges them back in, a
* cleared figure reopened with its marks on it, which is the bug in finding 1.
* Whatever the reader will read has to be what a clear removes.
* @param figurePath - absolute path of the figure whose sidecars are removed.
* @returns the paths to unlink.
*/
async function allSidecarNames(figurePath) {
	const paths = sidecarPaths(figurePath);
	const names = [
		paths.annotation,
		paths.review,
		legacyAnnotationPath(figurePath)
	];
	if (isPagedFigurePath(figurePath)) {
		const pattern = legacyPagePattern(figurePath);
		let entries;
		try {
			entries = await readdir(dirname(figurePath));
		} catch {
			entries = [];
		}
		for (const entry of entries) if (pattern.test(entry)) names.push(join(dirname(figurePath), entry));
	}
	return [...new Set(names)];
}
//#endregion
//#region src/host/routes.ts
/** The route a live page is opened and closed on. */
const LIVE_PATH = `${ROUTE_PREFIX}${LIVE_ROUTE}`;
/** The route that probes bounded loopback candidates. */
const SERVICES_PATH = `${ROUTE_PREFIX}${SERVICE_DISCOVER_ROUTE}`;
/**
* Resolve the figure one request names, as an answer rather than an exception.
* @param address - the address the request carried, empty when it carried none.
* @param deps - Session lookup.
* @returns the target, or the 404 refusal to send.
*/
async function targetOf(address, deps) {
	const resolved = await resolveTarget(address, deps.sessionCwd);
	return resolved.ok ? {
		ok: true,
		body: resolved.target
	} : {
		ok: false,
		status: 404,
		error: resolved.message
	};
}
/**
* Read the figure's current hash and its saved annotation.
* @param target - the resolved figure.
* @returns the read body.
*/
async function readAnswer(target) {
	const saved = await readAnnotation(target.path);
	const sha256 = await fileDigest(target.path);
	return {
		ok: true,
		figure: {
			...target,
			sha256
		},
		annotation: saved.annotation,
		...saved.unreadable.length === 0 ? {} : { unreadable: saved.unreadable }
	};
}
/**
* Write the annotation one request carried.
* @param target - the resolved figure.
* @param raw - the parsed request body.
* @returns the save body, or the refusal to send.
*/
async function saveAnswer(target, raw) {
	const document = readAnnotationDocument(raw["annotation"]);
	const review = readReview(raw);
	if (review !== void 0 && review.bytes.byteLength > 25165824) return {
		ok: false,
		status: 413,
		error: "the review artifact is too large"
	};
	const saved = await writeAnnotation(target.path, document, review);
	return {
		ok: true,
		body: {
			ok: true,
			annotationPath: saved.paths.annotation,
			reviewPath: saved.wroteReview ? saved.paths.review : null
		}
	};
}
/**
* Remove the sidecars of one figure.
* @param target - the resolved figure.
* @returns the removal body.
*/
async function removeAnswer(target) {
	const removed = await removeAnnotation(target.path);
	return {
		ok: true,
		annotationPath: removed.paths.annotation,
		reviewPath: removed.paths.review,
		removed: removed.removed
	};
}
/**
* Build the route handlers this plugin registers.
* @param deps - Session lookup.
* @param liveRuntime - live-page operation, replaceable at the listener boundary in tests.
* @returns one handler per route path.
*/
function createHandlers(deps, liveRuntime = { open: openLive }) {
	/**
	* The page being served to the panel, when one is.
	*
	* One at a time, because the panel shows one frame: a second page would leave
	* the first proxy listening with nothing pointing at it. The state lives here,
	* per composition, so two hosts in one process never share a frame.
	*/
	let live;
	/** The latest open request admitted, even while its listener is still starting. */
	let liveOpenSequence = 0;
	/**
	* Open the page one request names, or close whatever page is open.
	* @param req - the request naming the operation.
	* @param requestUrl - the already parsed request target.
	* @returns the answer to send.
	*/
	const liveAnswer = async (req, requestUrl) => {
		if (req.method === "POST") {
			const sequence = liveOpenSequence + 1;
			liveOpenSequence = sequence;
			const body = JSON.parse(await readBody(req));
			const proxy = await liveRuntime.open(new URL(typeof body["url"] === "string" ? body["url"] : ""));
			if (sequence !== liveOpenSequence) {
				proxy.close();
				return {
					ok: false,
					status: 409,
					error: "a newer local page superseded this one"
				};
			}
			live?.close();
			live = proxy;
			return {
				ok: true,
				body: {
					ok: true,
					url: proxy.url
				}
			};
		}
		if (req.method === "DELETE") {
			const expected = requestUrl.searchParams.get("url");
			if (expected === null) liveOpenSequence += 1;
			if (live !== void 0 && (expected === null || expected === live.url)) {
				live.close();
				live = void 0;
			}
			return {
				ok: true,
				body: { ok: true }
			};
		}
		return {
			ok: false,
			status: 405,
			error: `method ${String(req.method)} is not allowed`
		};
	};
	/**
	* Scan the bounded local candidates the browser asked about.
	* @param req - a POST carrying a session and optional recent URLs.
	* @returns reachable services, or a method refusal.
	*/
	const serviceAnswer = async (req) => {
		if (req.method !== "POST") return {
			ok: false,
			status: 405,
			error: `method ${String(req.method)} is not allowed`
		};
		const raw = JSON.parse(await readBody(req));
		const sessionId = typeof raw["sessionId"] === "string" ? raw["sessionId"] : "";
		if (sessionId === "") return {
			ok: false,
			status: 400,
			error: "service discovery needs a session"
		};
		const recent = Array.isArray(raw["recent"]) ? raw["recent"].filter((value) => typeof value === "string").slice(0, 16) : void 0;
		return {
			ok: true,
			body: {
				ok: true,
				services: await discoverServices({
					sessionId,
					...recent === void 0 ? {} : { recent }
				}, deps.sessionCwd)
			}
		};
	};
	const annotation = async (req, res) => {
		if (!guarded(req)) {
			sendFailure(res, 403, "missing plugin guard header");
			return;
		}
		try {
			const url = new URL(req.url ?? "/", "http://localhost");
			const answer = url.pathname === LIVE_PATH ? await liveAnswer(req, url) : url.pathname === SERVICES_PATH ? await serviceAnswer(req) : await route(req, url, deps);
			if (answer.ok) {
				sendJson(res, 200, answer.body);
				return;
			}
			sendFailure(res, answer.status, answer.error);
		} catch (error) {
			sendFailure(res, 400, error instanceof Error ? error.message : String(error));
		}
	};
	return {
		annotation,
		close() {
			liveOpenSequence += 1;
			live?.close();
			live = void 0;
		}
	};
}
/**
* Dispatch one guarded request to the operation its method names.
* @param req - incoming request.
* @param url - the request's URL.
* @param deps - Session lookup.
* @returns the answer to send.
*/
async function route(req, url, deps) {
	const address = url.searchParams.get("address") ?? "";
	if (req.method === "GET") {
		const target = await targetOf(address, deps);
		if (!target.ok) return target;
		return {
			ok: true,
			body: await readAnswer(target.body)
		};
	}
	if (req.method === "POST") {
		const body = JSON.parse(await readBody(req));
		const target = await targetOf(typeof body["address"] === "string" ? body["address"] : "", deps);
		if (!target.ok) return target;
		return await saveAnswer(target.body, body);
	}
	if (req.method === "DELETE") {
		const target = await targetOf(address, deps);
		if (!target.ok) return target;
		return {
			ok: true,
			body: await removeAnswer(target.body)
		};
	}
	return {
		ok: false,
		status: 405,
		error: `method ${req.method ?? ""} is not allowed`
	};
}
//#endregion
//#region src/host/session-cwd.ts
/**
* Resolve one Session's workspace directory.
* @param sessionId - the Session named by a preview address.
* @param sources - the Host sources available in this composition.
* @returns the absolute directory, or undefined when no source knows it.
*/
async function resolveSessionCwd(sessionId, sources) {
	const live = sources.agents?.get(sessionId)?.session;
	const liveCwd = live?.header?.cwd ?? live?.cwd;
	if (liveCwd !== void 0 && liveCwd !== "") return liveCwd;
	try {
		const cwd = (await sources.sessionPersistence?.stat(sessionId))?.header?.cwd;
		if (cwd !== void 0 && cwd !== "") return cwd;
	} catch {}
	for (const workspace of sources.workspaceRegistry?.list() ?? []) if (workspace.sessionIds?.includes(sessionId) === true && workspace.path !== void 0) return workspace.path;
}
//#endregion
//#region src/missing-service.ts
/**
* The one message a half-mounted plugin fails with.
*
* Both halves treat their collaborators as hard requirements, so the wording
* lives here rather than in each entry, where the two copies would drift.
* @module dsh-figmark/missing-service
*/
/**
* Compose the message a missing service fails with.
* @param service - the service name that was absent.
* @returns the failure message.
*/
function missingService(service) {
	return `dsh-figmark: the composition provides no "${service}"; this plugin cannot mount without it`;
}
//#endregion
//#region src/index.ts
/** Plugin name, as the Loader entry and diagnostics spell it. */
const name = "dsh-figmark";
/**
* Services the host half cannot work without: the routes go on the Web server and
* the guidance goes into the prompt registry. Declaring them here also makes the
* Loader order this plugin after both.
*/
const inject = ["webServer", "systemPrompt"];
/**
* Mount the host half.
* @param ctx - the plugin's Cordis context.
* @throws {Error} when a required service is missing from the composition.
*/
function apply(ctx) {
	const webServer = ctx.get("webServer");
	const systemPrompt = ctx.get("systemPrompt");
	if (webServer === void 0) throw new Error(missingService("webServer"));
	if (systemPrompt === void 0) throw new Error(missingService("systemPrompt"));
	/**
	* Read the Host sources a Session's directory may be resolved from.
	*
	* Read per request, never captured when this row mounts: the plugin's own
	* `inject` set is satisfied early (the web server and the prompt registry),
	* while the session store and the workspace registry mount later in the same
	* composition. A capture at mount time would freeze them as absent and take
	* every session-relative preview address down with it.
	*/
	const sources = () => ({
		agents: ctx.get("agents"),
		sessionPersistence: ctx.get("sessionPersistence"),
		workspaceRegistry: ctx.get("workspaceRegistry")
	});
	const handlers = createHandlers({ sessionCwd: (sessionId) => resolveSessionCwd(sessionId, sources()) });
	ctx.effect(() => {
		const unregister = webServer.register({
			kind: "prefix",
			path: ROUTE_PREFIX,
			handler: handlers.annotation
		});
		return () => {
			unregister();
			handlers.close();
		};
	}, "dsh-figmark: annotation route");
	ctx.effect(() => systemPrompt.section({
		name: GUIDANCE_NAME,
		order: GUIDANCE_ORDER,
		text: GUIDANCE,
		stable: true
	}), "dsh-figmark: guidance");
}
//#endregion
export { apply, inject, name };
