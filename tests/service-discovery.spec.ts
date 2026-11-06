/** Local service discovery: loopback-only candidates, package ports and bounded probes. */
import { createServer, type Server } from 'node:http'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { discoverServices } from '../src/host/service-discovery'

const servers: Server[] = []
let directory = ''

/** Reject a pending real-network operation so a regression cannot wedge the suite. */
function withDeadline<T>(work: Promise<T>, milliseconds: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`operation did not settle within ${String(milliseconds)}ms`))
    }, milliseconds)
    work.then(
      value => {
        clearTimeout(timer)
        resolve(value)
      },
      (reason: unknown) => {
        clearTimeout(timer)
        reject(reason)
      },
    )
  })
}

/** Put one HTTP server on loopback and return its base URL. */
async function serve(
  answer: (response: import('node:http').ServerResponse) => void,
): Promise<string> {
  const server = createServer((_request, response) => { answer(response) })
  servers.push(server)
  await new Promise<void>(resolve => { server.listen(0, '127.0.0.1', resolve) })
  const address = server.address()
  if (typeof address !== 'object' || address === null) throw new Error('test server has no port')
  return `http://127.0.0.1:${String(address.port)}/`
}

beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), 'dsh-figmark-services-'))
})

afterEach(async () => {
  while (servers.length > 0) {
    const server = servers.pop()
    await new Promise<void>(resolve => { server?.close(() => { resolve() }) })
  }
})

afterAll(async () => {
  await rm(directory, { recursive: true, force: true })
})

