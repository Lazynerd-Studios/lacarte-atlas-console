<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

interface EmergencyFeeConfig {
  id: string
  fee: number
  isActive: boolean
  createdAt: string | null
  updatedAt: string | null
}

interface EmergencyFeeResponse {
  config: EmergencyFeeConfig
}

interface Zone {
  id: string
  name: string
  color: string
  areas: string[]
  driverCount: number
  customerCount: number
  isActive: boolean
}

interface DeliveryFeeConfig {
  id: string
  zoneId: string
  zoneName: string
  fee: number
  freeDeliveryMinQuantity: number | string
  isActive: boolean
  createdAt: string | null
  updatedAt: string | null
}

interface ShopZoneFee {
  zoneId: string
  zoneName: string
  configId: string | null
  fee: number
  freeDeliveryMinQuantity: number
  isActive: boolean
}

const api = useApi()
const toast = useAppToast()

const loading = ref(true)
const emergencyConfig = ref<EmergencyFeeConfig | null>(null)

const zones = ref<Zone[]>([])
const deliveryConfigs = ref<DeliveryFeeConfig[]>([])
const zoneFees = ref<ShopZoneFee[]>([])
const loadingZones = ref(false)
const loadingDeliveryConfigs = ref(false)

async function fetchEmergencyFee() {
  const data = await api.get<EmergencyFeeResponse>('/pickup-requests/admin/emergency-fee', 'Failed to load emergency pickup fee')
  if (data?.config) {
    emergencyConfig.value = {
      ...data.config,
      fee: Number(data.config.fee),
    }
  }
}

async function fetchZones() {
  loadingZones.value = true
  const data = await api.get<any>('/zone/admin/list')
  if (data) {
    zones.value = Array.isArray(data) ? data : (data.data ?? data.zones ?? data.results ?? [])
  }
  loadingZones.value = false
}

async function fetchDeliveryConfigs() {
  loadingDeliveryConfigs.value = true
  const data = await api.get<DeliveryFeeConfig[]>('/store-orders/admin/delivery-fees/', 'Failed to load shop delivery fees')
  if (data) {
    deliveryConfigs.value = Array.isArray(data) ? data : []
  }
  loadingDeliveryConfigs.value = false
}

function buildZoneFees() {
  zoneFees.value = zones.value.map((z) => {
    const config = deliveryConfigs.value.find(c => c.zoneId === z.id)
    return {
      zoneId: z.id,
      zoneName: z.name,
      configId: config?.id ?? null,
      fee: config ? Number(config.fee) : 0,
      freeDeliveryMinQuantity: config ? Number(config.freeDeliveryMinQuantity) || 1 : 1,
      isActive: config?.isActive ?? false,
    }
  })
}

async function refresh() {
  loading.value = true
  await Promise.all([fetchEmergencyFee(), fetchZones(), fetchDeliveryConfigs()])
  buildZoneFees()
  loading.value = false
}

onMounted(refresh)

// ── Emergency fee modal ──
const showEmergencyModal = ref(false)
const emergencyModalRef = ref<any>(null)

function openEmergencyModal() {
  showEmergencyModal.value = true
}

async function handleEmergencySubmit(payload: { fee: number; isActive: boolean }) {
  console.log('[Fees] Updating emergency pickup fee:', payload)
  const result = await api.put<EmergencyFeeConfig>(
    '/pickup-requests/admin/emergency-fee',
    payload,
    'Failed to update emergency pickup fee'
  )

  if (emergencyModalRef.value) emergencyModalRef.value.submitting = false

  if (result !== null) {
    emergencyConfig.value = {
      ...result,
      fee: Number(result.fee),
    }
    showEmergencyModal.value = false
    toast.success('Emergency pickup fee updated successfully')
  }
}

// ── Shop zone fee modal ──
const showShopZoneModal = ref(false)
const shopZoneTarget = ref<ShopZoneFee | null>(null)
const shopZoneModalRef = ref<any>(null)

function openShopZoneModal(zone: ShopZoneFee) {
  shopZoneTarget.value = zone
  showShopZoneModal.value = true
}

