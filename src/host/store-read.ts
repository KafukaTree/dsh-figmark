/**
 * Reading one figure's annotation sidecar, including the shapes older versions wrote.
 *
 * Three stored shapes have to read back as one document, because a figure
 * annotated by an earlier version must not lose its marks on upgrade: the current
 * sidecar name, the legacy base-name sidecar, and the per-page files a paged
 * document was once split into. All of them are read-only here — a save always
 * writes the current name — so the upgrade is invisible to the reader.
 *
 * Nothing in this module decides where a sidecar lives: the candidate names come
 * from the sidecar module, which derives every one of them from the figure path.
 * @module dsh-figmark/host/store-read
 */
import { createHash } from 'node:crypto'
import { readdir, readFile, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { ANNOTATION_VERSION, ANNOTATION_VERSION_V2, type AnnotationDocument } from '../shared/annotation'
import {
  annotationCandidates,
  annotationTargetsFigure,
  isPagedFigurePath,
  legacyPagePattern,
} from './sidecar'
import { MAX_ANNOTATION_BYTES } from './store-limits'
import { readAnnotationDocument } from './store-schema'

/**
 * Content hash of one file.
 *
 * Read whole rather than streamed: the caller compares it against the hash the
 * browser recorded when the marks were drawn, and a figure large enough for the
 * difference to matter is not one this plugin renders in a sidebar.
 * @param path - absolute path of the file.
 * @returns the SHA-256 digest as lower-case hex.
 */
export async function fileDigest(path: string): Promise<string> {
  const bytes = await readFile(path)
  return createHash('sha256').update(bytes).digest('hex')
}

/** What reading one figure's sidecars produced. */
export interface SidecarRead {
  /** The stored document, when there was one this plugin can read. */
  readonly annotation: AnnotationDocument | null
  /**
   * Files that are there but could not be read as a document of ours.
   *
   * A sidecar over {@link MAX_ANNOTATION_BYTES} is the case that matters: the write
   * path acknowledged it, the read path refuses it, and answering `null` alone made
   * that indistinguishable from "never annotated" — the reader's marks were gone with
   * the panel saying there had never been any. The names travel up so the panel can
   * say which file is in the way, and the reader has something to act on: the field
   * caps that make such a file impossible are new, but a file written before them
   * still exists.
   */
  readonly unreadable: readonly string[]
}

/**
 * Read one figure's saved annotation.
 *
 * The current sidecar name is tried first, then the legacy base-name one, and a
 * document that names a different figure is skipped — two figures in one directory
 * that share a base name would otherwise read each other's marks.
 *
 * @param figurePath - absolute path of the figure.
 * @returns the document and any sidecar that was present but unusable.
 */
export async function readAnnotation(figurePath: string): Promise<SidecarRead> {
  const unreadable: string[] = []
  for (const candidate of annotationCandidates(figurePath)) {
    const read = await readSidecar(candidate)
    if (read === 'unreadable') unreadable.push(candidate)
    else if (read !== null && annotationTargetsFigure(read, figurePath)) return { annotation: read, unreadable }
  }
  if (!isPagedFigurePath(figurePath)) return { annotation: null, unreadable }
  const merged = await readLegacyPages(figurePath)
  return { annotation: merged.annotation, unreadable: [...unreadable, ...merged.unreadable] }
}

/**
 * Restate the per-page sidecars an earlier version wrote as one document.
 *
 * That version annotated one page at a time and stored each page as its own file,
 * so a figure annotated then has no whole-figure sidecar. Reading them merged
 * keeps those marks visible; the files are left untouched, and the next save
 * writes the unified name.
 *
 * The page count is the highest page found, since the per-page files do not
 * record it — the browser half replaces it with the document's real count the next
 * time it saves.
 *
 * @param figurePath - absolute path of the figure.
 * @returns the merged document, when any page file was readable.
 */
async function readLegacyPages(figurePath: string): Promise<SidecarRead> {
  const directory = dirname(figurePath)
  const pattern = legacyPagePattern(figurePath)
  let entries: string[]
  try {
    entries = await readdir(directory)
  } catch {
    return { annotation: null, unreadable: [] }
  }
  const pages = entries
    .map(name => ({ name, page: Number(pattern.exec(name)?.[1]) }))
    .filter(entry => Number.isInteger(entry.page) && entry.page > 0)
    .sort((left, right) => left.page - right.page)
  const read: { readonly page: number; readonly document: AnnotationDocument }[] = []
  const unreadable: string[] = []
  for (const entry of pages) {
    const path = join(directory, entry.name)
    const document = await readSidecar(path)
    if (document === 'unreadable') unreadable.push(path)
    else if (document !== null && annotationTargetsFigure(document, figurePath)) read.push({ page: entry.page, document })
  }
  const first = read[0]
  if (first === undefined) return { annotation: null, unreadable }
  let summary: string | undefined
  for (const entry of read) {
    if (entry.document.summary !== undefined) summary = entry.document.summary
  }
  return { annotation: {
    version: ANNOTATION_VERSION,
    figure: {
      address: first.document.figure.address,
      path: first.document.figure.path,
      mediaType: first.document.figure.mediaType,
      sha256: first.document.figure.sha256,
      pageCount: read.reduce((highest, entry) => Math.max(highest, entry.page), first.page),
    },
    createdAt: read.reduce((earliest, entry) => (entry.document.createdAt < earliest ? entry.document.createdAt : earliest), first.document.createdAt),
    updatedAt: read.reduce((latest, entry) => (entry.document.updatedAt > latest ? entry.document.updatedAt : latest), first.document.updatedAt),
    marks: read.flatMap(entry => entry.document.marks.map(mark => ({ ...mark, page: entry.page }))),
    ...(summary === undefined ? {} : { summary }),
  }, unreadable }
}

/**
 * Parse one marks file into this plugin's document shape.
 * @param sidecarPath - absolute path of the marks file.
 * @returns the document, null when there is no readable file, or `'unreadable'`
 *   when the file is there and is not something this plugin will read.
 */
async function readSidecar(sidecarPath: string): Promise<AnnotationDocument | null | 'unreadable'> {
  let text: string
  try {
    const info = await stat(sidecarPath)
    // Too large to be a document of ours, and the reader has to be told so: the file
    // exists, so "never annotated" is a lie about their own data.
    if (info.size > MAX_ANNOTATION_BYTES) return 'unreadable'
    text = await readFile(sidecarPath, 'utf8')
  } catch {
    // A missing sidecar is the ordinary "never annotated" state.
    return null
  }
  try {
    return readStoredDocument(JSON.parse(text) as unknown)
  } catch {
    // A sidecar this plugin cannot parse is reported as "no annotation" so the
    // user can start over instead of the preview failing to open.
    return null
  }
}

/**
 * Read a stored sidecar document in either schema version this workbench sees.
 * @param value - parsed marks file content.
 * @returns the document in this plugin's shape, or null when it is neither version.
 */
function readStoredDocument(value: unknown): AnnotationDocument | null {
  if (typeof value !== 'object' || value === null) return null
  const raw = value as Record<string, unknown>
  if (raw['version'] === ANNOTATION_VERSION) return readAnnotationDocument(raw)
  if (raw['version'] === ANNOTATION_VERSION_V2) return readAnnotationDocument(bridgeV2Document(raw))
  return null
}

/**
 * Restate a v2 document as the v1 shape this plugin validates and writes.
 *
 * Both versions carry the same marks and the same figure facts. v2 names the figure
 * `target`, adds fields this plugin does not model (`kind` on the target, per-mark
 * `targetFingerprint`, `nodeId`/`ref` on an anchor — the v1 reader then drops them),
 * and omits `address`, the one v1 field it has no counterpart for: the figure's own
 * path stands in, and the browser half replaces it with the live preview address the
 * next time it saves.
 *
 * @param raw - parsed v2 document.
 * @returns the same document as a v1 shape.
 * @throws {Error} when the document carries no target object.
 */
function bridgeV2Document(raw: Record<string, unknown>): unknown {
  const target = raw['target']
  if (typeof target !== 'object' || target === null) throw new Error('annotation document needs a target')
  const figure = target as Record<string, unknown>
  return {
    version: ANNOTATION_VERSION,
    figure: {
      address: figure['path'],
      path: figure['path'],
      mediaType: figure['mediaType'],
      width: figure['width'],
      height: figure['height'],
      sha256: figure['sha256'],
    },
    createdAt: raw['createdAt'],
    updatedAt: raw['updatedAt'],
    marks: raw['marks'],
    summary: raw['summary'],
  }
}
