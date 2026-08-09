import { describe, it, expect } from 'vitest'
import { useCurrency } from '~/composables/useCurrency'

describe('useCurrency', () => {
  it('formats amounts in GHS', () => {
    const { format } = useCurrency()
    const result = format(1234.5)
    expect(result).toContain('1,234.50')
    expect(result.length).toBeGreaterThan(0)
  })

  it('formats zero', () => {
    const { format } = useCurrency()
    expect(format(0)).toContain('0.00')
  })

  it('formats large numbers', () => {
    const { format } = useCurrency()
    const result = format(1000000)
    expect(result).toContain('1,000,000.00')
  })
})
