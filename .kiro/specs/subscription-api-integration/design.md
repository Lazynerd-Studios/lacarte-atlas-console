# Design Document

## Overview

This document describes the technical design for integrating the subscription management page (`app/pages/management/subscriptions.vue`) with the backend API. The current implementation uses mock data stored in local reactive state. This integration will connect the page to real API endpoints to enable full CRUD operations for subscription plans, including fetching plans and statistics, creating new plans, updating existing plans, deleting plans, and toggling active status.

The integration follows the established patterns from the existing API integration work, using the `useApi` composable for HTTP requests, `useErrorHandler` for automatic error handling with toast notifications, and `PageSkeleton` for loading states.

---

## Architecture

### API Base URL

All subscription API endpoints share the same base URL configured in the runtime config:

```
NUXT_PUBLIC_API_BASE=https://lacarte.lazynerdstudios.com/api
```

The `useApi` composable automatically prepends this base URL to all requests and attaches the authentication token.

### Request Flow

```
Subscription Page
  └─ useApi().get('/api/subscription/admin/plans?type=prepaid')
       └─ fetch(apiBase + path, { Authorization: Bearer token })
            ├─ 200 → update reactive state → render plans
            ├─ 401 → authStore.logout() + redirect /login
            └─ other error → useErrorHandler shows toast

Form Submit (Create/Update)
  └─ useApi().post('/api/subscription/admin/plans', payload)
       ├─ 201 → show success toast + close modal + refresh data
       ├─ 400 → display validation error in modal
       └─ other error → useErrorHandler shows toast

Delete Operation
  └─ useApi().del('/api/subscription/admin/plans/{id}')
       ├─ 200 → show success toast + close modal + refresh data
       ├─ 400 → show error toast (e.g., plan has subscribers)
       └─ other error → useErrorHandler shows toast

Toggle Status
  └─ useApi().patch('/api/subscription/admin/plans/{id}/toggle')
       ├─ 200 → show success toast + update local state
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

#### 1. GET /api/subscription/admin/plans

Fetches subscription plans filtered by billing type.

**Query Parameters:**
- `type`: `"prepaid"` | `"postpaid"` (required)

**Response:**
```typescript
{
  data: Array<{
    id: string                    // UUID
    name: string
    description: string
    type: "prepaid" | "postpaid"
    pickups: number
    bins: number
    billingCycle: "monthly" | "quarterly" | "yearly"
    price: number
    badgeColor: string            // hex color
    subscriberCount: number
    isActive: boolean
    createdAt: string             // ISO date
    updatedAt: string             // ISO date
  }>
}
```

#### 2. GET /api/subscription/admin/stats

Fetches statistics for subscription plans filtered by billing type.

**Query Parameters:**
- `type`: `"prepaid"` | `"postpaid"` (required)

**Response:**
```typescript
{
  totalPlans: number
  activePlans: number
  totalSubscribers: number
  estimatedRevenue: number
}
```

#### 3. POST /api/subscription/admin/plans

Creates a new subscription plan.

**Request Body:**
```typescript
{
  name: string                    // required
  description: string             // optional
  type: "prepaid" | "postpaid"    // required
  pickups: number                 // required, positive integer
  bins: number                    // required, positive integer
  billingCycle: "monthly" | "quarterly" | "yearly"  // required
  price: number                   // required, positive number
  badgeColor: string              // required, hex color
  isActive: boolean               // required
}
```

**Response:**
```typescript
{
  id: string                      // UUID of created plan
  name: string
  description: string
  type: "prepaid" | "postpaid"
  pickups: number
  bins: number
  billingCycle: "monthly" | "quarterly" | "yearly"
  price: number
  badgeColor: string
  subscriberCount: number         // always 0 for new plans
  isActive: boolean
  createdAt: string
  updatedAt: string
}
```

**Error Responses:**
- `400`: Validation error (e.g., duplicate plan name, invalid field values)
- `401`: Unauthorized (token expired or invalid)
- `403`: Forbidden (insufficient permissions)

#### 4. PATCH /api/subscription/admin/plans/{id}

Updates an existing subscription plan.

**Path Parameters:**
- `id`: UUID of the plan to update

**Request Body:**
```typescript
{
  name?: string
  description?: string
  pickups?: number
  bins?: number
  billingCycle?: "monthly" | "quarterly" | "yearly"
  price?: number
  badgeColor?: string
  isActive?: boolean
}
```

**Response:**
```typescript
{
  id: string
  name: string
  description: string
  type: "prepaid" | "postpaid"
  pickups: number
  bins: number
  billingCycle: "monthly" | "quarterly" | "yearly"
  price: number
  badgeColor: string
  subscriberCount: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}
