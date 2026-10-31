/** The loopback proxy that serves a live page to the panel's frame. */
import { createServer } from 'node:http'
import { connect, type Socket } from 'node:net'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { openLive, type LiveProxy } from '../src/host/live-proxy'

/** Everything the proxy has opened, so a test cannot leak a listener. */
const opened: (LiveProxy | Socket)[] = []

/** A target server that answers every path the tests below care about. */
const TARGET = createServer((req, res) => {
  const path = (req.url ?? '').split('?')[0]
  if (path === '/page') {
    res.writeHead(200, {
      'content-type': 'text/html; charset=utf-8',
      'content-security-policy': "default-src 'none'",
      'content-security-policy-report-only': "default-src 'none'",
      'x-frame-options': 'DENY',
      'x-own-header': 'kept',
    })
    res.end('<!doctype html><html><body><h1>live</h1></body></html>')
    return
  }
  if (path === '/no-body') {
    res.writeHead(200, { 'content-type': 'text/html' })
    res.end('<!doctype html><html><p>no closing tag</p></html>')
    return
  }
  if (path === '/plain') {
    res.writeHead(404, { 'content-type': 'text/plain', 'x-frame-options': 'DENY' })
    res.end('not here')
    return
  }
  if (path === '/untyped') {
    // No `content-type` at all: not a page, whatever the body looks like.
    res.writeHead(200, { 'content-length': '7' })
    res.end('<html/>')
    return
  }
  if (path === '/big') {
    res.writeHead(200, { 'content-type': 'text/html' })
    res.end(`<html><body>${'x'.repeat(9 * 1024 * 1024)}</body></html>`)
    return
  }
  if (path === '/meta-csp') {
    res.writeHead(200, { 'content-type': 'text/html' })
    res.end([
      '<!doctype html><html><head>',
      '<meta content="kept" name="description">',
      '<meta HTTP-EQUIV = "Content-Security-Policy" content="script-src \'none\'">',
      '<meta http-equiv=content-security-policy-report-only content="default-src \'none\'">',
      '</head><body><h1>live</h1></body></html>',
    ].join(''))
    return
  }
  if (path === '/redirect') {
    res.writeHead(302, { location: `${targetOrigin}/page?from=redirect` })
    res.end()
    return
  }
  if (path === '/redirect-away') {
    res.writeHead(302, { location: 'http://example.com/elsewhere' })
    res.end()
    return
  }
  if (path === '/redirect-broken') {
    res.writeHead(302, { location: 'http://[' })
    res.end()
    return
  }
  if (path === '/echo') {
    const parts: Buffer[] = []
    req.on('data', (chunk: Buffer) => { parts.push(chunk) })
    req.on('end', () => {
      res.writeHead(201, { 'content-type': 'text/plain' })
      res.end(`${req.method ?? ''} ${Buffer.concat(parts).toString('utf8')} host=${req.headers['host'] ?? ''}`)
    })
    return
  }
  res.writeHead(404, { 'content-type': 'text/plain' })
  res.end('nothing here')
})
TARGET.on('upgrade', (req, socket, head) => {
  upgradedHead += head.toString('utf8')
  socket.write('HTTP/1.1 101 Switching Protocols\r\nconnection: upgrade\r\nupgrade: ws\r\n\r\n')
  socket.on('data', (chunk: Buffer) => { socket.write(`echo:${chunk.toString('utf8')}`) })
})
/** Whatever the target was handed past the upgrade headers, in the same packet. */
let upgradedHead = ''
/** Where the target is listening. */
let targetOrigin = ''

beforeAll(async () => {
  await new Promise<void>(resolve => { TARGET.listen(0, '127.0.0.1', resolve) })
  const address = TARGET.address()
  targetOrigin = typeof address === 'object' && address !== null ? `http://127.0.0.1:${address.port}` : ''
})

afterAll(() => {
  // A kept-alive connection, or an upgraded one the HTTP server no longer owns,
  // would otherwise hold the listener open for ten seconds after the last test.
  TARGET.closeAllConnections()
  TARGET.close()
})

