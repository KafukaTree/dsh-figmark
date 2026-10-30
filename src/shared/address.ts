/**
 * `dsh-resource://file/…` address grammar, as this plugin consumes it.
 *
 * Two scopes exist: `session/<sessionId>/<path>` (a path that may be relative to
 * the addressed Session's workspace or absolute) and `absolute/<path>` (a path
 * with no Session). Segments carry percent escapes; the path keeps its
 * separators literally.
 * @module dsh-figmark/shared/address
 */

/** One parsed file address. */
export interface FileAddress {
  /** Session scope of the address, absent for an `absolute` address. */
  readonly sessionId?: string
  /** Path exactly as the address carried it: relative, or absolute with a leading slash. */
  readonly path: string
}

/** Documented prefix of every file address. */
const PREFIX = 'dsh-resource://file/'

/**
 * Decode one address segment, leaving malformed escapes as their literal text.
 * @param segment - raw percent-encoded segment.
 * @returns the decoded segment.
 */
function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment)
  } catch {
    // A malformed escape is not a path the Host can resolve; keeping the literal
    // text makes the downstream stat fail with a clear "no such file" instead.
    return segment
  }
}

/**
 * Percent-encode one address segment, keeping `:` literal for Windows drive letters.
 * @param segment - one raw segment of an id or a path.
 * @returns the encoded segment.
 */
function encodeSegment(segment: string): string {
  return encodeURIComponent(segment).replace(/%3A/giu, ':')
}

/**
 * Build the address of a file read through one Session.
 *
 * The Sidebar claims resources by address string, so this has to spell an address
 * exactly the way the shell does: backslashes become `/`, the path keeps its
 * separators literal, and an absolute path keeps its leading one — which is what
 * leaves the `//` in `session/<id>//tmp/a.svg`, the form the shell itself writes
 * for a figure outside the workspace.
 * @param sessionId - the Session whose workspace resolves the path.
 * @param path - absolute or workspace-relative path.
 * @returns the `dsh-resource://file/session/<sessionId>/<path>` address.
 */
export function fileAddress(sessionId: string, path: string): string {
  const normalized = path.replace(/\\/gu, '/').replace(/^(?:\.\/)+/u, '')
  return `${PREFIX}session/${encodeSegment(sessionId)}/${normalized.split('/').map(encodeSegment).join('/')}`
}

/**
 * Parse a `dsh-resource://file/…` address.
 * @param address - the address string taken from a preview tab.
 * @returns the parsed address, or undefined when the string is not a file address.
 */
export function parseFileAddress(address: string): FileAddress | undefined {
  if (!address.startsWith(PREFIX)) return undefined
  const rest = address.slice(PREFIX.length)
  if (rest.startsWith('session/')) {
    const afterScope = rest.slice('session/'.length)
    const slash = afterScope.indexOf('/')
    if (slash <= 0) return undefined
    return { sessionId: decodeSegment(afterScope.slice(0, slash)), path: decodeSegment(afterScope.slice(slash + 1)) }
  }
  if (rest.startsWith('absolute/')) return { path: decodeSegment(rest.slice('absolute/'.length)) }
  return undefined
}
