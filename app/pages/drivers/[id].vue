<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const driver = ref<any>(null)
const loading = ref(true)
const notFound = ref(false)
const toast = useAppToast()

const chevronBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`
const todayPickups = ref<any[]>([])
const loadingPickups = ref(false)
const pickupHistory = ref<any[]>([])
const loadingHistory = ref(false)
const routeProgress = ref({ completed: 0, inProgress: 0, pending: 0, total: 0, percentage: 0 })
const estimatedCompletion = ref('N/A')

// Performance metrics
interface MonthlyMetric {
  month: string
  year: string
  count?: string
  rate?: number
}

interface DriverPerformance {
  monthlyPickups: MonthlyMetric[]
  monthlyCompletionRate: MonthlyMetric[]
  avgTimePerStop: number
  onTimeRate: number
  customerRating: number | null
}

const performance = ref<DriverPerformance | null>(null)
const loadingPerformance = ref(false)
const performanceMonths = ref(6)

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

async function fetchPerformance() {
  loadingPerformance.value = true
  const api = useApi()
  const data = await api.get<DriverPerformance>(
    `/drivers/admin/${route.params.id}/performance?months=${performanceMonths.value}`,
    'Failed to load performance metrics'
  )
  if (data) {
    performance.value = data
  }
  loadingPerformance.value = false
}

onMounted(async () => {
  const api = useApi()
  const data = await api.get<any>(`/drivers/admin/${route.params.id}`)
  if (data) {
    driver.value = data
    // Fetch today's pickups, history, performance, payout and earnings after driver data is loaded
    await Promise.all([fetchTodayPickups(), fetchPickupHistory(), fetchPerformance(), fetchCurrentPayout(), fetchEarningsHistory()])
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

const monthLabels: Record<string, string> = {
  january: 'Jan', february: 'Feb', march: 'Mar', april: 'Apr', may: 'May', june: 'Jun',
  july: 'Jul', august: 'Aug', september: 'Sep', october: 'Oct', november: 'Nov', december: 'Dec',
}

function shortMonth(month: string): string {
  const key = month.toLowerCase()
  return monthLabels[key] || month.slice(0, 3)
}

const monthlyPickups = computed(() => {
  if (!performance.value?.monthlyPickups) return []
  return performance.value.monthlyPickups.map(m => ({
    month: shortMonth(m.month),
    value: Number(m.count) || 0,
  }))
})

const completionRates = computed(() => {
  if (!performance.value?.monthlyCompletionRate) return []
  return performance.value.monthlyCompletionRate.map(m => ({
    month: shortMonth(m.month),
    value: m.rate ?? 0,
  }))
})

const perfStats = computed(() => {
  const avg = performance.value?.avgTimePerStop
  const onTime = performance.value?.onTimeRate
  const rating = performance.value?.customerRating
  return [
    { label: 'Average Time/Stop', value: avg !== undefined && avg !== null ? `${Number(avg).toFixed(1)} min` : 'N/A', color: '#1a1a1a' },
    { label: 'On-Time Rate',      value: onTime !== undefined && onTime !== null ? `${Number(onTime).toFixed(1)}%` : 'N/A', color: '#22c55e' },
    { label: 'Customer Rating',   value: rating !== undefined && rating !== null ? `${Number(rating).toFixed(1)}/5.0` : 'N/A', color: '#1a1a1a' },
  ]
})

// Bar chart helpers
const barChartH = 220
const barChartPadL = 40
const barChartPadB = 28
const barMax = computed(() => {
  const max = Math.max(...monthlyPickups.value.map(d => d.value), 1)
  return Math.ceil(max / 100) * 100 || 100
})
function barY(v: number) { return barChartH - barChartPadB - (v / barMax.value) * (barChartH - barChartPadB - 8) }
function barH(v: number) { return (v / barMax.value) * (barChartH - barChartPadB - 8) }

// Line chart helpers
const lineChartH = 220
const lineChartPadL = 40
const lineChartPadB = 28
const lineMin = 0
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

// Current pay period from payout calculation API
const payout = ref<any>(null)
const loadingPayout = ref(false)

async function fetchCurrentPayout() {
  loadingPayout.value = true
  try {
    const api = useApi()
    const month = new Date().toISOString().slice(0, 7)
    const data = await api.get<{ success: boolean; data: any }>(
      `/driver-earning/admin/payouts/calculate?driverId=${route.params.id}&periodMonth=${month}`,
      'Failed to load current pay period'
    )
    if (data?.data) payout.value = data.data
  } catch (err) {
    console.error('[driver-detail] Error fetching current payout:', err)
  }
  loadingPayout.value = false
}

const currentPeriod = computed(() => {
  const p = payout.value
  if (!p) return null
  const cur = p.currency || 'GHS'
  const monthLabel = new Date(`${p.periodMonth}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const deductionsTotal = (p.performanceDeduction || 0) + (p.manualDeductions || 0)
  return {
    label: `Current Pay Period (${monthLabel})`,
    total: `${cur} ${p.currentEarnings ?? p.totalPayout}`,
    status: p.status,
    basePay: `${cur} ${p.monthlySalary}`,
    tasks: `${p.binsCompleted}/${p.binsAssigned}`,
    deductions: `-${cur} ${deductionsTotal}`,
    deductionNote: `Performance: ${cur} ${p.performanceDeduction || 0} · Manual: ${cur} ${p.manualDeductions || 0}`,
    bonus: `+${cur} ${p.manualBonuses || 0}`,
    paymentSchedule: p.paymentSchedule,
    deductionPolicy: `Monthly bin target: ${p.monthlyBinTarget}. Minimum threshold: ${p.minimumBinThreshold} bins (minimum fill rate ${Math.round((p.minimumFillRate || 0) * 100)}%).`,
  }
})

