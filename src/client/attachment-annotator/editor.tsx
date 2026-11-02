/** A comp-access annotation overlay opened from a composer image thumbnail. */
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { MAX_DETAIL_CHARS, type AnnotationMark, type FigurePoint } from '../../shared/annotation'
import { Canvas, type CanvasInput, type Tool } from '../Canvas'
import { useAnnotationHistory } from '../annotator/history'
import {
  CloseIcon,
  CopyIcon,
  DownloadIcon,
  POINTER_PATH,
  RedoIcon,
  ToolIcon,
  UndoIcon,
} from '../annotator/icons'
import {
  detailedMarks,
  movedMarks,
  patchedMarks,
  removedMarks,
} from '../annotator/mark-edits'
import {
  attachCopy,
  canAttach,
  type AttachmentActions,
  type AttachmentConversation,
  type AttachmentInput,
  type AttachmentJob,
  type AttachmentStore,
  type ImageDraft,
} from './model'
import {
  downloadAttachment,
  exportAttachment,
  type AttachmentSize,
} from './export'
import { ATTACHMENT_CSS } from './styles'

export interface AttachmentInjected {
  readonly store: AttachmentStore
  readonly conversation: AttachmentConversation | undefined
}

export interface AttachmentProps extends AttachmentInjected {
  readonly sessionId: string
  readonly useInput: <T>(select: (input: AttachmentInput) => T) => T
  readonly inputActions: AttachmentActions
}

type DrawingTool = Exclude<Tool, 'element'>

const TOOL_LABELS: Readonly<Record<DrawingTool, string>> = {
  select: '选择',
  pen: '画笔',
  arrow: '箭头',
  rect: '矩形',
  ellipse: '椭圆',
  point: 'Pin 评论',
}
const TOOL_ORDER: readonly DrawingTool[] = [
  'select',
  'pen',
  'arrow',
  'rect',
  'ellipse',
  'point',
]
const TOOLS: readonly [DrawingTool, string][] = TOOL_ORDER.map(
  tool => [tool, TOOL_LABELS[tool]],
)
const ZOOMS = [1, 1.5, 2, 4] as const
type Zoom = (typeof ZOOMS)[number]
const ZOOM_IN: Readonly<Record<Zoom, Zoom>> = { 1: 1.5, 1.5: 2, 2: 4, 4: 4 }
const ZOOM_OUT: Readonly<Record<Zoom, Zoom>> = { 1: 1, 1.5: 1, 2: 1.5, 4: 2 }

function PointerIcon(): ReactNode {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={POINTER_PATH} />
    </svg>
  )
}

function ToolGlyph({ tool }: { readonly tool: DrawingTool }): ReactNode {
  return tool === 'select' ? <PointerIcon /> : ToolIcon(tool)
}

function imagesOf(
  conversation: AttachmentConversation | undefined,
  attachmentIds: readonly string[],
): readonly ImageDraft[] {
  if (conversation === undefined) return []
  return conversation
    .resolveDraftAttachments(attachmentIds)
    .filter((draft): draft is ImageDraft => draft.kind === 'image' && 'file' in draft)
}

/** Where a mark's adjacent comment should be anchored, in figure pixels. */
export function attachmentFocusPoint(mark: AnnotationMark): FigurePoint {
  if (mark.kind === 'arrow') return mark.points[mark.points.length - 1] ?? [0, 0]
  if (mark.kind === 'rect' || mark.kind === 'ellipse') {
    const first = mark.points[0] ?? [0, 0]
    const second = mark.points[1] ?? first
    return [(first[0] + second[0]) / 2, (first[1] + second[1]) / 2]
  }
  if (mark.kind === 'pen') {
    const points = mark.points.length === 0 ? [[0, 0] as const] : mark.points
    const xs = points.map(point => point[0])
    const ys = points.map(point => point[1])
    return [
      (Math.min(...xs) + Math.max(...xs)) / 2,
      (Math.min(...ys) + Math.max(...ys)) / 2,
    ]
  }
  return mark.points[0] ?? [0, 0]
}

function canEditAttachment(job: AttachmentJob, sessionId: string, input: AttachmentInput): boolean {
  return canAttach(job, sessionId, input)
}

