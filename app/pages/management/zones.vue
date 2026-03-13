<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

interface Zone {
  id: number
  name: string
  description: string
  color: string
  areas: string[]
  assignedDrivers: number
  customerCount: number
  isActive: boolean
}

const zones = ref<Zone[]>([
  { id: 1, name: 'Zone A – Central',   description: 'Downtown and central business district.',         color: '#3b82f6', areas: ['Downtown', 'Central Market', 'High Street'],          assignedDrivers: 3, customerCount: 87,  isActive: true },
  { id: 2, name: 'Zone B – Westside',  description: 'Western residential and commercial areas.',        color: '#22c55e', areas: ['Westlands', 'Kaneshie', 'Dansoman'],                   assignedDrivers: 2, customerCount: 64,  isActive: true },
  { id: 3, name: 'Zone C – Eastside',  description: 'Eastern suburbs and industrial belt.',             color: '#f97316', areas: ['Tema', 'Ashaiman', 'Community 1', 'Community 5'],      assignedDrivers: 4, customerCount: 112, isActive: true },
  { id: 4, name: 'Zone D – Northside', description: 'Northern outskirts and peri-urban communities.',   color: '#8b5cf6', areas: ['Achimota', 'Ofankor', 'Pokuase'],                     assignedDrivers: 2, customerCount: 43,  isActive: true },
  { id: 5, name: 'Zone E – Southside', description: 'Coastal and southern residential zones.',          color: '#ec4899', areas: ['Labadi', 'Teshie', 'Nungua'],                         assignedDrivers: 1, customerCount: 28,  isActive: false },
])

const search = ref('')
const filterStatus = ref<'all' | 'active' | 'inactive'>('all')

const filtered = computed(() => zones.value.filter(z => {
  const matchSearch = !search.value || z.name.toLowerCase().includes(search.value.toLowerCase()) || z.areas.some(a => a.toLowerCase().includes(search.value.toLowerCase()))
  const matchStatus = filterStatus.value === 'all' || (filterStatus.value === 'active' ? z.isActive : !z.isActive)
  return matchSearch && matchStatus
}))

const totalCustomers = computed(() => zones.value.reduce((s, z) => s + z.customerCount, 0))
const totalDrivers   = computed(() => zones.value.reduce((s, z) => s + z.assignedDrivers, 0))
const activeZones    = computed(() => zones.value.filter(z => z.isActive).length)

// ── Add modal ──
const showAddModal = ref(false)
const addForm = ref({ name: '', description: '', color: '#3b82f6', areasStr: '', isActive: true })
const addError = ref('')

function openAdd() {
  addForm.value = { name: '', description: '', color: '#3b82f6', areasStr: '', isActive: true }
  addError.value = ''
  showAddModal.value = true
}

function handleAdd() {
  if (!addForm.value.name.trim()) { addError.value = 'Zone name is required.'; return }
  zones.value.push({
    id: Date.now(),
    name: addForm.value.name.trim(),
    description: addForm.value.description.trim(),
    color: addForm.value.color,
    areas: addForm.value.areasStr.split('\n').map(a => a.trim()).filter(Boolean),
    assignedDrivers: 0,
    customerCount: 0,
    isActive: addForm.value.isActive,
  })
  showAddModal.value = false
}

// ── Edit modal ──
const showEditModal = ref(false)
const editForm = ref<Zone & { areasStr: string }>({
  id: 0, name: '', description: '', color: '#3b82f6', areas: [], areasStr: '',
  assignedDrivers: 0, customerCount: 0, isActive: true,
})
const editError = ref('')

function openEdit(z: Zone) {
  editForm.value = { ...z, areasStr: z.areas.join('\n') }
  editError.value = ''
  showEditModal.value = true
}

function handleEdit() {
  if (!editForm.value.name.trim()) { editError.value = 'Zone name is required.'; return }
  const idx = zones.value.findIndex(z => z.id === editForm.value.id)
  if (idx !== -1) {
    zones.value[idx] = {
      ...zones.value[idx]!,
      name: editForm.value.name.trim(),
      description: editForm.value.description.trim(),
      color: editForm.value.color,
      areas: editForm.value.areasStr.split('\n').map(a => a.trim()).filter(Boolean),
      isActive: editForm.value.isActive,
    }
  }
  showEditModal.value = false
}

