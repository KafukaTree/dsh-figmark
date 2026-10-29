/**
 * The figure's own menu: the file behind it, and the way out to someone who can act
 * on it.
 *
 * Drawn at the pointer and closed by anything else, the way a context menu is
 * everywhere. The rows are decided by `figure-menu.ts` from what the Host can
 * actually do, so this only draws them.
 * @module dsh-figmark/client/annotator/figure-menu-card
 */
import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode, RefObject } from 'react'
import { menuStep } from '../figure-menu'
import type { Translate } from '../translate'

/** One row of the menu, already labelled and already decided to be offered. */
export interface MenuRow {
  /** What picking it does. */
  readonly id: string
  /** The words on the row. */
  readonly label: string
}

/** What the figure menu reads and reports. */
export interface FigureMenuCardProps {
  /** The menu's own box, so a press outside it can be recognised. */
  readonly menuRef: RefObject<HTMLDivElement>
  /** Where the pointer put it, in client coordinates. */
  readonly at: { readonly left: number; readonly top: number }
  /** The rows to offer. */
  readonly rows: readonly MenuRow[]
  /** Carry out one row. */
  readonly onChoose: (id: string) => void
  /** The translator seat. */
  readonly t: Translate
}

/**
 * The figure's context menu.
 * @param props - where it is, which rows it offers, and what choosing one does.
 * @returns the menu.
 */
export function FigureMenuCard(props: FigureMenuCardProps): ReactNode {
  const rows = props.rows
  const [on, setOn] = useState(0)
  const items = useRef<(HTMLButtonElement | null)[]>([])

  // The menu takes the keyboard when it opens. A `role="menu"` that leaves focus on the
  // figure promises a pattern the reader cannot reach: arrows would move through
  // nothing and the list would be one Tab stop per row, which is a list, not a menu.
  useEffect(() => {
    // The first row, on mount only: after this the reader's own presses move focus.
    items.current[0]?.focus()
  }, [])

  const onKeyDown = (event: ReactKeyboardEvent): void => {
    const moved = menuStep(event.key, on, rows.length)
    if (moved !== null) {
      event.preventDefault()
      setOn(moved)
      items.current[moved]?.focus()
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      // The menu is only opened when there is a row to offer, and `on` is one of the
      // indexes `menuStep` returned for this list, so the row is always there.
      /* v8 ignore next -- unreachable: see above. */
      const row = rows[on] as MenuRow
      props.onChoose(row.id)
    }
  }

  return (
    <div className="da-menu" ref={props.menuRef} role="menu" aria-label={props.t('menuLabel')}
      style={{ left: props.at.left, top: props.at.top }} onKeyDown={onKeyDown}>
      {/* One roving tab stop: the menu owns the keyboard, so only the row it is on is
          in the tab order. Seven tab stops would let Tab walk out of the menu without
          the menu ever being dismissed. */}
      {rows.map((item, at) => (
        <button key={item.id} type="button" className="da-menu-item" role="menuitem"
          ref={(element) => { items.current[at] = element }}
          tabIndex={at === on ? 0 : -1}
          onClick={() => { props.onChoose(item.id) }}>
          {item.label}
        </button>
      ))}
    </div>
  )
}
