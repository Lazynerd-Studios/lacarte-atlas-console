<script setup lang="ts">
import type { Customer } from '~/types/customer'

const props = defineProps<{
  customer: Customer
  saving?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', data: {
    customerTypeId: string
    zoneId: string
    phoneNumber: string
    noBins: number
    address: string
    city: string
    region: string
    postalCode: string
    country: string
    placeName: string
  }): void
}>()

const customerTypes = ref<{ id: string; name: string }[]>([])
const zones = ref<{ id: string; name: string; color: string }[]>([])
const loadingOptions = ref(true)

onMounted(async () => {
  const api = useApi()
  const [typesRes, zonesRes] = await Promise.all([
    api.get<{ id: string; name: string; customerCount?: string }[]>('/customer/admin/types/', 'Failed to load customer types'),
    api.get<{ id: string; name: string; color: string }[]>('/zone/public/list', 'Failed to load zones'),
  ])
  if (typesRes) customerTypes.value = typesRes
  if (zonesRes) zones.value = zonesRes
  loadingOptions.value = false
})

const form = reactive({
  customerTypeId: props.customer.customerTypeId ?? '',
  zoneId: props.customer.zoneId ?? '',
  phoneNumber: props.customer.phoneNumber ?? '',
  noBins: props.customer.noBins ?? 1,
  address: props.customer.address ?? '',
  city: props.customer.city ?? '',
  region: props.customer.region ?? '',
  postalCode: props.customer.postalCode ?? '',
  country: props.customer.country ?? '',
  placeName: props.customer.placeName ?? '',
})

const errors = reactive<Record<string, string>>({})

function validate() {
  Object.keys(errors).forEach(k => delete errors[k])
  if (!form.phoneNumber.trim())  errors.phoneNumber = 'Required'
  if (!form.address.trim())      errors.address = 'Required'
  if (!form.city.trim())         errors.city = 'Required'
  if (!form.customerTypeId)      errors.customerTypeId = 'Required'
  if (!form.zoneId)              errors.zoneId = 'Required'
  if (form.noBins < 0)           errors.noBins = 'Cannot be negative'
  return Object.keys(errors).length === 0
}

function submit() {
  if (props.saving) return
  if (!validate()) return
  emit('submit', {
    customerTypeId: form.customerTypeId,
    zoneId: form.zoneId,
    phoneNumber: form.phoneNumber.trim(),
    noBins: Number(form.noBins),
    address: form.address.trim(),
    city: form.city.trim(),
    region: form.region?.trim() ?? '',
    postalCode: form.postalCode?.trim() ?? '',
    country: form.country?.trim() ?? '',
    placeName: form.placeName?.trim() ?? '',
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

const selectStyle = (hasValue: boolean) =>
  `width:100%;height:42px;padding:0 16px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:${hasValue ? '#1a1a1a' : '#9ca3af'};font-family:'Manrope',sans-serif;outline:none;cursor:pointer;appearance:none;background-image:${chevronBg};background-repeat:no-repeat;background-position:right 12px center;box-sizing:border-box`
</script>

<template>
  <div
    style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:50;display:flex;align-items:center;justify-content:center;padding:24px"
    @click.self="emit('close')"
  >
    <div style="background:white;border:1px solid #e5e7eb;border-radius:16px;width:510px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 10px 15px rgba(0,0,0,0.1),0 4px 6px rgba(0,0,0,0.1);position:relative">

      <!-- Header -->
      <div style="padding:24px 24px 16px;flex-shrink:0;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between">
        <div style="display:flex;flex-direction:column;gap:2px">
          <p style="font-size:20px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Edit Customer</p>
          <p style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif">{{ customer.user.name }} · {{ customer.user.email }}</p>
        </div>
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

        <!-- Phone -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Phone Number</label>
          <input v-model="form.phoneNumber" type="tel" :style="inputStyle('phoneNumber')"
            @focus="onFocus($event, 'phoneNumber')" @blur="onBlur($event, 'phoneNumber')" />
          <span v-if="errors.phoneNumber" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ errors.phoneNumber }}</span>
        </div>

        <!-- Customer Type -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Customer Type</label>
          <select
            v-model="form.customerTypeId"
            :style="selectStyle(!!form.customerTypeId)"
          >
            <option value="" disabled>Select a type</option>
            <option v-for="t in customerTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
          <span v-if="errors.customerTypeId" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ errors.customerTypeId }}</span>
        </div>

        <!-- Zone -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Zone</label>
          <select
            v-model="form.zoneId"
            :style="selectStyle(!!form.zoneId)"
          >
            <option value="" disabled>Select a zone</option>
            <option v-for="z in zones" :key="z.id" :value="z.id">{{ z.name }}</option>
          </select>
          <span v-if="errors.zoneId" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ errors.zoneId }}</span>
        </div>

        <!-- Address -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Address</label>
          <input v-model="form.address" type="text" :style="inputStyle('address')"
            @focus="onFocus($event, 'address')" @blur="onBlur($event, 'address')" />
          <span v-if="errors.address" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ errors.address }}</span>
        </div>

        <!-- City / Region -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">City</label>
            <input v-model="form.city" type="text" :style="inputStyle('city')"
              @focus="onFocus($event, 'city')" @blur="onBlur($event, 'city')" />
            <span v-if="errors.city" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ errors.city }}</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Region</label>
            <input v-model="form.region" type="text" :style="inputStyle('region')"
              @focus="onFocus($event, 'region')" @blur="onBlur($event, 'region')" />
          </div>
        </div>

        <!-- Postal Code / Country -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Postal Code</label>
            <input v-model="form.postalCode" type="text" :style="inputStyle('postalCode')"
              @focus="onFocus($event, 'postalCode')" @blur="onBlur($event, 'postalCode')" />
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Country</label>
            <input v-model="form.country" type="text" :style="inputStyle('country')"
              @focus="onFocus($event, 'country')" @blur="onBlur($event, 'country')" />
          </div>
        </div>

        <!-- Place Name -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Place Name</label>
          <input v-model="form.placeName" type="text" placeholder="Resolved location label" :style="inputStyle('placeName')"
            @focus="onFocus($event, 'placeName')" @blur="onBlur($event, 'placeName')" />
        </div>

        <!-- Assigned BINs -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Assigned Bins</label>
          <div style="display:flex;align-items:center;gap:12px">
            <button
              type="button"
              style="width:36px;height:36px;border:1px solid #e5e7eb;border-radius:12px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:18px;color:#6b7280"
              @click="form.noBins = Math.max(0, form.noBins - 1)"
            >−</button>
            <span style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;min-width:32px;text-align:center">{{ form.noBins }}</span>
            <button
              type="button"
              style="width:36px;height:36px;border:1px solid #e5e7eb;border-radius:12px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:18px;color:#6b7280"
              @click="form.noBins++"
            >+</button>
            <span style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif">bin{{ form.noBins !== 1 ? 's' : '' }} assigned</span>
          </div>
          <span v-if="errors.noBins" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ errors.noBins }}</span>
        </div>
      </div>

      <!-- Footer -->
      <div style="padding:17px 24px;border-top:1px solid #e5e7eb;display:flex;justify-content:flex-end;gap:8px;flex-shrink:0">
        <button
          style="height:40px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
          @click="emit('close')"
        >Cancel</button>
        <button
          :disabled="saving"
          :style="`height:40px;padding:0 20px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:${saving ? 'not-allowed' : 'pointer'};opacity:${saving ? 0.6 : 1}`"
          @click="submit"
        >{{ saving ? 'Saving…' : 'Save Changes' }}</button>
      </div>
    </div>
  </div>
</template>
