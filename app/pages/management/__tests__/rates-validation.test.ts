// Feature: rate-management
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { validateForm, formToApiPayload } from '~/utils/rateValidation'

interface AddFormData {
  customerTypeId: string
  pickupRate: string
  effectiveDate: string
  note: string
  isActive: boolean
}

// Arbitraries for generating test data
const positiveIntArb = fc.integer({ min: 1, max: 1000 })
const customerTypeIdArb = positiveIntArb.map(n => String(n))
const pickupRateArb = fc.integer({ min: 1, max: 10000 }).map(n => String(n))
const isoDateArb = fc.integer({ min: 1577836800000, max: 1924905600000 })
  .map(timestamp => new Date(timestamp).toISOString().split('T')[0]!)
const noteArb = fc.string({ maxLength: 500 })
const booleanArb = fc.boolean()

// Valid form data generator
const validFormArb = fc.record({
  customerTypeId: customerTypeIdArb,
  pickupRate: pickupRateArb,
  effectiveDate: isoDateArb,
  note: noteArb,
  isActive: booleanArb,
})

// Property 12: Form Validation Completeness
describe('Property 12: Form Validation Completeness', () => {
  it('should validate that customer type is selected for add operations', () => {
    const formDataArb = fc.record({
      customerTypeId: fc.string(),
      pickupRate: pickupRateArb,
      effectiveDate: isoDateArb,
      note: noteArb,
      isActive: booleanArb,
    })

    fc.assert(
      fc.property(formDataArb, (formData) => {
        const errors = validateForm(formData, false) // isEdit = false
        
        if (!formData.customerTypeId) {
          expect(errors.some(e => e.includes('Customer type'))).toBe(true)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('should not require customer type for edit operations', () => {
    const formDataArb = fc.record({
      customerTypeId: fc.constant(''),
      pickupRate: pickupRateArb,
      effectiveDate: isoDateArb,
      note: noteArb,
      isActive: booleanArb,
    })

    fc.assert(
      fc.property(formDataArb, (formData) => {
        const errors = validateForm(formData, true) // isEdit = true
        
        // Should not have customer type error for edit operations
        expect(errors.some(e => e.includes('Customer type'))).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  it('should validate that pickup rate is a positive number', () => {
    const formDataArb = fc.record({
      customerTypeId: customerTypeIdArb,
      pickupRate: fc.oneof(
        fc.string(),
        fc.integer().map(n => String(n)),
        fc.constant(''),
        fc.constant('0'),
        fc.constant('-1'),
        fc.constant('abc')
      ),
      effectiveDate: isoDateArb,
      note: noteArb,
      isActive: booleanArb,
    })

    fc.assert(
      fc.property(formDataArb, (formData) => {
        const errors = validateForm(formData, false)
        const pickupRate = Number(formData.pickupRate)
        
        if (!formData.pickupRate || isNaN(pickupRate) || pickupRate <= 0) {
          expect(errors.some(e => e.includes('pickup rate'))).toBe(true)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('should validate that effective date is provided', () => {
    const formDataArb = fc.record({
      customerTypeId: customerTypeIdArb,
      pickupRate: pickupRateArb,
      effectiveDate: fc.oneof(
        isoDateArb,
        fc.constant(''),
        fc.constant('   ')
      ),
      note: noteArb,
      isActive: booleanArb,
    })

    fc.assert(
      fc.property(formDataArb, (formData) => {
        const errors = validateForm(formData, false)
        
        if (!formData.effectiveDate) {
          expect(errors.some(e => e.includes('Effective date'))).toBe(true)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('should validate all three fields for any form submission', () => {
    const formDataArb = fc.record({
      customerTypeId: fc.string(),
      pickupRate: fc.oneof(
        fc.string(),
        fc.integer().map(n => String(n))
      ),
      effectiveDate: fc.oneof(
        isoDateArb,
        fc.constant('')
      ),
      note: noteArb,
      isActive: booleanArb,
    })

    fc.assert(
      fc.property(formDataArb, (formData) => {
        const errors = validateForm(formData, false)
        
        // Check customer type validation
        if (!formData.customerTypeId) {
          expect(errors.some(e => e.includes('Customer type'))).toBe(true)
        }
        
        // Check pickup rate validation
        const pickupRate = Number(formData.pickupRate)
        if (!formData.pickupRate || isNaN(pickupRate) || pickupRate <= 0) {
          expect(errors.some(e => e.includes('pickup rate'))).toBe(true)
        }
        
        // Check effective date validation
        if (!formData.effectiveDate) {
          expect(errors.some(e => e.includes('Effective date'))).toBe(true)
        }
        
        // If all validations pass, errors should be empty
        if (formData.customerTypeId && 
            formData.pickupRate && !isNaN(pickupRate) && pickupRate > 0 &&
            formData.effectiveDate) {
          expect(errors.length).toBe(0)
        }
      }),
      { numRuns: 100 }
    )
  })
})

// Property 13: Validation Failure Handling
describe('Property 13: Validation Failure Handling', () => {
  function simulateFormSubmission(form: AddFormData, isEdit = false): { shouldProceed: boolean; errorMessage: string } {
    const errors = validateForm(form, isEdit)
    
    if (errors.length > 0) {
      return {
        shouldProceed: false,
        errorMessage: errors[0] || 'Validation error'
      }
    }
    
    return {
      shouldProceed: true,
      errorMessage: ''
    }
  }

  it('should prevent API request when validation fails', () => {
    // Generate forms with at least one validation error
    const invalidFormArb = fc.oneof(
      // Invalid customer type
      fc.record({
        customerTypeId: fc.constant(''),
        pickupRate: pickupRateArb,
        effectiveDate: isoDateArb,
        note: noteArb,
        isActive: booleanArb,
      }),
      // Invalid pickup rate
      fc.record({
        customerTypeId: customerTypeIdArb,
        pickupRate: fc.constantFrom('', '0', '-1', 'abc'),
        effectiveDate: isoDateArb,
        note: noteArb,
        isActive: booleanArb,
      }),
      // Invalid effective date
      fc.record({
        customerTypeId: customerTypeIdArb,
        pickupRate: pickupRateArb,
        effectiveDate: fc.constant(''),
        note: noteArb,
        isActive: booleanArb,
      })
    )

    fc.assert(
      fc.property(invalidFormArb, (formData) => {
        const result = simulateFormSubmission(formData, false)
        
        // Should not proceed with API request
        expect(result.shouldProceed).toBe(false)
        
        // Should have an error message
        expect(result.errorMessage).not.toBe('')
        expect(result.errorMessage.length).toBeGreaterThan(0)
      }),
      { numRuns: 100 }
    )
  })

  it('should display error message in modal when validation fails', () => {
    const invalidFormArb = fc.oneof(
      fc.record({
        customerTypeId: fc.constant(''),
        pickupRate: pickupRateArb,
        effectiveDate: isoDateArb,
        note: noteArb,
        isActive: booleanArb,
      }),
      fc.record({
        customerTypeId: customerTypeIdArb,
        pickupRate: fc.constant('0'),
        effectiveDate: isoDateArb,
        note: noteArb,
        isActive: booleanArb,
      }),
      fc.record({
        customerTypeId: customerTypeIdArb,
        pickupRate: pickupRateArb,
        effectiveDate: fc.constant(''),
        note: noteArb,
        isActive: booleanArb,
      })
    )

    fc.assert(
      fc.property(invalidFormArb, (formData) => {
        const result = simulateFormSubmission(formData, false)
        
        expect(result.shouldProceed).toBe(false)
        expect(result.errorMessage).toBeTruthy()
        
        // Error message should be one of the expected validation messages
        const validErrorMessages = [
          'Customer type is required.',
          'Valid pickup rate is required.',
          'Effective date is required.'
        ]
        expect(validErrorMessages).toContain(result.errorMessage)
      }),
      { numRuns: 100 }
    )
  })

  it('should return first validation error when multiple errors exist', () => {
    const multipleErrorsFormArb = fc.record({
      customerTypeId: fc.constant(''),
      pickupRate: fc.constant(''),
      effectiveDate: fc.constant(''),
      note: noteArb,
      isActive: booleanArb,
    })

    fc.assert(
      fc.property(multipleErrorsFormArb, (formData) => {
        const result = simulateFormSubmission(formData, false)
        
        expect(result.shouldProceed).toBe(false)
        expect(result.errorMessage).toBeTruthy()
        
        // Should return the first error (customer type)
        expect(result.errorMessage).toBe('Customer type is required.')
      }),
      { numRuns: 100 }
    )
  })
})

// Property 14: Validation Success Handling
describe('Property 14: Validation Success Handling', () => {
  function simulateFormSubmission(form: AddFormData, isEdit = false): { shouldProceed: boolean; errorMessage: string } {
    const errors = validateForm(form, isEdit)
    
    if (errors.length > 0) {
      return {
        shouldProceed: false,
        errorMessage: errors[0] || 'Validation error'
      }
    }
    
    return {
      shouldProceed: true,
      errorMessage: ''
    }
  }

  it('should proceed with API request when all validations pass', () => {
    fc.assert(
      fc.property(validFormArb, (formData) => {
        const result = simulateFormSubmission(formData, false)
        
        // Should proceed with API request
        expect(result.shouldProceed).toBe(true)
        
        // Should have no error message
        expect(result.errorMessage).toBe('')
      }),
      { numRuns: 100 }
    )
  })

  it('should have no validation errors when form data is valid', () => {
    fc.assert(
      fc.property(validFormArb, (formData) => {
        const errors = validateForm(formData, false)
        
        expect(errors.length).toBe(0)
        expect(errors).toEqual([])
      }),
      { numRuns: 100 }
    )
  })

  it('should proceed regardless of note content when other fields are valid', () => {
    const validFormWithAnyNoteArb = fc.record({
      customerTypeId: customerTypeIdArb,
      pickupRate: pickupRateArb,
      effectiveDate: isoDateArb,
      note: fc.string({ maxLength: 1000 }), // Any note including empty
      isActive: booleanArb,
    })

    fc.assert(
      fc.property(validFormWithAnyNoteArb, (formData) => {
        const result = simulateFormSubmission(formData, false)
        
        // Note is optional, so validation should pass
        expect(result.shouldProceed).toBe(true)
        expect(result.errorMessage).toBe('')
      }),
      { numRuns: 100 }
    )
  })

  it('should proceed with edit operation when customer type is empty but other fields are valid', () => {
    const validEditFormArb = fc.record({
      customerTypeId: fc.constant(''),
      pickupRate: pickupRateArb,
      effectiveDate: isoDateArb,
      note: noteArb,
      isActive: booleanArb,
    })

    fc.assert(
      fc.property(validEditFormArb, (formData) => {
        const result = simulateFormSubmission(formData, true) // isEdit = true
        
        // Should proceed with API request for edit operations
        expect(result.shouldProceed).toBe(true)
        expect(result.errorMessage).toBe('')
      }),
      { numRuns: 100 }
    )
  })

  it('should transform valid form data to API payload correctly', () => {
    fc.assert(
      fc.property(validFormArb, (formData) => {
        const errors = validateForm(formData, false)
        
        if (errors.length === 0) {
          const payload = formToApiPayload(formData)
          
          // Verify all required fields are present
          expect(payload).toHaveProperty('customerTypeId')
          expect(payload).toHaveProperty('pickupRate')
          expect(payload).toHaveProperty('effectiveDate')
          expect(payload).toHaveProperty('note')
          expect(payload).toHaveProperty('isActive')
          
          // Verify data types are correct
          expect(typeof payload.customerTypeId).toBe('number')
          expect(typeof payload.pickupRate).toBe('number')
          expect(typeof payload.effectiveDate).toBe('string')
          expect(typeof payload.note).toBe('string')
          expect(typeof payload.isActive).toBe('boolean')
          
          // Verify values are transformed correctly
          expect(payload.customerTypeId).toBe(Number(formData.customerTypeId))
          expect(payload.pickupRate).toBe(Number(formData.pickupRate))
          expect(payload.effectiveDate).toBe(formData.effectiveDate)
          expect(payload.note).toBe(formData.note.trim())
          expect(payload.isActive).toBe(formData.isActive)
        }
      }),
      { numRuns: 100 }
    )
  })
})
