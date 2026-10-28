// @vitest-environment jsdom
/**
 * The preference seat the PDF chunk holds.
 *
 * The chunk cannot import the entry bundle — a plain import there would be a
 * synchronous require of a chunk the browser factory cannot load — so anything it
 * keeps in preferences arrives as a function it can hold. What is tested here is
 * that such a seat reads and writes the same record the rest of the panel uses.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { readPreferences, rememberPreferences } from '../src/client/preferences'

beforeEach(() => {
  window.localStorage.clear()
})

describe('a preference a seat can hold', () => {
  it('keeps the colour the reader picked beside everything else', () => {
    // A write of one choice must not be a write that forgets the others.
    rememberPreferences({ ...readPreferences(), color: '#e03131' })
    expect(readPreferences()).toEqual({ color: '#e03131' })
  })
})
