/**
 * The right-sidebar doorway to local HTTP pages.
 *
 * Static HTML has its own read-only preview. Annotation begins only after the reader
 * picks a service that is already being served on loopback, so this screen is
 * deliberately small: search an address, scan the bounded local candidates, then hand
 * the chosen page to the same AnnotatorBody used by every other surface.
 * @module dsh-figmark/client/ServiceBrowser
 */
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import type { ServiceSummary } from '../shared/services'
import { AnnotatorBody } from './AnnotatorBody'
import type { SurfaceDraft } from './annotator-contract'
import { fallbackTranslate } from './locales'
import {
  closeLivePage,
  discoverLiveServices,
  loopbackAddressOf,
  openLivePage,
  type LivePage,
} from './live-page'
import { readLiveDraft, writeLiveDraft, type LiveDraft } from './live-drafts'
import type { ComposerLike } from './composer'
import type { RemoteLike } from './host-actions'
import type { SessionsLike } from './session'
import { ensureStyles } from './styles'

/** Where recent loopback addresses are remembered. */
const RECENT_KEY = 'dsh-figmark.services.recent.v1'

/** A keystroke should feel local; storage is flushed once the reader pauses. */
const LIVE_DRAFT_FLUSH_MS = 250

/** A draft exists even before a page has been opened, so active edits need no fallback. */
const EMPTY_LIVE_DRAFT: LiveDraft = { marks: [], summary: '', updatedAt: 0 }