describe('discovering local pages', () => {
  it('merges homepage index aliases but preserves paths, queries and fragments', async () => {
    const url = await serve(response => {
      response.writeHead(200, { 'content-type': 'text/html' })
      response.end('<title>Deck</title>')
    })
    const recent = [`${url}index.html`, url, `${url}other`, `${url}?view=2`, `${url}index.htm#slide2`]
    const found = await discoverServices({ sessionId: 's', recent }, async () => undefined)
    expect(found.filter(item => item.url.startsWith(url)).map(item => item.url))
      .toEqual([recent[0], ...recent.slice(2)])
  })

  it('reads a successful page title and rejects 4xx and 5xx responses', async () => {
    const titled = await serve(response => {
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
      response.end('<!doctype html><title> Deck &amp; notes &lt;beta&gt; </title>')
    })
    const missing = await serve(response => {
      response.writeHead(404, { 'content-type': 'text/html' })
      response.end('<html><title>Not found</title></html>')
    })
    const broken = await serve(response => {
      response.writeHead(503, { 'content-type': 'text/html' })
      response.end('<title>Stopped</title>')
    })
    const services = await discoverServices({
      sessionId: 's1',
      recent: [titled, missing, broken],
    }, async () => directory)
    expect(services).toContainEqual({ url: titled, title: 'Deck & notes <beta>', source: 'recent' })
    expect(services.some(service => service.url === missing)).toBe(false)
    expect(services.some(service => service.url === broken)).toBe(false)
  })

  it('keeps a page with no title and refuses non-loopback or malformed candidates', async () => {
    const untitled = await serve(response => {
      response.writeHead(200, { 'content-type': 'text/html' })
      response.end('<main>quiet</main>')
    })
    const services = await discoverServices({
      sessionId: 's1',
      recent: [
        untitled,
        'https://127.0.0.1:1234/',
        'http://192.168.1.10:1234/',
        'http://example.com:1234/',
        'not an address',
        untitled,
      ],
    }, async () => directory)
    expect(services).toContainEqual({ url: untitled, source: 'recent' })
    expect(services.filter(service => service.url === untitled)).toHaveLength(1)
    expect(services.some(service => service.url.includes('192.168.1.10'))).toBe(false)
    expect(services.some(service => service.url.includes('example.com'))).toBe(false)
  })

  it('treats blank and oversized titles as bounded names', async () => {
    const blank = await serve(response => {
      response.writeHead(200, { 'content-type': 'text/html' })
      response.end('<title>   </title>')
    })
    const huge = await serve(response => {
      response.writeHead(200, { 'content-type': 'text/html' })
      response.write(`<title>${'x'.repeat(100)}</title>`)
      setTimeout(() => {
        response.write(' '.repeat(65 * 1024))
        response.end('tail')
      }, 0)
    })
    const services = await discoverServices({
      sessionId: 's1',
      recent: [blank, huge, 'http://127.0.0.1/'],
    }, async () => directory)
    expect(services).toContainEqual({ url: blank, source: 'recent' })
    expect(services.find(service => service.url === huge)?.title).toBe('x'.repeat(80))
  })

  it('closes a response that keeps streaming after the 64KiB body cap', async () => {
    let responseClosed = false
    let markClosed: (() => void) | undefined
    const closed = new Promise<void>(resolve => { markClosed = resolve })
    const streaming = await serve(response => {
      response.writeHead(200, { 'content-type': 'text/html' })
      response.write('<title>Streaming deck</title>')
      const timer = setInterval(() => {
        if (!response.destroyed) response.write('x'.repeat(1024))
      }, 1)
      response.on('close', () => {
        clearInterval(timer)
        responseClosed = true
        markClosed?.()
      })
    })
    const services = await withDeadline(discoverServices({
      sessionId: 's1',
      recent: [streaming],
    }, async () => undefined), 1500)
    expect(services).toContainEqual({
      url: streaming,
      title: 'Streaming deck',
      source: 'recent',
    })
    await withDeadline(closed, 1000)
    expect(responseClosed).toBe(true)
  })

  it('uses an absolute deadline even while a response keeps trickling bytes', async () => {
    let markClosed: (() => void) | undefined
    const closed = new Promise<void>(resolve => { markClosed = resolve })
    const trickling = await serve(response => {
      response.writeHead(200, { 'content-type': 'text/html' })
      const timer = setInterval(() => {
        if (!response.destroyed) response.write(' ')
      }, 50)
      response.on('close', () => {
        clearInterval(timer)
        markClosed?.()
      })
    })
    const started = Date.now()
    const services = await withDeadline(discoverServices({
      sessionId: 's1',
      recent: [trickling],
    }, async () => undefined), 2000)
    expect(services.some(service => service.url === trickling)).toBe(false)
    expect(Date.now() - started).toBeLessThan(1500)
    await withDeadline(closed, 1000)
  })

  it('adds ports named by workspace scripts and ranks them before common ports', async () => {
    const workspace = await serve(response => {
      response.writeHead(200, { 'content-type': 'text/html' })
      response.end('<title>Workspace app</title>')
    })
    const port = new URL(workspace).port
    const cwd = join(directory, 'workspace')
    await mkdir(cwd, { recursive: true })
    await writeFile(join(cwd, 'package.json'), JSON.stringify({
      scripts: {
        dev: `vite --port ${port}`,
        start: `node server.js --port=${port}`,
        ignored: 42,
      },
    }))
    const services = await discoverServices({
      sessionId: 's1',
      recent: [],
    }, async () => cwd)
    expect(services.some(service => service.source === 'workspace' && service.url.includes(port))).toBe(true)
    const firstWorkspace = services.findIndex(service => service.source === 'workspace')
    const firstCommon = services.findIndex(service => service.source === 'common')
    if (firstCommon >= 0) expect(firstWorkspace).toBeLessThan(firstCommon)

    const remembered = await discoverServices({
      sessionId: 's1',
      recent: [workspace],
    }, async () => cwd)
    expect(remembered.find(service => service.url === workspace)?.source).toBe('recent')
    expect(remembered[0]?.source).toBe('recent')
  })

  it('still probes common ports without a readable workspace package', async () => {
    const services = await discoverServices({ sessionId: 'unknown', recent: [] }, async () => undefined)
    expect(Array.isArray(services)).toBe(true)
  })

  it('uses an empty script list when a package has no scripts and tolerates no recent list', async () => {
    const cwd = join(directory, 'no-scripts')
    await mkdir(cwd, { recursive: true })
    await writeFile(join(cwd, 'package.json'), '{}')
    const services = await discoverServices({ sessionId: 's1' }, async () => cwd)
    expect(Array.isArray(services)).toBe(true)
  })

  it('times out a server that accepts a request but never answers', async () => {
    const silent = createServer(() => {})
    servers.push(silent)
    await new Promise<void>(resolve => { silent.listen(0, '127.0.0.1', resolve) })
    const address = silent.address()
    if (typeof address !== 'object' || address === null) throw new Error('test server has no port')
    const url = `http://127.0.0.1:${String(address.port)}/`
    const services = await discoverServices({ sessionId: 's1', recent: [url] }, async () => undefined)
    expect(services.some(service => service.url === url)).toBe(false)
  })
})
