/** The Host routes: guard, address resolution, sidecar write, and refusal paths. */
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { GUARD_HEADER, createHandlers } from '../src/host/routes'
import { MAX_REVIEW_BYTES } from '../src/host/store'
import { ANNOTATION_VERSION, ANNOTATION_VERSION_V2 } from '../src/shared/annotation'
import type { AnnotationDocument } from '../src/shared/annotation'

const FIGURE = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>'
const CWD = '/virtual/workspace'

const document_: AnnotationDocument = {
  version: ANNOTATION_VERSION,
  figure: {
    address: `dsh-resource://file/session/s1/fig1.svg`,
    path: join(process.env['ANNOTATOR_TMP'] ?? '', 'fig1.svg'),
    mediaType: 'image/svg+xml',
    width: 10,
    height: 10,
    sha256: 'b'.repeat(64),
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  marks: [{ id: 'm1', kind: 'arrow', color: '#e03131', points: [[1, 1], [2, 2]], detail: '箭头' }],
}

let server: Server
let origin: string
let directory: string

beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), 'dsh-figmark-routes-'))
  process.env['ANNOTATOR_TMP'] = directory
  const handlers = createHandlers({ sessionCwd: async () => CWD })
  server = createServer((req, res) => { void handlers.annotation(req, res) })
  await new Promise<void>(resolve => { server.listen(0, '127.0.0.1', resolve) })
  const address = server.address()
  origin = typeof address === 'object' && address !== null ? `http://127.0.0.1:${address.port}` : ''
})

afterAll(async () => {
  await new Promise<void>(resolve => { server.close(() => { resolve() }) })
  await rm(directory, { recursive: true, force: true })
})

beforeEach(async () => {
  await writeFile(join(directory, 'fig1.svg'), FIGURE)
})

