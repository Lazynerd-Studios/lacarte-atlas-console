<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const router = useRouter()

function goBack() {
  router.back()
}

function goToDashboard() {
  router.push('/')
}
</script>

<template>
  <div style="display:flex;align-items:center;justify-content:center;min-height:calc(100vh - 200px)">
    <div style="max-width:500px;text-align:center;padding:40px">
      <!-- Icon -->
      <div style="display:flex;justify-content:center;margin-bottom:24px">
        <div style="width:80px;height:80px;border-radius:50%;background:rgba(239,68,68,0.1);display:flex;align-items:center;justify-content:center">
          <UIcon name="i-lucide-shield-alert" style="width:40px;height:40px;color:#ef4444" />
        </div>
      </div>

      <!-- Title -->
      <h1 style="font-size:32px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;margin-bottom:12px">
        Access Denied
      </h1>

      <!-- Description -->
      <p style="font-size:16px;color:#6b7280;font-family:'Manrope',sans-serif;line-height:1.6;margin-bottom:32px">
        You don't have permission to access this page. Please contact your administrator if you believe this is an error.
      </p>

      <!-- Actions -->
      <div style="display:flex;gap:12px;justify-content:center">
        <button
          style="height:44px;padding:0 24px;background:#ececec;border:none;border-radius:22px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer;display:flex;align-items:center;gap:8px"
          @click="goBack"
          @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
          @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
        >
          <UIcon name="i-lucide-arrow-left" style="width:16px;height:16px" />
          Go Back
        </button>
        <button
          style="height:44px;padding:0 24px;background:#ffb400;border:none;border-radius:22px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer;box-shadow:0 1px 3px rgba(255,180,0,0.2)"
          @click="goToDashboard"
          @mouseover="($event.currentTarget as HTMLElement).style.background='#f5a800'"
          @mouseleave="($event.currentTarget as HTMLElement).style.background='#ffb400'"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  </div>
</template>
