# Requirements Document

## Introduction

This document specifies the requirements for integrating the subscription management page with the backend API. The current implementation uses mock data and needs to be connected to real API endpoints to enable full CRUD operations for subscription plans. The integration will support both prepaid and postpaid subscription plans with proper error handling, loading states, and user feedback.

## Glossary

- **Subscription_Page**: The Vue component at `app/pages/management/subscriptions.vue` that displays and manages subscription plans
- **API_Client**: The `useApi` composable that handles HTTP requests with authentication and error handling
- **Toast_System**: The `useAppToast` composable that displays success and error notifications to users
- **Plan**: A subscription plan entity with properties including name, description, billing type, billing cycle, pickup count, bin count, badge color, subscriber count, and active status
- **Billing_Type**: The payment model for a plan, either "prepaid" or "postpaid"
- **Billing_Cycle**: The recurring payment period, one of "monthly", "quarterly", or "yearly"
- **Loading_State**: Visual feedback shown to users while API requests are in progress
- **Error_Handler**: The `useErrorHandler` composable that wraps async operations with automatic toast error feedback

## Requirements

### Requirement 1: Fetch and Display Subscription Plans

**User Story:** As an admin, I want to view all subscription plans from the backend, so that I can see the current plan configurations.

#### Acceptance Criteria

1. WHEN THE Subscription_Page loads, THE Subscription_Page SHALL fetch plans from GET /api/subscription/admin/plans with the current billing type filter
2. WHEN THE billing type tab changes, THE Subscription_Page SHALL fetch plans from GET /api/subscription/admin/plans with the new billing type filter
3. WHEN THE API returns plan data, THE Subscription_Page SHALL display each plan with its name, description, billing cycle, pickup count, bin count, badge color, subscriber count, and active status
4. WHILE THE plans are being fetched, THE Subscription_Page SHALL display the PageSkeleton component
5. IF THE API request fails, THEN THE Error_Handler SHALL display an error toast with the failure message

### Requirement 2: Fetch and Display Statistics

**User Story:** As an admin, I want to see subscription statistics for the current billing type, so that I can monitor plan performance.

#### Acceptance Criteria

1. WHEN THE Subscription_Page loads, THE Subscription_Page SHALL fetch statistics from GET /api/subscription/admin/stats with the current billing type parameter
2. WHEN THE billing type tab changes, THE Subscription_Page SHALL fetch statistics from GET /api/subscription/admin/stats with the new billing type parameter
3. WHEN THE API returns statistics, THE Subscription_Page SHALL display total plans, active plans, subscriber count, and estimated revenue
4. WHILE THE statistics are being fetched, THE Subscription_Page SHALL display loading placeholders for the stat cards
5. IF THE statistics API request fails, THEN THE Error_Handler SHALL display an error toast with the failure message

### Requirement 3: Create New Subscription Plans

**User Story:** As an admin, I want to create new subscription plans via the API, so that customers can subscribe to new offerings.

#### Acceptance Criteria

1. WHEN THE user clicks "Add Plan" and fills the form, THE Subscription_Page SHALL validate that name, pickup count, and bin count are provided
2. WHEN THE user submits a valid add plan form, THE Subscription_Page SHALL send a POST request to /api/subscription/admin/plans with name, description, type, pickups, bins, billingCycle, price, badgeColor, and isActive
3. WHEN THE API successfully creates the plan, THE Subscription_Page SHALL display a success toast, close the modal, and refresh the plan list
4. WHILE THE create request is in progress, THE Subscription_Page SHALL disable the submit button and show a loading indicator
5. IF THE API returns a 400 error indicating duplicate plan name, THEN THE Subscription_Page SHALL display the error message in the modal
6. IF THE API request fails with other errors, THEN THE Error_Handler SHALL display an error toast with the failure message

### Requirement 4: Update Existing Subscription Plans

**User Story:** As an admin, I want to update subscription plan details via the API, so that I can modify plan configurations.

#### Acceptance Criteria

1. WHEN THE user clicks "Edit" on a plan and modifies the form, THE Subscription_Page SHALL validate that name, pickup count, and bin count are provided
2. WHEN THE user submits a valid edit plan form, THE Subscription_Page SHALL send a PATCH request to /api/subscription/admin/plans/{id} with the modified fields
3. WHEN THE API successfully updates the plan, THE Subscription_Page SHALL display a success toast, close the modal, and refresh the plan list
4. WHILE THE update request is in progress, THE Subscription_Page SHALL disable the submit button and show a loading indicator
5. IF THE API returns a 400 error indicating duplicate plan name, THEN THE Subscription_Page SHALL display the error message in the modal
6. IF THE API request fails with other errors, THEN THE Error_Handler SHALL display an error toast with the failure message

### Requirement 5: Delete Subscription Plans