describe('annotation route', () => {
  const guard = { [GUARD_HEADER]: '1' }

  it('refuses a request without the guard header', async () => {
    const response = await fetch(`${origin}/dsh-figmark/annotation?address=x`)
    expect(response.status).toBe(403)
    expect(await response.json()).toMatchObject({ error: expect.stringContaining('guard') as unknown as string })
  })

  it('refuses a malformed address and a non-figure target', async () => {
    const bad = await fetch(`${origin}/dsh-figmark/annotation?address=nope`, { headers: guard })
    expect(bad.status).toBe(404)
    await writeFile(join(directory, 'notes.md'), 'x')
    const md = await fetch(`${origin}/dsh-figmark/annotation?address=${encodeURIComponent('dsh-resource://file/session/s1/notes.md')}`, { headers: guard })
    expect(md.status).toBe(404)
    expect(await md.json()).toMatchObject({ error: expect.stringContaining('annotatable') as unknown as string })
  })

  it('answers a missing figure with its absolute path', async () => {
    const response = await fetch(`${origin}/dsh-figmark/annotation?address=${encodeURIComponent('dsh-resource://file/session/s1/gone.svg')}`, { headers: guard })
    expect(response.status).toBe(404)
    expect(await response.json()).toMatchObject({ error: expect.stringContaining('no such figure') as unknown as string })
  })

  it('reads a figure for a relative address resolved through the session directory', async () => {
    const response = await fetch(`${origin}/dsh-figmark/annotation?address=${encodeURIComponent('dsh-resource://file/session/s1/../fig1.svg')}`, { headers: guard })
    const body = await response.json() as { ok: boolean; figure: { mediaType: string; sha256: string }; annotation: unknown }
    // `../fig1.svg` under /virtual/workspace resolves outside the fixture; the route reports it rather than guessing.
    expect(response.status).toBe(404)
    expect(body).toMatchObject({ ok: false })
  })

  it('names a sidecar it will not read instead of saying there is none', async () => {
    // The panel cannot tell "the file is too large to be ours" from "never annotated"
    // unless the route says which: both arrive as `annotation: null`, and only one of
    // them is about marks the reader actually has.
    // Its own figure, so the oversized file does not outlive this test and change the
    // answer the next one gets — the directory is shared by the whole file.
    const figure = join(directory, 'oversized.svg')
    await writeFile(figure, FIGURE)
    const address = `dsh-resource://file/session/s1//${figure}`
    await writeFile(join(directory, 'oversized.svg.annot.json'), `{"pad":"${'x'.repeat(5 * 1024 * 1024)}"}`)
    const response = await fetch(`${origin}/dsh-figmark/annotation?address=${encodeURIComponent(address)}`, { headers: guard })
    const body = await response.json() as { annotation: unknown; unreadable?: readonly string[] }
    expect(response.status).toBe(200)
    expect(body.annotation).toBeNull()
    expect(body.unreadable).toEqual([join(directory, 'oversized.svg.annot.json')])
  })

  it('leaves the field out of an ordinary answer, so nothing reading it can change', async () => {
    const address = `dsh-resource://file/session/s1//${directory}/fig1.svg`
    const response = await fetch(`${origin}/dsh-figmark/annotation?address=${encodeURIComponent(address)}`, { headers: guard })
    const body = await response.json() as Record<string, unknown>
    expect(body['annotation']).toBeNull()
    expect('unreadable' in body).toBe(false)
  })

  it('saves and reads back marks with their review image', async () => {
    const address = `dsh-resource://file/session/s1//${directory}/fig1.svg`
    const save = await fetch(`${origin}/dsh-figmark/annotation`, {
      method: 'POST',
      headers: { ...guard, 'content-type': 'application/json' },
      body: JSON.stringify({ address, annotation: document_, reviewImage: Buffer.from([9, 9]).toString('base64') }),
    })
    expect(save.status).toBe(200)
    const saved = await save.json() as { annotationPath: string; reviewPath: string }
    expect(saved.annotationPath).toBe(join(directory, 'fig1.svg.annot.json'))
    expect(saved.reviewPath).toBe(join(directory, 'fig1.svg.annotated.png'))

    const read = await fetch(`${origin}/dsh-figmark/annotation?address=${encodeURIComponent(address)}`, { headers: guard })
    const loaded = await read.json() as { figure: { sha256: string }; annotation: AnnotationDocument }
    expect(loaded.annotation.marks).toHaveLength(1)
    expect(loaded.figure.sha256).toMatch(/^[0-9a-f]{64}$/)
  })

  it('serves a v2 document the sibling annotator left beside the figure', async () => {
    const figure = join(directory, 'fig-shared.svg')
    await writeFile(figure, FIGURE)
    await writeFile(join(directory, 'fig-shared.svg.annot.json'), JSON.stringify({
      version: ANNOTATION_VERSION_V2,
      target: {
        kind: 'figure-svg',
        path: figure,
        relativePath: 'fig-shared.svg',
        mediaType: 'image/svg+xml',
        width: 10,
        height: 10,
        sha256: 'e'.repeat(64),
      },
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
      marks: [{ id: 's1', kind: 'rect', color: '#1971c2', points: [[1, 2], [3, 4]], detail: '来自另一侧的标注' }],
    }))
    const address = `dsh-resource://file/session/s1//${figure}`
    const read = await fetch(`${origin}/dsh-figmark/annotation?address=${encodeURIComponent(address)}`, { headers: guard })
    const loaded = await read.json() as { annotation: AnnotationDocument | null }
    expect(loaded.annotation?.marks[0]?.detail).toBe('来自另一侧的标注')
  })

  it('rejects an invalid document body with a message, not a crash', async () => {
    const address = `dsh-resource://file/session/s1//${directory}/fig1.svg`
    const response = await fetch(`${origin}/dsh-figmark/annotation`, {
      method: 'POST',
      headers: { ...guard, 'content-type': 'application/json' },
      body: JSON.stringify({ address, annotation: { version: 9 } }),
    })
    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ error: expect.stringContaining('version') as unknown as string })
  })

  it('refuses an oversized review image', async () => {
    const address = `dsh-resource://file/session/s1//${directory}/fig1.svg`
    const response = await fetch(`${origin}/dsh-figmark/annotation`, {
      method: 'POST',
      headers: { ...guard, 'content-type': 'application/json' },
      body: JSON.stringify({ address, annotation: document_, reviewImage: 'A'.repeat(24 * 1024 * 1024 * 2) }),
    })
    expect(response.status).toBe(400)
  })

  it('answers a method it does not serve with 405', async () => {
    const response = await fetch(`${origin}/dsh-figmark/annotation`, { method: 'PUT', headers: guard })
    expect(response.status).toBe(405)
  })

  it('deletes both sidecars on request, and leaves the figure alone', async () => {
    const address = `dsh-resource://file/session/s1//${directory}/fig1.svg`
    const before = await fetch(`${origin}/dsh-figmark/annotation`, {
      method: 'POST',
      headers: { ...guard, 'content-type': 'application/json' },
      body: JSON.stringify({ address, annotation: document_, reviewImage: 'AQID' }),
    })
    expect(before.status).toBe(200)
    const removal = await fetch(
      `${origin}/dsh-figmark/annotation?address=${encodeURIComponent(address)}`,
      { method: 'DELETE', headers: guard },
    )
    expect(removal.status).toBe(200)
    const body = await removal.json() as { ok: boolean; removed: boolean }
    expect(body.ok).toBe(true)
    expect(body.removed).toBe(true)
    // The figure is still there; only the files derived from it went.
    const after = await fetch(
      `${origin}/dsh-figmark/annotation?address=${encodeURIComponent(address)}`,
      { headers: guard },
    )
    expect((await after.json() as { annotation: unknown }).annotation).toBeNull()
    expect(existsSync(join(directory, 'fig1.svg'))).toBe(true)
    expect(existsSync(join(directory, 'fig1.svg.annot.json'))).toBe(false)
    expect(existsSync(join(directory, 'fig1.svg.annotated.png'))).toBe(false)
  })

  it('refuses to delete for an address it cannot resolve', async () => {
    const response = await fetch(`${origin}/dsh-figmark/annotation?address=not-an-address`, {
      method: 'DELETE',
      headers: guard,
    })
    expect(response.status).toBe(404)
    expect((await response.json() as { error: string }).error).toContain('not a file address')
  })

  it('reports nothing removed when there was no annotation to delete', async () => {
    const address = `dsh-resource://file/session/s1//${directory}/fig1.svg`
    const response = await fetch(
      `${origin}/dsh-figmark/annotation?address=${encodeURIComponent(address)}`,
      { method: 'DELETE', headers: guard },
    )
    expect(response.status).toBe(200)
    expect((await response.json() as { removed: boolean }).removed).toBe(false)
  })
})

