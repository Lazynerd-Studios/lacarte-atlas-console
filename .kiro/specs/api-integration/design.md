# Design Document

## Overview

This document describes the technical design for wiring the LaCarte admin dashboard to real API endpoints. The work is purely integration — no new UI components are introduced. The changes touch the auth flow, route middleware, two list pages, two detail pages, and two create modals.

---

## Architecture

### Single API Base

Both Better Auth and the Business API share the same base URL:

```
NUXT_PUBLIC_API_BASE=https://lacarte.lazynerdstudios.com/api
```

`useApi` prepends this base for all requests. Sign-in calls `/auth/sign-in/email` through `useApi` like any other endpoint — no raw `fetch` needed.

### Auth Flow

```
login.vue
  └─ useApi().post('/auth/sign-in/email', { email, password, rememberMe })
       └─ { token, user } → authStore.setAuth(user, token)
            └─ router.push('/')

app/middleware/auth.ts  (global)
  └─ if !authStore.isAuthenticated && route not in ['/login', '/forgot-password']
       └─ return navigateTo('/login')

useApi (existing)
  └─ attaches Authorization: Bearer {token} on every request
  └─ on 401 → authStore.logout() + router.push('/login')  ← already implemented
```

---

## Component Design

### 1. `app/middleware/auth.ts` (new file)

```ts
export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()
  const publicRoutes = ['/login', '/forgot-password']
  if (!authStore.isAuthenticated && !publicRoutes.includes(to.path)) {
    return navigateTo('/login')
  }
})
```

Register as global middleware by naming it `auth.ts` (Nuxt auto-registers files in `middleware/`).

---

### 2. `app/pages/login.vue`

**Change:** Replace `api.post('/auth/login', ...)` with the correct endpoint via `useApi`.

```ts
async function onSubmit() {
  loading.value = true
  error.value = ''
  try {
    const api = useApi()
    const data = await api.request<{ token: string; user: any }>('/auth/sign-in/email', {
      method: 'POST',
      body: JSON.stringify({ email: form.email, password: form.password, rememberMe: form.remember }),
    })
    authStore.setAuth(data.user, data.token)
    router.push('/')
  } catch (e: any) {
    error.value = e.message || 'Invalid email or password'
  } finally {
    loading.value = false
  }
}
```

---

### 3. `app/pages/customers/index.vue`

**Change:** Replace hardcoded `allCustomers` array with API-driven state.

```ts
// State
const customers = ref<any[]>([])
const total = ref(0)
const loading = ref(false)
const page = ref(1)
const perPage = 20

// Fetch
async function fetchCustomers() {
  loading.value = true
  const params = new URLSearchParams()
  params.set('page', String(page.value))
  params.set('limit', String(perPage))
  if (search.value)       params.set('search', search.value)
  if (statusFilter.value !== 'all') params.set('status', statusFilter.value)
  // planFilter maps to customerTypeId — omit for now (no type UUID in UI)

  const api = useApi()
  const data = await api.get<{ data: any[]; pagination: any }>(`/api/customer/admin/list?${params}`)
  if (data) {
    customers.value = data.data
    total.value = data.pagination.total
  }
  loading.value = false
}

watch([search, statusFilter, planFilter], () => { page.value = 1; fetchCustomers() })
watch(page, fetchCustomers)
onMounted(fetchCustomers)
```

**Template mapping** (API field → column):
- `c.user.name` → Name
- `c.phoneNumber` → Phone
- `c.address` → Address
- `c.customerType.name` → Plan
- `c.status` → Status
- Link to `/customers/${c.id}`

---

### 4. `app/components/AddTruckModal.vue`

**Changes:**
- Rename form field `plate` → `plateNumber`
- Rename form field `vin` → `vinNumber`
- Emit corrected field names in `submit()`

```ts
const form = reactive({
  truckId: '',
  plateNumber: '',   // was: plate
  vinNumber: '',     // was: vin
  make: '',
  model: '',
  year: new Date().getFullYear(),
  capacity: '',
  status: 'active',
  notes: '',
})
```

Emit type updated to match:
```ts
(e: 'submit', data: {
  truckId: string; plateNumber: string; vinNumber: string; make: string; model: string
  year: number; capacity: string; status: string; notes: string
}): void
```

---

### 5. `app/pages/trucks/index.vue`

**Changes:** Replace hardcoded `trucks` array with API state. Wire `handleAddTruck` to POST then re-fetch.

```ts
const trucks = ref<any[]>([])
const loading = ref(false)

async function fetchTrucks() {
  loading.value = true
  const api = useApi()
  const data = await api.get<{ data: any[] }>('/api/trucks/admin/')
  if (data) trucks.value = data.data
  loading.value = false
}

async function handleAddTruck(formData: Record<string, any>) {
  const api = useApi()
  const result = await api.post('/api/trucks/admin/', formData, 'Failed to create truck')
  if (result) {
    showAddTruckModal.value = false
    await fetchTrucks()
  }
}

onMounted(fetchTrucks)
```

**Template:** Link "View Details" to `/trucks/${truck.id}` (UUID), display `truck.truckId` as the ID column, `truck.plateNumber` as plate, `truck.assignedDriver?.name ?? 'Unassigned'` as driver.

---

### 6. `app/pages/trucks/[id].vue`

**Changes:** Replace hardcoded `truck` reactive object with API fetch using route param as UUID.

