<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const id = route.params.id as string
const { format } = useCurrency()
const api = useApi()

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

interface InvoiceCustomer {
  id: string
  name: string
  email: string
  address: string
  phoneNumber: string
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
  paymentMethod: string
  notes: string | null
  createdAt: string
  updatedAt: string
  items: InvoiceItem[]
  customer: InvoiceCustomer
}

const invoice = ref<InvoiceDetail | null>(null)
const loading = ref(true)
const downloading = ref(false)
const sending = ref(false)
const toast = useAppToast()

function formatDate(dateString: string | null) {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

async function fetchInvoice() {
  loading.value = true
  try {
    const data = await api.get<InvoiceDetail>(`/invoices/admin/${id}`, 'Failed to load invoice')
    if (data) {
      invoice.value = data
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchInvoice()
})

async function downloadPdf() {
  downloading.value = true
  try {
    const config = useRuntimeConfig()
    const authStore = useAuthStore()
    const res = await fetch(`${config.public.apiBase}/invoices/admin/${id}/pdf`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
      },
    })
    if (!res.ok) throw new Error('Failed to download PDF')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${invoice.value?.invoiceNumber || 'invoice'}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('PDF downloaded successfully')
  } catch {
    toast.error('Failed to download PDF')
  } finally {
    downloading.value = false
  }
}

async function sendInvoice() {
  sending.value = true
  try {
    const result = await api.post<{ success: boolean; message: string }>(
      `/invoices/admin/${id}/send`,
      {},
      'Failed to send invoice'
    )
    if (result) {
      toast.success(result.message || 'Invoice sent to customer')
    }
  } finally {
    sending.value = false
  }
}

// --- Status update modal ------------------------------------------------------
const showStatusModal = ref(false)

function handleStatusUpdated(updated: InvoiceDetail) {
  // The PATCH returns the full updated invoice
  if (updated?.id) invoice.value = updated
  showStatusModal.value = false
}

// --- BluPay payment prompt ------------------------------------------------------
// Only these invoice types have a linked payment the prompt can collect
// against — anything else (e.g. manual invoices) would 400 on the backend.
const PAYABLE_INVOICE_TYPES = ['subscription', 'pay_as_you_go', 'store_order']
const initiatingPayment = ref(false)
const canInitiatePayment = computed(() =>
  ['pending', 'overdue'].includes(invoice.value?.status ?? '') &&
  PAYABLE_INVOICE_TYPES.includes(invoice.value?.type ?? '')
)

async function initiatePayment() {
  if (!invoice.value || initiatingPayment.value) return
  initiatingPayment.value = true
  const result = await api.post<{ success: boolean; message?: string }>(
    `/invoices/admin/${id}/initiate-payment`,
    {},
    'Failed to initiate payment'
  )
  initiatingPayment.value = false
  if (result?.success) {
    toast.success(result.message || 'Payment prompt sent to customer')
  }
}

