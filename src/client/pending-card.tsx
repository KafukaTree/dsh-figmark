/**
 * The parked annotation, drawn above the composer.
 *
 * This is the card the reader sees after pressing "send to the input box": the same
 * sheet the transcript will show once it is sent, so the message and the picture are
 * one thing to look at instead of a block of text and an image chip beside it. The
 * draft stays the reader's own — anything they type is sent ahead of the annotation.
 *
 * Nothing here is a second renderer: the sheet is the transcript's own card, drawn
 * static, from the same parsed message. The dock adds only what the dock can do —
 * send it, turn it into editable text, or drop it.
 * @module dsh-figmark/client/pending-card
 */
import { useEffect, useState, type ReactElement } from 'react'
import { AnnotationCard } from './annotation-card'
import { resolveTranslate } from './annotator-contract'
import { insertIntoDraft } from './composer'
import { parkedAnnotation, unparkAnnotation, watchParked, type ParkedAnnotation } from './pending'
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
 * Draw the session's parked annotation, or nothing when it has none.
 * @param props - the dock's props for this session.
 * @returns the card with its three actions.
 */
export function PendingCard(props: PendingCardProps): ReactElement | null {
  const sessionId = props.sessionId ?? ''
  const [entry, setEntry] = useState<ParkedAnnotation | undefined>(() => parkedAnnotation(sessionId))
  const [busy, setBusy] = useState(false)
  const [trouble, setTrouble] = useState('')
  // The stylesheet is injected by whichever body is on screen, and the composer is on
  // screen before any figure is opened. Injecting it is idempotent, so the card asks
  // for it itself rather than depending on an order it cannot see.
  useEffect(() => { ensureStyles(document) }, [])
  useEffect(() => {
    setEntry(parkedAnnotation(sessionId))
    setTrouble('')
    // A card parked while this one was open replaces it; the dock never shows two.
    return watchParked(sessionId, () => {
      setEntry(parkedAnnotation(sessionId))
      setTrouble('')
    })
  }, [sessionId])
  if (entry === undefined) return null
  const conversation = entry.conversation
  const send = async (): Promise<void> => {
    setBusy(true)
    try {
      await entry.send()
      // The message is in the session now, so the card it stood for is spent.
      unparkAnnotation(sessionId)
    } catch (error) {
      setTrouble(`${resolveTranslate(props, 'pendingFailed')}${reasonOf(error)}`)
    } finally {
      setBusy(false)
    }
  }
  const reveal = conversation === undefined
    ? undefined
    : () => {
      try {
        insertIntoDraft(conversation, sessionId, entry.raw)
        unparkAnnotation(sessionId)
      } catch (error) {
        setTrouble(reasonOf(error))
      }
    }
  return (
    <span className="da-pending">
      <AnnotationCard
        node={{ data: entry.data }}
        raw={entry.raw}
        interactive={false}
        t={props.t}
        localeId={props.localeId}
      />
      <span className="da-pending-actions">
        <button
          type="button"
          className="da-pending-send"
          disabled={busy}
          onClick={() => { void send() }}
        >
          {resolveTranslate(props, 'pendingSend')}
        </button>
        {reveal === undefined ? null : (
          <button type="button" className="da-pending-reveal" onClick={reveal}>
            {resolveTranslate(props, 'pendingReveal')}
          </button>
        )}
        <button
          type="button"
          className="da-pending-drop"
          onClick={() => { unparkAnnotation(sessionId) }}
        >
          {resolveTranslate(props, 'pendingDrop')}
        </button>
      </span>
      {trouble === '' ? null : <span className="da-pending-trouble">{trouble}</span>}
    </span>
  )
}
