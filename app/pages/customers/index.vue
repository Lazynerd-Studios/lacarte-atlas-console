<script setup lang="ts">
import type { CustomerListItem, CustomerOnboardingStage, OnboardingCounts } from '~/types/customer'
import { ONBOARDING_STAGE_ORDER, stageTone, isOnboardingStage } from '~/utils/onboarding'

definePageMeta({ layout: 'dashboard' })

const toast = useAppToast()
const api = useApi()

const showModal = ref(false)
const showImportModal = ref(false)
const showSuspendModal = ref(false)
const showUnsuspendConfirm = ref(false)
const selectedCustomer = ref<CustomerListItem | null>(null)
const suspending = ref(false)
const unsuspending = ref(false)

// Bulk import is gated on customers.create (doc §: all /import* endpoints need it);
// authStore permissions are merged from /user/profile after login
const { hasPermission } = usePermissions()

function openSuspend(c: CustomerListItem) {
  selectedCustomer.value = c
  showSuspendModal.value = true
}

function openUnsuspend(c: CustomerListItem) {
  selectedCustomer.value = c
  showUnsuspendConfirm.value = true
}

async function handleSuspend(reason: string) {
  if (!reason.trim()) {
    toast.error('Please provide a reason for suspension')
    return
  }

  if (!selectedCustomer.value) return

  suspending.value = true
  const result = await api.patch<{ success: boolean; message?: string }>(
    `/customer/admin/${selectedCustomer.value.id}/suspend`,
    { reason: reason.trim() },
    'Failed to suspend account'
  )
  suspending.value = false

  if (result) {
    toast.success(result.message || 'Account suspended successfully')
    showSuspendModal.value = false
    selectedCustomer.value = null
    // Suspension cascades: subscriptions are cancelled and non-final pickups
    // are cancelled server-side — refetch the list to reflect the new state
    await fetchCustomers()
  }
}

async function handleUnsuspend() {
  if (!selectedCustomer.value) return

  unsuspending.value = true
  const result = await api.patch<{ success: boolean; message?: string }>(
    `/customer/admin/${selectedCustomer.value.id}/unsuspend`,
    {},
    'Failed to unsuspend account'
  )
  unsuspending.value = false

  if (result) {
    updateCustomerStatus(selectedCustomer.value.id, 'active')
    toast.success(result.message || 'Account unsuspended successfully')
    showUnsuspendConfirm.value = false
    selectedCustomer.value = null
  }
}

function updateCustomerStatus(id: string, status: string) {
  const idx = customers.value.findIndex((c) => c.id === id)
  if (idx !== -1) {
    customers.value[idx]!.status = status
  }
}

const search = ref('')
const statusFilter = ref('all')
const planFilter = ref('all')
// §5 backlog filter: customers in entity categories still missing a business name
const missingEntityName = ref(false)
const missingCount = ref<number | null>(null)

// ── Onboarding triage (frontend-web-customer-onboarding-stage.md) ──
// Deep-link support: tiles/upsell links arrive as ?stage=<stage>&subscribed=false
const route = useRoute()
const stageFilter = ref<CustomerOnboardingStage | ''>(
  isOnboardingStage(route.query.stage) ? route.query.stage : '',
)
// true = only customers WITHOUT an active subscription (the PAYG upsell list);
// kept separate from the existing `plan` filter which has different semantics
const noSubscription = ref(route.query.subscribed === 'false')
const onboardingCounts = ref<OnboardingCounts | null>(null)

// The counts endpoint is not in the checked-in apidoc yet — use the raw request
// so an undeployed route degrades silently (tiles hide) instead of toasting.
async function fetchOnboardingCounts() {
  try {
    onboardingCounts.value = await api.request<OnboardingCounts>('/customer/admin/onboarding/counts')
  } catch {
    onboardingCounts.value = null
  }
}

function toggleStage(stage: CustomerOnboardingStage) {
  stageFilter.value = stageFilter.value === stage ? '' : stage
}

