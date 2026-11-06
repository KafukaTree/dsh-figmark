import { describe, expect, it } from 'vitest'
import { annotationSubject } from '../src/client/annotation-subject'

describe('the identity shared by staged and delivered reviews', () => {
  it.each(['pdf', 'svg', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'ico'])('identifies %s without guessing from its marks', suffix => {
    expect(annotationSubject({ file: `/w/paper.${suffix.toUpperCase()}`, html: false }))
      .toEqual({ name: `paper.${suffix.toUpperCase()}`, badge: suffix.toUpperCase(), live: false })
  })

  it('keeps literal file-name characters and Windows paths', () => {
    expect(annotationSubject({ file: 'C:\\figs\\draft#2?.svg', html: false }))
      .toEqual({ name: 'draft#2?.svg', badge: 'SVG', live: false })
    expect(annotationSubject({ file: 'a-file', html: false }).badge).toBe('FIG')
    expect(annotationSubject({ file: '/w/old.html', html: true }).badge).toBe('HTML')
  })

  it.each([
    ['http://localhost:5173/?tab=1#x', 'localhost:5173'],
    ['http://127.0.0.1:8000/deck/?a=2', '127.0.0.1:8000/deck/'],
    ['http://[::1]:3000/index.html', '[::1]:3000/index.html'],
  ])('keeps the server identity for %s', (file, name) => {
    expect(annotationSubject({ file, html: true })).toEqual({ name, badge: 'WEB', live: true })
  })
})
