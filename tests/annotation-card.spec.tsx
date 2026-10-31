// @vitest-environment jsdom
/** The card in the reader's own bubble: what it draws, and what it leaves alone. */
import { act, type ReactElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AnnotationCard, readAnnotation, readCardMarkLabel } from '../src/client/annotation-card'
import { clearThumbs, rememberThumb } from '../src/client/annotation-thumb'
import { fallbackTranslate, zh } from '../src/client/locales'
import { defined, installDom } from './dom'

/** The block the sheet delivers, exactly as it is delivered. */
const RAW = [
  '【附图标注】/w/fig.svg（图面 1440×800，标注 2 处）',
  '',
  '目标：把右上角的线拉直',
  '',
  '箭头1 (10,20) → (30,40)，批注：往右上拉一点',
  '矩形1 (1,2)-(3,4)，（未写说明）',
  '',
  '逐条改生成源。',
].join('\n')

/** The parsed block, as the rule hands it to the card. */
const DATA = {
  file: '/w/fig.svg',
  scope: '图面 1440×800，标注 2 处',
  target: '把右上角的线拉直',
  instruction: '逐条改生成源。',
  html: false,
  marks: [
    { label: '箭头1 (10,20) → (30,40)', comment: '往右上拉一点', missing: false, page: undefined },
    { label: '矩形1 (1,2)-(3,4)', comment: '', missing: true, page: 2 },
  ],
}

/** One node, as the keyed slot hands it over. */
function node(data: unknown): { readonly data?: unknown } {
  return { data }
}

describe('reading a block back out of its data', () => {
  it('reads the fields the card draws', () => {
    expect(readAnnotation(DATA)).toEqual(DATA)
  })

  it('reads an absent goal and an absent note as nothing said', () => {
    const { file, scope, marks, html } = DATA
    // A block from a message that stated no goal and no closing sentence: the card
    // draws neither row rather than the word "undefined".
    expect(readAnnotation({ file, scope, marks, html })).toMatchObject({ target: '', instruction: '' })
  })

  it('refuses anything that is not a block it can draw', () => {
    for (const value of [
      undefined,
      null,
      'a string',
      [],
      { ...DATA, file: '' },
      { ...DATA, scope: 3 },
      { ...DATA, marks: undefined },
      { ...DATA, marks: [null] },
      { ...DATA, marks: [{ label: 'x' }] },
      { ...DATA, marks: [{ label: 'x', comment: 1 }] },
    ]) {
      expect(readAnnotation(value)).toBeUndefined()
    }
  })

  it('keeps what one mark line says and nothing more', () => {
    const parsed = readAnnotation({ ...DATA, marks: [{ label: 'l', comment: 'c', page: '2', missing: 'yes' }] })
    expect(parsed?.marks).toEqual([{ label: 'l', comment: 'c', missing: false, page: undefined }])
  })
})

describe('the parts of one mark line', () => {
  it('separates an element name, its source locator, and a warning', () => {
    expect(readCardMarkLabel(
      '元素1 (48,83)-(648,125)（元素文字「滑套 34」，<h1 id="paper-title">）（超出图面：右 187 像素）',
    )).toEqual({
      name: '元素 1',
      geometry: '(48,83)-(648,125)',
      tag: '<h1>',
      element: '滑套 34',
      locator: '<h1 id="paper-title">',
      aside: '（超出图面：右 187 像素）',
    })
  })

  it('reads the English spelling without leaking its punctuation', () => {
    expect(readCardMarkLabel(
      'element 2 (1,2)-(3,4) (element title "Save", selector #tools > button:nth-of-type(1)) (outside the figure: right 12px)',
    )).toEqual({
      name: 'element 2',
      geometry: '(1,2)-(3,4)',
      tag: '',
      element: 'Save',
      locator: '#tools > button:nth-of-type(1)',
      aside: '(outside the figure: right 12px)',
    })
  })

  it('keeps a plain shape as a name, a position, and nothing invented', () => {
    expect(readCardMarkLabel('单点1 位于 (5,6)')).toEqual({
      name: '单点 1',
      geometry: '位于 (5,6)',
      tag: '',
      element: '',
      locator: '',
      aside: '',
    })
    expect(readCardMarkLabel('element')).toEqual({
      name: 'element',
      geometry: '',
      tag: '',
      element: '',
      locator: '',
      aside: '',
    })
  })
})