/** Mounted once per Session. It has no visible row until a draft image is clicked. */
export function AttachmentOverlay(props: AttachmentProps): ReactNode {
  const { store, sessionId, conversation, useInput } = props
  const draft = useInput(input => input.draft)
  const attachmentIds = useInput(input => input.attachmentIds)
  const phase = useInput(input => input.phase)
  const input = { draft, attachmentIds, phase }
  const job = useSyncExternalStore(store.subscribe, store.getSnapshot)
  const images = imagesOf(conversation, attachmentIds)
  const imagesRef = useRef(images)
  const pendingThumbnail = useRef<string | null>(null)
  const anchor = useRef<HTMLSpanElement>(null)
  imagesRef.current = images

  useEffect(() => {
    const card = anchor.current?.closest('[data-composer-card]')
    if (card === null || card === undefined) return
    const openImage = (event: Event): void => {
      if (!(event instanceof MouseEvent)) return
      if (event.button !== 0) return
      const target = event.target
      if (!(target instanceof Element)) return
      const imageNode = target instanceof HTMLImageElement
        ? target
        : target.closest('button')?.querySelector('img') ?? null
      if (imageNode === null) return
      const previewUrl = imageNode.getAttribute('src')
      if (previewUrl === null) return
      const image = imagesRef.current.find(draft => draft.previewUrl === previewUrl)
      if (image === undefined && imagesRef.current.length > 0) return
      // Native thumbnails open the shell's read-only lightbox. Taking this one press
      // at the composer card keeps that lightbox untouched for every non-draft image.
      event.preventDefault()
      event.stopPropagation()
      if (image !== undefined) {
        store.open(sessionId, image)
        return
      }
      // A click can arrive in the same paint as the host's attachment state update.
      // Remember its exact preview URL and open as soon as the draft resolves.
      pendingThumbnail.current = previewUrl
    }
    card.addEventListener('click', openImage, true)
    return () => { card.removeEventListener('click', openImage, true) }
  }, [sessionId, store])

  useEffect(() => {
    const previewUrl = pendingThumbnail.current
    if (previewUrl === null) return
    const image = images.find(draft => draft.previewUrl === previewUrl)
    if (image === undefined) return
    pendingThumbnail.current = null
    store.open(sessionId, image)
  }, [images, sessionId, store])

  useEffect(() => {
    if (job === null) return
    if (job.sessionId !== sessionId || !canEditAttachment(job, sessionId, input)) store.clear()
  }, [input.attachmentIds, input.phase, job, sessionId, store])

  return (
    <>
      <span ref={anchor} className="da-attachment-anchor" aria-hidden="true" />
      {job !== null && job.sessionId === sessionId
        ? createPortal(
            <AttachmentEditor
              key={`${job.sessionId}/${job.source.id}`}
              {...props}
              job={job}
            />,
            document.body,
          )
        : null}
    </>
  )
}

