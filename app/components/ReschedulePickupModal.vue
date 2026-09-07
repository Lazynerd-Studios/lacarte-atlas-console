<script setup lang="ts">
const props = defineProps<{
  pickupId: string
  /** Shown in the header for context */
  customerName?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  /** Emitted after a successful reschedule — parent should refresh */
  (e: 'done'): void
}>()

const api = useApi()
const toast = useAppToast()

const date = ref('')
const timeSlot = ref('')
const error = ref('')
const submitting = ref(false)

// Booking window: tomorrow .. +30 days (same as customer bookings)
function isoDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
function addDays(d: Date, days: number) {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + days)
  return copy
}

const minDate = computed(() => isoDate(addDays(new Date(), 1)))
const maxDate = computed(() => isoDate(addDays(new Date(), 30)))

function validate() {
  error.value = ''
  if (!date.value) {
    error.value = 'Pick a new pickup date.'
    return false
  }
  if (date.value < minDate.value || date.value > maxDate.value) {
    error.value = 'The date must be between tomorrow and 30 days from now.'
    return false
  }
  return true
}

async function submit() {
  if (submitting.value) return
  if (!validate()) return
  submitting.value = true
  error.value = ''
  try {
    const payload: Record<string, unknown> = { preferredPickupDate: date.value }
    // Omitted timeSlot keeps the current slot
    if (timeSlot.value) payload.timeSlot = timeSlot.value
    // Raw request so 400s (not pending / out of window) surface inline and
    // the modal stays open for retry
    await api.request<unknown>(`/pickup-requests/admin/${props.pickupId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    toast.success('Pickup rescheduled')
    emit('done')
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err ?? '')
    error.value = message || 'Failed to reschedule pickup'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div
    style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:50;display:flex;align-items:center;justify-content:center;padding:24px"
    @click.self="!submitting && emit('close')"
  >
    <div style="background:white;border:1px solid #e5e7eb;border-radius:16px;width:440px;box-shadow:0 10px 15px rgba(0,0,0,0.1);font-family:'Manrope',sans-serif">

      <!-- Header -->
      <div style="padding:24px 24px 0">
        <p style="font-size:20px;font-weight:600;color:#1a1a1a;margin:0">Reschedule Pickup</p>
        <p style="font-size:13px;color:#6b7280;margin:6px 0 0">
          {{ customerName ? `${customerName} · ` : '' }}Request {{ pickupId.slice(0, 8) }}
        </p>
      </div>

      <!-- Body -->
      <div style="padding:16px 24px;display:flex;flex-direction:column;gap:16px">
        <div v-if="error" role="alert" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;font-size:13px;color:#ef4444">{{ error }}</div>

        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a">New Pickup Date <span style="color:#ef4444">*</span></label>
          <input
            v-model="date"
            type="date"
            :min="minDate"
            :max="maxDate"
            style="width:100%;height:40px;padding:0 12px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box"
          />
          <span style="font-size:12px;color:#9ca3af">Between tomorrow and 30 days from now.</span>
        </div>

        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a">Time Slot</label>
          <select
            v-model="timeSlot"
            style="width:100%;height:40px;padding:0 12px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;cursor:pointer;box-sizing:border-box"
          >
            <option value="">Keep current slot</option>
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
          </select>
        </div>
      </div>

      <!-- Footer -->
      <div style="padding:16px 24px;border-top:1px solid #e5e7eb;display:flex;justify-content:flex-end;gap:8px">
        <button
          style="height:40px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
          :disabled="submitting"
          @click="emit('close')"
        >Cancel</button>
        <button
          :disabled="submitting"
          :style="`height:40px;padding:0 20px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:${submitting ? 'not-allowed' : 'pointer'};display:flex;align-items:center;gap:8px;opacity:${submitting ? 0.7 : 1}`"
          @click="submit"
        >
          <UIcon v-if="submitting" name="i-lucide-loader-2" style="width:16px;height:16px;animation:spin 1s linear infinite" />
          {{ submitting ? 'Rescheduling...' : 'Reschedule' }}
        </button>
      </div>
    </div>
  </div>
</template>
