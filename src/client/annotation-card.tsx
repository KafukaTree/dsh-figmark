/**
 * The annotation a reader sent, as a card inside their own bubble.
 *
 * The message still says everything it said — the model reads the same text,
 * copying it copies the same text — but in the transcript the same block is easier
 * to scan as a small sheet: which figure, how large, how many marks, and what each
 * of them asked for. Clicking it opens the figure in the Sidebar, where the full
 * annotator (and every mark, at full size) already is.
 *
 * Two rules keep this a view and nothing more. It reads the block it was dispatched
 * for and never edits it; and it draws from the parsed data alone, so a block whose
 * data a future version spells differently falls back to plain text rather than to a
 * broken card.
 * @module dsh-figmark/client/annotation-card
 */
import { useEffect, useState, type ReactElement } from 'react'
import type { FigmarkAnnotation, FigmarkMarkLine, FigmarkPageCapture } from './annotation-rule'
import { thumbFor } from './annotation-thumb'
import { resolveTranslate } from './annotator-contract'
import { loopbackAddressOf } from './live-page'
import { ensureStyles } from './styles'
import type { Translate } from './translate'

/** How many marks a card lists before it stops counting them one by one. */
const MAX_ROWS = 5

/** The parts of a delivered mark line that a reader scans at different levels. */
export interface CardMarkLabel {
  /** The kind and ordinal, spaced for reading rather than for parsing. */
  readonly name: string
  /** The mark's position, kept as the message wrote it. */
  readonly geometry: string
  /** The element's opening tag, when the mark names one. */
  readonly tag: string
  /** The element's own words, when the message carried a short name for it. */
  readonly element: string
  /** The selector or opening tag that locates the element in the source. */
  readonly locator: string
  /** A warning appended by the summary, such as a mark outside the figure. */
  readonly aside: string
}

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
export function readCardMarkLabel(label: string): CardMarkLabel {
  const named = /^(.+?\d{1,4})(?=\s|$)/u.exec(label)
  const rawName = named?.[1] ?? label
  const rest = label.slice(rawName.length).trim()
  const geometry = /^(?:位于\s*|at\s*)?\([^)]*\)(?:\s*(?:→|->|–|-)\s*\([^)]*\))?/u.exec(rest)?.[0] ?? ''
  const elementMatch = /(?:元素标题|元素文字|element title|element text)\s*(?:「([^」]*)」|"([^"]*)")/u.exec(label)
  const element = elementMatch?.[1] ?? elementMatch?.[2] ?? ''
  const aside = /[（(](?:超出图面|outside)[^）)]*[）)]/iu.exec(label)?.[0] ?? ''
  // A selector may itself contain parentheses, as `:nth-of-type(1)` does. The source
  // always puts it last in the anchor, so read to the end and remove the anchor's one
  // closing bracket rather than stopping at the selector's first `)`.
  const selector = /(?:选择器|selector)\s+(.+)$/u.exec(label.replace(aside, ''))?.[1]
    ?.replace(/\s*[)）]\s*$/u, '')
    .trim() ?? ''
  const openingTag = /<([a-z][\w-]*)\b[^>]*>/iu.exec(label)?.[0] ?? ''
  const tagName = /^<([a-z][\w-]*)\b/iu.exec(openingTag)?.[1]
  const tag = tagName === undefined ? '' : `<${tagName.toLowerCase()}>`
  return {
    name: rawName.replace(/^(.+?)(\d+)$/u, '$1 $2').replace(/\s+/gu, ' ').trim(),
    geometry,
    tag,
    element,
    locator: selector === '' ? openingTag : selector,
    aside,
  }
}

/** What a keyed user-text renderer is handed for this block. */
export interface AnnotationCardProps {
  /** The text node the rule produced, whose `data` is the parsed block. */
  readonly node?: { readonly data?: unknown } | undefined
  /** The block exactly as the model reads it; also the key its thumbnail is under. */
  readonly raw?: string | undefined
  /** False in the queue dock, where the message is not a sent bubble yet. */
  readonly interactive?: boolean | undefined
  /** Session the bubble belongs to, when the slot hands one over. */
  readonly sessionId?: string | undefined
  /** Translator seat, when the shell bound one for this slot. */
  readonly t?: Translate | undefined
  /** Locale tag the seat fell back from. */
  readonly localeId?: string | undefined
  /** Open one figure in the Sidebar; absent when this composition has no Sidebar. */
  readonly open?: ((path: string, html: boolean) => void) | undefined
  /** Whether this composition has the matching Sidebar entry point. */
  readonly canOpen?: ((path: string, html: boolean) => boolean) | undefined
}

