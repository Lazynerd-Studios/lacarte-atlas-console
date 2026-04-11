<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

type BillingType = 'prepaid' | 'postpaid'
type BillingCycle = 'monthly' | 'quarterly' | 'yearly'

interface Plan {
  id: string
  name: string
  description: string
  billingType: BillingType
  billingCycle: BillingCycle
  pickupCount: number
  binCount: number
  price: number
  color: string
  subscriberCount: number
  isActive: boolean
}

// API response interface
interface ApiPlan {
  id: string
  name: string
  description: string
  type: BillingType
  pickups: number
  bins: number
  billingCycle: BillingCycle
  price: number
  badgeColor: string
  subscriberCount: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Form data interface for add/edit operations
interface FormData {
  name: string
  description: string
  billingCycle: BillingCycle
  pickupCount: string
  binCount: string
  price: string
  color: string
  isActive: boolean
}

// ── Data Transformation Utilities ──

/**
 * Convert API response to UI Plan format
 * Maps API field names to UI field names:
 * - type → billingType
 * - pickups → pickupCount
 * - bins → binCount
 * - badgeColor → color
 */
function apiToPlan(apiPlan: ApiPlan): Plan {
  return {
    id: apiPlan.id,
    name: apiPlan.name,
    description: apiPlan.description,
    billingType: apiPlan.type,
    billingCycle: apiPlan.billingCycle,
    pickupCount: apiPlan.pickups,
    binCount: apiPlan.bins,
    price: apiPlan.price,
    color: apiPlan.badgeColor,
    subscriberCount: apiPlan.subscriberCount,
    isActive: apiPlan.isActive,
  }
}

/**
 * Validate form data for add/edit operations
 * Returns array of validation error messages
 */
function validateForm(form: FormData): string[] {
  const errors: string[] = []
  
  // Validate plan name is non-empty
  if (!form.name.trim()) {
    errors.push('Plan name is required.')
  }
  
  // Validate pickup count is positive integer
  const pickupCount = Number(form.pickupCount)
  if (!form.pickupCount || isNaN(pickupCount) || pickupCount <= 0 || !Number.isInteger(pickupCount)) {
    errors.push('Valid pickup count is required.')
  }
  
  // Validate bin count is positive integer
  const binCount = Number(form.binCount)
  if (!form.binCount || isNaN(binCount) || binCount <= 0 || !Number.isInteger(binCount)) {
    errors.push('Valid BIN count is required.')
  }
  
  // Validate price is non-negative number
  const price = Number(form.price)
  if (!form.price || isNaN(price) || price < 0) {
    errors.push('Valid price is required.')
  }
  
  return errors
}

/**
 * Convert UI form data to API request payload
 * Maps UI field names to API field names:
 * - billingType → type
 * - pickupCount → pickups
 * - binCount → bins
 * - color → badgeColor
 */
function formToApiPayload(form: FormData, billingType: BillingType) {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    type: billingType,
    pickups: Number(form.pickupCount),
    bins: Number(form.binCount),
    billingCycle: form.billingCycle,
    price: Number(form.price),
    badgeColor: form.color,
    isActive: form.isActive,
  }
}

const { format } = useCurrency()

const activeTab = ref<BillingType>('prepaid')

// State management
const plans = ref<Plan[]>([])
const loading = ref(false)

const stats = ref({
  totalPlans: 0,
  activePlans: 0,
  totalSubscribers: 0,
  estimatedRevenue: 0,
})
const statsLoading = ref(false)

const visiblePlans = computed(() => plans.value.filter(p => p.billingType === activeTab.value))

const totalSubscribers = computed(() => stats.value.totalSubscribers)
const activePlans = computed(() => stats.value.activePlans)
const totalRevenue = computed(() => stats.value.estimatedRevenue)

// ── API Integration ──

/**
 * Fetch subscription plans from API
 * Filters by current billing type and transforms API response to UI format
 * 
 * Error Handling:
 * - 401: Automatic redirect to login (handled by useApi)
 * - 403, 404, 500: Automatic error toast (handled by useErrorHandler)
 * - Network errors: Automatic error toast (handled by useErrorHandler)
 */
