<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

interface CustomerType {
  id: number
  name: string
  color: string
}

interface Rate {
  id: number
  customerTypeId: number
  pickupRate: number
  effectiveDate: string
  note: string
  isActive: boolean
  createdAt: string
}

const { format } = useCurrency()

const customerTypes = ref<CustomerType[]>([
  { id: 1, name: 'Regular',    color: '#6b7280' },
  { id: 2, name: 'Commercial', color: '#3b82f6' },
  { id: 3, name: 'Estate',     color: '#8b5cf6' },
  { id: 4, name: 'Industrial', color: '#f97316' },
])

const rates = ref<Rate[]>([
  { id: 1, customerTypeId: 1, pickupRate: 25,  effectiveDate: '2026-01-01', note: 'Standard residential rate.',         isActive: true,  createdAt: '2025-12-20' },
  { id: 2, customerTypeId: 2, pickupRate: 45,  effectiveDate: '2026-01-01', note: 'Commercial rate for Q1 2026.',       isActive: true,  createdAt: '2025-12-20' },
  { id: 3, customerTypeId: 3, pickupRate: 60,  effectiveDate: '2026-01-01', note: 'Estate bulk service rate.',          isActive: true,  createdAt: '2025-12-20' },
  { id: 4, customerTypeId: 4, pickupRate: 120, effectiveDate: '2026-01-01', note: 'Industrial specialized handling.',   isActive: true,  createdAt: '2025-12-20' },
  { id: 5, customerTypeId: 1, pickupRate: 28,  effectiveDate: '2026-04-01', note: 'Q2 rate adjustment for Regular.',   isActive: false, createdAt: '2026-02-10' },
  { id: 6, customerTypeId: 2, pickupRate: 50,  effectiveDate: '2026-04-01', note: 'Q2 rate adjustment for Commercial.', isActive: false, createdAt: '2026-02-10' },
])

const filterType = ref<number | 'all'>('all')
const filterStatus = ref<'all' | 'active' | 'upcoming' | 'inactive'>('all')

const today = new Date().toISOString().split('T')[0]!

function rateStatus(r: Rate) {
  if (!r.isActive) return 'inactive'
  if (r.effectiveDate > today) return 'upcoming'
  return 'active'
}

const filtered = computed(() => rates.value.filter(r => {
  const matchType = filterType.value === 'all' || r.customerTypeId === filterType.value
  const matchStatus = filterStatus.value === 'all' || rateStatus(r) === filterStatus.value
  return matchType && matchStatus
}))

function getType(id: number) {
  return customerTypes.value.find(t => t.id === id)!
}

function statusStyle(r: Rate) {
  const s = rateStatus(r)
  if (s === 'active')   return { bg: '#dcfce7', color: '#16a34a', label: 'Active' }
  if (s === 'upcoming') return { bg: '#fef9c3', color: '#ca8a04', label: 'Upcoming' }
  return { bg: '#f3f4f6', color: '#9ca3af', label: 'Inactive' }
}

// ── Add modal ──
const showAddModal = ref(false)
const addForm = ref({ customerTypeId: '', pickupRate: '', effectiveDate: '', note: '', isActive: true })
const addError = ref('')

function openAdd() {
  addForm.value = { customerTypeId: '', pickupRate: '', effectiveDate: '', note: '', isActive: true }
  addError.value = ''
  showAddModal.value = true
}

function handleAdd() {
  if (!addForm.value.customerTypeId) { addError.value = 'Customer type is required.'; return }
  if (!addForm.value.pickupRate || isNaN(Number(addForm.value.pickupRate))) { addError.value = 'Valid pickup rate is required.'; return }
  if (!addForm.value.effectiveDate) { addError.value = 'Effective date is required.'; return }
  rates.value.push({
    id: Date.now(),
    customerTypeId: Number(addForm.value.customerTypeId),
    pickupRate: Number(addForm.value.pickupRate),
    effectiveDate: addForm.value.effectiveDate,
    note: addForm.value.note.trim(),
    isActive: addForm.value.isActive,
    createdAt: today,
  })
  showAddModal.value = false
}

