<script setup lang="ts">
import type { Role, Permission } from '~/types/team'
import { validateTeamMemberForm } from '~/utils/teamValidation'
import { formToUpdateMemberPayload } from '~/utils/teamTransform'

definePageMeta({ 
  layout: 'dashboard',
  middleware: 'auth'
})

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const toast = useAppToast()

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: '',
  status: 'active' as 'active' | 'inactive',
})

const errors = reactive<Record<string, string>>({})
const roles = ref<Role[]>([])
const selectedPermissions = ref<string[]>([])
const loading = ref(true)
const submitting = ref(false)

// Group permissions by module for display
const permissionGroups = computed(() => {
  const groups: Record<string, Array<{ id: string; label: string; description: string }>> = {}
  
  // Group the permission IDs we have from the member data
  // We'll display them as simple strings since we don't have full permission details
  selectedPermissions.value.forEach(permissionKey => {
    // Extract module from permission key (e.g., "billing.view" -> "billing")
    const parts = permissionKey.split('.')
    const module = parts[0] || 'Other'
    
    if (!groups[module]) {
      groups[module] = []
    }
    
    // Create a display-friendly label from the permission key
    const action = parts.slice(1).join(' ')
    const label = action.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
    
    groups[module].push({
      id: permissionKey,
      label: label || permissionKey,
      description: `${module}.${action}`
    })
  })
  
  return groups
})

/**
 * Loads team member data from the API
 * 
 * Error Handling:
 * - 401: Automatic redirect to login (handled by useApi)
 * - 404: Display error toast and redirect to team list
 * - 403, 500: Automatic error toast (handled by useErrorHandler)
 * - Network errors: Automatic error toast (handled by useErrorHandler)
 */
async function loadMember() {
  const api = useApi()
  
  try {
    const memberId = route.params.id as string
    console.log('[Team Edit] Fetching member data from /team/' + memberId)
    
    // Backend response structure: { id, user: { name, email }, role: { id, name, displayName }, permissions: [], phoneNumber, status, ... }
    const response = await api.get<any>(`/team/${memberId}`)
    
    if (response) {
      console.log('[Team Edit] Member data fetched successfully', { response })
      
      // Split user.name into firstName and lastName
      const nameParts = (response.user?.name || '').split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''
      
      // Populate form with member data
      form.firstName = firstName
      form.lastName = lastName
      form.email = response.user?.email || ''
      form.phone = response.phoneNumber || ''
      form.role = response.role?.id || ''
      form.status = response.status || 'active'
      selectedPermissions.value = [...(response.permissions || [])]
      
      console.log('[Team Edit] Form populated', { form, selectedPermissions: selectedPermissions.value })
    }
  } catch (err: any) {
    console.error('[Team Edit] Failed to load member', { error: err })
    // Handle invalid member ID error
    toast.error('Member not found', 'The requested team member could not be found')
    router.push('/team')
  }
}

/**
 * Fetches available roles from the API
 * 
 * Error Handling:
 * - 401: Automatic redirect to login (handled by useApi)
 * - 403, 404, 500: Automatic error toast (handled by useErrorHandler)
 * - Network errors: Automatic error toast (handled by useErrorHandler)
 */
async function fetchRoles() {
  const api = useApi()
  
  console.log('[Team Edit] Fetching roles from /team/roles')
  const response = await api.get<Role[]>('/team/roles')
  if (response) {
    console.log('[Team Edit] Roles fetched successfully', { count: response.length })
    roles.value = response
  }
}

/**
 * Checks if all permissions in a group are selected
 */
function isGroupSelected(module: string): boolean {
  const groupPermissions = permissionGroups.value[module] || []
  if (groupPermissions.length === 0) return false
  
  return groupPermissions.every(p => selectedPermissions.value.includes(p.id))
}

/**
 * Checks if some (but not all) permissions in a group are selected
 */
function isGroupPartial(module: string): boolean {
  const groupPermissions = permissionGroups.value[module]
  if (!groupPermissions || groupPermissions.length === 0) return false
  
  const selectedCount = groupPermissions.filter(p => 
    selectedPermissions.value.includes(p.id)
  ).length
  
  return selectedCount > 0 && selectedCount < groupPermissions.length
}

/**
 * Checks if the current user has admin privileges
 * Returns true if user is admin, false otherwise
 */
function hasAdminPrivileges(): boolean {
  // Check if user has admin role or super admin role
  const userRole = authStore.user?.role?.toLowerCase() || ''
  return userRole.includes('admin') || userRole.includes('super')
}

/**
 * Checks authorization before performing operations
 * Shows error toast and returns false if user lacks privileges
 */
function checkAuthorization(operationName: string): boolean {
  if (!hasAdminPrivileges()) {
    toast.error('Unauthorized', `You don't have permission to ${operationName}`)
    return false
  }
  return true
}

