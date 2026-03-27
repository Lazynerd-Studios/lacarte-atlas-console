<script setup lang="ts">
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', data: Record<string, unknown>): void
}>()

const form = reactive({
  name: '',
  description: '',
  permissions: [] as string[],
})

// Grouped permissions by module
const permissionGroups = [
  {
    label: 'Customers',
    permissions: [
      { id: 'customers.view', label: 'View Customers' },
      { id: 'customers.create', label: 'Create Customers' },
      { id: 'customers.edit', label: 'Edit Customers' },
      { id: 'customers.delete', label: 'Delete Customers' },
    ],
  },
  {
    label: 'Drivers & Trucks',
    permissions: [
      { id: 'drivers.view', label: 'View Drivers' },
      { id: 'drivers.create', label: 'Create Drivers' },
      { id: 'drivers.edit', label: 'Edit Drivers' },
      { id: 'trucks.view', label: 'View Trucks' },
      { id: 'trucks.manage', label: 'Manage Trucks' },
    ],
  },
  {
    label: 'Pickups & Tracking',
    permissions: [
      { id: 'pickups.view', label: 'View Pickups' },
      { id: 'pickups.assign', label: 'Assign Pickups' },
      { id: 'tracking.view', label: 'View Live Tracking' },
    ],
  },
  {
    label: 'Billing & Payments',
    permissions: [
      { id: 'billing.view', label: 'View Billing' },
      { id: 'billing.approve', label: 'Approve Payments' },
      { id: 'billing.decline', label: 'Decline Payments' },
    ],
  },
  {
    label: 'Shop & Inventory',
    permissions: [
      { id: 'shop.view', label: 'View Shop' },
      { id: 'shop.manage', label: 'Manage Products' },
      { id: 'inventory.view', label: 'View Inventory' },
      { id: 'inventory.manage', label: 'Manage Inventory' },
    ],
  },
  {
    label: 'Reports',
    permissions: [
      { id: 'reports.view', label: 'View Reports' },
      { id: 'reports.export', label: 'Export Reports' },
    ],
  },
  {
    label: 'Management',
    permissions: [
      { id: 'management.customer-types', label: 'Manage Customer Types' },
      { id: 'management.subscriptions', label: 'Manage Subscriptions' },
      { id: 'management.rates', label: 'Manage Rates' },
      { id: 'management.zones', label: 'Manage Zones' },
    ],
  },
  {
    label: 'Communications',
    permissions: [
      { id: 'comms.sms', label: 'Send SMS' },
      { id: 'comms.mail', label: 'Send Email' },
      { id: 'comms.view', label: 'View Communications' },
    ],
  },
  {
    label: 'Team & Settings',
    permissions: [
      { id: 'team.view', label: 'View Team' },
      { id: 'team.manage', label: 'Manage Team' },
      { id: 'settings.view', label: 'View Settings' },
      { id: 'settings.manage', label: 'Manage Settings' },
    ],
  },
]

const errors = reactive<Record<string, string>>({})

function validate() {
  Object.keys(errors).forEach(k => delete errors[k])
  if (!form.name.trim()) errors.name = 'Role name is required'
  if (form.permissions.length === 0) errors.permissions = 'Select at least one permission'
  return Object.keys(errors).length === 0
}

function submit() {
  if (!validate()) return
  emit('submit', { ...form })
}

function togglePermission(id: string) {
  const idx = form.permissions.indexOf(id)
  if (idx > -1) form.permissions.splice(idx, 1)
  else form.permissions.push(id)
}

function toggleGroup(group: typeof permissionGroups[0]) {
  const allSelected = group.permissions.every(p => form.permissions.includes(p.id))
  if (allSelected) {
    group.permissions.forEach(p => {
      const idx = form.permissions.indexOf(p.id)
      if (idx > -1) form.permissions.splice(idx, 1)
    })
  } else {
    group.permissions.forEach(p => {
      if (!form.permissions.includes(p.id)) form.permissions.push(p.id)
    })
  }
}

function isGroupSelected(group: typeof permissionGroups[0]) {
  return group.permissions.every(p => form.permissions.includes(p.id))
}

function isGroupPartial(group: typeof permissionGroups[0]) {
  const selected = group.permissions.filter(p => form.permissions.includes(p.id)).length
  return selected > 0 && selected < group.permissions.length
}

function inputStyle(field: string) {
  return `width:100%;height:39px;padding:0 12px;background:white;border:1px solid ${errors[field] ? '#ef4444' : '#e5e7eb'};border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box`
}

