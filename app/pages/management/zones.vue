<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

interface Zone {
  id: string
  name: string
  description: string
  color: string
  areas: string[]
  driverCount: number
  customerCount: number
  isActive: boolean
}

interface ZoneStats {
  totalZones: number
  activeZones: number
  totalCustomers: number
  assignedDrivers: number
}

const api = useApi()
const zones = ref<Zone[]>([])
const stats = ref<ZoneStats>({ totalZones: 0, activeZones: 0, totalCustomers: 0, assignedDrivers: 0 })
const loading = ref(true)

// Pagination
const currentPage = ref(1)
const perPage = 10
const totalZones = ref(0)

async function fetchStats() {
  const data = await api.get<ZoneStats>('/zone/admin/stats', 'Failed to load zone stats')
  if (data) stats.value = data
}

async function fetchZones() {
  const data = await api.get<any>('/zone/admin/list')
  console.log('[fetchZones] response:', data)
  if (data) {
    const allZones = Array.isArray(data) ? data : (data.data ?? data.zones ?? data.results ?? [])
    zones.value = allZones
    totalZones.value = allZones.length
  }
}

onMounted(async () => {
  loading.value = true
  await Promise.all([fetchZones(), fetchStats()])
  loading.value = false
})

const search = ref('')
const filterStatus = ref<'all' | 'active' | 'inactive'>('all')

const filtered = computed(() => zones.value.filter(z => {
  const matchSearch = !search.value || z.name.toLowerCase().includes(search.value.toLowerCase()) || z.areas.some(a => a.toLowerCase().includes(search.value.toLowerCase()))
  const matchStatus = filterStatus.value === 'all' || (filterStatus.value === 'active' ? z.isActive : !z.isActive)
  return matchSearch && matchStatus
}))

// Paginated zones
const paginatedZones = computed(() => {
  const start = (currentPage.value - 1) * perPage
  const end = start + perPage
  return filtered.value.slice(start, end)
})

// Reset to page 1 when filters change
watch([search, filterStatus], () => {
  currentPage.value = 1
})

const totalCustomers = computed(() => stats.value.totalCustomers)
const totalDrivers   = computed(() => stats.value.assignedDrivers)
const activeZones    = computed(() => stats.value.activeZones)

// ── Add modal ──
const showAddModal = ref(false)
const addModalRef = ref<any>(null)

function openAdd() { showAddModal.value = true }

async function handleAdd(data: { name: string; description: string; color: string; areas: string[]; isActive: boolean }) {
  console.log('[handleAdd] payload:', data)
  const result = await api.post<Zone>('/zone/admin/', data, 'Failed to create zone')
  console.log('[handleAdd] result:', result)
  if (addModalRef.value) addModalRef.value.submitting = false
  if (result !== null) {
    showAddModal.value = false
    await fetchZones()
    await fetchStats()
    useAppToast().success('Zone created successfully')
  }
}

// ── Edit modal ──
const showEditModal = ref(false)
const editTarget = ref<Zone | null>(null)
const editModalRef = ref<any>(null)

function openEdit(z: Zone) { editTarget.value = z; showEditModal.value = true }

async function handleEdit(data: { name: string; description: string; color: string; areas: string[]; isActive: boolean }) {
  if (!editTarget.value) return
  const result = await api.patch(`/zone/admin/${editTarget.value.id}`, data, 'Failed to update zone')
  if (editModalRef.value) editModalRef.value.submitting = false
  if (result !== null) {
    showEditModal.value = false
    editTarget.value = null
    await fetchZones()
    await fetchStats()
    useAppToast().success('Zone updated successfully')
  }
}

// ── Delete modal ──
const showDeleteModal = ref(false)
const deleteTarget = ref<Zone | null>(null)

function openDelete(z: Zone) { deleteTarget.value = z; showDeleteModal.value = true }

async function handleDelete() {
  if (!deleteTarget.value) return
  const result = await api.del(`/zone/admin/${deleteTarget.value.id}`, 'Failed to delete zone')
  if (result !== null) {
    showDeleteModal.value = false
    deleteTarget.value = null
    await fetchZones()
    await fetchStats()
    useAppToast().success('Zone deleted successfully')
  }
}

