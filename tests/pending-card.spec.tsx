// @vitest-environment jsdom
/** The card the reader sees above the composer, and its three ways out of the way. */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AnnotationCard } from '../src/client/annotation-card'
import { zh } from '../src/client/locales'
import { clearParked, parkAnnotation, parkedAnnotation, type ParkedAnnotation } from '../src/client/pending'
import { PendingCard } from '../src/client/pending-card'
import { defined, installDom } from './dom'

/** The message the parked card stands for, exactly as it will be delivered. */
const RAW = '【附图标注】/w/fig.svg（图面 1440×800，标注 1 处）\n\n箭头1 (10,20) → (30,40)，批注：往右上拉一点\n\n逐条改生成源。'

/** The parsed block, as the rule hands it to the card. */
const DATA = {
  file: '/w/fig.svg',
  scope: '图面 1440×800，标注 1 处',
  target: '',
  instruction: '逐条改生成源。',
  html: false,
  marks: [{ label: '箭头1 (10,20) → (30,40)', comment: '往右上拉一点', missing: false, page: undefined }],
}

/** A composer draft the reveal path can write into. */
function draftBox(): { readonly conversation: { input: { shell: () => { snapshot: { draft: string }; setDraft: (text: string) => void } } }; readonly written: string[] } {
  const written: string[] = []
  const shell = {
    snapshot: { draft: '先看这张图' },
    setDraft: (text: string) => { written.push(text) },
  }
  return { written, conversation: { input: { shell: () => shell } } }
}

