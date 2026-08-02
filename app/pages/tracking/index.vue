<script setup lang="ts">
import type { DriverTracking, Driver } from '~/types/driver'
import { nextTick } from 'vue'

definePageMeta({ layout: 'dashboard' })

const config = useRuntimeConfig()
const authStore = useAuthStore()

const drivers = ref<Map<string, DriverTracking>>(new Map())
const driverDetails = ref<Map<string, Driver>>(new Map())
const loading = ref(true)
const mapError = ref('')
const mapFailed = ref(false)
const streamError = ref('')
const connected = ref(false)

let map: any = null
let abortController: AbortController | null = null
let iconsLoaded = false
let mapReady = false
let hasFitOnce = false
let PopupClass: any = null
let hoverPopup: any = null
let staleTimer: ReturnType<typeof setInterval> | null = null
let detailsTimer: ReturnType<typeof setInterval> | null = null

// A driver is considered offline if their last fix is older than this
const STALE_AFTER_MS = 60_000

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

// Merge live tracking data with static driver profiles (name, truck, zone, ...)
const enrichedDrivers = computed(() =>
  driversList.value.map(t => {
    const d = driverDetails.value.get(t.driverId)
    return {
      ...t,
      name: d?.name || d?.user?.name || 'Unknown Driver',
      phoneNumber: d?.phoneNumber ?? '',
      plateNumber: d?.assignedTruck?.plateNumber ?? '',
      zoneName: d?.zone?.name ?? '',
    }
  })
)

// Panel list: only drivers with a valid fix (matches the map), online first
const panelDrivers = computed(() =>
  enrichedDrivers.value
    .filter(d => d.lat && d.lng)
    .sort((a, b) => {
      if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1
      return a.name.localeCompare(b.name)
    })
)

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?'
}

function timeAgo(iso: string): string {
  if (!iso) return '—'
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  return `${Math.floor(diffMin / 60)}h ago`
}

function formatCoord(lat: number, lng: number): string {
  if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) return '—'
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
}

async function fetchDriverDetails() {
  const api = useApi()
  const data = await api.get<{ data: Driver[] }>('/drivers/admin/', 'Failed to load driver details')
  if (data?.data) {
    for (const d of data.data) {
      driverDetails.value.set(d.id, d)
    }
  }
}

async function initMap() {
  const apiKey = config.public.tomtomApiKey
  console.log('[Map] API Key:', apiKey ? 'present' : 'missing')

  if (!apiKey) {
    mapFailed.value = true
    mapError.value = 'TomTom API key not configured. Set NUXT_PUBLIC_TOMTOM_API_KEY environment variable.'
    return
  }

  await nextTick()

  const container = document.getElementById('driver-map')
  console.log('[Map] Container:', container ? 'found' : 'not found')

  if (!container) {
    mapFailed.value = true
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
        const maplibreModule: any = await import('maplibre-gl')
        PopupClass = maplibreModule.default?.Popup ?? maplibreModule.Popup
      } catch (err) {
        console.error('[Map] Failed to load maplibre for popups:', err)
      }
      try {
        await loadTruckIcons(map.mapLibreMap)
      } catch (err) {
        // Non-fatal: updateMarkers falls back to colored circle markers
        console.error('[Map] Failed to load truck icons, using circle fallback:', err)
      }
      setupMapInteractions(map.mapLibreMap)
      mapReady = true
      loading.value = false
      updateMarkers()
    })

    map.mapLibreMap.on('error', (e: any) => {
      console.error('[Map] Map error:', e)
      mapFailed.value = true
      mapError.value = 'Map failed to load. Check console for details.'
    })
  } catch (err) {
    console.error('[Map] Failed to initialize map:', err)
    mapFailed.value = true
    mapError.value = 'Failed to load map. Please refresh the page.'
  }
}

