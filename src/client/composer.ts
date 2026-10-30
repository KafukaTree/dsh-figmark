/**
 * Putting one annotation above the composer without sending it.
 *
 * "Send to the agent" hands the message straight to the session; this module is the
 * other half of that pair: the annotation is staged in the composer — its message in
 * the draft, its review picture in the draft's attachment rail — and a card in the
 * input dock stands for what was staged. The reader adds a sentence of their own if
 * they want one and presses the box's own send, which carries the whole thing at once.
 *
 * Staging is what makes one press enough. A card that sends itself is a second send
 * button next to the real one, and a reader who types a sentence and presses send gets
 * the sentence only — the review stays behind in the dock, which is a worse hand-off
 * than no staging at all. So the message goes where the box's send can see it, and the
 * card is a receipt for it: it says what is staged, and its own send runs the same
 * send the button does.
 *
 * Nothing here reaches into the editor: the draft is written through the shell, the
 * attachment is created by the conversation service, and both are ordinary draft state
 * afterwards — the reader can delete either one by hand and the card follows.
 * @module dsh-figmark/client/composer
 */
import type { AnnotationDocument, SummaryLocale } from '../shared/annotation'
import { buildAnnotationMessage, type DeliveredPaths } from './annotation-message'
import { matchAnnotation } from './annotation-rule'
import { rememberDelivered } from './annotation-thumb'
import { parkAnnotation } from './pending'

/** One attachment the conversation service created for a draft. */
export interface DraftAttachmentLike {
  /** Id the rail and the draft both key the attachment by. */
  readonly id: string
}

/** The per-session input shell the composer is bound to. */
export interface ComposerShellLike {
  /** The live input state. */
  readonly snapshot: {
    /** The draft text, as the reader sees it. */
    readonly draft: string
    /** Attachments the draft is holding; absent on a host that keeps none. */
    readonly attachmentIds?: readonly string[] | undefined
  }
  /** Replace the draft; the caret lands at the end. */
  setDraft(text: string): void
  /**
   * Stage already-created attachments into the rail.
   * @param ids - ids `createDrafts` returned.
   * @returns false when the box is mid-send and will not take them.
   */
  addAttachments?(ids: readonly string[]): boolean
  /** Take one staged attachment back out of the rail. */
  removeAttachment?(id: string): boolean
  /** Run the box's own send, the one the reader's button press runs. */
  submit?(): void
  /** The shell's publication, so a card can tell when its content left the draft. */
  readonly state?: { subscribe(listener: () => void): () => void } | undefined
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
  /**
   * Turn files into draft attachments the rail can hold.
   * @param sessionId - session the draft belongs to.
   * @param files - the files to stage.
   * @returns the drafts created, which the rail takes by id.
   */
  createDrafts?(sessionId: string, files: readonly File[]): readonly DraftAttachmentLike[]
  /**
   * Forget one staged attachment that left the draft.
   * @param id - the draft's id.
   */
  releaseDraftAttachment?(id: string): void
}

/**
 * What one card put into the composer, held so it can be taken back out.
 *
 * The card reports it rather than owning it: the draft belongs to the reader from the
 * moment the text lands, and a card pressed minutes later must undo exactly what it
 * wrote and nothing else — the sentence typed after it, the picture dropped beside it.
 */
export interface StagedReview {
  /** The shell the text and the attachments were staged in. */
  readonly shell: ComposerShellLike
  /** The message, verbatim, exactly as it sits in the draft. */
  readonly text: string
  /** Attachments staged beside it; empty when the picture could not be staged. */
  readonly attachmentIds: readonly string[]
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
  /** The review picture itself, staged as a draft attachment when the host takes it. */
  readonly file: File | undefined
  /** Message language. */
  readonly locale: SummaryLocale
  /** Hand the message to the session directly, for when nothing could be staged. */
  readonly send: () => Promise<void>
}

/**
 * Add one message to the draft, behind whatever is already there.
 * @param shell - the composer's shell.
 * @param message - the message, verbatim.
 * @returns false when the shell refuses the write.
 */
