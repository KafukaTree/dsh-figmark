/**
 * Browser-local drafts for annotations on live service pages.
 *
 * A live page has no sidecar: its marks belong to a running page rather than a file.
 * Keeping the unpublished draft in this browser makes that difference explicit while
 * still surviving a sidebar remount. Nothing here becomes a file or an attachment;
 * delivery remains the only product of a live-page annotation.
 * @module dsh-figmark/client/live-drafts
 */
import {
  MAX_DETAIL_CHARS, MAX_SUMMARY_CHARS, MARK_KIND_ORDER, isWeight,
  type AnnotationMark, type FigureBox, type FigurePoint, type MarkAnchor, type MarkKind,
} from '../shared/annotation'
import { loopbackAddressOf } from './live-page'

/** Prefix of the per-session storage record. */
export const LIVE_DRAFT_KEY_PREFIX = 'dsh-figmark.services.live-drafts.v1:'

/** Most pages one browser session remembers. */
const MAX_DRAFTS = 12

/** Largest serialized record read or written, so a corrupt draft cannot freeze the picker. */
const MAX_STORED_CHARS = 1_000_000

/** Most marks one live-page draft may restore. */
const MAX_MARKS = 256

/** Most points one mark may carry. */
const MAX_POINTS = 4096

/** Longest selector or ownership surface one mark may carry. */
const MAX_SELECTOR_CHARS = 400

/** Longest human-facing anchor field. */
const MAX_ANCHOR_TEXT_CHARS = 400

/** One restorable annotation for a live address. */
export interface LiveDraft {
  /** Marks drawn on that page, in list order. */
  readonly marks: readonly AnnotationMark[]
  /** The page-level note. */
  readonly summary: string
  /** Epoch milliseconds of the latest edit. */
  readonly updatedAt: number
}

/** The versioned wire shape kept in localStorage. */
interface StoredDrafts {
  readonly version: 1
  readonly entries: readonly (readonly [string, unknown, unknown, unknown])[]
}

/** Read a bounded string. */
function textOf(value: unknown, max: number): string | undefined {
  return typeof value === 'string' && value.length <= max ? value : undefined
}

/** Read a finite point. */
function pointOf(value: unknown): FigurePoint | undefined {
  if (!Array.isArray(value) || value.length !== 2) return undefined
  const [x, y] = value as readonly unknown[]
  return typeof x === 'number' && Number.isFinite(x)
    && typeof y === 'number' && Number.isFinite(y)
    ? [x, y]
    : undefined
}

/** Read a finite box. */
function boxOf(value: unknown): FigureBox | undefined {
  if (!Array.isArray(value) || value.length !== 4) return undefined
  const values = value as readonly unknown[]
  return values.every(entry => typeof entry === 'number' && Number.isFinite(entry))
    ? [values[0] as number, values[1] as number, values[2] as number, values[3] as number]
    : undefined
}

/** Read one element anchor. */
function anchorOf(value: unknown): MarkAnchor | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'object' || value === null) return undefined
  const raw = value as Record<string, unknown>
  const tag = textOf(raw['tag'], MAX_ANCHOR_TEXT_CHARS)
  const bbox = boxOf(raw['bbox'])
  if (tag === undefined || bbox === undefined) return undefined
  const id = textOf(raw['id'], MAX_ANCHOR_TEXT_CHARS)
  const cls = textOf(raw['class'], MAX_ANCHOR_TEXT_CHARS)
  const title = textOf(raw['title'], MAX_ANCHOR_TEXT_CHARS)
  const text = textOf(raw['text'], MAX_ANCHOR_TEXT_CHARS)
  const selector = textOf(raw['selector'], MAX_SELECTOR_CHARS)
  if ((raw['id'] !== undefined && id === undefined)
    || (raw['class'] !== undefined && cls === undefined)
    || (raw['title'] !== undefined && title === undefined)
    || (raw['text'] !== undefined && text === undefined)
    || (raw['selector'] !== undefined && selector === undefined)) return undefined
  return {
    tag,
    bbox,
    ...(id === undefined ? {} : { id }),
    ...(cls === undefined ? {} : { class: cls }),
    ...(title === undefined ? {} : { title }),
    ...(text === undefined ? {} : { text }),
    ...(selector === undefined ? {} : { selector }),
  }
}

