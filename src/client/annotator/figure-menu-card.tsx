/**
 * The figure's own menu: the file behind it, and the way out to someone who can act
 * on it.
 *
 * Drawn at the pointer and closed by anything else, the way a context menu is
 * everywhere. The rows are decided by `figure-menu.ts` from what the Host can
 * actually do, so this only draws them.
 * @module dsh-figmark/client/annotator/figure-menu-card
 */
import type { ReactNode, RefObject } from 'react'
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
  return (
    <div className="da-menu" ref={props.menuRef} role="menu" aria-label={props.t('menuLabel')}
      style={{ left: props.at.left, top: props.at.top }}>
      {props.rows.map(item => (
        <button key={item.id} type="button" className="da-menu-item" role="menuitem"
          onClick={() => { props.onChoose(item.id) }}>
          {item.label}
        </button>
      ))}
    </div>
  )
}
