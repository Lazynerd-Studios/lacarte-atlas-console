<script setup lang="ts">
import type { Customer, CustomerPickupHistoryEntry } from '~/types/customer'

definePageMeta({ layout: 'dashboard' })

const { format } = useCurrency()
const route = useRoute()
const toast = useAppToast()

const customer = ref<Customer | null>(null)
const loading = ref(true)
const notFound = ref(false)
const suspending = ref(false)

async function fetchCustomer() {
  loading.value = true
  notFound.value = false
  const api = useApi()
  const data = await api.get<Customer>(
    `/customer/admin/${route.params.id}`,
    'Failed to load customer'
  )
  if (data) {
    customer.value = data
    fetchCreatedBy()
    if (activeTab.value === 'Pickup History') {
      fetchPickupStats()
      fetchPickupHistory()
    }
  } else {
    notFound.value = true
  }
  loading.value = false
}

// Resolve the "created by" admin name from createdById via the team endpoint.
// Fails quietly — the creator may no longer be a team member.
const createdByName = ref('')

async function fetchCreatedBy() {
  const id = customer.value?.createdById
  if (!id) return
  const api = useApi()
  try {
    const member = await api.request<{ user?: { name?: string; email?: string }; name?: string }>(`/team/${id}`)
    createdByName.value = member?.user?.name || member?.name || ''
  } catch {
    createdByName.value = ''
  }
}

const createdByDisplay = computed(() => {
  const c = customer.value
  if (!c) return '—'
  if (c.createdById) return createdByName.value || 'Unknown admin'
  if (c.createdVia === 'customer') return 'Self sign-up'
  return '—'
})

onMounted(fetchCustomer)

const fullName = computed(() => customer.value?.user.name ?? 'Unknown Customer')

const initials = computed(() => {
  const name = customer.value?.user.name?.trim()
  if (!name) return '?'
  const parts = name.split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || name[0]?.toUpperCase() || '?'
})

const statusBadge = computed(() => {
  const s = customer.value?.status
  if (s === 'active')   return { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.2)',  color: '#22c55e', label: 'Active' }
  if (s === 'overdue')  return { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.2)',  color: '#ef4444', label: 'Overdue' }
  return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280', label: 'Inactive' }
})

const showSuspendModal = ref(false)
const showUnsuspendConfirm = ref(false)
const showEditModal = ref(false)
const saving = ref(false)

async function handleSuspend(reason: string) {
  if (!reason.trim()) {
    toast.error('Please provide a reason for suspension')
    return
  }
  if (!customer.value) return

  suspending.value = true
  const api = useApi()
  const result = await api.patch<{ success: boolean; message?: string }>(
    `/customer/admin/${route.params.id}/suspend`,
    { reason: reason.trim() },
    'Failed to suspend account'
  )
  suspending.value = false

  if (result) {
    customer.value.status = 'inactive'
    showSuspendModal.value = false
    toast.success(result.message || 'Account suspended successfully')
  }
}

async function handleUnsuspend() {
  if (!customer.value) return

  suspending.value = true
  const api = useApi()
  const result = await api.patch<{ success: boolean; message?: string }>(
    `/customer/admin/${route.params.id}/unsuspend`,
    {},
    'Failed to unsuspend account'
  )
  suspending.value = false

  if (result) {
    customer.value.status = 'active'
    showUnsuspendConfirm.value = false
    toast.success(result.message || 'Account unsuspended successfully')
  }
}

async function handleEditCustomer(payload: {
  customerTypeId: string
  zoneId: string
  phoneNumber: string
  noBins: number
  capacityRateId: string | null
  address: string
  city: string
  region: string
  postalCode: string
  country: string
  placeName: string
}) {
  if (!customer.value) return
  saving.value = true
  const api = useApi()
  const updated = await api.patch<Customer>(
    `/customer/admin/${route.params.id}`,
    payload,
    'Failed to update customer'
  )
  saving.value = false
  if (updated) {
    customer.value = updated
    showEditModal.value = false
    toast.success('Customer updated successfully')
  }
}

const isSuspended = computed(() => !!customer.value && customer.value.status !== 'active')

// Download QR (disabled — no endpoint yet)
// function downloadQR() {
//   if (!customer.value) return
//   console.log('Download QR for', customer.value.id)
// }

const linkCopied = ref(false)
let copyTimeout: ReturnType<typeof setTimeout> | null = null

function copyPaymentLink() {
  if (!customer.value) return
  const url = `${window.location.origin}/pay/${customer.value.id}`
  navigator.clipboard.writeText(url)
  linkCopied.value = true
  if (copyTimeout) clearTimeout(copyTimeout)
  copyTimeout = setTimeout(() => { linkCopied.value = false }, 2000)
}

