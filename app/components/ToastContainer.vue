<script setup lang="ts">
const { toasts, dismiss } = useAppToast()

const config: Record<string, { icon: string; color: string; bg: string; border: string; bar: string }> = {
  success: { icon: 'i-lucide-check-circle', color: '#22c55e', bg: '#f0fdf4', border: '#86efac',             bar: '#22c55e' },
  error:   { icon: 'i-lucide-x-circle',     color: '#ef4444', bg: '#fef2f2', border: '#fecaca',             bar: '#ef4444' },
  warning: { icon: 'i-lucide-alert-circle', color: '#d49a00', bg: '#fffbeb', border: 'rgba(255,180,0,0.4)', bar: '#ffb400' },
  info:    { icon: 'i-lucide-info',         color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe',             bar: '#3b82f6' },
}

const fallback = config['info']!

function cfg(type: string) {
  return config[type] ?? fallback
}
</script>

<template>
  <Teleport to="body">
    <div
      style="
        position:fixed;
        bottom:24px;
        right:24px;
        z-index:9999;
        display:flex;
        flex-direction:column;
        gap:10px;
        pointer-events:none;
        width:360px;
        max-width:calc(100vw - 48px);
      "
    >
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :style="`
            background:${cfg(toast.type).bg};
            border:1px solid ${cfg(toast.type).border};
            border-radius:16px;
            box-shadow:0 4px 12px rgba(0,0,0,0.1),0 1px 3px rgba(0,0,0,0.08);
            overflow:hidden;
            pointer-events:all;
            position:relative;
          `"
        >
          <!-- Progress bar -->
          <div
            v-if="(toast.duration ?? 4000) > 0"
            :style="`
              position:absolute;
              bottom:0;left:0;
              height:3px;
              background:${cfg(toast.type).bar};
              border-radius:0 0 0 16px;
              animation:toast-progress ${toast.duration ?? 4000}ms linear forwards;
            `"
          />

          <div style="padding:14px 16px;display:flex;align-items:flex-start;gap:12px">
            <!-- Icon -->
            <UIcon
              :name="cfg(toast.type).icon"
              :style="`width:20px;height:20px;color:${cfg(toast.type).color};flex-shrink:0;margin-top:1px`"
            />

            <!-- Text -->
            <div style="flex:1;min-width:0">
              <p style="font-size:14px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;line-height:1.4">
                {{ toast.title }}
              </p>
              <p
                v-if="toast.message"
                style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:2px;line-height:1.5"
              >{{ toast.message }}</p>
            </div>

            <!-- Dismiss -->
            <button
              style="
                width:24px;height:24px;border:none;background:none;cursor:pointer;
                display:flex;align-items:center;justify-content:center;
                border-radius:8px;flex-shrink:0;opacity:0.5;
              "
              @click="dismiss(toast.id)"
              @mouseover="($event.currentTarget as HTMLElement).style.opacity='1'"
              @mouseleave="($event.currentTarget as HTMLElement).style.opacity='0.5'"
            >
              <UIcon name="i-lucide-x" style="width:14px;height:14px;color:#111" />
            </button>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active {
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toast-leave-active {
  transition: all 0.2s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(40px) scale(0.95);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(40px) scale(0.95);
}

@keyframes toast-progress {
  from { width: 100%; }
  to   { width: 0%; }
}
</style>
