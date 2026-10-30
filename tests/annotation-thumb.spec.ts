// @vitest-environment jsdom
/** The picture a sent bubble shows: what the cache keeps, and what the scaler refuses. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { captureThumb, clearThumbs, rememberDelivered, rememberThumb, thumbFor } from '../src/client/annotation-thumb'
import { defined, installDom } from './dom'

/** One block, as the sheet delivers it. */
const BLOCK = '【附图标注】/w/fig.svg（图面 1440×800，标注 1 处）\n\n箭头1 (10,20) → (30,40)，批注：往右上拉一点\n\n逐条改生成源。'

/** A picture the cache accepts. */
const SHOT = 'data:image/webp;base64,AAAA'

/** What the stubbed decoder and canvas observed. */
interface ThumbLog {
  /** Media types the decoder was asked for, in order. */
  readonly decoded: string[]
  /** How many decoded bitmaps were closed. */
  closed: number
  /** Canvas sizes the scaler asked for, in order. */
  readonly sizes: { readonly width: number; readonly height: number }[]
  /** Encoder arguments, in order. */
  readonly encoded: (readonly [string, number | undefined])[]
}

/**
 * Install a decoder that answers one fixed size.
 * @param size - the bitmap's pixel size, or `refuse` to throw as a missing decoder does.
 * @returns the log the decoder fills.
 */
function stubDecoder(size: { readonly width: number; readonly height: number } | 'refuse' = { width: 400, height: 300 }): ThumbLog {
  const log: ThumbLog = { decoded: [], closed: 0, sizes: [], encoded: [] }
  vi.stubGlobal('createImageBitmap', async (source: Blob): Promise<unknown> => {
    log.decoded.push(source.type)
    if (size === 'refuse') throw new Error('no decoder in this shell')
    return {
      width: size.width,
      height: size.height,
      close: () => { log.closed += 1 },
    }
  })
  return log
}

/**
 * Install the canvas jsdom does not implement.
 * @param options - which stage should fail instead of succeeding.
 * @returns the log the canvas fills.
 */
function stubCanvas(options: { readonly noContext?: boolean; readonly url?: string; readonly throwOnEncode?: boolean } = {}): ThumbLog {
  const log = stubDecoder()
  const context = { imageSmoothingEnabled: false, imageSmoothingQuality: 'low', drawImage: () => {} }
  const original = document.createElement.bind(document)
  document.createElement = ((tag: string): unknown => {
    if (tag !== 'canvas') return original(tag)
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => (options.noContext === true ? null : context),
      toDataURL: (type: string, quality: number): string => {
        log.sizes.push({ width: canvas.width, height: canvas.height })
        log.encoded.push([type, quality])
        if (options.throwOnEncode === true) throw new Error('encoder refused')
        return options.url ?? SHOT
      },
    }
    return canvas
  }) as typeof document.createElement
  return log
}

beforeEach(() => {
  installDom()
  clearThumbs()
})

afterEach(() => {
  clearThumbs()
  vi.unstubAllGlobals()
})

describe('remembering a picture', () => {
  it('keeps one picture per delivered block, and only for that block', () => {
    expect(thumbFor(BLOCK)).toBeUndefined()
    rememberThumb(BLOCK, SHOT)
    expect(thumbFor(BLOCK)).toBe(SHOT)
    expect(thumbFor(`${BLOCK}\n`)).toBeUndefined()
  })

  it('ignores what it could not draw later', () => {
    // A blob URL dies with the page that made it and a non-picture is not one at all:
    // storing either would put a broken image in a bubble months later.
    rememberThumb(BLOCK, undefined)
    rememberThumb(BLOCK, 'blob:http://localhost/abc')
    rememberThumb(BLOCK, 'data:text/plain;base64,AAAA')
    expect(thumbFor(BLOCK)).toBeUndefined()
  })

  it('keys a block the same way whether it arrives with CRLF or LF', () => {
    const crlf = BLOCK.replace(/\n/gu, '\r\n')
    rememberThumb(crlf, SHOT)
    expect(thumbFor(BLOCK)).toBe(SHOT)
    rememberThumb(BLOCK, 'data:image/png;base64,BBBB')
    expect(thumbFor(crlf)).toBe('data:image/png;base64,BBBB')
  })

  it('drops the least recently sent block once the cache is full', () => {
    for (let index = 0; index < 64; index += 1) rememberThumb(`block ${String(index)}`, SHOT)
    // Sending an old block again makes it the newest entry, so the next one in is
    // what goes: a figure a reader sent twice keeps its picture.
    rememberThumb('block 0', SHOT)
    rememberThumb('block 64', SHOT)
    expect(thumbFor('block 0')).toBe(SHOT)
    expect(thumbFor('block 1')).toBeUndefined()
    expect(thumbFor('block 64')).toBe(SHOT)
    expect(thumbFor('block 2')).toBe(SHOT)
  })

  it('forgets every picture on request', () => {
    rememberThumb(BLOCK, SHOT)
    clearThumbs()
    expect(thumbFor(BLOCK)).toBeUndefined()
  })
})