/**
 * Narrow one unknown value to a record.
 * @param value - any value out of JSON.
 * @returns whether it is a non-array object.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Read one mark line back out of the node's JSON.
 * @param value - one entry of `data.marks`.
 * @returns the line, or undefined when it is not one.
 */
function readMark(value: unknown): FigmarkMarkLine | undefined {
  if (!isRecord(value)) return undefined
  const { label, comment, missing, page } = value
  if (typeof label !== 'string' || typeof comment !== 'string') return undefined
  return {
    label,
    comment,
    missing: missing === true,
    page: typeof page === 'number' ? page : undefined,
  }
}

/**
 * Read the annotation out of the node's data.
 *
 * Only the fields the card draws are required. A node that fails this check is not
 * an annotation as far as this version is concerned, and the caller shows the text.
 * @param data - the node's `data`.
 * @returns the parsed block, or undefined.
 */
export function readAnnotation(data: unknown): FigmarkAnnotation | undefined {
  if (!isRecord(data)) return undefined
  const { file, scope, marks, target, instruction, html, pageCapture } = data
  if (typeof file !== 'string' || file === '' || typeof scope !== 'string') return undefined
  if (!Array.isArray(marks)) return undefined
  const parsed: FigmarkMarkLine[] = []
  for (const entry of marks) {
    const mark = readMark(entry)
    if (mark === undefined) return undefined
    parsed.push(mark)
  }
  const capture: FigmarkPageCapture = pageCapture === 'omitted'
    || pageCapture === 'attached'
    || pageCapture === 'failed'
    ? pageCapture
    : 'none'
  return {
    file,
    scope,
    marks: parsed,
    // Both are strings in the block itself, empty when the message said neither:
    // the card draws a row only for a goal the reader wrote.
    target: typeof target === 'string' ? target : '',
    instruction: typeof instruction === 'string' ? instruction : '',
    html: html === true,
    pageCapture: capture,
  }
}

