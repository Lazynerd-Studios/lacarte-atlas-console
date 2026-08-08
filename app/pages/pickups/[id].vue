<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const { format } = useCurrency()

interface PickupRequestDetail {
  id: string
  customerId: string
  preferredPickupDate: string
  additionalNotes: string | null
  status: string
  paymentType: string
  paymentStatus: string
  createdAt: string
  updatedAt: string
  customer: {
    id: string
    name: string
    phoneNumber: string
    address: string
    city: string
    region: string
    postalCode: string
    placeName: string
    noBins: number
    status: string
    customerType: {
      id: string
      name: string
    }
  }
  disposableItemType: {
    id: string
    name: string
    description: string
    icon: string
  }
  estimatedQuantity: {
    id: string
    label: string
    description: string
    binCount?: number | null
  }
  pricingMode?: 'per_bin' | 'full_truck'
  truckLoadRateId?: string | null
  truckLoadLabel?: string | null
  loadAdjustedAt?: string | null
  assignment: {
    id: string
    scheduledDate: string
    timeSlot: string
    priorityLevel: string
    adminNotes: string
    driver: {
      id: string
      name: string
      phoneNumber: string
      licenseNumber: string
      status: string
    }
    truck: {
      id: string
      truckId: string
      plateNumber: string
      make: string
      model: string
    }
  } | null
}

interface ActivityLogResponse {
  timeline: {
    requestCreated: { completedAt: string | null }
    driverAssigned: { completedAt: string | null }
    tripStarted: { completedAt: string | null }
    pickupCompleted: { completedAt: string | null }
  }
  activities: Array<{
    id: string
    actorId: string
    actorType: string
    action: string
    description: string
    module: string
    entityType: string
    entityId: string
    before: any
    after: any
    ipAddress: string
    userAgent: string
    correlationId: string | null
    createdAt: string
  }>
}

const loading = ref(true)
const error = ref<string | null>(null)
const pickupData = ref<PickupRequestDetail | null>(null)
const activityLogData = ref<ActivityLogResponse | null>(null)

