/**
 * Browser half of the annotator.
 *
 * It registers one document renderer per annotatable kind — images and PDFs —
 * so opening either in the right Sidebar offers the annotator, and registers
 * each renderer's body in the keyed document slot. The PDF body lives in a
 * package-local chunk that is fetched only when a PDF opens. Markdown is
 * registered the same way, but its body edits the source in place and delivers
 * the difference instead of drawing on a surface.
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
import { MarkdownBody, type MarkdownInjected } from './markdown/MarkdownBody'
import { NAMESPACE, en, zh } from './locales'
import { missingService } from '../missing-service'
import type { PdfBodyInjected } from './pdf/PdfBody'
import type { FileUploadLike, SessionsLike } from './session'

/** Plugin name reported to the client module loader. */
export const name = 'dsh-figmark-client'

/** Client services this plugin waits for before it mounts anything. */
export const inject = ['slots', 'locale', 'documentPreviews']

/** Implementation identity of the image renderer, shared by its metadata and its slot entry. */
export const BODY_ID = 'dsh-figmark/image'

/** Implementation identity of the PDF renderer, shared by its metadata and its slot entry. */
export const PDF_BODY_ID = 'dsh-figmark/pdf'

/** Implementation identity of the Markdown editor, shared by its metadata and its slot entry. */
export const MD_BODY_ID = 'dsh-figmark/markdown'

/** Implementation identity of the HTML annotator, shared by its metadata and its slot entry. */
export const HTML_BODY_ID = 'dsh-figmark/html'

/** Suffixes the Markdown editor claims for whole-file text documents. */
const MD_EXTENSIONS = ['md', 'markdown'] as const

/** Suffixes the annotator claims for whole-file figures, matching the shell's builtin image renderer. */
const EXTENSIONS = ['svg', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico'] as const

/** Suffixes whose bytes are not readable as text. */
const BINARY_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico'] as const

/** Suffix the PDF renderer claims, ranking above the shell's read-only PDF preview. */
const PDF_EXTENSIONS = ['pdf'] as const

/** Suffixes the HTML annotator claims, ranking above the shell's read-only HTML preview. */
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

/** The conversation service, as far as a card needs it. */
interface UiConversationLike {
  readonly userText: { register(rule: typeof annotationRule): () => void }
}

/** The Sidebar's navigation controller, as far as a card needs it. */
interface SidebarRightLike {
  openResource(address: string): void
}

/** What the keyed card slot injects. */
interface CardInjected {
  readonly sessionId: string
  readonly localeId: string
  readonly open: (path: string) => void
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
 */
function openFigure(ctx: Context, sessionId: string, path: string): void {
  const sidebar = ctx.get('sidebarRight') as SidebarRightLike | undefined
  if (sidebar === undefined || sessionId === '' || path === '') return
  try {
    sidebar.openResource(fileAddress(sessionId, path))
  } catch (reason) {
    // The column has no mounted Session to place a tab in, which is a composition
    // fact rather than a fault of this message.
    console.warn('[figmark] cannot open the annotated figure', reason)
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
  if (locale === undefined) throw new Error(missingService('locale'))
  if (previews === undefined) throw new Error(missingService('documentPreviews'))
  if (slots === undefined) throw new Error(missingService('slots'))
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
        fileUpload: ctx.get('fileUpload') as FileUploadLike | undefined,
        sessionId: String(sessionId),
        locale: locale.getLocale().locale?.startsWith('en') === true ? 'en' : 'zh',
      }),
    }),
  }, LazyPdfBody)), 'dsh-figmark: pdf document body')
  ctx.effect(() => previews.register({
    id: MD_BODY_ID,
    extensions: MD_EXTENSIONS,
    priority: 'extension',
    title: () => locale.bind(NAMESPACE)('mdTitle'),
    loading: 'text-pages',
    wrap: true,
  }), 'dsh-figmark: markdown renderer metadata')
  ctx.effect(() => slots.inject('sidebar.right.tab.document', () => slots.register({
    name: 'sidebar.right.tab.document',
    key: MD_BODY_ID,
    locale: NAMESPACE,
    // The editor never writes the document: it hands the Session the difference
    // between what it loaded and what the reader made of it.
    inject: (sessionId: unknown): MarkdownInjected => ({
      sessions: ctx.get('sessions') as SessionsLike | undefined,
      fileUpload: ctx.get('fileUpload') as FileUploadLike | undefined,
      sessionId: String(sessionId),
      localeId: locale.getLocale().locale ?? 'zh',
    }),
  }, MarkdownBody)), 'dsh-figmark: markdown document body')
  ctx.effect(() => previews.register({
    id: HTML_BODY_ID,
    extensions: HTML_EXTENSIONS,
    priority: 'extension',
    title: () => locale.bind(NAMESPACE)('htmlTitle'),
    loading: 'bytes-complete',
    wrap: false,
  }), 'dsh-figmark: html renderer metadata')
  ctx.effect(() => slots.inject('sidebar.right.tab.document', () => slots.register({
    name: 'sidebar.right.tab.document',
    key: HTML_BODY_ID,
    locale: NAMESPACE,
    // A rendered document is one surface with one marks file, so the body reads,
    // writes and delivers it itself — there is no page owner above it.
    inject: (sessionId: unknown): BodyInjected => ({
      sessions: ctx.get('sessions') as SessionsLike | undefined,
      conversation: ctx.get('conversation') as ComposerLike | undefined,
      sessionId: String(sessionId),
      localeId: locale.getLocale().locale ?? 'zh',
      remote: ctx.get('remote') as RemoteLike | undefined,
    }),
  }, AnnotatorBody)), 'dsh-figmark: html document body')
  // The block a reader's own message carries, drawn as a card instead of as the
  // lines the model reads. Both halves are optional: without the conversation
  // package a figure is still annotatable, it just says what it says as text.
  ctx.inject(['uiConversation'], (scope) => {
    const ui = scope.get('uiConversation') as UiConversationLike
    scope.effect(() => ui.userText.register(annotationRule), 'dsh-figmark: annotation block')
    scope.effect(() => slots.inject(USER_TEXT_SLOT, () => slots.register({
      name: USER_TEXT_SLOT,
      key: RULE_ID,
      locale: NAMESPACE,
      // A keyed user-text renderer is a child of the transcript, so it never sees
      // this plugin's own props: what it needs crosses here, and the Session it is
      // running in arrives as the slot's own argument.
      inject: (sessionId: unknown): CardInjected => ({
        sessionId: String(sessionId),
        localeId: locale.getLocale().locale ?? 'zh',
        open: (path: string) => { openFigure(ctx, String(sessionId), path) },
      }),
    }, AnnotationCard)), 'dsh-figmark: annotation card')
  })
}
