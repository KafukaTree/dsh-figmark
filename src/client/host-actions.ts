/**
 * The handful of Host gestures the figure's context menu asks for.
 *
 * These are the same services the shell's own file lists use — `remote.session`
 * for opening and revealing a path on the Host desktop, the plugin's own HTTP
 * route for the two file writes. They are declared structurally rather than
 * imported so a version skew between this package and the harness cannot break
 * the module graph, and every one of them is optional: a composition without a
 * desktop simply offers fewer rows.
 * @module dsh-figmark/client/host-actions
 */

/** The tri-state answer a Host gesture gives. */
export interface HostResult<T> {
  /** Whether the Host performed it. */
  readonly ok: boolean
  /** The value on success. */
  readonly value?: T
}

/** The `remote.session` slice this plugin uses. */
export interface RemoteSessionLike {
  /** Whether the Host has a desktop that can open paths. */
  canOpenWorkspacePath(): Promise<HostResult<boolean>>
  /** Open a path in its default application, or reveal it in the file manager. */
  openWorkspacePath(request: {
    readonly path: string
    readonly action?: 'reveal'
  }): Promise<HostResult<unknown>>
}

/** The `remote` service, of which only the Session namespace matters here. */
export interface RemoteLike {
  /** Per-Session Host gestures. */
  readonly session: RemoteSessionLike
}

/**
 * Whether the Host can open paths at all.
 *
 * A remote Session has no desktop, and asking it to open a file would fail on
 * every row. Answering once at mount keeps the menu from offering gestures the
 * Session cannot perform; a failed probe reads as "no", which loses only the
 * rows, never a working one.
 * @param remote - the injected service, if the composition has one.
 * @returns whether the menu may offer open and reveal.
 */
export async function desktopAvailable(remote: RemoteLike | undefined): Promise<boolean> {
  if (remote === undefined) return false
  try {
    const result = await remote.session.canOpenWorkspacePath()
    return result.ok && result.value === true
  } catch {
    return false
  }
}

/**
 * Open one path in its default application.
 * @param remote - the injected service.
 * @param path - absolute path on the Host.
 * @returns whether the Host accepted it.
 */
export async function openOnDesktop(remote: RemoteLike | undefined, path: string): Promise<boolean> {
  if (remote === undefined) return false
  try {
    return (await remote.session.openWorkspacePath({ path })).ok
  } catch {
    return false
  }
}

/**
 * Reveal one path in the Host's file manager.
 * @param remote - the injected service.
 * @param path - absolute path on the Host.
 * @returns whether the Host accepted it.
 */
export async function revealOnDesktop(remote: RemoteLike | undefined, path: string): Promise<boolean> {
  if (remote === undefined) return false
  try {
    return (await remote.session.openWorkspacePath({ path, action: 'reveal' })).ok
  } catch {
    return false
  }
}

/**
 * Put a picture on the clipboard.
 *
 * The async Clipboard API only accepts a PNG, and only from a user gesture — both
 * of which a menu row is. A browser without it (or a document that refuses the
 * write) is reported as a refusal rather than thrown, because the caller's next
 * move is the same either way: tell the reader it did not work.
 * @param bytes - the PNG the menu composed.
 * @returns whether the clipboard took it.
 */
export async function copyImageToClipboard(bytes: Blob): Promise<boolean> {
  try {
    const clipboard = navigator.clipboard
    if (clipboard === undefined || typeof clipboard.write !== 'function') return false
    await clipboard.write([new ClipboardItem({ 'image/png': bytes })])
    return true
  } catch {
    return false
  }
}
