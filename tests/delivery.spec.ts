/** What the panel says when a delivery succeeds with something left behind. */
import { describe, expect, it, vi } from 'vitest'
import { reportDeliveryWarnings } from '../src/client/annotator/delivery'

describe('delivery warnings', () => {
  it('says nothing when every artifact travelled', () => {
    const show = vi.fn()
    reportDeliveryWarnings([], show)
    expect(show).not.toHaveBeenCalled()
  })

  it('joins every missing artifact into one informational line', () => {
    const show = vi.fn()
    reportDeliveryWarnings(['附件未发送。', '另有两页只以文字说明。'], show)
    expect(show).toHaveBeenCalledWith({
      tone: 'info',
      text: '附件未发送。 另有两页只以文字说明。',
    })
  })
})
