<script setup lang="ts">
const props = defineProps<{ mobileOpen?: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const route = useRoute()
const authStore = useAuthStore()
const { hasPermission, hasAnyPermission, isSuperAdmin } = usePermissions()

const collapsed = useState('sidebarCollapsed', () => false)

// Navigation links with permission requirements
const navLinks = computed(() => [
  { label: 'Dashboard',          icon: 'i-lucide-layout-dashboard', to: '/', permission: null },
  { label: 'Customers',          icon: 'i-lucide-users',            to: '/customers', permission: 'customers.view' },
  { label: 'Drivers & Trucks',   icon: 'i-lucide-truck',            to: '/drivers', permission: 'drivers.view' },
  { label: 'Pickup Requests',    icon: 'i-lucide-package',          to: '/pickups', permission: 'pickups.view' },
  { label: 'Live Tracking',      icon: 'i-lucide-map-pin',          to: '/tracking', permission: 'tracking.view' },
  { label: 'Billing & Payments', icon: 'i-lucide-credit-card',      to: '/billing', permission: 'billing.view' },
  { label: 'Shop',               icon: 'i-lucide-shopping-bag',     to: '/shop', permission: 'shop.view' },
  { label: 'Inventory',          icon: 'i-lucide-boxes',            to: '/inventory', permission: 'inventory.view' },
  { label: 'Support Tickets',    icon: 'i-lucide-headphones',       to: '/support', permission: 'support.view' },
  { label: 'Team',               icon: 'i-lucide-users-round',      to: '/team', permission: 'team.view' },
  { label: 'Settings',           icon: 'i-lucide-settings',         to: '/settings', permission: null },
].filter(link => !link.permission || hasPermission(link.permission)))

const reportsSubLinks = computed(() => [
  { label: 'Analytics',            to: '/reports/analytics', permission: 'reports.view' },
  { label: 'Operations Analytics', to: '/reports/operations', permission: 'reports.view' },
  { label: 'Customer Analytics',   to: '/reports/customers', permission: 'reports.view' },
  { label: 'Zone Performance',     to: '/reports/zones', permission: 'reports.view' },
].filter(link => !link.permission || hasPermission(link.permission)))

const commsSubLinks = computed(() => [
  { label: 'Quick SMS',  to: '/comms/sms', permission: 'communications.send' },
  { label: 'Quick Mail', to: '/comms/mail', permission: 'communications.send' },
].filter(link => !link.permission || hasPermission(link.permission)))

const managementSubLinks = computed(() => [
  { label: 'Customer Types',          to: '/management/customer-types', permission: 'management.view' },
  { label: 'Subscription Management', to: '/management/subscriptions', permission: 'management.view' },
  { label: 'Rate Management',         to: '/management/rates', permission: 'management.view' },
  { label: 'Zone Management',         to: '/management/zones', permission: 'management.view' },
  { label: 'Pickup Management',       to: '/management/pickup-management', permission: 'management.view' },
].filter(link => !link.permission || hasPermission(link.permission)))

// Show groups only if user has access to at least one sub-link
const showReports = computed(() => reportsSubLinks.value.length > 0)
const showManagement = computed(() => managementSubLinks.value.length > 0)
const showComms = computed(() => commsSubLinks.value.length > 0)

const isReportsOpen = ref(route.path.startsWith('/reports'))
const isManagementOpen = ref(route.path.startsWith('/management'))
const isCommsOpen = ref(route.path.startsWith('/comms'))

const isReportsActive = computed(() => route.path.startsWith('/reports'))
const isManagementActive = computed(() => route.path.startsWith('/management'))
const isCommsActive = computed(() => route.path.startsWith('/comms'))

watch(() => route.path, (p) => {
  if (p.startsWith('/reports'))    isReportsOpen.value = true
  if (p.startsWith('/management')) isManagementOpen.value = true
  if (p.startsWith('/comms'))      isCommsOpen.value = true
})

const userInitial = computed(() => (authStore.user?.name || 'Admin User').charAt(0).toUpperCase())
const userName    = computed(() => authStore.user?.name  || 'Admin User')
const userEmail   = computed(() => authStore.user?.email || 'admin@lacarte.com')

function isActive(to: string) {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}

function toggleGroup(group: 'reports' | 'management' | 'comms') {
  if (collapsed.value) {
    collapsed.value = false
    nextTick(() => {
      if (group === 'reports')    isReportsOpen.value = true
      if (group === 'management') isManagementOpen.value = true
      if (group === 'comms')      isCommsOpen.value = true
    })
  } else {
    if (group === 'reports')    isReportsOpen.value = !isReportsOpen.value
    if (group === 'management') isManagementOpen.value = !isManagementOpen.value
    if (group === 'comms')      isCommsOpen.value = !isCommsOpen.value
  }
}
</script>

<template>
  <aside
    :style="`
      width:${collapsed ? 64 : 256}px;
      min-width:${collapsed ? 64 : 256}px;
      height:100vh;
      background:white;
      border-right:1px solid #ececec;
      display:flex;
      flex-direction:column;
      transition:width 0.2s ease,min-width 0.2s ease,transform 0.25s ease;
      overflow:hidden;
      z-index:50;
      position:relative;
    `"
    :class="{ 'sidebar-mobile': true, 'sidebar-mobile-open': props.mobileOpen }"
  >
    <!-- Logo / collapse toggle -->
    <div style="height:64px;padding:0 12px;display:flex;align-items:center;border-bottom:1px solid #ececec;flex-shrink:0;gap:8px">
      <img
        v-if="!collapsed"
        src="https://www.figma.com/api/mcp/asset/f733ef86-dfb4-4f16-b178-19d3757b9227"
        alt="LaCarte"
        style="height:40px;width:auto;flex:1;min-width:0"
      />
      <button
        :title="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        :style="`
          width:36px;height:36px;border-radius:20px;background:none;border:none;cursor:pointer;
          display:flex;align-items:center;justify-content:center;flex-shrink:0;
          ${collapsed ? 'margin:0 auto' : ''}
        `"
        @click="collapsed = !collapsed"
        @mouseover="($event.currentTarget as HTMLElement).style.background='#f9fafb'"
        @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
      >
        <UIcon
          :name="collapsed ? 'i-lucide-panel-left-open' : 'i-lucide-panel-left-close'"
          style="width:20px;height:20px;color:#6b7280"
        />
      </button>
    </div>

    <!-- Nav -->
    <nav style="flex:1;overflow-y:auto;overflow-x:hidden;padding:16px 8px;display:flex;flex-direction:column;gap:4px">

      <!-- Regular links -->
      <NuxtLink
        v-for="link in navLinks"
        :key="link.to"
        :to="link.to"
        style="text-decoration:none"
        :title="collapsed ? link.label : undefined"
      >
        <div
          :style="`
            position:relative;
            display:flex;
            align-items:center;
            gap:12px;
            height:40px;
            padding-left:${collapsed ? 0 : 12}px;
            ${collapsed ? 'justify-content:center;' : ''}
            border-radius:20px;
            cursor:pointer;
            background:${isActive(link.to) ? '#fff9e6' : 'transparent'};
            transition:background 0.15s;
          `"
          @mouseover="!isActive(link.to) && (($event.currentTarget as HTMLElement).style.background = '#f9fafb')"
          @mouseleave="!isActive(link.to) && (($event.currentTarget as HTMLElement).style.background = isActive(link.to) ? '#fff9e6' : 'transparent')"
        >
          <div
            v-if="isActive(link.to)"
            style="position:absolute;left:0;top:0;width:4px;height:40px;background:#ffb400;border-radius:0 4px 4px 0"
          />
          <UIcon
            :name="link.icon"
            :style="`width:20px;height:20px;flex-shrink:0;color:${isActive(link.to) ? '#ffb400' : '#6b7280'}`"
          />
          <span
            v-if="!collapsed"
            :style="`font-size:14px;font-family:'Manrope',sans-serif;color:${isActive(link.to) ? '#111' : '#6b7280'};white-space:nowrap`"
          >
            {{ link.label }}
          </span>
        </div>
      </NuxtLink>

      <!-- Reports -->
      <div v-if="showReports">
        <div
          :style="`
            position:relative;display:flex;align-items:center;gap:12px;height:40px;
            padding-left:${collapsed ? 0 : 12}px;
            ${collapsed ? 'justify-content:center;' : ''}
            border-radius:20px;cursor:pointer;
            background:${isReportsActive ? '#fff9e6' : 'transparent'};
          `"
          :title="collapsed ? 'Reports' : undefined"
          @click="toggleGroup('reports')"
          @mouseover="!isReportsActive && (($event.currentTarget as HTMLElement).style.background = '#f9fafb')"
          @mouseleave="!isReportsActive && (($event.currentTarget as HTMLElement).style.background = 'transparent')"
        >
          <div v-if="isReportsActive" style="position:absolute;left:0;top:0;width:4px;height:40px;background:#ffb400;border-radius:0 4px 4px 0" />
          <UIcon name="i-lucide-bar-chart-2" :style="`width:20px;height:20px;flex-shrink:0;color:${isReportsActive ? '#ffb400' : '#6b7280'}`" />
          <span v-if="!collapsed" :style="`font-size:14px;font-family:'Manrope',sans-serif;flex:1;color:${isReportsActive ? '#111' : '#6b7280'};white-space:nowrap`">Reports</span>
          <UIcon
            v-if="!collapsed"
            :name="isReportsOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
            style="width:16px;height:16px;color:#6b7280;margin-right:12px;flex-shrink:0"
          />
        </div>
        <div v-if="isReportsOpen && !collapsed" style="margin-top:2px;display:flex;flex-direction:column;gap:2px">
          <NuxtLink v-for="sub in reportsSubLinks" :key="sub.to" :to="sub.to" style="text-decoration:none">
            <div
              :style="`display:flex;align-items:center;gap:10px;height:36px;padding-left:44px;border-radius:20px;cursor:pointer;background:${isActive(sub.to) ? '#fff9e6' : 'transparent'}`"
              @mouseover="!isActive(sub.to) && (($event.currentTarget as HTMLElement).style.background = '#f9fafb')"
              @mouseleave="!isActive(sub.to) && (($event.currentTarget as HTMLElement).style.background = 'transparent')"
            >
              <div :style="`width:6px;height:6px;border-radius:50%;background:${isActive(sub.to) ? '#ffb400' : '#d1d5db'};flex-shrink:0`" />
              <span :style="`font-size:13px;font-family:'Manrope',sans-serif;color:${isActive(sub.to) ? '#111' : '#6b7280'};white-space:nowrap`">{{ sub.label }}</span>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- Management -->
      <div v-if="showManagement">
        <div
          :style="`
            position:relative;display:flex;align-items:center;gap:12px;height:40px;
            padding-left:${collapsed ? 0 : 12}px;
            ${collapsed ? 'justify-content:center;' : ''}
            border-radius:20px;cursor:pointer;
            background:${isManagementActive ? '#fff9e6' : 'transparent'};
          `"
          :title="collapsed ? 'Management' : undefined"
          @click="toggleGroup('management')"
          @mouseover="!isManagementActive && (($event.currentTarget as HTMLElement).style.background = '#f9fafb')"
          @mouseleave="!isManagementActive && (($event.currentTarget as HTMLElement).style.background = 'transparent')"
        >
          <div v-if="isManagementActive" style="position:absolute;left:0;top:0;width:4px;height:40px;background:#ffb400;border-radius:0 4px 4px 0" />
          <UIcon name="i-lucide-sliders" :style="`width:20px;height:20px;flex-shrink:0;color:${isManagementActive ? '#ffb400' : '#6b7280'}`" />
          <span v-if="!collapsed" :style="`font-size:14px;font-family:'Manrope',sans-serif;flex:1;color:${isManagementActive ? '#111' : '#6b7280'};white-space:nowrap`">Management</span>
          <UIcon
            v-if="!collapsed"
            :name="isManagementOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
            style="width:16px;height:16px;color:#6b7280;margin-right:12px;flex-shrink:0"
          />
        </div>
        <div v-if="isManagementOpen && !collapsed" style="margin-top:2px;display:flex;flex-direction:column;gap:2px">
          <NuxtLink v-for="sub in managementSubLinks" :key="sub.to" :to="sub.to" style="text-decoration:none">
            <div
              :style="`display:flex;align-items:center;gap:10px;height:36px;padding-left:44px;border-radius:20px;cursor:pointer;background:${isActive(sub.to) ? '#fff9e6' : 'transparent'}`"
              @mouseover="!isActive(sub.to) && (($event.currentTarget as HTMLElement).style.background = '#f9fafb')"
              @mouseleave="!isActive(sub.to) && (($event.currentTarget as HTMLElement).style.background = 'transparent')"
            >
              <div :style="`width:6px;height:6px;border-radius:50%;background:${isActive(sub.to) ? '#ffb400' : '#d1d5db'};flex-shrink:0`" />
              <span :style="`font-size:13px;font-family:'Manrope',sans-serif;color:${isActive(sub.to) ? '#111' : '#6b7280'};white-space:nowrap`">{{ sub.label }}</span>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- Communications -->
      <div v-if="showComms">
        <div
          :style="`
            position:relative;display:flex;align-items:center;gap:12px;height:40px;
            padding-left:${collapsed ? 0 : 12}px;
            ${collapsed ? 'justify-content:center;' : ''}
            border-radius:20px;cursor:pointer;
            background:${isCommsActive ? '#fff9e6' : 'transparent'};
          `"
          :title="collapsed ? 'Communications' : undefined"
          @click="toggleGroup('comms')"
          @mouseover="!isCommsActive && (($event.currentTarget as HTMLElement).style.background = '#f9fafb')"
          @mouseleave="!isCommsActive && (($event.currentTarget as HTMLElement).style.background = 'transparent')"
        >
          <div v-if="isCommsActive" style="position:absolute;left:0;top:0;width:4px;height:40px;background:#ffb400;border-radius:0 4px 4px 0" />
          <UIcon name="i-lucide-message-square" :style="`width:20px;height:20px;flex-shrink:0;color:${isCommsActive ? '#ffb400' : '#6b7280'}`" />
          <span v-if="!collapsed" :style="`font-size:14px;font-family:'Manrope',sans-serif;flex:1;color:${isCommsActive ? '#111' : '#6b7280'};white-space:nowrap`">Communications</span>
          <UIcon
            v-if="!collapsed"
            :name="isCommsOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
            style="width:16px;height:16px;color:#6b7280;margin-right:12px;flex-shrink:0"
          />
        </div>
        <div v-if="isCommsOpen && !collapsed" style="margin-top:2px;display:flex;flex-direction:column;gap:2px">
          <NuxtLink v-for="sub in commsSubLinks" :key="sub.to" :to="sub.to" style="text-decoration:none">
            <div
              :style="`display:flex;align-items:center;gap:10px;height:36px;padding-left:44px;border-radius:20px;cursor:pointer;background:${isActive(sub.to) ? '#fff9e6' : 'transparent'}`"
              @mouseover="!isActive(sub.to) && (($event.currentTarget as HTMLElement).style.background = '#f9fafb')"
              @mouseleave="!isActive(sub.to) && (($event.currentTarget as HTMLElement).style.background = 'transparent')"
            >
              <div :style="`width:6px;height:6px;border-radius:50%;background:${isActive(sub.to) ? '#ffb400' : '#d1d5db'};flex-shrink:0`" />
              <span :style="`font-size:13px;font-family:'Manrope',sans-serif;color:${isActive(sub.to) ? '#111' : '#6b7280'};white-space:nowrap`">{{ sub.label }}</span>
            </div>
          </NuxtLink>
        </div>
      </div>

    </nav>

    <!-- User footer -->
    <div style="border-top:1px solid #ececec;padding:17px 8px;flex-shrink:0">
      <div
        :style="`
          display:flex;align-items:center;gap:12px;
          padding:0 ${collapsed ? 0 : 12}px;
          height:52px;
          ${collapsed ? 'justify-content:center;' : ''}
        `"
        :title="collapsed ? `${userName} · ${userEmail}` : undefined"
      >
        <div style="width:32px;height:32px;border-radius:9999px;background:#ffb400;display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <span style="font-size:16px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">{{ userInitial }}</span>
        </div>
        <div v-if="!collapsed" style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px">
          <p style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:0">{{ userName }}</p>
          <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:0">{{ userEmail }}</p>
        </div>
      </div>
    </div>
  </aside>
</template>
