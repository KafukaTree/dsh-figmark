/** Opening a live page from the panel: the typed address, the ask, and the anchor. */
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  anchorOfPick, closeLivePage, discoverLiveServices, liveAddressOf, loopbackAddressOf,
  liveScreenshotMarks, openLivePage, pickName,
  shownAddress, type LivePage,
} from '../src/client/live-page'
import { AnnotatorHostError } from '../src/client/host-api'
import { GUARD_HEADER } from '../src/shared/http'
import { LIVE_MESSAGE, type LivePick } from '../src/shared/live'
import type { AnnotationMark } from '../src/shared/annotation'

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

  it('recognizes loopback HTTP input as an explicit page, not a title query', () => {
    expect(loopbackAddressOf('localhost:5173')).toBe('http://localhost:5173/')
    expect(loopbackAddressOf('127.0.0.1:8000/docs?a=1')).toBe('http://127.0.0.1:8000/docs?a=1')
    expect(loopbackAddressOf('[::1]:4173')).toBe('http://[::1]:4173/')
    expect(loopbackAddressOf('deck')).toBeUndefined()
    expect(loopbackAddressOf('https://localhost:5173/')).toBeUndefined()
    expect(loopbackAddressOf('http://example.com/')).toBeUndefined()
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

describe('finding local pages', () => {
  it('posts the session and remembered addresses, then returns the bounded answer', async () => {
    const calls = stubFetch({
      body: {
        ok: true,
        services: [{ url: 'http://127.0.0.1:5173/', title: 'Deck', source: 'recent' }],
      },
    })
    const services = await discoverLiveServices('s1', ['http://127.0.0.1:5173/'])
    expect(services).toEqual([
      { url: 'http://127.0.0.1:5173/', title: 'Deck', source: 'recent' },
    ])
    const call = calls[0]
    expect(call?.url).toContain('/services')
    expect(call?.init?.method).toBe('POST')
    expect(guardOf(call)).toBe('1')
    expect(call?.init?.body).toBe(JSON.stringify({
      sessionId: 's1',
      recent: ['http://127.0.0.1:5173/'],
    }))
  })

  it("carries the Host's refusal or names the failed status", async () => {
    stubFetch({ status: 403, body: { error: 'scan refused' } })
    await expect(discoverLiveServices('s1', [])).rejects.toThrow('scan refused')
    stubFetch({ status: 502, body: {} })
    await expect(discoverLiveServices('s1', [])).rejects.toThrow('service discovery failed with status 502')
    stubFetch({ status: 409, body: { ok: false, error: 7 } })
    await expect(discoverLiveServices('s1', [])).rejects.toThrow('service discovery failed with status 409')
  })

  it('refuses a service list with any entry it cannot render', async () => {
    for (const services of [
      [null],
      [{ url: '', source: 'common' }],
      [{ url: 'http://127.0.0.1:5173/', source: 'elsewhere' }],
      [{ url: 'http://127.0.0.1:5173/', source: 'common', title: 7 }],
      Array.from({ length: 65 }, () => ({ url: 'http://127.0.0.1:5173/', source: 'common' })),
    ]) {
      stubFetch({ body: { ok: true, services } })
      await expect(discoverLiveServices('s1', [])).rejects.toThrow('service discovery failed with status 200')
    }
  })
})

describe('closing a page', () => {
  it('tells the Host to stop serving it', async () => {
    const calls = stubFetch({ body: { ok: true } })
    await closeLivePage('http://127.0.0.1:9444/__dsh_figmark_live/proxy/docs')
    expect(calls[0]?.init?.method).toBe('DELETE')
    expect(guardOf(calls[0])).toBe('1')
    expect(calls[0]?.url).toContain('/live?url=http%3A%2F%2F127.0.0.1%3A9444%2F__dsh_figmark_live%2Fproxy%2Fdocs')
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
  it('keeps the locator and a capped human class signature', () => {
    expect(anchorOfPick(PICKED)).toEqual({
      tag: 'DIV',
      id: 'hero',
      class: 'relative flex',
      text: 'Hello',
      selector: 'body > div:nth-of-type(1)',
      bbox: [10, 20, 300, 40],
    })
  })

  it('keeps at most three classes and leaves an empty class list out', () => {
    expect(anchorOfPick({ ...PICKED, id: undefined, class: 'one two three four five' }))
      .toMatchObject({ class: 'one two three' })
    expect(anchorOfPick({ ...PICKED, id: undefined, class: '   ' })).not.toHaveProperty('class')
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

describe('choosing the marks in one live screenshot', () => {
  const element = (
    id: string,
    selector: string,
    bbox: readonly [number, number, number, number],
    surface?: string,
  ): AnnotationMark => ({
    id,
    kind: 'element',
    color: '#1971c2',
    points: [[bbox[0], bbox[1]], [bbox[0] + bbox[2], bbox[1] + bbox[3]]],
    ...(surface === undefined ? {} : { surface }),
    anchor: { tag: 'p', selector, bbox },
  })

  it('keeps the current surface, uses live element boxes, and drops hidden marks', () => {
    const marks = [
      element('live', '#live', [0, 0, 10, 10], '#slide-2'),
      element('hidden', '#hidden', [20, 20, 10, 10], '#slide-2'),
      element('other', '#other', [30, 30, 10, 10], '#slide-1'),
    ]
    const found = liveScreenshotMarks(
      marks,
      '#slide-2',
      [
        { selector: '#live', bbox: [40, 50, 200, 80], visible: true },
        { selector: '#hidden', bbox: [0, 0, 10, 10], visible: false },
      ],
      [20, 30],
      [800, 600],
    )
    expect(found.map(mark => mark.id)).toEqual(['live'])
    expect(found[0]?.points).toEqual([[40, 50], [240, 130]])
  })

  it('keeps unscoped marks that touch the window and drops those beyond it', () => {
    const marks: AnnotationMark[] = [
      {
        id: 'near',
        kind: 'rect',
        color: '#e03131',
        points: [[790, 610], [820, 640]],
      },
      {
        id: 'far',
        kind: 'rect',
        color: '#e03131',
        points: [[900, 700], [940, 740]],
      },
      {
        id: 'empty',
        kind: 'rect',
        color: '#e03131',
        points: [],
      },
    ]
    expect(liveScreenshotMarks(marks, null, [], [10, 20], [800, 600]).map(mark => mark.id))
      .toEqual(['near'])
  })

  it('keeps a legacy region out of a screenshot taken on a reported surface', () => {
    const mark: AnnotationMark = {
      id: 'legacy-region',
      kind: 'rect',
      color: '#e03131',
      points: [[20, 30], [220, 130]],
    }
    expect(liveScreenshotMarks([mark], '#slide-1', [], [0, 0], [800, 600])).toEqual([])
    expect(liveScreenshotMarks([mark], null, [], [0, 0], [800, 600])).toEqual([mark])
  })

  it('falls back to the saved box when the page no longer watches an element', () => {
    const saved = element('saved', '#saved', [15, 25, 40, 50])
    expect(liveScreenshotMarks([saved], null, [], [0, 0], [800, 600])).toEqual([saved])
  })

  it('drops an element with neither a live box nor a recorded box', () => {
    const lost: AnnotationMark = {
      id: 'lost',
      kind: 'element',
      color: '#1971c2',
      points: [[15, 25], [55, 75]],
    }
    expect(liveScreenshotMarks([lost], null, [], [0, 0], [800, 600])).toEqual([])
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
