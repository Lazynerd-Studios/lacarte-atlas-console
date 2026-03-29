/**
 * Property-Based Tests for Team Management Email Validation
 * Feature: team-management, Property 6: Email Format Validation
 * 
 * **Validates: Requirements 4.3, 5.3**
 * 
 * Property: For any email string, the validation function should accept only strings
 * matching valid email format (contains @ symbol, has domain part, etc.) and reject
 * all other formats.
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { validateEmail } from '../teamValidation'

describe('Feature: team-management, Property 6: Email Format Validation', () => {
  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      fc.assert(
        fc.property(
          fc.emailAddress(),
          (email) => {
            expect(validateEmail(email)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject strings without @ symbol', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => !s.includes('@')),
          (invalidEmail) => {
            expect(validateEmail(invalidEmail)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject strings with @ but no domain part', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => !s.includes('@')),
          (localPart) => {
            const invalidEmail = localPart + '@'
            expect(validateEmail(invalidEmail)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject strings with @ but no local part', () => {
      fc.assert(
        fc.property(
          fc.domain(),
          (domain) => {
            const invalidEmail = '@' + domain
            expect(validateEmail(invalidEmail)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject strings with @ but no dot in domain', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => !s.includes('@') && !s.includes('.')),
          fc.string({ minLength: 1 }).filter(s => !s.includes('@') && !s.includes('.')),
          (localPart, domain) => {
            const invalidEmail = localPart + '@' + domain
            expect(validateEmail(invalidEmail)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject empty strings', () => {
      expect(validateEmail('')).toBe(false)
    })

    it('should reject strings with multiple @ symbols', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          fc.domain(),
          (part1, part2, domain) => {
            const invalidEmail = part1 + '@' + part2 + '@' + domain
            expect(validateEmail(invalidEmail)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject strings with spaces in the middle', () => {
      fc.assert(
        fc.property(
          fc.emailAddress(),
          fc.integer({ min: 1, max: 100 }),
          (email, spacePos) => {
            // Insert space in the middle (not at start or end to avoid trim removing it)
            const pos = Math.max(1, Math.min(spacePos % (email.length - 1), email.length - 1))
            const invalidEmail = email.slice(0, pos) + ' ' + email.slice(pos)
            expect(validateEmail(invalidEmail)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should accept emails with various valid formats', () => {
      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user_name@example-domain.com',
        'user123@test.org',
        'a@b.co',
      ]

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true)
      })
    })

    it('should reject common invalid email patterns', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
        'user@example',
        'user@@example.com',
        '',
        '   ',
      ]

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false)
      })
    })

    it('should handle emails with leading/trailing whitespace by trimming', () => {
      fc.assert(
        fc.property(
          fc.emailAddress(),
          fc.string().filter(s => /^\s+$/.test(s) || s === ''),
          fc.string().filter(s => /^\s+$/.test(s) || s === ''),
          (email, leading, trailing) => {
            const emailWithWhitespace = leading + email + trailing
            // The validation function trims, so it should accept valid emails with whitespace
            expect(validateEmail(emailWithWhitespace)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
