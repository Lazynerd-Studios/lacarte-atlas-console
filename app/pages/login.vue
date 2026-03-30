<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: false })

const authStore = useAuthStore()
const router = useRouter()

const form = reactive({
  email: '',
  password: '',
  remember: false,
})

const loading = ref(false)
const error = ref('')
const errors = reactive({ email: '', password: '' })
const showPassword = ref(false)

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validate() {
  errors.email = ''
  errors.password = ''
  let valid = true

  if (!form.email) {
    errors.email = 'Email is required'
    valid = false
  } else if (!validateEmail(form.email)) {
    errors.email = 'Please enter a valid email address'
    valid = false
  }

  if (!form.password) {
    errors.password = 'Password is required'
    valid = false
  } else if (form.password.length < 6) {
    errors.password = 'Password must be at least 6 characters'
    valid = false
  }

  return valid
}

async function onSubmit() {
  if (!validate()) return
  loading.value = true
  error.value = ''
  try {
    const api = useApi()
    const data = await api.request<{ token: string; user: any }>('/auth/sign-in/email', {
      method: 'POST',
      body: JSON.stringify({ email: form.email, password: form.password, rememberMe: form.remember }),
    })
    authStore.setAuth(data.user, data.token)
    router.push('/')
  } catch (e: any) {
    error.value = e.message || 'Invalid email or password'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div style="position:relative;min-height:100vh;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#f9fafb">
    <!-- Blobs -->
    <div style="position:absolute;top:-160px;right:-80px;width:384px;height:384px;border-radius:9999px;filter:blur(64px);background:linear-gradient(135deg,rgba(255,180,0,0.45),rgba(255,200,61,0.45))" />
    <div style="position:absolute;bottom:-80px;left:-160px;width:384px;height:384px;border-radius:9999px;filter:blur(64px);background:linear-gradient(45deg,rgba(255,180,0,0.45),rgba(255,200,61,0.45))" />
    <div style="position:absolute;top:10%;left:50%;transform:translateX(-50%);width:600px;height:600px;border-radius:9999px;filter:blur(64px);background:linear-gradient(135deg,rgba(255,180,0,0.25),transparent)" />

    <div style="position:relative;z-index:10;width:100%;max-width:448px;display:flex;flex-direction:column;gap:32px;padding:0 16px">
      <!-- Logo -->
      <div style="display:flex;flex-direction:column;align-items:center;gap:12px">
        <img src="https://www.figma.com/api/mcp/asset/167049a0-b755-4705-88c3-2229f73c2eb4" alt="LaCarte" style="height:54px;width:auto" />
        <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Admin Dashboard</p>
      </div>

      <!-- Card -->
      <div style="background:white;border:1px solid #ececec;border-radius:24px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.05),0 8px 10px -6px rgba(0,0,0,0.05);overflow:hidden">
        <div style="padding:32px;display:flex;flex-direction:column;gap:24px">
          <!-- Heading -->
          <div style="text-align:center;display:flex;flex-direction:column;gap:4px">
            <h2 style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Welcome Back</h2>
            <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Sign in to your account to continue</p>
          </div>

          <!-- Form -->
          <form style="display:flex;flex-direction:column;gap:16px" @submit.prevent="onSubmit">
            <!-- Email -->
            <div style="display:flex;flex-direction:column;gap:8px">
              <label style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">Email Address</label>
              <div style="position:relative">
                <UIcon name="i-lucide-mail" style="position:absolute;left:16px;top:50%;transform:translateY(-50%);width:20px;height:20px;color:#6b7280" />
                <input
                  v-model="form.email"
                  type="email"
                  placeholder="admin@lacarte.com"
                  required
                  :style="`width:100%;height:48px;padding-left:48px;padding-right:12px;background:white;border:1px solid ${errors.email ? '#ef4444' : '#ececec'};border-radius:20px;font-size:14px;color:#111;outline:none;font-family:'Manrope',sans-serif;box-sizing:border-box`"
                  @focus="($event.target as HTMLElement).style.borderColor = errors.email ? '#ef4444' : '#ffb400'"
                  @blur="($event.target as HTMLElement).style.borderColor = errors.email ? '#ef4444' : '#ececec'"
                  @input="errors.email = ''"
                />
              </div>
              <p v-if="errors.email" style="font-size:12px;color:#ef4444;margin:0;font-family:'Manrope',sans-serif">{{ errors.email }}</p>
            </div>

            <!-- Password -->
            <div style="display:flex;flex-direction:column;gap:8px">
              <div style="display:flex;align-items:center;justify-content:space-between">
                <label style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">Password</label>
                <button type="button" style="font-size:12px;font-weight:500;color:#ffb400;background:none;border:none;cursor:pointer;font-family:'Manrope',sans-serif" @click="router.push('/forgot-password')">Forgot password?</button>
              </div>
              <div style="position:relative">
                <UIcon name="i-lucide-lock" style="position:absolute;left:16px;top:50%;transform:translateY(-50%);width:20px;height:20px;color:#6b7280" />
                <input
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Enter your password"
                  required
                  :style="`width:100%;height:48px;padding-left:48px;padding-right:48px;background:white;border:1px solid ${errors.password ? '#ef4444' : '#ececec'};border-radius:20px;font-size:14px;color:#111;outline:none;font-family:'Manrope',sans-serif;box-sizing:border-box`"
                  @focus="($event.target as HTMLElement).style.borderColor = errors.password ? '#ef4444' : '#ffb400'"
                  @blur="($event.target as HTMLElement).style.borderColor = errors.password ? '#ef4444' : '#ececec'"
                  @input="errors.password = ''"
                />
                <button
                  type="button"
                  style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;padding:4px;display:flex;align-items:center;justify-content:center"
                  @click="showPassword = !showPassword"
                >
                  <UIcon :name="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'" style="width:20px;height:20px;color:#6b7280" />
                </button>
              </div>
              <p v-if="errors.password" style="font-size:12px;color:#ef4444;margin:0;font-family:'Manrope',sans-serif">{{ errors.password }}</p>
            </div>

            <!-- Remember me -->
            <label style="display:flex;align-items:center;gap:10px;cursor:pointer">
              <input v-model="form.remember" type="checkbox" style="width:16px;height:16px;accent-color:#ffb400" />
              <span style="font-size:14px;font-weight:500;color:#6b7280;font-family:'Manrope',sans-serif">Keep me signed in</span>
            </label>

            <p v-if="error" style="font-size:14px;color:#ef4444;text-align:center;background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:10px 16px;font-family:'Manrope',sans-serif">{{ error }}</p>

            <!-- Submit -->
            <button
              type="submit"
              :disabled="loading"
              style="width:100%;height:48px;background:#ffb400;color:#0a0d12;font-size:14px;font-weight:500;border:none;border-radius:9999px;cursor:pointer;font-family:'Manrope',sans-serif;box-shadow:0 1px 3px rgba(255,180,0,0.2);transition:background 0.15s"
              @mouseover="($event.target as HTMLElement).style.background='#e6a200'"
              @mouseleave="($event.target as HTMLElement).style.background='#ffb400'"
            >
              {{ loading ? 'Signing in...' : 'Sign In' }}
            </button>
          </form>
        </div>

      </div>

      <p style="font-size:14px;color:#6b7280;text-align:center;font-family:'Manrope',sans-serif">© 2026 LaCarte Waste Management. All rights reserved.</p>
    </div>
  </div>
</template>
