/**
 * Putting one annotation above the composer without sending it.
 *
 * "Send to the agent" hands the message straight to the session; this module is the
 * other half of that pair: the annotation is armed in the composer — its message and
 * its review picture are prepared, the picture already uploaded — and a card in the
 * input dock stands for it. Nothing is written into the box. The reader writes their
 * own sentence, presses the box's own send, and that one press runs the merge: the
 * message lands behind their words and the picture joins the same send.
 *
 * Not written up front, because the block is six lines of coordinates. Sitting in the
 * draft it turns the box into a wall of text around the sentence being typed, and the
 * card above it repeats the same block — the reader ends up reading the annotation
 * twice and their own sentence once. Arming keeps one face per thing: the card for the
 * review, the box for the reader's words. The message is built before anything is
 * armed, so the card is the parsed message and the reader is looking at the very text
 * the send will deliver.
 *
 * The merge hangs on the shell's own send rather than on a button: the composer's send
 * is called by the button, by Enter, and by the queue, and only the shell sees all
 * three. It is patched in place, reversibly, and only while a card is armed.
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
  /** Native thumbnail identity; only these draft duplicates may be hidden. */
  readonly previewUrl?: string
}

/** The shell's send, whatever arguments the host hands it. */
export type SubmitLike = (...args: unknown[]) => void

