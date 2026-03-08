<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const route = useRoute()

// Mock member lookup by id — replace with real API call
const mockMembers: Record<string, { firstName: string; lastName: string; email: string; phone: string; role: string; status: string; permissions: string[] }> = {
  '1': { firstName: 'John',  lastName: 'Admin',      email: 'john.admin@lacarte.com',    phone: '+1 (555) 000-0001', role: 'super_admin',        status: 'active',   permissions: ['customers','drivers','routes','billing','shop','reports','team'] },
  '2': { firstName: 'Sarah', lastName: 'Operations', email: 'sarah.ops@lacarte.com',     phone: '+1 (555) 000-0002', role: 'operations_manager', status: 'active',   permissions: ['customers','drivers','routes'] },
  '3': { firstName: 'Mike',  lastName: 'Finance',    email: 'mike.finance@lacarte.com',  phone: '+1 (555) 000-0003', role: 'finance',            status: 'active',   permissions: ['billing','reports'] },
  '4': { firstName: 'Lisa',  lastName: 'Support',    email: 'lisa.support@lacarte.com',  phone: '+1 (555) 000-0004', role: 'support',            status: 'active',   permissions: ['customers'] },
  '5': { firstName: 'David', lastName: 'Manager',    email: 'david.manager@lacarte.com', phone: '+1 (555) 000-0005', role: 'operations_manager', status: 'inactive', permissions: ['drivers','routes'] },
}

const member = mockMembers[route.params.id as string] ?? mockMembers['1']!

const form = reactive({
  firstName: member.firstName,
  lastName:  member.lastName,
  email:     member.email,
  phone:     member.phone,
  role:      member.role,
  status:    member.status,
})

const permissions = reactive([
  { key: 'customers', label: 'Manage Customers', desc: 'View, create, edit, and delete customers',        checked: member.permissions.includes('customers') },
  { key: 'drivers',   label: 'Manage Drivers',   desc: 'View, create, edit, and delete drivers',          checked: member.permissions.includes('drivers') },
  { key: 'routes',    label: 'Manage Routes',    desc: 'Create and manage pickup routes',                 checked: member.permissions.includes('routes') },
  { key: 'billing',   label: 'View Billing',     desc: 'Access billing and payment information',          checked: member.permissions.includes('billing') },
  { key: 'shop',      label: 'Manage Shop',      desc: 'Manage products, orders, and inventory',         checked: member.permissions.includes('shop') },
  { key: 'reports',   label: 'View Reports',     desc: 'Access analytics and reports',                   checked: member.permissions.includes('reports') },
  { key: 'team',      label: 'Manage Team',      desc: 'Add and manage team members (Admin only)',       checked: member.permissions.includes('team') },
])

const roles = [
  { value: 'super_admin',        label: 'Super Admin' },
  { value: 'operations_manager', label: 'Operations Manager' },
  { value: 'finance',            label: 'Finance' },
  { value: 'support',            label: 'Support' },
]

const roleInfo = [
  { label: 'Super Admin',        desc: 'Full system access including team management',    color: '#dc2626', bg: '#fef2f2' },
  { label: 'Operations Manager', desc: 'Manage drivers, routes, and pickups',             color: '#ffb400', bg: '#fff9e6' },
  { label: 'Finance',            desc: 'Access billing, payments, and financial reports', color: '#3b82f6', bg: '#eff6ff' },
  { label: 'Support',            desc: 'Handle customer inquiries and support tickets',   color: '#22c55e', bg: '#f0fdf4' },
]

