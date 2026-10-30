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
import type { FigmarkAnnotation, FigmarkMarkLine } from './annotation-rule'
import { thumbFor } from './annotation-thumb'
import { resolveTranslate } from './annotator-contract'
import { ensureStyles } from './styles'
import type { Translate } from './translate'

/** How many marks a card lists before it stops counting them one by one. */
const MAX_ROWS = 5

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
  readonly open?: ((path: string) => void) | undefined
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
  const { file, scope, marks, target, instruction, html } = data
  if (typeof file !== 'string' || file === '' || typeof scope !== 'string') return undefined
  if (!Array.isArray(marks)) return undefined
  const parsed: FigmarkMarkLine[] = []
  for (const entry of marks) {
    const mark = readMark(entry)
    if (mark === undefined) return undefined
    parsed.push(mark)
  }
  return {
    file,
    scope,
    marks: parsed,
    // Both are strings in the block itself, empty when the message said neither:
    // the card draws a row only for a goal the reader wrote.
    target: typeof target === 'string' ? target : '',
    instruction: typeof instruction === 'string' ? instruction : '',
    html: html === true,
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
function CardRow({ mark, page }: { readonly mark: FigmarkMarkLine; readonly page?: string | undefined }): ReactElement {
  const said = mark.comment === '' ? undefined : mark.comment
  return (
    <span className="da-card-row">
      <span className="da-card-mark">
        {page === undefined ? null : <span className="da-card-page">{page}</span>}
        {mark.label}
      </span>
      {said === undefined ? null : <span className="da-card-said">{said}</span>}
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
  // The block names a path; a reader scanning the transcript needs the file's own
  // name more than the directory it lives in, which is the same for every figure
  // this session saved. The scope the header wrote (size, pages, count) stays after
  // it, because that is what a mark's coordinates are read against.
  const cut = Math.max(data.file.lastIndexOf('/'), data.file.lastIndexOf('\\'))
  const name = data.file.slice(cut + 1)
  const scopeLine = data.scope === '' ? name : `${name} · ${data.scope}`
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
        <span className="da-card-title">{resolveTranslate(props, 'title')}</span>
        <span className="da-card-scope">{scopeLine}</span>
      </span>
      {interactive ? <span className="da-card-go" aria-hidden="true">›</span> : null}
    </span>
  )
  /* The dock's card is the same sentence at a glance: it has no figure to open and
     no room for the list, so it stops after the head. */
  const body = interactive ? (
    <span className="da-card-body">
      {shown.map((mark, index) => (
        <CardRow
          key={`${String(mark.page ?? '')}-${String(index)}`}
          mark={mark}
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
  ) : null
  const onClick = interactive && open !== undefined
    ? () => { open(data.file) }
    : undefined
  if (onClick === undefined) {
    return <span className="da-card" data-static="">{head}{body}</span>
  }
  return (
    <button
      type="button"
      className="da-card"
      title={`${resolveTranslate(props, 'cardOpen')} — ${data.file}`}
      onClick={onClick}
    >
      {head}
      {body}
    </button>
  )
}
