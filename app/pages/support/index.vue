<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const tickets = ref([
  { id: 'TICK-001', subject: 'Missed Pickup - Urgent',              customer: 'John Doe',       email: 'john.doe@email.com',       category: 'Missed Pickup',    priority: 'urgent',  status: 'open',        created: '2026-03-02 09:30 AM' },
  { id: 'TICK-002', subject: 'Billing Question - Invoice #INV-234', customer: 'Sarah Williams', email: 'sarah.w@email.com',        category: 'Billing',          priority: 'medium',  status: 'in-progress', created: '2026-03-01 02:15 PM' },
  { id: 'TICK-003', subject: 'Request Additional Waste Bin',         customer: 'Michael Brown',  email: 'm.brown@email.com',        category: 'Service Request',  priority: 'low',     status: 'in-progress', created: '2026-02-28 11:00 AM' },
  { id: 'TICK-004', subject: 'Damaged Bin Replacement',              customer: 'Emma Davis',     email: 'emma.davis@email.com',     category: 'Equipment Issue',  priority: 'high',    status: 'resolved',    created: '2026-02-27 04:45 PM' },
  { id: 'TICK-005', subject: 'Change Pickup Schedule',               customer: 'David Wilson',   email: 'd.wilson@email.com',       category: 'Schedule Change',  priority: 'medium',  status: 'closed',      created: '2026-02-25 01:20 PM' },
  { id: 'TICK-006', subject: 'Overcharged on Last Invoice',          customer: 'Ama Owusu',      email: 'ama.owusu@email.com',      category: 'Billing',          priority: 'high',    status: 'open',        created: '2026-03-03 08:10 AM' },
  { id: 'TICK-007', subject: 'Bin Not Collected on Friday',          customer: 'Kwame Mensah',   email: 'kwame.m@email.com',        category: 'Missed Pickup',    priority: 'urgent',  status: 'in-progress', created: '2026-03-04 10:00 AM' },
  { id: 'TICK-008', subject: 'Request for Larger Bin Size',          customer: 'Kofi Asante',    email: 'kofi.a@email.com',         category: 'Service Request',  priority: 'low',     status: 'resolved',    created: '2026-02-20 03:30 PM' },
])

const search = ref('')
const statusFilter = ref('All Status')
const activeTab = ref('All Tickets')

const statuses = ['All Status', 'Open', 'In Progress', 'Resolved', 'Closed']

const tabCounts = computed(() => ({
  all: tickets.value.length,
  open: tickets.value.filter(t => t.status === 'open').length,
  inProgress: tickets.value.filter(t => t.status === 'in-progress').length,
  resolved: tickets.value.filter(t => t.status === 'resolved').length,
}))

const filtered = computed(() => {
  return tickets.value.filter(t => {
    const q = search.value.toLowerCase()
    const matchSearch = !q || t.subject.toLowerCase().includes(q) || t.customer.toLowerCase().includes(q) || t.id.toLowerCase().includes(q)
    const matchStatus = statusFilter.value === 'All Status' || t.status === statusFilter.value.toLowerCase().replace(' ', '-')
    const matchTab =
      activeTab.value === 'All Tickets' ||
      (activeTab.value === 'Open' && t.status === 'open') ||
      (activeTab.value === 'In Progress' && t.status === 'in-progress') ||
      (activeTab.value === 'Resolved' && t.status === 'resolved')
    return matchSearch && matchStatus && matchTab
  })
})

// Stat cards
const openCount = computed(() => tickets.value.filter(t => t.status === 'open').length)
const inProgressCount = computed(() => tickets.value.filter(t => t.status === 'in-progress').length)
const resolvedTodayCount = computed(() => tickets.value.filter(t => t.status === 'resolved').length)

function priorityStyle(p: string) {
  if (p === 'urgent') return { bg: '#fef2f2', color: '#dc2626' }
  if (p === 'high')   return { bg: '#fff7ed', color: '#ea580c' }
  if (p === 'medium') return { bg: '#fff9e6', color: '#ffb400' }
  return                     { bg: '#f9fafb', color: '#6b7280' }
}

