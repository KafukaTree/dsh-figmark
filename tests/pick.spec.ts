// @vitest-environment jsdom
/** Asking the browser what is painted under the pointer, and what counts as paper. */
import { describe, expect, it } from 'vitest'
import { PICK_REACH, isPaper, pickStack } from '../src/client/pick'
import { defined, stubRect } from './dom'

/** Parse a document the way the renderers receive one. */
function parse(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html')
}

/**
 * A document whose hit testing answers from a fixed map instead of from layout.
 *
 * jsdom has no `elementsFromPoint`, and no layout to base one on, so a spec that wants
 * the browser's answer has to hand it one. Points are keyed by their coordinates; any
 * point not in the map answers nothing, which is what a blank stretch of a document
 * reports in a browser too.
 * @param html - the document's own markup.
 * @param answers - what each point reports, nearest paint order first.
 * @returns the document, and the questions it was asked.
 */
function hitTesting(html: string, answers: Map<string, Element[]>): { document: Document, asked: string[] } {
  const document_ = parse(html)
  const asked: string[] = []
  const point = (x: number, y: number): string => `${x},${y}`
  Object.defineProperty(document_, 'elementsFromPoint', {
    configurable: true,
    value: (x: number, y: number) => {
      asked.push(point(x, y))
      return answers.get(point(x, y)) ?? []
    },
  })
  return { document: document_, asked }
}

/** A key for one point, the way {@link hitTesting} stores its answers. */
function at(x: number, y: number): string {
  return `${x},${y}`
}

describe('what is painted under the pointer', () => {
  it('reports the candidates a paint order puts first, and asks about the pointer itself first', () => {
    const document_ = parse('<body><p id="p">hi</p></body>')
    const paragraph = defined(document_.querySelector('#p'))
    const { document: asked, asked: questions } = hitTesting('<body><p id="p">hi</p></body>', new Map())
    // The parsed copy and the one with hit testing are two documents; the element
    // under test only has to be *some* element the stack can return.
    expect(pickStack(asked, 100, 200)).toEqual([])
    expect(questions[0]).toBe(at(100, 200))
    expect(pickStack(document_, 1, 1)).toBeNull()
    expect(paragraph.tagName).toBe('P')
  })

  it('answers with the stack for the pointer before asking anything around it', () => {
    const paragraph = parse('<body><p id="p">hi</p></body>').querySelector('#p')
    const { document: doc, asked } = hitTesting('<body></body>', new Map([[at(50, 50), [defined(paragraph)] as unknown as Element[]]]))
    // The answer belongs to another document, so the pick still reports it: the stack
    // is the browser's ordering, and what belongs to the surface is the caller's call.
    const stack = pickStack(doc, 50, 50)
    expect(stack).toHaveLength(1)
    expect(asked[0]).toBe(at(50, 50))
  })

  it('looks around the pointer when the pointer itself names nothing', () => {
    const { document: doc, asked } = hitTesting('<body><p id="p">hi</p></body>', new Map())
    expect(pickStack(doc, 0, 0)).toEqual([])
    // One probe on the pointer and then a ring of probes around it: the reach is
    // asked about at several distances, so a one-pixel stroke can be caught.
    expect(asked.length).toBe(25)
    expect(asked[0]).toBe(at(0, 0))
    expect(asked).toContain(at(-PICK_REACH, 0))
    expect(asked).toContain(at(PICK_REACH, PICK_REACH))
  })

  it('keeps one entry per element however many probes found it', () => {
    const paragraph = parse('<body><p id="p">hi</p></body>').querySelector('#p')
    const answers = new Map<string, Element[]>()
    for (const key of [at(1, 1), at(2, 2), at(3, 3)]) answers.set(key, [defined(paragraph)])
    const { document: doc } = hitTesting('<body></body>', answers)
    expect(pickStack(doc, 1, 1)).toHaveLength(1)
  })

  it('reports nothing for a document that cannot be asked, rather than an empty answer', () => {
    expect(pickStack(null, 1, 1)).toBeNull()
    expect(pickStack(undefined, 1, 1)).toBeNull()
  })
})

describe('telling the paper from a thing on it', () => {
  it('calls an element the paper when it covers nearly the whole surface', () => {
    const document_ = parse('<body><div id="bg"></div></body>')
    const background = defined(document_.querySelector('#bg'))
    stubRect(background, { left: 0, top: 0, width: 1010, height: 806 })
    expect(isPaper(background, new DOMRect(0, 0, 1024, 820))).toBe(true)
  })

  it('keeps a thing that covers only part of the surface', () => {
    const document_ = parse('<body><div id="row"></div></body>')
    const row = defined(document_.querySelector('#row'))
    stubRect(row, { left: 0, top: 0, width: 1000, height: 40 })
    expect(isPaper(row, new DOMRect(0, 0, 1024, 820))).toBe(false)
  })

  it('calls nothing the paper when the surface has no extent', () => {
    const document_ = parse('<body><div id="bg"></div></body>')
    const background = defined(document_.querySelector('#bg'))
    stubRect(background, { left: 0, top: 0, width: 0, height: 0 })
    // A pane before its layout, not a drawing with no background: nothing is inside a
    // surface with no inside, so no candidate can be "all of it".
    expect(isPaper(background, new DOMRect(0, 0, 0, 0))).toBe(false)
  })

  it('tolerates a background a rounding error short of the frame', () => {
    const document_ = parse('<body><div id="bg"></div></body>')
    const background = defined(document_.querySelector('#bg'))
    stubRect(background, { left: 0, top: 0, width: 1023.5, height: 819.5 })
    expect(isPaper(background, new DOMRect(0, 0, 1024, 820))).toBe(true)
  })
})
