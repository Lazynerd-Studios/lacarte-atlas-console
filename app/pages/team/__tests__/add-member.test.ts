import { describe, it, expect, vi, beforeEach } from 'vitest'
import { validateTeamMemberForm } from '~/utils/teamValidation'
import { formToCreateMemberPayload } from '~/utils/teamTransform'

describe('Add Team Member Page', () => {
  describe('Form Validation', () => {
    it('should validate required fields', () => {
      const form = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: '',
      }

      const errors = validateTeamMemberForm(form, false)

      expect(errors.firstName).toBe('First name is required')
      expect(errors.lastName).toBe('Last name is required')
      expect(errors.email).toBe('Email is required')
      expect(errors.phone).toBe('Phone number is required')
      expect(errors.role).toBe('Role is required')
    })

    it('should validate email format', () => {
      const form = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        phone: '1234567890',
        role: 'admin',
      }

      const errors = validateTeamMemberForm(form, false)

      expect(errors.email).toBe('Invalid email format')
    })

    it('should validate phone format', () => {
      const form = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '123',
        role: 'admin',
      }

      const errors = validateTeamMemberForm(form, false)

      expect(errors.phone).toBe('Invalid phone format')
    })

    it('should pass validation with valid data', () => {
      const form = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        role: 'admin',
      }

      const errors = validateTeamMemberForm(form, false)

      expect(Object.keys(errors).length).toBe(0)
    })
  })

  describe('Form Data Transformation', () => {
    it('should transform form data to API payload', () => {
      const form = {
        firstName: '  John  ',
        lastName: '  Doe  ',
        email: '  JOHN@EXAMPLE.COM  ',
        phone: '  1234567890  ',
        role: 'admin',
        status: 'active' as const,
      }

      const payload = formToCreateMemberPayload(form)

      expect(payload.firstName).toBe('John')
      expect(payload.lastName).toBe('Doe')
      expect(payload.email).toBe('john@example.com')
      expect(payload.phone).toBe('1234567890')
      expect(payload.role).toBe('admin')
      expect(payload.status).toBe('active')
    })

    it('should trim whitespace from all fields', () => {
      const form = {
        firstName: '   Jane   ',
        lastName: '   Smith   ',
        email: '   jane@example.com   ',
        phone: '   9876543210   ',
        role: 'support',
        status: 'inactive' as const,
      }

      const payload = formToCreateMemberPayload(form)

      expect(payload.firstName).toBe('Jane')
      expect(payload.lastName).toBe('Smith')
      expect(payload.email).toBe('jane@example.com')
      expect(payload.phone).toBe('9876543210')
    })

    it('should lowercase email addresses', () => {
      const form = {
        firstName: 'Test',
        lastName: 'User',
        email: 'TEST@EXAMPLE.COM',
        phone: '1234567890',
        role: 'admin',
        status: 'active' as const,
      }

      const payload = formToCreateMemberPayload(form)

      expect(payload.email).toBe('test@example.com')
    })
  })
})
