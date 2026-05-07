import { describe, expect, it } from 'vitest'
import { PLAN_COMPARISON_ROWS } from './plans'

describe('PLAN_COMPARISON_ROWS', () => {
  it('inclui limites de produtos por categoria', () => {
    const row = PLAN_COMPARISON_ROWS.find((item) => item.label === 'Produtos por categoria')
    expect(row).toBeDefined()
    expect(row?.free).toBe('5')
    expect(row?.pro).toBe('10')
    expect(row?.enterprise).toBe('30')
  })
})