async function fetchPlans() {
  console.log('[fetchPlans] Fetching plans for billing type:', activeTab.value)
  loading.value = true
  const api = useApi()
  
  const response = await api.get<{ data?: ApiPlan[]; plans?: ApiPlan[] } | ApiPlan[]>(
    `/subscription/admin/plans?type=${activeTab.value}`,
    'Failed to load plans'
  )
  
  if (response) {
    console.log('[fetchPlans] Raw response:', response)
    
    // Handle multiple response formats: { plans: [...] }, { data: [...] }, or [...]
    const plansData = Array.isArray(response) 
      ? response 
      : (response.plans || response.data || [])
    
    plans.value = plansData.map(apiToPlan)
    console.log('[fetchPlans] Loaded', plans.value.length, 'plans')
  } else {
    console.log('[fetchPlans] No response received')
  }
  
  loading.value = false
}

/**
 * Fetch subscription statistics from API
 * Filters by current billing type
 * 
 * Error Handling:
 * - 401: Automatic redirect to login (handled by useApi)
 * - 403, 404, 500: Automatic error toast (handled by useErrorHandler)
 * - Network errors: Automatic error toast (handled by useErrorHandler)
 */
async function fetchStats() {
  console.log('[fetchStats] Fetching stats for billing type:', activeTab.value)
  statsLoading.value = true
  const api = useApi()
  
  const response = await api.get<{
    totalPlans?: number
    total_plans?: number
    activePlans?: number
    active_plans?: number
    totalSubscribers?: number
    total_subscribers?: number
    subscribers?: number
    estimatedRevenue?: number | string
    estimated_revenue?: number | string
    revenue?: number | string
  }>(
    `/subscription/admin/stats?type=${activeTab.value}`,
    'Failed to load statistics'
  )
  
  if (response) {
    console.log('[fetchStats] Raw response:', response)
    
    // Map response to stats, handling different possible field names
    stats.value = {
      totalPlans: response.totalPlans ?? response.total_plans ?? 0,
      activePlans: response.activePlans ?? response.active_plans ?? 0,
      totalSubscribers: response.totalSubscribers ?? response.total_subscribers ?? response.subscribers ?? 0,
      estimatedRevenue: Number(response.estimatedRevenue ?? response.estimated_revenue ?? response.revenue ?? 0),
    }
    
    console.log('[fetchStats] Stats mapped:', stats.value)
  } else {
    console.log('[fetchStats] No response received')
  }
  
  statsLoading.value = false
}

