# Fleet Management

<cite>
**Referenced Files in This Document**
- [driver.ts](file://app/types/driver.ts)
- [drivers/index.vue](file://app/pages/drivers/index.vue)
- [trucks/index.vue](file://app/pages/trucks/index.vue)
- [trucks/[id].vue](file://app/pages/trucks/[id].vue)
- [AddDriverModal.vue](file://app/components/AddDriverModal.vue)
- [EditDriverModal.vue](file://app/components/EditDriverModal.vue)
- [AddTruckModal.vue](file://app/components/AddTruckModal.vue)
- [EditTruckModal.vue](file://app/components/EditTruckModal.vue)
- [AssignDriverToTruckModal.vue](file://app/components/AssignDriverToTruckModal.vue)
- [AssignDriverModal.vue](file://app/components/AssignDriverModal.vue)
- [useApi.ts](file://app/composables/useApi.ts)
</cite>

## Update Summary
**Changes Made**
- Removed all references to driver tracking page functionality that was completely deleted from the codebase
- Updated documentation to reflect the removal of tracking/drivers.vue file and related tracking features
- Maintained all other fleet management functionality including driver and truck administration, assignment workflows, and compensation management
- Updated section sources and diagram sources to remove tracking-related references

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

## Introduction
This document provides comprehensive documentation for the Fleet Management feature, covering driver and truck administration, assignment workflows, availability tracking, operational status management, and real-time status updates. It explains how drivers and trucks are modeled, how assignments are created and updated, and how the system integrates with backend APIs to reflect live operational states. The system includes advanced driver compensation management with per-trip rates, monthly trip expectations, fill rate requirements, and flexible payment frequency options. Note: Driver-specific tracking features have been removed from the codebase.

## Project Structure
Fleet Management is implemented across pages, components, types, and composables:
- Pages: Driver list/detail, Truck list/detail
- Components: Add/Edit Driver, Add/Edit Truck, Assign Driver to Truck, Assign Driver to Pickup
- Types: Shared data models for Driver, Truck, and related entities
- Composables: API client wrapper for HTTP requests

```mermaid
graph TB
subgraph "Pages"
DList["Drivers List<br/>/drivers"]
DDetail["Driver Detail<br/>/drivers/:id"]
TList["Trucks List<br/>/trucks"]
TDetail["Truck Detail<br/>/trucks/:id"]
end
subgraph "Components"
AddDrv["AddDriverModal"]
EditDrv["EditDriverModal"]
AddTrk["AddTruckModal"]
EditTrk["EditTruckModal"]
AssignDrvTrk["AssignDriverToTruckModal"]
AssignDrvPickup["AssignDriverModal"]
end
subgraph "Types"
Models["driver.ts (Driver, Truck, etc.)"]
end
subgraph "Composables"
Api["useApi.ts"]
end
DList --> AddDrv
DList --> EditDrv
DList --> DDetail
DDetail --> EditDrv
TList --> AddTrk
TList --> TDetail
TDetail --> EditTrk
TDetail --> AssignDrvTrk
AssignDrvPickup --> DList
DDetail --> Models
TDetail --> Models
DList --> Models
TList --> Models
DList --> Api
DDetail --> Api
TList --> Api
TDetail --> Api
```

**Diagram sources**
- [drivers/index.vue:1-152](file://app/pages/drivers/index.vue#L1-L152)
- [trucks/index.vue:1-205](file://app/pages/trucks/index.vue#L1-L205)
- [trucks/[id].vue](file://app/pages/trucks/[id].vue#L1-L573)
- [AddDriverModal.vue:1-253](file://app/components/AddDriverModal.vue#L1-L253)
- [EditDriverModal.vue:1-202](file://app/components/EditDriverModal.vue#L1-L202)
- [AddTruckModal.vue:1-238](file://app/components/AddTruckModal.vue#L1-L238)
- [EditTruckModal.vue:1-250](file://app/components/EditTruckModal.vue#L1-L250)
- [AssignDriverToTruckModal.vue:1-108](file://app/components/AssignDriverToTruckModal.vue#L1-L108)
- [AssignDriverModal.vue:1-222](file://app/components/AssignDriverModal.vue#L1-L222)
- [driver.ts:1-127](file://app/types/driver.ts#L1-L127)
- [useApi.ts:1-91](file://app/composables/useApi.ts#L1-L91)

**Section sources**
- [drivers/index.vue:1-152](file://app/pages/drivers/index.vue#L1-L152)
- [trucks/index.vue:1-205](file://app/pages/trucks/index.vue#L1-L205)
- [trucks/[id].vue](file://app/pages/trucks/[id].vue#L1-L573)
- [driver.ts:1-127](file://app/types/driver.ts#L1-L127)
- [useApi.ts:1-91](file://app/composables/useApi.ts#L1-L91)

## Core Components
- Driver lifecycle: Create, edit, delete, view details, route history, performance metrics, earnings summary, and compensation management.
- Truck lifecycle: Create, edit, delete, view details, maintenance scheduling/history, assign/unassign driver.
- Assignment workflow: Assign a driver to a truck via modal; update truck's assigned driver and refresh state.
- Availability and status: Drivers have statuses such as active, inactive, on_leave, on-route, online; Trucks have active, maintenance, inactive.
- Compensation management: Per-trip rate configuration, monthly trip expectations, minimum fill rate tracking, and flexible payment frequency settings.

Key responsibilities by file:
- Data models: [driver.ts:1-127](file://app/types/driver.ts#L1-L127)
- Driver list and creation: [drivers/index.vue:1-152](file://app/pages/drivers/index.vue#L1-L152), [AddDriverModal.vue:1-253](file://app/components/AddDriverModal.vue#L1-L253)
- Driver detail and editing: [drivers/[id].vue](file://app/pages/drivers/[id].vue#L1-L800), [EditDriverModal.vue:1-202](file://app/components/EditDriverModal.vue#L1-L202)
- Truck list and creation: [trucks/index.vue:1-205](file://app/pages/trucks/index.vue#L1-L205), [AddTruckModal.vue:1-238](file://app/components/AddTruckModal.vue#L1-L238)
- Truck detail and editing: [trucks/[id].vue](file://app/pages/trucks/[id].vue#L1-L573), [EditTruckModal.vue:1-250](file://app/components/EditTruckModal.vue#L1-L250)
- Assign driver to truck: [AssignDriverToTruckModal.vue:1-108](file://app/components/AssignDriverToTruckModal.vue#L1-L108)
- Assign driver to pickup request: [AssignDriverModal.vue:1-222](file://app/components/AssignDriverModal.vue#L1-L222)
- API client: [useApi.ts:1-91](file://app/composables/useApi.ts#L1-L91)

**Section sources**
- [driver.ts:1-127](file://app/types/driver.ts#L1-L127)
- [drivers/index.vue:1-152](file://app/pages/drivers/index.vue#L1-L152)
- [trucks/index.vue:1-205](file://app/pages/trucks/index.vue#L1-L205)
- [trucks/[id].vue](file://app/pages/trucks/[id].vue#L1-L573)
- [AddDriverModal.vue:1-253](file://app/components/AddDriverModal.vue#L1-L253)
- [EditDriverModal.vue:1-202](file://app/components/EditDriverModal.vue#L1-L202)
- [AddTruckModal.vue:1-238](file://app/components/AddTruckModal.vue#L1-L238)
- [EditTruckModal.vue:1-250](file://app/components/EditTruckModal.vue#L1-L250)
- [AssignDriverToTruckModal.vue:1-108](file://app/components/AssignDriverToTruckModal.vue#L1-L108)
- [AssignDriverModal.vue:1-222](file://app/components/AssignDriverModal.vue#L1-L222)
- [useApi.ts:1-91](file://app/composables/useApi.ts#L1-L91)

## Architecture Overview
The Fleet Management UI follows a page-driven architecture with reusable modals and typed data models. All server interactions go through a centralized API composable that handles authentication, error handling, and response normalization. The system supports comprehensive driver compensation management with real-time earnings calculation and adjustment capabilities.

```mermaid
sequenceDiagram
participant Admin as "Admin UI"
participant Page as "Page (e.g., /trucks/ : id)"
participant Modal as "AssignDriverToTruckModal"
participant API as "useApi.ts"
participant Server as "Backend API"
Admin->>Page : Open Truck Detail
Page->>API : GET /trucks/admin/ : id
API-->>Page : Truck data
Admin->>Modal : Click "Assign Driver"
Modal->>API : GET /drivers/admin/
API-->>Modal : Driver list
Admin->>Modal : Select driver and submit
Modal-->>Page : Emit selected driverId
Page->>API : PATCH /trucks/admin/ : id/assign-driver { driverId }
API-->>Page : Success
Page->>API : GET /trucks/admin/ : id (refresh)
API-->>Page : Updated truck with assignedDriver
```

**Diagram sources**
- [trucks/[id].vue](file://app/pages/trucks/[id].vue#L114-L129)
- [AssignDriverToTruckModal.vue:16-31](file://app/components/AssignDriverToTruckModal.vue#L16-L31)
- [useApi.ts:9-67](file://app/composables/useApi.ts#L9-L67)

**Section sources**
- [trucks/[id].vue](file://app/pages/trucks/[id].vue#L1-L573)
- [AssignDriverToTruckModal.vue:1-108](file://app/components/AssignDriverToTruckModal.vue#L1-L108)
- [useApi.ts:1-91](file://app/composables/useApi.ts#L1-L91)

## Detailed Component Analysis

### Data Models and Relationships
The shared type definitions define the core entities and their relationships, enhanced with comprehensive compensation fields:
- Driver: identity, contact info, license, zone, status, assigned truck, stats, and compensation details
- Truck: identity, plate, VIN, make/model/year/capacity, status, assigned driver, GPS info
- DriverTracking: real-time telemetry fields (available but tracking page removed)
- Payloads: create/update structures for drivers and trucks

```mermaid
classDiagram
class Zone {
+string id
+string name
+string color
}
class DriverUser {
+string name
+string email
}
class AssignedTruck {
+string truckId
+string plateNumber
}
class DriverPeriodEarnings {
+string periodMonth
+number binsAssigned
+number binsCompleted
+number currentEarnings
+number projectedSalary
+number pendingBonuses
+number pendingDeductions
}
class Driver {
+string id
+string name
+string email
+string phoneNumber
+DriverUser user
+string licenseNumber
+string licenseExpiry
+Zone zone
+string zoneId
+enum status
+AssignedTruck assignedTruck
+number assignedPickups
+number totalTrips
+number earnings
+number incomplete
+number deductionAmt
+number completed
+number total
+DriverPeriodEarnings stats
}
class TruckDriver {
+string id
+string name
}
class Truck {
+string id
+string truckId
+string plateNumber
+string vinNumber
+string make
+string model
+number year
+string capacity
+enum status
+TruckDriver assignedDriver
+string lastGpsUpdate
+string gpsDeviceId
+string registrationExpiry
+string notes
}
class DriverTracking {
+string driverId
+number lng
+number lat
+number accuracy
+number speed
+number heading
+string recordedAt
+boolean isOnline
}
Driver --> Zone : "has"
Driver --> DriverUser : "has"
Driver --> AssignedTruck : "assigned"
Driver --> DriverPeriodEarnings : "stats"
Truck --> TruckDriver : "assigned"
```

**Updated** Enhanced Driver type with DriverPeriodEarnings structure for comprehensive compensation tracking.

**Diagram sources**
- [driver.ts:1-127](file://app/types/driver.ts#L1-L127)

**Section sources**
- [driver.ts:1-127](file://app/types/driver.ts#L1-L127)

### Driver Lifecycle Management
- Create Driver:
  - UI: [AddDriverModal.vue:1-253](file://app/components/AddDriverModal.vue#L1-L253)
  - Submission: [drivers/index.vue:24-37](file://app/pages/drivers/index.vue#L24-L37)
  - API: POST /drivers/admin/
  - **Updated** Includes comprehensive compensation field validation and input handling
- Edit Driver:
  - UI: [EditDriverModal.vue:1-202](file://app/components/EditDriverModal.vue#L1-L202)
  - Submission: [drivers/[id].vue](file://app/pages/drivers/[id].vue#L271-L282)
  - API: PATCH /drivers/admin/:id
- Delete Driver:
  - Confirmation and deletion: [drivers/[id].vue](file://app/pages/drivers/[id].vue#L284-L300)
  - API: DELETE /drivers/admin/:id
- View Details:
  - Profile, current route, history, performance, earnings: [drivers/[id].vue](file://app/pages/drivers/[id].vue#L108-L119)
  - API calls:
    - GET /drivers/admin/:id
    - GET /drivers/admin/:id/route
    - GET /drivers/admin/:id/pickups/history
    - GET /drivers/admin/:id/performance?months=N

```mermaid
flowchart TD
Start([Open Driver Detail]) --> FetchProfile["GET /drivers/admin/:id"]
FetchProfile --> FetchRoute["GET /drivers/admin/:id/route"]
FetchProfile --> FetchHistory["GET /drivers/admin/:id/pickups/history"]
FetchProfile --> FetchPerf["GET /drivers/admin/:id/performance?months=N"]
FetchProfile --> FetchEarnings["GET /drivers/admin/:id/earnings"]
FetchRoute --> RenderRoute["Render Current Route"]
FetchHistory --> RenderHistory["Render History Table"]
FetchPerf --> RenderPerf["Render Charts & Stats"]
FetchEarnings --> RenderEarnings["Render Earnings Summary"]
RenderRoute --> End([Ready])
RenderHistory --> End
RenderPerf --> End
RenderEarnings --> End
```

**Section sources**
- [AddDriverModal.vue:1-253](file://app/components/AddDriverModal.vue#L1-L253)
- [EditDriverModal.vue:1-202](file://app/components/EditDriverModal.vue#L1-L202)
- [drivers/index.vue:1-152](file://app/pages/drivers/index.vue#L1-L152)
- [drivers/[id].vue](file://app/pages/drivers/[id].vue#L1-L800)

### Truck Fleet Oversight
- Create Truck:
  - UI: [AddTruckModal.vue:1-238](file://app/components/AddTruckModal.vue#L1-L238)
  - Submission: [trucks/index.vue:25-34](file://app/pages/trucks/index.vue#L25-L34)
  - API: POST /trucks/admin/
- Edit Truck:
  - UI: [EditTruckModal.vue:1-250](file://app/components/EditTruckModal.vue#L1-L250)
  - Submission: [trucks/[id].vue](file://app/pages/trucks/[id].vue#L131-L153)
  - API: PATCH /trucks/admin/:id
- Delete Truck:
  - Confirmation and deletion: [trucks/[id].vue](file://app/pages/trucks/[id].vue#L155-L166)
  - API: DELETE /trucks/admin/:id
- Maintenance Scheduling:
  - Schedule: [trucks/[id].vue](file://app/pages/trucks/[id].vue#L74-L112)
  - Update: [trucks/[id].vue](file://app/pages/trucks/[id].vue#L173-L204)
  - API endpoints:
    - POST /trucks/admin/:id/maintenance
    - PATCH /trucks/admin/:id/maintenance/:maintenanceId
  - Load history: [trucks/[id].vue](file://app/pages/trucks/[id].vue#L39-L72)
  - API: GET /trucks/:id/maintenance

```mermaid
sequenceDiagram
participant Admin as "Admin UI"
participant Page as "Truck Detail"
participant API as "useApi.ts"
participant Server as "Backend API"
Admin->>Page : Open Truck Detail
Page->>API : GET /trucks/admin/ : id
API-->>Page : Truck data
Admin->>Page : Click "Schedule Maintenance"
Page->>API : POST /trucks/admin/ : id/maintenance { payload }
API-->>Page : Created record
Page->>API : GET /trucks/ : id/maintenance
API-->>Page : Maintenance history
Page-->>Admin : Render updated table
```

**Diagram sources**
- [trucks/[id].vue](file://app/pages/trucks/[id].vue#L39-L112)
- [useApi.ts:9-67](file://app/composables/useApi.ts#L9-L67)

**Section sources**
- [AddTruckModal.vue:1-238](file://app/components/AddTruckModal.vue#L1-L238)
- [EditTruckModal.vue:1-250](file://app/components/EditTruckModal.vue#L1-L250)
- [trucks/index.vue:1-205](file://app/pages/trucks/index.vue#L1-L205)
- [trucks/[id].vue](file://app/pages/trucks/[id].vue#L1-L573)

### Vehicle Assignment Workflows and Driver-Truck Relationship
- Assign Driver to Truck:
  - UI: [AssignDriverToTruckModal.vue:1-108](file://app/components/AssignDriverToTruckModal.vue#L1-L108)
  - Triggered from Truck Detail: [trucks/[id].vue](file://app/pages/trucks/[id].vue#L114-L129)
  - API: PATCH /trucks/admin/:id/assign-driver { driverId }
  - Refreshes truck data post-assignment
- Assign Driver to Pickup Request:
  - UI: [AssignDriverModal.vue:1-222](file://app/components/AssignDriverModal.vue#L1-L222)
  - Filters available drivers by status (active or online)
  - Emits selection for further processing

```mermaid
sequenceDiagram
participant Admin as "Admin UI"
participant TruckPage as "Truck Detail"
participant Modal as "AssignDriverToTruckModal"
participant API as "useApi.ts"
participant Server as "Backend API"
Admin->>TruckPage : Open Truck Detail
TruckPage->>API : GET /trucks/admin/ : id
API-->>TruckPage : Truck data
Admin->>Modal : Open "Assign Driver"
Modal->>API : GET /drivers/admin/
API-->>Modal : Driver list
Admin->>Modal : Submit selected driverId
Modal-->>TruckPage : Emit driverId
TruckPage->>API : PATCH /trucks/admin/ : id/assign-driver { driverId }
API-->>TruckPage : Success
TruckPage->>API : GET /trucks/admin/ : id (refresh)
API-->>TruckPage : Updated truck with assignedDriver
```

**Diagram sources**
- [AssignDriverToTruckModal.vue:16-31](file://app/components/AssignDriverToTruckModal.vue#L16-L31)
- [trucks/[id].vue](file://app/pages/trucks/[id].vue#L114-L129)
- [useApi.ts:9-67](file://app/composables/useApi.ts#L9-L67)

**Section sources**
- [AssignDriverToTruckModal.vue:1-108](file://app/components/AssignDriverToTruckModal.vue#L1-L108)
- [AssignDriverModal.vue:1-222](file://app/components/AssignDriverModal.vue#L1-L222)
- [trucks/[id].vue](file://app/pages/trucks/[id].vue#L1-L573)

### Availability Tracking and Operational Status Management
- Driver statuses: active, inactive, on_leave, on-route, online
- Truck statuses: active, maintenance, inactive
- Display logic:
  - Driver list badges and colors: [drivers/index.vue:39-45](file://app/pages/drivers/index.vue#L39-L45)
  - Truck list badges and colors: [trucks/index.vue:57-61](file://app/pages/trucks/index.vue#L57-L61)
  - Driver detail computed badge: [drivers/[id].vue](file://app/pages/drivers/[id].vue#L121-L128)
  - Truck detail computed badge: [trucks/[id].vue](file://app/pages/trucks/[id].vue#L206-L211)

```mermaid
stateDiagram-v2
[*] --> Active
Active --> Inactive : "set inactive"
Active --> OnLeave : "set on_leave"
Active --> OnRoute : "start route"
OnRoute --> Online : "go online"
Online --> OnRoute : "start route"
Inactive --> Active : "activate"
OnLeave --> Active : "return"
```

**Diagram sources**
- [driver.ts:39](file://app/types/driver.ts#L39)
- [drivers/index.vue:39-45](file://app/pages/drivers/index.vue#L39-L45)
- [drivers/[id].vue](file://app/pages/drivers/[id].vue#L121-L128)
- [trucks/index.vue:57-61](file://app/pages/trucks/index.vue#L57-L61)
- [trucks/[id].vue](file://app/pages/trucks/[id].vue#L206-L211)

**Section sources**
- [driver.ts:1-127](file://app/types/driver.ts#L1-L127)
- [drivers/index.vue:1-152](file://app/pages/drivers/index.vue#L1-L152)
- [drivers/[id].vue](file://app/pages/drivers/[id].vue#L1-L800)
- [trucks/index.vue:1-205](file://app/pages/trucks/index.vue#L1-L205)
- [trucks/[id].vue](file://app/pages/trucks/[id].vue#L1-L573)

### Driver Compensation Management
The system provides comprehensive driver compensation management with the following features:

- **Per-Trip Rate Configuration**: Set individual per-trip compensation rates for each driver
- **Monthly Trip Expectations**: Define expected trips per month for performance tracking
- **Minimum Fill Rate**: Configure minimum fill rate requirements for optimal utilization
- **Payment Frequency Settings**: Support for various payment frequencies (weekly, bi-weekly, monthly)
- **Manual Adjustments**: Ability to add bonuses and deductions directly from driver detail page
- **Dynamic Earnings Calculation**: Real-time earnings calculation based on actual trips and rates

Compensation fields integration:
- **Data Model**: Enhanced Driver type with DriverPeriodEarnings structure
- **UI Inputs**: Validation and input handling in Add/Edit Driver modals
- **Detail Page**: Manual bonus/deduction adjustment interface
- **API Integration**: Backend endpoints for compensation data synchronization

```mermaid
flowchart TD
CompSetup["Compensation Setup"] --> PerTripRate["Set Per-Trip Rate"]
CompSetup --> ExpectedTrips["Define Expected Trips/Month"]
CompSetup --> MinFillRate["Configure Minimum Fill Rate"]
CompSetup --> PaymentFreq["Set Payment Frequency"]
ActualTrips["Actual Trip Tracking"] --> EarningsCalc["Calculate Earnings"]
EarningsCalc --> BonusAdj["Apply Bonuses"]
EarningsCalc --> DeductionAdj["Apply Deductions"]
BonusAdj --> FinalEarnings["Final Earnings"]
DeductionAdj --> FinalEarnings
MinFillRate --> PerformanceCheck["Performance Check"]
ExpectedTrips --> PerformanceCheck
PerformanceCheck --> FinalEarnings
```

**Diagram sources**
- [driver.ts:19-27](file://app/types/driver.ts#L19-L27)
- [AddDriverModal.vue:190-230](file://app/components/AddDriverModal.vue#L190-L230)
- [EditDriverModal.vue:1-202](file://app/components/EditDriverModal.vue#L1-L202)
- [drivers/[id].vue](file://app/pages/drivers/[id].vue#L1-L800)

**Section sources**
- [driver.ts:1-127](file://app/types/driver.ts#L1-L127)
- [AddDriverModal.vue:1-253](file://app/components/AddDriverModal.vue#L1-L253)
- [EditDriverModal.vue:1-202](file://app/components/EditDriverModal.vue#L1-L202)
- [drivers/[id].vue](file://app/pages/drivers/[id].vue#L1-L800)

## Dependency Analysis
- API client dependency:
  - All pages and modals use [useApi.ts:1-91](file://app/composables/useApi.ts#L1-L91) for authenticated requests and error handling.
- Type dependencies:
  - Pages and modals import shared types from [driver.ts:1-127](file://app/types/driver.ts#L1-L127).
- Cross-page navigation:
  - Drivers list links to detail; Truck list links to detail; Truck detail opens assignment modal.

```mermaid
graph LR
UseApi["useApi.ts"] --> DriversIndex["drivers/index.vue"]
UseApi --> DriversDetail["drivers/[id].vue"]
UseApi --> TrucksIndex["trucks/index.vue"]
UseApi --> TrucksDetail["trucks/[id].vue"]
Types["driver.ts"] --> DriversIndex
Types --> DriversDetail
Types --> TrucksIndex
Types --> TrucksDetail
```

**Diagram sources**
- [useApi.ts:1-91](file://app/composables/useApi.ts#L1-L91)
- [driver.ts:1-127](file://app/types/driver.ts#L1-L127)
- [drivers/index.vue:1-152](file://app/pages/drivers/index.vue#L1-L152)
- [drivers/[id].vue](file://app/pages/drivers/[id].vue#L1-L800)
- [trucks/index.vue:1-205](file://app/pages/trucks/index.vue#L1-L205)
- [trucks/[id].vue](file://app/pages/trucks/[id].vue#L1-L573)

**Section sources**
- [useApi.ts:1-91](file://app/composables/useApi.ts#L1-L91)
- [driver.ts:1-127](file://app/types/driver.ts#L1-L127)
- [drivers/index.vue:1-152](file://app/pages/drivers/index.vue#L1-L152)
- [drivers/[id].vue](file://app/pages/drivers/[id].vue#L1-L800)
- [trucks/index.vue:1-205](file://app/pages/trucks/index.vue#L1-L205)
- [trucks/[id].vue](file://app/pages/trucks/[id].vue#L1-L573)

## Performance Considerations
- Minimize redundant fetches:
  - After mutations (create/edit/delete), refresh only necessary resources (e.g., refresh truck after assignment).
- Efficient marker updates:
  - Remove and recreate GeoJSON source and layer when updating map markers to avoid stale state.
- Debounce heavy operations:
  - For large lists, consider pagination or virtualization if needed.
- Error resilience:
  - Centralized error handling in [useApi.ts:46-67](file://app/composables/useApi.ts#L46-L67) ensures consistent UX and avoids repeated failed requests.
- Compensation calculations should be cached where possible to minimize API calls during earnings display.

## Troubleshooting Guide
- Authentication failures:
  - 401 responses trigger logout and redirect to login via [useApi.ts:39-44](file://app/composables/useApi.ts#L39-L44).
- Missing environment variables:
  - Ensure proper configuration of API endpoints and service URLs.
- SSE connectivity issues:
  - Connection errors set a non-blocking banner with a retry button.
- Validation errors in forms:
  - Driver and Truck modals validate required fields and display inline errors ([AddDriverModal.vue:35-47](file://app/components/AddDriverModal.vue#L35-L47), [AddTruckModal.vue:37-85](file://app/components/AddTruckModal.vue#L37-L85)).
- Compensation field validation:
  - Ensure numeric values are properly formatted and within acceptable ranges for per-trip rates and fill rates.
  - Validate payment frequency against supported values.

**Section sources**
- [useApi.ts:39-67](file://app/composables/useApi.ts#L39-L67)
- [AddDriverModal.vue:35-47](file://app/components/AddDriverModal.vue#L35-L47)
- [AddTruckModal.vue:37-85](file://app/components/AddTruckModal.vue#L37-L85)

## Conclusion
Fleet Management provides a robust admin experience for managing drivers and trucks, including assignment workflows, maintenance scheduling, and comprehensive compensation management. The modular structure separates concerns between pages, modals, types, and API utilities, enabling clear maintenance and extensibility. Status management and assignment constraints are enforced at both UI and API layers, ensuring consistency across the application. The new compensation management features provide flexible driver payment configurations with real-time earnings calculation and manual adjustment capabilities, enhancing the overall driver administration experience. Note: Driver-specific tracking features have been removed from the codebase as part of recent updates.