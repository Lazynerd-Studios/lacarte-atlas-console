<script setup lang="ts">
interface Zone {
  id: string
  name: string
  description: string
  color: string
  areas: string[]
  driverCount: number
  customerCount: number
  isActive: boolean
}

const props = defineProps<{ zone: Zone }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', data: { name: string; description: string; color: string; areas: string[]; isActive: boolean }): void
}>()

const colorOptions = ['#3b82f6','#22c55e','#f97316','#8b5cf6','#ec4899','#ef4444','#14b8a6','#ffb400','#6b7280']

const form = ref({
  name: props.zone.name,
  description: props.zone.description,
  color: props.zone.color,
  areasStr: props.zone.areas.join('\n'),
  isActive: props.zone.isActive,
})
const error = ref('')

function submit() {
  if (!form.value.name.trim()) { error.value = 'Zone name is required.'; return }
  emit('submit', {
    name: form.value.name.trim(),
    description: form.value.description.trim(),
    color: form.value.color,
    areas: form.value.areasStr.split('\n').map(a => a.trim()).filter(Boolean),
    isActive: form.value.isActive,
  })
}
</script>

<template>
  <div @click.self="emit('close')" style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px">
    <div style="background:#fff;border-radius:20px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto;font-family:'Manrope',sans-serif">
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #f0f0f0;position:sticky;top:0;background:#fff;z-index:1">
        <h2 style="font-size:18px;font-weight:700;color:#1a1a1a;margin:0">Edit Zone</h2>
        <button @click="emit('close')" style="background:none;border:none;cursor:pointer;color:#6b7280;padding:4px;display:flex;align-items:center">
          <Icon name="lucide:x" style="width:20px;height:20px" />
        </button>
      </div>

      <!-- Body -->
      <div style="padding:24px;display:flex;flex-direction:column;gap:16px">
        <div v-if="error" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;font-size:13px;color:#ef4444">{{ error }}</div>

        <div>
          <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Zone Name <span style="color:#ef4444">*</span></label>
          <input v-model="form.name" style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box" />
        </div>

        <div>
          <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Description</label>
          <textarea v-model="form.description" rows="2" style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;resize:vertical;box-sizing:border-box"></textarea>
        </div>

        <div>
          <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Areas / Localities <span style="font-weight:400;color:#9ca3af">(one per line)</span></label>
          <textarea v-model="form.areasStr" rows="4" style="width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;resize:vertical;box-sizing:border-box"></textarea>
        </div>

        <div>
          <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:8px">Zone Color</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button v-for="c in colorOptions" :key="c" @click="form.color = c"
              :style="`width:28px;height:28px;border-radius:50%;background:${c};border:${form.color === c ? '3px solid #1a1a1a' : '2px solid transparent'};cursor:pointer;outline:none`" />
          </div>
        </div>

        <div style="display:flex;align-items:center;gap:10px">
          <button @click="form.isActive = !form.isActive"
            :style="`width:40px;height:22px;border-radius:11px;border:none;cursor:pointer;position:relative;background:${form.isActive ? '#22c55e' : '#d1d5db'}`">
            <span :style="`position:absolute;top:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left 0.15s;left:${form.isActive ? '21px' : '3px'}`"></span>
          </button>
          <span style="font-size:13px;font-weight:600;color:#374151">Active</span>
        </div>
      </div>

      <!-- Footer -->
      <div style="padding:16px 24px;border-top:1px solid #f0f0f0;display:flex;justify-content:flex-end;gap:10px;position:sticky;bottom:0;background:#fff">
        <button @click="emit('close')" style="background:#ececec;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer">Cancel</button>
        <button @click="submit" style="background:#ffb400;color:#1a1a1a;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer">Save Changes</button>
      </div>
    </div>
  </div>
</template>
