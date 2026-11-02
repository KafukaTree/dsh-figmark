// @vitest-environment jsdom
/** Real overlay DOM and Canvas gestures; only PNG rasterization is stubbed. */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AnnotationMark } from '../src/shared/annotation'
import {
  attachmentFocusPoint,
  AttachmentOverlay,
  type AttachmentProps,
} from '../src/client/attachment-annotator/editor'
import {
  createAttachmentStore,
  type AttachmentInput,
  type ImageDraft,
} from '../src/client/attachment-annotator/model'
import * as exporter from '../src/client/attachment-annotator/export'
import { defined, stubRect } from './dom'

const source: ImageDraft = {
  kind: 'image',
  id: 'source',
  file: new File(['original'], 'figure.png', { type: 'image/png' }),
  previewUrl: 'blob:original',
}
const pin: AnnotationMark = {
  id: 'pin1',
  kind: 'point',
  color: '#e03131',
  points: [[100, 100]],
  detail: '改这里',
}
const rect: AnnotationMark = {
  id: 'rect1',
  kind: 'rect',
  color: '#e03131',
  points: [[200, 100], [300, 200]],
  detail: '',
}
const roots: Root[] = []
let resize: ResizeObserverCallback
let revokeUrl: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn(() => 'blob:editor-owned'),
  })
  revokeUrl = vi.fn()
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: revokeUrl,
  })
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback: ResizeObserverCallback) { resize = callback }
    observe(): void {}
    disconnect(): void {}
  })
})