function appendDraft(shell: ComposerShellLike, message: string): boolean {
  try {
    // `trim` decides only whether there is anything to separate; the draft itself is
    // kept exactly as it was written. Trimming it removed the reader's own shape — the
    // two spaces that make a fenced block a code block, the blank lines that end a
    // paragraph — and in a Markdown draft that shape is what the agent reads.
    const existing = shell.snapshot.draft
    shell.setDraft(existing.trim() === '' ? message : `${existing}\n\n${message}`)
    return true
  } catch {
    return false
  }
}

/**
 * Stage one file in the draft's attachment rail.
 * @param conversation - the conversation service.
 * @param sessionId - session the draft belongs to.
 * @param shell - the composer's shell.
 * @param file - the file to stage, when there is one.
 * @returns the ids the rail is holding.
 */
function stageFile(
  conversation: ComposerLike,
  sessionId: string,
  shell: ComposerShellLike,
  file: File | undefined,
): readonly string[] {
  // Bound to their owners: these are service methods, and a call through a bare
  // reference would lose the `this` the host's own implementation may rely on.
  const create = conversation.createDrafts?.bind(conversation)
  const add = shell.addAttachments?.bind(shell)
  if (file === undefined || create === undefined || add === undefined) return []
  let drafts: readonly DraftAttachmentLike[]
  try {
    drafts = create(sessionId, [file])
  } catch {
    return []
  }
  const ids = drafts.map(draft => draft.id)
  if (ids.length === 0) return []
  let staged = false
  try {
    staged = add(ids)
  } catch {
    staged = false
  }
  // A refused rail — the box was mid-send — would otherwise leave an attachment the
  // draft does not hold and nothing will ever release.
  if (!staged) for (const id of ids) conversation.releaseDraftAttachment?.(id)
  return staged ? ids : []
}

/**
 * Write one annotation into the composer: its message into the draft, its picture into
 * the rail. Nothing is sent.
 * @param conversation - the composer service.
 * @param sessionId - session the draft belongs to.
 * @param message - the message, verbatim.
 * @param file - the review picture, when the surface has one to attach.
 * @returns what was staged, or undefined when the session has no composer.
 */
export function stageReview(
  conversation: ComposerLike,
  sessionId: string,
  message: string,
  file: File | undefined,
): StagedReview | undefined {
  let shell: ComposerShellLike
  try {
    shell = conversation.input.shell(sessionId)
  } catch {
    // The registry only has shells for sessions the app is still holding. A figure
    // opened from a session that has since been dropped has nowhere to be staged, and
    // the registry's own message names the registry, not the reader's problem.
    return undefined
  }
  if (!appendDraft(shell, message)) return undefined
  return { shell, text: message, attachmentIds: stageFile(conversation, sessionId, shell, file) }
}

/**
 * Take a staged annotation back out of the composer.
 *
 * Only the exact message this card wrote is cut: the reader may have typed around it,
 * and their words are not this card's to delete. A draft that held nothing else is
 * left empty rather than as a pair of blank lines where the block used to be.
 * @param staged - what `stageReview` reported.
 * @param conversation - the composer service, for releasing the staged attachments.
 */
export function unstageReview(staged: StagedReview, conversation: ComposerLike | undefined): void {
  for (const id of staged.attachmentIds) {
    staged.shell.removeAttachment?.(id)
    conversation?.releaseDraftAttachment?.(id)
  }
  let at: number
  try {
    at = staged.shell.snapshot.draft.indexOf(staged.text)
  } catch {
    return
  }
  if (at < 0) return
  const draft = staged.shell.snapshot.draft
  // The block sat between two blank lines, so cutting it out leaves four newlines
  // where the paragraph break should be. Collapsing only the seam — the run of blank
  // lines across the cut — leaves the reader's own spacing elsewhere alone.
  const rest = `${draft.slice(0, at)}${draft.slice(at + staged.text.length)}`
    .replace(/\n{3,}/gu, '\n\n')
  try {
    staged.shell.setDraft(rest.trim() === '' ? '' : rest.replace(/^\n+|\n+$/gu, ''))
  } catch {
    // A shell that took the attachments back has nothing left to clean, and a draft
    // this card cannot rewrite is a draft the reader will see and fix themselves.
  }
}

/**
 * Park one annotation above the composer, without sending it.
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
  const staged = input.conversation === undefined
    ? undefined
    : stageReview(input.conversation, sessionId, message, input.file)
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
    staged,
    send: input.send,
  })
}
