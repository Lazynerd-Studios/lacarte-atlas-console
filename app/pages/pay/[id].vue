<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const invoiceId = route.params.id as string
const api = useApi()
const toast = useAppToast()

// ── Types ────────────────────────────────────────────────────────────────────

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

interface InvoiceDetail {
  id: string
  invoiceNumber: string
  customerId: string
  type: string
  status: string
  issueDate: string
  dueDate: string
  paidAt: string | null
  subtotal: number
  taxRate: number
  taxAmount: number
  totalAmount: number
  currency: string
  paymentMethod: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  items: InvoiceItem[]
  customer?: {
    id: string
    name: string
    email: string
    address: string | null
    phoneNumber: string
  } | null
}

// ── State ────────────────────────────────────────────────────────────────────

const invoice = ref<InvoiceDetail | null>(null)
const pageLoading = ref(true)
const pageError = ref<string | null>(null)

// Derived convenience refs (populated once invoice is loaded)
const customerName = computed(() => invoice.value?.customer?.name ?? 'Customer')
const customerPhone = computed(() => invoice.value?.customer?.phoneNumber ?? '—')
const customerId = computed(() => invoice.value?.customerId ?? '—')
const totalDue = computed(() => invoice.value?.totalAmount ?? 0)
const currency = computed(() => invoice.value?.currency ?? 'GHS')
const alreadyPaid = computed(() => invoice.value?.status === 'paid')

// Payment form state
const paymentMode = ref<'cash' | 'momo'>('cash')
const telco = ref('')
const momoNumber = ref('')
const paid = ref(false)
const payLoading = ref(false)

// MoMo pending state (sent prompt, waiting for customer approval)
const awaitingMomo = ref(false)
const COUNTDOWN_SECS = 600 // 10 minutes
const countdown = ref(COUNTDOWN_SECS)
let countdownTimer: ReturnType<typeof setInterval> | null = null

const countdownDisplay = computed(() => {
  const m = Math.floor(countdown.value / 60).toString().padStart(2, '0')
  const s = (countdown.value % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})

const countdownPct = computed(() => (countdown.value / COUNTDOWN_SECS) * 100)

function startCountdown() {
  countdown.value = COUNTDOWN_SECS
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownTimer!)
      awaitingMomo.value = false
      toast.warning('Payment prompt expired. Please try again.')
    }
  }, 1000)
}

function cancelMomo() {
  if (countdownTimer) clearInterval(countdownTimer)
  awaitingMomo.value = false
  countdown.value = COUNTDOWN_SECS
}

onUnmounted(() => { if (countdownTimer) clearInterval(countdownTimer) })

const telcos = [
  { value: 'mtn',       label: 'MTN',       fullLabel: 'MTN Mobile Money',    color: '#ffcc00', textColor: '#7a5c00' },
  { value: 'telecel',   label: 'Telecel',   fullLabel: 'Telecel Cash',         color: '#e2001a', textColor: '#e2001a' },
  { value: 'airteltigo', label: 'AirtelTigo', fullLabel: 'AirtelTigo Money',  color: '#0066cc', textColor: '#0066cc' },
]

const amountValid = computed(() => totalDue.value > 0)

const momoValid = computed(() => {
  if (paymentMode.value !== 'momo') return true
  return telco.value !== '' && /^0\d{9}$/.test(momoNumber.value)
})

const canPay = computed(() => amountValid.value && momoValid.value && !alreadyPaid.value)

// ── API ───────────────────────────────────────────────────────────────────────

async function fetchInvoice() {
  pageLoading.value = true
  pageError.value = null
  try {
    const data = await api.get<InvoiceDetail>(`/invoices/admin/${invoiceId}`, 'Failed to load invoice')
    if (data) {
      invoice.value = data
      // Pre-fill paid state if invoice is already settled
      if (data.status === 'paid') paid.value = true
    } else {
      pageError.value = 'Invoice not found.'
    }
  } catch {
    pageError.value = 'Failed to load invoice. Please try again.'
  } finally {
    pageLoading.value = false
  }
}

