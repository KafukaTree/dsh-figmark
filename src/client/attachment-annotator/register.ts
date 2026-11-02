/** Reversible registrations for the independent attachment feature. */
import type { Context } from '@deepseek-ai/cordis'
import { AttachmentOverlay, type AttachmentInjected } from './editor'
import { attachmentConversation, createAttachmentStore } from './model'

export const ATTACHMENT_BODY_ID = 'dsh-figmark/attachment'
interface AttachmentSlots {
  inject(key: string, callback: () => () => void): () => void
  register(options: Record<string, unknown>, component: unknown): () => void
}
/**
 * One invisible floating seat. It listens only to its Session's native draft
 * thumbnails, so the shell keeps ownership of uploads, removal and sending.
 */
export function registerAttachmentAnnotator(ctx: Context, slots: AttachmentSlots): void {
  const store = createAttachmentStore()
  ctx.effect(() => () => { store.dispose() }, 'dsh-figmark: attachment draft lifecycle')
  const injected = (_sessionId: unknown): AttachmentInjected => ({
    store,
    conversation: attachmentConversation(ctx.get('conversation')),
  })
  ctx.effect(() => slots.inject('conversation.input.overlay', () => slots.register({
    name: 'conversation.input.overlay',
    id: ATTACHMENT_BODY_ID,
    order: 80,
    inject: injected,
  }, AttachmentOverlay)), 'dsh-figmark: attachment overlay')
}
