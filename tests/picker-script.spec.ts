/** The picker the page loads: what it says, and — mostly — what it does not. */
import { JSDOM } from 'jsdom'
import { describe, expect, it, vi } from 'vitest'
import { PICKER_SCRIPT } from '../src/host/picker-script'
import { LIVE_MESSAGE, MAX_LIVE_CAPTURE_DATA_URL } from '../src/shared/live'

/** One page with the picker running in it, and everything it has said. */
interface Page {
  readonly window: JSDOM['window']
  readonly said: Record<string, unknown>[]
  /** Post a mode message to the page, which is how the panel arms it. */
  arm(on: boolean): void
  /** Move the page's scroll offset, since jsdom has no layout to scroll. */
  scrollTo(x: number, y: number): void
  /** Send the panel's watch list into the page. */
  watch(selectors: readonly string[]): void
  /** Ask the picker to bring a saved mark into view. */
  reveal(request: {
    readonly requestId: string
    readonly selector: string | null
    readonly surface?: string | null
    readonly bbox?: readonly [number, number, number, number]
  }): void
  /** Ask the picker for a screenshot. */
  capture(requestId: string): void
}

/** A page with the picker loaded, in its own window. */
function live(html = '<main><h2 id="title">Head</h2><p class="lead">Some <em>text</em></p></main>'): Page {
  const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, {
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  })
  const window = dom.window
  const said: Record<string, unknown>[] = []
  Object.defineProperty(window, 'parent', {
    value: { postMessage: (message: Record<string, unknown>) => { said.push(message) } },
    configurable: true,
  })
  // jsdom lays nothing out and scrolls nothing; these are the two readings the picker
  // takes from the page itself.
  let left = 0
  let top = 0
  Object.defineProperty(window, 'scrollX', { get: () => left, configurable: true })
  Object.defineProperty(window, 'scrollY', { get: () => top, configurable: true })
  // One animation frame is one report, so the frame is the handler and not a timer.
  Object.defineProperty(window, 'requestAnimationFrame', {
    value: (handler: (time: number) => void) => { handler(0); return 1 },
    configurable: true,
  })
  window.eval(PICKER_SCRIPT)
  return {
    window,
    said,
    arm(on) {
      window.dispatchEvent(new window.MessageEvent('message', {
        data: { figmark: LIVE_MESSAGE, kind: 'mode', armed: on },
      }))
    },
    scrollTo(x, y) {
      left = x
      top = y
    },
    watch(selectors) {
      window.dispatchEvent(new window.MessageEvent('message', {
        data: { figmark: LIVE_MESSAGE, kind: 'watch', selectors },
      }))
    },
    reveal(request) {
      window.dispatchEvent(new window.MessageEvent('message', {
        data: {
          figmark: LIVE_MESSAGE,
          kind: 'reveal',
          bbox: [0, 0, 0, 0],
          surface: null,
          ...request,
        },
      }))
    },
    capture(requestId) {
      window.dispatchEvent(new window.MessageEvent('message', {
        data: { figmark: LIVE_MESSAGE, kind: 'capture', requestId },
      }))
    },
  }
}

/** The element under `selector` in a page. */
function at(window: JSDOM['window'], selector: string): Element {
  const element = window.document.querySelector(selector)
  if (element === null) throw new Error(`no ${selector}`)
  return element
}

/** Dispatch a bubbling event at an element, as a pointer would. */
function fire(window: JSDOM['window'], target: Element, type: string): Event {
  const event = new window.MouseEvent(type, { bubbles: true, cancelable: true })
  target.dispatchEvent(event)
  return event
}

describe('on load', () => {
  it('says it is ready, and where the page starts', () => {
    const { window, said } = live()
    expect(said).toEqual([{ figmark: LIVE_MESSAGE, kind: 'ready', scroll: [0, 0] }])
    expect(window.document.documentElement.getAttribute('data-dsh-figmark')).toBe('live')
  })

  it('marks the page but does not run twice over it', () => {
    const page = live()
    page.window.eval(PICKER_SCRIPT)
    expect(page.said.filter(told => told['kind'] === 'ready')).toHaveLength(1)
  })
})

