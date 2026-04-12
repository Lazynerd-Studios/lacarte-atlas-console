<script setup lang="ts">
const props = defineProps<{
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmColor?: string
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()
</script>

<template>
  <div
    style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:50;display:flex;align-items:center;justify-content:center;padding:24px"
    @click.self="emit('cancel')"
  >
    <div style="background:white;border:1px solid #e5e7eb;border-radius:16px;width:100%;max-width:440px;box-shadow:0 10px 15px rgba(0,0,0,0.1),0 4px 6px rgba(0,0,0,0.1)">
      
      <!-- Header -->
      <div style="padding:24px 24px 16px">
        <p style="font-size:20px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ title }}</p>
      </div>

      <!-- Body -->
      <div style="padding:0 24px 24px">
        <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;line-height:1.5">{{ message }}</p>
      </div>

      <!-- Footer -->
      <div style="padding:16px 24px;border-top:1px solid #e5e7eb;display:flex;justify-content:flex-end;gap:8px">
        <button
          style="height:40px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
          :disabled="loading"
          @click="emit('cancel')"
        >{{ cancelText || 'Cancel' }}</button>
        <button
          :style="`height:40px;padding:0 20px;background:${confirmColor || '#dc2626'};border:none;border-radius:20px;font-size:14px;font-weight:500;color:white;font-family:'Manrope',sans-serif;cursor:pointer;display:flex;align-items:center;gap:8px`"
          :disabled="loading"
          @click="emit('confirm')"
        >
          <UIcon v-if="loading" name="i-lucide-loader-2" style="width:16px;height:16px;animation:spin 1s linear infinite" />
          {{ loading ? 'Deleting...' : (confirmText || 'Confirm') }}
        </button>
      </div>
    </div>
  </div>
</template>
