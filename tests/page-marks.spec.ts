/**
 * One mark's place in a document that holds every page's marks.
 *
 * Dropping a mark from the document map is the owner's job: the page body that drew it
 * holds only its own sheet, so the call has to find which page's list carries the id
 * and leave every other page's list untouched — and it has to be a no-op when the id is
 * on no page at all, which is what a stale list row produces.
 */
import { describe, expect, it } from 'vitest'
import { withoutMark, type MarksByPage } from '../src/client/pdf/page-marks'

const mark = (id: string): { id: string; kind: 'arrow'; color: string; points: [] } => ({
  id,
  kind: 'arrow',
  color: '#1971c2',
  points: [],
})

const pages = (): MarksByPage => new Map([
  [1, [mark('a'), mark('b')]],
  [2, [mark('c')]],
])

describe('dropping one mark from the whole document', () => {
  it('removes the id from the page that carries it and leaves the others alone', () => {
    const next = withoutMark(pages(), 'b')
    expect(next.get(1)?.map(m => m.id)).toEqual(['a'])
    expect(next.get(2)?.map(m => m.id)).toEqual(['c'])
  })

  it('finds the id on a later page, not only the first', () => {
    const next = withoutMark(pages(), 'c')
    expect(next.get(2)).toEqual([])
    expect(next.get(1)?.map(m => m.id)).toEqual(['a', 'b'])
  })

  it('hands back the same map when no page carries the id', () => {
    // The caller compares identity to decide whether anything changed; a fresh map with
    // the same contents would look like an edit and mark the document dirty.
    const before = pages()
    expect(withoutMark(before, 'nowhere')).toBe(before)
  })

  it('does not mutate the map it was given', () => {
    const before = pages()
    withoutMark(before, 'a')
    expect(before.get(1)?.map(m => m.id)).toEqual(['a', 'b'])
  })

  it('leaves an empty document empty', () => {
    const before: MarksByPage = new Map()
    expect(withoutMark(before, 'a')).toBe(before)
  })
})
