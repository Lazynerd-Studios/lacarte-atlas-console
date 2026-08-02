<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const api = useApi()

// Analytics data from API
interface AnalyticsResponse {
  activeCustomersPercentage: number
  newCustomersPercentage: number
  todayPickups: { count: number }
  outstandingPaymentsGhs: number
  pickupVolume: { date: string; pickupCount: number }[]
}

interface RevenueResponse {
  success: boolean
  data: {
    summary: { totalRevenue: number; averageMonthlyRevenue: number; currency: string }
    monthlyData: { month: string; revenue: number; transactionCount: number; monthOverMonthGrowth: number | null }[]
  }
}

const analytics = ref<AnalyticsResponse | null>(null)
const revenueAnalytics = ref<RevenueResponse | null>(null)

interface ShopOverviewResponse {
  success: boolean
  data: {
    metrics: { count: number; percentageChange: number; label: string }[]
  }
}

const shopOverview = ref<ShopOverviewResponse | null>(null)

const stats = computed(() => [
  { label: 'Active Customers', value: analytics.value ? `${analytics.value.activeCustomersPercentage}%` : '0%', change: analytics.value ? `${analytics.value.newCustomersPercentage}% new` : '0%', positive: analytics.value && analytics.value.newCustomersPercentage > 0 ? true : null, icon: 'i-lucide-users' },
  { label: 'Drivers on Duty',  value: '0', change: '0%', positive: null, icon: 'i-lucide-truck' },
  { label: "Today's Pickups",  value: analytics.value ? String(analytics.value.todayPickups.count) : '0', change: '0%', positive: null, icon: 'i-lucide-package' },
  { label: 'Outstanding Payments', value: analytics.value ? `GHS ${analytics.value.outstandingPaymentsGhs.toLocaleString()}` : 'GHS 0', change: '0%', positive: null, icon: 'i-lucide-credit-card' },
  { label: 'Revenue This Month',   value: revenueAnalytics.value ? `GHS ${revenueAnalytics.value.data.summary.totalRevenue.toLocaleString()}` : 'GHS 0', change: currentMonthGrowth.value, positive: null, icon: 'i-lucide-bar-chart-2' },
  { label: 'Shop Orders Today',    value: shopOverview.value?.data?.metrics?.[0]?.count != null ? String(shopOverview.value.data.metrics[0].count) : '0', change: shopOverview.value?.data?.metrics?.[0]?.percentageChange != null ? `${shopOverview.value.data.metrics[0].percentageChange}%` : '0%', positive: shopOverview.value?.data?.metrics?.[0]?.percentageChange ? shopOverview.value.data.metrics[0].percentageChange > 0 : null, icon: 'i-lucide-shopping-bag' },
])

const monthShortNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const revenueData = computed(() => {
  if (revenueTab.value === 'pickup') return pickupChartData.value.length ? pickupChartData.value : emptyRevenueData
  if (revenueTab.value === 'store') return storeChartData.value.length ? storeChartData.value : emptyRevenueData
  // combined: use pickup as primary (both shown as separate lines)
  return pickupChartData.value.length ? pickupChartData.value : emptyRevenueData
})

const emptyRevenueData = [
  { month: 'Jan', value: 0, transactionCount: 0 },
  { month: 'Feb', value: 0, transactionCount: 0 },
  { month: 'Mar', value: 0, transactionCount: 0 },
  { month: 'Apr', value: 0, transactionCount: 0 },
  { month: 'May', value: 0, transactionCount: 0 },
  { month: 'Jun', value: 0, transactionCount: 0 },
]

const currentMonthGrowth = computed(() => {
  if (!revenueAnalytics.value?.data?.monthlyData?.length) return '0%'
  const last = revenueAnalytics.value.data.monthlyData[revenueAnalytics.value.data.monthlyData.length - 1]
  if (last?.monthOverMonthGrowth !== null && last?.monthOverMonthGrowth !== undefined) return `${last.monthOverMonthGrowth}%`
  return '0%'
})

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const pickupData = computed(() => {
  if (analytics.value?.pickupVolume?.length) {
    return analytics.value.pickupVolume.map(item => {
      const date = new Date(item.date)
      return { day: dayNames[date.getDay()], value: item.pickupCount }
    })
  }
  return [
    { day: 'Mon', value: 0 },
    { day: 'Tue', value: 0 },
    { day: 'Wed', value: 0 },
    { day: 'Thu', value: 0 },
    { day: 'Fri', value: 0 },
    { day: 'Sat', value: 0 },
    { day: 'Sun', value: 0 },
  ]
})

