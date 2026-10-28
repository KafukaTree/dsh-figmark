/**
 * Turning the bytes in one save request into the review artifact.
 *
 * A save carries at most one artifact, and which JSON field holds it is the same
 * choice as the artifact's kind: `annotatedPdf` carries the document the browser
 * wrote its marks into, `reviewImage` carries the flattened picture. Both arrive
 * base64-encoded, so this module is also where a payload that is not what its
 * field claims is refused — a PDF payload without a PDF header would otherwise be
 * written beside the document and fail to open later, far from the request that
 * caused it.
 * @module dsh-figmark/host/review-payload
 */
import type { ReviewArtifact } from './store-write'

/** First bytes of every PDF file, used to tell one payload from another. */
const PDF_HEADER = '%PDF-'

/**
 * Read the one flattened review artifact a save may carry.
 *
 * The kind is taken from the payload, and the store refuses a pair that
 * contradicts the figure's own suffix — so a caller cannot name PNG bytes as the
 * review of a PDF.
 *
 * @param body - parsed request body.
 * @returns the artifact, or undefined when the save carried none.
 * @throws {Error} when both payloads are present, or the PDF bytes are not a PDF.
 */
export function readReview(body: Record<string, unknown>): ReviewArtifact | undefined {
  const image = typeof body['reviewImage'] === 'string' ? body['reviewImage'] : ''
  const pdf = typeof body['annotatedPdf'] === 'string' ? body['annotatedPdf'] : ''
  if (image !== '' && pdf !== '') throw new Error('a save carries one review artifact, not both')
  if (pdf !== '') {
    const bytes = new Uint8Array(Buffer.from(pdf, 'base64'))
    if (!Buffer.from(bytes.subarray(0, PDF_HEADER.length)).toString('latin1').startsWith(PDF_HEADER)) {
      throw new Error('the annotated document is not a PDF')
    }
    return { kind: 'pdf', bytes }
  }
  if (image !== '') return { kind: 'image', bytes: new Uint8Array(Buffer.from(image, 'base64')) }
  return undefined
}
