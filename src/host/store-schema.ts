/**
 * The wire schema of one annotation document.
 *
 * Everything that crosses the HTTP boundary is JSON somebody else wrote, so it is
 * validated field by field before any of it reaches disk. This module owns that
 * one job: turning unknown JSON into {@link AnnotationDocument} or refusing it
 * with a message that names the field. It deliberately knows nothing about files
 * — the read and write modules call it, never the other way round.
 *
 * The two figure shapes are held apart here rather than tolerated downstream: a
 * document is either one surface (width and height) or a paged one (pageCount),
 * and a mark may name a page only when its figure has pages. A reader that got
 * both would have to guess which coordinate space the marks live in.
 * @module dsh-figmark/host/store-schema
 */
import { MAX_DETAIL_CHARS, MAX_SUMMARY_CHARS } from './store-limits'
import {
  ANNOTATION_VERSION,
  type AnnotationDocument,
  type AnnotationMark,
  type FigureBox,
  type FigurePoint,
  type MarkAnchor,
  type MarkKind,
  clampWeight,
} from '../shared/annotation'

/** Longest element selector one anchor may carry. */
const MAX_SELECTOR_CHARS = 400

/**
 * A note as it is stored: trimmed, and refused when it is longer than a paragraph.
 *
 * The cap is enforced rather than truncated. A writer that silently cut a pasted
 * paragraph would hand the reader back a different sentence than the one they
 * wrote, with no way to tell which half survived; refusing says so and keeps the
 * screen's copy intact. Absent and empty are the same thing — an empty note is no
 * note, and writing one would make the file say something the reader did not.
 * @param value - the field as it arrived.
 * @param what - which field, for the refusal message.
 * @returns the note, or undefined when there is none.
 * @throws {Error} when the note is longer than a paragraph.
 */
function readNote(value: unknown, what: string, max: number): string | undefined {
  if (typeof value !== 'string') return undefined
  if (value.length > max) {
    throw new Error(`the annotation ${what} is longer than ${String(max)} characters`)
  }
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

/** Kinds a mark may declare. */
const MARK_KINDS: readonly MarkKind[] = ['arrow', 'rect', 'ellipse', 'pen', 'point', 'element']

/**
 * Whether a value is a finite figure coordinate pair.
 * @param value - candidate value from the wire.
 * @returns true when the value is a two-number tuple.
 */
function isPoint(value: unknown): value is FigurePoint {
  return Array.isArray(value)
    && value.length === 2
    && value.every(entry => typeof entry === 'number' && Number.isFinite(entry))
}

/**
 * Whether a value is a finite figure rectangle.
 * @param value - candidate value from the wire.
 * @returns true when the value is a four-number tuple.
 */
function isBox(value: unknown): value is FigureBox {
  return Array.isArray(value)
    && value.length === 4
    && value.every(entry => typeof entry === 'number' && Number.isFinite(entry))
}

/**
 * Validate one anchor from the wire.
 * @param value - candidate anchor.
 * @returns the anchor, or undefined when absent; throws when malformed.
 */
function readAnchor(value: unknown): MarkAnchor | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'object') throw new Error('annotation mark anchor must be an object')
  const raw = value as Record<string, unknown>
  if (typeof raw['tag'] !== 'string') throw new Error('annotation mark anchor needs a tag')
  if (!isBox(raw['bbox'])) throw new Error('annotation mark anchor needs a four-number bbox')
  const anchor: MarkAnchor = {
    tag: raw['tag'],
    bbox: raw['bbox'],
    ...(typeof raw['id'] === 'string' ? { id: raw['id'] } : {}),
    ...(typeof raw['title'] === 'string' ? { title: raw['title'] } : {}),
    ...(typeof raw['text'] === 'string' ? { text: raw['text'] } : {}),
    // A selector is a path into a document the browser read, so it is capped like
    // every other field the browser sends: an anchor beyond this is not one this
    // plugin wrote.
    ...(typeof raw['selector'] === 'string' ? { selector: raw['selector'].slice(0, MAX_SELECTOR_CHARS) } : {}),
  }
  return anchor
}

/**
 * Read one optional stroke weight from the wire.
 * @param value - the field as it arrived.
 * @returns the weight, or undefined when absent.
 * @throws {Error} when the field is present but is not a usable multiple.
 */
function readWeight(value: unknown): number | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error('annotation mark weight must be a finite multiple of the default width')
  }
  // Out-of-range weights are pulled back rather than dropped: the field is a
  // preference the reader set, and a preference that vanishes silently is worse
  // than one held at its nearest allowed value.
  return clampWeight(value)
}

/**
 * Read one optional rotation from the wire.
 * @param value - the field as it arrived.
 * @returns the angle in degrees, or undefined when absent.
 * @throws {Error} when the field is present but is not a finite number.
 */
function readRotation(value: unknown): number | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error('annotation mark rotation must be a finite number of degrees')
  }
  return value
}

/**
 * Read one optional positive integer field from the wire.
 * @param raw - the object as it arrived.
 * @param field - field name, used in the failure message.
 * @returns the number, or undefined when the field is absent.
 * @throws {Error} when the field is present but is not a positive integer.
 */
function readPositiveInteger(raw: Record<string, unknown>, field: string): number | undefined {
  const value = raw[field]
  if (value === undefined) return undefined
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new Error(`annotation ${field} must be a positive integer`)
  }
  return value
}

