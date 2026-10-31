/**
 * The small vocabulary shared by the service browser and the Host scan.
 * @module dsh-figmark/shared/services
 */

/** Route that probes loopback services for the browser. */
export const SERVICE_DISCOVER_ROUTE = '/services'

/** What the browser asks the Host to look for. */
export interface ServiceDiscoverRequest {
  /** Session whose workspace may mention a development port. */
  readonly sessionId: string
  /** Recently opened loopback URLs, already used by this browser. */
  readonly recent?: readonly string[]
}

/** One local service the Host found answering HTTP. */
export interface ServiceSummary {
  /** Loopback HTTP address. */
  readonly url: string
  /** Page title when the answer carried one. */
  readonly title?: string
  /** Why this address was tried. */
  readonly source: 'common' | 'workspace' | 'recent'
}

/** Successful discovery answer. */
export interface ServiceDiscoverAnswer {
  /** Always true; failures use the plugin's ordinary error body. */
  readonly ok: true
  /** Reachable services, newest first by source priority and port. */
  readonly services: readonly ServiceSummary[]
}
