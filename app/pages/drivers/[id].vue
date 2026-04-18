<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const driver = ref<any>(null)
const loading = ref(true)
const notFound = ref(false)
const toast = useAppToast()
const todayPickups = ref<any[]>([])
const loadingPickups = ref(false)
const pickupHistory = ref<any[]>([])
const loadingHistory = ref(false)
const routeProgress = ref({ completed: 0, inProgress: 0, pending: 0, total: 0, percentage: 0 })
const estimatedCompletion = ref('N/A')

async function fetchTodayPickups() {
  loadingPickups.value = true
  const api = useApi()
  
  console.log('[driver-detail] Fetching current route for driver:', route.params.id)
  const data = await api.get<any>(`/drivers/admin/${route.params.id}/route`)
  
  if (data) {
    console.log('[driver-detail] Current route response:', data)
    todayPickups.value = data.stops || []
    routeProgress.value = data.progress || { completed: 0, inProgress: 0, pending: 0, total: 0, percentage: 0 }
    estimatedCompletion.value = data.estimatedCompletion || 'N/A'
    console.log('[driver-detail] Loaded stops:', todayPickups.value.length)
  } else {
    console.log('[driver-detail] No route found')
    todayPickups.value = []
    routeProgress.value = { completed: 0, inProgress: 0, pending: 0, total: 0, percentage: 0 }
    estimatedCompletion.value = 'N/A'
  }
  
  loadingPickups.value = false
}

async function fetchPickupHistory() {
  loadingHistory.value = true
  const api = useApi()
  
  console.log('[driver-detail] Fetching pickup history for driver:', route.params.id)
  const response = await api.get<{ data: any[], pagination: any }>(`/drivers/admin/${route.params.id}/pickups/history`)
  
  if (response && response.data) {
    console.log('[driver-detail] Pickup history response:', response)
    pickupHistory.value = response.data
    console.log('[driver-detail] Loaded history:', pickupHistory.value.length)
  } else {
    console.log('[driver-detail] No history found')
    pickupHistory.value = []
  }
  
  loadingHistory.value = false
}

function formatDate(dateString: string): string {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return 'N/A'
  }
}