afterEach(() => {
  for (const root of roots.splice(0)) act(() => { root.unmount() })
  document.body.innerHTML = ''
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

interface MountOptions {
  readonly marks?: readonly AnnotationMark[]
  readonly open?: boolean
  readonly missing?: boolean
  readonly card?: boolean
  readonly name?: string
  readonly draft?: string
  readonly drafts?: readonly (ImageDraft | { readonly kind: 'file'; readonly id: string })[]
}

function mount(options: MountOptions = {}) {
  const store = createAttachmentStore()
  const image = {
    ...source,
    file: new File(['original'], options.name ?? 'figure.png', { type: 'image/png' }),
  }
  if (options.open === true) {
    store.open('s1', image)
    store.change(image, options.marks ?? [])
  }
  let input: AttachmentInput = {
    draft: options.draft ?? '',
    attachmentIds: ['source'],
    phase: 'plain',
  }
  let sessionId = 's1'
  let drafts = options.drafts ?? [image]
  const addAttachments = vi.fn((ids: readonly string[]) => {
    input = { ...input, attachmentIds: [...input.attachmentIds, ...ids] }
    render()
    return true
  })
  const createDrafts = vi.fn(() => [{ id: 'copy' }])
  const releaseDraftAttachment = vi.fn()
  const nativeOpen = vi.fn()
  const setDraft = vi.fn((text: string) => {
    input = { ...input, draft: text }
    render()
  })

  const card = document.createElement('div')
  card.dataset['composerCard'] = 'true'
  const thumbnail = document.createElement('button')
  const thumbnailImage = document.createElement('img')
  thumbnailImage.src = image.previewUrl
  thumbnailImage.alt = 'native draft'
  thumbnail.append(thumbnailImage)
  thumbnail.addEventListener('click', nativeOpen)
  const other = document.createElement('button')
  const otherImage = document.createElement('img')
  otherImage.src = 'blob:unrelated'
  other.append(otherImage)
  other.addEventListener('click', nativeOpen)
  card.append(thumbnail, other)
  const slot = document.createElement('div')
  if (options.card !== false) card.append(slot)
  else document.body.append(slot)
  document.body.append(card)

  const root = createRoot(slot)
  roots.push(root)
  function useInput<T>(select: (value: AttachmentInput) => T): T { return select(input) }
  const render = (): void => {
    act(() => {
      const props: AttachmentProps = {
        store,
        sessionId,
        conversation: options.missing === true
          ? undefined
          : {
              resolveDraftAttachments: () => drafts,
              createDrafts,
              releaseDraftAttachment,
            },
        useInput,
        inputActions: { addAttachments, setDraft },
      }
      root.render(<AttachmentOverlay {...props} />)
    })
  }
  render()
  return {
    root,
    card,
    store,
    image,
    thumbnailImage,
    otherImage,
    addAttachments,
    createDrafts,
    releaseDraftAttachment,
    nativeOpen,
    setDraft,
    render,
    setInput(value: AttachmentInput): void { input = value; render() },
    setSession(value: string): void { sessionId = value; render() },
    setDrafts(value: typeof drafts): void { drafts = value; render() },
  }
}

function control(label: string): HTMLElement {
  const labelled = Array.from(document.querySelectorAll<HTMLElement>('[aria-label]')).find(
    node => node.getAttribute('aria-label') === label,
  )
  if (labelled !== undefined) return labelled
  return defined(
    Array.from(document.querySelectorAll<HTMLElement>('button,[aria-label]')).find(
      node => node instanceof HTMLButtonElement
        && node.textContent?.replace(/\s+/gu, ' ').trim() === label,
    ),
  )
}

function click(label: string): void {
  act(() => { control(label).click() })
}

function clickText(text: string): void {
  const node = defined(
    Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(
      button => button.textContent?.replace(/\s+/gu, ' ').trim() === text,
    ),
  )
  act(() => { node.click() })
}

function loaded(width = 400, height = 300): HTMLImageElement {
  const image = defined(document.querySelector<HTMLImageElement>('img[alt="待标注原图"]'))
  Object.defineProperty(image, 'naturalWidth', { configurable: true, value: width })
  Object.defineProperty(image, 'naturalHeight', { configurable: true, value: height })
  act(() => { image.dispatchEvent(new Event('load')) })
  const svg = document.querySelector('svg.da-overlay')
  if (svg !== null) {
    stubRect(svg, { left: 0, top: 0, width, height })
    stubRect(defined(document.querySelector('.da-attachment-paper')), {
      left: 0,
      top: 0,
      width,
      height,
    })
  }
  return image
}

function measure(width = 800, height = 600): void {
  const stage = defined(document.querySelector<HTMLElement>('.da-attachment-stage'))
  Object.defineProperty(stage, 'clientWidth', { configurable: true, value: width })
  Object.defineProperty(stage, 'clientHeight', { configurable: true, value: height })
  act(() => { resize([], {} as ResizeObserver) })
}

function pointer(target: Element, type: string, x: number, y: number): void {
  act(() => {
    target.dispatchEvent(new MouseEvent(type, {
      bubbles: true,
      clientX: x,
      clientY: y,
    }))
  })
}

function key(target: Element, value: string, extra: KeyboardEventInit = {}): void {
  act(() => {
    target.dispatchEvent(new KeyboardEvent('keydown', {
      key: value,
      bubbles: true,
      cancelable: true,
      ...extra,
    }))
  })
}

function change(
  node: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  value: string,
): void {
  act(() => {
    const prototype = node instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : node instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : HTMLInputElement.prototype
    const descriptor = defined(Object.getOwnPropertyDescriptor(prototype, 'value'))
    descriptor.set?.call(node, value)
    node.dispatchEvent(new Event(
      node instanceof HTMLSelectElement ? 'change' : 'input',
      { bubbles: true },
    ))
    if (node instanceof HTMLInputElement) {
      node.dispatchEvent(new Event('change', { bubbles: true }))
    }
  })
}

async function flush(): Promise<void> {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

function deferred() {
  let resolve!: (file: File) => void
  let reject!: (error: Error) => void
  const promise = new Promise<File>((yes, no) => { resolve = yes; reject = no })
  const spy = vi.spyOn(exporter, 'exportAttachment').mockReturnValue(promise)
  return { resolve, reject, spy }
}

describe('composer thumbnail annotation overlay', () => {
  it('intercepts only the current draft thumbnail and leaves the shell lightbox alone', () => {
    const view = mount()
    act(() => { view.card.dispatchEvent(new Event('click', { bubbles: true })) })
    act(() => {
      view.thumbnailImage.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        button: 1,
      }))
    })
    expect(view.store.getSnapshot()).toBeNull()

    act(() => { view.otherImage.click() })
    expect(view.store.getSnapshot()).toBeNull()
    expect(view.nativeOpen).toHaveBeenCalledTimes(2)

    act(() => {
      defined(view.thumbnailImage.closest('button')).click()
    })
    expect(view.nativeOpen).toHaveBeenCalledTimes(2)
    expect(view.store.getSnapshot()?.source.file).toBe(view.image.file)
    expect(control('附图标注编辑器').getAttribute('role')).toBe('dialog')
  })

  it('ignores presses that cannot identify a thumbnail image', () => {
    const view = mount({ drafts: [] })
    const text = document.createTextNode('composer label')
    const emptyButton = document.createElement('button')
    const imageWithoutSource = document.createElement('img')
    view.card.append(text, emptyButton, imageWithoutSource)

    act(() => {
      text.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    act(() => {
      view.card.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    act(() => {
      emptyButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    act(() => {
      imageWithoutSource.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(view.store.getSnapshot()).toBeNull()
    expect(view.nativeOpen).not.toHaveBeenCalled()
  })

  it('waits one paint for a thumbnail whose draft has not reached the overlay yet', () => {
    const view = mount({ drafts: [] })
    act(() => { view.thumbnailImage.click() })
    expect(view.nativeOpen).not.toHaveBeenCalled()
    expect(view.store.getSnapshot()).toBeNull()

    view.setDrafts([{ ...view.image, id: 'other', previewUrl: 'blob:other' }])
    expect(view.store.getSnapshot()).toBeNull()
    view.setDrafts([view.image])
    expect(view.store.getSnapshot()?.source.file).toBe(view.image.file)
    expect(document.querySelector('.da-attachment')).not.toBeNull()
  })

  it('anchors comments for every geometry and floors missing coordinates', () => {
    expect(attachmentFocusPoint({ ...pin, kind: 'arrow', points: [[1, 2], [9, 18]] })).toEqual([9, 18])
    expect(attachmentFocusPoint({ ...pin, kind: 'arrow', points: [] })).toEqual([0, 0])
    expect(attachmentFocusPoint({ ...pin, kind: 'rect', points: [] })).toEqual([0, 0])
    expect(attachmentFocusPoint({ ...pin, kind: 'ellipse', points: [[4, 8]] })).toEqual([4, 8])
    expect(attachmentFocusPoint({ ...pin, kind: 'pen', points: [] })).toEqual([0, 0])
    expect(attachmentFocusPoint({ ...pin, kind: 'pen', points: [[0, 20], [10, 0]] })).toEqual([5, 10])
    expect(attachmentFocusPoint({ ...pin, kind: 'point', points: [] })).toEqual([0, 0])
  })

  it('does nothing outside a composer card and with an incompatible host', () => {
    const view = mount({ card: false })
    act(() => { view.thumbnailImage.click() })
    expect(view.store.getSnapshot()).toBeNull()

    const missing = mount({ missing: true, open: true, marks: [pin] })
    loaded()
    expect(document.querySelector('.da-attachment')).not.toBeNull()
    expect(document.body.textContent).toContain('仍可下载 PNG')
    expect(missing.store.getSnapshot()).not.toBeNull()
    click('加入输入框')
    expect(missing.createDrafts).not.toHaveBeenCalled()
  })

  it('renders the image, measures it, zooms it and releases only its owned URL', () => {
    const view = mount({ open: true })
    loaded()
    measure()
    expect(defined(document.querySelector<HTMLElement>('.da-attachment-paper')).style.transform).toBe('scale(1)')
    click('放大')
    expect(defined(document.querySelector<HTMLElement>('.da-attachment-paper')).style.transform).toBe('scale(1.5)')
    expect(document.body.textContent).toContain('150%')
    click('放大')
    click('放大')
    click('放大')
    expect(document.body.textContent).toContain('400%')
    click('缩小')
    expect(document.body.textContent).toContain('200%')
    expect(defined(document.querySelector<HTMLImageElement>('img[alt="待标注原图"]')).src).toBe('blob:editor-owned')
    act(() => { view.store.clear() })
    expect(revokeUrl).toHaveBeenCalledWith('blob:editor-owned')
    expect(revokeUrl).not.toHaveBeenCalledWith('blob:original')
  })

  it('blocks pointer input during generation', async () => {
    mount({ open: true, marks: [pin] })
    loaded()
    const pending = deferred()
    vi.spyOn(exporter, 'downloadAttachment').mockImplementation(() => {})
    click('下载 PNG')
    const paper = defined(document.querySelector('.da-attachment-paper'))
    let dispatched = true
    act(() => {
      dispatched = paper.dispatchEvent(new MouseEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
      }))
    })
    expect(dispatched).toBe(false)
    pending.resolve(new File(['png'], 'copy.png'))
    await flush()
  })

  it('draws a Pin, opens its adjacent comment, edits it and supports selected deletion', () => {
    const view = mount({ open: true })
    loaded()
    click('Pin 评论')
    const svg = defined(document.querySelector('svg.da-overlay'))
    pointer(svg, 'pointerdown', 80, 90)
    pointer(svg, 'pointerup', 80, 90)
    expect(view.store.getSnapshot()?.marks).toHaveLength(1)
    const textarea = defined(document.querySelector('textarea'))
    expect(document.activeElement).toBe(textarea)
    change(textarea, '调整曲线 < &')
    expect(view.store.getSnapshot()?.marks[0]?.detail).toBe('调整曲线 < &')
    expect(
      defined(textarea.closest('.da-attachment-comment-pill')).querySelectorAll('button'),
    ).toHaveLength(0)

    change(defined(document.querySelector<HTMLInputElement>('input[type=color]')), '#112233')
    expect(view.store.getSnapshot()?.marks[0]?.color).toBe('#112233')
    const section = defined(document.querySelector<HTMLElement>('section.da-attachment'))
    section.focus()
    key(section, 'Backspace')
    expect(view.store.getSnapshot()?.marks).toHaveLength(0)

    click('Pin 评论')
    pointer(svg, 'pointerdown', 40, 50)
    pointer(svg, 'pointerup', 40, 50)
    click('撤销')
    expect(view.store.getSnapshot()?.marks).toHaveLength(0)
    click('重做')
    expect(view.store.getSnapshot()?.marks).toHaveLength(1)
    key(section, 'z', { ctrlKey: true })
    expect(view.store.getSnapshot()?.marks).toHaveLength(0)
    key(section, 'Z', { metaKey: true, shiftKey: true })
    expect(view.store.getSnapshot()?.marks).toHaveLength(1)
    section.focus()
    key(section, 'Backspace')
    expect(view.store.getSnapshot()?.marks).toHaveLength(0)
  })

  it('draws continuous pen strokes, keeps the pen armed and limits a figure to 100 marks', () => {
    const full = Array.from({ length: 100 }, (_, index) => ({
      ...pin,
      id: `p${index}`,
      points: [[200, 200] as const],
    }))
    const view = mount({ open: true, marks: full })
    loaded()
    const svg = defined(document.querySelector('svg.da-overlay'))
    click('画笔')
    pointer(svg, 'pointerdown', 20, 20)
    pointer(svg, 'pointermove', 70, 70)
    pointer(svg, 'pointerup', 100, 80)
    expect(control('画笔').getAttribute('aria-pressed')).toBe('true')
    expect(view.store.getSnapshot()?.marks).toHaveLength(100)

    click('Pin 评论')
    pointer(svg, 'pointerdown', 20, 20)
    pointer(svg, 'pointerup', 20, 20)
    expect(view.store.getSnapshot()?.marks).toHaveLength(100)
    expect(document.body.textContent).toContain('最多 100')
  })

  it('moves and resizes selected shapes and focuses comments on double click', () => {
    const view = mount({ open: true, marks: [pin, rect] })
    loaded()
    const shape = defined(document.querySelector('[data-da-mark="rect1"] path:last-child'))
    pointer(shape, 'pointerdown', 240, 140)
    pointer(shape, 'pointermove', 270, 160)
    pointer(shape, 'pointerup', 270, 160)
    expect(view.store.getSnapshot()?.marks[1]?.points[0]).toEqual([230, 120])
    const handle = defined(document.querySelector('[data-da-handle="se"]'))
    pointer(handle, 'pointerdown', 330, 220)
    pointer(handle, 'pointermove', 350, 250)
    pointer(handle, 'pointerup', 350, 250)
    expect(view.store.getSnapshot()?.marks[1]?.points[1]).toEqual([350, 250])
    act(() => { shape.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })) })
    expect(document.activeElement).toBe(document.querySelector('textarea[data-mark="rect1"]'))
    key(
      defined(document.querySelector<HTMLTextAreaElement>('textarea[data-mark="rect1"]')),
      'Escape',
    )
    expect(document.querySelector('textarea[data-mark="rect1"]')).toBeNull()
  })

  it('renders comment pills for every supported mark geometry and non-text inputs', () => {
    const marks: AnnotationMark[] = [
      { id: 'arrow', kind: 'arrow', color: '#111', points: [[10, 20], [80, 90]] },
      { id: 'ellipse', kind: 'ellipse', color: '#222', points: [[20, 30], [70, 90]] },
      { id: 'pen', kind: 'pen', color: '#333', points: [[10, 70], [30, 20], [80, 60]] },
    ]
    mount({ open: true, marks })
    loaded()
    for (const mark of marks) {
      const node = defined(document.querySelector(`[data-da-mark="${mark.id}"] path:last-of-type`))
      act(() => { node.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })) })
      expect(document.querySelector(`textarea[data-mark="${mark.id}"]`)).not.toBeNull()
      act(() => {
        defined(document.querySelector<HTMLTextAreaElement>(`textarea[data-mark="${mark.id}"]`)).blur()
      })
    }
    const color = defined(document.querySelector<HTMLInputElement>('input[type=color]'))
    key(color, 'a')
    expect(document.querySelector('[role=dialog]')).not.toBeNull()
  })

  it('reports invalid and failed source images without enabling output actions', () => {
    mount({ open: true })
    loaded(0, 300)
    expect(document.body.textContent).toContain('尺寸无效')
    loaded(400, 0)
    loaded()
    act(() => {
      defined(document.querySelector('img[alt="待标注原图"]')).dispatchEvent(new Event('error'))
    })
    expect(document.body.textContent).toContain('原图加载失败')
    click('下载 PNG')
    click('加入输入框')
  })

  it('asks before discarding dirty work and supports continue, backdrop and keyboard escape', () => {
    const view = mount({ open: true, marks: [pin] })
    loaded()
    click('关闭附图标注')
    expect(document.querySelector('[role=alert]')).not.toBeNull()
    clickText('继续编辑')
    expect(document.querySelector('[role=alert]')).toBeNull()
    click('关闭附图标注')
    const section = defined(document.querySelector<HTMLElement>('section.da-attachment'))
    section.focus()
    key(section, 'Escape')
    expect(document.querySelector('[role=alert]')).not.toBeNull()
    clickText('放弃批注')
    expect(view.store.getSnapshot()).toBeNull()
    expect(document.querySelector('.da-attachment')).toBeNull()
  })

  it('closes without confirmation when empty and ignores backdrop presses that start inside', () => {
    const view = mount({ open: true })
    loaded()
    const backdrop = defined(document.querySelector<HTMLElement>('.da-attachment-backdrop'))
    act(() => {
      defined(document.querySelector('.da-attachment-dialog')).dispatchEvent(
        new MouseEvent('pointerdown', { bubbles: true }),
      )
    })
    expect(view.store.getSnapshot()).not.toBeNull()
    act(() => {
      backdrop.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    })
    expect(view.store.getSnapshot()).toBeNull()

    act(() => { view.store.open('s1', view.image) })
    click('关闭附图标注')
    expect(view.store.getSnapshot()).toBeNull()
  })

  it('closes automatically when the draft is removed, submitted or the Session changes', () => {
    const removed = mount({ open: true, marks: [pin] })
    removed.setInput({ draft: '', attachmentIds: [], phase: 'plain' })
    expect(removed.store.getSnapshot()).toBeNull()

    act(() => { removed.store.open('s1', removed.image) })
    removed.setInput({ draft: '', attachmentIds: ['source'], phase: 'submitting' })
    expect(removed.store.getSnapshot()).toBeNull()

    act(() => { removed.store.open('s1', removed.image) })
    removed.setSession('s2')
    expect(removed.store.getSnapshot()).toBeNull()
  })

  it('stages one copy and closes once the composer accepts it', async () => {
    const view = mount({ open: true, marks: [pin], draft: '先看这张图' })
    loaded()
    const pending = deferred()
    const section = defined(document.querySelector<HTMLElement>('section.da-attachment'))
    Object.defineProperty(section, 'checkVisibility', { value: () => true })
    click('加入输入框')
    click('加入输入框')
    expect(pending.spy).toHaveBeenCalledTimes(1)

    pending.resolve(new File(['copy'], 'annotated.png', { type: 'image/png' }))
    await flush()
    expect(view.createDrafts).toHaveBeenCalledTimes(1)
    expect(view.addAttachments).toHaveBeenCalledWith(['copy'])
    const draft = defined(view.setDraft.mock.calls[0]?.[0])
    expect(draft).toContain('先看这张图\n\n【附图批注】')
    expect(draft).toContain('批注：改这里')
    expect(view.store.getSnapshot()).toBeNull()
    expect(document.querySelector('.da-attachment')).toBeNull()
    expect(view.releaseDraftAttachment).not.toHaveBeenCalled()
    expect(view.image.file.name).toBe('figure.png')
  })

  it('retains work when export fails, the overlay is hidden, or marks change mid-export', async () => {
    const view = mount({ open: true, marks: [pin] })
    loaded()
    const first = deferred()
    click('加入输入框')
    first.reject(new Error('encode failed'))
    await flush()
    expect(document.body.textContent).toContain('批注已保留')
    expect(view.store.getSnapshot()?.marks).toEqual([pin])

    const second = deferred()
    click('加入输入框')
    const section = defined(document.querySelector<HTMLElement>('section.da-attachment'))
    Object.defineProperty(section, 'checkVisibility', { configurable: true, value: () => false })
    second.resolve(new File(['hidden'], 'hidden.png'))
    await flush()
    expect(document.body.textContent).toContain('浮层已关闭')
    expect(view.store.getSnapshot()?.marks).toEqual([pin])

    const third = deferred()
    Object.defineProperty(section, 'checkVisibility', { configurable: true, value: () => true })
    click('加入输入框')
    const pinPath = defined(document.querySelector('[data-da-mark="pin1"] path:last-of-type'))
    act(() => { pinPath.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })) })
    change(
      defined(document.querySelector<HTMLTextAreaElement>('textarea[data-mark="pin1"]')),
      '新的评论',
    )
    third.resolve(new File(['changed'], 'changed.png'))
    await flush()
    expect(document.body.textContent).toContain('生成过程中批注已更改')
    expect(view.createDrafts).not.toHaveBeenCalled()
  })

  it('ignores stale completion after close, removal, Session change and unmount', async () => {
    const kinds = ['close', 'remove', 'session', 'unmount'] as const
    for (const kind of kinds) {
      const view = mount({ open: true, marks: [pin] })
      loaded()
      const pending = deferred()
      click('加入输入框')
      if (kind === 'close') {
        click('关闭附图标注')
        clickText('放弃批注')
      }
      if (kind === 'remove') view.setInput({ draft: '', attachmentIds: [], phase: 'plain' })
      if (kind === 'session') view.setSession('s2')
      if (kind === 'unmount') {
        act(() => { view.root.unmount() })
        roots.splice(roots.indexOf(view.root), 1)
      }
      pending.resolve(new File(['late'], 'late.png'))
      await flush()
      expect(view.createDrafts).not.toHaveBeenCalled()
      expect(view.addAttachments).not.toHaveBeenCalled()
      document.body.innerHTML = ''
    }
  })

  it('downloads independently of the host attachment interface', async () => {
    const view = mount({ open: true, marks: [pin], missing: true })
    loaded()
    const pending = deferred()
    const download = vi.spyOn(exporter, 'downloadAttachment').mockImplementation(() => {})
    click('下载 PNG')
    pending.resolve(new File(['png'], 'copy.png'))
    await flush()
    expect(download).toHaveBeenCalled()
    expect(document.body.textContent).toContain('已下载 PNG')
    expect(view.createDrafts).not.toHaveBeenCalled()
  })
})
