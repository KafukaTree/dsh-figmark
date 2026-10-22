/**
 * The drawing choices that outlive a figure.
 *
 * What is tested here is the parsing: a preference record comes from storage, which
 * anything on the page can write to and which a previous version of this plugin may
 * have written in another shape. Every branch of "the record is wrong" has to end in
 * a state the surface can draw.
 */
import { describe, expect, it } from 'vitest'
import {
  PREFERENCES_KEY,
  readPreferences,
  rememberPreferences,
  type PreferenceStore,
} from '../src/client/preferences'

/** A store holding one value, recording every write. */
function storeOf(value: string | null): PreferenceStore & { readonly writes: string[] } {
  const writes: string[] = []
  return {
    getItem: (key: string) => (key === PREFERENCES_KEY ? value : null),
    setItem: (key: string, next: string) => {
      if (key === PREFERENCES_KEY) writes.push(next)
    },
    writes,
  }
}

/** The JSON a store would hold for one set of choices. */
function json(value: unknown): string {
  return JSON.stringify(value)
}

describe('the drawing preferences a session starts from', () => {
  it('defaults when nothing was ever stored', () => {
    expect(readPreferences(storeOf(null))).toEqual({})
  })

  it('defaults when there is no storage at all', () => {
    expect(readPreferences(undefined)).toEqual({})
  })

  it('reads the colour that was stored', () => {
    const store = storeOf(json({ color: '#f08c00' }))
    expect(readPreferences(store)).toEqual({ color: '#f08c00' })
  })

  it('drops a colour that is not one this plugin writes', () => {
    const store = storeOf(json({ color: 'red' }))
    expect(readPreferences(store)).toEqual({})
  })

  it('defaults the parts a stored record leaves out', () => {
    expect(readPreferences(storeOf(json({ color: '#2f9e44' })))).toEqual({ color: '#2f9e44' })
  })

  it('defaults a store whose bytes no longer parse', () => {
    expect(readPreferences(storeOf('{ not json'))).toEqual({})
  })

  it('defaults a store holding something that is not a record', () => {
    expect(readPreferences(storeOf(json([1, 2, 3])))).toEqual({})
    expect(readPreferences(storeOf(json('a string')))).toEqual({})
    expect(readPreferences(storeOf(json(null)))).toEqual({})
  })

  it('defaults when the store throws on read', () => {
    const store: PreferenceStore = {
      getItem: () => { throw new Error('denied') },
      setItem: () => {},
    }
    expect(readPreferences(store)).toEqual({})
  })
})

describe('the spots the floating strips are parked in', () => {
  it('reads both spots back as fractions of the panel', () => {
    const stored = json({ palette: { x: 0.25, y: 0.75 }, bar: { x: 0.5, y: 0.9 } })
    expect(readPreferences(storeOf(stored))).toEqual({
      palette: { x: 0.25, y: 0.75 },
      bar: { x: 0.5, y: 0.9 },
    })
  })

  it('pulls a spot that escaped the panel back onto it', () => {
    const stored = json({ palette: { x: -2, y: 5 } })
    expect(readPreferences(storeOf(stored)).palette).toEqual({ x: 0, y: 1 })
  })

  it('drops a spot that is not two numbers', () => {
    for (const palette of [{ x: 0.5 }, { x: '0.5', y: 0.5 }, { x: 0.5, y: null }, 7, null]) {
      expect(readPreferences(storeOf(json({ palette }))).palette).toBeUndefined()
    }
  })

  it('writes both spots, and leaves out the ones never moved', () => {
    const store = storeOf(null)
    rememberPreferences({
      palette: { x: 0.1, y: 0.2 },
      bar: { x: 0.3, y: 0.4 },
    }, store)
    expect(JSON.parse(store.writes[0] ?? '')).toMatchObject({
      palette: { x: 0.1, y: 0.2 },
      bar: { x: 0.3, y: 0.4 },
    })
    const { writes } = store
    rememberPreferences({}, store)
    expect(JSON.parse(writes[1] ?? '')).not.toHaveProperty('palette')
    expect(JSON.parse(writes[1] ?? '')).not.toHaveProperty('bar')
  })
})

describe('remembering the drawing preferences', () => {
  it('writes the colour the reader chose', () => {
    const store = storeOf(null)
    rememberPreferences({ color: '#1971c2' }, store)
    expect(store.writes).toHaveLength(1)
    expect(JSON.parse(store.writes[0] ?? '')).toEqual({ color: '#1971c2' })
  })

  it('leaves the colour out when the reader never chose one', () => {
    const store = storeOf(null)
    rememberPreferences({}, store)
    expect(JSON.parse(store.writes[0] ?? '')).toEqual({})
  })

  it('stays silent when the store refuses the write', () => {
    const store: PreferenceStore = {
      getItem: () => null,
      setItem: () => { throw new Error('quota') },
    }
    expect(() => { rememberPreferences({}, store) }).not.toThrow()
  })

  it('stays silent when there is no storage at all', () => {
    expect(() => { rememberPreferences({}, undefined) }).not.toThrow()
  })

  it('reads back what it wrote', () => {
    const store = storeOf(null)
    rememberPreferences({ color: '#e03131' }, store)
    const written = store.writes[0] ?? ''
    expect(readPreferences(storeOf(written))).toEqual({ color: '#e03131' })
  })
})

describe('the browser storage the defaults come from', () => {
  /** Replace `localStorage` for one test, restoring it afterwards. */
  function withLocalStorage(value: () => unknown, body: () => void): void {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get: value })
    try {
      body()
    } finally {
      if (original === undefined) delete (globalThis as { localStorage?: unknown }).localStorage
      else Object.defineProperty(globalThis, 'localStorage', original)
    }
  }

  it('falls back to the defaults in a document that denies storage', () => {
    withLocalStorage(() => { throw new Error('SecurityError') }, () => {
      expect(readPreferences()).toEqual({
        })
    })
  })

  it('falls back to the defaults when the shell exposes no storage', () => {
    withLocalStorage(() => null, () => {
      expect(readPreferences()).toEqual({
        })
    })
  })

  it('writes through the browser storage by default', () => {
    const cleared: string[] = []
    const fake = {
      getItem: () => null,
      setItem: (key: string, next: string) => { cleared.push(`${key}=${next}`) },
    }
    withLocalStorage(() => fake, () => {
      rememberPreferences({ color: '#e03131' })
    })
    expect(cleared).toEqual([`${PREFERENCES_KEY}=${JSON.stringify({ color: '#e03131' })}`])
  })
})
