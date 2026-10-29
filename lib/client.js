window.__ModuleLoader__.load({
	id: "dsh-figmark",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_dom = require("react-dom");
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/translate.ts
		/**
		* Fill the `{name}` placeholders a copy string asks for.
		*
		* A placeholder with no value is left standing rather than blanked: the reader
		* sees which number the sentence wanted, and a dictionary that forgets to pass
		* one is visible instead of reading as an empty spot in the middle of a sentence.
		* @param text - the copy string, with `{name}` placeholders.
		* @param vars - the values it asks for.
		* @returns the string with every given placeholder filled in.
		*/
		function interpolate(text, vars) {
			return text.replace(/\{(\w+)\}/gu, (placeholder, name) => {
				const value = vars[name];
				return value === void 0 ? placeholder : String(value);
			});
		}
		//#endregion
		//#region src/client/locales.ts
		/**
		* Product copy of the annotator body.
		*
		* The dictionary is registered on the shell's locale service under
		* `annotator`, which is also what binds the `t` seat the body receives.
		* @module dsh-figmark/client/locales
		*/
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
			toolElement: "元素",
			undo: "撤销",
			redo: "重做",
			clear: "清空",
			detail: "这个元素的详细说明",
			addComment: "添加评论…",
			weight: "线条粗细",
			detailPlaceholder: "这一处具体要改什么（例如「这个标号应指向滑套 34」）",
			summary: "总体目标",
			summaryPlaceholder: "可选：这张图整体要往哪个方向改（智能体会连同下面逐条说明一起读）",
			marks: "标注清单",
			markPage: "{page} 页",
			markKindLabel: "图形：{kind}",
			revealMark: "跳到这一处",
			noMarks: "还没有标注",
			noMarksHint: "选一个工具，在图上点一下或拖一下就开始。",
			delete: "删除",
			close: "关闭",
			dock: "批注操作",
			menuLabel: "图片操作",
			menuSendToAgent: "发送给智能体",
			menuSendToComposer: "发送到对话框",
			menuOpen: "用默认应用打开",
			menuReveal: "在文件管理器中显示",
			menuCopyImage: "复制图片",
			menuCopyRelative: "复制相对地址",
			menuCopyAbsolute: "复制绝对地址",
			menuOpened: "已请求用默认应用打开",
			menuOpenFailed: "无法打开，请重试",
			menuRevealed: "已请求在文件管理器中显示",
			menuRevealFailed: "无法在文件管理器中显示，请重试",
			menuCopied: "已复制路径",
			menuCopyFailed: "复制失败，请重试",
			sendToAgent: "发送给智能体",
			sendNothingToSend: "这张图上还没有标注，先把要改的地方圈出来再发送。",
			sendNoFigure: "附图还没加载完，暂时发不出去。",
			sendToComposer: "发送到对话框",
			sending: "正在发送…",
			sent: "已发送给智能体，标注已从面板清空。",
			sentOne: "已发送这一条给智能体，其余标注留在面板上。",
			composing: "正在写入对话框…",
			composed: "已写入对话框草稿（未发送），标注已从面板清空。",
			composedOne: "已把这一条写入对话框草稿（未发送），其余标注留在面板上。",
			loading: "正在载入附图…",
			unsupported: "这个文件不是可标注的附图（支持 SVG/PNG/JPEG/WebP/BMP/GIF）",
			loadFailed: "读取附图失败",
			stale: "这张图在上次标注之后已经更新过，旧标注的坐标可能失准，请核对后再提交。",
			anchor: "锚定",
			readError: "读取标注失败",
			annotationUnreadable: "这份标注文件太大，无法读入，因此没有显示图上的标记：",
			failSessions: "会话服务不可用，无法发送。",
			failConversation: "会话面板不可用，无法写入草稿。",
			failNoSession: "这个图不属于任何会话，无处发送。",
			saveError: "保存标注失败：",
			clearError: "标注已从面板清空，但删除磁盘上的标注文件失败：",
			emptyDetail: "（未写说明）",
			pdfTitle: "PDF 批注",
			previousPage: "上一页",
			nextPage: "下一页",
			pageJump: "跳转页码",
			pageOf: "{page} / {pages}",
			pagerLabel: "翻页",
			sendNone: "还没有标注可发送",
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
			toolElement: "Element",
			undo: "Undo",
			redo: "Redo",
			clear: "Clear",
			detail: "What this element needs",
			addComment: "Add a comment…",
			weight: "Line weight",
			detailPlaceholder: "What should change here (for example \"this numeral should point at the sleeve 34\")",
			summary: "Overall goal",
			summaryPlaceholder: "Optional: what this figure should become overall (the agent reads it with the marks below)",
			marks: "Marks",
			markPage: "p. {page}",
			markKindLabel: "Shape: {kind}",
			revealMark: "Go to this mark",
			noMarks: "No marks yet",
			noMarksHint: "Pick a tool, then click or drag on the figure to start.",
			delete: "Delete",
			close: "Close",
			dock: "Annotation actions",
			menuLabel: "Figure actions",
			menuSendToAgent: "Send to agent",
			menuSendToComposer: "Send to composer",
			menuOpen: "Open with default app",
			menuReveal: "Reveal in File Manager",
			menuCopyImage: "Copy image",
			menuCopyRelative: "Copy relative path",
			menuCopyAbsolute: "Copy absolute path",
			menuOpened: "Asked the system to open it",
			menuOpenFailed: "Could not open it; please try again",
			menuRevealed: "Asked the file manager to show it",
			menuRevealFailed: "Could not reveal it; please try again",
			menuCopied: "Path copied",
			menuCopyFailed: "Could not copy; please try again",
			sendToAgent: "Send to agent",
			sendNothingToSend: "There is nothing marked on this figure yet; mark what should change, then send.",
			sendNoFigure: "The figure has not finished loading, so nothing can be sent yet.",
			sendToComposer: "Send to composer",
			sending: "Sending…",
			sent: "Sent to the agent; the annotation is cleared from this panel.",
			sentOne: "Sent that mark to the agent; the rest stay on the panel.",
			composing: "Writing into the composer…",
			composed: "Written into the composer draft (not sent); the annotation is cleared from this panel.",
			composedOne: "Written that mark into the composer draft (not sent); the rest stay on the panel.",
			loading: "Loading figure…",
			unsupported: "This file is not an annotatable figure (SVG/PNG/JPEG/WebP/BMP/GIF)",
			loadFailed: "Reading the figure failed",
			stale: "This figure changed since it was annotated; old marks may be misplaced. Check them before sending.",
			anchor: "anchor",
			readError: "Reading the annotation failed",
			annotationUnreadable: "These annotation files are too large to read, so their marks are not shown: ",
			failSessions: "The sessions service is unavailable, so this cannot be sent.",
			failConversation: "The conversation panel is unavailable, so nothing can be drafted into it.",
			failNoSession: "This figure belongs to no session, so there is nowhere to send it.",
			saveError: "Saving the annotation failed: ",
			clearError: "Cleared from this panel, but deleting the annotation files on disk failed: ",
			emptyDetail: "(no detail)",
			pdfTitle: "PDF annotations",
			previousPage: "Previous page",
			nextPage: "Next page",
			pageJump: "Go to page",
			pageOf: "{page} / {pages}",
			pagerLabel: "Paging",
			sendNone: "Nothing to send yet",
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
			return interpolate(text, vars);
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
		/**
		* Whether a mark encloses an area rather than pointing at a place.
		*
		* A `rect`, an `ellipse` and a `pen` stroke say "look in here" — their geometry is a
		* region, and a region has no one point the reader was aiming at: the last corner of
		* a drag is simply where the hand stopped. The other three point: a `point` sits on a
		* spot, an `arrow` points by its tip, and an `element` is the thing itself.
		*
		* The distinction decides whether an {@link AnnotationMark.anchor} means anything.
		* An anchor names what the mark is about, and for a region the name would be whatever
		* happened to be under the release point — a label the reader never asked for, sent
		* to the agent as though it were part of the request.
		* @param kind - the kind of mark.
		* @returns true when the mark's geometry is a region rather than a place.
		*/
		function describesARegion(kind) {
			return kind === "rect" || kind === "ellipse" || kind === "pen";
		}
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
		/**
		* Each mark's number inside its own kind, 1 for the first of that kind.
		*
		* The number a mark is drawn with and the number its sentence starts with are the
		* same number, so the list and the picture have to count the same things. They count
		* *kinds*: a figure holding two arrows and one box reads 箭头1, 箭头2, 矩形1 — not 1,
		* 2, 3 — because the shape already says which kind it is, and one counter for the
		* whole file was a number the reader had to decode rather than read. "The second
		* arrow" and "the second box" are two different marks; one counter called them the
		* third and the fifth.
		*
		* One function rather than one per surface, because the message, the overlay, the
		* exported picture and the document's list all have to agree on which mark is "1".
		* @param marks - the marks in the order the document reads them.
		* @returns each mark id's 1-based ordinal among marks of its own kind.
		*/
		function markOrdinals(marks) {
			const counted = /* @__PURE__ */ new Map();
			const ordinals = /* @__PURE__ */ new Map();
			for (const mark of marks) {
				const ordinal = (counted.get(mark.kind) ?? 0) + 1;
				counted.set(mark.kind, ordinal);
				ordinals.set(mark.id, ordinal);
			}
			return ordinals;
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
		* Whether one media type is the paged-document one.
		*
		* The browser half holds a media type rather than a path when it decides which
		* JSON field carries a review artifact, so the comparison is named here too
		* instead of being re-spelled at that call site.
		* @param mediaType - media type of the figure.
		* @returns true when the figure has pages.
		*/
		function isPagedMediaType(mediaType) {
			return mediaType === PAGED_MEDIA_TYPE;
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
		//#region src/client/mark-geometry.ts
		/**
		* Whether two point lists describe exactly the same geometry.
		* @param before - one list of points, in figure pixels.
		* @param after - the other list.
		* @returns true when both lists are the same length and every point matches.
		*/
		function samePoints$1(before, after) {
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
			if (samePoints$1(before.points, points)) return null;
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
		/** Every box handle, in the order a renderer walks them. */
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
		* Where the two end grips of a two-point mark sit.
		*
		* An arrow is a line with an arrowhead, not a box: eight corner handles around the
		* rectangle its ends span ask the reader to resize a shape that has no width, and
		* they cover four square corners the arrow never draws. Its two ends are the whole
		* of its geometry, so they are the whole of its control frame. The ends are turned
		* with the mark, like the box handles, so they sit on the line as it is drawn.
		* @param points - the mark's stored geometry: tail first, then tip.
		* @param rotation - the mark's rotation in degrees.
		* @returns the two grips, empty for a mark with fewer than two points.
		*/
		function endHandles(points, rotation) {
			const [tail, tip] = points;
			if (tail === void 0 || tip === void 0) return [];
			const box = markBounds(points);
			/* v8 ignore next -- two points always make a box. */
			if (box === void 0) return [];
			const centre = boxCentre(box);
			const radians = rotation * Math.PI / 180;
			return [{
				id: "tail",
				point: rotateAround(tail, centre, radians)
			}, {
				id: "tip",
				point: rotateAround(tip, centre, radians)
			}];
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
		* The handle a press may take, if the press was aimed at one.
		*
		* Two conditions, and the second is the one that matters for a small mark. A press
		* within reach of a grip is a press on the grip only if it is nearer to that grip
		* than to the middle of the shape: the grips of a small mark overlap each other and
		* cover the whole of it, so reach alone turned every press on a small mark into a
		* resize, and a tick label or a short arrow could never be dragged. Aiming at the
		* middle is aiming at the mark; aiming nearer a corner is aiming at the corner.
		* @param box - the mark's frame, in its own upright frame.
		* @param rotation - the mark's rotation in degrees.
		* @param at - where the press landed, in figure pixels.
		* @param reach - how far from a grip the press still counts, in figure pixels.
		* @param size - the grip's side, in figure pixels.
		* @returns the handle the press took, or undefined to leave it to the shape.
		*/
		function gripAt(box, rotation, at, reach = 7, size = 7) {
			const near = handleAt(box, rotation, at, reach, size);
			if (near === void 0) return void 0;
			const centre = boxCentre(box);
			const toCentre = Math.hypot(at[0] - centre[0], at[1] - centre[1]);
			const grip = handlesFor(box, rotation, size).find((handle) => handle.id === near);
			/* v8 ignore next -- `handleAt` only names a handle `handlesFor` just placed. */
			if (grip === void 0) return void 0;
			return Math.hypot(at[0] - grip.point[0], at[1] - grip.point[1]) <= toCentre ? near : void 0;
		}
		/**
		* The end grip a press may take, if the press was aimed at one.
		*
		* The same two conditions the box grips use: within reach, and nearer the grip than
		* the middle of the line. An arrow is thin, so its two grips are close to each other
		* on a short arrow — aiming at the shaft is still aiming at the mark.
		* @param points - the mark's stored geometry: tail first, then tip.
		* @param rotation - the mark's rotation in degrees.
		* @param at - where the press landed, in figure pixels.
		* @param reach - how far from a grip the press still counts, in figure pixels.
		* @returns the end grip the press took, or undefined to leave it to the shape.
		*/
		function endAt(points, rotation, at, reach = 7) {
			let best;
			let bestDistance = reach;
			for (const handle of endHandles(points, rotation)) {
				const distance = Math.hypot(handle.point[0] - at[0], handle.point[1] - at[1]);
				if (distance <= bestDistance) {
					best = handle.id;
					bestDistance = distance;
				}
			}
			if (best === void 0) return void 0;
			const box = markBounds(points);
			/* v8 ignore next -- an end grip is only placed for a mark with two points. */
			if (box === void 0) return void 0;
			const centre = boxCentre(box);
			const toCentre = Math.hypot(at[0] - centre[0], at[1] - centre[1]);
			const grip = endHandles(points, rotation).find((handle) => handle.id === best);
			/* v8 ignore next -- `endHandles` just placed this grip. */
			if (grip === void 0) return void 0;
			return Math.hypot(at[0] - grip.point[0], at[1] - grip.point[1]) <= toCentre ? best : void 0;
		}
		/**
		* Move one end of a two-point mark to the pointer.
		*
		* The other end is the fixed point: dragging the tip turns the arrow about its tail
		* rather than sliding the whole line, which is what a grip on one end means. The
		* pointer is turned back by the mark's rotation first, so a turned arrow's drawn end
		* still follows the hand.
		* @param request - the end, the pointer, and the geometry it started from.
		* @returns the new geometry, in figure pixels.
		*/
		function movedEnd(request) {
			const { end, at, origin, rotation } = request;
			const [tail, tip] = origin;
			if (tail === void 0 || tip === void 0) return origin;
			const box = markBounds(origin);
			/* v8 ignore next -- two points always make a box. */
			if (box === void 0) return origin;
			const local = rotateAround(at, boxCentre(box), -markRadians({ rotation }));
			return end === "tail" ? [local, tip] : [tail, local];
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
			tail: "move",
			tip: "move",
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
		//#region src/client/canvas/controls.ts
		/**
		* The two sizes the surface's own controls are drawn at.
		*
		* A control is a target for a pointer, not part of the drawing, so both numbers
		* are *screen* pixels converted into figure pixels: the svg is in figure pixels and
		* the whole paper is scaled by CSS, so a control drawn at a fixed figure size
		* shrinks with the paper and becomes impossible to grab exactly when the figure is
		* large. The floor keeps a pathological scale from dividing by zero or blowing the
		* controls up to cover the figure.
		* @module dsh-figmark/client/canvas/controls
		*/
		/** Smallest scale the controls are sized against. */
		const MIN_CONTROL_SCALE = .05;
		/**
		* Convert the paper's CSS scale into the sizes the controls are drawn at.
		* @param scale - how much the paper is scaled on screen; absent means unscaled.
		* @returns the handle side and the hairline, both in figure pixels.
		*/
		function controlSizes(scale) {
			const factor = Math.max(MIN_CONTROL_SCALE, scale ?? 1);
			return {
				grip: 7 / factor,
				hairline: 1 / factor
			};
		}
		//#endregion
		//#region src/client/canvas/hit.ts
		/**
		* Whether two anchors name the same element in the same place.
		*
		* Two separate reads of the same element can arrive as two objects, and the
		* highlight only has to change when what it is drawn around changes. Comparing the
		* name *and* the box covers both ways it can: a different element, or the same
		* element after the surface reflowed under it.
		* @param one - the anchor drawn now, or null when nothing is lit.
		* @param other - the anchor the pointer just named.
		* @returns true when the highlight would look exactly the same.
		*/
		function sameAnchor(one, other) {
			if (one === null || other === null) return one === other;
			if (one.selector !== other.selector || one.id !== other.id || one.tag !== other.tag) return false;
			return one.bbox.every((value, index) => value === other.bbox[index]);
		}
		/**
		* The mark that names the element under the pointer, if any.
		*
		* An element mark draws nothing, so it has no painted shape a press can land on,
		* and a hit `rect` over its box would swallow the whole plot: an element is
		* routinely a curve, a legend or an axis spanning most of the figure, so a
		* box-shaped target would block every other mark and every press meant for the
		* paper. It also said the wrong thing — the box around a diagonal curve is a region
		* the figure never drew, which is the very mismatch the light was introduced to fix.
		* @param marks - the marks the surface is showing.
		* @param named - what the point under the pointer names, if anything.
		* @returns the mark whose element is under the press.
		*/
		function elementNamedBy(marks, named, preferred) {
			if (named === void 0) return void 0;
			const selector = named.selector;
			if (selector === void 0) return void 0;
			const onElement = marks.filter((mark) => mark.kind === "element" && mark.anchor?.selector === selector);
			return onElement.find((mark) => mark.id === preferred) ?? onElement[0];
		}
		/**
		* The box a mark's control frame is drawn around.
		*
		* The box is in the mark's own upright frame — un-rotated — because everything that
		* reads it turns it: `handlesFor` and `tetherFor` rotate these corners by the mark's
		* rotation, which is what puts the handles on the outline the overlay draws. Handing
		* them `uprightBounds` meant turning twice: the extent was taken around the shape and
		* then that extent was turned again, so at 90° the north-west grip sat 70.7 figure
		* pixels off the corner it belonged to. At zero rotation the two turnings cancel
		* exactly, which is why nothing noticed.
		*
		* Only the resize-and-turn handles read this, and only shapes with an extent get
		* those: a `point` mark is highlighted by a ring instead, so it never reaches here.
		* Every kind that does carries at least one point, so there is always a box — the
		* fallback covers a mark whose points were emptied by a bad edit.
		* @param mark - the mark to frame.
		* @returns the frame box, in the mark's own upright frame.
		*/
		function controlBox(mark) {
			/* v8 ignore next -- a mark carries at least one point, which is a box. */
			return markBounds(mark.points) ?? {
				x: 0,
				y: 0,
				width: 0,
				height: 0
			};
		}
		//#endregion
		//#region src/client/canvas/ids.ts
		/**
		* Minting the ids of marks drawn in this session.
		*
		* A mark id has to be unique within the loaded document and stable once it is in
		* the annotation file. The counter is module state rather than component state on
		* purpose: a page of a PDF unmounts and remounts, and an id that restarted with the
		* component would collide with the mark the same reader placed a second ago.
		* @module dsh-figmark/client/canvas/ids
		*/
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
		/**
		* The mark a drawing press starts with.
		*
		* A drag-shaped mark needs its two corners from the start; a freehand stroke starts
		* as the single sample it is, so no duplicate point enters the path.
		* @param seed - the tool, the pen, and the press point.
		* @returns the mark being drawn.
		*/
		function draftMark(seed) {
			const { tool, color, weight, point } = seed;
			const points = tool === "pen" ? [point] : [point, point];
			return {
				id: nextMarkId(),
				kind: tool,
				color,
				points,
				...weightField(weight)
			};
		}
		/**
		* Add one freehand sample to the mark being drawn.
		*
		* A trackpad reports a stream of moves at nearly the same place; keeping every one
		* of them would put hundreds of redundant points in the file for a stroke that
		* moved a pixel. Samples closer together than {@link PEN_SAMPLE_STEP} are dropped,
		* which is a visible rule only in that the path is the same path either way.
		* @param draft - the pen stroke being drawn.
		* @param point - the pointer, in figure pixels.
		* @returns the stroke with the sample added, or the same stroke when it is too close.
		*/
		function appendPenSample(draft, point) {
			const last = draft.points[draft.points.length - 1];
			if (last !== void 0 && Math.hypot(point[0] - last[0], point[1] - last[1]) < 3) return draft;
			return {
				...draft,
				points: [...draft.points, point]
			};
		}
		/**
		* Move the far corner of the mark being dragged out.
		*
		* The first point is the corner the press started on and never moves; the second
		* follows the pointer, which is what makes the box grow in the direction the reader
		* is pulling rather than centred on the press.
		* @param draft - the drag-shaped mark being drawn.
		* @param point - the pointer, in figure pixels.
		* @returns the mark with its far corner moved.
		*/
		function stretchDraft(draft, point) {
			return {
				...draft,
				points: [draft.points[0], point]
			};
		}
		/**
		* A `point` mark, placed at the press.
		*
		* A point mark is placed, not dragged: the press is already its whole geometry,
		* and there is no extent for a drag to define.
		* @param seed - the pen and the press point.
		* @param anchor - what the press landed on, when it named something.
		* @returns the mark to commit.
		*/
		function pointMark(seed, anchor) {
			return {
				id: nextMarkId(),
				kind: "point",
				color: seed.color,
				points: [seed.point],
				...anchor === void 0 ? {} : { anchor }
			};
		}
		/**
		* One element as a mark, from the anchor that named it.
		*
		* The geometry is the element's own box, written as the two corners every
		* box-shaped mark carries, so everything downstream — the hit area, the control
		* frame, the export, the PDF appearance — reads an element mark through the same
		* code a `rect` goes through. What makes it a different mark is what it also
		* carries: the anchor, which is the name of the thing rather than the area.
		* @param anchor - the element that was picked.
		* @param color - the stroke color for the new mark.
		* @returns the mark to commit.
		*/
		function elementMark(anchor, color) {
			const [x, y, boxWidth, boxHeight] = anchor.bbox;
			return {
				id: nextMarkId(),
				kind: "element",
				color,
				points: [[x, y], [x + boxWidth, y + boxHeight]],
				anchor
			};
		}
		/**
		* Whether a finished drag drew a shape worth committing.
		*
		* Two ways a finished gesture is not a mark: it never produced a second point, and
		* it released within {@link MIN_DRAG_LENGTH} of where it started. Both are clicks
		* the reader made with a drawing tool armed, and committing them would leave marks
		* on the figure that ask for nothing and cannot be seen.
		* @param draft - the mark that was being drawn.
		* @returns true when the draft is a shape the reader can see.
		*/
		function draftWorthCommitting(draft) {
			if (draft.points.length < 2) return false;
			if (draft.kind === "pen") return true;
			const first = draft.points[0];
			const last = draft.points[draft.points.length - 1];
			return Math.hypot(last[0] - first[0], last[1] - first[1]) >= 4;
		}
		/**
		* The point a finished drag is anchored by.
		*
		* The release point, not the press point: a mark asks the agent to look where the
		* reader let go of it. A freehand stroke ends wherever the hand stopped, so its last
		* sample is the same answer.
		* @param draft - the mark that was being drawn.
		* @returns the point to name the element under.
		*/
		function draftAnchorPoint(draft) {
			return draft.points[draft.points.length - 1];
		}
		/**
		* Collapse an element's text into one line, keeping its parts apart.
		*
		* Whitespace inside each text node is collapsed and the nodes are joined with a
		* single space, so adjacent labels stay distinguishable while the result is still
		* one string an annotation list can hold on one line. The result is truncated to
		* {@link ANCHOR_TEXT_LIMIT} so one deeply nested element cannot flood the message.
		* @param element - the element an anchor names.
		* @returns one line of its text, or an empty string when it holds none.
		*/
		function anchorTextOf(element) {
			const parts = [];
			const walk = (node) => {
				for (let child = node.firstChild; child !== null; child = child.nextSibling) if (child.nodeType === Node.TEXT_NODE) {
					const text = child.nodeValue.replace(/\s+/gu, " ").trim();
					if (text !== "") parts.push(text);
				} else if (child.nodeType === Node.ELEMENT_NODE) walk(child);
			};
			walk(element);
			return parts.join(" ").slice(0, 80);
		}
		//#endregion
		//#region src/client/dom-path.ts
		/**
		* Naming one element so that the name still finds it after the document is saved.
		*
		* An element mark says "this element", and the only thing that survives the panel
		* closing is a string. A path of `tag:nth-of-type(n)` steps is exact for the
		* document it was read from, and an `#id` is exact for as long as the source keeps
		* that id — which is why the walk prefers an id the moment it meets one: a
		* matplotlib figure names every artist it draws, and those names are the ones a
		* source reader can act on directly.
		*
		* Not every id survives, though. matplotlib names its artists two ways at once: the
		* artists a reader talks about get a stable name (`figure_1`, `axes_1`, `line2d_10`)
		* while the anonymous shapes it generates get a hash (`m4750a7a074`,
		* `p8305ee768d`) minted from a per-run salt. A hash is not a name — the next render
		* produces a different one — so a path that stops on it names nothing after the
		* figure is drawn again. Those ids are walked past, which leaves a positional path:
		* longer to read, but still pointing at the same element next time.
		*
		* Shared by both element surfaces. A rendered HTML document and an inline SVG live
		* in different documents, but the question is the same one and the answer has to
		* be spelled the same way, or two marks on the same element would stop being
		* comparable.
		* @module dsh-figmark/client/dom-path
		*/
		/**
		* Whether an id is a name the reader's source will still have tomorrow.
		*
		* Two ways to fail. A hash-shaped id (`m4750a7a074`) is minted per render, so it
		* identifies this drawing and nothing else. A framework's generated id (`el-42`,
		* `ember1234`, `:r1:`) is minted per mount, and though it may survive a reload it
		* will not survive an edit, which is the case that matters: the reader opens the
		* source, changes it, and the mark has to still resolve.
		*
		* A dotted id is kept: matplotlib really does emit `matplotlib.axes._axes.Axes`,
		* and rejecting dots would throw away a perfectly good name.
		* @param id - the element's id.
		* @returns true when the id is worth putting in a path.
		*/
		function isStableId(id) {
			if (id === "") return false;
			if (/^patch_\d+$/u.test(id)) return false;
			if (/^[a-z]?[0-9a-f]{8,}$/iu.test(id)) return false;
			if (/^(?:ember|ext-gen|yui_|react|radix|mui|rc-|el-|ant-|sc-|css-|jsx-)[\w-]*\d/iu.test(id)) return false;
			if (/^:\w+:/u.test(id)) return false;
			return true;
		}
		/**
		* One id, spelled so that it can be pasted into a selector as it stands.
		*
		* An id is not free text: matplotlib emits `matplotlib.axis_1` and
		* `matplotlib.axes._axes.Axes`, both of which contain characters a bare `#id` cannot
		* carry. `CSS.escape` is the browser's own answer to this, but it does not exist in
		* every engine the specs run in, so the two characters that actually occur are
		* escaped here as well.
		* @param id - the element's id.
		* @returns a `#`-prefixed selector step.
		*/
		function idStep(id) {
			return `#${typeof CSS !== "undefined" && typeof CSS.escape === "function" ? CSS.escape(id) : id.replace(/([^\w-])/gu, "\\$1")}`;
		}
		/**
		* How deep an element sits below an ancestor.
		*
		* Depth breaks ties between two boxes of the same area: the deeper one is the more
		* specific answer, and a reader pointing at a cell means the cell, not the row around
		* it that happens to have the same area.
		* @param element - the element to measure.
		* @param ancestor - the element the depth is counted from, exclusive.
		* @returns the number of parent steps between them.
		*/
		function depthBelow(element, ancestor) {
			let depth = 0;
			for (let node = element.parentElement; node !== null && node !== ancestor; node = node.parentElement) depth += 1;
			return depth;
		}
		/**
		* One element's position among its same-name siblings, as a selector step.
		* @param element - the element to place.
		* @returns e.g. `g:nth-of-type(2)`.
		*/
		function positionStep(element) {
			const tag = element.tagName;
			let position = 1;
			for (let sibling = element.previousElementSibling; sibling !== null; sibling = sibling.previousElementSibling) if (sibling.tagName === tag) position += 1;
			return `${tag.toLowerCase()}:nth-of-type(${position})`;
		}
		/**
		* One element's path from the document body.
		*
		* Every step is exact for the document it was read from: a step is the element's
		* own `#id` where it has one worth keeping, and its position among same-name
		* siblings otherwise. The walk stops at the body — and says so — unless an `#id` made
		* the tail self-rooted: a bare `p:nth-of-type(1)` is body-relative but reads as
		* document-wide, which in a document with nested paragraphs names the wrong element.
		* `body > p:nth-of-type(1)` can be pasted into a query as it stands.
		*
		* @param element - the element to name.
		* @param body - the body the path is rooted at.
		* @returns a CSS path, usable as a selector in the document the element came from.
		*/
		function selectorFor(element, body) {
			const segments = [];
			let rooted = false;
			for (let current = element; current !== null && current !== body; current = current.parentElement) {
				if (isStableId(current.id)) {
					segments.unshift(idStep(current.id));
					rooted = true;
					break;
				}
				segments.unshift(positionStep(current));
			}
			if (!rooted) segments.unshift("body");
			return segments.join(" > ");
		}
		/**
		* One element's path from the root of the figure it belongs to.
		*
		* The same walk as {@link selectorFor}, rooted at the `<svg>` element instead of
		* the document body. An inlined figure lives inside the panel's own document, so a
		* body-relative path would start with the panel's chrome and name nothing the
		* source file contains; rooted at the figure, the path is one the reader can paste
		* into the SVG's own source.
		*
		* An id ends the walk here too, and for a stronger reason: a matplotlib figure
		* names every artist it draws (`figure_1`, `axes_1`, `line2d_10`), and that name is
		* both shorter and stabler than any positional path through the same tree. An id
		* the figure generated rather than chose is walked past — see {@link isStableId}.
		*
		* @param element - the element to name.
		* @param root - the figure's root element, excluded from the path.
		* @returns a CSS path, usable as a selector inside the figure.
		*/
		function selectorWithin(element, root) {
			const segments = [];
			let rooted = false;
			for (let current = element; current !== null && current !== root; current = current.parentElement) {
				if (isStableId(current.id)) {
					segments.unshift(idStep(current.id));
					rooted = true;
					break;
				}
				segments.unshift(positionStep(current));
			}
			if (!rooted) segments.unshift(root.tagName.toLowerCase());
			return segments.join(" > ");
		}
		/**
		* How many probes span {@link PICK_REACH}, per axis.
		*
		* Five puts them three pixels apart, which covers a two-pixel stroke from any side
		* within the reach. Finer would only pay off for hairlines, and a reader who wants one
		* of those has the pane's magnification to make it wide enough to aim at.
		*/
		const PROBE_STEPS = 5;
		/**
		* The offsets each pick asks about, nearest to the pointer first.
		*
		* Distance order is what makes "the first candidate" mean "the nearest thing": a find
		* on a far probe must never beat a find on a near one, which is only honest if every
		* probe already asked was closer. Ties keep reading order, so the same pointer position
		* always names the same element.
		*/
		const PROBES = (() => {
			const offsets = [];
			const half = (PROBE_STEPS - 1) / 2;
			for (let row = 0; row < PROBE_STEPS; row += 1) for (let column = 0; column < PROBE_STEPS; column += 1) offsets.push([(column - half) / half, (row - half) / half]);
			return offsets.sort((one, other) => Math.hypot(one[0], one[1]) - Math.hypot(other[0], other[1]));
		})();
		/**
		* Whether an element is the sheet the surface is drawn on.
		*
		* @param element - candidate element.
		* @param frame - the box of the surface it belongs to.
		* @returns true when the element covers essentially the whole surface.
		*/
		function isPaper(element, frame) {
			if (frame.width <= 0 || frame.height <= 0) return false;
			const box = element.getBoundingClientRect();
			return box.width >= frame.width * .98 && box.height >= frame.height * .98;
		}
		/**
		* Everything the browser paints around one point, nearest probe first.
		*
		* Within one probe the order is the browser's own, which is the only ordering that
		* answers "what does the reader see here": where two elements both cover a point, the
		* one drawn later is in front. A candidate from a nearer probe always precedes one from
		* a farther probe, and an element appears once however many probes found it.
		*
		* The caller chooses from the list rather than receiving one answer, because what
		* counts as the surface is the caller's to know — the same document holds the panel
		* annotating the figure, and a document's own background is not a thing on it.
		*
		* The coordinates are the *document's own*. A document inside a frame is not scaled by
		* the transform on that frame, so its layout pixels are the ones to pass, not the
		* pointer's position in the panel.
		*
		* @param document_ - the document to ask.
		* @param x - pointer x in that document's coordinate space.
		* @param y - pointer y in that document's coordinate space.
		* @param reach - how far around the pointer to look, in that document's pixels.
		* @returns the candidates, nearest first; null when the document cannot be asked at all,
		*   which is a different answer from an empty list and has a different fallback.
		*/
		function pickStack(document_, x, y, reach = 6) {
			if (document_ === null || document_ === void 0) return null;
			if (typeof document_.elementsFromPoint !== "function") return null;
			const found = [];
			for (const [dx, dy] of PROBES) for (const element of document_.elementsFromPoint(x + dx * reach, y + dy * reach)) if (!found.includes(element)) found.push(element);
			return found;
		}
		/**
		* Whether a shape's own interior contains a point, asked of its fill geometry.
		*
		* The question the browser's hit testing cannot answer. A shape with `fill="none"` is
		* transparent to the pointer by definition, so a hollow node — a Graphviz ellipse, a
		* flowchart box — reports only the sheet behind it, and a reader pointing at the node's
		* middle gets nothing.
		*
		* The tempting fix is to open every shape to the pointer (`pointer-events: all`), and
		* it is wrong: measured on a real matplotlib figure it changed one point in five, and
		* always for the worse, because a curve with no fill then answers for the tick groups
		* drawn in front of it. This asks each shape about *its own* fill instead, so a hollow
		* closed shape claims its middle while an open curve — which is not filled either,
		* however wide its box — claims nothing under itself.
		*
		* A shape that is *painted* solid is skipped: the browser already answered for it, and
		* asking again would only reorder answers that are already right.
		*
		* The point has to be in the shape's own user space, which is what its screen transform
		* is for: the figure may be magnified, and its shapes may sit in nested groups.
		*
		* @param element - the shape to ask.
		* @param clientX - point x in client space.
		* @param clientY - point y in client space.
		* @returns true when the point is inside the shape's fill area.
		*/
		function coversInterior(element, clientX, clientY) {
			if (typeof element.isPointInFill !== "function") return false;
			const shape = element;
			if (shape.ownerSVGElement === null || shape.ownerSVGElement === void 0) return false;
			const fill = shape.getAttribute("fill");
			if (fill !== null && fill !== "" && fill !== "none") return false;
			const matrix = shape.getScreenCTM();
			if (matrix === null) return false;
			const inverse = matrix.inverse();
			const x = inverse.a * clientX + inverse.c * clientY + inverse.e;
			const y = inverse.b * clientX + inverse.d * clientY + inverse.f;
			return shape.isPointInFill({
				x,
				y
			});
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
		/** CSS pixels per unit, for the absolute lengths an SVG may declare its size in. */
		const UNIT_PIXELS = {
			"": 1,
			px: 1,
			pt: 96 / 72,
			pc: 16,
			in: 96,
			cm: 96 / 2.54,
			mm: 96 / 25.4,
			q: 96 / 101.6
		};
		/**
		* One SVG length attribute, in CSS pixels, or undefined when it is not absolute.
		*
		* `Number.parseFloat` stops at the first character it cannot read, which turns `6.4in`
		* into the bare number 6.4 — 72 times too small once written back as a pixel count —
		* and `100%` into 100. A percentage or a viewport-relative unit is not a size this
		* figure has without a container to measure against, so those fall through to the
		* viewBox instead of being guessed at.
		* @param text - the attribute's text, or null when absent.
		* @returns the length in CSS pixels.
		*/
		function absoluteLength(text) {
			if (text === null) return void 0;
			const match = /^\s*([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)\s*([a-zA-Z%]*)\s*$/.exec(text);
			/* v8 ignore next -- an unparseable attribute is handled as no size at all. */
			if (match === null) return void 0;
			const value = Number(match[1]);
			const scale = UNIT_PIXELS[match[2].toLowerCase()];
			if (scale === void 0 || value <= 0) return void 0;
			return value * scale;
		}
		/**
		* Read one inline SVG's own size.
		*
		* An absolute unit is converted rather than stripped: a figure authored in `in`, `mm`
		* or `pt` was rendering 72× (or 3.78×) too small, with its strokes pinned to the unit
		* floor — which reads as a corrupt file rather than a mis-scaled one.
		* @param root - sanitized root element.
		* @returns the width/height from its attributes or viewBox, defaulting to 800x600.
		*/
		function svgIntrinsicSize(root) {
			const attributeWidth = absoluteLength(root.getAttribute("width"));
			const attributeHeight = absoluteLength(root.getAttribute("height"));
			if (attributeWidth !== void 0 && attributeHeight !== void 0) return {
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
		* The element a reader meant when they pointed at one of its parts.
		*
		* A figure is drawn through anonymous geometry: matplotlib puts a tick's line, its
		* label, and its number in one `<g id="xtick_1">`, and every one of those three is a
		* nameless `<path>`, `<use>`, or `<text>` inside it. Naming the part gives the source
		* reader nothing to open; naming the group that carries the id gives it the artist.
		* The same rule is why a Graphviz node's `<title>` counts — that is how Graphviz says
		* which node a shape belongs to.
		*
		* The walk stops at the container, so an id on the panel around the figure is never
		* mistaken for the figure's own.
		* @param hit - the element the browser says is painted under the pointer.
		* @param container - the element holding the figure, which is never the answer.
		* @returns the nearest ancestor-or-self that names itself, else the hit itself.
		*/
		function namingAncestor(hit, container) {
			for (let node = hit; node !== null && node !== container; node = node.parentElement) if (isStableId(node.id) || node.querySelector(":scope > title") !== null) return node;
			return hit;
		}
		/**
		* Whether an element is something a reader could mean to point at.
		*
		* Three things are ruled out. Anything outside the figure is not part of it — the same
		* document holds the overlay that carries the marks, and that overlay is above the
		* drawing, so it is the first thing every hit test finds. The figure root is the
		* surface rather than anything drawn on it. And elements inside `defs` are never
		* painted where they are declared, so a hit on one is a hit on whatever the
		* declaration was cloned into.
		*
		* There is deliberately no "covers the whole figure, so it must be the paper" rule
		* here, though an HTML document needs one. In a figure that rule is wrong: a trend
		* line drawn corner to corner has the whole figure for a bounding box, so judging the
		* sheet by extent would refuse to name the single most important line on the plot. The
		* browser's paint order already answers "is anything here", and a background that does
		* get picked is shown by the highlight before the click, so nothing is taken unseen.
		*
		* Everything else is fair game, including a `<path>`, a `<text>`, and the `<use>` a
		* marker or a tick is drawn through: those are what the figure is made of, and the
		* anchor re-points at whichever ancestor names itself.
		* @param element - candidate element.
		* @param root - the figure root.
		* @returns true when a reader could be pointing at this element.
		*/
		function isPickable(element, root) {
			if (element === root) return false;
			if (!root.contains(element)) return false;
			return !isNonRendered(element, root);
		}
		function measuringHit(container, root, clientX, clientY) {
			let hit;
			let hitArea = Number.POSITIVE_INFINITY;
			let hitDepth = -1;
			for (const element of root.querySelectorAll("*")) {
				if (isNonRendered(element, root)) continue;
				const rect = element.getBoundingClientRect();
				if (rect.width === 0 || rect.height === 0) continue;
				if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) continue;
				const area = rect.width * rect.height;
				const depth = depthBelow(element, container);
				if (area < hitArea || area === hitArea && depth > hitDepth) {
					hit = element;
					hitArea = area;
					hitDepth = depth;
				}
			}
			return hit;
		}
		/**
		* Describe the figure element under one client-space point.
		*
		* The browser answers which element covers the point, because only it knows the
		* painted geometry: a `<path>` that opens a hole in itself covers less than its
		* bounding box, and a sloped line covers almost none of the rectangle its ends span.
		* Measuring boxes instead would name that sloped line for a click far above it, which
		* is the one thing a reader annotating a plot would find most wrong.
		*
		* One thing the browser does not do is let a pick reach a stroke that is a pixel wide,
		* so the point is asked about together with the ring of points around it. And one
		* thing it cannot be asked is a shape with `fill="none"`, which is unpickable in its
		* interior by definition — but a figure is mostly exactly those shapes, so while the
		* question is being asked the figure's root is told to hit-test its geometry rather
		* than its pointer-events. The property only affects hit testing, never painting, and
		* it is put back before this function returns, so nothing an observer or the reader
		* can see is left changed.
		*
		* The hit is then re-pointed at the nearest ancestor that names itself (`id` or a
		* `<title>`, which is how Graphviz identifies a node), because a reader pointing at a
		* mark on a curve means the curve and not the path segment under one pixel.
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
			const hit = pickInFigure(container, root, root.getBoundingClientRect(), clientX, clientY);
			if (hit === void 0) return void 0;
			const described = namingAncestor(hit, container);
			const rect = described.getBoundingClientRect();
			const containerRect = container.getBoundingClientRect();
			const title = described.querySelector(":scope > title")?.textContent?.trim();
			const text = anchorTextOf(described);
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
				...text === "" ? {} : { text },
				selector: selectorWithin(described, root)
			};
		}
		/**
		* The figure element painted under one client-space point.
		*
		* The browser is asked first, with the figure lending it the ability to hit-test
		* unfilled geometry for the duration of the question. When it cannot answer at all —
		* no hit testing in the engine — the boxes are measured instead.
		* @param container - element holding the inline figure.
		* @param root - the figure root.
		* @param frame - the box the figure is drawn in.
		* @param clientX - pointer x in client space.
		* @param clientY - pointer y in client space.
		* @returns the element, or undefined when nothing is painted there.
		*/
		function pickInFigure(container, root, frame, clientX, clientY) {
			const stack = pickStack(container.ownerDocument, clientX, clientY, 6);
			if (stack === null) return measuringHit(container, root, clientX, clientY);
			const painted = stack.find((element) => isPickable(element, root));
			if (painted !== void 0) return painted;
			return hollowAt(root, clientX, clientY);
		}
		/**
		* The innermost unfilled shape whose own interior contains a point.
		*
		* The half of the job the browser's hit testing cannot do, kept to the case where it
		* matters. Handing the figure `pointer-events: all` would also reach hollow shapes,
		* but it opens every *stroke* to the pointer at the same time: measured on a real
		* matplotlib figure, that changed one sampled point in five, and always for the
		* worse — a curve with no fill began answering for the tick groups drawn in front of
		* it. Asking each shape about its own fill area reaches the hollow node's middle and
		* leaves the rest of the figure exactly as the browser reported it.
		*
		* Innermost wins for the same reason it does in the box measurement: a reader pointing
		* inside a hollow frame means the thing inside it, and a later-drawn shape is in front
		* of an earlier one, so document order breaks ties.
		* @param root - the figure root.
		* @param clientX - pointer x in client space.
		* @param clientY - pointer y in client space.
		* @returns the shape, or undefined when no unfilled shape covers the point.
		*/
		function hollowAt(root, clientX, clientY) {
			let found;
			let foundDepth = -1;
			for (const shape of root.querySelectorAll("*")) {
				if (!coversInterior(shape, clientX, clientY)) continue;
				const depth = depthBelow(shape, root);
				if (depth >= foundDepth) {
					found = shape;
					foundDepth = depth;
				}
			}
			return found;
		}
		//#endregion
		//#region src/client/canvas/pointer.ts
		/**
		* Convert one pointer event to figure pixels.
		*
		* A collapsed pane reports a zero-size box; treating it as 1:1 keeps a drag from
		* committing infinite coordinates.
		* @param event - the pointer event, bound to the surface.
		* @param geometry - the paper's size and origin.
		* @returns the point in figure pixels.
		*/
		function figurePointOf(event, geometry) {
			const rect = event.currentTarget.getBoundingClientRect();
			const scaleX = rect.width === 0 ? 1 : geometry.width / rect.width;
			const scaleY = rect.height === 0 ? 1 : geometry.height / rect.height;
			return [(event.clientX - rect.left) * scaleX - geometry.originX, (event.clientY - rect.top) * scaleY - geometry.originY];
		}
		/**
		* Describe what the point under a pointer landed on.
		*
		* A rendered document reports its elements in its own layout pixels, which are the
		* figure units already, so it names them from the point. An inline SVG is
		* hit-tested against client coordinates instead, because its elements live in the
		* same document as this overlay and their boxes are the browser's own.
		*
		* The svg's box is read here rather than in {@link figurePointOf} again because
		* the two answers are needed at different times — a press reads the point first and
		* the name second — and a cached rect would go stale the moment the pane resized
		* between them.
		* @param event - the pointer event, bound to the surface.
		* @param point - the same event, in figure pixels.
		* @param geometry - the paper's size.
		* @param source - how this surface names elements.
		* @returns the anchor, or undefined when the point names nothing.
		*/
		function anchorOf(event, point, geometry, source) {
			if (source.anchorAtFigurePoint !== void 0) return source.anchorAtFigurePoint(point[0], point[1]);
			const container = source.containerRef.current;
			if (!source.anchoring || container === null) return void 0;
			const rect = event.currentTarget.getBoundingClientRect();
			if (rect.width === 0 || rect.height === 0) return void 0;
			const scaleX = geometry.width / rect.width;
			const scaleY = geometry.height / rect.height;
			return anchorAtPoint(container, rect.left + (point[0] + geometry.originX) / scaleX, rect.top + (point[1] + geometry.originY) / scaleY, scaleX, scaleY);
		}
		//#endregion
		//#region src/client/canvas/press.ts
		/**
		* What one pointer move means to the gesture in flight.
		* @param held - the press being dragged.
		* @param point - the pointer, in figure pixels.
		* @param dx - horizontal movement since the press, in figure pixels.
		* @param dy - vertical movement since the press.
		* @returns what to draw until the gesture ends.
		*/
		function editFor(held, point, dx, dy) {
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
			if (handle === "tail" || handle === "tip") return {
				points: movedEnd({
					end: handle,
					at: point,
					origin: held.origin,
					rotation: held.originRotation
				}),
				rotation: void 0
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
		}
		/**
		* The patch a finished handle drag asks the owner to record.
		*
		* Only the fields the edit actually produced are listed, so a resize does not
		* clear a rotation. A gesture that produced nothing at all carries no fields, and
		* the caller can tell that apart by its emptiness rather than by a null.
		* @param edit - what the gesture drew.
		* @returns the fields that changed; empty when none did.
		*/
		function patchFrom(edit) {
			const patch = {};
			if (edit.points !== void 0) patch.points = edit.points;
			if (edit.rotation !== void 0) patch.rotation = edit.rotation;
			return patch;
		}
		/**
		* The mark as the running gesture currently has it, for drawing only.
		*
		* The stored mark is left alone until the gesture is dropped: a drag redraws from
		* the press's origin every frame, so nothing is committed to the annotation file
		* for a movement the reader may still abandon.
		* @param mark - the stored mark.
		* @param press - the gesture in flight, or null when none.
		* @returns the mark to draw.
		*/
		function shownMark(mark, press) {
			const edit = press !== null && press.id === mark.id ? press.edit : null;
			if (edit === null) return mark;
			const next = {
				...mark,
				points: shownPoints(mark, press)
			};
			if (edit.rotation !== void 0) next.rotation = edit.rotation;
			return next;
		}
		/**
		* Geometry to draw for one mark: the running gesture may have displaced it.
		* @param mark - the stored mark.
		* @param press - the gesture in flight, or null when none.
		* @returns the geometry the surface should draw.
		*/
		function shownPoints(mark, press) {
			return press !== null && press.edit !== null && press.edit.points !== void 0 && press.id === mark.id ? press.edit.points : mark.points;
		}
		/**
		* The mark as it currently looks during a drag, as the owner should be told about it.
		*
		* The geometry is what the gesture drew, not what the mark stores: a comment pill
		* pinned to the mark has to follow the hand, and the stored mark is only updated
		* when the drag is committed.
		* @param base - the stored mark being dragged.
		* @param edit - what the gesture drew.
		* @returns the mark at its running geometry.
		*/
		function liveMark(base, edit) {
			const live = { ...base };
			if (edit.points !== void 0) live.points = edit.points;
			if (edit.rotation !== void 0) live.rotation = edit.rotation;
			return live;
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
		* Sized by the figure alone. The weight rail is the reader's answer to "how thick
		* should this stroke be", and a pin is not a stroke: it marks *where*, carries a
		* digit, and is compared against the same line work whatever the last arrow was
		* drawn at. Reusing the weight here meant that a rail left at 4 to draw a fat arrow
		* turned the next pin into a marker four times its size — a pin that covered the
		* peak it was pointing at. A mark set by one control should not grow by a control
		* that belongs to another kind of mark.
		*
		* A `weight` already written into an older point mark is ignored rather than
		* migrated: the field is read by nothing now, so an old file and a new one draw the
		* same pin.
		* @param unit - the figure's size multiple.
		* @returns the head's half-width in figure pixels.
		*/
		function pinRadiusOf(unit = 1) {
			return 10 * unit;
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
		* Scaled by the figure and nothing else, so it keeps the same share of the head at
		* every size — the head no longer varies with the rail, and a numeral that did would
		* be the only thing left varying.
		* @param unit - the figure's size multiple.
		* @returns the font size to draw the number at.
		*/
		function pinFontSizeOf(unit = 1) {
			return 11 * unit;
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
		*
		* The path is in figure coordinates, so anything it sizes — the arrow's barbs — has
		* to be multiplied by the figure's unit here rather than left to the caller: strokes
		* are given their width in screen pixels by the caller, but a barb is a coordinate,
		* and a coordinate that ignored the unit drew one head on every figure. A head that
		* did not grow with the shaft read as a blunt dart on anything larger than a plot at
		* unit 1, and the outline that measured it reserved a head sixty pixels wide on a
		* tip that only had fourteen.
		*
		* @param mark - the mark to render.
		* @param unit - the figure's size multiple.
		* @returns path data, or undefined for a `point` mark (which draws as a pin).
		*/
		function markPathData(mark, unit = 1) {
			const [first, second] = mark.points;
			if (first === void 0) return void 0;
			switch (mark.kind) {
				case "arrow": {
					if (second === void 0) return void 0;
					const [left, right] = arrowBarbs(mark.points, mark.weight ?? 1, unit).slice(2);
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
				case "element": return;
			}
		}
		/**
		* The marker for one `point` mark, or undefined when it carries no coordinate.
		*
		* The marker always stands the same way up: its tip on the coordinate, its body
		* above. It used to turn over near the top edge, so that a point placed high on the
		* figure would not hang its head outside the picture — but a marker whose shape
		* depends on where it sits is a marker the reader has to re-read every time it moves,
		* and dragging one toward the top edge made it snap over mid-gesture with nothing
		* else changing. A pin that flips is a pin that stops meaning "map pin".
		*
		* Nothing needs it to flip. The paper is measured from the marks (see `plotBounds`),
		* so a point near the top edge grows the sheet upward and its head lands on paper
		* that is now there. The figure is not a frame the drawing has to stay inside; it is
		* the part of the sheet that has a picture on it.
		* @param mark - the point mark.
		* @param unit - the figure's size multiple.
		* @returns the marker's path, number centre and box, or undefined with no coordinate.
		*/
		function pinGeometry(mark, unit = 1) {
			const tip = mark.points[0];
			if (tip === void 0) return void 0;
			const radius = pinRadiusOf(unit);
			const lift = radius * PIN_LIFT;
			const [tipX, tipY] = tip;
			const centreY = tipY - lift;
			const shoulder = radius * PIN_SHOULDER;
			const belly = lift * PIN_BELLY;
			const path = [
				`M ${n(tipX)} ${n(tipY)}`,
				`Q ${n(tipX - shoulder)} ${n(tipY - belly)} ${n(tipX - radius)} ${n(centreY)}`,
				`A ${n(radius)} ${n(radius)} 0 1 1 ${n(tipX + radius)} ${n(centreY)}`,
				`Q ${n(tipX + shoulder)} ${n(tipY - belly)} ${n(tipX)} ${n(tipY)}`,
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
		* Whether a mark draws as a stroke, rather than as a marker on the element it names.
		*
		* A `point` is a pin and an `element` is a light on the figure's own artwork; neither
		* paints a line the reader can thicken, so neither answers to the weight rail. Every
		* other kind is the reader's own stroke and does.
		* @param kind - the kind of mark.
		* @returns whether the mark has a stroke of its own.
		*/
		function isStrokeKind(kind) {
			return kind !== "point" && kind !== "element";
		}
		/**
		* Whether a mark's extent is the reader's to change.
		*
		* Two kinds say a size that is not theirs to edit. A `point` has no extent at all —
		* it is one coordinate, and a resize handle would stretch nothing. An `element` has
		* one, but it belongs to the element: the box is where that element was when it was
		* picked, and dragging a corner would leave a mark claiming to name a thing while
		* pointing at some other area. Both are still selectable and still carry a number.
		* @param kind - the kind of mark.
		* @returns true when the mark offers no resize or turn handles.
		*/
		function hasFixedExtent(kind) {
			return kind === "point" || kind === "element";
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
			const straight = pointsBox(mark.kind === "arrow" ? arrowBarbs(mark.points, mark.weight ?? 1, unit) : mark.points);
			if (straight === void 0) return void 0;
			const radians = markRadians(mark);
			const box = radians === 0 ? straight : turnedBox(straight, radians);
			const grow = isStrokeKind(mark.kind) ? strokeWidthOf(mark, unit) / 2 : 0;
			return {
				x: box.x - grow,
				y: box.y - grow,
				width: box.width + grow * 2,
				height: box.height + grow * 2
			};
		}
		/**
		* The box a box covers once it is turned, as a mark's rotation turns it.
		*
		* The centre it turns around is the box's own, which is also the centre the control
		* frame puts its rotation handle at, so the frame and the drawing agree about where a
		* turned mark sits. All four corners are turned rather than the shape's own points:
		* what a turned rectangle sweeps is bounded by its corners, and two opposite corners
		* only ever describe a diagonal.
		*
		* @param box - the upright box to turn.
		* @param radians - clockwise angle in radians.
		* @returns the box the turned corners cover.
		*/
		function turnedBox(box, radians) {
			const cos = Math.cos(radians);
			const sin = Math.sin(radians);
			const centreX = box.x + box.width / 2;
			const centreY = box.y + box.height / 2;
			const turned = [
				[box.x, box.y],
				[box.x + box.width, box.y],
				[box.x + box.width, box.y + box.height],
				[box.x, box.y + box.height]
			].map((corner) => {
				const dx = corner[0] - centreX;
				const dy = corner[1] - centreY;
				return [centreX + dx * cos - dy * sin, centreY + dx * sin + dy * cos];
			});
			const first = turned[0];
			/* v8 ignore next -- the four corners above are never an empty run. */
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
		//#endregion
		//#region src/client/canvas/gesture.ts
		/**
		* The pointer state machine of the drawing surface.
		*
		* One surface answers four kinds of pointer input that all begin with the same
		* event and end with the same one: drawing a new mark, moving or resizing an
		* existing one, panning the paper, and picking the element under the pointer. They
		* share the press because they have to be told apart at the press — the thing the
		* pointer landed on decides which of the four it is — and they share the release
		* because only one of them can own it.
		*
		* Keeping the machine here rather than inside the component is what makes the
		* component an assembly: it draws, this decides. The state that only exists between
		* a press and a release lives here too, so nothing that draws has to know a gesture
		* is in flight.
		* @module dsh-figmark/client/canvas/gesture
		*/
		/** Hit reach of a control handle, as a multiple of its side: generous enough to grab. */
		const HANDLE_REACH = 2.2;
		/**
		* Wire the surface's pointer machine.
		*
		* The pending gesture is one state object rather than a group of booleans because a
		* press can only be one of them: two would be two truths about the same pointer.
		* @param props - the surface's contract.
		* @param geometry - the paper's size and origin, in figure pixels.
		* @returns what to draw and what to bind.
		*/
		function useCanvasGesture(props, geometry) {
			const { marks, tool, color, weight, containerRef, anchoring } = props;
			const penWeight = weight ?? 1;
			const sizes = controlSizes(props.scale);
			const [draft, setDraft] = (0, react.useState)(null);
			const [press, setPress] = (0, react.useState)(null);
			const drawing = (0, react.useRef)(false);
			const panning = (0, react.useRef)(null);
			const panned = (0, react.useRef)(false);
			/**
			* Whether the press that just ended has already spent the click it comes with.
			*
			* A press and its release are followed by a `click` on whatever the browser
			* considers the target. That click is the panel's way of saying "the reader
			* pressed the paper", which is how a selection is dropped — so a gesture that
			* deliberately ended with a selection has to say so, or it selects and deselects
			* in the one movement. Drawing set this; picking a placed element did not, which
			* is why an element mark could be placed but never reopened.
			*/
			const settled = (0, react.useRef)(false);
			const [hover, setHover] = (0, react.useState)(null);
			const reportHover = props.onHover;
			/**
			* Tell the parent which element the pointer is over.
			*
			* A separate effect rather than a call inside the move handler: the highlight
			* belongs to the figure's own document, and this component never touches it. Kept
			* on `hover` and the callback alone, so a move that names the same element reports
			* nothing at all — the effect's dependencies are the two things that can change the
			* answer, not the props object a parent rebuilds every render.
			*/
			(0, react.useEffect)(() => {
				reportHover?.(hover ?? void 0);
			}, [hover, reportHover]);
			/**
			* Forget the highlight whenever the picker is put away.
			*
			* The highlight says "this is what a click would take"; with no picker armed there
			* is no click to describe, and a lit element left behind would be a promise the
			* tool no longer keeps. Disarming also covers the case a pointer never will: the
			* reader leaves the figure with the picker armed, so no move arrives to clear it.
			*/
			(0, react.useEffect)(() => {
				if (tool !== "element") setHover(null);
			}, [tool]);
			/**
			* Where the current press landed, in figure pixels.
			*
			* Recorded in the capture phase because a mark's hit area stops the bubble, so
			* this is the only place a drag on an existing mark can learn its own origin.
			* A box rather than a nullable ref: the capture handler runs for every press on
			* the surface, so there is no state where it holds no point.
			*/
			const pressedAt = (0, react.useRef)({ value: [0, 0] });
			const toFigure = (event) => figurePointOf(event, geometry);
			const anchorFor = (event, point) => anchorOf(event, point, geometry, {
				anchoring,
				containerRef,
				anchorAtFigurePoint: props.anchorAtFigurePoint
			});
			const elementMarkAt = (event, point) => elementNamedBy(marks, anchorFor(event, point), props.selectedId);
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
			* @param mark - the mark the press landed on.
			* @param event - the pointer event.
			* @param handle - the handle it grabbed instead of the shape, when it did.
			*/
			const beginGesture = (mark, event, handle) => {
				event.stopPropagation();
				props.onSelect(mark.id);
				if (handle === void 0 && tool !== "select") return;
				if (handle === void 0 && mark.kind === "element") return;
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
			const beginHandle = (mark, event) => {
				if (props.selectedId !== mark.id) return false;
				if (hasFixedExtent(mark.kind)) return false;
				const grabbed = mark.kind === "arrow" ? endAt(mark.points, mark.rotation ?? 0, pressedAt.current.value, HANDLE_REACH * sizes.grip) : gripAt(controlBox(mark), mark.rotation ?? 0, pressedAt.current.value, HANDLE_REACH * sizes.grip, sizes.grip);
				if (grabbed === void 0) return false;
				beginGesture(mark, event, grabbed);
				return true;
			};
			const onPressMark = (mark, event) => {
				if (!beginHandle(mark, event)) beginGesture(mark, event);
			};
			const start = (event) => {
				settled.current = false;
				if (tool === "select") {
					const overElement = elementMarkAt(event, toFigure(event));
					if (overElement !== void 0) {
						beginGesture(overElement, event);
						settled.current = true;
						return;
					}
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
					const mark = pointMark({
						color,
						weight: penWeight,
						point
					}, anchorFor(event, point));
					props.onAdd(mark);
					props.onSelect(mark.id);
					props.onDrawn?.(mark.id);
					settled.current = true;
					return;
				}
				if (tool === "element") {
					const picked = anchorFor(event, point);
					if (picked === void 0) return;
					const mark = elementMark(picked, color);
					props.onAdd(mark);
					props.onSelect(mark.id);
					props.onDrawn?.(mark.id);
					settled.current = true;
					return;
				}
				drawing.current = true;
				if (typeof event.currentTarget.setPointerCapture === "function" && event.pointerId !== void 0) event.currentTarget.setPointerCapture(event.pointerId);
				setDraft(draftMark({
					tool,
					color,
					weight: penWeight,
					point
				}));
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
				if (tool === "element") {
					const found = anchorFor(event, toFigure(event)) ?? null;
					setHover((current) => sameAnchor(current, found) ? current : found);
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
					const base = marks.find((candidate) => candidate.id === press.id);
					/* v8 ignore next -- a press always begins on a mark that is still in the list. */
					if (base === void 0) return;
					props.onLiveEdit?.(liveMark(base, edit));
					return;
				}
				if (!drawing.current || draft === null) return;
				const point = toFigure(event);
				if (draft.kind === "pen") {
					setDraft(appendPenSample(draft, point));
					return;
				}
				setDraft(stretchDraft(draft, point));
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
						props.onMove(press.id, moved, describesARegion(press.kind) ? void 0 : anchorFor(event, last));
						return;
					}
					const patch = patchFrom(done);
					props.onUpdate(press.id, patch);
					return;
				}
				if (!drawing.current || draft === null) return;
				drawing.current = false;
				if (typeof event.currentTarget.hasPointerCapture === "function" && event.pointerId !== void 0 && event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
				setDraft(null);
				if (!draftWorthCommitting(draft)) return;
				const anchor = describesARegion(draft.kind) ? void 0 : anchorFor(event, draftAnchorPoint(draft));
				const mark = {
					...draft,
					...anchor === void 0 ? {} : { anchor }
				};
				props.onAdd(mark);
				props.onSelect(mark.id);
				props.onDrawn?.(mark.id);
				settled.current = true;
			};
			const onClick = (event) => {
				if (tool !== "select" || event.target !== event.currentTarget) return;
				if (panned.current) {
					panned.current = false;
					return;
				}
				if (settled.current) {
					settled.current = false;
					return;
				}
				props.onSelect(null);
			};
			const onDoubleClick = (event) => {
				if (tool !== "select") return;
				const over = elementMarkAt(event, toFigure(event));
				if (over === void 0) return;
				event.stopPropagation();
				props.onEdit(over.id);
			};
			/** A press on the paper while a drawing gesture is not in flight: nothing to do. */
			const onPointerDownCapture = (event) => {
				pressedAt.current.value = toFigure(event);
			};
			return {
				draft,
				press,
				hover,
				sizes,
				handlers: {
					onPointerDownCapture,
					onPointerDown: start,
					onPointerMove: move,
					onPointerUp: finish,
					onPointerCancel: finish,
					onPointerLeave: () => {
						setHover(null);
					},
					onClick,
					onDoubleClick,
					onPressMark,
					onPressHandle: (mark, event, handle) => {
						beginGesture(mark, event, handle);
					}
				}
			};
		}
		//#endregion
		//#region src/client/canvas/overlay.tsx
		/**
		* The pin a `point` mark is drawn as.
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
		function Pin(props) {
			const { mark, unit, number } = props;
			const pin = pinPathData(mark, unit);
			const centre = pinNumberCentre(mark, unit);
			/* v8 ignore next -- a point mark carries exactly the one coordinate it was placed at. */
			if (pin === void 0 || centre === void 0) return null;
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
					fontSize: pinFontSizeOf(unit),
					fontWeight: 700,
					fill: PIN_NUMBER_COLOR,
					textAnchor: "middle",
					dominantBaseline: "central",
					children: number
				})
			] });
		}
		/**
		* The highlight drawn around a selected point mark.
		*
		* A frame with eight resize handles would be a lie here: a point has no extent, so
		* there is nothing to stretch. A dashed box says "this one, and only selected"
		* without offering handles that would do nothing.
		*
		* An element mark is *not* framed. Its box is a rectangle the figure never draws —
		* around a curve it can cover half the plot — so a frame there would say "this
		* region" when the mark says "this thing". It reads as selected by being lit
		* harder, in its own shape, which is the rule in `spotlight.ts`.
		* @param props - the frame to draw, in figure pixels.
		* @returns the frame, or nothing when there is no box to draw it around.
		*/
		function FixedFrame(props) {
			const { box, hairline } = props;
			/* v8 ignore next -- both kinds that reach this frame always have a box. */
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
		}
		/**
		* The resize and rotation handles of the selected mark.
		*
		* The frame is drawn over the mark's drawn box, not over its stored points: a
		* turned box's handles have to be where the reader sees its corners, and the
		* handles themselves are drawn at a fixed screen size so they stay grabbable at any
		* zoom.
		*/
		function Handles(props) {
			const { mark, sizes, onPressHandle } = props;
			const { grip, hairline } = sizes;
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
					onPressHandle(mark, event, handle.id);
				}
			}) }, handle.id))] });
		}
		/**
		* The two end grips of a selected arrow.
		*
		* An arrow's controls are its ends: the line is the whole shape, and its tail and
		* tip are the only points that say where it is. It used to be framed like a box —
		* eight grips on the rectangle its ends span, plus a turn grip — which asked the
		* reader to stretch a line that has no width and put handles on four corners the
		* arrow never draws. The grips are drawn as circles rather than squares, so a grip
		* on a point of the line does not read as a corner of a box.
		*/
		function EndHandles(props) {
			const { mark, sizes, onPressHandle } = props;
			const { grip, hairline } = sizes;
			const half = grip / 2;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: endHandles(mark.points, mark.rotation ?? 0).map((handle) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("g", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
				"data-da-handle": handle.id,
				x: handle.point[0] - half,
				y: handle.point[1] - half,
				width: grip,
				height: grip,
				rx: half,
				fill: "#ffffff",
				stroke: "#4c8dff",
				strokeWidth: 1.5 * hairline,
				style: {
					pointerEvents: "all",
					cursor: cursorFor(handle.id)
				},
				onPointerDown: (event) => {
					onPressHandle(mark, event, handle.id);
				}
			}) }, handle.id)) });
		}
		/** One mark: its shape, its hit area, and whatever its selection asks for. */
		function MarkShape(props) {
			const { mark, isDraft, selectedId, numbers, unit, sizes, onPressMark, onEdit } = props;
			const shown = shownMark(mark, props.press);
			const path = markPathData(shown, unit);
			const selected = selectedId === mark.id;
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
				strokeWidth: 14 * unit,
				style: { pointerEvents: "all" },
				onPointerDown: (event) => {
					onPressMark(mark, event);
				},
				onDoubleClick: (event) => {
					event.stopPropagation();
					onEdit(mark.id);
				}
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("g", {
				"data-da-mark": mark.id,
				opacity: isDraft ? .75 : 1,
				children: [
					isPoint ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Pin, {
						mark: shown,
						unit,
						number: numbers.get(mark.id)
					}) : null,
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
								strokeWidth: 14 * unit,
								style: { pointerEvents: "stroke" },
								onPointerDown: (event) => {
									onPressMark(mark, event);
								},
								onDoubleClick: (event) => {
									event.stopPropagation();
									onEdit(mark.id);
								}
							})
						]
					}),
					hitArea,
					selected && !isDraft && isPoint ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(FixedFrame, {
						box: pointMarkBox(shown, unit),
						hairline: sizes.hairline
					}) : null,
					selected && !isDraft && mark.kind === "arrow" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(EndHandles, {
						mark: shown,
						sizes,
						onPressHandle: props.onPressHandle
					}) : null,
					selected && !isDraft && mark.kind !== "arrow" && !hasFixedExtent(mark.kind) ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Handles, {
						mark: shown,
						sizes,
						onPressHandle: props.onPressHandle
					}) : null
				]
			});
		}
		/**
		* Every mark, plus the one being drawn, inside the paper's origin offset.
		*
		* The offset belongs here rather than on the svg: the overlay *is* the paper, from
		* its own corner, and a mark dragged past the left edge has to land past the left
		* edge of the paper.
		* @param props - the frame to draw and the two press callbacks.
		* @returns the mark layer.
		*/
		function MarkLayer(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("g", {
				transform: `translate(${props.originX} ${props.originY})`,
				children: [props.marks.map((mark) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MarkShape, {
					...props,
					mark,
					isDraft: false
				}, mark.id)), props.draft === null ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MarkShape, {
					...props,
					mark: props.draft,
					isDraft: true
				}, props.draft.id)]
			});
		}
		//#endregion
		//#region src/client/Canvas.tsx
		/**
		* Draw the marks and collect pointer input.
		* @param props - figure geometry, marks, tool state, and callbacks.
		* @returns the overlay element.
		*/
		function Canvas(props) {
			const { width, height, marks, tool } = props;
			const [originX, originY] = props.origin ?? [0, 0];
			/**
			* Each mark's number, by id, counted inside the mark's own kind.
			*
			* A page's marks are drawn from a slice of the document's list, so the numbers come
			* from the document when it supplies them and from the slice's own count otherwise.
			* The document's map wins where both have the mark: a PDF page's pins have to
			* continue the document's numbering, not restart it.
			*/
			const numbers = new Map([...markOrdinals(marks), ...props.numbering ?? []]);
			const unit = figureUnit(props.figureSize?.width ?? width, props.figureSize?.height ?? height);
			const gesture = useCanvasGesture(props, {
				width,
				height,
				originX,
				originY
			});
			const { handlers } = gesture;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				className: "da-overlay",
				"data-da-overlay": "",
				width,
				height,
				viewBox: `0 0 ${width} ${height}`,
				"data-tool": tool,
				onPointerDownCapture: handlers.onPointerDownCapture,
				onPointerDown: handlers.onPointerDown,
				onPointerMove: handlers.onPointerMove,
				onPointerUp: handlers.onPointerUp,
				onPointerCancel: handlers.onPointerCancel,
				onPointerLeave: handlers.onPointerLeave,
				onDoubleClick: handlers.onDoubleClick,
				onClick: handlers.onClick,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MarkLayer, {
					marks,
					draft: gesture.draft,
					press: gesture.press,
					selectedId: props.selectedId,
					numbers,
					unit,
					sizes: gesture.sizes,
					originX,
					originY,
					onPressMark: handlers.onPressMark,
					onPressHandle: handlers.onPressHandle,
					onEdit: props.onEdit
				})
			});
		}
		//#endregion
		//#region src/shared/mark-summary.ts
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
		/** Round one figure coordinate for model-facing text. */
		function round(value) {
			return Math.round(value);
		}
		/**
		* The noun one kind of mark is called.
		*
		* The names are what the reader calls the shapes on the toolbar, not the names this
		* code uses: a box is a 矩形, not a "框选", because the thing on the picture is a
		* rectangle and the reader is being told which rectangle to look at.
		* @param kind - the mark's kind.
		* @param locale - language of the surrounding message.
		* @returns the noun, without the number that follows it.
		*/
		function kindName(kind, locale) {
			const zh = locale === "zh";
			switch (kind) {
				case "arrow": return zh ? "箭头" : "arrow";
				case "rect": return zh ? "矩形" : "box";
				case "ellipse": return zh ? "椭圆" : "ellipse";
				case "pen": return zh ? "手绘线" : "freehand stroke";
				case "point": return zh ? "单点" : "point";
				case "element": return zh ? "元素" : "element";
			}
		}
		/**
		* One mark's name: its kind and its number among marks of that kind.
		*
		* Chinese runs the two together ("箭头1"); English needs the space ("arrow 1"). The
		* number is the one the picture carries, so this is the phrase a reader can point at.
		* @param mark - the mark being named.
		* @param ordinal - its 1-based position among marks of its own kind.
		* @param locale - language of the surrounding message.
		* @returns the name as it is written at the start of the mark's line.
		*/
		function markName(mark, ordinal, locale) {
			const noun = kindName(mark.kind, locale);
			return locale === "zh" ? `${noun}${ordinal}` : `${noun} ${ordinal}`;
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
		/**
		* Describe one mark's geometry after its name, for the model-facing summary.
		*
		* The name has already said what the mark is, so this says only where: a leading
		* space keeps it a separate word when it survives, and an empty string keeps the
		* line readable when there is no geometry to add.
		* @param mark - the mark to describe.
		* @param locale - language of the surrounding message.
		* @returns the fragment that follows the mark's name, possibly empty.
		*/
		function describeGeometry(mark, locale) {
			const [first, second] = mark.points;
			const zh = locale === "zh";
			const turned = mark.rotation === void 0 || mark.rotation === 0 ? "" : zh ? `（旋转 ${Math.round(mark.rotation)}°）` : ` (rotated ${Math.round(mark.rotation)}°)`;
			switch (mark.kind) {
				case "arrow": return first !== void 0 && second !== void 0 ? ` (${round(first[0])},${round(first[1])}) → (${round(second[0])},${round(second[1])})${turned}` : turned;
				case "rect": return extents(first, second) + turned;
				case "ellipse": return extents(first, second) + turned;
				case "pen": return strokeExtents(mark.points) + turned;
				case "point": return first === void 0 ? "" : zh ? ` 位于 (${round(first[0])},${round(first[1])})` : ` at (${round(first[0])},${round(first[1])})`;
				case "element": return extents(first, second);
			}
		}
		/**
		* Longest element text that still reads as a name rather than a passage.
		*
		* The anchor carries whatever words the element holds, capped for the sidecar. On a
		* matplotlib SVG a group holds every label under it, so the text of the axes is the
		* tick values, both axis titles and the legend run together — twice the length of
		* the sentence it would push onto the mark's line. A name is a label ("导柱", "保存");
		* anything past this is a passage, and the selector or id already locates the element.
		*/
		const NAMEABLE_TEXT = 30;
		/**
		* Whether an anchor names the whole picture rather than something in it.
		*
		* A mark that lands on a figure's root element names the sheet itself, which the
		* message has already named in its header. On a matplotlib figure that anchor also
		* carries the concatenation of every label in the picture, so the line spends its
		* whole length saying "this figure" a second time. An `element` mark keeps its anchor
		* even then: there, the anchor *is* the mark, and the box is just where it sits.
		* @param anchor - the element the mark landed on.
		* @param figure - the figure's size, when the document knows it.
		* @returns true when the anchor covers essentially the whole figure.
		*/
		function namesThePicture(anchor, figure) {
			if (figure === void 0) return false;
			const { width, height } = figure;
			if (width === void 0 || height === void 0) return false;
			return anchor.bbox[2] >= width * .98 && anchor.bbox[3] >= height * .98;
		}
		/**
		* Describe what a mark points at, when the figure exposed an element.
		*
		* Only the names that still say something are kept. A selector that is the id with a
		* `#` in front is the same name twice, and element text long enough to be a paragraph
		* locates nothing the id did not already locate — both were printed on every line
		* because the fields existed, not because they helped.
		* @param mark - the mark whose anchor is described.
		* @param locale - language of the surrounding message.
		* @param figure - the figure's size, when the document knows it.
		* @returns the bracketed fragment, or nothing when the anchor adds no name.
		*/
		function describeAnchor(mark, locale, figure) {
			const anchor = mark.anchor;
			if (anchor === void 0) return "";
			if (mark.kind !== "element" && namesThePicture(anchor, figure)) return "";
			const zh = locale === "zh";
			const id = anchor.id ?? "";
			const text = anchor.text ?? "";
			const selector = anchor.selector ?? "";
			const parts = [];
			if (anchor.title !== void 0 && anchor.title !== "") parts.push(zh ? `元素标题「${anchor.title}」` : `element title "${anchor.title}"`);
			if (id !== "") parts.push(zh ? `元素 id=${id}` : `element id=${id}`);
			if (text !== "" && text.length <= NAMEABLE_TEXT) parts.push(zh ? `元素文字「${text}」` : `element text "${text}"`);
			if (selector !== "" && selector !== `#${id}`) parts.push(zh ? `选择器 ${selector}` : `selector ${selector}`);
			if (parts.length === 0) parts.push(`<${anchor.tag}>`);
			return zh ? `（${parts.join("，")}）` : ` (${parts.join(", ")})`;
		}
		/**
		* Render one mark as a numbered line the model reads.
		*
		* The number is the mark's number among marks of its kind, the same one the picture
		* draws on it. A mark carries one string — what should change here — and it is the
		* whole payload; the shape only says where. A mark that says nothing still names its
		* position, so the list stays complete and the agent can say which mark is mute.
		*
		* @param mark - the mark to describe.
		* @param ordinal - its 1-based position among marks of its own kind.
		* @param locale - language of the surrounding message.
		* @param figure - the figure these marks belong to, when its size is known; a mark
		*   that reaches past it then says so rather than leaving the sign to be noticed.
		* @returns one line of the annotation summary.
		*/
		function describeMark(mark, ordinal, locale, figure) {
			const zh = locale === "zh";
			const page = mark.page === void 0 ? "" : zh ? `第 ${mark.page} 页 ` : `page ${mark.page} `;
			const detail = flattenNote(mark.detail);
			const escape = figure === void 0 ? "" : overhang(mark, figure, locale);
			const parts = [`${page}${markName(mark, ordinal, locale)}${describeGeometry(mark, locale)}${describeAnchor(mark, locale, figure)}${escape}`];
			if (detail !== "") parts.push(zh ? `批注：${detail}` : `note: ${detail}`);
			if (detail === "") parts.push(zh ? "（未写说明）" : "(no detail)");
			return parts.join(zh ? "，" : ", ");
		}
		/**
		* One note, on one line.
		*
		* The list this feeds is read one mark per line, and the note is typed into a field
		* that accepts a Return — so a note in three lines became three lines of list, the
		* second and third without a marker. To the agent that is not "one mark, three
		* lines", it is "a mark, then two lines of something", and a mark the reader numbered
		* is answered twice or not at all. The line break is the reader's; the shape of the
		* list belongs to the message, so the break is folded here rather than refused at the
		* field — a wrapped note is still readable prose, a broken list is not.
		* @param detail - the note as the reader typed it, whitespace and newlines included.
		* @returns the note as one line, or an empty string when there is no note.
		*/
		function flattenNote(detail) {
			if (detail === void 0) return "";
			return detail.replace(/\s+/gu, " ").trim();
		}
		/**
		* Render every mark as the numbered list carried into the Session.
		* @param document - the saved annotation document.
		* @param locale - language of the surrounding message.
		* @returns one line per mark, in the document's own order.
		*/
		function describeMarks(document, locale) {
			const ordinals = markOrdinals(document.marks);
			return document.marks.map((mark) => {
				return describeMark(mark, ordinals.get(mark.id) ?? 0, locale, document.figure);
			});
		}
		//#endregion
		//#region src/client/annotation-message.ts
		/**
		* Compose the user message that carries one annotation.
		* @param document - the saved document.
		* @param paths - sidecar paths the Host wrote.
		* @param locale - message language.
		* @param attachment - whether the review artifact actually travels with the message.
		*   The paths say what the *Host wrote to disk*; whether the session accepted the file
		*   part is a different fact, known only once the attachment has been attempted. The
		*   message is composed after that attempt so its one sentence about the attachment can
		*   be true. Defaults to "it travelled", for the callers that build a message from paths
		*   alone.
		* @returns the message text.
		*/
		function buildAnnotationMessage(document, paths, locale, attachment = true) {
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
			const pictured = paths.reviewPath !== null && attachment;
			const attachmentLines = !pictured ? [] : [paged ? zh ? "带批注 PDF 已作为本条消息的附件发送，可直接在阅读器里核对。" : "The annotated PDF is attached to this message; you can check it in any reader." : zh ? "标注图已作为本条消息的附件发送。" : "The annotated image is attached to this message."];
			const noPicture = !pictured && !rendered && marks.length > 0 && !needsReviewImage(document) ? [zh ? "本条标注只有位置点，没有标注图：按上面逐条的坐标与说明处理原图即可。" : "These marks are points only, so no annotated image was made: work from the coordinates and notes above against the original figure."] : [];
			const summary = document.summary !== void 0 && document.summary.trim() !== "" ? [zh ? `目标：${document.summary.trim()}` : `goal: ${document.summary.trim()}`, ""] : [];
			const closer = rendered ? zh ? "逐条改 HTML 生成源。" : "Edit the HTML source, mark by mark." : paged ? zh ? "逐条处理该 PDF。" : "Work through the PDF, mark by mark." : zh ? "逐条改生成源。" : "Edit the generating source, mark by mark.";
			return [
				header,
				...attachmentLines,
				...noPicture,
				"",
				...summary,
				...describeMarks(document, locale),
				"",
				closer
			].join("\n");
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
			const existing = shell.snapshot.draft;
			const room = existing.trim() === "";
			shell.setDraft(room ? message : `${existing}\n\n${message}`);
		}
		//#endregion
		//#region src/client/spotlight.ts
		/**
		* The light an element mark — and the picker that places one — shines on the element.
		*
		* A corner bracket around an element's box says where the element is but not what it
		* is. On a curve, a tick, a legend entry or a label, the box is a rectangle the figure
		* never draws — it can cover half a plot. Lighting the element itself is the same
		* promise said in the figure's own shapes: the reader sees the curve glow, the glyphs
		* glow, the legend's own frame glow, and knows which of them is meant.
		*
		* The light is `filter: drop-shadow` on the element itself. A drop shadow follows the
		* alpha channel of whatever is painted, so one rule covers every kind of element — a
		* stroked path, filled text, a filled patch, a group of all three — without this
		* module knowing any of their geometry. Stroking the element instead would paint over
		* the artist's own colour, which is the one thing the reader is looking at.
		*
		* The same rule is what the *delivered* picture uses: {@link lightMarkup} writes it
		* into the review SVG, so the picture the agent reads is lit exactly the way the
		* reader's own panel lit it. `filter`, and the `var()` inside it, survive the figure
		* being serialized and then decoded as an image, which is the whole of the export
		* path — measured in a browser rather than assumed.
		*
		* The elements live in different documents depending on the figure: an inline SVG's
		* are inside the panel's own document, and a rendered document's are inside its frame.
		* Both are reached the same way — a root to search and the selector the anchor already
		* carries — so one function serves both, and the caller says only where to look.
		* @module dsh-figmark/client/spotlight
		*/
		/** The class the light hangs on, so it can be taken off without knowing what wore it. */
		const SPOT_CLASS = "da-spot";
		/** The class a lit element wears when it is also the selected mark. */
		const SPOT_SELECTED_CLASS = "da-spot-selected";
		/**
		* What a lit element looks like.
		*
		* Two shadows rather than one: a pale ring that separates the glow from whatever the
		* element sits on (over dark line work a blue glow alone vanishes into it), then the
		* blue itself. Both are drawn at a fixed size rather than following the figure's
		* stroke weight, because this is the panel talking, not the figure.
		*
		* Selected elements are lit harder rather than boxed. A dashed frame around the
		* element's box was what this used to draw, and it had exactly the failing the light
		* was introduced to fix: on a curve the frame is a rectangle the figure never draws.
		* The reader already knows which mark is selected — the comment pill opens on it and
		* the list row is highlighted — so the picture only has to say *brighter*.
		*/
		const SPOT_RULE = `.${SPOT_CLASS}{filter:drop-shadow(0 0 1.4px rgba(255,255,255,.95)) drop-shadow(0 0 3px rgba(76,141,255,.95))}.${SPOT_CLASS}.${SPOT_SELECTED_CLASS}{filter:drop-shadow(0 0 1.8px rgba(255,255,255,1)) drop-shadow(0 0 5px rgba(76,141,255,1))}`;
		/**
		* Find the element one selector names inside a root.
		*
		* A selector that does not parse, or that matches nothing, is not an error: the figure
		* may have been reloaded since the anchor was taken, and a figure with no light is
		* still a usable figure. `querySelector` itself throws on a broken selector, hence the
		* guard here rather than a `try` at every call site.
		*
		* @param target - the root to search and the selector to search for.
		* @returns the element, or `undefined` when nothing in the root answers that name.
		*/
		function elementAt(target) {
			try {
				return target.root.querySelector(target.selector) ?? void 0;
			} catch {
				return;
			}
		}
		/**
		* Find the elements a list of selectors names inside a root.
		*
		* The same forgiving read as {@link elementAt}, for the export pass: an element that
		* cannot be found contributes no light and the picture is still delivered.
		*
		* @param target - the root to search and the selectors to search for.
		* @returns whatever elements answered, in the order they were named.
		*/
		function elementsAt(target) {
			const found = [];
			for (const selector of target.selectors) {
				const element = elementAt({
					root: target.root,
					selector
				});
				if (element !== void 0 && !found.includes(element)) found.push(element);
			}
			return found;
		}
		/**
		* Put the light on the named elements and take it off every other one.
		*
		* The whole set is handed in rather than one element at a time: a placed mark's light
		* lasts as long as the mark does and the picker's preview comes and goes on top of it,
		* so only the caller knows the complete answer. An empty list puts every light out.
		*
		* The class is added and removed rather than a `style` written and unwritten: an
		* element's `style` attribute may belong to the figure's author, and editing it would
		* mean putting it back byte for byte. A class cannot be confused with anything the
		* author wrote.
		*
		* @param previous - the elements lit last time, if any.
		* @param next - the elements to light now.
		* @returns the elements lit now, to be handed back next time.
		*/
		function moveSpotlight(previous, next) {
			const keeps = new Set(next.map((spot) => spot.element));
			for (const spot of previous) {
				if (keeps.has(spot.element)) continue;
				spot.element.classList.remove(SPOT_CLASS, SPOT_SELECTED_CLASS);
			}
			for (const spot of next) {
				spot.element.classList.add(SPOT_CLASS);
				spot.element.classList.toggle(SPOT_SELECTED_CLASS, spot.selected);
			}
			return next;
		}
		/**
		* Add the light's rule to a document, once.
		*
		* A rendered document runs under a policy that forbids scripts and allows inline
		* styles, and it is its own document, so the panel's stylesheet cannot reach into it:
		* a `style` element in the figure's document is the only place a rule for it can be
		* written. Idempotent, because the light is asked for on every pointer move.
		*
		* @param document_ - the document the elements to light live in.
		*/
		function ensureSpotlight(document_) {
			if (document_.querySelector(`style[data-${SPOT_CLASS}]`) !== null) return;
			const style = document_.createElement("style");
			style.setAttribute(`data-${SPOT_CLASS}`, "");
			style.textContent = SPOT_RULE;
			const parent = document_.head ?? document_.documentElement;
			parent.insertBefore(style, parent.firstChild);
		}
		/**
		* Write the light into figure markup, for the picture the reader hands over.
		*
		* The review image is the figure's own SVG with the marks drawn on top of it, built as
		* one standalone document and then rasterized. An element mark's light has to be part
		* of that document, or the agent would be sent the bracket the reader just stopped
		* seeing: the light is a `filter` on the figure's own element, so it is written where
		* that element is, in this picture's copy of the figure.
		*
		* Nothing here restyles the reader's file. The markup handed in is already the
		* sanitized copy that was inlined into the panel, and the result is a string that only
		* ever becomes the exported image.
		*
		* @param markup - the figure's sanitized SVG source.
		* @param selectors - the elements to light, as their anchors name them.
		* @returns the same figure with the light written into it.
		*/
		function lightMarkup(markup, selectors) {
			if (selectors.length === 0) return markup;
			const parsed = new DOMParser().parseFromString(markup, "image/svg+xml");
			const root = parsed.documentElement;
			if (parsed.querySelector("parsererror") !== null || root.tagName.toLowerCase() !== "svg") return markup;
			const lit = elementsAt({
				root,
				selectors
			});
			if (lit.length === 0) return markup;
			for (const element of lit) element.classList.add(SPOT_CLASS);
			const style = parsed.createElementNS("http://www.w3.org/2000/svg", "style");
			style.textContent = SPOT_RULE;
			root.insertBefore(style, root.firstChild);
			return new XMLSerializer().serializeToString(root);
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
		* Composing the flattened review image.
		*
		* The reviewed picture is the figure plus every mark, built as one standalone SVG
		* (no external references, system fonts only) and rasterized through a canvas, so
		* the agent receives exactly the picture the user approved.
		* @module dsh-figmark/client/export
		*/
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
			const path = markPathData(mark, unit);
			const parts = [];
			if (path !== void 0) {
				const transform = markTransform(mark);
				const open = transform === void 0 ? "" : `<g transform="${transform}">`;
				parts.push(open, `<path d="${path}" fill="none" stroke="#ffffff" stroke-width="${strokeWidthOf(mark, unit) + 2.5 * unit}" stroke-linecap="round" stroke-linejoin="round"/>`, `<path d="${path}" fill="none" stroke="${mark.color}" stroke-width="${strokeWidthOf(mark, unit)}" stroke-linecap="round" stroke-linejoin="round"/>`, transform === void 0 ? "" : "</g>");
			}
			const pin = mark.kind === "point" ? pinPathData(mark, unit) : void 0;
			const centre = mark.kind === "point" ? pinNumberCentre(mark, unit) : void 0;
			if (pin !== void 0 && centre !== void 0) {
				parts.push(`<path d="${pin}" fill="#ffffff" stroke="#ffffff" stroke-width="${4.5 * unit}" stroke-linejoin="round"/>`, `<path d="${pin}" fill="${mark.color}" stroke="#ffffff" stroke-width="${1.5 * unit}" stroke-linejoin="round"/>`);
				if (number !== void 0) parts.push(`<text x="${centre[0]}" y="${centre[1]}" font-family="${PIN_FONT_FAMILY}" font-size="${pinFontSizeOf(unit)}" font-weight="700" fill="${PIN_NUMBER_COLOR}" text-anchor="middle" dominant-baseline="central">${number}</text>`);
			}
			return parts.join("");
		}
		/**
		* The figure layer as SVG elements.
		*
		* `lit` is the elements the review is about. An `element` mark draws nothing of its
		* own — it is the light on the element, and that light lives on the figure's own
		* markup, so it has to be written in here, where the figure is placed. The alternative
		* is a picture where the reader approved a glowing curve and the agent reads a
		* rectangle around it.
		*
		* @param layer - the figure to place.
		* @param lit - selectors of the elements to light, already resolved from the marks.
		* @returns the figure's elements.
		*/
		function figureSvg(layer, lit = []) {
			if (layer.kind === "raster") return `<image x="0" y="0" width="${layer.width}" height="${layer.height}" href="${layer.dataUrl}"/>`;
			const viewBox = layer.viewBox === void 0 ? "" : ` viewBox="${layer.viewBox}"`;
			const inner = lightMarkup(layer.markup, lit).replace(/^<\?xml[^>]*\?>\s*/u, "").replace(/^<svg[^>]*>/iu, "").replace(/<\/svg>\s*$/iu, "");
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
			const numbers = new Map([...markOrdinals(marks), ...numbering ?? []]);
			const unit = figureUnit(layer.width, layer.height);
			const paper = plotBounds(layer.width, layer.height, marks, unit);
			const shift = `translate(${-paper.x} ${-paper.y})`;
			const edge = paper.x !== 0 || paper.y !== 0 || paper.width !== layer.width || paper.height !== layer.height ? figureEdge(layer.width, layer.height, unit) : "";
			const lit = marks.flatMap((mark) => mark.kind === "element" && mark.anchor?.selector !== void 0 ? [mark.anchor.selector] : []);
			return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${paper.width}" height="${paper.height}" viewBox="0 0 ${paper.width} ${paper.height}"><rect x="0" y="0" width="${paper.width}" height="${paper.height}" fill="#ffffff"/><g transform="${shift}">` + figureSvg(layer, lit) + edge + marks.map((mark) => markSvg(mark, numbers.get(mark.id), unit)).join("") + "</g></svg>";
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
		/** Whether an element is an anonymous inline wrapper: it names no anchor of its own. */
		function isAnonymousWrapper(element) {
			return element.id === "" && WRAPPER_TAGS.includes(element.tagName.toLowerCase());
		}
		/**
		* Describe the element under one point of a rendered document.
		*
		* The browser answers which element covers the point, because only it knows the
		* painted geometry: a paragraph whose text stops halfway through its box covers only
		* that half, and a table cell covers its cell rather than the whole row. Measuring
		* boxes instead would name whichever box happened to be smallest, which on a
		* document is usually the innermost wrapper around the text rather than the block the
		* reader sees highlighted.
		*
		* Two elements are withheld from the answer. The document's own background covers the
		* whole rendered width, so naming it would mean "the page" for a click on blank paper
		* — a mark around everything says nothing about any part of it. And an anonymous
		* inline wrapper (`<span>`, `<b>`) names nothing a source reader can act on, so it is
		* only used when it is the last thing there is: text a document leaves directly in the
		* body has nothing else to name.
		*
		* @param document - the frame's document, or nothing when the frame is gone.
		* @param x - point x in figure pixels.
		* @param y - point y in figure pixels.
		* @returns the anchor, or undefined when the point names no element.
		*/
		function anchorInDocument(document, x, y) {
			const body = document?.body;
			if (body === null || body === void 0) return void 0;
			const frame = body.getBoundingClientRect();
			const stack = pickStack(document, x, y);
			if (stack === null) return measureInDocument(body, x, y);
			let wrapper;
			for (const element of stack) {
				if (!body.contains(element) || element === body) continue;
				if (isPaper(element, frame)) continue;
				if (isAnonymousWrapper(element)) {
					wrapper ??= element;
					continue;
				}
				return describeInDocument(element, body);
			}
			return wrapper === void 0 ? void 0 : describeInDocument(wrapper, body);
		}
		/**
		* The smallest box containing the point, for a document that cannot be asked.
		*
		* This is what answers when the engine has no hit testing — a document parsed by a
		* test double. The smallest containing box is the honest rule available there, but it
		* cannot tell that a paragraph's text stops halfway through its box, so the browser's
		* own answer is used whenever it exists and this never runs in the panel.
		*
		* The smallest box wins, ties going to the deeper element. An anonymous inline wrapper
		* does not count as a name — a mark on the `<b>` inside a heading points at that
		* heading — so wrappers are held back as a fallback for the one case they are all a
		* point has: text a document leaves directly in the body.
		* @param body - the document body the point is on.
		* @param x - point x in figure pixels.
		* @param y - point y in figure pixels.
		* @returns the element, or undefined when no box contains the point.
		*/
		function measureInDocument(body, x, y) {
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
			return described === void 0 ? void 0 : describeInDocument(described, body);
		}
		/**
		* One element of a rendered document, written as the anchor a mark carries.
		*
		* @param described - the element to name.
		* @param body - the document body the selector is rooted at.
		* @returns the anchor.
		*/
		function describeInDocument(described, body) {
			const rect = described.getBoundingClientRect();
			const text = anchorTextOf(described);
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
				async drained() {
					cancel();
					await chain;
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
		/** The menu's own padding, mirrored from the stylesheet. */
		const MENU_PADDING = 4;
		/** The gap between two rows, mirrored from the stylesheet. */
		const MENU_GAP = 1;
		/**
		* The box a menu of this many rows actually lays out as.
		*
		* The placement used to assume `rows * MENU_ROW` by `MENU_WIDTH`, which is neither
		* dimension the browser produces: the rows sit in a padded box with a gap between
		* them, so a seven-row menu measured 216 x 203 against an assumed 208 x 189. Fed a
		* box fourteen pixels too short, the clamp believed a menu fitted that did not, and
		* the last rows were painted past the window edge — still clickable, but never seen,
		* so the reader never learned they were there.
		*
		* The width is exact because the stylesheet gives the menu `box-sizing:border-box`;
		* the height is the content the rows occupy plus the padding and the gaps between
		* them (not after the last one).
		* @param rows - how many rows the menu offers.
		* @returns the box the menu occupies, in pixels.
		*/
		function menuSize(rows) {
			const count = Math.max(0, rows);
			const gaps = Math.max(0, count - 1) * MENU_GAP;
			return {
				width: 208,
				height: count * 27 + gaps + MENU_PADDING * 2
			};
		}
		/**
		* Where a keyboard move inside the menu lands.
		*
		* A `role="menu"` promises the menu pattern: arrows move between rows, Home and End
		* jump to the ends, and the list wraps rather than dead-ending. Without this the card
		* was a list of buttons a screen-reader user could hear but not walk — every row
		* reported `tabIndex: 0`, so Tab happened to visit them, but none of the keys a menu
		* announces did anything.
		*
		* Wrapping is the part that makes the ends reachable without a second thought: Down on
		* the last row goes to the first, which is what every menu does and what makes a
		* seven-row menu behave the same as a two-row one.
		* @param key - the key the reader pressed.
		* @param from - the index the menu is on, or -1 when it is on none.
		* @param count - how many rows there are.
		* @returns the index to move to, or null when the key is not a menu key.
		*/
		function menuStep(key, from, count) {
			if (count === 0) return null;
			if (key === "Home") return 0;
			if (key === "End") return count - 1;
			if (key === "ArrowDown") return from < 0 ? 0 : (from + 1) % count;
			if (key === "ArrowUp") return from < 0 ? count - 1 : (from - 1 + count) % count;
			return null;
		}
		/**
		* Keep a menu wholly inside the window.
		*
		* A right-click near the bottom edge would otherwise open rows below it, where
		* they cannot be reached; the same on the right. Both axes are clamped
		* independently, so a click in one corner only moves the menu as far as it has
		* to move.
		* @param at - the click, in viewport coordinates.
		* @param viewport - visible width and height.
		* @param size - the menu's own width and height.
		* @returns the viewport position to place the menu's top-left corner at.
		*/
		function clampMenu(at, viewport, size) {
			const rightmost = viewport.width - size.width - 8;
			const bottommost = viewport.height - size.height - 8;
			return {
				left: Math.max(8, Math.min(at.x, rightmost)),
				top: Math.max(8, Math.min(at.y, bottommost))
			};
		}
		/**
		* Read a path relative to the directory a Session runs in.
		*
		* The figure is usually somewhere under the workspace, which is what makes a
		* relative path worth copying at all — it survives the project being moved. A
		* figure outside the workspace, or a Session whose directory is unknown, has no
		* such path, and the menu leaves the row out rather than offering one that would
		* not resolve.
		* @param path - absolute path of the figure.
		* @param cwd - absolute workspace directory, or null when it is unknown.
		* @returns the relative path, or null when there is not one.
		*/
		function relativeTo(path, cwd) {
			if (cwd === null) return null;
			const prefix = `${cwd}${cwd.endsWith("/") || cwd.endsWith("\\") ? "" : "/"}`;
			if (!path.startsWith(prefix)) return null;
			const rest = path.slice(prefix.length);
			return rest === "" || rest.startsWith("..") ? null : rest;
		}
		/**
		* The rows this figure's menu should show.
		*
		* Three groups, in the order a reader wants them: the two Host gestures (only
		* where the Host has a desktop to perform them), then the two copies, then — for
		* a figure outside the workspace — no relative row at all, because there is no
		* path from the workspace to it.
		* @param options - what the Host can do, and whether a relative path exists.
		* @param labels - the four rows' words.
		* @returns the rows, in the order they are drawn.
		*/
		function figureMenuItems(options, labels) {
			const items = [];
			if (options.canSend) items.push({
				id: "sendToAgent",
				label: labels.sendToAgent
			}, {
				id: "sendToComposer",
				label: labels.sendToComposer
			});
			if (options.canOpen) items.push({
				id: "open",
				label: labels.open
			}, {
				id: "reveal",
				label: labels.reveal
			});
			if (options.hasImage) items.push({
				id: "copyImage",
				label: labels.copyImage
			});
			if (options.hasRelative) items.push({
				id: "copyRelative",
				label: labels.copyRelative
			});
			items.push({
				id: "copyAbsolute",
				label: labels.copyAbsolute
			});
			return items;
		}
		/**
		* Whether a pointer press landed inside the menu.
		*
		* A menu closes when the reader presses anywhere else, and "anywhere else" has to
		* be answered without knowing what was pressed: the event's composed path is the
		* one list that names every element between the target and the window, including
		* ones inside a shadow root.
		* @param event - the press.
		* @param panel - the menu element, or null before it has been attached.
		* @returns true when the press belongs to the menu itself.
		*/
		function pressedInsideMenu(event, panel) {
			return panel !== null && event.composedPath().includes(panel);
		}
		/**
		* The text one copy row puts on the clipboard.
		* @param action - the row that was picked.
		* @param path - absolute path of the figure.
		* @param workspace - absolute workspace directory, or null when it is unknown.
		* @returns the text to copy, or null when the relative row has nothing to copy.
		*/
		function copiedText(action, path, workspace) {
			return action === "copyRelative" ? relativeTo(path, workspace) : path;
		}
		//#endregion
		//#region src/client/host-actions.ts
		/**
		* Whether the Host can open paths at all.
		*
		* A remote Session has no desktop, and asking it to open a file would fail on
		* every row. Answering once at mount keeps the menu from offering gestures the
		* Session cannot perform; a failed probe reads as "no", which loses only the
		* rows, never a working one.
		* @param remote - the injected service, if the composition has one.
		* @returns whether the menu may offer open and reveal.
		*/
		async function desktopAvailable(remote) {
			if (remote === void 0) return false;
			try {
				const result = await remote.session.canOpenWorkspacePath();
				return result.ok && result.value === true;
			} catch {
				return false;
			}
		}
		/**
		* Open one path in its default application.
		* @param remote - the injected service.
		* @param path - absolute path on the Host.
		* @returns whether the Host accepted it.
		*/
		async function openOnDesktop(remote, path) {
			if (remote === void 0) return false;
			try {
				return (await remote.session.openWorkspacePath({ path })).ok;
			} catch {
				return false;
			}
		}
		/**
		* Reveal one path in the Host's file manager.
		* @param remote - the injected service.
		* @param path - absolute path on the Host.
		* @returns whether the Host accepted it.
		*/
		async function revealOnDesktop(remote, path) {
			if (remote === void 0) return false;
			try {
				return (await remote.session.openWorkspacePath({
					path,
					action: "reveal"
				})).ok;
			} catch {
				return false;
			}
		}
		/**
		* Put a picture on the clipboard.
		*
		* The async Clipboard API only accepts a PNG, and only from a user gesture — both
		* of which a menu row is. A browser without it (or a document that refuses the
		* write) is reported as a refusal rather than thrown, because the caller's next
		* move is the same either way: tell the reader it did not work.
		* @param bytes - the PNG the menu composed.
		* @returns whether the clipboard took it.
		*/
		async function copyImageToClipboard(bytes) {
			try {
				const clipboard = navigator.clipboard;
				if (clipboard === void 0 || typeof clipboard.write !== "function") return false;
				await clipboard.write([new ClipboardItem({ "image/png": bytes })]);
				return true;
			} catch {
				return false;
			}
		}
		//#endregion
		//#region src/shared/base64.ts
		/**
		* Base64 for the two directions the plugin needs it.
		*
		* The Host's routes carry bytes inside JSON, and the session prompt carries PNG
		* bytes as a data part, so both halves encode the same way: `btoa` over chunks
		* small enough that spreading a large artifact cannot overflow the argument
		* list. The encoder lives here because a second copy is how the chunk size and
		* the argument-spread limit end up disagreeing.
		* @module dsh-figmark/shared/base64
		*/
		/** Characters one `fromCharCode` call may see; well under the engine's limit. */
		const CHUNK = 32768;
		/**
		* Encode bytes as base64.
		* @param source - bytes, or the blob an export produced.
		* @returns base64 text.
		*/
		async function toBase64(source) {
			const bytes = source instanceof Uint8Array ? source : new Uint8Array(await source.arrayBuffer());
			let binary = "";
			for (let offset = 0; offset < bytes.length; offset += CHUNK) binary += String.fromCharCode(...bytes.subarray(offset, offset + CHUNK));
			return btoa(binary);
		}
		//#endregion
		//#region src/shared/http.ts
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
				annotation: body.annotation ?? null,
				unreadable: body.unreadable ?? [],
				workspace: body.figure.workspace ?? null
			};
		}
		/**
		* Largest request a `keepalive` fetch may carry, in UTF-8 bytes.
		*
		* The browser silently refuses anything above this, and a refused save is worse than a
		* normal one: the caller believes the draft was written when it was not. The budget is
		* counted in **bytes**, not in string length: Chrome shares 65536 bytes across every
		* in-flight keepalive request and counts the method, URL and headers against the same
		* budget, so the raw body has to stay well under it. `String.prototype.length` counts
		* UTF-16 code units, which disagree with bytes by up to a factor of three on non-ASCII
		* text — a body of 30 000 `图` characters is 30 000 units and 90 000 bytes, so a limit
		* read against `.length` passes a request the browser then refuses outright.
		*/
		const KEEPALIVE_LIMIT = 6e4;
		/**
		* How many bytes a string is once encoded as UTF-8.
		*
		* `TextEncoder` is the browser's own answer, so this cannot drift from what `fetch`
		* will actually send. Counting `.length` is the mistake this exists to avoid.
		* @param text - the payload about to be sent.
		* @returns its size in bytes.
		*/
		function utf8Length(text) {
			return new TextEncoder().encode(text).byteLength;
		}
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
			const paged = isPagedMediaType(document.figure.mediaType);
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
				...keepalive && utf8Length(payload) <= KEEPALIVE_LIMIT ? { keepalive: true } : {}
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
		/** A difference that never changes, for a body that has no edit yet. */
		const EMPTY_DIFF = {
			hunks: [],
			added: 0,
			removed: 0,
			changed: false,
			coarse: false
		};
		/** The marker a diff puts after a line that the file does not terminate. */
		const NO_NEWLINE = "\\ No newline at end of file";
		/** The character a line carries in unified-diff text. */
		const SIGNS$1 = {
			context: " ",
			add: "+",
			remove: "-"
		};
		/**
		* Split text into lines, dropping exactly one trailing newline.
		*
		* A line ends at `\n` or at `\r\n`: the terminator is a property of the file that was
		* read, not part of the line's text. This matters because the two sides of a diff come
		* from different places — the baseline is what `readFile` returned, which keeps whatever
		* the file had, and the edited side is a `<textarea>`'s value, which normalises CRLF to
		* LF on the way in. Splitting on `\n` alone left the `\r` attached to every baseline
		* line, so a Windows-authored file read as "every line changed" the first time the
		* reader typed a character into it.
		* @param text - the text to split.
		* @returns its lines; empty for an empty text.
		*/
		function textLines(text) {
			if (text === "") return [];
			return (text.endsWith("\n") ? text.slice(0, text.endsWith("\r\n") ? -2 : -1) : text).split(/\r?\n/u);
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
		* The edit script for one middle block, exact where the budget allows it.
		*
		* Falling back to one replacement of the whole middle is what made a two-line edit
		* to a thousand-line file cost twenty thousand bytes: with the changes near the first
		* and last line there is no common prefix or suffix to cut, so the whole document is
		* the middle, the table does not fit, and the fallback replaced all of it. One line
		* past the budget cost sixty-eight times the bytes, and the growth was linear in the
		* file after that. `fitDiff` cannot help, because one hunk is one hunk: the first is
		* always kept, `hidden` is zero, and no copy of the edited file is attached — so the
		* message said "改动 1 处" and carried the document.
		*
		* A line that appears exactly once on each side of a middle is a line that cannot be
		* part of an ambiguous match, so it is a safe place to cut: the diff of the block
		* before it, the anchor as context, then the diff of the block after. Both halves are
		* usually inside the budget even when the whole is not, and what the agent reads is
		* the two lines that actually changed plus their context.
		* @param older - older lines of the middle.
		* @param newer - newer lines of the middle.
		* @param maxCells - largest exact table the caller allows.
		* @returns the script, and whether it is coarse anywhere.
		*/
		function scriptFor(older, newer, maxCells) {
			const exact = exactOps(older, newer, maxCells);
			if (exact !== void 0) return {
				ops: exact,
				coarse: false
			};
			const anchors = anchorPairs(older, newer);
			if (anchors.length === 0) return {
				ops: [...older.map((text) => ({
					kind: "remove",
					text
				})), ...newer.map((text) => ({
					kind: "add",
					text
				}))],
				coarse: true
			};
			const ops = [];
			let coarse = false;
			let oldAt = 0;
			let newAt = 0;
			for (const anchor of anchors) {
				const head = scriptFor(older.slice(oldAt, anchor.old), newer.slice(newAt, anchor.new), maxCells);
				ops.push(...head.ops);
				coarse = coarse || head.coarse;
				ops.push({
					kind: "equal",
					text: anchor.text
				});
				oldAt = anchor.old + 1;
				newAt = anchor.new + 1;
			}
			const tail = scriptFor(older.slice(oldAt), newer.slice(newAt), maxCells);
			ops.push(...tail.ops);
			return {
				ops,
				coarse: coarse || tail.coarse
			};
		}
		/**
		* The lines to cut a too-large middle on, in document order.
		*
		* Only lines that appear exactly once in each middle qualify: a line that repeats has
		* no single place it belongs, and cutting on one would attribute the change to the
		* wrong copy of it. The candidates are walked in older-side order and kept only while
		* the newer-side position also rises, which is the longest in-order run of anchors —
		* the same idea as patience diff, and enough to turn "the whole file changed" into the
		* two lines that did.
		* @param older - older lines of the middle.
		* @param newer - newer lines of the middle.
		* @returns the anchors, in document order.
		*/
		function anchorPairs(older, newer) {
			const inOlder = /* @__PURE__ */ new Map();
			for (const text of older) inOlder.set(text, (inOlder.get(text) ?? 0) + 1);
			const inNewer = /* @__PURE__ */ new Map();
			for (const text of newer) inNewer.set(text, (inNewer.get(text) ?? 0) + 1);
			const onNewer = /* @__PURE__ */ new Map();
			newer.forEach((text, index) => {
				if (inNewer.get(text) === 1) onNewer.set(text, index);
			});
			const anchors = [];
			let lastNew = -1;
			older.forEach((text, index) => {
				if (inOlder.get(text) !== 1) return;
				const at = onNewer.get(text);
				if (at === void 0 || at <= lastNew) return;
				anchors.push({
					old: index,
					new: at,
					text
				});
				lastNew = at;
			});
			return anchors;
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
			const script = scriptFor(older.slice(prefix, older.length - suffix), newer.slice(prefix, newer.length - suffix), maxCells);
			const ops = script.ops;
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
			const hunks = groupHunks(lines, context);
			const terminator = hunks.length === 0 ? endedWithoutNewline(before, after, older, newer, context) : null;
			return {
				hunks: terminator === null ? hunks : [terminator],
				added: terminator === null ? lines.filter((line) => line.kind === "add").length : 1,
				removed: terminator === null ? lines.filter((line) => line.kind === "remove").length : 1,
				changed: true,
				coarse: script.coarse
			};
		}
		/**
		* The hunk for a file that differs only in its final newline, or null when the two
		* sides differ in something the line lists would have shown.
		*
		* Reached only when the line lists are equal and the texts are not, which is exactly
		* the final-newline case. The last line is removed and added again — the same text on
		* both sides — because that is how unified diff carries a terminator: the marker after
		* the line that lacks it says which side is missing it.
		* @param before - the older text, as the reader had it.
		* @param after - the newer text.
		* @param older - the older side's lines.
		* @param newer - the newer side's lines.
		* @param context - unchanged lines to keep above the change.
		* @returns the one hunk, or null when there is no last line to speak of.
		*/
		function endedWithoutNewline(before, after, older, newer, context) {
			const count = older.length;
			/* v8 ignore next -- unreachable: see above. */
			if (count === 0) return null;
			const last = count - 1;
			const first = Math.max(0, last - context);
			const lines = [];
			for (let index = first; index < last; index += 1) lines.push({
				kind: "context",
				text: lineAt(older, index),
				oldLine: index + 1,
				newLine: index + 1
			});
			const olderKept = endsWithNewline(before);
			const newerKept = endsWithNewline(after);
			lines.push({
				kind: "remove",
				text: lineAt(older, last),
				oldLine: count,
				...olderKept ? {} : { noNewline: true }
			});
			lines.push({
				kind: "add",
				text: lineAt(newer, last),
				newLine: count,
				...newerKept ? {} : { noNewline: true }
			});
			const kept = last - first;
			return {
				oldStart: first + 1,
				oldCount: kept + 1,
				newStart: first + 1,
				newCount: kept + 1,
				lines
			};
		}
		/**
		* Whether a text ends with a line terminator.
		*
		* The one thing {@link textLines} throws away, and the only difference two texts can
		* have while producing the same lines.
		* @param text - the text to look at.
		* @returns whether its last line is terminated.
		*/
		function endsWithNewline(text) {
			return text.endsWith("\n");
		}
		/**
		* One hunk's identity, as a value that changes when the hunk does.
		*
		* Notes are filed against a hunk, and the hunk's first context line is not its
		* identity: five different single-hunk changes to the same neighbourhood all report
		* the same `oldStart`, so one note was reproduced beside each of them — and a note
		* written about a change that then moved stayed keyed to a hunk that no longer
		* existed, so it was sent anchored to a line nobody had touched. Both counts and both
		* starts together do change when the hunk changes.
		* @param hunk - the hunk to name.
		* @returns the key a note is filed under.
		*/
		function hunkKey(hunk) {
			return `${hunk.oldStart},${hunk.oldCount},${hunk.newStart},${hunk.newCount}`;
		}
		/**
		* Locate the change inside one hunk.
		*
		* `oldStart` is the hunk's first line *including context*, which with three lines of
		* context is up to three lines before the edit — so a note on a change at line 9 was
		* labelled "第 6 行". This walks to the first line that actually differs and reports
		* that, and for a pure insertion it reports the line the new text follows, because a
		* line that does not exist in the older file has no number there.
		* @param hunk - the hunk to read.
		* @returns where the change is.
		*/
		function hunkChange(hunk) {
			let lastOld = 0;
			for (const line of hunk.lines) {
				if (line.kind === "context") {
					if (line.oldLine !== void 0) lastOld = line.oldLine;
					continue;
				}
				if (line.kind === "remove") return {
					kind: "replace",
					at: line.oldLine ?? lastOld + 1,
					count: countRemoved(hunk)
				};
				return {
					kind: "insert",
					at: Math.max(lastOld, 1),
					count: 0
				};
			}
			return {
				kind: "insert",
				at: Math.max(lastOld, 1),
				count: 0
			};
		}
		/** How many older lines one hunk takes away. */
		function countRemoved(hunk) {
			return hunk.lines.filter((line) => line.kind === "remove").length;
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
				for (const line of hunk.lines) {
					lines.push(`${SIGNS$1[line.kind]}${line.text}`);
					if (line.noNewline === true) lines.push(NO_NEWLINE);
				}
			}
			return lines.join("\n");
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
			for (const hunk of diff.hunks) {
				const text = notes[hunkKey(hunk)];
				if (text === void 0 || text.trim() === "") continue;
				const at = locate(zh, hunk);
				lines.push(zh ? `${lines.length + 1}. ${at}：${text.trim()}` : `${lines.length + 1}. ${at}: ${text.trim()}`);
			}
			return lines;
		}
		/**
		* Say where one hunk's change is, in the reader's language.
		*
		* The number names the line the change happens on, not the hunk's first context line:
		* a note on a change at line 9 used to read "第 6 行", because three lines of context
		* put the hunk's start three lines early. An insertion names the line it follows,
		* because a line that does not exist in the older file has no number there.
		* @param zh - whether to write Chinese.
		* @param hunk - the hunk being described.
		* @param header - the hunk's `@@` header, in parentheses.
		* @returns the clause naming the change.
		*/
		function locate(zh, hunk) {
			const change = hunkChange(hunk);
			if (zh) {
				const header = `（${formatHunkHeader(hunk)}）`;
				return change.kind === "insert" ? `第 ${change.at} 行之后${header}` : `第 ${change.at} 行${header}`;
			}
			const header = ` (${formatHunkHeader(hunk)})`;
			return change.kind === "insert" ? `after line ${change.at}${header}` : `line ${change.at}${header}`;
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
				warnings.push(input.attached ? zh ? `另有 ${fitted.hidden} 处改动未在本消息里展开，完整结果见随本消息发送的 ${name}。` : `${fitted.hidden} more hunks are not expanded here; the complete result is attached as ${name}.` : zh ? `另有 ${fitted.hidden} 处改动未展开，本消息也未能附上 ${name}：请按上面这段 diff 处理，未展开的改动需要我另行提供。` : `${fitted.hidden} more hunks are not expanded here, and ${name} could not be attached: work from the diff above; I will have to supply the rest another way.`);
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
		* Encode one PNG blob as base64 for the prompt's image part.
		*
		* Delegates to the shared encoder: the review artifact travelling to the Host and
		* the page image travelling to the model are the same bytes-to-text problem, and
		* a second chunk loop here is a second place its chunk size can drift.
		*
		* @param blob - PNG bytes.
		* @returns base64 text.
		*/
		async function encodePng(blob) {
			return await toBase64(blob);
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
				return false;
			}
			if (input.session?.address !== void 0) {
				input.warnings.push(zh ? `当前会话是子会话，不接受文件附件，${noun.zh}未随消息发送。` : `This session is a subagent continuation and takes no file attachments, so the ${noun.en} was not attached.`);
				return false;
			}
			try {
				const uploaded = await fileUpload.upload(input.sessionId, input.attachment.bytes, input.attachment.name);
				if (!uploaded.ok) throw new Error(uploaded.error.message ?? "the upload was refused");
				input.content.push({
					type: "file",
					attachment: uploaded.value.file
				});
				return true;
			} catch (error) {
				const reason = error instanceof Error ? error.message : String(error);
				input.warnings.push(zh ? `${noun.zh}未能随消息发送：${reason}` : `The ${noun.en} was not attached: ${reason}`);
				return false;
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
			const name = input.paths.reviewPath === null ? `${baseNameOf(input.document.figure.path)}.annotated.pdf` : baseNameOf(input.paths.reviewPath);
			return await attachFile({
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
			const pdfAttached = input.annotatedPdf === void 0 || await attachAnnotatedPdf(input, session, content, warnings);
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
				warnings.push(pdfAttached ? zh ? `另有 ${hidden} 页标注未附图，请看带批注 PDF。` : `${hidden} more annotated pages are not attached as images; see the annotated PDF.` : zh ? `另有 ${hidden} 页标注未附图，带批注 PDF 也未能随消息发送：这些页的标注只有位置与说明，请按上面的描述在原文档上处理。` : `${hidden} more annotated pages are not attached as images, and neither is the annotated PDF: their marks travel only as the positions and notes above — work on the original document from those.`);
			}
			content.push({
				type: "text",
				text: buildAnnotationMessage(input.document, input.paths, input.locale, pdfAttached)
			});
			await promptSession(input.sessions, input.sessionId, session, content, "the session refused the annotation message");
			return warnings;
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
			let attached = false;
			if (fitted.hidden > 0) attached = await attachFile({
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
					attached,
					locale: input.locale
				})
			});
			await promptSession(input.sessions, input.sessionId, session, content, "the session refused the edit message");
			return warnings;
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
/* Text that is quiet but still text. The shell's tertiary token is tuned for labels a
   reader glances at; at the 10-12px this panel sets its metadata in it measured 3.34
   against the panel's own background in the light theme — under the 4.5 WCAG AA asks
   of text this size — while the same token in the dark theme measured 4.97. So the
   readable-by-default theme was the only one that failed. This pair is measured
   against the panel's own document-preview background in both: 4.55 light, 5.6 dark. */
.da-root{--da-quiet:#6b6f75}
body[data-ds-dark-theme] .da-root{--da-quiet:#9aa0a8}

/* Every small picture in the panel is one stroke set, declared once: without this
   an svg with no fill of its own falls back to a solid black shape, which is what
   turned the dock and the cards into blobs of ink. */
/* Every icon is drawn on one 24-unit grid, and every one of them is asked to
   *render* at the same thickness — 1.2px — so the row reads as one set. On a single
   grid that still means one stroke-width per drawn size, because the number is in
   the icon's own units: 1.2 x 24 / size. The sizes differ only because the buttons
   holding them do; the weight does not. */
.da-ico{width:16px;height:16px;flex:0 0 auto;fill:none;stroke:currentColor;
  stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.da-tool-icon svg{fill:none;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round}

/* --- the floating tool palette ------------------------------------------- */
/* One layer above the bar, and that ordering is the whole point: both strips can be
   dragged to the same corner, and at equal stacking the one rendered later wins — the
   bar. The palette's only handle is its grip, so a palette parked under the bar could
   never be dragged out again, and the reader's recovery was a reload. A strip that can
   be moved must be the one that stays reachable. */
/* The tools float over the figure in a dark rounded pill so they can be parked
   off whichever corner the reader is working on. Dark rather than light: it sits
   on top of a white figure and a white panel, and a dark chip is what reads as
   "this is a control" instead of as one more piece of the picture. */
.da-palette{position:absolute;z-index:9;display:flex;flex-direction:column;align-items:center;gap:2px;
  padding:6px 5px;border-radius:16px;background:var(--dsw-alias-bg-inverse,#2d2d2d);color:#fff;
  box-shadow:0 8px 26px rgba(10,14,24,.3),0 0 0 1px rgba(255,255,255,.08);
  /* The panel clips whatever reaches past it, and the palette is positioned outside
     the one child that scrolls, so a strip taller than the panel would leave its last
     tools painted outside the clip — unclickable, and no scroll to reach them. The
     height it is given is the room on the side it grows towards (placementStyle in
     annotator/placement.ts); this turns that bound into reachable tiles, not a cut. */
  overflow-y:auto;scrollbar-width:thin;box-sizing:border-box}
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
  background:transparent;color:#fff;gap:0;flex:0 0 auto}
.da-palette .da-tool:hover{background:rgba(255,255,255,.14)}
/* The armed tool is a grey chip, not the accent blue: the palette is the reader's
   controls, and a headlight-blue disc on it competed with the marks on the figure for
   the one thing colour means in this panel. Grey still says "this one", quietly. */
.da-palette .da-tool[aria-pressed="true"]{background:rgba(255,255,255,.22);color:#fff}
.da-palette .da-tool .da-tool-icon{height:auto}
.da-palette .da-tool .da-tool-icon svg{width:17px;height:17px;stroke-width:1.7}

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
  --da-track-inset:10px;--da-knob-size:11px;--da-rail-width:7px;
  display:flex;align-items:center;justify-content:center;width:var(--da-rail-width);height:200px;
  border-radius:999px;background:var(--dsw-alias-border-l2,rgba(127,127,127,.22));
  cursor:ns-resize;transition:width .16s ease,background .16s ease,box-shadow .16s ease}
.da-weight:hover,.da-weight:focus-within{--da-rail-width:30px;background:var(--dsw-alias-bg-layer-2,#fff);
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
/* The browser's own range, rotated upright and made transparent. It spans the rail so
   a press anywhere on it lands on the slider — including on the knob, which is why
   the knob is pointer-transparent.
   Its horizontal extent is the rail's own width, not a fixed 30px. Rotated a quarter
   turn, the input's height is what reaches sideways, so a fixed 30px made an invisible
   fourteen-pixel-wide strip of control stick out past a seven-pixel rail — over the
   paper, in the state a reader draws in, where a press that was meant to start a mark
   moved the stroke weight instead. */
.da-weight-input{position:absolute;left:50%;top:50%;width:200px;height:var(--da-rail-width);margin:0;opacity:0;
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
/* A bar standing in for the page body's own: it is placed by the pane rather than
   dragged, because there is no page yet to park it over. */
.da-bar[data-static="true"]{bottom:8px}
.da-bar[data-dragging="true"]{opacity:.94;box-shadow:0 12px 32px rgba(10,14,24,.4),0 0 0 1px rgba(255,255,255,.14)}
.da-bar[data-dragging="true"] *{cursor:move !important}
/* The bar's buttons are white glyphs on the dark strip. The one filled control is
   still the way out. */
.da-bar .da-dock-btn{color:#fff}
.da-bar .da-dock-btn:hover{background:rgba(255,255,255,.14)}
.da-bar .da-dock-btn[aria-pressed="true"]{background:var(--da-accent,#176df2);color:#fff}
.da-bar .da-dock-sep{background:rgba(255,255,255,.22)}
.da-bar .da-dock-dot{background:#4c8dff}
.da-bar .da-dock-count{background:var(--da-accent,#176df2);color:#fff}
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
.da-btn svg{width:15px;height:15px;flex:0 0 auto;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
/* A quiet button has no frame at all until the pointer is on it: it is an action,
   not a thing, and the row it sits in is already framed. */
.da-btn-quiet{border-color:transparent;background:transparent;height:24px;padding:0 7px;font-size:11px;color:var(--dsw-alias-label-secondary,inherit)}

/* A tool is a tile: a picture of the shape it draws, with its word underneath.
   Six of them fit in one row this way, where six inline words did not — and the
   picture is what a reader who has used the tool once recognizes without reading. */
/* The tile itself is styled once, in the palette block above, because that is the
   only place a tile is ever rendered. A second block here described a 40x34 tile with
   a word under the picture; every one of its declarations lost to the palette's more
   specific selectors, so the panel has been drawing 32x32 circles the whole time and
   this block only ever served to tell a reader the wrong thing. */
.da-tool .da-tool-icon{display:flex;align-items:center;justify-content:center;height:14px}
.da-tool[aria-pressed="true"] .da-tool-label{color:var(--da-accent,currentColor);font-weight:600}
.da-tool[aria-pressed="true"] svg{stroke-width:2.4}
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
   reader knows the gesture took, without moving the picture first. Every descendant
   too, and not just the stage, because the overlay covers the figure and would
   otherwise keep saying what it said before the press. */
.da-stage[data-panning="true"],.da-stage[data-panning="true"] *{cursor:grabbing !important}
/* The rendered document takes the figure's place; the overlay above it owns every
   pointer event, which is also what keeps a link inside it from navigating. */
.da-html{display:block;border:0;background:#fff;pointer-events:none}
.da-overlay{position:absolute;touch-action:none}
.da-overlay[data-tool="select"]{cursor:inherit}
.da-overlay:not([data-tool="select"]):not([data-tool="element"]){cursor:crosshair}
.da-overlay[data-tool="element"]{cursor:pointer}
/* The element a click would take, or already names, lit in its own shape rather than
   boxed. A drop shadow follows whatever the element paints — a stroked curve, filled
   glyphs, a patch — so one rule lights every kind of artist the figure can hold. The
   rule itself is written by spotlight.ts and injected from there, because the same
   text has to go into a rendered document's own stylesheet and into the exported
   picture; keeping a second copy here would be a third place for it to drift.
*/
.da-page{font-size:12px;min-width:44px;text-align:center;color:var(--dsw-alias-label-secondary,inherit)}
/* The document's toolbar sits above the page body, so the pane is one column of
   definite height and the body takes what is left of it. */
.da-pdf{position:relative;display:flex;flex-direction:column;height:100%;min-height:0}
.da-pdf>.da-root{flex:1 1 auto;height:auto;min-height:0}
/* A document's toolbar is a row of decisions above the page: paging on the left,
   what the document holds and the hand-off on the right. It is fixed height and
   never scrolls with the page, so the controls keep where the hand left them. */
.da-toolbar{display:flex;align-items:center;gap:6px;flex:0 0 auto;
  padding:6px 10px;border-bottom:0.5px solid var(--dsw-alias-border-l3,currentColor)}

/* The PDF's own strip. It is the same object as the figure's bottom bar — a dark
   rounded card floating over the page — because a reader who has marked a figure
   and then opens a document should not have to learn a second set of controls in
   a second visual language. Everything the page is read with lives on it: where you
   are, how you move, how it flows, and the way out. */
/* Paging is one decision, so its three controls sit closer together than the bar's
   own gap and read as a single reader rather than three buttons. It lives on the
   page body's bar, which the pane owns — not in a strip of its own. */
.da-docbar-group{display:flex;align-items:center;gap:1px;flex:0 0 auto}
/* The page number is the one control the reader reads rather than presses, so it
   gets a fixed slot: a number that shifts the buttons as it goes 9 to 100 is a
   toolbar that moves under the pointer. Not a tinted pill — the inverted strip is
   already the ground, and a second ground inside it reads as a button. */
/* The page number reads as a caption on the dark card, not as a button: no ground of
   its own, no frame, just the digits. It is still pressable — pressing is how the
   reader jumps — but a chip inside a chip is two grounds for one control, and the
   white box read as a hole punched in the bar. */
.da-bar button.da-page{display:inline-flex;align-items:center;justify-content:center;
  min-width:50px;height:28px;padding:0 4px;border:0;border-radius:8px;
  appearance:none;-webkit-appearance:none;
  background:transparent;box-shadow:none;color:#fff;cursor:pointer;
  font:inherit;font-size:12.5px;font-variant-numeric:tabular-nums}
.da-bar button.da-page:hover{background:rgba(255,255,255,.14)}
.da-bar button.da-page:focus-visible{outline:2px solid var(--da-accent,#176df2);outline-offset:1px}

.da-bar .da-dock-sep{background:rgba(255,255,255,.22)}
.da-bar .da-ico{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:1.9;
  stroke-linecap:round;stroke-linejoin:round}
/* What the document holds, said quietly: the strip's subject is the page, and the
   count is a caption on it rather than another control. */
.da-bar .da-docbar-count{flex:0 0 auto;margin-left:6px;font-size:11.5px;
  color:rgba(255,255,255,.62);font-variant-numeric:tabular-nums;white-space:nowrap}
/* The hand-off's note, only shown when there is nothing to hand over. */
.da-bar .da-docbar-note{flex:0 0 auto;margin-right:2px;font-size:11.5px;color:rgba(255,255,255,.5)}
/* The page number is the one control the reader reads rather than presses, so it
   gets a fixed slot: a number that shifts the buttons as it goes 9 → 10 → 100 is a
   toolbar that moves under the pointer. */
/* The hand-off sits under the page it describes, right-aligned and on its own
   ground, so it is not reachable by a stray press on the page controls. */
.da-send{display:flex;align-items:center;justify-content:flex-end;gap:6px;flex:0 0 auto;
  padding:6px 10px;border-top:0.5px solid var(--dsw-alias-border-l3,currentColor)}
/* The page a reader types into, to jump. Sized to the widest page count a document
   can plausibly have, so the slot does not resize as the number grows. */
.da-page-input{width:52px;height:28px;padding:0 6px;border:0.5px solid rgba(255,255,255,.35);
  border-radius:8px;background:rgba(255,255,255,.12);color:#fff;
  font:inherit;font-size:12.5px;line-height:1;text-align:center;font-variant-numeric:tabular-nums}
.da-page-input:focus{outline:none;border-color:var(--da-accent,#176df2);background:rgba(255,255,255,.18)}
/* The page number's own denominator: smaller and quieter than the number it follows. */
.da-page-total{font-size:12px;color:var(--dsw-alias-label-tertiary,inherit);white-space:nowrap}
/* The page slot before the first raster. It takes the column the body's stage
   takes, so the frame around it — the toolbar above all — is in place from the
   first paint and does not move when the page arrives. */
.da-placeholder{flex:1 1 auto;min-height:0;background:var(--dsw-alias-bg-document-preview,transparent)}
/* The page-number box and its denominator, held together so the box cannot drift
   away from the count it is a fraction of. */
.da-page-field{display:flex;align-items:center;gap:3px}
/* The hand-off's own note, quiet enough to read as a state rather than a control. */
.da-send-note{font-size:12px;color:var(--dsw-alias-label-tertiary,inherit);margin-right:2px}
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
/* A dot, not a count: "there is a goal written" is all the bar needs to say about
   a field it is not a list of. */
.da-dock-dot{position:absolute;top:3px;right:4px;width:5px;height:5px;border-radius:50%;
  background:var(--da-accent,#176df2)}
.da-dock-sep{width:1px;height:16px;margin:0 3px;background:var(--dsw-alias-border-l3,currentColor);opacity:.6;flex:0 0 auto}
/* The count rides on the list's own button: it is the one thing about the list a
   reader wants without opening it. */
/* Two digits made this 20px wide over a 15px glyph, covering a third of the picture a
   reader uses to recognise the button. It now sits off the glyph's corner rather than
   on it, and a count that grows past two digits is capped rather than allowed to eat
   the icon: the number on the bar is a reminder, the list itself is one click away. */
.da-dock-count{position:absolute;top:-4px;right:-6px;min-width:14px;height:14px;padding:0 3px;
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
  color:var(--da-quiet,var(--dsw-alias-label-tertiary,currentColor))}
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
.da-mark{display:flex;align-items:center;gap:7px;padding:5px 4px;border-radius:7px;
  border:0.5px solid transparent;min-width:0}
.da-mark:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.08))}
.da-mark[data-selected="true"]{border-color:var(--da-accent,#176df2);
  background:var(--dsw-alias-interactive-bg-hover,rgba(23,109,242,.06))}
/* Two light strokes in the mark's colour, not a block of fill.
   A filled chip on every row is a wall of colour beside a figure that is mostly
   paper; the list should read as a list. The number keeps a fixed, right-aligned
   box so a column of rows lines up whether it holds 1 or 12, and the glyph beside
   it is drawn at the same 1.5px stroke the tools wear. */
.da-mark-n{flex:0 0 auto;width:14px;text-align:right;font-size:11px;font-weight:600;
  font-variant-numeric:tabular-nums;line-height:1.35;
  color:var(--dsw-alias-label-secondary,currentColor)}
.da-mark-glyph{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;
  width:14px;height:14px}
.da-mark-glyph svg{width:12px;height:12px;fill:none;stroke:currentColor;
  stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
.da-mark-text{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:1px;
  padding:0;border:0;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}
.da-mark-title{display:block;font-size:12px;line-height:1.35;overflow:hidden;
  text-overflow:ellipsis;white-space:nowrap}
.da-mark-meta{display:block;font-size:10px;line-height:1.35;
  color:var(--da-quiet,var(--dsw-alias-label-tertiary,currentColor));overflow:hidden;
  text-overflow:ellipsis;white-space:nowrap}
/* The page number sits at the row's end rather than under its sentence: it is not
   part of what the mark says, it is where the mark is, and a list puts that where a
   table of contents puts it.
   Its size is the number's, not a step below it. Two sizes in one row — 11px on the
   left, 10px on the right — read as two different kinds of fact, and the page was
   the one that looked like it had been shrunk to fit. Weight is what demotes a fact
   here, not size: 500 against the number's 600, and the tertiary colour. */
.da-mark-page{flex:0 0 auto;font-size:10px;font-weight:400;line-height:1.35;
  white-space:nowrap;color:var(--da-quiet,var(--dsw-alias-label-tertiary,currentColor));
  font-variant-numeric:tabular-nums}
/* A glyph rather than the word 删除: the row is a card, and a word in the corner of
   a card reads as another thing to press rather than as the way to get rid of it. */
.da-mark-del{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;
  width:20px;height:20px;padding:0;border:0;border-radius:6px;background:transparent;
  color:var(--dsw-alias-label-tertiary,currentColor);font:inherit;font-size:11px;line-height:1;
  cursor:pointer;opacity:0}
.da-mark:hover .da-mark-del,.da-mark[data-selected="true"] .da-mark-del{opacity:1}
.da-mark-del:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.14));color:inherit}
.da-mark-del:focus-visible{opacity:1}

/* The empty list is a picture and two lines: a card of grey text reads as broken,
   and "nothing yet" is a state, not an error. */
.da-empty{display:flex;flex-direction:column;align-items:center;gap:5px;padding:18px 10px 14px;text-align:center}
.da-empty-ico{width:46px;height:46px;fill:none;stroke:var(--dsw-alias-border-l4,currentColor);stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round;opacity:.85}
.da-empty-title{font-size:12px;font-weight:650;color:var(--dsw-alias-label-secondary,inherit)}
.da-empty-hint{font-size:11px;line-height:1.6;color:var(--da-quiet,var(--dsw-alias-label-tertiary,inherit));max-width:190px}
/* The figure's context menu. Laid out at a fixed width because the placement
   maths needs one number; rows are the height that maths assumes. */
.da-menu{position:fixed;z-index:40;display:flex;flex-direction:column;gap:1px;width:208px;
  box-sizing:border-box;
  padding:4px;border-radius:10px;background:var(--dsw-alias-bg-layer-2,#fff);
  box-shadow:0 8px 24px rgba(15,17,21,.16),0 0 0 1px var(--dsw-alias-border-l2,rgba(0,0,0,.1))}
.da-menu-item{display:flex;align-items:center;height:27px;padding:0 8px;border:0;border-radius:6px;
  background:transparent;color:var(--dsw-alias-label-primary,inherit);font:inherit;font-size:12.5px;
  text-align:left;cursor:pointer;white-space:nowrap}
.da-menu-item:hover,.da-menu-item:focus-visible{background:var(--da-accent-soft,rgba(23,109,242,.14));outline:none}

.da-status{flex:0 0 auto;padding:6px 10px;font-size:12px;color:var(--dsw-alias-label-secondary,inherit)}
.da-status[data-tone="error"]{color:var(--dsw-alias-label-error,var(--dsw-alias-state-error-primary,currentColor))}
.da-status[data-tone="ok"]{color:var(--dsw-alias-state-success-primary,currentColor)}
.da-hint{padding:10px 2px;font-size:12px;line-height:1.6;color:var(--da-quiet,var(--dsw-alias-label-tertiary,inherit))}
/* The grey above is for "still working". A failure is not quieter than a wait. */
.da-hint[data-tone="error"]{color:var(--dsw-alias-label-error,var(--dsw-alias-state-error-primary,currentColor))}

/* --- the Markdown body: an editor over the source, or the diff it produced --- */
.da-md{display:flex;flex-direction:column;height:100%;min-height:0}
.da-md-stats{flex:0 0 auto;font-size:12px;white-space:nowrap;color:var(--dsw-alias-label-secondary,inherit)}
/* The editor pane: the textarea, and the gutter that only exists while the
   document toolbar's wrap preference is off (a wrapped line has no one row). */
.da-md-pane{flex:1 1 auto;display:flex;min-height:0;background:var(--dsw-alias-bg-base,transparent)}
.da-md-gutter{flex:0 0 auto;overflow:hidden;padding:8px 6px 8px 10px;text-align:right;color:var(--da-quiet,var(--dsw-alias-label-tertiary,inherit));font-size:12px;line-height:1.6;font-family:var(--dsw-font-family-mono,ui-monospace,SFMono-Regular,Menlo,monospace);user-select:none}
.da-md-editor{flex:1 1 auto;min-height:0;width:100%;padding:8px 10px;border:none;outline:none;resize:none;background:var(--dsw-alias-bg-base,transparent);color:inherit;font-size:12px;line-height:1.6;tab-size:2;font-family:var(--dsw-font-family-mono,ui-monospace,SFMono-Regular,Menlo,monospace)}
/* The one field a reader types a document edit into, and the one surface whose text
   becomes a diff an agent applies. It draws no border of its own to recolour the way
   the note fields do, so the cue is a ring on the inside edge: drawn outside it would
   be clipped by the pane, and drawn as a background tint it would be lost against the
   pane's own background. */
.da-md-editor:focus-visible{outline:2px solid var(--da-accent,#176df2);outline-offset:-2px}
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
		*
		* One function for both axes, because the two axes are laid out by the same rule:
		* centred while the surface fits, pinned at the stage's padding once it does not.
		* @param viewportExtent - the scrollport's client width or height.
		* @param surfaceExtent - the surface's laid-out width or height.
		* @returns the offset the flex alignment resolves to.
		*/
		function surfaceOffset(viewportExtent, surfaceExtent) {
			if (surfaceExtent > viewportExtent) return 14;
			return (viewportExtent - surfaceExtent) / 2;
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
			const leftBefore = surfaceOffset(viewport.clientWidth, figure.width * before);
			const leftAfter = surfaceOffset(viewport.clientWidth, figure.width * after);
			const topBefore = surfaceOffset(viewport.clientHeight, figure.height * before);
			const topAfter = surfaceOffset(viewport.clientHeight, figure.height * after);
			const figureX = (viewport.scrollLeft + localX - leftBefore) / before;
			const figureY = (viewport.scrollTop + localY - topBefore) / before;
			return {
				scrollLeft: Math.max(0, leftAfter + figureX * after - localX),
				scrollTop: Math.max(0, topAfter + figureY * after - localY)
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
		}, obstacle) {
			const below = anchor.y + anchor.height + 10;
			const above = anchor.y - size.height - 10;
			const roomBelow = panelHeight - 8 - below;
			const roomAbove = anchor.y - 10 - 8;
			const top = roomBelow >= size.height ? below : roomAbove >= size.height ? above : Math.max(8, roomAbove > roomBelow ? above : below);
			const widest = Math.max(8, panelWidth - size.width - 8);
			const left = Math.min(Math.max(8, anchor.x), widest);
			return {
				left: obstacle === void 0 ? left : clearOf(left, top, size, obstacle, panelWidth, widest),
				top
			};
		}
		/**
		* Move a card out of the way of a strip floating over the panel.
		*
		* The palette is the reader's, dragged wherever they want it, and it floats *above*
		* the panel's content rather than beside it — so a card placed in the panel's own
		* coordinates can end up underneath it. The card therefore gives way: its band is
		* compared with the strip's, and a card whose band crosses it is pushed to the far
		* side of the strip, whichever half of the panel the strip is docked on. Nothing moves
		* when the strip has no box (it is not laid out yet, or not drawn at all), because an
		* obstacle nobody can see must not push a card around.
		* @param left - where the card would sit without the strip.
		* @param top - where it would sit vertically.
		* @param size - the card's size, in CSS pixels.
		* @param obstacle - the strip's box, in the panel's coordinates.
		* @param panelWidth - the panel's width, in CSS pixels.
		* @param widest - the largest left edge the card may have.
		* @returns the left edge to use.
		*/
		function clearOf(left, top, size, obstacle, panelWidth, widest) {
			if (obstacle.width <= 0 || obstacle.height <= 0) return left;
			if (!(top < obstacle.y + obstacle.height + 24 && top + size.height + 24 > obstacle.y)) return left;
			const pushed = obstacle.x + obstacle.width / 2 > panelWidth / 2 ? Math.min(left, obstacle.x - 24 - size.width) : Math.max(left, obstacle.x + obstacle.width + 24);
			return Math.min(Math.max(8, pushed), widest);
		}
		/**
		* A floating strip's box in the panel's own coordinates.
		*
		* Measured from the element rather than derived from the parked fractions: the strip
		* is positioned by inline style and is clipped by the panel, so only its laid-out box
		* says where it really is. A strip that is not rendered has no box, and no obstacle.
		* @param element - the strip's element, when there is one.
		* @param panel - the panel's box, in client coordinates.
		* @returns the strip's box in the panel's coordinates, or undefined.
		*/
		function obstacleBox(element, panel) {
			if (element === null) return void 0;
			const box = element.getBoundingClientRect();
			return {
				x: box.left - panel.left,
				y: box.top - panel.top,
				width: box.width,
				height: box.height
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
		//#region src/client/annotator/icons.tsx
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
		* The select tool: an open hand.
		*
		* The hand is what the tool *is* — dragging with it moves the paper, and the stage's
		* own cursor already says `grab` while it is armed. A cursor arrow here said the
		* opposite thing: an arrow is the pointer a marking tool wears, and `element` wears
		* one, so the two tiles looked like the same tool.
		*
		* The shape is Tabler's `hand-stop`, taken whole at its own 24 grid: five fingers drawn
		* as five strokes would be a smudge at 17px, and this one's palm-and-thumb silhouette
		* survives the size.
		*/
		function GrabIcon() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				className: "da-ico",
				viewBox: "0 0 24 24",
				"aria-hidden": "true",
				focusable: "false",
				strokeWidth: "2",
				strokeLinecap: "round",
				strokeLinejoin: "round",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M8 13v-7.5a1.5 1.5 0 0 1 3 0v6.5" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M11 5.5v-2a1.5 1.5 0 1 1 3 0v8.5" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M14 5.5a1.5 1.5 0 1 1 3 0v6.5" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M17 7.5a1.5 1.5 0 1 1 3 0v8.5a6 6 0 0 1 -6 6h-2h.208a6 6 0 0 1 -5.012 -2.7a69.74 69.74 0 0 1 -.196 -.3c-.312 -.479 -1.407 -2.388 -3.286 -5.728a1.5 1.5 0 0 1 .536 -2.022a1.867 1.867 0 0 1 2.28 .28l1.47 1.47" })
				]
			});
		}
		/**
		* The pointer a `select` tool wears instead of the word "select".
		*
		* Every other tool is a picture of what it draws — an arrow, a box, a circle — and
		* this one draws nothing, so the pointer is the honest shape: it is the tool you use
		* with the mouse rather than a mark you leave behind. Drawn rather than written so
		* the toolbar stays one row of controls at any locale or font size.
		*/
		/**
		* The element tool: a cursor, outlined rather than filled.
		*
		* It is the arrow the whole panel used to wear for `select`, moved to the tool that
		* actually behaves like a pointer: `element` asks what is under the cursor and takes the
		* thing it is over. Where `select` got it, it named a tool that does not point at
		* anything — it drags the paper.
		*
		* Filled, it read as a black blob against the dark chip — the silhouette was there but
		* the direction it points was not, which is the only thing a cursor has to say. As an
		* outline it belongs to the same stroke set as the other glyphs.
		*
		* The shape is Tabler's `cursor-text`-sibling `pointer` glyph, taken whole at its own
		* 24 grid: its body is one closed curve with round joins rather than the seven hard
		* corners a hand-traced outline has, and at 16px that softness is the whole difference
		* between a cursor and a shard. Scaled by hand it lost exactly that.
		*/
		const POINTER_PATH = "M15.02 14.03l4.74 -1.85c1.36 -.53 1.29 -2.49 -.11 -2.92l-12.03 -3.68c-1.18 -.36 -2.29 .75 -1.93 1.93l3.68 12.03c.43 1.4 2.39 1.47 2.92 .11l1.85 -4.74a1.55 1.55 0 0 1 .88 -.88";
		/**
		* The stroke each marking tool draws, so the row says it in pictures as well as words.
		*
		* Every icon in the row is drawn on the same 24-unit grid. That is not cosmetic:
		* `stroke-width` in an inline SVG is measured in the icon's own units, so a 16-unit
		* icon and a 24-unit icon given the same number draw at different thicknesses. On one
		* grid they cannot drift, and the whole row reads as one set.
		*
		* `select` never comes here: it draws nothing, so it wears the open hand. `element` does
		* come here, because a mark that is an element is drawn as the box around it, and the
		* arrow beside it says the tool picks rather than draws.
		*/
		function ToolIcon(tool) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				viewBox: "0 0 24 24",
				"aria-hidden": "true",
				focusable: "false",
				children: tool === "arrow" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M 4.5 19.5 L 19 5" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M 10 5 h 9 v 9" })] }) : tool === "rect" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
					x: "4",
					y: "6",
					width: "16",
					height: "12",
					rx: "2"
				}) : tool === "ellipse" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
					cx: "12",
					cy: "12",
					r: "8.2"
				}) : tool === "pen" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M 4 18 C 7 6 12 20 20 5" }) : tool === "element" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: POINTER_PATH }) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					fillRule: "evenodd",
					d: "M 12 22.4 Q 4.9 15.1 4.1 10.16 A 7.9 7.9 0 1 1 19.9 10.16 Q 19.1 15.1 12 22.4 Z\n                     M 12 16.02 A 5.62 5.62 0 1 0 12 4.78 A 5.62 5.62 0 1 0 12 16.02 Z",
					fill: "currentColor",
					stroke: "none"
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
					cx: "12",
					cy: "10.4",
					r: "2",
					fill: "currentColor",
					stroke: "none"
				})] })
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
				viewBox: "0 0 24 24",
				"aria-hidden": "true",
				focusable: "false",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
						cx: "10.5",
						cy: "13.5",
						r: "7.8"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
						cx: "10.5",
						cy: "13.5",
						r: "3.45"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M 20.7 3.3 L 12.3 11.7" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M 14.4 3.9 L 20.7 3.3 L 20.1 9.6" })
				]
			});
		}
		/** The list card's mark: three stacked rows, the shape of the card itself. */
		function ListIcon() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				className: "da-ico",
				viewBox: "0 0 24 24",
				"aria-hidden": "true",
				focusable: "false",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M 9 6.75 h 10.5 M 9 12 h 10.5 M 9 17.25 h 10.5" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
						cx: "4.8",
						cy: "6.75",
						r: "1.5",
						fill: "currentColor",
						stroke: "none"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
						cx: "4.8",
						cy: "12",
						r: "1.5",
						fill: "currentColor",
						stroke: "none"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
						cx: "4.8",
						cy: "17.25",
						r: "1.5",
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
				viewBox: "0 0 24 24",
				"aria-hidden": "true",
				focusable: "false",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M 4.8 11.25 H 14.25 a 5.1 5.1 0 0 1 0 10.2 H 9" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M 8.7 6.6 L 4.05 11.25 L 8.7 15.9" })]
			});
		}
		/** The same arrow the other way. */
		function RedoIcon() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				className: "da-ico",
				viewBox: "0 0 24 24",
				"aria-hidden": "true",
				focusable: "false",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M 19.2 11.25 H 9.75 a 5.1 5.1 0 0 0 0 10.2 H 15" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M 15.3 6.6 L 19.95 11.25 L 15.3 15.9" })]
			});
		}
		/** The primary action's mark: a paper plane, the usual "this leaves here". */
		function SendIcon() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				className: "da-ico",
				viewBox: "0 0 24 24",
				"aria-hidden": "true",
				focusable: "false",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M 3 12 L 21 3.9 L 15.9 21 L 12 14.1 Z" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M 12 14.1 L 21 3.9" })]
			});
		}
		/** The secondary action's mark: a speech bubble, "this goes to the chat box". */
		function ChatIcon() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				className: "da-ico",
				viewBox: "0 0 24 24",
				"aria-hidden": "true",
				focusable: "false",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M 3.75 9.75 a 3 3 0 0 1 3 -3 h 10.5 a 3 3 0 0 1 3 3 v 4.5 a 3 3 0 0 1 -3 3 h -6 l -4.5 3.3 v -3.3 a 3 3 0 0 1 -3 -3 z" })
			});
		}
		//#endregion
		//#region src/client/annotator/tokens.ts
		/** Palette offered by the toolbar. */
		const COLORS = [
			"#e03131",
			"#1971c2",
			"#f08c00",
			"#2f9e44"
		];
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
		/** Tools in toolbar order. */
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
			},
			{
				tool: "element",
				label: "toolElement"
			}
		];
		/**
		* The tools that only mean something on a surface made of elements.
		*
		* An inline SVG and a rendered HTML document are both trees, so a picker can name a
		* node in either one. A raster figure is one bitmap: there is nothing inside it to
		* point at, so the tool would sit in the row offering a gesture that could only ever
		* answer "no element here". It is left out there rather than shown and refused —
		* but it is kept in {@link TOOLS} for both surfaces that can use it, because a tool
		* that appears and disappears with media type has to be one list, not two.
		*/
		const ELEMENT_TOOLS = /* @__PURE__ */ new Set(["element"]);
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
			"pen"
		]);
		/** The copy key naming the shape each kind of mark is, for the list's second line. */
		const TOOL_COPY = {
			arrow: "toolArrow",
			rect: "toolRect",
			ellipse: "toolEllipse",
			pen: "toolPen",
			point: "toolPoint",
			element: "toolElement"
		};
		//#endregion
		//#region src/client/annotator/chrome.tsx
		/**
		* The tool row: one tile per tool this figure can use.
		*
		* The grip above the tiles is what drags the strip; the tiles themselves stay
		* buttons, because a drag that starts on a tool should still arm that tool.
		* @param props - the strip's placement, drag, and the tools to offer.
		* @returns the palette strip.
		*/
		function ToolPalette(props) {
			const { handle, t, tools } = props;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "da-palette",
				ref: props.stripRef,
				"data-dragging": handle.dragging ? "true" : void 0,
				style: props.style,
				role: "toolbar",
				"aria-label": t("tools"),
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "da-palette-grip",
					title: t("moveTools"),
					onPointerDown: handle.onDown,
					onPointerMove: handle.onMove,
					onPointerUp: handle.onUp,
					onPointerCancel: handle.onCancel,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(GripDots, { wide: true })
				}), tools.map((entry) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: "da-btn da-tool",
					"aria-pressed": props.tool === entry.tool,
					"aria-label": t(entry.label),
					title: t(entry.label),
					onClick: () => {
						props.onChoose(entry.tool);
					},
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "da-tool-icon",
						"aria-hidden": true,
						children: entry.tool === "select" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(GrabIcon, {}) : ToolIcon(entry.tool)
					})
				}, entry.tool))]
			});
		}
		/**
		* The bar: every control that acts on the picture, along one edge.
		*
		* Every control lives here — the style fold, the history steps, the records and the
		* way out — because the figure above is what the panel is for, and nothing should
		* take a row from it. A control along the bottom edge is a control the reader's eye
		* already knows to look for, from every viewer they have used.
		* @param props - the strip's placement, the state it shows, and what its buttons do.
		* @returns the bar strip.
		*/
		function FigureBar(props) {
			const { handle, t } = props;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "da-bar",
				ref: props.stripRef,
				"data-dragging": handle.dragging ? "true" : void 0,
				"data-parked": props.parked ? "true" : void 0,
				style: props.style,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "da-palette-grip",
						title: t("moveBar"),
						onPointerDown: handle.onDown,
						onPointerMove: handle.onMove,
						onPointerUp: handle.onUp,
						onPointerCancel: handle.onCancel,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(GripDots, { wide: false })
					}),
					props.pagingSlot === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [props.pagingSlot, /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "da-sep",
						"aria-hidden": true
					})] }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "da-bar-tools",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "da-btn da-style",
							"aria-expanded": props.styleOpen,
							"aria-label": t("style"),
							title: t("style"),
							onClick: props.onToggleStyle,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "da-swatch-dot",
								style: { background: props.shownColor }
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "da-style-caret",
								"aria-hidden": true,
								children: props.styleOpen ? "▴" : "▾"
							})]
						})
					}),
					props.styleOpen ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "da-style-row",
						role: "group",
						"aria-label": t("style"),
						"data-side": props.foldOpensDown ? "below" : "above",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "da-style-label",
							children: t("styleColor")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "da-style-colors",
							children: COLORS.map((value) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "da-swatch",
								"aria-pressed": props.shownColor === value,
								style: { background: value },
								"aria-label": value,
								title: value,
								onClick: () => {
									props.onChooseColor(value);
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
						"aria-pressed": props.goalOpen,
						"aria-label": t("summary"),
						title: t("summary"),
						onClick: props.onToggleGoal,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(GoalIcon, {}), props.summary.trim() === "" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "da-dock-dot",
							"aria-hidden": true
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "da-dock-btn",
						"aria-pressed": props.listOpen,
						"aria-label": t("marks"),
						title: t("marks"),
						onClick: props.onToggleList,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ListIcon, {}), props.listedMarks.length === 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "da-dock-count",
							children: props.listedMarks.length
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
						disabled: props.pastCount === 0,
						onClick: props.undo,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(UndoIcon, {})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "da-dock-btn",
						"aria-label": t("redo"),
						title: t("redo"),
						disabled: props.futureCount === 0,
						onClick: props.redo,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RedoIcon, {})
					}),
					props.isPage && props.onSend === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "da-dock-sep",
							"aria-hidden": true
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "da-dock-btn",
							disabled: props.busy,
							"aria-label": t("sendToAgent"),
							title: t("sendToAgent"),
							onClick: props.sendToAgent,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SendIcon, {})
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "da-dock-btn",
							disabled: props.busy,
							"aria-label": t("sendToComposer"),
							title: t("sendToComposer"),
							onClick: props.sendToComposer,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ChatIcon, {})
						})
					] })
				]
			});
		}
		//#endregion
		//#region src/client/annotator/detail-pill.tsx
		/** Whether this mark has a sentence yet. */
		function hasDetail(mark) {
			return mark.detail !== void 0 && mark.detail.trim() !== "";
		}
		/**
		* The comment pill.
		* @param props - the mark, its placement, and the ways out of it.
		* @returns the pill, or nothing when there is no sentence to write yet.
		*/
		function DetailPill(props) {
			const { mark, t } = props;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "da-float da-float-detail",
				role: "group",
				"aria-label": t("detail"),
				ref: props.pillRef,
				style: {
					left: props.at.left,
					top: props.at.top
				},
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
					ref: props.inputRef,
					className: "da-comment",
					value: mark.detail ?? "",
					placeholder: hasDetail(mark) ? t("detailPlaceholder") : t("addComment"),
					rows: 1,
					maxLength: MAX_DETAIL_CHARS,
					onChange: (event) => {
						props.onWrite(event.target.value);
					}
				}), hasDetail(mark) ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "da-comment-send",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "da-comment-send-btn da-comment-send-primary",
						disabled: props.busy,
						"aria-label": t("sendToAgent"),
						title: t("sendToAgent"),
						onClick: () => {
							props.onSendToAgent();
						},
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SendIcon, {})
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "da-comment-send-btn",
						disabled: props.busy,
						"aria-label": t("sendToComposer"),
						title: t("sendToComposer"),
						onClick: () => {
							props.onSendToComposer();
						},
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ChatIcon, {})
					})]
				}) : null]
			});
		}
		//#endregion
		//#region src/client/annotator/figure-menu-card.tsx
		/**
		* The figure's own menu: the file behind it, and the way out to someone who can act
		* on it.
		*
		* Drawn at the pointer and closed by anything else, the way a context menu is
		* everywhere. The rows are decided by `figure-menu.ts` from what the Host can
		* actually do, so this only draws them.
		* @module dsh-figmark/client/annotator/figure-menu-card
		*/
		/**
		* The figure's context menu.
		* @param props - where it is, which rows it offers, and what choosing one does.
		* @returns the menu.
		*/
		function FigureMenuCard(props) {
			const rows = props.rows;
			const [on, setOn] = (0, react.useState)(0);
			const items = (0, react.useRef)([]);
			(0, react.useEffect)(() => {
				items.current[0]?.focus();
			}, []);
			const onKeyDown = (event) => {
				const moved = menuStep(event.key, on, rows.length);
				if (moved !== null) {
					event.preventDefault();
					setOn(moved);
					items.current[moved]?.focus();
					return;
				}
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					/* v8 ignore next -- unreachable: see above. */
					const row = rows[on];
					props.onChoose(row.id);
				}
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "da-menu",
				ref: props.menuRef,
				role: "menu",
				"aria-label": props.t("menuLabel"),
				style: {
					left: props.at.left,
					top: props.at.top
				},
				onKeyDown,
				children: rows.map((item, at) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: "da-menu-item",
					role: "menuitem",
					ref: (element) => {
						items.current[at] = element;
					},
					tabIndex: at === on ? 0 : -1,
					onClick: () => {
						props.onChoose(item.id);
					},
					children: item.label
				}, item.id))
			});
		}
		//#endregion
		//#region src/client/annotator/figure-room.tsx
		/**
		* The stage, the sheet, the paper, and the figure.
		* @param props - the boxes, the figure to put in them, and the overlay to draw over it.
		* @returns the figure room.
		*/
		function FigureRoom(props) {
			const { figure, t } = props;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "da-stage",
				ref: props.stageRef,
				onContextMenu: props.onContextMenu,
				"data-hand": props.stageClass.hand ? "true" : void 0,
				"data-panning": props.stageClass.panning ? "true" : void 0,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "da-surface",
					ref: props.surfaceRef,
					style: props.surfaceStyle,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "da-paper",
						ref: props.paperRef,
						style: props.paperStyle,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "da-figure-frame",
							ref: props.figureRef,
							style: props.figureStyle,
							children: figure?.kind === "svg" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								ref: props.hostRef,
								dangerouslySetInnerHTML: { __html: figure.markup }
							}) : figure?.kind === "raster" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
								className: "da-figure",
								src: figure.objectUrl,
								width: props.size?.width,
								height: props.size?.height,
								alt: "",
								onLoad: (event) => {
									const image = event.currentTarget;
									props.onRasterLoad({
										width: image.naturalWidth,
										height: image.naturalHeight
									});
								}
							}) : figure?.kind === "html" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("iframe", {
								ref: props.frameRef,
								className: "da-html",
								title: t("htmlFrame"),
								sandbox: "allow-same-origin",
								style: {
									width: figure.width,
									height: props.htmlHeight
								}
							}) : null
						}), props.overlay]
					})
				})
			});
		}
		//#endregion
		//#region src/client/annotator/history.ts
		/**
		* The marks, and the two stacks that let the reader walk them back and forth.
		*
		* They are one state machine rather than three `useState` calls: every operation
		* touches at least two of them (an edit pushes onto `past` and empties `future`; an
		* undo moves a value from `past` to `future` and swaps the marks), and three
		* independent setters let a caller reach states the reader can never be in — a step
		* recorded with no marks behind it, a `future` that no longer describes where the
		* marks came from. As one value, every transition is total and every reachable state
		* is one the reader could actually have reached.
		*
		* The depth caps live here too, because they are the thing the two stacks have to
		* agree on: fifty steps back means at most fifty forward, or the reader's redo trail
		* would outlive the history it is walking through.
		* @module dsh-figmark/client/annotator/history
		*/
		/** How many steps the reader can walk back. */
		const DEPTH = 50;
		/**
		* History for a surface that starts with some marks already on it.
		* @param marks - the marks to open with, usually a draft being restored.
		* @returns a history with nothing to walk back to.
		*/
		function openingHistory(marks) {
			return {
				marks,
				past: [],
				future: []
			};
		}
		/**
		* Record a new set of marks as an edit, with the previous state walkable back to.
		*
		* A commit always drops the redo trail: the reader has just made a new decision, and
		* a redo kept from before it would silently overwrite that decision with an older
		* one.
		* @param history - the state before the edit.
		* @param next - the marks after it.
		* @returns the new history.
		*/
		function commitMarks(history, next) {
			return {
				marks: next,
				past: [...history.past, history.marks].slice(-50),
				future: []
			};
		}
		/**
		* Replace the marks without recording a step.
		*
		* Loading a document is not an edit: what was just read is what is already there, so
		* it must not become a step the reader can undo their work back through.
		* @param history - the state before the load.
		* @param next - the marks that were read.
		* @returns the new history.
		*/
		function replaceMarks(history, next) {
			return {
				marks: next,
				past: history.past,
				future: history.future
			};
		}
		/**
		* Start over on a different document.
		*
		* A different document is not an earlier state of this one: its marks were never on
		* this surface, so no gesture here produced them and no press can walk back to them.
		* {@link replaceMarks} keeps both stacks, which is right for re-reading *the same*
		* document — applying it to a new address is what let a redo on figure B restore
		* figure A's marks, because the stacks described work that belonged to another
		* picture.
		* @param history - the state of the document being left.
		* @param next - the marks the new document opens with.
		* @returns the new document's history, with nothing to walk back to.
		*/
		function resetMarks(history, next) {
			if (history.marks === next && history.past.length === 0 && history.future.length === 0) return history;
			return {
				marks: next,
				past: [],
				future: []
			};
		}
		/**
		* Walk one step back.
		*
		* Returns the same value when there is nothing behind, rather than a copy of it: an
		* undo that cannot move must not make React re-render the whole panel.
		* @param history - the current state.
		* @returns the state one step earlier.
		*/
		function undoStep(history) {
			const previous = history.past[history.past.length - 1];
			if (previous === void 0) return history;
			return {
				marks: previous,
				past: history.past.slice(0, -1),
				future: [history.marks, ...history.future].slice(0, DEPTH)
			};
		}
		/**
		* Change the marks without recording a step, as typing does.
		*
		* Not an undoable edit — a character is not a decision the reader wants to walk back
		* one press at a time — but it *is* a change to what the marks are, so the redo trail
		* has to go with it. A redo entry is a snapshot taken before the sentence existed, and
		* leaving it there offered a button that undid the reader's own typing: undo once,
		* type, press redo, and the words were gone with nothing left to bring them back.
		* @param history - the current state.
		* @param update - the marks as they now stand.
		* @returns the state with the new marks and nothing left to redo.
		*/
		function amendMarks(history, update) {
			const marks = update(history.marks);
			return marks === history.marks ? history : {
				marks,
				past: history.past,
				future: []
			};
		}
		/**
		* Walk one step forward again.
		* @param history - the current state.
		* @returns the state one step later.
		*/
		function redoStep(history) {
			const next = history.future[0];
			if (next === void 0) return history;
			return {
				marks: next,
				past: [...history.past, history.marks].slice(-50),
				future: history.future.slice(1)
			};
		}
		/**
		* The history, as a component holds it.
		*
		* Every operation is wrapped in a `useCallback` with no dependencies, because each
		* one is computed from whatever the previous state turns out to be rather than from
		* a value read at render time: a commit is `commitMarks` applied to the state as it
		* is when the write lands, not to the marks some earlier render happened to close
		* over. That is what keeps a burst of edits from a single pointer gesture — a drag
		* reports once, but a keystroke reports per character — from folding into one step.
		* @param initial - the marks to open with.
		* @returns the marks and the ways to change them.
		*/
		function useAnnotationHistory(initial) {
			const [state, setState] = (0, react.useState)(() => openingHistory(initial));
			const commit = (0, react.useCallback)((next) => {
				setState((history) => commitMarks(history, next));
			}, []);
			const replace = (0, react.useCallback)((next) => {
				setState((history) => replaceMarks(history, next));
			}, []);
			const reset = (0, react.useCallback)((next) => {
				setState((history) => resetMarks(history, next));
			}, []);
			const amend = (0, react.useCallback)((update) => {
				setState((history) => amendMarks(history, update));
			}, []);
			const undo = (0, react.useCallback)(() => {
				setState(undoStep);
			}, []);
			const redo = (0, react.useCallback)(() => {
				setState(redoStep);
			}, []);
			const depth = (0, react.useMemo)(() => ({
				past: state.past.length,
				future: state.future.length
			}), [state.future.length, state.past.length]);
			return {
				marks: state.marks,
				depth,
				commit,
				replace,
				reset,
				amend,
				undo,
				redo
			};
		}
		//#endregion
		//#region src/client/annotator/geometry.ts
		/**
		* The factor the figure is drawn at.
		*
		* The owner's width wins over this body's own measurement: in a column every page
		* measures its box at a different moment, and one that measured nothing would draw
		* at its own pixel size — a document of mismatched sheets.
		* @param input - the zoom seat, the measured fit width, the figure's own size, and
		*   whatever width the owner asked for.
		* @param input.zoom - the factor asked for, or `fit`.
		* @param input.fitWidth - the panel width measured for this body, in pixels.
		* @param input.size - the figure's own size, or null before there is one.
		* @param input.ownerWidth - a width the owner insists on, if any.
		* @returns the factor to draw at, never outside the shared range.
		*/
		function drawingScale(input) {
			if (input.surface === null) return 1;
			if (input.zoom !== "fit") return input.zoom;
			const target = input.ownerWidth ?? input.fitWidth;
			if (target <= 0) return 1;
			return Math.min(1.5, Math.max(.05, target / input.surface.width));
		}
		/**
		* What the weight rail currently means, or null when it means nothing.
		*
		* It sizes one thing: the stroke of the mark the reader is working on, or the pen of
		* the next stroke. With nothing selected and no drawing tool out there is no such
		* thing, so the rail stands down instead of offering a control for a decision nobody
		* is making. A point mark borrows the same number for its pin, so the rail stays when
		* one is selected — it is the mark's size, whichever way it is drawn.
		*
		* An element mark has no stroke and no marker: it is the light on the element it
		* names, and nothing about it is sized. The rail stood open on one anyway, reading
		* the weight the mark used to carry when it was still drawn as a box — a slider that
		* moved nothing, on a mark with nothing to move.
		* @param selected - the mark the reader picked out, or null.
		* @param tool - the tool currently armed.
		* @param remembered - the weight the reader last chose for a new stroke.
		* @returns the value to show, or null when the rail should stand down.
		*/
		function railWeight(selected, tool, remembered) {
			if (selected === null) return WEIGHT_TOOLS.has(tool) ? remembered : null;
			if (!isStrokeKind(selected.kind)) return null;
			return selected.weight ?? 1;
		}
		/**
		* How far up the rail a value sits, from 0 at the lightest to 1 at the heaviest.
		*
		* One number for the fill, the knob and the input: computed three times the three
		* could round differently and the knob would sit a pixel off the fill it belongs to.
		* @param weight - the value shown, or null when the rail is standing down.
		* @returns its position on the rail, 0 when there is nothing to place.
		*/
		function railFraction(weight) {
			return weight === null ? 0 : (weight - WEIGHT_MIN) / (8 - WEIGHT_MIN);
		}
		/**
		* The surface's box: the paper at the factor it is drawn at.
		* @param paper - the paper's own size, or null before a figure has loaded.
		* @param scale - the factor it is drawn at.
		* @returns the inline style for the surface.
		*/
		function surfaceBoxStyle(paper, scale) {
			return paper === null ? {} : {
				width: paper.width * scale,
				height: paper.height * scale
			};
		}
		/**
		* The paper at its unscaled size, with the figure placed at its own offset on it.
		*
		* The whole paper is scaled by one transform rather than each part scaling itself, so
		* the figure and the overlay cannot drift apart at a fractional factor — which at 60%
		* is exactly what a mark drawn on a line work and a mark drawn on paper would do.
		* @param paper - the paper's own size, or null before a figure has loaded.
		* @param scale - the factor it is drawn at.
		* @returns the inline style for the paper.
		*/
		function paperTransformStyle(paper, scale) {
			return paper === null ? {} : {
				position: "relative",
				width: paper.width,
				height: paper.height,
				transform: `scale(${scale})`,
				transformOrigin: "top left"
			};
		}
		/**
		* Where the figure sits on the paper.
		* @param paper - the paper's own size, or null before a figure has loaded.
		* @param size - the figure's own size, or null before one has been measured.
		* @returns the inline style for the figure's frame.
		*/
		function figurePlacementStyle(paper, size) {
			return paper === null ? {} : {
				position: "absolute",
				left: -paper.x,
				top: -paper.y,
				width: size?.width,
				height: size?.height
			};
		}
		//#endregion
		//#region src/client/annotator/documents.ts
		/**
		* The one place a marks file is assembled.
		*
		* Two paths write one — the draft an autosave keeps while the reader is working,
		* and the document a hand-off delivers — and they describe the same figure at the
		* same moment. Built twice, the two would be free to disagree about a field, and
		* the disagreement would only surface as a reload reading something the panel
		* never showed. Every field a writer needs is named here once.
		* @module dsh-figmark/client/annotator/documents
		*/
		/**
		* Assemble one marks file.
		*
		* `createdAt` keeps the first moment the annotation existed and only falls back to
		* now for one that has never been written: it is what a reader sees as "when this
		* was noted", and moving it on every save would make every draft look new. A blank
		* summary is left out rather than written empty, so a document that carries no
		* overall goal does not claim to carry one.
		* @param source - the figure, surface, marks, and clock to build from.
		* @returns the document to write.
		*/
		function buildAnnotationDocument(source) {
			const summary = source.summary.trim();
			return {
				version: 1,
				figure: {
					address: source.figure.address,
					path: source.figure.path,
					mediaType: source.figure.mediaType,
					width: source.size.width,
					height: source.size.height,
					sha256: source.figure.sha256
				},
				createdAt: source.createdAt ?? source.now,
				updatedAt: source.now,
				marks: source.marks,
				...summary === "" ? {} : { summary }
			};
		}
		//#endregion
		//#region src/client/annotator/placement.ts
		/**
		* Where a strip ends up when the pointer dragging it is at a client coordinate.
		*
		* The origin is the strip's position when the press started and the offset is
		* measured against the panel rather than the strip, because moving the strip must
		* not move the frame the next position is measured in.
		*
		* The clamp is the part that makes a fraction mean what it looks like — and it has to
		* follow the side the strip hangs from. Before the middle the strip hangs down and to
		* the right of its point, so the usable range is what is left of the pane once its own
		* body is taken out of it. Past the middle it hangs up and to the left instead, so its
		* body is behind the point and the only thing left to keep it off is the far edge.
		* Clamping both halves by the body's own size was what stopped a strip parked on the
		* right a whole strip-width short of it — "this is as far as it goes", at 40px from an
		* edge it looked like it should touch.
		* @param press - the press being followed.
		* @param pointer - where the pointer is now, in client coordinates.
		* @param panel - the box the fractions are of, in client coordinates.
		* @param strip - the strip's own size, in pixels.
		* @returns the spot to place it at.
		*/
		function draggedSpot(press, pointer, panel, strip) {
			const width = Math.max(1, panel.width);
			const height = Math.max(1, panel.height);
			const x = press.origin.x + (pointer.clientX - press.box.left) / width;
			const y = press.origin.y + (pointer.clientY - press.box.top) / height;
			const roomX = Math.max(0, panel.width - strip.width) / width;
			const roomY = Math.max(0, panel.height - strip.height) / height;
			const farX = Math.max(0, 1 - STRIP_EDGE / width);
			const farY = Math.max(0, 1 - STRIP_EDGE / height);
			return {
				x: Math.min(x >= .5 ? farX : roomX, Math.max(0, x)),
				y: Math.min(y >= .5 ? farY : roomY, Math.max(0, y))
			};
		}
		/**
		* Where a strip sits before the reader moves it: top left, out of the way of the
		* figure's own middle and of the bar along the bottom.
		*/
		const DEFAULT_PALETTE = {
			x: .02,
			y: .04
		};
		/**
		* The gap a strip keeps from the panel edge it could otherwise run into.
		*
		* A strip is placed from a fraction of the panel and then hangs from that point, so on
		* a short panel the far end of a tall strip reaches past the edge — and the panel clips
		* it, because the strips are absolutely positioned outside the one child that scrolls.
		* Eight pixels is the least that keeps the edge from looking like a cut.
		*/
		const STRIP_EDGE = 8;
		/**
		* A strip's box, in percentages of the panel.
		*
		* Percentages rather than pixels so the parking spot survives a resize: a reader
		* who narrows the pane keeps the strip where it was in the picture, not off the
		* edge of the panel. The transform flips the strip's own box when it sits past the
		* middle, so its far corner stays on the panel instead of hanging outside it.
		* The height is bounded too, because the fraction only says where the strip starts.
		* A palette of seven tools is taller than a panel dragged to two hundred pixels, and
		* an unbounded strip would hang its last tools past the clipped edge where no scroll
		* reaches them: the `element` tool could not be armed at all. The bound is the room
		* left on the side the strip grows towards — down from its top edge, or up from its
		* bottom when the transform has flipped it — so the strip on screen is always the
		* whole strip.
		* @param spot - where the strip was parked, as fractions of the panel.
		* @returns the inline style that puts it there.
		*/
		function placementStyle(spot) {
			const flipped = spot.y >= .5;
			const room = flipped ? spot.y : 1 - spot.y;
			return {
				left: `${spot.x * 100}%`,
				top: `${spot.y * 100}%`,
				maxHeight: `calc(${room * 100}% - ${STRIP_EDGE}px)`,
				transform: `translate(${spot.x >= .5 ? "-100%" : "0"}, ${flipped ? "-100%" : "0"})`
			};
		}
		/**
		* A record's inline placement, from whatever has been measured so far.
		*
		* Both sides are always written: one with a real offset and one `auto`. A card
		* that grows downwards must not also be pinned by its bottom edge, or with no
		* height of its own it stretches to fill the space between them. Before the
		* measurement lands there is no offset at all — the card is briefly at the
		* panel's corner, which is off the figure and gone before it can be seen.
		* @param at - the placement measured against the bar, or null before one exists.
		* @returns the inline style for that placement.
		*/
		function recordStyle(at) {
			return {
				left: at?.left,
				top: at?.top ?? "auto",
				bottom: at?.bottom ?? "auto"
			};
		}
		//#endregion
		//#region src/client/annotator/delivery.ts
		/**
		* The sentence for a failure, with the reason appended.
		*
		* The reason is the last thing the reader reads, so it comes last — and a thrown
		* value that is not an `Error` still has to say something, which is why it is
		* stringified rather than dropped.
		* @param t - the translator seat.
		* @param key - the copy key naming what failed.
		* @param error - what was thrown.
		* @returns the failure line.
		*/
		function failureStatus(t, key, error) {
			return {
				tone: "error",
				text: `${t(key)}${describeFailure(t, error)}`
			};
		}
		/**
		* What to say about a failure, in the reader's language where there is one.
		*
		* The errors that reach this line come from two places: the Host, whose messages are
		* written for a reader, and this plugin's own guards, whose messages are English
		* literals written for a developer. Concatenated, the second kind produced a Chinese
		* sentence ending in `the sessions service is unavailable` — honest, and unreadable at
		* the one moment the reader needed to know what went wrong. A known guard becomes a
		* translated sentence; anything unrecognised still travels verbatim, because a code
		* this panel does not know is a code it should not invent a sentence for.
		* @param t - the translator seat.
		* @param error - whatever was caught.
		* @returns the sentence to put after the translated prefix.
		*/
		function describeFailure(t, error) {
			if (!(error instanceof Error)) return String(error);
			return {
				"the sessions service is unavailable": t("failSessions"),
				"the conversation service is unavailable": t("failConversation"),
				"the figure address carries no session": t("failNoSession")
			}[error.message] ?? error.message;
		}
		/**
		* The line that says there was nothing to hand over.
		*
		* The toolbar's two buttons stay lit rather than going disabled, so that pressing one
		* when there is nothing to send is answered rather than silently dropped: a live button
		* that does nothing reads as a broken button. A surface with no marks — or one whose
		* figure never finished decoding, so nothing could have been drawn on it — has nothing
		* a sidecar could describe, and the reader is told which of the two it was.
		* @param t - the translator seat.
		* @param reason - why there is nothing to send.
		* @returns the explanation.
		*/
		function handoffRefused(t, reason) {
			return {
				tone: "error",
				text: t(reason === "noMarks" ? "sendNothingToSend" : "sendNoFigure")
			};
		}
		/**
		* The line that says a hand-off has started.
		* @param t - the translator seat.
		* @param target - who is about to receive it.
		* @returns the in-progress line.
		*/
		function handoffStarted(t, target) {
			return {
				tone: "info",
				text: t(target === "agent" ? "sending" : "composing")
			};
		}
		/**
		* The line that says a hand-off has landed, named for where it went.
		* @param t - the translator seat.
		* @param target - who received it.
		* @returns the success line.
		*/
		function handoffDelivered(t, target) {
			return {
				tone: "ok",
				text: t(target === "composer" ? "composed" : "sent")
			};
		}
		/**
		* The line that says one mark of several was handed somewhere.
		*
		* A per-mark hand-off is the same act as a whole-figure one, but its aftermath is
		* the opposite: what the reader can see afterwards is the rest of the work, not an
		* empty panel. Saying "cleared" there would be false, and leaving the sentence
		* unchanged is what makes the difference invisible until the reader counts.
		* @param t - the translator seat.
		* @param target - who received it.
		* @returns the success line for a single mark.
		*/
		function handoffDeliveredOne(t, target) {
			return {
				tone: "ok",
				text: t(target === "composer" ? "composedOne" : "sentOne")
			};
		}
		/**
		* The line for a menu row that asks the Host to do something.
		*
		* The two rows that touch the desktop are the only ones whose outcome is not the
		* clipboard, and both report the same way: it was asked for, or it could not be.
		* @param t - the translator seat.
		* @param ok - whether the Host accepted the gesture.
		* @param doneKey - the copy key for the accepted case.
		* @param failedKey - the copy key for the refused case.
		* @returns the outcome line.
		*/
		function hostGestureStatus(t, ok, doneKey, failedKey) {
			return ok ? {
				tone: "ok",
				text: t(doneKey)
			} : {
				tone: "error",
				text: t(failedKey)
			};
		}
		/**
		* The line for a row that copies something to the clipboard.
		*
		* A copy with no feedback reads as a menu that did nothing, so it always says one
		* thing or the other.
		* @param t - the translator seat.
		* @param copied - whether the clipboard took it.
		* @returns the outcome line.
		*/
		function clipStatus(t, copied) {
			return copied ? {
				tone: "ok",
				text: t("menuCopied")
			} : {
				tone: "error",
				text: t("menuCopyFailed")
			};
		}
		//#endregion
		//#region src/client/annotator/figure-source.ts
		/**
		* Turning a figure's bytes into the one value the panel draws from.
		*
		* A figure arrives as bytes, but the panel needs three different things depending on
		* what the bytes are: an SVG's sanitized markup and the viewBox the export renders
		* under, a raster's object URL for the `<img>` plus a `data:` URL for the export, or
		* a rendered document and the width it was rendered at. Written as three separate
		* pieces of state those produced combinations the rest of the component had to
		* defend against — a size with no layer, a URL with no bytes — so the decoding is one
		* function returning one value, and the states that cannot happen are not
		* representable.
		* @module dsh-figmark/client/annotator/figure-source
		*/
		/**
		* Decode one figure's bytes.
		*
		* The SVG's size and the panel class are baked into the markup it returns, so the
		* string the panel inlines and the string the export embeds are the same one — that
		* is what keeps a mark drawn on the panel landing on the same element in the picture
		* handed to the agent.
		* @param data - the file's own bytes.
		* @param mediaType - the media type the address named.
		* @returns the figure, or a refusal when the bytes are not a figure this panel reads.
		*/
		function decodeFigure(data, mediaType) {
			if (mediaType === "image/svg+xml") {
				const root = parseFigureSvg(new TextDecoder().decode(data));
				if (root === void 0) return { failed: true };
				const intrinsic = svgIntrinsicSize(root);
				root.setAttribute("width", String(intrinsic.width));
				root.setAttribute("height", String(intrinsic.height));
				root.classList.add("da-figure");
				return { figure: {
					kind: "svg",
					width: intrinsic.width,
					height: intrinsic.height,
					markup: figureSvgMarkup(root),
					viewBox: svgViewBox(root, intrinsic)
				} };
			}
			if (mediaType === "text/html") return { figure: {
				kind: "html",
				width: RENDER_WIDTH,
				document: buildRenderedDocument(new TextDecoder().decode(data))
			} };
			return { figure: {
				kind: "raster",
				objectUrl: URL.createObjectURL(new Blob([data], { type: mediaType })),
				dataUrl: bytesToDataUrl(data, mediaType)
			} };
		}
		/**
		* The surface's measurable size, or null until its content and dimensions are both
		* known.
		*
		* A rendered document is measurable as soon as its width is — the frame reports how
		* tall its content is, and until it does the surface has no height.
		* @param figure - the decoded figure, or null before there is one.
		* @param rasterSize - the size the browser decoded a raster at, or null until it has.
		* @param htmlHeight - the height a rendered document's frame reported.
		* @returns the surface's size, or null.
		*/
		function figureSize(figure, rasterSize, htmlHeight) {
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
		}
		/**
		* The picture this surface can be exported as, when it can be one at all.
		*
		* A rendered document has no layer: the browser cannot turn a live document into a
		* picture, so that surface's marks travel as the marks file alone. A raster has no
		* size until the browser has decoded it, and a layer without a size is not a layer.
		* @param figure - the decoded figure, or null before there is one.
		* @param rasterSize - the size the browser decoded a raster at, or null until it has.
		* @returns the layer to compose a review image from, or null when there is none.
		*/
		function figureLayer(figure, rasterSize) {
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
		}
		//#endregion
		//#region src/client/annotator/mark-edits.ts
		/**
		* Whether a patch field is a list of points.
		*
		* Narrowed here rather than inline so the comparison below reads as arithmetic on two
		* numbers instead of as indexing into `unknown`, which the type checker cannot follow.
		* @param value - the value a patch field or a mark field holds.
		* @returns true when it is a list of figure points.
		*/
		function isPoints(value) {
			return Array.isArray(value) && value.every((point) => Array.isArray(point) && point.length === 2);
		}
		/**
		* Whether two lists of points name the same places.
		* @param next - the list a gesture produced.
		* @param now - the list the mark carries.
		* @returns true when every point matches and there are no more of them.
		*/
		function samePoints(next, now) {
			if (next.length !== now.length) return false;
			return next.every((point, at) => {
				const was = now[at];
				return was !== void 0 && was[0] === point[0] && was[1] === point[1];
			});
		}
		/**
		* Whether a patch would leave the mark exactly as it is.
		*
		* Compared key by key: `patch` only carries the fields the gesture produced, so an
		* absent field means "leave it alone", not "set it to undefined".
		* @param mark - the mark as it stands.
		* @param patch - the fields a control asked to change.
		* @returns true when every field is already at that value.
		*/
		function patchChangesNothing(mark, patch) {
			return Object.keys(patch).every((key) => {
				const next = patch[key];
				const now = mark[key];
				if (isPoints(next) && isPoints(now)) return samePoints(next, now);
				return now === next;
			});
		}
		/**
		* Write a patch onto one mark, leaving every other mark untouched.
		* @param marks - every mark the surface holds.
		* @param id - the mark to change.
		* @param patch - the fields to write.
		* @returns the new list.
		*/
		function patchedMarks(marks, id, patch) {
			const at = marks.findIndex((mark) => mark.id === id);
			if (at === -1 || patchChangesNothing(marks[at], patch)) return marks;
			return marks.map((mark) => mark.id === id ? {
				...mark,
				...patch
			} : mark);
		}
		/**
		* Write one mark's sentence, leaving every other mark untouched.
		*
		* A mark carries one string, so there is nothing to keep in step beside it: the
		* detail is what the agent reads and what the list shows, and it is never painted on
		* the picture. Typing is not an undoable step — a character is not a decision the
		* reader would want to walk back one press at a time — so this goes through the
		* history's amend path rather than its commit.
		* @param marks - every mark the surface holds.
		* @param id - the mark being written about.
		* @param value - the new text.
		* @returns the new list.
		*/
		function detailedMarks(marks, id, value) {
			const at = marks.findIndex((mark) => mark.id === id);
			if (at === -1) return marks;
			if ((marks[at].detail ?? "") === value) return marks;
			return marks.map((each) => each.id === id ? {
				...each,
				detail: value
			} : each);
		}
		/**
		* Append one new mark to the list.
		* @param marks - every mark the surface holds.
		* @param mark - the mark just drawn.
		* @returns the new list.
		*/
		function appendedMarks(marks, mark) {
			return [...marks, mark];
		}
		/**
		* Drop one mark from the list.
		* @param marks - every mark the surface holds.
		* @param id - the mark to drop.
		* @returns the new list.
		*/
		function removedMarks(marks, id) {
			if (!marks.some((mark) => mark.id === id)) return marks;
			return marks.filter((mark) => mark.id !== id);
		}
		/**
		* What the surface holds once a saved document arrives over a draft.
		*
		* A figure is drawable as soon as it decodes, which does not wait for the annotation
		* read. A stroke drawn in that window was not in the draft the body was seeded with,
		* so adopting the saved marks wholesale threw it away — silently, with no step to walk
		* back to, and the reader watched a mark they had just drawn disappear.
		*
		* The file is still the record for everything the draft only guessed at. What survives
		* is exactly what the reader drew while the answer was in flight: a mark the seed did
		* not carry and the saved document does not name.
		* @param saved - the marks the saved document holds.
		* @param current - the marks on the surface now.
		* @param seeded - the marks the surface opened with.
		* @returns the saved marks followed by the ones drawn while the read was out.
		*/
		function loadedMarks(saved, current, seeded) {
			const seedIds = new Set(seeded.map((mark) => mark.id));
			const knownIds = new Set(saved.map((mark) => mark.id));
			const drawn = current.filter((mark) => !seedIds.has(mark.id) && !knownIds.has(mark.id));
			if (drawn.length === 0) return saved;
			return [...saved, ...drawn];
		}
		/**
		* The marks after a drag of one of them, or null when the drag did not move it.
		*
		* A drag that ends where it started is not an edit: the mark keeps the anchor it had,
		* and no undo step is recorded for a gesture that changed nothing.
		* @param marks - every mark the surface holds.
		* @param id - the mark that was dragged.
		* @param points - where it was dropped.
		* @param anchor - what it now sits on, or undefined when it hit nothing new.
		* @returns the new list, or null when nothing moved.
		*/
		function movedMarks(marks, id, points, anchor) {
			return draggedMarks(marks, id, points, anchor);
		}
		//#endregion
		//#region src/client/annotator/mark-labels.ts
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
		//#endregion
		//#region src/client/annotator/records.tsx
		/**
		* How close to the ceiling the count is shown from.
		*
		* A fraction that is on screen while there is nothing to worry about is a fraction
		* the reader learns to ignore; it appears when the note is nearly full, which is
		* when knowing the number is worth the space.
		*/
		const COUNT_WARNING_ROOM = 200;
		/**
		* The overall goal, as one fold.
		*
		* One per figure, so it is a fold of its own rather than a field beside one mark:
		* this is not a note about a place on the picture, it is what the picture is meant
		* to become.
		* @param props - the record's placement, text, and the two things it can do.
		* @returns the goal record.
		*/
		function SummaryRecord(props) {
			const { t } = props;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "da-float da-float-record da-float-goal",
				role: "group",
				"aria-label": t("summary"),
				style: recordStyle(props.at),
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
							props.onClose();
						},
						children: "✕"
					})]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
					className: "da-field",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
						value: props.summary,
						placeholder: t("summaryPlaceholder"),
						maxLength: MAX_SUMMARY_CHARS,
						onChange: (event) => {
							props.onWrite(event.target.value);
						}
					}), props.summary.length <= 4e3 - COUNT_WARNING_ROOM ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: "da-count",
						children: [
							props.summary.length,
							"/",
							MAX_SUMMARY_CHARS
						]
					})]
				})]
			});
		}
		/**
		* The map of the document: every mark it holds, numbered as the document numbers it.
		*
		* A page body lists the whole file, not its own sheet, because the list is what the
		* reader checks before sending — and what is sent is the file.
		* @param props - the list's placement, marks, and what the reader can do from it.
		* @returns the list record.
		*/
		function MarkList(props) {
			const { t } = props;
			const numbering = markOrdinals(props.marks);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "da-float da-float-record da-float-list",
				role: "group",
				"aria-label": t("marks"),
				style: recordStyle(props.at),
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "da-float-head",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: "da-card-title",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ListIcon, {}),
								t("marks"),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "da-count",
									children: props.marks.length
								})
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "da-btn da-btn-quiet",
							disabled: props.marks.length === 0,
							onClick: () => {
								props.onClear();
							},
							children: t("clear")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "da-btn da-btn-quiet",
							"aria-label": t("close"),
							title: t("close"),
							onClick: () => {
								props.onClose();
							},
							children: "✕"
						})
					]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "da-marks",
					children: props.marks.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
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
					}) : props.marks.map((mark) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "da-mark",
						"data-selected": mark.id === props.selectedId,
						onClick: () => {
							props.onReveal(mark);
						},
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "da-mark-n",
								children: numbering.get(mark.id)
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "da-mark-glyph",
								style: { color: mark.color },
								title: t("markKindLabel", { kind: t(TOOL_COPY[mark.kind]) }),
								children: ToolIcon(mark.kind)
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "da-mark-text",
								onClick: (event) => {
									event.stopPropagation();
									props.onReveal(mark);
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "da-mark-title",
									children: mark.detail !== void 0 && mark.detail.trim() !== "" ? mark.detail : t("emptyDetail")
								}), anchorName(mark) === "" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "da-mark-meta",
									children: anchorName(mark)
								})]
							}),
							mark.page === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "da-mark-page",
								children: t("markPage", { page: mark.page })
							}),
							props.canRemove(mark) ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "da-mark-del",
								"aria-label": t("delete"),
								title: t("delete"),
								onClick: (event) => {
									event.stopPropagation();
									props.onRemove(mark.id);
								},
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "da-mark-del-x",
									"aria-hidden": "true",
									children: "✕"
								})
							}) : null
						]
					}, mark.id))
				})]
			});
		}
		//#endregion
		//#region src/client/annotator/spotlights.ts
		/**
		* Every element the figure should be lit on right now.
		* @param input - the marks, the picker's preview, and the lookup to use.
		* @param input.marks - every mark the surface holds.
		* @param input.selectedId - the mark the reader picked out, if any.
		* @param input.preview - the element the picker is offering, if any.
		* @param input.findElement - turns an anchor's selector into an element, or
		*   undefined when the figure no longer has one by that name.
		* @returns what to light, in a stable enough order that the class work is minimal.
		*/
		function collectLitSpots(input) {
			const spots = [];
			const seen = /* @__PURE__ */ new Set();
			for (const mark of input.marks) {
				const selector = mark.kind === "element" ? mark.anchor?.selector : void 0;
				if (selector === void 0) continue;
				const element = input.findElement(selector);
				if (element === void 0 || seen.has(element)) continue;
				seen.add(element);
				spots.push({
					element,
					selected: input.selectedId === mark.id
				});
			}
			const previewSelector = input.preview?.selector;
			if (previewSelector !== void 0) {
				const element = input.findElement(previewSelector);
				if (element !== void 0 && !seen.has(element)) {
					seen.add(element);
					spots.push({
						element,
						selected: false
					});
				}
			}
			return spots;
		}
		//#endregion
		//#region src/client/annotator/weight-rail.tsx
		/**
		* The weight rail.
		* @param props - the value, where it sits on the track, and what it is sizing.
		* @returns the rail.
		*/
		function WeightRail(props) {
			const { t } = props;
			const label = t("weight");
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
				className: "da-weight",
				title: label,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
						type: "range",
						className: "da-weight-input",
						"aria-label": label,
						min: WEIGHT_MIN,
						max: 8,
						step: .1,
						value: props.value,
						onChange: (event) => {
							props.onChange(Number(event.target.value));
						}
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
						className: "da-weight-svg",
						viewBox: "0 0 18 100",
						preserveAspectRatio: "none",
						"aria-hidden": "true",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("linearGradient", {
							id: `${props.trackId}-shade`,
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
							fill: `url(#${props.trackId}-shade)`
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "da-weight-fill",
						"aria-hidden": true,
						style: { height: travelHeight(props.fraction) }
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "da-weight-knob",
						"aria-hidden": true,
						style: { bottom: `calc(${travelHeight(props.fraction)} - var(--da-knob-size) / 2)` }
					})
				]
			});
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
			const t = (0, react.useCallback)((key, vars) => resolveTranslate(props, key, vars), [props.t, props.localeId]);
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
			* The elements this body is currently lighting, if any.
			*
			* A ref rather than state: the light is a class on figure elements, which React does
			* not render, and putting it in state would re-render every mark on the figure to say
			* where the pointer is. It only ever holds what this body put the class on, so the
			* light is taken off exactly the elements it was put on.
			*
			* Two kinds of light share this list: the preview the picker shines on the element a
			* click would take, and the light an element *mark* keeps for as long as it is on the
			* figure. The preview is derived fresh on each move; the marks' lights are rebuilt
			* from the annotation whenever it changes.
			*/
			const litRef = (0, react.useRef)([]);
			/**
			* The element the picker is offering right now, if any.
			*
			* Held beside `litRef` because the two answer different questions: this one is what
			* the pointer is over, and `litRef` is everything currently wearing the light —
			* which includes every element mark on the figure. Rebuilding the whole list on each
			* pointer move needs to know what the preview was, and this is it.
			*/
			const hovered = (0, react.useRef)(void 0);
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
			const chrome = props.chrome !== false;
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
			/**
			* The marks and the trail behind them, as one machine.
			*
			* Kept together because no edit touches only one of the three: a commit pushes the
			* old marks onto the trail and drops the redo, an undo swaps a step across. Held as
			* separate state the surface could be left in a shape the reader never produced.
			*/
			const history = useAnnotationHistory(props.draft?.marks ?? []);
			const marks = history.marks;
			/**
			* What the list shows.
			*
			* One page of a paged document is handed the whole file's marks, because the list
			* is the map of what is about to be sent and what is sent is the file. A body
			* mounted on its own has only its own marks to show, which is the same thing said
			* with nothing extra.
			*/
			const listedMarks = props.documentMarks ?? marks;
			const [ownSelectedId, setOwnSelectedId] = (0, react.useState)(null);
			/**
			* The selection, kept by the owner when there is one.
			*
			* A column mounts one body per page and moves the chrome between them as the
			* reader scrolls; a selection held here would be dropped at every page boundary,
			* and the comment pill would vanish under the sentence it belongs to.
			*/
			const selectedId = props.selectedId === void 0 ? ownSelectedId : props.selectedId;
			/**
			* The selection, readable from a callback built by an earlier render.
			*
			* An updater has to read the selection as it is when it runs, not as it was when
			* the callback holding it was built: `removeMark` captures its dependencies once,
			* and a stale closure made it compare against a selection from before the reader
			* picked the row next to the one being deleted. Writing the value through a ref
			* keeps one stable callback honest without rebuilding it on every click.
			*/
			const selectedRef = (0, react.useRef)(selectedId);
			selectedRef.current = selectedId;
			const setSelectedId = (0, react.useCallback)((next) => {
				const value = typeof next === "function" ? next(selectedRef.current) : next;
				if (props.onSelectedIdChange === void 0) setOwnSelectedId(value);
				else props.onSelectedIdChange(value);
			}, [props.onSelectedIdChange]);
			/** The mark whose detail box should take the caret once it is on screen. */
			const [focusId, setFocusId] = (0, react.useState)(null);
			/**
			* Ask the owner to turn to a mark's page, when this body is one page of a document.
			*
			* The list is the document's, so a row can name a mark that is not on the page in
			* view. The owner keeps the page number, so it is the owner that has to turn —
			* and it must happen before the selection lands, or the pill would be measured
			* against a page the mark is not on.
			*/
			const revealOnPage = (0, react.useCallback)((mark) => {
				if (props.onRevealMark === void 0 || mark.page === void 0) return;
				props.onRevealMark(mark);
			}, [props.onRevealMark]);
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
			* Which popover is showing, if any.
			*
			* One at a time, and this is deliberate: they all hang off the same strip near the
			* figure's edge, so two of them open at once simply cover each other and the
			* second one's own close button. Opening any popover closes whatever was open;
			* opening the one already showing closes it, so the button toggles.
			*/
			const [ownPanel, setOwnPanel] = (0, react.useState)(null);
			/** The open card, kept by the owner when there is one, for the reason above. */
			const openPanel = props.openPanel === void 0 ? ownPanel : props.openPanel;
			const setOpenPanel = (0, react.useCallback)((next) => {
				const value = typeof next === "function" ? next(openPanel) : next;
				if (props.onOpenPanelChange === void 0) setOwnPanel(value);
				else props.onOpenPanelChange(value);
			}, [openPanel, props.onOpenPanelChange]);
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
			/**
			* The factor this figure is drawn at.
			*
			* An owner that magnifies the whole document hands the factor in and takes every
			* gesture back, so the size follows the reader from page to page instead of
			* restarting at fit on each sheet. A body mounted alone keeps its own.
			*/
			const [ownZoom, setOwnZoom] = (0, react.useState)("fit");
			const zoom = props.zoom ?? ownZoom;
			const setZoom = (0, react.useCallback)((next) => {
				if (props.onZoom === void 0) setOwnZoom(next);
				else props.onZoom(next);
			}, [props.onZoom]);
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
			/** Where the figure's context menu was asked for, or null when it is closed. */
			const [menuAt, setMenuAt] = (0, react.useState)(null);
			/** Whether this Host can open and reveal paths; read once per mount. */
			const [canOpen, setCanOpen] = (0, react.useState)(false);
			const menuRef = (0, react.useRef)(null);
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
			const paletteRef = (0, react.useRef)(null);
			const [dragging, setDragging] = (0, react.useState)(false);
			const dragFrom = (0, react.useRef)(null);
			/** The palette's box, in percentages of the panel. */
			const paletteStyle = placementStyle(palette ?? DEFAULT_PALETTE);
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
			const followPointer = (0, react.useCallback)((event, from, write, strip) => {
				const held = from.current;
				const root = strip?.offsetParent ?? rootRef.current;
				/* v8 ignore next */
				if (held === null || root === null || !(root instanceof Element)) return;
				write(draggedSpot(held, event, root.getBoundingClientRect(), {
					width: strip?.offsetWidth ?? 0,
					height: strip?.offsetHeight ?? 0
				}));
			}, []);
			const dragPalette = (0, react.useCallback)((event) => {
				followPointer(event, dragFrom, setPalette, paletteRef.current);
			}, [followPointer]);
			const dragBar = (0, react.useCallback)((event) => {
				followPointer(event, barFrom, setBarSpot, barRef.current);
			}, [followPointer]);
			/**
			* The palette's drag, as one bundle.
			*
			* A strip's handle takes four handlers that all have to agree about the same
			* press, and the two strips differ only in which ref and which setter they use —
			* so each bundle is assembled once here rather than inline in the markup, where
			* the press would be remembered against whichever render happened to be current.
			*/
			const paletteHandle = {
				dragging,
				onDown: (event) => {
					/* v8 ignore next -- nothing to measure against until the panel is mounted. */
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
				onMove: dragPalette,
				onUp: (event) => {
					/* v8 ignore next -- jsdom has no pointer capture; a browser always does. */
					event.currentTarget.releasePointerCapture?.(event.pointerId);
					dragFrom.current = null;
					setDragging(false);
				},
				onCancel: () => {
					dragFrom.current = null;
					setDragging(false);
				}
			};
			/** The bar's drag, on the same terms as the palette's. */
			const barHandle = {
				dragging: barDragging,
				onDown: (event) => {
					/* v8 ignore next -- nothing to measure against until the panel is mounted. */
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
				onMove: dragBar,
				onUp: (event) => {
					/* v8 ignore next -- jsdom has no pointer capture; a browser always does. */
					event.currentTarget.releasePointerCapture?.(event.pointerId);
					barFrom.current = null;
					setBarDragging(false);
				},
				onCancel: () => {
					barFrom.current = null;
					setBarDragging(false);
				}
			};
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
			const barStyle = barSpot === void 0 ? void 0 : placementStyle(barSpot);
			(0, react.useEffect)(() => {
				ensureStyles(document);
			}, []);
			const data = props.content?.kind === "bytes" ? props.content.data : void 0;
			const layer = (0, react.useMemo)(() => figureLayer(figure, rasterSize), [figure, rasterSize]);
			/**
			* The surface's measurable size; null until its content and dimensions are both
			* known. A rendered document is measurable as soon as its width is — the frame
			* reports how tall its content is, and until it does the surface has no height.
			*/
			const size = (0, react.useMemo)(() => figureSize(figure, rasterSize, htmlHeight), [
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
				const loaded = decodeFigure(data, mediaType).figure;
				if (loaded === void 0) {
					setFigureError(t("loadFailed"));
					return;
				}
				if (loaded.kind === "html") {
					setHtmlHeight(0);
					setFigureError(null);
				}
				if (loaded.kind === "raster") setFileRasterSize(null);
				setFileFigure(loaded);
				if (loaded.kind !== "raster") return;
				return () => {
					URL.revokeObjectURL(loaded.objectUrl);
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
			/**
			* The address this body last read an annotation for.
			*
			* The panel is registered once and not remounted per document, so this body can
			* outlive the figure it was opened on. Reading for a new address is therefore not
			* the same event as reading for the first time: the first read adopts what was
			* saved over whatever draft this body was seeded with, while a read for a
			* *different* document has to throw the previous one's state away first. Null
			* means "no read yet", which no address can be.
			*/
			const readFor = (0, react.useRef)(null);
			/**
			* The marks the surface opened with, for telling a stroke from a restored one.
			*
			* The read adopts the file over the draft, and the only marks that must survive that
			* are the ones drawn while the answer was in flight: not the seeded draft, which the
			* file supersedes, and not anything the file names. Kept in a ref so the read effect
			* does not fetch again when a stroke changes the marks.
			*/
			const seeded = (0, react.useRef)(props.draft?.marks ?? []);
			/**
			* The selection setter, read at call time.
			*
			* `setSelectedId` is rebuilt when the selection changes, so depending on it in the
			* read effect would fetch the annotation again on every press. The effect wants the
			* current setter, not the one it closed over.
			*/
			const selectRef = (0, react.useRef)(setSelectedId);
			selectRef.current = setSelectedId;
			(0, react.useEffect)(() => {
				if (isPage) return;
				if (address === "" || mediaType === void 0) return;
				const controller = new AbortController();
				(async () => {
					try {
						const result = await loadAnnotation(address, controller.signal);
						if (controller.signal.aborted) return;
						const first = readFor.current === null;
						const replaces = readFor.current !== null && readFor.current !== address;
						readFor.current = address;
						setLoaded(result);
						setHostError(null);
						const saved = result.annotation;
						if (replaces) {
							history.reset(saved?.marks ?? []);
							writeSummary(saved?.summary ?? "");
							setCreatedAt(saved?.createdAt ?? null);
							selectRef.current(null);
							writtenSignature.current = null;
						} else if (first && saved !== null) {
							history.replace(loadedMarks(saved.marks, live.current.marks, seeded.current));
							writeSummary(saved.summary ?? "");
							setCreatedAt(saved.createdAt);
						}
						setStale(saved === null ? false : saved.figure.sha256 !== result.sha256);
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
			const scale = (0, react.useMemo)(() => drawingScale({
				zoom,
				fitWidth,
				surface: paper,
				ownerWidth: props.fitWidth
			}), [
				zoom,
				fitWidth,
				paper,
				props.fitWidth
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
				const paletteBox = obstacleBox(paletteRef.current, {
					left: panel.left,
					top: panel.top
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
				}, size.width), panel.width, panel.height, pillSize, paletteBox);
				setDetailAt((previous) => previous !== null && previous.left === at.left && previous.top === at.top ? previous : at);
			}, [
				htmlHeight,
				liveMark,
				marks,
				palette,
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
					clientHeight: stage.clientHeight,
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
				* The wheel is the magnification, whatever modifier it carries.
				*
				* It used to be two gestures in one: a plain wheel panned the scrollport, and
				* only a ctrl-modified one — which is how a trackpad reports a pinch — zoomed.
				* That split is what made the gesture ambiguous: over a page that fits the pane
				* there is nothing to scroll, so a plain wheel looks like a request for another
				* page, while the reader who wants a closer look makes exactly the same motion.
				* One motion, one meaning: up magnifies, down shrinks, and a pinch arrives as the
				* same thing with a modifier on it.
				*
				* Panning is still there — a drag with the select tool moves the view — so
				* nothing is lost by taking the wheel's second job away from it.
				*/
				const onWheel = (event) => {
					event.preventDefault();
					zoomAt(liveScale.current * wheelZoomFactor(event.deltaY, event.deltaMode, stage.clientHeight), event.clientX, event.clientY);
				};
				stage.addEventListener("wheel", onWheel, { passive: false });
				return () => {
					stage.removeEventListener("wheel", onWheel);
				};
			}, [zoomAt]);
			const { commit } = history;
			const addMark = (0, react.useCallback)((mark) => {
				commit(appendedMarks(marks, mark));
			}, [commit, marks]);
			const removeMark = (0, react.useCallback)((id) => {
				commit(removedMarks(marks, id));
				setSelectedId((current) => current === id ? null : current);
			}, [
				commit,
				marks,
				setSelectedId
			]);
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
				history.amend((current) => detailedMarks(current, id, value));
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
				commit(patchedMarks(marks, id, patch));
			}, [commit, marks]);
			/**
			* Put a dragged mark where it was dropped.
			*
			* A drag that ends where it started is not an edit: the mark keeps the anchor
			* it had, and no undo step is recorded for a gesture that changed nothing.
			*/
			const moveMark = (0, react.useCallback)((id, points, anchor) => {
				const next = movedMarks(marks, id, points, anchor);
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
			const { undo, redo } = history;
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
			/**
			* Rasterize the picture the message is about.
			*
			* The marks handed in are the ones being sent, not the ones on the panel. Those are
			* the same thing for a whole-figure hand-off and deliberately not the same for a
			* one-mark one: a picture of the whole surface shipped beside a message naming one
			* mark handed the agent a record containing marks the reader had left behind, and
			* numbered from the picture's own order while the prose numbered from the document's
			* — so the two disagreed about which mark was which.
			* @param target - the figure layer to place under the marks.
			* @param sending - the marks this picture is about.
			* @param numbering - each mark's number in the document the reader is reading.
			* @returns the PNG bytes.
			*/
			const exportPng = (0, react.useCallback)(async (target, sending = marks, numbering) => {
				const svg = composeReviewSvg(target, sending, numbering);
				const paper = reviewSize(target, sending);
				const exportScale = Math.min(2, Math.max(1, 2400 / Math.max(paper.width, paper.height)));
				return await rasterizePng(svg, paper.width, paper.height, exportScale);
			}, [marks]);
			const buildDocument = (0, react.useCallback)((target, scope = marks) => {
				if (loaded === null) return null;
				return buildAnnotationDocument({
					figure: {
						address,
						path: loaded.path,
						mediaType: loaded.mediaType,
						sha256: loaded.sha256
					},
					size: target,
					marks: scope,
					summary,
					createdAt,
					now: (/* @__PURE__ */ new Date()).toISOString()
				});
			}, [
				address,
				createdAt,
				loaded,
				marks,
				summary
			]);
			/**
			* Take back a save failure once a write has gone through.
			*
			* The line was only ever written, never cleared: one failed save — a full disk, a
			* host hiccup — left `保存标注失败` on screen while every write after it succeeded
			* silently. The reader then either redid work that was already saved or gave up on
			* an annotation that was saving fine. Only a failure is taken back here; a line
			* saying a handoff went through is news of its own and is not this one's to drop.
			*/
			const clearSaveError = (0, react.useCallback)(() => {
				setStatus((current) => current !== null && current.tone === "error" ? null : current);
			}, []);
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
						clearSaveError();
						return;
					}
					const signature = annotationSignature(state.marks, state.summary);
					if (signature === writtenSignature.current) return;
					const document = buildAnnotationDocument({
						figure: {
							address: state.address,
							path: state.loaded.path,
							mediaType: state.loaded.mediaType,
							sha256: state.loaded.sha256
						},
						size: state.size,
						marks: state.marks,
						summary: state.summary,
						createdAt: state.createdAt,
						now: (/* @__PURE__ */ new Date()).toISOString()
					});
					await saveAnnotation(state.address, document, void 0, true);
					writtenSignature.current = signature;
					clearSaveError();
				},
				onError: (error) => {
					setStatus(failureStatus(t, "saveError", error));
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
				await autosave.current?.drained();
				writtenSignature.current = null;
				try {
					await deleteAnnotation(address);
				} catch (error) {
					setStatus(failureStatus(t, "clearError", error));
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
			* Clear this surface's annotation — or, on one page of a document, the document's.
			*
			* A page body cannot clear by itself. Its `discard` reaches one sidecar and one
			* draft, which on a paged document is the file all the pages share: emptying the
			* page in view while the other pages keep rows in the list, with their sidecar
			* deleted underneath them. The owner keeps the pages, so the owner decides what
			* clearing means — the same reason the send goes up rather than running here.
			*/
			const clearAnnotation = (0, react.useCallback)(async () => {
				if (props.onDocumentClear !== void 0) {
					props.onDocumentClear();
					return;
				}
				await discard();
			}, [discard, props.onDocumentClear]);
			/**
			* Save the annotation and hand it somewhere: to the agent, or into the draft.
			*
			* The Host writes `<name>.annot.json` and a derived `<name>.annotated.png` beside
			* the figure, and the reader's original stays as it was.
			*
			* What happens to the marks afterwards depends on what was sent. A whole-figure
			* hand-off has delivered everything the sidecar described, so the sidecars are
			* deleted and the surface cleared: leaving them would make the reader clear the
			* same work twice. A hand-off of *one* mark has delivered that mark only, so it
			* leaves the surface and the sidecar holding the rest — the reader pressed a
			* button beside one sentence, and one sentence is what it meant.
			* @param target - who receives the annotation.
			* @param only - the single mark being sent, or undefined to send them all.
			*/
			const run = (0, react.useCallback)(async (target, only) => {
				const scope = only === void 0 ? marks : [only];
				if (scope.length === 0) {
					setStatus(handoffRefused(t, "noMarks"));
					return;
				}
				if (size === null || size.height <= 0) {
					setStatus(handoffRefused(t, "noFigure"));
					return;
				}
				setBusy("sending");
				setStatus(handoffStarted(t, target));
				try {
					if (sessionId === void 0) throw new Error("the figure address carries no session");
					if (target === "composer" && props.conversation === void 0) throw new Error("the conversation service is unavailable");
					if (target === "agent" && props.sessions === void 0) throw new Error("the sessions service is unavailable");
					const document_ = buildDocument(size, scope);
					if (document_ === null) throw new Error(t("loadFailed"));
					const review = layer === null || !needsReviewImage(document_) ? void 0 : await exportPng(layer, scope);
					const saved = await saveAnnotation(address, document_, review);
					autosave.current?.cancel();
					writtenSignature.current = annotationSignature(document_.marks, document_.summary ?? "");
					setCreatedAt(document_.createdAt);
					setStale(false);
					const pageImages = review === void 0 ? [] : [{
						page: 1,
						image: review
					}];
					const locale = (props.localeId ?? "zh").startsWith("en") ? "en" : "zh";
					if (target === "composer" && props.conversation !== void 0) deliverToComposer({
						conversation: props.conversation,
						sessionId,
						document: document_,
						paths: saved,
						files: pageImages.map((entry) => new File([entry.image], `page-${entry.page}.png`, { type: "image/png" })),
						locale
					});
					else if (props.sessions !== void 0) await deliverAnnotation({
						sessions: props.sessions,
						fileUpload: void 0,
						sessionId,
						document: document_,
						paths: saved,
						pageImages,
						annotatedPdf: void 0,
						locale
					});
					if (only === void 0) {
						setStatus(handoffDelivered(t, target));
						await discard();
						return;
					}
					commit(removedMarks(marks, only.id));
					setSelectedId(null);
					autosave.current?.schedule();
					setStatus(handoffDeliveredOne(t, target));
				} catch (error) {
					setStatus(failureStatus(t, "saveError", error));
				} finally {
					setBusy(null);
				}
			}, [
				address,
				buildDocument,
				commit,
				discard,
				exportPng,
				layer,
				marks,
				props.conversation,
				props.localeId,
				props.sessions,
				sessionId,
				setSelectedId,
				size,
				t
			]);
			/**
			* Hand the sentence beside one mark to someone.
			*
			* The pill's two buttons are the only gesture that means one mark rather than the
			* document, and they mean it on every surface. A body that owns its own save says
			* so itself; a page body's save belongs to the document, which is the only half
			* that can write a sidecar holding the other pages, so the mark travels up. What
			* must not happen — and did — is the page body running its own whole-document path
			* and failing on a figure it never loaded.
			* @param mark - the mark whose sentence is being sent.
			* @param target - who receives it.
			*/
			const sendOne = (0, react.useCallback)(async (mark, target) => {
				if (props.onSendMark !== void 0) {
					props.onSendMark(mark, target);
					return;
				}
				await run(target, mark);
			}, [props.onSendMark, run]);
			/**
			* Probe the Host once, so the menu can offer the gestures it can perform.
			*
			* `canOpenWorkspacePath` answers for the whole page, and a probe that fails is
			* the same answer as "no desktop": rows that would fail every time are left out
			* rather than shown and refused.
			*/
			(0, react.useEffect)(() => {
				let live = true;
				desktopAvailable(props.remote).then((available) => {
					if (live) setCanOpen(available);
				});
				return () => {
					live = false;
				};
			}, [props.remote]);
			/**
			* The rows this figure's menu offers, decided once per figure and Host.
			*
			* Empty until a figure has loaded: the rows all name its path, so there is
			* nothing to offer before there is one.
			*/
			const menuItems = (0, react.useMemo)(() => {
				if (loaded === null) return [];
				return figureMenuItems({
					canOpen,
					canSend: !isPage && marks.length > 0 && busy === null,
					hasRelative: relativeTo(loaded.path, loaded.workspace) !== null,
					hasImage: layer !== null
				}, {
					sendToAgent: t("menuSendToAgent"),
					sendToComposer: t("menuSendToComposer"),
					open: t("menuOpen"),
					reveal: t("menuReveal"),
					copyImage: t("menuCopyImage"),
					copyRelative: t("menuCopyRelative"),
					copyAbsolute: t("menuCopyAbsolute")
				});
			}, [
				busy,
				canOpen,
				isPage,
				layer,
				loaded,
				marks.length,
				t
			]);
			/**
			* Open the menu at the pointer, kept inside the window.
			* @param event - the right-click on the figure.
			*/
			const openMenu = (0, react.useCallback)((event) => {
				/* v8 ignore next -- nothing to act on until a figure loaded. */
				if (loaded === null) return;
				event.preventDefault();
				const placed = clampMenu({
					x: event.clientX,
					y: event.clientY
				}, {
					width: window.innerWidth,
					height: window.innerHeight
				}, menuSize(menuItems.length));
				setMenuAt({
					...placed,
					path: loaded.path,
					workspace: loaded.workspace
				});
			}, [loaded, menuItems]);
			(0, react.useEffect)(() => {
				if (menuAt === null) return;
				const onDown = (event) => {
					if (pressedInsideMenu(event, menuRef.current)) return;
					setMenuAt(null);
				};
				const onKey = (event) => {
					if (event.key !== "Escape") return;
					event.stopPropagation();
					setMenuAt(null);
				};
				document.addEventListener("pointerdown", onDown, true);
				document.addEventListener("keydown", onKey);
				return () => {
					document.removeEventListener("pointerdown", onDown, true);
					document.removeEventListener("keydown", onKey);
				};
			}, [menuAt]);
			/**
			* Carry out one menu row.
			*
			* The two copies are the only rows that touch the clipboard, and they say so in
			* the status line: a copy with no feedback reads as a menu that did nothing.
			* @param id - the row the reader picked.
			* @param path - the figure's own path, as the Host named it.
			* @param workspace - the session's working directory, when there is one.
			*/
			const runMenu = (0, react.useCallback)((id, path, workspace) => {
				setMenuAt(null);
				if (id === "sendToAgent") {
					run("agent");
					return;
				}
				if (id === "sendToComposer") {
					run("composer");
					return;
				}
				if (id === "open") {
					openOnDesktop(props.remote, path).then((ok) => {
						setStatus(hostGestureStatus(t, ok, "menuOpened", "menuOpenFailed"));
					});
					return;
				}
				if (id === "reveal") {
					revealOnDesktop(props.remote, path).then((ok) => {
						setStatus(hostGestureStatus(t, ok, "menuRevealed", "menuRevealFailed"));
					});
					return;
				}
				if (id === "copyImage") {
					/* v8 ignore next -- the row is only offered for a figure that has a layer. */
					if (layer === null) return;
					exportPng(layer).then(async (image) => {
						const copied = await copyImageToClipboard(image);
						setStatus(clipStatus(t, copied));
					}, () => {
						setStatus(clipStatus(t, false));
					});
					return;
				}
				const text = copiedText(id, path, workspace);
				/* v8 ignore next */
				if (text === null) return;
				navigator.clipboard.writeText(text).then(() => {
					setStatus(clipStatus(t, true));
				}, () => {
					setStatus(clipStatus(t, false));
				});
			}, [
				exportPng,
				layer,
				props.remote,
				run,
				t
			]);
			/** Whether this body holds a rendered document rather than a figure file. */
			const isHtml = mediaType === "text/html";
			/** Name what one figure point landed on, for a surface that holds its own elements. */
			const anchorAtFigurePoint = (0, react.useCallback)((x, y) => anchorInDocument(frameRef.current?.contentDocument, x, y), []);
			/**
			* Light the element a click would take, in the figure's own shapes.
			*
			* The picker says which element by name — the selector the anchor already carries —
			* and this turns that name back into the element, in whichever document the figure's
			* elements live. An inline SVG's are in this panel's document, rooted at the host
			* the markup was injected into; a rendered document's are inside its frame, where
			* the rule for the light has to be written into the figure's own stylesheet first,
			* because that document's policy keeps the panel's stylesheet out.
			*
			* `undefined` puts the light out, which is what leaving the figure and putting the
			* picker away both mean.
			*/
			/**
			* The element a selector names, in whichever document the figure's elements live.
			*
			* An inline SVG's elements are in this panel's document, rooted at the host the
			* markup was injected into; a rendered document's are inside its frame, where the
			* rule for the light has to be written into the figure's own stylesheet first,
			* because that document's policy keeps the panel's stylesheet out.
			*
			* @param selector - the element's name, as an anchor spells it.
			* @returns the element, or undefined when the figure no longer has one by that name.
			*/
			const findElement = (0, react.useCallback)((selector) => {
				/* v8 ignore start -- a body only asks once its figure has mounted, so neither ref is empty here. */
				if (isHtml) {
					const doc = frameRef.current?.contentDocument ?? null;
					if (doc === null) return void 0;
					ensureSpotlight(doc);
					return elementAt({
						root: doc,
						selector
					});
				}
				const host = figureHostRef.current;
				return host === null ? void 0 : elementAt({
					root: host,
					selector
				});
				/* v8 ignore stop */
			}, [isHtml]);
			/**
			* Every element the figure should be lit on right now.
			*
			* Two things are lit, and they are different kinds of statement: an element *mark*
			* keeps its light for as long as the mark exists — that is how a placed element is
			* drawn at all, since it has no path of its own — and the picker's preview lights
			* whatever a click would take, on top of those. The selected mark is lit harder.
			*
			* Built fresh rather than accumulated: the marks change, the figure is reloaded, and
			* a list patched in place would keep lighting elements that are no longer there.
			*
			* @param preview - the element the picker is offering, if any.
			* @returns what to light, in a stable enough order that the class work is minimal.
			*/
			const litSpots = (0, react.useCallback)((preview) => collectLitSpots({
				marks,
				selectedId,
				preview,
				findElement
			}), [
				findElement,
				marks,
				selectedId
			]);
			/**
			* Hand the light to whatever the current state says should wear it.
			*
			* `figure` is in the dependency list because the elements the light goes on are the
			* figure's own, and they do not exist until it has mounted: the marks file can arrive
			* before the figure does, and without re-running on the figure's arrival every element
			* mark would stay dark until something else happened to move.
			*/
			const lightUp = (0, react.useCallback)((preview) => {
				litRef.current = moveSpotlight(litRef.current, litSpots(preview));
			}, [litSpots]);
			(0, react.useEffect)(() => {
				if (!isHtml) ensureSpotlight(document);
			}, [isHtml]);
			(0, react.useEffect)(() => {
				lightUp(hovered.current);
			}, [lightUp, figure]);
			(0, react.useEffect)(() => () => {
				moveSpotlight(litRef.current, []);
				litRef.current = [];
			}, []);
			const lightElement = (0, react.useCallback)((anchor) => {
				hovered.current = anchor;
				lightUp(anchor);
			}, [lightUp]);
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
				"data-tone": "error",
				role: "alert",
				children: figureError
			});
			/**
			* Press a row of the list: show that mark and put the pill beside it.
			*
			* The selection goes first and the page turn second, because a turn remounts this
			* body for another page and the mark has to already be the one selected when the
			* new page's pill is measured — otherwise the row would turn the page and leave
			* the reader with nothing to read on it.
			*/
			const reveal = (mark) => {
				setSelectedId(mark.id);
				revealOnPage(mark);
			};
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
			const shownWeight = railWeight(selected, tool, weight);
			/**
			* How far up the rail that value sits, from 0 at the lightest to 1 at the heaviest.
			*
			* One number for the fill, the knob and the input: computed three times the three
			* could round differently and the knob would sit a pixel off the fill it belongs to.
			*/
			const weightFraction = railFraction(shownWeight);
			/**
			* Change one attribute of the selected mark, or of the next stroke when nothing
			* is selected.
			*
			* A control already at the mark's value leaves the list untouched, so a press
			* that changes nothing records no undo step.
			* @param patch - the attribute to change.
			*/
			const repaintSelected = (mark, patch) => {
				if (patchChangesNothing(mark, patch)) return;
				commit(patchedMarks(marks, mark.id, patch));
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
			const surfaceStyle = surfaceBoxStyle(paper, scale);
			/**
			* The paper at its unscaled size, with the figure placed at its own offset on it.
			*
			* The whole paper is scaled by one transform rather than each part scaling itself,
			* so the figure and the overlay cannot drift apart at a fractional factor — which
			* at 60% is exactly what a mark drawn on a line work and a mark drawn on paper
			* would do.
			*/
			const paperStyle = paperTransformStyle(paper, scale);
			const figureStyle = figurePlacementStyle(paper, size);
			const chromeStrips = /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ToolPalette, {
				stripRef: paletteRef,
				style: paletteStyle,
				handle: paletteHandle,
				tools: isVector || isHtml ? TOOLS : TOOLS.filter((entry) => !ELEMENT_TOOLS.has(entry.tool)),
				tool,
				onChoose: setTool,
				t
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(FigureBar, {
				stripRef: barRef,
				style: barStyle,
				parked: barSpot !== void 0,
				handle: barHandle,
				pagingSlot: props.pagingSlot,
				shownColor,
				styleOpen,
				foldOpensDown,
				onToggleStyle: () => {
					setOpenPanel((open) => open === "style" ? null : "style");
				},
				onChooseColor: chooseColor,
				goalOpen,
				summary,
				onToggleGoal: () => {
					setOpenPanel((open) => open === "goal" ? null : "goal");
				},
				listOpen,
				listedMarks,
				onToggleList: () => {
					setOpenPanel((open) => open === "list" ? null : "list");
				},
				pastCount: history.depth.past,
				futureCount: history.depth.future,
				undo,
				redo,
				isPage,
				onSend: props.onSend,
				sendToAgent: () => {
					if (props.onSend === void 0) run("agent");
					else props.onSend("agent");
				},
				sendToComposer: () => {
					if (props.onSend === void 0) run("composer");
					else props.onSend("composer");
				},
				busy: busy !== null,
				t
			})] });
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "da-root",
				ref: rootRef,
				children: [
					hostError === null ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "da-status",
						"data-tone": "error",
						children: `${t("readError")}${hostError}`
					}),
					loaded === null || loaded.unreadable.length === 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "da-status",
						"data-tone": "error",
						children: `${t("annotationUnreadable")}${loaded.unreadable.join(", ")}`
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
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(FigureRoom, {
						stageRef: attachStage,
						surfaceRef,
						paperRef,
						figureRef,
						hostRef: figureHostRef,
						frameRef,
						surfaceStyle,
						paperStyle,
						figureStyle,
						figure,
						size,
						htmlHeight,
						stageClass: {
							hand: tool === "select",
							panning
						},
						onContextMenu: openMenu,
						onRasterLoad: setFileRasterSize,
						overlay: paper === null || size === null ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Canvas, {
							width: paper.width,
							height: paper.height,
							origin: [-paper.x, -paper.y],
							figureSize: size,
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
							onHover: lightElement,
							onEdit: editMark,
							onDrawn: finishDrawing,
							onLiveEdit: setLiveMark,
							numbering: props.numbering
						}),
						t
					}),
					menuAt === null ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(FigureMenuCard, {
						menuRef,
						at: {
							left: menuAt.left,
							top: menuAt.top
						},
						rows: menuItems,
						onChoose: (id) => {
							/* v8 ignore next -- a row is only offered once a figure has loaded. */
							if (menuAt === null) return;
							runMenu(id, menuAt.path, menuAt.workspace);
						},
						t
					}),
					goalOpen ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SummaryRecord, {
						at: floatsAt,
						summary,
						onWrite: writeSummary,
						onClose: () => {
							setOpenPanel(null);
						},
						t
					}) : null,
					listOpen ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MarkList, {
						at: floatsAt,
						marks: listedMarks,
						selectedId,
						onReveal: reveal,
						onRemove: removeMark,
						canRemove: (mark) => mark.page === void 0 || marks.some((own) => own.id === mark.id),
						onClear: () => {
							clearAnnotation();
						},
						onClose: () => {
							setOpenPanel(null);
						},
						t
					}) : null,
					selected === null || detailAt === null ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(DetailPill, {
						pillRef,
						inputRef: detailRef,
						at: {
							left: detailAt.left,
							top: detailAt.top
						},
						mark: selected,
						onWrite: (value) => {
							setMarkDetail(selected.id, value);
						},
						onSendToAgent: () => {
							sendOne(selected, "agent");
						},
						onSendToComposer: () => {
							sendOne(selected, "composer");
						},
						busy: busy !== null,
						t
					}),
					!chrome || shownWeight === null ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(WeightRail, {
						trackId,
						value: shownWeight,
						fraction: weightFraction,
						onChange: chooseWeight,
						t
					}),
					!chrome ? null : props.chromeHost === void 0 || props.chromeHost === null ? chromeStrips : (0, react_dom.createPortal)(chromeStrips, props.chromeHost)
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
			const numbering = markOrdinals(document.marks);
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
		/**
		* The line a note on this hunk is really about.
		*
		* The hunk's `oldStart` includes up to three lines of leading context, so it is up to
		* three lines short of the edit. A pure insertion has no line of its own in the older
		* file, so it names the line the new text follows.
		* @param hunk - the hunk being annotated.
		* @returns the 1-based older line the change is at.
		*/
		function changeAt(hunk) {
			return hunkChange(hunk).at;
		}
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
								children: t("hunkNote", { line: changeAt(hunk) })
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: "text",
								value: notes[hunkKey(hunk)] ?? "",
								placeholder: t("hunkNotePlaceholder"),
								onChange: (event) => {
									onNote(hunkKey(hunk), event.target.value);
								}
							})]
						})
					]
				}, `${hunk.oldStart}-${hunk.newStart}-${index}`))
			});
		}
		//#endregion
		//#region src/client/markdown/edit.ts
		/**
		* The reader's edit, and what it is a difference against.
		*
		* An edit is the pair — the text editing began from, and its current value — or there
		* is no edit. Holding it as one value is what makes "a draft without its baseline"
		* unrepresentable: the difference is only ever computed between two texts that both
		* exist, so the diff view cannot be asked to describe a change it has no original for.
		*
		* The types and the two derived queries live here rather than in the body because the
		* body is markup and wiring; this is the part that has a rule in it.
		* @module dsh-figmark/client/markdown/edit
		*/
		/** The caret at the very start of a document. */
		const START_CARET = {
			line: 1,
			column: 1
		};
		/** No notes, as the one value the reader's empty state reuses. */
		const NO_NOTES = {};
		/**
		* The difference one edit stands for.
		* @param edit - the reader's edit, or null when they have not changed anything.
		* @returns the difference; the empty one when there is no edit.
		*/
		function diffOf(edit) {
			return edit === null ? EMPTY_DIFF : diffLines(edit.baseline, edit.text);
		}
		/**
		* The text the editor shows.
		* @param edit - the reader's edit, or null when they have not changed anything.
		* @param loaded - the text the owner delivered, when it has.
		* @returns the edit's text, else the loaded text, else nothing.
		*/
		function editedText(edit, loaded) {
			return edit?.text ?? loaded ?? "";
		}
		/**
		* How many lines a text has.
		* @param text - the text to count.
		* @returns its line count.
		*/
		function lineCount(text) {
			return textLines(text).length;
		}
		/**
		* The caret a text field just reported, in lines and columns.
		* @param element - the textarea whose selection moved.
		* @returns the caret, 1-based on both axes.
		*/
		function caretIn(element) {
			const head = element.value.slice(0, element.selectionStart);
			return {
				line: head.split("\n").length,
				column: Array.from(head.slice(head.lastIndexOf("\n") + 1)).length + 1
			};
		}
		/**
		* One keystroke's worth of edit.
		*
		* The first change is the one that remembers the baseline: from then on the value
		* follows the field, and the text it started from stays where it was.
		*
		* @param previous - the edit as it stood, or null for the first change.
		* @param loaded - the text the owner delivered, which the first change starts from.
		* @param value - what the field now holds.
		* @returns the edit.
		*/
		function editFrom(previous, loaded, value) {
			return previous === null ? {
				baseline: loaded,
				text: value
			} : {
				baseline: previous.baseline,
				text: value
			};
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
			const [caret, setCaret] = (0, react.useState)(START_CARET);
			const [stale, setStale] = (0, react.useState)(false);
			const [view, setView] = (0, react.useState)("edit");
			const [busy, setBusy] = (0, react.useState)(false);
			const [status, setStatus] = (0, react.useState)(null);
			const seen = (0, react.useRef)({
				address,
				text: loaded
			});
			const gutter = (0, react.useRef)(null);
			const diff = (0, react.useMemo)(() => diffOf(edit), [edit]);
			const text = editedText(edit, loaded);
			const lines = lineCount(text);
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
				setCaret(caretIn(element));
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
								setEdit((previous) => editFrom(previous, loaded, value));
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
					localeId: locale.getLocale().locale ?? "zh",
					remote: ctx.get("remote")
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
					markOrdinals,
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
					localeId: locale.getLocale().locale ?? "zh",
					remote: ctx.get("remote")
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
