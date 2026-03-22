<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const showAddTruckModal = ref(false)
const trucks = ref<any[]>([])
const loading = ref(false)

async function fetchTrucks() {
  loading.value = true
  const api = useApi()
  const data = await api.get<{ data: any[] }>('/trucks/admin/')
  if (data) trucks.value = data.data
  loading.value = false
}

async function handleAddTruck(formData: Record<string, any>) {
  console.log('[handleAddTruck] payload:', JSON.stringify(formData, null, 2))
  const api = useApi()
  const result = await api.post('/trucks/admin/', formData, 'Failed to create truck')
  console.log('[handleAddTruck] result:', result)
  if (result !== null) {
    showAddTruckModal.value = false
    await fetchTrucks()
  }
}

onMounted(fetchTrucks)

function statusBadge(s: string) {
  if (s === 'active')      return { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.2)',  color: '#22c55e' }
  if (s === 'maintenance') return { bg: 'rgba(255,180,0,0.1)',  border: 'rgba(255,180,0,0.2)',  color: '#d49a00' }
  return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280' }
}
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:32px">

    <!-- Header -->
    <div style="display:flex;align-items:flex-start;justify-content:space-between">
      <div style="display:flex;flex-direction:column;gap:8px">
        <NuxtLink to="/drivers" style="display:inline-flex;align-items:center;gap:8px;text-decoration:none">
          <UIcon name="i-lucide-arrow-left" style="width:16px;height:16px;color:#6b7280" />
          <span style="font-size:16px;color:#6b7280;font-family:'Manrope',sans-serif">Back to Drivers</span>
        </NuxtLink>
        <h1 style="font-size:32px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;line-height:1.3">Truck Management</h1>
        <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Manage fleet vehicles and assignments</p>
      </div>
      <button
        style="height:40px;padding:0 16px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer;display:flex;align-items:center;gap:8px;box-shadow:0 1px 3px rgba(255,180,0,0.2);flex-shrink:0"
        @mouseover="($event.currentTarget as HTMLElement).style.opacity='0.9'"
        @mouseleave="($event.currentTarget as HTMLElement).style.opacity='1'"
        @click="showAddTruckModal = true"
      >
        <UIcon name="i-lucide-plus" style="width:16px;height:16px;color:#0a0d12" />
        Add Truck
      </button>
    </div>

    <!-- Table card -->
    <div style="background:white;border:1px solid #ececec;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f8f9fa;border-bottom:1px solid #e5e7eb">
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Truck ID</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Plate Number</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Capacity</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Assigned Driver</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Status</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">GPS Last Seen</th>
            <th style="padding:14px 16px;text-align:right;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(truck, i) in trucks"
            :key="truck.id"
            :style="`border-bottom:${i < trucks.length - 1 ? '1px solid #e5e7eb' : 'none'}`"
            @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
          >
            <td style="padding:23px 16px;font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ truck.truckId }}</td>
            <td style="padding:23px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ truck.plateNumber }}</td>
            <td style="padding:23px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ truck.capacity }}</td>
            <td style="padding:23px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ truck.assignedDriver?.name ?? 'Unassigned' }}</td>
            <td style="padding:23px 16px">
              <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 10px;white-space:nowrap;color:${statusBadge(truck.status).color};background:${statusBadge(truck.status).bg};border:1px solid ${statusBadge(truck.status).border}`">
                {{ truck.status }}
              </span>
            </td>
            <td style="padding:23px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ truck.lastGpsUpdate ?? 'N/A' }}</td>
            <td style="padding:23px 16px;text-align:right">
              <NuxtLink
                :to="`/trucks/${truck.id}`"
                style="height:32px;padding:0 16px;background:none;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer;display:inline-flex;align-items:center;text-decoration:none"
                @mouseover="($event.currentTarget as HTMLElement).style.background='#f3f4f6'"
                @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
              >View Details</NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>

  <AddTruckModal
    v-if="showAddTruckModal"
    @close="showAddTruckModal = false"
    @submit="handleAddTruck"
  />
</template>
