/** Opening a live page from the panel: the typed address, the ask, and the anchor. */
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  anchorOfPick, closeLivePage, liveAddressOf, openLivePage, pickName, shownAddress, type LivePage,
} from '../src/client/live-page'
import { AnnotatorHostError } from '../src/client/host-api'
import { GUARD_HEADER } from '../src/shared/http'
import { LIVE_MESSAGE, type LivePick } from '../src/shared/live'

/** A pick as the page reports one. */
const PICKED: LivePick = {
  kind: 'pick',
  tag: 'DIV',
  id: 'hero',
  class: '  relative   flex ',
  text: 'Hello',
  selector: 'body > div:nth-of-type(1)',
  bbox: [10, 20, 300, 40],
  scroll: [0, 120],
}

/** What one stubbed call was handed. */
interface Call {
  readonly url: string
  readonly init: RequestInit | undefined
}

/** Replace `fetch` with one answer, and report the calls it took. */
function stubFetch(answer: { status?: number; body: unknown }): Call[] {
  const calls: Call[] = []
  vi.stubGlobal('fetch', async (url: string, init: RequestInit | undefined) => {
    calls.push({ url, init })
    return {
      status: answer.status ?? 200,
      json: async () => await Promise.resolve(answer.body),
    }
  })
  return calls
}

/** The guard header one stubbed call carried, when it carried one at all. */
function guardOf(call: Call | undefined): unknown {
  const headers = call === undefined ? undefined : call.init?.headers
  return headers === undefined ? undefined : (headers as Record<string, string>)[GUARD_HEADER]
}

afterEach(() => { vi.unstubAllGlobals() })

describe('the address a reader types', () => {
  it('adds the scheme a bare host is missing', () => {
    expect(liveAddressOf('localhost:5173')).toBe('http://localhost:5173/')
    expect(liveAddressOf('127.0.0.1:8000/docs?a=1')).toBe('http://127.0.0.1:8000/docs?a=1')
  })

  it('leaves a scheme the reader did type alone', () => {
    expect(liveAddressOf('https://localhost:5173/')).toBe('https://localhost:5173/')
    // Not a scheme the proxy can open, but the refusal is the Host's to word, not
    // this function's to pre-empt.
    expect(liveAddressOf('ftp://localhost')).toBe('ftp://localhost/')
  })

  it('trims what the reader typed', () => {
    expect(liveAddressOf('  localhost:5173  ')).toBe('http://localhost:5173/')
  })

  it('answers nothing for text that is no address at all', () => {
    expect(liveAddressOf('')).toBeUndefined()
    expect(liveAddressOf('    ')).toBeUndefined()
    expect(liveAddressOf('http://')).toBeUndefined()
    expect(liveAddressOf('http://[::1')).toBeUndefined()
  })
})

describe('opening a page', () => {
  it('asks the Host, and frames the address it answers with', async () => {
    const calls = stubFetch({ body: { ok: true, url: 'http://127.0.0.1:9000/docs' } })
    const page = await openLivePage('http://localhost:5173/docs')
    expect(page).toEqual({ address: 'http://localhost:5173/docs', url: 'http://127.0.0.1:9000/docs' })
    const call = calls[0]
    expect(call?.url).toContain('/live')
    expect(call?.init?.method).toBe('POST')
    expect(guardOf(call)).toBe('1')
    expect(call?.init?.body).toBe(JSON.stringify({ url: 'http://localhost:5173/docs' }))
  })

  it("carries the Host's own words when it refuses", async () => {
    stubFetch({ status: 400, body: { error: 'only a server on this machine can be opened' } })
    await expect(openLivePage('http://example.com')).rejects.toThrow('only a server on this machine can be opened')
  })

  it('refuses an answer that says ok without an address', async () => {
    stubFetch({ status: 502, body: { ok: true } })
    await expect(openLivePage('http://localhost:5173')).rejects.toThrow('live page failed with status 502')
  })

  it('refuses a body that is not the shape it asks for', async () => {
    stubFetch({ status: 200, body: { ok: false, error: 'nope' } })
    await expect(openLivePage('http://localhost:5173')).rejects.toBeInstanceOf(AnnotatorHostError)
  })
})

describe('closing a page', () => {
  it('tells the Host to stop serving it', async () => {
    const calls = stubFetch({ body: { ok: true } })
    await closeLivePage()
    expect(calls[0]?.init?.method).toBe('DELETE')
    expect(guardOf(calls[0])).toBe('1')
  })

  it("refuses in the Host's words when the close did not happen", async () => {
    stubFetch({ status: 405, body: { error: 'method DELETE is not allowed' } })
    await expect(closeLivePage()).rejects.toThrow('method DELETE is not allowed')
  })

  it('names the status when the Host said nothing', async () => {
    stubFetch({ status: 500, body: {} })
    await expect(closeLivePage()).rejects.toThrow('live close failed with status 500')
  })
})

describe('turning a pick into mark material', () => {
  it('keeps what a locator needs and drops what a restyle renames', () => {
    expect(anchorOfPick(PICKED)).toEqual({
      tag: 'DIV',
      id: 'hero',
      text: 'Hello',
      selector: 'body > div:nth-of-type(1)',
      bbox: [10, 20, 300, 40],
    })
  })

  it('leaves out an id and a text the element does not have', () => {
    const bare = anchorOfPick({ ...PICKED, id: undefined, text: undefined })
    expect(bare).not.toHaveProperty('id')
    expect(bare).not.toHaveProperty('text')
  })

  it('names an element the way the reader would write it', () => {
    expect(pickName(PICKED)).toBe('div#hero')
    expect(pickName({ ...PICKED, id: undefined })).toBe('div.relative')
    expect(pickName({ ...PICKED, id: undefined, class: undefined })).toBe('div')
    expect(pickName({ ...PICKED, id: '', class: '   ' })).toBe('div')
  })

  it('lowercases the tag, which is the name a mark stores', () => {
    expect(pickName({ ...PICKED, id: undefined, class: undefined, tag: 'SECTION' })).toBe('section')
  })
})

describe('what the address field shows', () => {
  const page: LivePage = { address: 'http://localhost:5173/', url: 'http://127.0.0.1:9000/' }

  it('shows what the reader is typing, above everything else', () => {
    expect(shownAddress('localh', page, '/w/index.html')).toBe('localh')
    expect(shownAddress('', page, '/w/index.html')).toBe('')
  })

  it('shows the page being framed, not the proxy it is framed from', () => {
    expect(shownAddress(null, page, '/w/index.html')).toBe('http://localhost:5173/')
  })

  it("shows the file's own name when the figure is a file", () => {
    expect(shownAddress(null, null, '/w/deck/index.html')).toBe('index.html')
    expect(shownAddress(null, null, '/w/deck/')).toBe('deck')
    expect(shownAddress(null, null, '')).toBe('')
  })
})

describe('the shared vocabulary', () => {
  it('is the marker the picker posts with', () => {
    expect(LIVE_MESSAGE).toBe('dsh-figmark:live')
  })
})
