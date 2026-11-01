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
export const RULE_ID = 'figmark'

/**
 * How far into a text a block may be looked for.
 *
 * An annotation is appended to a user's own turn, so the block is near the end; a
 * message past this size is treated as unreadable rather than scanned frame by frame,
 * and falls back to plain text.
 */
const MAX_TEXT = 200_000

/** Marks accepted from one block, so a hostile list cannot define a thousand rows. */
const MAX_MARKS = 400

/** Header candidates tried before the scan gives up on one text. */
const MAX_HEADERS = 64

/** Lines read from one header before the block is called finished. */
const MAX_LINES = 600

/**
 * One header spelling: the token the block opens with, and what it says about itself.
 *
 * English runs the token into the path with a space, Chinese runs it in without one,
 * and a rendered document says so in the token rather than in its scope line.
 */
interface HeaderForm {
  readonly token: string
  readonly zh: boolean
  readonly html: boolean
}

/** Every header figmark writes, in either language. */
const HEADERS: readonly HeaderForm[] = [
  { token: '【附图标注】', zh: true, html: false },
  { token: '【HTML 标注】', zh: true, html: true },
  { token: '[figure annotations]', zh: false, html: false },
  { token: '[HTML annotations]', zh: false, html: true },
]

/**
 * The punctuation around a mark's note, in each language.
 *
 * The note is the last thing on the line and the only part of it a reader typed, so
 * these are what split the line into "where" and "what"; the "where" half is kept
 * whole, because the card shows it as written instead of re-deriving geometry.
 *
 * A mark with nothing written on it is spelled as {@link NoteForm.comma} followed by
 * {@link NoteForm.empty}, so taking the phrase off still leaves the comma on the name.
 */
interface NoteForm {
  /** Separates the name from a note that was written. */
  readonly split: string
  /** Says the mark carries no note at all. */
  readonly empty: string
  /** The comma that introduces either of them. */
  readonly comma: string
}

/** The two spellings, indexed by whether the message is the Chinese one. */
const NOTE: readonly [NoteForm, NoteForm] = [
  { split: '，批注：', empty: '（未写说明）', comma: '，' },
  { split: ', note: ', empty: ' (no detail)', comma: ',' },
]

/** The one closing sentence of each message kind, in either language. */
const CLOSERS: ReadonlySet<string> = new Set([
  '逐条改生成源。',
  '逐条处理该 PDF。',
  '逐条改 HTML 生成源。',
  'Edit the generating source, mark by mark.',
  'Work through the PDF, mark by mark.',
  'Edit the HTML source, mark by mark.',
])

/** The optional statement of what the reader wants done, in either language. */
const TARGETS: readonly string[] = ['目标：', 'goal: ']

/**
 * Read the message's one statement about a live-page screenshot.
 * @param line - one non-empty line before the mark list.
 * @returns the capture state that line reports, or undefined for every other line.
 */
function pageCaptureOf(line: string): FigmarkPageCapture | undefined {
  if (line.startsWith('当前页面截图已随消息发送')
    || line.startsWith('A screenshot of the current page travels with this message')) {
    return 'attached'
  }
  if (line.startsWith('当前页面截图未能生成')
    || line.startsWith('The current page could not be captured')) {
    return 'failed'
  }
  if (line.startsWith('本次未附页面截图')
    || line.startsWith('No page screenshot travels with this message')) {
    return 'omitted'
  }
  return undefined
}

/**
 * The nouns a mark line can open with, in either language.
 *
 * A line has to start with one of these to count as a mark. That is what keeps a
 * later sentence that happens to mention a note from being read as another mark, and
 * what makes a mark kind this build does not know end the block rather than corrupt it.
 */
const NOUNS: readonly string[] = [
  '箭头', '矩形', '椭圆', '手绘线', '单点', '元素',
  'arrow', 'box', 'ellipse', 'freehand stroke', 'point', 'element',
]

/** A page prefix on a mark that names which page it belongs to. */
const PAGES: readonly RegExp[] = [/^第 (\d{1,4}) 页 /u, /^page (\d{1,4}) /u]

/**
 * One mark, as the message wrote it.
 *
 * `label` is everything before the note — the kind and its number, then whatever
 * says where the mark is — kept verbatim so nothing this module does not model can
 * be lost from what the reader reads.
 */
