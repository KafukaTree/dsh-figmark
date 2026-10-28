/**
 * The pane's width, and the page the reader has asked for.
 *
 * Both are "where the document is looking" rather than "what it holds": the pane's
 * width decides how many pixels a page is rasterized with, and the page number decides
 * which page that is. They belong together because every render is a function of the
 * pair, and because the page number has exactly one decision point — {@link usePaging}
 * — so the two buttons, the arrow keys and the number box cannot disagree.
 * @module dsh-figmark/client/pdf/viewport
 */
import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { clampPage, keyedPage, keyedTurn, parsePageInput } from './paging'

/**
 * Whether a keystroke landed in a field the reader is typing into.
 *
 * An editable region is recognised by its attribute rather than by the
 * `isContentEditable` property, which a rendered frame's own document does not
 * answer for. Any element inside one counts, so a caret nested in a paragraph is
 * as safe as the region itself.
 * @param target - the event's target.
 * @returns whether the keystroke belongs to the field.
 */
export function typingIn(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.closest('[contenteditable]:not([contenteditable="false"])') !== null) return true
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT'
}

/** What the pane's own measurement reports. */
export interface PaneWidth {
  /** The pane's width in CSS pixels; 0 until it has been laid out. */
  readonly width: number
  /** The ref callback the pane element is mounted with. */
  readonly attach: (element: HTMLDivElement | null) => void
  /** The pane element itself, for a body that portals its chrome into it. */
  readonly host: HTMLDivElement | null
}

/**
 * Measure the pane when it appears and whenever it changes.
 *
 * The ref callback owns the observer for exactly the element's lifetime: a null
 * element is the unmount, which is where the observer goes. Width is state rather
 * than a ref because the raster depends on it, and the pane element is state as well
 * because a body has to portal into a node React has already committed.
 *
 * @returns the width, the element, and the callback to mount the pane with.
 */
export function usePaneWidth(): PaneWidth {
  const observerRef = useRef<ResizeObserver | null>(null)
  const [paneWidth, setPaneWidth] = useState(0)
  const [host, setHost] = useState<HTMLDivElement | null>(null)
  const attach = useCallback((element: HTMLDivElement | null): void => {
    setHost(element)
    observerRef.current?.disconnect()
    observerRef.current = null
    if (element === null) return
    setPaneWidth(element.clientWidth)
    const observer = new ResizeObserver(() => { setPaneWidth(element.clientWidth) })
    observer.observe(element)
    observerRef.current = observer
  }, [])
  return { width: paneWidth, attach, host }
}

/** What paging reads and reports. */
export interface Paging {
  /** The page the reader asked for, before the document's length is applied. */
  readonly requested: number
  /** The page the toolbar states: the requested one, clamped to the document. */
  readonly stated: number
  /** Turn to a page, clamped to the document. @param next - the page asked for. */
  readonly goTo: (next: number) => void
  /** The page number box. */
  readonly box: PageBox
}

/** The page number box: what it holds, and how it is committed. */
export interface PageBox {
  /** What the box holds while the reader is typing in it. */
  readonly text: string
  /** Whether the page number is a box right now rather than a label. */
  readonly editing: boolean
  /** Start editing, seeded with the page on screen. */
  readonly begin: () => void
  /** Write what the box holds. @param text - the box's value. */
  readonly write: (text: string) => void
  /** Take the page number the box holds, if it holds one. */
  readonly commit: () => void
  /** Put the box away, keeping whatever was committed. */
  readonly stop: () => void
  /** Enter commits the box; Escape puts the box back to the page on screen. */
  readonly onKeyDown: (event: ReactKeyboardEvent<HTMLInputElement>) => void
}

/**
 * The one place a page number is decided.
 *
 * @param pageCount - how many pages the document has; 0 before it opened.
 * @returns the page asked for, the page stated, and the box over them.
 */
export function usePaging(pageCount: number): Paging {
  const [requested, setRequested] = useState(1)
  const [text, setText] = useState('1')
  const [editing, setEditing] = useState(false)
  const goTo = useCallback((next: number): void => {
    // A document that reports no pages still shows page one, so the clamp carries
    // its own floor. Asking for the page already on screen returns the same number,
    // which React treats as no change at all.
    setRequested(() => clampPage(next, pageCount))
  }, [pageCount])
  const commit = useCallback((): void => {
    const next = parsePageInput(text, pageCount)
    if (next === null) {
      setText(String(requested))
      return
    }
    goTo(next)
    setText(String(next))
  }, [goTo, pageCount, text, requested])
  const onKeyDown = useCallback((event: ReactKeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      event.preventDefault()
      commit()
      setEditing(false)
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      setText(String(requested))
      setEditing(false)
    }
  }, [commit, requested])
  return {
    requested,
    stated: clampPage(requested, pageCount),
    goTo,
    box: {
      text,
      editing,
      begin: () => { setText(String(clampPage(requested, pageCount))); setEditing(true) },
      write: setText,
      commit,
      stop: () => { setEditing(false) },
      onKeyDown,
    },
  }
}

/**
 * Turn to whatever page a keystroke asks for.
 *
 * The keys are read at the document rather than on the page body because paging
 * belongs to the document: the body annotates one page and has no idea there are
 * others, and a keystroke it swallowed would never reach the document at all.
 *
 * @param open - whether a document has opened; nothing is paged before that.
 * @param paging - the page on screen and the one way to change it.
 * @param pageCount - how many pages the document has.
 */
export function usePagingKeys(open: boolean, paging: Paging, pageCount: number): void {
  const { goTo, stated } = paging
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent): void => {
      // A field the reader is typing into belongs to them, not to paging: an arrow
      // there moves the caret, and a page that turned under it would be a document
      // that scrolled away from the sentence being written.
      if (typingIn(event.target)) return
      const turn = keyedTurn(event.key, event)
      if (turn === null) return
      event.preventDefault()
      goTo(keyedPage(turn, stated, pageCount))
    }
    window.addEventListener('keydown', onKeyDown)
    return () => { window.removeEventListener('keydown', onKeyDown) }
  }, [goTo, pageCount, open, stated])
}
