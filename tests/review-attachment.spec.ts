// @vitest-environment jsdom
/** The review as a draft attachment: the name, the type, and the bytes it carries. */
import { describe, expect, it } from 'vitest'
import { annotatedPdfFile, reviewImageFile } from '../src/client/review-attachment'

/**
 * The bytes a staged file carries.
 * @param file - the attachment the rail would hold.
 * @returns its bytes, as jsdom's own File API can read them.
 */
async function bytesOf(file: File): Promise<number[]> {
  return await new Promise<number[]>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => { resolve([...new Uint8Array(reader.result as ArrayBuffer)]) }
    reader.onerror = () => { reject(reader.error ?? new Error('the file could not be read')) }
    reader.readAsArrayBuffer(file)
  })
}

describe('staging the review picture', () => {
  it('names the picture after the figure, the way the direct send does', async () => {
    const review = new Blob(['png bytes'], { type: 'image/png' })
    const file = reviewImageFile(review, '/w/fig.svg')
    expect(file).toBeDefined()
    expect(file?.name).toBe('fig.svg.annotated.png')
    expect(file?.type).toBe('image/png')
    // Same bytes, not a re-encode: the rail must hold exactly what the review looked
    // like, or the reader gets a different picture from the one they approved.
    expect(await bytesOf(file as File)).toEqual([...new TextEncoder().encode('png bytes')])
  })

  it('takes the last segment of a nested path for the name', () => {
    expect(reviewImageFile(new Blob(['x']), 'C:\\reports\\第 3 张.png')?.name).toBe('第 3 张.png.annotated.png')
  })

  it('leaves a URL query and hash out of the name the composer shows', () => {
    expect(reviewImageFile(
      new Blob(['x']),
      'http://127.0.0.1:8811/deck/index.html?chrome=1#slide-2',
    )?.name).toBe('index.html.annotated.png')
  })

  it('has nothing to stage when the surface exported no picture', () => {
    expect(reviewImageFile(undefined, '/w/fig.svg')).toBeUndefined()
  })
})

describe('staging the annotated PDF', () => {
  it('names the PDF after the document and types it as a PDF', async () => {
    const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46])
    const file = annotatedPdfFile(bytes, '/w/report.pdf')
    expect(file?.name).toBe('report.pdf.annotated.pdf')
    expect(file?.type).toBe('application/pdf')
    expect(await bytesOf(file as File)).toEqual([0x25, 0x50, 0x44, 0x46])
  })

  it('has nothing to stage when the surface wrote no PDF', () => {
    expect(annotatedPdfFile(undefined, '/w/report.pdf')).toBeUndefined()
  })
})
