// Customer type definitions

import type { PaginatedDataResponse } from './api'

/** User account attached to a customer (Better Auth shape) */
export interface CustomerUser {
  id: string
  email: string
  name: string
  emailVerified: boolean
  role: string
  banned: boolean
  banReason?: string | null
  twoFactorEnabled?: boolean
  createdAt: string
  updatedAt: string
}

/** Customer type returned by /customer/admin/{id} */
export interface CustomerType {
  id: string
  name: string
  pricingMode?: 'per_bin' | 'full_truck'
  createdAt: string
  updatedAt: string
}

/** Zone assigned to a customer */
export interface CustomerZone {
  id: string
  name: string
  color: string
  isActive: boolean
}

/** Customer returned by GET /customer/admin/{id} */
export interface Customer {
  id: string
  userId: string
  customerTypeId: string
  zoneId: string
  phoneNumber: string
  noBins: number
  balance?: number
  capacityRateId?: string | null
  status: string
  createdVia?: string | null
  createdById?: string | null
  address: string | null
  city: string | null
  region: string | null
  postalCode: string | null
  country: string | null
  placeName: string | null
  locationUpdatedAt: string | null
  location: { latitude: number; longitude: number } | null
  createdAt: string
  updatedAt: string
  user: CustomerUser
  customerType: CustomerType | null
  zone: CustomerZone | null
}

/** Customer item returned in list views (includes optional lastPickupDate) */
export interface CustomerListItem extends Customer {
  lastPickupDate?: string | null
}

/** Disposable item type attached to a customer pickup history entry */
export interface DisposableItemType {
  id: string
  name: string
  icon: string | null
}

/** Estimated quantity attached to a customer pickup history entry */
export interface EstimatedQuantity {
  id: string
  label: string
}

/** Driver attached to a customer pickup history entry */
export interface CustomerPickupDriver {
  id: string
  name: string
  phoneNumber: string | null
}

/** Pickup history entry returned by /pickup-requests/admin/customers/{id}/history */
export interface CustomerPickupHistoryEntry {
  id: string
  preferredPickupDate: string | null
  status: string
  paymentType: string | null
  paymentStatus: string | null
  createdAt: string | null
  updatedAt: string | null
  disposableItemType: DisposableItemType | null
  estimatedQuantity: EstimatedQuantity | null
  driver: CustomerPickupDriver | null
}

/** Paginated response envelope for customer pickup history */
export type CustomerPickupHistoryResponse = PaginatedDataResponse<CustomerPickupHistoryEntry>
