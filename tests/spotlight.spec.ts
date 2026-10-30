// @vitest-environment jsdom
/** The light the element picker shines on the element a click would take. */
import { afterEach, describe, expect, it } from 'vitest'
import {
  SPOTLIGHT_CLASS, SPOTLIGHT_SELECTED_CLASS,
  elementAt, ensureSpotlight, lightMarkup, moveSpotlight, spotRule, type LitSpot,
} from '../src/client/spotlight'
import { defined } from './dom'

/** One element, lit in a colour. */
function spot(element: Element | null, colour = '#e03131', selected = false): LitSpot {
  if (element === null) throw new Error('expected an element')
  return { element, colour, selected }
}

/** A root holding one element under a name, the way a figure's document does. */
function rootHolding(markup: string): Element {
  const host = document.createElement('div')
  host.innerHTML = markup
  document.body.append(host)
  return host
}

/** The rules the panel's own document has been taught, as text. */
function written(): string {
  return document.querySelector('style[data-da-spot]')?.textContent ?? ''
}

afterEach(() => {
  document.body.innerHTML = ''
  // The rules live in the head and are written once per colour, so a test that leaves
  // them behind would hand the next one a document that already knows its colours.
  for (const style of document.querySelectorAll('style[data-da-spot]')) style.remove()
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

  it('takes the colour off with the light, so a later element does not inherit it', () => {
    // The attribute and the rule are a pair: a colour left behind on an unlit element
    // would come back the next time something lit it in another colour.
    const root = rootHolding('<svg><g id="a" /></svg>')
    const a = root.querySelector('#a')
    moveSpotlight([], [spot(a, '#e03131')])
    moveSpotlight([spot(a)], [])
    expect(a?.getAttribute('data-da-spot-color')).toBeNull()
  })

  it('puts the light on an element it was not told was lit', () => {
    // The pointer can arrive before anything was lit, and the class still has to land.
    const root = rootHolding('<svg><g id="a" /></svg>')
    const a = root.querySelector('#a')
    moveSpotlight([], [spot(a)])
    expect(root.querySelectorAll(`.${SPOTLIGHT_CLASS}`)).toHaveLength(1)
  })
})

describe('lighting in the mark\'s colour', () => {
  it('rides the colour on the element and writes a rule for it', () => {
    // The colour is not inlined into a `style` attribute: that attribute may be the
    // figure author's, and a rule keyed on a `data-` attribute cannot collide with it.
    const root = rootHolding('<svg><g id="a" /></svg>')
    const a = defined(root.querySelector('#a'))
    moveSpotlight([], [spot(a, '#1971c2')])
    expect(a.getAttribute('data-da-spot-color')).toBe('1971c2')
    expect(written()).toContain('.da-spot[data-da-spot-color="1971c2"]')
    expect(written()).toContain('rgba(25,113,194,.95)')
  })

  it('lights the selected mark in the same colour, only harder', () => {
    const root = rootHolding('<svg><g id="a" /></svg>')
    const a = defined(root.querySelector('#a'))
    moveSpotlight([], [spot(a, '#e03131', true)])
    expect(a.classList.contains(SPOTLIGHT_SELECTED_CLASS)).toBe(true)
    expect(written()).toContain('.da-spot.da-spot-selected[data-da-spot-color="e03131"]')
    expect(written()).toContain('rgba(224,49,49,1)')
  })

  it('adds a colour to the sheet rather than rewriting it', () => {
    // The pointer moves between marks of different colours all the time; a sheet
    // rewritten on every move is a rule the browser re-parses and repaints for nothing.
    const root = rootHolding('<svg><g id="a" /><g id="b" /></svg>')
    const a = defined(root.querySelector('#a'))
    const b = defined(root.querySelector('#b'))
    moveSpotlight([], [spot(a, '#e03131')])
    moveSpotlight([], [spot(b, '#2f9e44')])
    expect(document.querySelectorAll('style[data-da-spot]')).toHaveLength(1)
    expect(written()).toContain('e03131')
    expect(written()).toContain('2f9e44')
    const before = written()
    moveSpotlight([], [spot(b, '#2f9e44')])
    expect(written()).toBe(before)
  })

  it('falls back to ink when the colour cannot be read', () => {
    // A mark written by an older version, or by hand, may carry anything at all in its
    // colour field. A hue the panel invented would put a colour into the figure that
    // the reader never chose, so the fallback is a colourless halo.
    const root = rootHolding('<svg><g id="a" /></svg>')
    const a = defined(root.querySelector('#a'))
    moveSpotlight([], [spot(a, 'chartreuse')])
    expect(a.classList.contains(SPOTLIGHT_CLASS)).toBe(true)
    expect(a.getAttribute('data-da-spot-color')).toBeNull()
    expect(written()).toBe(spotRule([]))
    expect(spotRule(['chartreuse', '#12345'])).toBe(spotRule([]))
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
    expect(rules[0]?.textContent).toBe(spotRule([]))
  })

  it('names the class the rest of the module uses', () => {
    // The rule and the class are one thing spelled twice; a drift between them would
    // leave every lit element unlit with nothing to see.
    expect(spotRule([]).startsWith(`.${SPOTLIGHT_CLASS}{`)).toBe(true)
    expect(spotRule([])).toContain('drop-shadow')
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
    const lit = moveSpotlight([], [spot(a), spot(b, '#e03131', true)])
    expect(a.classList.contains(SPOTLIGHT_CLASS)).toBe(true)
    expect(a.classList.contains(SPOTLIGHT_SELECTED_CLASS)).toBe(false)
    expect(b.classList.contains(SPOTLIGHT_SELECTED_CLASS)).toBe(true)
    // Selecting something else moves the weight, it does not pile classes up.
    moveSpotlight(lit, [spot(a, '#e03131', true), spot(b)])
    expect(a.classList.contains(SPOTLIGHT_SELECTED_CLASS)).toBe(true)
    expect(b.classList.contains(SPOTLIGHT_SELECTED_CLASS)).toBe(false)
  })

  it('keeps two elements lit at once', () => {
    // Two element marks on one figure: both stay lit, each is a statement about its own
    // element. One light at a time was the picker's rule, and it is not this one's.
    const root = rootHolding('<svg><g id="a"></g><g id="b"></g></svg>')
    const a = defined(root.querySelector('#a'))
    const b = defined(root.querySelector('#b'))
    moveSpotlight([], [spot(a), spot(b, '#1971c2')])
    expect(a.classList.contains(SPOTLIGHT_CLASS)).toBe(true)
    expect(b.classList.contains(SPOTLIGHT_CLASS)).toBe(true)
    // Each carries its own colour, which is what the rules are keyed on.
    expect(a.getAttribute('data-da-spot-color')).toBe('e03131')
    expect(b.getAttribute('data-da-spot-color')).toBe('1971c2')
  })
})

