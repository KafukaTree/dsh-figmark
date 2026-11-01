/** The vocabulary a rendered page and the panel share, and the fence around it. */
import { describe, expect, it } from 'vitest'
import {
  LIVE_MESSAGE, liveCaptureMessage, liveDepthMessage, liveModeMessage, liveReleaseMessage,
  liveRevealMessage, liveWatchMessage, parseLiveEvent,
} from '../src/shared/live'

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

  it('names the selectors the page should keep measuring', () => {
    expect(liveWatchMessage(['#one', 'body > p:nth-of-type(1)'])).toEqual({
      figmark: LIVE_MESSAGE,
      kind: 'watch',
      selectors: ['#one', 'body > p:nth-of-type(1)'],
    })
  })

  it('moves the element ladder without taking keyboard focus from the panel', () => {
    expect(liveDepthMessage(1)).toEqual({ figmark: LIVE_MESSAGE, kind: 'depth', delta: 1 })
    expect(liveDepthMessage(-1)).toEqual({ figmark: LIVE_MESSAGE, kind: 'depth', delta: -1 })
  })

  it('asks for one saved mark with its locator, surface and fallback box', () => {
    expect(liveRevealMessage('r1', '#lead', '#slide-5', [10, 20, 30, 40])).toEqual({
      figmark: LIVE_MESSAGE,
      kind: 'reveal',
      requestId: 'r1',
      selector: '#lead',
      surface: '#slide-5',
      bbox: [10, 20, 30, 40],
    })
  })

  it('asks the page to restore a temporarily revealed hidden layer', () => {
    expect(liveReleaseMessage()).toEqual({ figmark: LIVE_MESSAGE, kind: 'release-reveal' })
  })

  it('asks for one screenshot by its opaque request id', () => {
    expect(liveCaptureMessage('c1')).toEqual({ figmark: LIVE_MESSAGE, kind: 'capture', requestId: 'c1' })
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

  it('keeps the element ladder depth when the picker reports one', () => {
    expect(parseLiveEvent({ ...PICK, level: 2, count: 4 })).toMatchObject({
      kind: 'pick',
      level: 2,
      count: 4,
    })
    expect(parseLiveEvent({ ...PICK, level: 5, count: 4 })).not.toHaveProperty('level')
    expect(parseLiveEvent({ ...PICK, level: 1.5, count: 4 })).not.toHaveProperty('level')
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

  it('keeps the slide that owns a pick, including the explicit absence of one', () => {
    expect(parseLiveEvent({ ...PICK, surface: '#slide-2' })).toMatchObject({
      kind: 'pick',
      surface: '#slide-2',
    })
    expect(parseLiveEvent({ ...PICK, surface: null })).toMatchObject({
      kind: 'pick',
      surface: null,
    })
    expect(parseLiveEvent({ ...PICK, surface: '' })).toBeUndefined()
    expect(parseLiveEvent({ ...PICK, surface: 'x'.repeat(2049) })).toBeUndefined()
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
    expect(parseLiveEvent({ figmark: LIVE_MESSAGE, kind: 'cancel' })).toEqual({ kind: 'cancel' })
  })

  it('reads every honest outcome of a locate request', () => {
    for (const status of ['revealed', 'missing', 'hidden', 'wrong-surface'] as const) {
      expect(parseLiveEvent({
        figmark: LIVE_MESSAGE,
        kind: 'reveal-result',
        requestId: 'r1',
        status,
      })).toEqual({ kind: 'reveal-result', requestId: 'r1', status })
    }
    expect(parseLiveEvent({
      figmark: LIVE_MESSAGE,
      kind: 'reveal-result',
      requestId: '',
      status: 'revealed',
    })).toBeUndefined()
    expect(parseLiveEvent({
      figmark: LIVE_MESSAGE,
      kind: 'reveal-result',
      requestId: 'x'.repeat(129),
      status: 'revealed',
    })).toBeUndefined()
    expect(parseLiveEvent({
      figmark: LIVE_MESSAGE,
      kind: 'reveal-result',
      requestId: 'r1',
      status: 'elsewhere',
    })).toBeUndefined()
    expect(parseLiveEvent({
      figmark: LIVE_MESSAGE,
      kind: 'reveal-result',
      requestId: 'r1',
      status: 'revealed',
      surface: 'body > section:nth-of-type(1)',
      temporary: true,
    })).toEqual({
      kind: 'reveal-result',
      requestId: 'r1',
      status: 'revealed',
      surface: 'body > section:nth-of-type(1)',
      temporary: true,
    })
    expect(parseLiveEvent({
      figmark: LIVE_MESSAGE,
      kind: 'reveal-result',
      requestId: 'r1',
      status: 'revealed',
      surface: null,
    })).toEqual({ kind: 'reveal-result', requestId: 'r1', status: 'revealed', surface: null })
    expect(parseLiveEvent({
      figmark: LIVE_MESSAGE,
      kind: 'reveal-result',
      requestId: 'r1',
      status: 'revealed',
      surface: '',
    })).toBeUndefined()
  })

  it('reads the logical surface in front, and the absence of one', () => {
    expect(parseLiveEvent({
      figmark: LIVE_MESSAGE,
      kind: 'surface',
      selector: 'body > section:nth-of-type(5)',
    })).toEqual({ kind: 'surface', selector: 'body > section:nth-of-type(5)' })
    expect(parseLiveEvent({
      figmark: LIVE_MESSAGE,
      kind: 'surface',
      selector: null,
    })).toEqual({ kind: 'surface', selector: null })
  })

  it('reads the live boxes of the elements saved marks name', () => {
    expect(parseLiveEvent({
      figmark: LIVE_MESSAGE,
      kind: 'bounds',
      bounds: [
        { selector: '#one', bbox: [1, 2, 3, 4], visible: true },
        { selector: '#two', bbox: [0, 0, 0, 0], visible: false },
      ],
    })).toEqual({
      kind: 'bounds',
      bounds: [
        { selector: '#one', bbox: [1, 2, 3, 4], visible: true },
        { selector: '#two', bbox: [0, 0, 0, 0], visible: false },
      ],
    })
  })

  it('reads a screenshot with the document, viewport, scroll and live boxes', () => {
    const capture = {
      figmark: LIVE_MESSAGE,
      kind: 'capture-result',
      requestId: 'c1',
      status: 'ok',
      dataUrl: 'data:image/png;base64,AAAA',
      document: [1280, 720],
      imageRect: [0, 0, 1280, 720],
      viewport: [960, 540],
      scroll: [10, 20],
      scale: 1.5,
      surface: '#slide-2',
      bounds: [{ selector: '#lead', bbox: [10, 20, 300, 40], visible: true }],
    }
    expect(parseLiveEvent(capture)).toEqual({
      kind: 'capture-result',
      requestId: 'c1',
      status: 'ok',
      dataUrl: capture.dataUrl,
      document: [1280, 720],
      imageRect: [0, 0, 1280, 720],
      viewport: [960, 540],
      scroll: [10, 20],
      scale: 1.5,
      surface: '#slide-2',
      bounds: [{ selector: '#lead', bbox: [10, 20, 300, 40], visible: true }],
    })
    expect(parseLiveEvent({ ...capture, surface: null })).toMatchObject({ surface: null })
    expect(parseLiveEvent({ ...capture, imageRect: undefined })).toMatchObject({
      imageRect: [0, 0, 1280, 720],
    })
  })

  it('reads a screenshot refusal without inventing a picture', () => {
    expect(parseLiveEvent({
      figmark: LIVE_MESSAGE,
      kind: 'capture-result',
      requestId: 'c1',
      status: 'failed',
      reason: 'canvas unavailable',
    })).toEqual({
      kind: 'capture-result',
      requestId: 'c1',
      status: 'failed',
      reason: 'canvas unavailable',
    })
    expect(parseLiveEvent({
      figmark: LIVE_MESSAGE,
      kind: 'capture-result',
      requestId: 'c1',
      status: 'failed',
      reason: 'x'.repeat(301),
    })).toEqual({ kind: 'capture-result', requestId: 'c1', status: 'failed' })
    expect(parseLiveEvent({
      figmark: LIVE_MESSAGE,
      kind: 'capture-result',
      requestId: 'c1',
      status: 'failed',
      reason: '',
    })).toEqual({ kind: 'capture-result', requestId: 'c1', status: 'failed' })
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
    expect(parseLiveEvent({ figmark: LIVE_MESSAGE, kind: 'bounds', bounds: 'x' })).toBeUndefined()
    expect(parseLiveEvent({
      figmark: LIVE_MESSAGE,
      kind: 'bounds',
      bounds: [{ selector: '', bbox: [1, 2, 3, 4], visible: true }],
    })).toBeUndefined()
    expect(parseLiveEvent({
      figmark: LIVE_MESSAGE,
      kind: 'bounds',
      bounds: [{ selector: '#one', bbox: [1, 2, 3], visible: true }],
    })).toBeUndefined()
    expect(parseLiveEvent({
      figmark: LIVE_MESSAGE,
      kind: 'bounds',
      bounds: [{ selector: '#one', bbox: [1, 2, 3, 4], visible: 'yes' }],
    })).toBeUndefined()
    expect(parseLiveEvent({
      figmark: LIVE_MESSAGE,
      kind: 'bounds',
      bounds: [null],
    })).toBeUndefined()
    expect(parseLiveEvent({
      figmark: LIVE_MESSAGE,
      kind: 'bounds',
      bounds: Array.from({ length: 257 }, () => ({
        selector: '#one', bbox: [1, 2, 3, 4], visible: true,
      })),
    })).toBeUndefined()
    expect(parseLiveEvent({ figmark: LIVE_MESSAGE, kind: 'surface', selector: '' })).toBeUndefined()
    expect(parseLiveEvent({ figmark: LIVE_MESSAGE, kind: 'surface', selector: 'x'.repeat(2049) })).toBeUndefined()
  })

  it('refuses an incomplete or oversized screenshot', () => {
    const capture = {
      figmark: LIVE_MESSAGE,
      kind: 'capture-result',
      requestId: 'c1',
      status: 'ok',
      dataUrl: 'data:image/png;base64,AAAA',
      document: [1280, 720],
      imageRect: [0, 0, 1280, 720],
      viewport: [960, 540],
      scroll: [0, 0],
      scale: 1,
      surface: null,
      bounds: [],
    }
    expect(parseLiveEvent({ ...capture, requestId: '' })).toBeUndefined()
    expect(parseLiveEvent({ ...capture, requestId: 'x'.repeat(129) })).toBeUndefined()
    expect(parseLiveEvent({ ...capture, status: 'maybe' })).toBeUndefined()
    expect(parseLiveEvent({ ...capture, dataUrl: 'data:image/jpeg;base64,AAAA' })).toBeUndefined()
    expect(parseLiveEvent({ ...capture, dataUrl: `data:image/png;base64,${'A'.repeat(15_500_000)}` })).toBeUndefined()
    expect(parseLiveEvent({ ...capture, document: [0, 720] })).toBeUndefined()
    expect(parseLiveEvent({ ...capture, document: [1280, 100_001] })).toBeUndefined()
    expect(parseLiveEvent({
      ...capture,
      document: undefined,
      imageRect: undefined,
    })).toBeUndefined()
    expect(parseLiveEvent({ ...capture, imageRect: 'none' })).toBeUndefined()
    expect(parseLiveEvent({ ...capture, imageRect: [0, 0, 0, 720] })).toBeUndefined()
    expect(parseLiveEvent({ ...capture, viewport: [960] })).toBeUndefined()
    expect(parseLiveEvent({ ...capture, scroll: [0, Number.NaN] })).toBeUndefined()
    expect(parseLiveEvent({ ...capture, scale: 0 })).toBeUndefined()
    expect(parseLiveEvent({ ...capture, scale: 5 })).toBeUndefined()
    expect(parseLiveEvent({ ...capture, surface: '' })).toBeUndefined()
    expect(parseLiveEvent({ ...capture, surface: 'x'.repeat(2049) })).toBeUndefined()
    expect(parseLiveEvent({ ...capture, bounds: 'none' })).toBeUndefined()
  })
})