function onFocus(e: Event, field: string) {
  if (!errors[field]) (e.target as HTMLElement).style.borderColor = '#ffb400'
}
function onBlur(e: Event, field: string) {
  if (!errors[field]) (e.target as HTMLElement).style.borderColor = '#e5e7eb'
}
</script>

<template>
  <div
    style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:50;display:flex;align-items:center;justify-content:center;padding:24px"
    @click.self="emit('close')"
  >
    <div style="background:white;border:1px solid #e5e7eb;border-radius:16px;width:560px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 10px 15px rgba(0,0,0,0.1),0 4px 6px rgba(0,0,0,0.1);position:relative">

      <!-- Header -->
      <div style="padding:24px 24px 16px;flex-shrink:0;border-bottom:1px solid #e5e7eb">
        <p style="font-size:20px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Add New Role</p>
      </div>

      <!-- Close -->
      <button
        style="position:absolute;top:16px;right:16px;width:28px;height:28px;border:none;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:8px;opacity:0.7"
        @click="emit('close')"
        @mouseover="($event.currentTarget as HTMLElement).style.background='#f3f4f6'"
        @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
      >
        <UIcon name="i-lucide-x" style="width:16px;height:16px;color:#111" />
      </button>

      <!-- Body -->
      <div style="flex:1;overflow-y:auto;padding:24px;display:flex;flex-direction:column;gap:20px">

        <!-- Role Name -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Role Name</label>
          <input v-model="form.name" type="text" placeholder="e.g. Operations Manager" :style="inputStyle('name')"
            @focus="onFocus($event, 'name')" @blur="onBlur($event, 'name')" />
          <span v-if="errors.name" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ errors.name }}</span>
        </div>

        <!-- Description -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Description <span style="color:#9ca3af;font-weight:400">(optional)</span></label>
          <textarea
            v-model="form.description"
            placeholder="Brief description of this role..."
            rows="2"
            style="width:100%;padding:8px 12px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;resize:none;box-sizing:border-box;line-height:1.5"
            @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
            @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
          />
        </div>

        <!-- Permissions -->
        <div style="display:flex;flex-direction:column;gap:12px">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Permissions</label>
            <span style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif">{{ form.permissions.length }} selected</span>
          </div>
          <span v-if="errors.permissions" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ errors.permissions }}</span>

          <div style="display:flex;flex-direction:column;gap:16px">
            <div v-for="group in permissionGroups" :key="group.label" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px">
              <!-- Group header with select all -->
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer" @click="toggleGroup(group)">
                  <div :style="`width:18px;height:18px;border:2px solid ${isGroupSelected(group) ? '#ffb400' : '#d1d5db'};border-radius:4px;display:flex;align-items:center;justify-content:center;background:${isGroupSelected(group) ? '#ffb400' : 'white'};position:relative`">
                    <UIcon v-if="isGroupSelected(group)" name="i-lucide-check" style="width:12px;height:12px;color:white" />
                    <div v-else-if="isGroupPartial(group)" style="width:10px;height:2px;background:#ffb400;border-radius:1px" />
                  </div>
                  <span style="font-size:14px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">{{ group.label }}</span>
                </label>
              </div>

              <!-- Individual permissions -->
              <div style="display:flex;flex-direction:column;gap:8px;padding-left:26px">
                <label
                  v-for="perm in group.permissions"
                  :key="perm.id"
                  style="display:flex;align-items:center;gap:8px;cursor:pointer"
                  @click="togglePermission(perm.id)"
                >
                  <div :style="`width:16px;height:16px;border:2px solid ${form.permissions.includes(perm.id) ? '#ffb400' : '#d1d5db'};border-radius:4px;display:flex;align-items:center;justify-content:center;background:${form.permissions.includes(perm.id) ? '#ffb400' : 'white'}`">
                    <UIcon v-if="form.permissions.includes(perm.id)" name="i-lucide-check" style="width:10px;height:10px;color:white" />
                  </div>
                  <span style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif">{{ perm.label }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Footer -->
      <div style="padding:17px 24px;border-top:1px solid #e5e7eb;display:flex;justify-content:flex-end;gap:8px;flex-shrink:0">
        <button
          style="height:40px;padding:0 16px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
          @click="emit('close')"
        >Cancel</button>
        <button
          style="height:40px;padding:0 20px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer;box-shadow:0 1px 3px rgba(255,180,0,0.2)"
          @click="submit"
        >Create Role</button>
      </div>
    </div>
  </div>
</template>
