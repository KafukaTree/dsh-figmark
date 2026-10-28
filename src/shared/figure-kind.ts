/**
 * Document suffixes, shared by the browser and Node halves.
 * @module dsh-figmark/shared/figure-kind
 */
import { suffixOf } from './path-name'

/**
 * File suffixes this plugin treats as annotatable documents.
 *
 * A PDF is one document however many pages it has: the browser half renders one
 * page at a time, each mark records the page it was drawn on, and saving writes
 * the marks back into a copy of the document as native annotations.
 *
 * An HTML document is one surface: the browser half renders it at a fixed width
 * and records marks in those layout pixels, and its marks file is the only
 * artifact a save writes — a rendered document cannot be flattened into a
 * picture the way a figure can.
 */
export const FIGURE_EXTENSIONS = ['svg', 'png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif', 'ico', 'pdf', 'html', 'htm'] as const

/** Media type of a document that has pages rather than one surface. */
export const PAGED_MEDIA_TYPE = 'application/pdf'

/**
 * Media type of one document path.
 * @param path - file path.
 * @returns the media type, or undefined for an unsupported suffix.
 */
export function figureMediaType(path: string): string | undefined {
  switch (suffixOf(path)) {
    case 'pdf': return PAGED_MEDIA_TYPE
    case 'svg': return 'image/svg+xml'
    case 'png': return 'image/png'
    case 'jpg':
    case 'jpeg': return 'image/jpeg'
    case 'webp': return 'image/webp'
    case 'bmp': return 'image/bmp'
    case 'gif': return 'image/gif'
    case 'ico': return 'image/x-icon'
    case 'html':
    case 'htm': return 'text/html'
    default: return undefined
  }
}

/**
 * Whether a path names a document this plugin renders.
 * @param path - file path.
 * @returns true when the suffix is one this plugin annotates.
 */
export function isFigurePath(path: string): boolean {
  return (FIGURE_EXTENSIONS as readonly string[]).includes(suffixOf(path))
}

/**
 * Whether one media type is the paged-document one.
 *
 * The browser half holds a media type rather than a path when it decides which
 * JSON field carries a review artifact, so the comparison is named here too
 * instead of being re-spelled at that call site.
 * @param mediaType - media type of the figure.
 * @returns true when the figure has pages.
 */
export function isPagedMediaType(mediaType: string): boolean {
  return mediaType === PAGED_MEDIA_TYPE
}

/**
 * Whether a figure's suffix calls for the paged-document treatment.
 *
 * One predicate for the whole plugin: the Host picks the review artifact's file
 * extension from it, the store refuses a review whose kind contradicts it, and the
 * browser half picks which JSON field carries the artifact from it. Reading the
 * media type instead would work today and break the day a second suffix maps to
 * `application/pdf`.
 * @param path - file path.
 * @returns true when the figure is a paged document.
 */
export function isPagedFigurePath(path: string): boolean {
  return figureMediaType(path) === PAGED_MEDIA_TYPE
}
