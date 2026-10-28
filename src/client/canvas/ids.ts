/**
 * Minting the ids of marks drawn in this session.
 *
 * A mark id has to be unique within the loaded document and stable once it is in
 * the annotation file. The counter is module state rather than component state on
 * purpose: a page of a PDF unmounts and remounts, and an id that restarted with the
 * component would collide with the mark the same reader placed a second ago.
 * @module dsh-figmark/client/canvas/ids
 */

/** Monotonic id source for marks created in this session. */
let markSeq = 0

/**
 * Mint a mark id.
 * @returns an id unique within the loaded document.
 */
export function nextMarkId(): string {
  markSeq += 1
  return `m${Date.now().toString(36)}-${markSeq}`
}
