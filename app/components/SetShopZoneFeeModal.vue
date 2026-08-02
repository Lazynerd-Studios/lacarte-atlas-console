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
  zone: ShopZoneFee | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', data: { zoneId: string; configId: string | null; fee: number; freeDeliveryMinQuantity: number; isActive: boolean }): void
  (e: 'delete', configId: string): void
}>()

const { format } = useCurrency()

const feeGhs = ref(0)
const freeDeliveryMinQuantity = ref(1)
const isActive = ref(true)
const error = ref('')
const submitting = ref(false)
const deleting = ref(false)

defineExpose({ submitting, deleting })

watch(() => props.zone, (zone) => {
  if (zone) {
    feeGhs.value = Number(zone.fee)
    freeDeliveryMinQuantity.value = Number(zone.freeDeliveryMinQuantity) || 1
    isActive.value = zone.isActive
  } else {
    feeGhs.value = 0
    freeDeliveryMinQuantity.value = 1
    isActive.value = true
  }
  error.value = ''
}, { immediate: true })

function submit() {
  error.value = ''

  if (!props.zone) {
    error.value = 'No zone selected.'
    return
  }

  const fee = Number(feeGhs.value)
  if (Number.isNaN(fee) || fee < 0) {
    error.value = 'Please enter a valid fee amount.'
    return
  }
  // The backend stores the fee as an integer number of cedis
  if (!Number.isInteger(fee)) {
    error.value = 'Fee must be a whole number of cedis (no decimals).'
    return
  }

  if (Number.isNaN(Number(freeDeliveryMinQuantity.value)) || Number(freeDeliveryMinQuantity.value) < 1) {
    error.value = 'Free delivery minimum quantity must be at least 1.'
    return
  }

  submitting.value = true
  // TEMPORARY WORKAROUND: the backend currently interprets the fee as pesewas
  // (it divides the sent value by 100), so send GHS × 100 to store the intended
  // cedis amount. Remove the × 100 once the backend accepts whole cedis directly.
  emit('submit', {
    zoneId: props.zone.zoneId,
    configId: props.zone.configId,
    fee: fee * 100,
    freeDeliveryMinQuantity: Math.round(Number(freeDeliveryMinQuantity.value)),
    isActive: isActive.value,
  })
}

function handleDelete() {
  if (!props.zone?.configId) return
  deleting.value = true
  emit('delete', props.zone.configId)
}
</script>

<template>
  <div @click.self="emit('close')" style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px">
    <div style="background:#fff;border-radius:20px;width:100%;max-width:480px;overflow:hidden;font-family:'Manrope',sans-serif">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #f0f0f0">
        <h2 style="font-size:18px;font-weight:700;color:#1a1a1a;margin:0">{{ zone?.configId ? 'Edit' : 'Set' }} Shop Fee for {{ zone?.zoneName ?? 'Zone' }}</h2>
        <button @click="emit('close')" style="background:none;border:none;cursor:pointer;color:#6b7280;padding:4px;display:flex;align-items:center">
          <Icon name="lucide:x" style="width:20px;height:20px" />
        </button>
      </div>

      <div style="padding:24px;display:flex;flex-direction:column;gap:16px">
        <div v-if="error" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;font-size:13px;color:#ef4444">{{ error }}</div>

        <div>
          <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Shop Delivery Fee <span style="color:#ef4444">*</span></label>
          <div style="position:relative">
            <span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:14px;color:#6b7280;font-weight:600">GHS</span>
            <input
              v-model.number="feeGhs"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              style="width:100%;padding:10px 14px 10px 52px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box"
            />
          </div>
        </div>

        <div>
          <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Free Delivery Minimum Quantity <span style="color:#ef4444">*</span></label>
          <input
            v-model.number="freeDeliveryMinQuantity"
            type="number"
            min="1"
            step="1"
            placeholder="1"
            style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box"
          />
          <p style="font-size:12px;color:#9ca3af;margin:6px 0 0">Orders with at least this many items qualify for free delivery</p>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;background:#f9fafb;border-radius:10px;padding:14px 16px">
          <div>
            <p style="font-size:13px;font-weight:600;color:#374151;margin:0 0 2px">Active</p>
            <p style="font-size:12px;color:#6b7280;margin:0">Shop delivery fee is applied to this zone when enabled</p>
          </div>
          <button @click="isActive = !isActive"
            :style="`width:44px;height:24px;border-radius:12px;border:none;cursor:pointer;position:relative;background:${isActive ? '#22c55e' : '#d1d5db'}`">
            <span :style="`position:absolute;top:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:left 0.15s;left:${isActive ? '23px' : '3px'}`"></span>
          </button>
        </div>
      </div>

      <div style="padding:16px 24px;border-top:1px solid #f0f0f0;display:flex;justify-content:space-between;gap:10px;align-items:center">
        <button v-if="zone?.configId" @click="handleDelete" :disabled="deleting"
          :style="`display:flex;align-items:center;gap:6px;background:#fef2f2;color:#ef4444;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${deleting ? 'not-allowed' : 'pointer'};opacity:${deleting ? '0.7' : '1'}`">
          <Icon v-if="deleting" name="lucide:loader-2" style="width:14px;height:14px;animation:spin 1s linear infinite" />
          {{ deleting ? 'Deleting...' : 'Delete' }}
        </button>
        <div v-else></div>
        <div style="display:flex;gap:10px">
          <button @click="emit('close')" :disabled="submitting || deleting" style="background:#ececec;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer">Cancel</button>
          <button @click="submit" :disabled="submitting || deleting"
            :style="`background:${submitting ? '#ffd966' : '#ffb400'};color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${submitting ? 'not-allowed' : 'pointer'};display:flex;align-items:center;gap:8px;opacity:${submitting ? '0.7' : '1'}`">
            <Icon v-if="submitting" name="lucide:loader-2" style="width:14px;height:14px;animation:spin 1s linear infinite" />
            {{ submitting ? 'Saving...' : (zone?.configId ? 'Save Changes' : 'Set Fee') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
