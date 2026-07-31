<script setup lang="ts">
interface EmergencyFeeConfig {
  id: string
  fee: number
  isActive: boolean
  createdAt: string | null
  updatedAt: string | null
}

const props = defineProps<{
  config: EmergencyFeeConfig | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'edit'): void
}>()

const { format } = useCurrency()

const feeInGhs = computed(() => {
  if (!props.config) return 0
  return Number(props.config.fee) / 100
})

const formattedFee = computed(() => format(feeInGhs.value))
const statusColor = computed(() => props.config?.isActive ? '#22c55e' : '#9ca3af')
</script>

<template>
  <div style="background:#fff;border-radius:16px;border:1px solid #f0f0f0;padding:24px;font-family:'Manrope',sans-serif">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap">
      <div style="display:flex;align-items:center;gap:16px">
        <div style="width:48px;height:48px;border-radius:14px;background:#fef3c7;display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <Icon name="lucide:alert-circle" style="width:22px;height:22px;color:#f59e0b" />
        </div>
        <div>
          <h2 style="font-size:16px;font-weight:700;color:#1a1a1a;margin:0 0 4px">Emergency Pickup Fee</h2>
          <p style="font-size:13px;color:#6b7280;margin:0">Fee applied to same-day emergency pickup requests</p>
        </div>
      </div>
      <button @click="emit('edit')" :disabled="loading"
        :style="`display:flex;align-items:center;gap:6px;background:#ffb400;color:#1a1a1a;border:none;border-radius:8px;padding:8px 14px;font-size:13px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${loading ? 'not-allowed' : 'pointer'};opacity:${loading ? '0.5' : '1'}`">
        <Icon name="lucide:pencil" style="width:14px;height:14px" />
        Edit Fee
      </button>
    </div>

    <div style="margin-top:24px;display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px">
      <div>
        <p style="font-size:12px;color:#6b7280;margin:0 0 6px;font-weight:500">Current Fee</p>
        <p v-if="!loading" style="font-size:28px;font-weight:700;color:#1a1a1a;margin:0">{{ formattedFee }}</p>
        <div v-else class="skeleton" style="height:28px;width:100px" />
      </div>
      <div>
        <p style="font-size:12px;color:#6b7280;margin:0 0 6px;font-weight:500">Status</p>
        <div v-if="!loading" style="display:flex;align-items:center;gap:8px">
          <span :style="`width:8px;height:8px;border-radius:50%;background:${statusColor}`"></span>
          <span style="font-size:14px;font-weight:600;color:#1a1a1a">{{ config?.isActive ? 'Active' : 'Inactive' }}</span>
        </div>
        <div v-else class="skeleton" style="height:20px;width:80px" />
      </div>
      <div>
        <p style="font-size:12px;color:#6b7280;margin:0 0 6px;font-weight:500">Last Updated</p>
        <p v-if="!loading" style="font-size:14px;font-weight:600;color:#1a1a1a;margin:0">
          {{ config?.updatedAt ? new Date(config.updatedAt).toLocaleDateString('en-GB') : '—' }}
        </p>
        <div v-else class="skeleton" style="height:20px;width:100px" />
      </div>
    </div>
  </div>
</template>