describe('remembering a delivered message', () => {
  it('keys the block inside it, which is what the bubble asks for', () => {
    // The reader typed a sentence after the annotation before sending, which is how
    // "但是发到对话框还是没有卡片预览" travelled: the message is longer than the block,
    // and the card looks up the block, so keying the message alone missed every time.
    const message = `${BLOCK}\n\n但是发到对话框还是没有卡片预览`
    rememberDelivered(message, SHOT)
    expect(thumbFor(BLOCK)).toBe(SHOT)
    expect(thumbFor(message)).toBe(SHOT)
  })

  it('keys every block a message carries', () => {
    const second = BLOCK.replace('/w/fig.svg', '/w/two.svg')
    rememberDelivered(`${BLOCK}\n\n${second}`, SHOT)
    expect(thumbFor(BLOCK)).toBe(SHOT)
    expect(thumbFor(second)).toBe(SHOT)
  })

  it('stores an ordinary message under its own text', () => {
    // Most messages are prose; they have no block, and the loop must end on its own.
    rememberDelivered('hello', SHOT)
    expect(thumbFor('hello')).toBe(SHOT)
    expect(thumbFor(BLOCK)).toBeUndefined()
  })

  it('stores nothing when there is no picture to store', () => {
    rememberDelivered(`${BLOCK}\n`, undefined)
    expect(thumbFor(BLOCK)).toBeUndefined()
  })
})

describe('scaling a picture down', () => {
  it('answers nothing when there is no picture to scale', async () => {
    const log = stubDecoder()
    await expect(captureThumb(undefined)).resolves.toBeUndefined()
    expect(log.decoded).toEqual([])
  })

  it('scales the long edge to the thumbnail width and closes the decoded frame', async () => {
    const log = stubCanvas()
    const url = await captureThumb(new Blob([new Uint8Array([1])], { type: 'image/png' }))
    expect(url).toBe(SHOT)
    // 400×300 is wider than 120, so both sides shrink by the same factor.
    expect(log.sizes).toEqual([{ width: 120, height: 90 }])
    expect(log.encoded).toEqual([['image/webp', 0.6]])
    expect(log.closed).toBe(1)
  })

  it('never enlarges a picture that is already small', async () => {
    const log = stubCanvas()
    stubDecoder({ width: 60, height: 40 })
    await captureThumb(new Blob([new Uint8Array([1])], { type: 'image/png' }))
    expect(log.sizes).toEqual([{ width: 60, height: 40 }])
  })

  it('keeps a picture at least one pixel on each side', async () => {
    const log = stubCanvas()
    stubDecoder({ width: 1440, height: 4 })
    await captureThumb(new Blob([new Uint8Array([1])], { type: 'image/png' }))
    expect(log.sizes).toEqual([{ width: 120, height: 1 }])
  })

  it('answers nothing when the shell has no decoder', async () => {
    stubCanvas()
    stubDecoder('refuse')
    await expect(captureThumb(new Blob([new Uint8Array([1])], { type: 'image/png' }))).resolves.toBeUndefined()
  })

  it('answers nothing when the canvas has no 2D context, and still closes the bitmap', async () => {
    const log = stubCanvas({ noContext: true })
    await expect(captureThumb(new Blob([new Uint8Array([1])], { type: 'image/png' }))).resolves.toBeUndefined()
    expect(log.closed).toBe(1)
  })

  it('answers nothing when the encoder refuses or answers something that is not a picture', async () => {
    stubCanvas({ throwOnEncode: true })
    await expect(captureThumb(new Blob([new Uint8Array([1])], { type: 'image/png' }))).resolves.toBeUndefined()
    stubCanvas({ url: 'blob:http://localhost/nope' })
    await expect(captureThumb(new Blob([new Uint8Array([1])], { type: 'image/png' }))).resolves.toBeUndefined()
  })

  it('decodes the bytes it was handed rather than re-reading the file', async () => {
    const log = stubCanvas()
    const png = new Blob([new Uint8Array([1])], { type: 'image/png' })
    await captureThumb(png)
    expect(log.decoded).toEqual(['image/png'])
    expect(defined(log.encoded[0])[0]).toBe('image/webp')
  })
})
