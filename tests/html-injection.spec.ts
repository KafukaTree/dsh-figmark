/** The shared tag helper both HTML servers use. */
import { describe, expect, it } from 'vitest'
import { injectPicker, stripCspMeta } from '../src/host/html-injection'

describe('injecting the picker', () => {
  it('uses the standard tag in front of the final body close', () => {
    expect(injectPicker('<body>one</body><body>two</body>')).toBe(
      '<body>one</body><body>two<script src="/__dsh_figmark_picker.js"></script></body>',
    )
  })

  it('appends a custom tag to a document with no body close', () => {
    expect(injectPicker('<main>bare</main>', '<script src="custom.js"></script>')).toBe(
      '<main>bare</main><script src="custom.js"></script>',
    )
  })

  it('removes CSP in double quotes, single quotes, and no quotes', () => {
    expect(stripCspMeta([
      '<meta http-equiv="content-security-policy" content="default-src \'none\'">',
      "<meta http-equiv='Content-Security-Policy-Report-Only' content='img-src none'>",
      '<meta http-equiv=Content-Security-Policy content="script-src none">',
      '<meta name="description" content="kept">',
    ].join(''))).toBe('<meta name="description" content="kept">')
  })
})
