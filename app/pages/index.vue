<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const stats = [
  { label: 'Active Customers', value: '2,847', change: '+12.5%', positive: true, icon: 'i-lucide-users' },
  { label: 'Drivers on Duty',  value: '48',    change: '94% active', positive: null, icon: 'i-lucide-truck' },
  { label: "Today's Pickups",  value: '342',   change: '+8.2%', positive: true, icon: 'i-lucide-package' },
  { label: 'Outstanding Payments', value: 'GHS 12,480', change: '-5.3%', positive: false, icon: 'i-lucide-credit-card' },
  { label: 'Revenue This Month',   value: 'GHS 84,230', change: '+18.4%', positive: true, icon: 'i-lucide-bar-chart-2' },
  { label: 'Shop Orders Today',    value: '67',         change: '+23.1%', positive: true, icon: 'i-lucide-shopping-bag' },
]

const revenueData = [
  { month: 'Jan', value: 62000 },
  { month: 'Feb', value: 48000 },
  { month: 'Mar', value: 71000 },
  { month: 'Apr', value: 55000 },
  { month: 'May', value: 84230 },
  { month: 'Jun', value: 78000 },
]

const pickupData = [
  { day: 'Mon', value: 220 },
  { day: 'Tue', value: 280 },
  { day: 'Wed', value: 260 },
  { day: 'Thu', value: 342 },
  { day: 'Fri', value: 310 },
  { day: 'Sat', value: 120 },
  { day: 'Sun', value: 80 },
]

const activities = [
  { text: 'Pickup completed - Johnson Residence', time: '5 minutes ago', badge: 'success', badgeColor: '#22c55e', badgeBg: 'rgba(34,197,94,0.1)', badgeBorder: 'rgba(34,197,94,0.2)' },
  { text: 'Payment received - GHS 245 from Sarah Chen', time: '12 minutes ago', badge: 'success', badgeColor: '#22c55e', badgeBg: 'rgba(34,197,94,0.1)', badgeBorder: 'rgba(34,197,94,0.2)' },
  { text: 'New shop order - 2x Waste Bins', time: '18 minutes ago', badge: 'info', badgeColor: '#3b82f6', badgeBg: 'rgba(59,130,246,0.1)', badgeBorder: 'rgba(59,130,246,0.2)' },
  { text: 'Low stock alert - Bin Bags (15 units left)', time: '23 minutes ago', badge: 'warning', badgeColor: '#d49a00', badgeBg: 'rgba(255,180,0,0.1)', badgeBorder: 'rgba(255,180,0,0.2)' },
  { text: 'Route completed - Driver #24 (34 stops)', time: '45 minutes ago', badge: 'success', badgeColor: '#22c55e', badgeBg: 'rgba(34,197,94,0.1)', badgeBorder: 'rgba(34,197,94,0.2)' },
]

const pendingPickups = [
  { name: 'Sarah Johnson', address: '123 Oak Street', date: '2026-03-03', type: 'subscription', typeBg: 'rgba(59,130,246,0.1)', typeBorder: 'rgba(59,130,246,0.2)', typeColor: '#3b82f6', unpaid: false },
  { name: 'Emma Williams', address: '789 Pine Road', date: '2026-03-04', type: 'one-time', typeBg: '#e5e7eb', typeBorder: '#e5e7eb', typeColor: '#6b7280', unpaid: true },
  { name: 'James Martinez', address: '321 Birch Lane', date: '2026-03-03', type: 'subscription', typeBg: 'rgba(59,130,246,0.1)', typeBorder: 'rgba(59,130,246,0.2)', typeColor: '#3b82f6', unpaid: false },
]

const trucks = [
  { id: 'T-001', driver: 'John Smith',    zone: 'Downtown', eta: '12 min' },
  { id: 'T-003', driver: 'Maria Garcia',  zone: 'Westside',  eta: '8 min' },
  { id: 'T-007', driver: 'James Wilson',  zone: 'Eastside',  eta: '25 min' },
  { id: 'T-012', driver: 'Lisa Anderson', zone: 'Northside', eta: '15 min' },
]

// Chart helpers
const revenueMax = Math.max(...revenueData.map(d => d.value))
const pickupMax  = Math.max(...pickupData.map(d => d.value))
const chartW = 478
const chartH = 260
const padL = 50, padB = 30, padT = 10, padR = 10
const innerW = chartW - padL - padR
const innerH = chartH - padT - padB

