<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const showDeclineModal = ref(false)
const selectedDeclineTransfer = ref<{ id: string; customer: string; invoiceId: string; amount: string; reference: string; submitted: string } | null>(null)

function openDecline(t: typeof transfers.value[0]) {
  selectedDeclineTransfer.value = { ...t, amount: format(t.amount) }
  showDeclineModal.value = true
}

function handleDecline(id: string) {
  transfers.value = transfers.value.filter(t => t.id !== id)
  showDeclineModal.value = false
  selectedDeclineTransfer.value = null
}

const showApproveModal = ref(false)
const selectedTransfer = ref<{ id: string; customer: string; invoiceId: string; amount: string; reference: string; submitted: string } | null>(null)

function openApprove(t: typeof transfers.value[0]) {
  selectedTransfer.value = { ...t, amount: format(t.amount) }
  showApproveModal.value = true
}

function handleApprove(id: string) {
  transfers.value = transfers.value.filter(t => t.id !== id)
  showApproveModal.value = false
  selectedTransfer.value = null
}

const { format } = useCurrency()

const transfers = ref([
  { id: 'BT-001', customer: 'Michael Chen',   invoiceId: 'INV-2026-002', amount: 65,  reference: 'REF123456789', submitted: '2026-03-03' },
  { id: 'BT-002', customer: 'David Wilson',   invoiceId: 'INV-2026-012', amount: 120, reference: 'REF987654321', submitted: '2026-03-04' },
  { id: 'BT-003', customer: 'Lisa Anderson',  invoiceId: 'INV-2026-018', amount: 45,  reference: 'REF456789123', submitted: '2026-03-04' },
  { id: 'BT-004', customer: 'James Martinez', invoiceId: 'INV-2026-021', amount: 90,  reference: 'REF321654987', submitted: '2026-03-05' },
  { id: 'BT-005', customer: 'Olivia Brown',   invoiceId: 'INV-2026-025', amount: 55,  reference: 'REF654321098', submitted: '2026-03-05' },
  { id: 'BT-006', customer: 'Sarah Johnson',  invoiceId: 'INV-2026-030', amount: 75,  reference: 'REF789012345', submitted: '2026-03-06' },
  { id: 'BT-007', customer: 'Emma Williams',  invoiceId: 'INV-2026-033', amount: 110, reference: 'REF012345678', submitted: '2026-03-06' },
])

const transferSearch = ref('')
const transferPage = ref(1)
const transferPerPage = 5

const filteredTransfers = computed(() => {
  const q = transferSearch.value.toLowerCase()
  if (!q) return transfers.value
  return transfers.value.filter(t =>
    t.customer.toLowerCase().includes(q) ||
    t.id.toLowerCase().includes(q) ||
    t.invoiceId.toLowerCase().includes(q) ||
    t.reference.toLowerCase().includes(q)
  )
})

const paginatedTransfers = computed(() => {
  const start = (transferPage.value - 1) * transferPerPage
  return filteredTransfers.value.slice(start, start + transferPerPage)
})

watch(transferSearch, () => { transferPage.value = 1 })

const invoices = ref([
  { id: 'INV-2026-001', customer: 'Sarah Johnson',  planType: 'subscription', amount: 45,  date: '2026-03-01', status: 'paid' },
  { id: 'INV-2026-002', customer: 'Michael Chen',   planType: 'payg',         amount: 65,  date: '2026-03-01', status: 'pending' },
  { id: 'INV-2026-003', customer: 'Emma Williams',  planType: 'subscription', amount: 45,  date: '2026-03-01', status: 'paid' },
  { id: 'INV-2026-004', customer: 'James Martinez', planType: 'payg',         amount: 120, date: '2026-02-15', status: 'overdue' },
  { id: 'INV-2026-005', customer: 'Olivia Brown',   planType: 'subscription', amount: 45,  date: '2026-03-01', status: 'paid' },
  { id: 'INV-2026-006', customer: 'David Wilson',   planType: 'payg',         amount: 80,  date: '2026-03-02', status: 'paid' },
  { id: 'INV-2026-007', customer: 'Lisa Anderson',  planType: 'subscription', amount: 45,  date: '2026-03-02', status: 'pending' },
  { id: 'INV-2026-008', customer: 'Robert Taylor',  planType: 'payg',         amount: 55,  date: '2026-03-02', status: 'paid' },
  { id: 'INV-2026-009', customer: 'Karen White',    planType: 'subscription', amount: 45,  date: '2026-02-20', status: 'overdue' },
  { id: 'INV-2026-010', customer: 'Chris Harris',   planType: 'payg',         amount: 95,  date: '2026-03-03', status: 'paid' },
  { id: 'INV-2026-011', customer: 'Amanda Clark',   planType: 'subscription', amount: 45,  date: '2026-03-03', status: 'paid' },
  { id: 'INV-2026-012', customer: 'Daniel Lewis',   planType: 'payg',         amount: 70,  date: '2026-03-03', status: 'pending' },
])

