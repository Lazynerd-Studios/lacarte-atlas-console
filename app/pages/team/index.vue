<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const showAddRoleModal = ref(false)

function handleAddRole(data: Record<string, unknown>) {
  console.log('Add role:', data)
  showAddRoleModal.value = false
}

const stats = [
  { iconBg: '#fff9e6', icon: 'i-lucide-users',       iconColor: '#ffb400', label: 'Total Members',  value: '5' },
  { iconBg: '#f0fdf4', icon: 'i-lucide-user-check',  iconColor: '#22c55e', label: 'Active Members', value: '4' },
  { iconBg: '#fef2f2', icon: 'i-lucide-shield',      iconColor: '#ef4444', label: 'Super Admins',   value: '1' },
  { iconBg: '#eff6ff', icon: 'i-lucide-wifi',        iconColor: '#3b82f6', label: 'Online Now',     value: '3' },
]

const members = [
  { initials: 'JA', name: 'John Admin',      email: 'john.admin@lacarte.com',     role: 'Super Admin',        roleColor: '#dc2626', roleBg: '#fef2f2', status: 'active',   lastLogin: '2 hours ago' },
  { initials: 'SO', name: 'Sarah Operations',email: 'sarah.ops@lacarte.com',      role: 'Operations Manager', roleColor: '#ffb400', roleBg: '#fff9e6', status: 'active',   lastLogin: '5 minutes ago' },
  { initials: 'MF', name: 'Mike Finance',    email: 'mike.finance@lacarte.com',   role: 'Finance',            roleColor: '#3b82f6', roleBg: '#eff6ff', status: 'active',   lastLogin: '1 day ago' },
  { initials: 'LS', name: 'Lisa Support',    email: 'lisa.support@lacarte.com',   role: 'Support',            roleColor: '#22c55e', roleBg: '#f0fdf4', status: 'active',   lastLogin: '30 minutes ago' },
  { initials: 'DM', name: 'David Manager',   email: 'david.manager@lacarte.com',  role: 'Operations Manager', roleColor: '#ffb400', roleBg: '#fff9e6', status: 'inactive', lastLogin: '2 weeks ago' },
]

function statusStyle(s: string) {
  if (s === 'active') return 'color:#22c55e;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.2)'
  return 'color:#6b7280;background:#e5e7eb;border:1px solid #e5e7eb'
}
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:28px">

    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between">
      <div>
        <h1 style="font-size:32px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;line-height:1.3;margin:0">Team Management</h1>
        <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:8px;margin-bottom:0">Manage team members, roles, and permissions</p>
      </div>
      <div style="display:flex;gap:12px">
        <button
          style="height:40px;padding:0 16px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer;display:flex;align-items:center;gap:8px;box-shadow:0 1px 3px rgba(255,180,0,0.2)"
          @click="showAddRoleModal = true"
          @mouseover="($event.currentTarget as HTMLElement).style.background='#e6a200'"
          @mouseleave="($event.currentTarget as HTMLElement).style.background='#ffb400'"
        >
          <UIcon name="i-lucide-shield" style="width:16px;height:16px" />
          Add Role
        </button>
        <button
          style="height:40px;padding:0 20px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer;display:flex;align-items:center;gap:8px;box-shadow:0 1px 3px rgba(255,180,0,0.2)"
          @mouseover="($event.currentTarget as HTMLElement).style.background='#e6a200'"
          @mouseleave="($event.currentTarget as HTMLElement).style.background='#ffb400'"
          @click="$router.push('/team/add')"
        >
          <UIcon name="i-lucide-plus" style="width:16px;height:16px" />
          Add Team Member
        </button>
      </div>
    </div>

    <!-- Stat cards -->
    <div class="grid-cols-4" style="gap:20px">
      <div v-for="s in stats" :key="s.label" style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <div :style="`width:40px;height:40px;background:${s.iconBg};border-radius:20px;display:flex;align-items:center;justify-content:center;margin-bottom:16px`">
          <UIcon :name="s.icon" :style="`width:20px;height:20px;color:${s.iconColor}`" />
        </div>
        <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0 0 4px">{{ s.label }}</p>
        <p style="font-size:24px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;margin:0">{{ s.value }}</p>
      </div>
    </div>

    <!-- Members table -->
    <div class="table-scroll" style="background:white;border:1px solid #ececec;border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f8f9fa;border-bottom:1px solid #e5e7eb">
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Member</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Email</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Role</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Status</th>
            <th style="padding:14px 16px;text-align:left;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Last Login</th>
            <th style="padding:14px 16px;text-align:right;font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(m, i) in members" :key="m.email"
            :style="`border-bottom:${i < members.length - 1 ? '1px solid #e5e7eb' : 'none'}`"
            @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
          >
            <!-- Member -->
            <td style="padding:16px">
              <div style="display:flex;align-items:center;gap:12px">
                <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(180deg,#ffb400,#ffc83d);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  <span style="font-size:14px;font-weight:500;color:white;font-family:'Manrope',sans-serif">{{ m.initials }}</span>
                </div>
                <span style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">{{ m.name }}</span>
              </div>
            </td>
            <!-- Email -->
            <td style="padding:16px;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ m.email }}</td>
            <!-- Role -->
            <td style="padding:16px">
              <span :style="`font-size:12px;font-weight:500;border-radius:16px;padding:4px 10px;font-family:'Manrope',sans-serif;color:${m.roleColor};background:${m.roleBg}`">{{ m.role }}</span>
            </td>
            <!-- Status -->
            <td style="padding:16px">
              <span :style="`font-size:12px;font-weight:500;border-radius:14px;padding:3px 10px;font-family:'Manrope',sans-serif;${statusStyle(m.status)}`">{{ m.status }}</span>
            </td>
            <!-- Last Login -->
            <td style="padding:16px">
              <div style="display:flex;align-items:center;gap:6px">
                <UIcon name="i-lucide-clock" style="width:16px;height:16px;color:#6b7280;flex-shrink:0" />
                <span style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ m.lastLogin }}</span>
              </div>
            </td>
            <!-- Actions -->
            <td style="padding:16px">
              <div style="display:flex;align-items:center;justify-content:flex-end;gap:8px">
                <button
                  style="width:32px;height:32px;border-radius:20px;border:1px solid #ececec;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center"
                  @mouseover="($event.currentTarget as HTMLElement).style.background='#f8f9fa'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.background='white'"
                  @click="$router.push(`/team/${i + 1}/edit`)"
                >
                  <UIcon name="i-lucide-pencil" style="width:15px;height:15px;color:#6b7280" />
                </button>
                <button
                  style="width:32px;height:32px;border-radius:20px;border:1px solid #fecaca;background:#fef2f2;cursor:pointer;display:flex;align-items:center;justify-content:center"
                  @mouseover="($event.currentTarget as HTMLElement).style.background='#fee2e2'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.background='#fef2f2'"
                >
                  <UIcon name="i-lucide-trash-2" style="width:15px;height:15px;color:#ef4444" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>

  <AddRoleModal
    v-if="showAddRoleModal"
    @close="showAddRoleModal = false"
    @submit="handleAddRole"
  />
</template>