function updateMarkers() {
  if (!map?.mapLibreMap) return
  const mapLibreMap = map.mapLibreMap

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

  const existingSource = mapLibreMap.getSource('drivers')
  if (existingSource) {
    // Update in place — avoids tearing down/re-adding the layer on every tick
    ;(existingSource as any).setData(geojson)
  } else {
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
  }

  // Fit the camera once when we first have data; don't fight the user afterwards
  if (!hasFitOnce) {
    const coords = driversArray
      .filter(d => d.lat && d.lng)
      .map(d => [d.lng, d.lat] as [number, number])
    if (coords.length > 0) {
      const minLng = Math.min(...coords.map(c => c[0]))
      const maxLng = Math.max(...coords.map(c => c[0]))
      const minLat = Math.min(...coords.map(c => c[1]))
      const maxLat = Math.max(...coords.map(c => c[1]))
      mapLibreMap.fitBounds(
        [[minLng, minLat], [maxLng, maxLat]],
        { padding: 80, maxZoom: 14 },
      )
      hasFitOnce = true
    }
  }
}

// Build the hover-popup HTML for a driver marker from its live props + profile
function driverPopupHtml(driverId: string, props: any): string {
  const d = driverDetails.value.get(driverId)
  const name = d?.name || d?.user?.name || 'Driver'
  const online = !!props.isOnline
  const speed = Number(props.speed) || 0
  const plate = d?.assignedTruck?.plateNumber
  const zone = d?.zone?.name
  const phone = d?.phoneNumber
  const rows: string[] = []
  rows.push(`<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px"><div style="width:8px;height:8px;border-radius:50%;background:${online ? '#22c55e' : '#9ca3af'}"></div><span style="font-size:12px;color:#6b7280">${online ? 'Online' : 'Offline'}</span></div>`)
  rows.push(`<div style="font-size:12px;color:#6b7280">Speed: ${speed.toFixed(1)} km/h</div>`)
  if (plate) rows.push(`<div style="font-size:12px;color:#6b7280">Truck: ${plate}</div>`)
  if (zone) rows.push(`<div style="font-size:12px;color:#6b7280">Zone: ${zone}</div>`)
  if (phone) rows.push(`<div style="font-size:12px;color:#6b7280">Phone: ${phone}</div>`)
  return `<div style="font-family:'Manrope',sans-serif;padding:4px 0;min-width:180px"><div style="font-size:14px;font-weight:700;color:#111;margin-bottom:6px">${name}</div>${rows.join('')}</div>`
}

