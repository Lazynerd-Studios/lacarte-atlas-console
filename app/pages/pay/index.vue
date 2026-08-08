<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const api = useApi()
const toast = useAppToast()
const { format } = useCurrency()

const chevronBg = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"12\" height=\"12\" viewBox=\"0 0 12 12\"><path fill=\"%236b7280\" d=\"M2 4l4 4 4-4\"/></svg>')"

// ── Types ────────────────────────────────────────────────────────────────────

interface Payout {
  id: string
  driverId: string
  driverName: string
  periodMonth: string
  paymentSchedule: string
  perTripRate: number
  expectedTripsPerMonth: number
  truckCapacity: number
  minimumFillRate: number
  monthlySalary: number
  monthlyBinTarget: number
  minimumBinThreshold: number
  binsAssigned: number
  binsCompleted: number
  tripsCompleted: number
  performanceDeduction: number
  manualBonuses: number
  manualDeductions: number
  totalPayout: number
  currency: string
  status: 'draft' | 'approved' | 'paid'
  approvedAt: string | null
  paidAt: string | null
  notes: string | null
  earnings: any[]
}

interface PayoutListResponse {
  success: boolean
  data: {
    items: Payout[]
    pagination: { page: number; limit: number; total: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean }
  }
}

interface GenerateResponse {
  success: boolean
  data: { generated: number; skipped: number; errors: string[] }
}

// ── State ────────────────────────────────────────────────────────────────────

const payouts = ref<Payout[]>([])
const loading = ref(false)
const totalItems = ref(0)
const currentPage = ref(1)
const perPage = 20

const statusFilter = ref<string>('')
const searchQuery = ref('')
const generateMonth = ref(new Date().toISOString().slice(0, 7))
const generating = ref(false)

// Modals
const showDetailModal = ref(false)
const selectedPayout = ref<Payout | null>(null)
const showApproveConfirm = ref(false)
const showMarkPaidConfirm = ref(false)
const approvingId = ref<string | null>(null)
const markingPaidId = ref<string | null>(null)

// ── Computed ─────────────────────────────────────────────────────────────────

