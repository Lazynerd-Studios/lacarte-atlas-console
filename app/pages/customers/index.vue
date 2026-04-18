<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const showModal = ref(false)
const showSuspendModal = ref(false)
const selectedCustomer = ref<any | null>(null)

function openSuspend(c: any) {
  selectedCustomer.value = c
  showSuspendModal.value = true
}

function handleSuspend(reason: string) {
  console.log('Suspend', selectedCustomer.value?.user?.name, 'reason:', reason)
  showSuspendModal.value = false
  selectedCustomer.value = null
}

const search = ref('')
const statusFilter = ref('all')
const planFilter = ref('all')

const customers = ref<any[]>([])
const total = ref(0)
const loading = ref(true)
const page = ref(1)
const perPage = 20

async function fetchCustomers() {
  loading.value = true
  const params = new URLSearchParams()
  params.set('page', String(page.value))
  params.set('limit', String(perPage))
  if (search.value) params.set('search', search.value)
  if (statusFilter.value !== 'all') params.set('status', statusFilter.value)

  const api = useApi()
  const data = await api.get<{ data: any[]; pagination: any }>(`/customer/admin/list?${params}`)
  if (data) {
    customers.value = data.data
    total.value = data.pagination.total
  }
  loading.value = false
}

watch([search, statusFilter, planFilter], () => { page.value = 1; fetchCustomers() })
watch(page, fetchCustomers)
onMounted(fetchCustomers)

function handleAddCustomer(data: Record<string, unknown>) {
  // TODO: call API to create customer
  console.log('New customer:', data)
  showModal.value = false
}

function planBadge(plan: string | undefined) {
  if (!plan) return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280', label: '—' }
  const lower = plan.toLowerCase()
  if (lower.includes('subscription')) return { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', color: '#3b82f6', label: plan }
  return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280', label: plan }
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
    <PageSkeleton v-if="loading" type="table" :rows="8" :cards="0" />

    <!-- Content -->
    <template v-else>
    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between">
      <div>
        <h1 style="font-size:32px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;line-height:1.3">Customers</h1>
        <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:4px">Manage all customer accounts and subscriptions</p>
      </div>
      <button style="height:40px;padding:0 20px;background:#ffb400;border:none;border-radius:1000px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer;box-shadow:0 1px 3px rgba(255,180,0,0.2)" @click="showModal = true">
        Add Customer
      </button>
    </div>

    <!-- Filters card -->
    <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:25px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr auto auto;gap:16px;align-items:center" class="filters-grid">
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

        <!-- Filter -->
        <button style="height:42px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer;display:flex;align-items:center;gap:8px;white-space:nowrap">
          <UIcon name="i-lucide-sliders-horizontal" style="width:16px;height:16px;color:#111" />
          Filter
        </button>

        <!-- Export -->
        <button style="width:48px;height:42px;background:#ececec;border:none;border-radius:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <UIcon name="i-lucide-download" style="width:16px;height:16px;color:#111" />
        </button>
      </div>
    </div>

    <!-- Table card -->
    <div class="table-scroll" style="background:white;border:1px solid #ececec;border-radius:16px;padding:1px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
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
            v-for="c in customers"
            :key="c.id"
            style="border-bottom:1px solid #e5e7eb"
            @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
          >
            <td style="padding:16px;font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ c.user?.name }}</td>
            <td style="padding:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ c.phoneNumber }}</td>
            <td style="padding:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ c.address }}</td>
            <td style="padding:16px">
              <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;color:${planBadge(c.customerType?.name).color};background:${planBadge(c.customerType?.name).bg};border:1px solid ${planBadge(c.customerType?.name).border};border-radius:14px;padding:3px 10px;white-space:nowrap`">
                {{ planBadge(c.customerType?.name).label }}
              </span>
            </td>
            <td style="padding:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ c.lastPickup }}</td>
            <td style="padding:16px;font-size:14px;font-family:'Manrope',sans-serif;white-space:nowrap" :style="c.balance > 0 ? 'color:#ef4444;font-weight:500' : 'color:#1a1a1a'">
              GHS {{ c.balance ?? 0 }}
            </td>
            <td style="padding:16px">
              <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;color:${statusBadge(c.status).color};background:${statusBadge(c.status).bg};border:1px solid ${statusBadge(c.status).border};border-radius:14px;padding:3px 10px;white-space:nowrap`">
                {{ statusBadge(c.status).label }}
              </span>
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
                  style="width:32px;height:32px;border-radius:20px;background:none;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center"
                  title="Suspend"
                  @click="openSuspend(c)"
                  @mouseover="($event.currentTarget as HTMLElement).style.background='#fef2f2'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
                >
                  <UIcon name="i-lucide-user-x" style="width:16px;height:16px;color:#ef4444" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="customers.length === 0">
            <td colspan="8" style="padding:48px 16px;text-align:center;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">No customers found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <AppPagination :page="page" :total="total" :per-page="perPage" @update:page="page = $event" />
    
    </template><!-- end content -->
  </div>

  <!-- Add Customer Modal -->
  <CustomerModal v-if="showModal" @close="showModal = false" @submit="handleAddCustomer" />

  <!-- Suspend Modal -->
  <SuspendModal
    v-if="showSuspendModal && selectedCustomer"
    :customer-name="selectedCustomer.user?.name ?? selectedCustomer.name"
    @close="showSuspendModal = false"
    @confirm="handleSuspend"
  />
</template>
