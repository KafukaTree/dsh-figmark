/** Attachment staging never borrows the plugin's delivery/queue machinery. */
import { describe, expect, it, vi } from 'vitest'
import { attachmentConversation, attachmentMessage, attachCopy, canAttach, createAttachmentStore, type AttachmentConversation, type AttachmentJob, type ImageDraft } from '../src/client/attachment-annotator/model'
const source: ImageDraft = { kind: 'image', id: 'original', file: new File(['original'], 'figure.png'), previewUrl: 'blob:original' }
const job: AttachmentJob = { sessionId: 's1', source, marks: [], added: null }
const input = { draft: '', attachmentIds: ['original'], phase: 'plain' }
const actions = (addAttachments = vi.fn(() => true), setDraft = vi.fn()) => ({ addAttachments, setDraft })
describe('attachment draft isolation', () => {
  it('retains the last copy identity and refuses late completion from an old image', () => {
    const store = createAttachmentStore()
    store.rememberCopy(source, [], 'late')
    expect(store.getSnapshot()).toBeNull()
    store.open('s1', source)
    store.rememberCopy({ ...source }, [], 'stale')
    expect(store.getSnapshot()?.added).toBeNull()
    const marks = [ { id: 'pin', kind: 'point' as const, color: '#e03131', points: [[2, 3] as const] } ]
    store.rememberCopy(source, marks, 'copy')
    expect(store.getSnapshot()?.added).toEqual({ marks, id: 'copy' })
  })
  it('validates the optional host face, including each missing verb', () => {
    for (const value of [null, undefined, 1, {}, { resolveDraftAttachments() {} }, { resolveDraftAttachments() {}, createDrafts() {} }]) expect(attachmentConversation(value)).toBeUndefined()
    const valid = { resolveDraftAttachments() {}, createDrafts() {}, releaseDraftAttachment() {} }
    expect(attachmentConversation(valid)).toBe(valid)
  })
  it('rechecks the live registry even when React still holds a stale input snapshot', () => {
    const createDrafts = vi.fn(() => [])
    const conversation = { resolveDraftAttachments: () => [{ kind: 'file', id: 'unrelated' }, { ...source, file: new File(['changed'], 'x.png') }], createDrafts, releaseDraftAttachment: vi.fn() }
    expect(() => attachCopy(job, 's1', input, conversation, actions(), source.file)).toThrow('原附件已失效')
    expect(createDrafts).not.toHaveBeenCalled()
    conversation.resolveDraftAttachments = () => [{ kind: 'file', id: source.id }, { kind: 'image', id: source.id }]
    expect(() => attachCopy(job, 's1', input, conversation, actions(), source.file)).toThrow()
  })
  it('retains one draft, refuses an overwrite, publishes actual edits and disposes subscriptions', () => {
    const store = createAttachmentStore()
    const listener = vi.fn()
    const stop = store.subscribe(listener)
    store.change(source, [])
    expect(store.getSnapshot()).toBeNull()
    expect(store.open('s1', source)).toBe(true)
    const marks = [{ id: 'pin', kind: 'point' as const, color: '#e03131', points: [[2, 3] as const] }]
    store.change({ ...source, id: 'stale-job' }, marks)
    expect(store.getSnapshot()?.marks).toEqual([])
    store.change(source, marks)
    store.change(source, marks)
    expect(store.getSnapshot()?.marks).toBe(marks)
    expect(store.open('s1', source)).toBe(true)
    expect(store.open('s1', { ...source, id: 'other' })).toBe(false)
    expect(store.open('s2', source)).toBe(false)
    expect(listener).toHaveBeenCalledTimes(2)
    stop()
    store.clear()
    expect(store.getSnapshot()).toBeNull()
    expect(listener).toHaveBeenCalledTimes(2)
    const afterDispose = vi.fn()
    store.subscribe(afterDispose)
    store.dispose()
    expect(store.getSnapshot()).toBeNull()
    store.open('s1', source)
    expect(afterDispose).not.toHaveBeenCalled()
  })
  it('admits plain/claimed drafts and rejects stale sources, other sessions and all busy phases', () => {
    expect(canAttach(job, 's1', input)).toBe(true)
    expect(canAttach(job, 's1', { ...input, phase: 'claimed' })).toBe(true)
    expect(canAttach(job, 's2', input)).toBe(false)
    expect(canAttach(job, 's1', { ...input, attachmentIds: [] })).toBe(false)
    for (const phase of ['sending', 'submitting', 'adjudicating']) expect(canAttach(job, 's1', { ...input, phase })).toBe(false)
  })
  it('adds a copy and its comments without changing the original, sending or reuploading', () => {
    const createDrafts = vi.fn(() => [{ id: 'copy' }])
    const releaseDraftAttachment = vi.fn()
    const conversation = { createDrafts, releaseDraftAttachment, resolveDraftAttachments: vi.fn(() => [source]) }
    const addAttachments = vi.fn(() => true)
    const setDraft = vi.fn()
    const file = new File(['annotated'], 'figure.annotated.png')
    const markedJob: AttachmentJob = {
      ...job,
      marks: [{ id: 'pin', kind: 'point', color: '#e03131', points: [[20, 30]], detail: '把套筒上移' }],
    }
    attachCopy(markedJob, 's1', input, conversation, { addAttachments, setDraft }, file)
    expect(createDrafts).toHaveBeenCalledWith('s1', [file], false)
    expect(addAttachments).toHaveBeenCalledWith(['copy'])
    expect(setDraft).toHaveBeenCalledWith(attachmentMessage('figure.png', markedJob.marks))
    expect(String(setDraft.mock.calls[0]?.[0])).toContain('批注：把套筒上移')
    expect(releaseDraftAttachment).not.toHaveBeenCalled()
    expect(input.attachmentIds).toEqual(['original'])
    expect(() => attachCopy(job, 's2', input, conversation, { addAttachments, setDraft }, file)).toThrow('原附件')
    expect(createDrafts).toHaveBeenCalledTimes(1)
  })
  it('preserves a typed draft and unwinds both the text and copy when the write fails', () => {
    const createDrafts = vi.fn(() => [{ id: 'copy' }])
    const releaseDraftAttachment = vi.fn()
    const conversation = { createDrafts, releaseDraftAttachment, resolveDraftAttachments: vi.fn(() => [source]) }
    const setDraft = vi.fn()
      .mockImplementationOnce(() => { throw new Error('editor refused') })
      .mockImplementationOnce(() => { throw new Error('restore refused') })
    expect(() => attachCopy({
      ...job,
      marks: [{ id: 'pin', kind: 'point', color: '#e03131', points: [[2, 3]], detail: '改这里' }],
    }, 's1', { ...input, draft: '原有文字' }, conversation, {
      addAttachments: () => true,
      setDraft,
    }, source.file)).toThrow('editor refused')
    expect(setDraft.mock.calls[0]?.[0]).toContain('原有文字\n\n【附图批注】')
    expect(setDraft).toHaveBeenLastCalledWith('原有文字')
    expect(releaseDraftAttachment).toHaveBeenCalledWith('copy')
  })
  it('names a nameless source and accepts an empty comment list', () => {
    expect(attachmentMessage('   ', [])).toContain('「图片」的标注副本，共 0 处')
  })
  it.each(['refused', 'throws', 'zero', 'multiple'])('reclaims only newly-created drafts after %s', kind => {
    const drafts = kind === 'zero' ? [] : kind === 'multiple' ? [{ id: 'a' }, { id: 'b' }] : [{ id: 'a' }]
    const releaseDraftAttachment = vi.fn()
    const conversation: AttachmentConversation = { createDrafts: () => drafts, releaseDraftAttachment, resolveDraftAttachments: () => [source] }
    const addAttachments = vi.fn(() => { if (kind === 'throws') throw new Error('native failure'); return false })
    const setDraft = vi.fn()
    expect(() => attachCopy(job, 's1', input, conversation, { addAttachments, setDraft }, source.file)).toThrow()
    expect(setDraft).not.toHaveBeenCalled()
    expect(releaseDraftAttachment.mock.calls.flat()).toEqual(drafts.map(draft => draft.id))
    expect(releaseDraftAttachment).not.toHaveBeenCalledWith('original')
  })
})
