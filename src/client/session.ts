/**
 * Delivering one annotation, or one edit proposal, to the agent.
 *
 * The delivery is an ordinary user message: the flattened review artifact as an
 * attached file when the figure has pages, the review image of every annotated
 * page (the model sees the marks directly when its route accepts images), and the
 * numbered summary plus the sidecar paths as text. An edit proposal carries the
 * unified diff of what the reader changed instead of marks, and the edited text
 * itself as an attachment when the diff exceeds the message's budget. Nothing
 * bypasses the session log, so what the agent saw is what the transcript holds.
 *
 * What the message *says* lives in `./annotation-message` and `./edit-message`;
 * what this module does is put it into a session, which fails differently: an
 * upload can be refused, a subagent takes no files, and a session that is not live
 * has to be resumed first. All three are warnings or errors here, never text the
 * agent would read as its instructions.
 * @module dsh-figmark/client/session
 */

import { toBase64 } from '../shared/base64'
import { baseNameOf } from '../shared/path-name'
import type { AnnotationDocument, SummaryLocale } from '../shared/annotation'
import { pageFileSuffix } from '../shared/annotation'
import type { TextDiff } from '../shared/text-diff'
import { buildAnnotationMessage, type DeliveredPaths } from './annotation-message'
import { buildEditMessage, fitDiff } from './edit-message'

/** The session face this module calls. */
interface SessionFaceLike {
  prompt(
    content: readonly unknown[],
    mode: 'queue' | 'steer',
  ): Promise<{ ok: boolean; error?: { message?: string } }>
  /** Present only on a subagent continuation, which cannot take file attachments. */
  readonly address?: unknown
}

/** The sessions service slice this module calls. */
export interface SessionsLike {
  scope(id: string): unknown
  sessionOf(scope: unknown): SessionFaceLike | undefined
  using<T>(
    id: string,
    options: { source: string },
    operation: (reference: {
      readonly ready: Promise<{ readonly session: SessionFaceLike }>
    }) => T | Promise<T>,
  ): Promise<T>
}

/** A durable file reference the attachment store returned. */
export interface FileAttachmentRefLike {
  /** Content-addressed identifier of the stored bytes. */
  readonly attachmentId: string;
  /** Display name the store kept. */
  readonly name: string;
  /** Stored byte length. */
  readonly bytes: number;
}

/** The client upload service slice this module calls. */
export interface FileUploadLike {
  upload(
    sessionId: string,
    data: Uint8Array,
    name: string,
    signal?: AbortSignal,
  ): Promise<
    | { readonly ok: true; readonly value: { readonly file: FileAttachmentRefLike } }
    | { readonly ok: false; readonly error: { readonly message?: string } }
  >
}

/** Most annotated pages whose review image one message carries. */
export const MAX_PAGE_IMAGES = 8

/** One annotated page rendered for the session. */
export interface DeliveredPageImage {
  /** 1-based page the image shows. */
  readonly page: number
  /** The rendered page with its marks. */
  readonly image: Blob
}

/** Everything one delivery needs. */
export interface DeliveryInput {
  /** The client sessions service. */
  readonly sessions: SessionsLike
  /** The client upload service, when the composition provides one. */
  readonly fileUpload: FileUploadLike | undefined
  /** Session the figure belongs to. */
  readonly sessionId: string
  /** The saved document. */
  readonly document: AnnotationDocument
  /** Paths the Host wrote. */
  readonly paths: DeliveredPaths
  /** Review images of the annotated pages, in page order. */
  readonly pageImages: readonly DeliveredPageImage[]
  /** The document carrying the written-back annotations, when there is one. */
  readonly annotatedPdf: Uint8Array | undefined
  /** Message language. */
  readonly locale: SummaryLocale
}


/**
 * Encode one PNG blob as base64 for the prompt's image part.
 *
 * Delegates to the shared encoder: the review artifact travelling to the Host and
 * the page image travelling to the model are the same bytes-to-text problem, and
 * a second chunk loop here is a second place its chunk size can drift.
 *
 * @param blob - PNG bytes.
 * @returns base64 text.
 */
async function encodePng(blob: Blob): Promise<string> {
  return await toBase64(blob)
}

/** What one attachment needs to travel, or to fail loudly in the reader's language. */
interface Attachment {
  /** The bytes the session receives. */
  readonly bytes: Uint8Array
  /** File name the store keeps. */
  readonly name: string
  /** What a warning calls this attachment, in both languages. */
  readonly noun: { readonly zh: string; readonly en: string }
}