describe('the card above the composer', () => {
  let root: Root
  let host: HTMLElement

  beforeEach(() => {
    installDom()
    clearParked()
    host = document.createElement('div')
    document.body.appendChild(host)
    root = createRoot(host)
  })

  afterEach(() => {
    act(() => { root.unmount() })
    host.remove()
    clearParked()
  })

  /**
   * Draw the dock for one session.
   * @param props - whatever the case is about.
   */
  function mount(props: { sessionId?: string; t?: (key: string, vars?: Record<string, string | number>) => string; localeId?: string } = { sessionId: 's1' }): void {
    act(() => {
      root.render(<PendingCard {...props} />)
    })
  }

  /**
   * Park one annotation.
   * @param overrides - fields the case is about.
   * @returns the parked entry.
   */
  function park(overrides: Partial<ParkedAnnotation> = {}): ParkedAnnotation {
    const entry: ParkedAnnotation = {
      sessionId: 's1',
      data: DATA,
      raw: RAW,
      conversation: undefined,
      send: async () => {},
      ...overrides,
    }
    parkAnnotation(entry)
    return entry
  }

  /** The button carrying one action, by its class. */
  function action(name: 'send' | 'reveal' | 'drop'): HTMLButtonElement {
    return defined(host.querySelector(`.da-pending-${name}`)) as HTMLButtonElement
  }

  /** Wait for one press to settle. */
  async function press(button: HTMLButtonElement): Promise<void> {
    await act(async () => { button.click() })
  }

  it('draws nothing until something is parked', () => {
    mount()
    expect(host.querySelector('.da-pending')).toBeNull()
  })

  it('draws nothing for a session that has no id', () => {
    park()
    mount({})
    expect(host.querySelector('.da-pending')).toBeNull()
  })

  it('draws the sheet, without a second renderer', () => {
    park()
    mount()
    // The sheet is the transcript's own card, drawn static: the figure, its scope,
    // and nothing to click, because sending is the actions' job.
    expect(host.querySelector('.da-card[data-static]')).not.toBeNull()
    expect(host.querySelector('button.da-card')).toBeNull()
    expect(host.querySelector('.da-card-scope')?.textContent).toBe('fig.svg · 图面 1440×800，标注 1 处')
    // Static is only about the click: the lines still show, because this is the last
    // look the reader gets at the message before it goes.
    expect(host.querySelectorAll('.da-card-row')).toHaveLength(1)
  })

  it('offers the three ways out of the way', () => {
    park({ conversation: draftBox().conversation })
    mount()
    expect([action('send').textContent, action('reveal').textContent, action('drop').textContent])
      .toEqual([zh['pendingSend'], zh['pendingReveal'], zh['pendingDrop']])
  })

  it('offers no way into the draft when there is no composer to write into', () => {
    // The dock is drawn for a session whose composer the plugin cannot reach — a
    // figure opened without the conversation service. Turning the card into text is
    // then a button that cannot work, so it is not drawn at all.
    park()
    mount()
    expect(host.querySelector('.da-pending-reveal')).toBeNull()
  })

  it('speaks the shell locale when no translator is bound', () => {
    park()
    mount({ sessionId: 's1', localeId: 'en' })
    expect(action('send').textContent).toBe('Send to the agent')
  })

  it('sends the parked delivery once, and the card is spent', async () => {
    const send = vi.fn(async () => {})
    park({ send })
    mount()
    await press(action('send'))
    expect(send).toHaveBeenCalledTimes(1)
    expect(parkedAnnotation('s1')).toBeUndefined()
    expect(host.querySelector('.da-pending')).toBeNull()
  })

  it('holds the button while the message is on its way', async () => {
    let release: (() => void) | undefined
    const send = (): Promise<void> => new Promise<void>((resolve) => { release = resolve })
    park({ send })
    mount()
    await act(async () => { action('send').click() })
    expect(action('send').disabled).toBe(true)
    await act(async () => { defined(release)() })
    expect(host.querySelector('.da-pending')).toBeNull()
  })

  it('says why a send failed, and keeps the card', async () => {
    park({ send: async () => { throw new Error('the sessions service is unavailable') } })
    mount()
    await press(action('send'))
    expect(host.querySelector('.da-pending-trouble')?.textContent)
      .toBe(`${zh['pendingFailed']}the sessions service is unavailable`)
    // The annotation is not lost to a failed send: the reader can try again.
    expect(parkedAnnotation('s1')).toBeDefined()
    expect(action('send').disabled).toBe(false)
  })

  it('shows whatever a thrown value says, without pretending it was an error', async () => {
    park({ send: () => Promise.reject('boom') })
    mount()
    await press(action('send'))
    expect(host.querySelector('.da-pending-trouble')?.textContent).toBe(`${zh['pendingFailed']}boom`)
  })

  it('turns the card into editable text in the draft', async () => {
    const draft = draftBox()
    park({ conversation: draft.conversation })
    mount()
    await press(action('reveal'))
    expect(draft.written).toEqual([`先看这张图\n\n${RAW}`])
    expect(host.querySelector('.da-pending')).toBeNull()
  })

  it('says why the draft refused the text, and keeps the card', async () => {
    const conversation = {
      input: { shell: () => { throw new Error('conversation.input: session "s1" resolved no binding') } },
    }
    park({ conversation })
    mount()
    await press(action('reveal'))
    expect(host.querySelector('.da-pending-trouble')?.textContent).toBe('the session has no composer to write into')
    expect(parkedAnnotation('s1')).toBeDefined()
  })

  it('drops the card without sending anything', async () => {
    const send = vi.fn(async () => {})
    park({ send })
    mount()
    await press(action('drop'))
    expect(send).not.toHaveBeenCalled()
    expect(host.querySelector('.da-pending')).toBeNull()
  })

  it('draws a card parked while the dock is already open', () => {
    mount()
    expect(host.querySelector('.da-pending')).toBeNull()
    act(() => { park() })
    expect(host.querySelector('.da-pending')).not.toBeNull()
  })

  it('replaces a card that was parked over', () => {
    park()
    mount()
    act(() => { park({ data: { ...DATA, file: '/w/second.svg' }, raw: RAW.replace('fig.svg', 'second.svg') }) })
    expect(host.querySelector('.da-card-scope')?.textContent).toContain('second.svg')
  })

  it('injects its stylesheet into the document it draws in', () => {
    park()
    mount()
    expect(document.head.querySelector('style[data-dsh-figmark]')).not.toBeNull()
  })

  it('is the same sheet the transcript draws', () => {
    // Not a copy of the card's markup, and not a renderer that merely looks alike.
    park()
    act(() => {
      root.render(<AnnotationCard node={{ data: DATA }} raw={RAW} interactive={false} />)
    })
    expect(host.querySelectorAll('.da-card')).toHaveLength(1)
  })
})
