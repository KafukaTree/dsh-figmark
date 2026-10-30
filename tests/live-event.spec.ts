/** The vocabulary a rendered page and the panel share, and the fence around it. */
import { describe, expect, it } from 'vitest'
import { LIVE_MESSAGE, liveModeMessage, parseLiveEvent } from '../src/shared/live'

/** A pick exactly as the injected script reports one. */
const PICK = {
  figmark: LIVE_MESSAGE,
  kind: 'pick',
  tag: 'div',
  id: 'hero',
  class: 'relative flex',
  text: 'Hello',
  selector: 'body > div:nth-of-type(1)',
  bbox: [10, 20, 300, 40],
  scroll: [0, 120],
}

describe('the mode message', () => {
  it('carries the marker the page listens for', () => {
    expect(liveModeMessage(true)).toEqual({ figmark: LIVE_MESSAGE, kind: 'mode', armed: true })
    expect(liveModeMessage(false)).toEqual({ figmark: LIVE_MESSAGE, kind: 'mode', armed: false })
  })
})

describe('parsing what a page reports', () => {
  it('reads a pick whole', () => {
    expect(parseLiveEvent(PICK)).toEqual({
      kind: 'pick',
      tag: 'div',
      id: 'hero',
      class: 'relative flex',
      text: 'Hello',
      selector: 'body > div:nth-of-type(1)',
      bbox: [10, 20, 300, 40],
      scroll: [0, 120],
    })
  })

  it('leaves out the optional fields a page did not report', () => {
    const rest = { figmark: PICK.figmark, tag: PICK.tag, selector: PICK.selector, bbox: PICK.bbox, scroll: PICK.scroll }
    expect(parseLiveEvent({ ...rest, kind: 'hover' })).toEqual({
      kind: 'hover',
      tag: 'div',
      selector: 'body > div:nth-of-type(1)',
      bbox: [10, 20, 300, 40],
      scroll: [0, 120],
    })
  })

  it('treats an empty string as nothing said, rather than as an empty name', () => {
    expect(parseLiveEvent({ ...PICK, id: '', text: '' })).not.toHaveProperty('id')
    expect(parseLiveEvent({ ...PICK, id: '', text: '' })).not.toHaveProperty('text')
  })

  it('reads a scroll and a ready, which carry a place but no element', () => {
    expect(parseLiveEvent({ figmark: LIVE_MESSAGE, kind: 'scroll', scroll: [3, 4] })).toEqual({ kind: 'scroll', scroll: [3, 4] })
    expect(parseLiveEvent({ figmark: LIVE_MESSAGE, kind: 'ready', scroll: [0, 0] })).toEqual({ kind: 'ready', scroll: [0, 0] })
  })

  it('reads a leave, which carries nothing at all', () => {
    expect(parseLiveEvent({ figmark: LIVE_MESSAGE, kind: 'leave' })).toEqual({ kind: 'leave' })
  })

  it('refuses anything that is not one of its own messages', () => {
    expect(parseLiveEvent(undefined)).toBeUndefined()
    expect(parseLiveEvent(null)).toBeUndefined()
    expect(parseLiveEvent('dsh-figmark:live')).toBeUndefined()
    expect(parseLiveEvent({ kind: 'pick' })).toBeUndefined()
    expect(parseLiveEvent({ ...PICK, figmark: 'somebody-else' })).toBeUndefined()
  })

  it('refuses a place it cannot draw at', () => {
    expect(parseLiveEvent({ figmark: LIVE_MESSAGE, kind: 'scroll' })).toBeUndefined()
    expect(parseLiveEvent({ figmark: LIVE_MESSAGE, kind: 'scroll', scroll: [1] })).toBeUndefined()
    expect(parseLiveEvent({ figmark: LIVE_MESSAGE, kind: 'ready', scroll: ['1', 2] })).toBeUndefined()
    expect(parseLiveEvent({ ...PICK, bbox: [1, 2, 3] })).toBeUndefined()
    expect(parseLiveEvent({ ...PICK, bbox: [1, 2, 3, Number.NaN] })).toBeUndefined()
    expect(parseLiveEvent({ ...PICK, scroll: [1, Number.POSITIVE_INFINITY] })).toBeUndefined()
  })

  it('refuses an element with no name to act on', () => {
    expect(parseLiveEvent({ ...PICK, kind: 'tap' })).toBeUndefined()
    expect(parseLiveEvent({ ...PICK, tag: '' })).toBeUndefined()
    expect(parseLiveEvent({ ...PICK, tag: 7 })).toBeUndefined()
    expect(parseLiveEvent({ ...PICK, selector: undefined })).toBeUndefined()
    expect(parseLiveEvent({ ...PICK, bbox: undefined })).toBeUndefined()
  })
})
