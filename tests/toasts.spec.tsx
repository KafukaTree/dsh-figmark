// @vitest-environment jsdom
/** The bubbles over the figure: what is said, what is kept, and what leaves. */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  TOAST_LIFE_MS, TOAST_LIMIT, ToastStack, dropToast, dropTone, pushToast, type Toast,
} from '../src/client/annotator/toasts'
import { defined } from './dom'

/** A bubble, as the body would build one. */
function toast(id: number, tone: Toast['tone'] = 'ok', text = `第 ${id} 条`): Toast {
  return { id, tone, text }
}

describe('the stack', () => {
  it('puts the newest first, which is nearest the bar', () => {
    const list = pushToast(pushToast([], toast(1)), toast(2))
    expect(list.map(one => one.id)).toEqual([2, 1])
  })

  it('keeps only the last few, because a fourth bubble is a log', () => {
    let list: readonly Toast[] = []
    for (let id = 1; id <= TOAST_LIMIT + 2; id += 1) list = pushToast(list, toast(id))
    expect(list).toHaveLength(TOAST_LIMIT)
    expect(list.map(one => one.id)).toEqual([TOAST_LIMIT + 2, TOAST_LIMIT + 1, TOAST_LIMIT])
  })

  it('takes one out by its identity and leaves the rest', () => {
    const list = [toast(3), toast(2), toast(1)]
    expect(dropToast(list, 2).map(one => one.id)).toEqual([3, 1])
    // Nothing to take is not an error: a bubble can be dismissed after it has gone.
    expect(dropToast(list, 99)).toHaveLength(3)
  })

  it('takes back every failure at once', () => {
    // A save that went through retires the failure it was answering, and only that:
    // the handoff news next to it is not this one's to drop.
    const list = [toast(3, 'error'), toast(2, 'ok'), toast(1, 'error')]
    expect(dropTone(list, 'error').map(one => one.id)).toEqual([2])
  })
})

describe('the bubbles drawn', () => {
  let host: HTMLDivElement
  let root: Root
  const dismiss = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers()
    dismiss.mockReset()
    host = document.createElement('div')
    document.body.append(host)
    root = createRoot(host)
  })

  afterEach(() => {
    act(() => { root.unmount() })
    host.remove()
    vi.useRealTimers()
  })

  /** Draw one stack. */
  function draw(toasts: readonly Toast[]): void {
    act(() => {
      root.render(<ToastStack toasts={toasts} label="关闭" onDismiss={dismiss} />)
    })
  }

  /** Let the clock run. */
  function waitFor(ms: number): void {
    act(() => { vi.advanceTimersByTime(ms) })
  }

  it('draws nothing at all when there is nothing to say', () => {
    draw([])
    expect(host.querySelector('.da-toasts')).toBeNull()
  })

  it('draws one bubble per line, in the order the stack holds them', () => {
    draw([toast(2, 'ok', '已写入草稿'), toast(1, 'error', '保存失败')])
    const texts = [...host.querySelectorAll('.da-toast-text')].map(node => node.textContent)
    expect(texts).toEqual(['已写入草稿', '保存失败'])
    expect(host.querySelector('.da-toasts')?.getAttribute('aria-live')).toBe('polite')
  })

  it('says what kind of news it is with a dot and an attribute, not green words', () => {
    // The sentence is the panel's own colour; the tone is the small mark beside it.
    draw([toast(1, 'ok'), toast(2, 'info')])
    const [ok, info] = [...host.querySelectorAll('.da-toast')]
    expect(ok?.getAttribute('data-tone')).toBe('ok')
    // "Nothing to report" has no tone to mark, so the dot stays neutral.
    expect(info?.hasAttribute('data-tone')).toBe(false)
    expect(ok?.querySelector('.da-toast-dot')).not.toBeNull()
  })

  it('gives each bubble a way out', () => {
    draw([toast(7)])
    act(() => { defined(host.querySelector<HTMLButtonElement>('.da-toast-close')).click() })
    expect(dismiss).toHaveBeenCalledWith(7)
  })

  it('takes an answer away on its own, so the figure is clear again', () => {
    draw([toast(4, 'ok')])
    waitFor(TOAST_LIFE_MS - 1)
    expect(dismiss).not.toHaveBeenCalled()
    waitFor(1)
    expect(dismiss).toHaveBeenCalledWith(4)
  })

  it('leaves a failure until it is read', () => {
    // A failure is the news the reader has to act on; one that leaves first has said
    // nothing, and the mark it is about is still unsaved.
    draw([toast(5, 'error')])
    waitFor(TOAST_LIFE_MS * 10)
    expect(dismiss).not.toHaveBeenCalled()
  })

  it('stops counting down once the bubble is gone', () => {
    // The timer belongs to the bubble: a stack that re-renders under it must not leave
    // a stale countdown behind that dismisses an id nobody is looking at any more.
    draw([toast(6)])
    draw([])
    waitFor(TOAST_LIFE_MS)
    expect(dismiss).not.toHaveBeenCalled()
  })
})