function formatDate(dateString?: string | null): string {
  if (!dateString) return '—'
  try {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return dateString
  }
}

function formatDateTime(dateString?: string | null): string {
  if (!dateString) return '—'
  try {
    return new Date(dateString).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return dateString
  }
}

const customerSince = computed(() => formatDate(customer.value?.user.createdAt ?? customer.value?.createdAt))

const activeTab = ref('Overview')
const tabs = ['Overview', 'Pickup History', 'Billing', 'GPS Location']

const config = useRuntimeConfig()
let gpsMap: any = null
const gpsMapError = ref('')
const gpsMapLoading = ref(false)

const hasLocation = computed(() => {
  const loc = customer.value?.location
  return !!loc && loc.latitude != null && loc.longitude != null
})

async function initGpsMap() {
  if (!import.meta.client) return
  if (gpsMap || gpsMapLoading.value) return
  const loc = customer.value?.location
  if (!loc) return

  await nextTick()
  const container = document.getElementById('customer-gps-map')
  if (!container) return

  const apiKey = config.public.tomtomApiKey
  if (!apiKey) {
    gpsMapError.value = 'TomTom API key not configured. Set NUXT_PUBLIC_TOMTOM_API_KEY.'
    return
  }

  gpsMapLoading.value = true
  try {
    const { TomTomConfig } = await import('@tomtom-org/maps-sdk/core')
    const { TomTomMap } = await import('@tomtom-org/maps-sdk/map')
    TomTomConfig.instance.put({ apiKey })
    gpsMap = new TomTomMap({
      style: 'standardLight',
      mapLibre: {
        container: 'customer-gps-map',
        center: [loc.longitude, loc.latitude],
        zoom: 14,
      },
    })

    gpsMap.mapLibreMap.on('load', () => {
      gpsMap.mapLibreMap.addSource('customer-location', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [loc.longitude, loc.latitude] },
          properties: {},
        },
      })
      gpsMap.mapLibreMap.addLayer({
        id: 'customer-pin',
        type: 'circle',
        source: 'customer-location',
        paint: {
          'circle-radius': 10,
          'circle-color': '#ffb400',
          'circle-stroke-width': 3,
          'circle-stroke-color': '#111111',
        },
      })
    })
    gpsMap.mapLibreMap.on('error', (e: any) => {
      console.error('[customer-gps] map error:', e)
      gpsMapError.value = 'Map failed to load.'
    })
  } catch (e) {
    console.error('[customer-gps] map init failed:', e)
    gpsMapError.value = 'Failed to load map.'
  } finally {
    gpsMapLoading.value = false
  }
}

watch(activeTab, (tab) => {
  if (tab === 'GPS Location' && hasLocation.value) {
    nextTick(initGpsMap)
  }
  if (tab === 'Pickup History' && customer.value) {
    fetchPickupStats()
    if (pickupHistory.value.length === 0 && !pickupLoading.value) {
      fetchPickupHistory()
    }
  }
})

onBeforeUnmount(() => {
  if (gpsMap) {
    try { gpsMap.remove() } catch {}
    gpsMap = null
  }
})

// TODO: replace with real endpoints (billing, bins, notes)
const pickupHistory = ref<CustomerPickupHistoryEntry[]>([])
const pickupLoading = ref(false)
const pickupPage = ref(1)
const pickupTotal = ref(0)
const pickupPerPage = 5

// Aggregate counts across all pickups (independent of the current page)
let pickupStats = { completed: 0, missed: 0 }
const pickupStatsLoaded = ref(false)

async function fetchPickupStats() {
  if (!customer.value || pickupStatsLoaded.value) return
  pickupStatsLoaded.value = true
  const api = useApi()
  const all: CustomerPickupHistoryEntry[] = []
  let page = 1
  const limit = 100
  let hasNext = true
  while (hasNext) {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', String(limit))
    params.set('sortBy', 'createdAt')
    params.set('sortOrder', 'desc')
    const res = await api.get<{ data: CustomerPickupHistoryEntry[]; pagination: { total: number; hasNextPage?: boolean } }>(
      `/pickup-requests/admin/customers/${route.params.id}/history?${params.toString()}`,
      'Failed to load pickup stats'
    )
    if (!res) break
    if (res.data) all.push(...res.data)
    pickupTotal.value = res.pagination.total
    hasNext = !!res.pagination.hasNextPage
    page++
  }
  pickupStats = {
    completed: all.filter(p => p.status === 'completed' || p.status === 'picked_up').length,
    missed: all.filter(p => p.status === 'cancelled' || p.status === 'expired' || p.status === 'missed').length,
  }
}

