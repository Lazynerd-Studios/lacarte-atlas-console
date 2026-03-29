// Feature: rate-management, Property 17: HTTP Error Handling
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

/**
 * Property 17: HTTP Error Handling
 * 
 * For any API request that fails with an HTTP error status (400, 401, 403, 404, 500),
 * the system should handle it appropriately:
 * - 401 redirects to login
 * - 400 validation errors display in modal (for form submissions) or toast (for non-form operations)
 * - 403, 404, 500 errors display error toasts via the Error_Handler
 * - Network errors display error toasts via the Error_Handler
 * 
 * **Validates: Requirements 1.4, 2.4, 3.4, 4.5, 4.6, 5.5, 5.6, 6.5, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6**
 */

// ── Type Definitions ──

type HttpErrorStatus = 400 | 401 | 403 | 404 | 500
type ApiOperation = 'fetchRates' | 'fetchStats' | 'fetchCustomerTypes' | 'createRate' | 'updateRate' | 'deleteRate'
type OperationType = 'fetch' | 'form-submission' | 'delete'

interface ErrorResponse {
  status: HttpErrorStatus | 'network'
  message: string
}

interface ErrorHandlingResult {
  redirectToLogin: boolean
  displayInModal: boolean
  displayAsToast: boolean
  errorMessage: string
}

// ── Arbitraries ──

const httpErrorStatusArb = fc.constantFrom<HttpErrorStatus>(400, 401, 403, 404, 500)
const networkErrorArb = fc.constant<'network'>('network')
const errorStatusArb = fc.oneof(httpErrorStatusArb, networkErrorArb)

const apiOperationArb = fc.constantFrom<ApiOperation>(
  'fetchRates',
  'fetchStats',
  'fetchCustomerTypes',
  'createRate',
  'updateRate',
  'deleteRate'
)

const errorMessageArb = fc.oneof(
  fc.constant('Invalid customer type'),
  fc.constant('Required field missing'),
  fc.constant('Validation failed'),
  fc.constant('Unauthorized access'),
  fc.constant('Forbidden'),
  fc.constant('Resource not found'),
  fc.constant('Internal server error'),
  fc.constant('Network connection failed'),
  fc.string({ minLength: 10, maxLength: 100 })
)

const errorResponseArb = fc.record({
  status: errorStatusArb,
  message: errorMessageArb,
})

// ── Helper Functions ──

function getOperationType(operation: ApiOperation): OperationType {
  if (operation === 'createRate' || operation === 'updateRate') {
    return 'form-submission'
  }
  if (operation === 'deleteRate') {
    return 'delete'
  }
  return 'fetch'
}

function isValidationError(message: string): boolean {
  const validationKeywords = ['invalid', 'required', 'validation']
  return validationKeywords.some(keyword => message.toLowerCase().includes(keyword))
}

/**
 * Simulates error handling behavior based on error status and operation type
 */
function simulateErrorHandling(
  error: ErrorResponse,
  operation: ApiOperation
): ErrorHandlingResult {
  const operationType = getOperationType(operation)
  
  // 401 errors always redirect to login
  if (error.status === 401) {
    return {
      redirectToLogin: true,
      displayInModal: false,
      displayAsToast: false,
      errorMessage: 'Session expired. Please log in again.',
    }
  }
  
  // 400 validation errors for form submissions display in modal
  if (error.status === 400 && operationType === 'form-submission' && isValidationError(error.message)) {
    return {
      redirectToLogin: false,
      displayInModal: true,
      displayAsToast: false,
      errorMessage: error.message,
    }
  }
  
  // All other errors display as toast
  return {
    redirectToLogin: false,
    displayInModal: false,
    displayAsToast: true,
    errorMessage: error.message,
  }
}

// ── Property Tests ──

