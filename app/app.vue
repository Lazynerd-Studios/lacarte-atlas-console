<script setup lang="ts">
const authStore = useAuthStore()
const { $isCheckingAuth } = useNuxtApp()
const isCheckingAuth = $isCheckingAuth as Ref<boolean>
</script>

<template>
  <UApp>
    <NuxtRouteAnnouncer />
    
    <!-- Auth loading screen -->
    <AuthLoadingScreen v-if="isCheckingAuth" />
    
    <!-- Main app content -->
    <template v-else>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
      
      <!-- Session warning -->
      <SessionWarning
        v-if="authStore.showSessionWarning"
        :time-remaining="authStore.sessionWarningTime"
        @extend="authStore.extendSession"
        @dismiss="authStore.dismissSessionWarning"
      />
      
      <!-- Toast notifications -->
      <AppToast />
    </template>
  </UApp>
</template>
