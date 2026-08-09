import { describe, it, expect } from 'vitest'
import { formToApiPayload, validateForm } from '~/utils/rateValidation'

describe('rateValidation.validateForm', () => {
  const validAdd = {
    customerTypeId: 'ct-1',
    estimatedQuantityId: 'eq-1',
    pickupRate: '25.50',
    effectiveDate: '2025-06-01',
    note: '',
    isActive: true,
  }

  it('returns no errors for valid add form', () => {
    expect(validateForm(validAdd)).toEqual([])
  })

  it('requires customer type in add mode', () => {
    const errors = validateForm({ ...validAdd, customerTypeId: '' })
    expect(errors.some(e => e.includes('Customer type'))).toBe(true)
  })

  it('skips customer type in edit mode', () => {
    const errors = validateForm({ ...validAdd, customerTypeId: '' }, true)
    expect(errors.some(e => e.includes('Customer type'))).toBe(false)
  })

  it('requires estimated quantity', () => {
    const errors = validateForm({ ...validAdd, estimatedQuantityId: '' })
    expect(errors.some(e => e.includes('quantity'))).toBe(true)
  })

  it('rejects non-positive pickup rate', () => {
    expect(validateForm({ ...validAdd, pickupRate: '0' }).some(e => e.includes('pickup rate'))).toBe(true)
    expect(validateForm({ ...validAdd, pickupRate: '-5' }).some(e => e.includes('pickup rate'))).toBe(true)
    expect(validateForm({ ...validAdd, pickupRate: 'abc' }).some(e => e.includes('pickup rate'))).toBe(true)
  })

  it('requires effective date', () => {
    const errors = validateForm({ ...validAdd, effectiveDate: '' })
    expect(errors.some(e => e.includes('Effective date'))).toBe(true)
  })
})

describe('rateValidation.formToApiPayload', () => {
  it('transforms form to API payload', () => {
    const payload = formToApiPayload({
      customerTypeId: 'ct-1',
      estimatedQuantityId: 'eq-1',
      pickupRate: '25.50',
      effectiveDate: '2025-06-01',
      note: '  test note  ',
      isActive: true,
    })
    expect(payload).toEqual({
      customerTypeId: 'ct-1',
      estimatedQuantityId: 'eq-1',
      rate: 25.5,
      effectiveDate: '2025-06-01',
      note: 'test note',
      isActive: true,
    })
  })
})
