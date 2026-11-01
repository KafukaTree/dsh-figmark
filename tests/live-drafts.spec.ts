// @vitest-environment jsdom
/** Browser-local drafts for live pages: bounded, validated, and never a sidecar. */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AnnotationMark } from '../src/shared/annotation'
import { LIVE_DRAFT_KEY_PREFIX, readLiveDraft, writeLiveDraft } from '../src/client/live-drafts'
import { defined, installDom } from './dom'

const ADDRESS = 'http://localhost:5173/'

function key(sessionId = 's1'): string {
  return `${LIVE_DRAFT_KEY_PREFIX}${encodeURIComponent(sessionId)}`
}

const MARK: AnnotationMark = {
  id: 'm1',
  kind: 'arrow',
  color: '#ff0000',
  points: [[1, 2], [3, 4]],
  detail: 'move this',
  page: 1,
  surface: '#slide-1',
  rotation: 12,
  weight: 2,
  anchor: {
    tag: 'p',
    id: 'lead',
    class: 'lead intro',
    title: 'Lead',
    text: 'first line',
    selector: '#lead',
    bbox: [1, 2, 30, 40],
  },
}

function entry(mark: unknown = MARK, summary: unknown = 'overall', updatedAt: unknown = 10): unknown[] {
  return [ADDRESS, [mark], summary, updatedAt]
}

function store(entries: readonly unknown[]): void {
  localStorage.setItem(key(), JSON.stringify({ version: 1, entries }))
}

beforeEach(() => {
  installDom()
  localStorage.clear()
})

