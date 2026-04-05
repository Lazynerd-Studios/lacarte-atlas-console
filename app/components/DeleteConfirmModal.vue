<script setup lang="ts">
const props = defineProps<{
  title: string
  message: string
}>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()
</script>

<template>
  <div style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px" @click.self="emit('close')">
    <div style="background:#fff;border-radius:20px;width:100%;max-width:440px;font-family:'Manrope',sans-serif">
      
      <!-- Header -->
      <div style="padding:24px;border-bottom:1px solid #f0f0f0">
        <div style="width:48px;height:48px;border-radius:12px;background:#fef2f2;display:flex;align-items:center;justify-content:center;margin-bottom:16px">
          <Icon name="lucide:alert-triangle" style="width:24px;height:24px;color:#ef4444" />
        </div>
        <h2 style="font-size:20px;font-weight:700;color:#1a1a1a;margin:0 0 8px">{{ title }}</h2>
        <p style="font-size:14px;color:#6b7280;margin:0">{{ message }}</p>
      </div>

      <!-- Footer -->
      <div style="padding:20px 24px;display:flex;gap:12px;justify-content:flex-end">
        <button @click="emit('close')" style="padding:10px 20px;border-radius:10px;border:1.5px solid #e5e7eb;background:#fff;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;cursor:pointer">
          Cancel
        </button>
        <button @click="emit('confirm')" style="padding:10px 20px;border-radius:10px;border:none;background:#ef4444;font-size:14px;font-weight:600;color:#fff;font-family:'Manrope',sans-serif;cursor:pointer">
          Delete
        </button>
      </div>

    </div>
  </div>
</template>
