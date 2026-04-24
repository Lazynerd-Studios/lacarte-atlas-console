<template>
  <div style="position:fixed;inset:0;background:#f9fafb;display:flex;align-items:center;justify-content:center;z-index:9999">
    <div style="display:flex;flex-direction:column;align-items:center;gap:20px">
      <!-- Animated logo or spinner -->
      <div style="position:relative;width:80px;height:80px">
        <div style="position:absolute;inset:0;border:4px solid #f3f4f6;border-radius:50%"></div>
        <div style="position:absolute;inset:0;border:4px solid #ffb400;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite"></div>
      </div>
      
      <!-- Loading text -->
      <div style="text-align:center">
        <p style="font-size:16px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;margin-bottom:6px">
          Verifying session...
        </p>
        <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">
          Please wait a moment
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
