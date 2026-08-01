<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

interface CapacityTier {
  id: string
  capacityLiters: number
  prepayRate: number
  postpayRate: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface TruckLoadTier {
  id: string
  label: string
  prepayRate: number
  postpayRate: number
  binEquivalent: number
  displayOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const { format } = useCurrency()

// ── State ──
const activeTab = ref<'capacity' | 'truck'>('capacity')
const capacityTiers = ref<CapacityTier[]>([])
const truckTiers = ref<TruckLoadTier[]>([])
const loading = ref(false)

// ── API Integration ──

async function fetchCapacityTiers() {
  const api = useApi()
  console.log('[Rates] Fetching capacity tiers from /rates/admin/capacity')
  const response = await api.get<{ tiers: CapacityTier[], total: number }>(
    '/rates/admin/capacity?includeInactive=true',
    'Failed to load capacity tiers'
  )
  if (response) {
    capacityTiers.value = (response.tiers || []).sort((a, b) => a.capacityLiters - b.capacityLiters)
  }
}

async function fetchTruckTiers() {
  const api = useApi()
  console.log('[Rates] Fetching truck load tiers from /rates/admin/truck-loads')
  const response = await api.get<{ tiers: TruckLoadTier[], total: number }>(
    '/rates/admin/truck-loads?includeInactive=true',
    'Failed to load truck load tiers'
  )
  if (response) {
    truckTiers.value = (response.tiers || []).sort((a, b) => a.displayOrder - b.displayOrder)
  }
}

async function fetchAll() {
  loading.value = true
  await Promise.all([fetchCapacityTiers(), fetchTruckTiers()])
  loading.value = false
}

// ── Stats ──
const capacityActive = computed(() => capacityTiers.value.filter(t => t.isActive).length)
const truckActive = computed(() => truckTiers.value.filter(t => t.isActive).length)
const totalInactive = computed(() =>
  capacityTiers.value.filter(t => !t.isActive).length + truckTiers.value.filter(t => !t.isActive).length
)

// ── Capacity tier modal ──
const showCapacityModal = ref(false)
const capacityModalMode = ref<'add' | 'edit'>('add')
const capacityForm = ref({ id: '', capacityLiters: '', prepayRate: '', postpayRate: '', isActive: true })
const capacityError = ref('')
const submitting = ref(false)

function openAddCapacity() {
  capacityModalMode.value = 'add'
  capacityForm.value = { id: '', capacityLiters: '', prepayRate: '', postpayRate: '', isActive: true }
  capacityError.value = ''
  showCapacityModal.value = true
}

function openEditCapacity(t: CapacityTier) {
  capacityModalMode.value = 'edit'
  capacityForm.value = {
    id: t.id,
    capacityLiters: String(t.capacityLiters),
    prepayRate: String(t.prepayRate),
    postpayRate: String(t.postpayRate),
    isActive: t.isActive,
  }
  capacityError.value = ''
  showCapacityModal.value = true
}

function validateCapacityForm(): string | null {
  const cap = Number(capacityForm.value.capacityLiters)
  const prepay = Number(capacityForm.value.prepayRate)
  const postpay = Number(capacityForm.value.postpayRate)
  if (!capacityForm.value.capacityLiters || isNaN(cap) || cap <= 0) return 'Capacity (liters) must be a positive number.'
  if (!capacityForm.value.prepayRate || isNaN(prepay) || prepay < 0) return 'Prepay rate must be a valid amount.'
  if (!capacityForm.value.postpayRate || isNaN(postpay) || postpay < 0) return 'Postpay rate must be a valid amount.'
  return null
}

async function handleCapacitySubmit() {
  const error = validateCapacityForm()
  if (error) { capacityError.value = error; return }

  submitting.value = true
  capacityError.value = ''
  const api = useApi()
  const toast = useAppToast()

  try {
    if (capacityModalMode.value === 'add') {
      await api.request<CapacityTier>('/rates/admin/capacity', {
        method: 'POST',
        body: JSON.stringify({
          capacityLiters: Number(capacityForm.value.capacityLiters),
          prepayRate: Number(capacityForm.value.prepayRate),
          postpayRate: Number(capacityForm.value.postpayRate),
          isActive: capacityForm.value.isActive,
        }),
      })
      toast.success('Capacity tier created successfully')
    } else {
      await api.request<CapacityTier>(`/rates/admin/capacity/${capacityForm.value.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          capacityLiters: Number(capacityForm.value.capacityLiters),
          prepayRate: Number(capacityForm.value.prepayRate),
          postpayRate: Number(capacityForm.value.postpayRate),
          isActive: capacityForm.value.isActive,
        }),
      })
      toast.success('Capacity tier updated successfully')
    }
    showCapacityModal.value = false
    await fetchCapacityTiers()
  } catch (err: any) {
    capacityError.value = err?.message || 'Failed to save capacity tier'
  } finally {
    submitting.value = false
  }
}

// ── Truck load tier modal ──
const showTruckModal = ref(false)
const truckModalMode = ref<'add' | 'edit'>('add')
const truckForm = ref({ id: '', label: '', prepayRate: '', postpayRate: '', binEquivalent: '', displayOrder: '0', isActive: true })
const truckError = ref('')

function openAddTruck() {
  truckModalMode.value = 'add'
  truckForm.value = { id: '', label: '', prepayRate: '', postpayRate: '', binEquivalent: '', displayOrder: '0', isActive: true }
  truckError.value = ''
  showTruckModal.value = true
}

function openEditTruck(t: TruckLoadTier) {
  truckModalMode.value = 'edit'
  truckForm.value = {
    id: t.id,
    label: t.label,
    prepayRate: String(t.prepayRate),
    postpayRate: String(t.postpayRate),
    binEquivalent: String(t.binEquivalent),
    displayOrder: String(t.displayOrder),
    isActive: t.isActive,
  }
  truckError.value = ''
  showTruckModal.value = true
}

function validateTruckForm(): string | null {
  const prepay = Number(truckForm.value.prepayRate)
  const postpay = Number(truckForm.value.postpayRate)
  const binEq = Number(truckForm.value.binEquivalent)
  if (!truckForm.value.label.trim()) return 'Label is required.'
  if (!truckForm.value.prepayRate || isNaN(prepay) || prepay < 0) return 'Prepay rate must be a valid amount.'
  if (!truckForm.value.postpayRate || isNaN(postpay) || postpay < 0) return 'Postpay rate must be a valid amount.'
  if (!truckForm.value.binEquivalent || isNaN(binEq) || binEq <= 0) return 'Bin equivalent must be a positive number.'
  return null
}

async function handleTruckSubmit() {
  const error = validateTruckForm()
  if (error) { truckError.value = error; return }

  submitting.value = true
  truckError.value = ''
  const api = useApi()
  const toast = useAppToast()

  try {
    if (truckModalMode.value === 'add') {
      await api.request<TruckLoadTier>('/rates/admin/truck-loads', {
        method: 'POST',
        body: JSON.stringify({
          label: truckForm.value.label.trim(),
          prepayRate: Number(truckForm.value.prepayRate),
          postpayRate: Number(truckForm.value.postpayRate),
          binEquivalent: Number(truckForm.value.binEquivalent),
          displayOrder: Number(truckForm.value.displayOrder) || 0,
          isActive: truckForm.value.isActive,
        }),
      })
      toast.success('Truck load tier created successfully')
    } else {
      await api.request<TruckLoadTier>(`/rates/admin/truck-loads/${truckForm.value.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          label: truckForm.value.label.trim(),
          prepayRate: Number(truckForm.value.prepayRate),
          postpayRate: Number(truckForm.value.postpayRate),
          binEquivalent: Number(truckForm.value.binEquivalent),
          displayOrder: Number(truckForm.value.displayOrder) || 0,
          isActive: truckForm.value.isActive,
        }),
      })
      toast.success('Truck load tier updated successfully')
    }
    showTruckModal.value = false
    await fetchTruckTiers()
  } catch (err: any) {
    truckError.value = err?.message || 'Failed to save truck load tier'
  } finally {
    submitting.value = false
  }
}

