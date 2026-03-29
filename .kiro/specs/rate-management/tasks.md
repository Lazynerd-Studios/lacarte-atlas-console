# Implementation Plan: Rate Management API Integration

## Overview

This plan converts the rate management page from mock data to real API integration. The implementation follows the established patterns using `useApi`, `useErrorHandler`, and `PageSkeleton` components. Each task builds incrementally, validating functionality through code integration.

## Tasks

- [x] 1. Set up data transformation and validation utilities
  - Create `validateForm()` function to validate add/edit form inputs
  - Create `formToApiPayload()` function to convert form data to API request format
  - Add validation logic for customer type, pickup rate, and effective date
  - _Requirements: 4.1, 5.1, 12.1, 12.2, 12.3_

- [x] 1.1 Write property test for form validation completeness
  - **Property 12: Form Validation Completeness**
  - **Validates: Requirements 4.1, 5.1, 12.1, 12.2, 12.3**

- [x] 1.2 Write property test for validation failure handling
  - **Property 13: Validation Failure Handling**
  - **Validates: Requirements 12.4**

- [x] 1.3 Write property test for validation success handling
  - **Property 14: Validation Success Handling**
  - **Validates: Requirements 12.5**

- [x] 2. Implement data fetching functionality
  - [x] 2.1 Create `fetchRates()` function with loading state management
    - Add API call to GET /api/rates/admin/payg
    - Update `rates` reactive state with API response data
    - Handle loading state with `loading` ref
    - _Requirements: 2.1, 2.2_

  - [x] 2.2 Write property test for rate data rendering completeness
    - **Property 2: Rate Data Rendering Completeness**
    - **Validates: Requirements 2.2**

  - [x] 2.3 Create `fetchStats()` function with loading state management
    - Add API call to GET /api/rates/admin/stats
    - Update `stats` reactive state with response data
    - Handle loading state with `statsLoading` ref
    - _Requirements: 1.1, 1.2_

  - [x] 2.4 Write property test for statistics rendering completeness
    - **Property 1: Statistics Rendering Completeness**
    - **Validates: Requirements 1.2**

  - [x] 2.5 Create `fetchCustomerTypes()` function with loading state management
    - Add API call to GET /api/customer-types
    - Update `customerTypes` reactive state with response data
    - Handle loading state appropriately
    - _Requirements: 3.1, 3.2_

  - [x] 2.6 Write property test for customer type dropdown population
    - **Property 3: Customer Type Dropdown Population**
    - **Validates: Requirements 3.2**

  - [x] 2.7 Write property test for customer type display in rate list
    - **Property 4: Customer Type Display in Rate List**
    - **Validates: Requirements 3.3**

  - [x] 2.8 Update `onMounted` hook to call all fetch functions
    - Call `fetchRates()`, `fetchStats()`, and `fetchCustomerTypes()` in parallel using Promise.all()
    - _Requirements: 1.1, 2.1, 3.1_

- [x] 3. Checkpoint - Ensure data fetching works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement create rate operation
  - [x] 4.1 Update `handleAdd()` function with API integration
    - Add client-side validation using `validateForm()` function
    - Display validation errors in modal using `addError` ref
    - Transform form data to API payload using `formToApiPayload()`
    - Send POST request to /api/rates/admin/payg
    - Handle 400 validation errors in modal
    - Implement success flow: show toast, close modal, refresh data
    - Manage loading state with `submitting` ref
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 4.2 Write property test for create rate API payload structure
    - **Property 5: Create Rate API Payload Structure**
    - **Validates: Requirements 4.2**

- [x] 5. Implement update rate operation
  - [x] 5.1 Update `handleEdit()` function with API integration
    - Add client-side validation using `validateForm()` function
    - Display validation errors in modal using `editError` ref
    - Transform form data to API payload
    - Send PATCH request to /api/rates/admin/payg/{id}
    - Handle 400 validation errors in modal
    - Implement success flow: show toast, close modal, refresh data
    - Manage loading state with `submitting` ref
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 5.2 Write property test for update rate API request structure
    - **Property 6: Update Rate API Request Structure**
    - **Validates: Requirements 5.2**

- [x] 6. Checkpoint - Ensure create and update operations work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement delete rate operation
  - [x] 7.1 Update `handleDelete()` function with API integration
    - Send DELETE request to /api/rates/admin/payg/{id}
    - Implement success flow: show toast, close modal, refresh data
    - Manage loading state with `deleting` ref
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 7.2 Write property test for delete rate API request
    - **Property 7: Delete Rate API Request**
    - **Validates: Requirements 6.2**

- [x] 8. Implement filtering logic tests
  - [x] 8.1 Write property test for customer type filtering
    - **Property 8: Customer Type Filtering**
    - **Validates: Requirements 7.1**

  - [x] 8.2 Write property test for status filtering
    - **Property 9: Status Filtering**
    - **Validates: Requirements 8.1**

  - [x] 8.3 Write property test for rate status computation
    - **Property 10: Rate Status Computation**
    - **Validates: Requirements 8.3, 8.4, 8.5**

  - [x] 8.4 Write property test for filtered results count
    - **Property 11: Filtered Results Count**
    - **Validates: Requirements 7.3, 8.6**

- [-] 9. Implement comprehensive error handling
  - [x] 9.1 Add error handling for all API operations
    - Ensure 401 errors trigger redirect to login (handled by useApi)
    - Ensure 400 validation errors display in modals for form submissions
    - Ensure 400 errors display as toasts for non-form operations
    - Ensure 403, 404, 500 errors display as toasts via Error_Handler
    - Ensure network errors display as toasts via Error_Handler
    - _Requirements: 1.4, 2.4, 3.4, 4.5, 4.6, 5.5, 5.6, 6.5, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [x] 9.2 Write property test for HTTP error handling
    - **Property 17: HTTP Error Handling**
    - **Validates: Requirements 1.4, 2.4, 3.4, 4.5, 4.6, 5.5, 5.6, 6.5, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6**

- [-] 10. Implement loading state management
  - [ ] 10.1 Add loading states to all operations
    - Disable submit buttons during form submissions
    - Disable action buttons during operations
    - Show loading indicators on buttons
    - Display PageSkeleton during initial page load
    - Display loading placeholders for stat cards
    - Remove loading indicators when operations complete
    - _Requirements: 4.4, 5.4, 6.4, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]* 10.2 Write property test for loading state management
    - **Property 16: Loading State Management**
    - **Validates: Requirements 4.4, 5.4, 6.4, 9.3, 9.4, 9.5**

- [x] 11. Implement data consistency logic
  - [x] 11.1 Add data refresh after mutations
    - Refresh rate list and stats after create operation
    - Refresh rate list after update operation
    - Refresh rate list and stats after delete operation
    - _Requirements: 11.1, 11.2, 11.3_

  - [x] 11.2 Write property test for CRUD success flow
    - **Property 15: CRUD Success Flow**
    - **Validates: Requirements 4.3, 5.3, 6.3, 11.1, 11.2, 11.3**

- [x] 12. Final checkpoint - Ensure all functionality works end-to-end
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
- The existing filtering logic (customer type and status) remains client-side and does not require API changes
