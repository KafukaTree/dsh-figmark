/**
 * Putting one annotation into the conversation's composer without sending it.
 *
 * "Send to the agent" hands the message straight to the session; this module is
 * the other half of that pair — the message is written into the reader's draft so
 * they can add a sentence of their own, drop the pictures, or not send it at all.
 * Nothing here submits: the send stays the reader's.
 *
 * The composer is a lexical editor owned by the conversation package, so the only
 * safe way in is its own action face. Writing the DOM directly would desynchronise
 * the editor's revision counter and strand the attachment rail.
 * @module dsh-figmark/client/composer
 */
import type { AnnotationDocument, SummaryLocale } from '../shared/annotation'
import { buildAnnotationMessage, type DeliveredPaths } from './session'

/** One attachment staged in the composer's draft registry. */
export interface ComposerDraftLike {
  /** Registry id the draft rail renders from. */
  readonly id: string
}

/** The per-session input shell the composer is bound to. */
export interface ComposerShellLike {
  /** The live input state, of which only the draft text is read here. */
  readonly snapshot: { readonly draft: string }
  /** Replace the draft; the caret lands at the end. */
  setDraft(text: string): void
  /** Append attachment ids to the draft; false while a send is in flight. */
  addAttachments(ids: readonly string[]): boolean
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
   * Stage files in the draft registry.
   * @param sessionId - session the draft belongs to.
   * @param files - the files to stage, in order.
   * @returns the staged drafts, in the same order.
   */
  createDrafts(sessionId: string, files: readonly File[]): readonly ComposerDraftLike[]
  /**
   * Drop staged drafts again, for the paths that could not use them.
   * @param drafts - the drafts to release.
   */
  releaseDraftAttachments(drafts: readonly ComposerDraftLike[]): void
}

/** Everything one composer delivery needs. */
export interface ComposerInput {
  /** The conversation service, when the composition provides one. */
  readonly conversation: ComposerLike
  /** Session the figure belongs to. */
  readonly sessionId: string
  /** The saved annotation document. */
  readonly document: AnnotationDocument
  /** Paths the Host wrote. */
  readonly paths: DeliveredPaths
  /** Pictures and documents to stage beside the message, in order. */
  readonly files: readonly File[]
  /** Message language. */
  readonly locale: SummaryLocale
}

/**
 * Write one annotation into the composer draft, pictures included, without sending.
 *
 * The message is appended rather than substituted: the reader may already have
 * half a sentence in the box, and losing it to a button press would be a worse
 * failure than a long draft. Attachments are staged first, so a refused
 * attachment leaves no text behind that names pictures which are not there.
 * @param input - the annotation, its pictures, and the composer to write into.
 * @throws {Error} when the composer refuses the attachments.
 */
export function deliverToComposer(input: ComposerInput): void {
  const { conversation, sessionId, files, locale, document: document_, paths } = input
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
  const drafts = files.length === 0 ? [] : conversation.createDrafts(sessionId, files)
  if (drafts.length > 0 && !shell.addAttachments(drafts.map(draft => draft.id))) {
    conversation.releaseDraftAttachments(drafts)
    throw new Error('the composer refused the attachments')
  }
  const message = buildAnnotationMessage(document_, paths, locale)
  const existing = shell.snapshot.draft.trim()
  shell.setDraft(existing === '' ? message : `${existing}\n\n${message}`)
}
