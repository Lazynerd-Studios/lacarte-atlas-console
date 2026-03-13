<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

interface Customer { id: number; name: string; phone: string }
interface SmsLog {
  id: number
  recipients: string[]
  recipientType: string
  message: string
  sentAt: string
  status: 'successful' | 'failed'
  delivered: number
  total: number
}

const activeTab = ref<'compose' | 'history'>('compose')
const historyFilter = ref<'all' | 'successful' | 'failed'>('all')

const recipientType = ref<'all' | 'zone' | 'custom'>('all')
const selectedZone = ref('')
const message = ref('')
const sending = ref(false)
const sent = ref(false)

const zones = ['Zone A – Central', 'Zone B – Westside', 'Zone C – Eastside', 'Zone D – Northside', 'Zone E – Southside']

const allCustomers: Customer[] = [
  { id: 1,  name: 'Kwame Mensah',    phone: '+233201234567' },
  { id: 2,  name: 'Ama Owusu',       phone: '+233551234568' },
  { id: 3,  name: 'Kofi Asante',     phone: '+233241234569' },
  { id: 4,  name: 'Abena Boateng',   phone: '+233271234570' },
  { id: 5,  name: 'Yaw Darko',       phone: '+233201234571' },
  { id: 6,  name: 'Akosua Frimpong', phone: '+233551234572' },
  { id: 7,  name: 'Kojo Appiah',     phone: '+233241234573' },
  { id: 8,  name: 'Efua Mensah',     phone: '+233271234574' },
  { id: 9,  name: 'Nana Agyei',      phone: '+233201234575' },
  { id: 10, name: 'Adwoa Sarpong',   phone: '+233551234576' },
]

const customerSearch = ref('')
const selectedCustomers = ref<Customer[]>([])
const showDropdown = ref(false)

const filteredCustomers = computed(() =>
  allCustomers
    .filter(c => !selectedCustomers.value.find(s => s.id === c.id))
    .filter(c => {
      const q = customerSearch.value.toLowerCase().trim()
      return !q || c.name.toLowerCase().includes(q) || c.phone.includes(q)
    })
)

function addCustomer(c: Customer) {
  if (!selectedCustomers.value.find(s => s.id === c.id)) selectedCustomers.value.push(c)
  customerSearch.value = ''
  showDropdown.value = false
}

function removeCustomer(id: number) {
  selectedCustomers.value = selectedCustomers.value.filter(c => c.id !== id)
}

function hideDropdown() { window.setTimeout(() => { showDropdown.value = false }, 150) }

const manualNumber = ref('')
const manualError = ref('')

function addManualNumber() {
  const val = manualNumber.value.trim()
  if (!val) return
  if (!/^\+?[0-9\s\-()]{7,20}$/.test(val)) { manualError.value = 'Enter a valid phone number'; return }
  if (selectedCustomers.value.find(c => c.phone === val)) { manualError.value = 'Number already added'; return }
  selectedCustomers.value.push({ id: Date.now(), name: val, phone: val })
  manualNumber.value = ''
  manualError.value = ''
}

function onManualKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') { e.preventDefault(); addManualNumber() }
}

const charCount = computed(() => message.value.length)
const smsCount = computed(() => Math.ceil(charCount.value / 160) || 1)

const canSend = computed(() => {
  if (!message.value.trim()) return false
  if (recipientType.value === 'custom' && selectedCustomers.value.length === 0) return false
  if (recipientType.value === 'zone' && !selectedZone.value) return false
  return true
})

// History
const history = ref<SmsLog[]>([
  { id: 1, recipients: ['All Customers'], recipientType: 'all', message: 'Reminder: Your pickup is scheduled for tomorrow morning. Please have your bins ready by 7am.', sentAt: '2026-03-12 09:14', status: 'successful', delivered: 334, total: 334 },
  { id: 2, recipients: ['Zone A – Central'], recipientType: 'zone', message: 'Zone A pickup has been rescheduled to Friday. We apologize for the inconvenience.', sentAt: '2026-03-10 14:32', status: 'successful', delivered: 87, total: 87 },
  { id: 3, recipients: ['+233201234567', '+233551234568', '+233241234569'], recipientType: 'custom', message: 'Your account has been activated. Welcome to LaCarte!', sentAt: '2026-03-08 11:05', status: 'failed', delivered: 1, total: 3 },
  { id: 4, recipients: ['Zone C – Eastside'], recipientType: 'zone', message: 'New subscription plans are now available. Log in to upgrade your plan today.', sentAt: '2026-03-05 08:50', status: 'successful', delivered: 112, total: 112 },
  { id: 5, recipients: ['All Customers'], recipientType: 'all', message: 'Public holiday notice: No pickups on March 6th. Normal service resumes March 7th.', sentAt: '2026-03-04 16:00', status: 'failed', delivered: 289, total: 334 },
])

