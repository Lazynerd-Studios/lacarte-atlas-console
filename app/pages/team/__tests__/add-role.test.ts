import { describe, it, expect } from 'vitest'
import { validateRoleForm } from '~/utils/teamValidation'
import { formToCreateRolePayload } from '~/utils/teamTransform'

describe('Add Role Modal', () => {
  describe('Role Form Validation', () => {
    it('should validate role name is required', () => {
      const form = {
        name: '',
        permissions: ['customers.view'],
      }

      const errors = validateRoleForm(form)

      expect(errors.name).toBe('Role name is required')
    })

    it('should validate role name is not whitespace-only', () => {
      const form = {
        name: '   ',
        permissions: ['customers.view'],
      }

      const errors = validateRoleForm(form)

      expect(errors.name).toBe('Role name is required')
    })

    it('should validate at least one permission is selected', () => {
      const form = {
        name: 'Operations Manager',
        permissions: [],
      }

      const errors = validateRoleForm(form)

      expect(errors.permissions).toBe('At least one permission is required')
    })

    it('should pass validation with valid data', () => {
      const form = {
        name: 'Operations Manager',
        permissions: ['customers.view', 'drivers.view'],
      }

      const errors = validateRoleForm(form)

      expect(Object.keys(errors).length).toBe(0)
    })
  })

  describe('Role Form Data Transformation', () => {
    it('should transform form data to API payload', () => {
      const form = {
        name: '  Operations Manager  ',
        description: '  Manages daily operations  ',
        permissions: ['customers.view', 'drivers.view', 'trucks.view'],
      }

      const payload = formToCreateRolePayload(form)

      expect(payload.name).toBe('Operations Manager')
      expect(payload.description).toBe('Manages daily operations')
      expect(payload.permissions).toEqual(['customers.view', 'drivers.view', 'trucks.view'])
    })

    it('should trim whitespace from name and description', () => {
      const form = {
        name: '   Finance Manager   ',
        description: '   Handles billing and payments   ',
        permissions: ['billing.view', 'billing.approve'],
      }

      const payload = formToCreateRolePayload(form)

      expect(payload.name).toBe('Finance Manager')
      expect(payload.description).toBe('Handles billing and payments')
    })

    it('should handle empty description', () => {
      const form = {
        name: 'Support Agent',
        description: '',
        permissions: ['customers.view', 'comms.sms'],
      }

      const payload = formToCreateRolePayload(form)

      expect(payload.name).toBe('Support Agent')
      expect(payload.description).toBe('')
      expect(payload.permissions).toEqual(['customers.view', 'comms.sms'])
    })

    it('should preserve permission array order', () => {
      const form = {
        name: 'Admin',
        description: 'Full access',
        permissions: ['team.manage', 'settings.manage', 'customers.view'],
      }

      const payload = formToCreateRolePayload(form)

      expect(payload.permissions).toEqual(['team.manage', 'settings.manage', 'customers.view'])
    })
  })
})