describe('a document that has pages', () => {
  const guard = { [GUARD_HEADER]: '1' }
  const reportBytes = '%PDF-1.7\n'
  // The fixture directory only exists once `beforeAll` has run, so these are
  // built per test rather than at collection time.
  let address = ''
  let pageDocument: AnnotationDocument = document_

  beforeEach(async () => {
    await writeFile(join(directory, 'report.pdf'), reportBytes)
    address = `dsh-resource://file/session/s1//${directory}/report.pdf`
    pageDocument = {
      ...document_,
      figure: {
        address,
        path: join(directory, 'report.pdf'),
        mediaType: 'application/pdf',
        sha256: 'c'.repeat(64),
        pageCount: 5,
      },
      marks: [{ id: 'p2', kind: 'rect', color: '#1971c2', points: [[1, 2], [3, 4]], page: 2 }],
    }
  })

  it('writes the whole document into one sidecar, and its annotated copy beside it', async () => {
    const save = await fetch(`${origin}/dsh-figmark/annotation`, {
      method: 'POST',
      headers: { ...guard, 'content-type': 'application/json' },
      body: JSON.stringify({ address, annotation: pageDocument, annotatedPdf: Buffer.from('%PDF-1.7 annotated').toString('base64') }),
    })
    expect(save.status).toBe(200)
    expect(await save.json()).toMatchObject({
      annotationPath: join(directory, 'report.pdf.annot.json'),
      reviewPath: join(directory, 'report.pdf.annotated.pdf'),
    })
    const read = await fetch(`${origin}/dsh-figmark/annotation?address=${encodeURIComponent(address)}`, { headers: guard })
    const loaded = await read.json() as { annotation: AnnotationDocument | null }
    expect(loaded.annotation?.marks).toEqual([{ id: 'p2', kind: 'rect', color: '#1971c2', points: [[1, 2], [3, 4]], page: 2 }])
  })

  it('refuses a mark on a page the document does not have', async () => {
    const beyond = await fetch(`${origin}/dsh-figmark/annotation`, {
      method: 'POST',
      headers: { ...guard, 'content-type': 'application/json' },
      body: JSON.stringify({ address, annotation: { ...pageDocument, marks: [{ ...pageDocument.marks[0], page: 9 }] } }),
    })
    expect(beyond.status).toBe(400)
    expect(await beyond.json()).toMatchObject({ error: expect.stringContaining('is on page 9 of a 5-page document') as unknown as string })
  })

  it('refuses a payload that is not a PDF, and a save that carries both artifacts', async () => {
    const notPdf = await fetch(`${origin}/dsh-figmark/annotation`, {
      method: 'POST',
      headers: { ...guard, 'content-type': 'application/json' },
      body: JSON.stringify({ address, annotation: pageDocument, annotatedPdf: Buffer.from('<html/>').toString('base64') }),
    })
    expect(notPdf.status).toBe(400)
    expect(await notPdf.json()).toMatchObject({ error: 'the annotated document is not a PDF' })
    const both = await fetch(`${origin}/dsh-figmark/annotation`, {
      method: 'POST',
      headers: { ...guard, 'content-type': 'application/json' },
      body: JSON.stringify({
        address,
        annotation: pageDocument,
        annotatedPdf: Buffer.from('%PDF-1.7').toString('base64'),
        reviewImage: Buffer.from([1]).toString('base64'),
      }),
    })
    expect(both.status).toBe(400)
    expect(await both.json()).toMatchObject({ error: 'a save carries one review artifact, not both' })
  })

  it('reads the per-page sidecars an earlier version wrote as one document', async () => {
    // An earlier test may have written this document's own sidecar; the per-page
    // files are what this one is about.
    await rm(join(directory, 'report.pdf.annot.json'), { force: true })
    const legacy = (page: number): string => join(directory, `report.pdf.p${page}.annot.json`)
    await writeFile(legacy(1), JSON.stringify({
      ...document_,
      figure: { address, path: join(directory, 'report.pdf'), mediaType: 'application/pdf', width: 595, height: 842, sha256: 'c'.repeat(64) },
      marks: [{ id: 'old1', kind: 'pen', color: '#2f9e44', points: [[1, 1], [2, 2]] }],
    }))
    await writeFile(legacy(3), JSON.stringify({
      ...document_,
      figure: { address, path: join(directory, 'report.pdf'), mediaType: 'application/pdf', width: 595, height: 842, sha256: 'c'.repeat(64) },
      marks: [{ id: 'old3', kind: 'arrow', color: '#e03131', points: [[3, 3], [4, 4]] }],
    }))
    const read = await fetch(`${origin}/dsh-figmark/annotation?address=${encodeURIComponent(address)}`, { headers: guard })
    const loaded = await read.json() as { annotation: AnnotationDocument | null }
    expect(loaded.annotation?.figure.pageCount).toBe(3)
    expect(loaded.annotation?.marks.map(mark => [mark.page, mark.id])).toEqual([[1, 'old1'], [3, 'old3']])
  })
})

