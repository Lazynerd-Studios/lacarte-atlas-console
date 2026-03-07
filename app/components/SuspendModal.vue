<script setup lang="ts">
const props = defineProps<{ customerName: string }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', reason: string): void
}>()

const reason = ref('')

function confirm() {
  emit('confirm', reason.value.trim())
}
</script>

<template>
  <div
    style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:50;display:flex;align-items:center;justify-content:center;padding:24px"
    @click.self="emit('close')"
  >
    <div style="background:white;border:1px solid #e5e7eb;border-radius:16px;width:510px;box-shadow:0 10px 15px rgba(0,0,0,0.1),0 4px 6px rgba(0,0,0,0.1);position:relative">

      <!-- Close -->
      <button
        style="position:absolute;top:16px;right:16px;width:28px;height:28px;border:none;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:8px;opacity:0.7"
        @click="emit('close')"
        @mouseover="($event.currentTarget as HTMLElement).style.background='#f3f4f6'"
        @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
      >
        <UIcon name="i-lucide-x" style="width:16px;height:16px;color:#111" />
      </button>

      <!-- Header -->
      <div style="padding:24px 24px 0">
        <p style="font-size:20px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Suspend Account</p>
      </div>

      <!-- Body -->
      <div style="padding:16px 24px;display:flex;flex-direction:column;gap:16px">
        <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;line-height:1.5">
          Are you sure you want to suspend
          <span style="font-weight:500;color:#1a1a1a">{{ props.customerName }}'s</span>
          account? They will not be able to access services until the account is reactivated.
        </p>

        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">Reason for Suspension</label>
          <textarea
            v-model="reason"
            placeholder="Enter reason..."
            rows="4"
            style="width:100%;padding:8px 12px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;resize:none;box-sizing:border-box;line-height:1.5"
            @focus="($event.target as HTMLElement).style.borderColor='#ef4444'"
            @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
          />
        </div>
      </div>

      <!-- Footer -->
      <div style="padding:17px 24px;border-top:1px solid #e5e7eb;display:flex;justify-content:flex-end;gap:8px">
        <button
          style="height:40px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
          @click="emit('close')"
        >Cancel</button>
        <button
          style="height:40px;padding:0 20px;background:#ef4444;border:none;border-radius:20px;font-size:14px;font-weight:500;color:white;font-family:'Manrope',sans-serif;cursor:pointer"
          @click="confirm"
        >Suspend Account</button>
      </div>
    </div>
  </div>
</template>
