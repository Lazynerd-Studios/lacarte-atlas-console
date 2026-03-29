// Team Management data transformation utilities

import type { CreateTeamMemberPayload, UpdateTeamMemberPayload, CreateRolePayload } from '~/types/team'

/**
 * Transforms team member form data to CreateTeamMemberPayload for API
 * @param form - The form data
 * @returns API-compatible payload
 */
export function formToCreateMemberPayload(form: {
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  status: 'active' | 'inactive'
}): CreateTeamMemberPayload {
  // Backend expects: firstName, lastName, email, roleId, phoneNumber, status
  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim().toLowerCase(),
    phoneNumber: form.phone.trim(),
    roleId: form.role,
    status: form.status,
  }
}

/**
 * Transforms team member form data to UpdateTeamMemberPayload for API
 * Only includes fields that are provided
 * @param form - The form data
 * @returns API-compatible payload
 */
export function formToUpdateMemberPayload(form: {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  role?: string
  status?: 'active' | 'inactive'
}): UpdateTeamMemberPayload {
  const payload: UpdateTeamMemberPayload = {}
  
  if (form.firstName !== undefined) {
    payload.firstName = form.firstName.trim()
  }
  
  if (form.lastName !== undefined) {
    payload.lastName = form.lastName.trim()
  }
  
  if (form.email !== undefined) {
    payload.email = form.email.trim().toLowerCase()
  }
  
  if (form.phone !== undefined) {
    payload.phoneNumber = form.phone.trim()
  }
  
  if (form.role !== undefined) {
    payload.roleId = form.role
  }
  
  if (form.status !== undefined) {
    payload.status = form.status
  }
  
  return payload
}

/**
 * Transforms role form data to CreateRolePayload for API
 * @param form - The role form data
 * @returns API-compatible payload
 */
export function formToCreateRolePayload(form: {
  name: string
  description: string
  permissions: string[]
}): CreateRolePayload {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    permissions: form.permissions,
  }
}