/** One request the handler sees, built without a socket. */
interface StubRequest {
  /** HTTP method; leave unset, or set it to undefined, for a request that names none. */
  readonly method?: string | undefined
  /** Request URL including the query; leave unset, or set it to undefined, for a fallback. */
  readonly url?: string | undefined
  /** Extra headers, merged over the guard header. */
  readonly headers?: Record<string, string>
  /** Body text to stream, when the request carries one. */
  readonly body?: string
}

/**
 * Call the route handler over a stubbed request.
 * @param deps - the session lookup the handler resolves addresses through.
 * @param request - the request to hand it.
 * @returns the status and parsed body it answered with.
 */
async function callRoute(
  deps: { readonly sessionCwd: (id: string) => Promise<string | undefined> },
  request: StubRequest = {},
): Promise<{ readonly status: number; readonly body: Record<string, unknown> }> {
  const handlers = createHandlers(deps)
  const body = request.body
  const req = {
    method: 'method' in request ? request.method : 'GET',
    url: 'url' in request ? request.url : '/dsh-figmark/annotation',
    headers: { [GUARD_HEADER]: '1', ...request.headers },
    async *[Symbol.asyncIterator](): AsyncGenerator<Buffer> {
      if (body !== undefined) yield Buffer.from(body)
    },
  } as unknown as IncomingMessage
  let status = 200
  let text = ''
  const res = {
    writeHead: (code: number) => { status = code; return res },
    end: (payload?: string) => { text = payload ?? ''; return res },
  } as unknown as ServerResponse
  await handlers.annotation(req, res)
  return { status, body: text === '' ? {} : JSON.parse(text) as Record<string, unknown> }
}