/** The per-session input shell the composer is bound to. */
export interface ComposerShellLike {
  /** The live input state. */
  readonly snapshot: {
    /** The draft text, as the reader sees it. */
    readonly draft: string
    /** Attachments the draft is holding; absent on a host that keeps none. */
    readonly attachmentIds?: readonly string[] | undefined
    /** Where the box is in its send transaction; absent on a host that keeps none. */
    readonly phase?: string | undefined
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
  submit?: SubmitLike | undefined
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
 * What one card armed in the composer, held so the send can carry it and the card can
 * take it back out.
 *
 * The card reports it rather than owning it: the picture is uploaded and waiting, and
 * a card pressed minutes later must deliver exactly what it armed and nothing else —
 * not the sentence typed after it, not the picture dropped beside it.
 */
export interface ArmedReview {
  /** The shell whose send will carry it. */
  readonly shell: ComposerShellLike
  /** The message, verbatim, exactly as the send will deliver it. */
  readonly text: string
  /** The review picture, uploaded and waiting to ride with the message. */
  readonly attachmentIds: readonly string[]
  /** Files already admitted to the native draft, enabling its Send button. */
  readonly previewUrls?: readonly string[]
  readonly staged?: boolean
  /** Temporary native admission image; removed before the host reads the send. */
  readonly admission?: { readonly ids: readonly string[]; readonly release: () => void }
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
  /** The review picture itself, sent beside the message when the host takes it. */
  readonly file: File | undefined
  /** Additional page images, staged with the same review. */
  readonly files?: readonly File[] | undefined
  /** Marked pages that travel as image parts when there is no whole-file upload. */
  readonly pageImages?: number | undefined
  /** Whether the current live-page picture travelled with this parked review. */
  readonly pageCapture?: 'none' | 'omitted' | 'attached' | 'failed' | undefined
  /** Message language. */
  readonly locale: SummaryLocale
  /** Hand the message to the session directly, for when nothing could be armed. */
  readonly send: () => Promise<readonly string[]>
}

/**
 * Upload one file as a draft attachment without putting it in the rail yet.
 * @param conversation - the conversation service.
 * @param sessionId - session the draft belongs to.
 * @param files - the rendered review images to hold.
 * @returns the ids the send will add, empty when the file could not be made into one.
 */
function holdFiles(
  conversation: ComposerLike,
  sessionId: string,
  files: readonly File[],
): readonly DraftAttachmentLike[] {
  // Bound to its owner: this is a service method, and a call through a bare reference
  // would lose the `this` the host's own implementation relies on.
  const create = conversation.createDrafts?.bind(conversation)
  if (files.length === 0 || create === undefined) return []
  try {
    return create(sessionId, files)
  } catch {
    return []
  }
}

/**
 * Arm one annotation in the composer: nothing in the box, everything ready for its send.
 * @param conversation - the composer service.
 * @param sessionId - session the draft belongs to.
 * @param message - the message, verbatim.
 * @param file - the review picture, when the surface has one to attach.
 * @param additionalFiles - marked page images of a multi-page review.
 * @returns what was armed, or undefined when this session cannot be armed.
 */
export function armReview(
  conversation: ComposerLike,
  sessionId: string,
  message: string,
  file: File | undefined,
  additionalFiles: readonly File[] = [],
): ArmedReview | undefined {
  let shell: ComposerShellLike
  try {
    shell = conversation.input.shell(sessionId)
  } catch {
    // The registry only has shells for sessions the app is still holding. A figure
    // opened from a session that has since been dropped has nowhere to be armed, and
    // the registry's own message names the registry, not the reader's problem.
    return undefined
  }
  // The merge happens inside the box's send. A shell without one has no send to hang
  // it on, so the card keeps its own send and the reader presses that instead.
  if (typeof shell.submit !== 'function') return undefined
  const drafts = holdFiles(conversation, sessionId, file === undefined ? additionalFiles : [file, ...additionalFiles])
  return {
    shell, text: message, attachmentIds: drafts.map(draft => draft.id),
    previewUrls: drafts.flatMap(draft => draft.previewUrl === undefined ? [] : [draft.previewUrl]),
  }
}

/** What one merge put in the box, so a refused send can put the box back. */
interface Merge {
  /** The draft exactly as the reader had written it. */
  readonly typed: string
  /** The draft the merge wrote: the reader's words with the messages behind them. */
  readonly merged: string
}

/** One card riding a shell's send, and where to report that the send took it. */
interface Claim {
  /** What the card armed. */
  readonly armed: ArmedReview
  /** Called once the send has the annotation, so the card can go. */
  readonly done: () => void
}

/** The one patch in place on a shell, and every card riding it. */
interface Patch {
  /** The send the shell published before the patch. */
  readonly original: SubmitLike
  /** The send the shell publishes now. */
  readonly patched: SubmitLike
  /** The cards armed on this shell, in the order the reader parked them. */
  readonly claims: Claim[]
}

/**
 * Patches in place, by the shell they sit on.
 *
 * One patch per shell rather than one per card: two cards are two reviews, and a press
 * of Send is one message, so the patch merges every card that is currently armed. It
 * also keeps dropping a card honest — a card taken off the queue leaves the list, and
 * a send after that carries only what is still on screen.
 */
const patches = new WeakMap<ComposerShellLike, Patch>()

/**
 * Ask the rail to hold an armed picture.
 * @param shell - the box the send will run in.
 * @param ids - the drafts the picture was uploaded as.
 * @returns whether the rail took them.
 */
function attach(shell: ComposerShellLike, ids: readonly string[]): boolean {
  try {
    return shell.addAttachments?.(ids) ?? false
  } catch {
    return false
  }
}

/**
 * Put the box back the way the merge found it.
 * @param shell - the box.
 * @param typed - the draft the reader had written.
 * @param added - attachments the merge had already put in the rail.
 */
function unwind(shell: ComposerShellLike, typed: string, added: readonly string[]): void {
  const drop = shell.removeAttachment?.bind(shell)
  for (const id of added) {
    if (drop !== undefined) drop(id)
  }
  try {
    shell.setDraft(typed)
  } catch { /* the reader will see and fix what is left in the box */ }
}

/**
 * Write every armed message behind the reader's own words, and the pictures beside them.
 *
 * All of it happens here, in one write, at the press: a draft written before the press
 * would be a wall of coordinates around the sentence being typed, and a write per card
 * would cost the reader their caret as many times as there are cards.
 * @param shell - the box whose send is running.
 * @param claims - the cards armed on it, oldest first.
 * @returns the box as it was before the merge, or undefined when this press is not the
 * send that carries the annotations.
 */
function mergeInto(shell: ComposerShellLike, claims: readonly Claim[]): Merge | undefined {
  let live: ComposerShellLike['snapshot']
  try {
    live = shell.snapshot
  } catch {
    // A box that cannot be read cannot say what it holds; merging blind would put the
    // block into somebody else's draft.
    return undefined
  }
  // Mid-send the box is not taking text: the draft already on its way would carry the
  // block twice, once as typed and once merged.
  if (live.phase !== undefined && live.phase !== 'plain') return undefined
  const typed = live.draft
  let draft = typed
  const added: string[] = []
  for (const claim of claims) {
    const { text, attachmentIds } = claim.armed
    // Already merged — the card's own press lands on the same send this patch hooked.
    // Writing it again is the one way to send the annotation twice.
    if (draft.includes(text)) continue
    const missing = attachmentIds.filter(id => !live.attachmentIds?.includes(id))
    if (missing.length > 0) {
      if (!attach(shell, missing)) {
        // A refused rail leaves a message promising a picture it does not carry. Half
        // a review is worse than none: the box goes back and the card waits.
        unwind(shell, typed, added)
        return undefined
      }
      added.push(...missing)
    }
    draft = draft.trim() === '' ? text : `${draft}\n\n${text}`
  }
  if (draft !== typed) {
    try {
      shell.setDraft(draft)
    } catch {
      unwind(shell, typed, added)
      return undefined
    }
  }
  return { typed, merged: draft }
}

/**
 * Whether the box is already holding the draft the merge wrote.
 *
 * A write made while the box is in the middle of an edit is queued until that edit
 * ends: the send reads the box's text out of the editor, so asking the box is the only
 * way to know whether the merge is in yet. It is asked rather than assumed because the
 * two paths differ — the card's own press runs between edits and writes through, a
 * press of Enter runs inside one and does not.
 * @param shell - the box the merge wrote to.
 * @param merge - what the merge wrote.
 * @returns whether the box reports holding the merged draft.
 */
function wroteThrough(shell: ComposerShellLike, merge: Merge): boolean {
  try {
    return shell.snapshot.draft === merge.merged
  } catch {
    // A box that cannot be read now will not answer after a wait either; the send's
    // own settlement reads it again and puts back whatever it finds.
    return true
  }
}

/**
 * Decide what became of one press, now that the send has run.
 * @param shell - the box whose send ran.
 * @param claims - the cards that were armed on it.
 * @param merge - the box as it was before the merge.
 */
function settleClaims(shell: ComposerShellLike, claims: readonly Claim[], merge: Merge): void {
  let live: ComposerShellLike['snapshot']
  try {
    live = shell.snapshot
  } catch {
    // Nothing left to put back and nothing to take out: the cards have done their part.
    for (const claim of claims) { claim.armed.admission?.release(); claim.done() }
    return
  }
  // Out of the send — delivered, or queued behind a running turn — the cards are spent.
  if (live.phase !== undefined && live.phase !== 'plain') {
    for (const claim of claims) { claim.armed.admission?.release(); claim.done() }
    return
  }
  const draft = live.draft
  if (claims.every(claim => !draft.includes(claim.armed.text))) {
    for (const claim of claims) { claim.armed.admission?.release(); claim.done() }
    return
  }
  // A send that never left the box leaves the draft holding the blocks. The reader's
  // sentence must not come back wearing six lines of coordinates they did not type,
  // and the pictures must not stay in the rail of a review that was not sent.
  try {
    shell.setDraft(merge.typed)
  } catch { /* the reader will see and fix what is left in the box */ }
  for (const claim of claims) {
    if (claim.armed.admission !== undefined) attach(shell, claim.armed.admission.ids.filter(id => !live.attachmentIds?.includes(id)))
    if (claim.armed.staged !== true) {
      for (const id of claim.armed.attachmentIds) shell.removeAttachment?.(id)
    }
  }
}

/**
 * Take one card off whatever patch its shell is currently carrying.
 * @param shell - the box the card was armed on.
 * @param armed - what the card armed.
 */
function release(shell: ComposerShellLike, armed: ArmedReview): void {
  const patch = patches.get(shell)
  if (patch === undefined) return
  const at = patch.claims.findIndex(claim => claim.armed === armed)
  if (at >= 0) patch.claims.splice(at, 1)
  if (patch.claims.length > 0) return
  patches.delete(shell)
  // A host that put its own send back, or replaced it, has already unhooked this patch;
  // restoring over it would put a merge in front of a send that never asked for one.
  if (Object.getOwnPropertyDescriptor(shell, 'submit')?.value !== patch.patched) return
  try {
    Object.defineProperty(shell, 'submit', { configurable: true, writable: true, value: patch.original })
  } catch { /* nothing left to restore */ }
}

/**
 * Hang one armed message on the box's own send, and take it off again.
 *
 * The send is patched in place on the shell object: the button, Enter and the queue all
 * call it, and there is no other seam that sees all three. A second card joins the patch
 * already in place rather than stacking another one, so one press merges the whole queue
 * and dropping one card does not unhook its neighbours.
 *
 * Enter reaches this seam from inside the box's own edit, where the merge's write to the
 * draft is still queued in the editor; a send started there would carry the sentence and
 * none of the annotations. The box is asked whether the write is in, and a press that it
 * has not taken yet goes out one turn later, when it has.
 * @param armed - what the card armed.
 * @param done - called once the send has the annotation, so the card can go.
 * @returns a function that unhooks this card.
 */
export function holdSubmit(armed: ArmedReview, done: () => void): () => void {
  const shell = armed.shell
  const existing = patches.get(shell)
  if (existing !== undefined) {
    existing.claims.push({ armed, done })
    return () => { release(shell, armed) }
  }
  const original = shell.submit
  if (original === undefined) return () => {}
  const claims: Claim[] = [{ armed, done }]
  /**
   * The press that is already waiting to go, so a burst of them is still one message.
   *
   * Only a press the box queued waits at all; the ones that went straight out have
   * already cleared this by the time the next arrives.
   */
  let waiting = false
  const patched: SubmitLike = (...args) => {
    const merge = mergeInto(shell, claims)
    // The merge decided this press was not the one carrying the annotations — a box
    // mid-send, or one that cannot be read — so nothing here belongs to the cards.
    if (merge === undefined) {
      original.apply(shell, args)
      return
    }
    const send = (): void => {
      try {
        // The native button was admitted by these temporary images. Text is now
        // merged, so remove them before the host snapshots attachments for sending.
        for (const claim of claims) {
          for (const id of claim.armed.admission?.ids ?? []) {
            if (shell.removeAttachment?.(id) !== true) return
          }
        }
        original.apply(shell, args)
      } finally {
        waiting = false
        settleClaims(shell, claims, merge)
      }
    }
    if (wroteThrough(shell, merge)) {
      send()
      return
    }
    if (waiting) return
    waiting = true
    // The press came from inside the box's own edit — Enter does — so the draft the
    // merge just wrote is still queued in the editor, and a send started here would
    // read the box as it was before the merge: the reader's sentence and none of the
    // annotations behind it. The box commits that write before the next turn, so the
    // send waits for it, and one press still carries both.
    setTimeout(send, 0)
  }
  try {
    Object.defineProperty(shell, 'submit', { configurable: true, writable: true, value: patched })
  } catch {
    // A frozen shell keeps its own send: the reader presses the card instead.
    return () => {}
  }
  patches.set(shell, { original, patched, claims })
  return () => { release(shell, armed) }
}

/**
 * Take an armed annotation back out of the composer.
 *
 * Nothing was written into the box, so there is no text to cut: only the picture the
 * card uploaded, released so the draft stops holding a file nobody will send.
 * @param armed - what `armReview` reported.
 * @param conversation - the composer service, for releasing the held attachment.
 */
export function disarmReview(armed: ArmedReview, conversation: ComposerLike | undefined): void {
  for (const id of armed.attachmentIds) {
    armed.shell.removeAttachment?.(id)
    conversation?.releaseDraftAttachment?.(id)
  }
}

/**
 * Park one annotation above the composer, without sending it.
 *
 * The message is built before anything is armed: the card is the parsed message, so a
 * parser that stopped recognising it would leave the card showing that text rather than
 * a card promising something the send does not do.
 * @param input - the annotation and the delivery the card stands for.
 */
export function parkInComposer(input: ParkInput): void {
  const { document: document_, locale, paths, sessionId } = input
  let armed = input.conversation === undefined
    ? undefined
    : armReview(input.conversation, sessionId, '', input.file, input.files)
  const planned = (input.file === undefined ? 0 : 1) + (input.files?.length ?? 0)
  const attached = armed?.attachmentIds.length ?? planned
  // The staged message describes files the host actually accepted, including each
  // marked PDF page. A thumbnail alone is never evidence of an attachment.
  const pageCapture = input.pageCapture === 'attached' && attached === 0 ? 'failed' : input.pageCapture
  const message = buildAnnotationMessage(
    document_,
    paths,
    locale,
    attached > 0,
    Math.min(input.pageImages ?? 0, attached),
    pageCapture,
  )
  if (armed !== undefined && input.conversation !== undefined) {
    // The host enables an empty composer's Send only for a native attachment.
    // Use a private admission image instead of uploading duplicate annotation.txt.
    // It is hidden by its exact preview URL and stripped before submission.
    const admission = armed.attachmentIds.length === 0
    const drafts = admission && armed.shell.removeAttachment !== undefined ? holdFiles(
      input.conversation, sessionId,
      [new File([Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='), char => char.charCodeAt(0))],
        'figmark-draft.png', { type: 'image/png' })],
    ) : []
    const ids = admission ? drafts.map(draft => draft.id) : armed.attachmentIds
    const conversation = input.conversation
    if (ids.length > 0 && attach(armed.shell, ids)) {
      armed = { ...armed, attachmentIds: ids, staged: true,
        ...(admission ? {
          previewUrls: drafts.flatMap(draft => draft.previewUrl === undefined ? [] : [draft.previewUrl]),
          admission: { ids, release: () => { for (const id of ids) conversation.releaseDraftAttachment?.(id) } },
        } : {}),
      }
    } else {
      for (const id of ids) conversation.releaseDraftAttachment?.(id)
      armed = undefined
    }
  }
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
      pageCapture: 'none',
      marks: [],
    },
    raw: message,
    conversation: input.conversation,
    armed: armed === undefined ? undefined : { ...armed, text: message },
    send: input.send,
  })
}