// Earnings history from API
interface EarningsHistoryItem {
  id: string
  period: string
  periodStart: string
  periodEnd: string
  periodMonth: string
  basePay: string
  pickupsCompleted: string
  pickupsTarget: string
  deductions: string
  bonus: string
  totalEarnings: string
  currency: string
  status: string
}

const earningsHistory = ref<EarningsHistoryItem[]>([])
const earningsSchedule = ref('')
const loadingEarnings = ref(false)

async function fetchEarningsHistory() {
  loadingEarnings.value = true
  try {
    const api = useApi()
    const data = await api.get<{ success: boolean; data: { paymentSchedule: string; items: EarningsHistoryItem[] } }>(
      `/driver-earning/admin/drivers/${route.params.id}/history`,
      'Failed to load earnings history'
    )
    if (data?.data) {
      earningsHistory.value = data.data.items || []
      earningsSchedule.value = data.data.paymentSchedule || ''
    }
  } catch (err) {
    console.error('[driver-detail] Error fetching earnings history:', err)
  }
  loadingEarnings.value = false
}

function tasksColor(row: EarningsHistoryItem) {
  return Number(row.pickupsCompleted) >= Number(row.pickupsTarget) ? '#22c55e' : '#ffb400'
}
function deductionsColor(row: EarningsHistoryItem) {
  return Number(row.deductions) > 0 ? '#dc2626' : '#6b7280'
}
function bonusColor(row: EarningsHistoryItem) {
  return Number(row.bonus) > 0 ? '#22c55e' : '#6b7280'
}
function earningStatusBadge(s: string) {
  if (s === 'paid')  return { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.2)',  color: '#22c55e' }
  if (s === 'draft') return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280' }
  return { bg: 'rgba(255,180,0,0.1)', border: 'rgba(255,180,0,0.2)', color: '#d49a00' }
}

const showEditModal = ref(false)
const editDriverModalRef = ref<{ stopSubmitting: () => void } | null>(null)

// Manual bonus / deduction
const showAdjustmentModal = ref(false)
const adjustmentType = ref<'bonus' | 'deduction'>('bonus')
const adjustmentAmount = ref('')
const adjustmentReason = ref('')
const adjustmentMonth = ref('')
const adjustmentError = ref('')
const submittingAdjustment = ref(false)

function openAdjustment(type: 'bonus' | 'deduction') {
  adjustmentType.value = type
  adjustmentAmount.value = ''
  adjustmentReason.value = ''
  // Default to current month (YYYY-MM)
  adjustmentMonth.value = new Date().toISOString().slice(0, 7)
  adjustmentError.value = ''
  showAdjustmentModal.value = true
}

