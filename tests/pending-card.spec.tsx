// @vitest-environment jsdom
/**
 * The attachment card the reader sees above the composer: what it shows, what it
 * keeps to the hover, and the two things it can do — send, or be taken off.
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearThumbs, rememberThumb } from '../src/client/annotation-thumb'
import { zh } from '../src/client/locales'
import { clearParked, parkAnnotation, parkedAnnotations, type UnparkedAnnotation } from '../src/client/pending'
import type { ComposerShellLike } from '../src/client/composer'
import { PendingCard, shortLabel } from '../src/client/pending-card'
import { defined, installDom } from './dom'

/** The message the parked card stands for, exactly as it will be delivered. */
const RAW = '【附图标注】/w/fig.svg（图面 1440×800，标注 1 处）\n\n箭头1 (10,20) → (30,40)，批注：往右上拉一点\n\n逐条改生成源。'

/** The parsed block, as the rule hands it to the card. */
const DATA = {
  file: '/w/fig.svg',
  scope: '图面 1440×800，标注 1 处',
  target: '',
  instruction: '逐条改生成源。',
  html: false,
  pageCapture: 'none' as const,
  marks: [{ label: '箭头1 (10,20) → (30,40)', comment: '往右上拉一点', missing: false, page: undefined }],
}

describe('the attachment card above the composer', () => {
  let root: Root
  let host: HTMLElement

  beforeEach(() => {
    installDom()
    clearParked()
    clearThumbs()
    host = document.createElement('div')
    document.body.appendChild(host)
    root = createRoot(host)
  })

  afterEach(() => {
    act(() => { root.unmount() })
    host.remove()
    clearParked()
    clearThumbs()
  })

  /**
   * Draw the dock for one session.
   * @param props - whatever the case is about.
   */
  function mount(props: { sessionId?: string; t?: (key: string, vars?: Record<string, string | number>) => string; localeId?: string } = { sessionId: 's1' }): void {
    act(() => {
      root.render(<PendingCard {...props} />)
    })
  }

  /**
   * Park one annotation.
   * @param overrides - fields the case is about.
   * @returns the parked entry.
   */
  function park(overrides: Partial<UnparkedAnnotation> = {}): UnparkedAnnotation {
    const entry: UnparkedAnnotation = {
      sessionId: 's1',
      data: DATA,
      raw: RAW,
      conversation: undefined,
      send: async () => [],
      ...overrides,
    }
    parkAnnotation(entry)
    return entry
  }

  /** The card's one action. */
  function open(): HTMLButtonElement {
    return defined(host.querySelector('.da-staged-send')) as HTMLButtonElement
  }

  /** The remove control. */
  function remove(): HTMLButtonElement {
    return defined(host.querySelector('.da-staged-x')) as HTMLButtonElement
  }

  /** Wait for one press to settle. */
  async function press(button: HTMLButtonElement): Promise<void> {
    await act(async () => { button.click() })
  }

  /**
   * A composer shell an armed card can talk to, recording what the card did to it.
   * @param spec - the draft it holds, the attachments it already carries, and what its
   * own send does.
   * @returns the shell, and what it saw.
   */
  function stubBox(spec: {
    readonly draft: string
    readonly ids?: readonly string[]
    readonly press?: 'ok' | 'refuse' | 'none'
  }): {
    readonly shell: ComposerShellLike
    readonly pressed: () => readonly string[]
    readonly dropped: () => readonly string[]
    readonly added: () => readonly (readonly string[])[]
    readonly draftText: () => string
  } {
    const state = { draft: spec.draft }
    let ids: readonly string[] = spec.ids ?? []
    const dropped: string[] = []
    const added: (readonly string[])[] = []
    const carried: string[] = []
    const shell: ComposerShellLike = {
      get snapshot() { return { draft: state.draft, attachmentIds: ids, phase: 'plain' } },
      setDraft: (text: string) => { state.draft = text },
      addAttachments: (each: readonly string[]) => {
        added.push(each)
        ids = [...ids, ...each]
        return true
      },
      removeAttachment: (id: string) => {
        dropped.push(id)
        ids = ids.filter(each => each !== id)
        return true
      },
      ...(spec.press === 'none'
        ? {}
        : {
            submit: () => {
              carried.push(state.draft)
              // A refused send leaves the draft and the rail where they were; a
              // delivered one takes both, the way the host's own does.
              if (spec.press === 'refuse') return
              state.draft = ''
              ids = []
            },
          }),
    }
    return {
      shell,
      pressed: () => carried,
      dropped: () => dropped,
      added: () => added,
      draftText: () => state.draft,
    }
  }

  it('draws nothing until something is parked', () => {
    mount()
    expect(host.querySelector('.da-staged')).toBeNull()
  })

  it('draws nothing for a session that has no id', () => {
    park()
    mount({})
    expect(host.querySelector('.da-staged')).toBeNull()
  })

  it('draws a compact attachment chip: file, count, and the first mark', () => {
    park()
    mount()
    expect(host.querySelector('.da-staged-title')?.textContent).toBe('fig.svg')
    expect(host.querySelector('.da-staged-count')?.textContent).toBe('1')
    expect(host.querySelector('.da-staged-count')?.getAttribute('aria-label')).toBe('1 处标注')
    expect(host.querySelector('.da-staged-shape')?.textContent).toBe('箭头 1')
    expect(host.querySelector('.da-staged-said')?.textContent).toBe('往右上拉一点')
    expect(host.textContent).not.toContain(zh['title'])
    expect(host.textContent).not.toContain('批注')
  })

  it('shows the page filename without its query state', () => {
    park({ data: { ...DATA, file: 'http://localhost:5173/deck/index.html?clean=1', html: true } })
    mount()
    expect(host.querySelector('.da-staged-title')?.textContent).toBe('localhost:5173/deck/index.html')
  })

  it('marks an intentionally screenshot-free live attachment', () => {
    park({
      data: {
        ...DATA,
        file: 'http://localhost:5173/deck/index.html',
        html: true,
        pageCapture: 'omitted',
      },
    })
    mount()
    expect(host.querySelector('.da-staged-capture')?.textContent).toBe(zh.cardCaptureOmitted)
  })

  it('marks a failed live-page screenshot', () => {
    park({
      data: {
        ...DATA,
        file: 'http://localhost:5173/deck/index.html',
        html: true,
        pageCapture: 'failed',
      },
    })
    mount()
    expect(host.querySelector('.da-staged-capture')?.textContent).toBe(zh.cardCaptureFailed)
  })

  it('does not add a capture badge when the screenshot is present', () => {
    park({
      data: {
        ...DATA,
        file: 'http://localhost:5173/deck/index.html',
        html: true,
        pageCapture: 'attached',
      },
    })
    mount()
    expect(host.querySelector('.da-staged-capture')).toBeNull()
  })

  it('keeps the size and the coordinates off the face, in the hover titles', () => {
    park()
    mount()
    // Neither the scope nor a coordinate pair is on any line the card shows...
    expect(host.textContent).not.toContain('1440×800')
    expect(host.textContent).not.toContain('(10,20)')
    // ...they are one hover away, on the two elements that own them.
    expect(host.querySelector('.da-staged-card')?.getAttribute('title')).toBe('/w/fig.svg · 图面 1440×800，标注 1 处')
    expect(host.querySelector('.da-staged-line')?.getAttribute('title'))
      .toBe('箭头1 (10,20) → (30,40) · 往右上拉一点')
  })

  it('labels sending separately from the preview', () => {
    park()
    mount()
    expect(open().getAttribute('title')).toBe(zh['pendingSendNow'])
    expect(remove().getAttribute('aria-label')).toBe(zh['pendingRemove'])
  })

  it('counts every mark and shows only the first', () => {
    park({
      data: {
        ...DATA,
        marks: [
          { label: '矩形1 (1,2)-(3,4)', comment: '再高一点', missing: false, page: undefined },
          { label: '椭圆1 (5,6)-(7,8)', comment: '同理', missing: false, page: undefined },
          { label: '手绘1', comment: '这里要合并', missing: false, page: undefined },
        ],
      },
    })
    mount()
    expect(host.querySelector('.da-staged-count')?.textContent).toBe('3')
    expect(host.querySelectorAll('.da-staged-line')).toHaveLength(1)
    expect(host.querySelector('.da-staged-shape')?.textContent).toBe('矩形 1')
    expect(host.querySelector('.da-staged-said')?.textContent).toBe('再高一点')
  })

  it('shows only the mark kind when it came without a note', () => {
    park({
      data: { ...DATA, marks: [{ label: '矩形1 (1,2)-(3,4)', comment: '', missing: true, page: undefined }] },
    })
    mount()
    expect(host.querySelector('.da-staged-shape')?.textContent).toBe('矩形 1')
    expect(host.querySelector('.da-staged-said')).toBeNull()
  })

  it('draws the head of a block that has no marks left', () => {
    park({ data: { ...DATA, marks: [] } })
    mount()
    expect(host.querySelector('.da-staged-count')?.textContent).toBe('0')
    expect(host.querySelector('.da-staged-line')).toBeNull()
  })

  it('names the file alone when the block wrote no scope', () => {
    park({ data: { ...DATA, scope: '' } })
    mount()
    expect(host.querySelector('.da-staged-card')?.getAttribute('title')).toBe('/w/fig.svg')
  })

  it('targets only its own native draft thumbnails', () => {
    const box = stubBox({ draft: '' })
    park({ armed: { shell: box.shell, text: RAW, attachmentIds: ['a1'], previewUrls: ['blob:own-image'] } })
    mount()
    const style = host.querySelector('style')?.textContent
    expect(style).toContain('img[src="blob:own-image"]')
    expect(style).toContain('[data-composer-card]')
    expect(host.querySelector('.da-staged-send')).toBeNull()
  })

  it('shows the figure itself when it has its picture', () => {
    rememberThumb(RAW, 'data:image/png;base64,AAAA')
    park()
    mount()
    expect(defined(host.querySelector('.da-staged-shot img'))).toBeDefined()
  })

  it('falls back to the glyph when the picture fails to load', () => {
    rememberThumb(RAW, 'data:image/png;base64,AAAA')
    park()
    mount()
    const img = defined(host.querySelector('.da-staged-shot img')) as HTMLImageElement
    act(() => { img.dispatchEvent(new Event('error')) })
    expect(host.querySelector('.da-staged-shot img')).toBeNull()
    expect(host.querySelector('.da-staged-glyph')).not.toBeNull()
  })

  it('previews an armed review without sending or changing the draft', async () => {
    const send = vi.fn(async () => [])
    const box = stubBox({ draft: 'My unsent words' })
    park({ send, armed: { shell: box.shell, text: RAW, attachmentIds: ['a1'] } })
    mount()
    const preview = defined(host.querySelector('.da-staged-open')) as HTMLButtonElement
    expect(preview.title).toBe(zh.cardExpand)
    await press(preview)
    expect(preview.getAttribute('aria-expanded')).toBe('true')
    expect(host.querySelector('.da-staged-details .da-card')).not.toBeNull()
    expect(host.querySelector('.da-staged-details .da-card-actions')).toBeNull()
    expect(host.querySelector('.da-staged-details .da-card-head')?.tagName).toBe('SPAN')
    expect(send).not.toHaveBeenCalled()
    expect(box.pressed()).toEqual([])
    expect(box.draftText()).toBe('My unsent words')
    expect(box.added()).toEqual([])
    await press(preview)
    expect(host.querySelector('.da-staged-details')?.hasAttribute('hidden')).toBe(true)
    expect(parkedAnnotations('s1')).toHaveLength(1)
  })

  it('shows the first marked PDF page in the chip', () => {
    park({ data: { ...DATA, file: '/w/paper.pdf', marks: [{ label: 'box 1', comment: 'fix', missing: false, page: 7 }] } })
    mount()
    expect(host.querySelector('.da-staged-type')?.textContent).toBe('PDF')
    expect(host.querySelector('.da-card-page')?.textContent).toBe('第 7 页')
  })

  it('blocks removal during delivery even when disabled is bypassed', async () => {
    let release: (() => void) | undefined
    park({ send: () => new Promise(resolve => { release = () => { resolve([]) } }) })
    mount()
    await act(async () => {
      // The second gesture lands before React paints disabled; the handler must guard it.
      open().click()
      remove().click()
    })
    expect(parkedAnnotations('s1')).toHaveLength(1)
    await act(async () => { defined(release)() })
  })

  it('sends the parked delivery once, and the card is spent', async () => {
    const send = vi.fn(async () => [])
    park({ send })
    mount()
    await press(open())
    expect(send).toHaveBeenCalledTimes(1)
    expect(parkedAnnotations('s1')).toEqual([])
    expect(host.querySelector('.da-staged')).toBeNull()
  })

  it('keeps a missing-attachment warning after the sent card is gone', async () => {
    const warning = '本次组合没有附件服务，标注图未随消息发送。'
    park({ send: async () => [warning] })
    mount()
    await press(open())
    // The message went out, so the card must not stay and invite a duplicate send...
    expect(parkedAnnotations('s1')).toEqual([])
    expect(host.querySelector('.da-staged')).toBeNull()
    // ...but the warning outlives it, because the file did not.
    expect(host.querySelector('.da-staged-result')?.getAttribute('role')).toBe('status')
    expect(host.querySelector('.da-staged-result-text')?.textContent).toBe(warning)
    await press(defined(host.querySelector('.da-staged-result-x')) as HTMLButtonElement)
    expect(host.querySelector('.da-staged-result')).toBeNull()
  })

  it('holds the card while the message is on its way', async () => {
    let release: (() => void) | undefined
    const send = vi.fn((): Promise<readonly string[]> => new Promise<readonly string[]>((resolve) => {
      release = () => { resolve([]) }
    }))
    park({ send })
    mount()
    // Two presses in one tick, before the disabled state has been rendered.
    await act(async () => { open().click(); open().click() })
    expect(send).toHaveBeenCalledTimes(1)
    expect(open().disabled).toBe(true)
    expect(remove().disabled).toBe(true)
    await act(async () => { defined(release)() })
    expect(host.querySelector('.da-staged')).toBeNull()
  })

  it('says why a send failed, and keeps the card', async () => {
    park({ send: async () => { throw new Error('the sessions service is unavailable') } })
    mount()
    await press(open())
    expect(host.querySelector('.da-staged-trouble')?.textContent)
      .toBe(`${zh['pendingFailed']}the sessions service is unavailable`)
    // The annotation is not lost to a failed send: the reader can try again.
    expect(parkedAnnotations('s1')).toHaveLength(1)
    expect(open().disabled).toBe(false)
  })

  it('shows whatever a thrown value says, without pretending it was an error', async () => {
    park({ send: () => Promise.reject('boom') })
    mount()
    await press(open())
    expect(host.querySelector('.da-staged-trouble')?.textContent).toBe(`${zh['pendingFailed']}boom`)
  })

  it('takes the card off without sending anything', async () => {
    const send = vi.fn(async () => [])
    park({ send })
    mount()
    await press(remove())
    expect(send).not.toHaveBeenCalled()
    expect(parkedAnnotations('s1')).toEqual([])
    expect(host.querySelector('.da-staged')).toBeNull()
  })

  it('presses the box\'s own send for an armed review, not the card\'s delivery', async () => {
    const send = vi.fn(async () => [])
    const box = stubBox({ draft: '先看这张图' })
    park({ send, armed: { shell: box.shell, text: RAW, attachmentIds: ['a1'] } })
    mount()
    // The card names the box's send, because that is the press it rides on.
    expect(host.querySelector('.da-staged-send')).toBeNull()
    // And the box is the reader's alone until that press: the annotation is not text
    // in the draft, it is what the send will carry.
    expect(box.draftText()).toBe('先看这张图')
    expect(box.added()).toEqual([])
    await act(async () => { box.shell.submit?.() })
    // One press, one send: the box's, carrying the sentence and then the block.
    expect(box.pressed()).toEqual([`先看这张图\n\n${RAW}`])
    expect(box.added()).toEqual([['a1']])
    expect(send).not.toHaveBeenCalled()
    // The send took it, so the card it stood for is spent.
    expect(parkedAnnotations('s1')).toEqual([])
    expect(host.querySelector('.da-staged')).toBeNull()
  })

  it('rides the box\'s own Send, the one the reader presses in the input', () => {
    const box = stubBox({ draft: '先看这张图' })
    park({ armed: { shell: box.shell, text: RAW, attachmentIds: ['a1'] } })
    mount()
    act(() => { box.shell.submit?.() })
    // The card is armed on the shell's send, not on a button of its own: pressing
    // Send in the input carries the block without the card being touched.
    expect(box.pressed()).toEqual([`先看这张图\n\n${RAW}`])
    expect(parkedAnnotations('s1')).toEqual([])
  })

  it('gives the box back when the box refuses to send', async () => {
    const box = stubBox({ draft: '先看这张图', press: 'refuse' })
    park({ armed: { shell: box.shell, text: RAW, attachmentIds: ['a1'] } })
    mount()
    await act(async () => { box.shell.submit?.() })
    // The send never left the box: the reader gets their sentence back without six
    // lines of coordinates, and the card stays for another press.
    expect(box.draftText()).toBe('先看这张图')
    expect(box.dropped()).toEqual(['a1'])
    expect(parkedAnnotations('s1')).toHaveLength(1)
  })

  it('stays put when the box offers nothing to press', async () => {
    const box = stubBox({ draft: '先看这张图', press: 'none' })
    park({ armed: { shell: box.shell, text: RAW, attachmentIds: [] } })
    mount()
    await act(async () => { box.shell.submit?.() })
    // Nothing was sent, and the card did not pretend otherwise.
    expect(box.pressed()).toEqual([])
    expect(parkedAnnotations('s1')).toHaveLength(1)
  })

  it('takes its arming out of the box when the reader drops the card', async () => {
    const box = stubBox({ draft: '先看这张图' })
    const release = vi.fn()
    park({
      conversation: {
        input: { shell: () => box.shell },
        releaseDraftAttachment: release,
      },
      armed: { shell: box.shell, text: RAW, attachmentIds: ['a1'] },
    })
    mount()
    await press(remove())
    // The picture and the service's hold on it go; the draft was never the card's,
    // and it comes out of the drop untouched.
    expect(box.draftText()).toBe('先看这张图')
    expect(box.dropped()).toEqual(['a1'])
    expect(release).toHaveBeenCalledWith('a1')
    expect(parkedAnnotations('s1')).toEqual([])
  })

  it('speaks the shell locale when no translator is bound', () => {
    park()
    mount({ sessionId: 's1', localeId: 'en' })
    expect(host.querySelector('.da-staged-title')?.textContent).toBe('fig.svg')
    expect(host.querySelector('.da-staged-count')?.textContent).toBe('1')
    expect(host.querySelector('.da-staged-count')?.getAttribute('aria-label')).toBe('1 annotations')
    expect(remove().getAttribute('aria-label')).toBe('Remove the annotation')
  })

  it('draws a card parked while the dock is already open', () => {
    mount()
    expect(host.querySelector('.da-staged')).toBeNull()
    act(() => { park() })
    expect(host.querySelector('.da-staged')).not.toBeNull()
  })

  it('draws a second card behind the first rather than over it', () => {
    park()
    mount()
    act(() => { park({ data: { ...DATA, file: '/w/second.svg' }, raw: RAW.replace('fig.svg', 'second.svg') }) })
    const files = [...host.querySelectorAll('.da-staged-title')].map(node => node.textContent)
    expect(files).toEqual(['fig.svg', 'second.svg'])
  })

  it('sends only the card that was pressed', async () => {
    const first = vi.fn(async () => [])
    const second = vi.fn(async () => [])
    park({ send: first })
    park({ send: second, data: { ...DATA, file: '/w/second.svg' }, raw: RAW.replace('fig.svg', 'second.svg') })
    mount()
    // Pressing the second chip sends the second review, not the first one behind it.
    await press([...host.querySelectorAll('.da-staged-send')][1] as HTMLButtonElement)
    expect(second).toHaveBeenCalledTimes(1)
    expect(first).not.toHaveBeenCalled()
    // The neighbour the reader has not sent is still there, with its own delivery.
    expect(parkedAnnotations('s1')).toHaveLength(1)
    expect(parkedAnnotations('s1')[0]?.send).toBe(first)
    expect(host.querySelectorAll('.da-staged')).toHaveLength(1)
  })

  it('injects its stylesheet into the document it draws in', () => {
    park()
    mount()
    expect(document.head.querySelector('style[data-dsh-figmark]')).not.toBeNull()
  })
})