**User Story:** As an admin, I want to delete subscription plans via the API, so that I can remove plans that are no longer offered.

#### Acceptance Criteria

1. WHEN THE user clicks "Delete" on a plan with zero subscribers, THE Subscription_Page SHALL display a confirmation modal
2. WHEN THE user confirms deletion, THE Subscription_Page SHALL send a DELETE request to /api/subscription/admin/plans/{id}
3. WHEN THE API successfully deletes the plan, THE Subscription_Page SHALL display a success toast, close the modal, and refresh the plan list
4. WHILE THE delete request is in progress, THE Subscription_Page SHALL disable the delete button and show a loading indicator
5. IF THE plan has active subscribers, THEN THE Subscription_Page SHALL disable the delete button and show a visual indicator that deletion is not allowed
6. IF THE API returns a 400 error indicating the plan has subscribers, THEN THE Subscription_Page SHALL display an error toast explaining that plans with subscribers cannot be deleted
7. IF THE API request fails with other errors, THEN THE Error_Handler SHALL display an error toast with the failure message

### Requirement 6: Toggle Subscription Plan Active Status

**User Story:** As an admin, I want to activate or deactivate subscription plans via the API, so that I can control which plans are available to customers.

#### Acceptance Criteria

1. WHEN THE user clicks "Activate" or "Deactivate" on a plan, THE Subscription_Page SHALL send a PATCH request to /api/subscription/admin/plans/{id}/toggle
2. WHEN THE API successfully toggles the status, THE Subscription_Page SHALL display a success toast and update the plan's active status in the UI
3. WHILE THE toggle request is in progress, THE Subscription_Page SHALL disable the toggle button and show a loading indicator
4. IF THE API request fails, THEN THE Error_Handler SHALL display an error toast with the failure message

### Requirement 7: Handle Loading States

**User Story:** As an admin, I want to see loading indicators during API operations, so that I know the system is processing my request.

#### Acceptance Criteria

1. WHILE THE initial page load is fetching data, THE Subscription_Page SHALL display the PageSkeleton component
2. WHILE THE statistics are being fetched, THE Subscription_Page SHALL display loading placeholders for stat cards
3. WHILE A create, update, delete, or toggle operation is in progress, THE Subscription_Page SHALL disable the relevant action button
4. WHILE A modal form is being submitted, THE Subscription_Page SHALL disable the submit button and show a loading indicator
5. WHEN ANY API operation completes, THE Subscription_Page SHALL remove all loading indicators and re-enable buttons

### Requirement 8: Handle API Errors

**User Story:** As an admin, I want to see clear error messages when API operations fail, so that I can understand what went wrong.

#### Acceptance Criteria

1. WHEN ANY API request fails with a network error, THE Error_Handler SHALL display an error toast with the error message
2. WHEN THE API returns a 401 unauthorized error, THE API_Client SHALL redirect to the login page and display a session expired message
3. WHEN THE API returns a 400 validation error, THE Subscription_Page SHALL display the error message in the relevant modal or as a toast
4. WHEN THE API returns a 403 forbidden error, THE Error_Handler SHALL display an error toast indicating insufficient permissions
5. WHEN THE API returns a 404 not found error, THE Error_Handler SHALL display an error toast indicating the resource was not found
6. WHEN THE API returns a 500 server error, THE Error_Handler SHALL display an error toast indicating a server error occurred

### Requirement 9: Maintain Data Consistency

**User Story:** As an admin, I want the UI to reflect the latest data after operations, so that I always see accurate information.

#### Acceptance Criteria

1. WHEN A create operation succeeds, THE Subscription_Page SHALL refresh both the plan list and statistics
2. WHEN AN update operation succeeds, THE Subscription_Page SHALL refresh the plan list to show the updated data
3. WHEN A delete operation succeeds, THE Subscription_Page SHALL refresh both the plan list and statistics
4. WHEN A toggle operation succeeds, THE Subscription_Page SHALL update the plan's active status in the local state
5. WHEN THE user switches between prepaid and postpaid tabs, THE Subscription_Page SHALL fetch fresh data for the selected billing type

### Requirement 10: Validate Form Inputs

**User Story:** As an admin, I want form validation before API submission, so that I don't send invalid data to the server.

#### Acceptance Criteria

1. WHEN THE user attempts to submit an add or edit form, THE Subscription_Page SHALL validate that the plan name is not empty
2. WHEN THE user attempts to submit an add or edit form, THE Subscription_Page SHALL validate that pickup count is a positive integer
3. WHEN THE user attempts to submit an add or edit form, THE Subscription_Page SHALL validate that bin count is a positive integer
4. IF ANY validation fails, THEN THE Subscription_Page SHALL display an error message in the modal and prevent form submission
5. WHEN ALL validations pass, THE Subscription_Page SHALL proceed with the API request