```

**Error Responses:**
- `400`: Validation error (e.g., duplicate plan name)
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Plan not found

#### 5. DELETE /api/subscription/admin/plans/{id}

Deletes a subscription plan. Only plans with zero subscribers can be deleted.

**Path Parameters:**
- `id`: UUID of the plan to delete

**Response:**
```typescript
{
  message: string                 // e.g., "Plan deleted successfully"
}
```

**Error Responses:**
- `400`: Plan has active subscribers and cannot be deleted
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Plan not found

#### 6. PATCH /api/subscription/admin/plans/{id}/toggle

Toggles the active status of a subscription plan.

**Path Parameters:**
- `id`: UUID of the plan to toggle

**Response:**
```typescript
{
  id: string
  isActive: boolean               // new status
  message: string                 // e.g., "Plan activated successfully"
}
```

**Error Responses:**
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Plan not found

### Component State Management

The subscription page will manage the following reactive state:

```typescript
// Current billing type tab
const activeTab = ref<'prepaid' | 'postpaid'>('prepaid')

// Plans data
const plans = ref<Plan[]>([])
const loading = ref(false)

// Statistics
const stats = ref({
  totalPlans: 0,
  activePlans: 0,
  totalSubscribers: 0,
  estimatedRevenue: 0,
})
const statsLoading = ref(false)

// Modal states
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)

// Form states
const addForm = ref({ /* form fields */ })
const editForm = ref({ /* form fields */ })
const deleteTarget = ref<Plan | null>(null)

// Form errors
const addError = ref('')
const editError = ref('')

// Operation loading states
const submitting = ref(false)
const deleting = ref(false)
const toggling = ref<string | null>(null)  // stores ID of plan being toggled
```

### Type Definitions

```typescript
interface Plan {
  id: string                      // UUID from API
  name: string
  description: string
  billingType: 'prepaid' | 'postpaid'
  billingCycle: 'monthly' | 'quarterly' | 'yearly'
  pickupCount: number             // maps to API 'pickups'
  binCount: number                // maps to API 'bins'
  color: string                   // maps to API 'badgeColor'
  subscriberCount: number
  isActive: boolean
}

interface Stats {
  totalPlans: number
  activePlans: number
  totalSubscribers: number
  estimatedRevenue: number
}

interface AddFormData {
  name: string
  description: string
  billingCycle: 'monthly' | 'quarterly' | 'yearly'
  pickupCount: string             // string for input binding, converted to number
  binCount: string                // string for input binding, converted to number
  color: string
  isActive: boolean
}

interface EditFormData extends Plan {
  pickupStr: string               // string for input binding
  binStr: string                  // string for input binding
}
```

---

## Data Models

### Field Mapping: UI ↔ API

The UI uses slightly different field names than the API. The mapping is:

| UI Field | API Field | Notes |
|----------|-----------|-------|
| `billingType` | `type` | Both use `"prepaid"` \| `"postpaid"` |
| `pickupCount` | `pickups` | UI uses singular form |
| `binCount` | `bins` | UI uses singular form |
| `color` | `badgeColor` | UI uses shorter name |

### Data Transformation Functions

```typescript
// Convert API response to UI Plan
function apiToPlan(apiPlan: any): Plan {
  return {
    id: apiPlan.id,
    name: apiPlan.name,
    description: apiPlan.description,
    billingType: apiPlan.type,
    billingCycle: apiPlan.billingCycle,
    pickupCount: apiPlan.pickups,
    binCount: apiPlan.bins,
    color: apiPlan.badgeColor,
    subscriberCount: apiPlan.subscriberCount,
    isActive: apiPlan.isActive,
  }
}

