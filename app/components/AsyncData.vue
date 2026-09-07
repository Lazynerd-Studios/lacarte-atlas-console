<script setup lang="ts">
/**
 * AsyncData — a reusable wrapper for loading / error / empty / content states.
 *
 * Usage:
 *   <AsyncData :loading="loading" :error="error" :empty="items.length === 0">
 *     <template #loading><PageSkeleton type="table" /></template>
 *     <template #error>
 *       <p>Something went wrong.</p>
 *       <button @click="retry">Retry</button>
 *     </template>
 *     <template #empty><p>No items found.</p></template>
 *     <template #default>
 *       <div v-for="item in items">{{ item.name }}</div>
 *     </template>
 *   </AsyncData>
 *
 * If a slot is omitted, a sensible default is rendered.
 */

const props = withDefaults(defineProps<{
  loading?: boolean
  error?: string | null
  empty?: boolean
  /** Custom empty message (overrides default) */
  emptyMessage?: string
}>(), {
  loading: false,
  error: null,
  empty: false,
})

const emit = defineEmits<{
  (e: 'retry'): void
}>()
</script>

<template>
  <!-- Loading -->
  <div v-if="loading" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 24px;text-align:center">
    <slot name="loading">
      <div style="display:flex;flex-direction:column;align-items:center;gap:12px">
        <UIcon name="i-lucide-loader-2" style="width:28px;height:28px;color:#ffb400;animation:spin 1s linear infinite" />
        <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0">Loading...</p>
      </div>
    </slot>
  </div>

  <!-- Error -->
  <div v-else-if="error" style="background:white;border:1px solid #ececec;border-radius:16px;padding:40px 24px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <slot name="error" :error="error" :retry="() => emit('retry')">
      <UIcon name="i-lucide-circle-alert" style="width:36px;height:36px;color:#ef4444;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto" />
      <p style="font-size:14px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin:0 0 8px">Something went wrong</p>
      <p style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0 0 16px">{{ error }}</p>
      <button
        style="height:36px;padding:0 20px;background:#ffb400;border:none;border-radius:18px;font-size:13px;font-weight:600;color:#7a5c00;font-family:'Manrope',sans-serif;cursor:pointer"
        @click="emit('retry')"
      >Try Again</button>
    </slot>
  </div>

  <!-- Empty -->
  <div v-else-if="empty" style="background:white;border:1px solid #ececec;border-radius:16px;padding:48px 24px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <slot name="empty">
      <UIcon name="i-lucide-inbox" style="width:36px;height:36px;color:#9ca3af;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto" />
      <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0">{{ emptyMessage || 'No data found' }}</p>
    </slot>
  </div>

  <!-- Content -->
  <slot v-else />
</template>
