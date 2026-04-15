import { describe, expect, it } from 'vitest'
import { formatPrice } from './format'

describe('formatPrice', () => {
  it('formata valor em real (pt-BR)', () => {
    const s = formatPrice(12.9)
    expect(s).toContain('12,90')
    expect(s).toMatch(/R\$\s*12,90/)
  })

  it('formata zero', () => {
    expect(formatPrice(0)).toMatch(/R\$\s*0,00/)
  })
})
