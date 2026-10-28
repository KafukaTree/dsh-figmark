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
| `tools/gate.sh check` | type errors, lint, uncovered lines, imports that no longer resolve | behaviour at all |

None of the three is sufficient. Together they cover the failure modes a file
split actually has: the branch that got reordered, the name that got dropped,
the signature that got tightened.

## What "low coupling, high cohesion" is measured by

`tools/measure.ts` builds the import graph and reports fan-in, fan-out,
instability, import cycles and the files big enough that one file is plainly
doing several jobs. Baseline, recorded before any split:

```
modules=48 lines=13624 edges=113
cycles=1 -> src/client/annotator-contract.ts -> src/client/locales.ts -> src/client/annotator-contract.ts
files >400 lines: 9 (7616 lines)
```

After the four splits:

```
modules=102 lines=16694 edges=271
cycles=0
files >400 lines: 4 (3253 lines)
  largest file: src/client/AnnotatorBody.tsx 1838 (was 2512)
```

Module count and edge count both more than doubled, and that is the intended
direction rather than a cost: the same code, arranged as 102 named pieces
instead of 48, with the one cycle removed. A split that added files without
adding names would show up here as edges rising while the large-file count
stayed the same — which is the number to watch, not the total.

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

## What the refactor found

The other half of the job was to find bugs without changing behaviour, so the
findings live in two files rather than in patches:

- `docs/refactor/bugs.md` — canvas, export, host, autosave, markdown (12 entries)
- `docs/refactor/pdf-md-bugs.md` — the PDF and Markdown chains (12 entries)

A fix is a behaviour change, and a behaviour change needs its own decision, its
own test and its own note. Letting one ride inside a file split would make the
golden dump look like the split moved rendering when it did not.

Each entry carries the file and line, how to make it happen, what the reader
sees, and a severity that is about the reader. Findings marked "shown" were
reproduced against this tree, not inferred; several needed a driver to expose
and the driver is described in the entry.

The one class worth reading first: of the high-severity findings, three are the
same mistake in three places — **switching documents does not reset the state
that belonged to the old one** — and the worst of them writes one document's
marks into another document's sidecar.
