/**
 * The wire plumbing every plugin route shares: the guard, the body cap, and one
 * way to answer.
 *
 * These routes live outside the shell's authenticated `/api` channel, so the guard
 * is the only thing standing between them and a foreign page: a request header a
 * cross-origin form cannot set without a preflight this plugin never answers,
 * plus an origin check on the browsers that send `Sec-Fetch-Site`. Both are
 * checked here, once, before any handler sees the request — a route that forgot
 * either would be a write path with no guard at all.
 * @module dsh-figmark/host/route-http
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { GUARD_HEADER } from '../shared/http'
import type { AnnotationFailureBody } from '../shared/http'
import { MAX_REVIEW_BYTES } from './store-limits'

/**
 * Largest accepted request body.
 *
 * Twice the review cap: the artifact travels base64-encoded inside a JSON
 * envelope, and base64 costs four characters for every three bytes. Anything past
 * this is refused before it is buffered, which is what keeps a hostile body from
 * being an allocation.
 */
const MAX_BODY_BYTES = MAX_REVIEW_BYTES * 2

/**
 * Whether a request carries the plugin guard and a same-origin posture.
 *
 * A browser that does not send `Sec-Fetch-Site` at all cannot be origin-checked,
 * and the header alone is still a preflight requirement for any cross-origin
 * attempt — so an absent value passes and a present one must be same-origin.
 * @param req - incoming request.
 * @returns true when the request may proceed.
 */
export function guarded(req: IncomingMessage): boolean {
  if (req.headers[GUARD_HEADER] === undefined) return false
  const site = req.headers['sec-fetch-site']
  if (typeof site !== 'string') return true
  return site === 'same-origin' || site === 'none'
}

/**
 * Write one JSON response.
 * @param res - response to own.
 * @param status - HTTP status code.
 * @param body - JSON-serializable payload.
 */
export function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const text = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(text)
}

/**
 * Write one refusal.
 * @param res - response to own.
 * @param status - HTTP status code.
 * @param error - what went wrong, in the Host's own words.
 */
export function sendFailure(res: ServerResponse, status: number, error: string): void {
  const body: AnnotationFailureBody = { ok: false, error }
  sendJson(res, status, body)
}

/**
 * Read a request body with a byte cap.
 * @param req - incoming request.
 * @returns the body text.
 * @throws {Error} when the body exceeds the cap.
 */
export async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = []
  let total = 0
  for await (const chunk of req) {
    const buffer = chunk as Buffer
    total += buffer.length
    if (total > MAX_BODY_BYTES) throw new Error(`request body exceeds ${MAX_BODY_BYTES} bytes`)
    chunks.push(buffer)
  }
  return Buffer.concat(chunks).toString('utf8')
}
