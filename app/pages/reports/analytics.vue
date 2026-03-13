<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const { format } = useCurrency()

const statCards = [
  {
    title: 'Bank Deposits',
    icon: 'i-lucide-landmark',
    iconBg: '#fff9e6',
    iconColor: '#ffb400',
    rows: [
      { label: 'Deposited Amt', value: 'GHS 68,420', color: '#22c55e' },
      { label: 'Non-Deposit Amt', value: 'GHS 15,810', color: '#ef4444' },
    ],
  },
  {
    title: 'Revenue',
    icon: 'i-lucide-dollar-sign',
    iconBg: '#f0fdf4',
    iconColor: '#22c55e',
    rows: [
      { label: 'Actual', value: 'GHS 84,230', color: '#111' },
      { label: 'Expected Monthly', value: 'GHS 95,000', color: '#6b7280' },
    ],
  },
  {
    title: 'Paid Customers',
    icon: 'i-lucide-users',
    iconBg: '#eff6ff',
    iconColor: '#3b82f6',
    rows: [
      { label: 'Paid', value: '2,314', color: '#111' },
      { label: 'Expected', value: '2,847', color: '#6b7280' },
    ],
  },
]

const revenueBreakdown = [
  { label: 'Cash',       value: 'GHS 28,400', pct: 34, color: '#ffb400' },
  { label: 'Cheque',     value: 'GHS 12,600', pct: 15, color: '#3b82f6' },
  { label: 'ePayments',  value: 'GHS 31,200', pct: 37, color: '#22c55e' },
  { label: 'Bank',       value: 'GHS 12,030', pct: 14, color: '#a855f7' },
]

// Revenue Trend - line chart data
const revenueData = [
  { month: 'Jan', value: 62000 },
  { month: 'Feb', value: 48000 },
  { month: 'Mar', value: 71000 },
  { month: 'Apr', value: 55000 },
  { month: 'May', value: 84230 },
  { month: 'Jun', value: 100000 },
]

// Pickup Frequency - bar chart data
const pickupData = [
  { month: 'Jan', value: 820 },
  { month: 'Feb', value: 950 },
  { month: 'Mar', value: 1100 },
  { month: 'Apr', value: 1350 },
  { month: 'May', value: 1600 },
  { month: 'Jun', value: 1800 },
]

// Customer Growth - line chart data
const customerData = [
  { month: 'Jan', value: 1200 },
  { month: 'Feb', value: 1500 },
  { month: 'Mar', value: 1800 },
  { month: 'Apr', value: 2100 },
  { month: 'May', value: 2500 },
  { month: 'Jun', value: 2847 },
]

// Shop Sales - bar chart data
const shopData = [
  { month: 'Jan', value: 4200 },
  { month: 'Feb', value: 6800 },
  { month: 'Mar', value: 5500 },
  { month: 'Apr', value: 9200 },
  { month: 'May', value: 11000 },
  { month: 'Jun', value: 13500 },
]

// Chart dimensions
const chartW = 478
const chartH = 300
const padL = 56, padB = 35, padT = 10, padR = 10
const innerW = chartW - padL - padR
const innerH = chartH - padT - padB

function linePoints(data: { value: number }[], maxVal: number) {
  return data.map((d, i) => {
    const x = padL + (i / (data.length - 1)) * innerW
    const y = padT + innerH - (d.value / maxVal) * innerH
    return `${x},${y}`
  }).join(' ')
}

function areaPoints(data: { value: number }[], maxVal: number) {
  const pts = data.map((d, i) => {
    const x = padL + (i / (data.length - 1)) * innerW
    const y = padT + innerH - (d.value / maxVal) * innerH
    return `${x},${y}`
  })
  const first = pts[0]!.split(',')
  const last = pts[pts.length - 1]!.split(',')
  return `${pts.join(' ')} ${last[0]},${padT + innerH} ${first[0]},${padT + innerH}`
}

function dotX(i: number, len: number) { return padL + (i / (len - 1)) * innerW }
function dotY(v: number, maxVal: number) { return padT + innerH - (v / maxVal) * innerH }

function barX(i: number, len: number) { return padL + (i / len) * innerW + 6 }
function barW(len: number) { return (innerW / len) - 10 }
function barY(v: number, maxVal: number) { return padT + innerH - (v / maxVal) * innerH }
function barH(v: number, maxVal: number) { return (v / maxVal) * innerH }

function yLabels(maxVal: number, steps = 4) {
  return Array.from({ length: steps + 1 }, (_, i) => ({
    val: Math.round((maxVal / steps) * (steps - i)),
    y: padT + (innerH / steps) * i + 4,
  }))
}

