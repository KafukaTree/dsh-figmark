# Bugs found while refactoring

The refactor is not allowed to change behaviour, so these were recorded rather
than fixed. A fix is a behaviour change and needs its own decision, its own
test, and its own note — it does not ride along inside a file split.

Each entry names where it is, what makes it happen, and what the reader sees.
Severity is about the reader, not about how interesting the bug was to find.

## Open

### 1. A save races the digest it compares against

`src/host/routes.ts` GET branch reads the figure's digest and the annotation
sidecar with `Promise.all`. The digest describes the figure as it was at that
moment; the sidecar describes it as it was when the annotation was written. If
the figure is rewritten between those two moments — a plotting script left
running, a render that lands while the panel is open — the browser receives the
new fingerprint beside the old marks. `AnnotatorBody` then compares them
(`AnnotatorBody.tsx:990`) and reports the annotation as current when it is not,
so marks land on a picture they were not drawn on.

Reader impact: marks silently move onto the wrong picture. Severity: medium,
narrow window.

### 2. An absolute address reaches any file the process can stat

`src/host/figure-target.ts` resolves a request in one of two ways: a relative
path against the session's directory, or an absolute path as given. The
absolute branch never consults the session directory at all. Anything holding
the guard header — which is every same-origin page in the app — can therefore
make the host `stat` any path on the machine and learn whether it exists and is
a regular file.

This is by design as far as reading goes: the plugin's whole job is to open a
figure the user pointed at, and `dsh-resource://file/absolute/...` addresses are
exactly that. What is not by design is that the reply distinguishes "no such
figure" from "not a regular file", which turns the route into a existence
oracle. Severity: low — no write path is reachable, and the container is the
user's own machine.

## Fixed during the refactor

None yet: a fix would be a behaviour change, which is what this refactor exists
not to make.
