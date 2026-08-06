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
  user?: { name?: string; email?: string } | null
}

interface InvoiceItemDraft {
  description: string
  quantity: number
  unitPrice: number
}

const customers = ref<CustomerOption[]>([])
const loadingCustomers = ref(true)
const submitting = ref(false)

const form = reactive({
  customerId: '',
  dueDate: '',
  notes: '',
  taxRate: 0,
})
const items = ref<InvoiceItemDraft[]>([
  { description: '', quantity: 1, unitPrice: 0 },
])

const errors = reactive<Record<string, string>>({})

// --- Customer search (same pattern as CreatePickupModal) -------------------
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
    .filter(c => c.name.toLowerCase().includes(q) || (c.phoneNumber ?? '').includes(q))
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
      }
      all.push(...res.data)
    }
    hasNext = !!res.pagination?.hasNextPage
    page++
  }
  return all
}

onMounted(async () => {
  loadingCustomers.value = true
  customers.value = await fetchAllCustomers()
  loadingCustomers.value = false
})

// --- Line items -------------------------------------------------------------
const subtotal = computed(() =>
  items.value.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0)
)
const taxAmount = computed(() => subtotal.value * ((Number(form.taxRate) || 0) / 100))
const total = computed(() => subtotal.value + taxAmount.value)

function addItem() {
  items.value.push({ description: '', quantity: 1, unitPrice: 0 })
}

function removeItem(index: number) {
  items.value.splice(index, 1)
  if (errors.items) delete errors.items
}

// --- Validation & submit ------------------------------------------------------
function validate(): boolean {
  Object.keys(errors).forEach(k => delete errors[k])
  if (!form.customerId) errors.customerId = 'Select a customer'
  if (Number.isNaN(Number(form.taxRate)) || Number(form.taxRate) < 0 || Number(form.taxRate) > 100) {
    errors.taxRate = 'Tax rate must be between 0 and 100'
  }
  if (items.value.length === 0) {
    errors.items = 'Add at least one line item'
  } else {
    let index = 0
    for (const it of items.value) {
      index++
      if (!it.description.trim() || !(Number(it.quantity) > 0) || !(Number(it.unitPrice) >= 0)) {
        errors.items = `Line item ${index} needs a description, a quantity of at least 1, and a valid unit price`
        break
      }
    }
  }
  return Object.keys(errors).length === 0
}

async function submit() {
  if (submitting.value) return
  if (!validate()) return
  submitting.value = true
  const payload: Record<string, unknown> = {
    customerId: form.customerId,
    // Backend defaults to 14 days from now when omitted
    dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
    notes: form.notes.trim(),
    taxRate: Number(form.taxRate) || 0,
    items: items.value.map(it => ({
      description: it.description.trim(),
      quantity: Number(it.quantity),
      unitPrice: Number(it.unitPrice),
    })),
  }
  const result = await api.post<{ id?: string; invoiceNumber?: string }>(
    '/invoices/admin/',
    payload,
    'Failed to create invoice'
  )
  submitting.value = false
  if (result) {
    toast.success(result.invoiceNumber ? `Invoice ${result.invoiceNumber} created` : 'Invoice created')
    emit('created')
  }
}

const chevronBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`
function inputStyle(field: string) {
  return `width:100%;height:40px;padding:0 12px;background:white;border:1px solid ${errors[field] ? '#ef4444' : '#e5e7eb'};border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box`
}
const { format } = useCurrency()

const todayForDateInput = computed(() => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
})
</script>

<template>
  <div
    style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:50;display:flex;align-items:center;justify-content:center;padding:24px"
    @click.self="emit('close')"
  >
    <div style="background:white;border:1px solid #e5e7eb;border-radius:16px;width:600px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 10px 15px rgba(0,0,0,0.1);position:relative">

      <!-- Header -->
      <div style="padding:24px 24px 16px;flex-shrink:0;border-bottom:1px solid #e5e7eb">
        <p style="font-size:20px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Create Invoice</p>
        <p style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:4px">Manually bill a customer — due date defaults to 14 days from now</p>
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

        <!-- Customer search -->
        <div style="display:flex;flex-direction:column;gap:6px;position:relative">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Customer</label>
          <input
            v-model="customerSearch"
            type="text"
            :placeholder="loadingCustomers ? 'Loading customers...' : 'Search by name or phone...'"
            :disabled="loadingCustomers"
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
              <span style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">{{ c.phoneNumber || '—' }}</span>
            </button>
          </div>
          <div v-else-if="customerDropdownOpen && customerSearch && filteredCustomers.length === 0" style="position:absolute;top:calc(100% + 4px);left:0;right:0;background:white;border:1px solid #e5e7eb;border-radius:12px;padding:12px;text-align:center;z-index:10">
            <span style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif">No customers found</span>
          </div>
        </div>

        <!-- Due date / Tax rate -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Due Date</label>
            <input
              v-model="form.dueDate"
              type="date"
              :min="todayForDateInput"
              :style="inputStyle('dueDate')"
            />
            <span style="font-size:12px;color:#9ca3af;font-family:'Manrope',sans-serif">Defaults to 14 days from now if left empty</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Tax Rate (%)</label>
            <input
              v-model.number="form.taxRate"
              type="number"
              min="0"
              max="100"
              step="0.1"
              placeholder="0"
              :style="inputStyle('taxRate')"
            />
            <span v-if="errors.taxRate" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ errors.taxRate }}</span>
          </div>
        </div>

        <!-- Line items -->
        <div style="display:flex;flex-direction:column;gap:8px">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Line Items</label>
            <button
              type="button"
              style="display:flex;align-items:center;gap:6px;background:none;border:none;cursor:pointer;font-size:13px;font-weight:600;color:#b45309;font-family:'Manrope',sans-serif;padding:4px 0"
              @click="addItem"
            >
              <UIcon name="i-lucide-plus" style="width:14px;height:14px" />
              Add Item
            </button>
          </div>

          <div
            v-for="(item, i) in items"
            :key="i"
            style="display:grid;grid-template-columns:1fr 80px 110px 32px;gap:8px;align-items:center"
          >
            <input
              v-model="item.description"
              type="text"
              placeholder="Description"
              style="width:100%;height:40px;padding:0 12px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box"
            />
            <input
              v-model.number="item.quantity"
              type="number"
              min="1"
              step="1"
              placeholder="Qty"
              title="Quantity"
              style="width:100%;height:40px;padding:0 12px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box"
            />
            <input
              v-model.number="item.unitPrice"
              type="number"
              min="0"
              step="0.01"
              placeholder="Unit price"
              title="Unit price (GHS)"
              style="width:100%;height:40px;padding:0 12px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box"
            />
            <button
              type="button"
              :disabled="items.length === 1"
              :style="`width:32px;height:32px;border:none;border-radius:8px;background:${items.length === 1 ? '#f3f4f6' : 'rgba(239,68,68,0.1)'};cursor:${items.length === 1 ? 'not-allowed' : 'pointer'};display:flex;align-items:center;justify-content:center`"
              title="Remove item"
              @click="removeItem(i)"
            >
              <UIcon name="i-lucide-trash-2" :style="`width:14px;height:14px;color:${items.length === 1 ? '#9ca3af' : '#ef4444'}`" />
            </button>
          </div>
          <span v-if="errors.items" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ errors.items }}</span>

          <!-- Totals preview -->
          <div style="background:#f8f9fa;border-radius:12px;padding:12px 16px;display:flex;flex-direction:column;gap:6px;margin-top:4px">
            <div style="display:flex;justify-content:space-between">
              <span style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif">Subtotal</span>
              <span style="font-size:13px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ format(subtotal) }}</span>
            </div>
            <div style="display:flex;justify-content:space-between">
              <span style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif">Tax ({{ Number(form.taxRate) || 0 }}%)</span>
              <span style="font-size:13px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ format(taxAmount) }}</span>
            </div>
            <div style="display:flex;justify-content:space-between;border-top:1px solid #e5e7eb;padding-top:6px">
              <span style="font-size:14px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">Total</span>
              <span style="font-size:14px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ format(total) }}</span>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Notes</label>
          <textarea
            v-model="form.notes"
            rows="3"
            maxlength="500"
            placeholder="Optional notes shown on the invoice..."
            style="width:100%;padding:10px 12px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;resize:none;box-sizing:border-box;line-height:1.5"
          />
          <div style="display:flex;justify-content:flex-end">
            <span style="font-size:12px;color:#9ca3af;font-family:'Manrope',sans-serif">{{ form.notes.length }}/500</span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div style="padding:17px 24px;border-top:1px solid #e5e7eb;display:flex;justify-content:flex-end;gap:8px;flex-shrink:0">
        <button
          style="height:40px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
          @click="emit('close')"
        >Cancel</button>
        <button
          :disabled="submitting || loadingCustomers"
          :style="`height:40px;padding:0 20px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:${(submitting || loadingCustomers) ? 'not-allowed' : 'pointer'};opacity:${(submitting || loadingCustomers) ? 0.6 : 1}`"
          @click="submit"
        >{{ submitting ? 'Creating…' : 'Create Invoice' }}</button>
      </div>
    </div>
  </div>
</template>