async function handlePayment() {
  if (!canPay.value || payLoading.value) return

  if (paymentMode.value === 'momo') {
    // Trigger real BluPay mobile-money prompt via the API
    payLoading.value = true
    try {
      const result = await api.post<{ success: boolean; message: string }>(
        `/invoices/admin/${invoiceId}/initiate-payment`,
        {},
        'Failed to initiate payment'
      )
      if (result?.success) {
        toast.success('Payment prompt sent', 'Check your phone and approve the prompt.')
        awaitingMomo.value = true
        startCountdown()
      }
    } catch {
      // error handled by useErrorHandler
    } finally {
      payLoading.value = false
    }
  } else {
    // Cash payment — mark invoice as paid via status update
    payLoading.value = true
    try {
      const result = await api.patch<InvoiceDetail>(
        `/invoices/admin/${invoiceId}/status`,
        { status: 'paid', paymentMethod: 'Cash' },
        'Failed to record cash payment'
      )
      if (result) {
        invoice.value = result
        paid.value = true
        toast.success('Payment recorded', 'Invoice marked as paid.')
      }
    } catch {
      // error handled by useErrorHandler
    } finally {
      payLoading.value = false
    }
  }
}

function statusColor(s: string) {
  if (s === 'overdue') return { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' }
  return { color: '#d49a00', bg: 'rgba(255,180,0,0.1)', border: 'rgba(255,180,0,0.2)' }
}

const selectedTelco = computed(() => telcos.find(t => t.value === telco.value))

// ── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(() => {
  fetchInvoice()
})
</script>

