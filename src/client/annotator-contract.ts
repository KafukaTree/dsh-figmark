/**
 * The props and seats contract between any annotator body and its slot owner.
 *
 * Every renderer (image, paged PDF, future kinds) receives the same composed
 * props; extracting them here keeps the contract out of the component that
 * implements one of them, so a fat props interface has one home.
 * @module dsh-figmark/client/annotator-contract
 */
import type { ReactNode } from 'react'
import type { AnnotationMark } from '../shared/annotation'
import type { ComposerLike } from './composer'
import type { RemoteLike } from './host-actions'
import { fallbackTranslate } from './locales'
import type { SessionsLike } from './session'

/** Bytes-or-nothing content the document owner delivers. */
export interface BodyContent {
  /** Kind of content the owner produced. */
  readonly kind: string
  /** Complete file bytes, for a `bytes-complete` renderer. */
  readonly data?: Uint8Array<ArrayBuffer>
}

/** Values interpolated into one copy string. */
export type TranslateVars = Record<string, number | string>

/** The translator seat: a copy key and its interpolation values. */
export type Translate = (key: string, vars?: TranslateVars) => string

/** The props any annotator body receives from its slot's inject factory. */
export interface AnnotatorInjected {
  /** Injected session delivery face. */
  readonly sessions: SessionsLike | undefined
  /** Injected composer face, for handing an annotation over without sending it. */
  readonly conversation: ComposerLike | undefined
  /** Session this body belongs to, passed by the inject factory. */
  readonly sessionId: string
  /** Injected locale id used by the local fallback dictionary. */
  readonly localeId: string
  /**
   * Injected Host gesture carrier, for the figure's context menu.
   *
   * Optional because a composition may have no `remote` service at all — the menu
   * then keeps only the rows that need nothing from the Host.
   */
  readonly remote: RemoteLike | undefined
}

/**
 * The page a paged renderer put on screen, as this body annotates it.
 *
 * The body annotates this raster instead of the file's own bytes: the renderer
 * that owns the document decides which page is on screen and at what resolution,
 * and keeps the other pages' edits while this one is mounted. Marks are recorded
 * in page units, so they mean the same thing at any zoom or pane width — and a
 * body with a page is one page of a document, not the document itself, so it
 * neither reads nor writes the sidecar: its owner does, once, for the whole file.
 */
export interface PageSurface {
  /** PNG data URL of the page. */
  readonly dataUrl: string
  /** Page width in page units. */
  readonly width: number
  /** Page height in page units. */
  readonly height: number
}

/** Unsaved edits of one surface, as an owner that unmounts surfaces keeps them. */
export interface SurfaceDraft {
  /** Marks drawn so far. */
  readonly marks: readonly AnnotationMark[]
}