const invoiceSearch = ref('')
const invoicePage = ref(1)
const invoicePerPage = 10

const filteredInvoices = computed(() => {
  const q = invoiceSearch.value.toLowerCase()
  if (!q) return invoices.value
  return invoices.value.filter(inv =>
    inv.customer.toLowerCase().includes(q) ||
    inv.id.toLowerCase().includes(q) ||
    inv.status.toLowerCase().includes(q)
  )
})

const paginatedInvoices = computed(() => {
  const start = (invoicePage.value - 1) * invoicePerPage
  return filteredInvoices.value.slice(start, start + invoicePerPage)
})

watch(invoiceSearch, () => { invoicePage.value = 1 })

const revenue = [
  { label: 'Monthly Subscriptions', amount: 52340, pct: 62, color: '#22c55e' },
  { label: 'Pay-as-you-go',         amount: 31890, pct: 38, color: '#3b82f6' },
  { label: 'Outstanding',           amount: 12480, pct: 15, color: '#ef4444', amountColor: '#ef4444' },
]

const agingSlices = [
  { label: 'Current',    color: '#22c55e', pct: 45 },
  { label: '1-30 days',  color: '#ffb400', pct: 25 },
  { label: '31-60 days', color: '#ff8c00', pct: 18 },
  { label: '60+ days',   color: '#ef4444', pct: 12 },
]

