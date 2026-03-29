/**
 * Property-Based Tests for Team Management Validation
 * Feature: team-management, Property 5: Non-Empty Field Validation
 * 
 * **Validates: Requirements 4.1, 4.2, 4.6, 5.1, 5.2**
 * 
 * Property: For any form submission (create or update member), fields marked as required
 * (first name, last name, email, phone, role) should reject empty strings and whitespace-only strings.
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { validateNonEmpty, validateTeamMemberForm } from '../teamValidation'

describe('Feature: team-management, Property 5: Non-Empty Field Validation', () => {
  describe('validateNonEmpty', () => {
    it('should reject empty strings', () => {
      expect(validateNonEmpty('')).toBe(false)
    })

    it('should reject whitespace-only strings', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^\s+$/), // Only whitespace characters
          (whitespaceStr) => {
            expect(validateNonEmpty(whitespaceStr)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should accept non-empty strings with content', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          (nonEmptyStr) => {
            expect(validateNonEmpty(nonEmptyStr)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should accept strings with leading/trailing whitespace but non-empty content', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.string().filter(s => /^\s+$/.test(s) || s === ''),
          fc.string().filter(s => /^\s+$/.test(s) || s === ''),
          (content, leading, trailing) => {
            const str = leading + content + trailing
            expect(validateNonEmpty(str)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('validateTeamMemberForm - create mode', () => {
    it('should reject forms with empty firstName', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => s.trim().length === 0), // Empty or whitespace
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.emailAddress(),
          fc.string({ minLength: 10 }),
          fc.string({ minLength: 1 }),
          (firstName, lastName, email, phone, role) => {
            const errors = validateTeamMemberForm({
              firstName,
              lastName,
              email,
              phone,
              role,
            }, false)
            
            expect(errors.firstName).toBeDefined()
            expect(errors.firstName).toContain('required')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject forms with empty lastName', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.string().filter(s => s.trim().length === 0), // Empty or whitespace
          fc.emailAddress(),
          fc.string({ minLength: 10 }),
          fc.string({ minLength: 1 }),
          (firstName, lastName, email, phone, role) => {
            const errors = validateTeamMemberForm({
              firstName,
              lastName,
              email,
              phone,
              role,
            }, false)
            
            expect(errors.lastName).toBeDefined()
            expect(errors.lastName).toContain('required')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject forms with empty email', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.string().filter(s => s.trim().length === 0), // Empty or whitespace
          fc.string({ minLength: 10 }),
          fc.string({ minLength: 1 }),
          (firstName, lastName, email, phone, role) => {
            const errors = validateTeamMemberForm({
              firstName,
              lastName,
              email,
              phone,
              role,
            }, false)
            
            expect(errors.email).toBeDefined()
            expect(errors.email).toContain('required')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject forms with empty phone', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.emailAddress(),
          fc.string().filter(s => s.trim().length === 0), // Empty or whitespace
          fc.string({ minLength: 1 }),
          (firstName, lastName, email, phone, role) => {
            const errors = validateTeamMemberForm({
              firstName,
              lastName,
              email,
              phone,
              role,
            }, false)
            
            expect(errors.phone).toBeDefined()
            expect(errors.phone).toContain('required')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject forms with empty role', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.emailAddress(),
          fc.string({ minLength: 10 }),
          fc.string().filter(s => s.trim().length === 0), // Empty or whitespace
          (firstName, lastName, email, phone, role) => {
            const errors = validateTeamMemberForm({
              firstName,
              lastName,
              email,
              phone,
              role,
            }, false)
            
            expect(errors.role).toBeDefined()
            expect(errors.role).toContain('required')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should accept forms with all non-empty fields', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.emailAddress(),
          fc.string({ minLength: 10 }),
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          (firstName, lastName, email, phone, role) => {
            const errors = validateTeamMemberForm({
              firstName,
              lastName,
              email,
              phone,
              role,
            }, false)
            
            // Should not have errors for empty fields (may have format errors)
            if (errors.firstName) {
              expect(errors.firstName).not.toContain('required')
            }
            if (errors.lastName) {
              expect(errors.lastName).not.toContain('required')
            }
            if (errors.email) {
              expect(errors.email).not.toContain('required')
            }
            if (errors.phone) {
              expect(errors.phone).not.toContain('required')
            }
            if (errors.role) {
              expect(errors.role).not.toContain('required')
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('validateTeamMemberForm - update mode', () => {
    it('should reject provided firstName if empty', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => s.trim().length === 0),
          (firstName) => {
            const errors = validateTeamMemberForm({
              firstName,
            }, true)
            
            expect(errors.firstName).toBeDefined()
            expect(errors.firstName).toContain('required')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should not validate unprovided fields in update mode', () => {
      const errors = validateTeamMemberForm({}, true)
      expect(Object.keys(errors)).toHaveLength(0)
    })
  })
})
