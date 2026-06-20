<script setup lang="ts">
import type { DriverTracking } from '~/types/driver'
import { nextTick } from 'vue'

definePageMeta({ layout: 'dashboard' })

const config = useRuntimeConfig()
const authStore = useAuthStore()

const drivers = ref<Map<string, DriverTracking>>(new Map())
const loading = ref(true)
const mapError = ref('')
const connected = ref(false)

let map: any = null
let eventSource: EventSource | null = null
let abortController: AbortController | null = null

const driversList = computed(() => Array.from(drivers.value.values()))
const onlineCount = computed(() => driversList.value.filter(d => d.isOnline).length)
const offlineCount = computed(() => driversList.value.filter(d => !d.isOnline).length)

async function initMap() {
  const apiKey = config.public.tomtomApiKey
  console.log('[Map] API Key:', apiKey ? 'present' : 'missing')
  
  if (!apiKey) {
    mapError.value = 'TomTom API key not configured. Set NUXT_PUBLIC_TOMTOM_API_KEY environment variable.'
    return
  }

  // Wait for DOM to be ready
  await nextTick()
  
  const container = document.getElementById('driver-map')
  console.log('[Map] Container:', container ? 'found' : 'not found')
  
  if (!container) {
    mapError.value = 'Map container not found in DOM'
    return
  }

  try {
    console.log('[Map] Loading TomTom SDK...')
    const { TomTomConfig } = await import('@tomtom-org/maps-sdk/core')
    const { TomTomMap } = await import('@tomtom-org/maps-sdk/map')
    console.log('[Map] SDK loaded, initializing...')

    TomTomConfig.instance.put({ apiKey })

    map = new TomTomMap({
      style: 'standardLight',
      mapLibre: {
        container: 'driver-map',
        center: [-0.1866, 5.6037],
        zoom: 11,
      },
    })

    console.log('[Map] TomTomMap instance created')

    map.mapLibreMap.on('load', () => {
      console.log('[Map] Map loaded successfully')
      loading.value = false
      updateMarkers()
    })

    map.mapLibreMap.on('error', (e: any) => {
      console.error('[Map] Map error:', e)
      mapError.value = 'Map failed to load. Check console for details.'
    })
  } catch (err) {
    console.error('[Map] Failed to initialize map:', err)
    mapError.value = 'Failed to load map. Please refresh the page.'
  }
}

