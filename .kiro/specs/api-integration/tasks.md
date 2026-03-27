# Implementation Plan: API Integration

## Overview

Replace all hardcoded mock data in the LaCarte admin dashboard with real API calls. Work is purely integration — no new UI components. Tasks follow the dependency order: config → auth → middleware → modals → list pages → detail pages.

## Tasks

- [x] 1. Update `nuxt.config.ts` default API base URL
  - Change the fallback value in `runtimeConfig.public.apiBase` from `http://localhost:3001` to `https://lacarte.lazynerdstudios.com/api`
  - _Requirements: 10.1_

- [x] 2. Fix login page to call the correct auth endpoint
  - In `app/pages/login.vue`, replace `api.post('/auth/login', ...)` with `api.request('/auth/sign-in/email', { method: 'POST', body: JSON.stringify({ email, password, rememberMe }) })`
  - On success store `data.user` and `data.token` via `authStore.setAuth()` then redirect to `/`
  - On error display `e.message` in the existing `error` ref
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 3. Create global auth middleware
  - Create `app/middleware/auth.ts` as a global Nuxt route middleware
  - Allow `/login` and `/forgot-password` through; redirect everything else to `/login` when `authStore.isAuthenticated` is `false`
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 4. Fix field names in `AddTruckModal.vue`
  - [x] 4.1 Rename form field `plate` → `plateNumber` and `vin` → `vinNumber` in the reactive form object and all template bindings
    - Update the `emit` type signature to use `plateNumber` and `vinNumber`
    - _Requirements: 4.2, 4.3_

- [x] 5. Wire trucks list page to the API
  - [x] 5.1 Replace the hardcoded `trucks` array in `app/pages/trucks/index.vue` with `ref<any[]>([])` and add `fetchTrucks()` that calls `GET /api/trucks/admin/`
    - Call `fetchTrucks()` in `onMounted`
    - Display `truck.truckId` in the ID column, `truck.plateNumber` as plate, `truck.assignedDriver?.name ?? 'Unassigned'` as driver
    - _Requirements: 5.1, 5.2_
  - [x] 5.2 Wire `handleAddTruck` to `POST /api/trucks/admin/` then re-fetch on success
    - Pass the full `formData` from the modal emit as the POST body
    - Close the modal only on a successful response; on error the toast from `useApi` is sufficient
    - _Requirements: 4.1, 4.4, 4.5, 5.3_
  - [x] 5.3 Fix the "View Details" link to use the truck UUID (`truck.id`) instead of `truck.id.toLowerCase()`
    - _Requirements: 5.4_

- [x] 6. Wire truck detail page to the API
  - [x] 6.1 Replace the hardcoded `truck` reactive object in `app/pages/trucks/[id].vue` with `ref<any>(null)` and fetch `GET /api/trucks/admin/${route.params.id}` on mount
    - Add `loading` and `notFound` refs; show a "Truck not found" message when the API returns null/error
    - _Requirements: 6.1, 6.3_
  - [x] 6.2 Update all template bindings to use the API field names: `truck.truckId`, `truck.plateNumber`, `truck.vinNumber`, `truck.assignedDriver?.name`, `truck.gpsDeviceId`, `truck.lastGpsUpdate`, `truck.registrationExpiry`
    - _Requirements: 6.2_

- [x] 7. Checkpoint — ensure trucks flow works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Fix field names and load dropdowns from API in `AddDriverModal.vue`
  - [x] 8.1 Rename form field `phone` → `phoneNumber`; add `licenseExpiry` date input; replace `firstName`/`lastName` split with a combined `name` field sent on submit
    - Remove `useMockData()` import and the `zones`/`trucks` variables it provided
    - _Requirements: 7.2, 7.3_
  - [x] 8.2 On `onMounted`, fetch zones from `GET /api/zone/public/list` (no auth needed) and trucks from `GET /api/trucks/admin/` in parallel via `Promise.all`
    - Populate `zones` ref with `[{ id, name, color }]` and `trucks` ref with `data.data`
    - Update zone `<select>` to bind `:value="z.id"` and truck `<select>` to bind `:value="t.id"` with display label `t.truckId – t.plateNumber`
    - _Requirements: 7.4, 7.5_
  - [x] 8.3 Update `submit()` to emit `{ email, name, phoneNumber, licenseNumber, licenseExpiry, zoneId, status }` — omit `truckId` from the POST body (truck assignment is a separate API concern)
    - _Requirements: 7.1_

- [x] 9. Wire drivers list page to the API
  - [x] 9.1 Replace the hardcoded `drivers` array in `app/pages/drivers/index.vue` with `ref<any[]>([])` and add `fetchDrivers()` that calls `GET /api/drivers/admin/`
    - Call `fetchDrivers()` in `onMounted`
    - Map API fields to card display: `d.user?.name` for name/initials, `d.phoneNumber`, `d.assignedTruck?.truckId`, `d.zone?.name`, `d.status`
    - _Requirements: 8.1, 8.3_
  - [x] 9.2 Wire `handleAddDriver` to `POST /api/drivers/admin/` with the payload from the modal emit, then re-fetch on success
    - _Requirements: 7.6, 7.7, 8.4_
  - [x] 9.3 Fix the "View Details" link to use the driver UUID (`d.id`) instead of the name slug
    - _Requirements: 8.5_

- [ ] 10. Wire driver detail page to the API
  - [x] 10.1 Replace the hardcoded `driver` object in `app/pages/drivers/[id].vue` with `ref<any>(null)` and fetch `GET /api/drivers/admin/${route.params.id}` on mount
    - Add `loading` and `notFound` refs; show a "Driver not found" message when the API returns null/error
    - _Requirements: 9.1, 9.3_
  - [x] 10.2 Update all template bindings to use API field names: `driver.user?.name` (split for initials), `driver.user?.email`, `driver.phoneNumber`, `driver.zone?.name`, `driver.assignedTruck?.truckId`, `driver.status`, `driver.licenseNumber`, `driver.licenseExpiry`, `driver.totalTrips`
    - _Requirements: 9.2_

- [ ] 11. Wire customers list page to the API
  - [x] 11.1 Replace the hardcoded `allCustomers` array in `app/pages/customers/index.vue` with `ref<any[]>([])` and a `total` ref; add `fetchCustomers()` that calls `GET /api/customer/admin/list` with query params `page`, `limit`, `search`, `status`
    - Call `fetchCustomers()` in `onMounted`; update `watch` on filters to reset page and re-fetch
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 11.2 Update template to map API fields: `c.user?.name` → Name, `c.phoneNumber` → Phone, `c.address` → Address, `c.customerType?.name` → Plan, `c.status` → Status
    - Fix the "View" link to use `c.id` (UUID) instead of the array index
    - Show an empty-state row when the API returns an error (existing empty row handles this if `customers` stays `[]`)
    - _Requirements: 3.3, 3.6_

- [x] 12. Final checkpoint — ensure all flows work end-to-end
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All API calls go through `useApi()` — never raw `fetch`
- `useApi().get/post` auto-shows error toasts via `useErrorHandler`; modals should stay open on error (toast is sufficient feedback)
- 401 handling (logout + redirect) is already implemented in `useApi`
- Tasks marked with `*` are optional and can be skipped for a faster MVP