// Convert UI form data to API request payload
function formToApiPayload(form: AddFormData, billingType: 'prepaid' | 'postpaid'): any {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    type: billingType,
    pickups: Number(form.pickupCount),
    bins: Number(form.binCount),
    billingCycle: form.billingCycle,
    price: 0,  // TODO: Add price field to form
    badgeColor: form.color,
    isActive: form.isActive,
  }
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified several areas of redundancy:

1. **Error handling properties (1.5, 2.5, 3.6, 4.6, 5.7, 6.4, 8.1-8.6)**: These can be consolidated into comprehensive error handling properties that cover all operations and error types.

2. **Success flow properties (3.3, 4.3, 5.3)**: These follow the same pattern (toast + close modal + refresh) and can be combined into a single property about CRUD operation success handling.

3. **Form validation properties (3.1, 4.1, 10.1-10.5)**: These overlap significantly and can be consolidated into comprehensive validation properties.

4. **Loading state properties (7.3, 7.4, 7.5)**: These can be combined into a single property about loading state management across all operations.

5. **Data refresh properties (9.1, 9.2, 9.3, 9.5)**: These follow similar patterns and can be consolidated.

The following properties represent the unique, non-redundant validation requirements:

### Property 1: Plan Data Rendering Completeness

*For any* plan returned by the API, the rendered UI should display all required fields: name, description, billing cycle, pickup count, bin count, badge color, subscriber count, and active status.

**Validates: Requirements 1.3**

### Property 2: Statistics Rendering Completeness

*For any* statistics data returned by the API, the rendered UI should display all required metrics: total plans, active plans, subscriber count, and estimated revenue.

**Validates: Requirements 2.3**

### Property 3: API Request Payload Structure

*For any* valid form submission (create or update), the API request payload should contain all required fields with correct field name mappings (billingType → type, pickupCount → pickups, binCount → bins, color → badgeColor).

**Validates: Requirements 3.2, 4.2**

### Property 4: Form Validation Completeness

*For any* add or edit form submission attempt, the validation should verify that plan name is non-empty, pickup count is a positive integer, and bin count is a positive integer.

**Validates: Requirements 3.1, 4.1, 10.1, 10.2, 10.3**

### Property 5: Validation Failure Handling

*For any* form submission with validation failures, the system should display an error message in the modal and prevent the API request from being sent.

**Validates: Requirements 10.4**

### Property 6: Validation Success Handling

*For any* form submission where all validations pass, the system should proceed with sending the API request.

**Validates: Requirements 10.5**

### Property 7: CRUD Success Flow

*For any* successful create, update, or delete operation, the system should display a success toast, close the modal, and refresh the relevant data (plan list and/or statistics).

**Validates: Requirements 3.3, 4.3, 5.3**

### Property 8: Delete Operation Request

*For any* confirmed deletion action, the system should send a DELETE request to the correct endpoint with the plan ID.

**Validates: Requirements 5.2**

### Property 9: Toggle Operation Flow

*For any* toggle action (activate/deactivate), the system should send a PATCH request to the toggle endpoint and, upon success, display a success toast and update the plan's active status in the UI.

**Validates: Requirements 6.1, 6.2**

### Property 10: Loading State Management

*For any* API operation in progress (create, update, delete, toggle), the system should disable the relevant action button and show a loading indicator, then re-enable the button and remove the indicator when the operation completes.

**Validates: Requirements 7.3, 7.4, 7.5**

### Property 11: HTTP Error Handling

*For any* API request that fails with an HTTP error status (400, 401, 403, 404, 500), the system should handle it appropriately: 401 redirects to login, 400 validation errors display in modal or toast, and all other errors display error toasts via the Error_Handler.

**Validates: Requirements 1.5, 2.5, 3.6, 4.6, 5.7, 6.4, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6**

### Property 12: Data Consistency After Mutations

*For any* successful mutation operation (create, update, delete), the system should refresh the affected data sources to ensure the UI reflects the latest state from the server.

**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

### Property 13: Tab Change Data Refresh

*For any* billing type tab change, the system should fetch fresh plans and statistics for the newly selected billing type.

