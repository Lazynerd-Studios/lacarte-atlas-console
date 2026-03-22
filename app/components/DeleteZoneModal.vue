<script setup lang="ts">
const props = defineProps<{ zoneName: string }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm'): void
}>()
</script>

<template>
  <div @click.self="emit('close')" style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px">
    <div style="background:#fff;border-radius:20px;width:100%;max-width:400px;overflow:hidden;font-family:'Manrope',sans-serif">
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #f0f0f0">
        <h2 style="font-size:18px;font-weight:700;color:#1a1a1a;margin:0">Delete Zone</h2>
        <button @click="emit('close')" style="background:none;border:none;cursor:pointer;color:#6b7280;padding:4px;display:flex;align-items:center">
          <Icon name="lucide:x" style="width:20px;height:20px" />
        </button>
      </div>

      <!-- Body -->
      <div style="padding:32px 24px;text-align:center">
        <div style="width:56px;height:56px;border-radius:50%;background:#fef2f2;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
          <Icon name="lucide:trash-2" style="width:24px;height:24px;color:#ef4444" />
        </div>
        <p style="font-size:15px;font-weight:600;color:#1a1a1a;margin:0 0 8px">Delete "{{ props.zoneName }}"?</p>
        <p style="font-size:13px;color:#6b7280;margin:0;line-height:1.5">This action cannot be undone. The zone will be permanently removed from the system.</p>
      </div>

      <!-- Footer -->
      <div style="padding:16px 24px;border-top:1px solid #f0f0f0;display:flex;justify-content:flex-end;gap:10px">
        <button @click="emit('close')" style="background:#ececec;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer">Cancel</button>
        <button @click="emit('confirm')" style="background:#ef4444;color:#fff;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer">Delete Zone</button>
      </div>
    </div>
  </div>
</template>
