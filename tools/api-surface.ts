/**
 * Every name every module exports, so two trees can be compared.
 *
 * The golden dump proves the panel renders the same; it cannot see an export
 * that was renamed, dropped, or quietly turned from a function into a constant,
 * because nothing renders those. This records the shape instead.
 *
 * @example
 * node --experimental-strip-types tools/api-surface.ts . > before.json
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

/** One module and the names it makes available. */
type Surface = Record<string, string[]>

/** Every `.ts`/`.tsx` file under one directory, recursively. */
function collect(directory: string): string[] {
  const found: string[] = []
  const walk = (current: string): void => {
    for (const entry of readdirSync(current)) {
      const path = join(current, entry)
      if (statSync(path).isDirectory()) walk(path)
      else if (/\.tsx?$/u.test(entry) && !entry.endsWith('.d.ts')) found.push(path)
    }
  }
  walk(directory)
  return found
}

/** Add every name one `export { ... }` clause makes available. */
function addClauseNames(clause: string, into: string[]): void {
  for (const part of clause.split(',')) {
    const name = part.trim().replace(/^type\s+/u, '').split(/\s+as\s+/u).pop()?.trim()
    if (name !== undefined && name !== '') into.push(name)
  }
}

const root = process.argv[2] ?? process.cwd()
const surface: Surface = {}
for (const file of collect(join(root, 'src')).sort()) {
  const text = readFileSync(file, 'utf8')
  const names: string[] = []
  for (const match of text.matchAll(/^export (?:declare )?(?:default )?(?:async )?(?:function|const|let|var|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/gmu)) {
    const name = match[1]
    if (name !== undefined) names.push(name)
  }
  for (const match of text.matchAll(/^export (?:type )?\{([^}]*)\}/gmu)) addClauseNames(match[1] ?? '', names)
  if (names.length > 0) surface[relative(root, file)] = [...new Set(names)].sort()
}
console.log(JSON.stringify(surface, null, 1))
