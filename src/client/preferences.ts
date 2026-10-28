/**
 * The drawing choices a reader expects to still be there after a reload.
 *
 * Marks and their sentences belong to the annotation and live in its sidecar. The
 * colour the reader is drawing in, and how large the numbers are, are a different
 * kind of thing: they describe how the *next* mark should look, not what any mark
 * already means. Keeping them in a sidecar would tie them to a figure that has one —
 * a reader who picks a colour, draws nothing, and reloads would find the colour gone,
 * because a figure with no annotation has no sidecar to remember it in.
 *
 * So they go in browser storage, which is scoped to the reader rather than to the
 * figure, and which exists before the first mark does. An annotation that records
 * its own number style still wins over this: the picture the agent reads has to match
 * the annotation, not the reader's current preference.
 * @module dsh-figmark/client/preferences
 */

import { clampWeight, isWeight } from '../shared/annotation'

/** Where the preferences are kept. Mirrors the part of `Storage` this needs. */
export interface PreferenceStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

/** The storage key. Namespaced so it cannot collide with the shell's own keys. */
export const PREFERENCES_KEY = 'dsh-figmark:drawing'

/** Where the floating palette sits, as a fraction of the panel it floats over. */
export interface PaletteSpot {
  /** 0 to 1 across the panel: 0 is the left edge, 1 the right. */
  readonly x: number
  /** 0 to 1 down the panel: 0 is the top edge, 1 the bottom. */
  readonly y: number
}

/** What the reader last chose, with anything unreadable taking its default. */
export interface DrawingPreferences {
  /** The colour the next mark is drawn in, when the reader ever chose one. */
  readonly color?: string
  /** The stroke weight the next mark is drawn at, when the reader ever chose one. */
  readonly weight?: number
  /** Where the reader last parked the palette, when they moved it. */
  readonly palette?: PaletteSpot
  /** Where the reader last parked the records bar, when they moved it. */
  readonly bar?: PaletteSpot
  /**
   * How a paged document is read: one page filling the pane, or pages stacked.
   *
   * Remembered here rather than with the document because it describes the reader,
   * not the file: the same deck is scrolled through on a laptop and stepped through
   * when checking one slide, and neither should have to re-choose next time.
   */
}

/** A colour this plugin would have written: six hex digits. */
const HEX_COLOR = /^#[0-9a-f]{6}$/iu

/**
 * One coordinate of the palette's position, pulled into the panel.
 * @param value - whatever was stored.
 * @returns the fraction, or undefined when it is not a usable position.
 */
function readSpot(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined
  return Math.min(1, Math.max(0, value))
}

/**
 * The browser's own storage, when this document may use it.
 *
 * Reading the property itself throws in a document that denies storage access, so the
 * read is what is guarded — a reader in that situation simply keeps no preferences,
 * which is better than a surface that fails to render because of one.
 * @returns the storage, or undefined when there is none to use.
 */
function browserStore(): PreferenceStore | undefined {
  try {
    return globalThis.localStorage ?? undefined
  } catch {
    return undefined
  }
}

/**
 * What one parsed preference record says, ignoring anything it gets wrong.
 * @param raw - the parsed JSON, of unknown shape.
 * @returns the preferences it describes.
 */
function readRecord(raw: unknown): DrawingPreferences {
  if (typeof raw !== 'object' || raw === null) return {}
  const record = raw as Record<string, unknown>
  const color = record['color']
  /**
   * One stored spot, or undefined when it is not a usable position.
   * @param value - whatever was stored under that key.
   * @returns the spot, when both coordinates survived the read.
   */
  const spotOf = (value: unknown): PaletteSpot | undefined => {
    const record = typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
    const x = readSpot(record['x'])
    const y = readSpot(record['y'])
    return x === undefined || y === undefined ? undefined : { x, y }
  }
  const palette = spotOf(record['palette'])
  const bar = spotOf(record['bar'])
  return {
    ...(typeof color === 'string' && HEX_COLOR.test(color) ? { color } : {}),
    ...(isWeight(record['weight']) ? { weight: record['weight'] } : {}),
    ...(palette === undefined ? {} : { palette }),
    ...(bar === undefined ? {} : { bar }),
  }
}

/**
 * The choices in use before the reader changes one.
 * @param store - where to read from; the browser's storage by default.
 * @returns the remembered preferences, or their defaults.
 */
export function readPreferences(store: PreferenceStore | undefined = browserStore()): DrawingPreferences {
  if (store === undefined) return {}
  try {
    const stored = store.getItem(PREFERENCES_KEY)
    if (stored === null) return {}
    return readRecord(JSON.parse(stored) as unknown)
  } catch {
    // Unparsable or unreadable storage is the same as never having chosen: the
    // defaults are a state the surface can always render, so there is nothing to
    // report and nothing to repair.
    return {}
  }
}

/**
 * Remember the choices for the next render, and the next session.
 * @param preferences - what the reader has chosen now.
 * @param store - where to write; the browser's storage by default.
 */
export function rememberPreferences(
  preferences: DrawingPreferences,
  store: PreferenceStore | undefined = browserStore(),
): void {
  if (store === undefined) return
  const { color, weight, palette, bar } = preferences
  try {
    store.setItem(PREFERENCES_KEY, JSON.stringify({
      ...(color === undefined ? {} : { color }),
      ...(weight === undefined ? {} : { weight: clampWeight(weight) }),
      ...(palette === undefined ? {} : { palette: { x: palette.x, y: palette.y } }),
      ...(bar === undefined ? {} : { bar: { x: bar.x, y: bar.y } }),
    }))
  } catch {
    // A storage that refuses the write — full, or denied — costs the reader their
    // colour on the next reload and nothing else. It must not interrupt drawing.
  }
}
