// Rate management validation and transformation utilities

interface AddFormData {
  customerTypeId: string         // string for select binding
  estimatedQuantityId: string    // string for select binding — quantity tier for this rate
  pickupRate: string             // string for input binding, converted to number
  effectiveDate: string          // ISO date string
  note: string
  isActive: boolean
}

interface ApiPayload {
  customerTypeId: string         // Keep as string for API
  estimatedQuantityId: string    // Required — quantity tier for this rate
  rate: number                   // API uses 'rate' not 'pickupRate'
  effectiveDate: string
  note: string
  isActive: boolean
}

/**
 * Validates add/edit form inputs for rate management
 * @param form - The form data to validate
 * @param isEdit - Whether this is an edit operation (customer type not required)
 * @returns Array of validation error messages (empty if valid)
 */
export function validateForm(form: AddFormData, isEdit = false): string[] {
  const errors: string[] = []

  // Validate customer type is selected (only for add operations)
  if (!isEdit && !form.customerTypeId) {
    errors.push('Customer type is required.')
  }

  // Validate estimated quantity is selected
  if (!form.estimatedQuantityId) {
    errors.push('Estimated quantity is required.')
  }

  // Validate pickup rate is a positive number
  const pickupRate = Number(form.pickupRate)
  if (!form.pickupRate || isNaN(pickupRate) || pickupRate <= 0) {
    errors.push('Valid pickup rate is required.')
  }

  // Validate effective date is provided
  if (!form.effectiveDate) {
    errors.push('Effective date is required.')
  }

  return errors
}

/**
 * Converts form data to API request payload format
 * @param form - The form data to transform
 * @returns API-compatible payload object
 */
export function formToApiPayload(form: AddFormData): ApiPayload {
  return {
    customerTypeId: form.customerTypeId,
    estimatedQuantityId: form.estimatedQuantityId,
    rate: Number(form.pickupRate),
    effectiveDate: form.effectiveDate,
    note: form.note.trim(),
    isActive: form.isActive,
  }
}
