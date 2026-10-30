// @vitest-environment jsdom
/** The one annotation waiting above the composer, and who hears about it. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearParked, parkAnnotation, parkedAnnotation, unparkAnnotation, watchParked, type ParkedAnnotation } from '../src/client/pending'
import type { FigmarkAnnotation } from '../src/client/annotation-rule'

const data: FigmarkAnnotation = {
  file: '/w/fig.svg',
  scope: '图面 200×100，标注 0 处',
  target: '',
  instruction: '逐条改生成源。',
  html: false,
  marks: [],
}

/**
 * One parked annotation.
 * @param sessionId - session it belongs to.
 * @param raw - the message it stands for.
 * @returns the entry.
 */
function entry(sessionId: string, raw = '【附图标注】/w/fig.svg'): ParkedAnnotation {
  return { sessionId, data, raw, conversation: undefined, send: async () => {} }
}

beforeEach(() => { clearParked() })

afterEach(() => { vi.unstubAllGlobals() })

describe('parking one annotation', () => {
  it('parks one card per session', () => {
    expect(parkedAnnotation('s1')).toBeUndefined()
    parkAnnotation(entry('s1'))
    expect(parkedAnnotation('s1')?.data).toBe(data)
    // Another session's dock draws nothing: a card belongs to the composer it was
    // handed to.
    expect(parkedAnnotation('s2')).toBeUndefined()
  })

  it('replaces the card a session already had', () => {
    parkAnnotation(entry('s1', 'first'))
    parkAnnotation(entry('s1', 'second'))
    expect(parkedAnnotation('s1')?.raw).toBe('second')
  })

  it('drops the card once it is spent', () => {
    parkAnnotation(entry('s1'))
    unparkAnnotation('s1')
    expect(parkedAnnotation('s1')).toBeUndefined()
  })

  it('takes a second drop of the same card quietly', () => {
    // Both the send and its failure path can end in a drop; neither should have to
    // ask whether the card is still there.
    unparkAnnotation('s1')
    expect(() => { unparkAnnotation('s1') }).not.toThrow()
  })
})

describe('watching the parked card', () => {
  it('tells the session when its card appears, changes and goes', () => {
    const listener = vi.fn()
    watchParked('s1', listener)
    parkAnnotation(entry('s1', 'first'))
    expect(listener).toHaveBeenCalledTimes(1)
    parkAnnotation(entry('s1', 'second'))
    expect(listener).toHaveBeenCalledTimes(2)
    unparkAnnotation('s1')
    expect(listener).toHaveBeenCalledTimes(3)
  })

  it('stops telling a watcher that left', () => {
    const listener = vi.fn()
    const stop = watchParked('s1', listener)
    parkAnnotation(entry('s1'))
    stop()
    unparkAnnotation('s1')
    expect(listener).toHaveBeenCalledTimes(1)
    // Nothing left to tell, and nothing left to trip over.
    expect(() => { parkAnnotation(entry('s1')) }).not.toThrow()
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('keeps telling the other watchers when one leaves', () => {
    const first = vi.fn()
    const second = vi.fn()
    const stop = watchParked('s1', first)
    watchParked('s1', second)
    stop()
    parkAnnotation(entry('s1'))
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('only wakes the session whose card changed', () => {
    const one = vi.fn()
    const two = vi.fn()
    watchParked('s1', one)
    watchParked('s2', two)
    parkAnnotation(entry('s2'))
    expect(one).not.toHaveBeenCalled()
    expect(two).toHaveBeenCalledTimes(1)
  })
})

describe('forgetting every card', () => {
  it('leaves nothing parked and nobody watching', () => {
    const listener = vi.fn()
    watchParked('s1', listener)
    parkAnnotation(entry('s1'))
    clearParked()
    expect(parkedAnnotation('s1')).toBeUndefined()
    parkAnnotation(entry('s1'))
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
