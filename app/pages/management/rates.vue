<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

interface CustomerType {
  id: string                     // UUID instead of number
  name: string
  color?: string                 // Optional color (hex color)
}

interface Rate {
  id: string                     // UUID instead of number
  customerTypeId: string         // UUID
  customerType?: {               // Nested customer type object
    id: string
    name: string
  }
  rate: number                   // Changed from pickupRate
  effectiveDate: string
  note: string
  isActive: boolean
  status?: string                // API includes status
  createdAt: string
  updatedAt?: string             // API includes updatedAt
}

const { format } = useCurrency()

// State management
const customerTypes = ref<CustomerType[]>([])
const rates = ref<Rate[]>([])
const loading = ref(false)

const stats = ref({
  totalRates: 0,
  activeRates: 0,
  upcomingRates: 0,
  customerTypes: 0,
})
const statsLoading = ref(false)

const filterType = ref<string | 'all'>('all')
const filterStatus = ref<'all' | 'active' | 'upcoming' | 'inactive'>('all')

const today = new Date().toISOString().split('T')[0]!

// ── API Integration ──

/**
 * Fetch pay-as-you-go rates from API
 * 
 * Error Handling:
 * - 401: Automatic redirect to login (handled by useApi)
 * - 403, 404, 500: Automatic error toast (handled by useErrorHandler)
 * - Network errors: Automatic error toast (handled by useErrorHandler)
 */
async function fetchRates() {
  loading.value = true
  const api = useApi()
  
  console.log('[Rates] Fetching rates from /rates/admin')
  const response = await api.get<{ rates: Rate[], total: number }>(
    '/rates/admin',
    'Failed to load rates'
  )
  
  if (response) {
    console.log('[Rates] Received rates:', response)
    rates.value = response.rates || []
  } else {
    console.error('[Rates] Failed to fetch rates')
  }
  
  loading.value = false
}

/**
 * Fetch rate dashboard statistics from API
 * 
 * Error Handling:
 * - 401: Automatic redirect to login (handled by useApi)
 * - 403, 404, 500: Automatic error toast (handled by useErrorHandler)
 * - Network errors: Automatic error toast (handled by useErrorHandler)
 */
async function fetchStats() {
  statsLoading.value = true
  const api = useApi()
  
  console.log('[Rates] Fetching stats from /rates/admin/stats')
  const response = await api.get<{
    totalRates: number
    activeRates: number
    upcomingRates: number
    customerTypes: number
  }>(
    '/rates/admin/stats',
    'Failed to load statistics'
  )
  
  if (response) {
    console.log('[Rates] Received stats:', response)
    stats.value = {
      totalRates: response.totalRates ?? 0,
      activeRates: response.activeRates ?? 0,
      upcomingRates: response.upcomingRates ?? 0,
      customerTypes: response.customerTypes ?? 0,
    }
  } else {
    console.error('[Rates] Failed to fetch stats')
  }
  
  statsLoading.value = false
}

/**
 * Fetch customer types from API
 * 
 * Error Handling:
 * - 401: Automatic redirect to login (handled by useApi)
 * - 403, 404, 500: Automatic error toast (handled by useErrorHandler)
 * - Network errors: Automatic error toast (handled by useErrorHandler)
 */
async function fetchCustomerTypes() {
  const api = useApi()
  
  console.log('[Rates] Fetching customer types from /customer/admin/types')
  const response = await api.get<{ data: CustomerType[] }>(
    '/customer/admin/types',
    'Failed to load customer types'
  )
  
  console.log('[Rates] Raw customer types response:', response)
  
  if (response) {
    // Check if response has a data property or if it's the array directly
    if (Array.isArray(response)) {
      console.log('[Rates] Response is array directly, using it')
      customerTypes.value = response
    } else if (response.data && Array.isArray(response.data)) {
      console.log('[Rates] Response has data property, using response.data')
      customerTypes.value = response.data
    } else {
      console.warn('[Rates] Unexpected response format:', response)
      customerTypes.value = []
    }
    console.log('[Rates] Customer types set to:', customerTypes.value)
  } else {
    console.error('[Rates] Failed to fetch customer types')
  }
}

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

