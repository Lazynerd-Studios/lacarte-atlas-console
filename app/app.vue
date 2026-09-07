<script setup lang="ts">
const authStore = useAuthStore()
const { $isCheckingAuth } = useNuxtApp()
const isCheckingAuth = $isCheckingAuth as Ref<boolean>
</script>

<template>
  <UApp>
    <NuxtRouteAnnouncer />
    <NuxtLoadingIndicator
      :height="3"
      :duration="3000"
      :throttle="0"
      color="#ffb400"
    />
    
    <!-- Auth loading screen -->
    <AuthLoadingScreen v-if="isCheckingAuth" />
    
    <!-- Main app content -->
    <template v-else>
      <Suspense>
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>
        <template #fallback>
          <div style="min-height:100vh;display:flex;align-items:center;justify-content:center">
            <div style="display:flex;flex-direction:column;align-items:center;gap:12px">
              <UIcon name="i-lucide-loader-2" style="width:32px;height:32px;color:#ffb400;animation:spin 1s linear infinite" />
              <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0">Loading...</p>
            </div>
          </div>
        </template>
      </Suspense>
      
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
