# Pickup Operations

<cite>
**Referenced Files in This Document**
- [index.vue](file://app/pages/pickups/index.vue)
- [detail.vue](file://app/pages/pickups/[id].vue)
- [AdjustLoadModal.vue](file://app/components/AdjustLoadModal.vue)
- [AssignDriverModal.vue](file://app/components/AssignDriverModal.vue)
- [CreatePickupModal.vue](file://app/components/CreatePickupModal.vue)
- [EmergencyFeeCard.vue](file://app/components/EmergencyFeeCard.vue)
- [SetEmergencyFeeModal.vue](file://app/components/SetEmergencyFeeModal.vue)
- [ShopZoneFeeCard.vue](file://app/components/ShopZoneFeeCard.vue)
- [SetShopZoneFeeModal.vue](file://app/components/SetShopZoneFeeModal.vue)
- [CreateSupportTicketModal.vue](file://app/components/CreateSupportTicketModal.vue)
- [AssignDriverToTruckModal.vue](file://app/components/AssignDriverToTruckModal.vue)
- [useApi.ts](file://app/composables/useApi.ts)
- [usePermissions.ts](file://app/composables/usePermissions.ts)
- [driver.ts](file://app/types/driver.ts)
- [subscription.ts](file://app/types/subscription.ts)
- [rates.vue](file://app/pages/management/rates.vue)
- [CustomerModal.vue](file://app/components/CustomerModal.vue)
</cite>

## Update Summary
**Changes Made**
- Added comprehensive load adjustment system with new AdjustLoadModal component supporting per_bin and full_truck pricing modes
- Enhanced AssignDriverModal with improved form state management and validation
- Enhanced pickup detail page with load adjustment capabilities and permission-based access controls
- Integrated permission system for load adjustment functionality
- Added support for actual load tracking and settlement processing

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Emergency Pickup and Fee Management System](#emergency-pickup-and-fee-management-system)
7. [Enhanced CreatePickupModal Functionality](#enhanced-createpickupmodal-functionality)
8. [Load Adjustment System](#load-adjustment-system)
9. [Pricing Mode and Truck Load Tier System](#pricing-mode-and-truck-load-tier-system)
10. [Permission-Based Access Controls](#permission-based-access-controls)
11. [Dependency Analysis](#dependency-analysis)
12. [Performance Considerations](#performance-considerations)
13. [Troubleshooting Guide](#troubleshooting-guide)
14. [Conclusion](#conclusion)

## Introduction
This document explains the end-to-end Pickup Operations management in the console application. It covers the pickup request lifecycle from creation to completion, including driver assignment and reassignment workflows, status transitions, priority handling, and integration with fleet management (drivers and trucks). The system now includes a comprehensive emergency pickup and fee management system that allows administrators to handle urgent pickup requests and manage associated fees. **Updated**: The system has been enhanced with a comprehensive load adjustment system that supports both per_bin and full_truck pricing modes, allowing operators to adjust actual collected loads after initial booking. The AssignDriverModal has been improved with better form state management and validation, while the pickup detail page now includes permission-based access controls for load adjustment functionality.

## Project Structure
The pickup operations are implemented primarily through:
- A list page for browsing, filtering, sorting, and assigning/reassigning pickups
- A detail page for deep inspection, status progression, activity log review, and load adjustment
- Modal components for creating requests, assigning drivers, adjusting loads, and managing emergency fees
- An API composable that centralizes HTTP calls and error handling
- Type definitions for drivers, trucks, and subscriptions used by the UI
- Emergency fee management components for handling urgent pickup scenarios
- Pricing mode management for different customer types (per_bin vs full_truck)
- **New**: Permission system integration for access control
- **New**: Load adjustment modal for post-booking load modifications

```mermaid
graph TB
subgraph "UI Pages"
PList["Pickups List<br/>app/pages/pickups/index.vue"]
PDetail["Pickup Detail<br/>app/pages/pickups/[id].vue"]
RatesPage["Rates Management<br/>app/pages/management/rates.vue"]
end
subgraph "Modals"
CreateM["Create Pickup Modal<br/>app/components/CreatePickupModal.vue"]
AssignM["Assign Driver Modal<br/>app/components/AssignDriverModal.vue"]
AdjustM["Adjust Load Modal<br/>app/components/AdjustLoadModal.vue"]
EmergencyFee["Emergency Fee Card<br/>app/components/EmergencyFeeCard.vue"]
SetEmergencyFee["Set Emergency Fee Modal<br/>app/components/SetEmergencyFeeModal.vue"]
ShopZoneFee["Shop Zone Fee Card<br/>app/components/ShopZoneFeeCard.vue"]
SetShopZoneFee["Set Shop Zone Fee Modal<br/>app/components/SetShopZoneFeeModal.vue"]
SupportTicket["Create Support Ticket Modal<br/>app/components/CreateSupportTicketModal.vue"]
CustomerModal["Customer Modal<br/>app/components/CustomerModal.vue"]
end
subgraph "Shared"
Api["API Composable<br/>app/composables/useApi.ts"]
Permissions["Permissions Composable<br/>app/composables/usePermissions.ts"]
Types["Fleet Types<br/>app/types/driver.ts"]
SubTypes["Subscription Types<br/>app/types/subscription.ts"]
end
PList --> CreateM
PList --> AssignM
PList --> EmergencyFee
PList --> ShopZoneFee
PDetail --> AssignM
PDetail --> AdjustM
PDetail --> SupportTicket
CreateM --> Api
AssignM --> Api
AdjustM --> Api
EmergencyFee --> Api
SetEmergencyFee --> Api
ShopZoneFee --> Api
SetShopZoneFee --> Api
SupportTicket --> Api
CustomerModal --> Api
RatesPage --> Api
PDetail --> Permissions
PList -. uses .-> Types
PDetail -. uses .-> Types
CreateM -. uses .-> SubTypes
CustomerModal -. uses .-> SubTypes
```

**Diagram sources**
- [index.vue:1-627](file://app/pages/pickups/index.vue#L1-L627)
- [detail.vue:1-901](file://app/pages/pickups/[id].vue#L1-L901)
- [AdjustLoadModal.vue:1-197](file://app/components/AdjustLoadModal.vue#L1-L197)
- [AssignDriverModal.vue:1-260](file://app/components/AssignDriverModal.vue#L1-L260)
- [CreatePickupModal.vue:1-416](file://app/components/CreatePickupModal.vue#L1-L416)
- [useApi.ts:1-91](file://app/composables/useApi.ts#L1-L91)
- [usePermissions.ts:1-43](file://app/composables/usePermissions.ts#L1-L43)

**Section sources**
- [index.vue:1-627](file://app/pages/pickups/index.vue#L1-L627)
- [detail.vue:1-901](file://app/pages/pickups/[id].vue#L1-L901)
- [AdjustLoadModal.vue:1-197](file://app/components/AdjustLoadModal.vue#L1-L197)
- [AssignDriverModal.vue:1-260](file://app/components/AssignDriverModal.vue#L1-L260)
- [useApi.ts:1-91](file://app/composables/useApi.ts#L1-L91)
- [usePermissions.ts:1-43](file://app/composables/usePermissions.ts#L1-L43)

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
  - **Enhanced**: Now includes load adjustment capabilities with permission-based access controls
  - Displays a timeline and detailed activity log
  - Support ticket creation capability for issue resolution
- **New**: Adjust Load Modal
  - Handles post-booking load adjustments for both per_bin and full_truck pricing modes
  - Validates that actual loads exceed booked amounts
  - Processes settlement calculations and payment prompts
  - Integrates with truck load tier system for full_truck customers
- **Enhanced**: Assign Driver Modal
  - Improved form state management with better validation
  - Enhanced driver selection with zone-based filtering
  - Better user experience with loading states and error handling
- Create Pickup Modal
  - Collects customer selection, disposable item type, estimated quantity, preferred date, and notes
  - Includes emergency pickup toggle functionality with specialized validation rules and restricted date selection for emergency scenarios
  - Truck load tier dropdown for full_truck customers with conditional field visibility
  - Automatic payment type resolution based on customer subscription state
  - Strengthened validation logic for truck load tier selection and pricing mode requirements
  - Submits a new pickup request via admin endpoint with emergency mode support
- Emergency Fee Management Components
  - EmergencyFeeCard.vue: Displays and manages emergency fee information
  - SetEmergencyFeeModal.vue: Configures emergency fee settings and rates
- Shop Zone Fee Management Components
  - ShopZoneFeeCard.vue: Shows shop zone fee details and status
  - SetShopZoneFeeModal.vue: Manages shop zone fee configuration
- Support Ticket Creation
  - CreateSupportTicketModal.vue: Creates support tickets for pickup-related issues
- Customer Management Modal
  - Conditional field visibility based on customer type pricing mode (per_bin vs full_truck)
  - Dynamic form fields for bin capacity and assigned bins based on pricing mode
- API Composable
  - Centralized fetch wrapper with auth header injection, unified error handling, and typed helpers
- **New**: Permissions Composable
  - Provides permission checking utilities for access control
  - Supports role-based and permission-based access control
- Fleet Types
  - Shared TypeScript interfaces for drivers, trucks, zones, and tracking data
- Subscription Types
  - Comprehensive subscription type definitions supporting both plan-based and calculated pricing models

**Section sources**
- [index.vue:1-627](file://app/pages/pickups/index.vue#L1-L627)
- [detail.vue:1-901](file://app/pages/pickups/[id].vue#L1-L901)
- [AdjustLoadModal.vue:1-197](file://app/components/AdjustLoadModal.vue#L1-L197)
- [AssignDriverModal.vue:1-260](file://app/components/AssignDriverModal.vue#L1-L260)
- [CreatePickupModal.vue:1-416](file://app/components/CreatePickupModal.vue#L1-L416)
- [useApi.ts:1-91](file://app/composables/useApi.ts#L1-L91)
- [usePermissions.ts:1-43](file://app/composables/usePermissions.ts#L1-L43)

## Architecture Overview
The frontend orchestrates pickup operations by calling admin endpoints for listing, creating, assigning/reassigning, updating statuses, and adjusting loads. The detail view enriches context with an activity log, timeline, and load adjustment capabilities. The list view supports advanced server-side sorting with dynamic parameter passing, reactive state management, and performance optimization. The architecture includes integrated emergency pickup and fee management systems with dedicated components for fee configuration and support ticket creation. **Updated**: The system now supports dual pricing modes (per_bin and full_truck) with dynamic form field visibility and validation based on customer type pricing mode, plus comprehensive load adjustment capabilities with permission-based access controls.

```mermaid
sequenceDiagram
participant Admin as "Admin User"
participant List as "Pickups List Page"
participant Detail as "Pickup Detail Page"
participant AdjustModal as "Adjust Load Modal"
participant AssignModal as "Assign Driver Modal"
participant PricingMode as "Pricing Mode System"
participant TruckTier as "Truck Load Tier System"
participant Permissions as "Permission System"
participant API as "useApi.ts"
participant Backend as "Backend API"
Admin->>List : Open /pickups
List->>API : GET /pickup-requests/admin/list?filters&sortBy&sortOrder
API-->>List : { data[], pagination }
Admin->>Detail : Open /pickups/ : id
Detail->>Permissions : Check 'pickups.manage' permission
Permissions-->>Detail : Permission granted/denied
Detail->>API : GET /pickup-requests/admin/ : id
API-->>Detail : Request + assignment + pricing info
Admin->>Detail : Click "Adjust Load"
Detail->>AdjustModal : Show with pricing mode & current bins
AdjustModal->>API : GET /rates/truck-loads (if full_truck)
API-->>AdjustModal : Truck load tiers
AdjustModal->>API : PATCH /pickup-requests/admin/ : id/actual-load
API-->>AdjustModal : Delta amount + settlement
AdjustModal-->>Detail : Success event
Detail->>API : Refresh details + activity-log
Admin->>Detail : Start Trip / En Route / Picked Up / Complete
Detail->>API : PATCH /pickup-requests/admin/ : id/status
API-->>Detail : Updated
Admin->>List : Click "Assign Driver"
List->>AssignModal : Open with request context
AssignModal->>API : POST /pickup-requests/admin/ : id/assign
API-->>List : Success
List->>API : Refresh list + stats
```

**Diagram sources**
- [detail.vue:301-315](file://app/pages/pickups/[id].vue#L301-L315)
- [detail.vue:811-820](file://app/pages/pickups/[id].vue#L811-L820)
- [AdjustLoadModal.vue:51-120](file://app/components/AdjustLoadModal.vue#L51-L120)
- [AssignDriverModal.vue:38-77](file://app/components/AssignDriverModal.vue#L38-L77)
- [usePermissions.ts:3-43](file://app/composables/usePermissions.ts#L3-L43)

**Section sources**
- [detail.vue:1-901](file://app/pages/pickups/[id].vue#L1-L901)
- [AdjustLoadModal.vue:1-197](file://app/components/AdjustLoadModal.vue#L1-L197)
- [AssignDriverModal.vue:1-260](file://app/components/AssignDriverModal.vue#L1-L260)
- [usePermissions.ts:1-43](file://app/composables/usePermissions.ts#L1-L43)

## Detailed Component Analysis

### Data Models and Status Lifecycle
- Pickup Request Model
  - Identifiers and timestamps: id, createdAt, updatedAt
  - Customer reference and nested customer details (name, phone, address, region, etc.)
  - Disposable item type and estimated quantity references
  - Assignment object with driver and truck details when available
  - Operational fields: preferredPickupDate, additionalNotes, status, paymentType, paymentStatus
  - Emergency pickup flag and associated fee information
  - **Enhanced**: truckLoadRateId, truckLoadLabel, pricingMode, loadAdjustedAt for load adjustment tracking
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
- **Enhanced**: Pricing Modes
  - per_bin: Automatic pricing based on bin capacity × number of bins
  - full_truck: Manual truck load tier selection at booking time
- **New**: Load Adjustment Tracking
  - loadAdjustedAt timestamp tracks when load was adjusted
  - Supports delta amount calculation and settlement processing

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
Note over Pending,Completed : "Load Adjustment Available"
```

**Diagram sources**
- [index.vue:191-200](file://app/pages/pickups/index.vue#L191-L200)
- [detail.vue:211-233](file://app/pages/pickups/[id].vue#L211-L233)

**Section sources**
- [index.vue:1-627](file://app/pages/pickups/index.vue#L1-L627)
- [detail.vue:1-901](file://app/pages/pickups/[id].vue#L1-L901)

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
- [index.vue:60-77](file://app/pages/pickups/index.vue#L60-L77)
- [index.vue:126-160](file://app/pages/pickups/index.vue#L126-L160)

### Enhanced Pickup Creation Workflow
- Inputs
  - Customer search and selection (supports name, phone, area)
  - Disposable item type and estimated quantity dropdowns
  - Preferred pickup date and optional notes
  - Emergency pickup toggle with conditional validation and restricted date selection
  - Truck load tier dropdown for full_truck customers with conditional visibility
- Validation
  - Required fields enforced before submission
  - Emergency pickup mode triggers additional validation rules and priority handling
  - Truck load tier validation for full_truck customers
  - Pricing mode-based field validation (per_bin vs full_truck)
  - Date selection restrictions when emergency mode is activated
- Submission
  - Creates a pickup request via admin endpoint
  - Emits success event to refresh list and stats
  - Emergency pickups are flagged and processed with higher priority
  - Automatic payment type resolution based on customer subscription state
  - Conditional payload construction based on pricing mode

```mermaid
flowchart TD
Start(["Open Create Pickup Modal"]) --> LoadOptions["Load Customers, Item Types, Quantities"]
LoadOptions --> LoadPricingModes["Load Customer Type Pricing Modes"]
LoadPricingModes --> CheckEmergency{"Emergency Pickup?"}
CheckEmergency -- No --> Validate["Validate Form Fields"]
CheckEmergency -- Yes --> EmergencyValidation["Apply Emergency Validation Rules"]
EmergencyValidation --> DateRestrictions["Restrict Preferred Date Selection"]
DateRestrictions --> Validate
Validate --> CheckPricingMode{"Full Truck Customer?"}
CheckPricingMode -- No --> PerBinValidation["Per Bin Validation"]
CheckPricingMode -- Yes --> TruckTierValidation["Truck Load Tier Validation"]
TruckTierValidation --> Validate
PerBinValidation --> Valid{"All Valid?"}
TruckTierValidation --> Valid
Valid -- No --> ShowErrors["Show Field Errors"]
Valid -- Yes --> Submit["POST /pickup-requests/admin/"]
Submit --> Success{"Success?"}
Success -- No --> HandleError["Show Error Toast"]
Success -- Yes --> CloseAndRefresh["Close Modal<br/>Refresh Stats & List"]
ShowErrors --> End(["Exit"])
HandleError --> End
CloseAndRefresh --> End
```

**Section sources**
- [CreatePickupModal.vue:1-416](file://app/components/CreatePickupModal.vue#L1-L416)

### Enhanced Driver Assignment and Reassignment
- Initial Assignment
  - Triggered from list or detail when status is pending
  - Payload includes driverId, scheduledDate, timeSlot, priorityLevel, adminNotes
  - Emergency pickups automatically set high priority level
- **Enhanced**: Reassignment
  - Triggered when status is assigned or when changing driver later
  - Uses reassign endpoint without priorityLevel
  - Improved form state management with better validation
  - Zone-based driver filtering for better assignment accuracy
- Time Slot Mapping
  - UI labels map to backend values: morning, afternoon, evening

```mermaid
sequenceDiagram
participant Admin as "Admin"
participant List as "Pickups List"
participant Detail as "Pickup Detail"
participant AssignModal as "Assign Driver Modal"
participant API as "useApi"
participant Backend as "Backend"
Admin->>List : Click "Assign Driver"
List->>AssignModal : Open with request context
AssignModal->>API : GET /drivers/admin/by-zone/ : zoneId
API-->>AssignModal : Active drivers
AssignModal->>API : POST /pickup-requests/admin/ : id/assign
API-->>List : Success
List->>API : Refresh list + stats
Admin->>Detail : Click "Reassign"
Detail->>AssignModal : Open with request context
AssignModal->>API : PATCH /pickup-requests/admin/ : id/reassign
API-->>Detail : Success
Detail->>API : Refresh details + activity-log
```

**Diagram sources**
- [AssignDriverModal.vue:38-77](file://app/components/AssignDriverModal.vue#L38-L77)
- [detail.vue:408-462](file://app/pages/pickups/[id].vue#L408-L462)

**Section sources**
- [AssignDriverModal.vue:1-260](file://app/components/AssignDriverModal.vue#L1-L260)
- [detail.vue:408-462](file://app/pages/pickups/[id].vue#L408-L462)

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
  - Emergency pickup activities are highlighted with special indicators

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

**Section sources**
- [detail.vue:317-406](file://app/pages/pickups/[id].vue#L317-L406)

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

**Section sources**
- [detail.vue:49-69](file://app/pages/pickups/[id].vue#L49-L69)
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

**Section sources**
- [CreatePickupModal.vue:1-416](file://app/components/CreatePickupModal.vue#L1-L416)
- [EmergencyFeeCard.vue:1-100](file://app/components/EmergencyFeeCard.vue#L1-L100)
- [SetEmergencyFeeModal.vue:1-100](file://app/components/SetEmergencyFeeModal.vue#L1-L100)
- [ShopZoneFeeCard.vue:1-100](file://app/components/ShopZoneFeeCard.vue#L1-L100)
- [SetShopZoneFeeModal.vue:1-100](file://app/components/SetShopZoneFeeModal.vue#L1-L100)
- [CreateSupportTicketModal.vue:1-100](file://app/components/CreateSupportTicketModal.vue#L1-L100)

## Enhanced CreatePickupModal Functionality

### Emergency Pickup Toggle System
The CreatePickupModal includes a comprehensive emergency pickup toggle system that provides specialized functionality for urgent pickup scenarios.

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

**Section sources**
- [CreatePickupModal.vue:1-416](file://app/components/CreatePickupModal.vue#L1-L416)

## Load Adjustment System

### New Load Adjustment Capabilities
The system now includes comprehensive load adjustment functionality that allows operators to modify actual collected loads after initial booking, supporting both per_bin and full_truck pricing modes.

#### AdjustLoadModal Component
- **Dual Pricing Mode Support**: Handles both per_bin (actual bins input) and full_truck (truck load tier selection) pricing modes
- **Validation Logic**: Ensures actual loads exceed booked amounts with appropriate error messaging
- **Settlement Processing**: Calculates delta amounts and determines settlement methods (payment prompt or deferred invoicing)
- **Permission-Based Access**: Requires 'pickups.manage' permission for load adjustment functionality

#### Load Adjustment Workflow
- **Eligibility Check**: Only available for non-completed/non-cancelled pickups that haven't been adjusted yet
- **Real-time Validation**: Validates inputs against current booking data and pricing mode
- **Backend Integration**: Calls `/pickup-requests/admin/:id/actual-load` endpoint with appropriate payload
- **Success Handling**: Triggers detail page refresh and activity log updates

#### Settlement Processing
- **Payment Prompt**: For immediate payment collection, sends payment prompt to customer
- **Deferred Invoicing**: Adds extra charges to customer's next invoice
- **Amount Calculation**: Computes delta amounts based on pricing mode and selected adjustments

```mermaid
flowchart TD
LoadAdjust["Load Adjustment Request"] --> CheckPermission{"Has 'pickups.manage' permission?"}
CheckPermission -- No --> DenyAccess["Deny Access"]
CheckPermission -- Yes --> CheckEligible{"Pickup eligible for adjustment?"}
CheckEligible -- No --> ShowDisabled["Show Disabled Button"]
CheckEligible -- Yes --> ShowModal["Show AdjustLoadModal"]
ShowModal --> CheckPricingMode{"Pricing Mode?"}
CheckPricingMode -- per_bin --> BinInput["Input Actual Bins"]
CheckPricingMode -- full_truck --> TierSelect["Select Truck Load Tier"]
BinInput --> ValidateBins{"Bins > Booked Bins?"}
TierSelect --> ValidateTier{"Tier > Booked Tier?"}
ValidateBins -- No --> ShowError["Show Validation Error"]
ValidateTier -- No --> ShowError
ValidateBins -- Yes --> CalculateDelta["Calculate Delta Amount"]
ValidateTier -- Yes --> CalculateDelta
CalculateDelta --> DetermineSettlement{"Settlement Method?"}
DetermineSettlement -- payment_prompt --> SendPayment["Send Payment Prompt"]
DetermineSettlement -- deferred_to_invoice --> AddToInvoice["Add to Next Invoice"]
SendPayment --> Success["Success Event"]
AddToInvoice --> Success
Success --> RefreshData["Refresh Details & Activity Log"]
```

**Diagram sources**
- [AdjustLoadModal.vue:35-120](file://app/components/AdjustLoadModal.vue#L35-L120)
- [detail.vue:303-315](file://app/pages/pickups/[id].vue#L303-L315)
- [detail.vue:811-820](file://app/pages/pickups/[id].vue#L811-L820)

**Section sources**
- [AdjustLoadModal.vue:1-197](file://app/components/AdjustLoadModal.vue#L1-L197)
- [detail.vue:303-315](file://app/pages/pickups/[id].vue#L303-L315)
- [detail.vue:811-820](file://app/pages/pickups/[id].vue#L811-L820)

## Pricing Mode and Truck Load Tier System

### Dual Pricing Mode Architecture
The system supports two distinct pricing modes based on customer type:

#### Per Bin Pricing Mode
- **Automatic Pricing**: Calculated based on bin capacity × number of bins
- **Form Fields**: Shows Bin Capacity dropdown and Assigned BINs counter
- **Validation**: Requires both capacityRateId and noBins fields
- **Use Cases**: Hospitality, Household customers with predictable bin usage

#### Full Truck Pricing Mode
- **Manual Selection**: Truck load tier selected at booking time
- **Form Fields**: Shows Truck Load Tier dropdown only
- **Validation**: Requires truckLoadRateId field selection
- **Use Cases**: Construction, Industrial customers with variable load sizes

### Truck Load Tier Management
- **Dynamic Loading**: Truck load tiers fetched from `/rates/truck-loads` endpoint
- **Conditional Display**: Only shown for full_truck customers
- **Validation**: Mandatory selection with contextual error messages
- **Rate Information**: Each tier includes prepayRate, postpayRate, and binEquivalent

### Customer Type Pricing Mode Detection
- **Initial Load**: Customer type pricing modes loaded once on component mount
- **Caching**: Local cache maintains pricing mode for each customer type
- **Real-time Updates**: Pricing mode changes reflected immediately in form fields
- **Fallback Handling**: Default to per_bin mode if pricing mode not specified

### Enhanced Validation Logic
- **Conditional Requirements**: Different validation rules based on pricing mode
- **Field Dependencies**: Related fields validated together for consistency
- **Error Messaging**: Contextual error messages guide users through required selections
- **State Synchronization**: Form state updates trigger appropriate validation rules

```mermaid
flowchart TD
CustomerSelection["Customer Selected"] --> GetPricingMode["Get Customer Type Pricing Mode"]
GetPricingMode --> CheckMode{"Pricing Mode?"}
CheckMode -- per_bin --> ShowBinFields["Show Bin Capacity + Assigned BINs"]
CheckMode -- full_truck --> ShowTruckFields["Show Truck Load Tier Dropdown"]
ShowBinFields --> BinValidation["Validate Bin Fields"]
ShowTruckFields --> TruckValidation["Validate Truck Load Tier"]
BinValidation --> PerBinSubmission["Submit with capacityRateId + noBins"]
TruckValidation --> FullTruckSubmission["Submit with truckLoadRateId"]
PerBinSubmission --> AutoPayment["Auto-resolve payment type"]
FullTruckSubmission --> AutoPayment
AutoPayment --> BackendProcessing["Backend Processing"]
```

**Section sources**
- [CreatePickupModal.vue:1-416](file://app/components/CreatePickupModal.vue#L1-L416)
- [CustomerModal.vue:140-339](file://app/components/CustomerModal.vue#L140-L339)
- [rates.vue:1-200](file://app/pages/management/rates.vue#L1-L200)
- [subscription.ts:1-66](file://app/types/subscription.ts#L1-L66)

## Permission-Based Access Controls

### New Permission System Integration
The system now includes comprehensive permission-based access controls for sensitive operations like load adjustment.

#### Permission Checking
- **usePermissions Composable**: Provides centralized permission checking utilities
- **Role-Based Access**: Supports both permission-based and role-based access control
- **Contextual Access**: Different permissions required for different operations
- **Real-time Evaluation**: Permissions evaluated at runtime for dynamic UI control

#### Load Adjustment Permissions
- **Required Permission**: 'pickups.manage' permission needed for load adjustment
- **Conditional UI**: Adjust Load button only shown when user has required permissions
- **Status-Based Access**: Load adjustment disabled for completed/cancelled pickups
- **One-Time Adjustment**: Prevents multiple adjustments with loadAdjustedAt tracking

#### Permission Flow
```mermaid
flowchart TD
UserAction["User Attempts Load Adjustment"] --> CheckPermission["Check 'pickups.manage' permission"]
CheckPermission --> HasPerm{"Has Permission?"}
HasPerm -- No --> ShowDenied["Hide Adjust Load Button"]
HasPerm -- Yes --> CheckStatus{"Check Pickup Status"}
CheckStatus --> StatusOK{"Not completed/cancelled?"}
StatusOK -- No --> ShowDisabled["Disable Adjust Load Button"]
StatusOK -- Yes --> CheckAdjusted{"Already adjusted?"}
CheckAdjusted -- Yes --> ShowDisabled
CheckAdjusted -- No --> AllowAccess["Allow Load Adjustment"]
```

**Diagram sources**
- [detail.vue:301-310](file://app/pages/pickups/[id].vue#L301-L310)
- [usePermissions.ts:3-43](file://app/composables/usePermissions.ts#L3-L43)

**Section sources**
- [detail.vue:301-310](file://app/pages/pickups/[id].vue#L301-L310)
- [usePermissions.ts:1-43](file://app/composables/usePermissions.ts#L1-L43)

## Dependency Analysis
- UI Pages depend on the API composable for all network operations
- Modals encapsulate user input and emit events to parent pages
- Type definitions provide shared contracts for drivers, trucks, and subscriptions
- Filtering and pagination logic resides in the list page and drives API queries
- **Enhanced**: Sorting functionality integrates with both client-side reactive state management and server-side API parameters with performance optimization
- **New**: Load adjustment system integrates with permission system and truck load tier APIs
- **Enhanced**: CreatePickupModal dependencies include emergency validation utilities, priority assignment logic, and pricing mode detection
- **New**: Customer modal dependencies include conditional field logic based on pricing mode
- **New**: Permission system integration for access control throughout the application

```mermaid
graph LR
Index["Pickups List"] --> Api["useApi"]
Detail["Pickup Detail"] --> Api
Detail --> Permissions["usePermissions"]
AdjustModal["Adjust Load Modal"] --> Api
AssignModal["Assign Driver Modal"] --> Api
CreateModal["Create Pickup Modal"] --> Api
EmergencyFee["Emergency Fee System"] --> Api
ShopZoneFee["Shop Zone Fee System"] --> Api
SupportTicket["Support Ticket System"] --> Api
CustomerModal["Customer Modal"] --> Api
Index --> Types["driver.ts"]
Detail --> Types
CreateModal --> SubTypes["subscription.ts"]
CustomerModal --> SubTypes
Index -. sorting params .-> Api
Index -. sort state .-> Index
Index -. cache .-> Index
Detail -. permission checks .-> Permissions
AdjustModal -. load adjustment .-> Api
AssignModal -. driver assignment .-> Api
EmergencyFee -. fee config .-> Api
ShopZoneFee -. zone pricing .-> Api
SupportTicket -. ticket creation .-> Api
CreateModal -. emergency validation .-> Api
CreateModal -. priority assignment .-> Api
CreateModal -. pricing mode .-> Api
CustomerModal -. pricing mode .-> Api
CustomerModal -. conditional fields .-> Api
```

**Diagram sources**
- [index.vue:60-77](file://app/pages/pickups/index.vue#L60-L77)
- [detail.vue:301-315](file://app/pages/pickups/[id].vue#L301-L315)
- [AdjustLoadModal.vue:51-120](file://app/components/AdjustLoadModal.vue#L51-L120)
- [AssignDriverModal.vue:38-77](file://app/components/AssignDriverModal.vue#L38-L77)
- [usePermissions.ts:3-43](file://app/composables/usePermissions.ts#L3-L43)

**Section sources**
- [index.vue:1-627](file://app/pages/pickups/index.vue#L1-L627)
- [detail.vue:1-901](file://app/pages/pickups/[id].vue#L1-L901)
- [AdjustLoadModal.vue:1-197](file://app/components/AdjustLoadModal.vue#L1-L197)
- [AssignDriverModal.vue:1-260](file://app/components/AssignDriverModal.vue#L1-L260)
- [useApi.ts:1-91](file://app/composables/useApi.ts#L1-L91)
- [usePermissions.ts:1-43](file://app/composables/usePermissions.ts#L1-L43)

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
- **New**: Load Adjustment Performance
  - Optimize permission checks for responsive UI updates
  - Minimize API calls for truck load tier fetching with caching
  - Efficient validation processing for different pricing modes
  - Optimize settlement calculation algorithms
- **New**: Permission System Performance
  - Cache permission checks to avoid repeated evaluations
  - Optimize permission state management for reactive updates
  - Minimize re-renders when permission state changes
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
- **New**: Load Adjustment Issues
  - Verify user has 'pickups.manage' permission for load adjustment functionality
  - Check that pickup is not in completed/cancelled status
  - Ensure load hasn't been previously adjusted (loadAdjustedAt check)
  - Verify pricing mode configuration and truck load tier availability
  - Debug settlement calculation and payment prompt functionality
- **New**: Permission Issues
  - Verify permission system configuration and user roles
  - Check that permission checks are properly integrated into UI components
  - Debug permission state management and reactive updates
- **New**: Truck Load Tier Issues
  - Verify truck load tier endpoint returns valid data
  - Check validation rules for truck load tier selection
  - Ensure proper error messaging for missing truck tier selection
  - Debug conditional field display logic
- **New**: Payment Type Resolution Issues
  - Verify customer subscription state affects payment type resolution
  - Check backend payment type auto-resolution logic
  - Ensure proper payload construction based on pricing mode
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
  - **New**: Monitor permission check performance and caching effectiveness
- **Enhanced**: CreatePickupModal Issues
  - Verify emergency toggle state persistence across form interactions
  - Check validation rule conflicts between regular and emergency modes
  - Ensure proper error handling for emergency-specific validation failures
  - Test date restriction behavior in different browser environments
- **New**: Customer Modal Issues
  - Verify conditional field visibility based on customer type pricing mode
  - Check validation rules for per_bin vs full_truck customers
  - Ensure proper payload construction for different pricing modes
  - Debug bin capacity and assigned bins logic for per_bin customers

**Section sources**
- [useApi.ts:39-67](file://app/composables/useApi.ts#L39-L67)
- [CreatePickupModal.vue:121-152](file://app/components/CreatePickupModal.vue#L121-L152)
- [index.vue:60-77](file://app/pages/pickups/index.vue#L60-L77)
- [index.vue:126-160](file://app/pages/pickups/index.vue#L126-L160)
- [detail.vue:301-315](file://app/pages/pickups/[id].vue#L301-L315)
- [AdjustLoadModal.vue:60-120](file://app/components/AdjustLoadModal.vue#L60-L120)
- [usePermissions.ts:3-43](file://app/composables/usePermissions.ts#L3-L43)

## Conclusion
The pickup operations module provides a comprehensive workflow for managing waste pickup requests. It supports creation, assignment/reassignment with priority handling, clear status transitions, and rich visibility through activity logs and timelines. The addition of comprehensive server-side sorting functionality significantly enhances data management capabilities, allowing users to efficiently navigate and analyze pickup requests by creation date, preferred pickup date, and last update time. **Enhanced**: The CreatePickupModal has been substantially upgraded with emergency pickup toggle functionality, specialized validation rules for emergency scenarios, customized success notifications, and restrictions on preferred date selection when emergency mode is activated. **New**: The system now includes a sophisticated pricing mode system supporting both per_bin and full_truck pricing strategies with dynamic form field visibility and validation, plus comprehensive load adjustment capabilities with permission-based access controls. The truck load tier dropdown functionality provides flexible pricing options for full_truck customers, while automatic payment type resolution ensures accurate billing based on customer subscription state. The emergency pickup feature includes enhanced validation rules, automatic priority assignment, and specialized processing workflows. The fee management system provides flexible configuration for both emergency and shop zone fees with real-time calculation capabilities. Integration with fleet management is achieved via structured driver and truck references, enabling robust scheduling and tracking capabilities. The enhanced sorting features, emergency pickup system, pricing mode architecture, load adjustment system, and fee management demonstrate the system's commitment to providing intuitive, powerful, and accessible administrative tools for effective operations management at scale. The comprehensive support ticket integration ensures that any issues can be quickly reported and resolved, maintaining operational efficiency and customer satisfaction. The enhanced CreatePickupModal functionality represents a significant improvement in handling urgent pickup scenarios with proper validation, user feedback, and priority processing, while the new pricing mode system enables flexible business models for different customer segments. **New**: The load adjustment system provides operators with the ability to modify actual collected loads after booking, supporting both per_bin and full_truck pricing modes with appropriate validation and settlement processing. The permission-based access controls ensure that sensitive operations are properly secured while maintaining usability for authorized users. The enhanced AssignDriverModal improvements provide better form state management and validation, improving the overall user experience for driver assignment workflows.