// Pure presentation helpers for the customer onboarding stage ladder
// (frontend-web-customer-onboarding-stage.md). The stage itself is derived
// server-side and authoritative — nothing here recomputes it; these functions
// only map labels/tones/actions for display, per the repo's utils convention.
import type { CustomerOnboardingStage, CustomerOnboardingSteps } from '~/types/customer'

/** Ladder order — a customer climbs these as they complete onboarding. */
export const ONBOARDING_STAGE_ORDER: CustomerOnboardingStage[] = [
  'registered',
  'profile_incomplete',
  'not_priced',
  'ready_to_order',
  'active',
  'onboarded',
]

export type OnboardingStepKey = keyof CustomerOnboardingSteps

export const ONBOARDING_STEP_KEYS: OnboardingStepKey[] = [
  'emailVerified',
  'businessName',
  'address',
  'priced',
  'paymentActive',
  'firstPickupCompleted',
]

export function isOnboardingStage(value: unknown): value is CustomerOnboardingStage {
  return typeof value === 'string' && (ONBOARDING_STAGE_ORDER as string[]).includes(value)
}

export interface StageTone {
  label: string
  bg: string
  fg: string
}

/** Badge tones for the ladder, following the existing chip palette. */
export function stageTone(stage: CustomerOnboardingStage): StageTone {
  switch (stage) {
    case 'registered':
      return { label: 'Registered', bg: '#f3f4f6', fg: '#6b7280' }
    case 'profile_incomplete':
      return { label: 'Profile incomplete', bg: '#fef2f2', fg: '#ef4444' }
    case 'not_priced':
      return { label: 'Not priced', bg: '#fff7ed', fg: '#c2410c' }
    case 'ready_to_order':
      return { label: 'Ready to order', bg: '#f0f9ff', fg: '#0369a1' }
    case 'active':
      return { label: 'Active', bg: '#fffbeb', fg: '#b45309' }
    case 'onboarded':
      return { label: 'Onboarded', bg: '#dcfce7', fg: '#16a34a' }
  }
}

/**
 * percentComplete is a 0–1 fraction (doc §5). Clamp and convert to a whole
 * percentage for the progress bar; anything unparseable renders as 0.
 */
export function stagePercent(percentComplete: number | null | undefined): number {
  if (typeof percentComplete !== 'number' || isNaN(percentComplete)) return 0
  return Math.round(Math.min(1, Math.max(0, percentComplete)) * 100)
}

const STEP_LABELS: Record<OnboardingStepKey, string> = {
  emailVerified: 'Email verified',
  businessName: 'Business name',
  address: 'Address',
  priced: 'Priced (bins)',
  paymentActive: 'Payment active',
  firstPickupCompleted: 'First pickup',
}

export function stepLabel(key: OnboardingStepKey): string {
  return STEP_LABELS[key] ?? key
}

/**
 * Whether a step is meaningful for this customer. The server already returns
 * auto-true for non-applicable steps; this only drives the greyed-out "N/A"
 * styling (doc: optionally grey using requiresEntityName / pricingMode).
 */
export function stepApplicable(
  key: OnboardingStepKey,
  ctx: { requiresEntityName?: boolean; pricingMode?: 'per_bin' | 'full_truck' | null },
): boolean {
  if (key === 'businessName') return !!ctx.requiresEntityName
  if (key === 'priced') return ctx.pricingMode !== 'full_truck'
  return true
}

export type NextActionKind = 'edit' | 'bins' | 'pickup' | 'email' | 'none'

export interface NextAction {
  kind: NextActionKind
  label: string
  hint?: string
}

const STEP_ACTION: Record<OnboardingStepKey, NextActionKind> = {
  emailVerified: 'email',
  businessName: 'edit',
  address: 'edit',
  priced: 'bins',
  paymentActive: 'pickup',
  firstPickupCompleted: 'pickup',
}

const ACTION_LABEL: Record<NextActionKind, string> = {
  edit: 'Edit profile',
  bins: 'Add bins',
  pickup: 'Schedule first pickup',
  email: 'Await email verification',
  none: '',
}

/**
 * missingSteps[0] is the natural next action (doc §"The onboarding object").
 * 'email' has no admin-side resend endpoint verified in the checked-in
 * apidoc, so it renders as guidance rather than a CTA button.
 */
export function nextActionFor(missingSteps: OnboardingStepKey[] | null | undefined): NextAction {
  const first = missingSteps?.[0]
  if (!first) return { kind: 'none', label: '' }
  const kind = STEP_ACTION[first] ?? 'none'
  const action: NextAction = { kind, label: ACTION_LABEL[kind] }
  if (kind === 'email') {
    action.hint = 'The customer must click the verification link in their sign-up email before they can move forward.'
  }
  return action
}