async function fetchPickupHistory() {
  if (!customer.value) return
  pickupLoading.value = true
  const api = useApi()
  const params = new URLSearchParams()
  params.set('page', String(pickupPage.value))
  params.set('limit', String(pickupPerPage))
  params.set('sortBy', 'createdAt')
  params.set('sortOrder', 'desc')
  const res = await api.get<{ data: CustomerPickupHistoryEntry[]; pagination: { total: number } }>(
    `/pickup-requests/admin/customers/${route.params.id}/history?${params.toString()}`,
    'Failed to load pickup history'
  )
  if (res) {
    pickupHistory.value = res.data
    pickupTotal.value = res.pagination.total
  }
  pickupLoading.value = false
}

const pickupSummary = computed(() => ({
  total: pickupTotal.value,
  completed: pickupStats.completed,
  missed: pickupStats.missed,
}))

function formatPaymentType(type?: string | null): string {
  if (!type) return '—'
  if (type === 'pay_as_you_go') return 'PayGO'
  return type.charAt(0).toUpperCase() + type.slice(1)
}

function pickupStatusColor(status?: string | null): string {
  if (status === 'completed' || status === 'picked_up') return '#22c55e'
  if (status === 'cancelled' || status === 'expired' || status === 'missed') return '#ef4444'
  return '#d49a00'
}
function pickupStatusBg(status?: string | null): string {
  if (status === 'completed' || status === 'picked_up') return 'rgba(34,197,94,0.1)'
  if (status === 'cancelled' || status === 'expired' || status === 'missed') return 'rgba(239,68,68,0.1)'
  return 'rgba(255,180,0,0.1)'
}
function pickupStatusBorder(status?: string | null): string {
  if (status === 'completed' || status === 'picked_up') return 'rgba(34,197,94,0.2)'
  if (status === 'cancelled' || status === 'expired' || status === 'missed') return 'rgba(239,68,68,0.2)'
  return 'rgba(255,180,0,0.2)'
}

watch(() => pickupPage.value, () => {
  if (customer.value) fetchPickupHistory()
})
const billingHistory = ref<any[]>([])
// const bins = ref<any[]>([])

// Notes (disabled — no endpoint yet)
// const customerNotes = ref<{ date: string; author: string; text: string }[]>([])
// const staffNotes = ref<{ date: string; author: string; text: string }[]>([])
// const newCustomerNote = ref('')
// const newStaffNote = ref('')

// function addCustomerNote() {
//   if (!newCustomerNote.value.trim()) return
//   customerNotes.value.unshift({
//     date: new Date().toISOString().slice(0, 10),
//     author: fullName.value,
//     text: newCustomerNote.value.trim(),
//   })
//   newCustomerNote.value = ''
// }

