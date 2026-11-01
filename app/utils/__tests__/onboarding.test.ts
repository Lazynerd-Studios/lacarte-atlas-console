// Customer onboarding stage — pure helper coverage (frontend-web-customer-onboarding-stage.md)
// **Validates: ladder order, badge tones, 0–1 percent handling, step applicability, next-action map**
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  ONBOARDING_STAGE_ORDER,
  ONBOARDING_STEP_KEYS,
  isOnboardingStage,
  stageTone,
  stagePercent,
  stepLabel,
  stepApplicable,
  nextActionFor,
} from '~/utils/onboarding'

describe('ladder', () => {
  it('lists the six stages in doc order', () => {
    expect(ONBOARDING_STAGE_ORDER).toEqual([
      'registered',
      'profile_incomplete',
      'not_priced',
      'ready_to_order',
      'active',
      'onboarded',
    ])
  })

  it('every stage has a distinct non-empty badge tone', () => {
    const labels = ONBOARDING_STAGE_ORDER.map(s => stageTone(s).label)
    const backgrounds = ONBOARDING_STAGE_ORDER.map(s => stageTone(s).bg)
    expect(new Set(labels).size).toBe(6)
    expect(new Set(backgrounds).size).toBe(6)
    labels.forEach(l => expect(l.length).toBeGreaterThan(0))
  })

  it('isOnboardingStage accepts only exact enum values (doc §5: unknown → 422)', () => {
    expect(isOnboardingStage('ready_to_order')).toBe(true)
    expect(isOnboardingStage('READY_TO_ORDER')).toBe(false)
    expect(isOnboardingStage('stuck')).toBe(false)
    expect(isOnboardingStage(undefined)).toBe(false)
    expect(isOnboardingStage(42)).toBe(false)
  })
})

describe('stagePercent', () => {
  it('converts the 0–1 fraction to whole percent', () => {
    expect(stagePercent(0)).toBe(0)
    expect(stagePercent(1)).toBe(100)
    expect(stagePercent(0.6)).toBe(60)
    expect(stagePercent(0.666)).toBe(67)
  })

  it('clamps out-of-range values and survives junk', () => {
    expect(stagePercent(-3)).toBe(0)
    expect(stagePercent(120)).toBe(100)
    expect(stagePercent(NaN)).toBe(0)
    expect(stagePercent(undefined)).toBe(0)
    expect(stagePercent(null)).toBe(0)
  })

  it('Property: output is always 0–100 for any finite input', () => {
    fc.assert(
      fc.property(fc.double({ noNaN: true }), (n) => {
        const p = stagePercent(n)
        expect(p).toBeGreaterThanOrEqual(0)
        expect(p).toBeLessThanOrEqual(100)
      }),
      { numRuns: 100 },
    )
  })
})

describe('stepLabel / stepApplicability', () => {
  it('every step key has a human label', () => {
    ONBOARDING_STEP_KEYS.forEach(k => expect(stepLabel(k)).toBeTruthy())
  })

  it('businessName only applies to entity types; priced only to per_bin (doc §Applicability)', () => {
    expect(stepApplicable('businessName', { requiresEntityName: true })).toBe(true)
    expect(stepApplicable('businessName', { requiresEntityName: false })).toBe(false)
    expect(stepApplicable('businessName', {})).toBe(false)
    expect(stepApplicable('priced', { pricingMode: 'per_bin' })).toBe(true)
    expect(stepApplicable('priced', { pricingMode: 'full_truck' })).toBe(false)
    expect(stepApplicable('priced', {})).toBe(true)
    // the other four steps always apply
    ;(['emailVerified', 'address', 'paymentActive', 'firstPickupCompleted'] as const).forEach(k => {
      expect(stepApplicable(k, { requiresEntityName: false, pricingMode: 'full_truck' })).toBe(true)
    })
  })
})

describe('nextActionFor', () => {
  it('maps missingSteps[0] to the ladder CTA', () => {
    expect(nextActionFor(['businessName', 'address']).kind).toBe('edit')
    expect(nextActionFor(['priced']).kind).toBe('bins')
    expect(nextActionFor(['paymentActive']).kind).toBe('pickup')
    expect(nextActionFor(['emailVerified']).kind).toBe('email')
    expect(nextActionFor(['paymentActive']).label).toBe('Schedule first pickup')
  })

  it('returns a no-op for empty/missing lists (onboarded customers)', () => {
    expect(nextActionFor([]).kind).toBe('none')
    expect(nextActionFor(null).kind).toBe('none')
    expect(nextActionFor(undefined).kind).toBe('none')
  })

  it('email guidance explains the customer-side action (no admin resend endpoint)', () => {
    const action = nextActionFor(['emailVerified'])
    expect(action.hint).toContain('verification link')
  })

  it('Property: every step key resolves to a known action kind', () => {
    const kinds = ['edit', 'bins', 'pickup', 'email'] as const
    fc.assert(
      fc.property(
        fc.constantFrom(...ONBOARDING_STEP_KEYS),
        (key) => {
          const action = nextActionFor([key])
          expect(kinds).toContain(action.kind)
          expect(action.label.length).toBeGreaterThan(0)
        },
      ),
      { numRuns: 60 },
    )
  })
})
