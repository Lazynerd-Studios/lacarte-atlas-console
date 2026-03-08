<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

// Chart helpers
const chartW = 478, chartH = 260
const padL = 52, padB = 30, padT = 10, padR = 10
const innerW = chartW - padL - padR
const innerH = chartH - padT - padB

function linePoints(data: { value: number }[], maxVal: number) {
  return data.map((d, i) => `${padL + (i / (data.length - 1)) * innerW},${padT + innerH - (d.value / maxVal) * innerH}`).join(' ')
}
function areaPoints(data: { value: number }[], maxVal: number) {
  const pts = data.map((d, i) => `${padL + (i / (data.length - 1)) * innerW},${padT + innerH - (d.value / maxVal) * innerH}`)
  const fx = pts[0]!.split(',')[0], lx = pts[pts.length - 1]!.split(',')[0]
  return `${pts.join(' ')} ${lx},${padT + innerH} ${fx},${padT + innerH}`
}
function dotX(i: number, len: number) { return padL + (i / (len - 1)) * innerW }
function dotY(v: number, max: number) { return padT + innerH - (v / max) * innerH }
function barX(i: number, len: number) { return padL + (i / len) * innerW + 5 }
function barW(len: number) { return (innerW / len) - 8 }
function barY(v: number, max: number) { return padT + innerH - (v / max) * innerH }
function barH(v: number, max: number) { return (v / max) * innerH }
function yLabels(max: number, steps = 4) {
  return Array.from({ length: steps + 1 }, (_, i) => ({ val: Math.round((max / steps) * (steps - i)), y: padT + (innerH / steps) * i + 4 }))
}
function fmtY(v: number) { return v >= 1000 ? `${v / 1000}k` : String(v) }

// Stat cards
const stats = [
  { icon: 'i-lucide-users',       iconBg: '#eff6ff', iconColor: '#3b82f6', label: 'Total Customers',    value: '2,847', sub: '+12.5% this month', subColor: '#22c55e' },
  { icon: 'i-lucide-user-plus',   iconBg: '#f0fdf4', iconColor: '#22c55e', label: 'New This Month',     value: '124',   sub: '+18.3% vs last month', subColor: '#22c55e' },
  { icon: 'i-lucide-user-minus',  iconBg: '#fef2f2', iconColor: '#ef4444', label: 'Churned',            value: '18',    sub: '0.6% churn rate',    subColor: '#ef4444' },
  { icon: 'i-lucide-repeat',      iconBg: '#fff9e6', iconColor: '#ffb400', label: 'Retention Rate',     value: '96.8%', sub: '+1.2% vs last month', subColor: '#22c55e' },
]

// Customer growth line
const growthData = [
  { month: 'Jan', value: 2340 }, { month: 'Feb', value: 2480 }, { month: 'Mar', value: 2560 },
  { month: 'Apr', value: 2650 }, { month: 'May', value: 2740 }, { month: 'Jun', value: 2847 },
]
const growthMax = Math.max(...growthData.map(d => d.value))

// New vs churned bar (grouped — simplified as two series)
const newVsChurned = [
  { month: 'Jan', newC: 98,  churned: 22 },
  { month: 'Feb', newC: 112, churned: 18 },
  { month: 'Mar', newC: 105, churned: 25 },
  { month: 'Apr', newC: 118, churned: 15 },
  { month: 'May', newC: 130, churned: 20 },
  { month: 'Jun', newC: 124, churned: 18 },
]
const nvcMax = Math.max(...newVsChurned.map(d => d.newC))

// Plan distribution donut
const plans = [
  { label: 'Subscription', pct: 68, color: '#3b82f6', count: '1,936' },
  { label: 'Pay-as-you-go', pct: 32, color: '#ffb400', count: '911' },
]
const circumference = 2 * Math.PI * 40
const donutSlices = computed(() => {
  let offset = 0
  return plans.map(p => {
    const dash = (p.pct / 100) * circumference
    const s = { ...p, dash, gap: circumference - dash, offset }
    offset += dash
    return s
  })
})

// Payment status breakdown
const paymentStatus = [
  { label: 'Paid',    value: 2314, pct: 81, color: '#22c55e' },
  { label: 'Pending', value: 380,  pct: 13, color: '#ffb400' },
  { label: 'Overdue', value: 153,  pct: 6,  color: '#ef4444' },
]

// Top customers table
const topCustomers = [
  { name: 'Johnson Enterprises', id: 'CUST-2025-1', plan: 'subscription', pickups: 42, paid: 'GHS 1,890', status: 'active' },
  { name: 'Chen Holdings',       id: 'CUST-2025-8', plan: 'payg',         pickups: 38, paid: 'GHS 2,470', status: 'active' },
  { name: 'Williams & Co',       id: 'CUST-2025-3', plan: 'subscription', pickups: 36, paid: 'GHS 1,620', status: 'active' },
  { name: 'Martinez Family',     id: 'CUST-2025-12', plan: 'payg',        pickups: 31, paid: 'GHS 2,015', status: 'active' },
  { name: 'Brown Residence',     id: 'CUST-2025-5', plan: 'subscription', pickups: 29, paid: 'GHS 1,305', status: 'active' },
]