function statusStyle(s: string) {
  if (s === 'open')        return { bg: '#e5e7eb',              border: '#e5e7eb',              color: '#6b7280' }
  if (s === 'in-progress') return { bg: 'rgba(255,180,0,0.1)',  border: 'rgba(255,180,0,0.2)',  color: '#d49a00' }
  if (s === 'resolved')    return { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.2)',  color: '#22c55e' }
  return                          { bg: 'white',                border: '#ececec',              color: '#1a1a1a' }
}

function statusLabel(s: string) {
  if (s === 'in-progress') return 'In Progress'
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const chevronBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`

const tabs = computed(() => [
  `All Tickets (${tabCounts.value.all})`,
  `Open (${tabCounts.value.open})`,
  `In Progress (${tabCounts.value.inProgress})`,
  `Resolved (${tabCounts.value.resolved})`,
])

function setTab(label: string) {
  if (label.startsWith('All')) activeTab.value = 'All Tickets'
  else if (label.startsWith('Open')) activeTab.value = 'Open'
  else if (label.startsWith('In')) activeTab.value = 'In Progress'
  else activeTab.value = 'Resolved'
}

function isTabActive(label: string) {
  if (label.startsWith('All')) return activeTab.value === 'All Tickets'
  if (label.startsWith('Open')) return activeTab.value === 'Open'
  if (label.startsWith('In')) return activeTab.value === 'In Progress'
  return activeTab.value === 'Resolved'
}

const showTicketModal = ref(false)
const selectedTicket = ref<typeof tickets.value[0] | null>(null)

function openTicket(t: typeof tickets.value[0]) {
  selectedTicket.value = t
  showTicketModal.value = true
}

function handleTicketUpdate(id: string, status: string) {
  const t = tickets.value.find(t => t.id === id)
  if (t) t.status = status
}
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:21px">

    <!-- Header -->
    <div style="display:flex;flex-direction:column;gap:6px">
      <h1 style="font-size:32px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;margin:0">Customer Support</h1>
      <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0">Manage customer inquiries and support tickets</p>
    </div>

    <!-- Stat cards -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:24px">

      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:1px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <div style="padding:24px">
          <div style="width:40px;height:40px;border-radius:20px;background:#eff6ff;display:flex;align-items:center;justify-content:center;margin-bottom:16px">
            <UIcon name="i-lucide-ticket" style="width:20px;height:20px;color:#3b82f6" />
          </div>
          <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0 0 4px">Open Tickets</p>
          <p style="font-size:24px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;margin:0">{{ openCount }}</p>
        </div>
      </div>

      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:1px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <div style="padding:24px">
          <div style="width:40px;height:40px;border-radius:20px;background:#fff9e6;display:flex;align-items:center;justify-content:center;margin-bottom:16px">
            <UIcon name="i-lucide-clock" style="width:20px;height:20px;color:#ffb400" />
          </div>
          <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0 0 4px">In Progress</p>
          <p style="font-size:24px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;margin:0">{{ inProgressCount }}</p>
        </div>
      </div>

      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:1px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <div style="padding:24px">
          <div style="width:40px;height:40px;border-radius:20px;background:#f0fdf4;display:flex;align-items:center;justify-content:center;margin-bottom:16px">
            <UIcon name="i-lucide-check-circle" style="width:20px;height:20px;color:#22c55e" />
          </div>
          <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0 0 4px">Resolved Today</p>
          <p style="font-size:24px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;margin:0">{{ resolvedTodayCount }}</p>
        </div>
      </div>

      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:1px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <div style="padding:24px">
          <div style="width:40px;height:40px;border-radius:20px;background:#f5f3ff;display:flex;align-items:center;justify-content:center;margin-bottom:16px">
            <UIcon name="i-lucide-timer" style="width:20px;height:20px;color:#8b5cf6" />
          </div>
          <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0 0 4px">Avg Response</p>
          <p style="font-size:24px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;margin:0">2.5 hours</p>
        </div>
      </div>

    </div>

    <!-- Search + filter bar -->
    <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
      <div style="display:grid;grid-template-columns:1fr auto;gap:16px;align-items:center">
        <div style="position:relative">
          <UIcon name="i-lucide-search" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:#6b7280" />
          <input
            v-model="search"
            type="text"
            placeholder="Search tickets by subject, customer, or ticket ID..."
            style="width:100%;height:42px;padding:0 16px 0 40px;background:#f9fafb;border:1px solid #ececec;border-radius:20px;font-size:14px;color:#111;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box"
            @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
            @blur="($event.target as HTMLElement).style.borderColor='#ececec'"
          />
        </div>
        <select
          v-model="statusFilter"
          :style="`height:42px;padding:0 36px 0 14px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;cursor:pointer;appearance:none;background-image:${chevronBg};background-repeat:no-repeat;background-position:right 12px center;min-width:180px`"
        >
          <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>
    </div>

    <!-- Tabbed table card -->
    <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:1px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">

      <!-- Tab bar -->
      <div style="padding:24px 24px 0;border-bottom:1px solid #e5e7eb;display:flex;gap:0">
        <button
          v-for="tab in tabs"
          :key="tab"
          :style="`padding:12px 16px 14px;border:none;background:none;cursor:pointer;font-size:14px;font-weight:500;font-family:'Manrope',sans-serif;white-space:nowrap;border-bottom:2px solid ${isTabActive(tab) ? '#ffb400' : 'transparent'};color:${isTabActive(tab) ? '#1a1a1a' : '#6b7280'};margin-bottom:-1px`"
          @click="setTab(tab)"
        >{{ tab }}</button>
      </div>

      <!-- Table -->
      <div style="overflow:hidden">
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:#f8f9fa;border-bottom:1px solid #e5e7eb">
              <th style="padding:14px 14px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">Ticket ID</th>
              <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Subject</th>
              <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Customer</th>
              <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Category</th>
              <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Priority</th>
              <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Status</th>
              <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Created</th>
              <th style="padding:14px 16px;text-align:right;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="t in filtered"
              :key="t.id"
              style="border-bottom:1px solid #e5e7eb"
              @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
              @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
            >
              <td style="padding:18px 14px;font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ t.id }}</td>
              <td style="padding:18px 16px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ t.subject }}</td>
              <td style="padding:18px 16px">
                <div style="display:flex;flex-direction:column;gap:2px">
                  <span style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;white-space:nowrap">{{ t.customer }}</span>
                  <span style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;white-space:nowrap">{{ t.email }}</span>
                </div>
              </td>
              <td style="padding:18px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ t.category }}</td>
              <td style="padding:18px 16px">
                <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:16px;padding:4px 8px;white-space:nowrap;background:${priorityStyle(t.priority).bg};color:${priorityStyle(t.priority).color}`">
                  {{ t.priority.charAt(0).toUpperCase() + t.priority.slice(1) }}
                </span>
              </td>
              <td style="padding:18px 16px">
                <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 10px;white-space:nowrap;background:${statusStyle(t.status).bg};border:1px solid ${statusStyle(t.status).border};color:${statusStyle(t.status).color}`">
                  {{ statusLabel(t.status) }}
                </span>
              </td>
              <td style="padding:18px 16px;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;white-space:nowrap">{{ t.created }}</td>
              <td style="padding:18px 16px;text-align:right">
                <button
                  style="height:32px;padding:0 14px;background:#ececec;border:none;border-radius:20px;font-size:13px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer;white-space:nowrap"
                  @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
                  @click="openTicket(t)"
                >View Details</button>
              </td>
            </tr>
            <tr v-if="filtered.length === 0">
              <td colspan="8" style="padding:48px 16px;text-align:center;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">No tickets found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>

  <SupportTicketModal
    v-if="showTicketModal && selectedTicket"
    :ticket="selectedTicket"
    @close="showTicketModal = false"
    @update="handleTicketUpdate"
  />

</template>
