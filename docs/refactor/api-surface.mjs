// Every name every module exports, with the kind of thing it is.
//
// A refactor moves code; it must not move the contract. Comparing this file's
// output before and after catches a rename, a dropped export, or a function
// that quietly became a constant, none of which the golden DOM dump would see.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

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

const rows = []
for (const file of files.sort()) {
  const text = readFileSync(file, 'utf8')
  const names = new Set()
  for (const m of text.matchAll(/^export (?:declare )?(?:default )?(async )?(function|const|let|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/gmu)) {
    names.add(`${m[2]}:${m[3]}`)
  }
  for (const m of text.matchAll(/^export (?:type )?\{([^}]+)\}/gmu)) {
    for (const part of m[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/).pop()?.trim()
      if (name && name !== '') names.add(`reexport:${name}`)
    }
  }
  if (names.size > 0) rows.push([relative(ROOT, file), [...names].sort()])
}

console.log(JSON.stringify(Object.fromEntries(rows), null, 1))
