<script setup lang="ts">
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', data: Record<string, unknown>): void
}>()

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  street: '',
  city: '',
  postalCode: '',
  userType: 'regular',
  entityName: '',
  plan: 'subscription',
  subscriptionInterval: 'monthly',
  subscriptionType: 'prepaid',
  instructions: '',
  sendWelcome: true,
})

const bins = ref<{ type: string; capacity: string }[]>([{ type: '', capacity: '' }])

function addBin() {
  bins.value.push({ type: '', capacity: '' })
}
function removeBin(i: number) {
  bins.value.splice(i, 1)
}

const errors = reactive<Record<string, string>>({})

function validate() {
  Object.keys(errors).forEach(k => delete errors[k])
  if (!form.firstName.trim())  errors.firstName = 'Required'
  if (!form.lastName.trim())   errors.lastName = 'Required'
  if (!form.email.trim())      errors.email = 'Required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Invalid email'
  if (!form.phone.trim())      errors.phone = 'Required'
  if (!form.password)          errors.password = 'Required'
  else if (form.password.length < 6) errors.password = 'Min 6 characters'
  if (form.confirmPassword !== form.password) errors.confirmPassword = 'Passwords do not match'
  if (!form.street.trim())     errors.street = 'Required'
  if (!form.city.trim())       errors.city = 'Required'
  return Object.keys(errors).length === 0
}

function submit() {
  if (!validate()) return
  emit('submit', { ...form, bins: bins.value.filter(b => b.type.trim()) })
}

const chevronBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`

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
  <!-- Backdrop -->
  <div
    style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:50;display:flex;align-items:center;justify-content:center;padding:24px"
    @click.self="emit('close')"
  >
    <!-- Modal -->
    <div style="background:white;border:1px solid #e5e7eb;border-radius:16px;width:510px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 10px 15px rgba(0,0,0,0.1),0 4px 6px rgba(0,0,0,0.1);position:relative">

      <!-- Header -->
      <div style="padding:24px 24px 16px;flex-shrink:0;border-bottom:1px solid #e5e7eb">
        <p style="font-size:20px;font-weight:600;color:#1a1a1a;font-family:'Manrope',sans-serif">Add New Customer</p>
      </div>

      <!-- Close button -->
      <button
        style="position:absolute;top:16px;right:16px;width:28px;height:28px;border:none;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:8px;opacity:0.7"
        @click="emit('close')"
        @mouseover="($event.currentTarget as HTMLElement).style.background='#f3f4f6'"
        @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
      >
        <UIcon name="i-lucide-x" style="width:16px;height:16px;color:#111" />
      </button>

      <!-- Scrollable body -->
      <div style="flex:1;overflow-y:auto;padding:24px;display:flex;flex-direction:column;gap:16px">

        <!-- First / Last name -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">First Name</label>
            <input v-model="form.firstName" type="text" placeholder="John" :style="inputStyle('firstName')"
              @focus="onFocus($event, 'firstName')" @blur="onBlur($event, 'firstName')" />
            <span v-if="errors.firstName" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ errors.firstName }}</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Last Name</label>
            <input v-model="form.lastName" type="text" placeholder="Doe" :style="inputStyle('lastName')"
              @focus="onFocus($event, 'lastName')" @blur="onBlur($event, 'lastName')" />
            <span v-if="errors.lastName" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ errors.lastName }}</span>
          </div>
        </div>

        <!-- Email -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Email</label>
          <input v-model="form.email" type="email" placeholder="john.doe@email.com" :style="inputStyle('email')"
            @focus="onFocus($event, 'email')" @blur="onBlur($event, 'email')" />
          <span v-if="errors.email" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ errors.email }}</span>
        </div>

        <!-- Phone -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Phone</label>
          <input v-model="form.phone" type="tel" placeholder="(555) 000-0000" :style="inputStyle('phone')"
            @focus="onFocus($event, 'phone')" @blur="onBlur($event, 'phone')" />
          <span v-if="errors.phone" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ errors.phone }}</span>
        </div>

        <!-- User Type -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">User Type</label>
          <select
            v-model="form.userType"
            :style="`width:100%;height:42px;padding:0 16px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;cursor:pointer;appearance:none;background-image:${chevronBg};background-repeat:no-repeat;background-position:right 12px center;box-sizing:border-box`"
          >
            <option value="regular">Regular</option>
            <option value="commercial">Commercial</option>
            <option value="estate">Estate</option>
            <option value="industrial">Industrial</option>
          </select>
        </div>

        <!-- Entity Name (non-regular types only) -->
        <div v-if="form.userType !== 'regular'" style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Entity Name</label>
          <input v-model="form.entityName" type="text" placeholder="Company / Estate / Organisation name" :style="inputStyle('entityName')"
            @focus="onFocus($event, 'entityName')" @blur="onBlur($event, 'entityName')" />
        </div>

        <!-- Portal access section -->
        <div style="background:#f9fafb;border:1px solid #ececec;border-radius:20px;padding:16px;display:flex;flex-direction:column;gap:12px">
          <div style="display:flex;align-items:center;gap:8px">
            <UIcon name="i-lucide-lock" style="width:16px;height:16px;color:#111;flex-shrink:0" />
            <p style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">Customer Portal Access</p>
          </div>
          <p style="font-size:12px;color:#6b7280;font-family:'Manrope',sans-serif;line-height:1.5">
            Set an initial password for the customer to access their portal. They can change this after their first login.
          </p>

          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Initial Password</label>
            <input v-model="form.password" type="password" placeholder="Create a temporary password" :style="inputStyle('password')"
              @focus="onFocus($event, 'password')" @blur="onBlur($event, 'password')" />
            <span v-if="errors.password" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ errors.password }}</span>
          </div>

          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Confirm Password</label>
            <input v-model="form.confirmPassword" type="password" placeholder="Confirm password" :style="inputStyle('confirmPassword')"
              @focus="onFocus($event, 'confirmPassword')" @blur="onBlur($event, 'confirmPassword')" />
            <span v-if="errors.confirmPassword" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ errors.confirmPassword }}</span>
          </div>

          <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <input v-model="form.sendWelcome" type="checkbox" style="width:16px;height:16px;accent-color:#ffb400;cursor:pointer" />
            <span style="font-size:12px;font-weight:500;color:#6b7280;font-family:'Manrope',sans-serif">Send welcome email with login credentials to customer</span>
          </label>
        </div>

        <!-- Street address -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Street Address</label>
          <input v-model="form.street" type="text" placeholder="123 Main Street" :style="inputStyle('street')"
            @focus="onFocus($event, 'street')" @blur="onBlur($event, 'street')" />
          <span v-if="errors.street" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ errors.street }}</span>
        </div>

        <!-- City / Postal -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">City</label>
            <input v-model="form.city" type="text" placeholder="Downtown" :style="inputStyle('city')"
              @focus="onFocus($event, 'city')" @blur="onBlur($event, 'city')" />
            <span v-if="errors.city" style="font-size:12px;color:#ef4444;font-family:'Manrope',sans-serif">{{ errors.city }}</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Postal Code</label>
            <input v-model="form.postalCode" type="text" placeholder="12345" :style="inputStyle('postalCode')"
              @focus="onFocus($event, 'postalCode')" @blur="onBlur($event, 'postalCode')" />
          </div>
        </div>

        <!-- Plan type -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Plan Type</label>
          <select
            v-model="form.plan"
            :style="`width:100%;height:42px;padding:0 16px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;cursor:pointer;appearance:none;background-image:${chevronBg};background-repeat:no-repeat;background-position:right 12px center;box-sizing:border-box`"
          >
            <option value="subscription">Subscription</option>
            <option value="pay-as-you-go">Pay-as-you-go</option>
          </select>
        </div>

        <!-- Subscription Interval (only when plan = subscription) -->
        <div v-if="form.plan === 'subscription'" style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Subscription Interval</label>
          <select
            v-model="form.subscriptionInterval"
            :style="`width:100%;height:42px;padding:0 16px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;cursor:pointer;appearance:none;background-image:${chevronBg};background-repeat:no-repeat;background-position:right 12px center;box-sizing:border-box`"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        <!-- Subscription Type -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Subscription Type</label>
          <select
            v-model="form.subscriptionType"
            :style="`width:100%;height:42px;padding:0 16px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;cursor:pointer;appearance:none;background-image:${chevronBg};background-repeat:no-repeat;background-position:right 12px center;box-sizing:border-box`"
          >
            <option value="prepaid">Prepaid</option>
            <option value="postpaid">Postpaid</option>
          </select>
        </div>

        <!-- BINs -->
        <div style="display:flex;flex-direction:column;gap:10px">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <label style="font-size:14px;font-weight:500;color:#1a1a1a;font-family:'Manrope',sans-serif">Assigned BINs</label>
            <button
              type="button"
              style="height:30px;padding:0 12px;background:#ffb400;border:none;border-radius:20px;font-size:13px;font-weight:500;color:#0a0d12;font-family:'Manrope',sans-serif;cursor:pointer;display:flex;align-items:center;gap:6px"
              @click="addBin"
            >
              <UIcon name="i-lucide-plus" style="width:13px;height:13px;color:#0a0d12" />
              Add BIN
            </button>
          </div>
          <div v-for="(bin, i) in bins" :key="i" style="display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:center">
            <input
              v-model="bin.type"
              type="text"
              placeholder="BIN type (e.g. Standard)"
              :style="inputStyle('')"
              @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
              @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
            />
            <input
              v-model="bin.capacity"
              type="text"
              placeholder="Capacity (e.g. 120L)"
              :style="inputStyle('')"
              @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
              @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
            />
            <button
              type="button"
              style="width:32px;height:32px;border:none;background:#f3f4f6;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0"
              :style="bins.length === 1 ? 'opacity:0.3;cursor:not-allowed' : ''"
              :disabled="bins.length === 1"
              @click="removeBin(i)"
              @mouseover="($event.currentTarget as HTMLElement).style.background='#fee2e2'"
              @mouseleave="($event.currentTarget as HTMLElement).style.background='#f3f4f6'"
            >
              <UIcon name="i-lucide-x" style="width:13px;height:13px;color:#ef4444" />
            </button>
          </div>
        </div>

        <!-- Special instructions -->
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:14px;font-weight:500;color:#111;font-family:'Manrope',sans-serif">Special Instructions</label>
          <textarea
            v-model="form.instructions"
            placeholder="Any special pickup instructions..."
            rows="4"
            style="width:100%;padding:8px 12px;background:white;border:1px solid #e5e7eb;border-radius:16px;font-size:14px;color:#1a1a1a;font-family:'Manrope',sans-serif;outline:none;resize:none;box-sizing:border-box;line-height:1.5"
            @focus="($event.target as HTMLElement).style.borderColor='#ffb400'"
            @blur="($event.target as HTMLElement).style.borderColor='#e5e7eb'"
          />
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
        >Add Customer</button>
      </div>
    </div>
  </div>
</template>
