/**
 * A live page, served from this machine so the panel can frame it.
 *
 * The panel cannot simply point a frame at somebody's dev server. A frame is
 * usually refused outright by the page's own `X-Frame-Options` or CSP, and even
 * when it loads, a cross-origin frame is opaque: the panel can look at it and
 * nothing more. Neither is acceptable — the reader has to point at elements in
 * the page, which takes a script running inside it.
 *
 * So the page is fetched by the Host instead. The frame points at
 * `http://127.0.0.1:<port>`, that origin is the proxy's, and the proxy is a
 * pass-through with three edits: policies that would forbid framing or the
 * injected script are dropped (headers and HTML meta tags alike), same-origin
 * redirects are kept on the proxy origin, and the script tag is put in front of
 * `</body>` in HTML. Everything else — methods, bodies, assets, the dev server's
 * own websocket-free HMR client — crosses untouched, which is what keeps a
 * script-driven page behaving like the page it is.
 *
 * Only this machine's own servers are reachable through it. A proxy that
 * accepted any origin would be an open relay running inside the app, so a
 * target has to be loopback by name *and* be plain `http:`: the plugin's route
 * is not the place to invent TLS to a local server.
 * @module dsh-figmark/host/live-proxy
 */
import { createServer, request as httpRequest } from 'node:http'
import type {
  IncomingHttpHeaders,
  IncomingMessage,
  OutgoingHttpHeaders,
  Server,
  ServerResponse,
} from 'node:http'
import { connect as netConnect } from 'node:net'
import type { AddressInfo, Socket } from 'node:net'
import {
  MAX_HTML_BYTES, PICKER_PATH, PICKER_TAG, injectPicker, stripCspMeta,
} from './html-injection'
import { PICKER_SCRIPT } from './picker-script'

/** What the frame shows when the page stopped answering. */
const DOWN = 'the page is not answering'

/** What the frame shows when a page is too big to rewrite. */
const TOO_BIG = `the page is larger than ${MAX_HTML_BYTES} bytes, so the picker was not injected`

/**
 * Headers the proxy always drops from an answer.
 *
 * The first two would forbid the injected script or the frame itself; the third
 * is the pre-CSP way of saying the same thing. Nothing else is touched: the
 * page's own policy on its assets is its business.
 */
const STRIPPED: readonly string[] = [
  'content-security-policy',
  'content-security-policy-report-only',
  'x-frame-options',
]

/** The host names that mean this machine. */
const LOOPBACK: ReadonlySet<string> = new Set(['localhost', '127.0.0.1', '[::1]'])

/** One page being served, and the way to stop serving it. */
export interface LiveProxy {
  /** The address the frame is pointed at: the proxy plus the reader's own path. */
  readonly url: string
  /** Close the listener and every socket still open on it. Safe to call twice. */
  close(): void
}

/**
 * Serve one page from this machine.
 * @param url - the address the reader typed, e.g. `http://localhost:5173`.
 * @returns the proxy, already listening.
 * @throws {Error} when the address is not a loopback `http:` page.
 */
export async function openLive(url: URL): Promise<LiveProxy> {
  if (url.protocol !== 'http:') {
    throw new Error(`only a server on this machine can be opened, and ${url.protocol} is not http`)
  }
  if (!LOOPBACK.has(url.hostname)) {
    throw new Error(
      `only a server on this machine can be opened, and ${url.hostname} is not one of its loopback names`,
    )
  }
  // The target is what requests are forwarded to, so it keeps the reader's path:
  // a proxy opened on `http://localhost:5173/docs` serves that page at its root.
  const target = new URL(url.href)
  const sockets = new Set<Socket>()
  let proxyOrigin = ''
  const server = createServer((req, res) => { serve(target, proxyOrigin, req, res) })
  // A dev server's own reload channel is a websocket, and a page whose reload
  // channel is dead is a page that stops noticing the edits it is being annotated
  // against. Upgrades are piped through as raw sockets, which is all a proxy can do
  // with them — the frames are opaque to it either way.
  server.on('upgrade', (req, socket, head) => { upgrade(target, req, socket as Socket, head, sockets) })
  server.on('connection', (socket) => {
    sockets.add(socket)
    socket.on('close', () => { sockets.delete(socket) })
  })
  await listen(server)
  // A server bound to port 0 is listening on an `AddressInfo`; the union in the
  // type is only there because a server can also be bound to a pipe.
  const { port } = server.address() as AddressInfo
  proxyOrigin = `http://127.0.0.1:${port}`
  let closed = false
  return {
    url: `${proxyOrigin}${target.pathname}${target.search}`,
    close(): void {
      if (closed) return
      closed = true
      // Sockets first: a frame that is still loading holds its connection open,
      // and `close()` alone would wait for it to finish before releasing the port.
      for (const socket of sockets) socket.destroy()
      sockets.clear()
      server.close()
    },
  }
}

