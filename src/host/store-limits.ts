/**
 * The size ceilings one sidecar may reach.
 *
 * A cap is a statement about who wrote the file: a marks file larger than a few
 * megabytes, or a review artifact larger than the export the browser can produce,
 * was not written by this plugin, and reading it into memory would be the only
 * way to find out. The read path checks the marks cap before it parses, and the
 * route checks the review cap before it writes, so neither ever holds an
 * implausible document.
 * @module dsh-figmark/host/store-limits
 */

/** Maximum accepted sidecar size; a document larger than this is not one we wrote. */
export const MAX_ANNOTATION_BYTES = 4 * 1024 * 1024

/** Maximum accepted flattened review artifact. */
export const MAX_REVIEW_BYTES = 24 * 1024 * 1024