/** The target server's own address. */
function targetUrl(): string {
  return targetOrigin
}

/** A proxy on the target, remembered so it is closed after the test. */
async function proxyOn(path = ''): Promise<LiveProxy> {
  const proxy = await openLive(new URL(`${targetUrl()}${path}`))
  opened.push(proxy)
  return proxy
}

/** One upgrade request written straight onto a socket. */
function upgradeOnce(url: string, request: string): Promise<string> {
  return new Promise<string>((resolve) => {
    const socket = connect(Number(new URL(url).port), '127.0.0.1', () => { socket.write(request) })
    let seen = ''
    socket.on('data', (chunk: Buffer) => {
      seen += chunk.toString('utf8')
      resolve(seen)
    })
    socket.on('close', () => { resolve(seen) })
    socket.on('error', () => { resolve(seen) })
    setTimeout(() => { socket.destroy() }, 1000)
  })
}

afterEach(() => {
  for (const item of opened.splice(0, opened.length)) {
    if ('close' in item) item.close()
    else item.destroy()
  }
})

describe('what the proxy will open', () => {
  it('refuses anything that is not plain http', async () => {
    await expect(openLive(new URL('https://localhost:5173'))).rejects.toThrow('is not http')
  })

  it('refuses a host that is not this machine', async () => {
    await expect(openLive(new URL('http://example.com'))).rejects.toThrow('loopback')
  })
})