/**
 * Read one optional positive size from the wire.
 * @param raw - the figure object as it arrived.
 * @param field - field name, used in the failure message.
 * @returns the size, or undefined when the field is absent.
 * @throws {Error} when the field is present but is not a positive number.
 */
function readSize(raw: Record<string, unknown>, field: 'width' | 'height'): number | undefined {
  const value = raw[field]
  if (value === undefined) return undefined
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new Error(`annotation figure ${field} must be a positive number`)
  }
  return value
}

/**
 * Validate one mark from the wire.
 *
 * A mark names the page it was drawn on exactly when its figure is a paged
 * document: on a single-surface figure a page number would be a coordinate space
 * that does not exist, so it is refused rather than ignored.
 *
 * @param value - candidate mark.
 * @param index - position used in the failure message.
 * @param figure - the validated figure the mark belongs to.
 * @returns the validated mark.
 * @throws {Error} when a required field is missing or mistyped.
 */
function readMark(value: unknown, index: number, figure: { readonly width?: number; readonly pageCount?: number }): AnnotationMark {
  if (typeof value !== 'object' || value === null) throw new Error(`annotation mark ${index} must be an object`)
  const raw = value as Record<string, unknown>
  const kind = raw['kind']
  if (typeof kind !== 'string' || !(MARK_KINDS as readonly string[]).includes(kind)) {
    throw new Error(`annotation mark ${index} has unknown kind ${JSON.stringify(kind)}`)
  }
  if (typeof raw['id'] !== 'string' || raw['id'] === '') throw new Error(`annotation mark ${index} needs an id`)
  if (typeof raw['color'] !== 'string') throw new Error(`annotation mark ${index} needs a color`)
  const points = raw['points']
  if (!Array.isArray(points) || points.length === 0 || !points.every(isPoint)) {
    throw new Error(`annotation mark ${index} needs at least one coordinate pair`)
  }
  const page = readPositiveInteger(raw, 'page')
  if (page !== undefined && figure.width !== undefined) {
    throw new Error(`annotation mark ${index} names a page, but its figure is one surface`)
  }
  if (page !== undefined && figure.pageCount !== undefined && page > figure.pageCount) {
    throw new Error(`annotation mark ${index} is on page ${page} of a ${figure.pageCount}-page document`)
  }
  const anchor = readAnchor(raw['anchor'])
  const rotation = readRotation(raw['rotation'])
  const weight = readWeight(raw['weight'])
  const detail = readNote(raw['detail'], 'mark note', MAX_DETAIL_CHARS)
  return {
    id: raw['id'],
    kind: kind as MarkKind,
    color: raw['color'],
    points,
    ...(detail === undefined ? {} : { detail }),
    ...(page === undefined ? {} : { page }),
    ...(rotation === undefined ? {} : { rotation }),
    ...(weight === undefined ? {} : { weight }),
    ...(anchor === undefined ? {} : { anchor }),
  }
}

/**
 * Validate a whole annotation document from the wire.
 * @param value - parsed request body.
 * @returns the validated document.
 * @throws {Error} when the body is not a document this plugin wrote.
 */
export function readAnnotationDocument(value: unknown): AnnotationDocument {
  if (typeof value !== 'object' || value === null) throw new Error('annotation document must be an object')
  const raw = value as Record<string, unknown>
  if (raw['version'] !== ANNOTATION_VERSION) {
    throw new Error(`annotation document version ${JSON.stringify(raw['version'])} is not ${ANNOTATION_VERSION}`)
  }
  const figure = raw['figure']
  if (typeof figure !== 'object' || figure === null) throw new Error('annotation document needs a figure')
  const figureRaw = figure as Record<string, unknown>
  for (const field of ['address', 'path', 'mediaType', 'sha256'] as const) {
    if (typeof figureRaw[field] !== 'string' || figureRaw[field] === '') {
      throw new Error(`annotation figure needs ${field}`)
    }
  }
  const width = readSize(figureRaw, 'width')
  const height = readSize(figureRaw, 'height')
  if ((width === undefined) !== (height === undefined)) {
    throw new Error('annotation figure needs both its width and its height, or neither')
  }
  const pageCount = readPositiveInteger(figureRaw, 'pageCount')
  if (pageCount !== undefined && width !== undefined) {
    // A document with pages has no single size, and a single surface has no pages:
    // a document carrying both would leave a reader guessing which one the mark
    // coordinates are measured in.
    throw new Error('annotation figure is a paged document, so it cannot carry width and height')
  }
  const marks = raw['marks']
  if (!Array.isArray(marks)) throw new Error('annotation document needs a marks array')
  const updatedAt = typeof raw['updatedAt'] === 'string' ? raw['updatedAt'] : new Date().toISOString()
  const summary = readNote(raw['summary'], 'document note', MAX_SUMMARY_CHARS)
  return {
    version: ANNOTATION_VERSION,
    figure: {
      address: figureRaw['address'] as string,
      path: figureRaw['path'] as string,
      mediaType: figureRaw['mediaType'] as string,
      sha256: figureRaw['sha256'] as string,
      ...(width !== undefined && height !== undefined ? { width, height } : {}),
      ...(pageCount === undefined ? {} : { pageCount }),
    },
    createdAt: typeof raw['createdAt'] === 'string' ? raw['createdAt'] : updatedAt,
    updatedAt,
    marks: marks.map((mark, index) => readMark(mark, index, { ...(width === undefined ? {} : { width }), ...(pageCount === undefined ? {} : { pageCount }) })),
    ...(summary === undefined ? {} : { summary }),
  }
}
