<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const { format } = useCurrency()

// Mock customer data — replace with API call using useRoute().params.id
const customer = {
  id: 'CUST-2025-1',
  firstName: 'Sarah',
  lastName: 'Johnson',
  email: 'sarah.j@email.com',
  phone: '(555) 123-4567',
  address: '123 Oak Street, Downtown',
  street: '123 Oak Street',
  city: 'Downtown',
  postalCode: '12345',
  instructions: 'Leave bins at side entrance',
  userType: 'commercial',
  entityName: 'Johnson Enterprises Ltd',
  plan: 'subscription',
  subscriptionInterval: 'monthly',
  subscriptionType: 'prepaid',
  planDetail: 'Weekly Pickup - GHS 45/month',
  nextPickup: 'March 8, 2026',
  since: 'Jan 2025',
  status: 'active',
  totalPickups: 42,
  balance: 0,
  lifetimeValue: 'GHS 1,890',
  pickupRate: 'GHS 45.00 / pickup',
  monthlyRate: 'GHS 45.00 / month',
  gpsLat: 5.6037,
  gpsLng: -0.1870,
  gpsLastUpdated: '2026-03-07 08:42 AM',
  gpsAddress: '123 Oak Street, Downtown, Accra',
}

const initials = computed(() => `${customer.firstName[0]}${customer.lastName[0]}`)

const statusBadge = computed(() => {
  if (customer.status === 'active')   return { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.2)',  color: '#22c55e', label: 'Active' }
  if (customer.status === 'overdue')  return { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.2)',  color: '#ef4444', label: 'Overdue' }
  return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280', label: 'Inactive' }
})

const showSuspendModal = ref(false)
const showEditModal = ref(false)

function handleSuspend(reason: string) {
  // TODO: call API to suspend customer
  console.log('Suspend reason:', reason)
  showSuspendModal.value = false
}

function handleEditCustomer(data: Record<string, unknown>) {
  // TODO: call API to update customer
  console.log('Updated customer:', data)
  showEditModal.value = false
}

function downloadQR() {
  // TODO: generate and download QR code for customer
  console.log('Download QR for', customer.id)
}

const activeTab = ref('Overview')
const tabs = ['Overview', 'Pickup History', 'Billing', 'Assigned Bins', 'GPS Location', 'Notes']

const pickupHistory = [
  { date: '2026-03-01', time: '08:45 AM', driver: 'John Smith',    status: 'completed', amount: 45 },
  { date: '2026-02-22', time: '09:10 AM', driver: 'Maria Garcia',  status: 'completed', amount: 45 },
  { date: '2026-02-15', time: '08:30 AM', driver: 'John Smith',    status: 'completed', amount: 45 },
  { date: '2026-02-08', time: '10:00 AM', driver: 'James Wilson',  status: 'missed',    amount: 0  },
  { date: '2026-02-01', time: '08:55 AM', driver: 'John Smith',    status: 'completed', amount: 45 },
  { date: '2026-01-25', time: '09:20 AM', driver: 'Maria Garcia',  status: 'completed', amount: 45 },
  { date: '2026-01-18', time: '08:40 AM', driver: 'John Smith',    status: 'completed', amount: 45 },
  { date: '2026-01-11', time: '09:05 AM', driver: 'Lisa Anderson', status: 'rescheduled', amount: 0 },
]

const billingHistory = [
  { date: '2026-03-01', invoice: 'INV-2026-001', description: 'Monthly Subscription', amountRaw: 45, status: 'paid' },
  { date: '2026-02-01', invoice: 'INV-2026-002', description: 'Monthly Subscription', amountRaw: 45, status: 'paid' },
  { date: '2026-01-01', invoice: 'INV-2026-003', description: 'Monthly Subscription', amountRaw: 45, status: 'paid' },
  { date: '2025-12-01', invoice: 'INV-2025-012', description: 'Monthly Subscription', amountRaw: 45, status: 'paid' },
  { date: '2025-11-01', invoice: 'INV-2025-011', description: 'Monthly Subscription + Extra Pickup', amountRaw: 65, status: 'paid' },
  { date: '2025-10-01', invoice: 'INV-2025-010', description: 'Monthly Subscription', amountRaw: 45, status: 'paid' },
]

