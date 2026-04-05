<script setup lang="ts">
const props = defineProps<{
  item: {
    id: string
    name: string
    description: string
    icon: string
    status: string
    displayOrder: number
  }
}>()

const emit = defineEmits<{
  close: []
  submit: [data: { name: string; description: string; icon: string; status: string; displayOrder: number }]
}>()

const form = reactive({
  name: props.item.name,
  description: props.item.description,
  icon: props.item.icon,
  status: props.item.status,
  displayOrder: props.item.displayOrder
})

const errors = reactive({
  name: '',
  description: '',
  icon: '',
  displayOrder: ''
})

// Common waste icons
const iconOptions = [
  { value: 'lucide:trash-2', label: 'Trash' },
  { value: 'lucide:recycle', label: 'Recycle' },
  { value: 'lucide:package', label: 'Package' },
  { value: 'lucide:bottle', label: 'Bottle' },
  { value: 'lucide:leaf', label: 'Organic' },
  { value: 'lucide:zap', label: 'Hazardous' },
  { value: 'lucide:box', label: 'Box' },
  { value: 'lucide:droplet', label: 'Liquid' },
  { value: 'lucide:cpu', label: 'Electronic' },
  { value: 'lucide:shopping-bag', label: 'Plastic Bag' },
]

function validate() {
  errors.name = ''
  errors.description = ''
  errors.icon = ''
  errors.displayOrder = ''
  
  if (!form.name.trim()) {
    errors.name = 'Name is required'
    return false
  }
  if (!form.description.trim()) {
    errors.description = 'Description is required'
    return false
  }
  if (!form.icon) {
    errors.icon = 'Icon is required'
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
        <h2 style="font-size:20px;font-weight:700;color:#1a1a1a;margin:0">Edit Disposable Type</h2>
        <button @click="emit('close')" style="width:32px;height:32px;border-radius:8px;border:none;background:#f5f5f5;cursor:pointer;display:flex;align-items:center;justify-content:center">
          <Icon name="lucide:x" style="width:16px;height:16px;color:#6b7280" />
        </button>
      </div>

      <!-- Form -->
      <div style="padding:24px;display:flex;flex-direction:column;gap:20px">
        
        <!-- Name -->
        <div>
          <label style="display:block;font-size:13px;font-weight:600;color:#1a1a1a;margin-bottom:8px">Name *</label>
          <input v-model="form.name" placeholder="e.g., Plastic Bottles" style="width:100%;height:42px;padding:0 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box" />
          <p v-if="errors.name" style="font-size:12px;color:#ef4444;margin:6px 0 0">{{ errors.name }}</p>
        </div>

        <!-- Description -->
        <div>
          <label style="display:block;font-size:13px;font-weight:600;color:#1a1a1a;margin-bottom:8px">Description *</label>
          <textarea v-model="form.description" placeholder="Describe this disposable type..." rows="3" style="width:100%;padding:12px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box;resize:vertical"></textarea>
          <p v-if="errors.description" style="font-size:12px;color:#ef4444;margin:6px 0 0">{{ errors.description }}</p>
        </div>

        <!-- Icon -->
        <div>
          <label style="display:block;font-size:13px;font-weight:600;color:#1a1a1a;margin-bottom:8px">Icon *</label>
          <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px">
            <button 
              v-for="option in iconOptions" 
              :key="option.value"
              type="button"
              @click="form.icon = option.value"
              :style="`display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 8px;border:2px solid ${form.icon === option.value ? '#ffb400' : '#e5e7eb'};border-radius:10px;background:${form.icon === option.value ? '#fff9e6' : '#fff'};cursor:pointer;transition:all 0.15s`">
              <Icon :name="option.value" style="width:20px;height:20px;color:#1a1a1a" />
              <span style="font-size:10px;color:#6b7280;text-align:center">{{ option.label }}</span>
            </button>
          </div>
          <p v-if="errors.icon" style="font-size:12px;color:#ef4444;margin:6px 0 0">{{ errors.icon }}</p>
        </div>

        <!-- Display Order -->
        <div>
          <label style="display:block;font-size:13px;font-weight:600;color:#1a1a1a;margin-bottom:8px">Display Order *</label>
          <input v-model.number="form.displayOrder" type="number" min="0" placeholder="0" style="width:100%;height:42px;padding:0 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box" />
          <p v-if="errors.displayOrder" style="font-size:12px;color:#ef4444;margin:6px 0 0">{{ errors.displayOrder }}</p>
          <p style="font-size:12px;color:#9ca3af;margin:6px 0 0">Lower numbers appear first</p>
        </div>

        <!-- Status -->
        <div>
          <label style="display:block;font-size:13px;font-weight:600;color:#1a1a1a;margin-bottom:8px">Status *</label>
          <select v-model="form.status" style="width:100%;height:42px;padding:0 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box;cursor:pointer">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
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
