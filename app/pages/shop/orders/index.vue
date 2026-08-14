<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const api = useApi()

interface Order {
  id: string
  orderNumber: string
  customerName: string
  itemCount: string
  total: number
  paymentStatus: string
  deliveryStatus: string
  createdAt: string | null
}

interface OrdersResponse {
  data: Order[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

const orders = ref<Order[]>([])
const ordersLoading = ref(false)
const totalOrders = ref(0)

const search = ref('')
const currentPage = ref(1)
const perPage = 20

async function fetchOrders() {
  ordersLoading.value = true
  try {
    const data = await api.get<OrdersResponse>(
      `/store-orders/admin/orders/?page=${currentPage.value}&limit=${perPage}`,
      'Failed to load orders'
    )
    if (data?.data) {
      orders.value = data.data
      totalOrders.value = data.pagination?.total ?? data.data.length
    }
  } catch (err) {
    console.error('Error fetching orders:', err)
  }
  ordersLoading.value = false
}

const filtered = computed(() => {
  const q = search.value?.toLowerCase().trim() || ''
  if (!q) return orders.value
  return orders.value.filter(o =>
    (o.customerName?.toLowerCase().includes(q) ?? false) ||
    (o.orderNumber?.toLowerCase().includes(q) ?? false) ||
    (o.deliveryStatus?.toLowerCase().includes(q) ?? false) ||
    (o.paymentStatus?.toLowerCase().includes(q) ?? false)
  )
})

watch(search, () => { currentPage.value = 1 })
watch(currentPage, () => { fetchOrders() })

function paymentBadge(s: string) {
  if (s === 'paid')    return { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.2)',  color: '#22c55e' }
  if (s === 'pending') return { bg: 'rgba(255,180,0,0.1)',  border: 'rgba(255,180,0,0.2)',  color: '#d49a00' }
  return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280' }
}

function deliveryBadge(s: string) {
  if (s === 'delivered')  return { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.2)',  color: '#22c55e' }
  if (s === 'in-transit') return { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', color: '#3b82f6' }
  if (s === 'processing') return { bg: 'rgba(255,180,0,0.1)',  border: 'rgba(255,180,0,0.2)',  color: '#d49a00' }
  return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280' }
}

onMounted(() => {
  fetchOrders()
})
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:32px">

    <!-- Back link -->
    <NuxtLink to="/shop" style="display:inline-flex;align-items:center;gap:6px;text-decoration:none;color:#6b7280;font-size:14px;font-family:'Manrope',sans-serif;width:fit-content">
      <UIcon name="i-lucide-arrow-left" style="width:16px;height:16px" />
      Back to Shop
    </NuxtLink>

    <!-- Header -->
    <div>
      <h1 style="font-size:32px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;line-height:1.3">Orders</h1>
      <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:8px">View and manage customer orders</p>
    </div>

    <!-- Table card -->
    <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:25px 25px 20px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">

      <!-- Search -->
      <div style="position:relative;margin-bottom:16px;max-width:320px">
        <UIcon name="i-lucide-search" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:#6b7280;pointer-events:none" />
        <input
          v-model="search"
          type="text"
          placeholder="Search orders..."
          style="width:100%;height:38px;padding:0 12px 0 36px;border:1px solid #e5e7eb;border-radius:20px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box;background:white"
          @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
          @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
        />
      </div>

      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f8f9fa;border-bottom:1px solid #e5e7eb">
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">Order #</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Customer</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Items</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Total</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">Payment</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">Delivery</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Date</th>
            <th style="padding:14px 16px;text-align:right;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(order, i) in filtered"
            :key="order.id"
            :style="`border-bottom:${i < filtered.length - 1 ? '1px solid #e5e7eb' : 'none'}`"
            @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
          >
            <td style="padding:20px 16px;font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ order.orderNumber }}</td>
            <td style="padding:20px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ order.customerName }}</td>
            <td style="padding:20px 16px;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ order.itemCount }}</td>
            <td style="padding:20px 16px;font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">GHS {{ order.total.toFixed(2) }}</td>
            <td style="padding:20px 16px">
              <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 10px;white-space:nowrap;background:${paymentBadge(order.paymentStatus).bg};color:${paymentBadge(order.paymentStatus).color};border:1px solid ${paymentBadge(order.paymentStatus).border}`">
                {{ order.paymentStatus }}
              </span>
            </td>
            <td style="padding:20px 16px">
              <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 10px;white-space:nowrap;background:${deliveryBadge(order.deliveryStatus).bg};color:${deliveryBadge(order.deliveryStatus).color};border:1px solid ${deliveryBadge(order.deliveryStatus).border}`">
                {{ order.deliveryStatus }}
              </span>
            </td>
            <td style="padding:20px 16px;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;white-space:nowrap">{{ order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—' }}</td>
            <td style="padding:20px 16px;text-align:right">
              <NuxtLink :to="`/shop/orders/${order.id}`" style="text-decoration:none">
                <button
                  style="width:32px;height:28px;background:none;border:none;border-radius:20px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center"
                  title="View"
                  @mouseover="($event.currentTarget as HTMLElement).style.background='#f3f4f6'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
                >
                  <UIcon name="i-lucide-eye" style="width:16px;height:16px;color:#6b7280" />
                </button>
              </NuxtLink>
            </td>
          </tr>
          <tr v-if="filtered.length === 0 && !ordersLoading">
            <td colspan="8" style="padding:32px 16px;text-align:center;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">No orders found.</td>
          </tr>
          <template v-if="ordersLoading">
            <tr v-for="i in 5" :key="`sk-${i}`" style="border-bottom:1px solid #e5e7eb">
              <td v-for="j in 8" :key="j" style="padding:20px 16px"><div class="skeleton" style="height:14px;width:100%" /></td>
            </tr>
          </template>
        </tbody>
      </table>

      <!-- Pagination -->
      <div style="padding-top:16px;border-top:1px solid #e5e7eb;margin-top:4px">
        <AppPagination
          :page="currentPage"
          :total="totalOrders"
          :per-page="perPage"
          @update:page="currentPage = $event"
        />
      </div>
    </div>

  </div>
</template>
