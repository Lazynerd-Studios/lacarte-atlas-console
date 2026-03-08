<script setup lang="ts">
const model = defineModel<string>({ default: '' })

const props = defineProps<{
  placeholder?: string
}>()
</script>

<template>
  <div style="position:relative">
    <UIcon
      name="i-lucide-search"
      style="position:absolute;left:12px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:#6b7280;pointer-events:none"
    />
    <input
      v-model="model"
      type="text"
      :placeholder="placeholder ?? 'Search...'"
      style="width:100%;height:38px;padding-left:40px;padding-right:16px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#111;outline:none;font-family:'Manrope',sans-serif;box-sizing:border-box"
      @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
      @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
    />
  </div>
</template>
