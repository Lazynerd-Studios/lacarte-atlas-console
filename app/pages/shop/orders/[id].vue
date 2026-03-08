<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const deliveryStatus = ref('delivered')
const deliveryStatuses = ['pending', 'processing', 'in-transit', 'delivered']

const order = {
  id: 'ORD-2026-001',
  placedAt: 'March 1, 2026 at 10:45 AM',
  item: { name: 'Standard Waste Bin', sku: 'WB-120-STD', qty: 2, total: 'GHS 179.98' },
  customer: { name: 'Sarah Johnson', email: 'sarah.j@email.com', phone: '(555) 123-4567' },
  address: { line1: '123 Oak Street', line2: 'Downtown, 12345' },
  summary: { subtotal: 'GHS 179.98', shipping: 'Free', tax: 'GHS 0.00', total: 'GHS 179.98' },
}

const timeline = [
  { label: 'Order Delivered',  time: 'March 3, 2026 at 2:30 PM',  done: true },
  { label: 'Out for Delivery', time: 'March 3, 2026 at 9:00 AM',  done: true },
  { label: 'Processing',       time: 'March 1, 2026 at 11:00 AM', done: true },
  { label: 'Order Placed',     time: 'March 1, 2026 at 10:45 AM', done: true, last: true },
]
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:32px">

    <!-- Back link -->
    <NuxtLink to="/shop/orders" style="display:inline-flex;align-items:center;gap:6px;text-decoration:none;color:#6b7280;font-size:14px;font-family:'Manrope',sans-serif;width:fit-content">
      <UIcon name="i-lucide-arrow-left" style="width:16px;height:16px" />
      Back to Orders
    </NuxtLink>

    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between">
      <div>
        <h1 style="font-size:32px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;line-height:1.3">{{ order.id }}</h1>
        <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:8px">Placed on {{ order.placedAt }}</p>
      </div>
      <button
        style="height:40px;padding:0 20px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer;display:flex;align-items:center;gap:8px"
        @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
        @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
      >
        <UIcon name="i-lucide-printer" style="width:16px;height:16px" />
        Print Invoice
      </button>
    </div>

    <!-- Main grid -->
    <div style="display:grid;grid-template-columns:1fr 344px;gap:24px;align-items:start">

      <!-- Left column -->
      <div style="display:flex;flex-direction:column;gap:24px">

        <!-- Order Items card -->
        <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:25px 25px 1px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
          <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin-bottom:16px">Order Items</p>
          <div style="display:flex;align-items:center;gap:16px;padding-bottom:20px;border-bottom:1px solid #e5e7eb">
            <!-- Product icon placeholder -->
            <div style="width:64px;height:64px;background:#f8f9fa;border-radius:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <UIcon name="i-lucide-package" style="width:32px;height:32px;color:#6b7280" />
            </div>
            <div style="flex:1">
              <p style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;margin-bottom:2px">{{ order.item.name }}</p>
              <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">SKU: {{ order.item.sku }}</p>
            </div>
            <div style="text-align:right">
              <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:2px">Qty: {{ order.item.qty }}</p>
              <p style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">{{ order.item.total }}</p>
            </div>
          </div>
        </div>

        <!-- Order Timeline card -->
        <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:25px 25px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
          <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin-bottom:16px">Order Timeline</p>
          <div style="display:flex;flex-direction:column;gap:0">
            <div
              v-for="(step, i) in timeline"
              :key="i"
              style="display:flex;gap:12px"
            >
              <!-- Dot + line -->
              <div style="display:flex;flex-direction:column;align-items:center;width:12px;flex-shrink:0">
                <div style="width:12px;height:12px;border-radius:50%;background:#22c55e;flex-shrink:0;margin-top:4px"></div>
                <div v-if="!step.last" style="width:2px;flex:1;background:#e5e7eb;min-height:24px"></div>
              </div>
              <!-- Content -->
              <div :style="`padding-bottom:${step.last ? '0' : '16px'}`">
                <p style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;line-height:1.4">{{ step.label }}</p>
                <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;line-height:1.4">{{ step.time }}</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Right column -->
      <div style="display:flex;flex-direction:column;gap:24px">

        <!-- Customer Information card -->
        <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:25px 25px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
          <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin-bottom:16px">Customer Information</p>
          <div style="display:flex;flex-direction:column;gap:12px">
            <div v-for="field in [
              { label: 'Name',  value: order.customer.name },
              { label: 'Email', value: order.customer.email },
              { label: 'Phone', value: order.customer.phone },
            ]" :key="field.label">
              <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;line-height:1.4">{{ field.label }}</p>
              <p style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;line-height:1.4">{{ field.value }}</p>
            </div>
          </div>
        </div>

        <!-- Delivery Address card -->
        <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:25px 25px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
          <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin-bottom:16px">Delivery Address</p>
          <p style="font-size:14px;color:#111;font-family:'Manrope',sans-serif;line-height:1.6">
            {{ order.address.line1 }}<br>{{ order.address.line2 }}
          </p>
        </div>

        <!-- Order Summary card -->
        <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:25px 25px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
          <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin-bottom:16px">Order Summary</p>
          <div style="display:flex;flex-direction:column;gap:8px">
            <div v-for="row in [
              { label: 'Subtotal', value: order.summary.subtotal },
              { label: 'Shipping', value: order.summary.shipping },
              { label: 'Tax',      value: order.summary.tax },
            ]" :key="row.label" style="display:flex;justify-content:space-between">
              <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ row.label }}</span>
              <span style="font-size:14px;color:#111;font-family:'Manrope',sans-serif">{{ row.value }}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding-top:9px;border-top:1px solid #e5e7eb;margin-top:4px">
              <span style="font-size:16px;font-weight:700;color:#111;font-family:'Manrope',sans-serif">Total</span>
              <span style="font-size:18px;font-weight:700;color:#111;font-family:'Manrope',sans-serif">{{ order.summary.total }}</span>
            </div>
          </div>
        </div>

        <!-- Update Status card -->
        <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
          <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin-bottom:16px">Update Status</p>
          <div style="display:flex;flex-direction:column;gap:16px">
            <div style="position:relative">
              <select
                v-model="deliveryStatus"
                style="height:42px;border:1px solid #e5e7eb;border-radius:16px;padding:0 36px 0 12px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;width:100%;box-sizing:border-box;appearance:none;background:white;cursor:pointer"
                @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
                @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
              >
                <option v-for="s in deliveryStatuses" :key="s" :value="s">{{ s.charAt(0).toUpperCase() + s.slice(1) }}</option>
              </select>
              <UIcon name="i-lucide-chevron-down" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:#6b7280;pointer-events:none" />
            </div>
            <button
              style="width:100%;height:40px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer;box-shadow:0 1px 3px rgba(255,180,0,0.2)"
              @mouseover="($event.currentTarget as HTMLElement).style.opacity='0.9'"
              @mouseleave="($event.currentTarget as HTMLElement).style.opacity='1'"
            >Update Status</button>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>
