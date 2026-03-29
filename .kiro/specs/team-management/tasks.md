# Implementation Plan: Team Management

## Overview

This plan implements the Team Management feature for managing team members, roles, and permissions. The implementation follows established patterns using `useApi`, `useErrorHandler`, and `PageSkeleton` components. Each task builds incrementally, validating functionality through code integration.

## Tasks

- [x] 1. Set up data models and utilities
  - Create TypeScript interfaces for TeamMember, Role, Permission, and form payloads
  - Create validation utilities for form inputs (name, email, phone)
  - Create data transformation utilities for API payloads
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 8.1, 8.2, 8.3_

- [x] 1.1 Write property test for non-empty field validation
  - **Property 5: Non-Empty Field Validation**
  - **Validates: Requirements 4.1, 4.2, 4.6, 5.1, 5.2**

- [x] 1.2 Write property test for email format validation
  - **Property 6: Email Format Validation**
  - **Validates: Requirements 4.3, 5.3**

- [x] 1.3 Write property test for phone format validation
  - **Property 8: Phone Format Validation**
  - **Validates: Requirements 4.5, 5.4**

- [x] 1.4 Write property test for validation error display
  - **Property 10: Validation Error Display**
  - **Validates: Requirements 4.10, 5.14, 8.8, 11.3**

- [ ] 2. Implement team list page data fetching
  - [x] 2.1 Create fetchMembers() function with loading state
    - Add API call to GET /api/team/admin/members
    - Update members reactive state with API response
    - Handle loading state with loading ref
    - _Requirements: 2.1_

  - [ ] 2.2 Write property test for team member list completeness
    - **Property 2: Team Member List Completeness**
    - **Validates: Requirements 2.1**

  - [ ] 2.3 Write property test for member display fields completeness
    - **Property 3: Member Display Fields Completeness**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6**

  - [x] 2.4 Create fetchStats() function with loading state
    - Add API call to GET /api/team/admin/stats
    - Update stats reactive state with response data
    - Handle loading state with statsLoading ref
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 2.5 Write property test for team statistics accuracy
    - **Property 1: Team Statistics Accuracy**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**

  - [ ] 2.6 Update onMounted hook to call fetch functions
    - Call fetchMembers() and fetchStats() in parallel using Promise.all()
    - _Requirements: 1.1, 2.1_

- [x] 3. Implement team list page UI
  - [x] 3.1 Create statistics cards section
    - Display Total Members, Active Members, Super Admins, Online Now cards
    - Show loading placeholders during data fetch
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 3.2 Create team member table
    - Display columns: Member, Email, Role, Status, Last Login, Actions
    - Show empty state message when no members exist
    - Add action buttons: Edit, Delete
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 3.3 Add navigation and action buttons
    - Add "Add Member" button in header
    - Implement navigation to add member page
    - Implement navigation to edit member page
    - _Requirements: 4.1, 5.1_

- [ ] 4. Checkpoint - Ensure team list page displays correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement add team member page
  - [x] 5.1 Create add member form UI
    - Create Personal Information card with firstName, lastName, email, phone inputs
    - Create Role & Access card with role selection and status dropdown
    - Add Role Information sidebar
    - Add Security sidebar
    - Add action buttons: Add Member, Cancel
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 5.2 Create fetchRoles() function
    - Add API call to GET /api/team/admin/roles
    - Update roles reactive state with response data
    - _Requirements: 7.1_

  - [ ]* 5.3 Write property test for role list completeness
    - **Property 13: Role List Completeness**
    - **Validates: Requirements 7.1**

  - [ ]* 5.4 Write property test for role display fields completeness
    - **Property 14: Role Display Fields Completeness**
    - **Validates: Requirements 7.2, 7.3**

  - [x] 5.5 Implement handleSubmit() function for add member
    - Add client-side validation using validation utilities
    - Display validation errors in form
    - Transform form data to CreateTeamMemberPayload
    - Send POST request to /api/team/admin/members
    - Handle 400 validation errors in form
    - Handle 400 duplicate email error
    - Implement success flow: show toast, navigate to team list
    - Manage loading state with submitting ref
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11_

  - [ ]* 5.6 Write property test for member creation round trip
    - **Property 9: Member Creation Round Trip**
    - **Validates: Requirements 4.7**

