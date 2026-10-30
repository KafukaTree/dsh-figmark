/**
 * Styles for the annotator body.
 *
 * The DSH client bundle route serves JavaScript only, so the stylesheet travels
 * inside the bundle and is injected once on first mount. Colors come from the
 * shell's `--dsw-*` aliases, which the theme owner resolves per palette, so the
 * panel follows the shell into the light one; the fallbacks are the inherited
 * values, so a shell that defines no token still renders something legible
 * rather than a palette of its own.
 * @module dsh-figmark/client/styles
 */

/** Marker attribute identifying our own style element. */
const STYLE_MARKER = 'data-dsh-figmark'

/** The stylesheet text. */
export const STYLES = `
/* An accent of the plugin's own.
   The shell's --dsw-alias-brand-primary is not a brand colour in this theme — it
   resolves to the *ink* (near-black on light, near-white on dark), because the shell
   uses it for filled buttons in monochrome. Reading it as "the blue" turned this
   panel's sliders, filled buttons and selection rings into ink: a black knob on a
   white rail, and a wedge that goes solid black at the heaviest setting. The alias
   stays as the fallback so a shell that really does define a brand colour still wins,
   but the accent is named here so every rule reads one variable instead of quietly
   inheriting whatever "primary" means that week.
   The dark block re-states it, because a blue tuned for white paper is too dark on a
   near-black panel. */
/* The panel follows the shell's palette rather than carrying one of its own: every
   colour below is an alias the theme owner resolves, with the inherited value as the
   fallback so a shell that defines nothing still renders something legible. */
.da-root{--da-accent:#176df2;--da-accent-soft:rgba(23,109,242,.14);
  position:relative;display:flex;flex-direction:column;height:100%;min-height:0;overflow:hidden;color:var(--dsw-alias-label-primary,inherit);background:var(--dsw-alias-bg-document-preview,transparent)}
/* The shell marks its dark palette on <body> rather than through prefers-color-scheme:
   a reader can pick either palette whatever the OS is set to, so following the shell's
   own switch is what keeps the accent readable in both. A blue tuned for white paper
   is too dark on a near-black panel. */
body[data-ds-dark-theme] .da-root{--da-accent:#4c8dff;--da-accent-soft:rgba(76,141,255,.22)}
/* Text that is quiet but still text. The shell's tertiary token is tuned for labels a
   reader glances at; at the 10-12px this panel sets its metadata in it measured 3.34
   against the panel's own background in the light theme — under the 4.5 WCAG AA asks
   of text this size — while the same token in the dark theme measured 4.97. So the
   readable-by-default theme was the only one that failed. This pair is measured
   against the panel's own document-preview background in both: 4.55 light, 5.6 dark. */
.da-root{--da-quiet:#6b6f75}
body[data-ds-dark-theme] .da-root{--da-quiet:#9aa0a8}

/* Every small picture in the panel is one stroke set, declared once: without this
   an svg with no fill of its own falls back to a solid black shape, which is what
   turned the dock and the cards into blobs of ink. */
/* Every icon is drawn on one 24-unit grid, and every one of them is asked to
   *render* at the same thickness — 1.2px — so the row reads as one set. On a single
   grid that still means one stroke-width per drawn size, because the number is in
   the icon's own units: 1.2 x 24 / size. The sizes differ only because the buttons
   holding them do; the weight does not. */
.da-ico{width:16px;height:16px;flex:0 0 auto;fill:none;stroke:currentColor;
  stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.da-tool-icon svg{fill:none;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round}

/* --- the floating tool palette ------------------------------------------- */
/* One layer above the bar, and that ordering is the whole point: both strips can be
   dragged to the same corner, and at equal stacking the one rendered later wins — the
   bar. The palette's only handle is its grip, so a palette parked under the bar could
   never be dragged out again, and the reader's recovery was a reload. A strip that can
   be moved must be the one that stays reachable. */
/* The tools float over the figure in a dark rounded pill so they can be parked
   off whichever corner the reader is working on. Dark rather than light: it sits
   on top of a white figure and a white panel, and a dark chip is what reads as
   "this is a control" instead of as one more piece of the picture. */
.da-palette{position:absolute;z-index:9;display:flex;flex-direction:column;align-items:center;gap:2px;
  padding:6px 5px;border-radius:16px;background:var(--dsw-alias-bg-inverse,#2d2d2d);color:#fff;
  box-shadow:0 8px 26px rgba(10,14,24,.3),0 0 0 1px rgba(255,255,255,.08);
  /* The panel clips whatever reaches past it, and the palette is positioned outside
     the one child that scrolls, so a strip taller than the panel would leave its last
     tools painted outside the clip — unclickable, and no scroll to reach them. The
     height it is given is the room on the side it grows towards (placementStyle in
     annotator/placement.ts); this turns that bound into reachable tiles, not a cut. */
  overflow-y:auto;scrollbar-width:thin;box-sizing:border-box}
/* While it is being dragged the pointer is the grip, whatever it passes over. */
.da-palette[data-dragging="true"]{opacity:.94;box-shadow:0 12px 32px rgba(10,14,24,.4),0 0 0 1px rgba(255,255,255,.14)}
.da-palette[data-dragging="true"] *{cursor:move !important}
/* The handle: a block of six dots, the one part of a strip that only drags. The block
   is turned to suit the strip — wider than tall on the bar, taller than wide on the
   palette — because a grip whose proportions fight its strip looks borrowed from the
   other one. */
.da-palette-grip{display:flex;align-items:center;justify-content:center;width:26px;height:17px;
  border-radius:5px;cursor:move;color:rgba(255,255,255,.55);touch-action:none;flex:0 0 auto}
.da-palette-grip:hover{color:rgba(255,255,255,.92);background:rgba(255,255,255,.1)}
/* The dots' box follows the block: three across by two down needs width, two across
   by three down needs height. Sized per block rather than once, so the svg is not
   letterboxed inside its own handle. */
.da-grip-dots{width:12px;height:8px;fill:currentColor;display:block}
.da-bar .da-palette-grip{width:16px;height:18px}
.da-bar .da-grip-dots{width:8px;height:12px}
/* A tile is a round button holding one white glyph. No word under it: six glyphs in
   a column are read at a glance, and the word is still there as the tooltip and as
   the accessible name. */
.da-palette .da-tool{width:32px;height:32px;padding:0;border:0;border-radius:50%;
  background:transparent;color:#fff;gap:0;flex:0 0 auto}
.da-palette .da-tool:hover{background:rgba(255,255,255,.14)}
/* The armed tool is a grey chip, not the accent blue: the palette is the reader's
   controls, and a headlight-blue disc on it competed with the marks on the figure for
   the one thing colour means in this panel. Grey still says "this one", quietly. */
.da-palette .da-tool[aria-pressed="true"]{background:rgba(255,255,255,.22);color:#fff}
.da-palette .da-tool .da-tool-icon{height:auto}
.da-palette .da-tool .da-tool-icon svg{width:17px;height:17px;stroke-width:1.7}

/* --- the size rail ------------------------------------------------------- */
/* A vertical rail along the left edge of the figure: how heavy the pen is, and how
   big a point mark's pin is. Idle it is a hairline, so it costs the figure nothing;
   crossing it opens it out to a track. The track is *tapered* — a thin line at the
   bottom and a broad one at the top — because the control's whole subject is
   thickness, and a wedge says which way is heavier without reading a number.
   A horizontal range input is rotated upright inside the pill: it keeps dragging,
   arrow keys, the step and the accessible name, while the rail above does the
   drawing. The drawn parts never take the pointer, or grabbing the knob would grab
   the knob instead of the slider. */
.da-weight{position:absolute;z-index:7;left:6px;top:50%;transform:translateY(-50%);
  --da-track-inset:10px;--da-knob-size:11px;--da-rail-width:7px;
  display:flex;align-items:center;justify-content:center;width:var(--da-rail-width);height:200px;
  border-radius:999px;background:var(--dsw-alias-border-l2,rgba(127,127,127,.22));
  cursor:ns-resize;transition:width .16s ease,background .16s ease,box-shadow .16s ease}
.da-weight:hover,.da-weight:focus-within{--da-rail-width:30px;background:var(--dsw-alias-bg-layer-2,#fff);
  box-shadow:0 5px 18px rgba(20,40,80,.16),0 0 0 0.5px var(--dsw-alias-border-l2,currentColor)}
/* The track is an svg in the body: a hairline at the bottom that opens into a rounded
   shoulder at the top. It is not a clip-path polygon because a polygon has no rounded
   ends — the corners were what made the wedge read as a cut-out blade rather than a
   part of the panel. preserveAspectRatio="none" stretches one 18x100 shape over the
   rail's height, so the shoulders stay smooth at any length.
   The height is written out rather than expressed as top+bottom: an svg is a replaced
   element: with a viewBox it takes its intrinsic height for its width and ignores the
   bottom offset entirely. The track was therefore a fixed 100px tall while the knob
   travelled the whole 200px rail, which is why the two could never line up. */
.da-weight-svg{position:absolute;left:50%;top:var(--da-track-inset);height:calc(100% - 2 * var(--da-track-inset));
  width:18px;transform:translateX(-50%);opacity:0;pointer-events:none;
  transition:opacity .16s ease}
.da-weight:hover .da-weight-svg,.da-weight:focus-within .da-weight-svg{opacity:1}
/* The knob sits on the value: the only part that shows at rest, so the rail reads as
   a slider waiting to be touched rather than a bare rule. */
/* The blue: a bar of the same width as the groove, its height the one number the
   knob also uses, so its top edge is the knob's centre at every weight. */
.da-weight-fill{position:absolute;left:50%;bottom:var(--da-track-inset);width:5px;
  transform:translateX(-50%);border-radius:999px;background:var(--da-accent,#176df2);
  opacity:0;pointer-events:none;transition:opacity .16s ease}
.da-weight:hover .da-weight-fill,.da-weight:focus-within .da-weight-fill{opacity:1}
.da-weight-knob{position:absolute;left:50%;width:var(--da-knob-size,11px);height:var(--da-knob-size,11px);
  border-radius:50%;transform:translateX(-50%);pointer-events:none;
  background:var(--dsw-alias-bg-layer-2,#fff);
  box-shadow:0 1px 4px rgba(20,40,80,.28),0 0 0 1px var(--dsw-alias-border-l3,currentColor);
  transition:width .16s ease,height .16s ease,background .16s ease}
.da-weight:hover,.da-weight:focus-within{--da-knob-size:15px}
.da-weight:hover .da-weight-knob,.da-weight:focus-within .da-weight-knob{
  background:var(--da-accent,#176df2);
  box-shadow:0 2px 7px rgba(20,40,80,.3)}
/* The browser's own range, rotated upright and made transparent. It spans the rail so
   a press anywhere on it lands on the slider — including on the knob, which is why
   the knob is pointer-transparent.
   Its horizontal extent is the rail's own width, not a fixed 30px. Rotated a quarter
   turn, the input's height is what reaches sideways, so a fixed 30px made an invisible
   fourteen-pixel-wide strip of control stick out past a seven-pixel rail — over the
   paper, in the state a reader draws in, where a press that was meant to start a mark
   moved the stroke weight instead. */
.da-weight-input{position:absolute;left:50%;top:50%;width:200px;height:var(--da-rail-width);margin:0;opacity:0;
  transform:translate(-50%,-50%) rotate(-90deg);cursor:ns-resize;appearance:none;background:transparent}

/* --- the floating bar ---------------------------------------------------- */
/* The same object as the tool palette: a dark rounded strip over the figure, which
   the reader can drag clear of whatever they are looking at. It carries the records
   and the hand-off; the tools have their own strip so either can be parked alone.
   Centred along the bottom until it is moved, which is where a bar belongs. */
.da-bar{position:absolute;z-index:8;left:50%;bottom:12px;transform:translateX(-50%);
  display:flex;align-items:center;gap:2px;flex:0 0 auto;flex-wrap:wrap;
  width:max-content;max-width:calc(100% - 20px);padding:4px 5px;border-radius:16px;
  background:var(--dsw-alias-bg-inverse,#2d2d2d);color:#fff;
  box-shadow:0 8px 26px rgba(10,14,24,.3),0 0 0 1px rgba(255,255,255,.08)}
/* Parked: placed from the top by the reader's drag, so the bottom anchor that keeps
   it centred while untouched must not also apply — with both set it stretches. */
.da-bar[data-parked="true"]{bottom:auto}
/* A bar standing in for the page body's own: it is placed by the pane rather than
   dragged, because there is no page yet to park it over. */
.da-bar[data-static="true"]{bottom:8px}
.da-bar[data-dragging="true"]{opacity:.94;box-shadow:0 12px 32px rgba(10,14,24,.4),0 0 0 1px rgba(255,255,255,.14)}
.da-bar[data-dragging="true"] *{cursor:move !important}
/* The bar's buttons are white glyphs on the dark strip, and every state of them is a
   veil of white: the accent is spent on the marks, not on the panel's chrome. */
.da-bar .da-dock-btn{color:#fff}
.da-bar .da-dock-btn:hover{background:rgba(255,255,255,.14)}
.da-bar .da-dock-btn[aria-pressed="true"]{background:rgba(255,255,255,.22);color:#fff}
.da-bar .da-dock-sep{background:rgba(255,255,255,.22)}
.da-bar .da-dock-dot{background:rgba(255,255,255,.75)}
.da-bar .da-dock-count{background:rgba(255,255,255,.85);color:#2d2d2d}
.da-bar .da-style{width:30px;height:28px;padding:0;border:0;border-radius:50%;background:transparent;color:#fff}
.da-bar .da-style:hover{background:rgba(255,255,255,.14)}
.da-bar .da-palette-grip{color:rgba(255,255,255,.55)}
.da-bar .da-palette-grip:hover{color:#fff;background:rgba(255,255,255,.12)}
.da-bar-tools{display:flex;align-items:center;gap:3px;flex:0 0 auto}
.da-spacer{flex:1 1 auto}
/* A hairline between groups, so the row reads as decisions — which tool, which
   style, which record — instead of a dozen equal buttons. */
.da-sep{flex:0 0 auto;width:1px;height:18px;margin:0 2px;background:var(--dsw-alias-border-l3,currentColor);opacity:.7}

/* Buttons are quiet by default: a bordered chip is a lot of ink for "undo". Only
   the thing that is *chosen* and the thing that *leaves* the panel are filled. */
.da-btn{display:inline-flex;align-items:center;justify-content:center;gap:5px;height:26px;padding:0 9px;white-space:nowrap;border:0.5px solid var(--dsw-alias-border-l2,currentColor);border-radius:9px;background:var(--dsw-alias-bg-base,transparent);color:inherit;font:inherit;font-size:12px;line-height:1;cursor:pointer}
.da-btn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.1))}
.da-btn:disabled{opacity:.4;cursor:default}
.da-btn:disabled:hover{background:var(--dsw-alias-bg-base,transparent)}
.da-btn svg{width:15px;height:15px;flex:0 0 auto;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
/* A quiet button has no frame at all until the pointer is on it: it is an action,
   not a thing, and the row it sits in is already framed. */
.da-btn-quiet{border-color:transparent;background:transparent;height:24px;padding:0 7px;font-size:11px;color:var(--dsw-alias-label-secondary,inherit)}

/* A tool is a tile: a picture of the shape it draws, with its word underneath.
   Six of them fit in one row this way, where six inline words did not — and the
   picture is what a reader who has used the tool once recognizes without reading. */
/* The tile itself is styled once, in the palette block above, because that is the
   only place a tile is ever rendered. A second block here described a 40x34 tile with
   a word under the picture; every one of its declarations lost to the palette's more
   specific selectors, so the panel has been drawing 32x32 circles the whole time and
   this block only ever served to tell a reader the wrong thing. */
.da-tool .da-tool-icon{display:flex;align-items:center;justify-content:center;height:14px}
.da-tool[aria-pressed="true"] .da-tool-label{color:var(--da-accent,currentColor);font-weight:600}
.da-tool[aria-pressed="true"] svg{stroke-width:2.4}
.da-tool:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.08))}
.da-btn-icon{width:30px;padding:0}

/* --- the style popup ---------------------------------------------------- */
/* One button that shows the colour in use; the swatches and the size slider are
   the same controls they were, just not spent on the tool row's whole width. */
.da-stylewrap{position:relative;flex:0 0 auto}
/* The style fold floats above the bar rather than taking a row of it: opened over
   the figure, it costs the picture nothing and lands where the eye already is. */
/* Opens upwards by default, because the bar lives at the bottom. Parked at the top
   there is nothing above it to open into, so the fold turns over and hangs below its
   own button instead — decided by the same measurement the records use. */
.da-style-row[data-side="below"]{bottom:auto;top:calc(100% + 6px);box-shadow:0 -6px 22px rgba(20,40,80,.12),0 6px 22px rgba(20,40,80,.16)}
.da-style-row{position:absolute;left:8px;bottom:calc(100% + 6px);z-index:9;
  display:flex;align-items:center;gap:8px;flex-wrap:wrap;max-width:calc(100% - 16px);
  padding:8px 10px;border:0.5px solid var(--dsw-alias-border-l2,currentColor);border-radius:11px;
  background:var(--dsw-alias-bg-layer-2,#fff);box-shadow:0 6px 22px rgba(20,40,80,.16)}
.da-style{padding:0 8px;background:var(--dsw-alias-bg-base,transparent)}
.da-swatch-dot{width:13px;height:13px;border-radius:50%;border:2px solid var(--dsw-alias-bg-base,transparent);box-shadow:0 0 0 1px var(--dsw-alias-border-l4,rgba(127,127,127,.5));flex:0 0 auto}
.da-style-caret{font-size:9px;line-height:1;color:var(--dsw-alias-label-tertiary,inherit)}
/* The popup floats over the figure rather than pushing the canvas down: opening a
   settings panel must not move the picture being drawn on. */
.da-style-label{font-size:11px;color:var(--dsw-alias-label-tertiary,inherit)}
.da-style-colors{display:flex;gap:8px}
/* Anywhere else is "done here": the panel closes on the click that lands outside it
   rather than trapping the reader in a popup with one way out. */
.da-swatch{width:20px;height:20px;border-radius:50%;corner-shape:round;border:2px solid var(--dsw-alias-bg-base,transparent);box-shadow:0 0 0 1px var(--dsw-alias-border-l4,rgba(127,127,127,.5));cursor:pointer;padding:0}
.da-swatch[aria-pressed="true"]{box-shadow:0 0 0 2px var(--da-accent,currentColor)}
/* --- the figure on its table -------------------------------------------- */
/* A figure is a sheet on a table, not a picture floating in a void: the white paper
   is what gives the panel a middle, and the gap around it is the margin the eye
   needs to see where the drawing stops. */
.da-stage{position:relative;display:flex;align-items:safe center;justify-content:safe center;flex:1 1 auto;overflow:auto;min-height:0;padding:14px;background:var(--dsw-alias-bg-document-preview,transparent)}
.da-surface{position:relative;flex:0 0 auto;margin:0;transform-origin:top left}
/* The paper: the figure plus the margin a mark may have needed. It is deliberately
   left transparent — the white sheet belongs to the figure, so a margin that only
   exists because a mark reached past the edge reads as board round a card rather than
   as more of the figure. The exported picture still gets its white fill: that one is
   looked at by someone who has no board behind it. */
.da-paper{background:transparent}
/* The figure is the sheet: white, rounded, lifted off the panel. This is the element
   that carries the paper look, which is why the margin can be see-through without the
   drawing losing its edge. */
.da-figure-frame{background:var(--dsw-alias-bg-base,#fff);border-radius:4px;overflow:hidden;
  box-shadow:var(--dsw-elevation-prominent,0 1px 3px rgba(0,0,0,.14),0 8px 24px rgba(0,0,0,.08))}
.da-figure{display:block;user-select:none;-webkit-user-drag:none}
/* The table is a thing you can push. The hand only shows under the tools that
   leave a drag free to move the view: under a drawing tool the same drag draws. */
.da-stage[data-hand="true"]{cursor:grab}
/* A drag that has started is a hand closed on the table: the cursor is how the
   reader knows the gesture took, without moving the picture first. Every descendant
   too, and not just the stage, because the overlay covers the figure and would
   otherwise keep saying what it said before the press. */
.da-stage[data-panning="true"],.da-stage[data-panning="true"] *{cursor:grabbing !important}
/* The rendered document takes the figure's place; the overlay above it owns every
   pointer event, which is also what keeps a link inside it from navigating. */
.da-html{display:block;border:0;background:#fff;pointer-events:none}
.da-overlay{position:absolute;touch-action:none}
.da-overlay[data-tool="select"]{cursor:inherit}
.da-overlay:not([data-tool="select"]):not([data-tool="element"]){cursor:crosshair}
.da-overlay[data-tool="element"]{cursor:pointer}
/* The element a click would take, or already names, lit in its own shape rather than
   boxed. A drop shadow follows whatever the element paints — a stroked curve, filled
   glyphs, a patch — so one rule lights every kind of artist the figure can hold. The
   rule itself is written by spotlight.ts and injected from there, because the same
   text has to go into a rendered document's own stylesheet and into the exported
   picture; keeping a second copy here would be a third place for it to drift.
*/
.da-page{font-size:12px;min-width:44px;text-align:center;color:var(--dsw-alias-label-secondary,inherit)}
/* The document's toolbar sits above the page body, so the pane is one column of
   definite height and the body takes what is left of it. */
.da-pdf{position:relative;display:flex;flex-direction:column;height:100%;min-height:0}
.da-pdf>.da-root{flex:1 1 auto;height:auto;min-height:0}
/* A document's toolbar is a row of decisions above the page: paging on the left,
   what the document holds and the hand-off on the right. It is fixed height and
   never scrolls with the page, so the controls keep where the hand left them. */
.da-toolbar{display:flex;align-items:center;gap:6px;flex:0 0 auto;
  padding:6px 10px;border-bottom:0.5px solid var(--dsw-alias-border-l3,currentColor)}

/* The PDF's own strip. It is the same object as the figure's bottom bar — a dark
   rounded card floating over the page — because a reader who has marked a figure
   and then opens a document should not have to learn a second set of controls in
   a second visual language. Everything the page is read with lives on it: where you
   are, how you move, how it flows, and the way out. */
/* Paging is one decision, so its three controls sit closer together than the bar's
   own gap and read as a single reader rather than three buttons. It lives on the
   page body's bar, which the pane owns — not in a strip of its own. */
.da-docbar-group{display:flex;align-items:center;gap:1px;flex:0 0 auto}
/* The page number is the one control the reader reads rather than presses, so it
   gets a fixed slot: a number that shifts the buttons as it goes 9 to 100 is a
   toolbar that moves under the pointer. Not a tinted pill — the inverted strip is
   already the ground, and a second ground inside it reads as a button. */
/* The page number reads as a caption on the dark card, not as a button: no ground of
   its own, no frame, just the digits. It is still pressable — pressing is how the
   reader jumps — but a chip inside a chip is two grounds for one control, and the
   white box read as a hole punched in the bar. */
.da-bar button.da-page{display:inline-flex;align-items:center;justify-content:center;
  min-width:50px;height:28px;padding:0 4px;border:0;border-radius:8px;
  appearance:none;-webkit-appearance:none;
  background:transparent;box-shadow:none;color:#fff;cursor:pointer;
  font:inherit;font-size:12.5px;font-variant-numeric:tabular-nums}
.da-bar button.da-page:hover{background:rgba(255,255,255,.14)}
.da-bar button.da-page:focus-visible{outline:2px solid var(--da-accent,#176df2);outline-offset:1px}

.da-bar .da-dock-sep{background:rgba(255,255,255,.22)}
.da-bar .da-ico{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:1.9;
  stroke-linecap:round;stroke-linejoin:round}
/* What the document holds, said quietly: the strip's subject is the page, and the
   count is a caption on it rather than another control. */
.da-bar .da-docbar-count{flex:0 0 auto;margin-left:6px;font-size:11.5px;
  color:rgba(255,255,255,.62);font-variant-numeric:tabular-nums;white-space:nowrap}
/* The hand-off's note, only shown when there is nothing to hand over. */
.da-bar .da-docbar-note{flex:0 0 auto;margin-right:2px;font-size:11.5px;color:rgba(255,255,255,.5)}
/* The page number is the one control the reader reads rather than presses, so it
   gets a fixed slot: a number that shifts the buttons as it goes 9 → 10 → 100 is a
   toolbar that moves under the pointer. */
/* The hand-off sits under the page it describes, right-aligned and on its own
   ground, so it is not reachable by a stray press on the page controls. */
.da-send{display:flex;align-items:center;justify-content:flex-end;gap:6px;flex:0 0 auto;
  padding:6px 10px;border-top:0.5px solid var(--dsw-alias-border-l3,currentColor)}
/* The page a reader types into, to jump. Sized to the widest page count a document
   can plausibly have, so the slot does not resize as the number grows. */
.da-page-input{width:52px;height:28px;padding:0 6px;border:0.5px solid rgba(255,255,255,.35);
  border-radius:8px;background:rgba(255,255,255,.12);color:#fff;
  font:inherit;font-size:12.5px;line-height:1;text-align:center;font-variant-numeric:tabular-nums}
.da-page-input:focus{outline:none;border-color:var(--da-accent,#176df2);background:rgba(255,255,255,.18)}
/* The page number's own denominator: smaller and quieter than the number it follows. */
.da-page-total{font-size:12px;color:var(--dsw-alias-label-tertiary,inherit);white-space:nowrap}
/* The page slot before the first raster. It takes the column the body's stage
   takes, so the frame around it — the toolbar above all — is in place from the
   first paint and does not move when the page arrives. */
.da-placeholder{flex:1 1 auto;min-height:0;background:var(--dsw-alias-bg-document-preview,transparent)}
/* The page-number box and its denominator, held together so the box cannot drift
   away from the count it is a fraction of. */
.da-page-field{display:flex;align-items:center;gap:3px}
/* The hand-off's own note, quiet enough to read as a state rather than a control. */
.da-send-note{font-size:12px;color:var(--dsw-alias-label-tertiary,inherit);margin-right:2px}
/* --- the two cards under the figure ------------------------------------- */
/* --- the dock ------------------------------------------------------------ */
/* The dock's buttons are quiet circles in the bar: they are the actions that are
   not tools, and the one that is chosen is only a shade darker than its neighbours. */
.da-dock-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;
  width:28px;height:28px;padding:0;border:0;border-radius:50%;background:transparent;
  color:inherit;cursor:pointer;flex:0 0 auto}
.da-dock-btn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12))}
.da-dock-btn[aria-pressed="true"]{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.16));color:inherit}
.da-dock-btn svg{width:15px;height:15px}
.da-dock-btn:disabled{opacity:.4;cursor:default}
.da-dock-btn:disabled:hover{background:transparent}
/* The one filled control in the panel is the way out of it. */
/* A dot, not a count: "there is a goal written" is all the bar needs to say about
   a field it is not a list of. */
.da-dock-dot{position:absolute;top:3px;right:4px;width:5px;height:5px;border-radius:50%;
  background:var(--dsw-alias-label-tertiary,currentColor)}
.da-dock-sep{width:1px;height:16px;margin:0 3px;background:var(--dsw-alias-border-l3,currentColor);opacity:.6;flex:0 0 auto}
/* The count rides on the list's own button: it is the one thing about the list a
   reader wants without opening it. */
/* Two digits made this 20px wide over a 15px glyph, covering a third of the picture a
   reader uses to recognise the button. It now sits off the glyph's corner rather than
   on it, and a count that grows past two digits is capped rather than allowed to eat
   the icon: the number on the bar is a reminder, the list itself is one click away. */
.da-dock-count{position:absolute;top:-4px;right:-6px;min-width:14px;height:14px;padding:0 3px;
  border-radius:7px;background:var(--dsw-alias-border-l4,#c9ced8);color:var(--dsw-alias-label-primary,#2d2d2d);
  font-size:9px;font-weight:700;line-height:14px;text-align:center;font-variant-numeric:tabular-nums}

/* --- the floating records ------------------------------------------------ */
/* A record is a card over the figure, opened from the dock and closed on its own
   button. It is anchored to the pill it came from so it reads as that pill's
   contents rather than as a panel that happened to appear. */
.da-float{position:absolute;z-index:9;display:flex;flex-direction:column;gap:7px;padding:10px 11px;
  border:0.5px solid var(--dsw-alias-border-l2,currentColor);border-radius:12px;
  background:var(--dsw-alias-bg-layer-2,#fff);box-shadow:0 6px 22px rgba(20,40,80,.14),0 0 0 1px rgba(20,40,80,.03)}
.da-card-title{display:flex;align-items:center;gap:5px;min-width:0;font-size:12px;font-weight:650;
  color:var(--dsw-alias-label-primary,inherit)}
.da-card-title svg{width:14px;height:14px;flex:0 0 auto;color:var(--da-accent,#176df2)}

.da-float-head{display:flex;align-items:center;gap:7px}
.da-float-head .da-card-title{flex:1 1 auto;min-width:0}
/* The records hang off the bar rather than off the panel, so dragging the bar takes
   them with it. Both offsets are written inline — one real, one auto — because a
   card that opens upwards and one that opens downwards differ in which side is
   fixed, and a card with no height of its own stretches if both are set. */
.da-float-record{width:min(330px,calc(100% - 22px))}
.da-float-list{max-height:min(58%,400px)}
.da-float-list .da-marks{overflow:auto;min-height:0}
/* The detail field is placed by arithmetic, not by the stylesheet: its left and top
   come from the mark it belongs to. It is a pill rather than a card — no head, no
   border between the field and the panel — so writing about a mark costs one line
   over the figure instead of a box that covers it. */
.da-float-detail{width:300px;max-width:calc(100% - 16px);gap:0;padding:4px;border-radius:22px;
  flex-direction:row;align-items:flex-end;
  box-shadow:0 8px 26px rgba(20,40,80,.2),0 0 0 1px rgba(20,40,80,.04)}
.da-float .da-comment{flex:1 1 auto;min-width:0;box-sizing:border-box;border:0;background:transparent;
  color:inherit;font:inherit;font-size:13px;line-height:1.55;padding:7px 10px;resize:none;
  /* One line until the sentence needs more, then as many as it takes: the pill is a
     place to type, and a sentence read through a slot two lines tall is a sentence
     the reader has to scroll to finish. The rule for the record cards' textareas sets
     a 74px floor, hence the explicit reset. The scrollbar is hidden because it is not
     a scroll view — wheel and keys still work once the sentence outgrows the pane. */
  min-height:0;height:auto;max-height:min(180px,42vh);overflow-y:auto;outline:none;
  field-sizing:content;scrollbar-width:none}
.da-float .da-comment::-webkit-scrollbar{width:0;height:0}
.da-float .da-comment::placeholder{color:var(--dsw-alias-label-tertiary,currentColor);opacity:.85}
/* The hand-off appears only once the field says something: an empty pill is a
   place to type, not a decision to make. */
.da-comment-send{display:flex;align-items:center;gap:4px;flex:0 0 auto;padding-bottom:3px;padding-right:3px}
.da-comment-send-btn{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;
  border:0;border-radius:50%;background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12));
  color:var(--dsw-alias-label-secondary,currentColor);cursor:pointer;padding:0}
.da-comment-send-btn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.2));
  color:var(--dsw-alias-label-primary,currentColor)}
.da-comment-send-btn:disabled{opacity:.45;cursor:default}
.da-comment-send-btn svg{width:15px;height:15px}
/* Both ways out of the pill are the same neutral chip. Which hand-off is "primary"
   is the reader's judgement at the moment of sending, not something the panel gets to
   pre-decide by painting one of them blue; the class stays on the send-to-agent button
   as the hook the tests and the callers select it by. */
.da-float textarea{width:100%;box-sizing:border-box;min-height:74px;max-height:200px;resize:vertical;border:0.5px solid var(--dsw-alias-border-l3,currentColor);border-radius:9px;background:var(--dsw-alias-bg-layer-2,transparent);color:inherit;font:inherit;font-size:12px;padding:8px 10px;line-height:1.65}
.da-float textarea:focus{outline:none;border-color:var(--da-accent,#176df2)}
.da-btn-count{display:inline-flex;align-items:center;justify-content:center;min-width:16px;height:16px;
  padding:0 4px;border-radius:8px;background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.14));
  font-size:10px;font-weight:600;font-variant-numeric:tabular-nums}

/* A field is a labelled well: the input, and the counter that says how much room is
   left, pinned to its bottom right. */
.da-field{display:flex;flex-direction:column;gap:3px;position:relative;min-width:0}
.da-count{align-self:flex-end;font-size:10px;font-variant-numeric:tabular-nums;
  color:var(--da-quiet,var(--dsw-alias-label-tertiary,currentColor))}
/* What the selected mark is, in one word: the detail field is disabled until there
   is something to describe, and this says what it would describe. */
.da-chip{display:inline-flex;align-items:center;height:16px;padding:0 6px;border-radius:5px;
  background:var(--da-accent-soft,rgba(23,109,242,.12));
  color:var(--da-accent,#176df2);font-size:10px;font-weight:600}
/* The "?" beside a card's name: the long form of what that field is for. */
.da-hintdot{display:inline-flex;align-items:center;justify-content:center;width:13px;height:13px;
  border-radius:50%;border:0.5px solid var(--dsw-alias-border-l3,currentColor);
  font-size:9px;font-weight:700;color:var(--dsw-alias-label-tertiary,currentColor);
  cursor:help;flex:0 0 auto}
/* Each row of the list is a card of its own: the number in the mark's colour, the
   sentence as the thing you press, and the sentence's own shape and anchor under it
   in smaller type. A borderless run of text would read as one paragraph of marks. */
.da-marks{display:flex;flex-direction:column;gap:3px;min-height:0}
.da-mark{display:flex;align-items:center;gap:9px;padding:5px 4px;border-radius:7px;
  border:0.5px solid transparent;min-width:0}
.da-mark:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.08))}
.da-mark[data-selected="true"]{border-color:var(--da-accent,#176df2);
  background:var(--dsw-alias-interactive-bg-hover,rgba(23,109,242,.06))}
/* Two light strokes in the mark's colour, not a block of fill.
   A filled chip on every row is a wall of colour beside a figure that is mostly
   paper; the list should read as a list. The shape leads the row, flush with its
   left edge, and the number is pinned to the shape's bottom-right corner at 8px —
   a footnote on the thing it counts rather than a column of digits the eye reads
   as row numbers before it reads the sentences. */
.da-mark-glyph{position:relative;flex:0 0 auto;display:inline-flex;align-items:center;
  justify-content:center;width:14px;height:14px}
.da-mark-glyph svg{width:12px;height:12px;fill:none;stroke:currentColor;
  stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
/* No halo behind the digit: it sits just outside the glyph's ink, in the row's own
   gutter, so it never crosses a stroke it would have to be painted over. */
.da-mark-num{position:absolute;right:-5px;bottom:-3px;font-size:8px;font-weight:600;
  font-variant-numeric:tabular-nums;line-height:1;letter-spacing:-.1px;
  color:var(--dsw-alias-label-secondary,currentColor)}
.da-mark-text{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:1px;
  padding:0;border:0;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}
.da-mark-title{display:block;font-size:12px;line-height:1.35;overflow:hidden;
  text-overflow:ellipsis;white-space:nowrap}
.da-mark-meta{display:block;font-size:10px;line-height:1.35;
  color:var(--da-quiet,var(--dsw-alias-label-tertiary,currentColor));overflow:hidden;
  text-overflow:ellipsis;white-space:nowrap}
/* The page number sits at the row's end rather than under its sentence: it is not
   part of what the mark says, it is where the mark is, and a list puts that where a
   table of contents puts it.
   Its size is the number's, not a step below it. Two sizes in one row — 11px on the
   left, 10px on the right — read as two different kinds of fact, and the page was
   the one that looked like it had been shrunk to fit. Weight is what demotes a fact
   here, not size: 500 against the number's 600, and the tertiary colour. */
.da-mark-page{flex:0 0 auto;font-size:10px;font-weight:400;line-height:1.35;
  white-space:nowrap;color:var(--da-quiet,var(--dsw-alias-label-tertiary,currentColor));
  font-variant-numeric:tabular-nums}
/* A glyph rather than the word 删除: the row is a card, and a word in the corner of
   a card reads as another thing to press rather than as the way to get rid of it. */
.da-mark-del{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;
  width:20px;height:20px;padding:0;border:0;border-radius:6px;background:transparent;
  color:var(--dsw-alias-label-tertiary,currentColor);font:inherit;font-size:11px;line-height:1;
  cursor:pointer;opacity:0}
.da-mark:hover .da-mark-del,.da-mark[data-selected="true"] .da-mark-del{opacity:1}
.da-mark-del:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.14));color:inherit}
.da-mark-del:focus-visible{opacity:1}

/* The empty list is a picture and two lines: a card of grey text reads as broken,
   and "nothing yet" is a state, not an error. */
.da-empty{display:flex;flex-direction:column;align-items:center;gap:5px;padding:18px 10px 14px;text-align:center}
.da-empty-ico{width:46px;height:46px;fill:none;stroke:var(--dsw-alias-border-l4,currentColor);stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round;opacity:.85}
.da-empty-title{font-size:12px;font-weight:650;color:var(--dsw-alias-label-secondary,inherit)}
.da-empty-hint{font-size:11px;line-height:1.6;color:var(--da-quiet,var(--dsw-alias-label-tertiary,inherit));max-width:190px}
/* The figure's context menu. Laid out at a fixed width because the placement
   maths needs one number; rows are the height that maths assumes. */
.da-menu{position:fixed;z-index:40;display:flex;flex-direction:column;gap:1px;width:208px;
  box-sizing:border-box;
  padding:4px;border-radius:10px;background:var(--dsw-alias-bg-layer-2,#fff);
  box-shadow:0 8px 24px rgba(15,17,21,.16),0 0 0 1px var(--dsw-alias-border-l2,rgba(0,0,0,.1))}
.da-menu-item{display:flex;align-items:center;height:27px;padding:0 8px;border:0;border-radius:6px;
  background:transparent;color:var(--dsw-alias-label-primary,inherit);font:inherit;font-size:12.5px;
  text-align:left;cursor:pointer;white-space:nowrap}
.da-menu-item:hover,.da-menu-item:focus-visible{background:var(--da-accent-soft,rgba(23,109,242,.14));outline:none}

.da-status{flex:0 0 auto;padding:6px 10px;font-size:12px;color:var(--dsw-alias-label-secondary,inherit)}
.da-status[data-tone="error"]{color:var(--dsw-alias-label-error,var(--dsw-alias-state-error-primary,currentColor))}
.da-status[data-tone="ok"]{color:var(--dsw-alias-state-success-primary,currentColor)}
.da-hint{padding:10px 2px;font-size:12px;line-height:1.6;color:var(--da-quiet,var(--dsw-alias-label-tertiary,inherit))}
/* The grey above is for "still working". A failure is not quieter than a wait. */
.da-hint[data-tone="error"]{color:var(--dsw-alias-label-error,var(--dsw-alias-state-error-primary,currentColor))}

/* --- the Markdown body: an editor over the source, or the diff it produced --- */
.da-md{display:flex;flex-direction:column;height:100%;min-height:0}
.da-md-stats{flex:0 0 auto;font-size:12px;white-space:nowrap;color:var(--dsw-alias-label-secondary,inherit)}
/* The editor pane: the textarea, and the gutter that only exists while the
   document toolbar's wrap preference is off (a wrapped line has no one row). */
.da-md-pane{flex:1 1 auto;display:flex;min-height:0;background:var(--dsw-alias-bg-base,transparent)}
.da-md-gutter{flex:0 0 auto;overflow:hidden;padding:8px 6px 8px 10px;text-align:right;color:var(--da-quiet,var(--dsw-alias-label-tertiary,inherit));font-size:12px;line-height:1.6;font-family:var(--dsw-font-family-mono,ui-monospace,SFMono-Regular,Menlo,monospace);user-select:none}
.da-md-editor{flex:1 1 auto;min-height:0;width:100%;padding:8px 10px;border:none;outline:none;resize:none;background:var(--dsw-alias-bg-base,transparent);color:inherit;font-size:12px;line-height:1.6;tab-size:2;font-family:var(--dsw-font-family-mono,ui-monospace,SFMono-Regular,Menlo,monospace)}
/* The one field a reader types a document edit into, and the one surface whose text
   becomes a diff an agent applies. It draws no border of its own to recolour the way
   the note fields do, so the cue is a ring on the inside edge: drawn outside it would
   be clipped by the pane, and drawn as a background tint it would be lost against the
   pane's own background. */
.da-md-editor:focus-visible{outline:2px solid var(--da-accent,#176df2);outline-offset:-2px}
.da-diff{flex:1 1 auto;min-height:0;overflow:auto;padding:4px 0;font-size:12px;line-height:1.6;font-family:var(--dsw-font-family-mono,ui-monospace,SFMono-Regular,Menlo,monospace)}
.da-diff-head{padding:2px 8px;color:var(--dsw-alias-label-tertiary,inherit);background:var(--dsw-alias-bg-layer-2,transparent)}
.da-diff-line{display:flex;gap:6px;padding:0 8px}
.da-diff-no{flex:0 0 auto;min-width:32px;text-align:right;color:var(--dsw-alias-label-tertiary,inherit);user-select:none}
.da-diff-sign{flex:0 0 auto;width:8px}
.da-diff-text{flex:1 1 auto;white-space:pre-wrap;word-break:break-word}
.da-diff-line[data-kind="add"] .da-diff-sign{color:var(--dsw-alias-state-success-primary,currentColor)}
.da-diff-line[data-kind="remove"] .da-diff-sign{color:var(--dsw-alias-state-error-primary,currentColor)}
/* One note field per hunk: the reader's explanation of that change. */
.da-diff-note{display:flex;align-items:center;gap:6px;padding:2px 8px 8px 8px;color:var(--dsw-alias-label-tertiary,inherit);font-size:12px}
.da-diff-note-label{flex:0 0 auto;white-space:nowrap}
.da-diff-note input{flex:1 1 auto;min-width:0;border:0.5px solid var(--dsw-alias-border-l2,currentColor);border-radius:var(--dsw-radius-sm,6px);background:var(--dsw-alias-bg-base,transparent);color:inherit;font:inherit;font-size:12px;padding:3px 6px}
`

/**
 * Inject the stylesheet once per document.
 * @param doc - document to inject into.
 */
export function ensureStyles(doc: Document): void {
  if (doc.querySelector(`style[${STYLE_MARKER}]`) !== null) return
  const element = doc.createElement('style')
  element.setAttribute(STYLE_MARKER, '')
  element.textContent = STYLES
  doc.head.appendChild(element)
}
