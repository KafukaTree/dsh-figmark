/**
 * The one way an HTML answer receives the picker.
 *
 * The live proxy puts a running loopback page in front of the reader. It injects
 * one script at one path so the page and the picker agree on how an element is
 * named regardless of which development server supplied the HTML.
 * @module dsh-figmark/host/html-injection
 */

/** Where the injected tag asks for the picker. */
export const PICKER_PATH = '/__dsh_figmark_picker.js'

/** The tag injected into every interactive HTML page. */
export const PICKER_TAG = `<script src="${PICKER_PATH}"></script>`

/** Largest HTML document either server will buffer in order to inject the picker. */
export const MAX_HTML_BYTES = 8 * 1024 * 1024

/**
 * A page-level policy that would reject the picker script.
 *
 * The proxy already removes the same policy when it arrives as a response header.
 * HTML can carry the policy in a meta tag as well, and a document-level
 * `script-src 'none'` would otherwise leave a working page with a dead picker.
 */
const CSP_META = /<meta\b(?=[^>]*\bhttp-equiv\s*=\s*(?:"\s*content-security-policy(?:-report-only)?\s*"|'\s*content-security-policy(?:-report-only)?\s*'|content-security-policy(?:-report-only)?))[^>]*>/giu

/**
 * Remove document-level CSP declarations before the picker is injected.
 * @param html - the page as the source sent it.
 * @returns the page without CSP meta tags.
 */
export function stripCspMeta(html: string): string {
  return html.replace(CSP_META, '')
}

/**
 * Put the picker tag in front of a page's last `</body>`.
 * @param html - the page as the source sent it.
 * @param tag - the tag to inject.
 * @returns the page the frame receives.
 */
export function injectPicker(html: string, tag = PICKER_TAG): string {
  const close = html.toLowerCase().lastIndexOf('</body>')
  return close < 0
    ? `${html}${tag}`
    : `${html.slice(0, close)}${tag}${html.slice(close)}`
}
