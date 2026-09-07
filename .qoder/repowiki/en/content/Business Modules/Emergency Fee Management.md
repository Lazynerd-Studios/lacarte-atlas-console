# Emergency Fee Management

<cite>
**Referenced Files in This Document**
- [EmergencyFeeCard.vue](file://app/components/EmergencyFeeCard.vue)
- [SetEmergencyFeeModal.vue](file://app/components/SetEmergencyFeeModal.vue)
- [fees.vue](file://app/pages/management/fees.vue)
- [useCurrency.ts](file://app/composables/useCurrency.ts)
</cite>

## Update Summary
**Changes Made**
- Removed temporary pesewas conversion workaround that multiplied fees by 100
- Simplified fee handling to send values directly as whole cedis without conversion
- Updated validation to enforce whole number cedis input without backend compatibility workarounds
- Streamlined the data flow between components and API endpoints

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Simplified Currency Handling System](#simplified-currency-handling-system)
7. [Dependency Analysis](#dependency-analysis)
8. [Performance Considerations](#performance-considerations)
9. [Troubleshooting Guide](#troubleshooting-guide)
10. [Conclusion](#conclusion)

## Introduction
This document explains the Emergency Fee Management feature implemented in the application. It focuses on how emergency fees are displayed and configured through dedicated UI components, and how they integrate with the management interface for fees. The system provides a streamlined approach to managing emergency pickup fees with simplified currency handling that works directly with whole Ghana Cedis (GHS) values without pesewas conversion complexity.

## Project Structure
The Emergency Fee Management feature spans four primary files:
- A card component that displays current emergency fee information with GHS formatting.
- A modal component used to set or update emergency fees with enhanced validation.
- A page that orchestrates the management view where these components are embedded.
- A currency utility that provides consistent GHS formatting across the application.

```mermaid
graph TB
FeesPage["Management Fees Page<br/>pages/management/fees.vue"] --> FeeCard["Emergency Fee Card<br/>components/EmergencyFeeCard.vue"]
FeesPage --> SetModal["Set Emergency Fee Modal<br/>components/SetEmergencyFeeModal.vue"]
FeeCard --> SetModal
FeeCard --> CurrencyUtil["Currency Utility<br/>composables/useCurrency.ts"]
SetModal --> CurrencyUtil
```

**Diagram sources**
- [fees.vue](file://app/pages/management/fees.vue)
- [EmergencyFeeCard.vue](file://app/components/EmergencyFeeCard.vue)
- [SetEmergencyFeeModal.vue](file://app/components/SetEmergencyFeeModal.vue)
- [useCurrency.ts](file://app/composables/useCurrency.ts)

**Section sources**
- [fees.vue](file://app/pages/management/fees.vue)
- [EmergencyFeeCard.vue](file://app/components/EmergencyFeeCard.vue)
- [SetEmergencyFeeModal.vue](file://app/components/SetEmergencyFeeModal.vue)
- [useCurrency.ts](file://app/composables/useCurrency.ts)

## Core Components
- **Emergency Fee Card**: Presents the current emergency fee value using GHS formatting and provides an action to open the configuration modal.
- **Set Emergency Fee Modal**: Captures user input for setting or updating emergency fees with validation for whole number cedis and submits changes directly to the API.
- **Management Fees Page**: Hosts the card and modal within the broader fees management context and handles API interactions.
- **Currency Utility**: Provides consistent GHS currency formatting across all components.

Key responsibilities:
- Display and edit emergency fee values with GHS formatting.
- Validate inputs as whole number cedis before submission.
- Emit events to parent components for state updates.
- Provide user feedback via toast notifications.
- Send fee values directly to backend without conversion workarounds.

**Section sources**
- [EmergencyFeeCard.vue](file://app/components/EmergencyFeeCard.vue)
- [SetEmergencyFeeModal.vue](file://app/components/SetEmergencyFeeModal.vue)
- [fees.vue](file://app/pages/management/fees.vue)
- [useCurrency.ts](file://app/composables/useCurrency.ts)

## Architecture Overview
The feature follows a unidirectional data flow pattern typical in Vue applications with simplified currency handling:
- The page renders the card and modal with GHS display.
- The card triggers the modal when the user wants to change the fee.
- The modal collects and validates input as whole number cedis, then emits a success event.
- The page handles the event to refresh or update the displayed fee with direct API communication.

```mermaid
sequenceDiagram
participant User as "User"
participant Page as "Fees Page"
participant Card as "Emergency Fee Card"
participant Modal as "Set Emergency Fee Modal"
participant Backend as "Backend API"
User->>Page : Open Management Fees
Page->>Card : Render current emergency fee (GHS format)
User->>Card : Click "Edit Fee"
Card-->>Page : Emit "open-modal"
Page->>Modal : Show modal with props
User->>Modal : Enter new fee value (whole cedis)
Modal->>Modal : Validate input (no decimals)
Modal-->>Page : Emit "save" with payload
Page->>Backend : PUT /pickup-requests/admin/emergency-fee
Backend-->>Page : Return updated config
Page-->>Card : Re-render updated fee (GHS format)
```

**Diagram sources**
- [fees.vue](file://app/pages/management/fees.vue)
- [EmergencyFeeCard.vue](file://app/components/EmergencyFeeCard.vue)
- [SetEmergencyFeeModal.vue](file://app/components/SetEmergencyFeeModal.vue)
- [useCurrency.ts](file://app/composables/useCurrency.ts)

## Detailed Component Analysis

### Emergency Fee Card
Purpose:
- Displays the current emergency fee value using GHS formatting.
- Provides a button to open the configuration modal.
- Shows status indicators (active/inactive) and last updated timestamp.

Behavior:
- Emits an event to open the modal when the user initiates editing.
- Uses the currency utility to format values consistently as GHS.
- Reflects real-time updates from the parent page.

Validation:
- Minimal client-side validation; relies on the modal for detailed checks.

Error Handling:
- Delegates error display to the parent page or global toast system.

**Updated** Enhanced to use the currency utility for consistent GHS formatting.

**Section sources**
- [EmergencyFeeCard.vue](file://app/components/EmergencyFeeCard.vue)

#### Class Diagram
```mermaid
classDiagram
class EmergencyFeeCard {
+props : config, loading
+emits : edit
+methods : openModal()
+computed : formattedGhs, statusColor
}
```

**Diagram sources**
- [EmergencyFeeCard.vue](file://app/components/EmergencyFeeCard.vue)

### Set Emergency Fee Modal
Purpose:
- Captures the new emergency fee value with enhanced validation.
- Validates the input as whole number cedis (no decimals).
- Submits the change directly to the API and reports success or failure.

Behavior:
- Binds form fields to local state with GHS input field.
- Emits a save event with validated payload upon successful submission.
- Sends fee values directly to backend without conversion workarounds.
- Closes itself after successful save.

Validation:
- Enforces required fields and whole number cedis constraint.
- Prevents submission if invalid (decimals not allowed).
- Provides clear error messages for invalid inputs.

Error Handling:
- Shows inline errors for invalid inputs.
- Uses toast notifications for server-side errors.

**Updated** Enhanced validation to enforce whole number cedis input and simplified data submission without conversion workarounds.

**Section sources**
- [SetEmergencyFeeModal.vue](file://app/components/SetEmergencyFeeModal.vue)

#### Sequence Diagram
```mermaid
sequenceDiagram
participant Modal as "Set Emergency Fee Modal"
participant Parent as "Parent Page"
participant Backend as "Backend API"
Modal->>Modal : Bind form fields (GHS input)
Modal->>Modal : Validate input (whole cedis only)
alt Valid input
Modal-->>Parent : Emit "save" with payload
Parent->>Backend : PUT request with direct fee value
Backend-->>Parent : Return updated config
Parent-->>Modal : Acknowledge success
Modal->>Modal : Close modal
else Invalid input
Modal->>Modal : Show inline errors
end
```

**Diagram sources**
- [SetEmergencyFeeModal.vue](file://app/components/SetEmergencyFeeModal.vue)

### Management Fees Page
Purpose:
- Orchestrates the emergency fee management experience.
- Renders the card and modal with GHS formatting.
- Manages state for the current fee and handles save events.

Behavior:
- Listens for modal open/close events from the card.
- Handles the save event to persist changes and refresh the fee display.
- Integrates with the currency utility for consistent formatting.

Integration Points:
- Calls API endpoints to update the fee with direct payload structure.
- Integrates with the global toast system for user feedback.
- Manages both emergency fees and shop zone fees in unified interface.

**Section sources**
- [fees.vue](file://app/pages/management/fees.vue)

#### Flowchart
```mermaid
flowchart TD
Start(["Open Fees Page"]) --> LoadData["Load emergency fee data"]
LoadData --> RenderCard["Render Emergency Fee Card (GHS format)"]
RenderCard --> WaitAction{"User clicks 'Edit'?"}
WaitAction --> |No| End(["Idle"])
WaitAction --> |Yes| OpenModal["Open Set Emergency Fee Modal"]
OpenModal --> InputValid{"Input valid?<br/>(whole cedis)"}
InputValid --> |No| ShowErrors["Show validation errors"]
ShowErrors --> OpenModal
InputValid --> |Yes| SubmitFee["Submit direct fee value"]
SubmitFee --> SaveFee["Emit save event to parent"]
SaveFee --> UpdateState["Update local state / call API"]
UpdateState --> Refresh["Refresh fee display (GHS format)"]
Refresh --> CloseModal["Close modal"]
CloseModal --> End
```

**Diagram sources**
- [fees.vue](file://app/pages/management/fees.vue)
- [EmergencyFeeCard.vue](file://app/components/EmergencyFeeCard.vue)
- [SetEmergencyFeeModal.vue](file://app/components/SetEmergencyFeeModal.vue)

## Simplified Currency Handling System

### Currency Formatting
The system uses a centralized currency utility that formats all monetary values consistently as Ghana Cedis (GHS). This provides a clean user interface without pesewas conversion complexity.

### Direct Fee Submission
The fee handling process has been simplified to work directly with whole cedis values:
- Frontend accepts and displays whole number cedis values
- Values are sent directly to backend without any conversion
- Backend processes the cedis values as-is
- Result is stored and displayed correctly as cedis amounts

### Validation Enhancements
The modal enforces strict validation rules:
- Only whole number cedis are accepted (no decimal points)
- Clear error messages guide users to enter valid amounts
- Real-time validation prevents submission of invalid values

```mermaid
flowchart LR
UserInput["User enters GHS value"] --> Validate["Validate input<br/>(whole cedis only)"]
Validate --> |Valid| SendToBackend["Send direct fee value"]
Validate --> |Invalid| ShowError["Show validation error"]
SendToBackend --> BackendProcess["Backend processes cedis value"]
BackendProcess --> StoreValue["Store correct cedis value"]
StoreValue --> Display["Display as GHS"]
```

**Diagram sources**
- [useCurrency.ts](file://app/composables/useCurrency.ts)
- [SetEmergencyFeeModal.vue](file://app/components/SetEmergencyFeeModal.vue)

**Section sources**
- [useCurrency.ts](file://app/composables/useCurrency.ts)
- [SetEmergencyFeeModal.vue](file://app/components/SetEmergencyFeeModal.vue)
- [EmergencyFeeCard.vue](file://app/components/EmergencyFeeCard.vue)

## Dependency Analysis
The components interact through props and events with simplified currency handling:
- The page passes initial fee data to the card with GHS formatting.
- The card emits an event to open the modal.
- The modal emits a save event with validated payload and direct API communication.
- The page updates state and re-renders the card with the new fee using consistent GHS formatting.

```mermaid
graph LR
Page["Fees Page"] --> Card["Emergency Fee Card"]
Page --> Modal["Set Emergency Fee Modal"]
Card --> Modal
Modal --> Page
Card --> Currency["Currency Utility"]
Modal --> Currency
Currency --> Format["GHS Formatting"]
```

**Diagram sources**
- [fees.vue](file://app/pages/management/fees.vue)
- [EmergencyFeeCard.vue](file://app/components/EmergencyFeeCard.vue)
- [SetEmergencyFeeModal.vue](file://app/components/SetEmergencyFeeModal.vue)
- [useCurrency.ts](file://app/composables/useCurrency.ts)

**Section sources**
- [fees.vue](file://app/pages/management/fees.vue)
- [EmergencyFeeCard.vue](file://app/components/EmergencyFeeCard.vue)
- [SetEmergencyFeeModal.vue](file://app/components/SetEmergencyFeeModal.vue)
- [useCurrency.ts](file://app/composables/useCurrency.ts)

## Performance Considerations
- Keep modal state minimal to avoid unnecessary re-renders.
- Debounce any auto-save behavior if applicable.
- Use lightweight validation to prevent blocking the main thread.
- Avoid redundant API calls by caching fee values locally until explicitly refreshed.
- Leverage computed properties for currency formatting to optimize performance.

## Troubleshooting Guide
Common issues and resolutions:
- **Modal does not open**: Ensure the card emits the correct event and the page listens for it.
- **Validation errors persist**: Check field binding and validation rules in the modal - ensure whole number cedis are entered.
- **Changes not reflected**: Verify the save event payload structure includes the direct fee value and that the page updates its state correctly.
- **Toast messages not shown**: Confirm the toast system is initialized and invoked on success/failure paths.
- **Currency display issues**: Verify the currency utility is properly imported and used in components.
- **API communication problems**: Ensure the payload structure matches the expected backend format with direct cedis values.

**Updated** Added troubleshooting guidance for direct fee value submission and API communication issues.

**Section sources**
- [SetEmergencyFeeModal.vue](file://app/components/SetEmergencyFeeModal.vue)
- [fees.vue](file://app/pages/management/fees.vue)
- [useCurrency.ts](file://app/composables/useCurrency.ts)

## Conclusion
The Emergency Fee Management feature provides a focused, user-friendly way to view and configure emergency fees with simplified currency handling. The separation of concerns between the card, modal, and page ensures clarity and maintainability. The direct cedis-only display eliminates confusion while the straightforward API integration ensures seamless communication with backend systems. By following the documented flows and integration points, developers can extend or modify the feature confidently while preserving a consistent user experience.

The simplified system successfully addresses previous complexity around pesewas conversion, providing a clean interface that shows only Ghana Cedis values while maintaining direct backend compatibility through straightforward data submission.