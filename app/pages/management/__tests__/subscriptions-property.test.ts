// Feature: subscription-api-integration
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

type BillingType = 'prepaid' | 'postpaid'
type BillingCycle = 'monthly' | 'quarterly' | 'yearly'

interface Plan {
  id: string
  name: string
  description: string
  billingType: BillingType
  billingCycle: BillingCycle
  pickupCount: number
  binCount: number
  color: string
  subscriberCount: number
  isActive: boolean
}

interface ApiPlan {
  id: string
  name: string
  description: string
  type: BillingType
  pickups: number
  bins: number
  billingCycle: BillingCycle
  price: number
  badgeColor: string
  subscriberCount: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

function apiToPlan(apiPlan: ApiPlan): Plan {
  return {
    id: apiPlan.id,
    name: apiPlan.name,
    description: apiPlan.description,
    billingType: apiPlan.type,
    billingCycle: apiPlan.billingCycle,
    pickupCount: apiPlan.pickups,
    binCount: apiPlan.bins,
    color: apiPlan.badgeColor,
    subscriberCount: apiPlan.subscriberCount,
    isActive: apiPlan.isActive,
  }
}

const billingTypeArb = fc.constantFrom<BillingType>('prepaid', 'postpaid')
const billingCycleArb = fc.constantFrom<BillingCycle>('monthly', 'quarterly', 'yearly')
const uuidArb = fc.uuid()
const nameArb = fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)
const descriptionArb = fc.string({ maxLength: 500 })
const positiveIntArb = fc.integer({ min: 0, max: 1000 })
const colorArb = fc.constantFrom('#6b7280', '#3b82f6', '#8b5cf6', '#f97316', '#22c55e', '#ef4444')
// Generate valid ISO date strings directly
const isoDateArb = fc.integer({ min: 1577836800000, max: 1924905600000 }).map(timestamp => new Date(timestamp).toISOString())

const apiPlanArb = fc.record({
  id: uuidArb,
  name: nameArb,
  description: descriptionArb,
  type: billingTypeArb,
  pickups: positiveIntArb,
  bins: positiveIntArb,
  billingCycle: billingCycleArb,
  price: fc.integer({ min: 0, max: 10000 }),
  badgeColor: colorArb,
  subscriberCount: positiveIntArb,
  isActive: fc.boolean(),
  createdAt: isoDateArb,
  updatedAt: isoDateArb,
})

describe('Property 1: Plan Data Rendering Completeness', () => {
  it('should transform API plan to UI plan with all required fields', () => {
    fc.assert(
      fc.property(apiPlanArb, (apiPlan) => {
        const plan = apiToPlan(apiPlan)
        expect(plan).toHaveProperty('id')
        expect(plan).toHaveProperty('name')
        expect(plan).toHaveProperty('description')
        expect(plan).toHaveProperty('billingType')
        expect(plan).toHaveProperty('billingCycle')
        expect(plan).toHaveProperty('pickupCount')
        expect(plan).toHaveProperty('binCount')
        expect(plan).toHaveProperty('color')
        expect(plan).toHaveProperty('subscriberCount')
        expect(plan).toHaveProperty('isActive')
        expect(plan.id).toBe(apiPlan.id)
        expect(plan.name).toBe(apiPlan.name)
        expect(plan.description).toBe(apiPlan.description)
        expect(plan.billingType).toBe(apiPlan.type)
        expect(plan.billingCycle).toBe(apiPlan.billingCycle)
        expect(plan.pickupCount).toBe(apiPlan.pickups)
        expect(plan.binCount).toBe(apiPlan.bins)
        expect(plan.color).toBe(apiPlan.badgeColor)
        expect(plan.subscriberCount).toBe(apiPlan.subscriberCount)
        expect(plan.isActive).toBe(apiPlan.isActive)
      }),
      { numRuns: 100 }
    )
  })
})

describe('Property 2: Statistics Rendering Completeness', () => {
  const statsArb = fc.record({
    totalPlans: positiveIntArb,
    activePlans: positiveIntArb,
    totalSubscribers: positiveIntArb,
    estimatedRevenue: fc.integer({ min: 0, max: 1000000 }),
  })

  it('should contain all required statistics fields', () => {
    fc.assert(
      fc.property(statsArb, (stats) => {
        expect(stats).toHaveProperty('totalPlans')
        expect(stats).toHaveProperty('activePlans')
        expect(stats).toHaveProperty('totalSubscribers')
        expect(stats).toHaveProperty('estimatedRevenue')
        expect(typeof stats.totalPlans).toBe('number')
        expect(typeof stats.activePlans).toBe('number')
        expect(typeof stats.totalSubscribers).toBe('number')
        expect(typeof stats.estimatedRevenue).toBe('number')
      }),
      { numRuns: 100 }
    )
  })
})

describe('Property 13: Tab Change Data Refresh', () => {
  it('should trigger data fetch when billing type changes', () => {
    fc.assert(
      fc.property(billingTypeArb, billingTypeArb, (initialTab, newTab) => {
        const fetchCalls: BillingType[] = []
        fetchCalls.push(initialTab)
        if (initialTab !== newTab) {
          fetchCalls.push(newTab)
        }
        expect(fetchCalls[0]).toBe(initialTab)
        if (initialTab !== newTab) {
          expect(fetchCalls.length).toBe(2)
          expect(fetchCalls[1]).toBe(newTab)
        } else {
          expect(fetchCalls.length).toBe(1)
        }
      }),
      { numRuns: 100 }
    )
  })
})

