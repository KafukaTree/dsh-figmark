// @vitest-environment node
/**
 * The menu's arithmetic and its row set: both are decided here rather than in the
 * component, so they can be checked without a DOM.
 */
import { describe, expect, it } from 'vitest'
import {
  MENU_EDGE,
  MENU_ROW,
  MENU_WIDTH,
  clampMenu,
  copiedText,
  figureMenuItems,
  menuSize,
  menuStep,
  pressedInsideMenu,
  relativeTo,
  type FigureMenuLabels,
} from '../src/client/figure-menu'

const labels: FigureMenuLabels = {
  sendToAgent: '发送给智能体',
  sendToComposer: '发送到对话框',
  open: '用默认应用打开',
  reveal: '在文件管理器中显示',
  copyImage: '复制图片',
  copyRelative: '复制相对地址',
  copyAbsolute: '复制绝对地址',
}

const ids = (options: { canSend: boolean; canOpen: boolean; hasRelative: boolean; hasImage: boolean }): string[] =>
  figureMenuItems(options, labels).map(item => item.id)

describe('placing the menu', () => {
  it('opens at the pointer when there is room', () => {
    expect(clampMenu({ x: 100, y: 80 }, { width: 800, height: 600 }, { width: MENU_WIDTH, height: MENU_ROW * 4 }))
      .toEqual({ left: 100, top: 80 })
  })

  it('moves back inside when the click is near the right edge', () => {
    const placed = clampMenu({ x: 790, y: 100 }, { width: 800, height: 600 }, { width: MENU_WIDTH, height: MENU_ROW * 4 })
    expect(placed.left).toBe(800 - MENU_WIDTH - MENU_EDGE)
  })

  it('moves back inside when the click is near the bottom edge', () => {
    const placed = clampMenu({ x: 100, y: 590 }, { width: 800, height: 600 }, { width: MENU_WIDTH, height: MENU_ROW * 4 })
    expect(placed.top).toBe(600 - MENU_ROW * 4 - MENU_EDGE)
  })

  it('never moves past the top or left edge of a small window', () => {
    const placed = clampMenu({ x: 0, y: 0 }, { width: 120, height: 60 }, { width: MENU_WIDTH, height: MENU_ROW * 4 })
    expect(placed).toEqual({ left: MENU_EDGE, top: MENU_EDGE })
  })

  it('moves each axis only as far as it has to', () => {
    // Near the right edge only: the top stays where it was asked for.
    const placed = clampMenu({ x: 790, y: 80 }, { width: 800, height: 600 }, { width: MENU_WIDTH, height: MENU_ROW * 4 })
    expect(placed.top).toBe(80)
  })
})

describe('naming a path relative to the workspace', () => {
  it('strips the workspace prefix', () => {
    expect(relativeTo('/w/figures/fig1.svg', '/w')).toBe('figures/fig1.svg')
  })

  it('strips a workspace that already ends in a separator', () => {
    expect(relativeTo('/w/figures/fig1.svg', '/w/')).toBe('figures/fig1.svg')
  })

  it('answers null for a figure outside the workspace', () => {
    expect(relativeTo('/elsewhere/fig1.svg', '/w')).toBeNull()
  })

  it('answers null when the workspace is not a prefix of the path', () => {
    // `/workshop` must not match workspace `/work`.
    expect(relativeTo('/workshop/fig1.svg', '/work')).toBeNull()
  })

  it('answers null when the Host named no workspace', () => {
    expect(relativeTo('/w/fig1.svg', null)).toBeNull()
  })

  it('answers null for the workspace directory itself', () => {
    expect(relativeTo('/w', '/w')).toBeNull()
  })

  it('answers null for a path that climbs out with dot segments', () => {
    // The prefix matches, so this is the only place the climb gets caught.
    expect(relativeTo('/w/../../etc/passwd', '/w')).toBeNull()
  })
})

describe('the rows the menu offers', () => {
  it('offers open, reveal, and both copies on a desktop inside the workspace', () => {
    expect(ids({ canSend: true, canOpen: true, hasRelative: true, hasImage: true }))
      .toEqual(['sendToAgent', 'sendToComposer', 'open', 'reveal', 'copyImage', 'copyRelative', 'copyAbsolute'])
  })

  it('leaves out the Host gestures when there is no desktop to perform them', () => {
    // A remote Session cannot open a file on a machine it is not running on, so
    // the rows are absent rather than shown and refused.
    expect(ids({ canSend: true, canOpen: false, hasRelative: true, hasImage: true }))
      .toEqual(['sendToAgent', 'sendToComposer', 'copyImage', 'copyRelative', 'copyAbsolute'])
  })

  it('leaves out the relative copy when the figure is outside the workspace', () => {
    expect(ids({ canSend: true, canOpen: true, hasRelative: false, hasImage: true }))
      .toEqual(['sendToAgent', 'sendToComposer', 'open', 'reveal', 'copyImage', 'copyAbsolute'])
  })

  it('keeps the absolute copy, which always exists', () => {
    expect(ids({ canSend: true, canOpen: false, hasRelative: false, hasImage: true }))
      .toEqual(['sendToAgent', 'sendToComposer', 'copyImage', 'copyAbsolute'])
  })

  it('labels every row from the dictionary', () => {
    expect(figureMenuItems({ canSend: true, canOpen: true, hasRelative: true, hasImage: true }, labels).map(item => item.label))
      .toEqual([labels.sendToAgent, labels.sendToComposer, labels.open, labels.reveal, labels.copyImage, labels.copyRelative, labels.copyAbsolute])
  })
})