const api = useApi()

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleString('en-US', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

// Fetch pickup request details
async function fetchPickupDetails() {
  loading.value = true
  error.value = null
  
  try {
    const data = await api.get<PickupRequestDetail>(
      `/pickup-requests/admin/${route.params.id}`,
      'Failed to load pickup request details'
    )
    
    if (data) {
      pickupData.value = data
    }
  } catch (err: any) {
    error.value = err?.message || 'An unexpected error occurred'
    console.error('Error fetching pickup details:', err)
  } finally {
    loading.value = false
  }
}

// Fetch activity log
async function fetchActivityLog() {
  try {
    const data = await api.get<ActivityLogResponse>(
      `/pickup-requests/admin/${route.params.id}/activity-log`,
      'Failed to load activity log'
    )
    
    if (data) {
      activityLogData.value = data
    }
  } catch (err: any) {
    console.error('Error fetching activity log:', err)
  }
}

// Computed properties for display
const pickup = computed(() => {
  if (!pickupData.value) return null
  
  const data = pickupData.value
  const assignment = data.assignment
  
  return {
    id: data.id,
    customer: data.customer.name,
    customerPhone: data.customer.phoneNumber,
    customerEmail: '—', // Not provided by API
    address: data.customer.address,
    city: data.customer.city || '—',
    region: data.customer.region || '—',
    postalCode: data.customer.postalCode || '—',
    placeName: data.customer.placeName || '—',
    noBins: data.customer.noBins,
    customerType: data.customer.customerType.name,
    zone: data.customer.region || data.customer.city || '—',
    date: formatDate(data.preferredPickupDate),
    timeSlot: assignment?.timeSlot || '—',
    paymentType: data.paymentType,
    paymentStatus: data.paymentStatus,
    amount: 0, // Not provided by API for individual requests
    status: data.status,
    driver: assignment?.driver?.name || null,
    driverPhone: assignment?.driver?.phoneNumber || null,
    driverLicense: assignment?.driver?.licenseNumber || null,
    truck: assignment?.truck ? `${assignment.truck.plateNumber}` : null,
    truckDetails: assignment?.truck ? `${assignment.truck.make} ${assignment.truck.model}` : null,
    notes: data.additionalNotes || '—',
    disposableType: data.disposableItemType.name,
    estimatedQuantity: data.estimatedQuantity.label,
    // Bins snapshot taken at request time; falls back to the customer's bin count when absent
    bins: data.estimatedQuantity.binCount != null
      ? `${data.estimatedQuantity.binCount}`
      : (data.customer.noBins != null ? `${data.customer.noBins} (customer default)` : '—'),
    createdAt: formatDateTime(data.createdAt),
    assignedAt: assignment ? formatDateTime(assignment.scheduledDate) : '',
    startedAt: '',
    completedAt: '',
  }
})

const activeTab = ref('Details')
const tabs = ['Details', 'Activity Log', 'Notes']

// Fetch data on mount
onMounted(() => {
  fetchPickupDetails()
  fetchActivityLog()
})

watch(activeTab, (tab) => {
  if (tab === 'Notes' && pickupData.value) {
    fetchNotes()
  }
})

const statusBadge = computed(() => {
  if (!pickup.value) return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280', label: 'Unknown' }
  
  const status = pickup.value.status.toLowerCase()
  if (status === 'pending')           return { bg: 'rgba(255,180,0,0.1)',  border: 'rgba(255,180,0,0.2)',  color: '#d49a00',  label: 'Pending' }
  if (status === 'assigned')          return { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', color: '#3b82f6',  label: 'Assigned' }
  if (status === 'truck_dispatched')  return { bg: 'rgba(255,180,0,0.1)',  border: 'rgba(255,180,0,0.2)',  color: '#d49a00',  label: 'Dispatched' }
  if (status === 'en_route')          return { bg: 'rgba(255,180,0,0.1)',  border: 'rgba(255,180,0,0.2)',  color: '#d49a00',  label: 'En Route' }
  if (status === 'picked_up')         return { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', color: '#3b82f6',  label: 'Picked Up' }
  if (status === 'completed')         return { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.2)',  color: '#22c55e',  label: 'Completed' }
  if (status === 'cancelled')         return { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.2)',  color: '#ef4444',  label: 'Cancelled' }
  return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280', label: pickup.value.status }
})

const paymentStatusBadge = computed(() => {
  if (!pickup.value) return { bg: 'white', border: '#ececec', color: '#1a1a1a', label: 'Unknown' }
  
  const status = pickup.value.paymentStatus.toLowerCase()
  if (status === 'active-plan' || status === 'active_plan') return { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)', color: '#22c55e', label: 'Active Plan' }
  if (status === 'paid')        return { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)', color: '#22c55e', label: 'Paid' }
  if (status === 'unpaid')      return { bg: 'white', border: '#ececec', color: '#1a1a1a', label: 'Unpaid' }
  return { bg: 'white', border: '#ececec', color: '#1a1a1a', label: pickup.value.paymentStatus }
})

const paymentTypeLabel = computed(() => {
  if (!pickup.value) return '—'
  return pickup.value.paymentType === 'subscription' ? 'Subscription' : 'Pay as you go'
})

// Timeline steps
const timeline = computed(() => {
  if (!activityLogData.value) return []
  
  const tl = activityLogData.value.timeline
  
  return [
    { 
      label: 'Request Created',  
      time: tl.requestCreated.completedAt ? formatDateTime(tl.requestCreated.completedAt) : '',
      done: !!tl.requestCreated.completedAt 
    },
    { 
      label: 'Driver Assigned',  
      time: tl.driverAssigned.completedAt ? formatDateTime(tl.driverAssigned.completedAt) : '',
      done: !!tl.driverAssigned.completedAt 
    },
    { 
      label: 'Trip Started',     
      time: tl.tripStarted.completedAt ? formatDateTime(tl.tripStarted.completedAt) : '',
      done: !!tl.tripStarted.completedAt 
    },
    { 
      label: 'Pickup Completed', 
      time: tl.pickupCompleted.completedAt ? formatDateTime(tl.pickupCompleted.completedAt) : '',
      done: !!tl.pickupCompleted.completedAt 
    },
  ]
})

const activityLog = computed(() => {
  if (!activityLogData.value) return []
  
  return activityLogData.value.activities.map(activity => {
    // Determine actor display name
    let actor = 'System'
    if (activity.actorType === 'customer') {
      actor = 'Customer'
    } else if (activity.actorType === 'admin') {
      actor = 'Admin'
    } else if (activity.actorType === 'driver') {
      actor = 'Driver'
    }
    
    return {
      time: formatDateTime(activity.createdAt),
      actor,
      action: activity.description
    }
  })
})

// Pickup Notes
interface PickupNote {
  id: string
  entityType: string
  entityId: string
  content: string
  authorId: string
  createdAt: string
  updatedAt: string
  author: { id: string; name: string; email: string }
}

const notes = ref<PickupNote[]>([])
const notesLoading = ref(false)
const newNote = ref('')

async function fetchNotes() {
  if (!pickupData.value) return
  notesLoading.value = true
  try {
    const data = await api.get<PickupNote[]>(
      `/pickup-requests/admin/${route.params.id}/notes`,
      'Failed to load notes'
    )
    if (data) notes.value = data
  } catch {
    console.error('Failed to fetch pickup notes')
  } finally {
    notesLoading.value = false
  }
}

async function addPickupNote() {
  if (!newNote.value.trim() || !pickupData.value) return
  const created = await api.post<PickupNote>(
    `/pickup-requests/admin/${route.params.id}/notes`,
    { content: newNote.value.trim() },
    'Failed to add note'
  )
  if (created) {
    notes.value.unshift(created)
    newNote.value = ''
  }
}

function pickupNoteDate(dateString?: string | null): string {
  if (!dateString) return '—'
  try {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return dateString
  }
}

// Actions
const showReassignModal = ref(false)
const showCancelConfirm = ref(false)
const showAdjustLoadModal = ref(false)
const assignDriverModalRef = ref<{ submitting: boolean } | null>(null)

const { hasPermission } = usePermissions()

const canAdjustLoad = computed(() => {
  if (!pickup.value) return false
  if (!hasPermission('pickups.manage')) return false
  const status = pickup.value.status.toLowerCase()
  if (status === 'completed' || status === 'cancelled') return false
  if (pickupData.value?.loadAdjustedAt) return false
  return true
})

function handleAdjustLoadSuccess() {
  fetchPickupDetails()
  fetchActivityLog()
}

async function startTrip() {
  try {
    await api.patch(
      `/pickup-requests/admin/${route.params.id}/status`,
      {
        status: 'truck_dispatched',
        internalNotes: 'Trip started by admin'
      },
      'Failed to start trip'
    )
    
    await fetchPickupDetails()
    await fetchActivityLog()
  } catch (err: any) {
    console.error('Error starting trip:', err)
  }
}

async function markEnRoute() {
  try {
    await api.patch(
      `/pickup-requests/admin/${route.params.id}/status`,
      {
        status: 'en_route',
        internalNotes: 'Driver en route to pickup location'
      },
      'Failed to mark as en route'
    )
    
    await fetchPickupDetails()
    await fetchActivityLog()
  } catch (err: any) {
    console.error('Error marking as en route:', err)
  }
}

async function markPickedUp() {
  try {
    await api.patch(
      `/pickup-requests/admin/${route.params.id}/status`,
      {
        status: 'picked_up',
        internalNotes: 'Waste picked up by driver'
      },
      'Failed to mark as picked up'
    )
    
    await fetchPickupDetails()
    await fetchActivityLog()
  } catch (err: any) {
    console.error('Error marking as picked up:', err)
  }
}

async function completePickup() {
  try {
    await api.patch(
      `/pickup-requests/admin/${route.params.id}/status`,
      {
        status: 'completed',
        internalNotes: 'Pickup completed by admin'
      },
      'Failed to complete pickup'
    )
    
    await fetchPickupDetails()
    await fetchActivityLog()
  } catch (err: any) {
    console.error('Error completing pickup:', err)
  }
}

async function cancelPickup() {
  try {
    await api.patch(
      `/pickup-requests/admin/${route.params.id}/status`,
      {
        status: 'cancelled',
        internalNotes: 'Pickup cancelled by admin'
      },
      'Failed to cancel pickup'
    )
    
    showCancelConfirm.value = false
    await fetchPickupDetails()
    await fetchActivityLog()
  } catch (err: any) {
    console.error('Error cancelling pickup:', err)
  }
}

async function handleReassign(data: { driver: string; scheduledDate: string; scheduledTime: string; priority: string; adminNotes: string }) {
  try {
    // Map time slot to API format
    let timeSlot = 'afternoon'
    if (data.scheduledTime.toLowerCase().includes('morning')) {
      timeSlot = 'morning'
    } else if (data.scheduledTime.toLowerCase().includes('evening')) {
      timeSlot = 'evening'
    }
    
    // Check if pickup already has a driver assigned
    const isReassignment = !!pickup.value?.driver
    
    if (isReassignment) {
      // Use reassign endpoint (PATCH) - doesn't include priorityLevel
      const payload = {
        driverId: data.driver,
        scheduledDate: data.scheduledDate,
        timeSlot: timeSlot,
        adminNotes: data.adminNotes
      }
      
      await api.patch(
        `/pickup-requests/admin/${route.params.id}/reassign`,
        payload,
        'Failed to reassign driver'
      )
    } else {
      // Use assign endpoint (POST) - includes priorityLevel
      const payload = {
        driverId: data.driver,
        scheduledDate: data.scheduledDate,
        timeSlot: timeSlot,
        priorityLevel: data.priority,
        adminNotes: data.adminNotes
      }
      
      await api.post(
        `/pickup-requests/admin/${route.params.id}/assign`,
        payload,
        'Failed to assign driver'
      )
    }
    
    showReassignModal.value = false
    await fetchPickupDetails()
    await fetchActivityLog()
  } catch (err: any) {
    console.error('Error assigning/reassigning driver:', err)
    // Reset submitting state so user can retry
    if (assignDriverModalRef.value) {
      assignDriverModalRef.value.submitting = false
    }
  }
}
</script>

<template>
  <!-- Loading state -->
  <div v-if="loading" style="display:flex;flex-direction:column;gap:21px">
    <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:40px;text-align:center">
      <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Loading pickup details...</p>
    </div>
  </div>

  <!-- Error state -->
  <div v-else-if="error" style="display:flex;flex-direction:column;gap:21px">
    <NuxtLink to="/pickups" style="display:inline-flex;align-items:center;gap:8px;text-decoration:none">
      <UIcon name="i-lucide-arrow-left" style="width:16px;height:16px;color:#6b7280" />
      <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Back to Pickups</span>
    </NuxtLink>
    <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:40px;text-align:center">
      <UIcon name="i-lucide-alert-circle" style="width:48px;height:48px;color:#ef4444;margin:0 auto 16px" />
      <p style="font-size:16px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;margin-bottom:8px">Failed to Load Pickup</p>
      <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ error }}</p>
    </div>
  </div>

  <!-- Main content -->
  <div v-else-if="pickup" style="display:flex;flex-direction:column;gap:21px">

    <!-- Back -->
    <NuxtLink to="/pickups" style="display:inline-flex;align-items:center;gap:8px;text-decoration:none">
      <UIcon name="i-lucide-arrow-left" style="width:16px;height:16px;color:#6b7280" />
      <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Back to Pickups</span>
    </NuxtLink>

    <!-- Header card -->
    <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:10px 25px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
      <div class="pickup-header" style="display:flex;align-items:center;justify-content:space-between;min-height:87px;gap:16px">
        <div class="pickup-header-info" style="display:flex;align-items:center;gap:16px">
          <div style="width:64px;height:64px;border-radius:16px;background:#ffb400;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <UIcon name="i-lucide-package" style="width:32px;height:32px;color:#1a1a1a" />
          </div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;align-items:center;gap:12px">
              <span style="font-size:24px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">{{ pickup.id }}</span>
              <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;color:${statusBadge.color};background:${statusBadge.bg};border:1px solid ${statusBadge.border};border-radius:14px;padding:3px 11px`">
                {{ statusBadge.label }}
              </span>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:16px">
              <div style="display:flex;align-items:center;gap:8px">
                <UIcon name="i-lucide-user" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
                <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ pickup.customer }}</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <UIcon name="i-lucide-map-pin" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
                <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ pickup.zone }}</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <UIcon name="i-lucide-calendar" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
                <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ pickup.date }} · {{ pickup.timeSlot }}</span>
              </div>
              <div v-if="pickup.driver" style="display:flex;align-items:center;gap:8px">
                <UIcon name="i-lucide-truck" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
                <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ pickup.driver }} · {{ pickup.truck }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="pickup-actions" style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end">
          <!-- Start Trip — shown when assigned -->
          <button
            v-if="pickup.status.toLowerCase() === 'assigned'"
            style="height:40px;padding:0 16px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer;box-shadow:0 1px 3px rgba(255,180,0,0.2)"
            @mouseover="($event.currentTarget as HTMLElement).style.opacity='0.9'"
            @mouseleave="($event.currentTarget as HTMLElement).style.opacity='1'"
            @click="startTrip"
          >Start Trip</button>

          <!-- En Route — shown when truck_dispatched -->
          <button
            v-if="pickup.status.toLowerCase() === 'truck_dispatched'"
            style="height:40px;padding:0 16px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer;box-shadow:0 1px 3px rgba(255,180,0,0.2)"
            @mouseover="($event.currentTarget as HTMLElement).style.opacity='0.9'"
            @mouseleave="($event.currentTarget as HTMLElement).style.opacity='1'"
            @click="markEnRoute"
          >Mark En Route</button>

          <!-- Picked Up — shown when en_route -->
          <button
            v-if="pickup.status.toLowerCase() === 'en_route'"
            style="height:40px;padding:0 16px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer;box-shadow:0 1px 3px rgba(255,180,0,0.2)"
            @mouseover="($event.currentTarget as HTMLElement).style.opacity='0.9'"
            @mouseleave="($event.currentTarget as HTMLElement).style.opacity='1'"
            @click="markPickedUp"
          >Mark Picked Up</button>

          <!-- Complete — shown when picked_up -->
          <button
            v-if="pickup.status.toLowerCase() === 'picked_up'"
            style="height:40px;padding:0 16px;background:#22c55e;border:none;border-radius:20px;font-size:14px;font-weight:500;color:white;font-family:'Manrope',sans-serif;cursor:pointer"
            @mouseover="($event.currentTarget as HTMLElement).style.opacity='0.9'"
            @mouseleave="($event.currentTarget as HTMLElement).style.opacity='1'"
            @click="completePickup"
          >Complete Trip</button>

          <!-- Track Driver — shown when truck_dispatched, en_route, picked_up, or assigned -->
          <NuxtLink
            v-if="['assigned', 'truck_dispatched', 'en_route', 'picked_up'].includes(pickup.status.toLowerCase())"
            to="/tracking"
            style="text-decoration:none"
          >
            <button
              style="height:40px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
              @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
              @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
            >Track Driver</button>
          </NuxtLink>

          <!-- Reassign — shown when pending/assigned/truck_dispatched -->
          <button
            v-if="['pending','assigned','truck_dispatched'].includes(pickup.status.toLowerCase())"
            style="height:40px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
            @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
            @click="showReassignModal = true"
          >{{ pickup.status.toLowerCase() === 'pending' ? 'Assign Driver' : 'Reassign' }}</button>

          <!-- Cancel — shown when not completed/cancelled -->
          <button
            v-if="!['completed','cancelled'].includes(pickup.status.toLowerCase())"
            style="height:40px;padding:0 16px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:20px;font-size:14px;font-weight:500;color:#ef4444;font-family:'Manrope',sans-serif;cursor:pointer"
            @mouseover="($event.currentTarget as HTMLElement).style.background='rgba(239,68,68,0.18)'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background='rgba(239,68,68,0.1)'"
            @click="showCancelConfirm = true"
          >Cancel</button>

          <!-- Adjust Load — shown when eligible -->
          <button
            v-if="canAdjustLoad"
            style="height:40px;padding:0 16px;background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.2);border-radius:20px;font-size:14px;font-weight:500;color:#a855f7;font-family:'Manrope',sans-serif;cursor:pointer"
            @mouseover="($event.currentTarget as HTMLElement).style.background='rgba(168,85,247,0.18)'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background='rgba(168,85,247,0.1)'"
            @click="showAdjustLoadModal = true"
          >Adjust Load</button>
        </div>
      </div>
    </div>

    <!-- Stat cards -->
    <div class="pickup-stat-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:24px">
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:10px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:8px">Payment Type</p>
        <p style="font-size:18px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ paymentTypeLabel }}</p>
      </div>
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:10px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:8px">Disposable Type</p>
        <p style="font-size:18px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ pickup.disposableType }}</p>
      </div>
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:10px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:8px">Payment Status</p>
        <span :style="`font-size:13px;font-weight:600;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 10px;color:${paymentStatusBadge.color};background:${paymentStatusBadge.bg};border:1px solid ${paymentStatusBadge.border}`">
          {{ paymentStatusBadge.label }}
        </span>
      </div>
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:10px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:8px">Estimated Quantity</p>
        <p style="font-size:15px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ pickup.estimatedQuantity }}</p>
      </div>
    </div>

    <!-- Tabbed card -->
    <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:1px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
      <div style="padding:24px 24px 0;border-bottom:1px solid #e5e7eb;display:flex;gap:0">
        <button
          v-for="tab in tabs"
          :key="tab"
          :style="`padding:12px 16px 14px;border:none;background:none;cursor:pointer;font-size:14px;font-weight:500;font-family:'Manrope',sans-serif;white-space:nowrap;border-bottom:2px solid ${activeTab === tab ? '#ffb400' : 'transparent'};color:${activeTab === tab ? '#1a1a1a' : '#6b7280'};margin-bottom:-1px`"
          @click="activeTab = tab"
        >{{ tab }}</button>
      </div>

      <div style="padding:24px">

        <!-- Details tab -->
        <div v-if="activeTab === 'Details'" class="pickup-detail-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:32px">

          <!-- Pickup Info -->
          <div style="display:flex;flex-direction:column;gap:16px">
            <p style="font-size:18px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Pickup Information</p>
            <div style="display:flex;flex-direction:column;gap:12px">
              <div v-for="item in [
                { label: 'Request ID',  value: pickup.id },
                { label: 'Address',     value: pickup.address },
                { label: 'City',        value: pickup.city },
                { label: 'Region',      value: pickup.region },
                { label: 'Place Name',  value: pickup.placeName },
                { label: 'Date',        value: pickup.date },
                { label: 'Time Slot',   value: pickup.timeSlot },
                { label: 'Disposable Type', value: pickup.disposableType },
                { label: 'Estimated Quantity', value: pickup.estimatedQuantity },
                { label: 'Bins', value: pickup.bins },
                { label: 'Notes',       value: pickup.notes || '—' },
              ]" :key="item.label" style="display:flex;flex-direction:column;gap:2px">
                <p style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif">{{ item.label }}</p>
                <p style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ item.value }}</p>
              </div>
            </div>
          </div>

          <!-- Right column: Customer + Driver -->
          <div style="display:flex;flex-direction:column;gap:24px">

            <!-- Customer -->
            <div style="display:flex;flex-direction:column;gap:16px">
              <p style="font-size:18px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Customer</p>
              <div style="display:flex;flex-direction:column;gap:12px">
                <div v-for="item in [
                  { label: 'Name',  value: pickup.customer },
                  { label: 'Phone', value: pickup.customerPhone },
                  { label: 'Customer Type', value: pickup.customerType },
                  { label: 'No. of Bins', value: pickup.noBins },
                ]" :key="item.label" style="display:flex;flex-direction:column;gap:2px">
                  <p style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif">{{ item.label }}</p>
                  <p style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ item.value }}</p>
                </div>
              </div>
            </div>

            <!-- Driver -->
            <div style="display:flex;flex-direction:column;gap:16px">
              <p style="font-size:18px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Assigned Driver</p>
              <div v-if="pickup.driver" style="display:flex;flex-direction:column;gap:12px">
                <div v-for="item in [
                  { label: 'Name',  value: pickup.driver },
                  { label: 'Phone', value: pickup.driverPhone },
                  { label: 'License', value: pickup.driverLicense },
                  { label: 'Truck', value: pickup.truck },
                  { label: 'Truck Details', value: pickup.truckDetails },
                ]" :key="item.label" style="display:flex;flex-direction:column;gap:2px">
                  <p style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif">{{ item.label }}</p>
                  <p style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ item.value }}</p>
                </div>
              </div>
              <p v-else style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">No driver assigned yet.</p>
            </div>

          </div>
        </div>

        <!-- Activity Log tab -->
        <div v-else-if="activeTab === 'Activity Log'" style="display:flex;flex-direction:column;gap:24px">

          <!-- Progress timeline -->
          <div class="pickup-timeline" style="display:flex;align-items:flex-start;gap:0">
            <template v-for="(step, i) in timeline" :key="step.label">
              <div style="display:flex;flex-direction:column;align-items:center;flex:1;min-width:0">
                <div :style="`width:32px;height:32px;border-radius:9999px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:2px solid ${step.done ? '#ffb400' : '#e5e7eb'};background:${step.done ? '#ffb400' : 'white'}`">
                  <UIcon v-if="step.done" name="i-lucide-check" style="width:16px;height:16px;color:#1a1a1a" />
                  <div v-else style="width:8px;height:8px;border-radius:9999px;background:#e5e7eb" />
                </div>
                <p style="font-size:12px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif;margin-top:8px;text-align:center">{{ step.label }}</p>
                <p style="font-size:11px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:2px;text-align:center">{{ step.time || '—' }}</p>
              </div>
              <div v-if="i < timeline.length - 1" :style="`flex:1;height:2px;margin-top:15px;background:${step.done ? '#ffb400' : '#e5e7eb'}`" />
            </template>
          </div>

          <!-- Log entries -->
          <div class="table-scroll" style="border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
            <table style="width:100%;border-collapse:collapse;min-width:480px">
              <thead>
                <tr style="background:#f8f9fa;border-bottom:1px solid #e5e7eb">
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">Time</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Actor</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(entry, i) in activityLog"
                  :key="i"
                  :style="`border-bottom:${i < activityLog.length - 1 ? '1px solid #e5e7eb' : 'none'}`"
                  @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
                >
                  <td style="padding:16px 16px;font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif;white-space:nowrap">{{ entry.time }}</td>
                  <td style="padding:16px 16px;font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ entry.actor }}</td>
                  <td style="padding:16px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ entry.action }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Notes tab -->
        <div v-else-if="activeTab === 'Notes'" style="display:flex;flex-direction:column;gap:16px">
          <div v-if="notesLoading" style="display:flex;align-items:center;justify-content:center;padding:48px">
            <UIcon name="i-lucide-loader-2" style="width:24px;height:24px;color:#ffb400;animation:spin 1s linear infinite" />
          </div>
          <div v-else-if="notes.length === 0" style="text-align:center;padding:48px 24px;background:#f8f9fa;border-radius:16px">
            <UIcon name="i-lucide-message-square" style="width:40px;height:40px;color:#d1d5db;margin-bottom:12px" />
            <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">No notes yet. Add the first note below.</p>
          </div>
          <div v-else style="display:flex;flex-direction:column;gap:12px">
            <div v-for="note in notes" :key="note.id" style="background:#f8f9fa;border:1px solid #e5e7eb;border-radius:16px;padding:16px">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
                <div style="display:flex;align-items:center;gap:8px">
                  <div style="width:28px;height:28px;border-radius:9999px;background:#3b82f6;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                    <span style="font-size:11px;font-weight:700;color:white;font-family:'Manrope',sans-serif">{{ note.author.name[0] }}</span>
                  </div>
                  <span style="font-size:13px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ note.author.name }}</span>
                </div>
                <span style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">{{ pickupNoteDate(note.createdAt) }}</span>
              </div>
              <p style="font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;line-height:1.6;margin-left:36px">{{ note.content }}</p>
            </div>
          </div>

          <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px">
            <textarea
              v-model="newNote"
              placeholder="Add a note..."
              rows="3"
              style="width:100%;padding:10px 12px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;resize:none;box-sizing:border-box;line-height:1.5"
              @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
              @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
            />
            <div style="display:flex;justify-content:flex-end">
              <button
                style="height:36px;padding:0 16px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer"
                @click="addPickupNote"
                @mouseover="($event.currentTarget as HTMLElement).style.opacity='0.9'"
                @mouseleave="($event.currentTarget as HTMLElement).style.opacity='1'"
              >Add Note</button>
            </div>
          </div>
        </div>

      </div>
    </div>

  </div>

  <!-- Reassign modal (reuse AssignDriverModal) -->
  <AssignDriverModal
    v-if="showReassignModal && pickup"
    ref="assignDriverModalRef"
    :request="{
      id: pickup.id,
      customer: pickup.customer,
      address: pickup.address,
      date: pickup.date,
      timeSlot: pickup.timeSlot,
      binType: pickup.disposableType,
      paymentType: pickup.paymentType,
      paymentDetail: paymentTypeLabel,
      notes: pickup.notes,
    }"
    :customer-id="pickupData?.customer?.id"
    @close="showReassignModal = false"
    @submit="handleReassign"
  />

  <!-- Cancel confirm -->
  <div
    v-if="showCancelConfirm && pickup"
    style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:50;display:flex;align-items:center;justify-content:center;padding:24px"
    @click.self="showCancelConfirm = false"
  >
    <div style="background:white;border-radius:16px;width:420px;padding:32px;display:flex;flex-direction:column;gap:20px;box-shadow:0 10px 15px rgba(0,0,0,0.1)">
      <div style="display:flex;flex-direction:column;gap:8px">
        <p style="font-size:20px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Cancel Pickup</p>
        <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Are you sure you want to cancel <span style="font-weight:600;color:#1a1a1a">{{ pickup.id }}</span>? This action cannot be undone.</p>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button
          style="height:40px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
          @click="showCancelConfirm = false"
          @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
          @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
        >Keep Pickup</button>
        <button
          style="height:40px;padding:0 20px;background:#ef4444;border:none;border-radius:20px;font-size:14px;font-weight:500;color:white;font-family:'Manrope',sans-serif;cursor:pointer"
          @click="cancelPickup"
          @mouseover="($event.currentTarget as HTMLElement).style.opacity='0.9'"
          @mouseleave="($event.currentTarget as HTMLElement).style.opacity='1'"
        >Yes, Cancel</button>
      </div>
    </div>
  </div>

  <!-- Adjust Load modal -->
  <AdjustLoadModal
    v-if="showAdjustLoadModal && pickupData"
    :pickup-id="pickupData.id"
    :pricing-mode="pickupData.pricingMode ?? 'per_bin'"
    :current-bins="pickupData.customer.noBins"
    :booked-truck-load-rate-id="pickupData.truckLoadRateId ?? null"
    :booked-truck-load-label="pickupData.truckLoadLabel ?? null"
    @close="showAdjustLoadModal = false"
    @success="handleAdjustLoadSuccess"
  />

</template>

<style scoped>
@media (max-width: 1024px) {
  .pickup-header {
    align-items: flex-start !important;
    gap: 16px;
  }
  .pickup-actions {
    justify-content: flex-start !important;
    width: 100%;
  }
  .pickup-actions button {
    flex: 1 1 auto;
    min-width: 0;
    white-space: nowrap;
  }
  .pickup-stat-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}

@media (max-width: 768px) {
  .pickup-header {
    flex-direction: column !important;
    align-items: flex-start !important;
  }
  .pickup-header-info {
    width: 100%;
  }
  .pickup-actions {
    width: 100%;
    row-gap: 8px;
  }
  .pickup-actions button {
    flex: 1 1 calc(50% - 4px);
    min-width: 0;
    max-width: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .pickup-stat-grid {
    grid-template-columns: 1fr !important;
    gap: 16px !important;
  }
  .pickup-detail-grid {
    grid-template-columns: 1fr !important;
    gap: 24px !important;
  }
  .pickup-timeline {
    overflow-x: auto;
    padding-bottom: 8px;
  }
  .pickup-timeline > div {
    min-width: 100px;
  }
  .table-scroll {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .table-scroll::-webkit-scrollbar {
    display: none;
  }
}

@media (max-width: 480px) {
  .pickup-header-info {
    flex-direction: column !important;
    align-items: flex-start !important;
  }
  .pickup-actions button {
    flex: 1 1 100%;
    font-size: 13px;
    padding: 0 12px;
    height: 36px;
  }
}
</style>
