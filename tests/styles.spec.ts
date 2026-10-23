// @vitest-environment jsdom
/** The injected stylesheet: it lands once, it is marked, and it styles the panel. */
import { describe, expect, it } from 'vitest'
import { STYLES, ensureStyles } from '../src/client/styles'

describe('the annotator stylesheet', () => {
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

  it('leaves the margin transparent and puts the white on the figure itself', () => {
    // The paper grows when a mark reaches past the figure. Filling that grown margin
    // white made the margin look like more of the figure — the reader asked for the
    // board to show through instead, with the white sheet still around the drawing.
    // The exported picture keeps its white fill for a different reader: it is viewed
    // with no board behind it.
    expect(STYLES).toContain('.da-paper{background:transparent}')
    expect(STYLES).toContain('.da-figure-frame{background:var(--dsw-alias-bg-base,#fff)')
  })

  it('gives the wait for the first page a box that holds the pane’s frame', () => {
    // The page slot is sized like the body's own column: without it the pane
    // collapses to a line of text until the page arrives.
    expect(STYLES).toContain('.da-placeholder{flex:1 1 auto')
  })
})
