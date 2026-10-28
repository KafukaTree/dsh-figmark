/**
 * Where the figure's right-click menu goes, and what a path means relative to
 * the Session's workspace.
 *
 * Both are arithmetic on numbers the browser will not do for us: a menu opened
 * near an edge has to be moved back inside the window, and "the relative path"
 * is only meaningful against the directory the reader's Session runs in. Keeping
 * them here keeps the component about the menu rather than about trigonometry.
 * @module dsh-figmark/client/figure-menu
 */

/** Width the menu is laid out at, mirrored from the stylesheet. */
export const MENU_WIDTH = 208

/** Space kept between the menu and the window edge, mirrored from the stylesheet. */
export const MENU_EDGE = 8

/** One row's height, mirrored from the stylesheet. */
export const MENU_ROW = 27

/** A click, in viewport coordinates. */
export interface MenuPoint {
  /** Viewport x. */
  readonly x: number
  /** Viewport y. */
  readonly y: number
}

/** Something the menu can be laid out inside. */
export interface MenuViewport {
  /** Visible width. */
  readonly width: number
  /** Visible height. */
  readonly height: number
}

/**
 * Keep a menu wholly inside the window.
 *
 * A right-click near the bottom edge would otherwise open rows below it, where
 * they cannot be reached; the same on the right. Both axes are clamped
 * independently, so a click in one corner only moves the menu as far as it has
 * to move.
 * @param at - the click, in viewport coordinates.
 * @param viewport - visible width and height.
 * @param size - the menu's own width and height.
 * @returns the viewport position to place the menu's top-left corner at.
 */
export function clampMenu(at: MenuPoint, viewport: MenuViewport, size: MenuViewport): {
  readonly left: number
  readonly top: number
} {
  const rightmost = viewport.width - size.width - MENU_EDGE
  const bottommost = viewport.height - size.height - MENU_EDGE
  // `Math.max` after `Math.min` so a window narrower than the menu still pins the
  // menu to its left edge instead of pushing it off the left one.
  return {
    left: Math.max(MENU_EDGE, Math.min(at.x, rightmost)),
    top: Math.max(MENU_EDGE, Math.min(at.y, bottommost)),
  }
}

/**
 * Read a path relative to the directory a Session runs in.
 *
 * The figure is usually somewhere under the workspace, which is what makes a
 * relative path worth copying at all — it survives the project being moved. A
 * figure outside the workspace, or a Session whose directory is unknown, has no
 * such path, and the menu leaves the row out rather than offering one that would
 * not resolve.
 * @param path - absolute path of the figure.
 * @param cwd - absolute workspace directory, or null when it is unknown.
 * @returns the relative path, or null when there is not one.
 */
export function relativeTo(path: string, cwd: string | null): string | null {
  if (cwd === null) return null
  const separator = cwd.endsWith('/') || cwd.endsWith('\\') ? '' : '/'
  const prefix = `${cwd}${separator}`
  if (!path.startsWith(prefix)) return null
  const rest = path.slice(prefix.length)
  // A relative path never climbs: `../x` is not a path inside the workspace.
  return rest === '' || rest.startsWith('..') ? null : rest
}

/**
 * One row the menu offers.
 *
 * Rows are declarative so the component stays a renderer: what the menu can do
 * is decided here, where it can be tested without a browser, and where a row the
 * Host cannot honour is simply absent rather than disabled.
 */
export interface FigureMenuItem {
  /** Stable id; also the key React reconciles by. */
  readonly id: FigureMenuAction
  /** What the row says. */
  readonly label: string
  /** True for a hairline instead of a row. */
  readonly separator?: boolean
}

/** Everything the menu can do to the figure. */
export type FigureMenuAction =
  | 'sendToAgent'
  | 'sendToComposer'
  | 'open'
  | 'reveal'
  | 'copyImage'
  | 'copyRelative'
  | 'copyAbsolute'

/** What the menu can do, and the labels it does it under. */
export interface FigureMenuLabels {
  /** "Send to agent". */
  readonly sendToAgent: string
  /** "Send to composer". */
  readonly sendToComposer: string
  /** "Open in default app". */
  readonly open: string
  /** "Reveal in file manager". */
  readonly reveal: string
  /** "Copy image". */
  readonly copyImage: string
  /** "Copy relative path". */
  readonly copyRelative: string
  /** "Copy absolute path". */
  readonly copyAbsolute: string
}

/**
 * The rows this figure's menu should show.
 *
 * Three groups, in the order a reader wants them: the two Host gestures (only
 * where the Host has a desktop to perform them), then the two copies, then — for
 * a figure outside the workspace — no relative row at all, because there is no
 * path from the workspace to it.
 * @param options - what the Host can do, and whether a relative path exists.
 * @param labels - the four rows' words.
 * @returns the rows, in the order they are drawn.
 */
export function figureMenuItems(
  options: {
    readonly canOpen: boolean
    readonly canSend: boolean
    readonly hasRelative: boolean
    readonly hasImage: boolean
  },
  labels: FigureMenuLabels,
): FigureMenuItem[] {
  const items: FigureMenuItem[] = []
  // The hand-off comes first: it is what the panel is for, and a reader who
  // right-clicked the finished figure is usually done drawing. A figure with no
  // marks has nothing to hand over, so the two rows are absent rather than
  // refused — the same rule the Host gestures follow.
  if (options.canSend) {
    items.push(
      { id: 'sendToAgent', label: labels.sendToAgent },
      { id: 'sendToComposer', label: labels.sendToComposer },
    )
  }
  if (options.canOpen) {
    items.push({ id: 'open', label: labels.open }, { id: 'reveal', label: labels.reveal })
  }
  // The picture is the one thing worth having in the clipboard besides the path,
  // and it is only there for a figure that can be flattened at all.
  if (options.hasImage) items.push({ id: 'copyImage', label: labels.copyImage })
  if (options.hasRelative) items.push({ id: 'copyRelative', label: labels.copyRelative })
  items.push({ id: 'copyAbsolute', label: labels.copyAbsolute })
  return items
}

/**
 * Whether a pointer press landed inside the menu.
 *
 * A menu closes when the reader presses anywhere else, and "anywhere else" has to
 * be answered without knowing what was pressed: the event's composed path is the
 * one list that names every element between the target and the window, including
 * ones inside a shadow root.
 * @param event - the press.
 * @param panel - the menu element, or null before it has been attached.
 * @returns true when the press belongs to the menu itself.
 */
export function pressedInsideMenu(event: Event, panel: Element | null): boolean {
  return panel !== null && event.composedPath().includes(panel)
}

/**
 * The text one copy row puts on the clipboard.
 * @param action - the row that was picked.
 * @param path - absolute path of the figure.
 * @param workspace - absolute workspace directory, or null when it is unknown.
 * @returns the text to copy, or null when the relative row has nothing to copy.
 */
export function copiedText(
  action: FigureMenuAction,
  path: string,
  workspace: string | null,
): string | null {
  return action === 'copyRelative' ? relativeTo(path, workspace) : path
}
