<script setup lang="ts">
const props = defineProps<{
  item: {
    id: string
    label: string
    description: string
    displayOrder: number
    isActive: boolean
  }
}>()

const emit = defineEmits<{
  close: []
  submit: [data: { label: string; description: string; displayOrder: number; isActive: boolean }]
}>()

const form = reactive({
  label: props.item.label,
  description: props.item.description,
  displayOrder: props.item.displayOrder,
  isActive: props.item.isActive
})

const errors = reactive({
  label: '',
  description: '',
  displayOrder: ''
})

function validate() {
  errors.label = ''
  errors.description = ''
  errors.displayOrder = ''
  
  if (!form.label.trim()) {
    errors.label = 'Label is required'
    return false
  }
  if (!form.description.trim()) {
    errors.description = 'Description is required'
    return false
  }
  if (form.displayOrder < 0) {
    errors.displayOrder = 'Display order must be 0 or greater'
    return false
  }
  return true
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', { ...form })
}
</script>

<template>
  <div style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px" @click.self="emit('close')">
    <div style="background:#fff;border-radius:20px;width:100%;max-width:500px;max-height:90vh;overflow-y:auto;font-family:'Manrope',sans-serif">
      
      <!-- Header -->
      <div style="padding:24px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between">
        <h2 style="font-size:20px;font-weight:700;color:#1a1a1a;margin:0">Edit Estimated Quantity</h2>
        <button @click="emit('close')" style="width:32px;height:32px;border-radius:8px;border:none;background:#f5f5f5;cursor:pointer;display:flex;align-items:center;justify-content:center">
          <Icon name="lucide:x" style="width:16px;height:16px;color:#6b7280" />
        </button>
      </div>

      <!-- Form -->
      <div style="padding:24px;display:flex;flex-direction:column;gap:20px">
        
        <!-- Label -->
        <div>
          <label style="display:block;font-size:13px;font-weight:600;color:#1a1a1a;margin-bottom:8px">Label *</label>
          <input v-model="form.label" placeholder="e.g., Small, Medium, Large" style="width:100%;height:42px;padding:0 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box" />
          <p v-if="errors.label" style="font-size:12px;color:#ef4444;margin:6px 0 0">{{ errors.label }}</p>
        </div>

        <!-- Description -->
        <div>
          <label style="display:block;font-size:13px;font-weight:600;color:#1a1a1a;margin-bottom:8px">Description *</label>
          <textarea v-model="form.description" placeholder="Describe this quantity range..." rows="3" style="width:100%;padding:12px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box;resize:vertical"></textarea>
          <p v-if="errors.description" style="font-size:12px;color:#ef4444;margin:6px 0 0">{{ errors.description }}</p>
        </div>

        <!-- Display Order -->
        <div>
          <label style="display:block;font-size:13px;font-weight:600;color:#1a1a1a;margin-bottom:8px">Display Order *</label>
          <input v-model.number="form.displayOrder" type="number" min="0" placeholder="0" style="width:100%;height:42px;padding:0 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box" />
          <p v-if="errors.displayOrder" style="font-size:12px;color:#ef4444;margin:6px 0 0">{{ errors.displayOrder }}</p>
          <p style="font-size:12px;color:#9ca3af;margin:6px 0 0">Lower numbers appear first</p>
        </div>

        <!-- Status -->
        <div style="display:flex;align-items:center;gap:12px">
          <input v-model="form.isActive" type="checkbox" id="isActive" style="width:18px;height:18px;accent-color:#ffb400;cursor:pointer" />
          <label for="isActive" style="font-size:14px;font-weight:500;color:#1a1a1a;cursor:pointer">Active</label>
        </div>

      </div>

      <!-- Footer -->
      <div style="padding:20px 24px;border-top:1px solid #f0f0f0;display:flex;gap:12px;justify-content:flex-end">
        <button @click="emit('close')" style="padding:10px 20px;border-radius:10px;border:1.5px solid #e5e7eb;background:#fff;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;cursor:pointer">
          Cancel
        </button>
        <button @click="handleSubmit" style="padding:10px 20px;border-radius:10px;border:none;background:#ffb400;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;cursor:pointer">
          Save Changes
        </button>
      </div>

    </div>
  </div>
</template>
