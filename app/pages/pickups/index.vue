<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

interface PickupRequest {
  id: string
  customerId: string
  preferredPickupDate: string
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
    customerType: {
      id: string
      name: string
    }
  }
  disposableItemType: {
    id: string
    name: string
  }
  estimatedQuantity: {
    id: string
    label: string
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

const requests = ref<PickupRequest[]>([])
const pagination = ref<Pagination>({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false
})
const loading = ref(false)

const activeFilter = ref('All')
const filters = ['All', 'Pending', 'Assigned', 'Completed']

const filtered = computed(() => {
  if (activeFilter.value === 'All') return requests.value
  return requests.value.filter(r => r.status.toLowerCase() === activeFilter.value.toLowerCase())
})

watch(activeFilter, () => { 
  pagination.value.page = 1
  fetchRequests()
})

const stats = ref({
  pending: 0,
  assigned: 0,
  completed: 0,
  unpaid: 0,
})

const api = useApi()

async function fetchStats() {
  const data = await api.get<{
    pendingRequests?: number
    assignedToday?: number
    completed?: number
    unpaidRequests?: number
  }>('/pickup-requests/admin/stats', 'Failed to load pickup stats')
  
  if (data) {
    stats.value = {
      pending: data.pendingRequests ?? 0,
      assigned: data.assignedToday ?? 0,
      completed: data.completed ?? 0,
      unpaid: data.unpaidRequests ?? 0,
    }
  }
}

async function fetchRequests() {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: pagination.value.page.toString(),
      limit: pagination.value.limit.toString(),
    })
    
    if (activeFilter.value !== 'All') {
      params.append('status', activeFilter.value.toLowerCase())
    }
    
    const data = await api.get<{ data: PickupRequest[]; pagination: Pagination }>(
      `/pickup-requests/admin/list?${params.toString()}`,
      'Failed to load pickup requests'
    )
    
    if (data) {
      requests.value = data.data || []
      if (data.pagination) {
        pagination.value = data.pagination
      }
    }
  } finally {
    loading.value = false
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

onMounted(() => {
  fetchStats()
  fetchRequests()
})

function paymentTypeBadge(type: string) {
  if (type === 'subscription') return { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', color: '#3b82f6', label: 'Subscription' }
  return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280', label: 'Pay as you go' }
}

const currentPage = computed({
  get: () => pagination.value.page,
  set: (val) => {
    pagination.value.page = val
    fetchRequests()
  }
})

function paymentStatusBadge(s: string) {
  if (s === 'active-plan' || s === 'paid') return { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)', color: '#22c55e', label: s === 'paid' ? 'Paid' : 'Active Plan' }
  return { bg: 'white', border: '#ececec', color: '#1a1a1a', label: 'Unpaid' }
}

function statusBadge(s: string) {
  if (s === 'pending')   return { bg: 'rgba(255,180,0,0.1)',  border: 'rgba(255,180,0,0.2)',  color: '#d49a00',  label: 'Pending' }
  if (s === 'assigned')  return { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', color: '#3b82f6',  label: 'Assigned' }
  if (s === 'completed') return { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.2)',  color: '#22c55e',  label: 'Completed' }
  return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280', label: s }
}

const showAssignDriverModal = ref(false)
const selectedRequest = ref<PickupRequest | null>(null)

function openAssignModal(req: PickupRequest) {
  selectedRequest.value = req
  showAssignDriverModal.value = true
}

async function handleAssignDriver(data: { driver: string; scheduledDate: string; scheduledTime: string; priority: string; adminNotes: string }) {
  if (!selectedRequest.value) return
  // TODO: Call API to assign driver
  showAssignDriverModal.value = false
  selectedRequest.value = null
  await fetchRequests()
  await fetchStats()
}
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:32px">

    <!-- Header -->
    <div>
      <h1 style="font-size:32px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;line-height:1.3">Pickup Requests</h1>
      <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:8px">Manage customer pickup requests and assignments</p>
    </div>

    <!-- Stat cards -->
    <div class="grid-cols-4">
      <div
        v-for="stat in [
          { label: 'Pending Requests', value: stats.pending,   color: '#ffb400' },
          { label: 'Assigned Today',   value: stats.assigned,  color: '#1a1a1a' },
          { label: 'Completed',        value: stats.completed, color: '#22c55e' },
          { label: 'Unpaid Requests',  value: stats.unpaid,    color: '#dc2626' },
        ]"
        :key="stat.label"
        style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)"
      >
        <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:8px">{{ stat.label }}</p>
        <p :style="`font-size:24px;font-weight:700;font-family:'Manrope',sans-serif;color:${stat.color}`">{{ stat.value }}</p>
      </div>
    </div>

    <!-- Filter bar -->
    <div style="display:flex;align-items:center;gap:16px">
      <div style="display:flex;align-items:center;gap:8px">
        <UIcon name="i-lucide-filter" style="width:16px;height:16px;color:#6b7280" />
        <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Filter by:</span>
      </div>
      <div style="display:flex;gap:8px">
        <button
          v-for="f in filters"
          :key="f"
          :style="`height:32px;padding:0 12px;border:none;border-radius:20px;font-size:14px;font-weight:500;font-family:'Manrope',sans-serif;cursor:pointer;transition:background 0.15s;background:${activeFilter === f ? '#ffb400' : '#ececec'};color:${activeFilter === f ? '#0a0d12' : '#111'};box-shadow:${activeFilter === f ? '0 1px 3px rgba(255,180,0,0.2)' : 'none'}`"
          @click="activeFilter = f"
        >{{ f }}</button>
      </div>
    </div>

    <!-- Table card -->
    <div class="table-scroll" style="background:white;border:1px solid #ececec;border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f8f9fa;border-bottom:1px solid #e5e7eb">
            <th style="padding:14px 8px 14px 8px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">Request ID</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Customer</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Address</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">Pickup Date</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">Payment Type</th>
            <th style="padding:14px 12px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">Payment Status</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Status</th>
            <th style="padding:14px 16px;text-align:right;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(req, i) in filtered"
            :key="req.id"
            :style="`border-bottom:${i < filtered.length - 1 ? '1px solid #e5e7eb' : 'none'}`"
            @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
          >
            <!-- Request ID -->
            <td style="padding:20px 8px;font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ req.id.slice(0, 8) }}</td>

            <!-- Customer -->
            <td style="padding:20px 16px">
              <p style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ req.customer.name }}</p>
              <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:2px">{{ req.customer.phoneNumber }}</p>
            </td>

            <!-- Address -->
            <td style="padding:20px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;max-width:180px">{{ req.customer.address }}</td>

            <!-- Pickup Date -->
            <td style="padding:20px 16px">
              <p style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ formatDate(req.preferredPickupDate) }}</p>
              <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:2px">{{ req.disposableItemType.name }} - {{ req.estimatedQuantity.label }}</p>
            </td>

            <!-- Payment Type -->
            <td style="padding:20px 16px">
              <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 10px;white-space:nowrap;color:${paymentTypeBadge(req.paymentType).color};background:${paymentTypeBadge(req.paymentType).bg};border:1px solid ${paymentTypeBadge(req.paymentType).border}`">
                {{ paymentTypeBadge(req.paymentType).label }}
              </span>
            </td>

            <!-- Payment Status -->
            <td style="padding:20px 12px">
              <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 10px;white-space:nowrap;color:${paymentStatusBadge(req.paymentStatus).color};background:${paymentStatusBadge(req.paymentStatus).bg};border:1px solid ${paymentStatusBadge(req.paymentStatus).border}`">
                {{ paymentStatusBadge(req.paymentStatus).label }}
              </span>
            </td>

            <!-- Status -->
            <td style="padding:20px 16px">
              <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 10px;white-space:nowrap;color:${statusBadge(req.status).color};background:${statusBadge(req.status).bg};border:1px solid ${statusBadge(req.status).border}`">
                {{ statusBadge(req.status).label }}
              </span>
            </td>

            <!-- Actions -->
            <td style="padding:20px 16px;text-align:right">
              <div style="display:flex;align-items:center;justify-content:flex-end;gap:8px">
                <button
                  v-if="req.status === 'pending'"
                  style="height:32px;padding:0 12px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer;white-space:nowrap;box-shadow:0 1px 3px rgba(255,180,0,0.2)"
                  @mouseover="($event.currentTarget as HTMLElement).style.opacity='0.9'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.opacity='1'"
                  @click="openAssignModal(req)"
                >Assign Driver</button>
                <button
                  v-else-if="req.status === 'assigned'"
                  style="height:32px;padding:0 12px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer;white-space:nowrap"
                  @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
                  @click="openAssignModal(req)"
                >Reassign</button>
                <NuxtLink
                  :to="`/pickups/${req.id}`"
                  style="width:32px;height:32px;background:none;border:none;border-radius:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;text-decoration:none"
                  @mouseover="($event.currentTarget as HTMLElement).style.background='#f3f4f6'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
                >
                  <UIcon name="i-lucide-eye" style="width:16px;height:16px;color:#6b7280" />
                </NuxtLink>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <AppPagination
      :page="currentPage"
      :total="pagination.total"
      :per-page="pagination.limit"
      @update:page="currentPage = $event"
    />

  </div>

  <AssignDriverModal
    v-if="showAssignDriverModal && selectedRequest"
    :request="{
      id: selectedRequest.id,
      customer: selectedRequest.customer.name,
      address: selectedRequest.customer.address,
      date: formatDate(selectedRequest.preferredPickupDate),
      timeSlot: '',
      binType: `${selectedRequest.disposableItemType.name} - ${selectedRequest.estimatedQuantity.label}`,
      paymentType: selectedRequest.paymentType,
      paymentDetail: '',
      notes: '',
    }"
    @close="showAssignDriverModal = false"
    @submit="handleAssignDriver"
  />
</template>