// ── Edit modal ──
const showEditModal = ref(false)
const editForm = ref<Rate & { pickupStr: string }>({
  id: 0, customerTypeId: 0, pickupRate: 0, effectiveDate: '', note: '', isActive: true, createdAt: '', pickupStr: '',
})
const editError = ref('')

function openEdit(r: Rate) {
  editForm.value = { ...r, pickupStr: String(r.pickupRate) }
  editError.value = ''
  showEditModal.value = true
}

function handleEdit() {
  if (!editForm.value.pickupStr || isNaN(Number(editForm.value.pickupStr))) { editError.value = 'Valid pickup rate is required.'; return }
  if (!editForm.value.effectiveDate) { editError.value = 'Effective date is required.'; return }
  const idx = rates.value.findIndex(r => r.id === editForm.value.id)
  if (idx !== -1) {
    rates.value[idx] = { ...rates.value[idx]!, pickupRate: Number(editForm.value.pickupStr), effectiveDate: editForm.value.effectiveDate, note: editForm.value.note.trim(), isActive: editForm.value.isActive }
  }
  showEditModal.value = false
}

// ── Delete modal ──
const showDeleteModal = ref(false)
const deleteTarget = ref<Rate | null>(null)

function openDelete(r: Rate) { deleteTarget.value = r; showDeleteModal.value = true }
function handleDelete() {
  if (deleteTarget.value) rates.value = rates.value.filter(r => r.id !== deleteTarget.value!.id)
  showDeleteModal.value = false; deleteTarget.value = null
}

