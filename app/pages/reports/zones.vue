<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const { format } = useCurrency()

// ── Chart helpers ──
const chartW = 478, chartH = 240
const padL = 52, padB = 30, padT = 10, padR = 10
const innerW = chartW - padL - padR
const innerH = chartH - padT - padB

function barX(i: number, len: number) { return padL + (i / len) * innerW + 4 }
function barW(len: number) { return (innerW / len) - 8 }
function barY(v: number, max: number) { return padT + innerH - (v / max) * innerH }
function barH(v: number, max: number) { return (v / max) * innerH }
function yLabels(max: number, steps = 4) {
  return Array.from({ length: steps + 1 }, (_, i) => ({ val: Math.round((max / steps) * (steps - i)), y: padT + (innerH / steps) * i + 4 }))
}
function fmtY(v: number) { return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v) }

function linePoints(data: number[], minVal: number, maxVal: number) {
  const range = maxVal - minVal
  return data.map((v, i) => `${padL + (i / (data.length - 1)) * innerW},${padT + innerH - ((v - minVal) / range) * innerH}`).join(' ')
}
function areaPoints(data: number[], minVal: number, maxVal: number) {
  const range = maxVal - minVal
  const pts = data.map((v, i) => `${padL + (i / (data.length - 1)) * innerW},${padT + innerH - ((v - minVal) / range) * innerH}`)
  const fx = pts[0]!.split(',')[0], lx = pts[pts.length - 1]!.split(',')[0]
  return `${pts.join(' ')} ${lx},${padT + innerH} ${fx},${padT + innerH}`
}
function dotX(i: number, len: number) { return padL + (i / (len - 1)) * innerW }
function dotY(v: number, minVal: number, maxVal: number) { return padT + innerH - ((v - minVal) / (maxVal - minVal)) * innerH }
function yLabelsRange(minVal: number, maxVal: number, steps = 4) {
  return Array.from({ length: steps + 1 }, (_, i) => ({
    val: Math.round(minVal + ((maxVal - minVal) / steps) * (steps - i)),
    y: padT + (innerH / steps) * i + 4
  }))
}

// ── Period filter ──
const period = ref<'week' | 'month' | 'quarter'>('month')

// ── Zone data ──
const zones = [
  { name: 'Zone A – Central',   color: '#3b82f6', customers: 87,  pickups: 412, completion: 97, revenue: 10300, drivers: 3, missedPickups: 13 },
  { name: 'Zone B – Westside',  color: '#22c55e', customers: 64,  pickups: 298, completion: 94, revenue: 7450,  drivers: 2, missedPickups: 18 },
  { name: 'Zone C – Eastside',  color: '#f97316', customers: 112, pickups: 534, completion: 91, revenue: 13350, drivers: 4, missedPickups: 53 },
  { name: 'Zone D – Northside', color: '#8b5cf6', customers: 43,  pickups: 201, completion: 96, revenue: 5025,  drivers: 2, missedPickups: 8  },
  { name: 'Zone E – Southside', color: '#ec4899', customers: 28,  pickups: 124, completion: 88, revenue: 3100,  drivers: 1, missedPickups: 17 },
]

const totalPickups  = computed(() => zones.reduce((s, z) => s + z.pickups, 0))
const totalRevenue  = computed(() => zones.reduce((s, z) => s + z.revenue, 0))
const avgCompletion = computed(() => Math.round(zones.reduce((s, z) => s + z.completion, 0) / zones.length))
const totalCustomers = computed(() => zones.reduce((s, z) => s + z.customers, 0))

const pickupMax = Math.max(...zones.map(z => z.pickups))
const revenueMax = Math.max(...zones.map(z => z.revenue))

// ── Completion trend (monthly, per zone) ──
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
const completionTrends: Record<string, number[]> = {
  'Zone A – Central':   [94, 95, 96, 97, 96, 97],
  'Zone B – Westside':  [91, 92, 93, 94, 93, 94],
  'Zone C – Eastside':  [88, 89, 90, 91, 90, 91],
  'Zone D – Northside': [93, 94, 95, 96, 95, 96],
  'Zone E – Southside': [85, 86, 87, 88, 87, 88],
}

