/**
 * Reviews staged beside the composer. The chip previews its immutable payload;
 * the native composer Send carries armed reviews, with or without typed text.
 * Older hosts without draft admission retain a direct-delivery fallback.
 * @module dsh-figmark/client/pending-card
 */
import { useLayoutEffect, useEffect, useId, useRef, useState, type ReactElement } from 'react'
import { createPortal } from 'react-dom'
import { resolveTranslate } from './annotator-contract'
import { thumbFor } from './annotation-thumb'
import { AnnotationCard } from './annotation-card'
import { annotationSubject } from './annotation-subject'
import { mountSeat } from './composer-seat'
import { disarmReview, holdSubmit } from './composer'
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
  readonly onWarnings: (warnings: readonly string[]) => void
}): ReactElement {
  const { entry, sessionId } = props
  const [busy, setBusy] = useState(false)
  const [trouble, setTrouble] = useState('')
  const [shot, setShot] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const detailId = useId()
  // The disabled button is a face, not a promise: two presses can land in one tick,
  // before the first render has had a chance to disable anything.
  const sending = useRef(false)
  const armed = entry.armed
  const data = entry.data
  const thumb = shot ? thumbFor(entry.raw) : undefined
  const send = async (): Promise<void> => {
    if (sending.current) return
    setTrouble('')
    sending.current = true
    setBusy(true)
    try {
      const warnings = await entry.send()
      if (warnings.length > 0) props.onWarnings(warnings)
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
  // The merge hangs on the box's own send, because that is the only seam the button,
  // Enter and the queue all pass through. Hooking only while the card is on screen is
  // what keeps a later press from carrying a review the reader has taken back.
  useEffect(() => {
    if (armed === undefined) return undefined
    return holdSubmit(armed, () => { unparkAnnotation(sessionId, entry.id) })
  }, [armed, entry.id, sessionId])
  const subject = annotationSubject(data)
  const name = subject.name
  const first = data.marks[0]
  const captureNotice = subject.live && thumb === undefined
    ? data.pageCapture === 'omitted'
      ? resolveTranslate(props, 'cardCaptureOmitted')
      : data.pageCapture === 'failed'
        ? resolveTranslate(props, 'cardCaptureFailed')
        : ''
    : ''
  const detail = first === undefined
    ? name
    : first.comment === '' ? first.label : `${first.label} · ${first.comment}`
  const hover = data.scope === '' ? data.file : `${data.file} · ${data.scope}`
  const removeLabel = resolveTranslate(props, 'pendingRemove')
  const hint = resolveTranslate(props, 'pendingSendNow')
  return (
    <span className="da-staged">
      <span className="da-staged-card" title={hover}>
        <button
          type="button"
          className="da-staged-open"
          aria-expanded={expanded}
          aria-controls={detailId}
          title={resolveTranslate(props, expanded ? 'cardCollapse' : 'cardExpand')}
          onClick={() => { setExpanded(value => !value) }}
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
              <span className="da-staged-title" title={name}>{name}</span>
              {captureNotice === '' ? null : (
                <span className="da-staged-capture">{captureNotice}</span>
              )}
              <span
                className="da-staged-count"
                aria-label={resolveTranslate(props, 'cardCount', { n: data.marks.length })}
              >
                {resolveTranslate(props, 'pendingCount', { n: data.marks.length })}
              </span>
            </span>
            <span className="da-staged-type">{subject.badge}</span>
            {first === undefined ? null : (
              <span className="da-staged-line" title={detail}>
                {first.page === undefined ? null : <span className="da-card-page">{resolveTranslate(props, 'cardPage', { n: first.page })}</span>}
                <span className="da-staged-shape">{shortLabel(first.label)}</span>
                {first.comment === '' ? null : <span className="da-staged-said">{first.comment}</span>}
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
          onClick={() => {
            if (sending.current) return
            // Taking the card off takes what it armed with it: a picture left in the
            // draft after the card was dropped would ride the next press of Send.
            if (armed !== undefined) disarmReview(armed, entry.conversation)
            unparkAnnotation(sessionId, entry.id)
          }}
        >
          ×
        </button>
      </span>
      <span id={detailId} className="da-staged-details" hidden={!expanded}>
        {expanded ? (
          <AnnotationCard
            node={{ data }}
            raw={entry.raw}
            interactive={false}
            embedded
            t={props.t}
            localeId={props.localeId}
          />
        ) : null}
      </span>
      {armed === undefined ? <button type="button" className="da-staged-send" disabled={busy} title={hint}
        onClick={() => { void send() }}>
        {resolveTranslate(props, busy ? 'pendingSending' : 'pendingSendNow')}
      </button> : null}
      {trouble === '' ? null : <span className="da-staged-trouble" role="alert">{trouble}</span>}
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
  /** Delivery warnings stay after their card leaves, because the message already went. */
  const [warnings, setWarnings] = useState<readonly string[]>([])
  // The stylesheet is injected by whichever body is on screen, and the composer is on
  // screen before any figure is opened. Injecting it is idempotent, so the cards ask
  // for it themselves rather than depending on an order they cannot see.
  useEffect(() => { ensureStyles(document) }, [])
  useEffect(() => {
    setWarnings([])
    setEntries(parkedAnnotations(sessionId))
    return watchParked(sessionId, () => { setEntries(parkedAnnotations(sessionId)) })
  }, [sessionId])
  // Seated inside the composer card, or — with no card to draw into — in the dock that
  // owns these entries. The anchor is the only node this component puts in the dock.
  const anchor = useRef<HTMLSpanElement | null>(null)
  const [seat, setSeat] = useState<HTMLElement | null>(null)
  const parked = entries.length > 0
  const showing = parked || warnings.length > 0
  useLayoutEffect(() => {
    const node = anchor.current
    if (node === null) return undefined
    return mountSeat(node, setSeat)
  }, [sessionId, showing])
  if (!showing) return null
  // Hide only the native thumbnails represented by these review cards. Other
  // attachments remain visible, and sent-message attachments are never targeted.
  const previews = entries.flatMap(entry => entry.armed?.previewUrls ?? [])
  const owned = previews.map(url => `img[src=${JSON.stringify(url)}]`).join(',')
  const thumbnailStyle = owned === '' ? null : <style>{`
    [data-composer-card] [role="group"] > div:has(${owned}){display:none}
    [data-composer-card] > div:has(> div > [role="group"]):not(:has([role="group"] > div:not(:has(${owned})))){display:none}
  `}</style>
  const cards = (
    <>
      {entries.map(entry => (
        <ParkedChip
          key={entry.id}
          entry={entry}
          sessionId={sessionId}
          t={props.t}
          localeId={props.localeId}
          onWarnings={(each) => {
            setWarnings(current => [
              ...current,
              ...each.filter(warning => !current.includes(warning)),
            ])
          }}
        />
      ))}
    </>
  )
  const report = warnings.length === 0 ? null : (
    <span className="da-staged-result" role="status">
      <span className="da-staged-result-text">{warnings.join(' ')}</span>
      <button
        type="button"
        className="da-staged-result-x"
        aria-label={resolveTranslate(props, 'close')}
        title={resolveTranslate(props, 'close')}
        onClick={() => { setWarnings([]) }}
      >
        ×
      </button>
    </span>
  )
  return (
    <>
      <span className="da-staged-anchor" ref={anchor} hidden />
      {thumbnailStyle}
      {seat === null
        ? <>{cards}{report}</>
        : createPortal(<>{cards}{report}</>, seat)}
    </>
  )
}
