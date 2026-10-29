// @vitest-environment jsdom
import { beforeAll, describe, expect, it } from 'vitest'
import { installDom } from './dom'
import { anchorTextOf } from '../src/client/anchor-text'

beforeAll(() => { installDom() })

describe('the words an element contributes to an anchor', () => {
  it('keeps two labels inside one element apart', () => {
    // The record's own case: a matplotlib axes group holds every tick label and the
    // axis title, and `textContent` ran them into `0.00.51.0y label` — one word with
    // the numbers still in it.
    const host = document.createElement('div')
    host.innerHTML = '<g id="axes_1"><text>0.0</text><text>0.5</text><text>1.0</text><text>y label</text></g>'
    const group = host.firstElementChild as Element
    expect(anchorTextOf(group)).toBe('0.0 0.5 1.0 y label')
    expect(anchorTextOf(group)).not.toBe('0.00.51.0y label')
  })

  it('leaves a single label exactly as it was', () => {
    // A `<text>` element holding one string must not gain a space it does not have:
    // the fix is about what stands between two labels, not about padding one.
    const host = document.createElement('div')
    host.innerHTML = '<text id="t">t=4</text>'
    expect(anchorTextOf(host.firstElementChild as Element)).toBe('t=4')
  })

  it('collapses whitespace inside a node and between them', () => {
    const host = document.createElement('div')
    host.innerHTML = '<g>\n  <text> alpha </text>\n  <text> beta\n gamma </text>\n</g>'
    expect(anchorTextOf(host.firstElementChild as Element)).toBe('alpha beta gamma')
  })

  it('caps what one deeply nested element can carry', () => {
    const host = document.createElement('div')
    const words = Array.from({ length: 40 }, (_, index) => `<text>word${index}</text>`).join('')
    host.innerHTML = `<g>${words}</g>`
    expect(anchorTextOf(host.firstElementChild as Element)).toHaveLength(80)
  })

  it('answers with nothing for an element that holds only structure', () => {
    const host = document.createElement('div')
    host.innerHTML = '<g><rect /><path d="M0 0"/></g>'
    expect(anchorTextOf(host.firstElementChild as Element)).toBe('')
  })
})

describe('the parts of an element that are laid out apart', () => {
  it('keeps sibling labels apart instead of running them into one word', () => {
    document.body.innerHTML = '<svg><g id="axes_1"><text>0.0</text><text>0.5</text><text>1.0</text><text>y label</text></g></svg>'
    const group = document.querySelector('#axes_1')
    if (group === null) throw new Error('the group did not parse')
    expect(anchorTextOf(group)).toBe('0.0 0.5 1.0 y label')
  })

  it('keeps a nested label whole rather than splitting it at its own children', () => {
    document.body.innerHTML = '<svg><g><text>tau<tspan>=</tspan><tspan>1.0</tspan></text></g></svg>'
    const text = document.querySelector('text')
    if (text === null) throw new Error('the text did not parse')
    expect(anchorTextOf(text)).toBe('tau = 1.0')
  })

  it('leaves the empty strings of layout-only children out of the join', () => {
    document.body.innerHTML = '<svg><g><text>1.0</text><rect/><text> </text><text>2.0</text></g></svg>'
    const group = document.querySelector('g')
    if (group === null) throw new Error('the group did not parse')
    expect(anchorTextOf(group)).toBe('1.0 2.0')
  })
})

describe('the children that carry no words', () => {
  it('walks past a comment node without stopping the walk', () => {
    document.body.innerHTML = '<svg><g><text>1.0</text><!-- layout --><text>2.0</text></g></svg>'
    const group = document.querySelector('g')
    if (group === null) throw new Error('the group did not parse')
    expect(anchorTextOf(group)).toBe('1.0 2.0')
  })
})