<template>
  <div style="min-height:100vh;background:#f8f9fa;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;font-family:'Manrope',sans-serif">

    <!-- Page loading skeleton -->
    <div v-if="pageLoading" style="background:white;border-radius:24px;box-shadow:0 4px 24px rgba(0,0,0,0.08);width:100%;max-width:480px;overflow:hidden;padding:40px 32px;text-align:center">
      <UIcon name="i-lucide-loader-2" style="width:32px;height:32px;color:#ffb400;animation:spin 1s linear infinite;margin:0 auto 12px;display:block" />
      <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0">Loading invoice...</p>
    </div>

    <!-- Page error state -->
    <div v-else-if="pageError" style="background:white;border-radius:24px;box-shadow:0 4px 24px rgba(0,0,0,0.08);width:100%;max-width:480px;overflow:hidden;padding:40px 32px;text-align:center">
      <UIcon name="i-lucide-circle-alert" style="width:40px;height:40px;color:#ef4444;margin:0 auto 12px;display:block" />
      <p style="font-size:16px;font-weight:700;color:#111;margin:0 0 8px">Unable to Load Invoice</p>
      <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0 0 20px">{{ pageError }}</p>
      <button
        style="height:40px;padding:0 20px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:600;color:#7a5c00;font-family:'Manrope',sans-serif;cursor:pointer"
        @click="fetchInvoice"
      >Try Again</button>
    </div>

    <!-- Main card -->
    <div v-else style="background:white;border-radius:24px;box-shadow:0 4px 24px rgba(0,0,0,0.08);width:100%;max-width:480px;overflow:hidden">

      <!-- Header -->
      <div style="background:#ffb400;padding:28px 32px 24px">
        <div style="display:flex;align-items:center;gap:14px">
          <div style="width:52px;height:52px;background:rgba(255,255,255,0.25);border-radius:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <UIcon name="i-lucide-credit-card" style="width:26px;height:26px;color:white" />
          </div>
          <div>
            <p style="font-size:20px;font-weight:700;color:white;margin:0;line-height:1.3">LaCarte Waste</p>
            <p style="font-size:13px;color:rgba(255,255,255,0.8);margin:2px 0 0">Customer Payment Portal</p>
          </div>
        </div>
      </div>

      <div style="padding:28px 32px">

        <!-- Customer info -->
        <div style="background:#f8f9fa;border-radius:16px;padding:16px 20px;margin-bottom:20px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div>
              <p style="font-size:11px;color:#6b7280;margin:0;text-transform:uppercase;letter-spacing:0.05em">Name</p>
              <p style="font-size:14px;font-weight:600;color:#111;margin:3px 0 0">{{ customerName }}</p>
            </div>
            <div>
              <p style="font-size:11px;color:#6b7280;margin:0;text-transform:uppercase;letter-spacing:0.05em">Invoice</p>
              <p style="font-size:14px;font-weight:600;color:#111;margin:3px 0 0">{{ invoice?.invoiceNumber ?? '—' }}</p>
            </div>
            <div>
              <p style="font-size:11px;color:#6b7280;margin:0;text-transform:uppercase;letter-spacing:0.05em">Phone</p>
              <p style="font-size:14px;font-weight:600;color:#111;margin:3px 0 0">{{ customerPhone }}</p>
            </div>
          </div>
        </div>

        <!-- Welcome -->
        <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 20px">
          Welcome, <strong>{{ customerName.split(' ')[0] }}</strong>! Pay your outstanding bill by pressing or clicking on the <strong>"Make a Payment"</strong> button below. Thank you!
        </p>

        <!-- Summary tile: total due -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
          <div style="background:#fff9e6;border:1px solid rgba(255,180,0,0.2);border-radius:14px;padding:14px 16px;text-align:center">
            <p style="font-size:22px;font-weight:700;color:#ffb400;margin:0;line-height:1;text-transform:capitalize">{{ invoice?.type?.replace('_', ' ') ?? '—' }}</p>
            <p style="font-size:12px;color:#6b7280;margin:4px 0 0">Invoice Type</p>
          </div>
          <div style="background:#fef2f2;border:1px solid rgba(239,68,68,0.2);border-radius:14px;padding:14px 16px;text-align:center">
            <p style="font-size:22px;font-weight:700;color:#ef4444;margin:0;line-height:1">{{ currency }} {{ totalDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</p>
            <p style="font-size:12px;color:#6b7280;margin:4px 0 0">Total Amount Due</p>
          </div>
        </div>

        <!-- Invoice line items -->
        <div v-if="invoice?.items?.length" style="border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;margin-bottom:20px">
          <div style="background:#f8f9fa;padding:10px 16px;border-bottom:1px solid #e5e7eb">
            <p style="font-size:13px;font-weight:600;color:#111;margin:0">Payment Details</p>
          </div>
          <div
            v-for="(item, i) in invoice.items"
            :key="item.id"
            :style="`padding:12px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;${i < invoice!.items.length - 1 ? 'border-bottom:1px solid #e5e7eb' : ''}`"
          >
            <div>
              <p style="font-size:13px;font-weight:500;color:#111;margin:0">{{ item.description }}</p>
              <p style="font-size:12px;color:#6b7280;margin:2px 0 0">Qty: {{ item.quantity }}</p>
            </div>
            <span style="font-size:14px;font-weight:600;color:#111;flex-shrink:0">{{ currency }} {{ item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
          </div>
        </div>

        <!-- Payment form (hidden after success or while awaiting MoMo) -->
        <template v-if="!paid && !awaitingMomo">

          <!-- Payment mode toggle -->
          <p style="font-size:13px;font-weight:600;color:#111;margin:0 0 10px">Payment Mode</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px">
            <button
              :style="`height:52px;border-radius:14px;border:2px solid ${paymentMode === 'cash' ? '#ffb400' : '#e5e7eb'};background:${paymentMode === 'cash' ? '#fff9e6' : 'white'};cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;font-size:14px;font-weight:600;color:${paymentMode === 'cash' ? '#b37d00' : '#6b7280'};font-family:'Manrope',sans-serif;transition:all 0.15s`"
              @click="paymentMode = 'cash'"
            >
              <UIcon name="i-lucide-banknote" :style="`width:18px;height:18px;color:${paymentMode === 'cash' ? '#ffb400' : '#9ca3af'}`" />
              Cash
            </button>
            <button
              :style="`height:52px;border-radius:14px;border:2px solid ${paymentMode === 'momo' ? '#22c55e' : '#e5e7eb'};background:${paymentMode === 'momo' ? '#f0fdf4' : 'white'};cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;font-size:14px;font-weight:600;color:${paymentMode === 'momo' ? '#15803d' : '#6b7280'};font-family:'Manrope',sans-serif;transition:all 0.15s`"
              @click="paymentMode = 'momo'"
            >
              <UIcon name="i-lucide-smartphone" :style="`width:18px;height:18px;color:${paymentMode === 'momo' ? '#22c55e' : '#9ca3af'}`" />
              Mobile Money
            </button>
          </div>

          <!-- Mobile Money fields -->
          <template v-if="paymentMode === 'momo'">
            <!-- Telco selector -->
            <p style="font-size:13px;font-weight:600;color:#111;margin:0 0 10px">Select Network</p>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px">
              <button
                v-for="t in telcos"
                :key="t.value"
                :style="`height:44px;border-radius:12px;border:2px solid ${telco === t.value ? t.color : '#e5e7eb'};background:${telco === t.value ? t.color : 'white'};cursor:pointer;font-size:12px;font-weight:700;color:${telco === t.value ? (t.value === 'mtn' ? t.textColor : 'white') : '#6b7280'};font-family:'Manrope',sans-serif;transition:all 0.15s;padding:0 6px`"
                @click="telco = t.value"
              >{{ t.label }}</button>
            </div>

            <!-- MoMo number -->
            <p style="font-size:13px;font-weight:600;color:#111;margin:0 0 8px">Mobile Money Number</p>
            <div style="position:relative;margin-bottom:16px">
              <UIcon name="i-lucide-phone" style="position:absolute;left:14px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:#9ca3af;pointer-events:none" />
              <input
                v-model="momoNumber"
                type="tel"
                placeholder="e.g. 0241234567"
                maxlength="10"
                style="width:100%;height:44px;padding:0 14px 0 40px;border:1px solid #e5e7eb;border-radius:12px;font-size:14px;color:#111;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box;background:white"
                @focus="($event.target as HTMLElement).style.borderColor='#22c55e'"
                @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
              />
            </div>
          </template>

          <!-- Amount display (read-only from invoice) -->
          <div style="background:#f8f9fa;border-radius:12px;padding:14px 16px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between">
            <span style="font-size:13px;font-weight:500;color:#6b7280">Amount to Pay</span>
            <span style="font-size:18px;font-weight:700;color:#111">{{ currency }} {{ totalDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
          </div>

          <!-- CTA -->
          <button
            :disabled="payLoading || !canPay"
            :style="`width:100%;height:48px;background:${canPay ? '#22c55e' : '#d1d5db'};border:none;border-radius:14px;font-size:15px;font-weight:600;color:white;font-family:'Manrope',sans-serif;cursor:${canPay ? 'pointer' : 'not-allowed'};display:flex;align-items:center;justify-content:center;gap:8px;transition:background 0.15s`"
            @click="handlePayment"
            @mouseover="canPay && !payLoading && (($event.currentTarget as HTMLElement).style.background='#16a34a')"
            @mouseleave="($event.currentTarget as HTMLElement).style.background = canPay ? '#22c55e' : '#d1d5db'"
          >
            <UIcon v-if="!payLoading" name="i-lucide-credit-card" style="width:18px;height:18px;color:white" />
            <UIcon v-else name="i-lucide-loader-2" style="width:18px;height:18px;color:white;animation:spin 1s linear infinite" />
            {{ payLoading ? 'Processing...' : `Pay ${currency} ${totalDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }}
          </button>

        </template>

        <!-- Awaiting MoMo approval -->
        <div v-if="awaitingMomo" style="text-align:center;padding:8px 0 4px">
          <!-- Pulsing phone icon -->
          <div style="width:72px;height:72px;background:#f0fdf4;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;animation:pulse 1.5s ease-in-out infinite">
            <UIcon name="i-lucide-smartphone" style="width:32px;height:32px;color:#22c55e" />
          </div>

          <p style="font-size:16px;font-weight:700;color:#111;margin:0 0 6px">Waiting for Payment Approval</p>
          <p style="font-size:13px;color:#6b7280;margin:0 0 20px;line-height:1.5">
            A payment prompt has been sent to<br>
            <strong style="color:#111">{{ momoNumber }}</strong> ({{ selectedTelco?.fullLabel }}).<br>
            Please approve on your phone.
          </p>

          <!-- Circular countdown -->
          <div style="position:relative;width:96px;height:96px;margin:0 auto 20px">
            <svg width="96" height="96" style="transform:rotate(-90deg)">
              <circle cx="48" cy="48" r="40" fill="none" stroke="#e5e7eb" stroke-width="6" />
              <circle
                cx="48" cy="48" r="40" fill="none"
                :stroke="countdown <= 60 ? '#ef4444' : '#22c55e'"
                stroke-width="6"
                stroke-linecap="round"
                :stroke-dasharray="`${2 * Math.PI * 40}`"
                :stroke-dashoffset="`${2 * Math.PI * 40 * (1 - countdownPct / 100)}`"
                style="transition:stroke-dashoffset 1s linear,stroke 0.3s"
              />
            </svg>
            <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
              <span :style="`font-size:18px;font-weight:700;font-family:'Manrope',sans-serif;color:${countdown <= 60 ? '#ef4444' : '#111'}`">{{ countdownDisplay }}</span>
              <span style="font-size:10px;color:#6b7280;font-family:'Manrope',sans-serif">remaining</span>
            </div>
          </div>

          <p style="font-size:12px;color:#9ca3af;margin:0 0 20px">Amount: <strong style="color:#111">{{ currency }} {{ totalDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</strong></p>

          <button
            style="width:100%;height:44px;background:white;border:2px solid #e5e7eb;border-radius:14px;font-size:14px;font-weight:600;color:#ef4444;font-family:'Manrope',sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px"
            @click="cancelMomo"
            @mouseover="($event.currentTarget as HTMLElement).style.borderColor='#ef4444'"
            @mouseleave="($event.currentTarget as HTMLElement).style.borderColor='#e5e7eb'"
          >
            <UIcon name="i-lucide-x" style="width:16px;height:16px;color:#ef4444" />
            Cancel Payment
          </button>
        </div>

        <!-- Success -->
        <div v-else-if="paid" style="background:#f0fdf4;border:1px solid rgba(34,197,94,0.2);border-radius:14px;padding:24px;text-align:center">
          <UIcon name="i-lucide-check-circle" style="width:40px;height:40px;color:#22c55e;margin-bottom:10px" />
          <p style="font-size:16px;font-weight:700;color:#22c55e;margin:0">Payment Successful!</p>
          <p style="font-size:13px;color:#6b7280;margin:6px 0 20px">
            {{ currency }} {{ totalDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} recorded via {{ paymentMode === 'momo' ? `${selectedTelco?.fullLabel} (${momoNumber})` : 'Cash' }}. Thank you!
          </p>
          <NuxtLink to="/" style="text-decoration:none">
            <button
              style="height:44px;padding:0 24px;background:#111;border:none;border-radius:14px;font-size:14px;font-weight:600;color:white;font-family:'Manrope',sans-serif;cursor:pointer;display:inline-flex;align-items:center;gap:8px"
              @mouseover="($event.currentTarget as HTMLElement).style.background='#333'"
              @mouseleave="($event.currentTarget as HTMLElement).style.background='#111'"
            >
              <UIcon name="i-lucide-layout-dashboard" style="width:16px;height:16px;color:white" />
              Return to Dashboard
            </button>
          </NuxtLink>
        </div>

      </div>

      <!-- Footer -->
      <div style="background:#f8f9fa;border-top:1px solid #e5e7eb;padding:14px 32px;text-align:center">
        <p style="font-size:12px;color:#6b7280;margin:0">
          Need help? Contact us at
          <a href="tel:0246039684" style="color:#ffb400;font-weight:600;text-decoration:none">024 603 9684</a>
        </p>
      </div>

    </div>
  </div>
</template>

<style scoped>
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34,197,94,0.3); }
  50% { transform: scale(1.06); box-shadow: 0 0 0 10px rgba(34,197,94,0); }
}
input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
</style>