// ── Toggle active ──
async function toggleActive(tier: CapacityTier | TruckLoadTier) {
  const api = useApi()
  const toast = useAppToast()
  const isCapacity = 'capacityLiters' in tier
  const path = isCapacity ? `/rates/admin/capacity/${tier.id}` : `/rates/admin/truck-loads/${tier.id}`

  const result = await api.patch(path, { isActive: !tier.isActive }, 'Failed to update tier status')
  if (result) {
    toast.success(tier.isActive ? 'Tier deactivated' : 'Tier activated')
    await (isCapacity ? fetchCapacityTiers() : fetchTruckTiers())
  }
}

// ── Delete modal ──
const showDeleteModal = ref(false)
const deleteTarget = ref<CapacityTier | TruckLoadTier | null>(null)
const deleting = ref(false)

function openDelete(tier: CapacityTier | TruckLoadTier) {
  deleteTarget.value = tier
  showDeleteModal.value = true
}

function deleteTargetLabel(): string {
  if (!deleteTarget.value) return ''
  return 'capacityLiters' in deleteTarget.value
    ? `${deleteTarget.value.capacityLiters}L tier`
    : `"${deleteTarget.value.label}"`
}

async function handleDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  const api = useApi()
  const toast = useAppToast()
  const isCapacity = 'capacityLiters' in deleteTarget.value
  const path = isCapacity ? `/rates/admin/capacity/${deleteTarget.value.id}` : `/rates/admin/truck-loads/${deleteTarget.value.id}`

  try {
    await api.request(path, { method: 'DELETE' })
    toast.success('Tier deleted successfully')
    showDeleteModal.value = false
    deleteTarget.value = null
    await (isCapacity ? fetchCapacityTiers() : fetchTruckTiers())
  } catch (err: any) {
    // 409 blocked deletes show the server message as a toast
    toast.error('Cannot delete', err?.message || 'This tier is in use. Deactivate it instead.')
    showDeleteModal.value = false
    deleteTarget.value = null
  } finally {
    deleting.value = false
  }
}

