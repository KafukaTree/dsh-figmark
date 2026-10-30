// @vitest-environment jsdom
/** The card in the reader's own bubble: what it draws, and what it leaves alone. */
import { act, type ReactElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AnnotationCard, readAnnotation } from '../src/client/annotation-card'
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

  /** Every row the card lists. */
  function rows(): string[] {
    return [...host.querySelectorAll('.da-card-row')].map(row => row.textContent ?? '')
  }

  it('names the figure, its size, and what each mark asked for', () => {
    mount(<AnnotationCard node={node(DATA)} raw={RAW} />)
    expect(host.querySelector('.da-card-title')?.textContent).toBe(zh['title'])
    // The file's own name leads, because the directory is the same for every figure
    // this session saved and the block's own scope is what coordinates are read against.
    expect(host.querySelector('.da-card-scope')?.textContent).toBe('fig.svg · 图面 1440×800，标注 2 处')
    expect(rows()).toEqual([
      '箭头1 (10,20) → (30,40)往右上拉一点',
      '第 2 页矩形1 (1,2)-(3,4)',
      '目标把右上角的线拉直',
    ])
    // The closing sentence is the host's boilerplate, not the reader's words.
    expect(host.textContent).not.toContain('逐条改生成源')
  })

  it('names the page a mark is on, apart from the mark itself', () => {
    mount(<AnnotationCard node={node(DATA)} raw={RAW} />)
    const pages = [...host.querySelectorAll('.da-card-page')].map(page => page.textContent)
    expect(pages).toEqual(['第 2 页'])
    // The page is a property of the line, so it is not repeated inside the mark's name.
    expect([...host.querySelectorAll('.da-card-mark')].map(mark => mark.textContent)).toEqual([
      '箭头1 (10,20) → (30,40)',
      '第 2 页矩形1 (1,2)-(3,4)',
    ])
  })

  it('reads a name off a path with either slash, and drops the scope when empty', () => {
    mount(<AnnotationCard node={node({ ...DATA, file: 'C:\\tmp\\a.png', scope: '' })} raw={RAW} />)
    expect(host.querySelector('.da-card-scope')?.textContent).toBe('a.png')
  })

  it('keeps a name that carries no path at all', () => {
    mount(<AnnotationCard node={node({ ...DATA, file: 'a.png', scope: '' })} raw={RAW} />)
    expect(host.querySelector('.da-card-scope')?.textContent).toBe('a.png')
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

  it('is inert where the message is not a sent bubble yet', () => {
    const open = vi.fn()
    mount(<AnnotationCard node={node(DATA)} raw={RAW} interactive={false} open={open} />)
    // The queue dock has no Sidebar tab to open and no bubble to click: it is a label.
    expect(host.querySelector('button')).toBeNull()
    expect(card().hasAttribute('data-static')).toBe(true)
    expect(host.querySelector('.da-card-go')).toBeNull()
    expect(rows()).toHaveLength(0)
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
