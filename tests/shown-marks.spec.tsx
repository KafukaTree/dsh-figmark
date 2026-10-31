// @vitest-environment jsdom
/**
 * Which marks the page in front is showing: the read, the draw list, and the loop that
 * keeps both true while the reader turns pages.
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { RefObject } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AnnotationMark } from '../src/shared/annotation'
import {
  readShownMarks, sameShownMarks, shownMarksOf, useShownMarks, type ShownMarks,
} from '../src/client/shown-marks'
import { defined, installDom, stubRect } from './dom'

/** A mark that names the element it was made on. */
function onElement(id: string, selector: string): AnnotationMark {
  return {
    id,
    kind: 'element',
    color: '#1971c2',
    points: [[10, 20], [30, 40]],
    anchor: { tag: 'p', selector, bbox: [10, 20, 20, 20] },
  }
}

/** A drawing, which is somewhere in the document by its own coordinates alone. */
const DRAWN: AnnotationMark = { id: 'd1', kind: 'arrow', color: '#e03131', points: [[1, 2], [3, 4]] }

describe('reading which marks the page is showing', () => {
  /** A deck: every slide stacked in the same place, one of them in front. */
  function deck(): { readonly cover: Element; readonly lead: Element } {
    const style = document.createElement('style')
    style.textContent = '.slide{visibility:hidden}.slide.current{visibility:visible}'
    document.head.append(style)
    document.body.innerHTML = '<section class="slide current" id="s1"><h1 id="cover">封面</h1></section>'
      + '<section class="slide" id="s2"><p id="lead">第二页</p></section>'
    return { cover: defined(document.querySelector('#cover')), lead: defined(document.querySelector('#lead')) }
  }

  beforeEach(() => { installDom() })
  afterEach(() => { document.body.innerHTML = '' })

  it('says nothing is away when there is no document to ask', () => {
    // Between the mount and the frame's first layout there is no document, and an empty
    // answer is the honest one: nothing has been shown to be missing.
    const shown = readShownMarks(null, [onElement('e1', '#cover'), DRAWN])
    expect(shown.boxes.size).toBe(0)
    expect(shown.away.size).toBe(0)
  })

  it('leaves a mark alone when it names nothing the document can find', () => {
    deck()
    // A drawing names no element at all; a selector may also have gone stale under an
    // edit. Either way the mark stays where it was drawn rather than vanishing.
    const shown = readShownMarks(document, [DRAWN, onElement('e1', '#gone')])
    expect(shown.boxes.size).toBe(0)
    expect(shown.away.size).toBe(0)
  })

  it('takes a non-document root without inventing a page turn', () => {
    const fragment = document.createDocumentFragment()
    const shown = readShownMarks(fragment, [{ ...DRAWN, surface: '#missing' }])
    expect(shown.boxes.size).toBe(0)
    // The surface still has to be measured before its absence can be called a turn.
    expect(shown.away.size).toBe(0)
  })

  it('reads a document from its root element as well as from the document', () => {
    const { cover } = deck()
    stubRect(cover, { left: 1, top: 2, width: 3, height: 4 })
    const shown = readShownMarks(document.documentElement, [onElement('e1', '#cover')])
    expect(shown.boxes.get('e1')).toEqual([1, 2, 3, 4])
  })

  it('hides a mark on the surface in front while that surface has no layout yet', () => {
    document.body.innerHTML = '<section id="s1" data-figmark-slide="0" '
      + 'data-figmark-slide-current><p>cover</p></section>'
    const shown = readShownMarks(document, [{
      ...DRAWN,
      id: 'region',
      kind: 'rect',
      surface: '#s1',
    }])
    // The selector identifies the page in front, but its zero box means it has not
    // been painted. Drawing the mark at its old coordinates would put it on screen.
    expect([...shown.away]).toEqual(['region'])
  })

  it('puts the marks of the slide in front on the page and the others away', () => {
    const { cover } = deck()
    stubRect(cover, { left: 5, top: 6, width: 7, height: 8 })
    const shown = readShownMarks(document, [onElement('e1', '#cover'), onElement('e2', '#lead')])
    // The second slide is in the file and laid out, and none of it is on screen.
    expect([...shown.away]).toEqual(['e2'])
    expect(shown.boxes.get('e1')).toEqual([5, 6, 7, 8])
  })

  it('keeps the drawn box of an element the document has not laid out yet', () => {
    const { cover } = deck()
    expect(cover.getBoundingClientRect().width).toBe(0)
    // A document with no layout reports zero for everything it shows, which is not a
    // page turn: the mark keeps the box it was drawn with.
    const shown = readShownMarks(document, [onElement('e1', '#cover')])
    expect(shown.boxes.size).toBe(0)
    expect(shown.away.size).toBe(0)
  })

  it('does not move a drawing to an element it names loosely', () => {
    const { cover } = deck()
    stubRect(cover, { left: 5, top: 6, width: 7, height: 8 })
    // Only an element mark claims its box is the element; a drawing that happens to carry
    // an anchor stays at its own coordinates.
    const shown = readShownMarks(document, [{ ...DRAWN, anchor: { tag: 'h1', selector: '#cover', bbox: [0, 0, 1, 1] } }])
    expect(shown.boxes.size).toBe(0)
    expect(shown.away.size).toBe(0)
  })
})

