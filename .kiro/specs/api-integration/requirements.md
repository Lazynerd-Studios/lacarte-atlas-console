# Requirements Document

## Introduction

This feature replaces all hardcoded mock data in the LaCarte Waste Management admin dashboard with real API calls. It covers authentication via Better Auth and seven business API endpoints: customer listing, truck creation/listing/detail, and driver creation/listing/detail. It also introduces an auth middleware to protect all dashboard routes and ensures all form field names match the API schema exactly.

## Glossary

- **Dashboard**: The Nuxt 3 admin application at the root of this repository.
- **Better_Auth**: The authentication service at `https://lacarte.lazynerdstudios.com/api/auth` — same base as the Business_API.
- **Business_API**: The LaCarte backend service at `https://lacarte.lazynerdstudios.com/api`, configured via `NUXT_PUBLIC_API_BASE`.
- **Auth_Store**: The Pinia store (`app/stores/auth.ts`) that holds the authenticated user object and Bearer token.
- **useApi**: The composable (`app/composables/useApi.ts`) that prepends the Business_API base URL and attaches the Bearer token to every request.
- **Auth_Middleware**: The Nuxt route middleware (`app/middleware/auth.ts`) that guards all dashboard routes.
- **Pagination**: The server-side pagination object returned by list endpoints: `{ page, limit, total, totalPages, hasNextPage, hasPreviousPage }`.
- **UUID**: A universally unique identifier string used as the primary key for trucks and drivers in the Business_API.
- **Customer**: A business entity with fields `id`, `userId`, `phoneNumber`, `noBins`, `status`, `address`, `city`, `user`, `customerType`, `zone`.
- **Truck**: A fleet vehicle with fields `id` (UUID), `truckId` (display ID, pattern `T-\d{3,}`), `plateNumber` (pattern `LCT-\d{4,}`), `vinNumber` (17 chars), `make`, `model`, `year`, `capacity`, `status`, `assignedDriver`, GPS fields, service dates.
- **Driver**: A person with fields `id` (UUID), `user`, `phoneNumber`, `licenseNumber`, `licenseExpiry`, `zone`, `status`, `assignedTruck`, `totalTrips`.

---

## Requirements

### Requirement 1: Authentication — Sign In

**User Story:** As an admin, I want to sign in with my email and password, so that I can access the dashboard securely.

#### Acceptance Criteria

1. WHEN the sign-in form is submitted with a valid email and password, THE Dashboard SHALL call `useApi().request('/auth/sign-in/email', { method: 'POST', ... })` with body `{ email, password, rememberMe }`.
2. WHEN the API returns a successful response containing `token` and `user`, THE Auth_Store SHALL store the user object and token via `setAuth(user, token)`.
3. WHEN authentication succeeds, THE Dashboard SHALL redirect the user to `/`.
4. IF the API returns a non-2xx response, THEN THE Dashboard SHALL display a descriptive error message on the login page without redirecting.
5. THE Dashboard SHALL use `useApi` for the sign-in request, as both auth and business endpoints share the same base URL (`https://lacarte.lazynerdstudios.com/api`).

### Requirement 2: Auth Middleware

**User Story:** As a system operator, I want unauthenticated users to be redirected to the login page, so that dashboard data is protected.

#### Acceptance Criteria

1. THE Auth_Middleware SHALL run on every route except `/login` and `/forgot-password`.
2. WHEN a user navigates to any protected route and `Auth_Store.isAuthenticated` is `false`, THE Auth_Middleware SHALL redirect the user to `/login`.
3. WHILE `Auth_Store.isAuthenticated` is `true`, THE Auth_Middleware SHALL allow navigation to proceed.
4. WHEN `useApi` receives a `401` response from the Business_API, THE Dashboard SHALL call `Auth_Store.logout()` and redirect the user to `/login`.

### Requirement 3: List Customers

**User Story:** As an admin, I want to view a paginated, filterable list of customers from the API, so that I can manage customer accounts.

#### Acceptance Criteria

1. WHEN the customers page mounts, THE Dashboard SHALL call `GET /api/customer/admin/list` on the Business_API.
2. THE Dashboard SHALL support the query parameters `page`, `limit`, `search`, `status`, and `customerTypeId` when calling the customer list endpoint.
3. WHEN the API returns a response, THE Dashboard SHALL render the `data` array and derive pagination state from the `pagination` object in the response.
4. WHEN the user changes the search input, status filter, or plan filter, THE Dashboard SHALL reset `page` to `1` and re-fetch the customer list with the updated query parameters.
5. WHEN the user navigates to a different page via the pagination component, THE Dashboard SHALL re-fetch the customer list with the updated `page` query parameter.
6. IF the Business_API returns an error, THEN THE Dashboard SHALL display an error message and render an empty customer list.

### Requirement 4: Create Truck

**User Story:** As an admin, I want to add a new truck via a form, so that the fleet is kept up to date.

#### Acceptance Criteria

