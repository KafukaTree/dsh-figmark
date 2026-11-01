/**
 * Browser half of the annotator.
 *
 * It registers one document renderer per previewable kind — images, PDFs, and
 * static HTML — so opening either in the right Sidebar offers the matching
 * body, and registers each body in the keyed document slot. The PDF body lives
 * in a package-local chunk that is fetched only when a PDF opens.
 * Everything else — reading the figure bytes, storing marks, reaching the agent —
 * happens inside a body through the owner and the injected session service.
 *
 * All three services are hard requirements: without the preview registry there is
 * nothing to open, without the slot registry nowhere to render, and without the
 * locale registry no copy to render with. A composition missing any of them gets a
 * loud failure rather than a silently half-mounted plugin.
 * @module dsh-figmark/client
 */
import type { Context } from '@deepseek-ai/cordis'
import { AnnotatorBody } from './AnnotatorBody'
import { AnnotationCard } from './annotation-card'
import { RULE_ID, annotationRule } from './annotation-rule'
import { AUTOSAVE_DELAY_MS, annotationSignature, createAutosave } from './autosave'
import { fileAddress } from '../shared/address'
import { markOrdinals } from '../shared/annotation'
import { figureUnit } from './scale'
import type { AnnotatorInjected } from './AnnotatorBody'
import type { RemoteLike } from './host-actions'
import type { ComposerLike } from './composer'
import { createDocumentSeat } from './document-seat'
import { LazyPdfBody } from './LazyPdfBody'
import { HtmlPreviewBody } from './html-preview'
import { NAMESPACE, en, zh } from './locales'
import { loopbackAddressOf } from './live-page'
import { missingService } from '../missing-service'
import type { PdfBodyInjected } from './pdf/PdfBody'
import { PendingCard } from './pending-card'
import { ServiceBrowser, type ServiceBrowserInjected } from './ServiceBrowser'
import { ServiceGuideIcon } from './service-guide-icon'
import type { SessionsLike } from './session'

/** Plugin name reported to the client module loader. */
export const name = 'dsh-figmark-client'

/** Client services this plugin waits for before it mounts anything. */
export const inject = ['slots', 'locale', 'documentPreviews', 'sidebarRightTabs']

/** Implementation identity of the image renderer, shared by its metadata and its slot entry. */
export const BODY_ID = 'dsh-figmark/image'

/** Implementation identity of the PDF renderer, shared by its metadata and its slot entry. */
export const PDF_BODY_ID = 'dsh-figmark/pdf'

/** Implementation identity of the read-only static HTML preview. */
export const HTML_BODY_ID = 'dsh-figmark/html-preview'

/** Identity of the right-sidebar service browser. */
export const SERVICE_BODY_ID = 'dsh-figmark/services'

/** Page kind the service browser occupies. */
export const SERVICE_KIND = 'dsh-figmark-services'

