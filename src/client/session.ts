/**
 * Delivering one annotation to the agent.
 *
 * The delivery is an ordinary user message: the flattened review artifact as an
 * attached file when the figure has pages, the review image of every annotated
 * page (the model sees the marks directly when its route accepts images), and the
 * numbered summary plus the sidecar paths as text. Nothing bypasses the session
 * log, so what the agent saw is what the transcript holds.
 *
 * What the message *says* lives in `./annotation-message`; what this module does
 * is put it into a session. A live binding is used when present; otherwise the
 * session service resumes it first. A refusal is an error here, never text the
 * agent would read as its instructions.
 * @module dsh-figmark/client/session
 */

import { toBase64 } from '../shared/base64'
import { baseNameOf } from '../shared/path-name'
import type { AnnotationDocument, SummaryLocale } from '../shared/annotation'
import { pageFileSuffix } from '../shared/annotation'
import { buildAnnotationMessage, type DeliveredPaths } from './annotation-message'
import { rememberDelivered } from './annotation-thumb'

/** The session face this module calls. */
interface SessionFaceLike {
  prompt(
    content: readonly unknown[],
    mode: 'queue' | 'steer',
  ): Promise<{ ok: boolean; error?: { message?: string } }>
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
  /** Session the figure belongs to. */
  readonly sessionId: string
  /** The saved document. */
  readonly document: AnnotationDocument
  /** Paths the Host wrote. */
  readonly paths: DeliveredPaths
  /** Review images of the annotated pages, in page order. */
  readonly pageImages: readonly DeliveredPageImage[]
  /**
   * Whether the current live-page picture travelled with the message.
   *
   * Omitted for file-backed figures; a live page sets `failed` when the capture was
   * attempted and the text alone still has to carry the review.
   */
  readonly pageCapture?: 'none' | 'attached' | 'failed' | undefined
  /**
   * A 120px picture of the review, for the bubble this message lands in.
   *
   * The bubble cannot reach this message's attachments, so it looks the block up
   * in the thumbnail cache instead; absent here only means the card shows a glyph.
   */
  readonly thumb: string | undefined
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
  // A PDF travels as the path already in the message and the marked pages rendered
  // below. Uploading the whole file made a few marks wait on tens of megabytes and is
  // no better evidence than the pages the reader actually annotated.
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
    warnings.push(zh
      ? `另有 ${hidden} 页标注未附图；原 PDF 不上传，请按上方路径和位置说明处理这些页。`
      : `${hidden} more annotated pages are not attached as images; the PDF itself is not uploaded, so use the path above and the positions and notes for those pages.`)
  }
  const pageCapture = input.pageCapture
    ?? (input.document.figure.mediaType === 'text/html' && shown.length > 0 ? 'attached' : 'none')
  if (pageCapture === 'failed') {
    warnings.push(zh
      ? '当前页面截图未生成；元素选择器和位置信息仍已随消息发送。'
      : 'The current page could not be captured; its element selectors and positions still travelled with the message.')
  }
  const message = buildAnnotationMessage(
    input.document,
    input.paths,
    input.locale,
    shown.length > 0,
    shown.length,
    pageCapture,
  )
  rememberDelivered(message, input.thumb)
  content.push({ type: 'text', text: message })
  await promptSession(input.sessions, input.sessionId, session, content, 'the session refused the annotation message')
  return warnings
}