describe('live-page drafts', () => {
  it('round-trips a page note and every field a mark can carry', () => {
    writeLiveDraft('s1', ADDRESS, [MARK], 'overall')
    const draft = defined(readLiveDraft('s1', ADDRESS))
    expect(draft.marks).toEqual([MARK])
    expect(draft.summary).toBe('overall')
    expect(Number.isFinite(draft.updatedAt)).toBe(true)
    expect(readLiveDraft('s2', ADDRESS)).toBeUndefined()
  })

  it('round-trips a mark whose optional fields are all absent', () => {
    const minimal: AnnotationMark = {
      id: 'minimal',
      kind: 'rect',
      color: '#000000',
      points: [[1, 2]],
    }
    writeLiveDraft('s1', ADDRESS, [minimal], '')
    expect(readLiveDraft('s1', ADDRESS)?.marks).toEqual([minimal])
  })

  it('round-trips an anchor without optional element details', () => {
    const mark: AnnotationMark = {
      ...MARK,
      anchor: { tag: 'p', bbox: [1, 2, 30, 40] },
    }
    writeLiveDraft('s1', ADDRESS, [mark], '')
    expect(readLiveDraft('s1', ADDRESS)?.marks).toEqual([mark])
  })

  it('removes an address when its last mark and summary are cleared', () => {
    writeLiveDraft('s1', ADDRESS, [MARK], 'overall')
    writeLiveDraft('s1', ADDRESS, [], '')
    expect(readLiveDraft('s1', ADDRESS)).toBeUndefined()
    expect(localStorage.getItem(key())).toBeNull()
  })

  it('ignores addresses that are not loopback pages', () => {
    writeLiveDraft('s1', 'http://example.com/', [MARK], '')
    writeLiveDraft('s1', 'not an address', [MARK], '')
    expect(localStorage.getItem(key())).toBeNull()
  })

  it('keeps only the twelve newest pages', () => {
    for (let index = 0; index < 13; index += 1) {
      writeLiveDraft('s1', `http://localhost:${String(6000 + index)}/`, [MARK], `page ${String(index)}`)
    }
    expect(readLiveDraft('s1', 'http://localhost:6000/')).toBeUndefined()
    expect(readLiveDraft('s1', 'http://localhost:6012/')?.summary).toBe('page 12')
  })

  it('drops a record too large to store without blocking later pages', () => {
    const huge = Array.from({ length: 255 }, (_, index) => ({
      ...MARK,
      id: `m${String(index)}`,
      detail: 'x'.repeat(4000),
    }))
    writeLiveDraft('s1', ADDRESS, huge, '')
    expect(localStorage.getItem(key())).toBeNull()
  })

  it('ignores malformed and oversized storage records', () => {
    const malformed: readonly (string | null)[] = [
      null,
      'null',
      '{not json',
      '[]',
      '{}',
      JSON.stringify({ version: 2, entries: [] }),
      JSON.stringify({ version: 1, entries: 'no' }),
      'x'.repeat(1_000_001),
    ]
    for (const raw of malformed) {
      if (raw === null) localStorage.removeItem(key())
      else localStorage.setItem(key(), raw)
      expect(readLiveDraft('s1', ADDRESS)).toBeUndefined()
    }
  })

  it('skips malformed entries and keeps a valid one beside them', () => {
    store([
      null,
      ['not entries'],
      ['http://example.com/', [MARK], '', 1],
      ['x'.repeat(2049), [MARK], '', 1],
      [ADDRESS, [MARK], '', 1],
      entry(),
    ])
    expect(readLiveDraft('s1', ADDRESS)?.marks).toEqual([MARK])
  })

  it.each([
    ['draft is not an array', ['x'], 'overall', 1],
    ['too many marks', Array.from({ length: 257 }, () => MARK), 'overall', 1],
    ['summary is not text', [MARK], 1, 1],
    ['summary is too long', [MARK], 'x'.repeat(4001), 1],
    ['timestamp is not finite', [MARK], 'overall', 'now'],
    ['timestamp is negative', [MARK], 'overall', -1],
  ])('ignores a draft whose %s', (_name, marks, summary, updatedAt) => {
    store([[ADDRESS, marks, summary, updatedAt]])
    expect(readLiveDraft('s1', ADDRESS)).toBeUndefined()
  })

  it.each([
    ['the mark is not an object', null],
    ['the id is missing', { ...MARK, id: undefined }],
    ['the id is empty', { ...MARK, id: '' }],
    ['the id is too long', { ...MARK, id: 'x'.repeat(401) }],
    ['the kind is unknown', { ...MARK, kind: 'sparkle' }],
    ['the colour is missing', { ...MARK, color: undefined }],
    ['points are not a list', { ...MARK, points: 'line' }],
    ['points are empty', { ...MARK, points: [] }],
    ['there are too many points', {
      ...MARK,
      points: Array.from({ length: 4097 }, () => [1, 2]),
    }],
    ['a point is not a pair', { ...MARK, points: [[1, 2], [3]] }],
    ['a point holds a non-number', { ...MARK, points: [[1, '2']] }],
    ['the detail is not text', { ...MARK, detail: 3 }],
    ['the detail is too long', { ...MARK, detail: 'x'.repeat(4001) }],
    ['the page is not a positive integer', { ...MARK, page: 0 }],
    ['the surface is not text', { ...MARK, surface: 4 }],
    ['the surface is too long', { ...MARK, surface: 'x'.repeat(401) }],
    ['rotation is not finite', { ...MARK, rotation: Number.NaN }],
    ['weight is outside the drawing range', { ...MARK, weight: 99 }],
    ['the anchor is not an object', { ...MARK, anchor: 'p' }],
    ['the anchor has no tag', { ...MARK, anchor: { ...MARK.anchor, tag: undefined } }],
    ['the anchor has no box', { ...MARK, anchor: { ...MARK.anchor, bbox: undefined } }],
    ['the anchor id is not text', { ...MARK, anchor: { ...MARK.anchor, id: 2 } }],
    ['the anchor class is not text', { ...MARK, anchor: { ...MARK.anchor, class: 2 } }],
    ['the anchor title is not text', { ...MARK, anchor: { ...MARK.anchor, title: 2 } }],
    ['the anchor text is not text', { ...MARK, anchor: { ...MARK.anchor, text: 2 } }],
    ['the anchor selector is too long', {
      ...MARK,
      anchor: { ...MARK.anchor, selector: 'x'.repeat(401) },
    }],
  ])('ignores a mark when %s', (_name, mark) => {
    store([entry(mark)])
    expect(readLiveDraft('s1', ADDRESS)).toBeUndefined()
  })

  it('ignores a finite box that is not four numbers', () => {
    store([entry({
      ...MARK,
      anchor: { ...MARK.anchor, bbox: [1, 2, 3, '4'] },
    })])
    expect(readLiveDraft('s1', ADDRESS)).toBeUndefined()
  })

  it('survives storage reads and writes that throw', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage denied')
    })
    expect(readLiveDraft('s1', ADDRESS)).toBeUndefined()
    writeLiveDraft('s1', ADDRESS, [MARK], '')
    getItem.mockRestore()

    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage full')
    })
    expect(() => { writeLiveDraft('s1', ADDRESS, [MARK], '') }).not.toThrow()
    setItem.mockRestore()

    localStorage.setItem(key(), JSON.stringify({ version: 1, entries: [entry()] }))
    writeLiveDraft('s1', ADDRESS, [], '')
    const removeItem = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('storage denied')
    })
    expect(() => { writeLiveDraft('s1', ADDRESS, [], '') }).not.toThrow()
    removeItem.mockRestore()
  })
})