/**
 * Hand one upgrade request to the target, socket to socket.
 * @param target - the page being served.
 * @param req - the upgrade request from the frame.
 * @param socket - the frame's own socket.
 * @param head - bytes the client already sent past the headers.
 * @param sockets - every socket this proxy holds, so closing it closes these too.
 */
function upgrade(
  target: URL,
  req: IncomingMessage,
  socket: Socket,
  head: Buffer,
  sockets: Set<Socket>,
): void {
  const port = target.port === '' ? 80 : Number(target.port)
  const upstream = netConnect(port, target.hostname, () => {
    // The request line and headers are replayed rather than forwarded as objects:
    // an upgrade is a raw stream from here on, and Node's `httpRequest` would have
    // nothing left to give it.
    const lines = [`${req.method} ${req.url} HTTP/1.1`]
    for (let i = 0; i < req.rawHeaders.length; i += 2) {
      const name = req.rawHeaders[i] as string
      // The host is the target's, not the proxy's, the same as any other request.
      if (name.toLowerCase() === 'host') continue
      lines.push(`${name}: ${req.rawHeaders[i + 1]}`)
    }
    lines.push(`host: ${target.host}`)
    upstream.write(`${lines.join('\r\n')}\r\n\r\n`)
    if (head.length > 0) upstream.write(head)
    upstream.pipe(socket)
    socket.pipe(upstream)
  })
  sockets.add(upstream)
  upstream.on('close', () => { sockets.delete(upstream) })
  upstream.on('error', () => { socket.destroy() })
  socket.on('error', () => { upstream.destroy() })
}

/**
 * Bind a server to a free port on the loopback interface.
 * @param server - the server to bind.
 */
async function listen(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => { resolve() })
  })
}

/**
 * Answer one request on the proxy.
 * @param target - the page being served.
 * @param proxyOrigin - this proxy's own origin, used for same-origin redirects.
 * @param req - the request from the frame.
 * @param res - the answer to it.
 */
function serve(target: URL, proxyOrigin: string, req: IncomingMessage, res: ServerResponse): void {
  if (req.method === 'GET' && req.url === PICKER_PATH) {
    sendPicker(res)
    return
  }
  forward(target, proxyOrigin, req, res)
}

/**
 * Answer the request for the picker itself.
 * @param res - the answer to the frame.
 */
function sendPicker(res: ServerResponse): void {
  res.writeHead(200, {
    'content-type': 'application/javascript; charset=utf-8',
    // The script changes with the plugin, not with the page, and the frame's
    // cache would otherwise outlive an upgrade.
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(PICKER_SCRIPT),
  })
  res.end(PICKER_SCRIPT)
}

/**
 * Ask the target for what the frame asked for, and hand the answer back.
 *
 * A refused connection, a reset and a name that does not resolve all arrive on
 * the request's `error` event, which is the only place they can be turned into
 * an answer: without it, the frame would sit on a connection that never starts.
 * @param target - the page being served.
 * @param proxyOrigin - this proxy's own origin.
 * @param req - the request from the frame.
 * @param res - the answer to it.
 */
function forward(target: URL, proxyOrigin: string, req: IncomingMessage, res: ServerResponse): void {
  const headers: OutgoingHttpHeaders = { ...req.headers }
  // A virtual host is picked by the name the reader typed, not by the port the
  // proxy happened to get.
  headers['host'] = target.host
  // The proxy hands bodies on verbatim, so it cannot forward a coding it does not
  // decode: the frame asked for whatever it can read, and Node asks for nothing
  // it will not undo.
  delete headers['accept-encoding']

  const upstream = httpRequest(target, {
    method: req.method,
    // The frame was opened at the reader's own address, so every path it asks for
    // is already the target's: a page mounted at `/guide/` asks for `/guide/style.css`,
    // and a page at the root asks for `/`. Nothing is rewritten.
    path: req.url,
    headers,
  })
  upstream.on('response', (answer) => { returnAnswer(target, proxyOrigin, res, answer) })
  upstream.on('error', () => { fail(res, DOWN) })
  // A frame that navigates away mid-request takes the request body with it; the
  // upstream request then has nothing to read from, and without this listener the
  // socket's error would be an uncaught exception.
  req.on('error', () => { upstream.destroy() })
  req.pipe(upstream)
}

