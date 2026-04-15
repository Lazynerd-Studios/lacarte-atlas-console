<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const truck = ref<any>(null)
const loading = ref(true)
const notFound = ref(false)
const toast = useAppToast()

onMounted(async () => {
  console.log('[truck-detail] Component mounted, fetching truck:', route.params.id)
  const api = useApi()
  const data = await api.get<any>(`/trucks/admin/${route.params.id}`)
  console.log('[truck-detail] Truck response:', data)
  console.log('[truck-detail] Registration Expiry from backend:', data?.registrationExpiry)
  if (data) {
    truck.value = data
    console.log('[truck-detail] Loaded truck:', truck.value.truckId)
    
    // Fetch maintenance history after truck data is loaded
    await fetchMaintenanceHistory()
  } else {
    console.log('[truck-detail] Truck not found')
    notFound.value = true
  }
  loading.value = false
})

const showEditModal = ref(false)
const showMaintenanceModal = ref(false)
const showAssignDriverModal = ref(false)
const showDeleteConfirm = ref(false)
const showEditMaintenanceModal = ref(false)
const selectedMaintenance = ref<any>(null)
const deleting = ref(false)
const maintenanceHistory = ref<any[]>([])
const loadingMaintenance = ref(false)

async function fetchMaintenanceHistory() {
  loadingMaintenance.value = true
  const api = useApi()
  
  console.log('[truck-detail] Fetching maintenance history for truck:', route.params.id)
  const response = await api.get<{ data: any[] }>(`/trucks/${route.params.id}/maintenance`)
  
  if (response && response.data) {
    console.log('[truck-detail] Maintenance history response:', response)
    
    // Transform API response to match local format
    maintenanceHistory.value = response.data.map((item: any) => ({
      id: item.id,
      date: item.scheduledDate ? new Date(item.scheduledDate).toISOString().split('T')[0] : '',
      type: item.maintenanceType,
      technician: item.serviceCentre || 'N/A',
      cost: item.estimatedCost ? `GHS ${parseFloat(item.estimatedCost).toFixed(2)}` : 'GHS 0.00',
      status: item.status || 'scheduled',
      notes: item.notes || '',
    }))
    
    console.log('[truck-detail] Loaded maintenance records:', maintenanceHistory.value.length)
  } else {
    console.log('[truck-detail] No maintenance history found')
    maintenanceHistory.value = []
  }
  
  loadingMaintenance.value = false
}

async function handleMaintenance(data: { type: string; technician: string; date: string; estimatedCost: string; notes: string }) {
  console.log('[truck-detail] Scheduling maintenance:', data)
  const api = useApi()
  
  const payload = {
    maintenanceType: data.type,
    serviceCentre: data.technician,
    scheduledDate: data.date,
    estimatedCost: data.estimatedCost || undefined,
    notes: data.notes || undefined,
  }
  
  console.log('[truck-detail] API payload:', payload)
  const result = await api.post<any>(`/trucks/admin/${route.params.id}/maintenance`, payload, 'Failed to schedule maintenance')
  
  if (result) {
    console.log('[truck-detail] Maintenance scheduled successfully:', result)
    
    // Add to local maintenance history
    maintenanceHistory.value.unshift({
      id: result.id,
      date: result.scheduledDate ? new Date(result.scheduledDate).toISOString().split('T')[0] : '',
      type: result.maintenanceType,
      technician: result.serviceCentre || 'N/A',
      cost: result.estimatedCost ? `GHS ${parseFloat(result.estimatedCost).toFixed(2)}` : 'GHS 0.00',
      status: result.status || 'scheduled',
      notes: result.notes || '',
    })
    
    showMaintenanceModal.value = false
    toast.success('Maintenance scheduled successfully')
    console.log('[truck-detail] Maintenance record added, total records:', maintenanceHistory.value.length)
  }
}

