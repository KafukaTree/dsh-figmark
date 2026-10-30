/**
 * The seat the parked card is drawn in, inside the composer card.
 *
 * The conversation package owns the composer: its card is a flex column whose children
 * are the overlay anchor, the attachment rail, the editor and the button row. A dock
 * entry (what the slot catalogue offers) is drawn *above* that card, as a full-width
 * band in the composer stack — which is not where the reader expects the thing they are
 * about to send to be. Attachments live inside the box, so the card goes there too.
 *
 * There is no slot inside the card that a third party may fill: the one in-card seat,
 * `conversation.input.attachments`, is a `single` slot held by the shipped rail, and
 * taking it would take the reader's own image and file previews with it. So the card is
 * drawn from the dock entry that we do own, portalled into a node of our own that sits
 * in the card's own flow — first child, above the rail and the editor, at the rail's
 * horizontal inset. Nothing of the host's DOM is written to, and no host contract
 * changes: this is presentation only.
 *
 * @module dsh-figmark/client/composer-seat
 */

/** Attribute the composer card carries, from the conversation package. */
const CARD = '[data-composer-card]'

/** The region that holds a composer: the stack, the dock and the card are all inside it. */
const REGION = '[data-conversation-region="composer"]'

/** The seat's class, so the stylesheet can inset it like the attachment rail. */
const SEAT_CLASS = 'da-staged-seat'

/**
 * The composer card that belongs to the same composer as this element.
 * @param anchor - a node inside the dock, next to the card but not inside it.
 * @returns the card, or null when this composer has not drawn one.
 */
export function composerCard(anchor: Element): HTMLElement | null {
  let scope: Element | null = anchor.parentElement
  while (scope !== null) {
    const card = scope.querySelector<HTMLElement>(CARD)
    if (card !== null) return card
    scope = scope.parentElement
  }
  return null
}

/**
 * Draw into the composer card, and keep doing so across its re-renders.
 *
 * The card is React's node, so the seat is a foreign first child: a re-render that
 * replaces the card detaches it, and the observer puts it back in the new one. When no
 * card can be found at all, `onChange` is told so and the caller falls back to drawing
 * in the dock it owns.
 * @param anchor - a node inside the dock, used to find the card.
 * @param onChange - told the seat to draw into, or null when there is none.
 * @returns the function that takes the seat down.
 */
export function mountSeat(anchor: Element, onChange: (seat: HTMLElement | null) => void): () => void {
  const seat = document.createElement('div')
  seat.className = SEAT_CLASS
  const place = (): void => {
    const card = composerCard(anchor)
    if (card === null) {
      onChange(null)
      return
    }
    // React inserts its own children relative to the siblings it knows, so the seat
    // stays first until a new card replaces the old one.
    if (card.firstElementChild !== seat) card.prepend(seat)
    onChange(seat)
  }
  place()
  // The region holds the dock and the card both, so a card drawn after the first
  // commit — or a composer that swaps its card — is caught here.
  const region = anchor.closest(REGION) ?? anchor.parentElement
  const observer = new MutationObserver(place)
  if (region !== null) observer.observe(region, { childList: true, subtree: true })
  return () => {
    observer.disconnect()
    seat.remove()
    onChange(null)
  }
}
