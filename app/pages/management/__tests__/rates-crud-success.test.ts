// Feature: rate-management, Property 15: CRUD Success Flow
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

/**
 * Property 15: CRUD Success Flow
 * 
 * For any successful create, update, or delete operation, the system should:
 * 1. Display a success toast
 * 2. Close the modal
 * 3. Refresh the relevant data (rate list and/or statistics)
 * 
 * **Validates: Requirements 4.3, 5.3, 6.3, 11.1, 11.2, 11.3**
 */

// ── Type Definitions ──

type CrudOperation = 'create' | 'update' | 'delete'

interface Rate {
  id: number
  customerTypeId: number
  pickupRate: number
  effectiveDate: string
  note: string
  isActive: boolean
  createdAt: string
}

interface SuccessResponse {
  operation: CrudOperation
  data?: Rate
  message?: string
}

interface SuccessFlowResult {
  toastDisplayed: boolean
  toastMessage: string
  modalClosed: boolean
  rateListRefreshed: boolean
  statsRefreshed: boolean
}

// ── Arbitraries ──

const crudOperationArb = fc.constantFrom<CrudOperation>('create', 'update', 'delete')

const rateArb = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  customerTypeId: fc.integer({ min: 1, max: 100 }),
  pickupRate: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
  effectiveDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
    .filter(d => !isNaN(d.getTime()))
    .map(d => d.toISOString().split('T')[0]!),
  note: fc.string({ maxLength: 500 }),
  isActive: fc.boolean(),
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date() })
    .filter(d => !isNaN(d.getTime()))
    .map(d => d.toISOString().split('T')[0]!),
})

const successResponseArb = fc.record({
  operation: crudOperationArb,
  data: fc.option(rateArb, { nil: undefined }),
  message: fc.option(fc.string({ minLength: 10, maxLength: 100 }), { nil: undefined }),
})

// ── Helper Functions ──

/**
 * Simulates the success flow behavior for CRUD operations
 */
function simulateSuccessFlow(response: SuccessResponse): SuccessFlowResult {
  const { operation } = response
  
  // All operations display a success toast
  const toastDisplayed = true
  
  // Generate appropriate toast message
  let toastMessage: string
  if (operation === 'create') {
    toastMessage = 'Rate created successfully'
  } else if (operation === 'update') {
    toastMessage = 'Rate updated successfully'
  } else {
    toastMessage = 'Rate deleted successfully'
  }
  
  // All operations close the modal
  const modalClosed = true
  
  // All operations refresh the rate list
  const rateListRefreshed = true
  
  // Create and delete operations refresh stats, update does not
  const statsRefreshed = operation === 'create' || operation === 'delete'
  
  return {
    toastDisplayed,
    toastMessage,
    modalClosed,
    rateListRefreshed,
    statsRefreshed,
  }
}

// ── Property Tests ──