/** Text shapes a reader uses for an address rather than a title search. */
const ADDRESS_SHAPES: readonly RegExp[] = [
  /^[a-z][a-z0-9+.-]*:\/\//iu,
  /^localhost(?::\d+)?(?:[/?#]|$)/iu,
  /^127(?:\.\d{1,3}){3}(?::\d+)?(?:[/?#]|$)/u,
  /^\[[0-9a-f:]+\](?::\d+)?(?:[/?#]|$)/iu,
  /^[^\s/?#]+\.(?:[a-z0-9-]+\.)*[a-z0-9-]{2,}(?::\d+)?(?:[/?#]|$)/iu,
  /^[^\s/?#]+:\d+(?:[/?#]|$)/u,
]

/** What the right-sidebar slot injects into the browser. */
export interface ServiceBrowserInjected {
  /** Session whose workspace may name a development port. */
  readonly sessionId: string
  /** Locale used by the local fallback dictionary. */
  readonly localeId: string
  /** Delivery face shared with every annotator body. */
  readonly sessions: SessionsLike | undefined
  /** Composer parking face shared with every annotator body. */
  readonly conversation: ComposerLike | undefined
  /** Host gesture face for the page context menu. */
  readonly remote: RemoteLike | undefined
}

/** A live-page workspace whose marks survive while another tab is in front. */
interface LiveWorkspace {
  /** Stable identity of the tab, independent of the page it currently shows. */
  readonly id: string
  /** The page this workspace currently annotates. */
  readonly address: string
  /** What the page looked like in the service list. */
  readonly title?: string
}

/** The one live proxy and body currently installed. */
interface LiveRuntime {
  /** The workspace the body belongs to. */
  readonly workspaceId: string
  /** The proxy the body frames. */
  readonly page: LivePage
}

/** The short name a session tab prints. */
function sessionName(workspace: LiveWorkspace): string {
  if (workspace.title !== undefined && workspace.title !== '') return workspace.title
  const path = pathOf(workspace.address)
  return path === '/' ? endpointOf(workspace.address) : path
}

/** The one mounted live annotator, given stable owner callbacks. */
function ActiveLiveBody(props: ServiceBrowserInjected & {
  readonly workspace: LiveWorkspace
  readonly page: LivePage
  readonly draft: SurfaceDraft
  readonly summary: string
  readonly onDraft: (workspaceId: string, address: string, draft: SurfaceDraft) => void
  readonly onSummary: (workspaceId: string, address: string, summary: string) => void
  readonly onPageChange: (workspaceId: string, page: LivePage) => void
  readonly onBack: () => void
}): ReactNode {
  const { id: workspaceId } = props.workspace
  const { address } = props.page
  const { onDraft, onSummary, onPageChange } = props
  const onDraftChange = useCallback(
    (draft: SurfaceDraft): void => { onDraft(workspaceId, address, draft) },
    [address, onDraft, workspaceId],
  )
  const onSummaryChange = useCallback(
    (summary: string): void => { onSummary(workspaceId, address, summary) },
    [address, onSummary, workspaceId],
  )
  const onLivePageChange = useCallback(
    (page: LivePage): void => { onPageChange(workspaceId, page) },
    [onPageChange, workspaceId],
  )
  return (
    <div className="da-service-live">
      <AnnotatorBody
        key={workspaceId}
        livePage={props.page}
        sessionId={props.sessionId}
        localeId={props.localeId}
        sessions={props.sessions}
        conversation={props.conversation}
        remote={props.remote}
        draft={props.draft}
        summary={props.summary}
        onDraftChange={onDraftChange}
        onSummaryChange={onSummaryChange}
        onLivePageChange={onLivePageChange}
        onLiveBack={props.onBack}
      />
    </div>
  )
}

/** Read remembered addresses without letting storage break the page. */
function readRecent(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as unknown
    return Array.isArray(raw) ? raw.filter((value): value is string => typeof value === 'string').slice(0, 8) : []
  } catch {
    return []
  }
}

/** Remember one address, newest first and capped. */
function remember(address: string): string[] {
  const next = [address, ...readRecent().filter(value => value !== address)].slice(0, 8)
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    // A full or disabled storage area must not stop the page opening.
  }
  return next
}

/** The host and port shown as the row's compact identity. */
function endpointOf(address: string): string {
  try {
    const url = new URL(address)
    return `${url.hostname}${url.port === '' ? '' : `:${url.port}`}`
  } catch {
    return address
  }
}

/** The path under the endpoint, with `/` for the root page. */
function pathOf(address: string): string {
  try {
    const url = new URL(address)
    return `${url.pathname}${url.search}`
  } catch {
    return '/'
  }
}

/**
 * Whether the search text is meant as an address rather than a title.
 *
 * This deliberately runs before the row fallback. Otherwise malformed input such
 * as `http://` shares a substring with every discovered URL and opens an unrelated
 * service instead of reporting the bad address.
 * @param input - the search field's text.
 * @returns true when the input has an address-shaped beginning.
 */
function looksLikeAddress(input: string): boolean {
  const text = input.trim()
  return ADDRESS_SHAPES.some(shape => shape.test(text))
}

/**
 * Service discovery and the live annotator it opens.
 * @param props - session, locale and the delivery faces shared by every body.
 * @returns the service picker, or the annotated live page.
 */
export function ServiceBrowser(props: ServiceBrowserInjected): ReactNode {
  const t = useCallback((key: string): string => fallbackTranslate(props.localeId, key), [props.localeId])
  const [services, setServices] = useState<readonly ServiceSummary[]>([])
  const [query, setQuery] = useState('')
  const [scanning, setScanning] = useState(false)
  const [opening, setOpening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [workspaces, setWorkspaces] = useState<readonly LiveWorkspace[]>([])
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null)
  const [runtime, setRuntime] = useState<LiveRuntime | null>(null)
  const [showingList, setShowingList] = useState(true)
  const [liveDraft, setLiveDraft] = useState<LiveDraft>(EMPTY_LIVE_DRAFT)
  const scanGeneration = useRef(0)
  const openGeneration = useRef(0)
  const openingRef = useRef(false)
  /** Tab ids are local to this mounted service browser and never derive from a URL. */
  const workspaceGeneration = useRef(0)
  /** The newest known value of each open tab's draft, including edits already typed. */
  const draftSnapshots = useRef(new Map<string, LiveDraft>())
  /** The active body's draft, updated synchronously before React schedules its render. */
  const activeDraft = useRef<LiveDraft>(EMPTY_LIVE_DRAFT)
  /** One debounced storage write per address. */
  const draftTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  useEffect(() => { ensureStyles(document) }, [])
  useEffect(() => () => {
    scanGeneration.current += 1
    openGeneration.current += 1
  }, [])

  const flushDraft = useCallback((address: string): void => {
    const timer = draftTimers.current.get(address)
    if (timer !== undefined) clearTimeout(timer)
    draftTimers.current.delete(address)
    const draft = draftSnapshots.current.get(address)
    if (draft !== undefined) writeLiveDraft(props.sessionId, address, draft.marks, draft.summary)
  }, [props.sessionId])

  const flushAllDrafts = useCallback((): void => {
    for (const address of draftSnapshots.current.keys()) flushDraft(address)
  }, [flushDraft])

  useEffect(() => {
    window.addEventListener('pagehide', flushAllDrafts)
    return () => {
      window.removeEventListener('pagehide', flushAllDrafts)
      flushAllDrafts()
    }
  }, [flushAllDrafts])

  useEffect(() => {
    scanGeneration.current += 1
    openGeneration.current += 1
    openingRef.current = false
    setOpening(false)
    setWorkspaces([])
    setRuntime(null)
    setActiveWorkspaceId(null)
    setShowingList(true)
    activeDraft.current = EMPTY_LIVE_DRAFT
    setLiveDraft(EMPTY_LIVE_DRAFT)
    for (const timer of draftTimers.current.values()) clearTimeout(timer)
    draftTimers.current.clear()
    draftSnapshots.current.clear()
  }, [props.sessionId])

  const rememberDraft = useCallback((_workspaceId: string, address: string, draft: SurfaceDraft): void => {
    const next = {
      marks: draft.marks,
      summary: activeDraft.current.summary,
      updatedAt: Date.now(),
    }
    activeDraft.current = next
    draftSnapshots.current.set(address, next)
    const pending = draftTimers.current.get(address)
    if (pending !== undefined) clearTimeout(pending)
    draftTimers.current.set(address, setTimeout(() => { flushDraft(address) }, LIVE_DRAFT_FLUSH_MS))
  }, [flushDraft])

  const rememberSummary = useCallback((_workspaceId: string, address: string, summary: string): void => {
    const next = {
      marks: activeDraft.current.marks,
      summary,
      updatedAt: Date.now(),
    }
    activeDraft.current = next
    draftSnapshots.current.set(address, next)
    setLiveDraft(next)
    const pending = draftTimers.current.get(address)
    if (pending !== undefined) clearTimeout(pending)
    draftTimers.current.set(address, setTimeout(() => { flushDraft(address) }, LIVE_DRAFT_FLUSH_MS))
  }, [flushDraft])

  const scan = useCallback(async (): Promise<void> => {
    const generation = scanGeneration.current + 1
    scanGeneration.current = generation
    setScanning(true)
    setError(null)
    try {
      const outcome = await discoverLiveServices(props.sessionId, readRecent()).then(
        found => ({ found }),
        (reason: unknown) => ({ reason }),
      )
      if (scanGeneration.current !== generation) return
      if ('found' in outcome) setServices(outcome.found)
      else setError(outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason))
    } finally {
      if (scanGeneration.current === generation) setScanning(false)
    }
  }, [props.sessionId])

  useEffect(() => { void scan() }, [scan])

  const openWorkspace = useCallback(async (
    text: string,
    title?: string,
    wantedWorkspaceId?: string,
  ): Promise<void> => {
    if (openingRef.current) return
    const address = loopbackAddressOf(text)
    if (address === undefined) {
      setError(t('serviceBadAddress'))
      return
    }
    const known = wantedWorkspaceId === undefined
      ? workspaces.find(workspace => workspace.address === address)
      : workspaces.find(workspace => workspace.id === wantedWorkspaceId)
    if (known !== undefined && runtime?.workspaceId === known.id && runtime.page.address === address) {
      remember(address)
      setActiveWorkspaceId(known.id)
      setShowingList(false)
      return
    }
    const generation = openGeneration.current + 1
    openGeneration.current = generation
    openingRef.current = true
    setOpening(true)
    setError(null)
    try {
      const outcome = await openLivePage(address).then(
        page => ({ page }),
        (reason: unknown) => ({ reason }),
      )
      if (openGeneration.current !== generation) {
        if ('page' in outcome) {
          // The Host already opened the proxy, but this picker is gone. Nothing will
          // frame it, so close it instead of leaving a loopback listener behind.
          await closeLivePage(outcome.page.url).catch(() => { /* the Host may already have replaced it. */ })
        }
        return
      }
      if ('page' in outcome) {
        remember(address)
        const remembered = draftSnapshots.current.get(address)
          ?? readLiveDraft(props.sessionId, address)
        const installed = {
          marks: remembered?.marks ?? [],
          summary: remembered?.summary ?? '',
          updatedAt: remembered?.updatedAt ?? Date.now(),
        }
        activeDraft.current = installed
        draftSnapshots.current.set(address, installed)
        setLiveDraft(installed)
        const workspaceId = known?.id
          ?? `live-${(workspaceGeneration.current += 1).toString(36)}`
        setWorkspaces(current => known !== undefined
          ? current.map(workspace => {
            if (workspace.id !== known.id) return workspace
            const shownTitle = workspace.title ?? title
            return {
              ...workspace,
              address,
              ...(shownTitle === undefined ? {} : { title: shownTitle }),
            }
          })
          : [...current, {
            id: workspaceId,
            address,
            ...(title === undefined ? {} : { title }),
          }])
        setActiveWorkspaceId(workspaceId)
        setRuntime({ workspaceId, page: outcome.page })
        setShowingList(false)
      } else {
        setError(outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason))
      }
    } finally {
      if (openGeneration.current === generation) {
        openingRef.current = false
        setOpening(false)
      }
    }
  }, [props.sessionId, remember, runtime, t, workspaces])

  const backToList = useCallback((): void => {
    setRuntime(null)
    setShowingList(true)
    void scan()
  }, [scan])

  const closeWorkspace = useCallback((workspace: LiveWorkspace): void => {
    flushDraft(workspace.address)
    draftSnapshots.current.delete(workspace.address)
    writeLiveDraft(props.sessionId, workspace.address, [], '')
    const remaining = workspaces.filter(candidate => candidate.id !== workspace.id)
    setWorkspaces(remaining)
    if (runtime?.workspaceId === workspace.id) setRuntime(null)
    if (activeWorkspaceId === workspace.id) {
      setActiveWorkspaceId(remaining.at(-1)?.id ?? null)
    }
    if (remaining.length === 0) setShowingList(true)
  }, [activeWorkspaceId, flushDraft, props.sessionId, runtime, workspaces])

  const learnPage = useCallback((workspaceId: string, page: LivePage): void => {
    const installed = draftSnapshots.current.get(page.address) ?? {
      marks: [], summary: '', updatedAt: Date.now(),
    }
    activeDraft.current = installed
    draftSnapshots.current.set(page.address, installed)
    setLiveDraft(installed)
    setWorkspaces(current => current.map(workspace => workspace.id === workspaceId
      ? { id: workspace.id, address: page.address }
      : workspace))
    setRuntime({ workspaceId, page })
  }, [])

  const submit = (event: FormEvent): void => {
    event.preventDefault()
    // A valid loopback address is what the reader typed, even when a discovered URL
    // happens to share its prefix. A matching title wins over address-shaped text such
    // as `Node.js` or `Chapter:2`; bad address-shaped input goes back to `open` for its
    // error.
    const typed = loopbackAddressOf(query)
    if (typed !== undefined) {
      void openWorkspace(typed)
      return
    }
    const needle = query.trim().toLowerCase()
    const titleMatch = visible.find(service => service.title?.toLowerCase().includes(needle) === true)
    if (titleMatch !== undefined) {
      void openWorkspace(titleMatch.url, titleMatch.title)
      return
    }
    const first = visible[0]
    void openWorkspace(
      looksLikeAddress(query) || first === undefined ? query : first.url,
      looksLikeAddress(query) || first === undefined ? undefined : first.title,
    )
  }

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (needle === '') return services
    return services.filter(service =>
      service.url.toLowerCase().includes(needle)
      || service.title?.toLowerCase().includes(needle) === true)
  }, [query, services])

  const listVisible = showingList || runtime === null
  const runtimeWorkspace = runtime === null
    ? undefined
    : workspaces.find(workspace => workspace.id === runtime.workspaceId)
  return (
    <div className="da-service-shell">
      {workspaces.length === 0 ? null : (
        <nav className="da-service-tabs" aria-label={t('serviceTabs')}>
          <button type="button" className="da-service-list-tab"
            data-active={listVisible}
            aria-label={t('serviceListTab')}
            title={t('serviceListTab')}
            onClick={backToList}>
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path d="M5.5 4.5h7M5.5 8h7M5.5 11.5h7M3 4.5h.01M3 8h.01M3 11.5h.01" />
            </svg>
          </button>
          {workspaces.map(workspace => (
            <span className="da-service-tab" data-active={
              !listVisible && activeWorkspaceId === workspace.id
            } key={workspace.id}>
              <button type="button" className="da-service-tab-open"
                disabled={opening}
                title={workspace.title === undefined
                  ? workspace.address
                  : `${workspace.title} — ${workspace.address}`}
                onClick={() => {
                  if (runtime?.workspaceId === workspace.id
                    && runtime.page.address === workspace.address) {
                    setActiveWorkspaceId(workspace.id)
                    setShowingList(false)
                  } else {
                    void openWorkspace(workspace.address, workspace.title, workspace.id)
                  }
                }}>
                <span className="da-service-tab-dot" aria-hidden="true" />
                <span className="da-service-tab-name">{sessionName(workspace)}</span>
              </button>
              <button type="button" className="da-service-tab-close"
                disabled={opening}
                aria-label={`${t('serviceCloseTab')} ${sessionName(workspace)}`}
                title={t('serviceCloseTab')}
                onClick={() => { closeWorkspace(workspace) }}>
                <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                  <path d="m5 5 6 6M11 5l-6 6" />
                </svg>
              </button>
            </span>
          ))}
        </nav>
      )}
      {!listVisible && error !== null
        ? <div className="da-service-errorbar" role="alert">{error}</div>
        : null}
      <div className="da-service-work">
        <main className="da-services" hidden={!listVisible}>
          <header className="da-services-head">
            <span className="da-services-kicker">{t('serviceKicker')}</span>
            <h1>{t('serviceTitle')}</h1>
            <p>{t('serviceHint')}</p>
          </header>

          <form className="da-service-search" onSubmit={submit}>
            <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
              <circle cx="8.5" cy="8.5" r="5.25" />
              <path d="m12.4 12.4 4.1 4.1" />
            </svg>
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setError(null)
              }}
              placeholder={t('serviceSearch')}
              aria-label={t('serviceSearch')}
              autoComplete="off"
              spellCheck={false}
            />
            <button type="submit" disabled={opening || query.trim() === ''}>
              {opening ? t('serviceOpening') : t('serviceOpen')}
            </button>
          </form>

          <div className="da-services-toolbar">
            <span>{t('serviceLocal')}</span>
            <button type="button" onClick={() => { void scan() }} disabled={scanning}>
              {scanning ? t('serviceScanning') : t('serviceRescan')}
            </button>
          </div>

          {error === null ? null : <p className="da-services-error" role="alert">{error}</p>}

          <section className="da-service-list" aria-live="polite">
            {scanning && visible.length === 0 ? (
              <div className="da-services-empty">{t('serviceScanning')}</div>
            ) : visible.length === 0 ? (
              <div className="da-services-empty">
                <strong>{t('serviceEmpty')}</strong>
                <span>{t('serviceEmptyHint')}</span>
              </div>
            ) : visible.map(service => (
              <button type="button" className="da-service-row" key={service.url}
                disabled={opening}
                onClick={() => { void openWorkspace(service.url, service.title) }}>
                <span className="da-service-signal" aria-hidden="true" />
                <span className="da-service-copy">
                  <strong>{service.title ?? endpointOf(service.url)}</strong>
                  <span><b>{endpointOf(service.url)}</b>{pathOf(service.url)}</span>
                </span>
                <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                  <path d="m6 3.5 4.5 4.5L6 12.5" />
                </svg>
              </button>
            ))}
          </section>
        </main>
        {runtime !== null && runtimeWorkspace !== undefined ? (
          <ActiveLiveBody
            key={runtime.workspaceId}
            workspace={runtimeWorkspace}
            page={runtime.page}
            draft={{ marks: liveDraft.marks }}
            summary={liveDraft.summary}
            sessionId={props.sessionId}
            localeId={props.localeId}
            sessions={props.sessions}
            conversation={props.conversation}
            remote={props.remote}
            onDraft={rememberDraft}
            onSummary={rememberSummary}
            onPageChange={learnPage}
            onBack={backToList}
          />
        ) : null}
      </div>
    </div>
  )
}
