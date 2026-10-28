/**
 * How tangled the modules are.
 *
 * A refactor's contract is a shape, not a behaviour, so it needs a number to
 * move. This builds the import graph from `src/` and reports what makes a
 * codebase hard to hold in one's head: imports per module (fan-out), importers
 * per module (fan-in), the ratio between them (instability), any import cycle,
 * and the files large enough that one file is plainly doing several jobs.
 *
 * The numbers are not the goal. A 400-line file that is one idea is fine and a
 * 200-line file that is four is not, so read the line count as a question to
 * ask — "what are this file's jobs?" — rather than as a verdict.
 *
 * @example
 * node --experimental-strip-types tools/measure.ts .
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, normalize, relative } from 'node:path'

/** One module's place in the graph. */
interface Row {
  readonly file: string
  readonly lines: number
  /** Modules this one imports. */
  readonly ce: number
  /** Modules that import this one. */
  readonly ca: number
  /** `ce / (ce + ca)`: 1 means nothing depends on it, 0 means it depends on nothing. */
  readonly instability: number
}

/** Every `.ts`/`.tsx` under one directory, recursively. */
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

/** Resolve a relative import specifier to the file it names, the way the bundler would. */
function resolveModule(from: string, specifier: string): string | undefined {
  const base = normalize(join(dirname(from), specifier))
  for (const suffix of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
    if (existsSync(base + suffix)) return base + suffix
  }
  return undefined
}

/** Every import cycle in the graph, each reported once. */
function findCycles(graph: ReadonlyMap<string, readonly string[]>): string[][] {
  const cycles: string[][] = []
  const done = new Set<string>()
  const stack: string[] = []
  const visit = (node: string): void => {
    const at = stack.indexOf(node)
    if (at !== -1) {
      cycles.push([...stack.slice(at), node])
      return
    }
    if (done.has(node)) return
    done.add(node)
    stack.push(node)
    for (const next of graph.get(node) ?? []) visit(next)
    stack.pop()
  }
  for (const node of graph.keys()) visit(node)
  return cycles
}

const root = process.argv[2] ?? process.cwd()
const files = collect(join(root, 'src'))

const graph = new Map<string, string[]>()
for (const file of files) {
  const text = readFileSync(file, 'utf8')
  const deps: string[] = []
  for (const match of text.matchAll(/from ['"](\.[^'"]+)['"]/gu)) {
    const specifier = match[1]
    if (specifier === undefined) continue
    const target = resolveModule(file, specifier)
    if (target !== undefined && files.includes(target)) deps.push(target)
  }
  graph.set(file, deps)
}

const fanIn = new Map<string, number>(files.map(file => [file, 0]))
const fanOut = new Map<string, number>()
for (const [file, deps] of graph) {
  const unique = [...new Set(deps)]
  fanOut.set(file, unique.length)
  for (const dep of unique) fanIn.set(dep, (fanIn.get(dep) ?? 0) + 1)
}

const rows: Row[] = files.map(file => {
  const ce = fanOut.get(file) ?? 0
  const ca = fanIn.get(file) ?? 0
  return {
    file: relative(root, file),
    lines: readFileSync(file, 'utf8').split('\n').length,
    ce,
    ca,
    instability: ce + ca === 0 ? 0 : Number((ce / (ce + ca)).toFixed(2)),
  }
})

const cycles = findCycles(graph)
const totalLines = rows.reduce((sum, row) => sum + row.lines, 0)
const totalEdges = rows.reduce((sum, row) => sum + row.ce, 0)
const cycleText = cycles.map(cycle => cycle.map(path => relative(root, path)).join(' -> ')).join(' | ')

console.log(`modules=${files.length} lines=${totalLines} edges=${totalEdges}`)
console.log(`cycles=${cycles.length}${cycles.length === 0 ? '' : ` -> ${cycleText}`}`)
console.log('\nlargest (low cohesion candidates):')
for (const row of [...rows].sort((left, right) => right.lines - left.lines).slice(0, 10)) {
  console.log(`  ${String(row.lines).padStart(5)}  ce=${String(row.ce).padStart(2)} ca=${String(row.ca).padStart(2)} I=${row.instability}  ${row.file}`)
}
const over400 = rows.filter(row => row.lines > 400)
console.log(`\nfiles >400 lines: ${over400.length} (${over400.reduce((sum, row) => sum + row.lines, 0)} lines)`)
if (process.argv.includes('--json')) console.log(`\nJSON ${JSON.stringify(rows)}`)
