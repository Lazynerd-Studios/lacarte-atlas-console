<script setup lang="ts">
interface ShopZoneFee {
  zoneId: string
  zoneName: string
  configId: string | null
  fee: number
  freeDeliveryMinQuantity: number
  isActive: boolean
}

const props = defineProps<{
  zones: ShopZoneFee[]
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'edit', zone: ShopZoneFee): void
}>()

const { format } = useCurrency()

function feeInGhs(fee: number): string {
  return format(Number(fee))
}

function feeInPesewas(fee: number): string {
  return `${Math.round(Number(fee) * 100)} pesewas`
}
</script>

<template>
  <div style="background:#fff;border-radius:16px;border:1px solid #f0f0f0;padding:24px;font-family:'Manrope',sans-serif">
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px">
      <div style="width:48px;height:48px;border-radius:14px;background:#dbeafe;display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <Icon name="lucide:shopping-bag" style="width:22px;height:22px;color:#3b82f6" />
      </div>
      <div>
        <h2 style="font-size:16px;font-weight:700;color:#1a1a1a;margin:0 0 4px">Shop Zone Fees</h2>
        <p style="font-size:13px;color:#6b7280;margin:0">Set delivery fees and free-delivery thresholds for shop orders by zone</p>
      </div>
    </div>

    <div v-if="loading" style="display:flex;flex-direction:column;gap:12px">
      <div v-for="i in 4" :key="i" style="display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 0;border-bottom:1px solid #f5f5f5">
        <div style="display:flex;align-items:center;gap:12px;flex:1">
          <div class="skeleton" style="width:32px;height:32px;border-radius:10px" />
          <div class="skeleton" style="height:16px;width:140px" />
        </div>
        <div class="skeleton" style="height:34px;width:90px;border-radius:8px" />
      </div>
    </div>

    <div v-else-if="zones.length === 0" style="text-align:center;padding:40px 24px">
      <Icon name="lucide:map-pin" style="width:40px;height:40px;color:#d1d5db;margin-bottom:12px" />
      <p style="font-size:15px;font-weight:600;color:#1a1a1a;margin:0 0 6px">No zones found</p>
      <p style="font-size:13px;color:#6b7280;margin:0">Add service zones before you can set shop fees.</p>
    </div>

    <div v-else style="display:flex;flex-direction:column;gap:2px">
      <div
        v-for="(zone, i) in zones" :key="zone.zoneId"
        :style="`display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 0;${i < zones.length - 1 ? 'border-bottom:1px solid #f5f5f5' : ''}`"
      >
        <div style="display:flex;align-items:center;gap:12px;flex:1;min-width:160px">
          <div style="width:32px;height:32px;border-radius:10px;background:#eff6ff;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <Icon name="lucide:map-pin" style="width:16px;height:16px;color:#3b82f6" />
          </div>
          <div>
            <p style="font-size:14px;font-weight:600;color:#1a1a1a;margin:0">{{ zone.zoneName }}</p>
            <p style="font-size:14px;font-weight:600;color:#1a1a1a;margin:2px 0 0">{{ feeInGhs(zone.fee) }}</p>
            <p style="font-size:12px;color:#9ca3af;margin:2px 0 0">
              {{ feeInPesewas(zone.fee) }}
              <span v-if="zone.freeDeliveryMinQuantity > 0"> · Free from {{ zone.freeDeliveryMinQuantity }} items</span>
            </p>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;flex-shrink:0">
          <span :style="`font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;white-space:nowrap;${zone.isActive ? 'background:#dcfce7;color:#16a34a' : 'background:#f3f4f6;color:#9ca3af'}`">
            {{ zone.isActive ? 'Active' : 'Inactive' }}
          </span>
          <button @click="emit('edit', zone)"
            :style="`display:flex;align-items:center;gap:6px;background:${zone.configId ? '#ececec' : '#ffb400'};color:#1a1a1a;border:none;border-radius:8px;padding:8px 14px;font-size:13px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer`">
            <Icon name="lucide:pencil" style="width:14px;height:14px" />
            {{ zone.configId ? 'Edit Fee' : 'Set Fee' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
