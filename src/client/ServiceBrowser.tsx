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
import { fallbackTranslate } from './locales'
import {
  closeLivePage,
  discoverLiveServices,
  loopbackAddressOf,
  openLivePage,
  type LivePage,
} from './live-page'
import type { ComposerLike } from './composer'
import type { RemoteLike } from './host-actions'
import type { SessionsLike } from './session'
import { ensureStyles } from './styles'

/** Where recent loopback addresses are remembered. */
const RECENT_KEY = 'dsh-figmark.services.recent.v1'

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
  const [live, setLive] = useState<LivePage | null>(null)
  const scanGeneration = useRef(0)
  const openGeneration = useRef(0)
  const openingRef = useRef(false)

  useEffect(() => { ensureStyles(document) }, [])
  useEffect(() => () => {
    scanGeneration.current += 1
    openGeneration.current += 1
  }, [])

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

  const open = useCallback(async (text: string): Promise<void> => {
    if (openingRef.current) return
    const address = loopbackAddressOf(text)
    if (address === undefined) {
      setError(t('serviceBadAddress'))
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
        setLive(outcome.page)
      } else {
        setError(outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason))
      }
    } finally {
      if (openGeneration.current === generation) {
        openingRef.current = false
        setOpening(false)
      }
    }
  }, [t])

  const submit = (event: FormEvent): void => {
    event.preventDefault()
    // A valid loopback address is what the reader typed, even when a discovered URL
    // happens to share its prefix. A matching title wins over address-shaped text such
    // as `Node.js` or `Chapter:2`; bad address-shaped input goes back to `open` for its
    // error.
    const typed = loopbackAddressOf(query)
    if (typed !== undefined) {
      void open(typed)
      return
    }
    const needle = query.trim().toLowerCase()
    const titleMatch = visible.find(service => service.title?.toLowerCase().includes(needle) === true)
    if (titleMatch !== undefined) {
      void open(titleMatch.url)
      return
    }
    const first = visible[0]
    void open(looksLikeAddress(query) || first === undefined ? query : first.url)
  }

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (needle === '') return services
    return services.filter(service =>
      service.url.toLowerCase().includes(needle)
      || service.title?.toLowerCase().includes(needle) === true)
  }, [query, services])

  if (live !== null) {
    return (
      <div className="da-service-live">
        <AnnotatorBody
          key={live.address}
          livePage={live}
          sessionId={props.sessionId}
          localeId={props.localeId}
          sessions={props.sessions}
          conversation={props.conversation}
          remote={props.remote}
          onLiveBack={() => {
            setLive(null)
            void scan()
          }}
        />
      </div>
    )
  }

  return (
    <main className="da-services">
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
            onClick={() => { void open(service.url) }}>
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
  )
}
