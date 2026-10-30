/**
 * The parked annotation, drawn inside the composer as an attachment card.
 *
 * The composer is a lexical editor owned by the conversation package: nothing can be
 * written into it that stays a card, and the whole annotation block sitting in the
 * input box is exactly what a reader cannot scan. So the block waits beside the
 * reader's own attachments instead, as a chip shaped like one — the figure's
 * thumbnail, how many marks it carries, the file's name, and the first mark's note.
 * It is portalled into the composer card's own flow (see `composer-seat`), so it
 * sits where an attached picture sits; the dock entry that owns it holds only the
 * anchor, and falls back to drawing in the dock itself when there is no card.
 *
 * What the card shows and what it hides is the point. A dimension or a pair of
 * coordinates is not something to read at a glance, so it stays in the block the model
 * reads and in the hover title, and never on the face: the face says the figure and the
 * count first, the note second, and truncates both rather than wrapping into a wall of
 * text.
 *
 * The draft stays the reader's own — this card is not a message part, and nothing is
 * added to the input. Sending is the card's job, and it delivers the same message the
 * transcript card shows afterwards.
 * @module dsh-figmark/client/pending-card
 */
import { useLayoutEffect, useEffect, useRef, useState, type ReactElement } from 'react'
import { createPortal } from 'react-dom'
import { resolveTranslate } from './annotator-contract'
import { thumbFor } from './annotation-thumb'
import { mountSeat } from './composer-seat'
import { parkedAnnotations, unparkAnnotation, watchParked, type ParkedAnnotation } from './pending'
import { ensureStyles } from './styles'
import type { Translate } from './translate'

/** What the input dock hands this card. */
export interface PendingCardProps {
  /** Session the composer belongs to, passed by the slot's inject factory. */
  readonly sessionId?: string | undefined
  /** Translator seat, when the shell bound one for this slot. */
  readonly t?: Translate | undefined
  /** Locale tag the seat fell back from. */
  readonly localeId?: string | undefined
}

/**
 * The message one thrown value carries.
 * @param error - whatever was thrown.
 * @returns the text to show under the card.
 */
function reasonOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/**
 * The picture a card shows when it has no thumbnail of the figure.
 * @returns the glyph.
 */
