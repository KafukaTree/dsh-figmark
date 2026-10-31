/** The ordered element levels a single pointer position can select. */
import { describe, expect, it } from 'vitest'
import type { MarkAnchor } from '../src/shared/annotation'
import {
  anchorAtOffset, sameChoiceAnchors, sameChoiceElements, type ElementChoices,
} from '../src/client/element-choice'

/** One element in a ladder. */
function anchor(id: string): MarkAnchor {
  return {
    tag: 'g',
    id,
    title: `${id} title`,
    text: `${id} text`,
    bbox: [1, 2, 3, 4],
    selector: `#${id}`,
  }
}

/** Three levels with the middle one selected by a plain click. */
function choices(): ElementChoices {
  return {
    anchors: [anchor('path'), anchor('artist'), anchor('axes')],
    preferred: 1,
  }
}

describe('choosing an element level', () => {
  it('walks from the default toward a child or a parent and clamps at both ends', () => {
    const levels = choices()
    expect(anchorAtOffset(levels, 0).id).toBe('artist')
    expect(anchorAtOffset(levels, -1).id).toBe('path')
    expect(anchorAtOffset(levels, 1).id).toBe('axes')
    expect(anchorAtOffset(levels, -20).id).toBe('path')
    expect(anchorAtOffset(levels, 20).id).toBe('axes')
  })

  it('treats a different selector sequence or length as a different element tree', () => {
    const levels = choices()
    expect(sameChoiceElements(levels, choices())).toBe(true)
    expect(sameChoiceElements(levels, { ...choices(), anchors: [anchor('path')] })).toBe(false)
    const moved: ElementChoices = {
      ...choices(),
      anchors: [anchor('path'), { ...anchor('artist'), selector: '#other' }, anchor('axes')],
    }
    expect(sameChoiceElements(levels, moved)).toBe(false)
  })

  it('keeps the selected level across a reflow but notices every changed value', () => {
    const levels = choices()
    expect(sameChoiceAnchors(levels, choices())).toBe(true)
    expect(sameChoiceAnchors(levels, { ...choices(), preferred: 0 })).toBe(false)
    expect(sameChoiceAnchors(levels, { ...choices(), anchors: [anchor('path')] })).toBe(false)

    const changes: ((first: MarkAnchor) => MarkAnchor)[] = [
      first => ({ ...first, tag: 'path' }),
      first => ({ ...first, id: 'other' }),
      first => {
        const changed = { ...first }
        delete changed.title
        return changed
      },
      first => ({ ...first, text: 'other text' }),
      first => ({ ...first, selector: '#other' }),
      first => ({ ...first, bbox: [1, 2, 3, 5] }),
    ]
    for (const change of changes) {
      const current = choices()
      const changed = change(current.anchors[0])
      expect(sameChoiceAnchors(levels, { ...current, anchors: [changed, ...current.anchors.slice(1)] })).toBe(false)
    }
  })
})
