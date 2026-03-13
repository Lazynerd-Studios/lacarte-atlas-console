<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

type BillingType = 'prepaid' | 'postpaid'
type BillingCycle = 'monthly' | 'quarterly' | 'yearly'

interface Plan {
  id: number
  name: string
  description: string
  billingType: BillingType
  billingCycle: BillingCycle
  pickupCount: number
  binCount: number
  color: string
  subscriberCount: number
  isActive: boolean
}

const { format } = useCurrency()

const activeTab = ref<BillingType>('prepaid')

const plans = ref<Plan[]>([
  { id: 1, name: 'Basic', description: 'Standard residential pickup plan.', billingType: 'prepaid', billingCycle: 'monthly', pickupCount: 8, binCount: 1, color: '#6b7280', subscriberCount: 142, isActive: true },
  { id: 2, name: 'Standard', description: 'More frequent pickups for busy households.', billingType: 'prepaid', billingCycle: 'monthly', pickupCount: 16, binCount: 1, color: '#3b82f6', subscriberCount: 58, isActive: true },
  { id: 3, name: 'Premium', description: 'Full-service plan with daily pickups.', billingType: 'prepaid', billingCycle: 'monthly', pickupCount: 30, binCount: 2, color: '#8b5cf6', subscriberCount: 23, isActive: true },
  { id: 4, name: 'Business', description: 'Commercial postpaid plan billed at end of cycle.', billingType: 'postpaid', billingCycle: 'monthly', pickupCount: 20, binCount: 3, color: '#f97316', subscriberCount: 34, isActive: true },
  { id: 5, name: 'Enterprise', description: 'Large-scale postpaid plan for industrial clients.', billingType: 'postpaid', billingCycle: 'monthly', pickupCount: 60, binCount: 5, color: '#ef4444', subscriberCount: 11, isActive: false },
])

const visiblePlans = computed(() => plans.value.filter(p => p.billingType === activeTab.value))

const totalSubscribers = computed(() => visiblePlans.value.reduce((s, p) => s + p.subscriberCount, 0))
const activePlans = computed(() => visiblePlans.value.filter(p => p.isActive).length)
const totalRevenue = computed(() => visiblePlans.value.reduce((s, p) => s + p.subscriberCount, 0))