const customers = ref<CustomerListItem[]>([])
const total = ref(0)
const loading = ref(false)
const initialLoading = ref(true)
const downloading = ref(false)
const page = ref(1)
const perPage = 20

async function fetchCustomers() {
  loading.value = true
  const params = new URLSearchParams()
  params.set('page', String(page.value))
  params.set('limit', String(perPage))
  if (search.value) params.set('search', search.value)
  if (statusFilter.value !== 'all') params.set('status', statusFilter.value)
  if (planFilter.value !== 'all') params.set('plan', planFilter.value)
  if (missingEntityName.value) params.set('missingEntityName', 'true')
  if (stageFilter.value) params.set('onboardingStage', stageFilter.value)
  if (noSubscription.value) params.set('subscribed', 'false')

  const api = useApi()
  const data = await api.get<{ data: CustomerListItem[]; pagination: { total: number } }>(`/customer/admin/list?${params}`)
  if (data) {
    customers.value = data.data
    total.value = data.pagination.total
    // The filtered query's total doubles as the chip badge count
    if (missingEntityName.value) missingCount.value = data.pagination.total
  }
  loading.value = false
}

// Lightweight count for the chip badge while the filter is inactive
async function fetchMissingCount() {
  const api = useApi()
  const data = await api.get<{ pagination: { total: number } }>('/customer/admin/list?missingEntityName=true&page=1&limit=1')
  if (data) missingCount.value = data.pagination?.total ?? 0
}

watch([search, statusFilter, planFilter, missingEntityName, stageFilter, noSubscription], () => { page.value = 1; fetchCustomers() })
watch(page, fetchCustomers)

