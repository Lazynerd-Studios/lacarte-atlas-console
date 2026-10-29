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
  /** When true, customers in this category must carry a business name (entity names) */
  requiresEntityName?: boolean
  /** Custom label for the business-name field; null falls back to "Business name" */
  entityNameLabel?: string | null
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

/**
 * One entry in a per_bin customer's bin inventory (multi-bin-sizes).
 * Returned by GET /customer/admin/{id} and list endpoints as
 * { quantity, capacityRate: { id, capacityLiters } }.
 */
export interface CustomerBin {
  quantity: number
  capacityRate: { id: string; capacityLiters: number }
}

/** Customer returned by GET /customer/admin/{id} */
export interface Customer {
  id: string
  userId: string
  customerTypeId: string
  zoneId: string
  phoneNumber: string
  /**
   * Bin inventory for per_bin customers (multi-bin-sizes). Replaces the old
   * `noBins` + `capacityRateId` scalars — Σ quantity is the physical bin total.
   * Empty array means the customer cannot be subscribed or priced for PAYG.
   */
  bins: CustomerBin[]
  balance?: number
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
  /** Business name (entity names); null unless the customer's category requires one */
  entityName?: string | null
  /** Unambiguous display name: business name when present, else the person's name */
  displayName?: string
  /**
   * Derived, read-only onboarding stage (admin detail + list responses only).
   * Computed per request — absent when the backend predates the feature; the
   * UI hides itself rather than guessing. Never recompute `stage` client-side.
   */
  onboarding?: CustomerOnboarding
  /**
   * Per-customer pickup booking defaults (§4). Nullable preferences set via
   * PATCH /customer/admin/:id (send null to clear). They drive the zone-schedule
   * generator and act as the server-side fallback when a pickup is booked
   * without an explicit estimated quantity. Not part of customer create.
   */
  defaultItemTypeId?: string | null
  defaultEstimatedQuantityId?: string | null
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

// ── Customer onboarding stage (frontend-web-customer-onboarding-stage.md) ──

/** Ordered ladder — every customer sits in exactly one stage */
export type CustomerOnboardingStage =
  | 'registered'
  | 'profile_incomplete'
  | 'not_priced'
  | 'ready_to_order'
  | 'active'
  | 'onboarded'

/** Six boolean steps; non-applicable steps come back auto-true from the server */
export interface CustomerOnboardingSteps {
  emailVerified: boolean
  businessName: boolean
  address: boolean
  priced: boolean
  paymentActive: boolean
  firstPickupCompleted: boolean
}

export interface CustomerOnboarding {
  stage: CustomerOnboardingStage
  /** Fraction 0–1 over APPLICABLE steps only — multiply by 100 to display */
  percentComplete: number
  steps: CustomerOnboardingSteps
  /** Outstanding applicable steps, in ladder order; [0] drives the next action */
  missingSteps: (keyof CustomerOnboardingSteps)[]
}

/** GET /customer/admin/onboarding/counts — all six stages always present, sum to total */
export interface OnboardingCounts extends Record<CustomerOnboardingStage, number> {
  total: number
}

// ── Customer bulk import (frontend-web-customer-bulk-import.md) ──

/** Field-level problem on an import row — shared by preview and commit responses */
export interface ImportRowIssue {
  field: string
  message: string
}

/** One dry-run preview row from POST /customer/admin/import/validate */
export interface ImportPreviewRow {
  /** 1-based spreadsheet row (header = row 1) */
  row: number
  status: 'valid' | 'invalid' | 'duplicate'
  email: string
  fullName: string
  businessName: string | null
  /** Resolved against live DB; null when unknown */
  customerType: { id: string; name: string } | null
  /** Resolved active zone; null when unknown/inactive */
  zone: { id: string; name: string } | null
  /** Helps flag "will need bins" rows */
  pricingMode: 'per_bin' | 'full_truck' | null
  issues: ImportRowIssue[]
}

/** POST /customer/admin/import/validate response — creates nothing */
export interface ImportPreviewResponse {
  total: number
  valid: number
  invalid: number
  duplicate: number
  rows: ImportPreviewRow[]
}

/** Failed row echoed by the commit endpoint (same issue shape as the preview) */
export interface ImportCommitError {
  row: number
  email: string
  issues: ImportRowIssue[]
}

/** POST /customer/admin/import response — commit re-validates, never trusts the preview */
export interface ImportCommitResponse {
  total: number
  created: number
  /** Duplicate emails (existing or in-file) — skipped, not failed */
  skipped: number
  failed: number
  /** Created per_bin customers still needing bins before they can be priced/subscribed */
  needsBins: number
  errors: ImportCommitError[]
}
