<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const trucks = ref([
  {
    id: 'T-001', driver: 'John Smith', status: 'on-route',
    location: 'Downtown - Oak Street', nextStop: '123 Oak Street',
    eta: '2 min', stopsCompleted: 12, stopsTotal: 24,
  },
  {
    id: 'T-003', driver: 'Maria Garcia', status: 'on-route',
    location: 'Westside - Maple Ave', nextStop: '456 Maple Ave',
    eta: '5 min', stopsCompleted: 15, stopsTotal: 28,
  },
  {
    id: 'T-007', driver: 'James Wilson', status: 'on-route',
    location: 'Eastside - Pine Road', nextStop: '789 Pine Road',
    eta: '3 min', stopsCompleted: 10, stopsTotal: 22,
  },
  {
    id: 'T-012', driver: 'Lisa Anderson', status: 'idle',
    location: 'Northside Depot', nextStop: 'Awaiting assignment',
    eta: null, stopsCompleted: 0, stopsTotal: 0,
  },
])

const onRouteCount = computed(() => trucks.value.filter(t => t.status === 'on-route').length)

function statusBadge(s: string) {
  if (s === 'on-route') return { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)', color: '#22c55e', label: 'on-route' }
  if (s === 'idle')     return { bg: 'rgba(255,180,0,0.1)',  border: 'rgba(255,180,0,0.2)',  color: '#d49a00',  label: 'idle' }
  return                       { bg: '#e5e7eb',              border: '#e5e7eb',              color: '#6b7280',  label: s }
}

function progressPct(completed: number, total: number) {
  if (!total) return 0
  return Math.round((completed / total) * 100)
}
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:32px">

    <!-- Header -->
    <div>
      <h1 style="font-size:32px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;line-height:1.3">Live Tracking</h1>
      <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:8px">Real-time tracking of all active trucks</p>
    </div>

    <!-- Main layout: map + sidebar -->
    <div style="display:grid;grid-template-columns:1fr 344px;gap:24px;align-items:start">

      <!-- Map card -->
      <div style="background:white;border:1px solid #ececec;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);height:700px;display:flex;flex-direction:column;padding:1px">
        <div style="flex:1;background:#f8f9fa;border-radius:16px;display:flex;align-items:center;justify-content:center">
          <div style="display:flex;flex-direction:column;align-items:center;gap:16px">
            <!-- Map icon -->
            <div style="width:64px;height:64px;display:flex;align-items:center;justify-content:center">
              <UIcon name="i-lucide-map" style="width:64px;height:64px;color:#6b7280;opacity:0.4" />
            </div>
            <p style="font-size:18px;font-weight:500;color:#6b7280;font-family:'Manrope',sans-serif">Live GPS Map</p>
            <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;text-align:center;max-width:320px">Real-time truck locations with color-coded status markers</p>
            <!-- Legend -->
            <div style="display:flex;align-items:center;gap:16px;margin-top:4px">
              <div style="display:flex;align-items:center;gap:8px">
                <div style="width:12px;height:12px;border-radius:50%;background:#22c55e;flex-shrink:0"></div>
                <span style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">On Route</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <div style="width:12px;height:12px;border-radius:50%;background:#ffb400;flex-shrink:0"></div>
                <span style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">Idle</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <div style="width:12px;height:12px;border-radius:50%;background:#6b7280;flex-shrink:0"></div>
                <span style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">Offline</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Active Trucks sidebar -->
      <div style="background:white;border:1px solid #ececec;border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,0.1);overflow:hidden;padding:1px;height:700px;display:flex;flex-direction:column">

        <!-- Header -->
        <div style="padding:24px 24px 0;flex-shrink:0">
          <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;line-height:1.4">Active Trucks</p>
          <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:4px">{{ onRouteCount }} trucks on route</p>
        </div>

        <!-- Truck list -->
        <div style="padding:16px 24px 24px;display:flex;flex-direction:column;gap:16px;overflow-y:auto;flex:1">
          <div
            v-for="truck in trucks"
            :key="truck.id"
            style="background:white;border:1px solid #e5e7eb;border-radius:16px;padding:17px 17px 1px;display:flex;flex-direction:column;gap:12px"
          >
            <!-- Truck header: icon + id/driver + badge -->
            <div style="display:flex;align-items:center;justify-content:space-between">
              <div style="display:flex;align-items:center;gap:12px">
                <div style="width:40px;height:40px;background:#ffb400;border-radius:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  <UIcon name="i-lucide-truck" style="width:20px;height:20px;color:#0a0d12" />
                </div>
                <div>
                  <p style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;line-height:1.4">{{ truck.id }}</p>
                  <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;line-height:1.3">{{ truck.driver }}</p>
                </div>
              </div>
              <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 11px;white-space:nowrap;color:${statusBadge(truck.status).color};background:${statusBadge(truck.status).bg};border:1px solid ${statusBadge(truck.status).border}`">
                {{ statusBadge(truck.status).label }}
              </span>
            </div>

            <!-- Details -->
            <div style="display:flex;flex-direction:column;gap:8px;padding-bottom:16px">
              <!-- Current Location -->
              <div style="display:flex;align-items:flex-start;gap:8px">
                <UIcon name="i-lucide-map-pin" style="width:16px;height:16px;color:#6b7280;flex-shrink:0;margin-top:2px" />
                <div>
                  <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;line-height:1.3">Current Location</p>
                  <p style="font-size:14px;color:#111;font-family:'Manrope',sans-serif;line-height:1.4">{{ truck.location }}</p>
                </div>
              </div>
              <!-- Next Stop -->
              <div style="display:flex;align-items:flex-start;gap:8px">
                <UIcon name="i-lucide-navigation" style="width:16px;height:16px;color:#6b7280;flex-shrink:0;margin-top:2px" />
                <div>
                  <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;line-height:1.3">Next Stop</p>
                  <p style="font-size:14px;color:#111;font-family:'Manrope',sans-serif;line-height:1.4">{{ truck.nextStop }}</p>
                </div>
              </div>
              <!-- ETA (only for on-route) -->
              <div v-if="truck.eta" style="display:flex;align-items:flex-start;gap:8px">
                <UIcon name="i-lucide-clock" style="width:16px;height:16px;color:#6b7280;flex-shrink:0;margin-top:2px" />
                <div>
                  <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;line-height:1.3">ETA</p>
                  <p style="font-size:14px;font-weight:500;color:#ffb400;font-family:'Manrope',sans-serif;line-height:1.4">{{ truck.eta }}</p>
                </div>
              </div>
              <!-- Progress bar (only for on-route) -->
              <div v-if="truck.stopsTotal > 0" style="border-top:1px solid #e5e7eb;padding-top:9px;display:flex;flex-direction:column;gap:6px">
                <div style="display:flex;align-items:center;justify-content:space-between">
                  <span style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">Progress</span>
                  <span style="font-size:12px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">{{ truck.stopsCompleted }}/{{ truck.stopsTotal }} stops</span>
                </div>
                <div style="height:6px;background:#e5e7eb;border-radius:999px;overflow:hidden">
                  <div :style="`height:6px;background:#ffb400;border-radius:999px;width:${progressPct(truck.stopsCompleted, truck.stopsTotal)}%`"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>
