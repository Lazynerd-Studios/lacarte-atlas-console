// Team Management validation utilities

/**
 * Validates that a field is non-empty (not empty string or whitespace-only)
 * @param value - The value to validate
 * @returns true if valid, false otherwise
 */
export function validateNonEmpty(value: string): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Validates email format
 * @param email - The email to validate
 * @returns true if valid email format, false otherwise
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false
  }
  
  // Basic email validation: must contain @, have text before and after @, and have domain part
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * Validates phone format
 * Accepts various formats: (123) 456-7890, 123-456-7890, 1234567890, +1 123 456 7890
 * @param phone - The phone number to validate
 * @returns true if valid phone format, false otherwise
 */
export function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false
  }
  
  // Remove all non-digit characters to check if we have 10-15 digits
  const digitsOnly = phone.replace(/\D/g, '')
  return digitsOnly.length >= 10 && digitsOnly.length <= 15
}

/**
 * Validates team member form data
 * @param form - The form data to validate
 * @param isUpdate - Whether this is an update operation (all fields optional)
 * @returns Object with validation errors (empty object if valid)
 */
export function validateTeamMemberForm(
  form: {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    role?: string
  },
  isUpdate = false
): Record<string, string> {
  const errors: Record<string, string> = {}
  
  // For create operations, all fields are required
  // For update operations, only validate fields that are provided
  
  if (!isUpdate || form.firstName !== undefined) {
    if (!validateNonEmpty(form.firstName || '')) {
      errors.firstName = 'First name is required'
    }
  }
  
  if (!isUpdate || form.lastName !== undefined) {
    if (!validateNonEmpty(form.lastName || '')) {
      errors.lastName = 'Last name is required'
    }
  }
  
  if (!isUpdate || form.email !== undefined) {
    if (!validateNonEmpty(form.email || '')) {
      errors.email = 'Email is required'
    } else if (!validateEmail(form.email || '')) {
      errors.email = 'Invalid email format'
    }
  }
  
  if (!isUpdate || form.phone !== undefined) {
    if (!validateNonEmpty(form.phone || '')) {
      errors.phone = 'Phone number is required'
    } else if (!validatePhone(form.phone || '')) {
      errors.phone = 'Invalid phone format'
    }
  }
  
  if (!isUpdate || form.role !== undefined) {
    if (!validateNonEmpty(form.role || '')) {
      errors.role = 'Role is required'
    }
  }
  
  return errors
}

/**
 * Validates role form data
 * @param form - The role form data to validate
 * @returns Object with validation errors (empty object if valid)
 */
export function validateRoleForm(form: {
  name?: string
  permissions?: string[]
}): Record<string, string> {
  const errors: Record<string, string> = {}
  
  if (!validateNonEmpty(form.name || '')) {
    errors.name = 'Role name is required'
  }
  
  if (!form.permissions || form.permissions.length === 0) {
    errors.permissions = 'At least one permission is required'
  }
  
  return errors
}