const activeCount  = computed(() => rates.value.filter(r => rateStatus(r) === 'active').length)
const upcomingCount = computed(() => rates.value.filter(r => rateStatus(r) === 'upcoming').length)
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:32px;font-family:'Manrope',sans-serif">

    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
      <div>
        <h1 style="font-size:28px;font-weight:700;color:#111;margin:0;line-height:1.3">Rate Management</h1>
        <p style="font-size:14px;color:#6b7280;margin:6px 0 0">Pay-as-you-go pickup rates by customer type</p>
      </div>
      <button @click="openAdd" style="display:flex;align-items:center;gap:8px;background:#ffb400;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer">
        <Icon name="lucide:plus" style="width:16px;height:16px" />
        Add Rate
      </button>
    </div>

    <!-- Stats -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:16px">
      <div style="background:#fff;border-radius:16px;padding:20px 24px;border:1px solid #f0f0f0">
        <p style="font-size:12px;color:#6b7280;margin:0 0 6px;font-weight:500">Total Rates</p>
        <p style="font-size:28px;font-weight:700;color:#1a1a1a;margin:0">{{ rates.length }}</p>
      </div>
      <div style="background:#fff;border-radius:16px;padding:20px 24px;border:1px solid #f0f0f0">
        <p style="font-size:12px;color:#6b7280;margin:0 0 6px;font-weight:500">Active</p>
        <p style="font-size:28px;font-weight:700;color:#16a34a;margin:0">{{ activeCount }}</p>
      </div>
      <div style="background:#fff;border-radius:16px;padding:20px 24px;border:1px solid #f0f0f0">
        <p style="font-size:12px;color:#6b7280;margin:0 0 6px;font-weight:500">Upcoming</p>
        <p style="font-size:28px;font-weight:700;color:#ca8a04;margin:0">{{ upcomingCount }}</p>
      </div>
      <div style="background:#fff;border-radius:16px;padding:20px 24px;border:1px solid #f0f0f0">
        <p style="font-size:12px;color:#6b7280;margin:0 0 6px;font-weight:500">Customer Types</p>
        <p style="font-size:28px;font-weight:700;color:#1a1a1a;margin:0">{{ customerTypes.length }}</p>
      </div>
    </div>

    <!-- Filters -->
    <div style="background:#fff;border-radius:16px;border:1px solid #f0f0f0;padding:20px 24px;display:flex;gap:12px;flex-wrap:wrap;align-items:center">
      <!-- Type filter -->
      <div style="position:relative">
        <select v-model="filterType" style="height:38px;padding:0 36px 0 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:13px;font-family:'Manrope',sans-serif;color:#1a1a1a;outline:none;background:#fff;cursor:pointer;appearance:none;min-width:160px">
          <option value="all">All Customer Types</option>
          <option v-for="t in customerTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
        <Icon name="lucide:chevron-down" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);width:14px;height:14px;color:#6b7280;pointer-events:none" />
      </div>
      <!-- Status filter -->
      <div style="position:relative">
        <select v-model="filterStatus" style="height:38px;padding:0 36px 0 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:13px;font-family:'Manrope',sans-serif;color:#1a1a1a;outline:none;background:#fff;cursor:pointer;appearance:none;min-width:140px">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="upcoming">Upcoming</option>
          <option value="inactive">Inactive</option>
        </select>
        <Icon name="lucide:chevron-down" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);width:14px;height:14px;color:#6b7280;pointer-events:none" />
      </div>
      <span style="font-size:13px;color:#9ca3af;margin-left:auto">{{ filtered.length }} result{{ filtered.length !== 1 ? 's' : '' }}</span>
    </div>

    <!-- Table -->
    <div style="background:#fff;border-radius:16px;border:1px solid #f0f0f0;overflow:hidden">
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f8f9fa;border-bottom:1px solid #e5e7eb">
            <th style="padding:14px 20px;text-align:left;font-size:13px;font-weight:600;color:#374151;font-family:'Manrope',sans-serif;white-space:nowrap">Customer Type</th>
            <th style="padding:14px 20px;text-align:left;font-size:13px;font-weight:600;color:#374151;font-family:'Manrope',sans-serif;white-space:nowrap">Pickup Rate</th>
            <th style="padding:14px 20px;text-align:left;font-size:13px;font-weight:600;color:#374151;font-family:'Manrope',sans-serif;white-space:nowrap">Effective Date</th>
            <th style="padding:14px 20px;text-align:left;font-size:13px;font-weight:600;color:#374151;font-family:'Manrope',sans-serif;white-space:nowrap">Status</th>
            <th style="padding:14px 20px;text-align:left;font-size:13px;font-weight:600;color:#374151;font-family:'Manrope',sans-serif;white-space:nowrap">Note</th>
            <th style="padding:14px 20px;text-align:left;font-size:13px;font-weight:600;color:#374151;font-family:'Manrope',sans-serif;white-space:nowrap">Created</th>
            <th style="padding:14px 20px;text-align:right;font-size:13px;font-weight:600;color:#374151;font-family:'Manrope',sans-serif">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in filtered" :key="r.id" style="border-bottom:1px solid #f0f0f0"
            @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'">
            <!-- Customer type -->
            <td style="padding:16px 20px">
              <div style="display:flex;align-items:center;gap:10px">
                <span :style="`width:10px;height:10px;border-radius:50%;background:${getType(r.customerTypeId).color};flex-shrink:0;display:inline-block`"></span>
                <span style="font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ getType(r.customerTypeId).name }}</span>
              </div>
            </td>
            <!-- Rate -->
            <td style="padding:16px 20px">
              <span style="font-size:15px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ format(r.pickupRate) }}</span>
              <span style="font-size:12px;color:#9ca3af;font-family:'Manrope',sans-serif;margin-left:4px">/ pickup</span>
            </td>
            <!-- Effective date -->
            <td style="padding:16px 20px">
              <div style="display:flex;align-items:center;gap:6px">
                <Icon name="lucide:calendar" style="width:14px;height:14px;color:#6b7280;flex-shrink:0" />
                <span style="font-size:13px;color:#374151;font-family:'Manrope',sans-serif">{{ r.effectiveDate }}</span>
              </div>
            </td>
            <!-- Status -->
            <td style="padding:16px 20px">
              <span :style="`font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;font-family:'Manrope',sans-serif;background:${statusStyle(r).bg};color:${statusStyle(r).color}`">
                {{ statusStyle(r).label }}
              </span>
            </td>
            <!-- Note -->
            <td style="padding:16px 20px;max-width:240px">
              <span style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif">{{ r.note || '—' }}</span>
            </td>
            <!-- Created -->
            <td style="padding:16px 20px">
              <span style="font-size:13px;color:#9ca3af;font-family:'Manrope',sans-serif">{{ r.createdAt }}</span>
            </td>
            <!-- Actions -->
            <td style="padding:16px 20px">
              <div style="display:flex;align-items:center;justify-content:flex-end;gap:6px">
                <button @click="openEdit(r)"
                  style="display:flex;align-items:center;gap:5px;background:#ececec;color:#1a1a1a;border:none;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer">
                  <Icon name="lucide:pencil" style="width:13px;height:13px" />
                  Edit
                </button>
                <button @click="openDelete(r)"
                  style="display:flex;align-items:center;gap:5px;background:#fef2f2;color:#ef4444;border:none;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer">
                  <Icon name="lucide:trash-2" style="width:13px;height:13px" />
                  Delete
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="7" style="padding:56px 20px;text-align:center">
              <Icon name="lucide:percent" style="width:36px;height:36px;color:#d1d5db;margin-bottom:10px" />
              <p style="font-size:14px;font-weight:600;color:#1a1a1a;margin:0 0 4px;font-family:'Manrope',sans-serif">No rates found</p>
              <p style="font-size:13px;color:#6b7280;margin:0;font-family:'Manrope',sans-serif">Try adjusting your filters or add a new rate.</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── ADD MODAL ── -->
    <div v-if="showAddModal" @click.self="showAddModal=false" style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px">
      <div style="background:#fff;border-radius:20px;width:100%;max-width:480px;overflow:hidden">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #f0f0f0">
          <h2 style="font-size:18px;font-weight:700;color:#1a1a1a;margin:0">Add Pay-as-you-go Rate</h2>
          <button @click="showAddModal=false" style="background:none;border:none;cursor:pointer;color:#6b7280;padding:4px">
            <Icon name="lucide:x" style="width:20px;height:20px" />
          </button>
        </div>
        <div style="padding:24px;display:flex;flex-direction:column;gap:16px">
          <div v-if="addError" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;font-size:13px;color:#ef4444">{{ addError }}</div>

          <div>
            <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Customer Type <span style="color:#ef4444">*</span></label>
            <div style="position:relative">
              <select v-model="addForm.customerTypeId" style="width:100%;padding:10px 36px 10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;background:#fff;appearance:none;box-sizing:border-box;cursor:pointer">
                <option value="" disabled>Select customer type</option>
                <option v-for="t in customerTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
              </select>
              <Icon name="lucide:chevron-down" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);width:14px;height:14px;color:#6b7280;pointer-events:none" />
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div>
              <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Pickup Rate (GHS) <span style="color:#ef4444">*</span></label>
              <input v-model="addForm.pickupRate" type="number" min="0" placeholder="0.00" style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box" />
            </div>
            <div>
              <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Effective Date <span style="color:#ef4444">*</span></label>
              <input v-model="addForm.effectiveDate" type="date" style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box;background:#fff" />
            </div>
          </div>

          <div>
            <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Note</label>
            <textarea v-model="addForm.note" rows="2" placeholder="Optional note about this rate..." style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;resize:vertical;box-sizing:border-box"></textarea>
          </div>

          <div style="display:flex;align-items:center;gap:10px">
            <button @click="addForm.isActive=!addForm.isActive"
              :style="`width:40px;height:22px;border-radius:11px;border:none;cursor:pointer;position:relative;background:${addForm.isActive ? '#22c55e' : '#d1d5db'}`">
              <span :style="`position:absolute;top:3px;width:16px;height:16px;border-radius:50%;background:#fff;left:${addForm.isActive ? '21px' : '3px'}`"></span>
            </button>
            <span style="font-size:13px;font-weight:600;color:#374151">Active</span>
          </div>
        </div>
        <div style="padding:16px 24px;border-top:1px solid #f0f0f0;display:flex;justify-content:flex-end;gap:10px">
          <button @click="showAddModal=false" style="background:#ececec;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer">Cancel</button>
          <button @click="handleAdd" style="background:#ffb400;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer">Add Rate</button>
        </div>
      </div>
    </div>

    <!-- ── EDIT MODAL ── -->
    <div v-if="showEditModal" @click.self="showEditModal=false" style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px">
      <div style="background:#fff;border-radius:20px;width:100%;max-width:480px;overflow:hidden">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #f0f0f0">
          <div>
            <h2 style="font-size:18px;font-weight:700;color:#1a1a1a;margin:0">Edit Rate</h2>
            <div style="display:flex;align-items:center;gap:6px;margin-top:4px">
              <span :style="`width:8px;height:8px;border-radius:50%;background:${getType(editForm.customerTypeId).color};display:inline-block`"></span>
              <span style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">{{ getType(editForm.customerTypeId).name }}</span>
            </div>
          </div>
          <button @click="showEditModal=false" style="background:none;border:none;cursor:pointer;color:#6b7280;padding:4px">
            <Icon name="lucide:x" style="width:20px;height:20px" />
          </button>
        </div>
        <div style="padding:24px;display:flex;flex-direction:column;gap:16px">
          <div v-if="editError" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;font-size:13px;color:#ef4444">{{ editError }}</div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div>
              <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Pickup Rate (GHS) <span style="color:#ef4444">*</span></label>
              <input v-model="editForm.pickupStr" type="number" min="0" style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box" />
            </div>
            <div>
              <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Effective Date <span style="color:#ef4444">*</span></label>
              <input v-model="editForm.effectiveDate" type="date" style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box;background:#fff" />
            </div>
          </div>

          <div>
            <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Note</label>
            <textarea v-model="editForm.note" rows="2" style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;resize:vertical;box-sizing:border-box"></textarea>
          </div>

          <div style="display:flex;align-items:center;gap:10px">
            <button @click="editForm.isActive=!editForm.isActive"
              :style="`width:40px;height:22px;border-radius:11px;border:none;cursor:pointer;position:relative;background:${editForm.isActive ? '#22c55e' : '#d1d5db'}`">
              <span :style="`position:absolute;top:3px;width:16px;height:16px;border-radius:50%;background:#fff;left:${editForm.isActive ? '21px' : '3px'}`"></span>
            </button>
            <span style="font-size:13px;font-weight:600;color:#374151">Active</span>
          </div>
        </div>
        <div style="padding:16px 24px;border-top:1px solid #f0f0f0;display:flex;justify-content:flex-end;gap:10px">
          <button @click="showEditModal=false" style="background:#ececec;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer">Cancel</button>
          <button @click="handleEdit" style="background:#ffb400;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer">Save Changes</button>
        </div>
      </div>
    </div>

    <!-- ── DELETE MODAL ── -->
    <div v-if="showDeleteModal" @click.self="showDeleteModal=false" style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px">
      <div style="background:#fff;border-radius:20px;width:100%;max-width:400px;overflow:hidden">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #f0f0f0">
          <h2 style="font-size:18px;font-weight:700;color:#1a1a1a;margin:0">Delete Rate</h2>
          <button @click="showDeleteModal=false" style="background:none;border:none;cursor:pointer;color:#6b7280;padding:4px">
            <Icon name="lucide:x" style="width:20px;height:20px" />
          </button>
        </div>
        <div style="padding:28px 24px;text-align:center">
          <div style="width:56px;height:56px;border-radius:50%;background:#fef2f2;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
            <Icon name="lucide:trash-2" style="width:24px;height:24px;color:#ef4444" />
          </div>
          <p style="font-size:15px;font-weight:600;color:#1a1a1a;margin:0 0 8px">
            Delete {{ deleteTarget ? getType(deleteTarget.customerTypeId).name : '' }} rate?
          </p>
          <p style="font-size:13px;color:#6b7280;margin:0">This action cannot be undone.</p>
        </div>
        <div style="padding:16px 24px;border-top:1px solid #f0f0f0;display:flex;justify-content:flex-end;gap:10px">
          <button @click="showDeleteModal=false" style="background:#ececec;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer">Cancel</button>
          <button @click="handleDelete" style="background:#ef4444;color:#fff;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer">Delete</button>
        </div>
      </div>
    </div>

  </div>
</template>
