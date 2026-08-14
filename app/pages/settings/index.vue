<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const activeTab = ref('security')

const tabs = [
  // { key: 'general',       label: 'General' },
  // { key: 'notifications', label: 'Notifications' },
  { key: 'security',      label: 'Security' },
  { key: 'activity',      label: 'Activity Logs' },
]

// General tab state
const company = reactive({
  name: 'LaCarte Waste Management',
  email: 'contact@lacarte.com',
  phone: '(555) 000-0000',
  address: '',
  timezone: 'Africa/Accra',
  currency: 'GHS',
})

const timezones = [
  'Africa/Accra',
  'Africa/Lagos',
  'Africa/Nairobi',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Dubai',
]

const currencies = ['GHS', 'USD', 'EUR', 'GBP', 'NGN', 'KES']

const saveSuccess = ref(false)

function saveChanges() {
  saveSuccess.value = true
  setTimeout(() => { saveSuccess.value = false }, 2500)
}

// Notifications tab state
const notifications = reactive({
  emailNewPickup: true,
  emailDriverAssigned: true,
  emailPaymentReceived: true,
  emailLowInventory: false,
  smsNewPickup: false,
  smsDriverAssigned: true,
  smsPaymentReceived: false,
})

// Security tab state
const security = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  twoFactor: false,
})

const api = useApi()
const toast = useAppToast()
const securityErrors = reactive<Record<string, string>>({})
const securityLoading = ref(false)

// Password visibility toggles
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

function validatePasswordForm() {
  Object.keys(securityErrors).forEach(k => delete securityErrors[k])
  if (!security.currentPassword) securityErrors.currentPassword = 'Required'
  if (!security.newPassword) securityErrors.newPassword = 'Required'
  else if (security.newPassword.length < 8) securityErrors.newPassword = 'Must be at least 8 characters'
  if (!security.confirmPassword) securityErrors.confirmPassword = 'Required'
  else if (security.newPassword !== security.confirmPassword) securityErrors.confirmPassword = 'Passwords do not match'
  return Object.keys(securityErrors).length === 0
}

async function changePassword() {
  if (!validatePasswordForm()) return
  securityLoading.value = true
  try {
    const result = await api.post<{ token: string; user: any }>('/auth/change-password', {
      currentPassword: security.currentPassword,
      newPassword: security.newPassword,
      revokeOtherSessions: false,
    }, 'Failed to change password')
    if (result) {
      // Update token and reset session timers if new one is returned
      if (result.token) {
        const authStore = useAuthStore()
        authStore.updateToken(result.token, result.user)
      }
      // Clear form
      security.currentPassword = ''
      security.newPassword = ''
      security.confirmPassword = ''
      toast.success('Password changed successfully')
    }
  } finally {
    securityLoading.value = false
  }
}

// Activity Logs tab state
interface ActivityLog {
  id: string
  actorId: string
  actorType: string
  action: string
  description: string
  module: string
  entityType: string
  entityId: string
  before: any
  after: any
  ipAddress: string
  userAgent: string
  correlationId: string
  createdAt: string
}

const activityLogs = ref<ActivityLog[]>([])
const activityLoading = ref(false)
const activitySearch = ref('')
const activityActionFilter = ref('')
const activityModuleFilter = ref('')
const activityEntityTypeFilter = ref('')

const activityPagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
})

async function fetchActivityLogs() {
  activityLoading.value = true
  try {
    const params = new URLSearchParams({
      page: activityPagination.value.page.toString(),
      limit: activityPagination.value.limit.toString(),
    })
    
    if (activitySearch.value) params.append('search', activitySearch.value)
    if (activityActionFilter.value) params.append('action', activityActionFilter.value)
    if (activityModuleFilter.value) params.append('module', activityModuleFilter.value)
    if (activityEntityTypeFilter.value) params.append('entityType', activityEntityTypeFilter.value)
    
    const data = await api.get<any>(`/activity-logs/me?${params.toString()}`)
    if (data) {
      activityLogs.value = data.data || []
      if (data.pagination) {
        activityPagination.value = data.pagination
      }
    }
  } finally {
    activityLoading.value = false
  }
}

