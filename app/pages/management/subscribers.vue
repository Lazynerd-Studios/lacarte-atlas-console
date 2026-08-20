<script setup lang="ts">
import type { PaginatedDataResponse, PaginationMeta } from '~/types/api'
import type {
  AdminSubscriptionListItem,
  AdminSubscriptionDetail,
  AdminSubscriptionStatus,
} from '~/types/subscription'

definePageMeta({ layout: 'dashboard' })

const api = useApi()
const toast = useAppToast()
const { format } = useCurrency()

// ── List state ───────────────────────────────────────────────────────────────

const subscribers = ref<AdminSubscriptionListItem[]>([])
const pagination = ref<PaginationMeta>({
  page: 1, limit: 20, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false,
})
const loading = ref(false)
const initialLoading = ref(true)

const statusFilter = ref('')
const paymentTypeFilter = ref('')
const pricingSourceFilter = ref('')
const searchQuery = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null

async function fetchSubscribers() {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: pagination.value.page.toString(),
      limit: pagination.value.limit.toString(),
    })
    if (statusFilter.value) params.append('status', statusFilter.value)
    if (paymentTypeFilter.value) params.append('paymentType', paymentTypeFilter.value)
    if (pricingSourceFilter.value) params.append('pricingSource', pricingSourceFilter.value)
    if (searchQuery.value.trim()) params.append('search', searchQuery.value.trim())

    const data = await api.get<PaginatedDataResponse<AdminSubscriptionListItem>>(
      `/subscription/admin/subscriptions?${params.toString()}`,
      'Failed to load subscribers'
    )
    if (data) {
      subscribers.value = data.data ?? []
      if (data.pagination) pagination.value = data.pagination
    }
  } finally {
    loading.value = false
    initialLoading.value = false
  }
}

function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    pagination.value.page = 1
    fetchSubscribers()
  }, 350)
}

watch([statusFilter, paymentTypeFilter, pricingSourceFilter], () => {
  pagination.value.page = 1
  fetchSubscribers()
})

const currentPage = computed({
  get: () => pagination.value.page,
  set: (val) => { pagination.value.page = val; fetchSubscribers() },
})

// ── Display helpers ──────────────────────────────────────────────────────────

function statusBadge(s: AdminSubscriptionStatus | string) {
  if (s === 'active')    return { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.2)',  color: '#22c55e', label: 'Active' }
  if (s === 'pending')   return { bg: 'rgba(255,180,0,0.1)',  border: 'rgba(255,180,0,0.2)',  color: '#d49a00', label: 'Pending' }
  if (s === 'past_due')  return { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.2)',  color: '#ef4444', label: 'Past Due' }
  if (s === 'suspended') return { bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)', color: '#8b5cf6', label: 'Suspended' }
  if (s === 'cancelled') return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280', label: 'Cancelled' }
  if (s === 'expired')   return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280', label: 'Expired' }
  return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280', label: String(s) }
}

function paymentBadge(s: string) {
  if (s === 'paid')    return { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)', color: '#22c55e', label: 'Paid' }
  if (s === 'pending') return { bg: 'rgba(255,180,0,0.1)', border: 'rgba(255,180,0,0.2)', color: '#d49a00', label: 'Pending' }
  if (s === 'failed')  return { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', color: '#ef4444', label: 'Failed' }
  return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280', label: s }
}

/** Plan name for plan-based subs; frequency + amount for calculated subs */
function pricingLabel(sub: AdminSubscriptionListItem) {
  if (sub.pricingSource === 'plan' && sub.plan) return sub.plan.name
  const freq = sub.frequency === 'biweekly' ? 'biweekly' : sub.frequency ?? ''
  const amount = sub.amountPerCycle != null ? format(sub.amountPerCycle) : '—'
  return `${freq ? freq.charAt(0).toUpperCase() + freq.slice(1) : 'Calculated'} · ${amount}`
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return '—'
  }
}

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return '—'
  }
}

// ── State-machine actions ────────────────────────────────────────────────────
// active     → Cancel, Suspend
// pending    → Cancel
// past_due   → Suspend, Waive (if balance > 0)
// suspended  → Reactivate, Waive (if balance > 0)
// cancelled / expired → Waive (if balance > 0 — exit debt), otherwise terminal