// ── Delete modal ──
const showDeleteModal = ref(false)
const deleteTarget = ref<Zone | null>(null)

function openDelete(z: Zone) { deleteTarget.value = z; showDeleteModal.value = true }
function handleDelete() {
  if (deleteTarget.value) zones.value = zones.value.filter(z => z.id !== deleteTarget.value!.id)
  showDeleteModal.value = false; deleteTarget.value = null
}

function toggleActive(z: Zone) {
  const idx = zones.value.findIndex(x => x.id === z.id)
  if (idx !== -1) zones.value[idx]!.isActive = !zones.value[idx]!.isActive
}

const colorOptions = ['#3b82f6','#22c55e','#f97316','#8b5cf6','#ec4899','#ef4444','#14b8a6','#ffb400','#6b7280']
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:32px;font-family:'Manrope',sans-serif">

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
        <p style="font-size:28px;font-weight:700;color:#1a1a1a;margin:0">{{ zones.length }}</p>
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
      <div v-for="zone in filtered" :key="zone.id"
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
            <p style="font-size:20px;font-weight:700;color:#1a1a1a;margin:0">{{ zone.assignedDrivers }}</p>
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

    <!-- ── ADD MODAL ── -->
    <div v-if="showAddModal" @click.self="showAddModal=false" style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px">
      <div style="background:#fff;border-radius:20px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #f0f0f0;position:sticky;top:0;background:#fff;z-index:1">
          <h2 style="font-size:18px;font-weight:700;color:#1a1a1a;margin:0">Add Zone</h2>
          <button @click="showAddModal=false" style="background:none;border:none;cursor:pointer;color:#6b7280;padding:4px">
            <Icon name="lucide:x" style="width:20px;height:20px" />
          </button>
        </div>
        <div style="padding:24px;display:flex;flex-direction:column;gap:16px">
          <div v-if="addError" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;font-size:13px;color:#ef4444">{{ addError }}</div>
          <div>
            <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Zone Name <span style="color:#ef4444">*</span></label>
            <input v-model="addForm.name" placeholder="e.g. Zone A – Central" style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box" />
          </div>
          <div>
            <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Description</label>
            <textarea v-model="addForm.description" rows="2" placeholder="Brief description of this zone..." style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;resize:vertical;box-sizing:border-box"></textarea>
          </div>
          <div>
            <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Areas / Localities <span style="font-weight:400;color:#9ca3af">(one per line)</span></label>
            <textarea v-model="addForm.areasStr" rows="4" placeholder="Downtown&#10;Central Market&#10;High Street" style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;resize:vertical;box-sizing:border-box"></textarea>
          </div>
          <div>
            <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:8px">Zone Color</label>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button v-for="c in colorOptions" :key="c" @click="addForm.color=c"
                :style="`width:28px;height:28px;border-radius:50%;background:${c};border:${addForm.color===c ? '3px solid #1a1a1a' : '2px solid transparent'};cursor:pointer;outline:none`" />
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <button @click="addForm.isActive=!addForm.isActive"
              :style="`width:40px;height:22px;border-radius:11px;border:none;cursor:pointer;position:relative;background:${addForm.isActive ? '#22c55e' : '#d1d5db'}`">
              <span :style="`position:absolute;top:3px;width:16px;height:16px;border-radius:50%;background:#fff;left:${addForm.isActive ? '21px' : '3px'}`"></span>
            </button>
            <span style="font-size:13px;font-weight:600;color:#374151">Active</span>
          </div>
        </div>
        <div style="padding:16px 24px;border-top:1px solid #f0f0f0;display:flex;justify-content:flex-end;gap:10px;position:sticky;bottom:0;background:#fff">
          <button @click="showAddModal=false" style="background:#ececec;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer">Cancel</button>
          <button @click="handleAdd" style="background:#ffb400;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer">Add Zone</button>
        </div>
      </div>
    </div>

    <!-- ── EDIT MODAL ── -->
    <div v-if="showEditModal" @click.self="showEditModal=false" style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px">
      <div style="background:#fff;border-radius:20px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #f0f0f0;position:sticky;top:0;background:#fff;z-index:1">
          <h2 style="font-size:18px;font-weight:700;color:#1a1a1a;margin:0">Edit Zone</h2>
          <button @click="showEditModal=false" style="background:none;border:none;cursor:pointer;color:#6b7280;padding:4px">
            <Icon name="lucide:x" style="width:20px;height:20px" />
          </button>
        </div>
        <div style="padding:24px;display:flex;flex-direction:column;gap:16px">
          <div v-if="editError" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;font-size:13px;color:#ef4444">{{ editError }}</div>
          <div>
            <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Zone Name <span style="color:#ef4444">*</span></label>
            <input v-model="editForm.name" style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box" />
          </div>
          <div>
            <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Description</label>
            <textarea v-model="editForm.description" rows="2" style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;resize:vertical;box-sizing:border-box"></textarea>
          </div>
          <div>
            <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Areas / Localities <span style="font-weight:400;color:#9ca3af">(one per line)</span></label>
            <textarea v-model="editForm.areasStr" rows="4" style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;resize:vertical;box-sizing:border-box"></textarea>
          </div>
          <div>
            <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:8px">Zone Color</label>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button v-for="c in colorOptions" :key="c" @click="editForm.color=c"
                :style="`width:28px;height:28px;border-radius:50%;background:${c};border:${editForm.color===c ? '3px solid #1a1a1a' : '2px solid transparent'};cursor:pointer;outline:none`" />
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <button @click="editForm.isActive=!editForm.isActive"
              :style="`width:40px;height:22px;border-radius:11px;border:none;cursor:pointer;position:relative;background:${editForm.isActive ? '#22c55e' : '#d1d5db'}`">
              <span :style="`position:absolute;top:3px;width:16px;height:16px;border-radius:50%;background:#fff;left:${editForm.isActive ? '21px' : '3px'}`"></span>
            </button>
            <span style="font-size:13px;font-weight:600;color:#374151">Active</span>
          </div>
        </div>
        <div style="padding:16px 24px;border-top:1px solid #f0f0f0;display:flex;justify-content:flex-end;gap:10px;position:sticky;bottom:0;background:#fff">
          <button @click="showEditModal=false" style="background:#ececec;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer">Cancel</button>
          <button @click="handleEdit" style="background:#ffb400;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer">Save Changes</button>
        </div>
      </div>
    </div>

    <!-- ── DELETE MODAL ── -->
    <div v-if="showDeleteModal" @click.self="showDeleteModal=false" style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px">
      <div style="background:#fff;border-radius:20px;width:100%;max-width:400px;overflow:hidden">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #f0f0f0">
          <h2 style="font-size:18px;font-weight:700;color:#1a1a1a;margin:0">Delete Zone</h2>
          <button @click="showDeleteModal=false" style="background:none;border:none;cursor:pointer;color:#6b7280;padding:4px">
            <Icon name="lucide:x" style="width:20px;height:20px" />
          </button>
        </div>
        <div style="padding:28px 24px;text-align:center">
          <div style="width:56px;height:56px;border-radius:50%;background:#fef2f2;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
            <Icon name="lucide:trash-2" style="width:24px;height:24px;color:#ef4444" />
          </div>
          <p style="font-size:15px;font-weight:600;color:#1a1a1a;margin:0 0 8px">Delete "{{ deleteTarget?.name }}"?</p>
          <p style="font-size:13px;color:#6b7280;margin:0">This action cannot be undone. The zone will be permanently removed.</p>
        </div>
        <div style="padding:16px 24px;border-top:1px solid #f0f0f0;display:flex;justify-content:flex-end;gap:10px">
          <button @click="showDeleteModal=false" style="background:#ececec;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer">Cancel</button>
          <button @click="handleDelete" style="background:#ef4444;color:#fff;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer">Delete</button>
        </div>
      </div>
    </div>

  </div>
</template>