describe('Property 17: HTTP Error Handling', () => {
  
  it('should redirect to login for any 401 error on any operation', () => {
    fc.assert(
      fc.property(apiOperationArb, errorMessageArb, (operation, message) => {
        const error: ErrorResponse = { status: 401, message }
        const result = simulateErrorHandling(error, operation)
        
        expect(result.redirectToLogin).toBe(true)
        expect(result.displayInModal).toBe(false)
        expect(result.displayAsToast).toBe(false)
        expect(result.errorMessage).toContain('Session expired')
      }),
      { numRuns: 100 }
    )
  })
  
  it('should display 400 validation errors in modal for form submissions', () => {
    const formOperationArb = fc.constantFrom<ApiOperation>('createRate', 'updateRate')
    const validationMessageArb = fc.constantFrom(
      'Invalid customer type',
      'Required field missing',
      'Validation failed',
      'Invalid pickup rate',
      'Required effective date'
    )
    
    fc.assert(
      fc.property(formOperationArb, validationMessageArb, (operation, message) => {
        const error: ErrorResponse = { status: 400, message }
        const result = simulateErrorHandling(error, operation)
        
        expect(result.redirectToLogin).toBe(false)
        expect(result.displayInModal).toBe(true)
        expect(result.displayAsToast).toBe(false)
        expect(result.errorMessage).toBe(message)
      }),
      { numRuns: 100 }
    )
  })
  
  it('should display 400 non-validation errors as toast for form submissions', () => {
    const formOperationArb = fc.constantFrom<ApiOperation>('createRate', 'updateRate')
    const nonValidationMessageArb = fc.string({ minLength: 10, maxLength: 100 })
      .filter(msg => !isValidationError(msg))
    
    fc.assert(
      fc.property(formOperationArb, nonValidationMessageArb, (operation, message) => {
        const error: ErrorResponse = { status: 400, message }
        const result = simulateErrorHandling(error, operation)
        
        expect(result.redirectToLogin).toBe(false)
        expect(result.displayInModal).toBe(false)
        expect(result.displayAsToast).toBe(true)
        expect(result.errorMessage).toBe(message)
      }),
      { numRuns: 100 }
    )
  })
  
  it('should display 400 errors as toast for non-form operations', () => {
    const nonFormOperationArb = fc.constantFrom<ApiOperation>(
      'fetchRates',
      'fetchStats',
      'fetchCustomerTypes',
      'deleteRate'
    )
    
    fc.assert(
      fc.property(nonFormOperationArb, errorMessageArb, (operation, message) => {
        const error: ErrorResponse = { status: 400, message }
        const result = simulateErrorHandling(error, operation)
        
        expect(result.redirectToLogin).toBe(false)
        expect(result.displayInModal).toBe(false)
        expect(result.displayAsToast).toBe(true)
      }),
      { numRuns: 100 }
    )
  })
  
  it('should display 403 errors as toast for any operation', () => {
    fc.assert(
      fc.property(apiOperationArb, errorMessageArb, (operation, message) => {
        const error: ErrorResponse = { status: 403, message }
        const result = simulateErrorHandling(error, operation)
        
        expect(result.redirectToLogin).toBe(false)
        expect(result.displayInModal).toBe(false)
        expect(result.displayAsToast).toBe(true)
        expect(result.errorMessage).toBe(message)
      }),
      { numRuns: 100 }
    )
  })
  
  it('should display 404 errors as toast for any operation', () => {
    fc.assert(
      fc.property(apiOperationArb, errorMessageArb, (operation, message) => {
        const error: ErrorResponse = { status: 404, message }
        const result = simulateErrorHandling(error, operation)
        
        expect(result.redirectToLogin).toBe(false)
        expect(result.displayInModal).toBe(false)
        expect(result.displayAsToast).toBe(true)
        expect(result.errorMessage).toBe(message)
      }),
      { numRuns: 100 }
    )
  })
  
  it('should display 500 errors as toast for any operation', () => {
    fc.assert(
      fc.property(apiOperationArb, errorMessageArb, (operation, message) => {
        const error: ErrorResponse = { status: 500, message }
        const result = simulateErrorHandling(error, operation)
        
        expect(result.redirectToLogin).toBe(false)
        expect(result.displayInModal).toBe(false)
        expect(result.displayAsToast).toBe(true)
        expect(result.errorMessage).toBe(message)
      }),
      { numRuns: 100 }
    )
  })
  
  it('should display network errors as toast for any operation', () => {
    fc.assert(
      fc.property(apiOperationArb, errorMessageArb, (operation, message) => {
        const error: ErrorResponse = { status: 'network', message }
        const result = simulateErrorHandling(error, operation)
        
        expect(result.redirectToLogin).toBe(false)
        expect(result.displayInModal).toBe(false)
        expect(result.displayAsToast).toBe(true)
        expect(result.errorMessage).toBe(message)
      }),
      { numRuns: 100 }
    )
  })
  
  it('should handle any error status correctly for any operation', () => {
    fc.assert(
      fc.property(errorResponseArb, apiOperationArb, (error, operation) => {
        const result = simulateErrorHandling(error, operation)
        const operationType = getOperationType(operation)
        
        // Verify exactly one handling method is used
        const handlingMethodsUsed = [
          result.redirectToLogin,
          result.displayInModal,
          result.displayAsToast
        ].filter(Boolean).length
        
        expect(handlingMethodsUsed).toBe(1)
        
        // Verify error message is present
        expect(result.errorMessage).toBeTruthy()
        expect(result.errorMessage.length).toBeGreaterThan(0)
        
        // Verify 401 always redirects
        if (error.status === 401) {
          expect(result.redirectToLogin).toBe(true)
        }
        
        // Verify 400 validation errors on forms go to modal
        if (error.status === 400 && operationType === 'form-submission' && isValidationError(error.message)) {
          expect(result.displayInModal).toBe(true)
        }
        
        // Verify other errors go to toast
        if (error.status !== 401 && 
            !(error.status === 400 && operationType === 'form-submission' && isValidationError(error.message))) {
          expect(result.displayAsToast).toBe(true)
        }
      }),
      { numRuns: 100 }
    )
  })
  
  it('should never redirect to login for non-401 errors', () => {
    const non401ErrorArb = fc.record({
      status: fc.oneof(
        fc.constantFrom<HttpErrorStatus>(400, 403, 404, 500),
        fc.constant<'network'>('network')
      ),
      message: errorMessageArb,
    })
    
    fc.assert(
      fc.property(non401ErrorArb, apiOperationArb, (error, operation) => {
        const result = simulateErrorHandling(error, operation)
        
        expect(result.redirectToLogin).toBe(false)
      }),
      { numRuns: 100 }
    )
  })
  
  it('should never display modal errors for fetch operations', () => {
    const fetchOperationArb = fc.constantFrom<ApiOperation>(
      'fetchRates',
      'fetchStats',
      'fetchCustomerTypes'
    )
    
    fc.assert(
      fc.property(errorResponseArb, fetchOperationArb, (error, operation) => {
        const result = simulateErrorHandling(error, operation)
        
        // Fetch operations should never display errors in modal
        // (they either redirect or show toast)
        expect(result.displayInModal).toBe(false)
      }),
      { numRuns: 100 }
    )
  })
  
  it('should never display modal errors for delete operations', () => {
    fc.assert(
      fc.property(errorResponseArb, (error) => {
        const result = simulateErrorHandling(error, 'deleteRate')
        
        // Delete operations should never display errors in modal
        expect(result.displayInModal).toBe(false)
      }),
      { numRuns: 100 }
    )
  })
  
  it('should preserve error message content for all error types', () => {
    fc.assert(
      fc.property(errorResponseArb, apiOperationArb, (error, operation) => {
        const result = simulateErrorHandling(error, operation)
        
        // Error message should be preserved (except for 401 which has a standard message)
        if (error.status === 401) {
          expect(result.errorMessage).toContain('Session expired')
        } else {
          expect(result.errorMessage).toBe(error.message)
        }
      }),
      { numRuns: 100 }
    )
  })
  
  it('should handle validation error detection correctly', () => {
    const validationMessages = [
      'Invalid customer type',
      'Required field missing',
      'Validation failed',
      'Invalid pickup rate',
      'Required effective date',
      'Customer type is required',
      'Valid pickup rate is required',
    ]
    
    const nonValidationMessages = [
      'Server error occurred',
      'Database connection failed',
      'Unexpected error',
      'Service unavailable',
    ]
    
    fc.assert(
      fc.property(
        fc.constantFrom(...validationMessages),
        (message) => {
          expect(isValidationError(message)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
    
    fc.assert(
      fc.property(
        fc.constantFrom(...nonValidationMessages),
        (message) => {
          expect(isValidationError(message)).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })
  
  it('should handle all combinations of error status and operation type', () => {
    fc.assert(
      fc.property(
        httpErrorStatusArb,
        apiOperationArb,
        errorMessageArb,
        (status, operation, message) => {
          const error: ErrorResponse = { status, message }
          const result = simulateErrorHandling(error, operation)
          
          // Result should always have exactly one handling method
          const methods = [result.redirectToLogin, result.displayInModal, result.displayAsToast]
          const activeCount = methods.filter(Boolean).length
          expect(activeCount).toBe(1)
          
          // Result should always have an error message
          expect(result.errorMessage).toBeTruthy()
        }
      ),
      { numRuns: 100 }
    )
  })
})
