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
let abortController: AbortController | null = null
let iconsLoaded = false

function truckIconDataUrl(bodyColor: string, accentColor: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <g stroke="${accentColor}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">
      <rect x="6" y="14" width="34" height="28" rx="3" fill="${bodyColor}"/>
      <path d="M40 42 V28 L48 28 L57 34 V42 Z" fill="${bodyColor}"/>
      <rect x="42" y="30" width="12" height="6" rx="1" fill="${accentColor}" stroke="none"/>
    </g>
    <circle cx="16" cy="44" r="6" fill="${accentColor}"/>
    <circle cx="46" cy="44" r="6" fill="${accentColor}"/>
    <circle cx="16" cy="44" r="2.5" fill="${bodyColor}"/>
    <circle cx="46" cy="44" r="2.5" fill="${bodyColor}"/>
  </svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function loadTruckIcons(mapLibreMap: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const PRIMARY = '#ffb400'
    const BLACK = '#111111'
    const onlineUrl = truckIconDataUrl(PRIMARY, BLACK)
    const offlineUrl = truckIconDataUrl(BLACK, PRIMARY)

    if (!onlineUrl || !offlineUrl) {
      console.error('[Map] Failed to generate truck icons')
      reject(new Error('Failed to generate truck icons'))
      return
    }

    const onlineImg = new Image()
    const offlineImg = new Image()
    let loaded = 0
    let failed = false

    const onLoad = () => {
      if (failed) return
      if (++loaded === 2) {
        try {
          mapLibreMap.addImage('truck-online', onlineImg, { pixelRatio: 2 })
          mapLibreMap.addImage('truck-offline', offlineImg, { pixelRatio: 2 })
          iconsLoaded = true
          console.log('[Map] Truck icons loaded successfully')
          resolve()
        } catch (err) {
          console.error('[Map] Failed to add icons to map:', err)
          reject(err)
        }
      }
    }

    const onError = (e: any) => {
      failed = true
      console.error('[Map] Failed to load truck icon image:', e)
      reject(new Error('Failed to load truck icon image'))
    }

    onlineImg.onload = onLoad
    offlineImg.onload = onLoad
    onlineImg.onerror = onError
    offlineImg.onerror = onError
    onlineImg.src = onlineUrl
    offlineImg.src = offlineUrl
  })
}

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

    map.mapLibreMap.on('load', async () => {
      console.log('[Map] Map loaded successfully')
      try {
        await loadTruckIcons(map.mapLibreMap)
      } catch (err) {
        console.error('[Map] Failed to load truck icons:', err)
        mapError.value = 'Failed to load driver markers. Please refresh the page.'
      }
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

  if (mapLibreMap.getLayer('drivers-truck')) mapLibreMap.removeLayer('drivers-truck')
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

  if (iconsLoaded) {
    mapLibreMap.addLayer({
      id: 'drivers-truck',
      type: 'symbol',
      source: 'drivers',
      layout: {
        'icon-image': ['case', ['get', 'isOnline'], 'truck-online', 'truck-offline'],
        'icon-size': 1.2,
        'icon-allow-overlap': true,
        'icon-rotate': ['get', 'heading'],
        'icon-rotation-alignment': 'map',
      },
    })
  } else {
    // Fallback to colored circles if custom icons failed to load
    mapLibreMap.addLayer({
      id: 'drivers-truck',
      type: 'circle',
      source: 'drivers',
      paint: {
        'circle-radius': 8,
        'circle-color': ['case', ['get', 'isOnline'], '#ffb400', '#111111'],
        'circle-stroke-width': 2,
        'circle-stroke-color': 'white',
      },
    })
  }

  mapLibreMap.on('click', 'drivers-truck', (e: any) => {
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

  mapLibreMap.on('mouseenter', 'drivers-truck', () => {
    mapLibreMap.getCanvas().style.cursor = 'pointer'
  })
  mapLibreMap.on('mouseleave', 'drivers-truck', () => {
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

function zoomIn() {
  map?.mapLibreMap?.zoomIn()
}

function zoomOut() {
  map?.mapLibreMap?.zoomOut()
}

const reconnecting = ref(false)

async function reconnectStream() {
  reconnecting.value = true
  disconnectSSE()
  mapError.value = ''
  connectSSE()
  await new Promise(r => setTimeout(r, 1000))
  reconnecting.value = false
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
      <h1 style="font-size:32px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;line-height:1.3">Live Tracking</h1>
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
      <div style="margin-left:auto;display:flex;align-items:center;gap:12px;background:white;border:1px solid #ececec;border-radius:12px;padding:12px 20px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
        <div style="display:flex;align-items:center;gap:8px">
          <div :style="`width:8px;height:8px;border-radius:50%;background:${connected ? '#22c55e' : '#ef4444'}`"></div>
          <span style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif">{{ connected ? 'Live' : 'Disconnected' }}</span>
        </div>
        <button
          :disabled="reconnecting || connected"
          :style="{ opacity: (reconnecting || connected) ? 0.5 : 1, cursor: (reconnecting || connected) ? 'not-allowed' : 'pointer' }"
          class="reconnect-btn"
          @click="reconnectStream"
        >
          <UIcon name="i-lucide-refresh-cw" :class="{ 'spin': reconnecting }" style="width:14px;height:14px" />
          {{ reconnecting ? 'Connecting...' : connected ? 'Connected' : 'Reconnect' }}
        </button>
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
        style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.8);z-index:100;border-radius:16px"
      >
        <div style="display:flex;flex-direction:column;align-items:center;gap:12px">
          <div style="width:32px;height:32px;border:3px solid #e5e7eb;border-top-color:#ffb400;border-radius:50%;animation:spin 0.8s linear infinite"></div>
          <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Connecting to live tracking...</p>
        </div>
      </div>

      <!-- Error state -->
      <div
        v-if="mapError"
        style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:white;z-index:100;border-radius:16px"
      >
        <div style="display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center;padding:32px">
          <UIcon name="i-lucide-alert-circle" style="width:48px;height:48px;color:#ef4444" />
          <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;max-width:320px">{{ mapError }}</p>
        </div>
      </div>

      <!-- Map container -->
      <div id="driver-map" style="width:100%;height:100%"></div>

      <!-- Zoom controls -->
      <div style="position:absolute;top:16px;right:16px;display:flex;flex-direction:column;gap:4px;z-index:50">
        <button
          style="width:36px;height:36px;background:white;border:1px solid #e5e7eb;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.12);transition:background 0.15s"
          title="Zoom in"
          @mouseover="($event.currentTarget as HTMLElement).style.background='#f3f4f6'"
          @mouseout="($event.currentTarget as HTMLElement).style.background='white'"
          @click="zoomIn"
        >
          <UIcon name="i-lucide-plus" style="width:18px;height:18px;color:#374151" />
        </button>
        <button
          style="width:36px;height:36px;background:white;border:1px solid #e5e7eb;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.12);transition:background 0.15s"
          title="Zoom out"
          @mouseover="($event.currentTarget as HTMLElement).style.background='#f3f4f6'"
          @mouseout="($event.currentTarget as HTMLElement).style.background='white'"
          @click="zoomOut"
        >
          <UIcon name="i-lucide-minus" style="width:18px;height:18px;color:#374151" />
        </button>
      </div>

      <!-- Legend -->
      <div style="position:absolute;bottom:16px;left:16px;background:white;border:1px solid #ececec;border-radius:10px;padding:10px 16px;display:flex;align-items:center;gap:16px;box-shadow:0 2px 8px rgba(0,0,0,0.08);z-index:50">
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

<style scoped>
.reconnect-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #ffb400;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 13px;
  font-family: 'Manrope', sans-serif;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: background 0.15s;
}
.reconnect-btn:hover {
  background: #e5a000;
}
.spin {
  animation: spin 1s linear infinite;
}
</style>