/**
 * Handles form submission for updating a team member
 * 
 * Authorization:
 * - Verifies user has admin privileges before allowing operation
 * 
 * Validation:
 * - Client-side validation using validation utilities
 * - Display validation errors in form
 * 
 * API Call:
 * - PATCH /team/admin/members/:id with UpdateTeamMemberPayload
 * 
 * Error Handling:
 * - 400 validation errors: Display in form
 * - 404: Display error toast (invalid member ID)
 * - 401: Automatic redirect to login (handled by useApi)
 * - 403, 500: Display error toast (manual handling)
 * - Network errors: Display error toast (manual handling)
 * 
 * Success Flow:
 * - Show success toast
 * - Navigate to team list page
 */
async function handleSubmit() {
  // Check authorization before allowing operation
  if (!checkAuthorization('update team members')) {
    return
  }
  
  // Clear previous errors
  Object.keys(errors).forEach(key => delete errors[key])
  
  // Client-side validation
  const validationErrors = validateTeamMemberForm(form, true)
  if (Object.keys(validationErrors).length > 0) {
    Object.assign(errors, validationErrors)
    return
  }
  
  // Set submitting state
  submitting.value = true
  
  try {
    const api = useApi()
    // Don't include permissions in update payload - they are determined by role
    const payload = formToUpdateMemberPayload(form)
    
    const memberId = route.params.id as string
    
    console.log('[Team Edit] Sending PATCH request to /team/' + memberId, { payload })
    
    // Use raw request to handle 400 validation errors in form
    await api.request(`/team/${memberId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    
    submitting.value = false
    
    // Success flow
    toast.success('Team member updated successfully')
    router.push('/team')
  } catch (err: any) {
    submitting.value = false
    
    // Handle 400 validation errors or 404 not found
    if (err?.message?.toLowerCase().includes('not found')) {
      toast.error('Member not found', 'The requested team member could not be found')
      router.push('/team')
    } else {
      // Other errors (403, 500, network) show as toast
      const errorMessage = err?.message || 'Failed to update team member'
      toast.error('Failed to update team member', errorMessage)
    }
  }
}

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

// Fetch data on mount
onMounted(async () => {
  // Check authorization before displaying content
  if (!checkAuthorization('access team management')) {
    router.push('/team')
    return
  }
  
  loading.value = true
  await Promise.all([
    loadMember(),
    fetchRoles(),
  ])
  loading.value = false
})
</script>

<template>
  <div v-if="loading" style="display:flex;flex-direction:column;gap:28px">
    <PageSkeleton type="dashboard" />
  </div>
  
  <div v-else style="display:flex;flex-direction:column;gap:28px">

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
                <input v-model="form.firstName" placeholder="Enter first name" :disabled="submitting" style="width:100%;height:40px;border:1px solid #e5e7eb;border-radius:12px;padding:0 12px;font-size:14px;font-family:'Manrope',sans-serif;color:#111;background:white;outline:none;box-sizing:border-box" @focus="($event.target as HTMLInputElement).style.borderColor='#ffb400'" @blur="($event.target as HTMLInputElement).style.borderColor='#e5e7eb'" />
                <p v-if="errors.firstName" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif;margin:6px 0 0">{{ errors.firstName }}</p>
              </div>
              <div>
                <label style="display:block;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;margin-bottom:8px">Last Name</label>
                <input v-model="form.lastName" placeholder="Enter last name" :disabled="submitting" style="width:100%;height:40px;border:1px solid #e5e7eb;border-radius:12px;padding:0 12px;font-size:14px;font-family:'Manrope',sans-serif;color:#111;background:white;outline:none;box-sizing:border-box" @focus="($event.target as HTMLInputElement).style.borderColor='#ffb400'" @blur="($event.target as HTMLInputElement).style.borderColor='#e5e7eb'" />
                <p v-if="errors.lastName" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif;margin:6px 0 0">{{ errors.lastName }}</p>
              </div>
            </div>
            <div>
              <label style="display:block;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;margin-bottom:8px">Email Address</label>
              <input v-model="form.email" type="email" placeholder="member@lacarte.com" :disabled="submitting" style="width:100%;height:40px;border:1px solid #e5e7eb;border-radius:12px;padding:0 12px;font-size:14px;font-family:'Manrope',sans-serif;color:#111;background:white;outline:none;box-sizing:border-box" @focus="($event.target as HTMLInputElement).style.borderColor='#ffb400'" @blur="($event.target as HTMLInputElement).style.borderColor='#e5e7eb'" />
              <p v-if="errors.email" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif;margin:6px 0 0">{{ errors.email }}</p>
            </div>
            <div>
              <label style="display:block;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;margin-bottom:8px">Phone Number</label>
              <input v-model="form.phone" type="tel" placeholder="+1 (555) 000-0000" :disabled="submitting" style="width:100%;height:40px;border:1px solid #e5e7eb;border-radius:12px;padding:0 12px;font-size:14px;font-family:'Manrope',sans-serif;color:#111;background:white;outline:none;box-sizing:border-box" @focus="($event.target as HTMLInputElement).style.borderColor='#ffb400'" @blur="($event.target as HTMLInputElement).style.borderColor='#e5e7eb'" />
              <p v-if="errors.phone" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif;margin:6px 0 0">{{ errors.phone }}</p>
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
                <select v-model="form.role" :disabled="submitting" style="width:100%;height:42px;border:1px solid #e5e7eb;border-radius:12px;padding:0 36px 0 12px;font-size:14px;font-family:'Manrope',sans-serif;color:#111;background:white;outline:none;appearance:none;cursor:pointer;box-sizing:border-box" @focus="($event.target as HTMLSelectElement).style.borderColor='#ffb400'" @blur="($event.target as HTMLSelectElement).style.borderColor='#e5e7eb'">
                  <option value="" disabled>Select a role</option>
                  <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</option>
                </select>
                <UIcon name="i-lucide-chevron-down" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);width:18px;height:18px;color:#6b7280;pointer-events:none" />
              </div>
              <p v-if="errors.role" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif;margin:6px 0 0">{{ errors.role }}</p>
              <p v-else style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin:6px 0 0">Role determines the access level and permissions</p>
            </div>
            <div>
              <label style="display:block;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;margin-bottom:8px">Status</label>
              <div style="position:relative">
                <select v-model="form.status" :disabled="submitting" style="width:100%;height:42px;border:1px solid #e5e7eb;border-radius:12px;padding:0 36px 0 12px;font-size:14px;font-family:'Manrope',sans-serif;color:#111;background:white;outline:none;appearance:none;cursor:pointer;box-sizing:border-box" @focus="($event.target as HTMLSelectElement).style.borderColor='#ffb400'" @blur="($event.target as HTMLSelectElement).style.borderColor='#e5e7eb'">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <UIcon name="i-lucide-chevron-down" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);width:18px;height:18px;color:#6b7280;pointer-events:none" />
              </div>
            </div>
          </div>
        </div>

        <!-- Permissions (Read-only) -->
        <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
            <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin:0">Permissions</p>
            <span style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;background:#f3f4f6;padding:4px 12px;border-radius:12px">Read-only</span>
          </div>
          <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0 0 16px">These permissions are determined by the selected role and cannot be modified directly.</p>
          <div style="display:flex;flex-direction:column;gap:16px">
            <!-- Permission groups -->
            <div v-for="(permissions, module) in permissionGroups" :key="module" style="display:flex;flex-direction:column;gap:4px">
              <!-- Group header -->
              <div style="display:flex;align-items:center;gap:12px;padding:12px;border-radius:12px;background:#f8f9fa">
                <input
                  type="checkbox"
                  :checked="isGroupSelected(module)"
                  :indeterminate="isGroupPartial(module)"
                  disabled
                  style="width:16px;height:16px;accent-color:#ffb400;flex-shrink:0;opacity:0.6;cursor:not-allowed"
                />
                <p style="font-size:14px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin:0">{{ module }}</p>
              </div>
              <!-- Group permissions -->
              <div
                v-for="p in permissions" :key="p.id"
                style="display:flex;align-items:center;gap:12px;padding:12px 12px 12px 40px;border-radius:12px"
              >
                <input
                  type="checkbox"
                  :checked="selectedPermissions.includes(p.id)"
                  disabled
                  style="width:16px;height:16px;accent-color:#ffb400;flex-shrink:0;opacity:0.6;cursor:not-allowed"
                />
                <div>
                  <p style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;margin:0 0 2px">{{ p.label }}</p>
                  <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0">{{ p.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div style="display:flex;gap:12px">
          <button
            :disabled="submitting"
            style="flex:1;height:40px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer;box-shadow:0 1px 3px rgba(255,180,0,0.2);display:flex;align-items:center;justify-content:center;gap:8px"
            @click="handleSubmit"
            @mouseover="!submitting && (($event.currentTarget as HTMLElement).style.background='#e6a200')"
            @mouseleave="!submitting && (($event.currentTarget as HTMLElement).style.background='#ffb400')"
          >
            <UIcon v-if="submitting" name="i-lucide-loader-2" style="width:16px;height:16px;animation:spin 1s linear infinite" />
            <span>{{ submitting ? 'Saving...' : 'Save Changes' }}</span>
          </button>
          <NuxtLink to="/team" style="flex:1">
            <button
              :disabled="submitting"
              style="width:100%;height:40px;background:#ececec;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px"
              @mouseover="!submitting && (($event.currentTarget as HTMLElement).style.background='#e0e0e0')"
              @mouseleave="!submitting && (($event.currentTarget as HTMLElement).style.background='#ececec')"
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

<style scoped>
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