const selectedZone = ref(zones[0]!.name)
const trendData = computed(() => completionTrends[selectedZone.value] ?? [])

function completionColor(v: number) {
  if (v >= 95) return '#22c55e'
  if (v >= 90) return '#d49a00'
  return '#ef4444'
}
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:28px;font-family:'Manrope',sans-serif">

    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
      <div>
        <h1 style="font-size:32px;font-weight:700;color:#111;margin:0;line-height:1.3">Zone Performance</h1>
        <p style="font-size:14px;color:#6b7280;margin:8px 0 0">Pickup efficiency, revenue and coverage by zone</p>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <!-- Period toggle -->
        <div style="display:flex;gap:2px;background:#f3f4f6;border-radius:10px;padding:3px">
          <button v-for="p in (['week','month','quarter'] as const)" :key="p" @click="period=p"
            :style="`padding:6px 14px;border:none;border-radius:8px;font-size:13px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer;transition:all 0.15s;${period===p ? 'background:#fff;color:#1a1a1a;box-shadow:0 1px 3px rgba(0,0,0,0.1)' : 'background:transparent;color:#6b7280'}`">
            {{ p.charAt(0).toUpperCase() + p.slice(1) }}
          </button>
        </div>
        <button style="height:38px;padding:0 16px;background:#ececec;border:none;border-radius:10px;font-size:13px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;cursor:pointer;display:flex;align-items:center;gap:6px">
          <Icon name="lucide:download" style="width:15px;height:15px" />
          Export
        </button>
      </div>
    </div>

    <!-- Summary stats -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px">
      <div v-for="s in [
        { icon: 'lucide:map-pin',     iconBg: '#eff6ff', iconColor: '#3b82f6', label: 'Active Zones',      value: zones.length,              sub: 'all operational' },
        { icon: 'lucide:users',       iconBg: '#f0fdf4', iconColor: '#22c55e', label: 'Total Customers',   value: totalCustomers,            sub: 'across all zones' },
        { icon: 'lucide:package',     iconBg: '#fff9e6', iconColor: '#ffb400', label: 'Total Pickups',     value: totalPickups.toLocaleString(), sub: 'this period' },
        { icon: 'lucide:trending-up', iconBg: '#fdf4ff', iconColor: '#a855f7', label: 'Avg Completion',    value: avgCompletion + '%',       sub: 'across all zones' },
      ]" :key="s.label" style="background:white;border:1px solid #ececec;border-radius:16px;padding:20px 22px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
          <div :style="`width:38px;height:38px;background:${s.iconBg};border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0`">
            <Icon :name="s.icon" :style="`width:18px;height:18px;color:${s.iconColor}`" />
          </div>
          <span style="font-size:13px;color:#6b7280">{{ s.label }}</span>
        </div>
        <p style="font-size:26px;font-weight:700;color:#111;margin:0 0 4px">{{ s.value }}</p>
        <p style="font-size:12px;color:#9ca3af;margin:0">{{ s.sub }}</p>
      </div>
    </div>

    <!-- Charts row -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">

      <!-- Pickups by zone bar -->
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
        <p style="font-size:16px;font-weight:600;color:#111;margin:0">Pickups by Zone</p>
        <p style="font-size:13px;color:#6b7280;margin:4px 0 16px">Total pickups completed per zone</p>
        <svg :width="chartW" :height="chartH" style="overflow:visible;width:100%;height:auto">
          <line v-for="i in 5" :key="i" :x1="padL" :x2="chartW-padR" :y1="padT+(innerH/4)*(i-1)" :y2="padT+(innerH/4)*(i-1)" stroke="#f0f0f0" stroke-width="1"/>
          <text v-for="l in yLabels(pickupMax)" :key="l.val" :x="padL-8" :y="l.y" text-anchor="end" font-size="11" fill="#6b7280" font-family="Manrope,sans-serif">{{ fmtY(l.val) }}</text>
          <rect v-for="(z,i) in zones" :key="z.name"
            :x="barX(i,zones.length)" :y="barY(z.pickups,pickupMax)"
            :width="barW(zones.length)" :height="barH(z.pickups,pickupMax)"
            rx="6" :fill="z.color" />
          <text v-for="(z,i) in zones" :key="z.name"
            :x="barX(i,zones.length)+barW(zones.length)/2" :y="chartH-6"
            text-anchor="middle" font-size="10" fill="#6b7280" font-family="Manrope,sans-serif">
            {{ z.name.split('–')[0]!.trim() }}
          </text>
        </svg>
      </div>

      <!-- Revenue by zone bar -->
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
        <p style="font-size:16px;font-weight:600;color:#111;margin:0">Revenue by Zone</p>
        <p style="font-size:13px;color:#6b7280;margin:4px 0 16px">Estimated revenue per zone (GHS)</p>
        <svg :width="chartW" :height="chartH" style="overflow:visible;width:100%;height:auto">
          <line v-for="i in 5" :key="i" :x1="padL" :x2="chartW-padR" :y1="padT+(innerH/4)*(i-1)" :y2="padT+(innerH/4)*(i-1)" stroke="#f0f0f0" stroke-width="1"/>
          <text v-for="l in yLabels(revenueMax)" :key="l.val" :x="padL-8" :y="l.y" text-anchor="end" font-size="11" fill="#6b7280" font-family="Manrope,sans-serif">{{ fmtY(l.val) }}</text>
          <rect v-for="(z,i) in zones" :key="z.name"
            :x="barX(i,zones.length)" :y="barY(z.revenue,revenueMax)"
            :width="barW(zones.length)" :height="barH(z.revenue,revenueMax)"
            rx="6" fill="#ffb400" />
          <text v-for="(z,i) in zones" :key="z.name"
            :x="barX(i,zones.length)+barW(zones.length)/2" :y="chartH-6"
            text-anchor="middle" font-size="10" fill="#6b7280" font-family="Manrope,sans-serif">
            {{ z.name.split('–')[0]!.trim() }}
          </text>
        </svg>
      </div>
    </div>

    <!-- Completion trend line -->
    <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:16px">
        <div>
          <p style="font-size:16px;font-weight:600;color:#111;margin:0">Completion Rate Trend</p>
          <p style="font-size:13px;color:#6b7280;margin:4px 0 0">Monthly completion % for selected zone</p>
        </div>
        <div style="position:relative">
          <select v-model="selectedZone" style="height:36px;padding:0 32px 0 12px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:13px;font-family:'Manrope',sans-serif;color:#1a1a1a;outline:none;background:#fff;cursor:pointer;appearance:none">
            <option v-for="z in zones" :key="z.name" :value="z.name">{{ z.name }}</option>
          </select>
          <Icon name="lucide:chevron-down" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);width:13px;height:13px;color:#6b7280;pointer-events:none" />
        </div>
      </div>
      <svg :width="chartW" :height="chartH" style="overflow:visible;width:100%;height:auto">
        <line v-for="i in 5" :key="i" :x1="padL" :x2="chartW-padR" :y1="padT+(innerH/4)*(i-1)" :y2="padT+(innerH/4)*(i-1)" stroke="#f0f0f0" stroke-width="1"/>
        <text v-for="l in yLabelsRange(80, 100)" :key="l.val" :x="padL-8" :y="l.y" text-anchor="end" font-size="11" fill="#6b7280" font-family="Manrope,sans-serif">{{ l.val }}%</text>
        <polygon :points="areaPoints(trendData, 80, 100)" fill="rgba(59,130,246,0.08)"/>
        <polyline :points="linePoints(trendData, 80, 100)" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
        <circle v-for="(v,i) in trendData" :key="i" :cx="dotX(i,trendData.length)" :cy="dotY(v,80,100)" r="4" fill="#3b82f6" stroke="white" stroke-width="2"/>
        <text v-for="(v,i) in trendData" :key="`lbl-${i}`" :x="dotX(i,trendData.length)" :y="dotY(v,80,100)-10" text-anchor="middle" font-size="11" font-weight="600" fill="#3b82f6" font-family="Manrope,sans-serif">{{ v }}%</text>
        <text v-for="(m,i) in months" :key="m" :x="dotX(i,months.length)" :y="chartH-6" text-anchor="middle" font-size="11" fill="#6b7280" font-family="Manrope,sans-serif">{{ m }}</text>
      </svg>
    </div>

    <!-- Zone breakdown table -->
    <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
      <p style="font-size:16px;font-weight:600;color:#111;margin:0 0 16px">Zone Breakdown</p>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f8f9fa;border-bottom:1px solid #e5e7eb">
            <th style="padding:12px 16px;text-align:left;font-size:13px;font-weight:600;color:#374151">Zone</th>
            <th style="padding:12px 16px;text-align:right;font-size:13px;font-weight:600;color:#374151">Customers</th>
            <th style="padding:12px 16px;text-align:right;font-size:13px;font-weight:600;color:#374151">Pickups</th>
            <th style="padding:12px 16px;text-align:right;font-size:13px;font-weight:600;color:#374151">Missed</th>
            <th style="padding:12px 16px;text-align:right;font-size:13px;font-weight:600;color:#374151">Completion</th>
            <th style="padding:12px 16px;text-align:right;font-size:13px;font-weight:600;color:#374151">Revenue</th>
            <th style="padding:12px 16px;text-align:right;font-size:13px;font-weight:600;color:#374151">Drivers</th>
            <th style="padding:12px 16px;text-align:left;font-size:13px;font-weight:600;color:#374151">Performance</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(z, i) in zones" :key="z.name"
            :style="`border-bottom:${i < zones.length - 1 ? '1px solid #f0f0f0' : 'none'}`"
            @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'">
            <!-- Zone name -->
            <td style="padding:14px 16px">
              <div style="display:flex;align-items:center;gap:10px">
                <span :style="`width:10px;height:10px;border-radius:50%;background:${z.color};flex-shrink:0;display:inline-block`"></span>
                <span style="font-size:14px;font-weight:600;color:#1a1a1a">{{ z.name }}</span>
              </div>
            </td>
            <td style="padding:14px 16px;text-align:right;font-size:14px;color:#374151">{{ z.customers }}</td>
            <td style="padding:14px 16px;text-align:right;font-size:14px;font-weight:600;color:#1a1a1a">{{ z.pickups }}</td>
            <td style="padding:14px 16px;text-align:right">
              <span :style="`font-size:13px;font-weight:600;color:${z.missedPickups > 20 ? '#ef4444' : z.missedPickups > 10 ? '#d49a00' : '#22c55e'}`">{{ z.missedPickups }}</span>
            </td>
            <td style="padding:14px 16px;text-align:right">
              <span :style="`font-size:13px;font-weight:700;color:${completionColor(z.completion)}`">{{ z.completion }}%</span>
            </td>
            <td style="padding:14px 16px;text-align:right;font-size:14px;font-weight:600;color:#1a1a1a">{{ format(z.revenue) }}</td>
            <td style="padding:14px 16px;text-align:right;font-size:14px;color:#374151">{{ z.drivers }}</td>
            <!-- Progress bar -->
            <td style="padding:14px 16px;min-width:120px">
              <div style="display:flex;align-items:center;gap:8px">
                <div style="flex:1;height:6px;background:#f0f0f0;border-radius:3px;overflow:hidden">
                  <div :style="`height:100%;border-radius:3px;background:${completionColor(z.completion)};width:${z.completion}%`"></div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>
