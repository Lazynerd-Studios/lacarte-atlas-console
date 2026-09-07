import { describe, it, expect } from 'vitest'
import {
  validateNonEmpty,
  validateEmail,
  validatePhone,
  validateTeamMemberForm,
  validateRoleForm,
} from '~/utils/teamValidation'

describe('validateNonEmpty', () => {
  it('returns true for non-empty strings', () => {
    expect(validateNonEmpty('hello')).toBe(true)
    expect(validateNonEmpty(' a ')).toBe(true)
  })

  it('returns false for empty or whitespace-only', () => {
    expect(validateNonEmpty('')).toBe(false)
    expect(validateNonEmpty('   ')).toBe(false)
  })
})

describe('validateEmail', () => {
  it('accepts valid emails', () => {
    expect(validateEmail('user@example.com')).toBe(true)
    expect(validateEmail('a@b.co')).toBe(true)
  })

  it('rejects invalid emails', () => {
    expect(validateEmail('')).toBe(false)
    expect(validateEmail('not-an-email')).toBe(false)
    expect(validateEmail('@missing-name.com')).toBe(false)
  })
})

describe('validatePhone', () => {
  it('accepts valid phone formats', () => {
    expect(validatePhone('0241234567')).toBe(true)
    expect(validatePhone('+1 234 567 8901')).toBe(true)
    expect(validatePhone('123-456-7890')).toBe(true)
  })

  it('rejects invalid phone numbers', () => {
    expect(validatePhone('')).toBe(false)
    expect(validatePhone('123')).toBe(false)
    expect(validatePhone('abcdefghij')).toBe(false)
  })
})

describe('validateTeamMemberForm', () => {
  it('returns no errors for valid create form', () => {
    const errors = validateTeamMemberForm({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@test.com',
      phone: '0241234567',
      role: 'operator',
    })
    expect(errors).toEqual({})
  })

  it('returns errors for empty create form', () => {
    const errors = validateTeamMemberForm({})
    expect(Object.keys(errors).length).toBeGreaterThan(0)
    expect(errors.firstName).toBeDefined()
    expect(errors.email).toBeDefined()
  })

  it('returns email error for invalid email', () => {
    const errors = validateTeamMemberForm({ email: 'bad-email' })
    expect(errors.email).toContain('Invalid')
  })

  it('skips validation in update mode for missing fields', () => {
    const errors = validateTeamMemberForm({ firstName: 'NewName' }, true)
    expect(errors).toEqual({})
  })
})

describe('validateRoleForm', () => {
  it('returns no errors for valid form', () => {
    const errors = validateRoleForm({ name: 'Manager', permissions: ['a', 'b'] })
    expect(errors).toEqual({})
  })

  it('returns errors for empty name', () => {
    const errors = validateRoleForm({ name: '', permissions: ['a'] })
    expect(errors.name).toBeDefined()
  })

  it('returns error for no permissions', () => {
    const errors = validateRoleForm({ name: 'X', permissions: [] })
    expect(errors.permissions).toBeDefined()
  })
})
