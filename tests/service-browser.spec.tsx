// @vitest-environment jsdom
/** The right-sidebar local-pages picker and its hand-off to the live annotator. */
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ServiceBrowser } from '../src/client/ServiceBrowser'
import { defined, installDom } from './dom'

interface Call {
  readonly url: string
  readonly init: RequestInit | undefined
}

let host: HTMLElement
let root: Root
let calls: Call[]

/** A response-shaped object sufficient for the browser half. */
function response(body: unknown, status = 200): {
  readonly ok: boolean
  readonly status: number
  json(): Promise<unknown>
} {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

type StubResponse = ReturnType<typeof response>

/** A promise a test can settle after observing the UI in flight. */
interface Deferred<T> {
  readonly promise: Promise<T>
  resolve(value: T): void
  reject(reason: unknown): void
}

/** Create a promise that stays pending until the test settles it. */
function deferred<T>(): Deferred<T> {
  let resolvePromise: (value: T) => void = () => {
    throw new Error('deferred promise executor did not run')
  }
  let rejectPromise: (reason?: unknown) => void = () => {
    throw new Error('deferred promise executor did not run')
  }
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve
    rejectPromise = reject
  })
  return {
    promise,
    resolve: (value: T) => { resolvePromise(value) },
    reject: (reason: unknown) => { rejectPromise(reason) },
  }
}

/**
 * Install a fetch double whose discovery and live routes can differ per test.
 */
function stubNetwork(options: {
  readonly services?: unknown
  readonly servicesStatus?: number
  readonly live?: unknown
  readonly liveStatus?: number
} = {}): void {
  vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
    calls.push({ url, init })
    if (url.includes('/services')) {
      return response(options.services ?? { ok: true, services: [] }, options.servicesStatus)
    }
    if (url.includes('/live') && init?.method === 'POST') {
      return response(options.live ?? {
        ok: true,
        url: 'http://127.0.0.1:9444/__dsh_figmark_live/proxy/',
      }, options.liveStatus)
    }
    if (url.includes('/live')) return response({ ok: true })
    return response({ ok: true })
  })
}

/** One picker for a session. */
function browser(sessionId: string): ReactNode {
  return (
    <ServiceBrowser
      sessionId={sessionId}
      localeId="zh"
      sessions={undefined}
      conversation={undefined}
      remote={undefined}
    />
  )
}

/** Mount the picker and let its initial scan settle. */
async function mount(sessionId = 's1'): Promise<void> {
  await act(async () => {
    root.render(browser(sessionId))
    await Promise.resolve()
    await Promise.resolve()
  })
}

