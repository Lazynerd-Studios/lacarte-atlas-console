// Feature: rate-management, Property 5: Create Rate API Payload Structure
// **Validates: Requirements 4.2**
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { formToApiPayload } from '~/utils/rateValidation'

interface AddFormData {
  customerTypeId: string
  pickupRate: string
  effectiveDate: string
  note: string
  isActive: boolean
}

describe('Property 5: Create Rate API Payload Structure', () => {
  it('should contain all required fields with correct data types for any valid form submission', () => {
    // Arbitraries for form data
    const customerTypeIdArb = fc.integer({ min: 1, max: 100 }).map(n => String(n))
    const pickupRateArb = fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }).map(n => String(n.toFixed(2)))
    const effectiveDateArb = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
      .filter(d => !isNaN(d.getTime()))
      .map(d => d.toISOString().split('T')[0]!)
    const noteArb = fc.string({ maxLength: 500 })
    const isActiveArb = fc.boolean()

    const formDataArb = fc.record({
      customerTypeId: customerTypeIdArb,
      pickupRate: pickupRateArb,
      effectiveDate: effectiveDateArb,
      note: noteArb,
      isActive: isActiveArb,
    })

    fc.assert(
      fc.property(formDataArb, (formData) => {
        const payload = formToApiPayload(formData)
        
        // Verify all required fields are present
        expect(payload).toHaveProperty('customerTypeId')
        expect(payload).toHaveProperty('pickupRate')
        expect(payload).toHaveProperty('effectiveDate')
        expect(payload).toHaveProperty('note')
        expect(payload).toHaveProperty('isActive')
        
        // Verify correct data types
        expect(typeof payload.customerTypeId).toBe('number')
        expect(typeof payload.pickupRate).toBe('number')
        expect(typeof payload.effectiveDate).toBe('string')
        expect(typeof payload.note).toBe('string')
        expect(typeof payload.isActive).toBe('boolean')
        
        // Verify correct transformations
        expect(payload.customerTypeId).toBe(Number(formData.customerTypeId))
        expect(payload.pickupRate).toBe(Number(formData.pickupRate))
        expect(payload.effectiveDate).toBe(formData.effectiveDate)
        expect(payload.note).toBe(formData.note.trim())
        expect(payload.isActive).toBe(formData.isActive)
      }),
      { numRuns: 100 }
    )
  })

  it('should correctly transform string inputs to numeric types', () => {
    const customerTypeIdArb = fc.integer({ min: 1, max: 100 }).map(n => String(n))
    const pickupRateArb = fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }).map(n => String(n.toFixed(2)))
    const effectiveDateArb = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
      .filter(d => !isNaN(d.getTime()))
      .map(d => d.toISOString().split('T')[0]!)
    const noteArb = fc.string({ maxLength: 500 })
    const isActiveArb = fc.boolean()

    const formDataArb = fc.record({
      customerTypeId: customerTypeIdArb,
      pickupRate: pickupRateArb,
      effectiveDate: effectiveDateArb,
      note: noteArb,
      isActive: isActiveArb,
    })

    fc.assert(
      fc.property(formDataArb, (formData) => {
        const payload = formToApiPayload(formData)
        
        // Verify numeric conversions
        const expectedCustomerTypeId = Number(formData.customerTypeId)
        const expectedPickupRate = Number(formData.pickupRate)
        
        expect(payload.customerTypeId).toBe(expectedCustomerTypeId)
        expect(payload.pickupRate).toBe(expectedPickupRate)
        expect(Number.isInteger(payload.customerTypeId)).toBe(true)
        expect(typeof payload.pickupRate).toBe('number')
        expect(payload.pickupRate).toBeGreaterThan(0)
      }),
      { numRuns: 100 }
    )
  })

  it('should trim note field while preserving other string fields', () => {
    const customerTypeIdArb = fc.integer({ min: 1, max: 100 }).map(n => String(n))
    const pickupRateArb = fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }).map(n => String(n.toFixed(2)))
    const effectiveDateArb = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
      .filter(d => !isNaN(d.getTime()))
      .map(d => d.toISOString().split('T')[0]!)
    
    // Generate notes with potential leading/trailing whitespace
    const noteArb = fc.string({ maxLength: 500 }).map(s => {
      const whitespace = fc.sample(fc.constantFrom('', ' ', '  ', '\t', '\n'), 1)[0]
      return whitespace + s + whitespace
    })
    const isActiveArb = fc.boolean()

    const formDataArb = fc.record({
      customerTypeId: customerTypeIdArb,
      pickupRate: pickupRateArb,
      effectiveDate: effectiveDateArb,
      note: noteArb,
      isActive: isActiveArb,
    })

    fc.assert(
      fc.property(formDataArb, (formData) => {
        const payload = formToApiPayload(formData)
        
        // Verify note is trimmed
        expect(payload.note).toBe(formData.note.trim())
        
        // Verify effectiveDate is not trimmed (should remain as-is)
        expect(payload.effectiveDate).toBe(formData.effectiveDate)
      }),
      { numRuns: 100 }
    )
  })

  it('should preserve boolean isActive field without transformation', () => {
    const customerTypeIdArb = fc.integer({ min: 1, max: 100 }).map(n => String(n))
    const pickupRateArb = fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }).map(n => String(n.toFixed(2)))
    const effectiveDateArb = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
      .filter(d => !isNaN(d.getTime()))
      .map(d => d.toISOString().split('T')[0]!)
    const noteArb = fc.string({ maxLength: 500 })
    const isActiveArb = fc.boolean()

    const formDataArb = fc.record({
      customerTypeId: customerTypeIdArb,
      pickupRate: pickupRateArb,
      effectiveDate: effectiveDateArb,
      note: noteArb,
      isActive: isActiveArb,
    })

    fc.assert(
      fc.property(formDataArb, (formData) => {
        const payload = formToApiPayload(formData)
        
        // Verify isActive is preserved exactly
        expect(payload.isActive).toBe(formData.isActive)
        expect(typeof payload.isActive).toBe('boolean')
      }),
      { numRuns: 100 }
    )
  })

  it('should maintain ISO date format for effectiveDate', () => {
    const customerTypeIdArb = fc.integer({ min: 1, max: 100 }).map(n => String(n))
    const pickupRateArb = fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }).map(n => String(n.toFixed(2)))
    const effectiveDateArb = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
      .filter(d => !isNaN(d.getTime()))
      .map(d => d.toISOString().split('T')[0]!)
    const noteArb = fc.string({ maxLength: 500 })
    const isActiveArb = fc.boolean()

    const formDataArb = fc.record({
      customerTypeId: customerTypeIdArb,
      pickupRate: pickupRateArb,
      effectiveDate: effectiveDateArb,
      note: noteArb,
      isActive: isActiveArb,
    })

    fc.assert(
      fc.property(formDataArb, (formData) => {
        const payload = formToApiPayload(formData)
        
        // Verify effectiveDate maintains ISO format (YYYY-MM-DD)
        expect(payload.effectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(payload.effectiveDate).toBe(formData.effectiveDate)
      }),
      { numRuns: 100 }
    )
  })
})
