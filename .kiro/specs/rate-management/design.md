# Design Document

## Overview

This document describes the technical design for integrating the rate management page (`app/pages/management/rates.vue`) with the backend API. The current implementation uses mock data stored in local reactive state. This integration will connect the page to real API endpoints to enable full CRUD operations for pay-as-you-go pickup rates, including fetching rates and statistics, fetching customer types, creating new rates, updating existing rates, and deleting rates.

The integration follows the established patterns from the subscription API integration, using the `useApi` composable for HTTP requests, `useErrorHandler` for automatic error handling with toast notifications, and `PageSkeleton` for loading states.

---

## Architecture

### API Base URL

All rate API endpoints share the same base URL configured in the runtime config:

```
NUXT_PUBLIC_API_BASE=https://lacarte.lazynerdstudios.com/api
```

The `useApi` composable automatically prepends this base URL to all requests and attaches the authentication token.

### Request Flow

```
Rate Page
  └─ useApi().get('/api/rates/admin/payg')
       └─ fetch(apiBase + path, { Authorization: Bearer token })
            ├─ 200 → update reactive state → render rates
            ├─ 401 → authStore.logout() + redirect /login
            └─ other error → useErrorHandler shows toast

Form Submit (Create/Update)
  └─ useApi().post('/api/rates/admin/payg', payload)
       ├─ 201 → show success toast + close modal + refresh data
       ├─ 400 → display validation error in modal
       └─ other error → useErrorHandler shows toast

Delete Operation
  └─ useApi().del('/api/rates/admin/payg/{id}')
       ├─ 200 → show success toast + close modal + refresh data
       └─ error → useErrorHandler shows toast
```

### Error Handling Strategy

The integration uses a layered error handling approach:

1. **Automatic Toast Errors**: The `useApi` composable wraps all requests with `useErrorHandler`, which automatically displays error toasts for network failures, server errors, and authorization issues.

2. **Modal-Specific Errors**: For form validation errors (400 status), the component catches these and displays them within the modal using the `addError` or `editError` reactive state.

3. **Loading States**: Each operation manages its own loading state to disable buttons and show loading indicators during API calls.

---

## Components and Interfaces

### API Endpoints

#### 1. GET /api/rates/admin/stats

Fetches rate dashboard statistics.

**Response:**
```typescript
{
  totalRates: number
  activeRates: number
  upcomingRates: number
  customerTypes: number
}
```

#### 2. GET /api/rates/admin/payg

Fetches all pay-as-you-go rates.

**Response:**
```typescript
{
  data: Array<{
    id: number
    customerTypeId: number
    pickupRate: number
    effectiveDate: string        // ISO date (YYYY-MM-DD)
    note: string
    isActive: boolean
    createdAt: string            // ISO date (YYYY-MM-DD)
  }>
}
```

#### 3. GET /api/customer-types

Fetches all customer types for dropdown population.

**Response:**
```typescript
{
  data: Array<{
    id: number
    name: string
    color: string                // hex color
  }>
}
```

#### 4. POST /api/rates/admin/payg

Creates a new pay-as-you-go rate.

**Request Body:**
```typescript
{
  customerTypeId: number         // required
  pickupRate: number             // required, positive number
  effectiveDate: string          // required, ISO date (YYYY-MM-DD)
  note: string                   // optional
  isActive: boolean              // required
}
```

**Response:**
```typescript
{
  id: number
  customerTypeId: number
  pickupRate: number
  effectiveDate: string
  note: string
  isActive: boolean
  createdAt: string
}
```

**Error Responses:**
- `400`: Validation error (e.g., invalid field values, missing required fields)
- `401`: Unauthorized (token expired or invalid)
- `403`: Forbidden (insufficient permissions)

#### 5. PATCH /api/rates/admin/payg/{id}

Updates an existing pay-as-you-go rate.

**Path Parameters:**
- `id`: ID of the rate to update

**Request Body:**
```typescript
{
  pickupRate?: number
  effectiveDate?: string
  note?: string
  isActive?: boolean
}
```

**Response:**
```typescript
{
  id: number
  customerTypeId: number
  pickupRate: number
  effectiveDate: string
  note: string
  isActive: boolean
  createdAt: string
}
```

**Error Responses:**
- `400`: Validation error
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Rate not found

#### 6. DELETE /api/rates/admin/payg/{id}

Deletes a pay-as-you-go rate.

