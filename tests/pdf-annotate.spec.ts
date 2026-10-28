/** Writing the marks into the document as native PDF annotations. */
import { describe, expect, it } from 'vitest'
import { PDFArray, PDFDict, PDFDocument, PDFHexString, PDFName, PDFRawStream, PDFString, degrees } from 'pdf-lib'
import type { AnnotationMark } from '../src/shared/annotation'
import { annotatePdf, toUserSpace, unitScale, type PageAnnotateInput } from '../src/client/pdf/annotate'
import { defined } from './dom'

/** The transform of an unrotated page whose media box is 612×792. */
const FLAT = [1, 0, 0, -1, 0, 792] as const

/** A document with one plain page and one rotated a quarter turn. */
async function sourceBytes(): Promise<Uint8Array> {
  const document_ = await PDFDocument.create()
  document_.addPage([612, 792])
  document_.addPage([612, 792]).setRotation(degrees(90))
  return await document_.save()
}

/** What this spec reads off one annotation the parser hands back. */
interface ParsedAnnotation {
  readonly subtype: string
  readonly rect: readonly number[]
  readonly contentsObj?: { readonly str?: string } | undefined
  readonly inkLists?: readonly (ArrayLike<number> | undefined)[] | undefined
  readonly hasAppearance?: boolean | undefined
}

/**
 * The annotations one page carries, as the parser reports them.
 *
 * The legacy build this spec parses with ships no types for its display API, so
 * the shape is declared here rather than inferred from `any`.
 *
 * @param document_ - the parsed document.
 * @param page - 1-based page number.
 * @returns the page's annotations.
 */
async function parsedAnnotations(
  document_: { getPage: (page: number) => Promise<{ getAnnotations: () => Promise<unknown> }> },
  page: number,
): Promise<ParsedAnnotation[]> {
  const raw: unknown = await (await document_.getPage(page)).getAnnotations()
  return raw as ParsedAnnotation[]
}

/** One annotation, read back into plain numbers. */
interface ReadAnnotation {
  readonly subtype: string
  readonly rect: readonly number[]
  readonly contents: string
  readonly appearance: boolean
  readonly inkList?: readonly number[]
  readonly line?: readonly number[]
  readonly endings?: readonly string[]
  readonly color?: readonly number[]
  readonly width?: number
  readonly da?: string
}

/** Read one page's annotations back out of a saved document. */
async function readAnnotations(bytes: Uint8Array, page: number): Promise<ReadAnnotation[]> {
  const document_ = await PDFDocument.load(bytes)
  const annots = defined(document_.getPage(page - 1).node.Annots())
  const read: ReadAnnotation[] = []
  for (let index = 0; index < annots.size(); index += 1) {
    const entry = document_.context.lookup(annots.get(index))
    if (!(entry instanceof PDFDict)) continue
    const numbers = (name: string): number[] | undefined => {
      const value = entry.get(PDFName.of(name))
      return value instanceof PDFArray ? value.asArray().map(item => Number(item.toString())) : undefined
    }
    const text = (name: string): string | undefined => {
      const value = entry.get(PDFName.of(name))
      if (value instanceof PDFString || value instanceof PDFHexString) return value.decodeText()
      return value?.toString()
    }
    const appearance = entry.get(PDFName.of('AP'))
    const da = text('DA')
    const line = numbers('L')
    const color = numbers('C')
    const endings = entry.get(PDFName.of('LE'))
    read.push({
      subtype: defined(entry.get(PDFName.of('Subtype'))).toString().slice(1),
      rect: defined(numbers('Rect')),
      contents: text('Contents') ?? '',
      appearance: appearance !== undefined,
      ...(numbers('InkList') === undefined ? {} : { inkList: describedInk(document_, entry) }),
      ...(line === undefined ? {} : { line }),
      ...(endings === undefined ? {} : { endings: (endings as PDFArray).asArray().map(item => item.toString().slice(1)) }),
      ...(color === undefined ? {} : { color }),
      ...(entry.get(PDFName.of('BS')) === undefined ? {} : { width: borderWidth(document_, entry) }),
      ...(da === undefined ? {} : { da }),
    })
  }
  return read
}

/** The single ink path's coordinates, flattened. */
function describedInk(document_: PDFDocument, entry: PDFDict): number[] {
  const list = document_.context.lookup(defined(entry.get(PDFName.of('InkList'))))
  if (!(list instanceof PDFArray)) throw new Error('no ink list')
  const path = document_.context.lookup(defined(list.get(0)))
  if (!(path instanceof PDFArray)) throw new Error('no ink path')
  return path.asArray().map(item => Number(item.toString()))
}

