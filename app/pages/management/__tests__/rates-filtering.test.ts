// Feature: rate-management
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

interface CustomerType {
  id: number
  name: string
  color: string
}

interface Rate {
  id: number
  customerTypeId: number
  pickupRate: number
  effectiveDate: string
  note: string
  isActive: boolean
  createdAt: string
}

// Arbitraries for generating test data
const customerTypeIdArb = fc.integer({ min: 1, max: 10 })

// Date arbitrary that generates valid ISO date strings
const dateStringArb = fc.integer({ min: 1577836800000, max: 1924905600000 })
  .map(timestamp => new Date(timestamp).toISOString().split('T')[0]!)

const rateArb = fc.record({
  id: fc.integer({ min: 1, max: 1000 }),
  customerTypeId: customerTypeIdArb,
  pickupRate: fc.integer({ min: 1, max: 10000 }),
  effectiveDate: dateStringArb,
  note: fc.string({ maxLength: 200 }),
  isActive: fc.boolean(),
  createdAt: dateStringArb,
})

// Helper function to compute rate status
function rateStatus(r: Rate): 'active' | 'upcoming' | 'inactive' {
  const today = new Date().toISOString().split('T')[0]!
  if (!r.isActive) return 'inactive'
  if (r.effectiveDate > today) return 'upcoming'
  return 'active'
}

// Helper function to filter rates by customer type
function filterByCustomerType(rates: Rate[], filterType: number | 'all'): Rate[] {
  if (filterType === 'all') return rates
  return rates.filter(r => r.customerTypeId === filterType)
}

// Helper function to filter rates by status
function filterByStatus(rates: Rate[], filterStatus: 'all' | 'active' | 'upcoming' | 'inactive'): Rate[] {
  if (filterStatus === 'all') return rates
  return rates.filter(r => rateStatus(r) === filterStatus)
}

// Helper function to apply both filters
function applyFilters(
  rates: Rate[],
  filterType: number | 'all',
  filterStatus: 'all' | 'active' | 'upcoming' | 'inactive'
): Rate[] {
  return rates.filter(r => {
    const matchType = filterType === 'all' || r.customerTypeId === filterType
    const matchStatus = filterStatus === 'all' || rateStatus(r) === filterStatus
    return matchType && matchStatus
  })
}