/** Read one mark, refusing a partially valid record rather than filling its gaps. */
function markOf(value: unknown): AnnotationMark | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const raw = value as Record<string, unknown>
  const id = textOf(raw['id'], MAX_ANCHOR_TEXT_CHARS)
  const kind = raw['kind']
  const color = textOf(raw['color'], 64)
  const pointValues = raw['points']
  const detail = raw['detail'] === undefined ? undefined : textOf(raw['detail'], MAX_DETAIL_CHARS)
  const page = raw['page']
  const surface = raw['surface'] === undefined ? undefined : textOf(raw['surface'], MAX_SELECTOR_CHARS)
  const rotation = raw['rotation']
  const weight = raw['weight']
  const anchor = anchorOf(raw['anchor'])
  if (id === undefined || id === ''
    || typeof kind !== 'string' || !(MARK_KIND_ORDER as readonly string[]).includes(kind)
    || color === undefined
    || !Array.isArray(pointValues) || pointValues.length === 0 || pointValues.length > MAX_POINTS
    || (raw['detail'] !== undefined && detail === undefined)
    || (page !== undefined && (typeof page !== 'number' || !Number.isInteger(page) || page < 1))
    || (raw['surface'] !== undefined && surface === undefined)
    || (rotation !== undefined && (typeof rotation !== 'number' || !Number.isFinite(rotation)))
    || (weight !== undefined && !isWeight(weight))
    || (raw['anchor'] !== undefined && anchor === undefined)) return undefined
  const points: FigurePoint[] = []
  for (const value of pointValues) {
    const point = pointOf(value)
    if (point === undefined) return undefined
    points.push(point)
  }
  return {
    id,
    kind: kind as MarkKind,
    color,
    points,
    ...(detail === undefined ? {} : { detail }),
    ...(page === undefined ? {} : { page }),
    ...(surface === undefined ? {} : { surface }),
    ...(rotation === undefined ? {} : { rotation }),
    ...(weight === undefined ? {} : { weight }),
    ...(anchor === undefined ? {} : { anchor }),
  }
}

/** Read one stored entry. */
function draftOf(marksValue: unknown, summaryValue: unknown, updatedValue: unknown): LiveDraft | undefined {
  const summary = textOf(summaryValue, MAX_SUMMARY_CHARS)
  const updatedAt = typeof updatedValue === 'number' && Number.isFinite(updatedValue) && updatedValue >= 0
    ? updatedValue
    : undefined
  if (!Array.isArray(marksValue) || marksValue.length > MAX_MARKS || summary === undefined || updatedAt === undefined) {
    return undefined
  }
  const marks: AnnotationMark[] = []
  for (const value of marksValue) {
    const mark = markOf(value)
    if (mark === undefined) return undefined
    marks.push(mark)
  }
  return { marks, summary, updatedAt }
}

/** The localStorage key one session owns. */
function storageKey(sessionId: string): string {
  return `${LIVE_DRAFT_KEY_PREFIX}${encodeURIComponent(sessionId)}`
}

/** Read and validate every remembered draft for one session. */
function readAll(sessionId: string): Map<string, LiveDraft> {
  const drafts = new Map<string, LiveDraft>()
  try {
    const raw = localStorage.getItem(storageKey(sessionId))
    if (raw === null || raw.length > MAX_STORED_CHARS) return drafts
    const stored = JSON.parse(raw) as unknown
    if (typeof stored !== 'object' || stored === null) return drafts
    const record = stored as Record<string, unknown>
    if (record['version'] !== 1 || !Array.isArray(record['entries'])) return drafts
    for (const value of record['entries'].slice(0, MAX_DRAFTS * 2)) {
      if (!Array.isArray(value) || value.length !== 4) continue
      const address = textOf(value[0], 2048)
      if (address === undefined || loopbackAddressOf(address) !== address) continue
      const draft = draftOf(value[1], value[2], value[3])
      if (draft !== undefined) drafts.set(address, draft)
    }
  } catch {
    return new Map()
  }
  return new Map([...drafts].sort((left, right) => left[1].updatedAt - right[1].updatedAt).slice(-MAX_DRAFTS))
}

/** Persist the whole bounded record, dropping the oldest entries if storage is tight. */
function writeAll(sessionId: string, drafts: Map<string, LiveDraft>): void {
  const entries: [string, readonly AnnotationMark[], string, number][] = [...drafts]
    .sort((left, right) => left[1].updatedAt - right[1].updatedAt)
    .slice(-MAX_DRAFTS)
    .map(([address, draft]) => [address, draft.marks, draft.summary, draft.updatedAt])
  while (entries.length > 0) {
    const stored: StoredDrafts = { version: 1, entries }
    const raw = JSON.stringify(stored)
    if (raw.length <= MAX_STORED_CHARS) {
      try {
        localStorage.setItem(storageKey(sessionId), raw)
      } catch {
        // A full or disabled storage area must not stop the page being annotated.
      }
      return
    }
    entries.shift()
  }
  try {
    localStorage.removeItem(storageKey(sessionId))
  } catch {
    // Storage is already unavailable; there is nothing left to remove.
  }
}

/** Read the draft for one live address. */
export function readLiveDraft(sessionId: string, address: string): LiveDraft | undefined {
  return readAll(sessionId).get(address)
}

/** Remember one live address's marks and page note. */
export function writeLiveDraft(sessionId: string, address: string, marks: readonly AnnotationMark[], summary: string): void {
  if (loopbackAddressOf(address) !== address) return
  const drafts = readAll(sessionId)
  if (marks.length === 0 && summary === '') drafts.delete(address)
  else drafts.set(address, { marks, summary, updatedAt: Date.now() })
  writeAll(sessionId, drafts)
}