/**
 * The content stream one annotation's appearance draws, decoded.
 * @param bytes - the annotated document.
 * @param page - 1-based page the annotation is on.
 * @param index - position of the annotation in the page's own array.
 * @returns the drawing operators.
 */
async function appearanceContent(bytes: Uint8Array, page: number, index: number): Promise<string> {
  const document_ = await PDFDocument.load(bytes)
  const annots = defined(document_.getPage(page - 1).node.Annots())
  const entry = document_.context.lookup(annots.get(index))
  if (!(entry instanceof PDFDict)) throw new Error('no annotation')
  const streams = document_.context.lookup(defined(entry.get(PDFName.of('AP'))))
  if (!(streams instanceof PDFDict)) throw new Error('no appearance')
  const form = document_.context.lookup(defined(streams.get(PDFName.of('N'))))
  if (!(form instanceof PDFRawStream)) throw new Error('no appearance stream')
  return new TextDecoder().decode(form.getContents())
}

/** The stroke width an annotation declares. */
function borderWidth(document_: PDFDocument, entry: PDFDict): number {
  const border = document_.context.lookup(defined(entry.get(PDFName.of('BS'))))
  if (!(border instanceof PDFDict)) throw new Error('no border style')
  return Number(defined(border.get(PDFName.of('W'))).toString())
}

/** One mark of each kind, in page units of a 612×792 page. */
const marks: AnnotationMark[] = [
  { id: 'arrow', kind: 'arrow', color: '#e03131', points: [[100, 200], [300, 260]], detail: '箭头说明', page: 1 },
  { id: 'rect', kind: 'rect', color: '#1971c2', points: [[80, 400], [280, 500]], detail: 'box note', page: 1 },
  { id: 'ellipse', kind: 'ellipse', color: '#f08c00', points: [[330, 400], [500, 500]], page: 1 },
  { id: 'pen', kind: 'pen', color: '#2f9e44', points: [[60, 700], [120, 650], [200, 690]], page: 1 },
  { id: 'point', kind: 'point', color: '#e03131', points: [[320, 700]], detail: 'Latin note', page: 1 },
  { id: 'cjk', kind: 'point', color: '#1971c2', points: [[320, 100]], detail: '中文批注', page: 1 },
]

/** The two pages one call annotates. */
function pages(): PageAnnotateInput[] {
  return [
    { page: 1, transform: FLAT, marks },
    { page: 2, transform: [0, 1, 1, 0, 0, 0], marks: [{ id: 'rotated', kind: 'arrow', color: '#e03131', points: [[100, 300], [400, 300]], page: 2 }] },
  ]
}

