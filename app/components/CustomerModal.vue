<script setup lang="ts">
import { geocode } from '@tomtom-org/maps-sdk/services'
import type { Feature, Point } from 'geojson'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success'): void
}>()

const api = useApi()
const toast = useAppToast()
const config = useRuntimeConfig()

interface CustomerType { id: string; name: string; pricingMode?: 'per_bin' | 'full_truck' }
interface Zone { id: string; name: string }
interface CapacityTierOption { id: string; capacityLiters: number; prepayRate: number }

type TomTomPlace = Feature<Point, {
  address?: {
    freeformAddress?: string
    streetNameAndNumber?: string
    municipality?: string
    countrySubdivision?: string
    postalCode?: string
    country?: string
    countryCode?: string
    countryCodeISO3?: string
    localName?: string
  }
}>

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  customerTypeId: '',
  zoneId: '',
  binCount: 1,
  capacityRateId: '',
  address: '',
  city: '',
  region: '',
  postalCode: '',
  country: '',
  placeName: '',
  latitude: '',
  longitude: '',
})

// Center of Ghana (approx) for biasing geocode results
const GHANA_CENTER: [number, number] = [-1.0232, 7.9465]
const GHANA_RADIUS_METERS = 300000

const customerTypes = ref<CustomerType[]>([])
const zones = ref<Zone[]>([])
const capacityTiers = ref<CapacityTierOption[]>([])
const loading = ref(false)

// Whether the selected customer type is priced per bin
const isPerBinType = computed(() => {
  const ct = customerTypes.value.find(t => t.id === form.customerTypeId)
  return (ct?.pricingMode ?? 'per_bin') === 'per_bin'
})

const addressSuggestions = ref<TomTomPlace[]>([])
const showSuggestions = ref(false)
const geocoding = ref(false)
let geocodeTimeout: ReturnType<typeof setTimeout> | null = null
let suppressAddressWatch = false

function debouncedGeocode(query: string) {
  if (geocodeTimeout) clearTimeout(geocodeTimeout)
  if (!query.trim()) {
    addressSuggestions.value = []
    showSuggestions.value = false
    return
  }
  geocodeTimeout = setTimeout(() => fetchAddressSuggestions(query), 500)
}

async function fetchAddressSuggestions(query: string) {
  geocoding.value = true
  try {
    const results = await geocode({
      query,
      limit: 10,
      position: GHANA_CENTER,
      apiKey: config.public.tomtomApiKey as string,
    }) as { features: TomTomPlace[] }
    const features = (results.features || []).filter((place) => {
      const cc = place.properties.address?.countryCode
      return !cc || cc.toUpperCase() === 'GH'
    })
    addressSuggestions.value = features.slice(0, 5)
    showSuggestions.value = features.length > 0
  } catch (err) {
    console.error('TomTom geocode error:', err)
    addressSuggestions.value = []
    showSuggestions.value = false
  } finally {
    geocoding.value = false
  }
}

function selectAddressSuggestion(place: TomTomPlace) {
  const addr = place.properties.address || {}
  suppressAddressWatch = true
  form.address = addr.streetNameAndNumber || addr.freeformAddress || form.address
  form.city = addr.municipality || addr.localName || ''
  form.region = addr.countrySubdivision || ''
  form.postalCode = addr.postalCode || ''
  form.country = addr.country || ''
  form.placeName = addr.municipality || addr.localName || ''
  const [lng, lat] = place.geometry.coordinates
  form.longitude = String(lng)
  form.latitude = String(lat)
  showSuggestions.value = false
  addressSuggestions.value = []
  nextTick(() => { suppressAddressWatch = false })
}

watch(() => form.address, (query) => {
  if (suppressAddressWatch) return
  debouncedGeocode(query)
})

async function fetchCustomerTypes() {
  const data = await api.get<CustomerType[]>('/customer/admin/types/', 'Failed to load customer types')
  if (data) {
    customerTypes.value = data
    const first = data[0]
    if (first && !form.customerTypeId) {
      form.customerTypeId = first.id
    }
  }
}

