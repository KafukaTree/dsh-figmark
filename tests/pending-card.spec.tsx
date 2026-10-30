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
import { clearParked, parkAnnotation, parkedAnnotation, type ParkedAnnotation } from '../src/client/pending'
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
  function park(overrides: Partial<ParkedAnnotation> = {}): ParkedAnnotation {
    const entry: ParkedAnnotation = {
      sessionId: 's1',
      data: DATA,
      raw: RAW,
      conversation: undefined,
      send: async () => {},
      ...overrides,
    }
    parkAnnotation(entry)
    return entry
  }

  /** The card's one action. */
  function open(): HTMLButtonElement {
    return defined(host.querySelector('.da-staged-open')) as HTMLButtonElement
  }

  /** The remove control. */
  function remove(): HTMLButtonElement {
    return defined(host.querySelector('.da-staged-x')) as HTMLButtonElement
  }

  /** Wait for one press to settle. */
  async function press(button: HTMLButtonElement): Promise<void> {
    await act(async () => { button.click() })
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

  it('draws an attachment chip: figure, count, file, and the first mark', () => {
    park()
    mount()
    expect(host.querySelector('.da-staged-title')?.textContent).toBe(zh['title'])
    expect(host.querySelector('.da-staged-count')?.textContent).toBe('1 处')
    expect(host.querySelector('.da-staged-file')?.textContent).toBe('fig.svg')
    expect(host.querySelector('.da-staged-shape')?.textContent).toBe('箭头 1')
    expect(host.querySelector('.da-staged-said')?.textContent).toBe('往右上拉一点')
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
      .toBe('箭头1 (10,20) → (30,40) · 批注：往右上拉一点')
  })

  it('names the send on the card itself, not with a button row', () => {
    park()
    mount()
    expect(open().getAttribute('title')).toBe(zh['pendingSendHint'])
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
    expect(host.querySelector('.da-staged-count')?.textContent).toBe('3 处')
    expect(host.querySelectorAll('.da-staged-line')).toHaveLength(1)
    expect(host.querySelector('.da-staged-shape')?.textContent).toBe('矩形 1')
    expect(host.querySelector('.da-staged-said')?.textContent).toBe('再高一点')
  })

  it('says a mark came without a note rather than showing an empty line', () => {
    park({
      data: { ...DATA, marks: [{ label: '矩形1 (1,2)-(3,4)', comment: '', missing: true, page: undefined }] },
    })
    mount()
    expect(host.querySelector('.da-staged-said')?.textContent).toBe(zh['emptyDetail'])
  })

  it('draws the head of a block that has no marks left', () => {
    park({ data: { ...DATA, marks: [] } })
    mount()
    expect(host.querySelector('.da-staged-count')?.textContent).toBe('0 处')
    expect(host.querySelector('.da-staged-line')).toBeNull()
  })

  it('names the file alone when the block wrote no scope', () => {
    park({ data: { ...DATA, scope: '' } })
    mount()
    expect(host.querySelector('.da-staged-card')?.getAttribute('title')).toBe('/w/fig.svg')
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

  it('sends the parked delivery once, and the card is spent', async () => {
    const send = vi.fn(async () => {})
    park({ send })
    mount()
    await press(open())
    expect(send).toHaveBeenCalledTimes(1)
    expect(parkedAnnotation('s1')).toBeUndefined()
    expect(host.querySelector('.da-staged')).toBeNull()
  })

  it('holds the card while the message is on its way', async () => {
    let release: (() => void) | undefined
    const send = vi.fn((): Promise<void> => new Promise<void>((resolve) => { release = resolve }))
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
    expect(parkedAnnotation('s1')).toBeDefined()
    expect(open().disabled).toBe(false)
  })

  it('shows whatever a thrown value says, without pretending it was an error', async () => {
    park({ send: () => Promise.reject('boom') })
    mount()
    await press(open())
    expect(host.querySelector('.da-staged-trouble')?.textContent).toBe(`${zh['pendingFailed']}boom`)
  })

  it('takes the card off without sending anything', async () => {
    const send = vi.fn(async () => {})
    park({ send })
    mount()
    await press(remove())
    expect(send).not.toHaveBeenCalled()
    expect(parkedAnnotation('s1')).toBeUndefined()
    expect(host.querySelector('.da-staged')).toBeNull()
  })

  it('speaks the shell locale when no translator is bound', () => {
    park()
    mount({ sessionId: 's1', localeId: 'en' })
    expect(host.querySelector('.da-staged-title')?.textContent).toBe('Figure annotations')
    expect(host.querySelector('.da-staged-count')?.textContent).toBe('1 marks')
    expect(remove().getAttribute('aria-label')).toBe('Remove the annotation')
  })

  it('draws a card parked while the dock is already open', () => {
    mount()
    expect(host.querySelector('.da-staged')).toBeNull()
    act(() => { park() })
    expect(host.querySelector('.da-staged')).not.toBeNull()
  })

  it('replaces a card that was parked over', () => {
    park()
    mount()
    act(() => { park({ data: { ...DATA, file: '/w/second.svg' }, raw: RAW.replace('fig.svg', 'second.svg') }) })
    expect(host.querySelector('.da-staged-file')?.textContent).toBe('second.svg')
  })

  it('injects its stylesheet into the document it draws in', () => {
    park()
    mount()
    expect(document.head.querySelector('style[data-dsh-figmark]')).not.toBeNull()
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
