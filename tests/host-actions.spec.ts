// @vitest-environment node
/**
 * The Host carriers the menu uses. Each one answers "did the Host accept it", and
 * a missing service answers "no" rather than throwing — a composition without a
 * desktop loses rows, not the menu.
 */
import { describe, expect, it, vi } from 'vitest'
import { copyImageToClipboard, desktopAvailable, openOnDesktop, revealOnDesktop, type RemoteLike } from '../src/client/host-actions'

const carrier = (session: {
  canOpenWorkspacePath?: () => Promise<{ ok: boolean; value?: boolean }>
  openWorkspacePath?: (request: { path: string; action?: 'reveal' }) => Promise<{ ok: boolean }>
}): RemoteLike => ({ session: session as RemoteLike['session'] })

describe('probing the desktop', () => {
  it('reports what the Host answers', async () => {
    const remote = carrier({ canOpenWorkspacePath: async () => ({ ok: true, value: true }) })
    await expect(desktopAvailable(remote)).resolves.toBe(true)
  })

  it('reads a "no" answer as no desktop', async () => {
    const remote = carrier({ canOpenWorkspacePath: async () => ({ ok: true, value: false }) })
    await expect(desktopAvailable(remote)).resolves.toBe(false)
  })

  it('reads a refused probe as no desktop', async () => {
    const remote = carrier({ canOpenWorkspacePath: async () => ({ ok: false }) })
    await expect(desktopAvailable(remote)).resolves.toBe(false)
  })

  it('reads a thrown probe as no desktop', async () => {
    const remote = carrier({ canOpenWorkspacePath: async () => { throw new Error('offline') } })
    await expect(desktopAvailable(remote)).resolves.toBe(false)
  })

  it('reads a missing service as no desktop', async () => {
    await expect(desktopAvailable(undefined)).resolves.toBe(false)
  })
})

describe('opening on the desktop', () => {
  it('asks for a plain open', async () => {
    const openWorkspacePath = vi.fn(async () => ({ ok: true }))
    await expect(openOnDesktop(carrier({ openWorkspacePath }), '/w/fig1.svg')).resolves.toBe(true)
    expect(openWorkspacePath).toHaveBeenCalledWith({ path: '/w/fig1.svg' })
  })

  it('reports a refusal', async () => {
    const remote = carrier({ openWorkspacePath: async () => ({ ok: false }) })
    await expect(openOnDesktop(remote, '/w/fig1.svg')).resolves.toBe(false)
  })

  it('reports a failure rather than throwing', async () => {
    const remote = carrier({ openWorkspacePath: async () => { throw new Error('no handler') } })
    await expect(openOnDesktop(remote, '/w/fig1.svg')).resolves.toBe(false)
  })

  it('reports a missing service', async () => {
    await expect(openOnDesktop(undefined, '/w/fig1.svg')).resolves.toBe(false)
  })
})

describe('revealing on the desktop', () => {
  it('asks for a reveal, which is a different request from an open', async () => {
    const openWorkspacePath = vi.fn(async () => ({ ok: true }))
    await expect(revealOnDesktop(carrier({ openWorkspacePath }), '/w/fig1.svg')).resolves.toBe(true)
    expect(openWorkspacePath).toHaveBeenCalledWith({ path: '/w/fig1.svg', action: 'reveal' })
  })

  it('reports a refusal', async () => {
    const remote = carrier({ openWorkspacePath: async () => ({ ok: false }) })
    await expect(revealOnDesktop(remote, '/w/fig1.svg')).resolves.toBe(false)
  })

  it('reports a failure rather than throwing', async () => {
    const remote = carrier({ openWorkspacePath: async () => { throw new Error('no desktop') } })
    await expect(revealOnDesktop(remote, '/w/fig1.svg')).resolves.toBe(false)
  })

  it('reports a missing service', async () => {
    await expect(revealOnDesktop(undefined, '/w/fig1.svg')).resolves.toBe(false)
  })
})

describe('putting a picture on the clipboard', () => {
  /** A clipboard stand-in that records what it was handed. */
  const stubClipboard = (write: (() => Promise<void>) | undefined): string[] => {
    const taken: string[] = []
    vi.stubGlobal('navigator', {
      clipboard: write === undefined ? {} : {
        write: async (items: unknown[]) => {
          await write()
          const item = items[0] as { types: string[] }
          taken.push(item.types[0] ?? '')
        },
      },
    })
    return taken
  }

  it('hands the clipboard a PNG', async () => {
    const taken = stubClipboard(async () => {})
    vi.stubGlobal('ClipboardItem', class {
      readonly types: string[]
      constructor(parts: Record<string, Blob>) {
        this.types = Object.keys(parts)
      }
    })
    await expect(copyImageToClipboard(new Blob([new Uint8Array([1])], { type: 'image/png' }))).resolves.toBe(true)
    expect(taken).toEqual(['image/png'])
  })

  it('reports a clipboard that refuses the write', async () => {
    stubClipboard(async () => { throw new Error('denied') })
    vi.stubGlobal('ClipboardItem', class { readonly types: string[] = []; constructor() {} })
    await expect(copyImageToClipboard(new Blob([], { type: 'image/png' }))).resolves.toBe(false)
  })

  it('reports a browser with no write method', async () => {
    stubClipboard(undefined)
    await expect(copyImageToClipboard(new Blob([], { type: 'image/png' }))).resolves.toBe(false)
  })
})
