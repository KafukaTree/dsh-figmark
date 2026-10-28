/**
 * The plugin's HTTP boundary, shared by Host and Client.
 *
 * Both halves register and call the same routes outside the shell's `/api`
 * channel, so the guard header, the prefix, and the shape of every answer must be
 * identical. They live here — the only place both halves may import — so the two
 * can never drift: the Host builds its bodies from these types and the browser
 * parses them back into the same ones.
 * @module dsh-figmark/shared/http
 */
import type { AnnotationDocument } from './annotation'

/** Request header every plugin route requires. */
export const GUARD_HEADER = 'x-dsh-figmark'

/** Route prefix owned by this plugin. */
export const ROUTE_PREFIX = '/dsh-figmark'

/**
 * The two sidecar files one save wrote.
 *
 * One shape for the Host's answer, the save call's return value, and the paths a
 * delivery names — three names for it is how a field rename on one side silently
 * breaks the other.
 */
export interface SidecarWriteResult {
  /** Absolute path of the marks file. */
  readonly annotationPath: string
  /** Absolute path of the flattened review artifact, when one was written. */
  readonly reviewPath: string | null
}

/** What the Host resolved one preview address to. */
export interface FigureFacts {
  /** The `dsh-resource://file/…` address the annotator opened. */
  readonly address: string
  /** Absolute path of the figure on the Host. */
  readonly path: string
  /** Media type implied by the figure's suffix. */
  readonly mediaType: string
  /** Content hash of the figure at read time. */
  readonly sha256: string
  /**
   * Absolute directory of the Session that owns the figure, or null when the
   * address is absolute and names no Session. The browser needs it for the one
   * thing it cannot work out alone: a workspace-relative path worth copying.
   */
  readonly workspace: string | null
}

/** `GET /dsh-figmark/annotation` body. */
export interface AnnotationReadBody {
  /** Always true: failures use {@link AnnotationFailureBody}. */
  readonly ok: true
  /** The resolved figure. */
  readonly figure: FigureFacts
  /** The saved document, or null when the figure was never annotated. */
  readonly annotation: AnnotationDocument | null
}

/** `POST /dsh-figmark/annotation` body. */
export interface AnnotationSaveBody extends SidecarWriteResult {
  /** Always true: failures use {@link AnnotationFailureBody}. */
  readonly ok: true
}

/** `DELETE /dsh-figmark/annotation` body. */
export interface AnnotationRemoveBody extends SidecarWriteResult {
  /** Always true: failures use {@link AnnotationFailureBody}. */
  readonly ok: true
  /** Whether a sidecar was actually there to remove. */
  readonly removed: boolean
}

/** Body of every refused request, whatever the status code. */
export interface AnnotationFailureBody {
  /** Always false. */
  readonly ok: false
  /** What went wrong, in the Host's own words. */
  readonly error: string
}
