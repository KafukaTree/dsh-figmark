/**
 * Turning a rendered review into the file the composer's rail can hold.
 *
 * The composer stages attachments as files, and the review the reader is about to send
 * is a picture or a PDF that this plugin rendered in the page. Nothing here reads or
 * rewrites bytes: the name is the one the direct send would have given the same
 * content, so the rail, the bubble and the written file all say the same thing about
 * the same bytes.
 * @module dsh-figmark/client/review-attachment
 */
import { baseNameOf } from '../shared/path-name'

/**
 * The review picture, as a draft attachment.
 * @param review - the PNG the surface exported, when it exported one.
 * @param path - the document the picture belongs to, for the attachment's name.
 * @returns the file, or undefined when there is no picture to stage.
 */
export function reviewImageFile(review: Blob | undefined, path: string): File | undefined {
  return review === undefined
    ? undefined
    : new File([review], `${baseNameOf(path)}.annotated.png`, { type: 'image/png' })
}

/**
 * The annotated document, as a draft attachment.
 * @param bytes - the PDF the surfaces wrote marks into, when they wrote one.
 * @param path - the document the PDF belongs to, for the attachment's name.
 * @returns the file, or undefined when there is no PDF to stage.
 */
export function annotatedPdfFile(bytes: Uint8Array | undefined, path: string): File | undefined {
  return bytes === undefined
    ? undefined
    : new File([bytes], `${baseNameOf(path)}.annotated.pdf`, { type: 'application/pdf' })
}
