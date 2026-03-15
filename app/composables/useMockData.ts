/**
 * useMockData — single source of truth for all shared reference data.
 * When real API endpoints are ready, swap the static arrays for API calls here.
 */

export interface Zone {
  id: string
  name: string
  color: string
}

export interface Truck {
  id: string
  plate: string
  capacity: string
  label: string
}

export interface CustomerType {
  id: string
  name: string
}

export interface SubscriptionPlan {
  id: string
  name: string
}

// Module-level singletons so data is shared across all composable calls
const zones: Zone[] = [
  { id: 'Zone A – Central',   name: 'Zone A – Central',   color: '#3b82f6' },
  { id: 'Zone B – Westside',  name: 'Zone B – Westside',  color: '#22c55e' },
  { id: 'Zone C – Eastside',  name: 'Zone C – Eastside',  color: '#f97316' },
  { id: 'Zone D – Northside', name: 'Zone D – Northside', color: '#8b5cf6' },
  { id: 'Zone E – Southside', name: 'Zone E – Southside', color: '#ec4899' },
]

const trucks: Truck[] = [
  { id: 'T-001', plate: 'LCT-1001', capacity: '10 tons', label: 'T-001 — LCT-1001 (10 tons)' },
  { id: 'T-003', plate: 'LCT-1003', capacity: '10 tons', label: 'T-003 — LCT-1003 (10 tons)' },
  { id: 'T-007', plate: 'LCT-1007', capacity: '12 tons', label: 'T-007 — LCT-1007 (12 tons)' },
  { id: 'T-012', plate: 'LCT-1012', capacity: '10 tons', label: 'T-012 — LCT-1012 (10 tons)' },
  { id: 'T-015', plate: 'LCT-1015', capacity: '12 tons', label: 'T-015 — LCT-1015 (12 tons)' },
]

const customerTypes: CustomerType[] = [
  { id: 'regular',    name: 'Regular' },
  { id: 'commercial', name: 'Commercial' },
  { id: 'estate',     name: 'Estate' },
  { id: 'industrial', name: 'Industrial' },
]

const subscriptionPlans: SubscriptionPlan[] = [
  { id: 'subscription',   name: 'Subscription' },
  { id: 'pay-as-you-go',  name: 'Pay-as-you-go' },
]

export function useMockData() {
  return { zones, trucks, customerTypes, subscriptionPlans }
}
