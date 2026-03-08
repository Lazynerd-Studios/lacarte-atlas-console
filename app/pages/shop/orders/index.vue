<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const orders = ref([
  { id: 'ORD-2026-001', customer: 'Sarah Johnson',  items: '2x Waste Bins',               total: 'GHS 179.98', paymentStatus: 'paid',    deliveryStatus: 'delivered',  date: '2026-03-01' },
  { id: 'ORD-2026-002', customer: 'Michael Chen',   items: '1x Bin Bags (50 pack)',        total: 'GHS 24.99',  paymentStatus: 'paid',    deliveryStatus: 'in-transit', date: '2026-03-02' },
  { id: 'ORD-2026-003', customer: 'Emma Williams',  items: '1x Recycling Bin, 1x Brush',   total: 'GHS 94.98',  paymentStatus: 'paid',    deliveryStatus: 'processing', date: '2026-03-02' },
  { id: 'ORD-2026-004', customer: 'James Martinez', items: '2x Soap (3 pack)',              total: 'GHS 25.98',  paymentStatus: 'pending', deliveryStatus: 'pending',    date: '2026-03-02' },
  { id: 'ORD-2026-005', customer: 'Olivia Brown',   items: '1x Large Waste Bin 240L',      total: 'GHS 129.99', paymentStatus: 'paid',    deliveryStatus: 'delivered',  date: '2026-03-03' },
  { id: 'ORD-2026-006', customer: 'David Wilson',   items: '3x Bin Liner Roll 100pk',      total: 'GHS 59.97',  paymentStatus: 'paid',    deliveryStatus: 'in-transit', date: '2026-03-03' },
  { id: 'ORD-2026-007', customer: 'Lisa Anderson',  items: '1x Odour Control Spray',       total: 'GHS 9.99',   paymentStatus: 'pending', deliveryStatus: 'pending',    date: '2026-03-04' },
  { id: 'ORD-2026-008', customer: 'Robert Taylor',  items: '2x Eco-Friendly Bin Bags',     total: 'GHS 79.98',  paymentStatus: 'paid',    deliveryStatus: 'processing', date: '2026-03-04' },
  { id: 'ORD-2026-009', customer: 'Karen White',    items: '1x Mini Recycling Bin 40L',    total: 'GHS 49.99',  paymentStatus: 'paid',    deliveryStatus: 'delivered',  date: '2026-03-05' },
  { id: 'ORD-2026-010', customer: 'Chris Harris',   items: '1x Long Handle Bin Brush',     total: 'GHS 18.99',  paymentStatus: 'paid',    deliveryStatus: 'delivered',  date: '2026-03-05' },
  { id: 'ORD-2026-011', customer: 'Amanda Clark',   items: '2x Standard Waste Bin',        total: 'GHS 179.98', paymentStatus: 'pending', deliveryStatus: 'pending',    date: '2026-03-06' },
  { id: 'ORD-2026-012', customer: 'Daniel Lewis',   items: '1x Bin Cleaning Brush',        total: 'GHS 14.99',  paymentStatus: 'paid',    deliveryStatus: 'in-transit', date: '2026-03-06' },
])

const search = ref('')
const currentPage = ref(1)
const perPage = 10

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return orders.value
  return orders.value.filter(o =>
    o.customer.toLowerCase().includes(q) ||
    o.id.toLowerCase().includes(q) ||
    o.items.toLowerCase().includes(q) ||
    o.deliveryStatus.toLowerCase().includes(q) ||
    o.paymentStatus.toLowerCase().includes(q)
  )
})

const paginated = computed(() => {
  const start = (currentPage.value - 1) * perPage
  return filtered.value.slice(start, start + perPage)
})

watch(search, () => { currentPage.value = 1 })

function paymentBadge(s: string) {
  if (s === 'paid')    return { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.2)',  color: '#22c55e' }
  if (s === 'pending') return { bg: 'rgba(255,180,0,0.1)',  border: 'rgba(255,180,0,0.2)',  color: '#d49a00' }
  return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280' }
}

function deliveryBadge(s: string) {
  if (s === 'delivered')  return { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.2)',  color: '#22c55e' }
  if (s === 'in-transit') return { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', color: '#3b82f6' }
  return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280' }
}
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
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">Order ID</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Customer</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Items</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Total</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">Payment Status</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">Delivery Status</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Date</th>
            <th style="padding:14px 16px;text-align:right;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(order, i) in paginated"
            :key="order.id"
            :style="`border-bottom:${i < paginated.length - 1 ? '1px solid #e5e7eb' : 'none'}`"
            @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
          >
            <td style="padding:20px 16px;font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ order.id }}</td>
            <td style="padding:20px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ order.customer }}</td>
            <td style="padding:20px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ order.items }}</td>
            <td style="padding:20px 16px;font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ order.total }}</td>
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
            <td style="padding:20px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ order.date }}</td>
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
          <tr v-if="paginated.length === 0">
            <td colspan="8" style="padding:32px 16px;text-align:center;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">No orders match your search.</td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div style="padding-top:16px;border-top:1px solid #e5e7eb;margin-top:4px">
        <AppPagination
          :page="currentPage"
          :total="filtered.length"
          :per-page="perPage"
          @update:page="currentPage = $event"
        />
      </div>
    </div>

  </div>
</template>
