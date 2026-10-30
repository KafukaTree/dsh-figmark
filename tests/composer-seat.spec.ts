// @vitest-environment jsdom
/**
 * Where the parked card is drawn: inside the composer card, above the rail and the
 * editor, and still there after the card is redrawn.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { composerCard, mountSeat } from '../src/client/composer-seat'
import { defined, installDom } from './dom'

/** One composer, laid out the way the conversation package does it. */
interface Composer {
  /** The composer region, which holds the dock and the card both. */
  readonly region: HTMLElement
  /** Where the dock entry lives. */
  readonly dock: HTMLElement
  /** The card the conversation package draws. */
  readonly card: HTMLElement
}

/**
 * Build a composer: the region, the dock, and a card inside the input bar.
 * @returns the nodes the cases reach for.
 */
function composer(): Composer {
  const region = document.createElement('div')
  region.setAttribute('data-conversation-region', 'composer')
  const stack = document.createElement('div')
  const dock = document.createElement('div')
  const bar = document.createElement('div')
  const card = document.createElement('div')
  card.setAttribute('data-composer-card', '')
  card.innerHTML = '<span class="overlay"></span><div class="editor"></div>'
  bar.append(card)
  stack.append(dock, bar)
  region.append(stack)
  document.body.append(region)
  return { region, dock, card }
}

/** Let a MutationObserver callback run. */
function settle(): Promise<void> {
  return new Promise((done) => { setTimeout(done, 0) })
}

describe('the composer card the parked card is drawn in', () => {
  beforeEach(() => { installDom() })
  afterEach(() => { document.body.innerHTML = '' })

  it('finds the card from a node in the dock, past its own ancestors', () => {
    const { dock, card } = composer()
    const inner = document.createElement('div')
    dock.append(inner)
    expect(composerCard(inner)).toBe(card)
  })

  it('finds no card when the composer has not drawn one', () => {
    const loose = document.createElement('div')
    document.body.append(loose)
    expect(composerCard(loose)).toBeNull()
  })

  it('draws the seat as the card first child, so it sits above the rail and the editor', () => {
    const { dock, card } = composer()
    const anchor = document.createElement('span')
    dock.append(anchor)
    const seen: (HTMLElement | null)[] = []
    const off = mountSeat(anchor, (seat) => { seen.push(seat) })
    const seat = defined(card.firstElementChild) as HTMLElement
    expect(seat.className).toBe('da-staged-seat')
    expect(defined(seen[0])).toBe(seat)
    off()
  })

  it('follows the card when the composer redraws it', async () => {
    const { dock, card } = composer()
    const anchor = document.createElement('span')
    dock.append(anchor)
    const seen: (HTMLElement | null)[] = []
    const off = mountSeat(anchor, (seat) => { seen.push(seat) })
    const seat = defined(card.firstElementChild) as HTMLElement
    const redrawn = document.createElement('div')
    redrawn.setAttribute('data-composer-card', '')
    card.replaceWith(redrawn)
    await settle()
    expect(redrawn.firstElementChild).toBe(seat)
    expect(seen.at(-1)).toBe(seat)
    off()
  })

  it('draws in the dock when there is no card, then moves in once one appears', async () => {
    const region = document.createElement('div')
    region.setAttribute('data-conversation-region', 'composer')
    const dock = document.createElement('div')
    region.append(dock)
    document.body.append(region)
    const anchor = document.createElement('span')
    dock.append(anchor)
    const seen: (HTMLElement | null)[] = []
    const off = mountSeat(anchor, (seat) => { seen.push(seat) })
    expect(seen).toEqual([null])
    const card = document.createElement('div')
    card.setAttribute('data-composer-card', '')
    region.append(card)
    await settle()
    expect(card.firstElementChild).toBe(defined(seen.at(-1)))
    off()
  })

  it('takes the seat down with the card, and stops watching', async () => {
    const { dock, card } = composer()
    const anchor = document.createElement('span')
    dock.append(anchor)
    const seen: (HTMLElement | null)[] = []
    const off = mountSeat(anchor, (seat) => { seen.push(seat) })
    const seat = defined(card.firstElementChild) as HTMLElement
    off()
    expect(seat.isConnected).toBe(false)
    expect(seen.at(-1)).toBeNull()
    const redrawn = document.createElement('div')
    redrawn.setAttribute('data-composer-card', '')
    card.replaceWith(redrawn)
    await settle()
    expect(redrawn.firstElementChild).toBeNull()
  })

  it('reports no seat for an anchor that is not in a document at all', () => {
    const anchor = document.createElement('span')
    const seen: (HTMLElement | null)[] = []
    const off = mountSeat(anchor, (seat) => { seen.push(seat) })
    expect(seen).toEqual([null])
    off()
  })

  it('leaves the seat alone while the composer keeps redrawing the same card', async () => {
    const { dock, card } = composer()
    const anchor = document.createElement('span')
    dock.append(anchor)
    const seen: (HTMLElement | null)[] = []
    const off = mountSeat(anchor, (seat) => { seen.push(seat) })
    const seat = defined(card.firstElementChild) as HTMLElement
    const editor = defined(card.querySelector('.editor'))
    editor.append(document.createElement('span'))
    await settle()
    expect(card.firstElementChild).toBe(seat)
    expect(seen.length).toBeGreaterThan(1)
    expect(seen.every((entry) => entry === seat)).toBe(true)
    off()
  })

  it('survives a card that is taken away', async () => {
    const { dock, card } = composer()
    const anchor = document.createElement('span')
    dock.append(anchor)
    const seen: (HTMLElement | null)[] = []
    const off = mountSeat(anchor, (seat) => { seen.push(seat) })
    card.remove()
    await settle()
    expect(seen.at(-1)).toBeNull()
    off()
  })

  it('does not throw when the seat is taken down twice', () => {
    const { dock, card } = composer()
    const anchor = document.createElement('span')
    dock.append(anchor)
    const off = mountSeat(anchor, vi.fn())
    const seat = defined(card.firstElementChild) as HTMLElement
    off()
    expect(seat.isConnected).toBe(false)
  })
})
