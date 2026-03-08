<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const product = {
  name: 'Standard Waste Bin',
  sku: 'WB-120-STD',
  category: 'Bins',
  status: 'active',
  description: 'Durable 120-liter waste bin designed for residential and commercial use. Features weather-resistant construction, easy-lift handles, and compatible with standard waste collection vehicles.',
  price: 'GHS 89.99',
  costPrice: 'GHS 55.00',
  profitMargin: '63.6%',
  stock: 45,
  reorderPoint: '20 units',
  totalSold: '319 units',
}

const quickStats = [
  { icon: 'i-lucide-dollar-sign', label: 'Total Revenue',    value: 'GHS 28,716.81', valueColor: '#1a1a1a' },
  { icon: 'i-lucide-trending-up', label: 'Avg Monthly Sales', value: '53 units',      valueColor: '#1a1a1a' },
  { icon: 'i-lucide-package',     label: 'Stock Status',     value: 'In Stock',      valueColor: '#22c55e' },
  { icon: 'i-lucide-trending-up', label: 'Stock Turnover',   value: '7.1x/year',     valueColor: '#1a1a1a' },
]

const monthlySales = [
  { month: 'Sep', units: 38 },
  { month: 'Oct', units: 45 },
  { month: 'Nov', units: 42 },
  { month: 'Dec', units: 60 },
  { month: 'Jan', units: 50 },
  { month: 'Feb', units: 48 },
]

const maxUnits = Math.max(...monthlySales.map(s => s.units))

const recentSales = [
  { date: '2026-03-01', customer: 'Sarah Johnson',  qty: 2, total: 'GHS 179.98', status: 'delivered' },
  { date: '2026-02-28', customer: 'Michael Chen',   qty: 1, total: 'GHS 89.99',  status: 'delivered' },
  { date: '2026-02-25', customer: 'Emma Williams',  qty: 3, total: 'GHS 269.97', status: 'in-transit' },
  { date: '2026-02-20', customer: 'James Martinez', qty: 1, total: 'GHS 89.99',  status: 'delivered' },
]

