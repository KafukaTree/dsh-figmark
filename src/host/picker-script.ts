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
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { MAX_LIVE_CAPTURE_DATA_URL } from '../shared/live'

const require = createRequire(import.meta.url)
const MODERN_SCREENSHOT = readFileSync(
  require.resolve('modern-screenshot/dist/index.js'),
  'utf8',
)

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
export const PICKER_SCRIPT: string = `/*! modern-screenshot v4.7.0 | MIT */
${MODERN_SCREENSHOT}
;(function () {
  if (window.__dshFigmarkPicker) return
  window.__dshFigmarkPicker = true

  var MARKER = 'dsh-figmark:live'
  var doc = document
  var armed = false
  var pending = 0
  var latest = null
  var latestKey = ''
  var depth = 0
  var lastScroll = ''
  var watched = []
  var lastBounds = ''
  var boundsScheduled = 0
  var lastHover = ''
  var lastSurface
  var surfaceScheduled = 0
  var revealedStyles = []
  var revealSeq = 0

  // The common spellings presentation frameworks use for the one page in front.
  // This is deliberately a small convention rather than "the largest element":
  // marking an arbitrary large container as a page would hide valid annotations.
  var SURFACE_QUERY = [
    '[data-slide-current="true"]',
    '[data-slide-active="true"]',
    '.slide',
    '.dk-slide',
    '.page.current',
    '.page.active',
    '.page.is-live',
    '.page.live',
    '.swiper-slide',
    '.carousel-item',
    '.reveal .slides section',
    '.remark-slide',
    '.remark-visible',
    '.step.active',
    '[role="tabpanel"]',
    '[data-slide]'
  ].join(',')

  doc.documentElement.setAttribute('data-dsh-figmark', 'live')
  var cursorStyle = doc.createElement('style')
  cursorStyle.setAttribute('data-dsh-figmark-style', '')
  cursorStyle.textContent = 'html[data-dsh-figmark-armed="true"] *{cursor:crosshair!important}'
  ;(doc.head || doc.documentElement).appendChild(cursorStyle)

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

  function ladderOf(el) {
    var answer = []
    for (var node = el; node && node !== doc.documentElement; node = node.parentElement) {
      answer.push(node)
    }
    return answer
  }

  function keyOf(ladder) {
    var parts = []
    for (var i = 0; i < ladder.length; i += 1) parts.push(pathOf(ladder[i]))
    return parts.join('|')
  }

  function scrollOf() {
    return [window.scrollX || 0, window.scrollY || 0]
  }

  function send(message) {
    var parent = window.parent
    if (!parent) return
    try { parent.postMessage(message, '*') } catch (error) { return }
  }

  function report(kind, el, ladder, index) {
    var rect = el.getBoundingClientRect()
    var scroll = scrollOf()
    var selector = pathOf(el)
    var hoverKey = selector + '|' + scroll[0] + ',' + scroll[1] + '|'
      + rect.left + ',' + rect.top + ',' + rect.width + ',' + rect.height
    if (kind === 'hover') {
      if (hoverKey === lastHover) return
      lastHover = hoverKey
    }
    var message = {
      figmark: MARKER,
      kind: kind,
      tag: el.tagName.toLowerCase(),
      selector: selector,
      bbox: [rect.left + scroll[0], rect.top + scroll[1], rect.width, rect.height],
      scroll: scroll,
      level: index + 1,
      count: ladder.length
    }
    var text = (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 80)
    if (text) message.text = text
    if (el.id) message.id = el.id
    var cls = el.getAttribute('class')
    if (cls && cls.trim()) message['class'] = cls.trim()
    if (kind === 'pick') {
      var owner = surfaceOf(el)
      message.surface = owner ? pathOf(owner) : null
    }
    send(message)
  }

  function choose(ladder) {
    var key = keyOf(ladder)
    if (key !== latestKey) {
      latestKey = key
      depth = 0
    }
    depth = Math.max(0, Math.min(depth, ladder.length - 1))
    return depth
  }

  function under(event) {
    var el = event.target
    if (!el || el.nodeType !== 1) return null
    return el === doc.documentElement ? null : el
  }

  function rendered(el) {
    if (!el) return false
    var style = window.getComputedStyle(el)
    if (style.display === 'none'
      || style.visibility === 'hidden'
      || style.visibility === 'collapse'
      || style.contentVisibility === 'hidden'
      || parseFloat(style.opacity) <= 0) return false
    // A slide is often put away by an ancestor's opacity. The element's own computed
    // visibility stays "visible" there, so check the compositing chain as well.
    for (var node = el.parentElement; node; node = node.parentElement) {
      var parentStyle = window.getComputedStyle(node)
      if (parentStyle.display === 'none'
        || parentStyle.contentVisibility === 'hidden'
        || parseFloat(parentStyle.opacity) <= 0) return false
    }
    if (typeof el.checkVisibility === 'function') {
      try {
        return el.checkVisibility({
          checkOpacity: true,
          checkVisibilityCSS: true,
          opacityProperty: true,
          visibilityProperty: true,
          contentVisibilityAuto: true
        })
      } catch (error) {
        return true
      }
    }
    return true
  }

  function shown(el) {
    if (!rendered(el)) return false
    var rect = el.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return false
    var viewportWidth = window.innerWidth || doc.documentElement.clientWidth || 0
    var viewportHeight = window.innerHeight || doc.documentElement.clientHeight || 0
    if (rect.right <= 0 || rect.bottom <= 0 || rect.left >= viewportWidth || rect.top >= viewportHeight) {
      return false
    }
    return true
  }

  function inViewport(el) {
    var rect = el.getBoundingClientRect()
    var viewportWidth = window.innerWidth || doc.documentElement.clientWidth || 0
    var viewportHeight = window.innerHeight || doc.documentElement.clientHeight || 0
    return rect.left >= -1 && rect.top >= -1
      && rect.right <= viewportWidth + 1 && rect.bottom <= viewportHeight + 1
  }

  function boxInViewport(box) {
    var scroll = scrollOf()
    var viewportWidth = window.innerWidth || doc.documentElement.clientWidth || 0
    var viewportHeight = window.innerHeight || doc.documentElement.clientHeight || 0
    var x = typeof box[0] === 'number' ? box[0] : 0
    var y = typeof box[1] === 'number' ? box[1] : 0
    var width = typeof box[2] === 'number' ? box[2] : 0
    var height = typeof box[3] === 'number' ? box[3] : 0
    return x >= scroll[0] - 1 && y >= scroll[1] - 1
      && x + width <= scroll[0] + viewportWidth + 1
      && y + height <= scroll[1] + viewportHeight + 1
  }

  function measure(selector) {
    var el = null
    try { el = doc.querySelector(selector) } catch (error) { el = null }
    if (!el) return { selector: selector, bbox: [0, 0, 0, 0], visible: false }
    var rect = el.getBoundingClientRect()
    var scroll = scrollOf()
    return {
      selector: selector,
      bbox: [rect.left + scroll[0], rect.top + scroll[1], rect.width, rect.height],
      visible: shown(el)
    }
  }

  function delay(ms) {
    return new Promise(function (resolve) { window.setTimeout(resolve, ms) })
  }

  function waitForRendered(el, remaining) {
    if (rendered(el)) return Promise.resolve(true)
    if (remaining <= 0) return Promise.resolve(false)
    return delay(45).then(function () { return waitForRendered(el, remaining - 1) })
  }

  function restoreHidden() {
    for (var i = revealedStyles.length - 1; i >= 0; i -= 1) {
      var item = revealedStyles[i]
      if (item.value) item.el.style.setProperty(item.name, item.value, item.priority)
      else item.el.style.removeProperty(item.name)
    }
    revealedStyles = []
  }

  function overrideHidden(node, name, value) {
    revealedStyles.push({
      el: node,
      name: name,
      value: node.style.getPropertyValue(name),
      priority: node.style.getPropertyPriority(name)
    })
    node.style.setProperty(name, value, 'important')
  }

  function revealHidden(el, stop) {
    var outermost = null
    for (var node = el; node && node !== doc.body && node !== doc.documentElement && node !== stop; node = node.parentElement) {
      var style = window.getComputedStyle(node)
      if (style.display === 'none') overrideHidden(node, 'display', 'revert')
      if (style.visibility === 'hidden' || style.visibility === 'collapse') {
        overrideHidden(node, 'visibility', 'visible')
      }
      if (style.contentVisibility === 'hidden') overrideHidden(node, 'content-visibility', 'visible')
      if (parseFloat(style.opacity) <= 0) overrideHidden(node, 'opacity', '1')
      outermost = node
    }
    if (outermost && window.getComputedStyle(outermost).pointerEvents !== 'none') {
      overrideHidden(outermost, 'pointer-events', 'none')
    }
  }

  function surfaceOf(el) {
    for (var node = el; node && node !== doc.documentElement; node = node.parentElement) {
      try {
        if (node.matches(SURFACE_QUERY)) return node
      } catch (error) {
        return null
      }
    }
    return null
  }

  function nearestSurface() {
    var surfaces = []
    try { surfaces = Array.prototype.slice.call(doc.querySelectorAll(SURFACE_QUERY)) } catch (error) { return null }
    for (var i = 0; i < surfaces.length; i += 1) {
      var rect = surfaces[i].getBoundingClientRect()
      // A deck often clones every slide into its overview. Those copies keep the
      // same classes but have no layout, so they cannot be navigation targets.
      if (rect.width > 0 && rect.height > 0) return surfaces[i]
    }
    return null
  }

  function turnToward(target) {
    var surfaces = []
    try { surfaces = Array.prototype.slice.call(doc.querySelectorAll(SURFACE_QUERY)) } catch (error) { return Promise.resolve(false) }
    var wanted = surfaces.indexOf(target)
    var current = visibleSurface()
    var from = current ? surfaces.indexOf(current) : -1
    if (wanted < 0 || from < 0 || wanted === from) return Promise.resolve(shown(target))
    var key = wanted > from ? 'ArrowRight' : 'ArrowLeft'
    var steps = Math.min(32, Math.abs(wanted - from) + 2)
    function next(remaining) {
      if (remaining <= 0 || shown(target)) return Promise.resolve(shown(target))
      var node = doc.activeElement || doc.body || doc.documentElement
      var event = new KeyboardEvent('keydown', {
        key: key,
        code: key,
        keyCode: key === 'ArrowRight' ? 39 : 37,
        which: key === 'ArrowRight' ? 39 : 37,
        bubbles: true,
        cancelable: true
      })
      node.dispatchEvent(event)
      return delay(45).then(function () { return next(remaining - 1) })
    }
    return next(steps)
  }

  function reveal(requestId, selector, surface, bbox) {
    revealSeq += 1
    var seq = revealSeq
    restoreHidden()
    function current() {
      return seq === revealSeq
    }
    var requestedEl = null
    if (selector) {
      try { requestedEl = doc.querySelector(selector) } catch (error) { requestedEl = null }
    }
    var ownerSurface = null
    var surfaceEl = null
    if (requestedEl) {
      // The element is the strongest evidence of where it lives. A mark made
      // before page ownership was recorded may carry the slide that was open at
      // creation time instead, which would leave us waiting on the wrong page.
      ownerSurface = surfaceOf(requestedEl)
      surfaceEl = ownerSurface
    }
    if (!surfaceEl && requestedEl && !shown(requestedEl)) {
      surfaceEl = nearestSurface()
    }
    if (!surfaceEl && surface) {
      try { surfaceEl = doc.querySelector(surface) } catch (error) { surfaceEl = null }
      if (!surfaceEl) {
        send({ figmark: MARKER, kind: 'reveal-result', requestId: requestId, status: 'wrong-surface' })
        return
      }
    }
    var ready = shown(surfaceEl) ? Promise.resolve(true) : surfaceEl ? turnToward(surfaceEl) : Promise.resolve(true)
    ready.then(function (surfaceReady) {
      if (!current()) return
      if (!surfaceReady) {
        send({ figmark: MARKER, kind: 'reveal-result', requestId: requestId, status: 'wrong-surface' })
        return
      }
      if (selector) {
        var el = requestedEl
        if (!el) {
          send({ figmark: MARKER, kind: 'reveal-result', requestId: requestId, status: 'missing' })
          return
        }
        waitForRendered(el, 4).then(function (elementReady) {
          if (!current()) return false
          if (!elementReady) {
            // A cover, modal, or intro layer can sit outside every slide and stay
            // hidden after the deck has advanced. Restore only the hidden ancestors
            // below the owning surface; the source and the page's state are untouched.
            revealHidden(el, ownerSurface)
            return waitForRendered(el, 10)
          }
          return elementReady
        }).then(function (elementReady) {
          if (!current()) return
          if (!elementReady) {
            restoreHidden()
            send({ figmark: MARKER, kind: 'reveal-result', requestId: requestId, status: 'hidden' })
            return
          }
          // A fully visible element must not move. Centring used to shift decks and
          // fixed-stage pages under the reader even when the mark was already on
          // screen; nearest changes only what is actually clipped.
          if (window.getComputedStyle(el).position !== 'fixed' && !inViewport(el)) {
            try { el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' }) } catch (error) { el.scrollIntoView() }
          }
          delay(0).then(function () {
            if (!current()) return
            sendScroll()
            var visible = shown(el)
            var answer = {
              figmark: MARKER,
              kind: 'reveal-result',
              requestId: requestId,
              status: visible ? 'revealed' : 'hidden',
              surface: surfaceEl ? pathOf(surfaceEl) : null
            }
            if (visible && revealedStyles.length > 0) answer.temporary = true
            send(answer)
          })
        })
        return
      }
      var x = bbox && typeof bbox[0] === 'number' ? bbox[0] : 0
      var y = bbox && typeof bbox[1] === 'number' ? bbox[1] : 0
      if (!boxInViewport(bbox || [0, 0, 0, 0])) {
        window.scrollTo({
          left: Math.max(0, x - (window.innerWidth || 0) / 2),
          top: Math.max(0, y - (window.innerHeight || 0) / 2),
          behavior: 'auto'
        })
      }
      delay(0).then(function () {
        if (!current()) return
        sendScroll()
        var width = bbox && typeof bbox[2] === 'number' ? bbox[2] : 0
        var height = bbox && typeof bbox[3] === 'number' ? bbox[3] : 0
        var visible = width <= 0 || height <= 0
          || (x + width > window.scrollX && x < window.scrollX + (window.innerWidth || 0)
            && y + height > window.scrollY && y < window.scrollY + (window.innerHeight || 0))
        send({
          figmark: MARKER,
          kind: 'reveal-result',
          requestId: requestId,
          status: visible ? 'revealed' : 'hidden'
        })
      })
    })
  }

  function sendBounds(force) {
    boundsScheduled = 0
    if (watched.length === 0) return
    var bounds = []
    for (var i = 0; i < watched.length; i += 1) bounds.push(measure(watched[i]))
    var key = JSON.stringify(bounds)
    if (!force && key === lastBounds) return
    lastBounds = key
    send({ figmark: MARKER, kind: 'bounds', bounds: bounds })
  }

  function scheduleBounds() {
    if (watched.length === 0 || boundsScheduled) return
    // Do not store the request handle here: a test clock may run the callback before
    // requestAnimationFrame returns, which would assign a truthy handle after the
    // callback had already cleared the flag.
    boundsScheduled = 1
    window.requestAnimationFrame(function () { sendBounds(false) })
  }

  function sendScroll() {
    var scroll = scrollOf()
    var key = scroll[0] + ',' + scroll[1]
    if (key !== lastScroll) {
      lastScroll = key
      send({ figmark: MARKER, kind: 'scroll', scroll: scroll })
    }
    scheduleBounds()
    scheduleSurface()
  }

  function visibleSurface() {
    var candidates
    try { candidates = doc.querySelectorAll(SURFACE_QUERY) } catch (error) { return null }
    for (var i = 0; i < candidates.length; i += 1) {
      var el = candidates[i]
      if (shown(el)) return el
    }
    return null
  }

  function sendSurface(force) {
    surfaceScheduled = 0
    var el = visibleSurface()
    var selector = el ? pathOf(el) : null
    var key = selector === null ? '\\u0000none' : selector
    if (selector === null && lastSurface === undefined) return
    if (!force && key === lastSurface) return
    lastSurface = key
    send({ figmark: MARKER, kind: 'surface', selector: selector })
  }

  function scheduleSurface() {
    if (surfaceScheduled) return
    surfaceScheduled = 1
    window.requestAnimationFrame(function () { sendSurface(false) })
  }

  doc.addEventListener('pointermove', function (event) {
    if (!armed) return
    var el = under(event)
    if (!el) return
    var ladder = ladderOf(el)
    if (ladder.length === 0) return
    var index = choose(ladder)
    latest = { ladder: ladder, index: index }
    if (pending) return
    pending = 1
    window.requestAnimationFrame(function () {
      pending = 0
      if (!latest) return
      report('hover', latest.ladder[latest.index], latest.ladder, latest.index)
    })
  }, true)

  // The pointer going off the page takes the name with it: a label left behind over
  // an element the reader's pointer has already left is a label about nothing.
  doc.documentElement.addEventListener('pointerleave', function () {
    if (!armed) return
    latest = null
    lastHover = ''
    send({ figmark: MARKER, kind: 'leave' })
  })

  doc.addEventListener('click', function (event) {
    if (!armed) return
    var el = under(event)
    if (!el) return
    var ladder = ladderOf(el)
    if (ladder.length === 0) return
    var index = choose(ladder)
    event.preventDefault()
    event.stopImmediatePropagation()
    report('pick', ladder[index], ladder, index)
  }, true)

  // Arrow keys climb the same ladder the hover box is promising. Escape dismisses
  // the panel's current comment layer; both belong to the frame because that is
  // where the keyboard focus is once the reader points into the page.
  doc.addEventListener('keydown', function (event) {
    if (!armed) return
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopImmediatePropagation()
      latest = null
      lastHover = ''
      send({ figmark: MARKER, kind: 'cancel' })
      return
    }
    if (!latest) return
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()
      event.stopImmediatePropagation()
      depth = Math.max(0, Math.min(latest.ladder.length - 1, depth + (event.key === 'ArrowUp' ? 1 : -1)))
      latest.index = depth
      report('hover', latest.ladder[depth], latest.ladder, depth)
      return
    }
  }, true)

  window.addEventListener('scroll', sendScroll, true)
  window.addEventListener('resize', sendScroll)

  function capture(requestId) {
    var root = doc.documentElement
    var documentWidth = Math.max(1, Math.ceil(root.scrollWidth || root.clientWidth || window.innerWidth || 1))
    var documentHeight = Math.max(1, Math.ceil(root.scrollHeight || root.clientHeight || window.innerHeight || 1))
    var bounds = []
    for (var i = 0; i < watched.length; i += 1) bounds.push(measure(watched[i]))
    var surface = visibleSurface()
    // A deck keeps every slide in the same document. Cloning all of them to PNG is
    // both slow and wrong for a screenshot of the page in front: capture the surface
    // subtree when one exists and let the panel place it at its document offset.
    var rect = surface ? surface.getBoundingClientRect() : null
    var scroll = scrollOf()
    var width = rect ? Math.max(1, Math.ceil(rect.width)) : documentWidth
    var height = rect ? Math.max(1, Math.ceil(rect.height)) : documentHeight
    var imageRect = rect
      ? [rect.left + scroll[0], rect.top + scroll[1], width, height]
      : [0, 0, width, height]
    var target = surface || root
    var scale = Math.min(2, 2400 / Math.max(width, height))
    var screenshot = window.modernScreenshot
    if (!screenshot || typeof screenshot.domToDataUrl !== 'function') {
      send({
        figmark: MARKER,
        kind: 'capture-result',
        requestId: requestId,
        status: 'failed',
        reason: 'the screenshot renderer is unavailable'
      })
      return
    }
    screenshot.domToDataUrl(target, {
      width: width,
      height: height,
      scale: scale,
      backgroundColor: '#ffffff',
      maximumCanvasSize: 4096,
      timeout: 12000,
      filter: function (node) {
        if (!node || node.nodeType !== 1) return true
        return !node.hasAttribute('data-dsh-figmark-style')
          && !node.hasAttribute('data-da-spot')
      }
    }).then(function (dataUrl) {
      if (typeof dataUrl !== 'string' || dataUrl.length > ${String(MAX_LIVE_CAPTURE_DATA_URL)}) {
        send({
          figmark: MARKER,
          kind: 'capture-result',
          requestId: requestId,
          status: 'failed',
          reason: 'the screenshot is too large'
        })
        return
      }
      send({
        figmark: MARKER,
        kind: 'capture-result',
        requestId: requestId,
        status: 'ok',
        dataUrl: dataUrl,
        document: [documentWidth, documentHeight],
        imageRect: imageRect,
        viewport: [window.innerWidth || width, window.innerHeight || height],
        scroll: scroll,
        scale: scale,
        surface: surface ? pathOf(surface) : null,
        bounds: bounds
      })
    }, function (error) {
      var reason = error && error.message ? String(error.message) : 'the page could not be captured'
      send({
        figmark: MARKER,
        kind: 'capture-result',
        requestId: requestId,
        status: 'failed',
        reason: reason.slice(0, 280)
      })
    })
  }

  window.addEventListener('message', function (event) {
    var data = event.data
    if (!data || typeof data !== 'object' || data.figmark !== MARKER) return
    if (data.kind === 'mode') {
      armed = !!data.armed
      doc.documentElement.setAttribute('data-dsh-figmark-armed', armed ? 'true' : 'false')
      if (!armed) {
        latest = null
        latestKey = ''
        depth = 0
        lastHover = ''
      }
      scheduleSurface()
      return
    }
    if (data.kind === 'depth' && armed && latest && (data.delta === 1 || data.delta === -1)) {
      event.preventDefault()
      event.stopImmediatePropagation()
      depth = Math.max(0, Math.min(latest.ladder.length - 1, latest.index + data.delta))
      latest.index = depth
      report('hover', latest.ladder[depth], latest.ladder, depth)
      return
    }
    if (data.kind === 'watch' && Array.isArray(data.selectors)) {
      watched = []
      for (var i = 0; i < data.selectors.length && watched.length < 256; i += 1) {
        var selector = data.selectors[i]
        if (typeof selector === 'string' && selector.length > 0 && selector.length <= 2048
          && watched.indexOf(selector) < 0) watched.push(selector)
      }
      lastBounds = ''
      sendBounds(true)
      return
    }
    if (data.kind === 'reveal' && typeof data.requestId === 'string' && data.requestId.length <= 128) {
      var requestedSelector = typeof data.selector === 'string'
        && data.selector.length > 0 && data.selector.length <= 2048 ? data.selector : null
      var requestedSurface = typeof data.surface === 'string'
        && data.surface.length > 0 && data.surface.length <= 2048 ? data.surface : null
      var requestedBox = Array.isArray(data.bbox) && data.bbox.length === 4 ? data.bbox : [0, 0, 0, 0]
      reveal(data.requestId, requestedSelector, requestedSurface, requestedBox)
      return
    }
    if (data.kind === 'capture' && typeof data.requestId === 'string'
      && data.requestId.length > 0 && data.requestId.length <= 128) {
      capture(data.requestId)
      return
    }
    if (data.kind === 'release-reveal') {
      revealSeq += 1
      restoreHidden()
    }
  })

  if (window.MutationObserver) {
    new window.MutationObserver(function () {
      scheduleBounds()
      scheduleSurface()
    }).observe(doc.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'aria-hidden', 'aria-current']
    })
  }
  window.addEventListener('hashchange', scheduleSurface)
  window.addEventListener('popstate', scheduleSurface)
  window.setInterval(function () {
    sendBounds(false)
    sendSurface(false)
  }, 250)

  send({ figmark: MARKER, kind: 'ready', scroll: scrollOf() })
  scheduleSurface()
})()
`
