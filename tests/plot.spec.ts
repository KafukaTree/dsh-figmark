/** How much paper a drawing needs, and where the figure sits on it. */
import { describe, expect, it } from 'vitest'
import type { AnnotationMark } from '../src/shared/annotation'
import { PLOT_MARGIN, plotBounds } from '../src/client/plot'
import { markOutline } from '../src/client/render'

describe('the paper a drawing needs', () => {
  const box = (points: readonly [number, number][]): AnnotationMark => ({
    id: 'm', kind: 'rect', color: '#e03131', points,
  })
  /** The box a mark really covers once drawn, which is what the paper measures. */
  const drawn = (mark: AnnotationMark, unit = 1): { x: number; y: number; width: number; height: number } => {
    const outline = markOutline(mark, unit)
    if (outline === undefined) throw new Error('the fixture mark has no geometry')
    return outline
  }

  it('gives a figure whose marks stay inside it exactly its own box', () => {
    // The ordinary case: nothing has left the figure, so nothing about the picture
    // changes and no margin is added on any side.
    const paper = plotBounds(400, 300, [box([[10, 10], [100, 80]])])
    expect(paper).toEqual({ x: 0, y: 0, width: 400, height: 300 })
  })

  it('grows to hold a box drawn past the left and top edges, with a margin', () => {
    // Boxing the margin a plot clips means drawing outside the axes. The paper has to
    // reach it, or the annotation the reader actually meant is cropped away.
    const mark = box([[-40, -30], [50, 40]])
    const outline = drawn(mark)
    const paper = plotBounds(400, 300, [mark])
    // The drawn box, not the stored points: a stroke is half its width wide on each
    // side, so even an exactly-on-the-edge mark reaches past it.
    expect(paper.x).toBe(outline.x - PLOT_MARGIN)
    expect(paper.y).toBe(outline.y - PLOT_MARGIN)
    expect(paper.x).toBeLessThan(0)
    expect(paper.y).toBeLessThan(0)
    // The right and bottom edges never left the figure, so the paper still ends there.
    expect(paper.x + paper.width).toBe(400)
    expect(paper.y + paper.height).toBe(300)
  })

  it('grows to hold a box drawn past the right and bottom edges', () => {
    const mark = box([[350, 250], [460, 380]])
    const outline = drawn(mark)
    const paper = plotBounds(400, 300, [mark])
    expect(paper.x).toBe(0)
    expect(paper.y).toBe(0)
    expect(paper.x + paper.width).toBe(outline.x + outline.width + PLOT_MARGIN)
    expect(paper.y + paper.height).toBe(outline.y + outline.height + PLOT_MARGIN)
  })

  it('takes the union of every mark, not just the worst one', () => {
    const near = box([[-20, 10], [50, 50]])
    const far = box([[100, 200], [430, 330]])
    const paper = plotBounds(400, 300, [near, far])
    const left = drawn(near)
    const right = drawn(far)
    expect(paper.x).toBe(left.x - PLOT_MARGIN)
    expect(paper.y).toBe(0)
    expect(paper.x + paper.width).toBe(right.x + right.width + PLOT_MARGIN)
    expect(paper.y + paper.height).toBe(right.y + right.height + PLOT_MARGIN)
  })

  it('pads only the sides that actually grew', () => {
    // A margin on all four sides would make every ordinary figure slightly smaller in
    // its own panel for no reason; only the side a mark left gets paper beside it.
    const mark = box([[300, 100], [500, 200]])
    const outline = drawn(mark)
    const paper = plotBounds(400, 300, [mark])
    expect(paper.x).toBe(0)
    expect(paper.y).toBe(0)
    expect(paper.width).toBe(outline.x + outline.width + PLOT_MARGIN)
    expect(paper.height).toBe(300)
  })

  it('measures the drawn extent, not the stored points', () => {
    // An arrow's head stands out past its own points, so a mark that lands inside the
    // figure can still reach past it.
    const arrow: AnnotationMark = {
      id: 'a', kind: 'arrow', color: '#e03131', weight: 3, points: [[10, 150], [395, 150]],
    }
    const outline = drawn(arrow)
    const paper = plotBounds(400, 300, [arrow])
    expect(outline.width).toBeGreaterThan(300)
    // Whatever the outline reaches, the paper covers it with a margin on that side.
    expect(paper.x + paper.width).toBeGreaterThanOrEqual(outline.x + outline.width)
  })

  it('scales the measured extent by the figure unit', () => {
    // A heavier pen draws a wider stroke, so the paper grows by more on the same mark.
    const mark = box([[-40, -30], [50, 40]])
    const thin = plotBounds(400, 300, [mark], 1)
    const thick = plotBounds(400, 300, [mark], 3)
    expect(thick.x).toBeLessThan(thin.x)
    expect(thick.y).toBeLessThan(thin.y)
    expect(thick.x + thick.width).toBe(thin.x + thin.width)
  })

  it('leaves a mark with no geometry out of the union', () => {
    const empty: AnnotationMark = { id: 'e', kind: 'pen', color: '#e03131', points: [] }
    expect(plotBounds(400, 300, [empty])).toEqual({ x: 0, y: 0, width: 400, height: 300 })
  })
})
