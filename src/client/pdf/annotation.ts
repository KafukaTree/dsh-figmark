/**
 * The annotation dictionary itself: what a mark is filed as in the document.
 *
 * A mark is a shape *and* a sentence, and the PDF has two separate places for them.
 * The shape becomes the annotation's subtype, its rectangle and its appearance; the
 * sentence becomes `/Contents`, the comment a reader opens. Keeping the dictionary
 * assembly in one module is what makes "every kind is written the same way, and the
 * subtype can never disagree with the appearance" a property of the code rather than
 * a comment.
 * @module dsh-figmark/client/pdf/annotation
 */
import {
  PDFArray, PDFDict, PDFHexString, PDFName, PDFNumber, PDFString,
  type PDFContext,
} from 'pdf-lib'
import type { AnnotationMark } from '../../shared/annotation'
import { boundsOf, type UserRect } from './coords'
import { POINT_RADIUS, drawnPoints, place, type PlacedMark } from './geometry'
import { appearance, numbers } from './appearance'

/**
 * Whether every character of a string fits the font's own single-byte encoding.
 *
 * The check reads one UTF-16 code unit per element, which is what `for…of` hands
 * back for the characters that matter here: anything outside Latin-1 — a CJK
 * character, or half of an astral pair — is above the boundary either way.
 */
function latinEncodable(text: string): boolean {
  for (const character of text) {
    if (character.charCodeAt(0) > 0xff) return false
  }
  return true
}

/** The note as a PDF string: readable when it is ASCII, hexadecimal otherwise. */
function contentString(text: string): PDFString | PDFHexString {
  return latinEncodable(text) ? PDFString.of(text) : PDFHexString.fromText(text)
}

/** One mark's colour as three decimal channels. */
function colorChannels(color: string): number[] {
  const match = /^#?([0-9a-f]{6})$/iu.exec(color)
  const value = match?.[1] ?? '000000'
  return [0, 2, 4].map(offset => Number.parseInt(value.slice(offset, offset + 2), 16) / 255)
}

/** The annotation subtype one mark kind is written as. */
function annotationSubtype(mark: AnnotationMark): string {
  switch (mark.kind) {
    case 'pen': return 'Ink'
    case 'rect': return 'Square'
    case 'ellipse': return 'Circle'
    case 'arrow': return 'Line'
    // A point is written as a `/Text` note: a reader shows it as a small marker it
    // can open, which is exactly the relationship the mark has to the page — a
    // comment at a position, with no shape claiming an extent.
    case 'point': return 'Text'
    // The same box `strokeContent` draws for it, so the subtype and the appearance
    // cannot disagree about what a stray element mark looks like.
    case 'element': return 'Square'
  }
}

/**
 * The box one mark's annotation covers.
 *
 * A shape is measured from the geometry it strokes, head included — an appearance is
 * clipped to its own box, and a box around a shaft alone would cut an arrow's head
 * off. A point mark has no extent to measure, so its box is padded out from the one
 * coordinate it stands on.
 *
 * @param mark - the mark being written.
 * @param placed - its geometry, in user space.
 * @param unit - the page's size multiple.
 * @returns the rectangle, in user space.
 */
function markBox(mark: AnnotationMark, placed: PlacedMark, unit: number): UserRect {
  return mark.kind === 'point'
    ? boundsOf(placed.points, POINT_RADIUS * unit * 2)
    : boundsOf(drawnPoints(mark, placed), placed.width * 2)
}

/**
 * Build one annotation dictionary for one mark.
 *
 * Every mark carries its sentence as `/Contents`: that is the comment, the thing a
 * reader opens and an agent reads. Nothing is drawn on the page to say it, because
 * the page is the user's own figure and a caption laid over it is one more thing
 * to place, dodge, and move clear of the line work it describes.
 *
 * @param context - the document's object context.
 * @param mark - the mark being written.
 * @param transform - `[a b c d e f]`, user space → page units.
 * @param unit - the page's size multiple.
 * @returns the annotation dictionary.
 * @throws {Error} when the mark carries no coordinate at all.
 */
export function annotation(
  context: PDFContext,
  mark: AnnotationMark,
  transform: readonly number[],
  unit: number,
): PDFDict {
  const placed = place(mark, transform, unit)
  if (mark.points[0] === undefined || placed.points[0] === undefined) {
    throw new Error('an annotation mark needs at least one coordinate pair')
  }
  const box = markBox(mark, placed, unit)
  const dictionary = PDFDict.withContext(context)
  dictionary.set(PDFName.of('Type'), PDFName.of('Annot'))
  dictionary.set(PDFName.of('Subtype'), PDFName.of(annotationSubtype(mark)))
  dictionary.set(PDFName.of('Rect'), numbers(context, [box.x, box.y, box.x + box.width, box.y + box.height]))
  dictionary.set(PDFName.of('F'), PDFNumber.of(4))
  const note = (mark.detail ?? '').trim()
  if (note !== '') dictionary.set(PDFName.of('Contents'), contentString(note))
  dictionary.set(PDFName.of('C'), numbers(context, colorChannels(mark.color)))
  dictionary.set(PDFName.of('BS'), border(context, placed.width))
  if (mark.kind === 'pen') dictionary.set(PDFName.of('InkList'), inkList(context, placed))
  if (mark.kind === 'arrow') applyLineEnds(context, dictionary, placed)
  const stream = appearance(context, mark, placed, box, unit)
  if (stream !== undefined) {
    const streams = PDFDict.withContext(context)
    streams.set(PDFName.of('N'), stream)
    dictionary.set(PDFName.of('AP'), streams)
  }
  return dictionary
}

/**
 * The border a reader uses for a mark it has no appearance for.
 * @param context - the document's object context.
 * @param width - the stroke width, in user-space units.
 * @returns the border dictionary.
 */
function border(context: PDFContext, width: number): PDFDict {
  const dictionary = PDFDict.withContext(context)
  dictionary.set(PDFName.of('W'), PDFNumber.of(width))
  dictionary.set(PDFName.of('S'), PDFName.of('S'))
  return dictionary
}

/**
 * A pen mark's path, as the `/InkList` a reader edits it through.
 * @param context - the document's object context.
 * @param placed - the mark's geometry, in user space.
 * @returns the ink list array.
 */
function inkList(context: PDFContext, placed: PlacedMark): PDFArray {
  const list = PDFArray.withContext(context)
  list.push(numbers(context, placed.points.flatMap(point => [point[0], point[1]])))
  return list
}

/**
 * The `/L` and `/LE` an arrow carries.
 *
 * A half-drawn arrow is still an arrow: it gets the line it has, and the appearance
 * of one with no head is simply not drawn.
 *
 * @param context - the document's object context.
 * @param dictionary - the annotation being written.
 * @param placed - the mark's geometry, in user space.
 */
function applyLineEnds(context: PDFContext, dictionary: PDFDict, placed: PlacedMark): void {
  const [tail, tip] = placed.points
  if (tail !== undefined) {
    const head = tip ?? tail
    dictionary.set(PDFName.of('L'), numbers(context, [tail[0], tail[1], head[0], head[1]]))
    const endings = PDFArray.withContext(context)
    endings.push(PDFName.of('None'))
    endings.push(PDFName.of('OpenArrow'))
    dictionary.set(PDFName.of('LE'), endings)
  }
}
