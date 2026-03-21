<script setup lang="ts">
definePageMeta({ layout: false })

const router = useRouter()

const email = ref('')
const emailError = ref('')
const loading = ref(false)
const submitted = ref(false)
const error = ref('')

function validateEmail(val: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
}

async function onSubmit() {
  emailError.value = ''
  error.value = ''

  if (!email.value) {
    emailError.value = 'Email is required'
    return
  } else if (!validateEmail(email.value)) {
    emailError.value = 'Please enter a valid email address'
    return
  }

  loading.value = true
  try {
    const api = useApi()
    await api.post('/auth/forgot-password', { email: email.value })
    submitted.value = true
  } catch (e: any) {
    error.value = e.message || 'Something went wrong. Please try again.'
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

          <!-- Success state -->
          <template v-if="submitted">
            <div style="display:flex;flex-direction:column;align-items:center;gap:16px;text-align:center">
              <div style="width:56px;height:56px;border-radius:9999px;background:#fff9e6;display:flex;align-items:center;justify-content:center">
                <UIcon name="i-lucide-mail-check" style="width:28px;height:28px;color:#ffb400" />
              </div>
              <div style="display:flex;flex-direction:column;gap:6px">
                <h2 style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Check your email</h2>
                <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">
                  We sent a password reset link to<br />
                  <span style="font-weight:500;color:#111">{{ email }}</span>
                </p>
              </div>
              <button
                type="button"
                style="width:100%;height:48px;background:#ffb400;color:#0a0d12;font-size:14px;font-weight:500;border:none;border-radius:9999px;cursor:pointer;font-family:'Manrope',sans-serif;box-shadow:0 1px 3px rgba(255,180,0,0.2);transition:background 0.15s"
                @click="router.push('/login')"
                @mouseover="($event.target as HTMLElement).style.background='#e6a200'"
                @mouseleave="($event.target as HTMLElement).style.background='#ffb400'"
              >
                Back to Sign In
              </button>
            </div>
          </template>

          <!-- Form state -->
          <template v-else>
            <div style="text-align:center;display:flex;flex-direction:column;gap:4px">
              <h2 style="font-size:20px;font-weight:600;color:#111;font-family:'Manrope',sans-serif">Forgot Password</h2>
              <p style="font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif">Enter your email and we'll send you a reset link</p>
            </div>

            <form style="display:flex;flex-direction:column;gap:16px" @submit.prevent="onSubmit">
              <div style="display:flex;flex-direction:column;gap:8px">
                <label style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">Email Address</label>
                <div style="position:relative">
                  <UIcon name="i-lucide-mail" style="position:absolute;left:16px;top:50%;transform:translateY(-50%);width:20px;height:20px;color:#6b7280" />
                  <input
                    v-model="email"
                    type="email"
                    placeholder="admin@lacarte.com"
                    :style="`width:100%;height:48px;padding-left:48px;padding-right:12px;background:white;border:1px solid ${emailError ? '#ef4444' : '#ececec'};border-radius:20px;font-size:14px;color:#111;outline:none;font-family:'Manrope',sans-serif;box-sizing:border-box`"
                    @focus="($event.target as HTMLElement).style.borderColor = emailError ? '#ef4444' : '#ffb400'"
                    @blur="($event.target as HTMLElement).style.borderColor = emailError ? '#ef4444' : '#ececec'"
                    @input="emailError = ''"
                  />
                </div>
                <p v-if="emailError" style="font-size:12px;color:#ef4444;margin:0;font-family:'Manrope',sans-serif">{{ emailError }}</p>
              </div>

              <p v-if="error" style="font-size:14px;color:#ef4444;text-align:center;background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:10px 16px;font-family:'Manrope',sans-serif">{{ error }}</p>

              <button
                type="submit"
                :disabled="loading"
                style="width:100%;height:48px;background:#ffb400;color:#0a0d12;font-size:14px;font-weight:500;border:none;border-radius:9999px;cursor:pointer;font-family:'Manrope',sans-serif;box-shadow:0 1px 3px rgba(255,180,0,0.2);transition:background 0.15s"
                @mouseover="($event.target as HTMLElement).style.background='#e6a200'"
                @mouseleave="($event.target as HTMLElement).style.background='#ffb400'"
              >
                {{ loading ? 'Sending...' : 'Send Reset Link' }}
              </button>

              <button
                type="button"
                style="display:flex;align-items:center;justify-content:center;gap:6px;width:100%;height:40px;background:none;border:none;cursor:pointer;font-size:14px;color:#6b7280;font-family:'Manrope',sans-serif"
                @click="router.push('/login')"
              >
                <UIcon name="i-lucide-arrow-left" style="width:16px;height:16px" />
                Back to Sign In
              </button>
            </form>
          </template>

        </div>
      </div>

      <p style="font-size:14px;color:#6b7280;text-align:center;font-family:'Manrope',sans-serif">© 2026 LaCarte Waste Management. All rights reserved.</p>
    </div>
  </div>
</template>