function canCancel(sub: AdminSubscriptionListItem) {
  return sub.status === 'active' || sub.status === 'pending'
}
function canSuspend(sub: AdminSubscriptionListItem) {
  return sub.status === 'active' || sub.status === 'past_due'
}
function canReactivate(sub: AdminSubscriptionListItem) {
  return sub.status === 'suspended'
}
function canWaive(sub: AdminSubscriptionListItem) {
  const waivable = sub.status === 'past_due' || sub.status === 'suspended'
    || sub.status === 'cancelled' || sub.status === 'expired'
  return waivable && sub.outstandingBalance > 0
}
/** Exit debt: balance carried by a terminal (cancelled/expired) subscription */
function hasExitDebt(sub: AdminSubscriptionListItem) {
  return (sub.status === 'cancelled' || sub.status === 'expired') && sub.outstandingBalance > 0
}

const actingId = ref<string | null>(null)

type LifecycleAction = 'cancel' | 'suspend' | 'reactivate'

const confirmState = ref<{ sub: AdminSubscriptionListItem; action: LifecycleAction } | null>(null)

function confirmCopy(action: LifecycleAction, sub: AdminSubscriptionListItem) {
  const who = sub.customerName || sub.customerPhone
  if (action === 'cancel') {
    // Postpaid subs with unbilled usage settle it into exit debt at cancellation
    const exitNote = sub.paymentPlan === 'postpaid'
      ? ' Any unbilled usage (over-quota pickups, emergency fees) will be settled as exit debt, invoiced, and collected from the customer via MoMo.'
      : ''
    return {
      title: 'Cancel Subscription',
      message: `Cancel the subscription for ${who}? Any pending payment (including an in-flight MoMo prompt) will be failed and can no longer be collected.${exitNote}`,
      text: 'Cancel Subscription',
      color: '#ef4444',
    }
  }
  if (action === 'suspend') {
    return {
      title: 'Suspend Subscription',
      message: `Suspend the subscription for ${who}? The customer will be notified with the amount due.`,
      text: 'Suspend',
      color: '#8b5cf6',
    }
  }
  return {
    title: 'Reactivate Subscription',
    message: `Reactivate the suspended subscription for ${who}? The outstanding balance must be zero.`,
    text: 'Reactivate',
    color: '#22c55e',
  }
}

function openConfirm(sub: AdminSubscriptionListItem, action: LifecycleAction) {
  confirmState.value = { sub, action }
}

async function runLifecycleAction() {
  if (!confirmState.value) return
  const { sub, action } = confirmState.value
  actingId.value = sub.id
  try {
    if (action === 'reactivate') {
      // Custom handling: a 402 means the outstanding balance must be cleared first
      try {
        await api.request<{ success: boolean; message?: string }>(
          `/subscription/admin/subscriptions/${sub.id}/reactivate`,
          { method: 'POST', body: JSON.stringify({}) }
        )
        toast.success('Subscription reactivated')
        confirmState.value = null
        await fetchSubscribers()
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err ?? '')
        if (sub.outstandingBalance > 0) {
          toast.warning(
            'Outstanding balance due',
            `Cannot reactivate while a balance of ${format(sub.outstandingBalance)} is outstanding. Waive the balance (or have the customer pay it) and try again.`
          )
        } else {
          toast.error('Failed to reactivate subscription', message)
        }
      }
    } else {
      const result = await api.post<{ success: boolean; message?: string }>(
        `/subscription/admin/subscriptions/${sub.id}/${action}`,
        {},
        action === 'cancel' ? 'Failed to cancel subscription' : 'Failed to suspend subscription'
      )
      if (result) {
        toast.success(result.message || (action === 'cancel' ? 'Subscription cancelled' : 'Subscription suspended'))
        confirmState.value = null
        await fetchSubscribers()
      }
    }
  } finally {
    actingId.value = null
  }
}

// ── Waive balance ────────────────────────────────────────────────────────────