**Path Parameters:**
- `id`: ID of the rate to delete

**Response:**
```typescript
{
  message: string                // e.g., "Rate deleted successfully"
}
```

**Error Responses:**
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Rate not found

### Component State Management

The rate page will manage the following reactive state:

```typescript
// Customer types data
const customerTypes = ref<CustomerType[]>([])

// Rates data
const rates = ref<Rate[]>([])
const loading = ref(false)

// Statistics
const stats = ref({
  totalRates: 0,
  activeRates: 0,
  upcomingRates: 0,
  customerTypes: 0,
})
const statsLoading = ref(false)

// Filter states
const filterType = ref<number | 'all'>('all')
const filterStatus = ref<'all' | 'active' | 'upcoming' | 'inactive'>('all')

// Modal states
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)

// Form states
const addForm = ref({ /* form fields */ })
const editForm = ref({ /* form fields */ })
const deleteTarget = ref<Rate | null>(null)

// Form errors
const addError = ref('')
const editError = ref('')

// Operation loading states
const submitting = ref(false)
const deleting = ref(false)
```

### Type Definitions

```typescript
interface CustomerType {
  id: number
  name: string
  color: string                  // hex color
}

interface Rate {
  id: number
  customerTypeId: number
  pickupRate: number
  effectiveDate: string          // ISO date (YYYY-MM-DD)
  note: string
  isActive: boolean
  createdAt: string              // ISO date (YYYY-MM-DD)
}

interface Stats {
  totalRates: number
  activeRates: number
  upcomingRates: number
  customerTypes: number
}

interface AddFormData {
  customerTypeId: string         // string for select binding, converted to number
  pickupRate: string             // string for input binding, converted to number
  effectiveDate: string          // ISO date string
  note: string
  isActive: boolean
}

interface EditFormData extends Rate {
  pickupStr: string              // string for input binding
}
```

---

## Data Models

### Rate Status Computation

The UI computes rate status based on the `isActive` flag and `effectiveDate`:

```typescript
function rateStatus(rate: Rate): 'active' | 'upcoming' | 'inactive' {
  if (!rate.isActive) return 'inactive'
  
  const today = new Date().toISOString().split('T')[0]!
  if (rate.effectiveDate > today) return 'upcoming'
  
  return 'active'
}
```

### Data Transformation Functions

