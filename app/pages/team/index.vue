<script setup lang="ts">
import type { TeamMember, CreateRolePayload } from '~/types/team'

interface TeamStats {
  totalMembers: number
  activeMembers: number
  superAdmins: number
  onlineNow: number
}

definePageMeta({ 
  layout: 'dashboard',
  middleware: 'auth'
})

const authStore = useAuthStore()
const { hasPermission, isSuperAdmin } = usePermissions()
const showAddRoleModal = ref(false)
const showDeleteModal = ref(false)
const memberToDelete = ref<TeamMember | null>(null)
const deleting = ref(false)
const submitting = ref(false)
const members = ref<TeamMember[]>([])
const loading = ref(false)
const initialLoading = ref(true)
const stats = ref<TeamStats>({
  totalMembers: 0,
  activeMembers: 0,
  superAdmins: 0,
  onlineNow: 0,
})
const statsLoading = ref(false)

/**
 * Handles role creation from AddRoleModal
 * 
 * Authorization:
 * - Verifies user has admin privileges before allowing operation
 * 
 * Error Handling Strategy:
 * - Client-side validation: Handled in modal component
 * - 400 validation errors (duplicate name, invalid fields): Handled in modal component
 * - 401 unauthorized: Automatic redirect to login (handled by useApi)
 * - 403, 404, 500: Automatic error toast (handled by useErrorHandler)
 * - Network errors: Automatic error toast (handled by useErrorHandler)
 */
async function handleAddRole(data: CreateRolePayload) {
  console.log('[Team Management] handleAddRole called', { data })
  
  // Check authorization before allowing operation
  if (!checkAuthorization('create roles')) {
    console.log('[Team Management] Authorization check failed for create roles')
    return
  }
  
  submitting.value = true
  const api = useApi()
  const toast = useAppToast()
  
  // Transform the role name to backend format (lowercase with underscores)
  const roleName = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_') // Replace non-alphanumeric chars with underscore
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
  
  // Backend expects: name (internal), displayName (user-facing), permissionIds (array of IDs)
  const payload = {
    name: roleName,
    displayName: data.name,
    description: data.description || '',
    permissionIds: data.permissions
  }
  
  console.log('[Team Management] Sending POST request to /team/roles', { payload })
  // Send POST request to create role
  // api.post() automatically handles errors via useErrorHandler and returns null on failure
  const response = await api.post('/team/roles', payload)
  
  if (response) {
    console.log('[Team Management] Role created successfully', { response })
    // Success flow: show toast, close modal
    toast.success('Role created successfully')
    showAddRoleModal.value = false
    // Note: In a real implementation, we would refresh the roles list here
    // For now, we just close the modal
  } else {
    console.log('[Team Management] Role creation failed or returned null')
  }
  
  submitting.value = false
}

/**
 * Opens the delete confirmation modal for a team member
 */
function openDeleteModal(member: TeamMember) {
  memberToDelete.value = member
  showDeleteModal.value = true
}

/**
 * Handles team member deletion
 * 
 * Authorization:
 * - Verifies user has admin privileges before allowing operation
 * 
 * Error Handling:
 * - 401: Automatic redirect to login (handled by useApi)
 * - 403, 404, 500: Automatic error toast (handled by useErrorHandler)
 * - Network errors: Automatic error toast (handled by useErrorHandler)
 */
async function handleDelete() {
  if (!memberToDelete.value) return
  
  console.log('[Team Management] handleDelete called', { memberId: memberToDelete.value.id })
  
  // Check authorization before allowing operation
  if (!checkAuthorization('delete team members')) {
    console.log('[Team Management] Authorization check failed for delete team members')
    showDeleteModal.value = false
    memberToDelete.value = null
    return
  }
  
  deleting.value = true
  const api = useApi()
  const toast = useAppToast()
  
  console.log('[Team Management] Sending DELETE request to /team/' + memberToDelete.value.id)
  const response = await api.del(`/team/${memberToDelete.value.id}`)
  
  if (response) {
    console.log('[Team Management] Member deleted successfully')
    toast.success('Team member deleted successfully')
    showDeleteModal.value = false
    memberToDelete.value = null
    await fetchMembers() // Refresh the member list
  } else {
    console.log('[Team Management] Member deletion failed or returned null')
  }
  
  deleting.value = false
}

