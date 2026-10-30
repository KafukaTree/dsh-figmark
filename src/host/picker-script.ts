/**
 * The script every rendered page is served with.
 *
 * A page in the frame is somebody else's document, running on its own server or on
 * its own clock: the panel can frame it but cannot reach into it, and the page's own
 * scripts have to keep running exactly as they were written or the page is not the
 * page at all. So the only way in is a script the page itself loads — this one — and
 * the only way out is `postMessage`.
 *
 * It is a string, not a module: the Host serves it byte for byte at a fixed path and
 * the file preview inlines it, and it runs inside documents this package never
 * compiles. That is why it is self-contained, ES5-safe, and free of any import:
 * whatever ships here runs in whatever browser the reader has, inside a document
 * whose shape nobody checked.
 *
 * Two rules decide everything else. The page stays itself until the reader arms
 * annotation: no pointer event is swallowed, no click is cancelled, a video plays
 * and a link follows. And the picker never claims to know more than the DOM does:
 * it reports the element under the pointer, how far the page is scrolled, and a
 * positional path — nothing it invented.
 * @module dsh-figmark/host/picker-script
 */

/**
 * The picker, as the page receives it.
 *
 * On load it marks the document element with `data-dsh-figmark="live"`, so the page
 * (and anyone looking at it) can tell it is being previewed, and it reports that it
 * is ready along with the current scroll — the panel needs both before it can place
 * a single mark. While annotation is armed the pointer is reported once per animation
 * frame and a click names the element instead of following it; while it is not, this
 * script listens and does nothing else.
 *
 * Reports go to `window.parent` with target origin `'*'`: the panel is on another
 * origin by construction, and the message carries nothing a hostile page could not
 * already see. The panel validates the shape on arrival — this side only promises to
 * send it.
 *
 * `selector` is positional and nothing else: `tag:nth-of-type(n)` steps joined by
 * `' > '`, rooted at `body` but without naming it, so `body` itself is `'body'`.
 * A positional path survives a page whose ids are regenerated on every render, which
 * is exactly what a live page's ids do — and it is the same grammar the file
 * preview's own path builder writes, so a saved mark resolves against either.
 */
export const PICKER_SCRIPT: string = `(function () {
  if (window.__dshFigmarkPicker) return
  window.__dshFigmarkPicker = true

  var MARKER = 'dsh-figmark:live'
  var doc = document
  var armed = false
  var pending = 0
  var latest = null
  var lastScroll = ''

  doc.documentElement.setAttribute('data-dsh-figmark', 'live')

  function pathOf(el) {
    if (el === doc.body) return 'body'
    var steps = []
    for (var node = el; node && node !== doc.body; node = node.parentElement) {
      var index = 1
      for (var sib = node.previousElementSibling; sib; sib = sib.previousElementSibling) {
        if (sib.tagName === node.tagName) index += 1
      }
      steps.unshift(node.tagName.toLowerCase() + ':nth-of-type(' + index + ')')
    }
    return steps.join(' > ')
  }

  function scrollOf() {
    return [window.scrollX || 0, window.scrollY || 0]
  }

  function send(message) {
    var parent = window.parent
    if (!parent) return
    try { parent.postMessage(message, '*') } catch (error) { return }
  }

  function report(kind, el) {
    var rect = el.getBoundingClientRect()
    var scroll = scrollOf()
    var message = {
      figmark: MARKER,
      kind: kind,
      tag: el.tagName.toLowerCase(),
      selector: pathOf(el),
      bbox: [rect.left + scroll[0], rect.top + scroll[1], rect.width, rect.height],
      scroll: scroll
    }
    var text = (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 80)
    if (text) message.text = text
    if (el.id) message.id = el.id
    var cls = el.getAttribute('class')
    if (cls && cls.trim()) message['class'] = cls.trim()
    send(message)
  }

  function under(event) {
    var el = event.target
    if (!el || el.nodeType !== 1) return null
    return el === doc.documentElement ? null : el
  }

  function sendScroll() {
    var scroll = scrollOf()
    var key = scroll[0] + ',' + scroll[1]
    if (key === lastScroll) return
    lastScroll = key
    send({ figmark: MARKER, kind: 'scroll', scroll: scroll })
  }

  doc.addEventListener('pointermove', function (event) {
    if (!armed) return
    var el = under(event)
    if (!el) return
    latest = el
    if (pending) return
    pending = window.requestAnimationFrame(function () {
      pending = 0
      if (latest) report('hover', latest)
    })
  }, true)

  // The pointer going off the page takes the name with it: a label left behind over
  // an element the reader's pointer has already left is a label about nothing.
  doc.documentElement.addEventListener('pointerleave', function () {
    if (!armed) return
    latest = null
    send({ figmark: MARKER, kind: 'leave' })
  })

  doc.addEventListener('click', function (event) {
    if (!armed) return
    var el = under(event)
    if (!el) return
    event.preventDefault()
    event.stopPropagation()
    report('pick', el)
  }, true)

  window.addEventListener('scroll', sendScroll, true)
  window.addEventListener('resize', sendScroll)

  window.addEventListener('message', function (event) {
    var data = event.data
    if (!data || typeof data !== 'object' || data.figmark !== MARKER) return
    if (data.kind !== 'mode') return
    armed = !!data.armed
    if (!armed) latest = null
  })

  send({ figmark: MARKER, kind: 'ready', scroll: scrollOf() })
})()
`
