# Requirements Document

## Introduction

This document specifies the requirements for integrating the rate management page with the backend API. The current implementation at `app/pages/management/rates.vue` uses mock data and needs to be connected to real API endpoints to enable full CRUD operations for pay-as-you-go pickup rates. The integration will support rate management by customer type with proper error handling, loading states, and user feedback.

## Glossary

- **Rate_Page**: The Vue component at `app/pages/management/rates.vue` that displays and manages pay-as-you-go pickup rates
- **API_Client**: The `useApi` composable that handles HTTP requests with authentication and error handling
- **Toast_System**: The `useAppToast` composable that displays success and error notifications to users
- **Rate**: A pay-as-you-go rate entity with properties including customer type ID, pickup rate, effective date, note, active status, and creation date
- **Customer_Type**: A customer classification entity with properties including name and color
- **Rate_Status**: The computed status of a rate, one of "active", "upcoming", or "inactive" based on effective date and active flag
- **Loading_State**: Visual feedback shown to users while API requests are in progress
- **Error_Handler**: The `useErrorHandler` composable that wraps async operations with automatic toast error feedback

## Requirements

### Requirement 1: Fetch and Display Rate Dashboard Statistics

**User Story:** As an admin, I want to view rate dashboard statistics, so that I can monitor the overall rate configuration.

#### Acceptance Criteria

1. WHEN THE Rate_Page loads, THE Rate_Page SHALL fetch statistics from GET /api/rates/admin/stats
2. WHEN THE API returns statistics, THE Rate_Page SHALL display total rates count, active rates count, upcoming rates count, and customer types count
3. WHILE THE statistics are being fetched, THE Rate_Page SHALL display loading placeholders for the stat cards
4. IF THE statistics API request fails, THEN THE Error_Handler SHALL display an error toast with the failure message

### Requirement 2: Fetch and Display Pay-as-you-go Rates

**User Story:** As an admin, I want to view all pay-as-you-go rates from the backend, so that I can see the current rate configurations.

#### Acceptance Criteria

1. WHEN THE Rate_Page loads, THE Rate_Page SHALL fetch rates from GET /api/rates/admin/payg
2. WHEN THE API returns rate data, THE Rate_Page SHALL display each rate with its customer type, pickup rate, effective date, status, note, and creation date
3. WHILE THE rates are being fetched, THE Rate_Page SHALL display the PageSkeleton component
4. IF THE API request fails, THEN THE Error_Handler SHALL display an error toast with the failure message

### Requirement 3: Fetch and Display Customer Types

**User Story:** As an admin, I want to view available customer types, so that I can assign rates to the correct customer classifications.

#### Acceptance Criteria

1. WHEN THE Rate_Page loads, THE Rate_Page SHALL fetch customer types from GET /api/customer-types
2. WHEN THE API returns customer type data, THE Rate_Page SHALL populate the customer type dropdown in add and edit forms
3. WHEN THE API returns customer type data, THE Rate_Page SHALL display customer type names and colors in the rate list
4. IF THE API request fails, THEN THE Error_Handler SHALL display an error toast with the failure message

### Requirement 4: Create New Pay-as-you-go Rate

**User Story:** As an admin, I want to create new pay-as-you-go rates via the API, so that I can configure pricing for different customer types.

#### Acceptance Criteria

1. WHEN THE user clicks "Add Rate" and fills the form, THE Rate_Page SHALL validate that customer type, pickup rate, and effective date are provided
2. WHEN THE user submits a valid add rate form, THE Rate_Page SHALL send a POST request to /api/rates/admin/payg with customerTypeId, pickupRate, effectiveDate, note, and isActive
3. WHEN THE API successfully creates the rate, THE Rate_Page SHALL display a success toast, close the modal, and refresh the rate list and statistics
4. WHILE THE create request is in progress, THE Rate_Page SHALL disable the submit button and show a loading indicator
5. IF THE API returns a 400 error indicating validation failure, THEN THE Rate_Page SHALL display the error message in the modal
6. IF THE API request fails with other errors, THEN THE Error_Handler SHALL display an error toast with the failure message

### Requirement 5: Update Existing Pay-as-you-go Rate

**User Story:** As an admin, I want to update pay-as-you-go rate details via the API, so that I can modify rate configurations.

#### Acceptance Criteria

1. WHEN THE user clicks "Edit" on a rate and modifies the form, THE Rate_Page SHALL validate that pickup rate and effective date are provided
2. WHEN THE user submits a valid edit rate form, THE Rate_Page SHALL send a PATCH request to /api/rates/admin/payg/{id} with the modified fields
3. WHEN THE API successfully updates the rate, THE Rate_Page SHALL display a success toast, close the modal, and refresh the rate list
4. WHILE THE update request is in progress, THE Rate_Page SHALL disable the submit button and show a loading indicator
5. IF THE API returns a 400 error indicating validation failure, THEN THE Rate_Page SHALL display the error message in the modal
6. IF THE API request fails with other errors, THEN THE Error_Handler SHALL display an error toast with the failure message

