<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const driver = {
  initials: 'JS',
  firstName: 'John',
  lastName: 'Smith',
  email: 'john.smith@lacarte.com',
  phone: '(555) 111-2222',
  truck: 'T-001',
  zone: 'Downtown',
  bins: 2,
  status: 'on-route',
  todayPickups: 12,
  weekPickups: 67,
  completionRate: '98.5%',
  avgTimePerStop: '4.2 min',
  periodEarnings: 'GHS 1,955.00',
  incompleteCount: 3,
  deduction: 'GHS 45',
  completed: 142,
  total: 145,
}

const initials = computed(() => driver.initials)

const statusBadge = computed(() => {
  if (driver.status === 'on-route') return { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)', color: '#22c55e', label: 'On Route' }
  if (driver.status === 'online')   return { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', color: '#3b82f6', label: 'Online' }
  return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280', label: 'Offline' }
})

const activeTab = ref('Current Route')
const tabs = ['Current Route', 'Route History', 'Performance', 'Earnings', 'Assigned Bins']

const routeProgress = { completed: 12, total: 28, estimatedCompletion: '3:30 PM' }
const progressPct = computed(() => Math.round((routeProgress.completed / routeProgress.total) * 100))

const currentRoute = [
  { customer: 'Sarah Johnson',  address: '123 Oak Street',  time: '9:00 AM',  status: 'completed' },
  { customer: 'Michael Chen',   address: '456 Maple Ave',   time: '9:15 AM',  status: 'completed' },
  { customer: 'Emma Williams',  address: '789 Pine Road',   time: '9:30 AM',  status: 'in-progress' },
  { customer: 'James Martinez', address: '321 Birch Lane',  time: '9:45 AM',  status: 'pending' },
  { customer: 'Olivia Brown',   address: '654 Cedar Court', time: '10:00 AM', status: 'pending' },
]

const routeHistory = [
  { date: '2026-03-06', stops: 28, completed: 28, missed: 0, duration: '6h 12m', earnings: 'GHS 420' },
  { date: '2026-03-05', stops: 25, completed: 24, missed: 1, duration: '5h 48m', earnings: 'GHS 360' },
  { date: '2026-03-04', stops: 30, completed: 29, missed: 1, duration: '6h 55m', earnings: 'GHS 435' },
  { date: '2026-03-03', stops: 22, completed: 22, missed: 0, duration: '5h 10m', earnings: 'GHS 330' },
  { date: '2026-03-01', stops: 27, completed: 27, missed: 0, duration: '6h 05m', earnings: 'GHS 405' },
]

const performanceStats = [
  { label: 'Total Pickups (All Time)', value: '1,245' },
  { label: 'Avg Pickups / Day',        value: '24.3' },
  { label: 'On-Time Rate',             value: '96.2%' },
  { label: 'Customer Rating',          value: '4.8 / 5' },
]

const earningsHistory = [
  { period: 'Feb 17 – Mar 2', gross: 'GHS 2,100', deductions: 'GHS 45', net: 'GHS 2,055' },
  { period: 'Feb 3 – Feb 16', gross: 'GHS 1,980', deductions: 'GHS 30', net: 'GHS 1,950' },
  { period: 'Jan 20 – Feb 2', gross: 'GHS 2,040', deductions: 'GHS 60', net: 'GHS 1,980' },
  { period: 'Jan 6 – Jan 19', gross: 'GHS 1,890', deductions: 'GHS 15', net: 'GHS 1,875' },
]

const assignedBins = [
  { type: 'Standard Bin',  size: '120L', customers: 18, status: 'active' },
  { type: 'Recycling Bin', size: '80L',  customers: 12, status: 'active' },
]

function stopBadge(status: string) {
  if (status === 'completed')   return { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.2)',  color: '#22c55e' }
  if (status === 'in-progress') return { bg: 'rgba(255,180,0,0.1)',  border: 'rgba(255,180,0,0.2)',  color: '#d49a00' }
  return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280' }
}
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:21px">

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
            <span style="font-size:24px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ initials }}</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;align-items:center;gap:12px">
              <span style="font-size:24px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">{{ driver.firstName }} {{ driver.lastName }}</span>
              <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;color:${statusBadge.color};background:${statusBadge.bg};border:1px solid ${statusBadge.border};border-radius:14px;padding:3px 11px`">
                {{ statusBadge.label }}
              </span>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:16px">
              <div style="display:flex;align-items:center;gap:8px">
                <UIcon name="i-lucide-phone" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
                <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ driver.phone }}</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <UIcon name="i-lucide-mail" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
                <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ driver.email }}</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <UIcon name="i-lucide-truck" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
                <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Truck {{ driver.truck }}</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <UIcon name="i-lucide-map-pin" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
                <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ driver.zone }} Zone</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <UIcon name="i-lucide-package" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
                <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ driver.bins }} Bin Types Assigned</span>
              </div>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-shrink:0">
          <button
            style="height:40px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
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
          { label: `Today's Pickups`, value: driver.todayPickups, color: '#1a1a1a' },
          { label: 'This Week',       value: driver.weekPickups,  color: '#1a1a1a' },
          { label: 'Completion Rate', value: driver.completionRate, color: '#22c55e' },
          { label: 'Avg Time/Stop',   value: driver.avgTimePerStop, color: '#1a1a1a' },
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
        <p style="font-size:20px;font-weight:700;color:#22c55e;font-family:'Manrope',sans-serif">{{ driver.periodEarnings }}</p>
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
          <div style="display:flex;flex-direction:column;gap:16px">
            <div style="display:flex;align-items:center;justify-content:space-between">
              <div>
                <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:4px">Route Progress</p>
                <p style="font-size:24px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ routeProgress.completed }} of {{ routeProgress.total }} stops completed</p>
              </div>
              <div style="text-align:right">
                <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:4px">Estimated Completion</p>
                <p style="font-size:18px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ routeProgress.estimatedCompletion }}</p>
              </div>
            </div>
            <div style="background:#e5e7eb;border-radius:9999px;height:12px;overflow:hidden">
              <div :style="`background:#ffb400;height:100%;border-radius:9999px;width:${progressPct}%`" />
            </div>
          </div>
          <div style="border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr style="background:#f8f9fa;border-bottom:1px solid #e5e7eb">
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Customer</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Address</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Scheduled Time</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(stop, i) in currentRoute"
                  :key="i"
                  style="border-bottom:1px solid #e5e7eb"
                  @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
                >
                  <td style="padding:18px 16px;font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ stop.customer }}</td>
                  <td style="padding:18px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ stop.address }}</td>
                  <td style="padding:18px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ stop.time }}</td>
                  <td style="padding:18px 16px">
                    <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 10px;white-space:nowrap;color:${stopBadge(stop.status).color};background:${stopBadge(stop.status).bg};border:1px solid ${stopBadge(stop.status).border}`">
                      {{ stop.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Route History -->
        <div v-else-if="activeTab === 'Route History'">
          <div style="border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr style="background:#f8f9fa;border-bottom:1px solid #e5e7eb">
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Date</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Total Stops</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Completed</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Missed</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Duration</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Earnings</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, i) in routeHistory"
                  :key="i"
                  style="border-bottom:1px solid #e5e7eb"
                  @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
                >
                  <td style="padding:18px 16px;font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ row.date }}</td>
                  <td style="padding:18px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ row.stops }}</td>
                  <td style="padding:18px 16px;font-size:14px;color:#22c55e;font-weight:600;font-family:'Manrope',sans-serif">{{ row.completed }}</td>
                  <td style="padding:18px 16px;font-size:14px;font-family:'Manrope',sans-serif" :style="row.missed > 0 ? 'color:#ef4444;font-weight:600' : 'color:#6b7280'">{{ row.missed }}</td>
                  <td style="padding:18px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ row.duration }}</td>
                  <td style="padding:18px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ row.earnings }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Performance -->
        <div v-else-if="activeTab === 'Performance'" style="display:grid;grid-template-columns:repeat(2,1fr);gap:24px">
          <div v-for="stat in performanceStats" :key="stat.label" style="background:#f8f9fa;border-radius:16px;padding:20px 24px">
            <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:8px">{{ stat.label }}</p>
            <p style="font-size:24px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ stat.value }}</p>
          </div>
          <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:16px;padding:20px 24px">
            <p style="font-size:14px;color:#15803d;font-family:'Manrope',sans-serif;margin-bottom:8px">Incomplete Deductions</p>
            <p style="font-size:24px;font-weight:700;color:#dc2626;font-family:'Manrope',sans-serif">-{{ driver.deduction }}</p>
            <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:4px">{{ driver.incompleteCount }} incomplete × GHS 15</p>
          </div>
          <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:16px;padding:20px 24px">
            <p style="font-size:14px;color:#15803d;font-family:'Manrope',sans-serif;margin-bottom:8px">Tasks Completed</p>
            <p style="font-size:24px;font-weight:700;color:#15803d;font-family:'Manrope',sans-serif">{{ driver.completed }} / {{ driver.total }}</p>
          </div>
        </div>

        <!-- Earnings -->
        <div v-else-if="activeTab === 'Earnings'">
          <div style="border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr style="background:#f8f9fa;border-bottom:1px solid #e5e7eb">
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Pay Period</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Gross</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Deductions</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Net</th>
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
                  <td style="padding:18px 16px;font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ row.period }}</td>
                  <td style="padding:18px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ row.gross }}</td>
                  <td style="padding:18px 16px;font-size:14px;color:#ef4444;font-family:'Manrope',sans-serif">-{{ row.deductions }}</td>
                  <td style="padding:18px 16px;font-size:14px;font-weight:600;color:#22c55e;font-family:'Manrope',sans-serif">{{ row.net }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Assigned Bins -->
        <div v-else-if="activeTab === 'Assigned Bins'">
          <div style="border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr style="background:#f8f9fa;border-bottom:1px solid #e5e7eb">
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Bin Type</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Size</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Customers</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(bin, i) in assignedBins"
                  :key="i"
                  style="border-bottom:1px solid #e5e7eb"
                  @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
                >
                  <td style="padding:18px 16px;font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ bin.type }}</td>
                  <td style="padding:18px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ bin.size }}</td>
                  <td style="padding:18px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ bin.customers }}</td>
                  <td style="padding:18px 16px">
                    <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 10px;white-space:nowrap;color:${bin.status === 'active' ? '#22c55e' : '#6b7280'};background:${bin.status === 'active' ? 'rgba(34,197,94,0.1)' : '#e5e7eb'};border:1px solid ${bin.status === 'active' ? 'rgba(34,197,94,0.2)' : '#e5e7eb'}`">
                      {{ bin.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>
