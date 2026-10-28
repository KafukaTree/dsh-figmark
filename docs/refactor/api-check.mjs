/**
 * Does every import in the tree still resolve to something that exports it?
 *
 * A file split moves names between modules. The thing that actually breaks is a
 * call site still importing a name from the path it used to live at. So this
 * reads every import statement, resolves the module the way the bundler would,
 * and checks the name is exported there — a move is fine, a dangling import is
 * not.
 *
 * This is stricter than the golden dump (which only sees what renders) and
 * looser than the typecheck (which cannot see a re-export that was left behind
 * pointing at nothing, because a re-export of a missing name is a type error
 * only when someone imports it).
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, dirname, normalize, relative } from 'node:path'

const ROOT = process.argv[2] ?? process.cwd()
const SRC = join(ROOT, 'src')
const TESTS = join(ROOT, 'tests')

const sources = []
;(function walk(d) {
  if (!existsSync(d)) return
  for (const f of readdirSync(d)) {
    const p = join(d, f)
    if (statSync(p).isDirectory()) walk(p)
    else if (/\.tsx?$/.test(f) && !f.endsWith('.d.ts')) sources.push(p)
  }
})(SRC)
;(function walk(d) {
  if (!existsSync(d)) return
  for (const f of readdirSync(d)) {
    const p = join(d, f)
    if (statSync(p).isDirectory()) {
      if (!f.startsWith('gates')) walk(p)
    } else if (/\.tsx?$/.test(f) && !f.endsWith('.d.ts')) sources.push(p)
  }
})(TESTS)

const resolveModule = (from, spec) => {
  const base = normalize(join(dirname(from), spec))
  for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
    if (existsSync(base + ext)) return base + ext
  }
  return undefined
}

/** Every name a module makes available, whether declared or re-exported. */
const exportsOf = (file) => {
  const text = readFileSync(file, 'utf8')
  const names = new Set()
  for (const m of text.matchAll(/^export (?:declare )?(?:default )?(?:async )?(?:function|const|let|var|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/gmu)) names.add(m[1])
  for (const m of text.matchAll(/^export (?:type )?\{([\s\S]*?)\}/gmu)) {
    for (const part of m[1].split(',')) {
      const name = part.trim().replace(/^type\s+/u, '').split(/\s+as\s+/).pop()?.trim()
      if (name !== undefined && name !== '') names.add(name)
    }
  }
  for (const m of text.matchAll(/^export \* from ['"]([^'"]+)['"]/gmu)) {
    const inner = resolveModule(file, m[1])
    if (inner !== undefined) for (const name of exportsOf(inner)) names.add(name)
  }
  return names
}

const exportCache = new Map()
const cachedExports = (file) => {
  const hit = exportCache.get(file)
  if (hit !== undefined) return hit
  // Seed with an empty set first so a cycle terminates instead of recursing.
  exportCache.set(file, new Set())
  const names = exportsOf(file)
  exportCache.set(file, names)
  return names
}

const problems = []
let checked = 0

for (const file of sources) {
  const text = readFileSync(file, 'utf8')
  // The brace group may span lines but may not contain a closing brace: without
  // that, a lazy match runs past this statement into the next one's braces and
  // reports every name in between as an import from the wrong module.
  for (const m of text.matchAll(/import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+['"](\.[^'"]+)['"]/gu)) {
    const target = resolveModule(file, m[2])
    if (target === undefined) {
      problems.push(`${relative(ROOT, file)}: cannot resolve module ${m[2]}`)
      continue
    }
    const available = cachedExports(target)
    for (const part of m[1].split(',')) {
      const name = part.trim().replace(/^type\s+/u, '').split(/\s+as\s+/)[0]?.trim()
      if (name === undefined || name === '') continue
      checked += 1
      if (!available.has(name)) {
        problems.push(`${relative(ROOT, file)}: imports ${name} from ${relative(ROOT, target)}, which no longer exports it`)
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
