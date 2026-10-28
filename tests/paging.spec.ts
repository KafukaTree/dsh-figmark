// @vitest-environment node
/** Turning pages: which gesture goes where, and never off either end. */
import { describe, expect, it } from 'vitest'
import {
  FIRST_PAGE,
  clampPage,
  keyedPage,
  keyedTurn,
  parsePageInput,
  stepPage,
} from '../src/client/pdf/paging'

/** No modifier held, as an ordinary keystroke arrives. */
const plain = { shiftKey: false, altKey: false, metaKey: false, ctrlKey: false }

describe('clamping a page number', () => {
  it('keeps a page that exists', () => {
    expect(clampPage(3, 10)).toBe(3)
  })

  it('pulls a page below the document up to the first', () => {
    expect(clampPage(-4, 10)).toBe(FIRST_PAGE)
    expect(clampPage(0, 10)).toBe(FIRST_PAGE)
  })

  it('pulls a page past the end back to the last', () => {
    expect(clampPage(99, 10)).toBe(10)
  })

  it('rounds a fractional page, because a page is a whole thing', () => {
    expect(clampPage(2.6, 10)).toBe(3)
    expect(clampPage(2.4, 10)).toBe(2)
  })

  it('always answers a first page, even for a document with none', () => {
    expect(clampPage(5, 0)).toBe(FIRST_PAGE)
    expect(clampPage(-1, -3)).toBe(FIRST_PAGE)
  })

  it('answers the first page for a number that is not one', () => {
    expect(clampPage(Number.NaN, 10)).toBe(FIRST_PAGE)
    expect(clampPage(Number.POSITIVE_INFINITY, 10)).toBe(10)
  })
})

describe('stepping a page', () => {
  it('moves forward and back', () => {
    expect(stepPage(4, 1, 10)).toBe(5)
    expect(stepPage(4, -1, 10)).toBe(3)
  })

  it('stops at both ends rather than wrapping', () => {
    expect(stepPage(1, -1, 10)).toBe(1)
    expect(stepPage(10, 1, 10)).toBe(10)
  })
})

describe('reading the page box', () => {
  it('takes a plain number', () => {
    expect(parsePageInput('12', 30)).toBe(12)
    expect(parsePageInput('  7  ', 30)).toBe(7)
  })

  it('lands on the last page for a number past the end', () => {
    expect(parsePageInput('400', 30)).toBe(30)
  })

  it('takes a zero as the first page, the way the clamp does', () => {
    expect(parsePageInput('0', 30)).toBe(1)
  })

  it('refuses anything that is not a number', () => {
    expect(parsePageInput('', 30)).toBeNull()
    expect(parsePageInput('abc', 30)).toBeNull()
    expect(parsePageInput('1e3', 30)).toBeNull()
    expect(parsePageInput('-2', 30)).toBeNull()
    expect(parsePageInput('2.5', 30)).toBeNull()
    expect(parsePageInput('1 2', 30)).toBeNull()
  })
})

describe('the keys that turn a page', () => {
  it('goes forward on the keys a reader expects to go forward', () => {
    for (const key of ['ArrowRight', 'ArrowDown', 'PageDown', ' ']) {
      expect(keyedTurn(key, plain)).toEqual({ delta: 1, absolute: false })
    }
  })

  it('goes back on the keys a reader expects to go back', () => {
    for (const key of ['ArrowLeft', 'ArrowUp', 'PageUp']) {
      expect(keyedTurn(key, plain)).toEqual({ delta: -1, absolute: false })
    }
  })

  it('jumps to the first page on Home, wherever the reader is', () => {
    const turn = keyedTurn('Home', plain) ?? { delta: 0, absolute: false }
    expect(turn).toEqual({ delta: FIRST_PAGE, absolute: true })
    expect(keyedPage(turn, 9, 20)).toBe(1)
    expect(keyedPage(turn, 9, 400)).toBe(1)
  })

  it('jumps to the last page on End, whatever the count', () => {
    const turn = keyedTurn('End', plain) ?? { delta: 0, absolute: false }
    expect(turn).toEqual({ delta: Number.POSITIVE_INFINITY, absolute: true })
    expect(keyedPage(turn, 2, 20)).toBe(20)
    expect(keyedPage(turn, 2, 400)).toBe(400)
  })

  it('leaves a key that is not a page turn alone', () => {
    expect(keyedTurn('a', plain)).toBeNull()
    expect(keyedTurn('Enter', plain)).toBeNull()
    expect(keyedTurn('Escape', plain)).toBeNull()
  })

  it('leaves the shell its own chords', () => {
    // Cmd+Arrow selects text, Ctrl+Arrow jumps a word, Alt+Arrow goes back in a
    // browser: a page body that swallowed those would be stealing gestures it does
    // not own, and the reader would see the caret refuse to move.
    expect(keyedTurn('ArrowRight', { ...plain, metaKey: true })).toBeNull()
    expect(keyedTurn('ArrowLeft', { ...plain, ctrlKey: true })).toBeNull()
    expect(keyedTurn('PageDown', { ...plain, altKey: true })).toBeNull()
  })

  it('still allows Shift, which a reader holds by accident', () => {
    expect(keyedTurn('PageDown', { ...plain, shiftKey: true })).toEqual({ delta: 1, absolute: false })
  })
})