function revenuePoints() {
  return revenueData.map((d, i) => {
    const x = padL + (i / (revenueData.length - 1)) * innerW
    const y = padT + innerH - (d.value / revenueMax) * innerH
    return `${x},${y}`
  }).join(' ')
}

function revenueArea() {
  const pts = revenueData.map((d, i) => {
    const x = padL + (i / (revenueData.length - 1)) * innerW
    const y = padT + innerH - (d.value / revenueMax) * innerH
    return `${x},${y}`
  })
  const first = pts[0]!.split(',')
  const last  = pts[pts.length - 1]!.split(',')
  return `${pts.join(' ')} ${last[0]},${padT + innerH} ${first[0]},${padT + innerH}`
}

function barX(i: number) { return padL + (i / pickupData.length) * innerW + 10 }
function barW() { return (innerW / pickupData.length) - 14 }
function barY(v: number) { return padT + innerH - (v / pickupMax) * innerH }
function barH(v: number) { return (v / pickupMax) * innerH }
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:24px">
    <!-- Page heading -->
    <div>
      <h1 style="font-size:32px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;line-height:1.3">Admin Dashboard</h1>
      <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:4px">Welcome back! Here's what's happening today.</p>
    </div>

    <!-- Stat cards -->
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">
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
          <p style="position:absolute;top:64px;left:24px;font-size:14px;font-weight:400;color:#6b7280;font-family:'Manrope',sans-serif;line-height:20px;white-space:nowrap">
            {{ stat.label }}
          </p>
          <!-- Value -->
          <p style="position:absolute;top:88px;left:24px;font-size:24px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif;line-height:32px;white-space:nowrap">
            {{ stat.value }}
          </p>
        </div>
      </div>
    </div>

    <!-- Charts row -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
      <!-- Revenue chart -->
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Revenue Overview</p>
        <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:4px;margin-bottom:16px">Monthly revenue for the past 6 months</p>
        <svg :width="chartW" :height="chartH" style="overflow:visible;width:100%;height:auto">
          <!-- Grid lines -->
          <line v-for="i in 4" :key="i" :x1="padL" :x2="chartW - padR" :y1="padT + (innerH / 4) * (i-1)" :y2="padT + (innerH / 4) * (i-1)" stroke="#f0f0f0" stroke-width="1" />
          <!-- Y labels -->
          <text v-for="i in 5" :key="i" :x="padL - 8" :y="padT + (innerH / 4) * (i-1) + 4" text-anchor="end" font-size="11" fill="#6b7280" font-family="Manrope,sans-serif">
            {{ Math.round(revenueMax - (revenueMax / 4) * (i-1) / 1000) }}k
          </text>
          <!-- Area fill -->
          <polygon :points="revenueArea()" fill="rgba(255,180,0,0.08)" />
          <!-- Line -->
          <polyline :points="revenuePoints()" fill="none" stroke="#ffb400" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
          <!-- Dots -->
          <circle v-for="(d, i) in revenueData" :key="i"
            :cx="padL + (i / (revenueData.length - 1)) * innerW"
            :cy="padT + innerH - (d.value / revenueMax) * innerH"
            r="4" fill="#ffb400" stroke="white" stroke-width="2"
          />
          <!-- X labels -->
          <text v-for="(d, i) in revenueData" :key="i"
            :x="padL + (i / (revenueData.length - 1)) * innerW"
            :y="chartH - 6"
            text-anchor="middle" font-size="11" fill="#6b7280" font-family="Manrope,sans-serif"
          >{{ d.month }}</text>
        </svg>
      </div>

      <!-- Pickup bar chart -->
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Pickup Volume</p>
        <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:4px;margin-bottom:16px">Daily pickups for this week</p>
        <svg :width="chartW" :height="chartH" style="overflow:visible;width:100%;height:auto">
          <!-- Grid lines -->
          <line v-for="i in 4" :key="i" :x1="padL" :x2="chartW - padR" :y1="padT + (innerH / 4) * (i-1)" :y2="padT + (innerH / 4) * (i-1)" stroke="#f0f0f0" stroke-width="1" />
          <!-- Y labels -->
          <text v-for="i in 5" :key="i" :x="padL - 8" :y="padT + (innerH / 4) * (i-1) + 4" text-anchor="end" font-size="11" fill="#6b7280" font-family="Manrope,sans-serif">
            {{ Math.round(pickupMax - (pickupMax / 4) * (i-1)) }}
          </text>
          <!-- Bars -->
          <rect v-for="(d, i) in pickupData" :key="i"
            :x="barX(i)" :y="barY(d.value)" :width="barW()" :height="barH(d.value)"
            rx="6" :fill="d.day === 'Thu' ? '#ffb400' : 'rgba(255,180,0,0.25)'"
          />
          <!-- X labels -->
          <text v-for="(d, i) in pickupData" :key="i"
            :x="barX(i) + barW() / 2" :y="chartH - 6"
            text-anchor="middle" font-size="11" fill="#6b7280" font-family="Manrope,sans-serif"
          >{{ d.day }}</text>
        </svg>
      </div>
    </div>

    <!-- Activity + Pending pickups -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
      <!-- Recent activity -->
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin-bottom:16px">Recent Activity</p>
        <div style="display:flex;flex-direction:column;gap:16px">
          <div v-for="(a, i) in activities" :key="i" style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
            <div style="flex:1;min-width:0">
              <p style="font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ a.text }}</p>
              <div style="display:flex;align-items:center;gap:6px;margin-top:4px">
                <UIcon name="i-lucide-clock" style="width:12px;height:12px;color:#6b7280;flex-shrink:0" />
                <span style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">{{ a.time }}</span>
              </div>
            </div>
            <span :style="`flex-shrink:0;font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;color:${a.badgeColor};background:${a.badgeBg};border:1px solid ${a.badgeBorder};border-radius:14px;padding:3px 11px;white-space:nowrap`">
              {{ a.badge }}
            </span>
          </div>
        </div>
      </div>

      <!-- Pending pickup requests -->
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <div style="display:flex;align-items:center;gap:8px">
            <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Pending Pickup Requests</p>
            <span style="font-size:12px;font-weight:500;color:#d49a00;background:rgba(255,180,0,0.1);border:1px solid rgba(255,180,0,0.2);border-radius:14px;padding:3px 11px">3</span>
          </div>
          <a href="/pickups" style="font-size:14px;color:#ffb400;font-family:'Manrope',sans-serif;text-decoration:none">View All</a>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px">
          <div v-for="(p, i) in pendingPickups" :key="i" style="background:#f8f9fa;border-radius:16px;padding:12px;display:flex;gap:12px;align-items:flex-start">
            <div style="width:40px;height:40px;background:#ffb400;border-radius:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <UIcon name="i-lucide-clipboard-list" style="width:20px;height:20px;color:white" />
            </div>
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px">
                <div>
                  <p style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ p.name }}</p>
                  <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">{{ p.address }}</p>
                </div>
                <span :style="`flex-shrink:0;font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;color:${p.typeColor};background:${p.typeBg};border:1px solid ${p.typeBorder};border-radius:14px;padding:3px 11px;white-space:nowrap`">
                  {{ p.type }}
                </span>
              </div>
              <div style="display:flex;align-items:center;gap:12px">
                <span style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">Pickup: {{ p.date }}</span>
                <div v-if="p.unpaid" style="display:flex;align-items:center;gap:4px">
                  <UIcon name="i-lucide-alert-circle" style="width:12px;height:12px;color:#dc2626" />
                  <span style="font-size:12px;color:#dc2626;font-family:'Manrope',sans-serif">Unpaid</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Active trucks -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:25px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin-bottom:16px">Active Trucks</p>
        <div style="display:flex;flex-direction:column;gap:16px">
          <div v-for="truck in trucks" :key="truck.id" style="height:64px;background:#f8f9fa;border-radius:16px;padding:0 12px;display:flex;align-items:center;gap:12px">
            <div style="width:40px;height:40px;background:#22c55e;border-radius:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <UIcon name="i-lucide-truck" style="width:20px;height:20px;color:white" />
            </div>
            <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px">
              <div style="display:flex;align-items:center;gap:8px">
                <span style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ truck.id }}</span>
                <span style="font-size:12px;font-weight:500;color:#22c55e;background:rgba(34,197,94,0.1);border-radius:14px;padding:3px 11px">on-route</span>
              </div>
              <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">{{ truck.driver }}</p>
            </div>
            <div style="display:flex;flex-direction:column;gap:2px;align-items:flex-end">
              <div style="display:flex;align-items:center;gap:4px">
                <UIcon name="i-lucide-map-pin" style="width:12px;height:12px;color:#6b7280" />
                <span style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">{{ truck.zone }}</span>
              </div>
              <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">ETA: {{ truck.eta }}</p>
            </div>
          </div>
        </div>
      </div>
      <!-- Right col intentionally empty -->
      <div></div>
    </div>
  </div>
</template>
