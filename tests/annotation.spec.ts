/** The stored annotation document: validation, sidecar round trip, and the model-facing summary. */
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MAX_DETAIL_CHARS, MAX_SUMMARY_CHARS, type AnnotationDocument, type AnnotationMark, type FigurePoint, type MarkKind } from '../src/shared/annotation'
import {
  ANNOTATION_VERSION,
  ANNOTATION_VERSION_V2,
  WEIGHT_DEFAULT,
  WEIGHT_MAX,
  WEIGHT_MIN,
  annotatedPages,
  clampWeight,
  isWeight,
  pageFileSuffix,
} from '../src/shared/annotation'
import { describeFigureScope, describeMark, describeMarks } from '../src/shared/mark-summary'
import { readAnnotation, readAnnotationDocument, removeAnnotation, writeAnnotation } from '../src/host/store'
import { defined } from './dom'

const document_: AnnotationDocument = {
  version: ANNOTATION_VERSION,
  figure: {
    address: 'dsh-resource://file/session/s1/fig1.svg',
    path: '/w/fig1.svg',
    mediaType: 'image/svg+xml',
    width: 400,
    height: 300,
    sha256: 'a'.repeat(64),
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  marks: [
    {
      id: 'm1',
      kind: 'arrow',
      color: '#e03131',
      points: [[300, 225], [100, 66]],
      detail: '这个标号应指向滑套 34',
      anchor: { tag: 'g', title: '102', id: 'node102', text: '导柱', bbox: [40, 40, 120, 60] },
    },
    { id: 'm2', kind: 'pen', color: '#1971c2', points: [[1, 2], [3, 4], [5, 6]] },
    { id: 'm3', kind: 'ellipse', color: '#f08c00', points: [[10, 20], [30, 40]], detail: '轮廓多余' },
    { id: 'm4', kind: 'rect', color: '#2f9e44', points: [[5, 5], [50, 60]] },
    { id: 'm5', kind: 'point', color: '#e03131', points: [[200, 200]], detail: '图号应在正下方' },
  ],
  summary: '五处问题',
}

/** One document of a paged figure: pages instead of one measured surface. */
const paged = (overrides: Partial<AnnotationDocument['figure']> = {}): AnnotationDocument => ({
  ...document_,
  figure: {
    address: 'dsh-resource://file/session/s1/report.pdf',
    path: '/w/report.pdf',
    mediaType: 'application/pdf',
    sha256: 'c'.repeat(64),
    pageCount: 4,
    ...overrides,
  },
  marks: [
    { id: 'p1', kind: 'rect', color: '#1971c2', points: [[10, 20], [60, 90]], page: 1 },
    { id: 'p3', kind: 'arrow', color: '#e03131', points: [[1, 2], [3, 4]], detail: '第三页', page: 3 },
  ],
})

describe('document validation', () => {
  it('accepts a document this plugin wrote', () => {
    const parsed = readAnnotationDocument(JSON.parse(JSON.stringify(document_)) as unknown)
    expect(parsed.marks).toHaveLength(5)
    expect(parsed.marks[0]?.anchor?.title).toBe('102')
  })

  it('rejects a wrong version, a missing figure field, and an unknown mark kind', () => {
    const wrongVersion = { ...document_, version: 2 }
    expect(() => readAnnotationDocument(wrongVersion)).toThrow(/version/)
    const missingSha = { ...document_, figure: { ...document_.figure, sha256: undefined } }
    expect(() => readAnnotationDocument(missingSha)).toThrow(/sha256/)
    const badKind = { ...document_, marks: [{ id: 'x', kind: 'stamp', color: '#000', points: [[0, 0]] }] }
    expect(() => readAnnotationDocument(badKind)).toThrow(/unknown kind/)
  })

  it('rejects a mark without coordinates and an anchor without a box', () => {
    expect(() => readAnnotationDocument({ ...document_, marks: [{ id: 'x', kind: 'pen', color: '#000', points: [] }] }))
      .toThrow(/coordinate pair/)
    expect(() => readAnnotationDocument({
      ...document_,
      marks: [{ id: 'x', kind: 'pen', color: '#000', points: [[0, 0]], anchor: { tag: 'g' } }],
    })).toThrow(/bbox/)
  })

  it('rejects a body that is not a document at all', () => {
    for (const value of [null, 'text', 7, true]) expect(() => readAnnotationDocument(value)).toThrow(/must be an object/)
    // An array is an object, so it reaches the version check instead.
    expect(() => readAnnotationDocument([])).toThrow(/version/)
  })

  it('rejects a document with no figure, no marks array, or a non-positive extent', () => {
    expect(() => readAnnotationDocument({ version: ANNOTATION_VERSION })).toThrow(/needs a figure/)
    expect(() => readAnnotationDocument({ ...document_, marks: 'none' })).toThrow(/marks array/)
    expect(() => readAnnotationDocument({
      ...document_,
      figure: { ...document_.figure, width: 'wide' },
    })).toThrow(/width must be a positive number/)
    expect(() => readAnnotationDocument({
      ...document_,
      figure: { ...document_.figure, height: Number.NaN },
    })).toThrow(/height must be a positive number/)
    expect(() => readAnnotationDocument({
      ...document_,
      figure: { ...document_.figure, width: 0 },
    })).toThrow(/width must be a positive number/)
  })

  it('rejects a malformed mark field by field', () => {
    const withMark = (mark: unknown): unknown => ({ ...document_, marks: [mark] })
    expect(() => readAnnotationDocument(withMark('mark'))).toThrow(/must be an object/)
    expect(() => readAnnotationDocument(withMark({ kind: 'pen', color: '#000', points: [[0, 0]] }))).toThrow(/needs an id/)
    expect(() => readAnnotationDocument(withMark({ id: '', kind: 'pen', color: '#000', points: [[0, 0]] }))).toThrow(/needs an id/)
    expect(() => readAnnotationDocument(withMark({ id: 'x', kind: 'pen', points: [[0, 0]] }))).toThrow(/needs a color/)
    expect(() => readAnnotationDocument(withMark({ id: 'x', kind: 'pen', color: '#000', points: 'none' }))).toThrow(/coordinate pair/)
    expect(() => readAnnotationDocument(withMark({ id: 'x', kind: 'pen', color: '#000', points: [['a', 'b']] })))
      .toThrow(/coordinate pair/)
  })

  it('carries the rotation, size and plate offset a mark was edited to', () => {
    const withMark = (fields: Record<string, unknown>): unknown => ({
      ...document_,
      marks: [{ id: 'x', kind: 'rect', color: '#000', points: [[0, 0], [10, 10]], ...fields }],
    })
    const parsed = readAnnotationDocument(withMark({ rotation: 45, detail: '往右挪' }))
    expect(defined(parsed.marks[0])).toMatchObject({ rotation: 45, detail: '往右挪' })
    // Absent fields stay absent, so an untouched mark writes the same document it
    // was read from.
    const plain = readAnnotationDocument(withMark({}))
    expect(defined(plain.marks[0]).rotation).toBeUndefined()
  })

  it('rejects a rotation that is not a finite number of degrees', () => {
    const withMark = (rotation: unknown): unknown => ({
      ...document_,
      marks: [{ id: 'x', kind: 'rect', color: '#000', points: [[0, 0], [10, 10]], rotation }],
    })
    expect(() => readAnnotationDocument(withMark('45'))).toThrow(/rotation must be a finite number/)
    expect(() => readAnnotationDocument(withMark(Number.NaN))).toThrow(/rotation must be a finite number/)
    expect(() => readAnnotationDocument(withMark(Number.POSITIVE_INFINITY))).toThrow(/rotation must be a finite number/)
  })

  it('rejects a kind it does not know, including the retired text mark', () => {
    const withKind = (kind: unknown): unknown => ({
      ...document_,
      marks: [{ id: 'x', kind, color: '#000', points: [[0, 0]] }],
    })
    // `text` used to be a mark kind. An old sidecar that still says so is not
    // silently read as something else: it is refused, so nothing is drawn wrong.
    expect(() => readAnnotationDocument(withKind('text'))).toThrow(/kind/)
    expect(() => readAnnotationDocument(withKind('point')))
      .not.toThrow()
  })

  it('holds a stroke weight inside the range the painter can draw', () => {
    const withWeight = (weight: unknown): unknown => ({
      ...document_,
      marks: [{ id: 'x', kind: 'pen', color: '#000', points: [[0, 0]], weight }],
    })
    // A weight the reader set is pulled to the nearest drawable value rather than
    // dropped: a preference that vanishes is worse than one held at its end stop.
    expect(defined(readAnnotationDocument(withWeight(9)).marks[0]).weight).toBe(WEIGHT_MAX)
    expect(defined(readAnnotationDocument(withWeight(0.1)).marks[0]).weight).toBe(0.5)
    expect(defined(readAnnotationDocument(withWeight(2.5)).marks[0]).weight).toBe(2.5)
    // Anything that is not a number is a document this plugin did not write.
    expect(() => readAnnotationDocument(withWeight('thick'))).toThrow(/weight/)
    expect(() => readAnnotationDocument(withWeight(Number.POSITIVE_INFINITY))).toThrow(/weight/)
    // Absent is the default pen, which is not written down at all.
    expect(defined(readAnnotationDocument({
      ...document_,
      marks: [{ id: 'x', kind: 'pen', color: '#000', points: [[0, 0]] }],
    }).marks[0]).weight).toBeUndefined()
  })

  it('rejects a malformed anchor field by field', () => {
    const withAnchor = (anchor: unknown): unknown => ({
      ...document_,
      marks: [{ id: 'x', kind: 'pen', color: '#000', points: [[0, 0]], anchor }],
    })
    expect(() => readAnnotationDocument(withAnchor('anchor'))).toThrow(/anchor must be an object/)
    expect(() => readAnnotationDocument(withAnchor({ bbox: [0, 0, 1, 1] }))).toThrow(/needs a tag/)
  })

  it('keeps an anchor that names itself by nothing but its tag', () => {
    const parsed = readAnnotationDocument({
      ...document_,
      marks: [{ id: 'x', kind: 'pen', color: '#000', points: [[0, 0]], anchor: { tag: 'g', bbox: [0, 0, 1, 1] } }],
    })
    expect(defined(parsed.marks[0]).anchor).toEqual({ tag: 'g', bbox: [0, 0, 1, 1] })
  })

  it('carries the selector a rendered document is located by, capped at what we write', () => {
    const withAnchor = (anchor: unknown): unknown => ({
      ...document_,
      marks: [{ id: 'x', kind: 'pen', color: '#000', points: [[0, 0]], anchor }],
    })
    const parsed = readAnnotationDocument(withAnchor({
      tag: 'p', bbox: [0, 0, 10, 10], text: '第二段', selector: '#s > p:nth-of-type(2)',
    }))
    expect(defined(parsed.marks[0]).anchor).toEqual({
      tag: 'p', bbox: [0, 0, 10, 10], text: '第二段', selector: '#s > p:nth-of-type(2)',
    })
    // An anchor beyond this is not one this plugin wrote.
    const long = `#s > ${'div:nth-of-type(1) > '.repeat(40)}p`
    const capped = readAnnotationDocument(withAnchor({ tag: 'p', bbox: [0, 0, 10, 10], selector: long }))
    expect(defined(capped.marks[0]).anchor?.selector).toHaveLength(400)
    expect(long.startsWith(defined(capped.marks[0]).anchor?.selector ?? '')).toBe(true)
  })

  it('fills the timestamps a partial document omits and drops an empty summary', () => {
    const partial = { ...document_, createdAt: undefined, updatedAt: undefined, summary: '' }
    const parsed = readAnnotationDocument(partial)
    expect(parsed.summary).toBeUndefined()
    expect(Number.isNaN(Date.parse(parsed.createdAt))).toBe(false)
    expect(parsed.createdAt).toBe(parsed.updatedAt)
  })

  it('keeps the first-created timestamp when only the update time is missing', () => {
    const parsed = readAnnotationDocument({ ...document_, updatedAt: undefined })
    expect(parsed.createdAt).toBe('2026-01-01T00:00:00.000Z')
    expect(Number.isNaN(Date.parse(parsed.updatedAt))).toBe(false)
  })
})

describe('a note that wraps', () => {
  it('travels as one line, so one mark stays one line of the list', () => {
    // The field accepts a Return and the list is joined with newlines: a note in three
    // lines used to become three lines of list, the last two without a marker, which
    // the agent cannot attribute to the mark the picture numbered.
    const wrapped = describeMark(
      { id: 'm1', kind: 'rect', color: '#000', points: [[10, 10], [40, 30]], detail: '这里\n应该\n换行三次' },
      1, 'zh',
    )
    expect(wrapped).not.toMatch(/[\r\n]/u)
    expect(wrapped).toContain('这里 应该 换行三次')
  })
})

describe('the field caps that keep a sidecar readable', () => {
  it('refuses a note longer than the cap, on both the mark and the document', () => {
    // The write path used to accept any length while the read path refused any
    // sidecar over 4 MiB: one long paste produced a file the plugin acknowledged and
    // then reported as absent. The caps live in `shared` so both halves use one number.
    const longNote = 'x'.repeat(MAX_DETAIL_CHARS + 1)
    expect(() => readAnnotationDocument({ ...document_, marks: [{ ...document_.marks[0], detail: longNote }] }))
      .toThrow(new RegExp(`the annotation mark note is longer than ${String(MAX_DETAIL_CHARS)}`))
    expect(() => readAnnotationDocument({ ...document_, summary: 'x'.repeat(MAX_SUMMARY_CHARS + 1) }))
      .toThrow(new RegExp(`the annotation document note is longer than ${String(MAX_SUMMARY_CHARS)}`))
    // Exactly at the cap is allowed: a limit a reader can hit is a limit they can use.
    expect(() => readAnnotationDocument({ ...document_, summary: 'x'.repeat(MAX_SUMMARY_CHARS) })).not.toThrow()
  })
})

describe('the weight a stroke can be drawn at', () => {
  it('holds a weight to the ends of the range, and only calls a weight one inside it', () => {
    expect(clampWeight(0.1)).toBe(WEIGHT_MIN)
    expect(clampWeight(9)).toBe(WEIGHT_MAX)
    expect(clampWeight(2)).toBe(2)
    expect(isWeight(WEIGHT_MIN)).toBe(true)
    expect(isWeight(WEIGHT_MAX)).toBe(true)
    expect(isWeight(WEIGHT_DEFAULT)).toBe(true)
    // Anything outside, or not a number at all, is not a weight this plugin writes.
    expect(isWeight(WEIGHT_MIN - 0.1)).toBe(false)
    expect(isWeight(WEIGHT_MAX + 0.1)).toBe(false)
    expect(isWeight(Number.NaN)).toBe(false)
    expect(isWeight('2')).toBe(false)
    expect(isWeight(undefined)).toBe(false)
  })
})

describe('a figure that has pages', () => {
  it('keeps its page count and every mark page', () => {
    const parsed = readAnnotationDocument(JSON.parse(JSON.stringify(paged())) as unknown)
    expect(parsed.figure.pageCount).toBe(4)
    expect(parsed.figure.width).toBeUndefined()
    expect(parsed.marks.map(mark => mark.page)).toEqual([1, 3])
  })

  it('refuses a document that is half a surface and half a document', () => {
    // One size without the other leaves a reader guessing the coordinate space.
    expect(() => readAnnotationDocument({ ...document_, figure: { ...document_.figure, height: undefined } }))
      .toThrow(/both its width and its height, or neither/)
    // A document with pages has no single size, and a single surface has no pages.
    expect(() => readAnnotationDocument({ ...paged(), figure: { ...paged().figure, width: 595, height: 842 } }))
      .toThrow(/cannot carry width and height/)
    expect(() => readAnnotationDocument({
      ...document_,
      marks: [{ id: 'x', kind: 'pen', color: '#000', points: [[0, 0]], page: 1 }],
    })).toThrow(/names a page, but its figure is one surface/)
  })

  it('refuses a page count or a page number that is not a whole page', () => {
    for (const value of [0, -1, 1.5, '3', null]) {
      expect(() => readAnnotationDocument({ ...paged(), figure: { ...paged().figure, pageCount: value } }))
        .toThrow(/pageCount must be a positive integer/)
      expect(() => readAnnotationDocument({
        ...paged(),
        marks: [{ id: 'x', kind: 'pen', color: '#000', points: [[0, 0]], page: value }],
      })).toThrow(/page must be a positive integer/)
    }
  })

  it('refuses a mark that lands outside the document', () => {
    expect(() => readAnnotationDocument({
      ...paged(),
      marks: [{ id: 'x', kind: 'pen', color: '#000', points: [[0, 0]], page: 5 }],
    })).toThrow(/is on page 5 of a 4-page document/)
  })

  it('lists the pages that carry marks, in order', () => {
    expect(annotatedPages(paged())).toEqual([1, 3])
    expect(annotatedPages(paged({ pageCount: 9 }))).toEqual([1, 3])
    expect(annotatedPages(document_)).toEqual([])
  })

  it('names the file suffix one page contributes to a name', () => {
    expect(pageFileSuffix(undefined)).toBe('')
    expect(pageFileSuffix(3)).toBe('.p3')
  })

  it('says how many pages the document has, in both languages', () => {
    expect(describeFigureScope(document_.figure, 'zh')).toBe('')
    expect(describeFigureScope(paged().figure, 'zh')).toBe('共 4 页')
    expect(describeFigureScope(paged().figure, 'en')).toBe('4 pages')
    // A document the browser has not measured yet carries no page count at all.
    const unmeasured = { ...paged().figure }
    delete (unmeasured as { pageCount?: number }).pageCount
    expect(describeFigureScope(unmeasured, 'zh')).toBe('')
  })
})

describe('sidecar round trip', () => {
  let directory: string
  beforeEach(async () => { directory = await mkdtemp(join(tmpdir(), 'dsh-figmark-')) })
  afterEach(async () => { await rm(directory, { recursive: true, force: true }) })

  it('writes both files next to the figure and reads the marks back', async () => {
    const figure = join(directory, 'fig1.svg')
    await writeFile(figure, '<svg/>')
    const saved = await writeAnnotation(figure, document_, { kind: 'image', bytes: new Uint8Array([1, 2, 3]) })
    expect(saved.wroteReview).toBe(true)
    expect(saved.paths.annotation).toBe(join(directory, 'fig1.svg.annot.json'))
    expect(saved.paths.review).toBe(join(directory, 'fig1.svg.annotated.png'))
    expect(await readFile(saved.paths.review)).toEqual(Buffer.from([1, 2, 3]))
    expect((await readAnnotation(figure)).annotation?.summary).toBe('五处问题')
  })

  it('writes a document of pages into one sidecar, and its annotated copy beside it', async () => {
    const figure = join(directory, 'report.pdf')
    await writeFile(figure, '%PDF-1.7')
    const forFigure = paged({ path: figure })
    const saved = await writeAnnotation(figure, forFigure, { kind: 'pdf', bytes: new Uint8Array([0x25, 0x50]) })
    expect(saved.paths.annotation).toBe(join(directory, 'report.pdf.annot.json'))
    expect(saved.paths.review).toBe(join(directory, 'report.pdf.annotated.pdf'))
    expect(await readFile(saved.paths.review)).toEqual(Buffer.from([0x25, 0x50]))
    expect((await readAnnotation(figure)).annotation).toMatchObject({ figure: { pageCount: 4 }, marks: [{ page: 1 }, { page: 3 }] })
  })

  it('refuses a review artifact whose kind contradicts the figure itself', async () => {
    const figure = join(directory, 'report.pdf')
    await writeFile(figure, '%PDF-1.7')
    await expect(writeAnnotation(figure, paged({ path: figure }), { kind: 'image', bytes: new Uint8Array([1]) }))
      .rejects.toThrow(/a \.pdf review artifact cannot be written from image bytes/)
  })

  it('writes no review artifact when the browser exported none', async () => {
    const figure = join(directory, 'fig1.svg')
    await writeFile(figure, '<svg/>')
    const saved = await writeAnnotation(figure, document_)
    expect(saved.wroteReview).toBe(false)
    await expect(readFile(saved.paths.review)).rejects.toThrow()
  })

  it('answers null for a missing and for an unreadable sidecar', async () => {
    const figure = join(directory, 'fig2.svg')
    await writeFile(figure, '<svg/>')
    expect((await readAnnotation(figure)).annotation).toBeNull()
    await writeFile(join(directory, 'fig2.svg.annot.json'), '{ not json')
    expect((await readAnnotation(figure)).annotation).toBeNull()
  })

  it('names a sidecar too large to be one this plugin wrote', async () => {
    // The write path used to accept a document this cap then refused, and the read
    // answered "never annotated" — the reader's marks gone with the panel denying
    // there had ever been any. The file is named so the panel can say which one it is.
    const figure = join(directory, 'fig3.svg')
    await writeFile(figure, '<svg/>')
    const sidecar = join(directory, 'fig3.svg.annot.json')
    await writeFile(sidecar, `{"pad":"${'x'.repeat(5 * 1024 * 1024)}"}`)
    expect(await readAnnotation(figure)).toEqual({ annotation: null, unreadable: [sidecar] })
  })
})

describe('clearing a figure whose sidecar an earlier version wrote', () => {
  let directory: string
  beforeEach(async () => { directory = await mkdtemp(join(tmpdir(), 'dsh-figmark-clearpages-')) })
  afterEach(async () => { await rm(directory, { recursive: true, force: true }) })

  it('names a per-page sidecar it could not read', async () => {
    // A page file too large to read is a page's marks that exist and cannot be shown;
    // what the merge reports has to reach the panel, or one page's loss is silent.
    const figure = join(directory, 'report.pdf')
    await writeFile(figure, '%PDF-1.7')
    const forFigure = { ...document_, figure: { ...document_.figure, path: figure } }
    await writeFile(join(directory, 'report.pdf.p1.annot.json'), JSON.stringify(forFigure))
    const oversized = join(directory, 'report.pdf.p2.annot.json')
    await writeFile(oversized, `{"pad":"${'x'.repeat(5 * 1024 * 1024)}"}`)
    const read = await readAnnotation(figure)
    expect(read.annotation).not.toBeNull()
    expect(read.unreadable).toEqual([oversized])
  })

  it('still clears when the directory cannot be listed at all', async () => {
    // Listing is how the legacy page files are found; failing to list must not turn
    // "a legacy file might be missed" into "the reader cannot clear". The two current
    // names are attempted anyway, and that attempt is what would report a real problem.
    const removed = await removeAnnotation(join(directory, 'gone', 'report.pdf'))
    expect(removed.removed).toBe(false)
  })

  it('unlinks the legacy names too, so a cleared figure stays cleared', async () => {
    // A clear used to remove only the two current names, while the read path still
    // accepted the legacy base-name file and the per-page files. The read found what
    // the delete had not removed, so a cleared figure reopened with its marks on it.
    const figure = join(directory, 'report.pdf')
    await writeFile(figure, '%PDF-1.7')
    const forFigure = { ...document_, figure: { ...document_.figure, path: figure } }
    const legacy = join(directory, 'report.annot.json')
    const page = join(directory, 'report.pdf.p2.annot.json')
    await writeFile(legacy, JSON.stringify(forFigure))
    await writeFile(page, JSON.stringify(forFigure))
    expect((await readAnnotation(figure)).annotation).not.toBeNull()
    const removed = await removeAnnotation(figure)
    expect(removed.removed).toBe(true)
    expect(existsSync(legacy)).toBe(false)
    expect(existsSync(page)).toBe(false)
    expect((await readAnnotation(figure)).annotation).toBeNull()
  })
})

describe('the per-page sidecars an earlier version wrote', () => {
  let directory: string
  beforeEach(async () => { directory = await mkdtemp(join(tmpdir(), 'dsh-figmark-pages-')) })
  afterEach(async () => { await rm(directory, { recursive: true, force: true }) })

  /** Write one page of the earlier version's own shape: a base-name file with a page suffix. */
  const writeLegacyPage = async (figure: string, page: number, mark: AnnotationMark, spelling = ''): Promise<void> => {
    const name = `${figure.slice(figure.lastIndexOf('/') + 1)}${spelling}`
    await writeFile(join(directory, `${name}.p${page}.annot.json`), JSON.stringify({
      ...document_,
      figure: { ...document_.figure, path: figure },
      marks: [mark],
    }))
  }

  it('reads them as one document whose marks name their page', async () => {
    const figure = join(directory, 'report.pdf')
    await writeFile(figure, '%PDF-1.7')
    await writeLegacyPage(figure, 3, { id: 'later', kind: 'rect', color: '#1971c2', points: [[1, 1], [2, 2]], detail: '第三页' })
    await writeLegacyPage(figure, 1, { id: 'first', kind: 'pen', color: '#2f9e44', points: [[3, 3], [4, 4]] })
    const merged = defined((await readAnnotation(figure)).annotation)
    expect(merged.marks.map(mark => [mark.page, mark.id])).toEqual([[1, 'first'], [3, 'later']])
    // The per-page files never recorded the document's real length; the highest page
    // found stands in until the browser half saves the document again.
    expect(merged.figure.pageCount).toBe(3)
    expect(merged.summary).toBe('五处问题')
    // The unified name is what a save writes, so this read is a courtesy, not a state.
    expect(defined((await readAnnotation(figure)).annotation).figure.path).toBe(figure)
  })

  it('also reads the spelling an even earlier version used', async () => {
    const figure = join(directory, 'report.pdf')
    await writeFile(figure, '%PDF-1.7')
    await writeLegacyPage(figure, 2, { id: 'old', kind: 'pen', color: '#2f9e44', points: [[1, 1], [2, 2]] }, 'legacy')
    // `reportlegacy.p2.annot.json` belongs to a differently named figure, so nothing matches.
    expect((await readAnnotation(figure)).annotation).toBeNull()
    await writeFile(join(directory, 'report.p2.annot.json'), JSON.stringify({
      ...document_,
      figure: { ...document_.figure, path: figure },
      marks: [{ id: 'old', kind: 'pen', color: '#2f9e44', points: [[1, 1], [2, 2]] }],
    }))
    expect(defined((await readAnnotation(figure)).annotation).marks.map(mark => mark.page)).toEqual([2])
  })

  it('keeps the earliest creation and the latest update of the pages it merged', async () => {
    const figure = join(directory, 'report.pdf')
    await writeFile(figure, '%PDF-1.7')
    const page = async (number: number, createdAt: string, updatedAt: string): Promise<void> => {
      await writeFile(join(directory, `report.pdf.p${number}.annot.json`), JSON.stringify({
        ...document_,
        figure: { ...document_.figure, path: figure },
        createdAt,
        updatedAt,
        marks: [{ id: `m${number}`, kind: 'pen', color: '#2f9e44', points: [[1, 1], [2, 2]] }],
      }))
    }
    await page(1, '2026-05-02T00:00:00.000Z', '2026-05-02T00:00:00.000Z')
    await page(2, '2026-01-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z')
    const merged = defined((await readAnnotation(figure)).annotation)
    expect(merged.createdAt).toBe('2026-01-01T00:00:00.000Z')
    expect(merged.updatedAt).toBe('2026-06-01T00:00:00.000Z')
  })

  it('leaves the merged pages alone once the document has one sidecar', async () => {
    const figure = join(directory, 'report.pdf')
    await writeFile(figure, '%PDF-1.7')
    await writeFile(join(directory, 'report.pdf.annot.json'), JSON.stringify({ ...paged({ path: figure }), summary: '统一文档' }))
    await writeLegacyPage(figure, 1, { id: 'stale', kind: 'pen', color: '#2f9e44', points: [[1, 1], [2, 2]] })
    expect((await readAnnotation(figure)).annotation?.summary).toBe('统一文档')
  })

  it('does not read per-page files for a figure that never had pages', async () => {
    const figure = join(directory, 'fig1.svg')
    await writeFile(figure, '<svg/>')
    await writeLegacyPage(figure, 1, { id: 'x', kind: 'pen', color: '#2f9e44', points: [[1, 1], [2, 2]] })
    expect((await readAnnotation(figure)).annotation).toBeNull()
  })

  it('answers null when every page file belongs to another figure', async () => {
    const figure = join(directory, 'report.pdf')
    await writeFile(figure, '%PDF-1.7')
    await writeFile(join(directory, 'report.pdf.p1.annot.json'), JSON.stringify({
      ...document_,
      figure: { ...document_.figure, path: join(directory, 'other.pdf') },
    }))
    expect((await readAnnotation(figure)).annotation).toBeNull()
  })

  it('answers null when the directory cannot be listed', async () => {
    // A figure in a directory that is not there is the same answer as a figure with
    // no annotation: nothing to show, not a failure to open the preview.
    expect((await readAnnotation(join(directory, 'missing', 'report.pdf'))).annotation).toBeNull()
  })
})

describe('a sidecar written beside one figure in a shared workbench', () => {
  let directory: string
  beforeEach(async () => { directory = await mkdtemp(join(tmpdir(), 'dsh-figmark-shared-')) })
  afterEach(async () => { await rm(directory, { recursive: true, force: true }) })

  /** A v2 document: the shape the sibling annotator writes into the same workbench. */
  const v2Document = (figurePath: string): unknown => ({
    version: ANNOTATION_VERSION_V2,
    target: {
      kind: 'figure-svg',
      path: figurePath,
      relativePath: 'figures/fig9.svg',
      mediaType: 'image/svg+xml',
      width: 400,
      height: 300,
      sha256: 'd'.repeat(64),
    },
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-02-02T00:00:00.000Z',
    marks: [{
      id: 's1',
      kind: 'arrow',
      color: '#e03131',
      points: [[300, 225], [100, 66]],
      detail: '这个标号应指向滑套 34',
      targetFingerprint: `sha256:${'d'.repeat(64)}`,
      anchor: { tag: 'g', title: '102', id: 'node102', nodeId: '102', ref: '34', text: '导柱', bbox: [40, 40, 120, 60] },
    }],
    summary: 'v2 总体说明',
  })

  it('reads a v2 document back in its own shape', async () => {
    const figure = join(directory, 'fig9.svg')
    await writeFile(figure, '<svg/>')
    await writeFile(join(directory, 'fig9.svg.annot.json'), JSON.stringify(v2Document(figure)))
    const stored = defined((await readAnnotation(figure)).annotation)
    expect(stored.figure.path).toBe(figure)
    expect(stored.figure.sha256).toBe('d'.repeat(64))
    expect(stored.summary).toBe('v2 总体说明')
    expect(stored.marks).toHaveLength(1)
    expect(defined(stored.marks[0]).detail).toBe('这个标号应指向滑套 34')
    // The figure's path stands in for the address v2 does not carry, and the fields
    // this plugin does not model are dropped rather than carried along as noise.
    expect(stored.figure.address).toBe(figure)
    expect(defined(stored.marks[0]).anchor)
      .toEqual({ tag: 'g', title: '102', id: 'node102', text: '导柱', bbox: [40, 40, 120, 60] })
  })

  it('reads the marks file earlier versions named after the base name alone', async () => {
    const figure = join(directory, 'fig10.svg')
    await writeFile(figure, '<svg/>')
    const forFigure = { ...document_, figure: { ...document_.figure, path: figure } }
    await writeFile(join(directory, 'fig10.annot.json'), JSON.stringify(forFigure))
    expect((await readAnnotation(figure)).annotation?.summary).toBe('五处问题')
  })

  it('prefers the current name when both names hold a document', async () => {
    const figure = join(directory, 'fig11.svg')
    await writeFile(figure, '<svg/>')
    const forFigure = { ...document_, figure: { ...document_.figure, path: figure } }
    await writeFile(join(directory, 'fig11.svg.annot.json'), JSON.stringify({ ...forFigure, summary: '当前名' }))
    await writeFile(join(directory, 'fig11.annot.json'), JSON.stringify({ ...forFigure, summary: '旧名' }))
    expect((await readAnnotation(figure)).annotation?.summary).toBe('当前名')
  })

  it('refuses a legacy sidecar that belongs to a figure of the same base name', async () => {
    const svg = join(directory, 'fig12.svg')
    const png = join(directory, 'fig12.png')
    await writeFile(svg, '<svg/>')
    await writeFile(png, 'png')
    // One legacy name, two figures: the document itself says which one it annotates.
    await writeFile(
      join(directory, 'fig12.annot.json'),
      JSON.stringify({ ...document_, figure: { ...document_.figure, path: png } }),
    )
    expect((await readAnnotation(svg)).annotation).toBeNull()
    expect((await readAnnotation(png)).annotation?.summary).toBe('五处问题')
  })

  it('answers null for a document it cannot recognize', async () => {
    const figure = join(directory, 'fig13.svg')
    await writeFile(figure, '<svg/>')
    const sidecar = join(directory, 'fig13.svg.annot.json')
    const bodies = [
      JSON.stringify({ version: 9 }),
      JSON.stringify(7),
      JSON.stringify(null),
      JSON.stringify({ version: ANNOTATION_VERSION_V2, target: 'figure' }),
      JSON.stringify({ version: ANNOTATION_VERSION_V2, target: null }),
    ]
    for (const body of bodies) {
      await writeFile(sidecar, body)
      expect((await readAnnotation(figure)).annotation).toBeNull()
    }
  })
})

describe('model-facing summary', () => {
  it('describes every mark kind with its geometry and note', () => {
    expect(describeMark(defined(document_.marks[0]), 0, 'zh'))
      .toBe('① 箭头 (300,225) → (100,66)（元素标题「102」，id=node102，元素文字「导柱」），批注：这个标号应指向滑套 34')
    expect(describeMark(defined(document_.marks[1]), 1, 'zh')).toBe('② 手绘线 (1,2)-(5,6)，（未写说明）')
    expect(describeMark(defined(document_.marks[2]), 2, 'zh')).toBe('③ 圈选 (10,20)-(30,40)，批注：轮廓多余')
    expect(describeMark(defined(document_.marks[4]), 4, 'zh')).toBe('⑤ 单点位于 (200,200)，批注：图号应在正下方')
    expect(describeMarks(document_, 'en')[2]).toContain('ellipse (10,20)-(30,40)')
  })

  it('writes a box by its corners, whichever way it was dragged', () => {
    // A box dragged up and to the left arrives as (bottom-right, top-left). Handing that
    // pair to the agent makes it take a min and a max before it knows the area, and a
    // mark it has to arithmetic on is a mark it can get wrong. Both directions read the
    // same, so the same box always says the same thing.
    const swept = (points: readonly FigurePoint[]): string => describeMark(
      { id: 'b1', kind: 'rect', color: '#e03131', points, detail: '图例压到数据了' },
      0,
      'zh',
    )
    const corner = swept([[187, 138], [42, 88]])
    expect(corner).toBe('① 框选 (42,88)-(187,138)，批注：图例压到数据了')
    // Drawn the other way round, and both ways for an ellipse too.
    expect(swept([[42, 88], [187, 138]])).toBe(corner)
    expect(describeMark(
      { id: 'e1', kind: 'ellipse', color: '#1971c2', points: [[30, 90], [10, 20]], detail: '' },
      0,
      'zh',
    )).toBe('① 圈选 (10,20)-(30,90)，（未写说明）')
  })

  it('says where a freehand stroke was drawn, not how many points it has', () => {
    // "37 points" locates nothing: a reader given only the count cannot find the line on
    // the figure. The box it was drawn in is what says where to look.
    const stroke: AnnotationMark = {
      id: 'p1',
      kind: 'pen',
      color: '#2f9e44',
      points: [[120, 40], [90, 12], [140, 70]],
      detail: '这条曲线漏了一段',
    }
    expect(describeMark(stroke, 0, 'zh')).toBe('① 手绘线 (90,12)-(140,70)，批注：这条曲线漏了一段')
    expect(describeMark(stroke, 0, 'en')).toContain('freehand stroke (90,12)-(140,70)')
    // A stroke that was never given a point still has to render.
    expect(describeMark({ ...stroke, points: [] }, 0, 'zh')).toBe('① 手绘线，批注：这条曲线漏了一段')
  })

  it('says how far a mark reaches past the figure, and stays quiet when it does not', () => {
    // The reader marked up a 1179x878 figure and drew past the top. A negative
    // coordinate is accurate but asks the agent to notice a sign and infer what it
    // means; naming the overhang removes that step. A mark inside the figure gets no
    // suffix at all, because a note about nothing is noise on every line that has none.
    const figure = { address: 'a', path: '/w/f.png', mediaType: 'image/png', width: 1179, height: 878, sha256: 'x' }
    const at = (points: readonly FigurePoint[], kind: MarkKind): string => describeMark(
      { id: 'x', kind, color: '#e03131', points, detail: 'dd' },
      0,
      'zh',
      figure,
    )
    expect(at([[191, -57], [400, 117]], 'ellipse')).toContain('（超出图面：上 57 像素）')
    expect(at([[698, 24], [773, -314]], 'arrow')).toContain('（超出图面：上 314 像素）')
    expect(at([[1100, 800], [1300, 950]], 'rect')).toContain('（超出图面：右 121、下 72 像素）')
    // Two sides at once, in a fixed order, so the same box always reads the same way.
    expect(at([[-30, -40], [200, 200]], 'rect')).toContain('（超出图面：左 30、上 40 像素）')
    // Inside the figure: nothing added.
    expect(at([[319, 220], [768, 658]], 'pen')).toBe('① 手绘线 (319,220)-(768,658)，批注：dd')
    // Exactly on the edge is on the figure, not past it.
    expect(at([[0, 0], [1179, 878]], 'rect')).not.toContain('超出')
  })

  it('says it in English, and says it to a reader with no figure size to check against', () => {
    const figure = { address: 'a', path: '/w/f.png', mediaType: 'image/png', width: 100, height: 100, sha256: 'x' }
    const mark: AnnotationMark = { id: 'x', kind: 'point', color: '#e03131', points: [[-5, 50]], detail: 'dd' }
    expect(describeMark(mark, 0, 'en', figure)).toContain('(off the figure: left 5 px)')
    // Without a size there is nothing to measure against, and a guess would be worse
    // than silence: a document that never recorded its figure is rare but possible.
    expect(describeMark(mark, 0, 'en')).toBe('① at (-5,50), note: dd')
  })

  it('names the page each mark of a document sits on', () => {
    const marks = describeMarks(paged(), 'zh')
    expect(marks[0]).toBe('① 第 1 页 框选 (10,20)-(60,90)，（未写说明）')
    expect(marks[1]).toBe('② 第 3 页 箭头 (1,2) → (3,4)，批注：第三页')
    expect(describeMarks(paged(), 'en')[1]).toContain('page 3 arrow')
  })

  it('names the element a mark on a rendered document points at', () => {
    const mark: AnnotationMark = {
      id: 'h1',
      kind: 'rect',
      color: '#e03131',
      points: [[10, 20], [60, 90]],
      detail: '这段要改',
      anchor: {
        tag: 'p',
        bbox: [0, 0, 1024, 200],
        id: 'lead',
        text: '第一段',
        selector: '#lead',
      },
    }
    // The selector is what a reader of the source resolves the mark by, so it
    // travels with every anchor that has one.
    expect(describeMark(mark, 0, 'zh'))
      .toBe('① 框选 (10,20)-(60,90)（id=lead，元素文字「第一段」，选择器 #lead），批注：这段要改')
    expect(describeMark(mark, 0, 'en')).toContain('(id=lead, element text')
    expect(describeMark(mark, 0, 'en')).toContain('selector #lead')
    // An anchor with nothing but a tag still names the element it points at.
    const bare: AnnotationMark = { ...mark, anchor: { tag: 'p', bbox: [0, 0, 1, 1] } }
    expect(describeMark(bare, 0, 'zh')).toContain('（<p>）')
  })

  it('names the element an element mark selected, without reading it as a region', () => {
    const mark: AnnotationMark = {
      id: 'e1',
      kind: 'element',
      color: '#1971c2',
      points: [[10, 20], [60, 90]],
      detail: '这条线要加粗',
      anchor: { tag: 'path', bbox: [10, 20, 50, 70], id: 'line2d_10' },
    }
    // The box locates the element on the picture; the anchor says which one it is.
    // The phrase stays "element (box)" rather than "框选" so the agent reads a thing
    // that was pointed at, not a region that was drawn.
    expect(describeMark(mark, 0, 'zh'))
      .toBe('① 选中元素 (10,20)-(60,90)（id=line2d_10），批注：这条线要加粗')
    expect(describeMark(mark, 0, 'en')).toContain('element (10,20)-(60,90)')
    // A half-recorded selection still says what it is, and says no box rather than
    // inventing one from the single corner it has.
    const one: AnnotationMark = { ...mark, points: [[10, 20]] }
    expect(describeMark(one, 0, 'zh')).toBe('① 选中元素（id=line2d_10），批注：这条线要加粗')
  })

  it('says how far a mark was turned, so the model knows its angle', () => {
    const turned = (rotation: number, kind: MarkKind = 'rect'): AnnotationMark => ({
      id: 'r', kind, color: '#000', points: [[10, 20], [60, 90]], rotation,
    })
    expect(describeMark(turned(45), 0, 'zh')).toContain('（旋转 45°）')
    expect(describeMark(turned(45), 0, 'en')).toContain('(rotated 45°)')
    expect(describeMark(turned(90, 'arrow'), 0, 'zh')).toContain('（旋转 90°）')
    expect(describeMark(turned(90, 'ellipse'), 0, 'en')).toContain('(rotated 90°)')
    expect(describeMark(turned(30, 'pen'), 0, 'zh')).toContain('（旋转 30°）')
    expect(describeMark(turned(30, 'pen'), 0, 'en')).toContain('(rotated 30°)')
    // A mark that was not turned says nothing about rotation.
    expect(describeMark(turned(0), 0, 'zh')).not.toContain('旋转')
    expect(describeMark({ id: 'r', kind: 'rect', color: '#000', points: [[0, 0], [1, 1]] }, 0, 'en'))
      .not.toContain('rotated')
  })

  it('numbers past ten without inventing symbols', () => {
    const many = Array.from({ length: 11 }, (_, index) => ({
      id: `m${index}`, kind: 'point' as const, color: '#000', points: [[index, index]] as const,
    }))
    expect(describeMark(defined(many[10]), 10, 'zh').startsWith('11.')).toBe(true)
  })

  it('names a shape without geometry when the mark carries too few points', () => {
    // The wire format only requires one point, so a half-drawn shape is a state
    // the summary has to survive rather than a caller error.
    const one = (kind: MarkKind): AnnotationMark => ({ id: 'b', kind, color: '#000', points: [[1, 1]] })
    const none = (kind: MarkKind): AnnotationMark => ({ id: 'b', kind, color: '#000', points: [] })
    expect(describeMark(one('arrow'), 0, 'zh')).toBe('① 箭头，（未写说明）')
    expect(describeMark(one('rect'), 0, 'zh')).toBe('① 框选，（未写说明）')
    expect(describeMark(one('ellipse'), 0, 'en')).toBe('① ellipse, (no detail)')
    expect(describeMark(none('arrow'), 0, 'en')).toBe('① arrow, (no detail)')
    expect(describeMark(none('rect'), 0, 'en')).toBe('① box, (no detail)')
    expect(describeMark(none('ellipse'), 0, 'zh')).toBe('① 圈选，（未写说明）')
    expect(describeMark(none('point'), 0, 'zh')).toBe('① 单点，（未写说明）')
    expect(describeMark(none('point'), 0, 'en')).toBe('① a point, (no detail)')
  })

  it('names an anchor by whatever it knows: title, id, text, or just the tag', () => {
    const withAnchor = (anchor: AnnotationMark['anchor']): string =>
      describeMark({ id: 'a', kind: 'rect', color: '#000', points: [[0, 0], [1, 1]], ...(anchor === undefined ? {} : { anchor }) }, 0, 'zh')
    expect(withAnchor({ tag: 'g', bbox: [0, 0, 1, 1] })).toContain('（<g>）')
    expect(withAnchor({ tag: 'g', id: 'n1', bbox: [0, 0, 1, 1] })).toContain('（id=n1）')
    expect(withAnchor({ tag: 'text', text: '导柱', bbox: [0, 0, 1, 1] })).toContain('（元素文字「导柱」）')
    expect(withAnchor({ tag: 'g', title: '102', bbox: [0, 0, 1, 1] })).toContain('（元素标题「102」）')
    expect(withAnchor(undefined)).toBe('① 框选 (0,0)-(1,1)，（未写说明）')
  })
})

describe('removing the sidecars', () => {
  let directory: string
  beforeEach(async () => { directory = await mkdtemp(join(tmpdir(), 'dsh-figmark-rm-')) })
  afterEach(async () => { await rm(directory, { recursive: true, force: true }) })

  it('removes both files and leaves the figure itself alone', async () => {
    const figure = join(directory, 'fig1.svg')
    await writeFile(figure, '<svg/>')
    const saved = await writeAnnotation(figure, document_, { kind: 'image', bytes: new Uint8Array([1, 2, 3]) })
    const result = await removeAnnotation(figure)
    expect(result.removed).toBe(true)
    expect(result.paths.annotation).toBe(saved.paths.annotation)
    // The figure is the reader's own file and must survive.
    expect(await readFile(figure)).toEqual(Buffer.from('<svg/>'))
    await expect(readFile(saved.paths.annotation)).rejects.toThrow()
    await expect(readFile(saved.paths.review)).rejects.toThrow()
  })

  it('reports nothing removed when there were no sidecars at all', async () => {
    const figure = join(directory, 'fig2.svg')
    await writeFile(figure, '<svg/>')
    expect((await removeAnnotation(figure)).removed).toBe(false)
  })

  it('removes a marks file that has no review artifact beside it', async () => {
    const figure = join(directory, 'fig3.svg')
    await writeFile(figure, '<svg/>')
    const saved = await writeAnnotation(figure, document_)
    expect((await removeAnnotation(figure)).removed).toBe(true)
    await expect(readFile(saved.paths.annotation)).rejects.toThrow()
  })

  it('reports a removal that fails for a reason other than the file being gone', async () => {
    const figure = join(directory, 'fig4.svg')
    await writeFile(figure, '<svg/>')
    const saved = await writeAnnotation(figure, document_, { kind: 'image', bytes: new Uint8Array([1]) })
    // A directory in the marks file's place cannot be unlinked as a file, which is
    // the one failure the caller has to hear about: the stale file would resurrect
    // the annotation on the next open.
    await rm(saved.paths.annotation)
    await mkdir(saved.paths.annotation)
    await expect(removeAnnotation(figure)).rejects.toThrow()
  })
})