export interface FigmarkMarkLine {
  /** The page the mark names, when the message names one. */
  readonly page: number | undefined
  /** The mark's name and position, exactly as written. */
  readonly label: string
  /** The note the reader typed; empty when the message says there is none. */
  readonly comment: string
  /** Whether the message says the mark carries no note. */
  readonly missing: boolean
}

/** Whether a live-page review carried a screenshot, could not make one, or needed none. */
export type FigmarkPageCapture = 'none' | 'omitted' | 'attached' | 'failed'

/** One annotation block, in the terms a card needs. */
export interface FigmarkAnnotation {
  /** The figure's path, as the header names it. */
  readonly file: string
  /** Everything between the header's brackets: scope, size, pages, count. */
  readonly scope: string
  /** The reader's stated goal, or an empty string when the message names none. */
  readonly target: string
  /** The closing instruction, or an empty string when the block has no closer. */
  readonly instruction: string
  /** Whether the marks were made on a rendered document rather than a figure. */
  readonly html: boolean
  /** What the message says about a live-page screenshot. */
  readonly pageCapture: FigmarkPageCapture
  /** The mark list, in the order the message numbers it. */
  readonly marks: readonly FigmarkMarkLine[]
}

/**
 * One block, located in the message that carries it.
 *
 * The shape is the host's: `start`/`end` bound the block, `id` names the rule that
 * found it, and `data` is what a renderer is handed. Nothing here is derived from the
 * DOM, a URL or a fact, because the host compares consecutive reports of the same
 * block by value and only pure data compares equal.
 */
export interface FigmarkTextNode {
  readonly id: string
  readonly start: number
  readonly end: number
  readonly data: FigmarkAnnotation
}

/**
 * A header, split into the figure it names and what the brackets say about it.
 * @param line - the header line, without its newline.
 * @param form - the spelling the scan recognized, so the token is known to be the
 *   line's prefix here.
 * @returns the two halves, or undefined for a header with no path or no scope.
 */
function readHeader(line: string, form: HeaderForm): (HeaderForm & { readonly file: string; readonly scope: string }) | undefined {
  const rest = line.slice(form.token.length).trim()
  // The path runs up to the bracket that opens the scope. It is found from the end
  // because a path may itself contain brackets and the scope's own text never does.
  // Chinese opens the scope with the bracket itself; English opens it with a space
  // before it, so the two spellings differ by one character of offset.
  const at = form.zh ? rest.lastIndexOf('（') : rest.lastIndexOf(' (')
  const open = form.zh ? at : at + 1
  if (at <= 0 || !rest.endsWith(')') && !rest.endsWith('）')) return undefined
  return { ...form, file: rest.slice(0, at).trim(), scope: rest.slice(open + 1, rest.length - 1).trim() }
}

/**
 * Read one mark line.
 * @param line - a trimmed line of the message.
 * @param zh - whether the message is the Chinese spelling.
 * @returns the mark, or undefined for a line that is not one.
 */
function readMark(line: string, zh: boolean): FigmarkMarkLine | undefined {
  const note = NOTE[zh ? 0 : 1]
  let label = line
  let comment = ''
  let missing = false
  if (label.endsWith(note.empty)) {
    label = label.slice(0, label.length - note.empty.length).trimEnd()
    if (label.endsWith(note.comma)) label = label.slice(0, label.length - note.comma.length).trimEnd()
    missing = true
  }
  else {
    // The first separator wins: the note is free prose and may well quote the phrase
    // that separates it, but nothing before it can contain that phrase.
    const at = label.indexOf(note.split)
    if (at < 0) return undefined
    comment = label.slice(at + note.split.length)
    label = label.slice(0, at).trimEnd()
  }
  label = label.trim()
  let page: number | undefined
  for (const pages of PAGES) {
    const match = pages.exec(label)
    if (match === null) continue
    page = Number(match[1])
    label = label.slice(match[0].length)
    break
  }
  const noun = NOUNS.find(candidate => label.startsWith(candidate))
  if (noun === undefined) return undefined
  // A name is the noun and its number, which Chinese runs together and English spaces
  // apart. A line that merely opens like a mark fails here, which is what keeps the
  // card from inventing a row the message does not have.
  const digits = /^ ?\d{1,4}/u.exec(label.slice(noun.length))
  if (digits === null) return undefined
  return { page, label, comment, missing }
}

