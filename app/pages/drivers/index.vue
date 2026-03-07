<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const drivers = [
  { initials: 'JS', name: 'John Smith',    phone: '(555) 111-2222', truck: 'T-001', zone: 'Downtown', bins: 3, status: 'on-route', todayPickups: 12, earnings: '$1,805.00', incomplete: 3, deduction: '$45',  completed: 142, total: 145 },
  { initials: 'MG', name: 'Maria Garcia',  phone: '(555) 222-3333', truck: 'T-003', zone: 'Westside',  bins: 4, status: 'on-route', todayPickups: 15, earnings: '$2,070.00', incomplete: 2, deduction: '$30',  completed: 158, total: 160 },
  { initials: 'JW', name: 'James Wilson',  phone: '(555) 333-4444', truck: 'T-007', zone: 'Eastside',  bins: 2, status: 'on-route', todayPickups: 10, earnings: '$1,545.00', incomplete: 7, deduction: '$105', completed: 128, total: 135 },
  { initials: 'LA', name: 'Lisa Anderson', phone: '(555) 444-5555', truck: 'T-012', zone: 'Northside', bins: 3, status: 'online',   todayPickups: 0,  earnings: '$1,890.00', incomplete: 2, deduction: '$30',  completed: 150, total: 152 },
  { initials: 'RT', name: 'Robert Taylor', phone: '(555) 555-6666', truck: 'T-015', zone: 'Southside', bins: 2, status: 'offline',  todayPickups: 0,  earnings: '$1,705.00', incomplete: 5, deduction: '$75',  completed: 135, total: 140 },
]

function statusStyle(s: string) {
  if (s === 'on-route') return { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.2)',  color: '#22c55e' }
  if (s === 'online')   return { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', color: '#3b82f6' }
  return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280' }
}
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:32px">
    <div style="display:flex;align-items:flex-start;justify-content:space-between">
      <div>
        <h1 style="font-size:32px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;line-height:1.3">Drivers &amp; Trucks</h1>
        <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:4px">Manage drivers, trucks, and assignments</p>
        <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:2px">Current Pay Period: Feb 17 – Mar 2</p>
      </div>
      <div style="display:flex;gap:12px;flex-shrink:0">
        <button
          style="height:40px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer;display:flex;align-items:center;gap:8px"
          @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
          @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
        >
          <UIcon name="i-lucide-plus" style="width:16px;height:16px;color:#111" />
          Add Driver
        </button>
        <button
          style="height:40px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
          @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
          @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
        >Manage Trucks</button>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">
      <div
        v-for="d in drivers"
        :key="d.name"
        style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1);display:flex;flex-direction:column;gap:16px"
      >
        <div style="display:flex;align-items:flex-start;gap:12px">
          <div style="width:48px;height:48px;border-radius:9999px;background:#ffb400;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <span style="font-size:18px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ d.initials }}</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <span style="font-size:16px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">{{ d.name }}</span>
            <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:2px 10px;width:fit-content;color:${statusStyle(d.status).color};background:${statusStyle(d.status).bg};border:1px solid ${statusStyle(d.status).border}`">{{ d.status }}</span>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:12px">
          <div style="display:flex;align-items:center;gap:8px">
            <UIcon name="i-lucide-phone" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
            <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ d.phone }}</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <UIcon name="i-lucide-truck" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
            <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Truck {{ d.truck }}</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <UIcon name="i-lucide-map-pin" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
            <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ d.zone }}</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <UIcon name="i-lucide-package" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
            <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ d.bins }} Assigned Bins</span>
          </div>
        </div>

        <div style="background:#f8f9fa;border-radius:16px;padding:12px">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Today's Pickups</span>
            <span style="font-size:18px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ d.todayPickups }}</span>
          </div>
        </div>

        <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:16px;padding:12px;display:flex;flex-direction:column;gap:4px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <UIcon name="i-lucide-dollar-sign" style="width:16px;height:16px;color:#15803d;flex-shrink:0" />
            <span style="font-size:14px;font-weight:500;color:#15803d;font-family:'Manrope',sans-serif">Period Earnings</span>
          </div>
          <p style="font-size:20px;font-weight:700;color:#15803d;font-family:'Manrope',sans-serif;margin:0">{{ d.earnings }}</p>
          <p style="font-size:12px;color:#dc2626;font-family:'Manrope',sans-serif;margin:0">-{{ d.incomplete }} incomplete ({{ d.incomplete }} × $15 = -{{ d.deduction }})</p>
          <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0">{{ d.completed }}/{{ d.total }} tasks completed</p>
        </div>

        <div style="display:flex;gap:8px">
          <NuxtLink
            :to="`/drivers/${d.name.toLowerCase().replace(/\s+/g, '-')}`"
            style="flex:1;height:40px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;text-decoration:none"
            @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
          >View Details</NuxtLink>
          <button
            style="height:40px;padding:0 16px;background:none;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
            @mouseover="($event.currentTarget as HTMLElement).style.background='#f3f4f6'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
          >Assign Bins</button>
        </div>
      </div>
    </div>
  </div>
</template>
