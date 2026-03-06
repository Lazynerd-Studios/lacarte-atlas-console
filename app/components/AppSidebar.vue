<script setup lang="ts">
const route = useRoute()
const authStore = useAuthStore()

const navLinks = [
  { label: 'Dashboard',        icon: 'i-lucide-layout-dashboard', to: '/' },
  { label: 'Customers',        icon: 'i-lucide-users',            to: '/customers' },
  { label: 'Drivers & Trucks', icon: 'i-lucide-truck',            to: '/drivers' },
  { label: 'Pickup Requests',  icon: 'i-lucide-package',          to: '/pickups' },
  { label: 'Routes',           icon: 'i-lucide-map',              to: '/routes' },
  { label: 'Live Tracking',    icon: 'i-lucide-map-pin',          to: '/tracking' },
  { label: 'Billing & Payments', icon: 'i-lucide-credit-card',   to: '/billing' },
  { label: 'Shop',             icon: 'i-lucide-shopping-bag',     to: '/shop' },
  { label: 'Inventory',        icon: 'i-lucide-boxes',            to: '/inventory' },
  { label: 'Support Tickets',  icon: 'i-lucide-headphones',       to: '/support' },
  { label: 'Reports',          icon: 'i-lucide-bar-chart-2',      to: '/reports' },
  { label: 'Team',             icon: 'i-lucide-users-round',      to: '/team' },
  { label: 'Settings',         icon: 'i-lucide-settings',         to: '/settings' },
]

const userInitial = computed(() => {
  const name = authStore.user?.name || 'Admin User'
  return name.charAt(0).toUpperCase()
})

const userName = computed(() => authStore.user?.name || 'Admin User')
const userEmail = computed(() => authStore.user?.email || 'admin@lacarte.com')

function isActive(to: string) {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}
</script>

<template>
  <aside style="width:256px;min-width:256px;height:100vh;background:white;border-right:1px solid #ececec;display:flex;flex-direction:column">
    <!-- Logo -->
    <div style="height:64px;padding:0 24px;display:flex;align-items:center;border-bottom:1px solid #ececec;flex-shrink:0">
      <img
        src="https://www.figma.com/api/mcp/asset/f733ef86-dfb4-4f16-b178-19d3757b9227"
        alt="LaCarte"
        style="height:40px;width:auto"
      />
    </div>

    <!-- Nav -->
    <nav style="flex:1;overflow-y:auto;padding:16px 12px;display:flex;flex-direction:column;gap:4px">
      <NuxtLink
        v-for="link in navLinks"
        :key="link.to"
        :to="link.to"
        style="text-decoration:none"
      >
        <div
          :style="`
            position:relative;
            display:flex;
            align-items:center;
            gap:12px;
            height:40px;
            padding-left:12px;
            border-radius:20px;
            cursor:pointer;
            background:${isActive(link.to) ? '#fff9e6' : 'transparent'};
            transition:background 0.15s;
          `"
          @mouseover="!isActive(link.to) && (($event.currentTarget as HTMLElement).style.background = '#f9fafb')"
          @mouseleave="!isActive(link.to) && (($event.currentTarget as HTMLElement).style.background = 'transparent')"
        >
          <!-- Active indicator -->
          <div
            v-if="isActive(link.to)"
            style="position:absolute;left:0;top:0;width:4px;height:40px;background:#ffb400;border-radius:0 4px 4px 0"
          />
          <UIcon
            :name="link.icon"
            :style="`width:20px;height:20px;flex-shrink:0;color:${isActive(link.to) ? '#ffb400' : '#6b7280'}`"
          />
          <span :style="`font-size:14px;font-family:'Manrope',sans-serif;color:${isActive(link.to) ? '#111' : '#6b7280'};white-space:nowrap`">
            {{ link.label }}
          </span>
        </div>
      </NuxtLink>
    </nav>

    <!-- User footer -->
    <div style="border-top:1px solid #ececec;padding:17px 16px;flex-shrink:0">
      <div style="display:flex;align-items:center;gap:12px;padding:0 12px;height:52px">
        <div style="width:32px;height:32px;border-radius:9999px;background:#ffb400;display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <span style="font-size:16px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">{{ userInitial }}</span>
        </div>
        <div style="flex:1;min-width:0;display:flex;flex-direction:column">
          <p style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ userName }}</p>
          <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ userEmail }}</p>
        </div>
      </div>
    </div>
  </aside>
</template>
