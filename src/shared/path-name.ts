/**
 * The two path-name readings both halves need, in one place.
 *
 * A path arrives here from the Host (which uses platform separators) or from a
 * browser document (which only ever writes `/`), so every splitter has to accept
 * both. They used to be written out at each call site — once for the address
 * grammar, once for the suffix table, once for a file name in a message — and the
 * copies had already drifted apart on backslashes. One home makes them agree.
 * @module dsh-figmark/shared/path-name
 */

/**
 * The last segment of a path, whatever separators it uses.
 * @param path - a POSIX- or Windows-separated path.
 * @returns the path's file name.
 */
export function baseNameOf(path: string): string {
  return path.slice(Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\')) + 1)
}

/**
 * Read a path's lower-case suffix without the dot.
 * @param path - file path or name.
 * @returns the suffix, or an empty string when the name has none.
 */
export function suffixOf(path: string): string {
  const name = baseNameOf(path)
  const dot = name.lastIndexOf('.')
  // A leading dot is the whole name (`.hidden`), not a suffix separator, so a
  // name with no suffix and a dotfile both answer "".
  return dot <= 0 ? '' : name.slice(dot + 1).toLowerCase()
}