/** The whole editor is one modal surface; the host's own composer remains intact. */
function AttachmentEditor(props: AttachmentProps & { readonly job: AttachmentJob }): ReactNode {
  const { store, sessionId, conversation, useInput, inputActions, job } = props
  const draft = useInput(input => input.draft)
  const attachmentIds = useInput(input => input.attachmentIds)
  const phase = useInput(input => input.phase)
  const input = { draft, attachmentIds, phase }
  const history = useAnnotationHistory(job.marks)
  const latest = useRef({ input, sessionId })
  latest.current = { input, sessionId }
  const mounted = useRef(true)
  const root = useRef<HTMLElement>(null)
  const paper = useRef<HTMLDivElement>(null)
  const viewport = useRef<HTMLDivElement>(null)
  const canvasInput = useRef<CanvasInput | null>(null)
  const busyRef = useRef(false)
  const [previewUrl, setPreviewUrl] = useState<string>()
  const [tool, setTool] = useState<DrawingTool>('select')
  const [color, setColor] = useState('#e03131')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [size, setSize] = useState<AttachmentSize | null>(null)
  const [zoom, setZoom] = useState<Zoom>(1)
  const [viewportSize, setViewportSize] = useState({ width: 760, height: 520 })
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)

  useEffect(() => {
    mounted.current = true
    root.current?.focus()
    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    const url = URL.createObjectURL(job.source.file)
    setPreviewUrl(url)
    return () => { URL.revokeObjectURL(url) }
  }, [job.source.file])

  useEffect(() => {
    store.change(job.source, history.marks)
  }, [history.marks, job.source, store])

  useEffect(() => {
    const node = viewport.current
    /* v8 ignore next -- the effect runs after the stage ref has attached. */
    if (node === null) return
    const measure = (): void => {
      setViewportSize({
        width: Math.max(280, node.clientWidth),
        height: Math.max(240, node.clientHeight),
      })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => { observer.disconnect() }
  }, [])

  const fit = size === null
    ? 1
    : Math.min(
        1,
        Math.max(0.1, (viewportSize.width - 112) / size.width),
        Math.max(0.1, (viewportSize.height - 56) / size.height),
      )
  const scale = fit * zoom
  const selected = history.marks.find(mark => mark.id === selectedId) ?? null
  const ready = canEditAttachment(job, sessionId, input) && conversation !== undefined
  const percentage = Math.round(zoom * 100)

  const select = (id: string | null): void => { setSelectedId(id) }
  const remove = (id: string): void => {
    history.commit(removedMarks(history.marks, id))
    setSelectedId(null)
  }
  const requestClose = (): void => {
    canvasInput.current?.cancel()
    if (history.marks.length === 0) store.clear()
    else setConfirmClose(true)
  }
  const finish = async (download: boolean): Promise<void> => {
    const liveConversation = conversation
    if (busyRef.current || size === null || history.marks.length === 0) return
    if (!download && (!ready || liveConversation === undefined)) return
    canvasInput.current?.cancel()
    busyRef.current = true
    setBusy(true)
    setNotice(download ? '正在生成 PNG…' : '正在生成标注副本…')
    try {
      const file = await exportAttachment(job.source.file, size, history.marks)
      if (!mounted.current || store.getSnapshot()?.source !== job.source) return
      const editor = root.current
      if (
        editor !== null
        && typeof editor.checkVisibility === 'function'
        && !editor.checkVisibility()
      ) throw new Error('标注浮层已关闭，请重新打开后重试')
      if (download) {
        downloadAttachment(file)
        setNotice('已下载 PNG；原图和输入框未改变。')
        return
      }
      if (store.getSnapshot()?.marks !== history.marks) {
        throw new Error('生成过程中批注已更改，请重新生成')
      }
      /* v8 ignore next -- the callable form above already refused an absent Host. */
      if (liveConversation === undefined) return
      const live = latest.current
      const id = attachCopy(
        job,
        live.sessionId,
        live.input,
        liveConversation,
        inputActions,
        file,
      )
      store.rememberCopy(job.source, history.marks, id)
      // The visible result is the new attachment in the composer. Closing here also
      // prevents a second copy of the same marks from being mistaken for a revision.
      store.clear()
    } catch (error) {
      if (mounted.current && store.getSnapshot() !== null) {
        setNotice(`生成或加入副本失败：${String(error)}。批注已保留，可重试或下载。`)
      }
    } finally {
      busyRef.current = false
      if (mounted.current && store.getSnapshot() !== null) setBusy(false)
    }
  }

  return (
    <section
      ref={root}
      className="da-attachment"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="附图标注编辑器"
      onKeyDown={event => {
        // Keep composer shortcuts out of this modal. Text fields keep their native
        // editing keys, including undo.
        event.stopPropagation()
        if (
          event.target instanceof HTMLTextAreaElement
          || event.target instanceof HTMLInputElement
        ) return
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
          event.preventDefault()
          if (event.shiftKey) history.redo()
          else history.undo()
        } else if (event.key === 'Escape') {
          canvasInput.current?.cancel()
          setSelectedId(null)
          requestClose()
        } else if (
          (event.key === 'Delete' || event.key === 'Backspace')
          && selectedId !== null
        ) {
          event.preventDefault()
          remove(selectedId)
        }
      }}
    >
      <style>{ATTACHMENT_CSS}</style>
      <div
        className="da-attachment-backdrop"
        onPointerDown={event => {
          if (event.target === event.currentTarget) requestClose()
        }}
      >
        <div className="da-attachment-dialog">
          <div className="da-attachment-stage" ref={viewport}>
            <div
              className="da-attachment-canvas"
              style={
                size === null
                  ? {}
                  : { width: size.width * scale, height: size.height * scale }
              }
            >
              <div
                ref={paper}
                className="da-attachment-paper"
                data-busy={busy || undefined}
                style={
                  size === null
                    ? {}
                    : {
                        width: size.width,
                        height: size.height,
                        transform: `scale(${scale})`,
                      }
                }
                onPointerDownCapture={event => {
                  if (!busyRef.current) return
                  event.preventDefault()
                  event.stopPropagation()
                }}
              >
                {previewUrl !== undefined && (
                  <img
                    src={previewUrl}
                    alt="待标注原图"
                    draggable={false}
                    onLoad={event => {
                      const image = event.currentTarget
                      if (image.naturalWidth === 0 || image.naturalHeight === 0) {
                        setSize(null)
                        setNotice('图片尺寸无效。')
                        return
                      }
                      setSize({ width: image.naturalWidth, height: image.naturalHeight })
                    }}
                    onError={() => {
                      setSize(null)
                      setNotice('原图加载失败；请重新添加图片后重试。')
                    }}
                  />
                )}
                {size !== null && (
                  <Canvas
                    width={size.width}
                    height={size.height}
                    marks={history.marks}
                    tool={tool}
                    color={color}
                    containerRef={paper}
                    inputRef={canvasInput}
                    anchoring={false}
                    scale={scale}
                    selectedId={selectedId}
                    onSelect={select}
                    onAdd={mark => {
                      if (history.marks.length >= 100) {
                        setNotice('单张图片最多 100 条批注。')
                        return
                      }
                      history.commit([...history.marks, mark])
                    }}
                    onMove={(id, points, anchor) => {
                      const next = movedMarks(history.marks, id, points, anchor)
                      if (next !== null) history.commit(next)
                    }}
                    onUpdate={(id, patch) => {
                      history.commit(patchedMarks(history.marks, id, patch))
                    }}
                    onRemove={remove}
                    onEdit={id => {
                      setSelectedId(id)
                      setTool('select')
                    }}
                    onDrawn={id => {
                      setSelectedId(id)
                      if (tool !== 'pen') setTool('select')
                    }}
                  />
                )}
                {selected !== null && size !== null && (
                  <CommentPill
                    mark={selected}
                    size={size}
                    scale={scale}
                    onChange={value => {
                      history.amend(marks => detailedMarks(marks, selected.id, value))
                    }}
                    onClose={() => { setSelectedId(null) }}
                  />
                )}
              </div>
            </div>

            <div className="da-attachment-rail" role="toolbar" aria-label="绘图工具">
              <button
                type="button"
                className="da-attachment-tool da-attachment-close"
                aria-label="关闭附图标注"
                title="关闭"
                onClick={requestClose}
              >
                <CloseIcon />
              </button>
              <span className="da-attachment-separator" />
              {TOOLS.map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  className="da-attachment-tool"
                  aria-label={label}
                  title={label}
                  aria-pressed={tool === value}
                  onClick={() => {
                    canvasInput.current?.cancel()
                    setTool(value)
                  }}
                >
                  <ToolGlyph tool={value} />
                </button>
              ))}
              <span className="da-attachment-separator" />
              <label
                className="da-attachment-color"
                title="批注颜色"
                style={{ '--da-accent': color } as CSSProperties}
              >
                <input
                  type="color"
                  aria-label="批注颜色"
                  value={color}
                  onChange={event => {
                    setColor(event.target.value)
                    if (selectedId !== null) {
                      history.commit(
                        patchedMarks(history.marks, selectedId, {
                          color: event.target.value,
                        }),
                      )
                    }
                  }}
                />
              </label>
              <button
                type="button"
                className="da-attachment-tool"
                aria-label="撤销"
                title="撤销"
                aria-disabled={history.depth.past === 0}
                onClick={history.undo}
              >
                <UndoIcon />
              </button>
              <button
                type="button"
                className="da-attachment-tool"
                aria-label="重做"
                title="重做"
                aria-disabled={history.depth.future === 0}
                onClick={history.redo}
              >
                <RedoIcon />
              </button>
              <span className="da-attachment-separator" />
              <button
                type="button"
                className="da-attachment-tool"
                aria-label="缩小"
                title="缩小"
                aria-disabled={zoom === ZOOMS[0]}
                onClick={() => { setZoom(ZOOM_OUT[zoom]) }}
              >
                <span aria-hidden="true">−</span>
              </button>
              <span className="da-attachment-zoom" aria-label="当前缩放">{percentage}%</span>
              <button
                type="button"
                className="da-attachment-tool"
                aria-label="放大"
                title="放大"
                aria-disabled={zoom === ZOOMS[ZOOMS.length - 1]}
                onClick={() => { setZoom(ZOOM_IN[zoom]) }}
              >
                <span aria-hidden="true">+</span>
              </button>
            </div>
          </div>

          <footer className="da-attachment-footer">
            {(notice !== '' || !ready) && (
              <div className="da-attachment-status">
                {notice !== '' && <span role="status" aria-live="polite">{notice}</span>}
                {!ready && (
                  <span className="da-attachment-warning">
                    原附件已移除、已发送，或输入框正在发送。仍可下载 PNG。
                  </span>
                )}
              </div>
            )}
            <div className="da-attachment-actions">
              <button
                type="button"
                className="da-attachment-action"
                aria-disabled={busy || size === null || history.marks.length === 0}
                onClick={() => { void finish(true) }}
              >
                <DownloadIcon />
                下载 PNG
              </button>
              <button
                type="button"
                className="da-attachment-action da-attachment-action-primary"
                aria-disabled={busy || size === null || history.marks.length === 0 || !ready}
                title="生成标注图片，并把逐条评论写入输入框；原图不变，也不会自动发送"
                onClick={() => { void finish(false) }}
              >
                <CopyIcon />
                加入输入框
              </button>
            </div>
          </footer>

          {confirmClose && (
            <div className="da-attachment-confirm" role="alert">
              <div>
                <strong>放弃这些本地批注？</strong>
                <span>原图不会改变；未生成的批注会在关闭后清除。</span>
              </div>
              <div className="da-attachment-confirm-actions">
                <button type="button" onClick={() => { setConfirmClose(false) }}>继续编辑</button>
                <button
                  type="button"
                  className="da-attachment-danger"
                  onClick={() => { store.clear() }}
                >
                  放弃批注
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

interface CommentPillProps {
  readonly mark: AnnotationMark
  readonly size: AttachmentSize
  readonly scale: number
  readonly onChange: (value: string) => void
  readonly onClose: () => void
}

function CommentPill(props: CommentPillProps): ReactNode {
  const { mark, size, scale } = props
  const input = useRef<HTMLTextAreaElement>(null)
  useEffect(() => { input.current?.focus() }, [mark.id])
  const [x, y] = attachmentFocusPoint(mark)
  const right = x > size.width * 0.62
  const below = y < 92
  const translateX = right ? 'calc(-100% - 14px)' : '14px'
  const translateY = below ? '14px' : 'calc(-100% - 14px)'
  return (
    <div
      className="da-attachment-comment-pill"
      role="group"
      aria-label="批注评论"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: `scale(${1 / scale}) translate(${translateX}, ${translateY})`,
        transformOrigin: `${right ? 'right' : 'left'} ${below ? 'top' : 'bottom'}`,
      }}
    >
      <textarea
        ref={input}
        data-mark={mark.id}
        aria-label={`批注 ${mark.id} 评论`}
        placeholder="说明这里要怎么改…"
        rows={1}
        maxLength={MAX_DETAIL_CHARS}
        value={mark.detail ?? ''}
        onChange={event => { props.onChange(event.target.value) }}
        onKeyDown={event => {
          if (event.key === 'Escape') {
            event.preventDefault()
            props.onClose()
          }
        }}
      />
    </div>
  )
}