### Requirement 6: Delete Pay-as-you-go Rate

**User Story:** As an admin, I want to delete pay-as-you-go rates via the API, so that I can remove rates that are no longer needed.

#### Acceptance Criteria

1. WHEN THE user clicks "Delete" on a rate, THE Rate_Page SHALL display a confirmation modal
2. WHEN THE user confirms deletion, THE Rate_Page SHALL send a DELETE request to /api/rates/admin/payg/{id}
3. WHEN THE API successfully deletes the rate, THE Rate_Page SHALL display a success toast, close the modal, and refresh the rate list and statistics
4. WHILE THE delete request is in progress, THE Rate_Page SHALL disable the delete button and show a loading indicator
5. IF THE API request fails, THEN THE Error_Handler SHALL display an error toast with the failure message

### Requirement 7: Filter Rates by Customer Type

**User Story:** As an admin, I want to filter rates by customer type, so that I can view rates for specific customer classifications.

#### Acceptance Criteria

1. WHEN THE user selects a customer type from the filter dropdown, THE Rate_Page SHALL display only rates matching the selected customer type
2. WHEN THE user selects "All Customer Types", THE Rate_Page SHALL display all rates
3. THE Rate_Page SHALL display the count of filtered results

### Requirement 8: Filter Rates by Status

**User Story:** As an admin, I want to filter rates by status, so that I can view active, upcoming, or inactive rates.

#### Acceptance Criteria

1. WHEN THE user selects a status from the filter dropdown, THE Rate_Page SHALL display only rates matching the selected status
2. WHEN THE user selects "All Status", THE Rate_Page SHALL display all rates
3. THE Rate_Page SHALL compute rate status as "active" when isActive is true and effectiveDate is today or earlier
4. THE Rate_Page SHALL compute rate status as "upcoming" when isActive is true and effectiveDate is in the future
5. THE Rate_Page SHALL compute rate status as "inactive" when isActive is false
6. THE Rate_Page SHALL display the count of filtered results

### Requirement 9: Handle Loading States

**User Story:** As an admin, I want to see loading indicators during API operations, so that I know the system is processing my request.

#### Acceptance Criteria

1. WHILE THE initial page load is fetching data, THE Rate_Page SHALL display the PageSkeleton component
2. WHILE THE statistics are being fetched, THE Rate_Page SHALL display loading placeholders for stat cards
3. WHILE A create, update, or delete operation is in progress, THE Rate_Page SHALL disable the relevant action button
4. WHILE A modal form is being submitted, THE Rate_Page SHALL disable the submit button and show a loading indicator
5. WHEN ANY API operation completes, THE Rate_Page SHALL remove all loading indicators and re-enable buttons

### Requirement 10: Handle API Errors

**User Story:** As an admin, I want to see clear error messages when API operations fail, so that I can understand what went wrong.

#### Acceptance Criteria

1. WHEN ANY API request fails with a network error, THE Error_Handler SHALL display an error toast with the error message
2. WHEN THE API returns a 401 unauthorized error, THE API_Client SHALL redirect to the login page and display a session expired message
3. WHEN THE API returns a 400 validation error, THE Rate_Page SHALL display the error message in the relevant modal or as a toast
4. WHEN THE API returns a 403 forbidden error, THE Error_Handler SHALL display an error toast indicating insufficient permissions
5. WHEN THE API returns a 404 not found error, THE Error_Handler SHALL display an error toast indicating the resource was not found
6. WHEN THE API returns a 500 server error, THE Error_Handler SHALL display an error toast indicating a server error occurred

### Requirement 11: Maintain Data Consistency

**User Story:** As an admin, I want the UI to reflect the latest data after operations, so that I always see accurate information.

#### Acceptance Criteria

1. WHEN A create operation succeeds, THE Rate_Page SHALL refresh both the rate list and statistics
2. WHEN AN update operation succeeds, THE Rate_Page SHALL refresh the rate list to show the updated data
3. WHEN A delete operation succeeds, THE Rate_Page SHALL refresh both the rate list and statistics

### Requirement 12: Validate Form Inputs

**User Story:** As an admin, I want form validation before API submission, so that I don't send invalid data to the server.

#### Acceptance Criteria

1. WHEN THE user attempts to submit an add form, THE Rate_Page SHALL validate that customer type is selected
2. WHEN THE user attempts to submit an add or edit form, THE Rate_Page SHALL validate that pickup rate is a positive number
3. WHEN THE user attempts to submit an add or edit form, THE Rate_Page SHALL validate that effective date is provided
4. IF ANY validation fails, THEN THE Rate_Page SHALL display an error message in the modal and prevent form submission
5. WHEN ALL validations pass, THE Rate_Page SHALL proceed with the API request
