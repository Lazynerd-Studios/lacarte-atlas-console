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
}

const customers = ref<CustomerOption[]>([])
const disposableItems = ref<DisposableItem[]>([])
const estimatedQuantities = ref<EstimatedQuantity[]>([])
const loadingOptions = ref(true)
const submitting = ref(false)

const form = reactive({
  customerId: '',
  disposableItemTypeId: '',
  estimatedQuantityId: '',
  preferredPickupDate: '',
  additionalNotes: '',
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
  customerDropdownOpen.value = false
  if (errors.customerId) delete errors.customerId
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
  const [cust, dispRes, qtyRes] = await Promise.all([
    fetchAllCustomers(),
    api.get<any>('/disposable/item-types', 'Failed to load disposable types'),
    api.get<any>('/disposable/quantities', 'Failed to load estimated quantities'),
  ])
  customers.value = cust
  if (dispRes) {
    const items = Array.isArray(dispRes) ? dispRes : (dispRes.data ?? dispRes.disposableTypes ?? [])
    disposableItems.value = items.map((i: any) => ({ id: i.id, name: i.name, icon: i.icon ?? null }))
  }
  if (qtyRes) {
    const items = Array.isArray(qtyRes) ? qtyRes : (qtyRes.data ?? qtyRes.quantities ?? [])
    estimatedQuantities.value = items
      .filter((q: any) => q.isActive !== false && q.isActive !== 0)
      .map((q: any) => ({ id: q.id, label: q.label }))
  }
  loadingOptions.value = false
})

function validate() {
  Object.keys(errors).forEach(k => delete errors[k])
  if (!form.customerId)                  errors.customerId = 'Select a customer'
  if (!form.disposableItemTypeId)        errors.disposableItemTypeId = 'Required'
  if (!form.estimatedQuantityId)         errors.estimatedQuantityId = 'Required'
  if (!form.preferredPickupDate)         errors.preferredPickupDate = 'Required'
  if (form.additionalNotes.length > 500)  errors.additionalNotes = 'Max 500 characters'
  return Object.keys(errors).length === 0
}

async function submit() {
  if (submitting.value) return
  if (!validate()) return
  submitting.value = true
  const result = await api.post<any>(
    '/pickup-requests/admin/',
    {
      customerId: form.customerId,
      disposableItemTypeId: form.disposableItemTypeId,
      estimatedQuantityId: form.estimatedQuantityId,
      preferredPickupDate: form.preferredPickupDate,
      paymentType: 'subscription',
      additionalNotes: form.additionalNotes.trim(),
    },
    'Failed to create pickup request'
  )
  submitting.value = false
  if (result) {
    toast.success('Pickup request created')
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
        <p style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:4px">Payment type: Subscription</p>
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
              :style="`width:100%;height:42px;padding:0 16px;background:white;border:1px solid ${errors.estimatedQuantityId ? '#ef4444' : '#e5e7eb'};border-radius:16px;font-size:14px;color:${form.estimatedQuantityId ? '#1a1a1a' : '#9ca3af'};font-family:'Manrope',sans-serif;outline:none;cursor:pointer;appearance:none;background-image:${chevronBg};background-repeat:no-repeat;background-position:right 12px center;box-sizing:border-box`"
            >
              <option value="" disabled>Select quantity</option>
              <option v-for="q in estimatedQuantities" :key="q.id" :value="q.id">{{ q.label }}</option>
            </select>
            <span v-if="errors.estimatedQuantityId" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ errors.estimatedQuantityId }}</span>
          </div>

          <!-- Preferred pickup date -->
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Preferred Pickup Date</label>
            <input
              v-model="form.preferredPickupDate"
              type="date"
              :style="inputStyle('preferredPickupDate')"
            />
            <span v-if="errors.preferredPickupDate" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ errors.preferredPickupDate }}</span>
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