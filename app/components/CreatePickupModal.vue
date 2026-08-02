<script setup lang="ts">
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created'): void
}>()

const api = useApi()
const toast = useAppToast()

interface CustomerOption {
  id: string
  name: string
  phoneNumber: string | null
  placeName: string | null
  customerTypeId?: string | null
  customerType?: { id: string } | null
  user?: { name?: string; email?: string } | null
}
interface DisposableItem {
  id: string
  name: string
  icon: string | null
}
interface EstimatedQuantity {
  id: string
  label: string
  binCount: number | null
}
interface TruckLoadTier {
  id: string
  label: string
  prepayRate: number
  postpayRate: number
  binEquivalent: number
}
type PricingMode = 'per_bin' | 'full_truck'

const customers = ref<CustomerOption[]>([])
const disposableItems = ref<DisposableItem[]>([])
const estimatedQuantities = ref<EstimatedQuantity[]>([])
const truckTiers = ref<TruckLoadTier[]>([])
// Map of customerTypeId -> pricingMode, used to decide whether the selected
// customer is priced per_bin (automatic) or full_truck (needs a truck tier).
const customerTypePricingModes = ref<Record<string, PricingMode>>({})
const loadingOptions = ref(true)
const loadingQuantities = ref(false)
const submitting = ref(false)

const form = reactive({
  customerId: '',
  disposableItemTypeId: '',
  estimatedQuantityId: '',
  truckLoadRateId: '',
  preferredPickupDate: '',
  additionalNotes: '',
  isEmergency: false,
})
const errors = reactive<Record<string, string>>({})

const customerSearch = ref('')
const customerDropdownOpen = ref(false)
let dropdownTimer: ReturnType<typeof setTimeout> | null = null
const selectedCustomer = ref<CustomerOption | null>(null)

function blurCustomer() {
  dropdownTimer = setTimeout(() => { customerDropdownOpen.value = false }, 150)
}

watch(customerSearch, (q) => {
  if (selectedCustomer.value && selectedCustomer.value.name !== q) {
    selectedCustomer.value = null
    form.customerId = ''
  }
})

const filteredCustomers = computed(() => {
  const q = customerSearch.value.toLowerCase().trim()
  if (!q) return customers.value.slice(0, 50)
  return customers.value
    .filter(c => c.name.toLowerCase().includes(q) || (c.phoneNumber ?? '').includes(q) || (c.placeName ?? '').toLowerCase().includes(q))
    .slice(0, 50)
})

function selectCustomer(c: CustomerOption) {
  if (dropdownTimer) { clearTimeout(dropdownTimer); dropdownTimer = null }
  selectedCustomer.value = c
  customerSearch.value = c.name
  form.customerId = c.id
  // A truck tier chosen for a previous customer no longer applies
  form.truckLoadRateId = ''
  customerDropdownOpen.value = false
  if (errors.customerId) delete errors.customerId
  // Availability is checked against the customer's type — reload the quantity options scoped to it
  fetchQuantities(c.customerTypeId ?? c.customerType?.id ?? null)
}

// Pricing mode of the currently selected customer's type. per_bin customers are
// priced automatically; full_truck customers require a truck load tier.
const selectedPricingMode = computed<PricingMode>(() => {
  const typeId = selectedCustomer.value?.customerTypeId ?? selectedCustomer.value?.customerType?.id ?? null
  if (!typeId) return 'per_bin'
  return customerTypePricingModes.value[typeId] ?? 'per_bin'
})
const isFullTruck = computed(() => selectedPricingMode.value === 'full_truck')

// Load customer types once to build the id -> pricingMode lookup
async function fetchCustomerTypePricingModes() {
  const res = await api.get<{ id: string; pricingMode?: PricingMode }[]>('/customer/admin/types/', 'Failed to load customer types')
  if (res) {
    const list = Array.isArray(res) ? res : ((res as any).data ?? [])
    for (const ct of list) {
      customerTypePricingModes.value[ct.id] = ct.pricingMode ?? 'per_bin'
    }
  }
}

// Truck load tiers for the full_truck dropdown (public endpoint)
async function fetchTruckTiers() {
  const res = await api.get<{ data?: TruckLoadTier[] } | TruckLoadTier[]>('/rates/truck-loads', 'Failed to load truck load tiers')
  if (res) {
    truckTiers.value = Array.isArray(res) ? res : (res.data ?? [])
  }
}

