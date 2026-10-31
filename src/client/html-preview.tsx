/**
 * A read-only preview for a static HTML file.
 *
 * Static files do not enter the annotator. They still need a readable inline
 * preview, though, and the shell has no HTML renderer of its own. The document is
 * written into an opaque sandbox so a self-contained deck's inline scripts can run
 * without gaining access to the panel. Its CSP rejects external resources, fetches,
 * forms and nested frames; script navigation remains confined to the opaque frame.
 * @module dsh-figmark/client/html-preview
 */
import { useEffect, useMemo, type ReactNode } from 'react'
import { resolveTranslate, type AnnotatorBodyProps } from './annotator-contract'
import { buildPreviewDocument } from './html-dom'
import { ensureStyles } from './styles'

/**
 * Render one static HTML file without annotation chrome.
 * @param props - the document owner's bytes, locale, and no annotation seat.
 * @returns a full-pane sandboxed preview.
 */
export function HtmlPreviewBody(props: AnnotatorBodyProps): ReactNode {
  const t = (key: string): string => resolveTranslate(props, key)
  useEffect(() => { ensureStyles(document) }, [])
  const source = useMemo(() => {
    const bytes = props.content?.kind === 'bytes' ? props.content.data : undefined
    return bytes === undefined
      ? undefined
      : buildPreviewDocument(new TextDecoder().decode(bytes))
  }, [props.content])

  if (source === undefined) {
    return <div className="da-html-preview-empty" role="alert">{t('loadFailed')}</div>
  }
  return (
    <div className="da-root da-html-preview">
      <iframe
        className="da-html-preview-frame"
        title={t('htmlTitle')}
        srcDoc={source}
        sandbox="allow-scripts allow-presentation"
        referrerPolicy="no-referrer"
      />
    </div>
  )
}
