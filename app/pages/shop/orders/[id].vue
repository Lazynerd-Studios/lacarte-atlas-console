<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const api = useApi()
const toast = useAppToast()

interface OrderItem {
  id: string
  productId: string
  productName: string
  sku: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

interface OrderDetail {
  id: string
  orderNumber: string
  customer: { id: string; name: string; email: string; phone: string }
  items: OrderItem[]
  deliveryAddress: { street: string; city: string; region: string; postalCode: string | null; country: string }
  subtotal: number
  shipping: number
  tax: number
  total: number
  paymentStatus: string
  deliveryStatus: string
  paymentProvider: string
  paymentProviderRef: string
  statusHistory: { fromStatus: string | null; toStatus: string; changedBy: string | null; notes: string | null; createdAt: string }[]
  timeline: { status: string; timestamp: string }[]
  deliveredAt: string | null
  createdAt: string
}

const order = ref<OrderDetail | null>(null)
const loading = ref(true)
const downloading = ref(false)

const deliveryStatus = ref('')
const statusNotes = ref('')
const updatingStatus = ref(false)
const deliveryStatuses = ['pending', 'processing', 'in-transit', 'out-for-delivery', 'delivered']

async function fetchOrder() {
  loading.value = true
  try {
    const data = await api.get<OrderDetail>(
      `/store-orders/admin/orders/${route.params.id}`,
      'Failed to load order details'
    )
    if (data) {
      order.value = data
      deliveryStatus.value = data.deliveryStatus
    }
  } catch (err) {
    console.error('Error fetching order:', err)
  }
  loading.value = false
}

async function updateStatus() {
  if (!order.value) return
  updatingStatus.value = true
  try {
    const data = await api.patch<OrderDetail>(
      `/store-orders/admin/orders/${route.params.id}/status`,
      { deliveryStatus: deliveryStatus.value, notes: statusNotes.value || '' },
      'Failed to update status'
    )
    if (data) {
      order.value = data
      deliveryStatus.value = data.deliveryStatus
      statusNotes.value = ''
      toast.success('Status Updated', `Order status changed to ${data.deliveryStatus}`)
    }
  } catch (err) {
    console.error('Error updating status:', err)
  }
  updatingStatus.value = false
}

async function downloadInvoice() {
  downloading.value = true
  try {
    const config = useRuntimeConfig()
    const authStore = useAuthStore()
    const res = await fetch(`${config.public.apiBase}/store-orders/admin/orders/${route.params.id}/invoice/pdf`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
      },
    })
    if (!res.ok) throw new Error('Failed to download invoice')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${order.value?.orderNumber || 'order'}-invoice.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Invoice Downloaded', 'PDF saved successfully')
  } catch {
    toast.error('Download Failed', 'Could not download invoice PDF')
  } finally {
    downloading.value = false
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '\u2014'
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) + ' at ' + new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

