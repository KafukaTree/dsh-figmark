/**
 * Does every import in the tree still resolve to something that exports it?
 *
 * A file split moves names between modules. The thing that actually breaks is a
 * call site still importing a name from the path it used to live at, and no
 * other gate sees it: the typecheck cannot, because a re-export can stay
 * syntactically valid while pointing at a name that moved; the golden dump
 * cannot, because it only knows what renders.
 *
 * So this reads every named import in the tree, resolves the module the way the
 * bundler would, and checks the name is exported there. A move is fine. A
 * dangling import is not.
 *
 * Verified by reintroducing the `session.ts` import that broke seventeen tests:
 * this names that exact line; revert, and it passes.
 *
 * @example
 * node --experimental-strip-types tools/api-check.ts .
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, normalize, relative } from 'node:path'

/** One `.ts`/`.tsx` file's text, with its path for messages. */
interface Source {
  readonly path: string
  readonly text: string
}

/** Every source file under the directories that ship or test this package. */
function collect(root: string): Source[] {
  const sources: Source[] = []
  const walk = (directory: string, skip: (name: string) => boolean): void => {
    if (!existsSync(directory)) return
    for (const entry of readdirSync(directory)) {
      const path = join(directory, entry)
      if (statSync(path).isDirectory()) {
        if (!skip(entry)) walk(path, skip)
      } else if (/\.tsx?$/u.test(entry) && !entry.endsWith('.d.ts')) {
        sources.push({ path, text: readFileSync(path, 'utf8') })
      }
    }
  }
  walk(join(root, 'src'), () => false)
  // The gate fixtures are deliberately broken code; they are not part of the tree.
  walk(join(root, 'tests'), name => name === 'gates')
  return sources
}

/** Resolve a relative import specifier to the file it names, the way the bundler would. */
function resolveModule(from: string, specifier: string): string | undefined {
  const base = normalize(join(dirname(from), specifier))
  for (const suffix of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
    if (existsSync(base + suffix)) return base + suffix
  }
  return undefined
}

/** Add every name one `export { ... }` clause makes available. */
function addClauseNames(clause: string, into: Set<string>): void {
  for (const part of clause.split(',')) {
    // `export { type Foo, bar as baz }` names two things: Foo and baz. The kind is
    // dropped on purpose — a name moving from a local function to a re-export from
    // its new home is still the same name the call sites use.
    const name = part.trim().replace(/^type\s+/u, '').split(/\s+as\s+/u).pop()?.trim()
    if (name !== undefined && name !== '') into.add(name)
  }
}

/** Every name a module makes available, declared or re-exported. */
function exportsOf(file: string, cache: Map<string, Set<string>>): Set<string> {
  const hit = cache.get(file)
  if (hit !== undefined) return hit
  // Seed with an empty set first so a cycle terminates instead of recursing.
  cache.set(file, new Set())
  const names = new Set<string>()
  const text = readFileSync(file, 'utf8')
  for (const match of text.matchAll(/^export (?:declare )?(?:default )?(?:async )?(?:function|const|let|var|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/gmu)) {
    const name = match[1]
    if (name !== undefined) names.add(name)
  }
  for (const match of text.matchAll(/^export (?:type )?\{([^}]*)\}/gmu)) addClauseNames(match[1] ?? '', names)
  for (const match of text.matchAll(/^export \* from ['"]([^'"]+)['"]/gmu)) {
    const specifier = match[1]
    if (specifier === undefined) continue
    const inner = resolveModule(file, specifier)
    if (inner !== undefined) for (const name of exportsOf(inner, cache)) names.add(name)
  }
  cache.set(file, names)
  return names
}

const root = process.argv[2] ?? process.cwd()
const sources = collect(root)
const cache = new Map<string, Set<string>>()
const problems: string[] = []
let checked = 0

for (const source of sources) {
  // The brace group may span lines but may not contain a closing brace: without
  // that, a lazy match runs past this statement into the next one's braces and
  // reports every name in between as an import from the wrong module.
  for (const match of source.text.matchAll(/import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+['"](\.[^'"]+)['"]/gu)) {
    const specifier = match[2]
    if (specifier === undefined) continue
    const target = resolveModule(source.path, specifier)
    if (target === undefined) {
      problems.push(`${relative(root, source.path)}: cannot resolve module ${specifier}`)
      continue
    }
    const available = exportsOf(target, cache)
    for (const part of (match[1] ?? '').split(',')) {
      const name = part.trim().replace(/^type\s+/u, '').split(/\s+as\s+/u)[0]?.trim()
      if (name === undefined || name === '') continue
      checked += 1
      if (!available.has(name)) {
        problems.push(`${relative(root, source.path)}: imports ${name} from ${relative(root, target)}, which no longer exports it`)
      }
    }
  }
}

if (problems.length === 0) {
  console.log(`every one of ${checked} named imports resolves to an export`)
  process.exit(0)
}
for (const line of problems) console.error(line)
process.exit(1)
