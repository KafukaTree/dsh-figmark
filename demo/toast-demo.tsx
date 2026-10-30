/**
 * The bubbles on a page of their own.
 *
 * The panel's four annotate events are wired to buttons exactly as the surface wires
 * them, and the two things that only happen during a hand-off — a task that fails and
 * the ↻ that runs it again — are wired to a task that fails on purpose the first time.
 *
 * The buttons call the same `notify`/`send` the figure calls. Nothing here knows how a
 * bubble is drawn: the demo exists to check the drawing, and the panel exists to use it.
 *
 * Opening it: `node --experimental-strip-types demo/build.ts`, then open `demo/toast-demo.html`.
 * @module dsh-figmark/demo/toast-demo
 */
import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react'
import { createRoot } from 'react-dom/client'
import { ToastStack, useToasts } from '../src/client/annotator/toasts'
import { zh } from '../src/client/locales'
import { ensureStyles } from '../src/client/styles'
import type { Translate } from '../src/client/translate'

ensureStyles(document)

const copy: Record<string, string> = zh
/** The panel's own seat: one locale, so the demo shows the copy the reader sees. */
const t: Translate = key => copy[key] ?? key

/**
 * A wait long enough to be seen.
 * @param ms - how long the ring spins for.
 * @returns a promise that settles after that long.
 */
function pause(ms: number): Promise<void> {
  return new Promise(resolve => { setTimeout(resolve, ms) })
}

/** One press on the right: what it is called and what it does. */
interface Action {
  readonly id: string
  readonly label: string
  readonly hint: string
  readonly press: () => void
}

/**
 * The demo, which is a figure's worth of empty space and a column of buttons.
 * @returns the page.
 */
function Demo(): ReactElement {
  const toasts = useToasts(t)
  // `?fail=1` starts with the switch on, so a failing bubble can be photographed.
  const [failNext, setFailNext] = useState(() => new URLSearchParams(window.location.search).get('fail') === '1')
  const [attempts, setAttempts] = useState(0)
  const [log, setLog] = useState<readonly string[]>([])
  const attempt = useRef(0)

  // What the bubbles cannot say, they log — and this page shows the log, because a
  // reason nobody can find is the same as no reason at all.
  useEffect(() => {
    const original = console.error.bind(console)
    console.error = (...args: readonly unknown[]) => {
      const line = args.map(arg => String(arg)).join(' ')
      setLog(lines => [line, ...lines].slice(0, 3))
      original(...args)
    }
    return () => { console.error = original }
  }, [])

  // Every press the page has been told to make, so `?press=` can reach one without a
  // hand on the mouse: the demo is also how the look of a state gets photographed.
  const latest = useRef<readonly Action[]>([])
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get('press')
    if (wanted === null) return
    const timers = wanted.split(',').map((id, index) => setTimeout(() => {
      const action = latest.current.find(item => item.id === id)
      if (action !== undefined) action.press()
    }, 120 + index * 380))
    return () => { timers.forEach(timer => { clearTimeout(timer) }) }
  }, [])

  /** A copy that takes a moment, so the ring has something to wait for. */
  const save = useCallback((): Promise<void> => pause(900), [])

  const sendToAgent = useCallback((): Promise<void> => pause(1100).then(() => {
    if (failNext) throw new Error('the session stopped answering')
  }), [failNext])

  // Fails the first time and works the second, so the ↻ on the failure bubble has
  // something to prove: the same task, run again, landing this time.
  const flaky = useCallback(async (): Promise<void> => {
    attempt.current += 1
    setAttempts(attempt.current)
    await pause(900)
    if (attempt.current === 1) throw new Error('the first try lost the connection')
  }, [])

  const actions: readonly Action[] = [
    {
      id: 'none',
      label: '未标注',
      hint: '「还没有标注请先圈出要改处」',
      press: () => { void toasts.notify('annotate.none') },
    },
    {
      id: 'save-all',
      label: '存草稿 · 清空',
      hint: '存下这一批，然后把图上的标注收走',
      press: () => { void toasts.notify('annotate.save.all', save) },
    },
    {
      id: 'save-one',
      label: '存草稿 · 保留',
      hint: '只存这一条，其余标注留着',
      press: () => { void toasts.notify('annotate.save.one', save) },
    },
    {
      id: 'agent',
      label: '发智能体',
      hint: failNext ? '这一条会失败：白色叉，然后可重发' : '真实的事件，任务是一次等待',
      press: () => { void toasts.notify('annotate.send.agent', sendToAgent) },
    },
    {
      id: 'fail',
      label: '发送失败 → 重新发送',
      hint: `第一次失败，按叉变成的 ↻ 再跑一次（已跑 ${attempts} 次）`,
      press: () => {
        void toasts.send({
          icon: 'agent',
          pending: t('toastSending'),
          done: t('toastSentAgent'),
          failed: t('toastFailed'),
          task: flaky,
        })
      },
    },
    {
      id: 'reset',
      label: '重置尝试次数',
      hint: '让上一条重新从「第一次」开始',
      press: () => { attempt.current = 0; setAttempts(0); toasts.clear() },
    },
  ]

  latest.current = actions

  return (
    <div className="demo">
      <div className="da-root demo-panel">
        <div className="demo-canvas">
          <span>画布</span>
        </div>
        <ToastStack view={toasts} label={t('close')} resendLabel={t('toastResend')} />
      </div>
      <div className="demo-side">
        <label className="demo-switch">
          <input
            type="checkbox"
            checked={failNext}
            onChange={event => { setFailNext(event.target.checked) }}
          />
          让「发智能体」这一条失败
        </label>
        <ul className="demo-actions">
          {actions.map(action => (
            <li key={action.id}>
              <button type="button" onClick={action.press}>{action.label}</button>
              <span>{action.hint}</span>
            </li>
          ))}
        </ul>
        <p className="demo-log-label">控制台里的原因（气泡只说一句）</p>
        <pre className="demo-log">{log.join('\n') || '（还没有失败过）'}</pre>
      </div>
    </div>
  )
}

const host = document.querySelector('#app')
if (host === null) throw new Error('the demo page has no #app to render into')
createRoot(host).render(<Demo />)
