# The surface opens on the reader, not on a tool

## What was wrong

Two complaints that look unrelated and are not.

The first was about the opening state. Entering the annotator armed the arrow tool, so
the very first drag across the picture drew a mark — and on a research figure the first
thing a reader does is move the pointer over the plot to look at it. The surface was
interpreting looking as drawing. The `select` tool existed the whole time and was the
correct opening state; it just was not the default.

The second was about the colour and the numbers. They lived in component state, which
is to say they lived exactly as long as the tab did. Pick a colour, reload, and it was
back to red. Hide the numbers, reload, and they were back. Both are decisions about how
*this reader draws*, and both were being treated as scratch state.

## What changed

**`select` is the opening tool, and it wears a pointer.** `useState<Tool>('select')`
replaces `'arrow'`. The reason is worth stating in the code because the opposite
instinct is the natural one: an armed drawing tool is not "ready", it is *committed* —
every idle gesture becomes content, and the reader has to undo by command what they did
by accident. Select makes the surface passive until asked, which is what a picture
wants to be while someone is reading it. `finishDrawing` already returned to `select`,
so the surface now opens in the state every finished mark returns to, rather than
opening in a state it never returns to.

The tool button for it is a pointer rather than the word 选择. The other five tools are
words because a rectangle is not an obvious picture for "draw a rectangle"; a pointer
is what a pointer means, and it is the one tool a reader does not have to be taught.
The button keeps `aria-label` and `title`, so the accessible name is unchanged and the
test that finds buttons by label keeps working — the picture replaces the visible text,
not the name.

**Colour and number style moved to `client/preferences.ts`.** New module, one storage
key, both read and write guarded. The design question was where these belong, and the
answer that first suggests itself — put them in the annotation sidecar — is wrong for a
reason that only shows up at the edges: a figure with no annotation has no sidecar, so
a reader who chooses a colour, draws nothing, and reloads would find the choice gone.
They are not facts about a figure; they are the reader's settings, and they need a home
that exists before the first mark does. Browser storage is scoped to the reader and
exists immediately.

The read side treats storage as hostile, because it is shared with the whole shell and
may hold bytes an older build wrote. A colour must be six hex digits or it is dropped; a
scale outside the range is *clamped rather than dropped*, following the same rule the
sidecar reader already uses — the number still says which way the reader was reaching,
and discarding the whole shape over a size would be the wrong trade. Every failure
path — denied storage, absent storage, unparsable JSON, a record that is not an object —
ends at the defaults, which is a state the surface can always draw.

**The annotation still wins over the preference.** When an opened figure records its own
`badgeScale` or `badgesHidden`, that style is used and the remembered one is left alone.
The delivered picture is what the agent read; reopening the annotation at a different
size would show the reader something the agent never saw. The preference governs the
next mark, the annotation governs the marks that exist.

## Consequences

- Preferences are shared across figures by design: a reader working through a set of
  figures draws them in one colour. That is also why a test cannot leak one into the
  next, so `beforeEach` clears the storage — a test-local `clear()`, not a change to
  what ships.
- The write is debounced by an effect keyed on `[badgeStyle, color]`, so a drag of the
  slider writes on every step it crosses. That is a handful of small synchronous writes
  to `localStorage` per drag, which is the cost of not adding a second debounce on top
  of the one autosave already runs.
- A reader who has never chosen anything gets exactly the old defaults: red, 0.7,
  numbers shown. Nothing has to be migrated, and an annotation written by the previous
  build reads the same.
- `preferences.ts` is imported by the entry bundle only. The PDF chunk does not reach
  for it, which matters because that direction of import is what splits a shared chunk
  the browser factory cannot load — the constraint that already put `createAutosave`
  behind an injected prop.

## Alternatives considered

- **Keep the arrow tool and add a "do not draw until dragged from empty space" rule.**
  Preserves the fast path for a reader who opens the surface to draw. Rejected because
  it makes the surface's behaviour depend on where the gesture started, and the reader
  cannot see that rule before violating it.
- **Open on `select` but keep the word 选择 on the button.** The smallest change, and it
  keeps every tool uniform. Rejected because the request was specifically for a pointer,
  and the argument for it is sound: a pointer icon is the one tool picture that needs no
  legend, and uniformity with five words is not worth teaching the sixth.
- **Put the pointer icon in a shared icon module.** Tidier for a plugin with more than
  one icon. Rejected for now: there is exactly one, and a module holding one path is a
  layer of indirection with nothing to abstract over.
- **Store the preferences in the annotation sidecar.** One storage mechanism instead of
  two, and the style would travel with the file when it is copied. Rejected because a
  figure with no annotation has no sidecar to hold a colour, which makes the feature
  fail exactly when a reader is setting up before drawing.
- **Store them in a shell-provided settings store.** The right long-term home, and it
  would survive a cleared browser profile. Rejected because the plugin has no such
  surface today, and adding a Host route for two fields would be a bigger change than
  the problem warrants.
- **Drop a stored scale that is out of range.** Simpler than clamping, and consistent
  with `badgeStyleOf`'s reading of a *document*. Rejected because a preference is a
  direction of travel rather than a record of a decision: a build with a wider slider
  that wrote 2.0 should open at the widest this build offers, not at the default.
- **Let the remembered style override the annotation's.** Keeps one source of truth.
  Rejected because the delivered picture would then differ from what the reader sees on
  reopening, and the mark the agent was told about is the one that must come back.
