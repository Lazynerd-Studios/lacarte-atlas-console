<script setup lang="ts">
interface TruckLoadTier {
  id: string
  label: string
  prepayRate: number
  postpayRate: number
  binEquivalent: number
  displayOrder?: number
  isActive?: boolean
}

const props = defineProps<{
  pickupId: string
  pricingMode: 'per_bin' | 'full_truck'
  currentBins: number
  bookedTruckLoadRateId: string | null
  bookedTruckLoadLabel: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success', data: { deltaAmount: number; settlement: string }): void
}>()

const api = useApi()
const toast = useAppToast()

const actualBins = ref(props.currentBins + 1)
const actualTruckLoadRateId = ref('')
const truckTiers = ref<TruckLoadTier[]>([])
const loadingTiers = ref(false)
const error = ref('')
const submitting = ref(false)

defineExpose({ submitting })

const eligibleTiers = computed(() => {
  if (!props.bookedTruckLoadRateId) return truckTiers.value
  return truckTiers.value.filter(t => t.binEquivalent > (truckTiers.value.find(bt => bt.id === props.bookedTruckLoadRateId)?.binEquivalent ?? 0))
})

const deltaPreview = computed(() => {
  if (props.pricingMode === 'per_bin') {
    const extraBins = actualBins.value - props.currentBins
    return extraBins > 0 ? `+${extraBins} bin${extraBins > 1 ? 's' : ''}` : 'No change'
  }
  const selected = truckTiers.value.find(t => t.id === actualTruckLoadRateId.value)
  if (!selected) return 'Select a tier'
  const booked = truckTiers.value.find(t => t.id === props.bookedTruckLoadRateId)
  return booked ? `${booked.label} → ${selected.label}` : selected.label
})

async function fetchTruckTiers() {
  loadingTiers.value = true
  // Admin endpoint; response shape: { tiers: TruckLoadTier[], total }
  const res = await api.get<{ tiers?: TruckLoadTier[]; data?: TruckLoadTier[] } | TruckLoadTier[]>(
    '/rates/admin/truck-loads',
    'Failed to load truck load tiers'
  )
  if (res) {
    const list = Array.isArray(res) ? res : (res.tiers ?? res.data ?? [])
    truckTiers.value = list
      .filter(t => t.isActive !== false)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
  }
  loadingTiers.value = false
}

function submit() {
  error.value = ''

  if (props.pricingMode === 'per_bin') {
    const bins = Number(actualBins.value)
    if (!Number.isInteger(bins) || bins < 1) {
      error.value = 'Enter a valid bin count.'
      return
    }
    if (bins <= props.currentBins) {
      error.value = `Actual bins (${bins}) must exceed registered count (${props.currentBins}).`
      return
    }
  } else {
    if (!actualTruckLoadRateId.value) {
      error.value = 'Select a truck load tier.'
      return
    }
    if (actualTruckLoadRateId.value === props.bookedTruckLoadRateId) {
      error.value = 'Actual truck tier must be larger than the booked tier.'
      return
    }
  }

  submitting.value = true

  const payload: Record<string, unknown> = {}
  if (props.pricingMode === 'per_bin') {
    payload.actualBins = Number(actualBins.value)
  } else {
    payload.actualTruckLoadRateId = actualTruckLoadRateId.value
  }

  api.patch<{ deltaAmount: number; settlement: string }>(
    `/pickup-requests/admin/${props.pickupId}/actual-load`,
    payload,
    'Failed to adjust load'
  )
    .then((result) => {
      if (result) {
        const deltaAmount = result.deltaAmount ?? 0
        const settlement = result.settlement ?? 'deferred_to_invoice'
        toast.success(
          settlement === 'payment_prompt'
            ? `Payment prompt of GHS ${deltaAmount.toFixed(2)} sent to customer.`
            : `Extra charge of GHS ${deltaAmount.toFixed(2)} will be added to customer's next invoice.`
        )
        emit('success', { deltaAmount, settlement })
        emit('close')
      }
    })
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err ?? '')
      error.value = message || 'Failed to adjust load.'
      console.error('[AdjustLoadModal] Error:', err)
    })
    .finally(() => {
      submitting.value = false
    })
}

