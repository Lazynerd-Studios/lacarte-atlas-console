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