describe('while annotation is not armed', () => {
  it('swallows no pointer, no click and no scroll', () => {
    const page = live()
    const paragraph = at(page.window, 'p')
    fire(page.window, paragraph, 'pointermove')
    const click = fire(page.window, paragraph, 'click')
    page.scrollTo(0, 10)
    fire(page.window, page.window.document.documentElement, 'scroll')
    expect(click.defaultPrevented).toBe(false)
    // Where the page is stays public: a mark placed before annotation was armed still
    // has to move when the reader scrolls, exactly as the page under it moves.
    expect(page.said.map(told => told['kind'])).toEqual(['ready', 'scroll'])
    expect(page.said.filter(told => told['kind'] === 'scroll')).toEqual([
      { figmark: LIVE_MESSAGE, kind: 'scroll', scroll: [0, 10] },
    ])
  })
})

describe('while annotation is armed', () => {
  it('names the element under the pointer, with the path a mark stores', () => {
    const page = live()
    page.arm(true)
    page.scrollTo(0, 120)
    fire(page.window, at(page.window, 'em'), 'pointermove')
    const hover = page.said.find(told => told['kind'] === 'hover')
    expect(hover).toEqual({
      figmark: LIVE_MESSAGE,
      kind: 'hover',
      tag: 'em',
      selector: 'main:nth-of-type(1) > p:nth-of-type(1) > em:nth-of-type(1)',
      bbox: [0, 120, 0, 0],
      scroll: [0, 120],
      text: 'text',
      level: 1,
      count: 4,
    })
  })

  it('reports the id and the class it read, and nothing it invented', () => {
    const page = live()
    page.arm(true)
    fire(page.window, at(page.window, 'h2'), 'pointermove')
    const hover = page.said.find(told => told['kind'] === 'hover')
    expect(hover?.['id']).toBe('title')
    expect(hover?.['tag']).toBe('h2')
    expect(hover).not.toHaveProperty('class')
  })

  it('keeps one report per frame, not one per pixel', () => {
    const page = live()
    page.arm(true)
    const paragraph = at(page.window, 'p')
    fire(page.window, paragraph, 'pointermove')
    fire(page.window, paragraph, 'pointermove')
    fire(page.window, paragraph, 'pointermove')
    expect(page.said.filter(told => told['kind'] === 'hover')).toHaveLength(1)
  })

  it('takes a click instead of following it, and names what was clicked', () => {
    const page = live()
    page.arm(true)
    const click = fire(page.window, at(page.window, 'em'), 'click')
    expect(click.defaultPrevented).toBe(true)
    expect(page.said.find(told => told['kind'] === 'pick')).toMatchObject({
      kind: 'pick',
      tag: 'em',
      selector: 'main:nth-of-type(1) > p:nth-of-type(1) > em:nth-of-type(1)',
    })
  })

  it('reports the slide that owns a pick, and no slide for a cover outside them', () => {
    const page = live(
      '<section class="dk-slide is-live"><p id="inside">Inside</p></section>'
      + '<div id="cover"><h1 id="cover-title">Cover</h1></div>',
    )
    page.arm(true)
    fire(page.window, at(page.window, '#inside'), 'click')
    expect(page.said.filter(told => told['kind'] === 'pick').at(-1)).toMatchObject({
      selector: 'section:nth-of-type(1) > p:nth-of-type(1)',
      surface: 'section:nth-of-type(1)',
    })
    fire(page.window, at(page.window, '#cover-title'), 'click')
    expect(page.said.filter(told => told['kind'] === 'pick').at(-1)).toMatchObject({
      selector: 'div:nth-of-type(1) > h1:nth-of-type(1)',
      surface: null,
    })
  })

  it('reports Escape even when no element is currently under the pointer', () => {
    const page = live()
    page.arm(true)
    const escape = new page.window.KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    })
    page.window.document.dispatchEvent(escape)
    expect(escape.defaultPrevented).toBe(true)
    expect(page.said.filter(told => told['kind'] === 'cancel')).toHaveLength(1)
  })

  it('says so when the pointer leaves the page, so the name can go with it', () => {
    const page = live()
    page.arm(true)
    fire(page.window, page.window.document.documentElement, 'pointerleave')
    expect(page.said.filter(told => told['kind'] === 'leave')).toHaveLength(1)
  })

  it('stops taking clicks the moment it is disarmed', () => {
    const page = live()
    page.arm(true)
    page.arm(false)
    const click = fire(page.window, at(page.window, 'p'), 'click')
    expect(click.defaultPrevented).toBe(false)
    expect(page.said.filter(told => told['kind'] === 'pick')).toHaveLength(0)
  })

  it('climbs the ancestor ladder with the arrows and picks the chosen rung', () => {
    const page = live()
    page.arm(true)
    fire(page.window, at(page.window, 'em'), 'pointermove')
    page.window.document.dispatchEvent(new page.window.KeyboardEvent('keydown', {
      key: 'ArrowUp', bubbles: true, cancelable: true,
    }))
    expect(page.said.filter(told => told['kind'] === 'hover').at(-1)).toMatchObject({
      kind: 'hover',
      tag: 'p',
      level: 2,
      count: 4,
    })
    fire(page.window, at(page.window, 'em'), 'click')
    expect(page.said.filter(told => told['kind'] === 'pick').at(-1)).toMatchObject({
      kind: 'pick',
      tag: 'p',
      level: 2,
    })
  })

  it('climbs the same ladder when the panel forwards a keyboard step', () => {
    const page = live()
    page.arm(true)
    fire(page.window, at(page.window, 'em'), 'pointermove')
    page.window.dispatchEvent(new page.window.MessageEvent('message', {
      data: { figmark: LIVE_MESSAGE, kind: 'depth', delta: 1 },
    }))
    expect(page.said.filter(told => told['kind'] === 'hover').at(-1)).toMatchObject({
      kind: 'hover',
      tag: 'p',
      level: 2,
      count: 4,
    })
  })

  it('reports Escape so the panel can dismiss the comment layer', () => {
    const page = live()
    page.arm(true)
    fire(page.window, at(page.window, 'p'), 'pointermove')
    page.window.document.dispatchEvent(new page.window.KeyboardEvent('keydown', {
      key: 'Escape', bubbles: true, cancelable: true,
    }))
    expect(page.said.filter(told => told['kind'] === 'cancel')).toHaveLength(1)
  })
})

