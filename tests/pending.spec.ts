// @vitest-environment jsdom
/** The annotations waiting above the composer, and who hears about them. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearParked, parkAnnotation, parkedAnnotations, unparkAnnotation, watchParked, type UnparkedAnnotation } from '../src/client/pending'
import type { FigmarkAnnotation } from '../src/client/annotation-rule'

const data: FigmarkAnnotation = {
  file: '/w/fig.svg',
  scope: '图面 200×100，标注 0 处',
  target: '',
  instruction: '逐条改生成源。',
  html: false,
  pageCapture: 'none' as const,
  marks: [],
}

/**
 * One annotation, as the composer hands it over.
 * @param sessionId - session it belongs to.
 * @param raw - the message it stands for.
 * @returns the card, minus the id parking gives it.
 */
function entry(sessionId: string, raw = '【附图标注】/w/fig.svg'): UnparkedAnnotation {
  return { sessionId, data, raw, conversation: undefined, send: async () => [] }
}

beforeEach(() => { clearParked() })

afterEach(() => { vi.unstubAllGlobals() })

describe('parking annotations', () => {
  it('parks one card for the session it was handed to', () => {
    expect(parkedAnnotations('s1')).toEqual([])
    parkAnnotation(entry('s1'))
    expect(parkedAnnotations('s1')[0]?.data).toBe(data)
    // Another session's dock draws nothing: a card belongs to the composer it was
    // handed to.
    expect(parkedAnnotations('s2')).toEqual([])
  })

  it('queues a second card behind the first instead of replacing it', () => {
    // The reader reviewing figure after figure is handing over review after review.
    // Dropping the earlier one is not a decision, it is losing their work.
    const first = vi.fn(async () => [])
    parkAnnotation({ ...entry('s1', 'first'), send: first })
    const second = vi.fn(async () => [])
    parkAnnotation({ ...entry('s1', 'second'), send: second })
    const cards = parkedAnnotations('s1')
    expect(cards.map(card => card.raw)).toEqual(['first', 'second'])
    // Each card keeps its own delivery: sending the newer one must not send the older
    // message, and the older one is still exactly what the reader parked.
    expect(cards[0]?.send).toBe(first)
    expect(cards[1]?.send).toBe(second)
    expect(cards[0]?.id).not.toBe(cards[1]?.id)
  })

  it('drops the card it is told to drop, and only that one', () => {
    parkAnnotation(entry('s1', 'first'))
    parkAnnotation(entry('s1', 'second'))
    const [first, second] = parkedAnnotations('s1')
    if (first === undefined || second === undefined) throw new Error('two cards were expected')
    unparkAnnotation('s1', second.id)
    expect(parkedAnnotations('s1').map(card => card.raw)).toEqual(['first'])
    unparkAnnotation('s1', first.id)
    expect(parkedAnnotations('s1')).toEqual([])
  })

  it('takes a second drop of the same card quietly', () => {
    // Both the send and its failure path can end in a drop; neither should have to
    // ask whether the card is still there.
    const id = parkAnnotation(entry('s1'))
    unparkAnnotation('s1', id)
    expect(() => { unparkAnnotation('s1', id) }).not.toThrow()
    expect(() => { unparkAnnotation('s9', id) }).not.toThrow()
  })
})

describe('watching the parked cards', () => {
  it('tells the session when a card appears, is added to, and goes', () => {
    const listener = vi.fn()
    watchParked('s1', listener)
    const first = parkAnnotation(entry('s1', 'first'))
    expect(listener).toHaveBeenCalledTimes(1)
    parkAnnotation(entry('s1', 'second'))
    expect(listener).toHaveBeenCalledTimes(2)
    unparkAnnotation('s1', first)
    expect(listener).toHaveBeenCalledTimes(3)
  })

  it('says nothing when the card was not there to drop', () => {
    const listener = vi.fn()
    watchParked('s1', listener)
    unparkAnnotation('s1', 'gone')
    expect(listener).not.toHaveBeenCalled()
  })

  it('leaves the cards alone when the id belongs to none of them', () => {
    // A send can settle after the reader has already taken the card off; the drop that
    // follows must not disturb the neighbours it was never about.
    parkAnnotation(entry('s1', 'first'))
    const listener = vi.fn()
    watchParked('s1', listener)
    unparkAnnotation('s1', 'gone')
    expect(parkedAnnotations('s1')).toHaveLength(1)
    expect(listener).not.toHaveBeenCalled()
  })

  it('stops telling a watcher that left', () => {
    const listener = vi.fn()
    const stop = watchParked('s1', listener)
    const id = parkAnnotation(entry('s1'))
    stop()
    unparkAnnotation('s1', id)
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

  it('only wakes the session whose cards changed', () => {
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
    expect(parkedAnnotations('s1')).toEqual([])
    parkAnnotation(entry('s1'))
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('numbers the cards it hands out again from the start', () => {
    const before = parkAnnotation(entry('s1'))
    clearParked()
    expect(parkAnnotation(entry('s1'))).toBe(before)
  })
})