// Debounced search
let searchTimeout: NodeJS.Timeout
watch(activitySearch, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    activityPagination.value.page = 1
    fetchActivityLogs()
  }, 500)
})

// Filter changes
watch([activityActionFilter, activityModuleFilter, activityEntityTypeFilter], () => {
  activityPagination.value.page = 1
  fetchActivityLogs()
})

function goToPage(page: number) {
  activityPagination.value.page = page
  fetchActivityLogs()
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getActivityIcon(action: string) {
  if (action.includes('create')) return 'i-lucide-plus-circle'
  if (action.includes('update') || action.includes('edit')) return 'i-lucide-edit'
  if (action.includes('delete')) return 'i-lucide-trash-2'
  if (action.includes('login')) return 'i-lucide-log-in'
  if (action.includes('logout')) return 'i-lucide-log-out'
  if (action.includes('assign')) return 'i-lucide-user-check'
  if (action.includes('approve')) return 'i-lucide-check-circle'
  if (action.includes('reject') || action.includes('decline')) return 'i-lucide-x-circle'
  return 'i-lucide-activity'
}

function getActivityColor(action: string) {
  if (action.includes('create')) return '#22c55e'
  if (action.includes('update') || action.includes('edit')) return '#3b82f6'
  if (action.includes('delete')) return '#ef4444'
  if (action.includes('login')) return '#8b5cf6'
  if (action.includes('logout')) return '#6b7280'
  if (action.includes('assign')) return '#f59e0b'
  if (action.includes('approve')) return '#10b981'
  if (action.includes('reject') || action.includes('decline')) return '#ef4444'
  return '#6b7280'
}

onMounted(() => {
  if (activeTab.value === 'activity') {
    fetchActivityLogs()
  }
})

watch(activeTab, (newTab) => {
  if (newTab === 'activity' && activityLogs.value.length === 0) {
    fetchActivityLogs()
  }
})

</script>

<template>
  <div style="display:flex;flex-direction:column;gap:32px">

    <!-- Header -->
    <div>
      <h1 style="font-size:32px;font-weight:700;color:#111;font-family:'Manrope',sans-serif;line-height:1.3;margin:0">Settings</h1>
      <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif;margin-top:8px;margin-bottom:0">Manage system settings and preferences</p>
    </div>

    <!-- Card -->
    <div style="background:white;border:1px solid #ececec;border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,0.1);overflow:hidden">

      <!-- Tab list -->
      <div style="display:flex;align-items:center;gap:14px;padding:0 24px;border-bottom:1px solid #ececec">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :style="`
            height:47px;
            padding:12px 16px 14px;
            background:none;
            border:none;
            border-bottom:2px solid ${activeTab === tab.key ? '#ffb400' : 'transparent'};
            font-size:14px;
            font-weight:500;
            font-family:'Manrope',sans-serif;
            color:${activeTab === tab.key ? '#1a1a1a' : '#6b7280'};
            cursor:pointer;
            white-space:nowrap;
            transition:color 0.15s,border-color 0.15s;
          `"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Tab content -->
      <div style="padding:32px 24px">

        <!-- General (commented out)
        <div v-if="activeTab === 'general'" style="display:flex;flex-direction:column;gap:32px;max-width:672px">

          <div style="display:flex;flex-direction:column;gap:16px">
            <h3 style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin:0">Company Information</h3>

            <div style="display:flex;flex-direction:column;gap:6px">
              <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Company Name</label>
              <input
                v-model="company.name"
                type="text"
                style="height:39px;padding:8px 12px;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box;width:100%"
                @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
                @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
              />
            </div>

            <div style="display:flex;flex-direction:column;gap:6px">
              <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Email</label>
              <input
                v-model="company.email"
                type="email"
                style="height:39px;padding:8px 12px;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box;width:100%"
                @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
                @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
              />
            </div>

            <div style="display:flex;flex-direction:column;gap:6px">
              <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Phone</label>
              <input
                v-model="company.phone"
                type="tel"
                style="height:39px;padding:8px 12px;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box;width:100%"
                @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
                @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
              />
            </div>

            <div style="display:flex;flex-direction:column;gap:6px">
              <label style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">Address</label>
              <textarea
                v-model="company.address"
                rows="4"
                style="padding:8px 12px;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box;width:100%;resize:vertical;min-height:90px"
                @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
                @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
              />
            </div>
          </div>

          <div style="display:flex;flex-direction:column;gap:16px">
            <h3 style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin:0">Regional Settings</h3>

            <div style="display:flex;flex-direction:column;gap:6px">
              <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Timezone</label>
              <div style="position:relative">
                <select
                  v-model="company.timezone"
                  style="width:100%;height:42px;padding:0 40px 0 12px;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;appearance:none;background:white;cursor:pointer;box-sizing:border-box"
                  @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
                  @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
                >
                  <option v-for="tz in timezones" :key="tz" :value="tz">{{ tz }}</option>
                </select>
                <UIcon name="i-lucide-chevron-down" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);width:18px;height:18px;color:#6b7280;pointer-events:none" />
              </div>
            </div>

            <div style="display:flex;flex-direction:column;gap:6px">
              <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Currency</label>
              <div style="position:relative">
                <select
                  v-model="company.currency"
                  style="width:100%;height:42px;padding:0 40px 0 12px;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;appearance:none;background:white;cursor:pointer;box-sizing:border-box"
                  @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
                  @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
                >
                  <option v-for="c in currencies" :key="c" :value="c">{{ c }}</option>
                </select>
                <UIcon name="i-lucide-chevron-down" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);width:18px;height:18px;color:#6b7280;pointer-events:none" />
              </div>
            </div>
          </div>

          <div style="display:flex;align-items:center;gap:12px">
            <button
              style="height:40px;padding:0 24px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer;box-shadow:0 1px 3px rgba(255,180,0,0.2)"
              @click="saveChanges"
              @mouseover="($event.currentTarget as HTMLElement).style.background='#e6a200'"
              @mouseleave="($event.currentTarget as HTMLElement).style.background='#ffb400'"
            >
              Save Changes
            </button>
            <span v-if="saveSuccess" style="font-size:14px;color:#22c55e;font-family:'Manrope',sans-serif;display:flex;align-items:center;gap:6px">
              <UIcon name="i-lucide-check-circle" style="width:16px;height:16px" />
              Saved successfully
            </span>
          </div>
        </div>
        -->

        <!-- Notifications (commented out)
        <div v-else-if="activeTab === 'notifications'" style="display:flex;flex-direction:column;gap:24px;max-width:672px">
          <h3 style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin:0">Notification Preferences</h3>

          <div style="display:flex;flex-direction:column;gap:0;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
            <div
              v-for="(item, i) in [
                { key: 'emailNewPickup',      label: 'New pickup request',    desc: 'Get notified when a new pickup is submitted', channel: 'Email' },
                { key: 'emailDriverAssigned', label: 'Driver assigned',       desc: 'When a driver is assigned to a pickup',       channel: 'Email' },
                { key: 'emailPaymentReceived',label: 'Payment received',      desc: 'When a customer payment is confirmed',        channel: 'Email' },
                { key: 'emailLowInventory',   label: 'Low inventory alert',   desc: 'When stock falls below threshold',            channel: 'Email' },
                { key: 'smsNewPickup',        label: 'New pickup request',    desc: 'SMS alert for new pickups',                   channel: 'SMS' },
                { key: 'smsDriverAssigned',   label: 'Driver assigned',       desc: 'SMS when driver is assigned',                 channel: 'SMS' },
                { key: 'smsPaymentReceived',  label: 'Payment received',      desc: 'SMS when payment is confirmed',               channel: 'SMS' },
              ]"
              :key="item.key"
              :style="`display:flex;align-items:center;justify-content:space-between;padding:16px 20px;${i > 0 ? 'border-top:1px solid #e5e7eb' : ''}`"
            >
              <div>
                <div style="display:flex;align-items:center;gap:8px">
                  <span style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">{{ item.label }}</span>
                  <span style="font-size:11px;font-weight:500;font-family:'Manrope',sans-serif;padding:2px 8px;border-radius:10px;background:#f3f4f6;color:#6b7280">{{ item.channel }}</span>
                </div>
                <p style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif;margin:2px 0 0">{{ item.desc }}</p>
              </div>
              <button
                :style="`width:44px;height:24px;border-radius:12px;border:none;cursor:pointer;position:relative;transition:background 0.2s;background:${(notifications as any)[item.key] ? '#ffb400' : '#e5e7eb'}`"
                @click="(notifications as any)[item.key] = !(notifications as any)[item.key]"
              >
                <span :style="`position:absolute;top:2px;width:20px;height:20px;border-radius:50%;background:white;box-shadow:0 1px 3px rgba(0,0,0,0.2);transition:left 0.2s;left:${(notifications as any)[item.key] ? '22px' : '2px'}`" />
              </button>
            </div>
          </div>

          <button
            style="align-self:flex-start;height:40px;padding:0 24px;background:#ffb400;border:none;border-radius:20px;font-size:14px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer;box-shadow:0 1px 3px rgba(255,180,0,0.2)"
            @mouseover="($event.currentTarget as HTMLElement).style.background='#e6a200'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background='#ffb400'"
          >
            Save Changes
          </button>
        </div>
        -->

        <!-- Security -->
        <div v-if="activeTab === 'security'" style="display:flex;flex-direction:column;gap:24px;max-width:480px">
          <h3 style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin:0">Change Password</h3>

          <div style="display:flex;flex-direction:column;gap:16px">
            <div style="display:flex;flex-direction:column;gap:6px">
              <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Current Password</label>
              <div style="position:relative">
                <input
                  v-model="security.currentPassword"
                  :type="showCurrentPassword ? 'text' : 'password'"
                  :style="`height:39px;padding:8px 40px 8px 12px;border:1px solid ${securityErrors.currentPassword ? '#ef4444' : '#e5e7eb'};border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box;width:100%`"
                  @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
                  @blur="($event.target as HTMLElement).style.borderColor=securityErrors.currentPassword ? '#ef4444' : '#e5e7eb'"
                />
                <button
                  type="button"
                  style="position:absolute;right:8px;top:50%;transform:translateY(-50%);width:28px;height:28px;border:none;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:8px"
                  @click="showCurrentPassword = !showCurrentPassword"
                >
                  <UIcon :name="showCurrentPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'" style="width:16px;height:16px;color:#6b7280" />
                </button>
              </div>
              <span v-if="securityErrors.currentPassword" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ securityErrors.currentPassword }}</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px">
              <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">New Password</label>
              <div style="position:relative">
                <input
                  v-model="security.newPassword"
                  :type="showNewPassword ? 'text' : 'password'"
                  :style="`height:39px;padding:8px 40px 8px 12px;border:1px solid ${securityErrors.newPassword ? '#ef4444' : '#e5e7eb'};border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box;width:100%`"
                  @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
                  @blur="($event.target as HTMLElement).style.borderColor=securityErrors.newPassword ? '#ef4444' : '#e5e7eb'"
                />
                <button
                  type="button"
                  style="position:absolute;right:8px;top:50%;transform:translateY(-50%);width:28px;height:28px;border:none;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:8px"
                  @click="showNewPassword = !showNewPassword"
                >
                  <UIcon :name="showNewPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'" style="width:16px;height:16px;color:#6b7280" />
                </button>
              </div>
              <span v-if="securityErrors.newPassword" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ securityErrors.newPassword }}</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px">
              <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Confirm New Password</label>
              <div style="position:relative">
                <input
                  v-model="security.confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  :style="`height:39px;padding:8px 40px 8px 12px;border:1px solid ${securityErrors.confirmPassword ? '#ef4444' : '#e5e7eb'};border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box;width:100%`"
                  @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
                  @blur="($event.target as HTMLElement).style.borderColor=securityErrors.confirmPassword ? '#ef4444' : '#e5e7eb'"
                />
                <button
                  type="button"
                  style="position:absolute;right:8px;top:50%;transform:translateY(-50%);width:28px;height:28px;border:none;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:8px"
                  @click="showConfirmPassword = !showConfirmPassword"
                >
                  <UIcon :name="showConfirmPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'" style="width:16px;height:16px;color:#6b7280" />
                </button>
              </div>
              <span v-if="securityErrors.confirmPassword" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ securityErrors.confirmPassword }}</span>
            </div>
          </div>

          <!-- 2FA (commented out)
          <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border:1px solid #e5e7eb;border-radius:16px">
            <div>
              <p style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif;margin:0">Two-Factor Authentication</p>
              <p style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif;margin:2px 0 0">Add an extra layer of security to your account</p>
            </div>
            <button
              :style="`width:44px;height:24px;border-radius:12px;border:none;cursor:pointer;position:relative;transition:background 0.2s;background:${security.twoFactor ? '#ffb400' : '#e5e7eb'}`"
              @click="security.twoFactor = !security.twoFactor"
            >
              <span :style="`position:absolute;top:2px;width:20px;height:20px;border-radius:50%;background:white;box-shadow:0 1px 3px rgba(0,0,0,0.2);transition:left 0.2s;left:${security.twoFactor ? '22px' : '2px'}`" />
            </button>
          </div>
          -->

          <button
            :disabled="securityLoading"
            :style="`align-self:flex-start;height:40px;padding:0 24px;background:${securityLoading ? '#f3f4f6' : '#ffb400'};border:none;border-radius:20px;font-size:14px;font-weight:500;color:${securityLoading ? '#9ca3af' : '#0a0d12'};font-family:'Manrope',sans-serif;cursor:${securityLoading ? 'not-allowed' : 'pointer'};box-shadow:0 1px 3px rgba(255,180,0,0.2);display:flex;align-items:center;gap:8px`"
            @click="changePassword"
          >
            <UIcon v-if="securityLoading" name="i-lucide-loader-2" style="width:16px;height:16px;animation:spin 1s linear infinite" />
            {{ securityLoading ? 'Updating...' : 'Update Password' }}
          </button>
        </div>

        <!-- Activity Logs -->
        <div v-else-if="activeTab === 'activity'" style="display:flex;flex-direction:column;gap:24px">
          
          <!-- Header with filters -->
          <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">
            <h3 style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif;margin:0">Activity Logs</h3>
            
            <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
              <!-- Search -->
              <div style="position:relative">
                <UIcon name="i-lucide-search" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);width:15px;height:15px;color:#9ca3af;pointer-events:none" />
                <input 
                  v-model="activitySearch" 
                  placeholder="Search logs..." 
                  style="width:200px;height:38px;padding:0 14px 0 36px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:13px;font-family:'Manrope',sans-serif;outline:none;box-sizing:border-box" 
                />
              </div>
              
              <!-- Module Filter -->
              <div style="position:relative">
                <select
                  v-model="activityModuleFilter"
                  style="height:38px;padding:0 36px 0 12px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:13px;font-family:'Manrope',sans-serif;outline:none;appearance:none;background:white;cursor:pointer;box-sizing:border-box"
                >
                  <option value="">All Modules</option>
                  <option value="auth">Auth</option>
                  <option value="customer">Customer</option>
                  <option value="driver">Driver</option>
                  <option value="pickup">Pickup</option>
                  <option value="billing">Billing</option>
                  <option value="inventory">Inventory</option>
                  <option value="team">Team</option>
                </select>
                <UIcon name="i-lucide-chevron-down" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:#6b7280;pointer-events:none" />
              </div>
              
              <!-- Entity Type Filter -->
              <div style="position:relative">
                <select
                  v-model="activityEntityTypeFilter"
                  style="height:38px;padding:0 36px 0 12px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:13px;font-family:'Manrope',sans-serif;outline:none;appearance:none;background:white;cursor:pointer;box-sizing:border-box"
                >
                  <option value="">All Entities</option>
                  <option value="customer">Customer</option>
                  <option value="driver">Driver</option>
                  <option value="pickup">Pickup</option>
                  <option value="truck">Truck</option>
                  <option value="rate">Rate</option>
                  <option value="zone">Zone</option>
                  <option value="admin">Admin</option>
                </select>
                <UIcon name="i-lucide-chevron-down" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:#6b7280;pointer-events:none" />
              </div>
            </div>
          </div>

          <!-- Loading state -->
          <div v-if="activityLoading" style="padding:60px 24px;text-align:center">
            <UIcon name="i-lucide-loader-2" style="width:40px;height:40px;color:#ffb400;margin-bottom:12px;animation:spin 1s linear infinite" />
            <p style="font-size:15px;font-weight:600;color:#1a1a1a;margin:0">Loading activity logs...</p>
          </div>

          <!-- Activity list -->
          <div v-else style="display:flex;flex-direction:column;gap:0;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
            <div
              v-for="(log, i) in activityLogs"
              :key="log.id"
              :style="`display:flex;align-items:start;gap:16px;padding:16px 20px;${i > 0 ? 'border-top:1px solid #e5e7eb' : ''}`"
            >
              <!-- Icon -->
              <div :style="`width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:${getActivityColor(log.action)}15;flex-shrink:0`">
                <UIcon :name="getActivityIcon(log.action)" :style="`width:18px;height:18px;color:${getActivityColor(log.action)}`" />
              </div>
              
              <!-- Content -->
              <div style="flex:1;min-width:0">
                <div style="display:flex;align-items:start;justify-content:space-between;gap:12px;margin-bottom:4px">
                  <div>
                    <p style="font-size:14px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif;margin:0">{{ log.action }}</p>
                    <div style="display:flex;align-items:center;gap:8px;margin-top:4px">
                      <span style="font-size:11px;font-weight:500;font-family:'Manrope',sans-serif;padding:2px 8px;border-radius:10px;background:#f3f4f6;color:#6b7280">{{ log.module }}</span>
                      <span v-if="log.entityType" style="font-size:11px;font-weight:500;font-family:'Manrope',sans-serif;padding:2px 8px;border-radius:10px;background:#f3f4f6;color:#6b7280">{{ log.entityType }}</span>
                    </div>
                  </div>
                  <span style="font-size:12px;color:#9ca3af;font-family:'Manrope',sans-serif;white-space:nowrap">{{ formatTimestamp(log.createdAt) }}</span>
                </div>
                <p style="font-size:13px;color:#6b7280;font-family:'Manrope',sans-serif;margin:0">{{ log.description }}</p>
                <div v-if="log.ipAddress" style="display:flex;align-items:center;gap:6px;margin-top:6px">
                  <UIcon name="i-lucide-map-pin" style="width:12px;height:12px;color:#9ca3af" />
                  <span style="font-size:12px;color:#9ca3af;font-family:'Manrope',sans-serif">{{ log.ipAddress }}</span>
                </div>
              </div>
            </div>
            
            <!-- Empty state -->
            <div v-if="activityLogs.length === 0" style="padding:60px 24px;text-align:center">
              <UIcon name="i-lucide-activity" style="width:40px;height:40px;color:#d1d5db;margin-bottom:12px" />
              <p style="font-size:15px;font-weight:600;color:#1a1a1a;margin:0 0 6px">No activity logs found</p>
              <p style="font-size:13px;color:#6b7280;margin:0">Try adjusting your search or filter criteria.</p>
            </div>
          </div>

          <!-- Pagination -->
          <AppPagination
            v-if="activityPagination.total > 0"
            :page="activityPagination.page"
            :total="activityPagination.total"
            :per-page="activityPagination.limit"
            @update:page="goToPage"
          />
        </div>

      </div>
    </div>

  </div>
</template>