describe('the page moving', () => {
  it('reports the visible slide, then none when the deck has no current page', () => {
    const page = live(
      '<section class="slide current" id="one" style="opacity: 1"></section>'
      + '<section class="slide" id="two" style="opacity: 0"></section>',
    )
    const one = at(page.window, '#one')
    const two = at(page.window, '#two')
    const visible = (): DOMRect => ({
      x: 0, y: 0, width: 640, height: 360, top: 0, right: 640, bottom: 360, left: 0,
      toJSON: () => ({}),
    })
    Object.defineProperty(one, 'getBoundingClientRect', { configurable: true, value: visible })
    Object.defineProperty(two, 'getBoundingClientRect', { configurable: true, value: visible })
    page.window.dispatchEvent(new page.window.Event('resize'))
    expect(page.said.filter(told => told['kind'] === 'surface').at(-1)).toEqual({
      figmark: LIVE_MESSAGE,
      kind: 'surface',
      selector: 'section:nth-of-type(1)',
    })
    one.classList.remove('current')
    two.classList.add('current')
    one.setAttribute('style', 'opacity: 0')
    two.setAttribute('style', 'opacity: 1')
    page.window.dispatchEvent(new page.window.Event('resize'))
    expect(page.said.filter(told => told['kind'] === 'surface').at(-1)).toMatchObject({
      selector: 'section:nth-of-type(2)',
    })
    two.classList.remove('current')
    two.setAttribute('style', 'opacity: 0')
    page.window.dispatchEvent(new page.window.Event('resize'))
    expect(page.said.filter(told => told['kind'] === 'surface').at(-1)).toEqual({
      figmark: LIVE_MESSAGE,
      kind: 'surface',
      selector: null,
    })
  })

  it('recognises the slide a mounted deck brings forward', () => {
    const page = live(
      '<section class="dk-slide is-live" id="one"></section>'
      + '<section class="dk-slide" id="two" style="opacity: 0"></section>',
    )
    const visible = (): DOMRect => ({
      x: 0, y: 0, width: 640, height: 360, top: 0, right: 640, bottom: 360, left: 0,
      toJSON: () => ({}),
    })
    Object.defineProperty(at(page.window, '#one'), 'getBoundingClientRect', {
      configurable: true,
      value: visible,
    })
    Object.defineProperty(at(page.window, '#two'), 'getBoundingClientRect', {
      configurable: true,
      value: visible,
    })
    page.window.dispatchEvent(new page.window.Event('resize'))
    expect(page.said.filter(told => told['kind'] === 'surface').at(-1)).toMatchObject({
      selector: 'section:nth-of-type(1)',
    })
  })

  it('leaves a saved element that is already visible exactly where it is', async () => {
    const page = live()
    const title = at(page.window, '#title')
    let scrolled = 0
    Object.defineProperty(title, 'scrollIntoView', {
      configurable: true,
      value: () => { scrolled += 1 },
    })
    Object.defineProperty(title, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        x: 10, y: 20, width: 100, height: 30, top: 20, right: 110, bottom: 50, left: 10,
        toJSON: () => ({}),
      }),
    })
    page.reveal({ requestId: 'r1', selector: '#title' })
    await new Promise(resolve => { setTimeout(resolve, 20) })
    expect(scrolled).toBe(0)
    expect(page.said.find(told => told['kind'] === 'reveal-result')).toEqual({
      figmark: LIVE_MESSAGE,
      kind: 'reveal-result',
      requestId: 'r1',
      status: 'revealed',
      surface: null,
    })
  })

  it('scrolls an offscreen element before confirming that it can be seen', async () => {
    const page = live()
    const title = at(page.window, '#title')
    let visible = false
    Object.defineProperty(title, 'scrollIntoView', {
      configurable: true,
      value: () => { visible = true },
    })
    Object.defineProperty(title, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        x: visible ? 10 : 1200,
        y: 20,
        width: 100,
        height: 30,
        top: 20,
        right: visible ? 110 : 1300,
        bottom: 50,
        left: visible ? 10 : 1200,
        toJSON: () => ({}),
      }),
    })
    page.reveal({ requestId: 'offscreen', selector: '#title' })
    await vi.waitFor(() => {
      expect(page.said.find(told =>
        told['kind'] === 'reveal-result' && told['requestId'] === 'offscreen'))
        .toMatchObject({ status: 'revealed' })
    }, { timeout: 5000, interval: 50 })
    expect(visible).toBe(true)
  })

  it('finds the slide that owns an element when an older mark stored no surface', async () => {
    const page = live(
      '<section class="dk-slide is-live" id="one" style="opacity: 1"><h2>One</h2></section>'
      + '<section class="dk-slide" id="two" style="opacity: 0"><p id="target">Two</p></section>',
    )
    const visible = (): DOMRect => ({
      x: 10, y: 20, width: 100, height: 30, top: 20, right: 110, bottom: 50, left: 10,
      toJSON: () => ({}),
    })
    const one = at(page.window, '#one')
    const two = at(page.window, '#two')
    const target = at(page.window, '#target')
    for (const element of [one, two, target]) {
      Object.defineProperty(element, 'getBoundingClientRect', {
        configurable: true,
        value: visible,
      })
    }
    let scrolled = 0
    Object.defineProperty(target, 'scrollIntoView', {
      configurable: true,
      value: () => { scrolled += 1 },
    })
    page.window.addEventListener('keydown', event => {
      if (event.key !== 'ArrowRight') return
      one.classList.remove('is-live')
      one.setAttribute('style', 'opacity: 0')
      two.classList.add('is-live')
      two.setAttribute('style', 'opacity: 1')
    })
    page.reveal({ requestId: 'legacy', selector: '#target' })
    await vi.waitFor(() => {
      expect(page.said.find(told =>
        told['kind'] === 'reveal-result' && told['requestId'] === 'legacy'))
        .toMatchObject({ status: 'revealed' })
    })
    expect(scrolled).toBe(0)
  })

  it('follows the element instead of a stale surface recorded with the mark', async () => {
    const page = live(
      '<section class="dk-slide is-live" id="one" style="opacity: 1"><h2>One</h2></section>'
      + '<section class="dk-slide" id="two" style="opacity: 0"><p id="target">Two</p></section>',
    )
    const visible = (): DOMRect => ({
      x: 10, y: 20, width: 100, height: 30, top: 20, right: 110, bottom: 50, left: 10,
      toJSON: () => ({}),
    })
    const one = at(page.window, '#one')
    const two = at(page.window, '#two')
    const target = at(page.window, '#target')
    for (const element of [one, two, target]) {
      Object.defineProperty(element, 'getBoundingClientRect', {
        configurable: true,
        value: visible,
      })
    }
    Object.defineProperty(target, 'scrollIntoView', { configurable: true, value: () => {} })
    page.window.addEventListener('keydown', event => {
      if (event.key !== 'ArrowRight') return
      one.classList.remove('is-live')
      one.setAttribute('style', 'opacity: 0')
      two.classList.add('is-live')
      two.setAttribute('style', 'opacity: 1')
    })
    page.reveal({
      requestId: 'stale-surface',
      selector: '#target',
      surface: 'section:nth-of-type(1)',
    })
    await vi.waitFor(() => {
      expect(page.said.find(told =>
        told['kind'] === 'reveal-result' && told['requestId'] === 'stale-surface'))
        .toMatchObject({ status: 'revealed' })
    })
    expect(two.classList.contains('is-live')).toBe(true)
  })

  it('restores a hidden overlay outside every slide and restores it on release', async () => {
    const page = live(
      '<style>#overlay { display: none; content-visibility: hidden; opacity: 0; visibility: hidden }</style>'
      + '<div id="overlay"><h1 id="cover">Cover</h1></div>'
      + '<section class="dk-slide" id="one" style="opacity: 0"><h2>One</h2></section>'
      + '<section class="dk-slide is-live" id="two" style="opacity: 1"><h2>Two</h2></section>',
    )
    const visible = (): DOMRect => ({
      x: 10, y: 20, width: 100, height: 30, top: 20, right: 110, bottom: 50, left: 10,
      toJSON: () => ({}),
    })
    const one = at(page.window, '#one')
    const two = at(page.window, '#two')
    const cover = at(page.window, '#cover')
    const overlay = at(page.window, '#overlay') as HTMLElement
    Object.defineProperty(cover, 'scrollIntoView', { configurable: true, value: () => {} })
    for (const element of [one, two, cover, overlay]) {
      Object.defineProperty(element, 'getBoundingClientRect', {
        configurable: true,
        value: visible,
      })
    }
    page.window.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft') return
      two.classList.remove('is-live')
      two.setAttribute('style', 'opacity: 0')
      one.classList.add('is-live')
      one.setAttribute('style', 'opacity: 1')
    })
    page.reveal({ requestId: 'cover', selector: '#cover' })
    await vi.waitFor(() => {
      expect(page.said.find(told => told['kind'] === 'reveal-result' && told['requestId'] === 'cover'))
        .toMatchObject({ status: 'revealed', temporary: true })
    }, { timeout: 5000, interval: 50 })
    expect(one.classList.contains('is-live')).toBe(true)
    expect(overlay.style.opacity).toBe('1')
    expect(overlay.style.visibility).toBe('visible')
    expect(overlay.style.display).toBe('revert')
    expect(overlay.style.getPropertyValue('content-visibility')).toBe('visible')
    expect(overlay.style.pointerEvents).toBe('none')
    page.window.postMessage({ figmark: LIVE_MESSAGE, kind: 'release-reveal' }, '*')
    await vi.waitFor(() => {
      expect(overlay.style.opacity).toBe('')
      expect(overlay.style.visibility).toBe('')
      expect(overlay.style.display).toBe('')
      expect(overlay.style.getPropertyValue('content-visibility')).toBe('')
      expect(overlay.style.pointerEvents).toBe('')
    })
  })

  it('refuses to claim an element was revealed when it remains outside the viewport', async () => {
    const page = live()
    const title = at(page.window, '#title')
    Object.defineProperty(title, 'scrollIntoView', { configurable: true, value: () => {} })
    Object.defineProperty(title, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        x: 1200, y: 20, width: 100, height: 30, top: 20, right: 1300, bottom: 50, left: 1200,
        toJSON: () => ({}),
      }),
    })
    page.reveal({ requestId: 'offscreen', selector: '#title' })
    await vi.waitFor(() => {
      expect(page.said.find(told =>
        told['kind'] === 'reveal-result' && told['requestId'] === 'offscreen'))
        .toMatchObject({ status: 'hidden' })
    }, { timeout: 5000, interval: 50 })
  })

  it('waits for a page entrance animation before confirming the element is there', async () => {
    const page = live('<main><h2 id="title" style="opacity: 0">Head</h2></main>')
    const title = at(page.window, '#title')
    Object.defineProperty(title, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        x: 10, y: 20, width: 100, height: 30, top: 20, right: 110, bottom: 50, left: 10,
        toJSON: () => ({}),
      }),
    })
    Object.defineProperty(title, 'scrollIntoView', { configurable: true, value: () => {} })
    page.window.setTimeout(() => { title.setAttribute('style', 'opacity: 1') }, 70)
    page.reveal({ requestId: 'animated', selector: '#title' })
    await new Promise(resolve => { setTimeout(resolve, 180) })
    expect(page.said.find(told => told['kind'] === 'reveal-result' && told['requestId'] === 'animated'))
      .toMatchObject({ status: 'revealed' })
  })

  it('distinguishes a missing selector from a surface that cannot be reached', async () => {
    const page = live()
    page.reveal({ requestId: 'missing', selector: '#not-there' })
    await new Promise(resolve => { setTimeout(resolve, 0) })
    expect(page.said.find(told => told['kind'] === 'reveal-result' && told['requestId'] === 'missing'))
      .toMatchObject({ status: 'missing' })
    page.reveal({ requestId: 'surface', selector: '#title', surface: '#not-a-slide' })
    expect(page.said.find(told => told['kind'] === 'reveal-result' && told['requestId'] === 'surface'))
      .toMatchObject({ status: 'wrong-surface' })
  })

  it('reports a scroll once, and again only when it has actually moved', () => {
    const page = live()
    const target = page.window.document.documentElement
    page.scrollTo(0, 40)
    fire(page.window, target, 'scroll')
    fire(page.window, target, 'scroll')
    const scrolls = page.said.filter(told => told['kind'] === 'scroll')
    expect(scrolls).toEqual([{ figmark: LIVE_MESSAGE, kind: 'scroll', scroll: [0, 40] }])
    page.scrollTo(0, 80)
    fire(page.window, target, 'scroll')
    expect(page.said.filter(told => told['kind'] === 'scroll')).toHaveLength(2)
  })

  it('reports a resize as a scroll, since a resize can move everything', () => {
    const page = live()
    page.scrollTo(5, 6)
    page.window.dispatchEvent(new page.window.Event('resize'))
    expect(page.said.find(told => told['kind'] === 'scroll')).toEqual({
      figmark: LIVE_MESSAGE, kind: 'scroll', scroll: [5, 6],
    })
  })

  it('ignores a message that is not the panel arming it', () => {
    const page = live()
    page.window.dispatchEvent(new page.window.MessageEvent('message', { data: 'a string' }))
    page.window.dispatchEvent(new page.window.MessageEvent('message', { data: { figmark: 'other', kind: 'mode', armed: true } }))
    page.window.dispatchEvent(new page.window.MessageEvent('message', {
      data: { figmark: LIVE_MESSAGE, kind: 'something', armed: true },
    }))
    fire(page.window, at(page.window, 'p'), 'click')
    expect(page.said.map(told => told['kind'])).toEqual(['ready'])
  })

  it('watches saved selectors and reports their live boxes', () => {
    const page = live()
    Object.defineProperty(at(page.window, '#title'), 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        x: 10, y: 20, width: 100, height: 30, top: 20, right: 110, bottom: 50, left: 10,
        toJSON: () => ({}),
      }),
    })
    page.watch(['#title', '[data-missing]', '#title'])
    const bounds = page.said.find(told => told['kind'] === 'bounds')
    expect(bounds).toEqual({
      figmark: LIVE_MESSAGE,
      kind: 'bounds',
      bounds: [
        { selector: '#title', bbox: [10, 20, 100, 30], visible: true },
        { selector: '[data-missing]', bbox: [0, 0, 0, 0], visible: false },
      ],
    })
  })

  it('does not report an element on a slide its ancestor has faded out', () => {
    const page = live(
      '<section id="front"><h2 id="title">Head</h2></section>'
      + '<section id="back" style="opacity: 0"><p id="old">Old</p></section>',
    )
    const visible = (): DOMRect => ({
      x: 10, y: 20, width: 100, height: 30, top: 20, right: 110, bottom: 50, left: 10,
      toJSON: () => ({}),
    })
    Object.defineProperty(at(page.window, '#title'), 'getBoundingClientRect', {
      configurable: true,
      value: visible,
    })
    Object.defineProperty(at(page.window, '#old'), 'getBoundingClientRect', {
      configurable: true,
      value: visible,
    })
    page.watch(['#title', '#old'])
    expect(page.said.find(told => told['kind'] === 'bounds')).toMatchObject({
      bounds: [
        { selector: '#title', visible: true },
        { selector: '#old', visible: false },
      ],
    })
  })
})

