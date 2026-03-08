<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const orders = ref([
  { id: 'ORD-2026-001', customer: 'Sarah Johnson',  items: '2x Waste Bins',              total: 'GHS 179.98', paymentStatus: 'paid',    deliveryStatus: 'delivered',  date: '2026-03-01' },
  { id: 'ORD-2026-002', customer: 'Michael Chen',   items: '1x Bin Bags (50 pack)',       total: 'GHS 24.99',  paymentStatus: 'paid',    deliveryStatus: 'in-transit', date: '2026-03-02' },
  { id: 'ORD-2026-003', customer: 'Emma Williams',  items: '1x Recycling Bin, 1x Brush',  total: 'GHS 94.98',  paymentStatus: 'paid',    deliveryStatus: 'processing', date: '2026-03-02' },
  { id: 'ORD-2026-004', customer: 'James Martinez', items: '2x Soap (3 pack)',             total: 'GHS 25.98',  paymentStatus: 'pending', deliveryStatus: 'pending',    date: '2026-03-02' },
])

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
    <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:1px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
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
            v-for="(order, i) in orders"
            :key="order.id"
            :style="`border-bottom:${i < orders.length - 1 ? '1px solid #e5e7eb' : 'none'}`"
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
        </tbody>
      </table>
    </div>

  </div>
</template>
