<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const truck = {
  id: 'T-001',
  status: 'active',
  plate: 'LCT-1001',
  year: '2023',
  lastService: 'Feb 15, 2026',
  driver: 'John Smith',
  capacity: '10 tons',
  mileage: '45,820 mi',
  fuelEfficiency: '8.5 MPG',
  nextServiceDue: '2 weeks',
  vin: '1HGBH41JXMN109186',
  makeModel: 'Freightliner M2 106',
  gpsId: 'GPS-T-001-001',
  lastGps: '2 minutes ago',
  currentLocation: 'Downtown Zone',
  registrationExpiry: 'Dec 31, 2026',
  insuranceExpiry: 'Aug 15, 2026',
}

const statusBadge = computed(() => {
  if (truck.status === 'active')      return { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.2)',  color: '#22c55e',  label: 'Active' }
  if (truck.status === 'maintenance') return { bg: 'rgba(255,180,0,0.1)',  border: 'rgba(255,180,0,0.2)',  color: '#d49a00',  label: 'Maintenance' }
  return { bg: '#e5e7eb', border: '#e5e7eb', color: '#6b7280', label: 'Inactive' }
})

const activeTab = ref('Vehicle Details')
const tabs = ['Vehicle Details', 'Maintenance History', 'Route History']

const maintenanceHistory = [
  { date: '2026-02-15', type: 'Oil Change',          technician: 'AutoCare Ltd',    cost: 'GHS 320.00',  status: 'completed', notes: 'Full synthetic 10W-30' },
  { date: '2026-01-10', type: 'Tire Rotation',        technician: 'AutoCare Ltd',    cost: 'GHS 150.00',  status: 'completed', notes: 'All 4 tires rotated' },
  { date: '2025-12-05', type: 'Brake Inspection',     technician: 'FleetPro Service', cost: 'GHS 480.00', status: 'completed', notes: 'Front pads replaced' },
  { date: '2025-11-20', type: 'Annual Inspection',    technician: 'FleetPro Service', cost: 'GHS 200.00', status: 'completed', notes: 'Passed all checks' },
  { date: '2025-10-08', type: 'Engine Tune-up',       technician: 'AutoCare Ltd',    cost: 'GHS 750.00',  status: 'completed', notes: 'Spark plugs & filters' },
]

