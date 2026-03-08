<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const requests = ref([
  {
    id: 'PR-2026-001', customer: 'Sarah Johnson',  address: '123 Oak Street, Downtown, 12345',
    date: '2026-03-03', timeSlot: 'Morning (8AM - 12PM)',
    paymentType: 'subscription', paymentDetail: 'Premium Monthly',
    paymentStatus: 'active-plan', status: 'pending', driver: '',
  },
  {
    id: 'PR-2026-002', customer: 'Michael Chen',   address: '456 Maple Ave, Westside, 12346',
    date: '2026-03-03', timeSlot: 'Afternoon (12PM - 4PM)',
    paymentType: 'one-time', paymentDetail: 'GHS 25.00',
    paymentStatus: 'paid', status: 'assigned', driver: 'Maria Garcia',
  },
  {
    id: 'PR-2026-003', customer: 'Emma Williams',  address: '789 Pine Road, Eastside, 12347',
    date: '2026-03-04', timeSlot: 'Morning (8AM - 12PM)',
    paymentType: 'one-time', paymentDetail: 'GHS 25.00',
    paymentStatus: 'unpaid', status: 'pending', driver: '',
  },
  {
    id: 'PR-2026-004', customer: 'James Martinez', address: '321 Birch Lane, Northside, 12348',
    date: '2026-03-03', timeSlot: 'Afternoon (12PM - 4PM)',
    paymentType: 'subscription', paymentDetail: 'Basic Weekly',
    paymentStatus: 'active-plan', status: 'pending', driver: '',
  },
  {
    id: 'PR-2026-005', customer: 'Olivia Brown',   address: '654 Cedar Court, Southside, 12349',
    date: '2026-03-03', timeSlot: 'Morning (8AM - 12PM)',
    paymentType: 'one-time', paymentDetail: 'GHS 25.00',
    paymentStatus: 'paid', status: 'completed', driver: 'John Smith',
  },
])

const activeFilter = ref('All')
const filters = ['All', 'Pending', 'Assigned', 'Completed']

const filtered = computed(() => {
  if (activeFilter.value === 'All') return requests.value
  return requests.value.filter(r => r.status.toLowerCase() === activeFilter.value.toLowerCase())
})

const stats = computed(() => ({
  pending:    requests.value.filter(r => r.status === 'pending').length,
  assigned:   requests.value.filter(r => r.status === 'assigned').length,
  completed:  requests.value.filter(r => r.status === 'completed').length,
  unpaid:     requests.value.filter(r => r.paymentStatus === 'unpaid').length,
}))

function paymentTypeBadge(type: string) {
  if (type === 'subscription') return { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', color: '#3b82f6', label: 'Subscription' }
  return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280', label: 'One-time' }
}

function paymentStatusBadge(s: string) {
  if (s === 'active-plan') return { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)', color: '#22c55e', label: 'Active Plan' }
  if (s === 'paid')        return { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)', color: '#22c55e', label: 'Paid' }
  return { bg: 'white', border: '#ececec', color: '#1a1a1a', label: 'Unpaid' }
}

function statusBadge(s: string) {
  if (s === 'pending')   return { bg: 'rgba(255,180,0,0.1)',  border: 'rgba(255,180,0,0.2)',  color: '#d49a00',  label: 'Pending' }
  if (s === 'assigned')  return { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', color: '#3b82f6',  label: 'Assigned' }
  if (s === 'completed') return { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.2)',  color: '#22c55e',  label: 'Completed' }
  return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280', label: s }
}

const showAssignDriverModal = ref(false)
const selectedRequest = ref<typeof requests.value[0] | null>(null)

function openAssignModal(req: typeof requests.value[0]) {
  selectedRequest.value = req
  showAssignDriverModal.value = true
}

function handleAssignDriver(data: { driver: string; scheduledDate: string; scheduledTime: string; priority: string; adminNotes: string }) {
  if (!selectedRequest.value) return
  const req = requests.value.find(r => r.id === selectedRequest.value!.id)
  if (req) {
    req.driver = data.driver
    req.status = 'assigned'
  }
  showAssignDriverModal.value = false
  selectedRequest.value = null
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
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:24px">
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
    <div style="background:white;border:1px solid #ececec;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
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
            <td style="padding:20px 8px;font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ req.id }}</td>

            <!-- Customer -->
            <td style="padding:20px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ req.customer }}</td>

            <!-- Address -->
            <td style="padding:20px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;max-width:180px">{{ req.address }}</td>

            <!-- Pickup Date -->
            <td style="padding:20px 16px">
              <p style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ req.date }}</p>
              <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:2px">{{ req.timeSlot }}</p>
            </td>

            <!-- Payment Type -->
            <td style="padding:20px 16px">
              <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 10px;white-space:nowrap;color:${paymentTypeBadge(req.paymentType).color};background:${paymentTypeBadge(req.paymentType).bg};border:1px solid ${paymentTypeBadge(req.paymentType).border}`">
                {{ paymentTypeBadge(req.paymentType).label }}
              </span>
              <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:4px">{{ req.paymentDetail }}</p>
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
              <p v-if="req.driver" style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:4px">{{ req.driver }}</p>
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
                <button
                  style="width:32px;height:32px;background:none;border:none;border-radius:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0"
                  @mouseover="($event.currentTarget as HTMLElement).style.background='#f3f4f6'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
                >
                  <UIcon name="i-lucide-eye" style="width:16px;height:16px;color:#6b7280" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>

  <AssignDriverModal
    v-if="showAssignDriverModal && selectedRequest"
    :request="{
      id: selectedRequest.id,
      customer: selectedRequest.customer,
      address: selectedRequest.address,
      date: selectedRequest.date,
      timeSlot: selectedRequest.timeSlot,
      binType: '120L General Waste',
      paymentType: selectedRequest.paymentType,
      paymentDetail: selectedRequest.paymentDetail,
      notes: '',
    }"
    @close="showAssignDriverModal = false"
    @submit="handleAssignDriver"
  />
</template>
