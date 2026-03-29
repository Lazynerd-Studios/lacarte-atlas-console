/**
 * Property-Based Tests for Team Management Phone Validation
 * Feature: team-management, Property 8: Phone Format Validation
 * 
 * **Validates: Requirements 4.5, 5.4**
 * 
 * Property: For any phone string, the validation function should accept only strings
 * matching valid phone format and reject all other formats.
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { validatePhone } from '../teamValidation'

describe('Feature: team-management, Property 8: Phone Format Validation', () => {
  describe('validatePhone', () => {
    it('should accept phone numbers with 10-15 digits', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 15 }),
          (digitCount) => {
            const phone = '1'.repeat(digitCount)
            expect(validatePhone(phone)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should accept phone numbers with various formatting characters', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 15 }),
          (digitCount) => {
            // Generate a phone number with digits and formatting characters
            const digits = '1'.repeat(digitCount)
            const formatted = digits.split('').join('-') // Add dashes between digits
            expect(validatePhone(formatted)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject phone numbers with less than 10 digits', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 9 }),
          (digitCount) => {
            const phone = '1'.repeat(digitCount)
            expect(validatePhone(phone)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject phone numbers with more than 15 digits', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 16, max: 30 }),
          (digitCount) => {
            const phone = '1'.repeat(digitCount)
            expect(validatePhone(phone)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject empty strings', () => {
      expect(validatePhone('')).toBe(false)
    })

    it('should reject strings with no digits', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => !/\d/.test(s)),
          (nonDigitStr) => {
            expect(validatePhone(nonDigitStr)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should accept common phone number formats', () => {
      const validPhones = [
        '1234567890',                    // 10 digits
        '123-456-7890',                  // Dashes
        '(123) 456-7890',                // Parentheses and dashes
        '+1 123 456 7890',               // International format
        '+44 20 1234 5678',              // UK format
        '123.456.7890',                  // Dots
        '1 (123) 456-7890',              // Mixed format
        '+1-123-456-7890',               // International with dashes
        '12345678901',                   // 11 digits
        '123456789012345',               // 15 digits
      ]

      validPhones.forEach(phone => {
        expect(validatePhone(phone)).toBe(true)
      })
    })

    it('should reject invalid phone patterns', () => {
      const invalidPhones = [
        '',                              // Empty
        '   ',                           // Whitespace only
        '123',                           // Too few digits
        '12345678',                      // Too few digits
        '1234567890123456',              // Too many digits
        'abc-def-ghij',                  // No digits
        'phone number',                  // Text
      ]

      invalidPhones.forEach(phone => {
        expect(validatePhone(phone)).toBe(false)
      })
    })

    it('should accept phone numbers with exactly 10 digits regardless of formatting', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 10, maxLength: 10 }),
          fc.constantFrom('-', ' ', '.', '(', ')', '+'),
          (digits, separator) => {
            // Create a phone number with 10 digits and random separators
            const phone = digits.join(separator)
            expect(validatePhone(phone)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should accept phone numbers with exactly 15 digits regardless of formatting', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 15, maxLength: 15 }),
          fc.constantFrom('-', ' ', '.', '(', ')', '+'),
          (digits, separator) => {
            // Create a phone number with 15 digits and random separators
            const phone = digits.join(separator)
            expect(validatePhone(phone)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject phone numbers with 9 digits regardless of formatting', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 9, maxLength: 9 }),
          fc.constantFrom('-', ' ', '.', '(', ')', '+'),
          (digits, separator) => {
            // Create a phone number with 9 digits and random separators
            const phone = digits.join(separator)
            expect(validatePhone(phone)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject phone numbers with 16 digits regardless of formatting', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 16, maxLength: 16 }),
          fc.constantFrom('-', ' ', '.', '(', ')', '+'),
          (digits, separator) => {
            // Create a phone number with 16 digits and random separators
            const phone = digits.join(separator)
            expect(validatePhone(phone)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
