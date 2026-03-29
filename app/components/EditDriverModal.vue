<script setup lang="ts">
const props = defineProps<{
  driver: Record<string, any>
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', data: Record<string, unknown>): void
}>()

const zones = ref<{ id: string; name: string }[]>([])

// Split name into first/last
const nameParts = (props.driver?.user?.name ?? '').trim().split(' ')
const form = reactive({
  firstName:     nameParts[0] ?? '',
  lastName:      nameParts.slice(1).join(' ') ?? '',
  email:         props.driver?.user?.email ?? '',
  phoneNumber:   props.driver?.phoneNumber ?? '',
  licenseNumber: props.driver?.licenseNumber ?? '',
  licenseExpiry: props.driver?.licenseExpiry ?? '',
  zoneId:        props.driver?.zone?.id ?? '',
  status:        props.driver?.status ?? 'active',
})

const assignedTruckDisplay = computed(() => {
  const truck = props.driver?.assignedTruck
  if (!truck) return 'Unassigned'
  return `${truck.truckId ?? 'N/A'} — ${truck.plateNumber ?? 'N/A'}`
})

onMounted(async () => {
  const api = useApi()
  const zoneData = await api.get<any>('/zone/public/list')
  if (zoneData) zones.value = Array.isArray(zoneData) ? zoneData : (zoneData.data ?? [])
})

const errors = reactive<Record<string, string>>({})

function validate() {
  Object.keys(errors).forEach(k => delete errors[k])
  if (!form.firstName.trim())   errors.firstName = 'Required'
  if (!form.lastName.trim())    errors.lastName = 'Required'
  if (!form.email.trim())       errors.email = 'Required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Invalid email'
  if (!form.phoneNumber.trim()) errors.phoneNumber = 'Required'
  return Object.keys(errors).length === 0
}

function submit() {
  if (!validate()) return
  emit('submit', {
    name:          `${form.firstName.trim()} ${form.lastName.trim()}`,
    email:         form.email,
    phoneNumber:   form.phoneNumber,
    licenseNumber: form.licenseNumber || undefined,
    licenseExpiry: form.licenseExpiry || undefined,
    zoneId:        form.zoneId || undefined,
    status:        form.status,
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
        <p style="font-size:20px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Edit Driver</p>
      </div>

      <!-- Close -->
      <button
        style="position:absolute;top:16px;right:16px;width:28px;height:28px;border:none;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:8px;opacity:0.7"
        @click="emit('close')"
        @mouseover="($event.currentTarget as HTMLElement).style.background='#f3f4f6'"
        @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
      >
        <Icon name="lucide:x" style="width:16px;height:16px;color:#111" />      </button>

      <!-- Body -->
      <div style="flex:1;overflow-y:auto;padding:24px;display:flex;flex-direction:column;gap:16px">

        <!-- First / Last name -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">First Name</label>
            <input v-model="form.firstName" type="text" :style="inputStyle('firstName')"
              @focus="onFocus($event, 'firstName')" @blur="onBlur($event, 'firstName')" />
            <span v-if="errors.firstName" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ errors.firstName }}</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Last Name</label>
            <input v-model="form.lastName" type="text" :style="inputStyle('lastName')"
              @focus="onFocus($event, 'lastName')" @blur="onBlur($event, 'lastName')" />
            <span v-if="errors.lastName" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ errors.lastName }}</span>
          </div>
        </div>

        <!-- Email -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Email</label>
          <input v-model="form.email" type="email" :style="inputStyle('email')"
            @focus="onFocus($event, 'email')" @blur="onBlur($event, 'email')" />
          <span v-if="errors.email" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ errors.email }}</span>
        </div>

        <!-- Phone -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Phone</label>
          <input v-model="form.phoneNumber" type="tel" :style="inputStyle('phoneNumber')"
            @focus="onFocus($event, 'phoneNumber')" @blur="onBlur($event, 'phoneNumber')" />
          <span v-if="errors.phoneNumber" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ errors.phoneNumber }}</span>
        </div>

        <!-- License / Expiry -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">License Number</label>
            <input v-model="form.licenseNumber" type="text" :style="inputStyle('licenseNumber')"
              @focus="onFocus($event, 'licenseNumber')" @blur="onBlur($event, 'licenseNumber')" />
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">License Expiry</label>
            <input v-model="form.licenseExpiry" type="date" :style="inputStyle('licenseExpiry')"
              @focus="onFocus($event, 'licenseExpiry')" @blur="onBlur($event, 'licenseExpiry')" />
          </div>
        </div>

        <!-- Truck / Zone -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Assigned Truck</label>
            <input
              :value="assignedTruckDisplay"
              type="text"
              readonly
              style="width:100%;height:39px;padding:0 12px;background:#f8f9fa;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box;cursor:default"
            />
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Zone</label>
            <select
              v-model="form.zoneId"
              :style="`width:100%;height:42px;padding:0 16px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;cursor:pointer;appearance:none;background-image:${chevronBg};background-repeat:no-repeat;background-position:right 12px center;box-sizing:border-box`"
              @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
              @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
            >
              <option value="">No Zone</option>
              <option v-for="z in zones" :key="z.id" :value="z.id">{{ z.name }}</option>
            </select>
          </div>
        </div>

      </div>

      <!-- Footer -->
      <div style="padding:17px 24px;border-top:1px solid #e5e7eb;display:flex;justify-content:flex-end;gap:8px;flex-shrink:0">
        <button
          style="height:40px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
          @click="emit('close')"
        >Cancel</button>
        <button
          style="height:40px;padding:0 20px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer"
          @click="submit"
        >Save Changes</button>
      </div>
    </div>
  </div>
</template>