function statusBadge(s: string) {
  if (s === 'delivered')  return { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.2)',  color: '#22c55e' }
  if (s === 'in-transit') return { bg: 'rgba(255,180,0,0.1)',  border: 'rgba(255,180,0,0.2)',  color: '#d49a00' }
  return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280' }
}
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:32px">

    <!-- Back link -->
    <NuxtLink to="/shop/products" style="display:inline-flex;align-items:center;gap:6px;text-decoration:none;color:#6b7280;font-size:14px;font-family:'Manrope',sans-serif;width:fit-content">
      <UIcon name="i-lucide-arrow-left" style="width:16px;height:16px" />
      Back to Products
    </NuxtLink>

    <!-- Top row: product card + right sidebar -->
    <div style="display:grid;grid-template-columns:1fr 344px;gap:24px;align-items:start">

      <!-- Product info card -->
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:20px 25px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <div style="display:flex;gap:24px;align-items:flex-start">
          <!-- Icon placeholder -->
          <div style="width:128px;height:128px;background:#f8f9fa;border-radius:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <UIcon name="i-lucide-package" style="width:64px;height:64px;color:#6b7280" />
          </div>
          <!-- Info -->
          <div style="flex:1;display:flex;flex-direction:column;gap:16px">
            <!-- Name + badges -->
            <div>
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
                <h1 style="font-size:24px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;line-height:1.3">{{ product.name }}</h1>
                <span style="font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 11px;background:rgba(34,197,94,0.1);color:#22c55e;border:1px solid rgba(34,197,94,0.2)">Active</span>
              </div>
              <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:8px">SKU: {{ product.sku }}</p>
              <span style="font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 10px;background:#e5e7eb;color:#6b7280;border:1px solid #e5e7eb">{{ product.category }}</span>
            </div>
            <!-- Description -->
            <div>
              <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin-bottom:8px">Description</p>
              <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;line-height:1.5">{{ product.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Right sidebar -->
      <div style="display:flex;flex-direction:column;gap:24px">

        <!-- Pricing card -->
        <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
          <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin-bottom:16px">Pricing</p>
          <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:16px">
            <span style="font-size:30px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ product.price }}</span>
            <span style="font-size:16px;color:#6b7280;font-family:'Manrope',sans-serif">per unit</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;justify-content:space-between">
              <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Cost Price:</span>
              <span style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">{{ product.costPrice }}</span>
            </div>
            <div style="display:flex;justify-content:space-between">
              <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Profit Margin:</span>
              <span style="font-size:14px;font-weight:500;color:#22c55e;font-family:'Manrope',sans-serif">{{ product.profitMargin }}</span>
            </div>
          </div>
        </div>

        <!-- Inventory card -->
        <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:25px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
          <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin-bottom:16px">Inventory</p>
          <div style="display:flex;flex-direction:column;gap:12px">
            <div>
              <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:2px">Current Stock</p>
              <p style="font-size:24px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ product.stock }}</p>
            </div>
            <div>
              <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:2px">Reorder Point</p>
              <p style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ product.reorderPoint }}</p>
            </div>
            <div>
              <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:2px">Total Sold</p>
              <p style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ product.totalSold }}</p>
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div style="display:flex;flex-direction:column;gap:12px">
          <NuxtLink :to="`/shop/products/${$route.params.id}/edit`" style="text-decoration:none">
            <button
              style="width:100%;height:40px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer;box-shadow:0 1px 3px rgba(255,180,0,0.2)"
              @mouseover="($event.currentTarget as HTMLElement).style.opacity='0.9'"
              @mouseleave="($event.currentTarget as HTMLElement).style.opacity='1'"
            >Edit Product</button>
          </NuxtLink>
          <button
            style="width:100%;height:40px;background:#ef4444;border:none;border-radius:20px;font-size:14px;font-weight:500;color:white;font-family:'Manrope',sans-serif;cursor:pointer"
            @mouseover="($event.currentTarget as HTMLElement).style.opacity='0.9'"
            @mouseleave="($event.currentTarget as HTMLElement).style.opacity='1'"
          >Delete Product</button>
        </div>
      </div>
    </div>

    <!-- Monthly Sales + Quick Stats -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">

      <!-- Monthly Sales bar chart -->
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:25px 25px 1px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin-bottom:16px">Monthly Sales</p>
        <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:8px;height:200px;padding-bottom:24px">
          <div
            v-for="s in monthlySales"
            :key="s.month"
            style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:6px;height:100%"
          >
            <span style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">{{ s.units }}</span>
            <div
              :style="`width:100%;background:#ffb400;border-radius:6px 6px 0 0;height:${(s.units / maxUnits) * 140}px`"
            ></div>
            <span style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">{{ s.month }}</span>
          </div>
        </div>
      </div>

      <!-- Quick Stats -->
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:25px 25px 1px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin-bottom:16px">Quick Stats</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;padding-bottom:24px">
          <div
            v-for="stat in quickStats"
            :key="stat.label"
            style="background:#f8f9fa;border-radius:16px;padding:16px 16px 16px"
          >
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <UIcon :name="stat.icon" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
              <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ stat.label }}</span>
            </div>
            <p :style="`font-size:20px;font-weight:700;font-family:'Manrope',sans-serif;color:${stat.valueColor}`">{{ stat.value }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Sales table -->
    <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:25px 25px 1px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
      <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin-bottom:16px">Recent Sales</p>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f8f9fa;border-bottom:1px solid #e5e7eb">
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Date</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Customer</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Quantity</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Total</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(sale, i) in recentSales"
            :key="i"
            :style="`border-bottom:${i < recentSales.length - 1 ? '1px solid #e5e7eb' : 'none'}`"
            @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
          >
            <td style="padding:18px 16px;font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ sale.date }}</td>
            <td style="padding:18px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap">{{ sale.customer }}</td>
            <td style="padding:18px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ sale.qty }}</td>
            <td style="padding:18px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ sale.total }}</td>
            <td style="padding:18px 16px">
              <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 10px;background:${statusBadge(sale.status).bg};color:${statusBadge(sale.status).color};border:1px solid ${statusBadge(sale.status).border}`">
                {{ sale.status }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>
