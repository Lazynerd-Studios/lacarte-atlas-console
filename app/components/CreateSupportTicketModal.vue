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

const customers = ref<CustomerOption[]>([])
const loadingOptions = ref(true)
const submitting = ref(false)

const form = reactive({
  customerId: '',
  subject: '',
  category: 'missed_pickup',
  priority: 'low',
  message: '',
})
const errors = reactive<Record<string, string>>({})

const categoryOptions = [
  { label: 'Missed Pickup', value: 'missed_pickup' },
  { label: 'Billing', value: 'billing' },
  { label: 'Service Request', value: 'service_request' },
  { label: 'Equipment Issue', value: 'equipment_issue' },
  { label: 'Schedule Change', value: 'schedule_change' },
  { label: 'Other', value: 'other' },
]

const priorityOptions = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'urgent' },
]

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
  customers.value = await fetchAllCustomers()
  loadingOptions.value = false
})

function validate() {
  Object.keys(errors).forEach(k => delete errors[k])
  if (!form.customerId) errors.customerId = 'Select a customer'
  if (!form.subject.trim()) errors.subject = 'Required'
  else if (form.subject.trim().length < 3) errors.subject = 'At least 3 characters'
  else if (form.subject.trim().length > 200) errors.subject = 'Max 200 characters'
  if (!form.message.trim()) errors.message = 'Required'
  else if (form.message.trim().length < 5) errors.message = 'At least 5 characters'
  return Object.keys(errors).length === 0
}

async function submit() {
  if (submitting.value) return
  if (!validate()) return
  submitting.value = true
  console.log('[CreateSupportTicketModal] Creating ticket:', JSON.stringify({
    customerId: form.customerId,
    subject: form.subject.trim(),
    category: form.category,
    priority: form.priority,
    message: form.message.trim(),
  }, null, 2))
  const result = await api.post<any>(
    '/support/admin/tickets',
    {
      customerId: form.customerId,
      subject: form.subject.trim(),
      category: form.category,
      priority: form.priority,
      message: form.message.trim(),
    },
    'Failed to create ticket'
  )
  submitting.value = false
  if (result) {
    console.log('[CreateSupportTicketModal] Created:', result)
    toast.success('Ticket created on behalf of customer')
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
        <p style="font-size:20px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Create Ticket</p>
        <p style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:4px">Raise a support ticket on behalf of a customer</p>
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

          <!-- Subject -->
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Subject</label>
            <input
              v-model="form.subject"
              type="text"
              maxlength="200"
              placeholder="e.g., Missed pickup on Tuesday"
              :style="inputStyle('subject')"
            />
            <span v-if="errors.subject" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ errors.subject }}</span>
          </div>

          <!-- Category + Priority -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div style="display:flex;flex-direction:column;gap:6px">
              <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Category</label>
              <select
                v-model="form.category"
                :style="`width:100%;height:42px;padding:0 16px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;cursor:pointer;appearance:none;background-image:${chevronBg};background-repeat:no-repeat;background-position:right 12px center;box-sizing:border-box`"
              >
                <option v-for="c in categoryOptions" :key="c.value" :value="c.value">{{ c.label }}</option>
              </select>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px">
              <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Priority</label>
              <select
                v-model="form.priority"
                :style="`width:100%;height:42px;padding:0 16px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;cursor:pointer;appearance:none;background-image:${chevronBg};background-repeat:no-repeat;background-position:right 12px center;box-sizing:border-box`"
              >
                <option v-for="p in priorityOptions" :key="p.value" :value="p.value">{{ p.label }}</option>
              </select>
            </div>
          </div>

          <!-- Message -->
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Message</label>
            <textarea
              v-model="form.message"
              rows="4"
              placeholder="Describe the issue as reported by the customer..."
              :style="`width:100%;padding:10px 12px;background:white;border:1px solid ${errors.message ? '#ef4444' : '#e5e7eb'};border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;resize:none;box-sizing:border-box;line-height:1.5`"
            />
            <span v-if="errors.message" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ errors.message }}</span>
            <span v-else style="font-size:12px;color:#9ca3af;font-family:'Manrope',sans-serif">This becomes the first message on the ticket</span>
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
        >{{ submitting ? 'Creating…' : 'Create Ticket' }}</button>
      </div>
    </div>
  </div>
</template>
