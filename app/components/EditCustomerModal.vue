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
    entityName?: string | null
    address: string
    city: string
    region: string
    postalCode: string
    country: string
    placeName: string
    defaultItemTypeId?: string | null
    defaultEstimatedQuantityId?: string | null
  }): void
}>()

const customerTypes = ref<{ id: string; name: string; pricingMode?: 'per_bin' | 'full_truck'; requiresEntityName?: boolean; entityNameLabel?: string | null }[]>([])
const zones = ref<{ id: string; name: string; color: string }[]>([])
const loadingOptions = ref(true)

// Pickup booking defaults (§4): global active item types + quantities scoped to
// the selected customer type. Both selects offer a "None" option (value '') that
// maps to null on submit to clear the stored preference.
interface DisposableOption { id: string; name: string }
interface QuantityOption { id: string; label: string; binCount: number | null }
const disposableTypes = ref<DisposableOption[]>([])
const quantityOptions = ref<QuantityOption[]>([])
const loadingQuantities = ref(false)

async function fetchQuantities(customerTypeId: string) {
  if (!customerTypeId) { quantityOptions.value = []; return }
  loadingQuantities.value = true
  const api = useApi()
  const res = await api.get<any>(`/disposable/quantities/active?customerTypeId=${customerTypeId}`, 'Failed to load estimated quantities')
  if (res) {
    const items = Array.isArray(res) ? res : (res.data ?? res.quantities ?? [])
    quantityOptions.value = items.map((q: any) => ({
      id: q.id,
      label: q.label,
      binCount: q.binCount != null ? Number(q.binCount) : null,
    }))
  }
  loadingQuantities.value = false
}

onMounted(async () => {
  const api = useApi()
  const [typesRes, zonesRes, dispRes] = await Promise.all([
    api.get<{ id: string; name: string; customerCount?: string; pricingMode?: 'per_bin' | 'full_truck'; requiresEntityName?: boolean; entityNameLabel?: string | null }[]>('/customer/admin/types/', 'Failed to load customer types'),
    api.get<{ id: string; name: string; color: string }[]>('/zone/public/list', 'Failed to load zones'),
    api.get<any>('/disposable/item-types/active', 'Failed to load disposable item types'),
    fetchQuantities(props.customer.customerTypeId ?? ''),
  ])
  if (typesRes) customerTypes.value = typesRes
  if (zonesRes) zones.value = zonesRes
  if (dispRes) {
    const items = Array.isArray(dispRes) ? dispRes : (dispRes.data ?? dispRes.disposableTypes ?? [])
    disposableTypes.value = items.map((i: any) => ({ id: i.id, name: i.name }))
  }
  loadingOptions.value = false
})

const form = reactive({
  customerTypeId: props.customer.customerTypeId ?? '',
  zoneId: props.customer.zoneId ?? '',
  phoneNumber: props.customer.phoneNumber ?? '',
  // Pre-fill the stored business name so an untouched edit keeps it (§3)
  entityName: props.customer.entityName ?? '',
  address: props.customer.address ?? '',
  city: props.customer.city ?? '',
  region: props.customer.region ?? '',
  postalCode: props.customer.postalCode ?? '',
  country: props.customer.country ?? '',
  placeName: props.customer.placeName ?? '',
  defaultItemTypeId: props.customer.defaultItemTypeId ?? '',
  defaultEstimatedQuantityId: props.customer.defaultEstimatedQuantityId ?? '',
})

const errors = reactive<Record<string, string>>({})

// ── Entity names (§3) — field + rules driven entirely by the selected category ──
const selectedType = computed(() => customerTypes.value.find(t => t.id === form.customerTypeId))
const needsEntityName = computed(() => selectedType.value?.requiresEntityName ?? false)
const entityFieldLabel = computed(() => selectedType.value?.entityNameLabel?.trim() || 'Business name')
const entityNameInput = ref<HTMLInputElement | null>(null)
// The category the customer is CURRENTLY stored under (before any selector change)
const wasEntityType = computed(() => props.customer.customerType?.requiresEntityName ?? false)
// entity → non-entity switch: the API clears the stored business name, so confirm first
const switchingToNonEntity = computed(() => wasEntityType.value && !needsEntityName.value)
const clearConfirmed = ref(false)
// Reset the confirmation whenever the selector moves back to an entity category
watch(needsEntityName, (v) => { if (v) clearConfirmed.value = false })

// When the category changes, the booking-default quantity is scoped to the old
// type — reload the options for the new type and clear any now-invalid selection.
watch(() => form.customerTypeId, (id) => {
  form.defaultEstimatedQuantityId = ''
  fetchQuantities(id)
})

const saveLabel = computed(() => {
  if (props.saving) return 'Saving…'
  // After the first save click on an entity→non-entity switch, the button
  // becomes the explicit confirmation action
  if (switchingToNonEntity.value && clearConfirmed.value) return 'Remove name & save'
  return 'Save Changes'
})