describe('serving a page', () => {
  it('puts the picker in front of the page it serves, and drops the headers that would forbid it', async () => {
    const proxy = await proxyOn('/page?q=1')
    // The frame is pointed at the reader's own path, so the page it asks for is the
    // page the reader typed.
    expect(new URL(proxy.url).search).toBe('?q=1')
    expect(new URL(proxy.url).pathname).toBe('/page')
    const response = await fetch(proxy.url)
    expect(response.status).toBe(200)
    expect(response.headers.get('content-security-policy')).toBeNull()
    expect(response.headers.get('content-security-policy-report-only')).toBeNull()
    expect(response.headers.get('x-frame-options')).toBeNull()
    // Every other header is the page's own business.
    expect(response.headers.get('x-own-header')).toBe('kept')
    const body = await response.text()
    expect(body).toContain('<script src="/__dsh_figmark_picker.js"></script></body>')
    // The length is the proxy's now, because the body is not the one the target sent.
    expect(Number(response.headers.get('content-length'))).toBe(Buffer.byteLength(body))
  })

  it('appends the picker when the page closes no body', async () => {
    const proxy = await proxyOn('/no-body')
    const body = await (await fetch(proxy.url)).text()
    expect(body.endsWith('<script src="/__dsh_figmark_picker.js"></script>')).toBe(true)
  })

  it('keeps a same-origin redirect on the proxy so the picker survives it', async () => {
    const proxy = await proxyOn('/redirect')
    const response = await fetch(proxy.url, { redirect: 'manual' })
    expect(response.status).toBe(302)
    const location = response.headers.get('location')
    expect(location).toBe(`${new URL(proxy.url).origin}/page?from=redirect`)
    const body = await (await fetch(location ?? '')).text()
    expect(body).toContain('<script src="/__dsh_figmark_picker.js"></script>')
  })

  it('leaves a redirect to another origin for the page to follow', async () => {
    const proxy = await proxyOn('/redirect-away')
    const response = await fetch(proxy.url, { redirect: 'manual' })
    expect(response.headers.get('location')).toBe('http://example.com/elsewhere')
  })

  it('does not turn a malformed redirect into an exception', async () => {
    const proxy = await proxyOn('/redirect-broken')
    const response = await fetch(proxy.url, { redirect: 'manual' })
    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('http://[')
  })

  it('removes document-level CSP meta tags before injecting the picker', async () => {
    const proxy = await proxyOn('/meta-csp')
    const body = await (await fetch(proxy.url)).text()
    expect(body).toContain('<meta content="kept" name="description">')
    expect(body).not.toMatch(/http-equiv\s*=\s*["']?content-security-policy/iu)
    expect(body).toContain('<script src="/__dsh_figmark_picker.js"></script>')
  })

  it('serves the picker itself from the proxy', async () => {
    const proxy = await proxyOn('/page')
    const response = await fetch(`${new URL(proxy.url).origin}/__dsh_figmark_picker.js`)
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('javascript')
    expect(await response.text()).toContain('figmark')
  })

  it('hands everything that is not a page straight through, status and all', async () => {
    const proxy = await proxyOn('/plain')
    const response = await fetch(proxy.url)
    expect(response.status).toBe(404)
    expect(await response.text()).toBe('not here')
    // A header only forbidden for pages is still dropped: the frame has to be able to
    // read this answer either way.
    expect(response.headers.get('x-frame-options')).toBeNull()
  })

  it('treats an answer with no content type as no page at all', async () => {
    const proxy = await proxyOn('/untyped')
    const body = await (await fetch(proxy.url)).text()
    expect(body).toBe('<html/>')
  })

  it('forwards a method and a body, and asks the target under its own name', async () => {
    const proxy = await proxyOn()
    const response = await fetch(`${new URL(proxy.url).origin}/echo`, { method: 'POST', body: 'hello' })
    expect(response.status).toBe(201)
    expect(await response.text()).toBe(`POST hello host=${new URL(targetUrl()).host}`)
  })

  it('answers a target that is not listening with a sentence, not a hung frame', async () => {
    const dead = await openLive(new URL('http://127.0.0.1:1'))
    opened.push(dead)
    const response = await fetch(dead.url)
    expect(response.status).toBe(502)
    expect(await response.text()).toBe('the page is not answering')
  })

  it('refuses a page too large to rewrite instead of showing half of it', async () => {
    const proxy = await proxyOn('/big')
    const response = await fetch(proxy.url)
    expect(response.status).toBe(502)
    expect(await response.text()).toContain('larger than')
  })
})

describe('the reload channel', () => {
  it('pipes an upgrade through to the target and back', async () => {
    const proxy = await proxyOn('/page')
    const seen = await upgradeOnce(proxy.url, [
      'GET /socket HTTP/1.1',
      `host: ${new URL(proxy.url).host}`,
      'connection: upgrade',
      'upgrade: websocket',
      'x-token: kept',
      '',
      '',
    ].join('\r\n'))
    // The target's own name replaces the proxy's, so a virtual host still resolves.
    expect(seen).toContain('101')
  })

  it('replays what arrived in the same packet as the upgrade request', async () => {
    upgradedHead = ''
    const proxy = await proxyOn('/socket')
    await upgradeOnce(proxy.url, [
      'GET /socket HTTP/1.1',
      `host: ${new URL(proxy.url).host}`,
      'connection: upgrade',
      'upgrade: websocket',
      '',
      'hello',
    ].join('\r\n'))
    // A handshake is one write on the wire, so the first frame after the headers is
    // the target's to read rather than the proxy's to drop.
    await new Promise((resolve) => { setTimeout(resolve, 100) })
    expect(upgradedHead).toBe('hello')
  })

  it('closes a target that is not answering, rather than leaving the socket open', async () => {
    // `http://localhost` with no port is port 80, which is the arm that has no number
    // to parse — and nothing is listening there in this test.
    const proxy = await openLive(new URL('http://localhost'))
    opened.push(proxy)
    const seen = await upgradeOnce(proxy.url, [
      'GET / HTTP/1.1',
      'host: localhost',
      'connection: upgrade',
      'upgrade: websocket',
      '',
      '',
    ].join('\r\n'))
    expect(seen).toBe('')
  })
})

describe('closing', () => {
  it('releases the port, and does nothing the second time', async () => {
    const proxy = await proxyOn('/page')
    expect((await fetch(proxy.url)).status).toBe(200)
    proxy.close()
    proxy.close()
    await expect(fetch(proxy.url)).rejects.toThrow()
  })
})
