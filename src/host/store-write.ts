/**
 * Writing one figure's annotation sidecar, and removing it again.
 *
 * The two files are written through a temporary name and a rename so a reader
 * never observes a half-written document: a preview opening while an autosave
 * runs reads either the previous document or the new one, never a truncated one.
 *
 * Both file names are derived here from the figure path, never passed in, and the
 * review artifact's kind is checked against the figure's own kind before anything
 * is touched — a PNG review of a PDF would be a file no reader could open.
 * @module dsh-figmark/host/store-write
 */
import { mkdir, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { AnnotationDocument } from '../shared/annotation'
import {
  isPagedFigurePath,
  legacyAnnotationPath,
  legacyPagePattern,
  reviewFileExtension,
  sidecarPaths,
  type SidecarPaths,
} from './sidecar'

/** The flattened artifact written beside the marks, and what it is. */
export interface ReviewArtifact {
  /** File kind, which must match what the figure's own suffix calls for. */
  readonly kind: 'image' | 'pdf'
  /** Artifact bytes. */
  readonly bytes: Uint8Array
}

/** Outcome of one sidecar save. */
export interface SaveResult {
  /** Sidecar paths the save wrote. */
  readonly paths: SidecarPaths
  /** Whether a flattened review artifact was written too. */
  readonly wroteReview: boolean
}

/**
 * How many scratch files this process has named.
 *
 * The clock is not enough on its own: two saves started in the same millisecond
 * share a pid and a millisecond, took the same scratch name, and one of them renamed
 * the other's half-written bytes into place — or found nothing to rename and failed a
 * save that had every right to succeed. A counter inside the process cannot repeat,
 * and the pid and clock still keep two *processes* apart.
 */
let scratchCount = 0

/**
 * Replace one file atomically.
 *
 * The temporary name carries the pid, a counter and the clock so two saves that
 * overlap cannot pick the same scratch file; the rename is the moment the new
 * content becomes observable.
 * @param path - absolute path of the file to replace.
 * @param content - text or bytes to write.
 */
async function writeAtomically(path: string, content: string | Uint8Array): Promise<void> {
  scratchCount += 1
  const temporary = `${path}.tmp-${process.pid}-${scratchCount}-${Date.now()}`
  // The text side is spelled out rather than left to `writeFile`'s default: a
  // sidecar is UTF-8 JSON by contract, and a helper that quietly picks an
  // encoding is one refactor away from writing bytes a reader cannot decode.
  await writeFile(temporary, content, typeof content === 'string' ? 'utf8' : undefined)
  await rename(temporary, path)
}

/**
 * Write one figure's annotation, and optionally its flattened review artifact.
 * @param figurePath - absolute path of the annotated figure.
 * @param document - validated document to persist.
 * @param review - the flattened artifact, when the browser exported one.
 * @returns the written paths.
 * @throws {Error} when the artifact's kind contradicts the figure's own kind.
 */
export async function writeAnnotation(
  figurePath: string,
  document: AnnotationDocument,
  review?: ReviewArtifact,
): Promise<SaveResult> {
  const paths = sidecarPaths(figurePath)
  if (review !== undefined && review.kind !== (isPagedFigurePath(figurePath) ? 'pdf' : 'image')) {
    throw new Error(`a ${reviewFileExtension(figurePath)} review artifact cannot be written from ${review.kind} bytes`)
  }
  await mkdir(dirname(paths.annotation), { recursive: true })
  // The document is pretty-printed on purpose: a sidecar is meant to be readable
  // and diffable by hand, and the size it buys back is not worth an opaque file.
  await writeAtomically(paths.annotation, `${JSON.stringify(document, null, 2)}\n`)
  if (review === undefined) return { paths, wroteReview: false }
  await writeAtomically(paths.review, review.bytes)
  return { paths, wroteReview: true }
}

/** Outcome of removing one figure's sidecars. */
export interface RemoveResult {
  /** Sidecar paths the removal considered. */
  readonly paths: SidecarPaths
  /** Whether a sidecar was actually there to remove. */
  readonly removed: boolean
}

/**
 * Delete one figure's annotation sidecars, leaving the figure itself alone.
 *
 * A sidecar has no meaning once its marks are gone: the marks file would be read
 * back as an empty annotation on the next open, and the review artifact is a
 * picture of marks that no longer exist. Removing both is what makes a deleted or
 * delivered annotation stay gone. A missing file is not an error — the caller's
 * intent is "there are no sidecars here", and that is true either way.
 *
 * @param figurePath - absolute path of the figure whose sidecars are removed.
 * @returns whether anything was removed.
 * @throws {Error} when a sidecar exists but cannot be unlinked.
 */
export async function removeAnnotation(figurePath: string): Promise<RemoveResult> {
  const paths = sidecarPaths(figurePath)
  let removed = false
  for (const path of await allSidecarNames(figurePath)) {
    try {
      await rm(path, { force: false })
      removed = true
    } catch (error) {
      // Only "it was not there" is acceptable: any other failure leaves a stale
      // file that would resurrect the annotation, and the caller must know.
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
  }
  return { paths, removed }
}

/**
 * Every file this plugin may have written beside one figure, oldest spelling first.
 *
 * The read path accepts more names than the write path produces: the legacy
 * base-name sidecar (`fig1.annot.json` beside `fig1.svg`), and for a paged document
 * the one-file-per-page sidecars an earlier version wrote. Removing only the two
 * current names left those behind — and because the reader merges them back in, a
 * cleared figure reopened with its marks on it, which is the bug in finding 1.
 * Whatever the reader will read has to be what a clear removes.
 * @param figurePath - absolute path of the figure whose sidecars are removed.
 * @returns the paths to unlink.
 */
async function allSidecarNames(figurePath: string): Promise<readonly string[]> {
  const paths = sidecarPaths(figurePath)
  const names: string[] = [paths.annotation, paths.review, legacyAnnotationPath(figurePath)]
  if (isPagedFigurePath(figurePath)) {
    // Read the directory rather than reconstruct the names: the page numbers are
    // whatever an earlier version happened to write, and both spellings are legal.
    const pattern = legacyPagePattern(figurePath)
    let entries: string[]
    try {
      entries = await readdir(dirname(figurePath))
    } catch {
      // A directory that cannot be listed is not a reason to refuse the clear: the
      // current names above are still attempted, and if the directory really is
      // unreachable that attempt is what reports it. Failing here instead would turn
      // "one legacy file might be missing" into "the reader cannot clear".
      entries = []
    }
    for (const entry of entries) {
      if (pattern.test(entry)) names.push(join(dirname(figurePath), entry))
    }
  }
  return [...new Set(names)]
}
