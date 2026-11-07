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
			toolElementMode: "元素",
			toolElementHint: "点按选择",
			toolElementKeys: "↑↓  Esc",
			toolElementDepth: "{level}/{count}",
			toolElementUp: "选择外层元素",
			toolElementDown: "选择里层元素",
			toolElementMiss: "这里没有可标注的元素，换到文字、图形或部件上再点。",
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
			reveal_revealed: "已定位到标注",
			reveal_missing: "元素已不在当前页面",
			reveal_hidden: "元素目前不可见，请先展开或翻到对应页面",
			reveal_wrong_surface: "无法切换到标注所在的页面",
			reveal_timeout: "页面没有响应定位请求",
			serviceTitle: "本机网页",
			serviceHint: "打开正在运行的本机网页，直接圈画与批注。",
			serviceSearch: "搜索页面，或输入 localhost:5173",
			serviceOpen: "打开",
			serviceOpening: "正在连接",
			serviceLocal: "正在运行",
			serviceScanning: "检索中",
			serviceRescan: "重新检索",
			serviceNoMatch: "没有匹配的页面",
			serviceChooseMatch: "找到多个页面，请选择下方的一项。",
			serviceSearchHint: "换个关键词，或输入完整的本机地址。",
			serviceEmpty: "没有发现本机服务",
			serviceEmptyHint: "先启动开发服务器，或在上方直接输入地址。",
			serviceBadAddress: "请输入本机 HTTP 地址",
			serviceTabs: "已打开的本机网页",
			serviceListTab: "返回服务列表",
			serviceCloseTab: "关闭网页",
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
			toastNone: "还没有标注请先圈出要改处",
			toastSending: "发送中",
			toastStillSending: "仍在发送，完成后会在这里确认",
			toastSentAgent: "已发送给智能体处理",
			toastSavedAll: "已存入草稿并清空标注",
			toastSavedOne: "已存入草稿其余标注保留",
			toastFailed: "发送失败",
			toastResend: "重新发送",
			pdfRendering: "正在渲染这一页…",
			pdfOpenFailed: "打开 PDF 失败：",
			documentScope: "共 {pages} 页 · {marks} 处批注",
			notReady: "还没有读取到这个 PDF 的宿主信息，请稍后再试。",
			htmlTitle: "HTML 预览",
			htmlLoading: "正在载入 HTML…",
			htmlFrame: "HTML 预览",
			htmlStale: "这份 HTML 在上次标注之后已经改过，旧标注的元素定位可能失准，请核对后再提交。",
			liveAddress: "本机地址，如 localhost:5173",
			liveAddressExpand: "展开地址",
			liveAddressCollapse: "收起地址",
			livePage: "网页",
			liveRefresh: "刷新网页",
			liveOpening: "正在打开页面…",
			liveBack: "回到这份文件",
			liveBadAddress: "这个地址打不开：请填 localhost:5173 这样的本机地址。",
			style: "标注样式",
			styleColor: "颜色",
			collapse: "收起",
			expand: "展开",
			overallHint: "整张图 · 可选",
			detailHint: "当前选中",
			detailUnset: "未选中",
			detailIdle: "在图上点一下、框一块或画一笔，就能为那处写说明。",
			cardOpen: "打开原文件",
			cardOpenLive: "回到本机网页",
			cardCaptureOmitted: "位置标注",
			cardCaptureFailed: "截图失败",
			cardMore: "查看其余 {n} 处",
			cardExpand: "查看完整批注",
			cardCollapse: "收起详情",
			cardOpenFailed: "未能打开原内容，请重试。",
			cardGoal: "目标",
			cardPage: "第 {n} 页",
			cardPages: "共 {n} 页",
			cardCount: "{n} 处标注",
			pendingCount: "{n}",
			pendingRemove: "移除附图标注",
			pendingSendHint: "发送当前消息及全部待发送标注",
			pendingSendMessage: "发送消息",
			pendingSending: "发送中…",
			pendingUnavailable: "当前输入框暂时无法发送。",
			pendingSendNow: "发送这份标注",
			pendingFailed: "没能发送："
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
			toolElementMode: "Pick",
			toolElementHint: "Click to select",
			toolElementKeys: "↑↓  Esc",
			toolElementDepth: "{level}/{count}",
			toolElementUp: "Select the surrounding element",
			toolElementDown: "Select the inner element",
			toolElementMiss: "No annotatable element is under that point; try a word, shape, or component.",
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
			reveal_revealed: "Mark located",
			reveal_missing: "That element is no longer on the page",
			reveal_hidden: "The element is not visible yet",
			reveal_wrong_surface: "Could not switch to the mark’s page",
			reveal_timeout: "The page did not answer the locate request",
			serviceTitle: "Local pages",
			serviceHint: "Open a running local page to draw and comment.",
			serviceSearch: "Find a page or enter localhost:5173",
			serviceOpen: "Open",
			serviceOpening: "Connecting",
			serviceLocal: "Running",
			serviceScanning: "Scanning",
			serviceRescan: "Scan again",
			serviceNoMatch: "No matching pages",
			serviceChooseMatch: "Several pages match. Choose one below.",
			serviceSearchHint: "Try another keyword or enter the full local address.",
			serviceEmpty: "No local services found",
			serviceEmptyHint: "Start a development server, or type its address above.",
			serviceBadAddress: "Enter a local HTTP address",
			serviceTabs: "Open local pages",
			serviceListTab: "Back to service list",
			serviceCloseTab: "Close page",
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
			toastNone: "Nothing marked yet — circle what should change",
			toastSending: "Sending",
			toastStillSending: "Still sending — this will confirm when it finishes",
			toastSentAgent: "Sent to the agent",
			toastSavedAll: "Saved to the draft; the marks are cleared",
			toastSavedOne: "Saved to the draft; the rest stay",
			toastFailed: "Sending failed",
			toastResend: "Send again",
			pdfRendering: "Rendering this page…",
			pdfOpenFailed: "Opening the PDF failed: ",
			documentScope: "{pages} pages · {marks} marks",
			notReady: "This PDF's Host facts are not loaded yet; try again in a moment.",
			htmlTitle: "HTML preview",
			htmlLoading: "Loading HTML…",
			htmlFrame: "HTML preview",
			htmlStale: "This HTML changed since it was annotated, so old marks may name the wrong elements. Check them before sending.",
			liveAddress: "a local address, such as localhost:5173",
			liveAddressExpand: "Show address",
			liveAddressCollapse: "Hide address",
			livePage: "Web page",
			liveRefresh: "Refresh page",
			liveOpening: "Opening the page…",
			liveBack: "Back to this file",
			liveBadAddress: "That address cannot be opened: use a local one, such as localhost:5173.",
			style: "Mark style",
			styleColor: "Colour",
			collapse: "Collapse",
			expand: "Expand",
			overallHint: "whole figure · optional",
			detailHint: "selected",
			detailUnset: "nothing selected",
			detailIdle: "Click the figure, or box a region or draw a stroke, to write about that spot.",
			cardOpen: "Open source file",
			cardOpenLive: "Return to the local page",
			cardCaptureOmitted: "location only",
			cardCaptureFailed: "screenshot failed",
			cardMore: "Show {n} more",
			cardExpand: "Review all annotations",
			cardCollapse: "Collapse details",
			cardOpenFailed: "Could not open the source. Try again.",
			cardGoal: "Goal",
			cardPage: "page {n}",
			cardPages: "{n} pages",
			cardCount: "{n} annotations",
			pendingCount: "{n}",
			pendingRemove: "Remove the annotation",
			pendingSendHint: "Send the message and all staged reviews",
			pendingSendMessage: "Send message",
			pendingSending: "Sending…",
			pendingUnavailable: "This composer cannot send right now.",
			pendingSendNow: "Send this review",
			pendingFailed: "Could not send: "
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
		* Percent-encode one address segment, keeping `:` literal for Windows drive letters.
		* @param segment - one raw segment of an id or a path.
		* @returns the encoded segment.
		*/
		function encodeSegment(segment) {
			return encodeURIComponent(segment).replace(/%3A/giu, ":");
		}
		/**
		* Build the address of a file read through one Session.
		*
		* The Sidebar claims resources by address string, so this has to spell an address
		* exactly the way the shell does: backslashes become `/`, the path keeps its
		* separators literal, and an absolute path keeps its leading one — which is what
		* leaves the `//` in `session/<id>//tmp/a.svg`, the form the shell itself writes
		* for a figure outside the workspace.
		* @param sessionId - the Session whose workspace resolves the path.
		* @param path - absolute or workspace-relative path.
		* @returns the `dsh-resource://file/session/<sessionId>/<path>` address.
		*/
		function fileAddress(sessionId, path) {
			const normalized = path.replace(/\\/gu, "/").replace(/^(?:\.\/)+/u, "");
			return `${PREFIX}session/${encodeSegment(sessionId)}/${normalized.split("/").map(encodeSegment).join("/")}`;
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
		/**
		* The list's rows: every mark, gathered by kind, carrying the number its row prints.
		*
		* @param marks - the marks in the order the document reads them.
		* @returns the rows in the order the list shows them.
		*/
		function markRows(marks) {
			const numbering = markOrdinals(marks);
			const groups = /* @__PURE__ */ new Map();
			for (const mark of marks) {
				const group = groups.get(mark.kind);
				if (group === void 0) groups.set(mark.kind, [mark]);
				else group.push(mark);
			}
			const rows = [];
			for (const kind of MARK_KIND_ORDER) {
				const group = groups.get(kind);
				if (group === void 0) continue;
				for (const mark of group) rows.push({
					mark,
					ordinal: group.length > 1 ? numbering.get(mark.id) : void 0
				});
			}
			return rows;
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
		//#region src/client/element-choice.ts
		/**
		* The anchor at one offset from the default.
		*
		* Offsets are signed because moving toward a child is the useful direction on a
		* six-level HTML tree as well as on an SVG artist. The result is clamped: walking up
		* at the document root stays at the outermost usable element instead of making the
		* highlight disappear.
		* @param choices - the ladder at one pointer position.
		* @param offset - steps away from {@link ElementChoices.preferred}.
		* @returns the selected anchor.
		*/
		function anchorAtOffset(choices, offset) {
			const index = Math.min(choices.anchors.length - 1, Math.max(0, choices.preferred + offset));
			return choices.anchors[index];
		}
		/**
		* Whether two ladders describe the same sequence of elements.
		*
		* Boxes are deliberately ignored: an element can reflow under a still pointer, and
		* that must update its highlight without throwing away the depth the reader chose.
		* @param one - one ladder.
		* @param other - the ladder to compare.
		* @returns true when every selector is the same and in the same order.
		*/
		function sameChoiceElements(one, other) {
			if (one.anchors.length !== other.anchors.length) return false;
			return one.anchors.every((anchor, index) => anchor.selector === other.anchors[index]?.selector);
		}
		/**
		* Whether two ladders carry the same element values, including their boxes.
		*
		* The pointer state uses this to avoid a render for every pixel of movement over one
		* unchanged element, while still accepting a reflow under a still hand.
		* @param one - one ladder.
		* @param other - the ladder to compare.
		* @returns true when every element and box is unchanged.
		*/
		function sameChoiceAnchors(one, other) {
			if (one.preferred !== other.preferred || one.anchors.length !== other.anchors.length) return false;
			return one.anchors.every((anchor, index) => {
				const compared = other.anchors[index];
				return anchor.tag === compared.tag && anchor.id === compared.id && anchor.title === compared.title && anchor.text === compared.text && anchor.selector === compared.selector && anchor.bbox.every((value, boxIndex) => value === compared.bbox[boxIndex]);
			});
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
		* The mark that already names the element a new one would name.
		*
		* The element tool has no way to say "not this one": every press on an element placed
		* a mark, so pressing the same heading four times left four marks on it, identical and
		* all silent. Naming an element twice is not a second comment — a second comment is a
		* sentence in the mark that is already there — so the press picks that mark out
		* instead of adding a fifth.
		*
		* The selector is the identity, because it is what the mark is: two elements cannot
		* share one, and a mark whose element has since moved still names the same element.
		* @param marks - every mark the surface holds.
		* @param mark - the mark being placed.
		* @returns the mark already on that element, or undefined when the element is free.
		*/
		function elementMarkOn(marks, mark) {
			const selector = mark.kind === "element" ? mark.anchor?.selector : void 0;
			if (selector === void 0) return void 0;
			return marks.find((other) => other.kind === "element" && other.anchor?.selector === selector);
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
		//#region src/client/canvas/hit.ts
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
		* Every element a point can reasonably mean, from exact paint outward.
		*
		* The exact painted element is first because the reader may want the segment they
		* can see. The named artist and its stable ancestors follow because those are the
		* names a source reader can act on. Unnamed layout groups between them are skipped:
		* they add a choice without changing what the reader can see or the source can name.
		* @param container - element holding the inline figure, used as the coordinate origin.
		* @param clientX - pointer x in client space.
		* @param clientY - pointer y in client space.
		* @param scaleX - figure pixels per client pixel horizontally.
		* @param scaleY - figure pixels per client pixel vertically.
		* @returns the ordered choices and the level a plain click takes.
		*/
		function elementChoicesAtPoint(container, clientX, clientY, scaleX, scaleY) {
			const root = container.querySelector("svg");
			if (root === null) return void 0;
			const hit = pickInFigure(container, root, root.getBoundingClientRect(), clientX, clientY);
			if (hit === void 0) return void 0;
			const described = namingAncestor(hit, container);
			const elements = [hit];
			for (let node = described; node !== null && node !== container; node = node.parentElement) if ((node === described || isStableId(node.id) || node.querySelector(":scope > title") !== null) && !elements.includes(node)) elements.push(node);
			return {
				anchors: [anchorOfElement(elements[0], root, container, scaleX, scaleY), ...elements.slice(1).map((element) => anchorOfElement(element, root, container, scaleX, scaleY))],
				preferred: elements.indexOf(described)
			};
		}
		/**
		* Write one SVG element as the anchor a mark carries.
		* @param described - the element to name.
		* @param root - the figure root, which a positional selector is rooted at.
		* @param container - element holding the figure, used to express the box locally.
		* @param scaleX - figure pixels per client pixel horizontally.
		* @param scaleY - figure pixels per client pixel vertically.
		* @returns the anchor.
		*/
		function anchorOfElement(described, root, container, scaleX, scaleY) {
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
		function anchorOf$1(event, point, geometry, source) {
			const choices = choicesOf(event, point, geometry, source);
			return choices === void 0 ? void 0 : anchorAtOffset(choices, 0);
		}
		/**
		* Every element one pointer position can mean on this surface.
		*
		* A rendered document reports its own ladder because its layout is in a frame. An
		* inline SVG asks the same way it always did, but now keeps the painted leaf and its
		* named ancestors instead of throwing all but one of them away.
		* @param event - the pointer event, bound to the surface.
		* @param point - the same event, in figure pixels.
		* @param geometry - the paper's size and origin.
		* @param source - how this surface names elements.
		* @returns the ordered choices, or undefined when the point names nothing.
		*/
		function choicesOf(event, point, geometry, source) {
			if (source.anchorChoicesAtFigurePoint !== void 0) return source.anchorChoicesAtFigurePoint(point[0], point[1]);
			if (source.anchorAtFigurePoint !== void 0) {
				const anchor = source.anchorAtFigurePoint(point[0], point[1]);
				return anchor === void 0 ? void 0 : {
					anchors: [anchor],
					preferred: 0
				};
			}
			const container = source.containerRef.current;
			if (!source.anchoring || container === null) return void 0;
			const rect = event.currentTarget.getBoundingClientRect();
			if (rect.width === 0 || rect.height === 0) return void 0;
			const scaleX = geometry.width / rect.width;
			const scaleY = geometry.height / rect.height;
			return elementChoicesAtPoint(container, rect.left + (point[0] + geometry.originX) / scaleX, rect.top + (point[1] + geometry.originY) / scaleY, scaleX, scaleY);
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
		/** Screen-pixel travel before a press becomes a pan, move, or a different target. */
		const DRAG_SLOP = 4;
		/**
		* Whether a key event is going into a field where arrow keys edit text.
		* @param target - the event target.
		* @returns true for inputs, textareas, selects, and contenteditable regions.
		*/
		function editingField(target) {
			if (!(target instanceof HTMLElement)) return false;
			if (target.isContentEditable) return true;
			return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT";
		}
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
			const active = (0, react.useRef)(null);
			const pendingTap = (0, react.useRef)(null);
			const touches = (0, react.useRef)(/* @__PURE__ */ new Map());
			/** Fingers still down after a pinch whose navigation gesture has already ended. */
			const draining = (0, react.useRef)(/* @__PURE__ */ new Set());
			const pinch = (0, react.useRef)(null);
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
			const [picked, setPicked] = (0, react.useState)(null);
			const hover = picked === null ? null : anchorAtOffset(picked.choices, picked.index - picked.choices.preferred);
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
				reportHover?.(hover ?? void 0, picked === null ? void 0 : {
					level: picked.index + 1,
					count: picked.choices.anchors.length
				});
			}, [
				hover,
				picked,
				reportHover
			]);
			/**
			* Forget the highlight whenever the picker is put away.
			*
			* The highlight says "this is what a click would take"; with no picker armed there
			* is no click to describe, and a lit element left behind would be a promise the
			* tool no longer keeps. Disarming also covers the case a pointer never will: the
			* reader leaves the figure with the picker armed, so no move arrives to clear it.
			*/
			(0, react.useEffect)(() => {
				if (tool !== "element") setPicked(null);
			}, [tool]);
			/**
			* Move through the element ladder without moving the pointer.
			*
			* The pointer chooses a position and the arrow keys choose what at that position the
			* reader means: up is the containing artist or block, down is the exact painted part.
			* The keys are only taken while a picker has something under it and the reader is not
			* typing, so an arrow in the comment field still moves the caret.
			*/
			(0, react.useEffect)(() => {
				if (tool !== "element" || picked === null) return;
				const onKeyDown = (event) => {
					if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
					if (editingField(event.target)) return;
					event.preventDefault();
					setPicked((current) => {
						/* v8 ignore next -- this listener only exists while a level is picked. */
						if (current === null) return null;
						const delta = event.key === "ArrowUp" ? 1 : -1;
						const next = Math.min(current.choices.anchors.length - 1, Math.max(0, current.index + delta));
						return next === current.index ? current : {
							...current,
							index: next
						};
					});
				};
				window.addEventListener("keydown", onKeyDown);
				return () => {
					window.removeEventListener("keydown", onKeyDown);
				};
			}, [picked, tool]);
			/**
			* Where the current press landed, in figure pixels.
			*
			* Recorded in the capture phase because a mark's hit area stops the bubble, so
			* this is the only place a drag on an existing mark can learn its own origin.
			* A box rather than a nullable ref: the capture handler runs for every press on
			* the surface, so there is no state where it holds no point.
			*/
			const pressedAt = (0, react.useRef)({ value: [0, 0] });
			const pointerId = (event) => event.pointerId ?? 1;
			/**
			* Claim the surface for one primary left-button pointer.
			*
			* Mouse, pen, and touch all arrive as pointer events, but their useful gestures
			* do not overlap: a second finger belongs to a future pinch, and a right press is
			* a context menu. Keeping the owner as an id rather than a boolean is what stops
			* a second pointer from steering the first pointer's mark or pan.
			*/
			const claim = (event) => {
				if (active.current !== null) return false;
				if (event.isPrimary === false || event.button !== 0) return false;
				active.current = {
					id: pointerId(event),
					x: event.clientX,
					y: event.clientY
				};
				return true;
			};
			/**
			* Keep a claimed pointer until its own release, even if it leaves the surface.
			*
			* A point or element pick is committed on pointerup rather than on pointerdown.
			* Without capture, releasing outside the SVG produced neither pointerup nor click:
			* the owner stayed claimed and the next press was silently ignored.
			*/
			const capture = (event) => {
				/* v8 ignore next -- jsdom has no pointer capture; browsers do. */
				event.currentTarget.setPointerCapture?.(event.pointerId);
			};
			const owns = (event) => active.current === null || active.current.id === pointerId(event);
			/** Whether any gesture or uncommitted tap still owns this surface. */
			const isActive = () => pinch.current !== null || active.current !== null || drawing.current || pendingTap.current !== null || panning.current !== null || press !== null;
			const travelled = (event) => {
				const from = active.current;
				/* v8 ignore next -- a live gesture always has an owner. */
				if (from === null) return false;
				return Math.hypot(event.clientX - from.x, event.clientY - from.y) >= DRAG_SLOP;
			};
			const toFigure = (event) => figurePointOf(event, geometry);
			const anchorFor = (event, point) => anchorOf$1(event, point, geometry, {
				anchoring,
				containerRef,
				anchorAtFigurePoint: props.anchorAtFigurePoint,
				anchorChoicesAtFigurePoint: props.anchorChoicesAtFigurePoint
			});
			const choicesFor = (event, point) => choicesOf(event, point, geometry, {
				anchoring,
				containerRef,
				anchorAtFigurePoint: props.anchorAtFigurePoint,
				anchorChoicesAtFigurePoint: props.anchorChoicesAtFigurePoint
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
				if (handle === void 0 && tool !== "select") return;
				if (!claim(event)) return;
				event.stopPropagation();
				props.onSelect(mark.id);
				if (handle === void 0 && mark.kind === "element") {
					active.current = null;
					return;
				}
				capture(event);
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
				if (tool !== "select") return false;
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
				if (pinch.current !== null) return;
				settled.current = false;
				if (!claim(event)) return;
				if (tool === "select") {
					const overElement = elementMarkAt(event, toFigure(event));
					if (overElement !== void 0) {
						active.current = null;
						beginGesture(overElement, event);
						settled.current = true;
						return;
					}
					if (props.onPan === void 0 || props.pannable === false) {
						active.current = null;
						return;
					}
					panning.current = {
						x: event.clientX,
						y: event.clientY
					};
					panned.current = false;
					capture(event);
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
					pendingTap.current = {
						mark,
						existing: void 0
					};
					capture(event);
					return;
				}
				if (tool === "element") {
					const choices = choicesFor(event, point);
					if (choices === void 0) {
						props.onPickMiss?.();
						active.current = null;
						return;
					}
					const mark = elementMark(anchorAtOffset(choices, picked !== null && sameChoiceElements(picked.choices, choices) ? picked.index - picked.choices.preferred : 0), color);
					const already = elementMarkOn(props.marks, mark);
					pendingTap.current = {
						mark,
						existing: already
					};
					capture(event);
					return;
				}
				drawing.current = true;
				capture(event);
				setDraft(draftMark({
					tool,
					color,
					weight: penWeight,
					point
				}));
			};
			const move = (event) => {
				if (event.pointerType === "touch") touches.current.set(event.pointerId, {
					x: event.clientX,
					y: event.clientY
				});
				if (pinch.current !== null) {
					movePinch(event);
					return;
				}
				if (!owns(event)) return;
				if (pendingTap.current !== null && travelled(event)) pendingTap.current = null;
				const from = panning.current;
				if (from !== null) {
					const start = active.current;
					/* v8 ignore next -- a pan is a live gesture and therefore always owned. */
					if (start === null) return;
					const dx = panned.current ? event.clientX - from.x : event.clientX - start.x;
					const dy = panned.current ? event.clientY - from.y : event.clientY - start.y;
					if (dx === 0 && dy === 0) return;
					if (!panned.current && !travelled(event)) return;
					if (!panned.current) props.onPanStart?.();
					panning.current = {
						x: event.clientX,
						y: event.clientY
					};
					panned.current = true;
					props.onPan?.(dx, dy);
					return;
				}
				if (tool === "element") {
					const found = choicesFor(event, toFigure(event));
					setPicked((current) => {
						if (found === void 0) return null;
						if (current === null || !sameChoiceElements(current.choices, found)) return {
							choices: found,
							index: found.preferred
						};
						if (sameChoiceAnchors(current.choices, found)) return current;
						return {
							...current,
							choices: found
						};
					});
				}
				if (press !== null) {
					if (press.edit === null && !travelled(event) && !(event.shiftKey && press.handle === "rotate")) return;
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
			const settle = (event) => {
				if (endPinch(event)) return;
				if (active.current === null || !owns(event)) return;
				if (panning.current !== null) {
					const started = panned.current;
					panning.current = null;
					panned.current = started;
					active.current = null;
					if (started) props.onPanEnd?.();
					return;
				}
				if (press !== null) {
					const done = press.edit;
					setPress(null);
					active.current = null;
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
				if (pendingTap.current !== null) {
					const pending = pendingTap.current;
					pendingTap.current = null;
					active.current = null;
					if (pending.existing === void 0) {
						props.onAdd(pending.mark);
						props.onSelect(pending.mark.id);
						props.onDrawn?.(pending.mark.id);
					} else {
						props.onSelect(pending.existing.id);
						props.onDrawn?.(pending.existing.id);
					}
					settled.current = true;
					return;
				}
				if (!drawing.current || draft === null) {
					active.current = null;
					return;
				}
				drawing.current = false;
				active.current = null;
				setDraft(null);
				if (typeof event.currentTarget.hasPointerCapture === "function" && event.pointerId !== void 0 && event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
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
			/**
			* Abandon the gesture without creating or changing anything.
			*
			* A cancelled pointer, lost capture, hidden tab, or window blur means the browser
			* no longer knows where the release would have happened. Treating that as a
			* successful release made marks appear from a gesture the reader never completed.
			*/
			const cancel = (event) => {
				const wasActive = isActive();
				if (event !== void 0 && endPinch(event)) return true;
				if (event === void 0) {
					touches.current.clear();
					draining.current.clear();
					pinch.current = null;
				}
				if (event !== void 0 && (active.current === null || !owns(event))) return false;
				const hadPan = panning.current !== null && panned.current;
				panning.current = null;
				drawing.current = false;
				pendingTap.current = null;
				active.current = null;
				panned.current = false;
				setDraft(null);
				setPress(null);
				props.onLiveEdit?.(null);
				if (hadPan) props.onPanEnd?.();
				settled.current = true;
				if (event !== void 0 && typeof event.currentTarget.hasPointerCapture === "function" && event.pointerId !== void 0 && event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
				return wasActive;
			};
			const cancelFromLifecycle = () => {
				cancel();
			};
			(0, react.useEffect)(() => {
				window.addEventListener("blur", cancelFromLifecycle);
				const onVisibility = () => {
					if (document.visibilityState === "hidden") cancelFromLifecycle();
				};
				document.addEventListener("visibilitychange", onVisibility);
				return () => {
					window.removeEventListener("blur", cancelFromLifecycle);
					document.removeEventListener("visibilitychange", onVisibility);
				};
			});
			const onClick = (event) => {
				if (event.target !== event.currentTarget) return;
				if (panned.current) {
					panned.current = false;
					return;
				}
				if (settled.current) {
					settled.current = false;
					return;
				}
				if (tool !== "select" && tool !== "element") return;
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
				if (event.pointerType === "touch") {
					if (draining.current.has(event.pointerId)) return;
					if (draining.current.size > 0) {
						draining.current.add(event.pointerId);
						capture(event);
						return;
					}
					touches.current.set(event.pointerId, {
						x: event.clientX,
						y: event.clientY
					});
					if (touches.current.size >= 2 && pinch.current === null) {
						const hadPan = panning.current !== null && panned.current;
						panning.current = null;
						drawing.current = false;
						pendingTap.current = null;
						active.current = null;
						panned.current = false;
						setDraft(null);
						setPress(null);
						props.onLiveEdit?.(null);
						if (hadPan) props.onPanEnd?.();
						settled.current = true;
						/* v8 ignore next -- jsdom has no pointer capture; browsers do. */
						event.currentTarget.setPointerCapture?.(event.pointerId);
						const pair = [...touches.current.entries()].slice(0, 2);
						const firstEntry = pair[0];
						const secondEntry = pair[1];
						/* v8 ignore next -- the size check above guarantees two entries. */
						if (firstEntry !== void 0 && secondEntry !== void 0) {
							const first = firstEntry[1];
							const second = secondEntry[1];
							pinch.current = {
								ids: [firstEntry[0], secondEntry[0]],
								distance: Math.hypot(second.x - first.x, second.y - first.y),
								centerX: (first.x + second.x) / 2,
								centerY: (first.y + second.y) / 2
							};
						}
					}
				}
				if (!owns(event)) return;
				pressedAt.current.value = toFigure(event);
			};
			/**
			* Continue a two-finger pinch.
			*
			* The distance changes scale and the centroid changes scroll: fingers can spread
			* and travel in the same movement, as they do on a map. The pair owns the gesture
			* until the first finger lifts, so neither finger can accidentally finish a draft
			* that the second finger already abandoned.
			*/
			const movePinch = (event) => {
				const gesture = pinch.current;
				/* v8 ignore next -- callers only enter this path with a live pinch. */
				if (gesture === null || event.pointerType !== "touch") return;
				if (!gesture.ids.includes(event.pointerId)) return;
				touches.current.set(event.pointerId, {
					x: event.clientX,
					y: event.clientY
				});
				const first = touches.current.get(gesture.ids[0]);
				const second = touches.current.get(gesture.ids[1]);
				/* v8 ignore next -- both ids are in the map until one of them lifts. */
				if (first === void 0 || second === void 0) return;
				const distance = Math.hypot(second.x - first.x, second.y - first.y);
				const centerX = (first.x + second.x) / 2;
				const centerY = (first.y + second.y) / 2;
				if (gesture.distance > 0 && distance > 0 && distance !== gesture.distance) props.onZoomAt?.(distance / gesture.distance, centerX, centerY);
				const dx = centerX - gesture.centerX;
				const dy = centerY - gesture.centerY;
				if (dx !== 0 || dy !== 0) props.onPan?.(dx, dy);
				gesture.distance = distance;
				gesture.centerX = centerX;
				gesture.centerY = centerY;
			};
			/**
			* End the pinch when one of its fingers is lifted or taken away.
			* @returns true when the event belonged to the pinch and the normal gesture path
			* must not also see it.
			*/
			const endPinch = (event) => {
				if (event.pointerType === "touch") {
					touches.current.delete(event.pointerId);
					draining.current.delete(event.pointerId);
				}
				const gesture = pinch.current;
				if (gesture === null || !gesture.ids.includes(event.pointerId)) return false;
				pinch.current = null;
				for (const id of gesture.ids) {
					touches.current.delete(id);
					draining.current.add(id);
				}
				draining.current.delete(event.pointerId);
				settled.current = true;
				return true;
			};
			return {
				draft,
				press,
				hover,
				sizes,
				cancel,
				isActive,
				handlers: {
					onPointerDownCapture,
					onPointerDown: start,
					onPointerMove: move,
					onPointerUp: settle,
					onPointerCancel: cancel,
					onLostPointerCapture: cancel,
					onPointerLeave: () => {
						setPicked(null);
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
		/** Longest human text a record-list signature keeps. */
		const SIGNATURE_TEXT = 36;
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
		* The words an anchor names its element with, if it has any.
		*
		* A title first (a Graphviz node's `102` is the name the source uses), then the
		* element's own text when it is short enough to be a name. An `id` is deliberately not
		* one of them: the ids on a matplotlib SVG — `axes_1`, `line2d_11`, `figure_1` — are
		* minted by the exporter and appear nowhere in the script the agent edits, so naming
		* one only adds a word the reader has to decode.
		* @param anchor - the element the mark landed on.
		* @returns the name in words, or an empty string when the anchor has none.
		*/
		function anchorWords(anchor) {
			if (anchor.title !== void 0 && anchor.title !== "") return anchor.title;
			const text = anchor.text ?? "";
			return text !== "" && text.length <= NAMEABLE_TEXT ? text : "";
		}
		/**
		* A compact source-shaped identity for one element in the annotation list.
		*
		* The list needs more than the element's prose: the reader has to tell two buttons
		* or two cards apart before clicking one. The tag, id and first classes supply that
		* identity; a short title or text says what the element contains. The positional
		* selector remains the locator and is not printed here.
		* @param anchor - the element the mark landed on.
		* @returns a signature such as `<section#lead.hero = "Visible text">`.
		*/
		function anchorDescriptor(anchor) {
			const tag = anchor.tag.toLowerCase();
			const id = anchor.id === void 0 || anchor.id === "" ? "" : `#${anchor.id}`;
			const classNames = (anchor.class ?? "").trim().split(/\s+/u).filter(Boolean).slice(0, 3).map((name) => `.${name}`).join("");
			const words = (anchor.title ?? anchor.text ?? "").replace(/"/gu, "'").replace(/\s+/gu, " ").trim();
			const opening = `<${tag}${id}${classNames}`;
			if (words === "") return `${opening}>`;
			return `${opening} = "${words.length <= SIGNATURE_TEXT ? words : `${words.slice(0, SIGNATURE_TEXT - 1)}…`}">`;
		}
		/**
		* Whether a selector is nothing but an element's id with a `#` in front.
		*
		* `#axes_1` says what the id says; a path such as `#s > p:nth-of-type(1)` says where in
		* the source to look. Only the second is worth printing.
		* @param selector - the anchor's CSS path.
		* @returns true when the selector carries no path beyond the id.
		*/
		function namesOnlyItsId(selector) {
			return /^#[\w-]+$/u.test(selector);
		}
		/**
		* The element's own opening tag, which is the one string the source shares with the mark.
		*
		* An id on its own is an exporter's private word, which is why a shape never prints one.
		* An `element` mark is the exception: there the element is the target, and on a figure
		* whose elements carry nothing else — matplotlib names every group and nothing else —
		* the id is all the source has to offer. Spelled as the tag it opens, `<g id="patch_2">`,
		* so the tag arrives with the id and neither has to be read off the other.
		* @param anchor - the element the mark landed on.
		* @returns the opening tag, carrying the id when the element declares one.
		*/
		function openingTag(anchor) {
			const id = anchor.id === void 0 || anchor.id === "" ? "" : ` id="${anchor.id}"`;
			return `<${anchor.tag}${id}>`;
		}
		/**
		* The name the picture shows for the element a mark landed on.
		*
		* The reader clicked one element, and the picture has to answer "which one?" at a
		* glance. An id remains the searchable opening tag; otherwise the element's own
		* title or short text is a name the reader recognises. A full CSS path belongs in
		* the list that the source reader receives, not in a plate floating over the page.
		* @param anchor - the element the mark landed on.
		* @returns the opening tag, or a short human-readable element name.
		*/
		function anchorCodeName(anchor) {
			if (anchor.id !== void 0 && anchor.id !== "") return openingTag(anchor);
			const words = anchorWords(anchor).replace(/\s+/gu, " ").trim();
			if (words === "") return openingTag(anchor);
			return words.length <= 26 ? words : `${words.slice(0, 25)}…`;
		}
		/**
		* Describe what a mark points at, when the figure exposed an element.
		*
		* Only the names that still say something are kept: a title, a short element text, or a
		* locator into the source. Element text long enough to be a paragraph is not a name, and
		* a shape whose anchor offers nothing but a tag name is dropped whole — `（<g>）` located
		* nothing. An `element` mark keeps its locator either way, because there the anchor is
		* the mark: a path when the anchor carries one, otherwise the element's opening tag.
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
			const selector = anchor.selector ?? "";
			const parts = [];
			if (anchor.title !== void 0 && anchor.title !== "") parts.push(zh ? `元素标题「${anchor.title}」` : `element title "${anchor.title}"`);
			const text = anchor.text ?? "";
			if (text !== "" && text.length <= NAMEABLE_TEXT) parts.push(zh ? `元素文字「${text}」` : `element text "${text}"`);
			if (selector !== "" && !namesOnlyItsId(selector)) parts.push(zh ? `选择器 ${selector}` : `selector ${selector}`);
			else if (mark.kind === "element") parts.push(openingTag(anchor));
			if (parts.length === 0) return "";
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
			const surface = mark.surface === void 0 ? "" : zh ? `（surface: ${mark.surface}）` : ` (surface: ${mark.surface})`;
			const detail = flattenNote(mark.detail);
			const escape = figure === void 0 ? "" : overhang(mark, figure, locale);
			const parts = [`${page}${markName(mark, ordinal, locale)}${describeGeometry(mark, locale)}${describeAnchor(mark, locale, figure)}${surface}${escape}`];
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
					stroke: "none",
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
		/** The font a code name is drawn in: a terminal's, because the name is code. */
		const CODE_FONT_FAMILY = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
		/**
		* Font size of a code name, in figure pixels.
		*
		* A shade larger than a pin's number: a pin says one digit and the eye can guess it,
		* while a name is read character by character, and monospace reads smaller than its
		* point size suggests.
		*/
		const CODE_FONT_SIZE = 12;
		/** Colour of a code name. Dark enough to read on the pale chip that carries it. */
		const CODE_TEXT_COLOR = "#1f2937";
		/** Widest a code name may be, in characters, before its middle is elided. */
		const CODE_MAX_CHARS = 34;
		/**
		* Shorten a long name by its middle.
		*
		* An element with no id is named by its path, which can run to a whole selector line.
		* The end of that path says what the element is (`> section:nth-of-type(1)`) and the
		* start says where it sits, so the middle is what goes.
		* @param code - the name as the source words it.
		* @returns the name, elided when it is longer than a plate can carry.
		*/
		function elideCode(code) {
			if (code.length <= CODE_MAX_CHARS) return code;
			const head = Math.ceil((CODE_MAX_CHARS - 1) / 2);
			return `${code.slice(0, head)}…${code.slice(-16)}`;
		}
		/**
		* The element a mark is on, written out beside it.
		*
		* A chip is a small pale plate with a name on it, and on a slide it is never empty
		* space: parked above the element it covers the caption above it, parked below it
		* covers the paragraph. One chip on one mark was a label; three element marks on one
		* slide were three labels over the slide's own type, which is the piling the reader
		* complained about, only in smaller print. So the name is drawn for the mark being
		* worked on — the one whose element the reader is about to talk about — and for no
		* other. The box stays on every mark, and the list spells every row out in words.
		*
		* Placement is unchanged: above the element, below it when the top edge has no room,
		* kept on the paper. It is not a control: it takes no press, so a press that lands on
		* it reaches the mark's own hit area.
		*/
		function ElementCode(props) {
			const { mark, box, unit, paper, boxed, named } = props;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("g", {
				style: { pointerEvents: "none" },
				children: [boxed ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
					"data-da-element-box": mark.id,
					onPointerDown: props.onPress,
					x: box.x,
					y: box.y,
					width: box.width,
					height: box.height,
					rx: 2 * unit,
					fill: mark.color,
					fillOpacity: .07,
					stroke: mark.color,
					strokeWidth: 1.5 * unit
				}) : null, named ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(CodeChip, {
					mark,
					box,
					unit,
					paper
				}) : null]
			});
		}
		/**
		* The plate that names an element, sized and placed from the element's box.
		*
		* Monospace gives every character the same advance, so the plate can be sized without
		* measuring text — which this module does not do, because the same code draws the
		* export copy outside a document.
		*/
		function CodeChip(props) {
			const { mark, box, unit, paper } = props;
			/* v8 ignore next -- an element mark is made from the element it landed on. */
			if (mark.anchor === void 0) return null;
			const code = elideCode(anchorCodeName(mark.anchor));
			const pad = 4 * unit;
			const fontSize = CODE_FONT_SIZE * unit;
			const advance = Array.from(code).reduce((sum, char) => sum + (char.charCodeAt(0) > 255 ? 1 : .62), 0);
			const width = Math.min(advance * fontSize + pad * 2, Math.max(pad * 2, paper.right - paper.left));
			const height = fontSize + pad * 1.6;
			const gap = 4 * unit;
			const limit = Math.max(paper.left, paper.right - width);
			const x = Math.min(Math.max(box.x, paper.left), limit);
			const above = box.y - gap - height;
			const wanted = above >= paper.top ? above : box.y + box.height + gap;
			const y = Math.min(wanted, Math.max(paper.top, paper.bottom - height));
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
				x,
				y,
				width,
				height,
				rx: 3 * unit,
				fill: "#ffffff",
				fillOpacity: .94,
				stroke: mark.color,
				strokeWidth: 1.2 * unit
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("foreignObject", {
				x: x + pad,
				y,
				width: Math.max(0, width - pad * 2),
				height,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					"data-da-element-code": mark.id,
					title: anchorCodeName(mark.anchor),
					style: {
						display: "block",
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
						fontFamily: CODE_FONT_FAMILY,
						fontSize,
						fontWeight: 600,
						color: CODE_TEXT_COLOR,
						lineHeight: `${height}px`
					},
					children: code
				})
			})] });
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
			const elementBox = mark.kind === "element" ? markOutline(shown, unit) : void 0;
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
				"data-da-kind": mark.kind,
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
					elementBox === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ElementCode, {
						mark: shown,
						box: elementBox,
						unit,
						paper: {
							left: -props.originX + 2,
							top: -props.originY + 2,
							right: -props.originX + props.width - 2,
							bottom: -props.originY + props.height - 2
						},
						boxed: props.elementExtent === "box",
						named: selected,
						onPress: (event) => {
							onPressMark(mark, event);
						}
					}),
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
			const [declaredOriginX, declaredOriginY] = props.origin ?? [0, 0];
			/**
			* A rendered document scrolls inside a window, but that window stays where it is.
			*
			* Moving the whole svg by the page's scroll offset also moved its event-catching
			* rectangle, so once the reader passed the first viewport-height of a long page the
			* lower half of what they could see had no annotator over it at all. Only the marks
			* move with the page here; the transparent sheet over the window remains fixed.
			* The same offset is folded into the origin used by pointer math, which turns a
			* window point back into the document coordinate that an HTML element is named by.
			*/
			const [shiftX, shiftY] = props.shift ?? [0, 0];
			const originX = declaredOriginX - shiftX;
			const originY = declaredOriginY - shiftY;
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
			(0, react.useLayoutEffect)(() => {
				const inputRef = props.inputRef;
				if (inputRef === void 0) return;
				const input = {
					cancel: () => gesture.cancel(),
					isActive: gesture.isActive
				};
				inputRef.current = input;
				return () => {
					if (inputRef.current === input) inputRef.current = null;
				};
			}, [
				gesture.cancel,
				gesture.isActive,
				props.inputRef
			]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				className: "da-overlay",
				"data-da-overlay": "",
				width,
				height,
				viewBox: `0 0 ${width} ${height}`,
				"data-tool": tool,
				"data-pick": gesture.hover === null ? void 0 : "true",
				onPointerDownCapture: handlers.onPointerDownCapture,
				onPointerDown: handlers.onPointerDown,
				onPointerMove: handlers.onPointerMove,
				onPointerUp: handlers.onPointerUp,
				onPointerCancel: handlers.onPointerCancel,
				onLostPointerCapture: handlers.onLostPointerCapture,
				onPointerLeave: handlers.onPointerLeave,
				onDoubleClick: handlers.onDoubleClick,
				onClick: handlers.onClick,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MarkLayer, {
					marks,
					draft: gesture.draft,
					press: gesture.press,
					selectedId: tool === "select" ? props.selectedId : null,
					numbers,
					unit,
					sizes: gesture.sizes,
					originX,
					originY,
					width,
					height,
					elementExtent: props.elementExtent ?? "glow",
					onPressMark: handlers.onPressMark,
					onPressHandle: handlers.onPressHandle,
					onEdit: props.onEdit
				})
			});
		}
		//#endregion
		//#region src/client/annotation-rule.ts
		/**
		* The rule that reads one delivered annotation message back into a card.
		*
		* A message figmark sends is ordinary user text: a header naming the figure, the
		* line the save wrote about its attachment, the numbered mark list, and one closing
		* instruction. That text is the contract with the agent and it is never rewritten
		* here — this module only reports where the block sits in the text and what it says,
		* so a reading surface can draw it as a card while the message itself stays exactly
		* what was sent.
		*
		* The parsing is therefore deliberately forgiving in one direction and strict in the
		* other: a block that does not parse is reported as no block at all, which leaves the
		* host rendering the message's own words, while a block that does parse never spans
		* past its closing line into prose the reader typed.
		*
		* @module dsh-figmark/client/annotation-rule
		*/
		/** The id the host keys this rule under, and the id every node it reports carries. */
		const RULE_ID = "figmark";
		/**
		* How far into a text a block may be looked for.
		*
		* An annotation is appended to a user's own turn, so the block is near the end; a
		* message past this size is treated as unreadable rather than scanned frame by frame,
		* and falls back to plain text.
		*/
		const MAX_TEXT = 2e5;
		/** Marks accepted from one block, so a hostile list cannot define a thousand rows. */
		const MAX_MARKS$1 = 400;
		/** Header candidates tried before the scan gives up on one text. */
		const MAX_HEADERS = 64;
		/** Lines read from one header before the block is called finished. */
		const MAX_LINES = 600;
		/** Every header figmark writes, in either language. */
		const HEADERS = [
			{
				token: "【附图标注】",
				zh: true,
				html: false
			},
			{
				token: "【HTML 标注】",
				zh: true,
				html: true
			},
			{
				token: "[figure annotations]",
				zh: false,
				html: false
			},
			{
				token: "[HTML annotations]",
				zh: false,
				html: true
			}
		];
		/** The two spellings, indexed by whether the message is the Chinese one. */
		const NOTE = [{
			split: "，批注：",
			empty: "（未写说明）",
			comma: "，"
		}, {
			split: ", note: ",
			empty: " (no detail)",
			comma: ","
		}];
		/** The one closing sentence of each message kind, in either language. */
		const CLOSERS = /* @__PURE__ */ new Set([
			"逐条改生成源。",
			"逐条处理该 PDF。",
			"逐条改 HTML 生成源。",
			"Edit the generating source, mark by mark.",
			"Work through the PDF, mark by mark.",
			"Edit the HTML source, mark by mark."
		]);
		/** The optional statement of what the reader wants done, in either language. */
		const TARGETS = ["目标：", "goal: "];
		/**
		* Read the message's one statement about a live-page screenshot.
		* @param line - one non-empty line before the mark list.
		* @returns the capture state that line reports, or undefined for every other line.
		*/
		function pageCaptureOf(line) {
			if (line.startsWith("当前页面截图已随消息发送") || line.startsWith("A screenshot of the current page travels with this message")) return "attached";
			if (line.startsWith("当前页面截图未能生成") || line.startsWith("The current page could not be captured")) return "failed";
			if (line.startsWith("本次未附页面截图") || line.startsWith("No page screenshot travels with this message")) return "omitted";
		}
		/**
		* The nouns a mark line can open with, in either language.
		*
		* A line has to start with one of these to count as a mark. That is what keeps a
		* later sentence that happens to mention a note from being read as another mark, and
		* what makes a mark kind this build does not know end the block rather than corrupt it.
		*/
		const NOUNS = [
			"箭头",
			"矩形",
			"椭圆",
			"手绘线",
			"单点",
			"元素",
			"arrow",
			"box",
			"ellipse",
			"freehand stroke",
			"point",
			"element"
		];
		/** A page prefix on a mark that names which page it belongs to. */
		const PAGES = [/^第 (\d{1,4}) 页 /u, /^page (\d{1,4}) /u];
		/**
		* A header, split into the figure it names and what the brackets say about it.
		* @param line - the header line, without its newline.
		* @param form - the spelling the scan recognized, so the token is known to be the
		*   line's prefix here.
		* @returns the two halves, or undefined for a header with no path or no scope.
		*/
		function readHeader(line, form) {
			const rest = line.slice(form.token.length).trim();
			const at = form.zh ? rest.lastIndexOf("（") : rest.lastIndexOf(" (");
			const open = form.zh ? at : at + 1;
			if (at <= 0 || !rest.endsWith(")") && !rest.endsWith("）")) return void 0;
			return {
				...form,
				file: rest.slice(0, at).trim(),
				scope: rest.slice(open + 1, rest.length - 1).trim()
			};
		}
		/**
		* Read one mark line.
		* @param line - a trimmed line of the message.
		* @param zh - whether the message is the Chinese spelling.
		* @returns the mark, or undefined for a line that is not one.
		*/
		function readMark$1(line, zh) {
			const note = NOTE[zh ? 0 : 1];
			let label = line;
			let comment = "";
			let missing = false;
			if (label.endsWith(note.empty)) {
				label = label.slice(0, label.length - note.empty.length).trimEnd();
				if (label.endsWith(note.comma)) label = label.slice(0, label.length - note.comma.length).trimEnd();
				missing = true;
			} else {
				const at = label.indexOf(note.split);
				if (at < 0) return void 0;
				comment = label.slice(at + note.split.length);
				label = label.slice(0, at).trimEnd();
			}
			label = label.trim();
			let page;
			for (const pages of PAGES) {
				const match = pages.exec(label);
				if (match === null) continue;
				page = Number(match[1]);
				label = label.slice(match[0].length);
				break;
			}
			const noun = NOUNS.find((candidate) => label.startsWith(candidate));
			if (noun === void 0) return void 0;
			if (/^ ?\d{1,4}/u.exec(label.slice(noun.length)) === null) return void 0;
			return {
				page,
				label,
				comment,
				missing
			};
		}
		/**
		* Read the block that starts at a header.
		* @param text - the whole message.
		* @param start - index of the header's first character.
		* @returns the located block, or undefined when nothing after the header parses.
		*/
		function readBlock(text, start, form) {
			const first = text.indexOf("\n", start);
			const headerEnd = first === -1 ? text.length : first;
			const header = readHeader(text.slice(start, headerEnd), form);
			if (header === void 0) return void 0;
			const marks = [];
			let target = "";
			let instruction = "";
			let pageCapture = "none";
			let end = headerEnd;
			let cursor = first === -1 ? text.length : first + 1;
			for (let step = 0; step < MAX_LINES && cursor < text.length; step++) {
				const eol = text.indexOf("\n", cursor);
				const lineEnd = eol === -1 ? text.length : eol;
				const raw = text.slice(cursor, lineEnd);
				const contentEnd = raw.endsWith("\r") ? lineEnd - 1 : lineEnd;
				const line = raw.trim();
				if (line !== "") {
					if (CLOSERS.has(line)) {
						instruction = line;
						end = contentEnd;
						break;
					}
					const opened = TARGETS.find((token) => line.startsWith(token));
					const mark = opened === void 0 ? readMark$1(line, header.zh) : void 0;
					const capture = pageCaptureOf(line);
					if (capture !== void 0) {
						pageCapture = capture;
						end = contentEnd;
					} else if (opened !== void 0) {
						target = line.slice(opened.length).trim();
						end = contentEnd;
					} else if (mark !== void 0) {
						if (marks.length >= MAX_MARKS$1) break;
						marks.push(mark);
						end = contentEnd;
					} else if (marks.length > 0) break;
				}
				if (eol === -1) break;
				cursor = eol + 1;
			}
			if (marks.length === 0) return void 0;
			return {
				id: RULE_ID,
				start,
				end,
				data: {
					file: header.file,
					scope: header.scope,
					target,
					instruction,
					html: header.html,
					pageCapture,
					marks
				}
			};
		}
		/**
		* Find the first header at or after a position.
		* @param text - the whole message.
		* @param from - the position to search from.
		* @returns where the header starts and which spelling it is, or undefined when none
		*   follows.
		*/
		function nextHeader(text, from) {
			let best;
			for (const form of HEADERS) {
				const at = text.indexOf(form.token, from);
				if (at !== -1 && (best === void 0 || at < best.at)) best = {
					at,
					form
				};
			}
			return best;
		}
		/**
		* Find the annotation block that starts at or after a position.
		*
		* The host calls this with a cursor and keeps asking until it is told there is
		* nothing left, so a text with two annotations is reported as two blocks rather than
		* one. A header that does not parse is skipped and the search continues past it, which
		* is what lets one unreadable block coexist with a readable one in the same message.
		*
		* @param text - the message text.
		* @param from - the position the host has read up to.
		* @returns the next block, or undefined when the rest of the text holds none.
		*/
		function matchAnnotation(text, from) {
			if (text.length > MAX_TEXT) return void 0;
			let at = from;
			for (let attempt = 0; attempt < MAX_HEADERS; attempt++) {
				const found = nextHeader(text, at);
				if (found === void 0) return void 0;
				const block = readBlock(text, found.at, found.form);
				if (block !== void 0) return block;
				at = found.at + 1;
			}
		}
		/**
		* The rule object the host registers.
		*
		* `order` places it ahead of the shipped rules only in the sense of being consulted
		* early; it claims exactly the region it parses and never a character more, so the
		* rules around it keep the rest of the text untouched.
		*/
		const annotationRule = {
			id: RULE_ID,
			order: 50,
			match: matchAnnotation
		};
		//#endregion
		//#region src/client/annotation-thumb.ts
		/**
		* The small picture the sent bubble shows beside its annotation summary.
		*
		* The bubble's renderer is handed the message *text* and nothing else: the
		* attachments of that message are rendered by the content layer, not by the text
		* node, so the renderer cannot ask for them. What it can do is recognise the
		* message it drew a moment ago. So the sheet that drew the review picture keeps a
		* small copy here, keyed by the exact text it is about to deliver, and the bubble
		* looks the text up again.
		*
		* Two consequences are by design. The cache is a module-level map, so it lives as
		* long as the page does: a reload forgets every thumbnail and the card falls back
		* to an icon, which is the same card one word shorter rather than a hole. And the
		* key is the whole block text, not the figure path, because the same figure sent
		* twice carries different marks and therefore a different picture.
		* @module dsh-figmark/client/annotation-thumb
		*/
		/** Longest edge the stored picture is scaled to, in CSS pixels. */
		const THUMB_WIDTH = 120;
		/** How many blocks stay in the cache before the oldest is dropped. */
		const MAX_ENTRIES = 64;
		/** Quality passed to the encoder; a preview at 120px carries no more than this. */
		const QUALITY = .6;
		/**
		* One key per delivered block, in first-seen order.
		*
		* A `Map` keeps insertion order, so the first key is always the oldest and
		* dropping it is a one-liner.
		*/
		const cache = /* @__PURE__ */ new Map();
		/**
		* Normalise a block for keying.
		*
		* A message stored with CRLF endings reaches this module as the text it was, and
		* the shell may hand the same message back with either ending; the thumbnail is
		* about the block, not about its line terminators.
		* @param block - the message block, as delivered or as matched.
		* @returns the key.
		*/
		function keyOf(block) {
			return block.replace(/\r\n?/gu, "\n");
		}
		/**
		* Remember the picture for one delivered block.
		* @param block - the block text that was delivered.
		* @param dataUrl - a `data:image/…` URL; anything else is ignored rather than
		* stored, so a caller that hands over a blob URL cannot break the bubble later.
		*/
		function rememberThumb(block, dataUrl) {
			if (dataUrl === void 0 || !dataUrl.startsWith("data:image/")) return;
			const key = keyOf(block);
			cache.delete(key);
			cache.set(key, dataUrl);
			while (cache.size > MAX_ENTRIES) {
				const oldest = cache.keys().next();
				/* v8 ignore next */
				if (oldest.done === true) break;
				cache.delete(oldest.value);
			}
		}
		/**
		* The picture remembered for one block.
		* @param block - the block text the bubble matched.
		* @returns the data URL, or undefined when this page never drew that block.
		*/
		function thumbFor(block) {
			return cache.get(keyOf(block));
		}
		/**
		* Remember the picture for one delivered message.
		*
		* The card is handed the block it matched, not the message that carried it: a reader
		* who types a sentence of their own before or after sending the annotation sends a
		* message longer than the block — "但是发到对话框还是没有卡片预览", appended to a
		* delivered annotation, is exactly that. Keying only the message would then make the
		* bubble look up a block the cache never held, and the card would show an icon while
		* the figure travelled in the very same message. So the message is stored, and so is
		* every block inside it, which is the key the bubble actually asks for.
		* @param message - the message text as delivered.
		* @param dataUrl - a `data:image/…` URL; anything else is ignored, as in `rememberThumb`.
		*/
		function rememberDelivered(message, dataUrl) {
			if (dataUrl === void 0) return;
			rememberThumb(message, dataUrl);
			let from = 0;
			for (;;) {
				const block = matchAnnotation(message, from);
				if (block === void 0) break;
				rememberThumb(message.slice(block.start, block.end), dataUrl);
				/* v8 ignore next 2 -- a block always ends after it starts, so this only guards a broken rule. */
				if (block.end <= from) break;
				from = block.end;
			}
		}
		/**
		* Encode one already-rasterized picture as a thumbnail.
		*
		* Scaling by the longer edge keeps the whole page visible in the attachment card;
		* scaling by width alone made tall pages produce an over-tall image that the square
		* tile then cropped. Reusing a canvas already drawn by the review pipeline avoids a
		* second decode and resize of the full screenshot.
		* @param source - a canvas or other browser image source.
		* @param width - source width in pixels.
		* @param height - source height in pixels.
		* @returns a `data:image/…` URL, or undefined when the canvas cannot encode one.
		*/
		function thumbnailFromCanvas(source, width, height) {
			try {
				const scale = Math.min(1, THUMB_WIDTH / Math.max(width, height));
				const canvas = document.createElement("canvas");
				canvas.width = Math.max(1, Math.round(width * scale));
				canvas.height = Math.max(1, Math.round(height * scale));
				const context = canvas.getContext("2d");
				if (context === null) return void 0;
				context.imageSmoothingEnabled = true;
				context.imageSmoothingQuality = "high";
				context.drawImage(source, 0, 0, canvas.width, canvas.height);
				const url = canvas.toDataURL("image/webp", QUALITY);
				return url.startsWith("data:image/") ? url : void 0;
			} catch {
				return;
			}
		}
		/**
		* Scale one picture down to thumbnail size.
		*
		* Every step is allowed to be missing: `createImageBitmap` needs a decoder the
		* shell may not have, a canvas may not give a 2D context, and the encoder may
		* refuse. Each of those answers `undefined`, which the card draws as an icon —
		* a bubble that never loads a thumbnail must still say what it is about.
		* @param source - the review picture, when there is one.
		* @returns a `data:image/…` URL, or undefined.
		*/
		async function captureThumb(source) {
			if (source === void 0) return void 0;
			try {
				const bitmap = await createImageBitmap(source);
				try {
					return thumbnailFromCanvas(bitmap, bitmap.width, bitmap.height);
				} finally {
					bitmap.close();
				}
			} catch {
				return;
			}
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
		* @param pageImages - how many annotated pages travel as image parts. A paged
		*   document sends these instead of uploading the whole PDF.
		* @param pageCapture - whether the current live-page picture travelled, was omitted
		*   because the visible marks did not need one, or was tried and failed. File-backed
		*   documents leave this at `none`.
		* @returns the message text.
		*/
		function buildAnnotationMessage(document, paths, locale, attachment = true, pageImages = 0, pageCapture = "none") {
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
			const attachmentLines = paged ? pageImages > 0 ? [zh ? "对应标注页已作为图片随消息发送；原 PDF 未上传，按上方原文件路径处理。" : "The marked pages travel as images with this message; the original PDF was not uploaded, so work from the file path above."] : [] : pictured ? [zh ? "标注图已作为本条消息的附件发送。" : "The annotated image is attached to this message."] : [];
			const captureLines = rendered ? pageCapture === "attached" ? [zh ? "当前页面截图已随消息发送；它只覆盖当前可见页面，框线也只对应截图中的可见标注，其余位置请按下方定位处理。" : "A screenshot of the current page travels with this message. It covers only the visible page, and its boxes mark only the annotations visible in that screenshot; use the positions below for everything else."] : pageCapture === "failed" ? [zh ? "当前页面截图未能生成；请按下方逐条的元素选择器与位置处理。" : "The current page could not be captured; use the element selectors and positions below."] : pageCapture === "omitted" ? [zh ? "本次未附页面截图，因为当前可见标注无需图片即可定位；请按下方逐条的 surface、元素选择器、坐标与说明处理。" : "No page screenshot travels with this message because the visible marks do not need one; use the surface selectors, element selectors, positions and notes below."] : [] : [];
			const noPicture = !pictured && !rendered && pageImages === 0 && marks.length > 0 && !needsReviewImage(document) ? [zh ? "本条标注只有位置点，没有标注图：按上面逐条的坐标与说明处理原图即可。" : "These marks are points only, so no annotated image was made: work from the coordinates and notes above against the original figure."] : [];
			const summary = document.summary !== void 0 && document.summary.trim() !== "" ? [zh ? `目标：${document.summary.trim()}` : `goal: ${document.summary.trim()}`, ""] : [];
			const closer = rendered ? zh ? "逐条改 HTML 生成源。" : "Edit the HTML source, mark by mark." : paged ? zh ? "逐条处理该 PDF。" : "Work through the PDF, mark by mark." : zh ? "逐条改生成源。" : "Edit the generating source, mark by mark.";
			return [
				header,
				...attachmentLines,
				...captureLines,
				...noPicture,
				"",
				...summary,
				...describeMarks(document, locale),
				"",
				closer
			].join("\n");
		}
		//#endregion
		//#region src/client/pending.ts
		/** Parked annotations, by session, in the order they were parked. */
		const parked = /* @__PURE__ */ new Map();
		/** Listeners per session, so a dock redraws only when its own cards change. */
		const watchers = /* @__PURE__ */ new Map();
		/** Source of card ids; only ever compared, never parsed. */
		let nextId = 0;
		/** The list a session with nothing parked hands out. */
		const NONE = Object.freeze([]);
		/**
		* Tell one session's listeners that its cards changed.
		* @param sessionId - session whose cards changed.
		*/
		function announce(sessionId) {
			for (const listener of watchers.get(sessionId) ?? []) listener();
		}
		/**
		* Park one annotation above the composer, behind whatever is parked already.
		* @param entry - the card and the delivery it stands for.
		* @returns the new card's id.
		*/
		function parkAnnotation(entry) {
			const id = `p${++nextId}`;
			const card = {
				...entry,
				id
			};
			parked.set(card.sessionId, [...parked.get(card.sessionId) ?? NONE, card]);
			announce(card.sessionId);
			return id;
		}
		/**
		* The annotations parked for one session, oldest first.
		* @param sessionId - session to ask about.
		* @returns the cards, empty when the session has none.
		*/
		function parkedAnnotations(sessionId) {
			return parked.get(sessionId) ?? NONE;
		}
		/**
		* Drop one card, once it has been sent or taken off.
		*
		* Only the card named here goes: its neighbours are other reviews, and a send that
		* cleared them would delete work the reader had not handed over yet.
		* @param sessionId - session the card belongs to.
		* @param id - the card's own id, as `parkAnnotation` returned it.
		*/
		function unparkAnnotation(sessionId, id) {
			const cards = parked.get(sessionId);
			if (cards === void 0) return;
			const rest = cards.filter((card) => card.id !== id);
			if (rest.length === cards.length) return;
			if (rest.length === 0) parked.delete(sessionId);
			else parked.set(sessionId, rest);
			announce(sessionId);
		}
		/**
		* Watch one session's cards.
		* @param sessionId - session to watch.
		* @param listener - called whenever that session's cards change.
		* @returns a function that stops watching.
		*/
		function watchParked(sessionId, listener) {
			const listeners = watchers.get(sessionId) ?? /* @__PURE__ */ new Set();
			listeners.add(listener);
			watchers.set(sessionId, listeners);
			return () => {
				listeners.delete(listener);
				if (listeners.size === 0) watchers.delete(sessionId);
			};
		}
		//#endregion
		//#region src/client/composer.ts
		/**
		* Upload one file as a draft attachment without putting it in the rail yet.
		* @param conversation - the conversation service.
		* @param sessionId - session the draft belongs to.
		* @param files - the rendered review images to hold.
		* @returns the ids the send will add, empty when the file could not be made into one.
		*/
		function holdFiles(conversation, sessionId, files) {
			const create = conversation.createDrafts?.bind(conversation);
			if (files.length === 0 || create === void 0) return [];
			try {
				return create(sessionId, files);
			} catch {
				return [];
			}
		}
		/**
		* Arm one annotation in the composer: nothing in the box, everything ready for its send.
		* @param conversation - the composer service.
		* @param sessionId - session the draft belongs to.
		* @param message - the message, verbatim.
		* @param file - the review picture, when the surface has one to attach.
		* @param additionalFiles - marked page images of a multi-page review.
		* @returns what was armed, or undefined when this session cannot be armed.
		*/
		function armReview(conversation, sessionId, message, file, additionalFiles = []) {
			let shell;
			try {
				shell = conversation.input.shell(sessionId);
			} catch {
				return;
			}
			if (typeof shell.submit !== "function") return void 0;
			const drafts = holdFiles(conversation, sessionId, file === void 0 ? additionalFiles : [file, ...additionalFiles]);
			return {
				shell,
				text: message,
				attachmentIds: drafts.map((draft) => draft.id),
				previewUrls: drafts.flatMap((draft) => draft.previewUrl === void 0 ? [] : [draft.previewUrl])
			};
		}
		/**
		* Patches in place, by the shell they sit on.
		*
		* One patch per shell rather than one per card: two cards are two reviews, and a press
		* of Send is one message, so the patch merges every card that is currently armed. It
		* also keeps dropping a card honest — a card taken off the queue leaves the list, and
		* a send after that carries only what is still on screen.
		*/
		const patches = /* @__PURE__ */ new WeakMap();
		/**
		* Ask the rail to hold an armed picture.
		* @param shell - the box the send will run in.
		* @param ids - the drafts the picture was uploaded as.
		* @returns whether the rail took them.
		*/
		function attach(shell, ids) {
			try {
				return shell.addAttachments?.(ids) ?? false;
			} catch {
				return false;
			}
		}
		/**
		* Put the box back the way the merge found it.
		* @param shell - the box.
		* @param typed - the draft the reader had written.
		* @param added - attachments the merge had already put in the rail.
		*/
		function unwind(shell, typed, added) {
			const drop = shell.removeAttachment?.bind(shell);
			for (const id of added) if (drop !== void 0) drop(id);
			try {
				shell.setDraft(typed);
			} catch {}
		}
		/**
		* Write every armed message behind the reader's own words, and the pictures beside them.
		*
		* All of it happens here, in one write, at the press: a draft written before the press
		* would be a wall of coordinates around the sentence being typed, and a write per card
		* would cost the reader their caret as many times as there are cards.
		* @param shell - the box whose send is running.
		* @param claims - the cards armed on it, oldest first.
		* @returns the box as it was before the merge, or undefined when this press is not the
		* send that carries the annotations.
		*/
		function mergeInto(shell, claims) {
			let live;
			try {
				live = shell.snapshot;
			} catch {
				return;
			}
			if (live.phase !== void 0 && live.phase !== "plain") return void 0;
			const typed = live.draft;
			let draft = typed;
			const added = [];
			for (const claim of claims) {
				const { text, attachmentIds } = claim.armed;
				if (draft.includes(text)) continue;
				const missing = attachmentIds.filter((id) => !live.attachmentIds?.includes(id));
				if (missing.length > 0) {
					if (!attach(shell, missing)) {
						unwind(shell, typed, added);
						return;
					}
					added.push(...missing);
				}
				draft = draft.trim() === "" ? text : `${draft}\n\n${text}`;
			}
			if (draft !== typed) try {
				shell.setDraft(draft);
			} catch {
				unwind(shell, typed, added);
				return;
			}
			return {
				typed,
				merged: draft
			};
		}
		/**
		* Whether the box is already holding the draft the merge wrote.
		*
		* A write made while the box is in the middle of an edit is queued until that edit
		* ends: the send reads the box's text out of the editor, so asking the box is the only
		* way to know whether the merge is in yet. It is asked rather than assumed because the
		* two paths differ — the card's own press runs between edits and writes through, a
		* press of Enter runs inside one and does not.
		* @param shell - the box the merge wrote to.
		* @param merge - what the merge wrote.
		* @returns whether the box reports holding the merged draft.
		*/
		function wroteThrough(shell, merge) {
			try {
				return shell.snapshot.draft === merge.merged;
			} catch {
				return true;
			}
		}
		/**
		* Decide what became of one press, now that the send has run.
		* @param shell - the box whose send ran.
		* @param claims - the cards that were armed on it.
		* @param merge - the box as it was before the merge.
		*/
		function settleClaims(shell, claims, merge) {
			let live;
			try {
				live = shell.snapshot;
			} catch {
				for (const claim of claims) {
					claim.armed.admission?.release();
					claim.done();
				}
				return;
			}
			if (live.phase !== void 0 && live.phase !== "plain") {
				for (const claim of claims) {
					claim.armed.admission?.release();
					claim.done();
				}
				return;
			}
			const draft = live.draft;
			if (claims.every((claim) => !draft.includes(claim.armed.text))) {
				for (const claim of claims) {
					claim.armed.admission?.release();
					claim.done();
				}
				return;
			}
			try {
				shell.setDraft(merge.typed);
			} catch {}
			for (const claim of claims) {
				if (claim.armed.admission !== void 0) attach(shell, claim.armed.admission.ids.filter((id) => !live.attachmentIds?.includes(id)));
				if (claim.armed.staged !== true) for (const id of claim.armed.attachmentIds) shell.removeAttachment?.(id);
			}
		}
		/**
		* Take one card off whatever patch its shell is currently carrying.
		* @param shell - the box the card was armed on.
		* @param armed - what the card armed.
		*/
		function release(shell, armed) {
			const patch = patches.get(shell);
			if (patch === void 0) return;
			const at = patch.claims.findIndex((claim) => claim.armed === armed);
			if (at >= 0) patch.claims.splice(at, 1);
			if (patch.claims.length > 0) return;
			patches.delete(shell);
			if (Object.getOwnPropertyDescriptor(shell, "submit")?.value !== patch.patched) return;
			try {
				Object.defineProperty(shell, "submit", {
					configurable: true,
					writable: true,
					value: patch.original
				});
			} catch {}
		}
		/**
		* Hang one armed message on the box's own send, and take it off again.
		*
		* The send is patched in place on the shell object: the button, Enter and the queue all
		* call it, and there is no other seam that sees all three. A second card joins the patch
		* already in place rather than stacking another one, so one press merges the whole queue
		* and dropping one card does not unhook its neighbours.
		*
		* Enter reaches this seam from inside the box's own edit, where the merge's write to the
		* draft is still queued in the editor; a send started there would carry the sentence and
		* none of the annotations. The box is asked whether the write is in, and a press that it
		* has not taken yet goes out one turn later, when it has.
		* @param armed - what the card armed.
		* @param done - called once the send has the annotation, so the card can go.
		* @returns a function that unhooks this card.
		*/
		function holdSubmit(armed, done) {
			const shell = armed.shell;
			const existing = patches.get(shell);
			if (existing !== void 0) {
				existing.claims.push({
					armed,
					done
				});
				return () => {
					release(shell, armed);
				};
			}
			const original = shell.submit;
			if (original === void 0) return () => {};
			const claims = [{
				armed,
				done
			}];
			/**
			* The press that is already waiting to go, so a burst of them is still one message.
			*
			* Only a press the box queued waits at all; the ones that went straight out have
			* already cleared this by the time the next arrives.
			*/
			let waiting = false;
			const patched = (...args) => {
				const merge = mergeInto(shell, claims);
				if (merge === void 0) {
					original.apply(shell, args);
					return;
				}
				const send = () => {
					try {
						for (const claim of claims) for (const id of claim.armed.admission?.ids ?? []) if (shell.removeAttachment?.(id) !== true) return;
						original.apply(shell, args);
					} finally {
						waiting = false;
						settleClaims(shell, claims, merge);
					}
				};
				if (wroteThrough(shell, merge)) {
					send();
					return;
				}
				if (waiting) return;
				waiting = true;
				setTimeout(send, 0);
			};
			try {
				Object.defineProperty(shell, "submit", {
					configurable: true,
					writable: true,
					value: patched
				});
			} catch {
				return () => {};
			}
			patches.set(shell, {
				original,
				patched,
				claims
			});
			return () => {
				release(shell, armed);
			};
		}
		/**
		* Take an armed annotation back out of the composer.
		*
		* Nothing was written into the box, so there is no text to cut: only the picture the
		* card uploaded, released so the draft stops holding a file nobody will send.
		* @param armed - what `armReview` reported.
		* @param conversation - the composer service, for releasing the held attachment.
		*/
		function disarmReview(armed, conversation) {
			for (const id of armed.attachmentIds) {
				armed.shell.removeAttachment?.(id);
				conversation?.releaseDraftAttachment?.(id);
			}
		}
		/**
		* Park one annotation above the composer, without sending it.
		*
		* The message is built before anything is armed: the card is the parsed message, so a
		* parser that stopped recognising it would leave the card showing that text rather than
		* a card promising something the send does not do.
		* @param input - the annotation and the delivery the card stands for.
		*/
		function parkInComposer(input) {
			const { document: document_, locale, paths, sessionId } = input;
			let armed = input.conversation === void 0 ? void 0 : armReview(input.conversation, sessionId, "", input.file, input.files);
			const planned = (input.file === void 0 ? 0 : 1) + (input.files?.length ?? 0);
			const attached = armed?.attachmentIds.length ?? planned;
			const pageCapture = input.pageCapture === "attached" && attached === 0 ? "failed" : input.pageCapture;
			const message = buildAnnotationMessage(document_, paths, locale, attached > 0, Math.min(input.pageImages ?? 0, attached), pageCapture);
			if (armed !== void 0 && input.conversation !== void 0) {
				const admission = armed.attachmentIds.length === 0;
				const drafts = admission && armed.shell.removeAttachment !== void 0 ? holdFiles(input.conversation, sessionId, [new File([Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="), (char) => char.charCodeAt(0))], "figmark-draft.png", { type: "image/png" })]) : [];
				const ids = admission ? drafts.map((draft) => draft.id) : armed.attachmentIds;
				const conversation = input.conversation;
				if (ids.length > 0 && attach(armed.shell, ids)) armed = {
					...armed,
					attachmentIds: ids,
					staged: true,
					...admission ? {
						previewUrls: drafts.flatMap((draft) => draft.previewUrl === void 0 ? [] : [draft.previewUrl]),
						admission: {
							ids,
							release: () => {
								for (const id of ids) conversation.releaseDraftAttachment?.(id);
							}
						}
					} : {}
				};
				else {
					for (const id of ids) conversation.releaseDraftAttachment?.(id);
					armed = void 0;
				}
			}
			rememberDelivered(message, input.thumb);
			parkAnnotation({
				sessionId,
				data: matchAnnotation(message, 0)?.data ?? {
					file: document_.figure.path,
					scope: "",
					target: "",
					instruction: "",
					html: false,
					pageCapture: "none",
					marks: []
				},
				raw: message,
				conversation: input.conversation,
				armed: armed === void 0 ? void 0 : {
					...armed,
					text: message
				},
				send: input.send
			});
		}
		//#endregion
		//#region src/client/review-attachment.ts
		/**
		* Turning a rendered review into the file the composer's rail can hold.
		*
		* The composer stages attachments as files, and the review the reader is about to send
		* is a picture or a PDF that this plugin rendered in the page. Nothing here reads or
		* rewrites bytes: the name is the one the direct send would have given the same
		* content, so the rail, the bubble and the written file all say the same thing about
		* the same bytes.
		* @module dsh-figmark/client/review-attachment
		*/
		/**
		* The path a browser URL should name its attachment with.
		*
		* Query and hash describe page state, not a different document. Keeping them would
		* put `?chrome=1` in the file name the composer and transcript show. Filesystem paths
		* are left untouched because `?` and `#` are legal filename characters there.
		* @param path - the figure's path or URL.
		* @returns the URL without query or hash, or the filesystem path verbatim.
		*/
		function attachmentPath(path) {
			return /^[a-z][a-z\d+.-]*:\/\//iu.test(path) ? path.replace(/[?#].*$/u, "") : path;
		}
		/**
		* The review picture, as a draft attachment.
		* @param review - the PNG the surface exported, when it exported one.
		* @param path - the document the picture belongs to, for the attachment's name.
		* @returns the file, or undefined when there is no picture to stage.
		*/
		function reviewImageFile(review, path) {
			return review === void 0 ? void 0 : new File([review], `${baseNameOf(attachmentPath(path))}.annotated.png`, { type: "image/png" });
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
		* The glow is the mark's own colour, not a fixed one. A blue glow is the panel's
		* colour, and a red mark lit blue says the two things are not the same thing; the
		* reader who picked red for a reason gets a picture where red is what glows. Writing
		* that as a rule per colour is what makes `filter` stay a stylesheet decision: the
		* colour rides on the element as an attribute, and the rules take it from there — one
		* rule per colour in use, rather than an inline `style` that would overwrite whatever
		* the figure's author wrote.
		*
		* The light is only ever a glow. A filled base was tried for an element that covers a
		* large share of the figure — the white plot face of a matplotlib figure changes 754 of
		* its 106,000 pixels under a glow, which is to say the glow arrives alone — and it was
		* wrong twice over: an element's *box* is a rectangle the figure never drew, so a curve
		* that spans the plot got a square of colour behind it, and a plot face got repainted
		* in a colour its author never chose. Whatever the element paints, the glow already
		* follows it; nothing is filled, nothing is repainted.
		*
		* The same rules are what the *delivered* picture uses: {@link lightMarkup} writes them
		* into the review SVG, so the picture the agent reads is lit exactly the way the
		* reader's own panel lit it. `filter`, and the `rgba()` inside it, survive the figure
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
		/** The attribute a lit element carries its colour on, as a bare six-digit hex. */
		const COLOUR_ATTR = "data-da-spot-color";
		/** The attribute that marks the `style` element this module writes, so it can be found. */
		const STYLE_ATTR = "data-da-spot";
		/** The colours already written into that `style`, so a rule is never written twice. */
		const STYLE_COLOURS_ATTR = "data-da-spot-colours";
		/** A colour this module can light with: six hex digits, with or without the hash. */
		const COLOUR = /^#?([0-9a-f]{6})$/i;
		/** The SVG namespace, for the `style` element this module writes into a figure. */
		const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
		/**
		* The pale ring that separates the glow from whatever the element sits on.
		*
		* Over dark line work a glow alone vanishes into it, so the light is drawn as two
		* shadows: a pale ring first, then the colour. Both are at a fixed size rather than
		* following the figure's stroke weight, because this is the panel talking, not the
		* figure. Selected elements are lit harder rather than boxed: a dashed frame around
		* the element's box was what this used to draw, and it had exactly the failing the
		* light was introduced to fix. The reader already knows which mark is selected — the
		* comment pill opens on it and the list row is highlighted — so the picture only has
		* to say *brighter*.
		*/
		const PALE = "drop-shadow(0 0 1.4px rgba(255,255,255,.95))";
		const PALE_SELECTED = "drop-shadow(0 0 1.8px rgba(255,255,255,1))";
		/**
		* What an element glows in when its mark's colour cannot be read.
		*
		* A mark made by an older version, or by hand, may carry anything at all in its colour
		* field. Lighting it in a hue the panel invented would put the wrong colour into the
		* figure, so the fallback is ink: emphasis without a hue.
		*/
		const UNREADABLE = "rgba(63,63,70,.9)";
		/**
		* The colour as a selector-safe key, or `undefined` when it is not one this can light.
		* @param colour - a mark's colour, as the sidecar spells it.
		* @returns the six lowercase hex digits, or `undefined`.
		*/
		function colourKey(colour) {
			return COLOUR.exec(colour)?.[1]?.toLowerCase();
		}
		/**
		* The key as an `rgba()` at the given alpha.
		* @param key - six hex digits, as {@link colourKey} returns them.
		* @param alpha - the opacity to write, as CSS spells it: `.95`, not `0.95`.
		* @returns the CSS colour.
		*/
		function rgba(key, alpha) {
			const value = Number.parseInt(key, 16);
			return `rgba(${value >> 16 & 255},${value >> 8 & 255},${value & 255},${alpha})`;
		}
		/**
		* What lit elements look like, with one rule per colour named.
		*
		* The colourless rules come first so they are the fallback, and a coloured rule
		* overrides them by carrying one more attribute in its selector.
		*
		* One declaration per rule: the `filter`. Nothing is filled and nothing is boxed —
		* a base under the element would be a shape the figure never drew, which is the
		* bracket this light replaced, drawn heavier.
		*
		* @param colours - the colours to write rules for; unreadable ones are skipped.
		* @returns the stylesheet text.
		*/
		function spotRule(colours) {
			const light = (pale, radius, colour) => `{filter:${pale} drop-shadow(0 0 ${radius}px ${colour})}`;
			const base = `.${SPOT_CLASS}${light(PALE, 3, UNREADABLE)}.${SPOT_CLASS}.${SPOT_SELECTED_CLASS}${light(PALE_SELECTED, 5, UNREADABLE)}`;
			const keys = colours.map((colour) => colourKey(colour)).filter((key) => key !== void 0);
			return base + [...new Set(keys)].map((key) => `.${SPOT_CLASS}[${COLOUR_ATTR}="${key}"]${light(PALE, 3, rgba(key, ".95"))}.${SPOT_CLASS}.${SPOT_SELECTED_CLASS}[${COLOUR_ATTR}="${key}"]${light(PALE_SELECTED, 5, rgba(key, "1"))}`).join("");
		}
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
		* Put the light on the named elements and take it off every other one.
		*
		* The whole set is handed in rather than one element at a time: a placed mark's light
		* lasts as long as the mark does and the picker's preview comes and goes on top of it,
		* so only the caller knows the complete answer. An empty list puts every light out.
		*
		* The class and the colour attribute are added and removed rather than a `style`
		* written and unwritten: an element's `style` attribute may belong to the figure's
		* author, and editing it would mean putting it back byte for byte. Neither a class nor
		* a `data-` attribute can be confused with anything the author wrote.
		*
		* The rules go into each element's own document, because the figure's elements are not
		* always in the panel's: a rendered document is a document of its own.
		*
		* @param previous - the elements lit last time, if any.
		* @param next - the elements to light now.
		* @returns the elements lit now, to be handed back next time.
		*/
		function moveSpotlight(previous, next) {
			const coloursOf = /* @__PURE__ */ new Map();
			for (const spot of next) {
				const document_ = spot.element.ownerDocument;
				/* v8 ignore next -- an element that exists has always had an owner document. */
				if (document_ === null) continue;
				const colours = coloursOf.get(document_) ?? [];
				colours.push(spot.colour);
				coloursOf.set(document_, colours);
			}
			for (const [document_, colours] of coloursOf) ensureSpotlight(document_, colours);
			const keeps = new Set(next.map((spot) => spot.element));
			for (const spot of previous) {
				if (keeps.has(spot.element)) continue;
				spot.element.classList.remove(SPOT_CLASS, SPOT_SELECTED_CLASS);
				spot.element.removeAttribute(COLOUR_ATTR);
			}
			for (const spot of next) {
				const key = colourKey(spot.colour);
				spot.element.classList.add(SPOT_CLASS);
				spot.element.classList.toggle(SPOT_SELECTED_CLASS, spot.selected);
				if (key === void 0) spot.element.removeAttribute(COLOUR_ATTR);
				else spot.element.setAttribute(COLOUR_ATTR, key);
			}
			return next;
		}
		/**
		* Add the light's rules to a document, once per colour.
		*
		* A rendered document runs under a policy that forbids scripts and allows inline
		* styles, and it is its own document, so the panel's stylesheet cannot reach into it:
		* a `style` element in the figure's document is the only place a rule for it can be
		* written. Idempotent, because the light is asked for on every pointer move, and
		* additive, because each call knows only the colours it is about: rules already
		* written stay, so alternating between two lit elements does not rewrite the sheet.
		*
		* @param document_ - the document the elements to light live in.
		* @param colours - the colours the caller is about to light, if any.
		*/
		function ensureSpotlight(document_, colours = []) {
			const existing = document_.querySelector(`style[${STYLE_ATTR}]`);
			const style = existing ?? document_.createElement("style");
			if (existing === null) {
				style.setAttribute(STYLE_ATTR, "");
				const parent = document_.head ?? document_.documentElement;
				parent.insertBefore(style, parent.firstChild);
			}
			const written = (style.getAttribute(STYLE_COLOURS_ATTR) ?? "").split(",").filter((key) => key !== "");
			const added = colours.map((colour) => colourKey(colour)).filter((key) => key !== void 0 && !written.includes(key));
			if (added.length === 0 && existing !== null) return;
			const all = [...written, ...new Set(added)];
			style.textContent = spotRule(all);
			style.setAttribute(STYLE_COLOURS_ATTR, all.join(","));
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
		* @param spots - the elements to light, as their anchors name them, and their colours.
		* @returns the same figure with the light written into it.
		*/
		function lightMarkup(markup, spots) {
			if (spots.length === 0) return markup;
			const parsed = new DOMParser().parseFromString(markup, "image/svg+xml");
			const root = parsed.documentElement;
			if (parsed.querySelector("parsererror") !== null || root.tagName.toLowerCase() !== "svg") return markup;
			const lit = [];
			const colours = [];
			for (const spot of spots) {
				const element = elementAt({
					root,
					selector: spot.selector
				});
				if (element === void 0 || lit.includes(element)) continue;
				const key = colourKey(spot.colour);
				element.classList.add(SPOT_CLASS);
				if (key === void 0) element.removeAttribute(COLOUR_ATTR);
				else element.setAttribute(COLOUR_ATTR, key);
				lit.push(element);
				colours.push(spot.colour);
			}
			if (lit.length === 0) return markup;
			const style = parsed.createElementNS(SVG_NAMESPACE, "style");
			style.textContent = spotRule(colours);
			root.insertBefore(style, root.firstChild);
			return new XMLSerializer().serializeToString(root);
		}
		/** The class this module puts on a lit element. */
		const SPOTLIGHT_CLASS = SPOT_CLASS;
		/** The class a lit element wears while it is the selected mark. */
		const SPOTLIGHT_SELECTED_CLASS = SPOT_SELECTED_CLASS;
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
		* @param lit - the elements to light and their colours, already resolved from the marks.
		* @returns the figure's elements.
		*/
		function figureSvg(layer, lit = []) {
			if (layer.kind === "raster") return `<image x="0" y="0" width="${layer.width}" height="${layer.height}" href="${layer.dataUrl}"/>`;
			const litMarkup = lightMarkup(layer.markup, lit);
			const root = new DOMParser().parseFromString(litMarkup, "image/svg+xml").documentElement;
			root.setAttribute("x", "0");
			root.setAttribute("y", "0");
			root.setAttribute("width", String(layer.width));
			root.setAttribute("height", String(layer.height));
			if (layer.viewBox !== void 0) root.setAttribute("viewBox", layer.viewBox);
			root.setAttribute("preserveAspectRatio", "xMidYMid meet");
			return new XMLSerializer().serializeToString(root);
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
			const lit = marks.flatMap((mark) => {
				const selector = mark.kind === "element" ? mark.anchor?.selector : void 0;
				return selector === void 0 ? [] : [{
					selector,
					colour: mark.color
				}];
			});
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
		* Draw one element mark as the basic outline the live page showed.
		*
		* A file-backed element mark is drawn as a glow on the element. That glow belongs
		* to the page's own markup; once the page has become a PNG, the only honest line
		* is the same box the live overlay drew. The faint fill keeps the words beneath it
		* legible while making the selected area obvious at a glance.
		* @param mark - the element mark to outline.
		* @param unit - the screenshot's size multiple.
		* @returns the outline and its white separator.
		*/
		function elementMarkSvg(mark, unit) {
			const [first, second] = mark.points;
			if (first === void 0 || second === void 0) return "";
			const x = Math.min(first[0], second[0]);
			const y = Math.min(first[1], second[1]);
			const width = Math.abs(second[0] - first[0]);
			const height = Math.abs(second[1] - first[1]);
			const radius = 2 * unit;
			return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${mark.color}" fill-opacity="0.07" stroke="#ffffff" stroke-width="${3.5 * unit}"/><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="none" stroke="${mark.color}" stroke-width="${1.5 * unit}"/>`;
		}
		/**
		* Compose the current live viewport as a review image.
		*
		* The page supplies one screenshot of its whole document. This function places it
		* under one clipping window, translates it to the current scroll, and draws the
		* page's own marks over it. The result is exactly what the reader saw and what the
		* agent needs: the current state of the page, its boxes, and no DSH chrome.
		* @param source - the screenshot and the window it was taken through.
		* @param marks - marks already limited to the page's current surface.
		* @returns standalone SVG markup.
		*/
		function composeLiveScreenshotSvg(source, marks) {
			const width = Math.max(1, source.viewportWidth);
			const height = Math.max(1, source.viewportHeight);
			const unit = figureUnit(width, height);
			const numbers = markOrdinals(marks);
			return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><clipPath id="dsh-live-viewport"><rect x="0" y="0" width="${width}" height="${height}"/></clipPath></defs><rect x="0" y="0" width="100%" height="100%" fill="#ffffff"/><g clip-path="url(#dsh-live-viewport)"><g transform="${`translate(${-source.scrollX} ${-source.scrollY})`}"><image x="${source.imageRect[0]}" y="${source.imageRect[1]}" width="${source.imageRect[2]}" height="${source.imageRect[3]}" preserveAspectRatio="none" href="${source.imageDataUrl}"/>` + marks.map((mark) => mark.kind === "element" ? elementMarkSvg(mark, unit) : markSvg(mark, numbers.get(mark.id), unit)).join("") + "</g></g></svg>";
		}
		/**
		* Rasterize one review SVG and optionally its attachment thumbnail.
		* @param svg - standalone SVG markup.
		* @param width - output width in pixels.
		* @param height - output height in pixels.
		* @param scale - device scale applied to the output size.
		* @param withThumb - whether the same canvas should also yield a card picture.
		* @returns the PNG blob and, when requested, its thumbnail.
		* @throws {Error} when the SVG cannot be decoded into an image.
		*/
		async function rasterizePngWithThumb(svg, width, height, scale, withThumb = false) {
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
				return {
					image: blob,
					...withThumb ? { thumb: thumbnailFromCanvas(canvas, canvas.width, canvas.height) } : {}
				};
			} finally {
				URL.revokeObjectURL(url);
			}
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
			return (await rasterizePngWithThumb(svg, width, height, scale)).image;
		}
		//#endregion
		//#region src/client/html-dom.ts
		/**
		* Width every document is first laid out at, in figure pixels.
		*
		* Fixed rather than the pane's width: a document reflows, so marks measured at one
		* width would mean something else at another. Rendering at one width and scaling the
		* result to the pane gives marks the same standing a PDF page has. A document that
		* declares a wider stage may still widen the surface after its first layout; the
		* important invariant is that its first layout and all element coordinates begin at
		* 1024 CSS pixels.
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
		/**
		* Policy for the read-only preview.
		*
		* A static document may be a self-contained deck whose inline script is what turns
		* its slides. The preview therefore permits inline script, but no external script,
		* stylesheet, font, media, frame, form action, or fetch/XHR connection. Inline script
		* can still navigate its own opaque frame, but cannot reach the plugin.
		*/
		const PREVIEW_POLICY = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:; media-src data: blob:; connect-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'";
		/**
		* The attribute a document may name its own theme in.
		*
		* The name is a convention neither CSS nor HTML defines, which is exactly why a
		* document that uses one cannot be read without it: the palette is declared under
		* this attribute and nowhere else, so a document that arrives here without it has
		* no colours at all.
		*/
		const THEME_ATTRIBUTE = "data-theme";
		/** The class a slide deck conventionally uses for each page of the deck. */
		const DECK_SLIDE_SELECTOR = ".slide";
		/** Marks a local document whose slides this panel turns itself. */
		const DECK_ATTRIBUTE = "data-figmark-deck";
		/** Identifies one slide inside a document this panel has prepared. */
		const SLIDE_ATTRIBUTE = "data-figmark-slide";
		/** Identifies the one slide that is in front. */
		const CURRENT_SLIDE_ATTRIBUTE = "data-figmark-slide-current";
		/** Marks the style element that makes the slide choice authoritative. */
		const DECK_STYLE_ATTRIBUTE = "data-figmark-deck-style";
		/**
		* The only page-turn a scriptless deck can perform.
		*
		* A deck normally starts with every slide in the same stacking context and lets its
		* script switch the visible one. Scripts are deliberately off here, so its no-script
		* fallback stacks every slide into one long sheet. Hiding all but one slide restores
		* the page the author designed; the rules are `!important` because they have to win
		* over both that fallback and whatever class the deck normally toggles.
		*/
		const DECK_STYLE = `
html[${DECK_ATTRIBUTE}] [${SLIDE_ATTRIBUTE}]:not([${CURRENT_SLIDE_ATTRIBUTE}]) {
  display: none !important;
  visibility: hidden !important;
}
html[${DECK_ATTRIBUTE}] [${SLIDE_ATTRIBUTE}][${CURRENT_SLIDE_ATTRIBUTE}] {
  visibility: visible !important;
}
`;
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
			return prepareDocument(source, CONTENT_POLICY);
		}
		/**
		* Prepare one self-contained document for the read-only preview.
		*
		* The preview follows the same base/refresh safety rules as the annotator's inert
		* document, but allows inline scripts so a static deck can still turn its own pages.
		* @param source - the file's own HTML text.
		* @returns a complete document for the opaque preview frame.
		*/
		function buildPreviewDocument(source) {
			return prepareDocument(source, PREVIEW_POLICY);
		}
		/**
		* Remove document-level escapes and install one content policy.
		* @param source - the file's own HTML text.
		* @param contentPolicy - the CSP appropriate to the frame that will host it.
		* @returns a complete document for that frame.
		*/
		function prepareDocument(source, contentPolicy) {
			const parsed = new DOMParser().parseFromString(source, "text/html");
			adoptDeclaredTheme(parsed);
			for (const element of parsed.querySelectorAll("base")) element.remove();
			for (const element of parsed.querySelectorAll("meta")) if ((element.getAttribute("http-equiv") ?? "").toLowerCase() === "refresh") element.remove();
			const policy = parsed.createElement("meta");
			policy.setAttribute("http-equiv", "Content-Security-Policy");
			policy.setAttribute("content", contentPolicy);
			parsed.head.prepend(policy);
			return `<!doctype html>${parsed.documentElement.outerHTML}`;
		}
		/**
		* The event target that spans a rendered document.
		*
		* A live frame has a window that can intercept a page press before the page sees it.
		* A detached document has no window of its own, so the document is the widest target
		* available and has to own the same guard.
		* @param document_ - the document rendered into the frame.
		* @returns its window when it has one, otherwise the document itself.
		*/
		function eventOwnerOf(document_) {
			return document_.defaultView ?? document_;
		}
		/**
		* Paint a document whose theme its own scripts would have chosen.
		*
		* No script runs in the frame, so a theme applied by one never arrives: the palettes
		* live under `[data-theme="…"]`, nothing matches, and every colour and background
		* resolves to nothing — the page then renders as bare text on bare paper, which is
		* not the page the reader asked to annotate. The first theme the document declares is
		* the one its stylesheet is written around, so that is the one the paper gets.
		*
		* A document that already names a theme keeps it, and one that declares none is left
		* alone: this only fills in what the missing script would have set.
		* @param parsed - the document being prepared.
		*/
		function adoptDeclaredTheme(parsed) {
			const root = parsed.documentElement;
			if (root.hasAttribute(THEME_ATTRIBUTE)) return;
			for (const style of parsed.querySelectorAll("style")) {
				const css = style.textContent;
				const theme = /\[data-theme\s*=\s*["']?([-\w]+)["']?\]/.exec(css)?.[1];
				if (theme === void 0) continue;
				root.setAttribute(THEME_ATTRIBUTE, theme);
				return;
			}
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
		/**
		* Make the static fallback of a slide deck show one page at a time.
		*
		* The detection is intentionally narrow: repeated `.slide` elements are the one
		* convention common enough to act on without guessing about arbitrary documents.
		* Anything else keeps the ordinary scrolling-window behaviour. The deck's own
		* `current`, `active`, or `aria-current` slide wins when it has one; otherwise the
		* first slide is opened.
		* @param root - the rendered document's root element.
		* @returns the deck's slide count and initial slide, or undefined for a normal page.
		*/
		function prepareDeck(root) {
			const slides = [...root.querySelectorAll(DECK_SLIDE_SELECTOR)];
			if (slides.length < 2) return void 0;
			const frameDocument = root.ownerDocument;
			root.setAttribute(DECK_ATTRIBUTE, "");
			slides.forEach((slide, index) => {
				slide.setAttribute(SLIDE_ATTRIBUTE, String(index));
			});
			const declared = slides.findIndex((slide) => slide.classList.contains("current") || slide.classList.contains("active") || slide.getAttribute("aria-current") !== null);
			const index = declared < 0 ? 0 : declared;
			if (frameDocument.head.querySelector(`style[${DECK_STYLE_ATTRIBUTE}]`) === null) {
				const style = frameDocument.createElement("style");
				style.setAttribute(DECK_STYLE_ATTRIBUTE, "");
				style.textContent = DECK_STYLE;
				frameDocument.head.append(style);
			}
			showDeckSlide(root, index);
			return {
				count: slides.length,
				index
			};
		}
		/**
		* Put one prepared slide in front.
		*
		* The return value is the slide itself so the caller can measure the page it just
		* opened. An index outside the deck is clamped, which makes keyboard repeats and a
		* stale count harmless rather than blanking the preview.
		* @param root - a document prepared by {@link prepareDeck}.
		* @param index - the zero-based slide to show.
		* @returns the slide now in front, or undefined when this is not a prepared deck.
		*/
		function showDeckSlide(root, index) {
			const slides = [...root.querySelectorAll(`[${SLIDE_ATTRIBUTE}]`)];
			if (slides.length === 0) return void 0;
			const selected = slides[Math.max(0, Math.min(slides.length - 1, index))];
			/* v8 ignore next -- the clamp above always selects an existing slide. */
			if (selected === void 0) return void 0;
			for (const slide of slides) slide.removeAttribute(CURRENT_SLIDE_ATTRIBUTE);
			selected.setAttribute(CURRENT_SLIDE_ATTRIBUTE, "");
			root.ownerDocument.defaultView?.scrollTo(0, 0);
			return selected;
		}
		/**
		* The size of the prepared slide in front.
		*
		* A normal page is a scrollport and is measured by {@link measureFrameContent}. A
		* deck is a sheet: its frame must take the slide's own size, or fitting it to the
		* pane clips the middle of the slide instead of showing the whole page.
		* @param root - a document prepared by {@link prepareDeck}.
		* @returns the selected slide's laid-out size, or undefined while it has none.
		*/
		function deckSlideSize(root) {
			const selected = root.querySelector(`[${CURRENT_SLIDE_ATTRIBUTE}]`);
			if (selected === null) return void 0;
			const rect = selected.getBoundingClientRect();
			const width = rect.width > 0 ? rect.width : selected.offsetWidth;
			const height = rect.height > 0 ? rect.height : selected.offsetHeight;
			return width > 0 && height > 0 ? {
				width,
				height
			} : void 0;
		}
		/**
		* Which prepared slide contains one selector's element.
		* @param root - a document prepared by {@link prepareDeck}.
		* @param selector - the selector recorded on a mark.
		* @returns the zero-based slide index, or undefined when the element is not in a slide.
		*/
		function deckSlideOf(root, selector) {
			const raw = (root.querySelector(selector)?.closest(`[${SLIDE_ATTRIBUTE}]`) ?? null)?.getAttribute(SLIDE_ATTRIBUTE);
			if (raw === null || raw === void 0) return void 0;
			const index = Number.parseInt(raw, 10);
			return Number.isNaN(index) ? void 0 : index;
		}
		/**
		* Name the logical page currently in front.
		*
		* A static deck this panel prepared has its own marker, while a scriptless fallback
		* may still use the author's conventional `current` or `active` class. Ordinary
		* scrolling pages have no logical page and return undefined.
		* @param root - the rendered document's root element.
		* @returns a selector for the visible surface, or undefined for a normal page.
		*/
		function currentSurfaceSelector(root) {
			const prepared = root.querySelector(`[${CURRENT_SLIDE_ATTRIBUTE}]`);
			const fallback = root.querySelector([
				".slide.current",
				".slide.active",
				".slide[aria-current=\"true\"]",
				".slide[aria-current=\"page\"]"
			].join(","));
			const surface = prepared ?? fallback;
			if (surface === null) return void 0;
			const box = elementBox(surface);
			if (box === void 0 || box[2] === 0 || box[3] === 0) return void 0;
			const body = root.ownerDocument.body;
			return selectorFor(surface, body);
		}
		/**
		* Whether a logical surface a mark names is the one in front.
		*
		* Prepared decks carry their own authoritative marker, so a selector can be compared
		* to the current slide even before layout has measured the frame. Other documents fall
		* back to the same visibility test the browser uses for an element.
		* @param root - the rendered document's root element.
		* @param selector - the selector stored on a mark's `surface` field.
		* @returns true when that surface is being shown, or false when it is behind.
		*/
		function surfaceIsInFront(root, selector) {
			const element = elementAt({
				root,
				selector
			});
			const current = root.querySelector(`[${CURRENT_SLIDE_ATTRIBUTE}]`);
			if (element !== void 0 && current !== null) {
				const slide = element.closest(`[${SLIDE_ATTRIBUTE}]`);
				if (slide !== null) return slide === current;
			}
			return element === void 0 || elementBox(element) !== void 0;
		}
		/**
		* The size the document inside one frame lays out at.
		*
		* A document that has laid out nothing yet reports no height, which is not a size.
		* @param frame - the frame holding the document, if there is one.
		* @returns the content's size, or undefined while it has laid out nothing yet.
		*/
		function measureFrameContent(frame) {
			if (frame === null) return void 0;
			const frameDocument = frame.contentDocument;
			if (frameDocument === null) return void 0;
			const root = frameDocument.documentElement;
			const width = root.scrollWidth;
			const height = root.scrollHeight;
			return height === 0 ? void 0 : {
				width,
				height
			};
		}
		/**
		* How far the document has been scrolled inside its frame.
		*
		* A document in a window scrolls: everything it reports through
		* `getBoundingClientRect` is where the element is *in the window*, while a mark is
		* recorded where the element is *in the document* — the unit a source reader can act
		* on. The difference is this offset, and it is zero for a document that cannot be
		* scrolled (and for one parsed outside a window, which is how the tests see it).
		* @param document - the document to read.
		* @returns the document's scroll offset in its own pixels.
		*/
		function scrollOf(document) {
			const view = document.defaultView;
			return {
				x: view?.scrollX ?? 0,
				y: view?.scrollY ?? 0
			};
		}
		/**
		* The box an element covers in its document's own pixels.
		*
		* The box comes back in window pixels, while a mark records document pixels, which
		* differ by however far the page has been scrolled. A document parsed outside a
		* window reports no view and no offset, and its boxes are already document pixels.
		* @param element - the element to measure.
		* @returns the box, in document pixels.
		*/
		function boxOf$2(element) {
			const rect = element.getBoundingClientRect();
			const scroll = scrollOf(element.ownerDocument);
			return [
				rect.left + scroll.x,
				rect.top + scroll.y,
				rect.width,
				rect.height
			];
		}
		/**
		* The parts of "visible" this panel means by it.
		*
		* `checkVisibility()` on its own only answers for `display` and for content the engine
		* has skipped laying out; a slide put away with `visibility: hidden` — which is how a
		* deck keeps every slide in one file and swaps them — counts as visible, and every mark
		* of every slide would land on the slide in front. Both the current name and the older
		* one for the same check are passed, because browsers agree on neither spelling yet.
		* Opacity is deliberately not checked: a slide mid-fade is a page being turned, and a
		* mark that blinks out and back during the turn looks broken rather than honest.
		*/
		const SHOWN = {
			checkVisibilityCSS: true,
			visibilityProperty: true,
			contentVisibilityAuto: true
		};
		/**
		* Whether a document is showing an element right now.
		*
		* The engine's own answer whenever it has one: `checkVisibility` is precisely this
		* question, and it covers the ways a page hides a thing — a slide that is not up is
		* `visibility: hidden`, a page that is put away is `display: none`, a collapsed
		* section has no box at all. A document parsed by a test double has neither the call
		* nor a cascade, so the fallback asks the two properties that are computed there, and
		* walks up for `display`, which is inherited by nothing.
		* @param element - the element to ask about.
		* @returns true while the element is on the page in front of the reader.
		*/
		function isRendered(element) {
			if (typeof element.checkVisibility === "function") return element.checkVisibility(SHOWN);
			const view = element.ownerDocument.defaultView;
			for (let node = element; node !== null; node = node.parentElement) {
				const style = view?.getComputedStyle(node);
				if (style === void 0) return true;
				if (style.display === "none") return false;
				if (node === element && style.visibility === "hidden") return false;
			}
			return true;
		}
		/**
		* Where an element is, while the document is showing it.
		*
		* A rendered document is one document of many surfaces: a deck keeps every slide in
		* the markup, stacked in the same place, and shows one of them at a time. An element
		* on a slide that is not up still has a box, and that box lands on the slide in front
		* — so "where is this element" and "is its page the page in front" are one question,
		* and this is it.
		* @param element - the element to measure.
		* @returns the box in document pixels, or undefined while the document hides it.
		*/
		function elementBox(element) {
			return isRendered(element) ? boxOf$2(element) : void 0;
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
		* The point arrives in figure pixels — the document's own coordinates, the same space
		* a mark is recorded in — while the hit test asks in window pixels, so the document's
		* scroll offset is taken off here and put back on the box this returns. A document
		* that has been scrolled to is then named for the element the reader is looking at,
		* and not for whatever sits that far up the page.
		*
		* @param document - the frame's document, or nothing when the frame is gone.
		* @param x - point x in figure pixels.
		* @param y - point y in figure pixels.
		* @returns the anchor, or undefined when the point names no element.
		*/
		function anchorInDocument(document, x, y) {
			const choices = elementChoicesInDocument(document, x, y);
			return choices === void 0 ? void 0 : anchorAtOffset(choices, 0);
		}
		/**
		* Every element a point in a rendered document can mean.
		*
		* The exact painted element is first, then the named block that used to be the only
		* possible answer, then the blocks that contain it. The default stays the named block
		* because that is the element a source reader can act on, but the exact element and
		* its parents are available for the reader to choose before committing.
		* @param document - the frame's document, or nothing when the frame is gone.
		* @param x - point x in figure pixels.
		* @param y - point y in figure pixels.
		* @returns the ordered choices and the level a plain click takes.
		*/
		function elementChoicesInDocument(document, x, y) {
			if (document === null || document === void 0) return void 0;
			const body = document.body;
			if (body === null) return void 0;
			const scroll = scrollOf(document);
			const hitX = x - scroll.x;
			const hitY = y - scroll.y;
			const frame = body.getBoundingClientRect();
			const stack = pickStack(document, hitX, hitY);
			if (stack === null) return measureInDocument(body, hitX, hitY);
			let described;
			let wrapper;
			for (const element of stack) {
				if (!body.contains(element) || element === body) continue;
				if (isPaper(element, frame)) continue;
				if (isAnonymousWrapper(element)) {
					wrapper ??= element;
					continue;
				}
				described = element;
				break;
			}
			described ??= wrapper;
			if (described === void 0) return void 0;
			return choicesAround(described, wrapper, body);
		}
		/**
		* Build a document choice ladder from the exact element and its containing blocks.
		* @param described - the block a plain click names.
		* @param wrapper - an anonymous inline descendant under the pointer, if any.
		* @param body - the document body, excluded from the ladder.
		* @returns the ordered choices.
		*/
		function choicesAround(described, wrapper, body) {
			const elements = [described];
			if (wrapper !== void 0 && wrapper !== described) elements.unshift(wrapper);
			const root = body.ownerDocument.documentElement;
			for (let parent = described.parentElement; parent !== null && parent !== body && parent !== root; parent = parent.parentElement) if (!elements.includes(parent)) elements.push(parent);
			return {
				anchors: [describeInDocument(elements[0], body), ...elements.slice(1).map((element) => describeInDocument(element, body))],
				preferred: elements.indexOf(described)
			};
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
			if (described === void 0) return void 0;
			return choicesAround(described, wrapper, body);
		}
		/**
		* One element of a rendered document, written as the anchor a mark carries.
		*
		* @param described - the element to name.
		* @param body - the document body the selector is rooted at.
		* @returns the anchor.
		*/
		function describeInDocument(described, body) {
			const text = anchorTextOf(described);
			return {
				tag: described.tagName.toLowerCase(),
				bbox: boxOf$2(described),
				...described.id === "" ? {} : { id: described.id },
				...text === "" ? {} : { text },
				selector: selectorFor(described, body)
			};
		}
		//#endregion
		//#region src/client/shown-marks.ts
		/**
		* Which of a rendered document's marks the document is showing right now.
		*
		* An HTML figure is one document with many surfaces: a deck keeps all of its slides in
		* the same file and shows one of them at a time, and a document that scrolls shows one
		* windowful of its page. A mark is recorded where the reader drew it, in the document's
		* own pixels, and the overlay is drawn over the window — so every mark of every slide
		* lands on the slide in front, which is an annotation the reader never made about the
		* page they are looking at.
		*
		* The document itself is the only authority on which of its elements it is showing, and
		* it can change without telling anyone: a deck's page turns on a keypress, on a click,
		* on a timer. So the answer is not computed once — it is re-read every frame, and only
		* a change is news.
		* @module dsh-figmark/client/shown-marks
		*/
		/**
		* Read which marks the document in the frame is showing.
		*
		* Only a mark that names an element has an answer: a drawing is somewhere in the
		* document by its own coordinates, whatever page is up, while an element its document
		* has hidden is nowhere the reader can see.
		*
		* An element that is not in the markup at all is deliberately *not* away. The document
		* may have been edited under the mark, or a selector may have gone stale, and a mark
		* that quietly disappears is a worse answer than one that stays where it was drawn: the
		* comment is still the reader's, and the place they made it is the best evidence left
		* of what it was about.
		* @param root - the document to ask, or nothing while the frame has none.
		* @param marks - every mark of the figure.
		* @returns the live boxes of the element marks, and which marks are away.
		*/
		function readShownMarks(root, marks) {
			const boxes = /* @__PURE__ */ new Map();
			const away = /* @__PURE__ */ new Set();
			if (root === null) return {
				boxes,
				away
			};
			const documentRoot = root.nodeType === Node.DOCUMENT_NODE ? root.documentElement : root.nodeType === Node.ELEMENT_NODE ? root : null;
			for (const mark of marks) {
				if (mark.surface !== void 0) {
					const surface = elementAt({
						root,
						selector: mark.surface
					});
					if (documentRoot !== null && !surfaceIsInFront(documentRoot, mark.surface)) {
						away.add(mark.id);
						continue;
					}
					if (surface !== void 0) {
						const surfaceBox = elementBox(surface);
						if (surfaceBox === void 0 || surfaceBox[2] === 0 && surfaceBox[3] === 0) {
							away.add(mark.id);
							continue;
						}
					}
				}
				const selector = mark.anchor?.selector;
				if (selector === void 0) continue;
				const element = elementAt({
					root,
					selector
				});
				if (element === void 0) continue;
				const box = elementBox(element);
				if (box === void 0) {
					away.add(mark.id);
					continue;
				}
				if (box[2] === 0 && box[3] === 0) continue;
				if (mark.kind === "element") boxes.set(mark.id, box);
			}
			return {
				boxes,
				away
			};
		}
		/**
		* The marks the overlay should draw, given what the document is showing.
		*
		* An element mark's box *is* the element — that is the whole claim such a mark makes —
		* so it is drawn at the element's live box rather than at the box it had the day the
		* reader picked it. A deck that rescales itself, a page that reflows under a resized
		* pane, a slide that scrolls into view: the name stays on the thing it names.
		* @param marks - every mark of the figure.
		* @param shown - what the document is showing, or null when nothing has been read yet.
		* @returns the marks to draw, with element marks moved to where their elements are.
		*/
		function shownMarksOf(marks, shown) {
			if (shown === null) return marks;
			if (shown.away.size === 0 && shown.boxes.size === 0) return marks;
			return marks.flatMap((mark) => {
				if (shown.away.has(mark.id)) return [];
				const box = shown.boxes.get(mark.id);
				if (box === void 0) return [mark];
				const corners = [[box[0], box[1]], [box[0] + box[2], box[1] + box[3]]];
				return [{
					...mark,
					points: corners
				}];
			});
		}
		/**
		* Whether two reads say the same thing.
		*
		* The read runs every frame and a frame is not news: comparing by value is what keeps a
		* page that is sitting still from re-rendering the panel sixty times a second.
		* @param left - one read, or null before the first.
		* @param right - the other read.
		* @returns true when both say the same boxes and the same marks are away.
		*/
		function sameShownMarks(left, right) {
			if (left === null || right === null) return left === right;
			if (left.away.size !== right.away.size || left.boxes.size !== right.boxes.size) return false;
			for (const id of left.away) if (!right.away.has(id)) return false;
			for (const [id, box] of left.boxes) {
				const other = right.boxes.get(id);
				if (other === void 0) return false;
				if (other.some((value, index) => value !== box[index])) return false;
			}
			return true;
		}
		/**
		* Follow a rendered document's page as the reader turns it.
		*
		* A frame's document can turn a page for reasons nothing in this panel announces: a
		* script's own key handler, a timer, a class toggled inside the page. Requesting a frame
		* is therefore the only way to be right about it — and the alternative, a listener on
		* the document, would need to know which mutations move an element, which is the
		* layout's question and not one a mutation record answers.
		* @param frame - the frame the document was rendered into.
		* @param marks - every mark of the figure, as they are on this render.
		* @param active - whether there is anything to follow at all.
		* @returns what the document is showing, or null while it has not been read yet.
		*/
		function useShownMarks(frame, marks, active) {
			const [shown, setShown] = (0, react.useState)(null);
			/**
			* The marks the loop should ask about.
			*
			* Kept beside the loop rather than in it: the list changes on every keystroke in the
			* comment pill, and rebuilding the loop there would restart it for a note that says
			* nothing about where anything is.
			*/
			const newest = (0, react.useRef)(marks);
			(0, react.useEffect)(() => {
				newest.current = marks;
			});
			(0, react.useEffect)(() => {
				if (!active) return void 0;
				let handle = 0;
				let previous = null;
				const tick = () => {
					handle = requestAnimationFrame(tick);
					const next = readShownMarks(frame.current?.contentDocument ?? null, newest.current);
					if (sameShownMarks(previous, next)) return;
					previous = next;
					setShown(next);
				};
				handle = requestAnimationFrame(tick);
				return () => {
					cancelAnimationFrame(handle);
				};
			}, [active, frame]);
			return active ? shown : null;
		}
		//#endregion
		//#region src/shared/http.ts
		/** Request header every plugin route requires. */
		const GUARD_HEADER = "x-dsh-figmark";
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
		/** Marker every message either side sends carries. */
		const LIVE_MESSAGE = "dsh-figmark:live";
		/**
		* The message that arms or disarms the picker.
		*
		* Annotation is a mode, not a property of the page: while it is off the page has to
		* behave like the page it is — a click follows a link, a button does its work — and
		* only while it is on does the pointer belong to the panel.
		* @param armed - whether the reader is annotating.
		* @returns the message to post into the frame.
		*/
		function liveModeMessage(armed) {
			return {
				figmark: LIVE_MESSAGE,
				kind: "mode",
				armed
			};
		}
		/**
		* Ask the page to keep measuring the elements saved marks name.
		* @param selectors - unique selectors from the current annotation.
		* @returns the message for the frame.
		*/
		function liveWatchMessage(selectors) {
			return {
				figmark: LIVE_MESSAGE,
				kind: "watch",
				selectors
			};
		}
		/**
		* Ask the picker to move one rung up or down its current element ladder.
		*
		* The palette lives in the parent window while the ladder lives in the framed page,
		* so keyboard focus can remain on the tool button and still drive the picker.
		* @param delta - positive for the containing element, negative for the exact one.
		* @returns the message for the frame.
		*/
		function liveDepthMessage(delta) {
			return {
				figmark: LIVE_MESSAGE,
				kind: "depth",
				delta
			};
		}
		/**
		* Ask the page to bring one saved mark into view.
		* @param requestId - token the page echoes in its answer.
		* @param selector - element locator, or null for a geometric mark.
		* @param surface - logical slide that owns the mark, when it has one.
		* @param bbox - the mark's saved box, used when there is no element locator.
		* @returns the message for the frame.
		*/
		function liveRevealMessage(requestId, selector, surface, bbox) {
			return {
				figmark: LIVE_MESSAGE,
				kind: "reveal",
				requestId,
				selector,
				surface,
				bbox
			};
		}
		/**
		* Ask the page to undo any temporary hidden-layer reveal.
		*
		* Revealing a cover or modal changes only computed style while the reader is looking
		* at the mark. Closing that mark must leave the page in the state its own code chose.
		* @returns the message for the frame.
		*/
		function liveReleaseMessage() {
			return {
				figmark: LIVE_MESSAGE,
				kind: "release-reveal"
			};
		}
		/**
		* Ask the page for its current document as a PNG.
		* @param requestId - token the page echoes in its answer.
		* @returns the message for the frame.
		*/
		function liveCaptureMessage(requestId) {
			return {
				figmark: LIVE_MESSAGE,
				kind: "capture",
				requestId
			};
		}
		/**
		* Whether a value is a finite number.
		* @param value - value to test.
		* @returns true when it is a number that can be drawn from.
		*/
		function isNumber(value) {
			return typeof value === "number" && Number.isFinite(value);
		}
		/**
		* Read a four-number box out of a message, or refuse it.
		* @param value - the value the message carried.
		* @returns the box, or undefined when it is not four finite numbers.
		*/
		function boxOf$1(value) {
			if (!Array.isArray(value) || value.length !== 4) return void 0;
			const [x, y, width, height] = value;
			return isNumber(x) && isNumber(y) && isNumber(width) && isNumber(height) ? [
				x,
				y,
				width,
				height
			] : void 0;
		}
		/**
		* Read a two-number offset out of a message, or refuse it.
		* @param value - the value the message carried.
		* @returns the offset, or undefined when it is not two finite numbers.
		*/
		function offsetOf(value) {
			if (!Array.isArray(value) || value.length !== 2) return void 0;
			const [x, y] = value;
			return isNumber(x) && isNumber(y) ? [x, y] : void 0;
		}
		/**
		* Read a positive width and height pair.
		* @param value - the message field.
		* @returns the pair, or undefined when either side is unusable.
		*/
		function sizeOf(value) {
			const pair = offsetOf(value);
			if (pair === void 0) return void 0;
			const [width, height] = pair;
			return width > 0 && height > 0 && width <= 1e5 && height <= 1e5 ? pair : void 0;
		}
		/**
		* Read a finite rectangle out of a message.
		* @param value - the message field.
		* @returns x, y, width and height, or undefined when any part is unusable.
		*/
		function rectOf(value) {
			if (!Array.isArray(value) || value.length !== 4) return void 0;
			const [x, y, width, height] = value;
			if (!isNumber(x) || !isNumber(y) || !isNumber(width) || !isNumber(height) || Math.abs(x) > 1e5 || Math.abs(y) > 1e5 || width <= 0 || height <= 0 || width > 1e5 || height > 1e5) return;
			return [
				x,
				y,
				width,
				height
			];
		}
		/**
		* Read one string field, ignoring anything that is not a string.
		* @param value - the value the message carried.
		* @returns the string, or undefined.
		*/
		function textOf$1(value) {
			return typeof value === "string" && value.length > 0 ? value : void 0;
		}
		/**
		* Parse a message from a rendered page.
		*
		* Anything that does not answer every question the panel asks is not a pick: a
		* missing box has no place to be drawn at, and a missing selector names no element
		* a reader could act on. Refusing the whole message rather than filling gaps is what
		* keeps a page from steering a mark somewhere the reader never pointed.
		* @param data - whatever arrived on the window's `message` event.
		* @returns the event, or undefined when the message is not one of ours.
		*/
		function parseLiveEvent(data) {
			if (typeof data !== "object" || data === null) return void 0;
			const fields = data;
			if (fields["figmark"] !== "dsh-figmark:live") return void 0;
			if (fields["kind"] === "leave") return { kind: "leave" };
			if (fields["kind"] === "cancel") return { kind: "cancel" };
			if (fields["kind"] === "capture-result") {
				const requestId = textOf$1(fields["requestId"]);
				if (requestId === void 0 || requestId.length > 128) return void 0;
				if (fields["status"] === "failed") {
					const reason = textOf$1(fields["reason"]);
					return {
						kind: "capture-result",
						requestId,
						status: "failed",
						...reason === void 0 || reason.length > 300 ? {} : { reason }
					};
				}
				if (fields["status"] !== "ok") return void 0;
				const dataUrl = fields["dataUrl"];
				const document = sizeOf(fields["document"]);
				const imageRect = fields["imageRect"] === void 0 ? document === void 0 ? void 0 : [
					0,
					0,
					document[0],
					document[1]
				] : rectOf(fields["imageRect"]);
				const viewport = sizeOf(fields["viewport"]);
				const scroll = offsetOf(fields["scroll"]);
				const scale = fields["scale"];
				const surface = fields["surface"] === null ? null : textOf$1(fields["surface"]);
				const bounds = boundsOf(fields["bounds"]);
				if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/png;base64,") || dataUrl.length > 155e5 || document === void 0 || imageRect === void 0 || viewport === void 0 || scroll === void 0 || typeof scale !== "number" || !Number.isFinite(scale) || scale <= 0 || scale > 4 || surface === void 0 || surface !== null && surface.length > 2048 || bounds === void 0) return;
				return {
					kind: "capture-result",
					requestId,
					status: "ok",
					dataUrl,
					document,
					imageRect,
					viewport,
					scroll,
					scale,
					surface,
					bounds
				};
			}
			if (fields["kind"] === "reveal-result") {
				const requestId = textOf$1(fields["requestId"]);
				const status = fields["status"];
				if (requestId === void 0 || requestId.length > 128) return void 0;
				if (status !== "revealed" && status !== "missing" && status !== "hidden" && status !== "wrong-surface") return;
				const surface = fields["surface"] === null ? null : textOf$1(fields["surface"]);
				if (fields["surface"] !== void 0 && (surface === void 0 || (surface?.length ?? 0) > 2048)) return;
				return {
					kind: "reveal-result",
					requestId,
					status,
					...surface === void 0 ? {} : { surface },
					...fields["temporary"] === true ? { temporary: true } : {}
				};
			}
			if (fields["kind"] === "surface") {
				if (fields["selector"] === null) return {
					kind: "surface",
					selector: null
				};
				const selector = textOf$1(fields["selector"]);
				return selector === void 0 || selector.length > 2048 ? void 0 : {
					kind: "surface",
					selector
				};
			}
			if (fields["kind"] === "bounds") {
				const bounds = boundsOf(fields["bounds"]);
				return bounds === void 0 ? void 0 : {
					kind: "bounds",
					bounds
				};
			}
			const scroll = offsetOf(fields["scroll"]);
			if (scroll === void 0) return void 0;
			if (fields["kind"] === "scroll" || fields["kind"] === "ready") return {
				kind: fields["kind"],
				scroll
			};
			const kind = fields["kind"];
			if (kind !== "hover" && kind !== "pick") return void 0;
			const tag = textOf$1(fields["tag"]);
			const selector = textOf$1(fields["selector"]);
			const bbox = boxOf$1(fields["bbox"]);
			if (tag === void 0 || selector === void 0 || bbox === void 0) return void 0;
			const id = textOf$1(fields["id"]);
			const cls = textOf$1(fields["class"]);
			const text = textOf$1(fields["text"]);
			const surface = fields["surface"] === null ? null : textOf$1(fields["surface"]);
			if (fields["surface"] !== void 0 && (surface === void 0 || (surface?.length ?? 0) > 2048)) return;
			const depth = depthOf(fields["level"], fields["count"]);
			return {
				kind,
				tag,
				selector,
				bbox,
				scroll,
				...id === void 0 ? {} : { id },
				...cls === void 0 ? {} : { class: cls },
				...text === void 0 ? {} : { text },
				...surface === void 0 ? {} : { surface },
				...depth === void 0 ? {} : depth
			};
		}
		/**
		* Read two fields as a usable one-based element depth.
		* @param level - reported depth.
		* @param count - reported ladder length.
		* @returns the normalized pair, or undefined when either field is unusable.
		*/
		function depthOf(level, count) {
			return typeof level === "number" && typeof count === "number" && Number.isInteger(level) && Number.isInteger(count) && level >= 1 && count >= level && count <= 512 ? {
				level,
				count
			} : void 0;
		}
		/**
		* Read and cap the watched boxes a page sent.
		* @param value - the message field.
		* @returns the boxes, or undefined when any entry is malformed.
		*/
		function boundsOf(value) {
			if (!Array.isArray(value) || value.length > 256) return void 0;
			const answer = [];
			for (const item of value) {
				if (typeof item !== "object" || item === null) return void 0;
				const fields = item;
				const selector = textOf$1(fields["selector"]);
				const bbox = boxOf$1(fields["bbox"]);
				const visible = fields["visible"];
				if (selector === void 0 || selector.length > 2048 || bbox === void 0 || typeof visible !== "boolean") return;
				answer.push({
					selector,
					bbox,
					visible
				});
			}
			return answer;
		}
		//#endregion
		//#region src/shared/services.ts
		/**
		* The small vocabulary shared by the service browser and the Host scan.
		* @module dsh-figmark/shared/services
		*/
		/** Route that probes loopback services for the browser. */
		const SERVICE_DISCOVER_ROUTE = "/services";
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
		//#endregion
		//#region src/client/live-page.ts
		/**
		* Opening a page that is not a file.
		*
		* A page served by a dev server cannot be read as bytes: what the reader wants to
		* annotate is what the browser would show, after the server's own routing and after
		* the page's own scripts. So the panel asks the Host to stand in front of that
		* server, and frames the address it answers with.
		*
		* The typed address is the reader's, not the proxy's. `localhost:5173` is what a
		* person types, and the browser's own rule is what turns it into a URL — this module
		* only adds the scheme a person does not bother to type, and lets everything else
		* that is nonsense arrive at the Host as a readable refusal.
		* @module dsh-figmark/client/live-page
		*/
		/** The route one live operation is sent to. */
		const LIVE_URL = `${ROUTE_PREFIX}${LIVE_ROUTE}`;
		const SERVICES_URL = `${ROUTE_PREFIX}${SERVICE_DISCOVER_ROUTE}`;
		/** The names that mean a server on this machine. */
		const LOOPBACK_HOSTS = /* @__PURE__ */ new Set([
			"localhost",
			"127.0.0.1",
			"[::1]"
		]);
		/**
		* Read the Host's service list without letting an unchecked object through.
		* @param value - the answer's `services` field.
		* @returns the validated entries, or undefined when any entry is malformed.
		*/
		function servicesOf(value) {
			if (!Array.isArray(value) || value.length > 64) return void 0;
			const services = [];
			for (const item of value) {
				if (typeof item !== "object" || item === null) return void 0;
				const fields = item;
				const url = fields["url"];
				const source = fields["source"];
				const title = fields["title"];
				if (typeof url !== "string" || url === "" || source !== "recent" && source !== "workspace" && source !== "common" || title !== void 0 && typeof title !== "string") return void 0;
				services.push({
					url,
					source,
					...title === void 0 ? {} : { title }
				});
			}
			return services;
		}
		/**
		* Whether a typed string already carries a scheme.
		*
		* A scheme is only recognised with its `//` — `localhost:5173` is a host and a port,
		* and the shortest address a reader types. Reading its `localhost:` as a scheme made
		* the commonest thing anyone types into the one thing that never opened.
		*
		* `http://` and `https://` are the only schemes a loopback page can be reached by,
		* but any scheme at all is left intact: a reader who typed `ftp://…` asked for a
		* specific thing, and the refusal should say so rather than silently trying `http`.
		*/
		const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:\/\//iu;
		/**
		* Turn what the reader typed into the address the Host should open.
		*
		* A bare host is the common case — `localhost:5173`, `127.0.0.1:8000/docs` — and the
		* scheme is the one part nobody types. Anything that still does not parse is `undefined`
		* rather than a guess: an address the reader cannot mean is better handed back to them
		* than sent to a server.
		* @param input - the text in the address field.
		* @returns the address to ask the Host for, or undefined when there is none.
		*/
		function liveAddressOf(input) {
			const text = input.trim();
			if (text === "") return void 0;
			const candidate = HAS_SCHEME.test(text) ? text : `http://${text}`;
			try {
				return new URL(candidate).href;
			} catch {
				return;
			}
		}
		/**
		* Read the text as an address only when it names a loopback HTTP page.
		*
		* The service picker also uses its input as a title filter. `deck` is a valid URL
		* after {@link liveAddressOf} supplies a scheme, but it is a query, not an address
		* the reader asked to open. A loopback host is the unambiguous signal that the text
		* came from the reader as an address.
		* @param input - the text in the search field.
		* @returns a normalized loopback HTTP address, or undefined for a query.
		*/
		function loopbackAddressOf(input) {
			const address = liveAddressOf(input);
			if (address === void 0) return void 0;
			const url = new URL(address);
			return url.protocol === "http:" && LOOPBACK_HOSTS.has(url.hostname) ? address : void 0;
		}
		/**
		* Ask the Host to open one page and frame it.
		*
		* The old page is not closed first: an address that turns out not to be a loopback
		* page leaves the frame the reader was looking at exactly where it was, so a typo
		* costs them nothing.
		* @param address - the normalized address from {@link liveAddressOf}.
		* @returns the page, with the address to frame it from.
		* @throws {AnnotatorHostError} when the Host refuses to open it.
		*/
		async function openLivePage(address) {
			const response = await fetch(LIVE_URL, {
				method: "POST",
				headers: {
					[GUARD_HEADER]: "1",
					"content-type": "application/json"
				},
				body: JSON.stringify({ url: address })
			});
			const body = await response.json();
			if (body.ok !== true || typeof body.url !== "string") throw new AnnotatorHostError(body.error ?? `live page failed with status ${response.status}`);
			return {
				address,
				url: body.url
			};
		}
		/**
		* Stop standing in front of one page.
		*
		* Called when the reader goes back to a file, and when the panel goes away. A proxy
		* nobody is framing is a port still answering on the reader's machine, so this runs
		* on the way out rather than being left to a reload. The expected proxy URL makes a
		* late cleanup harmless: it cannot close a newer preview that replaced this one.
		* @param expectedUrl - the proxy URL this caller owns, when it has one.
		*/
		async function closeLivePage(expectedUrl) {
			const suffix = expectedUrl === void 0 ? "" : `?url=${encodeURIComponent(expectedUrl)}`;
			const response = await fetch(`${LIVE_URL}${suffix}`, {
				method: "DELETE",
				headers: { [GUARD_HEADER]: "1" }
			});
			const body = await response.json();
			if (body.ok !== true) throw new AnnotatorHostError(body.error ?? `live close failed with status ${response.status}`);
		}
		/**
		* Ask the Host which bounded loopback candidates are answering.
		* @param sessionId - the current session, whose workspace may name a port.
		* @param recent - locally remembered loopback addresses.
		* @returns reachable services in stable source order.
		* @throws {AnnotatorHostError} when the Host refuses the scan.
		*/
		async function discoverLiveServices(sessionId, recent) {
			const response = await fetch(SERVICES_URL, {
				method: "POST",
				headers: {
					[GUARD_HEADER]: "1",
					"content-type": "application/json"
				},
				body: JSON.stringify({
					sessionId,
					recent
				})
			});
			const body = await response.json();
			const services = servicesOf(body.services);
			if (body.ok !== true || services === void 0) throw new AnnotatorHostError(typeof body.error === "string" && body.error !== "" ? body.error : `service discovery failed with status ${response.status}`);
			return services;
		}
		/**
		* Turn one reported pick into the anchor a mark carries.
		*
		* A mark is a locator: `tag`, `id`, `text` and the positional `selector` are how a
		* source reader finds the element again, and the box is where it was when the reader
		* pointed at it. The first few classes are kept only as a compact human signature in
		* the record list; navigation continues to use the positional selector.
		* @param picked - what the page reported.
		* @returns the anchor to hang a mark on.
		*/
		function anchorOfPick(picked) {
			const classes = picked.class?.trim().split(/\s+/u).filter(Boolean).slice(0, 3).join(" ");
			return {
				tag: picked.tag,
				bbox: picked.bbox,
				selector: picked.selector,
				...picked.id === void 0 ? {} : { id: picked.id },
				...classes === void 0 || classes === "" ? {} : { class: classes },
				...picked.text === void 0 ? {} : { text: picked.text }
			};
		}
		/**
		* How the chip names a picked element.
		*
		* The panel cannot read the page — it is another origin — so the class the matcher in
		* `elementName` would have looked up never gets looked up. The page reports its own
		* class instead, and the label is built from that: `div.relative` where the reader is
		* pointing, which is the name they would write a comment with.
		* @param picked - what the page reported.
		* @returns the name to draw beside the element.
		*/
		function pickName(picked) {
			const base = picked.tag.toLowerCase();
			if (picked.id !== void 0 && picked.id !== "") return `${base}#${picked.id}`;
			const first = picked.class?.trim().split(/\s+/u)[0];
			return first === void 0 || first === "" ? base : `${base}.${first}`;
		}
		/**
		* Whether a live review needs a screenshot.
		*
		* A pin carries its own coordinate, and a picker mark carries the element's selector
		* and live box. The text is enough to act on both without making the reader wait for
		* a DOM render and PNG encode. A drawn arrow, region, or stroke is the case where the
		* shape itself is evidence the words cannot reproduce.
		* When the current surface, scroll, and viewport are known, marks belonging to
		* another surface and marks outside the visible window are excluded. The post-capture
		* pass uses those facts so a drawing on slide two does not cause a screenshot of
		* slide three.
		* @param marks - the marks being delivered.
		* @param surface - the current logical surface, when the page reports one.
		* @param scroll - the frame's current scroll offset.
		* @param viewport - the frame's current visible size.
		* @returns true when at least one visible mark has drawn geometry.
		*/
		function liveMarksNeedScreenshot(marks, surface, scroll, viewport) {
			return marks.some((mark) => {
				if (mark.kind === "point" || mark.kind === "element") return false;
				if (surface === void 0 || scroll === void 0 || viewport === void 0) return true;
				if (mark.surface !== void 0) {
					if (mark.surface !== surface) return false;
				} else if (surface !== null && mark.anchor?.selector === void 0) return false;
				return touchesViewport(mark.points, scroll[0], scroll[1], scroll[0] + viewport[0], scroll[1] + viewport[1]);
			});
		}
		/**
		* The marks that belong in one screenshot of a live page.
		*
		* The page's bounds are read at capture time, because an element can move after the
		* mark was made. The screenshot is of the current viewport, so marks wholly outside
		* it are left out rather than stretching the picture into the rest of the document.
		* @param marks - the marks being delivered.
		* @param surface - the logical page in front when the screenshot was taken.
		* @param bounds - every watched element's box at that moment.
		* @param scroll - the frame's scroll offset.
		* @param viewport - the frame's visible size.
		* @returns marks ready for the screenshot composer.
		*/
		function liveScreenshotMarks(marks, surface, bounds, scroll, viewport) {
			const boxes = new Map(bounds.map((bound) => [bound.selector, bound]));
			const [left, top] = scroll;
			const right = left + viewport[0];
			const bottom = top + viewport[1];
			return marks.flatMap((mark) => {
				if (mark.surface !== void 0) {
					if (mark.surface !== surface) return [];
				} else if (mark.anchor?.selector === void 0 && surface !== null) return [];
				const selector = mark.anchor?.selector;
				const bound = selector === void 0 ? void 0 : boxes.get(selector);
				if (bound !== void 0 && !bound.visible) return [];
				const points = mark.kind === "element" ? cornersOf(bound?.bbox ?? mark.anchor?.bbox) : mark.points;
				if (!touchesViewport(points, left, top, right, bottom)) return [];
				return [points === mark.points ? mark : {
					...mark,
					points
				}];
			});
		}
		/**
		* Turn one box into the two corners every mark carries.
		* @param box - x, y, width, height.
		* @returns the top-left and bottom-right corners, or no points.
		*/
		function cornersOf(box) {
			if (box === void 0) return [];
			const [x, y, width, height] = box;
			return [[x, y], [x + width, y + height]];
		}
		/**
		* Whether a mark reaches the viewport at all.
		* @param points - the mark's document-space points.
		* @param left - viewport's left edge.
		* @param top - viewport's top edge.
		* @param right - viewport's right edge.
		* @param bottom - viewport's bottom edge.
		* @returns true when any part of the mark's box is visible.
		*/
		function touchesViewport(points, left, top, right, bottom) {
			const first = points[0];
			if (first === void 0) return false;
			let minX = first[0];
			let minY = first[1];
			let maxX = first[0];
			let maxY = first[1];
			for (const [x, y] of points) {
				minX = Math.min(minX, x);
				minY = Math.min(minY, y);
				maxX = Math.max(maxX, x);
				maxY = Math.max(maxY, y);
			}
			const margin = 24;
			return maxX >= left - margin && maxY >= top - margin && minX <= right + margin && minY <= bottom + margin;
		}
		/** The last path segment of a file, which is how a file names itself. */
		function baseName(path) {
			const parts = path.split(/[\\/]/u).filter((part) => part !== "");
			const last = parts[parts.length - 1];
			return last === void 0 ? path : last;
		}
		/**
		* What the address field shows.
		*
		* A field the reader is typing in shows what they typed; otherwise it shows where the
		* frame is pointed — a proxied page's own address, or the file's name when the figure
		* is a file. The name and not the whole path: the field is narrow, and the file is
		* already named by the panel around it.
		* @param liveText - what the reader is typing, or null while they are not typing.
		* @param page - the page being framed, or null for the body's own file.
		* @param path - the file's path on the Host.
		* @returns the text the field holds.
		*/
		function shownAddress(liveText, page, path) {
			if (liveText !== null) return liveText;
			return page === null ? baseName(path) : page.address;
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
		//#region src/client/hover-name.ts
		/** How far above the element's top edge the chip rides, in figure pixels. */
		const LIFT = 22;
		/** How far inside the element the chip sits when there is no room above it. */
		const INSIDE = 4;
		/** The smallest gap kept between the chip and the left edge of the window. */
		const EDGE = 2;
		/** The widest the chip is allowed to get, which is what the right edge clamps against. */
		const MAX_WIDTH = 200;
		/** Classes the panel writes onto the element it is naming, which are not the page's. */
		const OWN_CLASSES = [SPOTLIGHT_CLASS, SPOTLIGHT_SELECTED_CLASS];
		/**
		* A value that changes exactly when the chip would have something new to say.
		*
		* The pointer reports the element it is on for every move, and the chip is drawn by
		* React: without a cheap answer to "is this the same element again?", hovering a page
		* would re-render the panel for every pixel the hand travels. The box is part of the
		* answer because an element can move under a still hand — a page that is still laying
		* itself out — and the label has to travel with it.
		* @param anchor - what the picker named, if anything.
		* @returns a key that is equal for two reports of the same element.
		*/
		function chipKey(anchor) {
			if (anchor === void 0) return "";
			return [
				anchor.tag,
				anchor.id ?? "",
				anchor.selector ?? "",
				anchor.bbox.join(",")
			].join("|");
		}
		/**
		* The first class on the element that the page wrote, rather than the panel.
		* @param element - the element being named.
		* @returns its first own class, or undefined when it has none.
		*/
		function ownClass(element) {
			for (const name of element.classList) if (!OWN_CLASSES.includes(name)) return name;
		}
		/**
		* Name an element the way its author would: `tag`, then `#id`, then `.class`.
		*
		* An `id` is the name the element answers to and the one a stylesheet or a script
		* addresses, so it wins over a class. Falling back to the tag alone keeps the chip
		* useful on markup that has neither — a bare `section` still tells the reader which
		* box they are pointing at.
		* @param anchor - the element's anchor, as the picker read it.
		* @param find - resolves an element's CSS path inside the document it lives in.
		* @returns the name to show.
		*/
		function elementName(anchor, find, named) {
			if (named !== void 0) return named;
			const base = anchor.tag.toLowerCase();
			if (anchor.id !== void 0 && anchor.id !== "") return `${base}#${anchor.id}`;
			const element = anchor.selector === void 0 ? void 0 : find(anchor.selector);
			const name = element === void 0 ? void 0 : ownClass(element);
			return name === void 0 ? base : `${base}.${name}`;
		}
		/**
		* Place the chip over the element it names.
		*
		* The scroll is what the window has travelled: the anchor's box is in document
		* pixels and the chip is drawn in the pane, so the two are the same point only once
		* the page's own offset is taken off.
		* @param box - the element's box in document pixels.
		* @param scroll - how far the document has scrolled inside its window.
		* @param view - the window's size, which the chip stays inside.
		* @returns where to draw the chip.
		*/
		function nameChipAt(box, scroll, view) {
			const top = box[1] - scroll[1];
			return {
				left: Math.min(Math.max(EDGE, box[0] - scroll[0]), Math.max(EDGE, view.width - MAX_WIDTH)),
				top: top - LIFT < 0 ? top + INSIDE : top - LIFT
			};
		}
		/**
		* Where the hover box goes, in the document's own pixels.
		*
		* The same subtraction the name chip makes, but for the whole element: the box is the
		* element's own size, so a wide card is outlined where it lies instead of only named
		* at its corner.
		* @param box - the element's box in document pixels.
		* @param scroll - how far the document has scrolled inside its window.
		* @returns the box to draw in the window's pixels.
		*/
		function hoverBoxAt(box, scroll) {
			return {
				left: box[0] - scroll[0],
				top: box[1] - scroll[1],
				width: box[2],
				height: box[3]
			};
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
				warnings.push(zh ? `另有 ${hidden} 页标注未附图；原 PDF 不上传，请按上方路径和位置说明处理这些页。` : `${hidden} more annotated pages are not attached as images; the PDF itself is not uploaded, so use the path above and the positions and notes for those pages.`);
			}
			const pageCapture = input.pageCapture ?? (input.document.figure.mediaType === "text/html" && shown.length > 0 ? "attached" : "none");
			if (pageCapture === "failed") warnings.push(zh ? "当前页面截图未生成；元素选择器和位置信息仍已随消息发送。" : "The current page could not be captured; its element selectors and positions still travelled with the message.");
			const message = buildAnnotationMessage(input.document, input.paths, input.locale, shown.length > 0, shown.length, pageCapture);
			rememberDelivered(message, input.thumb);
			content.push({
				type: "text",
				text: message
			});
			await promptSession(input.sessions, input.sessionId, session, content, "the session refused the annotation message");
			return warnings;
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
		/** The insets `.da-stage` actually uses. */
		const STAGE_INSETS = {
			top: 14,
			right: 14,
			bottom: 56,
			left: 14
		};
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
		function surfaceOffset(viewportExtent, surfaceExtent, inset = {
			start: 14,
			end: 14
		}) {
			const available = Math.max(0, viewportExtent - inset.start - inset.end);
			if (surfaceExtent > available) return inset.start;
			return inset.start + (available - surfaceExtent) / 2;
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
		* @param insets - the room the stage keeps around its content; the bottom one is
		*   larger because the floating bar lives there rather than over the drawing.
		* @returns the offsets to apply once the new scale is laid out.
		*/
		function anchoredScroll(viewport, pointer, before, after, figure, insets = STAGE_INSETS) {
			const localX = pointer.clientX - viewport.left;
			const localY = pointer.clientY - viewport.top;
			const horizontal = {
				start: insets.left,
				end: insets.right
			};
			const vertical = {
				start: insets.top,
				end: insets.bottom
			};
			const leftBefore = surfaceOffset(viewport.clientWidth, figure.width * before, horizontal);
			const leftAfter = surfaceOffset(viewport.clientWidth, figure.width * after, horizontal);
			const topBefore = surfaceOffset(viewport.clientHeight, figure.height * before, vertical);
			const topAfter = surfaceOffset(viewport.clientHeight, figure.height * after, vertical);
			const figureX = (viewport.scrollLeft + localX - leftBefore) / before;
			const figureY = (viewport.scrollTop + localY - topBefore) / before;
			return {
				scrollLeft: Math.max(0, leftAfter + figureX * after - localX),
				scrollTop: Math.max(0, topAfter + figureY * after - localY)
			};
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
   be moved must be the one that stays reachable — and the palette is the one to keep
   on top, because moving it away is what reveals the bar's grip underneath. */
/* The tools float over the figure in a dark rounded pill so they can be parked
   off whichever corner the reader is working on. Dark rather than light: it sits
   on top of a white figure and a white panel, and a dark chip is what reads as
   "this is a control" instead of as one more piece of the picture. */
.da-palette{position:absolute;z-index:13;display:flex;flex-direction:column;align-items:center;
  padding:6px 5px;border-radius:16px;background:var(--dsw-alias-bg-inverse,#2d2d2d);color:#fff;
  box-shadow:0 8px 26px rgba(10,14,24,.3),0 0 0 1px rgba(255,255,255,.08);
  /* Dragging is direct manipulation and must not lag the pointer. The transition is
     for the two moments where position is decided by the layout instead: the magnetic
     release dock and a resize repair. None of this applies while the hand is down. */
  transition:left 180ms cubic-bezier(.22,1,.36,1),top 180ms cubic-bezier(.22,1,.36,1),
    box-shadow 140ms ease;will-change:left,top;
  /* The panel clips whatever reaches past it, and the palette is positioned outside
     the one child that scrolls, so a strip taller than the panel would leave its last
     tools painted outside the clip — unclickable, and no scroll to reach them. The
     height it is given is the room on the side it grows towards (placementStyle in
     annotator/placement.ts); this turns that bound into reachable tiles, not a cut. */
  overflow:visible;box-sizing:border-box}
.da-palette-scroll{display:flex;flex-direction:column;align-items:center;gap:2px;
  width:100%;min-height:0;max-height:inherit;overflow-y:auto;scrollbar-width:thin}
/* While it is being dragged the pointer is the grip, whatever it passes over. */
.da-palette[data-dragging="true"]{z-index:14;opacity:.94;box-shadow:0 12px 32px rgba(10,14,24,.4),0 0 0 1px rgba(255,255,255,.14);
  transition:none}
.da-palette[data-dragging="true"] *{cursor:move !important}
/* The handle: a block of six dots, the one part of a strip that only drags. The block
   is turned to suit the strip — wider than tall on the bar, taller than wide on the
   palette — because a grip whose proportions fight its strip looks borrowed from the
   other one. */
/* The grip also stays put when the palette is shorter than its tools and has to
   scroll: it is the strip's only way to be moved, so a handle that scrolls out of
   the top is the same dead end as one covered by the bar. It inherits the strip's
   own ground rather than naming it, so the tiles pass underneath instead of
   showing through the handle. On the bar it pins to the left as its row scrolls,
   so the one way to move the strip never disappears off that edge. */
.da-palette-grip{position:sticky;top:0;z-index:1;background:inherit;
  display:flex;align-items:center;justify-content:center;width:26px;height:17px;
  border-radius:5px;cursor:move;color:rgba(255,255,255,.55);touch-action:none;flex:0 0 auto}
.da-palette-grip:hover{color:rgba(255,255,255,.92);background:rgba(255,255,255,.1)}
/* The dots' box follows the block: three across by two down needs width, two across
   by three down needs height. Sized per block rather than once, so the svg is not
   letterboxed inside its own handle. */
.da-grip-dots{width:12px;height:8px;fill:currentColor;display:block}
.da-bar .da-palette-grip{position:sticky;left:0;z-index:2;width:16px;height:18px;background:inherit}
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
/* Keyboard use arrives after the pointer has already picked the tool: switching the
   element depth with Up/Down makes Chrome paint its default two-tone focus ring around the
   last-pressed tile, which reads as a white edge escaping the dark palette. Keep the
   cue, but draw it inside the existing circle in the panel's own accent so focus does
   not change the strip's geometry. */
.da-palette .da-tool:focus-visible,.da-palette-depth-step:focus-visible{
  outline:none!important;box-shadow:inset 0 0 0 1.5px var(--da-accent,#4c8dff)!important}
.da-palette .da-tool .da-tool-icon{height:auto}
.da-palette .da-tool .da-tool-icon svg{width:17px;height:17px;stroke-width:1.7}
/* Element depth sits inside the palette's own column. A floating horizontal legend
   crossed into the document and covered the thing being picked; this narrow footer
   keeps the control in the strip that already owns the pointer. */
.da-palette-depth{display:flex;flex-direction:column;align-items:center;gap:1px;
  width:100%;margin-top:3px;padding-top:4px;border-top:1px solid rgba(255,255,255,.16)}
.da-palette-depth-step{display:inline-flex;align-items:center;justify-content:center;width:100%;height:17px;
  padding:0;border:0;border-radius:4px;background:transparent;color:rgba(255,255,255,.72);
  font:10px/1 var(--dsw-font-family-mono,ui-monospace,monospace);cursor:pointer}
.da-palette-depth-step:hover:not(:disabled){background:rgba(255,255,255,.14);color:#fff}
.da-palette-depth-step:disabled{opacity:.28;cursor:default}
.da-palette-depth>span{min-width:28px;text-align:center;color:#fff;
  font:9.5px/1 var(--dsw-font-family-mono,ui-monospace,monospace);font-variant-numeric:tabular-nums}

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
.da-bar{position:absolute;z-index:12;left:50%;bottom:12px;transform:translateX(-50%);
  display:flex;align-items:center;flex:0 0 auto;flex-wrap:nowrap;
  width:max-content;max-width:calc(100% - 20px);padding:4px 5px;border-radius:16px;
  background:var(--dsw-alias-bg-inverse,#2d2d2d);color:#fff;
  box-shadow:0 8px 26px rgba(10,14,24,.3),0 0 0 1px rgba(255,255,255,.08);
  transition:left 180ms cubic-bezier(.22,1,.36,1),top 180ms cubic-bezier(.22,1,.36,1),
    box-shadow 140ms ease;will-change:left,top}
/* One row at every width: it scrolls sideways before it wraps into a second row
   that would cover the drawing the bottom inset protects. The style fold stays
   outside this scroller so its popup is never clipped. */
.da-bar-scroll{display:flex;align-items:center;gap:2px;flex:1 1 auto;min-width:0;
  overflow-x:auto;overflow-y:hidden;overscroll-behavior-x:contain;scrollbar-width:none}
.da-bar-scroll::-webkit-scrollbar{display:none}
/* Parked: placed from the top by the reader's drag, so the bottom anchor that keeps
   it centred while untouched must not also apply — with both set it stretches. */
.da-bar[data-parked="true"]{bottom:auto}
/* A bar standing in for the page body's own: it is placed by the pane rather than
   dragged, because there is no page yet to park it over. */
.da-bar[data-static="true"]{bottom:8px}
.da-bar[data-dragging="true"]{z-index:14;opacity:.94;box-shadow:0 12px 32px rgba(10,14,24,.4),0 0 0 1px rgba(255,255,255,.14);
  transition:none}
.da-bar[data-dragging="true"] *{cursor:move !important}
/* The bar's buttons are white glyphs on the dark strip, and every state of them is a
   veil of white: the accent is spent on the marks, not on the panel's chrome. */
.da-bar .da-dock-btn{color:#fff}
.da-bar .da-dock-btn:hover{background:rgba(255,255,255,.14)}
.da-bar .da-dock-btn[aria-pressed="true"]{background:rgba(255,255,255,.22);color:#fff}
.da-bar .da-dock-sep{background:rgba(255,255,255,.22)}
.da-bar .da-dock-dot{background:rgba(255,255,255,.75)}
.da-bar .da-dock-count{background:rgba(255,255,255,.85);color:#2d2d2d}
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

/* --- the press ---------------------------------------------------------- */
/* A strip button is the one control in the panel whose click has nothing to open
   and nothing to move: it arms a tool or spends an undo. So the answer is the
   button itself — it goes under the pointer and comes back a shade past its own
   size. The two halves are timed apart, the press short and plain, the release
   long and over-shooting, because a symmetric pair reads as a scale change rather
   than as something being pushed down and let go. Only the two strips wear it: the
   same classes sit on buttons inside cards and folds, where a spring would fight
   the thing the click just opened. */
.da-bar .da-btn,.da-bar .da-dock-btn,.da-palette .da-btn{
  transition:transform .34s cubic-bezier(.2,1.9,.4,1)}
/* No transition on the way down: the button is already under the pointer by the
   time a fast click is over, and a press that takes longer than the click it is
   answering reads as a delay. The spring is the whole gesture, and it starts from
   the same size every time. */
.da-bar .da-btn:active,.da-bar .da-dock-btn:active,.da-palette .da-btn:active{
  transform:scale(.92);transition:none}

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
/* The chosen colour is marked in the panel's own grey rather than in the accent:
   the row is the one place colour is the subject, so a blue ring says "blue" where
   it only meant to say "this one", and it makes the blue swatch look chosen twice. */
.da-swatch[aria-pressed="true"]{box-shadow:0 0 0 3px var(--dsw-alias-label-tertiary,#a1a1aa)}
/* --- the figure on its table -------------------------------------------- */
/* A figure is a sheet on a table, not a picture floating in a void: the white paper
   is what gives the panel a middle, and the gap around it is the margin the eye
   needs to see where the drawing stops. */
.da-stage{position:relative;display:flex;align-items:safe center;justify-content:safe center;flex:1 1 auto;overflow:auto;min-height:0;
  padding:14px 14px 56px;
  background:var(--dsw-alias-bg-document-preview,transparent)}
.da-surface{position:relative;flex:0 0 auto;margin:0;transform-origin:top left}
/* The paper: the figure plus the margin a mark may have needed. It is deliberately
   left transparent — the white sheet belongs to the figure, so a margin that only
   exists because a mark reached past the edge reads as board round a card rather than
   as more of the figure. The exported picture still gets its white fill: that one is
   looked at by someone who has no board behind it. */
.da-paper{background:transparent}
/* A rendered document is a window: a local frame scrolls inside itself and a proxied
   page owns its own scrollport. The stage must not produce a second scrollbar for the
   same gesture. */
.da-stage[data-html]{overflow:hidden}
.da-stage[data-html] .da-paper{border-radius:4px;background:var(--dsw-alias-bg-base,#fff)}
.da-stage[data-page]{overflow:hidden}
.da-stage[data-page] .da-paper{overflow:hidden}
.da-stage[data-page] .da-figure-frame{border-radius:0;box-shadow:none}
/* The figure is the sheet: white, rounded, lifted off the panel. This is the element
   that carries the paper look, which is why the margin can be see-through without the
   drawing losing its edge. */
.da-figure-frame{background:var(--dsw-alias-bg-base,#fff);border-radius:4px;overflow:hidden;
  box-shadow:var(--dsw-elevation-prominent,0 1px 3px rgba(0,0,0,.14),0 8px 24px rgba(0,0,0,.08))}
.da-figure{display:block;user-select:none;-webkit-user-drag:none}
/* The table is a thing you can push. The hand only shows under the tools that
   leave a drag free to move the view: under a drawing tool the same drag draws. */
.da-stage[data-hand="true"]{cursor:default}
.da-stage[data-hand="true"][data-pannable="true"]{cursor:grab}
/* A drag that has started is a hand closed on the table: the cursor is how the
   reader knows the gesture took, without moving the picture first. Every descendant
   too, and not just the stage, because the overlay covers the figure and would
   otherwise keep saying what it said before the press. */
.da-stage[data-panning="true"],.da-stage[data-panning="true"] *{cursor:grabbing !important}
/* The rendered document takes the figure's place, and while no mark-making tool is
   armed it is the reader's own page: it takes the pointer events, so a link follows,
   a button presses, a video plays. A mark on it keeps its own hit area (the overlay
   lets everything else through) — that is the one thing on the page still the
   panel's. */
.da-html{display:block;border:0;background:#fff;pointer-events:none}
.da-stage[data-pass="true"] .da-html{pointer-events:auto}
/* Passing through is not the same as being absent: the marks have to stay pressable,
   so the overlay itself takes no press and only its mark rows do. */
.da-stage[data-pass="true"] .da-overlay{pointer-events:none}
/* The name of the element under the pointer, hung at its corner. A label and not a
   tooltip: it is a chip of the page's own vocabulary — div.relative — so the reader
   reading it can write the sentence they were about to write. It never takes a press;
   the press belongs to the element it names. */
.da-name{position:absolute;z-index:2;max-width:200px;padding:1px 6px;border-radius:4px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none;
  background:rgba(24,24,27,.92);color:#fff;box-shadow:0 1px 3px rgba(0,0,0,.2);
  font:11px/16px var(--dsw-font-family-mono,ui-monospace,SFMono-Regular,Menlo,monospace)}
.da-live-hit{position:absolute;z-index:1;box-sizing:border-box;border:1.5px solid var(--da-accent,#176df2);
  border-radius:3px;background:var(--da-accent-soft,rgba(23,109,242,.12));pointer-events:none}
/* The address of what is framed. At rest it is one corner icon; opening it restores
   a strip above the page so the full path, badge and back action never cover the
   document they describe. Only HTML previews get one.
   The field is one control, not a bare input: a document or globe icon says what kind
   of location is on screen, a quiet badge says the file format or that this is a
   proxied page, and focus rings the whole field instead of suddenly drawing a blue
   outline around a previously borderless text box. */
.da-live-bar{position:absolute;z-index:14;top:10px;
  left:8px;display:flex;align-items:center;
  box-sizing:border-box;width:32px;max-width:calc(100% - 16px);padding:0;
  background:transparent;border:0;pointer-events:none;
  transform-origin:left top;
  transition:width .18s cubic-bezier(.2,.75,.25,1)}
.da-live-bar[data-open="true"]{width:min(540px,max(32px,calc(100% - 70px)));gap:6px}
.da-live-bar[hidden]{display:none}
.da-live-field{display:flex;flex:1 1 auto;align-items:center;gap:6px;min-width:0;width:100%;
  height:31px;box-sizing:border-box;padding:0 6px 0 9px;
  border:0.5px solid color-mix(in srgb,var(--dsw-alias-border-l2,#bbb) 72%,transparent);
  border-radius:999px;background:color-mix(in srgb,var(--dsw-alias-bg-base,#fff) 88%,transparent);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 1px 2px rgba(20,40,80,.035);
  pointer-events:auto;transform-origin:left center;
  transition:border-color .15s ease,box-shadow .15s ease,background .15s ease,width .15s ease}
.da-live-field:hover{border-color:var(--dsw-alias-border-l3,rgba(127,127,127,.46))}
.da-live-field:focus-within{border-color:var(--da-accent,#176df2);
  box-shadow:0 0 0 2px var(--da-accent-soft,rgba(23,109,242,.14));background:var(--dsw-alias-bg-base,#fff)}
.da-live-field[data-open="false"]{flex:0 0 32px;width:32px;height:32px;padding:0;
  justify-content:center;border-radius:9px;cursor:pointer;
  background:color-mix(in srgb,var(--dsw-alias-bg-base,#fff) 84%,transparent);
  box-shadow:0 1px 2px rgba(20,40,80,.08),0 0 0 0.5px var(--dsw-alias-border-l2,rgba(127,127,127,.2));
  backdrop-filter:blur(8px)}
.da-live-field[data-open="false"]:hover{border-color:var(--dsw-alias-border-l3,rgba(127,127,127,.42));
  background:var(--dsw-alias-bg-base,#fff)}
.da-live-field[data-open="false"]:focus-within{flex-basis:32px;
  border-color:var(--da-accent,#176df2);
  box-shadow:0 0 0 2px var(--da-accent-soft,rgba(23,109,242,.14)),0 1px 3px rgba(20,40,80,.1)}
.da-live-toggle{display:flex;align-items:center;justify-content:center;flex:0 0 auto;
  width:24px;height:24px;padding:0;border:0;border-radius:7px;background:transparent;
  color:inherit;cursor:pointer}
.da-live-toggle:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12))}
.da-live-toggle:focus-visible{outline:1.5px solid var(--da-accent,#176df2);outline-offset:1px}
.da-live-field[data-open="false"] .da-live-toggle{width:30px;height:30px;border-radius:9px}
.da-live-bar[data-open="true"] .da-live-field{animation:da-live-field-in .18s cubic-bezier(.2,.75,.25,1)}
@keyframes da-live-field-in{from{opacity:.55;transform:scaleX(.72)}to{opacity:1;transform:scaleX(1)}}
.da-live-icon{width:14px;height:14px;flex:0 0 auto;fill:none;stroke:currentColor;stroke-width:1.55;
  stroke-linecap:round;stroke-linejoin:round;color:var(--dsw-alias-label-tertiary,inherit)}
.da-live-field[data-live="true"] .da-live-icon{color:var(--da-accent,#176df2)}
.da-live-parent{flex:0 1 auto;min-width:0;max-width:48%;overflow:hidden;text-overflow:ellipsis;
  white-space:nowrap;color:var(--dsw-alias-label-tertiary,inherit);
  font:10.5px/1.2 var(--dsw-font-family-mono,ui-monospace,SFMono-Regular,Menlo,monospace)}
.da-live-parent[hidden]{display:none}
.da-live-parent-sep{padding:0 2px;color:var(--dsw-alias-label-tertiary,inherit);opacity:.55}
.da-live-field:focus-within .da-live-parent{display:none}
.da-live-addr{flex:1 1 auto;min-width:0;height:30px;padding:0;border:0;outline:none;
  background:transparent;color:var(--dsw-alias-label-primary,inherit);
  font:11.5px/1.2 var(--dsw-font-family-mono,ui-monospace,SFMono-Regular,Menlo,monospace)}
.da-live-addr::placeholder{color:var(--dsw-alias-label-tertiary,inherit);opacity:.8}
.da-live-badge{flex:0 0 auto;padding:2px 6px;border-radius:999px;
  background:var(--dsw-alias-bg-layer-3,rgba(127,127,127,.1));
  color:var(--dsw-alias-label-tertiary,inherit);font-size:8.5px;font-weight:750;line-height:13px;
  letter-spacing:.08em;text-transform:uppercase;white-space:nowrap}
.da-live-refresh{display:flex;align-items:center;justify-content:center;flex:0 0 auto;
  width:24px;height:24px;padding:0;border:0;border-radius:7px;background:transparent;
  color:var(--dsw-alias-label-tertiary,inherit);cursor:pointer}
.da-live-refresh:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12));
  color:var(--dsw-alias-label-primary,inherit)}
.da-live-refresh:focus-visible{outline:1.5px solid var(--da-accent,#176df2);outline-offset:1px}
.da-live-refresh svg{width:13px;height:13px;fill:none;stroke:currentColor;stroke-width:1.8;
  stroke-linecap:round;stroke-linejoin:round}
/* A scriptless deck turns one page at a time. The pager is deliberately a small chip
   in the opposite corner from the closed address control: it leaves the slide itself
   clear and still gives the reader a visible way to turn a page. */
.da-deck-pager{position:absolute;z-index:14;top:10px;right:10px;display:flex;align-items:center;
  gap:1px;height:32px;padding:2px;box-sizing:border-box;border-radius:10px;
  background:color-mix(in srgb,var(--dsw-alias-bg-base,#fff) 92%,transparent);
  box-shadow:0 1px 3px rgba(20,40,80,.1),0 0 0 0.5px var(--dsw-alias-border-l2,rgba(127,127,127,.24));
  color:var(--dsw-alias-label-secondary,inherit);
  font:10.5px/1 var(--dsw-font-family-mono,ui-monospace,SFMono-Regular,Menlo,monospace);
  font-variant-numeric:tabular-nums}
.da-deck-pager>span{min-width:43px;text-align:center;white-space:nowrap;padding:0 2px}
.da-deck-pager>button{display:flex;align-items:center;justify-content:center;width:25px;height:26px;
  padding:0;border:0;border-radius:7px;background:transparent;color:inherit;cursor:pointer}
.da-deck-pager>button:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12))}
.da-deck-pager>button:focus-visible{outline:1.5px solid var(--da-accent,#176df2);outline-offset:0}
.da-deck-pager>button:disabled{opacity:.28;cursor:default}
.da-deck-pager svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:1.7;
  stroke-linecap:round;stroke-linejoin:round}
.da-live-note{flex:0 0 auto;font-size:11.5px;color:var(--da-quiet,#6b6f75);white-space:nowrap}
.da-live-note[hidden]{display:none}
/* Going back to the file is the reader's way out, so it says so in words: a glyph
   would have to be learned, and there is exactly one of these. */
.da-live-back{flex:0 0 auto;height:32px;padding:0 10px;border:0.5px solid var(--dsw-alias-line-soft,rgba(127,127,127,.28));
  border-radius:8px;background:var(--dsw-alias-bg-base,rgba(255,255,255,.7));color:inherit;
  font-size:11.5px;line-height:1;cursor:pointer;pointer-events:auto}
.da-live-back:hover{background:rgba(127,127,127,.12)}
.da-live-back[hidden]{display:none}
/* An address that did not open says why under the field, in the reader's own words:
   the Host's refusal is the most specific thing anyone can say about it. */
.da-live-error{position:absolute;z-index:15;top:48px;
  left:8px;max-width:min(500px,calc(100% - 24px));
  box-sizing:border-box;padding:6px 9px;border-radius:8px;font-size:11.5px;
  background:color-mix(in srgb,var(--dsw-alias-bg-base,#fff) 94%,transparent);
  box-shadow:0 3px 12px rgba(20,40,80,.12);
  color:var(--dsw-alias-label-error,var(--dsw-alias-state-error-primary,currentColor))}
.da-live-error[hidden]{display:none}
.da-overlay{position:absolute;touch-action:none}
.da-overlay[data-tool="select"]{cursor:inherit}
/* A mark is an object to pick up, while the blank table around it is a table to
   push. Inheriting the stage's grab cursor over both made every mark claim to be
   empty canvas; the move cursor says what a press on the object actually does. */
.da-overlay[data-tool="select"] [data-da-mark]{cursor:move}
.da-overlay[data-tool="select"] [data-da-kind="element"]{cursor:pointer}
.da-overlay:not([data-tool="select"]):not([data-tool="element"]){cursor:crosshair}
/* Picking names a clickable object, not a point to draw. A pointer plus the
   hovered outline says "this whole element is the target"; a drawing crosshair
   made element mode look like one more pen. */
.da-overlay[data-tool="element"]{cursor:default}
.da-overlay[data-tool="element"][data-pick="true"]{cursor:pointer}
/* A drawing tool owns the whole paper. Stored marks stay visible, but their hit
   paths and handles must not steal the stroke that starts on top of one. */
.da-overlay:not([data-tool="select"]) [data-da-mark] path,
.da-overlay:not([data-tool="select"]) [data-da-handle]{pointer-events:none !important}
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
   not tools, and the one that is chosen is only a shade darker than its neighbours. */
.da-dock-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;
  width:28px;height:28px;padding:0;border:0;border-radius:50%;background:transparent;
  color:inherit;cursor:pointer;flex:0 0 auto}
.da-dock-btn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12))}
.da-dock-btn[aria-pressed="true"]{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.16));color:inherit}
.da-dock-btn svg{width:15px;height:15px}
.da-dock-btn:disabled{opacity:.4;cursor:default}
.da-dock-btn:disabled:hover{background:transparent}
/* The one filled control in the panel is the way out of it. */
/* A dot, not a count: "there is a goal written" is all the bar needs to say about
   a field it is not a list of. */
.da-dock-dot{position:absolute;top:3px;right:4px;width:5px;height:5px;border-radius:50%;
  background:var(--dsw-alias-label-tertiary,currentColor)}
.da-dock-sep{width:1px;height:16px;margin:0 3px;background:var(--dsw-alias-border-l3,currentColor);opacity:.6;flex:0 0 auto}
/* The count rides on the list's own button: it is the one thing about the list a
   reader wants without opening it. */
/* The count is part of the button rather than a badge hanging outside it. The bar's
   horizontal scroll clips overflow, so an absolutely positioned corner badge lost its
   top row exactly while the reader was scrolling to the list. A small inline pill is
   both fully painted and a wider target for the same action. */
.da-dock-list{width:auto;min-width:34px;padding:0 5px 0 4px;gap:3px;border-radius:999px}
.da-dock-list svg{width:14px;height:14px}
.da-dock-count{display:inline-flex;align-items:center;justify-content:center;min-width:14px;height:14px;
  padding:0 3px;border-radius:7px;background:rgba(255,255,255,.86);color:#25262b;
  font-size:9px;font-weight:750;line-height:14px;text-align:center;font-variant-numeric:tabular-nums;
  pointer-events:none}

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
.da-float-record{width:min(340px,calc(100% - 22px))}
.da-float-list{width:min(350px,calc(100% - 22px));gap:5px;padding:8px 9px;
  max-height:min(58%,400px);border-radius:11px}
.da-float-list .da-marks{overflow:auto;min-height:0}
.da-list-clear{width:24px;height:24px;padding:0;border-radius:7px}
.da-list-clear svg{width:13px;height:13px}
/* The detail field is placed by arithmetic, not by the stylesheet: its left and top
   come from the mark it belongs to. It is a pill rather than a card — no head, no
   border between the field and the panel — so writing about a mark costs one line
   over the figure instead of a box that covers it. */
.da-float-detail{width:286px;max-width:calc(100% - 16px);gap:0;padding:3px;border-radius:20px;
  flex-direction:row;align-items:flex-end;
  background:color-mix(in srgb,var(--dsw-alias-bg-layer-2,#fff) 94%,transparent);
  box-shadow:0 5px 18px rgba(20,40,80,.14),0 0 0 0.5px rgba(20,40,80,.06);
  backdrop-filter:blur(10px)}
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
.da-comment-remove{flex:0 0 30px;margin-bottom:3px}
.da-comment-send-btn{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;
  border:0;border-radius:50%;background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12));
  color:var(--dsw-alias-label-secondary,currentColor);cursor:pointer;padding:0}
.da-comment-send-btn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.2));
  color:var(--dsw-alias-label-primary,currentColor)}
.da-comment-send-btn[aria-disabled="true"],.da-comment-send-btn:disabled{opacity:.45;cursor:default}
.da-comment-send-btn svg{width:15px;height:15px}
/* Both ways out of the pill are the same neutral chip. Which hand-off is "primary"
   is the reader's judgement at the moment of sending, not something the panel gets to
   pre-decide by painting one of them blue; the class stays on the send-to-agent button
   as the hook the tests and the callers select it by. */
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
.da-mark{display:flex;align-items:center;gap:8px;padding:5px 4px;border-radius:7px;
  border:0.5px solid transparent;min-width:0}
.da-mark:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.08))}
.da-mark[data-selected="true"]{border-color:var(--da-accent,#176df2);
  background:var(--dsw-alias-interactive-bg-hover,rgba(23,109,242,.06))}
/* Two light strokes in the mark's colour, not a block of fill.
   A filled chip on every row is a wall of colour beside a figure that is mostly
   paper; the list should read as a list. The shape leads the row, flush with its
   left edge, and the number is pinned to the shape's bottom-right corner at 8px —
   a footnote on the thing it counts rather than a column of digits the eye reads
   as row numbers before it reads the sentences. */
.da-mark-glyph{position:relative;flex:0 0 auto;display:inline-flex;align-items:center;
  justify-content:center;width:14px;height:14px}
.da-mark-glyph svg{width:12px;height:12px;fill:none;stroke:currentColor;
  stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
/* No halo behind the digit: it sits just outside the glyph's ink, in the row's own
   gutter, so it never crosses a stroke it would have to be painted over. */
.da-mark-num{position:absolute;right:-5px;bottom:-3px;font-size:8px;font-weight:600;
  font-variant-numeric:tabular-nums;line-height:1;letter-spacing:-.1px;
  color:var(--dsw-alias-label-secondary,currentColor)}
.da-mark-text{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:1px;
  padding:0;border:0;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}
.da-mark-title{display:block;font-size:11.5px;line-height:1.35;overflow:hidden;
  text-overflow:ellipsis;white-space:nowrap}
.da-mark-meta{display:block;font-size:9.5px;line-height:1.35;
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

/* A condition, not a flash: the panel could not read the figure, or the file on disk
   is not the one on screen. These stay in the layout at the top of the panel, because
   the reader has to know them before they can do anything about them. */
.da-status{flex:0 0 auto;padding:6px 10px;font-size:12px;color:var(--dsw-alias-label-secondary,inherit)}
.da-status[data-tone="error"]{color:var(--dsw-alias-label-error,var(--dsw-alias-state-error-primary,currentColor))}

/* --- the bubbles --------------------------------------------------------- */
/* What a click just did, said over the figure rather than under it: a reply that
   arrives and leaves again must not move the picture it is about. The stack is a
   column zero pixels tall that grows to fit its cards, so the newest card rises from
   under the last one instead of shoving it down, and it takes no pointer events of
   its own — only its buttons do, so the figure underneath stays reachable. */
/* The corner opposite the tools. The palette keeps the top left — the reader's
   learned place — so the stack takes the top right: a bubble is transient, and the
   one thing it must never do is cover the tool that would fix what it is reporting.
   The cards are right-aligned inside the stack, so the corner still reads as one even
   when a short note leaves most of the stack's width empty. */
.da-toasts{position:absolute;z-index:11;top:14px;right:14px;width:272px;height:0;
  pointer-events:none;transition:height .35s cubic-bezier(.34,1.4,.5,1)}
/* The HTML preview has a real address bar above its page. A toast in the same corner
   would cover the file/page badge and the way back to the file, so it starts below
   the bar — and below the refusal line when one is showing under that bar. */
.da-root[data-html="true"]>.da-toasts{top:58px}
.da-root[data-html="true"][data-live-open="false"]>.da-toasts{top:14px}
.da-root[data-html="true"][data-live-error="true"]>.da-toasts{top:86px}
/* A card is as wide as its sentence, up to the stack's width: a two-word note should
   not look like a dialog. Its place in the column comes from the inline transform and
   its depth from the inline opacity, because both are counts rather than styles. */
.da-toast{position:absolute;top:0;right:0;box-sizing:border-box;width:max-content;max-width:272px;
  display:flex;align-items:flex-start;gap:7px;padding:9px 10px 9px 12px;border-radius:14px;
  background:linear-gradient(180deg,rgba(52,52,56,.90) 0%,rgba(36,36,38,.95) 100%);
  -webkit-backdrop-filter:saturate(180%) blur(22px);backdrop-filter:saturate(180%) blur(22px);
  border:0.5px solid rgba(255,255,255,.12);color:#f5f5f7;font-size:13px;line-height:1.42;
  letter-spacing:.1px;opacity:0;
  box-shadow:inset 0 0.5px 0 rgba(255,255,255,.07),0 6px 18px rgba(0,0,0,.13),0 1px 2px rgba(0,0,0,.10);
  transition:transform .5s cubic-bezier(.34,1.4,.5,1),opacity .4s ease;
  will-change:transform,opacity;pointer-events:auto}
/* On its way out a card fades and loses focus; both are on the same clock so it goes
   as one thing rather than as a rectangle that dims. */
.da-toast[data-leaving="true"]{opacity:0!important;filter:blur(2px);
  transition:opacity .5s ease,filter .5s ease}
/* The height is stated rather than left to the content, because the stack places its
   cards by arithmetic: a pixel of drift between a card's box and the number that
   moved it would show up as a seam between the last two bubbles. */
.da-toast[data-kind="note"]{height:38px}
/* A send is a piece of work, not a notice: it keeps one width so the ring has room. */
.da-toast[data-kind="send"]{width:228px;height:41px}
.da-toast-ico{flex:0 0 auto;position:relative;display:flex;align-items:center;
  align-self:center;color:rgba(255,255,255,.72);margin-top:0}
/* The destination sits in a slot wide enough for the ring that replaces it, so the
   sentence does not shift by a pixel when the send lands. */
.da-toast-ico[data-slot="send"]{position:relative;flex:0 0 22px;width:22px;height:22px;
  margin-top:0;align-self:center;display:grid;place-items:center;color:rgba(255,255,255,.92)}
/* The four shapes share the slot's box, so each one lands on the centre the
   destination occupied: the icons are absolute inside the slot, which is the
   positioned parent they were always meant to have. */
.da-toast-ico .da-dest{position:relative;z-index:1;width:11px;height:11px;color:rgba(255,255,255,.92)}
.da-toast-ico .da-spin,.da-toast-ico .da-ring,.da-toast-ico .da-check,.da-toast-ico .da-cross{
  display:none;position:absolute;inset:0;margin:auto;transform-origin:50% 50%}
.da-toast-ico .da-spin{display:block;width:22px;height:22px;color:rgba(255,255,255,.85);
  animation:da-toast-spin .9s linear infinite}
.da-toast-ico .da-ring{width:22px;height:22px;color:rgba(255,255,255,.92);
  transform:rotate(-90deg)}
.da-toast-ico .da-ring circle{stroke-dasharray:63;stroke-dashoffset:63;
  animation:da-toast-ring .22s ease-out both}
.da-toast-ico .da-check{width:13px;height:13px;color:#fff}
.da-toast-ico .da-check path{stroke-dasharray:26;stroke-dashoffset:26;
  animation:da-toast-check .26s ease-out .18s both}
.da-toast-ico .da-cross{width:11px;height:11px;color:#fff;animation:da-toast-cross .3s cubic-bezier(.34,1.56,.64,1) .16s both}
/* The send, landing: the arc closes as the destination goes, then the mark is drawn.
   White throughout — a check is a shape, and colouring it would make the panel speak
   a second language for the same news. */
.da-toast[data-state="ok"] .da-spin,.da-toast[data-state="fail"] .da-spin{display:none}
.da-toast[data-state="ok"] .da-ring,.da-toast[data-state="fail"] .da-ring{display:block}
.da-toast[data-state="ok"] .da-dest,.da-toast[data-state="fail"] .da-dest{
  animation:da-toast-dest .2s ease both}
.da-toast[data-state="ok"] .da-check{display:block}
.da-toast[data-state="fail"] .da-cross{display:block}
.da-toast-msg{flex:1 1 auto;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
/* The caret is the only sign that more is coming: a cursor at the end of the line. */
.da-toast-msg[data-typing="true"]::after{content:"";display:inline-block;width:1.5px;height:1em;
  margin-left:2px;vertical-align:-2px;background:rgba(255,255,255,.8);
  animation:da-toast-caret .9s steps(1) infinite}
.da-toast-close,.da-toast-resend{flex:0 0 auto;display:flex;align-items:center;justify-content:center;
  width:20px;height:20px;padding:0;border:0;border-radius:50%;background:transparent;
  color:rgba(255,255,255,.4);font:inherit;font-size:15px;line-height:1;margin-top:-1px;
  cursor:pointer;transition:background .16s ease,color .16s ease,transform .16s ease}
.da-toast-resend{display:none;font-size:inherit}
.da-toast-close:hover,.da-toast-resend:hover{background:rgba(255,255,255,.12);color:#fff}
.da-toast-close:active{transform:scale(.9)}
.da-toast-resend:active{transform:scale(.9) rotate(-25deg)}
.da-toast-close:focus-visible,.da-toast-resend:focus-visible{outline:2px solid rgba(255,255,255,.7);outline-offset:1px}
/* A failure trades its × for the ↻ in the same slot: the bubble that could not finish
   the sentence is the one that can start it again. */
.da-toast[data-state="fail"] .da-toast-close{display:none}
.da-toast[data-state="fail"] .da-toast-resend{display:flex}
.da-toast[data-shake="true"]{animation:da-toast-shake .5s cubic-bezier(.36,.07,.19,.97)}
@keyframes da-toast-spin{to{transform:rotate(360deg)}}
@keyframes da-toast-ring{to{stroke-dashoffset:0}}
@keyframes da-toast-dest{to{opacity:0;transform:scale(.6)}}
@keyframes da-toast-check{from{stroke-dasharray:26;stroke-dashoffset:26}to{stroke-dasharray:26;stroke-dashoffset:0}}
@keyframes da-toast-cross{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:none}}
@keyframes da-toast-caret{50%{opacity:0}}
@keyframes da-toast-shake{10%,90%{translate:-1px 0}25%,75%{translate:2px 0}
  40%,60%{translate:-3px 0}50%{translate:3px 0}}
/* Motion is decoration here: every state has a resting form that says the same thing,
   so the whole set can be switched off without losing a word. */
@media (prefers-reduced-motion:reduce){
  .da-toast,.da-toast[data-leaving="true"],.da-toasts{transition:none!important;animation:none!important}
  .da-toast *{animation-duration:.001s!important;animation-delay:0s!important}
  .da-palette,.da-bar{transition:none!important}
  /* The strips' press is a scale, and a scale is the one motion this reader asked
     not to see — the buttons stay put and the click still lands. */
  .da-bar .da-btn,.da-bar .da-dock-btn,.da-palette .da-btn{transition:none!important;transform:none!important}
}
.da-hint{padding:10px 2px;font-size:12px;line-height:1.6;color:var(--da-quiet,var(--dsw-alias-label-tertiary,inherit))}
/* The grey above is for "still working". A failure is not quieter than a wait. */
.da-hint[data-tone="error"]{color:var(--dsw-alias-label-error,var(--dsw-alias-state-error-primary,currentColor))}
/* --- the card a sent annotation block becomes in the transcript ---
   The block is one paragraph of text the model reads; in the bubble it is a small
   sheet instead. Everything here is inline-level on purpose: the slot it draws into
   is inline, so a block-level box would break the paragraph the message sits in. */
.da-card,.da-card-fallback{font:inherit;font-size:12px;line-height:1.5;text-align:left;vertical-align:top;color:inherit}
/* The fallback is the block verbatim, so it keeps the block's own line breaks. */
.da-card-fallback{white-space:pre-wrap}
.da-card{display:inline-flex;flex-direction:column;box-sizing:border-box;width:min(100%,440px);min-width:min(100%,286px);margin:2px 0;padding:0;overflow:hidden;
  border:0.5px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));border-radius:12px;
  background:var(--dsw-alias-bg-base,rgba(255,255,255,.72));
  box-shadow:0 1px 2px rgba(20,40,80,.04);white-space:normal}
/* Review, source navigation and delivery are separate native buttons. */
.da-card button,.da-staged-send{appearance:none;font:inherit;color:inherit;cursor:pointer}
.da-card button:focus-visible,.da-staged-send:focus-visible{outline:2px solid var(--da-accent,#176df2);outline-offset:-2px}
.da-card button:hover,.da-staged-send:hover{background:var(--dsw-alias-bg-layer-2,rgba(128,128,128,.08));color:var(--da-accent,#176df2)}
.da-card-head{width:100%;box-sizing:border-box;border:0;text-align:left;display:flex;align-items:center;gap:8px;min-width:0;padding:7px 9px;
  border-bottom:0.5px solid var(--dsw-alias-border-l2,rgba(128,128,128,.2));
  background:var(--dsw-alias-bg-layer-1,rgba(128,128,128,.025))}
.da-card-shot{position:relative;display:flex;flex:0 0 auto;align-items:center;justify-content:center;width:34px;height:34px;overflow:hidden;border-radius:7px;
  border:0.5px solid var(--dsw-alias-border-l2,rgba(128,128,128,.18));
  background:var(--dsw-alias-bg-layer-3,rgba(128,128,128,.1));color:var(--da-accent,#176df2)}
/* The picture covers the glyph; a picture that fails hides itself, and the glyph
   underneath it all along is what is left. A miss is never an empty box. */
.da-card-shot img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}
.da-card-shot img[hidden]{display:none}
.da-card-glyph{width:18px;height:18px}
.da-card-text{display:flex;flex:1 1 auto;flex-direction:column;gap:2px;min-width:0}
.da-card-title-row{display:flex;align-items:center;gap:6px;min-width:0}
.da-card-title{min-width:0;font-size:11.5px;font-weight:650;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  font-family:var(--dsw-font-family-mono,ui-monospace,SFMono-Regular,Menlo,monospace)}
.da-card-type{flex:0 0 auto;padding:0 5px;border-radius:4px;background:var(--da-accent-soft,rgba(23,109,242,.14));
  color:var(--da-accent,#176df2);font-size:8.5px;font-weight:750;line-height:15px;letter-spacing:.06em}
.da-card-capture{flex:0 0 auto;padding:0 5px;border-radius:4px;background:var(--dsw-alias-bg-layer-3,rgba(128,128,128,.1));
  color:var(--dsw-alias-label-tertiary,inherit);font-size:8.5px;font-weight:650;line-height:15px}
.da-card-scope{display:flex;align-items:center;gap:6px;min-width:0;font-size:10px;line-height:1.35;
  color:var(--dsw-alias-label-tertiary,inherit)}
.da-card-meta{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  font-family:var(--dsw-font-family-mono,ui-monospace,SFMono-Regular,Menlo,monospace)}
.da-card-tally{flex:0 0 auto;min-width:15px;padding:0 4px;border-radius:99px;
  background:var(--dsw-alias-bg-layer-3,rgba(128,128,128,.1));
  color:var(--dsw-alias-label-secondary,inherit);font-size:9px;font-weight:700;
  line-height:14px;text-align:center;font-variant-numeric:tabular-nums}
.da-card-go{display:flex;flex:0 0 auto;align-items:center;justify-content:center;width:22px;height:22px;margin-left:2px;
  border-radius:50%;background:var(--dsw-alias-bg-layer-3,rgba(128,128,128,.1));
  color:var(--dsw-alias-label-tertiary,inherit)}
.da-card-go svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.da-card-head:hover .da-card-go{background:var(--da-accent-soft,rgba(23,109,242,.14));color:var(--da-accent,#176df2)}
/* Each mark is a compact record, not a line of debug output. The row head answers
   "which mark and where"; the element name and selector follow only when the message
   carried them; the reader's sentence is the strongest text. */
.da-card[data-expanded="true"] .da-card-go{transform:rotate(90deg)}
.da-card-body{display:flex;flex-direction:column;min-width:0;padding:0 9px 2px}
.da-card-row{display:flex;flex-direction:column;gap:2px;min-width:0;padding:6px 0}
.da-card-row+.da-card-row{border-top:0.5px solid var(--dsw-alias-border-l2,rgba(128,128,128,.14))}
.da-card-row-head{display:flex;align-items:center;gap:6px;min-width:0}
.da-card-kind{display:flex;flex:0 0 auto;align-items:center;justify-content:center;width:16px;height:16px;border-radius:5px;
  background:var(--da-accent-soft,rgba(23,109,242,.14));color:var(--da-accent,#176df2);
  font-size:8px;font-weight:750;line-height:1;font-variant-numeric:tabular-nums}
.da-card-mark{display:flex;flex:0 1 auto;align-items:center;gap:5px;min-width:0;white-space:nowrap}
.da-card-tag{flex:0 0 auto;color:var(--da-quiet,#6b6f75);
  font:9px/1.3 var(--dsw-font-family-mono,ui-monospace,SFMono-Regular,Menlo,monospace)}
.da-card-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  font-size:11px;font-weight:600;line-height:1.35;color:var(--dsw-alias-label-primary,inherit)}
/* The page a mark belongs to, kept to the left of its name on the same quiet line. */
.da-card-page{flex:0 0 auto;padding:0 4px;border-radius:4px;background:var(--dsw-alias-bg-layer-3,rgba(128,128,128,.1));
  color:var(--dsw-alias-label-tertiary,inherit);font-size:9.5px;line-height:15px}
.da-card-geometry{flex:0 1 auto;min-width:0;margin-left:auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  color:var(--da-quiet,#6b6f75);font:9.5px/1.3 var(--dsw-font-family-mono,ui-monospace,SFMono-Regular,Menlo,monospace)}
.da-card-said{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;
  margin-left:22px;overflow:hidden;overflow-wrap:anywhere;white-space:normal;
  color:var(--dsw-alias-label-secondary,inherit);font-size:10.5px;line-height:1.4}
.da-card-warning{margin-left:22px;color:var(--dsw-alias-label-error,var(--dsw-alias-state-error-primary,inherit));
  font-size:10px;line-height:1.4}
.da-card-rest{display:flex;align-items:center;min-height:26px;color:var(--dsw-alias-label-tertiary,inherit);font-size:10.5px}
/* The goal the reader wrote is not one of the marks, so a rule separates it. */
.da-card-target{flex-direction:row;gap:6px;align-items:baseline;padding:8px 0;
  overflow:visible;white-space:normal;color:var(--dsw-alias-label-secondary,inherit)}
.da-card-goal{flex:0 0 auto;font-size:10px;font-weight:650;color:var(--dsw-alias-label-tertiary,inherit)}
/* The parked annotation, drawn as an attachment chip. Inside the composer card it is
   the card's first child, so it takes the attachment rail's inset — the card itself has
   no horizontal padding, and the rail spends 10px on each side. The dock stacks its
   entries full width, so the chip aligns itself left and keeps a chip's width: it is
   one attachment among the reader's own, not a banner. Nothing about a figure's size or
   a mark's coordinates appears on the face — those live in the block the model reads and
   in the hover titles, because a card is for scanning, not for measuring. Every line is
   one line, truncated: a card that grows to fit a long note is the wall of text this
   whole view exists to replace. */
.da-staged-seat{box-sizing:border-box;padding:0 10px;
  /* The card stacks its children 12px apart; the rail pulls up 6px to tighten against
     the editor, and the chip does the same so it reads as part of that band. */
  margin-bottom:-6px}
/* A seat with nothing portalled into it is not a gap in the card. */
.da-staged-seat:empty{display:none}
.da-staged-seat .da-staged{margin:0}
.da-staged{display:flex;flex-direction:column;align-items:flex-start;box-sizing:border-box;width:100%;margin:0 0 8px}
.da-staged-card{position:relative;box-sizing:border-box;width:min(264px,100%);padding:7px 8px 7px 9px;border-radius:11px;
  border:0.5px solid var(--dsw-alias-border-l2,rgba(0,0,0,.06));
  background:var(--dsw-alias-bg-layer-2,#f7f7f9);box-shadow:0 1px 2px rgba(0,0,0,.025)}
.da-staged-open{appearance:none;display:flex;align-items:center;gap:8px;box-sizing:border-box;width:100%;
  padding:0;border:0;background:none;font:inherit;color:inherit;text-align:left;cursor:pointer}
.da-staged-open:hover .da-staged-title{color:var(--da-accent,#176df2)}
.da-staged-open[disabled]{opacity:.65;cursor:default}
.da-staged-open:focus-visible{outline:2px solid var(--da-accent,#176df2);outline-offset:2px;border-radius:8px}
/* The thumbnail is a tile on whatever surface the chip sits on, so it takes the same
   quiet fill the shipped attachment rail gives its thumbnails rather than the surface's
   own colour — on the card's surface a white tile would be a bare outline. */
.da-staged-shot{position:relative;display:flex;flex:0 0 auto;align-items:center;justify-content:center;
  width:52px;height:42px;overflow:hidden;border-radius:9px;
  border:0.5px solid var(--dsw-alias-border-l2,rgba(0,0,0,.06));
  background:var(--dsw-alias-interactive-bg-hover,#f2f2f4);color:var(--dsw-alias-label-tertiary,inherit)}
.da-staged-shot img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}
.da-staged-glyph{width:18px;height:18px}
/* min-width 0 on the column and on the sentence is what makes the ellipsis possible:
   a flex item refuses to shrink below its content unless it is told it may. */
.da-staged-text{display:flex;flex-direction:column;gap:3px;min-width:0;padding-right:18px}
.da-staged-head{display:flex;align-items:center;gap:5px;min-width:0}
.da-staged-title{min-width:0;flex:1 1 auto;font-size:11.5px;font-weight:650;line-height:1.3;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  font-family:var(--dsw-font-family-mono,ui-monospace,SFMono-Regular,Menlo,monospace)}
.da-staged-capture{flex:0 0 auto;font-size:8.5px;font-weight:650;line-height:1.3;
  color:var(--dsw-alias-label-tertiary,inherit);white-space:nowrap}
.da-staged-count{flex:0 0 auto;min-width:16px;padding:0 4px;border-radius:99px;font-size:9px;line-height:15px;
  text-align:center;font-weight:700;font-variant-numeric:tabular-nums;
  background:var(--dsw-alias-bg-layer-3,rgba(0,0,0,.06));color:var(--da-accent,#176df2);
}
.da-staged-line{display:flex;align-items:center;gap:4px;min-width:0;font-size:10px;line-height:1.35;
  color:var(--dsw-alias-label-secondary,inherit)}
.da-staged-mark-icon{flex:0 0 auto;width:10px;height:10px;color:var(--da-accent,#176df2)}
.da-staged-shape{flex:0 0 auto;font-weight:600;color:var(--dsw-alias-label-secondary,inherit)}
.da-staged-said{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  color:var(--dsw-alias-label-tertiary,inherit)}
/* The remove control rides in the corner the text is padded away from, so it never
   covers a word; it is quiet until the card is under the pointer. */
.da-staged-x{position:absolute;top:6px;right:6px;display:flex;align-items:center;justify-content:center;
  width:20px;height:20px;padding:0;border:0;border-radius:50%;background:none;
  font:inherit;font-size:14px;line-height:1;color:var(--dsw-alias-label-tertiary,inherit);
  opacity:.55;cursor:pointer}
.da-staged-x:hover{opacity:1;background:var(--dsw-alias-bg-layer-3,rgba(0,0,0,.08))}
.da-staged-x:focus-visible{opacity:1;outline:2px solid var(--da-accent,#176df2);outline-offset:1px}
.da-staged-x[disabled]{opacity:.3;cursor:default}
.da-staged-trouble{font-size:11px;line-height:1.5;color:var(--dsw-alias-label-error,#c0392b)}
/* A warning outlives the card it belonged to: the message has already reached the
   session, so removing the card must not make the missing attachment disappear too. */
.da-staged-result{display:flex;align-items:flex-start;gap:6px;box-sizing:border-box;
  width:min(320px,100%);padding:7px 8px;border-radius:9px;
  background:var(--dsw-alias-bg-layer-3,rgba(0,0,0,.06));
  color:var(--dsw-alias-label-secondary,inherit);font-size:11px;line-height:1.5}
.da-staged-result-text{flex:1 1 auto;min-width:0}
.da-staged-result-x{flex:0 0 auto;width:18px;height:18px;padding:0;border:0;border-radius:50%;
  background:none;font:inherit;font-size:13px;line-height:1;cursor:pointer;opacity:.65}
.da-staged-result-x:hover{opacity:1;background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.72))}
.da-staged-result-x:focus-visible{outline:2px solid var(--da-accent,#176df2);outline-offset:1px}
/* Attachments belong to the message. A review may carry several PDF pages,
   and a message may also carry unrelated files; its source is not that snapshot. */
.da-card-actions{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:4px;padding:3px 5px;
  border-top:0.5px solid var(--dsw-alias-border-l2,rgba(128,128,128,.2))}
.da-card-toggle,.da-card-source{border:0;border-radius:6px;background:none;padding:6px 4px;min-height:30px;font-size:11px!important}
.da-card-source{color:var(--da-accent,#176df2)!important}
.da-card-error{padding:6px 9px;color:var(--dsw-alias-label-error,#c0392b);font-size:11px}
.da-card-locator{margin-left:22px;overflow-wrap:anywhere;white-space:pre-wrap;color:var(--dsw-alias-label-tertiary,inherit);
  font:10px/1.5 var(--dsw-font-family-mono,ui-monospace,SFMono-Regular,Menlo,monospace)}
.da-card[data-expanded="true"] .da-card-said{display:block;white-space:pre-wrap;-webkit-line-clamp:unset}
.da-card[data-expanded="true"] .da-card-name{white-space:normal;overflow-wrap:anywhere}
.da-card-target{overflow-wrap:anywhere}
.da-staged-type{font-size:9px;font-weight:650;letter-spacing:.04em;color:var(--dsw-alias-label-tertiary,inherit)}
.da-staged-card[data-expanded="true"]{width:min(440px,100%)}
.da-staged-card[data-expanded="true"] .da-staged-line{display:none}
.da-staged-chevron{display:flex;flex:0 0 18px;margin-left:auto;color:var(--dsw-alias-label-tertiary,#858991)}
.da-staged-chevron svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.5}
.da-staged-open[aria-expanded="true"] .da-staged-chevron{transform:rotate(90deg)}
.da-staged-text{flex:1 1 auto;padding-right:0}
.da-staged-open{padding-right:18px}
.da-staged-details{display:block;width:100%;margin-top:8px;border-top:1px solid var(--dsw-alias-border-main,rgba(128,128,128,.18))}
.da-staged-details .da-card{width:100%;max-width:none;margin:0;border:0;border-radius:0;box-shadow:none;background:transparent}
.da-staged-details .da-card-body{padding:8px 0 0}
.da-overlay[data-tool="select"] [data-da-element-box]{pointer-events:all;cursor:pointer}
.da-staged-details[hidden]{display:none}
.da-staged-send{border:0;border-radius:6px;background:none;min-height:28px;padding:4px 8px;font-size:11px;color:var(--da-accent,#176df2)}
.da-staged-send[disabled]{opacity:.6;cursor:default}

/* --- local service browser ------------------------------------------------ */
.da-service-shell{display:flex;flex-direction:column;height:100%;min-height:0}
.da-service-tabs{display:flex;flex:0 0 auto;align-items:center;gap:4px;box-sizing:border-box;
  min-height:39px;padding:5px 7px;overflow-x:auto;overflow-y:hidden;scrollbar-width:none;
  border-bottom:0.5px solid var(--dsw-alias-border-l2,rgba(127,127,127,.22));
  background:color-mix(in srgb,var(--dsw-alias-bg-base,#fff) 92%,transparent);
  box-shadow:inset 0 -1px 0 rgba(255,255,255,.35)}
.da-service-tabs::-webkit-scrollbar{display:none}
.da-service-list-tab,.da-service-refresh,.da-service-tab{flex:0 0 auto;height:29px;box-sizing:border-box;border-radius:9px}
.da-service-list-tab,.da-service-refresh{display:flex;align-items:center;justify-content:center;width:29px;padding:0;
  border:0.5px solid transparent;background:transparent;color:var(--dsw-alias-label-tertiary,#787d85);
  cursor:pointer}
.da-service-list-tab:hover,.da-service-list-tab[data-active="true"],.da-service-refresh:hover{background:rgba(76,138,99,.09);
  border-color:rgba(76,138,99,.2);color:#2f7049}
.da-service-list-tab:focus-visible,.da-service-refresh:focus-visible,.da-service-tab-open:focus-visible,.da-service-tab-close:focus-visible{
  outline:1.5px solid rgba(76,138,99,.55);outline-offset:1px}
.da-service-list-tab svg,.da-service-refresh svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.45;
  stroke-linecap:round;stroke-linejoin:round}
.da-service-refresh svg{width:12px;height:12px;stroke-width:1.8}
.da-service-refresh:disabled{opacity:.45;cursor:default}
.da-service-tab{display:flex;align-items:center;min-width:74px;max-width:min(210px,46vw);
  border:0.5px solid var(--dsw-alias-border-l2,rgba(127,127,127,.2));
  background:color-mix(in srgb,var(--dsw-alias-bg-layer-2,#f6f7f8) 84%,transparent);
  overflow:hidden;transition:border-color .15s ease,background .15s ease}
.da-service-tab:hover{border-color:rgba(76,138,99,.34);background:rgba(76,138,99,.055)}
.da-service-tab[data-active="true"]{border-color:rgba(76,138,99,.38);
  background:rgba(76,138,99,.1);box-shadow:inset 0 -1.5px 0 #4c8a63}
.da-service-tab-open{display:flex;align-items:center;gap:6px;min-width:0;height:100%;padding:0 4px 0 9px;
  border:0;background:transparent;color:var(--dsw-alias-label-secondary,#555b63);
  font:11px/1 var(--dsw-font-family-mono,ui-monospace,SFMono-Regular,Menlo,monospace);
  text-align:left;cursor:pointer}
.da-service-tab-dot{width:5px;height:5px;flex:0 0 auto;border-radius:50%;background:#6c727a;opacity:.55}
.da-service-tab[data-active="true"] .da-service-tab-dot{background:#4c9a67;opacity:1;
  box-shadow:0 0 0 3px rgba(76,154,103,.12)}
.da-service-tab-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.da-service-tab-close{display:flex;align-items:center;justify-content:center;flex:0 0 auto;width:23px;
  height:23px;margin-right:2px;padding:0;border:0;border-radius:6px;background:transparent;
  color:var(--dsw-alias-label-tertiary,#787d85);cursor:pointer;opacity:.7}
.da-service-tab-close:hover{background:rgba(127,127,127,.13);color:var(--dsw-alias-label-primary,#1b1d20);
  opacity:1}
.da-service-tab-close svg{width:11px;height:11px;fill:none;stroke:currentColor;stroke-width:1.5;
  stroke-linecap:round}
.da-service-tab-open:disabled,.da-service-tab-close:disabled{opacity:.45;cursor:default}
.da-service-errorbar{flex:0 0 auto;padding:7px 11px;border-bottom:0.5px solid rgba(180,35,24,.16);
  background:color-mix(in srgb,var(--dsw-alias-label-error,#b42318) 7%,transparent);
  color:var(--dsw-alias-label-error,#b42318);font-size:11px;line-height:1.4}
.da-service-work{display:flex;flex:1 1 auto;min-height:0}
.da-services{--da-service-ink:var(--dsw-alias-label-primary,#1b1d20);
  --da-service-muted:var(--dsw-alias-label-tertiary,#787d85);
  --da-service-line:color-mix(in srgb,var(--dsw-alias-border-l2,#c9cbd0) 66%,transparent);
  box-sizing:border-box;height:100%;overflow:auto;padding:24px 20px 32px;width:100%;
  color:var(--da-service-ink);
  background:
    radial-gradient(circle at 18% 0%,color-mix(in srgb,#4c8a63 8%,transparent),transparent 36%),
    linear-gradient(180deg,color-mix(in srgb,var(--dsw-alias-bg-base,#fff) 76%,transparent),transparent 48%)}
.da-services-head,.da-service-search,.da-services-toolbar,.da-service-list,.da-services-error{
  width:min(480px,100%);margin-left:auto;margin-right:auto}
.da-services-head{padding:0 4px 18px}
.da-services-head h1{margin:0;font-size:20px;font-weight:680;line-height:1.08;letter-spacing:-.035em}
.da-services-head p{max-width:410px;margin:9px 0 0;color:var(--da-service-muted);font-size:12px;line-height:1.65}
.da-service-search{display:flex;align-items:center;gap:9px;box-sizing:border-box;height:48px;padding:0 7px 0 14px;
  border:1px solid var(--da-service-line);border-radius:15px;
  background:color-mix(in srgb,var(--dsw-alias-bg-base,#fff) 92%,transparent);
  box-shadow:0 10px 30px rgba(25,36,30,.06),inset 0 1px 0 rgba(255,255,255,.7);
  transition:border-color .16s ease,box-shadow .16s ease}
.da-service-search:focus-within{border-color:color-mix(in srgb,#4c8a63 70%,var(--da-service-line));
  box-shadow:0 0 0 3px rgba(76,138,99,.12),0 12px 34px rgba(25,36,30,.08)}
.da-service-search>svg{width:17px;height:17px;flex:0 0 auto;fill:none;stroke:var(--da-service-muted);stroke-width:1.5;
  stroke-linecap:round}
.da-service-search input{flex:1 1 auto;min-width:0;border:0;outline:0;background:transparent;color:inherit;
  font:12px/1.3 var(--dsw-font-family-mono,ui-monospace,SFMono-Regular,Menlo,monospace)}
.da-service-search input::placeholder{color:var(--da-service-muted)}
.da-service-search button{flex:0 0 auto;height:34px;padding:0 14px;border:0;border-radius:10px;
  background:#245f3c;color:#fff;font:600 11px/1 inherit;cursor:pointer}
.da-service-search button:hover:not(:disabled){background:#1d5033}
.da-service-search button:focus-visible{outline:2px solid rgba(76,138,99,.45);outline-offset:2px}
.da-service-search button:disabled{opacity:.42;cursor:default}
.da-services-toolbar{display:flex;align-items:center;justify-content:space-between;padding:20px 4px 9px;
  color:var(--da-service-muted);font:10px/1 var(--dsw-font-family-mono,ui-monospace,SFMono-Regular,Menlo,monospace);
  letter-spacing:.08em;text-transform:uppercase}
.da-services-toolbar button{padding:5px 0 5px 10px;border:0;background:none;color:inherit;font:inherit;
  letter-spacing:inherit;text-transform:inherit;cursor:pointer}
.da-services-toolbar button:hover:not(:disabled){color:var(--da-service-ink)}
.da-services-toolbar button:disabled{opacity:.5;cursor:default}
.da-services-error{margin-top:10px;margin-bottom:0;padding:9px 11px;border-radius:10px;
  background:color-mix(in srgb,var(--dsw-alias-label-error,#b42318) 8%,transparent);
  color:var(--dsw-alias-label-error,#b42318);font-size:11.5px;line-height:1.45}
.da-service-list{display:flex;flex-direction:column;gap:7px}
.da-service-row{appearance:none;display:flex;align-items:center;gap:11px;box-sizing:border-box;
  width:100%;min-height:59px;padding:10px 13px;border:1px solid var(--da-service-line);border-radius:14px;
  background:color-mix(in srgb,var(--dsw-alias-bg-base,#fff) 76%,transparent);color:inherit;
  text-align:left;cursor:pointer;
  animation:da-service-rise .28s cubic-bezier(.2,.75,.25,1) both;
  transition:transform .16s ease,border-color .16s ease,background .16s ease}
.da-service-row:nth-child(2){animation-delay:.035s}.da-service-row:nth-child(3){animation-delay:.07s}
.da-service-row:nth-child(4){animation-delay:.105s}.da-service-row:nth-child(n+5){animation-delay:.14s}
.da-service-row:hover{transform:translateY(-1px);border-color:color-mix(in srgb,#4c8a63 36%,var(--da-service-line));
  background:color-mix(in srgb,#4c8a63 5%,var(--dsw-alias-bg-base,#fff))}
.da-service-row:focus-visible{outline:2px solid rgba(76,138,99,.5);outline-offset:2px}
.da-service-signal{width:7px;height:7px;flex:0 0 auto;border-radius:50%;background:#4c9a67;
  box-shadow:0 0 0 4px rgba(76,154,103,.11)}
.da-service-copy{display:flex;flex:1 1 auto;flex-direction:column;gap:5px;min-width:0}
.da-service-copy strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;font-weight:590;line-height:1.15}
.da-service-copy>span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--da-service-muted);
  font:10.5px/1.2 var(--dsw-font-family-mono,ui-monospace,SFMono-Regular,Menlo,monospace)}
.da-service-copy b{color:color-mix(in srgb,var(--da-service-ink) 76%,var(--da-service-muted));font-weight:540}
.da-service-row>svg{width:14px;height:14px;flex:0 0 auto;fill:none;stroke:var(--da-service-muted);stroke-width:1.5;
  stroke-linecap:round;stroke-linejoin:round}
.da-services-empty{display:flex;flex-direction:column;align-items:center;gap:7px;padding:34px 16px;border:1px dashed var(--da-service-line);
  border-radius:16px;color:var(--da-service-muted);text-align:center;font-size:11.5px;line-height:1.5}
.da-services-empty strong{color:var(--da-service-ink);font-size:13px;font-weight:600}
.da-service-live{flex:1 1 auto;width:100%;height:100%;min-height:0}
.da-service-live[hidden],.da-services[hidden]{display:none}
.da-service-live>.da-root{height:100%}
@keyframes da-service-rise{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
/* A static HTML file gets a window, not the annotator. Its scripts may run inside an
   opaque sandbox, but no annotation surface, sidecar, or capture layer is mounted. */
.da-html-preview{height:100%;min-height:0}
.da-html-preview-frame{display:block;flex:1 1 auto;width:100%;height:100%;min-height:0;border:0;
  background:var(--dsw-alias-bg-document-preview,#fff)}
.da-html-preview-empty{display:grid;place-items:center;height:100%;padding:24px;box-sizing:border-box;
  color:var(--dsw-alias-label-error,var(--dsw-alias-state-error-primary,currentColor));
  font-size:12px;text-align:center}
@media (prefers-reduced-motion:reduce){
  .da-live-bar,.da-live-field,.da-service-row,.da-service-tab{transition:none;animation:none}
}
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
		/** A small bin for clearing a record without spending a word on it. */
		function TrashIcon() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				className: "da-ico",
				viewBox: "0 0 24 24",
				"aria-hidden": "true",
				focusable: "false",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M4.5 7h15M9 7V4.5h6V7M7 7l.8 12.5h8.4L17 7" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M10 10.5v5.5M14 10.5v5.5" })]
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
		/** Put one more copy beside the existing sheet. */
		function CopyIcon() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				className: "da-ico",
				viewBox: "0 0 24 24",
				"aria-hidden": "true",
				focusable: "false",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
						x: "8",
						y: "8",
						width: "11.5",
						height: "11.5",
						rx: "2.2"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M16 8V6.5a2.2 2.2 0 0 0-2.2-2.2H6.7a2.2 2.2 0 0 0-2.2 2.2v7.1A2.2 2.2 0 0 0 6.7 15.8H8" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M13.75 11.3v5M11.25 13.8h5" })
				]
			});
		}
		/** Save a file out of the editor. */
		function DownloadIcon() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				className: "da-ico",
				viewBox: "0 0 24 24",
				"aria-hidden": "true",
				focusable: "false",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12 3.5v11M7.8 10.5 12 14.7l4.2-4.2" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M4.5 16.5v2a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2" })]
			});
		}
		/** Dismiss the editor without suggesting that the draft should be saved. */
		function CloseIcon() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				className: "da-ico",
				viewBox: "0 0 24 24",
				"aria-hidden": "true",
				focusable: "false",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M6.5 6.5l11 11M17.5 6.5l-11 11" })
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
		const TOOLS$1 = [
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
			const { elementGuide, handle, t, tools } = props;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "da-palette",
				ref: props.stripRef,
				"data-dragging": handle.dragging ? "true" : void 0,
				style: props.style,
				role: "toolbar",
				"aria-label": t("tools"),
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "da-palette-scroll",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "da-palette-grip",
							title: t("moveTools"),
							onPointerDown: handle.onDown,
							onPointerMove: handle.onMove,
							onPointerUp: handle.onUp,
							onPointerCancel: handle.onCancel,
							onLostPointerCapture: handle.onLost,
							"aria-grabbed": handle.dragging,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(GripDots, { wide: true })
						}),
						tools.map((entry) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "da-btn da-tool",
							"aria-pressed": props.tool === entry.tool,
							"aria-label": t(entry.label),
							title: entry.tool === "element" && elementGuide !== void 0 ? elementGuide.label : t(entry.label),
							onClick: () => {
								props.onChoose(entry.tool);
							},
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "da-tool-icon",
								"aria-hidden": true,
								children: entry.tool === "select" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(GrabIcon, {}) : ToolIcon(entry.tool)
							})
						}, entry.tool)),
						elementGuide === void 0 || !("depth" in elementGuide) ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "da-palette-depth",
							role: "status",
							"aria-live": "polite",
							"aria-label": elementGuide.label,
							title: elementGuide.label,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "da-palette-depth-step",
									"aria-label": t("toolElementUp"),
									title: t("toolElementUp"),
									disabled: elementGuide.level >= elementGuide.count,
									onClick: () => {
										elementGuide.onDepth(1);
									},
									children: "↑"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: elementGuide.depth }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "da-palette-depth-step",
									"aria-label": t("toolElementDown"),
									title: t("toolElementDown"),
									disabled: elementGuide.level <= 1,
									onClick: () => {
										elementGuide.onDepth(-1);
									},
									children: "↓"
								})
							]
						})
					]
				})
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
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "da-bar-scroll",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "da-palette-grip",
							title: t("moveBar"),
							onPointerDown: handle.onDown,
							onPointerMove: handle.onMove,
							onPointerUp: handle.onUp,
							onPointerCancel: handle.onCancel,
							onLostPointerCapture: handle.onLost,
							"aria-grabbed": handle.dragging,
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
							className: props.listedMarks.length === 0 ? "da-dock-btn" : "da-dock-btn da-dock-list",
							"aria-pressed": props.listOpen,
							"aria-label": t("marks"),
							title: t("marks"),
							onClick: props.onToggleList,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ListIcon, {}), props.listedMarks.length === 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "da-dock-count",
								"aria-hidden": true,
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
				}), props.styleOpen ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
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
				}) : null]
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
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
						ref: props.inputRef,
						className: "da-comment",
						value: mark.detail ?? "",
						placeholder: hasDetail(mark) ? t("detailPlaceholder") : t("addComment"),
						rows: 1,
						maxLength: MAX_DETAIL_CHARS,
						onChange: (event) => {
							props.onWrite(event.target.value);
						},
						onKeyDown: (event) => {
							if (event.key !== "Escape") return;
							event.preventDefault();
							event.stopPropagation();
							event.currentTarget.blur();
						}
					}),
					hasDetail(mark) ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
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
					}) : null,
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "da-comment-send-btn da-comment-remove",
						"aria-label": t("delete"),
						title: t("delete"),
						"aria-disabled": props.busy,
						onClick: () => {
							if (!props.busy) props.onRemove();
						},
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TrashIcon, {})
					})
				]
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
				"data-html": figure?.kind === "html" ? "true" : void 0,
				"data-page": figure?.kind === "html" && props.pageUrl !== void 0 ? "true" : void 0,
				"data-pass": props.passing ? "true" : void 0,
				"data-hand": props.stageClass.hand ? "true" : void 0,
				"data-pannable": props.stageClass.pannable ? "true" : void 0,
				"data-panning": props.stageClass.panning ? "true" : void 0,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "da-surface",
					ref: props.surfaceRef,
					style: props.surfaceStyle,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "da-paper",
						ref: props.paperRef,
						style: props.paperStyle,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
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
									src: props.pageUrl,
									sandbox: props.pageUrl === void 0 ? "allow-same-origin" : "allow-same-origin allow-scripts allow-forms allow-modals allow-popups allow-presentation",
									style: {
										width: props.htmlView.width,
										height: props.htmlView.height
									}
								}, `${props.pageUrl ?? "file"}\u0000${props.frameRevision}`) : null
							}),
							props.overlay,
							props.chip
						]
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
		* @param input.fitHeight - the panel height available below the floating bar, in
		*   pixels. Fitting only the width made a wide, short window enlarge a portrait page
		*   until its lower half, and its marks, sat under the bar.
		* @param input.size - the figure's own size, or null before there is one.
		* @param input.ownerWidth - a width the owner insists on, if any.
		* @returns the factor to draw at, never outside the shared range.
		*/
		function drawingScale(input) {
			if (input.surface === null) return 1;
			if (input.zoom !== "fit") return input.zoom;
			const targetWidth = input.ownerWidth ?? input.fitWidth;
			const widthScale = targetWidth > 0 ? targetWidth / input.surface.width : Number.POSITIVE_INFINITY;
			const heightScale = input.fitHeight > 0 ? input.fitHeight / input.surface.height : Number.POSITIVE_INFINITY;
			const fitted = Math.min(widthScale, heightScale);
			if (!Number.isFinite(fitted)) return 1;
			return Math.min(1.5, Math.max(.05, fitted));
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
		* Whether two boxes touch or cross, with a little breathing room between them.
		*
		* Used after a resize, when a bar parked against one layout can land on the figure
		* in another. Zero-sized boxes are not an overlap: a panel that has not been measured
		* must not look like one whose contents are on top of each other.
		* @param a - one box, in client coordinates.
		* @param b - the other box, in client coordinates.
		* @param gap - the space the two must keep, in pixels.
		* @returns true when they are closer than the gap.
		*/
		function boxesOverlap(a, b, gap = 0) {
			if (a.width <= 0 || a.height <= 0 || b.width <= 0 || b.height <= 0) return false;
			return a.left < b.left + b.width + gap && a.left + a.width + gap > b.left && a.top < b.top + b.height + gap && a.top + a.height + gap > b.top;
		}
		/**
		* How tall the tool palette may remain before it reaches one below it.
		*
		* A short panel cannot always separate a wide bottom bar from a tall tool strip by
		* moving either one: the bar is wider than the panel's free side lanes and the tools
		* are taller than the gap above it. In that one case the palette keeps its corner and
		* scrolls inside a height that stops at the bar's upper gutter. Returning undefined
		* means the boxes do not share a horizontal lane, or the obstacle is not below.
		* The grip remains usable even when the arithmetic leaves less than its own height.
		* @param strip - the strip whose height is being bounded.
		* @param obstacle - the lower strip that must remain reachable.
		* @returns the available pixel height, or undefined when no vertical bound applies.
		*/
		function paletteRoomBeforeBar(strip, obstacle) {
			if (strip.width <= 0 || strip.height <= 0 || obstacle.width <= 0 || obstacle.height <= 0) return;
			if (!(strip.left < obstacle.left + obstacle.width + STRIP_EDGE && strip.left + strip.width + STRIP_EDGE > obstacle.left) || strip.top >= obstacle.top - STRIP_EDGE) return void 0;
			return Math.max(32, Math.floor(obstacle.top - STRIP_EDGE - strip.top));
		}
		/**
		* Where a strip ends up when the pointer dragging it is at a client coordinate.
		*
		* The origin is the strip's position when the press started and the offset is
		* measured against the panel rather than the strip, because moving the strip must
		* not move the frame the next position is measured in.
		*
		* The clamp keeps the strip's top-left and its whole body inside the same gutter at
		* every position. An earlier model flipped the strip's anchor at the panel midpoint;
		* the stored fraction stayed continuous there, but the control itself jumped by its
		* own width or height.
		* @param press - the press being followed.
		* @param pointer - where the pointer is now, in client coordinates.
		* @param panel - the box the fractions are of, in client coordinates.
		* @param strip - the strip's own size, in pixels.
		* @returns the spot to place it at.
		*/
		function draggedSpot(press, pointer, panel, strip) {
			const width = Math.max(1, panel.width);
			const height = Math.max(1, panel.height);
			return clampedSpot({
				x: press.origin.x + (pointer.clientX - press.box.left) / width,
				y: press.origin.y + (pointer.clientY - press.box.top) / height
			}, panel, strip);
		}
		/**
		* Finish a drag with a short, predictable magnetic dock.
		*
		* The drag itself stays under the pointer: snapping every move makes a control feel
		* as if it is fighting the hand. On release, however, a strip within one thumb-width
		* of an edge settles into the same eight-pixel gutter used by clamping. Corners are
		* allowed because both axes are considered, which is what makes parking a control
		* feel like it belongs to the panel rather than merely being unable to leave it.
		* @param spot - the strip's top-left when the pointer was released.
		* @param panel - the panel the fraction is of.
		* @param strip - the strip's measured size.
		* @param obstacle - the other floating strip, when there is one.
		* @returns the spot to persist after the pointer is gone.
		*/
		function settledSpot(spot, panel, strip, obstacle) {
			const desired = clampedSpot(spot, panel, strip);
			const own = boxAt(desired, panel, strip);
			const width = Math.max(1, panel.width);
			const height = Math.max(1, panel.height);
			const minX = Math.min(STRIP_EDGE, panel.width / 2) / width;
			const minY = Math.min(STRIP_EDGE, panel.height / 2) / height;
			const roomX = Math.max(minX, (panel.width - strip.width - STRIP_EDGE) / width);
			const roomY = Math.max(minY, (panel.height - strip.height - STRIP_EDGE) / height);
			const left = own.left - panel.left;
			const right = panel.left + panel.width - own.left - own.width;
			const top = own.top - panel.top;
			const bottom = panel.top + panel.height - own.top - own.height;
			let settled = desired;
			const nearestX = left <= right ? {
				distance: left,
				spot: {
					...settled,
					x: minX
				}
			} : {
				distance: right,
				spot: {
					...settled,
					x: roomX
				}
			};
			if (nearestX.distance <= STRIP_MAGNET && !overlapsObstacle(boxAt(nearestX.spot, panel, strip), obstacle)) settled = nearestX.spot;
			const nearestY = top <= bottom ? {
				distance: top,
				spot: {
					...settled,
					y: minY
				}
			} : {
				distance: bottom,
				spot: {
					...settled,
					y: roomY
				}
			};
			if (nearestY.distance <= STRIP_MAGNET && !overlapsObstacle(boxAt(nearestY.spot, panel, strip), obstacle)) settled = nearestY.spot;
			return avoidObstacle(settled, panel, strip, obstacle);
		}
		/**
		* Keep a parked strip in the pane without covering another strip.
		*
		* Resize repair is not a gesture: the reader is not asking the strip to move, so it
		* must keep its chosen fraction unless the new panel or the other strip makes that
		* impossible. In the latter case the nearest collision-free side wins. `undefined`
		* means the panel is too small to separate them, and the caller may fall back to its
		* canonical safe position.
		* @param spot - the fraction the reader chose.
		* @param panel - the panel the fraction is of.
		* @param strip - the strip's measured size.
		* @param obstacle - the other floating strip.
		* @returns the nearest usable spot, or undefined when they cannot be separated.
		*/
		function separatedSpot(spot, panel, strip, obstacle) {
			const fitted = avoidObstacle(clampedSpot(spot, panel, strip), panel, strip, obstacle);
			return overlapsObstacle(boxAt(fitted, panel, strip), obstacle) ? void 0 : fitted;
		}
		/** Whether a measured box is within the strip-to-strip breathing room. */
		function overlapsObstacle(box, obstacle) {
			return obstacle !== void 0 && boxesOverlap(box, obstacle, STRIP_EDGE);
		}
		/**
		* Resolve a collision by the shortest edge slide that leaves the required gap.
		*
		* At rest, the moving control does not pass underneath the parked one. Four escape
		* directions are tried and the nearest one that remains inside the panel wins. This
		* is deliberately applied only after release: resolving it during a drag would pull
		* the strip away from the pointer.
		*/
		function avoidObstacle(desired, panel, strip, obstacle) {
			if (obstacle === void 0) return desired;
			const desiredBox = boxAt(desired, panel, strip);
			if (!overlapsObstacle(desiredBox, obstacle)) return desired;
			const width = Math.max(1, panel.width);
			const height = Math.max(1, panel.height);
			const minX = Math.min(STRIP_EDGE, panel.width / 2) / width;
			const minY = Math.min(STRIP_EDGE, panel.height / 2) / height;
			const roomX = Math.max(minX, (panel.width - strip.width - STRIP_EDGE) / width);
			const roomY = Math.max(minY, (panel.height - strip.height - STRIP_EDGE) / height);
			const side = collisionSide(desiredBox, obstacle);
			const candidate = {
				x: side === "left" ? (obstacle.left - strip.width - STRIP_EDGE - panel.left) / width : side === "right" ? (obstacle.left + obstacle.width + STRIP_EDGE - panel.left) / width : desired.x,
				y: side === "top" ? (obstacle.top - strip.height - STRIP_EDGE - panel.top) / height : side === "bottom" ? (obstacle.top + obstacle.height + STRIP_EDGE - panel.top) / height : desired.y
			};
			const fitted = {
				x: Math.min(Math.max(minX, candidate.x), Math.max(minX, roomX)),
				y: Math.min(Math.max(minY, candidate.y), Math.max(minY, roomY))
			};
			return overlapsObstacle(boxAt(fitted, panel, strip), obstacle) ? clampedSpot(desired, panel, strip) : fitted;
		}
		/**
		* Which face of the obstacle is the shortest way out.
		*/
		function collisionSide(desired, obstacle) {
			const escapes = {
				left: desired.left + desired.width + STRIP_EDGE - obstacle.left,
				right: obstacle.left + obstacle.width + STRIP_EDGE - desired.left,
				top: desired.top + desired.height + STRIP_EDGE - obstacle.top,
				bottom: obstacle.top + obstacle.height + STRIP_EDGE - desired.top
			};
			return [
				"left",
				"right",
				"top",
				"bottom"
			].reduce((best, side) => escapes[side] < escapes[best] ? side : best, "left");
		}
		/**
		* Keep a strip's top-left, plus its whole body, inside the panel.
		*
		* Both a drag and a resize come through here. A fraction alone cannot promise that
		* the right or bottom of a wide strip is visible, so this is also the repair for a
		* spot remembered against a larger pane.
		* @param spot - the desired top-left fraction.
		* @param panel - the panel the fraction is of.
		* @param strip - the strip's measured size.
		* @returns a top-left fraction whose box keeps the edge gutter.
		*/
		function clampedSpot(spot, panel, strip) {
			const width = Math.max(1, panel.width);
			const height = Math.max(1, panel.height);
			const minX = Math.min(STRIP_EDGE, panel.width / 2) / width;
			const minY = Math.min(STRIP_EDGE, panel.height / 2) / height;
			const roomX = Math.max(minX, (panel.width - strip.width - STRIP_EDGE) / width);
			const roomY = Math.max(minY, (panel.height - strip.height - STRIP_EDGE) / height);
			return {
				x: Math.min(roomX, Math.max(minX, spot.x)),
				y: Math.min(roomY, Math.max(minY, spot.y))
			};
		}
		/** A candidate spot as the screen box collision checks need. */
		function boxAt(spot, panel, strip) {
			return {
				left: panel.left + spot.x * panel.width,
				top: panel.top + spot.y * panel.height,
				width: strip.width,
				height: strip.height
			};
		}
		/**
		* Where a strip already is, as the fraction {@link placementStyle} takes.
		*
		* A strip that has not been parked yet is placed by the stylesheet rather than by a
		* spot — the bar is anchored to the bottom edge and centred — so the only honest
		* origin for its first drag is its own box. Reading it also means a drag always
		* continues from where the reader sees the strip, instead of from whichever corner
		* the default belonged to.
		*
		* The spot is always the strip's top-left corner. An anchor that changed sides at
		* the panel's midlines made one pointer step jump the strip by its own width or
		* height: the position was continuous in the stored number but not on screen.
		* @param box - the strip's current box, in client coordinates.
		* @param panel - the box its fractions are of, in client coordinates.
		* @returns the spot its near or far corner sits at.
		*/
		function spotOfBox(box, panel) {
			const width = Math.max(1, panel.width);
			const height = Math.max(1, panel.height);
			return {
				x: (box.left - panel.left) / width,
				y: (box.top - panel.top) / height
			};
		}
		/**
		* Where a strip sits before the reader moves it: the top left corner.
		*
		* This is the reader's learned place — the README calls it the left floating strip —
		* and it stays that way. The bubble stack is what moved to the free corner (see the
		* `.da-toasts` rule): it is transient, and a few seconds of news should not be the
		* reason every reader has to relearn where the tools are.
		*
		* The weight rail still runs down the left edge, so on a pane under about 800 pixels
		* tall the palette's lower half sits over the rail's upper half. That is the one
		* crossing left; moving either of them would cost more than it buys, and the palette
		* can be dragged clear.
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
		* How close a released strip has to be before it settles into an edge gutter.
		*
		* Twenty-four CSS pixels is roughly one comfortable touch target. It is measured
		* from the visible body, not from the stored fraction, so a very wide bar behaves
		* the same as the narrow vertical palette.
		*/
		const STRIP_MAGNET = 24;
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
			const room = 1 - spot.y;
			return {
				left: `${spot.x * 100}%`,
				top: `${spot.y * 100}%`,
				maxHeight: `max(0px, calc(${room * 100}% - ${STRIP_EDGE}px))`,
				transform: "none"
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
		* Show what a delivery could not do, without turning a successful send into a failure.
		*
		* A warning arrives after the message is already in the session. The component still
		* needs to say it, but the send must not be presented as retryable; the one call site
		* therefore only ever asks for an informational line.
		* @param warnings - what the delivery could not attach or include.
		* @param show - where the panel puts an informational line.
		*/
		function reportDeliveryWarnings(warnings, show) {
			const text = warnings.join(" ");
			if (text === "") return;
			show({
				tone: "info",
				text
			});
		}
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
		* A rendered document is measurable as soon as its window is: the surface is the pane
		* the document is shown through, not the document's own length — a page scrolls inside
		* its window, so a sheet as long as the page would be a sheet nobody could see the
		* bottom of. The document's own height is what the marks inside it are measured
		* against, and the frame keeps that for itself.
		* @param figure - the decoded figure, or null before there is one.
		* @param rasterSize - the size the browser decoded a raster at, or null until it has.
		* @param htmlView - the window a rendered document is shown through, or null until the
		*   pane has been measured.
		* @returns the surface's size, or null.
		*/
		function figureSize(figure, rasterSize, htmlView) {
			if (figure === null) return null;
			if (figure.kind === "svg") return {
				width: figure.width,
				height: figure.height
			};
			if (figure.kind === "html") return htmlView;
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
			const rows = markRows(props.marks);
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
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ListIcon, {}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "da-count",
								children: props.marks.length
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "da-btn da-btn-quiet da-list-clear",
							"aria-label": t("clear"),
							title: t("clear"),
							disabled: props.marks.length === 0,
							onClick: () => {
								props.onClear();
							},
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TrashIcon, {})
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
					}) : rows.map(({ mark, ordinal }) => {
						const note = mark.detail?.trim() ?? "";
						const identity = mark.anchor === void 0 ? "" : anchorDescriptor(mark.anchor);
						const title = note !== "" ? note : identity !== "" ? identity : t(TOOL_COPY[mark.kind]);
						return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "da-mark",
							"data-selected": mark.id === props.selectedId,
							onClick: () => {
								props.onReveal(mark);
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: "da-mark-glyph",
									style: { color: mark.color },
									title: t("markKindLabel", { kind: t(TOOL_COPY[mark.kind]) }),
									children: [ToolIcon(mark.kind), ordinal === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "da-mark-num",
										children: ordinal
									})]
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
										title,
										children: title
									}), note === "" || identity === "" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "da-mark-meta",
										title: mark.anchor?.selector,
										children: identity
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
						}, mark.id);
					})
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
		* @param input.colour - the colour a click would take, which is what the preview is lit in.
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
					colour: mark.color,
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
						colour: input.colour,
						selected: false
					});
				}
			}
			return spots;
		}
		/** How long a bubble stays once its sentence has landed. */
		const TOAST_HOLD_MS = 3500;
		/** A failure gets longer: it is the only bubble the reader may act on. */
		const TOAST_FAIL_HOLD_MS = 5e3;
		/** After this long, the send says it is still working instead of implying a stall. */
		const TOAST_TASK_TIMEOUT_MS = 12e3;
		/**
		* How loud a card is, by how far it sits from the newest one.
		*
		* The oldest is still readable and never disappears into the picture: .35 is as
		* faint as a bubble gets.
		* @param depth - how many cards sit below it, 0 being the newest.
		* @returns the opacity to draw it at.
		*/
		function depthOpacity(depth) {
			return Math.max(.35, 1 - depth * .2);
		}
		/**
		* Where every card goes, and how tall the stack is.
		*
		* Each card is tucked `TOAST_OVERLAP` under the one above it, so the stack reads as
		* one object rather than four. The height is the last card's top plus its own — the
		* stack is the size of what it holds, and a surface can let that much of the figure
		* go unread.
		* @param entries - the stack, oldest first.
		* @returns one row per card, in the same order, and the stack's height.
		*/
		function stackLayout(entries) {
			const rows = [];
			let top = 0;
			for (const [index, entry] of entries.entries()) {
				rows.push({
					entry,
					index,
					depth: entries.length - 1 - index,
					offset: top
				});
				top += toastHeight(entry.card.kind) - 12;
			}
			return {
				rows,
				height: rows.length === 0 ? 0 : top + 12
			};
		}
		/**
		* The height a bubble takes at rest.
		* @param kind - a note or a send.
		* @returns the height in pixels.
		*/
		function toastHeight(kind) {
			return kind === "send" ? 41 : 38;
		}
		/**
		* The sentence a card says right now.
		*
		* A send has three sentences and which one is on screen is decided by its outcome:
		* until the task answers it is the pending one, then a calm "still working" line,
		* and a missing success or failure sentence falls back to the pending one rather
		* than leaving the bubble blank.
		* @param card - the bubble.
		* @param outcome - what its task ended as, or `none`.
		* @returns the sentence to type out.
		*/
		function cardText(card, outcome) {
			if (outcome === "ok") return card.done ?? card.text;
			if (outcome === "fail") return card.failed ?? card.text;
			if (outcome === "slow") return card.waiting ?? card.text;
			return card.text;
		}
		/**
		* How long a card stays after its sentence lands.
		* @param outcome - what its task ended as.
		* @returns the hold in milliseconds.
		*/
		function holdFor(outcome) {
			return outcome === "fail" ? TOAST_FAIL_HOLD_MS : TOAST_HOLD_MS;
		}
		/**
		* Put a card at the bottom of the stack.
		*
		* Every press earns its own bubble, even when it says what the last one said. Two
		* identical presses used to collapse into one card that moved, which looks like the
		* stack failing to stack: the reader presses 存草稿 twice and watches the first
		* answer get shoved out by the second. The stack is the panel's memory of what was
		* just done, and "done twice" is not "done once". The cap is what keeps it tidy —
		* the oldest card leaves silently when a fifth arrives, because it is already half
		* faded at the top and animating it would push everything below it down for half a
		* second for nothing.
		* @param list - the stack as it was.
		* @param entry - the card to add.
		* @returns the stack with the card at the bottom.
		*/
		function addEntry(list, entry) {
			return [...list, entry].slice(-4);
		}
		/**
		* Change how far through its life one card is, leaving the rest alone.
		* @param list - the stack.
		* @param id - the card to change.
		* @param patch - the fields to set.
		* @returns a new stack, or the old one when the card is already gone.
		*/
		function patchEntry(list, id, patch) {
			let changed = false;
			const next = list.map((one) => {
				if (one.card.id !== id) return one;
				changed = true;
				return {
					...one,
					...patch
				};
			});
			return changed ? next : list;
		}
		/**
		* Land a card: give it the outcome its task ended as.
		*
		* A card already on its way out keeps leaving — the work it was waiting for may
		* finish after the reader closed it, and a fading bubble must not start talking
		* again on its way off the screen.
		* @param list - the stack.
		* @param id - the card that landed.
		* @param outcome - how its task ended.
		* @returns a new stack, or the old one when the card is already gone.
		*/
		function settleEntry(list, id, outcome) {
			const entry = list.find((one) => one.card.id === id);
			if (entry === void 0) return list;
			return patchEntry(list, id, {
				phase: entry.phase === "leaving" ? "leaving" : "typing",
				outcome
			});
		}
		/**
		* Take one card out.
		* @param list - the stack.
		* @param id - the card to remove.
		* @returns the stack without it; a card that is already gone is not an error.
		*/
		function removeEntry(list, id) {
			return list.filter((one) => one.card.id !== id);
		}
		/**
		* Take back every card of one tone.
		*
		* A write that goes through retires the failure it was answering — and only that:
		* the bubble saying a hand-off landed is news of its own and is not a failure's to
		* drop.
		* @param list - the stack.
		* @param tone - the tone to clear.
		* @returns the stack without those cards.
		*/
		function dropTone(list, tone) {
			return list.filter((one) => one.card.tone !== tone);
		}
		/**
		* The card one of the four annotate events stands for.
		*
		* The event is the interface; the sentence is the product's. A caller that knows
		* what happened says so by name and never has to know what it is called on screen.
		* @param event - what the panel just did.
		* @param t - the translator seat.
		* @returns the card, without its identity, which the stack assigns.
		*/
		function planToast(event, t) {
			if (event === "annotate.none") return {
				kind: "note",
				icon: "pencil",
				tone: "info",
				text: t("toastNone"),
				waiting: void 0,
				done: void 0,
				failed: void 0,
				task: void 0
			};
			if (event === "annotate.save.all") return planSend("dialog", t("toastSavedAll"), t);
			if (event === "annotate.save.one") return planSend("dialog", t("toastSavedOne"), t);
			return planSend("agent", t("toastSentAgent"), t);
		}
		/**
		* A send card that has not been given its work yet.
		*
		* The event says where the news is going; the task is the caller's, because only
		* the caller knows how to do it — and because a retry has to run the same work
		* again, not a description of it.
		* @param icon - the destination's face.
		* @param done - the sentence once it lands.
		* @param t - the translator seat.
		* @returns the card.
		*/
		function planSend(icon, done, t) {
			return {
				kind: "send",
				icon,
				tone: "info",
				text: t("toastSending"),
				waiting: t("toastStillSending"),
				done,
				failed: t("toastFailed"),
				task: void 0
			};
		}
		//#endregion
		//#region src/client/annotator/toast-icons.tsx
		/**
		* The pencil a note carries: the gesture that produced the news.
		*
		* Drawn on the 24-unit grid the panel's other icons use, and shown at 14px so its
		* stroke lands just under one device-independent pixel — the weight the bar's glyphs
		* have. The pencil before this one was drawn on a 14-unit grid of its own at a stroke
		* that rendered 1.7px wide: a closed outline with a notch, inside a 14px box, which at
		* that size reads as a smudge rather than as a pencil. Two strokes on the shared grid
		* is what stays legible when the box is that small.
		*/
		function PencilIcon() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				width: "14",
				height: "14",
				viewBox: "0 0 24 24",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.7",
				strokeLinecap: "round",
				strokeLinejoin: "round",
				"aria-hidden": "true",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12 20h9" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" })]
			});
		}
		/**
		* Where a send is going: the draft panel it is being written into, or the agent.
		*
		* It is the bar's own two marks — the speech bubble and the paper plane — drawn
		* again on the same 24-unit grid at the same rendered thickness, so the bubble's
		* icon reads as the same hand as the buttons above it.
		* @param props - which of the two.
		* @returns the glyph.
		*/
		function DestIcon(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				className: "da-dest",
				viewBox: "0 0 24 24",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "2.4",
				strokeLinecap: "round",
				strokeLinejoin: "round",
				"aria-hidden": "true",
				children: props.icon === "agent" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M 3 12 L 21 3.9 L 15.9 21 L 12 14.1 Z" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M 12 14.1 L 21 3.9" })] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M 3.75 9.75 a 3 3 0 0 1 3 -3 h 10.5 a 3 3 0 0 1 3 3 v 4.5 a 3 3 0 0 1 -3 3 h -6 l -4.5 3.3 v -3.3 a 3 3 0 0 1 -3 -3 z" })
			});
		}
		/** The arc that spins while a send is out, and that closes when it lands. */
		function SendRings() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				className: "da-spin",
				viewBox: "0 0 24 24",
				fill: "none",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
					cx: "12",
					cy: "12",
					r: "10",
					stroke: "currentColor",
					strokeWidth: "1.6",
					strokeLinecap: "round",
					strokeDasharray: "44 19"
				})
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				className: "da-ring",
				viewBox: "0 0 24 24",
				fill: "none",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
					cx: "12",
					cy: "12",
					r: "10",
					stroke: "currentColor",
					strokeWidth: "1.6",
					strokeLinecap: "round",
					strokeDasharray: "63"
				})
			})] });
		}
		/** The check that ends a send well. */
		function CheckIcon() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				className: "da-check",
				viewBox: "0 0 24 24",
				fill: "none",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					d: "M5 12.5l4 4L19 7",
					stroke: "currentColor",
					strokeWidth: "3",
					strokeLinecap: "round",
					strokeLinejoin: "round"
				})
			});
		}
		/** The cross that ends a send badly — a shape, not a colour. */
		function CrossIcon() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				className: "da-cross",
				viewBox: "0 0 24 24",
				fill: "none",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					d: "M7.5 7.5l9 9M16.5 7.5l-9 9",
					stroke: "currentColor",
					strokeWidth: "3",
					strokeLinecap: "round"
				})
			});
		}
		/** The ↻ that replaces the × on a failure: the same send, tried again. */
		function ResendIcon() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				width: "12",
				height: "12",
				viewBox: "0 0 24 24",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "2.4",
				strokeLinecap: "round",
				strokeLinejoin: "round",
				"aria-hidden": "true",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("polyline", { points: "1 4 1 10 7 10" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M3.51 15a9 9 0 1 0 2.13-9.36L1 10" })]
			});
		}
		//#endregion
		//#region src/client/annotator/toasts.tsx
		/**
		* The bubbles over the figure — the panel's own voice.
		*
		* A card says one short sentence, typed out at reading speed, and stays just long
		* enough to be read. A send card says what it is doing while it does it, and ends
		* with a white ring and a check or a cross: never a colour, because the gestures of
		* this product are a pencil and a mark, and a green tick would be a second language
		* for the same news. A failure is not the end of the sentence either — the × that
		* would close it becomes the ↻ that runs it again.
		*
		* Every timer lives in the card that owns it and is cleared when it goes, and the
		* stack is decoration over a working figure: it only takes a pointer event meant
		* for one of its buttons.
		* @module dsh-figmark/client/annotator/toasts
		*/
		/** How far the entry animation starts below its resting place. */
		const ENTER_SHIFT = 14;
		/** One frame later, so the browser has a starting point to move from. */
		const ENTER_FRAME_MS = 16;
		/** How long a card shakes for, once. */
		const SHAKE_MS = 560;
		/**
		* Whether the reader asked for motion to be left out.
		* @returns true when the platform says so, and false when it cannot say.
		*/
		function prefersReducedMotion() {
			if (typeof window === "undefined") return false;
			if (typeof window.matchMedia !== "function") return false;
			return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		}
		/**
		* The stack's state and the ways to put something in it.
		*
		* It lives in the surface rather than in the card because the surface is what
		* knows whether a hand-off worked, and because a send's promise has to be answered
		* even if the reader closes the bubble before it lands.
		* @param t - the translator seat the four events are named in.
		* @returns the stack and its verbs.
		*/
		function useToasts(t) {
			const [entries, setEntries] = (0, react.useState)([]);
			const nextId = (0, react.useRef)(1);
			const settlers = (0, react.useRef)(/* @__PURE__ */ new Map());
			const timers = (0, react.useRef)(/* @__PURE__ */ new Set());
			const alive = (0, react.useRef)(true);
			(0, react.useEffect)(() => {
				alive.current = true;
				return () => {
					alive.current = false;
					for (const timer of timers.current) clearTimeout(timer);
					timers.current.clear();
				};
			}, []);
			const next = (0, react.useCallback)(() => {
				const id = nextId.current;
				nextId.current += 1;
				return id;
			}, []);
			/** Land a card: whatever sentence its outcome calls for, and answer the caller. */
			const settle = (0, react.useCallback)((id, outcome) => {
				setEntries((list) => settleEntry(list, id, outcome));
				const answer = settlers.current.get(id);
				settlers.current.delete(id);
				answer?.(outcome);
			}, []);
			/**
			* Do the work a send card stands for.
			*
			* The task runs outside the card on purpose: the reader may close a bubble while
			* it is still going, and a hand-off must not be cancelled by a gesture aimed at
			* the news about it.
			*/
			const begin = (0, react.useCallback)((card) => {
				const land = (outcome) => {
					clearTimeout(timer);
					timers.current.delete(timer);
					if (!alive.current) return;
					settle(card.id, outcome);
				};
				const timer = setTimeout(() => {
					timers.current.delete(timer);
					setEntries((list) => patchEntry(list, card.id, { outcome: "slow" }));
				}, TOAST_TASK_TIMEOUT_MS);
				timers.current.add(timer);
				(card.task?.() ?? Promise.resolve()).then(() => {
					land("ok");
				}, (reason) => {
					console.error("[figmark] toast task failed", reason);
					land("fail");
				});
			}, [settle]);
			const add = (0, react.useCallback)((card, phase) => {
				setEntries((list) => addEntry(list, {
					card,
					phase,
					outcome: "none"
				}));
			}, []);
			const launch = (0, react.useCallback)((card) => {
				const answer = new Promise((resolve) => {
					settlers.current.set(card.id, resolve);
				});
				add(card, "sending");
				begin(card);
				return answer;
			}, [add, begin]);
			const notify = (0, react.useCallback)((event, task) => {
				const plan = planToast(event, t);
				const card = {
					id: next(),
					...plan,
					task: plan.kind === "send" ? task : void 0
				};
				if (card.kind === "note") {
					add(card, "typing");
					return Promise.resolve("ok");
				}
				return launch(card);
			}, [
				add,
				launch,
				next,
				t
			]);
			const send = (0, react.useCallback)((options) => launch({
				id: next(),
				kind: "send",
				icon: options.icon,
				tone: "info",
				text: options.pending,
				waiting: options.waiting ?? options.pending,
				done: options.done,
				failed: options.failed,
				task: options.task
			}), [launch, next]);
			const note = (0, react.useCallback)((line) => {
				add({
					id: next(),
					kind: "note",
					icon: "pencil",
					tone: line.tone,
					text: line.text,
					waiting: void 0,
					done: void 0,
					failed: void 0,
					task: void 0
				}, "hold");
			}, [add, next]);
			const patch = (0, react.useCallback)((id, changed) => {
				setEntries((list) => patchEntry(list, id, changed));
			}, []);
			const mark = (0, react.useCallback)((id, phase) => {
				patch(id, { phase });
			}, [patch]);
			const retry = (0, react.useCallback)((id) => {
				const entry = entries.find((one) => one.card.id === id);
				if (entry === void 0) return;
				begin(entry.card);
				patch(id, {
					phase: "sending",
					outcome: "none"
				});
			}, [
				begin,
				entries,
				patch
			]);
			const dropTone$1 = (0, react.useCallback)((tone) => {
				setEntries((list) => dropTone(list, tone));
			}, []);
			const clear = (0, react.useCallback)(() => {
				setEntries([]);
			}, []);
			const remove = (0, react.useCallback)((id) => {
				setEntries((list) => removeEntry(list, id));
			}, []);
			return (0, react.useMemo)(() => ({
				entries,
				note,
				notify,
				send,
				mark,
				retry,
				dropTone: dropTone$1,
				remove,
				clear
			}), [
				entries,
				note,
				notify,
				send,
				mark,
				retry,
				dropTone$1,
				remove,
				clear
			]);
		}
		function ToastStack(props) {
			const { entries, mark, retry, remove } = props.view;
			const reduced = props.reduced ?? prefersReducedMotion();
			if (entries.length === 0) return null;
			const { rows, height } = stackLayout(entries);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "da-toasts",
				role: "status",
				"aria-live": "polite",
				style: { height },
				children: rows.map((row) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ToastCardView, {
					entry: row.entry,
					index: row.index,
					depth: row.depth,
					offset: row.offset,
					label: props.label,
					resendLabel: props.resendLabel,
					reduced,
					onPhase: mark,
					onRemove: remove,
					onRetry: retry,
					onClose: (id) => {
						mark(id, "leaving");
					}
				}, row.entry.card.id))
			});
		}
		/**
		* One bubble.
		*
		* It owns three things its parent should not know about: how much of its sentence
		* is on screen, whether it has settled into place yet, and whether it is shaking.
		* The sentences themselves come from above, as does every phase that involves
		* work, so a re-render never restarts a typewriter or a hand-off.
		* @param props - the entry, where it sits, and the verbs it may call.
		* @returns the card.
		*/
		function ToastCardView(props) {
			const { entry, reduced, onPhase, onRemove } = props;
			const { card } = entry;
			const full = cardText(card, entry.outcome);
			const [shown, setShown] = (0, react.useState)(() => entry.phase === "hold" ? full : "");
			const [entered, setEntered] = (0, react.useState)(reduced);
			const [shake, setShake] = (0, react.useState)(false);
			const [hovered, setHovered] = (0, react.useState)(false);
			(0, react.useEffect)(() => {
				if (reduced) return;
				const timer = setTimeout(() => {
					setEntered(true);
				}, ENTER_FRAME_MS);
				return () => {
					clearTimeout(timer);
				};
			}, [reduced]);
			(0, react.useEffect)(() => {
				if (card.icon !== "pencil") return;
				const on = setTimeout(() => {
					setShake(true);
				}, 156);
				return () => {
					clearTimeout(on);
				};
			}, [card.icon]);
			(0, react.useEffect)(() => {
				if (entry.outcome !== "fail") return;
				setShake(true);
			}, [entry.outcome]);
			(0, react.useEffect)(() => {
				if (!shake) return;
				const timer = setTimeout(() => {
					setShake(false);
				}, SHAKE_MS);
				return () => {
					clearTimeout(timer);
				};
			}, [shake]);
			(0, react.useEffect)(() => {
				if (entry.phase !== "typing" && entry.phase !== "sending") return;
				const letters = Array.from(full);
				if (reduced) {
					setShown(full);
					if (entry.phase === "typing") onPhase(card.id, "hold");
					return;
				}
				setShown("");
				let cut = 0;
				const timer = setInterval(() => {
					cut += 1;
					setShown(letters.slice(0, cut).join(""));
					if (cut < letters.length) return;
					clearInterval(timer);
					if (entry.phase === "typing") onPhase(card.id, "hold");
				}, 9);
				return () => {
					clearInterval(timer);
				};
			}, [
				entry.phase,
				card.id,
				full,
				reduced,
				onPhase
			]);
			(0, react.useEffect)(() => {
				if (entry.phase !== "hold") return;
				if (hovered) return;
				const timer = setTimeout(() => {
					onPhase(card.id, "leaving");
				}, holdFor(entry.outcome));
				return () => {
					clearTimeout(timer);
				};
			}, [
				entry.phase,
				entry.outcome,
				hovered,
				card.id,
				onPhase
			]);
			(0, react.useEffect)(() => {
				if (entry.phase !== "leaving") return;
				const timer = setTimeout(() => {
					onRemove(card.id);
				}, 500);
				return () => {
					clearTimeout(timer);
				};
			}, [
				entry.phase,
				card.id,
				onRemove
			]);
			const state = entry.phase === "sending" ? "sending" : entry.outcome;
			const typing = entry.phase === "typing" || entry.phase === "sending";
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "da-toast",
				"data-kind": card.kind,
				"data-state": state,
				"data-leaving": entry.phase === "leaving",
				"data-shake": shake,
				"data-text": full,
				style: {
					transform: `translateY(${props.offset + (entered ? 0 : ENTER_SHIFT)}px)`,
					opacity: entered ? depthOpacity(props.depth) : 0,
					zIndex: 10 + props.index
				},
				onPointerEnter: () => {
					setHovered(true);
				},
				onPointerLeave: () => {
					setHovered(false);
				},
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "da-toast-ico",
						"data-slot": card.kind,
						children: card.kind === "note" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PencilIcon, {}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(DestIcon, { icon: card.icon === "agent" ? "agent" : "dialog" }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SendRings, {}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(CheckIcon, {}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(CrossIcon, {})
						] })
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "da-toast-msg",
						"data-typing": typing,
						children: shown
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "da-toast-close",
						"aria-label": props.label,
						onClick: () => {
							props.onClose(card.id);
						},
						children: "×"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "da-toast-resend",
						"aria-label": props.resendLabel,
						onClick: () => {
							props.onRetry(card.id);
						},
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ResendIcon, {})
					})
				]
			});
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
		/** The last directory in a file path, shortened to the part that locates it. */
		function parentPathOf(path) {
			const parts = path.replace(/[\\/]+$/u, "").split(/[\\/]/u).filter((part) => part !== "");
			parts.pop();
			const parent = parts.at(-1);
			return parent === void 0 ? "" : `.../${parent}`;
		}
		/**
		* Render one figure with its annotation layer.
		* @param props - document content, addressed resource, locale seat, and session delivery face.
		* @returns the annotator body.
		*/
		function AnnotatorBody(props) {
			const address = props.resourceAddress ?? "";
			const parsedAddress = parseFileAddress(address);
			const mediaType = props.livePage === void 0 ? figureMediaType(parsedAddress?.path ?? "") : "text/html";
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
			* The element whose name is hanging beside it, or null when the chip is away.
			*
			* State rather than something read off `hovered`, because `hovered` is a ref: the
			* light is written straight onto the figure's own DOM and must not re-render the
			* panel, while the chip is drawn by React and cannot appear without a render.
			*/
			const [chipAnchor, setChipAnchor] = (0, react.useState)(null);
			/** Where the hovered element sits in the picker's child-to-parent ladder. */
			const [pickLevel, setPickLevel] = (0, react.useState)(void 0);
			/**
			* The element ladder and chosen rung under the pointer in a same-origin document.
			*
			* The frame owns its pointers in element mode, so this small picker state cannot
			* live in Canvas. Keeping it here lets hover, the arrow-key depth control, and the
			* press that commits a mark all agree on the exact element under the hand.
			*/
			const htmlPick = (0, react.useRef)(null);
			/** Whether the rest of one same-origin element press must not reach the page. */
			const htmlClickGuard = (0, react.useRef)(false);
			/**
			* The page being framed instead of the file, when one is.
			*
			* A page a dev server serves has no bytes to read: it has to be fetched, its scripts
			* run, its layout made before there is anything to annotate. So opening one asks the
			* Host to stand in front of that server, and the frame is pointed at what it answers
			* with. Null means this body is showing the file it was opened on.
			*/
			const [livePage, setLivePage] = (0, react.useState)(props.livePage ?? null);
			/** The page that currently owns the frame. */
			const previewPage = livePage;
			/** What the reader is typing in the address field, or null while they are not. */
			const [liveText, setLiveText] = (0, react.useState)(null);
			/** Why the last address did not open, in the reader's own words. */
			const [liveError, setLiveError] = (0, react.useState)(null);
			/** Whether an address is being opened right now. */
			const [liveBusy, setLiveBusy] = (0, react.useState)(false);
			/** The synchronous guard for repeated Enter presses before React paints `liveBusy`. */
			const liveBusyRef = (0, react.useRef)(false);
			/** Whether this body is still mounted, for an open that resolves after teardown. */
			const liveMounted = (0, react.useRef)(true);
			/** The one open request whose answer this body may still display. */
			const liveOpenGeneration = (0, react.useRef)(0);
			/** Whether the compact location icon is open into the full address field. */
			const [liveAddressOpen, setLiveAddressOpen] = (0, react.useState)(false);
			/** The address field, focused when its compact icon is opened. */
			const liveAddressRef = (0, react.useRef)(null);
			/** A fresh browsing context for the same live page, without reopening its proxy. */
			const [frameRevision, setFrameRevision] = (0, react.useState)(0);
			/** The last owner refresh request already applied. */
			const handledRefreshToken = (0, react.useRef)(props.refreshToken);
			(0, react.useEffect)(() => {
				if (!liveAddressOpen) return;
				liveAddressRef.current?.focus();
			}, [liveAddressOpen]);
			/** The key behind the chip currently drawn, so a move inside one element is free. */
			const chipShown = (0, react.useRef)(chipKey(void 0));
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
			* The window a local rendered document is shown through.
			*
			* The document scrolls inside its frame, and the frame is the only thing that
			* knows how far it has gone. A proxied page reports its offset by message instead,
			* because its origin is not ours to read.
			*/
			const documentView = (0, react.useCallback)(() => {
				const frame = frameRef.current;
				if (frame === null || previewPage !== null) return null;
				return frame.contentWindow;
			}, [previewPage]);
			/**
			* Move the view by a drag.
			*
			* The scroll offset is written straight onto the element rather than held in
			* state: a pan is a stream of moves, and routing each one through React would
			* make the picture trail the hand by a frame. The CSS `overflow` already keeps
			* the offset inside the scrollable range, so an overshoot at an edge simply does
			* nothing instead of needing a clamp here.
			*
			* A rendered document scrolls inside its own frame rather than in the stage, so on
			* that surface the drag is handed to the frame's window — the page moves under the
			* hand either way, which is what the reader is reaching for.
			* @param dx - horizontal travel of the pointer, in client pixels.
			* @param dy - vertical travel of the pointer.
			*/
			const panBy = (0, react.useCallback)((dx, dy) => {
				const stage = stageRef.current;
				/* v8 ignore next -- a pan comes from the overlay, which only exists inside the stage. */
				if (stage === null) return;
				const view = documentView();
				if (view !== null) {
					view.scrollBy(-dx, -dy);
					return;
				}
				stage.scrollLeft -= dx;
				stage.scrollTop -= dy;
			}, [documentView]);
			const [fileFigure, setFileFigure] = (0, react.useState)(null);
			const [fileRasterSize, setFileRasterSize] = (0, react.useState)(null);
			/** Width a rendered document's frame is laid out at, in figure pixels. */
			const [htmlWidth, setHtmlWidth] = (0, react.useState)(RENDER_WIDTH);
			/** Whether the local document has reported one usable layout pass. */
			const [htmlMeasured, setHtmlMeasured] = (0, react.useState)(false);
			/**
			* How far the document inside its window has been scrolled, in figure pixels.
			*
			* A local document reports from its frame and a proxied page reports by message.
			* Both feed the same overlay shift, so marks stay in document pixels even while
			* only one windowful of those pixels is visible.
			*/
			const [htmlScroll, setHtmlScroll] = (0, react.useState)({
				x: 0,
				y: 0
			});
			/** Number of scriptless slides this local document can turn, or zero for a page. */
			const [deckCount, setDeckCount] = (0, react.useState)(0);
			/** Zero-based index of the slide in front. */
			const [deckPage, setDeckPage] = (0, react.useState)(0);
			/** The current slide's own height, which replaces the pane height for a deck. */
			const [deckHeight, setDeckHeight] = (0, react.useState)(0);
			/** Boxes and visibility the interactive page has reported for saved elements. */
			const [previewShown, setPreviewShown] = (0, react.useState)(null);
			/** The logical slide the running page says is in front, when it has one. */
			const [liveSurface, setLiveSurface] = (0, react.useState)(null);
			/**
			* Whether the running page has answered the "which surface is in front" question.
			*
			* A missing answer before the first report means "unknown", while a reported null
			* means "this page has no logical slides". The difference matters once a mark carries
			* a surface: an unknown page draws its saved marks as recorded, but a page that has
			* explicitly reported no surface must not put every slide's region on top of it.
			*/
			const [liveSurfaceKnown, setLiveSurfaceKnown] = (0, react.useState)(false);
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
			/**
			* What the document in the frame is showing, and the marks that belong to it.
			*
			* A rendered document is one file of many surfaces: a deck keeps every one of its
			* slides in it and shows one at a time, so a mark drawn on the second slide is still
			* a mark of the document — but it is not a mark about the third slide, and drawing it
			* there is a comment the reader never made. The document knows which of its elements
			* it is showing, so it is asked, every frame; only what it is showing is drawn.
			*
			* The list and the message keep the whole file. They are the map of what is being
			* sent, and a mark on another slide is exactly the kind of thing a reader wants to
			* find in it.
			*/
			const staticShowing = useShownMarks(frameRef, marks, figure?.kind === "html" && previewPage === null && marks.some((mark) => mark.anchor?.selector !== void 0));
			/**
			* A running page reports its logical surface separately from element boxes.
			*
			* Element boxes say where one selector is; this says which slide is in front.
			* Regions have no element selector, so this is the only fact that can keep a box
			* drawn on slide five from appearing over slide six.
			*/
			const previewShowing = (0, react.useMemo)(() => {
				if (previewPage === null) return null;
				if (previewShown === null && !liveSurfaceKnown) return null;
				const boxes = previewShown?.boxes ?? /* @__PURE__ */ new Map();
				const away = new Set(previewShown?.away ?? []);
				if (liveSurfaceKnown) {
					for (const mark of marks) if (mark.surface !== void 0) {
						if (mark.surface !== liveSurface) away.add(mark.id);
					} else if (mark.anchor?.selector === void 0 && liveSurface !== null) away.add(mark.id);
				}
				return {
					boxes,
					away
				};
			}, [
				liveSurface,
				liveSurfaceKnown,
				marks,
				previewPage,
				previewShown
			]);
			/** A cross-origin page reports the same facts by message; a same-origin one is read. */
			const showing = previewPage === null ? staticShowing : previewShowing;
			const drawnMarks = (0, react.useMemo)(() => shownMarksOf(marks, showing), [marks, showing]);
			/** The one mark a temporary hidden-layer reveal has put in front of the page. */
			const [temporaryMark, setTemporaryMark] = (0, react.useState)(null);
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
			/**
			* What the overlay may draw while a temporary reveal is open.
			*
			* A cover can be lifted over a slide without changing which slide the page reports
			* as live. The slide's elements are then still visible to their own surface and
			* bounds measurements, but they are underneath the cover the reader asked to see.
			*/
			const visibleMarks = (0, react.useMemo)(() => {
				if (temporaryMark === null) return drawnMarks;
				return [drawnMarks.find((candidate) => candidate.id === temporaryMark.id) ?? temporaryMark];
			}, [drawnMarks, temporaryMark]);
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
			* The file's annotation while a proxied page is in the frame.
			*
			* Visiting a page is a temporary change of surface, not the reader clearing the
			* file they came from. This checkpoint lets the back action restore the file
			* instead of treating an empty page as an empty sidecar and deleting work.
			*/
			const fileBeforeLive = (0, react.useRef)(null);
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
			/**
			* The pane's own height, beside its width.
			*
			* A rendered document's window is the pane in both directions: without this the
			* document would be given a height of its own content, which is the one thing a
			* viewport must never be.
			*/
			const [fitHeight, setFitHeight] = (0, react.useState)(0);
			const [busy, setBusy] = (0, react.useState)(null);
			/**
			* The news of the last few clicks, newest first.
			*
			* It is a stack rather than one line because two things can happen before the reader
			* looks at the panel — a save that failed and a handoff that went through — and the
			* second used to overwrite the first. A failure stays; the rest leave on their own.
			*/
			/**
			* The bubbles over the figure.
			*
			* A bubble is news, not a control, so it lives beside the panel rather than in it:
			* the stack owns its own timers and takes no pointer events that are not aimed at
			* one of its buttons. `setStatus` is the plain way in — one sentence, no task, gone
			* in a few seconds — and is what every condition and every failure detail uses.
			*/
			const toasts = useToasts(t);
			/** Say something over the figure, without moving it. */
			const setStatus = toasts.note;
			/** Where the figure's context menu was asked for, or null when it is closed. */
			const [menuAt, setMenuAt] = (0, react.useState)(null);
			/** Whether this Host can open and reveal paths; read once per mount. */
			const [canOpen, setCanOpen] = (0, react.useState)(false);
			const menuRef = (0, react.useRef)(null);
			/** The panel's own box, for placing the cards that float over it. */
			const rootRef = (0, react.useRef)(null);
			/** The canvas's input face, used by the one Escape hierarchy in this body. */
			const canvasInput = (0, react.useRef)(null);
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
			/** A measured ceiling used only when a short panel cannot otherwise separate the strips. */
			const [paletteLimit, setPaletteLimit] = (0, react.useState)(void 0);
			/** The current palette spot, read by the resize guard without being its trigger. */
			const parkedPalette = (0, react.useRef)(palette);
			parkedPalette.current = palette;
			const paletteRef = (0, react.useRef)(null);
			const [dragging, setDragging] = (0, react.useState)(false);
			/** A press is held even before it crosses the movement threshold. */
			const [stripHeld, setStripHeld] = (0, react.useState)(false);
			const dragFrom = (0, react.useRef)(null);
			/** The one strip gesture allowed to exist at a time. */
			const dragOwner = (0, react.useRef)(null);
			/** The palette's box, in percentages of the panel. */
			const paletteStyle = {
				...placementStyle(palette ?? DEFAULT_PALETTE),
				...paletteLimit === void 0 ? {} : { maxHeight: `${paletteLimit}px` }
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
			/** The current parking spot, read by the resize guard without making it a trigger. */
			const parkedBar = (0, react.useRef)(barSpot);
			parkedBar.current = barSpot;
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
			* @param start - enter the visible dragging state once the slop is crossed.
			*/
			const followPointer = (0, react.useCallback)((event, from, write, start, strip) => {
				const held = from.current;
				const root = strip?.offsetParent ?? rootRef.current;
				/* v8 ignore next */
				if (held === null || event.pointerId !== held.pointerId || root === null || !(root instanceof Element)) return;
				if (held.current === null && Math.hypot(event.clientX - held.box.left, event.clientY - held.box.top) < 3) return;
				const bounds = root.getBoundingClientRect();
				const own = strip?.getBoundingClientRect();
				/* v8 ignore next -- both call sites hold a live ref for the whole drag. */
				const width = own?.width ?? 0;
				/* v8 ignore next -- both call sites hold a live ref for the whole drag. */
				const height = own?.height ?? 0;
				if (held.current === null) start();
				const spot = draggedSpot(held, event, bounds, {
					width,
					height
				});
				held.current = spot;
				write(spot);
			}, []);
			const dragPalette = (0, react.useCallback)((event) => {
				event.preventDefault();
				followPointer(event, dragFrom, setPalette, () => {
					setDragging(true);
				}, paletteRef.current);
			}, [followPointer]);
			const dragBar = (0, react.useCallback)((event) => {
				event.preventDefault();
				followPointer(event, barFrom, setBarSpot, () => {
					setBarDragging(true);
				}, barRef.current);
			}, [followPointer]);
			/**
			* Finish a drag with the strip's magnetic edge dock.
			*
			* Moving from the live drag into the parked state is deliberately split in two:
			* pointer moves are pixel-for-pixel direct, and only the release may settle onto a
			* gutter. The saved spot is the settled one, so reopening the panel does not reveal
			* a quarter-pixel parking position that the drag itself never showed as deliberate.
			*/
			const settleStrip = (0, react.useCallback)((current, write, strip, other) => {
				const panel = strip?.offsetParent ?? rootRef.current;
				/* v8 ignore next -- a mounted grip always has both boxes. */
				if (strip === null || panel === null || !(panel instanceof Element)) return;
				const panelBox = panel.getBoundingClientRect();
				const own = strip.getBoundingClientRect();
				/* v8 ignore next -- an unmeasured strip is not visible enough to drag. */
				if (panelBox.width <= 0 || panelBox.height <= 0 || own.width <= 0 || own.height <= 0) return;
				write(settledSpot(current, panelBox, own, other?.getBoundingClientRect()));
			}, []);
			/**
			* Abandon a strip drag and put it back where the press found it.
			*
			* A pointer that is cancelled, loses capture, or belongs to a window that stops
			* being visible has no trustworthy release position. Leaving the strip at the last
			* move would turn that interruption into a permanent parking decision, so the only
			* honest result is the place it occupied before the press.
			*/
			const cancelStripDrag = (0, react.useCallback)((from, write, stop, event) => {
				const held = from.current;
				if (held === null || event !== void 0 && event.pointerId !== held.pointerId) return;
				from.current = null;
				dragOwner.current = null;
				setStripHeld(false);
				write(held.restore);
				stop(false);
				if (event !== void 0 && typeof event.currentTarget.hasPointerCapture === "function" && event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
			}, []);
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
					if (dragOwner.current !== null || event.isPrimary === false || event.pointerType === "mouse" && event.button !== 0) return;
					event.preventDefault();
					/* v8 ignore next -- nothing to measure against until the panel is mounted. */
					if (rootRef.current === null) return;
					const tools = paletteRef.current;
					/* v8 ignore next -- a mounted grip belongs to a mounted strip. */
					if (tools === null) return;
					/* v8 ignore next -- jsdom has no pointer capture; a browser always does. */
					event.currentTarget.setPointerCapture?.(event.pointerId);
					const panel = tools.offsetParent ?? rootRef.current;
					dragFrom.current = {
						pointerId: event.pointerId,
						restore: parkedPalette.current,
						origin: spotOfBox(tools.getBoundingClientRect(), panel.getBoundingClientRect()),
						box: {
							left: event.clientX,
							top: event.clientY
						},
						current: null
					};
					dragOwner.current = "palette";
					setStripHeld(true);
				},
				onMove: dragPalette,
				onUp: (event) => {
					const held = dragFrom.current;
					if (held === null || event.pointerId !== held.pointerId) return;
					const current = held.current;
					if (current !== null) settleStrip(current, setPalette, paletteRef.current, barRef.current);
					dragFrom.current = null;
					dragOwner.current = null;
					setStripHeld(false);
					setDragging(false);
					/* v8 ignore next -- jsdom has no pointer capture; a browser always does. */
					event.currentTarget.releasePointerCapture?.(event.pointerId);
				},
				onCancel: (event) => {
					cancelStripDrag(dragFrom, setPalette, setDragging, event);
				},
				onLost: (event) => {
					cancelStripDrag(dragFrom, setPalette, setDragging, event);
				}
			};
			/**
			* The bar's drag, on the same terms as the palette's — except for where it starts.
			*
			* The bar has no spot until the reader parks it: the stylesheet puts it on the
			* bottom edge, centred. Starting its first drag from the palette's default corner
			* (which is what `barSpot ?? DEFAULT_PALETTE` did) made the strip jump from the
			* bottom to that corner on the first pixel of travel. It starts from its own box.
			*/
			const barHandle = {
				dragging: barDragging,
				onDown: (event) => {
					if (dragOwner.current !== null || event.isPrimary === false || event.pointerType === "mouse" && event.button !== 0) return;
					event.preventDefault();
					const root = rootRef.current;
					/* v8 ignore next -- nothing to measure against until the panel is mounted. */
					if (root === null) return;
					/* v8 ignore next -- jsdom has no pointer capture; a browser always does. */
					event.currentTarget.setPointerCapture?.(event.pointerId);
					const bar = barRef.current;
					/* v8 ignore next -- the grip is the bar's own child; the bar is mounted here. */
					if (bar === null) return;
					const panel = bar.offsetParent ?? root;
					barFrom.current = {
						pointerId: event.pointerId,
						restore: parkedBar.current,
						origin: spotOfBox(bar.getBoundingClientRect(), panel.getBoundingClientRect()),
						box: {
							left: event.clientX,
							top: event.clientY
						},
						current: null
					};
					dragOwner.current = "bar";
					setStripHeld(true);
				},
				onMove: dragBar,
				onUp: (event) => {
					const held = barFrom.current;
					if (held === null || event.pointerId !== held.pointerId) return;
					const current = held.current;
					if (current !== null) settleStrip(current, setBarSpot, barRef.current, paletteRef.current);
					barFrom.current = null;
					dragOwner.current = null;
					setStripHeld(false);
					setBarDragging(false);
					/* v8 ignore next -- jsdom has no pointer capture; a browser always does. */
					event.currentTarget.releasePointerCapture?.(event.pointerId);
				},
				onCancel: (event) => {
					cancelStripDrag(barFrom, setBarSpot, setBarDragging, event);
				},
				onLost: (event) => {
					cancelStripDrag(barFrom, setBarSpot, setBarDragging, event);
				}
			};
			(0, react.useEffect)(() => {
				if (!stripHeld) return;
				const stop = () => {
					if (dragFrom.current !== null) cancelStripDrag(dragFrom, setPalette, setDragging);
					if (barFrom.current !== null) cancelStripDrag(barFrom, setBarSpot, setBarDragging);
				};
				const onVisibility = () => {
					if (document.visibilityState === "hidden") stop();
				};
				window.addEventListener("blur", stop);
				document.addEventListener("visibilitychange", onVisibility);
				return () => {
					window.removeEventListener("blur", stop);
					document.removeEventListener("visibilitychange", onVisibility);
				};
			}, [cancelStripDrag, stripHeld]);
			(0, react.useEffect)(() => {
				if (dragging || barDragging) return;
				rememberPreferences({
					color,
					weight,
					...palette === void 0 ? {} : { palette },
					...barSpot === void 0 ? {} : { bar: barSpot }
				});
			}, [
				barDragging,
				barSpot,
				color,
				dragging,
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
			* The size of the rendered surface.
			*
			* A normal rendered document is a window, not a sheet: its width is the layout width
			* the document asks for and its height is one pane. A scriptless deck is different:
			* one slide is put in front, and the frame takes that slide's own height. The frame
			* is then a page, not a viewport clipped through the middle of a 1080px slide.
			*/
			const htmlView = (0, react.useMemo)(() => {
				if (previewPage !== null) return fitWidth === 0 || fitHeight === 0 ? null : {
					width: fitWidth,
					height: fitHeight
				};
				const height = deckHeight > 0 ? deckHeight : fitHeight;
				return !htmlMeasured || height === 0 ? null : {
					width: htmlWidth,
					height
				};
			}, [
				deckHeight,
				fitHeight,
				fitWidth,
				htmlMeasured,
				htmlWidth,
				previewPage
			]);
			/**
			* The surface's measurable size; null until its content and dimensions are both
			* known. A rendered document's surface is the window it is shown through.
			*/
			const size = (0, react.useMemo)(() => figureSize(figure, rasterSize, htmlView), [
				figure,
				htmlView,
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
			*
			* A rendered document is a window and grows for nothing: the page inside it scrolls.
			*/
			const paper = size === null ? null : figure?.kind === "html" ? {
				x: 0,
				y: 0,
				width: size.width,
				height: size.height
			} : plotBounds(size.width, size.height, marks, unit);
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
				createdAt,
				livePage,
				loaded,
				marks,
				size,
				summary
			});
			live.current = {
				address,
				createdAt,
				livePage,
				loaded,
				marks,
				size,
				summary
			};
			(0, react.useEffect)(() => {
				liveMounted.current = true;
				return () => {
					liveMounted.current = false;
					liveOpenGeneration.current += 1;
					queueMicrotask(() => {
						if (!liveMounted.current && live.current.livePage !== null) closeLivePage(live.current.livePage.url).catch(() => {});
					});
				};
			}, []);
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
				if (props.livePage !== void 0) {
					setLoaded({
						path: props.livePage.address,
						mediaType: "text/html",
						sha256: `live:${props.livePage.address}`,
						annotation: null,
						unreadable: [],
						workspace: null
					});
					setFileFigure({
						kind: "html",
						document: ""
					});
					setHostError(null);
					return;
				}
				if (data === void 0 || mediaType === void 0) return;
				const loaded = decodeFigure(data, mediaType).figure;
				if (loaded === void 0) {
					setFigureError(t("loadFailed"));
					return;
				}
				if (loaded.kind === "html") {
					setHtmlWidth(RENDER_WIDTH);
					setHtmlMeasured(false);
					setHtmlScroll({
						x: 0,
						y: 0
					});
					setDeckCount(0);
					setDeckPage(0);
					setDeckHeight(0);
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
				props.livePage,
				surface,
				t
			]);
			/** The document to load into the frame, or null when this body holds no document. */
			const htmlSource = figure?.kind === "html" && previewPage === null ? figure.document : null;
			/**
			* Put the prepared document into the frame and learn the size it needs.
			*
			* A normal page is a same-origin window one pane tall and scrolls inside itself. A
			* conventional slide deck gets one page shown at a time by {@link prepareDeck}; its
			* frame takes that slide's whole size so the outer fit can show the entire page
			* rather than a crop through the middle of it.
			*/
			(0, react.useEffect)(() => {
				if (htmlSource === null) return;
				const frame = frameRef.current;
				const root = loadFrameDocument(frame, htmlSource);
				if (root === void 0) return;
				const deck = prepareDeck(root);
				setDeckCount(deck?.count ?? 0);
				setDeckPage(deck?.index ?? 0);
				const measure = () => {
					const slide = deck === void 0 ? void 0 : deckSlideSize(root);
					if (slide !== void 0) {
						setHtmlWidth(slide.width);
						setDeckHeight(slide.height);
						setHtmlMeasured(true);
						return;
					}
					const measured = measureFrameContent(frame);
					if (measured === void 0) return;
					if (measured.width > 0) setHtmlWidth((current) => Math.max(current, measured.width));
					if (deck !== void 0) setDeckHeight(measured.height);
					setHtmlMeasured(true);
				};
				measure();
				const view = frame?.contentWindow ?? null;
				const syncScroll = () => {
					if (view === null) return;
					setHtmlScroll({
						x: view.scrollX,
						y: view.scrollY
					});
				};
				view?.addEventListener("scroll", syncScroll, { passive: true });
				syncScroll();
				const observer = new ResizeObserver(measure);
				observer.observe(root);
				return () => {
					observer.disconnect();
					view?.removeEventListener("scroll", syncScroll);
				};
			}, [htmlSource]);
			/**
			* Turn a prepared deck to another slide.
			*
			* The document's own script is deliberately not running, so this is the one place
			* that changes which slide is in front. The selected mark belongs to the surface the
			* reader left, so it is cleared before the new page is measured.
			*/
			const turnDeck = (0, react.useCallback)((next) => {
				const wanted = typeof next === "function" ? next(deckPage) : next;
				const target = Math.max(0, Math.min(deckCount - 1, wanted));
				if (target === deckPage) return;
				const root = frameRef.current?.contentDocument?.documentElement;
				if (root === void 0) return;
				if (showDeckSlide(root, target) === void 0) return;
				setDeckPage(target);
				setSelectedId(null);
				setHtmlScroll({
					x: 0,
					y: 0
				});
				const size = deckSlideSize(root);
				if (size !== void 0) {
					setHtmlWidth(size.width);
					setDeckHeight(size.height);
					setHtmlMeasured(true);
				}
			}, [
				deckCount,
				deckPage,
				setSelectedId
			]);
			(0, react.useEffect)(() => {
				if (deckCount < 2) return;
				const typing = (target) => {
					const field = target;
					return field !== null && (field.isContentEditable === true || field.tagName === "INPUT" || field.tagName === "TEXTAREA" || field.tagName === "SELECT");
				};
				const onKeyDown = (event) => {
					if (typing(event.target)) return;
					if (event.key === "ArrowRight" || event.key === "PageDown") {
						event.preventDefault();
						turnDeck((page) => page + 1);
					} else if (event.key === "ArrowLeft" || event.key === "PageUp") {
						event.preventDefault();
						turnDeck((page) => page - 1);
					} else if (event.key === "Home") {
						event.preventDefault();
						turnDeck(0);
					} else if (event.key === "End") {
						event.preventDefault();
						turnDeck(deckCount - 1);
					}
				};
				const frameDocument = frameRef.current?.contentDocument;
				frameDocument?.addEventListener("keydown", onKeyDown);
				window.addEventListener("keydown", onKeyDown);
				return () => {
					frameDocument?.removeEventListener("keydown", onKeyDown);
					window.removeEventListener("keydown", onKeyDown);
				};
			}, [deckCount, turnDeck]);
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
				if (props.livePage !== void 0) return;
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
				props.livePage,
				writeSummary
			]);
			(0, react.useEffect)(() => {
				const stage = stageRef.current;
				if (stage === null) return;
				const measure = () => {
					setFitWidth(Math.max(0, stage.clientWidth - 28));
					setFitHeight(Math.max(0, stage.clientHeight - 14 - 56));
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
				fitHeight,
				surface: paper,
				ownerWidth: props.fitWidth
			}), [
				zoom,
				fitWidth,
				fitHeight,
				paper,
				props.fitWidth
			]);
			/** Whether the paper currently extends beyond the viewport in either direction. */
			const pannable = paper !== null && (paper.width * scale > fitWidth + 1 || paper.height * scale > fitHeight + 1);
			/**
			* Keep both parked strips inside a panel whose shape has changed.
			*
			* A saved fraction survives a resize, but a wide strip can still grow past the
			* right or bottom edge because only its anchor is stored. The first duty here is
			* therefore body-aware clamping. A strip that would then cover the other strip slides
			* only far enough to clear it; covering the drawing is allowed because the reader may
			* have parked it there deliberately. This runs for every resting layout decision,
			* never under the reader's current drag.
			*/
			(0, react.useLayoutEffect)(() => {
				let live = true;
				const settle = () => {
					if (!live) return;
					if (dragFrom.current !== null || barFrom.current !== null) return;
					const root = rootRef.current;
					const bar = barRef.current;
					const tools = paletteRef.current;
					/* v8 ignore next -- the chrome and the frame are mounted together. */
					if (root === null || bar === null) return;
					const paletteSpot = parkedPalette.current;
					const barSpot = parkedBar.current;
					let fittedPalette = paletteSpot;
					if (paletteSpot !== void 0 && tools !== null) {
						const panelBox = (tools.offsetParent ?? root).getBoundingClientRect();
						const own = tools.getBoundingClientRect();
						if (panelBox.width <= 0 || panelBox.height <= 0 || own.width <= 0 || own.height <= 0) {} else {
							const fitted = clampedSpot(paletteSpot, panelBox, own);
							if (fitted.x !== paletteSpot.x || fitted.y !== paletteSpot.y) setPalette(fitted);
							fittedPalette = fitted;
						}
					}
					if (barSpot === void 0) {
						/* v8 ignore next -- the palette and bar are mounted and removed together. */
						if (tools === null) return;
						const panelBox = (tools.offsetParent ?? root).getBoundingClientRect();
						const measured = tools.getBoundingClientRect();
						if (panelBox.width <= 0 || panelBox.height <= 0 || measured.width <= 0 || measured.height <= 0) return;
						const toolsBox = {
							left: measured.left,
							top: measured.top,
							width: measured.width,
							height: Math.max(measured.height, tools.scrollHeight)
						};
						const paletteAnchor = fittedPalette ?? DEFAULT_PALETTE;
						const barBox = bar.getBoundingClientRect();
						const safe = separatedSpot(paletteAnchor, panelBox, toolsBox, barBox);
						if (safe === void 0) {
							const limit = paletteRoomBeforeBar(toolsBox, barBox);
							if (limit === void 0) {
								setPaletteLimit(void 0);
								setPalette(DEFAULT_PALETTE);
							} else if (limit !== paletteLimit) setPaletteLimit(limit);
						} else {
							setPaletteLimit(void 0);
							if (fittedPalette !== void 0 && (safe.x !== fittedPalette.x || safe.y !== fittedPalette.y)) setPalette(safe);
						}
						return;
					}
					const panelBox = (bar.offsetParent ?? root).getBoundingClientRect();
					const own = bar.getBoundingClientRect();
					if (panelBox.width <= 0 || panelBox.height <= 0 || own.width <= 0 || own.height <= 0) return;
					const fitted = clampedSpot(barSpot, panelBox, own);
					if (fitted.x !== barSpot.x || fitted.y !== barSpot.y) {
						setBarSpot(fitted);
						return;
					}
					/* v8 ignore next -- the palette and bar are mounted and removed together. */
					if (tools === null) return;
					const measured = tools.getBoundingClientRect();
					const toolsBox = {
						left: measured.left,
						top: measured.top,
						width: measured.width,
						height: Math.max(measured.height, tools.scrollHeight)
					};
					setPaletteLimit(void 0);
					const safe = separatedSpot(barSpot, panelBox, own, toolsBox);
					if (safe === void 0) setBarSpot(void 0);
					else if (safe.x !== barSpot.x || safe.y !== barSpot.y) setBarSpot(safe);
				};
				settle();
				const frame = requestAnimationFrame(settle);
				return () => {
					live = false;
					cancelAnimationFrame(frame);
				};
			}, [
				barDragging,
				barSpot,
				dragging,
				fitHeight,
				fitWidth,
				palette,
				paletteLimit
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
				htmlView,
				listOpen,
				size
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
				const mark = visibleMarks.find((candidate) => candidate.id === selectedId) ?? marks.find((candidate) => candidate.id === selectedId);
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
				const at = placeCard(scaledBox(figure?.kind === "html" ? {
					...box,
					x: box.x - htmlScroll.x,
					y: box.y - htmlScroll.y
				} : box, {
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
				figure,
				htmlScroll,
				liveMark,
				marks,
				palette,
				scale,
				selectedId,
				size,
				unit,
				visibleMarks
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
				}, before, reached, paper, STAGE_INSETS);
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
			/** Apply one frame of a two-finger pinch to the live drawing factor. */
			const pinchBy = (0, react.useCallback)((factor, clientX, clientY) => {
				zoomAt(liveScale.current * factor, clientX, clientY);
			}, [zoomAt]);
			(0, react.useEffect)(() => () => {
				clearTimeout(settleTimer.current);
			}, []);
			(0, react.useEffect)(() => {
				const stage = stageRef.current;
				if (stage === null) return;
				if (previewPage !== null) return;
				/**
				* A trackpad's ordinary two-finger scroll is a pan; a pinch is the zoom.
				*
				* Browsers report a pinch as a ctrl-modified wheel, while two-finger scroll
				* arrives as an unmodified wheel with independent X and Y deltas. Treating both
				* as zoom made moving around the figure fight looking closer at it. The ordinary
				* gesture now moves the table, and `Cmd`/`Ctrl` + wheel is the explicit mouse
				* equivalent of a pinch. Shift maps a vertical mouse wheel to horizontal travel.
				*/
				const onWheel = (event) => {
					const magnify = event.ctrlKey || event.metaKey;
					const view = documentView();
					if (view !== null && !magnify) {
						const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? stage.clientHeight : 1;
						const dx = event.deltaX * unit;
						const dy = event.deltaY * unit;
						event.preventDefault();
						view.scrollBy(event.shiftKey ? dx + dy : dx, event.shiftKey ? 0 : dy);
						return;
					}
					if (!magnify && !pannable) return;
					event.preventDefault();
					if (magnify) {
						zoomAt(liveScale.current * wheelZoomFactor(event.deltaY, event.deltaMode, stage.clientHeight), event.clientX, event.clientY);
						return;
					}
					const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? stage.clientHeight : 1;
					const dx = event.deltaX * unit;
					const dy = event.deltaY * unit;
					stage.scrollLeft += event.shiftKey ? dx + dy : dx;
					stage.scrollTop += event.shiftKey ? 0 : dy;
				};
				stage.addEventListener("wheel", onWheel, { passive: false });
				return () => {
					stage.removeEventListener("wheel", onWheel);
				};
			}, [
				documentView,
				pannable,
				previewPage,
				zoomAt
			]);
			const { commit, reset: resetMarks } = history;
			/**
			* Attach a new mark to the logical page it was drawn on.
			*
			* A viewport page needs no extra locator: its scroll offset already supplies the
			* position. A deck keeps several pages at the same viewport coordinates, so the
			* surface selector is the fact that tells one slide from the next. Static HTML can
			* be inspected directly; a running page reports the surface with its picker.
			* @param mark - the mark a gesture or picker just made.
			* @param ownerSurface - the surface the page reported, or null for an element that
			* belongs outside every declared surface such as a deck's cover.
			* @returns the mark carrying a surface selector when one is known.
			*/
			const scopedMark = (0, react.useCallback)((mark, ownerSurface) => {
				if (mark.surface !== void 0 || figure?.kind !== "html") return mark;
				const staticRoot = frameRef.current?.contentDocument?.documentElement;
				const selector = ownerSurface === null ? void 0 : ownerSurface ?? (previewPage === null ? staticRoot === null || staticRoot === void 0 ? void 0 : currentSurfaceSelector(staticRoot) : liveSurface ?? void 0);
				return selector === void 0 ? mark : {
					...mark,
					surface: selector
				};
			}, [
				figure?.kind,
				liveSurface,
				previewPage
			]);
			/**
			* Add a mark to this surface's list, unless it names an element already marked.
			*
			* Both ways of naming an element end here: the picker in a proxied page reports a
			* click through a message, and a drawn one is handed over straight from the surface.
			* Either can land on the same element again and again, and each press used to leave
			* another mark on it — identical, silent, and invisible as anything but a box drawn
			* on the same rectangle. An element is named once; the press picks out the mark that
			* is already there, which is the one the reader meant to write in.
			*/
			const addMark = (0, react.useCallback)((mark, ownerSurface) => {
				const complete = scopedMark(mark, ownerSurface);
				const already = elementMarkOn(marks, complete);
				if (already !== void 0) {
					setTool("select");
					setSelectedId(already.id);
					setFocusId(already.id);
					return;
				}
				commit(appendedMarks(marks, complete));
				setTool("select");
				setSelectedId(complete.id);
				setFocusId(complete.id);
			}, [
				commit,
				marks,
				scopedMark
			]);
			/**
			* Make the document itself the picker while the overlay steps aside.
			*
			* A same-origin rendered document can be read by this side, so there is no reason
			* to cover it with a transparent canvas just to hear a click. Letting the frame keep
			* its own pointer events preserves links, scrolling, media and any local interaction;
			* this capture listener only names the element the press landed on. In element mode
			* that press becomes a mark. In select mode it selects an existing mark, or closes
			* the current one while allowing the page's native action to continue.
			*/
			(0, react.useEffect)(() => {
				if (figure?.kind !== "html" || previewPage !== null || tool !== "select" && tool !== "element") return;
				const document_ = frameRef.current?.contentDocument;
				if (document_ === null || document_ === void 0) return;
				const onPress = (event) => {
					if (event.button !== 0) return;
					if (tool === "element") htmlClickGuard.current = true;
					const view = document_.defaultView;
					const scrollX = view?.scrollX ?? 0;
					const scrollY = view?.scrollY ?? 0;
					const choices = elementChoicesInDocument(document_, event.clientX + scrollX, event.clientY + scrollY);
					const shownPick = htmlPick.current;
					const anchor = choices === void 0 ? void 0 : choices.anchors[shownPick !== null && sameChoiceElements(shownPick.choices, choices) ? Math.min(shownPick.index, choices.anchors.length - 1) : choices.preferred];
					if (anchor === void 0) {
						if (tool === "element") {
							event.preventDefault();
							event.stopImmediatePropagation();
							setStatus({
								tone: "info",
								text: t("toolElementMiss")
							});
						}
						if (tool === "select" && selectedId !== null) {
							setSelectedId(null);
							setFocusId(null);
							setOpenPanel(null);
						}
						return;
					}
					const already = elementMarkOn(marks, elementMark(anchor, color));
					if (already !== void 0) {
						htmlClickGuard.current = true;
						event.preventDefault();
						event.stopImmediatePropagation();
						setTool("select");
						setSelectedId(already.id);
						return;
					}
					if (tool === "element") {
						event.preventDefault();
						event.stopImmediatePropagation();
						addMark(elementMark(anchor, color));
						return;
					}
					if (selectedId !== null) {
						setSelectedId(null);
						setFocusId(null);
						setOpenPanel(null);
					}
				};
				document_.addEventListener("pointerdown", onPress, true);
				return () => {
					document_.removeEventListener("pointerdown", onPress, true);
				};
			}, [
				addMark,
				color,
				figure,
				marks,
				previewPage,
				selectedId,
				setSelectedId,
				t,
				tool
			]);
			/**
			* Keep the page from acting on the rest of an element-selection press.
			*
			* A browser follows pointerdown with pointerup and click. Preventing the first one
			* is not enough for a presentation whose own script listens for a click to advance:
			* the mark lands correctly and the slide also turns. This listener belongs to the
			* document rather than the element tool, because adding a mark changes the tool
			* before the click is dispatched.
			*/
			(0, react.useEffect)(() => {
				if (figure?.kind !== "html" || previewPage !== null) return;
				const document_ = frameRef.current?.contentDocument;
				if (document_ === null || document_ === void 0) return;
				const owner = eventOwnerOf(document_);
				const swallow = (event) => {
					if (!htmlClickGuard.current) return;
					event.preventDefault();
					event.stopImmediatePropagation();
					if (event.type === "pointerup") window.setTimeout(() => {
						htmlClickGuard.current = false;
					}, 0);
					else htmlClickGuard.current = false;
				};
				const cancel = () => {
					htmlClickGuard.current = false;
				};
				owner.addEventListener("pointerup", swallow, true);
				owner.addEventListener("click", swallow, true);
				owner.addEventListener("pointercancel", cancel, true);
				return () => {
					owner.removeEventListener("pointerup", swallow, true);
					owner.removeEventListener("click", swallow, true);
					owner.removeEventListener("pointercancel", cancel, true);
					htmlClickGuard.current = false;
				};
			}, [figure, previewPage]);
			/**
			* Whether the picker in a proxied page owns the pointer right now.
			*
			* Choosing an element is the one thing that has to reach the page itself, so the
			* frame takes the pointer exactly then — and gives it back the moment a drawing tool
			* is armed, because a drawing has to be drawn on this side of the fence.
			*/
			const liveArmed = previewPage !== null && tool === "element";
			/** The name of the element the reader's pointer is on, when the page reported one. */
			const [liveHover, setLiveHover] = (0, react.useState)(null);
			/** The list row whose live-page reveal is waiting for the page's answer. */
			const pendingReveal = (0, react.useRef)(null);
			/** Opaque token and timeout for that one reveal request. */
			const revealSerial = (0, react.useRef)(0);
			const revealTimer = (0, react.useRef)(null);
			/** Screenshot requests that are waiting for the page, keyed by request id. */
			const captureWaiters = (0, react.useRef)(/* @__PURE__ */ new Map());
			/** Opaque token source shared by screenshots and other live-page requests. */
			const liveRequestSerial = (0, react.useRef)(0);
			/** The mark and surface a temporary hidden-layer reveal settled on. */
			const temporaryReveal = (0, react.useRef)(null);
			const refreshLiveFrame = (0, react.useCallback)(() => {
				pendingReveal.current = null;
				for (const waiter of captureWaiters.current.values()) {
					window.clearTimeout(waiter.timer);
					waiter.resolve(void 0);
				}
				captureWaiters.current.clear();
				temporaryReveal.current = null;
				setTemporaryMark(null);
				revealSerial.current += 1;
				if (revealTimer.current !== null) {
					window.clearTimeout(revealTimer.current);
					revealTimer.current = null;
				}
				setLiveHover(null);
				setPickLevel(void 0);
				setPreviewShown(null);
				setLiveSurface(null);
				setLiveSurfaceKnown(false);
				setHtmlScroll({
					x: 0,
					y: 0
				});
				setSelectedId(null);
				setFrameRevision((revision) => revision + 1);
			}, [setSelectedId]);
			(0, react.useEffect)(() => {
				const token = props.refreshToken;
				if (token === void 0 || token === handledRefreshToken.current) return;
				handledRefreshToken.current = token;
				refreshLiveFrame();
			}, [props.refreshToken, refreshLiveFrame]);
			(0, react.useEffect)(() => () => {
				if (revealTimer.current !== null) window.clearTimeout(revealTimer.current);
				for (const waiter of captureWaiters.current.values()) {
					window.clearTimeout(waiter.timer);
					waiter.resolve(void 0);
				}
				captureWaiters.current.clear();
			}, []);
			/**
			* Move the picker's ladder while keyboard focus is still in the panel.
			*
			* Choosing the element tool focuses its button in this window, while the hovered
			* element lives in the framed page. Without this relay the displayed "↑↓" hint is
			* a promise the page never hears; the shell instead consumes the arrow and scrolls
			* the conversation behind the preview.
			*/
			const nudgePicker = (0, react.useCallback)((delta) => {
				/* v8 ignore next -- the depth buttons and key listener exist only while this page is framed. */
				if (previewPage === null) return;
				const view = frameRef.current?.contentWindow;
				if (view == null) return;
				view.postMessage(liveDepthMessage(delta), new URL(previewPage.url).origin);
			}, [previewPage]);
			(0, react.useEffect)(() => {
				if (previewPage === null || tool !== "element" || liveHover === null) return;
				const onKeyDown = (event) => {
					const target = event.target;
					if (target !== null && (target.isContentEditable === true || target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")) return;
					if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
					event.preventDefault();
					event.stopPropagation();
					event.stopImmediatePropagation();
					nudgePicker(event.key === "ArrowUp" ? 1 : -1);
				};
				window.addEventListener("keydown", onKeyDown, true);
				return () => {
					window.removeEventListener("keydown", onKeyDown, true);
				};
			}, [
				liveHover,
				nudgePicker,
				previewPage,
				tool
			]);
			/**
			* Open a page and frame it.
			*
			* The marks go with the page they were drawn on: an element locator from the file
			* that happened to be open resolves to some unrelated element here, and a mark the
			* reader never placed on this page is worse than no marks at all.
			* @param text - what the reader typed in the address field.
			*/
			const openPage = (0, react.useCallback)(async (text) => {
				if (liveBusyRef.current) return;
				const address = liveAddressOf(text);
				if (address === void 0) {
					setLiveError(t("liveBadAddress"));
					return;
				}
				const generation = liveOpenGeneration.current + 1;
				liveOpenGeneration.current = generation;
				liveBusyRef.current = true;
				setLiveBusy(true);
				setLiveError(null);
				try {
					const page = await openLivePage(address);
					if (!liveMounted.current || liveOpenGeneration.current !== generation) {
						closeLivePage(page.url).catch(() => {});
						return;
					}
					props.onLivePageChange?.(page);
					fileBeforeLive.current ??= {
						marks,
						summary,
						createdAt
					};
					resetMarks([]);
					writeSummary("");
					setCreatedAt(null);
					setSelectedId(null);
					setLiveHover(null);
					setPickLevel(void 0);
					setPreviewShown(null);
					setLiveSurface(null);
					setLiveSurfaceKnown(false);
					setHtmlScroll({
						x: 0,
						y: 0
					});
					setLiveText(null);
					setLivePage(page);
					setLiveAddressOpen(false);
				} catch (error) {
					if (liveMounted.current && liveOpenGeneration.current === generation) setLiveError(error instanceof Error ? error.message : String(error));
				} finally {
					if (liveOpenGeneration.current === generation) {
						liveBusyRef.current = false;
						if (liveMounted.current) setLiveBusy(false);
					}
				}
			}, [
				createdAt,
				marks,
				resetMarks,
				setSelectedId,
				summary,
				t,
				writeSummary
			]);
			/**
			* Put the file back in the frame.
			*
			* The proxy stops with it: a port still answering on the reader's machine for a page
			* nobody is looking at is a leftover, not a feature.
			*/
			const closePage = (0, react.useCallback)((file) => {
				fileBeforeLive.current = null;
				setLivePage(null);
				setLiveText(null);
				setLiveError(null);
				setLiveHover(null);
				setPickLevel(void 0);
				setPreviewShown(null);
				setLiveSurface(null);
				setLiveSurfaceKnown(false);
				setHtmlScroll({
					x: 0,
					y: 0
				});
				setLiveAddressOpen(false);
				resetMarks(file.marks);
				writeSummary(file.summary);
				setCreatedAt(file.createdAt);
				setSelectedId(null);
				const pageUrl = live.current.livePage?.url;
				closeLivePage(pageUrl).catch(() => {});
			}, [
				resetMarks,
				setSelectedId,
				writeSummary
			]);
			/**
			* Tell the page whether the pointer belongs to the picker.
			*
			* A page that acts on a click — a link, a button, a menu — must keep doing so until
			* the reader has asked to annotate it, and must stop doing so exactly then: that is
			* the whole of "annotation is a layer". Sent on arming and on a page reporting it is
			* ready, because a frame that was still loading could not have heard it.
			*/
			const armPicker = (0, react.useCallback)((url, armed) => {
				const view = frameRef.current?.contentWindow;
				if (view == null) return;
				view.postMessage(liveModeMessage(armed), new URL(url).origin);
			}, []);
			/**
			* Ask the page to keep the saved element boxes current.
			* @param url - the interactive page's own URL.
			* @param selectors - locators carried by marks on this document.
			*/
			const watchPicker = (0, react.useCallback)((url, selectors) => {
				const view = frameRef.current?.contentWindow;
				if (view == null) return;
				view.postMessage(liveWatchMessage(selectors), new URL(url).origin);
			}, []);
			/** Undo a cover or modal reveal once the mark that needed it is closed. */
			const releasePicker = (0, react.useCallback)((url) => {
				const view = frameRef.current?.contentWindow;
				if (view == null) return;
				view.postMessage(liveReleaseMessage(), new URL(url).origin);
			}, []);
			/**
			* Ask the page for the picture this send is about.
			*
			* A screenshot is taken only when the reader commits the review, not while they
			* draw. The page answers with its whole document, the current scroll, and the
			* live element boxes; the parent composes the visible part from those facts.
			* @returns the usable capture, or undefined when the page cannot answer in time.
			*/
			const requestLiveScreenshot = (0, react.useCallback)((url) => {
				const view = frameRef.current?.contentWindow;
				if (view == null) return Promise.resolve(void 0);
				const requestId = `${Date.now().toString(36)}-${(liveRequestSerial.current += 1).toString(36)}`;
				return new Promise((resolve) => {
					const timer = window.setTimeout(() => {
						captureWaiters.current.delete(requestId);
						resolve(void 0);
					}, 12e3);
					captureWaiters.current.set(requestId, {
						resolve,
						timer
					});
					try {
						view.postMessage(liveCaptureMessage(requestId), new URL(url).origin);
					} catch {
						window.clearTimeout(timer);
						captureWaiters.current.delete(requestId);
						resolve(void 0);
					}
				});
			}, []);
			/**
			* Put one live document's current viewport under its marks.
			* @param capture - the page's screenshot and the live bounds at that moment.
			* @param scope - the marks this hand-off is about.
			* @returns the annotated PNG.
			*/
			const exportLiveScreenshot = (0, react.useCallback)(async (capture, shown) => {
				return await rasterizePngWithThumb(composeLiveScreenshotSvg({
					imageDataUrl: capture.dataUrl,
					documentWidth: capture.document[0],
					documentHeight: capture.document[1],
					imageRect: capture.imageRect,
					viewportWidth: capture.viewport[0],
					viewportHeight: capture.viewport[1],
					scrollX: capture.scroll[0],
					scrollY: capture.scroll[1]
				}, shown), capture.viewport[0], capture.viewport[1], Math.min(1.5, reviewScale(capture.viewport[0], capture.viewport[1])), true);
			}, []);
			(0, react.useEffect)(() => {
				if (previewPage === null) return;
				armPicker(previewPage.url, liveArmed);
				if (!liveArmed) setLiveHover(null);
			}, [
				armPicker,
				liveArmed,
				previewPage
			]);
			/** Unique selectors whose elements have to be measured by the page. */
			const watchedSelectors = (0, react.useMemo)(() => [...new Set(marks.flatMap((mark) => mark.anchor?.selector === void 0 ? [] : [mark.anchor.selector]))], [marks]);
			(0, react.useEffect)(() => {
				if (previewPage === null) return;
				watchPicker(previewPage.url, watchedSelectors);
			}, [
				previewPage,
				watchedSelectors,
				watchPicker
			]);
			const hadSelectedMark = (0, react.useRef)(false);
			(0, react.useEffect)(() => {
				if (previewPage === null) return;
				if (selectedId !== null) {
					hadSelectedMark.current = true;
					return;
				}
				if (!hadSelectedMark.current) return;
				if (pendingReveal.current !== null) {
					hadSelectedMark.current = false;
					return;
				}
				hadSelectedMark.current = false;
				temporaryReveal.current = null;
				setTemporaryMark(null);
				releasePicker(previewPage.url);
			}, [
				previewPage,
				releasePicker,
				selectedId
			]);
			(0, react.useEffect)(() => {
				if (previewPage === null) return;
				return () => {
					releasePicker(previewPage.url);
				};
			}, [previewPage, releasePicker]);
			/**
			* Listen to the page.
			*
			* Everything the panel knows about a proxied page arrives here: how far it has
			* scrolled, what the pointer is on, what it picked. Nothing is read out of the frame
			* — it is another origin, and a page the panel could read would be a page whose
			* scripts could read back.
			*/
			(0, react.useEffect)(() => {
				if (previewPage === null) return;
				const origin = new URL(previewPage.url).origin;
				const onMessage = (event) => {
					const view = frameRef.current?.contentWindow;
					if (event.origin !== origin || view === null || view === void 0 || event.source !== view) return;
					const fields = typeof event.data === "object" && event.data !== null ? event.data : null;
					const requestId = fields !== null && fields["figmark"] === "dsh-figmark:live" && fields["kind"] === "capture-result" && typeof fields["requestId"] === "string" ? fields["requestId"] : void 0;
					if (requestId !== void 0) {
						const waiter = captureWaiters.current.get(requestId);
						if (waiter !== void 0) {
							captureWaiters.current.delete(requestId);
							window.clearTimeout(waiter.timer);
							const parsed = parseLiveEvent(event.data);
							waiter.resolve(parsed?.kind === "capture-result" && parsed.status === "ok" ? parsed : void 0);
							return;
						}
					}
					const reported = parseLiveEvent(event.data);
					if (reported === void 0) return;
					if (reported.kind === "capture-result") return;
					if (reported.kind === "reveal-result") {
						const pending = pendingReveal.current;
						if (pending === null || pending.id !== reported.requestId) return;
						pendingReveal.current = null;
						if (revealTimer.current !== null) {
							window.clearTimeout(revealTimer.current);
							revealTimer.current = null;
						}
						if (reported.status === "revealed") {
							temporaryReveal.current = reported.temporary === true ? {
								markId: pending.mark.id,
								surface: reported.surface ?? null
							} : null;
							setTemporaryMark(reported.temporary === true ? pending.mark : null);
							setSelectedId(pending.mark.id);
							setOpenPanel(null);
						} else if (reported.status === "hidden") {
							temporaryReveal.current = null;
							setTemporaryMark(null);
							setSelectedId(pending.mark.id);
							setOpenPanel(null);
						} else {
							temporaryReveal.current = null;
							setTemporaryMark(null);
							setStatus({
								tone: "info",
								text: t(`reveal_${reported.status}`)
							});
							setSelectedId(null);
						}
						return;
					}
					if (reported.kind === "surface") {
						setLiveSurface(reported.selector);
						setLiveSurfaceKnown(true);
						setSelectedId((current) => {
							const selectedMark = marks.find((mark) => mark.id === current);
							if (selectedMark === void 0) return current;
							const temporary = temporaryReveal.current;
							if (temporary !== null && temporary.markId === current && temporary.surface !== reported.selector) {
								temporaryReveal.current = null;
								return null;
							}
							return selectedMark.surface !== void 0 && selectedMark.surface !== reported.selector ? null : current;
						});
						setLiveHover(null);
						setPickLevel(void 0);
						return;
					}
					if (reported.kind === "scroll") {
						setHtmlScroll({
							x: reported.scroll[0],
							y: reported.scroll[1]
						});
						return;
					}
					if (reported.kind === "ready") {
						setHtmlScroll({
							x: reported.scroll[0],
							y: reported.scroll[1]
						});
						armPicker(previewPage.url, liveArmed);
						watchPicker(previewPage.url, watchedSelectors);
						return;
					}
					if (reported.kind === "leave") {
						setLiveHover(null);
						setPickLevel(void 0);
						return;
					}
					if (reported.kind === "cancel") {
						setLiveHover(null);
						setPickLevel(void 0);
						setSelectedId(null);
						setFocusId(null);
						setTool("select");
						return;
					}
					if (reported.kind === "bounds") {
						const bySelector = /* @__PURE__ */ new Map();
						for (const mark of marks) {
							const selector = mark.anchor?.selector;
							if (selector === void 0) continue;
							bySelector.set(selector, [...bySelector.get(selector) ?? [], mark]);
						}
						const boxes = /* @__PURE__ */ new Map();
						const away = /* @__PURE__ */ new Set();
						for (const bound of reported.bounds) for (const mark of bySelector.get(bound.selector) ?? []) if (!bound.visible || bound.bbox[2] === 0 && bound.bbox[3] === 0) away.add(mark.id);
						else if (mark.kind === "element") boxes.set(mark.id, bound.bbox);
						const next = {
							boxes,
							away
						};
						setPreviewShown((current) => sameShownMarks(current, next) ? current : next);
						return;
					}
					if (reported.kind === "hover") {
						setLiveHover({
							anchor: anchorOfPick(reported),
							name: pickName(reported),
							...reported.level === void 0 ? {} : { level: reported.level },
							...reported.count === void 0 ? {} : { count: reported.count }
						});
						setPickLevel(reported.level === void 0 || reported.count === void 0 ? void 0 : {
							level: reported.level,
							count: reported.count
						});
						return;
					}
					setLiveHover(null);
					setPickLevel(void 0);
					addMark(elementMark(anchorOfPick(reported), color), reported.surface);
				};
				window.addEventListener("message", onMessage);
				return () => {
					window.removeEventListener("message", onMessage);
				};
			}, [
				addMark,
				armPicker,
				color,
				liveArmed,
				marks,
				previewPage,
				setSelectedId,
				setStatus,
				t,
				watchPicker,
				watchedSelectors
			]);
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
			* Arm one tool and put the previous tool's editing furniture away.
			*
			* A drawing or element gesture owns the whole surface. Carrying a selected mark's
			* handles and comment into it made one pointerpress mean two things at once.
			*/
			const chooseTool = (0, react.useCallback)((next) => {
				setTool(next);
				if (next === "select") return;
				setSelectedId(null);
				setFocusId(null);
				setLiveMark(null);
				setOpenPanel(null);
			}, [setOpenPanel]);
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
				if (isPage || address === "" || livePage !== null) return;
				if (loaded === null || size === null) return;
				if (writtenSignature.current === null) {
					writtenSignature.current = annotationSignature(marks, summary);
					return;
				}
				autosave.current?.schedule();
			}, [
				address,
				isPage,
				livePage,
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
						if (dragFrom.current !== null) {
							event.preventDefault();
							cancelStripDrag(dragFrom, setPalette, setDragging);
							return;
						}
						if (barFrom.current !== null) {
							event.preventDefault();
							cancelStripDrag(barFrom, setBarSpot, setBarDragging);
							return;
						}
						if (canvasInput.current?.cancel() === true) {
							event.preventDefault();
							return;
						}
						if (openPanel !== null) {
							event.preventDefault();
							setOpenPanel(null);
							return;
						}
						if (tool !== "select") {
							event.preventDefault();
							setTool("select");
							return;
						}
						if (selectedId === null) return;
						event.preventDefault();
						setSelectedId(null);
						setFocusId(null);
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
				barFrom,
				cancelStripDrag,
				openPanel,
				redo,
				removeMark,
				selectedId,
				setOpenPanel,
				setSelectedId,
				tool,
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
					figure: livePage === null ? {
						address,
						path: loaded.path,
						mediaType: loaded.mediaType,
						sha256: loaded.sha256
					} : {
						address: livePage.address,
						path: livePage.address,
						mediaType: "text/html",
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
				livePage,
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
				toasts.dropTone("error");
			}, [toasts]);
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
					if (state.livePage !== null || state.address === "" || state.loaded === null || state.size === null) return;
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
					if (livePage === null) await deleteAnnotation(address);
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
				livePage,
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
				const sentIds = new Set(scope.map((mark) => mark.id));
				const sentSummary = summary;
				if (scope.length === 0) {
					await toasts.notify("annotate.none");
					return;
				}
				if (size === null || size.height <= 0) {
					setStatus({
						tone: "info",
						text: t("sendNoFigure")
					});
					return;
				}
				const event = target === "agent" ? "annotate.send.agent" : only === void 0 ? "annotate.save.all" : "annotate.save.one";
				setBusy("sending");
				let warnings = [];
				try {
					if (await toasts.notify(event, async () => {
						if (sessionId === void 0) throw new Error("the figure address carries no session");
						const sessions = props.sessions;
						if (sessions === void 0) throw new Error("the sessions service is unavailable");
						const document_ = buildDocument(size, scope);
						if (document_ === null) throw new Error(t("loadFailed"));
						const wantsScreenshot = livePage !== null && liveMarksNeedScreenshot(scope, liveSurface, [htmlScroll.x, htmlScroll.y], [size.width, size.height]);
						let screenshot;
						let pageCapture = livePage === null ? "none" : "omitted";
						if (wantsScreenshot) {
							const capture = await requestLiveScreenshot(livePage.url);
							if (capture !== void 0) {
								const shown = liveScreenshotMarks(scope, capture.surface, capture.bounds, capture.scroll, capture.viewport);
								if (liveMarksNeedScreenshot(shown)) try {
									screenshot = await exportLiveScreenshot(capture, shown);
									pageCapture = "attached";
								} catch {
									pageCapture = "failed";
								}
							} else pageCapture = "failed";
						}
						const review = layer === null || !needsReviewImage(document_) ? void 0 : await exportPng(layer, scope);
						const saved = livePage === null ? await saveAnnotation(address, document_, review) : {
							annotationPath: "",
							reviewPath: null
						};
						autosave.current?.cancel();
						writtenSignature.current = annotationSignature(document_.marks, document_.summary ?? "");
						setCreatedAt(document_.createdAt);
						setStale(false);
						const sentImage = screenshot?.image ?? review;
						const pageImages = sentImage === void 0 ? [] : [{
							page: 1,
							image: sentImage
						}];
						const locale = (props.localeId ?? "zh").startsWith("en") ? "en" : "zh";
						const thumb = screenshot?.thumb ?? await captureThumb(review);
						if (target === "composer") parkInComposer({
							conversation: props.conversation,
							sessionId,
							document: document_,
							paths: saved,
							thumb,
							pageImages: pageImages.length,
							pageCapture,
							file: reviewImageFile(sentImage, document_.figure.path),
							locale,
							send: async () => {
								return await deliverAnnotation({
									sessions,
									sessionId,
									document: document_,
									paths: saved,
									pageImages,
									pageCapture,
									thumb,
									locale
								});
							}
						});
						else warnings = await deliverAnnotation({
							sessions,
							sessionId,
							document: document_,
							paths: saved,
							pageImages,
							pageCapture,
							thumb,
							locale
						});
					}) !== "ok") return;
					reportDeliveryWarnings(warnings, setStatus);
					if (only === void 0) {
						const current = live.current;
						const remaining = current.marks.filter((mark) => !sentIds.has(mark.id));
						const keptSummary = current.summary === sentSummary ? "" : current.summary;
						autosave.current?.cancel();
						await autosave.current?.drained();
						try {
							if (livePage === null) await deleteAnnotation(address);
						} catch (error) {
							setStatus(failureStatus(t, "clearError", error));
						}
						commit(remaining);
						setCreatedAt(remaining.length > 0 || keptSummary.trim() !== "" ? current.createdAt : null);
						setStale(false);
						writeSummary(keptSummary);
						setSelectedId((currentSelection) => remaining.some((mark) => mark.id === currentSelection) ? currentSelection : null);
						if (remaining.length > 0 || keptSummary.trim() !== "") autosave.current?.schedule();
						return;
					}
					commit(removedMarks(live.current.marks, only.id));
					setSelectedId((current) => current === only.id ? null : current);
					autosave.current?.schedule();
				} finally {
					setBusy(null);
				}
			}, [
				address,
				buildDocument,
				commit,
				exportLiveScreenshot,
				exportPng,
				layer,
				livePage,
				marks,
				props.conversation,
				props.localeId,
				props.sessions,
				requestLiveScreenshot,
				sessionId,
				setSelectedId,
				size,
				summary,
				t,
				toasts,
				writeSummary
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
			const isHtml = mediaType === "text/html" || livePage !== null;
			/** Name what one figure point landed on, for a surface that holds its own elements. */
			const anchorAtFigurePoint = (0, react.useCallback)((x, y) => anchorInDocument(frameRef.current?.contentDocument, x, y), []);
			/** Every containing level of the element under one point in the framed document. */
			const anchorChoicesAtFigurePoint = (0, react.useCallback)((x, y) => elementChoicesInDocument(frameRef.current?.contentDocument, x, y), []);
			/**
			* The element a selector names, in whichever document the figure's elements live.
			*
			* An inline SVG's elements are in this panel's document, rooted at the host the
			* markup was injected into; a rendered document's are inside its frame, where
			* nothing of the panel's reaches — the frame is read, not styled, so a name is all
			* this side ever needs from it.
			*
			* @param selector - the element's name, as an anchor spells it.
			* @returns the element, or undefined when the figure no longer has one by that name.
			*/
			const findElement = (0, react.useCallback)((selector) => {
				/* v8 ignore start -- a body only asks once its figure has mounted, so neither ref is empty here. */
				if (isHtml) {
					const doc = frameRef.current?.contentDocument ?? null;
					if (doc === null || doc.documentElement === null) return void 0;
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
			* On a drawing the light *is* the mark: an element mark has no path of its own, so a
			* curve named by one is shown by lighting the curve, and the selected mark is lit
			* harder than the rest.
			*
			* A rendered document is the other way round. There the mark draws the element's box,
			* and the light would be a second, softer copy of the same statement — on a slide the
			* element is a whole block of type, so the glow came out as a haze spread over the
			* page rather than as a way of pointing at something. So only the picker's preview is
			* lit there: it says what a click would take, and it leaves with the pointer.
			*
			* Built fresh rather than accumulated: the marks change, the figure is reloaded, and
			* a list patched in place would keep lighting elements that are no longer there.
			*
			* @param preview - the element the picker is offering, if any.
			* @returns what to light, in a stable enough order that the class work is minimal.
			*/
			const litSpots = (0, react.useCallback)((preview) => collectLitSpots({
				marks: isHtml ? [] : marks,
				selectedId,
				preview,
				colour: color,
				findElement
			}), [
				color,
				findElement,
				isHtml,
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
			const lightElement = (0, react.useCallback)((anchor, level) => {
				hovered.current = anchor;
				lightUp(anchor);
				setPickLevel(level);
				const key = chipKey(anchor);
				if (key === chipShown.current) return;
				chipShown.current = key;
				setChipAnchor(anchor ?? null);
			}, [lightUp]);
			/**
			* Follow the pointer inside a same-origin rendered document.
			*
			* The frame keeps native pointer ownership in element mode so links and scrolling
			* still behave like the page. That also means the overlay never receives a move:
			* without this capture listener the page can be clicked but the reader cannot see
			* which element the click will take. The listener only observes; it never prevents
			* or retargets the page's own event.
			*/
			(0, react.useEffect)(() => {
				if (figure?.kind !== "html" || previewPage !== null || tool !== "element") return;
				const document_ = frameRef.current?.contentDocument;
				if (document_ === null || document_ === void 0) return;
				const report = (pick) => {
					htmlPick.current = pick;
					const anchor = pick.choices.anchors[pick.index];
					lightElement(anchor, {
						level: pick.index + 1,
						count: pick.choices.anchors.length
					});
				};
				const onMove = (event) => {
					const view = document_.defaultView;
					const choices = elementChoicesInDocument(document_, event.clientX + (view?.scrollX ?? 0), event.clientY + (view?.scrollY ?? 0));
					if (choices === void 0) {
						htmlPick.current = null;
						lightElement(void 0);
						return;
					}
					const previous = htmlPick.current;
					const index = previous !== null && sameChoiceElements(previous.choices, choices) ? Math.min(previous.index, choices.anchors.length - 1) : choices.preferred;
					report({
						choices,
						index
					});
				};
				const onKeyDown = (event) => {
					if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
					const target = event.target;
					if (target !== null && typeof target.closest === "function" && (target.closest("[contenteditable]:not([contenteditable=\"false\"])") !== null || target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")) return;
					const current = htmlPick.current;
					if (current === null) return;
					event.preventDefault();
					const delta = event.key === "ArrowUp" ? 1 : -1;
					const index = Math.min(current.choices.anchors.length - 1, Math.max(0, current.index + delta));
					if (index !== current.index) report({
						choices: current.choices,
						index
					});
				};
				const forget = () => {
					htmlPick.current = null;
					lightElement(void 0);
				};
				document_.addEventListener("pointerover", onMove, true);
				document_.addEventListener("pointermove", onMove, true);
				document_.addEventListener("pointercancel", forget, true);
				document_.documentElement.addEventListener("pointerleave", forget);
				document_.addEventListener("keydown", onKeyDown);
				window.addEventListener("keydown", onKeyDown);
				return () => {
					document_.removeEventListener("pointerover", onMove, true);
					document_.removeEventListener("pointermove", onMove, true);
					document_.removeEventListener("pointercancel", forget, true);
					document_.documentElement.removeEventListener("pointerleave", forget);
					document_.removeEventListener("keydown", onKeyDown);
					window.removeEventListener("keydown", onKeyDown);
					forget();
				};
			}, [
				figure,
				lightElement,
				previewPage,
				tool
			]);
			if (mediaType === void 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: "da-hint",
				children: t("unsupported")
			});
			if (data === void 0 && surface === void 0 && props.livePage === void 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
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
			* A local deck can turn to the slide a selector names; a paged document reports the
			* turn to its owner. Selection follows the turn so a page change cannot clear it
			* after the row asked for it.
			*/
			const reveal = (mark) => {
				if (previewPage !== null) {
					const point = mark.points[0];
					const bbox = mark.anchor?.bbox ?? (point === void 0 ? [
						0,
						0,
						0,
						0
					] : [
						point[0],
						point[1],
						0,
						0
					]);
					const requestId = `${Date.now().toString(36)}-${(revealSerial.current += 1).toString(36)}`;
					const view = frameRef.current?.contentWindow;
					temporaryReveal.current = null;
					setTemporaryMark(null);
					pendingReveal.current = {
						id: requestId,
						mark
					};
					if (revealTimer.current !== null) window.clearTimeout(revealTimer.current);
					revealTimer.current = window.setTimeout(() => {
						pendingReveal.current = null;
						setTemporaryMark(null);
						setSelectedId(null);
						setStatus({
							tone: "info",
							text: t("reveal_timeout")
						});
						releasePicker(previewPage.url);
					}, 2600);
					view?.postMessage(liveRevealMessage(requestId, mark.anchor?.selector ?? null, mark.surface ?? (mark.anchor?.selector === void 0 ? liveSurface : null), bbox), new URL(previewPage.url).origin);
					revealOnPage(mark);
					return;
				}
				const root = frameRef.current?.contentDocument?.documentElement;
				const selector = mark.anchor?.selector;
				const slide = root === void 0 || selector === void 0 ? void 0 : deckSlideOf(root, selector);
				if (slide !== void 0) turnDeck(slide);
				const document_ = frameRef.current?.contentDocument ?? null;
				const target = selector === void 0 || document_ === null ? void 0 : elementAt({
					root: document_,
					selector
				});
				try {
					target?.scrollIntoView({
						block: "center",
						inline: "center",
						behavior: "auto"
					});
				} catch {}
				setSelectedId(mark.id);
				revealOnPage(mark);
				if (isHtml) setOpenPanel(null);
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
				tools: isVector || isHtml ? TOOLS$1 : TOOLS$1.filter((entry) => !ELEMENT_TOOLS.has(entry.tool)),
				tool,
				elementGuide: tool === "element" ? {
					label: pickLevel === void 0 ? `${t("toolElementMode")}, ${t("toolElementHint")}, ${t("toolElementKeys")}` : `${t("toolElementMode")}, ${t("toolElementDepth", {
						level: pickLevel.level,
						count: pickLevel.count
					})}, ${t("toolElementKeys")}`,
					...pickLevel === void 0 ? {} : {
						depth: t("toolElementDepth", {
							level: pickLevel.level,
							count: pickLevel.count
						}),
						level: pickLevel.level,
						count: pickLevel.count,
						onDepth: nudgePicker
					}
				} : void 0,
				onChoose: chooseTool,
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
			/**
			* The name of the element the pointer is on, written at its own corner.
			*
			* On both surfaces that have elements. An inline SVG uses the name alone beside its
			* own glow; a rendered document also gets the live box because its blocks are what
			* the reader is choosing between. A picture has no elements to name at all.
			*/
			/**
			* The element the pointer is on, whichever half of the fence reported it.
			*
			* On a file the panel reads its own frame, so the chip stands for an element it can
			* still look at; on a proxied page the page reported the name, because nothing here
			* can read a box across an origin.
			*/
			const chip = liveHover !== null ? {
				...nameChipAt(liveHover.anchor.bbox, [htmlScroll.x, htmlScroll.y], { width: fitWidth }),
				anchor: liveHover.anchor,
				name: liveHover.name
			} : (isHtml || isVector) && chipAnchor !== null ? {
				...nameChipAt(chipAnchor.bbox, [htmlScroll.x, htmlScroll.y], { width: htmlWidth }),
				anchor: chipAnchor
			} : null;
			/**
			* Whether the page under the overlay owns the pointer.
			*
			* Reading is the page's own: a link follows, a video plays, the page scrolls itself.
			* Choosing an element is the one act that has to reach into the page — and only on a
			* page the panel cannot read, where the reader marks by pointing instead of by
			* reading the DOM. Anything being drawn takes the pointer back to this side.
			*/
			const passing = previewPage !== null && selectedId === null && (tool === "select" || tool === "element");
			/** The address the frame is pointed at, when it is not the file's own document. */
			const pageUrl = previewPage === null ? void 0 : previewPage.url;
			/** The quiet directory breadcrumb shown beside a file's name while it is at rest. */
			const liveParent = loaded === null ? "" : parentPathOf(loaded.path);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "da-root",
				"data-html": isHtml,
				"data-live-open": liveAddressOpen,
				"data-live-error": liveAddressOpen && liveError !== null,
				"data-compact": fitWidth > 0 && fitWidth < 360,
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
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ToastStack, {
						view: toasts,
						label: t("close"),
						resendLabel: t("toastResend")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "da-live-bar",
						"data-open": liveAddressOpen,
						hidden: !isHtml || props.livePage !== void 0,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "da-live-field",
							"data-live": livePage !== null,
							"data-open": liveAddressOpen,
							title: loaded?.path ?? void 0,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "da-live-toggle",
								"aria-expanded": liveAddressOpen,
								"aria-label": t(liveAddressOpen ? "liveAddressCollapse" : "liveAddressExpand"),
								title: liveAddressOpen ? t("liveAddressCollapse") : loaded?.path ?? t("liveAddressExpand"),
								onClick: () => {
									setLiveAddressOpen((open) => !open);
								},
								children: livePage === null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
									className: "da-live-icon",
									viewBox: "0 0 24 24",
									"aria-hidden": "true",
									focusable: "false",
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M6.5 3.5h7l4 4v13h-11zM13.5 3.5v4h4M9 11.5h6M9 14.5h6M9 17.5h4" })
								}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
									className: "da-live-icon",
									viewBox: "0 0 24 24",
									"aria-hidden": "true",
									focusable: "false",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
										cx: "12",
										cy: "12",
										r: "8.5"
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M3.8 12h16.4M12 3.5c2.3 2.3 3.5 5.1 3.5 8.5S14.3 18.2 12 20.5M12 3.5C9.7 5.8 8.5 8.6 8.5 12s1.2 6.2 3.5 8.5" })]
								})
							}), liveAddressOpen ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: "da-live-parent",
									hidden: livePage !== null || liveText !== null || liveParent === "",
									children: [liveParent, /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "da-live-parent-sep",
										"aria-hidden": true,
										children: "/"
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									ref: liveAddressRef,
									className: "da-live-addr",
									value: shownAddress(liveText, livePage, loaded?.path ?? ""),
									"aria-label": t("liveAddress"),
									placeholder: t("liveAddress"),
									autoComplete: "off",
									spellCheck: false,
									onFocus: () => {
										setLiveText(null);
										setLiveError(null);
									},
									onChange: (event) => {
										setLiveText(event.target.value);
										setLiveError(null);
									},
									onKeyDown: (event) => {
										if (event.key === "Enter") {
											event.preventDefault();
											openPage(event.currentTarget.value);
										}
										if (event.key === "Escape") {
											setLiveText(null);
											setLiveError(null);
										}
									}
								}),
								livePage === null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "da-live-badge",
									"aria-hidden": "true",
									children: "HTML"
								}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "da-live-refresh",
									"aria-label": t("liveRefresh"),
									title: t("liveRefresh"),
									onClick: refreshLiveFrame,
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
										viewBox: "0 0 24 24",
										"aria-hidden": "true",
										focusable: "false",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M21 3v5h-5" })]
									})
								})
							] }) : null]
						}), liveAddressOpen ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "da-live-note",
							hidden: !liveBusy,
							children: t("liveOpening")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "da-live-back",
							hidden: livePage === null || fileBeforeLive.current === null,
							onClick: () => {
								const file = fileBeforeLive.current;
								if (file !== null) closePage(file);
							},
							children: t("liveBack")
						})] }) : null]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "da-live-error",
						hidden: props.livePage !== void 0 || !liveAddressOpen || liveError === null,
						children: liveError
					}),
					deckCount < 2 || previewPage !== null ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "da-deck-pager",
						role: "group",
						"aria-label": t("pagerLabel"),
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-label": t("previousPage"),
								title: t("previousPage"),
								disabled: deckPage === 0,
								onClick: () => {
									turnDeck((page) => page - 1);
								},
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
									viewBox: "0 0 16 16",
									"aria-hidden": "true",
									focusable: "false",
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "m9.5 3.5-4 4.5 4 4.5" })
								})
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								"aria-live": "polite",
								children: t("pageOf", {
									page: deckPage + 1,
									pages: deckCount
								})
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-label": t("nextPage"),
								title: t("nextPage"),
								disabled: deckPage === deckCount - 1,
								onClick: () => {
									turnDeck((page) => page + 1);
								},
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
									viewBox: "0 0 16 16",
									"aria-hidden": "true",
									focusable: "false",
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "m6.5 3.5 4 4.5-4 4.5" })
								})
							})
						]
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
						htmlView: htmlView ?? (previewPage === null ? {
							width: htmlWidth,
							height: fitHeight
						} : {
							width: fitWidth,
							height: fitHeight
						}),
						stageClass: {
							hand: tool === "select" && previewPage === null,
							panning,
							pannable
						},
						passing,
						pageUrl,
						frameRevision,
						onContextMenu: openMenu,
						onRasterLoad: setFileRasterSize,
						overlay: paper === null || size === null ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Canvas, {
							inputRef: canvasInput,
							width: paper.width,
							height: paper.height,
							origin: [-paper.x, -paper.y],
							shift: figure?.kind === "html" ? [htmlScroll.x, htmlScroll.y] : void 0,
							figureSize: size,
							marks: visibleMarks,
							tool,
							color,
							weight,
							scale,
							containerRef: figureHostRef,
							anchoring: isVector,
							elementExtent: figure?.kind === "html" ? "box" : void 0,
							anchorAtFigurePoint: figure?.kind === "html" ? anchorAtFigurePoint : void 0,
							anchorChoicesAtFigurePoint: figure?.kind === "html" ? anchorChoicesAtFigurePoint : void 0,
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
							pannable,
							onZoomAt: previewPage === null ? pinchBy : void 0,
							onHover: lightElement,
							onPickMiss: () => {
								setStatus({
									tone: "info",
									text: t("toolElementMiss")
								});
							},
							onEdit: editMark,
							onDrawn: finishDrawing,
							onLiveEdit: setLiveMark,
							numbering: props.numbering
						}),
						chip: chip === null ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [isHtml ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "da-live-hit",
							style: hoverBoxAt(chip.anchor.bbox, [htmlScroll.x, htmlScroll.y])
						}) : null, /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "da-name",
							style: {
								left: chip.left,
								top: chip.top
							},
							children: elementName(chip.anchor, findElement, chip.name)
						})] }),
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
						onRemove: () => {
							removeMark(selected.id);
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
		//#region src/client/annotation-subject.ts
		/** Shared display identity for a review, before and after sending. */
		/**
		* Identify the reviewed source, independently of its mark tools or screenshot.
		* @param data - the immutable message facts.
		* @returns a readable name, media badge, and whether navigation belongs to the service tab.
		*/
		function annotationSubject(data) {
			const address = data.html ? loopbackAddressOf(data.file) : void 0;
			if (address !== void 0) {
				const url = new URL(address);
				return {
					name: `${url.host}${url.pathname === "/" ? "" : url.pathname}`,
					badge: "WEB",
					live: true
				};
			}
			const suffix = suffixOf(data.file);
			const badge = data.html ? "HTML" : /^(?:pdf|svg|png|jpe?g|webp|gif|bmp|ico)$/u.test(suffix) ? suffix.toUpperCase() : "FIG";
			return {
				name: baseNameOf(data.file),
				badge,
				live: false
			};
		}
		//#endregion
		//#region src/client/annotation-card.tsx
		/**
		* The annotation a reader sent, as a card inside their own bubble.
		*
		* The message still says everything it said — the model reads the same text,
		* copying it copies the same text — but in the transcript the same block is easier
		* to scan as a small sheet: which figure, how large, how many marks, and what each
		* of them asked for. Clicking its header expands the delivered review; a separate action opens the
		* current source in the Sidebar, which may have changed since this message was sent.
		*
		* Two rules keep this a view and nothing more. It reads the block it was dispatched
		* for and never edits it; and it draws from the parsed data alone, so a block whose
		* data a future version spells differently falls back to plain text rather than to a
		* broken card.
		* @module dsh-figmark/client/annotation-card
		*/
		/** How many marks a card lists before it stops counting them one by one. */
		const MAX_ROWS = 5;
		/**
		* Split one verbatim mark line into the facts the card draws.
		*
		* The message remains the source of truth and is never changed. This only gives the
		* card three levels of type: a name a reader recognises, geometry they can glance at,
		* and the element's words or source locator they need when the name is not enough.
		* An unfamiliar suffix stays in the row's tooltip rather than being invented here.
		* @param label - one mark's name, exactly as delivered.
		* @returns the display parts, all empty except a name when the line has no extras.
		*/
		function readCardMarkLabel(label) {
			const rawName = /^(.+?\d{1,4})(?=\s|$)/u.exec(label)?.[1] ?? label;
			const rest = label.slice(rawName.length).trim();
			const geometry = /^(?:位于\s*|at\s*)?\([^)]*\)(?:\s*(?:→|->|–|-)\s*\([^)]*\))?/u.exec(rest)?.[0] ?? "";
			const elementMatch = /(?:元素标题|元素文字|element title|element text)\s*(?:「([^」]*)」|"([^"]*)")/u.exec(label);
			const element = elementMatch?.[1] ?? elementMatch?.[2] ?? "";
			const aside = /[（(](?:超出图面|outside)[^）)]*[）)]/iu.exec(label)?.[0] ?? "";
			const selector = /(?:选择器|selector)\s+(.+)$/u.exec(label.replace(aside, ""))?.[1]?.replace(/\s*[)）]\s*$/u, "").trim() ?? "";
			const openingTag = /<([a-z][\w-]*)\b[^>]*>/iu.exec(label)?.[0] ?? "";
			const tagName = /^<([a-z][\w-]*)\b/iu.exec(openingTag)?.[1];
			const tag = tagName === void 0 ? "" : `<${tagName.toLowerCase()}>`;
			return {
				name: rawName.replace(/^(.+?)(\d+)$/u, "$1 $2").replace(/\s+/gu, " ").trim(),
				geometry,
				tag,
				element,
				locator: selector === "" ? openingTag : selector,
				aside
			};
		}
		/**
		* Narrow one unknown value to a record.
		* @param value - any value out of JSON.
		* @returns whether it is a non-array object.
		*/
		function isRecord(value) {
			return typeof value === "object" && value !== null && !Array.isArray(value);
		}
		/**
		* Read one mark line back out of the node's JSON.
		* @param value - one entry of `data.marks`.
		* @returns the line, or undefined when it is not one.
		*/
		function readMark(value) {
			if (!isRecord(value)) return void 0;
			const { label, comment, missing, page } = value;
			if (typeof label !== "string" || typeof comment !== "string") return void 0;
			return {
				label,
				comment,
				missing: missing === true,
				page: typeof page === "number" ? page : void 0
			};
		}
		/**
		* Read the annotation out of the node's data.
		*
		* Only the fields the card draws are required. A node that fails this check is not
		* an annotation as far as this version is concerned, and the caller shows the text.
		* @param data - the node's `data`.
		* @returns the parsed block, or undefined.
		*/
		function readAnnotation(data) {
			if (!isRecord(data)) return void 0;
			const { file, scope, marks, target, instruction, html, pageCapture } = data;
			if (typeof file !== "string" || file === "" || typeof scope !== "string") return void 0;
			if (!Array.isArray(marks)) return void 0;
			const parsed = [];
			for (const entry of marks) {
				const mark = readMark(entry);
				if (mark === void 0) return void 0;
				parsed.push(mark);
			}
			return {
				file,
				scope,
				marks: parsed,
				target: typeof target === "string" ? target : "",
				instruction: typeof instruction === "string" ? instruction : "",
				html: html === true,
				pageCapture: pageCapture === "omitted" || pageCapture === "attached" || pageCapture === "failed" ? pageCapture : "none"
			};
		}
		/** The glyph a card shows when it has no picture of the figure. */
		function SheetIcon() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				className: "da-card-glyph",
				viewBox: "0 0 24 24",
				"aria-hidden": "true",
				focusable: "false",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					d: "M4 5.5h16M4 18.5h16M7 9.5h5M7 13.5h8",
					fill: "none",
					stroke: "currentColor",
					strokeWidth: "1.6",
					strokeLinecap: "round"
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
					cx: "17.5",
					cy: "9.5",
					r: "2.2",
					fill: "none",
					stroke: "currentColor",
					strokeWidth: "1.6"
				})]
			});
		}
		/**
		* One row of the card: the mark's own name, and what it asked for.
		*
		* A mark on a paged document names its page before its name, the way the message
		* does; the page is a property of the mark, so it is read off the parsed line rather
		* than left inside the name.
		* @param props - the row.
		* @returns the row.
		*/
		function CardRow(props) {
			const { mark, ordinal, page, expanded } = props;
			const said = mark.comment === "" ? void 0 : mark.comment;
			const parts = readCardMarkLabel(mark.label);
			const number = /\d+$/u.exec(parts.name)?.[0] ?? String(ordinal);
			const kind = parts.name.replace(/\s*\d+$/u, "");
			const label = parts.element === "" ? kind : parts.element;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
				className: "da-card-row",
				title: mark.label,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: "da-card-row-head",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "da-card-kind",
								"aria-hidden": "true",
								children: number
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: "da-card-mark",
								children: [
									page === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "da-card-page",
										children: page
									}),
									parts.tag === "" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "da-card-tag",
										children: parts.tag
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "da-card-name",
										children: label
									})
								]
							}),
							parts.geometry === "" || parts.tag !== "" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "da-card-geometry",
								children: parts.geometry
							})
						]
					}),
					said === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "da-card-said",
						children: said
					}),
					expanded ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "da-card-locator",
						children: mark.label
					}) : null,
					parts.aside === "" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "da-card-warning",
						children: parts.aside
					})
				]
			});
		}
		/**
		* Render one annotation block as a card.
		* @param props - the slot's props for this block.
		* @returns the card, or the block's own text when its data is not one it can draw.
		*/
		function AnnotationCard(props) {
			(0, react.useEffect)(() => {
				ensureStyles(document);
			}, []);
			const data = readAnnotation(props.node?.data);
			const raw = props.raw ?? "";
			if (data === void 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: "da-card-fallback",
				children: raw
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ReviewCard, {
				...props,
				data,
				raw
			}, raw || JSON.stringify(data));
		}
		/** The review snapshot; navigation to the current source is a separate action. */
		function ReviewCard(props) {
			const { data, raw, embedded = false } = props;
			const [failedThumb, setFailedThumb] = (0, react.useState)();
			const [expanded, setExpanded] = (0, react.useState)(embedded);
			const [trouble, setTrouble] = (0, react.useState)(false);
			const bodyId = (0, react.useId)();
			const interactive = props.interactive !== false;
			const open = props.open;
			const candidate = thumbFor(raw);
			const thumb = candidate === failedThumb ? void 0 : candidate;
			const shown = embedded || expanded ? data.marks : data.marks.slice(0, MAX_ROWS);
			const rest = data.marks.length - shown.length;
			const subject = annotationSubject(data);
			const liveFile = subject.live;
			const captureNotice = liveFile && thumb === void 0 ? data.pageCapture === "omitted" ? resolveTranslate(props, "cardCaptureOmitted") : data.pageCapture === "failed" ? resolveTranslate(props, "cardCaptureFailed") : "" : "";
			const sourceOpener = interactive && (props.canOpen?.(data.file, data.html) ?? true) ? open : void 0;
			const dimensions = /(\d+)\s*[×x]\s*(\d+)/u.exec(data.scope);
			const size = dimensions === null ? "" : `${dimensions[1]}×${dimensions[2]}`;
			const pages = /^(?:共 (\d+) 页|(\d+) pages)(?:，|,|$)/u.exec(data.scope);
			const scope = pages === null ? size : resolveTranslate(props, "cardPages", { n: Number(pages[1] ?? pages[2]) });
			const headContent = /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
					className: "da-card-shot",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SheetIcon, {}), thumb === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
						alt: "",
						src: thumb,
						onError: () => {
							setFailedThumb(thumb);
						}
					})]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
					className: "da-card-text",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: "da-card-title-row",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "da-card-title",
								title: data.file,
								children: subject.name
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "da-card-type",
								children: subject.badge
							}),
							captureNotice === "" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "da-card-capture",
								children: captureNotice
							})
						]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: "da-card-scope",
						children: [scope === "" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "da-card-meta",
							title: data.scope,
							children: scope
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "da-card-tally",
							"aria-label": resolveTranslate(props, "cardCount", { n: data.marks.length }),
							title: data.scope,
							children: data.marks.length
						})]
					})]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: "da-card-go",
					"aria-hidden": "true",
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
						viewBox: "0 0 16 16",
						focusable: "false",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "m6 3.5 4.5 4.5L6 12.5" })
					})
				})
			] });
			const head = /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				className: "da-card-head",
				"aria-expanded": expanded,
				"aria-controls": bodyId,
				title: resolveTranslate(props, expanded ? "cardCollapse" : "cardExpand"),
				onClick: () => {
					setExpanded((value) => !value);
				},
				children: headContent
			});
			const body = /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
				className: "da-card-body",
				id: bodyId,
				children: [
					shown.map((mark, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(CardRow, {
						mark,
						ordinal: index + 1,
						expanded,
						page: mark.page === void 0 ? void 0 : resolveTranslate(props, "cardPage", { n: mark.page })
					}, `${String(mark.page ?? "")}-${String(index)}`)),
					rest > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "da-card-rest",
						children: resolveTranslate(props, "cardMore", { n: rest })
					}) : null,
					data.target === "" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: "da-card-row da-card-target",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "da-card-goal",
							children: resolveTranslate(props, "cardGoal")
						}), data.target]
					})
				]
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
				className: "da-card",
				"data-expanded": expanded,
				children: [
					embedded ? null : head,
					body,
					embedded ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: "da-card-actions",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "da-card-toggle",
							"aria-expanded": expanded,
							"aria-controls": bodyId,
							onClick: () => {
								setExpanded((value) => !value);
							},
							children: resolveTranslate(props, expanded ? "cardCollapse" : "cardExpand")
						}), sourceOpener === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "da-card-source",
							title: data.file,
							onClick: () => {
								setTrouble(sourceOpener(data.file, data.html) === false);
							},
							children: resolveTranslate(props, liveFile ? "cardOpenLive" : "cardOpen")
						})]
					}),
					trouble ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "da-card-error",
						role: "status",
						children: resolveTranslate(props, "cardOpenFailed")
					}) : null
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
				send: async (input, saved, pageImages) => {
					const sessions = options.sessions;
					if (sessions === void 0) throw new Error("the sessions service is unavailable");
					const document = buildPagedDocument(input);
					const images = await renderPageImages(document, pageImages);
					return await deliverAnnotation({
						sessions,
						sessionId: options.sessionId,
						document,
						paths: saved,
						pageImages: images,
						thumb: await captureThumb(images[0]?.image),
						locale: options.locale
					});
				},
				discard: async (address) => {
					await deleteAnnotation(address);
				},
				compose: async (input, saved, pageImages) => {
					const conversation = options.conversation;
					if (conversation === void 0) throw new Error("the conversation service is unavailable");
					const document = buildPagedDocument(input);
					const images = await renderPageImages(document, pageImages);
					const thumb = await captureThumb(images[0]?.image);
					const sessions = options.sessions;
					parkInComposer({
						conversation,
						sessionId: options.sessionId,
						document,
						paths: saved,
						thumb,
						file: void 0,
						files: images.slice(0, 8).map(({ page, image }) => new File([image], `${baseNameOf(document.figure.path)}${pageFileSuffix(page)}.annotated.png`, { type: "image/png" })),
						pageImages: Math.min(images.length, 8),
						locale: options.locale,
						send: async () => {
							if (sessions === void 0) throw new Error("the sessions service is unavailable");
							return await deliverAnnotation({
								sessions,
								sessionId: options.sessionId,
								document,
								paths: saved,
								pageImages: images,
								thumb,
								locale: options.locale
							});
						}
					});
				}
			};
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
			const toasts = useToasts(t);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react.Suspense, {
				fallback: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: "da-hint",
					children: t("pdfRendering")
				}),
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(LoadedPdfBody, {
					...props,
					t,
					toasts,
					ToastStack
				})
			});
		}
		//#endregion
		//#region src/client/html-preview.tsx
		/**
		* A read-only preview for a static HTML file.
		*
		* Static files do not enter the annotator. They still need a readable inline
		* preview, though, and the shell has no HTML renderer of its own. The document is
		* written into an opaque sandbox so a self-contained deck's inline scripts can run
		* without gaining access to the panel. Its CSP rejects external resources, fetches,
		* forms and nested frames; script navigation remains confined to the opaque frame.
		* @module dsh-figmark/client/html-preview
		*/
		/**
		* Render one static HTML file without annotation chrome.
		* @param props - the document owner's bytes, locale, and no annotation seat.
		* @returns a full-pane sandboxed preview.
		*/
		function HtmlPreviewBody(props) {
			const t = (key) => resolveTranslate(props, key);
			(0, react.useEffect)(() => {
				ensureStyles(document);
			}, []);
			const source = (0, react.useMemo)(() => {
				const bytes = props.content?.kind === "bytes" ? props.content.data : void 0;
				return bytes === void 0 ? void 0 : buildPreviewDocument(new TextDecoder().decode(bytes));
			}, [props.content]);
			if (source === void 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "da-html-preview-empty",
				role: "alert",
				children: t("loadFailed")
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "da-root da-html-preview",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("iframe", {
					className: "da-html-preview-frame",
					title: t("htmlTitle"),
					srcDoc: source,
					sandbox: "allow-scripts allow-presentation",
					referrerPolicy: "no-referrer"
				})
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
		//#region src/client/composer-seat.ts
		/**
		* The seat the parked card is drawn in, inside the composer card.
		*
		* The conversation package owns the composer: its card is a flex column whose children
		* are the overlay anchor, the attachment rail, the editor and the button row. A dock
		* entry (what the slot catalogue offers) is drawn *above* that card, as a full-width
		* band in the composer stack — which is not where the reader expects the thing they are
		* about to send to be. Attachments live inside the box, so the card goes there too.
		*
		* There is no slot inside the card that a third party may fill: the one in-card seat,
		* `conversation.input.attachments`, is a `single` slot held by the shipped rail, and
		* taking it would take the reader's own image and file previews with it. So the card is
		* drawn from the dock entry that we do own, portalled into a node of our own that sits
		* in the card's own flow — first child, above the rail and the editor, at the rail's
		* horizontal inset. Nothing of the host's DOM is written to, and no host contract
		* changes: this is presentation only.
		*
		* @module dsh-figmark/client/composer-seat
		*/
		/** Attribute the composer card carries, from the conversation package. */
		const CARD = "[data-composer-card]";
		/** The region that holds a composer: the stack, the dock and the card are all inside it. */
		const REGION = "[data-conversation-region=\"composer\"]";
		/** The seat's class, so the stylesheet can inset it like the attachment rail. */
		const SEAT_CLASS = "da-staged-seat";
		/**
		* The composer card that belongs to the same composer as this element.
		* @param anchor - a node inside the dock, next to the card but not inside it.
		* @returns the card, or null when this composer has not drawn one.
		*/
		function composerCard(anchor) {
			let scope = anchor.parentElement;
			while (scope !== null) {
				const card = scope.querySelector(CARD);
				if (card !== null) return card;
				scope = scope.parentElement;
			}
			return null;
		}
		/**
		* Draw into the composer card, and keep doing so across its re-renders.
		*
		* The card is React's node, so the seat is a foreign first child: a re-render that
		* replaces the card detaches it, and the observer puts it back in the new one. When no
		* card can be found at all, `onChange` is told so and the caller falls back to drawing
		* in the dock it owns.
		* @param anchor - a node inside the dock, used to find the card.
		* @param onChange - told the seat to draw into, or null when there is none.
		* @returns the function that takes the seat down.
		*/
		function mountSeat(anchor, onChange) {
			const seat = document.createElement("div");
			seat.className = SEAT_CLASS;
			const place = () => {
				const card = composerCard(anchor);
				if (card === null) {
					onChange(null);
					return;
				}
				if (card.firstElementChild !== seat) card.prepend(seat);
				onChange(seat);
			};
			place();
			const region = anchor.closest(REGION) ?? anchor.parentElement;
			const observer = new MutationObserver(place);
			if (region !== null) observer.observe(region, {
				childList: true,
				subtree: true
			});
			return () => {
				observer.disconnect();
				seat.remove();
				onChange(null);
			};
		}
		//#endregion
		//#region src/client/pending-card.tsx
		/**
		* Reviews staged beside the composer. The chip previews its immutable payload;
		* the native composer Send carries armed reviews, with or without typed text.
		* Older hosts without draft admission retain a direct-delivery fallback.
		* @module dsh-figmark/client/pending-card
		*/
		/**
		* The message one thrown value carries.
		* @param error - whatever was thrown.
		* @returns the text to show under the card.
		*/
		function reasonOf(error) {
			return error instanceof Error ? error.message : String(error);
		}
		/**
		* The picture a card shows when it has no thumbnail of the figure.
		* @returns the glyph.
		*/
		function FigureIcon() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				className: "da-staged-glyph",
				viewBox: "0 0 24 24",
				"aria-hidden": "true",
				focusable: "false",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					d: "M4 5.5h16M4 18.5h16M7 9.5h5M7 13.5h8",
					fill: "none",
					stroke: "currentColor",
					strokeWidth: "1.6",
					strokeLinecap: "round"
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
					cx: "17.5",
					cy: "9.5",
					r: "2.2",
					fill: "none",
					stroke: "currentColor",
					strokeWidth: "1.6"
				})]
			});
		}
		/**
		* A mark's name without its coordinates: the kind and its number, which is what a
		* reader recognises, with a space between the two the way the product writes it.
		* @param label - the mark's own name, coordinates and all.
		* @returns the short name.
		*/
		function shortLabel(label) {
			return label.replace(/\s*(?:位于\s*|[（(]).*$/u, "").trim().replace(/^(\D*?)(\d+)$/u, "$1 $2").replace(/\s+/gu, " ").trim();
		}
		/**
		* One parked card: its own delivery, its own failure, its own way out.
		* @param props - the card, the session it belongs to, and the shell's translator.
		* @returns the chip, with its one action and its remove control.
		*/
		function ParkedChip(props) {
			const { entry, sessionId } = props;
			const [busy, setBusy] = (0, react.useState)(false);
			const [trouble, setTrouble] = (0, react.useState)("");
			const [shot, setShot] = (0, react.useState)(true);
			const [expanded, setExpanded] = (0, react.useState)(false);
			const detailId = (0, react.useId)();
			const sending = (0, react.useRef)(false);
			const armed = entry.armed;
			const data = entry.data;
			const thumb = shot ? thumbFor(entry.raw) : void 0;
			const send = async () => {
				if (sending.current) return;
				setTrouble("");
				sending.current = true;
				setBusy(true);
				try {
					const warnings = await entry.send();
					if (warnings.length > 0) props.onWarnings(warnings);
					unparkAnnotation(sessionId, entry.id);
				} catch (error) {
					setTrouble(`${resolveTranslate(props, "pendingFailed")}${reasonOf(error)}`);
				} finally {
					sending.current = false;
					setBusy(false);
				}
			};
			(0, react.useEffect)(() => {
				if (armed === void 0) return void 0;
				return holdSubmit(armed, () => {
					unparkAnnotation(sessionId, entry.id);
				});
			}, [
				armed,
				entry.id,
				sessionId
			]);
			const subject = annotationSubject(data);
			const name = subject.name;
			const first = data.marks[0];
			const captureNotice = subject.live && thumb === void 0 ? data.pageCapture === "omitted" ? resolveTranslate(props, "cardCaptureOmitted") : data.pageCapture === "failed" ? resolveTranslate(props, "cardCaptureFailed") : "" : "";
			const detail = first === void 0 ? name : first.comment === "" ? first.label : `${first.label} · ${first.comment}`;
			const hover = data.scope === "" ? data.file : `${data.file} · ${data.scope}`;
			const removeLabel = resolveTranslate(props, "pendingRemove");
			const hint = resolveTranslate(props, "pendingSendNow");
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
				className: "da-staged",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: "da-staged-card",
						"data-expanded": expanded,
						title: hover,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "da-staged-open",
								"aria-expanded": expanded,
								"aria-controls": detailId,
								title: resolveTranslate(props, expanded ? "cardCollapse" : "cardExpand"),
								onClick: () => {
									setExpanded((value) => !value);
								},
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: "da-staged-shot",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(FigureIcon, {}), thumb === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
											alt: "",
											src: thumb,
											onError: () => {
												setShot(false);
											}
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: "da-staged-text",
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
												className: "da-staged-head",
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: "da-staged-title",
														title: name,
														children: name
													}),
													captureNotice === "" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: "da-staged-capture",
														children: captureNotice
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: "da-staged-count",
														"aria-label": resolveTranslate(props, "cardCount", { n: data.marks.length }),
														children: resolveTranslate(props, "pendingCount", { n: data.marks.length })
													})
												]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: "da-staged-type",
												children: subject.badge
											}),
											first === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
												className: "da-staged-line",
												title: detail,
												children: [
													first.page === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: "da-card-page",
														children: resolveTranslate(props, "cardPage", { n: first.page })
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: "da-staged-shape",
														children: shortLabel(first.label)
													}),
													first.comment === "" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: "da-staged-said",
														children: first.comment
													})
												]
											})
										]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "da-staged-chevron",
										"aria-hidden": "true",
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
											viewBox: "0 0 16 16",
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "m6 3.5 4.5 4.5L6 12.5" })
										})
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "da-staged-x",
								"aria-label": removeLabel,
								title: removeLabel,
								disabled: busy,
								onClick: () => {
									if (sending.current) return;
									if (armed !== void 0) disarmReview(armed, entry.conversation);
									unparkAnnotation(sessionId, entry.id);
								},
								children: "×"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								id: detailId,
								className: "da-staged-details",
								hidden: !expanded,
								children: expanded ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(AnnotationCard, {
									node: { data },
									raw: entry.raw,
									interactive: false,
									embedded: true,
									t: props.t,
									localeId: props.localeId
								}) : null
							})
						]
					}),
					armed === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "da-staged-send",
						disabled: busy,
						title: hint,
						onClick: () => {
							send();
						},
						children: resolveTranslate(props, busy ? "pendingSending" : "pendingSendNow")
					}) : null,
					trouble === "" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "da-staged-trouble",
						role: "alert",
						children: trouble
					})
				]
			});
		}
		/**
		* Draw the session's parked annotations, oldest first, or nothing when it has none.
		*
		* One seat for the whole queue: the composer card owns one attachment area, and the
		* chips stack inside it the way several attached pictures do.
		* @param props - the dock's props for this session.
		* @returns the attachment cards, each with its own action and remove control.
		*/
		function PendingCard(props) {
			const sessionId = props.sessionId ?? "";
			const [entries, setEntries] = (0, react.useState)(() => parkedAnnotations(sessionId));
			/** Delivery warnings stay after their card leaves, because the message already went. */
			const [warnings, setWarnings] = (0, react.useState)([]);
			(0, react.useEffect)(() => {
				ensureStyles(document);
			}, []);
			(0, react.useEffect)(() => {
				setWarnings([]);
				setEntries(parkedAnnotations(sessionId));
				return watchParked(sessionId, () => {
					setEntries(parkedAnnotations(sessionId));
				});
			}, [sessionId]);
			const anchor = (0, react.useRef)(null);
			const [seat, setSeat] = (0, react.useState)(null);
			const showing = entries.length > 0 || warnings.length > 0;
			(0, react.useLayoutEffect)(() => {
				const node = anchor.current;
				if (node === null) return void 0;
				return mountSeat(node, setSeat);
			}, [sessionId, showing]);
			if (!showing) return null;
			const owned = entries.flatMap((entry) => entry.armed?.previewUrls ?? []).map((url) => `img[src=${JSON.stringify(url)}]`).join(",");
			const thumbnailStyle = owned === "" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", { children: `
    [data-composer-card] [role="group"] > div:has(${owned}){display:none}
    [data-composer-card] > div:has(> div > [role="group"]):not(:has([role="group"] > div:not(:has(${owned})))){display:none}
  ` });
			const cards = /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: entries.map((entry) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ParkedChip, {
				entry,
				sessionId,
				t: props.t,
				localeId: props.localeId,
				onWarnings: (each) => {
					setWarnings((current) => [...current, ...each.filter((warning) => !current.includes(warning))]);
				}
			}, entry.id)) });
			const report = warnings.length === 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
				className: "da-staged-result",
				role: "status",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: "da-staged-result-text",
					children: warnings.join(" ")
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: "da-staged-result-x",
					"aria-label": resolveTranslate(props, "close"),
					title: resolveTranslate(props, "close"),
					onClick: () => {
						setWarnings([]);
					},
					children: "×"
				})]
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: "da-staged-anchor",
					ref: anchor,
					hidden: true
				}),
				thumbnailStyle,
				seat === null ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [cards, report] }) : (0, react_dom.createPortal)(/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [cards, report] }), seat)
			] });
		}
		//#endregion
		//#region src/client/live-drafts.ts
		/**
		* Browser-local drafts for annotations on live service pages.
		*
		* A live page has no sidecar: its marks belong to a running page rather than a file.
		* Keeping the unpublished draft in this browser makes that difference explicit while
		* still surviving a sidebar remount. Nothing here becomes a file or an attachment;
		* delivery remains the only product of a live-page annotation.
		* @module dsh-figmark/client/live-drafts
		*/
		/** Prefix of the per-session storage record. */
		const LIVE_DRAFT_KEY_PREFIX = "dsh-figmark.services.live-drafts.v1:";
		/** Most pages one browser session remembers. */
		const MAX_DRAFTS = 12;
		/** Largest serialized record read or written, so a corrupt draft cannot freeze the picker. */
		const MAX_STORED_CHARS = 1e6;
		/** Most marks one live-page draft may restore. */
		const MAX_MARKS = 256;
		/** Most points one mark may carry. */
		const MAX_POINTS = 4096;
		/** Longest selector or ownership surface one mark may carry. */
		const MAX_SELECTOR_CHARS = 400;
		/** Longest human-facing anchor field. */
		const MAX_ANCHOR_TEXT_CHARS = 400;
		/** Read a bounded string. */
		function textOf(value, max) {
			return typeof value === "string" && value.length <= max ? value : void 0;
		}
		/** Read a finite point. */
		function pointOf(value) {
			if (!Array.isArray(value) || value.length !== 2) return void 0;
			const [x, y] = value;
			return typeof x === "number" && Number.isFinite(x) && typeof y === "number" && Number.isFinite(y) ? [x, y] : void 0;
		}
		/** Read a finite box. */
		function boxOf(value) {
			if (!Array.isArray(value) || value.length !== 4) return void 0;
			const values = value;
			return values.every((entry) => typeof entry === "number" && Number.isFinite(entry)) ? [
				values[0],
				values[1],
				values[2],
				values[3]
			] : void 0;
		}
		/** Read one element anchor. */
		function anchorOf(value) {
			if (value === void 0) return void 0;
			if (typeof value !== "object" || value === null) return void 0;
			const raw = value;
			const tag = textOf(raw["tag"], MAX_ANCHOR_TEXT_CHARS);
			const bbox = boxOf(raw["bbox"]);
			if (tag === void 0 || bbox === void 0) return void 0;
			const id = textOf(raw["id"], MAX_ANCHOR_TEXT_CHARS);
			const cls = textOf(raw["class"], MAX_ANCHOR_TEXT_CHARS);
			const title = textOf(raw["title"], MAX_ANCHOR_TEXT_CHARS);
			const text = textOf(raw["text"], MAX_ANCHOR_TEXT_CHARS);
			const selector = textOf(raw["selector"], MAX_SELECTOR_CHARS);
			if (raw["id"] !== void 0 && id === void 0 || raw["class"] !== void 0 && cls === void 0 || raw["title"] !== void 0 && title === void 0 || raw["text"] !== void 0 && text === void 0 || raw["selector"] !== void 0 && selector === void 0) return void 0;
			return {
				tag,
				bbox,
				...id === void 0 ? {} : { id },
				...cls === void 0 ? {} : { class: cls },
				...title === void 0 ? {} : { title },
				...text === void 0 ? {} : { text },
				...selector === void 0 ? {} : { selector }
			};
		}
		/** Read one mark, refusing a partially valid record rather than filling its gaps. */
		function markOf(value) {
			if (typeof value !== "object" || value === null) return void 0;
			const raw = value;
			const id = textOf(raw["id"], MAX_ANCHOR_TEXT_CHARS);
			const kind = raw["kind"];
			const color = textOf(raw["color"], 64);
			const pointValues = raw["points"];
			const detail = raw["detail"] === void 0 ? void 0 : textOf(raw["detail"], MAX_DETAIL_CHARS);
			const page = raw["page"];
			const surface = raw["surface"] === void 0 ? void 0 : textOf(raw["surface"], MAX_SELECTOR_CHARS);
			const rotation = raw["rotation"];
			const weight = raw["weight"];
			const anchor = anchorOf(raw["anchor"]);
			if (id === void 0 || id === "" || typeof kind !== "string" || !MARK_KIND_ORDER.includes(kind) || color === void 0 || !Array.isArray(pointValues) || pointValues.length === 0 || pointValues.length > MAX_POINTS || raw["detail"] !== void 0 && detail === void 0 || page !== void 0 && (typeof page !== "number" || !Number.isInteger(page) || page < 1) || raw["surface"] !== void 0 && surface === void 0 || rotation !== void 0 && (typeof rotation !== "number" || !Number.isFinite(rotation)) || weight !== void 0 && !isWeight(weight) || raw["anchor"] !== void 0 && anchor === void 0) return void 0;
			const points = [];
			for (const value of pointValues) {
				const point = pointOf(value);
				if (point === void 0) return void 0;
				points.push(point);
			}
			return {
				id,
				kind,
				color,
				points,
				...detail === void 0 ? {} : { detail },
				...page === void 0 ? {} : { page },
				...surface === void 0 ? {} : { surface },
				...rotation === void 0 ? {} : { rotation },
				...weight === void 0 ? {} : { weight },
				...anchor === void 0 ? {} : { anchor }
			};
		}
		/** Read one stored entry. */
		function draftOf(marksValue, summaryValue, updatedValue) {
			const summary = textOf(summaryValue, MAX_SUMMARY_CHARS);
			const updatedAt = typeof updatedValue === "number" && Number.isFinite(updatedValue) && updatedValue >= 0 ? updatedValue : void 0;
			if (!Array.isArray(marksValue) || marksValue.length > MAX_MARKS || summary === void 0 || updatedAt === void 0) return;
			const marks = [];
			for (const value of marksValue) {
				const mark = markOf(value);
				if (mark === void 0) return void 0;
				marks.push(mark);
			}
			return {
				marks,
				summary,
				updatedAt
			};
		}
		/** The localStorage key one session owns. */
		function storageKey(sessionId) {
			return `${LIVE_DRAFT_KEY_PREFIX}${encodeURIComponent(sessionId)}`;
		}
		/** Read and validate every remembered draft for one session. */
		function readAll(sessionId) {
			const drafts = /* @__PURE__ */ new Map();
			try {
				const raw = localStorage.getItem(storageKey(sessionId));
				if (raw === null || raw.length > MAX_STORED_CHARS) return drafts;
				const stored = JSON.parse(raw);
				if (typeof stored !== "object" || stored === null) return drafts;
				const record = stored;
				if (record["version"] !== 1 || !Array.isArray(record["entries"])) return drafts;
				for (const value of record["entries"].slice(0, MAX_DRAFTS * 2)) {
					if (!Array.isArray(value) || value.length !== 4) continue;
					const address = textOf(value[0], 2048);
					if (address === void 0 || loopbackAddressOf(address) !== address) continue;
					const draft = draftOf(value[1], value[2], value[3]);
					if (draft !== void 0) drafts.set(address, draft);
				}
			} catch {
				return /* @__PURE__ */ new Map();
			}
			return new Map([...drafts].sort((left, right) => left[1].updatedAt - right[1].updatedAt).slice(-12));
		}
		/** Persist the whole bounded record, dropping the oldest entries if storage is tight. */
		function writeAll(sessionId, drafts) {
			const entries = [...drafts].sort((left, right) => left[1].updatedAt - right[1].updatedAt).slice(-12).map(([address, draft]) => [
				address,
				draft.marks,
				draft.summary,
				draft.updatedAt
			]);
			while (entries.length > 0) {
				const raw = JSON.stringify({
					version: 1,
					entries
				});
				if (raw.length <= MAX_STORED_CHARS) {
					try {
						localStorage.setItem(storageKey(sessionId), raw);
					} catch {}
					return;
				}
				entries.shift();
			}
			try {
				localStorage.removeItem(storageKey(sessionId));
			} catch {}
		}
		/** Read the draft for one live address. */
		function readLiveDraft(sessionId, address) {
			return readAll(sessionId).get(address);
		}
		/** Remember one live address's marks and page note. */
		function writeLiveDraft(sessionId, address, marks, summary) {
			if (loopbackAddressOf(address) !== address) return;
			const drafts = readAll(sessionId);
			if (marks.length === 0 && summary === "") drafts.delete(address);
			else drafts.set(address, {
				marks,
				summary,
				updatedAt: Date.now()
			});
			writeAll(sessionId, drafts);
		}
		//#endregion
		//#region src/client/ServiceBrowser.tsx
		/**
		* The right-sidebar doorway to local HTTP pages.
		*
		* Static HTML has its own read-only preview. Annotation begins only after the reader
		* picks a service that is already being served on loopback, so this screen is
		* deliberately small: search an address, scan the bounded local candidates, then hand
		* the chosen page to the same AnnotatorBody used by every other surface.
		* @module dsh-figmark/client/ServiceBrowser
		*/
		/** Where recent loopback addresses are remembered. */
		const RECENT_KEY = "dsh-figmark.services.recent.v1";
		/** A keystroke should feel local; storage is flushed once the reader pauses. */
		const LIVE_DRAFT_FLUSH_MS = 250;
		/** A draft exists even before a page has been opened, so active edits need no fallback. */
		const EMPTY_LIVE_DRAFT = {
			marks: [],
			summary: "",
			updatedAt: 0
		};
		/** Text shapes a reader uses for an address rather than a title search. */
		const ADDRESS_SHAPES = [
			/^[a-z][a-z0-9+.-]*:\/\//iu,
			/^localhost(?::\d+)?(?:[/?#]|$)/iu,
			/^127(?:\.\d{1,3}){3}(?::\d+)?(?:[/?#]|$)/u,
			/^\[[0-9a-f:]+\](?::\d+)?(?:[/?#]|$)/iu,
			/^[^\s/?#]+\.(?:[a-z0-9-]+\.)*[a-z0-9-]{2,}(?::\d+)?(?:[/?#]|$)/iu,
			/^[^\s/?#]+:\d+(?:[/?#]|$)/u
		];
		/** The short name a session tab prints. */
		function sessionName(workspace) {
			if (workspace.title !== void 0 && workspace.title !== "") return workspace.title;
			const path = pathOf(workspace.address);
			return path === "/" ? endpointOf(workspace.address) : path;
		}
		/**
		* Read the live address a navigation request carries.
		* @param params - the tab body's opaque navigation parameters.
		* @returns the address, when this request names one.
		*/
		function seededAddress(params) {
			if (typeof params !== "object" || params === null) return void 0;
			const url = params["url"];
			return typeof url === "string" && loopbackAddressOf(url) !== void 0 ? url : void 0;
		}
		/** The one mounted live annotator, given stable owner callbacks. */
		function ActiveLiveBody(props) {
			const { id: workspaceId } = props.workspace;
			const { address } = props.page;
			const { onDraft, onSummary } = props;
			const onDraftChange = (0, react.useCallback)((draft) => {
				onDraft(workspaceId, address, draft);
			}, [
				address,
				onDraft,
				workspaceId
			]);
			const onSummaryChange = (0, react.useCallback)((summary) => {
				onSummary(workspaceId, address, summary);
			}, [
				address,
				onSummary,
				workspaceId
			]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "da-service-live",
				hidden: props.hidden,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(AnnotatorBody, {
					livePage: props.page,
					sessionId: props.sessionId,
					localeId: props.localeId,
					sessions: props.sessions,
					conversation: props.conversation,
					remote: props.remote,
					draft: props.draft,
					summary: props.summary,
					onDraftChange,
					onSummaryChange,
					refreshToken: props.refreshToken
				}, workspaceId)
			});
		}
		/** Read remembered addresses without letting storage break the page. */
		function readRecent() {
			try {
				const raw = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
				return Array.isArray(raw) ? raw.filter((value) => typeof value === "string").slice(0, 8) : [];
			} catch {
				return [];
			}
		}
		/** Remember one address, newest first and capped. */
		function remember(address) {
			const next = [address, ...readRecent().filter((value) => value !== address)].slice(0, 8);
			try {
				localStorage.setItem(RECENT_KEY, JSON.stringify(next));
			} catch {}
			return next;
		}
		/** The host and port shown as the row's compact identity. */
		function endpointOf(address) {
			try {
				const url = new URL(address);
				return `${url.hostname}${url.port === "" ? "" : `:${url.port}`}`;
			} catch {
				return address;
			}
		}
		/** The path under the endpoint, with `/` for the root page. */
		function pathOf(address) {
			try {
				const url = new URL(address);
				return `${url.pathname}${url.search}`;
			} catch {
				return "/";
			}
		}
		/**
		* Whether the search text is meant as an address rather than a title.
		*
		* This deliberately runs before the row fallback. Otherwise malformed input such
		* as `http://` shares a substring with every discovered URL and opens an unrelated
		* service instead of reporting the bad address.
		* @param input - the search field's text.
		* @returns true when the input has an address-shaped beginning.
		*/
		function looksLikeAddress(input) {
			const text = input.trim();
			return ADDRESS_SHAPES.some((shape) => shape.test(text));
		}
		/**
		* Service discovery and the live annotator it opens.
		* @param props - session, locale and the delivery faces shared by every body.
		* @returns the service picker, or the annotated live page.
		*/
		function ServiceBrowser(props) {
			const { useTabInfo, ...rest } = props;
			if (useTabInfo === void 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ServiceBrowserBody, { ...rest });
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(NavigatedServiceBrowser, {
				...rest,
				useTabInfo
			});
		}
		/** Read the shell hook from one component that is mounted only when it exists. */
		function NavigatedServiceBrowser(props) {
			const navigation = props.useTabInfo().tab.navigation;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ServiceBrowserBody, {
				...props,
				navigation
			});
		}
		/** The browser body, with the shell's navigation request separated from its hook. */
		function ServiceBrowserBody(props) {
			const navigation = props.navigation;
			const t = (0, react.useCallback)((key) => fallbackTranslate(props.localeId, key), [props.localeId]);
			const [services, setServices] = (0, react.useState)([]);
			const [query, setQuery] = (0, react.useState)("");
			const [scanning, setScanning] = (0, react.useState)(false);
			const [opening, setOpening] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)(null);
			const [workspaces, setWorkspaces] = (0, react.useState)([]);
			const [activeWorkspaceId, setActiveWorkspaceId] = (0, react.useState)(null);
			const [runtime, setRuntime] = (0, react.useState)(null);
			const [showingList, setShowingList] = (0, react.useState)(true);
			const [refreshToken, setRefreshToken] = (0, react.useState)(0);
			const [liveDraft, setLiveDraft] = (0, react.useState)(EMPTY_LIVE_DRAFT);
			const scanGeneration = (0, react.useRef)(0);
			const openGeneration = (0, react.useRef)(0);
			const openingRef = (0, react.useRef)(false);
			/** Tab ids are local to this mounted service browser and never derive from a URL. */
			const workspaceGeneration = (0, react.useRef)(0);
			/** The newest known value of each open tab's draft, including edits already typed. */
			const draftSnapshots = (0, react.useRef)(/* @__PURE__ */ new Map());
			/** The active body's draft, updated synchronously before React schedules its render. */
			const activeDraft = (0, react.useRef)(EMPTY_LIVE_DRAFT);
			/** One debounced storage write per address. */
			const draftTimers = (0, react.useRef)(/* @__PURE__ */ new Map());
			/** The last navigation request this body has already seen. */
			const openedNavigation = (0, react.useRef)(null);
			/** A valid request parked while another page is opening. */
			const pendingNavigation = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				ensureStyles(document);
			}, []);
			(0, react.useEffect)(() => () => {
				scanGeneration.current += 1;
				openGeneration.current += 1;
			}, []);
			const flushDraft = (0, react.useCallback)((address) => {
				const timer = draftTimers.current.get(address);
				if (timer !== void 0) clearTimeout(timer);
				draftTimers.current.delete(address);
				const draft = draftSnapshots.current.get(address);
				if (draft !== void 0) writeLiveDraft(props.sessionId, address, draft.marks, draft.summary);
			}, [props.sessionId]);
			const flushAllDrafts = (0, react.useCallback)(() => {
				for (const address of draftSnapshots.current.keys()) flushDraft(address);
			}, [flushDraft]);
			(0, react.useEffect)(() => {
				window.addEventListener("pagehide", flushAllDrafts);
				return () => {
					window.removeEventListener("pagehide", flushAllDrafts);
					flushAllDrafts();
				};
			}, [flushAllDrafts]);
			(0, react.useEffect)(() => {
				scanGeneration.current += 1;
				openGeneration.current += 1;
				openingRef.current = false;
				setOpening(false);
				setWorkspaces([]);
				setRuntime(null);
				setActiveWorkspaceId(null);
				setShowingList(true);
				setRefreshToken(0);
				openedNavigation.current = null;
				pendingNavigation.current = null;
				activeDraft.current = EMPTY_LIVE_DRAFT;
				setLiveDraft(EMPTY_LIVE_DRAFT);
				for (const timer of draftTimers.current.values()) clearTimeout(timer);
				draftTimers.current.clear();
				draftSnapshots.current.clear();
			}, [props.sessionId]);
			const rememberDraft = (0, react.useCallback)((_workspaceId, address, draft) => {
				const next = {
					marks: draft.marks,
					summary: activeDraft.current.summary,
					updatedAt: Date.now()
				};
				activeDraft.current = next;
				draftSnapshots.current.set(address, next);
				const pending = draftTimers.current.get(address);
				if (pending !== void 0) clearTimeout(pending);
				draftTimers.current.set(address, setTimeout(() => {
					flushDraft(address);
				}, LIVE_DRAFT_FLUSH_MS));
			}, [flushDraft]);
			const rememberSummary = (0, react.useCallback)((_workspaceId, address, summary) => {
				const next = {
					marks: activeDraft.current.marks,
					summary,
					updatedAt: Date.now()
				};
				activeDraft.current = next;
				draftSnapshots.current.set(address, next);
				setLiveDraft(next);
				const pending = draftTimers.current.get(address);
				if (pending !== void 0) clearTimeout(pending);
				draftTimers.current.set(address, setTimeout(() => {
					flushDraft(address);
				}, LIVE_DRAFT_FLUSH_MS));
			}, [flushDraft]);
			const scan = (0, react.useCallback)(async () => {
				const generation = scanGeneration.current + 1;
				scanGeneration.current = generation;
				setScanning(true);
				setError(null);
				try {
					const outcome = await discoverLiveServices(props.sessionId, readRecent()).then((found) => ({ found }), (reason) => ({ reason }));
					if (scanGeneration.current !== generation) return;
					if ("found" in outcome) setServices(outcome.found);
					else setError(outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason));
				} finally {
					if (scanGeneration.current === generation) setScanning(false);
				}
			}, [props.sessionId]);
			(0, react.useEffect)(() => {
				scan();
			}, [scan]);
			const openWorkspace = (0, react.useCallback)(async (text, title, wantedWorkspaceId) => {
				if (openingRef.current) return false;
				const address = loopbackAddressOf(text);
				if (address === void 0) {
					setError(t("serviceBadAddress"));
					return false;
				}
				const known = wantedWorkspaceId === void 0 ? workspaces.find((workspace) => workspace.address === address) : workspaces.find((workspace) => workspace.id === wantedWorkspaceId);
				const generation = openGeneration.current + 1;
				openGeneration.current = generation;
				openingRef.current = true;
				setOpening(true);
				setError(null);
				try {
					const outcome = await openLivePage(address).then((page) => ({ page }), (reason) => ({ reason }));
					if (openGeneration.current !== generation) {
						if ("page" in outcome) await closeLivePage(outcome.page.url).catch(() => {});
						return true;
					}
					if ("page" in outcome) {
						remember(address);
						const remembered = draftSnapshots.current.get(address) ?? readLiveDraft(props.sessionId, address);
						const installed = {
							marks: remembered?.marks ?? [],
							summary: remembered?.summary ?? "",
							updatedAt: remembered?.updatedAt ?? Date.now()
						};
						activeDraft.current = installed;
						draftSnapshots.current.set(address, installed);
						setLiveDraft(installed);
						const workspaceId = known?.id ?? `live-${(workspaceGeneration.current += 1).toString(36)}`;
						setWorkspaces((current) => known !== void 0 ? current.map((workspace) => {
							if (workspace.id !== known.id) return workspace;
							const shownTitle = workspace.title ?? title;
							return {
								...workspace,
								address,
								...shownTitle === void 0 ? {} : { title: shownTitle }
							};
						}) : [...current, {
							id: workspaceId,
							address,
							...title === void 0 ? {} : { title }
						}]);
						setActiveWorkspaceId(workspaceId);
						setRuntime({
							workspaceId,
							page: outcome.page
						});
						setShowingList(false);
					} else setError(outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason));
					return true;
				} finally {
					if (openGeneration.current === generation) {
						openingRef.current = false;
						setOpening(false);
					}
				}
			}, [
				props.sessionId,
				remember,
				t,
				workspaces
			]);
			(0, react.useEffect)(() => {
				if (navigation === void 0) return;
				const key = `${navigation.revision}:${seededAddress(navigation.params) ?? ""}`;
				if (key === openedNavigation.current) return;
				openedNavigation.current = key;
				const address = seededAddress(navigation.params);
				if (address !== void 0) pendingNavigation.current = {
					key,
					address
				};
			}, [navigation]);
			(0, react.useEffect)(() => {
				const pending = pendingNavigation.current;
				if (pending === null) return;
				const known = workspaces.find((workspace) => workspace.address === pending.address);
				if (known !== void 0 && runtime?.workspaceId === known.id && runtime.page.address === pending.address) {
					pendingNavigation.current = null;
					setActiveWorkspaceId(known.id);
					setShowingList(false);
					setError(null);
					return;
				}
				if (opening || openingRef.current) return;
				pendingNavigation.current = null;
				openWorkspace(pending.address);
			}, [
				navigation,
				opening,
				openWorkspace,
				runtime,
				workspaces
			]);
			const backToList = (0, react.useCallback)(() => {
				setShowingList(true);
				scan();
			}, [scan]);
			const closeWorkspace = (0, react.useCallback)((workspace) => {
				flushDraft(workspace.address);
				draftSnapshots.current.delete(workspace.address);
				writeLiveDraft(props.sessionId, workspace.address, [], "");
				const remaining = workspaces.filter((candidate) => candidate.id !== workspace.id);
				setWorkspaces(remaining);
				if (runtime?.workspaceId === workspace.id) setRuntime(null);
				if (activeWorkspaceId === workspace.id) setActiveWorkspaceId(remaining.at(-1)?.id ?? null);
				if (remaining.length === 0) setShowingList(true);
			}, [
				activeWorkspaceId,
				flushDraft,
				props.sessionId,
				runtime,
				workspaces
			]);
			const submit = (event) => {
				event.preventDefault();
				const typed = loopbackAddressOf(query);
				if (typed !== void 0) {
					openWorkspace(typed);
					return;
				}
				const needle = query.trim().toLowerCase();
				if (needle === "") return;
				const titleMatch = visible.some((service) => service.title?.toLowerCase().includes(needle) === true);
				if (looksLikeAddress(query) && !titleMatch) openWorkspace(query);
				else if (visible.length === 1) {
					const only = visible[0];
					openWorkspace(only.url, only.title);
				} else setError(t(visible.length === 0 ? "serviceNoMatch" : "serviceChooseMatch"));
			};
			const visible = (0, react.useMemo)(() => {
				const needle = query.trim().toLowerCase();
				if (needle === "") return services;
				return services.filter((service) => service.url.toLowerCase().includes(needle) || service.title?.toLowerCase().includes(needle) === true);
			}, [query, services]);
			const listVisible = showingList || runtime === null;
			const runtimeWorkspace = runtime === null ? void 0 : workspaces.find((workspace) => workspace.id === runtime.workspaceId);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "da-service-shell",
				children: [
					workspaces.length === 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("nav", {
						className: "da-service-tabs",
						"aria-label": t("serviceTabs"),
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "da-service-list-tab",
								"data-active": listVisible,
								"aria-label": t("serviceListTab"),
								title: t("serviceListTab"),
								onClick: backToList,
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
									viewBox: "0 0 16 16",
									"aria-hidden": "true",
									focusable: "false",
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M5.5 4.5h7M5.5 8h7M5.5 11.5h7M3 4.5h.01M3 8h.01M3 11.5h.01" })
								})
							}),
							runtime === null || listVisible ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "da-service-refresh",
								disabled: opening,
								"aria-label": t("liveRefresh"),
								title: t("liveRefresh"),
								onClick: () => {
									setRefreshToken((token) => token + 1);
								},
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
									viewBox: "0 0 24 24",
									"aria-hidden": "true",
									focusable: "false",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M21 3v5h-5" })]
								})
							}),
							workspaces.map((workspace) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: "da-service-tab",
								"data-active": !listVisible && activeWorkspaceId === workspace.id,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "da-service-tab-open",
									disabled: opening,
									title: workspace.title === void 0 ? workspace.address : `${workspace.title} — ${workspace.address}`,
									onClick: () => {
										if (runtime?.workspaceId === workspace.id && runtime.page.address === workspace.address) {
											setActiveWorkspaceId(workspace.id);
											setShowingList(false);
										} else openWorkspace(workspace.address, workspace.title, workspace.id);
									},
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "da-service-tab-dot",
										"aria-hidden": "true"
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "da-service-tab-name",
										children: sessionName(workspace)
									})]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "da-service-tab-close",
									disabled: opening,
									"aria-label": `${t("serviceCloseTab")} ${sessionName(workspace)}`,
									title: t("serviceCloseTab"),
									onClick: () => {
										closeWorkspace(workspace);
									},
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
										viewBox: "0 0 16 16",
										"aria-hidden": "true",
										focusable: "false",
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "m5 5 6 6M11 5l-6 6" })
									})
								})]
							}, workspace.id))
						]
					}),
					!listVisible && error !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "da-service-errorbar",
						role: "alert",
						children: error
					}) : null,
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "da-service-work",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("main", {
							className: "da-services",
							hidden: !listVisible,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
									className: "da-services-head",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h1", { children: t("serviceTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("serviceHint") })]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("form", {
									className: "da-service-search",
									onSubmit: submit,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
											viewBox: "0 0 20 20",
											"aria-hidden": "true",
											focusable: "false",
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
												cx: "8.5",
												cy: "8.5",
												r: "5.25"
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "m12.4 12.4 4.1 4.1" })]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											value: query,
											onChange: (event) => {
												setQuery(event.target.value);
												setError(null);
											},
											placeholder: t("serviceSearch"),
											"aria-label": t("serviceSearch"),
											autoComplete: "off",
											spellCheck: false
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "submit",
											disabled: opening || query.trim() === "",
											children: opening ? t("serviceOpening") : t("serviceOpen")
										})
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "da-services-toolbar",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("serviceLocal") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => {
											scan();
										},
										disabled: scanning,
										children: scanning ? t("serviceScanning") : t("serviceRescan")
									})]
								}),
								error === null ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: "da-services-error",
									role: "alert",
									children: error
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("section", {
									className: "da-service-list",
									"aria-live": "polite",
									children: scanning && visible.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "da-services-empty",
										children: t("serviceScanning")
									}) : visible.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "da-services-empty",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t(query.trim() === "" ? "serviceEmpty" : "serviceNoMatch") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t(query.trim() === "" ? "serviceEmptyHint" : "serviceSearchHint") })]
									}) : visible.map((service) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "da-service-row",
										disabled: opening,
										onClick: () => {
											openWorkspace(service.url, service.title);
										},
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: "da-service-signal",
												"aria-hidden": "true"
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
												className: "da-service-copy",
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: service.title ?? endpointOf(service.url) }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("b", { children: endpointOf(service.url) }), pathOf(service.url)] })]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
												viewBox: "0 0 16 16",
												"aria-hidden": "true",
												focusable: "false",
												children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "m6 3.5 4.5 4.5L6 12.5" })
											})
										]
									}, service.url))
								})
							]
						}), runtime !== null && runtimeWorkspace !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ActiveLiveBody, {
							workspace: runtimeWorkspace,
							page: runtime.page,
							draft: { marks: liveDraft.marks },
							summary: liveDraft.summary,
							sessionId: props.sessionId,
							localeId: props.localeId,
							sessions: props.sessions,
							conversation: props.conversation,
							remote: props.remote,
							onDraft: rememberDraft,
							onSummary: rememberSummary,
							refreshToken,
							hidden: listVisible
						}, runtime.workspaceId) : null]
					})
				]
			});
		}
		//#endregion
		//#region src/client/service-guide-icon.tsx
		/**
		* Draw the local-pages glyph.
		* @param props - the shell's icon-size hint.
		* @returns the page-and-loopback outline.
		*/
		function ServiceGuideIcon(props) {
			const size = props.size ?? 36;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				width: size,
				height: size,
				className: props.className,
				viewBox: "0 0 36 36",
				fill: "none",
				xmlns: "http://www.w3.org/2000/svg",
				"aria-hidden": "true",
				focusable: "false",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
						x: "7.4",
						y: "7.4",
						width: "21.2",
						height: "21.2",
						rx: "4",
						stroke: "#658EFF",
						strokeWidth: "2.2"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "M7.8 13.1h20.4",
						stroke: "#658EFF",
						strokeWidth: "2.2",
						strokeLinecap: "round"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
						cx: "11.4",
						cy: "10.25",
						r: "0.95",
						fill: "#539CFA"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
						cx: "15",
						cy: "10.25",
						r: "0.95",
						fill: "#539CFA"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
						cx: "12.65",
						cy: "20.3",
						r: "1.9",
						fill: "#539CFA"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "M14.55 20.3h5.45a3.15 3.15 0 0 1 0 6.3h-4.85",
						stroke: "#539CFA",
						strokeWidth: "2.2",
						strokeLinecap: "round"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "m17.95 23.55-2.8 3.05 2.8 3.05",
						stroke: "#539CFA",
						strokeWidth: "2.2",
						strokeLinecap: "round",
						strokeLinejoin: "round"
					})
				]
			});
		}
		//#endregion
		//#region src/client/attachment-annotator/model.ts
		/** One explicitly opened image at a time; retained across sidebar remounts. */
		function createAttachmentStore() {
			let job = null;
			const listeners = /* @__PURE__ */ new Set();
			const publish = () => {
				for (const listener of listeners) listener();
			};
			return {
				getSnapshot: () => job,
				subscribe(listener) {
					listeners.add(listener);
					return () => {
						listeners.delete(listener);
					};
				},
				/** Refuse to overwrite an unfinished image, including one in another Session. */
				open(sessionId, source) {
					if (job !== null) return job.sessionId === sessionId && job.source.id === source.id;
					job = {
						sessionId,
						source,
						marks: [],
						added: null
					};
					publish();
					return true;
				},
				change(source, marks) {
					if (job === null || job.source !== source || job.marks === marks) return;
					job = {
						...job,
						marks
					};
					publish();
				},
				rememberCopy(source, marks, id) {
					if (job === null || job.source !== source) return;
					job = {
						...job,
						added: {
							marks,
							id
						}
					};
					publish();
				},
				clear() {
					job = null;
					publish();
				},
				dispose() {
					job = null;
					listeners.clear();
				}
			};
		}
		/** Submission phases never accept a result; an attachment sent or removed is never resurrected. */
		function canAttach(job, sessionId, input) {
			return sessionId === job.sessionId && input.attachmentIds.includes(job.source.id) && (input.phase === "plain" || input.phase === "claimed");
		}
		/**
		* The text that keeps each numbered comment searchable after the flattened image
		* is staged. The image and the list carry the same ordinals, so the model can
		* connect a sentence to the mark it describes without relying on OCR.
		*/
		function attachmentMessage(fileName, marks) {
			const counted = /* @__PURE__ */ new Map();
			const lines = marks.map((mark) => {
				const ordinal = (counted.get(mark.kind) ?? 0) + 1;
				counted.set(mark.kind, ordinal);
				return describeMark(mark, ordinal, "zh");
			});
			return [
				`【附图批注】已附上「${fileName.trim() || "图片"}」的标注副本，共 ${marks.length} 处。请按编号逐条处理：`,
				...lines,
				"",
				"逐条修改原图的生成源。"
			].join("\n");
		}
		/** Stage one copy and its numbered comments without replacing the original or sending. */
		function attachCopy(job, sessionId, input, conversation, actions, file) {
			if (!canAttach(job, sessionId, input)) throw new Error("原附件已移除、已发送，或输入框正在发送。请下载批注副本。");
			if (!conversation.resolveDraftAttachments([job.source.id]).some((draft) => draft.id === job.source.id && draft.kind === "image" && "file" in draft && draft.file === job.source.file)) throw new Error("原附件已失效，请下载批注副本。");
			const ids = conversation.createDrafts(sessionId, [file], false).map((draft) => draft.id);
			let attached = false;
			try {
				if (ids.length !== 1 || !actions.addAttachments(ids)) throw new Error("输入框未接受副本；原附件保持不变。");
				attached = true;
				const message = attachmentMessage(job.source.file.name, job.marks);
				actions.setDraft(input.draft.trim() === "" ? message : `${input.draft}\n\n${message}`);
				return ids[0];
			} catch (error) {
				if (attached) try {
					actions.setDraft(input.draft);
				} catch {}
				for (const id of ids) conversation.releaseDraftAttachment(id);
				throw error;
			}
		}
		/** Older hosts can keep all existing Figmark features without crashing this optional entry. */
		function attachmentConversation(value) {
			if (typeof value !== "object" || value === null) return void 0;
			const candidate = value;
			return typeof candidate.resolveDraftAttachments === "function" && typeof candidate.createDrafts === "function" && typeof candidate.releaseDraftAttachment === "function" ? candidate : void 0;
		}
		//#endregion
		//#region src/client/attachment-annotator/export.ts
		/** Plain XML text; comments must never become SVG markup. */
		function escapeText(value) {
			return value.replace(/&/gu, "&amp;").replace(/</gu, "&lt;").replace(/>/gu, "&gt;");
		}
		/** Build one self-contained SVG with a readable legend below the original image. */
		function attachmentSvg(dataUrl, size, marks) {
			const layer = {
				kind: "raster",
				dataUrl,
				...size
			};
			const paper = reviewSize(layer, marks);
			const numbers = markOrdinals(marks);
			const font = Math.max(14, Math.min(32, paper.width / 45));
			const width = Math.max(paper.width, 320);
			const columns = Math.max(10, Math.floor((width - 32) / font));
			const lines = marks.flatMap((mark) => {
				if (mark.detail === void 0 || mark.detail.trim() === "") return [];
				return `${mark.kind === "point" ? "Pin" : mark.kind} ${numbers.get(mark.id)} · ${mark.detail}`.split(/\r?\n/u).flatMap((line) => {
					const chars = Array.from(line);
					const wrapped = [];
					for (let at = 0; at < chars.length; at += columns) wrapped.push(chars.slice(at, at + columns).join(""));
					return wrapped;
				});
			});
			const height = paper.height + (lines.length === 0 ? 0 : 32 + lines.length * font * 1.5);
			return {
				svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="white"/>${composeReviewSvg(layer, marks)}${lines.map((line, at) => `<text x="16" y="${paper.height + 24 + at * font * 1.5}" font-size="${font}" fill="#222" font-family="sans-serif">${escapeText(line)}</text>`).join("")}</svg>`,
				width,
				height,
				scale: Math.min(1, 8192 / width, 8192 / height, Math.sqrt(16e6 / (width * height)))
			};
		}
		/** Read only when exporting; the host's preview URL remains owned by the host. */
		async function exportAttachment(file, size, marks) {
			const image = attachmentSvg(await new Promise((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = () => {
					resolve(reader.result);
				};
				reader.onerror = () => {
					reject(/* @__PURE__ */ new Error("无法读取原图，请重试。"));
				};
				reader.readAsDataURL(file);
			}), size, marks);
			const blob = await rasterizePng(image.svg, image.width, image.height, image.scale);
			return new File([blob], `${file.name.replace(/\.[^.]*$/u, "") || "image"}.annotated.png`, { type: "image/png" });
		}
		/** Download is explicit and does not involve any Session. */
		function downloadAttachment(file) {
			const url = URL.createObjectURL(file);
			const link = document.createElement("a");
			link.href = url;
			link.download = file.name;
			link.click();
			setTimeout(() => {
				URL.revokeObjectURL(url);
			}, 1e3);
		}
		//#endregion
		//#region src/client/attachment-annotator/styles.ts
		/** Styles for the composer-thumbnail annotation overlay. */
		const ATTACHMENT_CSS = `
.da-attachment-anchor{display:block;width:0;height:0;overflow:hidden;pointer-events:none}
.da-attachment{
  --da-accent:#e03131;
  --da-blue:#176df2;
  --da-ink:#242529;
  --da-muted:#74777f;
  --da-faint:#9699a1;
  --da-line:rgba(36,37,41,.11);
  --da-paper:#fff;
  --da-rail:#2b2c30;
  position:fixed;
  inset:0;
  z-index:2147483000;
  color:var(--da-ink);
  font-family:var(--dsw-font-family,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif);
  font-size:13px;
  outline:none;
}
.da-attachment,.da-attachment *{box-sizing:border-box}
.da-attachment button,.da-attachment textarea,.da-attachment input{font:inherit}
.da-attachment button{cursor:pointer}
.da-attachment button:focus-visible,.da-attachment textarea:focus-visible,.da-attachment input:focus-visible{outline:2px solid #6ea2ff;outline-offset:2px}
.da-attachment button[aria-disabled=true]{opacity:.38;cursor:default}
.da-attachment-backdrop{
  position:absolute;
  inset:0;
  display:grid;
  place-items:center;
  padding:24px;
  background:rgba(18,19,22,.58);
  backdrop-filter:blur(7px);
  animation:da-attachment-fade .18s ease-out both;
}
.da-attachment-dialog{
  position:relative;
  isolation:isolate;
  display:grid;
  grid-template-rows:minmax(0,1fr) auto;
  width:min(1240px,calc(100vw - 32px));
  height:min(860px,calc(100vh - 32px));
  min-width:520px;
  min-height:420px;
  overflow:visible;
  background:transparent;
  animation:da-attachment-rise .22s cubic-bezier(.22,1,.36,1) both;
}
.da-attachment svg{fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.da-attachment-stage{
  position:relative;
  display:flex;
  min-width:0;
  min-height:0;
  overflow:auto;
  padding:34px 100px 30px 34px;
  background:transparent;
  scrollbar-width:thin;
  overscroll-behavior:contain;
}
.da-attachment-canvas{
  position:relative;
  flex:0 0 auto;
  margin:auto;
}
.da-attachment-paper{
  position:relative;
  transform-origin:top left;
  overflow:visible;
  background:transparent;
}
.da-attachment-paper[data-busy=true]{cursor:progress}
.da-attachment-paper>img{position:absolute;inset:0;display:block;width:100%;height:100%;border-radius:inherit;pointer-events:none;user-select:none}
.da-attachment-paper>.da-overlay{position:absolute;inset:0;display:block;width:100%;height:100%;overflow:visible;touch-action:none}
.da-attachment-paper>.da-overlay[data-tool=select] [data-da-mark]{cursor:move}
.da-attachment-rail{
  position:absolute;
  z-index:20;
  top:50%;
  right:16px;
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:3px;
  width:48px;
  max-height:calc(100% - 34px);
  overflow-y:auto;
  padding:7px 6px;
  transform:translateY(-50%);
  border:1px solid rgba(255,255,255,.09);
  border-radius:17px;
  background:var(--da-rail);
  color:#fff;
  box-shadow:0 12px 30px rgba(18,19,23,.3),inset 0 1px 0 rgba(255,255,255,.08);
  scrollbar-width:none;
}
.da-attachment-rail::-webkit-scrollbar{display:none}
.da-attachment-close svg{width:16px;height:16px}
.da-attachment-tool{
  display:flex;
  align-items:center;
  justify-content:center;
  width:35px;
  height:35px;
  flex:0 0 auto;
  padding:0;
  border:0;
  border-radius:10px;
  background:transparent;
  color:rgba(255,255,255,.72);
  font-size:18px;
  line-height:1;
}
.da-attachment-tool:hover{background:rgba(255,255,255,.1);color:#fff}
.da-attachment-tool[aria-pressed=true]{background:rgba(255,255,255,.19);color:#fff}
.da-attachment-tool[aria-disabled=true]:hover{background:transparent;color:rgba(255,255,255,.72)}
.da-attachment-tool svg{width:17px;height:17px}
.da-attachment-separator{width:22px;height:1px;flex:0 0 auto;margin:3px 0;background:rgba(255,255,255,.15)}
.da-attachment-color{
  position:relative;
  display:flex;
  align-items:center;
  justify-content:center;
  width:35px;
  height:35px;
  flex:0 0 auto;
  border-radius:10px;
  cursor:pointer;
}
.da-attachment-color:hover{background:rgba(255,255,255,.1)}
.da-attachment-color::after{content:"";position:absolute;inset:9px;border:2px solid #fff;border-radius:50%;background:var(--da-accent);box-shadow:0 0 0 1px rgba(0,0,0,.15)}
.da-attachment-color input{position:absolute;inset:0;width:100%;height:100%;padding:0;border:0;opacity:0;cursor:pointer}
.da-attachment-zoom{
  display:block;
  min-width:34px;
  padding:2px 0 3px;
  color:rgba(255,255,255,.55);
  font-size:8.5px;
  font-variant-numeric:tabular-nums;
  line-height:1;
  text-align:center;
}
.da-attachment-footer{
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:6px;
  align-self:center;
  width:auto;
  margin:0 auto 14px;
  padding:0;
}
.da-attachment-status{
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:3px;
  max-width:min(560px,calc(100vw - 56px));
  padding:6px 10px;
  border-radius:9px;
  background:rgba(23,24,27,.82);
  color:rgba(255,255,255,.72);
  font-size:10px;
  line-height:1.4;
  text-align:center;
  backdrop-filter:blur(12px);
}
.da-attachment-warning{color:#9a6418}
.da-attachment-actions{display:flex;align-items:center;gap:7px;flex:0 0 auto}
.da-attachment-action{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:7px;
  height:31px;
  padding:0 11px;
  border:.5px solid rgba(255,255,255,.28);
  border-radius:999px;
  background:rgba(251,251,252,.92);
  color:#4f5157;
  font-size:10.5px;
  font-weight:580;
  line-height:1;
  white-space:nowrap;
  box-shadow:0 5px 18px rgba(5,6,9,.18);
}
.da-attachment-action:hover{background:#eeeef0;color:var(--da-ink)}
.da-attachment-action svg{width:14px;height:14px}
.da-attachment-action-primary{border-color:#26272b;background:#26272b;color:#fff;box-shadow:0 1px 2px rgba(0,0,0,.14)}
.da-attachment-action-primary:hover{background:#3a3b40;color:#fff}
.da-attachment-comment-pill{
  position:absolute;
  z-index:15;
  width:286px;
  max-width:calc(100% - 16px);
  padding:3px;
  border:.5px solid var(--da-line);
  border-radius:20px;
  background:color-mix(in srgb,var(--da-paper) 94%,transparent);
  color:var(--da-ink);
  box-shadow:0 5px 18px rgba(20,40,80,.14),0 0 0 .5px rgba(20,40,80,.06);
  backdrop-filter:blur(10px);
}
.da-attachment-comment-pill textarea{
  width:100%;
  min-height:0;
  max-height:min(180px,42vh);
  resize:none;
  padding:7px 10px;
  border:0;
  outline:0;
  background:transparent;
  color:var(--da-ink);
  font:inherit;
  font-size:13px;
  line-height:1.55;
  field-sizing:content;
  overflow-y:auto;
  scrollbar-width:none;
}
.da-attachment-comment-pill textarea::-webkit-scrollbar{width:0;height:0}
.da-attachment-comment-pill textarea::placeholder{color:#a1a4ab}
.da-attachment .da-attachment-comment-pill textarea:focus-visible{outline:0}
.da-attachment-confirm{
  position:absolute;
  z-index:40;
  left:50%;
  bottom:82px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:20px;
  width:min(500px,calc(100% - 40px));
  padding:12px 12px 12px 15px;
  transform:translateX(-50%);
  border:1px solid rgba(180,35,24,.2);
  border-radius:13px;
  background:rgba(255,252,251,.98);
  box-shadow:0 14px 38px rgba(50,25,20,.18);
}
.da-attachment-confirm>div:first-child{display:flex;flex-direction:column;gap:2px;min-width:0}
.da-attachment-confirm strong{color:#352f2e;font-size:11.5px;font-weight:650}
.da-attachment-confirm span{color:#827875;font-size:9.5px;line-height:1.35}
.da-attachment-confirm-actions{display:flex;gap:6px;flex:0 0 auto}
.da-attachment-confirm button{height:29px;padding:0 10px;border:.5px solid rgba(36,37,41,.13);border-radius:8px;background:#fff;color:#666970;font-size:10.5px}
.da-attachment-confirm button:hover{background:#f1f1f2}
.da-attachment-confirm .da-attachment-danger{border-color:rgba(180,35,24,.22);color:#a1281f}
.da-attachment-confirm .da-attachment-danger:hover{background:#fae9e7}
@keyframes da-attachment-fade{from{opacity:0}to{opacity:1}}
@keyframes da-attachment-rise{from{opacity:0;transform:translateY(8px) scale(.992)}to{opacity:1;transform:none}}
@media(max-width:760px){
  .da-attachment-backdrop{padding:0}
  .da-attachment-dialog{width:100vw;height:100vh;min-width:0;min-height:0}
  .da-attachment-stage{padding:16px 70px 18px 16px}
  .da-attachment-rail{right:9px;width:46px}
  .da-attachment-footer{gap:6px;margin-bottom:10px}
  .da-attachment-status{max-width:calc(100vw - 32px)}
  .da-attachment-actions{justify-content:flex-end}
  .da-attachment-action{flex:0 0 auto}
  .da-attachment-comment-pill{width:248px}
}
@media(pointer:coarse){
  .da-attachment-tool,.da-attachment-color{width:40px;height:40px}
  .da-attachment-rail{width:53px}
}
@media(prefers-reduced-motion:reduce){
  .da-attachment-backdrop,.da-attachment-dialog{animation:none}
}
`;
		//#endregion
		//#region src/client/attachment-annotator/editor.tsx
		/** A comp-access annotation overlay opened from a composer image thumbnail. */
		const TOOL_LABELS = {
			select: "选择",
			pen: "画笔",
			arrow: "箭头",
			rect: "矩形",
			ellipse: "椭圆",
			point: "Pin 评论"
		};
		const TOOLS = [
			"select",
			"pen",
			"arrow",
			"rect",
			"ellipse",
			"point"
		].map((tool) => [tool, TOOL_LABELS[tool]]);
		const ZOOMS = [
			1,
			1.5,
			2,
			4
		];
		const ZOOM_IN = {
			1: 1.5,
			1.5: 2,
			2: 4,
			4: 4
		};
		const ZOOM_OUT = {
			1: 1,
			1.5: 1,
			2: 1.5,
			4: 2
		};
		function PointerIcon() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				viewBox: "0 0 24 24",
				"aria-hidden": "true",
				focusable: "false",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: POINTER_PATH })
			});
		}
		function ToolGlyph({ tool }) {
			return tool === "select" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PointerIcon, {}) : ToolIcon(tool);
		}
		function imagesOf(conversation, attachmentIds) {
			if (conversation === void 0) return [];
			return conversation.resolveDraftAttachments(attachmentIds).filter((draft) => draft.kind === "image" && "file" in draft);
		}
		/** Where a mark's adjacent comment should be anchored, in figure pixels. */
		function attachmentFocusPoint(mark) {
			if (mark.kind === "arrow") return mark.points[mark.points.length - 1] ?? [0, 0];
			if (mark.kind === "rect" || mark.kind === "ellipse") {
				const first = mark.points[0] ?? [0, 0];
				const second = mark.points[1] ?? first;
				return [(first[0] + second[0]) / 2, (first[1] + second[1]) / 2];
			}
			if (mark.kind === "pen") {
				const points = mark.points.length === 0 ? [[0, 0]] : mark.points;
				const xs = points.map((point) => point[0]);
				const ys = points.map((point) => point[1]);
				return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
			}
			return mark.points[0] ?? [0, 0];
		}
		function canEditAttachment(job, sessionId, input) {
			return canAttach(job, sessionId, input);
		}
		/** Mounted once per Session. It has no visible row until a draft image is clicked. */
		function AttachmentOverlay(props) {
			const { store, sessionId, conversation, useInput } = props;
			const draft = useInput((input) => input.draft);
			const attachmentIds = useInput((input) => input.attachmentIds);
			const input = {
				draft,
				attachmentIds,
				phase: useInput((input) => input.phase)
			};
			const job = (0, react.useSyncExternalStore)(store.subscribe, store.getSnapshot);
			const images = imagesOf(conversation, attachmentIds);
			const imagesRef = (0, react.useRef)(images);
			const pendingThumbnail = (0, react.useRef)(null);
			const anchor = (0, react.useRef)(null);
			imagesRef.current = images;
			(0, react.useEffect)(() => {
				const card = anchor.current?.closest("[data-composer-card]");
				if (card === null || card === void 0) return;
				const openImage = (event) => {
					if (!(event instanceof MouseEvent)) return;
					if (event.button !== 0) return;
					const target = event.target;
					if (!(target instanceof Element)) return;
					const imageNode = target instanceof HTMLImageElement ? target : target.closest("button")?.querySelector("img") ?? null;
					if (imageNode === null) return;
					const previewUrl = imageNode.getAttribute("src");
					if (previewUrl === null) return;
					const image = imagesRef.current.find((draft) => draft.previewUrl === previewUrl);
					if (image === void 0 && imagesRef.current.length > 0) return;
					event.preventDefault();
					event.stopPropagation();
					if (image !== void 0) {
						store.open(sessionId, image);
						return;
					}
					pendingThumbnail.current = previewUrl;
				};
				card.addEventListener("click", openImage, true);
				return () => {
					card.removeEventListener("click", openImage, true);
				};
			}, [sessionId, store]);
			(0, react.useEffect)(() => {
				const previewUrl = pendingThumbnail.current;
				if (previewUrl === null) return;
				const image = images.find((draft) => draft.previewUrl === previewUrl);
				if (image === void 0) return;
				pendingThumbnail.current = null;
				store.open(sessionId, image);
			}, [
				images,
				sessionId,
				store
			]);
			(0, react.useEffect)(() => {
				if (job === null) return;
				if (job.sessionId !== sessionId || !canEditAttachment(job, sessionId, input)) store.clear();
			}, [
				input.attachmentIds,
				input.phase,
				job,
				sessionId,
				store
			]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				ref: anchor,
				className: "da-attachment-anchor",
				"aria-hidden": "true"
			}), job !== null && job.sessionId === sessionId ? (0, react_dom.createPortal)(/* @__PURE__ */ (0, react_jsx_runtime.jsx)(AttachmentEditor, {
				...props,
				job
			}, `${job.sessionId}/${job.source.id}`), document.body) : null] });
		}
		/** The whole editor is one modal surface; the host's own composer remains intact. */
		function AttachmentEditor(props) {
			const { store, sessionId, conversation, useInput, inputActions, job } = props;
			const input = {
				draft: useInput((input) => input.draft),
				attachmentIds: useInput((input) => input.attachmentIds),
				phase: useInput((input) => input.phase)
			};
			const history = useAnnotationHistory(job.marks);
			const latest = (0, react.useRef)({
				input,
				sessionId
			});
			latest.current = {
				input,
				sessionId
			};
			const mounted = (0, react.useRef)(true);
			const root = (0, react.useRef)(null);
			const paper = (0, react.useRef)(null);
			const viewport = (0, react.useRef)(null);
			const canvasInput = (0, react.useRef)(null);
			const busyRef = (0, react.useRef)(false);
			const [previewUrl, setPreviewUrl] = (0, react.useState)();
			const [tool, setTool] = (0, react.useState)("select");
			const [color, setColor] = (0, react.useState)("#e03131");
			const [selectedId, setSelectedId] = (0, react.useState)(null);
			const [size, setSize] = (0, react.useState)(null);
			const [zoom, setZoom] = (0, react.useState)(1);
			const [viewportSize, setViewportSize] = (0, react.useState)({
				width: 760,
				height: 520
			});
			const [notice, setNotice] = (0, react.useState)("");
			const [busy, setBusy] = (0, react.useState)(false);
			const [confirmClose, setConfirmClose] = (0, react.useState)(false);
			(0, react.useEffect)(() => {
				mounted.current = true;
				root.current?.focus();
				return () => {
					mounted.current = false;
				};
			}, []);
			(0, react.useEffect)(() => {
				const url = URL.createObjectURL(job.source.file);
				setPreviewUrl(url);
				return () => {
					URL.revokeObjectURL(url);
				};
			}, [job.source.file]);
			(0, react.useEffect)(() => {
				store.change(job.source, history.marks);
			}, [
				history.marks,
				job.source,
				store
			]);
			(0, react.useEffect)(() => {
				const node = viewport.current;
				/* v8 ignore next -- the effect runs after the stage ref has attached. */
				if (node === null) return;
				const measure = () => {
					setViewportSize({
						width: Math.max(280, node.clientWidth),
						height: Math.max(240, node.clientHeight)
					});
				};
				measure();
				const observer = new ResizeObserver(measure);
				observer.observe(node);
				return () => {
					observer.disconnect();
				};
			}, []);
			const scale = (size === null ? 1 : Math.min(1, Math.max(.1, (viewportSize.width - 112) / size.width), Math.max(.1, (viewportSize.height - 56) / size.height))) * zoom;
			const selected = history.marks.find((mark) => mark.id === selectedId) ?? null;
			const ready = canEditAttachment(job, sessionId, input) && conversation !== void 0;
			const percentage = Math.round(zoom * 100);
			const select = (id) => {
				setSelectedId(id);
			};
			const remove = (id) => {
				history.commit(removedMarks(history.marks, id));
				setSelectedId(null);
			};
			const requestClose = () => {
				canvasInput.current?.cancel();
				if (history.marks.length === 0) store.clear();
				else setConfirmClose(true);
			};
			const finish = async (download) => {
				const liveConversation = conversation;
				if (busyRef.current || size === null || history.marks.length === 0) return;
				if (!download && (!ready || liveConversation === void 0)) return;
				canvasInput.current?.cancel();
				busyRef.current = true;
				setBusy(true);
				setNotice(download ? "正在生成 PNG…" : "正在生成标注副本…");
				try {
					const file = await exportAttachment(job.source.file, size, history.marks);
					if (!mounted.current || store.getSnapshot()?.source !== job.source) return;
					const editor = root.current;
					if (editor !== null && typeof editor.checkVisibility === "function" && !editor.checkVisibility()) throw new Error("标注浮层已关闭，请重新打开后重试");
					if (download) {
						downloadAttachment(file);
						setNotice("已下载 PNG；原图和输入框未改变。");
						return;
					}
					if (store.getSnapshot()?.marks !== history.marks) throw new Error("生成过程中批注已更改，请重新生成");
					/* v8 ignore next -- the callable form above already refused an absent Host. */
					if (liveConversation === void 0) return;
					const live = latest.current;
					const id = attachCopy(job, live.sessionId, live.input, liveConversation, inputActions, file);
					store.rememberCopy(job.source, history.marks, id);
					store.clear();
				} catch (error) {
					if (mounted.current && store.getSnapshot() !== null) setNotice(`生成或加入副本失败：${String(error)}。批注已保留，可重试或下载。`);
				} finally {
					busyRef.current = false;
					if (mounted.current && store.getSnapshot() !== null) setBusy(false);
				}
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				ref: root,
				className: "da-attachment",
				tabIndex: -1,
				role: "dialog",
				"aria-modal": "true",
				"aria-label": "附图标注编辑器",
				onKeyDown: (event) => {
					event.stopPropagation();
					if (event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLInputElement) return;
					if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
						event.preventDefault();
						if (event.shiftKey) history.redo();
						else history.undo();
					} else if (event.key === "Escape") {
						canvasInput.current?.cancel();
						setSelectedId(null);
						requestClose();
					} else if ((event.key === "Delete" || event.key === "Backspace") && selectedId !== null) {
						event.preventDefault();
						remove(selectedId);
					}
				},
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", { children: ATTACHMENT_CSS }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "da-attachment-backdrop",
					onPointerDown: (event) => {
						if (event.target === event.currentTarget) requestClose();
					},
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "da-attachment-dialog",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "da-attachment-stage",
								ref: viewport,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "da-attachment-canvas",
									style: size === null ? {} : {
										width: size.width * scale,
										height: size.height * scale
									},
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										ref: paper,
										className: "da-attachment-paper",
										"data-busy": busy || void 0,
										style: size === null ? {} : {
											width: size.width,
											height: size.height,
											transform: `scale(${scale})`
										},
										onPointerDownCapture: (event) => {
											if (!busyRef.current) return;
											event.preventDefault();
											event.stopPropagation();
										},
										children: [
											previewUrl !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
												src: previewUrl,
												alt: "待标注原图",
												draggable: false,
												onLoad: (event) => {
													const image = event.currentTarget;
													if (image.naturalWidth === 0 || image.naturalHeight === 0) {
														setSize(null);
														setNotice("图片尺寸无效。");
														return;
													}
													setSize({
														width: image.naturalWidth,
														height: image.naturalHeight
													});
												},
												onError: () => {
													setSize(null);
													setNotice("原图加载失败；请重新添加图片后重试。");
												}
											}),
											size !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Canvas, {
												width: size.width,
												height: size.height,
												marks: history.marks,
												tool,
												color,
												containerRef: paper,
												inputRef: canvasInput,
												anchoring: false,
												scale,
												selectedId,
												onSelect: select,
												onAdd: (mark) => {
													if (history.marks.length >= 100) {
														setNotice("单张图片最多 100 条批注。");
														return;
													}
													history.commit([...history.marks, mark]);
												},
												onMove: (id, points, anchor) => {
													const next = movedMarks(history.marks, id, points, anchor);
													if (next !== null) history.commit(next);
												},
												onUpdate: (id, patch) => {
													history.commit(patchedMarks(history.marks, id, patch));
												},
												onRemove: remove,
												onEdit: (id) => {
													setSelectedId(id);
													setTool("select");
												},
												onDrawn: (id) => {
													setSelectedId(id);
													if (tool !== "pen") setTool("select");
												}
											}),
											selected !== null && size !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(CommentPill, {
												mark: selected,
												size,
												scale,
												onChange: (value) => {
													history.amend((marks) => detailedMarks(marks, selected.id, value));
												},
												onClose: () => {
													setSelectedId(null);
												}
											})
										]
									})
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "da-attachment-rail",
									role: "toolbar",
									"aria-label": "绘图工具",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: "da-attachment-tool da-attachment-close",
											"aria-label": "关闭附图标注",
											title: "关闭",
											onClick: requestClose,
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(CloseIcon, {})
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "da-attachment-separator" }),
										TOOLS.map(([value, label]) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: "da-attachment-tool",
											"aria-label": label,
											title: label,
											"aria-pressed": tool === value,
											onClick: () => {
												canvasInput.current?.cancel();
												setTool(value);
											},
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ToolGlyph, { tool: value })
										}, value)),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "da-attachment-separator" }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
											className: "da-attachment-color",
											title: "批注颜色",
											style: { "--da-accent": color },
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
												type: "color",
												"aria-label": "批注颜色",
												value: color,
												onChange: (event) => {
													setColor(event.target.value);
													if (selectedId !== null) history.commit(patchedMarks(history.marks, selectedId, { color: event.target.value }));
												}
											})
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: "da-attachment-tool",
											"aria-label": "撤销",
											title: "撤销",
											"aria-disabled": history.depth.past === 0,
											onClick: history.undo,
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(UndoIcon, {})
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: "da-attachment-tool",
											"aria-label": "重做",
											title: "重做",
											"aria-disabled": history.depth.future === 0,
											onClick: history.redo,
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RedoIcon, {})
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "da-attachment-separator" }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: "da-attachment-tool",
											"aria-label": "缩小",
											title: "缩小",
											"aria-disabled": zoom === ZOOMS[0],
											onClick: () => {
												setZoom(ZOOM_OUT[zoom]);
											},
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												"aria-hidden": "true",
												children: "−"
											})
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											className: "da-attachment-zoom",
											"aria-label": "当前缩放",
											children: [percentage, "%"]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: "da-attachment-tool",
											"aria-label": "放大",
											title: "放大",
											"aria-disabled": zoom === ZOOMS[ZOOMS.length - 1],
											onClick: () => {
												setZoom(ZOOM_IN[zoom]);
											},
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												"aria-hidden": "true",
												children: "+"
											})
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("footer", {
								className: "da-attachment-footer",
								children: [(notice !== "" || !ready) && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "da-attachment-status",
									children: [notice !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										role: "status",
										"aria-live": "polite",
										children: notice
									}), !ready && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "da-attachment-warning",
										children: "原附件已移除、已发送，或输入框正在发送。仍可下载 PNG。"
									})]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "da-attachment-actions",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "da-attachment-action",
										"aria-disabled": busy || size === null || history.marks.length === 0,
										onClick: () => {
											finish(true);
										},
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(DownloadIcon, {}), "下载 PNG"]
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "da-attachment-action da-attachment-action-primary",
										"aria-disabled": busy || size === null || history.marks.length === 0 || !ready,
										title: "生成标注图片，并把逐条评论写入输入框；原图不变，也不会自动发送",
										onClick: () => {
											finish(false);
										},
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(CopyIcon, {}), "加入输入框"]
									})]
								})]
							}),
							confirmClose && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "da-attachment-confirm",
								role: "alert",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: "放弃这些本地批注？" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "原图不会改变；未生成的批注会在关闭后清除。" })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "da-attachment-confirm-actions",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => {
											setConfirmClose(false);
										},
										children: "继续编辑"
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: "da-attachment-danger",
										onClick: () => {
											store.clear();
										},
										children: "放弃批注"
									})]
								})]
							})
						]
					})
				})]
			});
		}
		function CommentPill(props) {
			const { mark, size, scale } = props;
			const input = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				input.current?.focus();
			}, [mark.id]);
			const [x, y] = attachmentFocusPoint(mark);
			const right = x > size.width * .62;
			const below = y < 92;
			const translateX = right ? "calc(-100% - 14px)" : "14px";
			const translateY = below ? "14px" : "calc(-100% - 14px)";
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "da-attachment-comment-pill",
				role: "group",
				"aria-label": "批注评论",
				style: {
					left: `${x}px`,
					top: `${y}px`,
					transform: `scale(${1 / scale}) translate(${translateX}, ${translateY})`,
					transformOrigin: `${right ? "right" : "left"} ${below ? "top" : "bottom"}`
				},
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
					ref: input,
					"data-mark": mark.id,
					"aria-label": `批注 ${mark.id} 评论`,
					placeholder: "说明这里要怎么改…",
					rows: 1,
					maxLength: MAX_DETAIL_CHARS,
					value: mark.detail ?? "",
					onChange: (event) => {
						props.onChange(event.target.value);
					},
					onKeyDown: (event) => {
						if (event.key === "Escape") {
							event.preventDefault();
							props.onClose();
						}
					}
				})
			});
		}
		//#endregion
		//#region src/client/attachment-annotator/register.ts
		const ATTACHMENT_BODY_ID = "dsh-figmark/attachment";
		/**
		* One invisible floating seat. It listens only to its Session's native draft
		* thumbnails, so the shell keeps ownership of uploads, removal and sending.
		*/
		function registerAttachmentAnnotator(ctx, slots) {
			const store = createAttachmentStore();
			ctx.effect(() => () => {
				store.dispose();
			}, "dsh-figmark: attachment draft lifecycle");
			const injected = (_sessionId) => ({
				store,
				conversation: attachmentConversation(ctx.get("conversation"))
			});
			ctx.effect(() => slots.inject("conversation.input.overlay", () => slots.register({
				name: "conversation.input.overlay",
				id: ATTACHMENT_BODY_ID,
				order: 80,
				inject: injected
			}, AttachmentOverlay)), "dsh-figmark: attachment overlay");
		}
		//#endregion
		//#region src/client/index.tsx
		/** Plugin name reported to the client module loader. */
		const name = "dsh-figmark-client";
		/** Client services this plugin waits for before it mounts anything. */
		const inject = [
			"slots",
			"locale",
			"documentPreviews",
			"sidebarRightTabs"
		];
		/** Implementation identity of the image renderer, shared by its metadata and its slot entry. */
		const BODY_ID = "dsh-figmark/image";
		/** Implementation identity of the PDF renderer, shared by its metadata and its slot entry. */
		const PDF_BODY_ID = "dsh-figmark/pdf";
		/** Implementation identity of the read-only static HTML preview. */
		const HTML_BODY_ID = "dsh-figmark/html-preview";
		/** Identity of the right-sidebar service browser. */
		const SERVICE_BODY_ID = "dsh-figmark/services";
		/** Page kind the service browser occupies. */
		const SERVICE_KIND = "dsh-figmark-services";
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
		/** Suffixes the preview-only renderer keeps readable inside the panel. */
		const HTML_EXTENSIONS = ["html", "htm"];
		/** The keyed slot the transcript dispatches one text block to. */
		const USER_TEXT_SLOT = "conversation.user.text.node";
		/** The full-width dock the composer draws above its own card. */
		const PENDING_SLOT = "conversation.input.dock";
		/**
		* Whether this card names a loopback page opened by the live service browser.
		* @param path - the subject printed by the annotation message.
		* @param html - whether the message is the live/HTML form.
		* @returns true only for a loopback URL from an HTML annotation.
		*/
		function isLivePage(path, html) {
			return html && loopbackAddressOf(path) !== void 0;
		}
		/**
		* Whether the Sidebar can open this annotation subject.
		* @param ctx - the plugin's client context.
		* @param sessionId - Session the bubble belongs to.
		* @param path - the figure's path or page URL.
		* @param html - whether the message is the live/HTML form.
		* @returns true when a matching Sidebar entry point exists.
		*/
		function canOpenFigure(ctx, sessionId, path, html) {
			if (sessionId === "" || path === "") return false;
			if (/^[a-z][a-z\d+.-]*:\/\//iu.test(path) && !isLivePage(path, html)) return false;
			const sidebar = ctx.get("sidebarRight");
			if (sidebar === void 0) return false;
			return !isLivePage(path, html) || sidebar.openTab !== void 0;
		}
		/**
		* Open one figure in the Sidebar, where its annotation already lives.
		*
		* Nothing here can fail the bubble: the card is a shortcut to a tab, and a
		* composition without a Sidebar (or one whose column cannot take this address)
		* leaves the message exactly as readable as it was.
		* @param ctx - the plugin's client context.
		* @param sessionId - Session the bubble belongs to.
		* @param path - the figure's path, as the message spells it.
		* @param html - whether the message is the live/HTML form.
		* @returns whether the Sidebar accepted the navigation.
		*/
		function openFigure(ctx, sessionId, path, html) {
			const sidebar = ctx.get("sidebarRight");
			if (!canOpenFigure(ctx, sessionId, path, html) || sidebar === void 0) return false;
			try {
				if (isLivePage(path, html)) {
					sidebar.openTab?.(SERVICE_KIND, {
						params: { url: path },
						revealIfOpened: true
					});
					return true;
				}
				sidebar.openResource(fileAddress(sessionId, path));
				return true;
			} catch (reason) {
				console.warn("[figmark] cannot open the annotated figure", reason);
				return false;
			}
		}
		/**
		* Mount the browser half.
		* @param ctx - the plugin's client context.
		* @throws {Error} when a required service is missing from the composition.
		*/
		function apply(ctx) {
			const locale = ctx.get("locale");
			const previews = ctx.get("documentPreviews");
			const slots = ctx.get("slots");
			const sidebarTabs = ctx.get("sidebarRightTabs");
			if (locale === void 0) throw new Error(missingService("locale"));
			if (previews === void 0) throw new Error(missingService("documentPreviews"));
			if (slots === void 0) throw new Error(missingService("slots"));
			if (sidebarTabs === void 0) throw new Error(missingService("sidebarRightTabs"));
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
			ctx.effect(() => sidebarTabs.register({
				id: SERVICE_BODY_ID,
				kind: SERVICE_KIND,
				keepMounted: true,
				priority: "extension",
				title: () => locale.bind(NAMESPACE)("serviceTitle"),
				guide: [{
					id: "services",
					order: 20,
					title: () => locale.bind(NAMESPACE)("serviceTitle"),
					description: () => locale.bind(NAMESPACE)("serviceHint"),
					icon: ServiceGuideIcon
				}]
			}), "dsh-figmark: service browser tab");
			ctx.effect(() => slots.inject("sidebar.right.pane.tab", () => slots.register({
				name: "sidebar.right.pane.tab",
				key: SERVICE_BODY_ID,
				locale: NAMESPACE,
				inject: (sessionId) => ({
					sessionId: String(sessionId),
					localeId: locale.getLocale().locale ?? "zh",
					sessions: ctx.get("sessions"),
					conversation: ctx.get("conversation"),
					remote: ctx.get("remote")
				})
			}, ServiceBrowser)), "dsh-figmark: service browser body");
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
						sessionId: String(sessionId),
						locale: locale.getLocale().locale?.startsWith("en") === true ? "en" : "zh"
					})
				})
			}, LazyPdfBody)), "dsh-figmark: pdf document body");
			ctx.effect(() => previews.register({
				id: HTML_BODY_ID,
				extensions: HTML_EXTENSIONS,
				priority: "extension",
				title: () => locale.bind(NAMESPACE)("htmlTitle"),
				loading: "bytes-complete",
				wrap: false
			}), "dsh-figmark: html preview metadata");
			ctx.effect(() => slots.inject("sidebar.right.tab.document", () => slots.register({
				name: "sidebar.right.tab.document",
				key: HTML_BODY_ID,
				locale: NAMESPACE,
				inject: (sessionId) => ({
					sessions: void 0,
					conversation: void 0,
					sessionId: String(sessionId),
					localeId: locale.getLocale().locale ?? "zh",
					remote: void 0
				})
			}, HtmlPreviewBody)), "dsh-figmark: html preview body");
			let stopRule;
			ctx.effect(() => {
				const stopCard = slots.inject(USER_TEXT_SLOT, () => {
					const ui = ctx.get("uiConversation");
					if (ui === void 0) return () => {};
					stopRule ??= ui.userText.register(annotationRule);
					return slots.register({
						name: USER_TEXT_SLOT,
						key: RULE_ID,
						locale: NAMESPACE,
						inject: (sessionId) => ({
							sessionId: String(sessionId),
							localeId: locale.getLocale().locale ?? "zh",
							canOpen: (path, html) => {
								return canOpenFigure(ctx, String(sessionId), path, html);
							},
							open: (path, html) => {
								return openFigure(ctx, String(sessionId), path, html);
							}
						})
					}, AnnotationCard);
				});
				return () => {
					stopCard();
					stopRule?.();
					stopRule = void 0;
				};
			}, "dsh-figmark: annotation card");
			ctx.effect(() => slots.inject(PENDING_SLOT, () => slots.register({
				name: PENDING_SLOT,
				id: RULE_ID,
				order: 40,
				locale: NAMESPACE,
				inject: (sessionId) => ({
					sessionId: String(sessionId),
					localeId: locale.getLocale().locale ?? "zh"
				})
			}, PendingCard)), "dsh-figmark: parked annotation");
			registerAttachmentAnnotator(ctx, slots);
		}
		//#endregion
		exports.BODY_ID = BODY_ID;
		exports.HTML_BODY_ID = HTML_BODY_ID;
		exports.PDF_BODY_ID = PDF_BODY_ID;
		exports.SERVICE_BODY_ID = SERVICE_BODY_ID;
		exports.SERVICE_KIND = SERVICE_KIND;
		exports.apply = apply;
		exports.inject = inject;
		exports.name = name;
		return module.exports;
	}
});