function FigureIcon(): ReactElement {
  return (
    <svg className="da-staged-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 5.5h16M4 18.5h16M7 9.5h5M7 13.5h8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="17.5" cy="9.5" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

/**
 * The small outline that stands for a mark's shape on the card's one line.
 * @returns the glyph.
 */
function MarkIcon(): ReactElement {
  return (
    <svg className="da-staged-mark-icon" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <rect x="1" y="2" width="10" height="8" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  )
}

/**
 * A mark's name without its coordinates: the kind and its number, which is what a
 * reader recognises, with a space between the two the way the product writes it.
 * @param label - the mark's own name, coordinates and all.
 * @returns the short name.
 */
export function shortLabel(label: string): string {
  const head = label.replace(/\s*(?:位于\s*|[（(]).*$/u, '').trim()
  // "箭头1" reads better as "箭头 1"; a name that already says "box 1" must not gain a
  // second space on the way through the same rule.
  return head.replace(/^(\D*?)(\d+)$/u, '$1 $2').replace(/\s+/gu, ' ').trim()
}

/**
 * One parked card: its own delivery, its own failure, its own way out.
 * @param props - the card, the session it belongs to, and the shell's translator.
 * @returns the chip, with its one action and its remove control.
 */
function ParkedChip(props: {
  readonly entry: ParkedAnnotation
  readonly sessionId: string
  readonly t?: Translate | undefined
  readonly localeId?: string | undefined
}): ReactElement {
  const { entry, sessionId } = props
  const [busy, setBusy] = useState(false)
  const [trouble, setTrouble] = useState('')
  const [shot, setShot] = useState(true)
  // The disabled button is a face, not a promise: two presses can land in one tick,
  // before the first render has had a chance to disable anything.
  const sending = useRef(false)
  const data = entry.data
  const thumb = shot ? thumbFor(entry.raw) : undefined
  const send = async (): Promise<void> => {
    if (sending.current) return
    sending.current = true
    setBusy(true)
    try {
      await entry.send()
      // The message is in the session now, so the card it stood for is spent — and
      // only that card: its neighbours are reviews the reader has not sent yet.
      unparkAnnotation(sessionId, entry.id)
    } catch (error) {
      setTrouble(`${resolveTranslate(props, 'pendingFailed')}${reasonOf(error)}`)
    } finally {
      sending.current = false
      setBusy(false)
    }
  }
  // The block names a path; a reader scanning the composer needs the file's own name
  // more than the directory, which is the same for every figure this session saved.
  const cut = Math.max(data.file.lastIndexOf('/'), data.file.lastIndexOf('\\'))
  const name = data.file.slice(cut + 1)
  const first = data.marks[0]
  const note = first === undefined || first.comment === ''
    ? resolveTranslate(props, 'emptyDetail')
    : first.comment
  const detail = first === undefined
    ? name
    : `${first.label} · ${resolveTranslate(props, 'pendingNote')}：${note}`
  const hover = data.scope === '' ? data.file : `${data.file} · ${data.scope}`
  const removeLabel = resolveTranslate(props, 'pendingRemove')
  return (
    <span className="da-staged">
      <span className="da-staged-card" title={hover}>
        <button
          type="button"
          className="da-staged-open"
          disabled={busy}
          title={resolveTranslate(props, 'pendingSendHint')}
          onClick={() => { void send() }}
        >
          <span className="da-staged-shot">
            <FigureIcon />
            {thumb === undefined ? null : (
              <img
                alt=""
                src={thumb}
                onError={() => { setShot(false) }}
              />
            )}
          </span>
          <span className="da-staged-text">
            <span className="da-staged-head">
              <span className="da-staged-title">{resolveTranslate(props, 'title')}</span>
              <span className="da-staged-count">
                {resolveTranslate(props, 'pendingCount', { n: data.marks.length })}
              </span>
            </span>
            <span className="da-staged-file">{name}</span>
            {first === undefined ? null : (
              <span className="da-staged-line" title={detail}>
                <MarkIcon />
                <span className="da-staged-shape">{shortLabel(first.label)}</span>
                <span className="da-staged-note">{resolveTranslate(props, 'pendingNote')}</span>
                <span className="da-staged-said">{note}</span>
              </span>
            )}
          </span>
        </button>
        <button
          type="button"
          className="da-staged-x"
          aria-label={removeLabel}
          title={removeLabel}
          disabled={busy}
          onClick={() => { unparkAnnotation(sessionId, entry.id) }}
        >
          ×
        </button>
      </span>
      {trouble === '' ? null : <span className="da-staged-trouble">{trouble}</span>}
    </span>
  )
}

/**
 * Draw the session's parked annotations, oldest first, or nothing when it has none.
 *
 * One seat for the whole queue: the composer card owns one attachment area, and the
 * chips stack inside it the way several attached pictures do.
 * @param props - the dock's props for this session.
 * @returns the attachment cards, each with its own action and remove control.
 */
export function PendingCard(props: PendingCardProps): ReactElement | null {
  const sessionId = props.sessionId ?? ''
  const [entries, setEntries] = useState<readonly ParkedAnnotation[]>(() => parkedAnnotations(sessionId))
  // The stylesheet is injected by whichever body is on screen, and the composer is on
  // screen before any figure is opened. Injecting it is idempotent, so the cards ask
  // for it themselves rather than depending on an order they cannot see.
  useEffect(() => { ensureStyles(document) }, [])
  useEffect(() => {
    setEntries(parkedAnnotations(sessionId))
    return watchParked(sessionId, () => { setEntries(parkedAnnotations(sessionId)) })
  }, [sessionId])
  // Seated inside the composer card, or — with no card to draw into — in the dock that
  // owns these entries. The anchor is the only node this component puts in the dock.
  const anchor = useRef<HTMLSpanElement | null>(null)
  const [seat, setSeat] = useState<HTMLElement | null>(null)
  const parked = entries.length > 0
  useLayoutEffect(() => {
    const node = anchor.current
    if (node === null) return undefined
    return mountSeat(node, setSeat)
  }, [sessionId, parked])
  if (!parked) return null
  const cards = (
    <>
      {entries.map(entry => (
        <ParkedChip
          key={entry.id}
          entry={entry}
          sessionId={sessionId}
          t={props.t}
          localeId={props.localeId}
        />
      ))}
    </>
  )
  return (
    <>
      <span className="da-staged-anchor" ref={anchor} hidden />
      {seat === null ? cards : createPortal(cards, seat)}
    </>
  )
}
