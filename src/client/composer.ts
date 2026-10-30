/**
 * Putting one annotation above the composer without sending it.
 *
 * "Send to the agent" hands the message straight to the session; this module is the
 * other half of that pair — the annotation is parked as a card in the input dock, the
 * reader adds a sentence of their own to the box if they want one, and the card's own
 * send delivers the same message the direct button would have sent.
 *
 * The card rather than the draft is the whole point. The composer is a lexical editor
 * owned by the conversation package and it draws text as text: a block written into
 * it, with its pictures staged beside it in the attachment rail, was two halves of one
 * thing the reader then had to reconcile by hand. Parked, the picture and the message
 * are one card, and nothing has to be deleted from the draft before typing into it.
 *
 * Writing into the editor is still available — a reader who wants to edit the message
 * itself gets it verbatim — through the same action face, because writing the DOM
 * directly would desynchronise the editor's revision counter.
 * @module dsh-figmark/client/composer
 */
import type { AnnotationDocument, SummaryLocale } from '../shared/annotation'
import { buildAnnotationMessage, type DeliveredPaths } from './annotation-message'
import { matchAnnotation } from './annotation-rule'
import { rememberDelivered } from './annotation-thumb'
import { parkAnnotation } from './pending'

/** The per-session input shell the composer is bound to. */
export interface ComposerShellLike {
  /** The live input state, of which only the draft text is read here. */
  readonly snapshot: { readonly draft: string }
  /** Replace the draft; the caret lands at the end. */
  setDraft(text: string): void
}

/** The conversation service slice this module calls. */
export interface ComposerLike {
  /** Per-session composer registry. */
  readonly input: {
    /**
     * The resident input shell for one session.
     * @param id - session id.
     * @returns the shell, created on demand and seeded with the reader's draft.
     */
    shell(id: string): ComposerShellLike
  }
}

/** Everything one parked annotation needs. */
export interface ParkInput {
  /** The conversation service, when the composition provides one. */
  readonly conversation: ComposerLike | undefined
  /** Session the figure belongs to. */
  readonly sessionId: string
  /** The saved annotation document. */
  readonly document: AnnotationDocument
  /** Paths the Host wrote. */
  readonly paths: DeliveredPaths
  /** A 120px picture of the review, for the card and for the bubble it lands in. */
  readonly thumb: string | undefined
  /** Message language. */
  readonly locale: SummaryLocale
  /** Hand the message to the session, exactly as the direct button does. */
  readonly send: () => Promise<void>
}

/**
 * Park one annotation above the composer, as a card, without sending it.
 *
 * The message is built before anything is parked: the card is the parsed message, so
 * the reader is looking at the very text that will be delivered, and a parser that
 * stopped recognising it would leave the card showing that text rather than a card
 * that promises something the send does not do.
 * @param input - the annotation and the delivery the card stands for.
 */
export function parkInComposer(input: ParkInput): void {
  const { document: document_, locale, paths, sessionId } = input
  const message = buildAnnotationMessage(document_, paths, locale)
  // The bubble this message will land in cannot reach the message's attachments, so
  // the card there looks its picture up by the message text. Filing it now means the
  // picture is already there when the send puts the bubble on screen.
  rememberDelivered(message, input.thumb)
  const block = matchAnnotation(message, 0)
  parkAnnotation({
    sessionId,
    data: block?.data ?? {
      file: document_.figure.path,
      scope: '',
      target: '',
      instruction: '',
      html: false,
      marks: [],
    },
    raw: message,
    conversation: input.conversation,
    send: input.send,
  })
}

/**
 * Write one parked message into the composer draft instead, without sending.
 *
 * The message is appended rather than substituted: the reader may already have half a
 * sentence in the box, and losing it to a button press would be a worse failure than a
 * long draft.
 * @param conversation - the composer service.
 * @param sessionId - session the draft belongs to.
 * @param message - the message, verbatim.
 * @throws {Error} when the session has no composer to write into.
 */
export function insertIntoDraft(
  conversation: ComposerLike,
  sessionId: string,
  message: string,
): void {
  let shell: ComposerShellLike
  try {
    shell = conversation.input.shell(sessionId)
  } catch {
    // The registry only has shells for sessions the app is still holding. A figure
    // opened from a session that has since been dropped has nowhere to be written
    // into, and the registry's own message names the registry, not the reader's
    // problem.
    throw new Error('the session has no composer to write into')
  }
  // `trim` decides only whether there is anything to separate; the draft itself is
  // kept exactly as it was written. Trimming it removed the reader's own shape — the
  // two spaces that make a fenced block a code block, the blank lines that end a
  // paragraph — and in a Markdown draft that shape is what the agent reads. Appending
  // is not supposed to cost anything for being appended to.
  const existing = shell.snapshot.draft
  const room = existing.trim() === ''
  shell.setDraft(room ? message : `${existing}\n\n${message}`)
}
