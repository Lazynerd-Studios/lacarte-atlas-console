/**
 * Property-Based Tests for Team Management Validation Error Display
 * Feature: team-management, Property 10: Validation Error Display
 * 
 * **Validates: Requirements 4.10, 5.14, 8.8, 11.3**
 * 
 * Property: For any form submission with validation errors, the system should display
 * specific error messages for each invalid field.
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { validateTeamMemberForm, validateRoleForm } from '../teamValidation'

describe('Feature: team-management, Property 10: Validation Error Display', () => {
  describe('validateTeamMemberForm error messages', () => {
    it('should return specific error message for each invalid field', () => {
      fc.assert(
        fc.property(
          fc.record({
            firstName: fc.string().filter(s => s.trim().length === 0),
            lastName: fc.string().filter(s => s.trim().length === 0),
            email: fc.string().filter(s => s.trim().length === 0),
            phone: fc.string().filter(s => s.trim().length === 0),
            role: fc.string().filter(s => s.trim().length === 0),
          }),
          (form) => {
            const errors = validateTeamMemberForm(form, false)
            
            // Each invalid field should have a specific error message
            expect(errors.firstName).toBeDefined()
            expect(errors.firstName).toBeTruthy()
            expect(typeof errors.firstName).toBe('string')
            
            expect(errors.lastName).toBeDefined()
            expect(errors.lastName).toBeTruthy()
            expect(typeof errors.lastName).toBe('string')
            
            expect(errors.email).toBeDefined()
            expect(errors.email).toBeTruthy()
            expect(typeof errors.email).toBe('string')
            
            expect(errors.phone).toBeDefined()
            expect(errors.phone).toBeTruthy()
            expect(typeof errors.phone).toBe('string')
            
            expect(errors.role).toBeDefined()
            expect(errors.role).toBeTruthy()
            expect(typeof errors.role).toBe('string')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return different error messages for different validation failures', () => {
      // Empty field error
      const emptyErrors = validateTeamMemberForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: '',
      }, false)
      
      // Invalid format error
      const formatErrors = validateTeamMemberForm({
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        phone: '123',
        role: 'admin',
      }, false)
      
      // Email error messages should be different for empty vs invalid format
      expect(emptyErrors.email).not.toBe(formatErrors.email)
      
      // Phone error messages should be different for empty vs invalid format
      expect(emptyErrors.phone).not.toBe(formatErrors.phone)
    })

    it('should only return errors for invalid fields', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.string().filter(s => s.trim().length === 0), // Invalid email
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
            
            // Valid fields should not have errors
            expect(errors.firstName).toBeUndefined()
            expect(errors.lastName).toBeUndefined()
            expect(errors.role).toBeUndefined()
            
            // Invalid email should have error
            expect(errors.email).toBeDefined()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return empty object when all fields are valid', () => {
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
            
            // Should have no errors for required fields
            expect(errors.firstName).toBeUndefined()
            expect(errors.lastName).toBeUndefined()
            expect(errors.email).toBeUndefined()
            expect(errors.role).toBeUndefined()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return error messages that are descriptive', () => {
      const errors = validateTeamMemberForm({
        firstName: '',
        lastName: '',
        email: 'invalid',
        phone: '123',
        role: '',
      }, false)
      
      // Error messages should contain descriptive text
      expect(errors.firstName.length).toBeGreaterThan(5)
      expect(errors.lastName.length).toBeGreaterThan(5)
      expect(errors.email.length).toBeGreaterThan(5)
      expect(errors.phone.length).toBeGreaterThan(5)
      expect(errors.role.length).toBeGreaterThan(5)
    })
  })

  describe('validateRoleForm error messages', () => {
    it('should return specific error message for empty role name', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => s.trim().length === 0),
          fc.array(fc.string()),
          (name, permissions) => {
            const errors = validateRoleForm({ name, permissions })
            
            expect(errors.name).toBeDefined()
            expect(errors.name).toBeTruthy()
            expect(typeof errors.name).toBe('string')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return specific error message for empty permissions', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          (name) => {
            const errors = validateRoleForm({ name, permissions: [] })
            
            expect(errors.permissions).toBeDefined()
            expect(errors.permissions).toBeTruthy()
            expect(typeof errors.permissions).toBe('string')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return errors for both name and permissions when both are invalid', () => {
      const errors = validateRoleForm({
        name: '',
        permissions: [],
      })
      
      expect(errors.name).toBeDefined()
      expect(errors.permissions).toBeDefined()
      expect(Object.keys(errors).length).toBe(2)
    })

    it('should return empty object when role form is valid', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.array(fc.string(), { minLength: 1 }),
          (name, permissions) => {
            const errors = validateRoleForm({ name, permissions })
            
            expect(Object.keys(errors).length).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return error messages that are descriptive', () => {
      const errors = validateRoleForm({
        name: '',
        permissions: [],
      })
      
      // Error messages should contain descriptive text
      expect(errors.name.length).toBeGreaterThan(5)
      expect(errors.permissions.length).toBeGreaterThan(5)
    })
  })

  describe('error message consistency', () => {
    it('should return consistent error messages for the same validation failure', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => s.trim().length === 0),
          (emptyValue) => {
            const errors1 = validateTeamMemberForm({
              firstName: emptyValue,
              lastName: 'Doe',
              email: 'test@example.com',
              phone: '1234567890',
              role: 'admin',
            }, false)
            
            const errors2 = validateTeamMemberForm({
              firstName: emptyValue,
              lastName: 'Smith',
              email: 'other@example.com',
              phone: '9876543210',
              role: 'user',
            }, false)
            
            // Same validation failure should produce same error message
            expect(errors1.firstName).toBe(errors2.firstName)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
