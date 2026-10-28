/**
 * The plugin's own HTTP routes, as the browser half calls them.
 *
 * The routes live outside the shell's authenticated `/api` channel, so every
 * request carries the plugin guard header; cookies still travel with the
 * same-origin request, which is what keeps a foreign page from driving them.
 * @module dsh-figmark/client/host-api
 */

import type { AnnotationDocument } from '../shared/annotation'
import { toBase64 } from '../shared/base64'
import { isPagedMediaType } from '../shared/figure-kind'
import { GUARD_HEADER, ROUTE_PREFIX, type FigureFacts, type SidecarWriteResult } from '../shared/http'

/**
 * Figure facts and any saved annotation the Host reported.
 *
 * The figure half is the Host's own {@link FigureFacts} minus the address this
 * module already knows it asked for; declaring the fields a second time is how a
 * field renamed on the Host side stops travelling here.
 */
export type LoadedAnnotation = Omit<FigureFacts, 'address'> & {
  /** The saved document, or null when the figure was never annotated. */
  readonly annotation: AnnotationDocument | null
}

/**
 * Result of one annotation save.
 *
 * The same shape the Host answers with, so the two cannot drift.
 */
export type SavedAnnotation = SidecarWriteResult

/** Error carrying the Host's own message. */
export class AnnotatorHostError extends Error {
  /**
   * @param message - the message the Host returned.
   */
  constructor(message: string) {
    super(message)
    this.name = 'AnnotatorHostError'
  }
}

/**
 * Read the figure's saved annotation.
 * @param address - the preview tab's file address.
 * @param signal - cancels the request when the tab closes.
 * @returns the Host's answer.
 * @throws {AnnotatorHostError} when the Host refuses the address.
 */
export async function loadAnnotation(
  address: string,
  signal: AbortSignal,
): Promise<LoadedAnnotation> {
  // URLSearchParams round-trips the address exactly, including the `+` and `%`
  // characters a `dsh-resource://` address may carry.
  const query = new URLSearchParams({ address })
  const url = `${ROUTE_PREFIX}/annotation?${query.toString()}`
  const response = await fetch(url, { headers: { [GUARD_HEADER]: '1' }, signal })
  const body = await response.json() as {
    ok?: boolean
    error?: string
    figure?: { path: string; mediaType: string; sha256: string; workspace?: string | null }
    annotation?: AnnotationDocument | null
  }
  if (body.ok !== true || body.figure === undefined) {
    throw new AnnotatorHostError(body.error ?? `annotation read failed with status ${response.status}`)
  }
  return {
    path: body.figure.path,
    mediaType: body.figure.mediaType,
    sha256: body.figure.sha256,
    annotation: body.annotation ?? null,
    workspace: body.figure.workspace ?? null,
  }
}

/**
 * Largest request a `keepalive` fetch may carry.
 *
 * The browser silently refuses anything above this, and a refused save is worse
 * than a normal one: the caller believes the draft was written when it was not.
 */
const KEEPALIVE_LIMIT = 60_000

/**
 * Persist one annotation document and its flattened review artifact.
 *
 * The payload each artifact travels in follows the annotated figure's own kind:
 * a paged document is reviewed as a PDF and a single surface as a PNG, which is
 * the pairing the Host writes and the pairing it refuses to mix up.
 *
 * @param address - the preview tab's file address.
 * @param document - the document to save.
 * @param review - flattened PNG, or the annotated PDF, when the browser exported one.
 * @param keepalive - whether the request should outlive the page, for an autosave
 *   racing a reload. Ignored when the body is too large for one.
 * @returns the paths the Host wrote.
 * @throws {AnnotatorHostError} when the Host refuses the write.
 */
export async function saveAnnotation(
  address: string,
  document: AnnotationDocument,
  review?: Blob | Uint8Array,
  keepalive = false,
): Promise<SavedAnnotation> {
  const paged = isPagedMediaType(document.figure.mediaType)
  const payload = JSON.stringify({
    address,
    annotation: document,
    ...(review === undefined
      ? {}
      : { [paged ? 'annotatedPdf' : 'reviewImage']: await toBase64(review) }),
  })
  const response = await fetch(`${ROUTE_PREFIX}/annotation`, {
    method: 'POST',
    headers: { [GUARD_HEADER]: '1', 'content-type': 'application/json' },
    body: payload,
    ...(keepalive && payload.length <= KEEPALIVE_LIMIT ? { keepalive: true } : {}),
  })
  const body = await response.json() as {
    ok?: boolean
    error?: string
    annotationPath?: string
    reviewPath?: string | null
  }
  if (body.ok !== true || body.annotationPath === undefined) {
    throw new AnnotatorHostError(body.error ?? `annotation save failed with status ${response.status}`)
  }
  return { annotationPath: body.annotationPath, reviewPath: body.reviewPath ?? null }
}

/**
 * Delete the sidecars of one figure, leaving the figure alone.
 *
 * Called when the reader removes every mark, and after a successful delivery: an
 * annotation with nothing left in it is not worth keeping, and a file left behind
 * is exactly what made a deleted annotation come back on the next open.
 *
 * @param address - the preview tab's file address.
 * @throws {AnnotatorHostError} when the Host refuses the address or the removal.
 */
export async function deleteAnnotation(address: string): Promise<void> {
  const query = new URLSearchParams({ address })
  const response = await fetch(`${ROUTE_PREFIX}/annotation?${query.toString()}`, {
    method: 'DELETE',
    headers: { [GUARD_HEADER]: '1' },
  })
  const body = await response.json() as { ok?: boolean; error?: string }
  if (body.ok !== true) {
    throw new AnnotatorHostError(body.error ?? `annotation removal failed with status ${response.status}`)
  }
}
