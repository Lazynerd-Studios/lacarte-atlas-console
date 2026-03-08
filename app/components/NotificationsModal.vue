<script setup lang="ts">
const emit = defineEmits<{ (e: 'close'): void }>()

const notifications = ref([
  {
    id: 1,
    type: 'pickup',
    icon: 'i-lucide-truck',
    iconBg: '#fff9e6',
    iconColor: '#ffb400',
    title: 'Pickup Completed',
    message: 'Driver John Smith completed pickup for Sarah Johnson.',
    time: '2 min ago',
    read: false,
  },
  {
    id: 2,
    type: 'payment',
    icon: 'i-lucide-dollar-sign',
    iconBg: 'rgba(34,197,94,0.1)',
    iconColor: '#22c55e',
    title: 'Payment Received',
    message: 'GHS 45.00 received from Kwame Mensah (INV-2026-014).',
    time: '18 min ago',
    read: false,
  },
  {
    id: 3,
    type: 'alert',
    icon: 'i-lucide-alert-circle',
    iconBg: 'rgba(239,68,68,0.1)',
    iconColor: '#ef4444',
    title: 'Missed Pickup',
    message: 'Pickup for Ama Owusu was missed. Rescheduling required.',
    time: '1 hr ago',
    read: false,
  },
  {
    id: 4,
    type: 'maintenance',
    icon: 'i-lucide-wrench',
    iconBg: 'rgba(99,102,241,0.1)',
    iconColor: '#6366f1',
    title: 'Maintenance Due',
    message: 'Truck T-003 is due for service in 3 days.',
    time: '3 hr ago',
    read: true,
  },
  {
    id: 5,
    type: 'customer',
    icon: 'i-lucide-user-plus',
    iconBg: 'rgba(34,197,94,0.1)',
    iconColor: '#22c55e',
    title: 'New Customer',
    message: 'Kofi Asante registered as a new commercial customer.',
    time: '5 hr ago',
    read: true,
  },
  {
    id: 6,
    type: 'transfer',
    icon: 'i-lucide-landmark',
    iconBg: '#fff9e6',
    iconColor: '#ffb400',
    title: 'Bank Transfer Pending',
    message: 'A bank transfer of GHS 200.00 is awaiting approval.',
    time: 'Yesterday',
    read: true,
  },
  {
    id: 7,
    type: 'alert',
    icon: 'i-lucide-alert-circle',
    iconBg: 'rgba(239,68,68,0.1)',
    iconColor: '#ef4444',
    title: 'Driver Unassigned',
    message: 'Zone B has no assigned driver for tomorrow\'s route.',
    time: 'Yesterday',
    read: true,
  },
])

const activeFilter = ref<'all' | 'unread'>('all')

const filtered = computed(() =>
  activeFilter.value === 'unread'
    ? notifications.value.filter(n => !n.read)
    : notifications.value
)

const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

function markRead(id: number) {
  const n = notifications.value.find(n => n.id === id)
  if (n) n.read = true
}

function markAllRead() {
  notifications.value.forEach(n => (n.read = true))
}

function dismiss(id: number) {
  notifications.value = notifications.value.filter(n => n.id !== id)
}
</script>