async function fetchZones() {
  const data = await api.get<Zone[]>('/zone/public/list', 'Failed to load zones')
  if (data) {
    zones.value = data
  }
}

async function fetchCapacityTiers() {
  const data = await api.get<{ tiers: CapacityTierOption[] }>('/rates/admin/capacity', 'Failed to load bin capacities')
  if (data) {
    capacityTiers.value = (data.tiers || []).filter(t => t.capacityLiters != null)
  }
}

onMounted(() => {
  fetchCustomerTypes()
  fetchZones()
  fetchCapacityTiers()
})

const errors = reactive<Record<string, string>>({})

function validate() {
  Object.keys(errors).forEach(k => delete errors[k])
  if (!form.firstName.trim())  errors.firstName = 'Required'
  if (!form.lastName.trim())   errors.lastName = 'Required'
  if (!form.email.trim())      errors.email = 'Required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Invalid email'
  if (!form.phone.trim())      errors.phone = 'Required'
  if (!form.customerTypeId)    errors.customerTypeId = 'Required'
  if (!form.zoneId)            errors.zoneId = 'Required'
  if (isPerBinType.value && !form.capacityRateId) errors.capacityRateId = 'Required'
  return Object.keys(errors).length === 0
}

async function submit() {
  if (!validate()) return
  loading.value = true
  const payload: Record<string, unknown> = {
    email: form.email.trim(),
    name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
    phoneNumber: form.phone.trim(),
    customerTypeId: form.customerTypeId,
    zoneId: form.zoneId,
    noBins: form.binCount,
    address: form.address.trim(),
    city: form.city.trim(),
    region: form.region.trim(),
    postalCode: form.postalCode.trim(),
    country: form.country.trim(),
    placeName: form.placeName.trim(),
    location: {
      latitude: Number(form.latitude) || 0,
      longitude: Number(form.longitude) || 0,
    },
  }
  // Only per_bin customers get a capacity rate assigned at profile level
  if (isPerBinType.value && form.capacityRateId) {
    payload.capacityRateId = form.capacityRateId
  }
  const result = await api.post('/customer/admin/', payload, 'Failed to create customer')
  loading.value = false
  if (result) {
    toast.success('Customer created successfully')
    emit('success')
  }
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
        <p style="font-size:20px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Add New Customer</p>
      </div>

      <!-- Close button -->
      <button
        style="position:absolute;top:16px;right:16px;width:28px;height:28px;border:none;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:8px;opacity:0.7"
        @click="emit('close')"
        @mouseover="($event.currentTarget as HTMLElement).style.background='#f3f4f6'"
        @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
      >
        <UIcon name="i-lucide-x" style="width:16px;height:16px;color:#111" />
      </button>

      <!-- Scrollable body -->
      <div style="flex:1;overflow-y:auto;padding:24px;display:flex;flex-direction:column;gap:16px">

        <!-- First / Last name -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">First Name</label>
            <input v-model="form.firstName" type="text" placeholder="John" :style="inputStyle('firstName')"
              @focus="onFocus($event, 'firstName')" @blur="onBlur($event, 'firstName')" />
            <span v-if="errors.firstName" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ errors.firstName }}</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Last Name</label>
            <input v-model="form.lastName" type="text" placeholder="Doe" :style="inputStyle('lastName')"
              @focus="onFocus($event, 'lastName')" @blur="onBlur($event, 'lastName')" />
            <span v-if="errors.lastName" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ errors.lastName }}</span>
          </div>
        </div>

        <!-- Email -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Email</label>
          <input v-model="form.email" type="email" placeholder="john.doe@email.com" :style="inputStyle('email')"
            @focus="onFocus($event, 'email')" @blur="onBlur($event, 'email')" />
          <span v-if="errors.email" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ errors.email }}</span>
        </div>

        <!-- Phone -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Phone</label>
          <input v-model="form.phone" type="tel" placeholder="(555) 000-0000" :style="inputStyle('phone')"
            @focus="onFocus($event, 'phone')" @blur="onBlur($event, 'phone')" />
          <span v-if="errors.phone" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ errors.phone }}</span>
        </div>

        <!-- Customer Type -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Customer Type</label>
          <select
            v-model="form.customerTypeId"
            :style="`width:100%;height:42px;padding:0 16px;background:white;border:1px solid ${errors.customerTypeId ? '#ef4444' : '#e5e7eb'};border-radius:16px;font-size:14px;color:${form.customerTypeId ? '#1a1a1a' : '#9ca3af'};font-family:'Manrope',sans-serif;outline:none;cursor:pointer;appearance:none;background-image:${chevronBg};background-repeat:no-repeat;background-position:right 12px center;box-sizing:border-box`"
            @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
            @blur="($event.target as HTMLElement).style.borderColor=errors.customerTypeId ? '#ef4444' : '#e5e7eb'"
          >
            <option value="" disabled>Select a customer type</option>
            <option v-for="t in customerTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
          <span v-if="errors.customerTypeId" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ errors.customerTypeId }}</span>
        </div>

        <!-- Bin Capacity (per_bin pricing mode only) -->
        <div v-if="isPerBinType" style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Bin Capacity</label>
          <select
            v-model="form.capacityRateId"
            :style="`width:100%;height:42px;padding:0 16px;background:white;border:1px solid ${errors.capacityRateId ? '#ef4444' : '#e5e7eb'};border-radius:16px;font-size:14px;color:${form.capacityRateId ? '#1a1a1a' : '#9ca3af'};font-family:'Manrope',sans-serif;outline:none;cursor:pointer;appearance:none;background-image:${chevronBg};background-repeat:no-repeat;background-position:right 12px center;box-sizing:border-box`"
            @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
            @blur="($event.target as HTMLElement).style.borderColor=errors.capacityRateId ? '#ef4444' : '#e5e7eb'"
          >
            <option value="" disabled>Select bin capacity</option>
            <option v-for="tier in capacityTiers" :key="tier.id" :value="tier.id">{{ tier.capacityLiters }}L — GHS {{ tier.prepayRate }}/pickup</option>
          </select>
          <span v-if="errors.capacityRateId" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ errors.capacityRateId }}</span>
        </div>

        <!-- Address -->
        <div style="display:flex;flex-direction:column;gap:6px;position:relative">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Address</label>
          <div style="position:relative">
            <input
              v-model="form.address"
              type="text"
              placeholder="Start typing to search (powered by TomTom)"
              :style="inputStyle('address')"
              @focus="onFocus($event, 'address')"
              @blur="onBlur($event, 'address')"
            />
            <UIcon
              v-if="geocoding"
              name="i-lucide-loader-2"
              style="position:absolute;right:12px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:#6b7280;animation:spin 1s linear infinite"
            />
          </div>
          <div
            v-if="showSuggestions && addressSuggestions.length > 0"
            style="position:absolute;top:100%;left:0;right:0;z-index:10;background:white;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);margin-top:4px;max-height:200px;overflow-y:auto"
          >
            <button
              v-for="(place, i) in addressSuggestions"
              :key="i"
              type="button"
              style="width:100%;text-align:left;padding:10px 12px;background:none;border:none;cursor:pointer;font-size:13px;color:#1a1a1a;font-family:'Manrope',sans-serif;border-bottom:1px solid #f3f4f6"
              @click="selectAddressSuggestion(place)"
              @mouseover="($event.currentTarget as HTMLElement).style.background='#f9fafb'"
              @mouseleave="($event.currentTarget as HTMLElement).style.background='white'"
            >
              {{ place.properties.address?.freeformAddress || place.properties.address?.streetNameAndNumber || 'Address' }}
            </button>
          </div>
        </div>

        <!-- City / Region -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">City</label>
            <input v-model="form.city" type="text" placeholder="Accra" :style="inputStyle('city')"
              @focus="onFocus($event, 'city')" @blur="onBlur($event, 'city')" />
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Region</label>
            <input v-model="form.region" type="text" placeholder="Greater Accra" :style="inputStyle('region')"
              @focus="onFocus($event, 'region')" @blur="onBlur($event, 'region')" />
          </div>
        </div>

        <!-- Postal Code / Country -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Postal Code</label>
            <input v-model="form.postalCode" type="text" placeholder="00233" :style="inputStyle('postalCode')"
              @focus="onFocus($event, 'postalCode')" @blur="onBlur($event, 'postalCode')" />
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Country</label>
            <input v-model="form.country" type="text" placeholder="Ghana" :style="inputStyle('country')"
              @focus="onFocus($event, 'country')" @blur="onBlur($event, 'country')" />
          </div>
        </div>

        <!-- Place Name -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Place Name</label>
          <input v-model="form.placeName" type="text" placeholder="Landmark / area name" :style="inputStyle('placeName')"
            @focus="onFocus($event, 'placeName')" @blur="onBlur($event, 'placeName')" />
        </div>

        <!-- Location -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Latitude</label>
            <input v-model="form.latitude" type="text" placeholder="5.6037" :style="inputStyle('latitude')"
              @focus="onFocus($event, 'latitude')" @blur="onBlur($event, 'latitude')" />
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Longitude</label>
            <input v-model="form.longitude" type="text" placeholder="-0.1870" :style="inputStyle('longitude')"
              @focus="onFocus($event, 'longitude')" @blur="onBlur($event, 'longitude')" />
          </div>
        </div>

        <!-- Zone -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Zone</label>
          <select
            v-model="form.zoneId"
            :style="`width:100%;height:42px;padding:0 16px;background:white;border:1px solid ${errors.zoneId ? '#ef4444' : '#e5e7eb'};border-radius:16px;font-size:14px;color:${form.zoneId ? '#1a1a1a' : '#9ca3af'};font-family:'Manrope',sans-serif;outline:none;cursor:pointer;appearance:none;background-image:${chevronBg};background-repeat:no-repeat;background-position:right 12px center;box-sizing:border-box`"
            @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
            @blur="($event.target as HTMLElement).style.borderColor=errors.zoneId ? '#ef4444' : '#e5e7eb'"
          >
            <option value="" disabled>Select a zone</option>
            <option v-for="z in zones" :key="z.id" :value="z.id">{{ z.name }}</option>
          </select>
          <span v-if="errors.zoneId" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ errors.zoneId }}</span>
        </div>

        <!-- Assigned BINs -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Assigned BINs</label>
          <div style="display:flex;align-items:center;gap:12px">
            <button
              type="button"
              style="width:36px;height:36px;border:1px solid #e5e7eb;border-radius:12px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:18px;color:#6b7280"
              @click="form.binCount = Math.max(1, form.binCount - 1)"
            >−</button>
            <span style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;min-width:32px;text-align:center">{{ form.binCount }}</span>
            <button
              type="button"
              style="width:36px;height:36px;border:1px solid #e5e7eb;border-radius:12px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:18px;color:#6b7280"
              @click="form.binCount++"
            >+</button>
            <span style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif">bin{{ form.binCount !== 1 ? 's' : '' }} assigned</span>
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
          :disabled="loading"
          :style="`height:40px;padding:0 20px;background:${loading ? '#f3f4f6' : '#ffb400'};border:none;border-radius:20px;font-size:14px;font-weight:500;color:${loading ? '#9ca3af' : '#0a0d12'};font-family:'Manrope',sans-serif;cursor:${loading ? 'not-allowed' : 'pointer'};box-shadow:0 1px 3px rgba(255,180,0,0.2)`"
          @click="submit"
        >{{ loading ? 'Creating...' : 'Add Customer' }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes spin {
  from { transform: translateY(-50%) rotate(0deg); }
  to { transform: translateY(-50%) rotate(360deg); }
}
</style>