- [ ] 6. Checkpoint - Ensure add member functionality works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement edit team member page
  - [x] 7.1 Create edit member form UI
    - Create Personal Information card with firstName, lastName, email, phone inputs
    - Create Role & Access card with role selection and status dropdown
    - Create Permissions card with grouped permission checkboxes
    - Add Role Information sidebar
    - Add Security sidebar
    - Add action buttons: Save Changes, Cancel
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.7, 5.8, 5.9, 5.10, 5.11, 5.12, 5.13_

  - [x] 7.2 Create loadMember() function
    - Add API call to GET /api/team/admin/members/:id
    - Populate form with member data
    - Handle loading state
    - Handle invalid member ID error
    - _Requirements: 3.1, 3.9_

  - [ ]* 7.3 Write property test for member detail fields completeness
    - **Property 4: Member Detail Fields Completeness**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**

  - [x] 7.4 Create fetchPermissions() function
    - Add API call to GET /api/team/admin/permissions
    - Update permissions reactive state with response data
    - Group permissions by module
    - _Requirements: 9.1, 9.2_

  - [ ]* 7.5 Write property test for permission list completeness
    - **Property 19: Permission List Completeness**
    - **Validates: Requirements 9.1**

  - [ ]* 7.6 Write property test for permission grouping consistency
    - **Property 20: Permission Grouping Consistency**
    - **Validates: Requirements 9.2**

  - [ ]* 7.7 Write property test for permission display fields completeness
    - **Property 21: Permission Display Fields Completeness**
    - **Validates: Requirements 9.3, 9.4**

  - [x] 7.8 Implement permission selection logic
    - Create togglePermission() function for individual permission selection
    - Create toggleGroup() function for group selection
    - Create isGroupSelected() computed property
    - Create isGroupPartial() computed property
    - _Requirements: 9.6, 9.7, 9.8, 9.9_

  - [ ]* 7.9 Write property test for individual permission selection
    - **Property 22: Individual Permission Selection**
    - **Validates: Requirements 9.6**

  - [ ]* 7.10 Write property test for group permission selection
    - **Property 23: Group Permission Selection**
    - **Validates: Requirements 9.7**

  - [ ]* 7.11 Write property test for group selection state consistency
    - **Property 24: Group Selection State Consistency**
    - **Validates: Requirements 9.8, 9.9**

  - [x] 7.12 Implement handleSubmit() function for edit member
    - Add client-side validation using validation utilities
    - Display validation errors in form
    - Transform form data to UpdateTeamMemberPayload
    - Send PATCH request to /api/team/admin/members/:id
    - Handle 400 validation errors in form
    - Handle invalid member ID error
    - Implement success flow: show toast, navigate to team list
    - Manage loading state with submitting ref
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11, 5.12, 5.13, 5.14, 5.15_

  - [ ]* 7.13 Write property test for member update persistence
    - **Property 11: Member Update Persistence**
    - **Validates: Requirements 5.5, 5.7, 5.8, 5.9, 5.10, 5.11, 5.12, 5.13**

- [ ] 8. Checkpoint - Ensure edit member functionality works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement delete team member functionality
  - [x] 9.1 Add delete confirmation modal to team list page
    - Display confirmation dialog when delete button clicked
    - Show member name in confirmation message
    - Add Cancel and Confirm buttons
    - _Requirements: 6.1_

  - [x] 9.2 Implement handleDelete() function
    - Send DELETE request to /api/team/admin/members/:id
    - Handle invalid member ID error
    - Implement success flow: show toast, close modal, refresh member list
    - Manage loading state with deleting ref
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ]* 9.3 Write property test for member deletion
    - **Property 12: Member Deletion Removes Record**
    - **Validates: Requirements 6.2, 6.4**

