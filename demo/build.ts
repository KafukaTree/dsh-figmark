/**
 * Bundles the bubble demo into one file the browser can open from disk.
 *
 * The demo lives outside `src/`, so the plugin's own build never sees it, and the
 * repository carries no bundler of its own: esbuild comes in under pnpm with the test
 * runner. It is found by looking for it rather than by naming a version, so a
 * dependency bump does not break the demo.
 *
 *   node --experimental-strip-types demo/build.ts
 * @module dsh-figmark/demo/build
 */
import { readdirSync } from 'node:fs'
import { createRequire } from 'node:module'

/** Just enough of esbuild to run one build, so the demo needs no types from it. */
interface Bundler {
  build(options: Record<string, unknown>): Promise<void>
}

const require = createRequire(import.meta.url)

/**
 * The one copy of esbuild under `node_modules`, whatever pnpm numbered it.
 * @returns the bundler, ready to be told what to build.
 */
function esbuild(): Bundler {
  const store = new URL('../node_modules/.pnpm/', import.meta.url)
  const dir = readdirSync(store).find(name => name.startsWith('esbuild@'))
  if (dir === undefined) throw new Error('esbuild is not installed: run pnpm install first')
  return require(`../node_modules/.pnpm/${dir}/node_modules/esbuild`) as Bundler
}

await esbuild().build({
  entryPoints: ['demo/toast-demo.tsx'],
  outfile: 'demo/toast-demo.js',
  bundle: true,
  format: 'iife',
  platform: 'browser',
  jsx: 'automatic',
  // The demo is a look at the bubbles, not a shipped build: readable output is worth
  // more here than a couple of hundred kilobytes.
  minify: false,
  define: { 'process.env.NODE_ENV': '"production"' },
  logLevel: 'info',
})
