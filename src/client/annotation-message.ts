/**
 * The user message that carries one annotation.
 *
 * The message is an ordinary user turn: a header naming the figure, the line that
 * describes the attachment the save actually wrote, the numbered mark list, and one
 * closing instruction. It is the only place the agent learns what the reader wants,
 * so its wording is a contract — a phrase removed here changes what the agent does,
 * not merely how the transcript reads.
 *
 * Nothing here knows about sessions or uploads: composing the text and delivering
 * it are separate jobs, and this module holds only the first. That is what lets the
 * composer draft reuse the exact message the session would have received.
 * @module dsh-figmark/client/annotation-message
 */
import type { AnnotationDocument, SummaryLocale } from '../shared/annotation'
import { annotatedPages, needsReviewImage } from '../shared/annotation'
import type { SidecarWriteResult } from '../shared/http'
import { describeFigureScope, describeMarks } from '../shared/mark-summary'

/**
 * Paths the annotation was written to, as the message must name them.
 *
 * One shape with the Host's answer: the save returns it, the message reads it, and
 * the composer stages against it, so a field renamed on one side cannot leave the
 * other reading undefined.
 */
export type DeliveredPaths = SidecarWriteResult

/**
 * Compose the user message that carries one annotation.
 * @param document - the saved document.
 * @param paths - sidecar paths the Host wrote.
 * @param locale - message language.
 * @param attachment - whether the review artifact actually travels with the message.
 *   The paths say what the *Host wrote to disk*; whether the session accepted the file
 *   part is a different fact, known only once the attachment has been attempted. The
 *   message is composed after that attempt so its one sentence about the attachment can
 *   be true. Defaults to "it travelled", for the callers that build a message from paths
 *   alone.
 * @returns the message text.
 */
export function buildAnnotationMessage(
  document: AnnotationDocument,
  paths: DeliveredPaths,
  locale: SummaryLocale,
  attachment = true,
): string {
  // The paths themselves are never printed: the sidecars are deleted once the
  // annotation has been delivered, so a path in the message would be a dead
  // reference by the time the agent reads it. What the paths do tell us is whether
  // an artifact exists, which is what lets the message describe the attachment it
  // actually carries instead of guessing from the marks.
  const zh = locale === 'zh'
  const { figure, marks } = document
  const scope = describeFigureScope(figure, locale)
  // A rendered document is measured in the pixels it was laid out in, and it has
  // no picture: the marks file and the locators inside it are the whole payload.
  const rendered = figure.mediaType === 'text/html'
  const size = figure.width === undefined || figure.height === undefined
    ? ''
    : rendered
      ? (zh
        ? `渲染面 ${Math.round(figure.width)}×${Math.round(figure.height)}，`
        : `rendered surface ${Math.round(figure.width)}x${Math.round(figure.height)}, `)
      : (zh
        ? `图面 ${Math.round(figure.width)}×${Math.round(figure.height)}，`
        : `figure ${Math.round(figure.width)}x${Math.round(figure.height)}, `)
  const pages = annotatedPages(document)
  const marked = pages.length === 0
    ? ''
    : (zh ? `其中 ${pages.length} 页有标注，` : `${pages.length} pages marked, `)
  const kind = rendered
    ? (zh ? '【HTML 标注】' : '[HTML annotations]')
    : (zh ? '【附图标注】' : '[figure annotations]')
  const header = zh
    ? `${kind}${figure.path}（${scope === '' ? '' : `${scope}，`}${size}${marked}标注 ${marks.length} 处）`
    : `${kind} ${figure.path} (${scope === '' ? '' : `${scope}, `}${size}${marked}${marks.length} marks)`
  const paged = figure.pageCount !== undefined
  // A written review artifact is the first half of the evidence that a picture travels
  // with this message: the Host writes it, and the session then has to accept the file
  // part. Both have to be true, or the message would be naming an attachment the agent
  // cannot find.
  const pictured = paths.reviewPath !== null && attachment
  const attachmentLines = !pictured
    ? []
    : [paged
      ? (zh ? '带批注 PDF 已作为本条消息的附件发送，可直接在阅读器里核对。' : 'The annotated PDF is attached to this message; you can check it in any reader.')
      : (zh ? '标注图已作为本条消息的附件发送。' : 'The annotated image is attached to this message.')]
  // Only point marks: one coordinate and a sentence each. There is nothing for a
  // picture to add, so none was rendered — the figure's own path above is the index.
  const noPicture = !pictured && !rendered && marks.length > 0 && !needsReviewImage(document)
    ? [zh
      ? '本条标注只有位置点，没有标注图：按上面逐条的坐标与说明处理原图即可。'
      : 'These marks are points only, so no annotated image was made: work from the coordinates and notes above against the original figure.']
    : []
  const summary = document.summary !== undefined && document.summary.trim() !== ''
    ? [zh ? `目标：${document.summary.trim()}` : `goal: ${document.summary.trim()}`, '']
    : []
  // The closing line is one sentence, not a paragraph. The standing rules — read every
  // mark, answer mark by mark, edit the source rather than the bitmap — are already in
  // the prompt section that every one of these messages arrives under, and repeating
  // them per message only made the part the agent has to act on harder to find.
  const closer = rendered
    ? (zh ? '逐条改 HTML 生成源。' : 'Edit the HTML source, mark by mark.')
    : paged
      ? (zh ? '逐条处理该 PDF。' : 'Work through the PDF, mark by mark.')
      : (zh ? '逐条改生成源。' : 'Edit the generating source, mark by mark.')
  return [header, ...attachmentLines, ...noPicture, '', ...summary, ...describeMarks(document, locale), '', closer].join('\n')
}