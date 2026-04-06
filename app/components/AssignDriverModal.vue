<script setup lang="ts">
const props = defineProps<{
  request: {
    id: string; customer: string; address: string
    date: string; timeSlot: string; binType: string
    paymentType: string; paymentDetail: string; notes: string
  }
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', data: { driver: string; scheduledDate: string; scheduledTime: string; priority: string; adminNotes: string }): void
}>()

const form = reactive({
  driver: '',
  scheduledDate: props.request.date,
  scheduledTime: '',
  priority: 'normal',
  adminNotes: '',
})

interface Driver {
  id: string
  name: string
  phoneNumber: string
  status: string
}

const drivers = ref<Driver[]>([])
const loadingDrivers = ref(false)
const api = useApi()

// Fetch available drivers
async function fetchDrivers() {
  loadingDrivers.value = true
  try {
    const data = await api.get<{ data: Driver[] }>(
      '/drivers/admin/',
      'Failed to load drivers'
    )
    
    if (data?.data) {
      // Filter to only show active drivers
      drivers.value = data.data.filter(d => d.status === 'active' || d.status === 'online')
    }
  } catch (err) {
    console.error('Error fetching drivers:', err)
  } finally {
    loadingDrivers.value = false
  }
}

onMounted(() => {
  fetchDrivers()
})

const timeSlots = ['Morning (8AM - 12PM)', 'Afternoon (12PM - 4PM)', 'Evening (4PM - 8PM)']
const priorities = ['low', 'normal', 'high', 'urgent']

const chevronBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`
const selectStyle = `width:100%;height:42px;padding:0 16px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;cursor:pointer;appearance:none;background-image:${chevronBg};background-repeat:no-repeat;background-position:right 12px center;box-sizing:border-box`

function onFocus(e: Event) { (e.target as HTMLElement).style.borderColor = '#ffb400' }
function onBlur(e: Event)  { (e.target as HTMLElement).style.borderColor = '#e5e7eb' }

function submit() { emit('submit', { ...form }) }

const paymentTypeBadge = computed(() => {
  if (props.request.paymentType === 'subscription')
    return { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', color: '#3b82f6', label: 'Subscription' }
  return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280', label: 'One-time' }
})
</script>

<template>
  <div
    style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:50;display:flex;align-items:center;justify-content:center;padding:24px"
    @click.self="emit('close')"
  >
    <div style="background:white;border:1px solid #e5e7eb;border-radius:16px;width:510px;max-height:90vh;overflow-y:auto;box-shadow:0 10px 15px rgba(0,0,0,0.1),0 4px 6px rgba(0,0,0,0.1);position:relative;display:flex;flex-direction:column">

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
        <p style="font-size:20px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Assign Driver to Pickup Request</p>
      </div>

      <!-- Body -->
      <div style="padding:16px 24px;display:flex;flex-direction:column;gap:16px">

        <!-- Request summary card -->
        <div style="background:#f8f9fa;border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:12px">
          <!-- Request ID -->
          <div style="display:flex;flex-direction:column;gap:2px">
            <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Request ID</p>
            <p style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">{{ props.request.id }}</p>
          </div>
          <!-- Customer -->
          <div style="display:flex;flex-direction:column;gap:2px">
            <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Customer</p>
            <p style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">{{ props.request.customer }}</p>
          </div>
          <!-- Address -->
          <div style="display:flex;flex-direction:column;gap:2px">
            <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Pickup Address</p>
            <p style="font-size:14px;color:#111;font-family:'Manrope',sans-serif">{{ props.request.address }}</p>
          </div>
          <!-- Date + Time -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
            <div style="display:flex;flex-direction:column;gap:2px">
              <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Preferred Date</p>
              <p style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">{{ props.request.date }}</p>
            </div>
            <div style="display:flex;flex-direction:column;gap:2px">
              <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Preferred Time</p>
              <p style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">{{ props.request.timeSlot }}</p>
            </div>
          </div>
          <!-- Bin Type + Payment -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
            <div style="display:flex;flex-direction:column;gap:2px">
              <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Bin Type</p>
              <p style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">{{ props.request.binType }}</p>
            </div>
            <div style="display:flex;flex-direction:column;gap:2px">
              <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Payment Type</p>
              <div style="display:flex;align-items:center;gap:8px;margin-top:2px">
                <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 11px;white-space:nowrap;color:${paymentTypeBadge.color};background:${paymentTypeBadge.bg};border:1px solid ${paymentTypeBadge.border}`">
                  {{ paymentTypeBadge.label }}
                </span>
                <span style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">{{ props.request.paymentDetail }}</span>
              </div>
            </div>
          </div>
          <!-- Notes -->
          <div v-if="props.request.notes" style="display:flex;flex-direction:column;gap:2px">
            <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Notes</p>
            <p style="font-size:14px;color:#111;font-family:'Manrope',sans-serif">{{ props.request.notes }}</p>
          </div>
        </div>

        <!-- Select Driver -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">Select Driver</label>
          <select v-model="form.driver" :style="selectStyle" @focus="onFocus" @blur="onBlur" :disabled="loadingDrivers">
            <option value="" disabled>{{ loadingDrivers ? 'Loading drivers...' : 'Select a driver' }}</option>
            <option v-for="d in drivers" :key="d.id" :value="d.id">{{ d.name }} - {{ d.phoneNumber }}</option>
          </select>
        </div>

        <!-- Scheduled Date + Time -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">Scheduled Date</label>
            <input
              v-model="form.scheduledDate"
              type="date"
              style="width:100%;height:39px;padding:0 12px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box"
              @focus="onFocus" @blur="onBlur"
            />
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">Scheduled Time</label>
            <select v-model="form.scheduledTime" :style="selectStyle" @focus="onFocus" @blur="onBlur">
              <option value="" disabled>Select time slot</option>
              <option v-for="t in timeSlots" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
        </div>

        <!-- Priority Level -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">Priority Level</label>
          <select v-model="form.priority" :style="selectStyle" @focus="onFocus" @blur="onBlur">
            <option v-for="p in priorities" :key="p" :value="p" style="text-transform:capitalize">{{ p }}</option>
          </select>
        </div>

        <!-- Admin Notes -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">Admin Notes (Optional)</label>
          <textarea
            v-model="form.adminNotes"
            placeholder="Add any special instructions for the driver..."
            rows="4"
            style="width:100%;padding:8px 12px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;resize:none;box-sizing:border-box;line-height:1.5"
            @focus="onFocus" @blur="onBlur"
          />
        </div>

      </div>

      <!-- Footer -->
      <div style="padding:17px 24px;border-top:1px solid #e5e7eb;display:flex;justify-content:flex-end;gap:8px">
        <button
          style="height:40px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
          @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
          @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
          @click="emit('close')"
        >Cancel</button>
        <button
          style="height:40px;padding:0 16px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer;box-shadow:0 1px 3px rgba(255,180,0,0.2)"
          @mouseover="($event.currentTarget as HTMLElement).style.opacity='0.9'"
          @mouseleave="($event.currentTarget as HTMLElement).style.opacity='1'"
          @click="submit"
        >Assign Driver</button>
      </div>

    </div>
  </div>
</template>