// Property 8: Customer Type Filtering
// **Validates: Requirements 7.1**
describe('Property 8: Customer Type Filtering', () => {
  // Feature: rate-management, Property 8: Customer Type Filtering
  it('should display only rates with matching customerTypeId when a specific customer type is selected', () => {
    fc.assert(
      fc.property(
        fc.array(rateArb, { minLength: 1, maxLength: 50 }),
        customerTypeIdArb,
        (rates, selectedTypeId) => {
          // Apply customer type filter
          const filtered = filterByCustomerType(rates, selectedTypeId)
          
          // All filtered rates should have the selected customer type ID
          filtered.forEach(rate => {
            expect(rate.customerTypeId).toBe(selectedTypeId)
          })
          
          // All rates with the selected customer type ID should be in filtered results
          const expectedRates = rates.filter(r => r.customerTypeId === selectedTypeId)
          expect(filtered.length).toBe(expectedRates.length)
        }
      ),
      { numRuns: 100 }
    )
  })

  // Feature: rate-management, Property 8: Customer Type Filtering
  it('should display all rates when "all" customer type filter is selected', () => {
    fc.assert(
      fc.property(
        fc.array(rateArb, { minLength: 1, maxLength: 50 }),
        (rates) => {
          // Apply "all" customer type filter
          const filtered = filterByCustomerType(rates, 'all')
          
          // All rates should be displayed
          expect(filtered.length).toBe(rates.length)
          expect(filtered).toEqual(rates)
        }
      ),
      { numRuns: 100 }
    )
  })

  // Feature: rate-management, Property 8: Customer Type Filtering
  it('should return empty array when no rates match the selected customer type', () => {
    fc.assert(
      fc.property(
        fc.array(rateArb, { minLength: 1, maxLength: 50 }),
        fc.integer({ min: 100, max: 200 }), // Customer type ID that doesn't exist in rates
        (rates, nonExistentTypeId) => {
          // Ensure the selected type ID doesn't exist in rates
          fc.pre(!rates.some(r => r.customerTypeId === nonExistentTypeId))
          
          // Apply customer type filter
          const filtered = filterByCustomerType(rates, nonExistentTypeId)
          
          // Should return empty array
          expect(filtered.length).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Property 9: Status Filtering
// **Validates: Requirements 8.1**
describe('Property 9: Status Filtering', () => {
  // Feature: rate-management, Property 9: Status Filtering
  it('should display only rates with matching status when a specific status is selected', () => {
    fc.assert(
      fc.property(
        fc.array(rateArb, { minLength: 1, maxLength: 50 }),
        fc.constantFrom('active' as const, 'upcoming' as const, 'inactive' as const),
        (rates, selectedStatus) => {
          // Apply status filter
          const filtered = filterByStatus(rates, selectedStatus)
          
          // All filtered rates should have the selected status
          filtered.forEach(rate => {
            expect(rateStatus(rate)).toBe(selectedStatus)
          })
          
          // All rates with the selected status should be in filtered results
          const expectedRates = rates.filter(r => rateStatus(r) === selectedStatus)
          expect(filtered.length).toBe(expectedRates.length)
        }
      ),
      { numRuns: 100 }
    )
  })

  // Feature: rate-management, Property 9: Status Filtering
  it('should display all rates when "all" status filter is selected', () => {
    fc.assert(
      fc.property(
        fc.array(rateArb, { minLength: 1, maxLength: 50 }),
        (rates) => {
          // Apply "all" status filter
          const filtered = filterByStatus(rates, 'all')
          
          // All rates should be displayed
          expect(filtered.length).toBe(rates.length)
          expect(filtered).toEqual(rates)
        }
      ),
      { numRuns: 100 }
    )
  })

  // Feature: rate-management, Property 9: Status Filtering
  it('should return empty array when no rates match the selected status', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('active' as const, 'upcoming' as const, 'inactive' as const),
        (selectedStatus) => {
          // Create rates that don't match the selected status
          let rates: Rate[]
          
          if (selectedStatus === 'active') {
            // Create only inactive and upcoming rates
            rates = [
              { id: 1, customerTypeId: 1, pickupRate: 100, effectiveDate: '2099-12-31', note: '', isActive: true, createdAt: '2024-01-01' },
              { id: 2, customerTypeId: 2, pickupRate: 200, effectiveDate: '2024-01-01', note: '', isActive: false, createdAt: '2024-01-01' },
            ]
          } else if (selectedStatus === 'upcoming') {
            // Create only active and inactive rates
            const today = new Date().toISOString().split('T')[0]!
            rates = [
              { id: 1, customerTypeId: 1, pickupRate: 100, effectiveDate: today, note: '', isActive: true, createdAt: '2024-01-01' },
              { id: 2, customerTypeId: 2, pickupRate: 200, effectiveDate: today, note: '', isActive: false, createdAt: '2024-01-01' },
            ]
          } else {
            // Create only active and upcoming rates
            const today = new Date().toISOString().split('T')[0]!
            rates = [
              { id: 1, customerTypeId: 1, pickupRate: 100, effectiveDate: today, note: '', isActive: true, createdAt: '2024-01-01' },
              { id: 2, customerTypeId: 2, pickupRate: 200, effectiveDate: '2099-12-31', note: '', isActive: true, createdAt: '2024-01-01' },
            ]
          }
          
          // Apply status filter
          const filtered = filterByStatus(rates, selectedStatus)
          
          // Should return empty array
          expect(filtered.length).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Property 10: Rate Status Computation
// **Validates: Requirements 8.3, 8.4, 8.5**
describe('Property 10: Rate Status Computation', () => {
  // Feature: rate-management, Property 10: Rate Status Computation
  it('should compute status as "inactive" when isActive is false', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.integer({ min: 1, max: 1000 }),
          customerTypeId: customerTypeIdArb,
          pickupRate: fc.integer({ min: 1, max: 10000 }),
          effectiveDate: dateStringArb,
          note: fc.string({ maxLength: 200 }),
          isActive: fc.constant(false),
          createdAt: dateStringArb,
        }),
        (rate) => {
          const status = rateStatus(rate)
          expect(status).toBe('inactive')
        }
      ),
      { numRuns: 100 }
    )
  })

  // Feature: rate-management, Property 10: Rate Status Computation
  it('should compute status as "upcoming" when isActive is true and effectiveDate is in the future', () => {
    const today = new Date().toISOString().split('T')[0]!
    const futureTimestamp = Date.now() + 86400000 // Tomorrow
    
    fc.assert(
      fc.property(
        fc.record({
          id: fc.integer({ min: 1, max: 1000 }),
          customerTypeId: customerTypeIdArb,
          pickupRate: fc.integer({ min: 1, max: 10000 }),
          effectiveDate: fc.integer({ min: futureTimestamp, max: 1924905600000 })
            .map(timestamp => new Date(timestamp).toISOString().split('T')[0]!),
          note: fc.string({ maxLength: 200 }),
          isActive: fc.constant(true),
          createdAt: dateStringArb,
        }),
        (rate) => {
          // Verify the effective date is indeed in the future
          if (rate.effectiveDate > today) {
            const status = rateStatus(rate)
            expect(status).toBe('upcoming')
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  // Feature: rate-management, Property 10: Rate Status Computation
  it('should compute status as "active" when isActive is true and effectiveDate is today or earlier', () => {
    const today = new Date().toISOString().split('T')[0]!
    const todayTimestamp = new Date(today).getTime()
    
    fc.assert(
      fc.property(
        fc.record({
          id: fc.integer({ min: 1, max: 1000 }),
          customerTypeId: customerTypeIdArb,
          pickupRate: fc.integer({ min: 1, max: 10000 }),
          effectiveDate: fc.integer({ min: 1577836800000, max: todayTimestamp })
            .map(timestamp => new Date(timestamp).toISOString().split('T')[0]!),
          note: fc.string({ maxLength: 200 }),
          isActive: fc.constant(true),
          createdAt: dateStringArb,
        }),
        (rate) => {
          // Verify the effective date is today or earlier
          if (rate.effectiveDate <= today) {
            const status = rateStatus(rate)
            expect(status).toBe('active')
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  // Feature: rate-management, Property 10: Rate Status Computation
  it('should compute correct status for any rate', () => {
    fc.assert(
      fc.property(
        rateArb,
        (rate) => {
          const today = new Date().toISOString().split('T')[0]!
          const status = rateStatus(rate)
          
          if (!rate.isActive) {
            expect(status).toBe('inactive')
          } else if (rate.effectiveDate > today) {
            expect(status).toBe('upcoming')
          } else {
            expect(status).toBe('active')
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Property 11: Filtered Results Count
// **Validates: Requirements 7.3, 8.6**
describe('Property 11: Filtered Results Count', () => {
  // Feature: rate-management, Property 11: Filtered Results Count
  it('should match the count of rates that pass both customer type and status filters', () => {
    fc.assert(
      fc.property(
        fc.array(rateArb, { minLength: 0, maxLength: 50 }),
        fc.oneof(customerTypeIdArb, fc.constant('all' as const)),
        fc.constantFrom('all' as const, 'active' as const, 'upcoming' as const, 'inactive' as const),
        (rates, filterType, filterStatus) => {
          // Apply both filters
          const filtered = applyFilters(rates, filterType, filterStatus)
          
          // Count should match the number of rates that pass both filters
          const expectedCount = rates.filter(r => {
            const matchType = filterType === 'all' || r.customerTypeId === filterType
            const matchStatus = filterStatus === 'all' || rateStatus(r) === filterStatus
            return matchType && matchStatus
          }).length
          
          expect(filtered.length).toBe(expectedCount)
        }
      ),
      { numRuns: 100 }
    )
  })

  // Feature: rate-management, Property 11: Filtered Results Count
  it('should display correct count when only customer type filter is applied', () => {
    fc.assert(
      fc.property(
        fc.array(rateArb, { minLength: 0, maxLength: 50 }),
        fc.oneof(customerTypeIdArb, fc.constant('all' as const)),
        (rates, filterType) => {
          // Apply only customer type filter (status = 'all')
          const filtered = applyFilters(rates, filterType, 'all')
          
          // Count should match the number of rates with the selected customer type
          const expectedCount = filterType === 'all' 
            ? rates.length 
            : rates.filter(r => r.customerTypeId === filterType).length
          
          expect(filtered.length).toBe(expectedCount)
        }
      ),
      { numRuns: 100 }
    )
  })

  // Feature: rate-management, Property 11: Filtered Results Count
  it('should display correct count when only status filter is applied', () => {
    fc.assert(
      fc.property(
        fc.array(rateArb, { minLength: 0, maxLength: 50 }),
        fc.constantFrom('all' as const, 'active' as const, 'upcoming' as const, 'inactive' as const),
        (rates, filterStatus) => {
          // Apply only status filter (customer type = 'all')
          const filtered = applyFilters(rates, 'all', filterStatus)
          
          // Count should match the number of rates with the selected status
          const expectedCount = filterStatus === 'all'
            ? rates.length
            : rates.filter(r => rateStatus(r) === filterStatus).length
          
          expect(filtered.length).toBe(expectedCount)
        }
      ),
      { numRuns: 100 }
    )
  })

  // Feature: rate-management, Property 11: Filtered Results Count
  it('should display correct count when both filters are set to "all"', () => {
    fc.assert(
      fc.property(
        fc.array(rateArb, { minLength: 0, maxLength: 50 }),
        (rates) => {
          // Apply both filters set to "all"
          const filtered = applyFilters(rates, 'all', 'all')
          
          // Count should match the total number of rates
          expect(filtered.length).toBe(rates.length)
        }
      ),
      { numRuns: 100 }
    )
  })

  // Feature: rate-management, Property 11: Filtered Results Count
  it('should display zero count when no rates match the filter criteria', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 200 }), // Non-existent customer type ID
        (nonExistentTypeId) => {
          // Create rates with different customer type IDs
          const rates: Rate[] = [
            { id: 1, customerTypeId: 1, pickupRate: 100, effectiveDate: '2024-01-01', note: '', isActive: true, createdAt: '2024-01-01' },
            { id: 2, customerTypeId: 2, pickupRate: 200, effectiveDate: '2024-01-01', note: '', isActive: true, createdAt: '2024-01-01' },
          ]
          
          // Apply filter with non-existent customer type
          const filtered = applyFilters(rates, nonExistentTypeId, 'all')
          
          // Count should be zero
          expect(filtered.length).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })
})