const bins = [
  { type: 'Standard Bin',  size: '120L', assigned: '2025-06-15', status: 'active' },
  { type: 'Recycling Bin', size: '80L',  assigned: '2025-06-15', status: 'active' },
]

const customerNotes = ref([
  { date: '2026-01-15', author: 'Sarah Johnson', text: 'Please ensure the bin is collected before 9am on Saturdays.' },
])
const staffNotes = ref([
  { date: '2026-02-10', author: 'Admin', text: 'Customer requested bin relocation to side entrance.' },
])
const newCustomerNote = ref('')
const newStaffNote = ref('')

function addCustomerNote() {
  if (!newCustomerNote.value.trim()) return
  customerNotes.value.unshift({ date: new Date().toISOString().slice(0, 10), author: `${customer.firstName} ${customer.lastName}`, text: newCustomerNote.value.trim() })
  newCustomerNote.value = ''
}

function addStaffNote() {
  if (!newStaffNote.value.trim()) return
  staffNotes.value.unshift({ date: new Date().toISOString().slice(0, 10), author: 'Admin', text: newStaffNote.value.trim() })
  newStaffNote.value = ''
}
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:21px">

    <!-- Back link -->
    <NuxtLink to="/customers" style="display:inline-flex;align-items:center;gap:8px;text-decoration:none">
      <UIcon name="i-lucide-arrow-left" style="width:16px;height:16px;color:#6b7280" />
      <span style="font-size:16px;color:#6b7280;font-family:'Manrope',sans-serif">Back to Customers</span>
    </NuxtLink>

    <!-- Profile card -->
    <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:10px 25px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
      <div style="display:flex;align-items:center;justify-content:space-between;min-height:87px">
        <!-- Left: avatar + info -->
        <div style="display:flex;align-items:center;gap:16px">
          <div style="width:64px;height:64px;border-radius:9999px;background:#ffb400;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <span style="font-size:24px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ initials }}</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;align-items:center;gap:12px">
              <span style="font-size:24px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">{{ customer.firstName }} {{ customer.lastName }}</span>
              <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;color:${statusBadge.color};background:${statusBadge.bg};border:1px solid ${statusBadge.border};border-radius:14px;padding:3px 11px`">
                {{ statusBadge.label }}
              </span>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:16px">
              <div style="display:flex;align-items:center;gap:8px">
                <UIcon name="i-lucide-phone" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
                <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ customer.phone }}</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <UIcon name="i-lucide-mail" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
                <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ customer.email }}</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <UIcon name="i-lucide-map-pin" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
                <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ customer.address }}</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <UIcon name="i-lucide-calendar" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
                <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Customer since {{ customer.since }}</span>
              </div>
            </div>
          </div>
        </div>
        <!-- Right: actions -->
        <div style="display:flex;gap:8px;flex-shrink:0">
          <button
            style="height:40px;padding:0 16px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer;display:flex;align-items:center;gap:8px"
            @click="downloadQR"
          >
            <UIcon name="i-lucide-qr-code" style="width:16px;height:16px;color:#0a0d12" />
            Download QR
          </button>
          <button
            style="height:40px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
            @click="showEditModal = true"
          >
            Edit Customer
          </button>
          <button style="height:40px;padding:0 16px;background:#ef4444;border:none;border-radius:20px;font-size:14px;font-weight:500;color:white;font-family:'Manrope',sans-serif;cursor:pointer" @click="showSuspendModal = true">
            Suspend Account
          </button>
        </div>
      </div>
    </div>

    <!-- Stat cards -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:24px">
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:1px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <div style="padding:10px 24px 10px">
          <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:8px">Plan Type</p>
          <p style="font-size:20px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">
            {{ customer.plan === 'subscription' ? `Subscription (${customer.subscriptionType.charAt(0).toUpperCase() + customer.subscriptionType.slice(1)})` : 'Pay-as-you-go' }}
          </p>
        </div>
      </div>
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:1px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <div style="padding:10px 24px 10px">
          <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:8px">Total Pickups</p>
          <p style="font-size:20px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ customer.totalPickups }}</p>
        </div>
      </div>
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:1px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <div style="padding:10px 24px 10px">
          <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:8px">Outstanding Balance</p>
          <p :style="`font-size:20px;font-weight:700;font-family:'Manrope',sans-serif;color:${customer.balance > 0 ? '#ef4444' : '#22c55e'}`">
            GHS {{ customer.balance }}
          </p>
        </div>
      </div>
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:1px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <div style="padding:10px 24px 10px">
          <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:8px">Lifetime Value</p>
          <p style="font-size:20px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ customer.lifetimeValue }}</p>
        </div>
      </div>
    </div>

    <!-- Tabbed card -->
    <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:1px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
      <!-- Tab bar -->
      <div style="padding:24px 24px 0;border-bottom:1px solid #e5e7eb;display:flex;gap:0">
        <button
          v-for="tab in tabs"
          :key="tab"
          :style="`padding:12px 16px 14px;border:none;background:none;cursor:pointer;font-size:14px;font-weight:500;font-family:'Manrope',sans-serif;white-space:nowrap;border-bottom:2px solid ${activeTab === tab ? '#ffb400' : 'transparent'};color:${activeTab === tab ? '#1a1a1a' : '#6b7280'};margin-bottom:-1px`"
          @click="activeTab = tab"
        >{{ tab }}</button>
      </div>

      <!-- Tab content -->
      <div style="padding:24px">

        <!-- Overview -->
        <div v-if="activeTab === 'Overview'" style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
          <div style="display:flex;flex-direction:column;gap:16px">
            <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Account Information</p>
            <div style="display:flex;flex-direction:column;gap:12px">
              <div v-for="row in [
                { label: 'Customer ID',       value: customer.id },
                { label: 'Customer Type',     value: customer.userType.charAt(0).toUpperCase() + customer.userType.slice(1) },
                { label: customer.userType !== 'regular' ? 'Entity Name' : 'User Type', value: customer.userType !== 'regular' ? customer.entityName : 'Regular' },
                { label: 'Subscription Plan', value: customer.plan === 'subscription' ? customer.subscriptionInterval.charAt(0).toUpperCase() + customer.subscriptionInterval.slice(1) : 'Pay-as-you-go' },
                { label: 'Next Pickup',       value: customer.nextPickup },
              ]" :key="row.label" style="display:flex;flex-direction:column;gap:2px">
                <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ row.label }}</p>
                <p style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ row.value }}</p>
              </div>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:24px">
            <div style="display:flex;flex-direction:column;gap:16px">
              <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Service Address</p>
              <div style="display:flex;flex-direction:column;gap:12px">
                <div v-for="row in [
                  { label: 'Street Address',       value: customer.street },
                  { label: 'City',                 value: customer.city },
                  { label: 'Postal Code',          value: customer.postalCode },
                  { label: 'Special Instructions', value: customer.instructions },
                ]" :key="row.label" style="display:flex;flex-direction:column;gap:2px">
                  <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ row.label }}</p>
                  <p style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ row.value }}</p>
                </div>
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:16px">
              <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Rates</p>
              <div style="display:flex;flex-direction:column;gap:12px">
                <div v-for="row in [
                  { label: 'Pickup Rate',   value: customer.pickupRate },
                  { label: 'Monthly Rate',  value: customer.monthlyRate },
                ]" :key="row.label" style="display:flex;flex-direction:column;gap:2px">
                  <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ row.label }}</p>
                  <p style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ row.value }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pickup History -->
        <div v-else-if="activeTab === 'Pickup History'" style="display:flex;flex-direction:column;gap:16px">
          <!-- Summary row -->
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
            <div style="background:#f8f9fa;border-radius:16px;padding:16px 20px">
              <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:4px">Total Pickups</p>
              <p style="font-size:20px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ pickupHistory.length }}</p>
            </div>
            <div style="background:#f8f9fa;border-radius:16px;padding:16px 20px">
              <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:4px">Completed</p>
              <p style="font-size:20px;font-weight:700;color:#22c55e;font-family:'Manrope',sans-serif">{{ pickupHistory.filter(p => p.status === 'completed').length }}</p>
            </div>
            <div style="background:#f8f9fa;border-radius:16px;padding:16px 20px">
              <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:4px">Missed / Cancelled</p>
              <p style="font-size:20px;font-weight:700;color:#ef4444;font-family:'Manrope',sans-serif">{{ pickupHistory.filter(p => p.status !== 'completed').length }}</p>
            </div>
          </div>

          <!-- Table -->
          <div style="border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr style="background:#f8f9fa;border-bottom:1px solid #e5e7eb">
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Date</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Driver</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Amount</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(p, i) in pickupHistory"
                  :key="i"
                  style="border-bottom:1px solid #e5e7eb"
                  @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
                >
                  <td style="padding:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">
                    <div style="display:flex;flex-direction:column;gap:2px">
                      <span style="font-weight:500">{{ p.date }}</span>
                      <span style="font-size:12px;color:#6b7280">{{ p.time }}</span>
                    </div>
                  </td>
                  <td style="padding:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ p.driver }}</td>
                  <td style="padding:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ p.amount > 0 ? format(p.amount) : '—' }}</td>
                  <td style="padding:16px">
                    <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 10px;white-space:nowrap;
                      color:${p.status === 'completed' ? '#22c55e' : p.status === 'missed' ? '#ef4444' : '#d49a00'};
                      background:${p.status === 'completed' ? 'rgba(34,197,94,0.1)' : p.status === 'missed' ? 'rgba(239,68,68,0.1)' : 'rgba(255,180,0,0.1)'};
                      border:1px solid ${p.status === 'completed' ? 'rgba(34,197,94,0.2)' : p.status === 'missed' ? 'rgba(239,68,68,0.2)' : 'rgba(255,180,0,0.2)'}`">
                      {{ p.status }}
                    </span>
                  </td>
                </tr>
                <tr v-if="pickupHistory.length === 0">
                  <td colspan="4" style="padding:48px 16px;text-align:center;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">No pickup history found</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Billing -->
        <div v-else-if="activeTab === 'Billing'" style="display:flex;flex-direction:column;gap:16px">
          <!-- Summary row -->
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
            <div style="background:#f8f9fa;border-radius:16px;padding:16px 20px">
              <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:4px">Total Billed</p>
              <p style="font-size:20px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">
                GHS {{ billingHistory.reduce((s, b) => s + b.amountRaw, 0).toLocaleString() }}
              </p>
            </div>
            <div style="background:#f8f9fa;border-radius:16px;padding:16px 20px">
              <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:4px">Paid</p>
              <p style="font-size:20px;font-weight:700;color:#22c55e;font-family:'Manrope',sans-serif">
                GHS {{ billingHistory.filter(b => b.status === 'paid').reduce((s, b) => s + b.amountRaw, 0).toLocaleString() }}
              </p>
            </div>
            <div style="background:#f8f9fa;border-radius:16px;padding:16px 20px">
              <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:4px">Outstanding</p>
              <p style="font-size:20px;font-weight:700;font-family:'Manrope',sans-serif"
                :style="billingHistory.filter(b => b.status !== 'paid').reduce((s, b) => s + b.amountRaw, 0) > 0 ? 'color:#ef4444' : 'color:#22c55e'">
                GHS {{ billingHistory.filter(b => b.status !== 'paid').reduce((s, b) => s + b.amountRaw, 0).toLocaleString() }}
              </p>
            </div>
          </div>

          <!-- Table -->
          <div style="border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr style="background:#f8f9fa;border-bottom:1px solid #e5e7eb">
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Date</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Invoice</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Amount</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Status</th>
                  <th style="padding:14px 16px;text-align:right;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(b, i) in billingHistory"
                  :key="i"
                  style="border-bottom:1px solid #e5e7eb"
                  @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
                >
                  <td style="padding:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ b.date }}</td>
                  <td style="padding:16px;font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ b.invoice }}</td>
                  <td style="padding:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ format(b.amountRaw) }}</td>
                  <td style="padding:16px">
                    <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 10px;white-space:nowrap;
                      color:${b.status === 'paid' ? '#22c55e' : b.status === 'overdue' ? '#ef4444' : '#d49a00'};
                      background:${b.status === 'paid' ? 'rgba(34,197,94,0.1)' : b.status === 'overdue' ? 'rgba(239,68,68,0.1)' : 'rgba(255,180,0,0.1)'};
                      border:1px solid ${b.status === 'paid' ? 'rgba(34,197,94,0.2)' : b.status === 'overdue' ? 'rgba(239,68,68,0.2)' : 'rgba(255,180,0,0.2)'}`">
                      {{ b.status }}
                    </span>
                  </td>
                  <td style="padding:16px;text-align:right">
                    <button
                      style="height:32px;padding:0 12px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer;white-space:nowrap"
                      @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
                      @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
                    >View Invoice</button>
                  </td>
                </tr>
                <tr v-if="billingHistory.length === 0">
                  <td colspan="5" style="padding:48px 16px;text-align:center;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">No billing records found</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Assigned Bins -->
        <div v-else-if="activeTab === 'Assigned Bins'">
          <div style="border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr style="background:#f8f9fa;border-bottom:1px solid #e5e7eb">
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Bin Type</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Size</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Assigned Date</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(bin, i) in bins"
                  :key="i"
                  style="border-bottom:1px solid #e5e7eb"
                  @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
                >
                  <td style="padding:18px 16px;font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ bin.type }}</td>
                  <td style="padding:18px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ bin.size }}</td>
                  <td style="padding:18px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ bin.assigned }}</td>
                  <td style="padding:18px 16px">
                    <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 10px;white-space:nowrap;
                      color:${bin.status === 'active' ? '#22c55e' : '#6b7280'};
                      background:${bin.status === 'active' ? 'rgba(34,197,94,0.1)' : '#e5e7eb'};
                      border:1px solid ${bin.status === 'active' ? 'rgba(34,197,94,0.2)' : '#e5e7eb'}`">
                      {{ bin.status }}
                    </span>
                  </td>
                </tr>
                <tr v-if="bins.length === 0">
                  <td colspan="4" style="padding:48px 16px;text-align:center;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">No bins assigned</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- GPS Location -->
        <div v-else-if="activeTab === 'GPS Location'" style="display:flex;flex-direction:column;gap:20px">
          <!-- Info row -->
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
            <div style="background:#f8f9fa;border-radius:16px;padding:16px 20px">
              <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:4px">Latitude</p>
              <p style="font-size:16px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ customer.gpsLat }}</p>
            </div>
            <div style="background:#f8f9fa;border-radius:16px;padding:16px 20px">
              <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:4px">Longitude</p>
              <p style="font-size:16px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ customer.gpsLng }}</p>
            </div>
            <div style="background:#f8f9fa;border-radius:16px;padding:16px 20px">
              <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:4px">Last Updated</p>
              <p style="font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ customer.gpsLastUpdated }}</p>
            </div>
          </div>

          <!-- Address -->
          <div style="background:#f8f9fa;border-radius:16px;padding:16px 20px;display:flex;align-items:center;gap:12px">
            <UIcon name="i-lucide-map-pin" style="width:18px;height:18px;color:#ffb400;flex-shrink:0" />
            <div>
              <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:2px">Resolved Address</p>
              <p style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ customer.gpsAddress }}</p>
            </div>
          </div>

          <!-- Map placeholder -->
          <div style="border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;height:340px;background:#f0f4f8;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;position:relative">
            <!-- Grid lines to simulate map -->
            <svg style="position:absolute;inset:0;width:100%;height:100%;opacity:0.15" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#6b7280" stroke-width="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
            <!-- Pin -->
            <div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:8px">
              <div style="width:48px;height:48px;border-radius:9999px;background:#ffb400;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(255,180,0,0.4)">
                <UIcon name="i-lucide-map-pin" style="width:24px;height:24px;color:#1a1a1a" />
              </div>
              <div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:8px 16px;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
                <p style="font-size:13px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;text-align:center">{{ customer.firstName }} {{ customer.lastName }}</p>
                <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;text-align:center">{{ customer.gpsLat }}, {{ customer.gpsLng }}</p>
              </div>
            </div>
            <p style="position:absolute;bottom:12px;font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">Map integration — connect to Google Maps or Mapbox</p>
          </div>
        </div>

        <!-- Notes -->
        <div v-else-if="activeTab === 'Notes'" style="display:grid;grid-template-columns:1fr 1fr;gap:24px">

          <!-- Customer Notes -->
          <div style="display:flex;flex-direction:column;gap:16px">
            <p style="font-size:18px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Customer Notes</p>
            <p style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:-8px">Notes submitted by the customer</p>

            <div style="display:flex;flex-direction:column;gap:10px">
              <p v-if="customerNotes.length === 0" style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;text-align:center;padding:24px 0">No customer notes yet</p>
              <div v-for="(note, i) in customerNotes" :key="i" style="background:#f8f9fa;border:1px solid #e5e7eb;border-radius:16px;padding:16px">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
                  <div style="display:flex;align-items:center;gap:8px">
                    <div style="width:28px;height:28px;border-radius:9999px;background:#3b82f6;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                      <span style="font-size:11px;font-weight:700;color:white;font-family:'Manrope',sans-serif">{{ note.author[0] }}</span>
                    </div>
                    <span style="font-size:13px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ note.author }}</span>
                  </div>
                  <span style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">{{ note.date }}</span>
                </div>
                <p style="font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;line-height:1.6;margin-left:36px">{{ note.text }}</p>
              </div>
            </div>

            <!-- Add customer note -->
            <div style="display:flex;flex-direction:column;gap:8px">
              <textarea
                v-model="newCustomerNote"
                placeholder="Add a customer note..."
                rows="3"
                style="width:100%;padding:10px 12px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;resize:none;box-sizing:border-box;line-height:1.5"
                @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
                @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
              />
              <div style="display:flex;justify-content:flex-end">
                <button
                  style="height:36px;padding:0 16px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer"
                  @click="addCustomerNote"
                  @mouseover="($event.currentTarget as HTMLElement).style.opacity='0.9'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.opacity='1'"
                >Add Note</button>
              </div>
            </div>
          </div>

          <!-- Staff Notes -->
          <div style="display:flex;flex-direction:column;gap:16px">
            <p style="font-size:18px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Staff Notes</p>
            <p style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:-8px">Internal notes visible to staff only</p>

            <div style="display:flex;flex-direction:column;gap:10px">
              <p v-if="staffNotes.length === 0" style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;text-align:center;padding:24px 0">No staff notes yet</p>
              <div v-for="(note, i) in staffNotes" :key="i" style="background:#fff9e6;border:1px solid rgba(255,180,0,0.2);border-radius:16px;padding:16px">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
                  <div style="display:flex;align-items:center;gap:8px">
                    <div style="width:28px;height:28px;border-radius:9999px;background:#ffb400;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                      <span style="font-size:11px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ note.author[0] }}</span>
                    </div>
                    <span style="font-size:13px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ note.author }}</span>
                  </div>
                  <span style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">{{ note.date }}</span>
                </div>
                <p style="font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;line-height:1.6;margin-left:36px">{{ note.text }}</p>
              </div>
            </div>

            <!-- Add staff note -->
            <div style="display:flex;flex-direction:column;gap:8px">
              <textarea
                v-model="newStaffNote"
                placeholder="Add a staff note..."
                rows="3"
                style="width:100%;padding:10px 12px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;resize:none;box-sizing:border-box;line-height:1.5"
                @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
                @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
              />
              <div style="display:flex;justify-content:flex-end">
                <button
                  style="height:36px;padding:0 16px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer"
                  @click="addStaffNote"
                  @mouseover="($event.currentTarget as HTMLElement).style.opacity='0.9'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.opacity='1'"
                >Add Note</button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  </div>

  <!-- Suspend Account Modal -->
  <SuspendModal
    v-if="showSuspendModal"
    :customer-name="`${customer.firstName} ${customer.lastName}`"
    @close="showSuspendModal = false"
    @confirm="handleSuspend"
  />

  <!-- Edit Customer Modal -->
  <EditCustomerModal
    v-if="showEditModal"
    :customer="customer"
    @close="showEditModal = false"
    @submit="handleEditCustomer"
  />
</template>