const waiveTarget = ref<AdminSubscriptionListItem | null>(null)
const waiveReason = ref('')
const waiving = ref(false)

function openWaive(sub: AdminSubscriptionListItem) {
  waiveTarget.value = sub
  waiveReason.value = ''
}

async function submitWaive() {
  if (!waiveTarget.value) return
  if (waiveReason.value.length > 500) return
  waiving.value = true
  const body: Record<string, unknown> = {}
  if (waiveReason.value.trim()) body.reason = waiveReason.value.trim()

  const result = await api.post<{ success: boolean; message?: string }>(
    `/subscription/admin/subscriptions/${waiveTarget.value.id}/waive-balance`,
    body,
    'Failed to waive balance'
  )
  waiving.value = false
  if (result) {
    toast.success(result.message || 'Balance waived')
    waiveTarget.value = null
    await fetchSubscribers()
  }
}

// ── Detail modal (payment history) ───────────────────────────────────────────

const detailTarget = ref<AdminSubscriptionListItem | null>(null)
const detail = ref<AdminSubscriptionDetail | null>(null)
const detailLoading = ref(false)

async function openDetail(sub: AdminSubscriptionListItem) {
  detailTarget.value = sub
  detail.value = null
  detailLoading.value = true
  const data = await api.get<AdminSubscriptionDetail>(
    `/subscription/admin/subscriptions/${sub.id}`,
    'Failed to load subscription details'
  )
  if (data) detail.value = data
  detailLoading.value = false
}

function closeDetail() {
  detailTarget.value = null
  detail.value = null
}

/**
 * A paid payment on a cancelled/expired subscription needs attention: it either
 * settled outstanding exit debt (debt_settled) or — if there was no debt — is
 * flagged for refund review. The two can't be distinguished client-side.
 */
function needsPaymentReview(paymentStatus: string) {
  if (!detail.value) return false
  return paymentStatus === 'paid' && (detail.value.status === 'cancelled' || detail.value.status === 'expired')
}

onMounted(fetchSubscribers)

const chevronBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`
const selectStyle = `height:38px;padding:0 32px 0 12px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:13px;font-family:'Manrope',sans-serif;outline:none;appearance:none;background-color:white;background-image:${chevronBg};background-repeat:no-repeat;background-position:right 12px center;cursor:pointer;box-sizing:border-box;color:#1a1a1a`
</script>