// Load active quantities, scoped to a customer type when one is selected
async function fetchQuantities(customerTypeId: string | null) {
  loadingQuantities.value = true
  const endpoint = customerTypeId
    ? `/disposable/quantities/active?customerTypeId=${customerTypeId}`
    : '/disposable/quantities/active'
  console.log('[CreatePickupModal] Fetching quantities:', endpoint)
  const res = await api.get<any>(endpoint, 'Failed to load estimated quantities')
  if (res) {
    const items = Array.isArray(res) ? res : (res.data ?? res.quantities ?? [])
    estimatedQuantities.value = items.map((q: any) => ({
      id: q.id,
      label: q.label,
      binCount: q.binCount != null ? Number(q.binCount) : null,
    }))
    // Clear a stale selection that isn't available for this customer type
    if (form.estimatedQuantityId && !estimatedQuantities.value.some(q => q.id === form.estimatedQuantityId)) {
      form.estimatedQuantityId = ''
    }
  }
  loadingQuantities.value = false
}

async function fetchAllCustomers(): Promise<CustomerOption[]> {
  const all: CustomerOption[] = []
  let page = 1
  const limit = 100
  let hasNext = true
  while (hasNext) {
    const res = await api.get<{ data: CustomerOption[]; pagination?: { hasNextPage?: boolean } }>(
      `/customer/admin/list?limit=${limit}&page=${page}`,
      'Failed to load customers'
    )
    if (!res) break
    if (res.data) {
      // Normalize: the list endpoint nests name under user.name; mirror it to top-level
      for (const c of res.data) {
        if (!c.name && c.user?.name) c.name = c.user.name
        if (!c.placeName) c.placeName = (c as any).address ?? null
      }
      all.push(...res.data)
    }
    hasNext = !!res.pagination?.hasNextPage
    page++
  }
  return all
}

onMounted(async () => {
  loadingOptions.value = true
  const [cust, dispRes] = await Promise.all([
    fetchAllCustomers(),
    api.get<any>('/disposable/item-types/active', 'Failed to load disposable types'),
    fetchQuantities(null),
    fetchCustomerTypePricingModes(),
    fetchTruckTiers(),
  ])
  customers.value = cust
  if (dispRes) {
    const items = Array.isArray(dispRes) ? dispRes : (dispRes.data ?? dispRes.disposableTypes ?? [])
    disposableItems.value = items.map((i: any) => ({ id: i.id, name: i.name, icon: i.icon ?? null }))
  }
  loadingOptions.value = false
})

const todayForDateInput = computed(() => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
})

function validate() {
  Object.keys(errors).forEach(k => delete errors[k])
  if (!form.customerId)                  errors.customerId = 'Select a customer'
  if (!form.disposableItemTypeId)        errors.disposableItemTypeId = 'Required'
  if (!form.estimatedQuantityId)         errors.estimatedQuantityId = 'Required'
  if (isFullTruck.value && !form.truckLoadRateId) errors.truckLoadRateId = 'Select a truck load tier'
  if (!form.preferredPickupDate)         errors.preferredPickupDate = 'Required'
  if (!form.isEmergency && form.preferredPickupDate && form.preferredPickupDate < todayForDateInput.value) {
    errors.preferredPickupDate = 'Pickup date cannot be in the past'
  }
  if (form.additionalNotes.length > 500)  errors.additionalNotes = 'Max 500 characters'
  return Object.keys(errors).length === 0
}

async function submit() {
  if (submitting.value) return
  if (!validate()) return
  submitting.value = true
  // paymentType is intentionally omitted — the server auto-resolves it from the
  // customer's subscription state. truckLoadRateId is only valid for full_truck
  // customers (the server rejects it for per_bin).
  const payload: Record<string, unknown> = {
    customerId: form.customerId,
    disposableItemTypeId: form.disposableItemTypeId,
    estimatedQuantityId: form.estimatedQuantityId,
    preferredPickupDate: form.preferredPickupDate,
    isEmergency: form.isEmergency,
    additionalNotes: form.additionalNotes.trim(),
  }
  if (isFullTruck.value) {
    payload.truckLoadRateId = form.truckLoadRateId
  }
  const result = await api.post<any>(
    '/pickup-requests/admin/',
    payload,
    'Failed to create pickup request'
  )
  submitting.value = false
  if (result) {
    toast.success(form.isEmergency ? 'Emergency pickup request created' : 'Pickup request created')
    emit('created')
  }
}

const chevronBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`
function inputStyle(field: string) {
  return `width:100%;height:40px;padding:0 12px;background:white;border:1px solid ${errors[field] ? '#ef4444' : '#e5e7eb'};border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box`
}
</script>

<template>
  <div
    style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:50;display:flex;align-items:center;justify-content:center;padding:24px"
    @click.self="emit('close')"
  >
    <div style="background:white;border:1px solid #e5e7eb;border-radius:16px;width:540px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 10px 15px rgba(0,0,0,0.1);position:relative">

      <!-- Header -->
      <div style="padding:24px 24px 16px;flex-shrink:0;border-bottom:1px solid #e5e7eb">
        <p style="font-size:20px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Create Pickup Request</p>
        <p style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:4px">Payment type: Auto-resolved by the system</p>
      </div>

      <!-- Close -->
      <button
        style="position:absolute;top:16px;right:16px;width:28px;height:28px;border:none;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:8px;opacity:0.7"
        @click="emit('close')"
      >
        <UIcon name="i-lucide-x" style="width:16px;height:16px;color:#111" />
      </button>

      <!-- Body -->
      <div style="flex:1;overflow-y:auto;padding:24px;display:flex;flex-direction:column;gap:16px">

        <div v-if="loadingOptions" style="display:flex;align-items:center;justify-content:center;padding:40px 0">
          <UIcon name="i-lucide-loader-2" style="width:22px;height:22px;color:#ffb400;animation:spin 1s linear infinite" />
        </div>

        <template v-else>
          <!-- Customer search -->
          <div style="display:flex;flex-direction:column;gap:6px;position:relative">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Customer</label>
            <input
              v-model="customerSearch"
              type="text"
              placeholder="Search by name, phone, or area..."
              :style="inputStyle('customerId')"
              @focus="customerDropdownOpen = true"
              @blur="blurCustomer()"
            />
            <span v-if="errors.customerId" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ errors.customerId }}</span>

            <div
              v-if="customerDropdownOpen && filteredCustomers.length > 0"
              style="position:absolute;top:calc(100% + 4px);left:0;right:0;max-height:240px;overflow-y:auto;background:white;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 8px 16px rgba(0,0,0,0.1);z-index:10"
            >
              <button
                v-for="c in filteredCustomers"
                :key="c.id"
                type="button"
                style="width:100%;text-align:left;padding:10px 12px;background:none;border:none;cursor:pointer;display:flex;flex-direction:column;gap:2px;border-bottom:1px solid #f3f4f6"
                @mousedown.prevent="selectCustomer(c)"
                @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
                @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
              >
                <span style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ c.name }}</span>
                <span style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">{{ c.phoneNumber }}{{ c.placeName ? ' · ' + c.placeName : '' }}</span>
              </button>
            </div>
            <div v-else-if="customerDropdownOpen && customerSearch && filteredCustomers.length === 0" style="position:absolute;top:calc(100% + 4px);left:0;right:0;background:white;border:1px solid #e5e7eb;border-radius:12px;padding:12px;text-align:center;z-index:10">
              <span style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif">No customers found</span>
            </div>
          </div>

          <!-- Disposable item type -->
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Disposable Item Type</label>
            <select
              v-model="form.disposableItemTypeId"
              :style="`width:100%;height:42px;padding:0 16px;background:white;border:1px solid ${errors.disposableItemTypeId ? '#ef4444' : '#e5e7eb'};border-radius:16px;font-size:14px;color:${form.disposableItemTypeId ? '#1a1a1a' : '#9ca3af'};font-family:'Manrope',sans-serif;outline:none;cursor:pointer;appearance:none;background-image:${chevronBg};background-repeat:no-repeat;background-position:right 12px center;box-sizing:border-box`"
            >
              <option value="" disabled>Select item type</option>
              <option v-for="d in disposableItems" :key="d.id" :value="d.id">{{ d.name }}</option>
            </select>
            <span v-if="errors.disposableItemTypeId" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ errors.disposableItemTypeId }}</span>
          </div>

          <!-- Estimated quantity -->
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Estimated Quantity</label>
            <select
              v-model="form.estimatedQuantityId"
              :disabled="loadingQuantities"
              :style="`width:100%;height:42px;padding:0 16px;background:white;border:1px solid ${errors.estimatedQuantityId ? '#ef4444' : '#e5e7eb'};border-radius:16px;font-size:14px;color:${form.estimatedQuantityId ? '#1a1a1a' : '#9ca3af'};font-family:'Manrope',sans-serif;outline:none;cursor:${loadingQuantities ? 'wait' : 'pointer'};appearance:none;background-image:${chevronBg};background-repeat:no-repeat;background-position:right 12px center;box-sizing:border-box;opacity:${loadingQuantities ? 0.6 : 1}`"
            >
              <option value="" disabled>{{ loadingQuantities ? 'Loading quantities...' : 'Select quantity' }}</option>
              <option v-for="q in estimatedQuantities" :key="q.id" :value="q.id">{{ q.label }}{{ q.binCount != null ? ` (${q.binCount} bins)` : '' }}</option>
            </select>
            <span v-if="errors.estimatedQuantityId" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ errors.estimatedQuantityId }}</span>
            <span v-else-if="selectedCustomer && estimatedQuantities.length === 0 && !loadingQuantities" style="font-size:12px;color:#f59e0b;font-family:'Manrope',sans-serif">No quantities available for this customer's type</span>
          </div>

          <!-- Truck load tier (full_truck customers only) -->
          <div v-if="isFullTruck" style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Truck Load Tier</label>
            <select
              v-model="form.truckLoadRateId"
              :style="`width:100%;height:42px;padding:0 16px;background:white;border:1px solid ${errors.truckLoadRateId ? '#ef4444' : '#e5e7eb'};border-radius:16px;font-size:14px;color:${form.truckLoadRateId ? '#1a1a1a' : '#9ca3af'};font-family:'Manrope',sans-serif;outline:none;cursor:pointer;appearance:none;background-image:${chevronBg};background-repeat:no-repeat;background-position:right 12px center;box-sizing:border-box`"
            >
              <option value="" disabled>Select truck load tier</option>
              <option v-for="t in truckTiers" :key="t.id" :value="t.id">{{ t.label }}</option>
            </select>
            <span v-if="errors.truckLoadRateId" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ errors.truckLoadRateId }}</span>
            <span v-else style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">This customer is priced by truck load — pick the load size for this trip.</span>
          </div>

          <!-- Preferred pickup date -->
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">
              Preferred Pickup Date {{ form.isEmergency ? '(today only for emergencies)' : '' }}
            </label>
            <input
              v-model="form.preferredPickupDate"
              type="date"
              :min="todayForDateInput"
              :style="inputStyle('preferredPickupDate')"
            />
            <span v-if="errors.preferredPickupDate" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ errors.preferredPickupDate }}</span>
            <span v-else-if="form.isEmergency" style="font-size:12px;color:#f59e0b;font-family:'Manrope',sans-serif">Emergency pickups are scheduled for today</span>
          </div>

          <!-- Emergency toggle -->
          <div
            style="display:flex;align-items:center;gap:12px;padding:12px;border-radius:12px;border:1px solid #e5e7eb;cursor:pointer;background:#fff"
            @click="form.isEmergency = !form.isEmergency"
          >
            <input
              v-model="form.isEmergency"
              type="checkbox"
              style="width:18px;height:18px;accent-color:#ef4444;cursor:pointer;flex-shrink:0"
              @click.stop
            />
            <div style="display:flex;flex-direction:column;gap:2px">
              <span style="font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Emergency Pickup</span>
              <span style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">Same-day urgent collection. Extra emergency fee may apply.</span>
            </div>
          </div>

          <!-- Additional notes -->
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Additional Notes</label>
            <textarea
              v-model="form.additionalNotes"
              rows="3"
              maxlength="500"
              placeholder="Optional notes for the driver or operations team..."
              :style="`width:100%;padding:10px 12px;background:white;border:1px solid ${errors.additionalNotes ? '#ef4444' : '#e5e7eb'};border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;resize:none;box-sizing:border-box;line-height:1.5`"
            />
            <div style="display:flex;justify-content:space-between">
              <span v-if="errors.additionalNotes" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ errors.additionalNotes }}</span>
              <span style="font-size:12px;color:#9ca3af;font-family:'Manrope',sans-serif;margin-left:auto">{{ form.additionalNotes.length }}/500</span>
            </div>
          </div>
        </template>
      </div>

      <!-- Footer -->
      <div style="padding:17px 24px;border-top:1px solid #e5e7eb;display:flex;justify-content:flex-end;gap:8px;flex-shrink:0">
        <button
          style="height:40px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
          @click="emit('close')"
        >Cancel</button>
        <button
          :disabled="submitting || loadingOptions"
          :style="`height:40px;padding:0 20px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:${(submitting || loadingOptions) ? 'not-allowed' : 'pointer'};opacity:${(submitting || loadingOptions) ? 0.6 : 1}`"
          @click="submit"
        >{{ submitting ? 'Creating…' : 'Create Request' }}</button>
      </div>
    </div>
  </div>
</template>