describe('screenshotting the live page', () => {
  it('answers with the whole document, the viewport, scroll and live boxes', async () => {
    const page = live('<main><h2 id="title">Head</h2></main>')
    Object.defineProperty(page.window, 'innerWidth', { configurable: true, value: 640 })
    Object.defineProperty(page.window, 'innerHeight', { configurable: true, value: 360 })
    const root = page.window.document.documentElement
    Object.defineProperty(root, 'scrollWidth', { configurable: true, value: 1280 })
    Object.defineProperty(root, 'scrollHeight', { configurable: true, value: 1800 })
    Object.defineProperty(at(page.window, '#title'), 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        x: 10, y: 40, width: 100, height: 30, top: 40, right: 110, bottom: 70, left: 10,
        toJSON: () => ({}),
      }),
    })
    page.watch(['#title'])
    page.scrollTo(12, 340)
    const domToDataUrl = vi.fn(async (
      _root: Element,
      _options: Record<string, unknown>,
    ) => 'data:image/png;base64,AAAA')
    const shot = { domToDataUrl }
    Object.defineProperty(page.window, 'modernScreenshot', {
      configurable: true,
      value: shot,
    })
    page.capture('c1')
    await vi.waitFor(() => {
      expect(page.said.some(message => message['kind'] === 'capture-result')).toBe(true)
    })
    expect(domToDataUrl).toHaveBeenCalledTimes(1)
    const options = domToDataUrl.mock.calls[0]?.[1] ?? {}
    const filter = options['filter'] as (node: Node) => boolean
    expect(options).toMatchObject({ width: 1280, height: 1800, scale: 1 })
    const pickerStyle = page.window.document.createElement('style')
    pickerStyle.setAttribute('data-dsh-figmark-style', '')
    const spotlight = page.window.document.createElement('style')
    spotlight.setAttribute('data-da-spot', '')
    expect(filter(pickerStyle)).toBe(false)
    expect(filter(spotlight)).toBe(false)
    expect(filter(page.window.document.createTextNode('text'))).toBe(true)
    expect(page.said.find(message => message['kind'] === 'capture-result')).toEqual({
      figmark: LIVE_MESSAGE,
      kind: 'capture-result',
      requestId: 'c1',
      status: 'ok',
      dataUrl: 'data:image/png;base64,AAAA',
      document: [1280, 1800],
      imageRect: [0, 0, 1280, 1800],
      viewport: [640, 360],
      scroll: [12, 340],
      scale: 1,
      surface: null,
      bounds: [{ selector: '#title', bbox: [22, 380, 100, 30], visible: true }],
    })
  })

  it.each([false, true])('captures the front surface at layout size (scaled: %s)', async scaled => {
    const page = live('<section class="slide" id="front"><h2 id="title">Head</h2></section>')
    Object.defineProperty(page.window, 'innerWidth', { configurable: true, value: 800 })
    Object.defineProperty(page.window, 'innerHeight', { configurable: true, value: 600 })
    const root = page.window.document.documentElement
    Object.defineProperty(root, 'scrollWidth', { configurable: true, value: 1200 })
    Object.defineProperty(root, 'scrollHeight', { configurable: true, value: 900 })
    const surface = at(page.window, '#front')
    Object.defineProperty(surface, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        x: 20, y: 30, width: 400, height: 300, top: 30, right: 420, bottom: 330, left: 20,
        toJSON: () => ({}),
      }),
    })
    Object.defineProperty(surface, 'offsetWidth', { value: scaled ? 1920 : 0 })
    Object.defineProperty(surface, 'offsetHeight', { value: scaled ? 1080 : 0 })
    page.scrollTo(5, 7)
    const domToDataUrl = vi.fn(async (
      _root: Element,
      _options: Record<string, unknown>,
    ) => 'data:image/png;base64,AAAA')
    Object.defineProperty(page.window, 'modernScreenshot', {
      configurable: true,
      value: { domToDataUrl },
    })
    page.capture('surface')
    await vi.waitFor(() => {
      expect(page.said.some(message => message['kind'] === 'capture-result')).toBe(true)
    })
    expect(domToDataUrl.mock.calls[0]?.[0]).toBe(surface)
    expect(domToDataUrl.mock.calls[0]?.[1]).toMatchObject({ width: scaled ? 1920 : 400, height: scaled ? 1080 : 300, scale: scaled ? 1800 / 1920 : 1.5, style: { transform: 'none', zoom: '1' } })
    expect(page.said.find(message => message['kind'] === 'capture-result')).toMatchObject({
      document: [1200, 900],
      imageRect: [25, 37, 400, 300],
      surface: 'section:nth-of-type(1)',
    })
  })

  it('fails locally instead of posting a screenshot the panel must discard', async () => {
    const page = live()
    Object.defineProperty(page.window, 'modernScreenshot', {
      configurable: true,
      value: {
        domToDataUrl: vi.fn(async () => `data:image/png;base64,${'A'.repeat(MAX_LIVE_CAPTURE_DATA_URL)}`),
      },
    })
    page.capture('too-large')
    await vi.waitFor(() => {
      expect(page.said.find(message => message['kind'] === 'capture-result')).toEqual({
        figmark: LIVE_MESSAGE,
        kind: 'capture-result',
        requestId: 'too-large',
        status: 'failed',
        reason: 'the screenshot is too large',
      })
    })
  })

  it('reports a failed render without claiming a picture', async () => {
    const page = live()
    Object.defineProperty(page.window, 'modernScreenshot', {
      configurable: true,
      value: {
        domToDataUrl: vi.fn(async () => { throw new Error('canvas refused') }),
      },
    })
    page.capture('c2')
    await vi.waitFor(() => {
      expect(page.said.find(message => message['kind'] === 'capture-result')).toEqual({
        figmark: LIVE_MESSAGE,
        kind: 'capture-result',
        requestId: 'c2',
        status: 'failed',
        reason: 'canvas refused',
      })
    })
  })

  it('reports a missing renderer, and ignores a request with no usable id', () => {
    const page = live()
    Object.defineProperty(page.window, 'modernScreenshot', {
      configurable: true,
      value: undefined,
    })
    page.capture('c3')
    expect(page.said.find(message => message['kind'] === 'capture-result')).toEqual({
      figmark: LIVE_MESSAGE,
      kind: 'capture-result',
      requestId: 'c3',
      status: 'failed',
      reason: 'the screenshot renderer is unavailable',
    })
    page.window.dispatchEvent(new page.window.MessageEvent('message', {
      data: { figmark: LIVE_MESSAGE, kind: 'capture', requestId: '' },
    }))
    expect(page.said.filter(message => message['kind'] === 'capture-result')).toHaveLength(1)
  })
})

describe('the document element', () => {
  it('is never itself the thing under the pointer', () => {
    const page = live()
    page.arm(true)
    fire(page.window, page.window.document.documentElement, 'pointermove')
    expect(page.said.filter(told => told['kind'] === 'hover')).toHaveLength(0)
    fire(page.window, page.window.document.documentElement, 'click')
    expect(page.said.filter(told => told['kind'] === 'pick')).toHaveLength(0)
  })

  it('is the only element a body-level pick can be named as', () => {
    const page = live('<section>bare</section>')
    page.arm(true)
    fire(page.window, at(page.window, 'section'), 'click')
    expect(page.said.find(told => told['kind'] === 'pick')).toMatchObject({
      selector: 'section:nth-of-type(1)',
    })
  })
})
