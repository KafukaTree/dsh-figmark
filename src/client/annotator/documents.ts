/**
 * The one place a marks file is assembled.
 *
 * Two paths write one — the draft an autosave keeps while the reader is working,
 * and the document a hand-off delivers — and they describe the same figure at the
 * same moment. Built twice, the two would be free to disagree about a field, and
 * the disagreement would only surface as a reload reading something the panel
 * never showed. Every field a writer needs is named here once.
 * @module dsh-figmark/client/annotator/documents
 */
import {
  ANNOTATION_VERSION, type AnnotationDocument, type AnnotationMark,
} from '../../shared/annotation'

/** The figure facts one document has to state, as the Host reported them. */
export interface FigureFacts {
  /** The preview tab's file address. */
  readonly address: string
  /** The figure's own path, as the Host named it. */
  readonly path: string
  /** Media type of the figure. */
  readonly mediaType: string
  /** The Host's hash of the bytes it read. */
  readonly sha256: string
}

/** Everything one marks file is built from. */
export interface DocumentSource {
  /** The figure the marks are about. */
  readonly figure: FigureFacts
  /** The size of the surface the marks were drawn on. */
  readonly size: { readonly width: number; readonly height: number }
  /** The marks to write. */
  readonly marks: readonly AnnotationMark[]
  /** What the reader said the whole figure should become. */
  readonly summary: string
  /** When the annotation was first made, or null for one being started now. */
  readonly createdAt: string | null
  /** The clock to stamp `updatedAt` from, fixed once so both fields agree. */
  readonly now: string
}

/**
 * Assemble one marks file.
 *
 * `createdAt` keeps the first moment the annotation existed and only falls back to
 * now for one that has never been written: it is what a reader sees as "when this
 * was noted", and moving it on every save would make every draft look new. A blank
 * summary is left out rather than written empty, so a document that carries no
 * overall goal does not claim to carry one.
 * @param source - the figure, surface, marks, and clock to build from.
 * @returns the document to write.
 */
export function buildAnnotationDocument(source: DocumentSource): AnnotationDocument {
  const summary = source.summary.trim()
  return {
    version: ANNOTATION_VERSION,
    figure: {
      address: source.figure.address,
      path: source.figure.path,
      mediaType: source.figure.mediaType,
      width: source.size.width,
      height: source.size.height,
      sha256: source.figure.sha256,
    },
    createdAt: source.createdAt ?? source.now,
    updatedAt: source.now,
    marks: source.marks,
    ...(summary === '' ? {} : { summary }),
  }
}
