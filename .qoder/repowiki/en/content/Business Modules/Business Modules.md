# Business Modules

<cite>
**Referenced Files in This Document**
- [README.md](file://README.md)
- [package.json](file://package.json)
- [nuxt.config.ts](file://nuxt.config.ts)
- [app.vue](file://app/app.vue)
- [useApi.ts](file://app/composables/useApi.ts)
- [usePermissions.ts](file://app/composables/usePermissions.ts)
- [customer.ts](file://app/types/customer.ts)
- [driver.ts](file://app/types/driver.ts)
- [support.ts](file://app/types/support.ts)
- [team.ts](file://app/types/team.ts)
- [auth.ts](file://app/stores/auth.ts)
- [AppPagination.vue](file://app/components/AppPagination.vue)
- [customers/index.vue](file://app/pages/customers/index.vue)
- [drivers/index.vue](file://app/pages/drivers/index.vue)
- [trucks/index.vue](file://app/pages/trucks/index.vue)
- [pickups/index.vue](file://app/pages/pickups/index.vue)
- [billing/index.vue](file://app/pages/billing/index.vue)
- [management/rates.vue](file://app/pages/management/rates.vue)
- [management/subscriptions.vue](file://app/pages/management/subscriptions.vue)
- [team/index.vue](file://app/pages/team/index.vue)
- [support/index.vue](file://app/pages/support/index.vue)
- [settings/index.vue](file://app/pages/settings/index.vue)
</cite>

## Update Summary
**Changes Made**
- Enhanced Security tab with password visibility toggles, improved client-side validation, real-time error feedback, and proper API integration
- Added comprehensive Activity Logs tab with debounced search (500ms), advanced filtering by action type/module/entity type, pagination support, contextual icons, and detailed log information including timestamps and IP addresses
- Updated password change workflow with loading states, token management, and success notifications
- Enhanced settings interface architecture with modular tab-based design

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This document provides comprehensive documentation for the business modules in the Lacarte Atlas Console, covering customer management, fleet management (drivers and trucks), pickup operations, billing and subscriptions, team administration, support systems, and system settings. It explains user stories, feature descriptions, data models, CRUD operations, workflows, and integration patterns between modules. The console is a Nuxt 3 application that communicates with a backend API via a centralized HTTP client and uses role-based permissions to control access.

## Project Structure
The application follows a page-driven structure under app/pages, with shared composables, types, components, and middleware. Key configuration includes runtime API base URL and module setup.

```mermaid
graph TB
A["Nuxt App<br/>app.vue"] --> B["Layouts<br/>dashboard.vue / default.vue"]
A --> C["Pages<br/>customers, drivers, trucks, pickups,<br/>billing, management, team, support, settings"]
C --> D["Composables<br/>useApi, usePermissions, useCurrency"]
C --> E["Types<br/>customer.ts, driver.ts, support.ts, team.ts"]
C --> F["Components<br/>modals, tables, pagination"]
G["Config<br/>nuxt.config.ts"] --> A
H["Dependencies<br/>package.json"] --> A
```

**Diagram sources**
- [app.vue:1-33](file://app/app.vue#L1-L33)
- [nuxt.config.ts:1-46](file://nuxt.config.ts#L1-L46)
- [package.json:1-33](file://package.json#L1-L33)

**Section sources**
- [README.md:1-76](file://README.md#L1-L76)
- [package.json:1-33](file://package.json#L1-L33)
- [nuxt.config.ts:1-46](file://nuxt.config.ts#L1-L46)
- [app.vue:1-33](file://app/app.vue#L1-L33)

## Core Components
- Centralized API client: useApi composable handles authentication headers, error handling, redirects on 401, and typed wrappers for GET/POST/PATCH/DELETE.
- Permission utilities: usePermissions composable exposes helpers for permission and role checks used across admin pages.
- Shared UI: modals, pagination, toasts, and skeletons are reused across pages.

Key responsibilities:
- Authentication and session handling integrated into the root layout and auth store.
- Consistent error handling and toast notifications via useErrorHandler.
- Runtime configuration for API base URL and third-party keys.

**Section sources**
- [useApi.ts:1-91](file://app/composables/useApi.ts#L1-L91)
- [usePermissions.ts:1-43](file://app/composables/usePermissions.ts#L1-L43)
- [app.vue:1-33](file://app/app.vue#L1-L33)

## Architecture Overview
The console is a client-side SPA built with Nuxt 3. Pages call the backend through useApi, which injects Authorization tokens and centralizes error handling. Admin features enforce permissions using usePermissions. Data models are defined in TypeScript files under app/types.

```mermaid
sequenceDiagram
participant User as "Admin User"
participant Page as "Page Component"
participant API as "useApi"
participant Backend as "Backend API"
participant Perm as "usePermissions"
User->>Page : Open Admin Feature
Page->>Perm : Check Role/Permission
alt Authorized
Page->>API : GET/POST/PATCH/DELETE
API->>Backend : HTTP Request (Bearer token)
Backend-->>API : Response
API-->>Page : Data or Error
Page-->>User : Render UI / Show Toast
else Unauthorized
Page-->>User : Redirect to Login
end
```

**Diagram sources**
- [useApi.ts:1-91](file://app/composables/useApi.ts#L1-L91)
- [usePermissions.ts:1-43](file://app/composables/usePermissions.ts#L1-L43)

## Detailed Component Analysis

### Customer Management
Purpose:
- Admin users can list, search, filter, suspend/unsuspend customers, and export customer data to Excel.

User stories:
- As an admin, I want to view all customers with filters by status and plan type so I can manage accounts efficiently.
- As an admin, I want to suspend or unsuspend a customer account with a reason so I can enforce compliance.
- As an admin, I want to export the current filtered list to Excel for reporting.

CRUD and workflows:
- List customers with pagination and filters (search, status, plan).
- Suspend/Unsuspend via PATCH endpoints; local state updates reflect immediately.
- Export to Excel using xlsx library.

Data model highlights:
- Customer entity includes user details, phone number, address, customer type, zone, location, and timestamps.

Integration points:
- Uses useApi for requests and useAppToast for feedback.
- Integrates with billing and pickup modules via customer identifiers.

```mermaid
flowchart TD
Start(["Open Customers Page"]) --> Fetch["Fetch customers with filters"]
Fetch --> Display["Render table with badges"]
Display --> Action{"Action?"}
Action --> |Suspend| Confirm["Show Suspend Modal"]
Confirm --> PatchSuspend["PATCH /customer/admin/{id}/suspend"]
PatchSuspend --> UpdateLocal["Update local status"]
Action --> |Unsuspend| ConfirmUn["Confirm Unsuspend"]
ConfirmUn --> PatchUn["PATCH /customer/admin/{id}/unsuspend"]
PatchUn --> UpdateLocal
Action --> |Export| Export["Generate Excel file"]
UpdateLocal --> End(["Done"])
Export --> End
```

**Diagram sources**
- [customers/index.vue:1-352](file://app/pages/customers/index.vue#L1-L352)

**Section sources**
- [customers/index.vue:1-352](file://app/pages/customers/index.vue#L1-L352)
- [customer.ts:1-103](file://app/types/customer.ts#L1-L103)

### Fleet Management: Drivers
Purpose:
- Admin users can add drivers, view their assignments, earnings, and trip stats.

User stories:
- As an admin, I want to add a new driver and assign them to a zone and truck so they can start operations.
- As an admin, I want to see each driver's assigned truck, zone, and performance metrics.

CRUD and workflows:
- Add Driver via POST /drivers/admin/.
- List drivers via GET /drivers/admin/.
- View details per driver via route /drivers/[id].

Data model highlights:
- Driver includes contact info, license details, zone assignment, status, assigned truck, and earnings/incomplete tasks.

Integration points:
- Links to trucks via assignedTruck.
- Used by pickup assignment logic to allocate work.

```mermaid
classDiagram
class Driver {
+string id
+string name
+string email
+string phoneNumber
+Zone zone
+AssignedTruck assignedTruck
+string status
+number totalTrips
+number earnings
+number incomplete
}
class Zone {
+string id
+string name
+string color
}
class AssignedTruck {
+string truckId
+string plateNumber
}
Driver --> Zone : "assigned to"
Driver --> AssignedTruck : "drives"
```

**Diagram sources**
- [driver.ts:1-106](file://app/types/driver.ts#L1-L106)

**Section sources**
- [drivers/index.vue:1-149](file://app/pages/drivers/index.vue#L1-L149)
- [driver.ts:1-106](file://app/types/driver.ts#L1-L106)

### Fleet Management: Trucks
Purpose:
- Admin users can add, view, and delete trucks, and see last GPS update and assigned driver.

User stories:
- As an admin, I want to register a new truck with capacity and registration details.
- As an admin, I want to delete a truck after confirming the action.

CRUD and workflows:
- Add Truck via POST /trucks/admin/.
- List trucks via GET /trucks/admin/.
- Delete Truck via DELETE /trucks/admin/{id}.

Data model highlights:
- Truck includes truckId, plateNumber, capacity, status, assignedDriver, gpsDeviceId, and registration expiry.

Integration points:
- Drivers reference assignedTruck; trucks show assignedDriver.

```mermaid
sequenceDiagram
participant Admin as "Admin"
participant TrucksPage as "Trucks Page"
participant API as "useApi"
participant Backend as "Backend API"
Admin->>TrucksPage : Click "Add Truck"
TrucksPage->>API : POST /trucks/admin/
API->>Backend : Create Truck
Backend-->>API : Success
API-->>TrucksPage : Refresh list
Admin->>TrucksPage : Click "Delete"
TrucksPage->>API : DELETE /trucks/admin/{id}
API->>Backend : Remove Truck
Backend-->>API : Success
API-->>TrucksPage : Refresh list
```

**Diagram sources**
- [trucks/index.vue:1-205](file://app/pages/trucks/index.vue#L1-L205)
- [useApi.ts:1-91](file://app/composables/useApi.ts#L1-L91)

**Section sources**
- [trucks/index.vue:1-205](file://app/pages/trucks/index.vue#L1-L205)
- [driver.ts:1-106](file://app/types/driver.ts#L1-L106)

### Pickup Operations
Purpose:
- Admin users can create pickup requests, assign/reassign drivers, and track statuses and payment states.

User stories:
- As an admin, I want to create a pickup request for a customer with preferred date and quantity tier.
- As an admin, I want to assign or reassign a driver with time slot and priority, then track progress.

CRUD and workflows:
- Create Pickup via modal submission.
- Assign/Reassign via POST /pickup-requests/admin/{id}/assign or PATCH /pickup-requests/admin/{id}/reassign.
- List with filters (status, paymentStatus) and pagination.
- Stats dashboard via GET /pickup-requests/admin/stats.

Data model highlights:
- PickupRequest includes customer, disposable item type, estimated quantity, payment type/status, and timestamps.

Integration points:
- References customer and driver entities; integrates with billing (payment status) and fleet (driver assignment).

```mermaid
sequenceDiagram
participant Admin as "Admin"
participant PickupsPage as "Pickups Page"
participant API as "useApi"
participant Backend as "Backend API"
Admin->>PickupsPage : Open "Assign Driver"
PickupsPage->>PickupsPage : Validate inputs (date/timeSlot/priority)
alt First Assignment
PickupsPage->>API : POST /pickup-requests/admin/{id}/assign
else Reassignment
PickupsPage->>API : PATCH /pickup-requests/admin/{id}/reassign
end
API->>Backend : Submit assignment
Backend-->>API : Success
API-->>PickupsPage : Refresh list & stats
```

**Diagram sources**
- [pickups/index.vue:1-567](file://app/pages/pickups/index.vue#L1-L567)
- [useApi.ts:1-91](file://app/composables/useApi.ts#L1-L91)

**Section sources**
- [pickups/index.vue:1-567](file://app/pages/pickups/index.vue#L1-L567)
- [customer.ts:1-103](file://app/types/customer.ts#L1-L103)

### Billing and Subscriptions
Purpose:
- Admin users can manage pay-as-you-go rates and subscription plans, view invoices, and handle pending bank transfers.

User stories:
- As an admin, I want to set pay-as-you-go rates per customer type and quantity tier.
- As an admin, I want to create, edit, toggle, and delete subscription plans (prepaid/postpaid).
- As an admin, I want to review and approve/decline pending bank transfers and view recent invoices.

CRUD and workflows:
- Rates:
  - Create via POST /rates/admin.
  - Read via GET /rates/admin and stats via GET /rates/admin/stats.
  - Edit via PATCH /rates/admin/{id}.
  - Delete via DELETE /rates/admin/{id}.
- Subscriptions:
  - Plans: GET /subscription/admin/plans?type=prepaid|postpaid; POST /subscription/admin/plans; PATCH /subscription/admin/plans/{id}; DELETE /subscription/admin/plans/{id}; Toggle via PATCH /subscription/admin/plans/{id}/toggle.
  - Stats: GET /subscription/admin/stats?type=prepaid|postpaid.
- Billing overview:
  - Pending transfers and invoices displayed with search and pagination.

Data model highlights:
- Rate includes customerTypeId, estimatedQuantityId, rate value, effectiveDate, note, isActive.
- Plan includes billingType, billingCycle, pickupCount, binCount, price, badgeColor, isActive.

Integration points:
- Rates influence pay-as-you-go pricing for pickups.
- Subscription plans affect customer billing cycles and eligibility.

```mermaid
flowchart TD
RatesStart(["Rate Management"]) --> FetchRates["GET /rates/admin"]
FetchRates --> Filters["Filter by Type/Status"]
Filters --> Actions{"Actions"}
Actions --> |Create| PostRate["POST /rates/admin"]
Actions --> |Edit| PatchRate["PATCH /rates/admin/{id}"]
Actions --> |Delete| DelRate["DELETE /rates/admin/{id}"]
SubStart(["Subscription Plans"]) --> FetchPlans["GET /subscription/admin/plans?type={type}"]
FetchPlans --> Tabs["Prepaid / Postpaid"]
Tabs --> PlanActions{"Actions"}
PlanActions --> |Create| PostPlan["POST /subscription/admin/plans"]
PlanActions --> |Edit| PatchPlan["PATCH /subscription/admin/plans/{id}"]
PlanActions --> |Toggle| TogglePlan["PATCH /subscription/admin/plans/{id}/toggle"]
PlanActions --> |Delete| DelPlan["DELETE /subscription/admin/plans/{id}"]
```

**Diagram sources**
- [management/rates.vue:1-800](file://app/pages/management/rates.vue#L1-L800)
- [management/subscriptions.vue:1-800](file://app/pages/management/subscriptions.vue#L1-L800)

**Section sources**
- [management/rates.vue:1-800](file://app/pages/management/rates.vue#L1-L800)
- [management/subscriptions.vue:1-800](file://app/pages/management/subscriptions.vue#L1-L800)
- [billing/index.vue:1-430](file://app/pages/billing/index.vue#L1-L430)

### Team Administration
Purpose:
- Admin users can manage team members and roles, including creating roles and deleting members.

User stories:
- As an admin, I want to create roles with permissions so I can assign appropriate access levels.
- As an admin, I want to add/remove team members and view their roles and last login.

CRUD and workflows:
- Roles: Create via POST /team/roles.
- Members: List via GET /team/, delete via DELETE /team/{id}.
- Stats: GET /team/stats.

Authorization:
- Checks performed before sensitive actions (create roles, delete members).

Data model highlights:
- TeamMember includes firstName, lastName, email, phone, role, roleDetails, status, permissions, lastLogin.
- Role includes name, displayName, description, permissions, color, isSystem.

```mermaid
sequenceDiagram
participant Admin as "Admin"
participant TeamPage as "Team Page"
participant API as "useApi"
participant Perm as "usePermissions"
participant Backend as "Backend API"
Admin->>TeamPage : Open "Add Role"
TeamPage->>Perm : hasPermission('team.manage')?
alt Authorized
TeamPage->>API : POST /team/roles
API->>Backend : Create Role
Backend-->>API : Success
API-->>TeamPage : Close modal + Toast
else Unauthorized
TeamPage-->>Admin : Show error toast
end
```

**Diagram sources**
- [team/index.vue:1-605](file://app/pages/team/index.vue#L1-L605)
- [usePermissions.ts:1-43](file://app/composables/usePermissions.ts#L1-L43)
- [useApi.ts:1-91](file://app/composables/useApi.ts#L1-L91)

**Section sources**
- [team/index.vue:1-605](file://app/pages/team/index.vue#L1-L605)
- [team.ts:1-65](file://app/types/team.ts#L1-L65)

### Support Systems
Purpose:
- Admin users can view, filter, and manage support tickets, including status transitions and viewing details.

User stories:
- As a support agent, I want to filter tickets by status, priority, category, and search terms.
- As a support agent, I want to open ticket details and update status to resolve issues faster.

CRUD and workflows:
- List tickets with pagination and filters via GET /support/admin/tickets.
- Stats via GET /support/admin/tickets/stats.
- Open detail modal and update status locally (future integration may persist changes).

Data model highlights:
- SupportTicket includes subject, category, priority, status, customer info, and timestamps.
- TicketStats includes openTickets, inProgressTickets, resolvedToday, avgResponseHours.

```mermaid
flowchart TD
Start(["Support Tickets"]) --> FetchStats["GET /support/admin/tickets/stats"]
FetchStats --> FetchList["GET /support/admin/tickets?filters"]
FetchList --> FilterUI["Search + Status/Priority/Category"]
FilterUI --> Table["Paginated Table"]
Table --> Detail["Open Ticket Details"]
Detail --> Update["Update Status (local)"]
Update --> End(["Done"])
```

**Diagram sources**
- [support/index.vue:1-422](file://app/pages/support/index.vue#L1-L422)

**Section sources**
- [support/index.vue:1-422](file://app/pages/support/index.vue#L1-L422)
- [support.ts:1-81](file://app/types/support.ts#L1-L81)

### System Settings
Purpose:
- Admin users can manage system preferences, security settings, and monitor activity logs. The settings interface has been significantly enhanced with a modular tab-based architecture focused on security and activity monitoring.

User stories:
- As an admin, I want to change my password securely with validation, confirmation, and visibility toggles.
- As an admin, I want to monitor system activity logs with advanced filtering, search capabilities, and pagination.
- As an admin, I want to configure general company settings and notification preferences when available.

**Enhanced** The settings interface has undergone major improvements with enhanced security features and comprehensive activity logging capabilities.

#### Security Tab (Default)
- **Password Change Workflow**: 
  - Real-time form validation with immediate error feedback
  - Password visibility toggles for all input fields
  - Loading states during password updates
  - Token management for seamless session continuity
  - Success notifications via toast messages
- **Two-Factor Authentication**: Preserved for future implementation

#### Activity Logs Tab
- **Advanced Search and Filtering**:
  - Debounced search functionality (500ms delay) for optimal performance
  - Module-specific filtering (auth, customer, driver, pickup, billing, inventory, team)
  - Entity type filtering (customer, driver, pickup, truck, rate, zone, admin)
  - Action type filtering for specific operations
- **Rich Log Information**:
  - Contextual icons based on action types (create, update, delete, login, etc.)
  - Color-coded action indicators for quick visual scanning
  - Timestamp formatting with localized display
  - IP address tracking for security auditing
  - Detailed descriptions and metadata
- **Pagination Support**: Server-side pagination for large datasets with efficient navigation

#### General and Notifications Tabs (Disabled)
- Company information and regional settings preserved for future implementation
- Email and SMS notification preferences maintained for future expansion

Data model highlights:
- **Security Settings**: Comprehensive password management with validation rules and error handling
- **ActivityLog Interface**: Complete audit trail tracking actor information, actions, modules, entities, and metadata
- **ActivityLogsPagination**: Server-side pagination management with search and filter parameters

Integration points:
- Uses useApi for secure activity log retrieval from `/activity-logs/me` endpoint
- Integrates with system-wide activity tracking across all modules
- Leverages useAuthStore for token management during password changes
- Utilizes AppPagination component for consistent pagination UX

```mermaid
flowchart TD
SettingsStart(["Settings Interface"]) --> DefaultView["Security Tab (Default)"]
DefaultView --> PasswordForm["Password Change Form"]
PasswordForm --> Validation["Real-time Validation"]
Validation --> VisibilityToggles["Password Visibility Controls"]
VisibilityToggles --> APIIntegration["API Integration"]
APIIntegration --> TokenManagement["Token Management"]
TokenManagement --> SuccessNotification["Success Toast"]
SettingsStart --> ActivityTab["Activity Logs Tab"]
ActivityTab --> AdvancedSearch["Debounced Search (500ms)"]
AdvancedSearch --> MultiFilter["Module & Entity Filters"]
MultiFilter --> RichDisplay["Contextual Icons & Colors"]
RichDisplay --> Pagination["Server-side Pagination"]
SettingsStart --> DisabledTabs["Disabled Tabs (Future Use)"]
DisabledTabs --> GeneralTab["General Settings (Preserved)"]
DisabledTabs --> NotificationTab["Notification Preferences (Preserved)"]
```

**Diagram sources**
- [settings/index.vue:1-641](file://app/pages/settings/index.vue#L1-641)
- [AppPagination.vue:1-48](file://app/components/AppPagination.vue#L1-48)
- [auth.ts:1-230](file://app/stores/auth.ts#L1-230)

**Section sources**
- [settings/index.vue:1-641](file://app/pages/settings/index.vue#L1-641)
- [AppPagination.vue:1-48](file://app/components/AppPagination.vue#L1-48)
- [auth.ts:1-230](file://app/stores/auth.ts#L1-230)

## Dependency Analysis
Module interactions:
- Customers link to zones and customer types; pickups reference customers and drivers; billing references customers and plans; team manages roles and permissions affecting access to these modules.
- Fleet management (drivers/trucks) supports pickup assignment and tracking.
- Settings module provides system-wide configuration and monitoring capabilities that impact all other modules.
- **Enhanced Integration**: Activity logs provide cross-module audit trails, while security features ensure consistent authentication across all modules.

```mermaid
graph TB
Customers["Customers"] --> Pickups["Pickup Requests"]
Drivers["Drivers"] --> Pickups
Trucks["Trucks"] --> Drivers
Billing["Billing & Invoices"] --> Customers
Subscriptions["Subscription Plans"] --> Customers
Rates["Pay-as-you-go Rates"] --> Pickups
Team["Team & Roles"] --> All["All Admin Pages"]
Support["Support Tickets"] --> Customers
Settings["System Settings"] --> All
ActivityLogs["Activity Logs"] --> All
Security["Security Features"] --> All
```

[No sources needed since this diagram shows conceptual relationships]

## Performance Considerations
- Use pagination and server-side filtering where available to reduce payload sizes.
- Debounce search inputs if client-side filtering becomes heavy.
- Lazy-load heavy libraries like xlsx only when exporting.
- Prefer parallel fetches (e.g., stats + lists) to improve perceived performance.
- Cache static lookups (customer types, quantities) in composables or stores if frequently accessed.
- **Settings Optimization**: 
  - Activity logs implement debounced search (500ms delay) to prevent excessive API calls
  - Server-side pagination handles large datasets efficiently
  - Contextual icons and color coding provide instant visual feedback without additional network requests
  - Password validation occurs client-side to minimize unnecessary API calls

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- 401 Unauthorized: The API client automatically logs out and redirects to login. Ensure the token is present and not expired.
- Network errors: useErrorHandler wraps failures and shows toasts; verify network connectivity and API base URL.
- Validation errors: Some endpoints return 400 validation messages; ensure payloads match expected schemas.
- Missing data: If fields appear empty, check backend response shape and mapping in the page component.
- **Settings Issues**: 
  - Activity logs not loading: Verify `/activity-logs/me` endpoint availability and proper authentication
  - Search not working: Check debounced search implementation and ensure input values are properly passed to API
  - Tab navigation: Ensure activeTab state is properly managed and tab content conditionals are correct
  - Password change failures: Verify current password validation and check for proper token refresh
  - Pagination issues: Confirm server-side pagination parameters are correctly formatted

Operational tips:
- Inspect console logs from useApi for request/response details.
- Verify runtime config values (NUXT_PUBLIC_API_BASE) in nuxt.config.ts.
- For permission-related blocks, confirm the user has required roles/permissions.
- **Settings Debugging**: Monitor activity log API calls and verify pagination parameters are correctly formatted. Check browser console for validation errors and API response structures.

**Section sources**
- [useApi.ts:1-91](file://app/composables/useApi.ts#L1-L91)
- [nuxt.config.ts:1-46](file://nuxt.config.ts#L1-L46)
- [settings/index.vue:104-130](file://app/pages/settings/index.vue#L104-L130)

## Conclusion
The Lacarte Atlas Console provides robust administrative capabilities across customers, fleet, pickups, billing, subscriptions, team, support, and system settings. Each module implements clear CRUD flows, consistent error handling, and permission checks. Integration points between modules enable end-to-end operational workflows from customer onboarding to service delivery and billing. The recent settings interface enhancements significantly improve security posture and operational visibility through comprehensive activity logging and enhanced password management capabilities.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### API Endpoints Summary (Selected)
- Customers
  - GET /customer/admin/list
  - PATCH /customer/admin/{id}/suspend
  - PATCH /customer/admin/{id}/unsuspend
- Drivers
  - GET /drivers/admin/
  - POST /drivers/admin/
- Trucks
  - GET /trucks/admin/
  - POST /trucks/admin/
  - DELETE /trucks/admin/{id}
- Pickups
  - GET /pickup-requests/admin/list
  - GET /pickup-requests/admin/stats
  - POST /pickup-requests/admin/{id}/assign
  - PATCH /pickup-requests/admin/{id}/reassign
- Rates
  - GET /rates/admin
  - GET /rates/admin/stats
  - POST /rates/admin
  - PATCH /rates/admin/{id}
  - DELETE /rates/admin/{id}
- Subscriptions
  - GET /subscription/admin/plans?type={type}
  - POST /subscription/admin/plans
  - PATCH /subscription/admin/plans/{id}
  - DELETE /subscription/admin/plans/{id}
  - PATCH /subscription/admin/plans/{id}/toggle
  - GET /subscription/admin/stats?type={type}
- Team
  - GET /team/
  - POST /team/roles
  - DELETE /team/{id}
  - GET /team/stats
- Support
  - GET /support/admin/tickets
  - GET /support/admin/tickets/stats
- **Settings**
  - POST /auth/change-password (with token refresh)
  - GET /activity-logs/me (with pagination and filters)

[No sources needed since this section aggregates endpoint usage patterns]

### Settings Interface Architecture
The settings interface follows a modular tab-based architecture with enhanced security and activity monitoring capabilities:

```mermaid
graph LR
A["Settings Container"] --> B["Tab Navigation"]
B --> C["Security Tab (Active)"]
B --> D["Activity Logs Tab (Active)"]
B --> E["General Tab (Disabled)"]
B --> F["Notifications Tab (Disabled)"]
C --> G["Password Management"]
C --> H["Validation Engine"]
C --> I["Token Management"]
D --> J["Activity Log Viewer"]
D --> K["Advanced Search"]
D --> L["Multi-dimensional Filters"]
D --> M["Pagination"]
E --> N["Company Settings (Preserved)"]
F --> O["Notification Preferences (Preserved)"]
J --> P["Contextual Icons"]
J --> Q["Timestamp Formatting"]
J --> R["IP Address Tracking"]
K --> S["Debounced Input (500ms)"]
L --> T["Module Filters"]
L --> U["Entity Type Filters"]
L --> V["Action Type Filters"]
```

**Diagram sources**
- [settings/index.vue:6-11](file://app/pages/settings/index.vue#L6-L11)
- [settings/index.vue:214-237](file://app/pages/settings/index.vue#L214-L237)
- [settings/index.vue:176-190](file://app/pages/settings/index.vue#L176-L190)
- [AppPagination.vue:1-48](file://app/components/AppPagination.vue#L1-48)