/** Suffixes the annotator claims for whole-file figures, matching the shell's builtin image renderer. */
const EXTENSIONS = ['svg', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico'] as const

/** Suffixes whose bytes are not readable as text. */
const BINARY_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico'] as const

/** Suffix the PDF renderer claims, ranking above the shell's read-only PDF preview. */
const PDF_EXTENSIONS = ['pdf'] as const

/** Suffixes the preview-only renderer keeps readable inside the panel. */
const HTML_EXTENSIONS = ['html', 'htm'] as const

/** Document renderer registry slice this plugin registers into. */
interface DocumentPreviewsLike {
  register(definition: {
    id: string
    extensions: readonly string[]
    binaryExtensions?: readonly string[]
    priority?: 'builtin' | 'extension'
    title: () => string
    loading: 'text-pages' | 'bytes-complete' | 'renderer'
    wrap?: boolean
  }): () => void
}

/** Sidebar tab-type registry, as far as this plugin needs it. */
interface SidebarRightTabsLike {
  register(definition: {
    id: string
    kind: string
    priority?: 'builtin' | 'extension' | 'fallback'
    title: (address: string) => string
    guide?: readonly {
      id: string
      order?: number
      title: () => string
      description?: () => string
      icon?: unknown
    }[]
  }): () => void
}

/** Slot registry slice this plugin registers into. */
interface SlotsLike {
  inject(key: string, callback: () => () => void): () => void
  register(options: Record<string, unknown>, component: unknown): () => void
}

/** Locale registry slice this plugin registers into. */
interface LocaleLike {
  register(namespace: string, dictionaries: Record<string, Record<string, string>>): () => void
  bind(namespace: string): (key: string) => string
  getLocale(): { readonly locale?: string }
}

/** The keyed slot the transcript dispatches one text block to. */
const USER_TEXT_SLOT = 'conversation.user.text.node'

/** The full-width dock the composer draws above its own card. */
const PENDING_SLOT = 'conversation.input.dock'

/** The conversation service, as far as a card needs it. */
interface UiConversationLike {
  readonly userText: { register(rule: typeof annotationRule): () => void }
}

/** What the input dock injects. */
interface PendingInjected {
  readonly sessionId: string
  readonly localeId: string
}

/** The Sidebar's navigation controller, as far as a card needs it. */
interface SidebarRightLike {
  openResource(address: string): void
  /**
   * Open a registered page type, such as the local-pages browser.
   *
   * Optional because a host may expose only resource navigation; a live-page card
   * then stays inert rather than trying to turn its URL into a file address.
   */
  openTab?(kind: string, options?: {
    readonly params?: { readonly url?: string } | undefined
    readonly revealIfOpened?: boolean | undefined
  }): void
}

/** What the keyed card slot injects. */
interface CardInjected {
  readonly sessionId: string
  readonly localeId: string
  readonly open: (path: string, html: boolean) => boolean
  readonly canOpen: (path: string, html: boolean) => boolean
}

/**
 * Whether this card names a loopback page opened by the live service browser.
 * @param path - the subject printed by the annotation message.
 * @param html - whether the message is the live/HTML form.
 * @returns true only for a loopback URL from an HTML annotation.
 */
function isLivePage(path: string, html: boolean): boolean {
  return html && loopbackAddressOf(path) !== undefined
}

/**
 * Whether the Sidebar can open this annotation subject.
 * @param ctx - the plugin's client context.
 * @param sessionId - Session the bubble belongs to.
 * @param path - the figure's path or page URL.
 * @param html - whether the message is the live/HTML form.
 * @returns true when a matching Sidebar entry point exists.
 */
function canOpenFigure(ctx: Context, sessionId: string, path: string, html: boolean): boolean {
  if (sessionId === '' || path === '') return false
  const sidebar = ctx.get('sidebarRight') as SidebarRightLike | undefined
  if (sidebar === undefined) return false
  return !isLivePage(path, html) || sidebar.openTab !== undefined
}

/**
 * Open one figure in the Sidebar, where its annotation already lives.
 *
 * Nothing here can fail the bubble: the card is a shortcut to a tab, and a
 * composition without a Sidebar (or one whose column cannot take this address)
 * leaves the message exactly as readable as it was.
 * @param ctx - the plugin's client context.
 * @param sessionId - Session the bubble belongs to.
 * @param path - the figure's path, as the message spells it.
 * @param html - whether the message is the live/HTML form.
 * @returns whether the Sidebar accepted the navigation.
 */
function openFigure(ctx: Context, sessionId: string, path: string, html: boolean): boolean {
  const sidebar = ctx.get('sidebarRight') as SidebarRightLike | undefined
  if (!canOpenFigure(ctx, sessionId, path, html) || sidebar === undefined) return false
  try {
    // A live page is a service, not a file. Opening its URL as a file resource is
    // guaranteed to fail because that scheme names a path resolved by the Session;
    // the service browser owns the page's tab and its in-memory draft.
    if (isLivePage(path, html)) {
      // canOpenFigure proved the method exists; the assertion keeps the branch local.
      sidebar.openTab?.(SERVICE_KIND, {
        params: { url: path },
        revealIfOpened: true,
      })
      return true
    }
    sidebar.openResource(fileAddress(sessionId, path))
    return true
  } catch (reason) {
    // The column has no mounted Session to place a tab in, which is a composition
    // fact rather than a fault of this message.
    console.warn('[figmark] cannot open the annotated figure', reason)
    return false
  }
}

/** What the keyed body slot injects, typed so no `any` crosses the hand-off. */
type BodyInjected = AnnotatorInjected

/**
 * Mount the browser half.
 * @param ctx - the plugin's client context.
 * @throws {Error} when a required service is missing from the composition.
 */
export function apply(ctx: Context): void {
  const locale = ctx.get('locale') as LocaleLike | undefined
  const previews = ctx.get('documentPreviews') as DocumentPreviewsLike | undefined
  const slots = ctx.get('slots') as SlotsLike | undefined
  const sidebarTabs = ctx.get('sidebarRightTabs') as SidebarRightTabsLike | undefined
  if (locale === undefined) throw new Error(missingService('locale'))
  if (previews === undefined) throw new Error(missingService('documentPreviews'))
  if (slots === undefined) throw new Error(missingService('slots'))
  if (sidebarTabs === undefined) throw new Error(missingService('sidebarRightTabs'))
  ctx.effect(
    () => locale.register(NAMESPACE, { zh, en }),
    'dsh-figmark: dictionaries',
  )
  ctx.effect(() => previews.register({
    id: BODY_ID,
    extensions: EXTENSIONS,
    binaryExtensions: BINARY_EXTENSIONS,
    priority: 'extension',
    title: () => locale.bind(NAMESPACE)('title'),
    loading: 'bytes-complete',
    wrap: false,
  }), 'dsh-figmark: renderer metadata')
  ctx.effect(() => slots.inject('sidebar.right.tab.document', () => slots.register({
    name: 'sidebar.right.tab.document',
    key: BODY_ID,
    locale: NAMESPACE,
    inject: (sessionId: unknown): BodyInjected => ({
      sessions: ctx.get('sessions') as SessionsLike | undefined,
      conversation: ctx.get('conversation') as ComposerLike | undefined,
      sessionId: String(sessionId),
      localeId: locale.getLocale().locale ?? 'zh',
      remote: ctx.get('remote') as RemoteLike | undefined,
    }),
  }, AnnotatorBody)), 'dsh-figmark: document body')
  ctx.effect(() => sidebarTabs.register({
    id: SERVICE_BODY_ID,
    kind: SERVICE_KIND,
    priority: 'extension',
    title: () => locale.bind(NAMESPACE)('serviceTitle'),
    guide: [{
      id: 'services',
      order: 20,
      title: () => locale.bind(NAMESPACE)('serviceTitle'),
      description: () => locale.bind(NAMESPACE)('serviceHint'),
      icon: ServiceGuideIcon,
    }],
  }), 'dsh-figmark: service browser tab')
  ctx.effect(() => slots.inject('sidebar.right.pane.tab', () => slots.register({
    name: 'sidebar.right.pane.tab',
    key: SERVICE_BODY_ID,
    locale: NAMESPACE,
    inject: (sessionId: unknown): ServiceBrowserInjected => ({
      sessionId: String(sessionId),
      localeId: locale.getLocale().locale ?? 'zh',
      sessions: ctx.get('sessions') as SessionsLike | undefined,
      conversation: ctx.get('conversation') as ComposerLike | undefined,
      remote: ctx.get('remote') as RemoteLike | undefined,
    }),
  }, ServiceBrowser)), 'dsh-figmark: service browser body')
  ctx.effect(() => previews.register({
    id: PDF_BODY_ID,
    extensions: PDF_EXTENSIONS,
    binaryExtensions: PDF_EXTENSIONS,
    priority: 'extension',
    title: () => locale.bind(NAMESPACE)('pdfTitle'),
    loading: 'bytes-complete',
    wrap: false,
  }), 'dsh-figmark: pdf renderer metadata')
  ctx.effect(() => slots.inject('sidebar.right.tab.document', () => slots.register({
    name: 'sidebar.right.tab.document',
    key: PDF_BODY_ID,
    locale: NAMESPACE,
    // The chunk cannot import its own package's entry bundle, so the annotator body
    // it renders each page with, and the seat that reads, writes and delivers the
    // document's one annotation, cross as injected props.
    inject: (sessionId: unknown): PdfBodyInjected => ({
      AnnotatorBody,
      createAutosave,
      annotationSignature,
      autosaveDelayMs: AUTOSAVE_DELAY_MS,
      figureUnit,
      markOrdinals,
      // The chunk cannot import these, and the two of them are all it needs from
      // the preferences: how a document was last read, and where to record it.
      seat: createDocumentSeat({
        sessions: ctx.get('sessions') as SessionsLike | undefined,
        conversation: ctx.get('conversation') as ComposerLike | undefined,
        sessionId: String(sessionId),
        locale: locale.getLocale().locale?.startsWith('en') === true ? 'en' : 'zh',
      }),
    }),
  }, LazyPdfBody)), 'dsh-figmark: pdf document body')
  ctx.effect(() => previews.register({
    id: HTML_BODY_ID,
    extensions: HTML_EXTENSIONS,
    priority: 'extension',
    title: () => locale.bind(NAMESPACE)('htmlTitle'),
    loading: 'bytes-complete',
    wrap: false,
  }), 'dsh-figmark: html preview metadata')
  ctx.effect(() => slots.inject('sidebar.right.tab.document', () => slots.register({
    name: 'sidebar.right.tab.document',
    key: HTML_BODY_ID,
    locale: NAMESPACE,
    // A static file is preview-only. It has no annotation seat, no sidecar read and
    // no delivery action; only a loopback service page enters the annotator.
    inject: (sessionId: unknown): BodyInjected => ({
      sessions: undefined,
      conversation: undefined,
      sessionId: String(sessionId),
      localeId: locale.getLocale().locale ?? 'zh',
      remote: undefined,
    }),
  }, HtmlPreviewBody)), 'dsh-figmark: html preview body')
  // The block a reader's own message carries, drawn as a card instead of as the
  // lines the model reads. Both halves are optional: without the conversation
  // package a figure is still annotatable, it just says what it says as text.
  // A dynamic plugin has no child fiber, so the optional service comes from
  // `ctx.get` — read inside the slot callback, which cannot run before the package
  // that provides it has declared the slot.
  let stopRule: (() => void) | undefined
  ctx.effect(() => {
    const stopCard = slots.inject(USER_TEXT_SLOT, () => {
      const ui = ctx.get('uiConversation') as UiConversationLike | undefined
      if (ui === undefined) return () => {}
      stopRule ??= ui.userText.register(annotationRule)
      return slots.register({
        name: USER_TEXT_SLOT,
        key: RULE_ID,
        locale: NAMESPACE,
        // A keyed user-text renderer is a child of the transcript, so it never sees
        // this plugin's own props: what it needs crosses here, and the Session it is
        // running in arrives as the slot's own argument.
        inject: (sessionId: unknown): CardInjected => ({
          sessionId: String(sessionId),
          localeId: locale.getLocale().locale ?? 'zh',
          canOpen: (path: string, html: boolean) => {
            return canOpenFigure(ctx, String(sessionId), path, html)
          },
          open: (path: string, html: boolean) => {
            return openFigure(ctx, String(sessionId), path, html)
          },
        }),
      }, AnnotationCard)
    })
    return () => {
      stopCard()
      stopRule?.()
      stopRule = undefined
    }
  }, 'dsh-figmark: annotation card')
  // The same card, parked above the composer instead of inside a sent bubble. The
  // dock is the one seat beside the draft a plugin can draw in: the editor takes no
  // children, and the draft's own text is text, so a hand-off that stayed text put a
  // block of prose and an image chip in the box where the annotation should have
  // been one thing. Nothing here sends — the card does, and only when pressed.
  ctx.effect(() => slots.inject(PENDING_SLOT, () => slots.register({
    name: PENDING_SLOT,
    id: RULE_ID,
    // After the queue and the todo list: those answer "what is running", this one
    // answers "what am I about to send", and it belongs next to the input.
    order: 40,
    locale: NAMESPACE,
    inject: (sessionId: unknown): PendingInjected => ({
      sessionId: String(sessionId),
      localeId: locale.getLocale().locale ?? 'zh',
    }),
  }, PendingCard)), 'dsh-figmark: parked annotation')
}