describe('lighting the element inside the delivered picture', () => {
  /** A figure with two named elements, as a matplotlib export has. */
  const figure = '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80">'
    + '<g id="line2d_1"><path d="M 10 60 L 110 20" stroke="#333" /></g>'
    + '<g id="line2d_2"><path d="M 10 20 L 110 60" stroke="#333" /></g></svg>'

  it('writes the rule and the class into the figure it is handed', () => {
    const lit = lightMarkup(figure, [{ selector: '#line2d_2', colour: '#e03131' }])
    expect(lit).toContain('class="da-spot"')
    expect(lit).toContain('drop-shadow')
    // Only the element named, not its neighbour: the picture has to point at one thing.
    expect(lit.indexOf('class="da-spot"')).toBeGreaterThan(lit.indexOf('line2d_2'))
  })

  it('writes the mark\'s colour into the picture, not the panel\'s', () => {
    // The delivered picture is what the agent reads; the glow it sees has to be the one
    // the reader approved, down to the colour.
    const lit = lightMarkup(figure, [{ selector: '#line2d_2', colour: '#f08c00' }])
    expect(lit).toContain('data-da-spot-color="f08c00"')
    expect(lit).toContain('rgba(240,140,0,.95)')
  })

  it('lights two elements in their own colours', () => {
    const lit = lightMarkup(figure, [
      { selector: '#line2d_1', colour: '#e03131' },
      { selector: '#line2d_2', colour: '#1971c2' },
    ])
    expect(lit).toContain('data-da-spot-color="e03131"')
    expect(lit).toContain('data-da-spot-color="1971c2"')
  })

  it('keeps the first colour when two marks name one element', () => {
    // One element cannot glow in two colours, and the first mark is the one the reader
    // placed first — the later one is the duplicate.
    const lit = lightMarkup(figure, [
      { selector: '#line2d_1', colour: '#e03131' },
      { selector: '#line2d_1', colour: '#1971c2' },
    ])
    expect(lit).toContain('data-da-spot-color="e03131"')
    expect(lit).not.toContain('1971c2')
  })

  it('lights an unreadable colour in ink, with no colour of its own', () => {
    // The picture must not claim a colour the reader never chose; the light is still
    // there, so the element the review is about is still pointed at.
    const lit = lightMarkup(figure, [{ selector: '#line2d_1', colour: '' }])
    expect(lit).toContain('class="da-spot"')
    expect(lit).not.toContain('data-da-spot-color')
    expect(lit).toContain('rgba(63,63,70,.9)')
  })

  it('leaves the figure alone when nothing is lit', () => {
    // The export must not change a picture that has no element marks on it — a stray
    // stylesheet in every exported figure would be a diff a reader cannot explain.
    expect(lightMarkup(figure, [])).toBe(figure)
    expect(lightMarkup(figure, [{ selector: '#not-here', colour: '#e03131' }])).toBe(figure)
    expect(lightMarkup('not svg at all', [{ selector: '#a', colour: '#e03131' }])).toBe('not svg at all')
  })

  it('survives a selector that no longer parses', () => {
    // The figure may be a later version of the one the mark was placed on.
    const lit = lightMarkup(figure, [
      { selector: '#line2d_1', colour: '#e03131' },
      { selector: 'a>>b', colour: '#1971c2' },
    ])
    expect(lit).toContain('class="da-spot"')
    expect(lit).not.toContain('1971c2')
  })
})