function updateMarkers() {
  if (!map?.mapLibreMap) return
  const mapLibreMap = map.mapLibreMap

  if (mapLibreMap.getLayer('drivers-circle-border')) mapLibreMap.removeLayer('drivers-circle-border')
  if (mapLibreMap.getLayer('drivers-circle')) mapLibreMap.removeLayer('drivers-circle')
  if (mapLibreMap.getSource('drivers')) mapLibreMap.removeSource('drivers')

  const driversArray = driversList.value
  const geojson = {
    type: 'FeatureCollection' as const,
    features: driversArray
      .filter(d => d.lat && d.lng)
      .map((d, i) => ({
        type: 'Feature' as const,
        id: i,
        geometry: {
          type: 'Point' as const,
          coordinates: [d.lng, d.lat],
        },
        properties: {
          driverId: d.driverId,
          isOnline: d.isOnline,
          speed: d.speed,
          heading: d.heading,
          recordedAt: d.recordedAt,
        },
      })),
  }

  mapLibreMap.addSource('drivers', { type: 'geojson', data: geojson })

  mapLibreMap.addLayer({
    id: 'drivers-circle',
    type: 'circle',
    source: 'drivers',
    paint: {
      'circle-radius': 10,
      'circle-color': ['case', ['get', 'isOnline'], '#22c55e', '#9ca3af'],
      'circle-stroke-width': 3,
      'circle-stroke-color': '#ffffff',
    },
  })

  mapLibreMap.addLayer({
    id: 'drivers-circle-border',
    type: 'circle',
    source: 'drivers',
    paint: {
      'circle-radius': 14,
      'circle-color': 'transparent',
      'circle-stroke-width': 2,
      'circle-stroke-color': ['case', ['get', 'isOnline'], 'rgba(34,197,94,0.3)', 'rgba(156,163,175,0.3)'],
    },
  })

  mapLibreMap.on('click', 'drivers-circle', (e: any) => {
    if (!e.features?.[0]) return
    const props = e.features[0].properties
    const coords = e.features[0].geometry.coordinates

    new mapLibreMap.Popup({ offset: 20, closeButton: false })
      .setLngLat(coords)
      .setHTML(`
        <div style="font-family:'Manrope',sans-serif;padding:4px 0;min-width:160px">
          <div style="font-size:14px;font-weight:600;color:#111;margin-bottom:6px">Driver</div>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
            <div style="width:8px;height:8px;border-radius:50%;background:${props.isOnline ? '#22c55e' : '#9ca3af'}"></div>
            <span style="font-size:12px;color:#6b7280">${props.isOnline ? 'Online' : 'Offline'}</span>
          </div>
          <div style="font-size:12px;color:#6b7280">Speed: ${props.speed?.toFixed(1) || 0} km/h</div>
          <div style="font-size:12px;color:#6b7280">Heading: ${props.heading?.toFixed(0) || 0}°</div>
        </div>
      `)
      .addTo(mapLibreMap)
  })

  mapLibreMap.on('mouseenter', 'drivers-circle', () => {
    mapLibreMap.getCanvas().style.cursor = 'pointer'
  })
  mapLibreMap.on('mouseleave', 'drivers-circle', () => {
    mapLibreMap.getCanvas().style.cursor = ''
  })

  if (driversArray.length > 0) {
    const coords = driversArray
      .filter(d => d.lat && d.lng)
      .map(d => [d.lng, d.lat])
    if (coords.length > 0) {
      const minLng = Math.min(...coords.map((c: number[]) => c[0] as number))
      const maxLng = Math.max(...coords.map((c: number[]) => c[0] as number))
      const minLat = Math.min(...coords.map((c: number[]) => c[1] as number))
      const maxLat = Math.max(...coords.map((c: number[]) => c[1] as number))
      mapLibreMap.fitBounds(
        [[minLng, minLat], [maxLng, maxLat]],
        { padding: 80, maxZoom: 14 },
      )
    }
  }
}

function connectSSE() {
  if (!authStore.token) {
    mapError.value = 'Not authenticated. Please log in again.'
    return
  }

  abortController = new AbortController()
  const url = `${config.public.apiBase}/tracking/sse/drivers`

  fetch(url, {
    headers: {
      'Authorization': `Bearer ${authStore.token}`,
      'Accept': 'text/event-stream',
    },
    signal: abortController.signal,
  }).then(async (response) => {
    if (!response.ok) {
      mapError.value = `Failed to connect to tracking stream (${response.status})`
      return
    }

    connected.value = true
    loading.value = false

    const reader = response.body?.getReader()
    if (!reader) {
      mapError.value = 'Failed to read tracking stream'
      return
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))
            if (data && data.driverId) {
              drivers.value.set(data.driverId, data)
              if (map?.mapLibreMap?.isStyleLoaded()) {
                updateMarkers()
              }
            }
          } catch (err) {
            console.error('Failed to parse SSE data:', err)
          }
        }
      }
    }
  }).catch((err) => {
    if (err.name !== 'AbortError') {
      console.error('SSE connection error:', err)
      mapError.value = 'Lost connection to tracking stream'
      connected.value = false
    }
  })
}

function disconnectSSE() {
  if (abortController) {
    abortController.abort()
    abortController = null
  }
  connected.value = false
}

onMounted(async () => {
  await initMap()
  connectSSE()
})

