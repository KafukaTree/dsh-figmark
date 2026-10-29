// @vitest-environment jsdom
/** The injected stylesheet: it lands once, it is marked, and it styles the panel. */
import { describe, expect, it } from 'vitest'
import { STYLES, ensureStyles } from '../src/client/styles'

describe('the annotator stylesheet', () => {
  it('keeps the movable palette above the bar it can be parked under', () => {
    // Both strips are draggable and both can reach the same corner. At equal stacking
    // the later one in the DOM wins, which is the bar — and the palette's only handle
    // is its own grip, so a palette under the bar could never be moved again.
    expect(STYLES).toContain('.da-palette{position:absolute;z-index:9')
    expect(STYLES).toContain('.da-bar{position:absolute;z-index:8')
  })

  it('paints the note that blocks the panel in a tone of its own', () => {
    // The three notes about the figure's own state share one class, so the one saying
    // the figure could not be read looked exactly like the one saying it is loading.
    expect(STYLES).toContain('.da-hint[data-tone="error"]')
  })

  it('sets quiet text in a colour measured against the panel, not the shell token', () => {
    // The shell's tertiary token measured 3.34 on the light panel at the 10-12px this
    // uses — under AA — while the same token passed in the dark theme.
    expect(STYLES).toContain('--da-quiet:#6b6f75')
    expect(STYLES).toContain('body[data-ds-dark-theme] .da-root{--da-quiet:#9aa0a8}')
    expect(STYLES).toContain('color:var(--da-quiet,var(--dsw-alias-label-tertiary')
  })

  it('shows the caret in the Markdown editor, the one field with no border to recolour', () => {
    // Every other text field keeps a focus cue — the note textarea and the page field
    // recolour their border, the page button draws a ring. The editor has `border:none`
    // and `outline:none`, so a keyboard user could not see that the keyboard was there
    // on the one surface whose whole subject is text.
    expect(STYLES).toContain('.da-md-editor:focus-visible')
    // Drawn inside the box: the editor fills its pane, so a ring outside it is clipped.
    expect(STYLES).toContain('outline-offset:-2px')
  })

  it('gives both hand-offs off the pill the same neutral chip', () => {
    // The reader put the two buttons side by side in a screenshot — the paper plane
    // filled blue, the speech bubble grey — and asked for one background. Which
    // hand-off is "primary" is the reader's call at the moment of sending, and the
    // accent in this panel belongs to the marks.
    expect(STYLES).not.toContain('da-comment-send-primary{')
    expect(STYLES).not.toContain('da-comment-send-primary:hover')
  })

  it('takes the armed accent from the token rather than the light theme colour', () => {
    // A hard-coded #176df2 stayed dark-blue in the dark theme while the dot beside it
    // followed the token — two accents one rule apart.
    const hardCoded = [...STYLES.matchAll(/(?<!var\(--da-accent,)#176df2/gu)]
    // The two the palette block declares as its own defaults are the token's fallbacks.
    expect(hardCoded.length).toBeLessThanOrEqual(2)
  })

  it('lands in the document exactly once, however often the body mounts', () => {
    document.head.innerHTML = ''
    ensureStyles(document)
    ensureStyles(document)
    expect(document.querySelectorAll('style[data-dsh-figmark]')).toHaveLength(1)
  })

  it('scopes every rule to the plugin prefix', () => {
    const selectors = [...STYLES.matchAll(/\.(da-[a-z-]+)/g)].map(match => match[1])
    expect(selectors.length).toBeGreaterThan(10)
    for (const selector of selectors) expect(selector?.startsWith('da-')).toBe(true)
  })

  it('takes its palette from the shell aliases, falling back to what it inherits', () => {
    // The theme owner resolves these per palette, so the panel follows the shell
    // into the light one; a shell without them must leave the panel legible
    // rather than hand it a palette of its own.
    for (const token of [
      'label-primary', 'label-secondary', 'label-tertiary',
      'bg-layer-2', 'bg-base', 'bg-document-preview', 'interactive-bg-hover',
      'border-l2', 'border-l3', 'border-l4',
      'state-error-primary', 'state-success-primary', 'label-error',
    ]) {
      expect(STYLES).toContain(`var(--dsw-alias-${token},`)
    }
    // The accent is the plugin's own variable rather than the shell's brand alias,
    // because in this shell that alias is the ink colour: reading it as "the blue"
    // turned the sliders and filled buttons black. Asserted here so nobody quietly
    // swaps it back for the alias that looks like the right one.
    expect(STYLES).toContain('--da-accent:#176df2')
    expect(STYLES).not.toContain('var(--dsw-alias-brand-primary,')
    // Every token this sheet reads carries a fallback.
    const tokens = [...STYLES.matchAll(/var\(--dsw-[a-z0-9-]+([^)]*)\)/gu)]
    expect(tokens.length).toBeGreaterThan(10)
    for (const token of tokens) expect(token[1]?.startsWith(',')).toBe(true)
  })

  it('names no token the shell does not define, and bakes no dark palette', () => {
    // `--dsw-alias-text-l1` and friends never existed: the panel silently fell
    // back to near-white text in every palette, which is what made the light one
    // unreadable.
    expect(STYLES).not.toMatch(/var\(--dsw-alias-text-l/u)
    expect(STYLES).not.toMatch(/var\(--dsw-alias-bg-l[0-9]/u)
    expect(STYLES).not.toMatch(/#e6e6e6|#c8c8c8/iu)
  })

  it('stretches the weight track by an explicit height, not by two offsets', () => {
    // An svg is a replaced element: with a viewBox it takes its intrinsic height for
    // its width and ignores `bottom`, so `top`+`bottom` left the track 100px tall in a
    // 200px rail while the knob travelled the whole rail. The two never lined up, which
    // was the reported symptom. Pinned here because no layout engine in jsdom would
    // catch it — the rule is the fix.
    const rule = /\.da-weight-svg\{[^}]*\}/u.exec(STYLES)?.[0] ?? ''
    expect(rule).toContain('height:calc(100% - 2 * var(--da-track-inset))')
    expect(rule).not.toContain('bottom:')
  })

  it('keeps the knob’s whole circle inside the ends of the bar', () => {
    // Centred on the end, half the knob hung past the top of the track at full weight,
    // which read as the slider overshooting the line. The travel is inset by a radius
    // at each end instead, and the blue ends where the knob's centre is, so the two are
    // written from one expression rather than two that would drift apart.
    expect(STYLES).toContain('.da-weight-fill{position:absolute;left:50%;bottom:var(--da-track-inset)')
  })

  it('gives the weight slider no reach the rail does not show', () => {
    // A native range turned a quarter turn reaches sideways by its *height*. Pinned at
    // 30px under a 7px rail, it reached 11.5px past each edge with `opacity:0`, over
    // the paper — and the rail is up whenever a mark is picked or a weight-bearing
    // tool is armed, which is the state a reader draws in. A press meant to start a
    // mark moved the stroke weight instead, with nothing on screen to explain it.
    const rail = /\.da-weight\{[^}]*\}/u.exec(STYLES)?.[0] ?? ''
    expect(rail).toContain('--da-rail-width:7px')
    // The reach follows the same variable the visible rail is drawn at, so the two
    // cannot drift: an open rail is wider on screen and may be wider under the finger.
    expect(STYLES).toContain('width:var(--da-rail-width);height:200px')
    const input = /\.da-weight-input\{[^}]*\}/u.exec(STYLES)?.[0] ?? ''
    expect(input).toContain('height:var(--da-rail-width)')
    expect(input).not.toContain('height:30px')
  })

  it('leaves the margin transparent and puts the white on the figure itself', () => {
    // The paper grows when a mark reaches past the figure. Filling that grown margin
    // white made the margin look like more of the figure — the reader asked for the
    // board to show through instead, with the white sheet still around the drawing.
    // The exported picture keeps its white fill for a different reader: it is viewed
    // with no board behind it.
    expect(STYLES).toContain('.da-paper{background:transparent}')
    expect(STYLES).toContain('.da-figure-frame{background:var(--dsw-alias-bg-base,#fff)')
  })

  it('lets the hand under the select tool reach the overlay over the figure', () => {
    // The stage says `grab`; the overlay covers the whole figure and is what the
    // pointer is actually over, so a cursor of its own there took the hand away the
    // moment the reader moved onto the picture — exactly where dragging starts. It
    // inherits instead, and a drag in progress (which is `grabbing`) wins over every
    // descendant, so the closed hand also survives the move onto a mark.
    expect(STYLES).toContain('.da-stage[data-hand="true"]{cursor:grab}')
    expect(STYLES).toContain('.da-overlay[data-tool="select"]{cursor:inherit}')
    expect(STYLES).not.toContain('.da-overlay[data-tool="select"]{cursor:default}')
    expect(STYLES).toContain('[data-panning="true"] *{cursor:grabbing !important}')
  })

  it('gives the wait for the first page a box that holds the pane’s frame', () => {
    // The page slot is sized like the body's own column: without it the pane
    // collapses to a line of text until the page arrives.
    expect(STYLES).toContain('.da-placeholder{flex:1 1 auto')
  })
})