<template>
  <div
    style="position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:50;display:flex;align-items:flex-start;justify-content:flex-end;padding:72px 24px 0"
    @click.self="emit('close')"
  >
    <div style="background:white;border:1px solid #e5e7eb;border-radius:16px;width:400px;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 10px 40px rgba(0,0,0,0.15);position:relative">

      <!-- Header -->
      <div style="padding:20px 20px 14px;border-bottom:1px solid #e5e7eb;flex-shrink:0">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div style="display:flex;align-items:center;gap:8px">
            <p style="font-size:18px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Notifications</p>
            <span v-if="unreadCount > 0" style="font-size:11px;font-weight:700;color:white;background:#ef4444;border-radius:9999px;padding:2px 7px;font-family:'Manrope',sans-serif">{{ unreadCount }}</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <button
              v-if="unreadCount > 0"
              style="font-size:12px;font-weight:500;color:#ffb400;background:none;border:none;cursor:pointer;font-family:'Manrope',sans-serif;padding:0"
              @click="markAllRead"
            >Mark all read</button>
            <button
              style="width:28px;height:28px;border:none;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:8px"
              @click="emit('close')"
              @mouseover="($event.currentTarget as HTMLElement).style.background='#f3f4f6'"
              @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
            >
              <UIcon name="i-lucide-x" style="width:16px;height:16px;color:#6b7280" />
            </button>
          </div>
        </div>

        <!-- Filter tabs -->
        <div style="display:flex;gap:4px">
          <button
            v-for="f in (['all', 'unread'] as const)"
            :key="f"
            :style="`height:30px;padding:0 14px;border:none;border-radius:20px;font-size:13px;font-weight:500;font-family:'Manrope',sans-serif;cursor:pointer;
              background:${activeFilter === f ? '#1a1a1a' : '#f3f4f6'};
              color:${activeFilter === f ? 'white' : '#6b7280'}`"
            @click="activeFilter = f"
          >{{ f === 'all' ? 'All' : `Unread (${unreadCount})` }}</button>
        </div>
      </div>

      <!-- List -->
      <div style="flex:1;overflow-y:auto">
        <p
          v-if="filtered.length === 0"
          style="padding:48px 20px;text-align:center;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif"
        >No notifications</p>

        <div
          v-for="n in filtered"
          :key="n.id"
          :style="`padding:14px 20px;border-bottom:1px solid #f3f4f6;display:flex;gap:12px;align-items:flex-start;cursor:pointer;transition:background 0.1s;
            background:${n.read ? 'white' : '#fffdf5'}`"
          @click="markRead(n.id)"
          @mouseover="($event.currentTarget as HTMLElement).style.background='#f9fafb'"
          @mouseleave="($event.currentTarget as HTMLElement).style.background = n.read ? 'white' : '#fffdf5'"
        >
          <!-- Icon -->
          <div :style="`width:38px;height:38px;border-radius:9999px;background:${n.iconBg};display:flex;align-items:center;justify-content:center;flex-shrink:0`">
            <UIcon :name="n.icon" :style="`width:18px;height:18px;color:${n.iconColor}`" />
          </div>

          <!-- Content -->
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:2px">
              <p :style="`font-size:13px;font-weight:${n.read ? '500' : '600'};color:#1a1a1a;font-family:'Manrope',sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis`">{{ n.title }}</p>
              <span style="font-size:11px;color:#9ca3af;font-family:'Manrope',sans-serif;white-space:nowrap;flex-shrink:0">{{ n.time }}</span>
            </div>
            <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;line-height:1.5">{{ n.message }}</p>
          </div>

          <!-- Unread dot + dismiss -->
          <div style="display:flex;flex-direction:column;align-items:center;gap:6px;flex-shrink:0">
            <span v-if="!n.read" style="width:8px;height:8px;border-radius:9999px;background:#ffb400;display:block;margin-top:4px" />
            <button
              style="width:22px;height:22px;border:none;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:6px;opacity:0"
              class="dismiss-btn"
              @click.stop="dismiss(n.id)"
              @mouseover="($event.currentTarget as HTMLElement).style.background='#fee2e2';($event.currentTarget as HTMLElement).style.opacity='1'"
              @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent';($event.currentTarget as HTMLElement).style.opacity='0'"
            >
              <UIcon name="i-lucide-x" style="width:11px;height:11px;color:#ef4444" />
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div style="padding:12px 20px;border-top:1px solid #e5e7eb;flex-shrink:0;text-align:center">
        <button
          style="font-size:13px;font-weight:500;color:#6b7280;background:none;border:none;cursor:pointer;font-family:'Manrope',sans-serif"
          @mouseover="($event.currentTarget as HTMLElement).style.color='#1a1a1a'"
          @mouseleave="($event.currentTarget as HTMLElement).style.color='#6b7280'"
        >View all notifications</button>
      </div>

    </div>
  </div>
</template>
