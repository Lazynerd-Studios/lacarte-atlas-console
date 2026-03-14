<script setup lang="ts">
const props = defineProps<{
  transfer: {
    id: string
    customer: string
    paymentType: string
    amount: string
    reference: string
    submitted: string
  }
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'decline', id: string): void
}>()

const reason = ref('')
const sendEmail = ref(true)

function decline() {
  emit('decline', props.transfer.id)
}
</script>

<template>
  <div
    style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:50;display:flex;align-items:center;justify-content:center;padding:24px"
    @click.self="emit('close')"
  >
    <div style="background:white;border:1px solid #e5e7eb;border-radius:16px;width:510px;box-shadow:0 10px 15px rgba(0,0,0,0.1),0 4px 6px rgba(0,0,0,0.1);position:relative;display:flex;flex-direction:column">

      <!-- Close -->
      <button
        style="position:absolute;top:16px;right:16px;width:28px;height:28px;border:none;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:8px;opacity:0.7;z-index:1"
        @click="emit('close')"
        @mouseover="($event.currentTarget as HTMLElement).style.background='#f3f4f6'"
        @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
      >
        <UIcon name="i-lucide-x" style="width:16px;height:16px;color:#111" />
      </button>

      <!-- Header -->
      <div style="padding:24px 24px 0">
        <p style="font-size:20px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Reject Bank Transfer</p>
      </div>

      <!-- Body -->
      <div style="padding:16px 24px;display:flex;flex-direction:column;gap:16px">

        <!-- Red warning banner -->
        <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:20px;padding:17px;display:flex;gap:12px;align-items:flex-start">
          <div style="width:40px;height:40px;background:#ef4444;border-radius:20px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <UIcon name="i-lucide-x" style="width:20px;height:20px;color:white" />
          </div>
          <div>
            <p style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;margin-bottom:4px">Reject Payment</p>
            <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;line-height:1.5">Rejecting this transfer will notify the customer that their payment could not be verified. They will need to resubmit.</p>
          </div>
        </div>

        <!-- Transfer details card -->
        <div style="background:#f9fafb;border:1px solid #ececec;border-radius:20px;padding:17px;display:flex;flex-direction:column;gap:8px">
          <p style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;margin-bottom:4px">Transfer Details</p>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Transfer ID:</span>
            <span style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">{{ transfer.id }}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Customer:</span>
            <span style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">{{ transfer.customer }}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Payment Type:</span>
            <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 10px;${transfer.paymentType === 'Subscription' ? 'color:#3b82f6;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2)' : 'color:#22c55e;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.2)'}`">{{ transfer.paymentType }}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Amount:</span>
            <span style="font-size:14px;font-weight:700;color:#111;font-family:'Manrope',sans-serif">{{ transfer.amount }}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Reference:</span>
            <span style="font-size:12px;color:#111;background:white;border:1px solid #e5e7eb;border-radius:4px;padding:4px 8px;font-family:monospace">{{ transfer.reference }}</span>
          </div>
        </div>

        <!-- Reason textarea -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">Reason for Rejection</label>
          <textarea
            v-model="reason"
            placeholder="Explain why this payment is being rejected..."
            rows="4"
            style="width:100%;padding:8px 12px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;resize:none;box-sizing:border-box;line-height:1.5"
            @focus="($event.target as HTMLElement).style.borderColor='#ef4444'"
            @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
          />
        </div>

        <!-- Send email checkbox -->
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer">
          <input
            v-model="sendEmail"
            type="checkbox"
            style="width:16px;height:16px;cursor:pointer;accent-color:#ef4444;flex-shrink:0"
          />
          <span style="font-size:14px;font-weight:500;color:#6b7280;font-family:'Manrope',sans-serif">Send notification email to customer with rejection reason</span>
        </label>

      </div>

      <!-- Footer -->
      <div style="padding:17px 24px;border-top:1px solid #e5e7eb;display:flex;justify-content:flex-end;gap:8px">
        <button
          style="height:40px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
          @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
          @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
          @click="emit('close')"
        >Cancel</button>
        <button
          style="height:40px;padding:0 16px 0 40px;background:#ef4444;border:none;border-radius:20px;font-size:14px;font-weight:500;color:white;font-family:'Manrope',sans-serif;cursor:pointer;position:relative;display:flex;align-items:center;gap:8px"
          @mouseover="($event.currentTarget as HTMLElement).style.opacity='0.9'"
          @mouseleave="($event.currentTarget as HTMLElement).style.opacity='1'"
          @click="decline"
        >
          <UIcon name="i-lucide-x" style="width:16px;height:16px;color:white;position:absolute;left:16px" />
          Reject Payment
        </button>
      </div>

    </div>
  </div>
</template>
