# Refactor: cohesion, boundaries, and proof that nothing moved

The goal is a codebase where one file does one job and the arrows between files
run one way. The constraint is that the plugin behaves exactly as it did. Those
two pull against each other — every split is a chance to change a branch, a
default, or an order — so the constraint is enforced by tooling, not by care.

## The three proofs

```sh
docs/refactor/golden.sh after && docs/refactor/golden.sh diff   # what it renders
docs/refactor/api-check.sh                                      # what it exports
pnpm run check                                                  # the three gates
```

| proof | catches | blind to |
|---|---|---|
| `golden.sh` | a changed DOM: class names, attributes, order, path geometry, text | interaction timing, anything not rendered in its six states |
| `api-check.sh` | a lost or renamed export | a changed signature, a changed default value |
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
node docs/refactor/measure.mjs .
```

The numbers are not the goal. They are how a claim of "more cohesive now" gets
checked instead of asserted. A file that is 400 lines of one idea is fine; a
file that is 400 lines of nine is not, and the line count alone cannot tell
them apart — so a split is only worth making when the pieces have names that
say what they do.
