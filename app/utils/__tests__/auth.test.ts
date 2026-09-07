import { describe, it, expect } from 'vitest'
import {
  normalizeRole,
  isAdminRole,
  userIsAdmin,
  getUserPermissions,
  userHasPermission,
  userHasRole,
} from '~/utils/auth'
import type { AuthUser } from '~/types/auth'

function createUser(role: string, permissions: string[] = []): AuthUser {
  return {
    id: '1',
    name: 'Test',
    email: 'test@test.com',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    role,
    permissions,
  }
}

describe('normalizeRole', () => {
  it('converts string to lowercase and replaces underscores', () => {
    expect(normalizeRole('Super_Admin')).toBe('super admin')
    expect(normalizeRole('SUPER_ADMIN')).toBe('super admin')
  })

  it('handles object with name property', () => {
    expect(normalizeRole({ name: 'Admin' })).toBe('admin')
    expect(normalizeRole({ name: 'suPer_ADmin' })).toBe('super admin')
  })

  it('returns empty string for undefined', () => {
    expect(normalizeRole(undefined)).toBe('')
  })
})

describe('isAdminRole', () => {
  it('returns true for super admin and admin', () => {
    expect(isAdminRole('super admin')).toBe(true)
    expect(isAdminRole('admin')).toBe(true)
  })

  it('returns false for non-admin roles', () => {
    expect(isAdminRole('operator')).toBe(false)
    expect(isAdminRole('')).toBe(false)
  })
})

describe('userIsAdmin', () => {
  it('returns false for null/undefined', () => {
    expect(userIsAdmin(null)).toBe(false)
    expect(userIsAdmin(undefined)).toBe(false)
  })

  it('returns true for super admin user', () => {
    expect(userIsAdmin(createUser('super admin'))).toBe(true)
  })

  it('returns true for admin user', () => {
    expect(userIsAdmin(createUser('admin'))).toBe(true)
  })

  it('returns false for non-admin', () => {
    expect(userIsAdmin(createUser('operator'))).toBe(false)
  })
})

describe('getUserPermissions', () => {
  it('returns empty array for null/undefined', () => {
    expect(getUserPermissions(null)).toEqual([])
    expect(getUserPermissions(undefined)).toEqual([])
  })

  it('returns permissions array', () => {
    expect(getUserPermissions(createUser('operator', ['customers.view', 'drivers.view'])))
      .toEqual(['customers.view', 'drivers.view'])
  })
})

describe('userHasPermission', () => {
  it('returns false for null/undefined', () => {
    expect(userHasPermission(null, 'any')).toBe(false)
    expect(userHasPermission(undefined, 'any')).toBe(false)
  })

  it('admin always has all permissions', () => {
    expect(userHasPermission(createUser('admin', []), 'customers.view')).toBe(true)
  })

  it('checks explicit permission list', () => {
    expect(userHasPermission(createUser('operator', ['customers.view']), 'customers.view')).toBe(true)
    expect(userHasPermission(createUser('operator', ['customers.view']), 'drivers.view')).toBe(false)
  })
})

describe('userHasRole', () => {
  it('returns false for null/undefined', () => {
    expect(userHasRole(null, 'admin')).toBe(false)
    expect(userHasRole(undefined, 'admin')).toBe(false)
  })

  it('matches case-insensitively', () => {
    expect(userHasRole(createUser('ADMIN'), 'admin')).toBe(true)
    expect(userHasRole(createUser('Admin'), 'admin')).toBe(true)
  })

  it('returns false for mismatched role', () => {
    expect(userHasRole(createUser('operator'), 'admin')).toBe(false)
  })
})
