<script setup lang="ts">
const authStore = useAuthStore()
const router = useRouter()

const userInitial = computed(() => {
  const name = authStore.user?.name || 'Admin User'
  return name.charAt(0).toUpperCase()
})

const userName = computed(() => authStore.user?.name || 'Admin User')

const showNotifications = ref(false)
const search = ref('')

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <header style="height:64px;background:white;border-bottom:1px solid #ececec;display:flex;align-items:center;justify-content:space-between;padding:0 24px;flex-shrink:0">
    <!-- Search -->
    <div style="position:relative;width:448px">
      <UIcon name="i-lucide-search" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:#6b7280" />
      <input
        v-model="search"
        type="text"
        placeholder="Search customers, drivers, orders..."
        style="width:100%;height:38px;padding-left:40px;padding-right:16px;background:#f9fafb;border:1px solid #ececec;border-radius:20px;font-size:14px;color:#111;outline:none;font-family:'Manrope',sans-serif;box-sizing:border-box"
        @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
        @blur="($event.target as HTMLElement).style.borderColor='#ececec'"
      />
    </div>

    <!-- Right side -->
    <div style="display:flex;align-items:center;gap:4px">
      <!-- Notifications -->
      <button
        style="position:relative;width:36px;height:36px;border-radius:20px;background:none;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center"
        @click="showNotifications = true"
        @mouseover="($event.currentTarget as HTMLElement).style.background='#f9fafb'"
        @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
      >
        <UIcon name="i-lucide-bell" style="width:20px;height:20px;color:#6b7280" />
        <span style="position:absolute;top:6px;right:6px;width:8px;height:8px;background:#ef4444;border-radius:9999px" />
      </button>

      <!-- Divider -->
      <div style="width:1px;height:40px;background:#ececec;margin:0 12px" />

      <!-- User info -->
      <div style="display:flex;align-items:center;gap:12px">
        <div style="display:flex;flex-direction:column;align-items:flex-end">
          <p style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;white-space:nowrap">{{ userName }}</p>
          <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;white-space:nowrap">Administrator</p>
        </div>

        <!-- Avatar -->
        <div style="width:40px;height:40px;border-radius:9999px;background:#ffb400;display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <span style="font-size:16px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">{{ userInitial }}</span>
        </div>

        <!-- Logout -->
        <button
          style="width:36px;height:36px;border-radius:20px;background:none;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center"
          title="Logout"
          @click="logout"
          @mouseover="($event.currentTarget as HTMLElement).style.background='#f9fafb'"
          @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
        >
          <UIcon name="i-lucide-log-out" style="width:20px;height:20px;color:#6b7280" />
        </button>
      </div>
    </div>
  </header>

  <NotificationsModal v-if="showNotifications" @close="showNotifications = false" />
</template>
