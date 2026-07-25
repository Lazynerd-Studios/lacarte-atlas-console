<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const router = useRouter()
const api = useApi()
const toast = useAppToast()

interface Product {
  id: string
  name: string
  sku: string
  description: string
  price: number
  stockQuantity: number
  reorderPoint: number
  unitCost: number
  profitMargin: number
  totalSold: number
  isLowStock: boolean
  status: string
  images: string[]
  category: { id: string; name: string }
  createdAt: string | null
  updatedAt: string | null
}

const product = ref<Product | null>(null)
const loading = ref(true)

async function fetchProduct() {
  loading.value = true
  try {
    const data = await api.get<Product>(
      `/store/admin/products/${route.params.id}`,
      'Failed to load product'
    )
    if (data) {
      product.value = data
    }
  } catch (err) {
    console.error('Error fetching product:', err)
  }
  loading.value = false
}

async function handleDelete() {
  try {
    await api.del(
      `/store/admin/products/${route.params.id}`,
      'Failed to delete product'
    )
    toast.success('Product deleted', 'Product has been removed successfully.')
    router.push('/shop/products')
  } catch (err) {
    console.error('Error deleting product:', err)
  }
}

const statusBadgeStyle = computed(() => {
  const s = product.value?.status
  if (s === 'active') return { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)', color: '#22c55e' }
  if (s === 'inactive') return { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', color: '#ef4444' }
  return { bg: 'rgba(255,180,0,0.1)', border: 'rgba(255,180,0,0.2)', color: '#d49a00' }
})

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

onMounted(() => {
  fetchProduct()
})
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:32px">

    <!-- Back link -->
    <NuxtLink to="/shop/products" style="display:inline-flex;align-items:center;gap:6px;text-decoration:none;color:#6b7280;font-size:14px;font-family:'Manrope',sans-serif;width:fit-content">
      <UIcon name="i-lucide-arrow-left" style="width:16px;height:16px" />
      Back to Products
    </NuxtLink>

    <!-- Loading state -->
    <div v-if="loading" style="display:flex;align-items:center;justify-content:center;padding:64px">
      <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Loading product...</p>
    </div>

    <template v-else-if="product">
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
                <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 11px;background:${statusBadgeStyle.bg};color:${statusBadgeStyle.color};border:1px solid ${statusBadgeStyle.border}`">{{ product.status.charAt(0).toUpperCase() + product.status.slice(1) }}</span>
              </div>
              <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:8px">SKU: {{ product.sku }}</p>
              <span style="font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 10px;background:#e5e7eb;color:#6b7280;border:1px solid #e5e7eb">{{ product.category.name }}</span>
            </div>
            <!-- Description -->
            <div>
              <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin-bottom:8px">Description</p>
              <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;line-height:1.5">{{ product.description || 'No description provided.' }}</p>
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
            <span style="font-size:30px;font-weight:700;color:#1a1a1a;font-family:'Manrope',sans-serif">GHS {{ product.price.toFixed(2) }}</span>
            <span style="font-size:16px;color:#6b7280;font-family:'Manrope',sans-serif">per unit</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;justify-content:space-between">
              <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Unit Cost:</span>
              <span style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">GHS {{ product.unitCost.toFixed(2) }}</span>
            </div>
            <div style="display:flex;justify-content:space-between">
              <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Profit Margin:</span>
              <span style="font-size:14px;font-weight:500;color:#22c55e;font-family:'Manrope',sans-serif">{{ product.profitMargin }}%</span>
            </div>
          </div>
        </div>

        <!-- Inventory card -->
        <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:25px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
          <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin-bottom:16px">Inventory</p>
          <div style="display:flex;flex-direction:column;gap:12px">
            <div>
              <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:2px">Current Stock</p>
              <p :style="`font-size:24px;font-weight:700;font-family:'Manrope',sans-serif;color:${product.isLowStock ? '#ef4444' : '#1a1a1a'}`">{{ product.stockQuantity }}</p>
            </div>
            <div>
              <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:2px">Reorder Point</p>
              <p style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ product.reorderPoint }} units</p>
            </div>
            <div>
              <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:2px">Total Sold</p>
              <p style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ product.totalSold }} units</p>
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div style="display:flex;flex-direction:column;gap:12px">
          <NuxtLink :to="`/shop/products/${route.params.id}/edit`" style="text-decoration:none">
            <button
              style="width:100%;height:40px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer;box-shadow:0 1px 3px rgba(255,180,0,0.2)"
              @mouseover="($event.currentTarget as HTMLElement).style.opacity='0.9'"
              @mouseleave="($event.currentTarget as HTMLElement).style.opacity='1'"
            >Edit Product</button>
          </NuxtLink>
          <button
            style="width:100%;height:40px;background:#ef4444;border:none;border-radius:20px;font-size:14px;font-weight:500;color:white;font-family:'Manrope',sans-serif;cursor:pointer"
            @click="handleDelete"
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

    </template>

  </div>
</template>
