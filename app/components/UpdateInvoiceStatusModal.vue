<script setup lang="ts">
const props = defineProps<{
  invoice: {
    id: string
    invoiceNumber: string
    status: string
    paymentMethod: string | null
  }
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'updated', invoice: any): void
}>()

const api = useApi()
const toast = useAppToast()

const INVOICE_STATUSES = ['draft', 'pending', 'paid', 'overdue', 'cancelled', 'void'] as const
const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Mobile Money', 'USSD']

const status = ref(props.invoice.status)
const paymentMethod = ref(
  // Preselect the current method when it matches one of the known options
  PAYMENT_METHODS.find(m => m.toLowerCase() === (props.invoice.paymentMethod ?? '').toLowerCase()) ?? ''
)
const error = ref('')
const submitting = ref(false)

function submit() {
  error.value = ''
  // A payment method only makes sense once the invoice is marked paid
  if (status.value === 'paid' && !paymentMethod.value) {
    error.value = 'Select a payment method when marking an invoice as paid.'
    return
  }
  submitting.value = true
  api.patch<any>(
    `/invoices/admin/${props.invoice.id}/status`,
    { status: status.value, paymentMethod: paymentMethod.value },
    'Failed to update invoice status'
  ).then(result => {
    submitting.value = false
    if (result) {
      toast.success(`Invoice marked as ${status.value}`)
      emit('updated', result)
    }
  })
}

function statusLabel(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const chevronBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`
function selectStyle() {
  return `width:100%;height:42px;padding:0 16px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;cursor:pointer;appearance:none;background-image:${chevronBg};background-repeat:no-repeat;background-position:right 12px center;box-sizing:border-box`
}
</script>

<template>
  <div @click.self="emit('close')" style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px">
    <div style="background:#fff;border-radius:20px;width:100%;max-width:440px;overflow:hidden;font-family:'Manrope',sans-serif">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #f0f0f0">
        <div>
          <h2 style="font-size:18px;font-weight:700;color:#1a1a1a;margin:0">Update Invoice Status</h2>
          <p style="font-size:13px;color:#6b7280;margin:4px 0 0">{{ invoice.invoiceNumber }}</p>
        </div>
        <button @click="emit('close')" style="background:none;border:none;cursor:pointer;color:#6b7280;padding:4px;display:flex;align-items:center">
          <Icon name="lucide:x" style="width:20px;height:20px" />
        </button>
      </div>

      <div style="padding:24px;display:flex;flex-direction:column;gap:16px">
        <div v-if="error" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;font-size:13px;color:#ef4444">{{ error }}</div>

        <div>
          <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Status <span style="color:#ef4444">*</span></label>
          <select v-model="status" :style="selectStyle()">
            <option v-for="s in INVOICE_STATUSES" :key="s" :value="s">{{ statusLabel(s) }}</option>
          </select>
        </div>

        <div>
          <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Payment Method</label>
          <select v-model="paymentMethod" :style="selectStyle()">
            <option value="">None</option>
            <option v-for="m in PAYMENT_METHODS" :key="m" :value="m">{{ m }}</option>
          </select>
          <p style="font-size:12px;color:#9ca3af;margin:6px 0 0">Required when marking the invoice as paid</p>
        </div>
      </div>

      <div style="padding:16px 24px;border-top:1px solid #f0f0f0;display:flex;justify-content:flex-end;gap:10px">
        <button @click="emit('close')" :disabled="submitting" style="background:#ececec;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer">Cancel</button>
        <button @click="submit" :disabled="submitting"
          :style="`background:${submitting ? '#ffd966' : '#ffb400'};color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${submitting ? 'not-allowed' : 'pointer'};display:flex;align-items:center;gap:8px;opacity:${submitting ? '0.7' : '1'}`">
          <Icon v-if="submitting" name="lucide:loader-2" style="width:14px;height:14px;animation:spin 1s linear infinite" />
          {{ submitting ? 'Updating...' : 'Update Status' }}
        </button>
      </div>
    </div>
  </div>
</template>