describe('annotation route edge cases', () => {
  // An `absolute`-scope address carries the path verbatim, so an absolute path
  // shows up as a doubled slash after the scope.
  const absoluteAddress = (): string => `dsh-resource://file/absolute/${directory}/fig1.svg`

  it('resolves an absolute address without consulting any Session', async () => {
    const answer = await callRoute({ sessionCwd: async () => undefined }, {
      url: `/dsh-figmark/annotation?address=${encodeURIComponent(absoluteAddress())}`,
    })
    expect(answer.status).toBe(200)
    expect(answer.body['figure']).toMatchObject({ path: join(directory, 'fig1.svg') })
  })

  it('refuses a relative address when no Session directory can be resolved', async () => {
    const answer = await callRoute({ sessionCwd: async () => undefined }, {
      url: `/dsh-figmark/annotation?address=${encodeURIComponent('dsh-resource://file/session/s1/fig1.svg')}`,
    })
    expect(answer.status).toBe(404)
    expect(answer.body['error']).toContain('cannot resolve')
  })

  it('refuses a read with no address at all', async () => {
    const answer = await callRoute({ sessionCwd: async () => CWD })
    expect(answer.status).toBe(404)
    expect(answer.body['error']).toContain('not a file address')
  })

  it('refuses a delete with no address at all', async () => {
    const answer = await callRoute({ sessionCwd: async () => CWD }, { method: 'DELETE' })
    expect(answer.status).toBe(404)
    expect(answer.body['error']).toContain('not a file address')
  })

  it('refuses a target that is a directory rather than a file', async () => {
    // The suffix check runs first, so the directory has to look like a figure.
    await mkdir(join(directory, 'not-a-file.png'))
    const answer = await callRoute({ sessionCwd: async () => CWD }, {
      url: `/dsh-figmark/annotation?address=${encodeURIComponent(`dsh-resource://file/absolute/${directory}/not-a-file.png`)}`,
    })
    expect(answer.status).toBe(404)
    // The same answer as a path that is not there: telling the two apart is an
    // existence oracle for every same-origin page in the app.
    expect(answer.body['error']).toContain('no such figure')
  })

  it('refuses a cross-site request and admits a same-origin one', async () => {
    const crossSite = await callRoute({ sessionCwd: async () => CWD }, { headers: { 'sec-fetch-site': 'cross-site' } })
    expect(crossSite.status).toBe(403)
    const sameOrigin = await callRoute({ sessionCwd: async () => CWD }, { headers: { 'sec-fetch-site': 'same-origin' } })
    expect(sameOrigin.status).toBe(404)
  })

  it('refuses a write whose address is not a string', async () => {
    const answer = await callRoute({ sessionCwd: async () => CWD }, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ address: 42, annotation: document_ }),
    })
    expect(answer.status).toBe(404)
    expect(answer.body['error']).toContain('not a file address')
  })

  it('refuses a write to a figure that is not there', async () => {
    const answer = await callRoute({ sessionCwd: async () => CWD }, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ address: 'dsh-resource://file/absolute//tmp/gone.svg', annotation: document_ }),
    })
    expect(answer.status).toBe(404)
    expect(answer.body['error']).toContain('no such figure')
  })

  it('treats an empty review image as none at all', async () => {
    const answer = await callRoute({ sessionCwd: async () => CWD }, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ address: absoluteAddress(), annotation: document_, reviewImage: '' }),
    })
    expect(answer.status).toBe(200)
    expect(answer.body['reviewPath']).toBeNull()
  })

  it('refuses a review image past the size cap, before the body cap catches it', async () => {
    // Base64 of one byte over the cap stays under the request-body cap, so this
    // exercises the image check rather than the generic body guard.
    const encoded = 'A'.repeat((Math.floor(MAX_REVIEW_BYTES / 3) + 1) * 4)
    const answer = await callRoute({ sessionCwd: async () => CWD }, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ address: absoluteAddress(), annotation: document_, reviewImage: encoded }),
    })
    expect(answer.status).toBe(413)
    expect(answer.body['error']).toContain('too large')
  })

  it('answers a request target that is not a URL at all', async () => {
    // `//[` is neither a path nor an origin, and `new URL` throws on it. That throw
    // used to happen before the try, so the handler's promise rejected instead of
    // answering — a break of the plugin's own contract, even though the shell's
    // wrapper turned the rejection into a 400 for a live request.
    const answer = await callRoute({ sessionCwd: async () => CWD }, { url: '//[' })
    expect(answer.status).toBe(400)
    expect(answer.body['error']).toContain('Invalid URL')
  })

  it('reports a non-Error failure as its own text', async () => {
    const answer = await callRoute({
      sessionCwd: async () => { throw 'backend exploded' },
    }, {
      url: `/dsh-figmark/annotation?address=${encodeURIComponent('dsh-resource://file/session/s1/fig1.svg')}`,
    })
    expect(answer.status).toBe(400)
    expect(answer.body['error']).toBe('backend exploded')
  })

  it('refuses a relative path that no Session is named for at all', async () => {
    const answer = await callRoute({ sessionCwd: async () => CWD }, {
      url: `/dsh-figmark/annotation?address=${encodeURIComponent('dsh-resource://file/absolute/fig1.svg')}`,
    })
    expect(answer.status).toBe(404)
    expect(answer.body['error']).toContain('cannot resolve')
  })

  it('answers a request that names neither method nor URL', async () => {
    const answer = await callRoute({ sessionCwd: async () => CWD }, { method: undefined, url: undefined })
    expect(answer.status).toBe(405)
    expect(answer.body['error']).toBe('method  is not allowed')
  })
})