onUnmounted(() => {
  disconnectSSE()
  if (map?.remove) map.remove()
})
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:32px">

    <!-- Header -->
    <div>
      <h1 style="font-size:32px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;line-height:1.3">Driver Tracking</h1>
      <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:8px">Real-time location of all drivers on the map</p>
    </div>

    <!-- Stats row -->
    <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
      <div style="background:white;border:1px solid #ececec;border-radius:12px;padding:16px 24px;display:flex;align-items:center;gap:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
        <div style="width:40px;height:40px;background:rgba(255,180,0,0.1);border-radius:12px;display:flex;align-items:center;justify-content:center">
          <UIcon name="i-lucide-users" style="width:20px;height:20px;color:#ffb400" />
        </div>
        <div>
          <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;line-height:1">Total Drivers</p>
          <p style="font-size:20px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;line-height:1.3;margin-top:2px">{{ driversList.length }}</p>
        </div>
      </div>
      <div style="background:white;border:1px solid #ececec;border-radius:12px;padding:16px 24px;display:flex;align-items:center;gap:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
        <div style="width:40px;height:40px;background:rgba(34,197,94,0.1);border-radius:12px;display:flex;align-items:center;justify-content:center">
          <div style="width:10px;height:10px;border-radius:50%;background:#22c55e"></div>
        </div>
        <div>
          <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;line-height:1">Online</p>
          <p style="font-size:20px;font-weight:700;color:#22c55e;font-family:'Manrope',sans-serif;line-height:1.3;margin-top:2px">{{ onlineCount }}</p>
        </div>
      </div>
      <div style="background:white;border:1px solid #ececec;border-radius:12px;padding:16px 24px;display:flex;align-items:center;gap:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
        <div style="width:40px;height:40px;background:rgba(107,114,128,0.1);border-radius:12px;display:flex;align-items:center;justify-content:center">
          <div style="width:10px;height:10px;border-radius:50%;background:#9ca3af"></div>
        </div>
        <div>
          <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;line-height:1">Offline</p>
          <p style="font-size:20px;font-weight:700;color:#6b7280;font-family:'Manrope',sans-serif;line-height:1.3;margin-top:2px">{{ offlineCount }}</p>
        </div>
      </div>
      <div style="margin-left:auto;display:flex;align-items:center;gap:8px">
        <div :style="`width:8px;height:8px;border-radius:50%;background:${connected ? '#22c55e' : '#ef4444'}`"></div>
        <span style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif">{{ connected ? 'Live' : 'Disconnected' }}</span>
      </div>
    </div>

    <!-- Map -->
    <div
      class="tracking-map"
      style="background:white;border:1px solid #ececec;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);height:700px;position:relative"
    >
      <!-- Loading overlay -->
      <div
        v-if="loading"
        style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.8);z-index:10;border-radius:16px"
      >
        <div style="display:flex;flex-direction:column;align-items:center;gap:12px">
          <div style="width:32px;height:32px;border:3px solid #e5e7eb;border-top-color:#ffb400;border-radius:50%;animation:spin 0.8s linear infinite"></div>
          <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Connecting to live tracking...</p>
        </div>
      </div>

      <!-- Error state -->
      <div
        v-if="mapError"
        style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:white;z-index:10;border-radius:16px"
      >
        <div style="display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center;padding:32px">
          <UIcon name="i-lucide-alert-circle" style="width:48px;height:48px;color:#ef4444" />
          <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;max-width:320px">{{ mapError }}</p>
        </div>
      </div>

      <!-- Map container -->
      <div id="driver-map" style="width:100%;height:100%"></div>

      <!-- Legend -->
      <div style="position:absolute;bottom:16px;left:16px;background:white;border:1px solid #ececec;border-radius:10px;padding:10px 16px;display:flex;align-items:center;gap:16px;box-shadow:0 2px 8px rgba(0,0,0,0.08);z-index:5">
        <div style="display:flex;align-items:center;gap:6px">
          <div style="width:12px;height:12px;border-radius:50%;background:#22c55e;border:2px solid white;box-shadow:0 0 0 1px #22c55e"></div>
          <span style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">Online</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          <div style="width:12px;height:12px;border-radius:50%;background:#9ca3af;border:2px solid white;box-shadow:0 0 0 1px #9ca3af"></div>
          <span style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">Offline</span>
        </div>
      </div>
    </div>

  </div>
</template>
