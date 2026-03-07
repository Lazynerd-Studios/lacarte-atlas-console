<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const route = useRoute()

// Mock customer data — replace with API call using route.params.id
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
  plan: 'Subscription',
  planDetail: 'Weekly Pickup - $45/month',
  paymentMethod: 'Auto-pay (Card ending 4242)',
  nextPickup: 'March 8, 2026',
  since: 'Jan 2025',
  status: 'active',
  totalPickups: 42,
  balance: 0,
  lifetimeValue: '$1,890',
}

const initials = computed(() => `${customer.firstName[0]}${customer.lastName[0]}`)

const statusBadge = computed(() => {
  if (customer.status === 'active')   return { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.2)',  color: '#22c55e', label: 'Active' }
  if (customer.status === 'overdue')  return { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.2)',  color: '#ef4444', label: 'Overdue' }
  return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280', label: 'Inactive' }
})

const tabs = ['Overview', 'Pickup History', 'Billing', 'Assigned Bins', 'Notes']
const activeTab = ref('Overview')

const pickupHistory = [
  { date: '2026-03-01', driver: 'John Smith',   zone: 'Downtown', status: 'completed' },
  { date: '2026-02-22', driver: 'Maria Garcia',  zone: 'Downtown', status: 'completed' },
  { date: '2026-02-15', driver: 'John Smith',   zone: 'Downtown', status: 'completed' },
  { date: '2026-02-08', driver: 'James Wilson',  zone: 'Downtown', status: 'completed' },
]

const billingHistory = [
  { date: '2026-03-01', description: 'Monthly Subscription', amount: '$45.00', status: 'paid' },
  { date: '2026-02-01', description: 'Monthly Subscription', amount: '$45.00', status: 'paid' },
  { date: '2026-01-01', description: 'Monthly Subscription', amount: '$45.00', status: 'paid' },
]

const bins = [
  { id: 'BIN-001', type: 'General Waste', size: '240L', assigned: '2025-01-15' },
  { id: 'BIN-002', type: 'Recycling',     size: '120L', assigned: '2025-01-15' },
]

const notes = ref([
  { date: '2026-02-10', author: 'Admin', text: 'Customer requested bin relocation to side entrance.' },
])
const newNote = ref('')

function addNote() {
  if (!newNote.value.trim()) return
  notes.value.unshift({ date: new Date().toISOString().slice(0, 10), author: 'Admin', text: newNote.value.trim() })
  newNote.value = ''
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
          <button style="height:40px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer">
            Edit Customer
          </button>
          <button style="height:40px;padding:0 16px;background:#ef4444;border:none;border-radius:20px;font-size:14px;font-weight:500;color:white;font-family:'Manrope',sans-serif;cursor:pointer">
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
          <p style="font-size:20px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ customer.plan }}</p>
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
                { label: 'Subscription Plan', value: customer.planDetail },
                { label: 'Payment Method',    value: customer.paymentMethod },
                { label: 'Next Pickup',       value: customer.nextPickup },
              ]" :key="row.label" style="display:flex;flex-direction:column;gap:2px">
                <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ row.label }}</p>
                <p style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ row.value }}</p>
              </div>
            </div>
          </div>
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
        </div>

        <!-- Pickup History -->
        <div v-else-if="activeTab === 'Pickup History'">
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:#f8f9fa;border-bottom:1px solid #e5e7eb">
                <th style="padding:12px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Date</th>
                <th style="padding:12px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Driver</th>
                <th style="padding:12px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Zone</th>
                <th style="padding:12px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(p, i) in pickupHistory" :key="i" style="border-bottom:1px solid #e5e7eb">
                <td style="padding:14px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ p.date }}</td>
                <td style="padding:14px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ p.driver }}</td>
                <td style="padding:14px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ p.zone }}</td>
                <td style="padding:14px 16px">
                  <span style="font-size:12px;font-weight:500;color:#22c55e;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.2);border-radius:14px;padding:3px 10px;font-family:'Manrope',sans-serif">{{ p.status }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Billing -->
        <div v-else-if="activeTab === 'Billing'">
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:#f8f9fa;border-bottom:1px solid #e5e7eb">
                <th style="padding:12px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Date</th>
                <th style="padding:12px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Description</th>
                <th style="padding:12px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Amount</th>
                <th style="padding:12px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(b, i) in billingHistory" :key="i" style="border-bottom:1px solid #e5e7eb">
                <td style="padding:14px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ b.date }}</td>
                <td style="padding:14px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ b.description }}</td>
                <td style="padding:14px 16px;font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ b.amount }}</td>
                <td style="padding:14px 16px">
                  <span style="font-size:12px;font-weight:500;color:#22c55e;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.2);border-radius:14px;padding:3px 10px;font-family:'Manrope',sans-serif">{{ b.status }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Assigned Bins -->
        <div v-else-if="activeTab === 'Assigned Bins'">
          <div style="display:flex;flex-direction:column;gap:12px">
            <div v-for="bin in bins" :key="bin.id" style="background:#f8f9fa;border-radius:16px;padding:16px;display:flex;align-items:center;gap:16px">
              <div style="width:40px;height:40px;background:#ffb400;border-radius:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <UIcon name="i-lucide-trash-2" style="width:20px;height:20px;color:white" />
              </div>
              <div style="flex:1">
                <p style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ bin.id }} — {{ bin.type }}</p>
                <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:2px">{{ bin.size }} · Assigned {{ bin.assigned }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div v-else-if="activeTab === 'Notes'" style="display:flex;flex-direction:column;gap:16px">
          <div style="display:flex;gap:8px">
            <input
              v-model="newNote"
              type="text"
              placeholder="Add a note..."
              style="flex:1;height:39px;padding:0 12px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none"
              @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
              @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
              @keyup.enter="addNote"
            />
            <button
              style="height:39px;padding:0 16px;background:#ffb400;border:none;border-radius:16px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer"
              @click="addNote"
            >Add</button>
          </div>
          <div style="display:flex;flex-direction:column;gap:12px">
            <div v-for="(note, i) in notes" :key="i" style="background:#f8f9fa;border-radius:16px;padding:16px">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
                <span style="font-size:12px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ note.author }}</span>
                <span style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">{{ note.date }}</span>
              </div>
              <p style="font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;line-height:1.5">{{ note.text }}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
