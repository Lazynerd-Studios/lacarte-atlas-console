// Subscription type definitions
//
// Two pricing models coexist:
//  - "plan"       → legacy fixed plan (plan object present)
//  - "calculated" → auto-priced from bin capacity rate (plan is null, uses
//                   frequency / pickupsPerCycle / amountPerCycle instead)

/** How a subscription's price is determined */
export type PricingSource = 'plan' | 'calculated'

/** Pickup frequency chosen by calculated subscribers */
export type SubscriptionFrequency = 'weekly' | 'biweekly' | 'monthly'

/** Payment flow for a subscription */
export type SubscriptionPaymentPlan = 'prepaid' | 'postpaid'

/** Billing cycle for a legacy plan */
export type PlanBillingCycle = 'monthly' | 'quarterly' | 'yearly'

/** Legacy fixed plan attached to a "plan"-priced subscription */
export interface SubscriptionPlan {
  id: string
  name: string
  description: string | null
  type: SubscriptionPaymentPlan
  pickups: number
  bins: number
  billingCycle: PlanBillingCycle
  price: number
  badgeColor: string
  gracePeriodDays: number
}

/**
 * A customer subscription.
 *
 * When `pricingSource === 'plan'`, `plan` is populated and the calculated
 * fields are null. When `pricingSource === 'calculated'`, `plan` is null and
 * `frequency` / `pickupsPerCycle` / `amountPerCycle` are populated.
 */
export interface Subscription {
  id: string
  status: string
  startDate: string
  endDate: string
  outstandingBalance: number
  /** Null for calculated subscriptions */
  plan: SubscriptionPlan | null
  /** Null for plan-based subscriptions */
  frequency: SubscriptionFrequency | null
  /** Null for plan-based subscriptions */
  pickupsPerCycle: number | null
  /** Null for plan-based subscriptions (GHS major units) */
  amountPerCycle: number | null
  pricingSource: PricingSource
  payment: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

/** Envelope returned when viewing a customer's subscription */
export interface SubscriptionResponse {
  paymentPlan: SubscriptionPaymentPlan
  subscription: Subscription
}

// ── Admin subscriber management (/subscription/admin/subscriptions) ─────────

/** Statuses accepted by the admin subscriber list filter */
export type AdminSubscriptionStatus =
  | 'active'
  | 'pending'
  | 'cancelled'
  | 'expired'
  | 'past_due'
  | 'suspended'

/** Item returned by GET /subscription/admin/subscriptions */
export interface AdminSubscriptionListItem {
  id: string
  customerId: string
  customerName: string | null
  customerPhone: string
  status: AdminSubscriptionStatus
  pricingSource: PricingSource
  /** Effective payment type (plan type or calculated snapshot) */
  paymentPlan: SubscriptionPaymentPlan
  /** Populated for plan-based subscriptions, null for calculated */
  plan: { id: string; name: string } | null
  /** Calculated subscriptions only */
  frequency: SubscriptionFrequency | null
  /** Calculated subscriptions only */
  pickupsPerCycle: number | null
  /** Calculated subscriptions only (GHS major units) */
  amountPerCycle: number | null
  /** GHS major units */
  outstandingBalance: number
  startDate: string
  endDate: string | null
  createdAt: string
}

/** Payment record within a subscription detail response */
export interface AdminSubscriptionPayment {
  id: string
  amount: number
  currency: string
  paymentType: SubscriptionPaymentPlan
  status: 'pending' | 'paid' | 'failed'
  provider: string | null
  providerRef: string | null
  paidAt: string | null
  billingPeriodStart: string
  billingPeriodEnd: string
  createdAt: string
}

/** Detail response: GET /subscription/admin/subscriptions/:id */
export interface AdminSubscriptionDetail extends AdminSubscriptionListItem {
  updatedAt: string
  /** Newest first */
  payments: AdminSubscriptionPayment[]
}

/** Settlement report returned by the admin cancel endpoint when debt was billed */
export interface CancelSettlement {
  /** Total debt after settlement (GHS major units) */
  outstandingBalance: number
  /** Settlement payment id */
  paymentId: string
  /** false if the MoMo collection prompt failed to start */
  promptSent: boolean
}

/** Response: POST /subscription/admin/subscriptions/:id/cancel */
export interface CancelSubscriptionResponse {
  success: boolean
  message?: string
  /** null for a clean exit (nothing owed) */
  settlement: CancelSettlement | null
}
