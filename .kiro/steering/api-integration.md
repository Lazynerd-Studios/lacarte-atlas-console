---
inclusion: auto
---

# API Integration Standards

## Base Configuration

- API base URL: `https://lacarte.lazynerdstudios.com/api`
- Configured via `NUXT_PUBLIC_API_BASE` environment variable
- Access via `useRuntimeConfig().public.apiBase`

## useApi Composable

- Always use `useApi()` for all API requests
- The composable automatically:
  - Prepends the base URL
  - Attaches `Authorization: Bearer {token}` header when authenticated
  - Handles 401 responses by logging out and redirecting to `/login`
- Methods: `get()`, `post()`, `put()`, `patch()`, `delete()`

## API Field Name Mapping

Critical: Use exact API field names, not UI labels:

- `phoneNumber` (not `phone`)
- `plateNumber` (not `plate`)
- `vinNumber` (not `vin`)
- `name` (combined from `firstName` + `lastName` for drivers)
- `truckId` (display ID like `T-001`)
- `id` (UUID for trucks and drivers)

## Authentication

- Sign-in endpoint: `POST /auth/sign-in/email`
- Request body: `{ email, password, rememberMe }`
- Response: `{ token, user }`
- Store via `Auth_Store.setAuth(user, token)`
- Token persists via `pinia-plugin-persistedstate`

## Pagination

List endpoints return:
```typescript
{
  data: T[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number,
    hasNextPage: boolean,
    hasPreviousPage: boolean
  }
}
```

## Common Endpoints

### Customers
- List: `GET /api/customer/admin/list?page=1&limit=10&search=&status=&customerTypeId=`

### Trucks
- List: `GET /api/trucks/admin/`
- Create: `POST /api/trucks/admin/`
- Detail: `GET /api/trucks/admin/{uuid}`

### Drivers
- List: `GET /api/drivers/admin/?page=1&limit=10&status=&zoneId=&search=`
- Create: `POST /api/drivers/admin/`
- Detail: `GET /api/drivers/admin/{uuid}`

### Zones (Public)
- List: `GET /api/zone/public/list` (no auth required)
- Returns: `[{ id, name, color }]`

## Error Handling

- Display API error messages in modals without closing them
- On 401 responses, automatically logout and redirect to `/login`
- Show user-friendly error messages for network failures
- Log errors to console for debugging

## Loading States

- Set `loading.value = true` before API calls
- Set `loading.value = false` after completion
- Show loading indicators in UI during data fetching
- Disable submit buttons during form submission

## Data Refresh

- After successful create/update operations, re-fetch the list
- Close modals only after successful API response
- Reset form state after successful submission