// Hover popup + cursor. Registered once — updateMarkers re-creates the layer,
// but delegated handlers are matched by layer id at event time, so they persist.
function setupMapInteractions(mapLibreMap: any) {
  mapLibreMap.on('mouseenter', 'drivers-truck', (e: any) => {
    mapLibreMap.getCanvas().style.cursor = 'pointer'
    const f = e.features?.[0]
    if (!f || !PopupClass) return
    if (!hoverPopup) hoverPopup = new PopupClass({ offset: 20, closeButton: false })
    hoverPopup.setLngLat(f.geometry.coordinates).setHTML(driverPopupHtml(f.properties.driverId, f.properties)).addTo(mapLibreMap)
  })

  mapLibreMap.on('mousemove', 'drivers-truck', (e: any) => {
    const f = e.features?.[0]
    if (!f || !hoverPopup) return
    hoverPopup.setLngLat(f.geometry.coordinates).setHTML(driverPopupHtml(f.properties.driverId, f.properties))
  })

  mapLibreMap.on('mouseleave', 'drivers-truck', () => {
    mapLibreMap.getCanvas().style.cursor = ''
    if (hoverPopup) {
      hoverPopup.remove()
      hoverPopup = null
    }
  })
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
  fetchDriverDetails()
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

    <!-- Connection status -->
    <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
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

    <!-- Map + driver panel -->
    <div style="display:flex;gap:24px;align-items:stretch">
    <div
      class="tracking-map"
      style="flex:1;min-width:0;background:white;border:1px solid #ececec;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);height:700px;position:relative"
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

    <!-- Driver panel -->
    <div style="width:360px;flex-shrink:0;background:white;border:1px solid #ececec;border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,0.1);height:700px;display:flex;flex-direction:column;overflow:hidden">
      <div style="padding:20px 24px;border-bottom:1px solid #ececec;flex-shrink:0">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <p style="font-size:16px;font-weight:700;color:#111;font-family:'Manrope',sans-serif">Drivers</p>
          <span style="font-size:12px;font-weight:600;color:#16a34a;background:#dcfce7;border-radius:20px;padding:3px 10px">{{ onlineCount }} online</span>
        </div>
        <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:4px">Live location of connected drivers</p>
      </div>

      <div style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px">
        <div v-if="panelDrivers.length === 0" style="text-align:center;padding:40px 16px">
          <UIcon name="i-lucide-users" style="width:32px;height:32px;color:#d1d5db;margin-bottom:8px" />
          <p style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif">No drivers reporting location yet.</p>
        </div>

        <div
          v-for="d in panelDrivers"
          :key="d.driverId"
          style="border:1px solid #ececec;border-radius:12px;padding:14px 16px;display:flex;flex-direction:column;gap:10px"
        >
          <!-- Name + status -->
          <div style="display:flex;align-items:center;gap:10px">
            <div :style="`width:36px;height:36px;border-radius:50%;background:${d.isOnline ? 'rgba(34,197,94,0.15)' : 'rgba(107,114,128,0.15)'};color:${d.isOnline ? '#16a34a' : '#6b7280'};display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;font-family:'Manrope',sans-serif;flex-shrink:0`">{{ initials(d.name) }}</div>
            <div style="flex:1;min-width:0">
              <p style="font-size:14px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ d.name }}</p>
              <p style="font-size:11px;color:#6b7280;font-family:'Manrope',sans-serif">{{ d.plateNumber ? 'Truck ' + d.plateNumber : 'No truck assigned' }}</p>
            </div>
            <span :style="`font-size:11px;font-weight:600;padding:2px 9px;border-radius:20px;flex-shrink:0;${d.isOnline ? 'background:#dcfce7;color:#16a34a' : 'background:#f3f4f6;color:#9ca3af'}`">{{ d.isOnline ? 'Online' : 'Offline' }}</span>
          </div>

          <!-- Details -->
          <div style="display:flex;flex-direction:column;gap:5px">
            <div style="display:flex;align-items:center;gap:8px">
              <UIcon name="i-lucide-map-pin" style="width:13px;height:13px;color:#9ca3af;flex-shrink:0" />
              <span style="font-size:12px;color:#374151;font-family:'Manrope',sans-serif">{{ formatCoord(d.lat, d.lng) }}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <UIcon name="i-lucide-gauge" style="width:13px;height:13px;color:#9ca3af;flex-shrink:0" />
              <span style="font-size:12px;color:#374151;font-family:'Manrope',sans-serif">{{ (d.speed || 0).toFixed(1) }} km/h</span>
            </div>
            <div v-if="d.zoneName" style="display:flex;align-items:center;gap:8px">
              <UIcon name="i-lucide-map" style="width:13px;height:13px;color:#9ca3af;flex-shrink:0" />
              <span style="font-size:12px;color:#374151;font-family:'Manrope',sans-serif">{{ d.zoneName }}</span>
            </div>
            <div v-if="d.phoneNumber" style="display:flex;align-items:center;gap:8px">
              <UIcon name="i-lucide-phone" style="width:13px;height:13px;color:#9ca3af;flex-shrink:0" />
              <span style="font-size:12px;color:#374151;font-family:'Manrope',sans-serif">{{ d.phoneNumber }}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <UIcon name="i-lucide-clock" style="width:13px;height:13px;color:#9ca3af;flex-shrink:0" />
              <span style="font-size:12px;color:#9ca3af;font-family:'Manrope',sans-serif">Updated {{ timeAgo(d.recordedAt) }}</span>
            </div>
          </div>
        </div>
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
