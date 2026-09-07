<script setup lang="ts">
import type { PaginatedDataResponse } from '~/types/api'

definePageMeta({ layout: 'dashboard' })

const api = useApi()
const toast = useAppToast()
const { format } = useCurrency()

const chevronBg = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"12\" height=\"12\" viewBox=\"0 0 12 12\"><path fill=\"%236b7280\" d=\"M2 4l4 4 4-4\"/></svg>')"

// ── Types ────────────────────────────────────────────────────────────────────

interface PayoutEarningItem {
  id: string
  amount: number | string
  description?: string | null
  type?: string | null
}

interface Payout {
  id: string
  driverId: string
  driverName: string
  periodMonth: string
  paymentSchedule: string
  monthlySalary: string
  totalPayout: string
  currency: string
  status: 'draft' | 'approved' | 'paid'
  createdAt: string | null
  approvedAt?: string | null
  paidAt?: string | null
  notes?: string | null
  // Optional fields that may or may not be present
  perTripRate?: number
  expectedTripsPerMonth?: number
  truckCapacity?: number
  minimumFillRate?: number
  monthlyBinTarget?: number
  minimumBinThreshold?: number
  binsAssigned?: number
  binsCompleted?: number
  tripsCompleted?: number
  performanceDeduction?: number | string
  manualBonuses?: number | string
  manualDeductions?: number | string
  earnings?: PayoutEarningItem[]
}

interface PayoutListResponse extends PaginatedDataResponse<Payout> {
  success: boolean
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
// debouncedSearch is the committed value sent to the API after the user stops typing
const debouncedSearch = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null
const generateMonth = ref(new Date().toISOString().slice(0, 7))
const generating = ref(false)

// Modals
const showApproveConfirm = ref(false)
const showMarkPaidConfirm = ref(false)
const approvingId = ref<string | null>(null)
const markingPaidId = ref<string | null>(null)
const approving = ref(false)
const markingPaid = ref(false)

// ── Computed ─────────────────────────────────────────────────────────────────

const statusBadge = (s: string) => {
  if (s === 'paid')   return { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.2)',  color: '#22c55e', label: 'Paid' }
  if (s === 'approved') return { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', color: '#3b82f6', label: 'Approved' }
  if (s === 'draft')  return { bg: '#e5e7eb', border: '#d1d5db', color: '#6b7280', label: 'Draft' }
  return { bg: '#e5e7eb', border: '#d1d5db', color: '#6b7280', label: s }
}

function formatCurrencyAmount(amount: number | string, currency = 'GHS') {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return `${currency} 0.00`
  return `${currency} ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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
    // Both status and search are sent to the server simultaneously
    if (statusFilter.value) params.set('status', statusFilter.value)
    if (debouncedSearch.value.trim()) params.set('search', debouncedSearch.value.trim())
    const raw = await api.get<PayoutListResponse>(`/driver-earning/admin/payouts?${params.toString()}`, 'Failed to load payouts')
    if (!raw) {
      payouts.value = []
      totalItems.value = 0
      return
    }
    const items = Array.isArray(raw.data) ? raw.data : []
    const pagination = raw.pagination || {}
    payouts.value = items
    totalItems.value = pagination.total ?? items.length
  } catch (err) {
    console.error('[payouts] fetchPayouts error:', err)
    payouts.value = []
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
  const payoutId = approvingId.value
  approving.value = true
  try {
    const result = await api.patch<{ success: boolean; data: Payout }>(
      `/driver-earning/admin/payouts/${payoutId}/approve`,
      {},
      'Failed to approve payout'
    )
    showApproveConfirm.value = false
    approvingId.value = null
    if (result?.success) {
      toast.success('Payout approved')
      await fetchPayouts()
    }
  } finally {
    approving.value = false
  }
}

async function markPayoutPaid() {
  if (!markingPaidId.value) return
  const payoutId = markingPaidId.value
  markingPaid.value = true
  try {
    const result = await api.patch<{ success: boolean; data: Payout }>(
      `/driver-earning/admin/payouts/${payoutId}/mark-paid`,
      {},
      'Failed to mark payout as paid'
    )
    showMarkPaidConfirm.value = false
    markingPaidId.value = null
    if (result?.success) {
      toast.success('Payout marked as paid')
      await fetchPayouts()
    }
  } finally {
    markingPaid.value = false
  }
}

// Debounce search to avoid API call on every keystroke
function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    debouncedSearch.value = searchQuery.value
    currentPage.value = 1
    fetchPayouts()
  }, 350)
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
          @input="onSearchInput"
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
            <th style="padding:14px 16px;text-align:right;font-size:13px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading && payouts.length === 0">
            <td colspan="5" style="padding:48px;text-align:center">
              <UIcon name="i-lucide-loader-2" style="width:24px;height:24px;color:#ffb400;animation:spin 1s linear infinite;margin:0 auto 12px;display:block" />
              <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Loading payouts...</p>
            </td>
          </tr>
          <tr
            v-for="p in payouts"
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
            <td style="padding:16px;text-align:right;white-space:nowrap">
              <button
                v-if="canApprove(p.status)"
                :disabled="approving"
                :style="`height:32px;padding:0 14px;background:${approving ? '#93c5fd' : '#3b82f6'};border:none;border-radius:20px;font-size:13px;font-weight:500;color:white;font-family:'Manrope',sans-serif;cursor:${approving ? 'not-allowed' : 'pointer'};opacity:${approving ? '0.8' : '1'}`"
                @click="approvingId = p.id; showApproveConfirm = true"
              >Approve</button>
              <button
                v-if="canMarkPaid(p.status)"
                :disabled="markingPaid"
                :style="`height:32px;padding:0 14px;background:${markingPaid ? '#86efac' : '#22c55e'};border:none;border-radius:20px;font-size:13px;font-weight:500;color:white;font-family:'Manrope',sans-serif;cursor:${markingPaid ? 'not-allowed' : 'pointer'};opacity:${markingPaid ? '0.8' : '1'}`"
                @click="markingPaidId = p.id; showMarkPaidConfirm = true"
              >Mark Paid</button>
            </td>
          </tr>
          <tr v-if="!loading && payouts.length === 0">
            <td colspan="5" style="padding:48px;text-align:center;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">No payouts found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="totalItems > perPage" style="background:white;border:1px solid #ececec;border-radius:16px;padding:16px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
      <AppPagination
        :page="currentPage"
        :total="totalItems"
        :per-page="perPage"
        @update:page="currentPage = $event"
      />
    </div>

    <!-- Approve Confirm -->
    <LazyConfirmDialog
      v-if="showApproveConfirm"
      title="Approve Payout"
      :message="'Are you sure you want to approve this payout? This will lock the payout amount for the selected period.'"
      confirm-text="Approve"
      confirm-color="#3b82f6"
      :loading="approving"
      @confirm="approvePayout"
      @cancel="showApproveConfirm = false"
    />

    <!-- Mark Paid Confirm -->
    <LazyConfirmDialog
      v-if="showMarkPaidConfirm"
      title="Mark Payout as Paid"
      :message="'Confirm that this payout has been paid to the driver. This action cannot be undone.'"
      confirm-text="Mark as Paid"
      confirm-color="#22c55e"
      :loading="markingPaid"
      @confirm="markPayoutPaid"
      @cancel="showMarkPaidConfirm = false"
    />

  </div>
</template>
