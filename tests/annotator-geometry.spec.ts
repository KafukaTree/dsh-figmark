/** How a figure is fitted into the room the panel actually leaves for it. */
import { describe, expect, it } from 'vitest'
import { drawingScale } from '../src/client/annotator/geometry'

describe('drawingScale', () => {
  it("uses the figure's own size before the pane has been measured", () => {
    expect(drawingScale({ zoom: 'fit', fitWidth: 0, fitHeight: 0, surface: null, ownerWidth: undefined })).toBe(1)
  })

  it('leaves an explicit factor alone', () => {
    expect(drawingScale({
      zoom: 2.25, fitWidth: 800, fitHeight: 400,
      surface: { width: 400, height: 200 }, ownerWidth: undefined,
    })).toBe(2.25)
  })

  it('fits the width when no height has been measured', () => {
    expect(drawingScale({
      zoom: 'fit', fitWidth: 400, fitHeight: 0,
      surface: { width: 800, height: 600 }, ownerWidth: undefined,
    })).toBe(0.5)
  })

  it('fits the height when a wide, short pane is the tighter side', () => {
    // Width alone would draw this at 1.5× and put the lower third under the bar.
    expect(drawingScale({
      zoom: 'fit', fitWidth: 900, fitHeight: 150,
      surface: { width: 600, height: 400 }, ownerWidth: undefined,
    })).toBe(0.375)
  })

  it('still honours an owner-owned width and the same height ceiling', () => {
    expect(drawingScale({
      zoom: 'fit', fitWidth: 900, fitHeight: 240,
      surface: { width: 600, height: 400 }, ownerWidth: 300,
    })).toBe(0.5)
  })

  it('keeps the shared smallest and largest factors', () => {
    expect(drawingScale({
      zoom: 'fit', fitWidth: 1, fitHeight: 1,
      surface: { width: 1000, height: 1000 }, ownerWidth: undefined,
    })).toBe(0.05)
    expect(drawingScale({
      zoom: 'fit', fitWidth: 4000, fitHeight: 4000,
      surface: { width: 100, height: 100 }, ownerWidth: undefined,
    })).toBe(1.5)
  })
})
