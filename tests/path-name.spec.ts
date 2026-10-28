/** The two path-name readings the whole plugin shares. */
import { describe, expect, it } from 'vitest'
import { baseNameOf, suffixOf } from '../src/shared/path-name'

describe('base names', () => {
  it('takes the last segment of a POSIX path', () => {
    expect(baseNameOf('/w/figures/fig1.svg')).toBe('fig1.svg')
  })

  it('takes the last segment of a Windows path too', () => {
    expect(baseNameOf('C:\\w\\figures\\fig1.svg')).toBe('fig1.svg')
  })

  it('answers the whole string for a bare name', () => {
    expect(baseNameOf('fig1.svg')).toBe('fig1.svg')
  })

  it('answers nothing for a directory', () => {
    expect(baseNameOf('/w/figures/')).toBe('')
  })
})

describe('suffixes', () => {
  it('lower-cases the suffix after the last dot', () => {
    expect(suffixOf('/w/FIG1.SVG')).toBe('svg')
  })

  it('reads a Windows-separated path as the same suffix', () => {
    expect(suffixOf('C:\\w\\figures\\fig1.PNG')).toBe('png')
  })

  it('treats a leading dot as the whole name rather than a separator', () => {
    expect(suffixOf('/w/.hidden')).toBe('')
  })

  it('answers nothing for a name with no dot at all', () => {
    expect(suffixOf('/w/noextension')).toBe('')
  })
})
