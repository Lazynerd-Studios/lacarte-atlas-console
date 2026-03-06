<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const search = ref('')
const statusFilter = ref('all')
const planFilter = ref('all')

const allCustomers = [
  { name: 'Sarah Johnson',  phone: '(555) 123-4567', address: '123 Oak Street, Downtown',    plan: 'subscription',   lastPickup: '2026-03-01', balance: 0,   status: 'active' },
  { name: 'Michael Chen',   phone: '(555) 234-5678', address: '456 Maple Ave, Westside',     plan: 'pay-as-you-go',  lastPickup: '2026-02-28', balance: 45,  status: 'active' },
  { name: 'Emma Williams',  phone: '(555) 345-6789', address: '789 Pine Road, Eastside',     plan: 'subscription',   lastPickup: '2026-03-02', balance: 0,   status: 'active' },
  { name: 'James Martinez', phone: '(555) 456-7890', address: '321 Birch Lane, Northside',   plan: 'pay-as-you-go',  lastPickup: '2026-02-25', balance: 120, status: 'overdue' },
  { name: 'Olivia Brown',   phone: '(555) 567-8901', address: '654 Cedar Court, Southside',  plan: 'subscription',   lastPickup: '2026-03-01', balance: 0,   status: 'active' },
  { name: 'Robert Garcia',  phone: '(555) 678-9012', address: '987 Elm Street, Downtown',    plan: 'subscription',   lastPickup: '2026-01-15', balance: 0,   status: 'inactive' },
]

const filtered = computed(() => {
  return allCustomers.filter(c => {
    const matchSearch = !search.value || c.name.toLowerCase().includes(search.value.toLowerCase()) || c.phone.includes(search.value)
    const matchStatus = statusFilter.value === 'all' || c.status === statusFilter.value
    const matchPlan   = planFilter.value === 'all' || c.plan === planFilter.value
    return matchSearch && matchStatus && matchPlan
  })
})

const page = ref(1)
const perPage = 6
const paginated = computed(() => filtered.value.slice((page.value - 1) * perPage, page.value * perPage))

watch([search, statusFilter, planFilter], () => { page.value = 1 })

function planBadge(plan: string) {
  if (plan === 'subscription') return { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', color: '#3b82f6', label: 'Subscription' }
  return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280', label: 'Pay-as-you-go' }
}

function statusBadge(status: string) {
  if (status === 'active')   return { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.2)',  color: '#22c55e', label: 'active' }
  if (status === 'overdue')  return { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.2)',  color: '#ef4444', label: 'overdue' }
  return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280', label: 'inactive' }
}
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:24px">
    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between">
      <div>
        <h1 style="font-size:32px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;line-height:1.3">Customers</h1>
        <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:4px">Manage all customer accounts and subscriptions</p>
      </div>
      <button style="height:40px;padding:0 20px;background:#ffb400;border:none;border-radius:1000px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer;box-shadow:0 1px 3px rgba(255,180,0,0.2)">
        Add Customer
      </button>
    </div>

    <!-- Filters card -->
    <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:25px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr auto auto;gap:16px;align-items:center">
        <!-- Search -->
        <div style="position:relative">
          <UIcon name="i-lucide-search" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:#6b7280" />
          <input
            v-model="search"
            type="text"
            placeholder="Search customers..."
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

        <!-- More Filters -->
        <button style="height:42px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer;display:flex;align-items:center;gap:8px;white-space:nowrap">
          <UIcon name="i-lucide-sliders-horizontal" style="width:16px;height:16px;color:#111" />
          More Filters
        </button>

        <!-- Export -->
        <button style="width:48px;height:42px;background:#ececec;border:none;border-radius:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <UIcon name="i-lucide-download" style="width:16px;height:16px;color:#111" />
        </button>
      </div>
    </div>

    <!-- Table card -->
    <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:1px;box-shadow:0 1px 3px rgba(0,0,0,0.1);overflow:hidden">
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f8f9fa;border-bottom:1px solid #e5e7eb">
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">Name</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">Phone</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">Address</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">Plan</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">Last Pickup</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">Balance</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">Status</th>
            <th style="padding:14px 16px;text-align:right;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(c, i) in paginated"
            :key="i"
            style="border-bottom:1px solid #e5e7eb"
            @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
          >
            <td style="padding:16px;font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ c.name }}</td>
            <td style="padding:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ c.phone }}</td>
            <td style="padding:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ c.address }}</td>
            <td style="padding:16px">
              <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;color:${planBadge(c.plan).color};background:${planBadge(c.plan).bg};border:1px solid ${planBadge(c.plan).border};border-radius:14px;padding:3px 10px;white-space:nowrap`">
                {{ planBadge(c.plan).label }}
              </span>
            </td>
            <td style="padding:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ c.lastPickup }}</td>
            <td style="padding:16px;font-size:14px;font-family:'Manrope',sans-serif;white-space:nowrap" :style="c.balance > 0 ? 'color:#ef4444;font-weight:500' : 'color:#1a1a1a'">
              GHS {{ c.balance }}
            </td>
            <td style="padding:16px">
              <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;color:${statusBadge(c.status).color};background:${statusBadge(c.status).bg};border:1px solid ${statusBadge(c.status).border};border-radius:14px;padding:3px 10px;white-space:nowrap`">
                {{ statusBadge(c.status).label }}
              </span>
            </td>
            <td style="padding:16px">
              <div style="display:flex;align-items:center;justify-content:flex-end;gap:8px">
                <button
                  style="width:32px;height:32px;border-radius:20px;background:none;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center"
                  title="View"
                  @mouseover="($event.currentTarget as HTMLElement).style.background='#f3f4f6'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
                >
                  <UIcon name="i-lucide-eye" style="width:16px;height:16px;color:#6b7280" />
                </button>
                <button
                  style="width:32px;height:32px;border-radius:20px;background:none;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center"
                  title="Deactivate"
                  @mouseover="($event.currentTarget as HTMLElement).style.background='#fef2f2'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
                >
                  <UIcon name="i-lucide-user-x" style="width:16px;height:16px;color:#6b7280" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="paginated.length === 0">
            <td colspan="8" style="padding:48px 16px;text-align:center;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">No customers found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <AppPagination :page="page" :total="filtered.length" :per-page="perPage" @update:page="page = $event" />
  </div>
</template>