- [-] 10. Implement add role modal
  - [x] 10.1 Create AddRoleModal component
    - Create modal UI with header, form, and footer
    - Add role name input
    - Add description textarea
    - Add grouped permission checkboxes with select all functionality
    - Add Cancel and Create Role buttons
    - _Requirements: 8.1, 8.2, 8.3, 8.6, 8.7_

  - [x] 10.2 Implement role form validation
    - Create validate() function for role form
    - Validate role name is non-empty
    - Validate at least one permission is selected
    - Display validation errors in modal
    - _Requirements: 8.1, 8.3, 8.8_

  - [ ]* 10.3 Write property test for role name validation
    - **Property 15: Role Name Validation**
    - **Validates: Requirements 8.1**

  - [ ]* 10.4 Write property test for role permission validation
    - **Property 17: Role Permission Validation**
    - **Validates: Requirements 8.3**

  - [x] 10.5 Implement permission selection logic in modal
    - Reuse togglePermission() and toggleGroup() functions
    - Reuse isGroupSelected() and isGroupPartial() computed properties
    - _Requirements: 9.6, 9.7, 9.8, 9.9_

  - [x] 10.6 Implement handleAddRole() function
    - Add client-side validation using validate() function
    - Display validation errors in modal
    - Transform form data to CreateRolePayload
    - Send POST request to /api/team/admin/roles
    - Handle 400 validation errors in modal
    - Handle 400 duplicate role name error
    - Implement success flow: show toast, close modal, refresh roles list
    - Manage loading state with submitting ref
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9_

  - [ ]* 10.7 Write property test for role name uniqueness validation
    - **Property 16: Role Name Uniqueness Validation**
    - **Validates: Requirements 8.2**

  - [ ]* 10.8 Write property test for role creation round trip
    - **Property 18: Role Creation Round Trip**
    - **Validates: Requirements 8.4, 8.6, 8.7**

- [ ] 11. Checkpoint - Ensure role creation functionality works
  - Ensure all tests pass, ask the user if questions arise.

- [-] 12. Implement comprehensive error handling
  - [x] 12.1 Add error handling for all API operations
    - Ensure 401 errors trigger redirect to login (handled by useApi)
    - Ensure 400 validation errors display in forms for form submissions
    - Ensure 400 errors display as toasts for non-form operations
    - Ensure 403, 404, 500 errors display as toasts via Error_Handler
    - Ensure network errors display as toasts via Error_Handler
    - _Requirements: 3.9, 5.15, 6.5, 6.6, 8.8, 8.9, 10.1, 10.2, 10.3, 10.4, 10.5, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

- [-] 13. Implement loading state management
  - [ ] 13.1 Add loading states to all operations
    - Display PageSkeleton during initial page load
    - Display loading placeholders for stat cards
    - Disable form controls during form submissions
    - Show loading indicators on submit buttons
    - Disable action buttons during operations
    - Remove loading indicators when operations complete
    - _Requirements: 1.5, 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ]* 13.2 Write property test for form controls disabled during submission
    - **Property 25: Form Controls Disabled During Submission**
    - **Validates: Requirements 12.2, 12.4**

- [x] 14. Implement authentication and authorization
  - [x] 14.1 Add authentication checks to all pages
    - Verify user is authenticated before displaying content
    - Redirect to login if not authenticated (handled by useApi)
    - _Requirements: 10.1_

  - [x] 14.2 Add authorization checks to all operations
    - Verify user has admin privileges before allowing operations
    - Display unauthorized error if user lacks privileges
    - _Requirements: 10.2, 10.3, 10.4, 10.5_

- [x] 15. Final checkpoint - Ensure all functionality works end-to-end
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
- The feature includes three main pages: team list, add member, edit member
- The AddRoleModal component is reusable across pages
