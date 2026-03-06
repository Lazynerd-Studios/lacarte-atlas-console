<script setup lang="ts">
const props = defineProps<{
  page: number
  total: number
  perPage?: number
}>()

const emit = defineEmits<{
  (e: 'update:page', value: number): void
}>()

const pp = computed(() => props.perPage ?? 10)
const totalPages = computed(() => Math.max(1, Math.ceil(props.total / pp.value)))
const from = computed(() => (props.page - 1) * pp.value + 1)
const to = computed(() => Math.min(props.page * pp.value, props.total))

function go(p: number) {
  if (p >= 1 && p <= totalPages.value) emit('update:page', p)
}
</script>

<template>
  <div style="display:flex;align-items:center;justify-content:space-between">
    <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">
      Showing <span style="font-weight:500;color:#1a1a1a">{{ from }}-{{ to }}</span>
      of <span style="font-weight:500;color:#1a1a1a">{{ total }}</span>
    </p>
    <div style="display:flex;align-items:center;gap:8px">
      <button
        :disabled="page === 1"
        :style="`height:32px;padding:0 12px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:${page === 1 ? 'not-allowed' : 'pointer'};opacity:${page === 1 ? '0.5' : '1'}`"
        @click="go(page - 1)"
      >Previous</button>
      <button
        v-for="p in totalPages"
        :key="p"
        :style="`height:32px;min-width:32px;padding:0 10px;border:none;border-radius:20px;font-size:14px;font-weight:500;font-family:'Manrope',sans-serif;cursor:pointer;background:${p === page ? '#ffb400' : '#ececec'};color:${p === page ? '#0a0d12' : '#111'}`"
        @click="go(p)"
      >{{ p }}</button>
      <button
        :disabled="page === totalPages"
        :style="`height:32px;padding:0 12px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:${page === totalPages ? 'not-allowed' : 'pointer'};opacity:${page === totalPages ? '0.5' : '1'}`"
        @click="go(page + 1)"
      >Next</button>
    </div>
  </div>
</template>
