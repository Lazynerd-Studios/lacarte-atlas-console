<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const stats = [
  { icon: 'i-lucide-shopping-bag', iconBg: '#fff9e6', label: 'Total Orders',     value: '67',        sub: '+23.1% from yesterday', subColor: '#22c55e' },
  { icon: 'i-lucide-dollar-sign',  iconBg: '#fff9e6', label: 'Revenue Today',    value: 'GHS 4,280', sub: '+18.4% from yesterday', subColor: '#22c55e' },
  { icon: 'i-lucide-package',      iconBg: '#fff9e6', label: 'Top Product',      value: 'Waste Bins', sub: '42 units sold today',  subColor: '#6b7280' },
  { icon: 'i-lucide-alert-circle', iconBg: '#fef2f2', label: 'Low Stock Alerts', value: '3',         sub: 'Items need restocking', subColor: '#6b7280', valueColor: '#ef4444' },
]

const sections = [
  { title: 'Products',  desc: 'Manage product catalog',  btn: 'View Products',  to: '/shop/products' },
  { title: 'Orders',    desc: 'View and manage orders',  btn: 'View Orders',    to: '/shop/orders' },
  { title: 'Inventory', desc: 'Monitor stock levels',    btn: 'View Inventory', to: '/shop/inventory' },
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
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:24px">
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
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">
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
