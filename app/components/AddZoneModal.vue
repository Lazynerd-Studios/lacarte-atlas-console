<script setup lang="ts">
import type { PickupDay, PickupFrequency, PickupTimeSlot, ZoneFormPayload } from '~/types/zone'

defineProps<{
  /** Active disposable item types for the default dropdown */
  itemTypes: { id: string; name: string }[]
  /** Active estimated quantities for the default dropdown */
  quantities: { id: string; label: string }[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', data: ZoneFormPayload): void
}>()

const colorOptions = ['#3b82f6','#22c55e','#f97316','#8b5cf6','#ec4899','#ef4444','#14b8a6','#ffb400','#6b7280']
const days: PickupDay[] = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
const frequencies: PickupFrequency[] = ['weekly','biweekly','monthly']
const timeSlots: PickupTimeSlot[] = ['morning','afternoon','evening']

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const form = ref({
  name: '', description: '', color: '#3b82f6', areasStr: '', isActive: true,
  pickupDay: '', pickupFrequency: '', pickupTimeSlot: '', weekOfMonth: '',
  defaultItemTypeId: '', defaultEstimatedQuantityId: '',
})
const error = ref('')
const submitting = ref(false)

defineExpose({ submitting })

const isMonthly = computed(() => form.value.pickupFrequency === 'monthly')

/** Generation only runs once every schedule field is set */
const scheduleComplete = computed(() =>
  !!form.value.pickupDay &&
  !!form.value.pickupFrequency &&
  !!form.value.pickupTimeSlot &&
  (!isMonthly.value || !!form.value.weekOfMonth) &&
  !!form.value.defaultItemTypeId &&
  !!form.value.defaultEstimatedQuantityId
)

const selectStyle = (invalid = false) =>
  `width:100%;height:40px;padding:0 12px;background:white;border:1px solid ${invalid ? '#ef4444' : '#e5e7eb'};border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;cursor:pointer;box-sizing:border-box`

function submit() {
  if (!form.value.name.trim()) { error.value = 'Zone name is required.'; return }
  submitting.value = true
  emit('submit', {
    name: form.value.name.trim(),
    description: form.value.description.trim(),
    color: form.value.color,
    areas: form.value.areasStr.split('\n').map(a => a.trim()).filter(Boolean),
    isActive: form.value.isActive,
    pickupDay: (form.value.pickupDay || null) as PickupDay | null,
    pickupFrequency: (form.value.pickupFrequency || null) as PickupFrequency | null,
    pickupTimeSlot: (form.value.pickupTimeSlot || null) as PickupTimeSlot | null,
    // weekOfMonth is only valid with monthly frequency — sending it otherwise is a 400
    weekOfMonth: isMonthly.value && form.value.weekOfMonth ? Number(form.value.weekOfMonth) : null,
    defaultItemTypeId: form.value.defaultItemTypeId || null,
    defaultEstimatedQuantityId: form.value.defaultEstimatedQuantityId || null,
  })
}
</script>

<template>
  <div @click.self="emit('close')" style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px">
    <div style="background:#fff;border-radius:20px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto;font-family:'Manrope',sans-serif">
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #f0f0f0;position:sticky;top:0;background:#fff;z-index:1">
        <h2 style="font-size:18px;font-weight:700;color:#1a1a1a;margin:0">Add Zone</h2>
        <button @click="emit('close')" style="background:none;border:none;cursor:pointer;color:#6b7280;padding:4px;display:flex;align-items:center">
          <UIcon name="i-lucide-x" style="width:20px;height:20px" />
        </button>
      </div>

      <!-- Body -->
      <div style="padding:24px;display:flex;flex-direction:column;gap:16px">
        <div v-if="error" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;font-size:13px;color:#ef4444">{{ error }}</div>

        <div>
          <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Zone Name <span style="color:#ef4444">*</span></label>
          <input v-model="form.name" placeholder="e.g. Zone A – Central" style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box" />
        </div>

        <div>
          <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Description</label>
          <textarea v-model="form.description" rows="2" placeholder="Brief description of this zone..." style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;resize:vertical;box-sizing:border-box"></textarea>
        </div>

        <div>
          <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Areas / Localities <span style="font-weight:400;color:#9ca3af">(one per line)</span></label>
          <textarea v-model="form.areasStr" rows="4" placeholder="Downtown&#10;Central Market&#10;High Street" style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;resize:vertical;box-sizing:border-box"></textarea>
        </div>

        <!-- Automatic pickup schedule (optional) -->
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:12px">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
            <p style="font-size:13px;font-weight:600;color:#374151;margin:0">Automatic Pickup Schedule <span style="font-weight:400;color:#9ca3af">(optional)</span></p>
            <span
              :style="`font-size:11px;font-weight:600;padding:2px 10px;border-radius:20px;white-space:nowrap;${scheduleComplete ? 'background:#dcfce7;color:#16a34a' : 'background:#f3f4f6;color:#9ca3af'}`"
            >{{ scheduleComplete ? 'Complete' : 'Incomplete' }}</span>
          </div>
          <p style="font-size:12px;color:#9ca3af;margin:0">Pickups are auto-generated for subscribed customers 2 days ahead only when the schedule is complete.</p>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div>
              <label style="font-size:12px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Pickup Day</label>
              <select v-model="form.pickupDay" :style="selectStyle()">
                <option value="">Not set</option>
                <option v-for="d in days" :key="d" :value="d">{{ capitalize(d) }}</option>
              </select>
            </div>
            <div>
              <label style="font-size:12px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Frequency</label>
              <select v-model="form.pickupFrequency" :style="selectStyle()">
                <option value="">Not set</option>
                <option v-for="f in frequencies" :key="f" :value="f">{{ capitalize(f) }}</option>
              </select>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div>
              <label style="font-size:12px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Time Slot</label>
              <select v-model="form.pickupTimeSlot" :style="selectStyle()">
                <option value="">Not set</option>
                <option v-for="t in timeSlots" :key="t" :value="t">{{ capitalize(t) }}</option>
              </select>
            </div>
            <!-- Only meaningful (and valid) for monthly frequency -->
            <div v-if="isMonthly">
              <label style="font-size:12px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Week of Month</label>
              <select v-model="form.weekOfMonth" :style="selectStyle()">
                <option value="">Not set</option>
                <option value="1">Week 1</option>
                <option value="2">Week 2</option>
                <option value="3">Week 3</option>
                <option value="4">Week 4</option>
              </select>
            </div>
          </div>

          <div>
            <label style="font-size:12px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Default Item Type</label>
            <select v-model="form.defaultItemTypeId" :style="selectStyle()">
              <option value="">Not set</option>
              <option v-for="t in itemTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
          </div>

          <div>
            <label style="font-size:12px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Default Estimated Quantity</label>
            <select v-model="form.defaultEstimatedQuantityId" :style="selectStyle()">
              <option value="">Not set</option>
              <option v-for="q in quantities" :key="q.id" :value="q.id">{{ q.label }}</option>
            </select>
          </div>
        </div>

        <div>
          <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:8px">Zone Color</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button v-for="c in colorOptions" :key="c" @click="form.color = c"
              :style="`width:28px;height:28px;border-radius:50%;background:${c};border:${form.color === c ? '3px solid #1a1a1a' : '2px solid transparent'};cursor:pointer;outline:none`" />
          </div>
        </div>

        <div style="display:flex;align-items:center;gap:10px">
          <button @click="form.isActive = !form.isActive"
            :style="`width:40px;height:22px;border-radius:11px;border:none;cursor:pointer;position:relative;background:${form.isActive ? '#22c55e' : '#d1d5db'}`">
            <span :style="`position:absolute;top:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left 0.15s;left:${form.isActive ? '21px' : '3px'}`"></span>
          </button>
          <span style="font-size:13px;font-weight:600;color:#374151">Active</span>
        </div>
      </div>

      <!-- Footer -->
      <div style="padding:16px 24px;border-top:1px solid #f0f0f0;display:flex;justify-content:flex-end;gap:10px;position:sticky;bottom:0;background:#fff">
        <button @click="emit('close')" :disabled="submitting" style="background:#ececec;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer">Cancel</button>
        <button @click="submit" :disabled="submitting"
          :style="`background:${submitting ? '#ffd966' : '#ffb400'};color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${submitting ? 'not-allowed' : 'pointer'};display:flex;align-items:center;gap:8px;opacity:${submitting ? '0.7' : '1'}`">
          <UIcon v-if="submitting" name="i-lucide-loader-2" style="width:14px;height:14px;animation:spin 1s linear infinite" />
          {{ submitting ? 'Creating...' : 'Add Zone' }}
        </button>
      </div>
    </div>
  </div>
</template>
