/**
 * The translator seat, and the values a copy string interpolates.
 *
 * These belong to a leaf: the props contract hands a translator around and the
 * copy dictionary is what answers when no seat is bound, so both halves have to
 * name this vocabulary. Keeping it here is what stops the two from naming each
 * other — a cycle between them would leave whichever half loads second reading
 * exports that are still undefined.
 * @module dsh-figmark/client/translate
 */

/** Values interpolated into one copy string. */
export type TranslateVars = Record<string, number | string>

/** The translator seat: a copy key and its interpolation values. */
export type Translate = (key: string, vars?: TranslateVars) => string

/**
 * Fill the `{name}` placeholders a copy string asks for.
 *
 * A placeholder with no value is left standing rather than blanked: the reader
 * sees which number the sentence wanted, and a dictionary that forgets to pass
 * one is visible instead of reading as an empty spot in the middle of a sentence.
 * @param text - the copy string, with `{name}` placeholders.
 * @param vars - the values it asks for.
 * @returns the string with every given placeholder filled in.
 */
export function interpolate(text: string, vars: TranslateVars): string {
  return text.replace(/\{(\w+)\}/gu, (placeholder, name: string) => {
    const value = vars[name]
    return value === undefined ? placeholder : String(value)
  })
}
