<script setup lang="ts">
import type { SupportTicket, SupportTicketStatus, SupportTicketPriority, SupportTicketCategory, TicketStats, TicketListResponse, Pagination } from '~/types/support'

definePageMeta({ layout: 'dashboard' })

const api = useApi()

// ── Filters ──
const search = ref('')
const statusFilter = ref<'all' | SupportTicketStatus>('all')
const priorityFilter = ref<'all' | SupportTicketPriority>('all')
const categoryFilter = ref<'all' | SupportTicketCategory>('all')
const activeTab = ref<'all' | 'open' | 'in-progress' | 'resolved'>('all')

const statusOptions: { label: string; value: 'all' | SupportTicketStatus }[] = [
  { label: 'All Status', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Closed', value: 'closed' },
]

const priorityOptions: { label: string; value: 'all' | SupportTicketPriority }[] = [
  { label: 'All Priorities', value: 'all' },
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'urgent' },
]

const categoryOptions: { label: string; value: 'all' | SupportTicketCategory }[] = [
  { label: 'All Categories', value: 'all' },
  { label: 'Missed Pickup', value: 'missed_pickup' },
  { label: 'Billing', value: 'billing' },
  { label: 'Service Request', value: 'service_request' },
  { label: 'Equipment Issue', value: 'equipment_issue' },
  { label: 'Schedule Change', value: 'schedule_change' },
  { label: 'Other', value: 'other' },
]

// ── Data ──
const tickets = ref<SupportTicket[]>([])
const pagination = ref<Pagination>({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
})
const loading = ref(false)
const initialLoading = ref(true)

// ── Stats ──
const ticketStats = ref<TicketStats>({
  openTickets: 0,
  inProgressTickets: 0,
  resolvedToday: 0,
  avgResponseHours: 0,
})
const statsLoading = ref(false)

// ── Tabs ──
const tabs = computed(() => [
  { key: 'all', label: 'All Tickets', count: pagination.value.total },
  { key: 'open', label: 'Open', count: ticketStats.value.openTickets },
  { key: 'in-progress', label: 'In Progress', count: ticketStats.value.inProgressTickets },
  { key: 'resolved', label: 'Resolved', count: activeTab.value === 'resolved' ? pagination.value.total : undefined },
])

function setTab(key: 'all' | 'open' | 'in-progress' | 'resolved') {
  activeTab.value = key
  statusFilter.value = key === 'all' ? 'all' : key === 'in-progress' ? 'in_progress' : key
  pagination.value.page = 1
  fetchTickets()
}

function isTabActive(key: string) {
  return activeTab.value === key
}

// ── Fetching ──
async function fetchTicketStats() {
  statsLoading.value = true
  const data = await api.get<TicketStats>('/support/admin/tickets/stats', 'Failed to load ticket stats')
  if (data) {
    ticketStats.value = {
      openTickets: data.openTickets ?? 0,
      inProgressTickets: data.inProgressTickets ?? 0,
      resolvedToday: data.resolvedToday ?? 0,
      avgResponseHours: data.avgResponseHours ?? 0,
    }
  }
  statsLoading.value = false
}

async function fetchTickets() {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: pagination.value.page.toString(),
      limit: pagination.value.limit.toString(),
    })

    if (statusFilter.value !== 'all') {
      params.append('status', statusFilter.value)
    }
    if (priorityFilter.value !== 'all') {
      params.append('priority', priorityFilter.value)
    }
    if (categoryFilter.value !== 'all') {
      params.append('category', categoryFilter.value)
    }
    if (search.value.trim()) {
      params.append('search', search.value.trim())
    }

    const data = await api.get<TicketListResponse>(
      `/support/admin/tickets?${params.toString()}`,
      'Failed to load tickets'
    )

    if (data) {
      tickets.value = data.data || []
      if (data.pagination) {
        pagination.value = data.pagination
      }
    }
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  // Keep tab indicator in sync with the status dropdown when it maps to a tab
  if (statusFilter.value === 'all') activeTab.value = 'all'
  else if (statusFilter.value === 'open') activeTab.value = 'open'
  else if (statusFilter.value === 'in_progress') activeTab.value = 'in-progress'
  else if (statusFilter.value === 'resolved') activeTab.value = 'resolved'
  else activeTab.value = 'all'

  pagination.value.page = 1
  fetchTickets()
}

function goToPage(page: number) {
  pagination.value.page = page
  fetchTickets()
}

onMounted(async () => {
  initialLoading.value = true
  await Promise.all([fetchTicketStats(), fetchTickets()])
  initialLoading.value = false
})