```typescript
// Validate form data for add/edit operations
function validateForm(form: AddFormData): string[] {
  const errors: string[] = []
  
  // Validate customer type is selected
  if (!form.customerTypeId) {
    errors.push('Customer type is required.')
  }
  
  // Validate pickup rate is positive number
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

// Convert UI form data to API request payload
function formToApiPayload(form: AddFormData) {
  return {
    customerTypeId: Number(form.customerTypeId),
    pickupRate: Number(form.pickupRate),
    effectiveDate: form.effectiveDate,
    note: form.note.trim(),
    isActive: form.isActive,
  }
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified several areas of redundancy:

1. **Error handling properties (1.4, 2.4, 3.4, 4.5, 4.6, 5.5, 5.6, 6.5, 10.1-10.6)**: These can be consolidated into comprehensive error handling properties that cover all operations and error types.

2. **Success flow properties (4.3, 5.3, 6.3)**: These follow the same pattern (toast + close modal + refresh) and can be combined into a single property about CRUD operation success handling.

3. **Form validation properties (4.1, 5.1, 12.1-12.3)**: These overlap significantly and can be consolidated into comprehensive validation properties.

4. **Loading state properties (4.4, 5.4, 6.4, 9.1-9.5)**: These can be combined into a single property about loading state management across all operations.

5. **Data refresh properties (11.1, 11.2, 11.3)**: These follow similar patterns and can be consolidated.

The following properties represent the unique, non-redundant validation requirements:

### Property 1: Statistics Rendering Completeness

*For any* statistics data returned by the API, the rendered UI should display all required metrics: total rates count, active rates count, upcoming rates count, and customer types count.

**Validates: Requirements 1.2**

### Property 2: Rate Data Rendering Completeness

*For any* rate returned by the API, the rendered UI should display all required fields: customer type (name and color), pickup rate, effective date, status, note, and creation date.

**Validates: Requirements 2.2**

### Property 3: Customer Type Dropdown Population

*For any* customer types returned by the API, all customer types should appear as options in the customer type dropdown in both add and edit forms.

**Validates: Requirements 3.2**

### Property 4: Customer Type Display in Rate List

*For any* rate displayed in the rate list, the customer type name and color should be rendered correctly based on the rate's customerTypeId.

**Validates: Requirements 3.3**

### Property 5: Create Rate API Payload Structure

*For any* valid add form submission, the API request payload should contain all required fields (customerTypeId, pickupRate, effectiveDate, note, isActive) with correct data types.

**Validates: Requirements 4.2**

### Property 6: Update Rate API Request Structure

*For any* valid edit form submission, the PATCH request should be sent to the correct endpoint `/api/rates/admin/payg/{id}` with the rate ID and modified fields.

**Validates: Requirements 5.2**

### Property 7: Delete Rate API Request

*For any* confirmed deletion action, the DELETE request should be sent to the correct endpoint `/api/rates/admin/payg/{id}` with the rate ID.

**Validates: Requirements 6.2**

### Property 8: Customer Type Filtering

*For any* selected customer type filter (excluding "all"), only rates with matching customerTypeId should be displayed in the filtered results.

**Validates: Requirements 7.1**

### Property 9: Status Filtering

*For any* selected status filter (excluding "all"), only rates with matching computed status should be displayed in the filtered results.

**Validates: Requirements 8.1**

### Property 10: Rate Status Computation

*For any* rate, the computed status should be "active" when isActive is true and effectiveDate is today or earlier, "upcoming" when isActive is true and effectiveDate is in the future, and "inactive" when isActive is false.

**Validates: Requirements 8.3, 8.4, 8.5**

### Property 11: Filtered Results Count

*For any* filter state (customer type and/or status), the displayed count should match the number of rates that pass both filters.

**Validates: Requirements 7.3, 8.6**

### Property 12: Form Validation Completeness

*For any* add or edit form submission attempt, the validation should verify that customer type is selected (for add), pickup rate is a positive number, and effective date is provided.

**Validates: Requirements 4.1, 5.1, 12.1, 12.2, 12.3**

### Property 13: Validation Failure Handling

*For any* form submission with validation failures, the system should display an error message in the modal and prevent the API request from being sent.

**Validates: Requirements 12.4**

### Property 14: Validation Success Handling

*For any* form submission where all validations pass, the system should proceed with sending the API request.

**Validates: Requirements 12.5**

### Property 15: CRUD Success Flow

*For any* successful create, update, or delete operation, the system should display a success toast, close the modal, and refresh the relevant data (rate list and/or statistics).

**Validates: Requirements 4.3, 5.3, 6.3, 11.1, 11.2, 11.3**

### Property 16: Loading State Management

*For any* API operation in progress (fetch, create, update, delete), the system should disable the relevant action button and show a loading indicator, then re-enable the button and remove the indicator when the operation completes.

**Validates: Requirements 4.4, 5.4, 6.4, 9.3, 9.4, 9.5**

### Property 17: HTTP Error Handling

*For any* API request that fails with an HTTP error status (400, 401, 403, 404, 500), the system should handle it appropriately: 401 redirects to login, 400 validation errors display in modal or toast, and all other errors display error toasts via the Error_Handler.

**Validates: Requirements 1.4, 2.4, 3.4, 4.5, 4.6, 5.5, 5.6, 6.5, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6**

---

## Error Handling

### Error Categories

The rate API integration handles four categories of errors:

1. **Validation Errors (400)**
   - Missing required fields
   - Invalid field values (negative pickup rate, invalid date)
   - **Handling**: Display error message in modal (for form submissions) or as toast (for other operations)

2. **Authentication Errors (401)**
   - Expired or invalid token
   - **Handling**: Automatic logout and redirect to login page (handled by `useApi`)

3. **Authorization Errors (403)**
   - Insufficient permissions
   - **Handling**: Display error toast via `useErrorHandler`

4. **Not Found Errors (404)**
   - Rate ID does not exist
   - **Handling**: Display error toast via `useErrorHandler`

5. **Server Errors (500)**
   - Internal server error
   - **Handling**: Display error toast via `useErrorHandler`

6. **Network Errors**
   - Connection timeout
   - Network unavailable
   - **Handling**: Display error toast via `useErrorHandler`

### Error Handling Implementation

```typescript
// Example: Create rate with modal-specific error handling
async function handleAdd() {
  // Client-side validation
  const errors = validateForm(addForm.value)
  if (errors.length > 0) {
    addError.value = errors[0] || 'Validation error'
    return
  }

  submitting.value = true
  addError.value = ''

  try {
    const api = useApi()
    const toast = useAppToast()
    const payload = formToApiPayload(addForm.value)
    
    // Use raw request to handle 400 errors in modal
    const result = await api.request('/api/rates/admin/payg', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    // Success flow
    toast.success('Rate created successfully')
    showAddModal.value = false
    await Promise.all([fetchRates(), fetchStats()])
  } catch (err: any) {
    // Handle 400 validation errors in modal
    const errorMessage = err?.message || 'Failed to create rate'
    
    if (errorMessage.toLowerCase().includes('invalid') || 
        errorMessage.toLowerCase().includes('required')) {
      addError.value = errorMessage
    } else {
      // Other errors show as toast
      const toast = useAppToast()
      toast.error('Failed to create rate', errorMessage)
    }
  } finally {
    submitting.value = false
  }
}

// Example: Delete with automatic error handling
async function handleDelete() {
  if (!deleteTarget.value) return
  
  deleting.value = true
  const api = useApi()
  const toast = useAppToast()
  
  // Use wrapped del method for automatic error handling
  const result = await api.del(
    `/api/rates/admin/payg/${deleteTarget.value.id}`,
    'Failed to delete rate'
  )
  
  if (result) {
    toast.success('Rate deleted successfully')
    showDeleteModal.value = false
    deleteTarget.value = null
    await Promise.all([fetchRates(), fetchStats()])
  }
  
  deleting.value = false
}
```

### Error Recovery

- **Transient Errors**: Users can retry the operation by clicking the action button again
- **Validation Errors**: Users can correct the form input and resubmit
- **Authentication Errors**: Users are redirected to login and can re-authenticate
- **Server Errors**: Users are advised to try again later via toast message

---

## Testing Strategy

### Dual Testing Approach

The rate API integration requires both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

Both testing approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Unit Testing Focus

Unit tests should focus on:

1. **Specific Examples**
   - Initial page load fetches rates, stats, and customer types
   - Clicking "Add Rate" opens the add modal
   - Submitting a valid form closes the modal and refreshes data
   - Clicking delete shows confirmation modal

2. **Edge Cases**
   - Empty customer type validation
   - Negative pickup rate validation
   - Missing effective date validation
   - API returns 400 for invalid data

3. **Integration Points**
   - `useApi` composable integration
   - `useErrorHandler` composable integration
   - `useAppToast` composable integration
   - `PageSkeleton` component integration

4. **Error Conditions**
   - Network timeout during fetch
   - 401 unauthorized response
   - 500 server error response

### Property-Based Testing Configuration

Property tests should use a property-based testing library appropriate for the Vue/TypeScript ecosystem (e.g., fast-check for TypeScript).

**Configuration Requirements:**
- Minimum 100 iterations per property test
- Each test must reference its design document property using a comment tag
- Tag format: `// Feature: rate-management, Property {number}: {property_text}`

**Property Test Focus:**

1. **Property 1-2: Data Rendering Completeness**
   - Generate random statistics and rate objects
   - Verify all required fields are present in rendered output

2. **Property 3-4: Customer Type Integration**
   - Generate random customer types
   - Verify dropdown population and display in rate list

3. **Property 5-7: API Request Structure**
   - Generate random form data
   - Verify correct payload structure and endpoints

4. **Property 8-11: Filtering Logic**
   - Generate random rates and filter selections
   - Verify filtering works correctly and counts match

5. **Property 10: Status Computation**
   - Generate rates with various isActive and effectiveDate values
   - Verify status is computed correctly

6. **Property 12-14: Form Validation**
   - Generate random form inputs (valid and invalid)
   - Verify validation rules and error handling

7. **Property 15: CRUD Success Flow**
   - Generate random successful API responses
   - Verify toast, modal close, and data refresh occur

8. **Property 16: Loading State Management**
   - Generate random operation sequences
   - Verify loading states are correctly managed

9. **Property 17: HTTP Error Handling**
   - Generate random HTTP error responses
   - Verify appropriate error handling for each status code

### Test Implementation Example

```typescript
// Feature: rate-management, Property 10: Rate Status Computation
import fc from 'fast-check'

describe('Rate Status Computation', () => {
  it('should compute status correctly for any rate', () => {
    fc.assert(
      fc.property(
        fc.record({
          isActive: fc.boolean(),
          effectiveDate: fc.date().map(d => d.toISOString().split('T')[0]),
        }),
        (rate) => {
          const today = new Date().toISOString().split('T')[0]!
          const status = rateStatus(rate as Rate)
          
          if (!rate.isActive) {
            expect(status).toBe('inactive')
          } else if (rate.effectiveDate > today) {
            expect(status).toBe('upcoming')
          } else {
            expect(status).toBe('active')
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

### Testing Tools

- **Unit Testing**: Vitest (already configured in the project)
- **Property-Based Testing**: fast-check (TypeScript property testing library)
- **Component Testing**: Vue Test Utils with Vitest
- **API Mocking**: MSW (Mock Service Worker) for intercepting API requests

---

## Implementation Plan

### Phase 1: Setup and Infrastructure

1. Install fast-check for property-based testing (if not already installed)
2. Set up test utilities for mocking API responses
3. Create test fixtures for rate, statistics, and customer type data

### Phase 2: Core API Integration

1. Implement `fetchRates()` function
   - Add loading state management
   - Add error handling
   - Handle API response format

2. Implement `fetchStats()` function
   - Add loading state management
   - Add error handling

3. Implement `fetchCustomerTypes()` function
   - Add loading state management
   - Add error handling

4. Update `onMounted` hook to call all three fetch functions

### Phase 3: Create Operation

1. Update `handleAdd()` function
   - Add client-side validation
   - Transform form data to API payload
   - Handle API request with error handling
   - Implement success flow (toast + close + refresh)

2. Add loading state to submit button

3. Add error display in modal

### Phase 4: Update Operation

1. Update `handleEdit()` function
   - Add client-side validation
   - Transform form data to API payload
   - Handle API request with error handling
   - Implement success flow

2. Add loading state to submit button

3. Add error display in modal

### Phase 5: Delete Operation

1. Update `handleDelete()` function
   - Handle API request with error handling
   - Implement success flow

2. Add loading state to delete button

### Phase 6: Testing

1. Write unit tests for each operation
2. Write property-based tests for each correctness property
3. Test error handling scenarios
4. Test loading states
5. Test filtering logic
6. Test status computation

### Phase 7: Polish and Documentation

1. Add inline code comments
2. Update component documentation
3. Verify all acceptance criteria are met
4. Perform manual testing

---

## Files Changed

| File | Change Type | Description |
|------|-------------|-------------|
| `app/pages/management/rates.vue` | Modify | Replace mock data with API integration, add loading states, add error handling |
| `tests/unit/rates.spec.ts` | New | Unit tests for rate page |
| `tests/property/rates.spec.ts` | New | Property-based tests for rate page |

---

## Dependencies

- **Existing Composables**:
  - `useApi`: HTTP client with authentication
  - `useErrorHandler`: Automatic error toast handling
  - `useAppToast`: Toast notification system
  - `useCurrency`: Currency formatting (already used in component)

- **Existing Components**:
  - `PageSkeleton`: Loading skeleton component

- **New Dependencies**:
  - `fast-check`: Property-based testing library (to be installed if not present)

---

## Security Considerations

1. **Authentication**: All API requests include the Bearer token via `useApi`
2. **Authorization**: The API enforces admin-only access to rate management endpoints
3. **Input Validation**: Client-side validation prevents malformed data from being sent to the API
4. **XSS Prevention**: Vue's template system automatically escapes user input
5. **CSRF Protection**: Not applicable for Bearer token authentication

---

## Performance Considerations

1. **Parallel Fetching**: Rates, statistics, and customer types are fetched in parallel using `Promise.all()`
2. **Client-Side Filtering**: Filter operations are performed on the client side for instant feedback
3. **Debouncing**: Not required as there are no search inputs that trigger API calls
4. **Caching**: Not implemented in this phase; all data is fetched fresh on each request

---

## Future Enhancements

1. **Search Functionality**: Add search by customer type name or rate amount
2. **Pagination**: Add pagination if the number of rates grows large
3. **Bulk Operations**: Add ability to activate/deactivate multiple rates at once
4. **Rate History**: Display history of rate changes for each customer type
5. **Rate Comparison**: Add ability to compare rates across customer types
6. **Export Functionality**: Add ability to export rates to CSV or Excel
7. **Audit Log**: Display history of changes to each rate
