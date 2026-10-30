/** The picker the page loads: what it says, and — mostly — what it does not. */
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'
import { PICKER_SCRIPT } from '../src/host/picker-script'
import { LIVE_MESSAGE } from '../src/shared/live'

/** One page with the picker running in it, and everything it has said. */
interface Page {
  readonly window: JSDOM['window']
  readonly said: Record<string, unknown>[]
  /** Post a mode message to the page, which is how the panel arms it. */
  arm(on: boolean): void
  /** Move the page's scroll offset, since jsdom has no layout to scroll. */
  scrollTo(x: number, y: number): void
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
})

describe('the page moving', () => {
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
