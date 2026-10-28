// @vitest-environment jsdom
/** The light the element picker shines on the element a click would take. */
import { afterEach, describe, expect, it } from 'vitest'
import {
  SPOTLIGHT_CLASS, SPOTLIGHT_SELECTED_CLASS, SPOT_RULE,
  elementAt, ensureSpotlight, lightMarkup, moveSpotlight, type LitSpot,
} from '../src/client/spotlight'
import { defined } from './dom'

/** One element, lit plainly. */
function spot(element: Element | null, selected = false): LitSpot {
  if (element === null) throw new Error('expected an element')
  return { element, selected }
}

/** A root holding one element under a name, the way a figure's document does. */
function rootHolding(markup: string): Element {
  const host = document.createElement('div')
  host.innerHTML = markup
  document.body.append(host)
  return host
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('finding the element an anchor names', () => {
  it('resolves a selector against the root it is given', () => {
    const root = rootHolding('<svg><g id="line2d_10"><path d="M 0 0 L 1 1" /></g></svg>')
    expect(elementAt({ root, selector: '#line2d_10' })?.tagName.toLowerCase()).toBe('g')
  })

  it('names nothing when the selector matches nothing', () => {
    // A figure reloaded since the anchor was taken: the picker still works, it just
    // has no element to light.
    const root = rootHolding('<svg><g id="other" /></svg>')
    expect(elementAt({ root, selector: '#line2d_10' })).toBeUndefined()
  })

  it('names nothing rather than throwing on a selector that does not parse', () => {
    // `querySelector` throws on a broken selector, and a pointer move may not throw.
    const root = rootHolding('<svg><g id="line2d_10" /></svg>')
    expect(elementAt({ root, selector: 'a>>b' })).toBeUndefined()
  })

  it('reads a positional path the way the anchor spells it', () => {
    const root = rootHolding('<svg><g /><g id="second"><path /></g></svg>')
    expect(elementAt({ root, selector: 'svg > g:nth-of-type(2)' })?.querySelector('path')).not.toBeNull()
  })
})

describe('keeping one element lit', () => {
  it('puts the class on the element it was handed', () => {
    const root = rootHolding('<svg><g id="a" /><g id="b" /></svg>')
    const a = root.querySelector('#a')
    moveSpotlight([], [spot(a)])
    expect(a?.classList.contains(SPOTLIGHT_CLASS)).toBe(true)
  })

  it('takes the class off the element lit before and puts it on the next', () => {
    const root = rootHolding('<svg><g id="a" /><g id="b" /></svg>')
    const a = root.querySelector('#a')
    const b = root.querySelector('#b')
    moveSpotlight([], [spot(a)])
    moveSpotlight([spot(a)], [spot(b)])
    // One element lit at a time is the picker's whole contract: two would say a click
    // could take either.
    expect(a?.classList.contains(SPOTLIGHT_CLASS)).toBe(false)
    expect(b?.classList.contains(SPOTLIGHT_CLASS)).toBe(true)
  })

  it('leaves the element alone when it is already the lit one', () => {
    const root = rootHolding('<svg><g id="a" /></svg>')
    const a = root.querySelector('#a')
    moveSpotlight([], [spot(a)])
    moveSpotlight([spot(a)], [spot(a)])
    expect(a?.classList.contains(SPOTLIGHT_CLASS)).toBe(true)
  })

  it('puts every light out when handed nothing', () => {
    const root = rootHolding('<svg><g id="a" /></svg>')
    const a = root.querySelector('#a')
    moveSpotlight([], [spot(a)])
    moveSpotlight([spot(a)], [])
    expect(a?.classList.contains(SPOTLIGHT_CLASS)).toBe(false)
  })

  it('puts the light on an element it was not told was lit', () => {
    // The pointer can arrive before anything was lit, and the class still has to land.
    const root = rootHolding('<svg><g id="a" /></svg>')
    const a = root.querySelector('#a')
    moveSpotlight([], [spot(a)])
    expect(root.querySelectorAll(`.${SPOTLIGHT_CLASS}`)).toHaveLength(1)
  })
})

describe('teaching a document the light', () => {
  it('writes the rule into the document it is given, once', () => {
    // A rendered document is its own document under a no-script policy, so the panel's
    // stylesheet cannot reach it: the rule has to be written where the elements are.
    const root = rootHolding('<div id="body"><p id="para">text</p></div>')
    const doc = root.ownerDocument
    ensureSpotlight(doc)
    ensureSpotlight(doc)
    const rules = doc.querySelectorAll('style[data-da-spot]')
    expect(rules).toHaveLength(1)
    expect(rules[0]?.textContent).toBe(SPOT_RULE)
  })

  it('names the class the rest of the module uses', () => {
    // The rule and the class are one thing spelled twice; a drift between them would
    // leave every lit element unlit with nothing to see.
    expect(SPOT_RULE.startsWith(`.${SPOTLIGHT_CLASS}{`)).toBe(true)
    expect(SPOT_RULE).toContain('drop-shadow')
  })

  it('still writes the rule into a document with no head', () => {
    // A document parsed from a fragment can have no head at all, and then the root is
    // the only place left to put it.
    const doc = document.implementation.createHTMLDocument('')
    doc.head.remove()
    ensureSpotlight(doc)
    expect(doc.documentElement.querySelector('style[data-da-spot]')).not.toBeNull()
  })
})

describe('lighting a placed mark', () => {
  it('lights the selected element harder rather than framing it', () => {
    const root = rootHolding('<svg><g id="a"><path d="M 0 0 L 1 1" /></g><g id="b"></g></svg>')
    const a = defined(root.querySelector('#a'))
    const b = defined(root.querySelector('#b'))
    const lit = moveSpotlight([], [spot(a), spot(b, true)])
    expect(a.classList.contains(SPOTLIGHT_CLASS)).toBe(true)
    expect(a.classList.contains(SPOTLIGHT_SELECTED_CLASS)).toBe(false)
    expect(b.classList.contains(SPOTLIGHT_SELECTED_CLASS)).toBe(true)
    // Selecting something else moves the weight, it does not pile classes up.
    moveSpotlight(lit, [spot(a, true), spot(b)])
    expect(a.classList.contains(SPOTLIGHT_SELECTED_CLASS)).toBe(true)
    expect(b.classList.contains(SPOTLIGHT_SELECTED_CLASS)).toBe(false)
  })

  it('keeps two elements lit at once', () => {
    // Two element marks on one figure: both stay lit, each is a statement about its own
    // element. One light at a time was the picker's rule, and it is not this one's.
    const root = rootHolding('<svg><g id="a"></g><g id="b"></g></svg>')
    const a = defined(root.querySelector('#a'))
    const b = defined(root.querySelector('#b'))
    moveSpotlight([], [spot(a), spot(b)])
    expect(a.classList.contains(SPOTLIGHT_CLASS)).toBe(true)
    expect(b.classList.contains(SPOTLIGHT_CLASS)).toBe(true)
  })
})

describe('lighting the element inside the delivered picture', () => {
  /** A figure with two named elements, as a matplotlib export has. */
  const figure = '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80">'
    + '<g id="line2d_1"><path d="M 10 60 L 110 20" stroke="#333" /></g>'
    + '<g id="line2d_2"><path d="M 10 20 L 110 60" stroke="#333" /></g></svg>'

  it('writes the rule and the class into the figure it is handed', () => {
    const lit = lightMarkup(figure, ['#line2d_2'])
    expect(lit).toContain('class="da-spot"')
    expect(lit).toContain('drop-shadow')
    // Only the element named, not its neighbour: the picture has to point at one thing.
    expect(lit.indexOf('class="da-spot"')).toBeGreaterThan(lit.indexOf('line2d_2'))
  })

  it('leaves the figure alone when nothing is lit', () => {
    // The export must not change a picture that has no element marks on it — a stray
    // stylesheet in every exported figure would be a diff a reader cannot explain.
    expect(lightMarkup(figure, [])).toBe(figure)
    expect(lightMarkup(figure, ['#not-here'])).toBe(figure)
    expect(lightMarkup('not svg at all', ['#a'])).toBe('not svg at all')
  })

  it('survives a selector that no longer parses', () => {
    // The figure may be a later version of the one the mark was placed on.
    expect(lightMarkup(figure, ['#line2d_1', 'a>>b'])).toContain('class="da-spot"')
  })
})