/** What one {@link attachFile} call acts through. */
interface AttachInput {
  /** The upload service, when the composition provides one. */
  readonly fileUpload: FileUploadLike | undefined
  /** The live session face, when one is bound. */
  readonly session: SessionFaceLike | undefined
  /** Session the file belongs to. */
  readonly sessionId: string
  /** Parts being built, appended to when the file was attached. */
  readonly content: unknown[]
  /** Warnings being collected. */
  readonly warnings: string[]
  /** Whether the reader's language is Chinese. */
  readonly zh: boolean
  /** The file itself. */
  readonly attachment: Attachment
}

/**
 * Attach one file to the message, unless this composition or session cannot take one.
 *
 * A subagent continuation refuses file parts outright, and a composition without
 * the upload service has nowhere to store the bytes; both are reported as a
 * warning and the message still goes out with its text.
 *
 * @param input - the upload seats, the parts being built, and the file.
 */
async function attachFile(input: AttachInput): Promise<boolean> {
  const { zh } = input
  const { noun } = input.attachment
  const fileUpload = input.fileUpload
  if (fileUpload === undefined) {
    input.warnings.push(zh
      ? `本次组合没有附件服务，${noun.zh}未随消息发送。`
      : `This composition has no upload service, so the ${noun.en} was not attached.`)
    return false
  }
  if (input.session?.address !== undefined) {
    input.warnings.push(zh
      ? `当前会话是子会话，不接受文件附件，${noun.zh}未随消息发送。`
      : `This session is a subagent continuation and takes no file attachments, so the ${noun.en} was not attached.`)
    return false
  }
  try {
    const uploaded = await fileUpload.upload(input.sessionId, input.attachment.bytes, input.attachment.name)
    if (!uploaded.ok) throw new Error(uploaded.error.message ?? 'the upload was refused')
    input.content.push({ type: 'file', attachment: uploaded.value.file })
    return true
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    input.warnings.push(zh
      ? `${noun.zh}未能随消息发送：${reason}`
      : `The ${noun.en} was not attached: ${reason}`)
    return false
  }
}

/**
 * Attach the annotated document to the message, unless this session cannot take one.
 * @param input - the delivery being composed.
 * @param session - the live session face, when one is bound.
 * @param content - parts being built, appended to when the file was attached.
 * @param warnings - warnings being collected.
 */
async function attachAnnotatedPdf(
  input: DeliveryInput,
  session: SessionFaceLike | undefined,
  content: unknown[],
  warnings: string[],
): Promise<boolean> {
  // Present by the caller's own check, which needs the answer before it can decide
  // whether the message says a PDF travelled.
  const bytes = input.annotatedPdf as Uint8Array
  const name = input.paths.reviewPath === null
    ? `${baseNameOf(input.document.figure.path)}.annotated.pdf`
    : baseNameOf(input.paths.reviewPath)
  return await attachFile({
    fileUpload: input.fileUpload,
    session,
    sessionId: input.sessionId,
    content,
    warnings,
    zh: input.locale === 'zh',
    attachment: { bytes, name, noun: { zh: '带批注 PDF', en: 'annotated PDF' } },
  })
}

/**
 * Hand one message to the session, whether it is live or has to be resumed.
 * @param sessions - the client sessions service.
 * @param sessionId - session the message belongs to.
 * @param session - the live session face, when one is bound.
 * @param content - the parts to send.
 * @param refusal - the message an answer without `ok` is reported with.
 * @throws {Error} when the session is unknown or refuses the prompt.
 */
async function promptSession(
  sessions: SessionsLike,
  sessionId: string,
  session: SessionFaceLike | undefined,
  content: readonly unknown[],
  refusal: string,
): Promise<void> {
  const result = session === undefined
    ? await sessions.using(sessionId, { source: 'dsh-figmark' }, async (reference) => {
      const binding = await reference.ready
      return await binding.session.prompt(content, 'queue')
    })
    : await session.prompt(content, 'queue')
  if (!result.ok) throw new Error(result.error?.message ?? refusal)
}

/**
 * Send one annotation into the session that owns the figure.
 * @param input - the document, its written files, and the pages rendered for it.
 * @returns what the delivery could not do, empty when it did everything.
 * @throws {Error} when the session is unknown or the Host refuses the prompt.
 */