describe('writing marks into a document', () => {
  it('writes each mark as the annotation kind it stands for', async () => {
    const annotated = await annotatePdf(await sourceBytes(), pages())
    const read = await readAnnotations(annotated, 1)
    expect(read.map(annotation => annotation.subtype))
      .toEqual(['Line', 'Square', 'Circle', 'Ink', 'Text', 'Text'])
    expect(read[0]).toMatchObject({ contents: '箭头说明', endings: ['None', 'OpenArrow'], appearance: true })
    expect(read[1]).toMatchObject({ contents: 'box note', appearance: true })
    expect(read[3]?.inkList).toEqual([60, 92, 120, 142, 200, 102])
    expect(defined(read[3]).color?.map(channel => Math.round(channel * 255))).toEqual([47, 158, 68])
    expect(defined(read[0]).width).toBeCloseTo(2.5, 3)
  })

  it('places the marks where the user drew them, in page units', async () => {
    const annotated = await annotatePdf(await sourceBytes(), pages())
    const read = await readAnnotations(annotated, 1)
    // Display (100,200) → (300,260) on a 792-unit-tall page is user (100,592) → (300,532).
    expect(read[0]?.line).toEqual([100, 592, 300, 532])
    // The rectangle's own box, the two corners it was drawn between.
    expect(read[1]?.rect).toEqual([75, 287, 285, 397])
    // A point's box is the ring drawn around it, so it is square and centred on
    // the coordinate: display (320,700) is user (320,92), padded by 14 either way.
    expect(defined(read[4]).rect).toEqual([306, 78, 334, 106])
  })

  it('draws an appearance for every mark, from shapes only, and never a glyph', async () => {
    const annotated = await annotatePdf(await sourceBytes(), pages())
    const read = await readAnnotations(annotated, 1)
    // Nothing in the file depends on a font any more, so even a Chinese sentence
    // needs no embedded typeface: it is `/Contents`, and the mark is a ring.
    expect(read.map(annotation => annotation.appearance)).toEqual([true, true, true, true, true, true])
    expect(read[5]?.contents).toBe('中文批注')
    const ring = await appearanceContent(annotated, 1, 4)
    expect(ring).toContain('RG')
    // A stroked circle and a filled dot: two closed Bézier rings, no text operator.
    expect(ring.match(/ c /gu)?.length).toBe(8)
    expect(ring).not.toMatch(/ Tf | Tj | TJ /u)
  })

  it('keeps the document itself, its pages, and any annotation it already carried', async () => {
    const document_ = await PDFDocument.create()
    const page = document_.addPage([612, 792])
    const existing = PDFDict.withContext(document_.context)
    existing.set(PDFName.of('Type'), PDFName.of('Annot'))
    existing.set(PDFName.of('Subtype'), PDFName.of('Text'))
    existing.set(PDFName.of('Rect'), document_.context.obj([0, 0, 0, 0]))
    const annots = PDFArray.withContext(document_.context)
    annots.push(document_.context.register(existing))
    page.node.set(PDFName.of('Annots'), annots)
    const annotated = await annotatePdf(await document_.save(), [{ page: 1, transform: FLAT, marks: [defined(marks[1])] }])
    const reloaded = await PDFDocument.load(annotated)
    expect(reloaded.getPageCount()).toBe(1)
    expect(reloaded.getPage(0).getSize()).toEqual({ width: 612, height: 792 })
    const read = await readAnnotations(annotated, 1)
    expect(read.map(annotation => annotation.subtype)).toEqual(['Text', 'Square'])
  })

  it('adds no form at all, because no annotation draws a glyph', async () => {
    const annotated = await annotatePdf(await sourceBytes(), pages())
    const document_ = await PDFDocument.load(annotated)
    expect(document_.catalog.get(PDFName.of('AcroForm'))).toBeUndefined()
  })

  it('leaves a page with no marks without an annotation array', async () => {
    const annotated = await annotatePdf(await sourceBytes(), [{ page: 1, transform: FLAT, marks: [] }])
    const document_ = await PDFDocument.load(annotated)
    expect(document_.getPage(0).node.Annots()).toBeUndefined()
  })

  it('refuses a page the document does not have', async () => {
    await expect(annotatePdf(await sourceBytes(), [{ page: 5, transform: FLAT, marks: [defined(marks[0])] }]))
      .rejects.toThrow('page 5 is outside this 2-page document')
  })

  it('refuses a degenerate transform rather than writing a folded rectangle', async () => {
    await expect(annotatePdf(await sourceBytes(), [{ page: 1, transform: [0, 0, 0, 0, 0, 0], marks: [defined(marks[0])] }]))
      .rejects.toThrow('the page transform is degenerate')
  })
})

