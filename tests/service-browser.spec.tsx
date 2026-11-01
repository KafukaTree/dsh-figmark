// @vitest-environment jsdom
/** The right-sidebar local-pages picker and its hand-off to the live annotator. */
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LIVE_MESSAGE } from '../src/shared/live'
import { ServiceBrowser } from '../src/client/ServiceBrowser'
import { zh } from '../src/client/locales'
import { LIVE_DRAFT_KEY_PREFIX } from '../src/client/live-drafts'
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
function browser(
  sessionId: string,
  useTabInfo?: () => {
    readonly tab: {
      readonly navigation: {
        readonly revision: number
        readonly params: unknown
      }
    }
  },
): ReactNode {
  return (
    <ServiceBrowser
      sessionId={sessionId}
      localeId="zh"
      sessions={undefined}
      conversation={undefined}
      remote={undefined}
      useTabInfo={useTabInfo}
    />
  )
}

/** Mount the picker and let its initial scan settle. */
async function mount(
  sessionId = 's1',
  useTabInfo?: () => {
    readonly tab: {
      readonly navigation: {
        readonly revision: number
        readonly params: unknown
      }
    }
  },
): Promise<void> {
  await act(async () => {
    root.render(browser(sessionId, useTabInfo))
    await Promise.resolve()
    await Promise.resolve()
  })
}

/** Type into a field the way React sees it. */
async function type(input: HTMLInputElement | HTMLTextAreaElement, value: string): Promise<void> {
  const prototype = input.tagName === 'TEXTAREA'
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype
  // oxlint-disable-next-line typescript/unbound-method -- The setter is invoked below with the input as its receiver.
  const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set as
    | ((this: HTMLInputElement | HTMLTextAreaElement, value: string) => void)
    | undefined
  await act(async () => {
    setter?.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

/** Press one control and let the opened page's effects settle. */
async function click(element: Element): Promise<void> {
  await act(async () => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await new Promise(resolve => { setTimeout(resolve, 0) })
    for (let turn = 0; turn < 6; turn += 1) await Promise.resolve()
  })
}

/** The live frame currently mounted by the service browser. */
function frame(): HTMLIFrameElement {
  return defined(host.querySelector<HTMLIFrameElement>('iframe.da-html'))
}

/** Report one element pick from the framed service page. */
async function reportPick(id: string): Promise<void> {
  const current = frame()
  const origin = new URL(defined(current.getAttribute('src'))).origin
  await act(async () => {
    window.dispatchEvent(new MessageEvent('message', {
      data: {
        figmark: LIVE_MESSAGE,
        kind: 'pick',
        tag: 'p',
        id,
        selector: `#${id}`,
        bbox: [10, 20, 100, 40],
        scroll: [0, 0],
        level: 1,
        count: 1,
      },
      origin,
      source: current.contentWindow,
    }))
    for (let turn = 0; turn < 6; turn += 1) await Promise.resolve()
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
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 800 })
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => 600 })
})

