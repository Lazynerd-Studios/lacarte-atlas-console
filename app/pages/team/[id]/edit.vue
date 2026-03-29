<script setup lang="ts">
import type { TeamMember, Role, Permission } from '~/types/team'
import { validateTeamMemberForm } from '~/utils/teamValidation'
import { formToUpdateMemberPayload } from '~/utils/teamTransform'

definePageMeta({ layout: 'dashboard' })

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
const allPermissions = ref<Permission[]>([])
const selectedPermissions = ref<string[]>([])
const loading = ref(false)
const submitting = ref(false)

// Group permissions by module
const permissionGroups = computed(() => {
  const groups: Record<string, Permission[]> = {}
  
  allPermissions.value.forEach(permission => {
    if (!groups[permission.module]) {
      groups[permission.module] = []
    }
    groups[permission.module]!.push(permission)
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
  loading.value = true
  const api = useApi()
  
  try {
    const memberId = route.params.id as string
    const response = await api.get<TeamMember>(`/api/team/admin/members/${memberId}`)
    
    if (response) {
      // Populate form with member data
      form.firstName = response.firstName
      form.lastName = response.lastName
      form.email = response.email
      form.phone = response.phone
      form.role = response.role
      form.status = response.status
      selectedPermissions.value = [...response.permissions]
    }
  } catch (err: any) {
    // Handle invalid member ID error
    toast.error('Member not found', 'The requested team member could not be found')
    router.push('/team')
  } finally {
    loading.value = false
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
  
  const response = await api.get<{ roles: Role[] }>('/api/team/admin/roles')
  if (response) {
    roles.value = response.roles
  }
}

/**
 * Fetches available permissions from the API
 * 
 * Error Handling:
 * - 401: Automatic redirect to login (handled by useApi)
 * - 403, 404, 500: Automatic error toast (handled by useErrorHandler)
 * - Network errors: Automatic error toast (handled by useErrorHandler)
 */
async function fetchPermissions() {
  const api = useApi()
  
  const response = await api.get<{ permissions: Permission[] }>('/api/team/admin/permissions')
  if (response) {
    allPermissions.value = response.permissions
  }
}

/**
 * Toggles individual permission selection
 */
function togglePermission(permissionId: string) {
  const index = selectedPermissions.value.indexOf(permissionId)
  if (index > -1) {
    selectedPermissions.value.splice(index, 1)
  } else {
    selectedPermissions.value.push(permissionId)
  }
}

/**
 * Toggles all permissions in a group
 */
function toggleGroup(module: string) {
  const groupPermissions = permissionGroups.value[module]
  if (!groupPermissions) return
  
  const groupPermissionIds = groupPermissions.map(p => p.id)
  
  if (isGroupSelected(module)) {
    // Deselect all in group
    selectedPermissions.value = selectedPermissions.value.filter(
      id => !groupPermissionIds.includes(id)
    )
  } else {
    // Select all in group
    groupPermissionIds.forEach(id => {
      if (!selectedPermissions.value.includes(id)) {
        selectedPermissions.value.push(id)
      }
    })
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
 * Handles form submission for updating a team member
 * 
 * Validation:
 * - Client-side validation using validation utilities
 * - Display validation errors in form
 * 
 * API Call:
 * - PATCH /api/team/admin/members/:id with UpdateTeamMemberPayload
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
    const payload = formToUpdateMemberPayload({
      ...form,
      permissions: selectedPermissions.value,
    })
    
    const memberId = route.params.id as string
    
    // Use raw request to handle 400 validation errors in form
    await api.request(`/api/team/admin/members/${memberId}`, {
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
  await Promise.all([
    loadMember(),
    fetchRoles(),
    fetchPermissions(),
  ])
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

        <!-- Permissions -->
        <div style="background:white;border:1px solid #ececec;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
          <p style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin:0 0 24px">Permissions</p>
          <div style="display:flex;flex-direction:column;gap:16px">
            <!-- Permission groups -->
            <div v-for="(permissions, module) in permissionGroups" :key="module" style="display:flex;flex-direction:column;gap:4px">
              <!-- Group header -->
              <div
                style="display:flex;align-items:center;gap:12px;padding:12px;border-radius:12px;cursor:pointer;background:#f8f9fa"
                @click="toggleGroup(module)"
              >
                <input
                  type="checkbox"
                  :checked="isGroupSelected(module)"
                  :indeterminate="isGroupPartial(module)"
                  :disabled="submitting"
                  style="width:16px;height:16px;accent-color:#ffb400;cursor:pointer;flex-shrink:0"
                  @click.stop="toggleGroup(module)"
                />
                <p style="font-size:14px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin:0">{{ module }}</p>
              </div>
              <!-- Group permissions -->
              <label
                v-for="p in permissions" :key="p.id"
                style="display:flex;align-items:center;gap:12px;padding:12px 12px 12px 40px;border-radius:12px;cursor:pointer"
                @mouseover="($event.currentTarget as HTMLElement).style.background='#f8f9fa'"
                @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
              >
                <input
                  type="checkbox"
                  :checked="selectedPermissions.includes(p.id)"
                  :disabled="submitting"
                  style="width:16px;height:16px;accent-color:#ffb400;cursor:pointer;flex-shrink:0"
                  @change="togglePermission(p.id)"
                />
                <div>
                  <p style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif;margin:0 0 2px">{{ p.label }}</p>
                  <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0">{{ p.description }}</p>
                </div>
              </label>
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