const cycleLabel = (c: BillingCycle) => ({ monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly' }[c])

// ── shared form factory ──
function blankForm() {
  return {
    name: '', description: '',
    billingCycle: 'monthly' as BillingCycle,
    pickupCount: '', binCount: '',
    color: '#3b82f6', isActive: true,
  }
}

// ── Add modal ──
const showAddModal = ref(false)
const addForm = ref(blankForm())
const addError = ref('')

function openAdd() {
  addForm.value = blankForm()
  addError.value = ''
  showAddModal.value = true
}

function handleAdd() {
  if (!addForm.value.name.trim()) { addError.value = 'Plan name is required.'; return }
  if (!addForm.value.pickupCount || isNaN(Number(addForm.value.pickupCount))) { addError.value = 'Valid pickup count is required.'; return }
  if (!addForm.value.binCount || isNaN(Number(addForm.value.binCount))) { addError.value = 'Valid BIN count is required.'; return }
  plans.value.push({
    id: Date.now(),
    name: addForm.value.name.trim(),
    description: addForm.value.description.trim(),
    billingType: activeTab.value,
    billingCycle: addForm.value.billingCycle,
    pickupCount: Number(addForm.value.pickupCount),
    binCount: Number(addForm.value.binCount),
    color: addForm.value.color,
    subscriberCount: 0,
    isActive: addForm.value.isActive,
  })
  showAddModal.value = false
}

// ── Edit modal ──
const showEditModal = ref(false)
const editForm = ref<Plan & { pickupStr: string; binStr: string }>({
  id: 0, name: '', description: '', billingType: 'prepaid', billingCycle: 'monthly',
  pickupCount: 0, binCount: 0, color: '#3b82f6', subscriberCount: 0, isActive: true,
  pickupStr: '', binStr: '',
})
const editError = ref('')

function openEdit(p: Plan) {
  editForm.value = { ...p, pickupStr: String(p.pickupCount), binStr: String(p.binCount) }
  editError.value = ''
  showEditModal.value = true
}

function handleEdit() {
  if (!editForm.value.name.trim()) { editError.value = 'Plan name is required.'; return }
  if (!editForm.value.pickupStr || isNaN(Number(editForm.value.pickupStr))) { editError.value = 'Valid pickup amount is required.'; return }
  if (!editForm.value.binStr || isNaN(Number(editForm.value.binStr))) { editError.value = 'Valid BIN amount is required.'; return }
  const idx = plans.value.findIndex(p => p.id === editForm.value.id)
  if (idx !== -1) {
    plans.value[idx] = {
      ...plans.value[idx]!,
      name: editForm.value.name.trim(),
      description: editForm.value.description.trim(),
      billingCycle: editForm.value.billingCycle,
      pickupCount: Number(editForm.value.pickupStr),
      binCount: Number(editForm.value.binStr),
      color: editForm.value.color,
      isActive: editForm.value.isActive,
    }
  }
  showEditModal.value = false
}

// ── Delete modal ──
const showDeleteModal = ref(false)
const deleteTarget = ref<Plan | null>(null)

function openDelete(p: Plan) { deleteTarget.value = p; showDeleteModal.value = true }
function handleDelete() {
  if (deleteTarget.value) plans.value = plans.value.filter(p => p.id !== deleteTarget.value!.id)
  showDeleteModal.value = false; deleteTarget.value = null
}

function toggleActive(p: Plan) {
  const idx = plans.value.findIndex(x => x.id === p.id)
  if (idx !== -1) plans.value[idx]!.isActive = !plans.value[idx]!.isActive
}

const colorOptions = ['#6b7280','#3b82f6','#8b5cf6','#f97316','#22c55e','#ef4444','#ffb400','#ec4899','#14b8a6']
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:32px;font-family:'Manrope',sans-serif">

    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
      <div>
        <h1 style="font-size:28px;font-weight:700;color:#111;margin:0;line-height:1.3">Subscription Plans</h1>
        <p style="font-size:14px;color:#6b7280;margin:6px 0 0">Manage subscription tiers and pricing</p>
      </div>
      <button @click="openAdd" style="display:flex;align-items:center;gap:8px;background:#ffb400;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer">
        <Icon name="lucide:plus" style="width:16px;height:16px" />
        Add Plan
      </button>
    </div>

    <!-- Tabs -->
    <div style="display:flex;gap:4px;background:#f3f4f6;border-radius:12px;padding:4px;width:fit-content">
      <button @click="activeTab='prepaid'"
        :style="`padding:8px 24px;border:none;border-radius:9px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer;transition:all 0.15s;${activeTab==='prepaid' ? 'background:#fff;color:#1a1a1a;box-shadow:0 1px 4px rgba(0,0,0,0.1)' : 'background:transparent;color:#6b7280'}`">
        Prepaid
      </button>
      <button @click="activeTab='postpaid'"
        :style="`padding:8px 24px;border:none;border-radius:9px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer;transition:all 0.15s;${activeTab==='postpaid' ? 'background:#fff;color:#1a1a1a;box-shadow:0 1px 4px rgba(0,0,0,0.1)' : 'background:transparent;color:#6b7280'}`">
        Postpaid
      </button>
    </div>

    <!-- Stats -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px">
      <div style="background:#fff;border-radius:16px;padding:20px 24px;border:1px solid #f0f0f0">
        <p style="font-size:12px;color:#6b7280;margin:0 0 6px;font-weight:500">Total Plans</p>
        <p style="font-size:28px;font-weight:700;color:#1a1a1a;margin:0">{{ visiblePlans.length }}</p>
        <p style="font-size:11px;color:#9ca3af;margin:4px 0 0">{{ activePlans }} active</p>
      </div>
      <div style="background:#fff;border-radius:16px;padding:20px 24px;border:1px solid #f0f0f0">
        <p style="font-size:12px;color:#6b7280;margin:0 0 6px;font-weight:500">Subscribers</p>
        <p style="font-size:28px;font-weight:700;color:#1a1a1a;margin:0">{{ totalSubscribers }}</p>
        <p style="font-size:11px;color:#9ca3af;margin:4px 0 0">on {{ activeTab }} plans</p>
      </div>
      <div style="background:#fff;border-radius:16px;padding:20px 24px;border:1px solid #f0f0f0">
        <p style="font-size:12px;color:#6b7280;margin:0 0 6px;font-weight:500">Est. Revenue</p>
        <p style="font-size:28px;font-weight:700;color:#1a1a1a;margin:0">{{ format(totalRevenue) }}</p>
        <p style="font-size:11px;color:#9ca3af;margin:4px 0 0">monthly</p>
      </div>
    </div>

    <!-- Plans list -->
    <div style="display:flex;flex-direction:column;gap:16px">
      <div v-for="plan in visiblePlans" :key="plan.id"
        style="background:#fff;border-radius:16px;border:1px solid #f0f0f0;padding:24px;display:flex;align-items:flex-start;justify-content:space-between;gap:20px;flex-wrap:wrap">

        <!-- Left: icon + info -->
        <div style="display:flex;align-items:flex-start;gap:16px;flex:1;min-width:220px">
          <div :style="`width:48px;height:48px;border-radius:14px;background:${plan.color}22;display:flex;align-items:center;justify-content:center;flex-shrink:0`">
            <Icon name="lucide:layers" :style="`width:20px;height:20px;color:${plan.color}`" />
          </div>
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;flex-wrap:wrap">
              <span style="font-size:16px;font-weight:700;color:#1a1a1a">{{ plan.name }}</span>
              <span :style="`background:${plan.color}22;color:${plan.color};font-size:11px;font-weight:600;padding:2px 10px;border-radius:20px`">{{ plan.subscriberCount }} subscribers</span>
              <span :style="`font-size:11px;font-weight:600;padding:2px 10px;border-radius:20px;${plan.isActive ? 'background:#dcfce7;color:#16a34a' : 'background:#f3f4f6;color:#9ca3af'}`">
                {{ plan.isActive ? 'Active' : 'Inactive' }}
              </span>
            </div>
            <p style="font-size:13px;color:#6b7280;margin:0 0 14px;max-width:420px">{{ plan.description }}</p>
            <!-- Predefined feature pills -->
            <div style="display:flex;flex-wrap:wrap;gap:8px">
              <div style="display:flex;align-items:center;gap:6px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:6px 12px">
                <Icon name="lucide:truck" style="width:13px;height:13px;color:#16a34a;flex-shrink:0" />
                <span style="font-size:12px;font-weight:600;color:#15803d">Pickups</span>
                <span style="font-size:12px;font-weight:700;color:#1a1a1a;margin-left:2px">{{ plan.pickupCount }}</span>
              </div>
              <div style="display:flex;align-items:center;gap:6px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:6px 12px">
                <Icon name="lucide:package" style="width:13px;height:13px;color:#2563eb;flex-shrink:0" />
                <span style="font-size:12px;font-weight:600;color:#1d4ed8">BINs</span>
                <span style="font-size:12px;font-weight:700;color:#1a1a1a;margin-left:2px">{{ plan.binCount }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Middle: total + cycle -->
        <div style="text-align:center;flex-shrink:0">
          <p style="font-size:11px;color:#9ca3af;margin:0 0 4px;font-weight:500;text-transform:uppercase;letter-spacing:0.5px">{{ cycleLabel(plan.billingCycle) }}</p>
          <p style="font-size:11px;color:#9ca3af;margin:4px 0 0;text-transform:capitalize">{{ plan.billingType }}</p>
        </div>

        <!-- Right: actions -->
        <div style="display:flex;gap:8px;align-items:center;flex-shrink:0">
          <button @click="toggleActive(plan)"
            :style="`display:flex;align-items:center;gap:6px;background:${plan.isActive ? '#fef2f2' : '#dcfce7'};color:${plan.isActive ? '#ef4444' : '#16a34a'};border:none;border-radius:8px;padding:8px 14px;font-size:13px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer`">
            <Icon :name="plan.isActive ? 'lucide:pause-circle' : 'lucide:play-circle'" style="width:14px;height:14px" />
            {{ plan.isActive ? 'Deactivate' : 'Activate' }}
          </button>
          <button @click="openEdit(plan)" style="display:flex;align-items:center;gap:6px;background:#ececec;color:#1a1a1a;border:none;border-radius:8px;padding:8px 14px;font-size:13px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer">
            <Icon name="lucide:pencil" style="width:14px;height:14px" />
            Edit
          </button>
          <button @click="openDelete(plan)" :disabled="plan.subscriberCount > 0"
            :style="`display:flex;align-items:center;gap:6px;background:${plan.subscriberCount > 0 ? '#f5f5f5' : '#fef2f2'};color:${plan.subscriberCount > 0 ? '#9ca3af' : '#ef4444'};border:none;border-radius:8px;padding:8px 14px;font-size:13px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${plan.subscriberCount > 0 ? 'not-allowed' : 'pointer'}`">
            <Icon name="lucide:trash-2" style="width:14px;height:14px" />
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="visiblePlans.length === 0" style="background:#fff;border-radius:16px;border:1px solid #f0f0f0;padding:60px 24px;text-align:center">
      <Icon name="lucide:layers" style="width:40px;height:40px;color:#d1d5db;margin-bottom:12px" />
      <p style="font-size:15px;font-weight:600;color:#1a1a1a;margin:0 0 6px">No {{ activeTab }} plans yet</p>
      <p style="font-size:13px;color:#6b7280;margin:0 0 20px">Create your first {{ activeTab }} plan to get started.</p>
      <button @click="openAdd" style="background:#ffb400;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer">Add Plan</button>
    </div>

    <!-- ── ADD MODAL ── -->
    <div v-if="showAddModal" @click.self="showAddModal=false" style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px">
      <div style="background:#fff;border-radius:20px;width:100%;max-width:500px;max-height:90vh;overflow-y:auto">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #f0f0f0;position:sticky;top:0;background:#fff;z-index:1">
          <div>
            <h2 style="font-size:18px;font-weight:700;color:#1a1a1a;margin:0">Add {{ activeTab === 'prepaid' ? 'Prepaid' : 'Postpaid' }} Plan</h2>
            <p style="font-size:12px;color:#6b7280;margin:4px 0 0;text-transform:capitalize">{{ activeTab }} billing</p>
          </div>
          <button @click="showAddModal=false" style="background:none;border:none;cursor:pointer;color:#6b7280;padding:4px">
            <Icon name="lucide:x" style="width:20px;height:20px" />
          </button>
        </div>
        <div style="padding:24px;display:flex;flex-direction:column;gap:16px">
          <div v-if="addError" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;font-size:13px;color:#ef4444">{{ addError }}</div>
          <div>
            <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Plan Name <span style="color:#ef4444">*</span></label>
            <input v-model="addForm.name" placeholder="e.g. Standard" style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box" />
          </div>
          <div>
            <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Description</label>
            <textarea v-model="addForm.description" rows="2" placeholder="Brief description..." style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;resize:vertical;box-sizing:border-box"></textarea>
          </div>
          <!-- Predefined features -->
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:12px">
            <p style="font-size:13px;font-weight:600;color:#374151;margin:0">Pricing Features</p>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div>
                <label style="font-size:12px;font-weight:600;color:#374151;display:flex;align-items:center;gap:6px;margin-bottom:6px">
                  <Icon name="lucide:truck" style="width:13px;height:13px;color:#16a34a" />
                  Pickups <span style="color:#ef4444">*</span>
                </label>
                <input v-model="addForm.pickupCount" type="number" min="0" placeholder="e.g. 8" style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box;background:#fff" />
              </div>
              <div>
                <label style="font-size:12px;font-weight:600;color:#374151;display:flex;align-items:center;gap:6px;margin-bottom:6px">
                  <Icon name="lucide:package" style="width:13px;height:13px;color:#2563eb" />
                  BINs <span style="color:#ef4444">*</span>
                </label>
                <input v-model="addForm.binCount" type="number" min="0" placeholder="e.g. 1" style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box;background:#fff" />
              </div>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;padding-top:8px;border-top:1px solid #e5e7eb">
              <span style="font-size:12px;color:#6b7280;font-weight:500">Total pickups + BINs</span>
              <span style="font-size:15px;font-weight:700;color:#1a1a1a">{{ (Number(addForm.pickupCount) || 0) + (Number(addForm.binCount) || 0) }}</span>
            </div>
          </div>
          <div>
            <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Billing Cycle</label>
            <select v-model="addForm.billingCycle" style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box;background:#fff">
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div>
            <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:8px">Badge Color</label>
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
          <button @click="handleAdd" style="background:#ffb400;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer">Add Plan</button>
        </div>
      </div>
    </div>

    <!-- ── EDIT MODAL ── -->
    <div v-if="showEditModal" @click.self="showEditModal=false" style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px">
      <div style="background:#fff;border-radius:20px;width:100%;max-width:500px;max-height:90vh;overflow-y:auto">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #f0f0f0;position:sticky;top:0;background:#fff;z-index:1">
          <div>
            <h2 style="font-size:18px;font-weight:700;color:#1a1a1a;margin:0">Edit Plan</h2>
            <p style="font-size:12px;color:#6b7280;margin:4px 0 0;text-transform:capitalize">{{ editForm.billingType }} billing</p>
          </div>
          <button @click="showEditModal=false" style="background:none;border:none;cursor:pointer;color:#6b7280;padding:4px">
            <Icon name="lucide:x" style="width:20px;height:20px" />
          </button>
        </div>
        <div style="padding:24px;display:flex;flex-direction:column;gap:16px">
          <div v-if="editError" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;font-size:13px;color:#ef4444">{{ editError }}</div>
          <div>
            <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Plan Name <span style="color:#ef4444">*</span></label>
            <input v-model="editForm.name" style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box" />
          </div>
          <div>
            <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Description</label>
            <textarea v-model="editForm.description" rows="2" style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;resize:vertical;box-sizing:border-box"></textarea>
          </div>
          <!-- Predefined features -->
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:12px">
            <p style="font-size:13px;font-weight:600;color:#374151;margin:0">Pricing Features</p>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div>
                <label style="font-size:12px;font-weight:600;color:#374151;display:flex;align-items:center;gap:6px;margin-bottom:6px">
                  <Icon name="lucide:truck" style="width:13px;height:13px;color:#16a34a" />
                  Pickups <span style="color:#ef4444">*</span>
                </label>
                <input v-model="editForm.pickupStr" type="number" min="0" style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box;background:#fff" />
              </div>
              <div>
                <label style="font-size:12px;font-weight:600;color:#374151;display:flex;align-items:center;gap:6px;margin-bottom:6px">
                  <Icon name="lucide:package" style="width:13px;height:13px;color:#2563eb" />
                  BINs <span style="color:#ef4444">*</span>
                </label>
                <input v-model="editForm.binStr" type="number" min="0" style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box;background:#fff" />
              </div>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;padding-top:8px;border-top:1px solid #e5e7eb">
              <span style="font-size:12px;color:#6b7280;font-weight:500">Total pickups + BINs</span>
              <span style="font-size:15px;font-weight:700;color:#1a1a1a">{{ (Number(editForm.pickupStr) || 0) + (Number(editForm.binStr) || 0) }}</span>
            </div>
          </div>
          <div>
            <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Billing Cycle</label>
            <select v-model="editForm.billingCycle" style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box;background:#fff">
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div>
            <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:8px">Badge Color</label>
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
          <h2 style="font-size:18px;font-weight:700;color:#1a1a1a;margin:0">Delete Plan</h2>
          <button @click="showDeleteModal=false" style="background:none;border:none;cursor:pointer;color:#6b7280;padding:4px">
            <Icon name="lucide:x" style="width:20px;height:20px" />
          </button>
        </div>
        <div style="padding:28px 24px;text-align:center">
          <div style="width:56px;height:56px;border-radius:50%;background:#fef2f2;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
            <Icon name="lucide:trash-2" style="width:24px;height:24px;color:#ef4444" />
          </div>
          <p style="font-size:15px;font-weight:600;color:#1a1a1a;margin:0 0 8px">Delete "{{ deleteTarget?.name }}"?</p>
          <p style="font-size:13px;color:#6b7280;margin:0">This action cannot be undone. The plan will be permanently removed.</p>
        </div>
        <div style="padding:16px 24px;border-top:1px solid #f0f0f0;display:flex;justify-content:flex-end;gap:10px">
          <button @click="showDeleteModal=false" style="background:#ececec;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer">Cancel</button>
          <button @click="handleDelete" style="background:#ef4444;color:#fff;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer">Delete</button>
        </div>
      </div>
    </div>

  </div>
</template>