afterEach(() => {
  act(() => { root.unmount() })
  host.remove()
  delete (HTMLElement.prototype as { clientWidth?: number }).clientWidth
  delete (HTMLElement.prototype as { clientHeight?: number }).clientHeight
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

  it('opens the page named by an annotation card, with that page draft', async () => {
    const address = 'http://127.0.0.1:8811/deck/index.html?clean=1'
    localStorage.setItem(`${LIVE_DRAFT_KEY_PREFIX}s1`, JSON.stringify({
      version: 1,
      entries: [[address, [{
        id: 'seeded',
        kind: 'point',
        color: '#1971c2',
        points: [[12, 24]],
        detail: '从这里继续',
      }], '继续这页', 100]],
    }))
    stubNetwork({
      services: { ok: true, services: [] },
      live: { ok: true, url: 'http://127.0.0.1:9444/__dsh_figmark_live/proxy/' },
    })
    await mount('s1', () => ({
      tab: { navigation: { revision: 1, params: { url: address } } },
    }))
    const open = defined(calls.find(call => call.url.includes('/live') && call.init?.method === 'POST'))
    expect(open.init?.body).toBe(JSON.stringify({ url: address }))
    expect(host.querySelector('.da-dock-count')?.textContent).toBe('1')
  })

  it('accepts revision zero as the first navigation request', async () => {
    const address = 'http://127.0.0.1:8811/deck/index.html'
    stubNetwork({ services: { ok: true, services: [] } })
    const useTabInfo = (): {
      readonly tab: {
        readonly navigation: {
          readonly revision: number
          readonly params: unknown
        }
      }
    } => ({
      tab: { navigation: { revision: 0, params: { url: address } } },
    })
    await mount('s1', useTabInfo)
    expect(calls.filter(call => call.url.includes('/live') && call.init?.method === 'POST'))
      .toHaveLength(1)
    await act(async () => {
      root.render(browser('s1', useTabInfo))
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(calls.filter(call => call.url.includes('/live') && call.init?.method === 'POST'))
      .toHaveLength(1)
    expect(host.querySelector('.da-service-live')).not.toBeNull()
  })

  it('brings an already-open page to the front without replacing its proxy', async () => {
    const address = 'http://127.0.0.1:5173/'
    let navigation = { revision: 0, params: null as unknown }
    const useTabInfo = vi.fn((): {
      readonly tab: {
        readonly navigation: {
          readonly revision: number
          readonly params: unknown
        }
      }
    } => ({ tab: { navigation } }))
    stubNetwork({
      services: {
        ok: true,
        services: [{ url: address, title: 'Deck', source: 'common' }],
      },
    })
    await mount('s1', useTabInfo)
    await click(defined(host.querySelector<HTMLButtonElement>('.da-service-row')))
    await reportPick('kept')
    const original = frame()
    const posts = calls.filter(call => call.url.includes('/live') && call.init?.method === 'POST').length
    await click(defined(host.querySelector<HTMLButtonElement>('.da-service-list-tab')))
    expect(defined(host.querySelector<HTMLElement>('.da-services')).hidden).toBe(false)

    navigation = { revision: 1, params: { url: address } }
    await act(async () => {
      root.render(browser('s1', useTabInfo))
      await new Promise(resolve => { setTimeout(resolve, 0) })
      for (let turn = 0; turn < 8; turn += 1) await Promise.resolve()
    })
    expect(useTabInfo.mock.calls.length).toBeGreaterThan(1)
    expect(defined(host.querySelector<HTMLElement>('.da-services')).hidden).toBe(true)
    expect(frame()).toBe(original)
    expect(host.querySelectorAll('[data-da-mark]')).toHaveLength(1)
    expect(calls.filter(call =>
      call.url.includes('/live') && call.init?.method === 'POST')).toHaveLength(posts)
  })

  it('does not lose a card seed while another page is still opening', async () => {
    const first = 'http://127.0.0.1:5173/'
    const second = 'http://127.0.0.1:8000/'
    const pendingFirst = deferred<StubResponse>()
    let navigation = { revision: 0, params: null as unknown }
    const useTabInfo = (): {
      readonly tab: {
        readonly navigation: {
          readonly revision: number
          readonly params: unknown
        }
      }
    } => ({ tab: { navigation } })
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
      if (url.includes('/live') && init?.method === 'POST') {
        const body = typeof init.body === 'string'
          ? JSON.parse(init.body) as { readonly url?: string }
          : {}
        return body.url === first
          ? pendingFirst.promise
          : Promise.resolve(response({
            ok: true,
            url: 'http://127.0.0.1:9444/__dsh_figmark_live/proxy/second/',
          }))
      }
      return Promise.resolve(response({ ok: true }))
    })
    await mount('s1', useTabInfo)
    await act(async () => {
      defined(host.querySelector<HTMLButtonElement>('.da-service-row')).click()
      await Promise.resolve()
    })

    navigation = { revision: 1, params: { url: second } }
    await act(async () => {
      root.render(browser('s1', useTabInfo))
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(calls.filter(call => call.url.includes('/live') && call.init?.method === 'POST'))
      .toHaveLength(1)

    await act(async () => {
      pendingFirst.resolve(response({
        ok: true,
        url: 'http://127.0.0.1:9444/__dsh_figmark_live/proxy/first/',
      }))
      await new Promise(resolve => { setTimeout(resolve, 0) })
      for (let turn = 0; turn < 8; turn += 1) await Promise.resolve()
    })
    const posts = calls.filter(call => call.url.includes('/live') && call.init?.method === 'POST')
    expect(posts.map(call => jsonBody(call))).toEqual([{ url: first }, { url: second }])
    expect(frame().getAttribute('src')).toBe('http://127.0.0.1:9444/__dsh_figmark_live/proxy/second/')
  })

  it('ignores navigation seeds that do not name a loopback page', async () => {
    stubNetwork({ services: { ok: true, services: [] } })
    await mount('s1', () => ({
      tab: { navigation: { revision: 1, params: null } },
    }))
    await mount('s1', () => ({
      tab: { navigation: { revision: 2, params: 'not-a-page' } },
    }))
    await mount('s1', () => ({
      tab: { navigation: { revision: 3, params: { url: 'https://example.com/' } } },
    }))
    expect(calls.filter(call => call.url.includes('/live') && call.init?.method === 'POST'))
      .toHaveLength(0)
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
    await act(async () => {
      defined(host.querySelector<HTMLButtonElement>('.da-service-list-tab')).click()
      await Promise.resolve()
      await Promise.resolve()
    })
    // Returning to the picker keeps the proxy and the page's transient state alive;
    // the tab can come back without a second POST.
    expect(calls.some(call => call.url.includes('/live?url=') && call.init?.method === 'DELETE')).toBe(false)
    expect(defined(host.querySelector<HTMLElement>('.da-service-live')).hidden).toBe(true)
    expect(host.querySelector('.da-services')).not.toBeNull()
  })

  it('keeps a live workspace when returning to the list, then restores its marks', async () => {
    stubNetwork({
      services: {
        ok: true,
        services: [{ url: 'http://127.0.0.1:5173/', title: 'Deck', source: 'common' }],
      },
    })
    await mount()
    await click(defined(host.querySelector<HTMLButtonElement>('.da-service-row')))
    await reportPick('lead')
    expect(host.querySelectorAll('[data-da-mark]')).toHaveLength(1)

    await click(defined(host.querySelector<HTMLButtonElement>('.da-service-list-tab')))
    expect(defined(host.querySelector<HTMLElement>('.da-services')).hidden).toBe(false)
    expect(host.querySelectorAll('.da-service-tab')).toHaveLength(1)

    await click(defined(host.querySelector<HTMLButtonElement>('.da-service-tab-open')))
    expect(defined(host.querySelector<HTMLElement>('.da-services')).hidden).toBe(true)
    expect(host.querySelectorAll('[data-da-mark]')).toHaveLength(1)
  })

  it('keeps two page workspaces independent without running two proxies', async () => {
    const pages = new Map([
      ['http://127.0.0.1:5173/', 'http://127.0.0.1:9444/__dsh_figmark_live/proxy/first/'],
      ['http://127.0.0.1:8000/', 'http://127.0.0.1:9444/__dsh_figmark_live/proxy/second/'],
    ])
    vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
      calls.push({ url, init })
      if (url.includes('/services')) {
        return response({
          ok: true,
          services: [
            { url: 'http://127.0.0.1:5173/', title: 'First', source: 'common' },
            { url: 'http://127.0.0.1:8000/', title: 'Second', source: 'common' },
          ],
        })
      }
      if (url.includes('/live') && init?.method === 'POST') {
        const body = typeof init.body === 'string'
          ? JSON.parse(init.body) as { readonly url?: string }
          : {}
        return response({ ok: true, url: defined(pages.get(body.url ?? '')) })
      }
      return response({ ok: true })
    })
    await mount()
    const rows = [...host.querySelectorAll<HTMLButtonElement>('.da-service-row')]
    await click(defined(rows[0]))
    await reportPick('first')
    await click(defined(host.querySelector<HTMLButtonElement>('.da-service-list-tab')))
    await click(defined(rows[1]))
    await reportPick('second')
    expect(host.querySelectorAll('.da-service-tab')).toHaveLength(2)

    const tabs = [...host.querySelectorAll<HTMLButtonElement>('.da-service-tab-open')]
    await click(defined(tabs[0]))
    expect(host.querySelectorAll('[data-da-mark]')).toHaveLength(1)
    await click(defined(host.querySelectorAll<HTMLButtonElement>('.da-service-tab-open')[1]))
    expect(host.querySelectorAll('[data-da-mark]')).toHaveLength(1)
    // Every switch replaces the one Host proxy instead of asking it to run both.
    const posts = calls.filter(call => call.url.includes('/live') && call.init?.method === 'POST')
    expect(posts.length).toBeGreaterThanOrEqual(4)
  })

  it('keeps the current page when pressing its active tab or reopening it from the list', async () => {
    stubNetwork({
      services: {
        ok: true,
        services: [{ url: 'http://127.0.0.1:5173/', title: 'Deck', source: 'common' }],
      },
    })
    await mount()
    await click(defined(host.querySelector<HTMLButtonElement>('.da-service-row')))
    await reportPick('kept')
    const posts = calls.filter(call => call.url.includes('/live') && call.init?.method === 'POST').length

    await click(defined(host.querySelector<HTMLButtonElement>('.da-service-tab-open')))
    expect(calls.filter(call =>
      call.url.includes('/live') && call.init?.method === 'POST')).toHaveLength(posts)
    expect(host.querySelectorAll('[data-da-mark]')).toHaveLength(1)

    await click(defined(host.querySelector<HTMLButtonElement>('.da-service-list-tab')))
    const input = defined(host.querySelector<HTMLInputElement>('.da-service-search input'))
    await type(input, '127.0.0.1:5173')
    await act(async () => {
      defined(host.querySelector<HTMLFormElement>('.da-service-search')).requestSubmit()
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(calls.filter(call =>
      call.url.includes('/live') && call.init?.method === 'POST')).toHaveLength(posts + 1)
    expect(host.querySelectorAll('[data-da-mark]')).toHaveLength(1)
  })

  it('refreshes the active page from the tab strip without losing its draft', async () => {
    stubNetwork({
      services: {
        ok: true,
        services: [{ url: 'http://127.0.0.1:5173/', title: 'Deck', source: 'common' }],
      },
    })
    await mount()
    expect(host.querySelector('.da-service-refresh')).toBeNull()
    await click(defined(host.querySelector<HTMLButtonElement>('.da-service-row')))
    await reportPick('kept')
    const original = frame()
    const posts = calls.filter(call => call.url.includes('/live') && call.init?.method === 'POST').length
    expect((defined(host.querySelector('.da-live-bar')) as HTMLElement).hidden).toBe(true)

    const refresh = defined(host.querySelector<HTMLButtonElement>('.da-service-refresh'))
    expect(refresh.getAttribute('aria-label')).toBe(zh.liveRefresh)
    expect(refresh.getAttribute('title')).toBe(zh.liveRefresh)
    expect([...refresh.querySelectorAll('path')].map(path => path.getAttribute('d'))).toEqual([
      'M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8',
      'M21 3v5h-5',
    ])
    await click(refresh)
    expect(frame()).not.toBe(original)
    expect(frame().getAttribute('src')).toBe('http://127.0.0.1:9444/__dsh_figmark_live/proxy/')
    expect(host.querySelectorAll('[data-da-mark]')).toHaveLength(1)
    expect(calls.filter(call =>
      call.url.includes('/live') && call.init?.method === 'POST')).toHaveLength(posts)
  })

  it('shows a failed tab switch without covering or losing the current page', async () => {
    vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
      calls.push({ url, init })
      if (url.includes('/services')) {
        return response({
          ok: true,
          services: [{ url: 'http://127.0.0.1:5173/', title: 'Deck', source: 'common' }],
        })
      }
      if (url.includes('/live') && init?.method === 'POST') {
        const body = typeof init.body === 'string'
          ? JSON.parse(init.body) as { readonly url?: string }
          : {}
        return body.url === 'http://127.0.0.1:5173/'
          ? response({ ok: true, url: 'http://127.0.0.1:9444/__dsh_figmark_live/proxy/first/' })
          : response({ ok: false, error: 'second page refused' }, 400)
      }
      return response({ ok: true })
    })
    await mount()
    await click(defined(host.querySelector<HTMLButtonElement>('.da-service-row')))
    await reportPick('still here')
    const current = frame()

    const input = defined(host.querySelector<HTMLInputElement>('.da-service-search input'))
    await type(input, 'localhost:7999')
    await act(async () => {
      defined(host.querySelector<HTMLFormElement>('.da-service-search')).requestSubmit()
      await new Promise(resolve => { setTimeout(resolve, 0) })
      for (let turn = 0; turn < 6; turn += 1) await Promise.resolve()
    })

    expect(host.querySelector('.da-service-errorbar')?.textContent).toBe('second page refused')
    expect(frame()).toBe(current)
    expect(host.querySelectorAll('[data-da-mark]')).toHaveLength(1)
  })

  it('closes the active workspace, promotes another, then leaves an empty list', async () => {
    stubNetwork({
      services: {
        ok: true,
        services: [
          { url: 'http://127.0.0.1:5173/', title: 'First', source: 'common' },
          { url: 'http://127.0.0.1:8000/', title: 'Second', source: 'common' },
        ],
      },
    })
    await mount()
    const rows = [...host.querySelectorAll<HTMLButtonElement>('.da-service-row')]
    await click(defined(rows[0]))
    await reportPick('first')
    await click(defined(host.querySelector<HTMLButtonElement>('.da-service-list-tab')))
    await click(defined(rows[1]))
    await reportPick('second')

    const closeButtons = [...host.querySelectorAll<HTMLButtonElement>('.da-service-tab-close')]
    await click(defined(closeButtons[1]))
    expect(host.querySelectorAll('.da-service-tab')).toHaveLength(1)
    expect(host.querySelector('.da-service-tab-name')?.textContent).toBe('First')
    expect(defined(host.querySelector<HTMLElement>('.da-services')).hidden).toBe(false)

    await click(defined(host.querySelector<HTMLButtonElement>('.da-service-tab-open')))
    expect(host.querySelectorAll('[data-da-mark]')).toHaveLength(1)

    await click(defined(host.querySelector<HTMLButtonElement>('.da-service-tab-close')))
    expect(host.querySelectorAll('.da-service-tab')).toHaveLength(0)
    expect(defined(host.querySelector<HTMLElement>('.da-services')).hidden).toBe(false)
  })

  it('keeps an untitled page untitled on an address open, then adopts a scanned title', async () => {
    let scans = 0
    vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
      calls.push({ url, init })
      if (url.includes('/services')) {
        scans += 1
        return response({
          ok: true,
          services: [{
            url: 'http://127.0.0.1:5173/guide',
            ...(scans === 1 ? {} : { title: 'Guide' }),
            source: 'common',
          }],
        })
      }
      if (url.includes('/live') && init?.method === 'POST') {
        return response({ ok: true, url: 'http://127.0.0.1:9444/__dsh_figmark_live/proxy/guide/' })
      }
      return response({ ok: true })
    })
    await mount()
    await click(defined(host.querySelector<HTMLButtonElement>('.da-service-row')))
    expect(host.querySelector('.da-service-tab-name')?.textContent).toBe('/guide')

    await click(defined(host.querySelector<HTMLButtonElement>('.da-service-list-tab')))
    const input = defined(host.querySelector<HTMLInputElement>('.da-service-search input'))
    await type(input, '127.0.0.1:5173/guide')
    await act(async () => {
      defined(host.querySelector<HTMLFormElement>('.da-service-search')).requestSubmit()
      await new Promise(resolve => { setTimeout(resolve, 0) })
      for (let turn = 0; turn < 6; turn += 1) await Promise.resolve()
    })
    expect(host.querySelector('.da-service-tab-name')?.textContent).toBe('/guide')

    await click(defined(host.querySelector<HTMLButtonElement>('.da-service-list-tab')))
    await click(defined(host.querySelector<HTMLButtonElement>('.da-service-row')))
    expect(host.querySelector('.da-service-tab-name')?.textContent).toBe('Guide')
  })

  it('uses the endpoint for a root page without a title and resets drafts with the session', async () => {
    stubNetwork({
      services: {
        ok: true,
        services: [
          { url: 'http://127.0.0.1:5173/', source: 'common' },
          { url: 'http://127.0.0.1:8000/', title: '', source: 'common' },
        ],
      },
    })
    await mount()
    const rows = [...host.querySelectorAll<HTMLButtonElement>('.da-service-row')]
    await click(defined(rows[0]))
    await reportPick('untitled root')
    expect(host.querySelector('.da-service-tab-name')?.textContent).toBe('127.0.0.1:5173')

    await click(defined(host.querySelector<HTMLButtonElement>('.da-service-list-tab')))
    await click(defined(rows[1]))
    expect([...host.querySelectorAll('.da-service-tab-name')].map(node => node.textContent))
      .toEqual(['127.0.0.1:5173', '127.0.0.1:8000'])

    await act(async () => {
      root.render(browser('s2'))
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(host.querySelectorAll('.da-service-tab')).toHaveLength(0)
    expect(defined(host.querySelector<HTMLElement>('.da-services')).hidden).toBe(false)
  })

  it('restores a live page draft after the service browser is remounted', async () => {
    stubNetwork({
      services: {
        ok: true,
        services: [{ url: 'http://127.0.0.1:5173/', title: 'Deck', source: 'common' }],
      },
    })
    await mount()
    await click(defined(host.querySelector<HTMLButtonElement>('.da-service-row')))
    await reportPick('persisted')
    act(() => { root.unmount() })
    host.remove()
    host = document.createElement('div')
    document.body.appendChild(host)
    root = createRoot(host)
    await mount()
    await click(defined(host.querySelector<HTMLButtonElement>('.da-service-row')))
    expect(host.querySelectorAll('[data-da-mark]')).toHaveLength(1)
  })

  it('keeps a page note beside marks and restores both together', async () => {
    stubNetwork({
      services: {
        ok: true,
        services: [{ url: 'http://127.0.0.1:5173/', title: 'Deck', source: 'common' }],
      },
    })
    await mount()
    await click(defined(host.querySelector<HTMLButtonElement>('.da-service-row')))
    await reportPick('noted')
    await act(async () => {
      ;[...host.querySelectorAll<HTMLButtonElement>('button')]
        .find(button => button.getAttribute('aria-label') === zh.summary
          || button.textContent === zh.summary)?.click()
      await Promise.resolve()
    })
    const note = defined(host.querySelector<HTMLTextAreaElement>('.da-float-goal textarea'))
    await type(note, 'page-level note')
    await act(async () => {
      await new Promise(resolve => { setTimeout(resolve, 300) })
    })

    act(() => { root.unmount() })
    host.remove()
    host = document.createElement('div')
    document.body.appendChild(host)
    root = createRoot(host)
    await mount()
    await click(defined(host.querySelector<HTMLButtonElement>('.da-service-row')))
    await act(async () => {
      ;[...host.querySelectorAll<HTMLButtonElement>('button')]
        .find(button => button.getAttribute('aria-label') === zh.summary
          || button.textContent === zh.summary)?.click()
      await Promise.resolve()
    })
    expect(host.querySelectorAll('[data-da-mark]')).toHaveLength(1)
    expect(host.querySelector<HTMLTextAreaElement>('.da-float-goal textarea')?.value)
      .toBe('page-level note')
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