const filteredHistory = computed(() =>
  historyFilter.value === 'all' ? history.value : history.value.filter(h => h.status === historyFilter.value)
)

function recipientLabel(log: SmsLog) {
  if (log.recipientType === 'all') return 'All Customers'
  if (log.recipientType === 'zone') return log.recipients[0] ?? ''
  return `${log.recipients.length} custom number${log.recipients.length > 1 ? 's' : ''}`
}

async function sendSms() {
  if (!canSend.value) return
  sending.value = true
  await new Promise(r => window.setTimeout(r, 1200))
  sending.value = false
  sent.value = true

  // Add to history
  const recipientNames = recipientType.value === 'all'
    ? ['All Customers']
    : recipientType.value === 'zone'
      ? [selectedZone.value]
      : selectedCustomers.value.map(c => c.phone)

  history.value.unshift({
    id: Date.now(),
    recipients: recipientNames,
    recipientType: recipientType.value,
    message: message.value,
    sentAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    status: 'successful',
    delivered: recipientNames.length,
    total: recipientNames.length,
  })

  window.setTimeout(() => {
    sent.value = false
    message.value = ''
    selectedCustomers.value = []
    customerSearch.value = ''
    manualNumber.value = ''
    manualError.value = ''
  }, 3000)
}
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:28px;font-family:'Manrope',sans-serif;max-width:860px">

    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
      <div>
        <h1 style="font-size:32px;font-weight:700;color:#111;margin:0;line-height:1.3">Quick SMS</h1>
        <p style="font-size:14px;color:#6b7280;margin:8px 0 0">Send a bulk SMS to customers instantly</p>
      </div>
    </div>

    <!-- Tabs -->
    <div style="display:flex;gap:2px;background:#f3f4f6;border-radius:12px;padding:3px;width:fit-content">
      <button v-for="t in [{ val: 'compose', label: 'Compose', icon: 'lucide:send' }, { val: 'history', label: 'History', icon: 'lucide:clock' }]"
        :key="t.val" @click="activeTab = t.val as any"
        :style="`display:flex;align-items:center;gap:7px;padding:8px 20px;border:none;border-radius:10px;font-size:13px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer;transition:all 0.15s;${activeTab === t.val ? 'background:#fff;color:#1a1a1a;box-shadow:0 1px 3px rgba(0,0,0,0.1)' : 'background:transparent;color:#6b7280'}`">
        <Icon :name="t.icon" style="width:14px;height:14px" />
        {{ t.label }}
      </button>
    </div>

    <!-- Compose -->
    <div v-if="activeTab === 'compose'" style="background:white;border:1px solid #ececec;border-radius:16px;padding:28px;box-shadow:0 1px 3px rgba(0,0,0,0.06);display:flex;flex-direction:column;gap:22px;max-width:720px">

      <div>
        <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:10px">Recipients</label>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button v-for="opt in [{ val: 'all', label: 'All Customers' }, { val: 'zone', label: 'By Zone' }, { val: 'custom', label: 'Custom' }]"
            :key="opt.val" @click="recipientType = opt.val as any"
            :style="`padding:8px 18px;border-radius:10px;font-size:13px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer;border:1.5px solid ${recipientType === opt.val ? '#ffb400' : '#e5e7eb'};background:${recipientType === opt.val ? '#fff9e6' : '#fff'};color:${recipientType === opt.val ? '#111' : '#6b7280'}`">
            {{ opt.label }}
          </button>
        </div>
      </div>

      <div v-if="recipientType === 'zone'">
        <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:8px">Select Zone</label>
        <div style="position:relative;max-width:320px">
          <select v-model="selectedZone" style="width:100%;height:42px;padding:0 36px 0 12px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;color:#1a1a1a;outline:none;background:#fff;appearance:none;cursor:pointer">
            <option value="" disabled>Choose a zone…</option>
            <option v-for="z in zones" :key="z" :value="z">{{ z }}</option>
          </select>
          <Icon name="lucide:chevron-down" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);width:14px;height:14px;color:#6b7280;pointer-events:none" />
        </div>
      </div>

      <div v-if="recipientType === 'custom'">
        <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:8px">
          Search Customers
          <span style="font-weight:400;color:#9ca3af;margin-left:4px">{{ selectedCustomers.length }} selected</span>
        </label>
        <div v-if="selectedCustomers.length" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px">
          <div v-for="c in selectedCustomers" :key="c.id"
            style="display:flex;align-items:center;gap:6px;padding:4px 10px 4px 12px;background:#fff9e6;border:1.5px solid #ffb400;border-radius:20px">
            <span style="font-size:13px;font-weight:600;color:#111">{{ c.name }}</span>
            <span style="font-size:12px;color:#6b7280">{{ c.phone }}</span>
            <button @click="removeCustomer(c.id)"
              style="width:16px;height:16px;border:none;background:none;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;color:#9ca3af;margin-left:2px"
              @mouseover="($event.currentTarget as HTMLElement).style.color='#ef4444'"
              @mouseleave="($event.currentTarget as HTMLElement).style.color='#9ca3af'">
              <Icon name="lucide:x" style="width:12px;height:12px" />
            </button>
          </div>
        </div>
        <div style="position:relative">
          <div style="position:relative">
            <Icon name="lucide:search" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);width:15px;height:15px;color:#9ca3af;pointer-events:none" />
            <input v-model="customerSearch" type="text" placeholder="Search by name or phone…"
              @focus="showDropdown = true" @blur="hideDropdown()"
              style="width:100%;height:42px;padding:0 12px 0 36px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;color:#1a1a1a;outline:none;box-sizing:border-box" />
          </div>
          <div v-if="showDropdown && filteredCustomers.length"
            style="position:absolute;top:calc(100% + 4px);left:0;right:0;background:white;border:1.5px solid #e5e7eb;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.1);z-index:50;overflow:hidden;max-height:220px;overflow-y:auto">
            <div v-for="c in filteredCustomers" :key="c.id" @mousedown="addCustomer(c)"
              style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;cursor:pointer"
              @mouseover="($event.currentTarget as HTMLElement).style.background='#f9fafb'"
              @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'">
              <div style="display:flex;align-items:center;gap:10px">
                <div style="width:32px;height:32px;border-radius:50%;background:#fff9e6;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  <span style="font-size:13px;font-weight:700;color:#ffb400">{{ c.name.charAt(0) }}</span>
                </div>
                <div>
                  <p style="font-size:14px;font-weight:600;color:#111;margin:0">{{ c.name }}</p>
                  <p style="font-size:12px;color:#6b7280;margin:0">{{ c.phone }}</p>
                </div>
              </div>
              <Icon name="lucide:plus" style="width:15px;height:15px;color:#9ca3af" />
            </div>
          </div>
          <p v-if="showDropdown && customerSearch && !filteredCustomers.length"
            style="position:absolute;top:calc(100% + 4px);left:0;right:0;background:white;border:1.5px solid #e5e7eb;border-radius:12px;padding:14px;text-align:center;font-size:13px;color:#9ca3af;z-index:50">
            No customers found
          </p>
        </div>
        <div style="margin-top:14px">
          <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:8px">Or add a custom number</label>
          <div style="display:flex;gap:8px">
            <input v-model="manualNumber" type="text" placeholder="+233201234567" @keydown="onManualKeydown"
              style="flex:1;height:42px;padding:0 12px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;color:#1a1a1a;outline:none;box-sizing:border-box" />
            <button @click="addManualNumber"
              style="height:42px;padding:0 18px;border:none;border-radius:10px;font-size:13px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer;background:#f3f4f6;color:#374151;display:flex;align-items:center;gap:6px;white-space:nowrap"
              @mouseover="($event.currentTarget as HTMLElement).style.background='#e5e7eb'"
              @mouseleave="($event.currentTarget as HTMLElement).style.background='#f3f4f6'">
              <Icon name="lucide:plus" style="width:14px;height:14px" /> Add
            </button>
          </div>
          <p v-if="manualError" style="font-size:12px;color:#ef4444;margin:6px 0 0">{{ manualError }}</p>
        </div>
      </div>

      <div>
        <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:8px">Message</label>
        <textarea v-model="message" rows="5" maxlength="640" placeholder="Type your message here…"
          style="width:100%;padding:10px 12px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Manrope',sans-serif;color:#1a1a1a;outline:none;resize:vertical;box-sizing:border-box" />
        <div style="display:flex;justify-content:space-between;margin-top:6px">
          <span style="font-size:12px;color:#9ca3af">{{ charCount }}/640 characters</span>
          <span style="font-size:12px;color:#9ca3af">{{ smsCount }} SMS credit{{ smsCount > 1 ? 's' : '' }}</span>
        </div>
      </div>

      <div style="display:flex;align-items:center;gap:12px">
        <button @click="sendSms" :disabled="sending || !canSend"
          :style="`height:42px;padding:0 28px;border:none;border-radius:10px;font-size:14px;font-weight:600;font-family:'Manrope',sans-serif;cursor:${sending || !canSend ? 'not-allowed' : 'pointer'};background:${sending || !canSend ? '#f3f4f6' : '#ffb400'};color:${sending || !canSend ? '#9ca3af' : '#111'};display:flex;align-items:center;gap:8px`">
          <Icon v-if="sending" name="lucide:loader-2" style="width:16px;height:16px;animation:spin 1s linear infinite" />
          <Icon v-else name="lucide:send" style="width:16px;height:16px" />
          {{ sending ? 'Sending…' : 'Send SMS' }}
        </button>
        <div v-if="sent" style="display:flex;align-items:center;gap:6px;color:#22c55e;font-size:13px;font-weight:600">
          <Icon name="lucide:check-circle" style="width:16px;height:16px" />
          SMS sent successfully
        </div>
      </div>
    </div>

    <!-- History -->
    <div v-if="activeTab === 'history'" style="display:flex;flex-direction:column;gap:16px">

      <!-- Filter + stats row -->
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div style="display:flex;gap:8px">
          <button v-for="f in [{ val: 'all', label: 'All' }, { val: 'successful', label: 'Successful' }, { val: 'failed', label: 'Failed' }]"
            :key="f.val" @click="historyFilter = f.val as any"
            :style="`padding:7px 16px;border-radius:10px;font-size:13px;font-weight:600;font-family:'Manrope',sans-serif;cursor:pointer;border:1.5px solid ${historyFilter === f.val ? '#ffb400' : '#e5e7eb'};background:${historyFilter === f.val ? '#fff9e6' : '#fff'};color:${historyFilter === f.val ? '#111' : '#6b7280'}`">
            {{ f.label }}
            <span :style="`margin-left:6px;padding:1px 7px;border-radius:20px;font-size:11px;background:${historyFilter === f.val ? '#ffb400' : '#f3f4f6'};color:${historyFilter === f.val ? '#111' : '#6b7280'}`">
              {{ f.val === 'all' ? history.length : history.filter(h => h.status === f.val).length }}
            </span>
          </button>
        </div>
      </div>

      <!-- Log list -->
      <div style="background:white;border:1px solid #ececec;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
        <div v-if="filteredHistory.length === 0" style="padding:48px;text-align:center;color:#9ca3af;font-size:14px">
          No messages found
        </div>
        <div v-for="(log, i) in filteredHistory" :key="log.id"
          :style="`padding:18px 24px;${i < filteredHistory.length - 1 ? 'border-bottom:1px solid #f0f0f0' : ''}`">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap">
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;flex-wrap:wrap">
                <!-- Status badge -->
                <span :style="`display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;${log.status === 'successful' ? 'background:#f0fdf4;color:#16a34a' : 'background:#fef2f2;color:#ef4444'}`">
                  <Icon :name="log.status === 'successful' ? 'lucide:check-circle' : 'lucide:alert-circle'" style="width:12px;height:12px" />
                  {{ log.status === 'successful' ? 'Successful' : 'Failed' }}
                </span>
                <!-- Recipient -->
                <span style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;background:#f3f4f6;color:#374151">
                  <Icon name="lucide:users" style="width:12px;height:12px" />
                  {{ recipientLabel(log) }}
                </span>
                <!-- Delivery count -->
                <span style="font-size:12px;color:#9ca3af">{{ log.delivered }}/{{ log.total }} delivered</span>
              </div>
              <p style="font-size:14px;color:#374151;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:520px">{{ log.message }}</p>
            </div>
            <div style="text-align:right;flex-shrink:0">
              <p style="font-size:12px;color:#9ca3af;margin:0">{{ log.sentAt }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