async function toggleActive(z: Zone) {
  console.log('[toggleActive] zone:', z.id, 'current isActive:', z.isActive)
  const result = await api.patch(`/zone/admin/${z.id}/toggle`, {}, 'Failed to update zone status')
  console.log('[toggleActive] result:', result)
  if (result !== null) {
    await fetchZones()
    await fetchStats()
    const action = z.isActive ? 'deactivated' : 'activated'
    useAppToast().success(`${z.name} ${action}`)
  }
}

</script>

<template>
  <!-- Loading skeleton -->
  <div v-if="loading" style="display:flex;flex-direction:column;gap:32px;font-family:'Manrope',sans-serif">
    <!-- Header skeleton -->
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
      <div>
        <div class="skeleton" style="height:28px;width:220px;margin-bottom:6px" />
        <div class="skeleton" style="height:14px;width:280px" />
      </div>
      <div class="skeleton" style="height:40px;width:120px;border-radius:10px" />
    </div>

    <!-- Stats skeleton -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:16px">
      <div v-for="i in 3" :key="i" style="background:#fff;border-radius:16px;padding:20px 24px;border:1px solid #f0f0f0">
        <div class="skeleton" style="height:12px;width:80px;margin-bottom:6px" />
        <div class="skeleton" style="height:28px;width:60px;margin-bottom:4px" />
        <div class="skeleton" style="height:11px;width:100px" />
      </div>
    </div>

    <!-- Filters skeleton -->
    <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center">
      <div class="skeleton" style="height:38px;flex:1;min-width:200px;max-width:320px;border-radius:10px" />
      <div class="skeleton" style="height:38px;width:130px;border-radius:10px" />
    </div>

    <!-- Zone cards skeleton -->
    <div style="display:flex;flex-direction:column;gap:16px">
      <div v-for="i in 3" :key="i" style="background:#fff;border-radius:16px;border:1px solid #f0f0f0;padding:24px;display:flex;align-items:flex-start;justify-content:space-between;gap:20px;flex-wrap:wrap">
        <!-- Left -->
        <div style="display:flex;align-items:flex-start;gap:16px;flex:1;min-width:220px">
          <div class="skeleton" style="width:48px;height:48px;border-radius:14px" />
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
              <div class="skeleton" style="height:16px;width:140px" />
              <div class="skeleton" style="height:20px;width:60px;border-radius:20px" />
            </div>
            <div class="skeleton" style="height:13px;width:80%;margin-bottom:12px" />
            <div style="display:flex;flex-wrap:wrap;gap:6px">
              <div class="skeleton" style="height:24px;width:80px;border-radius:6px" />
              <div class="skeleton" style="height:24px;width:100px;border-radius:6px" />
              <div class="skeleton" style="height:24px;width:90px;border-radius:6px" />
            </div>
          </div>
        </div>
        <!-- Middle -->
        <div style="display:flex;gap:28px;align-items:center;flex-shrink:0">
          <div v-for="j in 3" :key="j" style="text-align:center">
            <div class="skeleton" style="height:11px;width:60px;margin:0 auto 4px" />
            <div class="skeleton" style="height:20px;width:40px;margin:0 auto" />
          </div>
        </div>
        <!-- Right -->
        <div style="display:flex;gap:8px;align-items:center;flex-shrink:0">
          <div class="skeleton" style="height:36px;width:100px;border-radius:8px" />
          <div class="skeleton" style="height:36px;width:70px;border-radius:8px" />
          <div class="skeleton" style="height:36px;width:80px;border-radius:8px" />
        </div>
      </div>
    </div>
  </div>

  <div v-else style="display:flex;flex-direction:column;gap:32px;font-family:'Manrope',sans-serif">

    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
      <div>
        <h1 style="font-size:28px;font-weight:700;color:#111;margin:0;line-height:1.3">Zone Management</h1>
        <p style="font-size:14px;color:#6b7280;margin:6px 0 0">Manage service zones and area coverage</p>
      </div>
      <button @click="openAdd" style="display:flex;align-items:center;gap:8px;background:#ffb400;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer">
        <Icon name="lucide:plus" style="width:16px;height:16px" />
        Add Zone
      </button>
    </div>

    <!-- Stats -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:16px">
      <div style="background:#fff;border-radius:16px;padding:20px 24px;border:1px solid #f0f0f0">
        <p style="font-size:12px;color:#6b7280;margin:0 0 6px;font-weight:500">Total Zones</p>
        <p style="font-size:28px;font-weight:700;color:#1a1a1a;margin:0">{{ stats.totalZones }}</p>
        <p style="font-size:11px;color:#9ca3af;margin:4px 0 0">{{ activeZones }} active</p>
      </div>
      <div style="background:#fff;border-radius:16px;padding:20px 24px;border:1px solid #f0f0f0">
        <p style="font-size:12px;color:#6b7280;margin:0 0 6px;font-weight:500">Total Customers</p>
        <p style="font-size:28px;font-weight:700;color:#1a1a1a;margin:0">{{ totalCustomers }}</p>
        <p style="font-size:11px;color:#9ca3af;margin:4px 0 0">across all zones</p>
      </div>
      <div style="background:#fff;border-radius:16px;padding:20px 24px;border:1px solid #f0f0f0">
        <p style="font-size:12px;color:#6b7280;margin:0 0 6px;font-weight:500">Assigned Drivers</p>
        <p style="font-size:28px;font-weight:700;color:#1a1a1a;margin:0">{{ totalDrivers }}</p>
        <p style="font-size:11px;color:#9ca3af;margin:4px 0 0">across all zones</p>
      </div>
    </div>

    <!-- Filters -->
    <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center">
      <div style="position:relative;flex:1;min-width:200px;max-width:320px">
        <Icon name="lucide:search" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);width:15px;height:15px;color:#9ca3af;pointer-events:none" />
        <input v-model="search" placeholder="Search zones or areas..." style="width:100%;height:38px;padding:0 14px 0 36px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:13px;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box" />
      </div>
      <div style="position:relative">
        <select v-model="filterStatus" style="height:38px;padding:0 36px 0 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:13px;font-family:'Manrope',sans-serif;color:#1a1a1a;outline:none;background:#fff;cursor:pointer;appearance:none;min-width:130px">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <Icon name="lucide:chevron-down" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);width:14px;height:14px;color:#6b7280;pointer-events:none" />
      </div>
      <span style="font-size:13px;color:#9ca3af;margin-left:auto">{{ filtered.length }} zone{{ filtered.length !== 1 ? 's' : '' }}</span>
    </div>

    <!-- Zone cards -->
    <div style="display:flex;flex-direction:column;gap:16px">
      <div v-for="zone in paginatedZones" :key="zone.id"
        style="background:#fff;border-radius:16px;border:1px solid #f0f0f0;padding:24px;display:flex;align-items:flex-start;justify-content:space-between;gap:20px;flex-wrap:wrap">

        <!-- Left: icon + info -->
        <div style="display:flex;align-items:flex-start;gap:16px;flex:1;min-width:220px">
          <div :style="`width:48px;height:48px;border-radius:14px;background:${zone.color}22;display:flex;align-items:center;justify-content:center;flex-shrink:0`">
            <Icon name="lucide:map-pin" :style="`width:20px;height:20px;color:${zone.color}`" />
          </div>
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;flex-wrap:wrap">
              <span style="font-size:16px;font-weight:700;color:#1a1a1a">{{ zone.name }}</span>
              <span :style="`font-size:11px;font-weight:600;padding:2px 10px;border-radius:20px;${zone.isActive ? 'background:#dcfce7;color:#16a34a' : 'background:#f3f4f6;color:#9ca3af'}`">
                {{ zone.isActive ? 'Active' : 'Inactive' }}
              </span>
            </div>
            <p style="font-size:13px;color:#6b7280;margin:0 0 12px;max-width:420px">{{ zone.description }}</p>
            <!-- Area tags -->
            <div style="display:flex;flex-wrap:wrap;gap:6px">
              <span v-for="area in zone.areas" :key="area"
                :style="`font-size:12px;color:${zone.color};background:${zone.color}15;border:1px solid ${zone.color}33;border-radius:6px;padding:3px 10px;font-weight:500`">
                {{ area }}
              </span>
              <span v-if="zone.areas.length === 0" style="font-size:12px;color:#9ca3af;font-style:italic">No areas defined</span>
            </div>
          </div>
        </div>

        <!-- Middle: stats -->
        <div style="display:flex;gap:28px;align-items:center;flex-shrink:0">
          <div style="text-align:center">
            <p style="font-size:11px;color:#9ca3af;margin:0 0 4px;font-weight:500;text-transform:uppercase;letter-spacing:0.5px">Customers</p>
            <p style="font-size:20px;font-weight:700;color:#1a1a1a;margin:0">{{ zone.customerCount }}</p>
          </div>
          <div style="text-align:center">
            <p style="font-size:11px;color:#9ca3af;margin:0 0 4px;font-weight:500;text-transform:uppercase;letter-spacing:0.5px">Drivers</p>
            <p style="font-size:20px;font-weight:700;color:#1a1a1a;margin:0">{{ zone.driverCount }}</p>
          </div>
          <div style="text-align:center">
            <p style="font-size:11px;color:#9ca3af;margin:0 0 4px;font-weight:500;text-transform:uppercase;letter-spacing:0.5px">Areas</p>
            <p style="font-size:20px;font-weight:700;color:#1a1a1a;margin:0">{{ zone.areas.length }}</p>
          </div>
        </div>

        <!-- Right: actions -->
        <div style="display:flex;gap:8px;align-items:center;flex-shrink:0">
          <button @click="toggleActive(zone)"
            :style="`display:flex;align-items:center;gap:6px;background:${zone.isActive ? '#fef2f2' : '#dcfce7'};color:${zone.isActive ? '#ef4444' : '#16a34a'};border:none;border-radius:8px;padding:8px 14px;font-size:13px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer`">
            <Icon :name="zone.isActive ? 'lucide:pause-circle' : 'lucide:play-circle'" style="width:14px;height:14px" />
            {{ zone.isActive ? 'Deactivate' : 'Activate' }}
          </button>
          <button @click="openEdit(zone)" style="display:flex;align-items:center;gap:6px;background:#ececec;color:#1a1a1a;border:none;border-radius:8px;padding:8px 14px;font-size:13px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer">
            <Icon name="lucide:pencil" style="width:14px;height:14px" />
            Edit
          </button>
          <button @click="openDelete(zone)" :disabled="zone.customerCount > 0"
            :style="`display:flex;align-items:center;gap:6px;background:${zone.customerCount > 0 ? '#f5f5f5' : '#fef2f2'};color:${zone.customerCount > 0 ? '#9ca3af' : '#ef4444'};border:none;border-radius:8px;padding:8px 14px;font-size:13px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${zone.customerCount > 0 ? 'not-allowed' : 'pointer'}`">
            <Icon name="lucide:trash-2" style="width:14px;height:14px" />
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="filtered.length === 0" style="background:#fff;border-radius:16px;border:1px solid #f0f0f0;padding:60px 24px;text-align:center">
      <Icon name="lucide:map" style="width:40px;height:40px;color:#d1d5db;margin-bottom:12px" />
      <p style="font-size:15px;font-weight:600;color:#1a1a1a;margin:0 0 6px">No zones found</p>
      <p style="font-size:13px;color:#6b7280;margin:0 0 20px">Try adjusting your filters or create a new zone.</p>
      <button @click="openAdd" style="background:#ffb400;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer">Add Zone</button>
    </div>

    <!-- Pagination -->
    <AppPagination
      v-if="filtered.length > 0"
      :page="currentPage"
      :total="filtered.length"
      :per-page="perPage"
      @update:page="currentPage = $event"
    />

    <!-- ── ADD MODAL ── -->
    <AddZoneModal v-if="showAddModal" ref="addModalRef" @close="showAddModal = false" @submit="handleAdd" />

    <!-- ── EDIT MODAL ── -->
    <EditZoneModal v-if="showEditModal && editTarget" ref="editModalRef" :zone="editTarget" @close="showEditModal = false" @submit="handleEdit" />

    <!-- ── DELETE MODAL ── -->
    <DeleteZoneModal
      v-if="showDeleteModal && deleteTarget"
      :zone-name="deleteTarget.name"
      @close="showDeleteModal = false; deleteTarget = null"
      @confirm="handleDelete"
    />

  </div>
</template>