/**
 * Read the block that starts at a header.
 * @param text - the whole message.
 * @param start - index of the header's first character.
 * @returns the located block, or undefined when nothing after the header parses.
 */
function readBlock(text: string, start: number, form: HeaderForm): FigmarkTextNode | undefined {
  const first = text.indexOf('\n', start)
  const headerEnd = first === -1 ? text.length : first
  const header = readHeader(text.slice(start, headerEnd), form)
  if (header === undefined) return undefined
  const marks: FigmarkMarkLine[] = []
  let target = ''
  let instruction = ''
  let pageCapture: FigmarkPageCapture = 'none'
  let end = headerEnd
  let cursor = first === -1 ? text.length : first + 1
  for (let step = 0; step < MAX_LINES && cursor < text.length; step++) {
    const eol = text.indexOf('\n', cursor)
    const lineEnd = eol === -1 ? text.length : eol
    const raw = text.slice(cursor, lineEnd)
    // The block's end is content, not terminator: a CRLF newline leaves its carriage
    // return outside the range the card covers.
    const contentEnd = raw.endsWith('\r') ? lineEnd - 1 : lineEnd
    const line = raw.trim()
    if (line !== '') {
      if (CLOSERS.has(line)) {
        instruction = line
        end = contentEnd
        break
      }
      const opened = TARGETS.find(token => line.startsWith(token))
      const mark = opened === undefined ? readMark(line, header.zh) : undefined
      const capture = pageCaptureOf(line)
      if (capture !== undefined) {
        pageCapture = capture
        end = contentEnd
      }
      else if (opened !== undefined) {
        target = line.slice(opened.length).trim()
        end = contentEnd
      }
      else if (mark !== undefined) {
        if (marks.length >= MAX_MARKS) break
        marks.push(mark)
        end = contentEnd
      }
      // A line that is neither a mark nor the closing sentence ends the block once the
      // list has begun: the rest of the message is the reader's own prose, and the
      // block must not grow over it. Before the list begins the line is one of the
      // message's own notes about the attachment, and is simply stepped over.
      else if (marks.length > 0) break
    }
    if (eol === -1) break
    cursor = eol + 1
  }
  // A header with no mark under it is not an annotation this build can read; the host
  // then renders the message's own text, which is the safe half of every failure here.
  if (marks.length === 0) return undefined
  return {
    id: RULE_ID,
    start,
    end,
    // The block ends where its last line did, not where its last line's newline was,
    // so the text this reports never carries a trailing blank into the card.
    data: {
      file: header.file,
      scope: header.scope,
      target,
      instruction,
      html: header.html,
      pageCapture,
      marks,
    },
  }
}

/**
 * Find the first header at or after a position.
 * @param text - the whole message.
 * @param from - the position to search from.
 * @returns where the header starts and which spelling it is, or undefined when none
 *   follows.
 */
function nextHeader(text: string, from: number): { readonly at: number; readonly form: HeaderForm } | undefined {
  let best: { readonly at: number; readonly form: HeaderForm } | undefined
  for (const form of HEADERS) {
    const at = text.indexOf(form.token, from)
    if (at !== -1 && (best === undefined || at < best.at)) best = { at, form }
  }
  return best
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
export function matchAnnotation(text: string, from: number): FigmarkTextNode | undefined {
  if (text.length > MAX_TEXT) return undefined
  let at = from
  for (let attempt = 0; attempt < MAX_HEADERS; attempt++) {
    const found = nextHeader(text, at)
    if (found === undefined) return undefined
    const block = readBlock(text, found.at, found.form)
    if (block !== undefined) return block
    at = found.at + 1
  }
  return undefined
}

/**
 * The rule object the host registers.
 *
 * `order` places it ahead of the shipped rules only in the sense of being consulted
 * early; it claims exactly the region it parses and never a character more, so the
 * rules around it keep the rest of the text untouched.
 */
export const annotationRule = {
  id: RULE_ID,
  order: 50,
  match: matchAnnotation,
}