describe('the card in a sent bubble', () => {
  let root: Root
  let host: HTMLElement

  beforeEach(() => {
    installDom()
    clearThumbs()
    host = document.createElement('div')
    document.body.appendChild(host)
    root = createRoot(host)
  })

  afterEach(() => {
    act(() => { root.unmount() })
    host.remove()
    clearThumbs()
  })

  /**
   * Draw one card.
   * @param element - the card, with whatever props the case is about.
   */
  function mount(element: ReactElement): void {
    act(() => { root.render(element) })
  }

  /** The card's root element. */
  function card(): Element {
    return defined(host.querySelector('.da-card'))
  }

  /** One class's text, in document order. */
  function texts(selector: string): string[] {
    return [...host.querySelectorAll(selector)].map(node => node.textContent ?? '')
  }

  it('names the figure, its compact facts, and what each mark asked for', () => {
    mount(<AnnotationCard node={node(DATA)} raw={RAW} />)
    expect(host.querySelector('.da-card-title')?.textContent).toBe('fig.svg')
    // Dimensions and a count are the scan-level facts. The full scope remains in the
    // tooltip, rather than spending a second Chinese sentence on the card's face.
    expect(host.querySelector('.da-card-meta')?.textContent).toBe('1440×800')
    expect(host.querySelector('.da-card-tally')?.textContent).toBe('2')
    expect(host.querySelector('.da-card-type')?.textContent).toBe('FIG')
    expect(texts('.da-card-kind')).toEqual(['1', '2'])
    expect(texts('.da-card-name')).toEqual(['箭头', '矩形'])
    expect(texts('.da-card-geometry')).toEqual(['(10,20) → (30,40)', '(1,2)-(3,4)'])
    expect(texts('.da-card-said')).toEqual(['往右上拉一点'])
    expect(host.querySelector('.da-card-target')?.textContent).toBe('目标把右上角的线拉直')
    // The closing sentence is the host's boilerplate, not the reader's words.
    expect(host.textContent).not.toContain('逐条改生成源')
  })

  it('names the page a mark is on, apart from the mark itself', () => {
    mount(<AnnotationCard node={node(DATA)} raw={RAW} />)
    const pages = texts('.da-card-page')
    expect(pages).toEqual(['第 2 页'])
    // The page is a property of the line, so it is not repeated inside the mark's name.
    expect(texts('.da-card-mark')).toEqual([
      '箭头',
      '第 2 页矩形',
    ])
  })

  it('reads a name off a path with either slash, and drops dimensions when empty', () => {
    mount(<AnnotationCard node={node({ ...DATA, file: 'C:\\tmp\\a.png', scope: '' })} raw={RAW} />)
    expect(host.querySelector('.da-card-title')?.textContent).toBe('a.png')
    expect(host.querySelector('.da-card-meta')).toBeNull()
  })

  it('keeps a name that carries no path at all', () => {
    mount(<AnnotationCard node={node({ ...DATA, file: 'a.png', scope: '' })} raw={RAW} />)
    expect(host.querySelector('.da-card-title')?.textContent).toBe('a.png')
  })

  it('draws the goal first and the marks after it, labelled as the goal', () => {
    mount(<AnnotationCard node={node(DATA)} raw={RAW} />)
    expect(host.querySelector('.da-card-target')?.textContent).toBe('目标把右上角的线拉直')
    expect(host.querySelector('.da-card-goal')?.textContent).toBe(zh['cardGoal'])
  })

  it('speaks English when the shell bound an English translator', () => {
    const t = (key: string, vars?: Record<string, string | number>): string =>
      fallbackTranslate('en', key, vars)
    mount(<AnnotationCard node={node(DATA)} raw={RAW} t={t} />)
    expect(host.querySelector('.da-card-page')?.textContent).toBe('page 2')
    expect(host.querySelector('.da-card-goal')?.textContent).toBe('Goal')
  })

  it('marks a rendered HTML review as HTML rather than as a picture', () => {
    mount(<AnnotationCard node={node({ ...DATA, html: true })} raw={RAW} />)
    expect(host.querySelector('.da-card-type')?.textContent).toBe('HTML')
  })

  it('keeps an element row compact while retaining the source in its tooltip', () => {
    const label = '元素1 (48,83)-(648,125)（元素文字「滑套 34」，<h1 id="paper-title">）（超出图面：右 187 像素）'
    mount(<AnnotationCard
      node={node({ ...DATA, marks: [{ label, comment: '', missing: true, page: undefined }] })}
      raw={RAW}
    />)
    expect(host.querySelector('.da-card-kind')?.textContent).toBe('1')
    expect(host.querySelector('.da-card-tag')?.textContent).toBe('<h1>')
    expect(host.querySelector('.da-card-name')?.textContent).toBe('滑套 34')
    // An element's coordinates stay in the tooltip rather than squeeze its words.
    expect(host.querySelector('.da-card-geometry')).toBeNull()
    expect(host.querySelector('.da-card-row')?.getAttribute('title')).toBe(label)
    expect(host.querySelector('.da-card-element')).toBeNull()
    expect(host.querySelector('.da-card-locator')).toBeNull()
    expect(host.querySelector('.da-card-warning')?.textContent).toBe('（超出图面：右 187 像素）')
  })

  it('draws no goal row when the reader wrote none', () => {
    mount(<AnnotationCard node={node({ ...DATA, target: '' })} raw={RAW} />)
    expect(host.querySelector('.da-card-target')).toBeNull()
  })

  it('stops listing marks after five and says how many are left', () => {
    const marks = Array.from({ length: 8 }, (_unused, index) => ({
      label: `箭头${String(index + 1)}`, comment: '', missing: true, page: undefined,
    }))
    mount(<AnnotationCard node={node({ ...DATA, marks })} raw={RAW} />)
    expect(host.querySelectorAll('.da-card-mark')).toHaveLength(5)
    expect(host.querySelector('.da-card-rest')?.textContent).toBe('还有 3 处')
  })

  it('shows the picture of this block when this page drew one', () => {
    rememberThumb(RAW, 'data:image/webp;base64,AAAA')
    mount(<AnnotationCard node={node(DATA)} raw={RAW} />)
    expect(defined(host.querySelector('.da-card-shot img')).getAttribute('src')).toBe('data:image/webp;base64,AAAA')
  })

  it('falls back to the icon when there is no picture, and when it will not load', () => {
    mount(<AnnotationCard node={node(DATA)} raw={RAW} />)
    expect(host.querySelector('.da-card-shot img')).toBeNull()
    expect(host.querySelector('.da-card-glyph')).not.toBeNull()

    rememberThumb(RAW, 'data:image/webp;base64,AAAA')
    mount(<AnnotationCard node={node(DATA)} raw={RAW} />)
    act(() => { defined(host.querySelector('.da-card-shot img')).dispatchEvent(new Event('error')) })
    // A picture that cannot be decoded leaves the card as it was before: the icon.
    expect(host.querySelector('.da-card-shot img')).toBeNull()
    expect(host.querySelector('.da-card-glyph')).not.toBeNull()
  })

  it('opens the figure it names when it is clicked', () => {
    const open = vi.fn()
    mount(<AnnotationCard node={node(DATA)} raw={RAW} open={open} />)
    const button = defined(host.querySelector('button.da-card')) as HTMLButtonElement
    expect(button.getAttribute('title')).toContain('/w/fig.svg')
    act(() => { button.click() })
    expect(open).toHaveBeenCalledWith('/w/fig.svg')
  })

  it('opens the figure from its picture too, which is the copy the bubble keeps', () => {
    // The shell's full-width preview of the same figure is hidden under a sent card,
    // so the picture inside the card is the only one left to click: it has to be the
    // way in, not decoration.
    const open = vi.fn()
    rememberThumb(RAW, 'data:image/webp;base64,AAAA')
    mount(<AnnotationCard node={node(DATA)} raw={RAW} open={open} />)
    act(() => { (defined(host.querySelector('.da-card-shot img')) as HTMLElement).click() })
    expect(open).toHaveBeenCalledWith('/w/fig.svg')
  })

  it('is inert where the message is not a sent bubble yet', () => {
    const open = vi.fn()
    mount(<AnnotationCard node={node(DATA)} raw={RAW} interactive={false} open={open} />)
    // The dock's card has no Sidebar tab to open and no bubble to click, so nothing
    // around it is a button — but it still lists what is about to be sent, because
    // that is the whole point of holding it there instead of sending it.
    expect(host.querySelector('button')).toBeNull()
    expect(card().hasAttribute('data-static')).toBe(true)
    expect(host.querySelector('.da-card-go')).toBeNull()
    // Two marks and the goal line.
    expect(host.querySelectorAll('.da-card-row')).toHaveLength(3)
  })

  it('is inert when nothing can open a figure', () => {
    mount(<AnnotationCard node={node(DATA)} raw={RAW} />)
    expect(host.querySelector('button')).toBeNull()
    expect(card().hasAttribute('data-static')).toBe(true)
  })

  it('shows the block as text when its data is not one it can draw', () => {
    for (const data of [undefined, {}, 'raw', { file: '/w/a.svg' }]) {
      mount(<AnnotationCard node={node(data)} raw={RAW} />)
      expect(host.querySelector('.da-card')).toBeNull()
      expect(host.querySelector('.da-card-fallback')?.textContent).toBe(RAW)
    }
  })

  it('shows an empty label when neither the node nor the text reached it', () => {
    mount(<AnnotationCard />)
    expect(host.querySelector('.da-card')).toBeNull()
    expect(host.querySelector('.da-card-fallback')?.textContent).toBe('')
  })

  it('shows the block as text when no node reached it at all', () => {
    mount(<AnnotationCard raw={RAW} />)
    expect(host.querySelector('.da-card-fallback')?.textContent).toBe(RAW)
  })

  it('brings its own stylesheet, because a transcript is drawn before any figure is', () => {
    expect(document.head.querySelector('style[data-dsh-figmark]')).toBeNull()
    mount(<AnnotationCard node={node(DATA)} raw={RAW} />)
    const style = defined(document.head.querySelector('style[data-dsh-figmark]'))
    expect(style.textContent).toContain('.da-card{')
    // Mounting a second card must not stack a second copy of the same sheet.
    mount(<AnnotationCard node={node(DATA)} raw={RAW} />)
    expect(document.head.querySelectorAll('style[data-dsh-figmark]')).toHaveLength(1)
  })
})