function planBadge(p: string) {
  if (p === 'subscription') return 'color:#3b82f6;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2)'
  return 'color:#6b7280;background:#e5e7eb;border:1px solid #e5e7eb'
}
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:28px">

    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between">
      <div>
        <h1 style="font-size:32px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;line-height:1.3;margin:0">Customer Analytics</h1>
        <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:8px;margin-bottom:0">Growth, retention, payment behaviour and customer insights</p>
      </div>
      <button
        style="height:40px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer;display:flex;align-items:center;gap:8px"
        @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
        @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
      >
        <UIcon name="i-lucide-download" style="width:16px;height:16px;color:#111" />
        Export
      </button>
    </div>

    <!-- Stat cards -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px">
      <div v-for="s in stats" :key="s.label" style="background:white;border:1px solid #ececec;border-radius:16px;padding:20px 22px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
          <div :style="`width:38px;height:38px;background:${s.iconBg};border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0`">
            <UIcon :name="s.icon" :style="`width:18px;height:18px;color:${s.iconColor}`" />
          </div>
          <span style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif">{{ s.label }}</span>
        </div>
        <p style="font-size:26px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;margin:0 0 4px">{{ s.value }}</p>
        <p :style="`font-size:12px;font-family:'Manrope',sans-serif;margin:0;color:${s.subColor}`">{{ s.sub }}</p>
      </div>
    </div>

    <!-- Charts row -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">

      <!-- Customer Growth line -->
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
        <p style="font-size:18px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin:0">Customer Growth</p>
        <p style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif;margin:4px 0 16px">Total active customers over time</p>
        <svg :width="chartW" :height="chartH" style="overflow:visible;width:100%;height:auto">
          <line v-for="i in 5" :key="i" :x1="padL" :x2="chartW-padR" :y1="padT+(innerH/4)*(i-1)" :y2="padT+(innerH/4)*(i-1)" stroke="#f0f0f0" stroke-width="1"/>
          <text v-for="l in yLabels(growthMax)" :key="l.val" :x="padL-8" :y="l.y" text-anchor="end" font-size="11" fill="#6b7280" font-family="Manrope,sans-serif">{{ fmtY(l.val) }}</text>
          <polygon :points="areaPoints(growthData, growthMax)" fill="rgba(59,130,246,0.08)"/>
          <polyline :points="linePoints(growthData, growthMax)" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
          <circle v-for="(d,i) in growthData" :key="i" :cx="dotX(i,growthData.length)" :cy="dotY(d.value,growthMax)" r="4" fill="#3b82f6" stroke="white" stroke-width="2"/>
          <text v-for="(d,i) in growthData" :key="i" :x="dotX(i,growthData.length)" :y="chartH-6" text-anchor="middle" font-size="11" fill="#6b7280" font-family="Manrope,sans-serif">{{ d.month }}</text>
        </svg>
      </div>

      <!-- New vs Churned bar -->
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
        <p style="font-size:18px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin:0">New vs Churned</p>
        <p style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif;margin:4px 0 12px">Monthly customer acquisition and churn</p>
        <div style="display:flex;gap:16px;margin-bottom:12px">
          <div style="display:flex;align-items:center;gap:6px"><div style="width:10px;height:10px;border-radius:3px;background:#22c55e"></div><span style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">New</span></div>
          <div style="display:flex;align-items:center;gap:6px"><div style="width:10px;height:10px;border-radius:3px;background:#ef4444"></div><span style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">Churned</span></div>
        </div>
        <svg :width="chartW" :height="chartH" style="overflow:visible;width:100%;height:auto">
          <line v-for="i in 5" :key="i" :x1="padL" :x2="chartW-padR" :y1="padT+(innerH/4)*(i-1)" :y2="padT+(innerH/4)*(i-1)" stroke="#f0f0f0" stroke-width="1"/>
          <text v-for="l in yLabels(nvcMax)" :key="l.val" :x="padL-8" :y="l.y" text-anchor="end" font-size="11" fill="#6b7280" font-family="Manrope,sans-serif">{{ l.val }}</text>
          <!-- New bars (left half) -->
          <rect v-for="(d,i) in newVsChurned" :key="`n${i}`"
            :x="barX(i,newVsChurned.length)" :y="barY(d.newC,nvcMax)"
            :width="barW(newVsChurned.length)/2-2" :height="barH(d.newC,nvcMax)"
            rx="4" fill="#22c55e"/>
          <!-- Churned bars (right half) -->
          <rect v-for="(d,i) in newVsChurned" :key="`c${i}`"
            :x="barX(i,newVsChurned.length)+barW(newVsChurned.length)/2+2" :y="barY(d.churned,nvcMax)"
            :width="barW(newVsChurned.length)/2-2" :height="barH(d.churned,nvcMax)"
            rx="4" fill="#ef4444"/>
          <text v-for="(d,i) in newVsChurned" :key="i" :x="barX(i,newVsChurned.length)+barW(newVsChurned.length)/2" :y="chartH-6" text-anchor="middle" font-size="11" fill="#6b7280" font-family="Manrope,sans-serif">{{ d.month }}</text>
        </svg>
      </div>
    </div>

    <!-- Plan distribution + Payment status -->
    <div style="display:grid;grid-template-columns:220px 1fr;gap:24px">

      <!-- Plan donut -->
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
        <p style="font-size:16px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin:0 0 16px">Plan Split</p>
        <div style="display:flex;flex-direction:column;align-items:center;gap:16px">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="40" fill="none" stroke="#e5e7eb" stroke-width="18"/>
            <circle v-for="(s,i) in donutSlices" :key="i"
              cx="60" cy="60" r="40" fill="none"
              :stroke="s.color" stroke-width="18"
              :stroke-dasharray="`${s.dash} ${s.gap}`"
              :stroke-dashoffset="`${circumference/4 - s.offset}`"
              style="transform-origin:center;transform:rotate(-90deg)"
            />
          </svg>
          <div style="width:100%;display:flex;flex-direction:column;gap:8px">
            <div v-for="p in plans" :key="p.label" style="display:flex;align-items:center;justify-content:space-between">
              <div style="display:flex;align-items:center;gap:6px">
                <div :style="`width:8px;height:8px;border-radius:50%;background:${p.color}`"></div>
                <span style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">{{ p.label }}</span>
              </div>
              <div style="text-align:right">
                <span :style="`font-size:13px;font-weight:600;color:${p.color};font-family:'Manrope',sans-serif`">{{ p.pct }}%</span>
                <span style="font-size:11px;color:#9ca3af;font-family:'Manrope',sans-serif;margin-left:4px">{{ p.count }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment status -->
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
        <p style="font-size:16px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin:0 0 20px">Payment Status</p>
        <div style="display:flex;flex-direction:column;gap:16px">
          <div v-for="p in paymentStatus" :key="p.label">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px">
              <span style="font-size:14px;color:#374151;font-family:'Manrope',sans-serif">{{ p.label }}</span>
              <div style="display:flex;align-items:center;gap:8px">
                <span style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif">{{ p.value.toLocaleString() }}</span>
                <span :style="`font-size:13px;font-weight:600;font-family:'Manrope',sans-serif;color:${p.color}`">{{ p.pct }}%</span>
              </div>
            </div>
            <div style="height:10px;background:#f0f0f0;border-radius:999px;overflow:hidden">
              <div :style="`height:10px;background:${p.color};border-radius:999px;width:${p.pct}%`"></div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Top customers table -->
    <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
      <p style="font-size:18px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin:0 0 16px">Top Customers</p>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f8f9fa;border-bottom:1px solid #e5e7eb">
            <th style="padding:12px 16px;text-align:left;font-size:13px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Customer</th>
            <th style="padding:12px 16px;text-align:left;font-size:13px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">ID</th>
            <th style="padding:12px 16px;text-align:left;font-size:13px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Plan</th>
            <th style="padding:12px 16px;text-align:right;font-size:13px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Pickups</th>
            <th style="padding:12px 16px;text-align:right;font-size:13px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Total Paid</th>
            <th style="padding:12px 16px;text-align:left;font-size:13px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(c,i) in topCustomers" :key="c.id"
            :style="`border-bottom:${i<topCustomers.length-1?'1px solid #e5e7eb':'none'}`"
            @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
          >
            <td style="padding:14px 16px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">{{ c.name }}</td>
            <td style="padding:14px 16px;font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif">{{ c.id }}</td>
            <td style="padding:14px 16px">
              <span :style="`font-size:12px;font-weight:500;border-radius:20px;padding:3px 10px;font-family:'Manrope',sans-serif;${planBadge(c.plan)}`">{{ c.plan === 'subscription' ? 'Subscription' : 'PAYG' }}</span>
            </td>
            <td style="padding:14px 16px;font-size:14px;color:#111;font-family:'Manrope',sans-serif;text-align:right">{{ c.pickups }}</td>
            <td style="padding:14px 16px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;text-align:right">{{ c.paid }}</td>
            <td style="padding:14px 16px">
              <span style="font-size:12px;font-weight:500;border-radius:20px;padding:3px 10px;color:#22c55e;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.2);font-family:'Manrope',sans-serif">active</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>