/** The glyph a card shows when it has no picture of the figure. */
function SheetIcon(): ReactElement {
  return (
    <svg className="da-card-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 5.5h16M4 18.5h16M7 9.5h5M7 13.5h8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="17.5" cy="9.5" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
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
function CardRow(props: {
  readonly mark: FigmarkMarkLine
  readonly ordinal: number
  readonly page?: string | undefined
}): ReactElement {
  const { mark, ordinal, page } = props
  const said = mark.comment === '' ? undefined : mark.comment
  const parts = readCardMarkLabel(mark.label)
  // The badge carries the order, so the words beside it need not repeat "arrow 1" or
  // "element 2". An element uses its own living text; a drawing uses the tool's noun.
  const kind = parts.name.replace(/\s*\d+$/u, '')
  const label = parts.element === '' ? kind : parts.element
  return (
    <span className="da-card-row" title={mark.label}>
      <span className="da-card-row-head">
        <span className="da-card-kind" aria-hidden="true">{ordinal}</span>
        <span className="da-card-mark">
          {page === undefined ? null : <span className="da-card-page">{page}</span>}
          {parts.tag === '' ? null : <span className="da-card-tag">{parts.tag}</span>}
          <span className="da-card-name">{label}</span>
        </span>
        {/* An element's living text is its strongest locator. Coordinates there would
            squeeze that text into an ellipsis on the narrow transcript card; they
            remain in the row's tooltip and in the message the model reads. */}
        {parts.geometry === '' || parts.tag !== '' ? null : (
          <span className="da-card-geometry">{parts.geometry}</span>
        )}
      </span>
      {said === undefined ? null : <span className="da-card-said">{said}</span>}
      {parts.aside === '' ? null : <span className="da-card-warning">{parts.aside}</span>}
    </span>
  )
}

/**
 * Render one annotation block as a card.
 * @param props - the slot's props for this block.
 * @returns the card, or the block's own text when its data is not one it can draw.
 */
export function AnnotationCard(props: AnnotationCardProps): ReactElement {
  const [shot, setShot] = useState(true)
  // The stylesheet is injected by whichever body is on screen, and a transcript can
  // be drawn long before any figure is opened. Injecting it is idempotent, so the
  // card asks for it itself rather than depending on an order it cannot see.
  useEffect(() => { ensureStyles(document) }, [])
  const data = readAnnotation(props.node?.data)
  const raw = props.raw ?? ''
  if (data === undefined) return <span className="da-card-fallback">{raw}</span>
  const interactive = props.interactive !== false
  const open = props.open
  const thumb = shot ? thumbFor(raw) : undefined
  const shown = data.marks.slice(0, MAX_ROWS)
  const rest = data.marks.length - shown.length
  const liveFile = data.html && loopbackAddressOf(data.file) !== undefined
  const displayFile = liveFile ? data.file.replace(/[?#].*$/u, '') : data.file
  const captureNotice = liveFile && thumb === undefined
    ? data.pageCapture === 'omitted'
      ? resolveTranslate(props, 'cardCaptureOmitted')
      : data.pageCapture === 'failed'
        ? resolveTranslate(props, 'cardCaptureFailed')
        : ''
    : ''
  const canOpen = interactive
    && open !== undefined
    && (props.canOpen?.(data.file, data.html) ?? true)
  // The block names a path; a reader scanning the transcript needs the file's own
  // name more than the directory it lives in, which is the same for every figure
  // this session saved. The scope the header wrote (size, pages, count) stays after
  // it, because that is what a mark's coordinates are read against.
  const cut = Math.max(displayFile.lastIndexOf('/'), displayFile.lastIndexOf('\\'))
  const name = displayFile.slice(cut + 1)
  // The message's scope has to remain in the model-facing text. On the card, its
  // dimensions and count are enough for a glance; the complete phrase stays in the
  // row's tooltip instead of wrapping across two Chinese sentences.
  const dimensions = /(\d+)\s*[×x]\s*(\d+)/u.exec(data.scope)
  const size = dimensions === null ? '' : `${dimensions[1]}×${dimensions[2]}`
  const head = (
    <span className="da-card-head">
      <span className="da-card-shot">
        <SheetIcon />
        {thumb === undefined ? null : (
          <img
            alt=""
            src={thumb}
            onError={() => { setShot(false) }}
          />
        )}
      </span>
      <span className="da-card-text">
        <span className="da-card-title-row">
          <span className="da-card-title">{name}</span>
          <span className="da-card-type">{data.html ? 'HTML' : 'FIG'}</span>
          {captureNotice === '' ? null : (
            <span className="da-card-capture">{captureNotice}</span>
          )}
        </span>
        <span className="da-card-scope">
          {size === '' ? null : <span className="da-card-meta" title={data.scope}>{size}</span>}
          <span
            className="da-card-tally"
            aria-label={resolveTranslate(props, 'cardCount', { n: data.marks.length })}
            title={data.scope}
          >
            {data.marks.length}
          </span>
        </span>
      </span>
      {canOpen ? (
        <span className="da-card-go" aria-hidden="true">
          <svg viewBox="0 0 16 16" focusable="false">
            <path d="m6 3.5 4.5 4.5L6 12.5" />
          </svg>
        </span>
      ) : null}
    </span>
  )
  /* The same sheet wherever it stands: the dock's card is the last look the reader
     gets at the message before it is sent, and a head-only version would hide the
     very lines that are about to go. What changes without an opener is the button
     around it, not the contents. */
  const body = (
    <span className="da-card-body">
      {shown.map((mark, index) => (
        <CardRow
          key={`${String(mark.page ?? '')}-${String(index)}`}
          mark={mark}
          ordinal={index + 1}
          page={mark.page === undefined ? undefined : resolveTranslate(props, 'cardPage', { n: mark.page })}
        />
      ))}
      {rest > 0 ? <span className="da-card-row da-card-rest">{resolveTranslate(props, 'cardMore', { n: rest })}</span> : null}
      {data.target === '' ? null : (
        <span className="da-card-row da-card-target">
          <span className="da-card-goal">{resolveTranslate(props, 'cardGoal')}</span>
          {data.target}
        </span>
      )}
    </span>
  )
  const onClick = canOpen && open !== undefined
    ? () => { open(data.file, data.html) }
    : undefined
  if (onClick === undefined) {
    return <span className="da-card" data-static="">{head}{body}</span>
  }
  return (
    <button
      type="button"
      className="da-card"
      title={`${resolveTranslate(props, liveFile ? 'cardOpenLive' : 'cardOpen')} — ${displayFile}`}
      onClick={onClick}
    >
      {head}
      {body}
    </button>
  )
}