function getType(rate: Rate): CustomerType {
  // If rate has nested customerType, use it
  if (rate.customerType) {
    return rate.customerType as CustomerType
  }
  // Otherwise, look it up from customerTypes array
  return customerTypes.value.find(t => t.id === rate.customerTypeId) || { id: '', name: 'Unknown', color: undefined }
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
const submitting = ref(false)

function openAdd() {
  addForm.value = { customerTypeId: '', pickupRate: '', effectiveDate: '', note: '', isActive: true }
  addError.value = ''
  showAddModal.value = true
}

/**
 * Handle add rate form submission with API integration
 * 
 * Flow:
 * 1. Client-side validation using validateForm()
 * 2. Transform form data to API payload using formToApiPayload()
 * 3. Send POST request to /api/rates/admin/payg
 * 4. Handle 400 validation errors in modal
 * 5. Success flow: show toast, close modal, refresh data
 * 
 * Error Handling:
 * - Validation errors: Display in modal using addError ref
 * - 400 API errors: Display in modal using addError ref
 * - Other errors: Automatic error toast (handled by useErrorHandler)
 */
async function handleAdd() {
  // Client-side validation
  const { validateForm, formToApiPayload } = await import('~/utils/rateValidation')
  const errors = validateForm(addForm.value, false)
  
  if (errors.length > 0) {
    addError.value = errors[0] || 'Validation error'
    console.warn('[Rates] Add validation failed:', errors)
    return
  }

  submitting.value = true
  addError.value = ''

  try {
    const api = useApi()
    const toast = useAppToast()
    const payload = formToApiPayload(addForm.value)
    
    console.log('[Rates] Creating rate with payload:', payload)
    
    // Use raw request to handle 400 validation errors in modal
    const response = await api.request<Rate>(
      '/rates/admin',
      { method: 'POST', body: JSON.stringify(payload) }
    )

    console.log('[Rates] Rate created successfully:', response)
    
    // Success flow: toast + close modal + refresh data
    toast.success('Rate created successfully')
    showAddModal.value = false
    await Promise.all([fetchRates(), fetchStats()])
  } catch (err: any) {
    console.error('[Rates] Failed to create rate:', err)
    
    // Handle 400 validation errors in modal
    const errorMessage = err?.message || 'Failed to create rate'
    
    if (errorMessage.toLowerCase().includes('invalid') || 
        errorMessage.toLowerCase().includes('required') ||
        errorMessage.toLowerCase().includes('validation')) {
      addError.value = errorMessage
    } else {
      // Other errors show as toast
      const toast = useAppToast()
      toast.error('Failed to create rate', errorMessage)
    }
  } finally {
    submitting.value = false
  }
}

// ── Edit modal ──
const showEditModal = ref(false)
const editForm = ref<Rate & { pickupStr: string }>({
  id: '', customerTypeId: '', rate: 0, effectiveDate: '', note: '', isActive: true, createdAt: '', pickupStr: '',
})
const editError = ref('')

function openEdit(r: Rate) {
  editForm.value = { ...r, pickupStr: String(r.rate) }
  editError.value = ''
  showEditModal.value = true
}

/**
 * Handle edit rate form submission with API integration
 * 
 * Flow:
 * 1. Client-side validation using validateForm()
 * 2. Transform form data to API payload
 * 3. Send PATCH request to /api/rates/admin/payg/{id}
 * 4. Handle 400 validation errors in modal
 * 5. Success flow: show toast, close modal, refresh data
 * 
 * Error Handling:
 * - Validation errors: Display in modal using editError ref
 * - 400 API errors: Display in modal using editError ref
 * - Other errors: Automatic error toast (handled by useErrorHandler)
 */
async function handleEdit() {
  // Client-side validation
  const { validateForm } = await import('~/utils/rateValidation')
  
  // Create form data compatible with validateForm (using pickupStr as pickupRate)
  const formData = {
    customerTypeId: String(editForm.value.customerTypeId),
    pickupRate: editForm.value.pickupStr,
    effectiveDate: editForm.value.effectiveDate,
    note: editForm.value.note,
    isActive: editForm.value.isActive,
  }
  
  const errors = validateForm(formData, true) // isEdit = true (customer type not required)
  
  if (errors.length > 0) {
    editError.value = errors[0] || 'Validation error'
    console.warn('[Rates] Edit validation failed:', errors)
    return
  }

  submitting.value = true
  editError.value = ''

  try {
    const api = useApi()
    const toast = useAppToast()
    
    // Transform form data to API payload
    const payload = {
      rate: Number(editForm.value.pickupStr),        // API uses 'rate' field
      effectiveDate: editForm.value.effectiveDate,
      note: editForm.value.note.trim(),
      isActive: editForm.value.isActive,
    }
    
    console.log('[Rates] Updating rate', editForm.value.id, 'with payload:', payload)
    
    // Send PATCH request to update rate
    const response = await api.patch<Rate>(
      `/rates/admin/${editForm.value.id}`,
      payload,
      'Failed to update rate'
    )

    if (response) {
      console.log('[Rates] Rate updated successfully:', response)
      
      // Success flow: toast + close modal + refresh data
      toast.success('Rate updated successfully')
      showEditModal.value = false
      await fetchRates()
    }
  } catch (err: any) {
    console.error('[Rates] Failed to update rate:', err)
    
    // Handle 400 validation errors in modal
    const errorMessage = err?.message || 'Failed to update rate'
    
    if (errorMessage.toLowerCase().includes('invalid') || 
        errorMessage.toLowerCase().includes('required') ||
        errorMessage.toLowerCase().includes('validation')) {
      editError.value = errorMessage
    } else {
      // Other errors show as toast (handled by useErrorHandler)
      const toast = useAppToast()
      toast.error('Failed to update rate', errorMessage)
    }
  } finally {
    submitting.value = false
  }
}

// ── Delete modal ──
const showDeleteModal = ref(false)
const deleteTarget = ref<Rate | null>(null)
const deleting = ref(false)

function openDelete(r: Rate) { deleteTarget.value = r; showDeleteModal.value = true }

/**
 * Handle delete rate operation with API integration
 * 
 * Flow:
 * 1. Send DELETE request to /api/rates/admin/payg/{id}
 * 2. Success flow: show toast, close modal, refresh data
 * 
 * Error Handling:
 * - All errors: Automatic error toast (handled by useErrorHandler)
 */
async function handleDelete() {
  if (!deleteTarget.value) return
  
  deleting.value = true
  const api = useApi()
  const toast = useAppToast()
  
  console.log('[Rates] Deleting rate:', deleteTarget.value.id)
  
  const response = await api.del<{ message: string }>(
    `/rates/admin/${deleteTarget.value.id}`,
    'Failed to delete rate'
  )
  
  if (response) {
    console.log('[Rates] Rate deleted successfully:', response)
    
    // Success flow: toast + close modal + refresh data
    toast.success('Rate deleted successfully')
    showDeleteModal.value = false
    deleteTarget.value = null
    await Promise.all([fetchRates(), fetchStats()])
  } else {
    console.error('[Rates] Failed to delete rate')
  }
  
  deleting.value = false
}

const activeCount  = computed(() => rates.value.filter(r => rateStatus(r) === 'active').length)
const upcomingCount = computed(() => rates.value.filter(r => rateStatus(r) === 'upcoming').length)

// ── Lifecycle Hooks ──

// Fetch data on mount
onMounted(async () => {
  await Promise.all([fetchRates(), fetchStats(), fetchCustomerTypes()])
})

</script>

<style scoped>
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: pulse 1.5s ease-in-out infinite;
  border-radius: 8px;
}
</style>

