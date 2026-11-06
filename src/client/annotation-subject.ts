/** Shared display identity for a review, before and after sending. */
import { baseNameOf, suffixOf } from '../shared/path-name'
import type { FigmarkAnnotation } from './annotation-rule'
import { loopbackAddressOf } from './live-page'

/**
 * Identify the reviewed source, independently of its mark tools or screenshot.
 * @param data - the immutable message facts.
 * @returns a readable name, media badge, and whether navigation belongs to the service tab.
 */
export function annotationSubject(data: Pick<FigmarkAnnotation, 'file' | 'html'>): {
  readonly name: string
  readonly badge: string
  readonly live: boolean
} {
  const address = data.html ? loopbackAddressOf(data.file) : undefined
  if (address !== undefined) {
    const url = new URL(address)
    // Include the host: two dev servers often expose the same '/' or '/index.html'.
    return { name: `${url.host}${url.pathname === '/' ? '' : url.pathname}`, badge: 'WEB', live: true }
  }
  const suffix = suffixOf(data.file)
  const badge = data.html ? 'HTML'
    : /^(?:pdf|svg|png|jpe?g|webp|gif|bmp|ico)$/u.test(suffix) ? suffix.toUpperCase() : 'FIG'
  // '?' and '#' are legal file-name characters. Only URLs have query/fragment state.
  return { name: baseNameOf(data.file), badge, live: false }
}
