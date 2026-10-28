// Module coupling / cohesion metrics for the figmark refactor.
// Reads src/**, builds the import graph, reports:
//  - fan-in / fan-out per module
//  - instability (Ce / (Ca+Ce))
//  - largest files (a proxy for low cohesion: many responsibilities in one place)
//  - cycles
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, dirname, normalize, relative } from 'node:path'

const ROOT = process.argv[2] ?? process.cwd()
const SRC = join(ROOT, 'src')

const files = []
;(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f)
    if (statSync(p).isDirectory()) walk(p)
    else if (/\.tsx?$/.test(f) && !f.endsWith('.d.ts')) files.push(p)
  }
})(SRC)

const resolve = (from, spec) => {
  const base = normalize(join(dirname(from), spec))
  for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
    if (existsSync(base + ext)) return base + ext
  }
  return null
}

const graph = new Map(files.map(f => [f, []]))
for (const f of files) {
  const s = readFileSync(f, 'utf8')
  for (const m of s.matchAll(/from ['"](\.[^'"]+)['"]/g)) {
    const r = resolve(f, m[1])
    if (r && graph.has(r)) graph.get(f).push(r)
  }
}

const fanOut = new Map(), fanIn = new Map(files.map(f => [f, 0]))
for (const [f, deps] of graph) {
  fanOut.set(f, new Set(deps).size)
  for (const d of new Set(deps)) fanIn.set(d, fanIn.get(d) + 1)
}

const rel = f => relative(ROOT, f)
const lines = f => readFileSync(f, 'utf8').split('\n').length

// cycles
const seen = new Set(), stack = [], cycles = []
function dfs(n) {
  if (stack.includes(n)) { cycles.push([...stack.slice(stack.indexOf(n)), n].map(rel)); return }
  if (seen.has(n)) return
  seen.add(n); stack.push(n)
  for (const d of graph.get(n)) dfs(d)
  stack.pop()
}
for (const f of files) dfs(f)

const rows = files.map(f => ({
  file: rel(f), lines: lines(f),
  ce: fanOut.get(f), ca: fanIn.get(f),
  instability: fanOut.get(f) + fanIn.get(f) === 0 ? 0 : +(fanOut.get(f) / (fanOut.get(f) + fanIn.get(f))).toFixed(2),
}))

const totalLines = rows.reduce((a, r) => a + r.lines, 0)
const totalEdges = rows.reduce((a, r) => a + r.ce, 0)

console.log(`modules=${files.length} lines=${totalLines} edges=${totalEdges}`)
console.log(`cycles=${cycles.length}${cycles.length ? ' -> ' + cycles.map(c => c.join(' -> ')).join(' | ') : ''}`)
console.log(`\nlargest (low cohesion candidates):`)
for (const r of [...rows].sort((a, b) => b.lines - a.lines).slice(0, 10)) {
  console.log(`  ${String(r.lines).padStart(5)}  ce=${String(r.ce).padStart(2)} ca=${String(r.ca).padStart(2)} I=${r.instability}  ${r.file}`)
}
const over400 = rows.filter(r => r.lines > 400)
console.log(`\nfiles >400 lines: ${over400.length} (${over400.reduce((a, r) => a + r.lines, 0)} lines)`)
if (process.argv.includes('--json')) console.log('\nJSON ' + JSON.stringify(rows))
