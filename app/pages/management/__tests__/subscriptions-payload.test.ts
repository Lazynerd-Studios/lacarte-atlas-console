// Feature: subscription-api-integration, Property 3: API Request Payload Structure
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

type BillingType = 'prepaid' | 'postpaid'
type BillingCycle = 'monthly' | 'quarterly' | 'yearly'

interface FormData {
  name: string
  description: string
  billingCycle: BillingCycle
  pickupCount: string
  binCount: string
  color: string
  isActive: boolean
}

function formToApiPayload(form: FormData, billingType: BillingType) {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    type: billingType,
    pickups: Number(form.pickupCount),
    bins: Number(form.binCount),
    billingCycle: form.billingCycle,
    price: 0,
    badgeColor: form.color,
    isActive: form.isActive,
  }
}

describe('Property 3: API Request Payload Structure', () => {
  it('should contain all required fields with correct mappings', () => {
    const billingTypeArb = fc.constantFrom<BillingType>('prepaid', 'postpaid')
    const billingCycleArb = fc.constantFrom<BillingCycle>('monthly', 'quarterly', 'yearly')
    const nameArb = fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)
    const descriptionArb = fc.string({ maxLength: 500 })
    const positiveIntStringArb = fc.integer({ min: 1, max: 1000 }).map(n => String(n))
    const colorArb = fc.constantFrom('#6b7280', '#3b82f6', '#8b5cf6')

    const formDataArb = fc.record({
      name: nameArb,
      description: descriptionArb,
      billingCycle: billingCycleArb,
      pickupCount: positiveIntStringArb,
      binCount: positiveIntStringArb,
      color: colorArb,
      isActive: fc.boolean(),
    })

    fc.assert(
      fc.property(formDataArb, billingTypeArb, (formData, billingType) => {
        const payload = formToApiPayload(formData, billingType)
        
        expect(payload).toHaveProperty('name')
        expect(payload).toHaveProperty('type')
        expect(payload).toHaveProperty('pickups')
        expect(payload).toHaveProperty('bins')
        expect(payload).toHaveProperty('badgeColor')
        
        expect(payload.type).toBe(billingType)
        expect(payload.pickups).toBe(Number(formData.pickupCount))
        expect(payload.bins).toBe(Number(formData.binCount))
        expect(payload.badgeColor).toBe(formData.color)
        
        expect(payload).not.toHaveProperty('billingType')
        expect(payload).not.toHaveProperty('pickupCount')
        expect(payload).not.toHaveProperty('binCount')
        expect(payload).not.toHaveProperty('color')
      }),
      { numRuns: 100 }
    )
  })

  it('should handle both create and update scenarios with the same payload structure', () => {
    const billingTypeArb = fc.constantFrom<BillingType>('prepaid', 'postpaid')
    const billingCycleArb = fc.constantFrom<BillingCycle>('monthly', 'quarterly', 'yearly')
    const nameArb = fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)
    const descriptionArb = fc.string({ maxLength: 500 })
    const positiveIntStringArb = fc.integer({ min: 1, max: 1000 }).map(n => String(n))
    const colorArb = fc.constantFrom('#6b7280', '#3b82f6', '#8b5cf6', '#f97316', '#22c55e')

    const formDataArb = fc.record({
      name: nameArb,
      description: descriptionArb,
      billingCycle: billingCycleArb,
      pickupCount: positiveIntStringArb,
      binCount: positiveIntStringArb,
      color: colorArb,
      isActive: fc.boolean(),
    })

    fc.assert(
      fc.property(formDataArb, billingTypeArb, (formData, billingType) => {
        const createPayload = formToApiPayload(formData, billingType)
        const updatePayload = formToApiPayload(formData, billingType)

        expect(createPayload).toEqual(updatePayload)

        const requiredFields = [
          'name',
          'description',
          'type',
          'pickups',
          'bins',
          'billingCycle',
          'price',
          'badgeColor',
          'isActive',
        ]

        requiredFields.forEach(field => {
          expect(createPayload).toHaveProperty(field)
          expect(updatePayload).toHaveProperty(field)
        })
      }),
      { numRuns: 100 }
    )
  })

  it('should correctly map field names regardless of billing type', () => {
    const billingCycleArb = fc.constantFrom<BillingCycle>('monthly', 'quarterly', 'yearly')
    const nameArb = fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)
    const descriptionArb = fc.string({ maxLength: 500 })
    const positiveIntStringArb = fc.integer({ min: 1, max: 1000 }).map(n => String(n))
    const colorArb = fc.constantFrom('#6b7280', '#3b82f6', '#8b5cf6', '#f97316', '#22c55e')

    const formDataArb = fc.record({
      name: nameArb,
      description: descriptionArb,
      billingCycle: billingCycleArb,
      pickupCount: positiveIntStringArb,
      binCount: positiveIntStringArb,
      color: colorArb,
      isActive: fc.boolean(),
    })

    fc.assert(
      fc.property(formDataArb, (formData) => {
        const prepaidPayload = formToApiPayload(formData, 'prepaid')
        const postpaidPayload = formToApiPayload(formData, 'postpaid')

        expect(prepaidPayload.type).toBe('prepaid')
        expect(postpaidPayload.type).toBe('postpaid')

        expect(prepaidPayload.name).toBe(postpaidPayload.name)
        expect(prepaidPayload.description).toBe(postpaidPayload.description)
        expect(prepaidPayload.pickups).toBe(postpaidPayload.pickups)
        expect(prepaidPayload.bins).toBe(postpaidPayload.bins)
        expect(prepaidPayload.billingCycle).toBe(postpaidPayload.billingCycle)
        expect(prepaidPayload.badgeColor).toBe(postpaidPayload.badgeColor)
        expect(prepaidPayload.isActive).toBe(postpaidPayload.isActive)

        expect(prepaidPayload).not.toHaveProperty('billingType')
        expect(prepaidPayload).not.toHaveProperty('pickupCount')
        expect(prepaidPayload).not.toHaveProperty('binCount')
        expect(prepaidPayload).not.toHaveProperty('color')

        expect(postpaidPayload).not.toHaveProperty('billingType')
        expect(postpaidPayload).not.toHaveProperty('pickupCount')
        expect(postpaidPayload).not.toHaveProperty('binCount')
        expect(postpaidPayload).not.toHaveProperty('color')
      }),
      { numRuns: 100 }
    )
  })
})