function validate() {
  Object.keys(errors).forEach(k => delete errors[k])
  if (!form.phoneNumber.trim())  errors.phoneNumber = 'Required'
  if (!form.address.trim())      errors.address = 'Required'
  if (!form.city.trim())         errors.city = 'Required'
  if (!form.customerTypeId)      errors.customerTypeId = 'Required'
  if (!form.zoneId)              errors.zoneId = 'Required'
  // Switching non-entity → entity with no stored name makes entityName required
  // in this same request; the API rejects the switch without it (§3)
  if (needsEntityName.value && !form.entityName.trim()) {
    errors.entityName = `${entityFieldLabel.value} is required`
    nextTick(() => entityNameInput.value?.focus())
  }
  return Object.keys(errors).length === 0
}

function submit() {
  if (props.saving) return
  if (!validate()) return
  // Two-step confirm when the switch would clear the stored business name (§3)
  if (switchingToNonEntity.value && !clearConfirmed.value) {
    clearConfirmed.value = true
    return
  }
  const data: {
    customerTypeId: string
    zoneId: string
    phoneNumber: string
    entityName?: string | null
    address: string
    city: string
    region: string
    postalCode: string
    country: string
    placeName: string
    defaultItemTypeId?: string | null
    defaultEstimatedQuantityId?: string | null
  } = {
    customerTypeId: form.customerTypeId,
    zoneId: form.zoneId,
    phoneNumber: form.phoneNumber.trim(),
    address: form.address.trim(),
    city: form.city.trim(),
    region: form.region?.trim() ?? '',
    postalCode: form.postalCode?.trim() ?? '',
    country: form.country?.trim() ?? '',
    placeName: form.placeName?.trim() ?? '',
    // §4: empty selection sends null to clear the stored preference
    defaultItemTypeId: form.defaultItemTypeId || null,
    defaultEstimatedQuantityId: form.defaultEstimatedQuantityId || null,
  }
  // Send entityName ONLY for entity categories — the key must be omitted for
  // non-entity types (the API clears the stored name on the switch itself).
  if (needsEntityName.value) {
    data.entityName = form.entityName.trim()
  }
  emit('submit', data)
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

        <!-- Business name (entity names) — only for categories that require it -->
        <div v-if="needsEntityName" style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ entityFieldLabel }} <span style="color:#ef4444">*</span></label>
          <input ref="entityNameInput" v-model="form.entityName" type="text" maxlength="150" :placeholder="entityFieldLabel" :style="inputStyle('entityName')"
            @focus="onFocus($event, 'entityName')" @blur="onBlur($event, 'entityName')" />
          <span v-if="errors.entityName" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ errors.entityName }}</span>
        </div>

        <!-- entity → non-entity switch: the API clears the stored business name (§3) -->
        <div v-if="switchingToNonEntity" style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px 14px;display:flex;gap:10px;align-items:flex-start">
          <UIcon name="i-lucide-triangle-alert" style="width:16px;height:16px;color:#b45309;flex-shrink:0;margin-top:2px" />
          <div>
            <p style="font-size:13px;color:#92400e;font-family:'Manrope',sans-serif;margin:0">Switching this customer to a non-business category removes their business name.</p>
            <p v-if="clearConfirmed" style="font-size:12px;color:#92400e;font-family:'Manrope',sans-serif;margin:4px 0 0;opacity:0.8">Click “Remove name &amp; save” to confirm.</p>
          </div>
        </div>

        <!-- Bin sizes are managed on the customer's Bin Mix tab (multi-bin-sizes) -->
        
         <!-- Pickup booking defaults (§4) -->
         <div style="border:1.5px solid #e5e7eb;border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:14px">
           <div>
             <p style="font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;margin:0">Pickup Booking Defaults</p>
             <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin:4px 0 0">What the scheduler books automatically, and the fallback when a pickup is created without an explicit quantity.</p>
           </div>
           <div style="display:flex;flex-direction:column;gap:6px">
             <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Default Disposable Type</label>
             <select v-model="form.defaultItemTypeId" :style="selectStyle(!!form.defaultItemTypeId)">
               <option value="">None</option>
               <option v-for="d in disposableTypes" :key="d.id" :value="d.id">{{ d.name }}</option>
             </select>
           </div>
           <div style="display:flex;flex-direction:column;gap:6px">
             <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Default Estimated Quantity</label>
             <select v-model="form.defaultEstimatedQuantityId" :disabled="loadingQuantities" :style="selectStyle(!!form.defaultEstimatedQuantityId)">
               <option value="">{{ loadingQuantities ? 'Loading quantities…' : 'None' }}</option>
               <option v-for="q in quantityOptions" :key="q.id" :value="q.id">{{ q.label }}{{ q.binCount != null ? ` (${q.binCount} bins)` : '' }}</option>
             </select>
             <span style="font-size:12px;color:#9ca3af;font-family:'Manrope',sans-serif">Quantities available to the selected customer type. If the stored default isn't valid, the server falls back to the type's lowest-ordered active quantity.</span>
           </div>
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
        >{{ saveLabel }}</button>
      </div>
    </div>
  </div>
</template>
