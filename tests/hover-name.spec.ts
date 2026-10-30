// @vitest-environment jsdom
/**
 * The name of the element under the pointer, and where it is written.
 *
 * The lit element shows which element a click would take. This is the other half of
 * the same promise: what that element is called, in the page's own words, and where
 * the label can be put without covering what the reader is looking at.
 */
import { describe, expect, it } from 'vitest'
import { NAME_CHIP_MAX_WIDTH, chipKey, elementName, nameChipAt } from '../src/client/hover-name'
import { SPOTLIGHT_CLASS, SPOTLIGHT_SELECTED_CLASS } from '../src/client/spotlight'
import type { MarkAnchor } from '../src/shared/annotation'

/** An element with a tag, and whatever classes the test says it wears. */
function element(tag: string, classes: readonly string[] = []): Element {
  const made = document.createElement(tag)
  for (const name of classes) made.classList.add(name)
  return made
}

/** An anchor on an element, with everything the picker would have read. */
function anchor(fields: Partial<MarkAnchor> = {}): MarkAnchor {
  return { tag: 'div', bbox: [0, 0, 10, 10], ...fields }
}

describe('naming an element', () => {
  it('names the class its author wrote', () => {
    const found = element('div', ['relative'])
    expect(elementName(anchor({ tag: 'div', selector: 'body > div' }), () => found)).toBe('div.relative')
  })

  it('skips the class the panel lights it with, and names the next own one', () => {
    // Lighting is what makes the element worth naming, and it happens before the name
    // is read: the first class on the element is the panel's own.
    const found = element('div', [SPOTLIGHT_CLASS, SPOTLIGHT_SELECTED_CLASS, 'card'])
    expect(elementName(anchor({ tag: 'DIV', selector: 'body > div' }), () => found)).toBe('div.card')
  })

  it('prefers the id, which is the name the page addresses it by', () => {
    const found = element('p', ['lead'])
    expect(elementName(anchor({ tag: 'p', id: 'lead', selector: 'body > p' }), () => found)).toBe('p#lead')
  })

  it('falls back to the tag when the element has no classes at all', () => {
    expect(elementName(anchor({ tag: 'section', selector: 'body > section' }), () => element('section'))).toBe('section')
  })

  it('falls back to the tag when the element cannot be found any more', () => {
    // The page re-rendered between the hover and the paint, which is a page's right.
    expect(elementName(anchor({ tag: 'span', selector: 'body > span' }), () => undefined)).toBe('span')
  })

  it('falls back to the tag on an anchor that carries no path to follow', () => {
    expect(elementName(anchor({ tag: 'svg' }), () => {
      throw new Error('nothing to resolve')
    })).toBe('svg')
  })

  it('ignores an empty id, which is not a name', () => {
    const found = element('div', ['row'])
    expect(elementName(anchor({ tag: 'div', id: '', selector: 'body > div' }), () => found)).toBe('div.row')
  })
})

describe('deciding whether the name is news', () => {
  it('says nothing changed when the pointer names the same element again', () => {
    const one = anchor({ tag: 'div', selector: 'body > div:nth-of-type(2)', bbox: [10, 20, 30, 40] })
    expect(chipKey({ ...one })).toBe(chipKey(one))
  })

  it('says nothing changed when there is no element at all', () => {
    expect(chipKey(undefined)).toBe('')
  })

  it('notices a different element, and a box that moved under a still hand', () => {
    const one = anchor({ tag: 'div', selector: 'body > div:nth-of-type(2)' })
    expect(chipKey(anchor({ tag: 'p', selector: 'body > div:nth-of-type(2)' }))).not.toBe(chipKey(one))
    expect(chipKey(anchor({ tag: 'div', id: 'card', selector: 'body > div:nth-of-type(2)' }))).not.toBe(chipKey(one))
    expect(chipKey(anchor({ tag: 'div' }))).not.toBe(chipKey(one))
    expect(chipKey(anchor({ tag: 'div', selector: 'body > div:nth-of-type(2)', bbox: [10, 30, 30, 40] })))
      .not.toBe(chipKey(one))
  })
})

describe('placing the name', () => {
  it('rides just above the element, at its left corner', () => {
    expect(nameChipAt([100, 200, 40, 20], [0, 0], { width: 800 }))
      .toEqual({ left: 100, top: 178 })
  })

  it('moves with the page it names', () => {
    expect(nameChipAt([100, 200, 40, 20], [20, 45], { width: 800 }))
      .toEqual({ left: 80, top: 133 })
  })

  it('sits inside the element when the window has no room above it', () => {
    expect(nameChipAt([100, 10, 40, 20], [0, 0], { width: 800 }))
      .toEqual({ left: 100, top: 14 })
  })

  it('still rides above when the lift lands exactly on the window edge', () => {
    expect(nameChipAt([0, 22, 40, 20], [0, 0], { width: 800 }))
      .toEqual({ left: 2, top: 0 })
  })

  it('keeps the chip on the page when the element starts past the left edge', () => {
    expect(nameChipAt([-80, 200, 40, 20], [0, 0], { width: 800 }))
      .toEqual({ left: 2, top: 178 })
  })

  it('keeps the chip on the page when the element runs past the right edge', () => {
    // The name is useless half off the window, so the chip is pulled back by its own
    // width rather than cut. The width is the one the stylesheet gives it.
    expect(nameChipAt([780, 200, 40, 20], [0, 0], { width: 800 }))
      .toEqual({ left: 800 - NAME_CHIP_MAX_WIDTH, top: 178 })
  })

  it('starts at the left edge in a window narrower than the chip', () => {
    expect(nameChipAt([60, 200, 40, 20], [0, 0], { width: 100 }))
      .toEqual({ left: 2, top: 178 })
  })
})