onMounted(() => {
  if (props.pricingMode === 'full_truck') {
    fetchTruckTiers()
  }
})
</script>

<template>
  <div @click.self="!submitting && emit('close')" style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px">
    <div style="background:#fff;border-radius:20px;width:100%;max-width:480px;overflow:hidden;font-family:'Manrope',sans-serif">
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #f0f0f0">
        <h2 style="font-size:18px;font-weight:700;color:#1a1a1a;margin:0">Adjust Load</h2>
        <button @click="emit('close')" :disabled="submitting" style="background:none;border:none;cursor:pointer;color:#6b7280;padding:4px;display:flex;align-items:center">
          <UIcon name="i-lucide-x" style="width:20px;height:20px" />
        </button>
      </div>

      <!-- Body -->
      <div style="padding:24px;display:flex;flex-direction:column;gap:16px">
        <div v-if="error" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;font-size:13px;color:#ef4444">{{ error }}</div>

        <!-- per_bin: actual bins input -->
        <div v-if="pricingMode === 'per_bin'">
          <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Actual Bins Collected <span style="color:#ef4444">*</span></label>
          <input
            v-model.number="actualBins"
            type="number"
            :min="currentBins + 1"
            step="1"
            style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box"
          />
          <p style="font-size:12px;color:#9ca3af;margin:6px 0 0">Customer registered: {{ currentBins }} bin{{ currentBins !== 1 ? 's' : '' }}</p>
        </div>

        <!-- full_truck: tier select -->
        <div v-else>
          <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Actual Truck Load <span style="color:#ef4444">*</span></label>
          <div v-if="loadingTiers" style="display:flex;align-items:center;gap:8px;padding:12px 0">
            <UIcon name="i-lucide-loader-2" style="width:16px;height:16px;color:#ffb400;animation:spin 1s linear infinite" />
            <span style="font-size:13px;color:#6b7280">Loading tiers...</span>
          </div>
          <div v-else style="position:relative">
            <select
              v-model="actualTruckLoadRateId"
              style="width:100%;height:42px;padding:0 36px 0 12px;background:white;border:1px solid #e5e7eb;border-radius:10px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;cursor:pointer;appearance:none;box-sizing:border-box"
            >
              <option value="" disabled>Select a larger tier</option>
              <option v-for="tier in eligibleTiers" :key="tier.id" :value="tier.id">{{ tier.label }}</option>
            </select>
            <UIcon name="i-lucide-chevron-down" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:#6b7280;pointer-events:none" />
          </div>
          <p v-if="bookedTruckLoadLabel" style="font-size:12px;color:#9ca3af;margin:6px 0 0">Booked tier: {{ bookedTruckLoadLabel }}</p>
        </div>

        <!-- Delta preview -->
        <div style="background:#f9fafb;border-radius:10px;padding:14px 16px">
          <p style="font-size:12px;color:#6b7280;margin:0 0 4px">Adjustment</p>
          <p style="font-size:14px;font-weight:600;color:#1a1a1a;margin:0">{{ deltaPreview }}</p>
        </div>
      </div>

      <!-- Footer -->
      <div style="padding:16px 24px;border-top:1px solid #f0f0f0;display:flex;justify-content:flex-end;gap:10px">
        <button @click="emit('close')" :disabled="submitting" style="background:#ececec;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer">Cancel</button>
        <button @click="submit" :disabled="submitting"
          :style="`background:${submitting ? '#ffd966' : '#ffb400'};color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${submitting ? 'not-allowed' : 'pointer'};display:flex;align-items:center;gap:8px;opacity:${submitting ? '0.7' : '1'}`">
          <UIcon v-if="submitting" name="i-lucide-loader-2" style="width:14px;height:14px;animation:spin 1s linear infinite" />
          {{ submitting ? 'Adjusting...' : 'Adjust Load' }}
        </button>
      </div>
    </div>
  </div>
</template>
