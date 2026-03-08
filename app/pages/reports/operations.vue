<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

// Chart helpers (shared)
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
  { icon: 'i-lucide-package',      iconBg: '#fff9e6', iconColor: '#ffb400', label: 'Total Pickups (Month)', value: '1,842', sub: '+8.2% vs last month', subColor: '#22c55e' },
  { icon: 'i-lucide-check-circle', iconBg: '#f0fdf4', iconColor: '#22c55e', label: 'Completion Rate',        value: '94.6%', sub: '87 missed this month',  subColor: '#ef4444' },
  { icon: 'i-lucide-truck',        iconBg: '#eff6ff', iconColor: '#3b82f6', label: 'Active Trucks',          value: '18',    sub: '3 in maintenance',       subColor: '#d49a00' },
  { icon: 'i-lucide-clock',        iconBg: '#fdf4ff', iconColor: '#a855f7', label: 'Avg Pickup Time',        value: '12 min', sub: '-2 min vs last month', subColor: '#22c55e' },
]

// Pickup volume by month (bar)
const pickupVolume = [
  { month: 'Jan', value: 1420 }, { month: 'Feb', value: 1580 }, { month: 'Mar', value: 1390 },
  { month: 'Apr', value: 1720 }, { month: 'May', value: 1650 }, { month: 'Jun', value: 1842 },
]
const pickupMax = Math.max(...pickupVolume.map(d => d.value))

// Completion rate trend (line)
const completionRate = [
  { month: 'Jan', value: 91 }, { month: 'Feb', value: 93 }, { month: 'Mar', value: 89 },
  { month: 'Apr', value: 95 }, { month: 'May', value: 94 }, { month: 'Jun', value: 95 },
]
const completionMax = 100

// Driver performance table
const drivers = [
  { name: 'John Smith',    pickups: 312, completion: 97, avgTime: '11 min', zone: 'Downtown',  status: 'active' },
  { name: 'Maria Garcia',  pickups: 298, completion: 95, avgTime: '13 min', zone: 'Westside',  status: 'active' },
  { name: 'James Wilson',  pickups: 276, completion: 91, avgTime: '14 min', zone: 'Eastside',  status: 'active' },
  { name: 'Lisa Anderson', pickups: 261, completion: 93, avgTime: '12 min', zone: 'Northside', status: 'active' },
  { name: 'Carlos Reyes',  pickups: 244, completion: 88, avgTime: '15 min', zone: 'Southside', status: 'maintenance' },
]


</script>

<template>
  <div style="display:flex;flex-direction:column;gap:28px">

    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between">
      <div>
        <h1 style="font-size:32px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;line-height:1.3;margin:0">Operations Analytics</h1>
        <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:8px;margin-bottom:0">Pickup performance, driver efficiency and zone metrics</p>
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

      <!-- Pickup Volume bar -->
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
        <p style="font-size:18px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin:0">Pickup Volume</p>
        <p style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif;margin:4px 0 16px">Monthly pickups completed</p>
        <svg :width="chartW" :height="chartH" style="overflow:visible;width:100%;height:auto">
          <line v-for="i in 5" :key="i" :x1="padL" :x2="chartW-padR" :y1="padT+(innerH/4)*(i-1)" :y2="padT+(innerH/4)*(i-1)" stroke="#f0f0f0" stroke-width="1"/>
          <text v-for="l in yLabels(pickupMax)" :key="l.val" :x="padL-8" :y="l.y" text-anchor="end" font-size="11" fill="#6b7280" font-family="Manrope,sans-serif">{{ fmtY(l.val) }}</text>
          <rect v-for="(d,i) in pickupVolume" :key="i" :x="barX(i,pickupVolume.length)" :y="barY(d.value,pickupMax)" :width="barW(pickupVolume.length)" :height="barH(d.value,pickupMax)" rx="6" fill="#ffb400"/>
          <text v-for="(d,i) in pickupVolume" :key="i" :x="barX(i,pickupVolume.length)+barW(pickupVolume.length)/2" :y="chartH-6" text-anchor="middle" font-size="11" fill="#6b7280" font-family="Manrope,sans-serif">{{ d.month }}</text>
        </svg>
      </div>

      <!-- Completion Rate line -->
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
        <p style="font-size:18px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin:0">Completion Rate</p>
        <p style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif;margin:4px 0 16px">Monthly pickup completion %</p>
        <svg :width="chartW" :height="chartH" style="overflow:visible;width:100%;height:auto">
          <line v-for="i in 5" :key="i" :x1="padL" :x2="chartW-padR" :y1="padT+(innerH/4)*(i-1)" :y2="padT+(innerH/4)*(i-1)" stroke="#f0f0f0" stroke-width="1"/>
          <text v-for="l in yLabels(completionMax)" :key="l.val" :x="padL-8" :y="l.y" text-anchor="end" font-size="11" fill="#6b7280" font-family="Manrope,sans-serif">{{ l.val }}%</text>
          <polygon :points="areaPoints(completionRate, completionMax)" fill="rgba(34,197,94,0.08)"/>
          <polyline :points="linePoints(completionRate, completionMax)" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
          <circle v-for="(d,i) in completionRate" :key="i" :cx="dotX(i,completionRate.length)" :cy="dotY(d.value,completionMax)" r="4" fill="#22c55e" stroke="white" stroke-width="2"/>
          <text v-for="(d,i) in completionRate" :key="i" :x="dotX(i,completionRate.length)" :y="chartH-6" text-anchor="middle" font-size="11" fill="#6b7280" font-family="Manrope,sans-serif">{{ d.month }}</text>
        </svg>
      </div>
    </div>

    <!-- Driver performance -->
    <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
        <p style="font-size:18px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin:0 0 16px">Driver Performance</p>
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:#f8f9fa;border-bottom:1px solid #e5e7eb">
              <th style="padding:12px 14px;text-align:left;font-size:13px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Driver</th>
              <th style="padding:12px 14px;text-align:left;font-size:13px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Zone</th>
              <th style="padding:12px 14px;text-align:right;font-size:13px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Pickups</th>
              <th style="padding:12px 14px;text-align:right;font-size:13px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Completion</th>
              <th style="padding:12px 14px;text-align:right;font-size:13px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Avg Time</th>
              <th style="padding:12px 14px;text-align:left;font-size:13px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(d,i) in drivers" :key="d.name" :style="`border-bottom:${i<drivers.length-1?'1px solid #e5e7eb':'none'}`"
              @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
              @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
            >
              <td style="padding:14px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">{{ d.name }}</td>
              <td style="padding:14px;font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif">{{ d.zone }}</td>
              <td style="padding:14px;font-size:14px;color:#111;font-family:'Manrope',sans-serif;text-align:right">{{ d.pickups }}</td>
              <td style="padding:14px;text-align:right">
                <span :style="`font-size:13px;font-weight:600;font-family:'Manrope',sans-serif;color:${d.completion>=95?'#22c55e':d.completion>=90?'#d49a00':'#ef4444'}`">{{ d.completion }}%</span>
              </td>
              <td style="padding:14px;font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif;text-align:right">{{ d.avgTime }}</td>
              <td style="padding:14px">
                <span :style="`font-size:12px;font-weight:500;border-radius:20px;padding:3px 10px;font-family:'Manrope',sans-serif;${d.status==='active'?'color:#22c55e;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.2)':'color:#d49a00;background:rgba(255,180,0,0.1);border:1px solid rgba(255,180,0,0.2)'}`">{{ d.status }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

  </div>
</template>