const cycleLabel = (c: BillingCycle) => ({ monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly' }[c])

// ── Lifecycle Hooks ──

// Fetch data on mount
onMounted(async () => {
  console.log('[onMounted] Initializing subscription page')
  await Promise.all([fetchPlans(), fetchStats()])
})

// Watch for tab changes and refresh data
watch(activeTab, async (newTab, oldTab) => {
  console.log('[watch:activeTab] Tab changed from', oldTab, 'to', newTab)
  await Promise.all([fetchPlans(), fetchStats()])
})

// ── shared form factory ──
function blankForm() {
  return {
    name: '', description: '',
    billingCycle: 'monthly' as BillingCycle,
    pickupCount: '', binCount: '', price: '',
    color: '#3b82f6', isActive: true,
  }
}

// ── Add modal ──
const showAddModal = ref(false)
const addForm = ref(blankForm())
const addError = ref('')
const submitting = ref(false)

function openAdd() {
  console.log('[openAdd] Opening add plan modal for billing type:', activeTab.value)
  addForm.value = blankForm()
  addError.value = ''
  showAddModal.value = true
}

/**
 * Handle add plan form submission
 * 
 * Error Handling Strategy:
 * - Client-side validation errors: Display in modal (addError)
 * - 400 validation errors (duplicate name, invalid fields): Display in modal (addError)
 * - 401 unauthorized: Automatic redirect to login (handled by useApi)
 * - 403, 404, 500: Display error toast (manual handling)
 * - Network errors: Display error toast (manual handling)
 */
async function handleAdd() {
  console.log('[handleAdd] Submitting add plan form:', addForm.value)
  
  // Client-side validation
  const errors = validateForm(addForm.value)
  if (errors.length > 0) {
    console.log('[handleAdd] Validation failed:', errors)
    addError.value = errors[0] || 'Validation error'
    return
  }
  
  submitting.value = true
  addError.value = ''
  
  try {
    const api = useApi()
    const toast = useAppToast()
    const payload = formToApiPayload(addForm.value, activeTab.value)
    console.log('[handleAdd] API payload:', payload)
    
    // Use raw request to handle 400 validation errors in modal
    const result = await api.request<ApiPlan>(
      '/subscription/admin/plans',
      { method: 'POST', body: JSON.stringify(payload) }
    )
    
    console.log('[handleAdd] Plan created successfully:', result)
    
    // Success flow: show toast, close modal, refresh data
    toast.success('Plan created successfully')
    showAddModal.value = false
    await Promise.all([fetchPlans(), fetchStats()])
  } catch (err: any) {
    console.error('[handleAdd] Error creating plan:', err)
    
    // Handle 400 validation errors in modal (e.g., duplicate plan name)
    // 401 errors are handled by useApi (redirect to login)
    // Other errors (403, 404, 500, network) should show as toast
    const errorMessage = err?.message || 'Failed to create plan'
    
    // Check if this is a validation error (400) that should display in modal
    if (errorMessage.toLowerCase().includes('duplicate') || 
        errorMessage.toLowerCase().includes('already exists') ||
        errorMessage.toLowerCase().includes('invalid')) {
      addError.value = errorMessage
      console.log('[handleAdd] Validation error displayed in modal:', errorMessage)
    } else {
      // For non-validation errors, show toast
      const toast = useAppToast()
      toast.error('Failed to create plan', errorMessage)
      console.log('[handleAdd] Error toast displayed:', errorMessage)
    }
  } finally {
    submitting.value = false
  }
}

// ── Edit modal ──
const showEditModal = ref(false)
const editForm = ref<Plan & { pickupStr: string; binStr: string; priceStr: string }>({
  id: '', name: '', description: '', billingType: 'prepaid', billingCycle: 'monthly',
  pickupCount: 0, binCount: 0, price: 0, color: '#3b82f6', subscriberCount: 0, isActive: true,
  pickupStr: '', binStr: '', priceStr: '',
})
const editError = ref('')

function openEdit(p: Plan) {
  console.log('[openEdit] Opening edit modal for plan:', p.id, p.name)
  editForm.value = { ...p, pickupStr: String(p.pickupCount), binStr: String(p.binCount), priceStr: String(p.price) }
  editError.value = ''
  showEditModal.value = true
}

/**
 * Handle edit plan form submission
 * 
 * Error Handling Strategy:
 * - Client-side validation errors: Display in modal (editError)
 * - 400 validation errors (duplicate name, invalid fields): Display in modal (editError)
 * - 401 unauthorized: Automatic redirect to login (handled by useApi)
 * - 403, 404, 500: Display error toast (manual handling)
 * - Network errors: Display error toast (manual handling)
 */
async function handleEdit() {
  console.log('[handleEdit] Submitting edit plan form for plan:', editForm.value.id)
  
  // Convert string inputs to FormData format for validation
  const formData: FormData = {
    name: editForm.value.name,
    description: editForm.value.description,
    billingCycle: editForm.value.billingCycle,
    pickupCount: editForm.value.pickupStr,
    binCount: editForm.value.binStr,
    price: editForm.value.priceStr,
    color: editForm.value.color,
    isActive: editForm.value.isActive,
  }
  
  // Client-side validation
  const errors = validateForm(formData)
  if (errors.length > 0) {
    console.log('[handleEdit] Validation failed:', errors)
    editError.value = errors[0] || 'Validation error'
    return
  }
  
  submitting.value = true
  editError.value = ''
  
  try {
    const api = useApi()
    const toast = useAppToast()
    
    // Transform form data to API payload (partial update)
    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      pickups: Number(formData.pickupCount),
      bins: Number(formData.binCount),
      billingCycle: formData.billingCycle,
      price: Number(formData.price),
      badgeColor: formData.color,
      isActive: formData.isActive,
    }
    console.log('[handleEdit] API payload:', payload)
    
    // Use raw request to handle 400 validation errors in modal
    const result = await api.request<ApiPlan>(
      `/subscription/admin/plans/${editForm.value.id}`,
      { method: 'PATCH', body: JSON.stringify(payload) }
    )
    
    console.log('[handleEdit] Plan updated successfully:', result)
    
    // Success flow: show toast, close modal, refresh data
    toast.success('Plan updated successfully')
    showEditModal.value = false
    await Promise.all([fetchPlans(), fetchStats()])
  } catch (err: any) {
    console.error('[handleEdit] Error updating plan:', err)
    
    // Handle 400 validation errors in modal (e.g., duplicate plan name)
    // 401 errors are handled by useApi (redirect to login)
    // Other errors (403, 404, 500, network) should show as toast
    const errorMessage = err?.message || 'Failed to update plan'
    
    // Check if this is a validation error (400) that should display in modal
    if (errorMessage.toLowerCase().includes('duplicate') || 
        errorMessage.toLowerCase().includes('already exists') ||
        errorMessage.toLowerCase().includes('invalid')) {
      editError.value = errorMessage
      console.log('[handleEdit] Validation error displayed in modal:', errorMessage)
    } else {
      // For non-validation errors, show toast
      const toast = useAppToast()
      toast.error('Failed to update plan', errorMessage)
      console.log('[handleEdit] Error toast displayed:', errorMessage)
    }
  } finally {
    submitting.value = false
  }
}

// ── Delete modal ──
const showDeleteModal = ref(false)
const deleteTarget = ref<Plan | null>(null)
const deleting = ref(false)

// ── Toggle active status ──
const toggling = ref<string | null>(null)

function openDelete(p: Plan) { 
  console.log('[openDelete] Opening delete modal for plan:', p.id, p.name, 'subscribers:', p.subscriberCount)
  deleteTarget.value = p
  showDeleteModal.value = true
}

/**
 * Handle delete plan confirmation
 * 
 * Error Handling Strategy:
 * - 400 errors (plan has subscribers): Automatic error toast (handled by useErrorHandler)
 * - 401 unauthorized: Automatic redirect to login (handled by useApi)
 * - 403, 404, 500: Automatic error toast (handled by useErrorHandler)
 * - Network errors: Automatic error toast (handled by useErrorHandler)
 */
async function handleDelete() {
  if (!deleteTarget.value) return
  
  console.log('[handleDelete] Deleting plan:', deleteTarget.value.id, deleteTarget.value.name)
  deleting.value = true
  
  const api = useApi()
  const toast = useAppToast()
  
  // Use wrapped del method for automatic error handling
  // 401 errors are handled by useApi (redirect to login)
  // 403, 404, 500, network errors are handled by useErrorHandler (toast)
  const result = await api.del(
    `/subscription/admin/plans/${deleteTarget.value.id}`,
    'Failed to delete plan'
  )
  
  if (result) {
    console.log('[handleDelete] Plan deleted successfully:', result)
    
    // Success flow: show toast, close modal, refresh data
    toast.success('Plan deleted successfully')
    showDeleteModal.value = false
    deleteTarget.value = null
    await Promise.all([fetchPlans(), fetchStats()])
  } else {
    console.log('[handleDelete] Delete operation failed or was cancelled')
  }
  
  deleting.value = false
}

/**
 * Toggle plan active status
 * 
 * Error Handling Strategy:
 * - 401 unauthorized: Automatic redirect to login (handled by useApi)
 * - 403, 404, 500: Automatic error toast (handled by useErrorHandler)
 * - Network errors: Automatic error toast (handled by useErrorHandler)
 */
async function toggleActive(plan: Plan) {
  console.log('[toggleActive] Toggling plan:', plan.id, plan.name, 'current status:', plan.isActive)
  toggling.value = plan.id
  
  const api = useApi()
  const toast = useAppToast()
  
  // Use wrapped patch method for automatic error handling
  // 401 errors are handled by useApi (redirect to login)
  // 403, 404, 500, network errors are handled by useErrorHandler (toast)
  const result = await api.patch<{ id: string; isActive: boolean; message: string }>(
    `/subscription/admin/plans/${plan.id}/toggle`,
    {},
    'Failed to toggle plan status'
  )
  
  if (result) {
    console.log('[toggleActive] Plan toggled successfully:', result)
    
    // Show success toast
    toast.success(`Plan ${result.isActive ? 'activated' : 'deactivated'} successfully`)
    
    // Update local plan state with new active status
    const idx = plans.value.findIndex(p => p.id === plan.id)
    if (idx !== -1 && plans.value[idx]) {
      plans.value[idx].isActive = result.isActive
      console.log('[toggleActive] Local state updated for plan:', plan.id)
    }
  } else {
    console.log('[toggleActive] Toggle operation failed or was cancelled')
  }
  
  toggling.value = null
}

const colorOptions = ['#6b7280','#3b82f6','#8b5cf6','#f97316','#22c55e','#ef4444','#ffb400','#ec4899','#14b8a6']
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
</style>

<template>
  <div style="display:flex;flex-direction:column;gap:32px;font-family:'Manrope',sans-serif">

    <!-- Loading skeleton -->
    <div v-if="loading && plans.length === 0" style="display:flex;flex-direction:column;gap:32px">
      <!-- Header skeleton -->
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div>
          <div class="skeleton" style="height:28px;width:220px;margin-bottom:6px" />
          <div class="skeleton" style="height:14px;width:280px" />
        </div>
        <div class="skeleton" style="height:40px;width:120px;border-radius:10px" />
      </div>

      <!-- Tabs skeleton -->
      <div style="display:flex;gap:4px;background:#f3f4f6;border-radius:12px;padding:4px;width:fit-content">
        <div class="skeleton" style="height:36px;width:100px;border-radius:9px" />
        <div class="skeleton" style="height:36px;width:100px;border-radius:9px" />
      </div>

      <!-- Stats skeleton -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px">
        <div v-for="i in 3" :key="i" style="background:#fff;border-radius:16px;padding:20px 24px;border:1px solid #f0f0f0">
          <div class="skeleton" style="height:12px;width:80px;margin-bottom:10px" />
          <div class="skeleton" style="height:28px;width:60px;margin-bottom:8px" />
          <div class="skeleton" style="height:11px;width:100px" />
        </div>
      </div>

      <!-- Plan cards skeleton -->
      <div style="display:flex;flex-direction:column;gap:16px">
        <div v-for="i in 3" :key="i" style="background:#fff;border-radius:16px;border:1px solid #f0f0f0;padding:24px;display:flex;align-items:flex-start;justify-content:space-between;gap:20px;flex-wrap:wrap">
          <!-- Left -->
          <div style="display:flex;align-items:flex-start;gap:16px;flex:1;min-width:220px">
            <div class="skeleton" style="width:48px;height:48px;border-radius:14px" />
            <div style="flex:1">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
                <div class="skeleton" style="height:16px;width:140px" />
                <div class="skeleton" style="height:20px;width:100px;border-radius:20px" />
                <div class="skeleton" style="height:20px;width:60px;border-radius:20px" />
              </div>
              <div class="skeleton" style="height:13px;width:80%;margin-bottom:14px" />
              <div style="display:flex;flex-wrap:wrap;gap:8px">
                <div class="skeleton" style="height:28px;width:100px;border-radius:8px" />
                <div class="skeleton" style="height:28px;width:90px;border-radius:8px" />
              </div>
            </div>
          </div>
          <!-- Middle -->
          <div style="text-align:center;flex-shrink:0">
            <div class="skeleton" style="height:24px;width:80px;margin:0 auto 4px" />
            <div class="skeleton" style="height:11px;width:60px;margin:0 auto 4px" />
            <div class="skeleton" style="height:11px;width:70px;margin:4px auto 0" />
          </div>
          <!-- Right -->
          <div style="display:flex;gap:8px;align-items:center;flex-shrink:0">
            <div class="skeleton" style="height:36px;width:110px;border-radius:8px" />
            <div class="skeleton" style="height:36px;width:70px;border-radius:8px" />
            <div class="skeleton" style="height:36px;width:80px;border-radius:8px" />
          </div>
        </div>
      </div>
    </div>

    <!-- Main content (shown after initial load) -->
    <template v-else>
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
        <!-- Show loading placeholders when statsLoading is true -->
        <template v-if="statsLoading">
          <div v-for="i in 3" :key="i" style="background:#fff;border-radius:16px;padding:20px 24px;border:1px solid #f0f0f0">
            <div class="skeleton" style="height:12px;width:80px;margin-bottom:10px"></div>
            <div class="skeleton" style="height:28px;width:60px;margin-bottom:8px"></div>
            <div class="skeleton" style="height:11px;width:100px"></div>
          </div>
        </template>
        <!-- Show actual stats when loaded -->
        <template v-else>
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
        </template>
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

        <!-- Middle: price + cycle -->
        <div style="text-align:center;flex-shrink:0">
          <p style="font-size:24px;font-weight:700;color:#1a1a1a;margin:0 0 4px">{{ format(plan.price) }}</p>
          <p style="font-size:11px;color:#9ca3af;margin:0 0 4px;font-weight:500;text-transform:uppercase;letter-spacing:0.5px">{{ cycleLabel(plan.billingCycle) }}</p>
          <p style="font-size:11px;color:#9ca3af;margin:4px 0 0;text-transform:capitalize">{{ plan.billingType }}</p>
        </div>

        <!-- Right: actions -->
        <div style="display:flex;gap:8px;align-items:center;flex-shrink:0">
          <button @click="toggleActive(plan)" :disabled="toggling === plan.id"
            :style="`display:flex;align-items:center;gap:6px;background:${plan.isActive ? '#fef2f2' : '#dcfce7'};color:${plan.isActive ? '#ef4444' : '#16a34a'};border:none;border-radius:8px;padding:8px 14px;font-size:13px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${toggling === plan.id ? 'not-allowed' : 'pointer'};opacity:${toggling === plan.id ? '0.6' : '1'}`">
            <Icon v-if="toggling === plan.id" name="lucide:loader-2" style="width:14px;height:14px;animation:spin 1s linear infinite" />
            <Icon v-else :name="plan.isActive ? 'lucide:pause-circle' : 'lucide:play-circle'" style="width:14px;height:14px" />
            {{ toggling === plan.id ? 'Processing...' : (plan.isActive ? 'Deactivate' : 'Activate') }}
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
            <div>
              <label style="font-size:12px;font-weight:600;color:#374151;display:flex;align-items:center;gap:6px;margin-bottom:6px">
                <span style="font-size:13px;font-weight:700;color:#f59e0b">GHS</span>
                Price <span style="color:#ef4444">*</span>
              </label>
              <input v-model="addForm.price" type="number" min="0" step="0.01" placeholder="e.g. 50.00" style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box;background:#fff" />
            </div>
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
          <button @click="showAddModal=false" :disabled="submitting" :style="`background:#ececec;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${submitting ? 'not-allowed' : 'pointer'};opacity:${submitting ? '0.6' : '1'}`">Cancel</button>
          <button @click="handleAdd" :disabled="submitting" :style="`display:flex;align-items:center;gap:8px;background:#ffb400;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${submitting ? 'not-allowed' : 'pointer'};opacity:${submitting ? '0.8' : '1'}`">
            <Icon v-if="submitting" name="lucide:loader-2" style="width:16px;height:16px;animation:spin 1s linear infinite" />
            {{ submitting ? 'Creating...' : 'Add Plan' }}
          </button>
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
            <div>
              <label style="font-size:12px;font-weight:600;color:#374151;display:flex;align-items:center;gap:6px;margin-bottom:6px">
                <span style="font-size:13px;font-weight:700;color:#f59e0b">GHS</span>
                Price <span style="color:#ef4444">*</span>
              </label>
              <input v-model="editForm.priceStr" type="number" min="0" step="0.01" style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box;background:#fff" />
            </div>
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
          <button @click="showEditModal=false" :disabled="submitting" :style="`background:#ececec;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${submitting ? 'not-allowed' : 'pointer'};opacity:${submitting ? '0.6' : '1'}`">Cancel</button>
          <button @click="handleEdit" :disabled="submitting" :style="`display:flex;align-items:center;gap:8px;background:#ffb400;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${submitting ? 'not-allowed' : 'pointer'};opacity:${submitting ? '0.8' : '1'}`">
            <Icon v-if="submitting" name="lucide:loader-2" style="width:16px;height:16px;animation:spin 1s linear infinite" />
            {{ submitting ? 'Saving...' : 'Save Changes' }}
          </button>
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
          <button @click="showDeleteModal=false" :disabled="deleting" :style="`background:#ececec;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${deleting ? 'not-allowed' : 'pointer'};opacity:${deleting ? '0.6' : '1'}`">Cancel</button>
          <button @click="handleDelete" :disabled="deleting" :style="`display:flex;align-items:center;gap:8px;background:#ef4444;color:#fff;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${deleting ? 'not-allowed' : 'pointer'};opacity:${deleting ? '0.8' : '1'}`">
            <Icon v-if="deleting" name="lucide:loader-2" style="width:16px;height:16px;animation:spin 1s linear infinite" />
            {{ deleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>

    </template>
  </div>
</template>