1. WHEN the Add Truck form is submitted, THE Dashboard SHALL send a `POST` request to `/api/trucks/admin/` on the Business_API with the body fields `truckId`, `plateNumber`, `vinNumber`, `make`, `model`, `year`, `capacity`, and optionally `status`, `gpsDeviceId`, `registrationExpiry`, `notes`.
2. THE Dashboard SHALL use the field name `plateNumber` (not `plate`) in the request body.
3. THE Dashboard SHALL use the field name `vinNumber` (not `vin`) in the request body.
4. WHEN the Business_API returns a `201` response, THE Dashboard SHALL close the Add Truck modal and re-fetch the truck list.
5. IF the Business_API returns a validation error, THEN THE Dashboard SHALL display the error message inside the Add Truck modal without closing it.

### Requirement 5: List Trucks

**User Story:** As an admin, I want to view a list of trucks from the API, so that I can manage the fleet.

#### Acceptance Criteria

1. WHEN the trucks page mounts, THE Dashboard SHALL call `GET /api/trucks/admin/` on the Business_API.
2. WHEN the API returns a response, THE Dashboard SHALL render the truck list using the `data` array from the response.
3. WHEN a new truck is successfully created, THE Dashboard SHALL re-fetch the truck list to reflect the new entry.
4. THE Dashboard SHALL link each truck's "View Details" action to `/trucks/{uuid}` where `{uuid}` is the truck's `id` field (UUID), not the display `truckId`.

### Requirement 6: Get Truck Details

**User Story:** As an admin, I want to view the full details of a specific truck, so that I can inspect its status and history.

#### Acceptance Criteria

1. WHEN the truck detail page mounts, THE Dashboard SHALL call `GET /api/trucks/admin/{id}` on the Business_API, where `{id}` is the UUID from the route parameter.
2. WHEN the API returns a truck object, THE Dashboard SHALL render all available fields including `truckId`, `plateNumber`, `vinNumber`, `make`, `model`, `year`, `capacity`, `status`, `assignedDriver`, and GPS/service date fields.
3. IF the Business_API returns a `404` response, THEN THE Dashboard SHALL display a "Truck not found" message.

### Requirement 7: Create Driver

**User Story:** As an admin, I want to add a new driver via a form, so that the driver roster is kept up to date.

#### Acceptance Criteria

1. WHEN the Add Driver form is submitted, THE Dashboard SHALL send a `POST` request to `/api/drivers/admin/` on the Business_API with the body fields `email`, `name`, `phoneNumber`, `licenseNumber`, `licenseExpiry`, and optionally `zoneId`, `status`.
2. THE Dashboard SHALL combine `firstName` and `lastName` form inputs into a single `name` field before sending the request.
3. THE Dashboard SHALL use the field name `phoneNumber` (not `phone`) in the request body.
4. THE Dashboard SHALL populate the zone dropdown by calling `GET /api/zone/public/list` on the Business_API, which requires no authentication and returns `[{ id, name, color }]`.
5. THE Dashboard SHALL populate the truck dropdown from `GET /api/trucks/admin/` rather than mock data.
6. WHEN the Business_API returns a `201` response, THE Dashboard SHALL close the Add Driver modal and re-fetch the driver list.
7. IF the Business_API returns a validation error, THEN THE Dashboard SHALL display the error message inside the Add Driver modal without closing it.

### Requirement 8: List Drivers

**User Story:** As an admin, I want to view a paginated, filterable list of drivers from the API, so that I can manage the driver roster.

#### Acceptance Criteria

1. WHEN the drivers page mounts, THE Dashboard SHALL call `GET /api/drivers/admin/` on the Business_API.
2. THE Dashboard SHALL support the query parameters `page`, `limit`, `status`, `zoneId`, and `search` when calling the driver list endpoint.
3. WHEN the API returns a response, THE Dashboard SHALL render the `data` array and derive pagination state from the `pagination` object.
4. WHEN a new driver is successfully created, THE Dashboard SHALL re-fetch the driver list to reflect the new entry.
5. THE Dashboard SHALL link each driver's "View Details" action to `/drivers/{uuid}` where `{uuid}` is the driver's `id` field (UUID), not a name slug.

### Requirement 9: Get Driver Details

**User Story:** As an admin, I want to view the full details of a specific driver, so that I can inspect their assignments and history.

#### Acceptance Criteria

1. WHEN the driver detail page mounts, THE Dashboard SHALL call `GET /api/drivers/admin/{id}` on the Business_API, where `{id}` is the UUID from the route parameter.
2. WHEN the API returns a driver object, THE Dashboard SHALL render all available fields including `user.name`, `user.email`, `phoneNumber`, `licenseNumber`, `licenseExpiry`, `zone`, `status`, `assignedTruck`, and `totalTrips`.
3. IF the Business_API returns a `404` response, THEN THE Dashboard SHALL display a "Driver not found" message.

### Requirement 10: Bearer Token on All Business API Requests

**User Story:** As a system operator, I want every Business API request to include the auth token, so that the API can verify the caller's identity.

#### Acceptance Criteria

1. WHILE `Auth_Store.token` is non-null, THE useApi composable SHALL attach an `Authorization: Bearer {token}` header to every outgoing request.
2. WHEN `Auth_Store.token` is null, THE useApi composable SHALL send requests without an `Authorization` header.
3. WHEN the Business_API returns a `401` response on any request, THE Dashboard SHALL call `Auth_Store.logout()` and redirect to `/login`.