/** Type into a field the way React sees it. */
async function type(input: HTMLInputElement, value: string): Promise<void> {
  // oxlint-disable-next-line typescript/unbound-method -- A DOM setter is invoked below with the input as its receiver.
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set as
    | ((this: HTMLInputElement, value: string) => void)
    | undefined
  await act(async () => {
    setter?.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

/** Parse the JSON string a recorded request carried. */
function jsonBody(call: Call | undefined): unknown {
  const body = call?.init?.body
  if (typeof body !== 'string') throw new Error('request carried no JSON body')
  return JSON.parse(body) as unknown
}

beforeEach(() => {
  installDom()
  localStorage.clear()
  calls = []
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
  ;(globalThis as Record<string, unknown>)['ResizeObserver'] = class {
    observe(): void {}
    disconnect(): void {}
  }
})

afterEach(() => {
  act(() => { root.unmount() })
  host.remove()
  vi.unstubAllGlobals()
})

describe('the local-pages picker', () => {
  it('injects its stylesheet, scans with remembered addresses, and renders results', async () => {
    localStorage.setItem('dsh-figmark.services.recent.v1', JSON.stringify([
      'http://localhost:5173/',
      'http://localhost:5174/',
      'http://localhost:5175/',
      'http://localhost:5176/',
      'http://localhost:5177/',
      'http://localhost:5178/',
      'http://localhost:5179/',
      'http://localhost:5180/',
      'http://localhost:5181/',
      42,
    ]))
    stubNetwork({
      services: {
        ok: true,
        services: [
          {
            url: 'http://127.0.0.1:5173/deck?view=notes',
            title: 'Launch deck',
            source: 'recent',
          },
          { url: 'not-a-url', source: 'common' },
        ],
      },
    })
    await mount()
    expect(document.querySelector('style[data-dsh-figmark]')).not.toBeNull()
    expect(host.querySelector('.da-services-head h1')?.textContent).toBe('本机网页')
    expect(host.querySelectorAll('.da-service-row')).toHaveLength(2)
    expect(host.textContent).toContain('Launch deck')
    expect(host.textContent).toContain('127.0.0.1:5173/deck?view=notes')
    const discovery = defined(calls.find(call => call.url.includes('/services')))
    expect(jsonBody(discovery)).toEqual({
      sessionId: 's1',
      recent: [
        'http://localhost:5173/',
        'http://localhost:5174/',
        'http://localhost:5175/',
        'http://localhost:5176/',
        'http://localhost:5177/',
        'http://localhost:5178/',
        'http://localhost:5179/',
        'http://localhost:5180/',
      ],
    })
  })

  it('filters by title or address and says when nothing matches', async () => {
    stubNetwork({
      services: {
        ok: true,
        services: [
          { url: 'http://127.0.0.1:5173/', title: 'Alpha deck', source: 'common' },
          { url: 'http://127.0.0.1:8000/docs', title: 'Beta docs', source: 'common' },
        ],
      },
    })
    await mount()
    const input = defined(host.querySelector<HTMLInputElement>('.da-service-search input'))
    await type(input, 'beta')
    expect(host.querySelectorAll('.da-service-row')).toHaveLength(1)
    expect(host.textContent).toContain('Beta docs')
    await type(input, 'missing')
    expect(host.querySelectorAll('.da-service-row')).toHaveLength(0)
    expect(host.textContent).toContain('没有发现本机服务')
  })

  it('treats malformed remembered storage as no history', async () => {
    localStorage.setItem('dsh-figmark.services.recent.v1', '{not json')
    stubNetwork()
    await mount()
    const discovery = defined(calls.find(call => call.url.includes('/services')))
    expect(jsonBody(discovery)).toEqual({ sessionId: 's1', recent: [] })
  })

  it('treats valid non-list storage as no history and renders address fallbacks', async () => {
    localStorage.setItem('dsh-figmark.services.recent.v1', '{}')
    stubNetwork({
      services: {
        ok: true,
        services: [
          { url: 'http://localhost/guide?step=2', source: 'common' },
          { url: 'not-a-url', source: 'common' },
        ],
      },
    })
    await mount()
    const discovery = defined(calls.find(call => call.url.includes('/services')))
    expect(jsonBody(discovery)).toEqual({ sessionId: 's1', recent: [] })
    expect(host.textContent).toContain('localhost/guide?step=2')
    expect(host.textContent).toContain('not-a-url')
  })

  it('shows a scan failure instead of pretending the list is empty', async () => {
    stubNetwork({ services: { ok: false, error: 'scan refused' }, servicesStatus: 403 })
    await mount()
    expect(host.querySelector('[role="alert"]')?.textContent).toBe('scan refused')
  })

  it('keeps the newest scan when an older response arrives late', async () => {
    const scans: Deferred<StubResponse>[] = []
    vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
      calls.push({ url, init })
      if (url.includes('/services')) {
        const pending = deferred<StubResponse>()
        scans.push(pending)
        return pending.promise
      }
      return Promise.resolve(response({ ok: true }))
    })
    await mount('s1')
    await act(async () => {
      root.render(browser('s2'))
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(scans).toHaveLength(2)
    await act(async () => {
      defined(scans[1]).resolve(response({
        ok: true,
        services: [{ url: 'http://127.0.0.1:6002/', title: 'Newest', source: 'common' }],
      }))
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(host.textContent).toContain('Newest')
    await act(async () => {
      defined(scans[0]).resolve(response({
        ok: true,
        services: [{ url: 'http://127.0.0.1:6001/', title: 'Stale', source: 'common' }],
      }))
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(host.textContent).toContain('Newest')
    expect(host.textContent).not.toContain('Stale')
    const toolbar = defined(host.querySelector<HTMLButtonElement>('.da-services-toolbar button'))
    expect(toolbar.disabled).toBe(false)
  })

  it('rescans on demand and shows a rejection with no Error message', async () => {
    stubNetwork()
    await mount()
    vi.stubGlobal('fetch', vi.fn(async () => { throw 'loopback scanner is unavailable' }))
    await act(async () => {
      defined(host.querySelector<HTMLButtonElement>('.da-services-toolbar button')).click()
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(host.querySelector('[role="alert"]')?.textContent).toBe('loopback scanner is unavailable')
  })

  it('refuses an address that is no address', async () => {
    stubNetwork({
      services: {
        ok: true,
        services: [{ url: 'http://127.0.0.1:5173/', title: 'Deck', source: 'common' }],
      },
    })
    await mount()
    const input = defined(host.querySelector<HTMLInputElement>('.da-service-search input'))
    await type(input, 'http://')
    await act(async () => {
      defined(host.querySelector<HTMLFormElement>('.da-service-search')).requestSubmit()
    })
    expect(host.querySelector('[role="alert"]')?.textContent).toBe('请输入本机 HTTP 地址')
    expect(calls.some(call => call.url.includes('/live'))).toBe(false)
  })

  it('opens a page, remembers it, and returns to a fresh scan', async () => {
    stubNetwork({
      services: {
        ok: true,
        services: [{ url: 'http://127.0.0.1:5173/', title: 'Deck', source: 'common' }],
      },
    })
    await mount()
    await act(async () => {
      defined(host.querySelector<HTMLButtonElement>('.da-service-row')).click()
      await new Promise(resolve => { setTimeout(resolve, 0) })
    })
    expect(calls.some(call => call.url.includes('/live') && call.init?.method === 'POST')).toBe(true)
    expect(JSON.parse(localStorage.getItem('dsh-figmark.services.recent.v1') ?? '[]')).toEqual([
      'http://127.0.0.1:5173/',
    ])
    expect(host.querySelector('.da-service-live')).not.toBeNull()
    const drawer = defined(host.querySelector<HTMLButtonElement>('.da-live-toggle'))
    await act(async () => { drawer.click() })
    const back = [...host.querySelectorAll('button')].find(button => button.textContent === '返回列表')
    await act(async () => {
      defined(back).click()
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(calls.some(call => call.url.includes('/live?url=') && call.init?.method === 'DELETE')).toBe(true)
    expect(host.querySelector('.da-services')).not.toBeNull()
  })

  it('locks row opens so the first clicked page wins', async () => {
    const first = 'http://127.0.0.1:5173/'
    const second = 'http://127.0.0.1:8000/'
    const pending = deferred<StubResponse>()
    vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
      calls.push({ url, init })
      if (url.includes('/services')) {
        return Promise.resolve(response({
          ok: true,
          services: [
            { url: first, title: 'First', source: 'common' },
            { url: second, title: 'Second', source: 'common' },
          ],
        }))
      }
      if (url.includes('/live') && init?.method === 'POST') return pending.promise
      return Promise.resolve(response({ ok: true }))
    })
    await mount()
    const rows = [...host.querySelectorAll<HTMLButtonElement>('.da-service-row')]
    await act(async () => {
      defined(rows[0]).click()
      defined(rows[1]).click()
      await Promise.resolve()
    })
    expect(calls.filter(call => call.url.includes('/live') && call.init?.method === 'POST')).toHaveLength(1)
    expect(rows.every(row => row.disabled)).toBe(true)
    await act(async () => {
      pending.resolve(response({
        ok: true,
        url: 'http://127.0.0.1:9444/__dsh_figmark_live/proxy/',
      }))
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(host.querySelector('.da-service-live')).not.toBeNull()
    expect(JSON.parse(localStorage.getItem('dsh-figmark.services.recent.v1') ?? '[]')).toEqual([first])
  })

  it('does not deliver an open response after the picker is torn down', async () => {
    const pending = deferred<StubResponse>()
    vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
      calls.push({ url, init })
      if (url.includes('/services')) {
        return Promise.resolve(response({
          ok: true,
          services: [{ url: 'http://127.0.0.1:5173/', source: 'common' }],
        }))
      }
      if (url.includes('/live') && init?.method === 'POST') return pending.promise
      return Promise.resolve(response({ ok: true }))
    })
    await mount()
    await act(async () => {
      defined(host.querySelector<HTMLButtonElement>('.da-service-row')).click()
      await Promise.resolve()
    })
    act(() => { root.unmount() })
    await act(async () => {
      root = createRoot(host)
      root.render(browser('s2'))
      await Promise.resolve()
      await Promise.resolve()
    })
    await act(async () => {
      pending.resolve(response({
        ok: true,
        url: 'http://127.0.0.1:9444/__dsh_figmark_live/proxy/',
      }))
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(host.querySelector('.da-service-live')).toBeNull()
    expect(localStorage.getItem('dsh-figmark.services.recent.v1')).toBeNull()
    // The Host installed the late proxy even though no annotator claimed it. The
    // cleanup names that proxy so it cannot close a newer page.
    expect(calls.some(call =>
      call.url.includes('/live?url=http%3A%2F%2F127.0.0.1%3A9444')
      && call.init?.method === 'DELETE')).toBe(true)
  })

  it('opens the visible result when the search text is a title, not an address', async () => {
    stubNetwork({
      services: {
        ok: true,
        services: [{ url: 'http://127.0.0.1:5173/', title: 'Deck', source: 'common' }],
      },
    })
    await mount()
    const input = defined(host.querySelector<HTMLInputElement>('.da-service-search input'))
    await type(input, 'deck')
    await act(async () => {
      defined(host.querySelector<HTMLFormElement>('.da-service-search')).requestSubmit()
      await Promise.resolve()
      await Promise.resolve()
    })
    const opened = calls.find(call => call.url.includes('/live') && call.init?.method === 'POST')
    expect(jsonBody(opened)).toEqual({ url: 'http://127.0.0.1:5173/' })
    expect(host.querySelector('.da-service-live')).not.toBeNull()
  })

  it('opens the title match instead of an earlier row that only matches by URL', async () => {
    stubNetwork({
      services: {
        ok: true,
        services: [
          { url: 'http://127.0.0.1:5173/node.js', title: 'Source map', source: 'common' },
          { url: 'http://127.0.0.1:8000/', title: 'Node.js', source: 'common' },
        ],
      },
    })
    await mount()
    const input = defined(host.querySelector<HTMLInputElement>('.da-service-search input'))
    await type(input, 'node.js')
    await act(async () => {
      defined(host.querySelector<HTMLFormElement>('.da-service-search')).requestSubmit()
      await Promise.resolve()
      await Promise.resolve()
    })
    const opened = calls.find(call => call.url.includes('/live') && call.init?.method === 'POST')
    expect(jsonBody(opened)).toEqual({ url: 'http://127.0.0.1:8000/' })
  })

  it.each(['Node.js', 'README.md', 'Chapter:2'])(
    'treats punctuation in the matching title %s as a title',
    async (title) => {
      stubNetwork({
        services: {
          ok: true,
          services: [{ url: 'http://127.0.0.1:5173/', title, source: 'common' }],
        },
      })
      await mount()
      const input = defined(host.querySelector<HTMLInputElement>('.da-service-search input'))
      await type(input, title)
      await act(async () => {
        defined(host.querySelector<HTMLFormElement>('.da-service-search')).requestSubmit()
        await Promise.resolve()
        await Promise.resolve()
      })
      const opened = calls.find(call => call.url.includes('/live') && call.init?.method === 'POST')
      expect(jsonBody(opened)).toEqual({ url: 'http://127.0.0.1:5173/' })
      expect(host.querySelector('.da-service-live')).not.toBeNull()
    },
  )

  it('opens a visible row when only its path matches the query', async () => {
    stubNetwork({
      services: {
        ok: true,
        services: [{ url: 'http://127.0.0.1:5173/docs', title: 'Reference', source: 'common' }],
      },
    })
    await mount()
    const input = defined(host.querySelector<HTMLInputElement>('.da-service-search input'))
    await type(input, '/docs')
    await act(async () => {
      defined(host.querySelector<HTMLFormElement>('.da-service-search')).requestSubmit()
      await Promise.resolve()
      await Promise.resolve()
    })
    const opened = calls.find(call => call.url.includes('/live') && call.init?.method === 'POST')
    expect(jsonBody(opened)).toEqual({ url: 'http://127.0.0.1:5173/docs' })
  })

  it('reports ordinary text when no discovered row matches it', async () => {
    stubNetwork({
      services: {
        ok: true,
        services: [{ url: 'http://127.0.0.1:5173/', title: 'Deck', source: 'common' }],
      },
    })
    await mount()
    const input = defined(host.querySelector<HTMLInputElement>('.da-service-search input'))
    await type(input, 'missing deck')
    await act(async () => {
      defined(host.querySelector<HTMLFormElement>('.da-service-search')).requestSubmit()
    })
    expect(host.querySelector('[role="alert"]')?.textContent).toBe('请输入本机 HTTP 地址')
    expect(calls.some(call => call.url.includes('/live'))).toBe(false)
  })

  it('opens the address the reader typed instead of a matching discovered path', async () => {
    stubNetwork({
      services: {
        ok: true,
        services: [
          { url: 'http://127.0.0.1:8000/docs', title: 'API docs', source: 'common' },
        ],
      },
    })
    await mount()
    const input = defined(host.querySelector<HTMLInputElement>('.da-service-search input'))
    await type(input, '127.0.0.1:8000')
    await act(async () => {
      defined(host.querySelector<HTMLFormElement>('.da-service-search')).requestSubmit()
      await Promise.resolve()
      await Promise.resolve()
    })
    const opened = calls.find(call => call.url.includes('/live') && call.init?.method === 'POST')
    expect(jsonBody(opened)).toEqual({ url: 'http://127.0.0.1:8000/' })
  })

  it('opens an address even when storage refuses to remember it', async () => {
    stubNetwork()
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage full')
    })
    await mount()
    const input = defined(host.querySelector<HTMLInputElement>('.da-service-search input'))
    await type(input, 'localhost:5173')
    await act(async () => {
      defined(host.querySelector<HTMLFormElement>('.da-service-search')).requestSubmit()
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(host.querySelector('.da-service-live')).not.toBeNull()
    setItem.mockRestore()
  })

  it('reports a live-page refusal in the picker', async () => {
    stubNetwork({ live: { ok: false, error: 'address refused' }, liveStatus: 400 })
    await mount()
    const input = defined(host.querySelector<HTMLInputElement>('.da-service-search input'))
    await type(input, 'localhost:5173')
    await act(async () => {
      defined(host.querySelector<HTMLFormElement>('.da-service-search')).requestSubmit()
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(host.querySelector('[role="alert"]')?.textContent).toBe('address refused')
  })

  it('reports a live-page rejection with no Error message', async () => {
    stubNetwork()
    await mount()
    vi.stubGlobal('fetch', vi.fn(async () => { throw 'proxy stopped' }))
    const input = defined(host.querySelector<HTMLInputElement>('.da-service-search input'))
    await type(input, 'localhost:5173')
    await act(async () => {
      defined(host.querySelector<HTMLFormElement>('.da-service-search')).requestSubmit()
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(host.querySelector('[role="alert"]')?.textContent).toBe('proxy stopped')
  })
})