const securityNotes = [
  'Member will receive an invitation email to set their password',
  'Two-factor authentication is required for all admins',
  'Sessions expire after 24 hours of inactivity',
]
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:28px">

    <!-- Back link -->
    <NuxtLink to="/team" style="display:inline-flex;align-items:center;gap:8px;text-decoration:none">
      <UIcon name="i-lucide-arrow-left" style="width:16px;height:16px;color:#6b7280" />
      <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Back to Team</span>
    </NuxtLink>

    <!-- Header -->
    <div>
      <h1 style="font-size:32px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;line-height:1.3;margin:0">Edit Team Member</h1>
      <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:8px;margin-bottom:0">Update team member details, role, and permissions</p>
    </div>

    <!-- Main layout -->
    <div style="display:grid;grid-template-columns:1fr 344px;gap:24px;align-items:start">

      <!-- Left column -->
      <div style="display:flex;flex-direction:column;gap:24px">

        <!-- Personal Information -->
        <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
          <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin:0 0 24px">Personal Information</p>
          <div style="display:flex;flex-direction:column;gap:16px">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
              <div>
                <label style="display:block;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;margin-bottom:8px">First Name</label>
                <input v-model="form.firstName" placeholder="Enter first name" style="width:100%;height:40px;border:1px solid #e5e7eb;border-radius:12px;padding:0 12px;font-size:14px;font-family:'Manrope',sans-serif;color:#111;background:white;outline:none;box-sizing:border-box" @focus="($event.target as HTMLInputElement).style.borderColor='#ffb400'" @blur="($event.target as HTMLInputElement).style.borderColor='#e5e7eb'" />
              </div>
              <div>
                <label style="display:block;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;margin-bottom:8px">Last Name</label>
                <input v-model="form.lastName" placeholder="Enter last name" style="width:100%;height:40px;border:1px solid #e5e7eb;border-radius:12px;padding:0 12px;font-size:14px;font-family:'Manrope',sans-serif;color:#111;background:white;outline:none;box-sizing:border-box" @focus="($event.target as HTMLInputElement).style.borderColor='#ffb400'" @blur="($event.target as HTMLInputElement).style.borderColor='#e5e7eb'" />
              </div>
            </div>
            <div>
              <label style="display:block;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;margin-bottom:8px">Email Address</label>
              <input v-model="form.email" type="email" placeholder="member@lacarte.com" style="width:100%;height:40px;border:1px solid #e5e7eb;border-radius:12px;padding:0 12px;font-size:14px;font-family:'Manrope',sans-serif;color:#111;background:white;outline:none;box-sizing:border-box" @focus="($event.target as HTMLInputElement).style.borderColor='#ffb400'" @blur="($event.target as HTMLInputElement).style.borderColor='#e5e7eb'" />
            </div>
            <div>
              <label style="display:block;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;margin-bottom:8px">Phone Number</label>
              <input v-model="form.phone" type="tel" placeholder="+1 (555) 000-0000" style="width:100%;height:40px;border:1px solid #e5e7eb;border-radius:12px;padding:0 12px;font-size:14px;font-family:'Manrope',sans-serif;color:#111;background:white;outline:none;box-sizing:border-box" @focus="($event.target as HTMLInputElement).style.borderColor='#ffb400'" @blur="($event.target as HTMLInputElement).style.borderColor='#e5e7eb'" />
            </div>
          </div>
        </div>

        <!-- Role & Access -->
        <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
          <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin:0 0 24px">Role &amp; Access</p>
          <div style="display:flex;flex-direction:column;gap:16px">
            <div>
              <label style="display:block;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;margin-bottom:8px">Role</label>
              <div style="position:relative">
                <select v-model="form.role" style="width:100%;height:42px;border:1px solid #e5e7eb;border-radius:12px;padding:0 36px 0 12px;font-size:14px;font-family:'Manrope',sans-serif;color:#111;background:white;outline:none;appearance:none;cursor:pointer;box-sizing:border-box" @focus="($event.target as HTMLSelectElement).style.borderColor='#ffb400'" @blur="($event.target as HTMLSelectElement).style.borderColor='#e5e7eb'">
                  <option v-for="r in roles" :key="r.value" :value="r.value">{{ r.label }}</option>
                </select>
                <UIcon name="i-lucide-chevron-down" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);width:18px;height:18px;color:#6b7280;pointer-events:none" />
              </div>
              <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin:6px 0 0">Role determines the access level and permissions</p>
            </div>
            <div>
              <label style="display:block;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;margin-bottom:8px">Status</label>
              <div style="position:relative">
                <select v-model="form.status" style="width:100%;height:42px;border:1px solid #e5e7eb;border-radius:12px;padding:0 36px 0 12px;font-size:14px;font-family:'Manrope',sans-serif;color:#111;background:white;outline:none;appearance:none;cursor:pointer;box-sizing:border-box" @focus="($event.target as HTMLSelectElement).style.borderColor='#ffb400'" @blur="($event.target as HTMLSelectElement).style.borderColor='#e5e7eb'">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <UIcon name="i-lucide-chevron-down" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);width:18px;height:18px;color:#6b7280;pointer-events:none" />
              </div>
            </div>
          </div>
        </div>

        <!-- Permissions -->
        <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
          <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin:0 0 24px">Permissions</p>
          <div style="display:flex;flex-direction:column;gap:4px">
            <label
              v-for="p in permissions" :key="p.key"
              style="display:flex;align-items:center;gap:12px;padding:12px;border-radius:12px;cursor:pointer"
              @mouseover="($event.currentTarget as HTMLElement).style.background='#f8f9fa'"
              @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
            >
              <input v-model="p.checked" type="checkbox" style="width:16px;height:16px;accent-color:#ffb400;cursor:pointer;flex-shrink:0" />
              <div>
                <p style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;margin:0 0 2px">{{ p.label }}</p>
                <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0">{{ p.desc }}</p>
              </div>
            </label>
          </div>
        </div>

        <!-- Action buttons -->
        <div style="display:flex;gap:12px">
          <button
            style="flex:1;height:40px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer;box-shadow:0 1px 3px rgba(255,180,0,0.2)"
            @mouseover="($event.currentTarget as HTMLElement).style.background='#e6a200'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background='#ffb400'"
          >
            Save Changes
          </button>
          <NuxtLink to="/team" style="flex:1">
            <button
              style="width:100%;height:40px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px"
              @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
              @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
            >
              <UIcon name="i-lucide-x" style="width:16px;height:16px" />
              Cancel
            </button>
          </NuxtLink>
        </div>
      </div>

      <!-- Right column -->
      <div style="display:flex;flex-direction:column;gap:24px">

        <!-- Role Information -->
        <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
          <p style="font-size:16px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin:0 0 16px">Role Information</p>
          <div style="display:flex;flex-direction:column;gap:12px">
            <div v-for="r in roleInfo" :key="r.label" :style="`background:${r.bg};border-radius:12px;padding:12px`">
              <p :style="`font-size:14px;font-weight:500;color:${r.color};font-family:'Manrope',sans-serif;margin:0 0 4px`">{{ r.label }}</p>
              <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0">{{ r.desc }}</p>
            </div>
          </div>
        </div>

        <!-- Security -->
        <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
          <p style="font-size:16px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin:0 0 16px">Security</p>
          <div style="display:flex;flex-direction:column;gap:12px">
            <div v-for="note in securityNotes" :key="note" style="display:flex;align-items:flex-start;gap:10px">
              <div style="width:6px;height:6px;border-radius:50%;background:#ffb400;flex-shrink:0;margin-top:8px"></div>
              <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0;line-height:1.5">{{ note }}</p>
            </div>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>
