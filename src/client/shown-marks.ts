/**
 * Which of a rendered document's marks the document is showing right now.
 *
 * An HTML figure is one document with many surfaces: a deck keeps all of its slides in
 * the same file and shows one of them at a time, and a document that scrolls shows one
 * windowful of its page. A mark is recorded where the reader drew it, in the document's
 * own pixels, and the overlay is drawn over the window — so every mark of every slide
 * lands on the slide in front, which is an annotation the reader never made about the
 * page they are looking at.
 *
 * The document itself is the only authority on which of its elements it is showing, and
 * it can change without telling anyone: a deck's page turns on a keypress, on a click,
 * on a timer. So the answer is not computed once — it is re-read every frame, and only
 * a change is news.
 * @module dsh-figmark/client/shown-marks
 */
import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { AnnotationMark, FigureBox, FigurePoint } from '../shared/annotation'
import { elementBox } from './html-dom'
import { elementAt } from './spotlight'

/** What a rendered document is showing, as the overlay needs it. */
export interface ShownMarks {
  /** Where each shown element is now, in document pixels, by the mark that names it. */
  readonly boxes: ReadonlyMap<string, FigureBox>
  /** The marks whose element is in the file but not on the page in front. */
  readonly away: ReadonlySet<string>
}

/**
 * Read which marks the document in the frame is showing.
 *
 * Only a mark that names an element has an answer: a drawing is somewhere in the
 * document by its own coordinates, whatever page is up, while an element its document
 * has hidden is nowhere the reader can see.
 *
 * An element that is not in the markup at all is deliberately *not* away. The document
 * may have been edited under the mark, or a selector may have gone stale, and a mark
 * that quietly disappears is a worse answer than one that stays where it was drawn: the
 * comment is still the reader's, and the place they made it is the best evidence left
 * of what it was about.
 * @param root - the document to ask, or nothing while the frame has none.
 * @param marks - every mark of the figure.
 * @returns the live boxes of the element marks, and which marks are away.
 */
export function readShownMarks(root: ParentNode | null, marks: readonly AnnotationMark[]): ShownMarks {
  const boxes = new Map<string, FigureBox>()
  const away = new Set<string>()
  if (root === null) return { boxes, away }
  for (const mark of marks) {
    const selector = mark.anchor?.selector
    if (selector === undefined) continue
    const element = elementAt({ root, selector })
    if (element === undefined) continue
    const box = elementBox(element)
    if (box === undefined) {
      away.add(mark.id)
      continue
    }
    // A box that measures nothing is not a page turn either: a document with no layout
    // reports zero for everything it shows, and the mark keeps the box it was drawn
    // with rather than collapsing to a dot at the origin.
    if (box[2] === 0 && box[3] === 0) continue
    if (mark.kind === 'element') boxes.set(mark.id, box)
  }
  return { boxes, away }
}

/**
 * The marks the overlay should draw, given what the document is showing.
 *
 * An element mark's box *is* the element — that is the whole claim such a mark makes —
 * so it is drawn at the element's live box rather than at the box it had the day the
 * reader picked it. A deck that rescales itself, a page that reflows under a resized
 * pane, a slide that scrolls into view: the name stays on the thing it names.
 * @param marks - every mark of the figure.
 * @param shown - what the document is showing, or null when nothing has been read yet.
 * @returns the marks to draw, with element marks moved to where their elements are.
 */
export function shownMarksOf(marks: readonly AnnotationMark[], shown: ShownMarks | null): readonly AnnotationMark[] {
  if (shown === null) return marks
  if (shown.away.size === 0 && shown.boxes.size === 0) return marks
  return marks.flatMap(mark => {
    if (shown.away.has(mark.id)) return []
    const box = shown.boxes.get(mark.id)
    if (box === undefined) return [mark]
    // The element's corners, in the order a mark's points arrive in.
    const corners: readonly FigurePoint[] = [[box[0], box[1]], [box[0] + box[2], box[1] + box[3]]]
    return [{ ...mark, points: corners }]
  })
}

/**
 * Whether two reads say the same thing.
 *
 * The read runs every frame and a frame is not news: comparing by value is what keeps a
 * page that is sitting still from re-rendering the panel sixty times a second.
 * @param left - one read, or null before the first.
 * @param right - the other read.
 * @returns true when both say the same boxes and the same marks are away.
 */
export function sameShownMarks(left: ShownMarks | null, right: ShownMarks | null): boolean {
  if (left === null || right === null) return left === right
  if (left.away.size !== right.away.size || left.boxes.size !== right.boxes.size) return false
  for (const id of left.away) {
    if (!right.away.has(id)) return false
  }
  for (const [id, box] of left.boxes) {
    const other = right.boxes.get(id)
    if (other === undefined) return false
    if (other.some((value, index) => value !== box[index])) return false
  }
  return true
}

/**
 * Follow a rendered document's page as the reader turns it.
 *
 * A frame's document can turn a page for reasons nothing in this panel announces: a
 * script's own key handler, a timer, a class toggled inside the page. Requesting a frame
 * is therefore the only way to be right about it — and the alternative, a listener on
 * the document, would need to know which mutations move an element, which is the
 * layout's question and not one a mutation record answers.
 * @param frame - the frame the document was rendered into.
 * @param marks - every mark of the figure, as they are on this render.
 * @param active - whether there is anything to follow at all.
 * @returns what the document is showing, or null while it has not been read yet.
 */
export function useShownMarks(
  frame: RefObject<HTMLIFrameElement | null>,
  marks: readonly AnnotationMark[],
  active: boolean,
): ShownMarks | null {
  const [shown, setShown] = useState<ShownMarks | null>(null)
  /**
   * The marks the loop should ask about.
   *
   * Kept beside the loop rather than in it: the list changes on every keystroke in the
   * comment pill, and rebuilding the loop there would restart it for a note that says
   * nothing about where anything is.
   */
  const newest = useRef(marks)
  useEffect(() => {
    newest.current = marks
  })
  useEffect(() => {
    if (!active) return undefined
    let handle = 0
    let previous: ShownMarks | null = null
    const tick = (): void => {
      handle = requestAnimationFrame(tick)
      const next = readShownMarks(frame.current?.contentDocument ?? null, newest.current)
      if (sameShownMarks(previous, next)) return
      previous = next
      setShown(next)
    }
    handle = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(handle)
    }
  }, [active, frame])
  return active ? shown : null
}
