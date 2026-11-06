/**
 * Find local HTTP services without exposing an open network relay.
 *
 * The scan is deliberately bounded: loopback only, a short list of common ports,
 * ports named by the current workspace's package scripts, and recently used URLs.
 * It never scans 1-65535 and never follows a candidate to another host.
 * @module dsh-figmark/host/service-discovery
 */
import { readFile } from 'node:fs/promises'
import { request } from 'node:http'
import { join } from 'node:path'
import type {
  ServiceDiscoverRequest,
  ServiceSummary,
} from '../shared/services'

/** Ports common development servers use when the package does not say. */
const COMMON_PORTS = [3000, 3001, 4173, 4321, 5173, 5174, 8000, 8080, 8888, 8898] as const

/** Most pages one scan reads at once. */
const CONCURRENCY = 8

/** Most candidates one scan will consider. */
const MAX_CANDIDATES = 32

/** Longest title retained from a page. */
const MAX_TITLE = 80

/** Most body bytes one probe will read before closing the response. */
const MAX_BODY_BYTES = 64 * 1024

/** Absolute lifetime of one probe, including connect, response, and body. */
const PROBE_TIMEOUT_MS = 450

/** A candidate before it is probed. */
interface Candidate {
  readonly url: string
  readonly source: ServiceSummary['source']
}

/** Whether a URL is plain HTTP on this machine. */
function loopback(url: URL): boolean {
  return url.protocol === 'http:'
    && (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]')
}

/** A normalized candidate URL, or undefined when it is not a loopback HTTP page. */
function candidateOf(value: string, source: ServiceSummary['source']): Candidate | undefined {
  try {
    const url = new URL(value)
    return loopback(url) ? { url: url.href, source } : undefined
  } catch {
    return undefined
  }
}

/** Ports explicitly named by the workspace's package scripts. */
async function workspacePorts(cwd: string | undefined): Promise<number[]> {
  if (cwd === undefined) return []
  try {
    const raw = JSON.parse(await readFile(join(cwd, 'package.json'), 'utf8')) as {
      readonly scripts?: Record<string, unknown>
    }
    const text = Object.values(raw.scripts ?? {}).filter((value): value is string => typeof value === 'string').join(' ')
    const found = [...text.matchAll(/(?:--port(?:=|\s+)|PORT=)([1-9][0-9]{1,4})/gu)]
      .map(match => Number(match[1]))
    return found.filter(port => Number.isInteger(port) && port > 0 && port < 65_536)
  } catch {
    return []
  }
}

/** Extract a short title from the beginning of an HTML answer. */
function titleOf(html: string): string | undefined {
  const match = /<title\b[^>]*>([\s\S]*?)<\/title>/iu.exec(html)
  if (match === null) return undefined
  const title = match[0]
    .replace(/^<title\b[^>]*>/iu, '')
    .replace(/<\/title>$/iu, '')
    .replace(/<[^>]+>/gu, ' ')
    .replace(/&amp;/gu, '&')
    .replace(/&lt;/gu, '<')
    .replace(/&gt;/gu, '>')
    .replace(/&quot;/gu, '"')
    .replace(/&#39;/gu, "'")
    .replace(/\s+/gu, ' ')
    .trim()
  return title === '' ? undefined : title.slice(0, MAX_TITLE)
}

/** Ask one address for its title; undefined means nothing answered there. */
function probe(candidate: Candidate): Promise<ServiceSummary | undefined> {
  return new Promise(resolve => {
    const url = new URL(candidate.url)
    let settled = false
    let deadline: ReturnType<typeof setTimeout>
    const finish = (answer: ServiceSummary | undefined): void => {
      if (settled) return
      settled = true
      clearTimeout(deadline)
      resolve(answer)
    }
    const req = request({
      protocol: 'http:',
      hostname: url.hostname,
      port: url.port === '' ? 80 : Number(url.port),
      path: `${url.pathname}${url.search}`,
      method: 'GET',
      headers: { accept: 'text/html,application/xhtml+xml' },
    }, res => {
      const chunks: Buffer[] = []
      let bytes = 0
      const finishResponse = (): void => {
        /* v8 ignore next -- Node populates statusCode before emitting `response`. */
        const status = res.statusCode ?? 0
        if (status < 200 || status >= 400) {
          finish(undefined)
          return
        }
        const title = titleOf(Buffer.concat(chunks).toString('utf8'))
        finish({
          url: candidate.url,
          source: candidate.source,
          ...(title === undefined ? {} : { title }),
        })
      }
      res.on('data', (chunk: Buffer) => {
        const kept = chunk.subarray(0, MAX_BODY_BYTES - bytes)
        chunks.push(kept)
        bytes += kept.byteLength
        if (bytes < MAX_BODY_BYTES) return
        finishResponse()
        res.destroy()
      })
      res.on('end', finishResponse)
      res.on('error', () => { finish(undefined) })
    })
    deadline = setTimeout(() => {
      finish(undefined)
      req.destroy()
    }, PROBE_TIMEOUT_MS)
    req.on('error', () => { finish(undefined) })
    req.end()
  })
}

/** Probe candidates with a fixed number of workers. */
async function probeAll(candidates: readonly Candidate[]): Promise<ServiceSummary[]> {
  const answers: ServiceSummary[] = []
  let next = 0
  const work = async (): Promise<void> => {
    for (;;) {
      const index = next
      next += 1
      const candidate = candidates[index]
      if (candidate === undefined) return
      const answer = await probe(candidate)
      if (answer !== undefined) answers.push(answer)
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, candidates.length) }, work))
  return answers
}

/**
 * Discover reachable local HTTP services.
 * @param request - the browser's session and recent addresses.
 * @param sessionCwd - resolves that session's workspace.
 * @returns the reachable services, de-duplicated by URL.
 */
export async function discoverServices(
  request: ServiceDiscoverRequest,
  sessionCwd: (sessionId: string) => Promise<string | undefined>,
): Promise<readonly ServiceSummary[]> {
  const cwd = await sessionCwd(request.sessionId)
  const ports = await workspacePorts(cwd)
  const candidates: Candidate[] = []
  const seen = new Set<string>()
  const add = (candidate: Candidate | undefined): void => {
    if (candidate === undefined || seen.has(candidate.url) || candidates.length >= MAX_CANDIDATES) return
    seen.add(candidate.url)
    candidates.push(candidate)
  }
  for (const recent of request.recent ?? []) add(candidateOf(recent, 'recent'))
  for (const port of ports) add(candidateOf(`http://127.0.0.1:${String(port)}/`, 'workspace'))
  for (const port of COMMON_PORTS) add(candidateOf(`http://127.0.0.1:${String(port)}/`, 'common'))
  const services = await probeAll(candidates)
  const rank: Record<ServiceSummary['source'], number> = { recent: 0, workspace: 1, common: 2 }
  const sorted = services.sort((left, right) =>
    rank[left.source] - rank[right.source]
    || new URL(left.url).port.localeCompare(new URL(right.url).port, undefined, { numeric: true }))
  // Collapse only a proven index alias (same endpoint, title, search and hash).
  // Different paths or query-driven pages remain distinct even with the same title.
  const pages = new Set<string>()
  return sorted.filter(service => {
    const url = new URL(service.url)
    const path = service.title === undefined ? url.pathname : url.pathname.replace(/\/index\.html?$/iu, '/')
    const key = `${url.origin}${path}${url.search}${url.hash}\n${service.title ?? ''}`
    if (pages.has(key)) return false
    pages.add(key)
    return true
  })
}
