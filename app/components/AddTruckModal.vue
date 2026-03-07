<script setup lang="ts">
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', data: {
    truckId: string; plate: string; vin: string; make: string; model: string
    year: number; capacity: string; status: string; notes: string
  }): void
}>()

const form = reactive({
  truckId: '',
  plate: '',
  vin: '',
  make: '',
  model: '',
  year: new Date().getFullYear(),
  capacity: '',
  status: 'active',
  notes: '',
})

const statuses = ['active', 'maintenance', 'inactive']

const chevronBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`
const selectStyle = `width:100%;height:42px;padding:0 16px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;cursor:pointer;appearance:none;background-image:${chevronBg};background-repeat:no-repeat;background-position:right 12px center;box-sizing:border-box`

const inputStyle = 'width:100%;height:39px;padding:0 12px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:\'Manrope\',sans-serif;outline:none;box-sizing:border-box'

function onFocus(e: Event) { (e.target as HTMLElement).style.borderColor = '#ffb400' }
function onBlur(e: Event)  { (e.target as HTMLElement).style.borderColor = '#e5e7eb' }

function submit() {
  emit('submit', { ...form })
}
</script>

<template>
  <div
    style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:50;display:flex;align-items:center;justify-content:center;padding:24px"
    @click.self="emit('close')"
  >
    <div style="background:white;border:1px solid #e5e7eb;border-radius:16px;width:510px;max-height:90vh;overflow-y:auto;box-shadow:0 10px 15px rgba(0,0,0,0.1),0 4px 6px rgba(0,0,0,0.1);position:relative;display:flex;flex-direction:column">

      <!-- Close -->
      <button
        style="position:absolute;top:16px;right:16px;width:28px;height:28px;border:none;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:8px;opacity:0.7;z-index:1"
        @click="emit('close')"
        @mouseover="($event.currentTarget as HTMLElement).style.background='#f3f4f6'"
        @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
      >
        <UIcon name="i-lucide-x" style="width:16px;height:16px;color:#111" />
      </button>

      <!-- Header -->
      <div style="padding:24px 24px 0">
        <p style="font-size:20px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Add New Truck</p>
      </div>

      <!-- Body -->
      <div style="padding:16px 24px;display:flex;flex-direction:column;gap:16px">

        <!-- Truck ID -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Truck ID</label>
          <input v-model="form.truckId" type="text" placeholder="T-XXX" :style="inputStyle" @focus="onFocus" @blur="onBlur" />
        </div>

        <!-- Plate Number -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Plate Number</label>
          <input v-model="form.plate" type="text" placeholder="LCT-XXXX" :style="inputStyle" @focus="onFocus" @blur="onBlur" />
        </div>

        <!-- VIN Number -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">VIN Number</label>
          <input v-model="form.vin" type="text" placeholder="1HGBH41JXMN109186" :style="inputStyle" @focus="onFocus" @blur="onBlur" />
        </div>

        <!-- Make + Model -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Make</label>
            <input v-model="form.make" type="text" placeholder="e.g., Freightliner" :style="inputStyle" @focus="onFocus" @blur="onBlur" />
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Model</label>
            <input v-model="form.model" type="text" placeholder="e.g., M2 106" :style="inputStyle" @focus="onFocus" @blur="onBlur" />
          </div>
        </div>

        <!-- Year + Capacity -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Year</label>
            <input v-model.number="form.year" type="number" placeholder="2024" :style="inputStyle" @focus="onFocus" @blur="onBlur" />
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Capacity</label>
            <input v-model="form.capacity" type="text" placeholder="e.g., 10 tons" :style="inputStyle" @focus="onFocus" @blur="onBlur" />
          </div>
        </div>

        <!-- Status -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Status</label>
          <select v-model="form.status" :style="selectStyle" @focus="onFocus" @blur="onBlur">
            <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>

        <!-- Notes -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">Notes</label>
          <textarea
            v-model="form.notes"
            placeholder="Any additional notes..."
            rows="4"
            style="width:100%;padding:8px 12px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;resize:none;box-sizing:border-box;line-height:1.5"
            @focus="onFocus"
            @blur="onBlur"
          />
        </div>

      </div>

      <!-- Footer -->
      <div style="padding:17px 24px;border-top:1px solid #e5e7eb;display:flex;justify-content:flex-end;gap:8px">
        <button
          style="height:40px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
          @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
          @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
          @click="emit('close')"
        >Cancel</button>
        <button
          style="height:40px;padding:0 16px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer;box-shadow:0 1px 3px rgba(255,180,0,0.2)"
          @mouseover="($event.currentTarget as HTMLElement).style.opacity='0.9'"
          @mouseleave="($event.currentTarget as HTMLElement).style.opacity='1'"
          @click="submit"
        >Add Truck</button>
      </div>

    </div>
  </div>
</template>
