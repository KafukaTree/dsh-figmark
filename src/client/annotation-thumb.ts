/**
 * The small picture the sent bubble shows beside its annotation summary.
 *
 * The bubble's renderer is handed the message *text* and nothing else: the
 * attachments of that message are rendered by the content layer, not by the text
 * node, so the renderer cannot ask for them. What it can do is recognise the
 * message it drew a moment ago. So the sheet that drew the review picture keeps a
 * small copy here, keyed by the exact text it is about to deliver, and the bubble
 * looks the text up again.
 *
 * Two consequences are by design. The cache is a module-level map, so it lives as
 * long as the page does: a reload forgets every thumbnail and the card falls back
 * to an icon, which is the same card one word shorter rather than a hole. And the
 * key is the whole block text, not the figure path, because the same figure sent
 * twice carries different marks and therefore a different picture.
 * @module dsh-figmark/client/annotation-thumb
 */

/** Longest edge the stored picture is scaled to, in CSS pixels. */
const THUMB_WIDTH = 120

/** How many blocks stay in the cache before the oldest is dropped. */
const MAX_ENTRIES = 64

/** Quality passed to the encoder; a preview at 120px carries no more than this. */
const QUALITY = 0.6

/**
 * One key per delivered block, in first-seen order.
 *
 * A `Map` keeps insertion order, so the first key is always the oldest and
 * dropping it is a one-liner.
 */
const cache = new Map<string, string>()

/**
 * Normalise a block for keying.
 *
 * A message stored with CRLF endings reaches this module as the text it was, and
 * the shell may hand the same message back with either ending; the thumbnail is
 * about the block, not about its line terminators.
 * @param block - the message block, as delivered or as matched.
 * @returns the key.
 */
function keyOf(block: string): string {
  return block.replace(/\r\n?/gu, '\n')
}

/**
 * Remember the picture for one delivered block.
 * @param block - the block text that was delivered.
 * @param dataUrl - a `data:image/…` URL; anything else is ignored rather than
 * stored, so a caller that hands over a blob URL cannot break the bubble later.
 */
export function rememberThumb(block: string, dataUrl: string | undefined): void {
  if (dataUrl === undefined || !dataUrl.startsWith('data:image/')) return
  const key = keyOf(block)
  // Re-inserting moves the key to the end, so a block that is sent again is the
  // newest entry rather than the oldest one to be evicted.
  cache.delete(key)
  cache.set(key, dataUrl)
  while (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next()
    // `while` over a non-empty map: the iterator cannot be exhausted here.
    /* v8 ignore next */
    if (oldest.done === true) break
    cache.delete(oldest.value)
  }
}

/**
 * The picture remembered for one block.
 * @param block - the block text the bubble matched.
 * @returns the data URL, or undefined when this page never drew that block.
 */
export function thumbFor(block: string): string | undefined {
  return cache.get(keyOf(block))
}

/**
 * Drop every remembered picture.
 *
 * Only the tests and a Session switch need this: one page draws for one reader,
 * and the keys are whole messages, so nothing here is a leak between readers.
 */
export function clearThumbs(): void {
  cache.clear()
}

/**
 * Scale one picture down to thumbnail size.
 *
 * Every step is allowed to be missing: `createImageBitmap` needs a decoder the
 * shell may not have, a canvas may not give a 2D context, and the encoder may
 * refuse. Each of those answers `undefined`, which the card draws as an icon —
 * a bubble that never loads a thumbnail must still say what it is about.
 * @param source - the review picture, when there is one.
 * @returns a `data:image/…` URL, or undefined.
 */
export async function captureThumb(source: Blob | undefined): Promise<string | undefined> {
  if (source === undefined) return undefined
  try {
    const bitmap = await createImageBitmap(source)
    try {
      const scale = Math.min(1, THUMB_WIDTH / bitmap.width)
      const width = Math.max(1, Math.round(bitmap.width * scale))
      const height = Math.max(1, Math.round(bitmap.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d')
      if (context === null) return undefined
      context.imageSmoothingEnabled = true
      context.imageSmoothingQuality = 'high'
      context.drawImage(bitmap, 0, 0, width, height)
      const url = canvas.toDataURL('image/webp', QUALITY)
      return url.startsWith('data:image/') ? url : undefined
    } finally {
      // Decoded pixels are the expensive part of this; a bubble that never
      // closes its bitmap keeps a full-size frame alive for the page's lifetime.
      bitmap.close()
    }
  } catch {
    return undefined
  }
}
