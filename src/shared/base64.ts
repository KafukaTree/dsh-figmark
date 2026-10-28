/**
 * Base64 for the two directions the plugin needs it.
 *
 * The Host's routes carry bytes inside JSON, and the session prompt carries PNG
 * bytes as a data part, so both halves encode the same way: `btoa` over chunks
 * small enough that spreading a large artifact cannot overflow the argument
 * list. The encoder lives here because a second copy is how the chunk size and
 * the argument-spread limit end up disagreeing.
 * @module dsh-figmark/shared/base64
 */

/** Characters one `fromCharCode` call may see; well under the engine's limit. */
const CHUNK = 0x8000

/**
 * Encode bytes as base64.
 * @param source - bytes, or the blob an export produced.
 * @returns base64 text.
 */
export async function toBase64(source: Blob | Uint8Array): Promise<string> {
  const bytes = source instanceof Uint8Array ? source : new Uint8Array(await source.arrayBuffer())
  let binary = ''
  for (let offset = 0; offset < bytes.length; offset += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + CHUNK))
  }
  return btoa(binary)
}
