/**
 * The PDF renderer, mounted only once a PDF body is.
 *
 * `react.lazy` is the whole point of the split: the browser fetches
 * `client.pdf.js` on demand, so PDF.js and the data it reads never load for a
 * session that never opens a PDF.
 * @module dsh-figmark/client/LazyPdfBody
 */
import { Suspense, lazy, type ReactNode } from 'react'
import { resolveTranslate, type Translate } from './annotator-contract'
import { ToastStack, useToasts } from './annotator/toasts'
import type { PdfBodyProps } from './pdf/PdfBody'

/** The chunk's renderer, fetched when this body first mounts. */
const LoadedPdfBody = lazy(async () => {
  const chunk = await import('./pdf/pdf')
  return { default: chunk.PdfBody }
})

/** What the slot hands this body: the chunk's props before its copy is resolved. */
export type LazyPdfBodyProps = Omit<PdfBodyProps, 't' | 'toasts' | 'ToastStack'> & {
  /** Locale seat bound by the shell, when it binds one. */
  readonly t?: Translate | undefined
  /** Injected locale id used by the local fallback dictionary. */
  readonly localeId?: string | undefined
}

/**
 * Suspend while the PDF chunk arrives.
 * @param props - the document's props plus the seats the entry half injects.
 * @returns the deferred PDF renderer.
 */
export function LazyPdfBody(props: LazyPdfBodyProps): ReactNode {
  // Copy is resolved here: the chunk carries no dictionary, so nothing it needs
  // is shared with this bundle.
  const t: Translate = (key, vars) => resolveTranslate(props, key, vars)
  // The feedback stack belongs to the entry bundle for the same reason the
  // annotator body and the autosave writer do: a package-local chunk cannot import
  // its sibling, so the resolved stack and its component cross as props.
  const toasts = useToasts(t)
  return (
    <Suspense fallback={<p className="da-hint">{t('pdfRendering')}</p>}>
      <LoadedPdfBody {...props} t={t} toasts={toasts} ToastStack={ToastStack} />
    </Suspense>
  )
}