/**
 * Fetches team members from the API
 * 
 * Error Handling:
 * - 401: Automatic redirect to login (handled by useApi)
 * - 403, 404, 500: Automatic error toast (handled by useErrorHandler)
 * - Network errors: Automatic error toast (handled by useErrorHandler)
 */
async function fetchMembers() {
  console.log('[Team Management] fetchMembers called')
  loading.value = true
  const api = useApi()
  
  console.log('[Team Management] Sending GET request to /team/')
  const response = await api.get<{ data: any[] }>('/team/')
  if (response && response.data) {
    console.log('[Team Management] Members fetched successfully', { 
      count: response.data.length,
      firstMember: response.data[0],
      responseType: typeof response,
      isArray: Array.isArray(response.data)
    })
    
    // Transform backend response to match our TeamMember interface
    members.value = response.data.map((item: any) => ({
      id: item.id,
      firstName: item.user?.name?.split(' ')[0] || '',
      lastName: item.user?.name?.split(' ').slice(1).join(' ') || '',
      email: item.user?.email || '',
      phone: item.phoneNumber || '',
      role: item.role?.name || '',
      roleDetails: {
        id: item.role?.id || '',
        name: item.role?.displayName || item.role?.name || '',
        color: '#6b7280'
      },
      status: item.status,
      permissions: [],
      lastLogin: item.lastLoginAt || '',
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }))
  } else {
    console.log('[Team Management] Failed to fetch members or returned null')
  }
  
  loading.value = false
}

/**
 * Fetches team statistics from the API
 * 
 * Error Handling:
 * - 401: Automatic redirect to login (handled by useApi)
 * - 403, 404, 500: Automatic error toast (handled by useErrorHandler)
 * - Network errors: Automatic error toast (handled by useErrorHandler)
 */
async function fetchStats() {
  console.log('[Team Management] fetchStats called')
  statsLoading.value = true
  const api = useApi()
  
  console.log('[Team Management] Sending GET request to /team/stats')
  const response = await api.get<TeamStats>('/team/stats')
  if (response) {
    console.log('[Team Management] Stats fetched successfully', { stats: response })
    stats.value = response
  } else {
    console.log('[Team Management] Failed to fetch stats or returned null')
  }
  
  statsLoading.value = false
}

const statsDisplay = computed(() => [
  { iconBg: '#fff9e6', icon: 'i-lucide-users',       iconColor: '#ffb400', label: 'Total Members',  value: stats.value.totalMembers.toString() },
  { iconBg: '#f0fdf4', icon: 'i-lucide-user-check',  iconColor: '#22c55e', label: 'Active Members', value: stats.value.activeMembers.toString() },
  { iconBg: '#fef2f2', icon: 'i-lucide-shield',      iconColor: '#ef4444', label: 'Super Admins',   value: stats.value.superAdmins.toString() },
  { iconBg: '#eff6ff', icon: 'i-lucide-wifi',        iconColor: '#3b82f6', label: 'Online Now',     value: stats.value.onlineNow.toString() },
])

function statusStyle(s: string) {
  if (s === 'active') return 'color:#22c55e;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.2)'
  return 'color:#6b7280;background:#e5e7eb;border:1px solid #e5e7eb'
}

function getInitials(member: TeamMember): string {
  const firstInitial = member.firstName?.charAt(0) || '?'
  const lastInitial = member.lastName?.charAt(0) || '?'
  return `${firstInitial}${lastInitial}`.toUpperCase()
}

function getFullName(member: TeamMember): string {
  return `${member.firstName || 'Unknown'} ${member.lastName || 'User'}`
}

function getRoleDisplay(member: TeamMember): { name: string; color: string; bg: string } {
  // Use roleDetails if available, otherwise use role string
  const roleName = member.roleDetails?.name || member.role
  const roleColor = member.roleDetails?.color || '#6b7280'
  
  // Generate background color from role color (lighter version)
  const bg = roleColor + '20' // Add alpha for lighter background
  
  return { name: roleName, color: roleColor, bg }
}

/**
 * Checks if the current user has admin privileges
 * Returns true if user is super admin or has team.manage permission
 */
function hasAdminPrivileges(): boolean {
  return isSuperAdmin.value || hasPermission('team.manage')
}

/**
 * Checks authorization before performing operations
 * Shows error toast and returns false if user lacks privileges
 */
function checkAuthorization(operationName: string): boolean {
  if (!hasAdminPrivileges()) {
    const toast = useAppToast()
    toast.error('Unauthorized', `You don't have permission to ${operationName}`)
    return false
  }
  return true
}

