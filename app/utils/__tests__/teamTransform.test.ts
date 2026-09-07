import { describe, it, expect } from 'vitest'
import {
  formToCreateMemberPayload,
  formToUpdateMemberPayload,
  formToCreateRolePayload,
} from '~/utils/teamTransform'

describe('formToCreateMemberPayload', () => {
  it('transforms and trims fields', () => {
    const payload = formToCreateMemberPayload({
      firstName: '  Jane ',
      lastName: ' Doe  ',
      email: ' JANE@TEST.COM  ',
      phone: ' 0241234567 ',
      role: 'role-1',
      status: 'active',
    })
    expect(payload).toEqual({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@test.com',
      phoneNumber: '0241234567',
      roleId: 'role-1',
      status: 'active',
    })
  })
})

describe('formToUpdateMemberPayload', () => {
  it('only includes provided fields', () => {
    const payload = formToUpdateMemberPayload({ firstName: 'Jane' })
    expect(payload).toEqual({ firstName: 'Jane' })
    expect(payload).not.toHaveProperty('lastName')
    expect(payload).not.toHaveProperty('email')
  })

  it('transforms phone to phoneNumber', () => {
    const payload = formToUpdateMemberPayload({ phone: ' 024 ' })
    expect(payload.phoneNumber).toBe('024')
  })

  it('transforms role to roleId', () => {
    const payload = formToUpdateMemberPayload({ role: 'r1' })
    expect(payload.roleId).toBe('r1')
  })

  it('lowercases email', () => {
    const payload = formToUpdateMemberPayload({ email: 'USER@TEST.COM' })
    expect(payload.email).toBe('user@test.com')
  })
})

describe('formToCreateRolePayload', () => {
  it('transforms role form to payload', () => {
    const payload = formToCreateRolePayload({
      name: ' Manager ',
      description: '  Does things  ',
      permissions: ['a', 'b'],
    })
    expect(payload).toEqual({
      name: 'Manager',
      description: 'Does things',
      permissions: ['a', 'b'],
    })
  })
})