describe('naming the workspace a figure lives in', () => {
  it('reports the Session directory, so the browser can offer a relative path', async () => {
    await writeFile(join(directory, 'fig1.svg'), FIGURE)
    const address = `dsh-resource://file/session/s1//${directory}/fig1.svg`
    const response = await callRoute({ sessionCwd: async () => directory }, { url: `/dsh-figmark/annotation?address=${encodeURIComponent(address)}` })
    expect((response.body as { figure: { workspace: string } }).figure.workspace).toBe(directory)
  })

  it('reports no workspace for an absolute address, which names no Session', async () => {
    await writeFile(join(directory, 'fig2.svg'), FIGURE)
    const address = `dsh-resource://file/absolute//${directory}/fig2.svg`
    const response = await callRoute({ sessionCwd: async () => directory }, { url: `/dsh-figmark/annotation?address=${encodeURIComponent(address)}` })
    expect((response.body as { figure: { workspace: string | null } }).figure.workspace).toBeNull()
  })
})

describe('the order a read takes', () => {
  const guard = { [GUARD_HEADER]: '1' }

  it('digests the figure after reading its marks, not beside it', async () => {
    // The two used to race through `Promise.all`: the digest could describe a figure
    // written *after* the marks were read, and the panel then compared a fingerprint
    // of the new picture against marks drawn on the old one and called the annotation
    // current. Reading the marks first is the only arrangement in which the digest is
    // never the older of the two, which is what makes the comparison mean anything.
    // A rewrite between the two reads makes the difference visible: with one order the
    // answer carries the newest fingerprint, with the race it can carry the old one.
    const address = `dsh-resource://file/session/s1//${directory}/fig1.svg`
    const response = await fetch(`${origin}/dsh-figmark/annotation?address=${encodeURIComponent(address)}`, { headers: guard })
    const body = await response.json() as { ok: boolean; figure: { sha256: string } }
    expect(body.ok).toBe(true)
    // The digest is of what is on disk now, computed after the sidecar read rather
    // than in parallel with it.
    const { createHash } = await import('node:crypto')
    const { readFile } = await import('node:fs/promises')
    const latest = createHash('sha256').update(await readFile(join(directory, 'fig1.svg'))).digest('hex')
    expect(body.figure.sha256).toBe(latest)
  })
})
