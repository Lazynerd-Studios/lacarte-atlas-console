<script setup lang="ts">
definePageMeta({ layout: 'default' })

const customer = {
  id: 'CUST-2025-1',
  name: 'Sarah Johnson',
  phone: '(555) 123-4567',
  outstandingCount: 2,
  totalDue: 90,
  invoices: [
    { id: 'INV-2026-002', description: 'Monthly Subscription', date: '2026-03-01', amount: 45, status: 'pending' },
    { id: 'INV-2026-003', description: 'Monthly Subscription', date: '2026-02-01', amount: 45, status: 'overdue' },
  ],
}

// Payment form state
const paymentMode = ref<'cash' | 'momo'>('cash')
const telco = ref('')
const momoNumber = ref('')
const customAmount = ref<string>(String(customer.totalDue))
const paid = ref(false)
const loading = ref(false)

// MoMo pending state
const COUNTDOWN_SECS = 600 // 10 minutes
const awaitingMomo = ref(false)
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
      // timed out — back to form
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

const amountValid = computed(() => {
  const v = parseFloat(customAmount.value)
  return !isNaN(v) && v > 0
})

const momoValid = computed(() => {
  if (paymentMode.value !== 'momo') return true
  return telco.value !== '' && /^0\d{9}$/.test(momoNumber.value)
})

const canPay = computed(() => amountValid.value && momoValid.value)

function handlePayment() {
  if (!canPay.value) return
  if (paymentMode.value === 'momo') {
    // Send prompt to phone — show waiting screen
    awaitingMomo.value = true
    startCountdown()
    // Simulate approval after 5s for demo
    setTimeout(() => {
      if (awaitingMomo.value) {
        clearInterval(countdownTimer!)
        awaitingMomo.value = false
        paid.value = true
      }
    }, 5000)
  } else {
    loading.value = true
    setTimeout(() => {
      loading.value = false
      paid.value = true
    }, 1200)
  }
}

function statusColor(s: string) {
  if (s === 'overdue') return { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' }
  return { color: '#d49a00', bg: 'rgba(255,180,0,0.1)', border: 'rgba(255,180,0,0.2)' }
}

const selectedTelco = computed(() => telcos.find(t => t.value === telco.value))
</script>

<template>
  <div style="min-height:100vh;background:#f8f9fa;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;font-family:'Manrope',sans-serif">

    <div style="background:white;border-radius:24px;box-shadow:0 4px 24px rgba(0,0,0,0.08);width:100%;max-width:480px;overflow:hidden">

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
              <p style="font-size:14px;font-weight:600;color:#111;margin:3px 0 0">{{ customer.name }}</p>
            </div>
            <div>
              <p style="font-size:11px;color:#6b7280;margin:0;text-transform:uppercase;letter-spacing:0.05em">Customer ID</p>
              <p style="font-size:14px;font-weight:600;color:#111;margin:3px 0 0">{{ customer.id }}</p>
            </div>
            <div>
              <p style="font-size:11px;color:#6b7280;margin:0;text-transform:uppercase;letter-spacing:0.05em">Phone</p>
              <p style="font-size:14px;font-weight:600;color:#111;margin:3px 0 0">{{ customer.phone }}</p>
            </div>
          </div>
        </div>

        <!-- Welcome -->
        <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 20px">
          Welcome, <strong>{{ customer.name.split(' ')[0] }}</strong>! Pay your outstanding bill by pressing or clicking on the <strong>"Make a Payment"</strong> button below. Thank you!
        </p>

        <!-- Summary tiles -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
          <div style="background:#fff9e6;border:1px solid rgba(255,180,0,0.2);border-radius:14px;padding:14px 16px;text-align:center">
            <p style="font-size:28px;font-weight:700;color:#ffb400;margin:0;line-height:1">{{ customer.outstandingCount }}</p>
            <p style="font-size:12px;color:#6b7280;margin:4px 0 0">Outstanding Owed</p>
          </div>
          <div style="background:#fef2f2;border:1px solid rgba(239,68,68,0.2);border-radius:14px;padding:14px 16px;text-align:center">
            <p style="font-size:22px;font-weight:700;color:#ef4444;margin:0;line-height:1">GHS {{ customer.totalDue }}</p>
            <p style="font-size:12px;color:#6b7280;margin:4px 0 0">Total Amount Due</p>
          </div>
        </div>

        <!-- Invoice list -->
        <div style="border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;margin-bottom:20px">
          <div style="background:#f8f9fa;padding:10px 16px;border-bottom:1px solid #e5e7eb">
            <p style="font-size:13px;font-weight:600;color:#111;margin:0">Payment Details</p>
          </div>
          <div
            v-for="(inv, i) in customer.invoices"
            :key="inv.id"
            :style="`padding:12px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;${i < customer.invoices.length - 1 ? 'border-bottom:1px solid #e5e7eb' : ''}`"
          >
            <div>
              <p style="font-size:13px;font-weight:500;color:#111;margin:0">{{ inv.description }}</p>
              <p style="font-size:12px;color:#6b7280;margin:2px 0 0">{{ inv.id }} · {{ inv.date }}</p>
            </div>
            <div style="display:flex;align-items:center;gap:10px;flex-shrink:0">
              <span :style="`font-size:12px;font-weight:500;border-radius:20px;padding:2px 10px;color:${statusColor(inv.status).color};background:${statusColor(inv.status).bg};border:1px solid ${statusColor(inv.status).border}`">{{ inv.status }}</span>
              <span style="font-size:14px;font-weight:600;color:#111">GHS {{ inv.amount }}</span>
            </div>
          </div>
        </div>

        <!-- Payment form (hidden after success) -->
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

          <!-- Amount -->
          <p style="font-size:13px;font-weight:600;color:#111;margin:0 0 8px">Amount (GHS)</p>
          <div style="position:relative;margin-bottom:20px">
            <span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:14px;font-weight:600;color:#6b7280;pointer-events:none">GHS</span>
            <input
              v-model="customAmount"
              type="number"
              min="1"
              :placeholder="`${customer.totalDue}`"
              style="width:100%;height:44px;padding:0 14px 0 52px;border:1px solid #e5e7eb;border-radius:12px;font-size:15px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box;background:white"
              @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
              @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
            />
          </div>

          <!-- CTA -->
          <button
            :disabled="loading || !canPay"
            :style="`width:100%;height:48px;background:${canPay ? '#22c55e' : '#d1d5db'};border:none;border-radius:14px;font-size:15px;font-weight:600;color:white;font-family:'Manrope',sans-serif;cursor:${canPay ? 'pointer' : 'not-allowed'};display:flex;align-items:center;justify-content:center;gap:8px;transition:background 0.15s`"
            @click="handlePayment"
            @mouseover="canPay && !loading && (($event.currentTarget as HTMLElement).style.background='#16a34a')"
            @mouseleave="($event.currentTarget as HTMLElement).style.background = canPay ? '#22c55e' : '#d1d5db'"
          >
            <UIcon v-if="!loading" name="i-lucide-credit-card" style="width:18px;height:18px;color:white" />
            <UIcon v-else name="i-lucide-loader" style="width:18px;height:18px;color:white;animation:spin 1s linear infinite" />
            {{ loading ? 'Processing...' : `Pay GHS ${customAmount || customer.totalDue}` }}
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

          <p style="font-size:12px;color:#9ca3af;margin:0 0 20px">Amount: <strong style="color:#111">GHS {{ customAmount }}</strong></p>

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
            GHS {{ customAmount }} received via {{ paymentMode === 'momo' ? `${selectedTelco?.fullLabel} (${momoNumber})` : 'Cash' }}. Thank you!
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