```ts
const route = useRoute()
const truck = ref<any>(null)
const loading = ref(true)
const notFound = ref(false)

onMounted(async () => {
  const api = useApi()
  const data = await api.get<any>(`/api/trucks/admin/${route.params.id}`)
  if (data) {
    truck.value = data
  } else {
    notFound.value = true
  }
  loading.value = false
})
```

**Field mapping** (API → template):
- `truck.truckId` → display ID (e.g. T-001)
- `truck.plateNumber` → plate
- `truck.vinNumber` → VIN
- `truck.assignedDriver?.name` → driver name
- `truck.gpsDeviceId` → GPS ID
- `truck.lastGpsUpdate` → last GPS
- `truck.registrationExpiry` → registration expiry

---

### 7. `app/components/AddDriverModal.vue`

**Changes:**
- Keep `firstName` + `lastName` inputs in the form for UX
- Combine into `name` before emitting
- Rename `phone` → `phoneNumber`
- Add `licenseExpiry` date field (required by API)
- Replace mock `zones` with API fetch from `GET /api/zone/public/list`
- Replace mock `trucks` with API fetch from `GET /api/trucks/admin/`
- Remove `useMockData()` import

```ts
// Form shape
const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',    // was: phone
  licenseNumber: '',
  licenseExpiry: '',  // new required field (date string YYYY-MM-DD)
  zoneId: '',         // was: zone (now UUID)
  truckId: '',        // was: truck (display only, not sent to API)
  status: 'active',
})

// Load dropdowns on mount
const zones = ref<{ id: string; name: string; color: string }[]>([])
const trucks = ref<{ id: string; truckId: string; plateNumber: string }[]>([])

onMounted(async () => {
  const api = useApi()
  const [zoneData, truckData] = await Promise.all([
    api.get<{ id: string; name: string; color: string }[]>('/api/zone/public/list'),
    api.get<{ data: any[] }>('/api/trucks/admin/'),
  ])
  if (zoneData) zones.value = zoneData
  if (truckData) trucks.value = truckData.data
})

function submit() {
  if (!validate()) return
  emit('submit', {
    email: form.email,
    name: `${form.firstName.trim()} ${form.lastName.trim()}`,
    phoneNumber: form.phoneNumber,
    licenseNumber: form.licenseNumber,
    licenseExpiry: form.licenseExpiry,
    zoneId: form.zoneId || undefined,
    status: form.status,
  })
}
```

---

### 8. `app/pages/drivers/index.vue`

**Changes:** Replace hardcoded `drivers` array with API state. Wire `handleAddDriver` to POST then re-fetch.

```ts
const drivers = ref<any[]>([])
const loading = ref(false)

async function fetchDrivers() {
  loading.value = true
  const api = useApi()
  const data = await api.get<{ data: any[] }>('/api/drivers/admin/')
  if (data) drivers.value = data.data
  loading.value = false
}

async function handleAddDriver(payload: Record<string, any>) {
  const api = useApi()
  const result = await api.post('/api/drivers/admin/', payload, 'Failed to create driver')
  if (result) {
    showAddDriverModal.value = false
    await fetchDrivers()
  }
}

onMounted(fetchDrivers)
```

**Template mapping** (API field → card):
- `d.user.name` → name + initials
- `d.phoneNumber` → phone
- `d.assignedTruck?.truckId` → truck display ID
- `d.zone?.name` → zone
- `d.status` → status badge
- Link "View Details" to `/drivers/${d.id}` (UUID)

---

### 9. `app/pages/drivers/[id].vue`

**Changes:** Replace hardcoded `driver` object with API fetch using route param as UUID.

```ts
const route = useRoute()
const driver = ref<any>(null)
const loading = ref(true)
const notFound = ref(false)

onMounted(async () => {
  const api = useApi()
  const data = await api.get<any>(`/api/drivers/admin/${route.params.id}`)
  if (data) {
    driver.value = data
  } else {
    notFound.value = true
  }
  loading.value = false
})
```

**Field mapping** (API → template):
- `driver.user.name` → full name (split for initials)
- `driver.user.email` → email
- `driver.phoneNumber` → phone
- `driver.zone?.name` → zone
- `driver.assignedTruck?.truckId` → truck
- `driver.status` → status badge
- `driver.licenseNumber`, `driver.licenseExpiry` → license fields
- `driver.totalTrips` → total trips stat

---

## Data Flow Summary

```
Page mounts
  └─ useApi().get(endpoint)
       └─ fetch(apiBase + path, { Authorization: Bearer token })
            ├─ 200 → update reactive state → render
            ├─ 401 → authStore.logout() + redirect /login
            └─ other error → toast shown by useErrorHandler

Form submit
  └─ useApi().post(endpoint, payload)
       ├─ 201 → close modal + re-fetch list
       └─ error → toast shown, modal stays open
```

---

## Files Changed

| File | Change Type |
|------|-------------|
| `app/middleware/auth.ts` | New |
| `app/pages/login.vue` | Modify `onSubmit` |
| `app/pages/customers/index.vue` | Replace mock data with API |
| `app/components/AddTruckModal.vue` | Fix field names |
| `app/pages/trucks/index.vue` | Replace mock data, wire create |
| `app/pages/trucks/[id].vue` | Replace mock data with API |
| `app/components/AddDriverModal.vue` | Fix fields, load dropdowns from API |
| `app/pages/drivers/index.vue` | Replace mock data, wire create |
| `app/pages/drivers/[id].vue` | Replace mock data with API |
