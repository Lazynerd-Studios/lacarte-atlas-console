# Implementation Plan: Subscription API Integration

## Overview

This plan converts the subscription management page from mock data to real API integration. The implementation follows the established patterns using `useApi`, `useErrorHandler`, and `PageSkeleton` components. Each task builds incrementally, validating functionality through code integration.

## Tasks

- [x] 1. Set up data transformation utilities
  - Create `apiToPlan()` function to convert API response to UI Plan format
  - Create `formToApiPayload()` function to convert form data to API request format
  - Add field mapping logic (billingType ↔ type, pickupCount ↔ pickups, binCount ↔ bins, color ↔ badgeColor)
  - _Requirements: 3.2, 4.2_

- [x] 1.1 Write property test for API request payload structure
  - **Property 3: API Request Payload Structure**
  - **Validates: Requirements 3.2, 4.2**

- [x] 2. Implement plan fetching functionality
  - [x] 2.1 Create `fetchPlans()` function with loading state management
    - Add API call to GET /api/subscription/admin/plans with billing type filter
    - Transform API response using `apiToPlan()` function
    - Update `plans` reactive state with transformed data
    - Handle loading state with `loading` ref
    - _Requirements: 1.1, 1.3, 1.4_

  - [x] 2.2 Write property test for plan data rendering completeness
    - **Property 1: Plan Data Rendering Completeness**
    - **Validates: Requirements 1.3**

  - [x] 2.3 Create `fetchStats()` function with loading state management
    - Add API call to GET /api/subscription/admin/stats with billing type filter
    - Update `stats` reactive state with response data
    - Handle loading state with `statsLoading` ref
    - _Requirements: 2.1, 2.3, 2.4_

  - [x] 2.4 Write property test for statistics rendering completeness
    - **Property 2: Statistics Rendering Completeness**
    - **Validates: Requirements 2.3**

  - [x] 2.5 Update `onMounted` hook to call both fetch functions
    - Call `fetchPlans()` and `fetchStats()` in parallel using Promise.all()
    - _Requirements: 1.1, 2.1_

  - [x] 2.6 Update tab change watcher to refresh data
    - Watch `activeTab` ref for changes
    - Call `fetchPlans()` and `fetchStats()` when tab changes
    - _Requirements: 1.2, 2.2, 9.5_

- [x] 2.7 Write property test for tab change data refresh
  - **Property 13: Tab Change Data Refresh**
  - **Validates: Requirements 1.2, 2.2, 9.5**

- [x] 3. Checkpoint - Ensure data fetching works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement form validation
  - [x] 4.1 Create validation function for add/edit forms
    - Validate plan name is non-empty
    - Validate pickup count is positive integer
    - Validate bin count is positive integer
    - Return validation errors array
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 4.2 Write property test for form validation completeness
    - **Property 4: Form Validation Completeness**
    - **Validates: Requirements 3.1, 4.1, 10.1, 10.2, 10.3**

  - [x] 4.3 Write property test for validation failure handling
    - **Property 5: Validation Failure Handling**
    - **Validates: Requirements 10.4**

  - [x] 4.4 Write property test for validation success handling
    - **Property 6: Validation Success Handling**
    - **Validates: Requirements 10.5**

- [x] 5. Implement create plan operation
  - [x] 5.1 Update `handleAdd()` function with API integration
    - Add client-side validation using validation function
    - Display validation errors in modal using `addError` ref
    - Transform form data to API payload using `formToApiPayload()`
    - Send POST request to /api/subscription/admin/plans
    - Handle 400 validation errors in modal
    - Implement success flow: show toast, close modal, refresh data
    - Manage loading state with `submitting` ref
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 5.2 Write property test for CRUD success flow
    - **Property 7: CRUD Success Flow**
    - **Validates: Requirements 3.3, 4.3, 5.3**

- [x] 6. Implement update plan operation
  - [x] 6.1 Update `handleEdit()` function with API integration
    - Add client-side validation using validation function
    - Display validation errors in modal using `editError` ref
    - Transform form data to API payload
    - Send PATCH request to /api/subscription/admin/plans/{id}
    - Handle 400 validation errors in modal
    - Implement success flow: show toast, close modal, refresh data
    - Manage loading state with `submitting` ref
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 7. Checkpoint - Ensure create and update operations work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement delete plan operation
  - [x] 8.1 Update `handleDelete()` function with API integration
    - Send DELETE request to /api/subscription/admin/plans/{id}
    - Implement success flow: show toast, close modal, refresh data
    - Manage loading state with `deleting` ref
    - Handle 400 error for plans with subscribers
    - _Requirements: 5.2, 5.3, 5.4, 5.6, 5.7_

  - [x] 8.2 Write property test for delete operation request
    - **Property 8: Delete Operation Request**
    - **Validates: Requirements 5.2**

  - [x] 8.3 Add UI logic to disable delete button for plans with subscribers
    - Check `subscriberCount > 0` condition
    - Disable delete button and show visual indicator
    - _Requirements: 5.5_

- [x] 9. Implement toggle active status operation
  - [x] 9.1 Update `toggleActive()` function with API integration
    - Send PATCH request to /api/subscription/admin/plans/{id}/toggle
    - Show success toast on completion
    - Update local plan state with new active status
    - Manage loading state with `toggling` ref (stores plan ID)
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 9.2 Write property test for toggle operation flow
    - **Property 9: Toggle Operation Flow**
    - **Validates: Requirements 6.1, 6.2**

- [x] 10. Implement comprehensive error handling
  - [x] 10.1 Add error handling for all API operations
    - Ensure 401 errors trigger redirect to login (handled by useApi)
    - Ensure 400 validation errors display in modals for form submissions
    - Ensure 400 errors display as toasts for non-form operations
    - Ensure 403, 404, 500 errors display as toasts via Error_Handler
    - Ensure network errors display as toasts via Error_Handler
    - _Requirements: 1.5, 2.5, 3.6, 4.6, 5.7, 6.4, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [x] 10.2 Write property test for HTTP error handling
    - **Property 11: HTTP Error Handling**
    - **Validates: Requirements 1.5, 2.5, 3.6, 4.6, 5.7, 6.4, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6**

- [x] 11. Implement loading state management
  - [x] 11.1 Add loading states to all operations
    - Disable submit buttons during form submissions
    - Disable action buttons during operations
    - Show loading indicators on buttons
    - Display PageSkeleton during initial page load
    - Display loading placeholders for stat cards
    - Remove loading indicators when operations complete
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 11.2 Write property test for loading state management
    - **Property 10: Loading State Management**
    - **Validates: Requirements 7.3, 7.4, 7.5**

- [x] 12. Implement data consistency logic
  - [x] 12.1 Add data refresh after mutations
    - Refresh plan list and stats after create operation
    - Refresh plan list after update operation
    - Refresh plan list and stats after delete operation
    - Update local state after toggle operation
    - Fetch fresh data when switching billing type tabs
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]* 12.2 Write property test for data consistency after mutations
    - **Property 12: Data Consistency After Mutations**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

- [ ] 13. Final checkpoint - Ensure all functionality works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- The design uses TypeScript, so all code should be written in TypeScript
- All API integration uses the existing `useApi` composable
- Error handling leverages the existing `useErrorHandler` composable
- Toast notifications use the existing `useAppToast` composable
