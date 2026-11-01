// @vitest-environment jsdom
/** The injected stylesheet: it lands once, it is marked, and it styles the panel. */
import { describe, expect, it } from 'vitest'
import { STYLES, ensureStyles } from '../src/client/styles'
import { STAGE_BOTTOM_INSET, STAGE_PADDING } from '../src/client/zoom'

describe('the annotator stylesheet', () => {
  it('keeps the movable palette strictly above the bar it can be parked under', () => {
    // Both strips are draggable and both can reach the same corner. At equal stacking
    // the later one in the DOM wins, which is the bar — and the palette's only handle
    // is its own grip, so a palette under the bar could never be moved again. The two
    // used to be written as the same `z-index:12`, so the comment described an order
    // the sheet did not have: the palette still lost to the bar it was parked on.
    const zOf = (start: string): number => {
      const at = STYLES.indexOf(start)
      const rule = STYLES.slice(at, STYLES.indexOf('}', at))
      return Number(/z-index:(\d+)/u.exec(rule)?.[1])
    }
    expect(zOf('.da-palette{')).toBeGreaterThan(zOf('.da-bar{'))
  })

  it('keeps the bubbles in the corner opposite the tools', () => {
    // The palette keeps the top left — the place the reader learned, and the one the
    // README names. The stack moved to the top right instead: a bubble is transient,
    // but the first thing a message about the figure must not do is cover the tool
    // that would fix what it is reporting.
    expect(STYLES).toContain('.da-toasts{position:absolute;z-index:11;top:14px;right:14px')
    expect(STYLES).toContain('.da-toast{position:absolute;top:0;right:0')
    expect(STYLES).not.toContain('.da-toasts{position:absolute;z-index:11;top:14px;left:14px')
  })

  it('moves HTML bubbles below the address bar and its refusal line', () => {
    // The address bar occupies the top of the HTML surface. A toast at the default
    // 14px covers the file/page badge and the back action; reserve the bar, and the
    // extra refusal line when one is present.
    expect(STYLES).toContain('.da-root[data-html="true"]>.da-toasts{top:58px}')
    expect(STYLES).toContain('.da-root[data-html="true"][data-live-open="false"]>.da-toasts{top:14px}')
    expect(STYLES).toContain('.da-root[data-html="true"][data-live-error="true"]>.da-toasts{top:86px}')
  })

  it('opens the address drawer in place, growing only to the right', () => {
    // The compact icon and the full field share one absolute origin. Opening changes
    // width, not flow position: the field grows rightward from the icon the reader
    // pressed instead of jumping to the top of the pane.
    const bar = /\.da-live-bar\{[^}]*\}/u.exec(STYLES)?.[0] ?? ''
    expect(bar).toContain('position:absolute')
    expect(bar).toContain('top:10px')
    expect(bar).toContain('left:8px')
    expect(bar).toContain('transform-origin:left top')
    expect(STYLES).toContain('.da-live-bar[data-open="true"]{width:min(540px,max(32px,calc(100% - 70px)))')
    expect(STYLES).not.toMatch(/\.da-live-bar\[data-open="true"\]\{[^}]*left:/u)
  })

  it('lets the back action receive a real pointer outside the address field', () => {
    // The action is a sibling of the field. The bar deliberately ignores pointers so
    // its empty width does not cover the page, which means the action must opt back in
    // or a real mouse can never hit it even though a programmatic click can.
    const back = /\.da-live-back\{[^}]*\}/u.exec(STYLES)?.[0] ?? ''
    expect(back).toContain('pointer-events:auto')
    expect(STYLES).toContain('.da-live-refresh{display:flex')
  })

  it('keeps open service pages in one compact, scrollable tab strip', () => {
    expect(STYLES).toContain('.da-service-shell{display:flex;flex-direction:column;height:100%')
    expect(STYLES).toContain('.da-service-tabs{display:flex;flex:0 0 auto')
    expect(STYLES).toContain('overflow-x:auto;overflow-y:hidden;scrollbar-width:none')
    expect(STYLES).toContain('.da-service-list-tab,.da-service-refresh{display:flex')
    expect(STYLES).toContain('.da-service-refresh svg{width:12px;height:12px;stroke-width:1.8}')
    expect(STYLES).toContain('.da-service-refresh:disabled{opacity:.45')
    expect(STYLES).toContain('.da-service-tab[data-active="true"]')
    expect(STYLES).toContain('.da-service-live[hidden],.da-services[hidden]{display:none}')
  })

  it('keeps the HTML-only address drawer hidden on every other document', () => {
    // The drawer is always absolutely positioned. `hidden` must still win so the
    // HTML-only control never floats over a PDF or SVG preview.
    const absolute = STYLES.indexOf('.da-live-bar{position:absolute')
    const hidden = STYLES.indexOf('.da-live-bar[hidden]{display:none}', absolute)
    expect(absolute).toBeGreaterThan(-1)
    expect(hidden).toBeGreaterThan(absolute)
  })

  it('keeps the element-depth control inside the palette column', () => {
    expect(STYLES).toContain('.da-palette-depth{display:flex;flex-direction:column')
    expect(STYLES).toContain('.da-palette-depth-step{display:inline-flex')
    expect(STYLES).not.toContain('.da-palette-hint{')
    expect(STYLES).not.toMatch(/\.da-palette\[data-guide=/u)
    expect(STYLES).not.toContain('.da-pick-guide{position:absolute;')
  })

  it('keeps keyboard focus inside the dark tool palette', () => {
    // Pointer-picking a tool and then changing the element depth with Up/Down makes the
    // browser paint its default two-tone ring around the last-pressed tile. On the dark
    // palette that outer white edge looked like a broken container boundary. The cue
    // remains visible, but it is inset and uses the plugin accent.
    expect(STYLES).toContain(
      '.da-palette .da-tool:focus-visible,.da-palette-depth-step:focus-visible{',
    )
    expect(STYLES).toContain(
      'outline:none!important;box-shadow:inset 0 0 0 1.5px var(--da-accent,#4c8dff)!important',
    )
  })

  it('keeps the annotation count inside the toolbar scrollport', () => {
    // A corner badge lived above an overflow-hidden horizontal strip, which clipped
    // its top row in the real panel. The count is now ordinary button content.
    expect(STYLES).toContain('.da-dock-list{width:auto;min-width:34px;')
    expect(STYLES).toContain('.da-dock-count{display:inline-flex;')
    expect(STYLES).not.toContain('.da-dock-count{position:absolute;')
  })

  it('keeps the palette grip in reach when the palette has to scroll', () => {
    // A seven-tool palette is taller than a short panel. The strip scrolls rather than
    // clipping its last tools, but the grip is its only handle — scrolled out of the
    // top, the reader could not drag the palette at all. It is sticky and shares the
    // strip's own ground so the tiles pass underneath instead of showing through.
    expect(STYLES).toMatch(/\.da-palette-grip\{position:sticky;top:0;z-index:1;background:inherit/u)
  })

  it('animates only the settled position, never the pointer-following drag', () => {
    // The transition is there for a magnetic release and a resize repair. Turning it
    // on while the pointer is down makes the strip lag behind the hand, which is the
    // exact "生硬又追不上" motion this rule exists to prevent.
    expect(STYLES).toContain('transition:left 180ms cubic-bezier(.22,1,.36,1)')
    expect(STYLES).toMatch(/\.da-palette\[data-dragging="true"\]\{[^}]*transition:none/u)
    expect(STYLES).toMatch(/\.da-bar\[data-dragging="true"\]\{[^}]*transition:none/u)
    expect(STYLES).toContain('.da-palette,.da-bar{transition:none!important}')
  })

  it('uses one cursor per gesture: push the paper, move a mark, or pick an element', () => {
    expect(STYLES).toContain('.da-stage[data-hand="true"][data-pannable="true"]{cursor:grab}')
    expect(STYLES).toContain('.da-stage[data-panning="true"],.da-stage[data-panning="true"] *{cursor:grabbing !important}')
    expect(STYLES).toContain('.da-overlay[data-tool="select"] [data-da-mark]{cursor:move}')
    expect(STYLES).toContain('.da-overlay[data-tool="select"] [data-da-kind="element"]{cursor:pointer}')
    expect(STYLES).toContain('.da-overlay[data-tool="element"][data-pick="true"]{cursor:pointer}')
    expect(STYLES).not.toContain('.da-overlay[data-tool="element"]{cursor:crosshair}')
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

  it('hides the large copy of the figure only under a card that can open it', () => {
    // One figure was drawn twice over a sent annotation: full width above the bubble
    // by the shell, and again as the card's 38px copy. The reader asked for the card
    // alone — "上面的大图和那个缩略图其实重复了" — and the card opens the figure itself,
    // so the large copy is the duplicate. It is selected forward from the attachment
    // row because CSS has no way back up from the card to its sibling.
    expect(STYLES).toContain('[data-message-attachments]:has(')
    expect(STYLES).toContain('~ * .da-card:not([data-static])){display:none}')
    // A static card is the queue dock's, where that picture is the only one there is.
    expect(STYLES).not.toContain('[data-message-attachments]:has(~ * .da-card){')
  })

  it('takes its palette from the shell aliases, falling back to what it inherits', () => {
    // The theme owner resolves these per palette, so the panel follows the shell
    // into the light one; a shell without them must leave the panel legible
    // rather than hand it a palette of its own.
    for (const token of [
      'label-primary', 'label-secondary', 'label-tertiary',
      'bg-layer-2', 'bg-base', 'bg-document-preview', 'interactive-bg-hover',
      'border-l2', 'border-l3', 'border-l4',
      'state-error-primary', 'label-error',
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

  it('keeps the default bar outside the fitted figure and the bar to one row', () => {
    // The paper's fitting height and the stage's padding are two halves of the same
    // contract. If CSS drops the bottom inset, the arithmetic still thinks the bar is
    // outside the drawing; if the bar is allowed to wrap, its second row crosses the
    // reserved strip. Both are regressions the reader sees as the bar covering marks.
    expect(STYLES).toContain(
      `padding:${STAGE_PADDING}px ${STAGE_PADDING}px ${STAGE_BOTTOM_INSET}px`,
    )
    expect(STYLES).toContain('.da-bar{position:absolute;z-index:12;left:50%;bottom:12px')
    expect(STYLES).toContain('flex-wrap:nowrap')
    expect(STYLES).toContain('.da-bar-scroll{display:flex')
    expect(STYLES).toContain('overflow-x:auto')
  })

  it('lets the pannable hand under select reach the overlay over the figure', () => {
    // The open hand is only a promise where the paper can actually move. The overlay
    // inherits it, and a drag in progress wins over every descendant.
    expect(STYLES).toContain('.da-stage[data-hand="true"][data-pannable="true"]{cursor:grab}')
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
