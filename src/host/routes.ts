/**
 * HTTP routes of the annotator.
 *
 * This module is only the assembly: it maps a method and a URL to one handler,
 * and each handler is one operation on one resolved figure. The pieces it leans on
 * each own their hazard instead —
 *
 * - `route-http.ts` holds the guard, the body cap, and the one way to answer;
 * - `figure-target.ts` is the only place a request string becomes a path;
 * - `review-payload.ts` is the only place request bytes become a review artifact.
 *
 * Writes are limited to the two sidecar files derived from a figure that already
 * exists, because the only path any handler passes to the store is the one
 * `resolveTarget` produced.
 * @module dsh-figmark/host/routes
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import type {
  AnnotationReadBody,
  AnnotationRemoveBody,
  AnnotationSaveBody,
} from '../shared/http'
import { resolveTarget, type FigureTarget } from './figure-target'
import { guarded, readBody, sendFailure, sendJson } from './route-http'
import { readReview } from './review-payload'
import {
  MAX_REVIEW_BYTES,
  fileDigest,
  readAnnotation,
  readAnnotationDocument,
  removeAnnotation,
  writeAnnotation,
} from './store'

export { GUARD_HEADER, ROUTE_PREFIX } from '../shared/http'

/** What the routes need from the plugin. */
export interface RouteDeps {
  /**
   * Resolve one Session's workspace directory.
   * @param sessionId - the Session named by the address.
   * @returns the absolute directory, or undefined when the Session is unknown.
   */
  readonly sessionCwd: (sessionId: string) => Promise<string | undefined>
}

/** One handler's answer: either the body to send, or a refusal with its status. */
type Answer<T> =
  | { readonly ok: true; readonly body: T }
  | { readonly ok: false; readonly status: number; readonly error: string }

/**
 * Resolve the figure one request names, as an answer rather than an exception.
 * @param address - the address the request carried, empty when it carried none.
 * @param deps - Session lookup.
 * @returns the target, or the 404 refusal to send.
 */
async function targetOf(address: string, deps: RouteDeps): Promise<Answer<FigureTarget>> {
  const resolved = await resolveTarget(address, deps.sessionCwd)
  return resolved.ok
    ? { ok: true, body: resolved.target }
    : { ok: false, status: 404, error: resolved.message }
}

/**
 * Read the figure's current hash and its saved annotation.
 * @param target - the resolved figure.
 * @returns the read body.
 */
async function readAnswer(target: FigureTarget): Promise<AnnotationReadBody> {
  // Read the sidecar first, then the figure: `Promise.all` let the two race, so the
  // digest could describe a figure written *after* the marks were read, and the panel
  // then compared a fingerprint of the new picture against marks drawn on the old one
  // and reported the annotation as current. One order is honest — marks first — and
  // the comparison downstream is only meaningful if the digest is the later of the two.
  const saved = await readAnnotation(target.path)
  const sha256 = await fileDigest(target.path)
  return {
    ok: true,
    figure: { ...target, sha256 },
    annotation: saved.annotation,
    // Left out when there is nothing to report, so the ordinary answer stays the
    // shape it always was: a caller reading `annotation` alone cannot regress.
    ...(saved.unreadable.length === 0 ? {} : { unreadable: saved.unreadable }),
  }
}

/**
 * Write the annotation one request carried.
 * @param target - the resolved figure.
 * @param raw - the parsed request body.
 * @returns the save body, or the refusal to send.
 */
async function saveAnswer(target: FigureTarget, raw: Record<string, unknown>): Promise<Answer<AnnotationSaveBody>> {
  // The body is validated before the review artifact is decoded: a document this
  // plugin did not write is refused without spending the memory its bytes claim.
  const document = readAnnotationDocument(raw['annotation'])
  const review = readReview(raw)
  if (review !== undefined && review.bytes.byteLength > MAX_REVIEW_BYTES) {
    return { ok: false, status: 413, error: 'the review artifact is too large' }
  }
  const saved = await writeAnnotation(target.path, document, review)
  return {
    ok: true,
    body: {
      ok: true,
      annotationPath: saved.paths.annotation,
      reviewPath: saved.wroteReview ? saved.paths.review : null,
    },
  }
}

/**
 * Remove the sidecars of one figure.
 * @param target - the resolved figure.
 * @returns the removal body.
 */
async function removeAnswer(target: FigureTarget): Promise<AnnotationRemoveBody> {
  // The figure survives; only the two files derived from it go. That is what
  // makes a deleted or delivered annotation stay gone across a reload.
  const removed = await removeAnnotation(target.path)
  return {
    ok: true,
    annotationPath: removed.paths.annotation,
    reviewPath: removed.paths.review,
    removed: removed.removed,
  }
}

/**
 * Build the route handlers this plugin registers.
 * @param deps - Session lookup.
 * @returns one handler per route path.
 */
export function createHandlers(deps: RouteDeps): {
  readonly annotation: (req: IncomingMessage, res: ServerResponse) => Promise<void>
} {
  const annotation = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    if (!guarded(req)) {
      sendFailure(res, 403, 'missing plugin guard header')
      return
    }
    const url = new URL(req.url ?? '/', 'http://localhost')
    try {
      const answer = await route(req, url, deps)
      if (answer.ok) {
        sendJson(res, 200, answer.body)
        return
      }
      sendFailure(res, answer.status, answer.error)
    } catch (error) {
      // Every failure is reported in the browser's own terms: a 400 with the
      // message the validator or the filesystem produced, never a silent close.
      sendFailure(res, 400, error instanceof Error ? error.message : String(error))
    }
  }
  return { annotation }
}

/**
 * Dispatch one guarded request to the operation its method names.
 * @param req - incoming request.
 * @param url - the request's URL.
 * @param deps - Session lookup.
 * @returns the answer to send.
 */
async function route(
  req: IncomingMessage,
  url: URL,
  deps: RouteDeps,
): Promise<Answer<AnnotationReadBody | AnnotationSaveBody | AnnotationRemoveBody>> {
  const address = url.searchParams.get('address') ?? ''
  if (req.method === 'GET') {
    const target = await targetOf(address, deps)
    if (!target.ok) return target
    return { ok: true, body: await readAnswer(target.body) }
  }
  if (req.method === 'POST') {
    const body = JSON.parse(await readBody(req)) as Record<string, unknown>
    const target = await targetOf(typeof body['address'] === 'string' ? body['address'] : '', deps)
    if (!target.ok) return target
    return await saveAnswer(target.body, body)
  }
  if (req.method === 'DELETE') {
    const target = await targetOf(address, deps)
    if (!target.ok) return target
    return { ok: true, body: await removeAnswer(target.body) }
  }
  return { ok: false, status: 405, error: `method ${req.method ?? ''} is not allowed` }
}
