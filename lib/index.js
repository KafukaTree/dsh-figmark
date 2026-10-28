import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { basename, dirname, extname, isAbsolute, join, resolve } from "node:path";
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
	"1a. 若某条写的是**元素**而不是形状（`① 元素 …`），那条标注指的不是\"在这里画个框\"，而是**那一个元素本身**：圆括号里给的是选中时抽到的名字（元素标题 / `id` / 元素文字 / 选择器），按它去源文件里找到那一个元素，改的就是它，不是它周围的一块区域。这类标注没有可挪动的形状，用户说的\"这里\"就是那个元素。",
	"2. **PDF 是整份文档一份标注**：每条标注都带 `第 N 页`，坐标是那一页自己的（原点在该页左上角）。看每条标注前先确认它的页码。",
	"3. 若标注超出原图边界，标注图会把越界的那圈纸也画出来，并用**灰色虚线**框住原图真正的边缘：虚线**里面**是原图，**外面**是你画的标注伸出去的部分——那块不属于图，不要把它当成新增的画布内容。有形状的标注（箭头/框选/椭圆/手绘）会附一张标注图（`<图名>.annotated.png`，PDF 则是一份**带批注的 PDF**，其批注是原生 PDF 注释对象：`/Ink` 手绘、`/Square` 框选、`/Circle` 圈选、`/Line` 箭头），可直接打开核对图面位置。**若消息说「本条标注只有位置点，没有标注图」，那就是全部内容：只有坐标加一句说明，直接按原图定位处理，不要去找不存在的附件。**",
	"4. 逐条处理标注：每条标注都要落到具体的图面改动，并在答复里逐条回应（编号与标注一致）。无法实现的标注要说明原因，不要静默跳过。",
	"5. 修改附图以**标注所指的生成源**为准（绘制脚本、SVG 源或 `generate_patent_figure` 的入参），不要直接涂改导出的位图；PDF 同理，改的是生成该 PDF 的源头，不是那份带批注的副本。未标注的部分保持不动。",
	"6. 改完图后重新渲染并核对：图面尺寸/坐标若变化，旧标注的坐标会失准，此时以 `anchor` 与标注文字为准复核一遍，再回报结果。",
	"7. 若消息以【HTML 标注】开头，那是**渲染出来的 HTML 文档**：标注画在固定 1024px 宽的渲染面上，`points` 是那个宽度下的渲染像素。这类标注**没有标注图**（浏览器无法把渲染好的文档栅格化成图片），所以定位只能靠 `marks[].anchor.selector`——那是一条**可直接粘贴使用**的精确路径：每段是 `tag:nth-of-type(n)`，遇到 `#id` 就在那里截断，因此它要么以 `body > …` 开头，要么直接是 `#id > …`；`anchor.text` 是该元素的文字，`points` 只作辅助（渲染宽度一变坐标就会漂）。SVG 的元素标注同理，只是那条路径以 `<svg>` 元素本身为根（`svg > g:nth-of-type(2) > …`），遇到 `#id` 同样在那里截断——所以它要么以 `svg > …` 开头，要么直接是 `#id > …`。",
	"8. 处理 HTML 标注时，改的是**生成这份 HTML 的源文件**（模板、生成脚本或 HTML 本体），不是预览里的渲染结果；渲染面按本插件内联的样式与脚本策略绘制，脚本不会执行、外部资源不会加载，所以别把\"预览里看起来不对\"当成文件本身的问题。"
].join("\n");
/** Section order used for the Markdown edit-proposal guidance (after the annotation one). */
const EDIT_GUIDANCE_ORDER = 8991;
/** Stable section name, unique in the assembled prompt. */
const EDIT_GUIDANCE_NAME = "dsh-figmark:markdown-edits";
/** The guidance text appended for messages that carry a Markdown difference. */
const EDIT_GUIDANCE = [
	"## Markdown 修改建议（dsh-figmark）",
	"",
	"用户可能在文档预览里直接编辑 Markdown，保存后你会收到一条【文档修改建议】开头、正文是一段 unified diff 的用户消息（`--- a/<文件名>`、`+++ b/<文件名>`，`@@` 头给出两侧的起始行与行数）。收到时按下列纪律处理：",
	"",
	"1. 先读文件（消息里给出路径）。**用户没有把改动写进磁盘**：磁盘上的文件仍是旧版，`a` 侧是用户打开时的那一版，`b` 侧是用户改完的结果。",
	"2. 把 diff 应用到源文件：`-` 行删除、`+` 行写入、空格开头的是上下文（保持原样），逐处落地；不要重写整个文件，diff 之外的部分保持不动。",
	"3. 消息里若说「另有 N 处改动未在本消息里展开」，完整结果就是随消息发送的 `<文件名>.edited.md` 附件；以它为准。",
	"4. 消息里若带「我的说明：」清单，那是用户对某一行/某一处改动写的理由（形如 `1. 第 6 行（@@ -3,7 +3,7 @@）：…`）；落地时按它判断意图，说明里提到的行号是**基线（a 侧）**的行号。",
	"5. 消息里若说文件在编辑期间被改动过、或 diff 以整块替换呈现，先核对再落地；无法安全应用时说明原因，不要猜着改。",
	"6. 落地后逐处回应（顺序与 diff 一致），并说明哪些改动你没有采纳以及为什么。"
].join("\n");
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
		if (!(await stat(absolute)).isFile()) return {
			ok: false,
			message: `not a regular file: ${absolute}`
		};
	} catch {
		return {
			ok: false,
			message: `no such figure: ${absolute}`
		};
	}
	return {
		ok: true,
		target: {
			address,
			path: absolute,
			mediaType,
			workspace: cwd ?? null
		}
	};
}
/** Route prefix owned by this plugin. */
const ROUTE_PREFIX = "/dsh-figmark";
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
const MAX_BODY_BYTES = 24 * 1024 * 1024 * 2;
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
		if (total > MAX_BODY_BYTES) throw new Error(`request body exceeds ${MAX_BODY_BYTES} bytes`);
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
/** Kinds a mark may declare. */
const MARK_KINDS = [
	"arrow",
	"rect",
	"ellipse",
	"pen",
	"point",
	"element"
];
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
	if (typeof kind !== "string" || !MARK_KINDS.includes(kind)) throw new Error(`annotation mark ${index} has unknown kind ${JSON.stringify(kind)}`);
	if (typeof raw["id"] !== "string" || raw["id"] === "") throw new Error(`annotation mark ${index} needs an id`);
	if (typeof raw["color"] !== "string") throw new Error(`annotation mark ${index} needs a color`);
	const points = raw["points"];
	if (!Array.isArray(points) || points.length === 0 || !points.every(isPoint)) throw new Error(`annotation mark ${index} needs at least one coordinate pair`);
	const page = readPositiveInteger(raw, "page");
	if (page !== void 0 && figure.width !== void 0) throw new Error(`annotation mark ${index} names a page, but its figure is one surface`);
	if (page !== void 0 && figure.pageCount !== void 0 && page > figure.pageCount) throw new Error(`annotation mark ${index} is on page ${page} of a ${figure.pageCount}-page document`);
	const anchor = readAnchor(raw["anchor"]);
	const rotation = readRotation(raw["rotation"]);
	const weight = readWeight(raw["weight"]);
	return {
		id: raw["id"],
		kind,
		color: raw["color"],
		points,
		...typeof raw["detail"] === "string" ? { detail: raw["detail"] } : {},
		...page === void 0 ? {} : { page },
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
		...typeof raw["summary"] === "string" && raw["summary"] !== "" ? { summary: raw["summary"] } : {}
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
* @returns the document, or null when none was stored or it is unreadable.
*/
async function readAnnotation(figurePath) {
	for (const candidate of annotationCandidates(figurePath)) {
		const document = await readSidecar(candidate);
		if (document !== null && annotationTargetsFigure(document, figurePath)) return document;
	}
	if (!isPagedFigurePath(figurePath)) return null;
	return await readLegacyPages(figurePath);
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
* @returns the merged document, or null when no readable page file exists.
*/
async function readLegacyPages(figurePath) {
	const directory = dirname(figurePath);
	const pattern = legacyPagePattern(figurePath);
	let entries;
	try {
		entries = await readdir(directory);
	} catch {
		return null;
	}
	const pages = entries.map((name) => ({
		name,
		page: Number(pattern.exec(name)?.[1])
	})).filter((entry) => Number.isInteger(entry.page) && entry.page > 0).sort((left, right) => left.page - right.page);
	const read = [];
	for (const entry of pages) {
		const document = await readSidecar(join(directory, entry.name));
		if (document !== null && annotationTargetsFigure(document, figurePath)) read.push({
			page: entry.page,
			document
		});
	}
	const first = read[0];
	if (first === void 0) return null;
	let summary;
	for (const entry of read) if (entry.document.summary !== void 0) summary = entry.document.summary;
	return {
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
	};
}
/**
* Parse one marks file into this plugin's document shape.
* @param sidecarPath - absolute path of the marks file.
* @returns the document, or null when the file is missing, oversized, or unreadable.
*/
async function readSidecar(sidecarPath) {
	let text;
	try {
		if ((await stat(sidecarPath)).size > 4194304) return null;
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
* Replace one file atomically.
*
* The temporary name carries the pid and the clock so two saves that overlap
* cannot pick the same scratch file; the rename is the moment the new content
* becomes observable.
* @param path - absolute path of the file to replace.
* @param content - text or bytes to write.
*/
async function writeAtomically(path, content) {
	const temporary = `${path}.tmp-${process.pid}-${Date.now()}`;
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
	for (const path of [paths.annotation, paths.review]) try {
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
//#endregion
//#region src/host/routes.ts
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
	const [sha256, saved] = await Promise.all([fileDigest(target.path), readAnnotation(target.path)]);
	return {
		ok: true,
		figure: {
			...target,
			sha256
		},
		annotation: saved
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
* @returns one handler per route path.
*/
function createHandlers(deps) {
	const annotation = async (req, res) => {
		if (!guarded(req)) {
			sendFailure(res, 403, "missing plugin guard header");
			return;
		}
		const url = new URL(req.url ?? "/", "http://localhost");
		try {
			const answer = await route(req, url, deps);
			if (answer.ok) {
				sendJson(res, 200, answer.body);
				return;
			}
			sendFailure(res, answer.status, answer.error);
		} catch (error) {
			sendFailure(res, 400, error instanceof Error ? error.message : String(error));
		}
	};
	return { annotation };
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
	ctx.effect(() => webServer.register({
		kind: "prefix",
		path: ROUTE_PREFIX,
		handler: handlers.annotation
	}), "dsh-figmark: annotation route");
	ctx.effect(() => systemPrompt.section({
		name: GUIDANCE_NAME,
		order: GUIDANCE_ORDER,
		text: GUIDANCE,
		stable: true
	}), "dsh-figmark: guidance");
	ctx.effect(() => systemPrompt.section({
		name: EDIT_GUIDANCE_NAME,
		order: EDIT_GUIDANCE_ORDER,
		text: EDIT_GUIDANCE,
		stable: true
	}), "dsh-figmark: edit guidance");
}
//#endregion
export { apply, inject, name };