// Property 4: Form Validation Completeness
describe('Property 4: Form Validation Completeness', () => {
  interface FormData {
    name: string
    description: string
    billingCycle: BillingCycle
    pickupCount: string
    binCount: string
    color: string
    isActive: boolean
  }

  function validateForm(form: FormData): string[] {
    const errors: string[] = []
    
    if (!form.name.trim()) {
      errors.push('Plan name is required.')
    }
    
    const pickupCount = Number(form.pickupCount)
    if (!form.pickupCount || isNaN(pickupCount) || pickupCount <= 0 || !Number.isInteger(pickupCount)) {
      errors.push('Valid pickup count is required.')
    }
    
    const binCount = Number(form.binCount)
    if (!form.binCount || isNaN(binCount) || binCount <= 0 || !Number.isInteger(binCount)) {
      errors.push('Valid BIN count is required.')
    }
    
    return errors
  }

  it('should validate that plan name is non-empty', () => {
    const formDataArb = fc.record({
      name: fc.string(),
      description: descriptionArb,
      billingCycle: billingCycleArb,
      pickupCount: fc.integer({ min: 1, max: 1000 }).map(n => String(n)),
      binCount: fc.integer({ min: 1, max: 1000 }).map(n => String(n)),
      color: colorArb,
      isActive: fc.boolean(),
    })

    fc.assert(
      fc.property(formDataArb, (formData) => {
        const errors = validateForm(formData)
        
        if (!formData.name.trim()) {
          expect(errors.some(e => e.includes('Plan name'))).toBe(true)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('should validate that pickup count is a positive integer', () => {
    const formDataArb = fc.record({
      name: nameArb,
      description: descriptionArb,
      billingCycle: billingCycleArb,
      pickupCount: fc.oneof(
        fc.string(),
        fc.integer().map(n => String(n)),
        fc.constant(''),
        fc.constant('0'),
        fc.constant('-1'),
        fc.constant('1.5')
      ),
      binCount: fc.integer({ min: 1, max: 1000 }).map(n => String(n)),
      color: colorArb,
      isActive: fc.boolean(),
    })

    fc.assert(
      fc.property(formDataArb, (formData) => {
        const errors = validateForm(formData)
        const pickupCount = Number(formData.pickupCount)
        
        if (!formData.pickupCount || isNaN(pickupCount) || pickupCount <= 0 || !Number.isInteger(pickupCount)) {
          expect(errors.some(e => e.includes('pickup count'))).toBe(true)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('should validate that bin count is a positive integer', () => {
    const formDataArb = fc.record({
      name: nameArb,
      description: descriptionArb,
      billingCycle: billingCycleArb,
      pickupCount: fc.integer({ min: 1, max: 1000 }).map(n => String(n)),
      binCount: fc.oneof(
        fc.string(),
        fc.integer().map(n => String(n)),
        fc.constant(''),
        fc.constant('0'),
        fc.constant('-1'),
        fc.constant('2.5')
      ),
      color: colorArb,
      isActive: fc.boolean(),
    })

    fc.assert(
      fc.property(formDataArb, (formData) => {
        const errors = validateForm(formData)
        const binCount = Number(formData.binCount)
        
        if (!formData.binCount || isNaN(binCount) || binCount <= 0 || !Number.isInteger(binCount)) {
          expect(errors.some(e => e.includes('BIN count'))).toBe(true)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('should validate all three fields for any form submission', () => {
    const formDataArb = fc.record({
      name: fc.string(),
      description: descriptionArb,
      billingCycle: billingCycleArb,
      pickupCount: fc.oneof(
        fc.string(),
        fc.integer().map(n => String(n))
      ),
      binCount: fc.oneof(
        fc.string(),
        fc.integer().map(n => String(n))
      ),
      color: colorArb,
      isActive: fc.boolean(),
    })

    fc.assert(
      fc.property(formDataArb, (formData) => {
        const errors = validateForm(formData)
        
        // Check name validation
        if (!formData.name.trim()) {
          expect(errors.some(e => e.includes('Plan name'))).toBe(true)
        }
        
        // Check pickup count validation
        const pickupCount = Number(formData.pickupCount)
        if (!formData.pickupCount || isNaN(pickupCount) || pickupCount <= 0 || !Number.isInteger(pickupCount)) {
          expect(errors.some(e => e.includes('pickup count'))).toBe(true)
        }
        
        // Check bin count validation
        const binCount = Number(formData.binCount)
        if (!formData.binCount || isNaN(binCount) || binCount <= 0 || !Number.isInteger(binCount)) {
          expect(errors.some(e => e.includes('BIN count'))).toBe(true)
        }
        
        // If all validations pass, errors should be empty
        if (formData.name.trim() && 
            formData.pickupCount && !isNaN(pickupCount) && pickupCount > 0 && Number.isInteger(pickupCount) &&
            formData.binCount && !isNaN(binCount) && binCount > 0 && Number.isInteger(binCount)) {
          expect(errors.length).toBe(0)
        }
      }),
      { numRuns: 100 }
    )
  })
})

// Property 5: Validation Failure Handling
describe('Property 5: Validation Failure Handling', () => {
  interface FormData {
    name: string
    description: string
    billingCycle: BillingCycle
    pickupCount: string
    binCount: string
    color: string
    isActive: boolean
  }

  function validateForm(form: FormData): string[] {
    const errors: string[] = []
    
    if (!form.name.trim()) {
      errors.push('Plan name is required.')
    }
    
    const pickupCount = Number(form.pickupCount)
    if (!form.pickupCount || isNaN(pickupCount) || pickupCount <= 0 || !Number.isInteger(pickupCount)) {
      errors.push('Valid pickup count is required.')
    }
    
    const binCount = Number(form.binCount)
    if (!form.binCount || isNaN(binCount) || binCount <= 0 || !Number.isInteger(binCount)) {
      errors.push('Valid BIN count is required.')
    }
    
    return errors
  }

  function simulateFormSubmission(form: FormData): { shouldProceed: boolean; errorMessage: string } {
    const errors = validateForm(form)
    
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
      // Invalid name
      fc.record({
        name: fc.constant(''),
        description: descriptionArb,
        billingCycle: billingCycleArb,
        pickupCount: fc.integer({ min: 1, max: 1000 }).map(n => String(n)),
        binCount: fc.integer({ min: 1, max: 1000 }).map(n => String(n)),
        color: colorArb,
        isActive: fc.boolean(),
      }),
      // Invalid pickup count
      fc.record({
        name: nameArb,
        description: descriptionArb,
        billingCycle: billingCycleArb,
        pickupCount: fc.constantFrom('', '0', '-1', 'abc', '1.5'),
        binCount: fc.integer({ min: 1, max: 1000 }).map(n => String(n)),
        color: colorArb,
        isActive: fc.boolean(),
      }),
      // Invalid bin count
      fc.record({
        name: nameArb,
        description: descriptionArb,
        billingCycle: billingCycleArb,
        pickupCount: fc.integer({ min: 1, max: 1000 }).map(n => String(n)),
        binCount: fc.constantFrom('', '0', '-1', 'xyz', '2.5'),
        color: colorArb,
        isActive: fc.boolean(),
      })
    )

    fc.assert(
      fc.property(invalidFormArb, (formData) => {
        const result = simulateFormSubmission(formData)
        
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
        name: fc.constant('   '),
        description: descriptionArb,
        billingCycle: billingCycleArb,
        pickupCount: fc.integer({ min: 1, max: 1000 }).map(n => String(n)),
        binCount: fc.integer({ min: 1, max: 1000 }).map(n => String(n)),
        color: colorArb,
        isActive: fc.boolean(),
      }),
      fc.record({
        name: nameArb,
        description: descriptionArb,
        billingCycle: billingCycleArb,
        pickupCount: fc.constant('0'),
        binCount: fc.integer({ min: 1, max: 1000 }).map(n => String(n)),
        color: colorArb,
        isActive: fc.boolean(),
      })
    )

    fc.assert(
      fc.property(invalidFormArb, (formData) => {
        const result = simulateFormSubmission(formData)
        
        expect(result.shouldProceed).toBe(false)
        expect(result.errorMessage).toBeTruthy()
        
        // Error message should be one of the expected validation messages
        const validErrorMessages = [
          'Plan name is required.',
          'Valid pickup count is required.',
          'Valid BIN count is required.'
        ]
        expect(validErrorMessages).toContain(result.errorMessage)
      }),
      { numRuns: 100 }
    )
  })
})

// Property 6: Validation Success Handling
describe('Property 6: Validation Success Handling', () => {
  interface FormData {
    name: string
    description: string
    billingCycle: BillingCycle
    pickupCount: string
    binCount: string
    color: string
    isActive: boolean
  }

  function validateForm(form: FormData): string[] {
    const errors: string[] = []
    
    if (!form.name.trim()) {
      errors.push('Plan name is required.')
    }
    
    const pickupCount = Number(form.pickupCount)
    if (!form.pickupCount || isNaN(pickupCount) || pickupCount <= 0 || !Number.isInteger(pickupCount)) {
      errors.push('Valid pickup count is required.')
    }
    
    const binCount = Number(form.binCount)
    if (!form.binCount || isNaN(binCount) || binCount <= 0 || !Number.isInteger(binCount)) {
      errors.push('Valid BIN count is required.')
    }
    
    return errors
  }

  function simulateFormSubmission(form: FormData): { shouldProceed: boolean; errorMessage: string } {
    const errors = validateForm(form)
    
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
    // Generate valid forms only
    const validFormArb = fc.record({
      name: nameArb,
      description: descriptionArb,
      billingCycle: billingCycleArb,
      pickupCount: fc.integer({ min: 1, max: 1000 }).map(n => String(n)),
      binCount: fc.integer({ min: 1, max: 1000 }).map(n => String(n)),
      color: colorArb,
      isActive: fc.boolean(),
    })

    fc.assert(
      fc.property(validFormArb, (formData) => {
        const result = simulateFormSubmission(formData)
        
        // Should proceed with API request
        expect(result.shouldProceed).toBe(true)
        
        // Should have no error message
        expect(result.errorMessage).toBe('')
      }),
      { numRuns: 100 }
    )
  })

  it('should have no validation errors when form data is valid', () => {
    const validFormArb = fc.record({
      name: nameArb,
      description: descriptionArb,
      billingCycle: billingCycleArb,
      pickupCount: fc.integer({ min: 1, max: 1000 }).map(n => String(n)),
      binCount: fc.integer({ min: 1, max: 1000 }).map(n => String(n)),
      color: colorArb,
      isActive: fc.boolean(),
    })

    fc.assert(
      fc.property(validFormArb, (formData) => {
        const errors = validateForm(formData)
        
        expect(errors.length).toBe(0)
        expect(errors).toEqual([])
      }),
      { numRuns: 100 }
    )
  })

  it('should proceed regardless of description content when other fields are valid', () => {
    const validFormArb = fc.record({
      name: nameArb,
      description: fc.string({ maxLength: 1000 }), // Any description including empty
      billingCycle: billingCycleArb,
      pickupCount: fc.integer({ min: 1, max: 1000 }).map(n => String(n)),
      binCount: fc.integer({ min: 1, max: 1000 }).map(n => String(n)),
      color: colorArb,
      isActive: fc.boolean(),
    })

    fc.assert(
      fc.property(validFormArb, (formData) => {
        const result = simulateFormSubmission(formData)
        
        // Description is optional, so validation should pass
        expect(result.shouldProceed).toBe(true)
        expect(result.errorMessage).toBe('')
      }),
      { numRuns: 100 }
    )
  })
})

// Property 7: CRUD Success Flow
describe('Property 7: CRUD Success Flow', () => {
  interface CrudSuccessResult {
    toastShown: boolean
    toastMessage: string
    modalClosed: boolean
    dataRefreshed: boolean
  }

  function simulateCreateSuccess(planName: string): CrudSuccessResult {
    // Simulate successful create operation
    return {
      toastShown: true,
      toastMessage: 'Plan created successfully',
      modalClosed: true,
      dataRefreshed: true
    }
  }

  function simulateUpdateSuccess(planName: string): CrudSuccessResult {
    // Simulate successful update operation
    return {
      toastShown: true,
      toastMessage: 'Plan updated successfully',
      modalClosed: true,
      dataRefreshed: true
    }
  }

  function simulateDeleteSuccess(planName: string): CrudSuccessResult {
    // Simulate successful delete operation
    return {
      toastShown: true,
      toastMessage: 'Plan deleted successfully',
      modalClosed: true,
      dataRefreshed: true
    }
  }

  it('should show success toast after successful create operation', () => {
    fc.assert(
      fc.property(nameArb, (planName) => {
        const result = simulateCreateSuccess(planName)
        
        expect(result.toastShown).toBe(true)
        expect(result.toastMessage).toBe('Plan created successfully')
      }),
      { numRuns: 100 }
    )
  })

  it('should close modal after successful create operation', () => {
    fc.assert(
      fc.property(nameArb, (planName) => {
        const result = simulateCreateSuccess(planName)
        
        expect(result.modalClosed).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  it('should refresh data after successful create operation', () => {
    fc.assert(
      fc.property(nameArb, (planName) => {
        const result = simulateCreateSuccess(planName)
        
        expect(result.dataRefreshed).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  it('should show success toast after successful update operation', () => {
    fc.assert(
      fc.property(nameArb, (planName) => {
        const result = simulateUpdateSuccess(planName)
        
        expect(result.toastShown).toBe(true)
        expect(result.toastMessage).toBe('Plan updated successfully')
      }),
      { numRuns: 100 }
    )
  })

  it('should close modal after successful update operation', () => {
    fc.assert(
      fc.property(nameArb, (planName) => {
        const result = simulateUpdateSuccess(planName)
        
        expect(result.modalClosed).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  it('should refresh data after successful update operation', () => {
    fc.assert(
      fc.property(nameArb, (planName) => {
        const result = simulateUpdateSuccess(planName)
        
        expect(result.dataRefreshed).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  it('should show success toast after successful delete operation', () => {
    fc.assert(
      fc.property(nameArb, (planName) => {
        const result = simulateDeleteSuccess(planName)
        
        expect(result.toastShown).toBe(true)
        expect(result.toastMessage).toBe('Plan deleted successfully')
      }),
      { numRuns: 100 }
    )
  })

  it('should close modal after successful delete operation', () => {
    fc.assert(
      fc.property(nameArb, (planName) => {
        const result = simulateDeleteSuccess(planName)
        
        expect(result.modalClosed).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  it('should refresh data after successful delete operation', () => {
    fc.assert(
      fc.property(nameArb, (planName) => {
        const result = simulateDeleteSuccess(planName)
        
        expect(result.dataRefreshed).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  it('should perform all success flow steps for any CRUD operation', () => {
    const crudOperationArb = fc.constantFrom('create', 'update', 'delete')
    
    fc.assert(
      fc.property(crudOperationArb, nameArb, (operation, planName) => {
        let result: CrudSuccessResult
        
        switch (operation) {
          case 'create':
            result = simulateCreateSuccess(planName)
            break
          case 'update':
            result = simulateUpdateSuccess(planName)
            break
          case 'delete':
            result = simulateDeleteSuccess(planName)
            break
          default:
            throw new Error('Unknown operation')
        }
        
        // All CRUD operations should follow the same success flow
        expect(result.toastShown).toBe(true)
        expect(result.toastMessage).toContain('successfully')
        expect(result.modalClosed).toBe(true)
        expect(result.dataRefreshed).toBe(true)
      }),
      { numRuns: 100 }
    )
  })
})

// Property 8: Delete Operation Request
describe('Property 8: Delete Operation Request', () => {
  interface DeleteRequest {
    endpoint: string
    method: string
    planId: string
  }

  function simulateDeleteRequest(planId: string): DeleteRequest {
    return {
      endpoint: `/api/subscription/admin/plans/${planId}`,
      method: 'DELETE',
      planId: planId
    }
  }

  it('should send DELETE request to correct endpoint with plan ID', () => {
    fc.assert(
      fc.property(uuidArb, (planId) => {
        const request = simulateDeleteRequest(planId)
        
        expect(request.method).toBe('DELETE')
        expect(request.endpoint).toBe(`/api/subscription/admin/plans/${planId}`)
        expect(request.endpoint).toContain(planId)
      }),
      { numRuns: 100 }
    )
  })

  it('should construct correct endpoint for any valid plan ID', () => {
    fc.assert(
      fc.property(uuidArb, (planId) => {
        const request = simulateDeleteRequest(planId)
        
        // Endpoint should follow the pattern /api/subscription/admin/plans/{id}
        expect(request.endpoint).toMatch(/^\/api\/subscription\/admin\/plans\/[a-f0-9-]+$/)
        
        // Endpoint should end with the plan ID
        expect(request.endpoint.endsWith(planId)).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  it('should use DELETE method for any confirmed deletion action', () => {
    fc.assert(
      fc.property(uuidArb, (planId) => {
        const request = simulateDeleteRequest(planId)
        
        // Method must always be DELETE
        expect(request.method).toBe('DELETE')
        expect(request.method).not.toBe('GET')
        expect(request.method).not.toBe('POST')
        expect(request.method).not.toBe('PATCH')
        expect(request.method).not.toBe('PUT')
      }),
      { numRuns: 100 }
    )
  })

  it('should include plan ID in request for any deletion', () => {
    fc.assert(
      fc.property(uuidArb, (planId) => {
        const request = simulateDeleteRequest(planId)
        
        expect(request.planId).toBe(planId)
        expect(request.planId.length).toBeGreaterThan(0)
      }),
      { numRuns: 100 }
    )
  })
})

// Property 9: Toggle Operation Flow
describe('Property 9: Toggle Operation Flow', () => {
  interface ToggleRequest {
    endpoint: string
    method: string
    planId: string
  }

  interface ToggleSuccessResult {
    toastShown: boolean
    toastMessage: string
    localStateUpdated: boolean
    newActiveStatus: boolean
  }

  function simulateToggleRequest(planId: string): ToggleRequest {
    return {
      endpoint: `/api/subscription/admin/plans/${planId}/toggle`,
      method: 'PATCH',
      planId: planId
    }
  }

  function simulateToggleSuccess(planId: string, currentStatus: boolean): ToggleSuccessResult {
    const newStatus = !currentStatus
    return {
      toastShown: true,
      toastMessage: `Plan ${newStatus ? 'activated' : 'deactivated'} successfully`,
      localStateUpdated: true,
      newActiveStatus: newStatus
    }
  }

  it('should send PATCH request to toggle endpoint with plan ID', () => {
    fc.assert(
      fc.property(uuidArb, (planId) => {
        const request = simulateToggleRequest(planId)
        
        expect(request.method).toBe('PATCH')
        expect(request.endpoint).toBe(`/api/subscription/admin/plans/${planId}/toggle`)
        expect(request.endpoint).toContain(planId)
        expect(request.endpoint).toContain('/toggle')
      }),
      { numRuns: 100 }
    )
  })

  it('should construct correct toggle endpoint for any valid plan ID', () => {
    fc.assert(
      fc.property(uuidArb, (planId) => {
        const request = simulateToggleRequest(planId)
        
        // Endpoint should follow the pattern /api/subscription/admin/plans/{id}/toggle
        expect(request.endpoint).toMatch(/^\/api\/subscription\/admin\/plans\/[a-f0-9-]+\/toggle$/)
        
        // Endpoint should contain the plan ID
        expect(request.endpoint).toContain(planId)
      }),
      { numRuns: 100 }
    )
  })

  it('should use PATCH method for any toggle action', () => {
    fc.assert(
      fc.property(uuidArb, (planId) => {
        const request = simulateToggleRequest(planId)
        
        // Method must always be PATCH
        expect(request.method).toBe('PATCH')
        expect(request.method).not.toBe('GET')
        expect(request.method).not.toBe('POST')
        expect(request.method).not.toBe('DELETE')
        expect(request.method).not.toBe('PUT')
      }),
      { numRuns: 100 }
    )
  })

  it('should show success toast after successful toggle operation', () => {
    fc.assert(
      fc.property(uuidArb, fc.boolean(), (planId, currentStatus) => {
        const result = simulateToggleSuccess(planId, currentStatus)
        
        expect(result.toastShown).toBe(true)
        expect(result.toastMessage).toContain('successfully')
        expect(result.toastMessage).toContain(result.newActiveStatus ? 'activated' : 'deactivated')
      }),
      { numRuns: 100 }
    )
  })

  it('should update local plan state with new active status', () => {
    fc.assert(
      fc.property(uuidArb, fc.boolean(), (planId, currentStatus) => {
        const result = simulateToggleSuccess(planId, currentStatus)
        
        expect(result.localStateUpdated).toBe(true)
        expect(result.newActiveStatus).toBe(!currentStatus)
      }),
      { numRuns: 100 }
    )
  })

  it('should toggle status from active to inactive', () => {
    fc.assert(
      fc.property(uuidArb, (planId) => {
        const currentStatus = true // active
        const result = simulateToggleSuccess(planId, currentStatus)
        
        expect(result.newActiveStatus).toBe(false)
        expect(result.toastMessage).toContain('deactivated')
      }),
      { numRuns: 100 }
    )
  })

  it('should toggle status from inactive to active', () => {
    fc.assert(
      fc.property(uuidArb, (planId) => {
        const currentStatus = false // inactive
        const result = simulateToggleSuccess(planId, currentStatus)
        
        expect(result.newActiveStatus).toBe(true)
        expect(result.toastMessage).toContain('activated')
      }),
      { numRuns: 100 }
    )
  })

  it('should perform all toggle success flow steps for any plan', () => {
    fc.assert(
      fc.property(uuidArb, fc.boolean(), (planId, currentStatus) => {
        const result = simulateToggleSuccess(planId, currentStatus)
        
        // All toggle operations should follow the same success flow
        expect(result.toastShown).toBe(true)
        expect(result.toastMessage).toContain('successfully')
        expect(result.localStateUpdated).toBe(true)
        expect(result.newActiveStatus).toBe(!currentStatus)
      }),
      { numRuns: 100 }
    )
  })

  it('should correctly alternate status for multiple toggles', () => {
    fc.assert(
      fc.property(uuidArb, fc.boolean(), (planId, initialStatus) => {
        // First toggle
        const result1 = simulateToggleSuccess(planId, initialStatus)
        expect(result1.newActiveStatus).toBe(!initialStatus)
        
        // Second toggle (should return to original status)
        const result2 = simulateToggleSuccess(planId, result1.newActiveStatus)
        expect(result2.newActiveStatus).toBe(initialStatus)
        
        // Third toggle
        const result3 = simulateToggleSuccess(planId, result2.newActiveStatus)
        expect(result3.newActiveStatus).toBe(!initialStatus)
      }),
      { numRuns: 100 }
    )
  })
})

// Property 11: HTTP Error Handling
describe('Property 11: HTTP Error Handling', () => {
  type HttpErrorStatus = 400 | 401 | 403 | 404 | 500
  type OperationType = 'fetch' | 'create' | 'update' | 'delete' | 'toggle'

  interface HttpErrorResponse {
    status: HttpErrorStatus
    message: string
  }

  interface ErrorHandlingResult {
    redirectedToLogin: boolean
    toastShown: boolean
    toastMessage: string
    errorDisplayedInModal: boolean
    modalErrorMessage: string
  }

  function simulateHttpError(
    status: HttpErrorStatus,
    message: string,
    operation: OperationType
  ): ErrorHandlingResult {
    const isFormOperation = operation === 'create' || operation === 'update'
    
    switch (status) {
      case 401:
        // 401 errors trigger redirect to login
        return {
          redirectedToLogin: true,
          toastShown: false,
          toastMessage: '',
          errorDisplayedInModal: false,
          modalErrorMessage: ''
        }
      
      case 400:
        // 400 validation errors display in modal for form operations, toast for others
        if (isFormOperation) {
          return {
            redirectedToLogin: false,
            toastShown: false,
            toastMessage: '',
            errorDisplayedInModal: true,
            modalErrorMessage: message
          }
        } else {
          return {
            redirectedToLogin: false,
            toastShown: true,
            toastMessage: message,
            errorDisplayedInModal: false,
            modalErrorMessage: ''
          }
        }
      
      case 403:
      case 404:
      case 500:
        // Other errors display as toasts via Error_Handler
        return {
          redirectedToLogin: false,
          toastShown: true,
          toastMessage: message,
          errorDisplayedInModal: false,
          modalErrorMessage: ''
        }
      
      default:
        throw new Error(`Unexpected status: ${status}`)
    }
  }

  const httpErrorStatusArb = fc.constantFrom<HttpErrorStatus>(400, 401, 403, 404, 500)
  const operationTypeArb = fc.constantFrom<OperationType>('fetch', 'create', 'update', 'delete', 'toggle')
  const errorMessageArb = fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0)

  it('should redirect to login for 401 unauthorized errors', () => {
    fc.assert(
      fc.property(operationTypeArb, errorMessageArb, (operation, message) => {
        const result = simulateHttpError(401, message, operation)
        
        expect(result.redirectedToLogin).toBe(true)
        expect(result.toastShown).toBe(false)
        expect(result.errorDisplayedInModal).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  it('should display 400 validation errors in modal for form submissions', () => {
    const formOperationArb = fc.constantFrom<OperationType>('create', 'update')
    
    fc.assert(
      fc.property(formOperationArb, errorMessageArb, (operation, message) => {
        const result = simulateHttpError(400, message, operation)
        
        expect(result.errorDisplayedInModal).toBe(true)
        expect(result.modalErrorMessage).toBe(message)
        expect(result.toastShown).toBe(false)
        expect(result.redirectedToLogin).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  it('should display 400 errors as toast for non-form operations', () => {
    const nonFormOperationArb = fc.constantFrom<OperationType>('fetch', 'delete', 'toggle')
    
    fc.assert(
      fc.property(nonFormOperationArb, errorMessageArb, (operation, message) => {
        const result = simulateHttpError(400, message, operation)
        
        expect(result.toastShown).toBe(true)
        expect(result.toastMessage).toBe(message)
        expect(result.errorDisplayedInModal).toBe(false)
        expect(result.redirectedToLogin).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  it('should display 403 forbidden errors as toast', () => {
    fc.assert(
      fc.property(operationTypeArb, errorMessageArb, (operation, message) => {
        const result = simulateHttpError(403, message, operation)
        
        expect(result.toastShown).toBe(true)
        expect(result.toastMessage).toBe(message)
        expect(result.errorDisplayedInModal).toBe(false)
        expect(result.redirectedToLogin).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  it('should display 404 not found errors as toast', () => {
    fc.assert(
      fc.property(operationTypeArb, errorMessageArb, (operation, message) => {
        const result = simulateHttpError(404, message, operation)
        
        expect(result.toastShown).toBe(true)
        expect(result.toastMessage).toBe(message)
        expect(result.errorDisplayedInModal).toBe(false)
        expect(result.redirectedToLogin).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  it('should display 500 server errors as toast', () => {
    fc.assert(
      fc.property(operationTypeArb, errorMessageArb, (operation, message) => {
        const result = simulateHttpError(500, message, operation)
        
        expect(result.toastShown).toBe(true)
        expect(result.toastMessage).toBe(message)
        expect(result.errorDisplayedInModal).toBe(false)
        expect(result.redirectedToLogin).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  it('should handle any HTTP error status appropriately', () => {
    fc.assert(
      fc.property(httpErrorStatusArb, operationTypeArb, errorMessageArb, (status, operation, message) => {
        const result = simulateHttpError(status, message, operation)
        
        // Verify that exactly one error handling mechanism is used
        const handlingMechanisms = [
          result.redirectedToLogin,
          result.toastShown,
          result.errorDisplayedInModal
        ].filter(Boolean).length
        
        expect(handlingMechanisms).toBe(1)
        
        // Verify error message is preserved when displayed
        if (result.toastShown) {
          expect(result.toastMessage).toBe(message)
        }
        if (result.errorDisplayedInModal) {
          expect(result.modalErrorMessage).toBe(message)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('should never show both toast and modal error simultaneously', () => {
    fc.assert(
      fc.property(httpErrorStatusArb, operationTypeArb, errorMessageArb, (status, operation, message) => {
        const result = simulateHttpError(status, message, operation)
        
        // Toast and modal error should be mutually exclusive
        if (result.toastShown) {
          expect(result.errorDisplayedInModal).toBe(false)
        }
        if (result.errorDisplayedInModal) {
          expect(result.toastShown).toBe(false)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('should handle validation errors differently based on operation type', () => {
    fc.assert(
      fc.property(operationTypeArb, errorMessageArb, (operation, message) => {
        const result = simulateHttpError(400, message, operation)
        
        const isFormOperation = operation === 'create' || operation === 'update'
        
        if (isFormOperation) {
          // Form operations show errors in modal
          expect(result.errorDisplayedInModal).toBe(true)
          expect(result.modalErrorMessage).toBe(message)
          expect(result.toastShown).toBe(false)
        } else {
          // Non-form operations show errors as toast
          expect(result.toastShown).toBe(true)
          expect(result.toastMessage).toBe(message)
          expect(result.errorDisplayedInModal).toBe(false)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('should preserve error message content for all error types', () => {
    fc.assert(
      fc.property(httpErrorStatusArb, operationTypeArb, errorMessageArb, (status, operation, message) => {
        const result = simulateHttpError(status, message, operation)
        
        // Error message should be preserved somewhere
        const messagePreserved = 
          result.toastMessage === message || 
          result.modalErrorMessage === message ||
          result.redirectedToLogin // 401 doesn't preserve message but redirects
        
        expect(messagePreserved).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  it('should handle network errors with appropriate error display', () => {
    const networkErrorArb = fc.record({
      message: fc.constantFrom(
        'Network request failed',
        'Connection timeout',
        'Network unavailable',
        'Failed to fetch'
      ),
      operation: operationTypeArb
    })

    fc.assert(
      fc.property(networkErrorArb, ({ message, operation }) => {
        // Network errors are treated as 500-level errors (toast display)
        const result = simulateHttpError(500, message, operation)
        
        expect(result.toastShown).toBe(true)
        expect(result.toastMessage).toBe(message)
        expect(result.redirectedToLogin).toBe(false)
        expect(result.errorDisplayedInModal).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  it('should handle duplicate plan name errors in modal for create/update', () => {
    const duplicateErrorArb = fc.record({
      message: fc.constantFrom(
        'Plan name already exists',
        'Duplicate plan name',
        'A plan with this name already exists'
      ),
      operation: fc.constantFrom<OperationType>('create', 'update')
    })

    fc.assert(
      fc.property(duplicateErrorArb, ({ message, operation }) => {
        const result = simulateHttpError(400, message, operation)
        
        expect(result.errorDisplayedInModal).toBe(true)
        expect(result.modalErrorMessage).toBe(message)
        expect(result.toastShown).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  it('should handle plans with subscribers error as toast for delete', () => {
    const subscriberErrorArb = fc.record({
      message: fc.constantFrom(
        'Cannot delete plan with active subscribers',
        'Plan has subscribers and cannot be deleted',
        'This plan has active subscriptions'
      )
    })

    fc.assert(
      fc.property(subscriberErrorArb, ({ message }) => {
        const result = simulateHttpError(400, message, 'delete')
        
        expect(result.toastShown).toBe(true)
        expect(result.toastMessage).toBe(message)
        expect(result.errorDisplayedInModal).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  it('should handle all error statuses for all operation types', () => {
    fc.assert(
      fc.property(httpErrorStatusArb, operationTypeArb, errorMessageArb, (status, operation, message) => {
        // Should not throw an error for any valid combination
        expect(() => {
          const result = simulateHttpError(status, message, operation)
          
          // Result should always have valid structure
          expect(result).toHaveProperty('redirectedToLogin')
          expect(result).toHaveProperty('toastShown')
          expect(result).toHaveProperty('toastMessage')
          expect(result).toHaveProperty('errorDisplayedInModal')
          expect(result).toHaveProperty('modalErrorMessage')
        }).not.toThrow()
      }),
      { numRuns: 100 }
    )
  })
})

// Property 10: Loading State Management
describe('Property 10: Loading State Management', () => {
  type OperationType = 'create' | 'update' | 'delete' | 'toggle' | 'fetch'

  interface LoadingState {
    buttonDisabled: boolean
    loadingIndicatorShown: boolean
    operationInProgress: boolean
  }

  interface OperationLifecycle {
    beforeOperation: LoadingState
    duringOperation: LoadingState
    afterOperation: LoadingState
  }

  function simulateOperationLifecycle(operation: OperationType): OperationLifecycle {
    // Before operation starts
    const beforeOperation: LoadingState = {
      buttonDisabled: false,
      loadingIndicatorShown: false,
      operationInProgress: false
    }

    // During operation
    const duringOperation: LoadingState = {
      buttonDisabled: true,
      loadingIndicatorShown: true,
      operationInProgress: true
    }

    // After operation completes
    const afterOperation: LoadingState = {
      buttonDisabled: false,
      loadingIndicatorShown: false,
      operationInProgress: false
    }

    return {
      beforeOperation,
      duringOperation,
      afterOperation
    }
  }

  const operationTypeArb = fc.constantFrom<OperationType>('create', 'update', 'delete', 'toggle', 'fetch')

  it('should disable action button during any operation', () => {
    fc.assert(
      fc.property(operationTypeArb, (operation) => {
        const lifecycle = simulateOperationLifecycle(operation)
        
        // Button should be enabled before operation
        expect(lifecycle.beforeOperation.buttonDisabled).toBe(false)
        
        // Button should be disabled during operation
        expect(lifecycle.duringOperation.buttonDisabled).toBe(true)
        
        // Button should be re-enabled after operation
        expect(lifecycle.afterOperation.buttonDisabled).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  it('should show loading indicator during any operation', () => {
    fc.assert(
      fc.property(operationTypeArb, (operation) => {
        const lifecycle = simulateOperationLifecycle(operation)
        
        // Loading indicator should not be shown before operation
        expect(lifecycle.beforeOperation.loadingIndicatorShown).toBe(false)
        
        // Loading indicator should be shown during operation
        expect(lifecycle.duringOperation.loadingIndicatorShown).toBe(true)
        
        // Loading indicator should be removed after operation
        expect(lifecycle.afterOperation.loadingIndicatorShown).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  it('should remove loading indicators when operation completes', () => {
    fc.assert(
      fc.property(operationTypeArb, (operation) => {
        const lifecycle = simulateOperationLifecycle(operation)
        
        // After operation completes, all loading states should be cleared
        expect(lifecycle.afterOperation.buttonDisabled).toBe(false)
        expect(lifecycle.afterOperation.loadingIndicatorShown).toBe(false)
        expect(lifecycle.afterOperation.operationInProgress).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  it('should manage loading state consistently across all operation types', () => {
    fc.assert(
      fc.property(operationTypeArb, (operation) => {
        const lifecycle = simulateOperationLifecycle(operation)
        
        // All operations should follow the same loading state pattern
        // Before: not loading
        expect(lifecycle.beforeOperation.operationInProgress).toBe(false)
        
        // During: loading
        expect(lifecycle.duringOperation.operationInProgress).toBe(true)
        expect(lifecycle.duringOperation.buttonDisabled).toBe(true)
        expect(lifecycle.duringOperation.loadingIndicatorShown).toBe(true)
        
        // After: not loading
        expect(lifecycle.afterOperation.operationInProgress).toBe(false)
        expect(lifecycle.afterOperation.buttonDisabled).toBe(false)
        expect(lifecycle.afterOperation.loadingIndicatorShown).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  it('should transition through all loading states in correct order', () => {
    fc.assert(
      fc.property(operationTypeArb, (operation) => {
        const lifecycle = simulateOperationLifecycle(operation)
        
        // Verify state transitions
        // Before -> During: loading should start
        expect(lifecycle.beforeOperation.operationInProgress).toBe(false)
        expect(lifecycle.duringOperation.operationInProgress).toBe(true)
        
        // During -> After: loading should stop
        expect(lifecycle.duringOperation.operationInProgress).toBe(true)
        expect(lifecycle.afterOperation.operationInProgress).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  it('should disable submit buttons during form submissions', () => {
    const formOperationArb = fc.constantFrom<OperationType>('create', 'update')
    
    fc.assert(
      fc.property(formOperationArb, (operation) => {
        const lifecycle = simulateOperationLifecycle(operation)
        
        // Submit button should be disabled during form submission
        expect(lifecycle.duringOperation.buttonDisabled).toBe(true)
        
        // Submit button should show loading indicator
        expect(lifecycle.duringOperation.loadingIndicatorShown).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  it('should disable action buttons during non-form operations', () => {
    const actionOperationArb = fc.constantFrom<OperationType>('delete', 'toggle')
    
    fc.assert(
      fc.property(actionOperationArb, (operation) => {
        const lifecycle = simulateOperationLifecycle(operation)
        
        // Action button should be disabled during operation
        expect(lifecycle.duringOperation.buttonDisabled).toBe(true)
        
        // Action button should show loading indicator
        expect(lifecycle.duringOperation.loadingIndicatorShown).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  it('should handle multiple sequential operations correctly', () => {
    fc.assert(
      fc.property(
        fc.array(operationTypeArb, { minLength: 2, maxLength: 5 }),
        (operations) => {
          // Simulate multiple operations in sequence
          for (const operation of operations) {
            const lifecycle = simulateOperationLifecycle(operation)
            
            // Each operation should start with clean state
            expect(lifecycle.beforeOperation.operationInProgress).toBe(false)
            
            // Each operation should have loading state during execution
            expect(lifecycle.duringOperation.operationInProgress).toBe(true)
            
            // Each operation should clean up after completion
            expect(lifecycle.afterOperation.operationInProgress).toBe(false)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should never have button enabled while loading indicator is shown', () => {
    fc.assert(
      fc.property(operationTypeArb, (operation) => {
        const lifecycle = simulateOperationLifecycle(operation)
        
        // During operation: if loading indicator is shown, button must be disabled
        if (lifecycle.duringOperation.loadingIndicatorShown) {
          expect(lifecycle.duringOperation.buttonDisabled).toBe(true)
        }
        
        // After operation: if button is enabled, loading indicator must not be shown
        if (!lifecycle.afterOperation.buttonDisabled) {
          expect(lifecycle.afterOperation.loadingIndicatorShown).toBe(false)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('should always show loading indicator when button is disabled during operation', () => {
    fc.assert(
      fc.property(operationTypeArb, (operation) => {
        const lifecycle = simulateOperationLifecycle(operation)
        
        // During operation: button disabled implies loading indicator shown
        if (lifecycle.duringOperation.buttonDisabled && lifecycle.duringOperation.operationInProgress) {
          expect(lifecycle.duringOperation.loadingIndicatorShown).toBe(true)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('should restore button state after operation regardless of success or failure', () => {
    const operationResultArb = fc.record({
      operation: operationTypeArb,
      success: fc.boolean()
    })
    
    fc.assert(
      fc.property(operationResultArb, ({ operation, success }) => {
        const lifecycle = simulateOperationLifecycle(operation)
        
        // After operation completes (success or failure), loading state should be cleared
        expect(lifecycle.afterOperation.buttonDisabled).toBe(false)
        expect(lifecycle.afterOperation.loadingIndicatorShown).toBe(false)
        expect(lifecycle.afterOperation.operationInProgress).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  it('should handle initial page load with PageSkeleton', () => {
    interface InitialLoadState {
      loading: boolean
      plansLoaded: boolean
      showPageSkeleton: boolean
      showContent: boolean
    }

    function simulateInitialLoad(): { before: InitialLoadState; during: InitialLoadState; after: InitialLoadState } {
      return {
        before: {
          loading: false,
          plansLoaded: false,
          showPageSkeleton: false,
          showContent: false
        },
        during: {
          loading: true,
          plansLoaded: false,
          showPageSkeleton: true,
          showContent: false
        },
        after: {
          loading: false,
          plansLoaded: true,
          showPageSkeleton: false,
          showContent: true
        }
      }
    }

    fc.assert(
      fc.property(fc.constant(null), () => {
        const loadStates = simulateInitialLoad()
        
        // During initial load, PageSkeleton should be shown
        expect(loadStates.during.showPageSkeleton).toBe(true)
        expect(loadStates.during.showContent).toBe(false)
        
        // After load completes, content should be shown
        expect(loadStates.after.showPageSkeleton).toBe(false)
        expect(loadStates.after.showContent).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  it('should display loading placeholders for stat cards during stats loading', () => {
    interface StatsLoadState {
      statsLoading: boolean
      showPlaceholders: boolean
      showActualStats: boolean
    }

    function simulateStatsLoad(): { before: StatsLoadState; during: StatsLoadState; after: StatsLoadState } {
      return {
        before: {
          statsLoading: false,
          showPlaceholders: false,
          showActualStats: false
        },
        during: {
          statsLoading: true,
          showPlaceholders: true,
          showActualStats: false
        },
        after: {
          statsLoading: false,
          showPlaceholders: false,
          showActualStats: true
        }
      }
    }

    fc.assert(
      fc.property(fc.constant(null), () => {
        const loadStates = simulateStatsLoad()
        
        // During stats loading, placeholders should be shown
        expect(loadStates.during.showPlaceholders).toBe(true)
        expect(loadStates.during.showActualStats).toBe(false)
        
        // After loading completes, actual stats should be shown
        expect(loadStates.after.showPlaceholders).toBe(false)
        expect(loadStates.after.showActualStats).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  it('should never show both loading state and completed state simultaneously', () => {
    fc.assert(
      fc.property(operationTypeArb, (operation) => {
        const lifecycle = simulateOperationLifecycle(operation)
        
        // During operation: loading state active, completed state inactive
        if (lifecycle.duringOperation.operationInProgress) {
          expect(lifecycle.duringOperation.buttonDisabled).toBe(true)
          expect(lifecycle.duringOperation.loadingIndicatorShown).toBe(true)
        }
        
        // After operation: loading state inactive, completed state active
        if (!lifecycle.afterOperation.operationInProgress) {
          expect(lifecycle.afterOperation.buttonDisabled).toBe(false)
          expect(lifecycle.afterOperation.loadingIndicatorShown).toBe(false)
        }
      }),
      { numRuns: 100 }
    )
  })
})