/**
 * The card belongs inside the box, beside the reader's own attachments: the dock entry
 * only holds the anchor, and the chip is portalled into the composer card's own flow.
 */
describe('the attachment card inside the composer', () => {
  let root: Root
  let host: HTMLElement
  let card: HTMLElement

  beforeEach(() => {
    installDom()
    clearParked()
    clearThumbs()
    const region = document.createElement('div')
    region.setAttribute('data-conversation-region', 'composer')
    const dock = document.createElement('div')
    const bar = document.createElement('div')
    card = document.createElement('div')
    card.setAttribute('data-composer-card', '')
    card.innerHTML = '<span class="overlay"></span><div class="editor"></div>'
    bar.append(card)
    region.append(dock, bar)
    document.body.append(region)
    host = document.createElement('div')
    dock.append(host)
    root = createRoot(host)
  })

  afterEach(() => {
    act(() => { root.unmount() })
    document.body.innerHTML = ''
    clearParked()
    clearThumbs()
  })

  /**
   * Draw the dock for one session.
   * @param props - whatever the case is about.
   */
  function draw(props: { sessionId?: string } = { sessionId: 's1' }): void {
    act(() => { root.render(<PendingCard {...props} />) })
  }

  /**
   * Park one annotation.
   * @param send - the delivery the card will make.
   * @returns the parked entry.
   */
  function park(send: () => Promise<readonly string[]> = async () => []): UnparkedAnnotation {
    const entry: UnparkedAnnotation = {
      sessionId: 's1',
      data: DATA,
      raw: RAW,
      conversation: undefined,
      send,
    }
    parkAnnotation(entry)
    return entry
  }

  it('draws the chip inside the card, at the top, not above the box', () => {
    park()
    draw()
    const seat = defined(card.firstElementChild) as HTMLElement
    expect(seat.className).toBe('da-staged-seat')
    expect(defined(seat.querySelector('.da-staged-title')).textContent).toBe('fig.svg')
    expect(host.querySelector('.da-staged')).toBeNull()
  })

  it('leaves only a hidden anchor in the dock', () => {
    park()
    draw()
    const anchor = defined(host.querySelector('.da-staged-anchor'))
    expect(anchor.hasAttribute('hidden')).toBe(true)
  })

  it('sends from inside the card, and the chip leaves the card with it', async () => {
    const send = vi.fn(async () => [])
    park(send)
    draw()
    const button = defined(document.querySelector('.da-staged-send')) as HTMLButtonElement
    await act(async () => { button.click() })
    expect(send).toHaveBeenCalledTimes(1)
    expect(card.querySelector('.da-staged')).toBeNull()
  })

  it('moves back into the dock when the composer takes its card away', async () => {
    park()
    draw()
    expect(card.querySelector('.da-staged')).not.toBeNull()
    act(() => { card.remove() })
    await act(async () => { await Promise.resolve() })
    expect(host.querySelector('.da-staged')).not.toBeNull()
  })
})

describe('the short name of a mark', () => {
  it('keeps the kind and the number, and drops the coordinates', () => {
    expect(shortLabel('箭头1 (10,20) → (30,40)')).toBe('箭头 1')
    expect(shortLabel('矩形1 (1,2)-(3,4)')).toBe('矩形 1')
    expect(shortLabel('box 1 (1,2)-(3,4)')).toBe('box 1')
  })

  it('drops the words a point mark puts before its coordinates', () => {
    expect(shortLabel('单点1 位于 (5,6)')).toBe('单点 1')
  })

  it('leaves a name with no coordinates and no number alone', () => {
    expect(shortLabel('手绘')).toBe('手绘')
  })
})
