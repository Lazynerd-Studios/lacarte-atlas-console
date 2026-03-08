<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const { format } = useCurrency()

const pickup = reactive({
  id: route.params.id as string || 'PR-2026-002',
  customer: 'Michael Chen',
  customerPhone: '(555) 234-5678',
  customerEmail: 'michael.chen@email.com',
  address: '456 Maple Ave, Westside, 12346',
  zone: 'Westside',
  date: '2026-03-03',
  timeSlot: 'Afternoon (12PM - 4PM)',
  paymentType: 'one-time',
  paymentStatus: 'paid',
  amount: 25.00,
  status: 'assigned',
  driver: 'Maria Garcia',
  driverPhone: '(555) 987-6543',
  truck: 'T-003',
  notes: 'Please leave bin at the gate.',
  createdAt: '2026-03-01 09:14 AM',
  assignedAt: '2026-03-01 10:32 AM',
  startedAt: '',
  completedAt: '',
})

const statusBadge = computed(() => {
  if (pickup.status === 'pending')    return { bg: 'rgba(255,180,0,0.1)',  border: 'rgba(255,180,0,0.2)',  color: '#d49a00',  label: 'Pending' }
  if (pickup.status === 'assigned')   return { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', color: '#3b82f6',  label: 'Assigned' }
  if (pickup.status === 'in-transit') return { bg: 'rgba(255,180,0,0.1)',  border: 'rgba(255,180,0,0.2)',  color: '#d49a00',  label: 'In Transit' }
  if (pickup.status === 'completed')  return { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.2)',  color: '#22c55e',  label: 'Completed' }
  if (pickup.status === 'cancelled')  return { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.2)',  color: '#ef4444',  label: 'Cancelled' }
  return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280', label: pickup.status }
})

const paymentStatusBadge = computed(() => {
  if (pickup.paymentStatus === 'active-plan') return { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)', color: '#22c55e', label: 'Active Plan' }
  if (pickup.paymentStatus === 'paid')        return { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)', color: '#22c55e', label: 'Paid' }
  return { bg: 'white', border: '#ececec', color: '#1a1a1a', label: 'Unpaid' }
})

const activeTab = ref('Details')
const tabs = ['Details', 'Activity Log']

// Timeline steps
const timeline = computed(() => [
  { label: 'Request Created',  time: pickup.createdAt,   done: !!pickup.createdAt },
  { label: 'Driver Assigned',  time: pickup.assignedAt,  done: !!pickup.assignedAt },
  { label: 'Trip Started',     time: pickup.startedAt,   done: !!pickup.startedAt },
  { label: 'Pickup Completed', time: pickup.completedAt, done: !!pickup.completedAt },
])

const activityLog = ref([
  { time: '2026-03-01 10:32 AM', actor: 'Admin',        action: 'Driver Maria Garcia assigned to pickup' },
  { time: '2026-03-01 09:14 AM', actor: 'System',       action: 'Pickup request created by Michael Chen' },
])

// Actions
const showReassignModal = ref(false)
const showCancelConfirm = ref(false)

function startTrip() {
  pickup.status = 'in-transit'
  pickup.startedAt = new Date().toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  activityLog.value.unshift({ time: pickup.startedAt, actor: 'Admin', action: 'Trip started manually by admin' })
}

function completePickup() {
  pickup.status = 'completed'
  pickup.completedAt = new Date().toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  activityLog.value.unshift({ time: pickup.completedAt, actor: 'Admin', action: 'Pickup marked as completed by admin' })
}

function cancelPickup() {
  pickup.status = 'cancelled'
  showCancelConfirm.value = false
  activityLog.value.unshift({ time: new Date().toLocaleString(), actor: 'Admin', action: 'Pickup cancelled by admin' })
}

function handleReassign(data: { driver: string }) {
  pickup.driver = data.driver
  pickup.status = 'assigned'
  pickup.assignedAt = new Date().toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  activityLog.value.unshift({ time: pickup.assignedAt, actor: 'Admin', action: `Pickup reassigned to ${data.driver}` })
  showReassignModal.value = false
}
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:21px">

    <!-- Back -->
    <NuxtLink to="/pickups" style="display:inline-flex;align-items:center;gap:8px;text-decoration:none">
      <UIcon name="i-lucide-arrow-left" style="width:16px;height:16px;color:#6b7280" />
      <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Back to Pickups</span>
    </NuxtLink>

    <!-- Header card -->
    <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:10px 25px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
      <div style="display:flex;align-items:center;justify-content:space-between;min-height:87px">
        <div style="display:flex;align-items:center;gap:16px">
          <div style="width:64px;height:64px;border-radius:16px;background:#ffb400;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <UIcon name="i-lucide-package" style="width:32px;height:32px;color:#1a1a1a" />
          </div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;align-items:center;gap:12px">
              <span style="font-size:24px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">{{ pickup.id }}</span>
              <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;color:${statusBadge.color};background:${statusBadge.bg};border:1px solid ${statusBadge.border};border-radius:14px;padding:3px 11px`">
                {{ statusBadge.label }}
              </span>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:16px">
              <div style="display:flex;align-items:center;gap:8px">
                <UIcon name="i-lucide-user" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
                <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ pickup.customer }}</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <UIcon name="i-lucide-map-pin" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
                <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ pickup.zone }}</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <UIcon name="i-lucide-calendar" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
                <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ pickup.date }} · {{ pickup.timeSlot }}</span>
              </div>
              <div v-if="pickup.driver" style="display:flex;align-items:center;gap:8px">
                <UIcon name="i-lucide-truck" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
                <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ pickup.driver }} · {{ pickup.truck }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div style="display:flex;gap:8px;flex-shrink:0;flex-wrap:wrap;justify-content:flex-end">
          <!-- Start Trip — shown when assigned -->
          <button
            v-if="pickup.status === 'assigned'"
            style="height:40px;padding:0 16px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer;box-shadow:0 1px 3px rgba(255,180,0,0.2)"
            @mouseover="($event.currentTarget as HTMLElement).style.opacity='0.9'"
            @mouseleave="($event.currentTarget as HTMLElement).style.opacity='1'"
            @click="startTrip"
          >Start Trip</button>

          <!-- Complete — shown when in-transit -->
          <button
            v-if="pickup.status === 'in-transit'"
            style="height:40px;padding:0 16px;background:#22c55e;border:none;border-radius:20px;font-size:14px;font-weight:500;color:white;font-family:'Manrope',sans-serif;cursor:pointer"
            @mouseover="($event.currentTarget as HTMLElement).style.opacity='0.9'"
            @mouseleave="($event.currentTarget as HTMLElement).style.opacity='1'"
            @click="completePickup"
          >Mark Completed</button>

          <!-- Track Driver — shown when in-transit or assigned -->
          <button
            v-if="pickup.status === 'assigned' || pickup.status === 'in-transit'"
            style="height:40px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
            @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
          >Track Driver</button>

          <!-- Reassign — shown when pending/assigned/in-transit -->
          <button
            v-if="['pending','assigned','in-transit'].includes(pickup.status)"
            style="height:40px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
            @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
            @click="showReassignModal = true"
          >{{ pickup.status === 'pending' ? 'Assign Driver' : 'Reassign' }}</button>

          <!-- Cancel — shown when not completed/cancelled -->
          <button
            v-if="!['completed','cancelled'].includes(pickup.status)"
            style="height:40px;padding:0 16px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:20px;font-size:14px;font-weight:500;color:#ef4444;font-family:'Manrope',sans-serif;cursor:pointer"
            @mouseover="($event.currentTarget as HTMLElement).style.background='rgba(239,68,68,0.18)'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background='rgba(239,68,68,0.1)'"
            @click="showCancelConfirm = true"
          >Cancel</button>
        </div>
      </div>
    </div>

    <!-- Stat cards -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:24px">
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:10px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:8px">Payment Type</p>
        <p style="font-size:18px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ pickup.paymentType === 'subscription' ? 'Subscription' : 'Pay as you go' }}</p>
      </div>
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:10px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:8px">Amount</p>
        <p style="font-size:18px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ pickup.paymentType === 'subscription' ? '—' : format(pickup.amount) }}</p>
      </div>
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:10px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:8px">Payment Status</p>
        <span :style="`font-size:13px;font-weight:600;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 10px;color:${paymentStatusBadge.color};background:${paymentStatusBadge.bg};border:1px solid ${paymentStatusBadge.border}`">
          {{ paymentStatusBadge.label }}
        </span>
      </div>
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:10px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:8px">Created</p>
        <p style="font-size:15px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ pickup.createdAt }}</p>
      </div>
    </div>

    <!-- Tabbed card -->
    <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:1px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
      <div style="padding:24px 24px 0;border-bottom:1px solid #e5e7eb;display:flex;gap:0">
        <button
          v-for="tab in tabs"
          :key="tab"
          :style="`padding:12px 16px 14px;border:none;background:none;cursor:pointer;font-size:14px;font-weight:500;font-family:'Manrope',sans-serif;white-space:nowrap;border-bottom:2px solid ${activeTab === tab ? '#ffb400' : 'transparent'};color:${activeTab === tab ? '#1a1a1a' : '#6b7280'};margin-bottom:-1px`"
          @click="activeTab = tab"
        >{{ tab }}</button>
      </div>

      <div style="padding:24px">

        <!-- Details tab -->
        <div v-if="activeTab === 'Details'" style="display:grid;grid-template-columns:1fr 1fr;gap:32px">

          <!-- Pickup Info -->
          <div style="display:flex;flex-direction:column;gap:16px">
            <p style="font-size:18px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Pickup Information</p>
            <div style="display:flex;flex-direction:column;gap:12px">
              <div v-for="item in [
                { label: 'Request ID',  value: pickup.id },
                { label: 'Address',     value: pickup.address },
                { label: 'Zone',        value: pickup.zone },
                { label: 'Date',        value: pickup.date },
                { label: 'Time Slot',   value: pickup.timeSlot },
                { label: 'Notes',       value: pickup.notes || '—' },
              ]" :key="item.label" style="display:flex;flex-direction:column;gap:2px">
                <p style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif">{{ item.label }}</p>
                <p style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ item.value }}</p>
              </div>
            </div>
          </div>

          <!-- Right column: Customer + Driver -->
          <div style="display:flex;flex-direction:column;gap:24px">

            <!-- Customer -->
            <div style="display:flex;flex-direction:column;gap:16px">
              <p style="font-size:18px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Customer</p>
              <div style="display:flex;flex-direction:column;gap:12px">
                <div v-for="item in [
                  { label: 'Name',  value: pickup.customer },
                  { label: 'Phone', value: pickup.customerPhone },
                  { label: 'Email', value: pickup.customerEmail },
                ]" :key="item.label" style="display:flex;flex-direction:column;gap:2px">
                  <p style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif">{{ item.label }}</p>
                  <p style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ item.value }}</p>
                </div>
              </div>
            </div>

            <!-- Driver -->
            <div style="display:flex;flex-direction:column;gap:16px">
              <p style="font-size:18px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Assigned Driver</p>
              <div v-if="pickup.driver" style="display:flex;flex-direction:column;gap:12px">
                <div v-for="item in [
                  { label: 'Name',  value: pickup.driver },
                  { label: 'Phone', value: pickup.driverPhone },
                  { label: 'Truck', value: pickup.truck },
                ]" :key="item.label" style="display:flex;flex-direction:column;gap:2px">
                  <p style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif">{{ item.label }}</p>
                  <p style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ item.value }}</p>
                </div>
              </div>
              <p v-else style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">No driver assigned yet.</p>
            </div>

          </div>
        </div>

        <!-- Activity Log tab -->
        <div v-else-if="activeTab === 'Activity Log'" style="display:flex;flex-direction:column;gap:24px">

          <!-- Progress timeline -->
          <div style="display:flex;align-items:flex-start;gap:0">
            <template v-for="(step, i) in timeline" :key="step.label">
              <div style="display:flex;flex-direction:column;align-items:center;flex:1;min-width:0">
                <div :style="`width:32px;height:32px;border-radius:9999px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:2px solid ${step.done ? '#ffb400' : '#e5e7eb'};background:${step.done ? '#ffb400' : 'white'}`">
                  <UIcon v-if="step.done" name="i-lucide-check" style="width:16px;height:16px;color:#1a1a1a" />
                  <div v-else style="width:8px;height:8px;border-radius:9999px;background:#e5e7eb" />
                </div>
                <p style="font-size:12px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif;margin-top:8px;text-align:center">{{ step.label }}</p>
                <p style="font-size:11px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:2px;text-align:center">{{ step.time || '—' }}</p>
              </div>
              <div v-if="i < timeline.length - 1" :style="`flex:1;height:2px;margin-top:15px;background:${step.done ? '#ffb400' : '#e5e7eb'}`" />
            </template>
          </div>

          <!-- Log entries -->
          <div style="border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr style="background:#f8f9fa;border-bottom:1px solid #e5e7eb">
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">Time</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Actor</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(entry, i) in activityLog"
                  :key="i"
                  :style="`border-bottom:${i < activityLog.length - 1 ? '1px solid #e5e7eb' : 'none'}`"
                  @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
                >
                  <td style="padding:16px 16px;font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif;white-space:nowrap">{{ entry.time }}</td>
                  <td style="padding:16px 16px;font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ entry.actor }}</td>
                  <td style="padding:16px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ entry.action }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>

  </div>

  <!-- Reassign modal (reuse AssignDriverModal) -->
  <AssignDriverModal
    v-if="showReassignModal"
    :request="{
      id: pickup.id,
      customer: pickup.customer,
      address: pickup.address,
      date: pickup.date,
      timeSlot: pickup.timeSlot,
      binType: '120L General Waste',
      paymentType: pickup.paymentType,
      paymentDetail: pickup.paymentType === 'subscription' ? 'Subscription' : format(pickup.amount),
      notes: pickup.notes,
    }"
    @close="showReassignModal = false"
    @submit="handleReassign"
  />

  <!-- Cancel confirm -->
  <div
    v-if="showCancelConfirm"
    style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:50;display:flex;align-items:center;justify-content:center;padding:24px"
    @click.self="showCancelConfirm = false"
  >
    <div style="background:white;border-radius:16px;width:420px;padding:32px;display:flex;flex-direction:column;gap:20px;box-shadow:0 10px 15px rgba(0,0,0,0.1)">
      <div style="display:flex;flex-direction:column;gap:8px">
        <p style="font-size:20px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Cancel Pickup</p>
        <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Are you sure you want to cancel <span style="font-weight:600;color:#1a1a1a">{{ pickup.id }}</span>? This action cannot be undone.</p>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button
          style="height:40px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
          @click="showCancelConfirm = false"
          @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
          @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
        >Keep Pickup</button>
        <button
          style="height:40px;padding:0 20px;background:#ef4444;border:none;border-radius:20px;font-size:14px;font-weight:500;color:white;font-family:'Manrope',sans-serif;cursor:pointer"
          @click="cancelPickup"
          @mouseover="($event.currentTarget as HTMLElement).style.opacity='0.9'"
          @mouseleave="($event.currentTarget as HTMLElement).style.opacity='1'"
        >Yes, Cancel</button>
      </div>
    </div>
  </div>

</template>