async function handleAssignDriver(driverId: string) {
  console.log('[truck-detail] Assigning driver:', driverId, 'to truck:', route.params.id)
  const api = useApi()
  const result = await api.patch(`/trucks/admin/${route.params.id}/assign-driver`, { driverId }, 'Failed to assign driver')
  console.log('[truck-detail] Assign driver result:', result)
  
  if (result !== null) {
    showAssignDriverModal.value = false
    // Refresh truck data
    const data = await api.get<any>(`/trucks/admin/${route.params.id}`)
    if (data) {
      truck.value = data
      console.log('[truck-detail] Truck data refreshed after driver assignment')
    }
  }
}

async function handleEdit(data: { plate: string; vin: string; make: string; model: string; year: number; capacity: string; status: string; gpsDeviceId?: string; registrationExpiry: string; notes?: string }) {
  console.log('[truck-detail] Updating truck, payload:', data)
  const api = useApi()
  const result = await api.patch(`/trucks/admin/${route.params.id}`, data, 'Failed to update truck')
  console.log('[truck-detail] Update result:', result)
  
  if (result !== null) {
    // Update local state
    truck.value.plateNumber = data.plate
    truck.value.vinNumber = data.vin
    truck.value.make = data.make
    truck.value.model = data.model
    truck.value.year = String(data.year)
    truck.value.capacity = data.capacity
    truck.value.status = data.status
    truck.value.gpsDeviceId = data.gpsDeviceId
    truck.value.registrationExpiry = data.registrationExpiry
    truck.value.notes = data.notes
    showEditModal.value = false
    toast.success('Truck updated successfully')
    console.log('[truck-detail] Truck updated successfully')
  }
}

async function handleDeleteTruck() {
  deleting.value = true
  const api = useApi()
  const result = await api.del(`/trucks/admin/${route.params.id}`, 'Failed to delete truck')
  deleting.value = false
  
  if (result !== null) {
    showDeleteConfirm.value = false
    toast.success('Truck deleted successfully')
    await navigateTo('/trucks')
  }
}

function openEditMaintenance(maintenance: any) {
  selectedMaintenance.value = maintenance
  showEditMaintenanceModal.value = true
}

async function handleUpdateMaintenance(maintenanceId: string, data: Record<string, unknown>) {
  const api = useApi()
  console.log('[truck-detail] Updating maintenance:', maintenanceId, data)
  const result = await api.patch(`/trucks/admin/${route.params.id}/maintenance/${maintenanceId}`, data, 'Failed to update maintenance')
  
  if (result !== null) {
    showEditMaintenanceModal.value = false
    toast.success('Maintenance updated successfully')
    
    // Update local maintenance history
    const index = maintenanceHistory.value.findIndex((m: any) => m.id === maintenanceId)
    if (index !== -1) {
      const existingCost = maintenanceHistory.value[index]?.cost || 'GHS 0.00'
      maintenanceHistory.value[index] = {
        id: maintenanceId,
        date: data.scheduledDate ? new Date(data.scheduledDate as string).toISOString().split('T')[0] : '',
        type: data.maintenanceType as string,
        technician: data.serviceCentre as string || 'N/A',
        cost: data.estimatedCost ? `GHS ${parseFloat(data.estimatedCost as string).toFixed(2)}` : existingCost,
        status: data.status as string,
        notes: data.notes as string || '',
      }
    }
    
    console.log('[truck-detail] Maintenance updated successfully')
  }
}

const statusBadge = computed(() => {
  const s = truck.value?.status
  if (s === 'active')      return { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.2)',  color: '#22c55e',  label: 'Active' }
  if (s === 'maintenance') return { bg: 'rgba(255,180,0,0.1)',  border: 'rgba(255,180,0,0.2)',  color: '#d49a00',  label: 'Maintenance' }
  return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280', label: 'Inactive' }
})

const formattedRegistrationExpiry = computed(() => {
  if (!truck.value?.registrationExpiry) return 'N/A'
  try {
    const date = new Date(truck.value.registrationExpiry)
    if (isNaN(date.getTime())) return 'N/A'
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return 'N/A'
  }
})

const activeTab = ref('Vehicle Details')
const tabs = ['Vehicle Details', 'Maintenance History', 'Route History']

watch(activeTab, (newTab) => {
  console.log('[truck-detail] Tab changed to:', newTab)
})

