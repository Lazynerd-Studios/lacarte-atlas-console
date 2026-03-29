<script setup lang="ts">
const props = defineProps<{
  truckId: string
  currentDriver?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', driverId: string): void
}>()

const selectedDriver = ref('')
const drivers = ref<Array<{ id: string; name: string }>>([])
const loadingDrivers = ref(false)

onMounted(async () => {
  console.log('[AssignDriverToTruckModal] Fetching drivers for truck:', props.truckId)
  loadingDrivers.value = true
  const api = useApi()
  const data = await api.get<any>('/drivers/admin/')
  console.log('[AssignDriverToTruckModal] Drivers response:', data)
  if (data) {
    const driverList = Array.isArray(data) ? data : (data.data ?? data.drivers ?? data.results ?? [])
    drivers.value = driverList.map((d: any) => ({
      id: d.id,
      name: d.user?.name ?? d.name ?? 'Unknown'
    }))
    console.log('[AssignDriverToTruckModal] Loaded drivers:', drivers.value.length)
  }
  loadingDrivers.value = false
})

const chevronBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`
const selectStyle = `width:100%;height:42px;padding:0 16px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;cursor:pointer;appearance:none;background-image:${chevronBg};background-repeat:no-repeat;background-position:right 12px center;box-sizing:border-box`

function onFocus(e: Event) { (e.target as HTMLElement).style.borderColor = '#ffb400' }
function onBlur(e: Event)  { (e.target as HTMLElement).style.borderColor = '#e5e7eb' }

function submit() {
  if (!selectedDriver.value) {
    console.log('[AssignDriverToTruckModal] No driver selected')
    return
  }
  console.log('[AssignDriverToTruckModal] Assigning driver:', selectedDriver.value)
  emit('submit', selectedDriver.value)
}
</script>

<template>
  <div
    style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:50;display:flex;align-items:center;justify-content:center;padding:24px"
    @click.self="emit('close')"
  >
    <div style="background:white;border:1px solid #e5e7eb;border-radius:16px;width:100%;max-width:480px;box-shadow:0 10px 15px rgba(0,0,0,0.1),0 4px 6px rgba(0,0,0,0.1);position:relative">

      <!-- Close -->
      <button
        style="position:absolute;top:16px;right:16px;width:28px;height:28px;border:none;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:8px;opacity:0.7;z-index:1"
        @click="emit('close')"
        @mouseover="($event.currentTarget as HTMLElement).style.background='#f3f4f6'"
        @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
      >
        <UIcon name="i-lucide-x" style="width:16px;height:16px;color:#111" />
      </button>

      <!-- Header -->
      <div style="padding:24px 24px 0">
        <div style="width:48px;height:48px;margin:0 auto 16px;border-radius:50%;background:#fff9e6;display:flex;align-items:center;justify-content:center">
          <UIcon name="i-lucide-user-plus" style="width:24px;height:24px;color:#ffb400" />
        </div>
        <p style="font-size:20px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;text-align:center;margin:0">Assign Driver</p>
        <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;text-align:center;margin:8px 0 0">Select a driver to assign to {{ truckId }}</p>
      </div>

      <!-- Body -->
      <div style="padding:24px">
        <div v-if="currentDriver" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:12px 16px;margin-bottom:16px">
          <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0 0 4px">Currently Assigned</p>
          <p style="font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;margin:0">{{ currentDriver }}</p>
        </div>

        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Select Driver <span style="color:#ef4444">*</span></label>
          <select v-model="selectedDriver" :style="selectStyle" @focus="onFocus" @blur="onBlur" :disabled="loadingDrivers">
            <option value="" disabled>{{ loadingDrivers ? 'Loading drivers...' : 'Choose a driver...' }}</option>
            <option v-for="d in drivers" :key="d.id" :value="d.id">{{ d.name }}</option>
          </select>
        </div>
      </div>

      <!-- Footer -->
      <div style="padding:0 24px 24px;display:flex;gap:12px">
        <button
          style="flex:1;height:40px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
          @click="emit('close')"
        >Cancel</button>
        <button
          :disabled="!selectedDriver || loadingDrivers"
          style="flex:1;height:40px;padding:0 16px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer;box-shadow:0 1px 3px rgba(255,180,0,0.2)"
          :style="!selectedDriver || loadingDrivers ? 'opacity:0.5;cursor:not-allowed' : ''"
          @click="submit"
        >Assign Driver</button>
      </div>

    </div>
  </div>
</template>