// function addStaffNote() {
//   if (!newStaffNote.value.trim()) return
//   staffNotes.value.unshift({ date: new Date().toISOString().slice(0, 10), author: 'Admin', text: newStaffNote.value.trim() })
//   newStaffNote.value = ''
// }
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:21px">

    <!-- Back link -->
    <NuxtLink to="/customers" style="display:inline-flex;align-items:center;gap:8px;text-decoration:none">
      <UIcon name="i-lucide-arrow-left" style="width:16px;height:16px;color:#6b7280" />
      <span style="font-size:16px;color:#6b7280;font-family:'Manrope',sans-serif">Back to Customers</span>
    </NuxtLink>

    <!-- Loading state -->
    <PageSkeleton v-if="loading" type="detail" />

    <!-- Not found state -->
    <div v-else-if="notFound || !customer" style="background:white;border:1px solid #ececec;border-radius:16px;padding:48px;text-align:center">
      <UIcon name="i-lucide-user-x" style="width:40px;height:40px;color:#6b7280;margin-bottom:12px" />
      <p style="font-size:18px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin-bottom:4px">Customer not found</p>
      <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:16px">This customer may have been removed or the ID is invalid.</p>
      <NuxtLink to="/customers" style="display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 16px;background:#ffb400;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;text-decoration:none">
        Back to Customers
      </NuxtLink>
    </div>

    <!-- Profile card -->
    <template v-else>
    <div class="profile-card" style="background:white;border:1px solid #ececec;border-radius:16px;padding:10px 25px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
      <div class="profile-header" style="display:flex;align-items:center;justify-content:space-between;min-height:87px">
        <!-- Left: avatar + info -->
        <div class="profile-info" style="display:flex;align-items:center;gap:16px">
          <div style="width:64px;height:64px;border-radius:9999px;background:#ffb400;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <span style="font-size:24px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ initials }}</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;align-items:center;gap:12px">
            <span style="font-size:24px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">{{ fullName }}</span>
            <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;color:${statusBadge.color};background:${statusBadge.bg};border:1px solid ${statusBadge.border};border-radius:14px;padding:3px 11px`">
              {{ statusBadge.label }}
            </span>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:16px">
            <div style="display:flex;align-items:center;gap:8px">
              <UIcon name="i-lucide-phone" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
              <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ customer.phoneNumber || '—' }}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <UIcon name="i-lucide-mail" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
              <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ customer.user.email }}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <UIcon name="i-lucide-map-pin" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
              <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ customer.placeName || customer.address || '—' }}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <UIcon name="i-lucide-calendar" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
              <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Customer since {{ customerSince }}</span>
            </div>
            </div>
          </div>
        </div>
        <!-- Right: actions -->
        <div class="profile-actions" style="display:flex;gap:8px;flex-shrink:0">
          <!-- Download QR (disabled — no endpoint yet)
          <button
            style="height:40px;width:40px;background:#ffb400;border:none;border-radius:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0"
            title="Download QR"
            @click="downloadQR"
          >
            <UIcon name="i-lucide-qr-code" style="width:16px;height:16px;color:#0a0d12" />
          </button>
          -->
          <!-- Copy payment link (hidden for now)
          <div style="position:relative;display:inline-flex">
            <button
              :style="`height:40px;width:40px;background:${linkCopied ? '#22c55e' : '#3b82f6'};border:none;border-radius:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background 0.2s`"
              title="Copy payment link"
              @click="copyPaymentLink"
            >
              <UIcon :name="linkCopied ? 'i-lucide-check' : 'i-lucide-link'" style="width:16px;height:16px;color:white" />
            </button>
            <div
              v-if="linkCopied"
              style="position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);background:#1a1a1a;color:white;font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;padding:4px 10px;border-radius:8px;white-space:nowrap;pointer-events:none"
            >
              Link copied!
              <div style="position:absolute;top:100%;left:50%;transform:translateX(-50%);border:5px solid transparent;border-top-color:#1a1a1a"></div>
            </div>
          </div>
          -->
          <!-- Make Payment (hidden for now)
          <button
            style="height:40px;padding:0 16px;background:#22c55e;border:none;border-radius:20px;font-size:14px;font-weight:500;color:white;font-family:'Manrope',sans-serif;cursor:pointer;display:flex;align-items:center;gap:8px"
            @click="$router.push(`/pay/${customer.id}`)"
          >
            <UIcon name="i-lucide-credit-card" style="width:16px;height:16px;color:white" />
            Make Payment
          </button>
          -->
          <button
            style="height:40px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
            @click="showEditModal = true"
          >
            Edit Customer
          </button>
          <button
            :style="`height:40px;padding:0 16px;background:${isSuspended ? '#22c55e' : '#ef4444'};border:none;border-radius:20px;font-size:14px;font-weight:500;color:white;font-family:'Manrope',sans-serif;cursor:pointer`"
            @click="isSuspended ? (showUnsuspendConfirm = true) : (showSuspendModal = true)"
          >
            {{ isSuspended ? 'Unsuspend Account' : 'Suspend Account' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Stat cards -->
    <div class="grid-cols-4 stat-cards">
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:1px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <div style="padding:10px 24px 10px">
          <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:8px">Customer Type</p>
          <p style="font-size:20px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ customer.customerType?.name || '—' }}</p>
        </div>
      </div>
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:1px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <div style="padding:10px 24px 10px">
          <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:8px">Zone</p>
          <p style="font-size:20px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">
            <span v-if="customer.zone" :style="`color:${customer.zone.color}`">{{ customer.zone.name }}</span>
            <span v-else>—</span>
          </p>
        </div>
      </div>
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:1px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <div style="padding:10px 24px 10px">
          <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:8px">Assigned Bins</p>
          <p style="font-size:20px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ customer.noBins }}</p>
        </div>
      </div>
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:1px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <div style="padding:10px 24px 10px">
          <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:8px">Customer Since</p>
          <p style="font-size:20px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ customerSince }}</p>
        </div>
      </div>
    </div>

    <!-- Tabbed card -->
    <div class="tabbed-card" style="background:white;border:1px solid #ececec;border-radius:16px;padding:1px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
      <!-- Tab bar -->
      <div class="tab-bar" style="padding:24px 24px 0;border-bottom:1px solid #e5e7eb;display:flex;gap:0">
        <button
          v-for="tab in tabs"
          :key="tab"
          :style="`padding:12px 16px 14px;border:none;background:none;cursor:pointer;font-size:14px;font-weight:500;font-family:'Manrope',sans-serif;white-space:nowrap;border-bottom:2px solid ${activeTab === tab ? '#ffb400' : 'transparent'};color:${activeTab === tab ? '#1a1a1a' : '#6b7280'};margin-bottom:-1px`"
          @click="activeTab = tab"
        >{{ tab }}</button>
      </div>

      <!-- Tab content -->
      <div style="padding:24px">

        <!-- Overview -->
        <div v-if="activeTab === 'Overview'" class="overview-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
          <div style="display:flex;flex-direction:column;gap:16px">
            <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Account Information</p>
            <div style="display:flex;flex-direction:column;gap:12px">
              <div v-for="row in [
                { label: 'Customer ID',     value: customer.id },
                { label: 'Customer Type',   value: customer.customerType?.name || '—' },
                { label: 'Account Role',    value: customer.user.role },
                { label: 'Email Verified',  value: customer.user.emailVerified ? 'Yes' : 'No' },
                { label: 'Customer Since',  value: customerSince },
                { label: 'Created By',      value: createdByDisplay },
              ]" :key="row.label" style="display:flex;flex-direction:column;gap:2px">
                <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ row.label }}</p>
                <p style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif;text-transform:capitalize">{{ row.value }}</p>
              </div>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:24px">
            <div style="display:flex;flex-direction:column;gap:16px">
              <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Service Address</p>
              <div style="display:flex;flex-direction:column;gap:12px">
                <div v-for="row in [
                  { label: 'Address',      value: customer.address },
                  { label: 'City',         value: customer.city },
                  { label: 'Region',       value: customer.region },
                  { label: 'Postal Code',  value: customer.postalCode },
                  { label: 'Country',      value: customer.country },
                  { label: 'Place Name',   value: customer.placeName },
                ]" :key="row.label" style="display:flex;flex-direction:column;gap:2px">
                  <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ row.label }}</p>
                  <p style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ row.value || '—' }}</p>
                </div>
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:16px">
              <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Assigned Zone</p>
              <div style="display:flex;flex-direction:column;gap:12px">
                <div v-for="row in [
                  { label: 'Zone',    value: customer.zone?.name },
                  { label: 'Active',  value: customer.zone?.isActive ? 'Yes' : 'No' },
                ]" :key="row.label" style="display:flex;flex-direction:column;gap:2px">
                  <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ row.label }}</p>
                  <p style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ row.value || '—' }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pickup History -->
        <div v-else-if="activeTab === 'Pickup History'" style="display:flex;flex-direction:column;gap:16px">
          <!-- Summary row -->
          <div class="summary-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
            <div style="background:#f8f9fa;border-radius:16px;padding:16px 20px">
              <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:4px">Total Pickups</p>
              <p style="font-size:20px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ pickupTotal }}</p>
            </div>
            <div style="background:#f8f9fa;border-radius:16px;padding:16px 20px">
              <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:4px">Completed</p>
              <p style="font-size:20px;font-weight:700;color:#22c55e;font-family:'Manrope',sans-serif">{{ pickupSummary.completed }}</p>
            </div>
            <div style="background:#f8f9fa;border-radius:16px;padding:16px 20px">
              <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:4px">Cancelled / Expired</p>
              <p style="font-size:20px;font-weight:700;color:#ef4444;font-family:'Manrope',sans-serif">{{ pickupSummary.missed }}</p>
            </div>
          </div>

          <!-- Table -->
          <div class="table-scroll" style="border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;position:relative">
            <div v-if="pickupLoading" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.6);z-index:1">
              <UIcon name="i-lucide-loader-2" style="width:22px;height:22px;color:#ffb400;animation:spin 1s linear infinite" />
            </div>
            <table style="width:100%;border-collapse:collapse;min-width:560px">
              <thead>
                <tr style="background:#f8f9fa;border-bottom:1px solid #e5e7eb">
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Date</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Driver</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Payment Type</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Quantity</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(p, i) in pickupHistory"
                  :key="p.id ?? i"
                  style="border-bottom:1px solid #e5e7eb"
                  @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
                >
                  <td style="padding:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap;font-weight:500">
                    {{ formatDate(p.preferredPickupDate ?? p.createdAt) }}
                  </td>
                  <td style="padding:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ p.driver?.name || '—' }}</td>
                  <td style="padding:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ formatPaymentType(p.paymentType) }}</td>
                  <td style="padding:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ p.estimatedQuantity?.label || '—' }}</td>
                  <td style="padding:16px">
                    <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 10px;white-space:nowrap;text-transform:capitalize;
                      color:${pickupStatusColor(p.status)};
                      background:${pickupStatusBg(p.status)};
                      border:1px solid ${pickupStatusBorder(p.status)}`">
                      {{ p.status?.replace(/_/g, ' ') || '—' }}
                    </span>
                  </td>
                </tr>
                <tr v-if="!pickupLoading && pickupHistory.length === 0">
                  <td colspan="5" style="padding:48px 16px;text-align:center;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">No pickup history found</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <AppPagination
            v-if="pickupTotal > pickupPerPage"
            :page="pickupPage"
            :total="pickupTotal"
            :per-page="pickupPerPage"
            @update:page="pickupPage = $event"
          />
        </div>

        <!-- Billing -->
        <div v-else-if="activeTab === 'Billing'" style="display:flex;flex-direction:column;gap:16px">
          <!-- Summary row -->
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
            <div style="background:#f8f9fa;border-radius:16px;padding:16px 20px">
              <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:4px">Total Billed</p>
              <p style="font-size:20px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">
                GHS {{ billingHistory.reduce((s, b) => s + b.amountRaw, 0).toLocaleString() }}
              </p>
            </div>
            <div style="background:#f8f9fa;border-radius:16px;padding:16px 20px">
              <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:4px">Paid</p>
              <p style="font-size:20px;font-weight:700;color:#22c55e;font-family:'Manrope',sans-serif">
                GHS {{ billingHistory.filter(b => b.status === 'paid').reduce((s, b) => s + b.amountRaw, 0).toLocaleString() }}
              </p>
            </div>
            <div style="background:#f8f9fa;border-radius:16px;padding:16px 20px">
              <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:4px">Outstanding</p>
              <p style="font-size:20px;font-weight:700;font-family:'Manrope',sans-serif"
                :style="billingHistory.filter(b => b.status !== 'paid').reduce((s, b) => s + b.amountRaw, 0) > 0 ? 'color:#ef4444' : 'color:#22c55e'">
                GHS {{ billingHistory.filter(b => b.status !== 'paid').reduce((s, b) => s + b.amountRaw, 0).toLocaleString() }}
              </p>
            </div>
          </div>

          <!-- Table -->
          <div class="table-scroll" style="border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
            <table style="width:100%;border-collapse:collapse;min-width:600px">
              <thead>
                <tr style="background:#f8f9fa;border-bottom:1px solid #e5e7eb">
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Date</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Invoice</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Amount</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Status</th>
                  <th style="padding:14px 16px;text-align:right;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(b, i) in billingHistory"
                  :key="i"
                  style="border-bottom:1px solid #e5e7eb"
                  @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
                >
                  <td style="padding:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ b.date }}</td>
                  <td style="padding:16px;font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ b.invoice }}</td>
                  <td style="padding:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ format(b.amountRaw) }}</td>
                  <td style="padding:16px">
                    <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 10px;white-space:nowrap;
                      color:${b.status === 'paid' ? '#22c55e' : b.status === 'overdue' ? '#ef4444' : '#d49a00'};
                      background:${b.status === 'paid' ? 'rgba(34,197,94,0.1)' : b.status === 'overdue' ? 'rgba(239,68,68,0.1)' : 'rgba(255,180,0,0.1)'};
                      border:1px solid ${b.status === 'paid' ? 'rgba(34,197,94,0.2)' : b.status === 'overdue' ? 'rgba(239,68,68,0.2)' : 'rgba(255,180,0,0.2)'}`">
                      {{ b.status }}
                    </span>
                  </td>
                  <td style="padding:16px;text-align:right">
                    <button
                      style="height:32px;padding:0 12px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer;white-space:nowrap"
                      @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
                      @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
                    >View Invoice</button>
                  </td>
                </tr>
                <tr v-if="billingHistory.length === 0">
                  <td colspan="5" style="padding:48px 16px;text-align:center;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">No billing records found</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Assigned Bins (disabled — no endpoint yet)
        <div v-else-if="activeTab === 'Assigned Bins'">
          <div class="table-scroll" style="border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
            <table style="width:100%;border-collapse:collapse;min-width:480px">
              <thead>
                <tr style="background:#f8f9fa;border-bottom:1px solid #e5e7eb">
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Bin Type</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Size</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Assigned Date</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(bin, i) in bins"
                  :key="i"
                  style="border-bottom:1px solid #e5e7eb"
                  @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
                >
                  <td style="padding:18px 16px;font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ bin.type }}</td>
                  <td style="padding:18px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ bin.size }}</td>
                  <td style="padding:18px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ bin.assigned }}</td>
                  <td style="padding:18px 16px">
                    <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 10px;white-space:nowrap;
                      color:${bin.status === 'active' ? '#22c55e' : '#6b7280'};
                      background:${bin.status === 'active' ? 'rgba(34,197,94,0.1)' : '#e5e7eb'};
                      border:1px solid ${bin.status === 'active' ? 'rgba(34,197,94,0.2)' : '#e5e7eb'}`">
                      {{ bin.status }}
                    </span>
                  </td>
                </tr>
                <tr v-if="bins.length === 0">
                  <td colspan="4" style="padding:48px 16px;text-align:center;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">No bins assigned</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        -->

        <!-- GPS Location -->
        <div v-else-if="activeTab === 'GPS Location'" style="display:flex;flex-direction:column;gap:20px">
          <!-- Info row -->
          <div class="summary-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
            <div style="background:#f8f9fa;border-radius:16px;padding:16px 20px">
              <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:4px">Place Name</p>
              <p style="font-size:16px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ customer.placeName || '—' }}</p>
            </div>
            <div style="background:#f8f9fa;border-radius:16px;padding:16px 20px">
              <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:4px">Address</p>
              <p style="font-size:16px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ customer.address || '—' }}</p>
            </div>
            <div style="background:#f8f9fa;border-radius:16px;padding:16px 20px">
              <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:4px">Last Updated</p>
              <p style="font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ formatDateTime(customer.locationUpdatedAt) }}</p>
            </div>
          </div>

          <!-- Address -->
          <div style="background:#f8f9fa;border-radius:16px;padding:16px 20px;display:flex;align-items:center;gap:12px">
            <UIcon name="i-lucide-map-pin" style="width:18px;height:18px;color:#ffb400;flex-shrink:0" />
            <div>
              <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:2px">Resolved Address</p>
              <p style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ customer.placeName || customer.address || '—' }}</p>
            </div>
          </div>

          <!-- Map -->
          <div style="border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;height:340px;position:relative;background:#f0f4f8">
            <div v-if="hasLocation" id="customer-gps-map" data-testid="customer-gps-map" style="position:absolute;inset:0;width:100%;height:100%"></div>

            <!-- Loading overlay -->
            <div v-if="hasLocation && gpsMapLoading" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.6)">
              <UIcon name="i-lucide-loader-2" style="width:24px;height:24px;color:#ffb400;animation:spin 1s linear infinite" />
            </div>

            <!-- Error -->
            <div v-if="gpsMapError" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;padding:16px;text-align:center">
              <UIcon name="i-lucide-map-pin-off" style="width:28px;height:28px;color:#6b7280" />
              <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ gpsMapError }}</p>
            </div>

            <!-- No location placeholder -->
            <template v-else-if="!hasLocation">
              <svg style="position:absolute;inset:0;width:100%;height:100%;opacity:0.15" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#6b7280" stroke-width="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
              <div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:8px;height:100%;align-items:center;justify-content:center">
                <div style="width:48px;height:48px;border-radius:9999px;background:#ffb400;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(255,180,0,0.4)">
                  <UIcon name="i-lucide-map-pin" style="width:24px;height:24px;color:#1a1a1a" />
                </div>
                <p style="font-size:13px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ fullName }}</p>
                <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">No GPS coordinates available for this customer</p>
              </div>
            </template>
          </div>
        </div>

        <!-- Notes (disabled — no endpoint yet)
        <div v-else-if="activeTab === 'Notes'" class="notes-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:24px">

          <div style="display:flex;flex-direction:column;gap:16px">
            <p style="font-size:18px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Customer Notes</p>
            <p style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:-8px">Notes submitted by the customer</p>

            <div style="display:flex;flex-direction:column;gap:10px">
              <p v-if="customerNotes.length === 0" style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;text-align:center;padding:24px 0">No customer notes yet</p>
              <div v-for="(note, i) in customerNotes" :key="i" style="background:#f8f9fa;border:1px solid #e5e7eb;border-radius:16px;padding:16px">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
                  <div style="display:flex;align-items:center;gap:8px">
                    <div style="width:28px;height:28px;border-radius:9999px;background:#3b82f6;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                      <span style="font-size:11px;font-weight:700;color:white;font-family:'Manrope',sans-serif">{{ note.author[0] }}</span>
                    </div>
                    <span style="font-size:13px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ note.author }}</span>
                  </div>
                  <span style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">{{ note.date }}</span>
                </div>
                <p style="font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;line-height:1.6;margin-left:36px">{{ note.text }}</p>
              </div>
            </div>

            <div style="display:flex;flex-direction:column;gap:8px">
              <textarea
                v-model="newCustomerNote"
                placeholder="Add a customer note..."
                rows="3"
                style="width:100%;padding:10px 12px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;resize:none;box-sizing:border-box;line-height:1.5"
                @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
                @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
              />
              <div style="display:flex;justify-content:flex-end">
                <button
                  style="height:36px;padding:0 16px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer"
                  @click="addCustomerNote"
                  @mouseover="($event.currentTarget as HTMLElement).style.opacity='0.9'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.opacity='1'"
                >Add Note</button>
              </div>
            </div>
          </div>

          <div style="display:flex;flex-direction:column;gap:16px">
            <p style="font-size:18px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Staff Notes</p>
            <p style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:-8px">Internal notes visible to staff only</p>

            <div style="display:flex;flex-direction:column;gap:10px">
              <p v-if="staffNotes.length === 0" style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;text-align:center;padding:24px 0">No staff notes yet</p>
              <div v-for="(note, i) in staffNotes" :key="i" style="background:#fff9e6;border:1px solid rgba(255,180,0,0.2);border-radius:16px;padding:16px">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
                  <div style="display:flex;align-items:center;gap:8px">
                    <div style="width:28px;height:28px;border-radius:9999px;background:#ffb400;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                      <span style="font-size:11px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ note.author[0] }}</span>
                    </div>
                    <span style="font-size:13px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ note.author }}</span>
                  </div>
                  <span style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">{{ note.date }}</span>
                </div>
                <p style="font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;line-height:1.6;margin-left:36px">{{ note.text }}</p>
              </div>
            </div>

            <div style="display:flex;flex-direction:column;gap:8px">
              <textarea
                v-model="newStaffNote"
                placeholder="Add a staff note..."
                rows="3"
                style="width:100%;padding:10px 12px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;resize:none;box-sizing:border-box;line-height:1.5"
                @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
                @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
              />
              <div style="display:flex;justify-content:flex-end">
                <button
                  style="height:36px;padding:0 16px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer"
                  @click="addStaffNote"
                  @mouseover="($event.currentTarget as HTMLElement).style.opacity='0.9'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.opacity='1'"
                >Add Note</button>
              </div>
            </div>
          </div>

        </div>
        -->

      </div>
    </div>
    </template>
  </div>

  <!-- Suspend Account Modal -->
  <SuspendModal
    v-if="showSuspendModal && customer"
    :customer-name="fullName"
    :loading="suspending"
    @close="showSuspendModal = false"
    @confirm="handleSuspend"
  />

  <!-- Unsuspend Account Confirm Dialog -->
  <ConfirmDialog
    v-if="showUnsuspendConfirm && customer"
    title="Unsuspend Account"
    :message="`Are you sure you want to reactivate ${fullName}'s account?`"
    confirm-text="Unsuspend Account"
    confirm-color="#22c55e"
    :loading="suspending"
    @confirm="handleUnsuspend"
    @cancel="showUnsuspendConfirm = false"
  />

  <!-- Edit Customer Modal -->
  <EditCustomerModal
    v-if="showEditModal && customer"
    :customer="customer"
    :saving="saving"
    @close="showEditModal = false"
    @submit="handleEditCustomer"
  />
</template>

<style scoped>
/* Responsive adjustments for customer detail page */

@media (max-width: 1024px) {
  .profile-header {
    align-items: flex-start !important;
    gap: 16px;
  }

  .profile-actions {
    flex-wrap: wrap;
    justify-content: flex-end;
    max-width: 260px;
  }
}

@media (max-width: 768px) {
  .profile-card {
    padding: 16px !important;
  }

  .profile-header {
    flex-direction: column !important;
    align-items: flex-start !important;
  }

  .profile-info {
    width: 100%;
  }

  .profile-actions {
    width: 100%;
    justify-content: flex-start;
    max-width: none;
  }

  .tab-bar {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .tab-bar::-webkit-scrollbar {
    display: none;
  }

  .overview-grid,
  .notes-grid {
    grid-template-columns: 1fr !important;
  }

  .summary-grid {
    grid-template-columns: 1fr !important;
  }
}

@media (max-width: 480px) {
  .profile-info {
    flex-direction: column !important;
    align-items: flex-start !important;
  }

  .profile-actions button {
    font-size: 13px;
  }
}
</style>