onMounted(() => {
  fetchOrder()
})
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:32px">

    <!-- Back link -->
    <NuxtLink to="/shop/orders" style="display:inline-flex;align-items:center;gap:6px;text-decoration:none;color:#6b7280;font-size:14px;font-family:'Manrope',sans-serif;width:fit-content">
      <UIcon name="i-lucide-arrow-left" style="width:16px;height:16px" />
      Back to Orders
    </NuxtLink>

    <!-- Loading -->
    <div v-if="loading" style="padding:60px 0;text-align:center;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Loading order details...</div>

    <template v-else-if="order">
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div>
          <h1 style="font-size:32px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;line-height:1.3">{{ order.orderNumber }}</h1>
          <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:8px">Placed on {{ formatDate(order.createdAt) }}</p>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:5px 12px;white-space:nowrap;background:${order.paymentStatus === 'paid' ? 'rgba(34,197,94,0.1)' : 'rgba(255,180,0,0.1)'};color:${order.paymentStatus === 'paid' ? '#22c55e' : '#d49a00'};border:1px solid ${order.paymentStatus === 'paid' ? 'rgba(34,197,94,0.2)' : 'rgba(255,180,0,0.2)'}`">
            {{ order.paymentStatus }}
          </span>
          <button
            :disabled="downloading"
            style="height:40px;padding:0 20px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer;display:flex;align-items:center;gap:8px"
            @click="downloadInvoice"
            @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
          >
            <UIcon name="i-lucide-download" style="width:16px;height:16px" />
            {{ downloading ? 'Downloading...' : 'Download Invoice' }}
          </button>
        </div>
      </div>

      <!-- Main grid -->
      <div style="display:grid;grid-template-columns:1fr 344px;gap:24px;align-items:start">

        <!-- Left column -->
        <div style="display:flex;flex-direction:column;gap:24px">

          <!-- Order Items card -->
          <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:25px 25px 5px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
            <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin-bottom:16px">Order Items</p>
            <div
              v-for="(item, idx) in order.items"
              :key="item.id"
              :style="`display:flex;align-items:center;gap:16px;padding-bottom:20px;${idx < order.items.length - 1 ? 'border-bottom:1px solid #e5e7eb;margin-bottom:16px' : ''}`"
            >
              <div style="width:64px;height:64px;background:#f8f9fa;border-radius:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <UIcon name="i-lucide-package" style="width:32px;height:32px;color:#6b7280" />
              </div>
              <div style="flex:1">
                <p style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;margin-bottom:2px">{{ item.productName }}</p>
                <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">SKU: {{ item.sku }}</p>
              </div>
              <div style="text-align:right">
                <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:2px">Qty: {{ item.quantity }} × GHS {{ item.unitPrice.toFixed(2) }}</p>
                <p style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">GHS {{ item.lineTotal.toFixed(2) }}</p>
              </div>
            </div>
          </div>

          <!-- Order Timeline card -->
          <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:25px 25px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
            <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin-bottom:16px">Order Timeline</p>
            <div style="display:flex;flex-direction:column;gap:0">
              <div
                v-for="(step, i) in order.timeline"
                :key="i"
                style="display:flex;gap:12px"
              >
                <!-- Dot + line -->
                <div style="display:flex;flex-direction:column;align-items:center;width:12px;flex-shrink:0">
                  <div :style="`width:12px;height:12px;border-radius:50%;background:${i === 0 ? '#22c55e' : '#d1d5db'};flex-shrink:0;margin-top:4px`"></div>
                  <div v-if="i < order.timeline.length - 1" style="width:2px;flex:1;background:#e5e7eb;min-height:24px"></div>
                </div>
                <!-- Content -->
                <div :style="`padding-bottom:${i === order.timeline.length - 1 ? '0' : '16px'}`">
                  <p style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;line-height:1.4">{{ step.status }}</p>
                  <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;line-height:1.4">{{ formatDate(step.timestamp) }}</p>
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
              {{ order.deliveryAddress.street }}<br>
              {{ order.deliveryAddress.city }}, {{ order.deliveryAddress.region }}<br>
              {{ order.deliveryAddress.country }}
            </p>
          </div>

          <!-- Payment Info card -->
          <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:25px 25px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
            <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin-bottom:16px">Payment</p>
            <div style="display:flex;flex-direction:column;gap:12px">
              <div>
                <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;line-height:1.4">Provider</p>
                <p style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;line-height:1.4;text-transform:capitalize">{{ order.paymentProvider }}</p>
              </div>
              <div>
                <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;line-height:1.4">Reference</p>
                <p style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;line-height:1.4">{{ order.paymentProviderRef }}</p>
              </div>
            </div>
          </div>

          <!-- Order Summary card -->
          <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:25px 25px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
            <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin-bottom:16px">Order Summary</p>
            <div style="display:flex;flex-direction:column;gap:8px">
              <div v-for="row in [
                { label: 'Subtotal', value: `GHS ${order.subtotal.toFixed(2)}` },
                { label: 'Shipping', value: order.shipping === 0 ? 'Free' : `GHS ${order.shipping.toFixed(2)}` },
                { label: 'Tax',      value: `GHS ${order.tax.toFixed(2)}` },
              ]" :key="row.label" style="display:flex;justify-content:space-between">
                <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ row.label }}</span>
                <span style="font-size:14px;color:#111;font-family:'Manrope',sans-serif">{{ row.value }}</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding-top:9px;border-top:1px solid #e5e7eb;margin-top:4px">
                <span style="font-size:16px;font-weight:700;color:#111;font-family:'Manrope',sans-serif">Total</span>
                <span style="font-size:18px;font-weight:700;color:#111;font-family:'Manrope',sans-serif">GHS {{ order.total.toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <!-- Update Status card -->
          <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
            <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin-bottom:16px">Update Delivery Status</p>
            <div style="display:flex;flex-direction:column;gap:12px">
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
              <input
                v-model="statusNotes"
                type="text"
                placeholder="Notes (optional)"
                style="height:42px;border:1px solid #e5e7eb;border-radius:16px;padding:0 12px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;width:100%;box-sizing:border-box;background:white"
                @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
                @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
              />
              <button
                :disabled="updatingStatus"
                style="width:100%;height:40px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer;box-shadow:0 1px 3px rgba(255,180,0,0.2)"
                @click="updateStatus"
                @mouseover="($event.currentTarget as HTMLElement).style.opacity='0.9'"
                @mouseleave="($event.currentTarget as HTMLElement).style.opacity='1'"
              >{{ updatingStatus ? 'Updating...' : 'Update Status' }}</button>
            </div>
          </div>

        </div>
      </div>
    </template>

  </div>
</template>