// ── Display helpers ──
function formatDate(dateString: string | null): string {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function categoryLabel(category: string): string {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function priorityStyle(p: string) {
  if (p === 'urgent') return { bg: '#fef2f2', color: '#dc2626' }
  if (p === 'high')   return { bg: '#fff7ed', color: '#ea580c' }
  if (p === 'medium') return { bg: '#fff9e6', color: '#ffb400' }
  return                     { bg: '#f9fafb', color: '#6b7280' }
}

function statusStyle(s: string) {
  if (s === 'open')        return { bg: '#e5e7eb',              border: '#e5e7eb',              color: '#6b7280' }
  if (s === 'in_progress') return { bg: 'rgba(255,180,0,0.1)',  border: 'rgba(255,180,0,0.2)',  color: '#d49a00' }
  if (s === 'resolved')    return { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.2)',  color: '#22c55e' }
  return                          { bg: 'white',                border: '#ececec',              color: '#1a1a1a' }
}

function statusLabel(s: string) {
  if (s === 'in_progress') return 'In Progress'
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const chevronBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`

// ── Stats cards ──
const openCount = computed(() => (statsLoading.value ? undefined : ticketStats.value.openTickets))
const inProgressCount = computed(() => (statsLoading.value ? undefined : ticketStats.value.inProgressTickets))
const resolvedTodayCount = computed(() => (statsLoading.value ? undefined : ticketStats.value.resolvedToday))
const avgResponseHours = computed(() => {
  if (statsLoading.value) return undefined
  const hours = ticketStats.value.avgResponseHours
  if (hours === undefined || hours === null || Number.isNaN(hours)) return '—'
  return `${Number(hours).toFixed(1)} hours`
})

// ── Modal ──
const showTicketModal = ref(false)
const selectedTicket = ref<SupportTicket | null>(null)
const showCreateTicketModal = ref(false)

function openTicket(t: SupportTicket) {
  selectedTicket.value = t
  showTicketModal.value = true
}

function handleTicketUpdate(id: string, status: string) {
  const t = tickets.value.find(t => t.id === id)
  if (t) {
    t.status = status as SupportTicketStatus
  }
}

async function handleTicketCreated() {
  showCreateTicketModal.value = false
  await Promise.all([fetchTicketStats(), fetchTickets()])
}
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:21px">

    <!-- Header -->
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap">
      <div style="display:flex;flex-direction:column;gap:6px">
        <h1 style="font-size:32px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;margin:0">Customer Support</h1>
        <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0">Manage customer inquiries and support tickets</p>
      </div>
      <button
        style="height:40px;padding:0 16px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer;display:flex;align-items:center;gap:8px;flex-shrink:0"
        @mouseover="($event.currentTarget as HTMLElement).style.opacity='0.9'"
        @mouseleave="($event.currentTarget as HTMLElement).style.opacity='1'"
        @click="showCreateTicketModal = true"
      >
        <UIcon name="i-lucide-plus" style="width:16px;height:16px;color:#0a0d12" />
        Create Ticket
      </button>
    </div>

    <!-- Stat cards -->
    <div class="grid-cols-4">

      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:1px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <div style="padding:24px">
          <div style="width:40px;height:40px;border-radius:20px;background:#eff6ff;display:flex;align-items:center;justify-content:center;margin-bottom:16px">
            <UIcon name="i-lucide-ticket" style="width:20px;height:20px;color:#3b82f6" />
          </div>
          <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0 0 4px">Open Tickets</p>
          <p style="font-size:24px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;margin:0">{{ statsLoading ? '...' : openCount }}</p>
        </div>
      </div>

      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:1px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <div style="padding:24px">
          <div style="width:40px;height:40px;border-radius:20px;background:#fff9e6;display:flex;align-items:center;justify-content:center;margin-bottom:16px">
            <UIcon name="i-lucide-clock" style="width:20px;height:20px;color:#ffb400" />
          </div>
          <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0 0 4px">In Progress</p>
          <p style="font-size:24px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;margin:0">{{ statsLoading ? '...' : inProgressCount }}</p>
        </div>
      </div>

      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:1px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <div style="padding:24px">
          <div style="width:40px;height:40px;border-radius:20px;background:#f0fdf4;display:flex;align-items:center;justify-content:center;margin-bottom:16px">
            <UIcon name="i-lucide-check-circle" style="width:20px;height:20px;color:#22c55e" />
          </div>
          <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0 0 4px">Resolved Today</p>
          <p style="font-size:24px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;margin:0">{{ statsLoading ? '...' : resolvedTodayCount }}</p>
        </div>
      </div>

      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:1px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <div style="padding:24px">
          <div style="width:40px;height:40px;border-radius:20px;background:#f5f3ff;display:flex;align-items:center;justify-content:center;margin-bottom:16px">
            <UIcon name="i-lucide-timer" style="width:20px;height:20px;color:#8b5cf6" />
          </div>
          <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0 0 4px">Avg Response</p>
          <p style="font-size:24px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;margin:0">{{ statsLoading ? '...' : avgResponseHours }}</p>
        </div>
      </div>

    </div>

    <!-- Search + filter bar -->
    <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
      <div style="display:grid;grid-template-columns:1fr auto auto auto;gap:12px;align-items:center">
        <div style="position:relative">
          <UIcon name="i-lucide-search" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:#6b7280" />
          <input
            v-model="search"
            type="text"
            placeholder="Search tickets by subject, customer, or ticket ID..."
            style="width:100%;height:42px;padding:0 16px 0 40px;background:#f9fafb;border:1px solid #ececec;border-radius:20px;font-size:14px;color:#111;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box"
            @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
            @blur="($event.target as HTMLElement).style.borderColor='#ececec'"
            @keyup.enter="applyFilters"
          />
        </div>
        <select
          v-model="statusFilter"
          :style="`height:42px;padding:0 36px 0 14px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;cursor:pointer;appearance:none;background-image:${chevronBg};background-repeat:no-repeat;background-position:right 12px center;min-width:150px`"
          @change="applyFilters"
        >
          <option v-for="s in statusOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
        </select>
        <select
          v-model="priorityFilter"
          :style="`height:42px;padding:0 36px 0 14px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;cursor:pointer;appearance:none;background-image:${chevronBg};background-repeat:no-repeat;background-position:right 12px center;min-width:150px`"
          @change="applyFilters"
        >
          <option v-for="p in priorityOptions" :key="p.value" :value="p.value">{{ p.label }}</option>
        </select>
        <select
          v-model="categoryFilter"
          :style="`height:42px;padding:0 36px 0 14px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;cursor:pointer;appearance:none;background-image:${chevronBg};background-repeat:no-repeat;background-position:right 12px center;min-width:170px`"
          @change="applyFilters"
        >
          <option v-for="c in categoryOptions" :key="c.value" :value="c.value">{{ c.label }}</option>
        </select>
      </div>
    </div>

    <!-- Tabbed table card -->
    <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:1px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">

      <!-- Tab bar -->
      <div style="padding:24px 24px 0;border-bottom:1px solid #e5e7eb;display:flex;gap:0">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :style="`padding:12px 16px 14px;border:none;background:none;cursor:pointer;font-size:14px;font-weight:500;font-family:'Manrope',sans-serif;white-space:nowrap;border-bottom:2px solid ${isTabActive(tab.key) ? '#ffb400' : 'transparent'};color:${isTabActive(tab.key) ? '#1a1a1a' : '#6b7280'};margin-bottom:-1px`"
          @click="setTab(tab.key as any)"
        >
          {{ tab.label }}
          <span v-if="typeof tab.count === 'number'" style="margin-left:6px;padding:2px 8px;background:#f3f4f6;border-radius:12px;font-size:12px;color:#6b7280">{{ tab.count }}</span>
        </button>
      </div>

      <!-- Table -->
      <div class="table-scroll">
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
            <tr v-if="loading || initialLoading">
              <td colspan="8" style="padding:48px 16px;text-align:center;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Loading tickets...</td>
            </tr>
            <template v-else>
              <tr
                v-for="t in tickets"
                :key="t.id"
                style="border-bottom:1px solid #e5e7eb"
                @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
                @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
              >
                <td style="padding:18px 14px;font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ t.ticketId }}</td>
                <td style="padding:18px 16px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ t.subject }}</td>
                <td style="padding:18px 16px">
                  <div style="display:flex;flex-direction:column;gap:2px">
                    <span style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;white-space:nowrap">{{ t.customer?.name || '—' }}</span>
                    <span style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;white-space:nowrap">{{ t.customer?.email || '—' }}</span>
                  </div>
                </td>
                <td style="padding:18px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ categoryLabel(t.category) }}</td>
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
                <td style="padding:18px 16px;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;white-space:nowrap">{{ formatDate(t.createdAt) }}</td>
                <td style="padding:18px 16px;text-align:right">
                  <button
                    style="height:32px;padding:0 14px;background:#ececec;border:none;border-radius:20px;font-size:13px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer;white-space:nowrap"
                    @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
                    @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
                    @click="openTicket(t)"
                  >View Details</button>
                </td>
              </tr>
              <tr v-if="tickets.length === 0">
                <td colspan="8" style="padding:48px 16px;text-align:center;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">No tickets found</td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="!loading && !initialLoading && tickets.length > 0" style="padding:16px 24px;border-top:1px solid #e5e7eb">
        <AppPagination
          :page="pagination.page"
          :total="pagination.total"
          :per-page="pagination.limit"
          @update:page="goToPage"
        />
      </div>
    </div>

  </div>

  <SupportTicketModal
    v-if="showTicketModal && selectedTicket"
    :ticket="selectedTicket"
    @close="showTicketModal = false"
    @update="handleTicketUpdate"
  />

  <CreateSupportTicketModal
    v-if="showCreateTicketModal"
    @close="showCreateTicketModal = false"
    @created="handleTicketCreated"
  />

</template>