async function submitAdjustment() {
  if (adjustmentAmount.value === '' || Number(adjustmentAmount.value) <= 0) {
    adjustmentError.value = 'Enter an amount greater than 0.'
    return
  }
  if (!adjustmentReason.value.trim()) {
    adjustmentError.value = 'Description is required.'
    return
  }
  if (!adjustmentMonth.value) {
    adjustmentError.value = 'Period month is required.'
    return
  }

  submittingAdjustment.value = true
  adjustmentError.value = ''
  try {
    const api = useApi()
    const payload = {
      driverId: route.params.id as string,
      type: adjustmentType.value,
      amount: Number(adjustmentAmount.value),
      description: adjustmentReason.value.trim(),
      periodMonth: adjustmentMonth.value,
    }
    console.log('[driver-detail] Adding manual earning adjustment:', payload)
    const result = await api.post('/driver-earning/admin/earnings', payload, `Failed to add ${adjustmentType.value}`)
    console.log('[driver-detail] Manual earning adjustment response:', result)
    if (result !== null) {
      toast.success(`${adjustmentType.value === 'bonus' ? 'Bonus' : 'Deduction'} added successfully`)
      showAdjustmentModal.value = false
      // Refresh driver data, payout and earnings history so the adjustment is reflected
      const updated = await api.get<any>(`/drivers/admin/${route.params.id}`)
      if (updated) driver.value = updated
      await Promise.all([fetchCurrentPayout(), fetchEarningsHistory()])
    }
  } catch (err) {
    console.error(`[driver-detail] Failed to add ${adjustmentType.value}:`, err)
  } finally {
    submittingAdjustment.value = false
  }
}
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
  } else {
    // Request failed — stop the button spinner so the user can retry
    editDriverModalRef.value?.stopSubmitting()
  }
}