function xLabelX(i: number, len: number, isBar = false) {
  if (isBar) return barX(i, len) + barW(len) / 2
  return dotX(i, len)
}

const revenueMax = Math.max(...revenueData.map(d => d.value))
const pickupMax = Math.max(...pickupData.map(d => d.value))
const customerMax = Math.max(...customerData.map(d => d.value))
const shopMax = Math.max(...shopData.map(d => d.value))

function fmtY(v: number) {
  if (v >= 1000) return `${Math.round(v / 1000) * 1000 === v ? v / 1000 + 'k' : (v / 1000).toFixed(1) + 'k'}`
  return String(v)
}
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:32px">

    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between">
      <div>
        <h1 style="font-size:32px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;line-height:1.3;margin:0">Reports &amp; Analytics</h1>
        <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:8px;margin-bottom:0">Comprehensive business insights and analytics</p>
      </div>
      <button
        style="height:40px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer;display:flex;align-items:center;gap:8px"
        @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
        @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
      >
        <UIcon name="i-lucide-download" style="width:16px;height:16px;color:#111" />
        Export Reports
      </button>
    </div>

    <!-- Stat Cards -->
    <div class="grid-cols-4">
      <div
        v-for="card in statCards"
        :key="card.title"
        style="background:white;border:1px solid #ececec;border-radius:16px;padding:20px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)"
      >
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
          <div :style="`width:40px;height:40px;background:${card.iconBg};border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0`">
            <UIcon :name="card.icon" :style="`width:20px;height:20px;color:${card.iconColor}`" />
          </div>
          <p style="font-size:15px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin:0">{{ card.title }}</p>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <div v-for="row in card.rows" :key="row.label" style="display:flex;align-items:center;justify-content:space-between">
            <span style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif">{{ row.label }}</span>
            <span :style="`font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;color:${row.color}`">{{ row.value }}</span>
          </div>
        </div>
      </div>

      <!-- Revenue Breakdown card -->
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:20px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
          <div style="width:40px;height:40px;background:#fdf4ff;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <UIcon name="i-lucide-pie-chart" style="width:20px;height:20px;color:#a855f7" />
          </div>
          <p style="font-size:15px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin:0">Revenue Breakdown</p>
        </div>
        <div style="display:flex;flex-direction:column;gap:9px">
          <div v-for="item in revenueBreakdown" :key="item.label" style="display:flex;align-items:center;gap:8px">
            <div :style="`width:8px;height:8px;border-radius:50%;background:${item.color};flex-shrink:0`"></div>
            <span style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif;flex:1">{{ item.label }}</span>
            <span style="font-size:12px;font-weight:500;color:#6b7280;font-family:'Manrope',sans-serif">{{ item.value }}</span>
            <span :style="`font-size:12px;font-weight:600;font-family:'Manrope',sans-serif;color:${item.color};background:${item.color}18;border-radius:20px;padding:1px 7px`">{{ item.pct }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 2x2 Chart Grid -->
    <div class="grid-cols-2">

      <!-- Revenue Trend (line) -->
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1),0 1px 2px rgba(0,0,0,0.1)">
        <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin:0">Revenue Trend</p>
        <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin:4px 0 16px">Monthly revenue for the past 6 months</p>
        <svg :width="chartW" :height="chartH" style="overflow:visible;width:100%;height:auto">
          <!-- Grid lines -->
          <line v-for="i in 5" :key="i" :x1="padL" :x2="chartW - padR" :y1="padT + (innerH / 4) * (i-1)" :y2="padT + (innerH / 4) * (i-1)" stroke="#f0f0f0" stroke-width="1" />
          <!-- Y labels -->
          <text v-for="lbl in yLabels(revenueMax)" :key="lbl.val" :x="padL - 8" :y="lbl.y" text-anchor="end" font-size="11" fill="#6b7280" font-family="Manrope,sans-serif">{{ fmtY(lbl.val) }}</text>
          <!-- Area -->
          <polygon :points="areaPoints(revenueData, revenueMax)" fill="rgba(255,180,0,0.08)" />
          <!-- Line -->
          <polyline :points="linePoints(revenueData, revenueMax)" fill="none" stroke="#ffb400" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
          <!-- Dots -->
          <circle v-for="(d, i) in revenueData" :key="i" :cx="dotX(i, revenueData.length)" :cy="dotY(d.value, revenueMax)" r="4" fill="#ffb400" stroke="white" stroke-width="2" />
          <!-- X labels -->
          <text v-for="(d, i) in revenueData" :key="i" :x="xLabelX(i, revenueData.length)" :y="chartH - 6" text-anchor="middle" font-size="11" fill="#6b7280" font-family="Manrope,sans-serif">{{ d.month }}</text>
        </svg>
      </div>

      <!-- Pickup Frequency (bar) -->
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1),0 1px 2px rgba(0,0,0,0.1)">
        <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin:0">Pickup Frequency</p>
        <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin:4px 0 16px">Total pickups per month</p>
        <svg :width="chartW" :height="chartH" style="overflow:visible;width:100%;height:auto">
          <line v-for="i in 5" :key="i" :x1="padL" :x2="chartW - padR" :y1="padT + (innerH / 4) * (i-1)" :y2="padT + (innerH / 4) * (i-1)" stroke="#f0f0f0" stroke-width="1" />
          <text v-for="lbl in yLabels(pickupMax)" :key="lbl.val" :x="padL - 8" :y="lbl.y" text-anchor="end" font-size="11" fill="#6b7280" font-family="Manrope,sans-serif">{{ fmtY(lbl.val) }}</text>
          <rect v-for="(d, i) in pickupData" :key="i"
            :x="barX(i, pickupData.length)" :y="barY(d.value, pickupMax)"
            :width="barW(pickupData.length)" :height="barH(d.value, pickupMax)"
            rx="6" fill="rgba(255,180,0,0.35)"
          />
          <text v-for="(d, i) in pickupData" :key="i" :x="xLabelX(i, pickupData.length, true)" :y="chartH - 6" text-anchor="middle" font-size="11" fill="#6b7280" font-family="Manrope,sans-serif">{{ d.month }}</text>
        </svg>
      </div>

      <!-- Customer Growth (line) -->
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1),0 1px 2px rgba(0,0,0,0.1)">
        <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin:0">Customer Growth</p>
        <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin:4px 0 16px">Total active customers over time</p>
        <svg :width="chartW" :height="chartH" style="overflow:visible;width:100%;height:auto">
          <line v-for="i in 5" :key="i" :x1="padL" :x2="chartW - padR" :y1="padT + (innerH / 4) * (i-1)" :y2="padT + (innerH / 4) * (i-1)" stroke="#f0f0f0" stroke-width="1" />
          <text v-for="lbl in yLabels(customerMax)" :key="lbl.val" :x="padL - 8" :y="lbl.y" text-anchor="end" font-size="11" fill="#6b7280" font-family="Manrope,sans-serif">{{ fmtY(lbl.val) }}</text>
          <polygon :points="areaPoints(customerData, customerMax)" fill="rgba(59,130,246,0.08)" />
          <polyline :points="linePoints(customerData, customerMax)" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
          <circle v-for="(d, i) in customerData" :key="i" :cx="dotX(i, customerData.length)" :cy="dotY(d.value, customerMax)" r="4" fill="#3b82f6" stroke="white" stroke-width="2" />
          <text v-for="(d, i) in customerData" :key="i" :x="xLabelX(i, customerData.length)" :y="chartH - 6" text-anchor="middle" font-size="11" fill="#6b7280" font-family="Manrope,sans-serif">{{ d.month }}</text>
        </svg>
      </div>

      <!-- Shop Sales (bar) -->
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1),0 1px 2px rgba(0,0,0,0.1)">
        <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin:0">Shop Sales</p>
        <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin:4px 0 16px">Monthly shop revenue</p>
        <svg :width="chartW" :height="chartH" style="overflow:visible;width:100%;height:auto">
          <line v-for="i in 5" :key="i" :x1="padL" :x2="chartW - padR" :y1="padT + (innerH / 4) * (i-1)" :y2="padT + (innerH / 4) * (i-1)" stroke="#f0f0f0" stroke-width="1" />
          <text v-for="lbl in yLabels(shopMax)" :key="lbl.val" :x="padL - 8" :y="lbl.y" text-anchor="end" font-size="11" fill="#6b7280" font-family="Manrope,sans-serif">{{ fmtY(lbl.val) }}</text>
          <rect v-for="(d, i) in shopData" :key="i"
            :x="barX(i, shopData.length)" :y="barY(d.value, shopMax)"
            :width="barW(shopData.length)" :height="barH(d.value, shopMax)"
            rx="6" fill="rgba(34,197,94,0.35)"
          />
          <text v-for="(d, i) in shopData" :key="i" :x="xLabelX(i, shopData.length, true)" :y="chartH - 6" text-anchor="middle" font-size="11" fill="#6b7280" font-family="Manrope,sans-serif">{{ d.month }}</text>
        </svg>
      </div>

    </div>
  </div>
</template>
