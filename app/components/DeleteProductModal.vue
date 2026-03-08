<script setup lang="ts">
const props = defineProps<{ productName: string; productId: number }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', id: number): void
}>()
</script>

<template>
  <div
    style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:50;display:flex;align-items:center;justify-content:center;padding:24px"
    @click.self="emit('close')"
  >
    <div style="background:white;border-radius:16px;width:420px;padding:32px;display:flex;flex-direction:column;gap:20px;box-shadow:0 10px 15px rgba(0,0,0,0.1);position:relative">

      <!-- Close -->
      <button
        style="position:absolute;top:16px;right:16px;width:28px;height:28px;border:none;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:8px;opacity:0.7"
        @click="emit('close')"
        @mouseover="($event.currentTarget as HTMLElement).style.background='#f3f4f6'"
        @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
      >
        <UIcon name="i-lucide-x" style="width:16px;height:16px;color:#111" />
      </button>

      <!-- Icon + text -->
      <div style="display:flex;flex-direction:column;align-items:center;gap:16px;text-align:center">
        <div style="width:56px;height:56px;border-radius:9999px;background:rgba(239,68,68,0.1);display:flex;align-items:center;justify-content:center">
          <UIcon name="i-lucide-trash-2" style="width:24px;height:24px;color:#ef4444" />
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <p style="font-size:20px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Delete Product</p>
          <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;line-height:1.6">
            Are you sure you want to delete <span style="font-weight:600;color:#1a1a1a">{{ props.productName }}</span>?
            This action cannot be undone.
          </p>
        </div>
      </div>

      <!-- Actions -->
      <div style="display:flex;justify-content:center;gap:8px">
        <button
          style="height:40px;padding:0 20px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
          @click="emit('close')"
          @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
          @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
        >Cancel</button>
        <button
          style="height:40px;padding:0 20px;background:#ef4444;border:none;border-radius:20px;font-size:14px;font-weight:500;color:white;font-family:'Manrope',sans-serif;cursor:pointer"
          @click="emit('confirm', props.productId)"
          @mouseover="($event.currentTarget as HTMLElement).style.opacity='0.9'"
          @mouseleave="($event.currentTarget as HTMLElement).style.opacity='1'"
        >Delete</button>
      </div>
    </div>
  </div>
</template>