<template>
  <div style="display:flex;flex-direction:column;gap:32px;font-family:'Manrope',sans-serif">

    <!-- Show PageSkeleton during initial load -->
    <PageSkeleton v-if="loading && rates.length === 0" type="card-grid" :cards="3" />

    <!-- Main content (shown after initial load) -->
    <template v-else>
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div>
          <h1 style="font-size:28px;font-weight:700;color:#111;margin:0;line-height:1.3">Rate Management</h1>
          <p style="font-size:14px;color:#6b7280;margin:6px 0 0">Pay-as-you-go pickup rates by customer type</p>
        </div>
        <button @click="openAdd" :disabled="submitting || deleting"
          :style="`display:flex;align-items:center;gap:8px;background:#ffb400;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${submitting || deleting ? 'not-allowed' : 'pointer'};opacity:${submitting || deleting ? '0.5' : '1'}`">
          <Icon name="lucide:plus" style="width:16px;height:16px" />
          Add Rate
        </button>
      </div>

      <!-- Stats -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:16px">
        <!-- Show loading placeholders when statsLoading is true -->
        <template v-if="statsLoading">
          <div v-for="i in 4" :key="i" style="background:#fff;border-radius:16px;padding:20px 24px;border:1px solid #f0f0f0">
            <div class="skeleton" style="height:12px;width:80px;margin-bottom:10px"></div>
            <div class="skeleton" style="height:28px;width:60px"></div>
          </div>
        </template>
        <!-- Show actual stats when loaded -->
        <template v-else>
          <div style="background:#fff;border-radius:16px;padding:20px 24px;border:1px solid #f0f0f0">
            <p style="font-size:12px;color:#6b7280;margin:0 0 6px;font-weight:500">Total Rates</p>
            <p style="font-size:28px;font-weight:700;color:#1a1a1a;margin:0">{{ stats.totalRates }}</p>
          </div>
          <div style="background:#fff;border-radius:16px;padding:20px 24px;border:1px solid #f0f0f0">
            <p style="font-size:12px;color:#6b7280;margin:0 0 6px;font-weight:500">Active</p>
            <p style="font-size:28px;font-weight:700;color:#16a34a;margin:0">{{ stats.activeRates }}</p>
          </div>
          <div style="background:#fff;border-radius:16px;padding:20px 24px;border:1px solid #f0f0f0">
            <p style="font-size:12px;color:#6b7280;margin:0 0 6px;font-weight:500">Upcoming</p>
            <p style="font-size:28px;font-weight:700;color:#ca8a04;margin:0">{{ stats.upcomingRates }}</p>
          </div>
          <div style="background:#fff;border-radius:16px;padding:20px 24px;border:1px solid #f0f0f0">
            <p style="font-size:12px;color:#6b7280;margin:0 0 6px;font-weight:500">Customer Types</p>
            <p style="font-size:28px;font-weight:700;color:#1a1a1a;margin:0">{{ stats.customerTypes }}</p>
          </div>
        </template>
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
                <span :style="`width:10px;height:10px;border-radius:50%;background:${getType(r).color || '#ccc'};flex-shrink:0;display:inline-block`"></span>
                <span style="font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ getType(r).name }}</span>
              </div>
            </td>
            <!-- Rate -->
            <td style="padding:16px 20px">
              <span style="font-size:15px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ format(r.rate) }}</span>
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
                <button @click="openEdit(r)" :disabled="submitting || deleting"
                  :style="`display:flex;align-items:center;gap:5px;background:#ececec;color:#1a1a1a;border:none;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${submitting || deleting ? 'not-allowed' : 'pointer'};opacity:${submitting || deleting ? '0.5' : '1'}`">
                  <Icon name="lucide:pencil" style="width:13px;height:13px" />
                  Edit
                </button>
                <button @click="openDelete(r)" :disabled="submitting || deleting"
                  :style="`display:flex;align-items:center;gap:5px;background:#fef2f2;color:#ef4444;border:none;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${submitting || deleting ? 'not-allowed' : 'pointer'};opacity:${submitting || deleting ? '0.5' : '1'}`">
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
          <button @click="showAddModal=false" :disabled="submitting" 
            :style="`background:#ececec;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${submitting ? 'not-allowed' : 'pointer'};opacity:${submitting ? '0.5' : '1'}`">Cancel</button>
          <button @click="handleAdd" :disabled="submitting" 
            :style="`background:#ffb400;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${submitting ? 'not-allowed' : 'pointer'};display:flex;align-items:center;gap:8px;opacity:${submitting ? '0.8' : '1'}`">
            <Icon v-if="submitting" name="lucide:loader-2" style="width:14px;height:14px;animation:spin 1s linear infinite" />
            {{ submitting ? 'Creating...' : 'Add Rate' }}
          </button>
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
              <span :style="`width:8px;height:8px;border-radius:50%;background:${getType(editForm).color || '#ccc'};display:inline-block`"></span>
              <span style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">{{ getType(editForm).name }}</span>
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
          <button @click="showEditModal=false" :disabled="submitting" 
            :style="`background:#ececec;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${submitting ? 'not-allowed' : 'pointer'};opacity:${submitting ? '0.5' : '1'}`">Cancel</button>
          <button @click="handleEdit" :disabled="submitting" 
            :style="`background:#ffb400;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${submitting ? 'not-allowed' : 'pointer'};display:flex;align-items:center;gap:8px;opacity:${submitting ? '0.8' : '1'}`">
            <Icon v-if="submitting" name="lucide:loader-2" style="width:14px;height:14px;animation:spin 1s linear infinite" />
            {{ submitting ? 'Saving...' : 'Save Changes' }}
          </button>
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
            Delete {{ deleteTarget ? getType(deleteTarget).name : '' }} rate?
          </p>
          <p style="font-size:13px;color:#6b7280;margin:0">This action cannot be undone.</p>
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
