/** Browser-only attachment drafts. No prompt, queue, sidecar or send capability lives here. */
import type { AnnotationMark, MarkKind } from '../../shared/annotation'
import { describeMark } from '../../shared/mark-summary'

export interface ImageDraft {
  readonly kind: 'image'
  readonly id: string
  readonly file: File
  readonly previewUrl: string
}
export interface AttachmentJob {
  readonly sessionId: string
  readonly source: ImageDraft
  readonly marks: readonly AnnotationMark[]
  readonly added: { readonly id: string; readonly marks: readonly AnnotationMark[] } | null
}
/** One explicitly opened image at a time; retained across sidebar remounts. */
export function createAttachmentStore() {
  let job: AttachmentJob | null = null
  const listeners = new Set<() => void>()
  const publish = (): void => { for (const listener of listeners) listener() }
  return {
    getSnapshot: (): AttachmentJob | null => job,
    subscribe(this: void, listener: () => void): () => void {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    /** Refuse to overwrite an unfinished image, including one in another Session. */
    open(sessionId: string, source: ImageDraft): boolean {
      if (job !== null) return job.sessionId === sessionId && job.source.id === source.id
      job = { sessionId, source, marks: [], added: null }
      publish()
      return true
    },
    change(source: ImageDraft, marks: readonly AnnotationMark[]): void {
      if (job === null || job.source !== source || job.marks === marks) return
      job = { ...job, marks }
      publish()
    },
    rememberCopy(source: ImageDraft, marks: readonly AnnotationMark[], id: string): void {
      if (job === null || job.source !== source) return
      job = { ...job, added: { marks, id } }
      publish()
    },
    clear(): void { job = null; publish() },
    dispose(): void { job = null; listeners.clear() },
  }
}
export type AttachmentStore = ReturnType<typeof createAttachmentStore>

/** Only these native composer verbs are available to the new editor. */
export interface AttachmentInput {
  readonly draft: string
  readonly attachmentIds: readonly string[]
  readonly phase: string
}
export interface AttachmentConversation {
  resolveDraftAttachments(ids: readonly string[]): readonly ({ readonly kind: string; readonly id: string } | ImageDraft)[]
  createDrafts(sessionId: string, files: readonly File[], uploadImages: boolean): readonly { readonly id: string }[]
  releaseDraftAttachment(id: string): void
}
export interface AttachmentActions {
  addAttachments(ids: readonly string[]): boolean
  setDraft(text: string): void
}
/** Submission phases never accept a result; an attachment sent or removed is never resurrected. */
export function canAttach(job: AttachmentJob, sessionId: string, input: AttachmentInput): boolean {
  return sessionId === job.sessionId && input.attachmentIds.includes(job.source.id)
    && (input.phase === 'plain' || input.phase === 'claimed')
}

/**
 * The text that keeps each numbered comment searchable after the flattened image
 * is staged. The image and the list carry the same ordinals, so the model can
 * connect a sentence to the mark it describes without relying on OCR.
 */
export function attachmentMessage(fileName: string, marks: readonly AnnotationMark[]): string {
  const counted = new Map<MarkKind, number>()
  const lines = marks.map(mark => {
    const ordinal = (counted.get(mark.kind) ?? 0) + 1
    counted.set(mark.kind, ordinal)
    return describeMark(mark, ordinal, 'zh')
  })
  const name = fileName.trim() || '图片'
  return [
    `【附图批注】已附上「${name}」的标注副本，共 ${marks.length} 处。请按编号逐条处理：`,
    ...lines,
    '',
    '逐条修改原图的生成源。',
  ].join('\n')
}

/** Stage one copy and its numbered comments without replacing the original or sending. */
export function attachCopy(
  job: AttachmentJob, sessionId: string, input: AttachmentInput,
  conversation: AttachmentConversation, actions: AttachmentActions, file: File,
): string {
  if (!canAttach(job, sessionId, input)) throw new Error('原附件已移除、已发送，或输入框正在发送。请下载批注副本。')
  // Inline image drafts also work for subagent continuations. Never start a plugin-owned upload.
  const live = conversation.resolveDraftAttachments([job.source.id])
  if (!live.some(draft => draft.id === job.source.id && draft.kind === 'image' && 'file' in draft && draft.file === job.source.file)) throw new Error('原附件已失效，请下载批注副本。')
  const drafts = conversation.createDrafts(sessionId, [file], false)
  const ids = drafts.map(draft => draft.id)
  let attached = false
  try {
    if (ids.length !== 1 || !actions.addAttachments(ids)) throw new Error('输入框未接受副本；原附件保持不变。')
    attached = true
    const message = attachmentMessage(job.source.file.name, job.marks)
    actions.setDraft(input.draft.trim() === '' ? message : `${input.draft}\n\n${message}`)
    return ids[0] as string
  } catch (error) {
    if (attached) {
      try { actions.setDraft(input.draft) } catch { /* the rejected write is already reported below */ }
    }
    for (const id of ids) conversation.releaseDraftAttachment(id)
    throw error
  }
}

/** Older hosts can keep all existing Figmark features without crashing this optional entry. */
export function attachmentConversation(value: unknown): AttachmentConversation | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const candidate = value as Partial<AttachmentConversation>
  return typeof candidate.resolveDraftAttachments === 'function' && typeof candidate.createDrafts === 'function'
    && typeof candidate.releaseDraftAttachment === 'function' ? candidate as AttachmentConversation : undefined
}