describe('a mark the reader turned', () => {
  /** A turned mark's annotation, drawn on its own so the appearance is easy to read. */
  async function turned(mark: AnnotationMark): Promise<{ readonly content: string; readonly rect: readonly number[] }> {
    const annotated = await annotatePdf(await sourceBytes(), [{ page: 1, transform: FLAT, marks: [mark] }])
    const read = await readAnnotations(annotated, 1)
    return { content: await appearanceContent(annotated, 1, 0), rect: defined(read[0]).rect }
  }

  it('turns a box into the diamond it became, not the upright box it was drawn as', async () => {
    // A 200×100 box turned a quarter turn stands 100 wide and 200 tall on screen.
    const { rect, content } = await turned({
      id: 'box', kind: 'rect', color: '#1971c2', points: [[100, 200], [300, 300]], rotation: 90, page: 1,
    })
    // The box is padded by the stroke width, as every stroked mark's box is.
    const width = defined(rect[2]) - defined(rect[0])
    const height = defined(rect[3]) - defined(rect[1])
    expect(width).toBeCloseTo(110, 0)
    expect(height).toBeCloseTo(210, 0)
    // Struck as a ring of points, because a `/Square` cannot be turned.
    expect(content).not.toMatch(/ re S$/u)
    expect(content.match(/ \d+(\.\d+)? l/gu)?.length ?? 0).toBeGreaterThan(2)
  })

  it('samples a turned ellipse as a smooth ring instead of a circle', async () => {
    const { rect, content } = await turned({
      id: 'ring', kind: 'ellipse', color: '#f08c00', points: [[100, 200], [300, 300]], rotation: 90, page: 1,
    })
    const width = defined(rect[2]) - defined(rect[0])
    const height = defined(rect[3]) - defined(rect[1])
    expect(width).toBeCloseTo(110, 0)
    expect(height).toBeCloseTo(210, 0)
    // Every sampled step is a line, and there are enough of them to read as a curve.
    expect(content.match(/ l/gu)?.length ?? 0).toBeGreaterThan(60)
    expect(content).not.toMatch(/ c$/u)
  })

  it('turns an arrow about its own centre, so it still points where it pointed', async () => {
    const { content, rect } = await turned({
      id: 'arrow', kind: 'arrow', color: '#e03131', points: [[100, 300], [300, 300]], rotation: 90, page: 1,
    })
    // A horizontal arrow at (100,300)-(300,300) turned a quarter turn about (200,300)
    // becomes vertical: its box is thin across and long down.
    expect(defined(rect[2]) - defined(rect[0])).toBeLessThan(40)
    expect(defined(rect[3]) - defined(rect[1])).toBeGreaterThan(180)
    expect(content).toMatch(/ m /u)
  })

  it('leaves a turned point upright, because a ring has no extent to turn', async () => {
    const plain = await turned({
      id: 'dot', kind: 'point', color: '#e03131', points: [[100, 400]], page: 1,
    })
    const spun = await turned({
      id: 'dot', kind: 'point', color: '#e03131', points: [[100, 400]], rotation: 90, page: 1,
    })
    expect(spun.rect).toEqual(plain.rect)
    expect(spun.content).toBe(plain.content)
  })

  it('turns a half-drawn box with the points it does have', async () => {
    // A box drawn from one corner only has no ring to trace, but the press that drew
    // it still counted, so the point it has is turned rather than left upright.
    const { rect } = await turned({
      id: 'half', kind: 'rect', color: '#1971c2', points: [[100, 200]], rotation: 90, page: 1,
    })
    expect(defined(rect[2]) - defined(rect[0])).toBeCloseTo(10, 3)
  })
})

describe('marks a reader has to cope with', () => {  it('writes a half-drawn shape as an annotation with no appearance of its own', async () => {
    const half: AnnotationMark[] = [
      { id: 'rect', kind: 'rect', color: '#1971c2', points: [[10, 20]], page: 1 },
      { id: 'ellipse', kind: 'ellipse', color: '#f08c00', points: [[30, 40]], page: 1 },
      { id: 'arrow', kind: 'arrow', color: '#e03131', points: [[50, 60]], page: 1 },
    ]
    const annotated = await annotatePdf(await sourceBytes(), [{ page: 1, transform: FLAT, marks: half }])
    const read = await readAnnotations(annotated, 1)
    expect(read.map(annotation => annotation.subtype)).toEqual(['Square', 'Circle', 'Line'])
    // Nothing to draw, so the reader falls back to its own default appearance.
    expect(read.map(annotation => annotation.appearance)).toEqual([false, false, false])
  })

  it('writes an element mark as the box it was selected in', async () => {
    // A stray `element` mark on a page with no DOM to name is still a place and a
    // box, so it is written as the one box annotation type that says "this region".
    const annotated = await annotatePdf(await sourceBytes(), [{
      page: 1,
      transform: FLAT,
      marks: [{ id: 'el', kind: 'element', color: '#1971c2', points: [[100, 200], [300, 260]], detail: 'this bar', page: 1 }],
    }])
    const read = await readAnnotations(annotated, 1)
    expect(read.map(annotation => annotation.subtype)).toEqual(['Square'])
    expect(read[0]?.contents).toBe('this bar')
    expect(await appearanceContent(annotated, 1, 0)).toContain('RG')
  })

  it('refuses a mark with no coordinates at all', async () => {
    await expect(annotatePdf(await sourceBytes(), [{
      page: 1,
      transform: FLAT,
      marks: [{ id: 'empty', kind: 'rect', color: '#1971c2', points: [], page: 1 }],
    }])).rejects.toThrow('an annotation mark needs at least one coordinate pair')
  })

  it('still draws a silent point\'s ring, and writes it no contents at all', async () => {
    const blank: AnnotationMark[] = [
      { id: 'none', kind: 'point', color: '#e03131', points: [[10, 20]], page: 1 },
      { id: 'spaces', kind: 'point', color: '#e03131', points: [[10, 60]], detail: '   ', page: 1 },
    ]
    const annotated = await annotatePdf(await sourceBytes(), [{ page: 1, transform: FLAT, marks: blank }])
    const read = await readAnnotations(annotated, 1)
    // The ring is the mark; the sentence is optional. A reader still sees where it is.
    expect(read.map(annotation => annotation.appearance)).toEqual([true, true])
    expect(read.map(annotation => annotation.contents)).toEqual(['', ''])
  })

  it('falls back to black when a mark carries a colour that is not one', async () => {
    const annotated = await annotatePdf(await sourceBytes(), [{
      page: 1,
      transform: FLAT,
      marks: [{ id: 'odd', kind: 'rect', color: 'vermilion', points: [[10, 20], [60, 90]], page: 1 }],
    }])
    const read = await readAnnotations(annotated, 1)
    expect(read[0]?.color).toEqual([0, 0, 0])
    expect(await appearanceContent(annotated, 1, 0)).toContain('0 0 0 RG')
  })

  it('refuses a degenerate transform for a point too', async () => {
    // A point mark goes through the same `toUserSpace`, so a folded transform is
    // refused rather than written out as coordinates of `Infinity`.
    await expect(annotatePdf(await sourceBytes(), [{
      page: 1,
      transform: [0, 0, 0, 0, 0, 0],
      marks: [{ id: 'dot', kind: 'point', color: '#e03131', points: [[10, 20]], detail: 'note', page: 1 }],
    }])).rejects.toThrow('the page transform is degenerate')
    expect(() => toUserSpace([0, 0, 0, 0, 0, 0], [0, 0])).toThrow('the page transform is degenerate')
  })
})

