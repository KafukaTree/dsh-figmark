/** The floating attachment editor is additive and fully reversible. */
import type { Context } from '@deepseek-ai/cordis'
import { describe, expect, it, vi } from 'vitest'
import {
  registerAttachmentAnnotator,
  ATTACHMENT_BODY_ID,
} from '../src/client/attachment-annotator/register'
import {
  AttachmentOverlay,
  type AttachmentInjected,
} from '../src/client/attachment-annotator/editor'
import { defined } from './dom'

describe('attachment feature registration', () => {
  it('registers only the composer overlay and disposes its store', () => {
    const active = new Set<string>()
    const stops: (() => void)[] = []
    const entries: { options: Record<string, unknown>; component: unknown }[] = []
    const conversation = {
      resolveDraftAttachments: vi.fn(),
      createDrafts: vi.fn(),
      releaseDraftAttachment: vi.fn(),
    }
    const ctx = {
      get: (key: string): unknown => key === 'conversation' ? conversation : undefined,
      effect: (run: () => () => void): void => { stops.push(run()) },
    } as unknown as Context
    const slots = {
      inject: (_key: string, run: () => () => void): (() => void) => run(),
      register: (options: Record<string, unknown>, component: unknown): (() => void) => {
        const key = String(options['id'])
        entries.push({ options, component })
        active.add(key)
        return () => { active.delete(key) }
      },
    }

    registerAttachmentAnnotator(ctx, slots)

    expect(entries).toHaveLength(1)
    expect(entries[0]?.component).toBe(AttachmentOverlay)
    expect(entries[0]?.options).toMatchObject({
      name: 'conversation.input.overlay',
      id: ATTACHMENT_BODY_ID,
      order: 80,
    })
    const inject = defined(entries[0]?.options['inject']) as (sessionId: unknown) => AttachmentInjected
    const face = inject('s1')
    expect(face.conversation).toBe(conversation)
    face.store.open('s1', {
      kind: 'image',
      id: 'img',
      file: new File(['x'], 'x.png'),
      previewUrl: 'blob:x',
    })
    const listener = vi.fn()
    face.store.subscribe(listener)
    expect(active.size).toBe(1)

    for (const stop of stops) stop()
    expect(active.size).toBe(0)
    expect(face.store.getSnapshot()).toBeNull()
    face.store.clear()
    expect(listener).not.toHaveBeenCalled()
  })
})
