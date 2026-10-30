// @vitest-environment jsdom
/** Reading a delivered annotation message back into a block: what it finds, and where it stops. */
import { describe, expect, it } from 'vitest'
import type { AnnotationDocument } from '../src/shared/annotation'
import { ANNOTATION_VERSION } from '../src/shared/annotation'
import { buildAnnotationMessage } from '../src/client/annotation-message'
import { RULE_ID, annotationRule, matchAnnotation } from '../src/client/annotation-rule'
import type { SidecarWriteResult } from '../src/shared/http'

/** A document with one drawn arrow, one silent box and a stated goal. */
const FIGURE: AnnotationDocument = {
  version: ANNOTATION_VERSION,
  figure: {
    address: 'dsh-resource://file/session/s1/fig.svg',
    path: '/w/fig.svg',
    mediaType: 'image/svg+xml',
    width: 1440,
    height: 800,
    sha256: 'a'.repeat(64),
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  marks: [
    { id: 'm1', kind: 'arrow', color: '#e03131', points: [[10, 20], [30, 40]], detail: '往右上拉一点' },
    { id: 'm2', kind: 'rect', color: '#1971c2', points: [[1, 2], [3, 4]], detail: '' },
  ],
  summary: '把右上角的线拉直',
}

/** The sidecar paths a save returns when it wrote no review picture. */
const NO_PATHS: SidecarWriteResult = { annotationPath: '/w/fig-annotation.json', reviewPath: null }

/** One mark line, for the messages built by hand below. */
const LINE = '箭头1 (10,20) → (30,40)，批注：往右上拉一点'

/** The same mark, as an English message writes it. */
const EN_LINE = 'arrow 1 (10,20) → (30,40), note: 往右上拉一点'

/** A whole one-mark message, for the cases where the wording itself is under test. */
function message(body: string, header = '【附图标注】/w/fig.svg（图面 1440×800，标注 1 处）'): string {
  return `${header}\n\n${body}\n\n逐条改生成源。`
}

describe('the annotation rule', () => {
  it('is registered under its own id, after the shipped rules', () => {
    expect(annotationRule.id).toBe(RULE_ID)
    expect(annotationRule.order).toBe(50)
    expect(annotationRule.match).toBe(matchAnnotation)
  })

  it('finds a message the plugin composed itself, from its first character to its last', () => {
    const text = buildAnnotationMessage(FIGURE, NO_PATHS, 'zh', false)
    const block = matchAnnotation(text, 0)
    expect(block).toBeDefined()
    expect(block?.id).toBe(RULE_ID)
    expect(block?.start).toBe(0)
    expect(block?.end).toBe(text.length)
    expect(block?.data.file).toBe('/w/fig.svg')
    expect(block?.data.scope).toBe('图面 1440×800，标注 2 处')
    expect(block?.data.target).toBe('把右上角的线拉直')
    expect(block?.data.instruction).toBe('逐条改生成源。')
    expect(block?.data.html).toBe(false)
    expect(block?.data.marks).toEqual([
      { page: undefined, label: '箭头1 (10,20) → (30,40)', comment: '往右上拉一点', missing: false },
      { page: undefined, label: '矩形1 (1,2)-(3,4)', comment: '', missing: true },
    ])
  })

  it('names the figure and its scope exactly as the header does', () => {
    const text = message(LINE)
    expect(matchAnnotation(text, 0)?.data).toMatchObject({
      file: '/w/fig.svg',
      scope: '图面 1440×800，标注 1 处',
    })
  })

  it('reads an English message in its own spelling', () => {
    const text = buildAnnotationMessage(FIGURE, NO_PATHS, 'en', false)
    const block = matchAnnotation(text, 0)
    expect(block?.data.file).toBe('/w/fig.svg')
    expect(block?.data.scope).toBe('figure 1440x800, 2 marks')
    expect(block?.data.target).toBe('把右上角的线拉直')
    expect(block?.data.instruction).toBe('Edit the generating source, mark by mark.')
    expect(block?.data.marks[0]?.comment).toBe('往右上拉一点')
    expect(block?.data.marks[1]).toEqual({ page: undefined, label: 'box 1 (1,2)-(3,4)', comment: '', missing: true })
    expect(block?.end).toBe(text.length)
  })

  it('reads a rendered document as one, and its own closing sentence', () => {
    const rendered: AnnotationDocument = {
      ...FIGURE,
      figure: { ...FIGURE.figure, mediaType: 'text/html', path: '/w/page.html' },
      marks: [{ id: 'e1', kind: 'element', color: '#1971c2', points: [[1, 1], [9, 9]], detail: '标题太大', anchor: { tag: 'h1', title: '标题', bbox: [1, 1, 8, 8] } }],
    }
    const text = buildAnnotationMessage(rendered, NO_PATHS, 'zh', false)
    const block = matchAnnotation(text, 0)
    expect(block?.data.html).toBe(true)
    expect(block?.data.scope).toBe('渲染面 1440×800，标注 1 处')
    expect(block?.data.instruction).toBe('逐条改 HTML 生成源。')
    expect(block?.data.marks[0]?.label).toContain('元素1')
    const english = buildAnnotationMessage(rendered, NO_PATHS, 'en', false)
    const enBlock = matchAnnotation(english, 0)
    expect(enBlock?.data.html).toBe(true)
    expect(enBlock?.data.instruction).toBe('Edit the HTML source, mark by mark.')
    expect(enBlock?.data.marks[0]?.missing).toBe(false)
  })

  it('keeps the page a mark belongs to, and drops it out of the label', () => {
    const paged: AnnotationDocument = {
      ...FIGURE,
      figure: { ...FIGURE.figure, mediaType: 'application/pdf', path: '/w/doc.pdf', pageCount: 3 },
      marks: [
        { id: 'p1', kind: 'rect', color: '#1971c2', points: [[1, 2], [3, 4]], detail: '这里', page: 2 },
        { id: 'p2', kind: 'point', color: '#1971c2', points: [[5, 6]], detail: '', page: 3 },
      ],
    }
    const zh = buildAnnotationMessage(paged, NO_PATHS, 'zh', false)
    const block = matchAnnotation(zh, 0)
    expect(block?.data.instruction).toBe('逐条处理该 PDF。')
    expect(block?.data.marks[0]).toMatchObject({ page: 2, comment: '这里' })
    expect(block?.data.marks[0]?.label.startsWith('矩形1')).toBe(true)
    expect(block?.data.marks[1]).toEqual({ page: 3, label: '单点1 位于 (5,6)', comment: '', missing: true })
    const en = matchAnnotation(buildAnnotationMessage(paged, NO_PATHS, 'en', false), 0)
    expect(en?.data.marks[0]?.page).toBe(2)
    expect(en?.data.instruction).toBe('Work through the PDF, mark by mark.')
  })

  it('reports a block that sits under the reader\'s own words, and stops where they resume', () => {
    const inner = message(LINE)
    const text = `帮我看一下这张图，有两处要改。\n\n${inner}\n\n改完告诉我。`
    const block = matchAnnotation(text, 0)
    expect(block?.start).toBe(text.indexOf('【附图标注】'))
    expect(block?.end).toBe(block === undefined ? -1 : text.indexOf('逐条改生成源。') + '逐条改生成源。'.length)
    expect(text.slice(block?.start ?? 0, block?.end ?? 0)).toBe(inner)
    expect(block?.data.marks).toHaveLength(1)
  })

  it('reads a note that quotes the separator without splitting it wrong', () => {
    const text = message('矩形1 (1,2)-(3,4)，批注：把「，批注：」这行删掉')
    expect(matchAnnotation(text, 0)?.data.marks[0]?.comment).toBe('把「，批注：」这行删掉')
  })

  it('steps over the message\'s own lines about its attachment before the list', () => {
    const text = message('标注图已作为本条消息的附件发送。\n\n' + LINE)
    const block = matchAnnotation(text, 0)
    expect(block?.data.marks).toHaveLength(1)
    expect(block?.data.target).toBe('')
  })

  it('finds the second block after the first, and nothing after the last', () => {
    const first = buildAnnotationMessage(FIGURE, NO_PATHS, 'zh', false)
    const second = message(LINE)
    const text = `${first}\n\n${second}`
    const one = matchAnnotation(text, 0)
    expect(one?.end).toBe(first.length)
    const two = matchAnnotation(text, one?.end ?? 0)
    expect(two?.start).toBe(first.length + 2)
    expect(two?.end).toBe(text.length)
    expect(matchAnnotation(text, two?.end ?? 0)).toBeUndefined()
  })

  it('skips a header it cannot read and keeps looking past it', () => {
    const text = `【附图标注】\n\n${message(LINE)}`
    const block = matchAnnotation(text, 0)
    expect(block?.data.marks).toHaveLength(1)
    expect(block?.start).toBe(text.indexOf('【附图标注】', 1))
  })

  it('reports nothing for a header whose list is empty', () => {
    expect(matchAnnotation('【附图标注】/w/fig.svg（图面 1440×800，标注 0 处）\n\n逐条改生成源。', 0)).toBeUndefined()
  })

  it('reports nothing for a header with no scope, a path only, or no newline', () => {
    expect(matchAnnotation('【附图标注】/w/fig.svg', 0)).toBeUndefined()
    expect(matchAnnotation('【附图标注】/w/fig.svg（图面 1440×800）', 0)).toBeUndefined()
    expect(matchAnnotation('【附图标注】（图面 1440×800）', 0)).toBeUndefined()
    expect(matchAnnotation('【附图标注】/w/fig.svg（图面 1440×800', 0)).toBeUndefined()
  })

  it('reports nothing for text that is not an annotation at all', () => {
    expect(matchAnnotation('', 0)).toBeUndefined()
    expect(matchAnnotation('just a question about the figure', 0)).toBeUndefined()
    expect(matchAnnotation('【附图标注】', 0)).toBeUndefined()
  })

  it('gives up on a text too long to read frame by frame', () => {
    const text = `【附图标注】${'x'.repeat(200_000)}`
    expect(text.length).toBeGreaterThan(200_000)
    expect(matchAnnotation(text, 0)).toBeUndefined()
  })

  it('gives up after trying every header the text can hold', () => {
    const text = Array.from({ length: 70 }, () => '【附图标注】').join('\n')
    expect(matchAnnotation(text, 0)).toBeUndefined()
  })

  it('reads a block written with bare newlines and stops at the last line', () => {
    const text = `【附图标注】/w/fig.svg（图面 1440×800，标注 1 处）\n${LINE}`
    const block = matchAnnotation(text, 0)
    expect(block?.data.instruction).toBe('')
    expect(block?.end).toBe(text.length)
  })

  it('ends the block before a line that is neither a mark nor a closer', () => {
    const text = message(`${LINE}\n顺便把背景也换掉`)
    const block = matchAnnotation(text, 0)
    expect(block?.data.marks).toHaveLength(1)
    expect(block?.data.instruction).toBe('')
    expect(block?.end).toBe(text.indexOf(LINE) + LINE.length)
  })

  it('ends the block before a line that opens like a mark but names none', () => {
    const text = message(`${LINE}\n箭头 (10,20)，批注：没有编号`)
    expect(matchAnnotation(text, 0)?.data.marks).toHaveLength(1)
    expect(matchAnnotation(`【附图标注】/w/fig.svg（图面 1440×800，标注 1 处）\n\n箭头 (1,1)，批注：x\n\n逐条改生成源。`, 0)).toBeUndefined()
    expect(matchAnnotation(`【附图标注】/w/fig.svg（图面 1440×800，标注 1 处）\n\n标题1 (1,1)，批注：x\n\n逐条改生成源。`, 0)).toBeUndefined()
  })

  it('ends the block before a line that carries no note at all', () => {
    const text = message(`${LINE}\n矩形2 (1,2)-(3,4)`)
    expect(matchAnnotation(text, 0)?.data.marks).toHaveLength(1)
  })

  it('keeps the carriage return of a CRLF message out of the block', () => {
    const closer = '逐条改生成源。'
    const text = `${message(LINE).replaceAll('\n', '\r\n')}\r\n\r\n改完告诉我。`
    const block = matchAnnotation(text, 0)
    expect(block?.end).toBe(text.indexOf(closer) + closer.length)
    expect(text.slice(block?.end ?? 0)).toBe('\r\n\r\n改完告诉我。')
  })

  it('reads no more marks than a block is allowed to hold', () => {
    const lines = Array.from({ length: 401 }, (_, index) => `矩形${index + 1} (1,2)-(3,4)，批注：${index}`)
    const text = `【附图标注】/w/fig.svg（图面 1440×800，标注 401 处）\n\n${lines.join('\n')}`
    const block = matchAnnotation(text, 0)
    expect(block?.data.marks).toHaveLength(400)
    expect(block?.end).toBe(text.indexOf(lines[399] ?? '') + (lines[399] ?? '').length)
  })

  it('picks the header that comes first when a text holds both spellings', () => {
    const zh = message(LINE)
    const en = buildAnnotationMessage(FIGURE, NO_PATHS, 'en', false)
    const english = matchAnnotation(`${en}\n\n${zh}`, 0)
    expect(english?.data.html).toBe(false)
    expect(english?.start).toBe(0)
    expect(english?.end).toBe(en.length)
    const html = message(EN_LINE, '[HTML annotations] /w/page.html (rendered surface 1024x768, 1 marks)')
    expect(matchAnnotation(html, 0)?.data.html).toBe(true)
    const figure = message(EN_LINE, '[figure annotations] /w/fig.svg (figure 1440x800, 1 marks)')
    expect(matchAnnotation(figure, 0)?.data.file).toBe('/w/fig.svg')
  })

  it('reads a goal line in either language and keeps it out of the mark list', () => {
    const zh = message(`目标：改标题\n${LINE}`)
    expect(matchAnnotation(zh, 0)?.data.target).toBe('改标题')
    const en = message(`goal: fix the title\n${EN_LINE}`, '[figure annotations] /w/fig.svg (figure 1440x800, 1 marks)')
    expect(matchAnnotation(en, 0)?.data.target).toBe('fix the title')
  })
})