function openAddTier() {
  if (activeTab.value === 'capacity') openAddCapacity()
  else openAddTruck()
}

// ── Lifecycle ──
onMounted(() => {
  fetchAll()
})
</script>

<style scoped>
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: pulse 1.5s ease-in-out infinite;
  border-radius: 8px;
}
.tooltip-wrap { position: relative; display: inline-flex; }
.tooltip-wrap .tooltip-text {
  visibility: hidden; opacity: 0; position: absolute; bottom: 130%; left: 50%; transform: translateX(-50%);
  background: #1a1a1a; color: #fff; font-size: 11px; font-weight: 500; padding: 6px 10px; border-radius: 8px;
  white-space: nowrap; z-index: 10; transition: opacity 0.15s; pointer-events: none;
  font-family: 'Manrope', sans-serif;
}
.tooltip-wrap:hover .tooltip-text { visibility: visible; opacity: 1; }
</style>

<template>
  <div style="display:flex;flex-direction:column;gap:32px;font-family:'Manrope',sans-serif">

    <!-- Loading skeleton -->
    <div v-if="loading && capacityTiers.length === 0 && truckTiers.length === 0" style="display:flex;flex-direction:column;gap:32px">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div>
          <div class="skeleton" style="height:28px;width:220px;margin-bottom:6px" />
          <div class="skeleton" style="height:14px;width:320px" />
        </div>
        <div class="skeleton" style="height:40px;width:120px;border-radius:10px" />
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:16px">
        <div v-for="i in 4" :key="i" style="background:#fff;border-radius:16px;padding:20px 24px;border:1px solid #f0f0f0">
          <div class="skeleton" style="height:12px;width:80px;margin-bottom:10px" />
          <div class="skeleton" style="height:28px;width:60px" />
        </div>
      </div>
      <div style="background:#fff;border-radius:16px;border:1px solid #f0f0f0;overflow:hidden">
        <div v-for="i in 4" :key="i" style="display:flex;gap:20px;padding:18px 24px;border-bottom:1px solid #f0f0f0">
          <div class="skeleton" style="height:16px;width:100px" />
          <div class="skeleton" style="height:16px;width:90px" />
          <div class="skeleton" style="height:16px;width:90px" />
          <div class="skeleton" style="height:20px;width:70px;border-radius:20px;margin-left:auto" />
        </div>
      </div>
    </div>

    <!-- Main content -->
    <template v-else>
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div>
          <h1 style="font-size:28px;font-weight:700;color:#111;margin:0;line-height:1.3">Rate Management</h1>
          <p style="font-size:14px;color:#6b7280;margin:6px 0 0">Capacity tiers and truck load tiers for pickup pricing</p>
        </div>
        <button @click="openAddTier" :disabled="submitting || deleting"
          :style="`display:flex;align-items:center;gap:8px;background:#ffb400;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${submitting || deleting ? 'not-allowed' : 'pointer'};opacity:${submitting || deleting ? '0.5' : '1'}`">
          <Icon name="lucide:plus" style="width:16px;height:16px" />
          Add Tier
        </button>
      </div>

      <!-- Stats -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:16px">
        <div style="background:#fff;border-radius:16px;padding:20px 24px;border:1px solid #f0f0f0">
          <p style="font-size:12px;color:#6b7280;margin:0 0 6px;font-weight:500">Capacity Tiers</p>
          <p style="font-size:28px;font-weight:700;color:#1a1a1a;margin:0">{{ capacityTiers.length }}</p>
        </div>
        <div style="background:#fff;border-radius:16px;padding:20px 24px;border:1px solid #f0f0f0">
          <p style="font-size:12px;color:#6b7280;margin:0 0 6px;font-weight:500">Truck Load Tiers</p>
          <p style="font-size:28px;font-weight:700;color:#1a1a1a;margin:0">{{ truckTiers.length }}</p>
        </div>
        <div style="background:#fff;border-radius:16px;padding:20px 24px;border:1px solid #f0f0f0">
          <p style="font-size:12px;color:#6b7280;margin:0 0 6px;font-weight:500">Active</p>
          <p style="font-size:28px;font-weight:700;color:#16a34a;margin:0">{{ capacityActive + truckActive }}</p>
        </div>
        <div style="background:#fff;border-radius:16px;padding:20px 24px;border:1px solid #f0f0f0">
          <p style="font-size:12px;color:#6b7280;margin:0 0 6px;font-weight:500">Inactive</p>
          <p style="font-size:28px;font-weight:700;color:#9ca3af;margin:0">{{ totalInactive }}</p>
        </div>
      </div>

      <!-- Tabs -->
      <div style="display:flex;align-items:center;gap:4px;background:#fff;border:1px solid #f0f0f0;border-radius:12px;padding:4px;width:fit-content">
        <button @click="activeTab = 'capacity'"
          :style="`padding:9px 20px;border:none;border-radius:9px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer;transition:all 0.15s;${activeTab === 'capacity' ? 'background:#ffb400;color:#1a1a1a' : 'background:transparent;color:#6b7280'}`">
          Capacity Tiers
        </button>
        <button @click="activeTab = 'truck'"
          :style="`padding:9px 20px;border:none;border-radius:9px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer;transition:all 0.15s;${activeTab === 'truck' ? 'background:#ffb400;color:#1a1a1a' : 'background:transparent;color:#6b7280'}`">
          Truck Load Tiers
        </button>
      </div>

      <!-- ── CAPACITY TIERS TABLE ── -->
      <div v-if="activeTab === 'capacity'" style="background:#fff;border-radius:16px;border:1px solid #f0f0f0;overflow:hidden">
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:#f8f9fa;border-bottom:1px solid #e5e7eb">
              <th style="padding:14px 20px;text-align:left;font-size:13px;font-weight:600;color:#374151;white-space:nowrap">Bin Capacity</th>
              <th style="padding:14px 20px;text-align:left;font-size:13px;font-weight:600;color:#374151;white-space:nowrap">Prepay Rate</th>
              <th style="padding:14px 20px;text-align:left;font-size:13px;font-weight:600;color:#374151;white-space:nowrap">Postpay Rate</th>
              <th style="padding:14px 20px;text-align:left;font-size:13px;font-weight:600;color:#374151;white-space:nowrap">Status</th>
              <th style="padding:14px 20px;text-align:right;font-size:13px;font-weight:600;color:#374151">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in capacityTiers" :key="t.id" style="border-bottom:1px solid #f0f0f0"
              @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
              @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'">
              <td style="padding:16px 20px">
                <span style="display:inline-flex;align-items:center;gap:6px;font-size:14px;font-weight:700;color:#1a1a1a">
                  <Icon name="lucide:trash-2" style="width:15px;height:15px;color:#6b7280" />
                  {{ t.capacityLiters }}L
                </span>
              </td>
              <td style="padding:16px 20px">
                <span style="font-size:15px;font-weight:700;color:#1a1a1a">{{ format(t.prepayRate) }}</span>
                <span style="font-size:12px;color:#9ca3af;margin-left:4px">/ pickup / bin</span>
              </td>
              <td style="padding:16px 20px">
                <span style="font-size:15px;font-weight:700;color:#1a1a1a">{{ format(t.postpayRate) }}</span>
                <span style="font-size:12px;color:#9ca3af;margin-left:4px">/ pickup / bin</span>
              </td>
              <td style="padding:16px 20px">
                <span :style="`font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;background:${t.isActive ? '#dcfce7' : '#f3f4f6'};color:${t.isActive ? '#16a34a' : '#9ca3af'}`">
                  {{ t.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td style="padding:16px 20px">
                <div style="display:flex;align-items:center;justify-content:flex-end;gap:6px">
                  <button @click="openEditCapacity(t)" :disabled="submitting || deleting"
                    :style="`display:flex;align-items:center;gap:5px;background:#ececec;color:#1a1a1a;border:none;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${submitting || deleting ? 'not-allowed' : 'pointer'};opacity:${submitting || deleting ? '0.5' : '1'}`">
                    <Icon name="lucide:pencil" style="width:13px;height:13px" />
                    Edit
                  </button>
                  <button @click="toggleActive(t)" :disabled="submitting || deleting"
                    :style="`display:flex;align-items:center;gap:5px;background:${t.isActive ? '#fef9c3' : '#dcfce7'};color:${t.isActive ? '#ca8a04' : '#16a34a'};border:none;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${submitting || deleting ? 'not-allowed' : 'pointer'};opacity:${submitting || deleting ? '0.5' : '1'}`">
                    <Icon :name="t.isActive ? 'lucide:power-off' : 'lucide:power'" style="width:13px;height:13px" />
                    {{ t.isActive ? 'Deactivate' : 'Activate' }}
                  </button>
                  <button @click="openDelete(t)" :disabled="submitting || deleting"
                    :style="`display:flex;align-items:center;gap:5px;background:#fef2f2;color:#ef4444;border:none;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${submitting || deleting ? 'not-allowed' : 'pointer'};opacity:${submitting || deleting ? '0.5' : '1'}`">
                    <Icon name="lucide:trash-2" style="width:13px;height:13px" />
                    Delete
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="capacityTiers.length === 0">
              <td colspan="5" style="padding:56px 20px;text-align:center">
                <Icon name="lucide:layers" style="width:36px;height:36px;color:#d1d5db;margin-bottom:10px" />
                <p style="font-size:14px;font-weight:600;color:#1a1a1a;margin:0 0 4px">No capacity tiers yet</p>
                <p style="font-size:13px;color:#6b7280;margin:0">Add your first bin capacity tier to get started.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ── TRUCK LOAD TIERS TABLE ── -->
      <div v-if="activeTab === 'truck'" style="background:#fff;border-radius:16px;border:1px solid #f0f0f0;overflow:hidden">
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:#f8f9fa;border-bottom:1px solid #e5e7eb">
              <th style="padding:14px 20px;text-align:left;font-size:13px;font-weight:600;color:#374151;white-space:nowrap">Label</th>
              <th style="padding:14px 20px;text-align:left;font-size:13px;font-weight:600;color:#374151;white-space:nowrap">Prepay Rate</th>
              <th style="padding:14px 20px;text-align:left;font-size:13px;font-weight:600;color:#374151;white-space:nowrap">Postpay Rate</th>
              <th style="padding:14px 20px;text-align:left;font-size:13px;font-weight:600;color:#374151;white-space:nowrap">Bin Equivalent</th>
              <th style="padding:14px 20px;text-align:left;font-size:13px;font-weight:600;color:#374151;white-space:nowrap">Order</th>
              <th style="padding:14px 20px;text-align:left;font-size:13px;font-weight:600;color:#374151;white-space:nowrap">Status</th>
              <th style="padding:14px 20px;text-align:right;font-size:13px;font-weight:600;color:#374151">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in truckTiers" :key="t.id" style="border-bottom:1px solid #f0f0f0"
              @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
              @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'">
              <td style="padding:16px 20px">
                <span style="display:inline-flex;align-items:center;gap:6px;font-size:14px;font-weight:700;color:#1a1a1a">
                  <Icon name="lucide:truck" style="width:15px;height:15px;color:#6b7280" />
                  {{ t.label }}
                </span>
              </td>
              <td style="padding:16px 20px">
                <span style="font-size:15px;font-weight:700;color:#1a1a1a">{{ format(t.prepayRate) }}</span>
                <span style="font-size:12px;color:#9ca3af;margin-left:4px">/ trip</span>
              </td>
              <td style="padding:16px 20px">
                <span style="font-size:15px;font-weight:700;color:#1a1a1a">{{ format(t.postpayRate) }}</span>
                <span style="font-size:12px;color:#9ca3af;margin-left:4px">/ trip</span>
              </td>
              <td style="padding:16px 20px">
                <span class="tooltip-wrap">
                  <span style="font-size:13px;font-weight:600;color:#374151;background:#f0f9ff;padding:3px 10px;border-radius:20px">{{ t.binEquivalent }}</span>
                  <span class="tooltip-text">Used internally to calculate driver pay. Quarter=100, Half=200, Full=400.</span>
                </span>
              </td>
              <td style="padding:16px 20px">
                <span style="font-size:13px;color:#6b7280">{{ t.displayOrder }}</span>
              </td>
              <td style="padding:16px 20px">
                <span :style="`font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;background:${t.isActive ? '#dcfce7' : '#f3f4f6'};color:${t.isActive ? '#16a34a' : '#9ca3af'}`">
                  {{ t.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td style="padding:16px 20px">
                <div style="display:flex;align-items:center;justify-content:flex-end;gap:6px">
                  <button @click="openEditTruck(t)" :disabled="submitting || deleting"
                    :style="`display:flex;align-items:center;gap:5px;background:#ececec;color:#1a1a1a;border:none;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${submitting || deleting ? 'not-allowed' : 'pointer'};opacity:${submitting || deleting ? '0.5' : '1'}`">
                    <Icon name="lucide:pencil" style="width:13px;height:13px" />
                    Edit
                  </button>
                  <button @click="toggleActive(t)" :disabled="submitting || deleting"
                    :style="`display:flex;align-items:center;gap:5px;background:${t.isActive ? '#fef9c3' : '#dcfce7'};color:${t.isActive ? '#ca8a04' : '#16a34a'};border:none;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${submitting || deleting ? 'not-allowed' : 'pointer'};opacity:${submitting || deleting ? '0.5' : '1'}`">
                    <Icon :name="t.isActive ? 'lucide:power-off' : 'lucide:power'" style="width:13px;height:13px" />
                    {{ t.isActive ? 'Deactivate' : 'Activate' }}
                  </button>
                  <button @click="openDelete(t)" :disabled="submitting || deleting"
                    :style="`display:flex;align-items:center;gap:5px;background:#fef2f2;color:#ef4444;border:none;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${submitting || deleting ? 'not-allowed' : 'pointer'};opacity:${submitting || deleting ? '0.5' : '1'}`">
                    <Icon name="lucide:trash-2" style="width:13px;height:13px" />
                    Delete
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="truckTiers.length === 0">
              <td colspan="7" style="padding:56px 20px;text-align:center">
                <Icon name="lucide:truck" style="width:36px;height:36px;color:#d1d5db;margin-bottom:10px" />
                <p style="font-size:14px;font-weight:600;color:#1a1a1a;margin:0 0 4px">No truck load tiers yet</p>
                <p style="font-size:13px;color:#6b7280;margin:0">Add your first truck load tier to get started.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ── CAPACITY TIER MODAL (Add/Edit) ── -->
      <div v-if="showCapacityModal" @click.self="showCapacityModal=false" style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px">
        <div style="background:#fff;border-radius:20px;width:100%;max-width:480px;overflow:hidden">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #f0f0f0">
            <h2 style="font-size:18px;font-weight:700;color:#1a1a1a;margin:0">{{ capacityModalMode === 'add' ? 'Add Capacity Tier' : 'Edit Capacity Tier' }}</h2>
            <button @click="showCapacityModal=false" style="background:none;border:none;cursor:pointer;color:#6b7280;padding:4px">
              <Icon name="lucide:x" style="width:20px;height:20px" />
            </button>
          </div>
          <div style="padding:24px;display:flex;flex-direction:column;gap:16px">
            <div v-if="capacityError" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;font-size:13px;color:#ef4444">{{ capacityError }}</div>

            <div>
              <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Capacity (Liters) <span style="color:#ef4444">*</span></label>
              <input v-model="capacityForm.capacityLiters" type="number" min="1" placeholder="e.g. 120, 240, 660, 1100" style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box" />
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div>
                <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Prepay Rate (GHS) <span style="color:#ef4444">*</span></label>
                <input v-model="capacityForm.prepayRate" type="number" min="0" step="0.01" placeholder="0.00" style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box" />
                <p style="font-size:11px;color:#9ca3af;margin:4px 0 0">Per pickup, per bin</p>
              </div>
              <div>
                <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Postpay Rate (GHS) <span style="color:#ef4444">*</span></label>
                <input v-model="capacityForm.postpayRate" type="number" min="0" step="0.01" placeholder="0.00" style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box" />
                <p style="font-size:11px;color:#9ca3af;margin:4px 0 0">Per pickup, per bin</p>
              </div>
            </div>

            <div style="display:flex;align-items:center;gap:10px">
              <button @click="capacityForm.isActive=!capacityForm.isActive"
                :style="`width:40px;height:22px;border-radius:11px;border:none;cursor:pointer;position:relative;background:${capacityForm.isActive ? '#22c55e' : '#d1d5db'}`">
                <span :style="`position:absolute;top:3px;width:16px;height:16px;border-radius:50%;background:#fff;left:${capacityForm.isActive ? '21px' : '3px'}`"></span>
              </button>
              <span style="font-size:13px;font-weight:600;color:#374151">Active</span>
            </div>

            <p style="font-size:12px;color:#9ca3af;margin:0;background:#f8f9fa;border-radius:8px;padding:10px 12px">
              Only one active tier per capacity — creating a new tier for an existing capacity auto-deactivates the old one.
            </p>
          </div>
          <div style="padding:16px 24px;border-top:1px solid #f0f0f0;display:flex;justify-content:flex-end;gap:10px">
            <button @click="showCapacityModal=false" :disabled="submitting"
              :style="`background:#ececec;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${submitting ? 'not-allowed' : 'pointer'};opacity:${submitting ? '0.5' : '1'}`">Cancel</button>
            <button @click="handleCapacitySubmit" :disabled="submitting"
              :style="`background:#ffb400;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${submitting ? 'not-allowed' : 'pointer'};display:flex;align-items:center;gap:8px;opacity:${submitting ? '0.8' : '1'}`">
              <Icon v-if="submitting" name="lucide:loader-2" style="width:14px;height:14px;animation:spin 1s linear infinite" />
              {{ submitting ? 'Saving...' : (capacityModalMode === 'add' ? 'Add Tier' : 'Save Changes') }}
            </button>
          </div>
        </div>
      </div>

      <!-- ── TRUCK LOAD TIER MODAL (Add/Edit) ── -->
      <div v-if="showTruckModal" @click.self="showTruckModal=false" style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px">
        <div style="background:#fff;border-radius:20px;width:100%;max-width:480px;overflow:hidden">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #f0f0f0">
            <h2 style="font-size:18px;font-weight:700;color:#1a1a1a;margin:0">{{ truckModalMode === 'add' ? 'Add Truck Load Tier' : 'Edit Truck Load Tier' }}</h2>
            <button @click="showTruckModal=false" style="background:none;border:none;cursor:pointer;color:#6b7280;padding:4px">
              <Icon name="lucide:x" style="width:20px;height:20px" />
            </button>
          </div>
          <div style="padding:24px;display:flex;flex-direction:column;gap:16px">
            <div v-if="truckError" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;font-size:13px;color:#ef4444">{{ truckError }}</div>

            <div>
              <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Label <span style="color:#ef4444">*</span></label>
              <input v-model="truckForm.label" type="text" placeholder='e.g. "Half Truck"' style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box" />
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div>
                <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Prepay Rate (GHS) <span style="color:#ef4444">*</span></label>
                <input v-model="truckForm.prepayRate" type="number" min="0" step="0.01" placeholder="0.00" style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box" />
                <p style="font-size:11px;color:#9ca3af;margin:4px 0 0">Flat per trip</p>
              </div>
              <div>
                <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Postpay Rate (GHS) <span style="color:#ef4444">*</span></label>
                <input v-model="truckForm.postpayRate" type="number" min="0" step="0.01" placeholder="0.00" style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box" />
                <p style="font-size:11px;color:#9ca3af;margin:4px 0 0">Flat per trip</p>
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div>
                <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Bin Equivalent <span style="color:#ef4444">*</span></label>
                <input v-model="truckForm.binEquivalent" type="number" min="1" placeholder="100 / 200 / 400" style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box" />
                <p style="font-size:11px;color:#9ca3af;margin:4px 0 0">Used internally to calculate driver pay. Quarter=100, Half=200, Full=400.</p>
              </div>
              <div>
                <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Display Order</label>
                <input v-model="truckForm.displayOrder" type="number" min="0" placeholder="0" style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box" />
                <p style="font-size:11px;color:#9ca3af;margin:4px 0 0">Sort order for mobile dropdown</p>
              </div>
            </div>

            <div style="display:flex;align-items:center;gap:10px">
              <button @click="truckForm.isActive=!truckForm.isActive"
                :style="`width:40px;height:22px;border-radius:11px;border:none;cursor:pointer;position:relative;background:${truckForm.isActive ? '#22c55e' : '#d1d5db'}`">
                <span :style="`position:absolute;top:3px;width:16px;height:16px;border-radius:50%;background:#fff;left:${truckForm.isActive ? '21px' : '3px'}`"></span>
              </button>
              <span style="font-size:13px;font-weight:600;color:#374151">Active</span>
            </div>
          </div>
          <div style="padding:16px 24px;border-top:1px solid #f0f0f0;display:flex;justify-content:flex-end;gap:10px">
            <button @click="showTruckModal=false" :disabled="submitting"
              :style="`background:#ececec;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${submitting ? 'not-allowed' : 'pointer'};opacity:${submitting ? '0.5' : '1'}`">Cancel</button>
            <button @click="handleTruckSubmit" :disabled="submitting"
              :style="`background:#ffb400;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${submitting ? 'not-allowed' : 'pointer'};display:flex;align-items:center;gap:8px;opacity:${submitting ? '0.8' : '1'}`">
              <Icon v-if="submitting" name="lucide:loader-2" style="width:14px;height:14px;animation:spin 1s linear infinite" />
              {{ submitting ? 'Saving...' : (truckModalMode === 'add' ? 'Add Tier' : 'Save Changes') }}
            </button>
          </div>
        </div>
      </div>

      <!-- ── DELETE MODAL ── -->
      <div v-if="showDeleteModal" @click.self="showDeleteModal=false" style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px">
        <div style="background:#fff;border-radius:20px;width:100%;max-width:400px;overflow:hidden">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #f0f0f0">
            <h2 style="font-size:18px;font-weight:700;color:#1a1a1a;margin:0">Delete Tier</h2>
            <button @click="showDeleteModal=false" style="background:none;border:none;cursor:pointer;color:#6b7280;padding:4px">
              <Icon name="lucide:x" style="width:20px;height:20px" />
            </button>
          </div>
          <div style="padding:28px 24px;text-align:center">
            <div style="width:56px;height:56px;border-radius:50%;background:#fef2f2;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
              <Icon name="lucide:trash-2" style="width:24px;height:24px;color:#ef4444" />
            </div>
            <p style="font-size:15px;font-weight:600;color:#1a1a1a;margin:0 0 8px">Delete {{ deleteTargetLabel() }}?</p>
            <p style="font-size:13px;color:#6b7280;margin:0">This action cannot be undone. If customers or pickup requests reference this tier, deletion will be blocked.</p>
          </div>
          <div style="padding:16px 24px;border-top:1px solid #f0f0f0;display:flex;justify-content:flex-end;gap:10px">
            <button @click="showDeleteModal=false" :disabled="deleting"
              :style="`background:#ececec;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${deleting ? 'not-allowed' : 'pointer'};opacity:${deleting ? '0.5' : '1'}`">Cancel</button>
            <button @click="handleDelete" :disabled="deleting"
              :style="`background:#ef4444;color:#fff;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${deleting ? 'not-allowed' : 'pointer'};display:flex;align-items:center;gap:8px;opacity:${deleting ? '0.8' : '1'}`">
              <Icon v-if="deleting" name="lucide:loader-2" style="width:14px;height:14px;animation:spin 1s linear infinite" />
              {{ deleting ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>

    </template>
  </div>
</template>
