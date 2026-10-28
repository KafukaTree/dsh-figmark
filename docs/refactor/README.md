# Refactor: cohesion, boundaries, and proof that nothing moved

The goal is a codebase where one file does one job and the arrows between files
run one way. The constraint is that the plugin behaves exactly as it did. Those
two pull against each other — every split is a chance to change a branch, a
default, or an order — so the constraint is enforced by tooling, not by care.

## The three proofs

```sh
tools/gate.sh check                                             # typecheck, lint, imports, coverage
docs/refactor/golden.sh after && docs/refactor/golden.sh diff   # what it renders
```

`tools/gate.sh` takes an exclusive lock before running. Several agents share
this working tree, and `vitest --coverage` writes `coverage/.tmp/*.json` as it
goes — two runs at once overwrite each other's temp files and the loser dies
with `ENOENT: coverage/.tmp/coverage-N.json`, which reads like a broken test
and is really two people running the same command. Wait for the lock; do not
work around it.

| proof | catches | blind to |
|---|---|---|
| `golden.sh` | a changed DOM: class names, attributes, order, path geometry, text | interaction timing, anything not rendered in its six states |
| `tools/api-check.ts` | a call site importing a name that moved out of the module it names | a changed signature, a changed default value |
| `pnpm run check` | type errors, lint, uncovered lines | behaviour at all |

None of the three is sufficient. Together they cover the failure modes a file
split actually has: the branch that got reordered, the name that got dropped,
the signature that got tightened.

## What "low coupling, high cohesion" is measured by

`measure.mjs` builds the import graph and reports fan-in, fan-out, instability,
import cycles and the files big enough that one file is plainly doing several
jobs. Baseline, recorded before any split:

```
modules=48 lines=13624 edges=113
cycles=1 -> src/client/annotator-contract.ts -> src/client/locales.ts -> src/client/annotator-contract.ts
files >400 lines: 9 (7616 lines)
```

Run it any time:

```sh
node --experimental-strip-types tools/measure.ts .
```

The numbers are not the goal. They are how a claim of "more cohesive now" gets
checked instead of asserted. A file that is 400 lines of one idea is fine; a
file that is 400 lines of nine is not, and the line count alone cannot tell
them apart — so a split is only worth making when the pieces have names that
say what they do.

## Why the proofs are TypeScript

The first versions were `.mjs` files under `docs/`, which the lint gate reads as
source and holds to the same `no-unsafe-*` rules as `src/` — correctly, because
a script that walks the tree with unchecked `readdirSync` results is the same
class of code either way. Rather than exempt them from the gate, they moved to
`tools/`, joined the typecheck's `include`, and are now subject to exactly what
they check. `tsconfig.json` lists `tools/**/*.ts` for that reason, and it is the
one line to look at if a tool ever stops being typechecked.

## The negative controls

Per §4 of `AGENTS.md`, a gate that has never been seen to fail is not known to
be a gate. Both proofs were taken through the three steps — introduce a
regression, watch it go red, revert:

| proof | regression introduced | what it said |
|---|---|---|
| `golden.sh` | `className="da-root"` → `"da-root-x"` in `AnnotatorBody.tsx` | five of six states `changed:` |
| `tools/api-check.ts` | `session.ts` importing `baseNameOf` from `shared/address` again | `imports baseNameOf from src/shared/address.ts, which no longer exports it` |

The second one is not invented for the occasion: it is the exact break that put
seventeen tests red mid-refactor, found by this tool afterwards. That is the
argument for having it.
