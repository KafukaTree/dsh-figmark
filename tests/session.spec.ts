/** Delivering an annotation into a session: the attached document, the page images, and the failures. */
import { describe, expect, it } from 'vitest'
import type { AnnotationDocument } from '../src/shared/annotation'
import { ANNOTATION_VERSION } from '../src/shared/annotation'
import {
  MAX_PAGE_IMAGES,
  deliverAnnotation,
  type SessionsLike,
} from '../src/client/session'
import { buildAnnotationMessage } from '../src/client/annotation-message'

const document_: AnnotationDocument = {
  version: ANNOTATION_VERSION,
  figure: {
    address: 'dsh-resource://file/session/s1/fig1.svg',
    path: '/w/fig1.svg',
    mediaType: 'image/svg+xml',
    width: 10,
    height: 10,
    sha256: 'b'.repeat(64),
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  marks: [{ id: 'm1', kind: 'arrow', color: '#e03131', points: [[1, 1], [2, 2]], detail: '指错了' }],
  summary: '标号要往左',
}

const pagedDocument: AnnotationDocument = {
  ...document_,
  figure: { address: 'dsh-resource://file/session/s1/report.pdf', path: '/w/report.pdf', mediaType: 'application/pdf', sha256: 'c'.repeat(64), pageCount: 12 },
  marks: [
    { id: 'p1', kind: 'arrow', color: '#e03131', points: [[1, 1], [2, 2]], detail: '第一页', page: 1 },
    { id: 'p2', kind: 'rect', color: '#1971c2', points: [[3, 3], [4, 4]], page: 3 },
    { id: 'p3', kind: 'pen', color: '#2f9e44', points: [[5, 5], [6, 6]], page: 3 },
  ],
}

const paths = { annotationPath: '/w/fig1.annot.json', reviewPath: '/w/fig1.annotated.png' }
const pagedPaths = { annotationPath: '/w/report.pdf.annot.json', reviewPath: '/w/report.pdf.annotated.pdf' }

/** A rendered HTML document: one surface, measured in the pixels it was laid out in. */
const htmlDocument: AnnotationDocument = {
  ...document_,
  figure: {
    address: 'dsh-resource://file/session/s1/report.html',
    path: '/w/report.html',
    mediaType: 'text/html',
    width: 1024,
    height: 1843,
    sha256: 'd'.repeat(64),
  },
  marks: [{
    id: 'h1',
    kind: 'rect',
    color: '#e03131',
    points: [[10, 20], [60, 90]],
    detail: '这段要改',
    anchor: { tag: 'p', bbox: [0, 0, 1024, 200], text: '第一段', selector: '#s > p:nth-of-type(1)' },
  }],
}

/** The marks file a rendered document writes: never a second artifact. */
const htmlPaths = { annotationPath: '/w/report.html.annot.json', reviewPath: null }

/** One content part handed to the session. */
interface Part {
  readonly type: string
  readonly text?: string
  readonly mediaType?: string
  readonly data?: string
  readonly name?: string
}

/** One PNG blob of a size a spec chooses. */
function blobOf(bytes = 3): Blob {
  return new Blob([new Uint8Array(bytes).fill(1)], { type: 'image/png' })
}

/** A sessions service stub with one live session. */
function stubSessions(): {
  readonly sessions: SessionsLike
  /** The same service seen from a session with no live binding. */
  readonly detached: SessionsLike
  readonly prompts: Part[][]
  readonly modes: string[]
  readonly sources: string[]
} {
  const prompts: Part[][] = []
  const modes: string[] = []
  const sources: string[] = []
  const face = {
    prompt: async (content: readonly unknown[], mode: string) => {
      prompts.push(content as Part[])
      modes.push(mode)
      return { ok: true }
    },
  }
  const using = async (
    _id: string,
    options: { readonly source: string },
    operation: (reference: unknown) => unknown,
  ): Promise<unknown> => {
    sources.push(options.source)
    return await Promise.resolve(operation({ ready: Promise.resolve({ session: face }) }))
  }
  return {
    prompts,
    modes,
    sources,
    sessions: { scope: () => ({ live: true }), sessionOf: () => face, using } as unknown as SessionsLike,
    detached: { scope: () => undefined, sessionOf: () => undefined, using } as unknown as SessionsLike,
  }
}

/** Everything one delivery needs, with only the interesting parts spelled out. */
function delivery(overrides: Partial<Parameters<typeof deliverAnnotation>[0]> = {}): Parameters<typeof deliverAnnotation>[0] {
  return {
    sessions: stubSessions().sessions,
    sessionId: 's1',
    document: document_,
    paths,
    pageImages: [{ page: 1, image: blobOf() }],
    thumb: undefined,
    locale: 'zh',
    ...overrides,
  }
}

describe('delivering an annotation', () => {
  it('queues one image part and one text part on the live session', async () => {
    const stub = stubSessions()
    await deliverAnnotation(delivery({ sessions: stub.sessions }))
    expect(stub.modes).toEqual(['queue'])
    expect(stub.prompts).toHaveLength(1)
    const parts = stub.prompts[0] ?? []
    expect(parts[0]).toMatchObject({ type: 'image', mediaType: 'image/png', data: 'AQEB', name: 'fig1.svg.annotated.png' })
    expect(parts[1]?.type).toBe('text')
    expect(parts[1]?.text).toContain('【附图标注】/w/fig1.svg')
    // The sidecars are deleted after delivery, so the message names the picture it
    // carries and the figure it concerns — never a path that is about to vanish.
    expect(parts[1]?.text).toContain('标注图已作为本条消息的附件发送')
    expect(parts[1]?.text).not.toContain('.annot.json')
    expect(parts[1]?.text).not.toContain('.annotated.png')
  })

  it('sends text alone when the browser could not render a page', async () => {
    const stub = stubSessions()
    await deliverAnnotation(delivery({ sessions: stub.sessions, pageImages: [], locale: 'en' }))
    const parts = stub.prompts[0] ?? []
    expect(parts).toHaveLength(1)
    expect(parts[0]?.type).toBe('text')
    expect(parts[0]?.text).toContain('[figure annotations]')
  })

  it('marks a live screenshot as attached when the page supplied one', async () => {
    const stub = stubSessions()
    const warnings = await deliverAnnotation({
      ...delivery(),
      sessions: stub.sessions,
      document: htmlDocument,
      paths: htmlPaths,
      pageCapture: 'attached',
    })
    expect(warnings).toEqual([])
    expect(stub.prompts[0]?.[0]?.type).toBe('image')
    expect(stub.prompts[0]?.[1]?.text).toContain('当前页面截图已随消息发送')
  })

  it('treats an HTML image as an attached live screenshot by default', async () => {
    const stub = stubSessions()
    const warnings = await deliverAnnotation({
      ...delivery(),
      sessions: stub.sessions,
      document: htmlDocument,
      paths: htmlPaths,
    })
    expect(warnings).toEqual([])
    expect(stub.prompts[0]?.[1]?.text).toContain('当前页面截图已随消息发送')
  })

  it('does not claim an HTML screenshot when no image was supplied', async () => {
    const stub = stubSessions()
    const warnings = await deliverAnnotation({
      ...delivery(),
      sessions: stub.sessions,
      document: htmlDocument,
      paths: htmlPaths,
      pageImages: [],
    })
    expect(warnings).toEqual([])
    expect(stub.prompts[0]).toHaveLength(1)
    expect(stub.prompts[0]?.[0]?.text).not.toContain('当前页面截图')
  })

  it('keeps the selectors when a live screenshot could not be made', async () => {
    const zh = stubSessions()
    const zhWarnings = await deliverAnnotation({
      ...delivery(),
      sessions: zh.sessions,
      document: htmlDocument,
      paths: htmlPaths,
      pageImages: [],
      pageCapture: 'failed',
    })
    expect(zhWarnings).toEqual(['当前页面截图未生成；元素选择器和位置信息仍已随消息发送。'])
    expect(zh.prompts[0]).toHaveLength(1)
    expect(zh.prompts[0]?.[0]?.text).toContain('当前页面截图未能生成')
    expect(zh.prompts[0]?.[0]?.text).toContain('#s > p:nth-of-type(1)')

    const en = stubSessions()
    const enWarnings = await deliverAnnotation({
      ...delivery(),
      sessions: en.sessions,
      document: htmlDocument,
      paths: htmlPaths,
      pageImages: [],
      pageCapture: 'failed',
      locale: 'en',
    })
    expect(enWarnings).toEqual([
      'The current page could not be captured; its element selectors and positions still travelled with the message.',
    ])
    expect(en.prompts[0]?.[0]?.text).toContain('use the element selectors and positions below')
  })

  it('encodes an image larger than one base64 chunk', async () => {
    const stub = stubSessions()
    await deliverAnnotation(delivery({ sessions: stub.sessions, pageImages: [{ page: 1, image: blobOf(0x8000 + 3) }] }))
    expect((stub.prompts[0]?.[0]?.data ?? '').length).toBeGreaterThan(0x8000)
  })

  it('opens the session through the service when no live binding exists', async () => {
    const stub = stubSessions()
    await deliverAnnotation(delivery({ sessions: stub.detached, pageImages: [] }))
    expect(stub.sources).toEqual(['dsh-figmark'])
    expect(stub.prompts).toHaveLength(1)
  })

  it('says there is no picture at all when the review artifact was not written', async () => {
    const stub = stubSessions()
    await deliverAnnotation(delivery({
      sessions: stub.sessions,
      paths: { annotationPath: '/w/fig1.annot.json', reviewPath: null },
      pageImages: [],
    }))
    const text = stub.prompts[0]?.[0]?.text ?? ''
    expect(text).not.toContain('标注图已作为本条消息的附件发送')
  })

  it('reports the reason the session refused the message', async () => {
    const sessions = {
      scope: () => ({ live: true }),
      sessionOf: () => ({ prompt: async () => ({ ok: false, error: { message: 'session is closed' } }) }),
      using: async () => { throw new Error('unused') },
    } as unknown as SessionsLike
    await expect(deliverAnnotation(delivery({ sessions }))).rejects.toThrow('session is closed')
  })

  it('falls back to a plain message when the refusal carries no reason', async () => {
    const sessions = {
      scope: () => ({ live: true }),
      sessionOf: () => ({ prompt: async () => ({ ok: false }) }),
      using: async () => { throw new Error('unused') },
    } as unknown as SessionsLike
    await expect(deliverAnnotation(delivery({ sessions }))).rejects.toThrow('the session refused the annotation message')
  })
})
describe('a document that has pages', () => {
  it('sends one image per annotated page and leaves the whole PDF local', async () => {
    const stub = stubSessions()
    const warnings = await deliverAnnotation({
      ...delivery(),
      sessions: stub.sessions,
      document: pagedDocument,
      paths: pagedPaths,
      pageImages: [{ page: 1, image: blobOf() }, { page: 3, image: blobOf() }],
    })
    expect(warnings).toEqual([])
    const parts = stub.prompts[0] ?? []
    expect(parts.map(part => part.type)).toEqual(['image', 'image', 'text'])
    expect(parts[0]).toMatchObject({ type: 'image', name: 'report.pdf.p1.annotated.png' })
    expect(parts[1]).toMatchObject({ type: 'image', name: 'report.pdf.p3.annotated.png' })
    expect(parts[2]?.text).toContain('对应标注页已作为图片随消息发送；原 PDF 未上传')
    expect(parts[2]?.text).not.toContain('.annotated.pdf')
  })

  it('caps the page images and says how many were left out', async () => {
    const stub = stubSessions()
    const pages = Array.from({ length: MAX_PAGE_IMAGES + 2 }, (_value, index) => ({ page: index + 1, image: blobOf() }))
    const warnings = await deliverAnnotation({ ...delivery(), sessions: stub.sessions, document: pagedDocument, paths: pagedPaths, pageImages: pages })
    expect(stub.prompts[0]?.filter(part => part.type === 'image')).toHaveLength(MAX_PAGE_IMAGES)
    expect(warnings).toEqual(['另有 2 页标注未附图；原 PDF 不上传，请按上方路径和位置说明处理这些页。'])
  })

  it('sends text alone when no page could be rendered', async () => {
    const stub = stubSessions()
    const warnings = await deliverAnnotation({
      ...delivery(),
      sessions: stub.sessions,
      document: pagedDocument,
      paths: pagedPaths,
      pageImages: [],
    })
    expect(stub.prompts[0]?.map(part => part.type)).toEqual(['text'])
    expect(warnings).toEqual([])
    expect(stub.prompts[0]?.[0]?.text).not.toContain('原 PDF 未上传')
  })

  it('says the same warning in English when the panel runs in English', async () => {
    const capped = await deliverAnnotation({
      ...delivery(),
      locale: 'en',
      document: pagedDocument,
      paths: pagedPaths,
      pageImages: Array.from({ length: MAX_PAGE_IMAGES + 1 }, (_value, index) => ({ page: index + 1, image: blobOf() })),
    })
    expect(capped[0]).toContain('1 more annotated pages')
    expect(capped[0]).toContain('the PDF itself is not uploaded')
  })
})
describe('a message that carries no picture', () => {
  /** An annotation whose marks are all points: one coordinate and one sentence each. */
  const pointsOnly: AnnotationDocument = {
    ...document_,
    marks: [
      { id: 'p1', kind: 'point', color: '#e03131', points: [[10, 20]], detail: '图号应在这里' },
      { id: 'p2', kind: 'point', color: '#1971c2', points: [[30, 40]], detail: '这条曲线缺图例' },
    ],
  }

  it('says the marks are points only, and names the figure as the index', () => {
    const zh = buildAnnotationMessage(pointsOnly, { annotationPath: '/w/fig1.annot.json', reviewPath: null }, 'zh')
    expect(zh).toContain('本条标注只有位置点，没有标注图')
    // The figure's own path is the index that replaces the picture.
    expect(zh).toContain('【附图标注】/w/fig1.svg')
    // This fixture's figure is 10x10, so both points sit outside it and say so.
    expect(zh).toContain('单点1 位于 (10,20)（超出图面：下 10 像素），批注：图号应在这里')
    expect(zh).toContain('单点2 位于 (30,40)（超出图面：右 20、下 30 像素），批注：这条曲线缺图例')
    expect(zh).not.toContain('附件')
  })

  it('says it in English too', () => {
    const en = buildAnnotationMessage(pointsOnly, { annotationPath: '/w/a.json', reviewPath: null }, 'en')
    expect(en).toContain('These marks are points only, so no annotated image was made')
    expect(en).not.toContain('attached to this message')
  })

  it('asks for a picture again the moment one mark claims an extent', () => {
    const mixed: AnnotationDocument = {
      ...pointsOnly,
      marks: [...pointsOnly.marks, { id: 'a1', kind: 'arrow', color: '#2f9e44', points: [[1, 1], [2, 2]] }],
    }
    const zh = buildAnnotationMessage(mixed, { annotationPath: '/w/fig1.annot.json', reviewPath: '/w/fig1.annotated.png' }, 'zh')
    expect(zh).toContain('标注图已作为本条消息的附件发送')
    expect(zh).not.toContain('只有位置点')
  })

  it('does not claim a picture the host declined to write', () => {
    // The save wrote no artifact, so nothing was attached; the message must not
    // promise an attachment that is not there.
    const zh = buildAnnotationMessage(document_, { annotationPath: '/w/fig1.annot.json', reviewPath: null }, 'zh')
    expect(zh).not.toContain('附件')
  })
})

describe('the message the agent reads', () => {
  it('names the pages a document has, and where its annotated copy is', () => {
    const zh = buildAnnotationMessage(pagedDocument, pagedPaths, 'zh', false, 2)
    expect(zh).toContain('（共 12 页，其中 2 页有标注，标注 3 处')
    expect(zh).toContain('第 1 页 箭头1 (1,1) → (2,2)，批注：第一页')
    expect(zh).toContain('第 3 页 矩形1 (3,3)-(4,4)')
    expect(zh).toContain('目标：标号要往左')
    expect(zh).toContain('对应标注页已作为图片随消息发送；原 PDF 未上传')
    const en = buildAnnotationMessage(pagedDocument, pagedPaths, 'en', false, 2)
    expect(en).toContain('(12 pages, 2 pages marked, 3 marks')
    expect(en).toContain('page 3 box')
    expect(en).toContain('The marked pages travel as images with this message')
    expect(en).not.toContain('annotated PDF is attached')
  })

  it('measures a single-surface figure instead of counting pages', () => {
    const zh = buildAnnotationMessage(document_, paths, 'zh')
    expect(zh).toContain('（图面 10×10，标注 1 处')
    expect(zh).toContain('箭头1 (1,1) → (2,2)，批注：指错了')
    expect(zh).not.toContain('带批注 PDF')
    expect(buildAnnotationMessage(document_, paths, 'en')).toContain('(figure 10x10, 1 marks')
  })

  it('leaves the overall note out when the user wrote none', () => {
    const withoutSummary: AnnotationDocument = { ...document_ }
    delete (withoutSummary as { summary?: string }).summary
    expect(buildAnnotationMessage(withoutSummary, paths, 'zh')).not.toContain('目标：')
  })

  it('names a rendered document as one, with the locators that are its whole payload', () => {
    const zh = buildAnnotationMessage(htmlDocument, htmlPaths, 'zh')
    expect(zh).toContain('【HTML 标注】/w/report.html（渲染面 1024×1843，标注 1 处）')
    expect(zh).not.toContain('.annot.json')
    // Nothing was flattened: there is no annotated image to point at.
    expect(zh).not.toContain('标注图：')
    expect(zh).toContain('矩形1 (10,20)-(60,90)（元素文字「第一段」，选择器 #s > p:nth-of-type(1)），批注：这段要改')
    // The closing tells the agent where the marks really live and what to change.
    expect(zh).toContain('HTML 生成源')
    // How to locate an element inside that source is a standing rule in the prompt
    // section, not something each message repeats.
    expect(zh).not.toContain('anchor.selector')
    const en = buildAnnotationMessage(htmlDocument, htmlPaths, 'en')
    expect(en).toContain('[HTML annotations] /w/report.html (rendered surface 1024x1843, 1 marks')
    expect(en).not.toContain('.annot.json')
    expect(en).toContain('selector #s > p:nth-of-type(1)')
    expect(en).toContain('Edit the HTML source, mark by mark.')
  })

  it('says a live screenshot did not travel in either language', () => {
    const zh = buildAnnotationMessage(htmlDocument, htmlPaths, 'zh', false, 0, 'failed')
    expect(zh).toContain('当前页面截图未能生成；请按下方逐条的元素选择器与位置处理。')
    expect(zh).not.toContain('当前页面截图已随消息发送')

    const en = buildAnnotationMessage(htmlDocument, htmlPaths, 'en', false, 0, 'failed')
    expect(en).toContain('The current page could not be captured; use the element selectors and positions below.')
    expect(en).not.toContain('A screenshot of the current page travels with this message')
  })

  it('says a live screenshot did travel in English', () => {
    const en = buildAnnotationMessage(htmlDocument, htmlPaths, 'en', false, 1, 'attached')
    expect(en).toContain('A screenshot of the current page travels with this message')
    expect(en).toContain('selector #s > p:nth-of-type(1)')
  })
})