const routeHistory = [
  { date: '2026-03-07', driver: 'John Smith', stops: 28, distance: '42 mi', duration: '6h 20m', zone: 'Downtown' },
  { date: '2026-03-06', driver: 'John Smith', stops: 32, distance: '48 mi', duration: '7h 10m', zone: 'Downtown' },
  { date: '2026-03-05', driver: 'John Smith', stops: 27, distance: '39 mi', duration: '6h 05m', zone: 'Downtown' },
  { date: '2026-03-04', driver: 'John Smith', stops: 30, distance: '44 mi', duration: '6h 45m', zone: 'Downtown' },
  { date: '2026-03-03', driver: 'John Smith', stops: 25, distance: '37 mi', duration: '5h 50m', zone: 'Downtown' },
]
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:21px">

    <!-- Back link -->
    <NuxtLink to="/trucks" style="display:inline-flex;align-items:center;gap:8px;text-decoration:none">
      <UIcon name="i-lucide-arrow-left" style="width:16px;height:16px;color:#6b7280" />
      <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Back</span>
    </NuxtLink>

    <!-- Profile card -->
    <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:10px 25px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
      <div style="display:flex;align-items:center;justify-content:space-between;min-height:87px">
        <div style="display:flex;align-items:center;gap:16px">
          <!-- Truck icon square -->
          <div style="width:64px;height:64px;border-radius:16px;background:#ffb400;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <UIcon name="i-lucide-truck" style="width:32px;height:32px;color:#1a1a1a" />
          </div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;align-items:center;gap:12px">
              <span style="font-size:24px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">{{ truck.id }}</span>
              <span :style="`font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;color:${statusBadge.color};background:${statusBadge.bg};border:1px solid ${statusBadge.border};border-radius:14px;padding:3px 11px`">
                {{ statusBadge.label }}
              </span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(2,auto);gap:8px 24px">
              <div style="display:flex;align-items:center;gap:8px">
                <UIcon name="i-lucide-hash" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
                <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Plate: {{ truck.plate }}</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <UIcon name="i-lucide-calendar" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
                <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Year: {{ truck.year }}</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <UIcon name="i-lucide-wrench" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
                <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Last Service: {{ truck.lastService }}</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <UIcon name="i-lucide-user" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
                <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Driver: {{ truck.driver }}</span>
              </div>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-shrink:0">
          <button
            style="height:40px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
            @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
          >Edit Truck</button>
          <button
            style="height:40px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
            @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
          >Schedule Maintenance</button>
        </div>
      </div>
    </div>

    <!-- Stat cards -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:24px">
      <div
        v-for="stat in [
          { label: 'Capacity',        value: truck.capacity,        color: '#1a1a1a' },
          { label: 'Total Mileage',   value: truck.mileage,         color: '#1a1a1a' },
          { label: 'Fuel Efficiency', value: truck.fuelEfficiency,  color: '#1a1a1a' },
          { label: 'Next Service Due',value: truck.nextServiceDue,  color: '#ffb400' },
        ]"
        :key="stat.label"
        style="background:white;border:1px solid #ececec;border-radius:16px;padding:10px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)"
      >
        <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-bottom:8px">{{ stat.label }}</p>
        <p :style="`font-size:20px;font-weight:700;font-family:'Manrope',sans-serif;color:${stat.color}`">{{ stat.value }}</p>
      </div>
    </div>

    <!-- Tabbed card -->
    <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:1px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
      <div style="padding:24px 24px 0;border-bottom:1px solid #e5e7eb;display:flex;gap:0">
        <button
          v-for="tab in tabs"
          :key="tab"
          :style="`padding:12px 16px 14px;border:none;background:none;cursor:pointer;font-size:14px;font-weight:500;font-family:'Manrope',sans-serif;white-space:nowrap;border-bottom:2px solid ${activeTab === tab ? '#ffb400' : 'transparent'};color:${activeTab === tab ? '#1a1a1a' : '#6b7280'};margin-bottom:-1px`"
          @click="activeTab = tab"
        >{{ tab }}</button>
      </div>

      <div style="padding:24px">

        <!-- Vehicle Details -->
        <div v-if="activeTab === 'Vehicle Details'" style="display:grid;grid-template-columns:repeat(2,1fr);gap:24px">

          <!-- Vehicle Information -->
          <div style="display:flex;flex-direction:column;gap:16px">
            <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Vehicle Information</p>
            <div style="display:flex;flex-direction:column;gap:12px">
              <div v-for="item in [
                { label: 'VIN Number',    value: truck.vin },
                { label: 'Make & Model',  value: truck.makeModel },
                { label: 'Year',          value: truck.year },
                { label: 'Plate Number',  value: truck.plate },
                { label: 'Capacity',      value: truck.capacity },
              ]" :key="item.label" style="display:flex;flex-direction:column;gap:2px">
                <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ item.label }}</p>
                <p style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ item.value }}</p>
              </div>
            </div>
          </div>

          <!-- GPS & Tracking -->
          <div style="display:flex;flex-direction:column;gap:16px">
            <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">GPS &amp; Tracking</p>
            <div style="display:flex;flex-direction:column;gap:12px">
              <div v-for="item in [
                { label: 'GPS Device ID',       value: truck.gpsId },
                { label: 'Last GPS Update',     value: truck.lastGps },
                { label: 'Current Location',    value: truck.currentLocation },
                { label: 'Registration Expiry', value: truck.registrationExpiry },
                { label: 'Insurance Expiry',    value: truck.insuranceExpiry },
              ]" :key="item.label" style="display:flex;flex-direction:column;gap:2px">
                <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ item.label }}</p>
                <p style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ item.value }}</p>
              </div>
            </div>
          </div>

        </div>

        <!-- Maintenance History -->
        <div v-else-if="activeTab === 'Maintenance History'">
          <div style="border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr style="background:#f8f9fa;border-bottom:1px solid #e5e7eb">
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Date</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Type</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Technician</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Cost</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Notes</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, i) in maintenanceHistory"
                  :key="i"
                  style="border-bottom:1px solid #e5e7eb"
                  @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
                >
                  <td style="padding:17px 16px;font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ row.date }}</td>
                  <td style="padding:17px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ row.type }}</td>
                  <td style="padding:17px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ row.technician }}</td>
                  <td style="padding:17px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ row.cost }}</td>
                  <td style="padding:17px 16px;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ row.notes }}</td>
                  <td style="padding:17px 16px">
                    <span style="font-size:12px;font-weight:500;font-family:'Manrope',sans-serif;border-radius:14px;padding:3px 10px;white-space:nowrap;color:#22c55e;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.2)">
                      {{ row.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Route History -->
        <div v-else-if="activeTab === 'Route History'">
          <div style="border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr style="background:#f8f9fa;border-bottom:1px solid #e5e7eb">
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Date</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Driver</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Total Stops</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Distance</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Duration</th>
                  <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Zone</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, i) in routeHistory"
                  :key="i"
                  style="border-bottom:1px solid #e5e7eb"
                  @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
                >
                  <td style="padding:17px 16px;font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ row.date }}</td>
                  <td style="padding:17px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ row.driver }}</td>
                  <td style="padding:17px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ row.stops }}</td>
                  <td style="padding:17px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ row.distance }}</td>
                  <td style="padding:17px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ row.duration }}</td>
                  <td style="padding:17px 16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ row.zone }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>