/** Everything the body reads; all of it arrives through the composed props. */
export interface AnnotatorBodyProps {
  /** Document content: complete bytes for a `bytes-complete` renderer. */
  readonly content?: BodyContent | undefined
  /** The page a paged renderer put on screen, when this body annotates one page. */
  readonly page?: PageSurface | undefined
  /**
   * Whether this body shows the tools and the bar.
   *
   * A paged renderer may mount several page bodies at once — a continuous column
   * shows every page — and only the page being read should carry the tools: a
   * column where each page had its own floating bar would be a wall of chrome with
   * one page's worth of figure under it. Defaults to true, so a body mounted alone
   * is unchanged.
   */
  readonly chrome?: boolean | undefined
  /**
   * The element this body's floating chrome should render into.
   *
   * A paged owner draws one pane and several page bodies, and a bar mounted inside
   * a page is a bar that scrolls with that page: the reader scrolls to page 12 and
   * the tools go with it, and in a column of pages every page has its own copy at
   * its own place. Handing the body a node of the owner's own means the chrome
   * lives in the pane rather than in a page, which is where a control that answers
   * "what am I drawing with" belongs.
   */
  readonly chromeHost?: HTMLElement | null | undefined
  /**
   * Paging, drawn by the owner of a paged document, for the bar to place.
   *
   * The owner keeps the page number, the box it becomes and the flow switch; the
   * body only knows where the bar is. Passing the controls already drawn is what
   * keeps paging the document's business without the body learning its state.
   */
  readonly pagingSlot?: ReactNode
  /**
   * How much the document this page belongs to is magnified.
   *
   * A file's pages are one picture in several sheets, so the factor belongs to the
   * file: a page body that kept its own would drop the magnification the moment the
   * reader turned a page, and every page would have to be zoomed again. Passed in,
   * the reader's pinch reaches every sheet.
   */
  readonly zoom?: number | 'fit' | undefined
  /**
   * Which card is open under the bar, when the owner keeps that choice.
   *
   * In a column the chrome moves from page to page as the reader scrolls, so a
   * card whose open state lived in the page body would shut every time the
   * page under the reader changed — a list that closes itself while being read.
   * Kept by the document, it stays open for the whole document.
   */
  readonly openPanel?: 'style' | 'goal' | 'list' | null | undefined
  /** Reports the card the reader opened or closed, when the owner keeps it. */
  readonly onOpenPanelChange?: ((panel: 'style' | 'goal' | 'list' | null) => void) | undefined
  /**
   * The selected mark, when the owner keeps the selection.
   *
   * Same reason as {@link openPanel}: the selection is one thing in the reader's
   * head, and a column that forgot it on every scroll would put the comment pill
   * away the moment the page shifted.
   */
  readonly selectedId?: string | null | undefined
  /** Reports a new selection, when the owner keeps it. */
  readonly onSelectedIdChange?: ((id: string | null) => void) | undefined
  /**
   * The width to draw this page's paper at, when the owner knows it.
   *
   * A page body otherwise fits itself to the box it finds, and in a column every
   * page finds that box a different moment: one measured before layout settles gets
   * nothing, falls back to its own pixel size, and the document comes out with page
   * 8 narrower than page 9. An owner that already knows the column's width says so,
   * and every sheet is drawn at the one width.
   */
  readonly fitWidth?: number | undefined
  /**
   * Every mark the document holds, when this body is one page of it.
   *
   * The list is the map of what the reader is about to send, and what they send is
   * the whole document: a list that showed only the page in view would read as "one
   * mark" on a file carrying seven, and the reader would be checking a map of a
   * different document than the one being delivered.
   */
  readonly documentMarks?: readonly AnnotationMark[] | undefined
  /** Removes a mark by id, including one drawn on another page of the document. */
  readonly onDocumentRemove?: ((id: string) => void) | undefined
  /**
   * Turns to the page a mark is on, when this body is one page of a document.
   *
   * The list a reader checks their work against is the document's, so a row in it
   * may name a mark two pages away. Pressing that row has to show the sentence
   * beside its mark instead of leaving the reader to count pages — and it must
   * select the mark too, or the pill would appear with nothing to put in it.
   */
  readonly onRevealMark?: ((mark: AnnotationMark) => void) | undefined
  /** Called with the factor the reader asked for, so the owner can keep it. */
  readonly onZoom?: ((zoom: number | 'fit') => void) | undefined
  /**
   * Hand this body's marks to someone else.
   *
   * A page body has no seat of its own — the document that owns the pages is the
   * one that saves and delivers — so the offer travels up as a callback. It draws
   * the two rows on its own bar unless its owner has taken the bar over.
   */
  readonly onSend?: ((target: 'agent' | 'composer') => void) | undefined
  /** Marks this surface had before it mounted; a saved document still wins over them. */
  readonly draft?: SurfaceDraft | undefined
  /** Reports every edit, so an owner that unmounts surfaces loses no unsaved work. */
  readonly onDraftChange?: ((draft: SurfaceDraft) => void) | undefined
  /** Overall note, when an owner keeps it for the whole document. */
  readonly summary?: string | undefined
  /** Reports every change of the overall note. */
  readonly onSummaryChange?: ((summary: string) => void) | undefined
  /** Viewing or annotating, when an owner keeps the choice across its surfaces. */
  readonly mode?: 'view' | 'annotate' | undefined
  /** Reports every change of that choice. */
  readonly onModeChange?: ((mode: 'view' | 'annotate') => void) | undefined
  /** The tab's `dsh-resource://file/…` address. */
  readonly resourceAddress?: string | undefined
  /**
   * Each mark's number in the whole document, for a body that shows one page of it.
   *
   * The list the reader and the agent read numbers marks across the document, so a
   * page's marks have to start where the document says they start rather than at 1.
   */
  readonly numbering?: ReadonlyMap<string, number> | undefined
  /** Owner callback that registers the body's scrollport. */
  readonly scrollportRef?: ((element: HTMLElement | null) => void) | undefined
  /** Locale seat bound by the shell when the namespace is registered. */
  readonly t?: Translate | undefined
  /** Injected session delivery face. */
  readonly sessions?: SessionsLike | undefined
  /** Injected composer face, for handing an annotation over without sending it. */
  readonly conversation?: ComposerLike | undefined
  /** Session this body belongs to, passed by the inject factory. */
  readonly sessionId?: string | undefined
  /** Injected locale id used by the local fallback dictionary. */
  readonly localeId?: string | undefined
  /** Injected Host gesture carrier, for the figure's context menu. */
  readonly remote?: RemoteLike | undefined
}

/**
 * Resolve one copy key against the injected seat, falling back to the local
 * dictionary. The two-step fallback (`t` then `localeId`) is identical for
 * every body, so it lives here rather than at each call site.
 * @param props - the composed props a body receives.
 * @param key - copy key.
 * @param vars - values interpolated into `{name}` placeholders.
 * @returns the localized string.
 */
export function resolveTranslate(props: { readonly t?: Translate | undefined; readonly localeId?: string | undefined }, key: string, vars?: TranslateVars): string {
  return props.t?.(key, vars) ?? fallbackTranslate(props.localeId ?? 'zh', key, vars)
}