export async function deliverAnnotation(input: DeliveryInput): Promise<readonly string[]> {
  const zh = input.locale === 'zh'
  const warnings: string[] = []
  const content: unknown[] = []
  const live = input.sessions.scope(input.sessionId)
  const session = live === undefined ? undefined : input.sessions.sessionOf(live)
  // The message says whether the PDF travels with it, so the attachment is attempted
  // before the text is composed. The paths only say what the Host wrote to disk.
  const pdfAttached = input.annotatedPdf === undefined
    || await attachAnnotatedPdf(input, session, content, warnings)
  const shown = input.pageImages.slice(0, MAX_PAGE_IMAGES)
  const paged = input.document.figure.pageCount !== undefined
  for (const entry of shown) {
    content.push({
      type: 'image',
      mediaType: 'image/png',
      data: await encodePng(entry.image),
      name: `${baseNameOf(input.document.figure.path)}${paged ? pageFileSuffix(entry.page) : ''}.annotated.png`,
    })
  }
  if (shown.length < input.pageImages.length) {
    const hidden = input.pageImages.length - shown.length
    // The advice names where the rest of the pages are, so it can only be given when
    // they are actually there. Saying "see the annotated PDF" beside the warning that
    // says the PDF did not travel sends the agent to look for a file that is not in
    // the message — and a search is a plausible thing for it to do, which is a worse
    // outcome than saying nothing.
    warnings.push(pdfAttached
      ? (zh
        ? `另有 ${hidden} 页标注未附图，请看带批注 PDF。`
        : `${hidden} more annotated pages are not attached as images; see the annotated PDF.`)
      : (zh
        ? `另有 ${hidden} 页标注未附图，带批注 PDF 也未能随消息发送：这些页的标注只有位置与说明，请按上面的描述在原文档上处理。`
        : `${hidden} more annotated pages are not attached as images, and neither is the annotated PDF: their marks travel only as the positions and notes above — work on the original document from those.`))
  }
  content.push({ type: 'text', text: buildAnnotationMessage(input.document, input.paths, input.locale, pdfAttached) })
  await promptSession(input.sessions, input.sessionId, session, content, 'the session refused the annotation message')
  return warnings
}


/** Everything one edit proposal delivery needs. */
export interface EditDeliveryInput {
  /** The client sessions service. */
  readonly sessions: SessionsLike
  /** The client upload service, when the composition provides one. */
  readonly fileUpload: FileUploadLike | undefined
  /** Session the document belongs to. */
  readonly sessionId: string
  /** Path the message names: the document's own, or its address when unparsed. */
  readonly documentPath: string
  /** The difference against the version the document was opened with. */
  readonly diff: TextDiff
  /** The reader's whole edited text, attached when the message cannot carry the diff. */
  readonly editedText: string
  /** The reader's notes, keyed by the baseline line the change starts at. */
  readonly notes: Readonly<Record<number, string>>
  /** Whether the loaded baseline moved while the reader was editing. */
  readonly stale: boolean
  /** Message language. */
  readonly locale: SummaryLocale
}

/**
 * Send one edit proposal into the session that owns the document.
 *
 * Nothing here writes the document: the diff in the message is the deliverable,
 * and the edited text travels as an attachment only when the diff did not fit.
 *
 * @param input - the document, its difference, and the session to reach.
 * @returns what the delivery could not do, empty when it did everything.
 * @throws {Error} when the session is unknown or refuses the prompt.
 */
export async function deliverEdit(input: EditDeliveryInput): Promise<readonly string[]> {
  const zh = input.locale === 'zh'
  const warnings: string[] = []
  const content: unknown[] = []
  const live = input.sessions.scope(input.sessionId)
  const session = live === undefined ? undefined : input.sessions.sessionOf(live)
  const fitted = fitDiff(input.documentPath, input.diff)
  // Asked before the text is composed, because the message says whether a copy travels
  // with it: a sentence written first and contradicted by a warning afterwards leaves
  // the agent hunting an attachment that is not there.
  let attached = false
  if (fitted.hidden > 0) {
    attached = await attachFile({
      fileUpload: input.fileUpload,
      session,
      sessionId: input.sessionId,
      content,
      warnings,
      zh,
      attachment: {
        bytes: new TextEncoder().encode(input.editedText),
        name: `${baseNameOf(input.documentPath)}.edited.md`,
        noun: { zh: '编辑后的副本', en: 'edited copy' },
      },
    })
  }
  content.push({
    type: 'text',
    text: buildEditMessage({
      documentPath: input.documentPath,
      diff: input.diff,
      fitted,
      notes: input.notes,
      stale: input.stale,
      attached,
      locale: input.locale,
    }),
  })
  await promptSession(input.sessions, input.sessionId, session, content, 'the session refused the edit message')
  return warnings
}
