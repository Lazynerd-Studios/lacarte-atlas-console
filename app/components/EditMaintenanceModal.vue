<script setup lang="ts">
const props = defineProps<{
  truckId: string
  maintenance: {
    id: string
    type: string
    technician: string
    date: string
    cost: string
    status: string
    notes: string
  }
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', maintenanceId: string, data: Record<string, unknown>): void
}>()

const form = reactive({
  maintenanceType: props.maintenance.type,
  serviceCentre: props.maintenance.technician,
  scheduledDate: props.maintenance.date,
  completedDate: '',
  estimatedCost: props.maintenance.cost.replace('GHS ', '').replace(',', ''),
  actualCost: '',
  status: props.maintenance.status,
  notes: props.maintenance.notes || '',
})

const statuses = ['scheduled', 'in_progress', 'completed', 'cancelled']
const submitting = ref(false)

const errors = reactive<Record<string, string>>({})

function validate() {
  Object.keys(errors).forEach(k => delete errors[k])
  
  if (!form.serviceCentre.trim()) errors.serviceCentre = 'Required'
  if (!form.scheduledDate) errors.scheduledDate = 'Required'
  
  return Object.keys(errors).length === 0
}

function submit() {
  if (!validate()) return
  
  submitting.value = true
  emit('submit', props.maintenance.id, {
    maintenanceType: form.maintenanceType,
    serviceCentre: form.serviceCentre,
    scheduledDate: form.scheduledDate,
    completedDate: form.completedDate || undefined,
    estimatedCost: form.estimatedCost || undefined,
    actualCost: form.actualCost || undefined,
    status: form.status,
    notes: form.notes || undefined,
  })
}

const chevronBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`

function inputStyle(field: string) {
  return `width:100%;height:39px;padding:0 12px;background:white;border:1px solid ${errors[field] ? '#ef4444' : '#e5e7eb'};border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box`
}

function onFocus(e: Event, field: string) {
  if (!errors[field]) (e.target as HTMLElement).style.borderColor = '#ffb400'
}
function onBlur(e: Event, field: string) {
  if (!errors[field]) (e.target as HTMLElement).style.borderColor = '#e5e7eb'
}
</script>

<template>
  <div
    style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:50;display:flex;align-items:center;justify-content:center;padding:24px"
    @click.self="emit('close')"
  >
    <div style="background:white;border:1px solid #e5e7eb;border-radius:16px;width:510px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 10px 15px rgba(0,0,0,0.1),0 4px 6px rgba(0,0,0,0.1);position:relative">

      <!-- Header -->
      <div style="padding:24px 24px 16px;flex-shrink:0;border-bottom:1px solid #e5e7eb">
        <p style="font-size:20px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Update Maintenance</p>
      </div>

      <!-- Close -->
      <button
        style="position:absolute;top:16px;right:16px;width:28px;height:28px;border:none;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:8px;opacity:0.7"
        @click="emit('close')"
        @mouseover="($event.currentTarget as HTMLElement).style.background='#f3f4f6'"
        @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
      >
        <UIcon name="i-lucide-x" style="width:16px;height:16px;color:#111" />
      </button>

      <!-- Body -->
      <div style="flex:1;overflow-y:auto;padding:24px;display:flex;flex-direction:column;gap:16px">

        <!-- Maintenance Type (read-only) -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Maintenance Type</label>
          <input
            :value="form.maintenanceType"
            type="text"
            readonly
            style="width:100%;height:39px;padding:0 12px;background:#f8f9fa;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box;cursor:default"
          />
        </div>

        <!-- Service Centre -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Service Centre</label>
          <input v-model="form.serviceCentre" type="text" placeholder="e.g., AutoCare Ltd" :style="inputStyle('serviceCentre')"
            @focus="onFocus($event, 'serviceCentre')" @blur="onBlur($event, 'serviceCentre')" />
          <span v-if="errors.serviceCentre" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ errors.serviceCentre }}</span>
        </div>

        <!-- Scheduled Date / Completed Date -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Scheduled Date</label>
            <input v-model="form.scheduledDate" type="date" :style="inputStyle('scheduledDate')"
              @focus="onFocus($event, 'scheduledDate')" @blur="onBlur($event, 'scheduledDate')" />
            <span v-if="errors.scheduledDate" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ errors.scheduledDate }}</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Completed Date</label>
            <input v-model="form.completedDate" type="date" :style="inputStyle('completedDate')"
              @focus="onFocus($event, 'completedDate')" @blur="onBlur($event, 'completedDate')" />
          </div>
        </div>

        <!-- Estimated Cost / Actual Cost -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Estimated Cost (GHS)</label>
            <input v-model="form.estimatedCost" type="number" step="0.01" placeholder="0.00" :style="inputStyle('estimatedCost')"
              @focus="onFocus($event, 'estimatedCost')" @blur="onBlur($event, 'estimatedCost')" />
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Actual Cost (GHS)</label>
            <input v-model="form.actualCost" type="number" step="0.01" placeholder="0.00" :style="inputStyle('actualCost')"
              @focus="onFocus($event, 'actualCost')" @blur="onBlur($event, 'actualCost')" />
          </div>
        </div>

        <!-- Status -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Status</label>
          <select
            v-model="form.status"
            :style="`width:100%;height:42px;padding:0 16px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;cursor:pointer;appearance:none;background-image:${chevronBg};background-repeat:no-repeat;background-position:right 12px center;box-sizing:border-box`"
            @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
            @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
          >
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <!-- Notes -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Notes</label>
          <textarea
            v-model="form.notes"
            placeholder="Additional notes..."
            rows="3"
            style="width:100%;padding:8px 12px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;resize:none;box-sizing:border-box"
            @focus="onFocus($event, 'notes')"
            @blur="onBlur($event, 'notes')"
          />
        </div>

      </div>

      <!-- Footer -->
      <div style="padding:17px 24px;border-top:1px solid #e5e7eb;display:flex;justify-content:flex-end;gap:8px;flex-shrink:0">
        <button
          style="height:40px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
          :disabled="submitting"
          @click="emit('close')"
        >Cancel</button>
        <button
          style="height:40px;padding:0 20px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer;box-shadow:0 1px 3px rgba(255,180,0,0.2);display:flex;align-items:center;gap:8px"
          :disabled="submitting"
          @click="submit"
        >
          <UIcon v-if="submitting" name="i-lucide-loader-2" style="width:16px;height:16px;animation:spin 1s linear infinite" />
          {{ submitting ? 'Updating...' : 'Update Maintenance' }}
        </button>
      </div>
    </div>
  </div>
</template>