describe('the list the overlay draws', () => {
  const marks = [onElement('e1', '#cover'), onElement('e2', '#lead'), DRAWN]

  it('draws every mark while nothing has been read', () => {
    expect(shownMarksOf(marks, null)).toBe(marks)
  })

  it('draws every mark when the read found nothing to change', () => {
    // The common case, once a page has settled: the answer is the same array, so the
    // overlay is not handed a new list sixty times a second.
    expect(shownMarksOf(marks, { boxes: new Map(), away: new Set() })).toBe(marks)
  })

  it('drops the marks that are away and moves the ones that are shown', () => {
    const shown: ShownMarks = {
      boxes: new Map([['e2', [100, 200, 40, 30] as const]]),
      away: new Set(['e1']),
    }
    const drawn = shownMarksOf(marks, shown)
    expect(drawn.map(mark => mark.id)).toEqual(['e2', 'd1'])
    // The element's two corners, in the order a mark's points arrive in.
    expect(drawn[0]?.points).toEqual([[100, 200], [140, 230]])
    // The drawing is untouched, by value: nothing about it moved.
    expect(drawn[1]).toBe(DRAWN)
  })
})

describe('comparing two reads', () => {
  const empty: ShownMarks = { boxes: new Map(), away: new Set() }

  it('holds that nothing is the same as nothing', () => {
    expect(sameShownMarks(null, null)).toBe(true)
  })

  it('holds that a read is news against nothing', () => {
    expect(sameShownMarks(null, empty)).toBe(false)
    expect(sameShownMarks(empty, null)).toBe(false)
  })

  it('hears a page turn when the counts move', () => {
    expect(sameShownMarks(empty, { boxes: new Map(), away: new Set(['e1']) })).toBe(false)
    expect(sameShownMarks(empty, { boxes: new Map([['e1', [0, 0, 1, 1]]]), away: new Set() })).toBe(false)
  })

  it('hears a page turn when a different mark is away', () => {
    expect(sameShownMarks(
      { boxes: new Map(), away: new Set(['e1']) },
      { boxes: new Map(), away: new Set(['e2']) },
    )).toBe(false)
  })

  it('hears a page turn when a box moved, appeared, or went', () => {
    const one: ShownMarks = { boxes: new Map([['e1', [0, 0, 10, 10]]]), away: new Set() }
    expect(sameShownMarks(one, { boxes: new Map(), away: new Set() })).toBe(false)
    // Same count, different mark: the one that moved is not the one that is drawn.
    expect(sameShownMarks(one, { boxes: new Map([['e2', [0, 0, 10, 10]]]), away: new Set() })).toBe(false)
    expect(sameShownMarks(one, { boxes: new Map([['e1', [0, 0, 10, 11]]]), away: new Set() })).toBe(false)
    expect(sameShownMarks(one, { boxes: new Map([['e1', [0, 0, 10, 10]]]), away: new Set() })).toBe(true)
  })
})