watch(showEditModal, (isOpen) => {
  if (isOpen) console.log('[truck-detail] Opening edit modal')
})

watch(showMaintenanceModal, (isOpen) => {
  if (isOpen) console.log('[truck-detail] Opening maintenance modal')
})

const routeHistory = [
  { date: '2026-03-07', driver: 'John Smith', stops: 28, distance: '42 mi', duration: '6h 20m', zone: 'Downtown' },
  { date: '2026-03-06', driver: 'John Smith', stops: 32, distance: '48 mi', duration: '7h 10m', zone: 'Downtown' },
  { date: '2026-03-05', driver: 'John Smith', stops: 27, distance: '39 mi', duration: '6h 05m', zone: 'Downtown' },
  { date: '2026-03-04', driver: 'John Smith', stops: 30, distance: '44 mi', duration: '6h 45m', zone: 'Downtown' },
  { date: '2026-03-03', driver: 'John Smith', stops: 25, distance: '37 mi', duration: '5h 50m', zone: 'Downtown' },
]
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:21px">

    <!-- Back link -->
    <NuxtLink to="/trucks" style="display:inline-flex;align-items:center;gap:8px;text-decoration:none">
      <UIcon name="i-lucide-arrow-left" style="width:16px;height:16px;color:#6b7280" />
      <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Back</span>
    </NuxtLink>

    <!-- Loading state -->
    <div v-if="loading" style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Loading...</div>

    <!-- Not found state -->
    <div v-else-if="notFound" style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Truck not found</div>

    <!-- Main content -->
    <template v-else>

      <!-- Profile card -->
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:10px 25px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <div style="display:flex;align-items:center;justify-content:space-between;min-height:87px">
          <div style="display:flex;align-items:center;gap:16px">
            <!-- Truck icon square -->
            <div style="width:64px;height:64px;border-radius:16px;background:#ffb400;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <UIcon name="i-lucide-truck" style="width:32px;height:32px;color:#1a1a1a" />
            </div>
            <div style="display:flex;flex-direction:column;gap:8px">
              <div style="display:flex;align-items:center;gap:12px">
                <span style="font-size:24px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">{{ truck.truckId }}</span>
                <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;color:${statusBadge.color};background:${statusBadge.bg};border:1px solid ${statusBadge.border};border-radius:14px;padding:3px 11px`">
                  {{ statusBadge.label }}
                </span>
              </div>
              <div style="display:grid;grid-template-columns:repeat(2,auto);gap:8px 24px">
                <div style="display:flex;align-items:center;gap:8px">
                  <UIcon name="i-lucide-hash" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
                  <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Plate: {{ truck.plateNumber }}</span>
                </div>
                <div style="display:flex;align-items:center;gap:8px">
                  <UIcon name="i-lucide-calendar" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
                  <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Year: {{ truck.year }}</span>
                </div>
                <div style="display:flex;align-items:center;gap:8px">
                  <UIcon name="i-lucide-wrench" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
                  <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Last Service: {{ truck.lastService ?? 'N/A' }}</span>
                </div>
                <div style="display:flex;align-items:center;gap:8px">
                  <UIcon name="i-lucide-user" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
                  <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Driver: {{ truck.assignedDriver?.name ?? 'Unassigned' }}</span>
                </div>
              </div>
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-shrink:0">
            <button
              style="height:40px;padding:0 16px;background:#dc2626;border:none;border-radius:20px;font-size:14px;font-weight:500;color:white;font-family:'Manrope',sans-serif;cursor:pointer"
              @click="showDeleteConfirm = true"
              @mouseover="($event.currentTarget as HTMLElement).style.background='#b91c1c'"
              @mouseleave="($event.currentTarget as HTMLElement).style.background='#dc2626'"
            >Delete Truck</button>
            <button
              style="height:40px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
              @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
              @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
              @click="showEditModal = true"
            >Edit Truck</button>
            <button
              style="height:40px;padding:0 16px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer;display:flex;align-items:center;gap:6px"
              @mouseover="($event.currentTarget as HTMLElement).style.opacity='0.9'"
              @mouseleave="($event.currentTarget as HTMLElement).style.opacity='1'"
              @click="showAssignDriverModal = true"
            >
              <UIcon name="i-lucide-user-plus" style="width:16px;height:16px" />
              Assign Driver
            </button>
            <button
              style="height:40px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
              @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
              @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
              @click="showMaintenanceModal = true"
            >Schedule Maintenance</button>
          </div>
        </div>
      </div>

      <!-- Stat cards -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:24px">

        <!-- Last Driver -->
        <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:10px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
          <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:10px">Last Driver</p>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
            <div style="width:36px;height:36px;border-radius:9999px;background:#ffb400;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <span style="font-size:13px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ (truck.assignedDriver?.name ?? 'U').split(' ').map((n: string) => n[0]).join('') }}</span>
            </div>
            <span style="font-size:16px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ truck.assignedDriver?.name ?? 'Unassigned' }}</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <span style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">{{ truck.lastDriverPhone ?? 'N/A' }}</span>
            <span style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">{{ truck.lastDriverZone ?? 'N/A' }} · {{ truck.lastDriverDate ?? 'N/A' }}</span>
          </div>
        </div>

        <!-- Total Pickups -->
        <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:10px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
          <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:8px">Total Pickups</p>
          <p style="font-size:28px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ truck.totalPickups ?? 'N/A' }}</p>
          <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:4px">All time</p>
        </div>

        <!-- Last Service -->
        <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:10px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
          <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:8px">Last Service</p>
          <p style="font-size:20px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ truck.lastService ?? 'N/A' }}</p>
          <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:4px">Oil Change</p>
        </div>

        <!-- Next Service Due -->
        <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:10px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
          <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:8px">Next Service Due</p>
          <p style="font-size:20px;font-weight:700;color:#ffb400;font-family:'Manrope',sans-serif">{{ truck.nextServiceDue ?? 'N/A' }}</p>
          <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:4px">Scheduled</p>
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

          <!-- Vehicle Details -->
          <div v-if="activeTab === 'Vehicle Details'" style="display:grid;grid-template-columns:repeat(2,1fr);gap:24px">

            <!-- Vehicle Information -->
            <div style="display:flex;flex-direction:column;gap:16px">
              <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Vehicle Information</p>
              <div style="display:flex;flex-direction:column;gap:12px">
                <div v-for="item in [
                  { label: 'VIN Number',    value: truck.vinNumber },
                  { label: 'Make & Model',  value: `${truck.make ?? ''} ${truck.model ?? ''}`.trim() },
                  { label: 'Year',          value: truck.year },
                  { label: 'Plate Number',  value: truck.plateNumber },
                  { label: 'Capacity',      value: truck.capacity },
                ]" :key="item.label" style="display:flex;flex-direction:column;gap:2px">
                  <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ item.label }}</p>
                  <p style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ item.value }}</p>
                </div>
              </div>
            </div>

            <!-- GPS & Tracking -->
            <div style="display:flex;flex-direction:column;gap:16px">
              <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">GPS &amp; Tracking</p>
              <div style="display:flex;flex-direction:column;gap:12px">
                <div v-for="item in [
                  { label: 'GPS Device ID',       value: truck.gpsDeviceId ?? 'N/A' },
                  { label: 'Last GPS Update',     value: truck.lastGpsUpdate ?? 'N/A' },
                  { label: 'Current Location',    value: truck.currentLocation ?? 'N/A' },
                  { label: 'Registration Expiry', value: formattedRegistrationExpiry },
                ]" :key="item.label" style="display:flex;flex-direction:column;gap:2px">
                  <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ item.label }}</p>
                  <p style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ item.value }}</p>
                </div>
              </div>
            </div>

          </div>

          <!-- Maintenance History -->
          <div v-else-if="activeTab === 'Maintenance History'">
            <!-- Loading state -->
            <div v-if="loadingMaintenance" style="padding:40px;text-align:center">
              <UIcon name="i-lucide-loader-2" style="width:32px;height:32px;color:#6b7280;animation:spin 1s linear infinite;margin-bottom:12px" />
              <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Loading maintenance history...</p>
            </div>
            
            <!-- Empty state -->
            <div v-else-if="maintenanceHistory.length === 0" style="padding:60px;text-align:center">
              <UIcon name="i-lucide-wrench" style="width:40px;height:40px;color:#d1d5db;margin-bottom:12px" />
              <p style="font-size:15px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;margin:0 0 6px">No maintenance records</p>
              <p style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0 0 20px">Schedule maintenance to start tracking service history.</p>
              <button
                style="height:40px;padding:0 20px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer"
                @click="showMaintenanceModal = true"
              >Schedule Maintenance</button>
            </div>
            
            <!-- Table with data -->
            <div v-else style="border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
              <table style="width:100%;border-collapse:collapse">
                <thead>
                  <tr style="background:#f8f9fa;border-bottom:1px solid #e5e7eb">
                    <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Date</th>
                    <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Type</th>
                    <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Technician</th>
                    <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Cost</th>
                    <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Notes</th>
                    <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Status</th>
                    <th style="padding:14px 16px;text-align:right;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(row, i) in maintenanceHistory"
                    :key="i"
                    style="border-bottom:1px solid #e5e7eb"
                    @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
                    @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
                  >
                    <td style="padding:17px 16px;font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ row.date }}</td>
                    <td style="padding:17px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ row.type }}</td>
                    <td style="padding:17px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ row.technician }}</td>
                    <td style="padding:17px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ row.cost }}</td>
                    <td style="padding:17px 16px;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ row.notes }}</td>
                    <td style="padding:17px 16px">
                      <span style="font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 10px;white-space:nowrap;color:#22c55e;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.2)">
                        {{ row.status }}
                      </span>
                    </td>
                    <td style="padding:17px 16px;text-align:right">
                      <button
                        v-if="!row.id.startsWith('temp-')"
                        style="height:32px;padding:0 12px;background:#ececec;border:none;border-radius:16px;font-size:13px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
                        @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
                        @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
                        @click="openEditMaintenance(row)"
                      >Edit</button>
                      <span v-else style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">Pending sync</span>
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
                    <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Driver</th>
                    <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Total Stops</th>
                    <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Distance</th>
                    <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Duration</th>
                    <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Zone</th>
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
                    <td style="padding:17px 16px;font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ row.date }}</td>
                    <td style="padding:17px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ row.driver }}</td>
                    <td style="padding:17px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ row.stops }}</td>
                    <td style="padding:17px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ row.distance }}</td>
                    <td style="padding:17px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ row.duration }}</td>
                    <td style="padding:17px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ row.zone }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

    </template>

  </div>

  <EditTruckModal
    v-if="showEditModal && truck"
    :truck="{ id: truck.truckId, plate: truck.plateNumber, vin: truck.vinNumber, make: truck.make, model: truck.model, year: truck.year, capacity: truck.capacity, status: truck.status, gpsDeviceId: truck.gpsDeviceId, registrationExpiry: truck.registrationExpiry, notes: truck.notes }"
    @close="showEditModal = false"
    @submit="handleEdit"
  />

  <AssignDriverToTruckModal
    v-if="showAssignDriverModal && truck"
    :truck-id="truck.truckId"
    :current-driver="truck.assignedDriver?.name"
    @close="showAssignDriverModal = false"
    @submit="handleAssignDriver"
  />

  <MaintenanceModal
    v-if="showMaintenanceModal && truck"
    :truck-id="truck.truckId"
    @close="showMaintenanceModal = false"
    @submit="handleMaintenance"
  />

  <EditMaintenanceModal
    v-if="showEditMaintenanceModal && selectedMaintenance"
    :truck-id="truck.truckId"
    :maintenance="selectedMaintenance"
    @close="showEditMaintenanceModal = false"
    @submit="handleUpdateMaintenance"
  />

  <ConfirmDialog
    v-if="showDeleteConfirm"
    title="Delete Truck"
    :message="`Are you sure you want to delete truck ${truck?.truckId || 'this truck'}? This action cannot be undone.`"
    confirm-text="Delete"
    :loading="deleting"
    @confirm="handleDeleteTruck"
    @cancel="showDeleteConfirm = false"
  />
</template>