function getStatusBadgeStyle(status: string) {
  if (status === 'completed') return { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)', color: '#22c55e' }
  if (status === 'cancelled') return { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', color: '#ef4444' }
  if (status === 'in_progress' || status === 'in-progress') return { bg: 'rgba(255,180,0,0.1)', border: 'rgba(255,180,0,0.2)', color: '#d49a00' }
  return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280' }
}

onMounted(async () => {
  const api = useApi()
  const data = await api.get<any>(`/drivers/admin/${route.params.id}`)
  if (data) {
    driver.value = data
    // Fetch today's pickups and history after driver data is loaded
    await Promise.all([fetchTodayPickups(), fetchPickupHistory()])
  } else {
    notFound.value = true
  }
  loading.value = false
})

const statusBadge = computed(() => {
  const s = driver.value?.status
  if (s === 'active')   return { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)', color: '#22c55e', label: 'Active' }
  if (s === 'inactive') return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280', label: 'Inactive' }
  if (s === 'on-route') return { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)', color: '#22c55e', label: 'On Route' }
  if (s === 'online')   return { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', color: '#3b82f6', label: 'Online' }
  return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280', label: 'Offline' }
})

const formattedLicenseExpiry = computed(() => {
  const expiry = driver.value?.licenseExpiry
  if (!expiry) return 'N/A'
  
  try {
    const date = new Date(expiry)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return expiry
  }
})

const activeTab = ref('Current Route')
const tabs = ['Current Route', 'Route History', 'Performance', 'Earnings']

const progressPct = computed(() => {
  return routeProgress.value.percentage || 0
})

function getPickupStatus(stop: any): string {
  const status = stop.status
  if (status === 'completed') return 'completed'
  if (status === 'in_progress' || status === 'in-progress') return 'in-progress'
  return 'pending'
}

// Performance tab charts

const monthlyPickups = [
  { month: 'Sep', value: 480 },
  { month: 'Oct', value: 520 },
  { month: 'Nov', value: 560 },
  { month: 'Dec', value: 500 },
  { month: 'Jan', value: 610 },
  { month: 'Feb', value: 680 },
]

const completionRates = [
  { month: 'Sep', value: 91 },
  { month: 'Oct', value: 93 },
  { month: 'Nov', value: 95 },
  { month: 'Dec', value: 92 },
  { month: 'Jan', value: 97 },
  { month: 'Feb', value: 98.5 },
]

const perfStats = [
  { label: 'Average Time/Stop', value: '4.2 min', color: '#1a1a1a' },
  { label: 'On-Time Rate',      value: '98.5%',   color: '#22c55e' },
  { label: 'Customer Rating',   value: '4.9/5.0', color: '#1a1a1a' },
]

// Bar chart helpers
const barChartH = 220
const barChartPadL = 40
const barChartPadB = 28
const barMax = 800
function barY(v: number) { return barChartH - barChartPadB - (v / barMax) * (barChartH - barChartPadB - 8) }
function barH(v: number) { return (v / barMax) * (barChartH - barChartPadB - 8) }

// Line chart helpers
const lineChartH = 220
const lineChartPadL = 40
const lineChartPadB = 28
const lineMin = 88
const lineMax = 100
function lineY(v: number) { return lineChartH - lineChartPadB - ((v - lineMin) / (lineMax - lineMin)) * (lineChartH - lineChartPadB - 8) }

function barPoints(data: { month: string; value: number }[], totalW: number) {
  const n = data.length
  const usableW = totalW - barChartPadL
  const slotW = usableW / n
  const bw = slotW * 0.45
  return data.map((d, i) => ({
    x: barChartPadL + i * slotW + slotW / 2 - bw / 2,
    y: barY(d.value),
    h: barH(d.value),
    w: bw,
    month: d.month,
  }))
}

function linePolyline(data: { month: string; value: number }[], totalW: number) {
  const n = data.length
  const usableW = totalW - lineChartPadL
  const slotW = usableW / n
  return data.map((d, i) => `${lineChartPadL + i * slotW + slotW / 2},${lineY(d.value)}`).join(' ')
}

function linePoints(data: { month: string; value: number }[], totalW: number) {
  const n = data.length
  const usableW = totalW - lineChartPadL
  const slotW = usableW / n
  return data.map((d, i) => ({
    x: lineChartPadL + i * slotW + slotW / 2,
    y: lineY(d.value),
    month: d.month,
    value: d.value,
  }))
}

const currentPeriod = {
  label: 'Current Pay Period (Feb 17 – Mar 2, 2026)',
  total: 'GHS 1,955.00',
  status: 'In Progress',
  basePay: 'GHS 2,000.00',
  tasks: '142/145',
  deductions: '-GHS 45.00',
  deductionNote: '3 incomplete × GHS 15',
  bonus: '+GHS 0.00',
  paymentSchedule: 'Bi-weekly (every 2 weeks)',
  deductionPolicy: 'GHS 15 deducted per incomplete assigned task. Complete 100% of tasks to avoid deductions and earn a GHS 50 bonus.',
}

const earningsHistory = [
  { period: 'Feb 3 – Feb 16, 2026',  basePay: 'GHS 2,000.00', tasks: '145/145', tasksColor: '#22c55e', deductions: '-GHS 0.00',  deductionsColor: '#6b7280', bonus: '+GHS 50.00',  bonusColor: '#22c55e', total: 'GHS 2,050.00', status: 'paid' },
  { period: 'Jan 20 – Feb 2, 2026',  basePay: 'GHS 2,000.00', tasks: '148/150', tasksColor: '#ffb400', deductions: '-GHS 30.00', deductionsColor: '#dc2626', bonus: '+GHS 0.00',   bonusColor: '#6b7280', total: 'GHS 1,970.00', status: 'paid' },
  { period: 'Jan 6 – Jan 19, 2026',  basePay: 'GHS 2,000.00', tasks: '147/148', tasksColor: '#ffb400', deductions: '-GHS 15.00', deductionsColor: '#dc2626', bonus: '+GHS 50.00',  bonusColor: '#22c55e', total: 'GHS 2,035.00', status: 'paid' },
  { period: 'Dec 23 – Jan 5, 2026',  basePay: 'GHS 2,000.00', tasks: '140/140', tasksColor: '#22c55e', deductions: '-GHS 0.00',  deductionsColor: '#6b7280', bonus: '+GHS 100.00', bonusColor: '#22c55e', total: 'GHS 2,100.00', status: 'paid' },
]

const showEditModal = ref(false)
const showDeleteConfirm = ref(false)
const deleting = ref(false)

async function handleEditDriver(data: Record<string, unknown>) {
  const api = useApi()
  console.log('[handleEditDriver] payload:', data)
  const result = await api.patch(`/drivers/admin/${route.params.id}`, data, 'Failed to update driver')
  console.log('[handleEditDriver] result:', result)
  if (result !== null) {
    showEditModal.value = false
    toast.success('Driver updated successfully')
    const updated = await api.get<any>(`/drivers/admin/${route.params.id}`)
    if (updated) driver.value = updated
  }
}

async function handleDeleteDriver() {
  deleting.value = true
  const api = useApi()
  const result = await api.del(`/drivers/admin/${route.params.id}`, 'Failed to delete driver')
  deleting.value = false
  
  if (result !== null) {
    showDeleteConfirm.value = false
    toast.success('Driver deleted successfully')
    await navigateTo('/drivers')
  }
}

function stopBadge(status: string) {
  if (status === 'completed')   return { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.2)',  color: '#22c55e' }
  if (status === 'in-progress') return { bg: 'rgba(255,180,0,0.1)',  border: 'rgba(255,180,0,0.2)',  color: '#d49a00' }
  return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280' }
}
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:21px">

    <!-- Loading state -->
    <div v-if="loading" style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Loading...</div>

    <!-- Not found state -->
    <div v-else-if="notFound" style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Driver not found</div>

    <template v-else>

    <!-- Back link -->
    <NuxtLink to="/drivers" style="display:inline-flex;align-items:center;gap:8px;text-decoration:none">
      <UIcon name="i-lucide-arrow-left" style="width:16px;height:16px;color:#6b7280" />
      <span style="font-size:16px;color:#6b7280;font-family:'Manrope',sans-serif">Back to Drivers</span>
    </NuxtLink>

    <!-- Profile card -->
    <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:10px 25px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
      <div style="display:flex;align-items:center;justify-content:space-between;min-height:87px">
        <div style="display:flex;align-items:center;gap:16px">
          <div style="width:64px;height:64px;border-radius:9999px;background:#ffb400;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <span style="font-size:24px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ ((driver?.name || driver?.user?.name) ?? 'U').split(' ').map((n: string) => n[0]).join('') }}</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;align-items:center;gap:12px">
              <span style="font-size:24px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">{{ driver?.name || driver?.user?.name || 'Unknown Driver' }}</span>
              <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;color:${statusBadge.color};background:${statusBadge.bg};border:1px solid ${statusBadge.border};border-radius:14px;padding:3px 11px`">
                {{ statusBadge.label }}
              </span>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:16px">
              <div style="display:flex;align-items:center;gap:8px">
                <UIcon name="i-lucide-phone" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
                <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ driver?.phoneNumber }}</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <UIcon name="i-lucide-mail" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
                <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ driver?.user?.email }}</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <UIcon name="i-lucide-truck" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
                <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">
                  {{ driver?.assignedTruck ? `${driver.assignedTruck.truckId} (${driver.assignedTruck.plateNumber})` : 'Unassigned' }}
                </span>
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <UIcon name="i-lucide-map-pin" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
                <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">
                  <span v-if="driver?.zone" :style="`display:inline-block;width:8px;height:8px;border-radius:50%;background:${driver.zone.color};margin-right:6px`"></span>
                  {{ driver?.zone?.name ?? 'No Zone' }}
                </span>
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <UIcon name="i-lucide-credit-card" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
                <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">License: {{ driver?.licenseNumber ?? 'N/A' }} | Exp: {{ formattedLicenseExpiry }}</span>
              </div>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-shrink:0">
          <button
            style="height:40px;padding:0 16px;background:#dc2626;border:none;border-radius:20px;font-size:14px;font-weight:500;color:white;font-family:'Manrope',sans-serif;cursor:pointer"
            @click="showDeleteConfirm = true"
            @mouseover="($event.currentTarget as HTMLElement).style.background='#b91c1c'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background='#dc2626'"
          >Delete Driver</button>
          <button
            style="height:40px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
            @click="showEditModal = true"
            @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
          >Edit Driver</button>
          <button
            style="height:40px;padding:0 16px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer;box-shadow:0 1px 3px rgba(255,180,0,0.2)"
          >Track Location</button>
        </div>
      </div>
    </div>

    <!-- Stat cards -->
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:24px">
      <div
        v-for="stat in [
          { label: `Today's Pickups`, value: driver?.stats?.todayPickups ?? 0, color: '#1a1a1a' },
          { label: 'This Week',       value: driver?.stats?.thisWeekPickups ?? 0,  color: '#1a1a1a' },
          { label: 'Completion Rate', value: driver?.stats?.completionRate ? `${driver.stats.completionRate}%` : 'N/A', color: '#22c55e' },
          { label: 'Avg Time/Stop',   value: driver?.stats?.avgTimePerStop ? `${driver.stats.avgTimePerStop} min` : 'N/A', color: '#1a1a1a' },
        ]"
        :key="stat.label"
        style="background:white;border:1px solid #ececec;border-radius:16px;padding:10px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)"
      >
        <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:8px">{{ stat.label }}</p>
        <p :style="`font-size:20px;font-weight:700;font-family:'Manrope',sans-serif;color:${stat.color}`">{{ stat.value }}</p>
      </div>
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:10px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <UIcon name="i-lucide-dollar-sign" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
          <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Period Earnings</p>
        </div>
        <p style="font-size:20px;font-weight:700;color:#22c55e;font-family:'Manrope',sans-serif">{{ driver?.stats?.periodEarnings ?? 'N/A' }}</p>
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

        <!-- Current Route -->
        <div v-if="activeTab === 'Current Route'" style="display:flex;flex-direction:column;gap:24px">
          <!-- Loading state -->
          <div v-if="loadingPickups" style="padding:40px;text-align:center">
            <UIcon name="i-lucide-loader-2" style="width:32px;height:32px;color:#6b7280;animation:spin 1s linear infinite;margin-bottom:12px" />
            <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Loading current route...</p>
          </div>
          
          <!-- Empty state -->
          <div v-else-if="todayPickups.length === 0" style="padding:60px;text-align:center">
            <UIcon name="i-lucide-package" style="width:40px;height:40px;color:#d1d5db;margin-bottom:12px" />
            <p style="font-size:15px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;margin:0 0 6px">No route assigned for today</p>
            <p style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0">This driver has no route assigned for today.</p>
          </div>
          
          <!-- Route data -->
          <template v-else>
            <div style="display:flex;flex-direction:column;gap:16px">
              <div style="display:flex;align-items:center;justify-content:space-between">
                <div>
                  <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:4px">Route Progress</p>
                  <p style="font-size:24px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ routeProgress.completed }} of {{ routeProgress.total }} stops completed</p>
                </div>
                <div style="text-align:right">
                  <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:4px">Estimated Completion</p>
                  <p style="font-size:18px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ estimatedCompletion }}</p>
                </div>
              </div>
              <div style="background:#e5e7eb;border-radius:9999px;height:12px;overflow:hidden">
                <div :style="`background:#ffb400;height:100%;border-radius:9999px;width:${progressPct}%`" />
              </div>
              <div style="display:flex;gap:16px;font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif">
                <span>Completed: <strong style="color:#22c55e">{{ routeProgress.completed }}</strong></span>
                <span>In Progress: <strong style="color:#d49a00">{{ routeProgress.inProgress }}</strong></span>
                <span>Pending: <strong style="color:#6b7280">{{ routeProgress.pending }}</strong></span>
              </div>
            </div>
            <div style="border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
              <table style="width:100%;border-collapse:collapse">
                <thead>
                  <tr style="background:#f8f9fa;border-bottom:1px solid #e5e7eb">
                    <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Order</th>
                    <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Customer</th>
                    <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Address</th>
                    <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Time Slot</th>
                    <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Priority</th>
                    <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="stop in todayPickups"
                    :key="stop.id"
                    style="border-bottom:1px solid #e5e7eb"
                    @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
                    @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
                  >
                    <td style="padding:18px 16px;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">
                      #{{ stop.order }}
                    </td>
                    <td style="padding:18px 16px;font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">
                      {{ stop.customer?.name || 'Unknown' }}
                      <div style="font-size:12px;color:#6b7280;margin-top:2px">{{ stop.customer?.phoneNumber || '' }}</div>
                    </td>
                    <td style="padding:18px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">
                      {{ stop.customer?.address || 'N/A' }}
                      <div v-if="stop.customer?.placeName" style="font-size:12px;color:#6b7280;margin-top:2px">{{ stop.customer.placeName }}</div>
                    </td>
                    <td style="padding:18px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ stop.timeSlot || 'N/A' }}</td>
                    <td style="padding:18px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">
                      <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 10px;white-space:nowrap;${stop.priorityLevel === 'high' ? 'color:#dc2626;background:rgba(220,38,38,0.1);border:1px solid rgba(220,38,38,0.2)' : stop.priorityLevel === 'urgent' ? 'color:#dc2626;background:rgba(220,38,38,0.15);border:1px solid rgba(220,38,38,0.3)' : 'color:#6b7280;background:#e5e7eb;border:1px solid #e5e7eb'}`">
                        {{ stop.priorityLevel || 'normal' }}
                      </span>
                    </td>
                    <td style="padding:18px 16px">
                      <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 10px;white-space:nowrap;color:${stopBadge(getPickupStatus(stop)).color};background:${stopBadge(getPickupStatus(stop)).bg};border:1px solid ${stopBadge(getPickupStatus(stop)).border}`">
                        {{ getPickupStatus(stop) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </div>

        <!-- Route History -->
        <div v-else-if="activeTab === 'Route History'">
          <!-- Loading state -->
          <div v-if="loadingHistory" style="padding:40px;text-align:center">
            <UIcon name="i-lucide-loader-2" style="width:32px;height:32px;color:#6b7280;animation:spin 1s linear infinite;margin-bottom:12px" />
            <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Loading pickup history...</p>
          </div>
          
          <!-- Empty state -->
          <div v-else-if="pickupHistory.length === 0" style="padding:60px;text-align:center">
            <UIcon name="i-lucide-history" style="width:40px;height:40px;color:#d1d5db;margin-bottom:12px" />
            <p style="font-size:15px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;margin:0 0 6px">No pickup history</p>
            <p style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0">This driver has no completed pickups yet.</p>
          </div>
          
          <!-- History table -->
          <div v-else style="border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr style="background:#f8f9fa;border-bottom:1px solid #e5e7eb">
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Date</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Customer</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Address</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Item Type</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Time Slot</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="pickup in pickupHistory"
                  :key="pickup.id"
                  style="border-bottom:1px solid #e5e7eb"
                  @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
                >
                  <td style="padding:17px 16px;font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ formatDate(pickup.scheduledDate) }}</td>
                  <td style="padding:17px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">
                    {{ pickup.customer?.name || 'Unknown' }}
                    <div style="font-size:12px;color:#6b7280;margin-top:2px">{{ pickup.customer?.phoneNumber || '' }}</div>
                  </td>
                  <td style="padding:17px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">
                    {{ pickup.customer?.placeName || pickup.customer?.address || 'N/A' }}
                  </td>
                  <td style="padding:17px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">
                    {{ pickup.disposableItemType?.name || 'N/A' }}
                    <div v-if="pickup.estimatedQuantity" style="font-size:12px;color:#6b7280;margin-top:2px">{{ pickup.estimatedQuantity.label }}</div>
                  </td>
                  <td style="padding:17px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ pickup.timeSlot || 'N/A' }}</td>
                  <td style="padding:17px 16px">
                    <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 10px;white-space:nowrap;color:${getStatusBadgeStyle(pickup.pickupRequest?.status).color};background:${getStatusBadgeStyle(pickup.pickupRequest?.status).bg};border:1px solid ${getStatusBadgeStyle(pickup.pickupRequest?.status).border}`">
                      {{ pickup.pickupRequest?.status || 'unknown' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Performance -->
        <div v-else-if="activeTab === 'Performance'" style="display:flex;flex-direction:column;gap:24px">

          <!-- Monthly Pickups bar chart -->
          <div style="display:flex;flex-direction:column;gap:16px">
            <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Monthly Pickups</p>
            <div style="width:100%;overflow:hidden">
              <svg width="100%" :viewBox="`0 0 1030 ${barChartH}`" preserveAspectRatio="none" style="display:block">
                <!-- Y grid lines + labels -->
                <template v-for="tick in [0,200,400,600,800]" :key="tick">
                  <line :x1="barChartPadL" :y1="barY(tick)" :x2="1030" :y2="barY(tick)" stroke="#e5e7eb" stroke-width="1" />
                  <text :x="barChartPadL - 6" :y="barY(tick) + 4" text-anchor="end" font-size="11" fill="#6b7280" font-family="Inter,sans-serif">{{ tick }}</text>
                </template>
                <!-- Bars -->
                <template v-for="b in barPoints(monthlyPickups, 1030)" :key="b.month">
                  <rect :x="b.x" :y="b.y" :width="b.w" :height="b.h" rx="4" fill="#ffb400" />
                  <text :x="b.x + b.w / 2" :y="barChartH - 6" text-anchor="middle" font-size="11" fill="#6b7280" font-family="Inter,sans-serif">{{ b.month }}</text>
                </template>
                <!-- X axis -->
                <line :x1="barChartPadL" :y1="barChartH - barChartPadB" x2="1030" :y2="barChartH - barChartPadB" stroke="#e5e7eb" stroke-width="1" />
              </svg>
            </div>
          </div>

          <!-- Completion Rate line chart -->
          <div style="display:flex;flex-direction:column;gap:16px">
            <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Completion Rate (%)</p>
            <div style="width:100%;overflow:hidden">
              <svg width="100%" :viewBox="`0 0 1030 ${lineChartH}`" preserveAspectRatio="none" style="display:block">
                <!-- Y grid lines + labels -->
                <template v-for="tick in [90,93,96,100]" :key="tick">
                  <line :x1="lineChartPadL" :y1="lineY(tick)" :x2="1030" :y2="lineY(tick)" stroke="#e5e7eb" stroke-width="1" />
                  <text :x="lineChartPadL - 6" :y="lineY(tick) + 4" text-anchor="end" font-size="11" fill="#6b7280" font-family="Inter,sans-serif">{{ tick }}</text>
                </template>
                <!-- Area fill -->
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#ffb400" stop-opacity="0.15" />
                    <stop offset="100%" stop-color="#ffb400" stop-opacity="0" />
                  </linearGradient>
                </defs>
                <polygon
                  :points="`${lineChartPadL + (1030 - lineChartPadL) / completionRates.length / 2},${lineChartH - lineChartPadB} ${linePolyline(completionRates, 1030)} ${lineChartPadL + (completionRates.length - 0.5) * ((1030 - lineChartPadL) / completionRates.length)},${lineChartH - lineChartPadB}`"
                  fill="url(#lineGrad)"
                />
                <!-- Line -->
                <polyline :points="linePolyline(completionRates, 1030)" fill="none" stroke="#ffb400" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
                <!-- Dots + X labels -->
                <template v-for="p in linePoints(completionRates, 1030)" :key="p.month">
                  <circle :cx="p.x" :cy="p.y" r="4" fill="white" stroke="#ffb400" stroke-width="2" />
                  <text :x="p.x" :y="lineChartH - 6" text-anchor="middle" font-size="11" fill="#6b7280" font-family="Inter,sans-serif">{{ p.month }}</text>
                </template>
                <!-- X axis -->
                <line :x1="lineChartPadL" :y1="lineChartH - lineChartPadB" x2="1030" :y2="lineChartH - lineChartPadB" stroke="#e5e7eb" stroke-width="1" />
              </svg>
            </div>
          </div>

          <!-- Stat cards -->
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">
            <div v-for="s in perfStats" :key="s.label" style="background:white;border:1px solid #ececec;border-radius:16px;padding:10px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
              <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:8px">{{ s.label }}</p>
              <p :style="`font-size:24px;font-weight:700;font-family:'Manrope',sans-serif;color:${s.color}`">{{ s.value }}</p>
            </div>
          </div>

        </div>

        <!-- Earnings -->
        <div v-else-if="activeTab === 'Earnings'" style="display:flex;flex-direction:column;gap:24px">

          <!-- Current period summary card -->
          <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:16px;padding:25px;display:flex;flex-direction:column;gap:16px">
            <!-- Header row -->
            <div style="display:flex;align-items:center;justify-content:space-between">
              <div style="display:flex;flex-direction:column;gap:4px">
                <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ currentPeriod.label }}</p>
                <p style="font-size:30px;font-weight:700;color:#15803d;font-family:'Manrope',sans-serif">{{ currentPeriod.total }}</p>
              </div>
              <span style="font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;color:#d49a00;background:rgba(255,180,0,0.1);border:1px solid rgba(255,180,0,0.2);border-radius:14px;padding:3px 11px">
                {{ currentPeriod.status }}
              </span>
            </div>

            <!-- Breakdown row -->
            <div style="border-top:1px solid #86efac;padding-top:17px;display:grid;grid-template-columns:repeat(4,1fr);gap:16px">
              <div style="display:flex;flex-direction:column;gap:4px">
                <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">Base Pay</p>
                <p style="font-size:14px;font-weight:700;color:#15803d;font-family:'Manrope',sans-serif">{{ currentPeriod.basePay }}</p>
              </div>
              <div style="display:flex;flex-direction:column;gap:4px">
                <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">Tasks Completed</p>
                <p style="font-size:14px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ currentPeriod.tasks }}</p>
              </div>
              <div style="display:flex;flex-direction:column;gap:4px">
                <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">Deductions</p>
                <p style="font-size:14px;font-weight:700;color:#dc2626;font-family:'Manrope',sans-serif">{{ currentPeriod.deductions }}</p>
                <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">{{ currentPeriod.deductionNote }}</p>
              </div>
              <div style="display:flex;flex-direction:column;gap:4px">
                <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">Bonus</p>
                <p style="font-size:14px;font-weight:700;color:#15803d;font-family:'Manrope',sans-serif">{{ currentPeriod.bonus }}</p>
              </div>
            </div>

            <!-- Policy note -->
            <div style="background:white;border-radius:16px;padding:12px;display:flex;flex-direction:column;gap:8px">
              <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">Payment Schedule: {{ currentPeriod.paymentSchedule }}</p>
              <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">
                <span style="font-weight:700">Deduction Policy:</span> {{ currentPeriod.deductionPolicy }}
              </p>
            </div>
          </div>

          <!-- Earnings History heading -->
          <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Earnings History</p>

          <!-- History table -->
          <div style="border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr style="background:#f8f9fa;border-bottom:1px solid #e5e7eb">
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Period</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Base Pay</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Tasks</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Deductions</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Bonus</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Total Earnings</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, i) in earningsHistory"
                  :key="i"
                  style="border-bottom:1px solid #e5e7eb"
                  @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
                >
                  <td style="padding:18px 16px;font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ row.period }}</td>
                  <td style="padding:18px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ row.basePay }}</td>
                  <td style="padding:18px 16px;font-size:14px;font-family:'Manrope',sans-serif;white-space:nowrap" :style="`color:${row.tasksColor}`">{{ row.tasks }}</td>
                  <td style="padding:18px 16px;font-size:14px;font-family:'Manrope',sans-serif;white-space:nowrap" :style="`color:${row.deductionsColor}`">{{ row.deductions }}</td>
                  <td style="padding:18px 16px;font-size:14px;font-family:'Manrope',sans-serif;white-space:nowrap" :style="`color:${row.bonusColor}`">{{ row.bonus }}</td>
                  <td style="padding:18px 16px;font-size:14px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ row.total }}</td>
                  <td style="padding:18px 16px">
                    <span style="font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 10px;white-space:nowrap;color:#22c55e;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.2)">
                      {{ row.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>

    </template><!-- end v-else -->

  <EditDriverModal
    v-if="showEditModal"
    :driver="driver"
    @close="showEditModal = false"
    @submit="handleEditDriver"
  />

  <ConfirmDialog
    v-if="showDeleteConfirm"
    title="Delete Driver"
    :message="`Are you sure you want to delete ${driver?.name || driver?.user?.name || 'this driver'}? This action cannot be undone.`"
    confirm-text="Delete"
    :loading="deleting"
    @confirm="handleDeleteDriver"
    @cancel="showDeleteConfirm = false"
  />

  </div>
</template>