// Fetch data on mount
onMounted(async () => {
  console.log('[Team Management] Component mounted, initializing...')
  
  // Check authorization before displaying content
  if (!checkAuthorization('access team management')) {
    console.log('[Team Management] Authorization check failed for access team management')
    return
  }
  
  initialLoading.value = true
  await Promise.all([
    fetchMembers(),
    fetchStats(),
  ])
  initialLoading.value = false
  console.log('[Team Management] Initialization complete')
})
</script>

<template>
  <div v-if="initialLoading" style="display:flex;flex-direction:column;gap:28px">
    <PageSkeleton type="table" :rows="6" :cards="4" />
  </div>

  <div v-else style="display:flex;flex-direction:column;gap:28px">

    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between">
      <div>
        <h1 style="font-size:32px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;line-height:1.3;margin:0">Team Management</h1>
        <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:8px;margin-bottom:0">Manage team members, roles, and permissions</p>
      </div>
      <div style="display:flex;gap:12px">
        <button
          :disabled="submitting || deleting"
          style="height:40px;padding:0 16px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer;display:flex;align-items:center;gap:8px;box-shadow:0 1px 3px rgba(255,180,0,0.2)"
          @click="showAddRoleModal = true"
          @mouseover="!(submitting || deleting) && (($event.currentTarget as HTMLElement).style.background='#e6a200')"
          @mouseleave="!(submitting || deleting) && (($event.currentTarget as HTMLElement).style.background='#ffb400')"
        >
          <UIcon name="i-lucide-shield" style="width:16px;height:16px" />
          Add Role
        </button>
        <button
          :disabled="submitting || deleting"
          style="height:40px;padding:0 20px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer;display:flex;align-items:center;gap:8px;box-shadow:0 1px 3px rgba(255,180,0,0.2)"
          @mouseover="!(submitting || deleting) && (($event.currentTarget as HTMLElement).style.background='#e6a200')"
          @mouseleave="!(submitting || deleting) && (($event.currentTarget as HTMLElement).style.background='#ffb400')"
          @click="$router.push('/team/add')"
        >
          <UIcon name="i-lucide-plus" style="width:16px;height:16px" />
          Add Team Member
        </button>
      </div>
    </div>

    <!-- Stat cards -->
    <div class="grid-cols-4" style="gap:20px">
      <!-- Loading placeholders -->
      <template v-if="statsLoading">
        <div
          v-for="i in 4"
          :key="`skeleton-${i}`"
          style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1);display:flex;flex-direction:column;gap:12px"
        >
          <div class="skeleton" style="width:40px;height:40px;border-radius:20px" />
          <div class="skeleton" style="height:14px;width:120px" />
          <div class="skeleton" style="height:28px;width:80px" />
        </div>
      </template>
      <!-- Actual stat cards -->
      <template v-else>
        <div v-for="s in statsDisplay" :key="s.label" style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
          <div :style="`width:40px;height:40px;background:${s.iconBg};border-radius:20px;display:flex;align-items:center;justify-content:center;margin-bottom:16px`">
            <UIcon :name="s.icon" :style="`width:20px;height:20px;color:${s.iconColor}`" />
          </div>
          <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0 0 4px">{{ s.label }}</p>
          <p style="font-size:24px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;margin:0">{{ s.value }}</p>
        </div>
      </template>
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
            v-for="(m, i) in members" :key="m.id"
            :style="`border-bottom:${i < members.length - 1 ? '1px solid #e5e7eb' : 'none'}`"
            @mouseover="($event.currentTarget as HTMLElement).style.background='#fafafa'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
          >
            <!-- Member -->
            <td style="padding:16px">
              <div style="display:flex;align-items:center;gap:12px">
                <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(180deg,#ffb400,#ffc83d);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  <span style="font-size:14px;font-weight:500;color:white;font-family:'Manrope',sans-serif">{{ getInitials(m) }}</span>
                </div>
                <span style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">{{ getFullName(m) }}</span>
              </div>
            </td>
            <!-- Email -->
            <td style="padding:16px;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">{{ m.email }}</td>
            <!-- Role -->
            <td style="padding:16px">
              <span :style="`font-size:12px;font-weight:500;border-radius:16px;padding:4px 10px;font-family:'Manrope',sans-serif;color:${getRoleDisplay(m).color};background:${getRoleDisplay(m).bg}`">{{ getRoleDisplay(m).name }}</span>
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
                  :disabled="deleting || submitting"
                  style="width:32px;height:32px;border-radius:20px;border:1px solid #ececec;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center"
                  @mouseover="!(deleting || submitting) && (($event.currentTarget as HTMLElement).style.background='#f8f9fa')"
                  @mouseleave="!(deleting || submitting) && (($event.currentTarget as HTMLElement).style.background='white')"
                  @click="$router.push(`/team/${m.id}/edit`)"
                >
                  <UIcon name="i-lucide-pencil" style="width:15px;height:15px;color:#6b7280" />
                </button>
                <button
                  :disabled="deleting || submitting"
                  style="width:32px;height:32px;border-radius:20px;border:1px solid #fecaca;background:#fef2f2;cursor:pointer;display:flex;align-items:center;justify-content:center"
                  @mouseover="!(deleting || submitting) && (($event.currentTarget as HTMLElement).style.background='#fee2e2')"
                  @mouseleave="!(deleting || submitting) && (($event.currentTarget as HTMLElement).style.background='#fef2f2')"
                  @click="openDeleteModal(m)"
                >
                  <UIcon name="i-lucide-trash-2" style="width:15px;height:15px;color:#ef4444" />
                </button>
              </div>
            </td>
          </tr>
          <!-- Empty state -->
          <tr v-if="members.length === 0 && !loading">
            <td colspan="6" style="padding:48px 16px;text-align:center;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">
              No team members found
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>

  <AddRoleModal
    v-if="showAddRoleModal"
    :submitting="submitting"
    @close="showAddRoleModal = false"
    @submit="handleAddRole"
  />

  <!-- Delete Confirmation Modal -->
  <div
    v-if="showDeleteModal && memberToDelete"
    style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:50;display:flex;align-items:center;justify-content:center;padding:24px"
    @click.self="showDeleteModal = false"
  >
    <div style="background:white;border-radius:16px;width:420px;padding:32px;display:flex;flex-direction:column;gap:20px;box-shadow:0 10px 15px rgba(0,0,0,0.1);position:relative">

      <!-- Close -->
      <button
        style="position:absolute;top:16px;right:16px;width:28px;height:28px;border:none;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:8px;opacity:0.7"
        :disabled="deleting"
        @click="showDeleteModal = false"
        @mouseover="($event.currentTarget as HTMLElement).style.background='#f3f4f6'"
        @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
      >
        <UIcon name="i-lucide-x" style="width:16px;height:16px;color:#111" />
      </button>

      <!-- Icon + text -->
      <div style="display:flex;flex-direction:column;align-items:center;gap:16px;text-align:center">
        <div style="width:56px;height:56px;border-radius:9999px;background:rgba(239,68,68,0.1);display:flex;align-items:center;justify-content:center">
          <UIcon name="i-lucide-trash-2" style="width:24px;height:24px;color:#ef4444" />
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <p style="font-size:20px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Delete Team Member</p>
          <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;line-height:1.6">
            Are you sure you want to delete <span style="font-weight:600;color:#1a1a1a">{{ getFullName(memberToDelete) }}</span>?
            This action cannot be undone.
          </p>
        </div>
      </div>

      <!-- Actions -->
      <div style="display:flex;justify-content:center;gap:8px">
        <button
          style="height:40px;padding:0 20px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer"
          :disabled="deleting"
          @click="showDeleteModal = false"
          @mouseover="($event.currentTarget as HTMLElement).style.background='#e0e0e0'"
          @mouseleave="($event.currentTarget as HTMLElement).style.background='#ececec'"
        >Cancel</button>
        <button
          style="height:40px;padding:0 20px;background:#ef4444;border:none;border-radius:20px;font-size:14px;font-weight:500;color:white;font-family:'Manrope',sans-serif;cursor:pointer;display:flex;align-items:center;gap:8px"
          :disabled="deleting"
          @click="handleDelete"
          @mouseover="!deleting && (($event.currentTarget as HTMLElement).style.opacity='0.9')"
          @mouseleave="($event.currentTarget as HTMLElement).style.opacity='1'"
        >
          <UIcon v-if="deleting" name="i-lucide-loader-2" style="width:16px;height:16px;animation:spin 1s linear infinite" />
          {{ deleting ? 'Deleting...' : 'Delete' }}
        </button>
      </div>
    </div>
  </div>
</template>
