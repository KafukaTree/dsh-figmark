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
 *
 * One route is not about a figure at all: `/live` opens the page the reader typed
 * as a proxied frame, or closes the one that is open. It shares this handler
 * because it shares the guard and the one-way-to-answer rule, not because it
 * touches the annotation.
 * @module dsh-figmark/host/routes
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import type {
  AnnotationReadBody,
  AnnotationRemoveBody,
  AnnotationSaveBody,
} from '../shared/http'
import { GUARD_HEADER, ROUTE_PREFIX } from '../shared/http'
import { LIVE_ROUTE, type LiveOpenAnswer } from '../shared/live'
import {
  SERVICE_DISCOVER_ROUTE,
  type ServiceDiscoverAnswer,
  type ServiceDiscoverRequest,
} from '../shared/services'
import { resolveTarget, type FigureTarget } from './figure-target'
import { openLive, type LiveProxy } from './live-proxy'
import { guarded, readBody, sendFailure, sendJson } from './route-http'
import { readReview } from './review-payload'
import { discoverServices } from './service-discovery'
import {
  MAX_REVIEW_BYTES,
  fileDigest,
  readAnnotation,
  readAnnotationDocument,
  removeAnnotation,
  writeAnnotation,
} from './store'

export { GUARD_HEADER, ROUTE_PREFIX }

/** The route a live page is opened and closed on. */
const LIVE_PATH = `${ROUTE_PREFIX}${LIVE_ROUTE}`
/** The route that probes bounded loopback candidates. */
const SERVICES_PATH = `${ROUTE_PREFIX}${SERVICE_DISCOVER_ROUTE}`

/** What closing a live page answers: nothing beyond success. */
interface LiveCloseAnswer {
  /** Always true. */
  readonly ok: true
}

/** What the routes need from the plugin. */
export interface RouteDeps {
  /**
   * Resolve one Session's workspace directory.
   * @param sessionId - the Session named by the address.
   * @returns the absolute directory, or undefined when the Session is unknown.
   */
  readonly sessionCwd: (sessionId: string) => Promise<string | undefined>
}

/** The live-page operation a route composition uses. */
export interface RouteLiveRuntime {
  /** Open one loopback page and return the listener that serves it. */
  readonly open: (url: URL) => Promise<LiveProxy>
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
 * @param liveRuntime - live-page operation, replaceable at the listener boundary in tests.
 * @returns one handler per route path.
 */
export function createHandlers(
  deps: RouteDeps,
  liveRuntime: RouteLiveRuntime = { open: openLive },
): {
  readonly annotation: (req: IncomingMessage, res: ServerResponse) => Promise<void>
  /** Close every runtime this composition still owns. */
  readonly close: () => void
} {
  /**
   * The page being served to the panel, when one is.
   *
   * One at a time, because the panel shows one frame: a second page would leave
   * the first proxy listening with nothing pointing at it. The state lives here,
   * per composition, so two hosts in one process never share a frame.
   */
  let live: LiveProxy | undefined
  /** The latest open request admitted, even while its listener is still starting. */
  let liveOpenSequence = 0

  /**
   * Open the page one request names, or close whatever page is open.
   * @param req - the request naming the operation.
   * @param requestUrl - the already parsed request target.
   * @returns the answer to send.
   */
  const liveAnswer = async (
    req: IncomingMessage,
    requestUrl: URL,
  ): Promise<Answer<LiveOpenAnswer | LiveCloseAnswer>> => {
    if (req.method === 'POST') {
      const sequence = liveOpenSequence + 1
      liveOpenSequence = sequence
      const body = JSON.parse(await readBody(req)) as Record<string, unknown>
      // Opened before the old page closes: an address that turns out not to be a
      // loopback page leaves the frame the reader was looking at where it was.
      const proxy = await liveRuntime.open(new URL(typeof body['url'] === 'string' ? body['url'] : ''))
      if (sequence !== liveOpenSequence) {
        // A newer open arrived while this listener was starting. Installing this one
        // would leave the newer frame pointing at a proxy the older answer replaced.
        proxy.close()
        return { ok: false, status: 409, error: 'a newer local page superseded this one' }
      }
      live?.close()
      live = proxy
      return { ok: true, body: { ok: true, url: proxy.url } }
    }
    if (req.method === 'DELETE') {
      const expected = requestUrl.searchParams.get('url')
      // A global close also cancels any open still starting. A close tied to the
      // current proxy must not cancel a newer open that is replacing it.
      if (expected === null) liveOpenSequence += 1
      if (live !== undefined && (expected === null || expected === live.url)) {
        live.close()
        live = undefined
      }
      return { ok: true, body: { ok: true } }
    }
    return { ok: false, status: 405, error: `method ${String(req.method)} is not allowed` }
  }

  /**
   * Scan the bounded local candidates the browser asked about.
   * @param req - a POST carrying a session and optional recent URLs.
   * @returns reachable services, or a method refusal.
   */
  const serviceAnswer = async (req: IncomingMessage): Promise<Answer<ServiceDiscoverAnswer>> => {
    if (req.method !== 'POST') {
      return { ok: false, status: 405, error: `method ${String(req.method)} is not allowed` }
    }
    const raw = JSON.parse(await readBody(req)) as Record<string, unknown>
    const sessionId = typeof raw['sessionId'] === 'string' ? raw['sessionId'] : ''
    if (sessionId === '') return { ok: false, status: 400, error: 'service discovery needs a session' }
    const recent = Array.isArray(raw['recent'])
      ? raw['recent'].filter((value): value is string => typeof value === 'string').slice(0, 16)
      : undefined
    const request: ServiceDiscoverRequest = { sessionId, ...(recent === undefined ? {} : { recent }) }
    return { ok: true, body: { ok: true, services: await discoverServices(request, deps.sessionCwd) } }
  }

  const annotation = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    if (!guarded(req)) {
      sendFailure(res, 403, 'missing plugin guard header')
      return
    }
    try {
      // Inside the try, because parsing is the one step that can throw before any
      // route sees the request: a target like `//[` is neither a path nor an origin,
      // and `new URL` refuses it. The plugin's contract is that a handler answers
      // rather than rejects, so that refusal is this handler's 400 to write.
      const url = new URL(req.url ?? '/', 'http://localhost')
      const answer = url.pathname === LIVE_PATH
        ? await liveAnswer(req, url)
        : url.pathname === SERVICES_PATH
          ? await serviceAnswer(req)
        : await route(req, url, deps)
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
  return {
    annotation,
    close(): void {
      // A request still starting belongs to this composition too. Advancing the
      // sequence makes it close itself instead of installing after teardown.
      liveOpenSequence += 1
      live?.close()
      live = undefined
    },
  }
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