interface PickupRequest {
  id: string
  customer: {
    name: string
    address: string
  }
  preferredPickupDate: string
  paymentType: string
  paymentStatus: string
}

interface Truck {
  id: string
  truckId: string
  plateNumber: string
  status: string
  assignedDriver: {
    name: string
  } | null
}

const pendingPickups = ref<PickupRequest[]>([])
const trucks = ref<Truck[]>([])

async function fetchPendingPickups() {
  try {
    const data = await api.get<{ data: PickupRequest[] }>(
      '/pickup-requests/admin/list?status=pending&limit=3',
      'Failed to load pending pickups'
    )
    
    if (data?.data) {
      pendingPickups.value = data.data
    }
  } catch (err) {
    console.error('Error fetching pending pickups:', err)
  }
}

async function fetchActiveTrucks() {
  try {
    const data = await api.get<{ data: Truck[] }>(
      '/trucks/admin/',
      'Failed to load trucks'
    )
    
    if (data?.data) {
      // Filter to only show active trucks (those with assigned drivers and active status)
      trucks.value = data.data.filter(t => t.assignedDriver && t.status === 'active').slice(0, 4)
    }
  } catch (err) {
    console.error('Error fetching trucks:', err)
  }
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function paymentTypeBadge(type: string) {
  if (type === 'subscription') return { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', color: '#3b82f6', label: 'Subscription' }
  return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280', label: 'Pay as you go' }
}

async function fetchAnalytics() {
  try {
    const data = await api.get<AnalyticsResponse>(
      '/dashboard/admin/analytics',
      'Failed to load analytics'
    )
    if (data) {
      analytics.value = data
    }
  } catch (err) {
    console.error('Error fetching analytics:', err)
  }
}

async function fetchRevenue() {
  try {
    // Filtered call for KPI card (current month only)
    const now = new Date()
    const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const data = await api.get<RevenueResponse>(
      `/admin/analytics/revenue?startDate=${startDate}&endDate=${endDate}`,
      'Failed to load revenue analytics'
    )
    if (data) {
      revenueAnalytics.value = data
    }
  } catch (err) {
    console.error('Error fetching revenue:', err)
  }
}

const revenueTab = ref<'combined' | 'pickup' | 'store'>('combined')

const pickupRevenueData = ref<RevenueResponse | null>(null)
const storeRevenueData = ref<RevenueResponse | null>(null)

async function fetchRevenueChart() {
  try {
    const [pickupRes, storeRes] = await Promise.all([
      api.get<RevenueResponse>('/admin/analytics/revenue?revenue_type=pickup', 'Failed to load pickup revenue'),
      api.get<RevenueResponse>('/admin/analytics/revenue?revenue_type=store', 'Failed to load store revenue'),
    ])
    if (pickupRes) pickupRevenueData.value = pickupRes
    if (storeRes) storeRevenueData.value = storeRes
  } catch (err) {
    console.error('Error fetching revenue chart:', err)
  }
}

function mapMonthlyData(response: RevenueResponse | null) {
  if (response?.data?.monthlyData?.length) {
    return response.data.monthlyData.map(item => {
      const monthStr = item.month.split('-')[1]
      const monthIndex = parseInt(monthStr!, 10) - 1
      return { month: monthShortNames[monthIndex], value: item.revenue, transactionCount: item.transactionCount }
    })
  }
  return []
}

const pickupChartData = computed(() => mapMonthlyData(pickupRevenueData.value))
const storeChartData = computed(() => mapMonthlyData(storeRevenueData.value))

async function fetchShopOverview() {
  try {
    const data = await api.get<ShopOverviewResponse>(
      '/store/admin/dashboard/overview',
      'Failed to load shop overview'
    )
    if (data) {
      shopOverview.value = data
    }
  } catch (err) {
    console.error('Error fetching shop overview:', err)
  }
}

const initialLoading = ref(true)

onMounted(async () => {
  await Promise.allSettled([
    fetchAnalytics(),
    fetchRevenue(),
    fetchRevenueChart(),
    fetchPendingPickups(),
    fetchActiveTrucks(),
    fetchShopOverview(),
  ])
  initialLoading.value = false
})

// Chart helpers
const revenueMax = computed(() => {
  const pickupMax = Math.max(...pickupChartData.value.map(d => d.value), 0)
  const storeMax = Math.max(...storeChartData.value.map(d => d.value), 0)
  if (revenueTab.value === 'pickup') return Math.max(pickupMax, 1)
  if (revenueTab.value === 'store') return Math.max(storeMax, 1)
  return Math.max(pickupMax, storeMax, 1)
})
const pickupMax  = computed(() => {
  const max = Math.max(...pickupData.value.map(d => d.value), 1)
  // Round up to a multiple of 4 so the 5 y-axis labels are distinct integers
  return Math.ceil(max / 4) * 4
})
const chartW = 478
const chartH = 260
const padL = 50, padB = 30, padT = 10, padR = 10
const innerW = chartW - padL - padR
const innerH = chartH - padT - padB

function makePoints(data: { value: number }[], max: number) {
  if (data.length < 2) return ''
  return data.map((d, i) => {
    const x = padL + (i / (data.length - 1)) * innerW
    const y = padT + innerH - (max ? d.value / max : 0) * innerH
    return `${x},${y}`
  }).join(' ')
}

function makeArea(data: { value: number }[], max: number) {
  if (data.length < 2) return ''
  const pts = data.map((d, i) => {
    const x = padL + (i / (data.length - 1)) * innerW
    const y = padT + innerH - (max ? d.value / max : 0) * innerH
    return `${x},${y}`
  })
  const first = pts[0]!.split(',')
  const last  = pts[pts.length - 1]!.split(',')
  return `${pts.join(' ')} ${last[0]},${padT + innerH} ${first[0]},${padT + innerH}`
}

function revenuePoints() {
  return makePoints(revenueData.value, revenueMax.value)
}

function revenueArea() {
  return makeArea(revenueData.value, revenueMax.value)
}

function storePoints() {
  return makePoints(storeChartData.value, revenueMax.value)
}

function storeArea() {
  return makeArea(storeChartData.value, revenueMax.value)
}

function barX(i: number) { return padL + (i / pickupData.value.length) * innerW + 10 }
function barW() { return (innerW / pickupData.value.length) - 14 }
function barY(v: number) { return padT + innerH - (pickupMax.value ? v / pickupMax.value : 0) * innerH }
function barH(v: number) { return (pickupMax.value ? v / pickupMax.value : 0) * innerH }
</script>

<template>
  <PageSkeleton v-if="initialLoading" type="dashboard" />
  <div v-else style="display:flex;flex-direction:column;gap:24px">
    <!-- Page heading -->
    <div>
      <h1 style="font-size:32px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;line-height:1.3">Admin Dashboard</h1>
      <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:4px">Welcome back! Here's what's happening today.</p>
    </div>

    <!-- Stat cards -->
    <div class="grid-cols-3">
      <div
        v-for="stat in stats"
        :key="stat.label"
        style="background:white;border:1px solid #ececec;border-radius:16px;padding:1px;box-shadow:0 1px 3px rgba(0,0,0,0.1),0 1px 2px rgba(0,0,0,0.1);overflow:hidden"
      >
        <div style="position:relative;height:144px">
          <!-- Icon + badge -->
          <div style="position:absolute;top:7px;left:24px;right:24px;height:48px;display:flex;align-items:center;justify-content:space-between">
            <div style="width:48px;height:48px;background:#fff9e6;border-radius:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <UIcon :name="stat.icon" style="width:24px;height:24px;color:#ffb400" />
            </div>
            <span :style="`font-size:14px;font-weight:500;font-family:'Manrope',sans-serif;line-height:20px;color:${stat.positive === true ? '#22c55e' : stat.positive === false ? '#ef4444' : '#6b7280'}`">
              {{ stat.change }}
            </span>
          </div>
          <!-- Label -->
          <p style="position:absolute;top:60px;left:24px;font-size:14px;font-weight:400;color:#6b7280;font-family:'Manrope',sans-serif;line-height:20px;white-space:nowrap">
            {{ stat.label }}
          </p>
          <!-- Value -->
          <p style="position:absolute;top:82px;left:24px;font-size:24px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif;line-height:32px;white-space:nowrap">
            {{ stat.value }}
          </p>
        </div>
      </div>
    </div>

    <!-- Charts row -->
    <div class="grid-cols-2">
      <!-- Revenue chart -->
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
          <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Revenue Overview</p>
          <div style="display:flex;align-items:center;gap:4px;background:#f3f4f6;border-radius:20px;padding:3px">
            <button
              v-for="tab in (['combined', 'pickup', 'store'] as const)"
              :key="tab"
              :style="`height:30px;padding:0 14px;border:none;border-radius:16px;font-size:13px;font-weight:500;font-family:'Manrope',sans-serif;cursor:pointer;transition:all 0.15s;${revenueTab === tab ? 'background:white;color:#111;box-shadow:0 1px 2px rgba(0,0,0,0.08)' : 'background:transparent;color:#6b7280'}`"
              @click="revenueTab = tab"
            >{{ tab === 'combined' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1) }}</button>
          </div>
        </div>
        <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:16px">Monthly revenue for the past 6 months</p>
        <svg :viewBox="`0 0 ${chartW} ${chartH}`" style="overflow:visible;width:100%;height:auto">
          <!-- Grid lines -->
          <line v-for="i in 4" :key="i" :x1="padL" :x2="chartW - padR" :y1="padT + (innerH / 4) * (i-1)" :y2="padT + (innerH / 4) * (i-1)" stroke="#f0f0f0" stroke-width="1" />
          <!-- Y labels -->
          <text v-for="i in 5" :key="i" :x="padL - 8" :y="padT + (innerH / 4) * (i-1) + 4" text-anchor="end" font-size="11" fill="#6b7280" font-family="Manrope,sans-serif">
            {{ revenueMax >= 1000 ? `${Number((revenueMax - (revenueMax / 4) * (i-1)).toFixed(0)) / 1000}k` : (revenueMax - (revenueMax / 4) * (i-1)).toFixed(2) }}
          </text>

          <!-- Pickup line (gold) - shown on All & Pickup tabs -->
          <template v-if="revenueTab === 'combined' || revenueTab === 'pickup'">
            <polygon :points="revenueArea()" fill="rgba(255,180,0,0.08)" />
            <polyline :points="revenuePoints()" fill="none" stroke="#ffb400" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
            <circle v-for="(d, i) in revenueData" :key="'p'+i"
              :cx="padL + (i / (revenueData.length - 1)) * innerW"
              :cy="padT + innerH - (d.value / revenueMax) * innerH"
              r="5" fill="#ffb400" stroke="white" stroke-width="2"
            />
          </template>

          <!-- Store line (blue) - shown on All & Store tabs -->
          <template v-if="(revenueTab === 'combined' || revenueTab === 'store') && storeChartData.length">
            <polygon :points="storeArea()" fill="rgba(59,130,246,0.08)" />
            <polyline :points="storePoints()" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
            <circle v-for="(d, i) in storeChartData" :key="'s'+i"
              :cx="padL + (i / (storeChartData.length - 1)) * innerW"
              :cy="padT + innerH - (d.value / revenueMax) * innerH"
              r="5" fill="#3b82f6" stroke="white" stroke-width="2"
            />
          </template>

          <!-- X labels -->
          <text v-for="(d, i) in revenueData" :key="i"
            :x="padL + (i / (revenueData.length - 1)) * innerW"
            :y="chartH - 6"
            text-anchor="middle" font-size="11" fill="#6b7280" font-family="Manrope,sans-serif"
          >{{ d.month }}</text>
        </svg>

        <!-- Legend -->
        <div v-if="revenueTab === 'combined'" style="display:flex;align-items:center;gap:16px;margin-top:12px;justify-content:center">
          <div style="display:flex;align-items:center;gap:6px">
            <span style="width:12px;height:3px;background:#ffb400;border-radius:2px"></span>
            <span style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">Pickup</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <span style="width:12px;height:3px;background:#3b82f6;border-radius:2px"></span>
            <span style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">Store</span>
          </div>
        </div>
      </div>

      <!-- Pickup bar chart -->
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Pickup Volume</p>
        <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:4px;margin-bottom:16px">Daily pickups for this week</p>
        <svg :viewBox="`0 0 ${chartW} ${chartH}`" style="overflow:visible;width:100%;height:auto">
          <!-- Grid lines -->
          <line v-for="i in 4" :key="i" :x1="padL" :x2="chartW - padR" :y1="padT + (innerH / 4) * (i-1)" :y2="padT + (innerH / 4) * (i-1)" stroke="#f0f0f0" stroke-width="1" />
          <!-- Y labels -->
          <text v-for="i in 5" :key="i" :x="padL - 8" :y="padT + (innerH / 4) * (i-1) + 4" text-anchor="end" font-size="11" fill="#6b7280" font-family="Manrope,sans-serif">
            {{ Math.round(pickupMax - (pickupMax / 4) * (i-1)) }}
          </text>
          <!-- Bars -->
          <rect v-for="(d, i) in pickupData" :key="i"
            :x="barX(i)" :y="barY(d.value)" :width="barW()" :height="barH(d.value)"
            rx="6" :fill="d.day === dayNames[new Date().getDay()] ? '#ffb400' : 'rgba(255,180,0,0.25)'"
          />
          <!-- X labels -->
          <text v-for="(d, i) in pickupData" :key="i"
            :x="barX(i) + barW() / 2" :y="chartH - 6"
            text-anchor="middle" font-size="11" fill="#6b7280" font-family="Manrope,sans-serif"
          >{{ d.day }}</text>
        </svg>
      </div>
    </div>

    <!-- Pending pickups + Active trucks -->
    <div class="grid-cols-2">
      <!-- Pending pickup requests -->
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <div style="display:flex;align-items:center;gap:8px">
            <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Pending Pickup Requests</p>
            <span style="font-size:12px;font-weight:500;color:#d49a00;background:rgba(255,180,0,0.1);border:1px solid rgba(255,180,0,0.2);border-radius:14px;padding:3px 11px">{{ pendingPickups.length }}</span>
          </div>
          <NuxtLink to="/pickups" style="font-size:14px;color:#ffb400;font-family:'Manrope',sans-serif;text-decoration:none">View All</NuxtLink>
        </div>
        <div v-if="pendingPickups.length > 0" style="display:flex;flex-direction:column;gap:12px">
          <NuxtLink v-for="p in pendingPickups" :key="p.id" :to="`/pickups/${p.id}`" style="background:#f8f9fa;border-radius:16px;padding:12px;display:flex;gap:12px;align-items:flex-start;text-decoration:none;transition:background 0.15s" @mouseover="($event.currentTarget as HTMLElement).style.background='#f0f1f3'" @mouseleave="($event.currentTarget as HTMLElement).style.background='#f8f9fa'">
            <div style="width:40px;height:40px;background:#ffb400;border-radius:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <UIcon name="i-lucide-clipboard-list" style="width:20px;height:20px;color:white" />
            </div>
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px">
                <div>
                  <p style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ p.customer.name }}</p>
                  <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">{{ p.customer.address }}</p>
                </div>
                <span :style="`flex-shrink:0;font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;color:${paymentTypeBadge(p.paymentType).color};background:${paymentTypeBadge(p.paymentType).bg};border:1px solid ${paymentTypeBadge(p.paymentType).border};border-radius:14px;padding:3px 11px;white-space:nowrap`">
                  {{ paymentTypeBadge(p.paymentType).label }}
                </span>
              </div>
              <div style="display:flex;align-items:center;gap:12px">
                <span style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">Pickup: {{ formatDate(p.preferredPickupDate) }}</span>
                <div v-if="p.paymentStatus === 'unpaid'" style="display:flex;align-items:center;gap:4px">
                  <UIcon name="i-lucide-alert-circle" style="width:12px;height:12px;color:#dc2626" />
                  <span style="font-size:12px;color:#dc2626;font-family:'Manrope',sans-serif">Unpaid</span>
                </div>
              </div>
            </div>
          </NuxtLink>
        </div>
        <div v-else style="text-align:center;padding:32px 0">
          <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">No pending pickup requests</p>
        </div>
      </div>

      <!-- Active trucks -->
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:25px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin-bottom:16px">Active Trucks</p>
        <div v-if="trucks.length > 0" style="display:flex;flex-direction:column;gap:16px">
          <NuxtLink v-for="truck in trucks" :key="truck.id" :to="`/trucks/${truck.id}`" style="height:72px;background:#f8f9fa;border-radius:16px;padding:0 16px;display:flex;align-items:center;gap:12px;text-decoration:none;transition:background 0.15s" @mouseover="($event.currentTarget as HTMLElement).style.background='#f0f1f3'" @mouseleave="($event.currentTarget as HTMLElement).style.background='#f8f9fa'">
            <div style="width:40px;height:40px;background:#22c55e;border-radius:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <UIcon name="i-lucide-truck" style="width:20px;height:20px;color:white" />
            </div>
            <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px">
              <div style="display:flex;align-items:center;gap:8px">
                <span style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ truck.truckId }}</span>
                <span style="font-size:12px;font-weight:500;color:#22c55e;background:rgba(34,197,94,0.1);border-radius:14px;padding:3px 11px">{{ truck.status }}</span>
              </div>
              <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">{{ truck.assignedDriver?.name || 'No driver' }}</p>
            </div>
            <div style="display:flex;flex-direction:column;gap:2px;align-items:flex-end">
              <span style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">{{ truck.plateNumber }}</span>
            </div>
          </NuxtLink>
        </div>
        <div v-else style="text-align:center;padding:32px 0">
          <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">No active trucks</p>
        </div>
      </div>
    </div>
  </div>
</template>