<template>
  <PageSkeleton v-if="initialLoading" type="table" />

  <div v-else style="display:flex;flex-direction:column;gap:24px;font-family:'Manrope',sans-serif">

    <!-- Header -->
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap">
      <div>
        <h1 style="font-size:32px;font-weight:700;color:#111;margin:0;line-height:1.3">Subscriptions List</h1>
        <p style="font-size:14px;color:#6b7280;margin:6px 0 0">Manage customer subscriptions — plan-based and calculated</p>
      </div>
    </div>

    <!-- Filters -->
    <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:16px 20px;box-shadow:0 1px 3px rgba(0,0,0,0.1);display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <div style="position:relative">
        <UIcon name="i-lucide-search" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);width:15px;height:15px;color:#9ca3af;pointer-events:none" />
        <input
          v-model="searchQuery"
          placeholder="Search name or phone..."
          style="width:220px;height:38px;padding:0 14px 0 36px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:13px;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box"
          @input="onSearchInput"
        />
      </div>

      <select v-model="statusFilter" :style="selectStyle">
        <option value="">All Statuses</option>
        <option value="active">Active</option>
        <option value="pending">Pending</option>
        <option value="past_due">Past Due</option>
        <option value="suspended">Suspended</option>
        <option value="cancelled">Cancelled</option>
        <option value="expired">Expired</option>
      </select>

      <select v-model="paymentTypeFilter" :style="selectStyle">
        <option value="">All Payment Types</option>
        <option value="prepaid">Prepaid</option>
        <option value="postpaid">Postpaid</option>
      </select>

      <select v-model="pricingSourceFilter" :style="selectStyle">
        <option value="">All Pricing</option>
        <option value="plan">Plan</option>
        <option value="calculated">Calculated</option>
      </select>

      <span style="margin-left:auto;font-size:13px;color:#9ca3af">{{ pagination.total }} subscription{{ pagination.total !== 1 ? 's' : '' }}</span>
    </div>

    <!-- Table -->
    <div class="table-scroll" style="background:white;border:1px solid #ececec;border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
      <table style="width:100%;border-collapse:collapse;min-width:900px">
        <thead>
          <tr style="background:#f8f9fa;border-bottom:1px solid #e5e7eb">
            <th style="padding:14px 16px;text-align:left;font-size:13px;font-weight:600;color:#1a1a1a;white-space:nowrap">Customer</th>
            <th style="padding:14px 16px;text-align:left;font-size:13px;font-weight:600;color:#1a1a1a;white-space:nowrap">Status</th>
            <th style="padding:14px 16px;text-align:left;font-size:13px;font-weight:600;color:#1a1a1a;white-space:nowrap">Pricing</th>
            <th style="padding:14px 16px;text-align:left;font-size:13px;font-weight:600;color:#1a1a1a;white-space:nowrap">Payment</th>
            <th style="padding:14px 16px;text-align:right;font-size:13px;font-weight:600;color:#1a1a1a;white-space:nowrap">Balance Due</th>
            <th style="padding:14px 16px;text-align:left;font-size:13px;font-weight:600;color:#1a1a1a;white-space:nowrap">Started</th>
            <th style="padding:14px 16px;text-align:right;font-size:13px;font-weight:600;color:#1a1a1a;white-space:nowrap">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading && subscribers.length === 0">
            <td colspan="7" style="padding:48px;text-align:center">
              <UIcon name="i-lucide-loader-2" style="width:24px;height:24px;color:#ffb400;animation:spin 1s linear infinite;margin:0 auto 12px;display:block" />
              <p style="font-size:14px;color:#6b7280;margin:0">Loading subscriptions...</p>
            </td>
          </tr>
          <tr
            v-for="(sub, i) in subscribers"
            :key="sub.id"
            :style="`border-bottom:${i < subscribers.length - 1 ? '1px solid #e5e7eb' : 'none'}`"
            @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
          >
            <!-- Customer -->
            <td style="padding:16px">
              <p style="font-size:14px;font-weight:500;color:#1a1a1a;margin:0;white-space:nowrap">{{ sub.customerName || 'Unknown customer' }}</p>
              <p style="font-size:12px;color:#6b7280;margin:2px 0 0">{{ sub.customerPhone }}</p>
            </td>
            <!-- Status -->
            <td style="padding:16px">
              <span :style="`font-size:12px;font-weight:500;border-radius:14px;padding:3px 10px;white-space:nowrap;color:${statusBadge(sub.status).color};background:${statusBadge(sub.status).bg};border:1px solid ${statusBadge(sub.status).border}`">
                {{ statusBadge(sub.status).label }}
              </span>
            </td>
            <!-- Pricing -->
            <td style="padding:16px">
              <p style="font-size:14px;color:#1a1a1a;margin:0;white-space:nowrap">{{ pricingLabel(sub) }}</p>
              <p style="font-size:12px;color:#9ca3af;margin:2px 0 0;text-transform:capitalize">{{ sub.pricingSource }} · {{ sub.paymentPlan }}</p>
            </td>
            <!-- Payment plan -->
            <td style="padding:16px">
              <span :style="`font-size:12px;font-weight:500;border-radius:14px;padding:3px 10px;white-space:nowrap;text-transform:capitalize;${sub.paymentPlan === 'prepaid' ? 'color:#1d4ed8;background:#eff6ff;border:1px solid #bfdbfe' : 'color:#a21caf;background:#fdf4ff;border:1px solid #f5d0fe'}`">
                {{ sub.paymentPlan }}
              </span>
            </td>
            <!-- Balance -->
            <td style="padding:16px;text-align:right">
              <div style="display:flex;align-items:center;justify-content:flex-end;gap:6px">
                <span
                  v-if="hasExitDebt(sub)"
                  style="font-size:11px;font-weight:600;border-radius:12px;padding:2px 9px;color:#b45309;background:#fffbeb;border:1px solid #fde68a;white-space:nowrap"
                  title="Exit debt — unbilled usage settled at cancellation. Waive it (or have the customer pay) to unblock re-subscribing."
                >Debt</span>
                <span :style="`font-size:14px;font-weight:600;${sub.outstandingBalance > 0 ? 'color:#ef4444' : 'color:#6b7280'}`">{{ format(sub.outstandingBalance) }}</span>
              </div>
            </td>
            <!-- Started -->
            <td style="padding:16px;font-size:14px;color:#6b7280;white-space:nowrap">{{ formatDate(sub.startDate) }}</td>
            <!-- Actions -->
            <td style="padding:16px;text-align:right;white-space:nowrap">
              <div style="display:flex;align-items:center;justify-content:flex-end;gap:6px">
                <button
                  v-if="canReactivate(sub)"
                  :disabled="actingId === sub.id"
                  style="height:30px;padding:0 12px;background:#22c55e;border:none;border-radius:16px;font-size:12px;font-weight:600;color:white;cursor:pointer;font-family:'Manrope',sans-serif"
                  @click="openConfirm(sub, 'reactivate')"
                >Reactivate</button>
                <button
                  v-if="canWaive(sub)"
                  :disabled="actingId === sub.id"
                  style="height:30px;padding:0 12px;background:#fffbeb;border:1px solid #fde68a;border-radius:16px;font-size:12px;font-weight:600;color:#d49a00;cursor:pointer;font-family:'Manrope',sans-serif"
                  @click="openWaive(sub)"
                >Waive</button>
                <button
                  v-if="canSuspend(sub)"
                  :disabled="actingId === sub.id"
                  style="height:30px;padding:0 12px;background:#f5f3ff;border:1px solid #ddd6fe;border-radius:16px;font-size:12px;font-weight:600;color:#8b5cf6;cursor:pointer;font-family:'Manrope',sans-serif"
                  @click="openConfirm(sub, 'suspend')"
                >Suspend</button>
                <button
                  v-if="canCancel(sub)"
                  :disabled="actingId === sub.id"
                  style="height:30px;padding:0 12px;background:#fef2f2;border:1px solid #fecaca;border-radius:16px;font-size:12px;font-weight:600;color:#ef4444;cursor:pointer;font-family:'Manrope',sans-serif"
                  @click="openConfirm(sub, 'cancel')"
                >Cancel</button>
                <span v-if="!canCancel(sub) && !canSuspend(sub) && !canReactivate(sub) && !canWaive(sub)" style="font-size:12px;color:#9ca3af">Terminal</span>
                <button
                  style="width:32px;height:32px;background:none;border:1px solid #ececec;border-radius:20px;cursor:pointer;display:flex;align-items:center;justify-content:center"
                  title="View details & payments"
                  @click="openDetail(sub)"
                >
                  <UIcon name="i-lucide-eye" style="width:15px;height:15px;color:#6b7280" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!loading && subscribers.length === 0">
            <td colspan="7" style="padding:48px;text-align:center;font-size:14px;color:#6b7280">No subscriptions found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <AppPagination
      v-if="pagination.total > pagination.limit"
      :page="currentPage"
      :total="pagination.total"
      :per-page="pagination.limit"
      @update:page="currentPage = $event"
    />

    <!-- ── Lifecycle confirm dialog ── -->
    <LazyConfirmDialog
      v-if="confirmState"
      :title="confirmCopy(confirmState.action, confirmState.sub).title"
      :message="confirmCopy(confirmState.action, confirmState.sub).message"
      :confirm-text="confirmCopy(confirmState.action, confirmState.sub).text"
      :confirm-color="confirmCopy(confirmState.action, confirmState.sub).color"
      :loading="actingId === confirmState.sub.id"
      @confirm="runLifecycleAction"
      @cancel="confirmState = null"
    />

    <!-- ── Waive balance modal ── -->
    <div
      v-if="waiveTarget"
      style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:50;display:flex;align-items:center;justify-content:center;padding:24px"
      @click.self="!waiving && (waiveTarget = null)"
    >
      <div style="background:white;border:1px solid #e5e7eb;border-radius:16px;width:440px;box-shadow:0 10px 15px rgba(0,0,0,0.1)">
        <div style="padding:24px 24px 0">
          <p style="font-size:20px;font-weight:600;color:#1a1a1a;margin:0">Waive Outstanding Balance</p>
          <p style="font-size:13px;color:#6b7280;margin:6px 0 0">
            {{ waiveTarget.customerName || waiveTarget.customerPhone }} ·
            <strong style="color:#ef4444">{{ format(waiveTarget.outstandingBalance) }}</strong>
          </p>
          <p style="font-size:12px;color:#9ca3af;margin:8px 0 0">
            This zeroes the balance and fails any pending payments tied to it. The subscription status is not changed.
            For cancelled/expired subscriptions this clears exit debt and lets the customer subscribe again.
          </p>
        </div>
        <div style="padding:16px 24px;display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a">Reason (optional)</label>
          <textarea
            v-model="waiveReason"
            rows="3"
            maxlength="500"
            placeholder="e.g. Goodwill waiver after service outage"
            style="width:100%;padding:10px 12px;background:white;border:1px solid #e5e7eb;border-radius:12px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;resize:none;box-sizing:border-box;line-height:1.5"
          />
          <span style="font-size:12px;color:#9ca3af;text-align:right">{{ waiveReason.length }}/500</span>
        </div>
        <div style="padding:16px 24px;border-top:1px solid #e5e7eb;display:flex;justify-content:flex-end;gap:8px">
          <button
            style="height:40px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
            :disabled="waiving"
            @click="waiveTarget = null"
          >Cancel</button>
          <button
            :disabled="waiving || waiveReason.length > 500"
            :style="`height:40px;padding:0 20px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:${waiving ? 'not-allowed' : 'pointer'};display:flex;align-items:center;gap:8px;opacity:${waiving ? 0.7 : 1}`"
            @click="submitWaive"
          >
            <UIcon v-if="waiving" name="i-lucide-loader-2" style="width:16px;height:16px;animation:spin 1s linear infinite" />
            {{ waiving ? 'Waiving...' : 'Waive Balance' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── Detail modal with payment history ── -->
    <div
      v-if="detailTarget"
      style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:50;display:flex;align-items:center;justify-content:center;padding:24px"
      @click.self="closeDetail"
    >
      <div style="background:white;border:1px solid #e5e7eb;border-radius:16px;width:680px;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 10px 15px rgba(0,0,0,0.1)">
        <!-- Header -->
        <div style="padding:20px 24px;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between;flex-shrink:0">
          <div style="display:flex;align-items:center;gap:12px">
            <div>
              <p style="font-size:18px;font-weight:600;color:#1a1a1a;margin:0">{{ detailTarget.customerName || 'Unknown customer' }}</p>
              <p style="font-size:13px;color:#6b7280;margin:2px 0 0">{{ detailTarget.customerPhone }}</p>
            </div>
            <span :style="`font-size:12px;font-weight:500;border-radius:14px;padding:3px 10px;color:${statusBadge(detailTarget.status).color};background:${statusBadge(detailTarget.status).bg};border:1px solid ${statusBadge(detailTarget.status).border}`">
              {{ statusBadge(detailTarget.status).label }}
            </span>
          </div>
          <button style="width:28px;height:28px;border:none;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:8px" @click="closeDetail">
            <UIcon name="i-lucide-x" style="width:16px;height:16px;color:#111" />
          </button>
        </div>

        <!-- Body -->
        <div style="flex:1;overflow-y:auto;padding:24px;display:flex;flex-direction:column;gap:20px">
          <div v-if="detailLoading" style="padding:40px;text-align:center">
            <UIcon name="i-lucide-loader-2" style="width:28px;height:28px;color:#ffb400;animation:spin 1s linear infinite;margin-bottom:10px" />
            <p style="font-size:14px;color:#6b7280;margin:0">Loading payment history...</p>
          </div>

          <template v-else-if="detail">
            <!-- Summary -->
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">
              <div style="background:#f9fafb;border-radius:12px;padding:12px">
                <p style="font-size:11px;color:#6b7280;margin:0 0 4px">Pricing</p>
                <p style="font-size:14px;font-weight:600;color:#1a1a1a;margin:0">{{ pricingLabel(detail) }}</p>
              </div>
              <div style="background:#f9fafb;border-radius:12px;padding:12px">
                <p style="font-size:11px;color:#6b7280;margin:0 0 4px">Balance Due</p>
                <p :style="`font-size:14px;font-weight:600;margin:0;${detail.outstandingBalance > 0 ? 'color:#ef4444' : 'color:#1a1a1a'}`">{{ format(detail.outstandingBalance) }}</p>
              </div>
              <div style="background:#f9fafb;border-radius:12px;padding:12px">
                <p style="font-size:11px;color:#6b7280;margin:0 0 4px">Period</p>
                <p style="font-size:14px;font-weight:600;color:#1a1a1a;margin:0">{{ formatDate(detail.startDate) }} → {{ formatDate(detail.endDate) }}</p>
              </div>
              <div style="background:#f9fafb;border-radius:12px;padding:12px">
                <p style="font-size:11px;color:#6b7280;margin:0 0 4px">Pickups / Cycle</p>
                <p style="font-size:14px;font-weight:600;color:#1a1a1a;margin:0">{{ detail.pricingSource === 'calculated' ? (detail.pickupsPerCycle ?? '—') : 'Plan-based' }}</p>
              </div>
            </div>

            <!-- Payments -->
            <div>
              <p style="font-size:16px;font-weight:600;color:#1a1a1a;margin:0 0 12px">Payment History</p>
              <div v-if="detail.payments.length === 0" style="background:#f9fafb;border-radius:12px;padding:24px;text-align:center;font-size:13px;color:#6b7280">
                No payments recorded for this subscription.
              </div>
              <div class="table-scroll" v-else style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
                <table style="width:100%;border-collapse:collapse;min-width:560px">
                  <thead>
                    <tr style="background:#f8f9fa;border-bottom:1px solid #e5e7eb">
                      <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:#374151">Period</th>
                      <th style="padding:10px 14px;text-align:right;font-size:12px;font-weight:600;color:#374151">Amount</th>
                      <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:#374151">Status</th>
                      <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:#374151">Paid At</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(p, i) in detail.payments" :key="p.id" :style="`border-bottom:${i < detail.payments.length - 1 ? '1px solid #f0f0f0' : 'none'}`">
                      <td style="padding:12px 14px;font-size:13px;color:#1a1a1a;white-space:nowrap">
                        {{ formatDate(p.billingPeriodStart) }} → {{ formatDate(p.billingPeriodEnd) }}
                      </td>
                      <td style="padding:12px 14px;text-align:right;font-size:13px;font-weight:600;color:#1a1a1a;white-space:nowrap">
                        {{ p.currency }} {{ Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 }) }}
                      </td>
                      <td style="padding:12px 14px">
                        <span :style="`font-size:11px;font-weight:600;border-radius:12px;padding:2px 9px;color:${paymentBadge(p.status).color};background:${paymentBadge(p.status).bg};border:1px solid ${paymentBadge(p.status).border}`">
                          {{ paymentBadge(p.status).label }}
                        </span>
                        <span
                          v-if="needsPaymentReview(p.status)"
                          style="font-size:11px;font-weight:600;border-radius:12px;padding:2px 9px;color:#d49a00;background:rgba(255,180,0,0.1);border:1px solid rgba(255,180,0,0.3);margin-left:6px"
                          title="Paid on a cancelled/expired subscription — either settled outstanding exit debt or flagged for refund review"
                        >Review payment</span>
                      </td>
                      <td style="padding:12px 14px;font-size:12px;color:#6b7280;white-space:nowrap">{{ formatDateTime(p.paidAt) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p style="font-size:12px;color:#9ca3af;margin:10px 0 0">
                Late MoMo settlements can mark a failed payment as paid later. Money arriving for a cancelled
                subscription either clears its outstanding debt or is flagged for refund review. Paid payments
                are final and never revert.
              </p>
            </div>
          </template>
        </div>
      </div>
    </div>

  </div>
</template>