function planBadge(p: string) {
  if (p === 'subscription') return { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', color: '#3b82f6', label: 'Subscription' }
  return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280', label: 'PAYG' }
}

function statusBadge(s: string) {
  if (s === 'paid')    return { bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.2)',   color: '#22c55e', label: 'paid' }
  if (s === 'pending') return { bg: 'rgba(255,180,0,0.1)',   border: 'rgba(255,180,0,0.2)',   color: '#d49a00', label: 'pending' }
  if (s === 'overdue') return { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.2)',   color: '#ef4444', label: 'overdue' }
  return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280', label: s }
}

// Build SVG donut chart from slices
const cx = 60, cy = 60, r = 50, stroke = 20
const circumference = 2 * Math.PI * r
const donutSlices = computed(() => {
  let offset = 0
  return agingSlices.map(s => {
    const dash = (s.pct / 100) * circumference
    const gap = circumference - dash
    const slice = { ...s, dash, gap, offset }
    offset += dash
    return slice
  })
})
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:32px">

    <!-- Header -->
    <div>
      <h1 style="font-size:32px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;line-height:1.3">Billing &amp; Payments</h1>
      <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:8px">Manage invoices, subscriptions, and payments</p>
    </div>

    <!-- Stat cards -->
    <div class="grid-cols-4">
      <div
        v-for="stat in [
          { icon: 'i-lucide-alert-circle',  label: 'Total Outstanding',    value: 'GHS 12,480' },
          { icon: 'i-lucide-repeat',        label: 'Subscription Revenue', value: 'GHS 52,340' },
          { icon: 'i-lucide-dollar-sign',   label: 'PAYG Revenue',         value: 'GHS 31,890' },
          { icon: 'i-lucide-clock',         label: 'Avg Collection Time',  value: '12 days' },
        ]"
        :key="stat.label"
        style="background:white;border:1px solid #ececec;border-radius:16px;padding:1px;box-shadow:0 1px 3px rgba(0,0,0,0.1)"
      >
        <div style="padding:0 24px 24px">
          <div style="padding-top:24px;margin-bottom:16px">
            <div style="width:48px;height:48px;background:#f8f9fa;border-radius:16px;display:flex;align-items:center;justify-content:center">
              <UIcon :name="stat.icon" style="width:24px;height:24px;color:#6b7280" />
            </div>
          </div>
          <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:4px">{{ stat.label }}</p>
          <p style="font-size:24px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ stat.value }}</p>
        </div>
      </div>
    </div>

    <!-- Pending Bank Transfers -->
    <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:25px 25px 20px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <div>
          <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Pending Bank Transfers</p>
          <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:4px">Review and approve customer bank transfer payments</p>
        </div>
        <span style="font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 11px;color:#d49a00;background:rgba(255,180,0,0.1);border:1px solid rgba(255,180,0,0.2)">
          {{ transfers.length }} pending
        </span>
      </div>

      <!-- Search -->
      <div style="position:relative;margin-bottom:16px;max-width:320px">
        <UIcon name="i-lucide-search" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:#6b7280;pointer-events:none" />
        <input
          v-model="transferSearch"
          type="text"
          placeholder="Search transfers..."
          style="width:100%;height:38px;padding:0 12px 0 36px;border:1px solid #e5e7eb;border-radius:20px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box;background:white"
          @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
          @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
        />
      </div>

      <div class="table-scroll">
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f8f9fa;border-bottom:1px solid #e5e7eb">
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">Transfer ID</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Customer</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">Invoice ID</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Amount</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Reference</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Submitted</th>
            <th style="padding:14px 16px;text-align:right;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(t, i) in paginatedTransfers"
            :key="t.id"
            :style="`border-bottom:${i < paginatedTransfers.length - 1 ? '1px solid #e5e7eb' : 'none'}`"
            @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
          >
            <td style="padding:20px 16px;font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ t.id }}</td>
            <td style="padding:20px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ t.customer }}</td>
            <td style="padding:20px 16px;font-size:14px;color:#ffb400;font-family:'Manrope',sans-serif;white-space:nowrap">{{ t.invoiceId }}</td>
            <td style="padding:20px 16px;font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ format(t.amount) }}</td>
            <td style="padding:20px 16px">
              <span style="font-size:12px;color:#1a1a1a;background:#f9fafb;padding:4px 8px;border-radius:4px;font-family:monospace">{{ t.reference }}</span>
            </td>
            <td style="padding:20px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ t.submitted }}</td>
            <td style="padding:20px 16px;text-align:right">
              <div style="display:flex;align-items:center;justify-content:flex-end;gap:8px">
                <button
                  style="width:32px;height:28px;background:none;border:none;border-radius:20px;cursor:pointer;display:flex;align-items:center;justify-content:center"
                  title="Approve"
                  @click="openApprove(t)"
                  @mouseover="($event.currentTarget as HTMLElement).style.background='rgba(34,197,94,0.1)'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
                >
                  <UIcon name="i-lucide-check" style="width:16px;height:16px;color:#22c55e" />
                </button>
                <button
                  style="width:32px;height:28px;background:none;border:none;border-radius:20px;cursor:pointer;display:flex;align-items:center;justify-content:center"
                  title="Reject"
                  @click="openDecline(t)"
                  @mouseover="($event.currentTarget as HTMLElement).style.background='rgba(239,68,68,0.1)'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
                >
                  <UIcon name="i-lucide-x" style="width:16px;height:16px;color:#ef4444" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="paginatedTransfers.length === 0">
            <td colspan="7" style="padding:32px 16px;text-align:center;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">No transfers match your search.</td>
          </tr>
        </tbody>
      </table>
      </div>

      <!-- Pagination -->
      <div style="padding-top:16px;border-top:1px solid #e5e7eb;margin-top:4px">
        <AppPagination
          :page="transferPage"
          :total="filteredTransfers.length"
          :per-page="transferPerPage"
          @update:page="transferPage = $event"
        />
      </div>
    </div>

    <!-- Payment Aging + Revenue Breakdown -->
    <div class="grid-billing-charts">

      <!-- Payment Aging donut -->
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:25px 25px 1px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin-bottom:16px">Payment Aging</p>
        <div style="display:flex;flex-direction:column;align-items:center;gap:16px;padding-bottom:24px">
          <!-- SVG donut -->
          <svg width="160" height="160" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" stroke-width="20" />
            <circle
              v-for="(s, i) in donutSlices"
              :key="i"
              cx="60" cy="60" r="50"
              fill="none"
              :stroke="s.color"
              stroke-width="20"
              :stroke-dasharray="`${s.dash} ${s.gap}`"
              :stroke-dashoffset="`${circumference / 4 - s.offset}`"
              style="transform-origin:center;transform:rotate(-90deg)"
            />
          </svg>
          <!-- Legend -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;width:100%">
            <div v-for="s in agingSlices" :key="s.label" style="display:flex;align-items:center;gap:8px">
              <div :style="`width:12px;height:12px;border-radius:50%;background:${s.color};flex-shrink:0`"></div>
              <span :style="`font-size:13px;color:${s.color};font-family:'Manrope',sans-serif`">{{ s.label }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Revenue Breakdown -->
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:25px 25px 1px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin-bottom:16px">Revenue Breakdown</p>
        <div style="display:flex;flex-direction:column;gap:16px;padding-bottom:24px">
          <div
            v-for="r in revenue"
            :key="r.label"
            style="background:#f8f9fa;border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:8px"
          >
            <div style="display:flex;align-items:center;justify-content:space-between">
              <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ r.label }}</span>
              <span :style="`font-size:14px;font-weight:500;font-family:'Manrope',sans-serif;color:${r.amountColor || '#111'}`">{{ format(r.amount) }}</span>
            </div>
            <div style="height:8px;background:#e5e7eb;border-radius:999px;overflow:hidden">
              <div :style="`height:8px;background:${r.color};border-radius:999px;width:${r.pct}%`"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Invoices -->
    <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:25px 25px 20px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Recent Invoices</p>
        <button
          style="height:32px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
          @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
          @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
        >Export All</button>
      </div>

      <!-- Search -->
      <div style="position:relative;margin-bottom:16px;max-width:320px">
        <UIcon name="i-lucide-search" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:#6b7280;pointer-events:none" />
        <input
          v-model="invoiceSearch"
          type="text"
          placeholder="Search invoices..."
          style="width:100%;height:38px;padding:0 12px 0 36px;border:1px solid #e5e7eb;border-radius:20px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box;background:white"
          @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
          @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
        />
      </div>

      <div class="table-scroll">
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f8f9fa;border-bottom:1px solid #e5e7eb">
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">Invoice ID</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Customer</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">Plan Type</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Amount</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Date</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Status</th>
            <th style="padding:14px 16px;text-align:right;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(inv, i) in paginatedInvoices"
            :key="inv.id"
            :style="`border-bottom:${i < paginatedInvoices.length - 1 ? '1px solid #e5e7eb' : 'none'}`"
            @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
          >
            <td style="padding:20px 16px;font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ inv.id }}</td>
            <td style="padding:20px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ inv.customer }}</td>
            <td style="padding:20px 16px">
              <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 10px;white-space:nowrap;color:${planBadge(inv.planType).color};background:${planBadge(inv.planType).bg};border:1px solid ${planBadge(inv.planType).border}`">
                {{ planBadge(inv.planType).label }}
              </span>
            </td>
            <td style="padding:20px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ format(inv.amount) }}</td>
            <td style="padding:20px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ inv.date }}</td>
            <td style="padding:20px 16px">
              <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 10px;white-space:nowrap;color:${statusBadge(inv.status).color};background:${statusBadge(inv.status).bg};border:1px solid ${statusBadge(inv.status).border}`">
                {{ statusBadge(inv.status).label }}
              </span>
            </td>
            <td style="padding:20px 16px;text-align:right">
              <NuxtLink :to="`/billing/${inv.id}`" style="text-decoration:none">
                <button
                  style="height:32px;padding:0 16px;background:none;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
                  @mouseover="($event.currentTarget as HTMLElement).style.background='#f3f4f6'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
                >View</button>
              </NuxtLink>
            </td>
          </tr>
          <tr v-if="paginatedInvoices.length === 0">
            <td colspan="7" style="padding:32px 16px;text-align:center;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">No invoices match your search.</td>
          </tr>
        </tbody>
      </table>
      </div>

      <!-- Pagination -->
      <div style="padding-top:16px;border-top:1px solid #e5e7eb;margin-top:4px">
        <AppPagination
          :page="invoicePage"
          :total="filteredInvoices.length"
          :per-page="invoicePerPage"
          @update:page="invoicePage = $event"
        />
      </div>
    </div>

  </div>

  <ApproveTransferModal
    v-if="showApproveModal && selectedTransfer"
    :transfer="selectedTransfer"
    @close="showApproveModal = false"
    @approve="handleApprove"
  />

  <DeclineTransferModal
    v-if="showDeclineModal && selectedDeclineTransfer"
    :transfer="selectedDeclineTransfer"
    @close="showDeclineModal = false"
    @decline="handleDecline"
  />
</template>