// Last pickup: prefer lastPickupDate, fall back to locationUpdatedAt
function lastPickupDisplay(c: CustomerListItem) {
  const date = c.lastPickupDate ?? c.locationUpdatedAt
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

onMounted(async () => {
  initialLoading.value = true
  await fetchCustomers()
  fetchMissingCount()
  fetchOnboardingCounts()
  initialLoading.value = false
})

function handleCustomersChanged() {
  fetchCustomers()
  fetchOnboardingCounts()
}

function handleCustomerCreated(customerId: string) {
  showModal.value = false
  handleCustomersChanged()
  toast.success('Customer created')
  // A per_bin customer can't be subscribed or priced until bins are set, so the
  // create modal hands back the new id and we open the Bin Mix editor directly.
  if (customerId) navigateTo(`/customers/${customerId}?tab=bins`)
}

// Compact bin-inventory summary for the list, e.g. "1×240 L + 2×660 L"
function binSummary(c: CustomerListItem): string {
  const bins = c.bins ?? []
  if (!bins.length) return '—'
  return [...bins]
    .sort((a, b) => (a.capacityRate.capacityLiters ?? 0) - (b.capacityRate.capacityLiters ?? 0))
    .map(b => `${b.quantity}\u00d7${b.capacityRate.capacityLiters} L`)
    .join(' + ')
}

function planBadge(plan: string | undefined) {
  if (!plan) return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280', label: '—' }
  const lower = plan.toLowerCase()
  if (lower.includes('subscription')) return { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', color: '#3b82f6', label: plan }
  return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280', label: plan }
}

function formatPlanLabel(plan: string | undefined): string {
  return planBadge(plan).label
}

async function downloadExcel() {
  if (!customers.value.length) {
    toast.error('No customers to export')
    return
  }

  downloading.value = true
  try {
    const XLSX = await import('xlsx')

    const rows = customers.value.map((c) => ({
      // §4: displayName is the primary identity; raw entityName kept for export
      Name: c.displayName || c.user?.name || '—',
      'Business Name': c.entityName ?? '',
      Phone: c.phoneNumber ?? '—',
      Address: c.address ?? '—',
      Plan: formatPlanLabel(c.customerType?.name),
      'Last Pickup': lastPickupDisplay(c),
      Balance: c.balance ?? 0,
      Status: c.status ?? '—',
      Onboarding: c.onboarding ? stageTone(c.onboarding.stage).label : '—',
    }))

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers')

    const date = new Date().toISOString().split('T')[0]
    XLSX.writeFile(workbook, `customers-${date}.xlsx`)

    toast.success('Customers exported successfully')
  } catch (e) {
    const err = asError(e)
    toast.error('Failed to export customers', err.message)
  } finally {
    downloading.value = false
  }
}

function statusBadge(status: string) {
  if (status === 'active')   return { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.2)',  color: '#22c55e', label: 'active' }
  if (status === 'overdue')  return { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.2)',  color: '#ef4444', label: 'overdue' }
  return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280', label: 'inactive' }
}
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:24px">
    
    <!-- Loading skeleton -->
    <PageSkeleton v-if="initialLoading" type="table" :rows="8" :cards="0" />

    <!-- Content -->
    <template v-else>
    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between">
      <div>
        <h1 style="font-size:32px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;line-height:1.3">Customers</h1>
        <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:4px">Manage all customer accounts and subscriptions</p>
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <button
          v-if="hasPermission('customers.create')"
          style="height:40px;padding:0 20px;background:white;border:1px solid #e5e7eb;border-radius:1000px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer;display:flex;align-items:center;gap:8px"
          @click="showImportModal = true"
        >
          <UIcon name="i-lucide-sheet" style="width:15px;height:15px;color:#6b7280" />
          Bulk Import
        </button>
        <button style="height:40px;padding:0 20px;background:#ffb400;border:none;border-radius:1000px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer;box-shadow:0 1px 3px rgba(255,180,0,0.2)" @click="showModal = true">
          Add Customer
        </button>
      </div>
    </div>

    <!-- Onboarding triage tiles (doc §1): click filters the list by stage, click again clears -->
    <div v-if="onboardingCounts" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px">
      <button
        v-for="s in ONBOARDING_STAGE_ORDER"
        :key="s"
        type="button"
        :title="stageFilter === s ? 'Clear stage filter' : `Filter list: ${stageTone(s).label}`"
        @click="toggleStage(s)"
        :style="`background:white;border:${stageFilter === s ? '2px solid #ffb400' : '1px solid #f0f0f0'};border-radius:14px;padding:14px 16px;text-align:left;cursor:pointer;display:flex;flex-direction:column;gap:6px;font-family:'Manrope',sans-serif`"
      >
        <span style="font-size:22px;font-weight:700;color:#1a1a1a;line-height:1.1">{{ onboardingCounts[s] }}</span>
        <span :style="`display:flex;align-items:center;gap:6px;font-size:11px;font-weight:600;color:${stageTone(s).fg}`">
          <span :style="`width:8px;height:8px;border-radius:50%;background:${stageTone(s).bg};border:1px solid ${stageTone(s).fg};flex-shrink:0`"></span>
          {{ stageTone(s).label }}
        </span>
      </button>
    </div>

    <!-- Filters card -->
    <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:25px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:16px;align-items:center" class="filters-grid">
        <!-- Search -->
        <div style="position:relative">
          <UIcon name="i-lucide-search" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:#6b7280" />
          <input
            v-model="search"
            type="text"
            placeholder="Search by name, business name, email or phone"
            style="width:100%;height:38px;padding-left:40px;padding-right:16px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#111;outline:none;font-family:'Manrope',sans-serif;box-sizing:border-box"
            @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
            @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
          />
        </div>

        <!-- Status filter -->
        <div style="position:relative">
          <select
            v-model="statusFilter"
            style="width:100%;height:40px;padding:0 36px 0 16px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#0a0d12;font-family:'Manrope',sans-serif;outline:none;cursor:pointer;appearance:none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="overdue">Overdue</option>
            <option value="inactive">Inactive</option>
          </select>
          <UIcon name="i-lucide-chevron-down" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:#6b7280;pointer-events:none" />
        </div>

        <!-- Plan filter -->
        <div style="position:relative">
          <select
            v-model="planFilter"
            style="width:100%;height:40px;padding:0 36px 0 16px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#0a0d12;font-family:'Manrope',sans-serif;outline:none;cursor:pointer;appearance:none"
          >
            <option value="all">All Plan</option>
            <option value="subscription">Subscription</option>
            <option value="pay-as-you-go">Pay-as-you-go</option>
          </select>
          <UIcon name="i-lucide-chevron-down" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:#6b7280;pointer-events:none" />
        </div>

        <!-- Export -->
        <button
          :disabled="downloading"
          style="width:48px;height:42px;background:#ececec;border:none;border-radius:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;opacity:1"
          title="Download Excel"
          @click="downloadExcel"
        >
          <UIcon
            :name="downloading ? 'i-lucide-loader-2' : 'i-lucide-download'"
            :style="`width:16px;height:16px;color:#111;${downloading ? 'animation:spin 1s linear infinite' : ''}`"
          />
        </button>
      </div>

      <!-- Saved filter chip (§5): customers in entity categories with no business name yet -->
      <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">
        <button
          type="button"
          @click="missingEntityName = !missingEntityName"
          :style="`display:flex;align-items:center;gap:6px;height:32px;padding:0 14px;border-radius:1000px;border:1px solid ${missingEntityName ? '#ffb400' : '#e5e7eb'};background:${missingEntityName ? '#fff9e6' : '#fff'};font-size:13px;font-weight:600;color:${missingEntityName ? '#b45309' : '#6b7280'};font-family:'Manrope',sans-serif;cursor:pointer`"
        >
          <UIcon name="i-lucide-building-2" style="width:14px;height:14px" />
          Missing business name
          <span v-if="missingCount != null" style="background:#ffb400;color:#1a1a1a;border-radius:10px;padding:1px 8px;font-size:11px;font-weight:700">{{ missingCount }}</span>
        </button>
        <!-- PAYG upsell filter (doc §2): subscribed=false — pairs with the Ready-to-order tile -->
        <button
          type="button"
          @click="noSubscription = !noSubscription"
          :style="`display:flex;align-items:center;gap:6px;height:32px;padding:0 14px;border-radius:1000px;border:1px solid ${noSubscription ? '#0369a1' : '#e5e7eb'};background:${noSubscription ? '#f0f9ff' : '#fff'};font-size:13px;font-weight:600;color:${noSubscription ? '#0369a1' : '#6b7280'};font-family:'Manrope',sans-serif;cursor:pointer`"
        >
          <UIcon name="i-lucide-credit-card" style="width:14px;height:14px" />
          No active subscription
        </button>
      </div>
    </div>

    <!-- Table card -->
    <div class="table-scroll" style="background:white;border:1px solid #ececec;border-radius:16px;padding:1px;box-shadow:0 1px 3px rgba(0,0,0,0.1);transition:opacity 0.15s" :style="loading ? 'opacity:0.6' : 'opacity:1'">
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f8f9fa;border-bottom:1px solid #e5e7eb">
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">Name</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">Phone</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">Address</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">Plan</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">Bins</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">Last Pickup</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">Balance</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">Status</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">Onboarding</th>
            <th style="padding:14px 16px;text-align:right;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="c in customers"
            :key="c.id"
            style="border-bottom:1px solid #e5e7eb"
            @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
          >
            <td style="padding:16px;font-family:'Manrope',sans-serif;white-space:nowrap">
              <p style="font-size:14px;font-weight:500;color:#1a1a1a;margin:0">{{ c.displayName || c.user?.name }}</p>
              <!-- Entity names (§4): muted person name only when it differs -->
              <p v-if="c.displayName && c.user?.name && c.displayName !== c.user.name" style="font-size:12px;color:#6b7280;margin:2px 0 0">{{ c.user.name }}</p>
            </td>
            <td style="padding:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ c.phoneNumber }}</td>
            <td style="padding:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ c.address }}</td>
            <td style="padding:16px">
              <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;color:${planBadge(c.customerType?.name).color};background:${planBadge(c.customerType?.name).bg};border:1px solid ${planBadge(c.customerType?.name).border};border-radius:14px;padding:3px 10px;white-space:nowrap`">
                {{ planBadge(c.customerType?.name).label }}
              </span>
            </td>
            <td style="padding:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ binSummary(c) }}</td>
            <td style="padding:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ lastPickupDisplay(c) }}</td>
            <td style="padding:16px;font-size:14px;font-family:'Manrope',sans-serif;white-space:nowrap" :style="(c.balance ?? 0) > 0 ? 'color:#ef4444;font-weight:500' : 'color:#1a1a1a'">
              GHS {{ c.balance ?? 0 }}
            </td>
            <td style="padding:16px">
              <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;color:${statusBadge(c.status).color};background:${statusBadge(c.status).bg};border:1px solid ${statusBadge(c.status).border};border-radius:14px;padding:3px 10px;white-space:nowrap`">
                {{ statusBadge(c.status).label }}
              </span>
            </td>
            <!-- Stage badge from the server-derived onboarding object; hidden when the backend predates the feature -->
            <td style="padding:16px">
              <span v-if="c.onboarding" :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;color:${stageTone(c.onboarding.stage).fg};background:${stageTone(c.onboarding.stage).bg};border-radius:14px;padding:3px 10px;white-space:nowrap`">
                {{ stageTone(c.onboarding.stage).label }}
              </span>
              <span v-else style="font-size:14px;color:#9ca3af;font-family:'Manrope',sans-serif">—</span>
            </td>
            <td style="padding:16px">
              <div style="display:flex;align-items:center;justify-content:flex-end;gap:8px">
                <NuxtLink :to="`/customers/${c.id}`" style="text-decoration:none">
                  <button
                    style="width:32px;height:32px;border-radius:20px;background:none;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center"
                    title="View"
                    @mouseover="($event.currentTarget as HTMLElement).style.background='#f3f4f6'"
                    @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
                  >
                    <UIcon name="i-lucide-eye" style="width:16px;height:16px;color:#6b7280" />
                  </button>
                </NuxtLink>
                <button
                  :title="c.status === 'active' ? 'Suspend' : 'Unsuspend'"
                  :style="`width:32px;height:32px;border-radius:20px;background:none;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer`"
                  @click="c.status === 'active' ? openSuspend(c) : openUnsuspend(c)"
                  @mouseover="($event.currentTarget as HTMLElement).style.background = c.status === 'active' ? '#fef2f2' : '#f0fdf4'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.background = 'transparent'"
                >
                  <UIcon
                    :name="c.status === 'active' ? 'i-lucide-user-x' : 'i-lucide-user-check'"
                    :style="`width:16px;height:16px;color:${c.status === 'active' ? '#ef4444' : '#22c55e'}`"
                  />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="customers.length === 0">
            <td colspan="10" style="padding:48px 16px;text-align:center;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">No customers found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <AppPagination :page="page" :total="total" :per-page="perPage" @update:page="page = $event" />
    
    </template><!-- end content -->
  </div>

  <!-- Add Customer Modal -->
  <LazyCustomerModal v-if="showModal" @close="showModal = false" @success="handleCustomerCreated" />

  <!-- Bulk Import Modal (xlsx, review-before-commit) -->
  <LazyBulkImportCustomersModal v-if="showImportModal" @close="showImportModal = false" @imported="handleCustomersChanged" />

  <!-- Suspend Modal -->
  <LazySuspendModal
    v-if="showSuspendModal && selectedCustomer"
    :customer-name="selectedCustomer.displayName || selectedCustomer.user?.name || 'Customer'"
    :loading="suspending"
    @close="showSuspendModal = false"
    @confirm="handleSuspend"
  />

  <!-- Unsuspend Confirm Dialog -->
  <LazyConfirmDialog
    v-if="showUnsuspendConfirm && selectedCustomer"
    title="Unsuspend Account"
    :message="`Are you sure you want to reactivate ${selectedCustomer.displayName || selectedCustomer.user?.name || 'Customer'}'s account?`"
    confirm-text="Unsuspend Account"
    confirm-color="#22c55e"
    :loading="unsuspending"
    @confirm="handleUnsuspend"
    @cancel="showUnsuspendConfirm = false"
  />
</template>