**Validates: Requirements 1.2, 2.2, 9.5**

---

## Error Handling

### Error Categories

The subscription API integration handles four categories of errors:

1. **Validation Errors (400)**
   - Duplicate plan name
   - Invalid field values
   - Plans with subscribers cannot be deleted
   - **Handling**: Display error message in modal (for form submissions) or as toast (for other operations)

2. **Authentication Errors (401)**
   - Expired or invalid token
   - **Handling**: Automatic logout and redirect to login page (handled by `useApi`)

3. **Authorization Errors (403)**
   - Insufficient permissions
   - **Handling**: Display error toast via `useErrorHandler`

4. **Not Found Errors (404)**
   - Plan ID does not exist
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
// Example: Create plan with modal-specific error handling
async function handleAdd() {
  // Client-side validation
  if (!addForm.value.name.trim()) {
    addError.value = 'Plan name is required.'
    return
  }
  if (!addForm.value.pickupCount || isNaN(Number(addForm.value.pickupCount))) {
    addError.value = 'Valid pickup count is required.'
    return
  }
  if (!addForm.value.binCount || isNaN(Number(addForm.value.binCount))) {
    addError.value = 'Valid BIN count is required.'
    return
  }

  submitting.value = true
  addError.value = ''

  try {
    const api = useApi()
    const payload = formToApiPayload(addForm.value, activeTab.value)
    
    // Use raw request to handle 400 errors in modal
    const result = await api.request('/api/subscription/admin/plans', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    // Success flow
    toast.success('Plan created successfully')
    showAddModal.value = false
    await Promise.all([fetchPlans(), fetchStats()])
  } catch (err: any) {
    // Handle 400 validation errors in modal
    if (err.message.includes('duplicate') || err.message.includes('already exists')) {
      addError.value = err.message
    } else {
      // Other errors show as toast (handled by useErrorHandler in useApi)
      toast.error('Failed to create plan', err.message)
    }
  } finally {
    submitting.value = false
  }
}

// Example: Toggle with automatic error handling
async function toggleActive(plan: Plan) {
  toggling.value = plan.id
  const api = useApi()
  
  // useApi.patch automatically shows error toast on failure
  const result = await api.patch(
    `/api/subscription/admin/plans/${plan.id}/toggle`,
    {},
    'Failed to toggle plan status'
  )

  if (result) {
    toast.success(`Plan ${result.isActive ? 'activated' : 'deactivated'} successfully`)
    // Update local state
    const idx = plans.value.findIndex(p => p.id === plan.id)
    if (idx !== -1) {
      plans.value[idx].isActive = result.isActive
    }
  }

  toggling.value = null
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

The subscription API integration requires both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

Both testing approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Unit Testing Focus

Unit tests should focus on:

1. **Specific Examples**
   - Initial page load fetches plans and stats for prepaid billing type
   - Clicking "Add Plan" opens the add modal
   - Submitting a valid form closes the modal and refreshes data
   - Delete button is disabled for plans with subscribers

2. **Edge Cases**
   - Empty plan name validation
   - Non-numeric pickup/bin count validation
   - API returns 400 for duplicate plan name
   - API returns 400 when deleting plan with subscribers

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
- Tag format: `// Feature: subscription-api-integration, Property {number}: {property_text}`

**Property Test Focus:**

1. **Property 1: Plan Data Rendering Completeness**
   - Generate random plan objects with all required fields
   - Verify all fields are present in rendered output

2. **Property 2: Statistics Rendering Completeness**
   - Generate random statistics objects
   - Verify all metrics are displayed

3. **Property 3: API Request Payload Structure**
   - Generate random form data
   - Verify payload has correct structure and field mappings

4. **Property 4: Form Validation Completeness**
   - Generate random form inputs (valid and invalid)
   - Verify all validation rules are checked

5. **Property 5-6: Validation Handling**
   - Generate forms with various validation states
   - Verify correct handling of failures and successes

6. **Property 7: CRUD Success Flow**
   - Generate random successful API responses
   - Verify toast, modal close, and data refresh occur

7. **Property 8-9: Delete and Toggle Operations**
   - Generate random plan IDs and states
   - Verify correct API calls and state updates

8. **Property 10: Loading State Management**
   - Generate random operation sequences
   - Verify loading states are correctly managed

9. **Property 11: HTTP Error Handling**
   - Generate random HTTP error responses
   - Verify appropriate error handling for each status code

10. **Property 12-13: Data Consistency**
    - Generate random mutation sequences
    - Verify data is refreshed appropriately

### Test Implementation Example

```typescript
// Feature: subscription-api-integration, Property 4: Form Validation Completeness
import fc from 'fast-check'

describe('Form Validation', () => {
  it('should validate all required fields for any form submission', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string(),
          pickupCount: fc.oneof(fc.string(), fc.integer()),
          binCount: fc.oneof(fc.string(), fc.integer()),
        }),
        (formData) => {
          const errors = validateForm(formData)
          
          // Name validation
          if (!formData.name.trim()) {
            expect(errors).toContain('Plan name is required')
          }
          
          // Pickup count validation
          if (!formData.pickupCount || isNaN(Number(formData.pickupCount)) || Number(formData.pickupCount) <= 0) {
            expect(errors).toContain('Valid pickup count is required')
          }
          
          // Bin count validation
          if (!formData.binCount || isNaN(Number(formData.binCount)) || Number(formData.binCount) <= 0) {
            expect(errors).toContain('Valid BIN count is required')
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

1. Install fast-check for property-based testing
2. Set up test utilities for mocking API responses
3. Create test fixtures for plan and statistics data

### Phase 2: Core API Integration

1. Implement `fetchPlans()` function
   - Add loading state management
   - Add error handling
   - Transform API response to UI format

2. Implement `fetchStats()` function
   - Add loading state management
   - Add error handling

3. Update `onMounted` hook to call both fetch functions

4. Update tab change watcher to refresh data

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

3. Ensure delete button is disabled for plans with subscribers

### Phase 6: Toggle Operation

1. Update `toggleActive()` function
   - Handle API request with error handling
   - Update local state on success

2. Add loading state to toggle button

### Phase 7: Testing

1. Write unit tests for each operation
2. Write property-based tests for each correctness property
3. Test error handling scenarios
4. Test loading states
5. Test data consistency

### Phase 8: Polish and Documentation

1. Add inline code comments
2. Update component documentation
3. Verify all acceptance criteria are met
4. Perform manual testing

---

## Files Changed

| File | Change Type | Description |
|------|-------------|-------------|
| `app/pages/management/subscriptions.vue` | Modify | Replace mock data with API integration, add loading states, add error handling |
| `tests/unit/subscriptions.spec.ts` | New | Unit tests for subscription page |
| `tests/property/subscriptions.spec.ts` | New | Property-based tests for subscription page |

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
  - `fast-check`: Property-based testing library (to be installed)

---

## Security Considerations

1. **Authentication**: All API requests include the Bearer token via `useApi`
2. **Authorization**: The API enforces admin-only access to subscription management endpoints
3. **Input Validation**: Client-side validation prevents malformed data from being sent to the API
4. **XSS Prevention**: Vue's template system automatically escapes user input
5. **CSRF Protection**: Not applicable for Bearer token authentication

---

## Performance Considerations

1. **Parallel Fetching**: Plans and statistics are fetched in parallel using `Promise.all()`
2. **Optimistic Updates**: Toggle operation updates local state immediately for better UX
3. **Debouncing**: Not required as there are no search/filter inputs that trigger API calls
4. **Caching**: Not implemented in this phase; all data is fetched fresh on each request

---

## Future Enhancements

1. **Price Field**: Add price input to the add/edit forms (currently hardcoded to 0)
2. **Search and Filtering**: Add search by plan name and filter by active status
3. **Pagination**: Add pagination if the number of plans grows large
4. **Bulk Operations**: Add ability to activate/deactivate multiple plans at once
5. **Plan Analytics**: Add detailed analytics for each plan (revenue, churn rate, etc.)
6. **Plan Duplication**: Add ability to duplicate an existing plan as a starting point
7. **Audit Log**: Display history of changes to each plan

