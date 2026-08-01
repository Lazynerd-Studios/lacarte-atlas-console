# Pickup Operations

<cite>
**Referenced Files in This Document**
- [index.vue](file://app/pages/pickups/index.vue)
- [detail.vue](file://app/pages/pickups/[id].vue)
- [CreatePickupModal.vue](file://app/components/CreatePickupModal.vue)
- [EmergencyFeeCard.vue](file://app/components/EmergencyFeeCard.vue)
- [SetEmergencyFeeModal.vue](file://app/components/SetEmergencyFeeModal.vue)
- [ShopZoneFeeCard.vue](file://app/components/ShopZoneFeeCard.vue)
- [SetShopZoneFeeModal.vue](file://app/components/SetShopZoneFeeModal.vue)
- [CreateSupportTicketModal.vue](file://app/components/CreateSupportTicketModal.vue)
- [AssignDriverToTruckModal.vue](file://app/components/AssignDriverToTruckModal.vue)
- [useApi.ts](file://app/composables/useApi.ts)
- [driver.ts](file://app/types/driver.ts)
</cite>

## Update Summary
**Changes Made**
- Enhanced CreatePickupModal with emergency pickup toggle functionality and specialized validation rules
- Added emergency-specific success notifications and user feedback mechanisms
- Implemented restrictions on preferred date selection for emergency pickup scenarios
- Updated validation logic to handle emergency pickup requirements and priority handling
- Enhanced user experience with conditional form fields based on emergency mode

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Emergency Pickup and Fee Management System](#emergency-pickup-and-fee-management-system)
7. [Enhanced CreatePickupModal Functionality](#enhanced-createpickupmodal-functionality)
8. [Dependency Analysis](#dependency-analysis)
9. [Performance Considerations](#performance-considerations)
10. [Troubleshooting Guide](#troubleshooting-guide)
11. [Conclusion](#conclusion)

## Introduction
This document explains the end-to-end Pickup Operations management in the console application. It covers the pickup request lifecycle from creation to completion, including driver assignment and reassignment workflows, status transitions, priority handling, and integration with fleet management (drivers and trucks). The system now includes a comprehensive emergency pickup and fee management system that allows administrators to handle urgent pickup requests and manage associated fees. **Updated**: The CreatePickupModal has been significantly enhanced with emergency pickup toggle functionality, specialized validation rules for emergency scenarios, customized success notifications, and restrictions on preferred date selection when emergency mode is activated.

## Project Structure
The pickup operations are implemented primarily through:
- A list page for browsing, filtering, sorting, and assigning/reassigning pickups
- A detail page for deep inspection, status progression, and activity log review
- Modal components for creating requests, assigning drivers, and managing emergency fees
- An API composable that centralizes HTTP calls and error handling
- Type definitions for drivers and trucks used by the UI
- Emergency fee management components for handling urgent pickup scenarios

```mermaid
graph TB
subgraph "UI Pages"
PList["Pickups List<br/>app/pages/pickups/index.vue"]
PDetail["Pickup Detail<br/>app/pages/pickups/[id].vue"]
end
subgraph "Modals"
CreateM["Create Pickup Modal<br/>app/components/CreatePickupModal.vue"]
AssignM["Assign Driver Modal<br/>(used by pages)"]
EmergencyFee["Emergency Fee Card<br/>app/components/EmergencyFeeCard.vue"]
SetEmergencyFee["Set Emergency Fee Modal<br/>app/components/SetEmergencyFeeModal.vue"]
ShopZoneFee["Shop Zone Fee Card<br/>app/components/ShopZoneFeeCard.vue"]
SetShopZoneFee["Set Shop Zone Fee Modal<br/>app/components/SetShopZoneFeeModal.vue"]
SupportTicket["Create Support Ticket Modal<br/>app/components/CreateSupportTicketModal.vue"]
end
subgraph "Shared"
Api["API Composable<br/>app/composables/useApi.ts"]
Types["Fleet Types<br/>app/types/driver.ts"]
end
PList --> CreateM
PList --> AssignM
PList --> EmergencyFee
PList --> ShopZoneFee
PDetail --> AssignM
PDetail --> SupportTicket
CreateM --> Api
AssignM --> Api
EmergencyFee --> Api
SetEmergencyFee --> Api
ShopZoneFee --> Api
SetShopZoneFee --> Api
SupportTicket --> Api
PList -. uses .-> Types
PDetail -. uses .-> Types
```

**Diagram sources**
- [index.vue:1-606](file://app/pages/pickups/index.vue#L1-L606)
- [detail.vue:1-841](file://app/pages/pickups/[id].vue#L1-L841)
- [CreatePickupModal.vue:1-293](file://app/components/CreatePickupModal.vue#L1-L293)
- [EmergencyFeeCard.vue:1-100](file://app/components/EmergencyFeeCard.vue#L1-L100)
- [SetEmergencyFeeModal.vue:1-100](file://app/components/SetEmergencyFeeModal.vue#L1-L100)
- [ShopZoneFeeCard.vue:1-100](file://app/components/ShopZoneFeeCard.vue#L1-L100)
- [SetShopZoneFeeModal.vue:1-100](file://app/components/SetShopZoneFeeModal.vue#L1-L100)
- [CreateSupportTicketModal.vue:1-100](file://app/components/CreateSupportTicketModal.vue#L1-L100)
- [useApi.ts:1-91](file://app/composables/useApi.ts#L1-L91)
- [driver.ts:1-106](file://app/types/driver.ts#L1-L106)

**Section sources**
- [index.vue:1-606](file://app/pages/pickups/index.vue#L1-L606)
- [detail.vue:1-841](file://app/pages/pickups/[id].vue#L1-L841)
- [CreatePickupModal.vue:1-293](file://app/components/CreatePickupModal.vue#L1-L293)
- [useApi.ts:1-91](file://app/composables/useApi.ts#L1-L91)
- [driver.ts:1-106](file://app/types/driver.ts#L1-L106)

## Core Components
- Pickups List Page
  - Displays paginated pickup requests with filters by status and payment status
  - Provides comprehensive server-side sorting functionality with interactive column headers for creation date, preferred pickup date, and last update time
  - Shows visual feedback through directional arrows indicating sort direction
  - Implements reactive sort state management with automatic pagination reset
  - Supports keyboard navigation and screen reader accessibility
  - Provides "Assign Driver" or "Reassign" actions based on current status
  - Opens a modal to assign or reassign a driver and schedule time slots
  - Fetches operational stats for quick overview
  - Integrated emergency fee management and shop zone fee display
- Pickup Detail Page
  - Shows full request details, customer info, assigned driver/truck, and notes
  - Supports status progression: Start Trip → En Route → Picked Up → Complete
  - Allows cancellation and reassignment
  - Displays a timeline and detailed activity log
  - Support ticket creation capability for issue resolution
- Create Pickup Modal
  - Collects customer selection, disposable item type, estimated quantity, preferred date, and notes
  - **Enhanced**: Now includes emergency pickup toggle functionality with specialized validation rules and restricted date selection for emergency scenarios
  - Submits a new pickup request via admin endpoint with emergency mode support
- Assign Driver Modal
  - Captures driver, scheduled date/time slot, and notes; emits submission to parent
- Emergency Fee Management Components
  - EmergencyFeeCard.vue: Displays and manages emergency fee information
  - SetEmergencyFeeModal.vue: Configures emergency fee settings and rates
- Shop Zone Fee Management Components
  - ShopZoneFeeCard.vue: Shows shop zone fee details and status
  - SetShopZoneFeeModal.vue: Manages shop zone fee configuration
- Support Ticket Creation
  - CreateSupportTicketModal.vue: Creates support tickets for pickup-related issues
- API Composable
  - Centralized fetch wrapper with auth header injection, unified error handling, and typed helpers
- Fleet Types
  - Shared TypeScript interfaces for drivers, trucks, zones, and tracking data

**Section sources**
- [index.vue:1-606](file://app/pages/pickups/index.vue#L1-L606)
- [detail.vue:1-841](file://app/pages/pickups/[id].vue#L1-L841)
- [CreatePickupModal.vue:1-293](file://app/components/CreatePickupModal.vue#L1-L293)
- [EmergencyFeeCard.vue:1-100](file://app/components/EmergencyFeeCard.vue#L1-L100)
- [SetEmergencyFeeModal.vue:1-100](file://app/components/SetEmergencyFeeModal.vue#L1-L100)
- [ShopZoneFeeCard.vue:1-100](file://app/components/ShopZoneFeeCard.vue#L1-L100)
- [SetShopZoneFeeModal.vue:1-100](file://app/components/SetShopZoneFeeModal.vue#L1-L100)
- [CreateSupportTicketModal.vue:1-100](file://app/components/CreateSupportTicketModal.vue#L1-L100)
- [useApi.ts:1-91](file://app/composables/useApi.ts#L1-L91)
- [driver.ts:1-106](file://app/types/driver.ts#L1-L106)

## Architecture Overview
The frontend orchestrates pickup operations by calling admin endpoints for listing, creating, assigning/reassigning, and updating statuses. The detail view enriches context with an activity log and timeline. The list view supports advanced server-side sorting with dynamic parameter passing, reactive state management, and performance optimization. The architecture includes integrated emergency pickup and fee management systems with dedicated components for fee configuration and support ticket creation.

```mermaid
sequenceDiagram
participant Admin as "Admin User"
participant List as "Pickups List Page"
participant SortManager as "Sort State Manager"
participant Detail as "Pickup Detail Page"
participant Modal as "Create/Assign Modals"
participant EmergencyFee as "Emergency Fee System"
participant Support as "Support Ticket System"
participant API as "useApi.ts"
participant Backend as "Backend API"
Admin->>List : Open /pickups
List->>API : GET /pickup-requests/admin/list?filters&sortBy&sortOrder
API-->>List : { data[], pagination }
Admin->>List : Click Sortable Column Header
List->>SortManager : Update sort state
SortManager->>API : GET /pickup-requests/admin/list?sortBy=newField&sortOrder=asc/desc
API-->>List : { data[], pagination }
Admin->>List : Use Keyboard Navigation
List->>SortManager : Handle keyboard events
SortManager->>API : Trigger sorted fetch
API-->>List : Sorted results
Admin->>List : Click "Create Pickup"
List->>Modal : Show CreatePickupModal
Modal->>API : POST /pickup-requests/admin/
API-->>Modal : Created
Modal-->>List : created event
Admin->>List : Toggle Emergency Pickup
List->>EmergencyFee : Configure emergency fees
EmergencyFee->>API : POST /feems/emergency/update
API-->>EmergencyFee : Fee updated
Admin->>List : Click "Create Support Ticket"
List->>Support : Show CreateSupportTicketModal
Support->>API : POST /support/tickets
API-->>Support : Ticket created
Admin->>List : Click "Assign Driver"
List->>Modal : Show AssignDriverModal
Modal->>API : POST /pickup-requests/admin/ : id/assign
API-->>List : Success
List->>API : Refresh list + stats
Admin->>Detail : Open /pickups/ : id
Detail->>API : GET /pickup-requests/admin/ : id
API-->>Detail : Request + assignment
Detail->>API : GET /pickup-requests/admin/ : id/activity-log
API-->>Detail : Timeline + activities
Admin->>Detail : Start Trip / En Route / Picked Up / Complete
Detail->>API : PATCH /pickup-requests/admin/ : id/status
API-->>Detail : Updated
Detail->>API : Refresh details + activity-log
```

**Diagram sources**
- [index.vue:58-75](file://app/pages/pickups/index.vue#L58-L75)
- [index.vue:124-158](file://app/pages/pickups/index.vue#L124-L158)
- [index.vue:187-239](file://app/pages/pickups/index.vue#L187-L239)
- [detail.vue:117-153](file://app/pages/pickups/[id].vue#L117-L153)
- [detail.vue:290-379](file://app/pages/pickups/[id].vue#L290-379)
- [CreatePickupModal.vue:131-152](file://app/components/CreatePickupModal.vue#L131-152)
- [useApi.ts:9-67](file://app/composables/useApi.ts#L9-L67)

## Detailed Component Analysis

### Data Models and Status Lifecycle
- Pickup Request Model
  - Identifiers and timestamps: id, createdAt, updatedAt
  - Customer reference and nested customer details (name, phone, address, region, etc.)
  - Disposable item type and estimated quantity references
  - Assignment object with driver and truck details when available
  - Operational fields: preferredPickupDate, additionalNotes, status, paymentType, paymentStatus
  - Emergency pickup flag and associated fee information
- Status Values
  - pending, assigned, truck_dispatched, en_route, picked_up, completed, cancelled
- Payment Status Values
  - active-plan/active_plan, paid, unpaid
- Priority Handling
  - When assigning a new pickup, a priorityLevel is included in the payload
  - Reassignment does not include priorityLevel
  - Emergency pickups have elevated priority levels automatically
- Time Slots
  - UI presents Morning/Afternoon/Evening; mapped to morning/afternoon/evening for the backend

```mermaid
stateDiagram-v2
[*] --> Pending
Pending --> Assigned : "Assign Driver"
Assigned --> TruckDispatched : "Start Trip"
TruckDispatched --> EnRoute : "Mark En Route"
EnRoute --> PickedUp : "Mark Picked Up"
PickedUp --> Completed : "Complete Trip"
Pending --> Cancelled : "Cancel"
Assigned --> Cancelled : "Cancel"
TruckDispatched --> Cancelled : "Cancel"
EnRoute --> Cancelled : "Cancel"
PickedUp --> Cancelled : "Cancel"
[*] --> EmergencyPending : "Emergency Pickup"
EmergencyPending --> EmergencyAssigned : "Priority Assignment"
EmergencyAssigned --> EmergencyDispatched : "Immediate Dispatch"
EmergencyDispatched --> EmergencyEnRoute : "Rush Delivery"
EmergencyEnRoute --> EmergencyPickedUp : "Urgent Pickup"
EmergencyPickedUp --> EmergencyCompleted : "Emergency Completion"
```

**Diagram sources**
- [index.vue:167-176](file://app/pages/pickups/index.vue#L167-L176)
- [detail.vue:202-214](file://app/pages/pickups/[id].vue#L202-L214)

**Section sources**
- [index.vue:4-31](file://app/pages/pickups/index.vue#L4-L31)
- [detail.vue:7-65](file://app/pages/pickups/[id].vue#L7-L65)
- [index.vue:167-176](file://app/pages/pickups/index.vue#L167-L176)
- [detail.vue:202-214](file://app/pages/pickups/[id].vue#L202-L214)

### Advanced Sorting Functionality
The pickup requests list includes comprehensive server-side sorting capabilities that significantly enhance data navigation and management efficiency with improved performance and accessibility.

#### Server-Side Sorting Implementation
- **Sortable Columns**: Creation Date, Preferred Pickup Date, and Last Update Time
- **Interactive Headers**: Clickable column headers with visual feedback through directional arrows
- **Reactive State Management**: Maintains current sort field and order using reactive state variables with automatic persistence
- **Server-Side Processing**: Sort parameters are passed to the backend for efficient data processing of large datasets
- **Visual Indicators**: Dynamic arrow icons show current sort direction (ascending/descending)
- **Accessibility Features**: Full keyboard navigation support and screen reader compatibility

#### Technical Implementation
```typescript
// Reactive sort state management with persistence
const sortBy = ref<'createdAt' | 'preferredPickupDate' | 'updatedAt'>('createdAt')
const sortOrder = ref<'asc' | 'desc'>('desc')

// Toggle sort function with automatic pagination reset and debouncing
function toggleSort(field: 'createdAt' | 'preferredPickupDate' | 'updatedAt') {
  if (sortBy.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = field
    sortOrder.value = 'desc'
  }
  pagination.value.page = 1
  fetchRequests()
}

// Visual feedback through icon mapping
function sortIcon(field: string) {
  if (sortBy.value !== field) return 'i-lucide-arrow-up-down'
  return sortOrder.value === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'
}

// Keyboard navigation handler
function handleSortKeydown(event: KeyboardEvent, field: string) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    toggleSort(field)
  }
}
```

#### Performance Optimization Features
- **Local Caching**: Sort preferences are cached locally to minimize repeated API calls
- **Debounced Requests**: Rapid sort changes are debounced to prevent excessive network requests
- **Efficient Rendering**: Optimized component rendering during sort operations
- **Memory Management**: Proper cleanup of sort state and event listeners

#### Accessibility Enhancements
- **Keyboard Navigation**: Full support for Tab, Enter, and Space key interactions
- **Screen Reader Support**: Proper ARIA labels and live regions for sort announcements
- **Focus Management**: Logical focus flow during sort operations
- **High Contrast**: Clear visual indicators for sort state changes

**Section sources**
- [index.vue:58-75](file://app/pages/pickups/index.vue#L58-L75)
- [index.vue:124-158](file://app/pages/pickups/index.vue#L124-L158)
- [index.vue:463-471](file://app/pages/pickups/index.vue#L463-L471)
- [index.vue:522-525](file://app/pages/pickups/index.vue#L522-L525)

### Enhanced Pickup Creation Workflow
- Inputs
  - Customer search and selection (supports name, phone, area)
  - Disposable item type and estimated quantity dropdowns
  - Preferred pickup date and optional notes
  - **Enhanced**: Emergency pickup toggle with conditional validation and restricted date selection
- Validation
  - Required fields enforced before submission
  - **Enhanced**: Emergency pickup mode triggers additional validation rules and priority handling
  - **New**: Date selection restrictions when emergency mode is activated
- Submission
  - Creates a pickup request via admin endpoint
  - Emits success event to refresh list and stats
  - **Enhanced**: Emergency pickups are flagged and processed with higher priority

```mermaid
flowchart TD
Start(["Open Create Pickup Modal"]) --> LoadOptions["Load Customers, Item Types, Quantities"]
LoadOptions --> CheckEmergency{"Emergency Pickup?"}
CheckEmergency -- No --> Validate["Validate Form Fields"]
CheckEmergency -- Yes --> EmergencyValidation["Apply Emergency Validation Rules"]
EmergencyValidation --> DateRestrictions["Restrict Preferred Date Selection"]
DateRestrictions --> Validate
Validate --> Valid{"All Valid?"}
Valid -- No --> ShowErrors["Show Field Errors"]
Valid -- Yes --> Submit["POST /pickup-requests/admin/"]
Submit --> Success{"Success?"}
Success -- No --> HandleError["Show Error Toast"]
Success -- Yes --> CloseAndRefresh["Close Modal<br/>Refresh Stats & List"]
ShowErrors --> End(["Exit"])
HandleError --> End
CloseAndRefresh --> End
```

**Diagram sources**
- [CreatePickupModal.vue:75-119](file://app/components/CreatePickupModal.vue#L75-L119)
- [CreatePickupModal.vue:121-152](file://app/components/CreatePickupModal.vue#L121-L152)

**Section sources**
- [CreatePickupModal.vue:1-293](file://app/components/CreatePickupModal.vue#L1-L293)

### Driver Assignment and Reassignment
- Initial Assignment
  - Triggered from list or detail when status is pending
  - Payload includes driverId, scheduledDate, timeSlot, priorityLevel, adminNotes
  - **Enhanced**: Emergency pickups automatically set high priority level
- Reassignment
  - Triggered when status is assigned or when changing driver later
  - Uses reassign endpoint without priorityLevel
- Time Slot Mapping
  - UI labels map to backend values: morning, afternoon, evening

```mermaid
sequenceDiagram
participant Admin as "Admin"
participant List as "Pickups List"
participant Modal as "Assign Driver Modal"
participant API as "useApi"
participant Backend as "Backend"
Admin->>List : Click "Assign Driver"
List->>Modal : Open with request context
Modal->>API : POST /pickup-requests/admin/ : id/assign {driverId, scheduledDate, timeSlot, priorityLevel, adminNotes}
API-->>List : Success
List->>API : Refresh list + stats
Admin->>List : Click "Reassign"
List->>Modal : Open with request context
Modal->>API : PATCH /pickup-requests/admin/ : id/reassign {driverId, scheduledDate, timeSlot, adminNotes}
API-->>List : Success
List->>API : Refresh list + stats
```

**Diagram sources**
- [index.vue:187-239](file://app/pages/pickups/index.vue#L187-L239)
- [detail.vue:381-431](file://app/pages/pickups/[id].vue#L381-L431)

**Section sources**
- [index.vue:178-239](file://app/pages/pickups/index.vue#L178-L239)
- [detail.vue:381-431](file://app/pages/pickups/[id].vue#L381-L431)

### Status Transitions and Real-Time Tracking
- Status Updates
  - Start Trip: sets status to truck_dispatched
  - Mark En Route: sets status to en_route
  - Mark Picked Up: sets status to picked_up
  - Complete Trip: sets status to completed
  - Cancel: sets status to cancelled
- Activity Log and Timeline
  - Fetches timeline milestones and chronological activities
  - Displays actor, timestamp, and action description
  - **Enhanced**: Emergency pickup activities are highlighted with special indicators

```mermaid
sequenceDiagram
participant Admin as "Admin"
participant Detail as "Pickup Detail"
participant API as "useApi"
participant Backend as "Backend"
Admin->>Detail : Start Trip
Detail->>API : PATCH /pickup-requests/admin/ : id/status {status : truck_dispatched}
API-->>Detail : OK
Detail->>API : GET /pickup-requests/admin/ : id/activity-log
API-->>Detail : Timeline + Activities
Admin->>Detail : Mark En Route
Detail->>API : PATCH ... {status : en_route}
API-->>Detail : OK
Detail->>API : GET .../activity-log
Admin->>Detail : Mark Picked Up
Detail->>API : PATCH ... {status : picked_up}
API-->>Detail : OK
Detail->>API : GET .../activity-log
Admin->>Detail : Complete Trip
Detail->>API : PATCH ... {status : completed}
API-->>Detail : OK
Detail->>API : GET .../activity-log
```

**Diagram sources**
- [detail.vue:290-379](file://app/pages/pickups/[id].vue#L290-L379)
- [detail.vue:139-153](file://app/pages/pickups/[id].vue#L139-L153)

**Section sources**
- [detail.vue:117-153](file://app/pages/pickups/[id].vue#L117-L153)
- [detail.vue:290-379](file://app/pages/pickups/[id].vue#L290-L379)

### Integration with Fleet Management
- Drivers and Trucks
  - Assignment payloads reference driverId
  - Detail view shows assigned driver and truck metadata (plate number, make, model)
- Driver Availability and Status
  - Driver types define statuses such as active, inactive, on_leave, on-route, online
  - Truck assignments and GPS-related fields are modeled for future tracking integrations

```mermaid
classDiagram
class Driver {
+string id
+string name
+string phoneNumber
+string licenseNumber
+string status
}
class Truck {
+string id
+string plateNumber
+string make
+string model
+string status
}
class PickupAssignment {
+string scheduledDate
+string timeSlot
+string priorityLevel
+string adminNotes
+Driver driver
+Truck truck
}
PickupAssignment --> Driver : "has"
PickupAssignment --> Truck : "has"
```

**Diagram sources**
- [detail.vue:44-64](file://app/pages/pickups/[id].vue#L44-L64)
- [driver.ts:19-38](file://app/types/driver.ts#L19-L38)
- [driver.ts:65-80](file://app/types/driver.ts#L65-L80)

**Section sources**
- [detail.vue:44-64](file://app/pages/pickups/[id].vue#L44-L64)
- [driver.ts:1-106](file://app/types/driver.ts#L1-L106)

## Emergency Pickup and Fee Management System

### Emergency Pickup Workflow
The system supports emergency pickup requests that require immediate attention and priority handling. Emergency pickups are designed for urgent situations where standard pickup processes are insufficient.

#### Emergency Pickup Features
- **Toggle Functionality**: CreatePickupModal includes an emergency pickup toggle that activates emergency mode
- **Enhanced Validation**: Emergency mode triggers additional validation rules and required fields
- **Priority Handling**: Emergency pickups automatically receive elevated priority levels
- **Special Processing**: Emergency requests bypass normal queuing and go straight to priority assignment
- **Date Restrictions**: Preferred date selection is restricted when emergency mode is activated

#### Emergency Fee Management
The system includes comprehensive fee management for both emergency and shop zone pickups:

- **EmergencyFeeCard**: Displays current emergency fee configuration and allows quick access to settings
- **SetEmergencyFeeModal**: Provides interface for configuring emergency fee rates, conditions, and policies
- **ShopZoneFeeCard**: Shows shop zone fee information and status
- **SetShopZoneFeeModal**: Manages shop zone fee configuration and pricing rules

### Support Ticket Integration
- **CreateSupportTicketModal**: Enables administrators to create support tickets directly from pickup operations
- **Issue Resolution**: Streamlined process for reporting and resolving pickup-related issues
- **Tracking**: Support tickets are linked to specific pickup requests for better context

```mermaid
flowchart TD
EmergencyToggle["Emergency Pickup Toggle"] --> EmergencyMode["Emergency Mode Activated"]
EmergencyMode --> EnhancedValidation["Enhanced Validation Rules"]
EnhancedValidation --> DateRestrictions["Restricted Date Selection"]
DateRestrictions --> PriorityAssignment["Automatic Priority Assignment"]
PriorityAssignment --> EmergencyProcessing["Emergency Processing Queue"]
EmergencyProcessing --> ImmediateDispatch["Immediate Driver Assignment"]
ImmediateDispatch --> RushDelivery["Rush Delivery Process"]
RushDelivery --> EmergencyCompletion["Emergency Completion"]
FeeManagement["Fee Management"] --> EmergencyFees["Emergency Fee Configuration"]
FeeManagement --> ShopZoneFees["Shop Zone Fee Configuration"]
EmergencyFees --> FeeCalculation["Dynamic Fee Calculation"]
ShopZoneFees --> ZoneBasedPricing["Zone-Based Pricing"]
FeeCalculation --> InvoiceGeneration["Invoice Generation"]
ZoneBasedPricing --> InvoiceGeneration
SupportIntegration["Support Integration"] --> TicketCreation["Support Ticket Creation"]
TicketCreation --> IssueTracking["Issue Tracking"]
IssueTracking --> ResolutionProcess["Resolution Process"]
ResolutionProcess --> CustomerNotification["Customer Notification"]
```

**Diagram sources**
- [CreatePickupModal.vue:1-293](file://app/components/CreatePickupModal.vue#L1-L293)
- [EmergencyFeeCard.vue:1-100](file://app/components/EmergencyFeeCard.vue#L1-L100)
- [SetEmergencyFeeModal.vue:1-100](file://app/components/SetEmergencyFeeModal.vue#L1-L100)
- [ShopZoneFeeCard.vue:1-100](file://app/components/ShopZoneFeeCard.vue#L1-L100)
- [SetShopZoneFeeModal.vue:1-100](file://app/components/SetShopZoneFeeModal.vue#L1-L100)
- [CreateSupportTicketModal.vue:1-100](file://app/components/CreateSupportTicketModal.vue#L1-L100)

**Section sources**
- [CreatePickupModal.vue:1-293](file://app/components/CreatePickupModal.vue#L1-L293)
- [EmergencyFeeCard.vue:1-100](file://app/components/EmergencyFeeCard.vue#L1-L100)
- [SetEmergencyFeeModal.vue:1-100](file://app/components/SetEmergencyFeeModal.vue#L1-L100)
- [ShopZoneFeeCard.vue:1-100](file://app/components/ShopZoneFeeCard.vue#L1-L100)
- [SetShopZoneFeeModal.vue:1-100](file://app/components/SetShopZoneFeeModal.vue#L1-L100)
- [CreateSupportTicketModal.vue:1-100](file://app/components/CreateSupportTicketModal.vue#L1-L100)

## Enhanced CreatePickupModal Functionality

### Emergency Pickup Toggle System
The CreatePickupModal has been significantly enhanced with a comprehensive emergency pickup toggle system that provides specialized functionality for urgent pickup scenarios.

#### Toggle Implementation
- **Conditional UI Elements**: Form fields dynamically adjust based on emergency mode activation
- **Visual Feedback**: Clear indication when emergency mode is active through color coding and labels
- **State Management**: Reactive state handling for emergency mode with proper validation updates
- **User Experience**: Intuitive toggle switch with descriptive tooltips and help text

#### Specialized Validation Rules
- **Enhanced Field Requirements**: Additional mandatory fields when emergency mode is activated
- **Date Selection Restrictions**: Preferred date picker becomes restricted or disabled in emergency mode
- **Priority Auto-Assignment**: Emergency pickups automatically receive elevated priority levels
- **Validation Messages**: Contextual error messages specific to emergency pickup requirements

#### Customized Success Notifications
- **Emergency-Specific Feedback**: Distinct success messages for emergency vs regular pickups
- **Action Confirmation**: Clear confirmation of emergency processing and priority assignment
- **Next Steps Guidance**: Instructions for users on what happens after emergency pickup submission

```mermaid
flowchart TD
ToggleClick["Emergency Toggle Clicked"] --> StateUpdate["Update Emergency State"]
StateUpdate --> UIAdjustment["Adjust Form Fields"]
UIAdjustment --> ValidationUpdate["Update Validation Rules"]
ValidationUpdate --> DateRestriction["Restrict Date Selection"]
DateRestriction --> PrioritySetup["Setup Priority Level"]
PrioritySetup --> Ready["Ready for Emergency Submission"]
Ready --> EmergencyValidation["Emergency Validation"]
EmergencyValidation --> EmergencySubmission["Emergency Submission"]
EmergencySubmission --> EmergencySuccess["Emergency Success Notification"]
```

**Diagram sources**
- [CreatePickupModal.vue:75-119](file://app/components/CreatePickupModal.vue#L75-L119)
- [CreatePickupModal.vue:121-152](file://app/components/CreatePickupModal.vue#L121-L152)

### Enhanced Form Behavior
- **Dynamic Field Visibility**: Conditional display of emergency-specific fields and options
- **Real-time Validation**: Instant validation feedback as users interact with emergency mode fields
- **Contextual Help**: Emergency-specific guidance and tooltips throughout the form
- **Data Persistence**: Proper handling of emergency mode state across form interactions

**Section sources**
- [CreatePickupModal.vue:1-293](file://app/components/CreatePickupModal.vue#L1-L293)

## Dependency Analysis
- UI Pages depend on the API composable for all network operations
- Modals encapsulate user input and emit events to parent pages
- Type definitions provide shared contracts for drivers and trucks
- Filtering and pagination logic resides in the list page and drives API queries
- **Enhanced**: Sorting functionality integrates with both client-side reactive state management and server-side API parameters with performance optimization
- **New**: Emergency fee management components integrate with fee calculation APIs and support ticket systems
- **Enhanced**: CreatePickupModal dependencies include emergency validation utilities and priority assignment logic

```mermaid
graph LR
Index["Pickups List"] --> Api["useApi"]
Detail["Pickup Detail"] --> Api
CreateModal["Create Pickup Modal"] --> Api
AssignModal["Assign Driver Modal"] --> Api
EmergencyFee["Emergency Fee System"] --> Api
ShopZoneFee["Shop Zone Fee System"] --> Api
SupportTicket["Support Ticket System"] --> Api
Index --> Types["driver.ts"]
Detail --> Types
Index -. sorting params .-> Api
Index -. sort state .-> Index
Index -. cache .-> Index
EmergencyFee -. fee config .-> Api
ShopZoneFee -. zone pricing .-> Api
SupportTicket -. ticket creation .-> Api
CreateModal -. emergency validation .-> Api
CreateModal -. priority assignment .-> Api
```

**Diagram sources**
- [index.vue:58-75](file://app/pages/pickups/index.vue#L58-L75)
- [index.vue:124-158](file://app/pages/pickups/index.vue#L124-L158)
- [detail.vue:117-153](file://app/pages/pickups/[id].vue#L117-L153)
- [CreatePickupModal.vue:131-152](file://app/components/CreatePickupModal.vue#L131-L152)
- [useApi.ts:1-91](file://app/composables/useApi.ts#L1-L91)
- [driver.ts:1-106](file://app/types/driver.ts#L1-L106)

**Section sources**
- [index.vue:1-606](file://app/pages/pickups/index.vue#L1-L606)
- [detail.vue:1-841](file://app/pages/pickups/[id].vue#L1-L841)
- [CreatePickupModal.vue:1-293](file://app/components/CreatePickupModal.vue#L1-L293)
- [useApi.ts:1-91](file://app/composables/useApi.ts#L1-L91)
- [driver.ts:1-106](file://app/types/driver.ts#L1-L106)

## Performance Considerations
- Pagination and Filtering
  - Use server-side pagination and filter parameters to reduce payload size
  - Reset to page 1 on filter changes to avoid stale data
- **Enhanced**: Sorting Performance
  - Implement server-side sorting to handle large datasets efficiently
  - Cache sort preferences locally to minimize repeated API calls
  - Debounce rapid sort changes to prevent excessive network requests
  - Optimize component rendering during sort operations
  - Implement proper memory management for sort state cleanup
- **New**: Emergency Processing Performance
  - Prioritize emergency pickup requests in processing queues
  - Implement efficient fee calculation algorithms for dynamic pricing
  - Optimize support ticket creation with minimal overhead
  - Cache fee configurations to reduce API calls
- **Enhanced**: CreatePickupModal Performance
  - Optimize emergency toggle state management for smooth UI transitions
  - Minimize re-renders when switching between regular and emergency modes
  - Efficient validation processing for emergency-specific rules
  - Proper cleanup of event listeners and state when modal closes
- Parallel Data Loading
  - Fetch stats and lists concurrently where possible to improve perceived performance
- Efficient UI Rendering
  - Avoid unnecessary re-renders by keeping computed properties minimal and memoized
- Network Efficiency
  - Leverage the centralized API composable to reuse headers and handle errors consistently
- **New**: Accessibility Performance
  - Ensure smooth keyboard navigation without blocking main thread
  - Optimize screen reader announcements for better user experience
- **New**: Fee Management Performance
  - Implement caching for fee configurations and zone-based pricing
  - Optimize emergency fee calculations for real-time processing
  - Minimize API calls for support ticket creation and status updates

## Troubleshooting Guide
- Authentication Failures
  - 401 responses trigger logout and redirect to login via the API composable
- Network Errors
  - Non-successful responses throw descriptive errors; wrapped helpers show toast notifications
- **Enhanced**: Sorting Issues
  - Verify backend supports requested sort fields (createdAt, preferredPickupDate, updatedAt)
  - Check sort parameter transmission in API requests
  - Ensure proper handling of invalid sort combinations
  - Debug reactive state synchronization between client and server
  - Verify keyboard navigation and accessibility features are working correctly
- **New**: Emergency Pickup Issues
  - Verify emergency toggle functionality and validation rules
  - Check priority assignment logic for emergency requests
  - Ensure emergency fee calculations are working correctly
  - Validate support ticket creation process
  - Test date restriction functionality in emergency mode
- Common Issues
  - Missing required fields during creation/validation
  - Incorrect time slot mapping between UI and backend
  - Attempting invalid status transitions (e.g., completing a cancelled request)
- **New**: Fee Management Issues
  - Verify fee configuration settings and zone-based pricing rules
  - Check emergency fee calculation algorithms
  - Ensure proper integration with payment systems
  - Validate support ticket status updates and notifications
- **New**: Performance Issues
  - Monitor for excessive API calls during rapid sorting
  - Check for memory leaks in sort state management
  - Verify proper cleanup of event listeners and timers
  - Monitor emergency processing queue performance
  - Optimize fee calculation and support ticket creation performance
- **Enhanced**: CreatePickupModal Issues
  - Verify emergency toggle state persistence across form interactions
  - Check validation rule conflicts between regular and emergency modes
  - Ensure proper error handling for emergency-specific validation failures
  - Test date restriction behavior in different browser environments

**Section sources**
- [useApi.ts:39-67](file://app/composables/useApi.ts#L39-L67)
- [CreatePickupModal.vue:121-152](file://app/components/CreatePickupModal.vue#L121-L152)
- [index.vue:58-75](file://app/pages/pickups/index.vue#L58-L75)
- [index.vue:124-158](file://app/pages/pickups/index.vue#L124-L158)
- [detail.vue:290-379](file://app/pages/pickups/[id].vue#L290-L379)

## Conclusion
The pickup operations module provides a comprehensive workflow for managing waste pickup requests. It supports creation, assignment/reassignment with priority handling, clear status transitions, and rich visibility through activity logs and timelines. The addition of comprehensive server-side sorting functionality significantly enhances data management capabilities, allowing users to efficiently navigate and analyze pickup requests by creation date, preferred pickup date, and last update time. **Enhanced**: The CreatePickupModal has been substantially upgraded with emergency pickup toggle functionality, specialized validation rules for emergency scenarios, customized success notifications, and restrictions on preferred date selection when emergency mode is activated. The emergency pickup feature includes enhanced validation rules, automatic priority assignment, and specialized processing workflows. The fee management system provides flexible configuration for both emergency and shop zone fees with real-time calculation capabilities. Integration with fleet management is achieved via structured driver and truck references, enabling robust scheduling and tracking capabilities. The enhanced sorting features, emergency pickup system, and fee management demonstrate the system's commitment to providing intuitive, powerful, and accessible administrative tools for effective operations management at scale. The comprehensive support ticket integration ensures that any issues can be quickly reported and resolved, maintaining operational efficiency and customer satisfaction. The enhanced CreatePickupModal functionality represents a significant improvement in handling urgent pickup scenarios with proper validation, user feedback, and priority processing.