describe('following the page as the reader turns it', () => {
  /** Frame callbacks the panel asked for, keyed by the handle it can cancel. */
  const pending = new Map<number, FrameRequestCallback>()
  let handle = 0
  let root: Root
  let reads: (ShownMarks | null)[]

  /** Run the frames that are due, the way a display would. */
  async function runFrame(): Promise<void> {
    const due = [...pending.values()]
    pending.clear()
    await act(async () => {
      for (const callback of due) callback(0)
    })
  }

  /** Render the probe over one frame and one list of marks. */
  async function render(frame: RefObject<HTMLIFrameElement | null>, marks: readonly AnnotationMark[], active: boolean): Promise<void> {
    await act(async () => {
      root.render(<Probe frame={frame} marks={marks} active={active} reads={reads} />)
    })
  }

  /** What the last render saw. */
  function last(): ShownMarks | null {
    return reads[reads.length - 1] ?? null
  }

  /** A frame showing the deck the read runs against. */
  function frameOver(): RefObject<HTMLIFrameElement | null> {
    return { current: { contentDocument: document } as unknown as HTMLIFrameElement }
  }

  /** A deck, as the read sees it. */
  function deck(): void {
    const style = document.createElement('style')
    style.textContent = '.slide{visibility:hidden}.slide.current{visibility:visible}'
    document.head.append(style)
    document.body.innerHTML = '<section class="slide current" id="s1"><h1 id="cover">封面</h1></section>'
      + '<section class="slide" id="s2"><p id="lead">第二页</p></section>'
  }

  beforeEach(() => {
    installDom()
    pending.clear()
    handle = 0
    reads = []
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback): number => {
      handle += 1
      pending.set(handle, callback)
      return handle
    })
    vi.stubGlobal('cancelAnimationFrame', (target: number): void => { pending.delete(target) })
    const host = document.createElement('div')
    document.body.append(host)
    root = createRoot(host)
  })

  afterEach(async () => {
    await act(async () => { root.unmount() })
    vi.unstubAllGlobals()
  })

  it('asks for nothing while there is nothing to follow', async () => {
    deck()
    await render(frameOver(), [onElement('e1', '#cover')], false)
    // A picture has no pages, so the panel does not run a loop for one.
    expect(pending.size).toBe(0)
    expect(last()).toBeNull()
  })

  it('reads the page once a frame, and re-renders only when the answer changed', async () => {
    deck()
    stubRect(defined(document.querySelector('#cover')), { left: 5, top: 6, width: 7, height: 8 })
    await render(frameOver(), [onElement('e1', '#cover'), onElement('e2', '#lead')], true)
    // Nothing is known before the first frame, so every mark is drawn as recorded.
    expect(last()).toBeNull()
    await runFrame()
    expect([...(last()?.away ?? [])]).toEqual(['e2'])
    const settled = reads.length
    // The same page, painted again: no new render.
    await runFrame()
    expect(reads.length).toBe(settled)
  })

  it('moves with the page, so a mark follows the turn', async () => {
    deck()
    const cover = defined(document.querySelector('#cover'))
    const lead = defined(document.querySelector('#lead'))
    stubRect(cover, { left: 5, top: 6, width: 7, height: 8 })
    await render(frameOver(), [onElement('e1', '#cover'), onElement('e2', '#lead')], true)
    await runFrame()
    // The reader turns the page the way the deck does it: one class off, one on.
    const sections = [...document.querySelectorAll('section')]
    sections[0]?.classList.remove('current')
    sections[1]?.classList.add('current')
    stubRect(lead, { left: 0, top: 100, width: 200, height: 40 })
    await runFrame()
    expect([...(last()?.away ?? [])]).toEqual(['e1'])
    expect(last()?.boxes.get('e2')).toEqual([0, 100, 200, 40])
  })

  it('asks about the marks as they are now, without restarting the loop', async () => {
    deck()
    const frame = frameOver()
    await render(frame, [onElement('e1', '#cover')], true)
    await runFrame()
    expect(last()?.away.size).toBe(0)
    // A comment typed into the pill re-renders the panel with a new list; the loop keeps
    // running on the same frame, and the next tick asks about the list as it is now.
    await render(frame, [onElement('e1', '#cover'), onElement('e2', '#lead')], true)
    expect(pending.size).toBe(1)
    await runFrame()
    expect([...(last()?.away ?? [])]).toEqual(['e2'])
  })

  it('follows a frame whose document never arrived', async () => {
    await render({ current: { contentDocument: null } as unknown as HTMLIFrameElement }, [onElement('e1', '#cover')], true)
    await runFrame()
    // Nothing is away when there is no document, so the marks stay where they are drawn.
    expect(last()?.away.size).toBe(0)
    expect(last()?.boxes.size).toBe(0)
  })

  it('stops asking when the panel goes away', async () => {
    deck()
    await render(frameOver(), [onElement('e1', '#cover')], true)
    expect(pending.size).toBe(1)
    await act(async () => { root.unmount() })
    expect(pending.size).toBe(0)
    // The frame it asked for was cancelled with the panel, so there is nothing left to
    // run and nothing more to see.
    const seen = reads.length
    await runFrame()
    expect(reads.length).toBe(seen)
    root = createRoot(document.createElement('div'))
  })
})

/** Renders the hook and records what each render saw. */
function Probe(props: {
  readonly frame: RefObject<HTMLIFrameElement | null>
  readonly marks: readonly AnnotationMark[]
  readonly active: boolean
  readonly reads: (ShownMarks | null)[]
}): null {
  props.reads.push(useShownMarks(props.frame, props.marks, props.active))
  return null
}