/**
 * Hand one answer from the target back to the frame.
 * @param target - the page being served.
 * @param proxyOrigin - this proxy's own origin.
 * @param res - the answer to the frame.
 * @param answer - the target's answer.
 */
function returnAnswer(
  target: URL,
  proxyOrigin: string,
  res: ServerResponse,
  answer: IncomingMessage,
): void {
  if (isHtml(answer.headers)) {
    holdHtml(target, proxyOrigin, res, answer)
    return
  }
  res.writeHead(statusOf(answer), withoutStripped(answer.headers, target, proxyOrigin))
  // The target can die in the middle of a body it already started; the frame gets
  // a truncated answer rather than a stale one, which is what a reset means.
  answer.on('error', () => { res.destroy() })
  answer.pipe(res)
}

/**
 * Buffer an HTML page, put the picker tag in it, and send it on.
 * @param target - the page being served.
 * @param proxyOrigin - this proxy's own origin.
 * @param res - the answer to the frame.
 * @param answer - the target's answer.
 */
function holdHtml(
  target: URL,
  proxyOrigin: string,
  res: ServerResponse,
  answer: IncomingMessage,
): void {
  const chunks: Buffer[] = []
  let size = 0

  answer.on('data', (chunk: Buffer) => {
    size += chunk.length
    if (size > MAX_HTML_BYTES) {
      // Stop reading before the cap becomes an allocation, and answer with the
      // reason instead of the page: a frame showing half a page explains nothing.
      answer.destroy()
      fail(res, TOO_BIG)
      return
    }
    chunks.push(chunk)
  })
  answer.on('error', () => { res.destroy() })
  answer.on('end', () => {
    const body = injectPicker(stripCspMeta(Buffer.concat(chunks).toString('utf8')), PICKER_TAG)
    const headers = withoutStripped(answer.headers, target, proxyOrigin)
    // The length and the framing are the proxy's now: the page it holds is not the
    // page the target encoded.
    delete headers['content-length']
    delete headers['transfer-encoding']
    headers['content-length'] = Buffer.byteLength(body)
    res.writeHead(statusOf(answer), headers)
    res.end(body)
  })
}

/**
 * Whether an answer is a page the picker has to be injected into.
 * @param headers - the target's headers.
 * @returns true for an HTML body, whatever else the type says.
 */
function isHtml(headers: IncomingHttpHeaders): boolean {
  const type = headers['content-type']
  return typeof type === 'string' && type.toLowerCase().startsWith('text/html')
}

/**
 * Copy headers, dropping the ones that would keep the frame from loading the page.
 * @param source - the target's headers.
 * @param target - the page being served.
 * @param proxyOrigin - this proxy's own origin.
 * @returns the headers to send to the frame.
 */
function withoutStripped(
  source: IncomingHttpHeaders,
  target: URL,
  proxyOrigin: string,
): OutgoingHttpHeaders {
  const headers: OutgoingHttpHeaders = { ...source }
  for (const name of STRIPPED) delete headers[name]
  const location = source.location
  if (location !== undefined) {
    try {
      const redirect = new URL(location, target)
      if (redirect.origin === target.origin) {
        headers['location'] = `${proxyOrigin}${redirect.pathname}${redirect.search}${redirect.hash}`
      }
    } catch {
      // A malformed Location is still the target's answer; the frame will reject it.
    }
  }
  return headers
}

/**
 * The status code of an answer.
 *
 * The `response` event only fires once a status line has been parsed, so the code
 * is always there; the type is optional because a message can be built by hand.
 * @param answer - the target's answer.
 * @returns its status code.
 */
function statusOf(answer: IncomingMessage): number {
  return (answer as IncomingMessage & { readonly statusCode: number }).statusCode
}

/**
 * Answer the frame with a sentence instead of a page.
 * @param res - the answer to the frame.
 * @param message - the sentence to show.
 */
function fail(res: ServerResponse, message: string): void {
  /* v8 ignore next 8 -- both callers answer before they have written a status line;
     the branch stays because a truncated answer is the only honest thing to send if
     that ever stops being true. */
  if (res.headersSent) {
    // The body already started, so there is no status line left to correct; a
    // truncated answer is the only honest thing left to send.
    res.destroy()
    return
  }
  res.writeHead(502, {
    'content-type': 'text/plain; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(message),
  })
  res.end(message)
}
