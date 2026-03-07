<script setup lang="ts">
const props = defineProps<{ driverName: string }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', data: { binType: string; quantity: number; zone: string; date: string; notes: string }): void
}>()

const form = reactive({
  binType: '',
  quantity: 1,
  zone: '',
  date: '',
  notes: '',
})

const binTypes = ['Standard Waste Bin', 'Recycling Bin', 'Organic Waste Bin', 'Hazardous Waste Bin']
const zones = ['Downtown', 'Westside', 'Eastside', 'Northside', 'Southside']

const chevronBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`

const selectStyle = `width:100%;height:42px;padding:0 16px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;cursor:pointer;appearance:none;background-image:${chevronBg};background-repeat:no-repeat;background-position:right 12px center;box-sizing:border-box`

function submit() {
  emit('submit', { ...form })
}
</script>

<template>
  <div
    style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:50;display:flex;align-items:center;justify-content:center;padding:24px"
    @click.self="emit('close')"
  >
    <div style="background:white;border:1px solid #e5e7eb;border-radius:16px;width:510px;box-shadow:0 10px 15px rgba(0,0,0,0.1),0 4px 6px rgba(0,0,0,0.1);position:relative;display:flex;flex-direction:column">

      <!-- Close -->
      <button
        style="position:absolute;top:16px;right:16px;width:28px;height:28px;border:none;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:8px;opacity:0.7"
        @click="emit('close')"
        @mouseover="($event.currentTarget as HTMLElement).style.background='#f3f4f6'"
        @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
      >
        <UIcon name="i-lucide-x" style="width:16px;height:16px;color:#111" />
      </button>

      <!-- Header -->
      <div style="padding:24px 24px 0">
        <p style="font-size:20px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Assign Waste Bins to Driver</p>
      </div>

      <!-- Body -->
      <div style="padding:16px 24px;display:flex;flex-direction:column;gap:16px">

        <!-- Driver (read-only) -->
        <div style="background:#f8f9fa;border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:4px">
          <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Driver</p>
          <p style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">{{ props.driverName }}</p>
        </div>

        <!-- Number of Bins -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">Number of Bins to Assign</label>
          <input
            v-model.number="form.quantity"
            type="number"
            min="1"
            placeholder="1"
            style="width:100%;height:39px;padding:0 12px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box"
            @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
            @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
          />
        </div>

        <!-- Bin Type -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">Bin Type</label>
          <select
            v-model="form.binType"
            :style="selectStyle"
            @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
            @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
          >
            <option value="" disabled>Select bin type</option>
            <option v-for="t in binTypes" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>

        <!-- Assignment Zone -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">Assignment Zone</label>
          <select
            v-model="form.zone"
            :style="selectStyle"
            @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
            @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
          >
            <option value="" disabled>Select zone</option>
            <option v-for="z in zones" :key="z" :value="z">{{ z }}</option>
          </select>
        </div>

        <!-- Assignment Date -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">Assignment Date</label>
          <input
            v-model="form.date"
            type="date"
            style="width:100%;height:39px;padding:0 12px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box"
            @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
            @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
          />
        </div>

        <!-- Notes -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">Notes</label>
          <textarea
            v-model="form.notes"
            placeholder="Add any special instructions or notes..."
            rows="4"
            style="width:100%;padding:8px 12px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;resize:none;box-sizing:border-box;line-height:1.5"
            @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
            @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
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
        >Assign Bins</button>
      </div>
    </div>
  </div>
</template>
