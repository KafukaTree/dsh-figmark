window.__ModuleLoader__.load({
	id: "dsh-figmark",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/locales.ts
		/** Chinese copy (the product's primary language). */
		const zh = {
			title: "附图标注",
			annotate: "标注",
			view: "查看",
			tools: "绘图工具",
			moveTools: "拖动工具条",
			moveBar: "拖动这一条",
			toolSelect: "选择",
			toolArrow: "箭头",
			toolRect: "框选",
			toolEllipse: "圈选",
			toolPen: "手绘",
			toolPoint: "单点",
			undo: "撤销",
			redo: "重做",
			clear: "清空",
			detail: "这个元素的详细说明",
			addComment: "添加评论…",
			pinSize: "标记大小",
			weight: "线条粗细",
			detailPlaceholder: "这一处具体要改什么（例如「这个标号应指向滑套 34」）",
			summary: "总体目标",
			summaryPlaceholder: "可选：这张图整体要往哪个方向改（智能体会连同下面逐条说明一起读）",
			marks: "标注清单",
			noMarks: "还没有标注",
			noMarksHint: "选一个工具，在图上点一下或拖一下就开始。",
			delete: "删除",
			close: "关闭",
			dock: "批注操作",
			sendToAgent: "发送给智能体",
			sendToComposer: "发送到对话框",
			sending: "正在发送…",
			sent: "已发送给智能体，标注已从面板清空。",
			composing: "正在写入对话框…",
			composed: "已写入对话框草稿（未发送），标注已从面板清空。",
			loading: "正在载入附图…",
			unsupported: "这个文件不是可标注的附图（支持 SVG/PNG/JPEG/WebP/BMP/GIF）",
			loadFailed: "读取附图失败",
			stale: "这张图在上次标注之后已经更新过，旧标注的坐标可能失准，请核对后再提交。",
			anchor: "锚定",
			readError: "读取标注失败",
			saveError: "保存标注失败：",
			clearError: "标注已从面板清空，但删除磁盘上的标注文件失败：",
			emptyDetail: "（未写说明）",
			pdfTitle: "PDF 批注",
			previousPage: "上一页",
			nextPage: "下一页",
			pdfRendering: "正在渲染这一页…",
			pdfOpenFailed: "打开 PDF 失败：",
			documentScope: "共 {pages} 页 · {marks} 处批注",
			notReady: "还没有读取到这个 PDF 的宿主信息，请稍后再试。",
			mdTitle: "Markdown 编辑",
			editMode: "编辑",
			diffMode: "对比",
			diffEmpty: "没有改动",
			editLoading: "正在载入 Markdown…",
			editLines: "共 {lines} 行",
			editStats: "改动 {hunks} 处 · +{added} −{removed} 行",
			discardEdit: "放弃修改",
			sendEdit: "送至会话",
			editSending: "正在提交…",
			editSent: "已提交给智能体（没有落盘）",
			editSendError: "提交失败：",
			editUnavailable: "当前组合没有会话服务，无法提交。",
			editNoSession: "这个文档的地址没有指向任何会话，无法提交。",
			editEofPending: "文件还没有读完；现在所做的修改以已载入的部分为基线。",
			editStale: "载入的内容在编辑期间变了（文件在磁盘上被改动过）：这份改动基于较早的版本，提交前请核对。",
			caretAt: "第 {line} 行 · 第 {column} 列",
			copyDiff: "复制 diff",
			diffCopied: "已复制这份 diff",
			copyFailed: "复制失败：",
			copyUnavailable: "这个环境没有剪贴板接口",
			hunkNote: "第 {line} 行起这一处的说明",
			hunkNotePlaceholder: "可选：为什么这么改（会随 diff 一起发给智能体）",
			htmlTitle: "HTML 标注",
			htmlLoading: "正在载入 HTML…",
			htmlFrame: "HTML 预览",
			htmlStale: "这份 HTML 在上次标注之后已经改过，旧标注的元素定位可能失准，请核对后再提交。",
			style: "标注样式",
			styleColor: "颜色",
			collapse: "收起",
			expand: "展开",
			overallHint: "整张图 · 可选",
			detailHint: "当前选中",
			detailUnset: "未选中",
			detailIdle: "在图上点一下、框一块或画一笔，就能为那处写说明。"
		};
		/** English copy. */
		const en = {
			title: "Figure annotations",
			annotate: "Annotate",
			view: "View",
			tools: "Drawing tools",
			moveTools: "Drag the tools",
			moveBar: "Drag this bar",
			toolSelect: "Select",
			toolArrow: "Arrow",
			toolRect: "Box",
			toolEllipse: "Circle",
			toolPen: "Draw",
			toolPoint: "Point",
			undo: "Undo",
			redo: "Redo",
			clear: "Clear",
			detail: "What this element needs",
			addComment: "Add a comment…",
			pinSize: "Marker size",
			weight: "Line weight",
			detailPlaceholder: "What should change here (for example \"this numeral should point at the sleeve 34\")",
			summary: "Overall goal",
			summaryPlaceholder: "Optional: what this figure should become overall (the agent reads it with the marks below)",
			marks: "Marks",
			noMarks: "No marks yet",
			noMarksHint: "Pick a tool, then click or drag on the figure to start.",
			delete: "Delete",
			close: "Close",
			dock: "Annotation actions",
			sendToAgent: "Send to agent",
			sendToComposer: "Send to composer",
			sending: "Sending…",
			sent: "Sent to the agent; the annotation is cleared from this panel.",
			composing: "Writing into the composer…",
			composed: "Written into the composer draft (not sent); the annotation is cleared from this panel.",
			loading: "Loading figure…",
			unsupported: "This file is not an annotatable figure (SVG/PNG/JPEG/WebP/BMP/GIF)",
			loadFailed: "Reading the figure failed",
			stale: "This figure changed since it was annotated; old marks may be misplaced. Check them before sending.",
			anchor: "anchor",
			readError: "Reading the annotation failed",
			saveError: "Saving the annotation failed: ",
			clearError: "Cleared from this panel, but deleting the annotation files on disk failed: ",
			emptyDetail: "(no detail)",
			pdfTitle: "PDF annotations",
			previousPage: "Previous page",
			nextPage: "Next page",
			pdfRendering: "Rendering this page…",
			pdfOpenFailed: "Opening the PDF failed: ",
			documentScope: "{pages} pages · {marks} marks",
			notReady: "This PDF's Host facts are not loaded yet; try again in a moment.",
			mdTitle: "Markdown editor",
			editMode: "Edit",
			diffMode: "Diff",
			diffEmpty: "No change",
			editLoading: "Loading Markdown…",
			editLines: "{lines} lines",
			editStats: "{hunks} hunks · +{added} −{removed} lines",
			discardEdit: "Discard",
			sendEdit: "Send to agent",
			editSending: "Sending…",
			editSent: "Sent to the agent (nothing was written to disk)",
			editSendError: "Sending failed: ",
			editUnavailable: "This composition has no session service, so the edit cannot be sent.",
			editNoSession: "This document’s address names no session, so the edit cannot be sent.",
			editEofPending: "The file is not fully loaded yet; edits are diffed against the part that is.",
			editStale: "The loaded content changed while you were editing (the file was modified on disk): this change is against an earlier version, so check it before sending.",
			caretAt: "line {line} · col {column}",
			copyDiff: "Copy diff",
			diffCopied: "The diff is on the clipboard",
			copyFailed: "Copying failed: ",
			copyUnavailable: "this environment has no clipboard API",
			hunkNote: "Note for the change at line {line}",
			hunkNotePlaceholder: "Optional: why this change (it travels with the diff)",
			htmlTitle: "HTML annotations",
			htmlLoading: "Loading HTML…",
			htmlFrame: "HTML preview",
			htmlStale: "This HTML changed since it was annotated, so old marks may name the wrong elements. Check them before sending.",
			style: "Mark style",
			styleColor: "Colour",
			collapse: "Collapse",
			expand: "Expand",
			overallHint: "whole figure · optional",
			detailHint: "selected",
			detailUnset: "nothing selected",
			detailIdle: "Click the figure, or box a region or draw a stroke, to write about that spot."
		};
		/** Locale namespace this dictionary registers under. */
		const NAMESPACE = "annotator";
		/**
		* Translate one key without the locale service.
		* @param locale - active locale id.
		* @param key - copy key.
		* @param vars - values interpolated into `{name}` placeholders.
		* @returns the localized string, falling back to Chinese.
		*/
		function fallbackTranslate(locale, key, vars) {
			const text = (locale.startsWith("en") ? en : zh)[key] ?? key;
			if (vars === void 0) return text;
			return text.replace(/\{(\w+)\}/gu, (placeholder, name) => {
				const value = vars[name];
				return value === void 0 ? placeholder : String(value);
			});
		}
		//#endregion
		//#region src/client/annotator-contract.ts
		/**
		* Resolve one copy key against the injected seat, falling back to the local
		* dictionary. The two-step fallback (`t` then `localeId`) is identical for
		* every body, so it lives here rather than at each call site.
		* @param props - the composed props a body receives.
		* @param key - copy key.
		* @param vars - values interpolated into `{name}` placeholders.
		* @returns the localized string.
		*/
		function resolveTranslate(props, key, vars) {
			return props.t?.(key, vars) ?? fallbackTranslate(props.localeId ?? "zh", key, vars);
		}
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
		/**
		* The last segment of a path, whatever separators it uses.
		* @param path - a POSIX- or Windows-separated path.
		* @returns the path's file name.
		*/
		function baseNameOf(path) {
			return path.slice(Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\")) + 1);
		}
		//#endregion
		//#region src/shared/annotation.ts
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
		* Whether a value is a stroke weight this plugin would write.
		*
		* @param value - the value to test.
		* @returns true when it is one.
		*/
		function isWeight(value) {
			return typeof value === "number" && Number.isFinite(value) && value >= .5 && value <= 8;
		}
		/**
		* Suffix naming one page's files inside a paged document's name.
		* @param page - 1-based page, or undefined for a single-surface figure.
		* @returns the suffix, empty when the figure has no pages.
		*/
		function pageFileSuffix(page) {
			return page === void 0 ? "" : `.p${page}`;
		}
		/**
		* Describe how many pages a paged figure has.
		* @param figure - the annotated figure.
		* @param locale - language of the surrounding message.
		* @returns the scope in words, or an empty string for a single-surface figure.
		*/
		function describeFigureScope(figure, locale) {
			if (figure.pageCount === void 0) return "";
			return locale === "zh" ? `共 ${figure.pageCount} 页` : `${figure.pageCount} pages`;
		}
		/**
		* List the pages that carry at least one mark.
		* @param document - the annotation document.
		* @returns 1-based page numbers, ascending; empty for a single-surface figure.
		*/
		function annotatedPages(document) {
			const pages = /* @__PURE__ */ new Set();
			for (const mark of document.marks) if (mark.page !== void 0) pages.add(mark.page);
			return [...pages].sort((left, right) => left - right);
		}
		/**
		* Whether an annotation needs a picture of the marks to make sense.
		*
		* A `point` mark is one coordinate and a sentence, and the coordinate is already
		* named in the sentence — so a message carrying only point marks needs no rendered
		* image at all: the numbered list *is* the annotation, and the figure's own path is
		* enough to say which picture it concerns. The moment one mark has an extent, the
		* picture is what makes the marks readable, and every mark travels on it.
		*
		* @param document - the annotation document.
		* @returns true when the marks must be delivered as an image.
		*/
		function needsReviewImage(document) {
			return document.marks.some((mark) => mark.kind !== "point");
		}
		/** Round one figure coordinate for model-facing text. */
		function round(value) {
			return Math.round(value);
		}
		/**
		* Write a freehand stroke's extent as the box it was drawn in.
		*
		* The stroke itself is dozens of coordinates, most of which say nothing an agent
		* can act on; the box says where on the figure to look, which is what the reading
		* of the mark needs. `strokeExtents` names the area, and the phrase above it names
		* the mark, so the pair still reads as one line.
		* @param points - the stroke's sampled points.
		* @returns the box as ` (x,y)-(x,y)`, or nothing for an empty stroke.
		*/
		function strokeExtents(points) {
			let left = Number.POSITIVE_INFINITY;
			let top = Number.POSITIVE_INFINITY;
			let right = Number.NEGATIVE_INFINITY;
			let bottom = Number.NEGATIVE_INFINITY;
			for (const [x, y] of points) {
				left = Math.min(left, x);
				top = Math.min(top, y);
				right = Math.max(right, x);
				bottom = Math.max(bottom, y);
			}
			if (!Number.isFinite(left)) return "";
			return ` (${round(left)},${round(top)})-(${round(right)},${round(bottom)})`;
		}
		/**
		* Write two dragged corners as the rectangle they make.
		*
		* A box dragged up and to the left arrives as (bottom-right, top-left), and the
		* agent reading `(187,138)-(42,88)` has to take a min and a max before it knows
		* which area is meant. Both corners are therefore written left-to-right and
		* top-to-bottom, so the same box always reads the same way however it was drawn.
		* @param first - where the drag started.
		* @param second - where it ended.
		* @returns the corner pair as `(x,y)-(x,y)`, or nothing when the mark is unplaced.
		*/
		function extents(first, second) {
			if (first === void 0 || second === void 0) return "";
			return ` (${round(Math.min(first[0], second[0]))},${round(Math.min(first[1], second[1]))})-(${round(Math.max(first[0], second[0]))},${round(Math.max(first[1], second[1]))})`;
		}
		/**
		* Say how far a mark reaches outside the figure, when it does.
		*
		* A negative coordinate is an accurate description — the origin is the figure's
		* top-left corner, so -57 is 57 pixels above it — but a reader has to notice the
		* sign and then reason about what it implies. Naming the overhang outright costs
		* about a dozen characters and removes that step: the agent is told the mark is
		* off the picture and by how much, rather than being left to infer it. A mark that
		* sits inside the figure says nothing at all, which is the common case.
		* @param mark - the mark to measure.
		* @param figure - the figure's size, when the document knows it.
		* @param locale - language of the surrounding message.
		* @returns the sentence fragment to append, or nothing when the mark is inside.
		*/
		function overhang(mark, figure, locale) {
			const { width, height } = figure;
			if (width === void 0 || height === void 0) return "";
			let left = Number.POSITIVE_INFINITY;
			let top = Number.POSITIVE_INFINITY;
			let right = Number.NEGATIVE_INFINITY;
			let bottom = Number.NEGATIVE_INFINITY;
			for (const [x, y] of mark.points) {
				left = Math.min(left, x);
				top = Math.min(top, y);
				right = Math.max(right, x);
				bottom = Math.max(bottom, y);
			}
			const escape = (amount, zhWord, enWord) => {
				const pixels = round(amount);
				if (pixels <= 0) return "";
				return locale === "zh" ? `${zhWord} ${pixels}` : `${enWord} ${pixels}`;
			};
			const escapes = [
				escape(-left, "左", "left"),
				escape(-top, "上", "up"),
				escape(right - width, "右", "right"),
				escape(bottom - height, "下", "down")
			].filter((part) => part !== "");
			if (escapes.length === 0) return "";
			return locale === "zh" ? `（超出图面：${escapes.join("、")} 像素）` : ` (off the figure: ${escapes.join(", ")} px)`;
		}
		/** Describe one mark's shape in words, for the model-facing summary. */
		function describeShape(mark, locale) {
			const [first, second] = mark.points;
			const zh = locale === "zh";
			const turned = mark.rotation === void 0 || mark.rotation === 0 ? "" : zh ? `（旋转 ${Math.round(mark.rotation)}°）` : ` (rotated ${Math.round(mark.rotation)}°)`;
			switch (mark.kind) {
				case "arrow": return first !== void 0 && second !== void 0 ? zh ? `箭头 (${round(first[0])},${round(first[1])}) → (${round(second[0])},${round(second[1])})${turned}` : `arrow (${round(first[0])},${round(first[1])}) → (${round(second[0])},${round(second[1])})${turned}` : zh ? "箭头" : "arrow";
				case "rect": return (zh ? "框选" : "box") + extents(first, second) + turned;
				case "ellipse": return (zh ? "圈选" : "ellipse") + extents(first, second) + turned;
				case "pen": {
					const box = strokeExtents(mark.points);
					return `${zh ? "手绘线" : "freehand stroke"}${box}${turned}`;
				}
				case "point": return first !== void 0 ? zh ? `单点位于 (${round(first[0])},${round(first[1])})` : `at (${round(first[0])},${round(first[1])})` : zh ? "单点" : "a point";
			}
		}
		/** Describe what a mark points at, when the figure exposed an element. */
		function describeAnchor(mark, locale) {
			const anchor = mark.anchor;
			if (anchor === void 0) return "";
			const zh = locale === "zh";
			const parts = [];
			if (anchor.title !== void 0 && anchor.title !== "") parts.push(zh ? `元素标题「${anchor.title}」` : `element title "${anchor.title}"`);
			if (anchor.id !== void 0 && anchor.id !== "") parts.push(zh ? `id=${anchor.id}` : `id=${anchor.id}`);
			if (anchor.text !== void 0 && anchor.text !== "") parts.push(zh ? `元素文字「${anchor.text}」` : `element text "${anchor.text}"`);
			if (anchor.selector !== void 0 && anchor.selector !== "") parts.push(zh ? `选择器 ${anchor.selector}` : `selector ${anchor.selector}`);
			if (parts.length === 0) parts.push(`<${anchor.tag}>`);
			return zh ? `（${parts.join("，")}）` : ` (${parts.join(", ")})`;
		}
		/**
		* Render one mark as a numbered line the model reads.
		*
		* A mark carries one string: what should change here. It is the whole payload —
		* the shape only says where. A mark that says nothing still names its position,
		* so the list stays numbered and the agent can say which mark is mute.
		*
		* @param mark - the mark to describe.
		* @param index - zero-based position in the document, rendered as a circled number.
		* @param locale - language of the surrounding message.
		* @param figure - the figure these marks belong to, when its size is known; a mark
		*   that reaches past it then says so rather than leaving the sign to be noticed.
		* @returns one line of the annotation summary.
		*/
		function describeMark(mark, index, locale, figure) {
			const zh = locale === "zh";
			const marker = [
				"①",
				"②",
				"③",
				"④",
				"⑤",
				"⑥",
				"⑦",
				"⑧",
				"⑨",
				"⑩"
			][index] ?? `${index + 1}.`;
			const page = mark.page === void 0 ? "" : zh ? `第 ${mark.page} 页 ` : `page ${mark.page} `;
			const detail = mark.detail !== void 0 && mark.detail.trim() !== "" ? mark.detail.trim() : "";
			const escape = figure === void 0 ? "" : overhang(mark, figure, locale);
			const parts = [`${marker} ${page}${describeShape(mark, locale)}${describeAnchor(mark, locale)}${escape}`];
			if (detail !== "") parts.push(zh ? `批注：${detail}` : `note: ${detail}`);
			if (detail === "") parts.push(zh ? "（未写说明）" : "(no detail)");
			return parts.join(zh ? "，" : ", ");
		}
		/**
		* Render every mark as the numbered list carried into the Session.
		* @param document - the saved annotation document.
		* @param locale - language of the surrounding message.
		* @returns one line per mark.
		*/
		function describeMarks(document, locale) {
			return document.marks.map((mark, index) => describeMark(mark, index, locale, document.figure));
		}
		//#endregion
		//#region src/shared/figure-kind.ts
		/**
		* Read a path's lower-case suffix without the dot.
		* @param path - file path or name.
		* @returns the suffix, or an empty string when there is none.
		*/
		function suffixOf(path) {
			const name = path.slice(Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\")) + 1);
			const dot = name.lastIndexOf(".");
			return dot <= 0 ? "" : name.slice(dot + 1).toLowerCase();
		}
		/**
		* Media type of one document path.
		* @param path - file path.
		* @returns the media type, or undefined for an unsupported suffix.
		*/
		function figureMediaType(path) {
			switch (suffixOf(path)) {
				case "pdf": return "application/pdf";
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
		//#endregion
		//#region src/client/figure-dom.ts
		/**
		* Element names removed outright before inlining.
		*
		* `use` is deliberately absent. Matplotlib draws every marker, tick, and error-bar
		* cap as a `<use>` pointing at a path in `defs`, so dropping the element erased all
		* of them while leaving the paths behind: the figure looked like it had been drawn
		* without markers, which is the "missing elements" a PNG export does not show. A
		* `<use>` is safe to keep here because it can only clone what is already in the
		* figure — an external target is a reference the `href` rule below strips.
		*/
		const FORBIDDEN_ELEMENTS = [
			"script",
			"foreignObject",
			"iframe",
			"audio",
			"video",
			"animate",
			"set"
		];
		/** Cap on the element text carried into an anchor. */
		const ANCHOR_TEXT_LIMIT$1 = 80;
		/**
		* A rule that makes the browser fetch something from outside the figure.
		*
		* These are dropped from the figure's own `<style>` text. `@import` is the one that
		* matters: it is a network request the browser issues while painting the inlined
		* SVG, and a figure that arrived from a workspace is not allowed to phone home.
		* `url(…)` is left alone because a figure legitimately paints with `url(#clip)` and
		* `url(#gradient)`; a remote one inside `style` is caught by the same check its
		* markup equivalent is, and the export and the panel share this pass.
		*/
		const REMOTE_STYLE_RULES = [/@import\b[^;]*;?/giu, /url\(\s*(['"]?)(?:https?:)?\/\/[^)]*\)/giu];
		/**
		* Strip rules that reach outside the figure from one `<style>` element's text.
		* @param element - the `<style>` element to clean.
		*/
		function stripRemoteStyleRules(element) {
			let text = element.textContent;
			for (const rule of REMOTE_STYLE_RULES) text = text.replace(rule, "");
			element.textContent = text;
		}
		/**
		* Sanitize SVG source for inlining.
		* @param source - the figure's SVG text.
		* @returns the parsed root element, or undefined when the text is not usable SVG.
		*/
		function parseFigureSvg(source) {
			const parsed = new DOMParser().parseFromString(source, "image/svg+xml");
			if (parsed.querySelector("parsererror") !== null) return void 0;
			const root = parsed.documentElement;
			if (root.tagName.toLowerCase() !== "svg") return void 0;
			for (const element of [...root.querySelectorAll(FORBIDDEN_ELEMENTS.join(","))]) element.remove();
			for (const element of [root, ...root.querySelectorAll("*")]) {
				if (element.tagName.toLowerCase() === "style") stripRemoteStyleRules(element);
				for (const attribute of [...element.attributes]) {
					const name = attribute.name.toLowerCase();
					if (name.startsWith("on")) {
						element.removeAttribute(attribute.name);
						continue;
					}
					if (name === "href" || name === "xlink:href") {
						const value = attribute.value.trim().toLowerCase();
						if (!value.startsWith("#") && !value.startsWith("data:")) element.removeAttribute(attribute.name);
					}
				}
			}
			return root;
		}
		/**
		* Serialize a sanitized figure for the export canvas.
		* @param root - sanitized root from {@link parseFigureSvg}.
		* @returns the SVG markup.
		*/
		function figureSvgMarkup(root) {
			return new XMLSerializer().serializeToString(root);
		}
		/**
		* Read one inline SVG's own size.
		* @param root - sanitized root element.
		* @returns the width/height from its attributes or viewBox, defaulting to 800x600.
		*/
		function svgIntrinsicSize(root) {
			const attributeWidth = Number.parseFloat(root.getAttribute("width") ?? "");
			const attributeHeight = Number.parseFloat(root.getAttribute("height") ?? "");
			if (Number.isFinite(attributeWidth) && Number.isFinite(attributeHeight) && attributeWidth > 0 && attributeHeight > 0) return {
				width: attributeWidth,
				height: attributeHeight
			};
			const viewBox = (root.getAttribute("viewBox") ?? "").split(/[\s,]+/).map(Number);
			const [, , boxWidth, boxHeight] = viewBox;
			if (viewBox.length === 4 && boxWidth !== void 0 && boxHeight !== void 0 && Number.isFinite(boxWidth) && Number.isFinite(boxHeight) && boxWidth > 0 && boxHeight > 0) return {
				width: boxWidth,
				height: boxHeight
			};
			return {
				width: 800,
				height: 600
			};
		}
		/** The `viewBox` an inline figure renders under. */
		function svgViewBox(root, fallback) {
			const declared = root.getAttribute("viewBox");
			if (declared !== null && declared.trim() !== "") return declared;
			return `0 0 ${fallback.width} ${fallback.height}`;
		}
		/** Shape elements that carry no area of their own. */
		const NON_SHAPE_ELEMENTS = [
			"title",
			"desc",
			"defs",
			"metadata",
			"style",
			"script"
		];
		/** How deep an element sits below the figure container. */
		function depthBelow$1(element, container) {
			let depth = 0;
			for (let node = element.parentElement; node !== null && node !== container; node = node.parentElement) depth += 1;
			return depth;
		}
		/**
		* Whether an element sits inside a subtree that never renders.
		*
		* `defs`, `metadata`, and friends carry geometry that is never painted, so a
		* bounding box found there is not something the user can be pointing at.
		* @param element - candidate element.
		* @param root - the figure root the walk stops at.
		* @returns true when the element draws nothing.
		*/
		function isNonRendered(element, root) {
			for (let node = element; node !== null && node !== root; node = node.parentElement) if (NON_SHAPE_ELEMENTS.includes(node.tagName.toLowerCase())) return true;
			return false;
		}
		/**
		* Describe the figure element under one client-space point.
		*
		* Hit testing walks every descendant's bounding box rather than asking the
		* browser what is under the pointer: a patent figure is mostly unfilled strokes,
		* and an element with `fill="none"` is not hit in its interior, so a browser hit
		* test answers the figure root for most of the drawing. The smallest containing
		* box wins, and the answer is then re-pointed at the nearest ancestor that names
		* itself (`id` or `<title>`, which is how a Graphviz node identifies itself).
		* @param container - element holding the inline figure, used as the coordinate origin.
		* @param clientX - pointer x in client space.
		* @param clientY - pointer y in client space.
		* @param scaleX - figure pixels per client pixel horizontally.
		* @param scaleY - figure pixels per client pixel vertically.
		* @returns the anchor, or undefined when the point names no figure element.
		*/
		function anchorAtPoint(container, clientX, clientY, scaleX, scaleY) {
			const root = container.querySelector("svg");
			if (root === null) return void 0;
			let hit;
			let hitArea = Number.POSITIVE_INFINITY;
			let hitDepth = -1;
			for (const element of root.querySelectorAll("*")) {
				if (isNonRendered(element, root)) continue;
				const rect = element.getBoundingClientRect();
				if (rect.width === 0 || rect.height === 0) continue;
				if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) continue;
				const area = rect.width * rect.height;
				const depth = depthBelow$1(element, container);
				if (area < hitArea || area === hitArea && depth > hitDepth) {
					hit = element;
					hitArea = area;
					hitDepth = depth;
				}
			}
			if (hit === void 0) return void 0;
			let described = hit;
			for (let node = hit; node !== null && node !== container; node = node.parentElement) if (node.id !== "" || node.querySelector(":scope > title") !== null) {
				described = node;
				break;
			}
			const rect = described.getBoundingClientRect();
			const containerRect = container.getBoundingClientRect();
			const title = described.querySelector(":scope > title")?.textContent?.trim();
			const text = described.textContent.trim().replace(/\s+/g, " ").slice(0, ANCHOR_TEXT_LIMIT$1);
			return {
				tag: described.tagName.toLowerCase(),
				bbox: [
					(rect.left - containerRect.left) * scaleX,
					(rect.top - containerRect.top) * scaleY,
					rect.width * scaleX,
					rect.height * scaleY
				],
				...described.id === "" ? {} : { id: described.id },
				...title === void 0 || title === "" ? {} : { title },
				...text === "" ? {} : { text }
			};
		}
		//#endregion
		//#region src/client/mark-geometry.ts
		/**
		* Whether two point lists describe exactly the same geometry.
		* @param before - one list of points, in figure pixels.
		* @param after - the other list.
		* @returns true when both lists are the same length and every point matches.
		*/
		function samePoints(before, after) {
			if (before.length !== after.length) return false;
			for (let index = 0; index < before.length; index += 1) {
				const one = before[index];
				const other = after[index];
				if (one === void 0 || other === void 0) return false;
				if (one[0] !== other[0] || one[1] !== other[1]) return false;
			}
			return true;
		}
		/**
		* Move a point list by one offset.
		* @param points - the geometry to move, in figure pixels.
		* @param dx - horizontal offset.
		* @param dy - vertical offset.
		* @returns every point, moved.
		*/
		function shiftPoints(points, dx, dy) {
			return points.map((point) => [point[0] + dx, point[1] + dy]);
		}
		/**
		* One mark's geometry replaced, and its anchor replaced with it.
		*
		* The anchor describes what the mark points at, so it cannot outlive the
		* position it was recorded at: a drop that landed on nothing clears it rather
		* than leaving the mark claiming to name something it no longer points at.
		* @param mark - the mark to move.
		* @param points - the geometry it was dropped at, in figure pixels.
		* @param anchor - what the drop point landed on, or undefined when nothing.
		* @returns the mark at its new geometry.
		*/
		function withGeometry(mark, points, anchor) {
			const next = {
				...mark,
				points
			};
			if (anchor === void 0) delete next.anchor;
			else next.anchor = anchor;
			return next;
		}
		/**
		* Where a drag leaves the mark list.
		*
		* Null when the drop asks for nothing: a mark that is not in the list, or a
		* gesture that ends at the geometry the mark already had. Those are not edits,
		* and the caller must not record an undo step for them.
		* @param marks - the marks the surface is showing.
		* @param id - the mark the drag moved.
		* @param points - the geometry it was dropped at, in figure pixels.
		* @param anchor - what the drop point landed on, or undefined when nothing.
		* @returns the list to commit, or null when the drag changed nothing.
		*/
		function draggedMarks(marks, id, points, anchor) {
			const before = marks.find((mark) => mark.id === id);
			if (before === void 0) return null;
			if (samePoints(before.points, points)) return null;
			return marks.map((mark) => mark.id === id ? withGeometry(mark, points, anchor) : mark);
		}
		/**
		* The axis-aligned box a point list occupies.
		*
		* Every mark's control frame is measured from this box: its handles sit on its
		* corners, and its rotation turns around its centre — so a mark with no points
		* has neither, and says so.
		* @param points - the mark's geometry, in figure pixels.
		* @returns the box, or undefined when there is no point to measure.
		*/
		function markBounds(points) {
			const first = points[0];
			if (first === void 0) return void 0;
			let left = first[0];
			let right = first[0];
			let top = first[1];
			let bottom = first[1];
			for (const point of points) {
				left = Math.min(left, point[0]);
				right = Math.max(right, point[0]);
				top = Math.min(top, point[1]);
				bottom = Math.max(bottom, point[1]);
			}
			return {
				x: left,
				y: top,
				width: right - left,
				height: bottom - top
			};
		}
		/**
		* The box a mark covers on screen, once its rotation is applied.
		*
		* A turned box covers more than its own corners do, and a label placed from the
		* un-rotated box would land on top of the shape it describes. This is the extent
		* a reader actually sees.
		* @param points - the mark's geometry, in figure pixels.
		* @param rotation - its clockwise rotation in degrees.
		* @returns the axis-aligned box the rotated mark occupies.
		*/
		function uprightBounds(points, rotation) {
			const box = markBounds(points);
			if (box === void 0) return void 0;
			const radians = rotation * Math.PI / 180;
			if (radians === 0) return box;
			const centre = boxCentre(box);
			return markBounds([
				[box.x, box.y],
				[box.x + box.width, box.y],
				[box.x + box.width, box.y + box.height],
				[box.x, box.y + box.height]
			].map((corner) => rotateAround(corner, centre, radians)));
		}
		/**
		* The centre of a box, which is where its mark turns.
		* @param box - the box.
		* @returns its centre point.
		*/
		function boxCentre(box) {
			return [box.x + box.width / 2, box.y + box.height / 2];
		}
		/**
		* Turn one point around a centre.
		* @param point - the point to turn.
		* @param centre - what it turns around.
		* @param radians - clockwise angle in radians.
		* @returns the turned point.
		*/
		function rotateAround(point, centre, radians) {
			if (radians === 0) return point;
			const sin = Math.sin(radians);
			const cos = Math.cos(radians);
			const dx = point[0] - centre[0];
			const dy = point[1] - centre[1];
			return [centre[0] + dx * cos - dy * sin, centre[1] + dx * sin + dy * cos];
		}
		180 / Math.PI;
		/**
		* A mark's rotation in radians.
		* @param mark - the mark; a mark without a rotation is upright.
		* @returns the clockwise angle in radians.
		*/
		function markRadians(mark) {
			return (mark.rotation ?? 0) * Math.PI / 180;
		}
		/**
		* Fold an angle into one turn, so a stored rotation never grows without bound.
		* @param degrees - an angle in degrees.
		* @returns the same angle in `[0, 360)`.
		*/
		function normalizeDegrees(degrees) {
			const folded = degrees % 360;
			return folded < 0 ? folded + 360 : folded;
		}
		/**
		* Restate a point list so a chosen point lands where it was before the edit.
		*
		* Changing a mark's geometry moves the centre it turns around, which swings the
		* rest of the mark — grabbing one corner of a tilted box would otherwise drag the
		* opposite corner away. Re-anchoring on the point that must not move is what makes
		* a handle feel attached to the shape.
		* @param points - the new geometry, before compensation.
		* @param rotation - the mark's rotation in radians.
		* @param anchor - the point that must stay where it is, in the new geometry's frame.
		* @param wasCentre - the centre the mark turned around before the edit.
		* @returns the geometry, translated so `anchor` did not move on screen.
		*/
		function keepAnchored(points, rotation, anchor, wasCentre) {
			const box = markBounds(points);
			/* v8 ignore next -- every caller passes a point list it just built from a box. */
			if (box === void 0) return points;
			const now = rotateAround(anchor, boxCentre(box), rotation);
			const was = rotateAround(anchor, wasCentre, rotation);
			const dx = was[0] - now[0];
			const dy = was[1] - now[1];
			if (dx === 0 && dy === 0) return points;
			return shiftPoints(points, dx, dy);
		}
		//#endregion
		//#region src/client/handles.ts
		/** Every handle, in the order a renderer walks them. */
		const HANDLE_IDS = [
			"nw",
			"n",
			"ne",
			"e",
			"se",
			"s",
			"sw",
			"w"
		];
		/**
		* The unit directions two opposite edges of a box lie in.
		* @param id - a box handle.
		* @returns which sides it moves: `-1` is the low side, `1` the high side, `0` neither.
		*/
		function edgesOf(id) {
			switch (id) {
				case "nw": return {
					x: -1,
					y: -1
				};
				case "n": return {
					x: 0,
					y: -1
				};
				case "ne": return {
					x: 1,
					y: -1
				};
				case "e": return {
					x: 1,
					y: 0
				};
				case "se": return {
					x: 1,
					y: 1
				};
				case "s": return {
					x: 0,
					y: 1
				};
				case "sw": return {
					x: -1,
					y: 1
				};
				case "w": return {
					x: -1,
					y: 0
				};
			}
		}
		/**
		* Where every handle around one box sits.
		*
		* The handle positions are computed in the mark's own upright frame and then
		* turned around its centre, so they land exactly on the outline the overlay
		* draws for the same rotation.
		* @param box - the box to frame, in figure pixels.
		* @param rotation - the mark's rotation in degrees.
		* @returns the handles.
		*/
		function handlesFor(box, rotation, size = 7) {
			const centre = boxCentre(box);
			const radians = rotation * Math.PI / 180;
			const at = (x, y) => rotateAround([x, y], centre, radians);
			const right = box.x + box.width;
			const bottom = box.y + box.height;
			const placed = HANDLE_IDS.map((id) => {
				const edges = edgesOf(id);
				const x = edges.x === -1 ? box.x : edges.x === 1 ? right : centre[0];
				const y = edges.y === -1 ? box.y : edges.y === 1 ? bottom : centre[1];
				return {
					id,
					point: at(x, y)
				};
			});
			placed.push({
				id: "rotate",
				point: at(centre[0], box.y - armFor(size))
			});
			return placed;
		}
		/**
		* How far the turn handle stands off the top edge, for a handle of a given size.
		*
		* Proportional to the handle: a bigger grip on a short arm would have the circle
		* overlapping the corner squares, and a smaller one on a long arm would look
		* detached from the frame it turns.
		* @param size - the handle's side, in figure pixels.
		* @returns the distance from the top edge, in figure pixels.
		*/
		function armFor(size) {
			return size * (22 / 7);
		}
		/**
		* The line that ties the rotation handle to the box it turns.
		*
		* It reads as attached to the mark only because it is anchored on the top edge
		* itself, so both ends come from the same frame the handles are placed in.
		* @param box - the box to frame, in figure pixels.
		* @param rotation - the mark's rotation in degrees.
		* @returns the two ends of the tether, from the turn handle to the top edge.
		*/
		function tetherFor(box, rotation, size = 7) {
			const centre = boxCentre(box);
			const radians = rotation * Math.PI / 180;
			return {
				from: rotateAround([centre[0], box.y - armFor(size)], centre, radians),
				to: rotateAround([centre[0], box.y], centre, radians)
			};
		}
		/**
		* Which handle a press grabbed, if any.
		* @param box - the box the control frame is drawn around.
		* @param rotation - the mark's rotation in degrees.
		* @param at - the press position, in figure pixels.
		* @param reach - how far from a handle's centre still counts, in figure pixels.
		* @returns the handle grabbed, or undefined for a press on the mark itself.
		*/
		function handleAt(box, rotation, at, reach = 7, size = 7) {
			let best;
			let bestDistance = reach;
			for (const handle of handlesFor(box, rotation, size)) {
				const distance = Math.hypot(handle.point[0] - at[0], handle.point[1] - at[1]);
				if (distance <= bestDistance) {
					best = handle.id;
					bestDistance = distance;
				}
			}
			return best;
		}
		/**
		* Resize a mark by dragging one of its box handles.
		*
		* The drag happens in the mark's own frame: the pointer is turned back by the
		* mark's rotation so a tilted box grows along its own axes rather than the
		* screen's. The handle opposite the one held is the fixed point, which is what
		* makes the shape appear to grow from the edge the user is not touching; the
		* result is then re-anchored so that corner does not drift when the centre — and
		* with it the rotation — moves.
		*
		* @param request - the handle, the pointer, and the geometry it started from.
		* @returns the resized geometry, in figure pixels.
		*/
		function resizeBy(request) {
			const { handle, at, origin, rotation } = request;
			const box = markBounds(origin);
			/* v8 ignore next -- the surface only offers handles for a mark that has a box. */
			if (box === void 0) return origin;
			const centre = boxCentre(box);
			const radians = markRadians({ rotation });
			const local = rotateAround(at, centre, -radians);
			const edges = edgesOf(handle);
			const right = box.x + box.width;
			const bottom = box.y + box.height;
			const movesX = edges.x !== 0 && box.width > 0;
			const movesY = edges.y !== 0 && box.height > 0;
			const left = movesX && edges.x === -1 ? Math.min(local[0], right - 6) : box.x;
			const top = movesY && edges.y === -1 ? Math.min(local[1], bottom - 6) : box.y;
			const nextRight = movesX && edges.x === 1 ? Math.max(local[0], box.x + 6) : right;
			const nextBottom = movesY && edges.y === 1 ? Math.max(local[1], box.y + 6) : bottom;
			return keepAnchored(scalePoints(origin, box, {
				x: left,
				y: top,
				width: nextRight - left,
				height: nextBottom - top
			}), radians, [edges.x === 1 ? box.x : right, edges.y === 1 ? box.y : bottom], centre);
		}
		/**
		* Map every point from one box into another, proportionally.
		*
		* A mark is its points, so resizing them is what resizing the mark means — and
		* mapping rather than rebuilding keeps a freehand stroke's own shape.
		* @param points - the geometry to map.
		* @param from - the box it currently fills.
		* @param to - the box it should fill.
		* @returns the mapped geometry.
		*/
		function scalePoints(points, from, to) {
			const scaleX = from.width === 0 ? 1 : to.width / from.width;
			const scaleY = from.height === 0 ? 1 : to.height / from.height;
			return points.map((point) => [to.x + (point[0] - from.x) * scaleX, to.y + (point[1] - from.y) * scaleY]);
		}
		/**
		* The rotation a drag of the rotation handle asks for.
		*
		* The angle is measured from the mark's centre to the pointer, offset by the
		* quarter turn between "up" and the handle's own resting position, so the handle
		* stays under the pointer as the mark turns. Holding Shift snaps to 15° steps.
		*
		* @param centre - the mark's centre, in figure pixels.
		* @param at - the pointer, in figure pixels.
		* @param snap - whether to snap to 15° steps.
		* @returns the clockwise rotation in degrees, in `[0, 360)`.
		*/
		function rotationTo(centre, at, snap) {
			const degrees = normalizeDegrees((Math.atan2(at[1] - centre[1], at[0] - centre[0]) + Math.PI / 2) * 180 / Math.PI);
			return snap ? normalizeDegrees(Math.round(degrees / 15) * 15) : degrees;
		}
		const CURSORS = {
			nw: "nwse-resize",
			n: "ns-resize",
			ne: "nesw-resize",
			e: "ew-resize",
			se: "nwse-resize",
			s: "ns-resize",
			sw: "nesw-resize",
			w: "ew-resize",
			rotate: `url("data:image/svg+xml,${encodeURIComponent("<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\"><g fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M17.5 7.5A7 7 0 1 1 8.6 6.1\" stroke=\"#ffffff\" stroke-width=\"4.4\"/><path d=\"M17.5 7.5A7 7 0 1 1 8.6 6.1\" stroke=\"#2d2d2d\" stroke-width=\"2\"/><path d=\"M15.2 3.1L18.6 8.2L12.9 8.9\" stroke=\"#ffffff\" stroke-width=\"4.4\"/><path d=\"M15.2 3.1L18.6 8.2L12.9 8.9\" stroke=\"#2d2d2d\" stroke-width=\"2\"/></g></svg>")}") 12 12, crosshair`
		};
		/**
		* The mouse cursor for one handle.
		* @param id - the handle.
		* @returns a CSS cursor keyword.
		*/
		function cursorFor(id) {
			return CURSORS[id];
		}
		//#endregion
		//#region src/client/render.ts
		/** Stroke width of a mark drawn at weight 1 on a reference-sized figure, in pixels. */
		const STROKE_WIDTH = 2.5;
		/**
		* The stroke width one mark is drawn at.
		*
		* A mark's weight is a multiple of {@link STROKE_WIDTH}, so the default is the
		* width marks have always had and a heavier mark is the same drawing with a
		* thicker pen. The arrow's barbs are weighed by the same multiple, because an
		* arrow drawn with a thick pen has a thick head.
		*
		* The figure's own unit multiplies everything drawn on it, so the same mark is a
		* bold line on a thumbnail and a hairline on a scan — see `./scale`.
		*
		* @param mark - the mark to weigh.
		* @param unit - the figure's size multiple, 1 for a reference-sized figure.
		* @returns its stroke width in figure pixels.
		*/
		function strokeWidthOf(mark, unit = 1) {
			return STROKE_WIDTH * (mark.weight ?? 1) * unit;
		}
		/** Arrow head length, in figure pixels. */
		const ARROW_HEAD = 14;
		/** Half-angle of the arrow head, in radians. */
		const ARROW_SPREAD = Math.PI / 7;
		/**
		* Half-width of one pin's head, in figure pixels.
		*
		* A pin is a marker the reader compares against the line work, so it is sized like a
		* stroke: by the figure's unit and by the mark's own weight. The weight is reused
		* rather than given its own field because it already means "how big this mark is" to
		* the reader, and one rail on the left is enough — a stroke and a pin are never the
		* same mark, so the one number never has to mean two things at once.
		* @param mark - the point mark.
		* @param unit - the figure's size multiple.
		* @returns its head's half-width in figure pixels.
		*/
		function pinRadiusOf(mark, unit = 1) {
			return 10 * (mark.weight ?? 1) * unit;
		}
		/**
		* How far a pin's head sits above its coordinate, as a multiple of its half-width.
		*
		* A map pin puts its *tip* on the coordinate it names, so the head stands clear of
		* the spot rather than covering it: the coordinate is the precision the mark claims,
		* and a body centred there would hide exactly the pixel it means. Kept under two
		* half-widths so the drop sits *wide* on the figure — a tall pin reads as a flag on
		* a pole and covers the line work above its point.
		*/
		const PIN_LIFT = 1.6;
		/** How far down the pin's sides bow out before reaching its point, as a fraction of the lift. */
		const PIN_BELLY = .6;
		/**
		* Where the pin's sides leave its head, as a fraction of the head's half-width.
		*
		* Slightly inboard of the widest point, which is what gives a teardrop its shoulders
		* instead of a circle on a stick.
		*/
		const PIN_SHOULDER = .88;
		/** The font a pin's number is drawn in. */
		const PIN_FONT_FAMILY = "Helvetica, Arial, sans-serif";
		/**
		* The colour of the number inside a pin.
		*
		* White on the mark's own colour: a pin is a filled shape, so the number sits on a
		* solid ground rather than on the figure, and white is the one value that reads on
		* every colour the palette offers.
		*/
		const PIN_NUMBER_COLOR = "#ffffff";
		/**
		* Font size of the number inside a pin, in figure pixels.
		*
		* Scaled by the mark's weight as well as the figure: the rail that makes a pin bigger
		* makes its head bigger, and a head that grows around a fixed-size numeral reads as a
		* circle with a speck in it. The number is the pin's whole payload, so it keeps the
		* same share of the head at every size.
		* @param mark - the point mark whose pin is being drawn.
		* @param unit - the figure's size multiple.
		* @returns the font size to draw the number at.
		*/
		function pinFontSizeOf(mark, unit = 1) {
			return 11 * (mark.weight ?? 1) * unit;
		}
		/** Normalize two opposite corners into a top-left origin and positive extents. */
		function bounds(first, second) {
			return {
				x: Math.min(first[0], second[0]),
				y: Math.min(first[1], second[1]),
				width: Math.abs(second[0] - first[0]),
				height: Math.abs(second[1] - first[1])
			};
		}
		/** Round a coordinate for compact path data. */
		function n(value) {
			return (Math.round(value * 10) / 10).toString();
		}
		/**
		* The box a run of points covers.
		* @param points - the points to measure.
		* @returns the box, or undefined when there is no point.
		*/
		function pointsBox(points) {
			const first = points[0];
			if (first === void 0) return void 0;
			let left = first[0];
			let right = first[0];
			let top = first[1];
			let bottom = first[1];
			for (const point of points) {
				left = Math.min(left, point[0]);
				right = Math.max(right, point[0]);
				top = Math.min(top, point[1]);
				bottom = Math.max(bottom, point[1]);
			}
			return {
				x: left,
				y: top,
				width: right - left,
				height: bottom - top
			};
		}
		/**
		* The coordinates an arrow's head reaches to.
		*
		* An arrow is drawn with two barbs behind its tip, so its two points do not bound
		* what is drawn: the barbs can stand out well past the shaft. Everything that needs
		* the arrow's real extent — its outline, its hit area, its export box —
		* reads the barbs from here rather than from the stored points.
		*
		* @param points - the arrow's tail and tip.
		* @returns tail, tip and both barbs; the stored points alone when it is half drawn.
		*/
		function arrowBarbs(points, weight = 1, unit = 1) {
			const [first, second] = points;
			if (first === void 0 || second === void 0) return points;
			const angle = Math.atan2(second[1] - first[1], second[0] - first[0]);
			const head = ARROW_HEAD * weight * unit;
			const left = [second[0] - head * Math.cos(angle - ARROW_SPREAD), second[1] - head * Math.sin(angle - ARROW_SPREAD)];
			const right = [second[0] - head * Math.cos(angle + ARROW_SPREAD), second[1] - head * Math.sin(angle + ARROW_SPREAD)];
			return [
				...points,
				left,
				right
			];
		}
		/**
		* SVG path data for one mark's stroke.
		* @param mark - the mark to render.
		* @returns path data, or undefined for a `point` mark (which draws as a pin).
		*/
		function markPathData(mark) {
			const [first, second] = mark.points;
			if (first === void 0) return void 0;
			switch (mark.kind) {
				case "arrow": {
					if (second === void 0) return void 0;
					const [left, right] = arrowBarbs(mark.points, mark.weight ?? 1).slice(2);
					return `M ${n(first[0])} ${n(first[1])} L ${n(second[0])} ${n(second[1])} M ${n(left[0])} ${n(left[1])} L ${n(second[0])} ${n(second[1])} L ${n(right[0])} ${n(right[1])}`;
				}
				case "rect": {
					if (second === void 0) return void 0;
					const box = bounds(first, second);
					return `M ${n(box.x)} ${n(box.y)} H ${n(box.x + box.width)} V ${n(box.y + box.height)} H ${n(box.x)} Z`;
				}
				case "ellipse": {
					if (second === void 0) return void 0;
					const box = bounds(first, second);
					const rx = box.width / 2;
					const ry = box.height / 2;
					const cx = box.x + rx;
					const cy = box.y + ry;
					if (rx === 0 || ry === 0) return `M ${n(box.x)} ${n(box.y)} L ${n(box.x + box.width)} ${n(box.y + box.height)}`;
					return `M ${n(cx - rx)} ${n(cy)} a ${n(rx)} ${n(ry)} 0 1 0 ${n(rx * 2)} 0 a ${n(rx)} ${n(ry)} 0 1 0 ${n(-rx * 2)} 0`;
				}
				case "pen": {
					const segments = mark.points.slice(1).map((point) => `L ${n(point[0])} ${n(point[1])}`);
					return [`M ${n(first[0])} ${n(first[1])}`, ...segments].join(" ");
				}
				case "point": return;
			}
		}
		/**
		* The marker for one `point` mark, or undefined when it carries no coordinate.
		*
		* The body stands above the point. A mark placed near the top of the figure would
		* then hang its body outside the picture, so the marker turns over and stands below
		* instead: the point still names the spot, and the body is still inside the frame.
		*
		* @param mark - the point mark.
		* @returns the marker's path, number centre and box, or undefined with no coordinate.
		*/
		function pinGeometry(mark, unit = 1) {
			const tip = mark.points[0];
			if (tip === void 0) return void 0;
			const radius = pinRadiusOf(mark, unit);
			const lift = radius * PIN_LIFT;
			const [tipX, tipY] = tip;
			const up = tipY - lift - radius >= 0;
			const side = up ? -1 : 1;
			const centreY = tipY + side * lift;
			const shoulder = radius * PIN_SHOULDER;
			const belly = lift * PIN_BELLY;
			const away = (value) => tipY + side * value;
			const path = [
				`M ${n(tipX)} ${n(tipY)}`,
				`Q ${n(tipX - shoulder)} ${n(away(belly))} ${n(tipX - radius)} ${n(centreY)}`,
				`A ${n(radius)} ${n(radius)} 0 1 ${up ? 1 : 0} ${n(tipX + radius)} ${n(centreY)}`,
				`Q ${n(tipX + shoulder)} ${n(away(belly))} ${n(tipX)} ${n(tipY)}`,
				"Z"
			].join(" ");
			const top = Math.min(centreY - radius, tipY);
			const bottom = Math.max(centreY + radius, tipY);
			return {
				path,
				number: [tipX, centreY],
				box: {
					x: tipX - radius,
					y: top,
					width: radius * 2,
					height: bottom - top
				}
			};
		}
		/**
		* SVG path data for a `point` mark's marker.
		* @param mark - the point mark.
		* @returns path data, or undefined when the mark carries no coordinate.
		*/
		function pinPathData(mark, unit = 1) {
			return pinGeometry(mark, unit)?.path;
		}
		/**
		* Where the number inside a `point` mark's marker sits.
		* @param mark - the point mark.
		* @returns the number's centre, or undefined when the mark carries no coordinate.
		*/
		function pinNumberCentre(mark, unit = 1) {
			return pinGeometry(mark, unit)?.number;
		}
		/**
		* The box a `point` mark's pin covers.
		*
		* A point mark is one coordinate and no extent, so it is framed by the pin standing
		* on it rather than by any geometry of its own. Everything that needs a box for a
		* point mark — its hit area, its control frame, anything that has to keep clear of it — reads it
		* from here, so they cannot disagree about how big the target is.
		*
		* @param mark - the point mark.
		* @returns the pin's box, or undefined when the mark carries no point.
		*/
		function pointMarkBox(mark, unit = 1) {
			return pinGeometry(mark, unit)?.box;
		}
		/**
		* The box a mark covers once it is drawn, rotation included.
		*
		* This is what the overlay hit-tests against and what a popover keeps clear of, so
		* it is the *drawn* extent, not the stored points: an arrow's barbs stand out past its
		* tip, a stroke is half its width wide on each side of its path, and a turned box
		* occupies the box its corners sweep.
		*
		* @param mark - the mark to measure.
		* @returns the box, or undefined when the mark carries no coordinate.
		*/
		function markOutline(mark, unit = 1) {
			if (mark.kind === "point") return pointMarkBox(mark, unit);
			const geometry = mark.kind === "arrow" ? arrowBarbs(mark.points, mark.weight ?? 1, unit) : mark.points;
			const straight = pointsBox(geometry);
			if (straight === void 0) return void 0;
			const radians = markRadians(mark);
			const box = radians === 0 ? straight : turnedBox(geometry, straight, radians);
			const grow = strokeWidthOf(mark, unit) / 2;
			return {
				x: box.x - grow,
				y: box.y - grow,
				width: box.width + grow * 2,
				height: box.height + grow * 2
			};
		}
		/**
		* The box points cover once they are turned, as a mark's rotation turns them.
		*
		* The centre they turn around is their own box's, which is also the centre the
		* control frame puts its rotation handle at, so the frame and the drawing agree about
		* where a turned mark sits.
		*
		* @param points - the points to turn.
		* @param box - the box the points cover, whose centre they turn around.
		* @param radians - clockwise angle in radians.
		* @returns the box the turned points cover.
		*/
		function turnedBox(points, box, radians) {
			const cos = Math.cos(radians);
			const sin = Math.sin(radians);
			const centreX = box.x + box.width / 2;
			const centreY = box.y + box.height / 2;
			const turned = points.map((point) => {
				const dx = point[0] - centreX;
				const dy = point[1] - centreY;
				return [centreX + dx * cos - dy * sin, centreY + dx * sin + dy * cos];
			});
			const first = turned[0];
			/* v8 ignore next -- reached only for an empty run, which the caller has excluded. */
			if (first === void 0) return box;
			let left = first[0];
			let right = first[0];
			let top = first[1];
			let bottom = first[1];
			for (const point of turned) {
				left = Math.min(left, point[0]);
				right = Math.max(right, point[0]);
				top = Math.min(top, point[1]);
				bottom = Math.max(bottom, point[1]);
			}
			return {
				x: left,
				y: top,
				width: right - left,
				height: bottom - top
			};
		}
		/**
		* The SVG transform that turns a mark to its own rotation.
		*
		* Rotation is stored as an angle, not baked into every point: a box that was
		* turned stays a box, so its handles still know what shape they belong to. The
		* centre it turns around is its bounding box's, which is also where the control
		* frame puts its rotation handle.
		*
		* A `point` mark has no extent, so turning it would mean nothing; it never
		* carries a rotation and this returns undefined for it.
		*
		* @param mark - the mark to place.
		* @returns a `rotate(…)` transform, or undefined when the mark is upright.
		*/
		function markTransform(mark) {
			if (mark.kind === "point") return void 0;
			const box = markBounds(mark.points);
			const radians = markRadians(mark);
			if (box === void 0 || radians === 0) return void 0;
			const cx = box.x + box.width / 2;
			const cy = box.y + box.height / 2;
			return `rotate(${n(radians * 180 / Math.PI)} ${n(cx)} ${n(cy)})`;
		}
		/**
		* Smallest multiple of the base sizes, for figures far below the reference.
		*
		* Low enough that a matplotlib SVG — which measures itself in points, ~283 wide for
		* the same figure a PNG exports at 1179px — is still scaled down rather than propped
		* up to the old floor. The floor is a guard against division, not a design choice:
		* a figure below ~240px is one nothing sensible is drawn on.
		*/
		const MIN_UNIT = .2;
		/**
		* The size everything drawn on a figure is multiplied by.
		*
		* Measured against the figure's longer edge: that is the dimension a reader judges
		* a stroke against, and using the area would shrink a tall thin panel's marks for a
		* reason the eye does not see.
		* @param width - the figure's intrinsic width, in figure pixels.
		* @param height - the figure's intrinsic height, in figure pixels.
		* @returns the multiple of the base sizes, held inside {@link MIN_UNIT} and {@link MAX_UNIT}.
		*/
		function figureUnit(width, height) {
			const edge = Math.max(width, height);
			if (!Number.isFinite(edge) || edge <= 0) return 1;
			return Math.min(10, Math.max(MIN_UNIT, edge / 800));
		}
		//#endregion
		//#region src/client/Canvas.tsx
		/**
		* The drawing surface.
		*
		* It renders the marks over the figure and turns pointer input into marks. Every
		* shape is committed as a mark the parent owns; the component keeps only the mark
		* currently being drawn. Coordinates are always figure pixels, so the same mark
		* means the same thing at any zoom or pane width.
		* @module dsh-figmark/client/Canvas
		*/
		/**
		* The `weight` field of a new mark, or nothing when it is the default.
		*
		* Absent means the default throughout this plugin, so writing `weight: 1` would put
		* a field into every mark that says nothing — sidecars would grow a key for every
		* mark ever drawn, and every comparison of two documents would see a difference
		* where there is none.
		* @param weight - the weight the next stroke is drawn at.
		* @returns the field, or an empty object for the default.
		*/
		function weightField(weight) {
			return weight === 1 ? {} : { weight };
		}
		/** Hit width of an invisible selection stroke, in figure pixels. */
		const HIT_WIDTH = 14;
		/** Minimum distance between recorded freehand samples, in figure pixels. */
		const PEN_SAMPLE_STEP = 3;
		/** Reach of a handle's hit area, in figure pixels: generous enough to grab. */
		/** How far from a handle's centre a press still counts, as a multiple of its side. */
		const HANDLE_REACH = 2.2;
		/** Monotonic id source for marks created in this session. */
		let markSeq = 0;
		/**
		* Mint a mark id.
		* @returns an id unique within the loaded document.
		*/
		function nextMarkId() {
			markSeq += 1;
			return `m${Date.now().toString(36)}-${markSeq}`;
		}
		/**
		* Draw the marks and collect pointer input.
		* @param props - figure geometry, marks, tool state, and callbacks.
		* @returns the overlay element.
		*/
		function Canvas(props) {
			const { width, height, marks, tool, color, containerRef, anchoring } = props;
			const [originX, originY] = props.origin ?? [0, 0];
			const weight = props.weight ?? 1;
			/**
			* Each mark's number, by id.
			*
			* A page's marks are drawn from a slice of the document's list, so the numbers
			* come from the document when it supplies them and from the slice's own order
			* otherwise.
			*/
			const numbers = new Map(marks.map((mark, index) => [mark.id, props.numbering?.get(mark.id) ?? index + 1]));
			/**
			* How big everything is drawn here, as a multiple of the base sizes.
			*
			* Derived from the surface rather than passed in: every mark on this canvas shares
			* one figure, so one number decides the pen for all of them, and a caller that
			* forgot to thread it through could not make a mark disagree with its hit area.
			*/
			const unit = figureUnit(width, height);
			const [draft, setDraft] = (0, react.useState)(null);
			const [press, setPress] = (0, react.useState)(null);
			const drawing = (0, react.useRef)(false);
			/**
			* Where the pointer was on the last frame of a pan, in client pixels.
			*
			* A pan is a stream of moves like a pinch is: the view has to follow the hand
			* frame by frame, so the travel is measured against the previous frame rather
			* than against the press. `null` means no pan is in flight.
			*/
			const panning = (0, react.useRef)(null);
			/**
			* Whether the pan that just ended actually moved the view.
			*
			* A drag finishes with a click on the surface, and a click on the surface means
			* "nothing is selected". Without this the reader would pan to a mark and lose the
			* selection they were carrying to it. A press that never moved is still a click.
			*/
			const panned = (0, react.useRef)(false);
			/**
			* Whether the gesture that just ended put a mark on the figure.
			*
			* Lifting the pointer over the surface also makes the browser dispatch a `click`
			* on it, and that click means "the reader pressed the background" — which clears the
			* selection. For a mark that was just drawn that is exactly backwards: the click is
			* the tail of the gesture that made the mark, so it must not undo the selection the
			* same gesture just made. It also lands before the detail card has been placed, so
			* without this the card opens and is gone again in the same frame.
			*/
			const drew = (0, react.useRef)(false);
			/**
			* Where the current press landed, in figure pixels.
			*
			* Recorded in the capture phase because a mark's hit area stops the bubble, so
			* this is the only place a drag on an existing mark can learn its own origin.
			* A box rather than a nullable ref: the capture handler runs for every press on
			* the surface, so there is no state where it holds no point.
			*/
			const pressedAt = (0, react.useRef)({ value: [0, 0] });
			/** Convert one pointer event to figure pixels. */
			const toFigure = (event) => {
				const rect = event.currentTarget.getBoundingClientRect();
				const scaleX = rect.width === 0 ? 1 : width / rect.width;
				const scaleY = rect.height === 0 ? 1 : height / rect.height;
				return [(event.clientX - rect.left) * scaleX - originX, (event.clientY - rect.top) * scaleY - originY];
			};
			/**
			* Describe what the mark landed on.
			*
			* A rendered document reports its elements in its own layout pixels, which are
			* the figure units already, so it names them from the point. An inline SVG is
			* hit-tested against client coordinates instead, because its elements live in
			* the same document as this overlay and their boxes are the browser's own.
			*/
			const anchorFor = (event, point) => {
				if (props.anchorAtFigurePoint !== void 0) return props.anchorAtFigurePoint(point[0], point[1]);
				const container = containerRef.current;
				if (!anchoring || container === null) return void 0;
				const rect = event.currentTarget.getBoundingClientRect();
				if (rect.width === 0 || rect.height === 0) return void 0;
				return anchorAtPoint(container, event.clientX, event.clientY, width / rect.width, height / rect.height);
			};
			/** Remember where a press landed, before any handler gets to consume it. */
			const capturePress = (event) => {
				pressedAt.current.value = toFigure(event);
			};
			/**
			* Begin moving the mark a press landed on.
			*
			* The stream keeps coming back to the hit area the press started on, so a drag
			* that leaves the mark keeps updating instead of stopping at its edge.
			*/
			/**
			* Handle a press that landed on an existing mark.
			*
			* The press always selects the mark, which is what the hit area has always
			* done.
			*
			* A resize or turn handle takes the press under every tool. Those handles are
			* drawn only around the selected mark, they are seven pixels across, and they
			* show a resize cursor — a press on one can only mean "resize this", so making
			* it depend on the tool would be a trap: the frame is visible and follows the
			* pointer with a resize cursor while doing nothing at all. That is exactly how
			* it read before: with a drawing tool active, the handles were decoration.
			*
			* Everything else stays the tool's to interpret. The shape's own hit area and
			* the note plate are content rather than controls, so under a drawing tool a
			* press on them belongs to the mark it landed on, not to a stroke that would
			* run underneath it.
			*
			* @param mark - the mark the press landed on.
			* @param event - the pointer event.
			* @param handle - the handle it grabbed instead of the shape, when it did.
			*/
			const beginGesture = (mark, event, handle) => {
				event.stopPropagation();
				props.onSelect(mark.id);
				if (handle === void 0 && tool !== "select") return;
				if (typeof event.currentTarget.setPointerCapture === "function" && event.pointerId !== void 0) event.currentTarget.setPointerCapture(event.pointerId);
				setPress({
					id: mark.id,
					from: pressedAt.current.value,
					origin: mark.points,
					originRotation: mark.rotation ?? 0,
					kind: mark.kind,
					handle,
					snap: event.shiftKey,
					edit: null
				});
			};
			/**
			* Handle a press on the selected mark's control frame.
			*
			* The frame is only drawn for the selected mark, so reaching here already means
			* the press was aimed at a handle of the thing the reader is working on. A press
			* that misses every handle falls through to the shape itself, which is what keeps
			* the frame from making a small mark harder to grab than it was.
			* @param mark - the selected mark.
			* @param event - the pointer event.
			* @returns true when a handle took the press.
			*/
			/**
			* The control frame's handle size in figure pixels.
			*
			* The frame is drawn in the same svg as the marks, which is in figure pixels, and
			* the whole paper is then scaled by CSS. A handle has to be a fixed number of screen
			* pixels to be hittable, so its figure size is that target divided by the scale.
			*/
			const grip = 7 / Math.max(.05, props.scale ?? 1);
			/** A hairline that stays a hairline on screen, whatever the paper is scaled to. */
			const hairline = 1 / Math.max(.05, props.scale ?? 1);
			const beginHandle = (mark, event) => {
				if (props.selectedId !== mark.id) return false;
				if (mark.kind === "point") return false;
				const grabbed = handleAt(controlBox(mark), mark.rotation ?? 0, pressedAt.current.value, HANDLE_REACH * grip, grip);
				if (grabbed === void 0) return false;
				beginGesture(mark, event, grabbed);
				return true;
			};
			/**
			* The box a mark's control frame is drawn around.
			*
			* Only the resize-and-turn handles read this, and only shapes with an extent get
			* those: a `point` mark is highlighted by a ring instead, so it never reaches
			* here. Every kind that does carries at least one point, so there is always a
			* box — the fallback covers a mark whose points were emptied by a bad edit.
			* @param mark - the mark to frame.
			* @returns the frame box.
			*/
			const controlBox = (mark) => {
				/* v8 ignore next -- a mark carries at least one point, which is a box. */
				return uprightBounds(mark.points, mark.rotation ?? 0) ?? {
					x: 0,
					y: 0,
					width: 0,
					height: 0
				};
			};
			/**
			* What one pointer move means to the gesture in flight.
			*
			* Three gestures share one press: a plain drag moves the mark, the rotation
			* handle turns it, and a box handle resizes it. Each is expressed
			* against the geometry the gesture began with, so a long drag accumulates from
			* where it started rather than drifting frame to frame.
			*
			* @param held - the press being dragged.
			* @param point - the pointer, in figure pixels.
			* @param dx - horizontal movement since the press, in figure pixels.
			* @param dy - vertical movement since the press.
			* @returns what to draw until the gesture ends.
			*/
			const editFor = (held, point, dx, dy) => {
				const handle = held.handle;
				if (handle === void 0) return {
					points: shiftPoints(held.origin, dx, dy),
					rotation: void 0
				};
				const box = markBounds(held.origin);
				/* v8 ignore next -- a handle is only offered for a mark that has a box. */
				if (box === void 0) return {
					points: void 0,
					rotation: void 0
				};
				if (handle === "rotate") return {
					points: void 0,
					rotation: rotationTo(boxCentre(box), point, held.snap)
				};
				return {
					points: resizeBy({
						handle,
						at: point,
						origin: held.origin,
						rotation: held.originRotation
					}),
					rotation: void 0
				};
			};
			/**
			* The patch a finished handle drag asks the parent to record.
			*
			* Only the fields the edit actually produced are listed, so a resize does not
			* clear a rotation. A gesture that produced nothing at all carries no fields,
			* and the caller can tell that apart by its emptiness rather than by a null.
			* @param edit - what the gesture drew.
			* @returns the fields that changed; empty when none did.
			*/
			const patchFrom = (edit) => {
				const patch = {};
				if (edit.points !== void 0) patch.points = edit.points;
				if (edit.rotation !== void 0) patch.rotation = edit.rotation;
				return patch;
			};
			const start = (event) => {
				drew.current = false;
				if (tool === "select") {
					if (props.onPan === void 0) return;
					panning.current = {
						x: event.clientX,
						y: event.clientY
					};
					panned.current = false;
					/* v8 ignore next -- jsdom and every browser the panel runs in implement it. */
					event.currentTarget.setPointerCapture?.(event.pointerId);
					props.onPanStart?.();
					return;
				}
				event.preventDefault();
				const point = toFigure(event);
				if (tool === "point") {
					const anchor = anchorFor(event, point);
					const mark = {
						id: nextMarkId(),
						kind: "point",
						color,
						points: [point],
						...weightField(weight),
						...anchor === void 0 ? {} : { anchor }
					};
					props.onAdd(mark);
					props.onSelect(mark.id);
					props.onDrawn?.(mark.id);
					drew.current = true;
					return;
				}
				drawing.current = true;
				if (typeof event.currentTarget.setPointerCapture === "function" && event.pointerId !== void 0) event.currentTarget.setPointerCapture(event.pointerId);
				const seed = tool === "pen" ? [point] : [point, point];
				setDraft({
					id: nextMarkId(),
					kind: tool,
					color,
					points: seed,
					...weightField(weight)
				});
			};
			const move = (event) => {
				const from = panning.current;
				if (from !== null) {
					const dx = event.clientX - from.x;
					const dy = event.clientY - from.y;
					if (dx === 0 && dy === 0) return;
					panning.current = {
						x: event.clientX,
						y: event.clientY
					};
					panned.current = true;
					props.onPan?.(dx, dy);
					return;
				}
				if (press !== null) {
					const point = toFigure(event);
					const dx = point[0] - press.from[0];
					const dy = point[1] - press.from[1];
					if (dx === 0 && dy === 0 && !event.shiftKey) return;
					const held = {
						...press,
						snap: event.shiftKey
					};
					const edit = editFor(held, point, dx, dy);
					setPress({
						...held,
						edit
					});
					const base = props.marks.find((candidate) => candidate.id === press.id);
					/* v8 ignore next -- a press always begins on a mark that is still in the list. */
					if (base === void 0) return;
					const live = { ...base };
					if (edit.points !== void 0) live.points = edit.points;
					if (edit.rotation !== void 0) live.rotation = edit.rotation;
					props.onLiveEdit?.(live);
					return;
				}
				if (!drawing.current || draft === null) return;
				const point = toFigure(event);
				if (draft.kind === "pen") {
					const last = draft.points[draft.points.length - 1];
					if (last !== void 0 && Math.hypot(point[0] - last[0], point[1] - last[1]) < PEN_SAMPLE_STEP) return;
					setDraft({
						...draft,
						points: [...draft.points, point]
					});
					return;
				}
				setDraft({
					...draft,
					points: [draft.points[0], point]
				});
			};
			const finish = (event) => {
				if (panning.current !== null) {
					panning.current = null;
					props.onPanEnd?.();
					return;
				}
				if (press !== null) {
					const done = press.edit;
					setPress(null);
					props.onLiveEdit?.(null);
					if (done === null) return;
					if (press.handle === void 0) {
						/* v8 ignore next -- a move always carries the geometry it moved to. */
						const moved = done.points ?? press.origin;
						/* v8 ignore next -- a move always carries at least one point. */
						const last = moved[moved.length - 1] ?? press.from;
						props.onMove(press.id, moved, anchorFor(event, last));
						return;
					}
					props.onUpdate(press.id, patchFrom(done));
					return;
				}
				if (!drawing.current || draft === null) return;
				drawing.current = false;
				if (typeof event.currentTarget.hasPointerCapture === "function" && event.pointerId !== void 0 && event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
				setDraft(null);
				if (draft.points.length < 2) return;
				const first = draft.points[0];
				const last = draft.points[draft.points.length - 1];
				if (draft.kind !== "pen" && Math.hypot(last[0] - first[0], last[1] - first[1]) < 4) return;
				const anchor = anchorFor(event, last);
				const mark = {
					...draft,
					...anchor === void 0 ? {} : { anchor }
				};
				props.onAdd(mark);
				props.onSelect(mark.id);
				props.onDrawn?.(mark.id);
				drew.current = true;
			};
			/** Geometry to draw for one mark: the running gesture may have displaced it. */
			const shownPoints = (mark) => press !== null && press.edit !== null && press.edit.points !== void 0 && press.id === mark.id ? press.edit.points : mark.points;
			/** The mark as the running gesture currently has it, for drawing only. */
			const shownMark = (mark) => {
				const edit = press !== null && press.id === mark.id ? press.edit : null;
				if (edit === null) return mark;
				const next = {
					...mark,
					points: shownPoints(mark)
				};
				if (edit.rotation !== void 0) next.rotation = edit.rotation;
				return next;
			};
			/** The resize and rotation handles of the selected mark. */
			const renderHandles = (mark) => {
				const frame = controlBox(mark);
				const half = grip / 2;
				const handles = handlesFor(frame, mark.rotation ?? 0, grip);
				const tether = tetherFor(frame, mark.rotation ?? 0, grip);
				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("line", {
					x1: tether.from[0],
					y1: tether.from[1],
					x2: tether.to[0],
					y2: tether.to[1],
					stroke: "#4c8dff",
					strokeWidth: hairline
				}), handles.map((handle) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("g", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
					"data-da-handle": handle.id,
					x: handle.point[0] - half,
					y: handle.point[1] - half,
					width: grip,
					height: grip,
					rx: handle.id === "rotate" ? grip / 2 : grip / 7,
					fill: "#ffffff",
					stroke: "#4c8dff",
					strokeWidth: 1.5 * hairline,
					style: {
						pointerEvents: "all",
						cursor: cursorFor(handle.id)
					},
					onPointerDown: (event) => {
						beginGesture(mark, event, handle.id);
					}
				}) }, handle.id))] });
			};
			/**
			* A `point` mark's marker.
			*
			* A map pin, not a ring: a ring centred on a coordinate covers the very pixel it
			* claims and says nothing about where inside itself the coordinate is. A pin puts
			* its point on the spot and stands clear of it, and its solid body gives the mark's
			* number somewhere to live.
			*
			* The white halo is drawn first and thicker, so the marker reads over dense line
			* work — but it is the *only* white on the marker: the body is filled with the
			* mark's own colour, because a white body with a coloured digit was what the reader
			* compared to a washed-out sticker.
			*/
			const renderPoint = (mark) => {
				const pin = pinPathData(mark, unit);
				const centre = pinNumberCentre(mark, unit);
				/* v8 ignore next -- a point mark carries exactly the one coordinate it was placed at. */
				if (pin === void 0 || centre === void 0) return null;
				const number = numbers.get(mark.id);
				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: pin,
						fill: "#ffffff",
						stroke: "#ffffff",
						strokeWidth: 4.5 * unit,
						strokeLinejoin: "round"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: pin,
						fill: mark.color,
						stroke: "#ffffff",
						strokeWidth: 1.5 * unit,
						strokeLinejoin: "round"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("text", {
						x: centre[0],
						y: centre[1],
						fontFamily: PIN_FONT_FAMILY,
						fontSize: pinFontSizeOf(mark, unit),
						fontWeight: 700,
						fill: PIN_NUMBER_COLOR,
						textAnchor: "middle",
						dominantBaseline: "central",
						children: number
					})
				] });
			};
			/**
			* The highlight drawn around a selected `point` mark.
			*
			* A frame with eight resize handles would be a lie: a point mark has no extent,
			* so there is nothing to stretch and nothing to turn. What it does need is to
			* read as selected, which a dashed box around the pin says without offering
			* handles that would do nothing.
			*/
			const renderPointFrame = (shown) => {
				const box = pointMarkBox(shown, unit);
				/* v8 ignore next -- a point mark carries exactly the one coordinate it was placed at. */
				if (box === void 0) return null;
				const inset = 3 * hairline;
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
					x: box.x - inset,
					y: box.y - inset,
					width: box.width + 2 * inset,
					height: box.height + 2 * inset,
					rx: inset,
					fill: "none",
					stroke: "#4c8dff",
					strokeWidth: hairline,
					strokeDasharray: `${3 * hairline} ${2 * hairline}`,
					style: { pointerEvents: "none" }
				});
			};
			const renderMark = (mark, isDraft) => {
				const shown = shownMark(mark);
				const path = markPathData(shown);
				const selected = props.selectedId === mark.id;
				const transform = markTransform(shown);
				const isPoint = mark.kind === "point";
				const pin = isPoint ? pinPathData(shown, unit) : void 0;
				/**
				* What a press on the drawn shape starts.
				*
				* A point mark's target is its pin, which is a filled shape and not a stroke, so
				* it carries the hit area itself rather than relying on the invisible stroke the
				* other kinds draw along their path.
				*/
				const hitArea = pin === void 0 || isDraft ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					d: pin,
					fill: "transparent",
					stroke: "transparent",
					strokeWidth: HIT_WIDTH * unit,
					style: {
						pointerEvents: "all",
						cursor: "pointer"
					},
					onPointerDown: (event) => {
						if (!beginHandle(mark, event)) beginGesture(mark, event);
					},
					onDoubleClick: (event) => {
						event.stopPropagation();
						props.onEdit(mark.id);
					}
				});
				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("g", {
					"data-da-mark": mark.id,
					opacity: isDraft ? .75 : 1,
					children: [
						isPoint ? renderPoint(shown) : null,
						path === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("g", {
							transform,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
									d: path,
									fill: "none",
									stroke: "#ffffff",
									strokeWidth: strokeWidthOf(shown, unit) + 2.5 * unit,
									strokeLinecap: "round",
									strokeLinejoin: "round"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
									d: path,
									fill: "none",
									stroke: shown.color,
									strokeWidth: strokeWidthOf(shown, unit),
									strokeLinecap: "round",
									strokeLinejoin: "round"
								}),
								isDraft ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
									d: path,
									fill: "none",
									stroke: "transparent",
									strokeWidth: HIT_WIDTH * unit,
									style: {
										pointerEvents: "stroke",
										cursor: "pointer"
									},
									onPointerDown: (event) => {
										if (!beginHandle(mark, event)) beginGesture(mark, event);
									},
									onDoubleClick: (event) => {
										event.stopPropagation();
										props.onEdit(mark.id);
									}
								})
							]
						}),
						hitArea,
						selected && !isDraft && isPoint ? renderPointFrame(shown) : null,
						selected && !isDraft && !isPoint ? renderHandles(shown) : null
					]
				}, mark.id);
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				className: "da-overlay",
				"data-da-overlay": "",
				width,
				height,
				viewBox: `0 0 ${width} ${height}`,
				"data-tool": tool,
				onPointerDownCapture: capturePress,
				onPointerDown: start,
				onPointerMove: move,
				onPointerUp: finish,
				onPointerCancel: finish,
				onClick: (event) => {
					if (tool !== "select" || event.target !== event.currentTarget) return;
					if (panned.current) {
						panned.current = false;
						return;
					}
					if (drew.current) {
						drew.current = false;
						return;
					}
					props.onSelect(null);
				},
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("g", {
					transform: `translate(${originX} ${originY})`,
					children: [marks.map((mark) => renderMark(mark, false)), draft === null ? null : renderMark(draft, true)]
				})
			});
		}
		/** A difference that never changes, for a body that has no edit yet. */
		const EMPTY_DIFF = {
			hunks: [],
			added: 0,
			removed: 0,
			changed: false,
			coarse: false
		};
		/** The character a line carries in unified-diff text. */
		const SIGNS$1 = {
			context: " ",
			add: "+",
			remove: "-"
		};
		/**
		* Split text into lines, dropping exactly one trailing newline.
		* @param text - the text to split.
		* @returns its lines; empty for an empty text.
		*/
		function textLines(text) {
			if (text === "") return [];
			return (text.endsWith("\n") ? text.slice(0, -1) : text).split("\n");
		}
		/**
		* Read one line the caller has already bounded.
		*
		* Every call site walks an index the surrounding loop keeps inside the array, so
		* the access cannot miss; the cast states that invariant instead of adding a
		* fallback branch that no input can reach.
		* @param lines - the lines being walked.
		* @param index - a position the caller guarantees is in range.
		* @returns that line.
		*/
		function lineAt(lines, index) {
			return lines[index];
		}
		/**
		* Read one table cell the caller has already bounded.
		*
		* The table is allocated at `(rows + 1) × (columns + 1)` and every read is one
		* step inside those bounds, so a fallback value would be a branch no input can
		* reach — the same invariant {@link lineAt} states for lines.
		* @param cells - the subsequence table.
		* @param index - a flat position the caller guarantees is in range.
		* @returns that cell.
		*/
		function cell(cells, index) {
			return cells[index];
		}
		/**
		* The exact edit script for one middle block, or undefined when it is too large.
		* @param older - older lines of the middle.
		* @param newer - newer lines of the middle.
		* @param maxCells - largest table this call will build.
		* @returns the script, or undefined when the table would exceed the budget.
		*/
		function exactOps(older, newer, maxCells) {
			const rows = older.length;
			const columns = newer.length;
			if (rows * columns > maxCells) return void 0;
			const width = columns + 1;
			const lengths = new Uint32Array((rows + 1) * width);
			for (let i = rows - 1; i >= 0; i -= 1) for (let j = columns - 1; j >= 0; j -= 1) lengths[i * width + j] = lineAt(older, i) === lineAt(newer, j) ? cell(lengths, (i + 1) * width + (j + 1)) + 1 : Math.max(cell(lengths, (i + 1) * width + j), cell(lengths, i * width + (j + 1)));
			const ops = [];
			let i = 0;
			let j = 0;
			while (i < rows && j < columns) if (older[i] === newer[j]) {
				ops.push({
					kind: "equal",
					text: lineAt(older, i)
				});
				i += 1;
				j += 1;
			} else if (cell(lengths, (i + 1) * width + j) >= cell(lengths, i * width + (j + 1))) {
				ops.push({
					kind: "remove",
					text: lineAt(older, i)
				});
				i += 1;
			} else {
				ops.push({
					kind: "add",
					text: lineAt(newer, j)
				});
				j += 1;
			}
			while (i < rows) {
				ops.push({
					kind: "remove",
					text: lineAt(older, i)
				});
				i += 1;
			}
			while (j < columns) {
				ops.push({
					kind: "add",
					text: lineAt(newer, j)
				});
				j += 1;
			}
			return ops;
		}
		/**
		* Group a full script into hunks with context, merging runs whose gap is covered.
		* @param lines - every line of the script, with its source numbers.
		* @param context - unchanged lines to keep on each side.
		* @returns the hunks, in document order.
		*/
		function groupHunks(lines, context) {
			const ranges = [];
			lines.forEach((line, index) => {
				if (line.kind === "context") return;
				const start = Math.max(0, index - context);
				const end = Math.min(lines.length, index + 1 + context);
				const last = ranges[ranges.length - 1];
				if (last !== void 0 && start <= last.end) last.end = Math.max(last.end, end);
				else ranges.push({
					start,
					end
				});
			});
			return ranges.map((range) => buildHunk(lines, range));
		}
		/**
		* Build one hunk from its line range.
		* @param lines - every line of the script.
		* @param range - the hunk's line range.
		* @returns the hunk, with the counts and start lines unified diff spells.
		*/
		function buildHunk(lines, range) {
			const slice = lines.slice(range.start, range.end);
			const older = slice.filter((line) => line.oldLine !== void 0);
			const newer = slice.filter((line) => line.newLine !== void 0);
			const before = lines.slice(0, range.start);
			const olderBefore = before.filter((line) => line.oldLine !== void 0).length;
			const newerBefore = before.filter((line) => line.newLine !== void 0).length;
			const firstOlder = older[0];
			const firstNewer = newer[0];
			return {
				oldStart: firstOlder?.oldLine ?? olderBefore,
				oldCount: older.length,
				newStart: firstNewer?.newLine ?? newerBefore,
				newCount: newer.length,
				lines: slice
			};
		}
		/**
		* Diff two texts by line.
		* @param before - the older text (the version the document was opened with).
		* @param after - the newer text (what the reader has edited).
		* @param options - context width and exact-algorithm budget.
		* @returns the difference, with hunks only when some line is not shared.
		*/
		function diffLines(before, after, options = {}) {
			const context = options.context ?? 3;
			const maxCells = options.maxCells ?? 1e6;
			const older = textLines(before);
			const newer = textLines(after);
			if (before === after) return EMPTY_DIFF;
			const shared = Math.min(older.length, newer.length);
			let prefix = 0;
			while (prefix < shared && older[prefix] === newer[prefix]) prefix += 1;
			let suffix = 0;
			while (suffix < shared - prefix && older[older.length - 1 - suffix] === newer[newer.length - 1 - suffix]) suffix += 1;
			const olderMiddle = older.slice(prefix, older.length - suffix);
			const newerMiddle = newer.slice(prefix, newer.length - suffix);
			const exact = exactOps(olderMiddle, newerMiddle, maxCells);
			const ops = exact ?? [...olderMiddle.map((text) => ({
				kind: "remove",
				text
			})), ...newerMiddle.map((text) => ({
				kind: "add",
				text
			}))];
			const lines = [];
			let oldLine = 1;
			let newLine = 1;
			const equal = (text) => {
				lines.push({
					kind: "context",
					text,
					oldLine,
					newLine
				});
				oldLine += 1;
				newLine += 1;
			};
			for (let index = 0; index < prefix; index += 1) equal(lineAt(older, index));
			for (const op of ops) if (op.kind === "equal") equal(op.text);
			else if (op.kind === "remove") {
				lines.push({
					kind: "remove",
					text: op.text,
					oldLine
				});
				oldLine += 1;
			} else {
				lines.push({
					kind: "add",
					text: op.text,
					newLine
				});
				newLine += 1;
			}
			for (let index = older.length - suffix; index < older.length; index += 1) equal(lineAt(older, index));
			return {
				hunks: groupHunks(lines, context),
				added: lines.filter((line) => line.kind === "add").length,
				removed: lines.filter((line) => line.kind === "remove").length,
				changed: true,
				coarse: exact === void 0
			};
		}
		/**
		* Spell one hunk's `@@` header.
		* @param hunk - the hunk to name.
		* @returns the header line, without its newline.
		*/
		function formatHunkHeader(hunk) {
			return `@@ -${hunk.oldStart},${hunk.oldCount} +${hunk.newStart},${hunk.newCount} @@`;
		}
		/**
		* Spell a difference as unified-diff text.
		* @param displayPath - the path the message names; only its last segment is used.
		* @param diff - the difference to spell.
		* @returns the unified diff, without a trailing newline.
		*/
		function formatUnifiedDiff(displayPath, diff) {
			const name = baseNameOf(displayPath);
			const lines = [`--- a/${name}`, `+++ b/${name}`];
			for (const hunk of diff.hunks) {
				lines.push(formatHunkHeader(hunk));
				for (const line of hunk.lines) lines.push(`${SIGNS$1[line.kind]}${line.text}`);
			}
			return lines.join("\n");
		}
		/**
		* Compose the user message that carries one annotation.
		* @param document - the saved document.
		* @param paths - sidecar paths the Host wrote.
		* @param locale - message language.
		* @returns the message text.
		*/
		function buildAnnotationMessage(document, paths, locale) {
			const zh = locale === "zh";
			const { figure, marks } = document;
			const scope = describeFigureScope(figure, locale);
			const rendered = figure.mediaType === "text/html";
			const size = figure.width === void 0 || figure.height === void 0 ? "" : rendered ? zh ? `渲染面 ${Math.round(figure.width)}×${Math.round(figure.height)}，` : `rendered surface ${Math.round(figure.width)}x${Math.round(figure.height)}, ` : zh ? `图面 ${Math.round(figure.width)}×${Math.round(figure.height)}，` : `figure ${Math.round(figure.width)}x${Math.round(figure.height)}, `;
			const pages = annotatedPages(document);
			const marked = pages.length === 0 ? "" : zh ? `其中 ${pages.length} 页有标注，` : `${pages.length} pages marked, `;
			const kind = rendered ? zh ? "【HTML 标注】" : "[HTML annotations]" : zh ? "【附图标注】" : "[figure annotations]";
			const header = zh ? `${kind}${figure.path}（${scope === "" ? "" : `${scope}，`}${size}${marked}标注 ${marks.length} 处）` : `${kind} ${figure.path} (${scope === "" ? "" : `${scope}, `}${size}${marked}${marks.length} marks)`;
			const paged = figure.pageCount !== void 0;
			const pictured = paths.reviewPath !== null;
			const attachment = !pictured ? [] : [paged ? zh ? "带批注 PDF 已作为本条消息的附件发送，可直接在阅读器里核对。" : "The annotated PDF is attached to this message; you can check it in any reader." : zh ? "标注图已作为本条消息的附件发送。" : "The annotated image is attached to this message."];
			const noPicture = !pictured && !rendered && marks.length > 0 && !needsReviewImage(document) ? [zh ? "本条标注只有位置点，没有标注图：按上面逐条的坐标与说明处理原图即可。" : "These marks are points only, so no annotated image was made: work from the coordinates and notes above against the original figure."] : [];
			const summary = document.summary !== void 0 && document.summary.trim() !== "" ? [zh ? `这张图是：${document.summary.trim()}` : `the figure shows: ${document.summary.trim()}`, ""] : [];
			const closer = rendered ? zh ? "逐条改 HTML 生成源。" : "Edit the HTML source, mark by mark." : paged ? zh ? "逐条处理该 PDF。" : "Work through the PDF, mark by mark." : zh ? "逐条改生成源。" : "Edit the generating source, mark by mark.";
			return [
				header,
				...attachment,
				...noPicture,
				"",
				...summary,
				...describeMarks(document, locale),
				"",
				closer
			].join("\n");
		}
		/**
		* Encode one PNG blob as base64 for the prompt's image part.
		* @param blob - PNG bytes.
		* @returns base64 text.
		*/
		async function encodePng(blob) {
			const bytes = new Uint8Array(await blob.arrayBuffer());
			let binary = "";
			const chunk = 32768;
			for (let offset = 0; offset < bytes.length; offset += chunk) binary += String.fromCharCode(...bytes.subarray(offset, offset + chunk));
			return btoa(binary);
		}
		/**
		* Attach one file to the message, unless this composition or session cannot take one.
		*
		* A subagent continuation refuses file parts outright, and a composition without
		* the upload service has nowhere to store the bytes; both are reported as a
		* warning and the message still goes out with its text.
		*
		* @param input - the upload seats, the parts being built, and the file.
		*/
		async function attachFile(input) {
			const { zh } = input;
			const { noun } = input.attachment;
			const fileUpload = input.fileUpload;
			if (fileUpload === void 0) {
				input.warnings.push(zh ? `本次组合没有附件服务，${noun.zh}未随消息发送。` : `This composition has no upload service, so the ${noun.en} was not attached.`);
				return;
			}
			if (input.session?.address !== void 0) {
				input.warnings.push(zh ? `当前会话是子会话，不接受文件附件，${noun.zh}未随消息发送。` : `This session is a subagent continuation and takes no file attachments, so the ${noun.en} was not attached.`);
				return;
			}
			try {
				const uploaded = await fileUpload.upload(input.sessionId, input.attachment.bytes, input.attachment.name);
				if (!uploaded.ok) throw new Error(uploaded.error.message ?? "the upload was refused");
				input.content.push({
					type: "file",
					attachment: uploaded.value.file
				});
			} catch (error) {
				const reason = error instanceof Error ? error.message : String(error);
				input.warnings.push(zh ? `${noun.zh}未能随消息发送：${reason}` : `The ${noun.en} was not attached: ${reason}`);
			}
		}
		/**
		* Attach the annotated document to the message, unless this session cannot take one.
		* @param input - the delivery being composed.
		* @param session - the live session face, when one is bound.
		* @param content - parts being built, appended to when the file was attached.
		* @param warnings - warnings being collected.
		*/
		async function attachAnnotatedPdf(input, session, content, warnings) {
			const bytes = input.annotatedPdf;
			if (bytes === void 0) return;
			const name = input.paths.reviewPath === null ? `${baseNameOf(input.document.figure.path)}.annotated.pdf` : baseNameOf(input.paths.reviewPath);
			await attachFile({
				fileUpload: input.fileUpload,
				session,
				sessionId: input.sessionId,
				content,
				warnings,
				zh: input.locale === "zh",
				attachment: {
					bytes,
					name,
					noun: {
						zh: "带批注 PDF",
						en: "annotated PDF"
					}
				}
			});
		}
		/**
		* Hand one message to the session, whether it is live or has to be resumed.
		* @param sessions - the client sessions service.
		* @param sessionId - session the message belongs to.
		* @param session - the live session face, when one is bound.
		* @param content - the parts to send.
		* @param refusal - the message an answer without `ok` is reported with.
		* @throws {Error} when the session is unknown or refuses the prompt.
		*/
		async function promptSession(sessions, sessionId, session, content, refusal) {
			const result = session === void 0 ? await sessions.using(sessionId, { source: "dsh-figmark" }, async (reference) => {
				return await (await reference.ready).session.prompt(content, "queue");
			}) : await session.prompt(content, "queue");
			if (!result.ok) throw new Error(result.error?.message ?? refusal);
		}
		/**
		* Send one annotation into the session that owns the figure.
		* @param input - the document, its written files, and the pages rendered for it.
		* @returns what the delivery could not do, empty when it did everything.
		* @throws {Error} when the session is unknown or the Host refuses the prompt.
		*/
		async function deliverAnnotation(input) {
			const zh = input.locale === "zh";
			const warnings = [];
			const content = [];
			const live = input.sessions.scope(input.sessionId);
			const session = live === void 0 ? void 0 : input.sessions.sessionOf(live);
			await attachAnnotatedPdf(input, session, content, warnings);
			const shown = input.pageImages.slice(0, 8);
			const paged = input.document.figure.pageCount !== void 0;
			for (const entry of shown) content.push({
				type: "image",
				mediaType: "image/png",
				data: await encodePng(entry.image),
				name: `${baseNameOf(input.document.figure.path)}${paged ? pageFileSuffix(entry.page) : ""}.annotated.png`
			});
			if (shown.length < input.pageImages.length) {
				const hidden = input.pageImages.length - shown.length;
				warnings.push(zh ? `另有 ${hidden} 页标注未附图，请看带批注 PDF。` : `${hidden} more annotated pages are not attached as images; see the annotated PDF.`);
			}
			content.push({
				type: "text",
				text: buildAnnotationMessage(input.document, input.paths, input.locale)
			});
			await promptSession(input.sessions, input.sessionId, session, content, "the session refused the annotation message");
			return warnings;
		}
		/**
		* Fit a difference into the message's line budget, whole hunks at a time.
		*
		* A hunk is never cut in half — a half hunk is not a diff anyone can apply — so
		* the budget drops trailing hunks and reports how many went with the attachment
		* instead. The first hunk always travels, however large it is: a message that
		* carries nothing but "see the attachment" would be worse than a long one.
		*
		* @param displayPath - the path the diff header names.
		* @param diff - the difference to fit.
		* @param maxLines - the message's diff budget, header lines included.
		* @returns the diff text and the number of hunks left out.
		*/
		function fitDiff(displayPath, diff, maxLines = 400) {
			const kept = [];
			let used = 0;
			for (const hunk of diff.hunks) {
				const size = hunk.lines.length + 1;
				if (kept.length > 0 && used + size > maxLines) break;
				kept.push(hunk);
				used += size;
			}
			return {
				text: formatUnifiedDiff(displayPath, {
					...diff,
					hunks: kept
				}),
				hidden: diff.hunks.length - kept.length
			};
		}
		/**
		* Spell the reader's notes as the numbered list the message carries.
		*
		* A note is keyed by the baseline line its change starts at, so it stays put
		* while the reader keeps editing; the hunk that starts there is named when one
		* still does. A note whose change the reader has since removed is still sent —
		* the line number is the reader's own reference and they wrote it on purpose —
		* it just travels without a hunk header.
		*
		* @param diff - the whole difference, for pairing notes with their hunk.
		* @param notes - the reader's notes.
		* @param locale - message language.
		* @returns one line per note, in line order; empty when there are none.
		*/
		function describeNotes(diff, notes, locale) {
			const zh = locale === "zh";
			const lines = [];
			const keys = Object.keys(notes).map(Number).sort((left, right) => left - right);
			for (const key of keys) {
				const text = notes[key];
				if (text === void 0 || text.trim() === "") continue;
				const hunk = diff.hunks.find((candidate) => candidate.oldStart === key);
				const where = hunk === void 0 ? "" : `（${formatHunkHeader(hunk)}）`;
				lines.push(zh ? `${lines.length + 1}. 第 ${key} 行${where}：${text.trim()}` : `${lines.length + 1}. line ${key}${hunk === void 0 ? "" : ` (${formatHunkHeader(hunk)})`}: ${text.trim()}`);
			}
			return lines;
		}
		/**
		* Compose the user message that carries one edit proposal.
		* @param input - the document, its difference, and what the message could not carry.
		* @returns the message text.
		*/
		function buildEditMessage(input) {
			const zh = input.locale === "zh";
			const { diff, fitted } = input;
			const readerNotes = describeNotes(diff, input.notes, input.locale);
			const counted = readerNotes.length === 0 ? "" : zh ? `，说明 ${readerNotes.length} 条` : `, ${readerNotes.length} notes`;
			const header = zh ? `【文档修改建议】${input.documentPath}（Markdown，改动 ${diff.hunks.length} 处，+${diff.added} −${diff.removed} 行${counted}）` : `[document edits] ${input.documentPath} (Markdown, ${diff.hunks.length} hunks, +${diff.added} -${diff.removed} lines${counted})`;
			const warnings = [];
			if (input.stale) warnings.push(zh ? "注意：文件在编辑期间被改动过，这份 diff 基于较早的版本，可能无法直接应用。" : "Note: the file changed while it was being edited, so this diff is against an earlier version and may not apply cleanly.");
			if (diff.coarse) warnings.push(zh ? "改动较大，diff 以整块替换呈现。" : "The change is large, so the diff reads as one replacement block.");
			if (fitted.hidden > 0) {
				const name = `${baseNameOf(input.documentPath)}.edited.md`;
				warnings.push(zh ? `另有 ${fitted.hidden} 处改动未在本消息里展开，完整结果见随本消息发送的 ${name}。` : `${fitted.hidden} more hunks are not expanded here; the complete result is attached as ${name}.`);
			}
			const closing = zh ? "我已在文档预览里改好，但**没有落盘**：请把这段 diff 应用到源文件，或据此复核我的改动；diff 之外的部分不要动，改完逐处回应。" : "I made these edits in the document preview and did **not** write them to disk: apply this diff to the source, or review my change against it; leave everything outside the diff untouched and answer hunk by hunk.";
			return [
				header,
				"",
				"```diff",
				fitted.text,
				"```",
				...readerNotes.length === 0 ? [] : [
					"",
					zh ? "我的说明：" : "My notes:",
					...readerNotes
				],
				...warnings.length === 0 ? [] : ["", ...warnings],
				"",
				closing
			].join("\n");
		}
		/**
		* Send one edit proposal into the session that owns the document.
		*
		* Nothing here writes the document: the diff in the message is the deliverable,
		* and the edited text travels as an attachment only when the diff did not fit.
		*
		* @param input - the document, its difference, and the session to reach.
		* @returns what the delivery could not do, empty when it did everything.
		* @throws {Error} when the session is unknown or refuses the prompt.
		*/
		async function deliverEdit(input) {
			const zh = input.locale === "zh";
			const warnings = [];
			const content = [];
			const live = input.sessions.scope(input.sessionId);
			const session = live === void 0 ? void 0 : input.sessions.sessionOf(live);
			const fitted = fitDiff(input.documentPath, input.diff);
			if (fitted.hidden > 0) await attachFile({
				fileUpload: input.fileUpload,
				session,
				sessionId: input.sessionId,
				content,
				warnings,
				zh,
				attachment: {
					bytes: new TextEncoder().encode(input.editedText),
					name: `${baseNameOf(input.documentPath)}.edited.md`,
					noun: {
						zh: "编辑后的副本",
						en: "edited copy"
					}
				}
			});
			content.push({
				type: "text",
				text: buildEditMessage({
					documentPath: input.documentPath,
					diff: input.diff,
					fitted,
					notes: input.notes,
					stale: input.stale,
					locale: input.locale
				})
			});
			await promptSession(input.sessions, input.sessionId, session, content, "the session refused the edit message");
			return warnings;
		}
		//#endregion
		//#region src/client/composer.ts
		/**
		* Write one annotation into the composer draft, pictures included, without sending.
		*
		* The message is appended rather than substituted: the reader may already have
		* half a sentence in the box, and losing it to a button press would be a worse
		* failure than a long draft. Attachments are staged first, so a refused
		* attachment leaves no text behind that names pictures which are not there.
		* @param input - the annotation, its pictures, and the composer to write into.
		* @throws {Error} when the composer refuses the attachments.
		*/
		function deliverToComposer(input) {
			const { conversation, sessionId, files, locale, document: document_, paths } = input;
			let shell;
			try {
				shell = conversation.input.shell(sessionId);
			} catch {
				throw new Error("the session has no composer to write into");
			}
			const drafts = files.length === 0 ? [] : conversation.createDrafts(sessionId, files);
			if (drafts.length > 0 && !shell.addAttachments(drafts.map((draft) => draft.id))) {
				conversation.releaseDraftAttachments(drafts);
				throw new Error("the composer refused the attachments");
			}
			const message = buildAnnotationMessage(document_, paths, locale);
			const existing = shell.snapshot.draft.trim();
			shell.setDraft(existing === "" ? message : `${existing}\n\n${message}`);
		}
		/**
		* The box the whole drawing occupies: the figure, plus wherever the marks reach.
		*
		* A figure with every mark inside it gets exactly its own box back, which is the
		* case the overlay has always drawn; the growth only happens for marks that leave
		* it. The margin is applied only on sides that actually grew, so an ordinary figure
		* is not padded on all four sides for nothing.
		* @param width - the figure's width, in figure pixels.
		* @param height - the figure's height, in figure pixels.
		* @param marks - the marks drawn on it.
		* @param unit - the figure's size multiple, so outlines are measured as drawn.
		* @returns the box the drawing occupies, in figure coordinates.
		*/
		function plotBounds(width, height, marks, unit = 1) {
			let left = 0;
			let top = 0;
			let right = width;
			let bottom = height;
			for (const mark of marks) {
				const box = markOutline(mark, unit);
				/* v8 ignore next -- a mark with no coordinate covers nothing to grow for. */
				if (box === void 0) continue;
				left = Math.min(left, box.x);
				top = Math.min(top, box.y);
				right = Math.max(right, box.x + box.width);
				bottom = Math.max(bottom, box.y + box.height);
			}
			const padLeft = left < 0 ? 12 : 0;
			const padTop = top < 0 ? 12 : 0;
			const padRight = right > width ? 12 : 0;
			const padBottom = bottom > height ? 12 : 0;
			return {
				x: left - padLeft,
				y: top - padTop,
				width: right + padRight - (left - padLeft),
				height: bottom + padBottom - (top - padTop)
			};
		}
		//#endregion
		//#region src/client/export.ts
		/**
		* Render one mark as SVG elements, with a white halo so it reads over black line work.
		*
		* @param mark - the mark to draw.
		* @param number - the mark's number in the list, when it carries one.
		* @param unit - the figure's size multiple, so the export is drawn at the same
		*   weight the reader saw.
		* @returns the mark's elements.
		*/
		function markSvg(mark, number, unit) {
			const path = markPathData(mark);
			const parts = [];
			if (path !== void 0) parts.push(`<path d="${path}" fill="none" stroke="#ffffff" stroke-width="${strokeWidthOf(mark, unit) + 2.5 * unit}" stroke-linecap="round" stroke-linejoin="round"/>`, `<path d="${path}" fill="none" stroke="${mark.color}" stroke-width="${strokeWidthOf(mark, unit)}" stroke-linecap="round" stroke-linejoin="round"/>`);
			const pin = mark.kind === "point" ? pinPathData(mark, unit) : void 0;
			const centre = mark.kind === "point" ? pinNumberCentre(mark, unit) : void 0;
			if (pin !== void 0 && centre !== void 0) {
				parts.push(`<path d="${pin}" fill="${mark.color}" stroke="#ffffff" stroke-width="${2 * unit}" stroke-linejoin="round"/>`);
				if (number !== void 0) parts.push(`<text x="${centre[0]}" y="${centre[1]}" font-family="${PIN_FONT_FAMILY}" font-size="${pinFontSizeOf(mark, unit)}" font-weight="700" fill="${PIN_NUMBER_COLOR}" text-anchor="middle" dominant-baseline="central">${number}</text>`);
			}
			return parts.join("");
		}
		/** The figure layer as SVG elements. */
		function figureSvg(layer) {
			if (layer.kind === "raster") return `<image x="0" y="0" width="${layer.width}" height="${layer.height}" href="${layer.dataUrl}"/>`;
			const viewBox = layer.viewBox === void 0 ? "" : ` viewBox="${layer.viewBox}"`;
			const inner = layer.markup.replace(/^<\?xml[^>]*\?>\s*/u, "").replace(/^<svg[^>]*>/iu, "").replace(/<\/svg>\s*$/iu, "");
			return `<svg x="0" y="0" width="${layer.width}" height="${layer.height}"${viewBox} preserveAspectRatio="xMidYMid meet">${inner}</svg>`;
		}
		/**
		* Encode bytes as a `data:` URL.
		*
		* The export path needs this rather than an object URL: an SVG loaded into an
		* `<img>` cannot resolve a `blob:` reference, so a blob URL would make the whole
		* review image undecodable.
		* @param bytes - file bytes.
		* @param mediaType - the bytes' media type.
		* @returns the data URL.
		*/
		function bytesToDataUrl(bytes, mediaType) {
			let binary = "";
			const chunk = 32768;
			for (let offset = 0; offset < bytes.length; offset += chunk) binary += String.fromCharCode(...bytes.subarray(offset, offset + chunk));
			return `data:${mediaType};base64,${btoa(binary)}`;
		}
		/**
		* Build the standalone review SVG.
		* @param layer - the figure to place underneath.
		* @param marks - marks in draw order.
		* @param numbering - each mark's number, when these marks are a slice of a longer list.
		* @returns complete SVG markup.
		*/
		function composeReviewSvg(layer, marks, numbering) {
			const numbers = new Map(marks.map((mark, index) => [mark.id, numbering?.get(mark.id) ?? index + 1]));
			const unit = figureUnit(layer.width, layer.height);
			const paper = plotBounds(layer.width, layer.height, marks, unit);
			const shift = `translate(${-paper.x} ${-paper.y})`;
			const edge = paper.x !== 0 || paper.y !== 0 || paper.width !== layer.width || paper.height !== layer.height ? figureEdge(layer.width, layer.height, unit) : "";
			return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${paper.width}" height="${paper.height}" viewBox="0 0 ${paper.width} ${paper.height}"><rect x="0" y="0" width="${paper.width}" height="${paper.height}" fill="#ffffff"/><g transform="${shift}">` + figureSvg(layer) + edge + marks.map((mark) => markSvg(mark, numbers.get(mark.id), unit)).join("") + "</g></svg>";
		}
		/** Round a stroke measurement to a tenth, as the path data does. */
		function hair9(value) {
			return (Math.round(value * 10) / 10).toString();
		}
		/**
		* The rule that marks where the figure ends and the grown paper begins.
		*
		* Drawn only when the paper grew, and drawn grey and dashed: it is a note about the
		* picture, not part of it, so it must not read as a mark the reader made.
		* @param width - the figure's width, in figure pixels.
		* @param height - the figure's height, in figure pixels.
		* @param unit - the figure's size multiple, so the rule is sized like the marks.
		* @returns an SVG rect, or an empty string when there is nothing to outline.
		*/
		function figureEdge(width, height, unit) {
			return `<rect x="0" y="0" width="${width}" height="${height}" fill="none" stroke="#9aa3b2" stroke-width="${hair9(Math.max(1, 1.5 * unit))}" stroke-dasharray="${hair9(6 * unit)} ${hair9(4 * unit)}"/>`;
		}
		/**
		* The size of the picture {@link composeReviewSvg} builds.
		*
		* A caller has to know it before rasterizing: an SVG rendered at the figure's size
		* would crop away exactly the marks that made the paper grow.
		* @param layer - the figure to place underneath.
		* @param marks - marks in draw order.
		* @param unit - the figure's size multiple.
		* @returns the paper's width and height, in figure pixels.
		*/
		function reviewSize(layer, marks, unit = figureUnit(layer.width, layer.height)) {
			const paper = plotBounds(layer.width, layer.height, marks, unit);
			return {
				width: paper.width,
				height: paper.height
			};
		}
		/**
		* Rasterization scale for one review image.
		*
		* The export is meant to be read, not archived, so it is scaled up only until the
		* long edge reaches the size a vision model still resolves, and never past twice
		* the surface's own pixels.
		* @param width - surface width in units.
		* @param height - surface height in units.
		* @returns the device scale to rasterize at.
		*/
		function reviewScale(width, height) {
			return Math.min(2, Math.max(1, 2400 / Math.max(width, height)));
		}
		/**
		* Rasterize one review SVG to PNG bytes.
		* @param svg - standalone SVG markup.
		* @param width - output width in pixels.
		* @param height - output height in pixels.
		* @param scale - device scale applied to the output size.
		* @returns the PNG blob.
		* @throws {Error} when the SVG cannot be decoded into an image.
		*/
		async function rasterizePng(svg, width, height, scale) {
			const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
			try {
				const image = new Image();
				image.decoding = "sync";
				await new Promise((resolve, reject) => {
					image.onload = () => {
						resolve();
					};
					image.onerror = () => {
						reject(/* @__PURE__ */ new Error("the composed review image could not be decoded"));
					};
					image.src = url;
				});
				const canvas = document.createElement("canvas");
				canvas.width = Math.max(1, Math.round(width * scale));
				canvas.height = Math.max(1, Math.round(height * scale));
				const context = canvas.getContext("2d");
				if (context === null) throw new Error("a 2D canvas is unavailable");
				context.fillStyle = "#ffffff";
				context.fillRect(0, 0, canvas.width, canvas.height);
				context.drawImage(image, 0, 0, canvas.width, canvas.height);
				const blob = await new Promise((resolve) => {
					canvas.toBlob(resolve, "image/png");
				});
				if (blob === null) throw new Error("the review image could not be encoded as PNG");
				return blob;
			} finally {
				URL.revokeObjectURL(url);
			}
		}
		//#endregion
		//#region src/client/html-dom.ts
		/**
		* Width every document is rendered at, in figure pixels.
		*
		* Fixed rather than the pane's width: a document reflows, so marks measured at
		* one width would mean something else at another. Rendering at one width and
		* scaling the result to the pane gives marks the same standing a PDF page has —
		* the surface has a size of its own, and the pane only changes how it is shown.
		*/
		const RENDER_WIDTH = 1024;
		/**
		* Policy every rendered document carries.
		*
		* The frame already refuses to run scripts; this keeps the document from reaching
		* anywhere at all — no request leaves the machine, no nested frame, no form post —
		* while still letting the document's own inline styles paint it.
		*/
		const CONTENT_POLICY = "default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; media-src data:; connect-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'";
		/** Elements that only wrap other content, so a mark on one names its container instead. */
		const WRAPPER_TAGS = [
			"span",
			"b",
			"i",
			"em",
			"strong",
			"small",
			"u",
			"s",
			"sub",
			"sup",
			"code",
			"a",
			"label",
			"mark",
			"abbr",
			"time",
			"cite",
			"q"
		];
		/** Cap on the element text carried into an anchor, matching the inline-SVG anchor. */
		const ANCHOR_TEXT_LIMIT = 80;
		/**
		* Prepare one document for the frame.
		*
		* Two elements are removed rather than merely forbidden: a `<base>` would move
		* every relative reference in the document, and a refreshing `<meta>` would
		* replace the frame's document with a page this plugin cannot read. Both would
		* cost the user the surface they are annotating, so they are dropped instead.
		*
		* @param source - the file's own HTML text.
		* @returns a complete document for the frame.
		*/
		function buildRenderedDocument(source) {
			const parsed = new DOMParser().parseFromString(source, "text/html");
			for (const element of parsed.querySelectorAll("base")) element.remove();
			for (const element of parsed.querySelectorAll("meta")) if ((element.getAttribute("http-equiv") ?? "").toLowerCase() === "refresh") element.remove();
			const policy = parsed.createElement("meta");
			policy.setAttribute("http-equiv", "Content-Security-Policy");
			policy.setAttribute("content", CONTENT_POLICY);
			parsed.head.prepend(policy);
			return `<!doctype html>${parsed.documentElement.outerHTML}`;
		}
		/**
		* Write one prepared document into a frame.
		*
		* @param frame - the frame element, or nothing when it is not mounted.
		* @param source - a document from {@link buildRenderedDocument}.
		* @returns the frame's root element, or undefined when there is no frame to load
		* into — the caller then has nothing to measure and no surface to annotate.
		*/
		function loadFrameDocument(frame, source) {
			if (frame === null) return void 0;
			const frameDocument = frame.contentDocument;
			if (frameDocument === null) return void 0;
			frameDocument.open();
			frameDocument.write(source);
			frameDocument.close();
			return frameDocument.documentElement;
		}
		/** How deep an element sits below the document body. */
		function depthBelow(element, body) {
			let depth = 0;
			for (let node = element.parentElement; node !== null && node !== body; node = node.parentElement) depth += 1;
			return depth;
		}
		/** Whether an element is an anonymous inline wrapper: it names no anchor of its own. */
		function isAnonymousWrapper(element) {
			return element.id === "" && WRAPPER_TAGS.includes(element.tagName.toLowerCase());
		}
		/**
		* One element's path from the document body.
		*
		* Every step is exact for the document it was read from: a step is the element's
		* own `#id` where it has one, and its position among same-name siblings
		* otherwise. The walk stops at the body — and says so — unless an `#id` made the
		* tail self-rooted: a bare `p:nth-of-type(1)` is body-relative but reads as
		* document-wide, which in a document with nested paragraphs names the wrong
		* element. `body > p:nth-of-type(1)` can be pasted into a query as it stands.
		*/
		function selectorFor(element, body) {
			const segments = [];
			let rooted = false;
			for (let current = element; current !== null && current !== body; current = current.parentElement) {
				if (current.id !== "") {
					segments.unshift(`#${current.id}`);
					rooted = true;
					break;
				}
				const tag = current.tagName;
				let position = 1;
				for (let sibling = current.previousElementSibling; sibling !== null; sibling = sibling.previousElementSibling) if (sibling.tagName === tag) position += 1;
				segments.unshift(`${tag.toLowerCase()}:nth-of-type(${position})`);
			}
			if (!rooted) segments.unshift("body");
			return segments.join(" > ");
		}
		/**
		* Describe the element under one point of a rendered document.
		*
		* Every candidate's own box is tested rather than asking the browser what is
		* under the pointer: the frame's document is inert, and a walk over it answers
		* the same way whether an element is filled or not. Only elements with a box can
		* be named at all — that is what rules out the markup that is never painted.
		*
		* The smallest box containing the point wins, ties going to the deeper element.
		* An anonymous inline wrapper does not count as a name — a mark on the `<b>`
		* inside a heading points at that heading — so wrappers are held back as a
		* fallback for the one case they are all a point has: text a document leaves
		* directly in the body.
		*
		* @param document - the frame's document, or nothing when the frame is gone.
		* @param x - point x in figure pixels.
		* @param y - point y in figure pixels.
		* @returns the anchor, or undefined when the point names no element.
		*/
		function anchorInDocument(document, x, y) {
			const body = document?.body;
			if (body === null || body === void 0) return void 0;
			let named;
			let namedArea = Number.POSITIVE_INFINITY;
			let namedDepth = -1;
			let wrapper;
			let wrapperArea = Number.POSITIVE_INFINITY;
			let wrapperDepth = -1;
			for (const element of body.querySelectorAll("*")) {
				const rect = element.getBoundingClientRect();
				if (rect.width === 0 || rect.height === 0) continue;
				if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) continue;
				const area = rect.width * rect.height;
				const depth = depthBelow(element, body);
				if (isAnonymousWrapper(element)) {
					if (area < wrapperArea || area === wrapperArea && depth > wrapperDepth) {
						wrapper = element;
						wrapperArea = area;
						wrapperDepth = depth;
					}
					continue;
				}
				if (area < namedArea || area === namedArea && depth > namedDepth) {
					named = element;
					namedArea = area;
					namedDepth = depth;
				}
			}
			const described = named ?? wrapper;
			if (described === void 0) return void 0;
			const rect = described.getBoundingClientRect();
			const text = described.textContent.trim().replace(/\s+/g, " ").slice(0, ANCHOR_TEXT_LIMIT);
			return {
				tag: described.tagName.toLowerCase(),
				bbox: [
					rect.left,
					rect.top,
					rect.width,
					rect.height
				],
				...described.id === "" ? {} : { id: described.id },
				...text === "" ? {} : { text },
				selector: selectorFor(described, body)
			};
		}
		//#endregion
		//#region src/client/autosave.ts
		/**
		* The identity of what an annotation holds.
		*
		* Two renders with the same marks and the same note are the same annotation, and a
		* write that would replace one with itself is skipped rather than performed. Order
		* matters — it is the order the numbered list is read in — so it is part of the
		* identity.
		*
		* @param marks - the marks, in list order.
		* @param summary - the note about the whole figure.
		* @returns a string equal exactly when the two annotations are equal.
		*/
		function annotationSignature(marks, summary) {
			return `${summary.trim()}\u0000${JSON.stringify(marks)}`;
		}
		/**
		* Build the writer one surface keeps for its lifetime.
		* @param deps - what to write, where to report a failure, and how long to wait.
		* @returns the writer.
		*/
		function createAutosave(deps) {
			let timer;
			/**
			* The queue of writes.
			*
			* Each write waits for the one before it, so the file on disk is always the
			* result of the newest write that was asked for — never of whichever of two
			* concurrent writes happened to finish last.
			*/
			let chain = Promise.resolve();
			const cancel = () => {
				if (timer === void 0) return;
				clearTimeout(timer);
				timer = void 0;
			};
			const run = () => {
				chain = chain.then(deps.write).catch((error) => {
					deps.onError(error);
				});
				return chain;
			};
			return {
				schedule() {
					cancel();
					timer = setTimeout(() => {
						timer = void 0;
						run();
					}, deps.delay);
				},
				async flush() {
					cancel();
					await run();
				},
				cancel
			};
		}
		//#endregion
		//#region src/client/preferences.ts
		/**
		* The drawing choices a reader expects to still be there after a reload.
		*
		* Marks and their sentences belong to the annotation and live in its sidecar. The
		* colour the reader is drawing in, and how large the numbers are, are a different
		* kind of thing: they describe how the *next* mark should look, not what any mark
		* already means. Keeping them in a sidecar would tie them to a figure that has one —
		* a reader who picks a colour, draws nothing, and reloads would find the colour gone,
		* because a figure with no annotation has no sidecar to remember it in.
		*
		* So they go in browser storage, which is scoped to the reader rather than to the
		* figure, and which exists before the first mark does. An annotation that records
		* its own number style still wins over this: the picture the agent reads has to match
		* the annotation, not the reader's current preference.
		* @module dsh-figmark/client/preferences
		*/
		/** The storage key. Namespaced so it cannot collide with the shell's own keys. */
		const PREFERENCES_KEY = "dsh-figmark:drawing";
		/** A colour this plugin would have written: six hex digits. */
		const HEX_COLOR = /^#[0-9a-f]{6}$/iu;
		/**
		* One coordinate of the palette's position, pulled into the panel.
		* @param value - whatever was stored.
		* @returns the fraction, or undefined when it is not a usable position.
		*/
		function readSpot(value) {
			if (typeof value !== "number" || !Number.isFinite(value)) return void 0;
			return Math.min(1, Math.max(0, value));
		}
		/**
		* The browser's own storage, when this document may use it.
		*
		* Reading the property itself throws in a document that denies storage access, so the
		* read is what is guarded — a reader in that situation simply keeps no preferences,
		* which is better than a surface that fails to render because of one.
		* @returns the storage, or undefined when there is none to use.
		*/
		function browserStore() {
			try {
				return globalThis.localStorage ?? void 0;
			} catch {
				return;
			}
		}
		/**
		* What one parsed preference record says, ignoring anything it gets wrong.
		* @param raw - the parsed JSON, of unknown shape.
		* @returns the preferences it describes.
		*/
		function readRecord(raw) {
			if (typeof raw !== "object" || raw === null) return {};
			const record = raw;
			const color = record["color"];
			/**
			* One stored spot, or undefined when it is not a usable position.
			* @param value - whatever was stored under that key.
			* @returns the spot, when both coordinates survived the read.
			*/
			const spotOf = (value) => {
				const record = typeof value === "object" && value !== null ? value : {};
				const x = readSpot(record["x"]);
				const y = readSpot(record["y"]);
				return x === void 0 || y === void 0 ? void 0 : {
					x,
					y
				};
			};
			const palette = spotOf(record["palette"]);
			const bar = spotOf(record["bar"]);
			return {
				...typeof color === "string" && HEX_COLOR.test(color) ? { color } : {},
				...isWeight(record["weight"]) ? { weight: record["weight"] } : {},
				...palette === void 0 ? {} : { palette },
				...bar === void 0 ? {} : { bar }
			};
		}
		/**
		* The choices in use before the reader changes one.
		* @param store - where to read from; the browser's storage by default.
		* @returns the remembered preferences, or their defaults.
		*/
		function readPreferences(store = browserStore()) {
			if (store === void 0) return {};
			try {
				const stored = store.getItem(PREFERENCES_KEY);
				if (stored === null) return {};
				return readRecord(JSON.parse(stored));
			} catch {
				return {};
			}
		}
		/**
		* Remember the choices for the next render, and the next session.
		* @param preferences - what the reader has chosen now.
		* @param store - where to write; the browser's storage by default.
		*/
		function rememberPreferences(preferences, store = browserStore()) {
			if (store === void 0) return;
			const { color, weight, palette, bar } = preferences;
			try {
				store.setItem(PREFERENCES_KEY, JSON.stringify({
					...color === void 0 ? {} : { color },
					...weight === void 0 ? {} : { weight: clampWeight(weight) },
					...palette === void 0 ? {} : { palette: {
						x: palette.x,
						y: palette.y
					} },
					...bar === void 0 ? {} : { bar: {
						x: bar.x,
						y: bar.y
					} }
				}));
			} catch {}
		}
		//#endregion
		//#region src/shared/http.ts
		/**
		* The plugin's HTTP boundary constants, shared by Host and Client.
		*
		* Both halves register and call the same routes outside the shell's `/api`
		* channel, so the guard header and prefix must be identical. They live here —
		* the only place both halves may import — so the two can never drift.
		* @module dsh-figmark/shared/http
		*/
		/** Request header every plugin route requires. */
		const GUARD_HEADER = "x-dsh-figmark";
		/** Route prefix owned by this plugin. */
		const ROUTE_PREFIX = "/dsh-figmark";
		//#endregion
		//#region src/client/host-api.ts
		/** Error carrying the Host's own message. */
		var AnnotatorHostError = class extends Error {
			/**
			* @param message - the message the Host returned.
			*/
			constructor(message) {
				super(message);
				this.name = "AnnotatorHostError";
			}
		};
		/**
		* Encode one artifact as base64 for the JSON body.
		* @param source - bytes, or the blob an export produced.
		* @returns base64 text.
		*/
		async function toBase64(source) {
			const bytes = source instanceof Uint8Array ? source : new Uint8Array(await source.arrayBuffer());
			let binary = "";
			const chunk = 32768;
			for (let offset = 0; offset < bytes.length; offset += chunk) binary += String.fromCharCode(...bytes.subarray(offset, offset + chunk));
			return btoa(binary);
		}
		/**
		* Read the figure's saved annotation.
		* @param address - the preview tab's file address.
		* @param signal - cancels the request when the tab closes.
		* @returns the Host's answer.
		* @throws {AnnotatorHostError} when the Host refuses the address.
		*/
		async function loadAnnotation(address, signal) {
			const url = `${ROUTE_PREFIX}/annotation?${new URLSearchParams({ address }).toString()}`;
			const response = await fetch(url, {
				headers: { [GUARD_HEADER]: "1" },
				signal
			});
			const body = await response.json();
			if (body.ok !== true || body.figure === void 0) throw new AnnotatorHostError(body.error ?? `annotation read failed with status ${response.status}`);
			return {
				path: body.figure.path,
				mediaType: body.figure.mediaType,
				sha256: body.figure.sha256,
				annotation: body.annotation ?? null
			};
		}
		/**
		* Largest request a `keepalive` fetch may carry.
		*
		* The browser silently refuses anything above this, and a refused save is worse
		* than a normal one: the caller believes the draft was written when it was not.
		*/
		const KEEPALIVE_LIMIT = 6e4;
		/**
		* Persist one annotation document and its flattened review artifact.
		*
		* The payload each artifact travels in follows the annotated figure's own kind:
		* a paged document is reviewed as a PDF and a single surface as a PNG, which is
		* the pairing the Host writes and the pairing it refuses to mix up.
		*
		* @param address - the preview tab's file address.
		* @param document - the document to save.
		* @param review - flattened PNG, or the annotated PDF, when the browser exported one.
		* @param keepalive - whether the request should outlive the page, for an autosave
		*   racing a reload. Ignored when the body is too large for one.
		* @returns the paths the Host wrote.
		* @throws {AnnotatorHostError} when the Host refuses the write.
		*/
		async function saveAnnotation(address, document, review, keepalive = false) {
			const paged = document.figure.mediaType === "application/pdf";
			const payload = JSON.stringify({
				address,
				annotation: document,
				...review === void 0 ? {} : { [paged ? "annotatedPdf" : "reviewImage"]: await toBase64(review) }
			});
			const response = await fetch(`${ROUTE_PREFIX}/annotation`, {
				method: "POST",
				headers: {
					[GUARD_HEADER]: "1",
					"content-type": "application/json"
				},
				body: payload,
				...keepalive && payload.length <= KEEPALIVE_LIMIT ? { keepalive: true } : {}
			});
			const body = await response.json();
			if (body.ok !== true || body.annotationPath === void 0) throw new AnnotatorHostError(body.error ?? `annotation save failed with status ${response.status}`);
			return {
				annotationPath: body.annotationPath,
				reviewPath: body.reviewPath ?? null
			};
		}
		/**
		* Delete the sidecars of one figure, leaving the figure alone.
		*
		* Called when the reader removes every mark, and after a successful delivery: an
		* annotation with nothing left in it is not worth keeping, and a file left behind
		* is exactly what made a deleted annotation come back on the next open.
		*
		* @param address - the preview tab's file address.
		* @throws {AnnotatorHostError} when the Host refuses the address or the removal.
		*/
		async function deleteAnnotation(address) {
			const query = new URLSearchParams({ address });
			const response = await fetch(`${ROUTE_PREFIX}/annotation?${query.toString()}`, {
				method: "DELETE",
				headers: { [GUARD_HEADER]: "1" }
			});
			const body = await response.json();
			if (body.ok !== true) throw new AnnotatorHostError(body.error ?? `annotation removal failed with status ${response.status}`);
		}
		//#endregion
		//#region src/client/styles.ts
		/**
		* Styles for the annotator body.
		*
		* The DSH client bundle route serves JavaScript only, so the stylesheet travels
		* inside the bundle and is injected once on first mount. Colors come from the
		* shell's `--dsw-*` aliases, which the theme owner resolves per palette, so the
		* panel follows the shell into the light one; the fallbacks are the inherited
		* values, so a shell that defines no token still renders something legible
		* rather than a palette of its own.
		* @module dsh-figmark/client/styles
		*/
		/** Marker attribute identifying our own style element. */
		const STYLE_MARKER = "data-dsh-figmark";
		/** The stylesheet text. */
		const STYLES = `
/* An accent of the plugin's own.
   The shell's --dsw-alias-brand-primary is not a brand colour in this theme — it
   resolves to the *ink* (near-black on light, near-white on dark), because the shell
   uses it for filled buttons in monochrome. Reading it as "the blue" turned this
   panel's sliders, filled buttons and selection rings into ink: a black knob on a
   white rail, and a wedge that goes solid black at the heaviest setting. The alias
   stays as the fallback so a shell that really does define a brand colour still wins,
   but the accent is named here so every rule reads one variable instead of quietly
   inheriting whatever "primary" means that week.
   The dark block re-states it, because a blue tuned for white paper is too dark on a
   near-black panel. */
/* The panel follows the shell's palette rather than carrying one of its own: every
   colour below is an alias the theme owner resolves, with the inherited value as the
   fallback so a shell that defines nothing still renders something legible. */
.da-root{--da-accent:#176df2;--da-accent-soft:rgba(23,109,242,.14);
  position:relative;display:flex;flex-direction:column;height:100%;min-height:0;overflow:hidden;color:var(--dsw-alias-label-primary,inherit);background:var(--dsw-alias-bg-document-preview,transparent)}
/* The shell marks its dark palette on <body> rather than through prefers-color-scheme:
   a reader can pick either palette whatever the OS is set to, so following the shell's
   own switch is what keeps the accent readable in both. A blue tuned for white paper
   is too dark on a near-black panel. */
body[data-ds-dark-theme] .da-root{--da-accent:#4c8dff;--da-accent-soft:rgba(76,141,255,.22)}

/* Every small picture in the panel is one stroke set, declared once: without this
   an svg with no fill of its own falls back to a solid black shape, which is what
   turned the dock and the cards into blobs of ink. */
.da-ico{width:16px;height:16px;flex:0 0 auto;fill:none;stroke:currentColor;
  stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}

/* --- the floating tool palette ------------------------------------------- */
/* The tools float over the figure in a dark rounded pill so they can be parked
   off whichever corner the reader is working on. Dark rather than light: it sits
   on top of a white figure and a white panel, and a dark chip is what reads as
   "this is a control" instead of as one more piece of the picture. */
.da-palette{position:absolute;z-index:8;display:flex;flex-direction:column;align-items:center;gap:2px;
  padding:6px 5px;border-radius:16px;background:var(--dsw-alias-bg-inverse,#2d2d2d);color:#fff;
  box-shadow:0 8px 26px rgba(10,14,24,.3),0 0 0 1px rgba(255,255,255,.08)}
/* While it is being dragged the pointer is the grip, whatever it passes over. */
.da-palette[data-dragging="true"]{opacity:.94;box-shadow:0 12px 32px rgba(10,14,24,.4),0 0 0 1px rgba(255,255,255,.14)}
.da-palette[data-dragging="true"] *{cursor:move !important}
/* The handle: a block of six dots, the one part of a strip that only drags. The block
   is turned to suit the strip — wider than tall on the bar, taller than wide on the
   palette — because a grip whose proportions fight its strip looks borrowed from the
   other one. */
.da-palette-grip{display:flex;align-items:center;justify-content:center;width:26px;height:17px;
  border-radius:5px;cursor:move;color:rgba(255,255,255,.55);touch-action:none;flex:0 0 auto}
.da-palette-grip:hover{color:rgba(255,255,255,.92);background:rgba(255,255,255,.1)}
/* The dots' box follows the block: three across by two down needs width, two across
   by three down needs height. Sized per block rather than once, so the svg is not
   letterboxed inside its own handle. */
.da-grip-dots{width:12px;height:8px;fill:currentColor;display:block}
.da-bar .da-palette-grip{width:16px;height:18px}
.da-bar .da-grip-dots{width:8px;height:12px}
/* A tile is a round button holding one white glyph. No word under it: six glyphs in
   a column are read at a glance, and the word is still there as the tooltip and as
   the accessible name. */
.da-palette .da-tool{width:32px;height:32px;padding:0;border:0;border-radius:50%;
  background:transparent;color:#fff;gap:0}
.da-palette .da-tool:hover{background:rgba(255,255,255,.14)}
.da-palette .da-tool[aria-pressed="true"]{background:#176df2;color:#fff}
.da-palette .da-tool .da-tool-icon{height:auto}
.da-palette .da-tool .da-tool-icon svg{width:16px;height:16px;stroke-width:1.9}

/* --- the size rail ------------------------------------------------------- */
/* A vertical rail along the left edge of the figure: how heavy the pen is, and how
   big a point mark's pin is. Idle it is a hairline, so it costs the figure nothing;
   crossing it opens it out to a track. The track is *tapered* — a thin line at the
   bottom and a broad one at the top — because the control's whole subject is
   thickness, and a wedge says which way is heavier without reading a number.
   A horizontal range input is rotated upright inside the pill: it keeps dragging,
   arrow keys, the step and the accessible name, while the rail above does the
   drawing. The drawn parts never take the pointer, or grabbing the knob would grab
   the knob instead of the slider. */
.da-weight{position:absolute;z-index:7;left:6px;top:50%;transform:translateY(-50%);
  --da-track-inset:10px;--da-knob-size:11px;
  display:flex;align-items:center;justify-content:center;width:7px;height:200px;
  border-radius:999px;background:var(--dsw-alias-border-l2,rgba(127,127,127,.22));
  cursor:ns-resize;transition:width .16s ease,background .16s ease,box-shadow .16s ease}
.da-weight:hover,.da-weight:focus-within{width:30px;background:var(--dsw-alias-bg-layer-2,#fff);
  box-shadow:0 5px 18px rgba(20,40,80,.16),0 0 0 0.5px var(--dsw-alias-border-l2,currentColor)}
/* The track is an svg in the body: a hairline at the bottom that opens into a rounded
   shoulder at the top. It is not a clip-path polygon because a polygon has no rounded
   ends — the corners were what made the wedge read as a cut-out blade rather than a
   part of the panel. preserveAspectRatio="none" stretches one 18x100 shape over the
   rail's height, so the shoulders stay smooth at any length.
   The height is written out rather than expressed as top+bottom: an svg is a replaced
   element: with a viewBox it takes its intrinsic height for its width and ignores the
   bottom offset entirely. The track was therefore a fixed 100px tall while the knob
   travelled the whole 200px rail, which is why the two could never line up. */
.da-weight-svg{position:absolute;left:50%;top:var(--da-track-inset);height:calc(100% - 2 * var(--da-track-inset));
  width:18px;transform:translateX(-50%);opacity:0;pointer-events:none;
  transition:opacity .16s ease}
.da-weight:hover .da-weight-svg,.da-weight:focus-within .da-weight-svg{opacity:1}
/* The knob sits on the value: the only part that shows at rest, so the rail reads as
   a slider waiting to be touched rather than a bare rule. */
/* The blue: a bar of the same width as the groove, its height the one number the
   knob also uses, so its top edge is the knob's centre at every weight. */
.da-weight-fill{position:absolute;left:50%;bottom:var(--da-track-inset);width:5px;
  transform:translateX(-50%);border-radius:999px;background:var(--da-accent,#176df2);
  opacity:0;pointer-events:none;transition:opacity .16s ease}
.da-weight:hover .da-weight-fill,.da-weight:focus-within .da-weight-fill{opacity:1}
.da-weight-knob{position:absolute;left:50%;width:var(--da-knob-size,11px);height:var(--da-knob-size,11px);
  border-radius:50%;transform:translateX(-50%);pointer-events:none;
  background:var(--dsw-alias-bg-layer-2,#fff);
  box-shadow:0 1px 4px rgba(20,40,80,.28),0 0 0 1px var(--dsw-alias-border-l3,currentColor);
  transition:width .16s ease,height .16s ease,background .16s ease}
.da-weight:hover,.da-weight:focus-within{--da-knob-size:15px}
.da-weight:hover .da-weight-knob,.da-weight:focus-within .da-weight-knob{
  background:var(--da-accent,#176df2);
  box-shadow:0 2px 7px rgba(20,40,80,.3)}
/* The browser's own range, rotated upright and made transparent. It spans the whole
   rail so a press anywhere on it lands on the slider — including on the knob, which
   is why the knob is pointer-transparent. */
.da-weight-input{position:absolute;left:50%;top:50%;width:200px;height:30px;margin:0;opacity:0;
  transform:translate(-50%,-50%) rotate(-90deg);cursor:ns-resize;appearance:none;background:transparent}

/* --- the floating bar ---------------------------------------------------- */
/* The same object as the tool palette: a dark rounded strip over the figure, which
   the reader can drag clear of whatever they are looking at. It carries the records
   and the hand-off; the tools have their own strip so either can be parked alone.
   Centred along the bottom until it is moved, which is where a bar belongs. */
.da-bar{position:absolute;z-index:8;left:50%;bottom:12px;transform:translateX(-50%);
  display:flex;align-items:center;gap:2px;flex:0 0 auto;flex-wrap:wrap;
  width:max-content;max-width:calc(100% - 20px);padding:4px 5px;border-radius:16px;
  background:var(--dsw-alias-bg-inverse,#2d2d2d);color:#fff;
  box-shadow:0 8px 26px rgba(10,14,24,.3),0 0 0 1px rgba(255,255,255,.08)}
/* Parked: placed from the top by the reader's drag, so the bottom anchor that keeps
   it centred while untouched must not also apply — with both set it stretches. */
.da-bar[data-parked="true"]{bottom:auto}
.da-bar[data-dragging="true"]{opacity:.94;box-shadow:0 12px 32px rgba(10,14,24,.4),0 0 0 1px rgba(255,255,255,.14)}
.da-bar[data-dragging="true"] *{cursor:move !important}
/* The bar's buttons are white glyphs on the dark strip. The one filled control is
   still the way out. */
.da-bar .da-dock-btn{color:#fff}
.da-bar .da-dock-btn:hover{background:rgba(255,255,255,.14)}
.da-bar .da-dock-btn[aria-pressed="true"]{background:#176df2;color:#fff}
.da-bar .da-dock-sep{background:rgba(255,255,255,.22)}
.da-bar .da-dock-btn-primary{background:#176df2;color:#fff;border-color:#176df2}
.da-bar .da-dock-btn-primary:hover{background:#176df2;opacity:.92}
.da-bar .da-dock-dot{background:#4c8dff}
.da-bar .da-dock-count{background:#176df2;color:#fff}
.da-bar .da-style{width:30px;height:28px;padding:0;border:0;border-radius:50%;background:transparent;color:#fff}
.da-bar .da-style:hover{background:rgba(255,255,255,.14)}
.da-bar .da-palette-grip{color:rgba(255,255,255,.55)}
.da-bar .da-palette-grip:hover{color:#fff;background:rgba(255,255,255,.12)}
.da-bar-tools{display:flex;align-items:center;gap:3px;flex:0 0 auto}
.da-spacer{flex:1 1 auto}
/* A hairline between groups, so the row reads as decisions — which tool, which
   style, which record — instead of a dozen equal buttons. */
.da-sep{flex:0 0 auto;width:1px;height:18px;margin:0 2px;background:var(--dsw-alias-border-l3,currentColor);opacity:.7}

/* Buttons are quiet by default: a bordered chip is a lot of ink for "undo". Only
   the thing that is *chosen* and the thing that *leaves* the panel are filled. */
.da-btn{display:inline-flex;align-items:center;justify-content:center;gap:5px;height:26px;padding:0 9px;white-space:nowrap;border:0.5px solid var(--dsw-alias-border-l2,currentColor);border-radius:9px;background:var(--dsw-alias-bg-base,transparent);color:inherit;font:inherit;font-size:12px;line-height:1;cursor:pointer}
.da-btn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.1))}
.da-btn:disabled{opacity:.4;cursor:default}
.da-btn:disabled:hover{background:var(--dsw-alias-bg-base,transparent)}
.da-btn svg{width:14px;height:14px;flex:0 0 auto;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
/* A quiet button has no frame at all until the pointer is on it: it is an action,
   not a thing, and the row it sits in is already framed. */
.da-btn-quiet{border-color:transparent;background:transparent;height:24px;padding:0 7px;font-size:11px;color:var(--dsw-alias-label-secondary,inherit)}

/* A tool is a tile: a picture of the shape it draws, with its word underneath.
   Six of them fit in one row this way, where six inline words did not — and the
   picture is what a reader who has used the tool once recognizes without reading. */
.da-tool{flex-direction:column;justify-content:center;gap:1px;width:40px;height:34px;padding:0;border-color:transparent;background:transparent;font-size:9px;border-radius:9px}
.da-tool .da-tool-icon{display:flex;align-items:center;justify-content:center;height:14px}
.da-tool .da-tool-icon svg{width:13px;height:13px;stroke-width:1.8}
.da-tool .da-tool-label{font-size:10px;line-height:1;white-space:nowrap;color:var(--dsw-alias-label-secondary,inherit)}
/* The armed tool is the one state in this row the reader must never hunt for: it is
   the only tile with a fill, and the only label in the brand colour. */
.da-tool[aria-pressed="true"]{border-color:transparent;background:var(--da-accent-soft,rgba(23,109,242,.1));color:var(--da-accent,currentColor)}
.da-tool[aria-pressed="true"] .da-tool-label{color:var(--da-accent,currentColor);font-weight:600}
.da-tool[aria-pressed="true"] svg{stroke-width:2.1}
.da-tool:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.08))}
.da-btn-icon{width:30px;padding:0}

/* --- the style popup ---------------------------------------------------- */
/* One button that shows the colour in use; the swatches and the size slider are
   the same controls they were, just not spent on the tool row's whole width. */
.da-stylewrap{position:relative;flex:0 0 auto}
/* The style fold floats above the bar rather than taking a row of it: opened over
   the figure, it costs the picture nothing and lands where the eye already is. */
/* Opens upwards by default, because the bar lives at the bottom. Parked at the top
   there is nothing above it to open into, so the fold turns over and hangs below its
   own button instead — decided by the same measurement the records use. */
.da-style-row[data-side="below"]{bottom:auto;top:calc(100% + 6px);box-shadow:0 -6px 22px rgba(20,40,80,.12),0 6px 22px rgba(20,40,80,.16)}
.da-style-row{position:absolute;left:8px;bottom:calc(100% + 6px);z-index:9;
  display:flex;align-items:center;gap:8px;flex-wrap:wrap;max-width:calc(100% - 16px);
  padding:8px 10px;border:0.5px solid var(--dsw-alias-border-l2,currentColor);border-radius:11px;
  background:var(--dsw-alias-bg-layer-2,#fff);box-shadow:0 6px 22px rgba(20,40,80,.16)}
.da-style{padding:0 8px;background:var(--dsw-alias-bg-base,transparent)}
.da-swatch-dot{width:13px;height:13px;border-radius:50%;border:2px solid var(--dsw-alias-bg-base,transparent);box-shadow:0 0 0 1px var(--dsw-alias-border-l4,rgba(127,127,127,.5));flex:0 0 auto}
.da-style-caret{font-size:9px;line-height:1;color:var(--dsw-alias-label-tertiary,inherit)}
/* The popup floats over the figure rather than pushing the canvas down: opening a
   settings panel must not move the picture being drawn on. */
.da-style-label{font-size:11px;color:var(--dsw-alias-label-tertiary,inherit)}
.da-style-colors{display:flex;gap:8px}
/* Anywhere else is "done here": the panel closes on the click that lands outside it
   rather than trapping the reader in a popup with one way out. */
.da-swatch{width:20px;height:20px;border-radius:50%;corner-shape:round;border:2px solid var(--dsw-alias-bg-base,transparent);box-shadow:0 0 0 1px var(--dsw-alias-border-l4,rgba(127,127,127,.5));cursor:pointer;padding:0}
.da-swatch[aria-pressed="true"]{box-shadow:0 0 0 2px var(--da-accent,currentColor)}
/* --- the figure on its table -------------------------------------------- */
/* A figure is a sheet on a table, not a picture floating in a void: the white paper
   is what gives the panel a middle, and the gap around it is the margin the eye
   needs to see where the drawing stops. */
.da-stage{position:relative;display:flex;align-items:safe center;justify-content:safe center;flex:1 1 auto;overflow:auto;min-height:0;padding:14px;background:var(--dsw-alias-bg-document-preview,transparent)}
.da-surface{position:relative;flex:0 0 auto;margin:0;transform-origin:top left}
/* The paper: the figure plus the margin a mark may have needed. It is deliberately
   left transparent — the white sheet belongs to the figure, so a margin that only
   exists because a mark reached past the edge reads as board round a card rather than
   as more of the figure. The exported picture still gets its white fill: that one is
   looked at by someone who has no board behind it. */
.da-paper{background:transparent}
/* The figure is the sheet: white, rounded, lifted off the panel. This is the element
   that carries the paper look, which is why the margin can be see-through without the
   drawing losing its edge. */
.da-figure-frame{background:var(--dsw-alias-bg-base,#fff);border-radius:4px;overflow:hidden;
  box-shadow:var(--dsw-elevation-prominent,0 1px 3px rgba(0,0,0,.14),0 8px 24px rgba(0,0,0,.08))}
.da-figure{display:block;user-select:none;-webkit-user-drag:none}
/* The table is a thing you can push. The hand only shows under the tools that
   leave a drag free to move the view: under a drawing tool the same drag draws. */
.da-stage[data-hand="true"]{cursor:grab}
/* A drag that has started is a hand closed on the table: the cursor is how the
   reader knows the gesture took, without moving the picture first. */
.da-stage[data-panning="true"],.da-stage[data-panning="true"] *{cursor:grabbing}
/* The rendered document takes the figure's place; the overlay above it owns every
   pointer event, which is also what keeps a link inside it from navigating. */
.da-html{display:block;border:0;background:#fff;pointer-events:none}
.da-overlay{position:absolute;touch-action:none}
.da-overlay[data-mode="view"]{pointer-events:none}
.da-overlay[data-tool="select"]{cursor:default}
.da-overlay:not([data-tool="select"]){cursor:crosshair}
.da-page{font-size:12px;min-width:44px;text-align:center;color:var(--dsw-alias-label-secondary,inherit)}
/* The document's toolbar sits above the page body, so the pane is one column of
   definite height and the body takes what is left of it. */
.da-pdf{display:flex;flex-direction:column;height:100%;min-height:0}
.da-pdf>.da-root{flex:1 1 auto;height:auto;min-height:0}
/* The page slot before the first raster. It takes the column the body's stage
   takes, so the frame around it — the toolbar above all — is in place from the
   first paint and does not move when the page arrives. */
.da-placeholder{flex:1 1 auto;min-height:0;background:var(--dsw-alias-bg-document-preview,transparent)}

/* --- the two cards under the figure ------------------------------------- */
/* --- the dock ------------------------------------------------------------ */
/* The dock's buttons are quiet circles in the bar: they are the actions that are
   not tools, and a filled one is reserved for the way out. */
.da-dock-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;
  width:28px;height:28px;padding:0;border:0;border-radius:50%;background:transparent;
  color:inherit;cursor:pointer;flex:0 0 auto}
.da-dock-btn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12))}
.da-dock-btn[aria-pressed="true"]{background:var(--da-accent-soft,rgba(23,109,242,.12));color:var(--da-accent,#176df2)}
.da-dock-btn svg{width:15px;height:15px}
.da-dock-btn:disabled{opacity:.4;cursor:default}
.da-dock-btn:disabled:hover{background:transparent}
/* The one filled control in the panel is the way out of it. */
.da-dock-btn-primary{border-color:var(--da-accent,#176df2);background:var(--da-accent,#176df2);color:#fff;box-shadow:0 2px 8px rgba(23,109,242,.32)}
.da-dock-btn-primary:hover{opacity:.92;background:var(--da-accent,#176df2)}
/* A dot, not a count: "there is a goal written" is all the bar needs to say about
   a field it is not a list of. */
.da-dock-dot{position:absolute;top:3px;right:4px;width:5px;height:5px;border-radius:50%;
  background:var(--da-accent,#176df2)}
.da-dock-sep{width:1px;height:16px;margin:0 3px;background:var(--dsw-alias-border-l3,currentColor);opacity:.6;flex:0 0 auto}
/* The count rides on the list's own button: it is the one thing about the list a
   reader wants without opening it. */
.da-dock-count{position:absolute;top:-1px;right:-2px;min-width:14px;height:14px;padding:0 3px;
  border-radius:7px;background:var(--da-accent,#176df2);color:#fff;
  font-size:9px;font-weight:700;line-height:14px;text-align:center;font-variant-numeric:tabular-nums}

/* --- the floating records ------------------------------------------------ */
/* A record is a card over the figure, opened from the dock and closed on its own
   button. It is anchored to the pill it came from so it reads as that pill's
   contents rather than as a panel that happened to appear. */
.da-float{position:absolute;z-index:9;display:flex;flex-direction:column;gap:7px;padding:10px 11px;
  border:0.5px solid var(--dsw-alias-border-l2,currentColor);border-radius:12px;
  background:var(--dsw-alias-bg-layer-2,#fff);box-shadow:0 6px 22px rgba(20,40,80,.14),0 0 0 1px rgba(20,40,80,.03)}
.da-card-title{display:flex;align-items:center;gap:5px;min-width:0;font-size:12px;font-weight:650;
  color:var(--dsw-alias-label-primary,inherit)}
.da-card-title svg{width:14px;height:14px;flex:0 0 auto;color:var(--da-accent,#176df2)}

.da-float-head{display:flex;align-items:center;gap:7px}
.da-float-head .da-card-title{flex:1 1 auto;min-width:0}
/* The records hang off the bar rather than off the panel, so dragging the bar takes
   them with it. Both offsets are written inline — one real, one auto — because a
   card that opens upwards and one that opens downwards differ in which side is
   fixed, and a card with no height of its own stretches if both are set. */
.da-float-record{width:min(330px,calc(100% - 22px))}
.da-float-list{max-height:min(58%,400px)}
.da-float-list .da-marks{overflow:auto;min-height:0}
/* The detail field is placed by arithmetic, not by the stylesheet: its left and top
   come from the mark it belongs to. It is a pill rather than a card — no head, no
   border between the field and the panel — so writing about a mark costs one line
   over the figure instead of a box that covers it. */
.da-float-detail{width:300px;max-width:calc(100% - 16px);gap:0;padding:4px;border-radius:22px;
  flex-direction:row;align-items:flex-end;
  box-shadow:0 8px 26px rgba(20,40,80,.2),0 0 0 1px rgba(20,40,80,.04)}
.da-float .da-comment{flex:1 1 auto;min-width:0;box-sizing:border-box;border:0;background:transparent;
  color:inherit;font:inherit;font-size:13px;line-height:1.55;padding:7px 10px;resize:none;
  /* One line until the sentence needs more, then as many as it takes: the pill is a
     place to type, and a sentence read through a slot two lines tall is a sentence
     the reader has to scroll to finish. The rule for the record cards' textareas sets
     a 74px floor, hence the explicit reset. The scrollbar is hidden because it is not
     a scroll view — wheel and keys still work once the sentence outgrows the pane. */
  min-height:0;height:auto;max-height:min(180px,42vh);overflow-y:auto;outline:none;
  field-sizing:content;scrollbar-width:none}
.da-float .da-comment::-webkit-scrollbar{width:0;height:0}
.da-float .da-comment::placeholder{color:var(--dsw-alias-label-tertiary,currentColor);opacity:.85}
/* The hand-off appears only once the field says something: an empty pill is a
   place to type, not a decision to make. */
.da-comment-send{display:flex;align-items:center;gap:4px;flex:0 0 auto;padding-bottom:3px;padding-right:3px}
.da-comment-send-btn{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;
  border:0;border-radius:50%;background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12));
  color:var(--dsw-alias-label-secondary,currentColor);cursor:pointer;padding:0}
.da-comment-send-btn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.2));
  color:var(--dsw-alias-label-primary,currentColor)}
.da-comment-send-btn:disabled{opacity:.45;cursor:default}
.da-comment-send-btn svg{width:15px;height:15px}
.da-comment-send-primary{background:var(--da-accent,#176df2);color:#fff}
.da-comment-send-primary:hover{background:var(--da-accent,#176df2);color:#fff;filter:brightness(1.08)}
.da-float textarea{width:100%;box-sizing:border-box;min-height:74px;max-height:200px;resize:vertical;border:0.5px solid var(--dsw-alias-border-l3,currentColor);border-radius:9px;background:var(--dsw-alias-bg-layer-2,transparent);color:inherit;font:inherit;font-size:12px;padding:8px 10px;line-height:1.65}
.da-float textarea:focus{outline:none;border-color:var(--da-accent,#176df2)}
.da-btn-count{display:inline-flex;align-items:center;justify-content:center;min-width:16px;height:16px;
  padding:0 4px;border-radius:8px;background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.14));
  font-size:10px;font-weight:600;font-variant-numeric:tabular-nums}

/* A field is a labelled well: the input, and the counter that says how much room is
   left, pinned to its bottom right. */
.da-field{display:flex;flex-direction:column;gap:3px;position:relative;min-width:0}
.da-count{align-self:flex-end;font-size:10px;font-variant-numeric:tabular-nums;
  color:var(--dsw-alias-label-tertiary,currentColor)}
/* What the selected mark is, in one word: the detail field is disabled until there
   is something to describe, and this says what it would describe. */
.da-chip{display:inline-flex;align-items:center;height:16px;padding:0 6px;border-radius:5px;
  background:var(--da-accent-soft,rgba(23,109,242,.12));
  color:var(--da-accent,#176df2);font-size:10px;font-weight:600}
/* The "?" beside a card's name: the long form of what that field is for. */
.da-hintdot{display:inline-flex;align-items:center;justify-content:center;width:13px;height:13px;
  border-radius:50%;border:0.5px solid var(--dsw-alias-border-l3,currentColor);
  font-size:9px;font-weight:700;color:var(--dsw-alias-label-tertiary,currentColor);
  cursor:help;flex:0 0 auto}
/* Each row of the list is a card of its own: the number in the mark's colour, the
   sentence as the thing you press, and the sentence's own shape and anchor under it
   in smaller type. A borderless run of text would read as one paragraph of marks. */
.da-marks{display:flex;flex-direction:column;gap:3px;min-height:0}
.da-mark{display:flex;align-items:center;gap:7px;padding:5px 6px;border-radius:8px;
  border:0.5px solid transparent;min-width:0}
.da-mark:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.08))}
.da-mark[data-selected="true"]{border-color:var(--da-accent,#176df2);
  background:var(--dsw-alias-interactive-bg-hover,rgba(23,109,242,.08))}
.da-mark-index{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;
  width:20px;height:20px;border-radius:6px;color:#fff;font-size:11px;font-weight:700;
  font-variant-numeric:tabular-nums}
.da-mark-text{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:1px;
  padding:0;border:0;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}
.da-mark-title{display:block;font-size:12px;line-height:1.35;overflow:hidden;
  text-overflow:ellipsis;white-space:nowrap}
.da-mark-meta{display:block;font-size:10px;line-height:1.35;
  color:var(--dsw-alias-label-tertiary,currentColor);overflow:hidden;
  text-overflow:ellipsis;white-space:nowrap}
.da-mark-del{flex:0 0 auto;padding:2px 6px;border:0;border-radius:6px;background:transparent;
  color:var(--dsw-alias-label-tertiary,currentColor);font:inherit;font-size:10px;cursor:pointer}
.da-mark-del:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.14));color:inherit}

/* The empty list is a picture and two lines: a card of grey text reads as broken,
   and "nothing yet" is a state, not an error. */
.da-empty{display:flex;flex-direction:column;align-items:center;gap:5px;padding:18px 10px 14px;text-align:center}
.da-empty-ico{width:46px;height:46px;fill:none;stroke:var(--dsw-alias-border-l4,currentColor);stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round;opacity:.85}
.da-empty-title{font-size:12px;font-weight:650;color:var(--dsw-alias-label-secondary,inherit)}
.da-empty-hint{font-size:11px;line-height:1.6;color:var(--dsw-alias-label-tertiary,inherit);max-width:190px}
.da-status{flex:0 0 auto;padding:6px 10px;font-size:12px;color:var(--dsw-alias-label-secondary,inherit)}
.da-status[data-tone="error"]{color:var(--dsw-alias-label-error,var(--dsw-alias-state-error-primary,currentColor))}
.da-status[data-tone="ok"]{color:var(--dsw-alias-state-success-primary,currentColor)}
.da-hint{padding:10px 2px;font-size:12px;line-height:1.6;color:var(--dsw-alias-label-tertiary,inherit)}

/* --- the Markdown body: an editor over the source, or the diff it produced --- */
.da-md{display:flex;flex-direction:column;height:100%;min-height:0}
.da-md-stats{flex:0 0 auto;font-size:12px;white-space:nowrap;color:var(--dsw-alias-label-secondary,inherit)}
/* The editor pane: the textarea, and the gutter that only exists while the
   document toolbar's wrap preference is off (a wrapped line has no one row). */
.da-md-pane{flex:1 1 auto;display:flex;min-height:0;background:var(--dsw-alias-bg-base,transparent)}
.da-md-gutter{flex:0 0 auto;overflow:hidden;padding:8px 6px 8px 10px;text-align:right;color:var(--dsw-alias-label-tertiary,inherit);font-size:12px;line-height:1.6;font-family:var(--dsw-font-family-mono,ui-monospace,SFMono-Regular,Menlo,monospace);user-select:none}
.da-md-editor{flex:1 1 auto;min-height:0;width:100%;padding:8px 10px;border:none;outline:none;resize:none;background:var(--dsw-alias-bg-base,transparent);color:inherit;font-size:12px;line-height:1.6;tab-size:2;font-family:var(--dsw-font-family-mono,ui-monospace,SFMono-Regular,Menlo,monospace)}
.da-diff{flex:1 1 auto;min-height:0;overflow:auto;padding:4px 0;font-size:12px;line-height:1.6;font-family:var(--dsw-font-family-mono,ui-monospace,SFMono-Regular,Menlo,monospace)}
.da-diff-head{padding:2px 8px;color:var(--dsw-alias-label-tertiary,inherit);background:var(--dsw-alias-bg-layer-2,transparent)}
.da-diff-line{display:flex;gap:6px;padding:0 8px}
.da-diff-no{flex:0 0 auto;min-width:32px;text-align:right;color:var(--dsw-alias-label-tertiary,inherit);user-select:none}
.da-diff-sign{flex:0 0 auto;width:8px}
.da-diff-text{flex:1 1 auto;white-space:pre-wrap;word-break:break-word}
.da-diff-line[data-kind="add"] .da-diff-sign{color:var(--dsw-alias-state-success-primary,currentColor)}
.da-diff-line[data-kind="remove"] .da-diff-sign{color:var(--dsw-alias-state-error-primary,currentColor)}
/* One note field per hunk: the reader's explanation of that change. */
.da-diff-note{display:flex;align-items:center;gap:6px;padding:2px 8px 8px 8px;color:var(--dsw-alias-label-tertiary,inherit);font-size:12px}
.da-diff-note-label{flex:0 0 auto;white-space:nowrap}
.da-diff-note input{flex:1 1 auto;min-width:0;border:0.5px solid var(--dsw-alias-border-l2,currentColor);border-radius:var(--dsw-radius-sm,6px);background:var(--dsw-alias-bg-base,transparent);color:inherit;font:inherit;font-size:12px;padding:3px 6px}
`;
		/**
		* Inject the stylesheet once per document.
		* @param doc - document to inject into.
		*/
		function ensureStyles(doc) {
			if (doc.querySelector(`style[${STYLE_MARKER}]`) !== null) return;
			const element = doc.createElement("style");
			element.setAttribute(STYLE_MARKER, "");
			element.textContent = STYLES;
			doc.head.appendChild(element);
		}
		//#endregion
		//#region src/client/zoom.ts
		/**
		* Zoom geometry for the document body.
		*
		* The viewer zooms around the pointer: the figure point under the cursor before
		* a gesture is the one under it afterwards. That needs the scrollport's own
		* arithmetic — where the surface sits inside the scrollport's content box, and
		* how far the scrollport has to move to put a figure point back under a client
		* coordinate. It lives apart from the component so the numbers can be exercised
		* without a layout engine.
		* @module dsh-figmark/client/zoom
		*/
		/** Smallest zoom factor the buttons and the gestures agree on. */
		const MIN_ZOOM = .1;
		/** How much one pixel of wheel travel multiplies the zoom by, as an exponent. */
		const ZOOM_RATE = .01;
		/** Most wheel travel one event may count for, in pixels, so one event cannot jump. */
		const MAX_STEP_DELTA = 40;
		/** What a line-mode delta stands for, in pixels. */
		const LINE_HEIGHT = 16;
		/** Fallback viewport height for a page-mode delta, when the caller knows none. */
		const FALLBACK_PAGE_HEIGHT = 800;
		/** Clamp one zoom factor into the range both the buttons and the gestures use. */
		function clampZoom(value) {
			return Math.min(6, Math.max(MIN_ZOOM, value));
		}
		/**
		* Zoom factor one wheel event asks for.
		*
		* A trackpad pinch arrives as a ctrl-modified wheel: a fine stream of small pixel
		* deltas that the factor follows, which is what makes the gesture track the
		* fingers. A mouse notch reports one much larger delta, where following the delta
		* would leap across the figure per click — so the travel one event may count for
		* is capped. Both then use the same rate, and the cap is what keeps a notch
		* one comfortable step rather than the leap the raw delta asks for.
		* @param deltaY - the event's vertical delta.
		* @param deltaMode - 0 for pixels, 1 for lines, 2 for pages.
		* @param pageHeight - the scrollport's height, for a page-mode delta.
		* @returns the factor to multiply the current zoom by.
		*/
		function wheelZoomFactor(deltaY, deltaMode, pageHeight = FALLBACK_PAGE_HEIGHT) {
			if (deltaY === 0) return 1;
			const delta = Math.max(-40, Math.min(MAX_STEP_DELTA, deltaY * (deltaMode === 1 ? LINE_HEIGHT : deltaMode === 2 ? pageHeight : 1)));
			return Math.exp(-delta * ZOOM_RATE);
		}
		/**
		* Where the surface's content box starts, in the scrollport's content coordinates.
		* @param viewportWidth - the scrollport's client width.
		* @param surfaceWidth - the surface's laid-out width.
		* @returns the horizontal offset the auto margins resolve to.
		*/
		function surfaceOffset(viewportWidth, surfaceWidth) {
			return Math.max(0, (viewportWidth - surfaceWidth) / 2);
		}
		/**
		* Scroll offsets that keep the figure point under the pointer under it afterwards.
		*
		* The figure point is located before the zoom, then the surface is re-laid out at
		* the new scale and the scrollport is moved so that point lands back under the
		* same client coordinate. Negative offsets mean the surface is smaller than the
		* scrollport, which is where a browser keeps it at zero.
		* @param viewport - the scrollport's box and current offsets, measured before the zoom.
		* @param pointer - the gesture's position, in client coordinates.
		* @param before - the scale the figure is currently drawn at.
		* @param after - the scale it is about to be drawn at.
		* @param figure - the figure's intrinsic size, in figure pixels.
		* @returns the offsets to apply once the new scale is laid out.
		*/
		function anchoredScroll(viewport, pointer, before, after, figure) {
			const localX = pointer.clientX - viewport.left;
			const localY = pointer.clientY - viewport.top;
			const offsetBefore = surfaceOffset(viewport.clientWidth, figure.width * before);
			const offsetAfter = surfaceOffset(viewport.clientWidth, figure.width * after);
			const figureX = (viewport.scrollLeft + localX - offsetBefore) / before;
			const figureY = (viewport.scrollTop + localY - 12) / before;
			return {
				scrollLeft: Math.max(0, offsetAfter + figureX * after - localX),
				scrollTop: Math.max(0, 12 + figureY * after - localY)
			};
		}
		/**
		* Put one figure-space box into the panel's own coordinates.
		*
		* The figure is drawn at a factor into a host box that may itself be scrolled, so
		* two things have to be undone: the scroll (both boxes are measured in client
		* coordinates, which already includes it) and the factor. Taking both boxes as
		* client rects and subtracting them is what makes this independent of the
		* scrollport's own arithmetic — the host rect moves with the scroll, and the
		* answer moves with it.
		* @param box - the mark's box, in figure pixels.
		* @param host - the figure's host box, in client coordinates.
		* @param panel - the panel's box, in client coordinates.
		* @param figureWidth - the figure's intrinsic width, in figure pixels.
		* @returns the same box, in the panel's coordinates.
		*/
		function scaledBox(box, host, panel, figureWidth) {
			const factor = figureWidth > 0 && host.width > 0 ? host.width / figureWidth : 1;
			return {
				x: host.x - panel.x + box.x * factor,
				y: host.y - panel.y + box.y * factor,
				width: box.width * factor,
				height: box.height * factor
			};
		}
		/**
		* The nearest corner to an anchor that still fits inside the panel.
		*
		* Below the anchor is preferred: the card then reads as a caption of the mark.
		* When there is no room below, it goes above — a card half off the bottom of the
		* panel is a card whose buttons cannot be pressed. Sideways it lines up with the
		* anchor and is then pushed back inside, so a mark at the right edge still gets a
		* whole card.
		* @param anchor - the mark's box, in the panel's coordinates.
		* @param panelWidth - the panel's width, in CSS pixels.
		* @param panelHeight - the panel's height, in CSS pixels.
		* @param size - the card's size, in CSS pixels.
		* @returns the card's top-left corner, in the panel's coordinates.
		*/
		/**
		* The size to place a card by: the card's own, or a stand-in before it is measured.
		*
		* A comment pill grows with the sentence in it, so a placement that assumed one line
		* would push a long comment off the bottom of the panel. The element is measured once
		* it has been laid out; before that — the first frame of a selection, and in any
		* environment that reports zero boxes — the caller's estimate is the only size there
		* is, and the next pass corrects it.
		* @param element - the laid-out card, when there is one.
		* @param fallback - the size to use when the card has not been measured.
		* @returns the width and height to place by.
		*/
		function measuredSize(element, fallback) {
			if (element === null || element.offsetHeight === 0) return fallback;
			return {
				width: element.offsetWidth,
				height: element.offsetHeight
			};
		}
		function placeCard(anchor, panelWidth, panelHeight, size = {
			width: 300,
			height: 48
		}) {
			const below = anchor.y + anchor.height + 10;
			const above = anchor.y - size.height - 10;
			const roomBelow = panelHeight - 8 - below;
			const roomAbove = anchor.y - 10 - 8;
			const top = roomBelow >= size.height ? below : roomAbove >= size.height ? above : Math.max(8, roomAbove > roomBelow ? above : below);
			const widest = Math.max(8, panelWidth - size.width - 8);
			return {
				left: Math.min(Math.max(8, anchor.x), widest),
				top
			};
		}
		/**
		* Where a record that belongs to the bar goes: beside it, centred on it.
		*
		* The bar is a thing the reader can drag, so a record pinned to the panel's bottom
		* edge would end up somewhere the bar no longer is; anchoring to the bar's own box
		* keeps the pair together wherever it is parked.
		*
		* Above the bar while there is room for a record there, otherwise below it. Dragging
		* the bar to the top of the pane is a legitimate thing to do — it is how the bottom
		* of a tall figure is reached — and a record that opened off the top of the panel
		* would be a record that cannot be read. Above is the default because it is where
		* the bar sits on its own, and a fold that opens away from the edge it lives on
		* covers the figure instead of the toolbar.
		*
		* Above is expressed as a distance up from the panel's bottom rather than a top
		* offset, because there the record needs no height known in advance. Below is a top
		* offset for the same reason: it grows downward from the bar's edge.
		* @param bar - the bar's box, in the panel's coordinates.
		* @param panel - the panel's box, in the panel's coordinates.
		* @param width - how wide the record wants to be, in CSS pixels.
		* @returns the record's left edge and either its distance up from the panel's bottom
		*   or its distance down from its top.
		*/
		function placeAboveBar(bar, panel, width = 330) {
			const usable = Math.max(0, panel.width - 16);
			const widest = Math.min(width, usable);
			const centred = bar.x - panel.x + (bar.width - widest) / 2;
			const rightmost = Math.max(8, panel.width - widest - 8);
			const left = Math.min(Math.max(8, centred), rightmost);
			const top = bar.y - panel.y;
			if (top - 10 - 8 >= 180) return {
				left,
				bottom: Math.max(8, panel.height - top + 10)
			};
			return {
				left,
				top: Math.max(8, top + bar.height + 10)
			};
		}
		//#endregion
		//#region src/client/AnnotatorBody.tsx
		/**
		* The document body: one figure with an optional annotation layer.
		*
		* It reads the figure's bytes from the document preview owner (so the plugin
		* never reads files itself), renders them, and hands finished marks to the Host
		* half for storage before delivering them to the agent as a user message.
		* @module dsh-figmark/client/AnnotatorBody
		*/
		/** Palette offered by the toolbar. */
		const COLORS = [
			"#e03131",
			"#1971c2",
			"#f08c00",
			"#2f9e44"
		];
		/** Tools in toolbar order. */
		/**
		* The rail's track, drawn on an 18x100 grid and stretched to whatever height it gets.
		*
		* The control's subject is thickness, so the track says which way is heavier: a little
		* narrower at the bottom, about one part in six. "A little" is the whole note — a
		* water-drop taper reads as decoration rather than as a gauge, and the reader said so
		* twice. One cubic per side and no shoulders, so each flank is a single continuous
		* curve from end to end with nothing for the eye to catch on; the two ends close with
		* faint arcs so the track looks drawn rather than cut off.
		*
		* Stretching it vertically (preserveAspectRatio="none") is what makes the caps need
		* care: the svg is 18x100 over a box about 180 tall, so one y unit is 1.8 of an x unit.
		* An `r` that reads as a circle in the viewBox would be a tall ellipse on screen — the
		* cap's `ry` is therefore set to `rx / 1.8`, which is what puts a round end on it.
		*/
		const WEIGHT_TRACK = [
			"M 6.9 98.9",
			"A 2.1 1.15 0 0 0 11.1 98.9",
			"C 11.4 66 11.9 33 12.2 1.1",
			"A 3.2 1.15 0 0 0 5.8 1.1",
			"C 6.1 33 6.6 66 6.9 98.9",
			"Z"
		].join(" ");
		/**
		* How far the blue reaches, as a `height` in the rail.
		*
		* The same expression as the knob's `bottom`, because the blue has to end exactly where
		* the knob's centre is: written once as a function so a change to the travel cannot
		* leave the fill behind. `inset` keeps both clear of the rail's rounded caps; the extra
		* half knob at each end keeps the knob's whole circle between the two ends of the bar
		* rather than hanging half of itself past the top when the pen is at its heaviest.
		*/
		const travelHeight = (fraction) => `calc(var(--da-track-inset) + var(--da-knob-size) / 2 + (100% - 2 * var(--da-track-inset) - var(--da-knob-size)) * ${fraction})`;
		const TOOLS = [
			{
				tool: "select",
				label: "toolSelect"
			},
			{
				tool: "arrow",
				label: "toolArrow"
			},
			{
				tool: "rect",
				label: "toolRect"
			},
			{
				tool: "ellipse",
				label: "toolEllipse"
			},
			{
				tool: "pen",
				label: "toolPen"
			},
			{
				tool: "point",
				label: "toolPoint"
			}
		];
		/**
		* The tools that draw something with a size the rail can set.
		*
		* `select` is not among them: it draws nothing, so with it armed and no mark
		* selected the rail has no subject. `point` is, because a pin is sized by the same
		* number — the rail asks "how big is this mark" either way.
		*/
		const WEIGHT_TOOLS = /* @__PURE__ */ new Set([
			"arrow",
			"rect",
			"ellipse",
			"pen",
			"point"
		]);
		/** The copy key naming the shape each kind of mark is, for the list's second line. */
		const TOOL_COPY = {
			arrow: "toolArrow",
			rect: "toolRect",
			ellipse: "toolEllipse",
			pen: "toolPen",
			point: "toolPoint"
		};
		/**
		* The pointer a `select` tool wears instead of the word "select".
		*
		* Every other tool is a picture of what it draws — an arrow, a box, a circle — and
		* this one draws nothing, so the pointer is the honest shape: it is the tool you use
		* with the mouse rather than a mark you leave behind. Drawn rather than written so
		* the toolbar stays one row of controls at any locale or font size.
		*/
		/**
		* The handle's dots: six of them, three by two, turned as the reader asked.
		*
		* The palette stands up and takes a grip three columns wide by two rows tall; the bar
		* lies down and takes one two columns wide by three rows tall. That is the pair the
		* reader called for, and it is the opposite of what the strips' own proportions would
		* suggest — noted here so it is not "corrected" back by the next pair of eyes.
		*
		* Drawn instead of typed — the braille character this replaces was one glyph at one
		* size, so the dots could not be sized or spaced, and at 9px they came out a smudge.
		*/
		function GripDots({ wide }) {
			const xs = wide ? [
				2,
				6,
				10
			] : [2, 6];
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				className: "da-grip-dots",
				viewBox: wide ? "0 0 12 8" : "0 0 8 12",
				"aria-hidden": "true",
				focusable: "false",
				children: (wide ? [2, 6] : [
					2,
					6,
					10
				]).map((y) => xs.map((x) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
					cx: x,
					cy: y,
					r: 1.4
				}, `${x}-${y}`)))
			});
		}
		/**
		* The select tool: a cursor, outlined rather than filled.
		*
		* Filled, it read as a black blob against the dark chip — the silhouette was there but
		* the direction it points was not, which is the only thing a cursor has to say. As an
		* outline it belongs to the same stroke set as the other five glyphs.
		*
		* The shape is Tabler's `cursor-text`-sibling `pointer` glyph, taken whole at its own
		* 24 grid: its body is one closed curve with round joins rather than the seven hard
		* corners a hand-traced outline has, and at 16px that softness is the whole difference
		* between a cursor and a shard. Scaled by hand it lost exactly that.
		*/
		function PointerIcon() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				className: "da-ico",
				viewBox: "0 0 24 24",
				"aria-hidden": "true",
				focusable: "false",
				strokeWidth: "2",
				strokeLinecap: "round",
				strokeLinejoin: "round",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M14.185 13.14l5.644 -2.202c1.625 -.634 1.538 -2.962 -.13 -3.473l-14.319 -4.382c-1.41 -.431 -2.73 .888 -2.298 2.298l4.382 14.318c.51 1.668 2.84 1.755 3.473 .13l2.202 -5.644a1.84 1.84 0 0 1 1.045 -1.045" })
			});
		}
		/**
		* The stroke each marking tool draws, so the row says it in pictures as well as words.
		*
		* `select` is not a marking tool and never comes here: it draws nothing, so it
		* wears the pointer instead (see {@link PointerIcon}).
		*/
		function ToolIcon(tool) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				viewBox: "0 0 16 16",
				"aria-hidden": "true",
				focusable: "false",
				children: tool === "arrow" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M 3 13 L 13 3" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M 7 3 h 6 v 6" })] }) : tool === "rect" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
					x: "2.5",
					y: "3.5",
					width: "11",
					height: "9",
					rx: "1.5"
				}) : tool === "ellipse" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
					cx: "8",
					cy: "8",
					r: "5.5"
				}) : tool === "pen" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M 2.5 13 C 5 4 9 13 13.5 3" }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					fillRule: "evenodd",
					d: "M 8 14.6 C 8 14.6 2.9 9.5 2.9 6.4 A 5.1 5.1 0 1 1 13.1 6.4 C 13.1 9.5 8 14.6 8 14.6 Z\n               M 8 8.7 A 2.1 2.1 0 1 0 8 4.5 A 2.1 2.1 0 1 0 8 8.7 Z",
					fill: "currentColor",
					stroke: "none"
				})
			});
		}
		/**
		* The overall goal's mark: an arrow that has hit a target.
		*
		* The record this heads is not a note about one place on the figure — it is what the
		* whole picture is meant to become — so it wears the one symbol that means "aim"
		* rather than the note the per-mark detail uses. At 16 pixels the arrow is one shaft
		* and two barbs; anything finer reads as a smudge.
		*/
		function GoalIcon() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				className: "da-ico",
				viewBox: "0 0 16 16",
				"aria-hidden": "true",
				focusable: "false",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
						cx: "7",
						cy: "9",
						r: "5.2"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
						cx: "7",
						cy: "9",
						r: "2.3"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M 13.8 2.2 L 8.2 7.8" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M 9.6 2.6 L 13.8 2.2 L 13.4 6.4" })
				]
			});
		}
		/** The list card's mark: three stacked rows, the shape of the card itself. */
		function ListIcon() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				className: "da-ico",
				viewBox: "0 0 16 16",
				"aria-hidden": "true",
				focusable: "false",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M 6 4.5 h 7 M 6 8 h 7 M 6 11.5 h 7" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
						cx: "3.2",
						cy: "4.5",
						r: "1",
						fill: "currentColor",
						stroke: "none"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
						cx: "3.2",
						cy: "8",
						r: "1",
						fill: "currentColor",
						stroke: "none"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
						cx: "3.2",
						cy: "11.5",
						r: "1",
						fill: "currentColor",
						stroke: "none"
					})
				]
			});
		}
		/** The empty list's picture: an open box, the usual "nothing here yet". */
		function BoxIcon() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				className: "da-empty-ico",
				viewBox: "0 0 48 48",
				"aria-hidden": "true",
				focusable: "false",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M 12 20 l 12 -6 l 12 6 v 12 l -12 6 l -12 -6 z" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M 12 20 l 12 6 l 12 -6" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M 24 26 v 12" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M 17 14.5 l 4.5 2.5 M 31 14.5 l -4.5 2.5" })
				]
			});
		}
		/** A step back, as the usual curved arrow. */
		function UndoIcon() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				className: "da-ico",
				viewBox: "0 0 16 16",
				"aria-hidden": "true",
				focusable: "false",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M 3.2 7.5 H 9.5 a 3.4 3.4 0 0 1 0 6.8 H 6" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M 5.8 4.4 L 2.7 7.5 L 5.8 10.6" })]
			});
		}
		/** The same arrow the other way. */
		function RedoIcon() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				className: "da-ico",
				viewBox: "0 0 16 16",
				"aria-hidden": "true",
				focusable: "false",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M 12.8 7.5 H 6.5 a 3.4 3.4 0 0 0 0 6.8 H 10" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M 10.2 4.4 L 13.3 7.5 L 10.2 10.6" })]
			});
		}
		/** The primary action's mark: a paper plane, the usual "this leaves here". */
		function SendIcon() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				className: "da-ico",
				viewBox: "0 0 16 16",
				"aria-hidden": "true",
				focusable: "false",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M 2 8 L 14 2.6 L 10.6 14 L 8 9.4 Z" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M 8 9.4 L 14 2.6" })]
			});
		}
		/** The secondary action's mark: a speech bubble, "this goes to the chat box". */
		function ChatIcon() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				className: "da-ico",
				viewBox: "0 0 16 16",
				"aria-hidden": "true",
				focusable: "false",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M 2.5 6.5 a 2 2 0 0 1 2 -2 h 7 a 2 2 0 0 1 2 2 v 3 a 2 2 0 0 1 -2 2 h -4 l -3 2.2 v -2.2 a 2 2 0 0 1 -2 -2 z" })
			});
		}
		/**
		* What one mark's anchor names, most specific first.
		*
		* An inline SVG figure names itself through its `<title>`; a rendered document
		* has none, and names itself through its own text or its place in the document.
		* @param mark - the mark to name.
		* @returns the name, or an empty string when the mark points at no element.
		*/
		function anchorName(mark) {
			const anchor = mark.anchor;
			if (anchor === void 0) return "";
			return [
				anchor.title,
				anchor.text,
				anchor.selector
			].find((value) => value !== void 0 && value !== "") ?? "";
		}
		/**
		* Render one figure with its annotation layer.
		* @param props - document content, addressed resource, locale seat, and session delivery face.
		* @returns the annotator body.
		*/
		function AnnotatorBody(props) {
			const address = props.resourceAddress ?? "";
			const parsedAddress = parseFileAddress(address);
			const mediaType = figureMediaType(parsedAddress?.path ?? "");
			const isVector = mediaType === "image/svg+xml";
			const t = (0, react.useCallback)((key) => resolveTranslate(props, key), [props.t, props.localeId]);
			const sessionId = props.sessionId ?? parsedAddress?.sessionId;
			/**
			* A private prefix for the rail's gradient and clip ids.
			*
			* Two bodies can be mounted at once (a PDF lays out one per page), and an id is
			* document-wide: sharing one would make every rail's fill follow the first rail's
			* selection. Declared here, with the other hooks, because the ids are read far below
			* the early returns for a figure that failed to load.
			*/
			const trackId = `da-weight-${(0, react.useId)().replaceAll(":", "")}`;
			const stageRef = (0, react.useRef)(null);
			/** The box a double clicked mark's detail is written in. */
			const detailRef = (0, react.useRef)(null);
			/**
			* The comment pill around that box.
			*
			* Measured rather than the textarea inside it: the field gives up width to the two
			* hand-off buttons as soon as there is something to send, so a placement computed
			* from the field's box would put the buttons past the edge of the panel — which is
			* exactly what a comment pill against the right edge used to do.
			*/
			const pillRef = (0, react.useRef)(null);
			const barRef = (0, react.useRef)(null);
			const figureHostRef = (0, react.useRef)(null);
			const surfaceRef = (0, react.useRef)(null);
			const paperRef = (0, react.useRef)(null);
			const figureRef = (0, react.useRef)(null);
			/**
			* Hand the stage to the owner as its scrollport, and keep it here too.
			*
			* Stable on purpose. The owner writes the reader's saved scroll position onto
			* whatever element it is handed, so a callback that changed identity on every
			* render would hand it the stage again on every render — and put that position
			* back over wherever the reader has scrolled to since. That is a page jumping
			* under the pointer while it is being annotated.
			*/
			const attachStage = (0, react.useCallback)((element) => {
				stageRef.current = element;
				props.scrollportRef?.(element);
			}, [props.scrollportRef]);
			/**
			* Move the view by a drag.
			*
			* The scroll offset is written straight onto the element rather than held in
			* state: a pan is a stream of moves, and routing each one through React would
			* make the picture trail the hand by a frame. The CSS `overflow` already keeps
			* the offset inside the scrollable range, so an overshoot at an edge simply does
			* nothing instead of needing a clamp here.
			* @param dx - horizontal travel of the pointer, in client pixels.
			* @param dy - vertical travel of the pointer.
			*/
			const panBy = (0, react.useCallback)((dx, dy) => {
				const stage = stageRef.current;
				/* v8 ignore next -- a pan comes from the overlay, which only exists inside the stage. */
				if (stage === null) return;
				stage.scrollLeft -= dx;
				stage.scrollTop -= dy;
			}, []);
			const [fileFigure, setFileFigure] = (0, react.useState)(null);
			const [fileRasterSize, setFileRasterSize] = (0, react.useState)(null);
			/** Height a rendered document reports, in figure pixels; 0 until the frame has laid out. */
			const [htmlHeight, setHtmlHeight] = (0, react.useState)(0);
			const [figureError, setFigureError] = (0, react.useState)(null);
			const frameRef = (0, react.useRef)(null);
			/**
			* The surface being annotated: the page a paged renderer supplied, else the
			* file's own figure. One value either way, so everything below reads one shape.
			*/
			const surface = props.page;
			/** Whether this body annotates one page of a document its owner persists. */
			const isPage = surface !== void 0;
			const figure = surface === void 0 ? fileFigure : {
				kind: "raster",
				objectUrl: surface.dataUrl,
				dataUrl: surface.dataUrl
			};
			const rasterSize = surface === void 0 ? fileRasterSize : {
				width: surface.width,
				height: surface.height
			};
			const [loaded, setLoaded] = (0, react.useState)(null);
			const [hostError, setHostError] = (0, react.useState)(null);
			/**
			* There is no viewing mode. The figure is always ready to be drawn on: a reader
			* who opened it came to say something about it, and a mode switch they have to
			* remember to flip is a step between them and that. The one thing a mode used to
			* buy — not turning an idle drag into a stray arrow — is bought instead by the
			* armed tool starting on `select`.
			*/
			/**
			* The armed tool.
			*
			* It starts on `select` — not on a drawing tool — for two reasons. An empty figure
			* offers nothing to draw on until the reader has decided what is wrong with it, and
			* an armed drawing tool turns every idle drag across the picture into a stray arrow.
			* The reader who does want to draw picks a tool; nobody is asked to un-draw by
			* accident.
			*/
			const [tool, setTool] = (0, react.useState)("select");
			/**
			* The preferences that outlive one figure: the drawing colour and the number style.
			*
			* Read once, on mount, so a reload comes back to what the reader last chose. They
			* are written back as they change rather than on unmount, because a reload is
			* exactly the moment there is no unmount to write from.
			*/
			const remembered = (0, react.useMemo)(() => readPreferences(), []);
			const [color, setColor] = (0, react.useState)(remembered.color ?? COLORS[0]);
			const [weight, setWeight] = (0, react.useState)(remembered.weight ?? 1);
			const [marks, setMarks] = (0, react.useState)(() => [...props.draft?.marks ?? []]);
			const [past, setPast] = (0, react.useState)([]);
			const [future, setFuture] = (0, react.useState)([]);
			const [selectedId, setSelectedId] = (0, react.useState)(null);
			/** The mark whose detail box should take the caret once it is on screen. */
			const [focusId, setFocusId] = (0, react.useState)(null);
			/**
			* What the figure shows, as context for the marks below it.
			*
			* One per figure rather than one per mark: it is never drawn, and its only job
			* is to make the numbered per-mark details readable. An owner that keeps one for
			* a whole document supplies it (and takes every change back); on its own the body
			* owns it, as it does for a single-surface figure.
			*/
			const [ownSummary, setOwnSummary] = (0, react.useState)("");
			const summary = props.summary ?? ownSummary;
			const writeSummary = props.onSummaryChange ?? setOwnSummary;
			const [createdAt, setCreatedAt] = (0, react.useState)(null);
			const [stale, setStale] = (0, react.useState)(false);
			/**
			* How large the numbers are drawn, and whether they are drawn at all.
			*
			* A property of the drawing rather than of one mark: the numbers have to read as
			* one set, so the whole figure shares one size. It is saved with the marks because
			* the delivered picture is the one the agent reads — a size the reader chose but
			* the export ignored would be a control that does nothing.
			*/
			/**
			* Which popover is showing, if any.
			*
			* One at a time, and this is deliberate: they all hang off the same strip near the
			* figure's edge, so two of them open at once simply cover each other and the
			* second one's own close button. Opening any popover closes whatever was open;
			* opening the one already showing closes it, so the button toggles.
			*/
			const [openPanel, setOpenPanel] = (0, react.useState)(null);
			const styleOpen = openPanel === "style";
			const goalOpen = openPanel === "goal";
			const listOpen = openPanel === "list";
			/**
			* Where the selected mark's detail card sits, in the panel's coordinates.
			*
			* Measured rather than derived: the figure is drawn at a factor inside a
			* scrollport, so the only reliable way from a mark's figure pixels to a place in
			* the panel is to read both boxes back from the browser. `null` until it has
			* been measured, which is also what keeps the card off screen for the one frame
			* before its position is known.
			*/
			const [detailAt, setDetailAt] = (0, react.useState)(null);
			/**
			* The selected mark as a drag is currently shaping it.
			*
			* Kept beside the stored marks rather than in them: the gesture is not committed
			* until it is released, so writing it into the list would make every frame an
			* undoable edit. It exists only so the pill can follow the hand.
			*/
			const [liveMark, setLiveMark] = (0, react.useState)(null);
			/**
			* Shut the style panel when the reader picks up a tool.
			*
			* Arming a tool is the moment the panel has done its job; leaving it open over
			* the figure would hide the very corner the next stroke starts in.
			*/
			(0, react.useEffect)(() => {
				setOpenPanel((current) => current === "style" ? null : current);
			}, [tool]);
			/**
			* Keep the drawing choices on the reader's machine as they change.
			*
			* Written here rather than on unmount because a reload has no unmount: the moment
			* the reader picks a colour is the moment it has to be safe. Storage failures are
			* swallowed inside `rememberPreferences` — losing a colour is not worth an error.
			*/
			const [zoom, setZoom] = (0, react.useState)("fit");
			/**
			* Whether a drag is currently moving the view.
			*
			* Its only job is the cursor: a hand that has closed on the table has to look
			* different from one hovering over it, or the reader cannot tell whether the
			* gesture took.
			*/
			const [panning, setPanning] = (0, react.useState)(false);
			const [fitWidth, setFitWidth] = (0, react.useState)(0);
			const [busy, setBusy] = (0, react.useState)(null);
			const [status, setStatus] = (0, react.useState)(null);
			/** The panel's own box, for placing the cards that float over it. */
			const rootRef = (0, react.useRef)(null);
			/**
			* Where the palette is parked, as fractions of the panel.
			*
			* The tools are the one group a reader reaches for over and over while looking at
			* a particular corner of the figure, so they float: the palette can be dragged
			* off that corner and stays where it was put, across reloads. Fractions rather
			* than pixels, because the pane is resizable and a position in pixels would walk
			* off the edge when it narrows.
			*/
			const [palette, setPalette] = (0, react.useState)(remembered.palette);
			const [dragging, setDragging] = (0, react.useState)(false);
			const dragFrom = (0, react.useRef)(null);
			/**
			* Where the palette sits before the reader moves it: top left, out of the way of
			* the figure's own middle and of the bar along the bottom.
			*/
			const DEFAULT_PALETTE = {
				x: .02,
				y: .04
			};
			const spot = palette ?? DEFAULT_PALETTE;
			/**
			* The palette's box, in percentages of the panel.
			*
			* Percentages rather than pixels so the parking spot survives a resize: a reader
			* who narrows the pane keeps the palette where it was in the picture, not off the
			* edge of the panel. The negative margins pull it back inside at the far corner.
			*/
			const paletteStyle = {
				left: `${spot.x * 100}%`,
				top: `${spot.y * 100}%`,
				transform: `translate(${spot.x >= .5 ? "-100%" : "0"}, ${spot.y >= .5 ? "-100%" : "0"})`
			};
			/**
			* The floating bar's own spot, and the bits a drag of it needs.
			*
			* The bar starts where a bar belongs — centred along the bottom — and can be
			* dragged off that edge when it covers the part of the figure being worked on.
			* Its default is not a fraction of the panel but an anchor to the bottom edge, so
			* that widening the pane keeps it centred rather than walking it sideways.
			*/
			const [barSpot, setBarSpot] = (0, react.useState)(remembered.bar);
			const [barDragging, setBarDragging] = (0, react.useState)(false);
			const barFrom = (0, react.useRef)(null);
			/**
			* Follow the pointer that is dragging a floating strip.
			*
			* Both strips move the same way, so both call this: the origin is the strip's
			* position when the press started, and the offset is measured against the panel
			* rather than the strip, because moving the strip must not move the frame the
			* next position is measured in.
			* @param event - the pointer event that is moving the strip.
			* @param from - which strip's press is in progress.
			* @param write - where its new spot goes.
			*/
			const followPointer = (0, react.useCallback)((event, from, write) => {
				const held = from.current;
				const root = rootRef.current;
				/* v8 ignore next */
				if (held === null || root === null) return;
				const bounds = root.getBoundingClientRect();
				const x = held.origin.x + (event.clientX - held.box.left) / Math.max(1, bounds.width);
				const y = held.origin.y + (event.clientY - held.box.top) / Math.max(1, bounds.height);
				write({
					x: Math.min(1, Math.max(0, x)),
					y: Math.min(1, Math.max(0, y))
				});
			}, []);
			const dragPalette = (0, react.useCallback)((event) => {
				followPointer(event, dragFrom, setPalette);
			}, [followPointer]);
			const dragBar = (0, react.useCallback)((event) => {
				followPointer(event, barFrom, setBarSpot);
			}, [followPointer]);
			(0, react.useEffect)(() => {
				rememberPreferences({
					color,
					weight,
					...palette === void 0 ? {} : { palette },
					...barSpot === void 0 ? {} : { bar: barSpot }
				});
			}, [
				barSpot,
				color,
				palette,
				weight
			]);
			/**
			* The bar's box, when the reader has moved it off the bottom edge.
			*
			* Until they do, the bar is placed by the stylesheet against the bottom edge and
			* centred — an anchored default, so a wider pane keeps it centred. Once it has
			* been dragged it is placed by fractions like the palette, and the same
			* edge-flipping transform keeps its far corner on the panel.
			*/
			/**
			* A record's inline placement, from whatever has been measured so far.
			*
			* Both sides are always written: one with a real offset and one `auto`. A card
			* that grows downwards must not also be pinned by its bottom edge, or with no
			* height of its own it stretches to fill the space between them. Before the
			* measurement lands there is no offset at all — the card is briefly at the
			* panel's corner, which is off the figure and gone before it can be seen.
			*/
			const recordStyle = (at) => ({
				left: at?.left,
				top: at?.top ?? "auto",
				bottom: at?.bottom ?? "auto"
			});
			const barStyle = barSpot === void 0 ? void 0 : {
				left: `${barSpot.x * 100}%`,
				top: `${barSpot.y * 100}%`,
				transform: `translate(${barSpot.x >= .5 ? "-100%" : "0"}, ${barSpot.y >= .5 ? "-100%" : "0"})`
			};
			(0, react.useEffect)(() => {
				ensureStyles(document);
			}, []);
			const data = props.content?.kind === "bytes" ? props.content.data : void 0;
			const layer = (0, react.useMemo)(() => {
				if (figure === null) return null;
				if (figure.kind === "svg") return {
					kind: "svg",
					markup: figure.markup,
					width: figure.width,
					height: figure.height,
					viewBox: figure.viewBox
				};
				if (figure.kind === "html") return null;
				if (rasterSize === null) return null;
				return {
					kind: "raster",
					dataUrl: figure.dataUrl,
					width: rasterSize.width,
					height: rasterSize.height
				};
			}, [figure, rasterSize]);
			/**
			* The surface's measurable size; null until its content and dimensions are both
			* known. A rendered document is measurable as soon as its width is — the frame
			* reports how tall its content is, and until it does the surface has no height.
			*/
			const size = (0, react.useMemo)(() => {
				if (figure === null) return null;
				if (figure.kind === "svg") return {
					width: figure.width,
					height: figure.height
				};
				if (figure.kind === "html") return {
					width: figure.width,
					height: htmlHeight
				};
				return rasterSize;
			}, [
				figure,
				htmlHeight,
				rasterSize
			]);
			/**
			* How big everything drawn is, as a multiple of the base sizes.
			*
			* One number for the whole surface: the pen, the pins and the review image all
			* have to agree, and a stroke is only bold or thin relative to the figure it sits
			* on. A 4000px scan and a 300px thumbnail get the same-looking mark this way.
			*/
			const unit = size === null ? 1 : figureUnit(size.width, size.height);
			/**
			* The paper the drawing needs: the figure, plus anywhere the marks reach past it.
			*
			* A reader boxing the margin a plot clips, or flagging a spot just outside the
			* axes, is drawing something the figure does not contain. The paper grows to hold
			* it rather than the mark being clipped — and because the surface is white, a mark
			* out there lands on paper instead of on nothing.
			*/
			const paper = size === null ? null : plotBounds(size.width, size.height, marks, unit);
			/**
			* Everything a background write needs, read at write time.
			*
			* A write runs from a timer that outlives the render that scheduled it, so it has
			* to read the surface's state as it is now. Closing over it would write whatever
			* was on screen six hundred milliseconds ago — which is exactly the edit the
			* reader just made.
			*/
			const live = (0, react.useRef)({
				address,
				loaded,
				marks,
				summary,
				size,
				createdAt
			});
			live.current = {
				address,
				loaded,
				marks,
				summary,
				size,
				createdAt
			};
			/**
			* The signature of what is already on disk.
			*
			* A load is not an edit: reading a sidecar must not immediately write it back.
			* Every write and every clear records its result here, and a render whose
			* signature matches produces no request at all.
			*/
			const writtenSignature = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				if (surface !== void 0) return;
				if (data === void 0 || mediaType === void 0) return;
				if (mediaType === "image/svg+xml") {
					const root = parseFigureSvg(new TextDecoder().decode(data));
					if (root === void 0) {
						setFigureError(t("loadFailed"));
						return;
					}
					const intrinsic = svgIntrinsicSize(root);
					root.setAttribute("width", String(intrinsic.width));
					root.setAttribute("height", String(intrinsic.height));
					root.classList.add("da-figure");
					setFileFigure({
						kind: "svg",
						width: intrinsic.width,
						height: intrinsic.height,
						markup: figureSvgMarkup(root),
						viewBox: svgViewBox(root, intrinsic)
					});
					return;
				}
				if (mediaType === "text/html") {
					setHtmlHeight(0);
					setFigureError(null);
					setFileFigure({
						kind: "html",
						width: RENDER_WIDTH,
						document: buildRenderedDocument(new TextDecoder().decode(data))
					});
					return;
				}
				const objectUrl = URL.createObjectURL(new Blob([data], { type: mediaType }));
				setFileRasterSize(null);
				setFileFigure({
					kind: "raster",
					objectUrl,
					dataUrl: bytesToDataUrl(data, mediaType)
				});
				return () => {
					URL.revokeObjectURL(objectUrl);
				};
			}, [
				data,
				mediaType,
				surface,
				t
			]);
			/** The document to load into the frame, or null when this body holds no document. */
			const htmlSource = figure?.kind === "html" ? figure.document : null;
			/**
			* Put the prepared document into the frame and take the height it reports.
			*
			* The frame is a same-origin sandbox with scripts off, so what it holds is
			* markup the body may read and nothing that runs. Sizing the frame to its own
			* content is what keeps it from scrolling internally — and that, in turn, is
			* what makes an element's own box and a mark's figure coordinates one space.
			*/
			(0, react.useEffect)(() => {
				if (htmlSource === null) return;
				const root = loadFrameDocument(frameRef.current, htmlSource);
				if (root === void 0) return;
				const measure = () => {
					if (root.scrollHeight > 0) setHtmlHeight(root.scrollHeight);
				};
				measure();
				const observer = new ResizeObserver(measure);
				observer.observe(root);
				return () => {
					observer.disconnect();
				};
			}, [htmlSource]);
			(0, react.useEffect)(() => {
				if (isPage) return;
				if (address === "" || mediaType === void 0) return;
				const controller = new AbortController();
				(async () => {
					try {
						const result = await loadAnnotation(address, controller.signal);
						if (controller.signal.aborted) return;
						setLoaded(result);
						setHostError(null);
						if (result.annotation !== null) {
							setMarks([...result.annotation.marks]);
							writeSummary(result.annotation.summary ?? "");
							setCreatedAt(result.annotation.createdAt);
							setStale(result.annotation.figure.sha256 !== result.sha256);
						}
					} catch (error) {
						if (controller.signal.aborted) return;
						setHostError(error instanceof AnnotatorHostError ? error.message : String(error));
					}
				})();
				return () => {
					controller.abort();
				};
			}, [
				address,
				isPage,
				mediaType,
				writeSummary
			]);
			(0, react.useEffect)(() => {
				const stage = stageRef.current;
				if (stage === null) return;
				const measure = () => {
					setFitWidth(stage.clientWidth - 24);
				};
				measure();
				const observer = new ResizeObserver(measure);
				observer.observe(stage);
				return () => {
					observer.disconnect();
				};
			}, []);
			const scale = (0, react.useMemo)(() => {
				if (size === null) return 1;
				if (zoom !== "fit") return zoom;
				if (fitWidth <= 0) return 1;
				return Math.min(1.5, Math.max(.05, fitWidth / size.width));
			}, [
				zoom,
				fitWidth,
				size
			]);
			/**
			* Where the records hang: above the bar, centred on it.
			*
			* Measured from the browser rather than derived from the drag fractions, because
			* the bar is only as wide as its own contents and only the laid-out box knows
			* that. Read whenever the bar is moved, a record is opened, or the panel resizes,
			* so the pair travels together instead of the record staying where the bar used
			* to be. The bottom offset is stored rather than a top one: a list of one mark is
			* shorter than a list of nine, and the record has to sit on the bar either way.
			*/
			const [floatsAt, setFloatsAt] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				const root = rootRef.current;
				const bar = barRef.current;
				if (root === null || bar === null) {
					setFloatsAt(null);
					return;
				}
				const panel = root.getBoundingClientRect();
				const own = bar.getBoundingClientRect();
				const at = placeAboveBar({
					x: own.left,
					y: own.top,
					width: own.width,
					height: own.height
				}, {
					x: panel.left,
					y: panel.top,
					width: panel.width,
					height: panel.height
				});
				setFloatsAt((previous) => previous !== null && previous.left === at.left && previous.top === at.top && previous.bottom === at.bottom ? previous : at);
			}, [
				barSpot,
				goalOpen,
				listOpen,
				size,
				htmlHeight
			]);
			/**
			* Whether an upward fold would come out of the top of the panel.
			*
			* The style fold is anchored to its own button, so it climbs — which is right while
			* the bar sits at the bottom and wrong the moment the reader parks the bar along the
			* top, where climbing puts the swatches out of sight above the panel. The record
			* placement already answers this question for the records; the fold reads the same
			* answer rather than measuring a second time, so the two can never disagree about
			* where there is room.
			*/
			const foldOpensDown = floatsAt !== null && floatsAt.bottom === void 0;
			/**
			* Put a record away when the reader clicks anywhere else.
			*
			* A record is a fold, not a mode: it has done its job the moment the reader looks
			* back at the figure, so looking away is what closes it. The close button stays
			* for the keyboard and for anyone who wants the fold gone while keeping the focus
			* where it is — but nobody should have to hit a cross to get their picture back.
			* The bar itself is exempt, since its own buttons are how a record is opened and
			* exchanged; so is everything inside a record, which is where the writing happens.
			*/
			(0, react.useEffect)(() => {
				const onDown = (event) => {
					const target = event.target;
					if (target instanceof Element && (target.closest(".da-float") !== null || target.closest(".da-style-row") !== null || target.closest(".da-palette") !== null || target.closest(".da-weight") !== null || barRef.current?.contains(target) === true)) return;
					if (openPanel !== null) setOpenPanel(null);
					if (stageRef.current?.contains(target) === true) return;
					setSelectedId(null);
				};
				document.addEventListener("pointerdown", onDown, true);
				return () => {
					document.removeEventListener("pointerdown", onDown, true);
				};
			}, [openPanel]);
			/**
			* Put the selected mark's detail card beside that mark.
			*
			* Runs whenever the selection, the geometry under it, the zoom, or the surface
			* changes: a card anchored to where a mark used to be is worse than no card, since
			* it names the wrong thing. The measurement is read from the browser instead of
			* derived from the scroll offsets, because the figure is drawn at a factor inside
			* a scrollport and only the laid-out boxes know both.
			*/
			(0, react.useEffect)(() => {
				const root = rootRef.current;
				const host = figureRef.current;
				const mark = marks.find((candidate) => candidate.id === selectedId);
				const drawn = liveMark !== null && liveMark.id === selectedId ? liveMark : mark;
				const box = drawn === void 0 ? void 0 : markOutline(drawn, unit);
				if (root === null || host === null || box === void 0 || size === null) {
					setDetailAt(null);
					return;
				}
				const panel = root.getBoundingClientRect();
				const measured = host.getBoundingClientRect();
				const pillSize = measuredSize(pillRef.current, {
					width: 300,
					height: 48
				});
				const at = placeCard(scaledBox(box, {
					x: measured.left,
					y: measured.top,
					width: measured.width,
					height: measured.height
				}, {
					x: panel.left,
					y: panel.top,
					width: panel.width,
					height: panel.height
				}, size.width), panel.width, panel.height, pillSize);
				setDetailAt((previous) => previous !== null && previous.left === at.left && previous.top === at.top ? previous : at);
			}, [
				htmlHeight,
				liveMark,
				marks,
				scale,
				selectedId,
				size,
				unit
			]);
			/**
			* The factor currently drawn, kept beside the state that will hold it.
			*
			* A pinch is a stream of events, and routing each one through React state means
			* re-rendering this whole body between frames — the gesture then arrives a frame
			* late and feels like it is chasing the fingers. The gesture writes the new
			* geometry straight onto the surface instead, and only the factor the fingers
			* came to rest on is committed to state, once the stream has paused.
			*/
			const liveScale = (0, react.useRef)(scale);
			(0, react.useEffect)(() => {
				liveScale.current = scale;
			}, [scale]);
			/** Pending commit of the factor a finished pinch settled on. */
			const settleTimer = (0, react.useRef)(void 0);
			/**
			* Zoom to one factor, keeping the figure point under a client coordinate there.
			*
			* Both the scaled box and the scroll offsets are written synchronously: the
			* browser lays out the new width as soon as it is read back, so the scrollport
			* can be moved in the same frame and the point under the pointer never appears
			* to move at all.
			* @param next - the factor to reach, clamped to the shared range.
			* @param clientX - pointer's horizontal position, in client coordinates.
			* @param clientY - pointer's vertical position, in client coordinates.
			*/
			const zoomAt = (0, react.useCallback)((next, clientX, clientY) => {
				const stage = stageRef.current;
				const surface = surfaceRef.current;
				const sheet = paperRef.current;
				/* v8 ignore next -- a wheel event only reaches a handler on a mounted stage, and size is what allows one. */
				if (stage === null || surface === null || sheet === null || paper === null) return;
				const before = liveScale.current;
				const reached = clampZoom(next);
				if (reached === before) return;
				const rect = stage.getBoundingClientRect();
				const target = anchoredScroll({
					clientWidth: stage.clientWidth,
					scrollLeft: stage.scrollLeft,
					scrollTop: stage.scrollTop,
					left: rect.left,
					top: rect.top
				}, {
					clientX,
					clientY
				}, before, reached, paper);
				liveScale.current = reached;
				surface.style.width = `${paper.width * reached}px`;
				surface.style.height = `${paper.height * reached}px`;
				sheet.style.transform = `scale(${reached})`;
				stage.scrollLeft = target.scrollLeft;
				stage.scrollTop = target.scrollTop;
				clearTimeout(settleTimer.current);
				settleTimer.current = setTimeout(() => {
					settleTimer.current = void 0;
					const settled = paperRef.current;
					/* v8 ignore next -- the sheet is the element the pinch was measured on. */
					if (settled !== null) settled.style.transform = "";
					setZoom(reached);
				}, 120);
			}, [paper]);
			(0, react.useEffect)(() => () => {
				clearTimeout(settleTimer.current);
			}, []);
			(0, react.useEffect)(() => {
				const stage = stageRef.current;
				if (stage === null) return;
				/**
				* A trackpad pinch arrives as a ctrl-modified wheel. The browser would zoom
				* the whole app for it, and the plugin's own stage is the surface the user is
				* pointing at, so the event is taken here. A plain two-finger scroll is left
				* alone: that one pans the scrollport, which is what it means.
				*/
				const onWheel = (event) => {
					if (!event.ctrlKey) return;
					event.preventDefault();
					zoomAt(liveScale.current * wheelZoomFactor(event.deltaY, event.deltaMode, stage.clientHeight), event.clientX, event.clientY);
				};
				stage.addEventListener("wheel", onWheel, { passive: false });
				return () => {
					stage.removeEventListener("wheel", onWheel);
				};
			}, [zoomAt]);
			const commit = (0, react.useCallback)((next) => {
				setPast((history) => [...history, marks].slice(-50));
				setFuture([]);
				setMarks(next);
			}, [marks]);
			const addMark = (0, react.useCallback)((mark) => {
				commit([...marks, mark]);
			}, [commit, marks]);
			const removeMark = (0, react.useCallback)((id) => {
				commit(marks.filter((mark) => mark.id !== id));
				setSelectedId((current) => current === id ? null : current);
			}, [commit, marks]);
			/**
			* Write one mark's detail.
			*
			* A mark carries one string, so there is nothing to keep in step beside it: the
			* detail is what the agent reads and what the list shows, and it is never painted
			* on the picture.
			* @param id - the mark being edited.
			* @param value - the new text.
			*/
			const setMarkDetail = (0, react.useCallback)((id, value) => {
				setMarks((current) => current.map((mark) => mark.id === id ? {
					...mark,
					detail: value
				} : mark));
			}, []);
			/**
			* Pick a mark out for editing, from a double click on the picture.
			*
			* Working on one mark means reading and writing its detail, so the double click
			* both puts the surface into annotating and asks for the caret. The focus itself
			* is taken by the effect below, once the box exists: while the figure is only
			* being viewed there is no detail box to focus.
			* @param id - the mark that was double clicked.
			*/
			const editMark = (0, react.useCallback)((id) => {
				setSelectedId(id);
				setFocusId(id);
			}, []);
			/**
			* Go back to selecting once a mark has been drawn, and open its detail for writing.
			*
			* Drawing is finished the moment the pointer lifts: what the reader wants next is
			* to look at what they made and say what is wrong with it, not to draw a second
			* one. Leaving the tool armed also turns the next idle drag on the figure into a
			* stray arrow, which is the kind of accident a tool that disarms itself prevents.
			*
			* The second half is the part that makes the gesture worth as much as it is: a mark
			* with no sentence is a shape with no meaning, so the box it is about opens and
			* takes the caret. A reader who has nothing to say is one Escape away from the
			* picture, while a reader who does say it never has to go looking for the field.
			*
			* A `point` is placed the same way and for the same reason, so both paths land
			* here.
			* @param id - the mark that was just drawn.
			*/
			const finishDrawing = (0, react.useCallback)((id) => {
				setTool("select");
				setSelectedId(id);
				setFocusId(id);
			}, []);
			/**
			* Put the caret in the detail box that was just asked for.
			*
			* Selecting a mark from the list only selects it; a double click on the picture
			* is the reader saying they want to write, so that is the one that takes focus.
			* The caret goes to the end of what is already there rather than over it.
			*/
			(0, react.useEffect)(() => {
				if (focusId === null) return;
				const box = detailRef.current;
				if (box === null) return;
				setFocusId(null);
				box.focus();
				box.setSelectionRange(box.value.length, box.value.length);
			}, [detailAt, focusId]);
			/**
			* Put a handle drag on a mark, as one undo step.
			*
			* Only the fields the gesture actually produced are written, so a resize does
			* not clear a rotation and a rotation does not clear a note-plate offset.
			* @param id - the mark the gesture edited.
			* @param patch - the fields that changed.
			*/
			const updateMark = (0, react.useCallback)((id, patch) => {
				const next = marks.map((mark) => mark.id === id ? {
					...mark,
					...patch
				} : mark);
				commit(next);
			}, [commit, marks]);
			/**
			* Put a dragged mark where it was dropped.
			*
			* A drag that ends where it started is not an edit: the mark keeps the anchor
			* it had, and no undo step is recorded for a gesture that changed nothing.
			*/
			const moveMark = (0, react.useCallback)((id, points, anchor) => {
				const next = draggedMarks(marks, id, points, anchor);
				/* v8 ignore next -- the surface only reports a press that left its mark somewhere else. */
				if (next === null) return;
				commit(next);
			}, [commit, marks]);
			/**
			* Pick a colour: repaint the selected mark, or arm the next stroke.
			*
			* The distinction is the selection, not a mode: a reader who has just selected a
			* mark and reached for a colour meant that mark, and one who has not is choosing
			* how the next one will look. Both paths record an undo step where one applies,
			* so a recolour can be taken back like any other edit.
			* @param value - the CSS hex string of the chosen swatch.
			*/
			/**
			* Change one attribute of the selected mark, or of the next stroke when nothing
			* is selected.
			*
			* A control that is already at the mark's value leaves the list identical, so a
			* press that changes nothing records no undo step — whether the mark is still
			* there or was removed while it was selected.
			* @param patch - the attribute to change.
			*/
			const undo = (0, react.useCallback)(() => {
				setPast((history) => {
					const previous = history[history.length - 1];
					if (previous === void 0) return history;
					setFuture((futureState) => [marks, ...futureState].slice(0, 50));
					setMarks(previous);
					return history.slice(0, -1);
				});
			}, [marks]);
			const redo = (0, react.useCallback)(() => {
				setFuture((futureState) => {
					const next = futureState[0];
					if (next === void 0) return futureState;
					setPast((history) => [...history, marks].slice(-50));
					setMarks(next);
					return futureState.slice(1);
				});
			}, [marks]);
			/**
			* Report every edit upward, so an owner that unmounts this surface (a page
			* change) can hand the unsaved work back when the surface returns.
			*/
			(0, react.useEffect)(() => {
				props.onDraftChange?.({ marks });
			}, [marks, props.onDraftChange]);
			/**
			* Keep the draft on disk, so a reload finds the work rather than an empty panel.
			*
			* A page surface is not its own document: its owner holds every page's marks and
			* is the only writer, so a page must not write a sidecar that would then claim to
			* describe the whole document.
			*/
			(0, react.useEffect)(() => {
				if (isPage || address === "") return;
				if (loaded === null || size === null) return;
				if (writtenSignature.current === null) {
					writtenSignature.current = annotationSignature(marks, summary);
					return;
				}
				autosave.current?.schedule();
			}, [
				address,
				isPage,
				loaded,
				marks,
				size,
				summary
			]);
			/**
			* Write the pending draft when the tab goes away.
			*
			* A reader who closes the panel straight after typing is the case autosave exists
			* for, and the debounce would otherwise still be waiting. `keepalive` is what lets
			* that request outlive the document that sent it.
			*/
			(0, react.useEffect)(() => {
				if (isPage) return;
				const write = () => {
					autosave.current?.flush();
				};
				window.addEventListener("pagehide", write);
				return () => {
					window.removeEventListener("pagehide", write);
					autosave.current?.flush();
				};
			}, [isPage]);
			(0, react.useEffect)(() => {
				/**
				* Whether the keystroke belongs to a field the reader is typing in.
				*
				* The note boxes are the way a mark is explained, so a Backspace there has to
				* delete a character and an Escape there has to leave the box — not take the
				* whole surface out of annotating mode from under the caret.
				*/
				const typing = (target) => {
					if (!(target instanceof HTMLElement)) return false;
					if (target.isContentEditable) return true;
					return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT";
				};
				const onKeyDown = (event) => {
					const key = event.key;
					if (key === "z" || key === "Z") {
						if (!(event.metaKey || event.ctrlKey)) return;
						if (typing(event.target)) return;
						event.preventDefault();
						if (event.shiftKey) redo();
						else undo();
						return;
					}
					if (typing(event.target)) return;
					if (key === "Escape") {
						if (selectedId === null) return;
						event.preventDefault();
						setSelectedId(null);
						return;
					}
					if (key === "Delete" || key === "Backspace") {
						if (selectedId === null) return;
						event.preventDefault();
						removeMark(selectedId);
					}
				};
				window.addEventListener("keydown", onKeyDown);
				return () => {
					window.removeEventListener("keydown", onKeyDown);
				};
			}, [
				redo,
				removeMark,
				selectedId,
				undo
			]);
			const exportPng = (0, react.useCallback)(async (target) => {
				const svg = composeReviewSvg(target, marks);
				const paper = reviewSize(target, marks);
				const exportScale = Math.min(2, Math.max(1, 2400 / Math.max(paper.width, paper.height)));
				return await rasterizePng(svg, paper.width, paper.height, exportScale);
			}, [marks]);
			const buildDocument = (0, react.useCallback)((target, scope = marks) => {
				if (loaded === null) return null;
				const now = (/* @__PURE__ */ new Date()).toISOString();
				return {
					version: 1,
					figure: {
						address,
						path: loaded.path,
						mediaType: loaded.mediaType,
						width: target.width,
						height: target.height,
						sha256: loaded.sha256
					},
					createdAt: createdAt ?? now,
					updatedAt: now,
					marks: scope,
					...summary.trim() === "" ? {} : { summary: summary.trim() }
				};
			}, [
				address,
				createdAt,
				loaded,
				marks,
				summary
			]);
			/**
			* Write the surface's current marks to disk, without a review image.
			*
			* This is the draft write: it happens while the reader is still working, so it
			* carries only the marks and their sentences — the picture is a delivery artifact,
			* and rasterizing it on every keystroke would cost more than the draft is worth.
			* The sidecar alone is what a reload reads back.
			*/
			const autosave = (0, react.useRef)(null);
			if (autosave.current === null) autosave.current = createAutosave({
				delay: 600,
				write: async () => {
					const state = live.current;
					if (state.address === "" || state.loaded === null || state.size === null) return;
					if (state.marks.length === 0 && state.summary.trim() === "") {
						const signature = annotationSignature(state.marks, state.summary);
						if (signature === writtenSignature.current) return;
						await deleteAnnotation(state.address);
						writtenSignature.current = signature;
						return;
					}
					const signature = annotationSignature(state.marks, state.summary);
					if (signature === writtenSignature.current) return;
					const now = (/* @__PURE__ */ new Date()).toISOString();
					const document = {
						version: 1,
						figure: {
							address: state.address,
							path: state.loaded.path,
							mediaType: state.loaded.mediaType,
							width: state.size.width,
							height: state.size.height,
							sha256: state.loaded.sha256
						},
						createdAt: state.createdAt ?? now,
						updatedAt: now,
						marks: state.marks,
						...state.summary.trim() === "" ? {} : { summary: state.summary.trim() }
					};
					await saveAnnotation(state.address, document, void 0, true);
					writtenSignature.current = signature;
				},
				onError: (error) => {
					setStatus({
						tone: "error",
						text: `${t("saveError")}${error instanceof Error ? error.message : String(error)}`
					});
				}
			});
			/**
			* Forget the annotation, on screen and on disk.
			*
			* Used both when the reader clears the surface (there is nothing left worth
			* saving, and a stale sidecar is what brought a deleted annotation back) and
			* after a successful hand-off (the marks have been delivered, so keeping them
			* would ask the reader to clear the same work twice).
			*
			* The in-memory state is dropped even when the Host refuses, because the marks
			* are gone from this session either way; the failure is reported rather than
			* hidden, since a surviving sidecar reappears on the next open.
			*/
			const discard = (0, react.useCallback)(async () => {
				autosave.current?.cancel();
				writtenSignature.current = null;
				try {
					await deleteAnnotation(address);
				} catch (error) {
					setStatus({
						tone: "error",
						text: `${t("clearError")}${error instanceof Error ? error.message : String(error)}`
					});
				}
				commit([]);
				setCreatedAt(null);
				setStale(false);
				setSelectedId(null);
				writeSummary("");
			}, [
				address,
				commit,
				t,
				writeSummary
			]);
			/**
			* Save the annotation and hand it somewhere: to the agent, or into the draft.
			*
			* The Host writes `<name>.annot.json` and a derived `<name>.annotated.png` beside
			* the figure, and the reader's original stays as it was. Once the hand-off has
			* succeeded the sidecars are deleted and the marks are cleared from the surface:
			* a delivered annotation has done its job, and leaving it on screen (or on disk)
			* would make the reader clear it twice.
			* @param target - who receives the annotation.
			*/
			const run = (0, react.useCallback)(async (target, only) => {
				const scope = only === void 0 ? marks : [only];
				if (scope.length === 0 || size === null || size.height <= 0) return;
				setBusy("sending");
				setStatus({
					tone: "info",
					text: t(target === "agent" ? "sending" : "composing")
				});
				try {
					const document_ = buildDocument(size, scope);
					if (document_ === null) throw new Error(t("loadFailed"));
					const review = layer === null || !needsReviewImage(document_) ? void 0 : await exportPng(layer);
					const saved = await saveAnnotation(address, document_, review);
					autosave.current?.cancel();
					writtenSignature.current = annotationSignature(document_.marks, document_.summary ?? "");
					setCreatedAt(document_.createdAt);
					setStale(false);
					if (sessionId === void 0) throw new Error("the figure address carries no session");
					const pageImages = review === void 0 ? [] : [{
						page: 1,
						image: review
					}];
					const locale = (props.localeId ?? "zh").startsWith("en") ? "en" : "zh";
					if (target === "composer") {
						if (props.conversation === void 0) throw new Error("the conversation service is unavailable");
						deliverToComposer({
							conversation: props.conversation,
							sessionId,
							document: document_,
							paths: saved,
							files: pageImages.map((entry) => new File([entry.image], `page-${entry.page}.png`, { type: "image/png" })),
							locale
						});
						setStatus({
							tone: "ok",
							text: t("composed")
						});
						await discard();
						return;
					}
					if (props.sessions === void 0) throw new Error("the sessions service is unavailable");
					await deliverAnnotation({
						sessions: props.sessions,
						fileUpload: void 0,
						sessionId,
						document: document_,
						paths: saved,
						pageImages,
						annotatedPdf: void 0,
						locale
					});
					setStatus({
						tone: "ok",
						text: t("sent")
					});
					await discard();
				} catch (error) {
					setStatus({
						tone: "error",
						text: `${t("saveError")}${error instanceof Error ? error.message : String(error)}`
					});
				} finally {
					setBusy(null);
				}
			}, [
				address,
				buildDocument,
				discard,
				exportPng,
				layer,
				marks,
				props.conversation,
				props.localeId,
				props.sessions,
				sessionId,
				size,
				t
			]);
			/** Whether this body holds a rendered document rather than a figure file. */
			const isHtml = mediaType === "text/html";
			/** Name what one figure point landed on, for a surface that holds its own elements. */
			const anchorAtFigurePoint = (0, react.useCallback)((x, y) => anchorInDocument(frameRef.current?.contentDocument, x, y), []);
			if (mediaType === void 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: "da-hint",
				children: t("unsupported")
			});
			if (data === void 0 && surface === void 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: "da-hint",
				children: t(isHtml ? "htmlLoading" : "loading")
			});
			if (figureError !== null) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: "da-hint",
				role: "alert",
				children: figureError
			});
			const selected = marks.find((mark) => mark.id === selectedId) ?? null;
			/**
			* What the colour control currently means.
			*
			* With a mark selected the reader is working on that mark, so the swatches are
			* about it and the button shows its colour. With nothing selected they are about
			* the next stroke, which is where the remembered preference comes in.
			*/
			const shownColor = selected === null ? color : selected.color;
			/**
			* What the size rail currently means, or null when it means nothing.
			*
			* It sizes one thing: the stroke of the mark the reader is working on, or the pen
			* of the next stroke. With nothing selected and no drawing tool out there is no
			* such thing, so the rail stands down instead of offering a control for a decision
			* nobody is making. A point mark borrows the same number for its pin, so the rail
			* stays when one is selected — it is the mark's size, whichever way it is drawn.
			*/
			const shownWeight = selected === null ? WEIGHT_TOOLS.has(tool) ? weight : null : selected.weight ?? 1;
			/**
			* How far up the rail that value sits, from 0 at the lightest to 1 at the heaviest.
			*
			* One number for the fill, the knob and the input: computed three times the three
			* could round differently and the knob would sit a pixel off the fill it belongs to.
			*/
			const weightFraction = shownWeight === null ? 0 : (shownWeight - WEIGHT_MIN) / (8 - WEIGHT_MIN);
			/**
			* Change one attribute of the selected mark, or of the next stroke when nothing
			* is selected.
			*
			* A control already at the mark's value leaves the list untouched, so a press
			* that changes nothing records no undo step.
			* @param patch - the attribute to change.
			*/
			const repaintSelected = (mark, patch) => {
				if (Object.keys(patch).every((key) => mark[key] === patch[key])) return;
				commit(marks.map((entry) => entry.id === mark.id ? {
					...entry,
					...patch
				} : entry));
			};
			const chooseColor = (value) => {
				if (selected === null) {
					setColor(value);
					return;
				}
				repaintSelected(selected, { color: value });
			};
			const chooseWeight = (value) => {
				const held = clampWeight(value);
				if (selected === null) {
					setWeight(held);
					return;
				}
				repaintSelected(selected, { weight: held });
			};
			const surfaceStyle = paper === null ? {} : {
				width: paper.width * scale,
				height: paper.height * scale
			};
			/**
			* The paper at its unscaled size, with the figure placed at its own offset on it.
			*
			* The whole paper is scaled by one transform rather than each part scaling itself,
			* so the figure and the overlay cannot drift apart at a fractional factor — which
			* at 60% is exactly what a mark drawn on a line work and a mark drawn on paper
			* would do.
			*/
			const paperStyle = paper === null ? {} : {
				position: "relative",
				width: paper.width,
				height: paper.height,
				transform: `scale(${scale})`,
				transformOrigin: "top left"
			};
			const figureStyle = paper === null ? {} : {
				position: "absolute",
				left: -paper.x,
				top: -paper.y,
				width: size?.width,
				height: size?.height
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "da-root",
				ref: rootRef,
				children: [
					hostError === null ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "da-status",
						"data-tone": "error",
						children: `${t("readError")}${hostError}`
					}),
					stale ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "da-status",
						"data-tone": "error",
						children: t(isHtml ? "htmlStale" : "stale")
					}) : null,
					status === null ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "da-status",
						"data-tone": status.tone === "info" ? void 0 : status.tone,
						children: status.text
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "da-stage",
						ref: attachStage,
						"data-hand": tool === "select" ? "true" : void 0,
						"data-panning": panning ? "true" : void 0,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "da-surface",
							ref: surfaceRef,
							style: surfaceStyle,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "da-paper",
								ref: paperRef,
								style: paperStyle,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "da-figure-frame",
									ref: figureRef,
									style: figureStyle,
									children: figure?.kind === "svg" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										ref: figureHostRef,
										dangerouslySetInnerHTML: { __html: figure.markup }
									}) : figure?.kind === "raster" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
										className: "da-figure",
										src: figure.objectUrl,
										width: size?.width,
										height: size?.height,
										alt: "",
										onLoad: (event) => {
											const image = event.currentTarget;
											setFileRasterSize({
												width: image.naturalWidth,
												height: image.naturalHeight
											});
										}
									}) : figure?.kind === "html" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("iframe", {
										ref: frameRef,
										className: "da-html",
										title: t("htmlFrame"),
										sandbox: "allow-same-origin",
										style: {
											width: figure.width,
											height: htmlHeight
										}
									}) : null
								}), paper === null || size === null ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Canvas, {
									width: paper.width,
									height: paper.height,
									origin: [-paper.x, -paper.y],
									marks,
									tool,
									color,
									weight,
									scale,
									containerRef: figureHostRef,
									anchoring: isVector,
									anchorAtFigurePoint: figure?.kind === "html" ? anchorAtFigurePoint : void 0,
									selectedId,
									onSelect: setSelectedId,
									onAdd: addMark,
									onMove: moveMark,
									onUpdate: updateMark,
									onRemove: removeMark,
									onPan: panBy,
									onPanStart: () => {
										setPanning(true);
									},
									onPanEnd: () => {
										setPanning(false);
									},
									onEdit: editMark,
									onDrawn: finishDrawing,
									onLiveEdit: setLiveMark,
									numbering: props.numbering
								})]
							})
						})
					}),
					goalOpen ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "da-float da-float-record da-float-goal",
						role: "group",
						"aria-label": t("summary"),
						style: recordStyle(floatsAt),
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "da-float-head",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: "da-card-title",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(GoalIcon, {}),
									t("summary"),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "da-hintdot",
										title: t("overallHint"),
										children: "?"
									})
								]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "da-btn da-btn-quiet",
								"aria-label": t("close"),
								title: t("close"),
								onClick: () => {
									setOpenPanel(null);
								},
								children: "✕"
							})]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
							className: "da-field",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
								value: summary,
								placeholder: t("summaryPlaceholder"),
								onChange: (event) => {
									writeSummary(event.target.value);
								}
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: "da-count",
								children: [summary.length, "/300"]
							})]
						})]
					}) : null,
					listOpen ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "da-float da-float-record da-float-list",
						role: "group",
						"aria-label": t("marks"),
						style: recordStyle(floatsAt),
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "da-float-head",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: "da-card-title",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ListIcon, {}),
										t("marks"),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "da-card-count",
											children: marks.length
										})
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "da-btn da-btn-quiet",
									disabled: marks.length === 0,
									onClick: () => {
										discard();
									},
									children: t("clear")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "da-btn da-btn-quiet",
									"aria-label": t("close"),
									title: t("close"),
									onClick: () => {
										setOpenPanel(null);
									},
									children: "✕"
								})
							]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "da-marks",
							children: marks.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "da-empty",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(BoxIcon, {}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "da-empty-title",
										children: t("noMarks")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "da-empty-hint",
										children: t("noMarksHint")
									})
								]
							}) : marks.map((mark, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "da-mark",
								"data-selected": mark.id === selectedId,
								onClick: () => {
									setSelectedId(mark.id);
								},
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "da-mark-index",
										style: { background: mark.color },
										children: index + 1
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "da-mark-text",
										onClick: (event) => {
											event.stopPropagation();
											setSelectedId(mark.id);
										},
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "da-mark-title",
											children: mark.detail !== void 0 && mark.detail.trim() !== "" ? mark.detail : t("emptyDetail")
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "da-mark-meta",
											children: [t(TOOL_COPY[mark.kind]), anchorName(mark)].filter((part) => part !== "").join(" · ")
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: "da-mark-del",
										onClick: (event) => {
											event.stopPropagation();
											removeMark(mark.id);
										},
										children: t("delete")
									})
								]
							}, mark.id))
						})]
					}) : null,
					selected === null || detailAt === null ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "da-float da-float-detail",
						role: "group",
						"aria-label": t("detail"),
						ref: pillRef,
						style: {
							left: detailAt.left,
							top: detailAt.top
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
							ref: detailRef,
							className: "da-comment",
							value: selected.detail ?? "",
							placeholder: selected.detail === void 0 || selected.detail.trim() === "" ? t("addComment") : t("detailPlaceholder"),
							rows: 1,
							onChange: (event) => {
								setMarkDetail(selected.id, event.target.value);
							}
						}), selected.detail === void 0 || selected.detail.trim() === "" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "da-comment-send",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "da-comment-send-btn da-comment-send-primary",
								disabled: busy !== null,
								"aria-label": t("sendToAgent"),
								title: t("sendToAgent"),
								onClick: () => {
									run("agent", selected);
								},
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SendIcon, {})
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "da-comment-send-btn",
								disabled: busy !== null,
								"aria-label": t("sendToComposer"),
								title: t("sendToComposer"),
								onClick: () => {
									run("composer", selected);
								},
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ChatIcon, {})
							})]
						})]
					}),
					shownWeight === null ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
						className: "da-weight",
						title: t(selected?.kind === "point" || tool === "point" ? "pinSize" : "weight"),
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: "range",
								className: "da-weight-input",
								"aria-label": t(selected?.kind === "point" || tool === "point" ? "pinSize" : "weight"),
								min: WEIGHT_MIN,
								max: 8,
								step: .1,
								value: shownWeight,
								onChange: (event) => {
									chooseWeight(Number(event.target.value));
								}
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
								className: "da-weight-svg",
								viewBox: "0 0 18 100",
								preserveAspectRatio: "none",
								"aria-hidden": "true",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("linearGradient", {
									id: `${trackId}-shade`,
									x1: "0",
									y1: "1",
									x2: "0",
									y2: "0",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("stop", {
											offset: "0",
											stopColor: "rgba(20,40,80,.06)"
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("stop", {
											offset: ".55",
											stopColor: "rgba(20,40,80,.13)"
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("stop", {
											offset: "1",
											stopColor: "rgba(20,40,80,.24)"
										})
									]
								}) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
									d: WEIGHT_TRACK,
									fill: `url(#${trackId}-shade)`
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "da-weight-fill",
								"aria-hidden": true,
								style: { height: travelHeight(weightFraction) }
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "da-weight-knob",
								"aria-hidden": true,
								style: { bottom: `calc(${travelHeight(weightFraction)} - var(--da-knob-size) / 2)` }
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "da-palette",
						"data-dragging": dragging ? "true" : void 0,
						style: paletteStyle,
						role: "toolbar",
						"aria-label": t("tools"),
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "da-palette-grip",
							title: t("moveTools"),
							onPointerDown: (event) => {
								/* v8 ignore next */
								if (rootRef.current === null) return;
								/* v8 ignore next -- jsdom has no pointer capture; a browser always does. */
								event.currentTarget.setPointerCapture?.(event.pointerId);
								dragFrom.current = {
									pointerId: event.pointerId,
									origin: palette ?? DEFAULT_PALETTE,
									box: {
										left: event.clientX,
										top: event.clientY
									}
								};
								setDragging(true);
							},
							onPointerMove: (event) => {
								dragPalette(event);
							},
							onPointerUp: (event) => {
								event.currentTarget.releasePointerCapture?.(event.pointerId);
								dragFrom.current = null;
								setDragging(false);
							},
							onPointerCancel: () => {
								dragFrom.current = null;
								setDragging(false);
							},
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(GripDots, { wide: true })
						}), TOOLS.map((entry) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "da-btn da-tool",
							"aria-pressed": tool === entry.tool,
							"aria-label": t(entry.label),
							title: t(entry.label),
							onClick: () => {
								setTool(entry.tool);
							},
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "da-tool-icon",
								"aria-hidden": true,
								children: entry.tool === "select" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PointerIcon, {}) : ToolIcon(entry.tool)
							})
						}, entry.tool))]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "da-bar",
						ref: barRef,
						"data-dragging": barDragging ? "true" : void 0,
						"data-parked": barSpot === void 0 ? void 0 : "true",
						style: barStyle,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "da-palette-grip",
								title: t("moveBar"),
								onPointerDown: (event) => {
									/* v8 ignore next */
									if (rootRef.current === null) return;
									/* v8 ignore next -- jsdom has no pointer capture; a browser always does. */
									event.currentTarget.setPointerCapture?.(event.pointerId);
									barFrom.current = {
										pointerId: event.pointerId,
										origin: barSpot ?? DEFAULT_PALETTE,
										box: {
											left: event.clientX,
											top: event.clientY
										}
									};
									setBarDragging(true);
								},
								onPointerMove: (event) => {
									dragBar(event);
								},
								onPointerUp: (event) => {
									event.currentTarget.releasePointerCapture?.(event.pointerId);
									barFrom.current = null;
									setBarDragging(false);
								},
								onPointerCancel: () => {
									barFrom.current = null;
									setBarDragging(false);
								},
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(GripDots, { wide: false })
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "da-bar-tools",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "da-btn da-style",
									"aria-expanded": styleOpen,
									"aria-label": t("style"),
									title: t("style"),
									onClick: () => {
										setOpenPanel((open) => open === "style" ? null : "style");
									},
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "da-swatch-dot",
										style: { background: shownColor }
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "da-style-caret",
										"aria-hidden": true,
										children: styleOpen ? "▴" : "▾"
									})]
								})
							}),
							styleOpen ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "da-style-row",
								role: "group",
								"aria-label": t("style"),
								"data-side": foldOpensDown ? "below" : "above",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "da-style-label",
									children: t("styleColor")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "da-style-colors",
									children: COLORS.map((value) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: "da-swatch",
										"aria-pressed": shownColor === value,
										style: { background: value },
										"aria-label": value,
										title: value,
										onClick: () => {
											chooseColor(value);
										}
									}, value))
								})]
							}) : null,
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "da-sep",
								"aria-hidden": true
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "da-spacer" }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "da-dock-btn",
								"aria-pressed": goalOpen,
								"aria-label": t("summary"),
								title: t("summary"),
								onClick: () => {
									setOpenPanel((open) => open === "goal" ? null : "goal");
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(GoalIcon, {}), summary.trim() === "" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "da-dock-dot",
									"aria-hidden": true
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "da-dock-btn",
								"aria-pressed": listOpen,
								"aria-label": t("marks"),
								title: t("marks"),
								onClick: () => {
									setOpenPanel((open) => open === "list" ? null : "list");
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ListIcon, {}), marks.length === 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "da-dock-count",
									children: marks.length
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "da-dock-sep",
								"aria-hidden": true
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "da-dock-btn",
								"aria-label": t("undo"),
								title: t("undo"),
								disabled: past.length === 0,
								onClick: undo,
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(UndoIcon, {})
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "da-dock-btn",
								"aria-label": t("redo"),
								title: t("redo"),
								disabled: future.length === 0,
								onClick: redo,
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RedoIcon, {})
							}),
							isPage ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "da-dock-sep",
									"aria-hidden": true
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "da-dock-btn da-dock-btn-primary",
									disabled: busy !== null,
									"aria-label": t("sendToAgent"),
									title: t("sendToAgent"),
									onClick: () => {
										run("agent");
									},
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SendIcon, {})
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "da-dock-btn",
									disabled: busy !== null,
									"aria-label": t("sendToComposer"),
									title: t("sendToComposer"),
									onClick: () => {
										run("composer");
									},
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ChatIcon, {})
								})
							] })
						]
					})
				]
			});
		}
		//#endregion
		//#region src/client/document-seat.ts
		/**
		* The seats the entry bundle hands to the paged-document body.
		*
		* A paged document is one annotation for the whole document, so the body that
		* owns its pages also owns the one save and the one delivery. That work needs the
		* entry half's HTTP shapes and session access, and a package-local chunk may not
		* import its own entry bundle — the import would either duplicate the client half
		* or resolve through a module table that carries only the shell's modules. So the
		* entry builds this small object and the chunk calls it; the types below are the
		* whole contract, and the chunk imports them with `import type` so nothing here
		* reaches the chunk's runtime.
		* @module dsh-figmark/client/document-seat
		*/
		/**
		* Restate one whole document's edits as the sidecar document.
		* @param input - the figure, its marks and the overall note.
		* @returns the document, stamped with this save's time.
		*/
		function buildPagedDocument(input) {
			const now = (/* @__PURE__ */ new Date()).toISOString();
			const summary = input.summary.trim();
			return {
				version: 1,
				figure: {
					address: input.figure.address,
					path: input.figure.path,
					mediaType: input.figure.mediaType,
					sha256: input.figure.sha256,
					pageCount: input.figure.pageCount
				},
				createdAt: input.createdAt ?? now,
				updatedAt: now,
				marks: input.marks,
				...summary === "" ? {} : { summary }
			};
		}
		/**
		* Build the seat one paged-document body is injected with.
		* @param options - the services and session the seat acts through.
		* @returns the seat.
		*/
		function createDocumentSeat(options) {
			return {
				load: async (address, signal) => await loadAnnotation(address, signal),
				save: async (address, input, annotatedPdf) => await saveAnnotation(address, buildPagedDocument(input), annotatedPdf),
				draft: async (address, input) => {
					await saveAnnotation(address, buildPagedDocument(input), void 0, true);
				},
				send: async (input, saved, pageImages, annotatedPdf) => {
					const sessions = options.sessions;
					if (sessions === void 0) throw new Error("the sessions service is unavailable");
					const document = buildPagedDocument(input);
					return await deliverAnnotation({
						sessions,
						fileUpload: options.fileUpload,
						sessionId: options.sessionId,
						document,
						paths: saved,
						pageImages: await renderPageImages(document, pageImages),
						annotatedPdf,
						locale: options.locale
					});
				},
				discard: async (address) => {
					await deleteAnnotation(address);
				},
				compose: async (input, saved, pageImages, annotatedPdf) => {
					const conversation = options.conversation;
					if (conversation === void 0) throw new Error("the conversation service is unavailable");
					const document = buildPagedDocument(input);
					deliverToComposer({
						conversation,
						sessionId: options.sessionId,
						document,
						paths: saved,
						files: [...(await renderPageImages(document, pageImages)).map((entry) => new File([entry.image], `page-${entry.page}.png`, { type: "image/png" })), new File([annotatedPdf], annotatedName(saved, document), { type: "application/pdf" })],
						locale: options.locale
					});
				}
			};
		}
		/**
		* The name the staged annotated document carries in the composer's attachment rail.
		* @param saved - paths the save wrote.
		* @param document - the saved document.
		* @returns a file name that says which document a second one differs from.
		*/
		function annotatedName(saved, document) {
			const base = saved.reviewPath === null ? document.figure.path : saved.reviewPath;
			return base.slice(base.lastIndexOf("/") + 1);
		}
		/**
		* Draw one annotated page per reviewed page, through the same SVG the single-surface
		* export uses, so the agent's picture and the user's screen cannot drift.
		* @param document - the document whose marks are drawn.
		* @param pages - the pages the body rendered, in page order.
		* @returns one image per page.
		*/
		async function renderPageImages(document, pages) {
			const images = [];
			const numbering = new Map(document.marks.map((mark, index) => [mark.id, index + 1]));
			for (const page of pages) {
				const layer = {
					kind: "raster",
					dataUrl: page.dataUrl,
					width: page.width,
					height: page.height
				};
				const marks = document.marks.filter((mark) => mark.page === page.page);
				const svg = composeReviewSvg(layer, marks, numbering);
				const paper = reviewSize(layer, marks);
				images.push({
					page: page.page,
					image: await rasterizePng(svg, paper.width, paper.height, reviewScale(paper.width, paper.height))
				});
			}
			return images;
		}
		//#endregion
		//#region src/client/LazyPdfBody.tsx
		/**
		* The PDF renderer, mounted only once a PDF body is.
		*
		* `react.lazy` is the whole point of the split: the browser fetches
		* `client.pdf.js` on demand, so PDF.js and the data it reads never load for a
		* session that never opens a PDF.
		* @module dsh-figmark/client/LazyPdfBody
		*/
		/** The chunk's renderer, fetched when this body first mounts. */
		const LoadedPdfBody = (0, react.lazy)(async () => {
			return { default: (await require.async("./client.pdf.js")).PdfBody };
		});
		/**
		* Suspend while the PDF chunk arrives.
		* @param props - the document's props plus the seats the entry half injects.
		* @returns the deferred PDF renderer.
		*/
		function LazyPdfBody(props) {
			const t = (key, vars) => resolveTranslate(props, key, vars);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react.Suspense, {
				fallback: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: "da-hint",
					children: t("pdfRendering")
				}),
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(LoadedPdfBody, {
					...props,
					t
				})
			});
		}
		//#endregion
		//#region src/client/markdown/DiffView.tsx
		/** The character a line carries in the margin. */
		const SIGNS = {
			context: " ",
			add: "+",
			remove: "-"
		};
		/**
		* Draw one difference: every hunk with its header, its lines, and its note field.
		* @param props - the difference, the notes, and the copy seat.
		* @returns the difference view.
		*/
		function DiffView({ diff, notes, onNote, t }) {
			if (diff.hunks.length === 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: "da-hint",
				children: t("diffEmpty")
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "da-diff",
				children: diff.hunks.map((hunk, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "da-diff-hunk",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "da-diff-head",
							children: formatHunkHeader(hunk)
						}),
						hunk.lines.map((line, offset) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "da-diff-line",
							"data-kind": line.kind,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "da-diff-no",
									children: line.oldLine ?? ""
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "da-diff-no",
									children: line.newLine ?? ""
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "da-diff-sign",
									children: SIGNS[line.kind]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "da-diff-text",
									children: line.text
								})
							]
						}, `${index}-${offset}`)),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
							className: "da-diff-note",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "da-diff-note-label",
								children: t("hunkNote", { line: hunk.oldStart })
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: "text",
								value: notes[hunk.oldStart] ?? "",
								placeholder: t("hunkNotePlaceholder"),
								onChange: (event) => {
									onNote(hunk.oldStart, event.target.value);
								}
							})]
						})
					]
				}, `${hunk.oldStart}-${hunk.newStart}-${index}`))
			});
		}
		//#endregion
		//#region src/client/markdown/MarkdownBody.tsx
		/**
		* The Markdown body: the document's source, an editor over it, the difference
		* against the version it was opened with, and one delivery of that difference.
		*
		* The document itself is never written. What the reader edits is a proposal:
		* the difference travels into the Session as a unified diff, and the agent
		* applies it to the source. That keeps this plugin's one write surface — the
		* annotation sidecars beside a figure — the only place it can change anything on
		* disk, and it is why the editor holds one value rather than a draft plus a
		* baseline that could go missing: an edit is the pair, or there is no edit.
		*
		* Line numbers appear in a gutter while the document toolbar's wrap preference
		* is off, because a soft-wrapped line occupies more than one visual row and its
		* number would drift away from it. With wrapping on, the toolbar shows the
		* caret's line and column instead, which no wrapping can move.
		* @module dsh-figmark/client/markdown/MarkdownBody
		*/
		/** No notes, as the one value the reader's empty state reuses. */
		const NO_NOTES = {};
		/**
		* Render one Markdown document with its editor and its difference.
		* @param props - owner content, the addressed resource, copy, and the session seats.
		* @returns the Markdown body.
		*/
		function MarkdownBody(props) {
			const address = props.resourceAddress ?? "";
			const content = props.content;
			const loaded = content?.kind === "text" ? content.text ?? "" : void 0;
			const eof = content?.kind === "text" && content.eof === true;
			const sessionId = props.sessionId ?? parseFileAddress(address)?.sessionId;
			const documentPath = parseFileAddress(address)?.path ?? address;
			const t = (0, react.useCallback)((key, vars) => resolveTranslate(props, key, vars), [props.t, props.localeId]);
			const [edit, setEdit] = (0, react.useState)(null);
			const [notes, setNotes] = (0, react.useState)(NO_NOTES);
			const [caret, setCaret] = (0, react.useState)({
				line: 1,
				column: 1
			});
			const [stale, setStale] = (0, react.useState)(false);
			const [view, setView] = (0, react.useState)("edit");
			const [busy, setBusy] = (0, react.useState)(false);
			const [status, setStatus] = (0, react.useState)(null);
			const seen = (0, react.useRef)({
				address,
				text: loaded
			});
			const gutter = (0, react.useRef)(null);
			const diff = (0, react.useMemo)(() => edit === null ? EMPTY_DIFF : diffLines(edit.baseline, edit.text), [edit]);
			const text = edit?.text ?? loaded ?? "";
			const lines = textLines(text).length;
			(0, react.useEffect)(() => {
				ensureStyles(document);
			}, []);
			/**
			* Notice a document that moved under the reader.
			*
			* A different address is a different document: the edit belongs to the one it
			* was made in, so it is dropped. The same address handing different text means
			* the file changed on disk, or the owner loaded more of it — the reader's work
			* stays, and the delivery says the difference is against an older version.
			*/
			(0, react.useEffect)(() => {
				const before = seen.current;
				seen.current = {
					address,
					text: loaded
				};
				if (before.address !== address) {
					setEdit(null);
					setNotes(NO_NOTES);
					setStale(false);
					setStatus(null);
					setView("edit");
					return;
				}
				if (before.text !== loaded && edit !== null) setStale(true);
			}, [
				address,
				edit,
				loaded
			]);
			/** Read the caret out of the element that moved it. */
			const readCaret = (0, react.useCallback)((element) => {
				const head = element.value.slice(0, element.selectionStart);
				setCaret({
					line: head.split("\n").length,
					column: element.selectionStart - head.lastIndexOf("\n")
				});
			}, []);
			/** Keep the gutter on the row the textarea is showing. */
			const syncGutter = (0, react.useCallback)((element) => {
				const column = gutter.current;
				if (column !== null) column.scrollTop = element.scrollTop;
			}, []);
			const discard = (0, react.useCallback)(() => {
				setEdit(null);
				setNotes(NO_NOTES);
				setStale(false);
				setStatus(null);
				setView("edit");
			}, []);
			/** Copy the whole difference: that is what a reader takes somewhere else. */
			const copyDiff = (0, react.useCallback)(async () => {
				if (diff.hunks.length === 0) return;
				try {
					const clipboard = navigator.clipboard;
					if (clipboard === void 0) throw new Error(t("copyUnavailable"));
					await clipboard.writeText(formatUnifiedDiff(documentPath, diff));
					setStatus({
						tone: "ok",
						text: t("diffCopied")
					});
				} catch (error) {
					setStatus({
						tone: "error",
						text: `${t("copyFailed")}${error instanceof Error ? error.message : String(error)}`
					});
				}
			}, [
				diff,
				documentPath,
				t
			]);
			const send = (0, react.useCallback)(async () => {
				if (edit === null || diff.hunks.length === 0) return;
				setBusy(true);
				setStatus({
					tone: "info",
					text: t("editSending")
				});
				try {
					const sessions = props.sessions;
					if (sessions === void 0) throw new Error(t("editUnavailable"));
					if (sessionId === void 0) throw new Error(t("editNoSession"));
					const warnings = await deliverEdit({
						sessions,
						fileUpload: props.fileUpload,
						sessionId,
						documentPath,
						diff,
						editedText: edit.text,
						notes,
						stale,
						locale: (props.localeId ?? "zh").startsWith("en") ? "en" : "zh"
					});
					setStatus({
						tone: "ok",
						text: `${t("editSent")}${warnings.length === 0 ? "" : `（${warnings.join(" ")}）`}`
					});
				} catch (error) {
					setStatus({
						tone: "error",
						text: `${t("editSendError")}${error instanceof Error ? error.message : String(error)}`
					});
				} finally {
					setBusy(false);
				}
			}, [
				diff,
				documentPath,
				edit,
				notes,
				props.fileUpload,
				props.localeId,
				props.sessions,
				sessionId,
				stale,
				t
			]);
			if (loaded === void 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: "da-hint",
				children: t("editLoading")
			});
			const dirty = edit !== null;
			const wrapping = props.wrap !== false;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "da-root da-md",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "da-toolbar",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "da-btn",
								"aria-pressed": view === "edit",
								onClick: () => {
									setView("edit");
								},
								children: t("editMode")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "da-btn",
								"aria-pressed": view === "diff",
								onClick: () => {
									setView("diff");
								},
								children: t("diffMode")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "da-spacer" }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "da-md-stats",
								children: dirty ? t("editStats", {
									hunks: diff.hunks.length,
									added: diff.added,
									removed: diff.removed
								}) : t("editLines", { lines })
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "da-md-stats",
								children: t("caretAt", {
									line: caret.line,
									column: caret.column
								})
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "da-btn",
								disabled: !dirty || busy,
								onClick: () => {
									copyDiff();
								},
								children: t("copyDiff")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "da-btn",
								disabled: !dirty,
								onClick: discard,
								children: t("discardEdit")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "da-btn",
								disabled: !dirty || busy,
								onClick: () => {
									send();
								},
								children: t("sendEdit")
							})
						]
					}),
					!eof ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "da-status",
						"data-tone": "info",
						children: t("editEofPending")
					}) : null,
					stale ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "da-status",
						"data-tone": "error",
						children: t("editStale")
					}) : null,
					status === null ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "da-status",
						"data-tone": status.tone === "info" ? void 0 : status.tone,
						children: status.text
					}),
					view === "edit" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "da-md-pane",
						children: [wrapping ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "da-md-gutter",
							ref: gutter,
							"aria-hidden": "true",
							children: Array.from({ length: lines }, (_, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { children: index + 1 }, index))
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
							className: "da-md-editor",
							wrap: wrapping ? "soft" : "off",
							spellCheck: false,
							value: text,
							onScroll: (event) => {
								syncGutter(event.currentTarget);
							},
							onKeyUp: (event) => {
								readCaret(event.currentTarget);
							},
							onClick: (event) => {
								readCaret(event.currentTarget);
							},
							onChange: (event) => {
								const value = event.currentTarget.value;
								readCaret(event.currentTarget);
								setEdit((previous) => previous === null ? {
									baseline: loaded,
									text: value
								} : {
									baseline: previous.baseline,
									text: value
								});
							}
						})]
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(DiffView, {
						diff,
						notes,
						onNote: (line, value) => {
							setNotes((current) => ({
								...current,
								[line]: value
							}));
						},
						t
					})
				]
			});
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
		//#region src/client/index.tsx
		/** Plugin name reported to the client module loader. */
		const name = "dsh-figmark-client";
		/** Client services this plugin waits for before it mounts anything. */
		const inject = [
			"slots",
			"locale",
			"documentPreviews"
		];
		/** Implementation identity of the image renderer, shared by its metadata and its slot entry. */
		const BODY_ID = "dsh-figmark/image";
		/** Implementation identity of the PDF renderer, shared by its metadata and its slot entry. */
		const PDF_BODY_ID = "dsh-figmark/pdf";
		/** Implementation identity of the Markdown editor, shared by its metadata and its slot entry. */
		const MD_BODY_ID = "dsh-figmark/markdown";
		/** Implementation identity of the HTML annotator, shared by its metadata and its slot entry. */
		const HTML_BODY_ID = "dsh-figmark/html";
		/** Suffixes the Markdown editor claims for whole-file text documents. */
		const MD_EXTENSIONS = ["md", "markdown"];
		/** Suffixes the annotator claims for whole-file figures, matching the shell's builtin image renderer. */
		const EXTENSIONS = [
			"svg",
			"png",
			"jpg",
			"jpeg",
			"gif",
			"webp",
			"bmp",
			"ico"
		];
		/** Suffixes whose bytes are not readable as text. */
		const BINARY_EXTENSIONS = [
			"png",
			"jpg",
			"jpeg",
			"gif",
			"webp",
			"bmp",
			"ico"
		];
		/** Suffix the PDF renderer claims, ranking above the shell's read-only PDF preview. */
		const PDF_EXTENSIONS = ["pdf"];
		/** Suffixes the HTML annotator claims, ranking above the shell's read-only HTML preview. */
		const HTML_EXTENSIONS = ["html", "htm"];
		/**
		* Mount the browser half.
		* @param ctx - the plugin's client context.
		* @throws {Error} when a required service is missing from the composition.
		*/
		function apply(ctx) {
			const locale = ctx.get("locale");
			const previews = ctx.get("documentPreviews");
			const slots = ctx.get("slots");
			if (locale === void 0) throw new Error(missingService("locale"));
			if (previews === void 0) throw new Error(missingService("documentPreviews"));
			if (slots === void 0) throw new Error(missingService("slots"));
			ctx.effect(() => locale.register(NAMESPACE, {
				zh,
				en
			}), "dsh-figmark: dictionaries");
			ctx.effect(() => previews.register({
				id: BODY_ID,
				extensions: EXTENSIONS,
				binaryExtensions: BINARY_EXTENSIONS,
				priority: "extension",
				title: () => locale.bind(NAMESPACE)("title"),
				loading: "bytes-complete",
				wrap: false
			}), "dsh-figmark: renderer metadata");
			ctx.effect(() => slots.inject("sidebar.right.tab.document", () => slots.register({
				name: "sidebar.right.tab.document",
				key: BODY_ID,
				locale: NAMESPACE,
				inject: (sessionId) => ({
					sessions: ctx.get("sessions"),
					conversation: ctx.get("conversation"),
					sessionId: String(sessionId),
					localeId: locale.getLocale().locale ?? "zh"
				})
			}, AnnotatorBody)), "dsh-figmark: document body");
			ctx.effect(() => previews.register({
				id: PDF_BODY_ID,
				extensions: PDF_EXTENSIONS,
				binaryExtensions: PDF_EXTENSIONS,
				priority: "extension",
				title: () => locale.bind(NAMESPACE)("pdfTitle"),
				loading: "bytes-complete",
				wrap: false
			}), "dsh-figmark: pdf renderer metadata");
			ctx.effect(() => slots.inject("sidebar.right.tab.document", () => slots.register({
				name: "sidebar.right.tab.document",
				key: PDF_BODY_ID,
				locale: NAMESPACE,
				inject: (sessionId) => ({
					AnnotatorBody,
					createAutosave,
					annotationSignature,
					autosaveDelayMs: 600,
					figureUnit,
					seat: createDocumentSeat({
						sessions: ctx.get("sessions"),
						conversation: ctx.get("conversation"),
						fileUpload: ctx.get("fileUpload"),
						sessionId: String(sessionId),
						locale: locale.getLocale().locale?.startsWith("en") === true ? "en" : "zh"
					})
				})
			}, LazyPdfBody)), "dsh-figmark: pdf document body");
			ctx.effect(() => previews.register({
				id: MD_BODY_ID,
				extensions: MD_EXTENSIONS,
				priority: "extension",
				title: () => locale.bind(NAMESPACE)("mdTitle"),
				loading: "text-pages",
				wrap: true
			}), "dsh-figmark: markdown renderer metadata");
			ctx.effect(() => slots.inject("sidebar.right.tab.document", () => slots.register({
				name: "sidebar.right.tab.document",
				key: MD_BODY_ID,
				locale: NAMESPACE,
				inject: (sessionId) => ({
					sessions: ctx.get("sessions"),
					fileUpload: ctx.get("fileUpload"),
					sessionId: String(sessionId),
					localeId: locale.getLocale().locale ?? "zh"
				})
			}, MarkdownBody)), "dsh-figmark: markdown document body");
			ctx.effect(() => previews.register({
				id: HTML_BODY_ID,
				extensions: HTML_EXTENSIONS,
				priority: "extension",
				title: () => locale.bind(NAMESPACE)("htmlTitle"),
				loading: "bytes-complete",
				wrap: false
			}), "dsh-figmark: html renderer metadata");
			ctx.effect(() => slots.inject("sidebar.right.tab.document", () => slots.register({
				name: "sidebar.right.tab.document",
				key: HTML_BODY_ID,
				locale: NAMESPACE,
				inject: (sessionId) => ({
					sessions: ctx.get("sessions"),
					conversation: ctx.get("conversation"),
					sessionId: String(sessionId),
					localeId: locale.getLocale().locale ?? "zh"
				})
			}, AnnotatorBody)), "dsh-figmark: html document body");
		}
		//#endregion
		exports.BODY_ID = BODY_ID;
		exports.HTML_BODY_ID = HTML_BODY_ID;
		exports.MD_BODY_ID = MD_BODY_ID;
		exports.PDF_BODY_ID = PDF_BODY_ID;
		exports.apply = apply;
		exports.inject = inject;
		exports.name = name;
		return module.exports;
	}
});