describe('the press that dismisses the menu', () => {
  /** Stand-in for a press, since this suite runs without a DOM. */
  const press = (path: unknown[]): Event => ({ composedPath: () => path }) as unknown as Event

  it('counts a press whose path includes the menu', () => {
    const panel = { tagName: 'DIV' }
    expect(pressedInsideMenu(press([panel]), panel as unknown as Element)).toBe(true)
  })

  it('counts a press whose path does not', () => {
    const panel = { tagName: 'DIV' }
    expect(pressedInsideMenu(press([{ tagName: 'P' }]), panel as unknown as Element)).toBe(false)
  })

  it('leaves a menu that has not been attached alone', () => {
    expect(pressedInsideMenu(press([]), null)).toBe(false)
  })
})

describe('the hand-off rows', () => {
  it('are left out when there is nothing to hand over', () => {
    // A figure with no marks has no document to send; the rows are absent rather
    // than shown and refused.
    expect(ids({ canSend: false, canOpen: false, hasRelative: false, hasImage: true })).toEqual(['copyImage', 'copyAbsolute'])
  })

  it('come first, because handing over is what the panel is for', () => {
    expect(ids({ canSend: true, canOpen: true, hasRelative: true, hasImage: true }).slice(0, 2))
      .toEqual(['sendToAgent', 'sendToComposer'])
  })
})

describe('the picture row', () => {
  it('is left out for a figure that cannot be flattened', () => {
    // A rendered document has no layer to draw, so there is nothing to copy.
    expect(ids({ canSend: false, canOpen: false, hasRelative: false, hasImage: false })).toEqual(['copyAbsolute'])
  })
})

describe('the text a copy row puts down', () => {
  it('copies the absolute path for the absolute row', () => {
    expect(copiedText('copyAbsolute', '/w/figures/fig1.svg', '/w')).toBe('/w/figures/fig1.svg')
  })

  it('copies the workspace-relative path for the relative row', () => {
    expect(copiedText('copyRelative', '/w/figures/fig1.svg', '/w')).toBe('figures/fig1.svg')
  })

  it('copies nothing for a relative row with no workspace to name one against', () => {
    expect(copiedText('copyRelative', '/w/figures/fig1.svg', null)).toBeNull()
  })
})

describe('the box the menu occupies', () => {
  it('counts the padding and the gaps between rows, not the rows alone', () => {
    // Counting rows alone assumed 189 for seven rows, and the browser laid out 203:
    // fed a box fourteen short, the clamp believed a menu fitted that did not, and
    // the last rows were painted past the window edge.
    expect(menuSize(7).height).toBe(7 * MENU_ROW + 6 + 8)
    expect(menuSize(1).height).toBe(MENU_ROW + 8)
    expect(menuSize(7).width).toBe(MENU_WIDTH)
  })

  it('has no gap to count for a menu with nothing in it', () => {
    expect(menuSize(0).height).toBe(8)
    expect(menuSize(-3).height).toBe(8)
  })
})

describe('moving through the rows from the keyboard', () => {
  it('starts at the first row whichever way the reader goes first', () => {
    expect(menuStep('ArrowDown', -1, 7)).toBe(0)
    expect(menuStep('ArrowUp', -1, 7)).toBe(6)
  })

  it('wraps at both ends, so a seven-row menu behaves like a two-row one', () => {
    expect(menuStep('ArrowDown', 6, 7)).toBe(0)
    expect(menuStep('ArrowUp', 0, 7)).toBe(6)
  })

  it('walks one row at a time in between', () => {
    expect(menuStep('ArrowDown', 2, 7)).toBe(3)
    expect(menuStep('ArrowUp', 2, 7)).toBe(1)
  })

  it('jumps to either end on Home and End', () => {
    expect(menuStep('Home', 4, 7)).toBe(0)
    expect(menuStep('End', 4, 7)).toBe(6)
  })

  it('leaves every other key to the rest of the page', () => {
    for (const key of ['Enter', ' ', 'a', 'Tab', 'ArrowLeft']) {
      expect(menuStep(key, 2, 7)).toBeNull()
    }
  })

  it('has nowhere to go in a menu with no rows', () => {
    expect(menuStep('ArrowDown', -1, 0)).toBeNull()
    expect(menuStep('Home', 0, 0)).toBeNull()
  })
})
