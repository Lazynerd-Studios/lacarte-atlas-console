<script setup lang="ts">
const { toasts, dismiss } = useAppToast()

function getIcon(type: string) {
  switch (type) {
    case 'success': return 'lucide:check-circle'
    case 'error': return 'lucide:alert-circle'
    case 'warning': return 'lucide:alert-triangle'
    case 'info': return 'lucide:info'
    default: return 'lucide:info'
  }
}

function getColors(type: string) {
  switch (type) {
    case 'success': return { bg: '#f0fdf4', border: '#86efac', icon: '#16a34a', text: '#166534' }
    case 'error': return { bg: '#fef2f2', border: '#fca5a5', icon: '#dc2626', text: '#991b1b' }
    case 'warning': return { bg: '#fef3c7', border: '#fcd34d', icon: '#f59e0b', text: '#92400e' }
    case 'info': return { bg: '#eff6ff', border: '#93c5fd', icon: '#3b82f6', text: '#1e40af' }
    default: return { bg: '#f9fafb', border: '#d1d5db', icon: '#6b7280', text: '#374151' }
  }
}
</script>

<template>
  <div style="position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:12px;pointer-events:none">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :style="`
          background:${getColors(toast.type).bg};
          border:1.5px solid ${getColors(toast.type).border};
          border-radius:12px;
          padding:16px;
          min-width:320px;
          max-width:420px;
          box-shadow:0 10px 15px -3px rgba(0,0,0,0.1),0 4px 6px -4px rgba(0,0,0,0.1);
          display:flex;
          align-items:flex-start;
          gap:12px;
          font-family:'Manrope',sans-serif;
          pointer-events:auto;
          animation:slideIn 0.3s ease-out;
        `"
      >
        <Icon 
          :name="getIcon(toast.type)" 
          :style="`width:20px;height:20px;color:${getColors(toast.type).icon};flex-shrink:0;margin-top:2px`" 
        />
        <div style="flex:1;min-width:0">
          <p :style="`font-size:14px;font-weight:600;color:${getColors(toast.type).text};margin:0 0 4px;line-height:1.4`">
            {{ toast.title }}
          </p>
          <p v-if="toast.message" :style="`font-size:13px;color:${getColors(toast.type).text};opacity:0.8;margin:0;line-height:1.4`">
            {{ toast.message }}
          </p>
        </div>
        <button
          @click="dismiss(toast.id)"
          :style="`
            width:24px;
            height:24px;
            border:none;
            background:transparent;
            cursor:pointer;
            display:flex;
            align-items:center;
            justify-content:center;
            border-radius:6px;
            flex-shrink:0;
            color:${getColors(toast.type).text};
            opacity:0.5;
            transition:opacity 0.15s,background 0.15s;
          `"
          @mouseover="($event.currentTarget as HTMLElement).style.opacity='1';($event.currentTarget as HTMLElement).style.background='rgba(0,0,0,0.05)'"
          @mouseleave="($event.currentTarget as HTMLElement).style.opacity='0.5';($event.currentTarget as HTMLElement).style.background='transparent'"
        >
          <Icon name="lucide:x" style="width:14px;height:14px" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast-enter-active {
  animation: slideIn 0.3s ease-out;
}

.toast-leave-active {
  transition: all 0.3s ease-in;
}

.toast-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
