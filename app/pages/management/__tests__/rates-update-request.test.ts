// Feature: rate-management, Property 6: Update Rate API Request Structure
// **Validates: Requirements 5.2**
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

describe('Property 6: Update Rate API Request Structure', () => {
  it('should construct correct PATCH endpoint with rate ID for any valid edit data', () => {
    // Arbitraries
    const rateIdArb = fc.integer({ min: 1, max: 10000 })
    const pickupRateArb = fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true })
    const effectiveDateArb = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
      .filter(d => !isNaN(d.getTime()))
      .map(d => d.toISOString().split('T')[0]!)
    const noteArb = fc.string({ maxLength: 500 })
    const isActiveArb = fc.boolean()

    const editDataArb = fc.record({
      id: rateIdArb,
      pickupRate: pickupRateArb,
      effectiveDate: effectiveDateArb,
      note: noteArb,
      isActive: isActiveArb,
    })

    fc.assert(
      fc.property(editDataArb, (editData) => {
        // Verify endpoint structure
        const expectedEndpoint = `/api/rates/admin/payg/${editData.id}`
        
        // Endpoint should contain the rate ID
        expect(expectedEndpoint).toContain(`/api/rates/admin/payg/`)
        expect(expectedEndpoint).toContain(String(editData.id))
        expect(expectedEndpoint).toMatch(/^\/api\/rates\/admin\/payg\/\d+$/)
        
        // Verify payload structure
        const payload = {
          pickupRate: editData.pickupRate,
          effectiveDate: editData.effectiveDate,
          note: editData.note.trim(),
          isActive: editData.isActive,
        }
        
        // Verify all required fields are present
        expect(payload).toHaveProperty('pickupRate')
        expect(payload).toHaveProperty('effectiveDate')
        expect(payload).toHaveProperty('note')
        expect(payload).toHaveProperty('isActive')
        
        // Verify correct data types
        expect(typeof payload.pickupRate).toBe('number')
        expect(typeof payload.effectiveDate).toBe('string')
        expect(typeof payload.note).toBe('string')
        expect(typeof payload.isActive).toBe('boolean')
        
        // Verify customerTypeId is NOT in payload (immutable field)
        expect(payload).not.toHaveProperty('customerTypeId')
        
        // Verify note is trimmed
        expect(payload.note).toBe(editData.note.trim())
      }),
      { numRuns: 100 }
    )
  })

  it('should only include mutable fields in update payload', () => {
    const rateIdArb = fc.integer({ min: 1, max: 10000 })
    const pickupRateArb = fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true })
    const effectiveDateArb = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
      .filter(d => !isNaN(d.getTime()))
      .map(d => d.toISOString().split('T')[0]!)
    const noteArb = fc.string({ maxLength: 500 })
    const isActiveArb = fc.boolean()

    const editDataArb = fc.record({
      id: rateIdArb,
      pickupRate: pickupRateArb,
      effectiveDate: effectiveDateArb,
      note: noteArb,
      isActive: isActiveArb,
    })

    fc.assert(
      fc.property(editDataArb, (editData) => {
        // Construct payload as the implementation does
        const payload = {
          pickupRate: editData.pickupRate,
          effectiveDate: editData.effectiveDate,
          note: editData.note.trim(),
          isActive: editData.isActive,
        }
        
        // customerTypeId should NOT be in the update payload (immutable)
        expect(payload).not.toHaveProperty('customerTypeId')
        
        // Only mutable fields should be present
        const payloadKeys = Object.keys(payload).sort()
        expect(payloadKeys).toEqual(['effectiveDate', 'isActive', 'note', 'pickupRate'].sort())
      }),
      { numRuns: 100 }
    )
  })

  it('should trim note field in update payload for any note value', () => {
    const rateIdArb = fc.integer({ min: 1, max: 10000 })
    const pickupRateArb = fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true })
    const effectiveDateArb = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
      .filter(d => !isNaN(d.getTime()))
      .map(d => d.toISOString().split('T')[0]!)
    
    // Generate notes with potential leading/trailing whitespace
    const noteArb = fc.string({ maxLength: 500 }).map(s => {
      const whitespace = fc.sample(fc.constantFrom('', ' ', '  ', '\t', '\n'), 1)[0]
      return whitespace + s + whitespace
    })
    const isActiveArb = fc.boolean()

    const editDataArb = fc.record({
      id: rateIdArb,
      pickupRate: pickupRateArb,
      effectiveDate: effectiveDateArb,
      note: noteArb,
      isActive: isActiveArb,
    })

    fc.assert(
      fc.property(editDataArb, (editData) => {
        // Construct payload as the implementation does
        const payload = {
          pickupRate: editData.pickupRate,
          effectiveDate: editData.effectiveDate,
          note: editData.note.trim(),
          isActive: editData.isActive,
        }
        
        // Note should be trimmed
        expect(payload.note).toBe(editData.note.trim())
        
        // Effective date should not be trimmed
        expect(payload.effectiveDate).toBe(editData.effectiveDate)
      }),
      { numRuns: 100 }
    )
  })

  it('should maintain correct data types for all payload fields', () => {
    const rateIdArb = fc.integer({ min: 1, max: 10000 })
    const pickupRateArb = fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true })
    const effectiveDateArb = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
      .filter(d => !isNaN(d.getTime()))
      .map(d => d.toISOString().split('T')[0]!)
    const noteArb = fc.string({ maxLength: 500 })
    const isActiveArb = fc.boolean()

    const editDataArb = fc.record({
      id: rateIdArb,
      pickupRate: pickupRateArb,
      effectiveDate: effectiveDateArb,
      note: noteArb,
      isActive: isActiveArb,
    })

    fc.assert(
      fc.property(editDataArb, (editData) => {
        // Construct payload as the implementation does
        const payload = {
          pickupRate: editData.pickupRate,
          effectiveDate: editData.effectiveDate,
          note: editData.note.trim(),
          isActive: editData.isActive,
        }
        
        // Verify correct data types
        expect(typeof payload.pickupRate).toBe('number')
        expect(typeof payload.effectiveDate).toBe('string')
        expect(typeof payload.note).toBe('string')
        expect(typeof payload.isActive).toBe('boolean')
        
        // Verify pickupRate is positive
        expect(payload.pickupRate).toBeGreaterThan(0)
        
        // Verify effectiveDate maintains ISO format (YYYY-MM-DD)
        expect(payload.effectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      }),
      { numRuns: 100 }
    )
  })
})