function statusBadge(s: string) {
  if (s === 'paid')    return { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.2)',  color: '#22c55e', label: 'Paid' }
  if (s === 'pending') return { bg: 'rgba(255,180,0,0.1)',  border: 'rgba(255,180,0,0.2)',  color: '#d49a00', label: 'Pending' }
  if (s === 'overdue') return { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.2)',  color: '#ef4444', label: 'Overdue' }
  if (s === 'draft')   return { bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.2)', color: '#6b7280', label: 'Draft' }
  if (s === 'cancelled') return { bg: '#e5e7eb', border: '#d1d5db', color: '#6b7280', label: 'Cancelled' }
  if (s === 'void')    return { bg: '#f3f4f6', border: '#d1d5db', color: '#9ca3af', label: 'Void' }
  return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280', label: s }
}
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:24px">

    <!-- Back link -->
    <NuxtLink to="/billing" style="display:inline-flex;align-items:center;gap:8px;text-decoration:none">
      <UIcon name="i-lucide-arrow-left" style="width:16px;height:16px;color:#6b7280" />
      <span style="font-size:16px;color:#6b7280;font-family:'Manrope',sans-serif">Back to Billing</span>
    </NuxtLink>

    <!-- Loading skeleton -->
    <div v-if="loading" style="background:white;border:1px solid #ececec;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
      <div style="display:flex;flex-direction:column;gap:32px">
        <div style="display:flex;justify-content:space-between">
          <div>
            <div class="skeleton" style="height:32px;width:180px;border-radius:6px" />
            <div class="skeleton" style="height:20px;width:60px;border-radius:14px;margin-top:12px" />
          </div>
          <div style="display:flex;gap:8px">
            <div class="skeleton" style="height:40px;width:140px;border-radius:20px" />
            <div class="skeleton" style="height:40px;width:100px;border-radius:20px" />
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px">
          <div><div class="skeleton" style="height:14px;width:80px;margin-bottom:12px" /><div class="skeleton" style="height:60px;border-radius:6px" /></div>
          <div><div class="skeleton" style="height:14px;width:80px;margin-bottom:12px" /><div class="skeleton" style="height:60px;border-radius:6px" /></div>
        </div>
        <div class="skeleton" style="height:80px;border-radius:6px" />
        <div class="skeleton" style="height:120px;border-radius:6px" />
      </div>
    </div>

    <!-- Invoice card -->
    <div v-else-if="invoice" style="background:white;border:1px solid #ececec;border-radius:16px;padding:1px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
      <div style="padding:20px 32px;display:flex;flex-direction:column;gap:32px">

        <!-- Header: invoice id + status + buttons -->
        <div style="display:flex;align-items:flex-start;justify-content:space-between">
          <div>
            <h1 style="font-size:32px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;line-height:1.3">{{ invoice.invoiceNumber }}</h1>
            <span
              :style="`display:inline-block;margin-top:8px;font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 10px;color:${statusBadge(invoice.status).color};background:${statusBadge(invoice.status).bg};border:1px solid ${statusBadge(invoice.status).border}`"
            >{{ statusBadge(invoice.status).label }}</span>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <button
              v-if="canInitiatePayment"
              :disabled="initiatingPayment"
              :style="`height:40px;padding:0 16px 0 40px;background:${initiatingPayment ? '#93c5fd' : '#3b82f6'};border:none;border-radius:20px;font-size:14px;font-weight:500;color:white;font-family:'Manrope',sans-serif;cursor:${initiatingPayment ? 'not-allowed' : 'pointer'};position:relative;display:flex;align-items:center;gap:8px`"
              title="Send a BluPay mobile-money collection prompt to the customer"
              @click="initiatePayment"
            >
              <UIcon :name="initiatingPayment ? 'i-lucide-loader-2' : 'i-lucide-smartphone'" :style="`width:16px;height:16px;color:white;position:absolute;left:16px;${initiatingPayment ? 'animation:spin 1s linear infinite' : ''}`" />
              {{ initiatingPayment ? 'Sending Prompt...' : 'Request Payment' }}
            </button>
            <button
              style="height:40px;padding:0 16px 0 40px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer;position:relative;display:flex;align-items:center;gap:8px"
              @click="showStatusModal = true"
              @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
              @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
            >
              <UIcon name="i-lucide-pencil" style="width:16px;height:16px;color:#111;position:absolute;left:16px" />
              Update Status
            </button>
            <button
              :disabled="downloading"
              :style="`height:40px;padding:0 16px 0 40px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:${downloading ? 'not-allowed' : 'pointer'};position:relative;display:flex;align-items:center;gap:8px;opacity:${downloading ? '0.7' : '1'}`"
              @click="downloadPdf"
              @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
              @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
            >
              <UIcon :name="downloading ? 'i-lucide-loader-2' : 'i-lucide-download'" :style="`width:16px;height:16px;color:#111;position:absolute;left:16px;${downloading ? 'animation:spin 1s linear infinite' : ''}`" />
              {{ downloading ? 'Downloading...' : 'Download PDF' }}
            </button>
            <button
              :disabled="sending"
              :style="`height:40px;padding:0 16px 0 40px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:${sending ? 'not-allowed' : 'pointer'};position:relative;display:flex;align-items:center;gap:8px;opacity:${sending ? '0.7' : '1'}`"
              @click="sendInvoice"
              @mouseover="($event.currentTarget as HTMLElement).style.opacity='0.9'"
              @mouseleave="($event.currentTarget as HTMLElement).style.opacity='1'"
            >
              <UIcon :name="sending ? 'i-lucide-loader-2' : 'i-lucide-send'" :style="`width:16px;height:16px;color:#111;position:absolute;left:16px;${sending ? 'animation:spin 1s linear infinite' : ''}`" />
              {{ sending ? 'Sending...' : 'Send' }}
            </button>
          </div>
        </div>

        <!-- From / Bill To -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px">
          <div>
            <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin-bottom:16px">From</p>
            <p style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;margin-bottom:4px">LaCarte Waste Management</p>
            <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;line-height:1.6">
              Accra, Ghana<br>
              contact@lacarte.com
            </p>
          </div>
          <div>
            <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin-bottom:16px">Bill To</p>
            <p style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;margin-bottom:4px">{{ invoice.customer.name }}</p>
            <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;line-height:1.6">
              {{ invoice.customer.address }}<br>
              {{ invoice.customer.email }}<br>
              {{ invoice.customer.phoneNumber }}
            </p>
          </div>
        </div>

        <!-- Invoice meta: date / due / payment method -->
        <div style="border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;padding:24px 0">
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:24px">
            <div>
              <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:4px">Invoice Date</p>
              <p style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">{{ formatDate(invoice.issueDate) }}</p>
            </div>
            <div>
              <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:4px">Due Date</p>
              <p style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">{{ formatDate(invoice.dueDate) }}</p>
            </div>
            <div>
              <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:4px">Payment Method</p>
              <p style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">{{ invoice.paymentMethod || '—' }}</p>
            </div>
            <div>
              <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:4px">Paid At</p>
              <p style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">{{ formatDate(invoice.paidAt) }}</p>
            </div>
          </div>
        </div>

        <!-- Invoice Details table -->
        <div style="display:flex;flex-direction:column;gap:16px">
          <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Invoice Details</p>
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="border-bottom:1px solid #e5e7eb">
                <th style="padding:12px 0;text-align:left;font-size:14px;font-weight:500;color:#6b7280;font-family:'Manrope',sans-serif">Description</th>
                <th style="padding:12px 0;text-align:right;font-size:14px;font-weight:500;color:#6b7280;font-family:'Manrope',sans-serif">Quantity</th>
                <th style="padding:12px 0;text-align:right;font-size:14px;font-weight:500;color:#6b7280;font-family:'Manrope',sans-serif">Unit Price</th>
                <th style="padding:12px 0;text-align:right;font-size:14px;font-weight:500;color:#6b7280;font-family:'Manrope',sans-serif">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, i) in invoice.items"
                :key="item.id"
                style="border-bottom:1px solid #e5e7eb"
              >
                <td style="padding:12px 0;font-size:16px;color:#111;font-family:'Manrope',sans-serif">{{ item.description }}</td>
                <td style="padding:12px 0;font-size:16px;color:#111;font-family:'Manrope',sans-serif;text-align:right">{{ item.quantity }}</td>
                <td style="padding:12px 0;font-size:16px;color:#111;font-family:'Manrope',sans-serif;text-align:right">{{ format(item.unitPrice) }}</td>
                <td style="padding:12px 0;font-size:16px;color:#111;font-family:'Manrope',sans-serif;text-align:right">{{ format(item.amount) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Totals -->
        <div style="display:flex;justify-content:flex-end">
          <div style="width:256px;display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;justify-content:space-between">
              <span style="font-size:16px;color:#6b7280;font-family:'Manrope',sans-serif">Subtotal</span>
              <span style="font-size:16px;color:#111;font-family:'Manrope',sans-serif">{{ format(invoice.subtotal) }}</span>
            </div>
            <div style="display:flex;justify-content:space-between">
              <span style="font-size:16px;color:#6b7280;font-family:'Manrope',sans-serif">Tax ({{ invoice.taxRate }}%)</span>
              <span style="font-size:16px;color:#111;font-family:'Manrope',sans-serif">{{ format(invoice.taxAmount) }}</span>
            </div>
            <div style="border-top:1px solid #e5e7eb;padding-top:8px;display:flex;justify-content:space-between">
              <span style="font-size:16px;font-weight:700;color:#111;font-family:'Manrope',sans-serif">Total</span>
              <span style="font-size:18px;font-weight:700;color:#111;font-family:'Manrope',sans-serif">{{ format(invoice.totalAmount) }}</span>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div v-if="invoice.notes" style="background:#f8f9fa;border-radius:12px;padding:16px">
          <p style="font-size:14px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin-bottom:6px">Notes</p>
          <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;line-height:1.6;white-space:pre-wrap">{{ invoice.notes }}</p>
        </div>

      </div>
    </div>

    <!-- Not found -->
    <div v-else style="background:white;border:1px solid #ececec;border-radius:16px;padding:60px 32px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
      <UIcon name="i-lucide-file-x" style="width:48px;height:48px;color:#d1d5db;margin-bottom:12px" />
      <p style="font-size:18px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;margin:0 0 6px">Invoice not found</p>
      <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">The invoice you're looking for doesn't exist or couldn't be loaded.</p>
    </div>

    <!-- Update status modal -->
    <LazyUpdateInvoiceStatusModal
      v-if="showStatusModal && invoice"
      :invoice="invoice"
      @close="showStatusModal = false"
      @updated="handleStatusUpdated"
    />

  </div>
</template>

<style scoped>
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
