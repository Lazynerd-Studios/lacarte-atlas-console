<script setup lang="ts">
const props = defineProps<{
  timeRemaining: number // in seconds
}>()

const emit = defineEmits<{
  extend: []
  dismiss: []
}>()

const formatTime = computed(() => {
  const minutes = Math.floor(props.timeRemaining / 60)
  const seconds = props.timeRemaining % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})
</script>

<template>
  <div style="position:fixed;top:20px;right:20px;z-index:10000;max-width:400px">
    <div style="background:white;border:1px solid #fbbf24;border-radius:16px;padding:20px;box-shadow:0 10px 25px rgba(0,0,0,0.15)">
      <!-- Header -->
      <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:16px">
        <div style="width:40px;height:40px;border-radius:50%;background:rgba(251,191,36,0.1);display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <UIcon name="i-lucide-clock" style="width:20px;height:20px;color:#f59e0b" />
        </div>
        <div style="flex:1">
          <h3 style="font-size:16px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin:0 0 4px">
            Session Expiring Soon
          </h3>
          <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0">
            Your session will expire in <strong style="color:#f59e0b">{{ formatTime }}</strong>
          </p>
        </div>
        <button
          style="width:24px;height:24px;border:none;background:none;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;border-radius:4px"
          @click="emit('dismiss')"
          @mouseover="($event.currentTarget as HTMLElement).style.background='#f3f4f6'"
          @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
        >
          <UIcon name="i-lucide-x" style="width:16px;height:16px;color:#6b7280" />
        </button>
      </div>

      <!-- Actions -->
      <div style="display:flex;gap:8px">
        <button
          style="flex:1;height:36px;padding:0 16px;background:#ffb400;border:none;border-radius:18px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer"
          @click="emit('extend')"
          @mouseover="($event.currentTarget as HTMLElement).style.background='#f5a800'"
          @mouseleave="($event.currentTarget as HTMLElement).style.background='#ffb400'"
        >
          Extend Session
        </button>
        <button
          style="height:36px;padding:0 16px;background:#ececec;border:none;border-radius:18px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
          @click="emit('dismiss')"
          @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
          @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
        >
          Dismiss
        </button>
      </div>
    </div>
  </div>
</template>