describe('a real parser sees the annotations', () => {
  it('reads the same kinds, boxes and notes back', async () => {
    const annotated = await annotatePdf(await sourceBytes(), pages())
    const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs')
    const task = getDocument({ data: new Uint8Array(annotated), useWorkerFetch: false })
    const document_ = await task.promise
    const first = await parsedAnnotations(document_, 1)
    expect(first.map(annotation => annotation.subtype))
      .toEqual(['Line', 'Square', 'Circle', 'Ink', 'Text', 'Text'])
    expect(defined(first[0]).contentsObj?.str).toBe('箭头说明')
    expect(defined(first[3]).inkLists).toHaveLength(1)
    expect(Array.from(defined(defined(first[3]).inkLists)[0] ?? []))
      .toEqual([60, 92, 120, 142, 200, 102])
    expect(defined(first[1]).rect).toEqual([75, 287, 285, 397])
    expect(defined(first[4]).hasAppearance).toBe(true)
    expect(defined(first[5]).hasAppearance).toBe(true)
    const second = await parsedAnnotations(document_, 2)
    expect(second.map(annotation => annotation.subtype)).toEqual(['Line'])
    // The rotated page's arrow is a vertical line in the document because the whole
    // page is rotated for display: it is horizontal on screen, where it was drawn.
    const arrow = defined(second[0]).rect
    expect(defined(arrow[2]) - defined(arrow[0])).toBeLessThan(30)
    expect(defined(arrow[3]) - defined(arrow[1])).toBeGreaterThan(290)
    await task.destroy()
  })
})

describe('page units and user space', () => {
  it('agrees with the parser about where a point is', async () => {
    const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs')
    const task = getDocument({ data: new Uint8Array(await sourceBytes()), useWorkerFetch: false })
    const document_ = await task.promise
    for (const page of [1, 2]) {
      const proxy = await document_.getPage(page)
      const viewport = proxy.getViewport({ scale: 1 })
      const transform = viewport.transform as number[]
      for (const point of [[0, 0], [100, 200], [612, 792]] as const) {
        const mine = toUserSpace(transform, point)
        const theirs = viewport.convertToPdfPoint(point[0], point[1]) as number[]
        expect(mine[0]).toBeCloseTo(defined(theirs[0]), 6)
        expect(mine[1]).toBeCloseTo(defined(theirs[1]), 6)
      }
      // One page unit is one user-space unit on a page with no `/UserUnit`.
      expect(unitScale(transform)).toBeCloseTo(1, 6)
    }
    await task.destroy()
  })

  it('inverts a translated, scaled and rotated transform', () => {
    // A page whose media box does not start at the origin, at two units per point.
    expect(toUserSpace([2, 0, 0, -2, -40, 1600], [0, 0])).toEqual([20, 800])
    expect(unitScale([2, 0, 0, -2, -40, 1600])).toBe(2)
    // A quarter turn: display x runs along user y, and display y along user x.
    expect(toUserSpace([0, 1, 1, 0, 0, 0], [100, 200])).toEqual([200, 100])
  })
})
