<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const { format } = useCurrency()

const showAssignPickupModal = ref(false)
const showAddDriverModal = ref(false)
const selectedDriver = ref<any>(null)
const drivers = ref<any[]>([])
const loading = ref(false)

async function fetchDrivers() {
  loading.value = true
  const api = useApi()
  const data = await api.get<{ data: any[] }>('/api/drivers/admin/')
  if (data) drivers.value = data.data
  loading.value = false
}

onMounted(fetchDrivers)

function openAssignPickup(d: any) {
  selectedDriver.value = d
  showAssignPickupModal.value = true
}

function handleAssignPickup(data: Record<string, unknown>) {
  console.log('Assigned pickup:', data)
  showAssignPickupModal.value = false
  selectedDriver.value = null
}

async function handleAddDriver(payload: Record<string, any>) {
  const api = useApi()
  const result = await api.post('/api/drivers/admin/', payload, 'Failed to create driver')
  if (result) {
    showAddDriverModal.value = false
    await fetchDrivers()
  }
}

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
          @click="showAddDriverModal = true"
          @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
          @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
        >
          <UIcon name="i-lucide-plus" style="width:16px;height:16px;color:#111" />
          Add Driver
        </button>        <NuxtLink
          to="/trucks"
          style="height:40px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer;display:flex;align-items:center;text-decoration:none"
          @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
          @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
        >Manage Trucks</NuxtLink>
      </div>
    </div>

    <div class="grid-cols-3">
      <div
        v-for="d in drivers"
        :key="d.id"
        style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1);display:flex;flex-direction:column;gap:16px"
      >
        <div style="display:flex;align-items:flex-start;gap:12px">
          <div style="width:48px;height:48px;border-radius:9999px;background:#ffb400;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <span style="font-size:18px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ (d.user?.name ?? 'U').split(' ').map((n: string) => n[0]).join('') }}</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <span style="font-size:16px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">{{ d.user?.name }}</span>
            <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:2px 10px;width:fit-content;color:${statusStyle(d.status).color};background:${statusStyle(d.status).bg};border:1px solid ${statusStyle(d.status).border}`">{{ d.status }}</span>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:12px">
          <div style="display:flex;align-items:center;gap:8px">
            <UIcon name="i-lucide-phone" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
            <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ d.phoneNumber }}</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <UIcon name="i-lucide-truck" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
            <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Truck {{ d.assignedTruck?.truckId ?? 'Unassigned' }}</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <UIcon name="i-lucide-map-pin" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
            <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ d.zone?.name ?? 'No Zone' }}</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <UIcon name="i-lucide-package" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
            <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ d.bins ?? 0 }} Assigned Pickups</span>
          </div>
        </div>

        <div style="background:#f8f9fa;border-radius:16px;padding:12px">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Today's Pickups</span>
            <span style="font-size:18px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ d.todayPickups ?? 0 }}</span>
          </div>
        </div>

        <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:16px;padding:12px;display:flex;flex-direction:column;gap:4px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <UIcon name="i-lucide-dollar-sign" style="width:16px;height:16px;color:#15803d;flex-shrink:0" />
            <span style="font-size:14px;font-weight:500;color:#15803d;font-family:'Manrope',sans-serif">Period Earnings</span>
          </div>
          <p style="font-size:20px;font-weight:700;color:#15803d;font-family:'Manrope',sans-serif;margin:0">{{ format(d.earnings ?? 0) }}</p>
          <p style="font-size:12px;color:#dc2626;font-family:'Manrope',sans-serif;margin:0">-{{ d.incomplete ?? 0 }} incomplete ({{ d.incomplete ?? 0 }} × GHS 15 = -{{ format(d.deductionAmt ?? 0) }})</p>
          <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0">{{ d.completed ?? 0 }}/{{ d.total ?? 0 }} tasks completed</p>
        </div>

        <div style="display:flex;gap:8px">
          <NuxtLink
            :to="`/drivers/${d.id}`"
            style="flex:1;height:40px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;text-decoration:none"
            @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
          >View Details</NuxtLink>
          <button
            style="height:40px;padding:0 16px;background:none;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
            @click="openAssignPickup(d)"
            @mouseover="($event.currentTarget as HTMLElement).style.background='#f3f4f6'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
          >Assign Pickups</button>
        </div>
      </div>
    </div>
  </div>

  <AssignPickupModal
    v-if="showAssignPickupModal && selectedDriver"
    :driver-name="selectedDriver.user?.name ?? ''"
    @close="showAssignPickupModal = false"
    @submit="handleAssignPickup"
  />

  <AddDriverModal
    v-if="showAddDriverModal"
    @close="showAddDriverModal = false"
    @submit="handleAddDriver"
  />
</template>
