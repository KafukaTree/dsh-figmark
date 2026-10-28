/**
 * Resolving one preview address to a figure that actually exists.
 *
 * This is the only place a request-supplied string becomes a filesystem path, so
 * it is where the plugin's write surface is defined: the address must parse as a
 * file address, must resolve to a suffix this plugin renders, and must name an
 * existing regular file. Anything else is refused with a message the browser can
 * put in front of the reader — and nothing downstream ever accepts a path from the
 * caller again, only the {@link FigureTarget} this module produced.
 * @module dsh-figmark/host/figure-target
 */
import { stat } from 'node:fs/promises'
import { isAbsolute, resolve } from 'node:path'
import { parseFileAddress } from '../shared/address'
import { figureMediaType, isFigurePath } from '../shared/figure-kind'

/** One resolved figure target. */
export interface FigureTarget {
  /** Requested address, echoed into the sidecar. */
  readonly address: string
  /** Absolute path of the figure. */
  readonly path: string
  /** Media type implied by the suffix. */
  readonly mediaType: string
  /**
   * Absolute directory of the Session that owns this figure, or null when the
   * address is absolute and names no Session.
   *
   * The browser needs it for the one thing it cannot work out alone: a path
   * relative to the reader's workspace, which is the form worth copying because
   * it survives the project being moved.
   */
  readonly workspace: string | null
}

/** What resolving an address may answer: the target, or why there is none. */
export type TargetResolution =
  | { readonly ok: true; readonly target: FigureTarget }
  | { readonly ok: false; readonly message: string }

/**
 * Resolve one request address to an existing figure file.
 * @param address - `dsh-resource://file/…` address from the preview tab.
 * @param sessionCwd - Session lookup used for a relative path.
 * @returns the target, or an error message describing why it cannot be annotated.
 */
export async function resolveTarget(
  address: string,
  sessionCwd: (sessionId: string) => Promise<string | undefined>,
): Promise<TargetResolution> {
  const parsed = parseFileAddress(address)
  if (parsed === undefined) return { ok: false, message: `not a file address: ${address}` }
  const sessionId = parsed.sessionId
  const cwd = sessionId === undefined ? undefined : await sessionCwd(sessionId)
  let absolute: string
  if (isAbsolute(parsed.path)) {
    absolute = parsed.path
  } else {
    if (cwd === undefined) {
      return { ok: false, message: `cannot resolve this Session's directory for a relative path: ${address}` }
    }
    absolute = resolve(cwd, parsed.path)
  }
  if (!isFigurePath(absolute)) return { ok: false, message: `not an annotatable figure: ${absolute}` }
  const mediaType = figureMediaType(absolute)
  /* v8 ignore next -- isFigurePath already restricted the suffixes figureMediaType covers. */
  if (mediaType === undefined) return { ok: false, message: `no media type for ${absolute}` }
  try {
    const info = await stat(absolute)
    if (!info.isFile()) return { ok: false, message: `not a regular file: ${absolute}` }
  } catch {
    return { ok: false, message: `no such figure: ${absolute}` }
  }
  return { ok: true, target: { address, path: absolute, mediaType, workspace: cwd ?? null } }
}
