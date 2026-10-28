/**
 * One figure's annotation sidecar: the whole storage boundary, in one import.
 *
 * The work is split by what it touches rather than by what it returns, because
 * each part is dangerous in a different way and is worth reading on its own:
 *
 * - `store-schema.ts` validates JSON from the wire and knows nothing about files;
 * - `store-read.ts` reads the three stored shapes back as one document;
 * - `store-write.ts` derives both file names from the figure and replaces them
 *   atomically;
 * - `store-limits.ts` holds the two size ceilings the read and write paths share.
 *
 * This module is the single import the rest of the Host uses, so callers do not
 * have to know the split. Everything below is re-exported unchanged.
 *
 * The marks file is JSON owned by this plugin; the review artifact is the same
 * marks applied to the figure (a PNG for a single-surface figure, a copy of the
 * document carrying native PDF annotations for one that has pages).
 * @module dsh-figmark/host/store
 */

export { MAX_ANNOTATION_BYTES, MAX_REVIEW_BYTES } from './store-limits'
export { readAnnotationDocument } from './store-schema'
export { fileDigest, readAnnotation } from './store-read'
export {
  removeAnnotation,
  writeAnnotation,
  type RemoveResult,
  type ReviewArtifact,
  type SaveResult,
} from './store-write'
