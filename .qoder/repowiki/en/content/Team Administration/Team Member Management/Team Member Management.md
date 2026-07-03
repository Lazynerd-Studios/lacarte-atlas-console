# Team Member Management

<cite>
**Referenced Files in This Document**
- [index.vue](file://app/pages/team/index.vue)
- [add.vue](file://app/pages/team/add.vue)
- [edit.vue](file://app/pages/team/[id]/edit.vue)
- [team.ts](file://app/types/team.ts)
- [auth.ts](file://app/types/auth.ts)
- [teamValidation.ts](file://app/utils/teamValidation.ts)
- [teamTransform.ts](file://app/utils/teamTransform.ts)
- [useApi.ts](file://app/composables/useApi.ts)
- [usePermissions.ts](file://app/composables/usePermissions.ts)
- [AddRoleModal.vue](file://app/components/AddRoleModal.vue)
- [useToast.ts](file://app/composables/useToast.ts)
- [add-member.test.ts](file://app/pages/team/__tests__/add-member.test.ts)
- [delete-member.test.ts](file://app/pages/team/__tests__/delete-member.test.ts)
- [team-validation-email.test.ts](file://app/utils/__tests__/team-validation-email.test.ts)
</cite>

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
This document explains the end-to-end team member management functionality: adding new members, editing existing profiles, and removing members. It covers the data model, form validation patterns, API integration for CRUD operations, UI components (listing, role selection, status), and how roles and permissions relate to authentication and access control.

## Project Structure
Team member management is implemented as a set of Nuxt pages with supporting utilities, composables, types, and a modal component:
- Pages: list, add, edit
- Types: shared interfaces for members, roles, permissions, and payloads
- Utils: validation and payload transformation
- Composables: HTTP client wrapper, permission checks, toast notifications
- Modal: role creation with permission selection

```mermaid
graph TB
subgraph "Pages"
TList["pages/team/index.vue"]
TAdd["pages/team/add.vue"]
TEdit["pages/team/[id]/edit.vue"]
end
subgraph "Types"
TT["types/team.ts"]
TA["types/auth.ts"]
end
subgraph "Utils"
TV["utils/teamValidation.ts"]
TTf["utils/teamTransform.ts"]
end
subgraph "Composables"
API["composables/useApi.ts"]
PERM["composables/usePermissions.ts"]
TOAST["composables/useToast.ts"]
end
subgraph "Components"
AR["components/AddRoleModal.vue"]
end
TList --> API
TList --> PERM
TList --> TOAST
TList --> AR
TAdd --> API
TAdd --> TV
TAdd --> TTf
TAdd --> PERM
TAdd --> TOAST
TEdit --> API
TEdit --> TV
TEdit --> TTf
TEdit --> PERM
TEdit --> TOAST
AR --> API
AR --> TOAST
TList -.-> TT
TAdd -.-> TT
TEdit -.-> TT
TList -.-> TA
TAdd -.-> TA
TEdit -.-> TA
```

**Diagram sources**
- [index.vue:1-605](file://app/pages/team/index.vue#L1-L605)
- [add.vue:1-450](file://app/pages/team/add.vue#L1-L450)
- [edit.vue:1-470](file://app/pages/team/[id]/edit.vue#L1-L470)
- [team.ts:1-65](file://app/types/team.ts#L1-L65)
- [auth.ts:1-64](file://app/types/auth.ts#L1-L64)
- [teamValidation.ts:1-122](file://app/utils/teamValidation.ts#L1-L122)
- [teamTransform.ts:1-88](file://app/utils/teamTransform.ts#L1-L88)
- [useApi.ts:1-91](file://app/composables/useApi.ts#L1-L91)
- [usePermissions.ts:1-43](file://app/composables/usePermissions.ts#L1-L43)
- [AddRoleModal.vue:1-287](file://app/components/AddRoleModal.vue#L1-L287)
- [useToast.ts:1-37](file://app/composables/useToast.ts#L1-L37)

**Section sources**
- [index.vue:1-605](file://app/pages/team/index.vue#L1-L605)
- [add.vue:1-450](file://app/pages/team/add.vue#L1-L450)
- [edit.vue:1-470](file://app/pages/team/[id]/edit.vue#L1-L470)
- [team.ts:1-65](file://app/types/team.ts#L1-L65)
- [auth.ts:1-64](file://app/types/auth.ts#L1-L64)
- [teamValidation.ts:1-122](file://app/utils/teamValidation.ts#L1-L122)
- [teamTransform.ts:1-88](file://app/utils/teamTransform.ts#L1-L88)
- [useApi.ts:1-91](file://app/composables/useApi.ts#L1-L91)
- [usePermissions.ts:1-43](file://app/composables/usePermissions.ts#L1-L43)
- [AddRoleModal.vue:1-287](file://app/components/AddRoleModal.vue#L1-L287)
- [useToast.ts:1-37](file://app/composables/useToast.ts#L1-L37)

## Core Components
- Team listing page: displays members, stats, actions (add, edit, delete), and role creation via modal.
- Add member page: form with validation and submission to create a new member.
- Edit member page: prepopulated form to update personal details, role, and status; permissions are read-only and derived from role.
- Role creation modal: selects permissions grouped by module and submits a new role.

Key responsibilities:
- Authorization checks before rendering or performing mutations.
- Data fetching and transformation between backend responses and frontend models.
- Client-side validation and user feedback via toasts.

**Section sources**
- [index.vue:1-605](file://app/pages/team/index.vue#L1-L605)
- [add.vue:1-450](file://app/pages/team/add.vue#L1-L450)
- [edit.vue:1-470](file://app/pages/team/[id]/edit.vue#L1-L470)
- [AddRoleModal.vue:1-287](file://app/components/AddRoleModal.vue#L1-L287)

## Architecture Overview
The system follows a clear separation of concerns:
- Pages orchestrate state, authorization, and API calls.
- Utilities handle validation and payload shaping.
- Composables provide cross-cutting concerns (HTTP, permissions, toasts).
- Types define contracts for data and payloads.

```mermaid
sequenceDiagram
participant U as "User"
participant Page as "Team List Page"
participant Perm as "usePermissions"
participant API as "useApi"
participant Toast as "useAppToast"
U->>Page : Open /team
Page->>Perm : hasPermission("team.manage")
alt Authorized
Page->>API : GET /team/
API-->>Page : Members[]
Page->>API : GET /team/stats
API-->>Page : Stats
Page-->>U : Render table + stats
else Unauthorized
Page->>Toast : error("Unauthorized", ...)
Page-->>U : Show error
end
```

**Diagram sources**
- [index.vue:15-289](file://app/pages/team/index.vue#L15-L289)
- [usePermissions.ts:1-43](file://app/composables/usePermissions.ts#L1-L43)
- [useApi.ts:1-91](file://app/composables/useApi.ts#L1-L91)
- [useToast.ts:1-37](file://app/composables/useToast.ts#L1-L37)

## Detailed Component Analysis

### Data Model and Payloads
The core data structures define the shape of team members, roles, permissions, and API payloads.

```mermaid
classDiagram
class TeamMember {
+string id
+string firstName
+string lastName
+string email
+string phone
+string role
+roleDetails
+string status
+string[] permissions
+string lastLogin
+string createdAt
+string updatedAt
}
class Role {
+string id
+string name
+string description
+string[] permissions
+string color
+boolean isSystem
+string createdAt
+string updatedAt
}
class Permission {
+string id
+string label
+string description
+string module
}
class CreateTeamMemberPayload {
+string firstName
+string lastName
+string email
+string phoneNumber
+string roleId
+string status
}
class UpdateTeamMemberPayload {
+string firstName?
+string lastName?
+string email?
+string phoneNumber?
+string roleId?
+string status?
}
class CreateRolePayload {
+string name
+string displayName?
+string description
+string[] permissions
+string[] permissionIds?
}
TeamMember --> Role : "has"
Role --> Permission : "contains"
```

**Diagram sources**
- [team.ts:1-65](file://app/types/team.ts#L1-L65)

**Section sources**
- [team.ts:1-65](file://app/types/team.ts#L1-L65)

### Authentication and Permissions Relationship
- The current user’s identity and permissions come from the auth store and are used to gate access to team management features.
- The permission composable provides helpers to check specific permissions and super admin status.
- Auth types include both base user and augmented team member profile shapes.

```mermaid
sequenceDiagram
participant Page as "Team Page"
participant Perm as "usePermissions"
participant Store as "AuthStore"
participant API as "useApi"
Page->>Perm : isSuperAdmin || hasPermission("team.manage")
Perm->>Store : read user.roles/permissions
alt Allowed
Page->>API : GET /team/
API-->>Page : Members
else Denied
Page->>Toast : show unauthorized
end
```

**Diagram sources**
- [usePermissions.ts:1-43](file://app/composables/usePermissions.ts#L1-L43)
- [auth.ts:1-64](file://app/types/auth.ts#L1-L64)
- [index.vue:255-289](file://app/pages/team/index.vue#L255-L289)

**Section sources**
- [usePermissions.ts:1-43](file://app/composables/usePermissions.ts#L1-L43)
- [auth.ts:1-64](file://app/types/auth.ts#L1-L64)
- [index.vue:255-289](file://app/pages/team/index.vue#L255-L289)

### Team Listing and Status Management
- Fetches members and statistics on mount after authorization checks.
- Displays a table with member initials, full name, email, role badge, status badge, last login, and action buttons.
- Provides inline delete confirmation modal and navigation to edit.

```mermaid
flowchart TD
Start(["Mount"]) --> CheckAuth["Check 'team.manage' or super admin"]
CheckAuth --> |Denied| ShowError["Show unauthorized toast"]
CheckAuth --> |Allowed| FetchMembers["GET /team/"]
FetchMembers --> Transform["Map backend response to TeamMember"]
Transform --> FetchStats["GET /team/stats"]
FetchStats --> Render["Render table + stats"]
Render --> Actions{"Action?"}
Actions --> |Edit| NavigateEdit["Navigate to /team/:id/edit"]
Actions --> |Delete| ConfirmDel["Open delete modal"]
ConfirmDel --> DeleteAPI["DELETE /team/:id"]
DeleteAPI --> Refresh["Refresh members list"]
```

**Diagram sources**
- [index.vue:152-216](file://app/pages/team/index.vue#L152-L216)
- [index.vue:444-521](file://app/pages/team/index.vue#L444-L521)

**Section sources**
- [index.vue:1-605](file://app/pages/team/index.vue#L1-L605)

### Adding a New Team Member
- Loads available roles from the API.
- Validates form fields using centralized validators.
- Transforms form into an API-compatible payload and posts it.
- On success, shows a toast and navigates back to the team list.

```mermaid
sequenceDiagram
participant User as "User"
participant AddPage as "Add Member Page"
participant Perm as "usePermissions"
participant API as "useApi"
participant Val as "validateTeamMemberForm"
participant Xf as "formToCreateMemberPayload"
participant Toast as "useAppToast"
User->>AddPage : Open /team/add
AddPage->>Perm : checkAuthorization("access team management")
AddPage->>API : GET /team/roles
API-->>AddPage : Roles[]
User->>AddPage : Submit form
AddPage->>Val : validate(form, isUpdate=false)
alt Valid
AddPage->>Xf : transform(form)
AddPage->>API : POST /team/ (payload)
API-->>AddPage : Success
AddPage->>Toast : success("Team member added successfully")
AddPage-->>User : Redirect to /team
else Invalid
AddPage->>AddPage : Show field errors
end
```

**Diagram sources**
- [add.vue:96-151](file://app/pages/team/add.vue#L96-L151)
- [teamValidation.ts:49-99](file://app/utils/teamValidation.ts#L49-L99)
- [teamTransform.ts:10-27](file://app/utils/teamTransform.ts#L10-L27)
- [useApi.ts:1-91](file://app/composables/useApi.ts#L1-L91)
- [useToast.ts:1-37](file://app/composables/useToast.ts#L1-L37)

**Section sources**
- [add.vue:1-450](file://app/pages/team/add.vue#L1-L450)
- [teamValidation.ts:1-122](file://app/utils/teamValidation.ts#L1-L122)
- [teamTransform.ts:1-88](file://app/utils/teamTransform.ts#L1-L88)
- [useApi.ts:1-91](file://app/composables/useApi.ts#L1-L91)
- [useToast.ts:1-37](file://app/composables/useToast.ts#L1-L37)

### Editing a Team Member Profile
- Loads member details and available roles concurrently.
- Populates form with first/last name split from full name, email, phone, role, and status.
- Permissions are displayed read-only and grouped by module based on the member’s permissions.
- Updates only provided fields via PATCH.

```mermaid
sequenceDiagram
participant User as "User"
participant EditPage as "Edit Member Page"
participant Perm as "usePermissions"
participant API as "useApi"
participant Val as "validateTeamMemberForm"
participant Xf as "formToUpdateMemberPayload"
participant Toast as "useAppToast"
User->>EditPage : Open /team/ : id/edit
EditPage->>Perm : checkAuthorization("access team management")
EditPage->>API : GET /team/ : id
API-->>EditPage : Member
EditPage->>API : GET /team/roles
API-->>EditPage : Roles[]
User->>EditPage : Submit changes
EditPage->>Val : validate(form, isUpdate=true)
alt Valid
EditPage->>Xf : transform(form)
EditPage->>API : PATCH /team/ : id (payload)
API-->>EditPage : Success
EditPage->>Toast : success("Team member updated successfully")
EditPage-->>User : Redirect to /team
else Invalid
EditPage->>EditPage : Show field errors
end
```

**Diagram sources**
- [edit.vue:71-126](file://app/pages/team/[id]/edit.vue#L71-L126)
- [edit.vue:195-247](file://app/pages/team/[id]/edit.vue#L195-L247)
- [teamValidation.ts:49-99](file://app/utils/teamValidation.ts#L49-L99)
- [teamTransform.ts:35-70](file://app/utils/teamTransform.ts#L35-L70)
- [useApi.ts:1-91](file://app/composables/useApi.ts#L1-L91)
- [useToast.ts:1-37](file://app/composables/useToast.ts#L1-L37)

**Section sources**
- [edit.vue:1-470](file://app/pages/team/[id]/edit.vue#L1-L470)
- [teamValidation.ts:1-122](file://app/utils/teamValidation.ts#L1-L122)
- [teamTransform.ts:1-88](file://app/utils/teamTransform.ts#L1-L88)
- [useApi.ts:1-91](file://app/composables/useApi.ts#L1-L91)
- [useToast.ts:1-37](file://app/composables/useToast.ts#L1-L37)

### Deleting a Team Member
- Opens a confirmation modal showing the member’s full name.
- Performs DELETE request and refreshes the list on success.

```mermaid
sequenceDiagram
participant User as "User"
participant ListPage as "Team List Page"
participant Perm as "usePermissions"
participant API as "useApi"
participant Toast as "useAppToast"
User->>ListPage : Click Delete
ListPage->>Perm : checkAuthorization("delete team members")
alt Authorized
ListPage->>API : DELETE /team/ : id
API-->>ListPage : Success
ListPage->>Toast : success("Team member deleted successfully")
ListPage->>ListPage : fetchMembers()
else Denied
ListPage->>Toast : error("Unauthorized", ...)
end
```

**Diagram sources**
- [index.vue:111-142](file://app/pages/team/index.vue#L111-L142)
- [usePermissions.ts:1-43](file://app/composables/usePermissions.ts#L1-L43)
- [useApi.ts:1-91](file://app/composables/useApi.ts#L1-L91)
- [useToast.ts:1-37](file://app/composables/useToast.ts#L1-L37)

**Section sources**
- [index.vue:1-605](file://app/pages/team/index.vue#L1-L605)

### Role Creation Workflow
- Opens a modal that loads all permissions grouped by module.
- Allows selecting multiple permissions per group and submitting a new role.

```mermaid
sequenceDiagram
participant User as "User"
participant ListPage as "Team List Page"
participant Modal as "AddRoleModal"
participant API as "useApi"
participant Toast as "useAppToast"
User->>ListPage : Click "Add Role"
ListPage->>Modal : open
Modal->>API : GET /team/permissions
API-->>Modal : Permissions[]
User->>Modal : Select permissions + name
Modal->>ListPage : emit submit(payload)
ListPage->>API : POST /team/roles (payload)
API-->>ListPage : Success
ListPage->>Toast : success("Role created successfully")
ListPage->>Modal : close
```

**Diagram sources**
- [index.vue:46-90](file://app/pages/team/index.vue#L46-L90)
- [AddRoleModal.vue:58-93](file://app/components/AddRoleModal.vue#L58-L93)
- [useApi.ts:1-91](file://app/composables/useApi.ts#L1-L91)
- [useToast.ts:1-37](file://app/composables/useToast.ts#L1-L37)

**Section sources**
- [index.vue:1-605](file://app/pages/team/index.vue#L1-L605)
- [AddRoleModal.vue:1-287](file://app/components/AddRoleModal.vue#L1-L287)

### Form Validation Patterns
- Centralized validators enforce non-empty fields, email format, phone format, and role selection.
- For updates, only provided fields are validated; for creates, all fields are required.
- Tests cover required fields, email format, phone format, and payload transformations.

```mermaid
flowchart TD
A["Submit Form"] --> B["validateTeamMemberForm(form, isUpdate)"]
B --> C{"Errors?"}
C --> |Yes| D["Display field errors"]
C --> |No| E["Transform to payload"]
E --> F["Send API request"]
```

**Diagram sources**
- [teamValidation.ts:49-99](file://app/utils/teamValidation.ts#L49-L99)
- [teamTransform.ts:10-70](file://app/utils/teamTransform.ts#L10-L70)
- [add-member.test.ts:1-123](file://app/pages/team/__tests__/add-member.test.ts#L1-L123)
- [team-validation-email.test.ts:1-166](file://app/utils/__tests__/team-validation-email.test.ts#L1-L166)

**Section sources**
- [teamValidation.ts:1-122](file://app/utils/teamValidation.ts#L1-L122)
- [teamTransform.ts:1-88](file://app/utils/teamTransform.ts#L1-L88)
- [add-member.test.ts:1-123](file://app/pages/team/__tests__/add-member.test.ts#L1-L123)
- [team-validation-email.test.ts:1-166](file://app/utils/__tests__/team-validation-email.test.ts#L1-L166)

### API Integration Summary
- Base HTTP client adds Authorization header, handles 401 redirects, and normalizes success/error responses.
- Endpoints used:
  - GET /team/ — list members
  - GET /team/stats — team statistics
  - GET /team/roles — list roles
  - GET /team/:id — get member details
  - POST /team/ — create member
  - PATCH /team/:id — update member
  - DELETE /team/:id — delete member
  - GET /team/permissions — list permissions (for role creation)
  - POST /team/roles — create role

**Section sources**
- [useApi.ts:1-91](file://app/composables/useApi.ts#L1-L91)
- [index.vue:152-216](file://app/pages/team/index.vue#L152-L216)
- [add.vue:36-50](file://app/pages/team/add.vue#L36-L50)
- [edit.vue:71-126](file://app/pages/team/[id]/edit.vue#L71-L126)
- [AddRoleModal.vue:58-93](file://app/components/AddRoleModal.vue#L58-L93)

## Dependency Analysis
- Pages depend on composables for HTTP, permissions, and toasts.
- Utilities encapsulate validation and transformation logic.
- Types centralize contracts across pages and utils.
- Modal depends on permissions endpoint and emits role creation events.

```mermaid
graph LR
TList["index.vue"] --> useApi["useApi.ts"]
TList --> usePerm["usePermissions.ts"]
TList --> useToast["useToast.ts"]
TList --> AddRole["AddRoleModal.vue"]
TAdd["add.vue"] --> useApi
TAdd --> usePerm
TAdd --> useToast
TAdd --> TV["teamValidation.ts"]
TAdd --> TTf["teamTransform.ts"]
TEdit["edit.vue"] --> useApi
TEdit --> usePerm
TEdit --> useToast
TEdit --> TV
TEdit --> TTf
AddRole --> useApi
AddRole --> useToast
TV --> TTf
TTf --> TT["types/team.ts"]
TList -.-> TA["types/auth.ts"]
TAdd -.-> TA
TEdit -.-> TA
```

**Diagram sources**
- [index.vue:1-605](file://app/pages/team/index.vue#L1-L605)
- [add.vue:1-450](file://app/pages/team/add.vue#L1-L450)
- [edit.vue:1-470](file://app/pages/team/[id]/edit.vue#L1-L470)
- [teamValidation.ts:1-122](file://app/utils/teamValidation.ts#L1-L122)
- [teamTransform.ts:1-88](file://app/utils/teamTransform.ts#L1-L88)
- [useApi.ts:1-91](file://app/composables/useApi.ts#L1-L91)
- [usePermissions.ts:1-43](file://app/composables/usePermissions.ts#L1-L43)
- [AddRoleModal.vue:1-287](file://app/components/AddRoleModal.vue#L1-L287)
- [team.ts:1-65](file://app/types/team.ts#L1-L65)
- [auth.ts:1-64](file://app/types/auth.ts#L1-L64)

**Section sources**
- [index.vue:1-605](file://app/pages/team/index.vue#L1-L605)
- [add.vue:1-450](file://app/pages/team/add.vue#L1-L450)
- [edit.vue:1-470](file://app/pages/team/[id]/edit.vue#L1-L470)
- [teamValidation.ts:1-122](file://app/utils/teamValidation.ts#L1-L122)
- [teamTransform.ts:1-88](file://app/utils/teamTransform.ts#L1-L88)
- [useApi.ts:1-91](file://app/composables/useApi.ts#L1-L91)
- [usePermissions.ts:1-43](file://app/composables/usePermissions.ts#L1-L43)
- [AddRoleModal.vue:1-287](file://app/components/AddRoleModal.vue#L1-L287)
- [team.ts:1-65](file://app/types/team.ts#L1-L65)
- [auth.ts:1-64](file://app/types/auth.ts#L1-L64)

## Performance Considerations
- Parallel data loading: The list and edit pages load independent resources concurrently (e.g., members and stats, member and roles) to reduce perceived latency.
- Minimal re-renders: Local reactive state is updated precisely where needed; lists are refreshed only after mutations.
- Lightweight transforms: Payload transformers trim and normalize inputs once before sending requests.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Unauthorized access: Ensure the current user has the “team.manage” permission or is a super admin. The permission checks occur before rendering and mutating data.
- Session expired: A 401 response triggers logout and redirect to login automatically.
- Duplicate email on create: The add page maps server messages indicating duplicates to a field-level error for the email input.
- Not found on edit: If the member ID is invalid, the edit page shows an error toast and redirects to the team list.
- Network failures: All HTTP wrappers log errors and surface user-friendly toasts.

Operational references:
- Authorization checks and error toasts in list, add, and edit pages.
- 401 handling and error normalization in the HTTP client.
- Field-specific error mapping for duplicate emails during creation.

**Section sources**
- [index.vue:255-289](file://app/pages/team/index.vue#L255-L289)
- [add.vue:96-151](file://app/pages/team/add.vue#L96-L151)
- [edit.vue:195-247](file://app/pages/team/[id]/edit.vue#L195-L247)
- [useApi.ts:39-67](file://app/composables/useApi.ts#L39-L67)
- [useToast.ts:1-37](file://app/composables/useToast.ts#L1-L37)

## Conclusion
The team member management feature provides a complete lifecycle for managing users within the application. It enforces robust authorization, validates inputs consistently, integrates cleanly with the backend through typed payloads, and offers clear user feedback. Roles and permissions drive access control and are surfaced appropriately in the UI, while the architecture keeps concerns separated for maintainability and testability.