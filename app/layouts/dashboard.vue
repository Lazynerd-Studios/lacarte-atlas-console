<template>
  <div style="display:flex;height:100vh;background:#f9fafb;overflow:hidden">
    <!-- Mobile backdrop -->
    <div
      :class="['sidebar-backdrop', { active: mobileOpen }]"
      @click="mobileOpen = false"
    />

    <AppSidebar :mobile-open="mobileOpen" @close="mobileOpen = false" />

    <div style="flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0">
      <AppHeader @toggle-sidebar="mobileOpen = !mobileOpen" />
      <main class="dashboard-main" style="flex:1;overflow-y:auto;padding:32px">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const mobileOpen = ref(false)
const route = useRoute()
watch(() => route.path, () => { mobileOpen.value = false })
</script>
