<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const id = route.params.id as string
const { format } = useCurrency()

// Mock invoice data — in real app this would be fetched by id
const invoice = reactive({
  id: id || 'INV-2026-001',
  status: 'paid',
  from: {
    name: 'LaCarte Waste Management',
    address1: '123 Business St',
    address2: 'City, State 12345',
    email: 'contact@lacarte.com',
  },
  billTo: {
    name: 'Sarah Johnson',
    address1: '123 Oak Street',
    address2: 'Downtown, 12345',
    email: 'sarah.j@email.com',
  },
  invoiceDate: 'March 1, 2026',
  dueDate: 'March 15, 2026',
  paymentMethod: 'Card ending 4242',
  items: [
    { description: 'Monthly Subscription - Weekly Pickup', qty: 1, rate: 45, amount: 45 },
  ],
  subtotal: 45,
  tax: 0,
  taxRate: '0%',
  total: 45,
})

function statusBadge(s: string) {
  if (s === 'paid')    return { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.2)',  color: '#22c55e', label: 'Paid' }
  if (s === 'pending') return { bg: 'rgba(255,180,0,0.1)',  border: 'rgba(255,180,0,0.2)',  color: '#d49a00', label: 'Pending' }
  if (s === 'overdue') return { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.2)',  color: '#ef4444', label: 'Overdue' }
  return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280', label: s }
}
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:24px">

    <!-- Back link -->
    <NuxtLink to="/billing" style="display:inline-flex;align-items:center;gap:8px;text-decoration:none">
      <UIcon name="i-lucide-arrow-left" style="width:16px;height:16px;color:#6b7280" />
      <span style="font-size:16px;color:#6b7280;font-family:'Manrope',sans-serif">Back to Billing</span>
    </NuxtLink>

    <!-- Invoice card -->
    <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:1px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
      <div style="padding:20px 32px;display:flex;flex-direction:column;gap:32px">

        <!-- Header: invoice id + status + buttons -->
        <div style="display:flex;align-items:flex-start;justify-content:space-between">
          <div>
            <h1 style="font-size:32px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;line-height:1.3">{{ invoice.id }}</h1>
            <span
              :style="`display:inline-block;margin-top:8px;font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 10px;color:${statusBadge(invoice.status).color};background:${statusBadge(invoice.status).bg};border:1px solid ${statusBadge(invoice.status).border}`"
            >{{ statusBadge(invoice.status).label }}</span>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <button
              style="height:40px;padding:0 16px 0 40px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer;position:relative;display:flex;align-items:center;gap:8px"
              @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
              @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
            >
              <UIcon name="i-lucide-download" style="width:16px;height:16px;color:#111;position:absolute;left:16px" />
              Download PDF
            </button>
            <button
              style="height:40px;padding:0 16px 0 40px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer;position:relative;display:flex;align-items:center;gap:8px"
              @mouseover="($event.currentTarget as HTMLElement).style.opacity='0.9'"
              @mouseleave="($event.currentTarget as HTMLElement).style.opacity='1'"
            >
              <UIcon name="i-lucide-send" style="width:16px;height:16px;color:#111;position:absolute;left:16px" />
              Send
            </button>
          </div>
        </div>

        <!-- From / Bill To -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px">
          <div>
            <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin-bottom:16px">From</p>
            <p style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;margin-bottom:4px">{{ invoice.from.name }}</p>
            <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;line-height:1.6">
              {{ invoice.from.address1 }}<br>
              {{ invoice.from.address2 }}<br>
              {{ invoice.from.email }}
            </p>
          </div>
          <div>
            <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin-bottom:16px">Bill To</p>
            <p style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;margin-bottom:4px">{{ invoice.billTo.name }}</p>
            <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;line-height:1.6">
              {{ invoice.billTo.address1 }}<br>
              {{ invoice.billTo.address2 }}<br>
              {{ invoice.billTo.email }}
            </p>
          </div>
        </div>

        <!-- Invoice meta: date / due / payment method -->
        <div style="border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;padding:24px 0">
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">
            <div>
              <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:4px">Invoice Date</p>
              <p style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">{{ invoice.invoiceDate }}</p>
            </div>
            <div>
              <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:4px">Due Date</p>
              <p style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">{{ invoice.dueDate }}</p>
            </div>
            <div>
              <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:4px">Payment Method</p>
              <p style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">{{ invoice.paymentMethod }}</p>
            </div>
          </div>
        </div>

        <!-- Invoice Details table -->
        <div style="display:flex;flex-direction:column;gap:16px">
          <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Invoice Details</p>
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="border-bottom:1px solid #e5e7eb">
                <th style="padding:12px 0;text-align:left;font-size:14px;font-weight:500;color:#6b7280;font-family:'Manrope',sans-serif">Description</th>
                <th style="padding:12px 0;text-align:right;font-size:14px;font-weight:500;color:#6b7280;font-family:'Manrope',sans-serif">Quantity</th>
                <th style="padding:12px 0;text-align:right;font-size:14px;font-weight:500;color:#6b7280;font-family:'Manrope',sans-serif">Rate</th>
                <th style="padding:12px 0;text-align:right;font-size:14px;font-weight:500;color:#6b7280;font-family:'Manrope',sans-serif">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, i) in invoice.items"
                :key="i"
                style="border-bottom:1px solid #e5e7eb"
              >
                <td style="padding:12px 0;font-size:16px;color:#111;font-family:'Manrope',sans-serif">{{ item.description }}</td>
                <td style="padding:12px 0;font-size:16px;color:#111;font-family:'Manrope',sans-serif;text-align:right">{{ item.qty }}</td>
                <td style="padding:12px 0;font-size:16px;color:#111;font-family:'Manrope',sans-serif;text-align:right">{{ format(item.rate) }}</td>
                <td style="padding:12px 0;font-size:16px;color:#111;font-family:'Manrope',sans-serif;text-align:right">{{ format(item.amount) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Totals -->
        <div style="display:flex;justify-content:flex-end">
          <div style="width:256px;display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;justify-content:space-between">
              <span style="font-size:16px;color:#6b7280;font-family:'Manrope',sans-serif">Subtotal</span>
              <span style="font-size:16px;color:#111;font-family:'Manrope',sans-serif">{{ format(invoice.subtotal) }}</span>
            </div>
            <div style="display:flex;justify-content:space-between">
              <span style="font-size:16px;color:#6b7280;font-family:'Manrope',sans-serif">Tax ({{ invoice.taxRate }})</span>
              <span style="font-size:16px;color:#111;font-family:'Manrope',sans-serif">{{ format(invoice.tax) }}</span>
            </div>
            <div style="border-top:1px solid #e5e7eb;padding-top:8px;display:flex;justify-content:space-between">
              <span style="font-size:16px;font-weight:700;color:#111;font-family:'Manrope',sans-serif">Total</span>
              <span style="font-size:18px;font-weight:700;color:#111;font-family:'Manrope',sans-serif">{{ format(invoice.total) }}</span>
            </div>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>