const filteredPayouts = computed(() => {
  const list = payouts.value || []
  if (statusFilter.value) {
    return list.filter(p => p.status === statusFilter.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    return list.filter(p => p.driverName.toLowerCase().includes(q))
  }
  return list
})

const totalFiltered = computed(() => (filteredPayouts.value || []).length)

const statusBadge = (s: string) => {
  if (s === 'paid')   return { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.2)',  color: '#22c55e', label: 'Paid' }
  if (s === 'approved') return { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', color: '#3b82f6', label: 'Approved' }
  if (s === 'draft')  return { bg: '#e5e7eb', border: '#d1d5db', color: '#6b7280', label: 'Draft' }
  return { bg: '#e5e7eb', border: '#d1d5db', color: '#6b7280', label: s }
}

function formatCurrencyAmount(amount: number, currency = 'GHS') {
  return `${currency} ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(dateString?: string | null): string {
  if (!dateString) return '—'
  try {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return dateString
  }
}

function formatMonth(periodMonth: string): string {
  if (!periodMonth) return '—'
  try {
    const d = new Date(`${periodMonth}-01`)
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
  } catch {
    return periodMonth
  }
}

// ── API calls ────────────────────────────────────────────────────────────────

async function fetchPayouts() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    params.set('page', String(currentPage.value))
    params.set('limit', String(perPage))
    if (statusFilter.value) params.set('status', statusFilter.value)
    const data = await api.get<PayoutListResponse>(`/driver-earning/admin/payouts?${params.toString()}`, 'Failed to load payouts')
    if (data?.data) {
      payouts.value = Array.isArray(data.data.items) ? data.data.items : []
      totalItems.value = data.data.pagination.total ?? 0
    } else {
      payouts.value = []
    }
  } catch {
    console.error('Failed to fetch payouts')
  } finally {
    loading.value = false
  }
}

async function generatePayouts() {
  if (!generateMonth.value) {
    toast.error('Please select a month')
    return
  }
  generating.value = true
  try {
    const result = await api.post<GenerateResponse>(
      '/driver-earning/admin/payouts/generate',
      { periodMonth: generateMonth.value },
      'Failed to generate payouts'
    )
    if (result?.data) {
      const { generated, skipped, errors } = result.data
      if (errors.length > 0) {
        toast.warning(`Generated ${generated}, skipped ${skipped}. Errors: ${errors.slice(0, 3).join('; ')}`)
      } else {
        toast.success(`Generated ${generated} payout(s), skipped ${skipped} existing`)
      }
      await fetchPayouts()
    }
  } catch {
    // error handled by useErrorHandler
  } finally {
    generating.value = false
  }
}

async function approvePayout() {
  if (!approvingId.value) return
  const api = useApi()
  const result = await api.patch<{ success: boolean; data: any }>(
    `/driver-earning/admin/payouts/${approvingId.value}/approve`,
    {},
    'Failed to approve payout'
  )
  if (result?.success) {
    toast.success('Payout approved')
    showApproveConfirm.value = false
    approvingId.value = null
    await fetchPayouts()
    if (selectedPayout.value?.id === approvingId.value) {
      showDetailModal.value = false
    }
  }
}

async function markPayoutPaid() {
  if (!markingPaidId.value) return
  const api = useApi()
  const result = await api.patch<{ success: boolean; data: any }>(
    `/driver-earning/admin/payouts/${markingPaidId.value}/mark-paid`,
    {},
    'Failed to mark payout as paid'
  )
  if (result?.success) {
    toast.success('Payout marked as paid')
    showMarkPaidConfirm.value = false
    markingPaidId.value = null
    await fetchPayouts()
    if (selectedPayout.value?.id === markingPaidId.value) {
      showDetailModal.value = false
    }
  }
}

function openDetail(payout: Payout) {
  selectedPayout.value = payout
  showDetailModal.value = true
}

function canApprove(status: string) {
  return status === 'draft'
}

function canMarkPaid(status: string) {
  return status === 'approved'
}

// ── Lifecycle ────────────────────────────────────────────────────────────────

watch(currentPage, () => { fetchPayouts() })
watch(statusFilter, () => { currentPage.value = 1; fetchPayouts() })

onMounted(() => {
  fetchPayouts()
})
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:24px;font-family:'Manrope',sans-serif">

    <!-- Header -->
    <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px">
      <div>
        <h1 style="font-size:32px;font-weight:700;color:#111;margin:0;line-height:1.3">Driver Payouts</h1>
        <p style="font-size:14px;color:#6b7280;margin:6px 0 0">Generate, review, approve, and mark driver payouts as paid</p>
      </div>
      <button
        :disabled="generating"
        :style="`display:flex;align-items:center;gap:8px;height:40px;padding:0 20px;background:${generating ? '#93c5fd' : '#3b82f6'};border:none;border-radius:20px;font-size:14px;font-weight:500;color:white;font-family:'Manrope',sans-serif;cursor:${generating ? 'not-allowed' : 'pointer'};opacity:${generating ? '0.8' : '1'}`"
        @click="generatePayouts"
      >
        <UIcon :name="generating ? 'i-lucide-loader-2' : 'i-lucide-plus'" :style="`width:16px;height:16px;color:white;${generating ? 'animation:spin 1s linear infinite' : ''}`" />
        {{ generating ? 'Generating...' : 'Generate Payouts' }}
      </button>
    </div>

    <!-- Filters -->
    <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:20px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.1);display:flex;align-items:flex-end;gap:16px;flex-wrap:wrap">
      <div style="display:flex;flex-direction:column;gap:6px">
        <label style="font-size:13px;font-weight:500;color:#6b7280;font-family:'Manrope',sans-serif">Period Month</label>
        <input
          v-model="generateMonth"
          type="month"
          :style="`height:40px;padding:0 12px;background:white;border:1px solid #e5e7eb;border-radius:12px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box`"
          @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
          @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
        />
      </div>
      <div style="display:flex;flex-direction:column;gap:6px">
        <label style="font-size:13px;font-weight:500;color:#6b7280;font-family:'Manrope',sans-serif">Status</label>
        <select
          v-model="statusFilter"
          :style="`height:40px;padding:0 12px;background:white;border:1px solid #e5e7eb;border-radius:12px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;cursor:pointer;appearance:none;background-image:${chevronBg};background-repeat:no-repeat;background-position:right 12px center;min-width:140px;box-sizing:border-box`"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="approved">Approved</option>
          <option value="paid">Paid</option>
        </select>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;flex:1;min-width:200px">
        <label style="font-size:13px;font-weight:500;color:#6b7280;font-family:'Manrope',sans-serif">Search Driver</label>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by driver name..."
          :style="`height:40px;padding:0 12px;background:white;border:1px solid #e5e7eb;border-radius:12px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box`"
          @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
          @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
        />
      </div>
    </div>

    <!-- Table -->
    <div style="background:white;border:1px solid #ececec;border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,0.1);overflow:hidden">
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f8f9fa;border-bottom:1px solid #e5e7eb">
            <th style="padding:14px 16px;text-align:left;font-size:13px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Driver</th>
            <th style="padding:14px 16px;text-align:left;font-size:13px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Period</th>
            <th style="padding:14px 16px;text-align:right;font-size:13px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Total Payout</th>
            <th style="padding:14px 16px;text-align:center;font-size:13px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Status</th>
            <th style="padding:14px 16px;text-align:left;font-size:13px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Approved At</th>
            <th style="padding:14px 16px;text-align:left;font-size:13px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Paid At</th>
            <th style="padding:14px 16px;text-align:right;font-size:13px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading && payouts.length === 0">
            <td colspan="7" style="padding:48px;text-align:center">
              <UIcon name="i-lucide-loader-2" style="width:24px;height:24px;color:#ffb400;animation:spin 1s linear infinite;margin:0 auto 12px;display:block" />
              <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Loading payouts...</p>
            </td>
          </tr>
          <tr
            v-for="p in filteredPayouts"
            :key="p.id"
            :style="`border-bottom:1px solid #e5e7eb;cursor:pointer`"
            @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
          >
            <td style="padding:16px">
              <div style="display:flex;align-items:center;gap:10px">
                <div style="width:36px;height:36px;border-radius:9999px;background:#ffb400;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  <span style="font-size:13px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ p.driverName.split(' ').map(n => n[0]).join('').slice(0, 2) }}</span>
                </div>
                <span style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ p.driverName }}</span>
              </div>
            </td>
            <td style="padding:16px;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;white-space:nowrap">{{ formatMonth(p.periodMonth) }}</td>
            <td style="padding:16px;text-align:right;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ formatCurrencyAmount(p.totalPayout, p.currency) }}</td>
            <td style="padding:16px;text-align:center">
              <span :style="`font-size:12px;font-weight:600;border-radius:20px;padding:3px 12px;white-space:nowrap;color:${statusBadge(p.status).color};background:${statusBadge(p.status).bg};border:1px solid ${statusBadge(p.status).border}`">
                {{ statusBadge(p.status).label }}
              </span>
            </td>
            <td style="padding:16px;font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif;white-space:nowrap">{{ formatDate(p.approvedAt) }}</td>
            <td style="padding:16px;font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif;white-space:nowrap">{{ formatDate(p.paidAt) }}</td>
            <td style="padding:16px;text-align:right;white-space:nowrap">
              <button
                style="height:32px;padding:0 14px;background:#ececec;border:none;border-radius:20px;font-size:13px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer;margin-right:6px"
                @click="openDetail(p)"
                @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
                @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
              >View</button>
              <button
                v-if="canApprove(p.status)"
                :disabled="!!approvingId"
                :style="`height:32px;padding:0 14px;background:${approvingId ? '#93c5fd' : '#3b82f6'};border:none;border-radius:20px;font-size:13px;font-weight:500;color:white;font-family:'Manrope',sans-serif;cursor:${approvingId ? 'not-allowed' : 'pointer'};opacity:${approvingId ? '0.8' : '1'}`"
                @click="approvingId = p.id; showApproveConfirm = true"
              >Approve</button>
              <button
                v-if="canMarkPaid(p.status)"
                :disabled="!!markingPaidId"
                :style="`height:32px;padding:0 14px;background:${markingPaidId ? '#86efac' : '#22c55e'};border:none;border-radius:20px;font-size:13px;font-weight:500;color:white;font-family:'Manrope',sans-serif;cursor:${markingPaidId ? 'not-allowed' : 'pointer'};opacity:${markingPaidId ? '0.8' : '1'}`"
                @click="markingPaidId = p.id; showMarkPaidConfirm = true"
              >Mark Paid</button>
            </td>
          </tr>
          <tr v-if="!loading && filteredPayouts.length === 0">
            <td colspan="7" style="padding:48px;text-align:center;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">No payouts found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="totalFiltered > perPage" style="background:white;border:1px solid #ececec;border-radius:16px;padding:16px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
      <AppPagination
        :page="currentPage"
        :total="totalFiltered"
        :per-page="perPage"
        @update:page="currentPage = $event"
      />
    </div>

    <!-- Detail Modal -->
    <div
      v-if="showDetailModal && selectedPayout"
      style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:50;display:flex;align-items:center;justify-content:center;padding:24px"
      @click.self="showDetailModal = false"
    >
      <div style="background:white;border:1px solid #e5e7eb;border-radius:16px;width:100%;max-width:680px;max-height:90vh;overflow-y:auto;box-shadow:0 10px 15px rgba(0,0,0,0.1);position:relative">
        <button
          style="position:absolute;top:16px;right:16px;width:28px;height:28px;border:none;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:8px;opacity:0.7;z-index:1"
          @click="showDetailModal = false"
          @mouseover="($event.currentTarget as HTMLElement).style.background='#f3f4f6'"
          @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
        >
          <UIcon name="i-lucide-x" style="width:16px;height:16px;color:#111" />
        </button>

        <div style="padding:24px 24px 16px;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between">
          <div>
            <p style="font-size:20px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;margin:0">Payout Details</p>
            <p style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif;margin:4px 0 0">{{ selectedPayout.driverName }} · {{ formatMonth(selectedPayout.periodMonth) }}</p>
          </div>
          <span :style="`font-size:12px;font-weight:600;border-radius:20px;padding:3px 12px;color:${statusBadge(selectedPayout.status).color};background:${statusBadge(selectedPayout.status).bg};border:1px solid ${statusBadge(selectedPayout.status).border}`">
            {{ statusBadge(selectedPayout.status).label }}
          </span>
        </div>

        <div style="padding:24px;display:flex;flex-direction:column;gap:20px">
          <!-- Earnings breakdown -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
            <div style="background:#f8f9fa;border-radius:12px;padding:14px 16px;display:flex;flex-direction:column;gap:4px">
              <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0">Monthly Salary</p>
              <p style="font-size:16px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif;margin:0">{{ formatCurrencyAmount(selectedPayout.monthlySalary, selectedPayout.currency) }}</p>
            </div>
            <div style="background:#f8f9fa;border-radius:12px;padding:14px 16px;display:flex;flex-direction:column;gap:4px">
              <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0">Performance Deduction</p>
              <p :style="`font-size:16px;font-weight:700;font-family:'Manrope',sans-serif;margin:0;color:${selectedPayout.performanceDeduction > 0 ? '#ef4444' : '#1a1a1a'}`">{{ formatCurrencyAmount(selectedPayout.performanceDeduction, selectedPayout.currency) }}</p>
            </div>
            <div style="background:#f8f9fa;border-radius:12px;padding:14px 16px;display:flex;flex-direction:column;gap:4px">
              <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0">Manual Bonuses</p>
              <p :style="`font-size:16px;font-weight:700;font-family:'Manrope',sans-serif;margin:0;color:${selectedPayout.manualBonuses > 0 ? '#22c55e' : '#1a1a1a'}`">{{ formatCurrencyAmount(selectedPayout.manualBonuses, selectedPayout.currency) }}</p>
            </div>
            <div style="background:#f8f9fa;border-radius:12px;padding:14px 16px;display:flex;flex-direction:column;gap:4px">
              <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0">Manual Deductions</p>
              <p :style="`font-size:16px;font-weight:700;font-family:'Manrope',sans-serif;margin:0;color:${selectedPayout.manualDeductions > 0 ? '#ef4444' : '#1a1a1a'}`">{{ formatCurrencyAmount(selectedPayout.manualDeductions, selectedPayout.currency) }}</p>
            </div>
          </div>

          <!-- Bins / trips -->
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px">
            <div style="background:#f8f9fa;border-radius:12px;padding:14px 16px;display:flex;flex-direction:column;gap:4px">
              <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0">Bins Completed</p>
              <p style="font-size:16px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif;margin:0">{{ selectedPayout.binsCompleted }} / {{ selectedPayout.binsAssigned }}</p>
            </div>
            <div style="background:#f8f9fa;border-radius:12px;padding:14px 16px;display:flex;flex-direction:column;gap:4px">
              <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0">Trips Completed</p>
              <p style="font-size:16px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif;margin:0">{{ selectedPayout.tripsCompleted }}</p>
            </div>
            <div style="background:#f8f9fa;border-radius:12px;padding:14px 16px;display:flex;flex-direction:column;gap:4px">
              <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0">Payment Schedule</p>
              <p style="font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;margin:0;text-transform:capitalize">{{ selectedPayout.paymentSchedule }}</p>
            </div>
          </div>

          <!-- Total -->
          <div style="border-top:1px solid #e5e7eb;padding-top:16px;display:flex;align-items:center;justify-content:space-between">
            <span style="font-size:16px;font-weight:600;color:#6b7280;font-family:'Manrope',sans-serif">Total Payout</span>
            <span style="font-size:24px;font-weight:700;color:#111;font-family:'Manrope',sans-serif">{{ formatCurrencyAmount(selectedPayout.totalPayout, selectedPayout.currency) }}</span>
          </div>

          <!-- Notes -->
          <div v-if="selectedPayout.notes" style="background:#f8f9fa;border-radius:12px;padding:14px 16px">
            <p style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0 0 6px;font-weight:500">Notes</p>
            <p style="font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;margin:0;line-height:1.6">{{ selectedPayout.notes }}</p>
          </div>

          <!-- Timestamps -->
          <div style="display:flex;gap:24px;font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif">
            <span>Approved: {{ formatDate(selectedPayout.approvedAt) }}</span>
            <span>Paid: {{ formatDate(selectedPayout.paidAt) }}</span>
          </div>
        </div>

        <!-- Footer actions -->
        <div style="padding:16px 24px;border-top:1px solid #e5e7eb;display:flex;justify-content:flex-end;gap:8px">
          <button
            style="height:40px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
            @click="showDetailModal = false"
          >Close</button>
          <button
            v-if="canApprove(selectedPayout.status)"
            :disabled="!!approvingId"
            :style="`height:40px;padding:0 20px;background:${approvingId ? '#93c5fd' : '#3b82f6'};border:none;border-radius:20px;font-size:14px;font-weight:500;color:white;font-family:'Manrope',sans-serif;cursor:${approvingId ? 'not-allowed' : 'pointer'};opacity:${approvingId ? '0.8' : '1'}`"
            @click="approvingId = selectedPayout.id; showApproveConfirm = true"
          >Approve Payout</button>
          <button
            v-if="canMarkPaid(selectedPayout.status)"
            :disabled="!!markingPaidId"
            :style="`height:40px;padding:0 20px;background:${markingPaidId ? '#86efac' : '#22c55e'};border:none;border-radius:20px;font-size:14px;font-weight:500;color:white;font-family:'Manrope',sans-serif;cursor:${markingPaidId ? 'not-allowed' : 'pointer'};opacity:${markingPaidId ? '0.8' : '1'}`"
            @click="markingPaidId = selectedPayout.id; showMarkPaidConfirm = true"
          >Mark as Paid</button>
        </div>
      </div>
    </div>

    <!-- Approve Confirm -->
    <ConfirmDialog
      v-if="showApproveConfirm"
      title="Approve Payout"
      :message="'Are you sure you want to approve this payout? This will lock the payout amount for the selected period.'"
      confirm-text="Approve"
      confirm-color="#3b82f6"
      :loading="!!approvingId"
      @confirm="approvePayout"
      @cancel="showApproveConfirm = false"
    />

    <!-- Mark Paid Confirm -->
    <ConfirmDialog
      v-if="showMarkPaidConfirm"
      title="Mark Payout as Paid"
      :message="'Confirm that this payout has been paid to the driver. This action cannot be undone.'"
      confirm-text="Mark as Paid"
      confirm-color="#22c55e"
      :loading="!!markingPaidId"
      @confirm="markPayoutPaid"
      @cancel="showMarkPaidConfirm = false"
    />

  </div>
</template>

<style scoped>
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
