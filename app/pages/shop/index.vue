<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const api = useApi()

interface ShopMetric {
  count?: number
  amount?: number
  currency?: string
  percentageChange?: number
  productName?: string
  unitsSold?: number
  label: string
}

interface ShopOverviewResponse {
  success: boolean
  data: { metrics: ShopMetric[] }
}

const overview = ref<ShopMetric[]>([])

const stats = computed(() => {
  if (overview.value.length) {
    const totalOrders = overview.value.find(m => m.label === 'Total Orders')
    const revenueToday = overview.value.find(m => m.label === 'Revenue Today')
    const topProduct = overview.value.find(m => m.label === 'Top Product')
    const lowStock = overview.value.find(m => m.label === 'Low Stock Alerts')

    return [
      { icon: 'i-lucide-shopping-bag', iconBg: '#fff9e6', label: 'Total Orders', value: String(totalOrders?.count ?? 0), sub: `${totalOrders?.percentageChange ?? 0}% from yesterday`, subColor: (totalOrders?.percentageChange ?? 0) >= 0 ? '#22c55e' : '#ef4444' },
      { icon: 'i-lucide-dollar-sign', iconBg: '#fff9e6', label: 'Revenue Today', value: `${revenueToday?.currency ?? 'GHS'} ${(revenueToday?.amount ?? 0).toLocaleString()}`, sub: `${revenueToday?.percentageChange ?? 0}% from yesterday`, subColor: (revenueToday?.percentageChange ?? 0) >= 0 ? '#22c55e' : '#ef4444' },
      { icon: 'i-lucide-package', iconBg: '#fff9e6', label: 'Top Product', value: topProduct?.productName ?? 'N/A', sub: `${topProduct?.unitsSold ?? 0} units sold today`, subColor: '#6b7280' },
      { icon: 'i-lucide-alert-circle', iconBg: '#fef2f2', label: 'Low Stock Alerts', value: String(lowStock?.count ?? 0), sub: 'Items need restocking', subColor: '#6b7280', valueColor: (lowStock?.count ?? 0) > 0 ? '#ef4444' : '#1a1a1a' },
    ]
  }
  return [
    { icon: 'i-lucide-shopping-bag', iconBg: '#fff9e6', label: 'Total Orders', value: '0', sub: '0% from yesterday', subColor: '#6b7280' },
    { icon: 'i-lucide-dollar-sign', iconBg: '#fff9e6', label: 'Revenue Today', value: 'GHS 0', sub: '0% from yesterday', subColor: '#6b7280' },
    { icon: 'i-lucide-package', iconBg: '#fff9e6', label: 'Top Product', value: 'N/A', sub: '0 units sold today', subColor: '#6b7280' },
    { icon: 'i-lucide-alert-circle', iconBg: '#fef2f2', label: 'Low Stock Alerts', value: '0', sub: 'Items need restocking', subColor: '#6b7280' },
  ]
})

async function fetchShopOverview() {
  try {
    const data = await api.get<ShopOverviewResponse>(
      '/store/admin/dashboard/overview',
      'Failed to load shop overview'
    )
    if (data?.data?.metrics) {
      overview.value = data.data.metrics
    }
  } catch (err) {
    console.error('Error fetching shop overview:', err)
  }
}

onMounted(() => {
  fetchShopOverview()
})

const sections = [
  { title: 'Products',  desc: 'Manage product catalog',  btn: 'View Products',  to: '/shop/products' },
  { title: 'Orders',    desc: 'View and manage orders',  btn: 'View Orders',    to: '/shop/orders' },
  { title: 'Inventory', desc: 'Monitor stock levels',    btn: 'View Inventory', to: '/inventory' },
]
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:32px">

    <!-- Header -->
    <div>
      <h1 style="font-size:32px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;line-height:1.3">Shop Management</h1>
      <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:8px">Manage products, orders, and inventory</p>
    </div>

    <!-- Stat cards -->
    <div class="grid-cols-4">
      <div
        v-for="stat in stats"
        :key="stat.label"
        style="background:white;border:1px solid #ececec;border-radius:16px;padding:1px 10px;box-shadow:0 1px 3px rgba(0,0,0,0.1)"
      >
        <div style="padding:0 14px 24px">
          <div style="padding-top:24px;margin-bottom:16px">
            <div :style="`width:48px;height:48px;background:${stat.iconBg};border-radius:16px;display:flex;align-items:center;justify-content:center`">
              <UIcon :name="stat.icon" style="width:24px;height:24px;color:#6b7280" />
            </div>
          </div>
          <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:4px">{{ stat.label }}</p>
          <p :style="`font-size:24px;font-weight:700;font-family:'Manrope',sans-serif;color:${stat.valueColor || '#1a1a1a'};margin-bottom:4px`">{{ stat.value }}</p>
          <p :style="`font-size:12px;font-family:'Manrope',sans-serif;color:${stat.subColor}`">{{ stat.sub }}</p>
        </div>
      </div>
    </div>

    <!-- Section cards: Products / Orders / Inventory -->
    <div class="grid-cols-3">
      <div
        v-for="s in sections"
        :key="s.title"
        style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1);display:flex;flex-direction:column;gap:16px"
      >
        <div>
          <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin-bottom:4px">{{ s.title }}</p>
          <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ s.desc }}</p>
        </div>
        <NuxtLink :to="s.to" style="text-decoration:none">
          <button
            style="width:100%;height:40px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer;box-shadow:0 1px 3px rgba(255,180,0,0.2)"
            @mouseover="($event.currentTarget as HTMLElement).style.opacity='0.9'"
            @mouseleave="($event.currentTarget as HTMLElement).style.opacity='1'"
          >{{ s.btn }}</button>
        </NuxtLink>
      </div>
    </div>

  </div>
</template>