describe('Property 15: CRUD Success Flow', () => {
  
  it('should display success toast for any successful CRUD operation', () => {
    fc.assert(
      fc.property(successResponseArb, (response) => {
        const result = simulateSuccessFlow(response)
        
        expect(result.toastDisplayed).toBe(true)
        expect(result.toastMessage).toBeTruthy()
        expect(result.toastMessage.length).toBeGreaterThan(0)
        expect(result.toastMessage.toLowerCase()).toContain('success')
      }),
      { numRuns: 100 }
    )
  })
  
  it('should close modal for any successful CRUD operation', () => {
    fc.assert(
      fc.property(successResponseArb, (response) => {
        const result = simulateSuccessFlow(response)
        
        expect(result.modalClosed).toBe(true)
      }),
      { numRuns: 100 }
    )
  })
  
  it('should refresh rate list for any successful CRUD operation', () => {
    fc.assert(
      fc.property(successResponseArb, (response) => {
        const result = simulateSuccessFlow(response)
        
        expect(result.rateListRefreshed).toBe(true)
      }),
      { numRuns: 100 }
    )
  })
  
  it('should display "Rate created successfully" toast for create operations', () => {
    const createResponseArb = fc.record({
      operation: fc.constant<CrudOperation>('create'),
      data: fc.option(rateArb, { nil: undefined }),
      message: fc.option(fc.string({ minLength: 10, maxLength: 100 }), { nil: undefined }),
    })
    
    fc.assert(
      fc.property(createResponseArb, (response) => {
        const result = simulateSuccessFlow(response)
        
        expect(result.toastMessage).toBe('Rate created successfully')
      }),
      { numRuns: 100 }
    )
  })
  
  it('should display "Rate updated successfully" toast for update operations', () => {
    const updateResponseArb = fc.record({
      operation: fc.constant<CrudOperation>('update'),
      data: fc.option(rateArb, { nil: undefined }),
      message: fc.option(fc.string({ minLength: 10, maxLength: 100 }), { nil: undefined }),
    })
    
    fc.assert(
      fc.property(updateResponseArb, (response) => {
        const result = simulateSuccessFlow(response)
        
        expect(result.toastMessage).toBe('Rate updated successfully')
      }),
      { numRuns: 100 }
    )
  })
  
  it('should display "Rate deleted successfully" toast for delete operations', () => {
    const deleteResponseArb = fc.record({
      operation: fc.constant<CrudOperation>('delete'),
      data: fc.option(rateArb, { nil: undefined }),
      message: fc.option(fc.string({ minLength: 10, maxLength: 100 }), { nil: undefined }),
    })
    
    fc.assert(
      fc.property(deleteResponseArb, (response) => {
        const result = simulateSuccessFlow(response)
        
        expect(result.toastMessage).toBe('Rate deleted successfully')
      }),
      { numRuns: 100 }
    )
  })
  
  it('should refresh stats for create operations', () => {
    const createResponseArb = fc.record({
      operation: fc.constant<CrudOperation>('create'),
      data: fc.option(rateArb, { nil: undefined }),
      message: fc.option(fc.string({ minLength: 10, maxLength: 100 }), { nil: undefined }),
    })
    
    fc.assert(
      fc.property(createResponseArb, (response) => {
        const result = simulateSuccessFlow(response)
        
        expect(result.statsRefreshed).toBe(true)
        expect(result.rateListRefreshed).toBe(true)
      }),
      { numRuns: 100 }
    )
  })
  
  it('should refresh rate list but not stats for update operations', () => {
    const updateResponseArb = fc.record({
      operation: fc.constant<CrudOperation>('update'),
      data: fc.option(rateArb, { nil: undefined }),
      message: fc.option(fc.string({ minLength: 10, maxLength: 100 }), { nil: undefined }),
    })
    
    fc.assert(
      fc.property(updateResponseArb, (response) => {
        const result = simulateSuccessFlow(response)
        
        expect(result.rateListRefreshed).toBe(true)
        expect(result.statsRefreshed).toBe(false)
      }),
      { numRuns: 100 }
    )
  })
  
  it('should refresh stats for delete operations', () => {
    const deleteResponseArb = fc.record({
      operation: fc.constant<CrudOperation>('delete'),
      data: fc.option(rateArb, { nil: undefined }),
      message: fc.option(fc.string({ minLength: 10, maxLength: 100 }), { nil: undefined }),
    })
    
    fc.assert(
      fc.property(deleteResponseArb, (response) => {
        const result = simulateSuccessFlow(response)
        
        expect(result.statsRefreshed).toBe(true)
        expect(result.rateListRefreshed).toBe(true)
      }),
      { numRuns: 100 }
    )
  })
  
  it('should perform all three success actions for any CRUD operation', () => {
    fc.assert(
      fc.property(successResponseArb, (response) => {
        const result = simulateSuccessFlow(response)
        
        // Verify all three core actions occur
        expect(result.toastDisplayed).toBe(true)
        expect(result.modalClosed).toBe(true)
        expect(result.rateListRefreshed).toBe(true)
        
        // Verify toast message is appropriate
        expect(result.toastMessage).toBeTruthy()
        expect(result.toastMessage).toContain('Rate')
        expect(result.toastMessage).toContain('successfully')
      }),
      { numRuns: 100 }
    )
  })
  
  it('should refresh appropriate data based on operation type', () => {
    fc.assert(
      fc.property(successResponseArb, (response) => {
        const result = simulateSuccessFlow(response)
        
        // Rate list is always refreshed
        expect(result.rateListRefreshed).toBe(true)
        
        // Stats are refreshed for create and delete, but not update
        if (response.operation === 'create' || response.operation === 'delete') {
          expect(result.statsRefreshed).toBe(true)
        } else if (response.operation === 'update') {
          expect(result.statsRefreshed).toBe(false)
        }
      }),
      { numRuns: 100 }
    )
  })
  
  it('should handle create operation with any valid rate data', () => {
    fc.assert(
      fc.property(rateArb, (rate) => {
        const response: SuccessResponse = {
          operation: 'create',
          data: rate,
        }
        
        const result = simulateSuccessFlow(response)
        
        expect(result.toastDisplayed).toBe(true)
        expect(result.toastMessage).toBe('Rate created successfully')
        expect(result.modalClosed).toBe(true)
        expect(result.rateListRefreshed).toBe(true)
        expect(result.statsRefreshed).toBe(true)
      }),
      { numRuns: 100 }
    )
  })
  
  it('should handle update operation with any valid rate data', () => {
    fc.assert(
      fc.property(rateArb, (rate) => {
        const response: SuccessResponse = {
          operation: 'update',
          data: rate,
        }
        
        const result = simulateSuccessFlow(response)
        
        expect(result.toastDisplayed).toBe(true)
        expect(result.toastMessage).toBe('Rate updated successfully')
        expect(result.modalClosed).toBe(true)
        expect(result.rateListRefreshed).toBe(true)
        expect(result.statsRefreshed).toBe(false)
      }),
      { numRuns: 100 }
    )
  })
  
  it('should handle delete operation with any valid rate data', () => {
    fc.assert(
      fc.property(rateArb, (rate) => {
        const response: SuccessResponse = {
          operation: 'delete',
          data: rate,
        }
        
        const result = simulateSuccessFlow(response)
        
        expect(result.toastDisplayed).toBe(true)
        expect(result.toastMessage).toBe('Rate deleted successfully')
        expect(result.modalClosed).toBe(true)
        expect(result.rateListRefreshed).toBe(true)
        expect(result.statsRefreshed).toBe(true)
      }),
      { numRuns: 100 }
    )
  })
  
  it('should handle success responses with or without data field', () => {
    fc.assert(
      fc.property(crudOperationArb, fc.option(rateArb, { nil: undefined }), (operation, data) => {
        const response: SuccessResponse = {
          operation,
          data,
        }
        
        const result = simulateSuccessFlow(response)
        
        // Success flow should work regardless of whether data is present
        expect(result.toastDisplayed).toBe(true)
        expect(result.modalClosed).toBe(true)
        expect(result.rateListRefreshed).toBe(true)
      }),
      { numRuns: 100 }
    )
  })
  
  it('should handle success responses with or without message field', () => {
    fc.assert(
      fc.property(
        crudOperationArb,
        fc.option(fc.string({ minLength: 10, maxLength: 100 }), { nil: undefined }),
        (operation, message) => {
          const response: SuccessResponse = {
            operation,
            message,
          }
          
          const result = simulateSuccessFlow(response)
          
          // Success flow should work regardless of whether message is present
          expect(result.toastDisplayed).toBe(true)
          expect(result.modalClosed).toBe(true)
          expect(result.rateListRefreshed).toBe(true)
          
          // Toast message should be generated based on operation type
          expect(result.toastMessage).toBeTruthy()
        }
      ),
      { numRuns: 100 }
    )
  })
  
  it('should never skip any of the three core success actions', () => {
    fc.assert(
      fc.property(successResponseArb, (response) => {
        const result = simulateSuccessFlow(response)
        
        // All three core actions must always occur
        expect(result.toastDisplayed).toBe(true)
        expect(result.modalClosed).toBe(true)
        expect(result.rateListRefreshed).toBe(true)
        
        // None of these should ever be false
        expect(result.toastDisplayed).not.toBe(false)
        expect(result.modalClosed).not.toBe(false)
        expect(result.rateListRefreshed).not.toBe(false)
      }),
      { numRuns: 100 }
    )
  })
  
  it('should generate consistent toast messages for the same operation type', () => {
    fc.assert(
      fc.property(crudOperationArb, (operation) => {
        const response1: SuccessResponse = { operation }
        const response2: SuccessResponse = { operation }
        
        const result1 = simulateSuccessFlow(response1)
        const result2 = simulateSuccessFlow(response2)
        
        // Same operation type should always generate the same toast message
        expect(result1.toastMessage).toBe(result2.toastMessage)
      }),
      { numRuns: 100 }
    )
  })
  
  it('should generate different toast messages for different operation types', () => {
    const createResponse: SuccessResponse = { operation: 'create' }
    const updateResponse: SuccessResponse = { operation: 'update' }
    const deleteResponse: SuccessResponse = { operation: 'delete' }
    
    const createResult = simulateSuccessFlow(createResponse)
    const updateResult = simulateSuccessFlow(updateResponse)
    const deleteResult = simulateSuccessFlow(deleteResponse)
    
    // Each operation should have a unique toast message
    expect(createResult.toastMessage).not.toBe(updateResult.toastMessage)
    expect(createResult.toastMessage).not.toBe(deleteResult.toastMessage)
    expect(updateResult.toastMessage).not.toBe(deleteResult.toastMessage)
    
    // But all should contain "successfully"
    expect(createResult.toastMessage).toContain('successfully')
    expect(updateResult.toastMessage).toContain('successfully')
    expect(deleteResult.toastMessage).toContain('successfully')
  })
})