async function handleShopZoneSubmit(payload: {
  zoneId: string
  configId: string | null
  fee: number
  freeDeliveryMinQuantity: number
  isActive: boolean
}) {
  console.log('[Fees] Saving shop zone fee:', payload)

  let result: DeliveryFeeConfig | null = null

  if (payload.configId) {
    result = await api.patch<DeliveryFeeConfig>(
      `/store-orders/admin/delivery-fees/${payload.configId}`,
      {
        fee: payload.fee,
        freeDeliveryMinQuantity: payload.freeDeliveryMinQuantity,
        isActive: payload.isActive,
      },
      'Failed to update shop delivery fee'
    )
  } else {
    result = await api.post<DeliveryFeeConfig>(
      '/store-orders/admin/delivery-fees/',
      {
        zoneId: payload.zoneId,
        fee: payload.fee,
        freeDeliveryMinQuantity: payload.freeDeliveryMinQuantity,
      },
      'Failed to create shop delivery fee'
    )
  }

  if (shopZoneModalRef.value) shopZoneModalRef.value.submitting = false

  if (result !== null) {
    await fetchDeliveryConfigs()
    buildZoneFees()
    showShopZoneModal.value = false
    shopZoneTarget.value = null
    toast.success(payload.configId ? 'Shop delivery fee updated' : 'Shop delivery fee created')
  }
}

async function handleShopZoneDelete(configId: string) {
  console.log('[Fees] Deleting shop zone fee config:', configId)
  const result = await api.del<{ success: boolean; message?: string }>(
    `/store-orders/admin/delivery-fees/${configId}`,
    'Failed to delete shop delivery fee'
  )

  if (shopZoneModalRef.value) shopZoneModalRef.value.deleting = false

  if (result !== null) {
    await fetchDeliveryConfigs()
    buildZoneFees()
    showShopZoneModal.value = false
    shopZoneTarget.value = null
    toast.success('Shop delivery fee removed')
  }
}
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:32px;font-family:'Manrope',sans-serif">
    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
      <div>
        <h1 style="font-size:28px;font-weight:700;color:#111;margin:0;line-height:1.3">Fees</h1>
        <p style="font-size:14px;color:#6b7280;margin:6px 0 0">Manage emergency pickup and shop delivery fees</p>
      </div>
      <button @click="refresh" :disabled="loading"
        :style="`display:flex;align-items:center;gap:8px;background:#ececec;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${loading ? 'not-allowed' : 'pointer'};opacity:${loading ? '0.5' : '1'}`">
        <UIcon :name="loading ? 'i-lucide-loader-2' : 'i-lucide-rotate-cw'" :style="`width:16px;height:16px;${loading ? 'animation:spin 1s linear infinite' : ''}`" />
        {{ loading ? 'Loading...' : 'Refresh' }}
      </button>
    </div>

    <!-- Emergency pickup fee -->
    <EmergencyFeeCard
      :config="emergencyConfig"
      :loading="loading"
      @edit="openEmergencyModal"
    />

    <!-- Shop zone fees -->
    <ShopZoneFeeCard
      :zones="zoneFees"
      :loading="loading || loadingZones || loadingDeliveryConfigs"
      @edit="openShopZoneModal"
    />

    <!-- ── SET EMERGENCY FEE MODAL ── -->
    <SetEmergencyFeeModal
      v-if="showEmergencyModal"
      ref="emergencyModalRef"
      :config="emergencyConfig"
      @close="showEmergencyModal = false"
      @submit="handleEmergencySubmit"
    />

    <!-- ── SET SHOP ZONE FEE MODAL ── -->
    <SetShopZoneFeeModal
      v-if="showShopZoneModal && shopZoneTarget"
      ref="shopZoneModalRef"
      :zone="shopZoneTarget"
      @close="showShopZoneModal = false; shopZoneTarget = null"
      @submit="handleShopZoneSubmit"
      @delete="handleShopZoneDelete"
    />
  </div>
</template>
