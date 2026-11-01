/**
 * The local-pages guide glyph.
 *
 * The guide sits beside the shell's own "Browser" globe and "New terminal"
 * prompt, so this icon names the intersection instead of repeating either
 * neighbour: a page frame for the web, and a loopback arrow returning to its
 * origin for the local server that serves it.
 *
 * Drawn on the native guide's 36-unit grid and rendered by `EntryBox` at 26px,
 * the same contract as the neighbouring Files, Browser and Terminal artwork.
 * The restrained blue pair stays legible in both host palettes and matches that
 * icon family without turning this page back into a second globe.
 * @module dsh-figmark/client/service-guide-icon
 */
import type { ReactElement } from 'react'

/**
 * Draw the local-pages glyph.
 * @param props - the shell's icon-size hint.
 * @returns the page-and-loopback outline.
 */
export function ServiceGuideIcon(props: {
  readonly size?: number
  readonly className?: string | undefined
}): ReactElement {
  const size = props.size ?? 36
  return (
    <svg width={size} height={size} className={props.className} viewBox="0 0 36 36" fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true" focusable="false">
      <rect x="7.4" y="7.4" width="21.2" height="21.2" rx="4"
        stroke="#658EFF" strokeWidth="2.2" />
      <path d="M7.8 13.1h20.4" stroke="#658EFF" strokeWidth="2.2"
        strokeLinecap="round" />
      <circle cx="11.4" cy="10.25" r="0.95" fill="#539CFA" />
      <circle cx="15" cy="10.25" r="0.95" fill="#539CFA" />
      <circle cx="12.65" cy="20.3" r="1.9" fill="#539CFA" />
      <path d="M14.55 20.3h5.45a3.15 3.15 0 0 1 0 6.3h-4.85"
        stroke="#539CFA" strokeWidth="2.2" strokeLinecap="round" />
      <path d="m17.95 23.55-2.8 3.05 2.8 3.05"
        stroke="#539CFA" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
