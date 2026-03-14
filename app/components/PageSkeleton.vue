<script setup lang="ts">
/**
 * PageSkeleton — full-page loading skeleton.
 *
 * Props:
 *   type: 'table' | 'detail' | 'dashboard' | 'card-grid' | 'tracking'
 *   rows: number of table rows to render (table type only, default 6)
 *   cards: number of stat cards (default 4)
 *
 * Usage:
 *   <PageSkeleton v-if="loading" type="table" />
 *   <PageSkeleton v-if="loading" type="detail" />
 */
const props = withDefaults(defineProps<{
  type: 'table' | 'detail' | 'dashboard' | 'card-grid' | 'tracking'
  rows?: number
  cards?: number
}>(), {
  rows: 6,
  cards: 4,
})
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:32px">

    <!-- ─── TABLE skeleton ─────────────────────────────────────────────── -->
    <template v-if="type === 'table'">
      <!-- Page heading -->
      <div style="display:flex;flex-direction:column;gap:10px">
        <div class="skeleton" style="height:36px;width:220px" />
        <div class="skeleton" style="height:16px;width:320px" />
      </div>

      <!-- Stat cards -->
      <div class="grid-cols-4">
        <div
          v-for="i in cards"
          :key="i"
          style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1);display:flex;flex-direction:column;gap:12px"
        >
          <div class="skeleton" style="height:14px;width:120px" />
          <div class="skeleton" style="height:28px;width:80px" />
        </div>
      </div>

      <!-- Filter bar -->
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <div style="display:flex;gap:16px">
          <div class="skeleton" style="height:38px;flex:1;border-radius:20px" />
          <div class="skeleton" style="height:38px;width:160px;border-radius:20px" />
          <div class="skeleton" style="height:38px;width:160px;border-radius:20px" />
          <div class="skeleton" style="height:38px;width:80px;border-radius:20px" />
        </div>
      </div>

      <!-- Table -->
      <div style="background:white;border:1px solid #ececec;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <!-- Header row -->
        <div style="background:#f8f9fa;border-bottom:1px solid #e5e7eb;padding:14px 16px;display:flex;gap:24px">
          <div v-for="j in 6" :key="j" class="skeleton" style="height:14px;flex:1" />
        </div>
        <!-- Data rows -->
        <div
          v-for="i in rows"
          :key="i"
          :style="`padding:20px 16px;display:flex;gap:24px;align-items:center;border-bottom:${i < rows ? '1px solid #e5e7eb' : 'none'}`"
        >
          <div class="skeleton" style="height:14px;flex:1.2" />
          <div class="skeleton" style="height:14px;flex:1" />
          <div class="skeleton" style="height:14px;flex:1.5" />
          <div class="skeleton" style="height:22px;width:80px;border-radius:14px" />
          <div class="skeleton" style="height:14px;flex:0.8" />
          <div class="skeleton" style="height:22px;width:70px;border-radius:14px" />
        </div>
      </div>
    </template>

    <!-- ─── DETAIL skeleton ────────────────────────────────────────────── -->
    <template v-else-if="type === 'detail'">
      <!-- Back link -->
      <div class="skeleton" style="height:16px;width:140px;border-radius:8px" />

      <!-- Profile header card -->
      <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px 25px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:16px">
            <div class="skeleton" style="width:64px;height:64px;border-radius:9999px;flex-shrink:0" />
            <div style="display:flex;flex-direction:column;gap:10px">
              <div style="display:flex;align-items:center;gap:12px">
                <div class="skeleton" style="height:24px;width:180px" />
                <div class="skeleton" style="height:22px;width:70px;border-radius:14px" />
              </div>
              <div style="display:flex;gap:16px">
                <div class="skeleton" style="height:14px;width:120px" />
                <div class="skeleton" style="height:14px;width:140px" />
                <div class="skeleton" style="height:14px;width:110px" />
              </div>
            </div>
          </div>
          <div style="display:flex;gap:8px">
            <div class="skeleton" style="height:40px;width:100px;border-radius:20px" />
            <div class="skeleton" style="height:40px;width:120px;border-radius:20px" />
          </div>
        </div>
      </div>

      <!-- Stat cards -->
      <div class="grid-cols-4">
        <div
          v-for="i in cards"
          :key="i"
          style="background:white;border:1px solid #ececec;border-radius:16px;padding:20px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.1);display:flex;flex-direction:column;gap:10px"
        >
          <div class="skeleton" style="height:13px;width:100px" />
          <div class="skeleton" style="height:24px;width:120px" />
        </div>
      </div>

      <!-- Tabbed card -->
      <div style="background:white;border:1px solid #ececec;border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <!-- Tab bar -->
        <div style="padding:0 24px;border-bottom:1px solid #e5e7eb;display:flex;gap:8px;height:52px;align-items:flex-end">
          <div v-for="i in 4" :key="i" class="skeleton" :style="`height:14px;width:${80 + i * 10}px;margin-bottom:16px`" />
        </div>
        <!-- Tab content: two-column info -->
        <div style="padding:24px;display:grid;grid-template-columns:1fr 1fr;gap:32px">
          <div style="display:flex;flex-direction:column;gap:16px">
            <div class="skeleton" style="height:20px;width:160px" />
            <div v-for="i in 5" :key="i" style="display:flex;flex-direction:column;gap:6px">
              <div class="skeleton" style="height:12px;width:80px" />
              <div class="skeleton" :style="`height:14px;width:${120 + (i % 3) * 40}px`" />
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:16px">
            <div class="skeleton" style="height:20px;width:140px" />
            <div v-for="i in 4" :key="i" style="display:flex;flex-direction:column;gap:6px">
              <div class="skeleton" style="height:12px;width:80px" />
              <div class="skeleton" :style="`height:14px;width:${100 + (i % 2) * 60}px`" />
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ─── DASHBOARD skeleton ─────────────────────────────────────────── -->
    <template v-else-if="type === 'dashboard'">
      <!-- Heading -->
      <div style="display:flex;flex-direction:column;gap:10px">
        <div class="skeleton" style="height:36px;width:200px" />
        <div class="skeleton" style="height:16px;width:280px" />
      </div>

      <!-- 3-col stat cards (6 cards) -->
      <div class="grid-cols-3">
        <div
          v-for="i in 6"
          :key="i"
          style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;height:144px;box-shadow:0 1px 3px rgba(0,0,0,0.1);display:flex;flex-direction:column;justify-content:space-between"
        >
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div class="skeleton" style="width:48px;height:48px;border-radius:16px" />
            <div class="skeleton" style="height:14px;width:60px" />
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <div class="skeleton" style="height:14px;width:120px" />
            <div class="skeleton" style="height:28px;width:100px" />
          </div>
        </div>
      </div>

      <!-- 2 charts -->
      <div class="grid-cols-2">
        <div
          v-for="i in 2"
          :key="i"
          style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1);display:flex;flex-direction:column;gap:12px"
        >
          <div class="skeleton" style="height:20px;width:160px" />
          <div class="skeleton" style="height:14px;width:240px" />
          <div class="skeleton" style="height:260px;width:100%;border-radius:12px;margin-top:4px" />
        </div>
      </div>

      <!-- 2 panels -->
      <div class="grid-cols-2">
        <div
          v-for="i in 2"
          :key="i"
          style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1);display:flex;flex-direction:column;gap:16px"
        >
          <div class="skeleton" style="height:20px;width:180px" />
          <div v-for="j in 4" :key="j" style="display:flex;align-items:center;gap:12px;padding:12px;background:#f8f9fa;border-radius:16px">
            <div class="skeleton" style="width:40px;height:40px;border-radius:16px;flex-shrink:0" />
            <div style="flex:1;display:flex;flex-direction:column;gap:6px">
              <div class="skeleton" style="height:14px;width:60%" />
              <div class="skeleton" style="height:12px;width:40%" />
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ─── CARD-GRID skeleton (drivers page) ──────────────────────────── -->
    <template v-else-if="type === 'card-grid'">
      <!-- Heading -->
      <div style="display:flex;align-items:flex-start;justify-content:space-between">
        <div style="display:flex;flex-direction:column;gap:10px">
          <div class="skeleton" style="height:36px;width:220px" />
          <div class="skeleton" style="height:16px;width:300px" />
        </div>
        <div style="display:flex;gap:12px">
          <div class="skeleton" style="height:40px;width:110px;border-radius:20px" />
          <div class="skeleton" style="height:40px;width:130px;border-radius:20px" />
        </div>
      </div>

      <!-- Driver cards -->
      <div class="grid-cols-3">
        <div
          v-for="i in 5"
          :key="i"
          style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1);display:flex;flex-direction:column;gap:16px"
        >
          <!-- Avatar + name -->
          <div style="display:flex;align-items:flex-start;gap:12px">
            <div class="skeleton" style="width:48px;height:48px;border-radius:9999px;flex-shrink:0" />
            <div style="display:flex;flex-direction:column;gap:8px">
              <div class="skeleton" style="height:16px;width:120px" />
              <div class="skeleton" style="height:22px;width:70px;border-radius:14px" />
            </div>
          </div>
          <!-- Info rows -->
          <div style="display:flex;flex-direction:column;gap:10px">
            <div v-for="j in 4" :key="j" style="display:flex;align-items:center;gap:8px">
              <div class="skeleton" style="width:16px;height:16px;border-radius:4px;flex-shrink:0" />
              <div class="skeleton" style="height:14px;flex:1" />
            </div>
          </div>
          <!-- Today's pickups box -->
          <div style="background:#f8f9fa;border-radius:16px;padding:12px;display:flex;justify-content:space-between;align-items:center">
            <div class="skeleton" style="height:14px;width:110px" />
            <div class="skeleton" style="height:22px;width:32px" />
          </div>
          <!-- Earnings box -->
          <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:16px;padding:12px;display:flex;flex-direction:column;gap:8px">
            <div class="skeleton" style="height:14px;width:120px" />
            <div class="skeleton" style="height:24px;width:100px" />
            <div class="skeleton" style="height:12px;width:160px" />
          </div>
          <!-- Buttons -->
          <div style="display:flex;gap:8px">
            <div class="skeleton" style="flex:1;height:40px;border-radius:20px" />
            <div class="skeleton" style="width:110px;height:40px;border-radius:20px" />
          </div>
        </div>
      </div>
    </template>

    <!-- ─── TRACKING skeleton ──────────────────────────────────────────── -->
    <template v-else-if="type === 'tracking'">
      <!-- Heading -->
      <div style="display:flex;flex-direction:column;gap:10px">
        <div class="skeleton" style="height:36px;width:200px" />
        <div class="skeleton" style="height:16px;width:260px" />
      </div>

      <!-- Map + sidebar -->
      <div class="grid-map">
        <!-- Map placeholder -->
        <div class="skeleton tracking-map" style="height:700px;border-radius:16px" />

        <!-- Sidebar -->
        <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1);height:700px;display:flex;flex-direction:column;gap:16px">
          <div class="skeleton" style="height:20px;width:120px" />
          <div class="skeleton" style="height:14px;width:100px" />
          <div v-for="i in 4" :key="i" style="border:1px solid #e5e7eb;border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:12px">
            <div style="display:flex;align-items:center;justify-content:space-between">
              <div style="display:flex;align-items:center;gap:12px">
                <div class="skeleton" style="width:40px;height:40px;border-radius:16px;flex-shrink:0" />
                <div style="display:flex;flex-direction:column;gap:6px">
                  <div class="skeleton" style="height:14px;width:60px" />
                  <div class="skeleton" style="height:12px;width:80px" />
                </div>
              </div>
              <div class="skeleton" style="height:22px;width:70px;border-radius:14px" />
            </div>
            <div style="display:flex;flex-direction:column;gap:8px">
              <div class="skeleton" style="height:12px;width:90%" />
              <div class="skeleton" style="height:12px;width:75%" />
              <div class="skeleton" style="height:6px;width:100%;border-radius:999px" />
            </div>
          </div>
        </div>
      </div>
    </template>

  </div>
</template>