async function handleDeleteDriver() {
  deleting.value = true
  const api = useApi()
  try {
    // 204 No Content is the expected success response for driver deletion.
    // api.request returns null for 204 and throws on failure, so reaching this
    // point means the deletion succeeded.
    await api.request(`/drivers/admin/${route.params.id}`, { method: 'DELETE' })
    showDeleteConfirm.value = false
    toast.success('Driver deleted successfully')
    await navigateTo('/drivers')
  } catch (err: any) {
    toast.error(err.message || 'Failed to delete driver')
  } finally {
    deleting.value = false
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
    <div class="profile-card" style="background:white;border:1px solid #ececec;border-radius:16px;padding:10px 25px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
      <div class="profile-header" style="display:flex;align-items:center;justify-content:space-between;min-height:87px">
        <div class="profile-info" style="display:flex;align-items:center;gap:16px">
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
        <div class="profile-actions" style="display:flex;gap:8px;flex-shrink:0">
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
    <div class="stat-cards" style="display:grid;grid-template-columns:repeat(5,1fr);gap:24px">
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
        <p style="font-size:20px;font-weight:700;color:#22c55e;font-family:'Manrope',sans-serif">{{ driver?.stats?.periodEarnings?.currentEarnings != null ? `GHS ${driver.stats.periodEarnings.currentEarnings}` : 'N/A' }}</p>
      </div>
    </div>

    <!-- Tabbed card -->
    <div class="tabbed-card" style="background:white;border:1px solid #ececec;border-radius:16px;padding:1px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
      <div class="tab-bar" style="padding:24px 24px 0;border-bottom:1px solid #e5e7eb;display:flex;gap:0">
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
            <div class="table-scroll" style="border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
              <table style="width:100%;border-collapse:collapse;min-width:600px">
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
          <div v-else class="table-scroll" style="border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
            <table style="width:100%;border-collapse:collapse;min-width:600px">
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

          <!-- Loading state -->
          <div v-if="loadingPerformance" style="padding:40px;text-align:center">
            <UIcon name="i-lucide-loader-2" style="width:32px;height:32px;color:#6b7280;animation:spin 1s linear infinite;margin-bottom:12px" />
            <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Loading performance metrics...</p>
          </div>

          <template v-else>

          <!-- Months selector -->
          <div style="display:flex;align-items:center;justify-content:flex-end;gap:8px">
            <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Months:</span>
            <select
              v-model="performanceMonths"
              :style="`height:36px;padding:0 32px 0 12px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;cursor:pointer;appearance:none;background-image:${chevronBg};background-repeat:no-repeat;background-position:right 10px center`"
              @change="fetchPerformance"
            >
              <option :value="3">3 months</option>
              <option :value="6">6 months</option>
              <option :value="9">9 months</option>
              <option :value="12">12 months</option>
            </select>
          </div>

          <!-- Monthly Pickups bar chart -->
          <div style="display:flex;flex-direction:column;gap:16px">
            <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Monthly Pickups</p>
            <div style="width:100%;overflow:hidden">
              <svg width="100%" :viewBox="`0 0 1030 ${barChartH}`" preserveAspectRatio="none" style="display:block">
                <!-- Y grid lines + labels -->
                <template v-for="tick in [0, barMax * 0.25, barMax * 0.5, barMax * 0.75, barMax]" :key="tick">
                  <line :x1="barChartPadL" :y1="barY(tick)" :x2="1030" :y2="barY(tick)" stroke="#e5e7eb" stroke-width="1" />
                  <text :x="barChartPadL - 6" :y="barY(tick) + 4" text-anchor="end" font-size="11" fill="#6b7280" font-family="Inter,sans-serif">{{ Math.round(tick) }}</text>
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
                <template v-for="tick in [0, 25, 50, 75, 100]" :key="tick">
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

          </template>
        </div>

        <!-- Earnings -->
        <div v-else-if="activeTab === 'Earnings'" style="display:flex;flex-direction:column;gap:24px">

          <!-- Manual adjustment actions -->
          <div style="display:flex;justify-content:flex-end;gap:8px">
            <button
              style="height:40px;padding:0 16px;background:#22c55e;border:none;border-radius:20px;font-size:14px;font-weight:500;color:white;font-family:'Manrope',sans-serif;cursor:pointer;display:flex;align-items:center;gap:6px"
              @click="openAdjustment('bonus')"
              @mouseover="($event.currentTarget as HTMLElement).style.opacity='0.9'"
              @mouseleave="($event.currentTarget as HTMLElement).style.opacity='1'"
            >
              <UIcon name="i-lucide-plus" style="width:16px;height:16px" />
              Add Bonus
            </button>
            <button
              style="height:40px;padding:0 16px;background:#fef2f2;border:1px solid #fecaca;border-radius:20px;font-size:14px;font-weight:500;color:#ef4444;font-family:'Manrope',sans-serif;cursor:pointer;display:flex;align-items:center;gap:6px"
              @click="openAdjustment('deduction')"
              @mouseover="($event.currentTarget as HTMLElement).style.background='#fee2e2'"
              @mouseleave="($event.currentTarget as HTMLElement).style.background='#fef2f2'"
            >
              <UIcon name="i-lucide-minus" style="width:16px;height:16px" />
              Add Deduction
            </button>
          </div>

          <!-- Current period summary card -->
          <div v-if="currentPeriod" style="background:#f0fdf4;border:1px solid #86efac;border-radius:16px;padding:25px;display:flex;flex-direction:column;gap:16px">
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
            <div class="earnings-breakdown" style="border-top:1px solid #86efac;padding-top:17px;display:grid;grid-template-columns:repeat(4,1fr);gap:16px">
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
          <div v-else style="background:#f8f9fa;border:1px solid #ececec;border-radius:16px;padding:32px;text-align:center">
            <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ loadingPayout ? 'Loading current pay period...' : 'No payout data for the current period' }}</p>
          </div>

          <!-- Earnings History heading -->
          <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Earnings History</p>

          <!-- History table -->
          <div class="table-scroll" style="border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
            <table style="width:100%;border-collapse:collapse;min-width:700px">
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
                <tr v-if="loadingEarnings">
                  <td colspan="7" style="padding:32px 16px;text-align:center;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Loading earnings history...</td>
                </tr>
                <tr v-else-if="earningsHistory.length === 0">
                  <td colspan="7" style="padding:32px 16px;text-align:center;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">No earnings history yet</td>
                </tr>
                <template v-else>
                  <tr
                    v-for="row in earningsHistory"
                    :key="row.id"
                    style="border-bottom:1px solid #e5e7eb"
                    @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
                    @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
                  >
                    <td style="padding:18px 16px;font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ row.period }}</td>
                    <td style="padding:18px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ row.currency || 'GHS' }} {{ row.basePay }}</td>
                    <td style="padding:18px 16px;font-size:14px;font-family:'Manrope',sans-serif;white-space:nowrap" :style="`color:${tasksColor(row)}`">{{ row.pickupsCompleted }}/{{ row.pickupsTarget }}</td>
                    <td style="padding:18px 16px;font-size:14px;font-family:'Manrope',sans-serif;white-space:nowrap" :style="`color:${deductionsColor(row)}`">-{{ row.currency || 'GHS' }} {{ row.deductions }}</td>
                    <td style="padding:18px 16px;font-size:14px;font-family:'Manrope',sans-serif;white-space:nowrap" :style="`color:${bonusColor(row)}`">+{{ row.currency || 'GHS' }} {{ row.bonus }}</td>
                    <td style="padding:18px 16px;font-size:14px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ row.currency || 'GHS' }} {{ row.totalEarnings }}</td>
                    <td style="padding:18px 16px">
                      <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 10px;white-space:nowrap;color:${earningStatusBadge(row.status).color};background:${earningStatusBadge(row.status).bg};border:1px solid ${earningStatusBadge(row.status).border}`">
                        {{ row.status }}
                      </span>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>

    </template><!-- end v-else -->

  <EditDriverModal
    v-if="showEditModal"
    ref="editDriverModalRef"
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

  <!-- Manual bonus / deduction modal -->
  <div
    v-if="showAdjustmentModal"
    style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:50;display:flex;align-items:center;justify-content:center;padding:24px"
    @click.self="showAdjustmentModal = false"
  >
    <div style="background:white;border:1px solid #e5e7eb;border-radius:16px;width:420px;box-shadow:0 10px 15px rgba(0,0,0,0.1),0 4px 6px rgba(0,0,0,0.1);position:relative;display:flex;flex-direction:column">
      <!-- Close -->
      <button
        style="position:absolute;top:16px;right:16px;width:28px;height:28px;border:none;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:8px;opacity:0.7"
        @click="showAdjustmentModal = false"
      >
        <UIcon name="i-lucide-x" style="width:16px;height:16px;color:#111" />
      </button>

      <!-- Header -->
      <div style="padding:24px 24px 0">
        <p style="font-size:20px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ adjustmentType === 'bonus' ? 'Add Manual Bonus' : 'Add Manual Deduction' }}</p>
        <p style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:4px">{{ adjustmentType === 'bonus' ? 'Add a one-off bonus to this driver\u2019s current pay period.' : 'Apply a one-off deduction to this driver\u2019s current pay period.' }}</p>
      </div>

      <!-- Body -->
      <div style="padding:16px 24px;display:flex;flex-direction:column;gap:16px">
        <div v-if="adjustmentError" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;font-size:13px;color:#ef4444;font-family:'Manrope',sans-serif">{{ adjustmentError }}</div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Amount (GHS)</label>
          <input
            v-model="adjustmentAmount"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            style="width:100%;height:39px;padding:0 12px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box"
            @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
            @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
          />
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Period Month</label>
          <input
            v-model="adjustmentMonth"
            type="month"
            style="width:100%;height:39px;padding:0 12px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box"
            @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
            @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
          />
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Description</label>
          <textarea
            v-model="adjustmentReason"
            rows="3"
            :placeholder="adjustmentType === 'bonus' ? 'e.g. Outstanding performance this period' : 'e.g. Damaged equipment'"
            style="width:100%;padding:8px 12px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;resize:none;box-sizing:border-box;line-height:1.5"
            @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
            @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
          />
        </div>
      </div>

      <!-- Footer -->
      <div style="padding:17px 24px;border-top:1px solid #e5e7eb;display:flex;justify-content:flex-end;gap:8px">
        <button
          style="height:40px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
          :disabled="submittingAdjustment"
          @click="showAdjustmentModal = false"
        >Cancel</button>
        <button
          :style="`height:40px;padding:0 20px;background:${adjustmentType === 'bonus' ? '#22c55e' : '#ef4444'};border:none;border-radius:20px;font-size:14px;font-weight:500;color:white;font-family:'Manrope',sans-serif;cursor:pointer;display:flex;align-items:center;gap:8px;opacity:${submittingAdjustment ? '0.8' : '1'}`"
          :disabled="submittingAdjustment"
          @click="submitAdjustment"
        >
          <UIcon v-if="submittingAdjustment" name="i-lucide-loader-2" style="width:16px;height:16px;animation:spin 1s linear infinite" />
          {{ submittingAdjustment ? 'Saving...' : (adjustmentType === 'bonus' ? 'Add Bonus' : 'Add Deduction') }}
        </button>
      </div>
    </div>
  </div>

  </div>
</template>

<style scoped>
/* Responsive adjustments for driver detail page */

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

  .stat-cards {
    grid-template-columns: repeat(3, 1fr) !important;
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

  .stat-cards {
    grid-template-columns: repeat(2, 1fr) !important;
  }

  .tab-bar {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .tab-bar::-webkit-scrollbar {
    display: none;
  }

  .earnings-breakdown {
    grid-template-columns: repeat(2, 1fr) !important;
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

  .stat-cards {
    grid-template-columns: 1fr !important;
  }

  .earnings-breakdown {
    grid-template-columns: 1fr !important;
  }
}
</style>
